import { defineStore } from 'pinia'
import { useAuthStore } from './auth'
import { awsConfig } from '@/config/aws-config'

// Store the system theme listener so we can remove it
let systemThemeListener = null

export const usePreferencesStore = defineStore('preferences', {
  state: () => ({
    theme: null, // 'light', 'dark', or 'system'
    displayName: null,
    displayPicture: null, // S3 key for user's custom profile picture
    studentId: null, // Student ID for file uploads
    loading: false,
    error: null,
  }),

  getters: {
    effectiveTheme: (state) => {
      if (state.theme === 'system') {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
        return prefersDark ? 'dark' : 'light'
      }
      return state.theme || 'light'
    },
    // Effective display name with fallback chain: displayName → OAuth name
    effectiveDisplayName: (state) => {
      if (state.displayName) {
        return state.displayName
      }
      const authStore = useAuthStore()
      return authStore.userOAuthName || null
    },
    // Effective display picture with fallback chain: displayPicture → OAuth picture → null
    effectiveDisplayPicture: (state) => {
      // Return the S3 key if set, otherwise fall back to OAuth picture URL
      if (state.displayPicture) {
        return state.displayPicture // This is an S3 key, will need to be converted to URL
      }
      const authStore = useAuthStore()
      return authStore.userPicture || null
    },
  },

  actions: {
    async loadPreferences() {
      const authStore = useAuthStore()

      if (!authStore.isAuthenticated) {
        return
      }

      // Prevent duplicate concurrent calls
      if (this.loading) {
        return
      }

      const accessToken = await authStore.getAccessToken()

      if (!accessToken) {
        this.error = 'No access token available'
        return
      }

      this.loading = true
      this.error = null

      try {
        if (!awsConfig.apiGatewayUrl) {
          throw new Error(
            'API Gateway URL is not configured. Please set VITE_USER_API_GATEWAY_URL in your .env file',
          )
        }

        const url = `${awsConfig.apiGatewayUrl}/user/preferences`
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        })

        if (!response.ok) {
          if (response.status === 404) {
            this.theme = null
            this.displayName = null
            this.displayPicture = null
            this.studentId = null
            return
          }
          const errorText = await response.text().catch(() => '')
          const errorMessage = errorText || `HTTP ${response.status} ${response.statusText}`
          console.error('Failed to load preferences:', response.status, errorMessage)
          throw new Error(`Failed to load preferences: ${response.status} - ${errorMessage}`)
        }

        const preferences = await response.json()
        this.theme = preferences.theme || null
        // Only set displayName if it exists in preferences (don't initialize from OAuth here)
        // This allows effectiveDisplayName getter to handle the fallback
        this.displayName = preferences.displayName || null
        this.displayPicture = preferences.displayPicture || null
        this.studentId = preferences.studentId || null

        // Apply theme if loaded
        if (this.theme) {
          this.applyTheme(this.theme)
        } else {
          // Default to system if no preference saved
          this.theme = 'system'
          this.applyTheme('system')
        }
      } catch (err) {
        this.error = err.message
        console.error('Failed to load preferences:', err)
        // Default to system on error
        this.theme = 'system'
        this.applyTheme('system')
      } finally {
        this.loading = false
      }
    },

    async updateTheme(theme) {
      const authStore = useAuthStore()
      const accessToken = await authStore.getAccessToken()

      if (!accessToken) {
        throw new Error('No access token available')
      }

      this.loading = true
      this.error = null

      try {
        if (!awsConfig.apiGatewayUrl) {
          throw new Error(
            'API Gateway URL is not configured. Please set VITE_USER_API_GATEWAY_URL in your .env file',
          )
        }

        // Preserve displayName, displayPicture, and studentId when updating theme
        const currentDisplayName = this.displayName || null
        const currentDisplayPicture = this.displayPicture || null
        const currentStudentId = this.studentId || null
        const url = `${awsConfig.apiGatewayUrl}/user/preferences`
        const response = await fetch(url, {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            theme,
            displayName: currentDisplayName,
            displayPicture: currentDisplayPicture,
            studentId: currentStudentId,
          }),
        })

        if (!response.ok) {
          const errorText = await response.text().catch(() => '')
          const errorMessage = errorText || `HTTP ${response.status} ${response.statusText}`
          console.error('Failed to update theme:', response.status, errorMessage)
          throw new Error(`Failed to update theme: ${response.status} - ${errorMessage}`)
        }

        const preferences = await response.json()
        this.theme = preferences.theme || theme

        // Apply the theme immediately
        this.applyTheme(this.theme)
      } catch (err) {
        this.error = err.message
        throw err
      } finally {
        this.loading = false
      }
    },

    async updateDisplayName(displayName) {
      const authStore = useAuthStore()
      const accessToken = await authStore.getAccessToken()

      if (!accessToken) {
        throw new Error('No access token available')
      }

      this.loading = true
      this.error = null

      try {
        if (!awsConfig.apiGatewayUrl) {
          throw new Error(
            'API Gateway URL is not configured. Please set VITE_USER_API_GATEWAY_URL in your .env file',
          )
        }

        // Get current preferences to preserve theme, displayPicture, and studentId
        const currentTheme = this.theme || 'system'
        const currentDisplayPicture = this.displayPicture || null
        const currentStudentId = this.studentId || null
        const url = `${awsConfig.apiGatewayUrl}/user/preferences`
        const response = await fetch(url, {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            theme: currentTheme,
            displayName,
            displayPicture: currentDisplayPicture,
            studentId: currentStudentId,
          }),
        })

        if (!response.ok) {
          const errorText = await response.text().catch(() => '')
          const errorMessage = errorText || `HTTP ${response.status} ${response.statusText}`
          console.error('Failed to update display name:', response.status, errorMessage)
          throw new Error(`Failed to update display name: ${response.status} - ${errorMessage}`)
        }

        const preferences = await response.json()
        this.displayName = preferences.displayName || displayName
      } catch (err) {
        this.error = err.message
        throw err
      } finally {
        this.loading = false
      }
    },

    async updateDisplayPicture(displayPicture) {
      const authStore = useAuthStore()
      const accessToken = await authStore.getAccessToken()

      if (!accessToken) {
        throw new Error('No access token available')
      }

      this.loading = true
      this.error = null

      try {
        if (!awsConfig.apiGatewayUrl) {
          throw new Error(
            'API Gateway URL is not configured. Please set VITE_USER_API_GATEWAY_URL in your .env file',
          )
        }

        // Get current preferences to preserve theme, displayName, and studentId
        const currentTheme = this.theme || 'system'
        const currentDisplayName = this.displayName || null
        const currentStudentId = this.studentId || null
        const url = `${awsConfig.apiGatewayUrl}/user/preferences`
        const response = await fetch(url, {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            theme: currentTheme,
            displayName: currentDisplayName,
            displayPicture,
            studentId: currentStudentId,
          }),
        })

        if (!response.ok) {
          const errorText = await response.text().catch(() => '')
          const errorMessage = errorText || `HTTP ${response.status} ${response.statusText}`
          console.error('Failed to update display picture:', response.status, errorMessage)
          throw new Error(`Failed to update display picture: ${response.status} - ${errorMessage}`)
        }

        const preferences = await response.json()
        this.displayPicture = preferences.displayPicture || displayPicture
      } catch (err) {
        this.error = err.message
        throw err
      } finally {
        this.loading = false
      }
    },

    async updateStudentId(studentId) {
      const authStore = useAuthStore()
      const accessToken = await authStore.getAccessToken()

      if (!accessToken) {
        throw new Error('No access token available')
      }

      this.loading = true
      this.error = null

      try {
        if (!awsConfig.apiGatewayUrl) {
          throw new Error(
            'API Gateway URL is not configured. Please set VITE_USER_API_GATEWAY_URL in your .env file',
          )
        }

        // Get current preferences to preserve theme, displayName, and displayPicture
        const currentTheme = this.theme || 'system'
        const currentDisplayName = this.displayName || null
        const currentDisplayPicture = this.displayPicture || null
        const url = `${awsConfig.apiGatewayUrl}/user/preferences`
        const response = await fetch(url, {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            theme: currentTheme,
            displayName: currentDisplayName,
            displayPicture: currentDisplayPicture,
            studentId,
          }),
        })

        if (!response.ok) {
          const errorText = await response.text().catch(() => '')
          const errorMessage = errorText || `HTTP ${response.status} ${response.statusText}`
          console.error('Failed to update student ID:', response.status, errorMessage)
          throw new Error(`Failed to update student ID: ${response.status} - ${errorMessage}`)
        }

        const preferences = await response.json()
        this.studentId = preferences.studentId || studentId
      } catch (err) {
        this.error = err.message
        throw err
      } finally {
        this.loading = false
      }
    },

    applyTheme(theme) {
      const target = typeof document !== 'undefined' ? document.body : null
      const setThemeAttribute = (value) => {
        if (target) {
          target.setAttribute('data-bs-theme', value || 'light')
          // Use Bootstrap's CSS-variable driven background so it adapts per theme.
          target.classList.remove(
            'bg-light',
            'bg-white',
            'bg-dark',
            'bg-body-tertiary',
            'text-light',
            'text-dark',
          )
          target.classList.add('bg-body')
        }
      }

      // Remove existing system theme listener if any
      if (systemThemeListener) {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
        mediaQuery.removeEventListener('change', systemThemeListener)
        systemThemeListener = null
      }

      if (theme === 'system') {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
        const initialTheme = mediaQuery.matches ? 'dark' : 'light'
        setThemeAttribute(initialTheme)

        // Listen for system theme changes
        const handleChange = (e) => {
          const nextTheme = e.matches ? 'dark' : 'light'
          setThemeAttribute(nextTheme)
        }
        mediaQuery.addEventListener('change', handleChange)
        systemThemeListener = handleChange
      } else {
        const desiredTheme = theme || 'light'
        setThemeAttribute(desiredTheme)
      }
    },
  },
})