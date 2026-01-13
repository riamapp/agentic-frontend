import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      component: () => import('@/HomeView.vue'),
    },
    {
      path: '/account',
      component: () => import('@/AccountView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/agent',
      component: () => import('@/AgentView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/auth/callback',
      component: () => import('@/CallbackView.vue'),
    },
    {
      path: '/auth/google/callback',
      component: () => import('@/GoogleCallbackView.vue'),
    },
    {
      path: '/login',
      component: () => import('@/LoginView.vue'),
      meta: { requiresGuest: true },
    },
  ],
})

router.beforeEach(async (to, from, next) => {
  // Skip auth check for callback routes
  if (to.path === '/auth/callback' || to.path === '/auth/google/callback') {
    next()
    return
  }

  const authStore = useAuthStore()

  await authStore.checkAuth()

  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    // Store the intended route so we can redirect back after login
    sessionStorage.setItem('authRedirect', to.fullPath)
    authStore.login() // Redirect to Cognito hosted UI
    return
  } else if (to.meta.requiresGuest && authStore.isAuthenticated) {
    next('/')
  } else {
    next()
  }
})

export default router
