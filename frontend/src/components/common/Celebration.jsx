import React, { useEffect, useState, useRef } from 'react';
import Confetti from 'react-confetti';

function Celebration({ show, onClose, lessonTitle, courseTitle }) {
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight
  });
  const [isVisible, setIsVisible] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (show) {
      setIsVisible(true);
      // Auto close after 5 seconds
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      timerRef.current = setTimeout(() => {
        handleClose();
      }, 5000);
    } else {
      setIsVisible(false);
    }
  }, [show]);

  const handleClose = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setIsVisible(false);
    onClose();
  };

  if (!isVisible && !show) return null;

  return (
    <>
      <Confetti
        width={windowSize.width}
        height={windowSize.height}
        recycle={false}
        numberOfPieces={200}
        gravity={0.15}
        colors={['#6c5ce7', '#00b894', '#fdcb6e', '#e17055', '#0984e3', '#fd79a8', '#00cec9', '#ff7675']}
      />

      <div style={{
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
        animation: 'fadeIn 0.3s ease',
      }}>
        <div style={{
          background: 'white',
          borderRadius: '24px',
          padding: '2.5rem',
          maxWidth: '450px',
          width: '90%',
          textAlign: 'center',
          animation: 'bounceIn 0.5s ease',
          boxShadow: '0 30px 80px rgba(0,0,0,0.3)',
          position: 'relative'
        }}>
          {/* Close button in corner */}
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
              transition: 'all 0.2s ease',
              lineHeight: 1
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

          {/* Animated Checkmark */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            marginBottom: '0.5rem'
          }}>
            <svg width="70" height="70" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="#6c5ce7"
                strokeWidth="5"
                strokeDasharray="283"
                strokeDashoffset="283"
                style={{
                  animation: 'drawCircle 0.6s ease forwards'
                }}
              />
              <path
                d="M30 50 L45 65 L70 35"
                fill="none"
                stroke="#6c5ce7"
                strokeWidth="6"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray="100"
                strokeDashoffset="100"
                style={{
                  animation: 'drawCheck 0.5s ease 0.4s forwards'
                }}
              />
            </svg>
          </div>

          <h2 style={{
            fontSize: '1.5rem',
            color: '#1a1a2e',
            marginBottom: '0.25rem'
          }}>
            🎊 Lesson Completed! 🎊
          </h2>
          
          <p style={{
            fontSize: '1rem',
            color: '#555',
            marginBottom: '0.25rem'
          }}>
            <strong style={{ color: '#6c5ce7' }}>{lessonTitle}</strong>
          </p>
          <p style={{
            fontSize: '0.85rem',
            color: '#888',
            marginBottom: '1rem'
          }}>
            in <strong>{courseTitle}</strong>
          </p>

          <div style={{
            display: 'flex',
            gap: '0.5rem',
            justifyContent: 'center',
            flexWrap: 'wrap'
          }}>
            <span style={{ fontSize: '1.2rem' }}>⭐</span>
            <span style={{ fontSize: '1.2rem' }}>🌟</span>
            <span style={{ fontSize: '1.2rem' }}>✨</span>
            <span style={{ fontSize: '1.2rem' }}>🎯</span>
            <span style={{ fontSize: '1.2rem' }}>🏆</span>
          </div>

          <p style={{
            fontSize: '0.7rem',
            color: '#bbb',
            marginTop: '0.75rem'
          }}>
            Click ✕ or wait 5 seconds
          </p>
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

        @keyframes drawCircle {
          from { stroke-dashoffset: 283; }
          to { stroke-dashoffset: 0; }
        }

        @keyframes drawCheck {
          from { stroke-dashoffset: 100; }
          to { stroke-dashoffset: 0; }
        }
      `}</style>
    </>
  );
}

export default Celebration;