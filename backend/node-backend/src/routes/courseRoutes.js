const express = require('express');
const router = express.Router();
const courseController = require('../controllers/courseController');
const { authenticate } = require('../middleware/auth');

// Make sure all routes have proper callback functions
router.get('/', courseController.getAllCourses);
router.get('/:id', authenticate, courseController.getCourseById);
router.post('/:courseId/enroll', authenticate, courseController.enrollInCourse);
router.delete('/:courseId/unenroll', authenticate, courseController.unenrollFromCourse);
router.put('/lessons/:lessonId/progress', authenticate, courseController.trackLessonProgress);

module.exports = router;