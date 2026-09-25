import React, { useState, useEffect } from 'react';

function QuizGeneratorModal({ isOpen, questions, mode = 'ai', onSave, onCancel, saving }) {
  const [edited, setEdited] = useState([]);

  useEffect(() => {
    if (isOpen && Array.isArray(questions)) {
      setEdited(questions.map((q) => ({ ...q })));
    }
  }, [isOpen, questions]);

  if (!isOpen) return null;

  const updateQuestion = (i, field, value) => {
    setEdited((prev) => {
      const next = [...prev];
      next[i] = { ...next[i], [field]: value };
      return next;
    });
  };

  const updateOption = (i, optIdx, value) => {
    setEdited((prev) => {
      const next = [...prev];
      next[i] = { ...next[i], [`option${optIdx + 1}`]: value };
      return next;
    });
  };

  const setCorrect = (i, optIdx) => {
    setEdited((prev) => {
      const next = [...prev];
      next[i] = { ...next[i], correctOption: optIdx };
      return next;
    });
  };

  const removeQuestion = (i) => {
    setEdited((prev) => prev.filter((_, idx) => idx !== i));
  };

  const addQuestion = () => {
    setEdited((prev) => [
      ...prev,
      {
        id: `q-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        question: '',
        option1: '',
        option2: '',
        option3: '',
        option4: '',
        correctOption: 0,
      },
    ]);
  };

  const incompleteIndexes = edited
    .map((q, i) => {
      const hasQuestion = q.question && q.question.trim();
      const hasAllOptions = [q.option1, q.option2, q.option3, q.option4].every(
        (o) => o && o.trim()
      );
      return hasQuestion && hasAllOptions ? null : i;
    })
    .filter((i) => i !== null);

  const canSave = edited.length > 0 && incompleteIndexes.length === 0;

  const headerTitle =
    mode === 'manual' ? '📝 Build Your Quiz' : '✨ AI-Generated Quiz';
  const headerSub =
    mode === 'manual'
      ? `Write your own questions · ${edited.length} question${edited.length === 1 ? '' : 's'}`
      : `Review and edit before saving · ${edited.length} questions`;

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
          maxWidth: '720px',
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
            <div style={{ fontWeight: 700, fontSize: '1rem' }}>{headerTitle}</div>
            <div style={{ fontSize: '0.78rem', opacity: 0.92 }}>{headerSub}</div>
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
          {edited.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-tertiary)' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🤔</div>
              <p style={{ margin: '0 0 1rem' }}>No questions yet.</p>
              <button
                onClick={addQuestion}
                style={{
                  padding: '0.6rem 1.25rem',
                  background: '#6c5ce7',
                  color: 'white',
                  border: 'none',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '0.9rem',
                }}
              >
                + Add Your First Question
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {edited.map((q, i) => {
                const isIncomplete = incompleteIndexes.includes(i);
                return (
                  <div
                    key={q.id || i}
                    style={{
                      padding: '1rem',
                      background: 'var(--bg-secondary)',
                      border: `1px solid ${isIncomplete ? 'rgba(245,158,11,0.5)' : 'var(--border-primary)'}`,
                      borderRadius: '14px',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem', gap: '0.5rem' }}>
                      <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#6c5ce7' }}>
                        Question {i + 1}
                        {isIncomplete && (
                          <span style={{ marginLeft: '0.5rem', color: '#f59e0b', fontWeight: 500 }}>
                            · incomplete
                          </span>
                        )}
                      </span>
                      <button
                        onClick={() => removeQuestion(i)}
                        style={{
                          background: 'transparent',
                          color: 'var(--error)',
                          border: 'none',
                          cursor: 'pointer',
                          fontSize: '0.78rem',
                          fontWeight: 600,
                        }}
                      >
                        Remove
                      </button>
                    </div>

                    <textarea
                      value={q.question}
                      onChange={(e) => updateQuestion(i, 'question', e.target.value)}
                      placeholder="Type the question…"
                      rows={2}
                      style={inputStyle}
                    />

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginTop: '0.65rem' }}>
                      {[0, 1, 2, 3].map((optIdx) => {
                        const value = q[`option${optIdx + 1}`] || '';
                        const isCorrect = q.correctOption === optIdx;
                        return (
                          <div key={optIdx} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <button
                              type="button"
                              onClick={() => setCorrect(i, optIdx)}
                              title={isCorrect ? 'Correct answer' : 'Mark as correct'}
                              style={{
                                width: '26px',
                                height: '26px',
                                borderRadius: '50%',
                                border: isCorrect ? 'none' : '1.5px solid var(--border-input)',
                                background: isCorrect ? '#34d399' : 'transparent',
                                color: 'white',
                                cursor: 'pointer',
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                flexShrink: 0,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            >
                              {isCorrect ? '✓' : String.fromCharCode(65 + optIdx)}
                            </button>
                            <input
                              type="text"
                              value={value}
                              onChange={(e) => updateOption(i, optIdx, e.target.value)}
                              placeholder={`Option ${String.fromCharCode(65 + optIdx)}`}
                              style={{ ...inputStyle, flex: 1, padding: '0.5rem 0.75rem', fontSize: '0.88rem' }}
                            />
                          </div>
                        );
                      })}
                    </div>

                    <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', marginTop: '0.5rem' }}>
                      Correct answer: <strong style={{ color: '#34d399' }}>
                        {String.fromCharCode(65 + (q.correctOption ?? 0))}
                      </strong>
                    </div>
                  </div>
                );
              })}

              <button
                onClick={addQuestion}
                style={{
                  padding: '0.7rem',
                  background: 'transparent',
                  color: '#6c5ce7',
                  border: '1.5px dashed var(--accent, #6c5ce7)',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                }}
              >
                + Add Question
              </button>
            </div>
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
            {incompleteIndexes.length > 0
              ? `⚠️ ${incompleteIndexes.length} incomplete question${incompleteIndexes.length === 1 ? '' : 's'}`
              : 'Click the green circle to change which option is correct.'}
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
            <button
              onClick={() => onSave(edited)}
              disabled={saving || !canSave}
              title={!canSave ? 'Fill out every question and option first' : 'Save quiz'}
              style={{
                padding: '0.6rem 1.35rem',
                background: saving || !canSave ? '#a29bfe' : '#6c5ce7',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                cursor: saving || !canSave ? 'not-allowed' : 'pointer',
                fontSize: '0.88rem',
                fontWeight: 700,
                opacity: saving || !canSave ? 0.7 : 1,
              }}
            >
              {saving ? 'Saving…' : `💾 Save ${edited.length} Question${edited.length === 1 ? '' : 's'}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

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

export default QuizGeneratorModal;