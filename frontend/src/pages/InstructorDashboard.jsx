import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axiosConfig';

const isImageUrl = (v) =>
  typeof v === 'string' &&
  (v.startsWith('data:image') || v.startsWith('http') || v.startsWith('/'));

const formatDate = (iso) => {
  if (!iso) return null;
  const d = new Date(iso);
  if (isNaN(d)) return null;
  return d.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
};

function InstructorDashboard() {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('overview');
  const [stats, setStats] = useState({
    totalCourses: 0,
    publishedCourses: 0,
    totalStudents: 0,
    totalLessons: 0,
    averageRating: 0,
  });

  useEffect(() => {
    if (!user?.id) return;
    fetchDashboard();
  }, [user?.id]);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      setError('');
      const { data } = await api.get('/auth/instructor-dashboard');
      setCourses(data.courses || []);
      setStats(data.stats || {});
      setAchievements(data.achievements || []);
    } catch (err) {
      console.error('Instructor dashboard error:', err);
      // Fall back to the profile endpoint if the new one isn't deployed yet
      try {
        const { data } = await api.get(`/auth/instructor/${user.id}`);
        setCourses(data.courses || []);
        setStats(data.stats || {});
        setAchievements(data.achievements || []);
      } catch (fallbackErr) {
        setError('Failed to load your dashboard.');
      }
    } finally {
      setLoading(false);
    }
  };

  const capitalize = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : '');

  const memberSince = formatDate(user?.createdAt);

  const statCards = [
    { icon: '📚', value: stats.totalCourses || 0, label: 'Your Courses', bg: '#dbeafe' },
    { icon: '👥', value: (stats.totalStudents || 0).toLocaleString(), label: 'Students', bg: '#dcfce7' },
    { icon: '⭐', value: (stats.averageRating || 0).toFixed(1), label: 'Avg Rating', bg: '#fef3c7' },
    { icon: '🏆', value: achievements.length, label: 'Badges', bg: '#f0eeff' },
  ];

  const tabs = [
    { id: 'overview', label: 'Overview', icon: '🏠' },
    { id: 'courses', label: 'My Courses', icon: '📚' },
    { id: 'badges', label: 'Badges', icon: '🏆' },
  ];

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem' }}>
        <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>👨‍🏫</div>
        <p style={{ color: 'var(--text-secondary)' }}>Loading your dashboard…</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '2rem auto', padding: '0 clamp(1rem, 3vw, 2rem)', width: '100%' }}>
      {/* HERO */}
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
              width: '68px', height: '68px', borderRadius: '50%',
              background: 'rgba(255,255,255,0.22)', border: '3px solid rgba(255,255,255,0.5)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.5rem', fontWeight: 700, overflow: 'hidden', flexShrink: 0,
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
              Welcome back, {capitalize(user?.firstName)} 
            </h1>
            <p style={{ margin: '0.35rem 0 0', opacity: 0.95, fontSize: '0.95rem' }}>
              {stats.publishedCourses > 0
                ? `You have ${stats.publishedCourses} published ${stats.publishedCourses === 1 ? 'course' : 'courses'} reaching ${stats.totalStudents || 0} ${stats.totalStudents === 1 ? 'student' : 'students'}.`
                : "Let's publish your first course and start teaching."}
            </p>
            {memberSince && (
              <p style={{ margin: '0.5rem 0 0', opacity: 0.85, fontSize: '0.82rem' }}>
                📅 Teaching since {memberSince}
              </p>
            )}
          </div>

          <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
            <Link
              to="/instructor/create-course"
              style={{
                padding: '0.75rem 1.35rem', background: 'white', color: '#6c5ce7',
                textDecoration: 'none', borderRadius: '12px', fontWeight: 700,
                fontSize: '0.9rem', boxShadow: '0 4px 14px rgba(0,0,0,0.15)',
              }}
            >
              ➕ Create Course
            </Link>
            <Link
              to={`/instructor/${user?.id}`}
              style={{
                padding: '0.75rem 1.35rem', background: 'rgba(255,255,255,0.18)',
                color: 'white', textDecoration: 'none', borderRadius: '12px',
                fontWeight: 600, fontSize: '0.9rem', border: '1px solid rgba(255,255,255,0.35)',
              }}
            >
              🎬 Public Profile
            </Link>
          </div>
        </div>
      </div>

      {error && (
        <div style={{ padding: '0.85rem 1rem', background: '#fef3c7', color: '#92400e', border: '1px solid #fde68a', borderRadius: '12px', marginBottom: '1.25rem', fontSize: '0.9rem' }}>
          ⚠️ {error}
        </div>
      )}

      {/* STATS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        {statCards.map((s, i) => (
          <div
            key={i}
            style={{
              display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.25rem',
              background: 'var(--bg-card)', border: '1px solid var(--border-primary)',
              borderRadius: '16px', boxShadow: 'var(--shadow-sm)',
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
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', flexShrink: 0 }}>
              {s.icon}
            </div>
            <div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.1 }}>{s.value}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* TABS */}
      <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '1.25rem', background: 'var(--bg-secondary)', padding: '0.35rem', borderRadius: '14px', border: '1px solid var(--border-primary)', overflowX: 'auto' }}>
        {tabs.map((t) => {
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                flex: 1, minWidth: '120px', padding: '0.65rem 1rem',
                background: active ? 'var(--bg-card)' : 'transparent',
                color: active ? '#6c5ce7' : 'var(--text-secondary)',
                border: 'none', borderRadius: '10px', fontSize: '0.9rem',
                fontWeight: active ? 700 : 500, cursor: 'pointer',
                boxShadow: active ? '0 2px 8px rgba(0,0,0,0.06)' : 'none',
                transition: 'all 0.15s', whiteSpace: 'nowrap',
              }}
            >
              {t.icon} {t.label}
            </button>
          );
        })}
      </div>

      {/* OVERVIEW */}
      {tab === 'overview' && (
        <>
          {courses.length === 0 ? (
            <EmptyCourses />
          ) : (
            <>
              {/* Performance card */}
              <div style={{ padding: '1.5rem', background: 'var(--bg-card)', border: '1px solid var(--border-primary)', borderRadius: '18px', marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <h2 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-primary)' }}>📊 Performance</h2>
                  <Link to="/instructor/create-course" style={{ color: '#6c5ce7', fontSize: '0.85rem', fontWeight: 600, textDecoration: 'none' }}>
                    + New Course
                  </Link>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 140px), 1fr))', gap: '1rem' }}>
                  <MetricBox label="Published" value={stats.publishedCourses || 0} sub={`of ${stats.totalCourses || 0} total`} />
                  <MetricBox label="Lessons" value={stats.totalLessons || 0} sub="across all courses" />
                  <MetricBox label="Avg Rating" value={(stats.averageRating || 0).toFixed(1)} sub="from student reviews" />
                </div>
              </div>

              {/* Top course */}
              {courses[0] && (
                <div style={{ padding: '1.5rem', background: 'var(--bg-card)', border: '1px solid var(--border-primary)', borderRadius: '18px' }}>
                  <h2 style={{ margin: '0 0 1rem', fontSize: '1.1rem', color: 'var(--text-primary)' }}>🎯 Most Recent Course</h2>
                  <CourseCardRow course={courses[0]} />
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* COURSES */}
      {tab === 'courses' && (
        <div style={{ padding: '1.5rem', background: 'var(--bg-card)', border: '1px solid var(--border-primary)', borderRadius: '18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-primary)' }}>All Courses</h2>
            <Link to="/instructor/create-course" style={{ color: '#6c5ce7', fontSize: '0.85rem', fontWeight: 600, textDecoration: 'none' }}>
              + Add Course
            </Link>
          </div>
          {courses.length === 0 ? (
            <p style={{ color: 'var(--text-tertiary)', textAlign: 'center', padding: '2rem 0' }}>
              You haven't created any courses yet.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {courses.map((c) => <CourseCardRow key={c.id} course={c} />)}
            </div>
          )}
        </div>
      )}

      {/* BADGES */}
      {tab === 'badges' && (
        <div style={{ padding: '1.5rem', background: 'var(--bg-card)', border: '1px solid var(--border-primary)', borderRadius: '18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <h2 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-primary)' }}>🏆 Your Badges</h2>
            <span style={{ color: 'var(--text-tertiary)', fontSize: '0.85rem' }}>{achievements.length} earned</span>
          </div>

          {achievements.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2.5rem 1rem' }}>
              <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>🏅</div>
              <h3 style={{ color: 'var(--text-primary)', marginBottom: '0.35rem' }}>No badges yet</h3>
              <p style={{ color: 'var(--text-tertiary)', fontSize: '0.9rem', margin: '0 0 1rem' }}>
                Publish a course, get your first student, and earn your first instructor badge.
              </p>
              <Link
                to="/instructor/create-course"
                style={{
                  display: 'inline-block', padding: '0.65rem 1.5rem',
                  background: '#6c5ce7', color: 'white', borderRadius: '10px',
                  textDecoration: 'none', fontWeight: 600, fontSize: '0.9rem',
                }}
              >
                ➕ Create Your First Course
              </Link>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 170px), 1fr))', gap: '1rem' }}>
              {achievements.map((b, i) => (
                <div
                  key={i}
                  style={{
                    padding: '1.25rem 1rem', textAlign: 'center',
                    background: 'var(--bg-secondary)', borderRadius: '16px',
                    border: '1px solid var(--border-primary)',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-3px)';
                    e.currentTarget.style.boxShadow = '0 8px 20px rgba(108,92,231,0.15)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <div style={{ fontSize: '2.5rem', marginBottom: '0.35rem' }}>{b.icon || '🏅'}</div>
                  <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.88rem' }}>{b.name}</div>
                  {b.description && (
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '0.3rem', lineHeight: 1.4 }}>
                      {b.description}
                    </div>
                  )}
                  {b.earnedAt && (
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
                      Earned {new Date(b.earnedAt).toLocaleDateString()}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ─── subcomponents ─────────────────────────────────── */

function CourseCardRow({ course }) {
  return (
    <Link to={`/courses/${course.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
      <div
        style={{
          display: 'flex', alignItems: 'center', gap: '0.85rem',
          padding: '0.85rem', background: 'var(--bg-secondary)',
          borderRadius: '12px', border: '1px solid var(--border-primary)',
          transition: 'transform 0.15s, border-color 0.15s',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.borderColor = '#6c5ce7';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.borderColor = 'var(--border-primary)';
        }}
      >
        {isImageUrl(course.imageUrl) ? (
          <img src={course.imageUrl} alt="" style={{ width: '48px', height: '48px', objectFit: 'cover', borderRadius: '10px', flexShrink: 0 }} />
        ) : (
          <div style={{ width: '48px', height: '48px', borderRadius: '10px', background: 'linear-gradient(135deg, #6c5ce7, #a29bfe)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', flexShrink: 0 }}>
            📚
          </div>
        )}

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem', flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.92rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {course.title}
            </span>
            <span
              style={{
                padding: '0.1rem 0.55rem',
                background: course.isPublished ? '#dcfce7' : '#fef3c7',
                color: course.isPublished ? '#166534' : '#92400e',
                borderRadius: '20px', fontSize: '0.65rem', fontWeight: 700,
                whiteSpace: 'nowrap',
              }}
            >
              {course.isPublished ? 'Published' : 'Draft'}
            </span>
          </div>
          <div style={{ display: 'flex', gap: '1rem', fontSize: '0.78rem', color: 'var(--text-tertiary)', flexWrap: 'wrap' }}>
            <span>👥 {course.students || 0} students</span>
            <span>📚 {course.totalLessons || 0} lessons</span>
            <span>⭐ {(course.rating || 0).toFixed ? (course.rating || 0).toFixed(1) : course.rating || 0}</span>
          </div>
        </div>

        <span style={{ fontSize: '0.85rem', color: '#6c5ce7', fontWeight: 600, flexShrink: 0 }}>Manage →</span>
      </div>
    </Link>
  );
}

function MetricBox({ label, value, sub }) {
  return (
    <div style={{ padding: '1rem', background: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid var(--border-primary)', textAlign: 'center' }}>
      <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#6c5ce7', lineHeight: 1.1 }}>{value}</div>
      <div style={{ fontSize: '0.8rem', color: 'var(--text-primary)', fontWeight: 600, marginTop: '0.25rem' }}>{label}</div>
      <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', marginTop: '0.1rem' }}>{sub}</div>
    </div>
  );
}

function EmptyCourses() {
  return (
    <div style={{ padding: '3rem', textAlign: 'center', background: 'var(--bg-card)', border: '2px dashed var(--border-primary)', borderRadius: '18px' }}>
      <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>🎓</div>
      <h3 style={{ color: 'var(--text-primary)', marginBottom: '0.35rem' }}>You haven't created any courses yet</h3>
      <p style={{ color: 'var(--text-tertiary)', margin: '0 0 1.25rem', fontSize: '0.9rem' }}>
        Share your knowledge with students around the world.
      </p>
      <Link
        to="/instructor/create-course"
        style={{
          display: 'inline-block', padding: '0.75rem 1.75rem', background: '#6c5ce7',
          color: 'white', borderRadius: '10px', textDecoration: 'none',
          fontWeight: 600, fontSize: '0.92rem',
        }}
      >
        ➕ Create Your First Course
      </Link>
    </div>
  );
}

export default InstructorDashboard;