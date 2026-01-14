<script setup>
import { onMounted, onBeforeUnmount } from 'vue'
import { RouterLink } from 'vue-router'

let navbarScrolled = false

onMounted(() => {
  const handleScroll = () => {
    const navbar = document.getElementById('navbar')
    if (navbar) {
      if (window.scrollY > 50) {
        navbar.classList.add('scrolled')
        navbarScrolled = true
      } else {
        navbar.classList.remove('scrolled')
        navbarScrolled = false
      }
    }
  }
  window.addEventListener('scroll', handleScroll)
  
  // Cleanup
  onBeforeUnmount(() => {
    window.removeEventListener('scroll', handleScroll)
  })
})
</script>

<template>
  <div class="landing-page">
    <!-- Navigation -->
    <nav class="modern-nav" id="navbar">
      <div class="nav-container">
        <RouterLink to="/" class="nav-logo d-flex align-items-center">
          <img src="/RIAM_Logo_White.png" alt="RIAM Logo" style="height: 45px; margin-right: 12px; filter: brightness(0);" />
          <div class="logo-text" style="font-size: 1.5rem; font-weight: 800; background: linear-gradient(135deg, #69347e 0%, #8b5a9e 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">
            Accordo AI
          </div>
        </RouterLink>
        <div class="nav-menu">
          <a href="#features" class="nav-link">Features</a>
          <a href="#quadrants" class="nav-link">Quadrant Model</a>
          <a href="#technology" class="nav-link">Technology</a>
          <RouterLink to="/login" class="nav-link">Login</RouterLink>
          <RouterLink to="/signup" class="nav-btn">Get Started</RouterLink>
        </div>
      </div>
    </nav>

    <!-- Hero Section -->
    <section class="hero-section">
      <div class="hero-decoration decoration-1"></div>
      <div class="hero-decoration decoration-2"></div>
      <div class="hero-decoration decoration-3"></div>

      <div class="hero-content">
        <h1 class="hero-title">Transform Music Education<br/>with AI-Powered Insights</h1>
        <p class="hero-subtitle">
          Accordo AI's revolutionary platform unifies student progress, performance feedback,
          and personalized coaching powered by AWS Bedrock AI.
        </p>
        <br/>
        <div class="hero-buttons">
          <a href="#features" class="hero-btn-primary">
            <i class="bi bi-rocket-takeoff"></i> Explore Platform
          </a>
          <RouterLink to="/login" class="hero-btn-secondary">
            <i class="bi bi-box-arrow-in-right"></i> Sign In
          </RouterLink>
        </div>
      </div>
    </section>

    <!-- Features Section -->
    <section id="features" class="feature-section">
      <div class="section-container">
        <div class="section-header">
          <h2 class="section-title">Powerful Features</h2>
          <p class="section-subtitle">Everything you need to track, analyze, and enhance musical development</p>
        </div>

        <div class="features-grid">
          <div class="feature-card">
            <div class="feature-icon">🎵</div>
            <h3 class="feature-title">Digital Passport</h3>
            <p class="feature-description">
              A comprehensive student profile tracking development across four quadrants
              with interactive visual progress indicators and performance analytics.
            </p>
          </div>

          <div class="feature-card">
            <div class="feature-icon">🤖</div>
            <h3 class="feature-title">AI Feedback Engine</h3>
            <p class="feature-description">
              Instant, intelligent performance analysis from audio recordings using
              Amazon Bedrock Nova for detailed, actionable feedback.
            </p>
          </div>

          <div class="feature-card">
            <div class="feature-icon">💬</div>
            <h3 class="feature-title">Conversational AI Coach</h3>
            <p class="feature-description">
              24/7 personalized coaching conversations powered by Bedrock AgentCore,
              providing guidance tailored to each student's needs.
            </p>
          </div>

          <div class="feature-card">
            <div class="feature-icon">📊</div>
            <h3 class="feature-title">Progress Analytics</h3>
            <p class="feature-description">
              Real-time dashboards and detailed reports tracking technical skills,
              musicianship, repertoire knowledge, and performance artistry.
            </p>
          </div>

          <div class="feature-card">
            <div class="feature-icon">🎯</div>
            <h3 class="feature-title">Goal Tracking</h3>
            <p class="feature-description">
              Stage-based goal system with visual progress tracking, helping students
              and teachers monitor achievement and growth over time.
            </p>
          </div>

          <div class="feature-card">
            <div class="feature-icon">👥</div>
            <h3 class="feature-title">Multi-Role Portals</h3>
            <p class="feature-description">
              Specialized interfaces for students, teachers, and administrators,
              each optimized for their unique workflows and needs.
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- Quadrants Section -->
    <section id="quadrants" class="quadrants-section">
      <div class="section-container">
        <div class="section-header">
          <h2 class="section-title">Accordo AI Quadrant Framework</h2>
          <p class="section-subtitle">A holistic approach to music education assessment</p>
        </div>

        <!-- Quadrant Diagram -->
        <div class="quadrant-diagram">
          <img 
            src="/RIAM_Quadrant_Model-nobg.png" 
            alt="Accordo AI Quadrant Framework Diagram" 
            class="img-fluid"
          />
        </div>

        <div class="quadrants-grid">
          <div class="quadrant-card">
            <div class="quadrant-number">1</div>
            <h3 class="feature-title">Technical Skills & Competence</h3>
            <p class="feature-description">
              Comprehensive tracking of technique marks, teacher advice, skills checklists,
              and practical assessments to monitor technical development.
            </p>
          </div>

          <div class="quadrant-card">
            <div class="quadrant-number">2</div>
            <h3 class="feature-title">Compositional & Musicianship Knowledge</h3>
            <p class="feature-description">
              Musicianship marks, aural recordings, creative reflections, and theory
              assessments to develop musical understanding and literacy.
            </p>
          </div>

          <div class="quadrant-card">
            <div class="quadrant-number">3</div>
            <h3 class="feature-title">Repertoire & Cultural Knowledge</h3>
            <p class="feature-description">
              Repertoire marks, listening logs, cultural context notes, and historical
              understanding to broaden musical knowledge and appreciation.
            </p>
          </div>

          <div class="quadrant-card">
            <div class="quadrant-number">4</div>
            <h3 class="feature-title">Performing Artistry</h3>
            <p class="feature-description">
              Artistry marks, performance reflections, preparation notes, and stage
              presence to cultivate expressive and confident performers.
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- Technology Section -->
    <section id="technology" class="feature-section">
      <div class="section-container">
        <div class="section-header">
          <h2 class="section-title">Built on AWS Cloud</h2>
          <p class="section-subtitle">Enterprise-grade infrastructure for scalable, secure music education</p>
        </div>

        <div class="features-grid">
          <div class="feature-card">
            <div class="feature-icon">☁️</div>
            <h3 class="feature-title">Amazon Bedrock Nova</h3>
            <p class="feature-description">
              Advanced AI models for intelligent audio analysis and performance assessment.
            </p>
          </div>

          <div class="feature-card">
            <div class="feature-icon">🧠</div>
            <h3 class="feature-title">Bedrock AgentCore</h3>
            <p class="feature-description">
              Conversational AI framework for natural, context-aware student coaching.
            </p>
          </div>

          <div class="feature-card">
            <div class="feature-icon">💾</div>
            <h3 class="feature-title">Amazon S3</h3>
            <p class="feature-description">
              Secure, scalable storage for audio recordings and digital resources.
            </p>
          </div>

          <div class="feature-card">
            <div class="feature-icon">🔐</div>
            <h3 class="feature-title">AWS Cognito</h3>
            <p class="feature-description">
              Robust authentication and role-based access control for all users.
            </p>
          </div>
        </div>
      </div>
    </section>


    <!-- Footer -->
    <footer class="modern-footer">
      <div class="footer-content">
        <div class="footer-links">
          <a href="#features" class="footer-link">Features</a>
          <a href="#quadrants" class="footer-link">Quadrant Model</a>
          <a href="#technology" class="footer-link">Technology</a>
          <RouterLink to="/login" class="footer-link">Login</RouterLink>
          <RouterLink to="/signup" class="footer-link">Sign Up</RouterLink>
        </div>
        <div class="footer-bottom">
          <p>Reimagining music education through responsible AI</p>
          <p>Accordo AI | AWS Breaking Barriers Challenge 2026</p>
          <p style="margin-top: 1rem;">&copy; 2026 Accordo AI. All rights reserved.</p>
        </div>
      </div>
    </footer>
  </div>
</template>

<style scoped>
/* Particle Background */
.particles {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: -1;
  background: linear-gradient(135deg, #69347e 0%, #8b5a9e 100%);
}

/* Navigation */
.modern-nav {
  position: fixed;
  top: 0;
  width: 100%;
  height: 90px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  box-shadow: 0 4px 30px rgba(0, 0, 0, 0.1);
  z-index: 1000;
  padding: 1rem 0;
  transition: all 0.3s ease;
}

.modern-nav.scrolled {
  padding: 0.5rem 0;
  box-shadow: 0 4px 30px rgba(0, 0, 0, 0.2);
}

.nav-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.nav-logo img {
  height: 50px;
  transition: transform 0.3s ease;
}

.nav-logo:hover img {
  transform: scale(1.05);
}

.nav-menu {
  display: flex;
  gap: 2rem;
  align-items: center;
}

.nav-link {
  color: #2d3748;
  font-weight: 600;
  text-decoration: none;
  transition: all 0.3s ease;
  position: relative;
}

.nav-link::after {
  content: '';
  position: absolute;
  bottom: -5px;
  left: 0;
  width: 0;
  height: 2px;
  background: linear-gradient(135deg, #69347e 0%, #8b5a9e 100%);
  transition: width 0.3s ease;
}

.nav-link:hover::after {
  width: 100%;
}

.nav-btn {
  background: linear-gradient(135deg, #69347e 0%, #8b5a9e 100%);
  color: white;
  padding: 0.75rem 1.5rem;
  border-radius: 50px;
  text-decoration: none;
  font-weight: 600;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(105, 52, 126, 0.4);
}

.nav-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(105, 52, 126, 0.6);
  color: white;
}

/* Hero Section */
.hero-section {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  background: linear-gradient(135deg, #69347e 0%, #8b5a9e 100%);
  overflow: hidden;
  padding: 6rem 2rem 4rem;
}

.hero-content {
  max-width: 1200px;
  text-align: center;
  color: white;
  z-index: 1;
  animation: fadeInUp 1s ease-out;
}

.hero-title {
  font-size: 4rem;
  font-weight: 900;
  margin-bottom: 1.5rem;
  line-height: 1.2;
  background: linear-gradient(to right, #ffffff, #e0e7ff);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.hero-subtitle {
  font-size: 1.5rem;
  margin-bottom: 3rem;
  opacity: 0.95;
  line-height: 1.6;
  max-width: 800px;
  margin-left: auto;
  margin-right: auto;
}

.hero-buttons {
  display: flex;
  gap: 1.5rem;
  justify-content: center;
  flex-wrap: wrap;
}

.hero-btn-primary {
  background: white;
  color: #69347e;
  padding: 1rem 2.5rem;
  border-radius: 50px;
  text-decoration: none;
  font-weight: 700;
  font-size: 1.1rem;
  transition: all 0.3s ease;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);
}

.hero-btn-primary:hover {
  transform: translateY(-3px);
  box-shadow: 0 12px 35px rgba(0, 0, 0, 0.3);
  color: #69347e;
}

.hero-btn-secondary {
  background: rgba(255, 255, 255, 0.2);
  color: white;
  padding: 1rem 2.5rem;
  border-radius: 50px;
  text-decoration: none;
  font-weight: 700;
  font-size: 1.1rem;
  border: 2px solid white;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
}

.hero-btn-secondary:hover {
  background: white;
  color: #69347e;
  transform: translateY(-3px);
}

/* Floating Animation */
.hero-decoration {
  position: absolute;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  animation: float 6s ease-in-out infinite;
}

.decoration-1 {
  width: 300px;
  height: 300px;
  top: 10%;
  left: 10%;
  animation-delay: 0s;
}

.decoration-2 {
  width: 200px;
  height: 200px;
  top: 60%;
  right: 10%;
  animation-delay: 2s;
}

.decoration-3 {
  width: 150px;
  height: 150px;
  bottom: 20%;
  left: 15%;
  animation-delay: 4s;
}

/* Feature Section */
.feature-section {
  padding: 6rem 2rem;
  background: white;
}

.section-container {
  max-width: 1200px;
  margin: 0 auto;
}

.section-header {
  text-align: center;
  margin-bottom: 4rem;
}

.section-title {
  font-size: 3rem;
  font-weight: 800;
  color: #2d3748;
  margin-bottom: 1rem;
}

.section-subtitle {
  font-size: 1.25rem;
  color: #718096;
  max-width: 600px;
  margin: 0 auto;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
}

.feature-card {
  background: white;
  border-radius: 20px;
  padding: 2.5rem;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.feature-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 4px;
  background: linear-gradient(135deg, #69347e 0%, #8b5a9e 100%);
  transform: scaleX(0);
  transition: transform 0.3s ease;
}

.feature-card:hover {
  transform: translateY(-10px);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
}

.feature-card:hover::before {
  transform: scaleX(1);
}

.feature-icon {
  width: 70px;
  height: 70px;
  border-radius: 15px;
  background: linear-gradient(135deg, #69347e 0%, #8b5a9e 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  margin-bottom: 1.5rem;
  animation: float 3s ease-in-out infinite;
}

.feature-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #2d3748;
  margin-bottom: 1rem;
}

.feature-description {
  color: #718096;
  line-height: 1.6;
}

/* Quadrants Section */
.quadrants-section {
  padding: 6rem 2rem;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
}

.quadrant-diagram {
  text-align: center;
  padding: 2rem 0;
  margin-bottom: 3rem;
}

.quadrant-diagram img {
  max-width: 100%;
  height: auto;
  max-height: 600px;
  width: auto;
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease;
}

.quadrant-diagram img:hover {
  transform: scale(1.02);
}

.quadrants-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 2rem;
}

.quadrant-card {
  background: white;
  border-radius: 20px;
  padding: 2.5rem;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  position: relative;
}

.quadrant-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 6px;
  border-radius: 20px 20px 0 0;
  transition: all 0.3s ease;
}

.quadrant-card:nth-child(1)::before {
  background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
}

.quadrant-card:nth-child(2)::before {
  background: linear-gradient(135deg, #69347e 0%, #8b5a9e 100%);
}

.quadrant-card:nth-child(3)::before {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.quadrant-card:nth-child(4)::before {
  background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
}

.quadrant-card:hover {
  transform: translateY(-10px);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
}

.quadrant-number {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, #69347e 0%, #8b5a9e 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  margin-bottom: 1rem;
}

/* CTA Section */
.cta-section {
  padding: 6rem 2rem;
  background: linear-gradient(135deg, #69347e 0%, #8b5a9e 100%);
  text-align: center;
  color: white;
}

.cta-title {
  font-size: 3rem;
  font-weight: 800;
  margin-bottom: 1.5rem;
}

.cta-description {
  font-size: 1.25rem;
  margin-bottom: 3rem;
  opacity: 0.95;
}

/* Footer */
.modern-footer {
  background: #1a202c;
  color: white;
  padding: 4rem 2rem 2rem;
}

.footer-content {
  max-width: 1200px;
  margin: 0 auto;
  text-align: center;
}

.footer-logo {
  margin-bottom: 2rem;
}

.footer-links {
  display: flex;
  justify-content: center;
  gap: 2rem;
  margin-bottom: 2rem;
  flex-wrap: wrap;
}

.footer-link {
  color: #a0aec0;
  text-decoration: none;
  transition: color 0.3s ease;
}

.footer-link:hover {
  color: white;
}

.footer-bottom {
  padding-top: 2rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  color: #a0aec0;
}

/* Responsive */
@media (max-width: 768px) {
  .hero-title {
    font-size: 2.5rem;
  }

  .hero-subtitle {
    font-size: 1.2rem;
  }

  .section-title {
    font-size: 2rem;
  }

  .quadrants-grid {
    grid-template-columns: 1fr;
  }

  .quadrant-diagram img {
    max-height: 400px;
  }

  .nav-menu {
    display: none;
  }
}
</style>
