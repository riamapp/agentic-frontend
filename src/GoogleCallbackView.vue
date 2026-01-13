<script setup>
import { onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useToast } from '@/composables/useToast'
import { useGoogleDriveStore } from '@/stores/googleDriveAuth'

const route = useRoute()
const router = useRouter()
const { showSuccess, showError } = useToast()
const googleDriveStore = useGoogleDriveStore()

onMounted(async () => {
  // Get service name from query parameter (gmail, drive, calendar, etc.)
  const serviceName = route.query.service || 'drive'

  // Map service name to display name
  const serviceDisplayNames = {
    gmail: 'Gmail',
    drive: 'Google Drive',
    calendar: 'Google Calendar',
  }
  const serviceDisplayName =
    serviceDisplayNames[serviceName] || serviceName.charAt(0).toUpperCase() + serviceName.slice(1)

  const result = googleDriveStore.handleCallback({
    success: route.query.success,
    user_id: route.query.user_id,
    error: route.query.error,
    error_description: route.query.error_description,
  })

  if (result.success) {
    console.log(`${serviceDisplayName} authorization successful for user:`, result.user_id)
    const toastId = showSuccess(`${serviceDisplayName} successfully connected!`)
    // Redirect to agent page after toast is shown (event-driven via toast rendering)
    // Use nextTick to ensure toast is in DOM, then redirect immediately
    // User will see the toast briefly before redirect
    router.push('/agent')
  } else {
    console.error(`${serviceDisplayName} OAuth error:`, result.error)
    const toastId = showError(`${serviceDisplayName} authorization failed: ${result.error}`)
    // Redirect to agent page after toast is shown (event-driven via toast rendering)
    router.push('/agent')
  }
})
</script>

<template>
  <div class="container mt-5 text-center">
    <div class="spinner-border" role="status">
      <span class="visually-hidden">Processing...</span>
    </div>
    <p class="mt-3">Completing Google authorization...</p>
  </div>
</template>

<style scoped></style>
