const Course = require('../models/Course');
const db = require('../config/database');

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

    console.log(`📊 Tracking progress: User ${userId}, Lesson ${lessonId}, Completed: ${completed}`);

    const lesson = await Course.getLessonById(lessonId);
    if (!lesson) {
      return res.status(404).json({ error: 'Lesson not found' });
    }

    const courseInfo = await db.getAsync('SELECT courseId FROM lessons WHERE id = ?', [lessonId]);
    if (!courseInfo) {
      return res.status(404).json({ error: 'Course not found for this lesson' });
    }

    const enrollment = await Course.getEnrollment(userId, courseInfo.courseId);
    if (!enrollment) {
      return res.status(403).json({ error: 'You must be enrolled in this course' });
    }

    await Course.updateLessonProgress(userId, lessonId, completed, watchTime || 0);
    
    const progress = await Course.getLessonProgress(userId, lessonId);
    const updatedEnrollment = await Course.getEnrollment(userId, courseInfo.courseId);
    
    res.json({ 
      success: true, 
      message: 'Progress updated',
      progress: progress,
      courseProgress: updatedEnrollment ? updatedEnrollment.progressPercentage : 0
    });
  } catch (error) {
    console.error('Error tracking progress:', error);
    res.status(500).json({ error: 'Failed to update progress: ' + error.message });
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