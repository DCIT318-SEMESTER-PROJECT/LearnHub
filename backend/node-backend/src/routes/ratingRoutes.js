const express = require('express');
const router = express.Router();
const ratingController = require('../controllers/ratingController');
const { authenticate } = require('../middleware/auth');

// Public
router.get('/:courseId', ratingController.getCourseRatings);

// Authenticated
router.get('/:courseId/mine', authenticate, ratingController.getMyRating);
router.post('/:courseId', authenticate, ratingController.submitRating);

module.exports = router;