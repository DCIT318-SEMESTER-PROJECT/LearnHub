import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getConversations } from '../../api/messagesAPI';

const isImageUrl = (v) =>
  typeof v === 'string' &&
  (v.startsWith('data:image') || v.startsWith('http') || v.startsWith('/'));

const initials = (first = '', last = '') =>
  `${first[0] || ''}${last[0] || ''}`.toUpperCase() || '?';

const timeAgo = (iso) => {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'now';
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d`;
  return new Date(iso).toLocaleDateString();
};

export default function InboxDrawer({ onClose }) {
  const navigate = useNavigate();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await getConversations();
        if (!cancelled) setConversations(data.conversations || []);
      } catch (err) {
        console.error('Failed to load conversations:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const openConversation = (c) => {
    onClose();
    if (c.groupId) {
      navigate(`/study-groups?open=${c.groupId}`);
    } else {
      console.warn('No groupId for conversation');
    }
  };

  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.4)',
          backdropFilter: 'blur(2px)',
          zIndex: 1300,
        }}
      />
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'fixed',
          top: '72px',
          right: '1rem',
          width: 'min(380px, calc(100vw - 2rem))',
          maxHeight: 'min(540px, calc(100vh - 100px))',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-primary)',
          borderRadius: '18px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          zIndex: 1301,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            padding: '1rem 1.15rem',
            borderBottom: '1px solid var(--border-primary)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            📬 Messages
          </h3>
          <button
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-tertiary)', fontSize: '1rem', cursor: 'pointer' }}
          >
            ✕
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto' }}>
          {loading ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '0.85rem' }}>
              Loading…
            </div>
          ) : conversations.length === 0 ? (
            <div style={{ padding: '2.5rem 1.5rem', textAlign: 'center' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>💬</div>
              <div style={{ color: 'var(--text-primary)', fontWeight: 600, marginBottom: '0.35rem' }}>
                No messages yet
              </div>
              <div style={{ color: 'var(--text-tertiary)', fontSize: '0.85rem' }}>
                Click anyone's profile to start a conversation.
              </div>
            </div>
          ) : (
            conversations.map((c) => (
              <button
                key={c.user.id}
                type="button"
                onClick={() => openConversation(c)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.75rem 1.15rem',
                  background: c.unreadCount > 0 ? 'var(--accent-light)' : 'transparent',
                  border: 'none',
                  borderBottom: '1px solid var(--border-primary)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontFamily: 'inherit',
                }}
              >
                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #6c5ce7, #a29bfe)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    overflow: 'hidden',
                    flexShrink: 0,
                  }}
                >
                  {isImageUrl(c.user.avatarUrl) ? (
                    <img src={c.user.avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    initials(c.user.firstName, c.user.lastName)
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '0.5rem' }}>
                    <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {c.user.firstName} {c.user.lastName}
                    </span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', flexShrink: 0 }}>
                      {c.lastMessage ? timeAgo(c.lastMessage.createdAt) : ''}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem', marginTop: '0.1rem' }}>
                    <span
                      style={{
                        fontSize: '0.78rem',
                        color: c.unreadCount > 0 ? 'var(--text-primary)' : 'var(--text-tertiary)',
                        fontWeight: c.unreadCount > 0 ? 600 : 400,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {c.lastMessage?.isOwn ? 'You: ' : ''}
                      {c.lastMessage?.body || (c.lastMessage?.hasAttachment ? '📎 Attachment' : '')}
                    </span>
                    {c.unreadCount > 0 && (
                      <span
                        style={{
                          background: '#6c5ce7',
                          color: 'white',
                          fontSize: '0.68rem',
                          fontWeight: 700,
                          padding: '0.1rem 0.5rem',
                          borderRadius: '10px',
                          flexShrink: 0,
                        }}
                      >
                        {c.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </>
  );
}