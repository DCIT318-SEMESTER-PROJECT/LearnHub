import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';

const API_BASE =
  import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

function AIChatPanel({ context = '' }) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'assistant',
      text: "Hi! I'm your AI study buddy. Ask me anything about the course you're viewing, or any topic you're studying.",
    },
  ]);
  const [input, setInput] = useState('');
  const [thinking, setThinking] = useState(false);
  const [interactionId, setInteractionId] = useState(null);
  const scrollRef = useRef(null);
  const inputRef = useRef(null);
  const abortRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, open]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100);
  }, [open]);

  const handleStop = () => {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
    setThinking(false);
    setMessages((prev) =>
      prev.map((m) => (m.streaming ? { ...m, streaming: false } : m))
    );
  };

  const handleSend = async (e) => {
    e?.preventDefault?.();
    if (!input.trim() || thinking) return;

    const userText = input.trim();
    const assistantId = `a-${Date.now()}`;

    setMessages((m) => [
      ...m,
      { id: `u-${Date.now()}`, role: 'user', text: userText },
      { id: assistantId, role: 'assistant', text: '', streaming: true },
    ]);
    setInput('');
    setThinking(true);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/ai/chat-stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          message: userText,
          previousInteractionId: interactionId,
          context,
        }),
        signal: controller.signal,
      });

      if (!res.ok || !res.body) {
        throw new Error(`Stream failed: ${res.status}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const payload = line.slice(6).trim();
          if (!payload) continue;

          try {
            const data = JSON.parse(payload);

            if (data.delta) {
              setMessages((m) =>
                m.map((msg) =>
                  msg.id === assistantId
                    ? { ...msg, text: msg.text + data.delta }
                    : msg
                )
              );
            }

            if (data.done) {
              setInteractionId(data.interactionId);
              setMessages((m) =>
                m.map((msg) =>
                  msg.id === assistantId ? { ...msg, streaming: false } : msg
                )
              );
            }

            if (data.error) {
              setMessages((m) =>
                m.map((msg) =>
                  msg.id === assistantId
                    ? {
                        ...msg,
                        text:
                          msg.text ||
                          'Sorry — something went wrong. Try again in a moment.',
                        isError: true,
                        streaming: false,
                      }
                    : msg
                )
              );
            }
          } catch (_) {
            // ignore malformed
          }
        }
      }
    } catch (err) {
      if (err.name === 'AbortError') {
        // user stopped — leave whatever text was already streamed
      } else {
        console.error('AI chat error:', err);
        setMessages((m) =>
          m.map((msg) =>
            msg.id === assistantId
              ? {
                  ...msg,
                  text:
                    msg.text ||
                    "Sorry — I couldn't answer that right now. Try again in a moment.",
                  isError: true,
                  streaming: false,
                }
              : msg
          )
        );
      }
    } finally {
      setThinking(false);
      abortRef.current = null;
    }
  };

  const handleClear = () => {
    setMessages([
      {
        id: 'welcome',
        role: 'assistant',
        text: 'Conversation cleared. Ask me anything!',
      },
    ]);
    setInteractionId(null);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!user) return null;

  return (
    <>
      <button
        onClick={() => setOpen((v) => !v)}
        title="Ask the AI study buddy"
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          border: 'none',
          background: 'linear-gradient(135deg, #6c5ce7, #a29bfe)',
          color: 'white',
          fontSize: '1.4rem',
          cursor: 'pointer',
          boxShadow: '0 8px 24px rgba(108,92,231,0.4)',
          zIndex: 1200,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'transform 0.15s',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.08)')}
        onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
      >
        {open ? '✕' : '💬'}
      </button>

      {open && (
        <div
          style={{
            position: 'fixed',
            bottom: '92px',
            right: '24px',
            width: 'min(400px, calc(100vw - 32px))',
            height: 'min(560px, calc(100vh - 120px))',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-primary)',
            borderRadius: '20px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.28)',
            zIndex: 1200,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            animation: 'aiPanelIn 0.18s ease-out',
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '0.9rem 1.1rem',
              background: 'linear-gradient(135deg, #6c5ce7, #8b7cf0)',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              gap: '0.6rem',
            }}
          >
            <div
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.22)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1rem',
              }}
            >
              🤖
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>AI Study Buddy</div>
              <div style={{ fontSize: '0.72rem', opacity: 0.9 }}>
                Ask anything — always here to help
              </div>
            </div>
            {messages.length > 1 && (
              <button
                onClick={handleClear}
                title="Clear conversation"
                style={{
                  background: 'rgba(255,255,255,0.18)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '0.35rem 0.6rem',
                  fontSize: '0.72rem',
                  cursor: 'pointer',
                }}
              >
                Clear
              </button>
            )}
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
            {messages.map((m) => (
              <div
                key={m.id}
                style={{
                  display: 'flex',
                  justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start',
                }}
              >
                <div
                  style={{
                    maxWidth: '85%',
                    padding: '0.6rem 0.85rem',
                    borderRadius: '14px',
                    background:
                      m.role === 'user'
                        ? '#6c5ce7'
                        : m.isError
                        ? 'rgba(239,68,68,0.12)'
                        : 'var(--bg-card)',
                    color:
                      m.role === 'user'
                        ? 'white'
                        : m.isError
                        ? '#dc2626'
                        : 'var(--text-primary)',
                    fontSize: '0.88rem',
                    lineHeight: 1.55,
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    border:
                      m.role === 'user'
                        ? 'none'
                        : m.isError
                        ? '1px solid rgba(239,68,68,0.3)'
                        : '1px solid var(--border-primary)',
                  }}
                >
                  {m.text}
                  {m.streaming && m.text && (
                    <span
                      style={{
                        display: 'inline-block',
                        width: '6px',
                        height: '1em',
                        background: 'var(--accent, #6c5ce7)',
                        marginLeft: '3px',
                        verticalAlign: 'text-bottom',
                        animation: 'aiBlink 1s steps(2) infinite',
                      }}
                    />
                  )}
                </div>
              </div>
            ))}

            {thinking && messages[messages.length - 1]?.text === '' && (
              <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                <div
                  style={{
                    padding: '0.6rem 0.85rem',
                    borderRadius: '14px',
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-primary)',
                    fontSize: '0.88rem',
                    color: 'var(--text-tertiary)',
                    display: 'flex',
                    gap: '0.3rem',
                    alignItems: 'center',
                  }}
                >
                  <span className="ai-dot" />
                  <span className="ai-dot" />
                  <span className="ai-dot" />
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <form
            onSubmit={handleSend}
            style={{
              padding: '0.75rem',
              borderTop: '1px solid var(--border-primary)',
              background: 'var(--bg-card)',
              display: 'flex',
              gap: '0.5rem',
            }}
          >
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask a question… (Shift+Enter for newline)"
              rows={1}
              disabled={thinking}
              style={{
                flex: 1,
                resize: 'none',
                padding: '0.6rem 0.75rem',
                background: 'var(--bg-input)',
                border: '1px solid var(--border-input)',
                borderRadius: '10px',
                fontSize: '0.88rem',
                color: 'var(--text-primary)',
                outline: 'none',
                fontFamily: 'inherit',
                maxHeight: '100px',
                opacity: thinking ? 0.6 : 1,
              }}
            />
            {thinking ? (
              <button
                type="button"
                onClick={handleStop}
                style={{
                  padding: '0 1rem',
                  background: '#ef4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                }}
              >
                Stop
              </button>
            ) : (
              <button
                type="submit"
                disabled={!input.trim()}
                style={{
                  padding: '0 1rem',
                  background: !input.trim() ? '#a29bfe' : '#6c5ce7',
                  color: 'white',
                  border: 'none',
                  borderRadius: '10px',
                  cursor: !input.trim() ? 'not-allowed' : 'pointer',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  opacity: !input.trim() ? 0.7 : 1,
                }}
              >
                Send
              </button>
            )}
          </form>
        </div>
      )}

      <style>{`
        @keyframes aiPanelIn {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes aiBlink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        .ai-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--text-tertiary);
          animation: aiDotBounce 1s infinite ease-in-out;
        }
        .ai-dot:nth-child(2) { animation-delay: 0.15s; }
        .ai-dot:nth-child(3) { animation-delay: 0.3s; }
        @keyframes aiDotBounce {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.5; }
          40% { transform: translateY(-4px); opacity: 1; }
        }
      `}</style>
    </>
  );
}

export default AIChatPanel;