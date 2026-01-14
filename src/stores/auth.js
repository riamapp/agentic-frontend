import { defineStore } from 'pinia'
import { useAuth } from '@/composables/useAuth'

// Create auth composable instance for use in store
const auth = useAuth()

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    isAuthenticated: false,
    accessToken: null,
    idToken: null,
    refreshToken: null,
    loading: false,
    error: null,
  }),

  getters: {
    userName: (state) => state.user?.username || null,
    userEmail: (state) => state.user?.attributes?.email || null,
    userPicture: (state) => state.user?.attributes?.picture || null,
    userOAuthName: (state) => state.user?.attributes?.name || null,
    userSub: (state) => {
      if (state.user?.attributes?.sub) {
        return state.user.attributes.sub
      }
      // Fallback to token payload if user attributes not loaded
      if (state.idToken) {
        const payload = auth.decodeToken(state.idToken)
        return payload?.sub || null
      }
      return null
    },
    tokenPayload: (state) => {
      if (!state.idToken) return null
      return auth.decodeToken(state.idToken)
    },
  },

  actions: {
    // Redirect to Cognito hosted UI
    login() {
      const loginUrl = auth.getLoginUrl()
      window.location.href = loginUrl
    },

    // Handle the callback after Cognito redirects back
    async handleCallback(code) {
      this.loading = true
      this.error = null
      try {
        console.log('Exchanging authorization code for tokens...')
        // Exchange code for tokens
        const tokens = await auth.exchangeCodeForTokens(code)
        console.log('Tokens received successfully')

        // Store tokens
        this.accessToken = tokens.accessToken
        this.idToken = tokens.idToken
        this.refreshToken = tokens.refreshToken

        // Save to localStorage
        localStorage.setItem('accessToken', tokens.accessToken)
        localStorage.setItem('idToken', tokens.idToken)
        localStorage.setItem('refreshToken', tokens.refreshToken)

        // Get user info
        console.log('Fetching user information...')
        await this.fetchUser()
        console.log('User authenticated:', this.user)
        return { success: true }
      } catch (error) {
        console.error('Error in handleCallback:', error)
        this.error = error.message
        throw error
      } finally {
        this.loading = false
      }
    },

    async fetchUser() {
      if (!this.accessToken) return

      // Prevent duplicate calls if user is already loaded
      if (this.user && this.isAuthenticated) {
        return
      }

      try {
        // Try to get user data from API
        const userData = await auth.getUser(this.accessToken)

        // Enhance user data with ID token claims (for federated login attributes like picture)
        if (this.idToken) {
          const payload = auth.decodeToken(this.idToken)
          if (payload) {
            // Merge ID token claims into attributes if not already present
            userData.attributes = {
              ...userData.attributes,
              picture: userData.attributes.picture || payload.picture,
              name: userData.attributes.name || payload.name,
              given_name: userData.attributes.given_name || payload.given_name,
              family_name: userData.attributes.family_name || payload.family_name,
            }
          }
        }

        this.user = userData
        this.isAuthenticated = true
      } catch (error) {
        console.warn('Failed to fetch user from API, using token payload instead:', error)
        // Fallback: use ID token payload for user info
        if (this.idToken) {
          const payload = auth.decodeToken(this.idToken)
          if (payload) {
            this.user = {
              username: payload['cognito:username'] || payload.sub || payload.email,
              attributes: {
                email: payload.email,
                sub: payload.sub,
                picture: payload.picture, // Google federated login picture
                name: payload.name, // Google federated login name
                given_name: payload.given_name,
                family_name: payload.family_name,
              },
            }
            this.isAuthenticated = true
            return // Success with token payload
          }
        }
        // If both fail, clear auth and throw
        this.clearAuth()
        throw error
      }
    },

    clearAuth() {
      this.user = null
      this.isAuthenticated = false
      this.accessToken = null
      this.idToken = null
      this.refreshToken = null
      this.error = null
      localStorage.removeItem('accessToken')
      localStorage.removeItem('idToken')
      localStorage.removeItem('refreshToken')
      // Clear chat messages from localStorage on logout
      localStorage.removeItem('agent-chat-messages')
      // Clear user role on logout
      localStorage.removeItem('userRole')
      sessionStorage.removeItem('userRole')
    },

    async logout() {
      this.loading = true

      // Clear local state first
      this.clearAuth()

      try {
        // Optionally call Cognito GlobalSignOut to invalidate tokens server-side
        // This is non-blocking - we proceed with redirect even if it fails
        if (this.accessToken) {
          auth.logout(this.accessToken).catch((err) => {
            console.warn('GlobalSignOut API error (non-blocking):', err)
          })
        }
      } catch (error) {
        console.warn('Logout API error (non-blocking):', error)
      }

      // Redirect to Cognito logout endpoint to clear Cognito session
      // This will redirect back to signOutUri after logout
      try {
        const logoutUrl = auth.getLogoutUrl()
        window.location.href = logoutUrl
      } catch (error) {
        console.error('Error generating logout URL:', error)
        // Fallback: just redirect to home if logout URL generation fails
        window.location.href = '/'
      }
    },

    async refreshTokens() {
      if (!this.refreshToken) {
        throw new Error('No refresh token available')
      }

      try {
        console.log('Attempting to refresh tokens...')
        const tokens = await auth.refreshTokens(this.refreshToken)

        // Update tokens
        this.accessToken = tokens.accessToken
        this.idToken = tokens.idToken
        this.refreshToken = tokens.refreshToken

        // Save to localStorage
        localStorage.setItem('accessToken', tokens.accessToken)
        localStorage.setItem('idToken', tokens.idToken)
        localStorage.setItem('refreshToken', tokens.refreshToken)

        console.log('Tokens refreshed successfully')
        return true
      } catch (error) {
        console.error('Token refresh failed:', error)
        throw error
      }
    },

    isTokenExpiringSoon(token, minutesBeforeExpiry = 5) {
      if (!token) return true
      const payload = auth.decodeToken(token)
      if (!payload || !payload.exp) return true

      const expirationTime = payload.exp * 1000
      const timeUntilExpiry = expirationTime - Date.now()
      const minutesUntilExpiry = timeUntilExpiry / (1000 * 60)

      return minutesUntilExpiry < minutesBeforeExpiry
    },

    async checkAuth() {
      // Check if tokens exist in localStorage
      let accessToken = localStorage.getItem('accessToken')
      let idToken = localStorage.getItem('idToken')
      const refreshToken = localStorage.getItem('refreshToken')

      if (!accessToken || !idToken) {
        return false
      }

      // Check if token is expired or expiring soon
      const payload = auth.decodeToken(idToken)
      const isExpired = payload && payload.exp * 1000 < Date.now()
      const isExpiringSoon = this.isTokenExpiringSoon(idToken, 5)

      // If expired or expiring soon, try to refresh
      if ((isExpired || isExpiringSoon) && refreshToken) {
        try {
          // Update refresh token in state before attempting refresh
          this.refreshToken = refreshToken
          await this.refreshTokens()
          // Get updated tokens from state
          accessToken = this.accessToken
          idToken = this.idToken
        } catch (error) {
          console.error('Failed to refresh tokens:', error)
          // Refresh failed, clear auth and return false
          this.clearAuth()
          return false
        }
      } else if (isExpired && !refreshToken) {
        // Token expired and no refresh token available
        console.warn('Token expired and no refresh token available')
        this.clearAuth()
        return false
      }

      // Set tokens in state
      this.accessToken = accessToken
      this.idToken = idToken
      this.refreshToken = refreshToken || this.refreshToken

      try {
        await this.fetchUser()
        return true
      } catch (error) {
        console.error('checkAuth failed:', error)
        // If fetchUser fails, try refreshing tokens once more
        if (this.refreshToken && !this.isTokenExpiringSoon(this.idToken, 0)) {
          try {
            await this.refreshTokens()
            await this.fetchUser()
            return true
          } catch (refreshError) {
            console.error('Retry with refresh failed:', refreshError)
            this.clearAuth()
            return false
          }
        } else {
          this.clearAuth()
          return false
        }
      }
    },

    // Ensure tokens are valid before making API calls
    // Call this before any authenticated API request
    async ensureValidToken() {
      if (!this.idToken) {
        return false
      }

      const isExpired = this.isTokenExpiringSoon(this.idToken, 0)
      const isExpiringSoon = this.isTokenExpiringSoon(this.idToken, 5)

      if ((isExpired || isExpiringSoon) && this.refreshToken) {
        try {
          await this.refreshTokens()
          return true
        } catch (error) {
          console.error('Failed to refresh tokens in ensureValidToken:', error)
          return false
        }
      }

      return !isExpired
    },

    // Get access token, refreshing if needed
    async getAccessToken() {
      const isValid = await this.ensureValidToken()
      if (!isValid) {
        throw new Error('Unable to obtain valid access token')
      }
      return this.accessToken
    },
  },
})
