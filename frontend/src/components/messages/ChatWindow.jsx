import React, { useState, useEffect, useRef } from 'react';
import { getThread, sendMessage } from '../../api/messagesAPI';
import { useMessages } from '../../context/MessagesContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

const isImageUrl = (v) =>
  typeof v === 'string' &&
  (v.startsWith('data:image') || v.startsWith('http') || v.startsWith('/'));

const initials = (first = '', last = '') =>
  `${first[0] || ''}${last[0] || ''}`.toUpperCase() || '?';

const formatBytes = (bytes = 0) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const formatTime = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

export default function ChatWindow() {
  const { user } = useAuth();
  const toast = useToast();
  const { openChatUserId, openChatUserMeta, closeChat, refreshUnread } = useMessages();

  const [messages, setMessages] = useState([]);
  const [otherUser, setOtherUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [input, setInput] = useState('');
  const [pendingAttachment, setPendingAttachment] = useState(null);
  const [uploadingAttachment, setUploadingAttachment] = useState(false);
  const [sending, setSending] = useState(false);

  const scrollRef = useRef(null);
  const attachInputRef = useRef(null);
  const pollRef = useRef(null);

  // Load thread when openChatUserId changes
  useEffect(() => {
    if (!openChatUserId) {
      setMessages([]);
      setOtherUser(null);
      setInput('');
      setPendingAttachment(null);
      return;
    }

    let cancelled = false;
    const load = async () => {
      try {
        setLoading(true);
        const { data } = await getThread(openChatUserId);
        if (cancelled) return;
        setMessages(data.messages || []);
        setOtherUser(data.user || openChatUserMeta || null);
        refreshUnread();
      } catch (err) {
        console.error('Failed to load thread:', err);
        if (!cancelled) toast.error(err.response?.data?.error || 'Failed to load conversation');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();

    // Poll for new messages in this thread every 8s
    pollRef.current = setInterval(async () => {
      try {
        const { data } = await getThread(openChatUserId);
        if (!cancelled) {
          setMessages(data.messages || []);
          refreshUnread();
        }
      } catch (_) {}
    }, 8000);

    return () => {
      cancelled = true;
      clearInterval(pollRef.current);
    };
  }, [openChatUserId]);

  // Auto-scroll on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error('File must be less than 2MB');
      e.target.value = '';
      return;
    }

    const allowed = ['image/', 'application/pdf', 'text/plain', 'text/markdown'];
    const ok = allowed.some((p) => (p.endsWith('/') ? file.type.startsWith(p) : file.type === p));
    if (!ok) {
      toast.error('Only images, PDFs, and text files are supported');
      e.target.value = '';
      return;
    }

    setUploadingAttachment(true);
    const reader = new FileReader();
    reader.onloadend = () => {
      setPendingAttachment({
        data: reader.result,
        type: file.type,
        name: file.name,
        size: file.size,
      });
      setUploadingAttachment(false);
    };
    reader.onerror = () => {
      toast.error('Failed to read file');
      setUploadingAttachment(false);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleSend = async (e) => {
    e?.preventDefault?.();
    if ((!input.trim() && !pendingAttachment) || sending) return;

    const body = input.trim();
    const attachment = pendingAttachment;
    setInput('');
    setPendingAttachment(null);
    setSending(true);

    // Optimistic
    const temp = {
      id: `temp-${Date.now()}`,
      senderId: user.id,
      body,
      attachmentData: attachment?.data,
      attachmentType: attachment?.type,
      attachmentName: attachment?.name,
      createdAt: new Date().toISOString(),
      _temp: true,
    };
    setMessages((prev) => [...prev, temp]);

    try {
      await sendMessage(openChatUserId, body, attachment);
      // Reload from server to get real ids/timestamps
      const { data } = await getThread(openChatUserId);
      setMessages(data.messages || []);
    } catch (err) {
      setMessages((prev) => prev.filter((m) => m.id !== temp.id));
      setInput(body);
      setPendingAttachment(attachment);
      toast.error(err.response?.data?.error || 'Failed to send');
    } finally {
      setSending(false);
    }
  };

  if (!openChatUserId) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        width: 'min(400px, calc(100vw - 40px))',
        height: 'min(560px, calc(100vh - 40px))',
        background: 'var(--bg-card)',
        borderRadius: '16px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
        border: '1px solid var(--border-primary)',
        zIndex: 1200,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '0.85rem 1rem',
          background: 'linear-gradient(135deg, #6c5ce7, #8b7cf0)',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          gap: '0.7rem',
        }}
      >
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
          {isImageUrl(otherUser?.avatarUrl) ? (
            <img src={otherUser.avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            initials(otherUser?.firstName, otherUser?.lastName)
          )}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: '0.92rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {otherUser?.firstName} {otherUser?.lastName}
          </div>
          <div style={{ fontSize: '0.72rem', opacity: 0.9 }}>
            {otherUser?.isInstructor ? 'Instructor' : 'Student'}
          </div>
        </div>
        <button
          onClick={closeChat}
          aria-label="Close chat"
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
          gap: '0.65rem',
        }}
      >
        {loading && messages.length === 0 ? (
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
                  {isOwn ? 'You' : `${otherUser?.firstName || ''}`} · {formatTime(m.createdAt)}
                </div>
                <div
                  style={{
                    padding: m.attachmentType ? '0.45rem' : '0.5rem 0.8rem',
                    background: isOwn ? '#6c5ce7' : 'var(--bg-card)',
                    color: isOwn ? 'white' : 'var(--text-primary)',
                    borderRadius: '12px',
                    maxWidth: '82%',
                    wordBreak: 'break-word',
                    fontSize: '0.88rem',
                    border: isOwn ? 'none' : '1px solid var(--border-primary)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.4rem',
                  }}
                >
                  {m.attachmentData && m.attachmentType?.startsWith('image/') && (
                    <img
                      src={m.attachmentData}
                      alt=""
                      style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: '8px', display: 'block' }}
                    />
                  )}
                  {m.attachmentData && !m.attachmentType?.startsWith('image/') && (
                    <a
                      href={m.attachmentData}
                      download={m.attachmentName}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.45rem 0.65rem',
                        background: isOwn ? 'rgba(255,255,255,0.18)' : 'var(--bg-secondary)',
                        border: isOwn ? '1px solid rgba(255,255,255,0.28)' : '1px solid var(--border-primary)',
                        borderRadius: '8px',
                        textDecoration: 'none',
                        color: 'inherit',
                        fontSize: '0.8rem',
                      }}
                    >
                      <span style={{ fontSize: '1.1rem' }}>
                        {m.attachmentType === 'application/pdf' ? '📄' : '📝'}
                      </span>
                      <span style={{ fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '160px' }}>
                        {m.attachmentName || 'File'}
                      </span>
                      <span style={{ marginLeft: 'auto', opacity: 0.75 }}>↓</span>
                    </a>
                  )}
                  {m.body && <div>{m.body}</div>}
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
          flexDirection: 'column',
          gap: '0.5rem',
        }}
      >
        {pendingAttachment && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.6rem',
              padding: '0.45rem 0.65rem',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-primary)',
              borderRadius: '10px',
            }}
          >
            {pendingAttachment.type.startsWith('image/') ? (
              <img src={pendingAttachment.data} alt="" style={{ width: '32px', height: '32px', borderRadius: '6px', objectFit: 'cover' }} />
            ) : (
              <span style={{ fontSize: '1.2rem' }}>
                {pendingAttachment.type === 'application/pdf' ? '📄' : '📝'}
              </span>
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {pendingAttachment.name}
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>
                {formatBytes(pendingAttachment.size)}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setPendingAttachment(null)}
              style={{ background: 'transparent', border: 'none', color: 'var(--error)', cursor: 'pointer', fontSize: '0.9rem' }}
            >
              ✕
            </button>
          </div>
        )}
        <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
          <button
            type="button"
            onClick={() => attachInputRef.current?.click()}
            disabled={uploadingAttachment}
            title="Attach"
            style={{
              width: '34px',
              height: '34px',
              borderRadius: '10px',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-input, var(--border-primary))',
              cursor: uploadingAttachment ? 'wait' : 'pointer',
              fontSize: '0.95rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              color: 'var(--text-secondary)',
            }}
          >
            {uploadingAttachment ? '⏳' : '📎'}
          </button>
          <input
            ref={attachInputRef}
            type="file"
            accept="image/*,application/pdf,text/plain,text/markdown"
            onChange={handleFile}
            style={{ display: 'none' }}
          />
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={pendingAttachment ? 'Add a caption…' : 'Type a message…'}
            style={{
              flex: 1,
              padding: '0.5rem 0.7rem',
              border: '1px solid var(--border-input, var(--border-primary))',
              borderRadius: '10px',
              fontSize: '0.88rem',
              color: 'var(--text-primary)',
              background: 'var(--bg-input, var(--bg-secondary))',
              outline: 'none',
            }}
          />
          <button
            type="submit"
            disabled={(!input.trim() && !pendingAttachment) || sending}
            style={{
              padding: '0.5rem 0.9rem',
              background: (!input.trim() && !pendingAttachment) || sending ? '#a29bfe' : '#6c5ce7',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              cursor: (!input.trim() && !pendingAttachment) || sending ? 'not-allowed' : 'pointer',
              fontWeight: 600,
              fontSize: '0.82rem',
              opacity: (!input.trim() && !pendingAttachment) || sending ? 0.7 : 1,
            }}
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
}