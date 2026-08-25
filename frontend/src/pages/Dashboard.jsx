import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getUserEnrollments } from '../api/coursesAPI';
import { getCurrentUser } from '../api/authAPI';
import api from '../api/axiosConfig';

function Dashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [enrollments, setEnrollments] = useState([]);
  const [userData, setUserData] = useState(null);
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({
    totalEnrollments: 0,
    completedCourses: 0,
    totalLessons: 0,
    completedLessons: 0
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError('');
      
      const currentUser = getCurrentUser();
      if (!currentUser) {
        setError('Please log in to view your dashboard');
        setLoading(false);
        return;
      }

      // Fetch user profile with achievements
      const profileRes = await api.get('/auth/profile');
      setUserData(profileRes.data);
      
      // Fetch achievements
      const achievementsRes = await api.get('/auth/achievements');
      setAchievements(achievementsRes.data || []);
      
      // Fetch enrollments
      const enrollmentsRes = await getUserEnrollments(currentUser.id);
      setEnrollments(enrollmentsRes.data || []);
      
      // Calculate stats
      const totalEnrollments = enrollmentsRes.data?.length || 0;
      const completedCourses = enrollmentsRes.data?.filter(e => e.isCompleted).length || 0;
      
      // Get total lessons completed
      let completedLessons = 0;
      let totalLessons = 0;
      
      // Fetch each course to get lesson counts
      for (const enrollment of (enrollmentsRes.data || [])) {
        try {
          const courseRes = await api.get(`/courses/${enrollment.courseId}`);
          totalLessons += courseRes.data.lessons?.length || 0;
          completedLessons += courseRes.data.lessons?.filter(l => l.isCompleted).length || 0;
        } catch (err) {
          console.warn('Could not fetch course details:', err);
        }
      }
      
      setStats({
        totalEnrollments,
        completedCourses,
        totalLessons,
        completedLessons
      });
      
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
      setError('Could not load your dashboard. Please try refreshing.');
    } finally {
      setLoading(false);
    }
  };

  const enrolledCourses = enrollments.map(enrollment => ({
    id: enrollment.courseId,
    title: enrollment.title || 'Course',
    progress: enrollment.progressPercentage || 0,
    lessons: 25,
    completed: Math.round((enrollment.progressPercentage || 0) / 100 * 25),
    image: enrollment.imageUrl || '📚',
    nextLesson: 'Continue Learning',
    dueDate: 'Ongoing'
  }));

  const getProgressColor = (progress) => {
    if (progress >= 70) return '#34d399';
    if (progress >= 40) return '#fbbf24';
    return '#f87171';
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem' }}>
        <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>📊</div>
        <p>Loading your dashboard...</p>
      </div>
    );
  }

  const displayName = userData?.firstName || 'User';
  const streakDays = userData?.streakDays || 0;
  const totalHours = userData?.totalLearningHours || 0;

  return (
    <div className="dashboard-page" style={{ 
      maxWidth: '1400px', 
      margin: '2rem auto', 
      padding: '0 clamp(1rem, 3vw, 2rem)',
      color: '#1a1a2e',
      width: '100%'
    }}>
      {/* Welcome Section */}
      <div className="dashboard-grid" style={{ 
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))',
        gap: 'clamp(1rem, 2vw, 1.5rem)',
        marginBottom: '2rem'
      }}>
        <div className="welcome-card" style={{
          padding: 'clamp(1rem, 2vw, 2rem)',
          background: '#fafafa',
          borderRadius: '12px',
          border: '1px solid #e5e7eb'
        }}>
          <div className="welcome-section" style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 'clamp(0.75rem, 1.5vw, 1rem)', 
            marginBottom: '0.5rem',
            flexWrap: 'wrap'
          }}>
            <div style={{
              width: 'clamp(44px, 6vw, 56px)',
              height: 'clamp(44px, 6vw, 56px)',
              borderRadius: '50%',
              background: '#6c5ce7',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 'clamp(1.2rem, 2vw, 1.5rem)',
              fontWeight: 'bold',
              flexShrink: 0
            }}>
              {displayName[0] || 'U'}
            </div>
            <div>
              <h2 style={{ 
                fontSize: 'clamp(1.2rem, 2.5vw, 1.5rem)', 
                color: '#1a1a2e', 
                margin: 0 
              }}>
                Welcome back, {displayName}! 👋
              </h2>
              <p style={{ 
                color: '#6b7280', 
                margin: 0,
                fontSize: 'clamp(0.85rem, 1vw, 0.95rem)'
              }}>
                {streakDays > 0 ? `🔥 ${streakDays} day streak!` : 'Start your learning journey today!'}
              </p>
            </div>
          </div>
          
          <div className="user-stats" style={{ 
            display: 'flex', 
            gap: 'clamp(1rem, 2vw, 2rem)', 
            marginTop: '1rem',
            flexWrap: 'wrap'
          }}>
            <div>
              <div style={{ fontSize: 'clamp(0.75rem, 0.8vw, 0.85rem)', color: '#6b7280' }}>Member since</div>
              <div style={{ fontWeight: '600', fontSize: 'clamp(0.85rem, 1vw, 0.95rem)' }}>
                {userData?.createdAt ? new Date(userData.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'N/A'}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 'clamp(0.75rem, 0.8vw, 0.85rem)', color: '#6b7280' }}>Learning streak</div>
              <div style={{ fontWeight: '600', fontSize: 'clamp(0.85rem, 1vw, 0.95rem)' }}>🔥 {streakDays} days</div>
            </div>
            <div>
              <div style={{ fontSize: 'clamp(0.75rem, 0.8vw, 0.85rem)', color: '#6b7280' }}>Total hours</div>
              <div style={{ fontWeight: '600', fontSize: 'clamp(0.85rem, 1vw, 0.95rem)' }}>⏱️ {totalHours}h</div>
            </div>
            <div>
              <div style={{ fontSize: 'clamp(0.75rem, 0.8vw, 0.85rem)', color: '#6b7280' }}>Courses completed</div>
              <div style={{ fontWeight: '600', fontSize: 'clamp(0.85rem, 1vw, 0.95rem)' }}>🎓 {stats.completedCourses}</div>
            </div>
          </div>
        </div>

        <div className="stats-grid" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 120px), 1fr))',
          gap: 'clamp(0.75rem, 1.5vw, 1rem)'
        }}>
          <div className="stat-card" style={{
            padding: 'clamp(1rem, 1.5vw, 1.5rem)',
            background: '#fafafa',
            borderRadius: '12px',
            border: '1px solid #e5e7eb',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: 'clamp(1.5rem, 2.5vw, 2rem)' }}>📊</div>
            <div style={{ 
              fontSize: 'clamp(1.2rem, 2vw, 1.5rem)', 
              fontWeight: 'bold', 
              color: '#1a1a2e' 
            }}>
              {stats.totalEnrollments}
            </div>
            <div style={{ fontSize: 'clamp(0.75rem, 0.8vw, 0.85rem)', color: '#6b7280' }}>Active Courses</div>
          </div>
          <div className="stat-card" style={{
            padding: 'clamp(1rem, 1.5vw, 1.5rem)',
            background: '#fafafa',
            borderRadius: '12px',
            border: '1px solid #e5e7eb',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: 'clamp(1.5rem, 2.5vw, 2rem)' }}>🏆</div>
            <div style={{ 
              fontSize: 'clamp(1.2rem, 2vw, 1.5rem)', 
              fontWeight: 'bold', 
              color: '#1a1a2e' 
            }}>
              {achievements.length}
            </div>
            <div style={{ fontSize: 'clamp(0.75rem, 0.8vw, 0.85rem)', color: '#6b7280' }}>Badges Earned</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs-container" style={{
        display: 'flex',
        gap: 'clamp(0.5rem, 1vw, 1rem)',
        borderBottom: '1px solid #e5e7eb',
        marginBottom: '2rem',
        overflowX: 'auto',
        flexWrap: 'nowrap',
        WebkitOverflowScrolling: 'touch'
      }}>
        {['overview', 'courses', 'activity', 'achievements'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className="tab-button"
            style={{
              padding: 'clamp(0.5rem, 1vw, 0.75rem) clamp(1rem, 1.5vw, 1.5rem)',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === tab ? '2px solid #6c5ce7' : '2px solid transparent',
              color: activeTab === tab ? '#6c5ce7' : '#6b7280',
              cursor: 'pointer',
              fontSize: 'clamp(0.8rem, 1vw, 0.95rem)',
              fontWeight: activeTab === tab ? '600' : '400',
              transition: 'all 0.3s',
              whiteSpace: 'nowrap',
              flexShrink: 0
            }}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Tab Content - Overview */}
      {activeTab === 'overview' && (
        <div className="dashboard-content" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 380px), 1fr))',
          gap: 'clamp(1rem, 2vw, 2rem)'
        }}>
          <div>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: '1.5rem',
              flexWrap: 'wrap',
              gap: '0.5rem'
            }}>
              <h3 style={{ 
                fontSize: 'clamp(1.1rem, 1.5vw, 1.2rem)', 
                color: '#1a1a2e' 
              }}>
                Your Courses
              </h3>
              <Link to="/courses" style={{ color: '#6c5ce7', fontSize: 'clamp(0.85rem, 1vw, 0.9rem)' }}>
                View All →
              </Link>
            </div>
            
            {enrolledCourses.length === 0 ? (
              <div style={{
                padding: 'clamp(1.5rem, 2vw, 2rem)',
                textAlign: 'center',
                background: '#fafafa',
                borderRadius: '12px',
                border: '1px solid #e5e7eb'
              }}>
                <div style={{ fontSize: 'clamp(2.5rem, 4vw, 3rem)', marginBottom: '0.5rem' }}>📖</div>
                <p style={{ color: '#6b7280' }}>You haven't enrolled in any courses yet.</p>
                <Link to="/courses">
                  <button style={{
                    marginTop: '1rem',
                    padding: '0.5rem 2rem',
                    background: '#6c5ce7',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer'
                  }}>
                    Browse Courses
                  </button>
                </Link>
              </div>
            ) : (
              enrolledCourses.map(course => (
                <div key={course.id} className="course-item" style={{
                  padding: 'clamp(1rem, 1.5vw, 1.5rem)',
                  background: '#fafafa',
                  borderRadius: '12px',
                  border: '1px solid #e5e7eb',
                  marginBottom: '1rem'
                }}>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 'clamp(0.75rem, 1.5vw, 1rem)', 
                    flexWrap: 'wrap' 
                  }}>
                    <div style={{ fontSize: 'clamp(1.5rem, 2.5vw, 2rem)', flexShrink: 0 }}>
                      {course.image}
                    </div>
                    <div className="course-info" style={{ flex: 1, minWidth: '150px' }}>
                      <div style={{ 
                        fontWeight: '600', 
                        color: '#1a1a2e',
                        fontSize: 'clamp(0.95rem, 1.2vw, 1.05rem)'
                      }}>
                        {course.title}
                      </div>
                      <div style={{ 
                        fontSize: 'clamp(0.8rem, 0.9vw, 0.85rem)', 
                        color: '#6b7280' 
                      }}>
                        {course.completed} / {course.lessons} lessons completed
                      </div>
                      <div className="course-progress" style={{ marginTop: '0.5rem' }}>
                        <div style={{ 
                          display: 'flex', 
                          justifyContent: 'space-between',
                          fontSize: 'clamp(0.75rem, 0.8vw, 0.8rem)',
                          color: '#6b7280',
                          marginBottom: '0.25rem'
                        }}>
                          <span>Progress</span>
                          <span>{course.progress}%</span>
                        </div>
                        <div style={{ 
                          background: '#e5e7eb', 
                          borderRadius: '4px', 
                          height: '6px'
                        }}>
                          <div style={{ 
                            background: getProgressColor(course.progress), 
                            height: '100%', 
                            borderRadius: '4px',
                            width: `${course.progress}%`,
                            transition: 'width 0.5s ease'
                          }} />
                        </div>
                      </div>
                      <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between',
                        marginTop: '0.5rem',
                        fontSize: 'clamp(0.8rem, 0.9vw, 0.85rem)',
                        flexWrap: 'wrap',
                        gap: '0.5rem'
                      }}>
                        <span style={{ color: '#6b7280' }}>
                          Next: {course.nextLesson}
                        </span>
                        <span style={{ color: '#6c5ce7' }}>
                          Due: {course.dueDate}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div>
            <div style={{
              padding: 'clamp(1rem, 1.5vw, 1.5rem)',
              background: '#fafafa',
              borderRadius: '12px',
              border: '1px solid #e5e7eb',
              marginBottom: '1.5rem'
            }}>
              <h3 style={{ 
                fontSize: 'clamp(1rem, 1.2vw, 1.1rem)', 
                color: '#1a1a2e', 
                marginBottom: '1rem' 
              }}>
                📅 Upcoming Sessions
              </h3>
              <div style={{
                padding: '1rem',
                textAlign: 'center',
                color: '#6b7280',
                fontSize: 'clamp(0.9rem, 1vw, 1rem)'
              }}>
                Check your study groups for upcoming sessions!
              </div>
            </div>

            <div style={{
              padding: 'clamp(1rem, 1.5vw, 1.5rem)',
              background: '#fafafa',
              borderRadius: '12px',
              border: '1px solid #e5e7eb'
            }}>
              <h3 style={{ 
                fontSize: 'clamp(1rem, 1.2vw, 1.1rem)', 
                color: '#1a1a2e', 
                marginBottom: '1rem' 
              }}>
                📝 Quick Stats
              </h3>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '0.75rem'
              }}>
                <div style={{
                  padding: '0.75rem',
                  background: '#f5f5f5',
                  borderRadius: '8px',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#6c5ce7' }}>
                    {stats.totalLessons}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>Total Lessons</div>
                </div>
                <div style={{
                  padding: '0.75rem',
                  background: '#f5f5f5',
                  borderRadius: '8px',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#34d399' }}>
                    {stats.completedLessons}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>Lessons Done</div>
                </div>
                <div style={{
                  padding: '0.75rem',
                  background: '#f5f5f5',
                  borderRadius: '8px',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#fbbf24' }}>
                    {stats.completedCourses}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>Courses Done</div>
                </div>
                <div style={{
                  padding: '0.75rem',
                  background: '#f5f5f5',
                  borderRadius: '8px',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#f87171' }}>
                    {streakDays}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>Day Streak</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab Content - Courses */}
      {activeTab === 'courses' && (
        <div className="courses-grid" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 250px), 1fr))',
          gap: 'clamp(1rem, 1.5vw, 1.5rem)'
        }}>
          {enrolledCourses.length === 0 ? (
            <div style={{
              padding: 'clamp(1.5rem, 2vw, 2rem)',
              textAlign: 'center',
              background: '#fafafa',
              borderRadius: '12px',
              border: '1px solid #e5e7eb',
              gridColumn: '1 / -1'
            }}>
              <div style={{ fontSize: 'clamp(2.5rem, 4vw, 3rem)', marginBottom: '0.5rem' }}>📖</div>
              <p style={{ color: '#6b7280' }}>You haven't enrolled in any courses yet.</p>
              <Link to="/courses">
                <button style={{
                  marginTop: '1rem',
                  padding: '0.5rem 2rem',
                  background: '#6c5ce7',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer'
                }}>
                  Browse Courses
                </button>
              </Link>
            </div>
          ) : (
            enrolledCourses.map(course => (
              <div key={course.id} style={{
                padding: 'clamp(1rem, 1.5vw, 1.5rem)',
                background: '#fafafa',
                borderRadius: '12px',
                border: '1px solid #e5e7eb'
              }}>
                <div style={{ fontSize: 'clamp(2rem, 3vw, 3rem)' }}>{course.image}</div>
                <h3 style={{ 
                  color: '#1a1a2e', 
                  marginTop: '0.5rem', 
                  fontSize: 'clamp(0.95rem, 1.2vw, 1.1rem)',
                  wordBreak: 'break-word'
                }}>
                  {course.title}
                </h3>
                <div style={{ 
                  color: '#6b7280', 
                  fontSize: 'clamp(0.8rem, 0.9vw, 0.85rem)' 
                }}>
                  {course.completed}/{course.lessons} lessons
                </div>
                <div style={{ marginTop: '0.5rem' }}>
                  <div style={{ 
                    background: '#e5e7eb', 
                    borderRadius: '4px', 
                    height: '6px'
                  }}>
                    <div style={{ 
                      background: getProgressColor(course.progress), 
                      height: '100%', 
                      borderRadius: '4px',
                      width: `${course.progress}%`
                    }} />
                  </div>
                </div>
                <Link to={`/courses/${course.id}`}>
                  <button style={{
                    marginTop: '1rem',
                    padding: '0.5rem 1.5rem',
                    background: '#6c5ce7',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    width: '100%',
                    fontSize: 'clamp(0.85rem, 1vw, 0.95rem)'
                  }}>
                    Continue Learning
                  </button>
                </Link>
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab Content - Achievements */}
      {activeTab === 'achievements' && (
        <div>
          <h3 style={{ 
            marginBottom: '1.5rem', 
            color: '#1a1a2e',
            fontSize: 'clamp(1.1rem, 1.5vw, 1.2rem)'
          }}>
            Your Achievements
          </h3>
          <div className="achievements-grid" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 150px), 1fr))',
            gap: 'clamp(1rem, 1.5vw, 1.5rem)'
          }}>
            {achievements.length === 0 ? (
              <div style={{
                padding: 'clamp(1.5rem, 2vw, 2rem)',
                textAlign: 'center',
                background: '#fafafa',
                borderRadius: '12px',
                border: '1px solid #e5e7eb',
                gridColumn: '1 / -1'
              }}>
                <div style={{ fontSize: 'clamp(2.5rem, 4vw, 3rem)', marginBottom: '0.5rem' }}>🏅</div>
                <p style={{ color: '#6b7280' }}>No achievements yet. Start learning to earn badges!</p>
              </div>
            ) : (
              achievements.map((badge, index) => (
                <div key={index} style={{
                  padding: 'clamp(1rem, 1.5vw, 1.5rem)',
                  textAlign: 'center',
                  background: '#fafafa',
                  borderRadius: '12px',
                  border: '1px solid #e5e7eb',
                  transition: 'transform 0.2s'
                }}>
                  <div style={{ fontSize: 'clamp(2rem, 3vw, 3rem)' }}>{badge.icon || '🏅'}</div>
                  <div style={{ 
                    fontWeight: '600', 
                    color: '#1a1a2e',
                    marginTop: '0.5rem',
                    fontSize: 'clamp(0.8rem, 0.9vw, 0.9rem)',
                    wordBreak: 'break-word'
                  }}>
                    {badge.name}
                  </div>
                  {badge.description && (
                    <div style={{ 
                      fontSize: 'clamp(0.7rem, 0.8vw, 0.75rem)', 
                      color: '#6b7280',
                      marginTop: '0.25rem'
                    }}>
                      {badge.description}
                    </div>
                  )}
                  <div style={{ 
                    fontSize: 'clamp(0.65rem, 0.7vw, 0.7rem)', 
                    color: '#9ca3af',
                    marginTop: '0.25rem'
                  }}>
                    {badge.earnedAt ? `Earned ${new Date(badge.earnedAt).toLocaleDateString()}` : 'Earned recently'}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;