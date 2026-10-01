import { useEffect, useRef, useState } from 'react'
import './App.css'

const TOTAL_FRAMES = 300

const getFrameUrl = (index) => {
  const frameNumber = String(index + 1).padStart(3, '0')
  return `/frames/ezgif-frame-${frameNumber}.jpg`
}

function App() {
  const canvasRef = useRef(null)
  const imagesRef = useRef(new Array(TOTAL_FRAMES))
  const targetProgress = useRef(0)
  const currentProgress = useRef(0)
  const lastDrawnIndex = useRef(-1)
  const isInitialDrawn = useRef(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d', { alpha: false })
    if (!ctx) return

    // Draw high-DPI crisp cover to keep the cinematic portrait visually dominant
    const drawImageToCanvas = (img) => {
      if (!img || !img.complete || img.naturalWidth === 0) return

      const cw = canvas.width
      const ch = canvas.height
      const imgW = img.naturalWidth
      const imgH = img.naturalHeight

      const imgAspect = imgW / imgH
      const canvasAspect = cw / ch

      let drawW, drawH, dx, dy

      if (canvasAspect > imgAspect) {
        drawW = cw
        drawH = cw / imgAspect
        dx = 0
        dy = (ch - drawH) / 2
      } else {
        drawH = ch
        drawW = ch * imgAspect
        dx = (cw - drawW) / 2
        dy = 0
      }

      ctx.fillStyle = '#08080a'
      ctx.fillRect(0, 0, cw, ch)

      ctx.imageSmoothingEnabled = true
      ctx.imageSmoothingQuality = 'high'
      ctx.drawImage(img, Math.round(dx), Math.round(dy), Math.round(drawW), Math.round(drawH))
    }

    const getBestAvailableImage = (targetIndex) => {
      const images = imagesRef.current
      if (images[targetIndex]?.complete && images[targetIndex]?.naturalWidth > 0) {
        return images[targetIndex]
      }

      for (let offset = 1; offset < TOTAL_FRAMES; offset++) {
        const prev = targetIndex - offset
        if (prev >= 0 && images[prev]?.complete && images[prev]?.naturalWidth > 0) {
          return images[prev]
        }
        const next = targetIndex + offset
        if (next < TOTAL_FRAMES && images[next]?.complete && images[next]?.naturalWidth > 0) {
          return images[next]
        }
      }

      return images[0]
    }

    // High-DPI Retina buffer scaling prevents any pixelation
    const handleResize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const width = window.innerWidth
      const height = window.innerHeight

      canvas.width = Math.round(width * dpr)
      canvas.height = Math.round(height * dpr)

      const activeIndex = lastDrawnIndex.current >= 0 ? lastDrawnIndex.current : 0
      const img = getBestAvailableImage(activeIndex)
      if (img) {
        drawImageToCanvas(img)
      }
    }

    handleResize()
    window.addEventListener('resize', handleResize)

    // Preload image sequence frames
    const images = imagesRef.current

    // Priority load frame 1 for instantaneous first paint
    const firstImg = new Image()
    firstImg.src = getFrameUrl(0)
    firstImg.onload = () => {
      images[0] = firstImg
      if (!isInitialDrawn.current) {
        drawImageToCanvas(firstImg)
        lastDrawnIndex.current = 0
        isInitialDrawn.current = true
      }
    }
    images[0] = firstImg

    // Preload remaining frames in background
    for (let i = 1; i < TOTAL_FRAMES; i++) {
      const img = new Image()
      img.src = getFrameUrl(i)
      images[i] = img
    }

    // Natural browser scrolling — works flawlessly on trackpad, mouse wheel, touch & scrollbar
    const handleScroll = () => {
      const scrollY = window.scrollY
      setIsScrolled(scrollY > 40)

      const maxScroll = document.documentElement.scrollHeight - window.innerHeight
      const progress = maxScroll > 0 ? scrollY / maxScroll : 0
      targetProgress.current = Math.max(0, Math.min(1, progress))
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()

    // Smooth linear interpolation render loop
    let animId
    const renderLoop = () => {
      const diff = targetProgress.current - currentProgress.current
      if (Math.abs(diff) > 0.0001) {
        currentProgress.current += diff * 0.12
      } else {
        currentProgress.current = targetProgress.current
      }

      const frameIndex = Math.min(
        TOTAL_FRAMES - 1,
        Math.max(0, Math.round(currentProgress.current * (TOTAL_FRAMES - 1)))
      )

      if (frameIndex !== lastDrawnIndex.current || !isInitialDrawn.current) {
        const img = getBestAvailableImage(frameIndex)
        if (img && img.complete && img.naturalWidth > 0) {
          drawImageToCanvas(img)
          lastDrawnIndex.current = frameIndex
          isInitialDrawn.current = true
        }
      }

      animId = requestAnimationFrame(renderLoop)
    }

    animId = requestAnimationFrame(renderLoop)

    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  return (
    <div className="portfolio-wrapper">
      {/* Fixed Cinematic Background Canvas */}
      <div className="canvas-fixed-viewport">
        <canvas ref={canvasRef} className="scroll-canvas" />
        <div className="canvas-cinematic-vignette" />
      </div>

      {/* Navigation Bar */}
      <header className={`site-navbar ${isScrolled ? 'scrolled' : ''}`}>
        <a href="#home" className="nav-brand">
          Areeb Shah
        </a>

        <nav className="nav-links-center">
          <a href="#home" className="nav-link">Home</a>
          <a href="#about" className="nav-link">About</a>
          <a href="#projects" className="nav-link">Projects</a>
          <a href="#experience" className="nav-link">Experience</a>
          <a href="#skills" className="nav-link">Skills</a>
          <a href="#contact" className="nav-link">Contact</a>
        </nav>

        <div className="nav-right-cta">
          <a href="#contact" className="glass-btn glass-btn-primary nav-cta-pill">
            Let's Talk <span className="btn-arrow">→</span>
          </a>
        </div>

        {/* Mobile Hamburger Button */}
        <button
          className="mobile-menu-btn"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Toggle navigation menu"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            {isMobileMenuOpen ? (
              <path d="M18 6L6 18M6 6l12 12" />
            ) : (
              <path d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </header>

      {/* Mobile Drawer */}
      {isMobileMenuOpen && (
        <div className="mobile-nav-drawer liquid-glass">
          <a href="#home" className="mobile-nav-link" onClick={() => setIsMobileMenuOpen(false)}>Home</a>
          <a href="#about" className="mobile-nav-link" onClick={() => setIsMobileMenuOpen(false)}>About</a>
          <a href="#projects" className="mobile-nav-link" onClick={() => setIsMobileMenuOpen(false)}>Projects</a>
          <a href="#experience" className="mobile-nav-link" onClick={() => setIsMobileMenuOpen(false)}>Experience</a>
          <a href="#skills" className="mobile-nav-link" onClick={() => setIsMobileMenuOpen(false)}>Skills</a>
          <a href="#contact" className="mobile-nav-link" onClick={() => setIsMobileMenuOpen(false)}>Contact</a>
        </div>
      )}

      {/* Hero Section */}
      <section className="hero-section" id="home">
        <div className="hero-main-container">
          <div className="hero-badge-pill liquid-glass-pill">
            <span className="badge-glow-dot" />
            AI & SOFTWARE DEVELOPER
          </div>

          <h1 className="hero-editorial-heading">
            Building digital<br />
            experiences with<br />
            <span className="serif-italic">AI</span> &amp; technology.
          </h1>

          <p className="hero-bio-lead">
            I'm Areeb Shah — a developer, builder and founder focused on AI, software and products that solve real problems.
          </p>

          <div className="hero-actions-row">
            <a href="#projects" className="glass-btn glass-btn-primary">
              View My Work <span className="btn-arrow">→</span>
            </a>
            <a href="#contact" className="glass-btn">
              Let's Talk
            </a>
          </div>
        </div>

        {/* Hero Bottom Specialties Strip */}
        <div className="hero-services-footer">
          <div className="service-pill-item">
            <span className="service-index">#01</span>
            <span className="service-label">AI &amp; ML Engineering</span>
          </div>
          <div className="service-pill-item">
            <span className="service-index">#02</span>
            <span className="service-label">Full-Stack Development</span>
          </div>
          <div className="service-pill-item">
            <span className="service-index">#03</span>
            <span className="service-label">Product Architecture</span>
          </div>
          <div className="service-pill-item">
            <span className="service-index">#04</span>
            <span className="service-label">Mobile Applications</span>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="about-section" id="about">
        <div className="about-editorial-grid">
          <div className="about-story-col">
            <span className="section-eyebrow">ABOUT ME</span>
            <h2 className="about-headline">
              I like turning ideas into things people can actually use.
            </h2>
            <p className="about-story-text">
              I'm a Computer Science student and developer focused on AI, software development and product building. I enjoy working across the full journey — from an idea and interface to the technology behind it.
            </p>
            <p className="about-story-text">
              Whether building predictive machine learning models, designing reactive interfaces, or leading early-stage product engineering, I believe the best engineering feels natural and invisible to the user.
            </p>
          </div>

          {/* Liquid Glass Personal Info Card */}
          <div className="about-glass-card liquid-glass">
            <div className="about-card-header">
              <div className="about-card-name">Areeb Shah</div>
              <div className="about-card-role">Developer • Builder • Founder</div>
            </div>

            <div className="about-card-meta">
              <div className="about-meta-row">
                <span className="meta-label">Location</span>
                <span className="meta-val">Based in India</span>
              </div>
              <div className="about-meta-row">
                <span className="meta-label">Specialization</span>
                <span className="meta-val">AI &amp; Software Systems</span>
              </div>
              <div className="about-meta-row">
                <span className="meta-label">Current Venture</span>
                <span className="meta-val" style={{ color: '#ff7582' }}>HealthAsistant</span>
              </div>
            </div>

            <div>
              <div className="meta-label" style={{ marginBottom: '8px' }}>Core Focus</div>
              <div className="about-focus-tags">
                <span className="focus-tag liquid-glass-pill">AI / ML</span>
                <span className="focus-tag liquid-glass-pill">Software Development</span>
                <span className="focus-tag liquid-glass-pill">Product Building</span>
                <span className="focus-tag liquid-glass-pill">Creative Development</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Current Startup / Founder Section */}
      <section className="startup-section" id="startup">
        <div className="startup-glass-feature liquid-glass">
          <div className="startup-ambient-glow" />

          <div className="startup-content-grid">
            <div className="startup-info-side">
              <span className="section-eyebrow">BUILDING SOMETHING OF MY OWN</span>
              <h2 className="startup-brand-title">HealthAsistant</h2>
              <p className="startup-tagline">
                Your watch tracks your health. We turn it into nutrition that actually works for you.
              </p>
              <p className="startup-description">
                HealthAsistant is a product I'm building around personalized nutrition and wearable health data — turning everyday health signals into practical food and nutrition guidance.
              </p>

              <div className="startup-badges-row">
                <div className="startup-badge liquid-glass-pill">
                  <span className="badge-micro-label">Role</span>
                  <span className="badge-main-label">CEO &amp; Co-Founder</span>
                </div>
                <div className="startup-badge liquid-glass-pill">
                  <span className="badge-micro-label">Status</span>
                  <span className="badge-main-label" style={{ color: '#ff7582' }}>Building / Early Stage</span>
                </div>
              </div>

              <div>
                <a
                  href="#contact"
                  className="glass-btn glass-btn-primary"
                >
                  View HealthAsistant <span className="btn-arrow">→</span>
                </a>
              </div>
            </div>

            {/* Mockup Frame */}
            <div className="startup-mockup-frame">
              <img
                src="/projects/healthasistant.jpg"
                alt="HealthAsistant mobile application dashboard preview"
                className="startup-mockup-img"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Projects Section */}
      <section className="projects-section" id="projects">
        <div className="projects-header-block">
          <span className="section-eyebrow">SELECTED WORK</span>
          <h2 className="projects-main-title">
            Things I've built and experimented with.
          </h2>
        </div>

        <div className="projects-cards-grid">
          {/* Project 1: HealthAsistant */}
          <div className="project-feature-card">
            <div className="project-media-box">
              <img
                src="/projects/healthasistant.jpg"
                alt="HealthAsistant interface"
                className="project-visual-img"
              />
            </div>
            <div className="project-meta-content">
              <div className="project-top-row">
                <span className="project-num-tag">01</span>
                <span className="project-category-badge liquid-glass-pill">Startup • Wearables</span>
              </div>
              <h3 className="project-title">HealthAsistant</h3>
              <p className="project-summary">
                Personalized nutrition intelligence powered by wearable health metrics and continuous biometric tracking.
              </p>
              <div className="project-tech-tags">
                <span className="tech-tag liquid-glass-pill">React</span>
                <span className="tech-tag liquid-glass-pill">Python</span>
                <span className="tech-tag liquid-glass-pill">AI/ML</span>
                <span className="tech-tag liquid-glass-pill">HealthKit</span>
              </div>
              <a href="#startup" className="project-action-link">
                View project <span className="btn-arrow">→</span>
              </a>
            </div>
          </div>

          {/* Project 2: NLP News Classification */}
          <div className="project-feature-card">
            <div className="project-media-box">
              <img
                src="/projects/nlp_news.jpg"
                alt="NLP News Classification dashboard"
                className="project-visual-img"
              />
            </div>
            <div className="project-meta-content">
              <div className="project-top-row">
                <span className="project-num-tag">02</span>
                <span className="project-category-badge liquid-glass-pill">Machine Learning • NLP</span>
              </div>
              <h3 className="project-title">NLP News Classification</h3>
              <p className="project-summary">
                Multi-class classification pipeline for BBC News articles utilizing TF-IDF vectorization and supervised NLP algorithms.
              </p>
              <div className="project-tech-tags">
                <span className="tech-tag liquid-glass-pill">Python</span>
                <span className="tech-tag liquid-glass-pill">NLP</span>
                <span className="tech-tag liquid-glass-pill">TF-IDF</span>
                <span className="tech-tag liquid-glass-pill">Scikit-learn</span>
              </div>
              <a href="#contact" className="project-action-link">
                View project <span className="btn-arrow">→</span>
              </a>
            </div>
          </div>

          {/* Project 3: Car Insurance Claim Prediction */}
          <div className="project-feature-card">
            <div className="project-media-box">
              <img
                src="/projects/car_insurance.jpg"
                alt="Car Insurance predictive analytics"
                className="project-visual-img"
              />
            </div>
            <div className="project-meta-content">
              <div className="project-top-row">
                <span className="project-num-tag">03</span>
                <span className="project-category-badge liquid-glass-pill">Predictive Analytics</span>
              </div>
              <h3 className="project-title">Car Insurance Claim Prediction</h3>
              <p className="project-summary">
                Risk modeling and claim probability prediction system leveraging LightGBM and CatBoost gradient boosting algorithms.
              </p>
              <div className="project-tech-tags">
                <span className="tech-tag liquid-glass-pill">LightGBM</span>
                <span className="tech-tag liquid-glass-pill">CatBoost</span>
                <span className="tech-tag liquid-glass-pill">Python</span>
                <span className="tech-tag liquid-glass-pill">Feature Engineering</span>
              </div>
              <a href="#contact" className="project-action-link">
                View project <span className="btn-arrow">→</span>
              </a>
            </div>
          </div>

          {/* Project 4: Flutter Weather App */}
          <div className="project-feature-card">
            <div className="project-media-box">
              <img
                src="/projects/weather_app.jpg"
                alt="Flutter Weather app mockup"
                className="project-visual-img"
              />
            </div>
            <div className="project-meta-content">
              <div className="project-top-row">
                <span className="project-num-tag">04</span>
                <span className="project-category-badge liquid-glass-pill">Mobile Development</span>
              </div>
              <h3 className="project-title">Flutter Weather App</h3>
              <p className="project-summary">
                Cross-platform weather forecasting application with dynamic atmospheric conditions, city search, and favorite locations.
              </p>
              <div className="project-tech-tags">
                <span className="tech-tag liquid-glass-pill">Flutter</span>
                <span className="tech-tag liquid-glass-pill">Dart</span>
                <span className="tech-tag liquid-glass-pill">REST APIs</span>
                <span className="tech-tag liquid-glass-pill">State Management</span>
              </div>
              <a href="#contact" className="project-action-link">
                View project <span className="btn-arrow">→</span>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Experience / Journey Timeline */}
      <section className="journey-section" id="experience">
        <div>
          <span className="section-eyebrow">THE JOURNEY</span>
          <h2 className="projects-main-title">
            Milestones in engineering, learning and building.
          </h2>
        </div>

        <div className="journey-timeline-flow">
          {/* Milestone 1 */}
          <div className="timeline-step">
            <div className="timeline-year-badge">2023 — Present</div>
            <div className="timeline-card liquid-glass">
              <h3 className="timeline-role-title">B.Tech in Computer Science</h3>
              <p className="timeline-step-desc">
                Building foundational depth across data structures, algorithms, system architecture, and computational intelligence.
              </p>
            </div>
          </div>

          {/* Milestone 2 */}
          <div className="timeline-step">
            <div className="timeline-year-badge">2025 — Present</div>
            <div className="timeline-card liquid-glass">
              <h3 className="timeline-role-title">Software / AI / ML Projects</h3>
              <p className="timeline-step-desc">
                Engineering applied machine learning systems, natural language processing pipelines, and production-ready mobile and web applications.
              </p>
            </div>
          </div>

          {/* Milestone 3 */}
          <div className="timeline-step">
            <div className="timeline-year-badge">2026 — Present</div>
            <div className="timeline-card liquid-glass" style={{ borderColor: 'rgba(255, 95, 105, 0.28)' }}>
              <h3 className="timeline-role-title" style={{ color: '#ff7582' }}>HealthAsistant</h3>
              <div style={{ fontSize: '13px', fontWeight: '700', color: 'rgba(255,255,255,0.6)', marginBottom: '8px' }}>
                CEO &amp; Co-Founder
              </div>
              <p className="timeline-step-desc">
                Spearheading product architecture and development for personalized nutrition intelligence connected to everyday health wearables.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Skills Section */}
      <section className="skills-section" id="skills">
        <div>
          <span className="section-eyebrow">TOOLS I WORK WITH</span>
          <h2 className="projects-main-title">
            Technologies &amp; stacks I build with.
          </h2>
        </div>

        <div className="skills-groups-grid">
          {/* Group 1: AI / ML */}
          <div className="skill-category-card liquid-glass">
            <h3 className="skill-category-name">AI / ML</h3>
            <div className="skill-pills-wrap">
              <span className="skill-floating-pill liquid-glass-pill">Python</span>
              <span className="skill-floating-pill liquid-glass-pill">Machine Learning</span>
              <span className="skill-floating-pill liquid-glass-pill">NLP</span>
              <span className="skill-floating-pill liquid-glass-pill">Scikit-learn</span>
              <span className="skill-floating-pill liquid-glass-pill">LightGBM</span>
              <span className="skill-floating-pill liquid-glass-pill">CatBoost</span>
            </div>
          </div>

          {/* Group 2: Development */}
          <div className="skill-category-card liquid-glass">
            <h3 className="skill-category-name">Development</h3>
            <div className="skill-pills-wrap">
              <span className="skill-floating-pill liquid-glass-pill">React</span>
              <span className="skill-floating-pill liquid-glass-pill">Flutter</span>
              <span className="skill-floating-pill liquid-glass-pill">JavaScript</span>
              <span className="skill-floating-pill liquid-glass-pill">Dart</span>
              <span className="skill-floating-pill liquid-glass-pill">HTML5</span>
              <span className="skill-floating-pill liquid-glass-pill">CSS3 / Vanilla CSS</span>
            </div>
          </div>

          {/* Group 3: Tools */}
          <div className="skill-category-card liquid-glass">
            <h3 className="skill-category-name">Tools &amp; Workflow</h3>
            <div className="skill-pills-wrap">
              <span className="skill-floating-pill liquid-glass-pill">Git</span>
              <span className="skill-floating-pill liquid-glass-pill">GitHub</span>
              <span className="skill-floating-pill liquid-glass-pill">VS Code</span>
              <span className="skill-floating-pill liquid-glass-pill">Figma</span>
              <span className="skill-floating-pill liquid-glass-pill">Jupyter</span>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="contact-section" id="contact">
        <span className="section-eyebrow">LET'S BUILD</span>
        <h2 className="contact-main-heading">
          Have an idea?<br />
          Let's make it real.
        </h2>
        <p className="contact-sub-text">
          Whether it's a product idea, collaboration, or just a conversation about technology — I'd love to hear from you.
        </p>

        <div className="contact-buttons-row">
          <a
            href="mailto:areebshah@example.com"
            className="glass-btn glass-btn-primary"
          >
            Email Me <span className="btn-arrow">→</span>
          </a>
          <a
            href="https://linkedin.com"
            target="_blank"
            rel="noopener noreferrer"
            className="glass-btn"
          >
            LinkedIn <span className="btn-arrow">→</span>
          </a>
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="glass-btn"
          >
            GitHub <span className="btn-arrow">→</span>
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="site-footer">
        <div className="footer-left">
          Areeb Shah
        </div>
        <div className="footer-center">
          Built with curiosity, caffeine &amp; code.
        </div>
        <div className="footer-right">
          <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="footer-link">GitHub</a>
          <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="footer-link">LinkedIn</a>
          <a href="mailto:areebshah@example.com" className="footer-link">Email</a>
          <span className="footer-copy">© 2026 Areeb Shah</span>
        </div>
      </footer>
    </div>
  )
}

export default App
