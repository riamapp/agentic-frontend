<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { RouterLink } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { usePreferencesStore } from '@/stores/preferences'
import { useImages } from '@/composables/useImages'
import AgentView from '@/AgentView.vue'

const authStore = useAuthStore()
const preferencesStore = usePreferencesStore()
const { fetchImageUrl } = useImages()

const activeTab = ref('overview')
const sidebarOpen = ref(false)
const profilePictureUrl = ref(null)

// Student data (mock - will be replaced with API calls later)
const studentInfo = ref({
  name: 'Aoife Byrne',
  age: 10,
  stage: 'Development',
  studentId: 'S01',
  instruments: 'Violin – Strings',
  programme: 'Junior RIAM (Years 1-2)'
})

const toggleSidebar = () => {
  sidebarOpen.value = !sidebarOpen.value
}

// Load profile picture
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
                <span class="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">3</span>
              </a>
              <ul class="dropdown-menu dropdown-menu-end">
                <li><h6 class="dropdown-header">Notifications</h6></li>
                <li><a class="dropdown-item" href="#">New assignment posted in Junior RIAM (Years 1–2)</a></li>
                <li><a class="dropdown-item" href="#">Feedback received for Junior RIAM (Years 1–2)</a></li>
                <li><a class="dropdown-item" href="#">Upcoming recital in 3 days</a></li>
                <li><hr class="dropdown-divider" /></li>
                <li><a class="dropdown-item text-center" href="#">View All Notifications</a></li>
              </ul>
            </li>
            <li class="nav-item dropdown ms-3">
              <a class="nav-link dropdown-toggle d-flex align-items-center" href="#" id="profileDropdown" role="button" data-bs-toggle="dropdown">
                <img v-if="profilePictureUrl" :src="profilePictureUrl" alt="Profile" class="profile-pic me-2" />
                <i v-else class="bi bi-person-circle fs-4 me-2"></i>
                <span>{{ preferencesStore.effectiveDisplayName || studentInfo.name }}</span>
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
      <div class="nav flex-column nav-pills" id="studentNav" role="tablist">
        <a class="nav-link" :class="{ active: activeTab === 'overview' }" @click="activeTab = 'overview'">
          <i class="bi bi-house-door"></i>Overview
        </a>
        <a class="nav-link" :class="{ active: activeTab === 'profile' }" @click="activeTab = 'profile'">
          <i class="bi bi-person-circle"></i>Profile
        </a>
        <a class="nav-link" :class="{ active: activeTab === 'courses' }" @click="activeTab = 'courses'">
          <i class="bi bi-music-note-beamed"></i>My Programmes
        </a>
        <a class="nav-link" :class="{ active: activeTab === 'goals' }" @click="activeTab = 'goals'">
          <i class="bi bi-bullseye"></i>Goals
        </a>
        <a class="nav-link" :class="{ active: activeTab === 'resources' }" @click="activeTab = 'resources'">
          <i class="bi bi-folder"></i>Resources
        </a>
        <a class="nav-link" :class="{ active: activeTab === 'uploads' }" @click="activeTab = 'uploads'">
          <i class="bi bi-cloud-upload"></i>Uploads
        </a>
        <a class="nav-link" :class="{ active: activeTab === 'personal-journal' }" @click="activeTab = 'personal-journal'">
          <i class="bi bi-journal-text"></i>Personal Journal
        </a>
        <a class="nav-link" :class="{ active: activeTab === 'professional-journal' }" @click="activeTab = 'professional-journal'">
          <i class="bi bi-journal-bookmark"></i>Professional Journal
        </a>
        <a class="nav-link" :class="{ active: activeTab === 'feedbacks' }" @click="activeTab = 'feedbacks'">
          <i class="bi bi-chat-left-quote"></i>Feedbacks
        </a>
        <a class="nav-link" :class="{ active: activeTab === 'ai-coach' }" @click="activeTab = 'ai-coach'">
          <i class="bi bi-robot"></i>AI Coach
        </a>
      </div>
    </div>

    <!-- Main Content -->
    <div class="main-content">
      <div class="container-fluid">
        <div class="row">
          <div class="col-12">
            <h2>Student Dashboard</h2>
            <p class="page-description">Welcome back!</p>

            <!-- Student Info -->
            <div class="card mb-3">
              <div class="card-body">
                <div class="row">
                  <div class="col-md-4">
                    <p class="mb-1"><strong>Name:</strong> {{ studentInfo.name }}</p>
                  </div>
                  <div class="col-md-4">
                    <p class="mb-1"><strong>Age:</strong> {{ studentInfo.age }}</p>
                  </div>
                  <div class="col-md-4">
                    <p class="mb-1"><strong>Stage:</strong> {{ studentInfo.stage }}</p>
                  </div>
                  <div class="col-md-4">
                    <p class="mb-1"><strong>Student ID:</strong> {{ studentInfo.studentId }}</p>
                  </div>
                  <div class="col-md-4">
                    <p class="mb-1"><strong>Instruments:</strong> {{ studentInfo.instruments }}</p>
                  </div>
                </div>
              </div>
            </div>
            <hr />
          </div>
        </div>

        <!-- Tab Content -->
        <div class="row">
          <div class="col-12">
            <!-- Overview Tab -->
            <div v-show="activeTab === 'overview'" class="tab-pane fade" :class="{ 'show active': activeTab === 'overview' }">
              <!-- Quick Stats -->
              <div class="row mb-4">
                <div class="col-md-3 mb-3">
                  <div class="card">
                    <div class="card-body">
                      <h5 class="card-title">Programme</h5>
                      <p class="mb-0"><strong>Junior RIAM</strong></p>
                      <small class="text-muted">Years 1-2</small>
                    </div>
                  </div>
                </div>
                <div class="col-md-3 mb-3">
                  <div class="card">
                    <div class="card-body">
                      <h5 class="card-title">Active Goals</h5>
                      <h2 class="text-primary-custom">3</h2>
                      <small class="text-muted">Pieces in progress</small>
                    </div>
                  </div>
                </div>
                <div class="col-md-3 mb-3">
                  <div class="card">
                    <div class="card-body">
                      <h5 class="card-title">Average Score</h5>
                      <h2 class="text-warning">59%</h2>
                      <small class="text-muted">Across all quadrants</small>
                    </div>
                  </div>
                </div>
                <div class="col-md-3 mb-3">
                  <div class="card">
                    <div class="card-body">
                      <h5 class="card-title">Practice Streak</h5>
                      <h2 class="text-success"><i class="bi bi-fire"></i> 12</h2>
                      <small class="text-muted">Days in a row</small>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Badge Progress -->
              <div class="card mb-4">
                <div class="card-body">
                  <h5 class="card-title mb-3">Badge Progress</h5>
                  <p class="text-muted">Complete activities to unlock new badges!</p>
                  <div class="row">
                    <div class="col-md-4 mb-3">
                      <div class="card border-success">
                        <div class="card-body text-center">
                          <i class="bi bi-fire text-warning" style="font-size: 2.5rem;"></i>
                          <h6 class="mt-2">7-Day Streak</h6>
                          <span class="badge bg-success">Unlocked</span>
                          <div class="progress mt-2" style="height: 6px;">
                            <div class="progress-bar bg-success" role="progressbar" style="width: 100%"></div>
                          </div>
                          <small class="text-muted d-block mt-1">7/7 days</small>
                        </div>
                      </div>
                    </div>
                    <div class="col-md-4 mb-3">
                      <div class="card border-warning">
                        <div class="card-body text-center">
                          <i class="bi bi-alarm text-muted" style="font-size: 2.5rem;"></i>
                          <h6 class="mt-2">30-Day Streak</h6>
                          <span class="badge bg-warning text-dark">In Progress</span>
                          <div class="progress mt-2" style="height: 6px;">
                            <div class="progress-bar bg-warning" role="progressbar" style="width: 40%"></div>
                          </div>
                          <small class="text-muted d-block mt-1">12/30 days</small>
                        </div>
                      </div>
                    </div>
                    <div class="col-md-4 mb-3">
                      <div class="card border-secondary">
                        <div class="card-body text-center">
                          <i class="bi bi-award text-muted" style="font-size: 2.5rem;"></i>
                          <h6 class="mt-2">Master Performer</h6>
                          <span class="badge bg-secondary">Locked</span>
                          <div class="progress mt-2" style="height: 6px;">
                            <div class="progress-bar bg-secondary" role="progressbar" style="width: 20%"></div>
                          </div>
                          <small class="text-muted d-block mt-1">2/10 performances</small>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Quadrant Scores -->
              <div class="card mb-4">
                <div class="card-body">
                  <h5 class="card-title mb-3">Quadrant Scores</h5>
                  <ul class="list-unstyled mb-2">
                    <li><strong>Technical Skills & Competence:</strong> 58</li>
                    <li><strong>Compositional & Musicianship Knowledge:</strong> 55</li>
                    <li><strong>Repertoire & Cultural Knowledge:</strong> 60</li>
                    <li><strong>Performing Artistry:</strong> 62</li>
                  </ul>
                </div>
              </div>
            </div>

            <!-- Profile Tab -->
            <div v-show="activeTab === 'profile'" class="tab-pane fade" :class="{ 'show active': activeTab === 'profile' }">
              <h4>My Profile</h4>
              <div class="row">
                <div class="col-md-8">
                  <div class="card mb-3">
                    <div class="card-header bg-primary-custom text-white">
                      <h5 class="mb-0">Personal Information</h5>
                    </div>
                    <div class="card-body">
                      <div class="row mb-3">
                        <div class="col-md-6">
                          <label class="form-label text-muted">First Name</label>
                          <p class="fw-bold">Aoife</p>
                        </div>
                        <div class="col-md-6">
                          <label class="form-label text-muted">Last Name</label>
                          <p class="fw-bold">Byrne</p>
                        </div>
                      </div>
                      <div class="row mb-3">
                        <div class="col-md-6">
                          <label class="form-label text-muted">Student ID</label>
                          <p class="fw-bold">S01</p>
                        </div>
                        <div class="col-md-6">
                          <label class="form-label text-muted">Email</label>
                          <p class="fw-bold">{{ authStore.userEmail || 'aoife.byrne@riam.student.ie' }}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div class="col-md-4">
                  <div class="card mb-3">
                    <div class="card-header bg-primary-custom text-white">
                      <h5 class="mb-0">Performance Scores</h5>
                    </div>
                    <div class="card-body">
                      <div class="mb-3">
                        <label class="form-label text-muted">Technical Skills & Competence</label>
                        <div class="progress" style="height: 25px;">
                          <div class="progress-bar bg-primary-custom" role="progressbar" style="width: 58%">58</div>
                        </div>
                      </div>
                      <div class="mb-3">
                        <label class="form-label text-muted">Compositional & Musicianship</label>
                        <div class="progress" style="height: 25px;">
                          <div class="progress-bar bg-info" role="progressbar" style="width: 55%">55</div>
                        </div>
                      </div>
                      <div class="mb-3">
                        <label class="form-label text-muted">Repertoire & Cultural Knowledge</label>
                        <div class="progress" style="height: 25px;">
                          <div class="progress-bar bg-success" role="progressbar" style="width: 60%">60</div>
                        </div>
                      </div>
                      <div class="mb-3">
                        <label class="form-label text-muted">Performing Artistry</label>
                        <div class="progress" style="height: 25px;">
                          <div class="progress-bar bg-warning" role="progressbar" style="width: 62%">62</div>
                        </div>
                      </div>
                      <hr>
                      <div>
                        <label class="form-label text-muted">Overall Average</label>
                        <h3 class="text-primary-custom">59%</h3>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- My Programmes Tab -->
            <div v-show="activeTab === 'courses'" class="tab-pane fade" :class="{ 'show active': activeTab === 'courses' }">
              <h4>My Programmes</h4>
              <div class="list-group">
                <a href="#" class="list-group-item list-group-item-action">
                  <div class="d-flex w-100 justify-content-between">
                    <h5 class="mb-1">Junior RIAM (Years 1–2)</h5>
                    <small>Ms. Niamh O'Donnell</small>
                  </div>
                </a>
              </div>
            </div>

            <!-- Goals Tab -->
            <div v-show="activeTab === 'goals'" class="tab-pane fade" :class="{ 'show active': activeTab === 'goals' }">
              <div class="d-flex justify-content-between align-items-center mb-3">
                <h4>My Goals</h4>
                <p class="text-muted mb-0">Goals are set by your teacher</p>
              </div>
              <div class="row">
                <div class="col-md-6 mb-3">
                  <div class="card">
                    <div class="card-body">
                      <h5 class="card-title">Twinkle Twinkle Variations A</h5>
                      <p class="card-text">Master this foundational piece with proper bow technique and intonation</p>
                      <div class="mt-2 mb-2">
                        <span class="badge bg-success me-1">Stage 1 ✓</span>
                        <span class="badge bg-success me-1">Stage 2 ✓</span>
                        <span class="badge bg-primary me-1">Stage 3 (Current)</span>
                        <span class="badge bg-secondary">Stage 4</span>
                      </div>
                      <div class="progress">
                        <div class="progress-bar bg-primary-custom" role="progressbar" style="width: 75%">75%</div>
                      </div>
                      <small class="text-muted mt-2 d-block">Due: February 15, 2026</small>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Resources Tab -->
            <div v-show="activeTab === 'resources'" class="tab-pane fade" :class="{ 'show active': activeTab === 'resources' }">
              <h4>Learning Resources</h4>
              <p class="text-muted">Access materials and resources shared by your instructors.</p>
              <div class="card mb-4">
                <div class="card-body">
                  <div class="row align-items-center">
                    <div class="col-md-3">
                      <label for="courseFilter" class="form-label mb-0">Filter by Course:</label>
                    </div>
                    <div class="col-md-9">
                      <select class="form-select" id="courseFilter">
                        <option selected>All Programmes</option>
                        <option>Junior RIAM (Years 1–2)</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Uploads Tab -->
            <div v-show="activeTab === 'uploads'" class="tab-pane fade" :class="{ 'show active': activeTab === 'uploads' }">
              <div class="d-flex justify-content-between align-items-center mb-3">
                <h4>My Uploads</h4>
                <button class="btn btn-primary-custom btn-sm">Upload New File</button>
              </div>
              <div class="table-responsive">
                <table class="table table-striped">
                  <thead>
                    <tr>
                      <th>File Name</th>
                      <th>Type</th>
                      <th>Upload Date</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td><i class="bi bi-file-music"></i> claps-4beat-rhythms.mp3</td>
                      <td>Audio</td>
                      <td>Jan 10, 2026</td>
                      <td>
                        <button class="btn btn-sm btn-info">View</button>
                        <button class="btn btn-sm btn-danger">Delete</button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <!-- Personal Journal Tab -->
            <div v-show="activeTab === 'personal-journal'" class="tab-pane fade" :class="{ 'show active': activeTab === 'personal-journal' }">
              <div class="d-flex justify-content-between align-items-center mb-3">
                <h4>Personal Journal</h4>
                <button class="btn btn-primary-custom btn-sm">New Entry</button>
              </div>
              <div class="card mb-3">
                <div class="card-body">
                  <h5 class="card-title">January 12, 2026</h5>
                  <p class="card-text">Rhythms feel tricky — singing first helps. I tried singing the Twinkle Variations before playing today and it made the rhythm much clearer!</p>
                  <small class="text-muted">Last edited: 2 hours ago</small>
                </div>
              </div>
            </div>

            <!-- Professional Journal Tab -->
            <div v-show="activeTab === 'professional-journal'" class="tab-pane fade" :class="{ 'show active': activeTab === 'professional-journal' }">
              <div class="d-flex justify-content-between align-items-center mb-3">
                <h4>Professional Journal</h4>
                <button class="btn btn-primary-custom btn-sm">New Entry</button>
              </div>
              <div class="card mb-3">
                <div class="card-body">
                  <h5 class="card-title">Class Performance - December 15, 2024</h5>
                  <p class="card-text">I was nervous, but proud when I played for the class. I remembered Ms. O'Donnell's advice: breathe, check feet, quiet bow placement before first note. It really helped me feel ready!</p>
                  <small class="text-muted">December 15, 2024</small>
                </div>
              </div>
            </div>

            <!-- Feedbacks Tab -->
            <div v-show="activeTab === 'feedbacks'" class="tab-pane fade" :class="{ 'show active': activeTab === 'feedbacks' }">
              <h4>Instructor Feedbacks</h4>
              <div class="card mb-3">
                <div class="card-body">
                  <div class="d-flex justify-content-between align-items-start">
                    <div>
                      <h5 class="card-title">Junior RIAM (Years 1–2) - Twinkle Variations Practice</h5>
                      <p class="mb-1"><strong>Grade:</strong> <span class="badge bg-warning">C+</span></p>
                    </div>
                    <small class="text-muted">Jan 11, 2026</small>
                  </div>
                  <p class="card-text mt-2">Good effort on Twinkle Variations! Remember to balance the violin on your shoulder and relax your right-hand thumb.</p>
                  <p class="mb-0"><small><strong>Instructor:</strong> Ms. Niamh O'Donnell</small></p>
                </div>
              </div>
            </div>

            <!-- AI Coach Tab -->
            <div v-show="activeTab === 'ai-coach'" class="tab-pane fade" :class="{ 'show active': activeTab === 'ai-coach' }">
              <h4>AI Coach</h4>
              <p class="text-muted">Chat with your AI assistant for personalized learning support.</p>
              <AgentView />
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
