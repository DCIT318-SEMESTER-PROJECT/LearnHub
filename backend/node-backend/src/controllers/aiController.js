// Uses the Gemini Interactions API (v1beta/interactions).
// Works with AQ. and AIza keys via the x-goog-api-key header.
//
// Docs: https://ai.google.dev/gemini-api/docs/get-started

const GEMINI_INTERACTIONS_URL =
  'https://generativelanguage.googleapis.com/v1beta/interactions';

const MODEL = 'gemini-3.8-flash';

// Extract plain text from the Interactions API response shape.
// Response has a `steps` array; the final answer lives in steps
// with type === 'model_output', whose content array has { type, text }.
function extractText(data) {
  if (!data || !Array.isArray(data.steps)) return '';
  const parts = [];
  for (const step of data.steps) {
    if (step.type !== 'model_output') continue;
    if (!Array.isArray(step.content)) continue;
    for (const block of step.content) {
      if (block && block.type === 'text' && typeof block.text === 'string') {
        parts.push(block.text);
      }
    }
  }
  return parts.join('').trim();
}

exports.generateDescription = async (req, res) => {
  try {
    const { title, category, level, keywords } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Course title is required' });
    }

    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      return res.status(500).json({ error: 'AI is not configured on the server' });
    }

    const prompt = `Write a compelling 2-3 paragraph course description for an online learning platform.

Title: ${title}
Category: ${category || 'General'}
Level: ${level || 'Beginner'}
${keywords ? `Keywords to include: ${keywords}` : ''}

Rules:
- Write in second person ("you'll learn", "you will build")
- Be concrete about what students gain
- Avoid marketing fluff and buzzwords
- 120 to 200 words total
- Return only the description text, no headings, no preamble

Description:`;

    const response = await fetch(GEMINI_INTERACTIONS_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': key,
      },
      body: JSON.stringify({
        model: MODEL,
        input: prompt,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Gemini API error:', response.status, JSON.stringify(data));
      return res.status(response.status).json({
        error: data?.error?.message || 'AI request failed',
      });
    }

    const text = extractText(data);

    if (!text) {
      console.error('Gemini returned no text:', JSON.stringify(data));
      return res.status(500).json({ error: 'AI returned an empty response' });
    }

    res.json({ description: text });
  } catch (err) {
    console.error('AI controller error:', err);
    res.status(500).json({ error: 'Failed to generate description' });
  }
};