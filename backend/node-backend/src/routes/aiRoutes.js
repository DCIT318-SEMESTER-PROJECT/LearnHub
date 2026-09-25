const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const { authenticate } = require('../middleware/auth');

router.post('/generate-description', authenticate, aiController.generateDescription);
router.post('/chat', authenticate, aiController.chatWithAI);
router.post('/chat-stream', authenticate, aiController.streamChat);
router.post('/generate-quiz', authenticate, aiController.generateQuiz);
router.post('/generate-outline', authenticate, aiController.generateOutline);

module.exports = router;