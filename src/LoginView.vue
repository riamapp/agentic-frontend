<script setup>
import { onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const route = useRoute()
const authStore = useAuthStore()
const error = route.query.error

onMounted(() => {
  // If no error, redirect to Cognito hosted UI
  if (!error) {
    authStore.login()
  }
})
</script>

<template>
  <div class="card bg-body-tertiary">
    <div class="card-body">
      <div v-if="error">
        <h1 class="card-title">Authentication Error</h1>
        <div class="alert alert-danger" role="alert">
          <i class="bi bi-exclamation-triangle-fill me-2"></i>
          <strong>Error:</strong> {{ error }}
        </div>
        <button @click="authStore.login()" class="btn btn-primary">
          <i class="bi bi-arrow-clockwise me-2"></i>Try Again
        </button>
      </div>
      <div v-else class="text-center">
        <div class="spinner-border" role="status">
          <span class="visually-hidden">Loading...</span>
        </div>
        <p class="mt-3 mb-0">Redirecting to login...</p>
      </div>
    </div>
  </div>
</template>

<style scoped></style>
