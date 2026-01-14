import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      component: () => import('@/LandingPageView.vue'),
    },
    {
      path: '/login',
      component: () => import('@/LoginView.vue'),
      meta: { requiresGuest: true },
    },
    {
      path: '/signup',
      component: () => import('@/SignupView.vue'),
      meta: { requiresGuest: true },
    },
    {
      path: '/student',
      component: () => import('@/StudentDashboardView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/teacher',
      component: () => import('@/TeacherDashboardView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/admin',
      component: () => import('@/AdminDashboardView.vue'),
      meta: { requiresAuth: true },
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

  // If authenticated user visits landing page, redirect to their dashboard
  if (to.path === '/' && authStore.isAuthenticated) {
    // Try to get role from localStorage or sessionStorage, default to student
    const userRole = localStorage.getItem('userRole') || sessionStorage.getItem('userRole') || 'student'
    const dashboardRoute = userRole === 'student' ? '/student' 
                          : userRole === 'teacher' ? '/teacher'
                          : userRole === 'admin' ? '/admin'
                          : '/student'
    console.log('Authenticated user visiting landing page, redirecting to:', dashboardRoute, 'based on role:', userRole)
    next(dashboardRoute)
    return
  }

  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    // Store the intended route so we can redirect back after login
    sessionStorage.setItem('authRedirect', to.fullPath)
    authStore.login() // Redirect to Cognito hosted UI
    return
  } else if (to.meta.requiresGuest && authStore.isAuthenticated) {
    // If authenticated user tries to access guest pages (login/signup), redirect to their dashboard
    // Check for stored role or default to student
    const userRole = localStorage.getItem('userRole') || sessionStorage.getItem('userRole') || 'student'
    const dashboardRoute = userRole === 'student' ? '/student' 
                          : userRole === 'teacher' ? '/teacher'
                          : userRole === 'admin' ? '/admin'
                          : '/student'
    console.log('Authenticated user accessing guest page, redirecting to:', dashboardRoute, 'based on role:', userRole)
    next(dashboardRoute)
  } else {
    next()
  }
})

export default router
