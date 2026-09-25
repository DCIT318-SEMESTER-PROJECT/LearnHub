import React, { useEffect } from 'react';

function ConfirmDialog({
  isOpen,
  title = 'Are you sure?',
  message = '',
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  danger = false,
  onConfirm,
  onCancel,
}) {
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => {
      if (e.key === 'Escape') onCancel?.();
      if (e.key === 'Enter') onConfirm?.();
    };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [isOpen, onCancel, onConfirm]);

  if (!isOpen) return null;

  return (
    <div
      onClick={onCancel}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.55)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1100,
        padding: '1rem',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '420px',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-primary)',
          borderRadius: '18px',
          padding: '1.5rem',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          animation: 'confirmPop 0.15s ease-out',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              background: danger ? 'rgba(239,68,68,0.12)' : 'var(--accent-light)',
              color: danger ? '#ef4444' : '#6c5ce7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.2rem',
              flexShrink: 0,
            }}
          >
            {danger ? '⚠️' : '❓'}
          </div>
          <h3
            style={{
              margin: 0,
              fontSize: '1.05rem',
              fontWeight: 700,
              color: 'var(--text-primary)',
            }}
          >
            {title}
          </h3>
        </div>

        {message && (
          <p
            style={{
              margin: '0 0 1.25rem',
              color: 'var(--text-secondary)',
              fontSize: '0.9rem',
              lineHeight: 1.55,
            }}
          >
            {message}
          </p>
        )}

        <div style={{ display: 'flex', gap: '0.6rem', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
          <button
            onClick={onCancel}
            style={{
              padding: '0.6rem 1.1rem',
              background: 'transparent',
              color: 'var(--text-secondary)',
              border: '1px solid var(--border-input)',
              borderRadius: '10px',
              cursor: 'pointer',
              fontSize: '0.88rem',
              fontWeight: 500,
            }}
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            autoFocus
            style={{
              padding: '0.6rem 1.35rem',
              background: danger ? '#ef4444' : '#6c5ce7',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              cursor: 'pointer',
              fontSize: '0.88rem',
              fontWeight: 600,
              boxShadow: danger
                ? '0 4px 12px rgba(239,68,68,0.28)'
                : '0 4px 12px rgba(108,92,231,0.28)',
            }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes confirmPop {
          from { opacity: 0; transform: scale(0.95); }
          to   { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}

export default ConfirmDialog;