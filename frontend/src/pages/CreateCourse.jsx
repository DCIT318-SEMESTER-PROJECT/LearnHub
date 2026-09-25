import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
  createCourse,
  updateCourse,
  getCourseForEdit,
  addModule,
  deleteModule,
  addLesson,
  deleteLesson,
  publishCourse
} from '../api/coursesAPI';

const CATEGORIES = [
  'Web Development', 'Programming', 'Data Science', 'Design',
  'Mobile Development', 'DevOps', 'Business', 'Marketing',
  'Photography', 'Music', 'Other'
];

const LEVELS = ['Beginner', 'Intermediate', 'Advanced'];
const LANGUAGES = ['English', 'Spanish', 'French', 'German', 'Chinese', 'Arabic', 'Other'];

function CreateCourse() {
  const navigate = useNavigate();
  const { id: editCourseId } = useParams();
  const { user } = useAuth();
  const toast = useToast();

  const [step, setStep] = useState(1);
  const [courseId, setCourseId] = useState(editCourseId ? parseInt(editCourseId) : null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [courseData, setCourseData] = useState({
    title: '',
    description: '',
    category: 'Web Development',
    difficultyLevel: 'Beginner',
    duration: '0 hours',
    price: 0,
    language: 'English',
    prerequisites: '',
    learningOutcomes: '',
    imageUrl: ''
  });

  const [modules, setModules] = useState([]);
  const [newModuleTitle, setNewModuleTitle] = useState('');
  const [newModuleDesc, setNewModuleDesc] = useState('');
  const [addingLessonTo, setAddingLessonTo] = useState(null);
  const [newLessonTitle, setNewLessonTitle] = useState('');
  const [newLessonDuration, setNewLessonDuration] = useState('10 min');

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (editCourseId) {
      loadCourseForEdit();
    }
  }, [editCourseId]);

  const loadCourseForEdit = async () => {
    try {
      setLoading(true);
      const response = await getCourseForEdit(editCourseId);
      const data = response.data;

      setCourseData({
        title: data.title || '',
        description: data.description || '',
        category: data.category || 'Web Development',
        difficultyLevel: data.difficultyLevel || 'Beginner',
        duration: data.duration || '0 hours',
        price: data.price || 0,
        language: data.language || 'English',
        prerequisites: data.prerequisites || '',
        learningOutcomes: data.learningOutcomes || '',
        imageUrl: data.imageUrl || ''
      });

      setModules(data.modules || []);
      setCourseId(data.id);
    } catch (err) {
      console.error('Error loading course:', err);
      toast.error('Failed to load course');
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCourseData({ ...courseData, [name]: value });
    if (errors[name]) setErrors({ ...errors, [name]: '' });
  };

  const handleImageUpload = (e) => {
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

    const reader = new FileReader();
    reader.onloadend = () => {
      setCourseData({ ...courseData, imageUrl: reader.result });
    };
    reader.readAsDataURL(file);
  };

  // ─── Save Step 1: Basic Info ───
  const saveBasicInfo = async () => {
    const newErrors = {};
    if (!courseData.title.trim()) newErrors.title = 'Title is required';
    if (!courseData.description.trim()) newErrors.description = 'Description is required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return false;
    }

    try {
      setSaving(true);
      if (!courseId) {
        const response = await createCourse(courseData);
        setCourseId(response.data.course.id);
        toast.success('Course created! 🎉');
      } else {
        await updateCourse(courseId, courseData);
        toast.success('Course updated');
      }
      return true;
    } catch (err) {
      console.error('Error saving course:', err);
      toast.error(err.response?.data?.error || 'Failed to save course');
      return false;
    } finally {
      setSaving(false);
    }
  };

  // ─── Save Step 2: Details ───
  const saveDetails = async () => {
    if (!courseId) {
      toast.error('Save basic info first');
      return false;
    }
    try {
      setSaving(true);
      await updateCourse(courseId, courseData);
      toast.success('Details saved');
      return true;
    } catch (err) {
      console.error('Error saving details:', err);
      toast.error('Failed to save details');
      return false;
    } finally {
      setSaving(false);
    }
  };

  // ─── Save Step 3: Thumbnail ───
  const saveThumbnail = async () => {
    if (!courseId) {
      toast.error('Save basic info first');
      return false;
    }
    try {
      setSaving(true);
      await updateCourse(courseId, { imageUrl: courseData.imageUrl });
      toast.success('Thumbnail saved');
      return true;
    } catch (err) {
      console.error('Error saving thumbnail:', err);
      toast.error('Failed to save thumbnail');
      return false;
    } finally {
      setSaving(false);
    }
  };

  // ─── Add Module ───
  const handleAddModule = async () => {
    if (!newModuleTitle.trim()) {
      toast.error('Module title is required');
      return;
    }
    if (!courseId) {
      toast.error('Save basic info first');
      return;
    }

    try {
      setSaving(true);
      const response = await addModule(courseId, {
        title: newModuleTitle,
        description: newModuleDesc
      });
      setModules([...modules, { ...response.data, lessons: [] }]);
      setNewModuleTitle('');
      setNewModuleDesc('');
      toast.success('Module added');
    } catch (err) {
      console.error('Error adding module:', err);
      toast.error('Failed to add module');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteModule = async (moduleId) => {
    if (!window.confirm('Delete this module? Lessons inside will be unassigned.')) return;

    try {
      await deleteModule(moduleId);
      setModules(modules.filter(m => m.id !== moduleId));
      toast.success('Module deleted');
    } catch (err) {
      console.error('Error deleting module:', err);
      toast.error('Failed to delete module');
    }
  };

  // ─── Add Lesson ───
  const handleAddLesson = async (moduleId) => {
    if (!newLessonTitle.trim()) {
      toast.error('Lesson title is required');
      return;
    }

    try {
      setSaving(true);
      const response = await addLesson(courseId, {
        moduleId,
        title: newLessonTitle,
        duration: newLessonDuration,
        isFree: 1
      });

      const updatedModules = modules.map(m =>
        m.id === moduleId
          ? { ...m, lessons: [...(m.lessons || []), response.data] }
          : m
      );
      setModules(updatedModules);
      setNewLessonTitle('');
      setNewLessonDuration('10 min');
      setAddingLessonTo(null);
      toast.success('Lesson added');
    } catch (err) {
      console.error('Error adding lesson:', err);
      toast.error('Failed to add lesson');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteLesson = async (moduleId, lessonId) => {
    if (!window.confirm('Delete this lesson?')) return;

    try {
      await deleteLesson(lessonId);
      const updatedModules = modules.map(m =>
        m.id === moduleId
          ? { ...m, lessons: (m.lessons || []).filter(l => l.id !== lessonId) }
          : m
      );
      setModules(updatedModules);
      toast.success('Lesson deleted');
    } catch (err) {
      console.error('Error deleting lesson:', err);
      toast.error('Failed to delete lesson');
    }
  };

  // ─── Navigation ───
  const goNext = async () => {
    if (step === 1) {
      const ok = await saveBasicInfo();
      if (ok) setStep(2);
    } else if (step === 2) {
      const ok = await saveDetails();
      if (ok) setStep(3);
    } else if (step === 3) {
      await saveThumbnail();
      setStep(4);
    } else if (step === 4) {
      setStep(5);
    }
  };

  const goBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handlePublish = async () => {
    if (!courseId) {
      toast.error('Course not saved');
      return;
    }
    if (modules.length === 0) {
      toast.error('Add at least one module before publishing');
      return;
    }
    const hasLessons = modules.some(m => m.lessons && m.lessons.length > 0);
    if (!hasLessons) {
      toast.error('Add at least one lesson before publishing');
      return;
    }

    try {
      setLoading(true);
      await publishCourse(courseId);
      toast.success('Course published! 🎉');
      setTimeout(() => navigate(`/courses/${courseId}`), 800);
    } catch (err) {
      console.error('Error publishing:', err);
      toast.error(err.response?.data?.error || 'Failed to publish');
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    { num: 1, label: 'Basic Info', icon: '📝' },
    { num: 2, label: 'Details', icon: '⚙️' },
    { num: 3, label: 'Thumbnail', icon: '🖼️' },
    { num: 4, label: 'Modules', icon: '📚' },
    { num: 5, label: 'Publish', icon: '🚀' }
  ];

  const totalLessons = modules.reduce((sum, m) => sum + (m.lessons?.length || 0), 0);

  return (
    <div style={{
      maxWidth: '900px',
      margin: '2rem auto',
      padding: '0 clamp(1rem, 3vw, 2rem)',
      width: '100%'
    }}>
      <Link to="/dashboard" style={{
        color: '#6c5ce7',
        textDecoration: 'none',
        fontSize: '0.9rem',
        display: 'inline-block',
        marginBottom: '1.5rem',
        fontWeight: '500'
      }}>
        ← Back to Dashboard
      </Link>

      <div style={{
        background: 'var(--bg-card)',
        borderRadius: '20px',
        border: '1px solid var(--border-primary)',
        boxShadow: 'var(--shadow-card)',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          padding: 'clamp(1.25rem, 3vw, 2rem)',
          borderBottom: '1px solid var(--border-primary)',
          background: 'var(--bg-secondary)'
        }}>
          <h1 style={{
            fontSize: 'clamp(1.3rem, 2.5vw, 1.6rem)',
            color: 'var(--text-primary)',
            margin: 0,
            marginBottom: '0.25rem'
          }}>
            {editCourseId ? '✏️ Edit Course' : '🎬 Create New Course'}
          </h1>
          <p style={{
            color: 'var(--text-tertiary)',
            fontSize: '0.9rem',
            margin: 0
          }}>
            Step {step} of {steps.length}: {steps[step - 1].label}
          </p>

          {/* Progress bar */}
          <div style={{
            marginTop: '1.25rem',
            display: 'flex',
            gap: '0.5rem'
          }}>
            {steps.map(s => (
              <div
                key={s.num}
                style={{
                  flex: 1,
                  height: '4px',
                  borderRadius: '2px',
                  background: s.num <= step ? '#6c5ce7' : 'var(--border-primary)',
                  transition: 'background 0.3s'
                }}
              />
            ))}
          </div>

          {/* Step labels */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginTop: '0.75rem',
            fontSize: '0.7rem',
            color: 'var(--text-tertiary)',
            flexWrap: 'wrap',
            gap: '0.25rem'
          }}>
            {steps.map(s => (
              <span
                key={s.num}
                style={{
                  color: s.num === step ? '#6c5ce7' : 'var(--text-tertiary)',
                  fontWeight: s.num === step ? '600' : '400'
                }}
              >
                {s.icon} {s.label}
              </span>
            ))}
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: 'clamp(1.5rem, 3vw, 2rem)' }}>

          {/* ══════════ STEP 1: BASIC INFO ══════════ */}
          {step === 1 && (
            <div>
              <h2 style={{
                fontSize: '1.2rem',
                color: 'var(--text-primary)',
                marginBottom: '0.5rem'
              }}>
                Let's start with the basics
              </h2>
              <p style={{
                color: 'var(--text-tertiary)',
                fontSize: '0.9rem',
                marginBottom: '1.5rem'
              }}>
                Give your course a clear, compelling title and description.
              </p>

              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  fontWeight: '500',
                  color: 'var(--text-primary)',
                  fontSize: '0.9rem'
                }}>
                  Course Title *
                </label>
                <input
                  type="text"
                  name="title"
                  value={courseData.title}
                  onChange={handleChange}
                  placeholder="e.g., Master React from Scratch"
                  maxLength={100}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    background: 'var(--bg-input)',
                    border: `1px solid ${errors.title ? 'var(--error)' : 'var(--border-input)'}`,
                    borderRadius: '8px',
                    fontSize: '1rem',
                    color: 'var(--text-primary)',
                    outline: 'none'
                  }}
                />
                {errors.title && (
                  <div style={{ color: 'var(--error)', fontSize: '0.8rem', marginTop: '0.25rem' }}>
                    {errors.title}
                  </div>
                )}
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem', textAlign: 'right' }}>
                  {courseData.title.length}/100
                </div>
              </div>

              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  fontWeight: '500',
                  color: 'var(--text-primary)',
                  fontSize: '0.9rem'
                }}>
                  Description *
                </label>
                <textarea
                  name="description"
                  value={courseData.description}
                  onChange={handleChange}
                  rows={5}
                  maxLength={500}
                  placeholder="Describe what students will learn in this course..."
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    background: 'var(--bg-input)',
                    border: `1px solid ${errors.description ? 'var(--error)' : 'var(--border-input)'}`,
                    borderRadius: '8px',
                    fontSize: '1rem',
                    color: 'var(--text-primary)',
                    outline: 'none',
                    fontFamily: 'inherit',
                    resize: 'vertical'
                  }}
                />
                {errors.description && (
                  <div style={{ color: 'var(--error)', fontSize: '0.8rem', marginTop: '0.25rem' }}>
                    {errors.description}
                  </div>
                )}
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem', textAlign: 'right' }}>
                  {courseData.description.length}/500
                </div>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '1rem'
              }}>
                <div>
                  <label style={{
                    display: 'block',
                    marginBottom: '0.5rem',
                    fontWeight: '500',
                    color: 'var(--text-primary)',
                    fontSize: '0.9rem'
                  }}>
                    Category
                  </label>
                  <select
                    name="category"
                    value={courseData.category}
                    onChange={handleChange}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      background: 'var(--bg-input)',
                      border: '1px solid var(--border-input)',
                      borderRadius: '8px',
                      fontSize: '1rem',
                      color: 'var(--text-primary)',
                      outline: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    {CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{
                    display: 'block',
                    marginBottom: '0.5rem',
                    fontWeight: '500',
                    color: 'var(--text-primary)',
                    fontSize: '0.9rem'
                  }}>
                    Difficulty Level
                  </label>
                  <select
                    name="difficultyLevel"
                    value={courseData.difficultyLevel}
                    onChange={handleChange}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      background: 'var(--bg-input)',
                      border: '1px solid var(--border-input)',
                      borderRadius: '8px',
                      fontSize: '1rem',
                      color: 'var(--text-primary)',
                      outline: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    {LEVELS.map(lvl => (
                      <option key={lvl} value={lvl}>{lvl}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* ══════════ STEP 2: DETAILS ══════════ */}
          {step === 2 && (
            <div>
              <h2 style={{
                fontSize: '1.2rem',
                color: 'var(--text-primary)',
                marginBottom: '0.5rem'
              }}>
                Course details
              </h2>
              <p style={{
                color: 'var(--text-tertiary)',
                fontSize: '0.9rem',
                marginBottom: '1.5rem'
              }}>
                Help students understand what to expect before enrolling.
              </p>

              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr 1fr',
                gap: '1rem',
                marginBottom: '1.25rem'
              }}>
                <div>
                  <label style={{
                    display: 'block',
                    marginBottom: '0.5rem',
                    fontWeight: '500',
                    color: 'var(--text-primary)',
                    fontSize: '0.9rem'
                  }}>
                    Duration
                  </label>
                  <input
                    type="text"
                    name="duration"
                    value={courseData.duration}
                    onChange={handleChange}
                    placeholder="10 hours"
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      background: 'var(--bg-input)',
                      border: '1px solid var(--border-input)',
                      borderRadius: '8px',
                      fontSize: '1rem',
                      color: 'var(--text-primary)',
                      outline: 'none'
                    }}
                  />
                </div>

                <div>
                  <label style={{
                    display: 'block',
                    marginBottom: '0.5rem',
                    fontWeight: '500',
                    color: 'var(--text-primary)',
                    fontSize: '0.9rem'
                  }}>
                    Price (USD)
                  </label>
                  <input
                    type="number"
                    name="price"
                    value={courseData.price}
                    onChange={handleChange}
                    min="0"
                    step="1"
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      background: 'var(--bg-input)',
                      border: '1px solid var(--border-input)',
                      borderRadius: '8px',
                      fontSize: '1rem',
                      color: 'var(--text-primary)',
                      outline: 'none'
                    }}
                  />
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                    Set 0 for free course
                  </div>
                </div>

                <div>
                  <label style={{
                    display: 'block',
                    marginBottom: '0.5rem',
                    fontWeight: '500',
                    color: 'var(--text-primary)',
                    fontSize: '0.9rem'
                  }}>
                    Language
                  </label>
                  <select
                    name="language"
                    value={courseData.language}
                    onChange={handleChange}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      background: 'var(--bg-input)',
                      border: '1px solid var(--border-input)',
                      borderRadius: '8px',
                      fontSize: '1rem',
                      color: 'var(--text-primary)',
                      outline: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    {LANGUAGES.map(lang => (
                      <option key={lang} value={lang}>{lang}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  fontWeight: '500',
                  color: 'var(--text-primary)',
                  fontSize: '0.9rem'
                }}>
                  Prerequisites
                </label>
                <textarea
                  name="prerequisites"
                  value={courseData.prerequisites}
                  onChange={handleChange}
                  rows={2}
                  placeholder="What should students know before taking this course?"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border-input)',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    color: 'var(--text-primary)',
                    outline: 'none',
                    fontFamily: 'inherit',
                    resize: 'vertical'
                  }}
                />
              </div>

              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  fontWeight: '500',
                  color: 'var(--text-primary)',
                  fontSize: '0.9rem'
                }}>
                  Learning Outcomes
                </label>
                <textarea
                  name="learningOutcomes"
                  value={courseData.learningOutcomes}
                  onChange={handleChange}
                  rows={3}
                  placeholder="What will students be able to do after completing this course?"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border-input)',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    color: 'var(--text-primary)',
                    outline: 'none',
                    fontFamily: 'inherit',
                    resize: 'vertical'
                  }}
                />
              </div>
            </div>
          )}

          {/* ══════════ STEP 3: THUMBNAIL ══════════ */}
          {step === 3 && (
            <div>
              <h2 style={{
                fontSize: '1.2rem',
                color: 'var(--text-primary)',
                marginBottom: '0.5rem'
              }}>
                Course thumbnail
              </h2>
              <p style={{
                color: 'var(--text-tertiary)',
                fontSize: '0.9rem',
                marginBottom: '1.5rem'
              }}>
                Upload an eye-catching cover image. Recommended: 1280×720px, max 2MB.
              </p>

              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '2rem',
                alignItems: 'start'
              }}>
                {/* Upload area */}
                <div>
                  <label
                    htmlFor="thumbnail-upload"
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '3rem 1.5rem',
                      background: 'var(--bg-secondary)',
                      border: '2px dashed var(--border-input)',
                      borderRadius: '12px',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      textAlign: 'center'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#6c5ce7';
                      e.currentTarget.style.background = 'var(--bg-hover)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'var(--border-input)';
                      e.currentTarget.style.background = 'var(--bg-secondary)';
                    }}
                  >
                    <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>📤</div>
                    <div style={{
                      fontSize: '0.95rem',
                      fontWeight: '600',
                      color: 'var(--text-primary)',
                      marginBottom: '0.25rem'
                    }}>
                      Click to upload
                    </div>
                    <div style={{
                      fontSize: '0.8rem',
                      color: 'var(--text-tertiary)'
                    }}>
                      PNG, JPG, JPEG, or GIF (max 2MB)
                    </div>
                    <input
                      id="thumbnail-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      style={{ display: 'none' }}
                    />
                  </label>

                  {courseData.imageUrl && (
                    <button
                      onClick={() => setCourseData({ ...courseData, imageUrl: '' })}
                      style={{
                        marginTop: '1rem',
                        padding: '0.5rem 1rem',
                        background: 'transparent',
                        border: '1px solid var(--error)',
                        color: 'var(--error)',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '0.85rem'
                      }}
                    >
                      🗑️ Remove image
                    </button>
                  )}
                </div>

                {/* Preview */}
                <div>
                  <div style={{
                    fontSize: '0.85rem',
                    fontWeight: '500',
                    color: 'var(--text-tertiary)',
                    marginBottom: '0.5rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}>
                    Preview
                  </div>
                  <div style={{
                    width: '100%',
                    aspectRatio: '16/9',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-primary)',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {courseData.imageUrl ? (
                      <img
                        src={courseData.imageUrl}
                        alt="Course thumbnail preview"
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover'
                        }}
                      />
                    ) : (
                      <div style={{
                        textAlign: 'center',
                        color: 'var(--text-muted)',
                        padding: '1rem'
                      }}>
                        <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>🖼️</div>
                        <div style={{ fontSize: '0.85rem' }}>No image yet</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ══════════ STEP 4: MODULES ══════════ */}
          {step === 4 && (
            <div>
              <h2 style={{
                fontSize: '1.2rem',
                color: 'var(--text-primary)',
                marginBottom: '0.5rem'
              }}>
                Course content
              </h2>
              <p style={{
                color: 'var(--text-tertiary)',
                fontSize: '0.9rem',
                marginBottom: '1.5rem'
              }}>
                Organize your course into modules. Add lessons to each module.
              </p>

              {/* Add Module Form */}
              <div style={{
                padding: '1.25rem',
                background: 'var(--bg-secondary)',
                borderRadius: '12px',
                border: '1px solid var(--border-primary)',
                marginBottom: '1.5rem'
              }}>
                <h3 style={{
                  fontSize: '1rem',
                  color: 'var(--text-primary)',
                  marginBottom: '1rem',
                  fontWeight: '600'
                }}>
                  ➕ Add a new module
                </h3>
                <input
                  type="text"
                  value={newModuleTitle}
                  onChange={(e) => setNewModuleTitle(e.target.value)}
                  placeholder="Module title (e.g., Introduction)"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border-input)',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    color: 'var(--text-primary)',
                    outline: 'none',
                    marginBottom: '0.75rem'
                  }}
                />
                <input
                  type="text"
                  value={newModuleDesc}
                  onChange={(e) => setNewModuleDesc(e.target.value)}
                  placeholder="Short description (optional)"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border-input)',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    color: 'var(--text-primary)',
                    outline: 'none',
                    marginBottom: '1rem'
                  }}
                />
                <button
                  onClick={handleAddModule}
                  disabled={saving}
                  style={{
                    padding: '0.6rem 1.5rem',
                    background: '#6c5ce7',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: saving ? 'not-allowed' : 'pointer',
                    fontWeight: '500',
                    fontSize: '0.9rem',
                    opacity: saving ? 0.7 : 1
                  }}
                >
                  {saving ? 'Adding...' : 'Add Module'}
                </button>
              </div>

              {/* Modules List */}
              {modules.length === 0 ? (
                <div style={{
                  padding: '3rem',
                  textAlign: 'center',
                  background: 'var(--bg-secondary)',
                  borderRadius: '12px',
                  border: '2px dashed var(--border-primary)',
                  color: 'var(--text-tertiary)'
                }}>
                  <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>📚</div>
                  <p style={{ margin: 0 }}>No modules yet. Add your first module above!</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {modules.map((mod, idx) => (
                    <div
                      key={mod.id}
                      style={{
                        background: 'var(--bg-secondary)',
                        border: '1px solid var(--border-primary)',
                        borderRadius: '12px',
                        overflow: 'hidden'
                      }}
                    >
                      {/* Module header */}
                      <div style={{
                        padding: '1rem 1.25rem',
                        background: 'var(--bg-tertiary)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: '1rem',
                        flexWrap: 'wrap'
                      }}>
                        <div style={{ flex: 1, minWidth: '200px' }}>
                          <div style={{
                            fontSize: '0.7rem',
                            color: 'var(--text-tertiary)',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                            marginBottom: '0.25rem'
                          }}>
                            Module {idx + 1}
                          </div>
                          <div style={{
                            fontSize: '1rem',
                            fontWeight: '600',
                            color: 'var(--text-primary)'
                          }}>
                            {mod.title}
                          </div>
                          {mod.description && (
                            <div style={{
                              fontSize: '0.85rem',
                              color: 'var(--text-tertiary)',
                              marginTop: '0.15rem'
                            }}>
                              {mod.description}
                            </div>
                          )}
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                          <span style={{
                            fontSize: '0.75rem',
                            color: 'var(--text-tertiary)',
                            padding: '0.25rem 0.6rem',
                            background: 'var(--bg-card)',
                            borderRadius: '12px'
                          }}>
                            {mod.lessons?.length || 0} lessons
                          </span>
                          <button
                            onClick={() => {
                              setAddingLessonTo(addingLessonTo === mod.id ? null : mod.id);
                              setNewLessonTitle('');
                            }}
                            style={{
                              padding: '0.4rem 0.9rem',
                              background: '#6c5ce7',
                              color: 'white',
                              border: 'none',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              fontSize: '0.8rem',
                              fontWeight: '500'
                            }}
                          >
                            + Lesson
                          </button>
                          <button
                            onClick={() => handleDeleteModule(mod.id)}
                            style={{
                              padding: '0.4rem 0.6rem',
                              background: 'transparent',
                              color: 'var(--error)',
                              border: '1px solid var(--error)',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              fontSize: '0.8rem'
                            }}
                            title="Delete module"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>

                      {/* Lessons list */}
                      <div style={{ padding: '0.75rem 1.25rem 1rem' }}>
                        {(mod.lessons || []).length === 0 ? (
                          <div style={{
                            padding: '1rem 0',
                            textAlign: 'center',
                            color: 'var(--text-muted)',
                            fontSize: '0.85rem'
                          }}>
                            No lessons yet
                          </div>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                            {mod.lessons.map((lesson, li) => (
                              <div
                                key={lesson.id}
                                style={{
                                  padding: '0.6rem 0.75rem',
                                  background: 'var(--bg-card)',
                                  borderRadius: '8px',
                                  border: '1px solid var(--border-primary)',
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                  gap: '0.75rem'
                                }}
                              >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, minWidth: 0 }}>
                                  <span style={{
                                    width: '24px',
                                    height: '24px',
                                    borderRadius: '50%',
                                    background: '#f0eeff',
                                    color: '#6c5ce7',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '0.7rem',
                                    fontWeight: '600',
                                    flexShrink: 0
                                  }}>
                                    {li + 1}
                                  </span>
                                  <span style={{
                                    fontSize: '0.9rem',
                                    color: 'var(--text-primary)',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap'
                                  }}>
                                    {lesson.title}
                                  </span>
                                  <span style={{
                                    fontSize: '0.75rem',
                                    color: 'var(--text-muted)',
                                    whiteSpace: 'nowrap'
                                  }}>
                                    {lesson.duration}
                                  </span>
                                </div>
                                <button
                                  onClick={() => handleDeleteLesson(mod.id, lesson.id)}
                                  style={{
                                    padding: '0.25rem 0.5rem',
                                    background: 'transparent',
                                    color: 'var(--error)',
                                    border: 'none',
                                    cursor: 'pointer',
                                    fontSize: '0.9rem',
                                    flexShrink: 0
                                  }}
                                  title="Delete lesson"
                                >
                                  ✕
                                </button>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Add lesson form (when active) */}
                        {addingLessonTo === mod.id && (
                          <div style={{
                            marginTop: '0.75rem',
                            padding: '0.75rem',
                            background: 'var(--bg-card)',
                            borderRadius: '8px',
                            border: '1px solid #6c5ce7'
                          }}>
                            <input
                              type="text"
                              value={newLessonTitle}
                              onChange={(e) => setNewLessonTitle(e.target.value)}
                              placeholder="Lesson title"
                              autoFocus
                              style={{
                                width: '100%',
                                padding: '0.6rem',
                                background: 'var(--bg-input)',
                                border: '1px solid var(--border-input)',
                                borderRadius: '6px',
                                fontSize: '0.9rem',
                                color: 'var(--text-primary)',
                                outline: 'none',
                                marginBottom: '0.5rem'
                              }}
                              onKeyPress={(e) => {
                                if (e.key === 'Enter') handleAddLesson(mod.id);
                              }}
                            />
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                              <input
                                type="text"
                                value={newLessonDuration}
                                onChange={(e) => setNewLessonDuration(e.target.value)}
                                placeholder="10 min"
                                style={{
                                  flex: 1,
                                  padding: '0.6rem',
                                  background: 'var(--bg-input)',
                                  border: '1px solid var(--border-input)',
                                  borderRadius: '6px',
                                  fontSize: '0.9rem',
                                  color: 'var(--text-primary)',
                                  outline: 'none'
                                }}
                              />
                              <button
                                onClick={() => handleAddLesson(mod.id)}
                                disabled={saving}
                                style={{
                                  padding: '0.6rem 1.2rem',
                                  background: '#6c5ce7',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '6px',
                                  cursor: saving ? 'not-allowed' : 'pointer',
                                  fontSize: '0.85rem',
                                  fontWeight: '500',
                                  opacity: saving ? 0.7 : 1
                                }}
                              >
                                {saving ? '...' : 'Add'}
                              </button>
                              <button
                                onClick={() => setAddingLessonTo(null)}
                                style={{
                                  padding: '0.6rem 0.9rem',
                                  background: 'transparent',
                                  color: 'var(--text-tertiary)',
                                  border: '1px solid var(--border-input)',
                                  borderRadius: '6px',
                                  cursor: 'pointer',
                                  fontSize: '0.85rem'
                                }}
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Summary */}
              {modules.length > 0 && (
                <div style={{
                  marginTop: '1.5rem',
                  padding: '1rem 1.25rem',
                  background: '#f0eeff',
                  borderRadius: '12px',
                  display: 'flex',
                  gap: '1.5rem',
                  flexWrap: 'wrap',
                  fontSize: '0.9rem'
                }}>
                  <span style={{ color: '#6c5ce7', fontWeight: '600' }}>
                    📚 {modules.length} modules
                  </span>
                  <span style={{ color: '#6c5ce7', fontWeight: '600' }}>
                    🎬 {totalLessons} lessons
                  </span>
                </div>
              )}
            </div>
          )}

          {/* ══════════ STEP 5: REVIEW & PUBLISH ══════════ */}
          {step === 5 && (
            <div>
              <h2 style={{
                fontSize: '1.2rem',
                color: 'var(--text-primary)',
                marginBottom: '0.5rem'
              }}>
                Review & publish
              </h2>
              <p style={{
                color: 'var(--text-tertiary)',
                fontSize: '0.9rem',
                marginBottom: '1.5rem'
              }}>
                Make sure everything looks good before publishing your course.
              </p>

              {/* Course preview card */}
              <div style={{
                padding: '1.5rem',
                background: 'var(--bg-secondary)',
                borderRadius: '16px',
                border: '1px solid var(--border-primary)',
                marginBottom: '1.5rem'
              }}>
                <div style={{
                  display: 'flex',
                  gap: '1.25rem',
                  flexWrap: 'wrap',
                  marginBottom: '1.25rem'
                }}>
                  {/* Thumbnail */}
                  <div style={{
                    width: '160px',
                    height: '90px',
                    borderRadius: '10px',
                    background: courseData.imageUrl ? 'transparent' : 'linear-gradient(135deg, #6c5ce7, #a29bfe)',
                    overflow: 'hidden',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: '2rem',
                    flexShrink: 0
                  }}>
                    {courseData.imageUrl ? (
                      <img
                        src={courseData.imageUrl}
                        alt="thumbnail"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      '📚'
                    )}
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: '200px' }}>
                    <h3 style={{
                      fontSize: '1.2rem',
                      color: 'var(--text-primary)',
                      marginBottom: '0.5rem'
                    }}>
                      {courseData.title}
                    </h3>
                    <p style={{
                      fontSize: '0.9rem',
                      color: 'var(--text-secondary)',
                      marginBottom: '0.75rem'
                    }}>
                      {courseData.description?.substring(0, 150)}...
                    </p>
                    <div style={{
                      display: 'flex',
                      gap: '1rem',
                      flexWrap: 'wrap',
                      fontSize: '0.85rem',
                      color: 'var(--text-tertiary)'
                    }}>
                      <span>📁 {courseData.category}</span>
                      <span>📊 {courseData.difficultyLevel}</span>
                      <span>⏱️ {courseData.duration}</span>
                      <span>💰 {courseData.price === 0 ? 'Free' : `$${courseData.price}`}</span>
                    </div>
                  </div>
                </div>

                {/* Stats */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: '0.75rem',
                  paddingTop: '1.25rem',
                  borderTop: '1px solid var(--border-primary)'
                }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#6c5ce7' }}>
                      {modules.length}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>
                      Modules
                    </div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#6c5ce7' }}>
                      {totalLessons}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>
                      Lessons
                    </div>
                  </div>
                </div>
              </div>

              {/* Checklist */}
              <div style={{
                padding: '1.25rem',
                background: 'var(--bg-secondary)',
                borderRadius: '12px',
                border: '1px solid var(--border-primary)',
                marginBottom: '1.5rem'
              }}>
                <h3 style={{
                  fontSize: '0.95rem',
                  fontWeight: '600',
                  color: 'var(--text-primary)',
                  marginBottom: '0.75rem'
                }}>
                  ✅ Pre-publish checklist
                </h3>
                <ul style={{
                  listStyle: 'none',
                  padding: 0,
                  margin: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem'
                }}>
                  <li style={{
                    fontSize: '0.9rem',
                    color: courseData.title ? 'var(--success)' : 'var(--text-tertiary)'
                  }}>
                    {courseData.title ? '✅' : '⬜'} Course has a title
                  </li>
                  <li style={{
                    fontSize: '0.9rem',
                    color: courseData.description ? 'var(--success)' : 'var(--text-tertiary)'
                  }}>
                    {courseData.description ? '✅' : '⬜'} Course has a description
                  </li>
                  <li style={{
                    fontSize: '0.9rem',
                    color: courseData.imageUrl ? 'var(--success)' : 'var(--text-tertiary)'
                  }}>
                    {courseData.imageUrl ? '✅' : '⬜'} Course has a thumbnail
                  </li>
                  <li style={{
                    fontSize: '0.9rem',
                    color: modules.length > 0 ? 'var(--success)' : 'var(--text-tertiary)'
                  }}>
                    {modules.length > 0 ? '✅' : '⬜'} At least one module added
                  </li>
                  <li style={{
                    fontSize: '0.9rem',
                    color: totalLessons > 0 ? 'var(--success)' : 'var(--text-tertiary)'
                  }}>
                    {totalLessons > 0 ? '✅' : '⬜'} At least one lesson added
                  </li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Footer with actions */}
        <div style={{
          padding: '1.25rem clamp(1.5rem, 3vw, 2rem)',
          borderTop: '1px solid var(--border-primary)',
          background: 'var(--bg-secondary)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '1rem',
          flexWrap: 'wrap'
        }}>
          <button
            onClick={goBack}
            disabled={step === 1 || saving || loading}
            style={{
              padding: '0.7rem 1.5rem',
              background: 'transparent',
              color: step === 1 ? 'var(--text-muted)' : 'var(--text-primary)',
              border: '1px solid var(--border-input)',
              borderRadius: '10px',
              cursor: step === 1 ? 'not-allowed' : 'pointer',
              fontSize: '0.95rem',
              fontWeight: '500',
              opacity: step === 1 ? 0.5 : 1
            }}
          >
            ← Back
          </button>

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            {step < 5 ? (
              <button
                onClick={goNext}
                disabled={saving || loading}
                style={{
                  padding: '0.7rem 2rem',
                  background: saving ? '#a29bfe' : '#6c5ce7',
                  color: 'white',
                  border: 'none',
                  borderRadius: '10px',
                  cursor: saving ? 'not-allowed' : 'pointer',
                  fontSize: '0.95rem',
                  fontWeight: '600',
                  boxShadow: '0 4px 12px rgba(108,92,231,0.3)',
                  opacity: saving ? 0.7 : 1
                }}
              >
                {saving ? 'Saving...' : 'Save & Continue →'}
              </button>
            ) : (
              <button
                onClick={handlePublish}
                disabled={loading || saving || !courseData.title || modules.length === 0 || totalLessons === 0}
                style={{
                  padding: '0.7rem 2rem',
                  background: (loading || saving || !courseData.title || modules.length === 0 || totalLessons === 0)
                    ? '#a29bfe'
                    : '#34d399',
                  color: 'white',
                  border: 'none',
                  borderRadius: '10px',
                  cursor: (loading || saving || !courseData.title || modules.length === 0 || totalLessons === 0)
                    ? 'not-allowed'
                    : 'pointer',
                  fontSize: '0.95rem',
                  fontWeight: '600',
                  boxShadow: '0 4px 12px rgba(52,211,153,0.3)',
                  opacity: (loading || saving || !courseData.title || modules.length === 0 || totalLessons === 0) ? 0.6 : 1
                }}
              >
                {loading ? 'Publishing...' : '🚀 Publish Course'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default CreateCourse;