import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axiosConfig';
import InstructorCard from '../components/common/InstructorCard';

// ─── helpers ────────────────────────────────────────────────
const isImageUrl = (v) =>
  typeof v === 'string' &&
  (v.startsWith('data:image') ||
    v.startsWith('http://') ||
    v.startsWith('https://') ||
    v.startsWith('/'));

const formatHours = (h) => {
  const n = Number(h) || 0;
  if (n < 1) {
    const mins = Math.round(n * 60);
    return `${mins} min${mins === 1 ? '' : 's'}`;
  }
  return `${n.toFixed(1)}h`;
};

const formatDate = (iso) => {
  if (!iso) return null;
  const d = new Date(iso);
  if (isNaN(d)) return null;
  return d.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
};

const relativeTime = (iso) => {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(iso).toLocaleDateString();
};

function StudentDashboard() {
  const { user } = useAuth();

  const [summary, setSummary] = useState(null);
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('overview');

  useEffect(() => {
    if (!user?.id) return;
    fetchAll();
  }, [user?.id]);

  const fetchAll = async () => {
    try {
      setLoading(true);
      setError('');

      const [summaryRes, enrollmentsRes] = await Promise.allSettled([
        api.get('/auth/dashboard-summary'),
        api.get(`/enrollments/user/${user.id}`),
      ]);

      if (summaryRes.status === 'fulfilled') {
        setSummary(summaryRes.value.data);
      } else {
        console.warn('Summary fetch failed:', summaryRes.reason);
      }

      if (enrollmentsRes.status === 'fulfilled') {
        setEnrollments(enrollmentsRes.value.data || []);
      } else {
        console.warn('Enrollments fetch failed:', enrollmentsRes.reason);
      }
    } catch (err) {
      console.error('Dashboard load error:', err);
      setError('Some data failed to load.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem' }}>
        <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>📊</div>
        <p style={{ color: 'var(--text-secondary)' }}>Loading your dashboard...</p>
      </div>
    );
  }

  const streak = summary?.streakDays ?? user?.streakDays ?? 0;
  const hours = summary?.totalLearningHours ?? user?.totalLearningHours ?? 0;
  const activeCourses = summary?.activeCourses ?? enrollments.filter(e => !e.isCompleted).length;
  const badges = summary?.badgesCount ?? (user?.achievements?.length || 0);
  const currentCourse = summary?.currentCourse || null;
  const recentAchievement = summary?.recentAchievement || null;
  const memberSince = formatDate(user?.createdAt);

  const statCards = [
    { icon: '🔥', value: streak, label: 'Day Streak', bg: '#fed7aa' },
    { icon: '⏱️', value: formatHours(hours), label: 'Learning Hours', bg: '#bfdbfe' },
    { icon: '📚', value: activeCourses, label: 'Active Courses', bg: '#bbf7d0' },
    { icon: '🏆', value: badges, label: 'Badges Earned', bg: '#e0d9ff' },
  ];

  const tabs = [
    { id: 'overview', label: 'Overview', icon: '🏠' },
    { id: 'courses', label: 'My Courses', icon: '📚' },
    { id: 'activity', label: 'Activity', icon: '📈' },
    { id: 'achievements', label: 'Achievements', icon: '🏆' },
  ];

  return (
    <div
      style={{
        maxWidth: '1200px',
        margin: '2rem auto',
        padding: '0 clamp(1rem, 3vw, 2rem)',
        width: '100%',
      }}
    >
      {/* ═════════════ WELCOME BANNER ═════════════ */}
      <div
        style={{
          position: 'relative',
          overflow: 'hidden',
          borderRadius: '24px',
          padding: 'clamp(1.5rem, 3vw, 2rem)',
          background: 'linear-gradient(135deg, #6c5ce7 0%, #8b7cf0 55%, #a29bfe 100%)',
          color: 'white',
          marginBottom: '1.5rem',
        }}
      >
        <div style={{ position: 'absolute', top: '-60px', right: '-30px', width: '220px', height: '220px', borderRadius: '50%', background: 'rgba(255,255,255,0.10)' }} />
        <div style={{ position: 'absolute', bottom: '-110px', left: '8%', width: '200px', height: '200px', borderRadius: '50%', background: 'rgba(255,255,255,0.07)' }} />

        <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap' }}>
          <div
            style={{
              width: '68px',
              height: '68px',
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.22)',
              border: '3px solid rgba(255,255,255,0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.5rem',
              fontWeight: 700,
              overflow: 'hidden',
              flexShrink: 0,
            }}
          >
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <span>{(user?.firstName?.[0] || '') + (user?.lastName?.[0] || '')}</span>
            )}
          </div>

          <div style={{ flex: 1, minWidth: '220px' }}>
            <h1 style={{ margin: 0, fontSize: 'clamp(1.4rem, 2.6vw, 1.9rem)', fontWeight: 700 }}>
              Welcome back, {user?.firstName || 'Learner'}! 👋
            </h1>
            <p style={{ margin: '0.35rem 0 0', opacity: 0.95, fontSize: '0.95rem' }}>
              {currentCourse
                ? `You're making progress on "${currentCourse.title}"`
                : "Ready to learn something new today?"}
            </p>

            {memberSince && (
              <p style={{ margin: '0.5rem 0 0', opacity: 0.85, fontSize: '0.82rem' }}>
                📅 Member since {memberSince}
              </p>
            )}
          </div>

          <Link
            to="/courses"
            style={{
              padding: '0.75rem 1.35rem',
              background: 'white',
              color: '#6c5ce7',
              textDecoration: 'none',
              borderRadius: '12px',
              fontWeight: 700,
              fontSize: '0.9rem',
              boxShadow: '0 4px 14px rgba(0,0,0,0.15)',
              flexShrink: 0,
            }}
          >
            ➕ Browse Courses
          </Link>
        </div>
      </div>

      {error && (
        <div style={{ padding: '0.85rem 1rem', background: '#fef3c7', color: '#92400e', border: '1px solid #fde68a', borderRadius: '12px', marginBottom: '1.25rem', fontSize: '0.9rem' }}>
          ⚠️ {error}
        </div>
      )}

      {/* ═════════════ STATS ═════════════ */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))',
          gap: '1rem',
          marginBottom: '1.5rem',
        }}
      >
        {statCards.map((s, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              padding: '1.25rem',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-primary)',
              borderRadius: '16px',
              boxShadow: 'var(--shadow-sm)',
              transition: 'transform 0.2s, box-shadow 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-3px)';
              e.currentTarget.style.boxShadow = 'var(--shadow-md, 0 10px 24px rgba(0,0,0,0.08))';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
            }}
          >
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                background: s.bg,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.5rem',
                flexShrink: 0,
              }}
            >
              {s.icon}
            </div>
            <div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.1 }}>
                {s.value}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ═════════════ TABS ═════════════ */}
      <div
        style={{
          display: 'flex',
          gap: '0.25rem',
          marginBottom: '1.25rem',
          background: 'var(--bg-secondary)',
          padding: '0.35rem',
          borderRadius: '14px',
          border: '1px solid var(--border-primary)',
          overflowX: 'auto',
        }}
      >
        {tabs.map((t) => {
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                flex: 1,
                minWidth: '120px',
                padding: '0.65rem 1rem',
                background: active ? 'var(--bg-card)' : 'transparent',
                color: active ? '#6c5ce7' : 'var(--text-secondary)',
                border: 'none',
                borderRadius: '10px',
                fontSize: '0.9rem',
                fontWeight: active ? 700 : 500,
                cursor: 'pointer',
                boxShadow: active ? '0 2px 8px rgba(0,0,0,0.06)' : 'none',
                transition: 'all 0.15s',
                whiteSpace: 'nowrap',
              }}
            >
              {t.icon} {t.label}
            </button>
          );
        })}
      </div>

      {/* ═════════════ MAIN GRID ═════════════ */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)',
          gap: '1.5rem',
          alignItems: 'start',
        }}
        className="dashboard-grid"
      >
        {/* LEFT COLUMN */}
        <div>
          {/* OVERVIEW */}
          {tab === 'overview' && (
            <>
              {/* Continue learning */}
              {currentCourse ? (
                <div
                  style={{
                    padding: '1.5rem',
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-primary)',
                    borderRadius: '18px',
                    marginBottom: '1.25rem',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <h2 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-primary)' }}>
                      ▶️ Continue Learning
                    </h2>
                    <Link to={`/courses/${currentCourse.id}`} style={{ color: '#6c5ce7', fontSize: '0.85rem', fontWeight: 600, textDecoration: 'none' }}>
                      Resume →
                    </Link>
                  </div>

                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    {isImageUrl(currentCourse.imageUrl) ? (
                      <img
                        src={currentCourse.imageUrl}
                        alt={currentCourse.title}
                        style={{ width: '72px', height: '72px', objectFit: 'cover', borderRadius: '12px', flexShrink: 0 }}
                      />
                    ) : (
                      <div style={{ width: '72px', height: '72px', borderRadius: '12px', background: 'linear-gradient(135deg, #6c5ce7, #a29bfe)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem', flexShrink: 0 }}>
                        📚
                      </div>
                    )}
                    <div style={{ flex: 1, minWidth: '180px' }}>
                      <h3 style={{ margin: '0 0 0.35rem', fontSize: '1.05rem', color: 'var(--text-primary)', fontWeight: 600 }}>
                        {currentCourse.title}
                      </h3>
                      <p style={{ margin: 0, color: 'var(--text-tertiary)', fontSize: '0.85rem' }}>
                        {currentCourse.completedLessons || 0} / {currentCourse.totalLessons || 0} lessons completed
                      </p>
                    </div>
                  </div>

                  {/* progress bar */}
                  <div style={{ marginTop: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-tertiary)', marginBottom: '0.35rem' }}>
                      <span>Progress</span>
                      <span>{currentCourse.progress || 0}%</span>
                    </div>
                    <div style={{ height: '8px', background: 'var(--bg-secondary)', borderRadius: '4px', overflow: 'hidden' }}>
                      <div
                        style={{
                          height: '100%',
                          width: `${currentCourse.progress || 0}%`,
                          background: 'linear-gradient(90deg, #6c5ce7, #a29bfe)',
                          transition: 'width 0.4s',
                        }}
                      />
                    </div>
                  </div>

                  {/* ✅ Instructor strip */}
                  {currentCourse.instructorId && (
                    <InstructorCard instructorId={currentCourse.instructorId} variant="compact" />
                  )}
                </div>
              ) : (
                <div style={{ padding: '2rem', background: 'var(--bg-card)', border: '1px solid var(--border-primary)', borderRadius: '18px', marginBottom: '1.25rem', textAlign: 'center' }}>
                  <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🎯</div>
                  <h3 style={{ margin: '0 0 0.35rem', color: 'var(--text-primary)' }}>No course in progress</h3>
                  <p style={{ color: 'var(--text-tertiary)', margin: '0 0 1rem', fontSize: '0.9rem' }}>
                    Enroll in a course to start tracking your progress.
                  </p>
                  <Link
                    to="/courses"
                    style={{
                      display: 'inline-block',
                      padding: '0.65rem 1.5rem',
                      background: '#6c5ce7',
                      color: 'white',
                      borderRadius: '10px',
                      textDecoration: 'none',
                      fontWeight: 600,
                      fontSize: '0.9rem',
                    }}
                  >
                    Browse Courses
                  </Link>
                </div>
              )}

              {/* My courses preview */}
              <div
                style={{
                  padding: '1.5rem',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-primary)',
                  borderRadius: '18px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h2 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-primary)' }}>
                    📚 Your Courses
                  </h2>
                  <Link to="/courses" style={{ color: '#6c5ce7', fontSize: '0.85rem', fontWeight: 600, textDecoration: 'none' }}>
                    View All →
                  </Link>
                </div>

                {enrollments.length === 0 ? (
                  <p style={{ color: 'var(--text-tertiary)', textAlign: 'center', padding: '1rem 0', fontSize: '0.9rem' }}>
                    You haven't enrolled in any courses yet.
                  </p>
                ) : (
                  <div style={{ display: 'grid', gap: '0.75rem' }}>
                    {enrollments.slice(0, 4).map((c) => (
                      <Link
                        key={c.id}
                        to={`/courses/${c.courseId}`}
                        style={{ textDecoration: 'none', color: 'inherit' }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.85rem',
                            padding: '0.75rem',
                            background: 'var(--bg-secondary)',
                            borderRadius: '12px',
                            transition: 'background 0.15s',
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-hover, var(--bg-tertiary))')}
                          onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--bg-secondary)')}
                        >
                          {isImageUrl(c.imageUrl) ? (
                            <img src={c.imageUrl} alt={c.title} style={{ width: '44px', height: '44px', objectFit: 'cover', borderRadius: '8px', flexShrink: 0 }} />
                          ) : (
                            <div style={{ width: '44px', height: '44px', borderRadius: '8px', background: '#e0e7ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', flexShrink: 0 }}>
                              📘
                            </div>
                          )}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {c.title}
                            </div>
                            <div style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)' }}>
                              {c.progressPercentage || 0}% complete
                            </div>
                          </div>
                          <span style={{ fontSize: '0.85rem', color: c.isCompleted ? '#34d399' : '#6c5ce7', fontWeight: 600, flexShrink: 0 }}>
                            {c.isCompleted ? '✓ Done' : 'Continue'}
                          </span>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {/* COURSES TAB */}
          {tab === 'courses' && (
            <div style={{ padding: '1.5rem', background: 'var(--bg-card)', border: '1px solid var(--border-primary)', borderRadius: '18px' }}>
              <h2 style={{ margin: '0 0 1rem', fontSize: '1.1rem', color: 'var(--text-primary)' }}>
                All Enrolled Courses
              </h2>
              {enrollments.length === 0 ? (
                <p style={{ color: 'var(--text-tertiary)', textAlign: 'center', padding: '2rem 0' }}>
                  No enrollments yet. <Link to="/courses" style={{ color: '#6c5ce7' }}>Browse courses →</Link>
                </p>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 260px), 1fr))', gap: '1rem' }}>
                  {enrollments.map((c) => (
                    <Link key={c.id} to={`/courses/${c.courseId}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                      <div style={{ padding: '1rem', background: 'var(--bg-secondary)', borderRadius: '14px', border: '1px solid var(--border-primary)' }}>
                        <div style={{ marginBottom: '0.5rem', fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.95rem' }}>
                          {c.title}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', marginBottom: '0.65rem' }}>
                          {c.progressPercentage || 0}% complete
                        </div>
                        <div style={{ height: '6px', background: 'var(--bg-card)', borderRadius: '3px', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${c.progressPercentage || 0}%`, background: '#6c5ce7' }} />
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ACTIVITY TAB */}
          {tab === 'activity' && (
            <div style={{ padding: '1.5rem', background: 'var(--bg-card)', border: '1px solid var(--border-primary)', borderRadius: '18px' }}>
              <h2 style={{ margin: '0 0 1rem', fontSize: '1.1rem', color: 'var(--text-primary)' }}>
                Recent Activity
              </h2>
              {recentAchievement ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', background: 'var(--bg-secondary)', borderRadius: '12px' }}>
                  <span style={{ fontSize: '2rem' }}>{recentAchievement.icon || '🏅'}</span>
                  <div>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{recentAchievement.name}</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)' }}>
                      {recentAchievement.description} · {relativeTime(recentAchievement.earnedAt)}
                    </div>
                  </div>
                </div>
              ) : (
                <p style={{ color: 'var(--text-tertiary)', textAlign: 'center', padding: '2rem 0' }}>
                  No recent activity yet. Complete a lesson to start tracking.
                </p>
              )}
            </div>
          )}

          {/* ACHIEVEMENTS TAB */}
          {tab === 'achievements' && (
            <div style={{ padding: '1.5rem', background: 'var(--bg-card)', border: '1px solid var(--border-primary)', borderRadius: '18px' }}>
              <h2 style={{ margin: '0 0 1rem', fontSize: '1.1rem', color: 'var(--text-primary)' }}>
                Achievements
              </h2>
              {(!user?.achievements || user.achievements.length === 0) ? (
                <p style={{ color: 'var(--text-tertiary)', textAlign: 'center', padding: '2rem 0' }}>
                  No badges earned yet. Keep learning to unlock them!
                </p>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 160px), 1fr))', gap: '1rem' }}>
                  {user.achievements.map((b, i) => (
                    <div key={i} style={{ padding: '1rem', background: 'var(--bg-secondary)', borderRadius: '12px', textAlign: 'center' }}>
                      <div style={{ fontSize: '2rem', marginBottom: '0.35rem' }}>{b.icon || '🏅'}</div>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.88rem' }}>{b.name}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* RIGHT COLUMN */}
        <div>
          {/* Upcoming Sessions */}
          <div
            style={{
              padding: '1.25rem',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-primary)',
              borderRadius: '18px',
              marginBottom: '1.25rem',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
              <h3 style={{ margin: 0, fontSize: '1rem', color: 'var(--text-primary)' }}>
                📅 Upcoming Sessions
              </h3>
              <Link
                to="/study-groups"
                style={{ color: '#6c5ce7', fontSize: '0.8rem', fontWeight: 600, textDecoration: 'none' }}
              >
                Schedule +
              </Link>
            </div>

            <div style={{ textAlign: 'center', padding: '1.25rem 0.5rem' }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.35rem' }}>🗓️</div>
              <p style={{ color: 'var(--text-tertiary)', fontSize: '0.85rem', margin: '0 0 0.85rem' }}>
                No sessions scheduled yet.
              </p>
              <Link
                to="/study-groups"
                style={{
                  display: 'inline-block',
                  padding: '0.5rem 1rem',
                  background: '#6c5ce7',
                  color: 'white',
                  borderRadius: '8px',
                  textDecoration: 'none',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                }}
              >
                + Schedule a Session
              </Link>
            </div>
          </div>

          {/* Quick links */}
          <div
            style={{
              padding: '1.25rem',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-primary)',
              borderRadius: '18px',
            }}
          >
            <h3 style={{ margin: '0 0 0.85rem', fontSize: '1rem', color: 'var(--text-primary)' }}>
              ⚡ Quick Links
            </h3>
            <div style={{ display: 'grid', gap: '0.5rem' }}>
              {[
                { to: '/courses', icon: '📚', label: 'Browse Courses' },
                { to: '/study-groups', icon: '👥', label: 'Study Groups' },
                { to: '/profile', icon: '👤', label: 'My Profile' },
              ].map((l) => (
                <Link
                  key={l.to}
                  to={l.to}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.65rem',
                    padding: '0.65rem 0.85rem',
                    background: 'var(--bg-secondary)',
                    borderRadius: '10px',
                    textDecoration: 'none',
                    color: 'var(--text-primary)',
                    fontSize: '0.88rem',
                    fontWeight: 500,
                  }}
                >
                  <span>{l.icon}</span>
                  {l.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default StudentDashboard;