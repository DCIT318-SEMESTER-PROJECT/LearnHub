import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axiosConfig';
import DeleteAccountModal from '../components/common/DeleteAccountModal';

function Profile() {
  const navigate = useNavigate();
  const { user, logout, updateUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    bio: '',
    avatarUrl: ''
  });
  const [achievements, setAchievements] = useState([]);
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchUserProfile();
    fetchAchievements();
  }, [user]);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      const response = await api.get('/auth/profile');
      const userData = response.data;
      
      setFormData({
        firstName: userData.firstName || '',
        lastName: userData.lastName || '',
        bio: userData.bio || '',
        avatarUrl: userData.avatarUrl || ''
      });
      setAvatarPreview(userData.avatarUrl || null);
      setError('');
    } catch (err) {
      console.error('Error fetching profile:', err);
      setError('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const fetchAchievements = async () => {
    try {
      const response = await api.get('/auth/achievements');
      setAchievements(response.data || []);
    } catch (err) {
      console.error('Error fetching achievements:', err);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      alert('Image must be less than 2MB');
      return;
    }

    setAvatarFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const uploadAvatar = async () => {
    if (!avatarFile) return;

    try {
      setUploadingAvatar(true);
      const reader = new FileReader();
      
      reader.onloadend = async () => {
        try {
          const base64Image = reader.result;
          const response = await api.post('/auth/avatar', { avatarData: base64Image });
          
          updateUser({ avatarUrl: response.data.avatarUrl });
          setAvatarPreview(response.data.avatarUrl);
          setAvatarFile(null);
          alert('Profile picture updated successfully! 🎉');
        } catch (err) {
          console.error('Error uploading avatar:', err);
          alert('Failed to upload profile picture');
        } finally {
          setUploadingAvatar(false);
        }
      };
      
      reader.readAsDataURL(avatarFile);
    } catch (err) {
      console.error('Error:', err);
      setUploadingAvatar(false);
    }
  };

  const removeAvatar = async () => {
    try {
      await api.delete('/auth/avatar');
      setAvatarPreview(null);
      updateUser({ avatarUrl: '' });
      alert('Profile picture removed');
    } catch (err) {
      console.error('Error removing avatar:', err);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await api.put('/auth/profile', formData);
      
      updateUser({
        firstName: formData.firstName,
        lastName: formData.lastName
      });
      
      setIsEditing(false);
      setError('');
      alert('Profile updated successfully!');
    } catch (err) {
      console.error('Error updating profile:', err);
      setError('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = () => {
    logout();
    navigate('/login');
  };

  if (loading && !user) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem' }}>
        <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>👤</div>
        <p>Loading profile...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem' }}>
        <p>Please log in to view your profile.</p>
        <Link to="/login">
          <button style={{
            marginTop: '1rem',
            padding: '0.5rem 2rem',
            background: '#6c5ce7',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer'
          }}>
            Go to Login
          </button>
        </Link>
      </div>
    );
  }

  const statCards = [
    { icon: '🔥', value: `${user.streakDays || 0}`, label: 'Day Streak', iconBg: '#fed7aa' },
    { icon: '⏱️', value: `${user.totalLearningHours || 0}h`, label: 'Total Hours', iconBg: '#bfdbfe' },
    { icon: '🎓', value: `${user.coursesCompleted || 0}`, label: 'Courses Completed', iconBg: '#bbf7d0' },
    { icon: '🏆', value: `${achievements.length}`, label: 'Badges Earned', iconBg: '#e0d9ff' },
  ];

  return (
    <>
      <DeleteAccountModal 
        isOpen={showDeleteModal} 
        onClose={() => setShowDeleteModal(false)} 
      />

      <div className="profile-page" style={{
        maxWidth: '900px',
        margin: '2rem auto',
        padding: '0 clamp(1rem, 3vw, 2rem)',
        width: '100%'
      }}>
        <div style={{
          background: '#ffffff',
          borderRadius: '24px',
          border: '1px solid #eef0f4',
          boxShadow: '0 8px 40px rgba(108,92,231,0.08), 0 2px 8px rgba(0,0,0,0.04)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Decorative gradient header */}
          <div style={{
            position: 'relative',
            height: '150px',
            background: 'linear-gradient(135deg, #6c5ce7 0%, #a29bfe 60%, #cabcff 100%)',
            overflow: 'hidden'
          }}>
            <div style={{
              position: 'absolute',
              top: '-60px',
              right: '-40px',
              width: '220px',
              height: '220px',
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.12)'
            }} />
            <div style={{
              position: 'absolute',
              bottom: '-90px',
              left: '10%',
              width: '180px',
              height: '180px',
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.08)'
            }} />
          </div>

          <div style={{ padding: 'clamp(1.5rem 1.5rem 1.5rem, 1.5rem 3vw 3vw, 2.5rem)', paddingTop: 0 }}>
            {error && (
              <div style={{
                padding: '0.75rem 1rem',
                background: '#fef2f2',
                color: '#ef4444',
                borderRadius: '10px',
                marginTop: '1rem',
                fontSize: '0.9rem'
              }}>
                {error}
              </div>
            )}

            {/* Profile Header */}
            <div style={{
              display: 'flex',
              alignItems: 'flex-end',
              gap: 'clamp(1.25rem, 3vw, 2rem)',
              marginTop: '-55px',
              marginBottom: '1.75rem',
              flexWrap: 'wrap',
              position: 'relative',
              zIndex: 1
            }}>
              {/* Avatar with upload functionality */}
              <div style={{ position: 'relative' }}>
                <div
                  onClick={handleAvatarClick}
                  style={{
                    position: 'relative',
                    width: 'clamp(96px, 14vw, 128px)',
                    height: 'clamp(96px, 14vw, 128px)',
                    borderRadius: '50%',
                    border: '5px solid white',
                    boxShadow: '0 6px 20px rgba(0,0,0,0.15)',
                    background: avatarPreview 
                      ? `url(${avatarPreview}) center/cover no-repeat` 
                      : user.avatarUrl 
                        ? `url(${user.avatarUrl}) center/cover no-repeat`
                        : 'linear-gradient(135deg, #6c5ce7, #5a4bd1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    cursor: 'pointer',
                    transition: 'transform 0.2s, box-shadow 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.02)';
                    e.currentTarget.style.boxShadow = '0 8px 30px rgba(108,92,231,0.3)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.15)';
                  }}
                >
                  {!avatarPreview && !user.avatarUrl && (
                    <span style={{
                      fontSize: 'clamp(2.2rem, 4vw, 3.2rem)',
                      fontWeight: '700',
                      color: 'white',
                      letterSpacing: '0.5px'
                    }}>
                      {user.firstName?.[0] || 'U'}{user.lastName?.[0] || ''}
                    </span>
                  )}
                  
                  {/* Upload overlay */}
                  <div style={{
                    position: 'absolute',
                    bottom: '0',
                    left: '0',
                    right: '0',
                    background: 'rgba(0,0,0,0.5)',
                    color: 'white',
                    fontSize: '0.65rem',
                    padding: '0.3rem 0',
                    textAlign: 'center',
                    borderRadius: '0 0 50% 50%',
                    opacity: 0,
                    transition: 'opacity 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                  onMouseLeave={(e) => e.currentTarget.style.opacity = '0'}
                  >
                    📷 Change
                  </div>
                </div>
                
                {/* Hidden file input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  style={{ display: 'none' }}
                />
                
                {/* Upload/Remove buttons */}
                {avatarFile && (
                  <div style={{
                    position: 'absolute',
                    bottom: '-10px',
                    right: '-10px',
                    display: 'flex',
                    gap: '0.25rem'
                  }}>
                    <button
                      onClick={uploadAvatar}
                      disabled={uploadingAvatar}
                      style={{
                        padding: '0.25rem 0.6rem',
                        background: '#34d399',
                        color: 'white',
                        border: 'none',
                        borderRadius: '20px',
                        fontSize: '0.65rem',
                        cursor: uploadingAvatar ? 'not-allowed' : 'pointer',
                        opacity: uploadingAvatar ? 0.6 : 1
                      }}
                    >
                      {uploadingAvatar ? '⏳' : '✅ Save'}
                    </button>
                    <button
                      onClick={() => {
                        setAvatarFile(null);
                        setAvatarPreview(user.avatarUrl || null);
                      }}
                      style={{
                        padding: '0.25rem 0.6rem',
                        background: '#ef4444',
                        color: 'white',
                        border: 'none',
                        borderRadius: '20px',
                        fontSize: '0.65rem',
                        cursor: 'pointer'
                      }}
                    >
                      ✕
                    </button>
                  </div>
                )}
                
                {user.avatarUrl && !avatarFile && (
                  <button
                    onClick={removeAvatar}
                    style={{
                      position: 'absolute',
                      top: '-4px',
                      right: '-4px',
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      background: '#ef4444',
                      color: 'white',
                      border: '2px solid white',
                      fontSize: '0.6rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                    }}
                  >
                    ✕
                  </button>
                )}
              </div>

              <div style={{ flex: 1, minWidth: '220px', paddingBottom: '4px' }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  flexWrap: 'wrap'
                }}>
                  <h2 style={{
                    fontSize: 'clamp(1.5rem, 2.5vw, 1.9rem)',
                    fontWeight: '700',
                    color: '#1a1a2e',
                    margin: 0
                  }}>
                    {user.firstName} {user.lastName}
                  </h2>
                  <span style={{
                    padding: '0.3rem 0.85rem',
                    background: '#f0eeff',
                    color: '#6c5ce7',
                    borderRadius: '20px',
                    fontSize: '0.78rem',
                    fontWeight: '600'
                  }}>
                    {user.role || 'Student'}
                  </span>
                </div>
                <p style={{ color: '#6b7280', marginTop: '0.35rem', marginBottom: '0.15rem', fontSize: '0.95rem' }}>
                  {user.email}
                </p>
                <p style={{ color: '#9ca3af', fontSize: '0.85rem' }}>
                  Member since {user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { 
                    month: 'long', 
                    year: 'numeric' 
                  }) : 'N/A'}
                </p>
              </div>
            </div>

            {/* Action buttons */}
            <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
              <button
                onClick={() => setIsEditing(!isEditing)}
                style={{
                  padding: '0.55rem 1.3rem',
                  background: isEditing ? '#ef4444' : '#6c5ce7',
                  color: 'white',
                  border: 'none',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  fontSize: '0.88rem',
                  fontWeight: '500',
                  boxShadow: isEditing ? '0 4px 12px rgba(239,68,68,0.25)' : '0 4px 12px rgba(108,92,231,0.25)',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                {isEditing ? 'Cancel Edit' : '✏️ Edit Profile'}
              </button>
              <button
                onClick={() => setShowDeleteModal(true)}
                style={{
                  padding: '0.55rem 1.3rem',
                  background: 'transparent',
                  color: '#ef4444',
                  border: '1.5px solid #fecaca',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  fontSize: '0.88rem',
                  fontWeight: '500',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#fef2f2';
                  e.currentTarget.style.borderColor = '#ef4444';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.borderColor = '#fecaca';
                }}
              >
                🗑️ Delete Account
              </button>
            </div>

            {/* Edit Form */}
            {isEditing && (
              <form onSubmit={handleUpdateProfile} style={{
                padding: 'clamp(1.25rem, 1.5vw, 1.75rem)',
                background: '#fafafa',
                borderRadius: '16px',
                border: '1px solid #e5e7eb',
                marginBottom: '2rem'
              }}>
                <h3 style={{ marginBottom: '1.25rem', color: '#1a1a2e', fontSize: '1.05rem' }}>Edit Profile</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.35rem', color: '#6b7280', fontSize: '0.85rem', fontWeight: '500' }}>First Name</label>
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      style={{
                        width: '100%',
                        padding: '0.6rem 0.75rem',
                        border: '1px solid #d1d5db',
                        borderRadius: '10px',
                        fontSize: '0.95rem',
                        color: '#1a1a2e',
                        outline: 'none',
                        transition: 'border-color 0.2s'
                      }}
                      onFocus={(e) => e.currentTarget.style.borderColor = '#6c5ce7'}
                      onBlur={(e) => e.currentTarget.style.borderColor = '#d1d5db'}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.35rem', color: '#6b7280', fontSize: '0.85rem', fontWeight: '500' }}>Last Name</label>
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      style={{
                        width: '100%',
                        padding: '0.6rem 0.75rem',
                        border: '1px solid #d1d5db',
                        borderRadius: '10px',
                        fontSize: '0.95rem',
                        color: '#1a1a2e',
                        outline: 'none',
                        transition: 'border-color 0.2s'
                      }}
                      onFocus={(e) => e.currentTarget.style.borderColor = '#6c5ce7'}
                      onBlur={(e) => e.currentTarget.style.borderColor = '#d1d5db'}
                    />
                  </div>
                </div>
                <div style={{ marginTop: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.35rem', color: '#6b7280', fontSize: '0.85rem', fontWeight: '500' }}>Bio</label>
                  <textarea
                    name="bio"
                    value={formData.bio}
                    onChange={handleInputChange}
                    rows="3"
                    placeholder="Tell us about yourself..."
                    style={{
                      width: '100%',
                      padding: '0.6rem 0.75rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '10px',
                      fontSize: '0.95rem',
                      fontFamily: 'inherit',
                      color: '#1a1a2e',
                      outline: 'none',
                      resize: 'vertical',
                      transition: 'border-color 0.2s'
                    }}
                    onFocus={(e) => e.currentTarget.style.borderColor = '#6c5ce7'}
                    onBlur={(e) => e.currentTarget.style.borderColor = '#d1d5db'}
                  />
                </div>
                <div style={{ marginTop: '1.25rem', display: 'flex', gap: '1rem' }}>
                  <button
                    type="submit"
                    disabled={loading}
                    style={{
                      padding: '0.6rem 2rem',
                      background: loading ? '#a29bfe' : '#6c5ce7',
                      color: 'white',
                      border: 'none',
                      borderRadius: '10px',
                      cursor: loading ? 'not-allowed' : 'pointer',
                      fontWeight: '500',
                      fontSize: '0.9rem',
                      opacity: loading ? 0.7 : 1,
                      boxShadow: '0 4px 12px rgba(108,92,231,0.25)',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      if (!loading) e.currentTarget.style.background = '#5a4bd1';
                    }}
                    onMouseLeave={(e) => {
                      if (!loading) e.currentTarget.style.background = '#6c5ce7';
                    }}
                  >
                    {loading ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            )}

            {/* Stats Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 160px), 1fr))',
              gap: '1rem',
              marginBottom: '2rem'
            }}>
              {statCards.map((stat, i) => (
                <div key={i} style={{
                  padding: 'clamp(1.1rem, 1.5vw, 1.5rem)',
                  background: '#fff',
                  borderRadius: '16px',
                  border: '1px solid #eef0f4',
                  textAlign: 'center',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.04)',
                  transition: 'transform 0.2s, box-shadow 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-3px)';
                  e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.08)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 2px 10px rgba(0,0,0,0.04)';
                }}
                >
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '14px',
                    background: stat.iconBg,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 0.75rem',
                    fontSize: '1.4rem'
                  }}>
                    {stat.icon}
                  </div>
                  <div style={{ fontSize: 'clamp(1.3rem, 1.6vw, 1.6rem)', fontWeight: '700', color: '#1a1a2e' }}>
                    {stat.value}
                  </div>
                  <div style={{ fontSize: 'clamp(0.75rem, 0.85vw, 0.85rem)', color: '#6b7280', marginTop: '0.15rem' }}>
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>

            {/* Bio */}
            <div style={{
              padding: 'clamp(1.1rem, 1.5vw, 1.5rem)',
              background: '#fafafa',
              borderRadius: '16px',
              border: '1px solid #eef0f4',
              marginBottom: '2rem'
            }}>
              <h3 style={{ color: '#1a1a2e', marginBottom: '0.5rem', fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                📝 About
              </h3>
              <p style={{ color: '#6b7280', lineHeight: '1.65', fontSize: '0.95rem' }}>
                {user.bio || 'No bio yet. Click "Edit Profile" to add one!'}
              </p>
            </div>

            {/* Achievements */}
            {achievements.length > 0 && (
              <div style={{ marginBottom: '2rem' }}>
                <h3 style={{ color: '#1a1a2e', marginBottom: '1rem', fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  🏅 Achievements
                </h3>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 160px), 1fr))',
                  gap: '1rem'
                }}>
                  {achievements.map((badge, index) => (
                    <div key={index} style={{
                      padding: 'clamp(1rem, 1.2vw, 1.25rem)',
                      textAlign: 'center',
                      background: 'linear-gradient(180deg, #fff 0%, #fafafa 100%)',
                      borderRadius: '16px',
                      border: '1px solid #eef0f4',
                      boxShadow: '0 2px 10px rgba(0,0,0,0.04)',
                      transition: 'transform 0.2s, box-shadow 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-4px)';
                      e.currentTarget.style.boxShadow = '0 10px 24px rgba(108,92,231,0.12)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 2px 10px rgba(0,0,0,0.04)';
                    }}
                    >
                      <div style={{ fontSize: 'clamp(2rem, 2.5vw, 2.5rem)' }}>{badge.icon || '🏅'}</div>
                      <div style={{ 
                        fontWeight: '600', 
                        color: '#1a1a2e',
                        marginTop: '0.35rem',
                        fontSize: 'clamp(0.85rem, 0.9vw, 0.9rem)'
                      }}>
                        {badge.name}
                      </div>
                      {badge.description && (
                        <div style={{ 
                          fontSize: 'clamp(0.7rem, 0.75vw, 0.75rem)', 
                          color: '#6b7280',
                          marginTop: '0.3rem',
                          lineHeight: '1.4'
                        }}>
                          {badge.description}
                        </div>
                      )}
                      <div style={{ 
                        fontSize: 'clamp(0.65rem, 0.68vw, 0.68rem)', 
                        color: '#9ca3af',
                        marginTop: '0.35rem'
                      }}>
                        {badge.earnedAt ? `Earned ${new Date(badge.earnedAt).toLocaleDateString()}` : 'Earned recently'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Sign Out & Delete */}
            <div style={{
              paddingTop: '1.75rem',
              borderTop: '1px solid #eef0f4',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '1rem'
            }}>
              <Link to="/dashboard" style={{ 
                color: '#6c5ce7',
                fontWeight: '500',
                fontSize: '0.92rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                ← Back to Dashboard
              </Link>
              <button
                onClick={handleSignOut}
                style={{
                  padding: '0.65rem 2rem',
                  background: '#ef4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  fontSize: '0.95rem',
                  fontWeight: '500',
                  boxShadow: '0 4px 12px rgba(239,68,68,0.25)',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#dc2626';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#ef4444';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                🚪 Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default Profile;