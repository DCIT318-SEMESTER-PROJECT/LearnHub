import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getCourses } from '../api/coursesAPI';

function Courses() {
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setLoading(true);
        const response = await getCourses();
        setCourses(response.data);
        setError('');
      } catch (err) {
        console.error('Failed to fetch courses:', err);
        setError('Failed to load courses. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    fetchCourses();
  }, []);

  const categories = ['All', ...new Set(courses.map(c => c.category?.trim()).filter(Boolean))];

  const filteredCourses = courses.filter(course => {
    const matchesCategory = filter === 'all' || 
      (course.category && course.category.toLowerCase() === filter.toLowerCase());
    const matchesSearch = searchTerm === '' || 
      (course.title && course.title.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (course.description && course.description.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const getLevelColor = (level) => {
    if (!level) return '#666';
    switch(level.toLowerCase()) {
      case 'beginner': return '#34d399';
      case 'intermediate': return '#fbbf24';
      case 'advanced': return '#f87171';
      default: return '#666';
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem' }}>
        <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>📚</div>
        <p>Loading courses...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem' }}>
        <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⚠️</div>
        <p style={{ color: '#ef4444' }}>{error}</p>
        <button
          onClick={() => window.location.reload()}
          style={{
            marginTop: '1rem',
            padding: '0.5rem 2rem',
            background: '#6c5ce7',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer'
          }}
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="courses-page" style={{ 
      maxWidth: '1400px', 
      margin: '2rem auto', 
      padding: '0 2rem',
      width: '100%'
    }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ 
          fontSize: 'clamp(1.5rem, 4vw, 2rem)', 
          color: '#1a1a2e' 
        }}>
          Explore Courses
        </h2>
        <p style={{ color: '#666' }}>Discover {courses.length}+ courses across all topics</p>
      </div>

      {/* Search and Filters */}
      <div style={{ 
        display: 'flex', 
        gap: '1rem', 
        flexWrap: 'wrap',
        marginBottom: '2rem',
        padding: 'clamp(1rem, 2vw, 1.5rem)',
        background: '#fafafa',
        borderRadius: '12px',
        border: '1px solid #e5e7eb'
      }}>
        <input
          type="text"
          placeholder="Search courses..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            flex: '1',
            minWidth: '150px',
            padding: '0.75rem',
            border: '1px solid #d1d5db',
            borderRadius: '8px',
            fontSize: '1rem',
            color: '#1a1a2e',
            background: '#ffffff'
          }}
        />
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          style={{
            padding: '0.75rem',
            border: '1px solid #d1d5db',
            borderRadius: '8px',
            fontSize: '1rem',
            background: '#ffffff',
            color: '#1a1a2e',
            minWidth: '150px',
            cursor: 'pointer',
            flex: '0 1 auto'
          }}
        >
          {categories.map(cat => (
            <option key={cat} value={cat.toLowerCase()} style={{ color: '#1a1a2e' }}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      {/* Course Grid - Responsive */}
      {filteredCourses.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔍</div>
          <h3>No courses found</h3>
          <p style={{ color: '#666' }}>Try adjusting your search or filters</p>
          <button
            onClick={() => {
              setFilter('all');
              setSearchTerm('');
            }}
            style={{
              marginTop: '1rem',
              padding: '0.5rem 2rem',
              background: '#6c5ce7',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer'
            }}
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 320px), 1fr))',
          gap: '1.5rem',
          width: '100%'
        }}>
          {filteredCourses.map(course => (
            <Link 
              key={course.id} 
              to={`/courses/${course.id}`}
              style={{ textDecoration: 'none' }}
            >
              <div style={{
                padding: 'clamp(1rem, 2vw, 1.5rem)',
                background: '#ffffff',
                borderRadius: '12px',
                border: '2px solid #e5e7eb',
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                transition: 'transform 0.2s, box-shadow 0.2s, border-color 0.2s',
                height: '100%',
                display: 'flex',
                flexDirection: 'column'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 8px 30px rgba(108,92,231,0.15)';
                e.currentTarget.style.borderColor = '#6c5ce7';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)';
                e.currentTarget.style.borderColor = '#e5e7eb';
              }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 'clamp(1.5rem, 3vw, 2rem)' }}>{course.imageUrl || '📚'}</span>
                  <span style={{ 
                    padding: '0.25rem 0.75rem',
                    background: getLevelColor(course.difficultyLevel) + '20',
                    color: getLevelColor(course.difficultyLevel),
                    borderRadius: '20px',
                    fontSize: '0.75rem',
                    fontWeight: '600'
                  }}>
                    {course.difficultyLevel || 'Beginner'}
                  </span>
                  {course.price === 0 || course.price === '0' || course.price === null ? (
                    <span style={{ 
                      padding: '0.25rem 0.75rem',
                      background: '#34d39920',
                      color: '#34d399',
                      borderRadius: '20px',
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      marginLeft: 'auto'
                    }}>
                      Free
                    </span>
                  ) : (
                    <span style={{ 
                      padding: '0.25rem 0.75rem',
                      background: '#fbbf2420',
                      color: '#f59e0b',
                      borderRadius: '20px',
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      marginLeft: 'auto'
                    }}>
                      ${course.price}
                    </span>
                  )}
                </div>

                <h3 style={{ 
                  fontSize: 'clamp(1rem, 1.5vw, 1.1rem)', 
                  color: '#1a1a2e', 
                  marginBottom: '0.5rem',
                  fontWeight: '600'
                }}>
                  {course.title}
                </h3>
                <p style={{ 
                  color: '#4b5563', 
                  fontSize: 'clamp(0.85rem, 1vw, 0.9rem)', 
                  flex: 1, 
                  marginBottom: '0.75rem',
                  lineHeight: '1.5'
                }}>
                  {course.description?.substring(0, 100)}...
                </p>

                <div style={{ 
                  display: 'flex', 
                  gap: '1rem', 
                  fontSize: 'clamp(0.75rem, 1vw, 0.85rem)', 
                  color: '#6b7280', 
                  marginBottom: '0.75rem',
                  flexWrap: 'wrap'
                }}>
                  <span>📚 {course.totalLessons || 0} lessons</span>
                  <span>⏱️ {course.duration || 'N/A'}</span>
                  <span>⭐ {course.rating || 0}</span>
                </div>

                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  paddingTop: '0.75rem',
                  borderTop: '1px solid #e5e7eb',
                  flexWrap: 'wrap',
                  gap: '0.5rem'
                }}>
                  <span style={{ fontSize: 'clamp(0.75rem, 1vw, 0.85rem)', color: '#6b7280' }}>
                    👨‍🏫 {course.instructorName || 'Instructor'}
                  </span>
                  <span style={{ 
                    fontSize: 'clamp(0.75rem, 1vw, 0.85rem)', 
                    color: '#6c5ce7',
                    fontWeight: '500'
                  }}>
                    👥 {course.totalReviews || 0} students
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default Courses;