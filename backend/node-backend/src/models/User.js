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
    // Check if user was active today
    const user = await this.findById(userId);
    if (!user) return;
    
    const lastActive = user.lastActiveAt ? new Date(user.lastActiveAt) : null;
    const today = new Date();
    const todayStr = today.toDateString();
    
    if (lastActive) {
      const lastActiveStr = new Date(lastActive).toDateString();
      
      // If already active today, don't update streak
      if (lastActiveStr === todayStr) {
        return;
      }
      
      // If last active was yesterday, increment streak
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toDateString();
      
      if (lastActiveStr === yesterdayStr) {
        await db.runAsync(
          'UPDATE users SET streakDays = streakDays + 1, lastActiveAt = CURRENT_TIMESTAMP WHERE id = ?',
          [userId]
        );
      } else {
        // Reset streak if more than 1 day gap
        await db.runAsync(
          'UPDATE users SET streakDays = 1, lastActiveAt = CURRENT_TIMESTAMP WHERE id = ?',
          [userId]
        );
      }
    } else {
      // First time logging in
      await db.runAsync(
        'UPDATE users SET streakDays = 1, lastActiveAt = CURRENT_TIMESTAMP WHERE id = ?',
        [userId]
      );
    }
    
    // Check for achievements after streak update
    const Achievement = require('./Achievement');
    await Achievement.checkAndAwardAchievements(userId);
  }

  static async updateLearningHours(userId, hours) {
    await db.runAsync(
      'UPDATE users SET totalLearningHours = totalLearningHours + ? WHERE id = ?',
      [hours, userId]
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

  static async getAll() {
    return await db.allAsync(
      `SELECT id, firstName, lastName, email, streakDays, totalLearningHours, 
              role, createdAt, lastActiveAt 
       FROM users`
    );
  }
}

module.exports = User;