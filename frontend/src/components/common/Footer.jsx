import React from 'react';
import { Link } from 'react-router-dom';

function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer-inner">
        {/* Brand */}
        <div className="footer-brand">
          <div className="footer-brand-icon">🎓</div>
          <div>
            <h3 className="footer-brand-name">LearnHub</h3>
            <p className="footer-brand-desc">
              The world's most learner-friendly education platform.
            </p>
          </div>
        </div>

        {/* Links */}
        <div className="footer-links">
          <div className="footer-column">
            <h4 className="footer-column-title">Platform</h4>
            <ul className="footer-column-list">
              <li><Link to="/courses">Courses</Link></li>
              <li><Link to="/study-groups">Study Groups</Link></li>
              <li><Link to="/dashboard">Dashboard</Link></li>
              <li><Link to="/register">Become an Instructor</Link></li>
            </ul>
          </div>

          <div className="footer-column">
            <h4 className="footer-column-title">Learn</h4>
            <ul className="footer-column-list">
              <li><Link to="/profile">My Profile</Link></li>
              <li><Link to="/courses">Browse Courses</Link></li>
              <li><Link to="/dashboard">My Progress</Link></li>
              <li><Link to="/instructor/create-course">Teach on LearnHub</Link></li>
            </ul>
          </div>

          <div className="footer-column">
            <h4 className="footer-column-title">Support</h4>
            <ul className="footer-column-list">
              <li><a href="mailto:hello@learnhub.dev">Contact</a></li>
              <li><a href="#">Help Center</a></li>
              <li><a href="#">Privacy</a></li>
              <li><a href="#">Terms</a></li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="footer-bottom">
        <p className="footer-copyright">© {year} LearnHub. All rights reserved.</p>
        <div className="footer-social">
          <a
            href="https://twitter.com"
            className="social-link"
            target="_blank"
            rel="noreferrer"
          >
            Twitter
          </a>
          <a
            href="https://linkedin.com"
            className="social-link"
            target="_blank"
            rel="noreferrer"
          >
            LinkedIn
          </a>
          <a
            href="https://github.com"
            className="social-link"
            target="_blank"
            rel="noreferrer"
          >
            GitHub
          </a>
          <a
            href="https://youtube.com"
            className="social-link"
            target="_blank"
            rel="noreferrer"
          >
            YouTube
          </a>
        </div>
      </div>
    </footer>
  );
}

export default Footer;