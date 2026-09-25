import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getDashboardSummary } from '../api/authAPI';
import LiveActivityTicker from '../components/common/LiveActivityTicker';
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
    link: '/courses',
  },
  {
    icon: '👥',
    title: 'Study Groups',
    desc: 'Create or join groups with real-time chat and virtual study session scheduling.',
    link: '/study-groups',
  },
  {
    icon: '📈',
    title: 'Progress Tracking',
    desc: 'Track completion, quiz scores, and earn achievement badges as you hit milestones.',
    link: '/dashboard',
  },
];

const avatarColors = ['#e17055', '#6c5ce7', '#00b894', '#fdcb6e'];

export default function Home() {
  const { user } = useAuth();
  const [summary, setSummary] = useState(null);
  const [loadingSummary, setLoadingSummary] = useState(false);

  useEffect(() => {
    if (user) {
      fetchSummary();
    } else {
      setSummary(null);
    }
  }, [user]);

  const fetchSummary = async () => {
    try {
      setLoadingSummary(true);
      const response = await getDashboardSummary();
      setSummary(response.data);
    } catch (err) {
      console.error('Failed to fetch dashboard summary:', err);
    } finally {
      setLoadingSummary(false);
    }
  };

  return (
    <div className="home">
      {/* ── Hero Section ── */}
      <section className="hero">
        <div className="hero-content">
          <span className="hero-badge">
            {user ? `👋 Welcome back, ${user.firstName}!` : '🎓 Trusted by 2.4M+ learners worldwide'}
          </span>

          <h1 className="hero-heading">
            {user ? 'Continue Your' : 'Learn Without'}<br />
            <span className="hero-accent">{user ? 'Learning Journey.' : 'Limits.'}</span>
          </h1>

          <p className="hero-sub">
            {user
              ? 'Pick up where you left off, explore new courses, and keep building your skills.'
              : 'Access world-class courses, connect with study groups, and track your progress — all in one beautiful, distraction-free platform.'}
          </p>

          <div className="hero-ctas">
            {user ? (
              <>
                <Link to="/dashboard" className="cta-primary">Go to Dashboard →</Link>
                <Link to="/courses" className="cta-outline">Explore Courses</Link>
              </>
            ) : (
              <>
                <Link to="/register" className="cta-primary">Get Started →</Link>
                <Link to="/login" className="cta-outline">Sign In</Link>
              </>
            )}
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

        {/* ── Hero Card ── */}
        <div className="hero-card-wrap">
          {user ? (
            <div className="user-snapshot-card">
              <div className="snapshot-header">
                <div className="snapshot-avatar">
                  {user.avatarUrl ? (
                    <img
                      src={user.avatarUrl}
                      alt={user.firstName}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
                    />
                  ) : (
                    <span>{user.firstName?.[0]}{user.lastName?.[0]}</span>
                  )}
                </div>
                <div className="snapshot-info">
                  <h3>Hey, {user.firstName}! 👋</h3>
                  <p>Ready to learn something new today?</p>
                </div>
              </div>

              <div className="snapshot-stats">
                <div className="snapshot-stat">
                  <div className="snapshot-stat-icon" style={{ background: '#fee2e2' }}>🔥</div>
                  <div>
                    <div className="snapshot-stat-value">
                      {loadingSummary ? '...' : (summary?.streakDays ?? 0)}
                    </div>
                    <div className="snapshot-stat-label">Day Streak</div>
                  </div>
                </div>
                <div className="snapshot-stat">
                  <div className="snapshot-stat-icon" style={{ background: '#dbeafe' }}>📚</div>
                  <div>
                    <div className="snapshot-stat-value">
                      {loadingSummary ? '...' : (summary?.activeCourses ?? 0)}
                    </div>
                    <div className="snapshot-stat-label">Active Courses</div>
                  </div>
                </div>
                <div className="snapshot-stat">
                  <div className="snapshot-stat-icon" style={{ background: '#dcfce7' }}>🏆</div>
                  <div>
                    <div className="snapshot-stat-value">
                      {loadingSummary ? '...' : (summary?.badgesCount ?? 0)}
                    </div>
                    <div className="snapshot-stat-label">Badges</div>
                  </div>
                </div>
                <div className="snapshot-stat">
                  <div className="snapshot-stat-icon" style={{ background: '#fef3c7' }}>⏱️</div>
                  <div>
                    <div className="snapshot-stat-value">
                      {loadingSummary ? '...' : `${summary?.totalLearningHours ?? 0}h`}
                    </div>
                    <div className="snapshot-stat-label">Learning</div>
                  </div>
                </div>
              </div>

              {summary?.currentCourse ? (
                <Link to={`/courses/${summary.currentCourse.id}`} style={{ textDecoration: 'none' }}>
                  <div className="snapshot-course">
                    <div className="snapshot-course-icon">
                      {summary.currentCourse.imageUrl?.startsWith('data:image') ||
                      summary.currentCourse.imageUrl?.startsWith('http') ? (
                        <img
                          src={summary.currentCourse.imageUrl}
                          alt={summary.currentCourse.title}
                          style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '12px' }}
                        />
                      ) : (
                        summary.currentCourse.imageUrl || '📚'
                      )}
                    </div>
                    <div className="snapshot-course-info">
                      <p className="snapshot-course-label">Continue learning</p>
                      <p className="snapshot-course-title">{summary.currentCourse.title}</p>
                      <div className="snapshot-progress-track">
                        <div
                          className="snapshot-progress-fill"
                          style={{ width: `${summary.currentCourse.progress}%` }}
                        />
                      </div>
                      <p className="snapshot-course-meta">
                        {summary.currentCourse.completedLessons}/{summary.currentCourse.totalLessons} lessons • {summary.currentCourse.progress}%
                      </p>
                    </div>
                  </div>
                </Link>
              ) : (
                <Link to="/courses" style={{ textDecoration: 'none' }}>
                  <div className="snapshot-course snapshot-course-empty">
                    <div className="snapshot-course-icon">🎯</div>
                    <div className="snapshot-course-info">
                      <p className="snapshot-course-label">Get started</p>
                      <p className="snapshot-course-title">Enroll in your first course</p>
                      <p className="snapshot-course-meta">Browse 10,000+ courses →</p>
                    </div>
                  </div>
                </Link>
              )}

              {summary?.recentAchievement && (
                <div className="snapshot-achievement">
                  <div className="snapshot-achievement-icon">
                    {summary.recentAchievement.icon || '🏅'}
                  </div>
                  <div>
                    <p className="snapshot-achievement-title">{summary.recentAchievement.name}</p>
                    <p className="snapshot-achievement-desc">{summary.recentAchievement.description}</p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <>
              <div className="streak-chip">🔥 12-day streak! Keep it up</div>

              <div className="course-card">
                <div className="course-card-hero-img">
                  <img
                    src={asianImage}
                    alt="Learning illustration"
                    style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '16px 16px 0 0' }}
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
            </>
          )}
        </div>
      </section>

      {/* ── Live Activity Pop Card (logged out only) ── */}
      {!user && <LiveActivityTicker />}

      {/* ── Stats Bar ── */}
      <section className="stats-bar">
        {stats.map((s) => (
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
          {features.map((f) => (
            <Link key={f.title} to={f.link} style={{ textDecoration: 'none' }}>
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

        {user ? (
          <>
            <h2>Ready to continue learning?</h2>
            <p>Jump back into your courses and keep growing.</p>
            <div className="cta-buttons">
              <Link to="/dashboard" className="cta-primary">Go to Dashboard →</Link>
              <Link to="/courses" className="cta-outline">Browse Courses</Link>
            </div>
          </>
        ) : (
          <>
            <h2>Start your learning journey today</h2>
            <p>Join 2.4 million learners building skills that matter.</p>
            <div className="cta-buttons">
              <Link to="/register" className="cta-primary">Create Account →</Link>
              <Link to="/login" className="cta-outline">Sign In</Link>
            </div>
          </>
        )}
      </section>
    </div>
  );
}