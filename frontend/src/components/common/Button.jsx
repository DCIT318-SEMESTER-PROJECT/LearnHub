import React from 'react';

function Button({ 
  children, 
  onClick, 
  variant = 'primary', 
  size = 'medium',
  disabled = false,
  type = 'button',
  style = {}
}) {
  const baseStyle = {
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontWeight: '500',
    transition: 'all 0.3s ease',
    ...style
  };

  const variants = {
    primary: {
      backgroundColor: '#1976d2',
      color: 'white',
      ':hover': { backgroundColor: '#1565C0' }
    },
    secondary: {
      backgroundColor: 'transparent',
      color: '#1976d2',
      border: '2px solid #1976d2'
    },
    danger: {
      backgroundColor: '#dc3545',
      color: 'white',
      ':hover': { backgroundColor: '#c82333' }
    },
    success: {
      backgroundColor: '#28a745',
      color: 'white',
      ':hover': { backgroundColor: '#218838' }
    }
  };

  const sizes = {
    small: { padding: '0.25rem 0.5rem', fontSize: '0.875rem' },
    medium: { padding: '0.5rem 1rem', fontSize: '1rem' },
    large: { padding: '0.75rem 1.5rem', fontSize: '1.125rem' }
  };

  const buttonStyle = {
    ...baseStyle,
    ...variants[variant],
    ...sizes[size]
  };

  return (
    <button 
      style={buttonStyle} 
      onClick={onClick} 
      disabled={disabled}
      type={type}
    >
      {children}
    </button>
  );
}

export default Button;