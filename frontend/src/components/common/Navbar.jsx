import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function Navbar() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, logout } = useAuth();

  const handleSignOut = () => {
    logout();
    navigate('/login');
    setMenuOpen(false);
  };

  const closeMenu = () => {
    setMenuOpen(false);
  };

  const getInitials = () => {
    if (!user) return 'U';
    if (user.avatarUrl) return '';
    const first = user.firstName ? user.firstName[0] : '';
    const last = user.lastName ? user.lastName[0] : '';
    return (first + last).toUpperCase() || 'U';
  };

  const getFullName = () => {
    if (!user) return 'User';
    return `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'User';
  };

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="navbar-brand" onClick={closeMenu}>
          <div className="brand-icon">🎓</div>
          <span className="brand-name">LearnHub</span>
        </Link>

        <div className="navbar-links desktop-nav">
          <Link to="/courses" className={`nav-link ${pathname === '/courses' ? 'active' : ''}`}>Courses</Link>
          <Link to="/study-groups" className={`nav-link ${pathname === '/study-groups' ? 'active' : ''}`}>Study Groups</Link>
          <Link to="/dashboard" className={`nav-link ${pathname === '/dashboard' ? 'active' : ''}`}>Dashboard</Link>
        </div>

        <div className="navbar-actions desktop-actions">
          {user ? (
            <Link to="/profile" className="user-avatar" style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              textDecoration: 'none',
              padding: '0.25rem 0.75rem',
              borderRadius: '20px',
              background: '#f0eeff',
              color: '#6c5ce7',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#e8e0ff';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#f0eeff';
            }}
            >
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: user.avatarUrl 
                  ? `url(${user.avatarUrl}) center/cover no-repeat` 
                  : '#6c5ce7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 'bold',
                fontSize: '0.85rem',
                flexShrink: 0,
                color: 'white'
              }}>
                {!user.avatarUrl && (user.firstName?.[0] || 'U')}
              </div>
              <span style={{ fontSize: '0.9rem' }}>
                {user.firstName || 'User'}
              </span>
            </Link>
          ) : (
            <>
              <Link to="/login" className="nav-btn-ghost">Sign In</Link>
              <Link to="/register" className="nav-btn-primary">Sign Up</Link>
            </>
          )}
        </div>

        <button className="hamburger" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle menu">
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
          background: '#ffffff',
          borderBottom: '1px solid #eee',
          boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
          padding: '1rem',
          zIndex: 1000,
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem'
        }}>
          {user && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.75rem',
              background: '#f5f5f5',
              borderRadius: '10px',
              marginBottom: '0.5rem'
            }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                background: user.avatarUrl 
                  ? `url(${user.avatarUrl}) center/cover no-repeat` 
                  : '#6c5ce7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 'bold',
                fontSize: '1rem',
                flexShrink: 0,
                color: 'white'
              }}>
                {!user.avatarUrl && getInitials()}
              </div>
              <div>
                <div style={{ fontWeight: '600', fontSize: '0.95rem', color: '#1a1a2e' }}>
                  {getFullName()}
                </div>
                <div style={{ fontSize: '0.8rem', color: '#666' }}>
                  {user.email}
                </div>
              </div>
            </div>
          )}

          <Link to="/courses" className="mobile-nav-link" onClick={closeMenu} style={{
            padding: '0.75rem 1rem',
            color: pathname === '/courses' ? '#6c5ce7' : '#1a1a2e',
            background: pathname === '/courses' ? '#f0eeff' : 'transparent',
            borderRadius: '8px',
            textDecoration: 'none',
            display: 'block',
            fontWeight: pathname === '/courses' ? '600' : '400'
          }}>
            📚 Courses          </Link>

          <Link to="/study-groups" className="mobile-nav-link" onClick={closeMenu} style={{
            padding: '0.75rem 1rem',
            color: pathname === '/study-groups' ? '#6c5ce7' : '#1a1a2e',
            background: pathname === '/study-groups' ? '#f0eeff' : 'transparent',
            borderRadius: '8px',
            textDecoration: 'none',
            display: 'block',
            fontWeight: pathname === '/study-groups' ? '600' : '400'
          }}>
            👥 Study Groups
          </Link>

          <Link to="/dashboard" className="mobile-nav-link" onClick={closeMenu} style={{
            padding: '0.75rem 1rem',
            color: pathname === '/dashboard' ? '#6c5ce7' : '#1a1a2e',
            background: pathname === '/dashboard' ? '#f0eeff' : 'transparent',
            borderRadius: '8px',
            textDecoration: 'none',
            display: 'block',
            fontWeight: pathname === '/dashboard' ? '600' : '400'
          }}>
            📊 Dashboard
          </Link>

          {user && (
            <>
              <Link to="/profile" className="mobile-nav-link" onClick={closeMenu} style={{
                padding: '0.75rem 1rem',
                borderRadius: '8px',
                textDecoration: 'none',
                display: 'block',
                color: '#1a1a2e'
              }}>
                👤 Profile
              </Link>

              <div style={{ borderTop: '1px solid #eeecfb', margin: '0.25rem 0' }} />

              <button
                onClick={handleSignOut}
                style={{
                  padding: '0.75rem 1rem',
                  color: '#ef4444',
                  background: 'none',
                  border: 'none',
                  textAlign: 'left',
                  cursor: 'pointer',
                  fontSize: '0.95rem',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  width: '100%',
                  transition: 'background 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#fef2f2'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
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