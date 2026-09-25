import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api from '../api/axiosConfig';
import DeleteAccountModal from '../components/common/DeleteAccountModal';

function Profile() {
  const navigate = useNavigate();
  const { user, logout, updateUser } = useAuth();
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [tab, setTab] = useState('overview'); // 'overview' | 'achievements' | 'settings'

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    bio: '',
    avatarUrl: '',
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
        avatarUrl: userData.avatarUrl || '',
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
    setFormData((p) => ({ ...p, [name]: value }));
  };

  const handleAvatarClick = () => fileInputRef.current?.click();

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image must be less than 2MB');
      return;
    }

    setAvatarFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setAvatarPreview(reader.result);
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
          toast.success('Profile picture updated! 🎉');
        } catch (err) {
          console.error('Error uploading avatar:', err);
          toast.error('Failed to upload profile picture');
        } finally {
          setUploadingAvatar(false);
        }
      };
      reader.readAsDataURL(avatarFile);
    } catch (err) {
      console.error('Error:', err);
      setUploadingAvatar(false);
      toast.error('Failed to upload avatar');
    }
  };

  const removeAvatar = async () => {
    try {
      await api.delete('/auth/avatar');
      setAvatarPreview(null);
      updateUser({ avatarUrl: '' });
      toast.success('Profile picture removed');
    } catch (err) {
      console.error('Error removing avatar:', err);
      toast.error('Failed to remove profile picture');
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await api.put('/auth/profile', formData);
      updateUser({
        firstName: formData.firstName,
        lastName: formData.lastName,
      });
      setIsEditing(false);
      setError('');
      toast.success('Profile updated successfully!');
    } catch (err) {
      console.error('Error updating profile:', err);
      setError('Failed to update profile');
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = () => {
    logout();
    toast.info('Signed out successfully');
    navigate('/login');
  };

  if (loading && !user) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem' }}>
        <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>👤</div>
        <p style={{ color: 'var(--text-secondary)' }}>Loading profile...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem' }}>
        <p style={{ color: 'var(--text-secondary)' }}>Please log in to view your profile.</p>
        <Link to="/login">
          <button
            style={{
              marginTop: '1rem',
              padding: '0.5rem 2rem',
              background: '#6c5ce7',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
            }}
          >
            Go to Login
          </button>
        </Link>
      </div>
    );
  }

  const initials = `${user.firstName?.[0] || 'U'}${user.lastName?.[0] || ''}`.toUpperCase();
  const memberSince = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : 'N/A';
  const isInstructor = user.role === 'Instructor' || user.isInstructor;

  const statCards = [
    { icon: '🔥', value: user.streakDays || 0, label: 'Day Streak', bg: '#fed7aa' },
    { icon: '⏱️', value: `${(user.totalLearningHours || 0).toFixed(1)}h`, label: 'Learning Hours', bg: '#bfdbfe' },
    { icon: '🎓', value: user.coursesCompleted || 0, label: 'Completed', bg: '#bbf7d0' },
    { icon: '🏆', value: achievements.length, label: 'Badges', bg: '#e0d9ff' },
  ];

  const tabs = [
    { id: 'overview', label: 'Overview', icon: '🏠' },
    { id: 'achievements', label: 'Achievements', icon: '🏆' },
    { id: 'settings', label: 'Settings', icon: '⚙️' },
  ];

  return (
    <>
      <DeleteAccountModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
      />

      <div
        style={{
          maxWidth: '960px',
          margin: '2rem auto',
          padding: '0 clamp(1rem, 3vw, 2rem)',
          width: '100%',
        }}
      >
        {/* ═════════════ HERO CARD ═════════════ */}
        <div
          style={{
            background: 'var(--bg-card)',
            borderRadius: '24px',
            border: '1px solid var(--border-primary)',
            boxShadow: 'var(--shadow-card, 0 8px 40px rgba(108,92,231,0.08))',
            overflow: 'hidden',
            marginBottom: '1.5rem',
          }}
        >
          {/* Banner */}
          <div
            style={{
              position: 'relative',
              height: '160px',
              background:
                'linear-gradient(135deg, #6c5ce7 0%, #8b7cf0 55%, #a29bfe 100%)',
              overflow: 'hidden',
            }}
          >
            <div style={{ position: 'absolute', top: '-70px', right: '-30px', width: '240px', height: '240px', borderRadius: '50%', background: 'rgba(255,255,255,0.10)' }} />
            <div style={{ position: 'absolute', bottom: '-100px', left: '8%', width: '200px', height: '200px', borderRadius: '50%', background: 'rgba(255,255,255,0.07)' }} />
            <div style={{ position: 'absolute', top: '30px', right: '25%', width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }} />
          </div>

          <div style={{ padding: '0 clamp(1.25rem, 3vw, 2rem) 1.5rem' }}>
            {/* Avatar + name row */}
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-end',
                gap: 'clamp(1rem, 3vw, 1.75rem)',
                marginTop: '-58px',
                marginBottom: '1.25rem',
                flexWrap: 'wrap',
                position: 'relative',
                zIndex: 1,
              }}
            >
              {/* Avatar */}
              <div style={{ position: 'relative' }}>
                <div
                  onClick={handleAvatarClick}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleAvatarClick(); }}
                  style={{
                    position: 'relative',
                    width: 'clamp(100px, 14vw, 132px)',
                    height: 'clamp(100px, 14vw, 132px)',
                    borderRadius: '50%',
                    border: '5px solid var(--bg-card)',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
                    background:
                      (avatarPreview || user.avatarUrl)
                        ? `url(${avatarPreview || user.avatarUrl}) center/cover no-repeat`
                        : 'linear-gradient(135deg, #6c5ce7, #5a4bd1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    cursor: 'pointer',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.03)';
                    e.currentTarget.style.boxShadow = '0 12px 32px rgba(108,92,231,0.35)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.18)';
                  }}
                >
                  {!avatarPreview && !user.avatarUrl && (
                    <span
                      style={{
                        fontSize: 'clamp(2.2rem, 4vw, 3.2rem)',
                        fontWeight: 700,
                        color: 'white',
                        letterSpacing: '0.5px',
                      }}
                    >
                      {initials}
                    </span>
                  )}

                  {/* Hover overlay */}
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      borderRadius: '50%',
                      background: 'rgba(0,0,0,0.45)',
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.7rem',
                      fontWeight: 600,
                      opacity: 0,
                      transition: 'opacity 0.2s',
                      pointerEvents: 'none',
                    }}
                    className="avatar-overlay"
                  >
                    📷 Change
                  </div>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  style={{ display: 'none' }}
                />

                {/* Save/Cancel buttons while a file is selected */}
                {avatarFile && (
                  <div
                    style={{
                      position: 'absolute',
                      bottom: '-12px',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      display: 'flex',
                      gap: '0.35rem',
                      background: 'var(--bg-card)',
                      padding: '0.3rem',
                      borderRadius: '20px',
                      border: '1px solid var(--border-primary)',
                      boxShadow: '0 4px 14px rgba(0,0,0,0.12)',
                    }}
                  >
                    <button
                      onClick={uploadAvatar}
                      disabled={uploadingAvatar}
                      style={{
                        padding: '0.3rem 0.75rem',
                        background: '#34d399',
                        color: 'white',
                        border: 'none',
                        borderRadius: '14px',
                        fontSize: '0.7rem',
                        fontWeight: 600,
                        cursor: uploadingAvatar ? 'not-allowed' : 'pointer',
                        opacity: uploadingAvatar ? 0.6 : 1,
                      }}
                    >
                      {uploadingAvatar ? '⏳ Saving' : '✅ Save'}
                    </button>
                    <button
                      onClick={() => {
                        setAvatarFile(null);
                        setAvatarPreview(user.avatarUrl || null);
                      }}
                      style={{
                        padding: '0.3rem 0.75rem',
                        background: '#ef4444',
                        color: 'white',
                        border: 'none',
                        borderRadius: '14px',
                        fontSize: '0.7rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      ✕ Cancel
                    </button>
                  </div>
                )}

                {/* Remove avatar X */}
                {user.avatarUrl && !avatarFile && (
                  <button
                    onClick={removeAvatar}
                    title="Remove avatar"
                    style={{
                      position: 'absolute',
                      top: '-2px',
                      right: '-2px',
                      width: '26px',
                      height: '26px',
                      borderRadius: '50%',
                      background: '#ef4444',
                      color: 'white',
                      border: '2px solid var(--bg-card)',
                      fontSize: '0.65rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 3px 10px rgba(0,0,0,0.2)',
                    }}
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Name + meta */}
              <div style={{ flex: 1, minWidth: '220px', paddingBottom: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
                  <h1
                    style={{
                      fontSize: 'clamp(1.5rem, 2.6vw, 2rem)',
                      fontWeight: 700,
                      color: 'var(--text-primary)',
                      margin: 0,
                    }}
                  >
                    {user.firstName} {user.lastName}
                  </h1>
                  <span
                    style={{
                      padding: '0.3rem 0.85rem',
                      background: isInstructor ? '#fef3c7' : '#f0eeff',
                      color: isInstructor ? '#92400e' : '#6c5ce7',
                      borderRadius: '20px',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                    }}
                  >
                    {isInstructor ? '👨‍🏫 Instructor' : '🎓 Student'}
                  </span>
                </div>
                <p style={{ color: 'var(--text-secondary)', margin: '0.4rem 0 0.15rem', fontSize: '0.95rem' }}>
                  {user.email}
                </p>
                <p style={{ color: 'var(--text-tertiary)', fontSize: '0.82rem', margin: 0 }}>
                  📅 Member since {memberSince}
                </p>
              </div>
            </div>

            {/* Action buttons */}
            <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap' }}>
              <button
                onClick={() => {
                  setIsEditing((v) => !v);
                  setTab('settings');
                }}
                style={{
                  padding: '0.6rem 1.35rem',
                  background: isEditing ? '#ef4444' : '#6c5ce7',
                  color: 'white',
                  border: 'none',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  fontSize: '0.88rem',
                  fontWeight: 600,
                  boxShadow: isEditing
                    ? '0 4px 12px rgba(239,68,68,0.28)'
                    : '0 4px 12px rgba(108,92,231,0.28)',
                  transition: 'all 0.2s',
                }}
              >
                {isEditing ? '✕ Cancel Edit' : '✏️ Edit Profile'}
              </button>
              <button
                onClick={handleSignOut}
                style={{
                  padding: '0.6rem 1.35rem',
                  background: 'transparent',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border-primary)',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  fontSize: '0.88rem',
                  fontWeight: 500,
                }}
              >
                🚪 Sign Out
              </button>
            </div>
          </div>
        </div>

        {/* ═════════════ STATS ROW ═════════════ */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 170px), 1fr))',
            gap: '1rem',
            marginBottom: '1.5rem',
          }}
        >
          {statCards.map((stat, i) => (
            <div
              key={i}
              style={{
                padding: '1.25rem',
                background: 'var(--bg-card)',
                borderRadius: '16px',
                border: '1px solid var(--border-primary)',
                boxShadow: 'var(--shadow-sm)',
                textAlign: 'center',
                transition: 'transform 0.2s, box-shadow 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-3px)';
                e.currentTarget.style.boxShadow = 'var(--shadow-md, 0 8px 20px rgba(0,0,0,0.1))';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
              }}
            >
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '14px',
                  background: stat.bg,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 0.65rem',
                  fontSize: '1.4rem',
                }}
              >
                {stat.icon}
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.1 }}>
                {stat.value}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', marginTop: '0.2rem' }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        {/* ═════════════ TABS ═════════════ */}
        <div
          style={{
            display: 'flex',
            gap: '0.25rem',
            marginBottom: '1.25rem',
            background: 'var(--bg-secondary)',
            padding: '0.35rem',
            borderRadius: '14px',
            border: '1px solid var(--border-primary)',
            overflowX: 'auto',
          }}
        >
          {tabs.map((t) => {
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                style={{
                  flex: 1,
                  minWidth: '120px',
                  padding: '0.65rem 1rem',
                  background: active ? 'var(--bg-card)' : 'transparent',
                  color: active ? '#6c5ce7' : 'var(--text-secondary)',
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: '0.9rem',
                  fontWeight: active ? 700 : 500,
                  cursor: 'pointer',
                  boxShadow: active ? '0 2px 8px rgba(0,0,0,0.06)' : 'none',
                  transition: 'all 0.15s',
                  whiteSpace: 'nowrap',
                }}
              >
                {t.icon} {t.label}
              </button>
            );
          })}
        </div>

        {/* ═════════════ TAB CONTENT ═════════════ */}

        {/* OVERVIEW */}
        {tab === 'overview' && (
          <div>
            <div
              style={{
                padding: '1.5rem',
                background: 'var(--bg-card)',
                borderRadius: '16px',
                border: '1px solid var(--border-primary)',
                marginBottom: '1.25rem',
              }}
            >
              <h3 style={{ color: 'var(--text-primary)', marginBottom: '0.6rem', fontSize: '1.05rem', fontWeight: 700 }}>
                📝 About
              </h3>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.65, fontSize: '0.95rem', margin: 0 }}>
                {user.bio || 'No bio yet — head to the Settings tab to add one.'}
              </p>
            </div>

            <div
              style={{
                padding: '1.5rem',
                background: 'var(--bg-card)',
                borderRadius: '16px',
                border: '1px solid var(--border-primary)',
              }}
            >
              <h3 style={{ color: 'var(--text-primary)', marginBottom: '0.75rem', fontSize: '1.05rem', fontWeight: 700 }}>
                🚀 Quick Actions
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))', gap: '0.75rem' }}>
                <Link to="/dashboard" style={{ textDecoration: 'none' }}>
                  <div style={{ padding: '1rem', background: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid var(--border-primary)', textAlign: 'center', transition: 'all 0.15s', cursor: 'pointer' }}>
                    <div style={{ fontSize: '1.6rem', marginBottom: '0.35rem' }}>📊</div>
                    <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)' }}>Dashboard</div>
                  </div>
                </Link>
                <Link to="/courses" style={{ textDecoration: 'none' }}>
                  <div style={{ padding: '1rem', background: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid var(--border-primary)', textAlign: 'center', cursor: 'pointer' }}>
                    <div style={{ fontSize: '1.6rem', marginBottom: '0.35rem' }}>📚</div>
                    <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)' }}>Browse Courses</div>
                  </div>
                </Link>
                {!isInstructor && (
                  <Link to="/study-groups" style={{ textDecoration: 'none' }}>
                    <div style={{ padding: '1rem', background: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid var(--border-primary)', textAlign: 'center', cursor: 'pointer' }}>
                      <div style={{ fontSize: '1.6rem', marginBottom: '0.35rem' }}>👥</div>
                      <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)' }}>Study Groups</div>
                    </div>
                  </Link>
                )}
                {isInstructor && (
                  <Link to="/instructor/create-course" style={{ textDecoration: 'none' }}>
                    <div style={{ padding: '1rem', background: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid var(--border-primary)', textAlign: 'center', cursor: 'pointer' }}>
                      <div style={{ fontSize: '1.6rem', marginBottom: '0.35rem' }}>➕</div>
                      <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)' }}>Create Course</div>
                    </div>
                  </Link>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ACHIEVEMENTS */}
        {tab === 'achievements' && (
          <div
            style={{
              padding: '1.5rem',
              background: 'var(--bg-card)',
              borderRadius: '16px',
              border: '1px solid var(--border-primary)',
            }}
          >
            {achievements.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2.5rem 1rem' }}>
                <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>🏅</div>
                <h3 style={{ color: 'var(--text-primary)', marginBottom: '0.35rem' }}>No badges yet</h3>
                <p style={{ color: 'var(--text-tertiary)', margin: 0, fontSize: '0.9rem' }}>
                  Complete lessons, keep your streak alive, and finish courses to earn badges.
                </p>
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <h3 style={{ color: 'var(--text-primary)', margin: 0, fontSize: '1.05rem', fontWeight: 700 }}>
                    Your Badges
                  </h3>
                  <span style={{ color: 'var(--text-tertiary)', fontSize: '0.85rem' }}>
                    {achievements.length} earned
                  </span>
                </div>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 170px), 1fr))',
                    gap: '1rem',
                  }}
                >
                  {achievements.map((badge, index) => (
                    <div
                      key={index}
                      style={{
                        padding: '1.25rem 1rem',
                        textAlign: 'center',
                        background: 'var(--bg-secondary)',
                        borderRadius: '16px',
                        border: '1px solid var(--border-primary)',
                        transition: 'transform 0.2s, box-shadow 0.2s',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-3px)';
                        e.currentTarget.style.boxShadow = '0 8px 20px rgba(108,92,231,0.15)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    >
                      <div style={{ fontSize: '2.5rem', marginBottom: '0.35rem' }}>{badge.icon || '🏅'}</div>
                      <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.9rem' }}>
                        {badge.name}
                      </div>
                      {badge.description && (
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)', marginTop: '0.3rem', lineHeight: 1.4 }}>
                          {badge.description}
                        </div>
                      )}
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                        {badge.earnedAt ? `Earned ${new Date(badge.earnedAt).toLocaleDateString()}` : 'Earned recently'}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* SETTINGS */}
        {tab === 'settings' && (
          <div>
            {/* Edit form */}
            {isEditing && (
              <form
                onSubmit={handleUpdateProfile}
                style={{
                  padding: 'clamp(1.25rem, 2vw, 1.75rem)',
                  background: 'var(--bg-card)',
                  borderRadius: '16px',
                  border: '1px solid var(--border-primary)',
                  marginBottom: '1.25rem',
                }}
              >
                <h3 style={{ marginBottom: '1.25rem', color: 'var(--text-primary)', fontSize: '1.05rem', fontWeight: 700 }}>
                  Edit Profile
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.35rem', color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 500 }}>
                      First Name
                    </label>
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      style={{
                        width: '100%',
                        padding: '0.65rem 0.85rem',
                        border: '1px solid var(--border-input, var(--border-primary))',
                        borderRadius: '10px',
                        fontSize: '0.95rem',
                        color: 'var(--text-primary)',
                        background: 'var(--bg-input, var(--bg-secondary))',
                        outline: 'none',
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.35rem', color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 500 }}>
                      Last Name
                    </label>
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      style={{
                        width: '100%',
                        padding: '0.65rem 0.85rem',
                        border: '1px solid var(--border-input, var(--border-primary))',
                        borderRadius: '10px',
                        fontSize: '0.95rem',
                        color: 'var(--text-primary)',
                        background: 'var(--bg-input, var(--bg-secondary))',
                        outline: 'none',
                      }}
                    />
                  </div>
                </div>
                <div style={{ marginTop: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.35rem', color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 500 }}>
                    Bio
                  </label>
                  <textarea
                    name="bio"
                    value={formData.bio}
                    onChange={handleInputChange}
                    rows="3"
                    placeholder="Tell us about yourself..."
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.85rem',
                      border: '1px solid var(--border-input, var(--border-primary))',
                      borderRadius: '10px',
                      fontSize: '0.95rem',
                      fontFamily: 'inherit',
                      color: 'var(--text-primary)',
                      background: 'var(--bg-input, var(--bg-secondary))',
                      outline: 'none',
                      resize: 'vertical',
                    }}
                  />
                </div>
                <div style={{ marginTop: '1.25rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                  <button
                    type="submit"
                    disabled={loading}
                    style={{
                      padding: '0.65rem 1.75rem',
                      background: loading ? '#a29bfe' : '#6c5ce7',
                      color: 'white',
                      border: 'none',
                      borderRadius: '10px',
                      cursor: loading ? 'not-allowed' : 'pointer',
                      fontWeight: 600,
                      fontSize: '0.9rem',
                      opacity: loading ? 0.7 : 1,
                      boxShadow: '0 4px 12px rgba(108,92,231,0.28)',
                    }}
                  >
                    {loading ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    style={{
                      padding: '0.65rem 1.25rem',
                      background: 'transparent',
                      color: 'var(--text-secondary)',
                      border: '1px solid var(--border-primary)',
                      borderRadius: '10px',
                      cursor: 'pointer',
                      fontSize: '0.9rem',
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}

            {!isEditing && (
              <div
                style={{
                  padding: '1.5rem',
                  background: 'var(--bg-card)',
                  borderRadius: '16px',
                  border: '1px solid var(--border-primary)',
                  marginBottom: '1.25rem',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>✏️</div>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem', fontSize: '0.92rem' }}>
                  Want to update your name or bio?
                </p>
                <button
                  onClick={() => setIsEditing(true)}
                  style={{
                    padding: '0.6rem 1.5rem',
                    background: '#6c5ce7',
                    color: 'white',
                    border: 'none',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    fontWeight: 600,
                    fontSize: '0.88rem',
                  }}
                >
                  Edit Profile Info
                </button>
              </div>
            )}

            {/* Danger zone */}
            <div
              style={{
                padding: '1.5rem',
                background: 'var(--bg-card)',
                borderRadius: '16px',
                border: '1px solid #fecaca',
              }}
            >
              <h3 style={{ color: '#dc2626', marginBottom: '0.5rem', fontSize: '1rem', fontWeight: 700 }}>
                ⚠️ Danger Zone
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1rem', lineHeight: 1.5 }}>
                Deleting your account permanently removes all your courses, progress, and data. This cannot be undone.
              </p>
              <button
                onClick={() => setShowDeleteModal(true)}
                style={{
                  padding: '0.65rem 1.35rem',
                  background: 'transparent',
                  color: '#ef4444',
                  border: '1.5px solid #ef4444',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  fontSize: '0.88rem',
                  fontWeight: 600,
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#ef4444';
                  e.currentTarget.style.color = 'white';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = '#ef4444';
                }}
              >
                🗑️ Delete My Account
              </button>
            </div>
          </div>
        )}

        {/* Footer nav */}
        <div
          style={{
            marginTop: '2rem',
            paddingTop: '1.5rem',
            borderTop: '1px solid var(--border-primary)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem',
          }}
        >
          <Link
            to="/dashboard"
            style={{ color: '#6c5ce7', fontWeight: 500, fontSize: '0.92rem', textDecoration: 'none' }}
          >
            ← Back to Dashboard
          </Link>
        </div>
      </div>
    </>
  );
}

export default Profile;