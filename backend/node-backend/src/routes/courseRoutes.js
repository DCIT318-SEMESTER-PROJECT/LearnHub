const express = require('express');
const router = express.Router();
const courseController = require('../controllers/courseController');
const { authenticate } = require('../middleware/auth');

// ═══════════════════════════════════════════════════
// INSTRUCTOR ROUTES (must come first to avoid conflicts)
// ═══════════════════════════════════════════════════

// Instructor dashboard
router.get('/instructor/my-courses', authenticate, courseController.getMyCourses);
router.get('/instructor/:id/edit', authenticate, courseController.getCourseForEdit);

// Course CRUD
router.post('/instructor/create', authenticate, courseController.createCourse);
router.put('/instructor/:id', authenticate, courseController.updateCourse);
router.delete('/instructor/:id', authenticate, courseController.deleteCourse);
router.post('/instructor/:id/publish', authenticate, courseController.publishCourse);
router.post('/instructor/:id/unpublish', authenticate, courseController.unpublishCourse);

// Module management
router.post('/instructor/:courseId/modules', authenticate, courseController.addModule);
router.put('/instructor/modules/:moduleId', authenticate, courseController.updateModule);
router.delete('/instructor/modules/:moduleId', authenticate, courseController.deleteModule);

// Lesson management
router.post('/instructor/:courseId/lessons', authenticate, courseController.addLesson);
router.put('/instructor/lessons/:lessonId', authenticate, courseController.updateLesson);
router.delete('/instructor/lessons/:lessonId', authenticate, courseController.deleteLesson);

// ═══════════════════════════════════════════════════
// PUBLIC ROUTES
// ═══════════════════════════════════════════════════

router.get('/', courseController.getAllCourses);

// ═══════════════════════════════════════════════════
// STUDENT ROUTES (single course, enrollments, progress)
// ═══════════════════════════════════════════════════

router.get('/:id', authenticate, courseController.getCourseById);
router.post('/:courseId/enroll', authenticate, courseController.enrollInCourse);
router.delete('/:courseId/unenroll', authenticate, courseController.unenrollFromCourse);
router.put('/lessons/:lessonId/progress', authenticate, courseController.trackLessonProgress);

module.exports = router;