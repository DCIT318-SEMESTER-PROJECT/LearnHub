import React from 'react';
import { Link } from 'react-router-dom';
import asianImage from '../assets/asian.avif';

const stats = [
  { value: '10,000+', label: 'Courses' },
  { value: '2.4M',    label: 'Students' },
  { value: '500+',    label: 'Instructors' },
  { value: '95%',     label: 'Satisfaction' },
];

const features = [
  { 
    icon: '📚', 
    title: 'Curated Courses',   
    desc: 'Browse thousands of courses structured and peer-reviewed across every discipline.',
    link: '/courses'
  },
  { 
    icon: '👥', 
    title: 'Study Groups',      
    desc: 'Create or join groups with real-time chat and virtual study session scheduling.',
    link: '/study-groups'
  },
  { 
    icon: '📈', 
    title: 'Progress Tracking', 
    desc: 'Track completion, quiz scores, and earn achievement badges as you hit milestones.',
    link: '/dashboard'
  },
];

const avatarColors = ['#e17055', '#6c5ce7', '#00b894', '#fdcb6e'];

export default function Home() {
  return (
    <div className="home">

      {/* ── Hero Section ── */}
      <section className="hero">
        <div className="hero-content">
          <span className="hero-badge">🎓 Trusted by 2.4M+ learners worldwide</span>

          <h1 className="hero-heading">
            Learn Without<br />
            <span className="hero-accent">Limits.</span>
          </h1>

          <p className="hero-sub">
            Access world-class courses, connect with study groups, and track your progress —
            all in one beautiful, distraction-free platform.
          </p>

          <div className="hero-ctas">
            <Link to="/register" className="cta-primary">Get Started →</Link>
            <Link to="/login" className="cta-outline">Sign In</Link>
          </div>

          <div className="hero-proof">
            <div className="avatar-stack">
              {avatarColors.map((c, i) => (
                <div key={i} className="avatar" style={{ background: c, zIndex: 4 - i }} />
              ))}
            </div>
            <span>Join <strong>2.4M+</strong> learners worldwide</span>
          </div>
        </div>

        <div className="hero-card-wrap">
          <div className="streak-chip">🔥 12-day streak! Keep it up</div>

          <div className="course-card">
            <div className="course-card-hero-img">
              <img 
                src={asianImage} 
                alt="Learning illustration"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  borderRadius: '16px 16px 0 0'
                }}
              />
            </div>
            <button className="play-btn" aria-label="Play lesson">▶</button>
            <div className="course-card-body">
              <p className="course-label">Currently learning</p>
              <p className="course-title">React Advanced Patterns</p>
              <div className="progress-track">
                <div className="progress-fill" style={{ width: '72%' }} />
              </div>
              <p className="course-meta">18 / 25 lessons</p>
            </div>
          </div>

          <div className="quiz-chip">
            <div className="quiz-check">✔</div>
            <div>
              <p className="quiz-title">Quiz Passed!</p>
              <p className="quiz-score">Score: 94%</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats Bar ── */}
      <section className="stats-bar">
        {stats.map(s => (
          <div key={s.label} className="stat-item">
            <span className="stat-value">{s.value}</span>
            <span className="stat-label">{s.label}</span>
          </div>
        ))}
      </section>

      {/* ── Features Section ── */}
      <section className="features">
        <h2 className="features-heading">Everything you need to learn better</h2>
        <div className="features-grid">
          {features.map(f => (
            <Link 
              key={f.title} 
              to={f.link} 
              style={{ textDecoration: 'none' }}
            >
              <div className="feature-card">
                <div className="feature-icon">{f.icon}</div>
                <h3 className="feature-title">{f.title}</h3>
                <p className="feature-desc">{f.desc}</p>
                <div className="feature-link">Explore →</div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <section className="cta-banner">
        <div className="bubble bubble-1"></div>
        <div className="bubble bubble-2"></div>
        <div className="bubble bubble-3"></div>
        <div className="bubble bubble-4"></div>
        
        <h2>Start your learning journey today</h2>
        <p>Join 2.4 million learners building skills that matter.</p>
        <div className="cta-buttons">
          <Link to="/register" className="cta-primary">Create Account →</Link>
          <Link to="/login" className="cta-outline">Sign In</Link>
        </div>
      </section>
    </div>
  );
}