const db = require('../config/database');

class Course {
  static async findAll() {
    const courses = await db.allAsync('SELECT * FROM courses WHERE isPublished = 1');
    
    // Get student count for each course
    for (let course of courses) {
      const result = await db.getAsync(
        'SELECT COUNT(*) as count FROM enrollments WHERE courseId = ?',
        [course.id]
      );
      course.totalReviews = result ? result.count : 0;
    }
    
    return courses;
  }

  static async findById(id) {
    const course = await db.getAsync('SELECT * FROM courses WHERE id = ? AND isPublished = 1', [id]);
    if (course) {
      const result = await db.getAsync(
        'SELECT COUNT(*) as count FROM enrollments WHERE courseId = ?',
        [course.id]
      );
      course.totalReviews = result ? result.count : 0;
    }
    return course;
  }

  static async getLessons(courseId) {
    return await db.allAsync(
      'SELECT * FROM lessons WHERE courseId = ? ORDER BY orderNumber',
      [courseId]
    );
  }

  static async getLessonById(lessonId) {
    return await db.getAsync('SELECT * FROM lessons WHERE id = ?', [lessonId]);
  }

  static async getEnrollment(userId, courseId) {
    return await db.getAsync(
      'SELECT * FROM enrollments WHERE userId = ? AND courseId = ?',
      [userId, courseId]
    );
  }

  static async enrollUser(userId, courseId) {
    const existing = await this.getEnrollment(userId, courseId);
    if (existing) return null;

    const result = await db.runAsync(
      `INSERT INTO enrollments (userId, courseId, enrolledAt) 
       VALUES (?, ?, CURRENT_TIMESTAMP)`,
      [userId, courseId]
    );
    return result.lastID;
  }

  static async unenrollUser(userId, courseId) {
    await db.runAsync(
      'DELETE FROM enrollments WHERE userId = ? AND courseId = ?',
      [userId, courseId]
    );
  }

  static async getLessonProgress(userId, lessonId) {
    return await db.getAsync(
      'SELECT * FROM lesson_progress WHERE userId = ? AND lessonId = ?',
      [userId, lessonId]
    );
  }

  static async updateLessonProgress(userId, lessonId, completed, watchTime = 0) {
    const existing = await this.getLessonProgress(userId, lessonId);
    
    if (existing) {
      await db.runAsync(
        `UPDATE lesson_progress 
         SET isCompleted = ?, 
             completedAt = ?, 
             watchTimeSeconds = watchTimeSeconds + ?
         WHERE userId = ? AND lessonId = ?`,
        [completed, completed ? new Date().toISOString() : null, watchTime, userId, lessonId]
      );
    } else {
      await db.runAsync(
        `INSERT INTO lesson_progress (userId, lessonId, isCompleted, completedAt, watchTimeSeconds) 
         VALUES (?, ?, ?, ?, ?)`,
        [userId, lessonId, completed, completed ? new Date().toISOString() : null, watchTime]
      );
    }

    await this.updateCourseProgress(userId, lessonId);
  }

  static async updateCourseProgress(userId, lessonId) {
    const lesson = await db.getAsync('SELECT courseId FROM lessons WHERE id = ?', [lessonId]);
    if (!lesson) return;

    const courseId = lesson.courseId;

    const totalLessons = await db.getAsync(
      'SELECT COUNT(*) as count FROM lessons WHERE courseId = ?',
      [courseId]
    );

    const completedLessons = await db.getAsync(
      `SELECT COUNT(*) as count FROM lesson_progress lp
       JOIN lessons l ON lp.lessonId = l.id
       WHERE lp.userId = ? AND l.courseId = ? AND lp.isCompleted = 1`,
      [userId, courseId]
    );

    const progress = totalLessons.count > 0 ? Math.round((completedLessons.count / totalLessons.count) * 100) : 0;
    const isCompleted = progress === 100;

    await db.runAsync(
      `UPDATE enrollments 
       SET progressPercentage = ?, 
           isCompleted = ?, 
           completedAt = ?,
           completedLessons = ?
       WHERE userId = ? AND courseId = ?`,
      [progress, isCompleted, isCompleted ? new Date().toISOString() : null, completedLessons.count, userId, courseId]
    );
  }

  static async getUserEnrollments(userId) {
    return await db.allAsync(
      `SELECT e.*, c.title, c.imageUrl, c.duration, c.instructorName 
       FROM enrollments e
       JOIN courses c ON e.courseId = c.id
       WHERE e.userId = ?`,
      [userId]
    );
  }
}

module.exports = Course;