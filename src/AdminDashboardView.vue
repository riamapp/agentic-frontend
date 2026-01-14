<script setup>
import { ref, computed, onMounted, nextTick, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { usePreferencesStore } from '@/stores/preferences'
import { useImages } from '@/composables/useImages'
import { Chart, registerables } from 'chart.js'

// Register Chart.js components
Chart.register(...registerables)

const authStore = useAuthStore()
const preferencesStore = usePreferencesStore()
const { fetchImageUrl } = useImages()

const activeTab = ref('users')
const sidebarOpen = ref(false)
const profilePictureUrl = ref(null)

// Student view state
const selectedStudent = ref(null)
const showStudentModal = ref(false)
const studentDetailTab = ref('sd-overview')
const studentChartRef = ref(null)
let currentStudentChart = null

// Mock student data - will be replaced with API calls
const students = ref([
  {
    studentId: 'S01',
    profile: {
      name: { first: 'Aoife', last: 'Byrne' },
      email: 'aoife.byrne@riam.student.ie',
      age: 10,
      stage: 'Development',
      programme: 'Junior RIAM (Years 1-2)',
      instrument: 'Violin',
      faculty: 'Strings',
      teacher: "Ms. Niamh O'Donnell",
      enrollmentDate: '2024-09-01',
      piecesInProgress: ['Twinkle Twinkle Variations A', 'Lightly Row', 'Suzuki Etude 1']
    },
    technicalSkillsCompetence: {
      score: 58,
      practicalTechniqueMark: 58,
      teacherTechnicalAdvice: ['Balance violin on shoulder', 'Relax right-hand thumb', 'Slow open strings with full bow'],
      teacherChecklist: {
        achieved: ['Posture', 'Rhythm'],
        partial: ['Bow hold', 'Intonation']
      }
    },
    compositionalMusicianshipKnowledge: {
      score: 55,
      musicianshipMark: 55,
      auralEvidenceRecordings: ['claps-4beat-rhythms.mp3', 'sings-3note-patterns.mp3'],
      creativeReflectiveNotes: ["Student: 'Rhythms feel tricky — singing first helps.'"]
    },
    repertoireCulturalKnowledge: {
      score: 60,
      repertoireCulturalMark: 60,
      listeningLogs: [
        { piece: 'Twinkle variations', composer: 'Various', date: '2025-01-05', notes: 'Simple folk songs' }
      ],
      contextMeaningNotes: ['Student can name the tune and notices it appears in different countries.']
    },
    performingArtistry: {
      score: 62,
      practicalArtistryMark: 62,
      studentPerformanceReflections: [
        { date: '2024-12-15', performance: 'Class performance', reflection: 'I was nervous, but proud when I played for the class.' }
      ],
      teacherPerformancePrepNotes: ["Set a 'starting routine': breathe, check feet, quiet bow placement before first note."]
    }
  },
  {
    studentId: 'S02',
    profile: {
      name: { first: 'Conor', last: 'Walsh' },
      email: 'conor.walsh@riam.student.ie',
      age: 12,
      stage: 'Intermediate',
      programme: 'Junior RIAM (Years 3-4)',
      instrument: 'Flute',
      faculty: 'Woodwind',
      teacher: 'Mr. Liam Keane',
      enrollmentDate: '2023-09-01',
      piecesInProgress: ['Bach Minuet', 'Sonatina movement', 'Study No.3']
    },
    technicalSkillsCompetence: {
      score: 70,
      practicalTechniqueMark: 70,
      teacherTechnicalAdvice: ['Long tones for steady tone', 'Count rests carefully', 'Scales slow → medium with metronome'],
      teacherChecklist: {
        achieved: ['Tone', 'Breath', 'Rhythm'],
        partial: ['Finger clarity']
      }
    },
    compositionalMusicianshipKnowledge: {
      score: 72,
      musicianshipMark: 72,
      auralEvidenceRecordings: ['sings-5note-patterns.mp3', 'claps-dotted-rhythms.mp3', 'plays-intervals-flute.mp3'],
      creativeReflectiveNotes: ["Teacher: 'Great listener — needs confidence to improvise small answers.'"]
    },
    repertoireCulturalKnowledge: {
      score: 74,
      repertoireCulturalMark: 74,
      listeningLogs: [
        { piece: 'Bach flute sonatas', composer: 'J.S. Bach', date: '2025-01-08', notes: 'Baroque dance music' }
      ],
      contextMeaningNotes: ["Student notes 'dance' feel and lighter articulation in Baroque style."]
    },
    performingArtistry: {
      score: 68,
      practicalArtistryMark: 68,
      studentPerformanceReflections: [
        { date: '2024-12-20', performance: 'Winter recital', reflection: 'I improved, but I rushed the fast section.' }
      ],
      teacherPerformancePrepNotes: ["Run 'performance reps': play opening 3 times in a row with calm posture and clear first breath."]
    }
  },
  {
    studentId: 'S03',
    profile: {
      name: { first: 'Ella', last: 'Murphy' },
      email: 'ella.murphy@riam.student.ie',
      age: 14,
      stage: 'Advanced',
      programme: 'Junior RIAM (Years 5-6)',
      instrument: 'Piano',
      faculty: 'Keyboard',
      teacher: 'Ms. Siobhán Kelly',
      enrollmentDate: '2021-09-01',
      piecesInProgress: ['Beethoven Sonatina (1st mvt)', 'Burgmüller Arabesque', 'Scale study']
    },
    technicalSkillsCompetence: {
      score: 82,
      practicalTechniqueMark: 82,
      teacherTechnicalAdvice: ['Shape phrases (breathing points)', 'Keep LH lighter', 'Hands-separate for tricky bars'],
      teacherChecklist: {
        achieved: ['Posture', 'Balance', 'Articulation', 'Accuracy'],
        partial: []
      }
    },
    compositionalMusicianshipKnowledge: {
      score: 80,
      musicianshipMark: 80,
      auralEvidenceRecordings: ['melodic-dictation.mp3', 'claps-syncopation.mp3', 'identifies-cadences.mp3'],
      creativeReflectiveNotes: ["Student: 'I like spotting how harmony supports the melody.'"]
    },
    repertoireCulturalKnowledge: {
      score: 85,
      repertoireCulturalMark: 85,
      listeningLogs: [
        { piece: 'Beethoven piano works', composer: 'Ludwig van Beethoven', date: '2025-01-03', notes: 'Classical clarity vs Romantic colour' },
        { piece: 'Romantic character pieces', composer: 'Various', date: '2025-01-10', notes: 'Exploring expressive possibilities' }
      ],
      contextMeaningNotes: ['Student can describe Classical clarity vs Romantic colour.']
    },
    performingArtistry: {
      score: 78,
      practicalArtistryMark: 78,
      studentPerformanceReflections: [
        { date: '2024-12-18', performance: 'Solo recital', reflection: 'I felt in control — I want more expression in slower sections.' }
      ],
      teacherPerformancePrepNotes: ["Agree 2 'story moments' per piece and plan dynamics/rubato around them."]
    }
  },
  {
    studentId: 'S04',
    profile: {
      name: { first: 'Rory', last: 'Fitzpatrick' },
      email: 'rory.fitzpatrick@riam.student.ie',
      age: 15,
      stage: 'Advanced',
      programme: 'Young Artist Programme',
      instrument: 'Trumpet',
      faculty: 'Brass',
      teacher: 'Mr. David Horan',
      enrollmentDate: '2022-09-01',
      piecesInProgress: ['Haydn Concerto (selected mvts)', 'Arban Characteristic Study', 'Orchestral excerpt']
    },
    technicalSkillsCompetence: {
      score: 92,
      practicalTechniqueMark: 92,
      teacherTechnicalAdvice: ['Airflow focus in upper register', 'Light articulation', 'Daily long-tone warm‑ups + lip slurs'],
      teacherChecklist: {
        achieved: ['Breath', 'Range', 'Articulation', 'Endurance'],
        partial: []
      }
    },
    compositionalMusicianshipKnowledge: {
      score: 78,
      musicianshipMark: 78,
      auralEvidenceRecordings: ['interval-singing.mp3', 'rhythmic-dictation.mp3', 'modulation-playback-trumpet.mp3'],
      creativeReflectiveNotes: ["Teacher: 'Technically superb — let's explore composing 8‑bar motifs to deepen musical intent.'"]
    },
    repertoireCulturalKnowledge: {
      score: 76,
      repertoireCulturalMark: 76,
      listeningLogs: [
        { piece: 'Haydn concertos', composer: 'Joseph Haydn', date: '2024-12-28', notes: 'Classical orchestral repertoire' }
      ],
      contextMeaningNotes: ['Student identifies concerto form sections and style expectations (clarity, balance).']
    },
    performingArtistry: {
      score: 80,
      practicalArtistryMark: 80,
      studentPerformanceReflections: [
        { date: '2024-12-22', performance: 'Concerto competition', reflection: "I'm confident technically — I want more emotional range." }
      ],
      teacherPerformancePrepNotes: ["Choose 3 phrase 'destinations' and practise shaping towards them (not just precision)."]
    }
  },
  {
    studentId: 'S05',
    profile: {
      name: { first: 'Saoirse', last: 'Nolan' },
      email: 'saoirse.nolan@riam.student.ie',
      age: 17,
      stage: 'Advanced',
      programme: 'Young Artist Programme',
      instrument: 'Voice',
      faculty: 'Vocal Studies',
      teacher: 'Ms. Aisling Byrne',
      enrollmentDate: '2020-09-01',
      piecesInProgress: ['Italian art song', 'Musical theatre ballad', 'Irish traditional air']
    },
    technicalSkillsCompetence: {
      score: 85,
      practicalTechniqueMark: 85,
      teacherTechnicalAdvice: ['Breath support for long phrases', 'Clear vowels + diction', 'Practise soft, clean entries'],
      teacherChecklist: {
        achieved: ['Breath', 'Tone', 'Diction', 'Projection'],
        partial: []
      }
    },
    compositionalMusicianshipKnowledge: {
      score: 90,
      musicianshipMark: 90,
      auralEvidenceRecordings: ['complex-melodies-back.mp3', 'tonal-memory.mp3', 'compound-rhythms.mp3'],
      creativeReflectiveNotes: ["Student: 'Lyrics change everything — I journal the character's intention.'"]
    },
    repertoireCulturalKnowledge: {
      score: 92,
      repertoireCulturalMark: 92,
      listeningLogs: [
        { piece: 'Schubert Lieder', composer: 'Franz Schubert', date: '2025-01-02', notes: 'German art song tradition' },
        { piece: 'Irish folk singers', composer: 'Traditional', date: '2025-01-09', notes: 'Irish sean-nós style' }
      ],
      contextMeaningNotes: ['Student connects text, tradition, and storytelling to musical choices.']
    },
    performingArtistry: {
      score: 94,
      practicalArtistryMark: 94,
      studentPerformanceReflections: [
        { date: '2024-12-20', performance: 'Christmas concert', reflection: 'I felt connected to the story and the audience.' }
      ],
      teacherPerformancePrepNotes: ["Write 2–3 'key words' per phrase and rehearse intention first, then sound."]
    }
  }
])

// Calculate average score
const getAverageScore = (student) => {
  const scores = [
    student.technicalSkillsCompetence?.score || 0,
    student.compositionalMusicianshipKnowledge?.score || 0,
    student.repertoireCulturalKnowledge?.score || 0,
    student.performingArtistry?.score || 0
  ]
  return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length || 0)
}

// Format students for table display
const studentsForTable = computed(() => {
  return students.value.map(s => ({
    name: `${s.profile.name.first} ${s.profile.name.last}`,
    studentId: s.studentId,
    email: s.profile.email,
    programme: s.profile.programme,
    averageScore: getAverageScore(s),
    lastActivity: '-',
    fullData: s
  }))
})

const viewStudent = async (student) => {
  selectedStudent.value = student.fullData || student
  showStudentModal.value = true
  studentDetailTab.value = 'sd-overview'
  await nextTick()
  initStudentChart()
}

const closeStudentModal = () => {
  showStudentModal.value = false
  selectedStudent.value = null
  if (currentStudentChart) {
    currentStudentChart.destroy()
    currentStudentChart = null
  }
}

const initStudentChart = async () => {
  if (!selectedStudent.value || !studentChartRef.value) return
  
  await nextTick()
  await new Promise(resolve => setTimeout(resolve, 100))
  
  if (currentStudentChart) {
    currentStudentChart.destroy()
  }
  
  const techScore = selectedStudent.value.technicalSkillsCompetence?.score || 0
  const compScore = selectedStudent.value.compositionalMusicianshipKnowledge?.score || 0
  const repScore = selectedStudent.value.repertoireCulturalKnowledge?.score || 0
  const perfScore = selectedStudent.value.performingArtistry?.score || 0
  
  currentStudentChart = new Chart(studentChartRef.value, {
    type: 'radar',
    data: {
      labels: ['Technical Skills', 'Musicianship', 'Repertoire', 'Performing Artistry'],
      datasets: [{
        label: 'Scores',
        data: [techScore, compScore, repScore, perfScore],
        backgroundColor: 'rgba(105, 52, 126, 0.2)',
        borderColor: '#69347e',
        borderWidth: 2,
        pointBackgroundColor: '#69347e'
      }]
    },
    options: {
      responsive: true,
      scales: {
        r: {
          beginAtZero: true,
          max: 100
        }
      }
    }
  })
}

watch(studentDetailTab, async (newTab) => {
  if (newTab === 'sd-overview' && showStudentModal.value) {
    await nextTick()
    initStudentChart()
  }
})

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
          <img src="/RIAM_Logo_White.png" alt="RIAM Logo" style="height: 40px; margin-right: 12px;" />
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
        <a class="nav-link" :class="{ active: activeTab === 'courses' }" @click="activeTab = 'courses'">
          <i class="bi bi-music-note-beamed"></i>Programmes
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
                    <tr v-for="student in studentsForTable" :key="student.studentId">
                      <td>{{ student.name }}</td>
                      <td>{{ student.email }}</td>
                      <td><span class="badge bg-primary">Student</span></td>
                      <td><span class="badge bg-success">Active</span></td>
                      <td>
                        <button class="btn btn-sm btn-info me-1" @click="viewStudent(student)">View</button>
                        <button class="btn btn-sm btn-warning me-1">Edit</button>
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
                      <p class="mb-1"><small class="text-muted">Instruments: Violin</small></p>
                      <p class="mb-1"><small class="text-muted">Stage: Development</small></p>
                      <p class="mb-1"><small class="text-muted">Teacher: Ms. Niamh O'Donnell</small></p>
                      <button class="btn btn-sm btn-warning mt-2">Edit</button>
                      <button class="btn btn-sm btn-danger mt-2">Delete</button>
                    </div>
                  </div>
                </div>
                <div class="col-md-4 mb-3">
                  <div class="card">
                    <div class="card-body">
                      <h5 class="card-title">Junior RIAM (Years 3-4)</h5>
                      <p class="card-text">Intermediate level for developing musicians</p>
                      <p class="mb-1"><small class="text-muted">Students: 1</small></p>
                      <p class="mb-1"><small class="text-muted">Instruments: Flute</small></p>
                      <p class="mb-1"><small class="text-muted">Stage: Intermediate</small></p>
                      <p class="mb-1"><small class="text-muted">Teacher: Mr. Liam Keane</small></p>
                      <button class="btn btn-sm btn-warning mt-2">Edit</button>
                      <button class="btn btn-sm btn-danger mt-2">Delete</button>
                    </div>
                  </div>
                </div>
                <div class="col-md-4 mb-3">
                  <div class="card">
                    <div class="card-body">
                      <h5 class="card-title">Junior RIAM (Years 5-6)</h5>
                      <p class="card-text">Advanced junior level for experienced students</p>
                      <p class="mb-1"><small class="text-muted">Students: 1</small></p>
                      <p class="mb-1"><small class="text-muted">Instruments: Piano</small></p>
                      <p class="mb-1"><small class="text-muted">Stage: Advanced</small></p>
                      <p class="mb-1"><small class="text-muted">Teacher: Ms. Siobhán Kelly</small></p>
                      <button class="btn btn-sm btn-warning mt-2">Edit</button>
                      <button class="btn btn-sm btn-danger mt-2">Delete</button>
                    </div>
                  </div>
                </div>
                <div class="col-md-4 mb-3">
                  <div class="card">
                    <div class="card-body">
                      <h5 class="card-title">Young Artist Programme</h5>
                      <p class="card-text">Elite programme for pre-professional musicians</p>
                      <p class="mb-1"><small class="text-muted">Students: 2</small></p>
                      <p class="mb-1"><small class="text-muted">Instruments: Trumpet, Voice</small></p>
                      <p class="mb-1"><small class="text-muted">Stage: Advanced</small></p>
                      <p class="mb-1"><small class="text-muted">Teachers: Mr. David Horan, Ms. Aisling Byrne</small></p>
                      <button class="btn btn-sm btn-warning mt-2">Edit</button>
                      <button class="btn btn-sm btn-danger mt-2">Delete</button>
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
              
              <!-- Filter Options -->
              <div class="card mb-4">
                <div class="card-body">
                  <div class="row">
                    <div class="col-md-4">
                      <label for="aiClassFilter" class="form-label">Filter by Programme</label>
                      <select class="form-select" id="aiClassFilter">
                        <option selected>All Programmes</option>
                        <option>Junior RIAM (Years 1-2)</option>
                        <option>Junior RIAM (Years 3-4)</option>
                        <option>Junior RIAM (Years 5-6)</option>
                        <option>Young Artist Programme</option>
                      </select>
                    </div>
                    <div class="col-md-4">
                      <label for="aiStudentFilter" class="form-label">Filter by Student</label>
                      <select class="form-select" id="aiStudentFilter">
                        <option selected>All Students</option>
                        <option>Aoife Byrne (S01)</option>
                        <option>Conor Walsh (S02)</option>
                        <option>Ella Murphy (S03)</option>
                        <option>Rory Fitzpatrick (S04)</option>
                        <option>Saoirse Nolan (S05)</option>
                      </select>
                    </div>
                    <div class="col-md-4">
                      <label for="aiDateFilter" class="form-label">Date Range</label>
                      <select class="form-select" id="aiDateFilter">
                        <option selected>Last 7 Days</option>
                        <option>Last 30 Days</option>
                        <option>Last 3 Months</option>
                        <option>All Time</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Statistics Cards -->
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

              <!-- AI Discussion Summaries -->
              <div class="mb-4">
                <h5 class="mb-3">
                  <i class="bi bi-chat-dots text-primary-custom"></i> Recent AI Discussions Summary
                </h5>
                <div class="card mb-3">
                  <div class="card-body">
                    <div class="d-flex justify-content-between align-items-start mb-2">
                      <div>
                        <h6 class="mb-1">Aoife Byrne - Junior RIAM (Years 1-2)</h6>
                        <small class="text-muted"><i class="bi bi-calendar3"></i> Jan 12, 2026 | <i class="bi bi-clock"></i> 14:32</small>
                      </div>
                      <span class="badge bg-info">8 Messages</span>
                    </div>
                    <div class="mt-3">
                      <h6 class="text-primary-custom">Discussion Topics:</h6>
                      <ul class="mb-2">
                        <li>Bow hold and relaxing right-hand thumb</li>
                        <li>Balancing violin on shoulder</li>
                        <li>Intonation tips for Twinkle Variations</li>
                      </ul>
                      <h6 class="text-primary-custom">AI Summary:</h6>
                      <p class="mb-2">Student expressed: "Rhythms feel tricky — singing first helps." AI provided guidance on using singing as a learning tool and suggested slow practice with open strings. Student is making steady progress but needs continued reinforcement on posture and bow hold.</p>
                      <h6 class="text-primary-custom">Recommended Action:</h6>
                      <p class="mb-0"><span class="badge bg-primary-custom">Follow-up Needed</span> Review bow hold and shoulder position during next lesson. Continue slow, controlled practice.</p>
                    </div>
                    <div class="mt-3">
                      <button class="btn btn-sm btn-primary-custom">View Full Conversation</button>
                    </div>
                  </div>
                </div>

                <div class="card mb-3">
                  <div class="card-body">
                    <div class="d-flex justify-content-between align-items-start mb-2">
                      <div>
                        <h6 class="mb-1">Conor Walsh - Junior RIAM (Years 3-4)</h6>
                        <small class="text-muted"><i class="bi bi-calendar3"></i> Jan 11, 2026 | <i class="bi bi-clock"></i> 09:15</small>
                      </div>
                      <span class="badge bg-info">10 Messages</span>
                    </div>
                    <div class="mt-3">
                      <h6 class="text-primary-custom">Discussion Topics:</h6>
                      <ul class="mb-2">
                        <li>Baroque style and articulation in Bach Minuet</li>
                        <li>Breath support for long phrases</li>
                        <li>Counting through rests accurately</li>
                      </ul>
                      <h6 class="text-primary-custom">AI Summary:</h6>
                      <p class="mb-2">Student noted the 'dance' feel and lighter articulation in Baroque style. Teacher commented: "Great listener — needs confidence to improvise small answers." AI encouraged experimenting with dynamic variations and suggested performance reps for building stage confidence.</p>
                      <h6 class="text-primary-custom">Recommended Action:</h6>
                      <p class="mb-0"><span class="badge bg-success">No Action Needed</span> Student showing excellent understanding. Continue with performance preparation exercises.</p>
                    </div>
                    <div class="mt-3">
                      <button class="btn btn-sm btn-primary-custom">View Full Conversation</button>
                    </div>
                  </div>
                </div>
              </div>

              <!-- AI Upload Review & Analysis -->
              <div class="mb-4">
                <h5 class="mb-3">
                  <i class="bi bi-file-earmark-music text-primary-custom"></i> AI Upload Review & Analysis
                </h5>
                <div class="card mb-3">
                  <div class="card-body">
                    <div class="d-flex justify-content-between align-items-start mb-2">
                      <div>
                        <h6 class="mb-1">Aoife Byrne - Piano Practice Recording</h6>
                        <small class="text-muted"><i class="bi bi-calendar3"></i> {{ new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) }} | <i class="bi bi-clock"></i> 16:45</small>
                      </div>
                      <span class="badge bg-success">Reviewed</span>
                    </div>
                    <div class="mt-3">
                      <h6 class="text-primary-custom">Upload Type:</h6>
                      <p class="mb-2"><i class="bi bi-file-music"></i> Audio Recording - "Piano file 3 mins.mp3" (3:00 duration)</p>

                      <h6 class="text-primary-custom">AI Analysis Process:</h6>
                      <div class="alert alert-light mb-2">
                        <small>
                          <strong>Step 1:</strong> Audio file transcribed and analyzed for tempo, rhythm accuracy, and note precision.<br>
                          <strong>Step 2:</strong> Compared performance against reference recording and sheet music.<br>
                          <strong>Step 3:</strong> Identified specific sections with timing inconsistencies.<br>
                          <strong>Step 4:</strong> Generated detailed feedback with timestamps.
                        </small>
                      </div>

                      <h6 class="text-primary-custom">AI Assessment:</h6>
                      <ul class="mb-2">
                        <li><strong>Overall Performance:</strong> Good (75/100)</li>
                        <li><strong>Rhythm:</strong> Steady throughout with minor tempo fluctuations</li>
                        <li><strong>Dynamics:</strong> Good control, shows understanding of dynamic markings</li>
                        <li><strong>Technical Precision:</strong> Solid foundation, accurate note execution</li>
                        <li><strong>Musical Expression:</strong> Could benefit from more expressive phrasing in middle section</li>
                      </ul>

                      <h6 class="text-primary-custom">AI's Detailed Thought Process:</h6>
                      <p class="mb-2 fst-italic">"The student demonstrates good technical control with steady rhythm and accurate note execution. The dynamic control shows understanding of musical markings. However, the middle section could benefit from more expressive phrasing to emphasize the melodic line. The student is making solid progress and shows good practice habits."</p>

                      <h6 class="text-primary-custom">AI Recommended Feedback for Student:</h6>
                      <div class="alert alert-info mb-2">
                        <small>
                          "Great work on your piano practice! Your rhythm is steady and your dynamics show good control. Continue working on maintaining consistent tempo throughout the piece. The phrasing in the middle section could be more expressive - try to emphasize the melodic line. Overall, this is solid progress. Keep practicing!"
                        </small>
                      </div>
                    </div>
                    <div class="mt-3">
                      <button class="btn btn-sm btn-outline-secondary">View Upload</button>
                      <button class="btn btn-sm btn-outline-secondary ms-2">View AI Analysis</button>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Journal Entries & AI Feedback -->
              <div class="mb-4">
                <h5 class="mb-3">
                  <i class="bi bi-journal-text text-primary-custom"></i> Journal Entries & AI Feedback
                </h5>
                <div class="card mb-3">
                  <div class="card-body">
                    <div class="d-flex justify-content-between align-items-start mb-2">
                      <div>
                        <h6 class="mb-1">Aoife Byrne - Personal Journal Entry</h6>
                        <small class="text-muted"><i class="bi bi-calendar3"></i> Jan 10, 2026 | <i class="bi bi-clock"></i> 15:30</small>
                      </div>
                      <span class="badge bg-info">Personal</span>
                    </div>
                    <div class="mt-3">
                      <h6 class="text-primary-custom">Journal Entry:</h6>
                      <div class="alert alert-light mb-2">
                        <p class="mb-0">"Rhythms feel tricky — singing first helps. I'm getting better at keeping the beat steady when I sing the melody before playing it on the violin."</p>
                      </div>
                      <h6 class="text-primary-custom">AI Feedback:</h6>
                      <div class="alert alert-info mb-2">
                        <small>
                          "That's an excellent learning strategy, Aoife! Singing before playing is a wonderful way to internalize the rhythm and melody. This approach helps your brain connect the musical idea with the physical movements needed to play. Keep using this technique - it's a sign of mature musical thinking. Consider also clapping the rhythm while singing to reinforce the timing even more."
                        </small>
                      </div>
                    </div>
                  </div>
                </div>

                <div class="card mb-3">
                  <div class="card-body">
                    <div class="d-flex justify-content-between align-items-start mb-2">
                      <div>
                        <h6 class="mb-1">Aoife Byrne - Professional Journal Entry</h6>
                        <small class="text-muted"><i class="bi bi-calendar3"></i> Dec 15, 2024 | <i class="bi bi-clock"></i> 10:00</small>
                      </div>
                      <span class="badge bg-warning text-dark">Professional</span>
                    </div>
                    <div class="mt-3">
                      <h6 class="text-primary-custom">Journal Entry:</h6>
                      <div class="alert alert-light mb-2">
                        <p class="mb-0"><strong>Performance:</strong> Class performance</p>
                        <p class="mb-0"><strong>Reflection:</strong> "I was nervous, but proud when I played for the class."</p>
                      </div>
                      <h6 class="text-primary-custom">AI Feedback:</h6>
                      <div class="alert alert-info mb-2">
                        <small>
                          "It's completely normal to feel nervous before performing, Aoife! The fact that you felt proud afterward shows that you pushed through your nerves and did your best. This is a valuable experience - each performance helps build your confidence. Remember, even professional musicians feel nervous sometimes. The key is learning to channel that energy into your music. Great job on your class performance!"
                        </small>
                      </div>
                    </div>
                  </div>
                </div>

                <div class="card mb-3">
                  <div class="card-body">
                    <div class="d-flex justify-content-between align-items-start mb-2">
                      <div>
                        <h6 class="mb-1">Conor Walsh - Personal Journal Entry</h6>
                        <small class="text-muted"><i class="bi bi-calendar3"></i> Jan 8, 2026 | <i class="bi bi-clock"></i> 11:20</small>
                      </div>
                      <span class="badge bg-info">Personal</span>
                    </div>
                    <div class="mt-3">
                      <h6 class="text-primary-custom">Journal Entry:</h6>
                      <div class="alert alert-light mb-2">
                        <p class="mb-0">"I like the dance feel in Baroque music. The teacher says I'm a great listener but need confidence to improvise small answers."</p>
                      </div>
                      <h6 class="text-primary-custom">AI Feedback:</h6>
                      <div class="alert alert-info mb-2">
                        <small>
                          "Your observation about the 'dance feel' in Baroque music shows excellent musical awareness, Conor! Baroque music was indeed written for dancing, and that rhythmic energy is a key characteristic. Regarding improvisation - confidence comes with practice. Start small: try improvising just 2-3 note answers to musical phrases you know well. Your teacher's feedback suggests you have the listening skills - now it's about trusting your musical instincts. You've got this!"
                        </small>
                      </div>
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

    <!-- Student Detail Modal -->
    <div v-if="showStudentModal && selectedStudent" class="modal fade show" :class="{ 'd-block': showStudentModal }" tabindex="-1" style="background-color: rgba(0,0,0,0.5);">
      <div class="modal-dialog modal-xl">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Student Details</h5>
            <button type="button" class="btn-close" @click="closeStudentModal"></button>
          </div>
          <div class="modal-body">
            <!-- Student Info Header -->
            <div class="card mb-3">
              <div class="card-body">
                <div class="row">
                  <div class="col-md-3">
                    <p class="mb-1"><strong>Name:</strong> {{ selectedStudent.profile.name.first }} {{ selectedStudent.profile.name.last }}</p>
                  </div>
                  <div class="col-md-3">
                    <p class="mb-1"><strong>ID:</strong> {{ selectedStudent.studentId }}</p>
                  </div>
                  <div class="col-md-3">
                    <p class="mb-1"><strong>Age:</strong> {{ selectedStudent.profile.age }}</p>
                  </div>
                  <div class="col-md-3">
                    <p class="mb-1"><strong>Stage:</strong> <span class="badge bg-info">{{ selectedStudent.profile.stage }}</span></p>
                  </div>
                  <div class="col-md-4">
                    <p class="mb-1"><strong>Programme:</strong> {{ selectedStudent.profile.programme }}</p>
                  </div>
                  <div class="col-md-4">
                    <p class="mb-1"><strong>Instrument:</strong> {{ selectedStudent.profile.instrument }}</p>
                  </div>
                  <div class="col-md-4">
                    <p class="mb-1"><strong>Faculty:</strong> {{ selectedStudent.profile.faculty }}</p>
                  </div>
                  <div class="col-md-4">
                    <p class="mb-0"><strong>Email:</strong> {{ selectedStudent.profile.email }}</p>
                  </div>
                </div>
              </div>
            </div>

            <!-- Tabs for Student Detail -->
            <ul class="nav nav-tabs" role="tablist">
              <li class="nav-item" role="presentation">
                <button class="nav-link" :class="{ active: studentDetailTab === 'sd-overview' }" @click="studentDetailTab = 'sd-overview'">Overview & Scores</button>
              </li>
              <li class="nav-item" role="presentation">
                <button class="nav-link" :class="{ active: studentDetailTab === 'sd-goals' }" @click="studentDetailTab = 'sd-goals'">Goal Progress</button>
              </li>
              <li class="nav-item" role="presentation">
                <button class="nav-link" :class="{ active: studentDetailTab === 'sd-uploads' }" @click="studentDetailTab = 'sd-uploads'">Uploads</button>
              </li>
              <li class="nav-item" role="presentation">
                <button class="nav-link" :class="{ active: studentDetailTab === 'sd-personal' }" @click="studentDetailTab = 'sd-personal'">Personal Journal</button>
              </li>
              <li class="nav-item" role="presentation">
                <button class="nav-link" :class="{ active: studentDetailTab === 'sd-professional' }" @click="studentDetailTab = 'sd-professional'">Professional Journal</button>
              </li>
              <li class="nav-item" role="presentation">
                <button class="nav-link" :class="{ active: studentDetailTab === 'sd-feedbacks' }" @click="studentDetailTab = 'sd-feedbacks'">Feedbacks</button>
              </li>
              <li class="nav-item" role="presentation">
                <button class="nav-link" :class="{ active: studentDetailTab === 'sd-ai-summary' }" @click="studentDetailTab = 'sd-ai-summary'">AI Summary</button>
              </li>
            </ul>

            <div class="tab-content mt-3">
              <!-- Overview & Scores Tab -->
              <div v-show="studentDetailTab === 'sd-overview'" class="tab-pane fade" :class="{ 'show active': studentDetailTab === 'sd-overview' }">
                <div class="row mb-3">
                  <div class="col-md-6">
                    <h6>Accordo AI Quadrant Scores</h6>
                    <canvas ref="studentChartRef" id="studentQuadrantChart" class="chart-container"></canvas>
                  </div>
                  <div class="col-md-6">
                    <h6>Score Breakdown</h6>
                    <ul class="list-group">
                      <li class="list-group-item d-flex justify-content-between">
                        <span>Technical Skills & Competence</span>
                        <span class="badge bg-primary">{{ selectedStudent.technicalSkillsCompetence?.score || 0 }}</span>
                      </li>
                      <li class="list-group-item d-flex justify-content-between">
                        <span>Compositional & Musicianship Knowledge</span>
                        <span class="badge bg-primary">{{ selectedStudent.compositionalMusicianshipKnowledge?.score || 0 }}</span>
                      </li>
                      <li class="list-group-item d-flex justify-content-between">
                        <span>Repertoire & Cultural Knowledge</span>
                        <span class="badge bg-primary">{{ selectedStudent.repertoireCulturalKnowledge?.score || 0 }}</span>
                      </li>
                      <li class="list-group-item d-flex justify-content-between">
                        <span>Performing Artistry</span>
                        <span class="badge bg-primary">{{ selectedStudent.performingArtistry?.score || 0 }}</span>
                      </li>
                    </ul>
                  </div>
                </div>
                <div class="row">
                  <div class="col-12">
                    <h6>Teacher Technical Advice</h6>
                    <ul class="list-unstyled">
                      <li v-if="selectedStudent.technicalSkillsCompetence?.teacherTechnicalAdvice?.length > 0">
                        <strong>Technical Advice:</strong>
                        <ul>
                          <li v-for="advice in selectedStudent.technicalSkillsCompetence.teacherTechnicalAdvice" :key="advice">
                            <i class="bi bi-check-circle text-success"></i> {{ advice }}
                          </li>
                        </ul>
                      </li>
                      <li v-if="selectedStudent.technicalSkillsCompetence?.teacherChecklist" class="mt-2">
                        <strong>Teacher Checklist:</strong>
                        <div v-if="selectedStudent.technicalSkillsCompetence.teacherChecklist.achieved?.length > 0" class="mt-1">
                          <span class="text-success">✓ Achieved:</span> {{ selectedStudent.technicalSkillsCompetence.teacherChecklist.achieved.join(', ') }}
                        </div>
                        <div v-if="selectedStudent.technicalSkillsCompetence.teacherChecklist.partial?.length > 0" class="mt-1">
                          <span class="text-warning">◐ Partial:</span> {{ selectedStudent.technicalSkillsCompetence.teacherChecklist.partial.join(', ') }}
                        </div>
                      </li>
                      <li v-if="!selectedStudent.technicalSkillsCompetence?.teacherTechnicalAdvice?.length && !selectedStudent.technicalSkillsCompetence?.teacherChecklist" class="text-muted">
                        No advice recorded
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              <!-- Goal Progress Tab -->
              <div v-show="studentDetailTab === 'sd-goals'" class="tab-pane fade" :class="{ 'show active': studentDetailTab === 'sd-goals' }">
                <div class="alert alert-info">
                  <strong>Stage Progression:</strong> Students progress through stages based on positive feedback from teachers.
                </div>
                <div v-if="selectedStudent.profile.piecesInProgress?.length > 0">
                  <div v-for="(goal, index) in selectedStudent.profile.piecesInProgress" :key="goal" class="card mb-2">
                    <div class="card-body">
                      <div class="d-flex justify-content-between align-items-center">
                        <div>
                          <h6 class="mb-1">{{ goal }}</h6>
                          <div class="progress" style="width: 200px;">
                            <div class="progress-bar bg-primary-custom" role="progressbar" :style="`width: ${(index+1)*25}%`">{{ (index+1)*25 }}%</div>
                          </div>
                          <small class="text-muted">Stage: {{ index+1 }} of 4</small>
                        </div>
                        <div>
                          <button class="btn btn-sm btn-success">
                            <i class="bi bi-arrow-up-circle"></i> Progress Stage
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <p v-else class="text-muted">No goals assigned yet</p>
              </div>

              <!-- Uploads Tab -->
              <div v-show="studentDetailTab === 'sd-uploads'" class="tab-pane fade" :class="{ 'show active': studentDetailTab === 'sd-uploads' }">
                <div class="table-responsive">
                  <table class="table table-striped">
                    <thead>
                      <tr>
                        <th>File Name</th>
                        <th>Type</th>
                        <th>Upload Date</th>
                        <th>AI Analysis</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-if="selectedStudent.compositionalMusicianshipKnowledge?.auralEvidenceRecordings?.length > 0" v-for="(rec, idx) in selectedStudent.compositionalMusicianshipKnowledge.auralEvidenceRecordings" :key="idx">
                        <td><i class="bi bi-file-music"></i> {{ rec }}</td>
                        <td>Audio</td>
                        <td>Jan {{ 10 + idx }}, 2026</td>
                        <td><span class="badge bg-success">Analyzed</span></td>
                        <td><button class="btn btn-sm btn-info">View</button></td>
                      </tr>
                      <tr v-else>
                        <td colspan="5" class="text-muted text-center">No uploads yet</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <!-- Personal Journal Tab -->
              <div v-show="studentDetailTab === 'sd-personal'" class="tab-pane fade" :class="{ 'show active': studentDetailTab === 'sd-personal' }">
                <div v-if="selectedStudent.compositionalMusicianshipKnowledge?.creativeReflectiveNotes?.length > 0">
                  <div v-for="note in selectedStudent.compositionalMusicianshipKnowledge.creativeReflectiveNotes" :key="note" class="card mb-2">
                    <div class="card-body">
                      <h6>Musicianship Reflection</h6>
                      <p class="mb-0">{{ note }}</p>
                    </div>
                  </div>
                </div>
                <p v-else class="text-muted">No personal journal entries yet</p>
              </div>

              <!-- Professional Journal Tab -->
              <div v-show="studentDetailTab === 'sd-professional'" class="tab-pane fade" :class="{ 'show active': studentDetailTab === 'sd-professional' }">
                <div v-if="selectedStudent.performingArtistry?.studentPerformanceReflections?.length > 0">
                  <div v-for="refl in selectedStudent.performingArtistry.studentPerformanceReflections" :key="refl.date" class="card mb-2">
                    <div class="card-body">
                      <div class="d-flex justify-content-between">
                        <h6>{{ refl.performance }}</h6>
                        <small class="text-muted">{{ refl.date }}</small>
                      </div>
                      <p class="mb-0">{{ refl.reflection }}</p>
                    </div>
                  </div>
                </div>
                <p v-else class="text-muted">No professional journal entries yet</p>
              </div>

              <!-- Feedbacks Tab -->
              <div v-show="studentDetailTab === 'sd-feedbacks'" class="tab-pane fade" :class="{ 'show active': studentDetailTab === 'sd-feedbacks' }">
                <div v-if="selectedStudent.performingArtistry?.teacherPerformancePrepNotes?.length > 0">
                  <div v-for="(note, idx) in selectedStudent.performingArtistry.teacherPerformancePrepNotes" :key="idx" class="card mb-2">
                    <div class="card-body">
                      <div class="d-flex justify-content-between">
                        <div>
                          <h6>{{ selectedStudent.profile.programme }} - Performance Preparation</h6>
                          <p class="mb-1"><strong>Teacher Guidance:</strong></p>
                          <p class="mb-0">{{ note }}</p>
                        </div>
                        <small class="text-muted">Jan {{ 11 + idx }}, 2026</small>
                      </div>
                    </div>
                  </div>
                </div>
                <p v-else class="text-muted">No feedback given yet</p>
              </div>

              <!-- AI Summary Tab -->
              <div v-show="studentDetailTab === 'sd-ai-summary'" class="tab-pane fade" :class="{ 'show active': studentDetailTab === 'sd-ai-summary' }">
                <div class="card">
                  <div class="card-body">
                    <h6 class="card-title">AI-Generated Progress Summary</h6>
                    <div>
                      <p><strong>Overall Progress:</strong> {{ selectedStudent.profile.name.first }} ({{ selectedStudent.profile.age }} years old, {{ selectedStudent.profile.stage }} stage) has an average score of {{ getAverageScore(selectedStudent) }} across all quadrants.</p>
                      <p><strong>Enrolled:</strong> {{ selectedStudent.profile.enrollmentDate }} in {{ selectedStudent.profile.programme }}</p>
                      <p><strong>Current Repertoire:</strong> Working on {{ selectedStudent.profile.piecesInProgress?.length || 0 }} pieces: {{ selectedStudent.profile.piecesInProgress?.join(', ') || 'None' }}</p>
                      <p><strong>Listening Activity:</strong> {{ selectedStudent.repertoireCulturalKnowledge?.listeningLogs?.length || 0 }} listening log entries recorded</p>
                      <p><strong>Performance History:</strong> {{ selectedStudent.performingArtistry?.studentPerformanceReflections?.length || 0 }} performance reflections documented</p>
                    </div>
                  </div>
                </div>
                <div class="card mt-3">
                  <div class="card-body">
                    <h6 class="card-title">Identified Issues & Recommendations</h6>
                    <div>
                      <p class="text-success mb-0"><i class="bi bi-check-circle"></i> Excellent progress across all areas. Student is well-rounded and performing above expectations.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="closeStudentModal">Close</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Dashboard styles are in dashboard.css */
</style>
