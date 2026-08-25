const express = require('express');
const router = express.Router();
const enrollmentController = require('../controllers/enrollmentController');
const { authenticate } = require('../middleware/auth');

router.post('/:courseId/enroll', authenticate, enrollmentController.enroll);
router.delete('/:courseId/unenroll', authenticate, enrollmentController.unenroll);
router.get('/user/:userId', authenticate, enrollmentController.getUserEnrollments);

module.exports = router;