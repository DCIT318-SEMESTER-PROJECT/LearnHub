const db = require('../config/database');

class Quiz {
  static async findById(id) {
    return await db.getAsync('SELECT * FROM quizzes WHERE id = ?', [id]);
  }

  static async findByCourse(courseId) {
    return await db.allAsync('SELECT * FROM quizzes WHERE courseId = ?', [courseId]);
  }

  static async getQuestions(quizId) {
    return await db.allAsync(
      'SELECT * FROM quiz_questions WHERE quizId = ? ORDER BY id',
      [quizId]
    );
  }

  static async create(quizData) {
    const { courseId, title, description, passingScore, timeLimitMinutes } = quizData;
    const result = await db.runAsync(
      `INSERT INTO quizzes (courseId, title, description, passingScore, timeLimitMinutes) 
       VALUES (?, ?, ?, ?, ?)`,
      [courseId, title, description, passingScore || 70, timeLimitMinutes || 10]
    );
    return result.lastID;
  }

  static async addQuestion(questionData) {
    const { quizId, question, option1, option2, option3, option4, correctOption, explanation } = questionData;
    const result = await db.runAsync(
      `INSERT INTO quiz_questions (quizId, question, option1, option2, option3, option4, correctOption, explanation)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [quizId, question, option1, option2, option3, option4, correctOption, explanation]
    );
    return result.lastID;
  }

  static async submitAttempt(userId, quizId, answers) {
    const questions = await this.getQuestions(quizId);
    let correctAnswers = 0;
    
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      const userAnswer = answers[i];
      if (userAnswer === q.correctOption) {
        correctAnswers++;
      }
    }

    const totalQuestions = questions.length;
    const score = Math.round((correctAnswers / totalQuestions) * 100);
    const isPassed = score >= 70;

    const result = await db.runAsync(
      `INSERT INTO quiz_attempts (userId, quizId, score, isPassed, correctAnswers, totalQuestions, completedAt)
       VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      [userId, quizId, score, isPassed, correctAnswers, totalQuestions]
    );

    return {
      attemptId: result.lastID,
      score,
      isPassed,
      correctAnswers,
      totalQuestions
    };
  }

  static async getAttempts(userId, quizId) {
    return await db.allAsync(
      'SELECT * FROM quiz_attempts WHERE userId = ? AND quizId = ? ORDER BY completedAt DESC',
      [userId, quizId]
    );
  }

  static async getBestScore(userId, quizId) {
    return await db.getAsync(
      'SELECT MAX(score) as bestScore FROM quiz_attempts WHERE userId = ? AND quizId = ?',
      [userId, quizId]
    );
  }
}

module.exports = Quiz;