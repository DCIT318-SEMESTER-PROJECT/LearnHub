import React, { useState } from 'react';

function StarRating({ value = 0, onChange, size = 28, showValue = false }) {
  const [hover, setHover] = useState(0);
  const readOnly = !onChange;
  const display = hover || value;

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
      {[1, 2, 3, 4, 5].map((n) => {
        const filled = n <= display;
        return (
          <span
            key={n}
            onClick={() => !readOnly && onChange(n)}
            onMouseEnter={() => !readOnly && setHover(n)}
            onMouseLeave={() => !readOnly && setHover(0)}
            role={readOnly ? undefined : 'button'}
            tabIndex={readOnly ? undefined : 0}
            onKeyDown={(e) => {
              if (!readOnly && (e.key === 'Enter' || e.key === ' ')) {
                e.preventDefault();
                onChange(n);
              }
            }}
            style={{
              fontSize: `${size}px`,
              lineHeight: 1,
              cursor: readOnly ? 'default' : 'pointer',
              color: filled ? '#f59e0b' : '#d1d5db',
              transition: 'transform 0.1s, color 0.15s',
              transform: !readOnly && hover === n ? 'scale(1.15)' : 'scale(1)',
              userSelect: 'none',
            }}
            aria-label={`${n} star${n > 1 ? 's' : ''}`}
          >
            ★
          </span>
        );
      })}
      {showValue && (
        <span style={{ fontSize: '0.9rem', color: 'var(--text-tertiary)', marginLeft: '0.25rem' }}>
          {Number(value).toFixed(1)}
        </span>
      )}
    </div>
  );
}

export default StarRating;