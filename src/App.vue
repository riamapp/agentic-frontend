<script setup>
import { watch, computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { usePreferencesStore } from '@/stores/preferences'
import { useToast } from '@/composables/useToast'
import { useImages } from '@/composables/useImages'

const route = useRoute()
const authStore = useAuthStore()
const preferencesStore = usePreferencesStore()
const { toasts, removeToast } = useToast()
const { fetchImageUrl } = useImages()
const headerPictureUrl = ref(null)

// Check if current route is a dashboard route (has its own layout)
const isDashboardRoute = computed(() => {
  return route.path.startsWith('/student') || 
         route.path.startsWith('/teacher') || 
         route.path.startsWith('/admin')
})

// Check if current route is a simple page (landing, login, signup)
const isSimplePage = computed(() => {
  return route.path === '/' || 
         route.path === '/login' || 
         route.path === '/signup'
})

// Computed effective picture for header
const effectivePicture = computed(() => {
  return preferencesStore.effectiveDisplayPicture
})

// Watch for changes and fetch URL if it's an S3 key
watch(
  effectivePicture,
  async (picture) => {
    if (!picture) {
      headerPictureUrl.value = null
      return
    }

    // If it's already a URL (OAuth picture), use it directly
    if (picture.startsWith('http://') || picture.startsWith('https://')) {
      headerPictureUrl.value = picture
    } else {
      // It's an S3 key, fetch the presigned URL
      const url = await fetchImageUrl(picture)
      headerPictureUrl.value = url
    }
  },
  { immediate: true },
)

// Handle header avatar image errors (e.g., broken Google image / rate limits)
const handleHeaderImageError = () => {
  headerPictureUrl.value = null
}

// Load preferences when authentication state changes
// This handles both initial load and subsequent auth state changes
watch(
  () => authStore.isAuthenticated,
  async (isAuthenticated) => {
    if (isAuthenticated) {
      // Only load if not already loading to prevent duplicate calls
      if (!preferencesStore.loading) {
        await preferencesStore.loadPreferences()
      }
    } else {
      // Apply default light theme when logged out
      preferencesStore.theme = 'light'
      preferencesStore.applyTheme('light')
    }
  },
  { immediate: true },
)
</script>

<template>
  <!-- Dashboard routes have their own layout built-in -->
  <RouterView v-if="isDashboardRoute" />

  <!-- Simple pages (landing, login, signup) have no wrapper -->
  <RouterView v-else-if="isSimplePage" />

  <!-- Other pages (account, agent) use the default layout -->
  <div v-else class="min-vh-100">
    <nav class="navbar navbar-expand-lg border-bottom border-body">
      <div class="container">
        <RouterLink to="/" class="navbar-brand">Agentic PoC</RouterLink>
        <button
          class="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarSupportedContent"
          aria-controls="navbarSupportedContent"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span class="navbar-toggler-icon"></span>
        </button>
        <div class="collapse navbar-collapse" id="navbarSupportedContent">
          <ul class="navbar-nav me-auto mb-2 mb-lg-0">
            <li v-if="authStore.isAuthenticated" class="nav-item">
              <RouterLink to="/agent" class="nav-link" active-class="active">Agent</RouterLink>
            </li>
          </ul>
          <ul class="navbar-nav">
            <li v-if="authStore.isAuthenticated" class="nav-item">
              <RouterLink
                to="/account"
                class="nav-link d-flex align-items-center gap-2"
                active-class="active"
                aria-label="Account"
              >
                <img
                  v-if="headerPictureUrl"
                  :src="headerPictureUrl"
                  alt="User avatar"
                  class="rounded-circle border border-2 border-secondary"
                  style="width: 32px; height: 32px; object-fit: cover"
                  @error="handleHeaderImageError"
                />
                <i v-else class="bi bi-person-circle fs-4"></i>
                <span v-if="preferencesStore.effectiveDisplayName" class="d-none d-lg-inline">
                  {{ preferencesStore.effectiveDisplayName }}
                </span>
              </RouterLink>
            </li>
            <li v-else class="nav-item">
              <RouterLink to="/login" class="nav-link" active-class="active"> Login </RouterLink>
            </li>
          </ul>
        </div>
      </div>
    </nav>

    <main class="container mt-4">
      <div class="row">
        <div class="col-md-8 offset-md-2">
          <RouterView />
        </div>
      </div>
    </main>
  </div>

  <!-- Toast Container -->
  <div
    class="toast-container position-fixed bottom-0 start-0 p-3"
    style="z-index: 11"
    aria-live="polite"
    aria-atomic="true"
  >
    <div
      v-for="toast in toasts"
      :key="toast.id"
      :data-toast-id="toast.id"
      class="toast"
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
      data-bs-autohide="true"
      :data-bs-delay="toast.duration"
    >
      <div class="toast-header">
        <i
          :class="{
            'bi bi-check-circle-fill text-success': toast.type === 'success',
            'bi bi-exclamation-triangle-fill text-danger': toast.type === 'danger',
            'bi bi-exclamation-circle-fill text-warning': toast.type === 'warning',
            'bi bi-info-circle-fill text-info': toast.type === 'info',
          }"
        ></i>
        <strong class="me-auto ms-2">{{
          toast.type === 'success'
            ? 'Success'
            : toast.type === 'danger'
              ? 'Error'
              : toast.type === 'warning'
                ? 'Warning'
                : 'Info'
        }}</strong>
        <button
          type="button"
          class="btn-close"
          data-bs-dismiss="toast"
          aria-label="Close"
          @click="removeToast(toast.id)"
        ></button>
      </div>
      <div class="toast-body">{{ toast.message }}</div>
    </div>
  </div>
</template>

<style scoped></style>
