// Uses Groq's OpenAI-compatible API.
// Docs: https://console.groq.com/docs
//
// Note: openai/gpt-oss-20b and openai/gpt-oss-120b are reasoning models.
// They emit a hidden "reasoning" section before the visible answer, so
// max_tokens must be generous enough to cover both. Values below are
// tuned for that.

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

// Fast, high daily budget (14,400 req/day on free tier)
const GROQ_MODEL = 'openai/gpt-oss-20b';

// Smarter, lower daily budget (1,000 req/day on free tier) — used for
// structured output (quizzes, outlines) where accuracy matters more.
const GROQ_MODEL_HEAVY = 'openai/gpt-oss-120b';

// ─── Shared helper: call Groq once, get text back ────────
async function callGroq(
  prompt,
  { model = GROQ_MODEL, temperature = 0.7, maxTokens = 3000, jsonMode = false } = {}
) {
  const key = process.env.GROQ_API_KEY;
  if (!key) throw new Error('GROQ_API_KEY not set');

  const body = {
    model,
    messages: [
      {
        role: 'system',
        content: jsonMode
          ? 'You are a helpful assistant. Return ONLY valid JSON. No prose, no code fences, no explanations.'
          : 'You are a helpful assistant. Return only the requested content.',
      },
      { role: 'user', content: prompt },
    ],
    temperature,
    max_tokens: maxTokens,
  };

  // Groq supports OpenAI-style JSON mode. When enabled it forces the
  // model to emit valid JSON — much more reliable for quiz/outline output.
  if (jsonMode) {
    body.response_format = { type: 'json_object' };
  }

  const res = await fetch(GROQ_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify(body),
  });

  const data = await res.json();

  if (!res.ok) {
    const err = new Error(data?.error?.message || 'AI request failed');
    err.status = res.status;
    err.raw = data;
    throw err;
  }

  const text = data?.choices?.[0]?.message?.content?.trim();
  if (!text) {
    // Empty content usually means max_tokens was exhausted by reasoning.
    // Log the finish_reason so we can tell the difference from an
    // actual failure.
    console.error('Groq returned empty content. finish_reason:', data?.choices?.[0]?.finish_reason);
    throw new Error('AI returned an empty response');
  }
  return text;
}

// Strip ```json fences and find the first [ or { block.
function extractJson(text) {
  if (!text) return null;
  let cleaned = text.trim();
  cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/```$/i, '').trim();

  try {
    return JSON.parse(cleaned);
  } catch (_) {}

  const firstBracket = cleaned.search(/[\[{]/);
  if (firstBracket === -1) return null;
  const isArray = cleaned[firstBracket] === '[';
  const lastBracket = isArray ? cleaned.lastIndexOf(']') : cleaned.lastIndexOf('}');
  if (lastBracket === -1) return null;

  const slice = cleaned.slice(firstBracket, lastBracket + 1);
  try {
    return JSON.parse(slice);
  } catch (_) {
    return null;
  }
}

// ═══════════════════════════════════════════════════════
// COURSE DESCRIPTION GENERATOR
// ═══════════════════════════════════════════════════════
exports.generateDescription = async (req, res) => {
  try {
    const { title, category, level, keywords } = req.body;
    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Course title is required' });
    }

    const prompt = `Write a compelling 2-3 paragraph course description for an online learning platform.

Title: ${title}
Category: ${category || 'General'}
Level: ${level || 'Beginner'}
${keywords ? `Keywords to include: ${keywords}` : ''}

Rules:
- Write in second person ("you'll learn", "you will build")
- Be concrete about what students gain
- Avoid marketing fluff
- 120 to 200 words total
- Return only the description text, no headings, no preamble

Description:`;

    const text = await callGroq(prompt, {
      temperature: 0.7,
      maxTokens: 2500,
    });
    res.json({ description: text });
  } catch (err) {
    console.error('AI description error:', err.status || '', err.message);
    res.status(err.status || 500).json({
      error: err.message || 'Failed to generate description',
    });
  }
};

// ═══════════════════════════════════════════════════════
// AI STUDY BUDDY — non-streaming
// ═══════════════════════════════════════════════════════
exports.chatWithAI = async (req, res) => {
  try {
    const { message, context } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const prompt = `You are LearnHub's AI study buddy — a friendly, patient tutor.
${context ? `\nContext: ${context}` : ''}

Question: ${message}`;

    const reply = await callGroq(prompt, {
      temperature: 0.7,
      maxTokens: 3000,
    });
    res.json({ reply });
  } catch (err) {
    console.error('AI chat error:', err.status || '', err.message);
    res.status(err.status || 500).json({
      error: err.message || 'Failed to process your question',
    });
  }
};

// ═══════════════════════════════════════════════════════
// AI STUDY BUDDY — streaming
// ═══════════════════════════════════════════════════════
exports.streamChat = async (req, res) => {
  try {
    const { message, context } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const key = process.env.GROQ_API_KEY;
    if (!key) return res.status(500).json({ error: 'AI is not configured on the server' });

    const prompt = `You are LearnHub's AI study buddy — a friendly, patient tutor.
${context ? `\nContext: ${context}` : ''}

Question: ${message}`;

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders();

    const response = await fetch(GROQ_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [
          { role: 'system', content: 'You are a helpful assistant.' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.7,
        max_tokens: 3000,
        stream: true,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Groq stream error:', response.status, errText);
      res.write(`data: ${JSON.stringify({ error: 'AI request failed' })}\n\n`);
      res.end();
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const payload = line.slice(6).trim();
        if (!payload || payload === '[DONE]') continue;

        try {
          const event = JSON.parse(payload);
          const delta = event.choices?.[0]?.delta?.content;
          if (delta) {
            res.write(`data: ${JSON.stringify({ delta })}\n\n`);
          }
        } catch (_) {}
      }
    }

    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  } catch (err) {
    console.error('AI stream error:', err);
    try {
      res.write(`data: ${JSON.stringify({ error: 'Failed to process your question' })}\n\n`);
      res.end();
    } catch (_) {}
  }
};

// ═══════════════════════════════════════════════════════
// AI QUIZ GENERATOR
// ═══════════════════════════════════════════════════════
exports.generateQuiz = async (req, res) => {
  try {
    const { lessonTitle, lessonContent, courseCategory, questionCount } = req.body;
    if (!lessonContent || !lessonContent.trim()) {
      return res.status(400).json({ error: 'Lesson content is required to generate a quiz' });
    }
    if (!lessonTitle || !lessonTitle.trim()) {
      return res.status(400).json({ error: 'Lesson title is required' });
    }

    const count = Math.min(Math.max(parseInt(questionCount) || 5, 3), 10);
    const trimmedContent =
      lessonContent.length > 3000
        ? lessonContent.slice(0, 3000) + '\n\n[content truncated]'
        : lessonContent;

    const prompt = `Create a multiple-choice quiz.

Topic: ${lessonTitle}
${courseCategory ? `Category: ${courseCategory}` : ''}

Lesson content:
---
${trimmedContent}
---

Write exactly ${count} multiple-choice questions testing comprehension.

Return JSON in this exact shape (no code fences, no extra text):
{
  "questions": [
    {
      "question": "The question text",
      "option1": "...",
      "option2": "...",
      "option3": "...",
      "option4": "...",
      "correctOption": 0
    }
  ]
}

correctOption is the zero-based index (0-3). Distractors must be plausible but wrong.`;

    const raw = await callGroq(prompt, {
      temperature: 0.5,
      maxTokens: 4000,
      model: GROQ_MODEL_HEAVY,
      jsonMode: true,
    });

    // With jsonMode, response is already an object. Try direct parse first.
    let parsed = null;
    try {
      parsed = JSON.parse(raw);
    } catch (_) {
      parsed = extractJson(raw);
    }

    // Handle both { questions: [...] } and direct array
    const arr = Array.isArray(parsed) ? parsed : parsed?.questions;
    if (!Array.isArray(arr)) {
      console.error('Quiz JSON parse failed. Raw:', raw);
      return res.status(500).json({ error: 'AI returned an unexpected format. Try again.' });
    }

    const questions = arr
      .map((q, i) => {
        if (!q || typeof q.question !== 'string') return null;
        const opts = [q.option1, q.option2, q.option3, q.option4].map((o) =>
          typeof o === 'string' ? o.trim() : ''
        );
        if (opts.some((o) => !o)) return null;
        const correct = Number.isInteger(q.correctOption)
          ? q.correctOption
          : parseInt(q.correctOption);
        if (!(correct >= 0 && correct <= 3)) return null;
        return {
          id: `q-${Date.now()}-${i}`,
          question: q.question.trim(),
          option1: opts[0],
          option2: opts[1],
          option3: opts[2],
          option4: opts[3],
          correctOption: correct,
        };
      })
      .filter(Boolean);

    if (questions.length === 0) {
      return res.status(500).json({ error: 'AI returned questions in an invalid format' });
    }

    res.json({ questions });
  } catch (err) {
    console.error('AI quiz error:', err.status || '', err.message);
    res.status(err.status || 500).json({
      error: err.message || 'Failed to generate quiz',
    });
  }
};

// ═══════════════════════════════════════════════════════
// AI OUTLINE GENERATOR (Book → Modules)
// ═══════════════════════════════════════════════════════
exports.generateOutline = async (req, res) => {
  try {
    const { sourceText, courseTitle, courseCategory, preferredModules } = req.body;

    if (!sourceText || !sourceText.trim()) {
      return res.status(400).json({ error: 'Source text is required' });
    }
    if (sourceText.length < 200) {
      return res.status(400).json({ error: 'Please provide at least 200 characters of source text' });
    }

    const trimmedText =
      sourceText.length > 20000
        ? sourceText.slice(0, 20000) + '\n\n[text truncated]'
        : sourceText;

    const moduleCount = Math.min(Math.max(parseInt(preferredModules) || 4, 2), 8);

    const prompt = `Analyze the source text and organize it into a structured course outline.

${courseTitle ? `Course title: ${courseTitle}` : ''}
${courseCategory ? `Category: ${courseCategory}` : ''}

Source text:
---
${trimmedText}
---

Break this material into ${moduleCount} modules. Each module gets 3 to 6 lessons.

Return JSON in this exact shape (no code fences, no extra text):
{
  "modules": [
    {
      "title": "Module title (max 60 chars)",
      "description": "One-sentence summary",
      "lessons": [
        { "title": "Lesson title (max 70 chars)", "description": "One-sentence summary" }
      ]
    }
  ]
}

Rules:
- Do NOT invent content that isn't in the source
- Order from foundational to advanced
- Avoid generic titles like "Introduction" unless truly appropriate`;

    const raw = await callGroq(prompt, {
      temperature: 0.4,
      maxTokens: 5000,
      model: GROQ_MODEL_HEAVY,
      jsonMode: true,
    });

    let parsed = null;
    try {
      parsed = JSON.parse(raw);
    } catch (_) {
      parsed = extractJson(raw);
    }

    // Handle both { modules: [...] } and direct array
    const arr = Array.isArray(parsed) ? parsed : parsed?.modules;
    if (!Array.isArray(arr)) {
      console.error('Outline JSON parse failed. Raw:', raw);
      return res.status(500).json({
        error: 'AI returned an unexpected format. Try a shorter source text.',
      });
    }

    const modules = arr
      .map((m, mi) => {
        if (!m || typeof m.title !== 'string' || !m.title.trim()) return null;
        const lessons = Array.isArray(m.lessons)
          ? m.lessons
              .map((l, li) => {
                if (!l || typeof l.title !== 'string' || !l.title.trim()) return null;
                return {
                  id: `m-${mi}-l-${li}-${Date.now()}`,
                  title: l.title.trim().slice(0, 100),
                  description:
                    typeof l.description === 'string'
                      ? l.description.trim().slice(0, 300)
                      : '',
                  content: '',
                };
              })
              .filter(Boolean)
              .slice(0, 8)
          : [];

        if (lessons.length === 0) return null;

        return {
          id: `mod-${mi}-${Date.now()}`,
          title: m.title.trim().slice(0, 100),
          description:
            typeof m.description === 'string' ? m.description.trim().slice(0, 300) : '',
          lessons,
        };
      })
      .filter(Boolean)
      .slice(0, 8);

    if (modules.length === 0) {
      return res.status(500).json({
        error: 'AI could not produce a usable outline from this text.',
      });
    }

    res.json({ modules });
  } catch (err) {
    console.error('AI outline error:', err.status || '', err.message);
    res.status(err.status || 500).json({
      error: err.message || 'Failed to generate outline',
    });
  }
};