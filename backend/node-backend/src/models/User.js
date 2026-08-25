const db = require('../config/database');
const bcrypt = require('bcryptjs');

class User {
  static async create(userData) {
    const { firstName, lastName, email, password } = userData;
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const result = await db.runAsync(
      `INSERT INTO users (firstName, lastName, email, password, createdAt, lastActiveAt) 
       VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
      [firstName, lastName, email, hashedPassword]
    );
    
    return result.lastID;
  }

  static async findByEmail(email) {
    return await db.getAsync('SELECT * FROM users WHERE email = ?', [email]);
  }

  static async findById(id) {
    return await db.getAsync(
      `SELECT id, firstName, lastName, email, bio, avatarUrl, streakDays, 
              totalLearningHours, role, createdAt, lastActiveAt 
       FROM users WHERE id = ?`,
      [id]
    );
  }

  static async updateStreak(userId) {
    await db.runAsync(
      `UPDATE users 
       SET streakDays = streakDays + 1, 
           lastActiveAt = CURRENT_TIMESTAMP 
       WHERE id = ?`,
      [userId]
    );
  }

  static async updateProfile(userId, data) {
    const { firstName, lastName, bio, avatarUrl } = data;
    await db.runAsync(
      `UPDATE users 
       SET firstName = ?, lastName = ?, bio = ?, avatarUrl = ?, updatedAt = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [firstName, lastName, bio || '', avatarUrl || '', userId]
    );
  }

  static async updateLearningHours(userId, hours) {
    await db.runAsync(
      'UPDATE users SET totalLearningHours = totalLearningHours + ? WHERE id = ?',
      [hours, userId]
    );
  }

  static async getAll() {
    return await db.allAsync(
      `SELECT id, firstName, lastName, email, streakDays, totalLearningHours, 
              role, createdAt, lastActiveAt 
       FROM users`
    );
  }
}

module.exports = User;