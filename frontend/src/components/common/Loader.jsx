import React from 'react';

function Loader({ size = 'medium', color = '#1976d2' }) {
  const sizes = {
    small: '20px',
    medium: '40px',
    large: '60px'
  };

  const loaderStyle = {
    display: 'inline-block',
    width: sizes[size],
    height: sizes[size],
    border: `4px solid ${color}`,
    borderTop: `4px solid transparent`,
    borderRadius: '50%',
    animation: 'spin 1s linear infinite'
  };

  return (
    <div style={{ textAlign: 'center', padding: '2rem' }}>
      <div style={loaderStyle}></div>
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
}

export default Loader;