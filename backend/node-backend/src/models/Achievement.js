const db = require('../config/database');

class Achievement {
  // ─── Existing student methods unchanged ─────────────────
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
      await db.runAsync(
        `INSERT OR IGNORE INTO achievements (name, icon, description)
         VALUES ('👋 Welcome!', '👋', 'Joined LearnHub and started your learning journey')`
      );
      const achievement = await db.getAsync('SELECT id FROM achievements WHERE name = ?', ['👋 Welcome!']);
      if (achievement) {
        await db.runAsync(
          'INSERT OR IGNORE INTO user_achievements (userId, achievementId, earnedAt) VALUES (?, ?, CURRENT_TIMESTAMP)',
          [userId, achievement.id]
        );
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
        if (streak >= 7)   achievements.push({ name: '🔥 7-Day Streak',   icon: '🔥', description: 'Maintained a 7-day learning streak' });
        if (streak >= 14)  achievements.push({ name: '⚡ 14-Day Streak',  icon: '⚡', description: 'Maintained a 14-day learning streak' });
        if (streak >= 30)  achievements.push({ name: '🌟 30-Day Streak',  icon: '🌟', description: 'Maintained a 30-day learning streak' });
        if (streak >= 100) achievements.push({ name: '🏆 100-Day Streak', icon: '🏆', description: 'Maintained a 100-day learning streak' });
      }

      // 2. Course completion achievements
      const completedCourses = await db.getAsync(
        'SELECT COUNT(*) as count FROM enrollments WHERE userId = ? AND isCompleted = 1',
        [userId]
      );
      if (completedCourses) {
        const count = completedCourses.count;
        if (count >= 1)  achievements.push({ name: '🎓 First Course',      icon: '🎓', description: 'Completed your first course' });
        if (count >= 5)  achievements.push({ name: '📚 Course Collector',  icon: '📚', description: 'Completed 5 courses' });
        if (count >= 10) achievements.push({ name: '🏅 Course Master',     icon: '🏅', description: 'Completed 10 courses' });
      }

      // 3. Lesson achievements
      const completedLessons = await db.getAsync(
        'SELECT COUNT(*) as count FROM lesson_progress WHERE userId = ? AND isCompleted = 1',
        [userId]
      );
      if (completedLessons) {
        const count = completedLessons.count;
        if (count >= 10)  achievements.push({ name: '📖 Lesson Learner',   icon: '📖', description: 'Completed 10 lessons' });
        if (count >= 50)  achievements.push({ name: '📚 Lesson Collector', icon: '📚', description: 'Completed 50 lessons' });
        if (count >= 100) achievements.push({ name: '🎯 Lesson Master',    icon: '🎯', description: 'Completed 100 lessons' });
      }

      // 4. Quiz achievements
      const quizAttempts = await db.getAsync(
        'SELECT COUNT(*) as count FROM quiz_attempts WHERE userId = ? AND isPassed = 1',
        [userId]
      );
      if (quizAttempts) {
        const count = quizAttempts.count;
        if (count >= 1)  achievements.push({ name: '📝 Quiz Starter',   icon: '📝', description: 'Passed your first quiz' });
        if (count >= 10) achievements.push({ name: '🧠 Quiz Master',    icon: '🧠', description: 'Passed 10 quizzes' });
        if (count >= 25) achievements.push({ name: '🏆 Quiz Champion',  icon: '🏆', description: 'Passed 25 quizzes' });
      }

      await this._awardMany(userId, achievements);
    } catch (error) {
      console.error('Error checking achievements:', error);
    }
    return achievements;
  }

  // ═══════════════════════════════════════════════════════
  // INSTRUCTOR BADGES
  // ═══════════════════════════════════════════════════════
  static async checkAndAwardInstructorAchievements(userId) {
    const achievements = [];
    try {
      // Only run for instructors
      const user = await db.getAsync('SELECT isInstructor FROM users WHERE id = ?', [userId]);
      if (!user || !user.isInstructor) return achievements;

      // Courses stats
      const courseStats = await db.getAsync(
        `SELECT
           COUNT(*) as totalCourses,
           SUM(CASE WHEN isPublished = 1 THEN 1 ELSE 0 END) as publishedCourses
         FROM courses WHERE instructorId = ?`,
        [userId]
      );
      const totalCourses = courseStats?.totalCourses || 0;
      const publishedCourses = courseStats?.publishedCourses || 0;

      // Students stats
      const studentsResult = await db.getAsync(
        `SELECT COUNT(DISTINCT e.userId) as count
         FROM enrollments e
         JOIN courses c ON e.courseId = c.id
         WHERE c.instructorId = ?`,
        [userId]
      );
      const totalStudents = studentsResult?.count || 0;

      // Rating stats
      const ratingsResult = await db.getAsync(
        `SELECT COUNT(*) as totalReviews, COALESCE(AVG(rating), 0) as avgRating
         FROM course_ratings r
         JOIN courses c ON r.courseId = c.id
         WHERE c.instructorId = ?`,
        [userId]
      );
      const totalReviews = ratingsResult?.totalReviews || 0;
      const avgRating = ratingsResult?.avgRating || 0;

      // Study groups created for this instructor's courses
      const groupsResult = await db.getAsync(
        `SELECT COUNT(*) as count
         FROM study_groups sg
         JOIN courses c ON sg.courseId = c.id
         WHERE c.instructorId = ?`,
        [userId]
      );
      const groupsCount = groupsResult?.count || 0;

      // Days since registration
      const daysResult = await db.getAsync(
        `SELECT CAST(julianday('now') - julianday(createdAt) AS INTEGER) as days
         FROM users WHERE id = ?`,
        [userId]
      );
      const daysSince = daysResult?.days || 0;

      // ── Award the badges ──
      if (publishedCourses >= 1) {
        achievements.push({ name: '🎬 First Course Published', icon: '🎬', description: 'Published your first course' });
      }
      if (publishedCourses >= 3) {
        achievements.push({ name: '📚 Course Creator', icon: '📚', description: 'Published 3 or more courses' });
      }
      if (publishedCourses >= 10) {
        achievements.push({ name: '🏛️ Course Empire', icon: '🏛️', description: 'Published 10 or more courses' });
      }
      if (totalStudents >= 1) {
        achievements.push({ name: '👥 First Student', icon: '👥', description: 'Someone enrolled in your course' });
      }
      if (totalStudents >= 10) {
        achievements.push({ name: '🌟 Popular Instructor', icon: '🌟', description: '10 or more students across your courses' });
      }
      if (totalStudents >= 100) {
        achievements.push({ name: '🚀 Rockstar Instructor', icon: '🚀', description: '100 or more students across your courses' });
      }
      if (totalReviews >= 1 && avgRating >= 4.5) {
        achievements.push({ name: '⭐ Five Star Teacher', icon: '⭐', description: 'Average rating of 4.5 stars or higher' });
      }
      if (groupsCount >= 1) {
        achievements.push({ name: '💬 Community Builder', icon: '💬', description: 'Students created a study group for your course' });
      }
      if (daysSince >= 180 && publishedCourses >= 1) {
        achievements.push({ name: '🏅 Veteran Instructor', icon: '🏅', description: 'Teaching on LearnHub for 6 months or more' });
      }

      await this._awardMany(userId, achievements);
    } catch (error) {
      console.error('Error checking instructor achievements:', error);
    }
    return achievements;
  }

  // ─── shared helper ─────────────────────────────────────
  static async _awardMany(userId, achievements) {
    for (const ach of achievements) {
      const existing = await db.getAsync(
        `SELECT 1 FROM user_achievements ua
         JOIN achievements a ON ua.achievementId = a.id
         WHERE ua.userId = ? AND a.name = ?`,
        [userId, ach.name]
      );
      if (existing) continue;

      await db.runAsync(
        `INSERT OR IGNORE INTO achievements (name, icon, description) VALUES (?, ?, ?)`,
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
}

module.exports = Achievement;