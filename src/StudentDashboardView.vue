<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { usePreferencesStore } from '@/stores/preferences'
import { useImages } from '@/composables/useImages'
import { useFiles } from '@/composables/useFiles'
import AgentView from '@/AgentView.vue'

const authStore = useAuthStore()
const preferencesStore = usePreferencesStore()
const { fetchImageUrl } = useImages()
const { uploadFile, fetchFileUrl, deleteFile, getFeedback, listFiles } = useFiles()

const activeTab = ref('overview')
const sidebarOpen = ref(false)
const profilePictureUrl = ref(null)

// File upload state
const fileInputRef = ref(null)
const uploadingFile = ref(false)
const files = ref([])
const loadingFiles = ref(false)
const feedbackLoading = ref({}) // Track which file is loading feedback
const fileFeedbacks = ref({}) // Store feedback for each file

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

// Load profile picture and files
onMounted(async () => {
  if (preferencesStore.displayPicture) {
    const url = await fetchImageUrl(preferencesStore.displayPicture)
    profilePictureUrl.value = url
  } else if (authStore.userPicture) {
    profilePictureUrl.value = authStore.userPicture
  }
  
  // Load files when uploads tab might be accessed
  if (activeTab.value === 'uploads') {
    await loadFiles()
  }
})

  // Load files from backend
const loadFiles = async () => {
  loadingFiles.value = true
  try {
    const fileList = await listFiles()
    files.value = fileList.map(file => ({
      ...file,
      uploadDate: file.uploadDate || file.createdAt || new Date().toISOString()
    }))
  } catch (err) {
    console.error('Failed to load files:', err)
  } finally {
    loadingFiles.value = false
  }
}

// Handle file selection
const handleFileSelect = () => {
  fileInputRef.value?.click()
}

// Handle file input change
const handleFileChange = async (event) => {
  const file = event.target.files?.[0] || null
  if (!file) return

  // Reset input
  if (fileInputRef.value) {
    fileInputRef.value.value = ''
  }

  await uploadFileToS3(file)
}

// Upload file to S3
const uploadFileToS3 = async (file) => {
  uploadingFile.value = true
  try {
    const fileKey = await uploadFile(file)
    
    // Add file to list
    const newFile = {
      key: fileKey,
      fileName: file.name,
      type: getFileType(file.name),
      uploadDate: new Date().toISOString(),
      size: file.size
    }
    
    files.value.unshift(newFile)
  } catch (err) {
    console.error('Failed to upload file:', err)
  } finally {
    uploadingFile.value = false
  }
}

// Get file type from extension
const getFileType = (fileName) => {
  const ext = fileName.split('.').pop()?.toLowerCase()
  if (['mp3', 'wav', 'ogg', 'm4a', 'aac'].includes(ext)) return 'Audio'
  if (['mp4', 'avi', 'mov', 'wmv'].includes(ext)) return 'Video'
  if (['pdf'].includes(ext)) return 'PDF'
  if (['jpg', 'jpeg', 'png', 'gif'].includes(ext)) return 'Image'
  return 'Document'
}

// Format date
const formatDate = (dateString) => {
  if (!dateString) return '-'
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

// View file
const handleViewFile = async (file) => {
  try {
    const url = await fetchFileUrl(file.key)
    if (url) {
      window.open(url, '_blank')
    }
  } catch (err) {
    console.error('Failed to view file:', err)
  }
}

// Delete file
const handleDeleteFile = async (file) => {
  if (!confirm(`Are you sure you want to delete "${file.fileName}"?`)) {
    return
  }

  try {
    await deleteFile(file.key)
    files.value = files.value.filter(f => f.key !== file.key)
    // Remove feedback if exists
    if (fileFeedbacks.value[file.key]) {
      delete fileFeedbacks.value[file.key]
    }
  } catch (err) {
    console.error('Failed to delete file:', err)
  }
}

// Get feedback for a file
const handleGetFeedback = async (file) => {
  feedbackLoading.value[file.key] = true
  try {
    const feedback = await getFeedback(file.key)
    fileFeedbacks.value[file.key] = feedback
  } catch (err) {
    console.error('Failed to get feedback:', err)
  } finally {
    feedbackLoading.value[file.key] = false
  }
}

// Watch for tab changes to load files
watch(activeTab, (newTab) => {
  if (newTab === 'uploads') {
    loadFiles()
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
        <a class="nav-link" :class="{ active: activeTab === 'ai-coach' }" @click="activeTab = 'ai-coach'">
          <i class="bi bi-robot"></i>AI Coach
        </a>
        <a class="nav-link" :class="{ active: activeTab === 'ai-feedbacks' }" @click="activeTab = 'ai-feedbacks'">
          <i class="bi bi-chat-left-quote"></i>AI Feedbacks
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
        <a class="nav-link" :class="{ active: activeTab === 'journal' }" @click="activeTab = 'journal'">
          <i class="bi bi-journal-text"></i>Journal
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

            <!-- AI Coach Tab -->
            <div v-show="activeTab === 'ai-coach'" class="tab-pane fade" :class="{ 'show active': activeTab === 'ai-coach' }">
              <h4>AI Coach</h4>
              <p class="text-muted">Chat with your AI assistant for personalized learning support.</p>
              <AgentView />
            </div>

            <!-- AI Feedbacks Tab -->
            <div v-show="activeTab === 'ai-feedbacks'" class="tab-pane fade" :class="{ 'show active': activeTab === 'ai-feedbacks' }">
              <h4>AI Feedbacks</h4>
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
                <div>
                  <input
                    ref="fileInputRef"
                    type="file"
                    class="d-none"
                    @change="handleFileChange"
                    :disabled="uploadingFile"
                  />
                  <button 
                    class="btn btn-primary-custom btn-sm"
                    @click="handleFileSelect"
                    :disabled="uploadingFile"
                  >
                    <span v-if="uploadingFile" class="spinner-border spinner-border-sm me-1" role="status"></span>
                    {{ uploadingFile ? 'Uploading...' : 'Upload New File' }}
                  </button>
                </div>
              </div>
              
              <div v-if="loadingFiles" class="text-center py-4">
                <div class="spinner-border" role="status">
                  <span class="visually-hidden">Loading...</span>
                </div>
              </div>
              
              <div v-else class="table-responsive">
                <table class="table table-striped">
                  <thead>
                    <tr>
                      <th>File Name</th>
                      <th>Type</th>
                      <th>Upload Date</th>
                      <th>Feedback</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-if="files.length === 0">
                      <td colspan="5" class="text-center text-muted py-4">
                        No files uploaded yet. Click "Upload New File" to get started.
                      </td>
                    </tr>
                    <tr v-for="file in files" :key="file.key">
                      <td>
                        <i class="bi" :class="{
                          'bi-file-music': file.type === 'Audio',
                          'bi-file-play': file.type === 'Video',
                          'bi-file-pdf': file.type === 'PDF',
                          'bi-file-image': file.type === 'Image',
                          'bi-file-earmark': file.type === 'Document'
                        }"></i>
                        {{ file.fileName }}
                      </td>
                      <td>{{ file.type }}</td>
                      <td>{{ formatDate(file.uploadDate) }}</td>
                      <td>
                        <div v-if="fileFeedbacks[file.key]" class="feedback-content">
                          <div class="card bg-light">
                            <div class="card-body p-2">
                              <small>
                                <strong>Feedback:</strong> {{ typeof fileFeedbacks[file.key] === 'string' ? fileFeedbacks[file.key] : JSON.stringify(fileFeedbacks[file.key]) }}
                              </small>
                            </div>
                          </div>
                        </div>
                        <button 
                          v-else
                          class="btn btn-sm btn-outline-primary"
                          @click="handleGetFeedback(file)"
                          :disabled="feedbackLoading[file.key]"
                        >
                          <span v-if="feedbackLoading[file.key]" class="spinner-border spinner-border-sm me-1" role="status"></span>
                          Get Feedback
                        </button>
                      </td>
                      <td>
                        <button 
                          class="btn btn-sm btn-info me-1"
                          @click="handleViewFile(file)"
                        >
                          View
                        </button>
                        <button 
                          class="btn btn-sm btn-danger"
                          @click="handleDeleteFile(file)"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <!-- Journal Tab -->
            <div v-show="activeTab === 'journal'" class="tab-pane fade" :class="{ 'show active': activeTab === 'journal' }">
              <div class="d-flex justify-content-between align-items-center mb-3">
                <h4>Journal</h4>
                <button class="btn btn-primary-custom btn-sm">New Entry</button>
              </div>
              <div class="card mb-3">
                <div class="card-body">
                  <h5 class="card-title">January 12, 2026</h5>
                  <p class="card-text">Rhythms feel tricky — singing first helps. I tried singing the Twinkle Variations before playing today and it made the rhythm much clearer!</p>
                  <small class="text-muted">Last edited: 2 hours ago</small>
                </div>
              </div>
              <div class="card mb-3">
                <div class="card-body">
                  <h5 class="card-title">Class Performance - December 15, 2024</h5>
                  <p class="card-text">I was nervous, but proud when I played for the class. I remembered Ms. O'Donnell's advice: breathe, check feet, quiet bow placement before first note. It really helped me feel ready!</p>
                  <small class="text-muted">December 15, 2024</small>
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
