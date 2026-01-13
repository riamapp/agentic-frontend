import { ref, onUnmounted } from 'vue'
import { awsConfig } from '@/config/aws-config'

export function useWebSocket() {
  const ws = ref(null)
  const isConnected = ref(false)
  const connectionId = ref(null)
  const messageHandlers = ref(new Map())
  const pendingMessages = ref(new Map()) // Store messages that arrive before handlers are registered (keyed by jobId)
  const reconnectAttempts = ref(0)
  const maxReconnectAttempts = 5
  const reconnectDelay = 1000 // Start with 1 second
  const connectingPromise = ref(null) // Track ongoing connection attempts
  const isIntentionallyClosing = ref(false) // Track if we're intentionally closing

  const connect = async (sessionId = null) => {
    // If already connected and open, return existing connection ID
    if (ws.value?.readyState === WebSocket.OPEN && isConnected.value) {
      return connectionId.value || 'connected'
    }

    // If already connecting, wait for that connection attempt
    if (connectingPromise.value) {
      return connectingPromise.value
    }

    // If connection is in CONNECTING state, wait for it to complete
    if (ws.value?.readyState === WebSocket.CONNECTING) {
      return new Promise((resolve, reject) => {
        const checkInterval = setInterval(() => {
          if (ws.value?.readyState === WebSocket.OPEN && isConnected.value) {
            clearInterval(checkInterval)
            resolve(connectionId.value || 'connected')
          } else if (ws.value?.readyState === WebSocket.CLOSED) {
            clearInterval(checkInterval)
            // Connection failed, try again
            connectingPromise.value = null
            connect(sessionId).then(resolve).catch(reject)
          }
        }, 100)

        // Timeout after 5 seconds
        setTimeout(() => {
          clearInterval(checkInterval)
          if (ws.value?.readyState !== WebSocket.OPEN) {
            connectingPromise.value = null
            reject(new Error('Connection timeout'))
          }
        }, 5000)
      })
    }

    // Close existing connection only if it's in a bad state (not connecting)
    if (ws.value && ws.value.readyState !== WebSocket.CONNECTING) {
      isIntentionallyClosing.value = true
      ws.value.close()
      ws.value = null
      isIntentionallyClosing.value = false
    }

    if (!awsConfig.websocketApiEndpoint) {
      throw new Error(
        'WebSocket API endpoint is not configured. Please set VITE_WEBSOCKET_API_ENDPOINT in your .env file',
      )
    }

    // Create a promise for this connection attempt
    const connectionPromise = new Promise((resolve, reject) => {
      const wsUrl = new URL(awsConfig.websocketApiEndpoint)
      if (sessionId) {
        wsUrl.searchParams.set('sessionId', sessionId)
      }

      console.log('Connecting to WebSocket:', wsUrl.toString())
      ws.value = new WebSocket(wsUrl.toString())

      // Set a connection timeout
      const connectionTimeout = setTimeout(() => {
        if (ws.value?.readyState !== WebSocket.OPEN) {
          console.error('WebSocket connection timeout')
          if (ws.value) {
            ws.value.close()
            ws.value = null
          }
          connectingPromise.value = null
          reject(new Error('WebSocket connection timeout'))
        }
      }, 10000) // 10 second timeout

      ws.value.onopen = () => {
        clearTimeout(connectionTimeout)
        isConnected.value = true
        reconnectAttempts.value = 0
        connectingPromise.value = null
        console.log('WebSocket connected')
        console.log(
          `[onopen] Handler count after connection: ${messageHandlers.value.size}`,
          Array.from(messageHandlers.value.keys()),
        )
        // Connection ID will be available after the $connect handler processes it
        // For now, we'll track it when we receive messages or store it separately
        // Resolve immediately - connection is established even without a connection message
        resolve(connectionId.value || 'connected')
      }

      ws.value.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data)
          console.log('WebSocket message received:', message.type, 'for job:', message.jobId)

          // Handle connection message (contains connectionId) - optional, connection is already established
          if (message.type === 'connection') {
            if (message.connectionId) {
              setConnectionId(message.connectionId)
              console.log('Connection ID received:', message.connectionId)
            }
            return
          }

          // Handle different message types
          if (message.type === 'structured') {
            // New structured message format: {type: "structured", data: {...}}
            // The data is already parsed, so we can use it directly
            const handler = messageHandlers.value.get(message.jobId)
            console.log(
              `WebSocket structured message for job ${message.jobId}, handler exists: ${!!handler}`,
            )
            if (handler?.onStructured) {
              // Call the structured handler with the parsed data object
              handler.onStructured(message.data)
            } else if (handler?.onChunk) {
              // Fallback: if no structured handler, format as JSON string for chunk handler
              const jsonString = JSON.stringify(message.data, null, 2)
              handler.onChunk(jsonString)
            } else {
              // Store message temporarily - handler will be registered soon
              if (!pendingMessages.value.has(message.jobId)) {
                pendingMessages.value.set(message.jobId, [])
              }
              pendingMessages.value.get(message.jobId).push(message)
              console.log(
                `[useWebSocket] Stored structured message for job ${message.jobId} (handler not yet registered, ${pendingMessages.value.get(message.jobId).length} pending)`,
              )
            }
          } else if (message.type === 'chunk') {
            const handler = messageHandlers.value.get(message.jobId)
            console.log(
              `WebSocket chunk message for job ${message.jobId}, handler exists: ${!!handler}`,
            )
            if (handler?.onChunk) {
              // Get raw content from message
              let chunkContent = message.content

              // Debug: log first few chunks to see raw format
              if (
                typeof chunkContent === 'string' &&
                (chunkContent.includes('data:') || chunkContent.startsWith('"'))
              ) {
                console.log('Raw chunk content:', JSON.stringify(chunkContent.substring(0, 100)))
              }

              // Ensure content is a string
              if (typeof chunkContent !== 'string') {
                chunkContent = String(chunkContent || '')
              }

              // Try to parse as JSON if it looks like a JSON string
              try {
                if (chunkContent.trim().startsWith('"') && chunkContent.trim().endsWith('"')) {
                  chunkContent = JSON.parse(chunkContent)
                }
              } catch (e) {
                // Not JSON, continue with original content
              }

              // Aggressively remove all "data: " patterns
              // The chunks might be in format: data: "text" or "data: \"text\""
              // First, try to extract text from data: "text" pattern
              if (chunkContent.match(/^data:\s*"/)) {
                // Format: data: "text" - extract the text part
                const match = chunkContent.match(/^data:\s*"([^"]*)"?/)
                if (match) {
                  chunkContent = match[1] || ''
                } else {
                  chunkContent = chunkContent.replace(/^data:\s*"?/, '')
                }
              } else {
                // Remove any data: patterns
                chunkContent = chunkContent.replace(/data:\s*"([^"]*)"/g, '$1')
                chunkContent = chunkContent.replace(/^"?data:\s*"?/g, '')
                chunkContent = chunkContent.replace(/data:\s*"?/g, '')
              }

              // Remove surrounding quotes if the entire chunk is quoted
              const trimmed = chunkContent.trim()
              if (
                (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
                (trimmed.startsWith("'") && trimmed.endsWith("'"))
              ) {
                chunkContent = trimmed.slice(1, -1)
              }

              // Unescape common escape sequences (order matters - do \\ first)
              chunkContent = chunkContent
                .replace(/\\\\/g, '\\')  // Replace \\ with \ first
                .replace(/\\n/g, '\n')
                .replace(/\\"/g, '"')    // Then replace \" with "
                .replace(/\\'/g, "'")
                .replace(/\\r/g, '\r')
                .replace(/\\t/g, '\t')

              handler.onChunk(chunkContent)
            } else {
              // Store message temporarily - handler will be registered soon
              if (!pendingMessages.value.has(message.jobId)) {
                pendingMessages.value.set(message.jobId, [])
              }
              pendingMessages.value.get(message.jobId).push(message)
              console.log(
                `[useWebSocket] Stored chunk message for job ${message.jobId} (handler not yet registered, ${pendingMessages.value.get(message.jobId).length} pending)`,
              )
            }
          } else if (message.type === 'result') {
            console.log(`[useWebSocket] Received result message for job ${message.jobId}`)
            console.log(`[useWebSocket] Current handler count: ${messageHandlers.value.size}`)
            console.log(
              `[useWebSocket] Handler keys: ${Array.from(messageHandlers.value.keys()).join(', ') || 'none'}`,
            )
            const handler = messageHandlers.value.get(message.jobId)
            console.log(
              `[useWebSocket] Handler lookup for job ${message.jobId}: ${!!handler ? 'FOUND' : 'NOT FOUND'}`,
            )
            if (handler?.onComplete) {
              try {
                // Delete handler BEFORE calling it to prevent duplicate result processing
                // But keep a reference to the handler function
                const handlerToCall = handler.onComplete
                const handlerExisted = messageHandlers.value.has(message.jobId)
                messageHandlers.value.delete(message.jobId)
                console.log(
                  `[useWebSocket] Deleted handler for job ${message.jobId} (existed: ${handlerExisted}), now calling onComplete`,
                )
                handlerToCall(message.body)
                console.log(
                  `[useWebSocket] onComplete handler called successfully for job ${message.jobId}`,
                )
              } catch (error) {
                console.error(
                  `[useWebSocket] Error in onComplete handler for job ${message.jobId}:`,
                  error,
                  error.stack,
                )
                // Handler already deleted, just log the error
                // Don't re-throw as it will break the WebSocket message processing
              }
            } else {
              // Store message temporarily - handler will be registered soon
              if (!pendingMessages.value.has(message.jobId)) {
                pendingMessages.value.set(message.jobId, [])
              }
              pendingMessages.value.get(message.jobId).push(message)
              console.log(
                `[useWebSocket] Stored result message for job ${message.jobId} (handler not yet registered, ${pendingMessages.value.get(message.jobId).length} pending)`,
              )
            }
          } else if (message.type === 'error') {
            const handler = messageHandlers.value.get(message.jobId)
            console.log(
              `WebSocket error message for job ${message.jobId}, handler exists: ${!!handler}`,
            )
            if (handler?.onError) {
              try {
                handler.onError(message.message)
              } catch (error) {
                console.error(`Error in onError handler for job ${message.jobId}:`, error)
              }
              // Check if this is a structured output error where content was received but wasn't valid JSON
              // In this case, we should NOT delete the handler yet - wait for the result message
              const isStructuredOutputError = message.message && 
                message.message.includes('Structured output was requested') &&
                message.message.includes('no valid JSON was returned') &&
                message.message.includes('Received') &&
                message.message.includes('characters of content')
              
              if (isStructuredOutputError) {
                console.log(
                  `[useWebSocket] Structured output error for job ${message.jobId} - ` +
                  `keeping handler alive to wait for result message`,
                )
                // Don't delete handler - wait for result message
              } else {
                // For other errors, delete handler immediately
                messageHandlers.value.delete(message.jobId)
              }
            } else {
              // Store message temporarily - handler will be registered soon
              if (!pendingMessages.value.has(message.jobId)) {
                pendingMessages.value.set(message.jobId, [])
              }
              pendingMessages.value.get(message.jobId).push(message)
              console.log(
                `[useWebSocket] Stored error message for job ${message.jobId} (handler not yet registered, ${pendingMessages.value.get(message.jobId).length} pending)`,
              )
            }
          } else if (message.type === 'status') {
            const handler = messageHandlers.value.get(message.jobId)
            console.log(
              `WebSocket status message for job ${message.jobId}:`,
              message.status,
              message.message,
            )
            if (handler?.onStatus) {
              // Pass jobId to onStatus callback so frontend can track it
              handler.onStatus(message.status, message.message, message.jobId, {
                tokens: message.tokens,
                cost: message.cost,
                modelId: message.modelId,
              })
            } else {
              // Store message temporarily - handler will be registered soon
              if (!pendingMessages.value.has(message.jobId)) {
                pendingMessages.value.set(message.jobId, [])
              }
              pendingMessages.value.get(message.jobId).push(message)
              console.log(
                `[useWebSocket] Stored status message for job ${message.jobId} (handler not yet registered, ${pendingMessages.value.get(message.jobId).length} pending)`,
              )
            }
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error, 'Raw data:', event.data)
        }
      }

      ws.value.onerror = (error) => {
        clearTimeout(connectionTimeout)
        console.error('WebSocket error:', error)
        isConnected.value = false
        connectingPromise.value = null
        // Don't reject immediately - let onclose handle reconnection
        // But if we're still in the connection phase, reject the promise
        if (ws.value?.readyState !== WebSocket.OPEN) {
          reject(error)
        }
      }

      ws.value.onclose = (event) => {
        clearTimeout(connectionTimeout)
        console.log(
          'WebSocket disconnected',
          event.code,
          event.reason,
          'intentional:',
          isIntentionallyClosing.value,
        )
        console.log(
          `[onclose] Handler count before close: ${messageHandlers.value.size}`,
          Array.from(messageHandlers.value.keys()),
        )
        isConnected.value = false
        connectionId.value = null
        connectingPromise.value = null
        // DON'T clear handlers on disconnect - they might still be needed if we reconnect
        // Only clear on intentional disconnect
        if (isIntentionallyClosing.value) {
          console.log(
            `[onclose] Intentional disconnect, clearing ${messageHandlers.value.size} handlers`,
          )
          messageHandlers.value.clear()
          pendingMessages.value.clear()
        } else {
          console.log(
            `[onclose] Unintentional disconnect, keeping ${messageHandlers.value.size} handlers for reconnection`,
          )
        }

        // Only attempt to reconnect if:
        // 1. Not a normal closure (code 1000)
        // 2. Not intentionally closed by us
        // 3. Haven't exceeded max reconnect attempts
        if (
          !isIntentionallyClosing.value &&
          event.code !== 1000 &&
          reconnectAttempts.value < maxReconnectAttempts
        ) {
          reconnectAttempts.value++
          const delay = reconnectDelay * Math.pow(2, reconnectAttempts.value - 1) // Exponential backoff
          console.log(
            `Attempting to reconnect in ${delay}ms (attempt ${reconnectAttempts.value}/${maxReconnectAttempts})`,
          )
          setTimeout(() => {
            // Only reconnect if we're not already connecting and not intentionally closing
            if (!connectingPromise.value && !isIntentionallyClosing.value) {
              connect(sessionId).catch((err) => {
                console.error('Reconnection failed:', err)
              })
            }
          }, delay)
        } else if (isIntentionallyClosing.value) {
          // Reset reconnect attempts if we intentionally closed
          reconnectAttempts.value = 0
        }
      }
    })

    // Store the promise so other calls can wait for it
    connectingPromise.value = connectionPromise
    return connectionPromise
  }

  const disconnect = () => {
    if (ws.value) {
      isIntentionallyClosing.value = true
      ws.value.close(1000, 'Client disconnecting')
      ws.value = null
      isConnected.value = false
      connectionId.value = null
      messageHandlers.value.clear()
      pendingMessages.value.clear()
      connectingPromise.value = null
      reconnectAttempts.value = 0
      isIntentionallyClosing.value = false
    }
  }

  const registerJobHandler = (jobId, handlers) => {
    if (!jobId) {
      console.error(`[registerJobHandler] ERROR: jobId is null/undefined!`)
      return
    }
    if (!handlers) {
      console.error(`[registerJobHandler] ERROR: handlers is null/undefined for job ${jobId}!`)
      return
    }
    console.log(`[registerJobHandler] Registering handler for job ${jobId}`)
    console.log(
      `[registerJobHandler] Handler has onComplete: ${!!handlers.onComplete}, onChunk: ${!!handlers.onChunk}, onStatus: ${!!handlers.onStatus}, onError: ${!!handlers.onError}`,
    )
    messageHandlers.value.set(jobId, handlers)
    const verify = messageHandlers.value.get(jobId)
    if (!verify) {
      console.error(
        `[registerJobHandler] CRITICAL: Handler was not stored! Map size: ${messageHandlers.value.size}`,
      )
    } else {
      console.log(`[registerJobHandler] Handler verified in map for job ${jobId}`)
    }
    console.log(
      `[registerJobHandler] Total handlers registered: ${messageHandlers.value.size}`,
      Array.from(messageHandlers.value.keys()),
    )

    // Process any pending messages that arrived before handler registration
    const pending = pendingMessages.value.get(jobId)
    if (pending && pending.length > 0) {
      console.log(
        `[registerJobHandler] Processing ${pending.length} pending messages for job ${jobId}`,
      )
      pending.forEach((msg) => {
        try {
          if (msg.type === 'status' && handlers.onStatus) {
            handlers.onStatus(msg.status, msg.message, msg.jobId, {
              tokens: msg.tokens,
              cost: msg.cost,
              modelId: msg.modelId,
            })
          } else if (msg.type === 'structured') {
            if (handlers.onStructured) {
              handlers.onStructured(msg.data)
            } else if (handlers.onChunk) {
              // Fallback: format as JSON string for chunk handler
              const jsonString = JSON.stringify(msg.data, null, 2)
              handlers.onChunk(jsonString)
            }
          } else if (msg.type === 'chunk' && handlers.onChunk) {
            handlers.onChunk(msg.content)
          } else if (msg.type === 'result' && handlers.onComplete) {
            handlers.onComplete(msg.body)
          } else if (msg.type === 'error' && handlers.onError) {
            handlers.onError(msg.message)
          }
        } catch (error) {
          console.error(`[registerJobHandler] Error processing pending message:`, error)
        }
      })
      pendingMessages.value.delete(jobId)
      console.log(
        `[registerJobHandler] Processed and cleared ${pending.length} pending messages for job ${jobId}`,
      )
    }
  }

  const unregisterJobHandler = (jobId) => {
    if (!jobId) {
      console.warn(`[unregisterJobHandler] WARNING: jobId is null/undefined!`)
      return
    }
    const existed = messageHandlers.value.has(jobId)
    const beforeCount = messageHandlers.value.size
    messageHandlers.value.delete(jobId)
    const afterCount = messageHandlers.value.size
    console.log(
      `[unregisterJobHandler] Unregistered handler for job ${jobId} (existed: ${existed}, before: ${beforeCount}, after: ${afterCount})`,
    )
    console.log(
      `[unregisterJobHandler] Remaining handlers: ${afterCount}`,
      Array.from(messageHandlers.value.keys()),
    )
  }

  const setConnectionId = (id) => {
    connectionId.value = id
  }

  onUnmounted(() => {
    disconnect()
  })

  return {
    connect,
    disconnect,
    isConnected,
    connectionId,
    registerJobHandler,
    unregisterJobHandler,
    setConnectionId,
    messageHandlers,
    pendingMessages,
  }
}
