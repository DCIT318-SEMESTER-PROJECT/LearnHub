import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../api/axiosConfig';
import StarRating from '../components/common/StarRating';

const isImageUrl = (url) => {
  if (!url || typeof url !== 'string') return false;
  return url.startsWith('data:image') || url.startsWith('http://') || url.startsWith('https://') || url.startsWith('/');
};

function InstructorProfile() {
  const { instructorId } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        setError('');
        const res = await api.get(`/auth/instructor/${instructorId}`);
        setData(res.data);
      } catch (err) {
        console.error('Failed to load instructor profile:', err);
        setError(err.response?.data?.error || 'Could not load this instructor.');
      } finally {
        setLoading(false);
      }
    };
    if (instructorId) fetchProfile();
  }, [instructorId]);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem' }}>
        <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>👨‍🏫</div>
        <p style={{ color: 'var(--text-secondary)' }}>Loading instructor...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>
        <h2 style={{ color: 'var(--text-primary)' }}>{error || 'Instructor not found'}</h2>
        <Link to="/courses" style={{ color: '#6c5ce7', display: 'inline-block', marginTop: '1rem' }}>
          ← Back to courses
        </Link>
      </div>
    );
  }

  const { instructor, courses = [], stats = {} } = data;
  const initials = instructor.initials
    || `${instructor.firstName?.[0] || ''}${instructor.lastName?.[0] || ''}`.toUpperCase();

  const memberSince = instructor.createdAt
    ? new Date(instructor.createdAt).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
    : null;

  const getLevelColor = (level) => {
    if (!level) return '#666';
    switch (level.toLowerCase()) {
      case 'beginner': return '#34d399';
      case 'intermediate': return '#fbbf24';
      case 'advanced': return '#f87171';
      default: return '#666';
    }
  };

  const statCards = [
    { icon: '📚', label: 'Courses', value: stats.totalCourses || 0, bg: '#dbeafe' },
    { icon: '👥', label: 'Students', value: stats.totalStudents || 0, bg: '#dcfce7' },
    { icon: '🎬', label: 'Lessons', value: stats.totalLessons || 0, bg: '#fef3c7' },
    { icon: '⭐', label: 'Avg Rating', value: Number(stats.averageRating || 0).toFixed(1), bg: '#f0eeff' },
  ];

  return (
    <div style={{ maxWidth: '1200px', margin: '2rem auto', padding: '0 clamp(1rem, 3vw, 2rem)' }}>

      {/* ═══════════ HERO ═══════════ */}
      <div
        style={{
          position: 'relative',
          overflow: 'hidden',
          borderRadius: '24px',
          padding: 'clamp(1.75rem, 4vw, 3rem)',
          background: 'linear-gradient(135deg, #6c5ce7 0%, #8b7cf0 60%, #a29bfe 100%)',
          color: 'white',
          marginBottom: '2rem',
        }}
      >
        {/* decorative blobs */}
        <div style={{ position: 'absolute', top: '-60px', right: '-40px', width: '220px', height: '220px', borderRadius: '50%', background: 'rgba(255,255,255,0.10)' }} />
        <div style={{ position: 'absolute', bottom: '-100px', left: '-30px', width: '180px', height: '180px', borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />

        <div style={{ position: 'relative', zIndex: 1, display: 'flex', gap: '1.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* avatar */}
          <div
            style={{
              width: '112px',
              height: '112px',
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.22)',
              border: '4px solid rgba(255,255,255,0.45)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '2.4rem',
              fontWeight: 700,
              overflow: 'hidden',
              flexShrink: 0,
            }}
          >
            {instructor.avatarUrl ? (
              <img
                src={instructor.avatarUrl}
                alt={`${instructor.firstName} ${instructor.lastName}`}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              <span>{initials}</span>
            )}
          </div>

          {/* name + meta */}
          <div style={{ flex: 1, minWidth: '240px' }}>
            <h1 style={{ margin: 0, fontSize: 'clamp(1.6rem, 3vw, 2.2rem)', fontWeight: 700 }}>
              {instructor.firstName} {instructor.lastName}
            </h1>
            <p style={{ margin: '0.4rem 0 0', fontSize: '1rem', opacity: 0.95 }}>
              {instructor.headline || instructor.expertise || 'Instructor'}
            </p>

            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.9rem' }}>
              {instructor.expertise && (
                <span style={{ padding: '0.3rem 0.85rem', background: 'rgba(255,255,255,0.18)', border: '1px solid rgba(255,255,255,0.35)', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 600 }}>
                  🧠 {instructor.expertise}
                </span>
              )}
              {instructor.yearsExperience > 0 && (
                <span style={{ padding: '0.3rem 0.85rem', background: 'rgba(255,255,255,0.18)', border: '1px solid rgba(255,255,255,0.35)', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 600 }}>
                  🏅 {instructor.yearsExperience} {instructor.yearsExperience === 1 ? 'year' : 'years'} experience
                </span>
              )}
              {memberSince && (
                <span style={{ padding: '0.3rem 0.85rem', background: 'rgba(255,255,255,0.18)', border: '1px solid rgba(255,255,255,0.35)', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 600 }}>
                  📅 Member since {memberSince}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════ STATS STRIP ═══════════ */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 180px), 1fr))',
          gap: '1rem',
          marginBottom: '2rem',
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
              borderRadius: '16px',
              border: '1px solid var(--border-primary)',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <div
              style={{
                width: '46px',
                height: '46px',
                borderRadius: '12px',
                background: s.bg,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.4rem',
                flexShrink: 0,
              }}
            >
              {s.icon}
            </div>
            <div>
              <div style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.1 }}>
                {typeof s.value === 'number' ? s.value.toLocaleString() : s.value}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ═══════════ ABOUT ═══════════ */}
      {(instructor.instructorBio || instructor.bio) && (
        <div
          style={{
            padding: '1.75rem',
            background: 'var(--bg-card)',
            borderRadius: '20px',
            border: '1px solid var(--border-primary)',
            marginBottom: '2rem',
          }}
        >
          <h2 style={{ margin: '0 0 0.75rem', fontSize: '1.15rem', color: 'var(--text-primary)' }}>
            About {instructor.firstName}
          </h2>
          <p style={{ margin: 0, color: 'var(--text-secondary)', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
            {instructor.instructorBio || instructor.bio}
          </p>

          {(instructor.website || instructor.linkedin) && (
            <div style={{ display: 'flex', gap: '1rem', marginTop: '1.25rem', flexWrap: 'wrap' }}>
              {instructor.website && (
                <a
                  href={instructor.website}
                  target="_blank"
                  rel="noreferrer"
                  style={{ color: '#6c5ce7', fontWeight: 600, fontSize: '0.9rem', textDecoration: 'none' }}
                >
                  🌐 Website
                </a>
              )}
              {instructor.linkedin && (
                <a
                  href={instructor.linkedin}
                  target="_blank"
                  rel="noreferrer"
                  style={{ color: '#6c5ce7', fontWeight: 600, fontSize: '0.9rem', textDecoration: 'none' }}
                >
                  💼 LinkedIn
                </a>
              )}
            </div>
          )}
        </div>
      )}

      {/* ═══════════ COURSES ═══════════ */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <h2 style={{ margin: 0, fontSize: 'clamp(1.2rem, 2vw, 1.5rem)', color: 'var(--text-primary)' }}>
          Courses by {instructor.firstName}
        </h2>
        <span style={{ color: 'var(--text-tertiary)', fontSize: '0.9rem' }}>
          {courses.length} {courses.length === 1 ? 'course' : 'courses'}
        </span>
      </div>

      {courses.length === 0 ? (
        <div
          style={{
            padding: '3rem',
            textAlign: 'center',
            background: 'var(--bg-secondary)',
            borderRadius: '16px',
            border: '2px dashed var(--border-primary)',
          }}
        >
          <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>🎓</div>
          <h3 style={{ color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
            No published courses yet
          </h3>
          <p style={{ color: 'var(--text-tertiary)', margin: 0 }}>
            {instructor.firstName} hasn't published any courses. Check back soon!
          </p>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 320px), 1fr))',
            gap: '1.5rem',
          }}
        >
          {courses.map((course) => (
            <Link
              key={course.id}
              to={`/courses/${course.id}`}
              style={{ textDecoration: 'none', color: 'inherit' }}
            >
              <div
                style={{
                  padding: '1.25rem',
                  background: 'var(--bg-card)',
                  borderRadius: '16px',
                  border: '2px solid var(--border-primary)',
                  transition: 'transform 0.2s, box-shadow 0.2s, border-color 0.2s',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.borderColor = '#6c5ce7';
                  e.currentTarget.style.boxShadow = '0 10px 30px rgba(108,92,231,0.15)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.borderColor = 'var(--border-primary)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                {/* top row: thumbnail + level + price */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
                  {isImageUrl(course.imageUrl) ? (
                    <img
                      src={course.imageUrl}
                      alt={course.title}
                      style={{ width: '52px', height: '52px', objectFit: 'cover', borderRadius: '10px', flexShrink: 0 }}
                    />
                  ) : (
                    <span style={{ fontSize: '2rem' }}>{course.imageUrl || '📚'}</span>
                  )}
                  <span style={{ padding: '0.25rem 0.75rem', background: getLevelColor(course.difficultyLevel) + '20', color: getLevelColor(course.difficultyLevel), borderRadius: '20px', fontSize: '0.72rem', fontWeight: 600 }}>
                    {course.difficultyLevel || 'Beginner'}
                  </span>
                  <span style={{ padding: '0.25rem 0.75rem', background: course.price ? '#fbbf2420' : '#34d39920', color: course.price ? '#f59e0b' : '#34d399', borderRadius: '20px', fontSize: '0.72rem', fontWeight: 600, marginLeft: 'auto' }}>
                    {course.price ? `$${course.price}` : 'Free'}
                  </span>
                </div>

                <h3 style={{ fontSize: '1.05rem', color: 'var(--text-primary)', marginBottom: '0.4rem', fontWeight: 600 }}>
                  {course.title}
                </h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', flex: 1, marginBottom: '0.75rem', lineHeight: 1.5 }}>
                  {course.description?.substring(0, 110)}...
                </p>

                {/* meta */}
                <div style={{ display: 'flex', gap: '1rem', fontSize: '0.82rem', color: 'var(--text-tertiary)', paddingTop: '0.75rem', borderTop: '1px solid var(--border-primary)', flexWrap: 'wrap', alignItems: 'center' }}>
                  <span>📚 {course.totalLessons || 0}</span>
                  <span>👥 {course.students || 0}</span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                    <StarRating value={course.rating || 0} readOnly size={13} />
                    <span>({course.totalReviews || 0})</span>
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* ═══════════ FOOTER CTA ═══════════ */}
      <div
        style={{
          marginTop: '2.5rem',
          padding: '1.5rem',
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-primary)',
          borderRadius: '16px',
          textAlign: 'center',
        }}
      >
        <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
          Enjoyed one of {instructor.firstName}'s courses? Leave a rating on the course page — it helps other learners decide.
        </p>
      </div>
    </div>
  );
}

export default InstructorProfile;