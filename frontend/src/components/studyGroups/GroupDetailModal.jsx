import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getStudyGroupById } from '../../api/studyGroupsAPI';

const isImageUrl = (v) =>
  typeof v === 'string' &&
  (v.startsWith('data:image') || v.startsWith('http') || v.startsWith('/'));

const initials = (first = '', last = '') =>
  `${first[0] || ''}${last[0] || ''}`.toUpperCase() || '?';

const formatJoined = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d)) return '';
  return d.toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
};

function GroupDetailModal({ groupId, onClose, onViewMember, onJoin, onLeave, onDelete }) {
  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!groupId) return;
    let cancelled = false;
    setLoading(true);
    setError('');
    setGroup(null);
    getStudyGroupById(groupId)
      .then((res) => { if (!cancelled) setGroup(res.data); })
      .catch((err) => { if (!cancelled) setError(err.response?.data?.error || 'Failed to load group'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [groupId]);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  if (!groupId) return null;

  const members = group?.members || [];
  const memberCount = members.length;
  const isJoined = group?.isMember || group?.isJoined;
  const isAdmin = group?.isAdmin;

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
        zIndex: 1500,
        padding: '1rem',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '600px',
          maxHeight: 'calc(100vh - 40px)',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-primary)',
          borderRadius: '24px',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 24px 64px rgba(0,0,0,0.4)',
          animation: 'groupPop 0.2s ease-out',
        }}
      >
        {/* ═══════ HEADER ═══════ */}
        <div
          style={{
            position: 'relative',
            padding: '1.75rem 1.75rem 1.5rem',
            background: 'linear-gradient(135deg, #6c5ce7 0%, #8b7cf0 55%, #a29bfe 100%)',
            color: 'white',
            flexShrink: 0,
          }}
        >
          <div style={{ position: 'absolute', top: '-40px', right: '-30px', width: '160px', height: '160px', borderRadius: '50%', background: 'rgba(255,255,255,0.10)' }} />
          <div style={{ position: 'absolute', bottom: '-60px', left: '10%', width: '120px', height: '120px', borderRadius: '50%', background: 'rgba(255,255,255,0.07)' }} />

          <button
            onClick={onClose}
            aria-label="Close"
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

          <div style={{ position: 'relative', zIndex: 1 }}>
            {group?.courseId && (
              <Link
                to={`/courses/${group.courseId}`}
                onClick={(e) => e.stopPropagation()}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  padding: '0.25rem 0.7rem',
                  background: 'rgba(255,255,255,0.2)',
                  border: '1px solid rgba(255,255,255,0.35)',
                  borderRadius: '20px',
                  textDecoration: 'none',
                  color: 'white',
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  marginBottom: '0.75rem',
                }}
              >
                📚 {group.courseTitle || 'Course'}
              </Link>
            )}

            <h2 style={{ margin: '0 0 0.4rem', fontSize: '1.4rem', fontWeight: 700, lineHeight: 1.15 }}>
              {group?.name || 'Loading…'}
            </h2>

            {group?.description && (
              <p style={{ margin: '0 0 0.85rem', opacity: 0.95, fontSize: '0.92rem', lineHeight: 1.5 }}>
                {group.description}
              </p>
            )}

            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', fontSize: '0.8rem' }}>
              <span style={{ padding: '0.25rem 0.7rem', background: 'rgba(255,255,255,0.18)', border: '1px solid rgba(255,255,255,0.3)', borderRadius: '20px' }}>
                👥 {memberCount}/{group?.maxMembers || 20} members
              </span>
              {group?.meetingSchedule && (
                <span style={{ padding: '0.25rem 0.7rem', background: 'rgba(255,255,255,0.18)', border: '1px solid rgba(255,255,255,0.3)', borderRadius: '20px' }}>
                  📅 {group.meetingSchedule}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ═══════ BODY ═══════ */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '1.25rem 1.75rem',
            minHeight: '150px',
          }}
        >
          {loading ? (
            <div style={{ padding: '2rem 0', textAlign: 'center', color: 'var(--text-tertiary)' }}>
              Loading members…
            </div>
          ) : error ? (
            <div style={{ padding: '2rem 0', textAlign: 'center', color: 'var(--error)' }}>
              {error}
            </div>
          ) : (
            <>
              <h4
                style={{
                  margin: '0 0 0.75rem',
                  fontSize: '0.72rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: 'var(--text-tertiary)',
                  fontWeight: 700,
                }}
              >
                👥 Members ({members.length})
              </h4>

              {members.length === 0 ? (
                <p style={{ color: 'var(--text-tertiary)', textAlign: 'center', padding: '1rem 0', fontSize: '0.9rem' }}>
                  No members yet.
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  {members.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => onViewMember(m.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        padding: '0.6rem 0.75rem',
                        background: 'var(--bg-secondary)',
                        border: '1px solid var(--border-primary)',
                        borderRadius: '12px',
                        cursor: 'pointer',
                        textAlign: 'left',
                        width: '100%',
                        transition: 'all 0.15s',
                        fontFamily: 'inherit',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'var(--bg-hover)';
                        e.currentTarget.style.borderColor = '#6c5ce7';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'var(--bg-secondary)';
                        e.currentTarget.style.borderColor = 'var(--border-primary)';
                      }}
                    >
                      <div
                        style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '50%',
                          background: 'linear-gradient(135deg, #6c5ce7, #a29bfe)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                          fontSize: '0.82rem',
                          fontWeight: 700,
                          overflow: 'hidden',
                          flexShrink: 0,
                        }}
                      >
                        {isImageUrl(m.avatarUrl) ? (
                          <img src={m.avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          initials(m.firstName, m.lastName)
                        )}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.15rem' }}>
                          <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.9rem' }}>
                            {m.firstName} {m.lastName}
                          </span>
                          {m.isAdmin && (
                            <span style={{ padding: '0.1rem 0.5rem', background: '#f0eeff', color: '#6c5ce7', borderRadius: '10px', fontSize: '0.6rem', fontWeight: 700 }}>
                              ADMIN
                            </span>
                          )}
                        </div>
                        {m.joinedAt && (
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                            Joined {formatJoined(m.joinedAt)}
                          </span>
                        )}
                      </div>
                      <span style={{ fontSize: '0.78rem', color: '#6c5ce7', fontWeight: 600, flexShrink: 0 }}>
                        View →
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* ═══════ FOOTER — no Open Chat button ═══════ */}
        <div
          style={{
            padding: '0.9rem 1.75rem',
            borderTop: '1px solid var(--border-primary)',
            background: 'var(--bg-secondary)',
            display: 'flex',
            gap: '0.5rem',
            flexWrap: 'wrap',
            justifyContent: 'flex-end',
          }}
        >
          {isJoined ? (
            <button
              onClick={() => onLeave?.(group.id)}
              style={{
                padding: '0.6rem 1.25rem',
                background: 'transparent',
                color: 'var(--text-secondary)',
                border: '1px solid var(--border-primary)',
                borderRadius: '10px',
                cursor: 'pointer',
                fontWeight: 500,
                fontSize: '0.88rem',
              }}
            >
              Leave Group
            </button>
          ) : (
            <button
              onClick={() => onJoin?.(group.id)}
              style={{
                padding: '0.6rem 1.25rem',
                background: '#6c5ce7',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '0.88rem',
              }}
            >
              Join Group
            </button>
          )}

          {isAdmin && (
            <button
              onClick={() => onDelete?.(group.id)}
              style={{
                padding: '0.6rem 1rem',
                background: 'transparent',
                color: '#ef4444',
                border: '1px solid #fecaca',
                borderRadius: '10px',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '0.88rem',
              }}
              title="Delete group"
            >
              🗑️
            </button>
          )}
        </div>
      </div>

      <style>{`
        @keyframes groupPop {
          from { opacity: 0; transform: scale(0.94) translateY(8px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  );
}

export default GroupDetailModal;