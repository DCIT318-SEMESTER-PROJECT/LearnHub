const express = require('express');
const router = express.Router();
const quizController = require('../controllers/quizController');
const { authenticate } = require('../middleware/auth');

router.get('/course/:courseId', quizController.getQuizByCourse);
router.post('/course/:courseId', authenticate, quizController.upsertQuiz);
router.post('/course/:courseId/submit', authenticate, quizController.submitQuiz);

module.exports = router;