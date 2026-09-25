import React, { useState, useEffect, useRef } from 'react';
import { getConversations } from '../../api/messagesAPI';
import { useMessages } from '../../context/MessagesContext';

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
  const { openChat } = useMessages();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const drawerRef = useRef(null);

  const load = async () => {
    try {
      setLoading(true);
      const { data } = await getConversations();
      setConversations(data.conversations || []);
    } catch (err) {
      console.error('Failed to load conversations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  // Close on outside click
  useEffect(() => {
    const onClick = (e) => {
      if (drawerRef.current && !drawerRef.current.contains(e.target)) {
        onClose();
      }
    };
    const t = setTimeout(() => document.addEventListener('mousedown', onClick), 0);
    return () => {
      clearTimeout(t);
      document.removeEventListener('mousedown', onClick);
    };
  }, [onClose]);

  const openConversation = (c) => {
    // Fire the chat state first
    openChat(c.user.id, c.user);
    // Then close the drawer on the next tick, so both states apply cleanly
    setTimeout(() => onClose(), 0);
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
        ref={drawerRef}
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
          animation: 'inboxSlideIn 0.2s ease-out',
        }}
      >
        {/* Header */}
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

        {/* List */}
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
                  transition: 'background 0.15s',
                }}
                onMouseEnter={(e) => { if (c.unreadCount === 0) e.currentTarget.style.background = 'var(--bg-secondary)'; }}
                onMouseLeave={(e) => { if (c.unreadCount === 0) e.currentTarget.style.background = 'transparent'; }}
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
                      {c.lastMessage?.body ||
                        (c.lastMessage?.hasAttachment ? '📎 Attachment' : '')}
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

      <style>{`
        @keyframes inboxSlideIn {
          from { opacity: 0; transform: translateY(-8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </>
  );
}