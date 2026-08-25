const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');

exports.enroll = async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.userId;

    const result = await Course.enrollUser(userId, courseId);
    if (!result) {
      return res.status(400).json({ error: 'Already enrolled' });
    }

    res.json({ success: true, message: 'Enrolled successfully' });
  } catch (error) {
    console.error('Error enrolling:', error);
    res.status(500).json({ error: 'Failed to enroll' });
  }
};

exports.unenroll = async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.userId;

    await Course.unenrollUser(userId, courseId);
    res.json({ success: true, message: 'Unenrolled successfully' });
  } catch (error) {
    console.error('Error unenrolling:', error);
    res.status(500).json({ error: 'Failed to unenroll' });
  }
};

exports.getUserEnrollments = async (req, res) => {
  try {
    const { userId } = req.params;
    const enrollments = await Enrollment.findByUser(userId);
    res.json(enrollments);
  } catch (error) {
    console.error('Error fetching enrollments:', error);
    res.status(500).json({ error: 'Failed to fetch enrollments' });
  }
};

exports.getEnrollmentStats = async (req, res) => {
  try {
    const { userId } = req.params;
    const stats = await Enrollment.getStats(userId);
    res.json(stats);
  } catch (error) {
    console.error('Error fetching enrollment stats:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
};