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

  static async awardWelcomeAchievement(userId) {
    try {
      // Create welcome achievement
      await db.runAsync(
        `INSERT OR IGNORE INTO achievements (name, icon, description) 
         VALUES ('👋 Welcome!', '👋', 'Joined LearnHub and started your learning journey')`
      );
      
      const achievement = await db.getAsync(
        'SELECT id FROM achievements WHERE name = ?',
        ['👋 Welcome!']
      );
      
      if (achievement) {
        await db.runAsync(
          'INSERT OR IGNORE INTO user_achievements (userId, achievementId, earnedAt) VALUES (?, ?, CURRENT_TIMESTAMP)',
          [userId, achievement.id]
        );
        console.log(`🏆 Welcome achievement awarded to user ${userId}`);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error awarding welcome achievement:', error);
      return false;
    }
  }

  static async checkAndAwardAchievements(userId) {
    const achievements = [];
    
    try {
      // 1. Streak achievements
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

      // 2. Course completion achievements
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

      // 3. Lesson achievements
      const completedLessons = await db.getAsync(
        'SELECT COUNT(*) as count FROM lesson_progress WHERE userId = ? AND isCompleted = 1',
        [userId]
      );
      
      if (completedLessons) {
        const count = completedLessons.count;
        if (count >= 10) {
          achievements.push({ name: '📖 Lesson Learner', icon: '📖', description: 'Completed 10 lessons' });
        }
        if (count >= 50) {
          achievements.push({ name: '📚 Lesson Collector', icon: '📚', description: 'Completed 50 lessons' });
        }
        if (count >= 100) {
          achievements.push({ name: '🎯 Lesson Master', icon: '🎯', description: 'Completed 100 lessons' });
        }
      }

      // 4. Quiz achievements
      const quizAttempts = await db.getAsync(
        'SELECT COUNT(*) as count FROM quiz_attempts WHERE userId = ? AND isPassed = 1',
        [userId]
      );
      
      if (quizAttempts) {
        const count = quizAttempts.count;
        if (count >= 1) {
          achievements.push({ name: '📝 Quiz Starter', icon: '📝', description: 'Passed your first quiz' });
        }
        if (count >= 10) {
          achievements.push({ name: '🧠 Quiz Master', icon: '🧠', description: 'Passed 10 quizzes' });
        }
        if (count >= 25) {
          achievements.push({ name: '🏆 Quiz Champion', icon: '🏆', description: 'Passed 25 quizzes' });
        }
      }

      // Award new achievements
      for (const ach of achievements) {
        const existing = await db.getAsync(
          'SELECT * FROM user_achievements ua JOIN achievements a ON ua.achievementId = a.id WHERE ua.userId = ? AND a.name = ?',
          [userId, ach.name]
        );
        
        if (!existing) {
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
            console.log(`🏆 Achievement awarded: ${ach.name} to user ${userId}`);
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