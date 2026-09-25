const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const { authenticate } = require('../middleware/auth');

// Authenticated only — prevents anonymous abuse of your API quota
router.post('/generate-description', authenticate, aiController.generateDescription);

module.exports = router;