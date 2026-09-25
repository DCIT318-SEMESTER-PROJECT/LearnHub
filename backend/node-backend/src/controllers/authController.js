const User = require('../models/User');
const Achievement = require('../models/Achievement');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/database');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

const capitalize = (str) => {
  if (!str) return '';
  return str
    .trim()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

exports.register = async (req, res) => {
  try {
    const {
      firstName, lastName, email, password, role,
      headline, teachingCategory, yearsExperience,
      expertise, instructorBio, credentials, website, linkedin
    } = req.body;

    console.log('📝 Registration attempt:', { firstName, lastName, email, role });

    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const userRole = (role === 'Instructor') ? 'Instructor' : 'Student';
    const isInstructor = userRole === 'Instructor' ? 1 : 0;

    if (userRole === 'Instructor') {
      if (!headline || !teachingCategory || !expertise || !instructorBio) {
        return res.status(400).json({
          error: 'Please fill in all required instructor fields'
        });
      }
    }

    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    const cleanFirstName = capitalize(firstName);
    const cleanLastName = capitalize(lastName);

    const userId = await User.create({
      firstName: cleanFirstName,
      lastName: cleanLastName,
      email,
      password,
      role: userRole,
      isInstructor,
      headline: headline || '',
      teachingCategory: teachingCategory || '',
      yearsExperience: parseInt(yearsExperience) || 0,
      expertise: expertise || '',
      instructorBio: instructorBio || '',
      credentials: credentials || '',
      website: website || '',
      linkedin: linkedin || ''
    });
    const user = await User.findById(userId);

    await Achievement.awardWelcomeAchievement(userId);
    const achievements = await Achievement.getUserBadges(userId);

    const token = jwt.sign({ id: userId, email }, JWT_SECRET, { expiresIn: '7d' });

    console.log('✅ User registered successfully:', email, 'as', userRole);

    res.status(201).json({
      message: 'User created successfully',
      token,
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        isInstructor: !!user.isInstructor,
        expertise: user.expertise || '',
        headline: user.headline || '',
        streakDays: user.streakDays || 0,
        achievements: achievements
      }
    });
  } catch (error) {
    console.error('❌ Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('🔑 Login attempt:', email);

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    await User.updateStreak(user.id);
    const updatedUser = await User.findById(user.id);
    const achievements = await Achievement.getUserBadges(user.id);

    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });

    console.log('✅ Login successful:', email, 'as', updatedUser.role);

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: updatedUser.id,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        email: updatedUser.email,
        streakDays: updatedUser.streakDays || 0,
        avatarUrl: updatedUser.avatarUrl || null,
        role: updatedUser.role || 'Student',
        isInstructor: !!updatedUser.isInstructor,
        expertise: updatedUser.expertise || '',
        headline: updatedUser.headline || '',
        achievements: achievements,
        totalLearningHours: updatedUser.totalLearningHours || 0
      }
    });
  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      streakDays: user.streakDays || 0,
      totalLearningHours: user.totalLearningHours || 0,
      role: user.role || 'Student',
      isInstructor: !!user.isInstructor,
      expertise: user.expertise || '',
      headline: user.headline || '',
      instructorBio: user.instructorBio || '',
      teachingCategory: user.teachingCategory || '',
      yearsExperience: user.yearsExperience || 0,
      credentials: user.credentials || '',
      website: user.website || '',
      linkedin: user.linkedin || '',
      createdAt: user.createdAt,
      avatarUrl: user.avatarUrl || null,
      bio: user.bio || ''
    });
  } catch (error) {
    console.error('❌ Profile error:', error);
    res.status(500).json({ error: 'Failed to get profile' });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { firstName, lastName, bio, avatarUrl } = req.body;
    const userId = req.userId;

    const cleanFirstName = firstName ? capitalize(firstName) : undefined;
    const cleanLastName = lastName ? capitalize(lastName) : undefined;

    await User.updateProfile(userId, {
      firstName: cleanFirstName,
      lastName: cleanLastName,
      bio,
      avatarUrl
    });
    const user = await User.findById(userId);

    res.json({
      message: 'Profile updated successfully',
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        bio: user.bio,
        avatarUrl: user.avatarUrl,
        streakDays: user.streakDays
      }
    });
  } catch (error) {
    console.error('❌ Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
};

exports.uploadAvatar = async (req, res) => {
  try {
    const userId = req.userId;
    const { avatarData } = req.body;

    if (!avatarData) {
      return res.status(400).json({ error: 'No avatar data provided' });
    }

    if (!avatarData.startsWith('data:image/')) {
      return res.status(400).json({ error: 'Invalid image format' });
    }

    const sizeInBytes = Buffer.byteLength(avatarData, 'utf8');
    if (sizeInBytes > 2 * 1024 * 1024) {
      return res.status(400).json({ error: 'Image size must be less than 2MB' });
    }

    await User.updateAvatar(userId, avatarData);
    const user = await User.findById(userId);

    console.log('✅ Avatar updated for user:', userId);

    res.json({
      message: 'Avatar updated successfully',
      avatarUrl: user.avatarUrl
    });
  } catch (error) {
    console.error('❌ Error uploading avatar:', error);
    res.status(500).json({ error: 'Failed to upload avatar: ' + error.message });
  }
};

exports.removeAvatar = async (req, res) => {
  try {
    const userId = req.userId;
    await User.updateAvatar(userId, '');
    const user = await User.findById(userId);

    res.json({
      message: 'Avatar removed successfully',
      avatarUrl: user.avatarUrl
    });
  } catch (error) {
    console.error('❌ Error removing avatar:', error);
    res.status(500).json({ error: 'Failed to remove avatar' });
  }
};

exports.getAchievements = async (req, res) => {
  try {
    const userId = req.userId;
    const achievements = await Achievement.getUserBadges(userId);
    res.json(achievements);
  } catch (error) {
    console.error('Error fetching achievements:', error);
    res.status(500).json({ error: 'Failed to fetch achievements' });
  }
};

exports.getDashboardSummary = async (req, res) => {
  try {
    const userId = req.userId;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const activeCoursesResult = await db.getAsync(
      `SELECT COUNT(*) as count FROM enrollments
       WHERE userId = ? AND isCompleted = 0`,
      [userId]
    );
    const activeCoursesCount = activeCoursesResult ? activeCoursesResult.count : 0;

    const totalWatchTimeResult = await db.getAsync(
      `SELECT COALESCE(SUM(watchTimeSeconds), 0) as totalSeconds
       FROM lesson_progress WHERE userId = ?`,
      [userId]
    );
    const totalSeconds = totalWatchTimeResult ? totalWatchTimeResult.totalSeconds : 0;
    const totalLearningHours = Math.round((totalSeconds / 3600) * 10) / 10;

    const badgesResult = await db.getAsync(
      `SELECT COUNT(*) as count FROM user_achievements WHERE userId = ?`,
      [userId]
    );
    const badgesCount = badgesResult ? badgesResult.count : 0;

    const currentCourse = await db.getAsync(
      `SELECT e.*, c.title, c.imageUrl, c.duration, c.instructorName,
              (SELECT COUNT(*) FROM lessons WHERE courseId = c.id) as totalLessons
       FROM enrollments e
       JOIN courses c ON e.courseId = c.id
       WHERE e.userId = ? AND e.isCompleted = 0
       ORDER BY e.lastAccessedAt DESC
       LIMIT 1`,
      [userId]
    );

    let courseData = null;
    if (currentCourse) {
      courseData = {
        id: currentCourse.courseId,
        title: currentCourse.title,
        imageUrl: currentCourse.imageUrl,
        progress: currentCourse.progressPercentage || 0,
        completedLessons: currentCourse.completedLessons || 0,
        totalLessons: currentCourse.totalLessons || 0,
        duration: currentCourse.duration,
        instructorName: currentCourse.instructorName
      };
    }

    const recentAchievement = await db.getAsync(
      `SELECT a.name, a.icon, a.description, ua.earnedAt
       FROM user_achievements ua
       JOIN achievements a ON ua.achievementId = a.id
       WHERE ua.userId = ?
       ORDER BY ua.earnedAt DESC
       LIMIT 1`,
      [userId]
    );

    res.json({
      streakDays: user.streakDays || 0,
      activeCourses: activeCoursesCount,
      totalLearningHours: totalLearningHours,
      badgesCount: badgesCount,
      currentCourse: courseData,
      recentAchievement: recentAchievement ? {
        name: recentAchievement.name,
        icon: recentAchievement.icon,
        description: recentAchievement.description,
        earnedAt: recentAchievement.earnedAt
      } : null
    });
  } catch (error) {
    console.error('Error fetching dashboard summary:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard summary' });
  }
};

// ═══════════════════════════════════════════════════
// INSTRUCTOR PROFILE (with computed stats)
// ═══════════════════════════════════════════════════

exports.getInstructorProfile = async (req, res) => {
  try {
    // ✅ FIX: route is /instructor/:id, so param is req.params.id
    const instructorId = req.params.id;
    console.log('👨‍🏫 Getting instructor profile:', instructorId);

    // ✅ FIX: only select columns that exist in your `users` table
    const instructor = await db.getAsync(
      `SELECT id, firstName, lastName, avatarUrl, bio,
              instructorBio, expertise, yearsExperience, role, createdAt
       FROM users WHERE id = ? AND isInstructor = 1`,
      [instructorId]
    );

    if (!instructor) {
      return res.status(404).json({ error: 'Instructor not found' });
    }

    const courses = await db.allAsync(
      `SELECT c.id, c.title, c.description, c.imageUrl, c.difficultyLevel,
              c.duration, c.price, c.rating, c.totalLessons, c.isPublished, c.createdAt,
              (SELECT COUNT(*) FROM enrollments WHERE courseId = c.id) as students,
              (SELECT COUNT(*) FROM lessons WHERE courseId = c.id) as actualLessons
       FROM courses c
       WHERE c.instructorId = ?
       ORDER BY c.createdAt DESC`,
      [instructorId]
    );

    const totalCourses = courses.length;
    const publishedCourses = courses.filter(c => c.isPublished === 1).length;
    const totalLessons = courses.reduce((sum, c) => sum + (c.actualLessons || 0), 0);

    const studentsResult = await db.getAsync(
      `SELECT COUNT(DISTINCT e.userId) as count
       FROM enrollments e
       JOIN courses c ON e.courseId = c.id
       WHERE c.instructorId = ?`,
      [instructorId]
    );
    const totalStudents = studentsResult?.count || 0;

    const ratedCourses = courses.filter(c => c.rating && c.rating > 0);
    const averageRating = ratedCourses.length > 0
      ? parseFloat((ratedCourses.reduce((sum, c) => sum + c.rating, 0) / ratedCourses.length).toFixed(1))
      : 0;

    const initials = `${instructor.firstName?.[0] || ''}${instructor.lastName?.[0] || ''}`.toUpperCase();

    console.log(`📊 Instructor ${instructorId} stats: courses=${totalCourses}, lessons=${totalLessons}, students=${totalStudents}, rating=${averageRating}`);

    res.json({
      instructor: { ...instructor, initials },
      courses: courses.map(c => ({
        ...c,
        totalLessons: c.actualLessons || c.totalLessons || 0
      })),
      stats: {
        totalCourses,
        publishedCourses,
        totalStudents,
        totalLessons,
        averageRating
      }
    });
  } catch (error) {
    console.error('Error fetching instructor profile:', error);
    res.status(500).json({ error: 'Failed to fetch instructor profile' });
  }
};

exports.getAllInstructors = async (req, res) => {
  try {
    // ✅ FIX: only select columns that exist
    const instructors = await db.allAsync(
      `SELECT u.id, u.firstName, u.lastName, u.avatarUrl, u.expertise, u.yearsExperience,
              (SELECT COUNT(*) FROM courses WHERE instructorId = u.id AND isPublished = 1) as courseCount
       FROM users u
       WHERE u.isInstructor = 1
       ORDER BY u.firstName ASC`
    );

    res.json(instructors);
  } catch (error) {
    console.error('Error fetching instructors:', error);
    res.status(500).json({ error: 'Failed to fetch instructors' });
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.getAll();
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to get users' });
  }
};

exports.deleteAccount = async (req, res) => {
  try {
    const userId = req.userId;
    console.log(`🗑️ Deleting account for user ${userId}`);

    await db.runAsync('BEGIN TRANSACTION');
    await db.runAsync('DELETE FROM user_achievements WHERE userId = ?', [userId]);
    await db.runAsync('DELETE FROM study_group_members WHERE userId = ?', [userId]);
    await db.runAsync('DELETE FROM study_group_messages WHERE userId = ?', [userId]);
    await db.runAsync('DELETE FROM lesson_progress WHERE userId = ?', [userId]);
    await db.runAsync('DELETE FROM quiz_attempts WHERE userId = ?', [userId]);
    await db.runAsync('DELETE FROM enrollments WHERE userId = ?', [userId]);
    await db.runAsync('DELETE FROM users WHERE id = ?', [userId]);
    await db.runAsync('COMMIT');

    res.json({ success: true, message: 'Account deleted successfully' });
  } catch (error) {
    await db.runAsync('ROLLBACK');
    console.error('❌ Error deleting account:', error);
    res.status(500).json({ error: 'Failed to delete account: ' + error.message });
  }
};