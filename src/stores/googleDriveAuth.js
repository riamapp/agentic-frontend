import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useGoogleDriveStore = defineStore('googleDrive', () => {
  const authorized = ref(false)
  const loading = ref(false)
  const error = ref(null)
  const lastChecked = ref(null)

  const isAuthorized = computed(() => authorized.value)
  const isLoading = computed(() => loading.value)
  const hasError = computed(() => !!error.value)

  function setAuthorized(value) {
    authorized.value = value
    lastChecked.value = new Date()
  }

  function setLoading(value) {
    loading.value = value
  }

  function setError(err) {
    error.value = err
  }

  function reset() {
    authorized.value = false
    loading.value = false
    error.value = null
    lastChecked.value = null
  }

  /**
   * Handle OAuth callback from Google Drive authorization
   * @param {Object} params - Callback query parameters
   * @param {string} params.success - 'true' or 'false'
   * @param {string} [params.user_id] - User ID if successful
   * @param {string} [params.error] - Error code if failed
   * @param {string} [params.error_description] - Error description if failed
   * @returns {Object} - { success: boolean, error?: string }
   */
  function handleCallback(params) {
    const { success, user_id, error, error_description } = params

    // Handle error case
    if (error || success === 'false') {
      const errorMsg = error_description
        ? decodeURIComponent(error_description)
        : error || 'Authorization failed'

      setError(errorMsg)
      setAuthorized(false)
      return { success: false, error: errorMsg }
    }

    // Handle success case
    if (success === 'true') {
      setAuthorized(true)
      setError(null)
      return { success: true, user_id }
    }

    // Handle missing/invalid parameters
    const errorMsg = 'Invalid callback parameters'
    setError(errorMsg)
    setAuthorized(false)
    return { success: false, error: errorMsg }
  }

  return {
    authorized,
    loading,
    error,
    lastChecked,
    isAuthorized,
    isLoading,
    hasError,
    setAuthorized,
    setLoading,
    setError,
    reset,
    handleCallback,
  }
})
