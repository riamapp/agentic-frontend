import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap/dist/js/bootstrap.bundle.min.js'
import 'bootstrap-icons/font/bootstrap-icons.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)

// Initialize default theme for unauthenticated users
import { usePreferencesStore } from './stores/preferences'

const preferencesStore = usePreferencesStore()

// Apply default system theme if not authenticated
// Auth check will be handled by router.beforeEach
// Preferences will be loaded by App.vue watcher when auth state changes
if (!localStorage.getItem('accessToken')) {
  preferencesStore.theme = 'system'
  preferencesStore.applyTheme('system')
}

app.mount('#app')
