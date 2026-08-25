const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');

// Auth routes
router.post('/register', authController.register);
router.post('/login', authController.login);

// Profile routes
router.get('/profile', authenticate, authController.getProfile);
router.put('/profile', authenticate, authController.updateProfile);

// Avatar routes
router.post('/avatar', authenticate, authController.uploadAvatar);
router.delete('/avatar', authenticate, authController.removeAvatar);

// Achievement routes
router.get('/achievements', authenticate, authController.getAchievements);

// Account management
router.delete('/account', authenticate, authController.deleteAccount);
router.get('/users', authenticate, authController.getAllUsers);

// Debug route (remove in production)
router.get('/debug/users', authenticate, authController.debugUsers);

module.exports = router;