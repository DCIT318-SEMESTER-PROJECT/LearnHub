const db = require('../config/database');

// ─── Runtime schema probe ───────────────────────────────
const schemaCache = new Map();
async function getColumns(tableName) {
  if (schemaCache.has(tableName)) return schemaCache.get(tableName);
  const rows = await db.allAsync(`PRAGMA table_info(${tableName})`);
  const cols = new Set(rows.map((r) => r.name));
  schemaCache.set(tableName, cols);
  return cols;
}

// ═══════════════════════════════════════════════════════
// GET /api/quizzes/course/:courseId
// ═══════════════════════════════════════════════════════
exports.getQuizByCourse = async (req, res) => {
  try {
    const { courseId } = req.params;

    const quiz = await db.getAsync(
      'SELECT * FROM quizzes WHERE courseId = ? ORDER BY id DESC LIMIT 1',
      [courseId]
    );

    if (!quiz) {
      return res.json({ questions: [] });
    }

    const cols = await getColumns('quiz_questions');
    const orderClause = cols.has('orderNumber')
      ? 'ORDER BY orderNumber ASC, id ASC'
      : 'ORDER BY id ASC';

    const questions = await db.allAsync(
      `SELECT * FROM quiz_questions WHERE quizId = ? ${orderClause}`,
      [quiz.id]
    );

    res.json({ id: quiz.id, title: quiz.title, questions });
  } catch (error) {
    console.error('Error fetching quiz:', error);
    res.status(500).json({ error: 'Failed to fetch quiz' });
  }
};

// ═══════════════════════════════════════════════════════
// POST /api/quizzes/course/:courseId
// ═══════════════════════════════════════════════════════
exports.upsertQuiz = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { title = 'Course Quiz', questions = [] } = req.body;
    const userId = req.userId;

    const course = await db.getAsync(
      'SELECT * FROM courses WHERE id = ? AND instructorId = ?',
      [courseId, userId]
    );
    if (!course) {
      return res.status(403).json({ error: 'Not your course' });
    }

    if (!Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ error: 'At least one question is required' });
    }

    for (const q of questions) {
      if (
        !q.question ||
        !q.option1 ||
        !q.option2 ||
        !q.option3 ||
        !q.option4 ||
        !(q.correctOption >= 0 && q.correctOption <= 3)
      ) {
        return res.status(400).json({ error: 'Invalid question format' });
      }
    }

    await db.runAsync('BEGIN TRANSACTION');

    let quiz = await db.getAsync(
      'SELECT * FROM quizzes WHERE courseId = ? ORDER BY id DESC LIMIT 1',
      [courseId]
    );

    if (!quiz) {
      const result = await db.runAsync(
        'INSERT INTO quizzes (courseId, title, createdAt) VALUES (?, ?, CURRENT_TIMESTAMP)',
        [courseId, title]
      );
      quiz = { id: result.lastID };
    } else {
      await db.runAsync('UPDATE quizzes SET title = ? WHERE id = ?', [title, quiz.id]);
    }

    await db.runAsync('DELETE FROM quiz_questions WHERE quizId = ?', [quiz.id]);

    const cols = await getColumns('quiz_questions');
    const hasOrderNumber = cols.has('orderNumber');

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (hasOrderNumber) {
        await db.runAsync(
          `INSERT INTO quiz_questions
             (quizId, question, option1, option2, option3, option4, correctOption, orderNumber)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            quiz.id,
            q.question,
            q.option1,
            q.option2,
            q.option3,
            q.option4,
            q.correctOption,
            i,
          ]
        );
      } else {
        await db.runAsync(
          `INSERT INTO quiz_questions
             (quizId, question, option1, option2, option3, option4, correctOption)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            quiz.id,
            q.question,
            q.option1,
            q.option2,
            q.option3,
            q.option4,
            q.correctOption,
          ]
        );
      }
    }

    await db.runAsync('COMMIT');

    res.json({ success: true, quizId: quiz.id, count: questions.length });
  } catch (error) {
    try {
      await db.runAsync('ROLLBACK');
    } catch (_) {}
    console.error('Error saving quiz:', error);
    res.status(500).json({ error: 'Failed to save quiz: ' + error.message });
  }
};

// ═══════════════════════════════════════════════════════
// POST /api/quizzes/course/:courseId/submit
// ═══════════════════════════════════════════════════════
exports.submitQuiz = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { answers = {} } = req.body;
    const userId = req.userId;

    const quiz = await db.getAsync(
      'SELECT * FROM quizzes WHERE courseId = ? ORDER BY id DESC LIMIT 1',
      [courseId]
    );
    if (!quiz) return res.status(404).json({ error: 'No quiz for this course' });

    const cols = await getColumns('quiz_questions');
    const orderClause = cols.has('orderNumber')
      ? 'ORDER BY orderNumber ASC, id ASC'
      : 'ORDER BY id ASC';

    const questions = await db.allAsync(
      `SELECT * FROM quiz_questions WHERE quizId = ? ${orderClause}`,
      [quiz.id]
    );

    let correct = 0;
    const results = questions.map((q, index) => {
      const given = answers[index];
      const isCorrect = given === q.correctOption;
      if (isCorrect) correct++;
      return {
        questionId: q.id,
        given,
        correct: q.correctOption,
        isCorrect,
      };
    });

    const score = questions.length
      ? Math.round((correct / questions.length) * 100)
      : 0;

    try {
      await db.runAsync(
        `INSERT INTO quiz_attempts (userId, quizId, score, isPassed, attemptedAt)
         VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)`,
        [userId, quiz.id, score, score >= 70 ? 1 : 0]
      );
    } catch (e) {
      // quiz_attempts may not exist — non-fatal
    }

    res.json({ score, correct, total: questions.length, results });
  } catch (error) {
    console.error('Error submitting quiz:', error);
    res.status(500).json({ error: 'Failed to submit quiz' });
  }
};