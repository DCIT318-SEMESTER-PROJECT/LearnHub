const express = require('express');
const router = express.Router();
const studyGroupController = require('../controllers/studyGroupController');
const { authenticate } = require('../middleware/auth');

// All routes require authentication
router.use(authenticate);

// Group management
router.get('/', studyGroupController.getAllGroups);
router.get('/:groupId', studyGroupController.getGroupById);
router.post('/', studyGroupController.createGroup);

// Membership
router.post('/:groupId/join', studyGroupController.joinGroup);
router.delete('/:groupId/leave', studyGroupController.leaveGroup);

// Group deletion
router.delete('/:groupId/delete', studyGroupController.deleteGroup);

// Messages
router.get('/:groupId/messages', studyGroupController.getMessages);
router.post('/:groupId/messages', studyGroupController.sendMessage);

module.exports = router;