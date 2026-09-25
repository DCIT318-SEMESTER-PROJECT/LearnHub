import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getCourses } from '../api/coursesAPI';
import { useAuth } from '../context/AuthContext';
import StarRating from '../components/common/StarRating';
import { submitRating } from '../api/ratingsAPI';

const isImageUrl = (url) => {
  if (!url || typeof url !== 'string') return false;
  return url.startsWith('data:image') || url.startsWith('http://') || url.startsWith('https://') || url.startsWith('/');
};

function Courses() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [myRatings, setMyRatings] = useState({});
  const [ratingBusy, setRatingBusy] = useState({});

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setLoading(true);
        const response = await getCourses();
        console.log('📚 Courses data:', response.data);
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
    switch (level.toLowerCase()) {
      case 'beginner': return '#34d399';
      case 'intermediate': return '#fbbf24';
      case 'advanced': return '#f87171';
      default: return '#666';
    }
  };

  const getInstructorInitials = (name) => {
    if (!name) return 'IN';
    return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  };

  const handleRate = async (courseId, rating) => {
    if (!user) {
      navigate('/login');
      return;
    }
    setRatingBusy(prev => ({ ...prev, [courseId]: true }));
    setMyRatings(prev => ({ ...prev, [courseId]: rating }));

    try {
      const { data } = await submitRating(courseId, rating);
      setCourses(prev =>
        prev.map(c =>
          c.id === courseId
            ? { ...c, rating: data.courseStats.averageRating, totalReviews: data.courseStats.totalReviews }
            : c
        )
      );
    } catch (err) {
      console.error('Failed to rate course:', err.response?.data || err);
      setMyRatings(prev => {
        const next = { ...prev };
        delete next[courseId];
        return next;
      });
      alert(err.response?.data?.error || 'Failed to rate course');
    } finally {
      setRatingBusy(prev => ({ ...prev, [courseId]: false }));
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem' }}>
        <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>📚</div>
        <p style={{ color: 'var(--text-secondary)' }}>Loading courses...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem' }}>
        <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⚠️</div>
        <p style={{ color: 'var(--error)' }}>{error}</p>
        <button onClick={() => window.location.reload()} style={{ marginTop: '1rem', padding: '0.5rem 2rem', background: '#6c5ce7', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="courses-page" style={{ maxWidth: '1400px', margin: '2rem auto', padding: '0 clamp(1rem, 3vw, 2rem)' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: 'clamp(1.5rem, 4vw, 2rem)', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Explore Courses</h2>
        <p style={{ color: 'var(--text-tertiary)' }}>Discover {courses.length}+ courses across all topics</p>
      </div>

      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '2rem', padding: 'clamp(1rem, 2vw, 1.5rem)', background: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid var(--border-primary)' }}>
        <input
          type="text" placeholder="Search courses..." value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ flex: '1', minWidth: '150px', padding: '0.75rem', border: '1px solid var(--border-input)', borderRadius: '8px', fontSize: '1rem', color: 'var(--text-primary)', background: 'var(--bg-input)' }}
        />
        <select
          value={filter} onChange={(e) => setFilter(e.target.value)}
          style={{ padding: '0.75rem', border: '1px solid var(--border-input)', borderRadius: '8px', fontSize: '1rem', background: 'var(--bg-input)', color: 'var(--text-primary)', minWidth: '150px', cursor: 'pointer' }}
        >
          {categories.map(cat => (
            <option key={cat} value={cat.toLowerCase()} style={{ color: '#1a1a2e', background: '#ffffff' }}>{cat}</option>
          ))}
        </select>
      </div>

      {filteredCourses.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔍</div>
          <h3 style={{ color: 'var(--text-primary)' }}>No courses found</h3>
          <p style={{ color: 'var(--text-tertiary)' }}>Try adjusting your search or filters</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 320px), 1fr))', gap: '1.5rem', width: '100%' }}>
          {filteredCourses.map(course => (
            <div
              key={course.id}
              onClick={() => navigate(`/courses/${course.id}`)}
              role="link"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'Enter') navigate(`/courses/${course.id}`); }}
              style={{ padding: 'clamp(1rem, 2vw, 1.5rem)', background: 'var(--bg-card)', borderRadius: '12px', border: '2px solid var(--border-primary)', boxShadow: 'var(--shadow-sm)', transition: 'transform 0.2s, box-shadow 0.2s, border-color 0.2s', height: '100%', display: 'flex', flexDirection: 'column', cursor: 'pointer' }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = 'var(--shadow-lg)'; e.currentTarget.style.borderColor = '#6c5ce7'; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; e.currentTarget.style.borderColor = 'var(--border-primary)'; }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
                {isImageUrl(course.imageUrl) ? (
                  <img src={course.imageUrl} alt={course.title} style={{ width: 'clamp(40px, 5vw, 56px)', height: 'clamp(40px, 5vw, 56px)', objectFit: 'cover', borderRadius: '10px', flexShrink: 0 }} />
                ) : (
                  <span style={{ fontSize: 'clamp(1.5rem, 3vw, 2rem)' }}>{course.imageUrl || '📚'}</span>
                )}
                <span style={{ padding: '0.25rem 0.75rem', background: getLevelColor(course.difficultyLevel) + '20', color: getLevelColor(course.difficultyLevel), borderRadius: '20px', fontSize: '0.75rem', fontWeight: '600' }}>
                  {course.difficultyLevel || 'Beginner'}
                </span>
                <span style={{ padding: '0.25rem 0.75rem', background: course.price ? '#fbbf2420' : '#34d39920', color: course.price ? '#f59e0b' : '#34d399', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '600', marginLeft: 'auto' }}>
                  {course.price ? `$${course.price}` : 'Free'}
                </span>
              </div>

              <h3 style={{ fontSize: 'clamp(1rem, 1.5vw, 1.1rem)', color: 'var(--text-primary)', marginBottom: '0.5rem', fontWeight: '600' }}>{course.title}</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: 'clamp(0.85rem, 1vw, 0.9rem)', flex: 1, marginBottom: '0.75rem', lineHeight: '1.5' }}>
                {course.description?.substring(0, 100)}...
              </p>

              <div style={{ display: 'flex', gap: '1rem', fontSize: 'clamp(0.75rem, 1vw, 0.85rem)', color: 'var(--text-tertiary)', marginBottom: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
                <span>📚 {course.totalLessons || 0} lessons</span>
                <span>⏱️ {course.duration || 'N/A'}</span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                  <StarRating value={course.rating || 0} readOnly size={14} />
                  <span>({course.totalReviews || 0})</span>
                </span>
              </div>

              <div onClick={(e) => e.stopPropagation()} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0.75rem', background: 'var(--bg-secondary)', borderRadius: '10px', marginBottom: '0.75rem', border: '1px solid var(--border-primary)', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', fontWeight: 500 }}>
                  {user ? (myRatings[course.id] ? 'Your rating:' : 'Rate:') : 'Sign in to rate:'}
                </span>
                <StarRating
                  value={myRatings[course.id] || 0}
                  onChange={(r) => !ratingBusy[course.id] && handleRate(course.id, r)}
                  size={20}
                />
                {ratingBusy[course.id] && <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>Saving…</span>}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.75rem', borderTop: '1px solid var(--border-primary)', gap: '0.5rem', flexWrap: 'wrap' }}>
                <Link to={`/instructor/${course.instructorId}`} onClick={(e) => e.stopPropagation()} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none', color: 'inherit' }}>
                  <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: course.instructorAvatar ? `url(${course.instructorAvatar}) center/cover` : 'linear-gradient(135deg, #6c5ce7, #5a4bd1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: '600', fontSize: '0.7rem', flexShrink: 0, overflow: 'hidden' }}>
                    {!course.instructorAvatar && getInstructorInitials(course.instructorName)}
                  </div>
                  <span style={{ fontSize: 'clamp(0.75rem, 1vw, 0.85rem)', color: 'var(--text-secondary)', fontWeight: '500' }}>
                    {course.instructorName || 'Instructor'}
                  </span>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Courses;