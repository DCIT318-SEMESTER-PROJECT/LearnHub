import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axiosConfig';

const isImageUrl = (v) =>
  typeof v === 'string' &&
  (v.startsWith('data:image') || v.startsWith('http') || v.startsWith('/'));

function InstructorCard({ instructorId, variant = 'full', showStats = true }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!instructorId) return;
    let cancelled = false;
    setLoading(true);
    setError('');
    api
      .get(`/auth/instructor/${instructorId}`)
      .then((res) => {
        if (!cancelled) setData(res.data);
      })
      .catch((err) => {
        if (!cancelled) setError(err.response?.data?.error || 'Could not load instructor');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [instructorId]);

  if (loading) {
    return (
      <div style={compactSkeleton(variant)}>
        <div style={avatarSkeleton(variant)} />
        <div style={{ flex: 1 }}>
          <div style={{ height: '14px', width: '50%', background: 'var(--bg-tertiary, var(--bg-secondary))', borderRadius: '6px', marginBottom: '0.5rem' }} />
          <div style={{ height: '12px', width: '80%', background: 'var(--bg-tertiary, var(--bg-secondary))', borderRadius: '6px' }} />
        </div>
      </div>
    );
  }

  if (error || !data?.instructor) {
    return null;
  }

  const { instructor, stats } = data;
  const initials =
    instructor.initials ||
    `${instructor.firstName?.[0] || ''}${instructor.lastName?.[0] || ''}`.toUpperCase();

  const bio = instructor.instructorBio || instructor.bio || '';
  const memberSince = instructor.createdAt
    ? new Date(instructor.createdAt).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
    : null;

  // ─── COMPACT (dashboard strip) ─────────────────────────────
  if (variant === 'compact') {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          padding: '0.65rem 0.85rem',
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-primary)',
          borderRadius: '12px',
          marginTop: '1rem',
        }}
      >
        <div style={avatarStyle('40px', '36px')}>
          {isImageUrl(instructor.avatarUrl) ? (
            <img src={instructor.avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'white' }}>{initials}</span>
          )}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)' }}>Instructor</div>
          <div
            style={{
              fontSize: '0.9rem',
              fontWeight: 600,
              color: 'var(--text-primary)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {instructor.firstName} {instructor.lastName}
          </div>
        </div>
        <Link
          to={`/instructor/${instructor.id}`}
          style={{
            fontSize: '0.78rem',
            color: '#6c5ce7',
            fontWeight: 600,
            textDecoration: 'none',
            whiteSpace: 'nowrap',
          }}
        >
          View →
        </Link>
      </div>
    );
  }

  // ─── FULL (course detail card) ─────────────────────────────
  const statItems = showStats
    ? [
        { icon: '📚', value: stats?.totalCourses ?? 0, label: 'Courses' },
        { icon: '👥', value: stats?.totalStudents ?? 0, label: 'Students' },
        { icon: '⭐', value: Number(stats?.averageRating ?? 0).toFixed(1), label: 'Rating' },
      ]
    : [];

  return (
    <div
      style={{
        padding: '1.5rem',
        background: 'var(--bg-card)',
        border: '1px solid var(--border-primary)',
        borderRadius: '18px',
        marginTop: '1.5rem',
      }}
    >
      <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap', alignItems: 'flex-start' }}>
        {/* avatar */}
        <div style={avatarStyle('88px', '72px')}>
          {isImageUrl(instructor.avatarUrl) ? (
            <img src={instructor.avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <span style={{ fontSize: '1.6rem', fontWeight: 700, color: 'white' }}>{initials}</span>
          )}
        </div>

        {/* info */}
        <div style={{ flex: 1, minWidth: '240px' }}>
          <div style={{ display: 'flex', gap: '0.65rem', alignItems: 'center', flexWrap: 'wrap', marginBottom: '0.35rem' }}>
            <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              {instructor.firstName} {instructor.lastName}
            </h3>
            <span style={{ padding: '0.2rem 0.65rem', background: '#fef3c7', color: '#92400e', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 700 }}>
              👨‍🏫 Instructor
            </span>
          </div>

          {(instructor.expertise || instructor.headline) && (
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', marginBottom: '0.4rem' }}>
              {instructor.headline || instructor.expertise}
            </div>
          )}

          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', fontSize: '0.8rem', color: 'var(--text-tertiary)', marginBottom: '0.85rem' }}>
            {instructor.expertise && (
              <span style={{ padding: '0.2rem 0.65rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)', borderRadius: '20px' }}>
                🧠 {instructor.expertise}
              </span>
            )}
            {instructor.yearsExperience > 0 && (
              <span style={{ padding: '0.2rem 0.65rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)', borderRadius: '20px' }}>
                🏅 {instructor.yearsExperience} {instructor.yearsExperience === 1 ? 'year' : 'years'}
              </span>
            )}
            {memberSince && (
              <span style={{ padding: '0.2rem 0.65rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)', borderRadius: '20px' }}>
                📅 Since {memberSince}
              </span>
            )}
          </div>

          {bio ? (
            <p
              style={{
                margin: '0 0 1rem',
                color: 'var(--text-secondary)',
                lineHeight: 1.65,
                fontSize: '0.92rem',
                whiteSpace: 'pre-wrap',
              }}
            >
              {bio.length > 320 ? `${bio.slice(0, 320)}…` : bio}
            </p>
          ) : (
            <p style={{ margin: '0 0 1rem', color: 'var(--text-tertiary)', fontStyle: 'italic', fontSize: '0.9rem' }}>
              This instructor hasn't written a bio yet.
            </p>
          )}

          <Link
            to={`/instructor/${instructor.id}`}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '0.55rem 1rem',
              background: '#6c5ce7',
              color: 'white',
              borderRadius: '10px',
              textDecoration: 'none',
              fontWeight: 600,
              fontSize: '0.85rem',
              boxShadow: '0 4px 12px rgba(108,92,231,0.25)',
            }}
          >
            View Full Profile →
          </Link>
        </div>
      </div>

      {/* stats */}
      {statItems.length > 0 && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${statItems.length}, minmax(0, 1fr))`,
            gap: '0.75rem',
            marginTop: '1.25rem',
            paddingTop: '1.25rem',
            borderTop: '1px solid var(--border-primary)',
          }}
        >
          {statItems.map((s, i) => (
            <div key={i} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.1rem', marginBottom: '0.15rem' }}>{s.icon}</div>
              <div style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.1 }}>
                {typeof s.value === 'number' ? s.value.toLocaleString() : s.value}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '0.15rem' }}>{s.label}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── styles ─────────────────────────────────────── */

const avatarStyle = (size, fontSize) => ({
  width: size,
  height: size,
  borderRadius: '50%',
  background: 'linear-gradient(135deg, #6c5ce7, #a29bfe)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  overflow: 'hidden',
  flexShrink: 0,
  border: '3px solid var(--bg-card)',
  boxShadow: '0 4px 14px rgba(108,92,231,0.25)',
});

const avatarSkeleton = (variant) => ({
  width: variant === 'compact' ? '40px' : '88px',
  height: variant === 'compact' ? '40px' : '88px',
  borderRadius: '50%',
  background: 'var(--bg-tertiary, var(--bg-secondary))',
  flexShrink: 0,
});

const compactSkeleton = (variant) => ({
  display: 'flex',
  alignItems: 'center',
  gap: '0.75rem',
  padding: variant === 'compact' ? '0.65rem 0.85rem' : '1.5rem',
  background: variant === 'compact' ? 'var(--bg-secondary)' : 'var(--bg-card)',
  border: '1px solid var(--border-primary)',
  borderRadius: variant === 'compact' ? '12px' : '18px',
  marginTop: variant === 'compact' ? '1rem' : '1.5rem',
});

export default InstructorCard;