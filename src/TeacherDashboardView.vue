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

const activeTab = ref('classes')
const sidebarOpen = ref(false)
const profilePictureUrl = ref(null)

// Student view state
const selectedStudent = ref(null)
const showStudentModal = ref(false)
const studentDetailTab = ref('sd-overview')
const studentChartRef = ref(null)
let currentStudentChart = null

// Feedback modal state
const showFeedbackModal = ref(false)
const selectedFileForFeedback = ref(null)

// Set Goal form state
const goalForm = ref({
  programme: '',
  title: '',
  description: '',
  stages: [
    { id: 1, name: '', description: '' },
    { id: 2, name: '', description: '' }
  ]
})
let nextStageId = 3

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
      piecesInProgress: ['Twinkle Twinkle Variations A', 'Lightly Row', 'Suzuki Etude 1'],
      goals: [
        {
          title: 'Twinkle Twinkle Variations A',
          description: 'Master this foundational piece with proper bow technique and intonation',
          programme: 'Junior RIAM (Years 1-2)',
          dueDate: 'February 15, 2026',
          stages: [
            { number: 1, completed: true, name: 'Learn notes and rhythm' },
            { number: 2, completed: true, name: 'Practice with correct tempo' },
            { number: 3, completed: false, current: true, name: 'Add dynamics and expression' },
            { number: 4, completed: false, name: 'Performance ready' }
          ],
          progress: 75
        },
        {
          title: 'Lightly Row',
          description: 'Develop smooth bowing technique and musical phrasing',
          programme: 'Junior RIAM (Years 1-2)',
          dueDate: 'March 1, 2026',
          stages: [
            { number: 1, completed: true, name: 'Learn notes and rhythm' },
            { number: 2, completed: false, current: true, name: 'Practice with correct tempo' },
            { number: 3, completed: false, name: 'Add dynamics and expression' },
            { number: 4, completed: false, name: 'Performance ready' }
          ],
          progress: 50
        },
        {
          title: 'Suzuki Etude 1',
          description: 'Focus on bow control and left-hand finger placement',
          programme: 'Junior RIAM (Years 1-2)',
          dueDate: 'March 15, 2026',
          stages: [
            { number: 1, completed: false, current: true, name: 'Learn notes and rhythm' },
            { number: 2, completed: false, name: 'Practice with correct tempo' },
            { number: 3, completed: false, name: 'Add dynamics and expression' },
            { number: 4, completed: false, name: 'Performance ready' }
          ],
          progress: 25
        }
      ]
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
    programme: s.profile.programme,
    averageScore: getAverageScore(s),
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

// Set Goal form methods
const addStage = () => {
  goalForm.value.stages.push({
    id: nextStageId++,
    name: '',
    description: ''
  })
}

const removeStage = (stageId) => {
  if (goalForm.value.stages.length > 1) {
    goalForm.value.stages = goalForm.value.stages.filter(stage => stage.id !== stageId)
  }
}

const handleSubmitGoal = () => {
  // TODO: Submit goal to backend API
  console.log('Submitting goal:', goalForm.value)
  // Reset form after submission
  goalForm.value = {
    programme: '',
    title: '',
    description: '',
    stages: [
      { id: 1, name: '', description: '' },
      { id: 2, name: '', description: '' }
    ]
  }
  nextStageId = 3
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
                <div class="col-md-6 mb-3">
                  <div class="card">
                    <div class="card-body">
                      <h5 class="card-title">Junior RIAM (Years 3-4)</h5>
                      <p class="card-text">Intermediate level for developing musicians</p>
                      <p class="mb-1"><small class="text-muted"><strong>Students:</strong> 1</small></p>
                      <p class="mb-1"><small class="text-muted"><strong>Instruments:</strong> Flute</small></p>
                      <p class="mb-1"><small class="text-muted"><strong>Stage:</strong> Intermediate</small></p>
                      <button class="btn btn-sm btn-primary-custom mt-2">View Programme</button>
                    </div>
                  </div>
                </div>
                <div class="col-md-6 mb-3">
                  <div class="card">
                    <div class="card-body">
                      <h5 class="card-title">Junior RIAM (Years 5-6)</h5>
                      <p class="card-text">Advanced junior level for experienced students</p>
                      <p class="mb-1"><small class="text-muted"><strong>Students:</strong> 1</small></p>
                      <p class="mb-1"><small class="text-muted"><strong>Instruments:</strong> Piano</small></p>
                      <p class="mb-1"><small class="text-muted"><strong>Stage:</strong> Advanced</small></p>
                      <button class="btn btn-sm btn-primary-custom mt-2">View Programme</button>
                    </div>
                  </div>
                </div>
                <div class="col-md-6 mb-3">
                  <div class="card">
                    <div class="card-body">
                      <h5 class="card-title">Young Artist Programme</h5>
                      <p class="card-text">Elite programme for pre-professional musicians</p>
                      <p class="mb-1"><small class="text-muted"><strong>Students:</strong> 2</small></p>
                      <p class="mb-1"><small class="text-muted"><strong>Instruments:</strong> Trumpet, Voice</small></p>
                      <p class="mb-1"><small class="text-muted"><strong>Stage:</strong> Advanced</small></p>
                      <button class="btn btn-sm btn-primary-custom mt-2">View Programme</button>
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
                  <form @submit.prevent="handleSubmitGoal">
                    <div class="mb-3">
                      <label for="goalClass" class="form-label">Select Programme/Student</label>
                      <select class="form-select" id="goalClass" v-model="goalForm.programme">
                        <option value="">Select Programme/Student</option>
                        <option>Junior RIAM (Years 1–2) - All Students</option>
                        <option>Junior RIAM (Years 3-4) - All Students</option>
                        <option>Junior RIAM (Years 5-6) - All Students</option>
                        <option>Young Artist Programme - All Students</option>
                        <option>Individual: Aoife Byrne (S01)</option>
                        <option>Individual: Conor Walsh (S02)</option>
                        <option>Individual: Ella Murphy (S03)</option>
                        <option>Individual: Rory Fitzpatrick (S04)</option>
                        <option>Individual: Saoirse Nolan (S05)</option>
                      </select>
                    </div>
                    <div class="mb-3">
                      <label for="goalTitle" class="form-label">Goal Title (Piece/Skill Name)</label>
                      <input type="text" class="form-control" id="goalTitle" v-model="goalForm.title" placeholder="e.g., Twinkle Twinkle Variations A">
                    </div>
                    <div class="mb-3">
                      <label for="goalDescription" class="form-label">Description</label>
                      <textarea class="form-control" id="goalDescription" rows="2" v-model="goalForm.description" placeholder="Describe the goal and overall objective..."></textarea>
                    </div>

                    <!-- Stages Section -->
                    <div class="mb-3">
                      <label class="form-label"><strong>Stages</strong> (Each stage requires positive feedback to progress)</label>
                      <div v-for="(stage, index) in goalForm.stages" :key="stage.id" class="card mb-2 stage-item">
                        <div class="card-body">
                          <div class="d-flex justify-content-between align-items-center mb-2">
                            <h6 class="mb-0">Stage {{ index + 1 }}</h6>
                            <button 
                              type="button" 
                              class="btn btn-sm btn-danger" 
                              @click="removeStage(stage.id)"
                              :disabled="goalForm.stages.length === 1"
                            >
                              Remove
                            </button>
                          </div>
                          <input 
                            type="text" 
                            class="form-control mb-2" 
                            v-model="stage.name"
                            placeholder="Stage name (e.g., Learn notes and rhythm)" 
                          />
                          <textarea 
                            class="form-control" 
                            rows="2" 
                            v-model="stage.description"
                            placeholder="Stage description and requirements..."
                          ></textarea>
                        </div>
                      </div>
                      <button type="button" class="btn btn-sm btn-outline-primary mt-2" @click="addStage">
                        <i class="bi bi-plus-circle"></i> Add Another Stage
                      </button>
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
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="student in studentsForTable" :key="student.studentId">
                      <td>{{ student.name }}</td>
                      <td>{{ student.programme }}</td>
                      <td><span class="badge" :class="student.averageScore >= 75 ? 'bg-success' : student.averageScore >= 50 ? 'bg-warning' : 'bg-danger'">{{ student.averageScore }}%</span></td>
                      <td><button class="btn btn-sm btn-info" @click="viewStudent(student)">View</button></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <!-- Give Feedback Tab -->
            <div v-show="activeTab === 'feedback'" class="tab-pane fade" :class="{ 'show active': activeTab === 'feedback' }">
              <div class="d-flex justify-content-between align-items-center mb-3">
                <h4>Review Student Uploads & Give Feedback</h4>
              </div>
              <p class="text-muted mb-3">Review student practice recordings and provide feedback to help them progress.</p>
              
              <!-- Student Uploads Table -->
              <div class="card mb-3">
                <div class="card-header bg-primary-custom text-white">
                  <h5 class="mb-0">Student Uploads</h5>
                </div>
                <div class="card-body">
                  <div class="table-responsive">
                    <table class="table table-hover">
                      <thead>
                        <tr>
                          <th>Student</th>
                          <th>File Name</th>
                          <th>Type</th>
                          <th>Upload Date</th>
                          <th>Status</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td>Aoife Byrne (S01)</td>
                          <td><i class="bi bi-file-music"></i> Piano file 3 mins.mp3</td>
                          <td>Audio</td>
                          <td>{{ new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) }}</td>
                          <td><span class="badge bg-warning">Pending Feedback</span></td>
                          <td>
                            <button class="btn btn-sm btn-primary-custom" @click="showFeedbackModal = true; selectedFileForFeedback = { student: 'Aoife Byrne (S01)', file: 'Piano file 3 mins.mp3' }">
                              <i class="bi bi-chat-left-quote"></i> Give Feedback
                            </button>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- Feedback Modal -->
            <div v-if="showFeedbackModal" class="modal fade show" :class="{ 'd-block': showFeedbackModal }" tabindex="-1" style="background-color: rgba(0,0,0,0.5);">
              <div class="modal-dialog">
                <div class="modal-content">
                  <div class="modal-header">
                    <h5 class="modal-title">Give Feedback</h5>
                    <button type="button" class="btn-close" @click="showFeedbackModal = false"></button>
                  </div>
                  <div class="modal-body">
                    <form>
                      <div class="mb-3">
                        <label for="feedbackStudent" class="form-label">Student</label>
                        <input type="text" class="form-control" id="feedbackStudent" :value="selectedFileForFeedback?.student || 'Aoife Byrne (S01)'" readonly>
                      </div>
                      <div class="mb-3">
                        <label for="feedbackFile" class="form-label">File</label>
                        <input type="text" class="form-control" id="feedbackFile" :value="selectedFileForFeedback?.file || 'Piano file 3 mins.mp3'" readonly>
                      </div>
                      <div class="mb-3">
                        <label for="feedbackGrade" class="form-label">Grade</label>
                        <select class="form-select" id="feedbackGrade">
                          <option value="">Select Grade</option>
                          <option>A+</option>
                          <option>A</option>
                          <option>B+</option>
                          <option>B</option>
                          <option>C+</option>
                          <option>C</option>
                          <option>D</option>
                          <option>F</option>
                        </select>
                      </div>
                      <div class="mb-3">
                        <label for="feedbackComments" class="form-label">Feedback Comments</label>
                        <textarea class="form-control" id="feedbackComments" rows="5" placeholder="Provide detailed feedback on the student's performance..."></textarea>
                      </div>
                    </form>
                  </div>
                  <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" @click="showFeedbackModal = false">Cancel</button>
                    <button type="button" class="btn btn-primary-custom">Submit Feedback</button>
                  </div>
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
                <div v-if="selectedStudent.profile.goals?.length > 0">
                  <div v-for="goal in selectedStudent.profile.goals" :key="goal.title" class="card mb-2">
                    <div class="card-body">
                      <div class="d-flex justify-content-between align-items-center">
                        <div>
                          <h6 class="mb-1">{{ goal.title }}</h6>
                          <p class="mb-1 small text-muted">{{ goal.description }}</p>
                          <p class="mb-1 small text-muted"><strong>Programme:</strong> {{ goal.programme }} | <strong>Due:</strong> {{ goal.dueDate }}</p>
                          <div class="mt-2 mb-2">
                            <span v-for="stage in goal.stages" :key="stage.number" class="badge me-1" :class="{
                              'bg-success': stage.completed,
                              'bg-primary': stage.current,
                              'bg-secondary': !stage.completed && !stage.current
                            }">
                              Stage {{ stage.number }}{{ stage.completed ? ' ✓' : '' }}{{ stage.current ? ' (Current)' : '' }}
                            </span>
                          </div>
                          <div class="progress" style="width: 200px;">
                            <div class="progress-bar bg-primary-custom" role="progressbar" :style="`width: ${goal.progress}%`">{{ goal.progress }}%</div>
                          </div>
                          <small class="text-muted">Current Stage: {{ goal.stages.find(s => s.current)?.name || goal.stages.find(s => !s.completed)?.name || 'Completed' }}</small>
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
                <div v-else-if="selectedStudent.profile.piecesInProgress?.length > 0">
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
