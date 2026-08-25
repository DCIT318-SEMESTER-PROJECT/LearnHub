import React, { useEffect, useState } from 'react';
import Confetti from 'react-confetti';

function WelcomeCelebration({ show, onClose, userName }) {
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight
  });

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    window.addEventListener('resize', handleResize);
    
    const timer = setTimeout(() => {
      if (show) {
        onClose();
      }
    }, 8000);

    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timer);
    };
  }, [show, onClose]);

  if (!show) return null;

  return (
    <>
      <Confetti
        width={windowSize.width}
        height={windowSize.height}
        recycle={false}
        numberOfPieces={300}
        gravity={0.1}
        colors={['#6c5ce7', '#00b894', '#fdcb6e', '#e17055', '#0984e3', '#fd79a8', '#00cec9']}
      />

      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0,0,0,0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        animation: 'fadeIn 0.3s ease',
        backdropFilter: 'blur(4px)'
      }}>
        <div style={{
          background: 'white',
          borderRadius: '24px',
          padding: '3rem 2.5rem',
          maxWidth: '500px',
          width: '90%',
          textAlign: 'center',
          animation: 'bounceIn 0.6s ease',
          boxShadow: '0 30px 80px rgba(0,0,0,0.3)',
          position: 'relative'
        }}>
          <button
            onClick={onClose}
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

          <div style={{
            fontSize: '4rem',
            marginBottom: '0.5rem',
            animation: 'celebrate 0.8s ease'
          }}>
            🎉
          </div>

          <div style={{
            fontSize: '3rem',
            marginBottom: '0.5rem',
            animation: 'celebrate 0.8s ease 0.2s both'
          }}>
            👋
          </div>

          <h2 style={{
            fontSize: '1.8rem',
            color: '#1a1a2e',
            marginBottom: '0.25rem'
          }}>
            Welcome to LearnHub!
          </h2>
          
          <p style={{
            fontSize: '1.1rem',
            color: '#555',
            marginBottom: '0.25rem'
          }}>
            <strong style={{ color: '#6c5ce7' }}>{userName}</strong>
          </p>
          <p style={{
            fontSize: '0.95rem',
            color: '#888',
            marginBottom: '1.5rem'
          }}>
            Your learning journey starts now! 🚀
          </p>

          <div style={{
            padding: '1rem',
            background: '#f0eeff',
            borderRadius: '12px',
            marginBottom: '1.5rem'
          }}>
            <div style={{ fontSize: '2rem' }}>🏆</div>
            <div style={{ fontWeight: '600', color: '#6c5ce7' }}>Achievement Unlocked!</div>
            <div style={{ fontSize: '0.9rem', color: '#666' }}>
              👋 Welcome! - Joined LearnHub and started your learning journey
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              padding: '0.75rem 2.5rem',
              background: '#6c5ce7',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              fontSize: '1rem',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: '0 4px 15px rgba(108,92,231,0.4)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.05)';
              e.currentTarget.style.boxShadow = '0 6px 25px rgba(108,92,231,0.5)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = '0 4px 15px rgba(108,92,231,0.4)';
            }}
          >
            Start Learning 🚀
          </button>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes bounceIn {
          0% {
            transform: scale(0.5);
            opacity: 0;
          }
          60% {
            transform: scale(1.05);
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }

        @keyframes celebrate {
          0% {
            transform: scale(0) rotate(-180deg);
            opacity: 0;
          }
          60% {
            transform: scale(1.3) rotate(10deg);
          }
          100% {
            transform: scale(1) rotate(0deg);
            opacity: 1;
          }
        }
      `}</style>
    </>
  );
}

export default WelcomeCelebration;