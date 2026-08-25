const db = require('../config/database');

class Enrollment {
  static async findByUser(userId) {
    return await db.allAsync(
      `SELECT e.*, c.title, c.imageUrl, c.duration, c.instructorName 
       FROM enrollments e
       JOIN courses c ON e.courseId = c.id
       WHERE e.userId = ?
       ORDER BY e.enrolledAt DESC`,
      [userId]
    );
  }

  static async findByCourse(courseId) {
    return await db.allAsync(
      `SELECT e.*, u.firstName, u.lastName, u.email
       FROM enrollments e
       JOIN users u ON e.userId = u.id
       WHERE e.courseId = ?
       ORDER BY e.enrolledAt DESC`,
      [courseId]
    );
  }

  static async getProgress(userId, courseId) {
    return await db.getAsync(
      'SELECT progressPercentage, isCompleted, completedAt FROM enrollments WHERE userId = ? AND courseId = ?',
      [userId, courseId]
    );
  }

  static async getStats(userId) {
    return await db.getAsync(
      `SELECT 
        COUNT(*) as totalEnrollments,
        SUM(CASE WHEN isCompleted = 1 THEN 1 ELSE 0 END) as completedCourses,
        AVG(progressPercentage) as averageProgress
       FROM enrollments
       WHERE userId = ?`,
      [userId]
    );
  }
}

module.exports = Enrollment;