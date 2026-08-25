const Quiz = require('../models/Quiz');
const Course = require('../models/Course');

exports.getQuizById = async (req, res) => {
  try {
    const { quizId } = req.params;
    const quiz = await Quiz.findById(quizId);
    
    if (!quiz) {
      return res.status(404).json({ error: 'Quiz not found' });
    }

    const questions = await Quiz.getQuestions(quizId);
    res.json({ ...quiz, questions });
  } catch (error) {
    console.error('Error fetching quiz:', error);
    res.status(500).json({ error: 'Failed to fetch quiz' });
  }
};

exports.getQuizByCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    const quizzes = await Quiz.findByCourse(courseId);
    res.json(quizzes);
  } catch (error) {
    console.error('Error fetching quizzes:', error);
    res.status(500).json({ error: 'Failed to fetch quizzes' });
  }
};

exports.submitQuiz = async (req, res) => {
  try {
    const { quizId } = req.params;
    const { answers } = req.body;
    const userId = req.userId;

    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      return res.status(404).json({ error: 'Quiz not found' });
    }

    const result = await Quiz.submitAttempt(userId, quizId, answers);
    res.json(result);
  } catch (error) {
    console.error('Error submitting quiz:', error);
    res.status(500).json({ error: 'Failed to submit quiz' });
  }
};

exports.getQuizAttempts = async (req, res) => {
  try {
    const { quizId } = req.params;
    const userId = req.userId;

    const attempts = await Quiz.getAttempts(userId, quizId);
    const bestScore = await Quiz.getBestScore(userId, quizId);
    
    res.json({ attempts, bestScore: bestScore ? bestScore.bestScore : null });
  } catch (error) {
    console.error('Error fetching attempts:', error);
    res.status(500).json({ error: 'Failed to fetch attempts' });
  }
};