import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../api/axiosConfig';
import { getCurrentUser } from '../api/authAPI';
import Celebration from '../components/common/Celebration';
import InstructorCard from '../components/common/InstructorCard';

// ✅ Helper: Check if a string is an image URL or data URI
const isImageUrl = (url) => {
  if (!url || typeof url !== 'string') return false;
  return url.startsWith('data:image') || url.startsWith('http://') || url.startsWith('https://') || url.startsWith('/');
};

function CourseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeLesson, setActiveLesson] = useState(null);
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizScore, setQuizScore] = useState(0);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [enrolling, setEnrolling] = useState(false);
  const [progress, setProgress] = useState(0);
  const [completedLessons, setCompletedLessons] = useState(0);
  const [showCelebration, setShowCelebration] = useState(false);
  const [completedLessonTitle, setCompletedLessonTitle] = useState('');
  const [isCompleting, setIsCompleting] = useState(false);

  const user = getCurrentUser();

  useEffect(() => {
    fetchCourseDetails();
  }, [id]);

  const fetchCourseDetails = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/courses/${id}`);
      const data = response.data;
      setCourse(data);
      setIsEnrolled(data.isEnrolled || false);
      setProgress(data.progress || 0);
      setCompletedLessons(data.completedLessons || 0);
      setError('');
    } catch (err) {
      console.error('Error fetching course:', err);
      setError('Failed to load course details');
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    try {
      setEnrolling(true);
      await api.post(`/courses/${id}/enroll`);
      setIsEnrolled(true);
      fetchCourseDetails();
    } catch (err) {
      console.error('Error enrolling:', err);
      alert('Failed to enroll. Please try again.');
    } finally {
      setEnrolling(false);
    }
  };

  const handleUnenroll = async () => {
    try {
      await api.delete(`/courses/${id}/unenroll`);
      setIsEnrolled(false);
      setProgress(0);
      setCompletedLessons(0);
      fetchCourseDetails();
    } catch (err) {
      console.error('Error unenrolling:', err);
      alert('Failed to unenroll. Please try again.');
    }
  };

  const handleLessonClick = (lesson) => {
    if (!isEnrolled) {
      alert('Please enroll in the course to access lessons.');
      return;
    }
    setActiveLesson(lesson);
    setShowQuiz(false);
  };

  const toggleLessonComplete = async (lessonId) => {
    if (isCompleting) return;

    try {
      setIsCompleting(true);

      const lesson = course?.lessons?.find(l => l.id === lessonId);
      if (!lesson) {
        setIsCompleting(false);
        return;
      }

      if (lesson.isCompleted) {
        try {
          await api.put(`/courses/lessons/${lessonId}/progress`, {
            completed: false,
            watchTime: 0
          });
        } catch (err) {
          console.warn('API error on uncomplete:', err);
        }

        const updatedLessons = course.lessons.map(l =>
          l.id === lessonId ? { ...l, isCompleted: false } : l
        );
        setCourse({ ...course, lessons: updatedLessons });

        const newCompletedCount = updatedLessons.filter(l => l.isCompleted).length;
        const newProgress = course.lessons.length > 0 ? Math.round((newCompletedCount / course.lessons.length) * 100) : 0;
        setCompletedLessons(newCompletedCount);
        setProgress(newProgress);

        setIsCompleting(false);
        return;
      }

      try {
        const response = await api.put(`/courses/lessons/${lessonId}/progress`, {
          completed: true,
          watchTime: 300
        });
        console.log('✅ Progress update response:', response.data);
      } catch (err) {
        console.warn('⚠️ API error on complete:', err);
      }

      const updatedLessons = course.lessons.map(l =>
        l.id === lessonId ? { ...l, isCompleted: true } : l
      );
      setCourse({ ...course, lessons: updatedLessons });

      const newCompletedCount = updatedLessons.filter(l => l.isCompleted).length;
      const newProgress = course.lessons.length > 0 ? Math.round((newCompletedCount / course.lessons.length) * 100) : 0;
      setCompletedLessons(newCompletedCount);
      setProgress(newProgress);

      setCompletedLessonTitle(lesson.title);
      setShowCelebration(true);

    } catch (err) {
      console.error('❌ Unexpected error:', err);
      alert('Failed to update progress. Please try again.');
    } finally {
      setIsCompleting(false);
    }
  };

  const handleCelebrationClose = () => {
    setShowCelebration(false);
  };

  const handleQuizSubmit = () => {
    if (!course?.quiz?.questions) {
      alert('No quiz available for this course yet.');
      return;
    }

    const questions = course.quiz.questions;
    let correct = 0;
    questions.forEach((q, index) => {
      if (quizAnswers[index] === q.correctOption) {
        correct++;
      }
    });
    const score = Math.round((correct / questions.length) * 100);
    setQuizScore(score);
    setQuizSubmitted(true);

    if (score >= 70) {
      setCompletedLessonTitle('Quiz');
      setShowCelebration(true);
    }
  };

  const handleQuizAnswer = (questionIndex, optionIndex) => {
    setQuizAnswers({
      ...quizAnswers,
      [questionIndex]: optionIndex
    });
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem' }}>
        <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>📚</div>
        <p>Loading course...</p>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem' }}>
        <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⚠️</div>
        <p style={{ color: '#ef4444' }}>{error || 'Course not found'}</p>
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
            Back to Courses
          </button>
        </Link>
      </div>
    );
  }

  return (
    <div style={{
      maxWidth: '1400px',
      margin: '2rem auto',
      padding: '0 clamp(1rem, 3vw, 2rem)',
      width: '100%'
    }}>
      {/* Responsive styles for course header */}
      <style>{`
        .course-header-row {
          display: flex;
          flex-direction: column;
          align-items: stretch;
          gap: 1rem;
        }
        .course-header-info {
          flex: 1;
          min-width: 200px;
        }
        .course-header-action {
          width: 100%;
          text-align: center;
        }
        .course-header-action button {
          width: 100% !important;
        }
        @media (min-width: 768px) {
          .course-header-row {
            flex-direction: row;
            justify-content: space-between;
            align-items: flex-start;
          }
          .course-header-info {
            min-width: 200px;
          }
          .course-header-action {
            width: auto;
            min-width: clamp(120px, 15vw, 150px);
            text-align: right;
            align-self: center;
          }
        }
      `}</style>

      {/* Celebration Modal */}
      <Celebration
        show={showCelebration}
        onClose={handleCelebrationClose}
        lessonTitle={completedLessonTitle}
        courseTitle={course.title}
      />

      <Link to="/courses" style={{
        color: '#6c5ce7',
        display: 'inline-block',
        marginBottom: '1.5rem',
        textDecoration: 'none',
        fontSize: 'clamp(0.9rem, 1.2vw, 1rem)'
      }}>
        ← Back to Courses
      </Link>

      {/* Course Header - Responsive */}
      <div style={{
        padding: 'clamp(1rem, 2vw, 2rem)',
        background: 'var(--bg-secondary)',
        borderRadius: '12px',
        border: '1px solid var(--border-primary)',
        marginBottom: '2rem'
      }}>
        <div className="course-header-row">
          <div className="course-header-info">
            {/* ✅ FIXED: Image/emoji rendering */}
            <div style={{ marginBottom: '0.75rem' }}>
              {isImageUrl(course.imageUrl) ? (
                <img
                  src={course.imageUrl}
                  alt={course.title}
                  style={{
                    width: 'clamp(100px, 12vw, 140px)',
                    height: 'clamp(100px, 12vw, 140px)',
                    objectFit: 'cover',
                    borderRadius: '16px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    display: 'block'
                  }}
                />
              ) : (
                <div style={{ fontSize: 'clamp(2rem, 4vw, 3rem)' }}>
                  {course.imageUrl || '📚'}
                </div>
              )}
            </div>

            <h1 style={{
              fontSize: 'clamp(1.5rem, 3vw, 2rem)',
              color: 'var(--text-primary)',
              marginBottom: '0.5rem',
              wordBreak: 'break-word',
              marginTop: 0
            }}>
              {course.title}
            </h1>
            <p style={{
              color: 'var(--text-secondary)',
              maxWidth: '600px',
              fontSize: 'clamp(0.9rem, 1.2vw, 1rem)',
              lineHeight: '1.6',
              margin: 0
            }}>
              {course.description}
            </p>
            <div style={{
              display: 'flex',
              gap: 'clamp(0.5rem, 1.5vw, 1.5rem)',
              marginTop: '1rem',
              flexWrap: 'wrap',
              fontSize: 'clamp(0.8rem, 1vw, 0.9rem)'
            }}>
              <span style={{ color: 'var(--text-tertiary)' }}>👨‍🏫 {course.instructorName || 'Instructor'}</span>
              <span style={{ color: 'var(--text-tertiary)' }}>📚 {course.lessons?.length || 0} lessons</span>
              <span style={{ color: 'var(--text-tertiary)' }}>⏱️ {course.duration || 'N/A'}</span>
              <span style={{
                padding: '0.25rem 0.75rem',
                background: 'var(--accent-light)',
                color: '#6c5ce7',
                borderRadius: '20px',
                fontSize: 'clamp(0.75rem, 0.9vw, 0.85rem)'
              }}>
                {course.difficultyLevel || 'Beginner'}
              </span>
              {course.price === 0 ? (
                <span style={{
                  padding: '0.25rem 0.75rem',
                  background: '#34d39920',
                  color: '#34d399',
                  borderRadius: '20px',
                  fontSize: 'clamp(0.75rem, 0.9vw, 0.85rem)'
                }}>
                  Free
                </span>
              ) : (
                <span style={{
                  padding: '0.25rem 0.75rem',
                  background: '#fbbf2420',
                  color: '#f59e0b',
                  borderRadius: '20px',
                  fontSize: 'clamp(0.75rem, 0.9vw, 0.85rem)'
                }}>
                  ${course.price}
                </span>
              )}
            </div>
          </div>
          <div className="course-header-action">
            {isEnrolled ? (
              <>
                <div style={{
                  fontSize: 'clamp(1.5rem, 3vw, 2rem)',
                  fontWeight: 'bold',
                  color: progress === 100 ? '#34d399' : '#6c5ce7',
                  marginBottom: '0.25rem'
                }}>
                  {progress}%
                </div>
                <div style={{ color: 'var(--text-tertiary)', fontSize: 'clamp(0.8rem, 1vw, 0.9rem)' }}>
                  {completedLessons} / {course.lessons?.length || 0} lessons
                </div>
                <div style={{
                  width: '100%',
                  maxWidth: '150px',
                  background: 'var(--bg-tertiary)',
                  borderRadius: '4px',
                  height: '8px',
                  marginTop: '0.5rem',
                  marginLeft: 'auto'
                }}>
                  <div style={{
                    background: progress === 100 ? '#34d399' : '#6c5ce7',
                    height: '100%',
                    borderRadius: '4px',
                    width: `${progress}%`,
                    transition: 'width 0.5s ease'
                  }} />
                </div>
                {progress === 100 && (
                  <div style={{
                    marginTop: '0.5rem',
                    color: '#34d399',
                    fontWeight: 'bold',
                    fontSize: 'clamp(0.8rem, 1vw, 0.9rem)'
                  }}>
                    🎉 Course Complete!
                  </div>
                )}
                <button
                  onClick={handleUnenroll}
                  style={{
                    marginTop: '0.75rem',
                    padding: '0.4rem 1rem',
                    background: '#ef4444',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: 'clamp(0.75rem, 0.9vw, 0.85rem)',
                    width: '100%'
                  }}
                >
                  Unenroll
                </button>
              </>
            ) : (
              <button
                onClick={handleEnroll}
                disabled={enrolling}
                style={{
                  padding: '0.6rem 1.5rem',
                  background: enrolling ? '#a29bfe' : '#6c5ce7',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: enrolling ? 'not-allowed' : 'pointer',
                  fontSize: 'clamp(0.9rem, 1.2vw, 1rem)',
                  fontWeight: '500',
                  opacity: enrolling ? 0.7 : 1,
                  width: '100%'
                }}
              >
                {enrolling ? 'Enrolling...' : 'Enroll Now'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ✅ NEW — About the Instructor */}
      {course.instructorId && (
        <InstructorCard instructorId={course.instructorId} variant="full" />
      )}

      {/* Main Content - Responsive Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 400px), 1fr))',
        gap: 'clamp(1rem, 2vw, 2rem)',
        marginTop: '2rem'
      }}>
        {/* Left Column - Lessons */}
        <div>
          <div style={{
            padding: 'clamp(1rem, 1.5vw, 1.5rem)',
            background: 'var(--bg-card)',
            borderRadius: '12px',
            border: '1px solid var(--border-primary)'
          }}>
            <h3 style={{
              marginBottom: '1rem',
              color: 'var(--text-primary)',
              fontSize: 'clamp(1.1rem, 1.5vw, 1.2rem)',
              marginTop: 0
            }}>
              Course Content
            </h3>
            {isEnrolled && (
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: 'clamp(0.8rem, 1vw, 0.85rem)',
                color: 'var(--text-tertiary)',
                marginBottom: '1rem',
                flexWrap: 'wrap',
                gap: '0.25rem'
              }}>
                <span>{completedLessons} / {course.lessons?.length || 0} lessons completed</span>
                <span>{course.duration || 'N/A'} total</span>
              </div>
            )}

            {course.lessons?.map((lesson, index) => (
              <div
                key={lesson.id}
                onClick={() => handleLessonClick(lesson)}
                style={{
                  padding: 'clamp(0.5rem, 1vw, 0.75rem) clamp(0.75rem, 1.5vw, 1rem)',
                  marginBottom: '0.5rem',
                  background: activeLesson?.id === lesson.id ? 'var(--accent-light)' : 'transparent',
                  borderRadius: '8px',
                  cursor: isEnrolled ? 'pointer' : 'default',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  transition: 'all 0.2s',
                  border: activeLesson?.id === lesson.id ? '1px solid #6c5ce7' : '1px solid transparent',
                  opacity: isEnrolled ? 1 : 0.6,
                  flexWrap: 'wrap',
                  gap: '0.25rem'
                }}
                onMouseEnter={(e) => {
                  if (isEnrolled && activeLesson?.id !== lesson.id) {
                    e.currentTarget.style.background = 'var(--bg-tertiary)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (activeLesson?.id !== lesson.id) {
                    e.currentTarget.style.background = 'transparent';
                  }
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  {lesson.isCompleted ? (
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 'clamp(20px, 2vw, 24px)',
                      height: 'clamp(20px, 2vw, 24px)',
                      background: '#34d399',
                      borderRadius: '50%',
                      color: 'white',
                      fontSize: 'clamp(10px, 1vw, 12px)',
                      fontWeight: 'bold',
                      flexShrink: 0
                    }}>
                      ✓
                    </span>
                  ) : (
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 'clamp(20px, 2vw, 24px)',
                      height: 'clamp(20px, 2vw, 24px)',
                      background: 'var(--bg-tertiary)',
                      borderRadius: '50%',
                      color: 'var(--text-muted)',
                      fontSize: 'clamp(10px, 1vw, 12px)',
                      fontWeight: 'bold',
                      flexShrink: 0
                    }}>
                      {index + 1}
                    </span>
                  )}
                  <span style={{
                    color: lesson.isCompleted ? '#34d399' : 'var(--text-primary)',
                    fontWeight: lesson.isCompleted ? '500' : '400',
                    fontSize: 'clamp(0.85rem, 1vw, 0.95rem)',
                    wordBreak: 'break-word'
                  }}>
                    {lesson.title}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span style={{ fontSize: 'clamp(0.7rem, 0.8vw, 0.8rem)', color: 'var(--text-tertiary)' }}>
                    {lesson.duration || 'N/A'}
                  </span>
                  {isEnrolled && lesson.isCompleted && (
                    <span style={{
                      fontSize: 'clamp(0.6rem, 0.7vw, 0.65rem)',
                      color: '#34d399',
                      background: '#d1fae5',
                      padding: '0.1rem 0.5rem',
                      borderRadius: '20px',
                      fontWeight: '500',
                      whiteSpace: 'nowrap'
                    }}>
                      ✓ Done
                    </span>
                  )}
                  {!isEnrolled && (
                    <span style={{ fontSize: 'clamp(0.6rem, 0.7vw, 0.7rem)', color: '#fbbf24' }}>🔒</span>
                  )}
                </div>
              </div>
            ))}

            <button
              onClick={() => {
                if (!isEnrolled) {
                  alert('Please enroll in the course to take the quiz.');
                  return;
                }
                setShowQuiz(!showQuiz);
                setActiveLesson(null);
                setQuizSubmitted(false);
                setQuizAnswers({});
              }}
              style={{
                width: '100%',
                padding: '0.75rem',
                marginTop: '1rem',
                background: showQuiz ? '#6c5ce7' : 'var(--accent-light)',
                color: showQuiz ? 'white' : '#6c5ce7',
                border: 'none',
                borderRadius: '8px',
                cursor: isEnrolled ? 'pointer' : 'not-allowed',
                fontWeight: '500',
                fontSize: 'clamp(0.9rem, 1.2vw, 1rem)',
                opacity: isEnrolled ? 1 : 0.6,
                transition: 'all 0.3s ease'
              }}
            >
              {showQuiz ? 'Hide Quiz' : '📝 Take Quiz'}
            </button>
          </div>
        </div>

        {/* Right Column - Active Lesson or Quiz */}
        <div>
          {showQuiz ? (
            <div style={{
              padding: 'clamp(1rem, 1.5vw, 1.5rem)',
              background: 'var(--bg-card)',
              borderRadius: '12px',
              border: '1px solid var(--border-primary)'
            }}>
              <h3 style={{
                marginBottom: '1rem',
                color: 'var(--text-primary)',
                fontSize: 'clamp(1.1rem, 1.5vw, 1.2rem)',
                marginTop: 0
              }}>
                📝 Course Quiz
              </h3>
              {course.quiz?.questions ? (
                <>
                  <p style={{
                    color: 'var(--text-tertiary)',
                    marginBottom: '1.5rem',
                    fontSize: 'clamp(0.9rem, 1vw, 1rem)'
                  }}>
                    Test your knowledge with {course.quiz.questions.length} questions
                  </p>

                  {quizSubmitted ? (
                    <div style={{ textAlign: 'center', padding: '1rem' }}>
                      <div style={{ fontSize: 'clamp(3rem, 5vw, 4rem)', marginBottom: '0.5rem' }}>
                        {quizScore >= 70 ? '🎉' : '📚'}
                      </div>
                      <h3 style={{ color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                        {quizScore >= 70 ? 'Quiz Passed!' : 'Keep Learning!'}
                      </h3>
                      <div style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 'bold', color: '#6c5ce7' }}>
                        {quizScore}%
                      </div>
                      <p style={{ color: 'var(--text-tertiary)', marginTop: '0.5rem' }}>
                        {quizScore >= 70
                          ? 'Great job! You understand the material well.'
                          : 'Review the lessons and try again.'}
                      </p>
                      <button
                        onClick={() => {
                          setQuizSubmitted(false);
                          setQuizAnswers({});
                        }}
                        style={{
                          padding: '0.6rem 1.5rem',
                          marginTop: '1rem',
                          background: '#6c5ce7',
                          color: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          fontSize: 'clamp(0.9rem, 1vw, 1rem)',
                          transition: 'all 0.3s ease'
                        }}
                      >
                        Retry Quiz
                      </button>
                    </div>
                  ) : (
                    <>
                      {course.quiz.questions.map((q, qIndex) => (
                        <div key={qIndex} style={{ marginBottom: '1.5rem' }}>
                          <p style={{
                            fontWeight: '500',
                            color: 'var(--text-primary)',
                            marginBottom: '0.5rem',
                            fontSize: 'clamp(0.9rem, 1vw, 1rem)'
                          }}>
                            {qIndex + 1}. {q.question}
                          </p>
                          {[q.option1, q.option2, q.option3, q.option4].map((option, oIndex) => (
                            option && (
                              <label
                                key={oIndex}
                                style={{
                                  display: 'block',
                                  padding: '0.5rem 0.75rem',
                                  marginBottom: '0.25rem',
                                  background: quizAnswers[qIndex] === oIndex ? 'var(--accent-light)' : 'transparent',
                                  borderRadius: '6px',
                                  cursor: 'pointer',
                                  border: quizAnswers[qIndex] === oIndex ? '1px solid #6c5ce7' : '1px solid transparent',
                                  transition: 'all 0.2s ease',
                                  fontSize: 'clamp(0.85rem, 1vw, 0.95rem)',
                                  color: 'var(--text-primary)'
                                }}
                              >
                                <input
                                  type="radio"
                                  name={`question-${qIndex}`}
                                  value={oIndex}
                                  checked={quizAnswers[qIndex] === oIndex}
                                  onChange={() => handleQuizAnswer(qIndex, oIndex)}
                                  style={{ marginRight: '0.5rem', accentColor: '#6c5ce7' }}
                                />
                                {option}
                              </label>
                            )
                          ))}
                        </div>
                      ))}
                      <button
                        onClick={handleQuizSubmit}
                        disabled={Object.keys(quizAnswers).length < (course.quiz.questions?.length || 0)}
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          background: Object.keys(quizAnswers).length < (course.quiz.questions?.length || 0) ? 'var(--bg-tertiary)' : '#6c5ce7',
                          color: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          cursor: Object.keys(quizAnswers).length < (course.quiz.questions?.length || 0) ? 'not-allowed' : 'pointer',
                          fontSize: 'clamp(0.9rem, 1.2vw, 1rem)',
                          fontWeight: '500',
                          transition: 'all 0.3s ease',
                          opacity: Object.keys(quizAnswers).length < (course.quiz.questions?.length || 0) ? 0.6 : 1
                        }}
                      >
                        Submit Quiz ({Object.keys(quizAnswers).length}/{course.quiz.questions?.length || 0})
                      </button>
                    </>
                  )}
                </>
              ) : (
                <div style={{ textAlign: 'center', padding: '2rem' }}>
                  <p style={{ color: 'var(--text-tertiary)' }}>No quiz available for this course yet.</p>
                </div>
              )}
            </div>
          ) : activeLesson ? (
            <div style={{
              padding: 'clamp(1rem, 1.5vw, 1.5rem)',
              background: 'var(--bg-card)',
              borderRadius: '12px',
              border: '1px solid var(--border-primary)'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1rem',
                flexWrap: 'wrap',
                gap: '0.5rem'
              }}>
                <h3 style={{
                  color: 'var(--text-primary)',
                  fontSize: 'clamp(1rem, 1.3vw, 1.1rem)',
                  wordBreak: 'break-word',
                  margin: 0
                }}>
                  {activeLesson.title}
                </h3>
                <span style={{ color: 'var(--text-tertiary)', fontSize: 'clamp(0.8rem, 0.9vw, 0.9rem)' }}>
                  {activeLesson.duration || 'N/A'}
                </span>
              </div>

              <div style={{
                background: 'var(--bg-secondary)',
                borderRadius: '8px',
                padding: 'clamp(2rem, 5vw, 3rem)',
                textAlign: 'center',
                marginBottom: '1rem'
              }}>
                <div style={{ fontSize: 'clamp(3rem, 5vw, 4rem)', marginBottom: '1rem' }}>🎥</div>
                <p style={{ color: 'var(--text-tertiary)', fontSize: 'clamp(0.9rem, 1vw, 1rem)' }}>Lesson content would appear here</p>
                <p style={{ fontSize: 'clamp(0.8rem, 0.9vw, 0.85rem)', color: 'var(--text-muted)' }}>
                  {activeLesson.description || 'No description available'}
                </p>
              </div>

              {isEnrolled && (
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                  <button
                    onClick={() => toggleLessonComplete(activeLesson.id)}
                    disabled={isCompleting}
                    style={{
                      flex: '1',
                      padding: '0.75rem',
                      background: activeLesson.isCompleted ? '#34d399' : '#6c5ce7',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: isCompleting ? 'not-allowed' : 'pointer',
                      transition: 'all 0.3s ease',
                      opacity: isCompleting ? 0.7 : 1,
                      fontSize: 'clamp(0.85rem, 1vw, 0.95rem)',
                      minWidth: '120px'
                    }}
                  >
                    {isCompleting ? 'Processing...' : activeLesson.isCompleted ? '✅ Completed' : '🎯 Mark as Complete'}
                  </button>
                  <button
                    onClick={() => setActiveLesson(null)}
                    style={{
                      padding: '0.75rem 1.5rem',
                      background: 'var(--bg-tertiary)',
                      color: 'var(--text-secondary)',
                      border: '1px solid var(--border-primary)',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      fontSize: 'clamp(0.85rem, 1vw, 0.95rem)'
                    }}
                  >
                    Close
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div style={{
              padding: 'clamp(1.5rem, 2vw, 2rem)',
              background: 'var(--bg-secondary)',
              borderRadius: '12px',
              border: '1px solid var(--border-primary)',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: 'clamp(3rem, 5vw, 4rem)', marginBottom: '1rem' }}>📖</div>
              <h3 style={{
                color: 'var(--text-primary)',
                marginBottom: '0.5rem',
                fontSize: 'clamp(1.1rem, 1.5vw, 1.2rem)'
              }}>
                Select a lesson to begin
              </h3>
              <p style={{
                color: 'var(--text-tertiary)',
                fontSize: 'clamp(0.9rem, 1vw, 1rem)'
              }}>
                {isEnrolled
                  ? 'Choose a lesson from the left sidebar or take the quiz to test your knowledge.'
                  : 'Enroll in this course to access lessons and quizzes.'}
              </p>
              {isEnrolled && (
                <div style={{
                  display: 'flex',
                  justifyContent: 'center',
                  gap: 'clamp(1rem, 2vw, 2rem)',
                  marginTop: '1.5rem',
                  flexWrap: 'wrap'
                }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 'clamp(1.2rem, 2vw, 1.5rem)', color: '#6c5ce7' }}>
                      {completedLessons}
                    </div>
                    <div style={{ fontSize: 'clamp(0.75rem, 0.9vw, 0.85rem)', color: 'var(--text-tertiary)' }}>
                      Lessons Completed
                    </div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 'clamp(1.2rem, 2vw, 1.5rem)', color: '#6c5ce7' }}>
                      {progress}%
                    </div>
                    <div style={{ fontSize: 'clamp(0.75rem, 0.9vw, 0.85rem)', color: 'var(--text-tertiary)' }}>
                      Overall Progress
                    </div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 'clamp(1.2rem, 2vw, 1.5rem)', color: '#6c5ce7' }}>
                      {(course.lessons?.length || 0) - completedLessons}
                    </div>
                    <div style={{ fontSize: 'clamp(0.75rem, 0.9vw, 0.85rem)', color: 'var(--text-tertiary)' }}>
                      Lessons Remaining
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default CourseDetail;