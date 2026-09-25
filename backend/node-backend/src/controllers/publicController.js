const db = require('../config/database');

// GET /api/public/recent-activity
// Returns a small list of recent events for the homepage ticker.
// No auth required — this is public marketing material.
exports.getRecentActivity = async (req, res) => {
  try {
    const events = [];

    // Recent enrollments
    const enrollments = await db.allAsync(
      `SELECT u.firstName, u.lastName, c.title, e.enrolledAt
       FROM enrollments e
       JOIN users u ON e.userId = u.id
       JOIN courses c ON e.courseId = c.id
       WHERE c.isPublished = 1
       ORDER BY e.enrolledAt DESC
       LIMIT 6`
    );

    for (const e of enrollments) {
      events.push({
        type: 'enroll',
        icon: '🎓',
        text: `${e.firstName || 'Someone'} enrolled in ${e.title}`,
        at: e.enrolledAt,
      });
    }

    // Recent published courses
    const courses = await db.allAsync(
      `SELECT title, createdAt, instructorName
       FROM courses
       WHERE isPublished = 1
       ORDER BY createdAt DESC
       LIMIT 4`
    );

    for (const c of courses) {
      events.push({
        type: 'publish',
        icon: '🚀',
        text: `${c.instructorName || 'An instructor'} published ${c.title}`,
        at: c.createdAt,
      });
    }

    // Recent ratings
    const ratings = await db.allAsync(
      `SELECT u.firstName, c.title, r.rating, r.createdAt
       FROM course_ratings r
       JOIN users u ON r.userId = u.id
       JOIN courses c ON r.courseId = c.id
       WHERE c.isPublished = 1 AND r.rating >= 4
       ORDER BY r.createdAt DESC
       LIMIT 4`
    );

    for (const r of ratings) {
      events.push({
        type: 'rating',
        icon: '⭐',
        text: `${r.firstName || 'Someone'} rated ${r.title} ${r.rating} stars`,
        at: r.createdAt,
      });
    }

    // New users
    const users = await db.allAsync(
      `SELECT firstName, lastName, createdAt
       FROM users
       WHERE isInstructor = 0
       ORDER BY createdAt DESC
       LIMIT 4`
    );

    for (const u of users) {
      events.push({
        type: 'join',
        icon: '👋',
        text: `${u.firstName || 'Someone'} joined LearnHub`,
        at: u.createdAt,
      });
    }

    // Sort by most recent, cap at 12
    events.sort((a, b) => new Date(b.at || 0) - new Date(a.at || 0));
    const trimmed = events.slice(0, 12);

    res.json({ events: trimmed });
  } catch (error) {
    console.error('Recent activity error:', error);
    res.status(500).json({ error: 'Failed to load activity' });
  }
};