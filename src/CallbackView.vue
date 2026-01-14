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
        return
      }

      // Determine user role and redirect to appropriate dashboard
      // First check if role was stored from login tab selection
      // Check both sessionStorage and localStorage (in case sessionStorage was cleared)
      let userRole = sessionStorage.getItem('userRole') || localStorage.getItem('userRole')
      
      console.log('Retrieved user role from storage:', userRole)
      
      // TODO: Later, get role from token claims or backend API
      // For now, use the role from login tab selection
      if (userRole) {
        // Keep role in localStorage for future sessions (until logout)
        // Don't remove it here - we'll clear it on logout
        localStorage.setItem('userRole', userRole)
        
        // Map role to dashboard route
        let dashboardRoute = '/student' // Default
        if (userRole === 'student') {
          dashboardRoute = '/student'
        } else if (userRole === 'teacher') {
          dashboardRoute = '/teacher'
        } else if (userRole === 'admin') {
          dashboardRoute = '/admin'
        }
        
        console.log('Redirecting to dashboard based on role:', userRole, '->', dashboardRoute)
        router.push(dashboardRoute)
      } else {
        // Default: redirect to student dashboard if no role stored
        // TODO: Get role from backend/token in future
        console.log('No role stored, redirecting to student dashboard...')
        router.push('/student')
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
