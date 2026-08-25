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
    const user = await this.findById(userId);
    if (!user) return;
    
    const lastActive = user.lastActiveAt ? new Date(user.lastActiveAt) : null;
    const today = new Date();
    const todayStr = today.toDateString();
    
    if (lastActive) {
      const lastActiveStr = new Date(lastActive).toDateString();
      
      if (lastActiveStr === todayStr) {
        return;
      }
      
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toDateString();
      
      if (lastActiveStr === yesterdayStr) {
        await db.runAsync(
          'UPDATE users SET streakDays = streakDays + 1, lastActiveAt = CURRENT_TIMESTAMP WHERE id = ?',
          [userId]
        );
      } else {
        await db.runAsync(
          'UPDATE users SET streakDays = 1, lastActiveAt = CURRENT_TIMESTAMP WHERE id = ?',
          [userId]
        );
      }
    } else {
      await db.runAsync(
        'UPDATE users SET streakDays = 1, lastActiveAt = CURRENT_TIMESTAMP WHERE id = ?',
        [userId]
      );
    }
    
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
    
    const updates = [];
    const values = [];
    
    if (firstName !== undefined) {
      updates.push('firstName = ?');
      values.push(firstName);
    }
    if (lastName !== undefined) {
      updates.push('lastName = ?');
      values.push(lastName);
    }
    if (bio !== undefined) {
      updates.push('bio = ?');
      values.push(bio || '');
    }
    if (avatarUrl !== undefined) {
      updates.push('avatarUrl = ?');
      values.push(avatarUrl || '');
    }
    
    if (updates.length === 0) {
      return;
    }
    
    await db.runAsync(
      `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
      [...values, userId]
    );
  }

  static async updateAvatar(userId, avatarUrl) {
    await db.runAsync(
      'UPDATE users SET avatarUrl = ? WHERE id = ?',
      [avatarUrl, userId]
    );
  }

  static async getAll() {
    return await db.allAsync(
      `SELECT id, firstName, lastName, email, streakDays, totalLearningHours, 
              role, createdAt, lastActiveAt, avatarUrl, bio 
       FROM users`
    );
  }
}

module.exports = User;