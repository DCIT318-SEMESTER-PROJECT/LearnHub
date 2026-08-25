import React, { useState } from 'react';
import api from '../../api/axiosConfig';
import { useAuth } from '../../context/AuthContext';

function DeleteAccountModal({ isOpen, onClose }) {
  const { logout } = useAuth();
  const [confirmText, setConfirmText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleDelete = async () => {
    if (confirmText !== 'DELETE') {
      setError('Please type DELETE to confirm');
      return;
    }

    try {
      setLoading(true);
      setError('');
      await api.delete('/auth/account');
      
      // Logout and redirect
      logout();
      window.location.href = '/';
    } catch (err) {
      console.error('Error deleting account:', err);
      setError('Failed to delete account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setConfirmText('');
    setError('');
    onClose();
  };

  return (
    <>
      {/* Overlay */}
      <div
        onClick={handleClose}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          animation: 'fadeIn 0.2s ease',
          backdropFilter: 'blur(4px)'
        }}
      >
        {/* Modal */}
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            background: 'white',
            borderRadius: '20px',
            padding: '2.5rem',
            maxWidth: '480px',
            width: '90%',
            animation: 'slideUp 0.3s ease',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
            position: 'relative'
          }}
        >
          {/* Close button */}
          <button
            onClick={handleClose}
            style={{
              position: 'absolute',
              top: '12px',
              right: '16px',
              background: 'none',
              border: 'none',
              fontSize: '1.5rem',
              cursor: 'pointer',
              color: '#999',
              padding: '4px 8px',
              borderRadius: '50%',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#f5f5f5';
              e.currentTarget.style.color = '#333';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = '#999';
            }}
          >
            ✕
          </button>

          {/* Warning Icon */}
          <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            <div style={{
              fontSize: '4rem',
              marginBottom: '0.5rem'
            }}>
              ⚠️
            </div>
            <h2 style={{
              fontSize: '1.5rem',
              color: '#1a1a2e',
              marginBottom: '0.5rem'
            }}>
              Delete Account
            </h2>
            <p style={{
              color: '#6b7280',
              fontSize: '0.95rem',
              lineHeight: '1.6'
            }}>
              This action is <strong style={{ color: '#ef4444' }}>permanent</strong> and cannot be undone.
              All your data will be deleted.
            </p>
          </div>

          {/* What will be deleted */}
          <div style={{
            padding: '1rem',
            background: '#fef2f2',
            borderRadius: '12px',
            marginBottom: '1.5rem',
            border: '1px solid #fecaca'
          }}>
            <p style={{
              fontSize: '0.85rem',
              color: '#991b1b',
              fontWeight: '500',
              marginBottom: '0.5rem'
            }}>
              This will delete:
            </p>
            <ul style={{
              fontSize: '0.85rem',
              color: '#6b7280',
              paddingLeft: '1.5rem',
              margin: 0,
              lineHeight: '1.8'
            }}>
              <li>Your profile and personal information</li>
              <li>All course enrollments and progress</li>
              <li>All study group memberships</li>
              <li>All quiz attempts and scores</li>
              <li>All achievements and badges</li>
            </ul>
          </div>

          {/* Confirmation */}
          <div style={{ marginBottom: '1.5rem' }}>
            <p style={{
              fontSize: '0.9rem',
              color: '#1a1a2e',
              marginBottom: '0.5rem',
              fontWeight: '500'
            }}>
              Type <strong style={{ color: '#ef4444' }}>DELETE</strong> to confirm
            </p>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => {
                setConfirmText(e.target.value);
                setError('');
              }}
              placeholder="Type DELETE here"
              style={{
                width: '100%',
                padding: '0.75rem',
                border: `2px solid ${error ? '#ef4444' : '#d1d5db'}`,
                borderRadius: '10px',
                fontSize: '1rem',
                outline: 'none',
                transition: 'border-color 0.2s',
                color: '#1a1a2e',
                fontFamily: 'monospace',
                fontWeight: 'bold',
                letterSpacing: '2px'
              }}
              onFocus={(e) => {
                if (!error) e.currentTarget.style.borderColor = '#6c5ce7';
              }}
              onBlur={(e) => {
                if (!error) e.currentTarget.style.borderColor = '#d1d5db';
              }}
            />
            {error && (
              <div style={{
                color: '#ef4444',
                fontSize: '0.85rem',
                marginTop: '0.5rem'
              }}>
                {error}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div style={{
            display: 'flex',
            gap: '1rem',
            flexWrap: 'wrap'
          }}>
            <button
              onClick={handleClose}
              style={{
                flex: 1,
                padding: '0.75rem',
                background: '#f5f5f5',
                color: '#6b7280',
                border: '1px solid #e5e7eb',
                borderRadius: '10px',
                cursor: 'pointer',
                fontSize: '0.95rem',
                fontWeight: '500',
                transition: 'all 0.2s',
                minWidth: '120px'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#e5e7eb';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#f5f5f5';
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              disabled={loading || confirmText !== 'DELETE'}
              style={{
                flex: 1,
                padding: '0.75rem',
                background: (loading || confirmText !== 'DELETE') ? '#fca5a5' : '#ef4444',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                cursor: (loading || confirmText !== 'DELETE') ? 'not-allowed' : 'pointer',
                fontSize: '0.95rem',
                fontWeight: '500',
                transition: 'all 0.2s',
                opacity: (loading || confirmText !== 'DELETE') ? 0.7 : 1,
                minWidth: '120px'
              }}
              onMouseEnter={(e) => {
                if (!loading && confirmText === 'DELETE') {
                  e.currentTarget.style.background = '#dc2626';
                }
              }}
              onMouseLeave={(e) => {
                if (!loading && confirmText === 'DELETE') {
                  e.currentTarget.style.background = '#ef4444';
                }
              }}
            >
              {loading ? 'Deleting...' : 'Delete Account'}
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from {
            transform: translateY(30px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
      `}</style>
    </>
  );
}

export default DeleteAccountModal;