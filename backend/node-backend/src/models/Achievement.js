const db = require('../config/database');

class Achievement {
  static async getUserBadges(userId) {
    try {
      return await db.allAsync(
        `SELECT a.*, ua.earnedAt 
         FROM user_achievements ua
         JOIN achievements a ON ua.achievementId = a.id
         WHERE ua.userId = ?
         ORDER BY ua.earnedAt DESC`,
        [userId]
      );
    } catch (error) {
      console.error('Error getting user badges:', error);
      return [];
    }
  }

  static async checkAndAwardAchievements(userId) {
    const achievements = [];
    
    try {
      // Check streak achievements
      const user = await db.getAsync('SELECT streakDays FROM users WHERE id = ?', [userId]);
      if (user) {
        const streak = user.streakDays;
        
        if (streak >= 7) {
          achievements.push({ name: '🔥 7-Day Streak', icon: '🔥', description: 'Maintained a 7-day learning streak' });
        }
        if (streak >= 14) {
          achievements.push({ name: '⚡ 14-Day Streak', icon: '⚡', description: 'Maintained a 14-day learning streak' });
        }
        if (streak >= 30) {
          achievements.push({ name: '🌟 30-Day Streak', icon: '🌟', description: 'Maintained a 30-day learning streak' });
        }
        if (streak >= 100) {
          achievements.push({ name: '🏆 100-Day Streak', icon: '🏆', description: 'Maintained a 100-day learning streak' });
        }
      }

      // Check course completion achievements
      const completedCourses = await db.getAsync(
        'SELECT COUNT(*) as count FROM enrollments WHERE userId = ? AND isCompleted = 1',
        [userId]
      );
      
      if (completedCourses) {
        const count = completedCourses.count;
        if (count >= 1) {
          achievements.push({ name: '🎓 First Course', icon: '🎓', description: 'Completed your first course' });
        }
        if (count >= 5) {
          achievements.push({ name: '📚 Course Collector', icon: '📚', description: 'Completed 5 courses' });
        }
        if (count >= 10) {
          achievements.push({ name: '🏅 Course Master', icon: '🏅', description: 'Completed 10 courses' });
        }
      }

      // Award new achievements
      for (const ach of achievements) {
        const existing = await db.getAsync(
          'SELECT * FROM user_achievements ua JOIN achievements a ON ua.achievementId = a.id WHERE ua.userId = ? AND a.name = ?',
          [userId, ach.name]
        );
        
        if (!existing) {
          // Insert achievement if not exists
          await db.runAsync(
            `INSERT OR IGNORE INTO achievements (name, icon, description) 
             VALUES (?, ?, ?)`,
            [ach.name, ach.icon, ach.description]
          );
          
          const achievement = await db.getAsync('SELECT id FROM achievements WHERE name = ?', [ach.name]);
          if (achievement) {
            await db.runAsync(
              'INSERT OR IGNORE INTO user_achievements (userId, achievementId, earnedAt) VALUES (?, ?, CURRENT_TIMESTAMP)',
              [userId, achievement.id]
            );
          }
        }
      }
    } catch (error) {
      console.error('Error checking achievements:', error);
    }
    
    return achievements;
  }
}

module.exports = Achievement;