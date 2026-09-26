import React, { useState, useEffect, useRef } from 'react';
import {
  getConversations,
  getThread,
  sendMessage,
} from '../../api/messagesAPI';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

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

const timeOfDay = (iso) => {
  if (!iso) return '';
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

export default function InboxDrawer({ onClose }) {
  const { user } = useAuth();
  const toast = useToast();

  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);

  // Which user's thread is open (null = list view)
  const [activeUserId, setActiveUserId] = useState(null);
  const [activeUser, setActiveUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadingThread, setLoadingThread] = useState(false);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);

  const drawerRef = useRef(null);
  const scrollRef = useRef(null);
  const inputRef = useRef(null);

  // ─── Load conversations ───
  const loadConversations = async () => {
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
    loadConversations();
  }, []);

  // ─── Open a conversation ───
  const openConversation = async (c) => {
    setActiveUserId(c.user.id);
    setActiveUser(c.user);
    setMessages([]);
    setLoadingThread(true);
    try {
      const { data } = await getThread(c.user.id);
      setMessages(data.messages || []);
      if (data.user) setActiveUser(data.user);
    } catch (err) {
      console.error('Failed to load thread:', err);
      toast.error('Failed to load conversation');
    } finally {
      setLoadingThread(false);
    }
  };

  const backToList = () => {
    setActiveUserId(null);
    setActiveUser(null);
    setMessages([]);
    setInput('');
  };

  // ─── Send a message ───
  const handleSend = async (e) => {
    e?.preventDefault?.();
    const body = input.trim();
    if (!body || !activeUserId || sending) return;

    setInput('');
    setSending(true);

    // Optimistic message
    const temp = {
      id: `temp-${Date.now()}`,
      senderId: user.id,
      body,
      createdAt: new Date().toISOString(),
      _temp: true,
    };
    setMessages((prev) => [...prev, temp]);

    try {
      await sendMessage(activeUserId, body);
      // Refresh thread from server
      const { data } = await getThread(activeUserId);
      setMessages(data.messages || []);
      // Also refresh the conversation list preview
      loadConversations();
    } catch (err) {
      setMessages((prev) => prev.filter((m) => m.id !== temp.id));
      setInput(body);
      toast.error(err.response?.data?.error || 'Failed to send');
    } finally {
      setSending(false);
    }
  };

  // ─── Auto-scroll ───
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // ─── Focus input when opening thread ───
  useEffect(() => {
    if (activeUserId && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [activeUserId]);

  // ─── Poll the open thread ───
  useEffect(() => {
    if (!activeUserId) return;
    const poll = setInterval(async () => {
      try {
        const { data } = await getThread(activeUserId);
        setMessages(data.messages || []);
      } catch (_) {}
    }, 8000);
    return () => clearInterval(poll);
  }, [activeUserId]);

  // ─── Close on outside click ───
  useEffect(() => {
    const onMouseDown = (e) => {
      if (!drawerRef.current) return;
      if (drawerRef.current.contains(e.target)) return;
      onClose();
    };
    const t = setTimeout(() => document.addEventListener('mousedown', onMouseDown), 0);
    return () => {
      clearTimeout(t);
      document.removeEventListener('mousedown', onMouseDown);
    };
  }, [onClose]);

  return (
    <>
      {/* Backdrop */}
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

      {/* Drawer panel */}
      <div
        ref={drawerRef}
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'fixed',
          top: '72px',
          right: '1rem',
          width: 'min(400px, calc(100vw - 2rem))',
          height: 'min(600px, calc(100vh - 100px))',
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
        {/* ═══════════ LIST VIEW ═══════════ */}
        {!activeUserId && (
          <>
            <div
              style={{
                padding: '1rem 1.15rem',
                borderBottom: '1px solid var(--border-primary)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexShrink: 0,
              }}
            >
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                📬 Messages
              </h3>
              <button
                onClick={onClose}
                aria-label="Close"
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-tertiary)',
                  fontSize: '1rem',
                  cursor: 'pointer',
                }}
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
                      transition: 'background 0.15s',
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
                        <span
                          style={{
                            fontWeight: 600,
                            fontSize: '0.9rem',
                            color: 'var(--text-primary)',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {c.user.firstName} {c.user.lastName}
                        </span>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', flexShrink: 0 }}>
                          {c.lastMessage ? timeAgo(c.lastMessage.createdAt) : ''}
                        </span>
                      </div>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          gap: '0.5rem',
                          marginTop: '0.1rem',
                        }}
                      >
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
          </>
        )}

        {/* ═══════════ THREAD VIEW ═══════════ */}
        {activeUserId && (
          <>
            {/* Header with back button */}
            <div
              style={{
                padding: '0.85rem 1rem',
                background: 'linear-gradient(135deg, #6c5ce7, #8b7cf0)',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                gap: '0.7rem',
                flexShrink: 0,
              }}
            >
              <button
                onClick={backToList}
                aria-label="Back"
                style={{
                  background: 'rgba(255,255,255,0.2)',
                  border: 'none',
                  color: 'white',
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                ←
              </button>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  background: 'rgba(255,255,255,0.22)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  overflow: 'hidden',
                  flexShrink: 0,
                }}
              >
                {isImageUrl(activeUser?.avatarUrl) ? (
                  <img src={activeUser.avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  initials(activeUser?.firstName, activeUser?.lastName)
                )}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: '0.92rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {activeUser?.firstName} {activeUser?.lastName}
                </div>
                <div style={{ fontSize: '0.7rem', opacity: 0.9 }}>
                  {activeUser?.isInstructor ? 'Instructor' : 'Student'}
                </div>
              </div>
              <button
                onClick={onClose}
                aria-label="Close"
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'white',
                  fontSize: '1.2rem',
                  cursor: 'pointer',
                  lineHeight: 1,
                }}
              >
                ✕
              </button>
            </div>

            {/* Messages */}
            <div
              ref={scrollRef}
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: '1rem',
                background: 'var(--bg-secondary)',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.6rem',
              }}
            >
              {loadingThread && messages.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-tertiary)', fontSize: '0.85rem' }}>
                  Loading…
                </div>
              ) : messages.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-tertiary)', fontSize: '0.85rem' }}>
                  No messages yet. Say hello! 👋
                </div>
              ) : (
                messages.map((m) => {
                  const isOwn = m.senderId === user.id;
                  return (
                    <div
                      key={m.id}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: isOwn ? 'flex-end' : 'flex-start',
                        opacity: m._temp ? 0.6 : 1,
                      }}
                    >
                      <div style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)', marginBottom: '0.2rem' }}>
                        {isOwn ? 'You' : activeUser?.firstName} · {timeOfDay(m.createdAt)}
                      </div>
                      <div
                        style={{
                          padding: '0.5rem 0.8rem',
                          background: isOwn ? '#6c5ce7' : 'var(--bg-card)',
                          color: isOwn ? 'white' : 'var(--text-primary)',
                          borderRadius: '12px',
                          maxWidth: '82%',
                          wordBreak: 'break-word',
                          fontSize: '0.88rem',
                          border: isOwn ? 'none' : '1px solid var(--border-primary)',
                        }}
                      >
                        {m.body}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Composer */}
            <form
              onSubmit={handleSend}
              style={{
                padding: '0.7rem',
                borderTop: '1px solid var(--border-primary)',
                background: 'var(--bg-card)',
                display: 'flex',
                gap: '0.5rem',
                alignItems: 'center',
                flexShrink: 0,
              }}
            >
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type a message…"
                style={{
                  flex: 1,
                  padding: '0.6rem 0.8rem',
                  border: '1px solid var(--border-input, var(--border-primary))',
                  borderRadius: '10px',
                  fontSize: '0.9rem',
                  color: 'var(--text-primary)',
                  background: 'var(--bg-input, var(--bg-secondary))',
                  outline: 'none',
                }}
              />
              <button
                type="submit"
                disabled={!input.trim() || sending}
                style={{
                  padding: '0.6rem 1rem',
                  background: !input.trim() || sending ? '#a29bfe' : '#6c5ce7',
                  color: 'white',
                  border: 'none',
                  borderRadius: '10px',
                  cursor: !input.trim() || sending ? 'not-allowed' : 'pointer',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  opacity: !input.trim() || sending ? 0.7 : 1,
                }}
              >
                {sending ? '…' : 'Send'}
              </button>
            </form>
          </>
        )}
      </div>
    </>
  );
}