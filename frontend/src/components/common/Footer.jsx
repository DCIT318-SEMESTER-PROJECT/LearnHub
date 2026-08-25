import React from 'react';

function Footer() {
  return (
    <footer className="footer">
      <div className="footer-inner">
        {/* Brand - with dark background */}
        <div className="footer-brand">
          <div className="footer-brand-icon">🎓</div>
          <div>
            <h3 className="footer-brand-name">LearnHub</h3>
            <p className="footer-brand-desc">The world's most learner-friendly education platform.</p>
          </div>
        </div>

        {/* Links */}
        <div className="footer-links">
          <div className="footer-column">
            <h4 className="footer-column-title">Platform</h4>
            <ul className="footer-column-list">
              <li><a href="/courses">Courses</a></li>
              <li><a href="/study-groups">Study Groups</a></li>
              <li><a href="/dashboard">Progress Tracker</a></li>
              <li><a href="/certifications">Certifications</a></li>
            </ul>
          </div>

          <div className="footer-column">
            <h4 className="footer-column-title">Company</h4>
            <ul className="footer-column-list">
              <li><a href="/about">About</a></li>
              <li><a href="/blog">Blog</a></li>
              <li><a href="/careers">Careers</a></li>
              <li><a href="/press">Press</a></li>
            </ul>
          </div>

          <div className="footer-column">
            <h4 className="footer-column-title">Support</h4>
            <ul className="footer-column-list">
              <li><a href="/help">Help Center</a></li>
              <li><a href="/contact">Contact</a></li>
              <li><a href="/privacy">Privacy</a></li>
              <li><a href="/terms">Terms</a></li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="footer-bottom">
        <p className="footer-copyright">© 2025 LearnHub. All rights reserved.</p>
        <div className="footer-social">
          <a href="#" className="social-link">Twitter</a>
          <a href="#" className="social-link">LinkedIn</a>
          <a href="#" className="social-link">GitHub</a>
          <a href="#" className="social-link">YouTube</a>
        </div>
      </div>
    </footer>
  );
}

export default Footer;