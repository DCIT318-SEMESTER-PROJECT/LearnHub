const db = require('../config/database');

class Lesson {
  static async findById(id) {
    return await db.getAsync('SELECT * FROM lessons WHERE id = ?', [id]);
  }

  static async findByCourse(courseId) {
    return await db.allAsync(
      'SELECT * FROM lessons WHERE courseId = ? ORDER BY orderNumber',
      [courseId]
    );
  }

  static async create(lessonData) {
    const { courseId, title, description, videoUrl, content, orderNumber, duration, isFree } = lessonData;
    const result = await db.runAsync(
      `INSERT INTO lessons (courseId, title, description, videoUrl, content, orderNumber, duration, isFree)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [courseId, title, description, videoUrl, content, orderNumber, duration, isFree || 0]
    );
    return result.lastID;
  }

  static async update(id, lessonData) {
    const { title, description, videoUrl, content, orderNumber, duration, isFree } = lessonData;
    await db.runAsync(
      `UPDATE lessons 
       SET title = ?, description = ?, videoUrl = ?, content = ?, 
           orderNumber = ?, duration = ?, isFree = ?
       WHERE id = ?`,
      [title, description, videoUrl, content, orderNumber, duration, isFree || 0, id]
    );
  }

  static async delete(id) {
    await db.runAsync('DELETE FROM lessons WHERE id = ?', [id]);
  }
}

module.exports = Lesson;