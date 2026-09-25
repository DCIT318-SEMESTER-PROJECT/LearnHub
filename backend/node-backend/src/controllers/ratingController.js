const db = require('../config/database');

// Recalculate average rating + review count for a course, then persist
async function recalcCourseRating(courseId) {
  const result = await db.getAsync(
    `SELECT COUNT(*) as count, COALESCE(AVG(rating), 0) as avg
     FROM course_ratings WHERE courseId = ?`,
    [courseId]
  );

  const totalReviews = result?.count || 0;
  const averageRating = result?.avg ? parseFloat(result.avg.toFixed(1)) : 0;

  await db.runAsync(
    'UPDATE courses SET rating = ?, totalReviews = ? WHERE id = ?',
    [averageRating, totalReviews, courseId]
  );

  return { averageRating, totalReviews };
}

// POST /api/ratings/:courseId   body: { rating: 1-5, review?: '' }
exports.submitRating = async (req, res) => {
  try {
    const userId = req.userId;
    const courseId = Number(req.params.courseId);
    const rating = Number(req.body.rating);
    const review = req.body.review || '';

    console.log('⭐ submitRating hit:', { userId, courseId, rating, review });

    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      console.log('❌ rating not integer 1-5:', rating, typeof rating);
      return res.status(400).json({ error: 'Rating must be an integer 1–5' });
    }

    const course = await db.getAsync(
      'SELECT id, instructorId FROM courses WHERE id = ?',
      [courseId]
    );
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    if (course.instructorId === userId) {
      console.log('❌ user tried to rate own course:', userId, courseId);
      return res.status(400).json({ error: 'You cannot rate your own course' });
    }

    const existing = await db.getAsync(
      'SELECT id FROM course_ratings WHERE userId = ? AND courseId = ?',
      [userId, courseId]
    );

    if (existing) {
      await db.runAsync(
        `UPDATE course_ratings
         SET rating = ?, review = ?, updatedAt = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [rating, review, existing.id]
      );
    } else {
      await db.runAsync(
        `INSERT INTO course_ratings (userId, courseId, rating, review)
         VALUES (?, ?, ?, ?)`,
        [userId, courseId, rating, review]
      );
    }

    const stats = await recalcCourseRating(courseId);

    const myRating = await db.getAsync(
      `SELECT rating, review, createdAt, updatedAt
       FROM course_ratings WHERE userId = ? AND courseId = ?`,
      [userId, courseId]
    );

    res.json({
      message: existing ? 'Rating updated' : 'Rating submitted',
      myRating,
      courseStats: stats
    });
  } catch (error) {
    console.error('❌ submitRating error:', error);
    res.status(500).json({ error: 'Failed to submit rating' });
  }
};

// GET /api/ratings/:courseId/mine
exports.getMyRating = async (req, res) => {
  try {
    const userId = req.userId;
    const courseId = Number(req.params.courseId);

    const myRating = await db.getAsync(
      `SELECT rating, review, createdAt, updatedAt
       FROM course_ratings WHERE userId = ? AND courseId = ?`,
      [userId, courseId]
    );

    res.json(myRating || null);
  } catch (error) {
    console.error('❌ getMyRating error:', error);
    res.status(500).json({ error: 'Failed to fetch your rating' });
  }
};

// GET /api/ratings/:courseId   (public)
exports.getCourseRatings = async (req, res) => {
  try {
    const courseId = Number(req.params.courseId);

    const ratings = await db.allAsync(
      `SELECT r.id, r.rating, r.review, r.createdAt, r.updatedAt,
              u.id as userId, u.firstName, u.lastName, u.avatarUrl
       FROM course_ratings r
       JOIN users u ON r.userId = u.id
       WHERE r.courseId = ?
       ORDER BY r.updatedAt DESC`,
      [courseId]
    );

    const stats = await db.getAsync(
      `SELECT COUNT(*) as totalReviews,
              COALESCE(AVG(rating), 0) as averageRating
       FROM course_ratings WHERE courseId = ?`,
      [courseId]
    );

    res.json({
      ratings,
      stats: {
        totalReviews: stats?.totalReviews || 0,
        averageRating: stats?.averageRating
          ? parseFloat(stats.averageRating.toFixed(1))
          : 0
      }
    });
  } catch (error) {
    console.error('❌ getCourseRatings error:', error);
    res.status(500).json({ error: 'Failed to fetch ratings' });
  }
};