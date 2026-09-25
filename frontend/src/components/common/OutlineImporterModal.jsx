import React, { useState, useEffect, useRef } from 'react';
import api from '../../api/axiosConfig';

const MAX_CHARS = 20000;

function OutlineImporterModal({ isOpen, courseTitle, courseCategory, onConfirm, onCancel, saving }) {
  const [stage, setStage] = useState('input'); // 'input' | 'generating' | 'review'
  const [sourceText, setSourceText] = useState('');
  const [fileName, setFileName] = useState('');
  const [preferredModules, setPreferredModules] = useState(4);
  const [modules, setModules] = useState([]);
  const [error, setError] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setStage('input');
      setSourceText('');
      setFileName('');
      setPreferredModules(4);
      setModules([]);
      setError('');
      setDragOver(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleFile = (file) => {
    if (!file) return;
    const ext = file.name.split('.').pop().toLowerCase();
    if (!['txt', 'md', 'markdown'].includes(ext)) {
      setError('Only .txt and .md files are supported. Copy PDF text into the textarea instead.');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setError('File must be less than 2MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result || '');
      setSourceText(text.slice(0, MAX_CHARS));
      setFileName(file.name);
      setError('');
    };
    reader.readAsText(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    handleFile(e.dataTransfer.files?.[0]);
  };

  const handleAnalyze = async () => {
    if (!sourceText.trim() || sourceText.trim().length < 200) {
      setError('Please provide at least 200 characters of text.');
      return;
    }
    setError('');
    setStage('generating');

    try {
      const { data } = await api.post('/ai/generate-outline', {
        sourceText,
        courseTitle,
        courseCategory,
        preferredModules,
      });
      setModules(data.modules || []);
      setStage('review');
    } catch (err) {
      console.error('Outline generation error:', err);
      setError(err.response?.data?.error || 'Failed to generate outline. Try again or shorten the text.');
      setStage('input');
    }
  };

  // ─── Review-stage edits ────────────────────────────────
  const updateModule = (mi, field, value) => {
    setModules((prev) => {
      const next = [...prev];
      next[mi] = { ...next[mi], [field]: value };
      return next;
    });
  };

  const removeModule = (mi) => {
    setModules((prev) => prev.filter((_, i) => i !== mi));
  };

  const updateLesson = (mi, li, field, value) => {
    setModules((prev) => {
      const next = [...prev];
      const lessons = [...next[mi].lessons];
      lessons[li] = { ...lessons[li], [field]: value };
      next[mi] = { ...next[mi], lessons };
      return next;
    });
  };

  const removeLesson = (mi, li) => {
    setModules((prev) => {
      const next = [...prev];
      next[mi] = {
        ...next[mi],
        lessons: next[mi].lessons.filter((_, i) => i !== li),
      };
      return next;
    });
  };

  const addLesson = (mi) => {
    setModules((prev) => {
      const next = [...prev];
      next[mi] = {
        ...next[mi],
        lessons: [
          ...next[mi].lessons,
          {
            id: `manual-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            title: '',
            description: '',
            content: '',
          },
        ],
      };
      return next;
    });
  };

  const totalLessons = modules.reduce((sum, m) => sum + (m.lessons?.length || 0), 0);

  const canConfirm =
    modules.length > 0 &&
    modules.every((m) => m.title.trim() && m.lessons.length > 0 && m.lessons.every((l) => l.title.trim()));

  const handleConfirm = () => {
    if (!canConfirm) return;
    onConfirm(modules);
  };

  const handleRegenerate = () => {
    setStage('input');
    setModules([]);
    setError('');
  };

  // ─── Render ────────────────────────────────────────────
  return (
    <div
      onClick={onCancel}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.6)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1500,
        padding: '1rem',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '780px',
          maxHeight: 'calc(100vh - 40px)',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-primary)',
          borderRadius: '20px',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '1rem 1.35rem',
            background: 'linear-gradient(135deg, #6c5ce7, #8b7cf0)',
            color: 'white',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '0.75rem',
          }}
        >
          <div>
            <div style={{ fontWeight: 700, fontSize: '1rem' }}>
              📖 Import Modules from Text
            </div>
            <div style={{ fontSize: '0.78rem', opacity: 0.92 }}>
              {stage === 'input' && 'Paste text or drop a .txt / .md file'}
              {stage === 'generating' && 'Analyzing your text with AI…'}
              {stage === 'review' && `Review the outline · ${modules.length} modules, ${totalLessons} lessons`}
            </div>
          </div>
          <button
            onClick={onCancel}
            style={{
              background: 'rgba(255,255,255,0.18)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              padding: '0.4rem 0.7rem',
              fontSize: '0.85rem',
              cursor: 'pointer',
            }}
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.25rem' }}>

          {/* ─── Stage: INPUT ─── */}
          {stage === 'input' && (
            <>
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                style={{
                  padding: '1.5rem',
                  background: dragOver ? 'var(--accent-light)' : 'var(--bg-secondary)',
                  border: `2px dashed ${dragOver ? '#6c5ce7' : 'var(--border-input)'}`,
                  borderRadius: '14px',
                  marginBottom: '1rem',
                  textAlign: 'center',
                  transition: 'all 0.15s',
                }}
              >
                <div style={{ fontSize: '2rem', marginBottom: '0.4rem' }}>📄</div>
                <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.2rem' }}>
                  {dragOver ? 'Drop the file to load it' : 'Drop a .txt or .md file here'}
                </div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-tertiary)', marginBottom: '0.75rem' }}>
                  or paste directly into the box below
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    padding: '0.5rem 1rem',
                    background: 'var(--bg-card)',
                    color: 'var(--text-primary)',
                    border: '1px solid var(--border-input)',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                    fontWeight: 500,
                  }}
                >
                  📁 Choose file
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".txt,.md,.markdown,text/plain,text/markdown"
                  onChange={(e) => handleFile(e.target.files?.[0])}
                  style={{ display: 'none' }}
                />
                {fileName && (
                  <div style={{ fontSize: '0.78rem', color: '#34d399', marginTop: '0.5rem', fontWeight: 600 }}>
                    ✓ Loaded: {fileName}
                  </div>
                )}
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={labelStyle}>
                  Source text
                  <span style={{ fontWeight: 400, color: 'var(--text-muted)', marginLeft: '0.4rem' }}>
                    ({sourceText.length.toLocaleString()}/{MAX_CHARS.toLocaleString()} chars)
                  </span>
                </label>
                <textarea
                  value={sourceText}
                  onChange={(e) => {
                    setSourceText(e.target.value.slice(0, MAX_CHARS));
                    if (error) setError('');
                  }}
                  rows={10}
                  placeholder="Paste a chapter, an article, a long set of notes, or a book excerpt here. The AI will organize it into modules and lessons."
                  style={{
                    ...inputStyle,
                    fontFamily: 'var(--mono)',
                    fontSize: '0.82rem',
                    lineHeight: 1.5,
                    resize: 'vertical',
                    minHeight: '180px',
                  }}
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={labelStyle}>Number of modules</label>
                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                  {[2, 3, 4, 5, 6, 8].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setPreferredModules(n)}
                      style={{
                        padding: '0.45rem 0.9rem',
                        background: preferredModules === n ? '#6c5ce7' : 'transparent',
                        color: preferredModules === n ? 'white' : 'var(--text-secondary)',
                        border: `1px solid ${preferredModules === n ? '#6c5ce7' : 'var(--border-input)'}`,
                        borderRadius: '10px',
                        cursor: 'pointer',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                      }}
                    >
                      {n}
                    </button>
                  ))}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
                  Each module will get 3–6 lessons based on the content.
                </div>
              </div>

              {error && (
                <div
                  style={{
                    padding: '0.7rem 0.9rem',
                    background: 'rgba(239,68,68,0.1)',
                    border: '1px solid rgba(239,68,68,0.35)',
                    borderRadius: '10px',
                    color: '#dc2626',
                    fontSize: '0.85rem',
                    marginBottom: '0.5rem',
                  }}
                >
                  ⚠️ {error}
                </div>
              )}
            </>
          )}

          {/* ─── Stage: GENERATING ─── */}
          {stage === 'generating' && (
            <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
              <div style={{ fontSize: '3rem', marginBottom: '0.75rem', animation: 'pulse 1.4s ease-in-out infinite' }}>
                ✨
              </div>
              <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
                Analyzing your text
              </div>
              <div style={{ fontSize: '0.88rem', color: 'var(--text-tertiary)', marginBottom: '1.25rem' }}>
                Splitting into modules and lessons… this usually takes 5–15 seconds.
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '0.4rem' }}>
                <span className="outline-dot" />
                <span className="outline-dot" />
                <span className="outline-dot" />
              </div>
            </div>
          )}

          {/* ─── Stage: REVIEW ─── */}
          {stage === 'review' && (
            <>
              <div
                style={{
                  padding: '0.75rem 1rem',
                  background: 'var(--accent-light)',
                  border: '1px solid rgba(108,92,231,0.35)',
                  borderRadius: '10px',
                  color: '#6c5ce7',
                  fontSize: '0.85rem',
                  marginBottom: '1rem',
                  fontWeight: 500,
                }}
              >
                ✨ Review and edit before importing. Nothing is saved yet — click <strong>Create Modules</strong> to add them to your course.
              </div>

              {modules.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-tertiary)' }}>
                  <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🤔</div>
                  <p style={{ margin: '0 0 0.85rem' }}>All modules were removed.</p>
                  <button
                    onClick={handleRegenerate}
                    style={{
                      padding: '0.55rem 1.2rem',
                      background: '#6c5ce7',
                      color: 'white',
                      border: 'none',
                      borderRadius: '10px',
                      cursor: 'pointer',
                      fontWeight: 600,
                    }}
                  >
                    ← Back to text
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  {modules.map((mod, mi) => (
                    <div
                      key={mod.id || mi}
                      style={{
                        padding: '1rem',
                        background: 'var(--bg-secondary)',
                        border: '1px solid var(--border-primary)',
                        borderRadius: '14px',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#6c5ce7' }}>
                          Module {mi + 1}
                        </span>
                        <button
                          onClick={() => removeModule(mi)}
                          style={{
                            background: 'transparent',
                            color: 'var(--error)',
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                          }}
                        >
                          Remove module
                        </button>
                      </div>

                      <input
                        type="text"
                        value={mod.title}
                        onChange={(e) => updateModule(mi, 'title', e.target.value)}
                        placeholder="Module title"
                        style={{ ...inputStyle, fontWeight: 700, fontSize: '0.95rem', marginBottom: '0.4rem' }}
                      />
                      <input
                        type="text"
                        value={mod.description || ''}
                        onChange={(e) => updateModule(mi, 'description', e.target.value)}
                        placeholder="Short description (optional)"
                        style={{ ...inputStyle, fontSize: '0.85rem', marginBottom: '0.75rem' }}
                      />

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                        {mod.lessons.map((lesson, li) => (
                          <div
                            key={lesson.id || li}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.5rem',
                              padding: '0.35rem 0.5rem',
                              background: 'var(--bg-card)',
                              borderRadius: '8px',
                              border: '1px solid var(--border-primary)',
                            }}
                          >
                            <span
                              style={{
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
                              }}
                            >
                              {li + 1}
                            </span>
                            <input
                              type="text"
                              value={lesson.title}
                              onChange={(e) => updateLesson(mi, li, 'title', e.target.value)}
                              placeholder="Lesson title"
                              style={{ ...inputStyle, flex: 1, padding: '0.4rem 0.6rem', fontSize: '0.85rem' }}
                            />
                            <button
                              onClick={() => removeLesson(mi, li)}
                              style={{
                                background: 'transparent',
                                color: 'var(--error)',
                                border: 'none',
                                cursor: 'pointer',
                                fontSize: '0.85rem',
                                padding: '0.2rem 0.4rem',
                                flexShrink: 0,
                              }}
                              title="Remove lesson"
                            >
                              ✕
                            </button>
                          </div>
                        ))}

                        <button
                          onClick={() => addLesson(mi)}
                          style={{
                            marginTop: '0.4rem',
                            padding: '0.4rem',
                            background: 'transparent',
                            color: '#6c5ce7',
                            border: '1px dashed var(--accent, #6c5ce7)',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontWeight: 600,
                            fontSize: '0.8rem',
                          }}
                        >
                          + Add Lesson
                        </button>
                      </div>
                    </div>
                  ))}

                  <button
                    onClick={handleRegenerate}
                    style={{
                      padding: '0.55rem 1rem',
                      background: 'transparent',
                      color: 'var(--text-secondary)',
                      border: '1px solid var(--border-input)',
                      borderRadius: '10px',
                      cursor: 'pointer',
                      fontSize: '0.85rem',
                      fontWeight: 500,
                    }}
                  >
                    ← Regenerate from text
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '0.9rem 1.35rem',
            borderTop: '1px solid var(--border-primary)',
            background: 'var(--bg-secondary)',
            display: 'flex',
            justifyContent: 'space-between',
            gap: '0.75rem',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', alignSelf: 'center' }}>
            {stage === 'input' && `${sourceText.length.toLocaleString()} characters entered`}
            {stage === 'generating' && 'Working…'}
            {stage === 'review' && `${modules.length} modules · ${totalLessons} lessons`}
          </div>
          <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
            <button
              onClick={onCancel}
              style={{
                padding: '0.6rem 1.1rem',
                background: 'transparent',
                color: 'var(--text-secondary)',
                border: '1px solid var(--border-input)',
                borderRadius: '10px',
                cursor: 'pointer',
                fontSize: '0.88rem',
                fontWeight: 500,
              }}
            >
              Cancel
            </button>

            {stage === 'input' && (
              <button
                onClick={handleAnalyze}
                disabled={sourceText.trim().length < 200}
                style={{
                  padding: '0.6rem 1.35rem',
                  background: sourceText.trim().length < 200 ? '#a29bfe' : '#6c5ce7',
                  color: 'white',
                  border: 'none',
                  borderRadius: '10px',
                  cursor: sourceText.trim().length < 200 ? 'not-allowed' : 'pointer',
                  fontSize: '0.88rem',
                  fontWeight: 700,
                  opacity: sourceText.trim().length < 200 ? 0.7 : 1,
                }}
              >
                ✨ Analyze with AI
              </button>
            )}

            {stage === 'review' && (
              <button
                onClick={handleConfirm}
                disabled={!canConfirm || saving}
                title={!canConfirm ? 'Every module and lesson needs a title' : 'Create modules in your course'}
                style={{
                  padding: '0.6rem 1.35rem',
                  background: !canConfirm || saving ? '#a29bfe' : '#34d399',
                  color: 'white',
                  border: 'none',
                  borderRadius: '10px',
                  cursor: !canConfirm || saving ? 'not-allowed' : 'pointer',
                  fontSize: '0.88rem',
                  fontWeight: 700,
                  opacity: !canConfirm || saving ? 0.7 : 1,
                }}
              >
                {saving ? 'Creating…' : `✓ Create ${modules.length} Module${modules.length === 1 ? '' : 's'}`}
              </button>
            )}
          </div>
        </div>
      </div>

      <style>{`
        .outline-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #6c5ce7;
          animation: outlineBounce 1s infinite ease-in-out;
        }
        .outline-dot:nth-child(2) { animation-delay: 0.15s; }
        .outline-dot:nth-child(3) { animation-delay: 0.3s; }
        @keyframes outlineBounce {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.5; }
          40% { transform: translateY(-6px); opacity: 1; }
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.12); }
        }
      `}</style>
    </div>
  );
}

const labelStyle = {
  display: 'block',
  marginBottom: '0.45rem',
  fontWeight: 600,
  color: 'var(--text-primary)',
  fontSize: '0.85rem',
};

const inputStyle = {
  width: '100%',
  padding: '0.6rem 0.75rem',
  background: 'var(--bg-input)',
  border: '1px solid var(--border-input)',
  borderRadius: '8px',
  fontSize: '0.9rem',
  color: 'var(--text-primary)',
  outline: 'none',
  fontFamily: 'inherit',
  resize: 'vertical',
};

export default OutlineImporterModal;