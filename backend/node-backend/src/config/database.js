const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '../../learnhub.db');
const db = new sqlite3.Database(dbPath);

// Enable foreign keys
db.run('PRAGMA foreign_keys = ON');

// Helper to run queries with promises
db.runAsync = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
};

db.getAsync = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

db.allAsync = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

// ─── Database Initialization ───
const initializeDatabase = () => {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Users table
      db.run(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          firstName TEXT,
          lastName TEXT,
          email TEXT UNIQUE,
          password TEXT,
          avatarUrl TEXT,
          bio TEXT,
          streakDays INTEGER DEFAULT 0,
          totalLearningHours INTEGER DEFAULT 0,
          role TEXT DEFAULT 'Student',
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          lastActiveAt DATETIME
        )
      `, (err) => {
        if (err) {
          console.error('❌ Error creating users table:', err.message);
          reject(err);
        }
      });

      // Courses table
      db.run(`
        CREATE TABLE IF NOT EXISTS courses (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          title TEXT,
          description TEXT,
          category TEXT,
          difficultyLevel TEXT,
          imageUrl TEXT,
          totalLessons INTEGER,
          rating REAL DEFAULT 0,
          totalReviews INTEGER DEFAULT 0,
          instructorId INTEGER,
          instructorName TEXT,
          duration TEXT,
          price REAL DEFAULT 0,
          isPublished BOOLEAN DEFAULT 0,
          prerequisites TEXT,
          learningOutcomes TEXT,
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Lessons table
      db.run(`
        CREATE TABLE IF NOT EXISTS lessons (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          courseId INTEGER,
          title TEXT,
          description TEXT,
          videoUrl TEXT,
          content TEXT,
          orderNumber INTEGER,
          duration TEXT,
          isFree BOOLEAN DEFAULT 0,
          FOREIGN KEY(courseId) REFERENCES courses(id)
        )
      `);

      // Enrollments table
      db.run(`
        CREATE TABLE IF NOT EXISTS enrollments (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          userId INTEGER,
          courseId INTEGER,
          progressPercentage INTEGER DEFAULT 0,
          completedLessons INTEGER DEFAULT 0,
          isCompleted BOOLEAN DEFAULT 0,
          enrolledAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          lastAccessedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(userId, courseId)
        )
      `);

      // Lesson Progress table
      db.run(`
        CREATE TABLE IF NOT EXISTS lesson_progress (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          userId INTEGER,
          lessonId INTEGER,
          isCompleted BOOLEAN DEFAULT 0,
          watchTimeSeconds INTEGER DEFAULT 0,
          completedAt DATETIME,
          UNIQUE(userId, lessonId)
        )
      `);

      // Study Groups table
      db.run(`
        CREATE TABLE IF NOT EXISTS study_groups (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT,
          description TEXT,
          courseId INTEGER,
          createdBy INTEGER,
          maxMembers INTEGER DEFAULT 20,
          isActive BOOLEAN DEFAULT 1,
          meetingSchedule TEXT,
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Study Group Members
      db.run(`
        CREATE TABLE IF NOT EXISTS study_group_members (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          studyGroupId INTEGER,
          userId INTEGER,
          isAdmin BOOLEAN DEFAULT 0,
          joinedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(studyGroupId, userId)
        )
      `);

      // Study Group Messages
      db.run(`
        CREATE TABLE IF NOT EXISTS study_group_messages (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          studyGroupId INTEGER,
          userId INTEGER,
          message TEXT,
          sentAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY(studyGroupId) REFERENCES study_groups(id),
          FOREIGN KEY(userId) REFERENCES users(id)
        )
      `);

      // Quizzes table
      db.run(`
        CREATE TABLE IF NOT EXISTS quizzes (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          courseId INTEGER,
          title TEXT,
          description TEXT,
          passingScore INTEGER DEFAULT 70,
          timeLimitMinutes INTEGER DEFAULT 10,
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY(courseId) REFERENCES courses(id)
        )
      `);

      // Quiz Questions
      db.run(`
        CREATE TABLE IF NOT EXISTS quiz_questions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          quizId INTEGER,
          question TEXT,
          option1 TEXT,
          option2 TEXT,
          option3 TEXT,
          option4 TEXT,
          correctOption INTEGER,
          explanation TEXT,
          FOREIGN KEY(quizId) REFERENCES quizzes(id)
        )
      `);

      // Quiz Attempts
      db.run(`
        CREATE TABLE IF NOT EXISTS quiz_attempts (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          userId INTEGER,
          quizId INTEGER,
          score INTEGER,
          isPassed BOOLEAN DEFAULT 0,
          correctAnswers INTEGER DEFAULT 0,
          totalQuestions INTEGER DEFAULT 0,
          startedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          completedAt DATETIME,
          FOREIGN KEY(userId) REFERENCES users(id),
          FOREIGN KEY(quizId) REFERENCES quizzes(id)
        )
      `);

      console.log('✅ Database tables created successfully');
      resolve();
    });
  });
};

// Initialize database on first load
initializeDatabase().catch(err => {
  console.error('❌ Database initialization failed:', err);
});

module.exports = db;