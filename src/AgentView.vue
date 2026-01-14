<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import { RouterLink } from 'vue-router'
import { marked } from 'marked'
import { useAgent } from '@/composables/useAgent'
import { useToast } from '@/composables/useToast'
import { useAuthStore } from '@/stores/auth'

// Configure marked for safe rendering
marked.setOptions({
  breaks: false, // Let markdown handle line breaks properly (breaks: true interferes with lists)
  gfm: true, // GitHub Flavored Markdown
  headerIds: false, // Disable header IDs for cleaner HTML
  mangle: false, // Don't mangle email addresses
})

const authStore = useAuthStore()
const { submitJob, cancelJob } = useAgent()
const { showToast } = useToast()

const messages = ref([])
const STORAGE_KEY = 'agent-chat-messages'
const OUTPUT_MODE_KEY = 'agent-output-mode'
const inputMessage = ref('')
const isLoading = ref(false)
const sessionId = ref(null)
const currentJobId = ref(null) // Track current job ID for cancellation
const isCancelling = ref(false) // Track if cancellation is in progress to prevent double-clicks
const outputMode = ref('chat') // 'chat' or 'structured'
const chatMessagesContainer = ref(null) // Ref for the chat messages container

// Voice dictation state
const isRecording = ref(false)
const recognition = ref(null)
const isSpeechSupported = ref(false)
const baseInputText = ref('')
const finalTranscriptSoFar = ref('')

// Enhanced feedback state
const statusMessage = ref('Submitting your request...')
const elapsedTime = ref(0)
let elapsedTimeInterval = null

// Check if user is authenticated
const isAuthenticated = computed(() => authStore.isAuthenticated)

// Computed property for status display text (without elapsed time)
const statusDisplayText = computed(() => {
  return statusMessage.value
})

// Format elapsed seconds into minutes and seconds
const formatElapsedTime = (totalSeconds) => {
  if (!totalSeconds || totalSeconds === 0) return null
  const seconds = Math.floor(totalSeconds)
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60

  if (minutes > 0) {
    return `${minutes}m ${remainingSeconds}s`
  }
  return `${remainingSeconds}s`
}

// Computed property for elapsed time display
const elapsedTimeDisplay = computed(() => {
  const seconds = Math.floor(elapsedTime.value)
  if (seconds === 0) {
    return null
  }
  const formatted = formatElapsedTime(seconds)
  return formatted ? `Elapsed time: ${formatted}` : null
})

// Add a message to the chat
const addMessage = (
  text,
  isUser = false,
  elapsedSeconds = null,
  isComplete = false,
  outputModeUsed = null,
) => {
  const messageId = Date.now()
  messages.value.push({
    id: messageId,
    text,
    isUser,
    timestamp: new Date(),
    elapsedSeconds,
    isComplete,
    outputMode: outputModeUsed, // Store the output mode used for this message
  })
  return messageId
}

// Load messages from localStorage
const loadMessages = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      const parsed = JSON.parse(saved)

      // Handle both old format (array) and new format (object with messages)
      let messagesData = []

      if (Array.isArray(parsed)) {
        // Old format - just messages array
        messagesData = parsed
      } else if (parsed.messages && Array.isArray(parsed.messages)) {
        // New format - object with messages
        messagesData = parsed.messages
      }

      // Convert timestamp strings back to Date objects
      messagesData.forEach((msg) => {
        msg.timestamp = new Date(msg.timestamp)
      })
      messages.value = messagesData
    }
  } catch (error) {
    console.error('Failed to load messages from localStorage:', error)
    messages.value = []
  }

  // Load output mode preference
  try {
    const savedOutputMode = localStorage.getItem(OUTPUT_MODE_KEY)
    if (savedOutputMode === 'chat' || savedOutputMode === 'structured') {
      outputMode.value = savedOutputMode
    }
  } catch (error) {
    console.error('Failed to load output mode from localStorage:', error)
  }
}

// Save messages to localStorage
const saveMessages = () => {
  try {
    const dataToSave = {
      messages: messages.value,
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave))
  } catch (error) {
    console.error('Failed to save messages to localStorage:', error)
  }
}

// Watch messages and save to localStorage whenever they change
watch(
  messages,
  () => {
    saveMessages()
  },
  { deep: true },
)

// Watch outputMode and save to localStorage whenever it changes
watch(outputMode, () => {
  saveOutputMode()
})

// Scroll chat to bottom
const scrollToBottom = () => {
  nextTick(() => {
    if (chatMessagesContainer.value) {
      chatMessagesContainer.value.scrollTop = chatMessagesContainer.value.scrollHeight
    }
  })
}

// Send message to agent
const sendMessage = async () => {
  const message = inputMessage.value.trim()
  if (!message || isLoading.value) return

  // Stop recording if active
  if (isRecording.value) {
    stopDictation()
  }

  // Add user message to chat
  addMessage(message, true, null, false, outputMode.value)

  // Scroll to bottom after adding user message
  scrollToBottom()

  inputMessage.value = ''
  isLoading.value = true

  // Start status tracking
  startElapsedTimeTracking()

  // Create a placeholder message for the agent response that we'll update as chunks arrive
  let agentMessageId = null
  let accumulatedResponse = ''
  let hasFirstChunk = false
  let elapsedTimeUpdateInterval = null

  try {
    // Ensure we have a session ID for this chat thread
    if (!sessionId.value) {
      if (window.crypto && typeof window.crypto.randomUUID === 'function') {
        sessionId.value = window.crypto.randomUUID()
      } else {
        // Fallback UUID v4 generator
        sessionId.value = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
          const r = (Math.random() * 16) | 0
          const v = c === 'x' ? r : (r & 0x3) | 0x8
          return v.toString(16)
        })
      }
    }

    // Submit job via /jobs API (always uses async jobs/WebSocket pattern)
    // Note: submitJob returns a Promise that resolves with { response, sessionId, jobId }
    // The jobId will be available in the status callback when we get RUNNING status
    const result = await submitJob(
      message,
      sessionId.value,
      (chunk, newSessionId) => {
        // First chunk: hide spinner immediately so user sees streaming start
        if (!hasFirstChunk) {
          hasFirstChunk = true
          isLoading.value = false
        }

        // Update session ID if provided
        if (newSessionId && newSessionId !== sessionId.value) {
          sessionId.value = newSessionId
        }

        // Clean chunk: ensure it's a string
        let cleanChunk = typeof chunk === 'string' ? chunk : String(chunk || '')

        // Try to parse as JSON if it looks like a JSON string
        try {
          if (cleanChunk.trim().startsWith('"') && cleanChunk.trim().endsWith('"')) {
            cleanChunk = JSON.parse(cleanChunk)
          }
        } catch (e) {
          // Not JSON, continue with original content
        }

        // Aggressively remove all "data: " patterns
        // The chunks might be in format: data: "text" or "data: \"text\""
        // First, try to extract text from data: "text" pattern
        if (cleanChunk.match(/^data:\s*"/)) {
          // Format: data: "text" - extract the text part
          const match = cleanChunk.match(/^data:\s*"([^"]*)"?/)
          if (match) {
            cleanChunk = match[1] || ''
          } else {
            cleanChunk = cleanChunk.replace(/^data:\s*"?/, '')
          }
        } else {
          // Remove any data: patterns
          cleanChunk = cleanChunk.replace(/data:\s*"([^"]*)"/g, '$1')
          cleanChunk = cleanChunk.replace(/^"?data:\s*"?/g, '')
          cleanChunk = cleanChunk.replace(/data:\s*"?/g, '')
        }

        // Remove surrounding quotes if the entire chunk is quoted
        const trimmed = cleanChunk.trim()
        if (
          (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
          (trimmed.startsWith("'") && trimmed.endsWith("'"))
        ) {
          cleanChunk = trimmed.slice(1, -1)
        }

        // Unescape common escape sequences (order matters - do \\ first)
        cleanChunk = cleanChunk
          .replace(/\\\\/g, '\\')  // Replace \\ with \ first
          .replace(/\\n/g, '\n')
          .replace(/\\"/g, '"')    // Then replace \" with "
          .replace(/\\'/g, "'")
          .replace(/\\r/g, '\r')
          .replace(/\\t/g, '\t')

        // Simply concatenate chunks as received - spacing should be handled by the backend
        // Debug: log chunks that might contain URL patterns to identify spacing issues
        if (
          cleanChunk.includes('google') ||
          cleanChunk.includes('http') ||
          cleanChunk.includes('.com')
        ) {
          console.log('DEBUG chunk with URL pattern:', JSON.stringify(cleanChunk))
          console.log('DEBUG accumulated before:', JSON.stringify(accumulatedResponse.slice(-50)))
        }
        accumulatedResponse += cleanChunk

        // Update or create the agent message immediately for real-time streaming
        if (agentMessageId === null) {
          // Create new message with first chunk
          // Set current elapsed time, it will be updated continuously
          const currentElapsed = Math.floor(elapsedTime.value)
          agentMessageId = addMessage(
            accumulatedResponse,
            false,
            currentElapsed || null,
            false,
            outputMode.value,
          )

          // Scroll to bottom when agent response starts
          scrollToBottom()

          // Start updating message elapsed time continuously during streaming
          elapsedTimeUpdateInterval = setInterval(() => {
            const messageIndex = messages.value.findIndex((m) => m.id === agentMessageId)
            if (messageIndex !== -1) {
              const currentElapsed = Math.floor(elapsedTime.value)
              if (currentElapsed > 0) {
                messages.value[messageIndex].elapsedSeconds = currentElapsed
              }
            }
          }, 1000) // Update every second
        } else {
          // Update existing message with accumulated response
          const messageIndex = messages.value.findIndex((m) => m.id === agentMessageId)
          if (messageIndex !== -1) {
            messages.value[messageIndex].text = accumulatedResponse
          }
        }
      },
      (status, message, jobIdFromStatus, details) => {
        // Store jobId when we get status updates (especially RUNNING)
        if (jobIdFromStatus && !currentJobId.value) {
          currentJobId.value = jobIdFromStatus
        }

        // onStatus callback - update status message based on job status
        switch (status) {
          case 'PENDING':
            statusMessage.value = 'Processing your query...'
            break
          case 'RUNNING':
            statusMessage.value = 'Generating response...'
            break
          case 'COMPLETED':
            statusMessage.value = 'Complete'
            currentJobId.value = null // Clear job ID when completed
            isLoading.value = false // Ensure loading state is cleared
            isCancelling.value = false // Clear cancellation flag (in case it was set)
            // Stop tracking elapsed time and save final time to message
            const finalElapsedTime = Math.floor(elapsedTime.value)
            stopElapsedTimeTracking()
            // Stop the interval that updates message elapsed time
            if (elapsedTimeUpdateInterval) {
              clearInterval(elapsedTimeUpdateInterval)
              elapsedTimeUpdateInterval = null
            }
            if (agentMessageId !== null) {
              const messageIndex = messages.value.findIndex((m) => m.id === agentMessageId)
              if (messageIndex !== -1) {
                messages.value[messageIndex].elapsedSeconds = finalElapsedTime
                messages.value[messageIndex].isComplete = true
                if (details && (details.tokens || details.cost || details.modelId)) {
                  if (details.tokens) {
                    messages.value[messageIndex].tokens = details.tokens
                  }
                  if (details.cost) {
                    messages.value[messageIndex].cost = details.cost
                  }
                  if (details.modelId) {
                    messages.value[messageIndex].modelId = details.modelId
                  }
                }
              }
            }
            break
          case 'CANCELLED':
            statusMessage.value = 'Cancelled'
            currentJobId.value = null // Clear job ID when cancelled
            isLoading.value = false // Ensure loading state is cleared
            isCancelling.value = false // Clear cancellation flag
            // Stop tracking elapsed time
            const cancelledElapsedTime = Math.floor(elapsedTime.value)
            stopElapsedTimeTracking()
            // Stop the interval that updates message elapsed time
            if (elapsedTimeUpdateInterval) {
              clearInterval(elapsedTimeUpdateInterval)
              elapsedTimeUpdateInterval = null
            }
            if (agentMessageId !== null) {
              const messageIndex = messages.value.findIndex((m) => m.id === agentMessageId)
              if (messageIndex !== -1) {
                messages.value[messageIndex].elapsedSeconds = cancelledElapsedTime
                messages.value[messageIndex].isComplete = true
                // Optionally add a note that it was cancelled
                if (!messages.value[messageIndex].text.endsWith('\n\n[Cancelled]')) {
                  messages.value[messageIndex].text += '\n\n[Cancelled]'
                }
              }
            }
            break
          case 'FAILED':
            statusMessage.value = 'Failed'
            currentJobId.value = null // Clear job ID when failed
            isLoading.value = false // Ensure loading state is cleared
            isCancelling.value = false // Clear cancellation flag
            // Stop tracking on failure too
            stopElapsedTimeTracking()
            // Stop the interval that updates message elapsed time
            if (elapsedTimeUpdateInterval) {
              clearInterval(elapsedTimeUpdateInterval)
              elapsedTimeUpdateInterval = null
            }
            break
          default:
            if (message) {
              statusMessage.value = message
            }
        }
      },
      outputMode.value, // outputMode: 'chat' or 'structured'
      outputMode.value === 'structured' ? 'chat_response' : undefined, // outputSchemaName: set to 'chat_response' when structured mode is selected
    )

    // Note: Removed safety timeout - we rely on the event-driven system
    // The backend will send status updates via WebSocket, and errors will be handled via error callbacks

    // Update session ID if provided
    if (result.sessionId) {
      sessionId.value = result.sessionId
    }

    // Final update to ensure we have the complete response
    // Capture and stop tracking elapsed time when response is complete
    const finalElapsedTime = Math.floor(elapsedTime.value)

    // Stop the interval that updates message elapsed time
    if (elapsedTimeUpdateInterval) {
      clearInterval(elapsedTimeUpdateInterval)
      elapsedTimeUpdateInterval = null
    }

    if (result.response) {
      if (hasFirstChunk) {
        // We already streamed at least one chunk – just ensure the
        // existing streaming message has the final full text
        if (agentMessageId !== null) {
          const messageIndex = messages.value.findIndex((m) => m.id === agentMessageId)
          if (messageIndex !== -1) {
            messages.value[messageIndex].text = result.response
            // Always update to final elapsed time to ensure accuracy
            messages.value[messageIndex].elapsedSeconds = finalElapsedTime
            messages.value[messageIndex].isComplete = true
          }
        }
      } else {
        // No chunks ever arrived (non-streaming / fallback path),
        // so add a single message with the full response.
        addMessage(result.response, false, finalElapsedTime, true, outputMode.value)
      }
    }

    // Stop tracking after we've saved the elapsed time
    stopElapsedTimeTracking()

    console.log('=== AGENT RESPONSE IN VIEW ===')
    console.log('Response text:', result.response)
    console.log('Response length:', result.response?.length || 0)
    console.log('=== END AGENT RESPONSE IN VIEW ===')
  } catch (error) {
    console.error('Error invoking agent:', error)

    // Stop tracking elapsed time on error
    stopElapsedTimeTracking()

    // Stop the interval that updates message elapsed time
    if (elapsedTimeUpdateInterval) {
      clearInterval(elapsedTimeUpdateInterval)
      elapsedTimeUpdateInterval = null
    }

    // Remove the streaming message if it exists
    if (agentMessageId !== null) {
      const messageIndex = messages.value.findIndex((m) => m.id === agentMessageId)
      if (messageIndex !== -1) {
        messages.value.splice(messageIndex, 1)
      }
    }

    addMessage(
      `Error: ${error.message || 'Failed to get response from agent. Please try again.'}`,
      false,
      null,
      false,
      outputMode.value,
    )
    showToast('Failed to get response from agent', 'danger')
  } finally {
    // Clean up status tracking only if it's still running
    // (it should already be stopped when result completes, but ensure it's stopped)
    if (elapsedTimeInterval) {
      stopElapsedTimeTracking()
    }

    // Clean up elapsed time update interval
    if (elapsedTimeUpdateInterval) {
      clearInterval(elapsedTimeUpdateInterval)
      elapsedTimeUpdateInterval = null
    }

    // If we never received any chunks (e.g. error before stream), ensure loading is cleared
    if (!hasFirstChunk) {
      console.log('sendMessage finally (no chunks): setting isLoading = false')
      isLoading.value = false
      console.log('sendMessage finally: isLoading now', isLoading.value)
    }
  }
}

// Handle Enter key press
const handleKeyPress = (event) => {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault()
    sendMessage()
  }
}

// Stop current job
const stopCurrentJob = async () => {
  if (!currentJobId.value || isCancelling.value) {
    // Already cancelling or no job to cancel
    return
  }

  // Set flag to prevent double-clicks
  isCancelling.value = true

  // Store the jobId before attempting cancellation
  const jobIdToCancel = currentJobId.value

  try {
    await cancelJob(jobIdToCancel)
    showToast('Job cancellation requested', 'info')
    // Note: The CANCELLED status will come via WebSocket and be handled in the status handler
    // The status handler will clear currentJobId and isCancelling
  } catch (error) {
    console.error('Error cancelling job:', error)

    // Check if the error is because the job is already completed/finished
    const errorMessage = error?.message || ''
    if (
      errorMessage.includes('Cannot cancel job with status: COMPLETED') ||
      errorMessage.includes('Cannot cancel job with status: CANCELLED') ||
      errorMessage.includes('Cannot cancel job with status: FAILED')
    ) {
      // Job is already done - clear state
      currentJobId.value = null
      isLoading.value = false
      isCancelling.value = false
      showToast('Job has already finished', 'info')
    } else {
      // Other error - reset flag so user can try again
      isCancelling.value = false
      showToast('Failed to cancel job', 'danger')
    }
  }
}

// Clear chat history
const clearChat = () => {
  messages.value = []
  sessionId.value = null
  inputMessage.value = ''
  isLoading.value = false
  currentJobId.value = null
  isRecording.value = false
  statusMessage.value = 'Submitting your request...'
  elapsedTime.value = 0
  stopElapsedTimeTracking()
  if (recognition.value && isRecording.value) {
    stopDictation()
  }
  localStorage.removeItem(STORAGE_KEY) // Clear persisted messages
  // Note: outputMode preference is preserved when clearing chat
  showToast('Chat cleared', 'info')
}

// Save output mode preference
const saveOutputMode = () => {
  try {
    localStorage.setItem(OUTPUT_MODE_KEY, outputMode.value)
  } catch (error) {
    console.error('Failed to save output mode to localStorage:', error)
  }
}

// Format timestamp
const formatTime = (date) => {
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  }).format(date)
}

// Copy message text to clipboard
const copyToClipboard = async (text) => {
  try {
    // Strip HTML tags to get plain text
    const tempDiv = document.createElement('div')
    tempDiv.innerHTML = text
    const plainText = tempDiv.textContent || tempDiv.innerText || ''

    await navigator.clipboard.writeText(plainText.trim())
    showToast('Copied to clipboard', 'success')
  } catch (error) {
    console.error('Failed to copy to clipboard:', error)
    showToast('Failed to copy to clipboard', 'danger')
  }
}

// Reset status tracking
const resetStatusTracking = () => {
  statusMessage.value = 'Submitting your request...'
  elapsedTime.value = 0
  if (elapsedTimeInterval) {
    clearInterval(elapsedTimeInterval)
    elapsedTimeInterval = null
  }
}

// Start elapsed time tracking
const startElapsedTimeTracking = () => {
  resetStatusTracking()
  elapsedTimeInterval = setInterval(() => {
    elapsedTime.value += 1
  }, 1000)
}

// Stop elapsed time tracking
const stopElapsedTimeTracking = () => {
  if (elapsedTimeInterval) {
    clearInterval(elapsedTimeInterval)
    elapsedTimeInterval = null
  }
}

// Initialize speech recognition
const initSpeechRecognition = () => {
  // Check for browser support
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition

  if (!SpeechRecognition) {
    isSpeechSupported.value = false
    return
  }

  isSpeechSupported.value = true
  recognition.value = new SpeechRecognition()
  recognition.value.continuous = true
  recognition.value.interimResults = true
  recognition.value.lang = 'en-US'

  recognition.value.onstart = () => {
    isRecording.value = true
    // Save the current input as base text when starting dictation
    baseInputText.value = inputMessage.value.trim()
    finalTranscriptSoFar.value = ''
  }

  recognition.value.onresult = (event) => {
    let interimTranscript = ''
    let newFinalTranscript = ''

    // Process only new results (from resultIndex to end)
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const transcript = event.results[i][0].transcript
      if (event.results[i].isFinal) {
        newFinalTranscript += transcript + ' '
      } else {
        interimTranscript += transcript
      }
    }

    // Update accumulated final transcript
    if (newFinalTranscript) {
      finalTranscriptSoFar.value += newFinalTranscript
    }

    // Combine: base text + all final transcripts so far + current interim
    const combinedFinal = finalTranscriptSoFar.value.trim()
    const fullText = baseInputText.value
      ? baseInputText.value +
        ' ' +
        combinedFinal +
        (interimTranscript ? ' ' + interimTranscript : '')
      : combinedFinal + (interimTranscript ? ' ' + interimTranscript : '')
    inputMessage.value = fullText.trim()
  }

  recognition.value.onerror = (event) => {
    console.error('Speech recognition error:', event.error)
    isRecording.value = false

    if (event.error === 'no-speech') {
      showToast('No speech detected. Please try again.', 'warning')
    } else if (event.error === 'audio-capture') {
      showToast('No microphone found. Please check your microphone.', 'danger')
    } else if (event.error === 'not-allowed') {
      showToast(
        'Microphone permission denied. Please enable it in your browser settings.',
        'danger',
      )
    } else {
      showToast('Speech recognition error occurred', 'danger')
    }
  }

  recognition.value.onend = () => {
    isRecording.value = false
    baseInputText.value = ''
    finalTranscriptSoFar.value = ''
  }
}

// Start voice dictation
const startDictation = () => {
  if (!isSpeechSupported.value || !recognition.value) {
    showToast('Speech recognition is not supported in your browser', 'warning')
    return
  }

  if (isRecording.value) {
    stopDictation()
    return
  }

  try {
    recognition.value.start()
  } catch (error) {
    console.error('Error starting speech recognition:', error)
    // Recognition might already be running
    if (error.message && error.message.includes('started')) {
      stopDictation()
      setTimeout(() => {
        try {
          recognition.value.start()
        } catch (e) {
          console.error('Error restarting speech recognition:', e)
          showToast('Failed to start voice dictation', 'danger')
        }
      }, 100)
    } else {
      showToast('Failed to start voice dictation', 'danger')
    }
  }
}

// Stop voice dictation
const stopDictation = () => {
  if (recognition.value && isRecording.value) {
    try {
      recognition.value.stop()
    } catch (error) {
      console.error('Error stopping speech recognition:', error)
    }
    isRecording.value = false
    baseInputText.value = ''
    finalTranscriptSoFar.value = ''
  }
}

// Render markdown to HTML (only for agent messages)
const renderMarkdown = (text, outputModeUsed = null) => {
  if (!text) return ''

  try {
    // If structured mode, format as a markdown code block
    if (outputModeUsed === 'structured') {
      const cleanedText = text.trim()
      // Format as JSON code block
      const codeBlock = '```json\n' + cleanedText + '\n```'
      const html = marked.parse(codeBlock)
      return html
    }

    // Trim the text and parse markdown directly
    // Since the response is now proper markdown, we can parse it directly
    const cleanedText = text.trim()

    // Parse markdown
    const html = marked.parse(cleanedText)
    return html
  } catch (error) {
    console.error('Error rendering markdown:', error)
    // Escape HTML for safety if markdown parsing fails
    return text.replace(/</g, '&lt;').replace(/>/g, '&gt;')
  }
}

onMounted(() => {
  // Load messages from localStorage first
  loadMessages()

  // Only add welcome message if there are no existing messages
  if (messages.value.length === 0) {
    addMessage("Hello! I'm your AI agent. Why not start by asking me what I can do 😀", false)
  }

  // Initialize speech recognition
  initSpeechRecognition()
})

onBeforeUnmount(() => {
  // Clean up speech recognition
  if (recognition.value && isRecording.value) {
    stopDictation()
  }

  // Clean up status tracking
  stopElapsedTimeTracking()
})
</script>

<template>
  <div class="card bg-body-tertiary h-100">
    <div class="card-header d-flex justify-content-between align-items-center bg-white">
      <h5 class="card-title mb-0 text-dark"><i class="bi bi-robot me-2"></i>Agent</h5>
      <button
        v-if="messages.length > 1"
        class="btn btn-sm btn-outline-secondary"
        @click="clearChat"
        title="Clear chat"
      >
        <i class="bi bi-trash"></i> Clear
      </button>
    </div>
    <div class="card-body d-flex flex-column p-0" style="height: 600px">
      <!-- Chat Messages -->
      <div
        ref="chatMessagesContainer"
        class="flex-grow-1 overflow-auto p-3"
        style="max-height: calc(600px - 120px)"
      >
        <div v-if="messages.length === 0" class="text-center text-muted py-5">
          <i class="bi bi-chat-dots fs-1 d-block mb-3"></i>
          <p>Start a conversation with the AI agent, ask something like "What can you do?"</p>
        </div>
        <div
          v-for="message in messages"
          :key="message.id"
          :data-message-id="message.id"
          class="mb-3 d-flex w-100"
          :class="message.isUser ? 'justify-content-end' : 'justify-content-start'"
        >
          <div
            :class="message.isUser ? 'd-flex flex-column align-items-end' : ''"
            class="w-100"
            style="max-width: 37.5rem"
          >
            <div
              class="message-bubble text-break p-3 rounded position-relative mw-100 overflow-hidden"
              :class="message.isUser ? 'bg-primary text-white' : 'bg-body border border-secondary'"
              style="max-width: 37.5rem; word-wrap: break-word; overflow-wrap: break-word"
            >
              <button
                v-if="!message.isUser"
                class="btn btn-sm btn-link position-absolute copy-button opacity-50 text-secondary text-decoration-none top-0 end-0 m-2"
                style="z-index: 1"
                @click="copyToClipboard(message.text)"
                title="Copy to clipboard"
              >
                <i class="bi bi-clipboard"></i>
              </button>
              <div v-if="message.isUser" class="lh-base" style="white-space: pre-wrap">
                {{ message.text }}
              </div>
              <div
                v-else
                class="text-break markdown-content pt-2 pe-5"
                v-html="renderMarkdown(message.text, message.outputMode)"
              ></div>
              <div class="small mt-1" :class="message.isUser ? 'text-white-50' : 'text-muted'">
                {{ formatTime(message.timestamp) }}
              </div>
            </div>
            <div
              v-if="!message.isUser && (message.elapsedSeconds || message.tokens || message.cost)"
              class="small text-muted mt-1 ms-3 d-flex align-items-center gap-2 flex-wrap"
            >
              <span v-if="message.elapsedSeconds">
                Elapsed time: {{ formatElapsedTime(message.elapsedSeconds) }}
              </span>
              <span v-if="message.tokens">•</span>
              <span v-if="message.tokens">
                Tokens: {{ message.tokens.inputTokens }} in / {{ message.tokens.outputTokens }} out
                / {{ message.tokens.totalTokens }} total
              </span>
              <span v-if="message.cost">•</span>
              <span v-if="message.cost">
                Cost: ${{ Number(message.cost.totalCost).toFixed(6) }}
              </span>
              <i
                v-if="message.isComplete"
                class="bi bi-check-circle text-success"
                title="Stream completed"
              ></i>
            </div>
          </div>
        </div>
        <div v-if="isLoading" class="mb-3 d-flex justify-content-start">
          <div>
            <div
              class="message-bubble text-break p-3 rounded bg-body border border-secondary mw-100"
              style="max-width: 37.5rem"
            >
              <div class="d-flex align-items-center">
                <div class="spinner-border spinner-border-sm me-2" role="status">
                  <span class="visually-hidden">Loading...</span>
                </div>
                <span class="text-muted">{{ statusDisplayText }}</span>
              </div>
            </div>
            <div v-if="elapsedTimeDisplay" class="small text-muted mt-1 ms-3">
              {{ elapsedTimeDisplay }}
            </div>
          </div>
        </div>
      </div>

      <!-- Input Area -->
      <div class="border-top p-3 bg-body">
        <div v-if="!isAuthenticated" class="alert alert-warning mb-3">
          <i class="bi bi-exclamation-triangle me-2"></i>
          Please <RouterLink to="/login">login</RouterLink> to use the AI agent.
        </div>
        <div v-else>
          <textarea
            v-model="inputMessage"
            class="form-control mb-2"
            rows="2"
            placeholder="Type your message here..."
            :disabled="isLoading || isRecording"
            @keydown="handleKeyPress"
          ></textarea>
          <div class="d-flex justify-content-between align-items-start">
            <span class="form-text small text-muted mt-0 ms-3">
              Press <strong>Enter</strong> to send, <strong>Shift + Enter</strong> for a new line.
            </span>
            <div class="d-flex gap-2">
              <span v-if="isRecording" class="text-danger d-flex align-items-center me-2">
                <span class="spinner-border spinner-border-sm me-1" role="status">
                  <span class="visually-hidden">Recording...</span>
                </span>
                Listening...
              </span>
              <button
                v-if="isSpeechSupported"
                class="btn btn-outline-secondary"
                type="button"
                :disabled="isLoading"
                :class="{ 'btn-danger': isRecording }"
                @click="startDictation"
                :title="isRecording ? 'Stop recording' : 'Start voice dictation'"
              >
                <i v-if="isRecording" class="bi bi-mic-fill"></i>
                <i v-else class="bi bi-mic"></i>
              </button>
              <button
                v-if="isLoading && currentJobId"
                @click="stopCurrentJob"
                class="btn btn-danger"
                type="button"
                :disabled="isCancelling"
                :title="isCancelling ? 'Cancelling...' : 'Stop current job'"
              >
                <i class="bi bi-stop-fill"></i>
                <span class="ms-1">{{ isCancelling ? 'Cancelling...' : 'Stop' }}</span>
              </button>
              <button
                v-else
                class="btn btn-primary"
                type="button"
                :disabled="!inputMessage.trim() || isLoading || isRecording"
                @click="sendMessage"
              >
                <i v-if="!isLoading" class="bi bi-send"></i>
                <span v-else class="spinner-border spinner-border-sm" role="status">
                  <span class="visually-hidden">Loading...</span>
                </span>
                <span class="ms-1">Send</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Copy button hover effects using Bootstrap CSS variables */
.copy-button:hover {
  opacity: 1 !important;
  color: var(--bs-primary) !important;
}

.message-bubble:hover .copy-button {
  opacity: 0.75 !important;
}

/* Markdown styling for agent messages */
.markdown-content {
  hyphens: auto;
  word-wrap: break-word;
  overflow-wrap: break-word;
  max-width: 100%;
}

.markdown-content :deep(h1),
.markdown-content :deep(h2),
.markdown-content :deep(h3),
.markdown-content :deep(h4),
.markdown-content :deep(h5),
.markdown-content :deep(h6) {
  margin-top: 1em;
  margin-bottom: 0.5em;
  font-weight: 600;
  line-height: 1.3;
}

.markdown-content :deep(h1) {
  font-size: 1.5em;
  border-bottom: 1px solid rgba(128, 128, 128, 0.3);
  padding-bottom: 0.3em;
}

.markdown-content :deep(h2) {
  font-size: 1.3em;
  border-bottom: 1px solid rgba(128, 128, 128, 0.2);
  padding-bottom: 0.3em;
}

.markdown-content :deep(h3) {
  font-size: 1.1em;
}

.markdown-content :deep(p) {
  margin-bottom: 0.75em;
  line-height: 1.6;
  word-wrap: break-word;
}

.markdown-content :deep(p:last-child) {
  margin-bottom: 0;
}

.markdown-content :deep(ul),
.markdown-content :deep(ol) {
  margin-bottom: 0.75em;
  padding-left: 1.5em;
  margin-top: 0.5em;
  list-style-position: outside;
}

.markdown-content :deep(ul) {
  list-style-type: disc;
}

.markdown-content :deep(ol) {
  list-style-type: decimal;
}

.markdown-content :deep(li) {
  margin-bottom: 0.5em;
  line-height: 1.6;
  word-wrap: break-word;
  overflow-wrap: break-word;
  display: list-item;
}

.markdown-content :deep(li > p) {
  margin-bottom: 0.25em;
  margin-top: 0;
  display: inline;
}

.markdown-content :deep(li > p:first-child) {
  margin-top: 0;
}

.markdown-content :deep(li > p:last-child) {
  margin-bottom: 0;
}

/* Ensure list items don't break awkwardly */
.markdown-content :deep(li) {
  text-indent: 0;
}

.markdown-content :deep(code) {
  background-color: rgba(0, 0, 0, 0.1);
  padding: 0.2em 0.4em;
  border-radius: 3px;
  font-size: 0.9em;
  font-family: 'Courier New', monospace;
  word-wrap: break-word;
  overflow-wrap: break-word;
  max-width: 100%;
}

.markdown-content :deep(pre) {
  background-color: rgba(0, 0, 0, 0.1);
  padding: 0.75em;
  border-radius: 4px;
  overflow-x: auto;
  overflow-y: hidden;
  margin-bottom: 0.75em;
  max-width: 100%;
  word-wrap: break-word;
  overflow-wrap: break-word;
}

.markdown-content :deep(pre code) {
  background-color: transparent;
  padding: 0;
  white-space: pre;
  word-wrap: normal;
  overflow-wrap: normal;
}

.markdown-content :deep(pre code) {
  background-color: transparent;
  padding: 0;
}

.markdown-content :deep(strong) {
  font-weight: 600;
}

.markdown-content :deep(em) {
  font-style: italic;
}

.markdown-content :deep(blockquote) {
  border-left: 3px solid rgba(128, 128, 128, 0.3);
  padding-left: 1em;
  margin-left: 0;
  margin-bottom: 0.75em;
  color: rgba(128, 128, 128, 0.9);
}

.markdown-content :deep(a) {
  color: inherit;
  text-decoration: underline;
}

</style>
