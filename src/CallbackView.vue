<script setup>
import { onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { usePreferencesStore } from '@/stores/preferences'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const preferencesStore = usePreferencesStore()

onMounted(async () => {
  const code = route.query.code
  const error = route.query.error

  if (error) {
    console.error('Authentication error from Cognito:', error)
    router.push('/login?error=' + encodeURIComponent(error))
    return
  }

  if (code) {
    try {
      console.log('Received authorization code, exchanging for tokens...')
      await authStore.handleCallback(code)
      console.log('Authentication successful, loading preferences...')

      // Load preferences after successful authentication
      await preferencesStore.loadPreferences()

      // Check if there's a stored redirect route
      const redirectRoute = sessionStorage.getItem('authRedirect')
      if (redirectRoute) {
        sessionStorage.removeItem('authRedirect')
        console.log('Redirecting to stored route:', redirectRoute)
        router.push(redirectRoute)
      } else {
        console.log('No stored route, redirecting to home...')
        router.push('/')
      }
    } catch (err) {
      console.error('Callback error:', err)
      console.error('Auth store error:', authStore.error)
      sessionStorage.removeItem('authRedirect') // Clear on error
      router.push('/login?error=' + encodeURIComponent(err.message || 'authentication_failed'))
    }
  } else {
    console.warn('No authorization code or error in callback URL')
    router.push('/login?error=no_code')
  }
})
</script>

<template>
  <div class="container mt-5 text-center">
    <div v-if="authStore.loading" class="spinner-border" role="status">
      <span class="visually-hidden">Loading...</span>
    </div>
    <p class="mt-3">{{ authStore.loading ? 'Completing authentication...' : 'Redirecting...' }}</p>
    <div v-if="authStore.error" class="alert alert-danger mt-3" role="alert">
      <strong>Error:</strong> {{ authStore.error }}
    </div>
  </div>
</template>

<style scoped></style>
