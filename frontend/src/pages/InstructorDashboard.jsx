import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axiosConfig';

// ✅ Helper: Check if a string is an image URL or data URI
const isImageUrl = (url) => {
  if (!url || typeof url !== 'string') return false;
  return url.startsWith('data:image') || url.startsWith('http://') || url.startsWith('https://') || url.startsWith('/');
};

function InstructorDashboard() {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalCourses: 0,
    totalStudents: 0,
    totalLessons: 0,
    averageRating: 0
  });

  useEffect(() => {
    fetchMyCourses();
  }, []);

  const fetchMyCourses = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/auth/instructor/${user.id}`);
      const data = response.data;
      
      setCourses(data.courses || []);
      setStats({
        totalCourses: data.stats?.totalCourses || 0,
        totalStudents: data.stats?.totalStudents || 0,
        totalLessons: data.courses?.reduce((sum, c) => sum + (c.totalLessons || 0), 0) || 0,
        averageRating: data.courses?.length 
          ? (data.courses.reduce((sum, c) => sum + (c.rating || 0), 0) / data.courses.length).toFixed(1)
          : 0
      });
    } catch (err) {
      console.error('Error fetching instructor courses:', err);
    } finally {
      setLoading(false);
    }
  };

  const capitalize = (str) => {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  };

  const statCards = [
    { icon: '📚', value: stats.totalCourses, label: 'Total Courses', bg: '#dbeafe' },
    { icon: '👥', value: stats.totalStudents.toLocaleString(), label: 'Total Students', bg: '#dcfce7' },
    { icon: '🎬', value: stats.totalLessons, label: 'Total Lessons', bg: '#fef3c7' },
    { icon: '⭐', value: stats.averageRating, label: 'Avg Rating', bg: '#f0eeff' },
  ];

  return (
    <div style={{
      maxWidth: '1400px',
      margin: '2rem auto',
      padding: '0 clamp(1rem, 3vw, 2rem)',
      width: '100%'
    }}>
      {/* Welcome Header */}
      <div style={{
        padding: 'clamp(1.5rem, 3vw, 2rem)',
        background: 'linear-gradient(135deg, #6c5ce7 0%, #8b7cf0 100%)',
        borderRadius: '20px',
        marginBottom: '2rem',
        color: 'white',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute',
          top: '-60px',
          right: '-40px',
          width: '200px',
          height: '200px',
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.1)'
        }} />
        <div style={{
          position: 'absolute',
          bottom: '-90px',
          left: '5%',
          width: '150px',
          height: '150px',
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.08)'
        }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.2)',
              border: '3px solid rgba(255,255,255,0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.5rem',
              fontWeight: '700',
              overflow: 'hidden',
              flexShrink: 0
            }}>
              {user.avatarUrl ? (
                <img 
                  src={user.avatarUrl} 
                  alt="avatar"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <span>
                  {user.firstName?.[0]}{user.lastName?.[0]}
                </span>
              )}
            </div>
            <div>
              <h1 style={{
                fontSize: 'clamp(1.4rem, 2.5vw, 1.8rem)',
                fontWeight: '700',
                margin: 0
              }}>
                Welcome back, {capitalize(user.firstName)}! 👨‍🏫
              </h1>
              <p style={{
                fontSize: '0.95rem',
                opacity: 0.9,
                margin: '0.25rem 0 0 0'
              }}>
                {user.headline || user.expertise || 'Instructor'} • Ready to teach?
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem', flexWrap: 'wrap' }}>
            <Link
              to="/instructor/create-course"
              style={{
                padding: '0.75rem 1.5rem',
                background: 'white',
                color: '#6c5ce7',
                borderRadius: '10px',
                textDecoration: 'none',
                fontWeight: '600',
                fontSize: '0.95rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
              }}
            >
              ➕ Create New Course
            </Link>
            <Link
              to={`/instructor/${user.id}`}
              style={{
                padding: '0.75rem 1.5rem',
                background: 'rgba(255,255,255,0.15)',
                color: 'white',
                borderRadius: '10px',
                textDecoration: 'none',
                fontWeight: '600',
                fontSize: '0.95rem',
                border: '1px solid rgba(255,255,255,0.3)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              🎬 View Public Profile
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))',
        gap: '1rem',
        marginBottom: '2rem'
      }}>
        {statCards.map((stat, i) => (
          <div key={i} style={{
            padding: '1.5rem',
            background: 'var(--bg-card)',
            borderRadius: '16px',
            border: '1px solid var(--border-primary)',
            boxShadow: 'var(--shadow-sm)',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem'
          }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: stat.bg,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.5rem',
              flexShrink: 0
            }}>
              {stat.icon}
            </div>
            <div>
              <div style={{
                fontSize: '1.5rem',
                fontWeight: '700',
                color: 'var(--text-primary)',
                lineHeight: 1.2
              }}>
                {stat.value}
              </div>
              <div style={{
                fontSize: '0.8rem',
                color: 'var(--text-tertiary)'
              }}>
                {stat.label}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* My Courses Section */}
      <div>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.5rem',
          flexWrap: 'wrap',
          gap: '0.5rem'
        }}>
          <h2 style={{
            fontSize: 'clamp(1.2rem, 2vw, 1.5rem)',
            color: 'var(--text-primary)',
            margin: 0
          }}>
            My Courses
          </h2>
          <Link
            to="/instructor/create-course"
            style={{
              color: '#6c5ce7',
              fontWeight: '500',
              textDecoration: 'none',
              fontSize: '0.9rem'
            }}
          >
            + Add Course
          </Link>
        </div>

        {loading ? (
          <div style={{
            padding: '3rem',
            textAlign: 'center',
            color: 'var(--text-tertiary)'
          }}>
            Loading your courses...
          </div>
        ) : courses.length === 0 ? (
          <div style={{
            padding: 'clamp(2rem, 4vw, 3rem)',
            textAlign: 'center',
            background: 'var(--bg-secondary)',
            borderRadius: '16px',
            border: '2px dashed var(--border-primary)'
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎓</div>
            <h3 style={{
              color: 'var(--text-primary)',
              fontSize: '1.2rem',
              marginBottom: '0.5rem'
            }}>
              You haven't created any courses yet
            </h3>
            <p style={{
              color: 'var(--text-tertiary)',
              marginBottom: '1.5rem',
              fontSize: '0.95rem'
            }}>
              Share your knowledge with thousands of students around the world
            </p>
            <Link
              to="/instructor/create-course"
              style={{
                display: 'inline-block',
                padding: '0.75rem 2rem',
                background: '#6c5ce7',
                color: 'white',
                borderRadius: '10px',
                textDecoration: 'none',
                fontWeight: '600',
                fontSize: '0.95rem',
                boxShadow: '0 4px 12px rgba(108,92,231,0.3)'
              }}
            >
              ➕ Create Your First Course
            </Link>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 320px), 1fr))',
            gap: '1.5rem'
          }}>
            {courses.map(course => (
              <Link
                key={course.id}
                to={`/courses/${course.id}`}
                style={{ textDecoration: 'none' }}
              >
                <div style={{
                  padding: '1.5rem',
                  background: 'var(--bg-card)',
                  borderRadius: '16px',
                  border: '2px solid var(--border-primary)',
                  transition: 'all 0.2s',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.borderColor = '#6c5ce7';
                  e.currentTarget.style.boxShadow = '0 8px 30px rgba(108,92,231,0.15)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.borderColor = 'var(--border-primary)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
                >
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    marginBottom: '0.75rem'
                  }}>
                    {/* ✅ FIXED: Image or emoji */}
                    {isImageUrl(course.imageUrl) ? (
                      <img 
                        src={course.imageUrl} 
                        alt={course.title}
                        style={{
                          width: '48px',
                          height: '48px',
                          objectFit: 'cover',
                          borderRadius: '10px',
                          flexShrink: 0
                        }}
                      />
                    ) : (
                      <span style={{ fontSize: '2rem' }}>{course.imageUrl || '📚'}</span>
                    )}
                    
                    <span style={{
                      padding: '0.25rem 0.75rem',
                      background: '#f0eeff',
                      color: '#6c5ce7',
                      borderRadius: '20px',
                      fontSize: '0.75rem',
                      fontWeight: '600'
                    }}>
                      {course.difficultyLevel || 'Beginner'}
                    </span>

                    {course.isPublished ? (
                      <span style={{
                        padding: '0.25rem 0.75rem',
                        background: '#dcfce7',
                        color: '#166534',
                        borderRadius: '20px',
                        fontSize: '0.7rem',
                        fontWeight: '600',
                        marginLeft: 'auto'
                      }}>
                        Published
                      </span>
                    ) : (
                      <span style={{
                        padding: '0.25rem 0.75rem',
                        background: '#fef3c7',
                        color: '#92400e',
                        borderRadius: '20px',
                        fontSize: '0.7rem',
                        fontWeight: '600',
                        marginLeft: 'auto'
                      }}>
                        Draft
                      </span>
                    )}
                  </div>

                  <h3 style={{
                    fontSize: '1.05rem',
                    color: 'var(--text-primary)',
                    marginBottom: '0.5rem',
                    fontWeight: '600'
                  }}>
                    {course.title}
                  </h3>

                  <p style={{
                    color: 'var(--text-secondary)',
                    fontSize: '0.9rem',
                    flex: 1,
                    marginBottom: '0.75rem',
                    lineHeight: '1.5'
                  }}>
                    {course.description?.substring(0, 100)}...
                  </p>

                  <div style={{
                    display: 'flex',
                    gap: '1rem',
                    fontSize: '0.85rem',
                    color: 'var(--text-tertiary)',
                    paddingTop: '0.75rem',
                    borderTop: '1px solid var(--border-primary)'
                  }}>
                    <span>📚 {course.totalLessons || 0}</span>
                    <span>👥 {course.students || 0}</span>
                    <span>⭐ {course.rating || 0}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default InstructorDashboard;