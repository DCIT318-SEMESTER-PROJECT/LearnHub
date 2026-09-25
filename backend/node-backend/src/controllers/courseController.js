const Course = require('../models/Course');
const User = require('../models/User');
const Achievement = require('../models/Achievement');
const db = require('../config/database');

// ═══════════════════════════════════════════════════
// PUBLIC / STUDENT ENDPOINTS
// ═══════════════════════════════════════════════════

exports.getAllCourses = async (req, res) => {
  try {
    const courses = await Course.findAll();
    res.json(courses);
  } catch (error) {
    console.error('Error fetching courses:', error);
    res.status(500).json({ error: 'Failed to fetch courses' });
  }
};

exports.getCourseById = async (req, res) => {
  try {
    const { id } = req.params;
    const course = await Course.findById(id);

    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    const lessons = await Course.getLessons(id);
    const userId = req.userId;

    for (let lesson of lessons) {
      const progress = await Course.getLessonProgress(userId, lesson.id);
      lesson.isCompleted = progress ? !!progress.isCompleted : false;
      lesson.watchTime = progress ? progress.watchTimeSeconds : 0;
    }

    const enrollment = await Course.getEnrollment(userId, id);
    const isEnrolled = !!enrollment;
    const progress = enrollment ? enrollment.progressPercentage : 0;
    const completedLessons = lessons.filter(l => l.isCompleted).length;

    res.json({
      ...course,
      lessons,
      isEnrolled,
      progress,
      completedLessons,
      totalLessons: lessons.length
    });
  } catch (error) {
    console.error('Error fetching course:', error);
    res.status(500).json({ error: 'Failed to fetch course' });
  }
};

exports.enrollInCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.userId;

    const result = await Course.enrollUser(userId, courseId);
    if (!result) {
      return res.status(400).json({ error: 'Already enrolled' });
    }

    console.log(`✅ User ${userId} enrolled in course ${courseId}`);
    res.json({ success: true, message: 'Enrolled successfully' });
  } catch (error) {
    console.error('Error enrolling:', error);
    res.status(500).json({ error: 'Failed to enroll' });
  }
};

exports.unenrollFromCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.userId;

    await Course.unenrollUser(userId, courseId);
    res.json({ success: true, message: 'Unenrolled successfully' });
  } catch (error) {
    console.error('Error unenrolling:', error);
    res.status(500).json({ error: 'Failed to unenroll' });
  }
};

exports.trackLessonProgress = async (req, res) => {
  try {
    const { lessonId } = req.params;
    const { completed, watchTime } = req.body;
    const userId = req.userId;

    console.log(`📊 Tracking: user=${userId}, lesson=${lessonId}, completed=${completed}, watchTime=${watchTime}s`);

    const lesson = await Course.getLessonById(lessonId);
    if (!lesson) {
      return res.status(404).json({ error: 'Lesson not found' });
    }

    await Course.updateLessonProgress(userId, lessonId, completed, watchTime || 0);

    if (completed && watchTime && watchTime > 0) {
      const hoursToAdd = watchTime / 3600;
      await db.runAsync(
        'UPDATE users SET totalLearningHours = COALESCE(totalLearningHours, 0) + ? WHERE id = ?',
        [hoursToAdd, userId]
      );
      console.log(`⏱️ Added ${watchTime}s (${hoursToAdd.toFixed(4)}h) to user ${userId}`);
    }

    if (completed) {
      await User.updateStreak(userId);
      await Achievement.checkAndAwardAchievements(userId);
    }

    res.json({ success: true, message: 'Progress updated' });
  } catch (error) {
    console.error('Error tracking progress:', error);
    res.status(500).json({ error: 'Failed to update progress' });
  }
};

exports.getUserEnrollments = async (req, res) => {
  try {
    const { userId } = req.params;
    const enrollments = await Course.getUserEnrollments(userId);
    res.json(enrollments);
  } catch (error) {
    console.error('Error fetching enrollments:', error);
    res.status(500).json({ error: 'Failed to fetch enrollments' });
  }
};

// ═══════════════════════════════════════════════════
// INSTRUCTOR COURSE MANAGEMENT
// ═══════════════════════════════════════════════════

exports.createCourse = async (req, res) => {
  try {
    const instructorId = req.userId;
    const data = req.body;

    if (!data.title) {
      return res.status(400).json({ error: 'Course title is required' });
    }

    console.log('🎬 Creating course:', data.title, 'by instructor', instructorId);

    const instructor = await User.findById(instructorId);
    const instructorName = instructor
      ? `${instructor.firstName} ${instructor.lastName}`
      : 'Instructor';

    const courseId = await Course.createByInstructor(instructorId, {
      title: data.title,
      description: data.description || '',
      category: data.category || 'Web Development',
      difficultyLevel: data.difficultyLevel || 'Beginner',
      duration: data.duration || '0 hours',
      price: data.price || 0,
      prerequisites: data.prerequisites || '',
      learningOutcomes: data.learningOutcomes || '',
      imageUrl: data.imageUrl || '',
      isPublished: 0,
      instructorName
    });

    const course = await db.getAsync('SELECT * FROM courses WHERE id = ?', [courseId]);
    res.status(201).json({ message: 'Course created', course });
  } catch (error) {
    console.error('Error creating course:', error);
    res.status(500).json({ error: 'Failed to create course: ' + error.message });
  }
};

exports.updateCourse = async (req, res) => {
  try {
    const { id } = req.params;
    const instructorId = req.userId;

    const course = await Course.updateByInstructor(id, instructorId, req.body);
    res.json({ message: 'Course updated', course });
  } catch (error) {
    console.error('Error updating course:', error);
    res.status(500).json({ error: 'Failed to update course: ' + error.message });
  }
};

exports.deleteCourse = async (req, res) => {
  try {
    const { id } = req.params;
    const instructorId = req.userId;

    await Course.deleteByInstructor(id, instructorId);
    res.json({ message: 'Course deleted' });
  } catch (error) {
    console.error('Error deleting course:', error);
    res.status(500).json({ error: 'Failed to delete course: ' + error.message });
  }
};

exports.getMyCourses = async (req, res) => {
  try {
    const instructorId = req.userId;
    const courses = await Course.getInstructorCourses(instructorId);
    res.json(courses);
  } catch (error) {
    console.error('Error fetching instructor courses:', error);
    res.status(500).json({ error: 'Failed to fetch courses' });
  }
};

exports.getCourseForEdit = async (req, res) => {
  try {
    const { id } = req.params;
    const instructorId = req.userId;

    const course = await Course.getCourseForEdit(id, instructorId);
    if (!course) {
      return res.status(404).json({ error: 'Course not found or not owned by you' });
    }
    res.json(course);
  } catch (error) {
    console.error('Error fetching course for edit:', error);
    res.status(500).json({ error: 'Failed to fetch course' });
  }
};

exports.publishCourse = async (req, res) => {
  try {
    const { id } = req.params;
    const instructorId = req.userId;

    const lessonCount = await db.getAsync(
      `SELECT COUNT(*) as count FROM lessons l
       JOIN courses c ON l.courseId = c.id
       WHERE c.id = ? AND c.instructorId = ?`,
      [id, instructorId]
    );

    if (!lessonCount || lessonCount.count === 0) {
      return res.status(400).json({ error: 'Add at least one lesson before publishing' });
    }

    const course = await Course.updateByInstructor(id, instructorId, { isPublished: 1 });

    // ✅ Award instructor badges immediately after publishing
    try {
      await Achievement.checkAndAwardInstructorAchievements(instructorId);
      console.log(`🏆 Instructor badges checked for user ${instructorId} after publishing course ${id}`);
    } catch (badgeErr) {
      console.warn('Instructor badge check failed (non-fatal):', badgeErr.message);
    }

    res.json({ message: 'Course published successfully! 🎉', course });
  } catch (error) {
    console.error('Error publishing course:', error);
    res.status(500).json({ error: 'Failed to publish course: ' + error.message });
  }
};

exports.unpublishCourse = async (req, res) => {
  try {
    const { id } = req.params;
    const instructorId = req.userId;

    const course = await Course.updateByInstructor(id, instructorId, { isPublished: 0 });
    res.json({ message: 'Course unpublished', course });
  } catch (error) {
    console.error('Error unpublishing course:', error);
    res.status(500).json({ error: 'Failed to unpublish course: ' + error.message });
  }
};

// ═══════════════════════════════════════════════════
// MODULE MANAGEMENT
// ═══════════════════════════════════════════════════

exports.addModule = async (req, res) => {
  try {
    const { courseId } = req.params;
    const instructorId = req.userId;

    if (!req.body.title) {
      return res.status(400).json({ error: 'Module title is required' });
    }

    const module = await Course.addModule(courseId, instructorId, req.body);
    res.status(201).json(module);
  } catch (error) {
    console.error('Error adding module:', error);
    res.status(500).json({ error: 'Failed to add module: ' + error.message });
  }
};

exports.updateModule = async (req, res) => {
  try {
    const { moduleId } = req.params;
    const instructorId = req.userId;

    const module = await Course.updateModule(moduleId, instructorId, req.body);
    res.json(module);
  } catch (error) {
    console.error('Error updating module:', error);
    res.status(500).json({ error: 'Failed to update module: ' + error.message });
  }
};

exports.deleteModule = async (req, res) => {
  try {
    const { moduleId } = req.params;
    const instructorId = req.userId;

    await Course.deleteModule(moduleId, instructorId);
    res.json({ message: 'Module deleted' });
  } catch (error) {
    console.error('Error deleting module:', error);
    res.status(500).json({ error: 'Failed to delete module: ' + error.message });
  }
};

// ═══════════════════════════════════════════════════
// LESSON MANAGEMENT
// ═══════════════════════════════════════════════════

exports.addLesson = async (req, res) => {
  try {
    const { courseId } = req.params;
    const instructorId = req.userId;

    if (!req.body.title) {
      return res.status(400).json({ error: 'Lesson title is required' });
    }

    const lesson = await Course.addLesson(courseId, instructorId, req.body);
    res.status(201).json(lesson);
  } catch (error) {
    console.error('Error adding lesson:', error);
    res.status(500).json({ error: 'Failed to add lesson: ' + error.message });
  }
};

exports.updateLesson = async (req, res) => {
  try {
    const { lessonId } = req.params;
    const instructorId = req.userId;

    const lesson = await Course.updateLesson(lessonId, instructorId, req.body);
    res.json(lesson);
  } catch (error) {
    console.error('Error updating lesson:', error);
    res.status(500).json({ error: 'Failed to update lesson: ' + error.message });
  }
};

exports.deleteLesson = async (req, res) => {
  try {
    const { lessonId } = req.params;
    const instructorId = req.userId;

    await Course.deleteLesson(lessonId, instructorId);
    res.json({ message: 'Lesson deleted' });
  } catch (error) {
    console.error('Error deleting lesson:', error);
    res.status(500).json({ error: 'Failed to delete lesson: ' + error.message });
  }
};