<script setup>
import { ref, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { usePreferencesStore } from '@/stores/preferences'
import { useImages } from '@/composables/useImages'

const authStore = useAuthStore()
const preferencesStore = usePreferencesStore()
const { fetchImageUrl } = useImages()

const activeTab = ref('users')
const sidebarOpen = ref(false)
const profilePictureUrl = ref(null)

const toggleSidebar = () => {
  sidebarOpen.value = !sidebarOpen.value
}

onMounted(async () => {
  if (preferencesStore.displayPicture) {
    const url = await fetchImageUrl(preferencesStore.displayPicture)
    profilePictureUrl.value = url
  } else if (authStore.userPicture) {
    profilePictureUrl.value = authStore.userPicture
  }
})

const handleLogout = async () => {
  await authStore.logout()
}
</script>

<template>
  <div>
    <!-- Navigation Bar -->
    <nav class="navbar navbar-expand-lg navbar-dark navbar-custom navbar-tall">
      <div class="container-fluid">
        <RouterLink to="/" class="navbar-brand d-flex align-items-center">
          <span class="navbar-brand-text">Accordo AI</span>
        </RouterLink>
        <button class="navbar-toggler" type="button" @click="toggleSidebar">
          <span class="navbar-toggler-icon"></span>
        </button>
        <div class="collapse navbar-collapse" id="navbarNav">
          <ul class="navbar-nav ms-auto">
            <li class="nav-item dropdown">
              <a class="nav-link position-relative" href="#" id="notificationDropdown" role="button" data-bs-toggle="dropdown">
                <i class="bi bi-bell fs-5"></i>
                <span class="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">7</span>
              </a>
              <ul class="dropdown-menu dropdown-menu-end">
                <li><h6 class="dropdown-header">Notifications</h6></li>
                <li><a class="dropdown-item" href="#">New user registration pending approval</a></li>
                <li><a class="dropdown-item" href="#">System backup completed</a></li>
                <li><hr class="dropdown-divider" /></li>
                <li><a class="dropdown-item text-center" href="#">View All Notifications</a></li>
              </ul>
            </li>
            <li class="nav-item dropdown ms-3">
              <a class="nav-link dropdown-toggle d-flex align-items-center" href="#" id="profileDropdown" role="button" data-bs-toggle="dropdown">
                <img v-if="profilePictureUrl" :src="profilePictureUrl" alt="Profile" class="profile-pic me-2" />
                <i v-else class="bi bi-person-circle fs-4 me-2"></i>
                <span>{{ preferencesStore.effectiveDisplayName || 'Admin User' }}</span>
              </a>
              <ul class="dropdown-menu dropdown-menu-end">
                <li><RouterLink to="/account" class="dropdown-item">Account</RouterLink></li>
                <li><a class="dropdown-item" href="#" @click.prevent="handleLogout">Logout</a></li>
              </ul>
            </li>
          </ul>
        </div>
      </div>
    </nav>

    <!-- Sidebar Navigation -->
    <div class="sidebar" :class="{ show: sidebarOpen }">
      <div class="nav flex-column nav-pills" id="adminNav" role="tablist">
        <a class="nav-link" :class="{ active: activeTab === 'users' }" @click="activeTab = 'users'">
          <i class="bi bi-people"></i>Users
        </a>
        <a class="nav-link" :class="{ active: activeTab === 'profile' }" @click="activeTab = 'profile'">
          <i class="bi bi-person-circle"></i>Profile
        </a>
        <a class="nav-link" :class="{ active: activeTab === 'courses' }" @click="activeTab = 'courses'">
          <i class="bi bi-music-note-beamed"></i>Programmes
        </a>
        <a class="nav-link" :class="{ active: activeTab === 'reports' }" @click="activeTab = 'reports'">
          <i class="bi bi-file-earmark-bar-graph"></i>Reports
        </a>
        <a class="nav-link" :class="{ active: activeTab === 'settings' }" @click="activeTab = 'settings'">
          <i class="bi bi-gear"></i>Settings
        </a>
        <a class="nav-link" :class="{ active: activeTab === 'ai-monitoring' }" @click="activeTab = 'ai-monitoring'">
          <i class="bi bi-eye"></i>AI Monitoring
        </a>
      </div>
    </div>

    <!-- Main Content -->
    <div class="main-content">
      <div class="container-fluid">
        <div class="row">
          <div class="col-12">
            <h2>Admin Dashboard</h2>
            <p class="page-description">Manage system settings, users, and monitor overall platform performance.</p>
            <hr />
          </div>
        </div>

        <!-- Tab Content -->
        <div class="row">
          <div class="col-12">
            <!-- Users Tab -->
            <div v-show="activeTab === 'users'" class="tab-pane fade" :class="{ 'show active': activeTab === 'users' }">
              <div class="d-flex justify-content-between align-items-center mb-3">
                <h4>User Management</h4>
                <button class="btn btn-primary-custom">Add New User</button>
              </div>
              <div class="table-responsive">
                <table class="table table-striped">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Aoife Byrne</td>
                      <td>aoife.byrne@riam.student.ie</td>
                      <td><span class="badge bg-primary">Student</span></td>
                      <td><span class="badge bg-success">Active</span></td>
                      <td>
                        <button class="btn btn-sm btn-warning">Edit</button>
                        <button class="btn btn-sm btn-danger">Delete</button>
                      </td>
                    </tr>
                    <tr>
                      <td>Ms. Niamh O'Donnell</td>
                      <td>niamh.odonnell@riam.ie</td>
                      <td><span class="badge bg-success">Teacher</span></td>
                      <td><span class="badge bg-success">Active</span></td>
                      <td>
                        <button class="btn btn-sm btn-warning">Edit</button>
                        <button class="btn btn-sm btn-danger">Delete</button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <!-- Profile Tab -->
            <div v-show="activeTab === 'profile'" class="tab-pane fade" :class="{ 'show active': activeTab === 'profile' }">
              <h4>Admin Profile</h4>
              <div class="row">
                <div class="col-md-8">
                  <div class="card mb-3">
                    <div class="card-header bg-primary-custom text-white">
                      <h5 class="mb-0">Personal Information</h5>
                    </div>
                    <div class="card-body">
                      <div class="row mb-3">
                        <div class="col-md-6">
                          <label class="form-label text-muted">Name</label>
                          <p class="fw-bold">{{ preferencesStore.effectiveDisplayName || 'Admin User' }}</p>
                        </div>
                        <div class="col-md-6">
                          <label class="form-label text-muted">Email</label>
                          <p class="fw-bold">{{ authStore.userEmail || 'admin@riam.ie' }}</p>
                        </div>
                      </div>
                      <div class="row mb-3">
                        <div class="col-md-6">
                          <label class="form-label text-muted">Role</label>
                          <p><span class="badge bg-danger">Administrator</span></p>
                        </div>
                        <div class="col-md-6">
                          <label class="form-label text-muted">Status</label>
                          <p><span class="badge bg-success">Active</span></p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div class="col-md-4">
                  <div class="card mb-3">
                    <div class="card-header bg-primary-custom text-white">
                      <h5 class="mb-0">System Stats</h5>
                    </div>
                    <div class="card-body">
                      <p class="mb-2"><i class="bi bi-people text-primary"></i> <strong>Total Students:</strong> 5</p>
                      <p class="mb-2"><i class="bi bi-person-badge text-success"></i> <strong>Total Teachers:</strong> 5</p>
                      <p class="mb-2"><i class="bi bi-music-note-beamed text-info"></i> <strong>Programmes:</strong> 4</p>
                      <p class="mb-2"><i class="bi bi-eye text-warning"></i> <strong>AI Interactions:</strong> 247</p>
                      <p class="mb-0"><i class="bi bi-server text-danger"></i> <strong>System Uptime:</strong> 99.8%</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Programmes Tab -->
            <div v-show="activeTab === 'courses'" class="tab-pane fade" :class="{ 'show active': activeTab === 'courses' }">
              <div class="d-flex justify-content-between align-items-center mb-3">
                <h4>Programme Management</h4>
                <button class="btn btn-primary-custom">Create New Programme</button>
              </div>
              <div class="row">
                <div class="col-md-4 mb-3">
                  <div class="card">
                    <div class="card-body">
                      <h5 class="card-title">Junior RIAM (Years 1-2)</h5>
                      <p class="card-text">Foundation level music education for young students</p>
                      <p class="mb-1"><small class="text-muted">Students: 1</small></p>
                      <p class="mb-1"><small class="text-muted">Teacher: Ms. Niamh O'Donnell</small></p>
                      <button class="btn btn-sm btn-warning mt-2">Edit</button>
                      <button class="btn btn-sm btn-danger mt-2">Delete</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Reports Tab -->
            <div v-show="activeTab === 'reports'" class="tab-pane fade" :class="{ 'show active': activeTab === 'reports' }">
              <h4>System Reports</h4>
              <div class="row">
                <div class="col-md-6 mb-3">
                  <div class="card">
                    <div class="card-body">
                      <h5 class="card-title">Enrollment Report</h5>
                      <p class="card-text">View student enrollment trends and statistics.</p>
                      <button class="btn btn-primary-custom">Generate Report</button>
                    </div>
                  </div>
                </div>
                <div class="col-md-6 mb-3">
                  <div class="card">
                    <div class="card-body">
                      <h5 class="card-title">Performance Report</h5>
                      <p class="card-text">Analyze overall student and teacher performance.</p>
                      <button class="btn btn-primary-custom">Generate Report</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Settings Tab -->
            <div v-show="activeTab === 'settings'" class="tab-pane fade" :class="{ 'show active': activeTab === 'settings' }">
              <h4>System Settings</h4>
              <div class="card">
                <div class="card-body">
                  <form>
                    <div class="mb-3">
                      <label for="siteName" class="form-label">Site Name</label>
                      <input type="text" class="form-control" id="siteName" value="Accordo AI">
                    </div>
                    <div class="mb-3">
                      <label for="adminEmail" class="form-label">Admin Email</label>
                      <input type="email" class="form-control" id="adminEmail" value="admin@riam.ie">
                    </div>
                    <div class="mb-3">
                      <label for="timezone" class="form-label">Timezone</label>
                      <select class="form-select" id="timezone">
                        <option>UTC+0 (GMT)</option>
                        <option>UTC+1 (CET)</option>
                        <option>UTC-5 (EST)</option>
                      </select>
                    </div>
                    <div class="mb-3 form-check">
                      <input type="checkbox" class="form-check-input" id="maintenance">
                      <label class="form-check-label" for="maintenance">
                        Enable Maintenance Mode
                      </label>
                    </div>
                    <button type="submit" class="btn btn-primary-custom">Save Settings</button>
                  </form>
                </div>
              </div>
            </div>

            <!-- AI Monitoring Tab -->
            <div v-show="activeTab === 'ai-monitoring'" class="tab-pane fade" :class="{ 'show active': activeTab === 'ai-monitoring' }">
              <h4>AI Monitoring & Analytics</h4>
              <p class="page-description">Comprehensive monitoring of all AI interactions including student-AI and teacher-AI conversations.</p>
              <div class="row mb-4">
                <div class="col-md-3 mb-3">
                  <div class="card">
                    <div class="card-body">
                      <h6 class="card-title">Total AI Conversations</h6>
                      <h3 class="text-primary-custom">3,456</h3>
                      <small class="text-muted">All time</small>
                    </div>
                  </div>
                </div>
                <div class="col-md-3 mb-3">
                  <div class="card">
                    <div class="card-body">
                      <h6 class="card-title">Active Today</h6>
                      <h3 class="text-success">142</h3>
                      <small class="text-muted">+23% vs yesterday</small>
                    </div>
                  </div>
                </div>
                <div class="col-md-3 mb-3">
                  <div class="card">
                    <div class="card-body">
                      <h6 class="card-title">Uploads Analyzed</h6>
                      <h3 class="text-info">892</h3>
                      <small class="text-muted">This month</small>
                    </div>
                  </div>
                </div>
                <div class="col-md-3 mb-3">
                  <div class="card">
                    <div class="card-body">
                      <h6 class="card-title">Avg Response Time</h6>
                      <h3 class="text-warning">1.1s</h3>
                      <small class="text-muted">System performance</small>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Mobile Sidebar Toggle -->
    <button class="sidebar-toggle" @click="toggleSidebar">
      <i class="bi bi-list"></i>
    </button>
  </div>
</template>

<style scoped>
/* Dashboard styles are in dashboard.css */
</style>
