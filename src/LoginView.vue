<script setup>
import { ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const activeTab = ref('student')

// Form data
const studentId = ref('')
const studentPassword = ref('')
const studentRemember = ref(false)

const staffEmail = ref('')
const staffPassword = ref('')
const staffRemember = ref(false)

const adminEmail = ref('')
const adminPassword = ref('')
const adminRemember = ref(false)

const handleLogin = async (userType) => {
  // Store the user type/role for post-auth routing
  // Use both sessionStorage and localStorage to ensure it persists through Cognito redirect
  sessionStorage.setItem('userRole', userType)
  localStorage.setItem('userRole', userType)
  console.log('🔐 Storing user role for redirect:', userType)
  console.log('📦 Stored in sessionStorage:', sessionStorage.getItem('userRole'))
  console.log('📦 Stored in localStorage:', localStorage.getItem('userRole'))
  // Redirect to Cognito login
  await authStore.login()
}

const handleStudentLogin = () => {
  handleLogin('student')
}

const handleStaffLogin = () => {
  handleLogin('teacher') // Staff = Teacher
}

const handleAdminLogin = () => {
  handleLogin('admin')
}
</script>

<template>
  <div class="login-container">
    <div class="container">
      <div class="row justify-content-center">
        <div class="col-md-8 col-lg-6">
          <div class="card login-card">
            <div class="card-body p-5">
              <div class="text-center mb-4">
                <RouterLink to="/" class="auth-logo-link d-flex flex-column align-items-center">
                  <img src="/Riam%20Logo.png" alt="RIAM Logo" style="height: 60px; margin-bottom: 12px;" />
                  <div class="logo-text" style="cursor: pointer;">Accordo AI</div>
                </RouterLink>
                <div class="auth-logo-subtitle">Digital Music Passport & AI Coaching</div>
              </div>

              <!-- Login Tabs -->
              <ul class="nav nav-tabs mb-4" id="loginTabs" role="tablist">
                <li class="nav-item tab-item-flex" role="presentation">
                  <button
                    class="nav-link"
                    :class="{ active: activeTab === 'student' }"
                    @click="activeTab = 'student'"
                    type="button"
                  >
                    Student
                  </button>
                </li>
                <li class="nav-item tab-item-flex" role="presentation">
                  <button
                    class="nav-link"
                    :class="{ active: activeTab === 'staff' }"
                    @click="activeTab = 'staff'"
                    type="button"
                  >
                    Staff
                  </button>
                </li>
                <li class="nav-item tab-item-flex" role="presentation">
                  <button
                    class="nav-link"
                    :class="{ active: activeTab === 'admin' }"
                    @click="activeTab = 'admin'"
                    type="button"
                  >
                    Admin
                  </button>
                </li>
              </ul>

              <!-- Tab Content -->
              <div class="tab-content" id="loginTabsContent">
                <!-- Student Login Form -->
                <div v-show="activeTab === 'student'" class="tab-pane fade" :class="{ 'show active': activeTab === 'student' }">
                  <form @submit.prevent="handleStudentLogin">
                    <div class="mb-3">
                      <label for="studentId" class="form-label">Student ID</label>
                      <input
                        type="text"
                        class="form-control"
                        id="studentId"
                        v-model="studentId"
                        placeholder="Enter your student ID"
                        required
                      />
                    </div>
                    <div class="mb-3">
                      <label for="studentPassword" class="form-label">Password</label>
                      <input
                        type="password"
                        class="form-control"
                        id="studentPassword"
                        v-model="studentPassword"
                        placeholder="Enter your password"
                        required
                      />
                    </div>
                    <div class="mb-3 form-check">
                      <input type="checkbox" class="form-check-input" id="studentRemember" v-model="studentRemember">
                      <label class="form-check-label" for="studentRemember">
                        Remember me
                      </label>
                    </div>
                    <button type="submit" class="btn btn-primary-custom w-100 mb-3">
                      Login as Student
                    </button>
                    <div class="text-center mb-3">
                      <a href="#" class="text-decoration-none">Forgot Password?</a>
                    </div>
                    <div class="text-center">
                      <p class="mb-0">Don't have an account? <RouterLink to="/signup" class="text-decoration-none">Sign up here</RouterLink></p>
                    </div>
                  </form>
                </div>

                <!-- Staff Login Form -->
                <div v-show="activeTab === 'staff'" class="tab-pane fade" :class="{ 'show active': activeTab === 'staff' }">
                  <form @submit.prevent="handleStaffLogin">
                    <div class="mb-3">
                      <label for="staffEmail" class="form-label">Email or Username</label>
                      <input
                        type="text"
                        class="form-control"
                        id="staffEmail"
                        v-model="staffEmail"
                        placeholder="Enter your email or username"
                        required
                      />
                    </div>
                    <div class="mb-3">
                      <label for="staffPassword" class="form-label">Password</label>
                      <input
                        type="password"
                        class="form-control"
                        id="staffPassword"
                        v-model="staffPassword"
                        placeholder="Enter your password"
                        required
                      />
                    </div>
                    <div class="mb-3 form-check">
                      <input type="checkbox" class="form-check-input" id="staffRemember" v-model="staffRemember">
                      <label class="form-check-label" for="staffRemember">
                        Remember me
                      </label>
                    </div>
                    <button type="submit" class="btn btn-primary-custom w-100 mb-3">
                      Login as Staff
                    </button>
                    <div class="text-center mb-3">
                      <a href="#" class="text-decoration-none">Forgot Password?</a>
                    </div>
                    <div class="text-center">
                      <p class="mb-0">Don't have an account? <RouterLink to="/signup" class="text-decoration-none">Sign up here</RouterLink></p>
                    </div>
                  </form>
                </div>

                <!-- Admin Login Form -->
                <div v-show="activeTab === 'admin'" class="tab-pane fade" :class="{ 'show active': activeTab === 'admin' }">
                  <form @submit.prevent="handleAdminLogin">
                    <div class="mb-3">
                      <label for="adminEmail" class="form-label">Email or Username</label>
                      <input
                        type="text"
                        class="form-control"
                        id="adminEmail"
                        v-model="adminEmail"
                        placeholder="Enter your email or username"
                        required
                      />
                    </div>
                    <div class="mb-3">
                      <label for="adminPassword" class="form-label">Password</label>
                      <input
                        type="password"
                        class="form-control"
                        id="adminPassword"
                        v-model="adminPassword"
                        placeholder="Enter your password"
                        required
                      />
                    </div>
                    <div class="mb-3 form-check">
                      <input type="checkbox" class="form-check-input" id="adminRemember" v-model="adminRemember">
                      <label class="form-check-label" for="adminRemember">
                        Remember me
                      </label>
        </div>
                    <button type="submit" class="btn btn-primary-custom w-100 mb-3">
                      Login as Admin
        </button>
                    <div class="text-center mb-3">
                      <a href="#" class="text-decoration-none">Forgot Password?</a>
                    </div>
                  </form>
                </div>
              </div>
            </div>
      </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Login page styles are in dashboard.css */
</style>
