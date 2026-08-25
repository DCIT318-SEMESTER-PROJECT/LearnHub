const express = require('express');
const router = express.Router();
const quizController = require('../controllers/quizController');
const { authenticate } = require('../middleware/auth');

router.get('/:quizId', authenticate, quizController.getQuizById);
router.post('/:quizId/submit', authenticate, quizController.submitQuiz);

module.exports = router;