import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

export default function Navbar() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();

  const handleSignOut = () => {
    logout();
    navigate('/login');
    setMenuOpen(false);
  };

  const closeMenu = () => setMenuOpen(false);

  const capitalize = (str) => {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  };

  const getInitials = () => {
    if (!user) return 'U';
    if (user.avatarUrl) return '';
    const first = user.firstName ? user.firstName[0] : '';
    const last = user.lastName ? user.lastName[0] : '';
    return (first + last).toUpperCase() || 'U';
  };

  const isInstructor = user?.role === 'Instructor' || user?.isInstructor;

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="navbar-brand" onClick={closeMenu}>
          <div className="brand-icon">🎓</div>
          <span className="brand-name">LearnHub</span>
        </Link>

        {/* Desktop nav links */}
        <div className="navbar-links desktop-nav">
          <Link to="/courses" className={`nav-link ${pathname === '/courses' ? 'active' : ''}`}>
            Courses
          </Link>

          {!isInstructor && (
            <Link 
              to="/study-groups" 
              className={`nav-link ${pathname === '/study-groups' ? 'active' : ''}`}
            >
              Study Groups
            </Link>
          )}

          <Link 
            to="/dashboard" 
            className={`nav-link ${pathname === '/dashboard' ? 'active' : ''}`}
          >
            Dashboard
          </Link>

          {isInstructor && (
            <Link 
              to="/instructor/create-course" 
              className={`nav-link ${pathname === '/instructor/create-course' ? 'active' : ''}`}
            >
              + Create Course
            </Link>
          )}
        </div>

        <div className="navbar-actions desktop-actions">
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            aria-label="Toggle theme"
            title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            style={{
              background: isDark ? '#2d3244' : '#f0eeff',
              color: isDark ? '#fbbf24' : '#6c5ce7',
              border: 'none',
              borderRadius: '50%',
              width: '40px',
              height: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              fontSize: '1.1rem',
              transition: 'all 0.3s ease',
              marginRight: '0.25rem'
            }}
          >
            {isDark ? '☀️' : '🌙'}
          </button>

          {user ? (
            <Link 
              to="/profile" 
              className="user-avatar" 
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                textDecoration: 'none',
                padding: '0.25rem 0.75rem',
                borderRadius: '20px',
                background: 'var(--bg-accent)',
                color: '#6c5ce7',
                transition: 'all 0.2s'
              }}
            >
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: user.avatarUrl 
                  ? `url(${user.avatarUrl}) center/cover no-repeat` 
                  : 'linear-gradient(135deg, #6c5ce7, #5a4bd1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 'bold',
                fontSize: '0.85rem',
                flexShrink: 0,
                color: 'white',
                overflow: 'hidden'
              }}>
                {!user.avatarUrl && (user.firstName?.[0] || 'U')}
              </div>
              <span style={{ fontSize: '0.9rem' }}>
                {capitalize(user.firstName) || 'User'}
              </span>
            </Link>
          ) : (
            <>
              <Link to="/login" className="nav-btn-ghost">Sign In</Link>
              <Link to="/register" className="nav-btn-primary">Sign Up</Link>
            </>
          )}
        </div>

        <button 
          className="hamburger" 
          onClick={() => setMenuOpen(!menuOpen)} 
          aria-label="Toggle menu"
        >
          {menuOpen ? '✕' : '☰'}
        </button>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="mobile-menu" style={{
          position: 'absolute',
          top: '64px',
          left: 0,
          right: 0,
          background: 'var(--bg-primary)',
          borderBottom: '1px solid var(--border-primary)',
          boxShadow: 'var(--shadow-md)',
          padding: '1rem',
          zIndex: 1000,
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem',
          maxHeight: 'calc(100vh - 64px)',
          overflowY: 'auto'
        }}>
          {/* Theme Toggle */}
          <button
            onClick={() => {
              toggleTheme();
              closeMenu();
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.75rem 1rem',
              background: 'var(--bg-accent)',
              color: '#6c5ce7',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '0.95rem',
              fontWeight: '500',
              textAlign: 'left',
              width: '100%',
              marginBottom: '0.25rem'
            }}
          >
            {isDark ? '☀️ Light Mode' : '🌙 Dark Mode'}
          </button>

          {/* User card */}
          {user && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.75rem',
              background: 'var(--bg-tertiary)',
              borderRadius: '10px',
              marginBottom: '0.5rem'
            }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                background: user.avatarUrl 
                  ? `url(${user.avatarUrl}) center/cover no-repeat` 
                  : 'linear-gradient(135deg, #6c5ce7, #5a4bd1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 'bold',
                fontSize: '1rem',
                flexShrink: 0,
                color: 'white',
                overflow: 'hidden'
              }}>
                {!user.avatarUrl && getInitials()}
              </div>
              <div>
                <div style={{ fontWeight: '600', fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                  {capitalize(user.firstName)} {capitalize(user.lastName)}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>
                  {user.email}
                </div>
              </div>
            </div>
          )}

          {/* Nav links */}
          <Link 
            to="/courses" 
            className="mobile-nav-link" 
            onClick={closeMenu}
            style={{
              padding: '0.75rem 1rem',
              color: pathname === '/courses' ? '#6c5ce7' : 'var(--text-primary)',
              background: pathname === '/courses' ? 'var(--bg-hover)' : 'transparent',
              borderRadius: '8px',
              textDecoration: 'none',
              display: 'block',
              fontWeight: pathname === '/courses' ? '600' : '400'
            }}
          >
            📚 Courses
          </Link>

          {!isInstructor && (
            <Link 
              to="/study-groups" 
              className="mobile-nav-link" 
              onClick={closeMenu}
              style={{
                padding: '0.75rem 1rem',
                color: pathname === '/study-groups' ? '#6c5ce7' : 'var(--text-primary)',
                background: pathname === '/study-groups' ? 'var(--bg-hover)' : 'transparent',
                borderRadius: '8px',
                textDecoration: 'none',
                display: 'block',
                fontWeight: pathname === '/study-groups' ? '600' : '400'
              }}
            >
              👥 Study Groups
            </Link>
          )}

          <Link 
            to="/dashboard" 
            className="mobile-nav-link" 
            onClick={closeMenu}
            style={{
              padding: '0.75rem 1rem',
              color: pathname === '/dashboard' ? '#6c5ce7' : 'var(--text-primary)',
              background: pathname === '/dashboard' ? 'var(--bg-hover)' : 'transparent',
              borderRadius: '8px',
              textDecoration: 'none',
              display: 'block',
              fontWeight: pathname === '/dashboard' ? '600' : '400'
            }}
          >
            📊 Dashboard
          </Link>

          {isInstructor && (
            <Link 
              to="/instructor/create-course" 
              className="mobile-nav-link" 
              onClick={closeMenu}
              style={{
                padding: '0.75rem 1rem',
                color: pathname === '/instructor/create-course' ? '#6c5ce7' : 'var(--text-primary)',
                background: pathname === '/instructor/create-course' ? 'var(--bg-hover)' : 'transparent',
                borderRadius: '8px',
                textDecoration: 'none',
                display: 'block',
                fontWeight: pathname === '/instructor/create-course' ? '600' : '400'
              }}
            >
              ➕ Create Course
            </Link>
          )}

          {user && (
            <>
              <Link 
                to="/profile" 
                className="mobile-nav-link" 
                onClick={closeMenu}
                style={{
                  padding: '0.75rem 1rem',
                  borderRadius: '8px',
                  textDecoration: 'none',
                  display: 'block',
                  color: 'var(--text-primary)'
                }}
              >
                👤 Profile
              </Link>

              <div style={{ borderTop: '1px solid var(--border-primary)', margin: '0.25rem 0' }} />

              <button
                onClick={handleSignOut}
                style={{
                  padding: '0.75rem 1rem',
                  color: 'var(--error)',
                  background: 'none',
                  border: 'none',
                  textAlign: 'left',
                  cursor: 'pointer',
                  fontSize: '0.95rem',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  width: '100%'
                }}
              >
                🚪 Sign Out
              </button>
            </>
          )}
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          .desktop-nav, .desktop-actions {
            display: none !important;
          }
          .mobile-menu {
            top: 56px !important;
          }
          .navbar-inner {
            height: 56px !important;
          }
        }
        @media (min-width: 769px) {
          .hamburger {
            display: none !important;
          }
        }
      `}</style>
    </nav>
  );
}