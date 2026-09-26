const express = require('express');
const router = express.Router();
const studyGroupController = require('../controllers/studyGroupController');
const { authenticate } = require('../middleware/auth');

// ─── Member lookup routes ──
router.get('/members/preview', authenticate, studyGroupController.getMemberPreviews);
router.get('/members/:userId/profile', authenticate, studyGroupController.getMemberProfile);

// ─── Direct chat (private 2-person group) ──
router.post('/direct/:userId', authenticate, studyGroupController.getOrCreateDirectChat);

// ─── Group routes ──
router.get('/', authenticate, studyGroupController.getAllGroups);
router.get('/:groupId', authenticate, studyGroupController.getGroupById);
router.post('/', authenticate, studyGroupController.createGroup);
router.post('/:groupId/join', authenticate, studyGroupController.joinGroup);
router.delete('/:groupId/leave', authenticate, studyGroupController.leaveGroup);
router.delete('/:groupId/delete', authenticate, studyGroupController.deleteGroup);

// ─── Messages ──
router.get('/:groupId/messages', authenticate, studyGroupController.getMessages);
router.post('/:groupId/messages', authenticate, studyGroupController.sendMessage);

module.exports = router;