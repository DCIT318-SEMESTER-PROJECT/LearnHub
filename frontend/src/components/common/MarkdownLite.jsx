import React from 'react';

/**
 * Minimal markdown renderer — no dependencies, no dangerouslySetInnerHTML.
 * Supports:
 *   # / ## / ### headings
 *   **bold**, *italic*, `inline code`
 *   - / *  unordered lists
 *   1. ordered lists
 *   ``` fenced code blocks ```
 *   blank line = paragraph break
 *   line break = <br/>
 *
 * Returns React elements only — safe against injection.
 */

// ─── inline parsing ─────────────────────────────────────
// Order matters: code first, then bold, then italic.
function parseInline(text, keyPrefix = 'i') {
  const parts = [];
  let remaining = text;
  let key = 0;

  // Pattern: `code` | **bold** | *italic*
  const pattern = /(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*)/g;
  const segments = remaining.split(pattern);

  segments.forEach((seg) => {
    if (!seg) return;
    const k = `${keyPrefix}-${key++}`;

    if (seg.startsWith('`') && seg.endsWith('`')) {
      parts.push(
        <code
          key={k}
          style={{
            background: 'var(--bg-tertiary)',
            padding: '0.1rem 0.35rem',
            borderRadius: '5px',
            fontFamily: 'var(--mono)',
            fontSize: '0.88em',
            color: 'var(--text-primary)',
          }}
        >
          {seg.slice(1, -1)}
        </code>
      );
    } else if (seg.startsWith('**') && seg.endsWith('**')) {
      parts.push(<strong key={k}>{seg.slice(2, -2)}</strong>);
    } else if (seg.startsWith('*') && seg.endsWith('*')) {
      parts.push(<em key={k}>{seg.slice(1, -1)}</em>);
    } else {
      parts.push(seg);
    }
  });

  return parts.length ? parts : [text];
}

// ─── block parsing ──────────────────────────────────────
function parseBlocks(source) {
  const lines = source.replace(/\r\n/g, '\n').split('\n');
  const blocks = [];
  let i = 0;
  let listBuffer = null; // { type: 'ul' | 'ol', items: [] }
  let codeBuffer = null; // { lang: '', lines: [] }

  const flushList = () => {
    if (!listBuffer) return;
    const Tag = listBuffer.type === 'ul' ? 'ul' : 'ol';
    blocks.push({
      type: listBuffer.type,
      items: listBuffer.items,
      Tag,
    });
    listBuffer = null;
  };

  while (i < lines.length) {
    const raw = lines[i];
    const line = raw.replace(/\s+$/, '');

    // Fenced code block
    if (line.trim().startsWith('```')) {
      if (codeBuffer) {
        blocks.push({ type: 'code', lines: codeBuffer.lines, lang: codeBuffer.lang });
        codeBuffer = null;
      } else {
        flushList();
        codeBuffer = { lang: line.trim().slice(3).trim(), lines: [] };
      }
      i++;
      continue;
    }

    if (codeBuffer) {
      codeBuffer.lines.push(raw);
      i++;
      continue;
    }

    // Blank line
    if (line.trim() === '') {
      flushList();
      blocks.push({ type: 'spacer' });
      i++;
      continue;
    }

    // Headings
    const h3 = line.match(/^###\s+(.*)$/);
    const h2 = line.match(/^##\s+(.*)$/);
    const h1 = line.match(/^#\s+(.*)$/);
    if (h3) { flushList(); blocks.push({ type: 'h3', text: h3[1] }); i++; continue; }
    if (h2) { flushList(); blocks.push({ type: 'h2', text: h2[1] }); i++; continue; }
    if (h1) { flushList(); blocks.push({ type: 'h1', text: h1[1] }); i++; continue; }

    // Ordered list
    const ol = line.match(/^\s*\d+\.\s+(.*)$/);
    if (ol) {
      if (!listBuffer || listBuffer.type !== 'ol') {
        flushList();
        listBuffer = { type: 'ol', items: [] };
      }
      listBuffer.items.push(ol[1]);
      i++;
      continue;
    }

    // Unordered list
    const ul = line.match(/^\s*[-*]\s+(.*)$/);
    if (ul) {
      if (!listBuffer || listBuffer.type !== 'ul') {
        flushList();
        listBuffer = { type: 'ul', items: [] };
      }
      listBuffer.items.push(ul[1]);
      i++;
      continue;
    }

    // Paragraph line
    flushList();
    blocks.push({ type: 'p', text: line });
    i++;
  }

  flushList();
  if (codeBuffer) {
    blocks.push({ type: 'code', lines: codeBuffer.lines, lang: codeBuffer.lang });
  }

  return blocks;
}

// ─── main component ─────────────────────────────────────
function MarkdownLite({ source = '', style = {} }) {
  if (!source || typeof source !== 'string') {
    return null;
  }

  const blocks = parseBlocks(source);

  const baseText = {
    color: 'var(--text-secondary)',
    lineHeight: 1.75,
    fontSize: '0.96rem',
  };

  const renderBlock = (block, idx) => {
    switch (block.type) {
      case 'spacer':
        return <div key={idx} style={{ height: '0.4rem' }} />;

      case 'h1':
        return (
          <h2
            key={idx}
            style={{
              margin: '1.25rem 0 0.6rem',
              color: 'var(--text-primary)',
              fontSize: '1.4rem',
              fontWeight: 700,
              lineHeight: 1.3,
            }}
          >
            {parseInline(block.text, `h1-${idx}`)}
          </h2>
        );

      case 'h2':
        return (
          <h3
            key={idx}
            style={{
              margin: '1.1rem 0 0.5rem',
              color: 'var(--text-primary)',
              fontSize: '1.15rem',
              fontWeight: 700,
              lineHeight: 1.3,
            }}
          >
            {parseInline(block.text, `h2-${idx}`)}
          </h3>
        );

      case 'h3':
        return (
          <h4
            key={idx}
            style={{
              margin: '1rem 0 0.4rem',
              color: 'var(--text-primary)',
              fontSize: '1rem',
              fontWeight: 700,
              lineHeight: 1.3,
            }}
          >
            {parseInline(block.text, `h3-${idx}`)}
          </h4>
        );

      case 'ul':
        return (
          <ul
            key={idx}
            style={{
              ...baseText,
              margin: '0.4rem 0',
              paddingLeft: '1.4rem',
              listStyle: 'disc',
            }}
          >
            {block.items.map((item, j) => (
              <li key={j} style={{ marginBottom: '0.3rem' }}>
                {parseInline(item, `ul-${idx}-${j}`)}
              </li>
            ))}
          </ul>
        );

      case 'ol':
        return (
          <ol
            key={idx}
            style={{
              ...baseText,
              margin: '0.4rem 0',
              paddingLeft: '1.5rem',
              listStyle: 'decimal',
            }}
          >
            {block.items.map((item, j) => (
              <li key={j} style={{ marginBottom: '0.3rem' }}>
                {parseInline(item, `ol-${idx}-${j}`)}
              </li>
            ))}
          </ol>
        );

      case 'code':
        return (
          <pre
            key={idx}
            style={{
              margin: '0.75rem 0',
              padding: '0.9rem 1rem',
              background: 'var(--bg-tertiary)',
              border: '1px solid var(--border-primary)',
              borderRadius: '10px',
              overflowX: 'auto',
              fontSize: '0.85rem',
              lineHeight: 1.55,
              fontFamily: 'var(--mono)',
              color: 'var(--text-primary)',
              whiteSpace: 'pre',
            }}
          >
            <code>{block.lines.join('\n')}</code>
          </pre>
        );

      case 'p':
      default:
        return (
          <p
            key={idx}
            style={{
              ...baseText,
              margin: '0.4rem 0',
            }}
          >
            {parseInline(block.text, `p-${idx}`)}
          </p>
        );
    }
  };

  return (
    <div style={{ ...style }}>
      {blocks.map(renderBlock)}
    </div>
  );
}

export default MarkdownLite;