<script setup>
import { ref, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { usePreferencesStore } from '@/stores/preferences'
import { useImages } from '@/composables/useImages'

const authStore = useAuthStore()
const preferencesStore = usePreferencesStore()
const { fetchImageUrl } = useImages()

const activeTab = ref('classes')
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
                <span class="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">5</span>
              </a>
              <ul class="dropdown-menu dropdown-menu-end">
                <li><h6 class="dropdown-header">Notifications</h6></li>
                <li><a class="dropdown-item" href="#">Aoife Byrne uploaded new practice recording</a></li>
                <li><a class="dropdown-item" href="#">Stage 3 goal completed by Aoife - review required</a></li>
                <li><hr class="dropdown-divider" /></li>
                <li><a class="dropdown-item text-center" href="#">View All Notifications</a></li>
              </ul>
            </li>
            <li class="nav-item dropdown ms-3">
              <a class="nav-link dropdown-toggle d-flex align-items-center" href="#" id="profileDropdown" role="button" data-bs-toggle="dropdown">
                <img v-if="profilePictureUrl" :src="profilePictureUrl" alt="Profile" class="profile-pic me-2" />
                <i v-else class="bi bi-person-circle fs-4 me-2"></i>
                <span>{{ preferencesStore.effectiveDisplayName || 'Ms. Niamh O\'Donnell' }}</span>
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
      <div class="nav flex-column nav-pills" id="teacherNav" role="tablist">
        <a class="nav-link" :class="{ active: activeTab === 'classes' }" @click="activeTab = 'classes'">
          <i class="bi bi-music-note-beamed"></i>Programmes
        </a>
        <a class="nav-link" :class="{ active: activeTab === 'profile' }" @click="activeTab = 'profile'">
          <i class="bi bi-person-circle"></i>Profile
        </a>
        <a class="nav-link" :class="{ active: activeTab === 'set-goal' }" @click="activeTab = 'set-goal'">
          <i class="bi bi-bullseye"></i>Set Goal
        </a>
        <a class="nav-link" :class="{ active: activeTab === 'learning-resource' }" @click="activeTab = 'learning-resource'">
          <i class="bi bi-folder-plus"></i>Add Learning Resource
        </a>
        <a class="nav-link" :class="{ active: activeTab === 'students' }" @click="activeTab = 'students'">
          <i class="bi bi-people"></i>Students
        </a>
        <a class="nav-link" :class="{ active: activeTab === 'feedback' }" @click="activeTab = 'feedback'">
          <i class="bi bi-chat-left-quote"></i>Give Feedback
        </a>
        <a class="nav-link" :class="{ active: activeTab === 'ai-insights' }" @click="activeTab = 'ai-insights'">
          <i class="bi bi-lightbulb"></i>AI Insights
        </a>
      </div>
    </div>

    <!-- Main Content -->
    <div class="main-content">
      <div class="container-fluid">
        <div class="row">
          <div class="col-12">
            <h2>Teacher Dashboard</h2>
            <p class="page-description">Manage your classes, assignments, and student progress efficiently.</p>
            <hr />
          </div>
        </div>

        <!-- Tab Content -->
        <div class="row">
          <div class="col-12">
            <!-- Programmes Tab -->
            <div v-show="activeTab === 'classes'" class="tab-pane fade" :class="{ 'show active': activeTab === 'classes' }">
              <h4>My Programmes</h4>
              <div class="row">
                <div class="col-md-6 mb-3">
                  <div class="card">
                    <div class="card-body">
                      <h5 class="card-title">Junior RIAM (Years 1-2)</h5>
                      <p class="card-text">Foundation level music education for young students</p>
                      <p class="mb-1"><small class="text-muted"><strong>Students:</strong> 1</small></p>
                      <p class="mb-1"><small class="text-muted"><strong>Instruments:</strong> Violin</small></p>
                      <p class="mb-1"><small class="text-muted"><strong>Stage:</strong> Development</small></p>
                      <button class="btn btn-sm btn-primary-custom mt-2">View Programme</button>
                    </div>
                  </div>
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
                          <label class="form-label text-muted">Name</label>
                          <p class="fw-bold">{{ preferencesStore.effectiveDisplayName || 'Ms. Niamh O\'Donnell' }}</p>
                        </div>
                        <div class="col-md-6">
                          <label class="form-label text-muted">Email</label>
                          <p class="fw-bold">{{ authStore.userEmail || 'niamh.odonnell@riam.ie' }}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div class="col-md-4">
                  <div class="card mb-3">
                    <div class="card-header bg-primary-custom text-white">
                      <h5 class="mb-0">Teaching Stats</h5>
                    </div>
                    <div class="card-body">
                      <p class="mb-2"><i class="bi bi-people text-primary"></i> <strong>Total Students:</strong> 1</p>
                      <p class="mb-2"><i class="bi bi-music-note-beamed text-info"></i> <strong>Programmes:</strong> 1</p>
                      <p class="mb-2"><i class="bi bi-bullseye text-success"></i> <strong>Active Goals:</strong> 3</p>
                      <p class="mb-0"><i class="bi bi-chat-left-quote text-warning"></i> <strong>Feedback Given:</strong> 2</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Set Goal Tab -->
            <div v-show="activeTab === 'set-goal'" class="tab-pane fade" :class="{ 'show active': activeTab === 'set-goal' }">
              <div class="d-flex justify-content-between align-items-center mb-3">
                <h4>Set Goals for Students</h4>
                <button class="btn btn-primary-custom">Create New Goal</button>
              </div>
              <div class="alert alert-info">
                <strong>Stage-Based Goals:</strong> Goals are divided into stages. Students progress through stages based on positive feedback. Each stage must be completed before moving to the next.
              </div>
              <div class="card mb-3">
                <div class="card-body">
                  <h5 class="card-title">Create Goal with Stages</h5>
                  <form>
                    <div class="mb-3">
                      <label for="goalClass" class="form-label">Select Programme/Student</label>
                      <select class="form-select" id="goalClass">
                        <option>Junior RIAM (Years 1–2) - All Students</option>
                        <option>Individual: Aoife Byrne (1)</option>
                      </select>
                    </div>
                    <div class="mb-3">
                      <label for="goalTitle" class="form-label">Goal Title (Piece/Skill Name)</label>
                      <input type="text" class="form-control" id="goalTitle" placeholder="e.g., Twinkle Twinkle Variations A">
                    </div>
                    <div class="mb-3">
                      <label for="goalDescription" class="form-label">Description</label>
                      <textarea class="form-control" id="goalDescription" rows="2" placeholder="Describe the goal and overall objective..."></textarea>
                    </div>
                    <button type="submit" class="btn btn-primary-custom">Set Goal with Stages</button>
                  </form>
                </div>
              </div>
            </div>

            <!-- Add Learning Resource Tab -->
            <div v-show="activeTab === 'learning-resource'" class="tab-pane fade" :class="{ 'show active': activeTab === 'learning-resource' }">
              <div class="d-flex justify-content-between align-items-center mb-3">
                <h4>Add Learning Resources</h4>
              </div>
              <div class="card mb-3">
                <div class="card-body">
                  <h5 class="card-title">Upload New Resource</h5>
                  <form>
                    <div class="mb-3">
                      <label for="resourceClass" class="form-label">Select Programme</label>
                      <select class="form-select" id="resourceClass">
                        <option>Junior RIAM (Years 1-2)</option>
                      </select>
                    </div>
                    <div class="mb-3">
                      <label for="resourceTitle" class="form-label">Resource Title</label>
                      <input type="text" class="form-control" id="resourceTitle" placeholder="e.g., Beginner Sheet Music">
                    </div>
                    <div class="mb-3">
                      <label for="resourceType" class="form-label">Resource Type</label>
                      <select class="form-select" id="resourceType">
                        <option>PDF Document</option>
                        <option>Video</option>
                        <option>Audio</option>
                        <option>Link</option>
                      </select>
                    </div>
                    <div class="mb-3">
                      <label for="resourceFile" class="form-label">Upload File</label>
                      <input type="file" class="form-control" id="resourceFile">
                    </div>
                    <button type="submit" class="btn btn-primary-custom">Upload Resource</button>
                  </form>
                </div>
              </div>
            </div>

            <!-- Students Tab -->
            <div v-show="activeTab === 'students'" class="tab-pane fade" :class="{ 'show active': activeTab === 'students' }">
              <h4>Student Overview</h4>
              <div class="table-responsive">
                <table class="table table-hover">
                  <thead>
                    <tr>
                      <th>Student Name</th>
                      <th>Programme</th>
                      <th>Average Score</th>
                      <th>Last Activity</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Aoife Byrne</td>
                      <td>Junior RIAM (Years 1-2)</td>
                      <td><span class="badge bg-warning">59%</span></td>
                      <td>-</td>
                      <td><button class="btn btn-sm btn-info">View</button></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <!-- Give Feedback Tab -->
            <div v-show="activeTab === 'feedback'" class="tab-pane fade" :class="{ 'show active': activeTab === 'feedback' }">
              <div class="d-flex justify-content-between align-items-center mb-3">
                <h4>Give Feedback to Students</h4>
              </div>
              <div class="card mb-3">
                <div class="card-body">
                  <h5 class="card-title">Submit Feedback</h5>
                  <form>
                    <div class="mb-3">
                      <label for="feedbackClass" class="form-label">Select Programme</label>
                      <select class="form-select" id="feedbackClass">
                        <option>Junior RIAM (Years 1-2)</option>
                      </select>
                    </div>
                    <div class="mb-3">
                      <label for="feedbackStudent" class="form-label">Select Student</label>
                      <select class="form-select" id="feedbackStudent">
                        <option>Aoife Byrne (1)</option>
                      </select>
                    </div>
                    <div class="mb-3">
                      <label for="feedbackAssignment" class="form-label">Assignment/Assessment</label>
                      <input type="text" class="form-control" id="feedbackAssignment" placeholder="e.g., Quiz 3, Practice Performance">
                    </div>
                    <div class="mb-3">
                      <label for="feedbackGrade" class="form-label">Grade</label>
                      <select class="form-select" id="feedbackGrade">
                        <option>A+</option>
                        <option>A</option>
                        <option>B+</option>
                        <option>C+</option>
                        <option>D</option>
                        <option>F</option>
                      </select>
                    </div>
                    <div class="mb-3">
                      <label for="feedbackComments" class="form-label">Feedback Comments</label>
                      <textarea class="form-control" id="feedbackComments" rows="4" placeholder="Provide detailed feedback..."></textarea>
                    </div>
                    <button type="submit" class="btn btn-primary-custom">Submit Feedback</button>
                  </form>
                </div>
              </div>
            </div>

            <!-- AI Insights Tab -->
            <div v-show="activeTab === 'ai-insights'" class="tab-pane fade" :class="{ 'show active': activeTab === 'ai-insights' }">
              <h4>AI Insights & Analysis</h4>
              <p class="text-muted">Monitor AI interactions with students and review AI's analysis of student uploads.</p>
              <div class="card mb-3">
                <div class="card-body">
                  <h6 class="mb-1">Aoife Byrne - Junior RIAM (Years 1-2)</h6>
                  <small class="text-muted"><i class="bi bi-calendar3"></i> Jan 12, 2026 | <i class="bi bi-clock"></i> 14:32</small>
                  <div class="mt-3">
                    <h6 class="text-primary-custom">Discussion Topics:</h6>
                    <ul>
                      <li>Bow hold and relaxing right-hand thumb</li>
                      <li>Balancing violin on shoulder</li>
                      <li>Intonation tips for Twinkle Variations</li>
                    </ul>
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
