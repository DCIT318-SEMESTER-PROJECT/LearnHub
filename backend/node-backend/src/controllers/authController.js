const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

exports.register = async (req, res) => {
  try {
    const { firstName, lastName, email, password } = req.body;
    
    console.log('📝 Registration attempt:', { firstName, lastName, email });

    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Check if user exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    const userId = await User.create({ firstName, lastName, email, password });
    const user = await User.findById(userId);
    
    const token = jwt.sign({ id: userId, email }, JWT_SECRET, { expiresIn: '7d' });
    
    console.log('✅ User registered successfully:', email);
    
    res.status(201).json({
      message: 'User created successfully',
      token,
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        streakDays: user.streakDays || 0
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
      console.log('❌ User not found:', email);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      console.log('❌ Invalid password for:', email);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Update streak
    try {
      await User.updateStreak(user.id);
    } catch (streakError) {
      console.log('⚠️ Streak update warning:', streakError.message);
    }
    
    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
    
    console.log('✅ Login successful:', email);
    
    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        streakDays: user.streakDays || 0,
        avatarUrl: user.avatarUrl || null
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

    await User.updateProfile(userId, { firstName, lastName, bio, avatarUrl });
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