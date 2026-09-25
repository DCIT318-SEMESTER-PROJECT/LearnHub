const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const { authenticate } = require('../middleware/auth');

router.get('/conversations', authenticate, messageController.getConversations);
router.get('/unread/count', authenticate, messageController.getUnreadCount);
router.get('/:userId', authenticate, messageController.getThread);
router.post('/:userId', authenticate, messageController.sendMessage);
router.delete('/:userId', authenticate, messageController.clearThread);

module.exports = router;