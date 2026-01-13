import { useAuthStore } from '@/stores/auth'
import { awsConfig, getFrontendIdentifier } from '@/config/aws-config'
import { useWebSocket } from './useWebSocket'

export function useAgent() {
  const authStore = useAuthStore()
  const {
    connect,
    registerJobHandler,
    unregisterJobHandler,
    connectionId,
    setConnectionId,
    messageHandlers,
    isConnected,
  } = useWebSocket()

  /**
   * Poll job status from GET /jobs/{jobId} endpoint
   * Used as fallback when WebSocket connection is lost
   */
  const pollJobStatus = async (jobId, onChunk = null, onStatus = null) => {
    if (!awsConfig.jobsApiGatewayUrl) {
      throw new Error(
        'Jobs API Gateway URL is not configured. Please set VITE_JOBS_API_GATEWAY_URL in your .env file',
      )
    }

    const accessToken = await authStore.getAccessToken()
    const jobsBaseUrl = awsConfig.jobsApiGatewayUrl.replace(/\/$/, '') // Remove trailing slash
    const pollUrl = `${jobsBaseUrl}/${jobId}`

    try {
      const response = await fetch(pollUrl, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        if (response.status === 404) {
          return { status: 'NOT_FOUND', result: null, error: null }
        }
        const errorText = await response.text().catch(() => '')
        throw new Error(
          `Failed to poll job status: ${response.status} - ${errorText || response.statusText}`,
        )
      }

      const data = await response.json()
      return {
        status: data.status,
        result: data.result,
        error: data.error,
        sessionId: data.sessionId,
      }
    } catch (error) {
      console.error(`Error polling job ${jobId}:`, error)
      throw error
    }
  }

  /**
   * Submit a long-running job via POST /jobs
   * Returns immediately with jobId, updates come via WebSocket with polling fallback
   */
  const submitJob = async (
    prompt,
    sessionId = null,
    onChunk = null,
    onStatus = null,
    outputMode = null,
    outputSchemaName = null,
  ) => {
    if (!awsConfig.jobsApiGatewayUrl) {
      throw new Error(
        'Jobs API Gateway URL is not configured. Please set VITE_JOBS_API_GATEWAY_URL in your .env file',
      )
    }

    const accessToken = await authStore.getAccessToken()

    // Try to connect WebSocket, but don't fail if it doesn't work - we'll use polling fallback
    // Note: We'll check isConnected.value inside the Promise to get the current state
    try {
      await connect(sessionId)
      console.log('WebSocket connected for job updates')
    } catch (error) {
      console.warn('Failed to connect WebSocket, will use polling fallback:', error)
    }

    // Determine frontend identifier for OAuth redirects
    const frontendIdentifier = getFrontendIdentifier()

    // Submit job first to get jobId, then register handlers immediately
    const payload = {
      prompt,
      sessionId,
      frontendIdentifier, // Include frontend identifier for OAuth redirects
      // Note: connectionId will be looked up by sessionId on the backend
      // if not provided here
    }

    // Add optional outputMode and outputSchemaName if provided
    if (outputMode !== null && outputMode !== undefined) {
      payload.outputMode = outputMode
    }
    if (outputSchemaName !== null && outputSchemaName !== undefined) {
      payload.outputSchemaName = outputSchemaName
    }

    const response = await fetch(awsConfig.jobsApiGatewayUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const errorText = await response.text().catch(() => '')
      throw new Error(
        `Failed to submit job: ${response.status} - ${errorText || response.statusText}`,
      )
    }

    const data = await response.json()
    const jobId = data.jobId
    const returnedSessionId = data.sessionId || sessionId

    console.log('Job submitted:', {
      jobId,
      sessionId: returnedSessionId,
      websocketConnected: isConnected.value,
    })

    // NOW create Promise and register handlers IMMEDIATELY after getting jobId
    // This minimizes the window where messages can arrive before handlers are registered
    return new Promise((resolve, reject) => {
      // Register handlers for this job INSIDE the promise so resolve/reject are in scope
      // This is critical - messages might arrive immediately after job submission
      let accumulatedResponse = ''
      let jobComplete = false
      let lastPolledStatus = 'PENDING'
      let pollingInterval = null
      let websocketReceivedUpdate = false

      // Create handlers object that captures resolve/reject from Promise scope
      const jobHandlers = {
        onStructured: (data) => {
          // Handle structured response: data is already parsed as an object
          websocketReceivedUpdate = true
          // Format the structured data as JSON string for display
          const jsonString = JSON.stringify(data, null, 2)
          accumulatedResponse = jsonString // Replace accumulated response with structured JSON

          if (onChunk) {
            // Pass the formatted JSON string to the chunk handler
            onChunk(jsonString, returnedSessionId || sessionId)
          }
        },
        onChunk: (chunk) => {
          websocketReceivedUpdate = true
          // Simply concatenate chunks as received - spacing should be handled by the backend
          // Debug: log chunks that might contain URL patterns to identify spacing issues
          if (chunk.includes('google') || chunk.includes('http') || chunk.includes('.com')) {
            console.log('DEBUG useAgent chunk with URL pattern:', JSON.stringify(chunk))
            console.log(
              'DEBUG useAgent accumulated before:',
              JSON.stringify(accumulatedResponse.slice(-50)),
            )
          }
          accumulatedResponse += chunk

          // Event-driven approach: Don't use timeouts to detect completion.
          // We wait for the COMPLETED status message event from the backend.
          // The backend sends COMPLETED status immediately when the stream ends.
          // No timeout-based polling - purely event-driven.

          if (onChunk) {
            onChunk(chunk, returnedSessionId || sessionId)
          }
        },
        onStatus: (status, message, jobIdFromStatus = null, details = null) => {
          websocketReceivedUpdate = true
          lastPolledStatus = status
          console.log(`Job ${jobId} status: ${status} - ${message}`)

          // Pass jobId to onStatus callback so frontend can track it
          const statusJobId = jobIdFromStatus || jobId

          // If status is COMPLETED, treat as completion
          // (Backend sends COMPLETED status when chunks are done, not a result message)
          if (status === 'COMPLETED' && !jobComplete) {
            // Deliver final status (with tokens/cost/modelId) to UI before resolving
            try {
              if (onStatus) {
                onStatus(status, message, statusJobId, details)
              }
            } catch (err) {
              console.error(`Error delivering COMPLETED status to UI for job ${jobId}:`, err)
            }
            if (accumulatedResponse.length > 0) {
              console.log(
                `Job ${jobId} completed via COMPLETED status message (chunks were received)`,
              )
            } else {
              console.log(
                `Job ${jobId} completed via COMPLETED status message (no chunks received yet, will use polling or result message)`,
              )
            }
            jobComplete = true
            if (pollingInterval) {
              clearInterval(pollingInterval)
              pollingInterval = null
            }
            // Unregister handler since job is complete
            if (isConnected.value) {
              unregisterJobHandler(jobId)
            }
            // Use accumulatedResponse (may be empty if no chunks received)
            const finalResponseToUse = accumulatedResponse
            console.log(
              `Job ${jobId} completion via status: accumulatedResponse length=${finalResponseToUse.length}`,
            )
            if (typeof resolve === 'function') {
              resolve({
                response: finalResponseToUse,
                sessionId: returnedSessionId || sessionId,
                jobId,
              })
            } else {
              console.error(`Job ${jobId}: resolve is not available in onStatus handler`)
            }
            return
          }

          if (onStatus) {
            onStatus(status, message, statusJobId, details)
          }
        },
        onComplete: (finalResponse) => {
          if (jobComplete) {
            console.log(`Job ${jobId} already completed, ignoring duplicate completion`)
            return
          }
          console.log(`Job ${jobId} completed via WebSocket result message`)
          jobComplete = true
          if (pollingInterval) {
            clearInterval(pollingInterval)
            pollingInterval = null
          }
          // Don't unregister here - handler is already deleted in useWebSocket.js when result message is received
          // unregisterJobHandler(jobId) would try to delete it again, causing "existed: false" log
          // Use accumulatedResponse if finalResponse is empty (streaming case where chunks were sent)
          const finalResponseToUse = finalResponse || accumulatedResponse
          console.log(
            `Job ${jobId} completion: finalResponse length=${finalResponse?.length || 0}, accumulatedResponse length=${accumulatedResponse.length}`,
          )
          // Ensure resolve is available (it should be from closure, but add safety check)
          if (typeof resolve === 'function') {
            resolve({
              response: finalResponseToUse,
              sessionId: returnedSessionId || sessionId,
              jobId,
            })
          } else {
            console.error(`Job ${jobId}: resolve is not available in onComplete handler`)
          }
        },
        onError: (errorMessage) => {
          if (jobComplete) {
            console.log(`Job ${jobId} already completed, ignoring error`)
            return
          }
          console.error(`Job ${jobId} error via WebSocket:`, errorMessage)
          
          // Check if this is a structured output error where content was received but wasn't valid JSON
          // In this case, we should wait for the result message instead of immediately rejecting
          const isStructuredOutputError = errorMessage && 
            errorMessage.includes('Structured output was requested') &&
            errorMessage.includes('no valid JSON was returned') &&
            errorMessage.includes('Received') &&
            errorMessage.includes('characters of content')
          
          if (isStructuredOutputError) {
            console.warn(
              `Job ${jobId}: Structured output error detected but content was received. ` +
              `Waiting for result message instead of rejecting immediately.`,
            )
            // Don't set jobComplete or unregister - wait for result message
            // The result message will contain the non-JSON content which we'll display anyway
            return
          }
          
          // For other errors, proceed with normal error handling
          jobComplete = true
          if (pollingInterval) {
            clearInterval(pollingInterval)
            pollingInterval = null
          }
          unregisterJobHandler(jobId)
          // Ensure reject is available (it should be from closure, but add safety check)
          if (typeof reject === 'function') {
            reject(new Error(errorMessage))
          } else {
            console.error(`Job ${jobId}: reject is not available in onError handler`)
          }
        },
      }

      // Register handlers IMMEDIATELY and SYNCHRONOUSLY after getting jobId
      // This must happen before any async operations to catch early messages
      console.log(`[submitJob] About to register handler for job ${jobId}`)
      console.log(
        `[submitJob] Current handler count before registration: ${messageHandlers.value.size}`,
      )
      console.log(
        `[submitJob] Current handler keys before registration: ${Array.from(messageHandlers.value.keys()).join(', ') || 'none'}`,
      )

      registerJobHandler(jobId, jobHandlers)

      console.log(
        `[submitJob] Registered WebSocket handler for job ${jobId} (WebSocket connected: ${isConnected.value})`,
      )
      console.log(
        `[submitJob] Handler registration complete, checking handler exists: ${messageHandlers.value.has(jobId)}`,
      )
      console.log(`[submitJob] Handler count after registration: ${messageHandlers.value.size}`)
      console.log(
        `[submitJob] Handler keys after registration: ${Array.from(messageHandlers.value.keys()).join(', ')}`,
      )

      // Verify handler is actually in the map
      const verifyHandler = messageHandlers.value.get(jobId)
      if (!verifyHandler) {
        console.error(
          `[submitJob] CRITICAL: Handler for job ${jobId} was not found immediately after registration!`,
        )
      } else {
        console.log(
          `[submitJob] Handler verification: Found handler with onComplete: ${!!verifyHandler.onComplete}`,
        )
      }

      // If WebSocket is not connected, try to connect it
      if (!isConnected.value) {
        console.log(`[submitJob] WebSocket not connected, attempting to connect for job ${jobId}`)
        connect(sessionId || returnedSessionId)
          .then(() => {
            console.log(`[submitJob] WebSocket connected after job submission`)
            console.log(
              `[submitJob] Handler still exists after connection: ${messageHandlers.value.has(jobId)}`,
            )
            console.log(`[submitJob] Handler count after connection: ${messageHandlers.value.size}`)
            console.log(
              `[submitJob] Handler keys after connection: ${Array.from(messageHandlers.value.keys()).join(', ')}`,
            )
          })
          .catch((err) => {
            console.warn(`[submitJob] Failed to connect WebSocket for job ${jobId}:`, err)
            // Continue anyway - polling fallback will handle it
          })
      }

      // Polling fallback: poll every 2 seconds if WebSocket is not connected or not receiving updates
      const startPolling = () => {
        if (pollingInterval) {
          return // Already polling
        }

        console.log(`Starting polling fallback for job ${jobId}`)
        pollingInterval = setInterval(async () => {
          if (jobComplete) {
            clearInterval(pollingInterval)
            return
          }

          try {
            const jobStatus = await pollJobStatus(jobId, onChunk, onStatus)

            if (jobStatus.status === 'COMPLETED') {
              jobComplete = true
              if (pollingInterval) {
                clearInterval(pollingInterval)
                pollingInterval = null
              }
              if (isConnected.value) {
                unregisterJobHandler(jobId)
              }

              const finalResponse = jobStatus.result || accumulatedResponse
              console.log(`Job ${jobId} completed via polling`)
              resolve({
                response: finalResponse,
                sessionId: jobStatus.sessionId || returnedSessionId || sessionId,
                jobId,
              })
            } else if (jobStatus.status === 'FAILED') {
              jobComplete = true
              if (pollingInterval) {
                clearInterval(pollingInterval)
                pollingInterval = null
              }
              if (isConnected.value) {
                unregisterJobHandler(jobId)
              }
              reject(new Error(jobStatus.error || 'Job failed'))
            } else if (jobStatus.status === 'RUNNING' && jobStatus.result) {
              // If we get a partial result, append it (though this shouldn't happen with polling)
              const newContent = jobStatus.result.substring(accumulatedResponse.length)
              if (newContent) {
                accumulatedResponse = jobStatus.result
                if (onChunk) {
                  onChunk(newContent, returnedSessionId || sessionId)
                }
              }
            }

            // Update status
            if (jobStatus.status !== lastPolledStatus) {
              lastPolledStatus = jobStatus.status
              if (onStatus) {
                onStatus(jobStatus.status, `Job is ${jobStatus.status.toLowerCase()}`, jobId)
              }
            }
          } catch (error) {
            console.error(`Error polling job ${jobId}:`, error)
            // Don't reject on polling errors, just log them
            // The job might still complete via WebSocket
          }
        }, 2000) // Poll every 2 seconds
      }

      // Start polling if WebSocket is not connected
      // If WebSocket is connected, we rely on event-driven updates (onChunk, onStatus, onComplete)
      // Polling will only start if WebSocket connection is lost (handled by WebSocket disconnect handler)
      if (!isConnected.value) {
        startPolling()
      }
      // Note: We removed the timeout-based fallback. If WebSocket is connected but not receiving updates,
      // the WebSocket's onclose handler will trigger and we can start polling then (event-driven).
    })
  }

  /**
   * Cancel a running job via DELETE /jobs/{jobId}
   */
  const cancelJob = async (jobId) => {
    if (!awsConfig.jobsApiGatewayUrl) {
      throw new Error(
        'Jobs API Gateway URL is not configured. Please set VITE_JOBS_API_GATEWAY_URL in your .env file',
      )
    }

    const accessToken = await authStore.getAccessToken()
    const jobsBaseUrl = awsConfig.jobsApiGatewayUrl.replace(/\/$/, '') // Remove trailing slash
    const cancelUrl = `${jobsBaseUrl}/${jobId}`

    try {
      const response = await fetch(cancelUrl, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const errorText = await response.text().catch(() => '')
        throw new Error(
          `Failed to cancel job: ${response.status} - ${errorText || response.statusText}`,
        )
      }

      const data = await response.json()
      console.log(`Job ${jobId} cancelled successfully:`, data)
      return data
    } catch (error) {
      console.error(`Error cancelling job ${jobId}:`, error)
      throw error
    }
  }

  return {
    submitJob,
    cancelJob,
  }
}
