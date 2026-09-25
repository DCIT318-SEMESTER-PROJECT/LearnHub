import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import ConfirmDialog from '../components/common/ConfirmDialog';
import QuizGeneratorModal from '../components/common/QuizGeneratorModal';
import OutlineImporterModal from '../components/common/OutlineImporterModal';
import api from '../api/axiosConfig';
import { saveQuiz } from '../api/quizAPI';
import {
  createCourse,
  updateCourse,
  getCourseForEdit,
  addModule,
  deleteModule,
  addLesson,
  updateLesson,
  deleteLesson,
  publishCourse,
  bulkCreateModules,
} from '../api/coursesAPI';

const CATEGORIES = [
  'Web Development', 'Programming', 'Data Science', 'Design',
  'Mobile Development', 'DevOps', 'Business', 'Marketing',
  'Photography', 'Music', 'Other',
];

const LEVELS = ['Beginner', 'Intermediate', 'Advanced'];
const LANGUAGES = ['English', 'Spanish', 'French', 'German', 'Chinese', 'Arabic', 'Other'];

const STEPS = [
  { num: 1, label: 'Basics',      icon: '📝' },
  { num: 2, label: 'Details',     icon: '⚙️' },
  { num: 3, label: 'Thumbnail',   icon: '🖼️' },
  { num: 4, label: 'Curriculum',  icon: '📚' },
  { num: 5, label: 'Publish',     icon: '🚀' },
];

const EMPTY_LESSON = { title: '', duration: '10 min', content: '' };

function CreateCourse() {
  const navigate = useNavigate();
  const { id: editCourseId } = useParams();
  const { user } = useAuth();
  const toast = useToast();
  const fileInputRef = useRef(null);

  const [step, setStep] = useState(1);
  const [courseId, setCourseId] = useState(editCourseId ? parseInt(editCourseId) : null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dragOver, setDragOver] = useState(false);

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
    imageUrl: '',
  });

  const [modules, setModules] = useState([]);
  const [newModuleTitle, setNewModuleTitle] = useState('');
  const [newModuleDesc, setNewModuleDesc] = useState('');

  const [lessonForm, setLessonForm] = useState(null);
  const [errors, setErrors] = useState({});
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [generatingDescription, setGeneratingDescription] = useState(false);

  const [generatingQuizFor, setGeneratingQuizFor] = useState(null);
  const [quizModal, setQuizModal] = useState(null);
  const [savingQuiz, setSavingQuiz] = useState(false);
  const [courseHasQuiz, setCourseHasQuiz] = useState(false);

  // Phase 3 — outline importer
  const [showOutlineImporter, setShowOutlineImporter] = useState(false);
  const [importingOutline, setImportingOutline] = useState(false);

  useEffect(() => {
    if (editCourseId) loadCourseForEdit();
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
        imageUrl: data.imageUrl || '',
      });
      setModules(data.modules || []);
      setCourseId(data.id);

      try {
        const { getQuizByCourse } = await import('../api/quizAPI');
        const quizRes = await getQuizByCourse(data.id);
        if (quizRes.data?.questions?.length > 0) setCourseHasQuiz(true);
      } catch (_) {}
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

  const handleGenerateDescription = async () => {
    if (!courseData.title.trim()) {
      toast.error('Type a course title first');
      return;
    }
    try {
      setGeneratingDescription(true);
      const { data } = await api.post('/ai/generate-description', {
        title: courseData.title,
        category: courseData.category,
        level: courseData.difficultyLevel,
      });
      setCourseData((prev) => ({ ...prev, description: data.description }));
      toast.success('Description generated — edit as you like');
    } catch (err) {
      console.error('AI error:', err);
      toast.error(err.response?.data?.error || 'AI generation failed');
    } finally {
      setGeneratingDescription(false);
    }
  };

  // ─── AI quiz ────────────────────────────────────────────
  const handleGenerateQuiz = async (lesson) => {
    if (!lesson.content || !lesson.content.trim()) {
      toast.error('This lesson has no content yet — add content first');
      return;
    }
    if (!courseId) {
      toast.error('Save basics first');
      return;
    }

    try {
      setGeneratingQuizFor(lesson.id);
      const { data } = await api.post('/ai/generate-quiz', {
        lessonTitle: lesson.title,
        lessonContent: lesson.content,
        courseCategory: courseData.category,
        questionCount: 5,
      });

      setQuizModal({ lessonId: lesson.id, questions: data.questions, mode: 'ai' });
    } catch (err) {
      console.error('AI quiz error:', err);
      toast.error(err.response?.data?.error || 'Failed to generate quiz');
    } finally {
      setGeneratingQuizFor(null);
    }
  };

  // ─── Manual quiz ────────────────────────────────────────
  const handleWriteManualQuiz = () => {
    if (!courseId) {
      toast.error('Save basics first');
      return;
    }
    setQuizModal({
      lessonId: null,
      mode: 'manual',
      questions: [
        {
          id: `q-manual-${Date.now()}`,
          question: '',
          option1: '',
          option2: '',
          option3: '',
          option4: '',
          correctOption: 0,
        },
      ],
    });
  };

  const handleSaveQuiz = async (questions) => {
    if (!courseId) return;
    try {
      setSavingQuiz(true);
      await saveQuiz(courseId, questions, `${courseData.title || 'Course'} Quiz`);
      setCourseHasQuiz(true);
      setQuizModal(null);
      toast.success(`Quiz saved — ${questions.length} question${questions.length === 1 ? '' : 's'}`);
    } catch (err) {
      console.error('Save quiz error:', err);
      toast.error(err.response?.data?.error || 'Failed to save quiz');
    } finally {
      setSavingQuiz(false);
    }
  };

  // ─── Phase 3: outline import ────────────────────────────
  const handleImportOutline = async (outlineModules) => {
    if (!courseId) return toast.error('Save basics first');
    try {
      setImportingOutline(true);
      const { data } = await bulkCreateModules(courseId, outlineModules);
      const fresh = await getCourseForEdit(courseId);
      setModules(fresh.data.modules || []);
      setShowOutlineImporter(false);
      toast.success(`Imported ${data.created} modules · ${data.totalLessons} lessons`);
    } catch (err) {
      console.error('Import error:', err);
      toast.error(err.response?.data?.error || 'Failed to import modules');
    } finally {
      setImportingOutline(false);
    }
  };

  const handleImageFile = (file) => {
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
      setCourseData((prev) => ({ ...prev, imageUrl: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  const handleImageUpload = (e) => handleImageFile(e.target.files[0]);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    handleImageFile(e.dataTransfer.files?.[0]);
  };

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
        toast.success('Course created');
      } else {
        await updateCourse(courseId, courseData);
        toast.success('Basics saved');
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

  const saveDetails = async () => {
    if (!courseId) {
      toast.error('Save basics first');
      return false;
    }
    try {
      setSaving(true);
      await updateCourse(courseId, courseData);
      toast.success('Details saved');
      return true;
    } catch (err) {
      toast.error('Failed to save details');
      return false;
    } finally {
      setSaving(false);
    }
  };

  const saveThumbnail = async () => {
    if (!courseId) {
      toast.error('Save basics first');
      return false;
    }
    try {
      setSaving(true);
      await updateCourse(courseId, { imageUrl: courseData.imageUrl });
      toast.success('Thumbnail saved');
      return true;
    } catch (err) {
      toast.error('Failed to save thumbnail');
      return false;
    } finally {
      setSaving(false);
    }
  };

  const handleAddModule = async () => {
    if (!newModuleTitle.trim()) return toast.error('Module title is required');
    if (!courseId) return toast.error('Save basics first');
    try {
      setSaving(true);
      const response = await addModule(courseId, {
        title: newModuleTitle,
        description: newModuleDesc,
      });
      setModules([...modules, { ...response.data, lessons: [] }]);
      setNewModuleTitle('');
      setNewModuleDesc('');
      toast.success('Module added');
    } catch (err) {
      toast.error('Failed to add module');
    } finally {
      setSaving(false);
    }
  };

  const openAddLesson = (moduleId) => {
    setLessonForm({ mode: 'add', moduleId, data: { ...EMPTY_LESSON } });
  };

  const openEditLesson = (moduleId, lesson) => {
    setLessonForm({
      mode: 'edit',
      moduleId,
      lessonId: lesson.id,
      data: {
        title: lesson.title || '',
        duration: lesson.duration || '10 min',
        content: lesson.content || '',
      },
    });
  };

  const closeLessonForm = () => setLessonForm(null);

  const handleLessonFormChange = (field, value) => {
    setLessonForm((f) => (f ? { ...f, data: { ...f.data, [field]: value } } : f));
  };

  const submitLessonForm = async () => {
    if (!lessonForm) return;
    const { mode, moduleId, lessonId, data } = lessonForm;

    if (!data.title.trim()) return toast.error('Lesson title is required');

    try {
      setSaving(true);

      if (mode === 'add') {
        const response = await addLesson(courseId, {
          moduleId,
          title: data.title,
          duration: data.duration,
          content: data.content,
          isFree: 1,
        });
        setModules(
          modules.map((m) =>
            m.id === moduleId
              ? { ...m, lessons: [...(m.lessons || []), response.data] }
              : m
          )
        );
        toast.success('Lesson added');
      } else {
        const response = await updateLesson(lessonId, {
          title: data.title,
          duration: data.duration,
          content: data.content,
        });
        setModules(
          modules.map((m) =>
            m.id === moduleId
              ? {
                  ...m,
                  lessons: (m.lessons || []).map((l) =>
                    l.id === lessonId ? { ...l, ...response.data } : l
                  ),
                }
              : m
          )
        );
        toast.success('Lesson updated');
      }

      setLessonForm(null);
    } catch (err) {
      console.error('Error saving lesson:', err);
      toast.error(err.response?.data?.error || 'Failed to save lesson');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteModule = (moduleId) => {
    setConfirmDelete({ type: 'module', moduleId });
  };

  const handleDeleteLesson = (moduleId, lessonId) => {
    setConfirmDelete({ type: 'lesson', moduleId, lessonId });
  };

  const performDelete = async () => {
    if (!confirmDelete) return;
    const { type, moduleId, lessonId } = confirmDelete;
    setConfirmDelete(null);

    try {
      if (type === 'module') {
        await deleteModule(moduleId);
        setModules(modules.filter((m) => m.id !== moduleId));
        toast.success('Module deleted');
      } else {
        await deleteLesson(lessonId);
        setModules(
          modules.map((m) =>
            m.id === moduleId
              ? { ...m, lessons: (m.lessons || []).filter((l) => l.id !== lessonId) }
              : m
          )
        );
        toast.success('Lesson deleted');
      }
    } catch (err) {
      toast.error(`Failed to delete ${type}`);
    }
  };

  const goNext = async () => {
    if (step === 1) { if (await saveBasicInfo()) setStep(2); }
    else if (step === 2) { if (await saveDetails()) setStep(3); }
    else if (step === 3) { if (await saveThumbnail()) setStep(4); }
    else if (step === 4) { setStep(5); }
  };

  const goBack = () => { if (step > 1) setStep(step - 1); };

  const handlePublish = async () => {
    if (!courseId) return toast.error('Course not saved');
    if (modules.length === 0) return toast.error('Add at least one module before publishing');
    const hasLessons = modules.some((m) => m.lessons && m.lessons.length > 0);
    if (!hasLessons) return toast.error('Add at least one lesson before publishing');

    try {
      setLoading(true);
      await publishCourse(courseId);
      toast.success('Course published');
      setTimeout(() => navigate(`/courses/${courseId}`), 800);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to publish');
    } finally {
      setLoading(false);
    }
  };

  const totalLessons = modules.reduce((sum, m) => sum + (m.lessons?.length || 0), 0);
  const lessonsWithContent = modules.reduce(
    (sum, m) => sum + (m.lessons || []).filter((l) => l.content && l.content.trim()).length,
    0
  );

  const label = {
    display: 'block',
    marginBottom: '0.45rem',
    fontWeight: 600,
    color: 'var(--text-primary)',
    fontSize: '0.85rem',
  };

  const input = {
    width: '100%',
    padding: '0.75rem 0.9rem',
    background: 'var(--bg-input)',
    border: '1px solid var(--border-input)',
    borderRadius: '10px',
    fontSize: '0.95rem',
    color: 'var(--text-primary)',
    outline: 'none',
    transition: 'border-color 0.15s, box-shadow 0.15s',
  };

  const fieldset = { marginBottom: '1.25rem' };

  return (
    <div style={{ maxWidth: '960px', margin: '2rem auto', padding: '0 clamp(1rem, 3vw, 2rem)', width: '100%' }}>
      <Link
        to="/dashboard"
        style={{
          color: 'var(--text-secondary)',
          textDecoration: 'none',
          fontSize: '0.9rem',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.4rem',
          marginBottom: '1.5rem',
          fontWeight: 500,
        }}
      >
        ← Back to Dashboard
      </Link>

      <div style={{
        background: 'var(--bg-card)',
        borderRadius: '20px',
        border: '1px solid var(--border-primary)',
        boxShadow: 'var(--shadow-card)',
        overflow: 'hidden',
      }}>
        {/* HEADER */}
        <div style={{ padding: 'clamp(1.25rem, 3vw, 2rem)', borderBottom: '1px solid var(--border-primary)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
            <div>
              <h1 style={{ fontSize: 'clamp(1.3rem, 2.5vw, 1.6rem)', color: 'var(--text-primary)', margin: 0, fontWeight: 700 }}>
                {editCourseId ? '✏️ Edit Course' : '🎬 Create a New Course'}
              </h1>
              <p style={{ color: 'var(--text-tertiary)', fontSize: '0.88rem', margin: '0.35rem 0 0' }}>
                Step {step} of {STEPS.length} · {STEPS[step - 1].label}
              </p>
            </div>
            <span style={{
              padding: '0.4rem 0.9rem',
              background: 'var(--accent-light)',
              color: '#6c5ce7',
              borderRadius: '20px',
              fontSize: '0.78rem',
              fontWeight: 700,
              whiteSpace: 'nowrap',
            }}>
              {Math.round((step / STEPS.length) * 100)}%
            </span>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            {STEPS.map((s, i) => {
              const done = s.num < step;
              const active = s.num === step;
              return (
                <React.Fragment key={s.num}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    padding: '0.4rem 0.7rem',
                    borderRadius: '20px',
                    background: active ? 'var(--accent-light)' : done ? 'var(--bg-tertiary)' : 'transparent',
                    border: `1px solid ${active ? '#6c5ce7' : 'transparent'}`,
                    flexShrink: 0,
                  }}>
                    <span style={{
                      width: '22px',
                      height: '22px',
                      borderRadius: '50%',
                      background: done ? '#34d399' : active ? '#6c5ce7' : 'var(--bg-tertiary)',
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      flexShrink: 0,
                    }}>
                      {done ? '✓' : s.num}
                    </span>
                    <span
                      style={{
                        fontSize: '0.78rem',
                        fontWeight: active ? 700 : 500,
                        color: active ? '#6c5ce7' : done ? 'var(--text-secondary)' : 'var(--text-tertiary)',
                        whiteSpace: 'nowrap',
                      }}
                      className="stepper-label"
                    >
                      {s.label}
                    </span>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div style={{ flex: 1, height: '2px', background: done ? '#34d399' : 'var(--border-primary)', minWidth: '8px' }} />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* BODY */}
        <div style={{ padding: 'clamp(1.5rem, 3vw, 2rem)' }}>

          {/* STEP 1 — BASICS */}
          {step === 1 && (
            <div>
              <SectionHeading title="Let's start with the basics" subtitle="Give your course a clear title and description. You can edit these later." />

              <div style={fieldset}>
                <label style={label}>Course Title *</label>
                <input
                  type="text"
                  name="title"
                  value={courseData.title}
                  onChange={handleChange}
                  placeholder="e.g., Master React from Scratch"
                  maxLength={100}
                  style={{ ...input, borderColor: errors.title ? 'var(--error)' : 'var(--border-input)' }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.35rem' }}>
                  {errors.title
                    ? <span style={{ color: 'var(--error)', fontSize: '0.78rem' }}>{errors.title}</span>
                    : <span />}
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{courseData.title.length}/100</span>
                </div>
              </div>

              <div style={fieldset}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '0.45rem',
                  gap: '0.5rem',
                  flexWrap: 'wrap',
                }}>
                  <label style={{ ...label, marginBottom: 0 }}>Description *</label>
                  <button
                    type="button"
                    onClick={handleGenerateDescription}
                    disabled={generatingDescription || !courseData.title.trim()}
                    style={{
                      padding: '0.35rem 0.75rem',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      background: 'var(--accent-light)',
                      color: '#6c5ce7',
                      border: '1px solid transparent',
                      borderRadius: '8px',
                      cursor: generatingDescription || !courseData.title.trim() ? 'not-allowed' : 'pointer',
                      opacity: generatingDescription || !courseData.title.trim() ? 0.55 : 1,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                    }}
                  >
                    {generatingDescription ? '✨ Generating…' : '✨ Generate with AI'}
                  </button>
                </div>

                <textarea
                  name="description"
                  value={courseData.description}
                  onChange={handleChange}
                  rows={5}
                  maxLength={500}
                  placeholder="Describe what students will learn, who it's for, and what makes it special…"
                  style={{
                    ...input,
                    fontFamily: 'inherit',
                    resize: 'vertical',
                    borderColor: errors.description ? 'var(--error)' : 'var(--border-input)',
                  }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.35rem' }}>
                  {errors.description
                    ? <span style={{ color: 'var(--error)', fontSize: '0.78rem' }}>{errors.description}</span>
                    : <span />}
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{courseData.description.length}/500</span>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))', gap: '1rem' }}>
                <div>
                  <label style={label}>Category</label>
                  <select name="category" value={courseData.category} onChange={handleChange} style={{ ...input, cursor: 'pointer' }}>
                    {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label style={label}>Difficulty Level</label>
                  <select name="difficultyLevel" value={courseData.difficultyLevel} onChange={handleChange} style={{ ...input, cursor: 'pointer' }}>
                    {LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2 — DETAILS */}
          {step === 2 && (
            <div>
              <SectionHeading title="Course details" subtitle="Help students understand what to expect before enrolling." />

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
                <div>
                  <label style={label}>Duration</label>
                  <input type="text" name="duration" value={courseData.duration} onChange={handleChange} placeholder="10 hours" style={input} />
                </div>
                <div>
                  <label style={label}>Price (USD)</label>
                  <input type="number" name="price" value={courseData.price} onChange={handleChange} min="0" step="1" style={input} />
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>Set 0 for a free course</div>
                </div>
                <div>
                  <label style={label}>Language</label>
                  <select name="language" value={courseData.language} onChange={handleChange} style={{ ...input, cursor: 'pointer' }}>
                    {LANGUAGES.map((l) => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
              </div>

              <div style={fieldset}>
                <label style={label}>Prerequisites</label>
                <textarea
                  name="prerequisites"
                  value={courseData.prerequisites}
                  onChange={handleChange}
                  rows={2}
                  placeholder="What should students know before taking this course?"
                  style={{ ...input, fontFamily: 'inherit', resize: 'vertical' }}
                />
              </div>

              <div style={fieldset}>
                <label style={label}>Learning Outcomes</label>
                <textarea
                  name="learningOutcomes"
                  value={courseData.learningOutcomes}
                  onChange={handleChange}
                  rows={3}
                  placeholder="What will students be able to do after completing this course?"
                  style={{ ...input, fontFamily: 'inherit', resize: 'vertical' }}
                />
              </div>
            </div>
          )}

          {/* STEP 3 — THUMBNAIL */}
          {step === 3 && (
            <div>
              <SectionHeading title="Course thumbnail" subtitle="Add a striking cover image. Recommended 1280×720px, max 2MB." />

              <div
                style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.1fr) minmax(0, 1fr)', gap: '2rem', alignItems: 'start' }}
                className="thumb-grid"
              >
                <div>
                  {!courseData.imageUrl ? (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                      onDragLeave={() => setDragOver(false)}
                      onDrop={handleDrop}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => { if (e.key === 'Enter') fileInputRef.current?.click(); }}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '3rem 1.5rem',
                        background: dragOver ? 'var(--accent-light)' : 'var(--bg-secondary)',
                        border: `2px dashed ${dragOver ? '#6c5ce7' : 'var(--border-input)'}`,
                        borderRadius: '16px',
                        cursor: 'pointer',
                        textAlign: 'center',
                        transition: 'all 0.15s',
                      }}
                    >
                      <div style={{
                        width: '64px',
                        height: '64px',
                        borderRadius: '50%',
                        background: 'var(--accent-light)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1.8rem',
                        marginBottom: '0.85rem',
                      }}>
                        🖼️
                      </div>
                      <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                        {dragOver ? 'Drop to upload' : 'Drag & drop an image'}
                      </div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)', marginBottom: '1rem' }}>
                        or click to browse your files
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        PNG · JPG · JPEG · GIF — max 2MB
                      </div>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        style={{ display: 'none' }}
                      />
                    </div>
                  ) : (
                    <div>
                      <div style={{
                        position: 'relative',
                        width: '100%',
                        aspectRatio: '16 / 9',
                        borderRadius: '16px',
                        overflow: 'hidden',
                        border: '1px solid var(--border-primary)',
                        background: 'var(--bg-secondary)',
                      }}>
                        <img
                          src={courseData.imageUrl}
                          alt="Course thumbnail"
                          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                        />
                        <button
                          onClick={() => setCourseData({ ...courseData, imageUrl: '' })}
                          title="Remove image"
                          style={{
                            position: 'absolute',
                            top: '10px',
                            right: '10px',
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            background: 'rgba(0,0,0,0.65)',
                            color: 'white',
                            border: 'none',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.9rem',
                            backdropFilter: 'blur(6px)',
                          }}
                        >
                          ✕
                        </button>
                      </div>

                      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.85rem', flexWrap: 'wrap' }}>
                        <button onClick={() => fileInputRef.current?.click()} style={btnGhost}>
                          🔄 Replace
                        </button>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          style={{ display: 'none' }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <div style={{
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    color: 'var(--text-tertiary)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    marginBottom: '0.6rem',
                  }}>
                    Course card preview
                  </div>

                  <div style={{
                    padding: '1rem',
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-primary)',
                    borderRadius: '14px',
                    boxShadow: 'var(--shadow-sm)',
                  }}>
                    <div style={{
                      width: '100%',
                      aspectRatio: '16 / 9',
                      borderRadius: '10px',
                      overflow: 'hidden',
                      background: courseData.imageUrl ? 'transparent' : 'linear-gradient(135deg, #6c5ce7, #a29bfe)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontSize: '2.5rem',
                      marginBottom: '0.75rem',
                    }}>
                      {courseData.imageUrl ? (
                        <img src={courseData.imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        '📚'
                      )}
                    </div>

                    <div style={{
                      fontSize: '0.9rem',
                      fontWeight: 700,
                      color: 'var(--text-primary)',
                      marginBottom: '0.35rem',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}>
                      {courseData.title || 'Your course title'}
                    </div>
                    <div style={{
                      fontSize: '0.78rem',
                      color: 'var(--text-tertiary)',
                      marginBottom: '0.6rem',
                      overflow: 'hidden',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                    }}>
                      {courseData.description || 'Short description will appear here…'}
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', fontSize: '0.72rem' }}>
                      <span style={chip}>📁 {courseData.category}</span>
                      <span style={chip}>📊 {courseData.difficultyLevel}</span>
                      <span style={chip}>💰 {courseData.price === 0 ? 'Free' : `$${courseData.price}`}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4 — CURRICULUM */}
          {step === 4 && (
            <div>
              <SectionHeading title="Build your curriculum" subtitle="Organize lessons into modules. Write real content — students will read it." />

              {/* Quick tools: Import + Quiz */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))',
                  gap: '0.85rem',
                  marginBottom: '1.5rem',
                }}
              >
                {/* Import from Text */}
                <div
                  style={{
                    padding: '1rem 1.1rem',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-primary)',
                    borderRadius: '14px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '0.75rem',
                    flexWrap: 'wrap',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', minWidth: 0, flex: 1 }}>
                    <span style={{ fontSize: '1.3rem', flexShrink: 0 }}>📖</span>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                        Import from Text
                      </div>
                      <div style={{ fontSize: '0.76rem', color: 'var(--text-tertiary)' }}>
                        AI splits a chapter into modules & lessons
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowOutlineImporter(true)}
                    disabled={!courseId}
                    title={!courseId ? 'Save basics first' : 'Import from text'}
                    style={{
                      padding: '0.5rem 1rem',
                      background: '#6c5ce7',
                      color: 'white',
                      border: 'none',
                      borderRadius: '10px',
                      cursor: !courseId ? 'not-allowed' : 'pointer',
                      fontWeight: 700,
                      fontSize: '0.82rem',
                      opacity: !courseId ? 0.6 : 1,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    📖 Import
                  </button>
                </div>

                {/* Course Quiz */}
                <div
                  style={{
                    padding: '1rem 1.1rem',
                    background: courseHasQuiz ? 'rgba(52,211,153,0.10)' : 'var(--bg-secondary)',
                    border: `1px solid ${courseHasQuiz ? 'rgba(52,211,153,0.4)' : 'var(--border-primary)'}`,
                    borderRadius: '14px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '0.75rem',
                    flexWrap: 'wrap',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', minWidth: 0, flex: 1 }}>
                    <span style={{ fontSize: '1.3rem', flexShrink: 0 }}>📝</span>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                        Course Quiz
                      </div>
                      <div style={{ fontSize: '0.76rem', color: 'var(--text-tertiary)' }}>
                        {courseHasQuiz ? 'A quiz is saved — rewrite any time' : 'Write your own quiz, or generate per lesson'}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={handleWriteManualQuiz}
                    disabled={!courseId}
                    title={!courseId ? 'Save basics first' : 'Write a quiz from scratch'}
                    style={{
                      padding: '0.5rem 1rem',
                      background: '#6c5ce7',
                      color: 'white',
                      border: 'none',
                      borderRadius: '10px',
                      cursor: !courseId ? 'not-allowed' : 'pointer',
                      fontWeight: 700,
                      fontSize: '0.82rem',
                      opacity: !courseId ? 0.6 : 1,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    📝 {courseHasQuiz ? 'Rewrite' : 'Write Quiz'}
                  </button>
                </div>
              </div>

              {/* New module form */}
              <div style={{
                padding: '1.25rem',
                background: 'var(--bg-secondary)',
                borderRadius: '14px',
                border: '1px solid var(--border-primary)',
                marginBottom: '1.5rem',
              }}>
                <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.85rem' }}>
                  ➕ New Module
                </div>
                <input
                  type="text"
                  value={newModuleTitle}
                  onChange={(e) => setNewModuleTitle(e.target.value)}
                  placeholder="Module title, e.g., Getting Started"
                  style={{ ...input, marginBottom: '0.6rem' }}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleAddModule(); }}
                />
                <input
                  type="text"
                  value={newModuleDesc}
                  onChange={(e) => setNewModuleDesc(e.target.value)}
                  placeholder="Optional short description"
                  style={{ ...input, marginBottom: '0.9rem' }}
                />
                <button
                  onClick={handleAddModule}
                  disabled={saving}
                  style={{ ...btnPrimary, opacity: saving ? 0.7 : 1 }}
                >
                  {saving ? 'Adding…' : '+ Add Module'}
                </button>
              </div>

              {modules.length === 0 ? (
                <div style={{
                  padding: '3rem 1.5rem',
                  textAlign: 'center',
                  background: 'var(--bg-secondary)',
                  borderRadius: '16px',
                  border: '2px dashed var(--border-primary)',
                  color: 'var(--text-tertiary)',
                }}>
                  <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>📚</div>
                  <p style={{ margin: 0, fontSize: '0.9rem' }}>No modules yet — add one above, or import from text.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  {modules.map((mod, idx) => (
                    <div key={mod.id} style={{
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--border-primary)',
                      borderRadius: '14px',
                      overflow: 'hidden',
                    }}>
                      <div style={{
                        padding: '0.85rem 1.1rem',
                        background: 'var(--bg-tertiary)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: '0.85rem',
                        flexWrap: 'wrap',
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, minWidth: '200px' }}>
                          <div style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '10px',
                            background: 'var(--accent-light)',
                            color: '#6c5ce7',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 700,
                            fontSize: '0.85rem',
                            flexShrink: 0,
                          }}>
                            {idx + 1}
                          </div>
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                              {mod.title}
                            </div>
                            {mod.description && (
                              <div style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)', marginTop: '0.1rem' }}>
                                {mod.description}
                              </div>
                            )}
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                          <span style={chip}>{mod.lessons?.length || 0} lessons</span>
                          <button onClick={() => openAddLesson(mod.id)} style={btnPrimarySm}>
                            + Lesson
                          </button>
                          <button onClick={() => handleDeleteModule(mod.id)} style={btnDangerSm} title="Delete module">
                            🗑️
                          </button>
                        </div>
                      </div>

                      <div style={{ padding: '0.75rem 1.1rem 1rem' }}>
                        {(mod.lessons || []).length === 0 ? (
                          <div style={{ padding: '0.75rem 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                            No lessons yet
                          </div>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                            {mod.lessons.map((lesson, li) => {
                              const hasContent = !!(lesson.content && lesson.content.trim());
                              const isEditing = lessonForm?.mode === 'edit' && lessonForm?.lessonId === lesson.id;
                              const isGenerating = generatingQuizFor === lesson.id;
                              return (
                                <div key={lesson.id}>
                                  <div style={{
                                    padding: '0.55rem 0.75rem',
                                    background: isEditing ? 'var(--accent-light)' : 'var(--bg-card)',
                                    borderRadius: '8px',
                                    border: `1px solid ${isEditing ? '#6c5ce7' : 'var(--border-primary)'}`,
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    gap: '0.75rem',
                                    flexWrap: 'wrap',
                                  }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flex: 1, minWidth: 0 }}>
                                      <span style={{
                                        width: '22px',
                                        height: '22px',
                                        borderRadius: '50%',
                                        background: 'var(--accent-light)',
                                        color: '#6c5ce7',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '0.68rem',
                                        fontWeight: 700,
                                        flexShrink: 0,
                                      }}>
                                        {li + 1}
                                      </span>
                                      <span style={{ fontSize: '0.88rem', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {lesson.title}
                                      </span>
                                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                                        {lesson.duration}
                                      </span>
                                      {hasContent ? (
                                        <span
                                          title="This lesson has content"
                                          style={{
                                            fontSize: '0.62rem',
                                            color: '#34d399',
                                            background: 'rgba(52,211,153,0.12)',
                                            padding: '0.1rem 0.5rem',
                                            borderRadius: '10px',
                                            fontWeight: 700,
                                            whiteSpace: 'nowrap',
                                          }}
                                        >
                                          ● Content
                                        </span>
                                      ) : (
                                        <span
                                          title="No content yet — students will only see the lesson title"
                                          style={{
                                            fontSize: '0.62rem',
                                            color: '#f59e0b',
                                            background: 'rgba(245,158,11,0.12)',
                                            padding: '0.1rem 0.5rem',
                                            borderRadius: '10px',
                                            fontWeight: 700,
                                            whiteSpace: 'nowrap',
                                          }}
                                        >
                                          ○ No content
                                        </span>
                                      )}
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.3rem', alignItems: 'center', flexWrap: 'wrap' }}>
                                      <button
                                        onClick={() => handleGenerateQuiz(lesson)}
                                        disabled={!hasContent || isGenerating}
                                        title={
                                          !hasContent
                                            ? 'Add lesson content first'
                                            : 'Generate a quiz from this lesson with AI'
                                        }
                                        style={{
                                          background: hasContent ? 'var(--accent-light)' : 'transparent',
                                          color: hasContent ? '#6c5ce7' : 'var(--text-muted)',
                                          border: '1px solid transparent',
                                          borderRadius: '6px',
                                          padding: '0.25rem 0.6rem',
                                          cursor: hasContent && !isGenerating ? 'pointer' : 'not-allowed',
                                          fontSize: '0.72rem',
                                          fontWeight: 700,
                                          opacity: !hasContent ? 0.5 : 1,
                                          whiteSpace: 'nowrap',
                                        }}
                                      >
                                        {isGenerating ? '✨ …' : '✨ AI Quiz'}
                                      </button>

                                      <button
                                        onClick={() => (isEditing ? closeLessonForm() : openEditLesson(mod.id, lesson))}
                                        title={isEditing ? 'Cancel editing' : 'Edit lesson'}
                                        style={{
                                          background: 'transparent',
                                          color: isEditing ? '#ef4444' : '#6c5ce7',
                                          border: '1px solid var(--border-primary)',
                                          borderRadius: '6px',
                                          padding: '0.25rem 0.55rem',
                                          cursor: 'pointer',
                                          fontSize: '0.72rem',
                                          fontWeight: 600,
                                        }}
                                      >
                                        {isEditing ? '✕ Close' : '✎ Edit'}
                                      </button>
                                      <button
                                        onClick={() => handleDeleteLesson(mod.id, lesson.id)}
                                        style={{
                                          background: 'transparent',
                                          color: 'var(--error)',
                                          border: 'none',
                                          cursor: 'pointer',
                                          fontSize: '0.9rem',
                                          padding: '0.2rem 0.4rem',
                                        }}
                                        title="Delete lesson"
                                      >
                                        ✕
                                      </button>
                                    </div>
                                  </div>

                                  {isEditing && (
                                    <LessonForm
                                      mode="edit"
                                      data={lessonForm.data}
                                      onChange={handleLessonFormChange}
                                      onSubmit={submitLessonForm}
                                      onCancel={closeLessonForm}
                                      saving={saving}
                                      inputStyle={input}
                                      labelStyle={label}
                                    />
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {lessonForm?.mode === 'add' && lessonForm?.moduleId === mod.id && (
                          <LessonForm
                            mode="add"
                            data={lessonForm.data}
                            onChange={handleLessonFormChange}
                            onSubmit={submitLessonForm}
                            onCancel={closeLessonForm}
                            saving={saving}
                            inputStyle={input}
                            labelStyle={label}
                          />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {modules.length > 0 && (
                <div style={{
                  marginTop: '1.25rem',
                  padding: '0.9rem 1.1rem',
                  background: 'var(--accent-light)',
                  borderRadius: '12px',
                  display: 'flex',
                  gap: '1.5rem',
                  flexWrap: 'wrap',
                  fontSize: '0.88rem',
                  fontWeight: 600,
                  color: '#6c5ce7',
                }}>
                  <span>📚 {modules.length} modules</span>
                  <span>🎬 {totalLessons} lessons</span>
                  <span>📝 {lessonsWithContent} with content</span>
                </div>
              )}
            </div>
          )}

          {/* STEP 5 — PUBLISH */}
          {step === 5 && (
            <div>
              <SectionHeading title="Review & publish" subtitle="One last look before your course goes live." />

              <div style={{
                padding: '1.5rem',
                background: 'var(--bg-secondary)',
                borderRadius: '16px',
                border: '1px solid var(--border-primary)',
                marginBottom: '1.5rem',
              }}>
                <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
                  <div style={{
                    width: '180px',
                    height: '101px',
                    borderRadius: '12px',
                    background: courseData.imageUrl ? 'transparent' : 'linear-gradient(135deg, #6c5ce7, #a29bfe)',
                    overflow: 'hidden',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: '2.2rem',
                    flexShrink: 0,
                  }}>
                    {courseData.imageUrl ? (
                      <img src={courseData.imageUrl} alt="thumbnail" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      '📚'
                    )}
                  </div>

                  <div style={{ flex: 1, minWidth: '200px' }}>
                    <h3 style={{ fontSize: '1.15rem', color: 'var(--text-primary)', margin: '0 0 0.4rem', fontWeight: 700 }}>
                      {courseData.title || 'Untitled course'}
                    </h3>
                    <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', margin: '0 0 0.75rem', lineHeight: 1.5 }}>
                      {courseData.description?.substring(0, 150)}…
                    </p>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', fontSize: '0.75rem' }}>
                      <span style={chip}>📁 {courseData.category}</span>
                      <span style={chip}>📊 {courseData.difficultyLevel}</span>
                      <span style={chip}>⏱️ {courseData.duration}</span>
                      <span style={chip}>💰 {courseData.price === 0 ? 'Free' : `$${courseData.price}`}</span>
                    </div>
                  </div>
                </div>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '0.75rem',
                  paddingTop: '1.25rem',
                  borderTop: '1px solid var(--border-primary)',
                }}>
                  <Stat label="Modules" value={modules.length} />
                  <Stat label="Lessons" value={totalLessons} />
                  <Stat label="Quiz" value={courseHasQuiz ? '✓' : '—'} />
                </div>
              </div>

              <div style={{
                padding: '1.25rem',
                background: 'var(--bg-secondary)',
                borderRadius: '14px',
                border: '1px solid var(--border-primary)',
              }}>
                <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.85rem' }}>
                  Pre-publish checklist
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
                  <Check ok={!!courseData.title} label="Course has a title" />
                  <Check ok={!!courseData.description} label="Course has a description" />
                  <Check ok={!!courseData.imageUrl} label="Course has a thumbnail" />
                  <Check ok={modules.length > 0} label="At least one module added" />
                  <Check ok={totalLessons > 0} label="At least one lesson added" />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div style={{
          padding: '1.1rem clamp(1.5rem, 3vw, 2rem)',
          borderTop: '1px solid var(--border-primary)',
          background: 'var(--bg-secondary)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '1rem',
          flexWrap: 'wrap',
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
              fontSize: '0.92rem',
              fontWeight: 500,
              opacity: step === 1 ? 0.5 : 1,
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
                  fontSize: '0.92rem',
                  fontWeight: 700,
                  boxShadow: '0 4px 12px rgba(108,92,231,0.3)',
                  opacity: saving ? 0.7 : 1,
                }}
              >
                {saving ? 'Saving…' : 'Save & Continue →'}
              </button>
            ) : (
              <button
                onClick={handlePublish}
                disabled={loading || saving || !courseData.title || modules.length === 0 || totalLessons === 0}
                style={{
                  padding: '0.7rem 2rem',
                  background: (loading || saving || !courseData.title || modules.length === 0 || totalLessons === 0) ? '#a29bfe' : '#34d399',
                  color: 'white',
                  border: 'none',
                  borderRadius: '10px',
                  cursor: (loading || saving || !courseData.title || modules.length === 0 || totalLessons === 0) ? 'not-allowed' : 'pointer',
                  fontSize: '0.92rem',
                  fontWeight: 700,
                  boxShadow: '0 4px 12px rgba(52,211,153,0.3)',
                  opacity: (loading || saving || !courseData.title || modules.length === 0 || totalLessons === 0) ? 0.6 : 1,
                }}
              >
                {loading ? 'Publishing…' : '🚀 Publish Course'}
              </button>
            )}
          </div>
        </div>
      </div>

      <ConfirmDialog
        isOpen={!!confirmDelete}
        title={confirmDelete?.type === 'module' ? 'Delete this module?' : 'Delete this lesson?'}
        message={
          confirmDelete?.type === 'module'
            ? 'Lessons inside this module will be unassigned. This cannot be undone.'
            : 'This lesson will be removed from your course. This cannot be undone.'
        }
        confirmLabel="Delete"
        danger
        onConfirm={performDelete}
        onCancel={() => setConfirmDelete(null)}
      />

      <QuizGeneratorModal
        isOpen={!!quizModal}
        questions={quizModal?.questions || []}
        mode={quizModal?.mode || 'ai'}
        onSave={handleSaveQuiz}
        onCancel={() => setQuizModal(null)}
        saving={savingQuiz}
      />

      <OutlineImporterModal
        isOpen={showOutlineImporter}
        courseTitle={courseData.title}
        courseCategory={courseData.category}
        onConfirm={handleImportOutline}
        onCancel={() => setShowOutlineImporter(false)}
        saving={importingOutline}
      />

      <style>{`
        @media (max-width: 720px) {
          .thumb-grid { grid-template-columns: 1fr !important; }
          .stepper-label { display: none; }
        }
      `}</style>
    </div>
  );
}

/* ─── sub-components ──────────────────────────────── */

function LessonForm({ mode, data, onChange, onSubmit, onCancel, saving, inputStyle, labelStyle }) {
  return (
    <div
      style={{
        marginTop: '0.75rem',
        padding: '1rem',
        background: 'var(--bg-card)',
        borderRadius: '10px',
        border: '1px solid #6c5ce7',
      }}
    >
      <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#6c5ce7', marginBottom: '0.75rem' }}>
        {mode === 'add' ? '➕ New Lesson' : '✎ Editing Lesson'}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 140px)', gap: '0.6rem', marginBottom: '0.6rem' }}>
        <div>
          <label style={{ ...labelStyle, fontSize: '0.78rem' }}>Title *</label>
          <input
            type="text"
            value={data.title}
            onChange={(e) => onChange('title', e.target.value)}
            placeholder="Lesson title"
            autoFocus={mode === 'add'}
            style={{ ...inputStyle, fontSize: '0.9rem' }}
          />
        </div>
        <div>
          <label style={{ ...labelStyle, fontSize: '0.78rem' }}>Duration</label>
          <input
            type="text"
            value={data.duration}
            onChange={(e) => onChange('duration', e.target.value)}
            placeholder="10 min"
            style={{ ...inputStyle, fontSize: '0.9rem' }}
          />
        </div>
      </div>

      <div style={{ marginBottom: '0.75rem' }}>
        <label style={{ ...labelStyle, fontSize: '0.78rem' }}>
          Lesson Content <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>(markdown-lite: # headings, **bold**, - lists, \`code\`)</span>
        </label>
        <textarea
          value={data.content}
          onChange={(e) => onChange('content', e.target.value)}
          rows={10}
          placeholder={`Write the lesson content here. Example:

# Introduction

Welcome! In this lesson we'll cover **closures** in JavaScript.

## What is a closure?

A closure is a function that remembers variables from the scope it was created in.

- It has access to its own scope
- It has access to the outer function's scope
- It has access to the global scope`}
          style={{
            ...inputStyle,
            fontFamily: 'var(--mono)',
            fontSize: '0.85rem',
            lineHeight: 1.6,
            resize: 'vertical',
            minHeight: '200px',
          }}
        />
        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.35rem', textAlign: 'right' }}>
          {data.content.length} chars
        </div>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        <button
          onClick={onSubmit}
          disabled={saving}
          style={{ ...btnPrimary, opacity: saving ? 0.7 : 1 }}
        >
          {saving ? 'Saving…' : mode === 'add' ? '+ Add Lesson' : 'Save Changes'}
        </button>
        <button onClick={onCancel} style={btnGhost}>Cancel</button>
      </div>
    </div>
  );
}

function SectionHeading({ title, subtitle }) {
  return (
    <div style={{ marginBottom: '1.5rem' }}>
      <h2 style={{ fontSize: '1.15rem', color: 'var(--text-primary)', margin: '0 0 0.35rem', fontWeight: 700 }}>
        {title}
      </h2>
      {subtitle && (
        <p style={{ color: 'var(--text-tertiary)', fontSize: '0.88rem', margin: 0 }}>
          {subtitle}
        </p>
      )}
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#6c5ce7', lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '0.3rem' }}>{label}</div>
    </div>
  );
}

function Check({ ok, label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.88rem' }}>
      <span style={{
        width: '20px',
        height: '20px',
        borderRadius: '50%',
        background: ok ? '#34d399' : 'var(--bg-tertiary)',
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '0.7rem',
        fontWeight: 800,
        flexShrink: 0,
        border: ok ? 'none' : '1px solid var(--border-primary)',
      }}>
        {ok ? '✓' : ''}
      </span>
      <span style={{ color: ok ? 'var(--text-primary)' : 'var(--text-tertiary)' }}>{label}</span>
    </div>
  );
}

const chip = {
  padding: '0.2rem 0.6rem',
  background: 'var(--bg-card)',
  border: '1px solid var(--border-primary)',
  borderRadius: '20px',
  color: 'var(--text-tertiary)',
  fontWeight: 600,
};

const btnPrimary = {
  padding: '0.6rem 1.25rem',
  background: '#6c5ce7',
  color: 'white',
  border: 'none',
  borderRadius: '10px',
  cursor: 'pointer',
  fontWeight: 600,
  fontSize: '0.88rem',
  boxShadow: '0 3px 10px rgba(108,92,231,0.25)',
};

const btnPrimarySm = {
  padding: '0.35rem 0.75rem',
  background: '#6c5ce7',
  color: 'white',
  border: 'none',
  borderRadius: '8px',
  cursor: 'pointer',
  fontSize: '0.78rem',
  fontWeight: 600,
};

const btnGhost = {
  padding: '0.55rem 1.1rem',
  background: 'transparent',
  color: 'var(--text-secondary)',
  border: '1px solid var(--border-input)',
  borderRadius: '10px',
  cursor: 'pointer',
  fontSize: '0.85rem',
  fontWeight: 500,
};

const btnDangerSm = {
  padding: '0.35rem 0.6rem',
  background: 'transparent',
  color: 'var(--error)',
  border: '1px solid var(--border-primary)',
  borderRadius: '8px',
  cursor: 'pointer',
  fontSize: '0.85rem',
};

export default CreateCourse;