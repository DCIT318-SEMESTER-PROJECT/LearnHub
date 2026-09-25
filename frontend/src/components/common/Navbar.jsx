import React, { useState, useEffect } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useMessages } from '../../context/MessagesContext';
import InboxDrawer from '../messages/InboxDrawer';

function Navbar() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme, isDark } = useTheme();
  const { unreadCount } = useMessages();
  const navigate = useNavigate();
  const location = useLocation();

  const [menuOpen, setMenuOpen] = useState(false);
  const [inboxOpen, setInboxOpen] = useState(false);

  // Close both when the route changes
  useEffect(() => {
    setMenuOpen(false);
    setInboxOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navLinkClass = ({ isActive }) =>
    'nav-link' + (isActive ? ' active' : '');

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        {/* Brand */}
        <Link to="/" className="navbar-brand">
          <span className="brand-icon">🎓</span>
          <span className="brand-name">LearnHub</span>
        </Link>

        {/* Links */}
        <div className="navbar-links">
          <NavLink to="/courses" className={navLinkClass}>Courses</NavLink>
          {user && user.role === 'Student' && (
            <NavLink to="/study-groups" className={navLinkClass}>Study Groups</NavLink>
          )}
          {user && (
            <NavLink to="/dashboard" className={navLinkClass}>Dashboard</NavLink>
          )}
        </div>

        {/* Actions */}
        <div className="navbar-actions">
          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="nav-btn-ghost"
            title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            style={{ width: '38px', padding: 0, height: '38px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            {isDark ? '☀️' : '🌙'}
          </button>

          {/* Bell — only when logged in */}
          {user && (
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setInboxOpen((v) => !v)}
                aria-label="Messages"
                title="Messages"
                style={{
                  position: 'relative',
                  background: 'transparent',
                  border: '1px solid var(--border-primary)',
                  borderRadius: '10px',
                  width: '38px',
                  height: '38px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  fontSize: '1.05rem',
                  color: 'var(--text-primary)',
                  padding: 0,
                }}
              >
                🔔
                {unreadCount > 0 && (
                  <span
                    style={{
                      position: 'absolute',
                      top: '-6px',
                      right: '-6px',
                      minWidth: '20px',
                      height: '20px',
                      background: '#ef4444',
                      color: 'white',
                      fontSize: '0.68rem',
                      fontWeight: 700,
                      borderRadius: '10px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '0 0.4rem',
                      border: '2px solid var(--navbar-bg)',
                    }}
                  >
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </button>
              {inboxOpen && <InboxDrawer onClose={() => setInboxOpen(false)} />}
            </div>
          )}

          {/* User / Sign in */}
          {user ? (
            <>
              <Link to="/profile" className="nav-btn-ghost" title={`Signed in as ${user.firstName}`}>
                {user.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt=""
                    style={{ width: '24px', height: '24px', borderRadius: '50%', objectFit: 'cover', verticalAlign: 'middle' }}
                  />
                ) : (
                  <span style={{ fontWeight: 600 }}>{user.firstName?.[0]}{user.lastName?.[0]}</span>
                )}
              </Link>
              <button onClick={handleLogout} className="nav-btn-ghost">Sign Out</button>
            </>
          ) : (
            <>
              <Link to="/login" className="nav-btn-ghost">Sign In</Link>
              <Link to="/register" className="nav-btn-primary">Sign Up</Link>
            </>
          )}

          {/* Mobile hamburger */}
          <button
            className="hamburger"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Menu"
          >
            {menuOpen ? '✕' : '☰'}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="mobile-menu">
          <Link to="/courses" className="mobile-nav-link">Courses</Link>
          {user && user.role === 'Student' && (
            <Link to="/study-groups" className="mobile-nav-link">Study Groups</Link>
          )}
          {user && (
            <>
              <Link to="/dashboard" className="mobile-nav-link">Dashboard</Link>
              <Link to="/profile" className="mobile-nav-link">Profile</Link>
              <button
                onClick={handleLogout}
                className="mobile-nav-link"
                style={{ background: 'transparent', border: 'none', textAlign: 'left', cursor: 'pointer', color: 'inherit' }}
              >
                Sign Out
              </button>
            </>
          )}
          {!user && (
            <>
              <Link to="/login" className="mobile-nav-link">Sign In</Link>
              <Link to="/register" className="mobile-nav-link">Sign Up</Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
}

export default Navbar;