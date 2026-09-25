import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { login } from '../api/authAPI';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

function Login() {
  const navigate = useNavigate();
  const { login: authLogin } = useAuth();
  const toast = useToast();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [generalError, setGeneralError] = useState('');

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
    setGeneralError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const newErrors = {};
    if (!formData.email) newErrors.email = 'Email is required';
    if (!formData.password) newErrors.password = 'Password is required';
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    setGeneralError('');

    try {
      const response = await login({ 
        email: formData.email, 
        password: formData.password 
      });
      
      authLogin(response.data.user, response.data.token);
      toast.success(`Welcome back, ${response.data.user.firstName}! 👋`);
      navigate('/dashboard');
    } catch (error) {
      console.error('Login failed:', error);
      if (error.response) {
        const errMsg = error.response.data?.error || 'Login failed. Please check your credentials.';
        setGeneralError(errMsg);
        toast.error(errMsg);
      } else if (error.request) {
        setGeneralError('Network error. Please check if the server is running.');
        toast.error('Cannot connect to server. Please try again.');
      } else {
        setGeneralError('Login failed. Please try again.');
        toast.error('Login failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page" style={{ 
      maxWidth: '420px', 
      margin: '4rem auto', 
      padding: '0 1rem' 
    }}>
      <div className="auth-card" style={{ 
        padding: '2.5rem',
        background: '#ffffff',
        borderRadius: '16px',
        border: '1px solid #eeecfb',
        boxShadow: '0 4px 24px rgba(0,0,0,0.06)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ fontSize: '2.5rem' }}>🔐</div>
          <h2 style={{ fontSize: '1.8rem', color: '#1a1a2e', marginTop: '0.5rem' }}>Welcome Back</h2>
          <p style={{ color: '#666' }}>Sign in to continue learning</p>
        </div>

        {generalError && (
          <div style={{
            padding: '0.75rem',
            background: '#fef2f2',
            color: '#ef4444',
            borderRadius: '8px',
            marginBottom: '1rem',
            textAlign: 'center'
          }}>
            {generalError}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '0.5rem', 
              fontWeight: '500',
              color: '#1a1a2e'
            }}>
              Email Address
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="you@example.com"
              style={{
                width: '100%',
                padding: '0.75rem',
                border: `1px solid ${errors.email ? '#ef4444' : '#ddd'}`,
                borderRadius: '8px',
                fontSize: '1rem',
                outline: 'none',
                transition: 'border-color 0.15s'
              }}
              onFocus={(e) => e.target.style.borderColor = '#6c5ce7'}
              onBlur={(e) => e.target.style.borderColor = errors.email ? '#ef4444' : '#ddd'}
            />
            {errors.email && (
              <div style={{ color: '#ef4444', fontSize: '0.85rem', marginTop: '0.25rem' }}>
                {errors.email}
              </div>
            )}
          </div>

          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '0.5rem', 
              fontWeight: '500',
              color: '#1a1a2e'
            }}>
              Password
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter your password"
              style={{
                width: '100%',
                padding: '0.75rem',
                border: `1px solid ${errors.password ? '#ef4444' : '#ddd'}`,
                borderRadius: '8px',
                fontSize: '1rem',
                outline: 'none',
                transition: 'border-color 0.15s'
              }}
              onFocus={(e) => e.target.style.borderColor = '#6c5ce7'}
              onBlur={(e) => e.target.style.borderColor = errors.password ? '#ef4444' : '#ddd'}
            />
            {errors.password && (
              <div style={{ color: '#ef4444', fontSize: '0.85rem', marginTop: '0.25rem' }}>
                {errors.password}
              </div>
            )}
          </div>

          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: '1.5rem'
          }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                name="rememberMe"
                checked={formData.rememberMe}
                onChange={handleChange}
                style={{ cursor: 'pointer', accentColor: '#6c5ce7' }}
              />
              <span style={{ fontSize: '0.9rem', color: '#666' }}>Remember me</span>
            </label>
            <Link to="/forgot-password" style={{ fontSize: '0.9rem', color: '#6c5ce7' }}>
              Forgot password?
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '0.75rem',
              background: loading ? '#a29bfe' : '#6c5ce7',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '1rem',
              fontWeight: '500',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'background 0.15s',
              opacity: loading ? 0.7 : 1
            }}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
          <p style={{ color: '#666' }}>
            Don't have an account?{' '}
            <Link to="/register" style={{ color: '#6c5ce7', fontWeight: '500' }}>
              Sign Up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;