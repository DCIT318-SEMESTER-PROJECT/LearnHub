import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { register } from '../api/authAPI';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import WelcomeCelebration from '../components/common/WelcomeCelebration';

const CATEGORIES = [
  'Web Development',
  'Programming',
  'Data Science',
  'Design',
  'Mobile Development',
  'DevOps',
  'Business',
  'Marketing',
  'Photography',
  'Music',
  'Other'
];

function Register() {
  const navigate = useNavigate();
  const { login: authLogin } = useAuth();
  const toast = useToast();
  const [step, setStep] = useState(1); // 1: role picker, 2: form
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'Student',
    agreeTerms: false,
    // Instructor-specific fields
    headline: '',
    teachingCategory: '',
    yearsExperience: 0,
    expertise: '',
    instructorBio: '',
    credentials: '',
    website: '',
    linkedin: ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [generalError, setGeneralError] = useState('');
  const [showWelcome, setShowWelcome] = useState(false);
  const [userName, setUserName] = useState('');

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

  const handleRoleSelect = (role) => {
    setFormData({ ...formData, role });
    setStep(2);
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.firstName) newErrors.firstName = 'First name is required';
    if (!formData.lastName) newErrors.lastName = 'Last name is required';
    if (!formData.email) newErrors.email = 'Email is required';
    if (!formData.password) newErrors.password = 'Password is required';
    if (formData.password.length < 8) newErrors.password = 'Password must be at least 8 characters';
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    if (!formData.agreeTerms) newErrors.agreeTerms = 'You must agree to the terms';

    // Instructor-specific validation
    if (formData.role === 'Instructor') {
      if (!formData.headline) newErrors.headline = 'Professional headline is required';
      if (!formData.teachingCategory) newErrors.teachingCategory = 'Please select a category';
      if (!formData.expertise) newErrors.expertise = 'Areas of expertise are required';
      if (!formData.instructorBio) newErrors.instructorBio = 'Bio is required';
    }

    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = validate();

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    setGeneralError('');

    try {
      const payload = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password,
        role: formData.role
      };

      // Add instructor fields if registering as instructor
      if (formData.role === 'Instructor') {
        payload.headline = formData.headline;
        payload.teachingCategory = formData.teachingCategory;
        payload.yearsExperience = parseInt(formData.yearsExperience) || 0;
        payload.expertise = formData.expertise;
        payload.instructorBio = formData.instructorBio;
        payload.credentials = formData.credentials;
        payload.website = formData.website;
        payload.linkedin = formData.linkedin;
      }

      console.log('📤 Registering with payload:', payload);

      const response = await register(payload);
      
      authLogin(response.data.user, response.data.token);
      setUserName(`${formData.firstName} ${formData.lastName}`);
      setShowWelcome(true);
    } catch (error) {
      console.error('Registration failed:', error);
      const errMsg = error.response?.data?.error || 'Registration failed. Please try again.';
      setGeneralError(errMsg);
      toast.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <WelcomeCelebration
        show={showWelcome}
        onClose={() => {
          setShowWelcome(false);
          navigate('/dashboard');
        }}
        userName={userName}
        role={formData.role}
      />
      
      <div className="auth-page" style={{ 
        maxWidth: formData.role === 'Instructor' ? '620px' : '520px', 
        margin: '3rem auto', 
        padding: '0 1rem',
        transition: 'max-width 0.3s'
      }}>
        <div className="auth-card" style={{ 
          padding: 'clamp(1.5rem, 3vw, 2.5rem)',
          background: 'var(--bg-card)',
          borderRadius: '16px',
          border: '1px solid var(--border-primary)',
          boxShadow: 'var(--shadow-md)'
        }}>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div style={{ fontSize: '2.5rem' }}>
              {step === 1 ? '🚀' : formData.role === 'Instructor' ? '👨‍🏫' : '🎓'}
            </div>
            <h2 style={{ 
              fontSize: '1.8rem', 
              color: 'var(--text-primary)', 
              marginTop: '0.5rem' 
            }}>
              {step === 1 ? 'Join LearnHub' : formData.role === 'Instructor' ? 'Instructor Signup' : 'Student Signup'}
            </h2>
            <p style={{ color: 'var(--text-tertiary)' }}>
              {step === 1 
                ? 'Choose how you want to join'
                : formData.role === 'Instructor'
                  ? 'Share your expertise with the world'
                  : 'Start your learning journey today'}
            </p>
          </div>

          {/* STEP 1: Role Picker */}
          {step === 1 && (
            <div>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: '1fr 1fr', 
                gap: '1rem' 
              }}>
                {/* Student Card */}
                <div
                  onClick={() => handleRoleSelect('Student')}
                  style={{
                    padding: '2rem 1.25rem',
                    background: 'var(--bg-secondary)',
                    border: '2px solid var(--border-primary)',
                    borderRadius: '16px',
                    cursor: 'pointer',
                    textAlign: 'center',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.borderColor = '#6c5ce7';
                    e.currentTarget.style.boxShadow = '0 8px 24px rgba(108,92,231,0.15)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.borderColor = 'var(--border-primary)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>🎓</div>
                  <div style={{ 
                    fontWeight: '700', 
                    color: 'var(--text-primary)',
                    marginBottom: '0.5rem',
                    fontSize: '1.1rem'
                  }}>
                    Student
                  </div>
                  <div style={{ 
                    fontSize: '0.85rem', 
                    color: 'var(--text-tertiary)',
                    lineHeight: '1.5'
                  }}>
                    Enroll in courses, join study groups, track your progress
                  </div>
                </div>

                {/* Instructor Card */}
                <div
                  onClick={() => handleRoleSelect('Instructor')}
                  style={{
                    padding: '2rem 1.25rem',
                    background: 'var(--bg-secondary)',
                    border: '2px solid var(--border-primary)',
                    borderRadius: '16px',
                    cursor: 'pointer',
                    textAlign: 'center',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.borderColor = '#6c5ce7';
                    e.currentTarget.style.boxShadow = '0 8px 24px rgba(108,92,231,0.15)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.borderColor = 'var(--border-primary)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>👨‍🏫</div>
                  <div style={{ 
                    fontWeight: '700', 
                    color: 'var(--text-primary)',
                    marginBottom: '0.5rem',
                    fontSize: '1.1rem'
                  }}>
                    Instructor
                  </div>
                  <div style={{ 
                    fontSize: '0.85rem', 
                    color: 'var(--text-tertiary)',
                    lineHeight: '1.5'
                  }}>
                    Create and publish courses, teach students worldwide
                  </div>
                </div>
              </div>

              <div style={{ 
                marginTop: '1.5rem', 
                textAlign: 'center',
                fontSize: '0.85rem',
                color: 'var(--text-tertiary)'
              }}>
                Already have an account?{' '}
                <Link to="/login" style={{ color: '#6c5ce7', fontWeight: '500' }}>
                  Sign In
                </Link>
              </div>
            </div>
          )}

          {/* STEP 2: Form */}
          {step === 2 && (
            <form onSubmit={handleSubmit}>
              {/* Back button */}
              <button
                type="button"
                onClick={() => setStep(1)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-tertiary)',
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                  marginBottom: '1rem',
                  padding: 0
                }}
              >
                ← Change role
              </button>

              {generalError && (
                <div style={{
                  padding: '0.75rem',
                  background: 'var(--error-bg)',
                  color: 'var(--error)',
                  borderRadius: '8px',
                  marginBottom: '1rem',
                  textAlign: 'center',
                  fontSize: '0.9rem'
                }}>
                  {generalError}
                </div>
              )}

              {/* Basic info */}
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: '1fr 1fr', 
                gap: '1rem', 
                marginBottom: '1rem' 
              }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: 'var(--text-primary)', fontSize: '0.9rem' }}>
                    First Name
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    placeholder="Alex"
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: `1px solid ${errors.firstName ? 'var(--error)' : 'var(--border-input)'}`,
                      borderRadius: '8px',
                      fontSize: '1rem',
                      color: 'var(--text-primary)',
                      background: 'var(--bg-input)',
                      outline: 'none'
                    }}
                  />
                  {errors.firstName && (
                    <div style={{ color: 'var(--error)', fontSize: '0.8rem', marginTop: '0.25rem' }}>
                      {errors.firstName}
                    </div>
                  )}
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: 'var(--text-primary)', fontSize: '0.9rem' }}>
                    Last Name
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    placeholder="Johnson"
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: `1px solid ${errors.lastName ? 'var(--error)' : 'var(--border-input)'}`,
                      borderRadius: '8px',
                      fontSize: '1rem',
                      color: 'var(--text-primary)',
                      background: 'var(--bg-input)',
                      outline: 'none'
                    }}
                  />
                  {errors.lastName && (
                    <div style={{ color: 'var(--error)', fontSize: '0.8rem', marginTop: '0.25rem' }}>
                      {errors.lastName}
                    </div>
                  )}
                </div>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: 'var(--text-primary)', fontSize: '0.9rem' }}>
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
                    border: `1px solid ${errors.email ? 'var(--error)' : 'var(--border-input)'}`,
                    borderRadius: '8px',
                    fontSize: '1rem',
                    color: 'var(--text-primary)',
                    background: 'var(--bg-input)',
                    outline: 'none'
                  }}
                />
                {errors.email && (
                  <div style={{ color: 'var(--error)', fontSize: '0.8rem', marginTop: '0.25rem' }}>
                    {errors.email}
                  </div>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: 'var(--text-primary)', fontSize: '0.9rem' }}>
                    Password
                  </label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Min. 8 characters"
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: `1px solid ${errors.password ? 'var(--error)' : 'var(--border-input)'}`,
                      borderRadius: '8px',
                      fontSize: '1rem',
                      color: 'var(--text-primary)',
                      background: 'var(--bg-input)',
                      outline: 'none'
                    }}
                  />
                  {errors.password && (
                    <div style={{ color: 'var(--error)', fontSize: '0.8rem', marginTop: '0.25rem' }}>
                      {errors.password}
                    </div>
                  )}
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: 'var(--text-primary)', fontSize: '0.9rem' }}>
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Confirm password"
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: `1px solid ${errors.confirmPassword ? 'var(--error)' : 'var(--border-input)'}`,
                      borderRadius: '8px',
                      fontSize: '1rem',
                      color: 'var(--text-primary)',
                      background: 'var(--bg-input)',
                      outline: 'none'
                    }}
                  />
                  {errors.confirmPassword && (
                    <div style={{ color: 'var(--error)', fontSize: '0.8rem', marginTop: '0.25rem' }}>
                      {errors.confirmPassword}
                    </div>
                  )}
                </div>
              </div>

              {/* INSTRUCTOR-SPECIFIC FIELDS */}
              {formData.role === 'Instructor' && (
                <div style={{
                  padding: '1.5rem',
                  background: 'var(--bg-secondary)',
                  borderRadius: '12px',
                  border: '1px solid var(--border-primary)',
                  marginBottom: '1rem'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    marginBottom: '1.25rem',
                    paddingBottom: '0.75rem',
                    borderBottom: '1px solid var(--border-primary)'
                  }}>
                    <span style={{ fontSize: '1.25rem' }}>📋</span>
                    <h3 style={{
                      color: 'var(--text-primary)',
                      fontSize: '1rem',
                      fontWeight: '600',
                      margin: 0
                    }}>
                      Professional Information
                    </h3>
                  </div>

                  {/* Headline */}
                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: 'var(--text-primary)', fontSize: '0.9rem' }}>
                      Professional Headline *
                    </label>
                    <input
                      type="text"
                      name="headline"
                      value={formData.headline}
                      onChange={handleChange}
                      placeholder="e.g., Senior React Developer & Educator"
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: `1px solid ${errors.headline ? 'var(--error)' : 'var(--border-input)'}`,
                        borderRadius: '8px',
                        fontSize: '1rem',
                        color: 'var(--text-primary)',
                        background: 'var(--bg-input)',
                        outline: 'none'
                      }}
                    />
                    {errors.headline && (
                      <div style={{ color: 'var(--error)', fontSize: '0.8rem', marginTop: '0.25rem' }}>
                        {errors.headline}
                      </div>
                    )}
                  </div>

                  {/* Category + Years */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: 'var(--text-primary)', fontSize: '0.9rem' }}>
                        Teaching Category *
                      </label>
                      <select
                        name="teachingCategory"
                        value={formData.teachingCategory}
                        onChange={handleChange}
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          border: `1px solid ${errors.teachingCategory ? 'var(--error)' : 'var(--border-input)'}`,
                          borderRadius: '8px',
                          fontSize: '1rem',
                          color: 'var(--text-primary)',
                          background: 'var(--bg-input)',
                          outline: 'none',
                          cursor: 'pointer'
                        }}
                      >
                        <option value="">Select a category</option>
                        {CATEGORIES.map(cat => (
                          <option key={cat} value={cat} style={{ color: '#1a1a2e', background: '#ffffff' }}>
                            {cat}
                          </option>
                        ))}
                      </select>
                      {errors.teachingCategory && (
                        <div style={{ color: 'var(--error)', fontSize: '0.8rem', marginTop: '0.25rem' }}>
                          {errors.teachingCategory}
                        </div>
                      )}
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: 'var(--text-primary)', fontSize: '0.9rem' }}>
                        Years of Experience
                      </label>
                      <input
                        type="number"
                        name="yearsExperience"
                        value={formData.yearsExperience}
                        onChange={handleChange}
                        min="0"
                        max="50"
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          border: '1px solid var(--border-input)',
                          borderRadius: '8px',
                          fontSize: '1rem',
                          color: 'var(--text-primary)',
                          background: 'var(--bg-input)',
                          outline: 'none'
                        }}
                      />
                    </div>
                  </div>

                  {/* Expertise */}
                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: 'var(--text-primary)', fontSize: '0.9rem' }}>
                      Areas of Expertise *
                    </label>
                    <input
                      type="text"
                      name="expertise"
                      value={formData.expertise}
                      onChange={handleChange}
                      placeholder="e.g., React, TypeScript, Node.js, MongoDB"
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: `1px solid ${errors.expertise ? 'var(--error)' : 'var(--border-input)'}`,
                        borderRadius: '8px',
                        fontSize: '1rem',
                        color: 'var(--text-primary)',
                        background: 'var(--bg-input)',
                        outline: 'none'
                      }}
                    />
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                      Separate with commas
                    </div>
                    {errors.expertise && (
                      <div style={{ color: 'var(--error)', fontSize: '0.8rem', marginTop: '0.25rem' }}>
                        {errors.expertise}
                      </div>
                    )}
                  </div>

                  {/* Bio */}
                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: 'var(--text-primary)', fontSize: '0.9rem' }}>
                      Detailed Bio *
                    </label>
                    <textarea
                      name="instructorBio"
                      value={formData.instructorBio}
                      onChange={handleChange}
                      rows="4"
                      placeholder="Tell students about your background, teaching style, and what they'll learn from you..."
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: `1px solid ${errors.instructorBio ? 'var(--error)' : 'var(--border-input)'}`,
                        borderRadius: '8px',
                        fontSize: '1rem',
                        color: 'var(--text-primary)',
                        background: 'var(--bg-input)',
                        outline: 'none',
                        fontFamily: 'inherit',
                        resize: 'vertical'
                      }}
                    />
                    {errors.instructorBio && (
                      <div style={{ color: 'var(--error)', fontSize: '0.8rem', marginTop: '0.25rem' }}>
                        {errors.instructorBio}
                      </div>
                    )}
                  </div>

                  {/* Credentials */}
                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: 'var(--text-primary)', fontSize: '0.9rem' }}>
                      Education / Credentials
                    </label>
                    <textarea
                      name="credentials"
                      value={formData.credentials}
                      onChange={handleChange}
                      rows="2"
                      placeholder="e.g., BSc Computer Science, Google Certified Developer"
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid var(--border-input)',
                        borderRadius: '8px',
                        fontSize: '1rem',
                        color: 'var(--text-primary)',
                        background: 'var(--bg-input)',
                        outline: 'none',
                        fontFamily: 'inherit',
                        resize: 'vertical'
                      }}
                    />
                  </div>

                  {/* Links */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: 'var(--text-primary)', fontSize: '0.9rem' }}>
                        Website / Portfolio
                      </label>
                      <input
                        type="url"
                        name="website"
                        value={formData.website}
                        onChange={handleChange}
                        placeholder="https://yoursite.com"
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          border: '1px solid var(--border-input)',
                          borderRadius: '8px',
                          fontSize: '1rem',
                          color: 'var(--text-primary)',
                          background: 'var(--bg-input)',
                          outline: 'none'
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: 'var(--text-primary)', fontSize: '0.9rem' }}>
                        LinkedIn
                      </label>
                      <input
                        type="url"
                        name="linkedin"
                        value={formData.linkedin}
                        onChange={handleChange}
                        placeholder="https://linkedin.com/in/..."
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          border: '1px solid var(--border-input)',
                          borderRadius: '8px',
                          fontSize: '1rem',
                          color: 'var(--text-primary)',
                          background: 'var(--bg-input)',
                          outline: 'none'
                        }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Terms */}
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    name="agreeTerms"
                    checked={formData.agreeTerms}
                    onChange={handleChange}
                    style={{ 
                      marginTop: '0.25rem', 
                      cursor: 'pointer', 
                      accentColor: '#6c5ce7' 
                    }}
                  />
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    I agree to LearnHub's{' '}
                    <Link to="/terms" style={{ color: '#6c5ce7' }}>Terms of Service</Link>{' '}
                    and{' '}
                    <Link to="/privacy" style={{ color: '#6c5ce7' }}>Privacy Policy</Link>
                  </span>
                </label>
                {errors.agreeTerms && (
                  <div style={{ color: 'var(--error)', fontSize: '0.8rem', marginTop: '0.25rem' }}>
                    {errors.agreeTerms}
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '0.85rem',
                  background: loading ? '#a29bfe' : '#6c5ce7',
                  color: 'white',
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: '1rem',
                  fontWeight: '500',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.7 : 1,
                  transition: 'all 0.2s'
                }}
              >
                {loading 
                  ? 'Creating Account...' 
                  : `Create ${formData.role} Account`}
              </button>

              <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
                <p style={{ color: 'var(--text-tertiary)', fontSize: '0.9rem' }}>
                  Already have an account?{' '}
                  <Link to="/login" style={{ color: '#6c5ce7', fontWeight: '500' }}>
                    Sign In
                  </Link>
                </p>
              </div>
            </form>
          )}
        </div>
      </div>
    </>
  );
}

export default Register;