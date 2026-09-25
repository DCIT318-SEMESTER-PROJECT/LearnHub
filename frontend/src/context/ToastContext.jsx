import React, { createContext, useState, useContext, useCallback } from 'react';

const ToastContext = createContext();

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = 'info', duration = 3000) => {
    const id = Date.now() + Math.random();
    const toast = { id, message, type };
    
    setToasts(prev => [...prev, toast]);
    
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, duration);
  }, []);

  const success = useCallback((message) => showToast(message, 'success'), [showToast]);
  const error = useCallback((message) => showToast(message, 'error'), [showToast]);
  const info = useCallback((message) => showToast(message, 'info'), [showToast]);
  const warning = useCallback((message) => showToast(message, 'warning'), [showToast]);

  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ success, error, info, warning, showToast }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}

// ─── Toast Container Component ───
function ToastContainer({ toasts, onRemove }) {
  if (toasts.length === 0) return null;

  const getToastStyles = (type) => {
    switch (type) {
      case 'success':
        return {
          background: '#f0fdf4',
          border: '1px solid #86efac',
          iconBg: '#dcfce7',
          iconColor: '#16a34a',
          icon: '✓',
          titleColor: '#166534'
        };
      case 'error':
        return {
          background: '#fef2f2',
          border: '1px solid #fca5a5',
          iconBg: '#fee2e2',
          iconColor: '#dc2626',
          icon: '✕',
          titleColor: '#991b1b'
        };
      case 'warning':
        return {
          background: '#fffbeb',
          border: '1px solid #fcd34d',
          iconBg: '#fef3c7',
          iconColor: '#d97706',
          icon: '!',
          titleColor: '#92400e'
        };
      default:
        return {
          background: '#eff6ff',
          border: '1px solid #93c5fd',
          iconBg: '#dbeafe',
          iconColor: '#2563eb',
          icon: 'i',
          titleColor: '#1e40af'
        };
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: '80px',
      right: '20px',
      display: 'flex',
      flexDirection: 'column',
      gap: '0.75rem',
      zIndex: 99999,
      maxWidth: '400px',
      width: 'calc(100% - 40px)',
      pointerEvents: 'none'
    }}>
      {toasts.map(toast => {
        const styles = getToastStyles(toast.type);
        return (
          <div
            key={toast.id}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.75rem',
              padding: '1rem 1.25rem',
              background: styles.background,
              border: styles.border,
              borderRadius: '12px',
              boxShadow: '0 8px 24px rgba(0,0,0,0.1), 0 2px 6px rgba(0,0,0,0.05)',
              animation: 'toastSlideIn 0.3s ease',
              pointerEvents: 'auto',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            <div style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              background: styles.iconBg,
              color: styles.iconColor,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 'bold',
              fontSize: '0.9rem',
              flexShrink: 0
            }}>
              {styles.icon}
            </div>
            <div style={{
              flex: 1,
              fontSize: '0.9rem',
              color: styles.titleColor,
              fontWeight: '500',
              lineHeight: '1.4',
              paddingTop: '0.15rem'
            }}>
              {toast.message}
            </div>
            <button
              onClick={() => onRemove(toast.id)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#9ca3af',
                fontSize: '1rem',
                padding: '0 0.25rem',
                marginTop: '-0.15rem',
                transition: 'color 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = '#6b7280'}
              onMouseLeave={(e) => e.currentTarget.style.color = '#9ca3af'}
            >
              ✕
            </button>

            {/* Progress bar */}
            <div style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              height: '3px',
              background: styles.iconColor,
              opacity: 0.3,
              animation: 'toastProgress 3s linear forwards'
            }} />
          </div>
        );
      })}

      <style>{`
        @keyframes toastSlideIn {
          from {
            transform: translateX(400px);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }

        @keyframes toastProgress {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </div>
  );
}

export default ToastProvider;