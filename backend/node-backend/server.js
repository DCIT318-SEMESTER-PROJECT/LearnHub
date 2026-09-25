require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');

// Import routes
const authRoutes = require('./src/routes/authRoutes');
const courseRoutes = require('./src/routes/courseRoutes');
const enrollmentRoutes = require('./src/routes/enrollmentRoutes');
const studyGroupRoutes = require('./src/routes/studyGroupRoutes');
const quizRoutes = require('./src/routes/quizRoutes');
const ratingRoutes = require('./src/routes/ratingRoutes');
const aiRoutes = require('./src/routes/aiRoutes'); // ✅ ADDED

// Import models
const StudyGroup = require('./src/models/StudyGroup');
const User = require('./src/models/User');

const app = express();
const server = http.createServer(app);

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175'
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1 || origin.startsWith('http://localhost')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.options('*', cors());

const io = new Server(server, {
  cors: {
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) !== -1 || origin.startsWith('http://localhost')) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ["GET", "POST"],
    credentials: true
  }
});

app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ limit: '5mb', extended: true }));

app.use('/api/auth', authRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/enrollments', enrollmentRoutes);
app.use('/api/study-groups', studyGroupRoutes);
app.use('/api/quizzes', quizRoutes);
app.use('/api/ratings', ratingRoutes);
app.use('/api/ai', aiRoutes); // ✅ ADDED

app.get('/api/test', (req, res) => {
  res.json({ message: 'LearnHub API is running! 🚀' });
});

io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error('Authentication required'));
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    socket.userId = decoded.id;
    next();
  } catch (error) {
    next(new Error('Invalid token'));
  }
});

io.on('connection', (socket) => {
  console.log('🟢 User connected:', socket.userId);

  socket.on('join-group', (groupId) => socket.join(`group-${groupId}`));
  socket.on('leave-group', (groupId) => socket.leave(`group-${groupId}`));

  socket.on('send-message', async (data) => {
    try {
      const { groupId, message } = data;
      const userId = socket.userId;
      const newMessage = await StudyGroup.addMessage(groupId, userId, message);
      const user = await User.findById(userId);
      io.to(`group-${groupId}`).emit('new-message', {
        ...newMessage,
        firstName: user ? user.firstName : 'Unknown',
        lastName: user ? user.lastName : ''
      });
    } catch (error) {
      console.error('Error sending message:', error);
    }
  });

  socket.on('disconnect', () => console.log('🔴 User disconnected:', socket.userId));
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 LearnHub API running on http://localhost:${PORT}`);
  console.log(`📡 WebSocket server running on ws://localhost:${PORT}`);
});

process.on('uncaughtException', (error) => console.error('Uncaught Exception:', error));
process.on('unhandledRejection', (reason) => console.error('Unhandled Rejection:', reason));