const db = require('../config/database');
const bcrypt = require('bcryptjs');

class User {
  static async create(userData) {
    const { 
      firstName, 
      lastName, 
      email, 
      password, 
      role = 'Student', 
      isInstructor = 0 
    } = userData;
    
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const result = await db.runAsync(
      `INSERT INTO users (
        firstName, lastName, email, password, role, isInstructor, 
        createdAt, lastActiveAt
      ) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
      [firstName, lastName, email, hashedPassword, role, isInstructor]
    );
    
    return result.lastID;
  }

  static async findByEmail(email) {
    return await db.getAsync('SELECT * FROM users WHERE email = ?', [email]);
  }

  static async findById(id) {
    return await db.getAsync(
      `SELECT id, firstName, lastName, email, bio, avatarUrl, streakDays, 
              totalLearningHours, role, isInstructor, instructorBio, expertise, 
              yearsExperience, createdAt, lastActiveAt 
       FROM users WHERE id = ?`,
      [id]
    );
  }

  static async updateStreak(userId) {
    const user = await db.getAsync('SELECT * FROM users WHERE id = ?', [userId]);
    if (!user) return;
    
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const lastActive = user.lastActiveAt ? new Date(user.lastActiveAt) : null;
    const lastActiveDate = lastActive 
      ? new Date(lastActive.getFullYear(), lastActive.getMonth(), lastActive.getDate()) 
      : null;
    
    const diffDays = lastActiveDate 
      ? Math.floor((today - lastActiveDate) / (1000 * 60 * 60 * 24))
      : null;
    
    if (diffDays === null) {
      await db.runAsync(
        'UPDATE users SET streakDays = 1, lastActiveAt = CURRENT_TIMESTAMP WHERE id = ?',
        [userId]
      );
    } else if (diffDays === 0) {
      // Already active today
    } else if (diffDays === 1) {
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
    
    const Achievement = require('./Achievement');
    await Achievement.checkAndAwardAchievements(userId);
  }

  static async updateLearningHours(userId, hours) {
    await db.runAsync(
      'UPDATE users SET totalLearningHours = COALESCE(totalLearningHours, 0) + ? WHERE id = ?',
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
    
    if (updates.length === 0) return;
    
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
              role, isInstructor, createdAt, lastActiveAt, avatarUrl, bio 
       FROM users`
    );
  }
}

module.exports = User;