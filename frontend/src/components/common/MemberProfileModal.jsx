import React, { useEffect, useState } from 'react';
import { getMemberProfile } from '../../api/studyGroupsAPI';
import { useMessages } from '../../context/MessagesContext';
import { useAuth } from '../../context/AuthContext';

const isImageUrl = (v) =>
  typeof v === 'string' &&
  (v.startsWith('data:image') || v.startsWith('http') || v.startsWith('/'));

const initials = (first = '', last = '') =>
  `${first[0] || ''}${last[0] || ''}`.toUpperCase() || '?';

function MemberProfileModal({ userId, onClose }) {
  const { user: currentUser } = useAuth();
  const { openChat } = useMessages();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    setLoading(true);
    setError('');
    getMemberProfile(userId)
      .then((res) => { if (!cancelled) setData(res.data); })
      .catch((err) => { if (!cancelled) setError(err.response?.data?.error || 'Failed to load profile'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [userId]);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  if (!userId) return null;

  const isSelf = currentUser && data?.user && currentUser.id === data.user.id;

  const handleMessage = () => {
    if (!data?.user) return;
    openChat(data.user.id, {
      firstName: data.user.firstName,
      lastName: data.user.lastName,
      avatarUrl: data.user.avatarUrl,
      isInstructor: !!data.user.isInstructor,
    });
    onClose();
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.7)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1600,
        padding: '1rem',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '540px',
          maxHeight: 'calc(100vh - 40px)',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-primary)',
          borderRadius: '24px',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 24px 64px rgba(0,0,0,0.4)',
          animation: 'profilePop 0.2s ease-out',
        }}
      >
        {/* ═══════ HEADER BAND + AVATAR (avatar now nested inside) ═══════ */}
        <div
          style={{
            position: 'relative',
            height: '160px',
            background: 'linear-gradient(135deg, #6c5ce7 0%, #8b7cf0 55%, #a29bfe 100%)',
            flexShrink: 0,
          }}
        >
          {/* Decorative circles (kept inside header band) */}
          <div
            style={{
              position: 'absolute',
              top: '-40px',
              right: '-30px',
              width: '140px',
              height: '140px',
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.10)',
            }}
          />
          <div
            style={{
              position: 'absolute',
              bottom: '-60px',
              left: '20%',
              width: '110px',
              height: '110px',
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.07)',
            }}
          />

          {/* Close button */}
          <button
            onClick={onClose}
            aria-label="Close profile"
            style={{
              position: 'absolute',
              top: '14px',
              right: '14px',
              width: '34px',
              height: '34px',
              borderRadius: '50%',
              background: 'rgba(0,0,0,0.25)',
              color: 'white',
              border: 'none',
              cursor: 'pointer',
              fontSize: '0.95rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 2,
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(0,0,0,0.45)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(0,0,0,0.25)')}
          >
            ✕
          </button>

          {/* ✅ Avatar — inside the header band, half in, half out */}
          {data?.user && (
            <div
              style={{
                position: 'absolute',
                bottom: '-52px',
                left: '1.75rem',
                width: '104px',
                height: '104px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #6c5ce7, #a29bfe)',
                border: '4px solid var(--bg-card)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                color: 'white',
                fontSize: '2.2rem',
                fontWeight: 700,
                boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
                zIndex: 1,
              }}
            >
              {isImageUrl(data.user.avatarUrl) ? (
                <img
                  src={data.user.avatarUrl}
                  alt=""
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                initials(data.user.firstName, data.user.lastName)
              )}
            </div>
          )}
        </div>

        {/* ═══════ BODY ═══════ */}
        <div
          style={{
            padding: '4rem 1.75rem 1.75rem',
            flex: 1,
            overflowY: 'auto',
          }}
        >
          {loading ? (
            <div style={{ padding: '2rem 0', textAlign: 'center', color: 'var(--text-tertiary)' }}>
              Loading profile…
            </div>
          ) : error ? (
            <div style={{ padding: '2rem 0', textAlign: 'center', color: 'var(--error)' }}>
              {error}
            </div>
          ) : data?.user ? (
            <>
              {/* Name + role */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.6rem',
                  flexWrap: 'wrap',
                  marginBottom: '0.5rem',
                }}
              >
                <h2
                  style={{
                    margin: 0,
                    fontSize: '1.4rem',
                    fontWeight: 700,
                    color: 'var(--text-primary)',
                    lineHeight: 1.15,
                  }}
                >
                  {data.user.firstName} {data.user.lastName}
                </h2>
                {data.user.isInstructor ? (
                  <span style={roleBadge('instructor')}>👨‍🏫 Instructor</span>
                ) : (
                  <span style={roleBadge('student')}>🎓 Student</span>
                )}
              </div>

              {/* Meta chips */}
              <div
                style={{
                  display: 'flex',
                  gap: '0.4rem',
                  flexWrap: 'wrap',
                  marginBottom: '1rem',
                }}
              >
                {data.user.streakDays > 0 && (
                  <span style={chip}>🔥 {data.user.streakDays}-day streak</span>
                )}
                {data.user.expertise && (
                  <span style={chip}>🧠 {data.user.expertise}</span>
                )}
                {data.user.createdAt && (
                  <span style={chip}>
                    📅 Joined{' '}
                    {new Date(data.user.createdAt).toLocaleDateString(undefined, {
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                )}
              </div>

              {/* Message button (hidden on own profile) */}
              {!isSelf && (
                <button
                  onClick={handleMessage}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    padding: '0.6rem 1.25rem',
                    background: '#6c5ce7',
                    color: 'white',
                    border: 'none',
                    borderRadius: '10px',
                    fontWeight: 600,
                    fontSize: '0.88rem',
                    cursor: 'pointer',
                    marginBottom: '1.35rem',
                    boxShadow: '0 4px 12px rgba(108,92,231,0.3)',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = '#5a4bd1')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = '#6c5ce7')}
                >
                  💬 Send Message
                </button>
              )}

              {/* Bio */}
              <Section title="About">
                {data.user.bio ? (
                  <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                    {data.user.bio}
                  </p>
                ) : (
                  <p style={{ margin: 0, color: 'var(--text-tertiary)', fontSize: '0.88rem', fontStyle: 'italic' }}>
                    This member hasn't written a bio yet.
                  </p>
                )}
              </Section>

              {/* Achievements */}
              {data.achievements?.length > 0 && (
                <Section title="🏆 Achievements">
                  <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                    {data.achievements.map((a, i) => (
                      <span
                        key={i}
                        title={a.description}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          padding: '0.35rem 0.7rem',
                          background: 'var(--bg-secondary)',
                          border: '1px solid var(--border-primary)',
                          borderRadius: '20px',
                          fontSize: '0.78rem',
                          color: 'var(--text-primary)',
                          fontWeight: 500,
                        }}
                      >
                        <span>{a.icon || '🏅'}</span>
                        <span>{a.name}</span>
                      </span>
                    ))}
                  </div>
                </Section>
              )}

              {/* Courses */}
              {data.enrollments?.length > 0 && (
                <Section title="📚 Currently learning">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {data.enrollments.map((c) => (
                      <div
                        key={c.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.7rem',
                          padding: '0.6rem 0.75rem',
                          background: 'var(--bg-secondary)',
                          border: '1px solid var(--border-primary)',
                          borderRadius: '12px',
                        }}
                      >
                        {isImageUrl(c.imageUrl) ? (
                          <img
                            src={c.imageUrl}
                            alt=""
                            style={{
                              width: '36px',
                              height: '36px',
                              borderRadius: '8px',
                              objectFit: 'cover',
                              flexShrink: 0,
                            }}
                          />
                        ) : (
                          <div
                            style={{
                              width: '36px',
                              height: '36px',
                              borderRadius: '8px',
                              background: 'var(--accent-light)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '1.1rem',
                              flexShrink: 0,
                            }}
                          >
                            📘
                          </div>
                        )}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div
                            style={{
                              fontSize: '0.85rem',
                              color: 'var(--text-primary)',
                              fontWeight: 600,
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              marginBottom: '0.2rem',
                            }}
                          >
                            {c.title}
                          </div>
                          <div
                            style={{
                              height: '5px',
                              background: 'var(--bg-card)',
                              borderRadius: '3px',
                              overflow: 'hidden',
                            }}
                          >
                            <div
                              style={{
                                height: '100%',
                                width: `${c.progressPercentage || 0}%`,
                                background: '#6c5ce7',
                                borderRadius: '3px',
                              }}
                            />
                          </div>
                        </div>
                        <span
                          style={{
                            fontSize: '0.75rem',
                            color: 'var(--text-tertiary)',
                            fontWeight: 600,
                            flexShrink: 0,
                          }}
                        >
                          {c.progressPercentage || 0}%
                        </span>
                      </div>
                    ))}
                  </div>
                </Section>
              )}

              {/* Groups */}
              {data.groups?.length > 0 && (
                <Section title="👥 Member of" isLast>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    {data.groups.map((g) => (
                      <div
                        key={g.id}
                        style={{
                          padding: '0.55rem 0.75rem',
                          background: 'var(--bg-secondary)',
                          border: '1px solid var(--border-primary)',
                          borderRadius: '10px',
                          fontSize: '0.85rem',
                        }}
                      >
                        <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                          {g.name}
                        </span>
                        {g.courseTitle && (
                          <span style={{ color: 'var(--text-tertiary)' }}>
                            {' '}· {g.courseTitle}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </Section>
              )}
            </>
          ) : null}
        </div>
      </div>

      <style>{`
        @keyframes profilePop {
          from { opacity: 0; transform: scale(0.94) translateY(8px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  );
}

/* ─── Small helpers ──────────────────────────────── */
function Section({ title, children, isLast = false }) {
  return (
    <div style={{ marginBottom: isLast ? 0 : '1.35rem' }}>
      <h4
        style={{
          margin: '0 0 0.6rem',
          fontSize: '0.72rem',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          color: 'var(--text-tertiary)',
          fontWeight: 700,
        }}
      >
        {title}
      </h4>
      {children}
    </div>
  );
}

const roleBadge = (type) =>
  type === 'instructor'
    ? {
        padding: '0.2rem 0.65rem',
        background: '#fef3c7',
        color: '#92400e',
        borderRadius: '20px',
        fontSize: '0.7rem',
        fontWeight: 700,
      }
    : {
        padding: '0.2rem 0.65rem',
        background: '#f0eeff',
        color: '#6c5ce7',
        borderRadius: '20px',
        fontSize: '0.7rem',
        fontWeight: 700,
      };

const chip = {
  padding: '0.25rem 0.65rem',
  background: 'var(--bg-secondary)',
  border: '1px solid var(--border-primary)',
  borderRadius: '20px',
  fontSize: '0.76rem',
  color: 'var(--text-secondary)',
  fontWeight: 500,
};

export default MemberProfileModal;