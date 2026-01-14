<script setup>
import { ref } from 'vue'
import { RouterLink } from 'vue-router'

const firstName = ref('')
const lastName = ref('')
const email = ref('')
const age = ref('')
const instrument = ref('')
const password = ref('')
const confirmPassword = ref('')
const terms = ref(false)

const instruments = [
  'Violin',
  'Viola',
  'Cello',
  'Double Bass',
  'Flute',
  'Clarinet',
  'Oboe',
  'Bassoon',
  'Trumpet',
  'Trombone',
  'French Horn',
  'Tuba',
  'Piano',
  'Voice',
  'Guitar',
  'Other'
]

const handleSignup = async (e) => {
  e.preventDefault()
  // TODO: Implement signup logic
  console.log('Signup submitted', {
    firstName: firstName.value,
    lastName: lastName.value,
    email: email.value,
    age: age.value,
    instrument: instrument.value,
    password: password.value
  })
}
</script>

<template>
  <div class="signup-container">
    <div class="container">
      <div class="row justify-content-center">
        <div class="col-md-8 col-lg-6">
          <div class="card signup-card">
            <div class="card-body p-5">
              <div class="text-center mb-4">
                <RouterLink to="/" class="auth-logo-link d-flex flex-column align-items-center">
                  <img src="/Riam Logo.png" alt="RIAM Logo" style="height: 60px; margin-bottom: 12px;" />
                  <div class="logo-text" style="cursor: pointer;">Accordo AI</div>
                </RouterLink>
                <div class="logo-subtitle">Digital Music Passport & AI Coaching</div>
              </div>

              <h5 class="text-center mb-4">Create Student Account</h5>

              <!-- Student Sign Up Form -->
              <form @submit.prevent="handleSignup">
                <div class="row">
                  <div class="col-md-6 mb-3">
                    <label for="studentFirstName" class="form-label">First Name</label>
                    <input
                      type="text"
                      class="form-control"
                      id="studentFirstName"
                      v-model="firstName"
                      placeholder="Enter your first name"
                      required
                    />
                  </div>
                  <div class="col-md-6 mb-3">
                    <label for="studentLastName" class="form-label">Last Name</label>
                    <input
                      type="text"
                      class="form-control"
                      id="studentLastName"
                      v-model="lastName"
                      placeholder="Enter your last name"
                      required
                    />
                  </div>
                </div>
                <div class="mb-3">
                  <label for="studentEmail" class="form-label">Email Address</label>
                  <input
                    type="email"
                    class="form-control"
                    id="studentEmail"
                    v-model="email"
                    placeholder="Enter your email"
                    required
                  />
                </div>
                <div class="mb-3">
                  <label for="studentAge" class="form-label">Age</label>
                  <input
                    type="number"
                    class="form-control"
                    id="studentAge"
                    v-model="age"
                    placeholder="Enter your age"
                    min="5"
                    max="100"
                    required
                  />
                </div>
                <div class="mb-3">
                  <label for="studentInstrument" class="form-label">Instrument</label>
                  <select class="form-select" id="studentInstrument" v-model="instrument" required>
                    <option value="">Select your instrument</option>
                    <option v-for="inst in instruments" :key="inst" :value="inst">{{ inst }}</option>
                  </select>
                </div>
                <div class="mb-3">
                  <label for="studentPassword" class="form-label">Password</label>
                  <input
                    type="password"
                    class="form-control"
                    id="studentPassword"
                    v-model="password"
                    placeholder="Create a password (min. 8 characters)"
                    minlength="8"
                    required
                  />
                </div>
                <div class="mb-3">
                  <label for="studentConfirmPassword" class="form-label">Confirm Password</label>
                  <input
                    type="password"
                    class="form-control"
                    id="studentConfirmPassword"
                    v-model="confirmPassword"
                    placeholder="Confirm your password"
                    required
                  />
                </div>
                <div class="mb-3 form-check">
                  <input type="checkbox" class="form-check-input" id="studentTerms" v-model="terms" required>
                  <label class="form-check-label" for="studentTerms">
                    I agree to the <a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a>
                  </label>
                </div>
                <button type="submit" class="btn btn-primary-custom w-100 mb-3">
                  Create Student Account
                </button>
                <div class="text-center">
                  <p class="mb-0">Already have an account? <RouterLink to="/login" class="text-decoration-none">Sign in here</RouterLink></p>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Signup page styles are in dashboard.css */
</style>
