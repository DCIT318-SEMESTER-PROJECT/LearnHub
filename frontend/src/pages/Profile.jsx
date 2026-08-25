import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axiosConfig';

function Profile() {
  const navigate = useNavigate();
  const { user, logout, updateUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    bio: '',
    avatarUrl: ''
  });

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchUserProfile();
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
      setError('');
    } catch (err) {
      console.error('Error fetching profile:', err);
      setError('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const response = await api.put('/auth/profile', formData);
      
      // Update auth context - immediately updates everywhere
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

  return (
    <div className="profile-page" style={{
      maxWidth: '900px',
      margin: '2rem auto',
      padding: '0 2rem'
    }}>
      <div style={{
        background: '#ffffff',
        borderRadius: '16px',
        border: '1px solid #eeecfb',
        padding: '2.5rem',
        boxShadow: '0 4px 24px rgba(0,0,0,0.06)'
      }}>
        {error && (
          <div style={{
            padding: '0.75rem',
            background: '#fef2f2',
            color: '#ef4444',
            borderRadius: '8px',
            marginBottom: '1rem'
          }}>
            {error}
          </div>
        )}

        {/* Profile Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '2rem',
          marginBottom: '2rem',
          flexWrap: 'wrap'
        }}>
          <div style={{
            width: '100px',
            height: '100px',
            borderRadius: '50%',
            background: '#6c5ce7',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '2.5rem',
            fontWeight: 'bold',
            flexShrink: 0
          }}>
            {user.firstName?.[0] || 'U'}{user.lastName?.[0] || ''}
          </div>
          <div>
            <h2 style={{ fontSize: '1.8rem', color: '#1a1a2e', marginBottom: '0.25rem' }}>
              {user.firstName} {user.lastName}
            </h2>
            <p style={{ color: '#666', marginBottom: '0.25rem' }}>{user.email}</p>
            <p style={{ color: '#888', fontSize: '0.9rem' }}>
              Member since {new Date(user.createdAt).toLocaleDateString('en-US', { 
                month: 'long', 
                year: 'numeric' 
              })}
            </p>
            <button
              onClick={() => setIsEditing(!isEditing)}
              style={{
                marginTop: '0.5rem',
                padding: '0.25rem 1rem',
                background: isEditing ? '#ef4444' : '#6c5ce7',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '0.85rem'
              }}
            >
              {isEditing ? 'Cancel Edit' : 'Edit Profile'}
            </button>
          </div>
        </div>

        {/* Edit Form */}
        {isEditing && (
          <form onSubmit={handleUpdateProfile} style={{
            padding: '1.5rem',
            background: '#fafafa',
            borderRadius: '12px',
            border: '1px solid #eeecfb',
            marginBottom: '2rem'
          }}>
            <h3 style={{ marginBottom: '1rem', color: '#1a1a2e' }}>Edit Profile</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.25rem', color: '#666' }}>First Name</label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid #ddd',
                    borderRadius: '6px'
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.25rem', color: '#666' }}>Last Name</label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid #ddd',
                    borderRadius: '6px'
                  }}
                />
              </div>
            </div>
            <div style={{ marginTop: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.25rem', color: '#666' }}>Bio</label>
              <textarea
                name="bio"
                value={formData.bio}
                onChange={handleInputChange}
                rows="3"
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  fontFamily: 'inherit'
                }}
                placeholder="Tell us about yourself..."
              />
            </div>
            <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem' }}>
              <button
                type="submit"
                disabled={loading}
                style={{
                  padding: '0.5rem 2rem',
                  background: loading ? '#a29bfe' : '#6c5ce7',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.7 : 1
                }}
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        )}

        {/* Bio */}
        <div style={{
          padding: '1.5rem',
          background: '#fafafa',
          borderRadius: '12px',
          border: '1px solid #eeecfb',
          marginBottom: '2rem'
        }}>
          <h3 style={{ color: '#1a1a2e', marginBottom: '0.5rem' }}>About</h3>
          <p style={{ color: '#666' }}>
            {user.bio || 'No bio yet. Click "Edit Profile" to add one!'}
          </p>
        </div>

        {/* Stats Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: '1rem',
          marginBottom: '2rem'
        }}>
          <div style={{
            padding: '1.5rem',
            background: '#fafafa',
            borderRadius: '12px',
            border: '1px solid #eeecfb',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '2rem' }}>🔥</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1a1a2e' }}>
              {user.streakDays || 0}
            </div>
            <div style={{ fontSize: '0.85rem', color: '#666' }}>Day Streak</div>
          </div>
          <div style={{
            padding: '1.5rem',
            background: '#fafafa',
            borderRadius: '12px',
            border: '1px solid #eeecfb',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '2rem' }}>⏱️</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1a1a2e' }}>
              {user.totalLearningHours || 0}h
            </div>
            <div style={{ fontSize: '0.85rem', color: '#666' }}>Total Hours</div>
          </div>
          <div style={{
            padding: '1.5rem',
            background: '#fafafa',
            borderRadius: '12px',
            border: '1px solid #eeecfb',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '2rem' }}>🎓</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1a1a2e' }}>
              {user.coursesCompleted || 0}
            </div>
            <div style={{ fontSize: '0.85rem', color: '#666' }}>Courses Completed</div>
          </div>
          <div style={{
            padding: '1.5rem',
            background: '#fafafa',
            borderRadius: '12px',
            border: '1px solid #eeecfb',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '2rem' }}>🏆</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1a1a2e' }}>
              {user.badges?.length || 0}
            </div>
            <div style={{ fontSize: '0.85rem', color: '#666' }}>Badges Earned</div>
          </div>
        </div>

        {/* Badges */}
        {user.badges && user.badges.length > 0 && (
          <div>
            <h3 style={{ color: '#1a1a2e', marginBottom: '1rem' }}>🏅 Achievements</h3>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
              gap: '1rem',
              marginBottom: '2rem'
            }}>
              {user.badges.map((badge, index) => (
                <div key={index} style={{
                  padding: '1rem',
                  textAlign: 'center',
                  background: '#fafafa',
                  borderRadius: '12px',
                  border: '1px solid #eeecfb'
                }}>
                  <div style={{ fontSize: '2.5rem' }}>{badge.icon || '🏅'}</div>
                  <div style={{ fontSize: '0.9rem', color: '#1a1a2e', marginTop: '0.25rem' }}>
                    {badge.name || badge}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Sign Out Button */}
        <div style={{
          marginTop: '2rem',
          paddingTop: '2rem',
          borderTop: '1px solid #eeecfb',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <Link to="/dashboard" style={{ color: '#6c5ce7' }}>← Back to Dashboard</Link>
          <button
            onClick={handleSignOut}
            style={{
              padding: '0.75rem 2rem',
              background: '#ef4444',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '1rem',
              transition: 'background 0.15s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#dc2626'}
            onMouseLeave={(e) => e.currentTarget.style.background = '#ef4444'}
          >
            🚪 Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}

export default Profile;