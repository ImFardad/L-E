// server.js
require('dotenv').config();
const path       = require('path');
const express    = require('express');
const session    = require('express-session');
const http       = require('http');
const { Server } = require('socket.io');
const cron       = require('node-cron');

const db              = require('./config/db');
const SessionModel    = require('./models/session');
const authRoutes      = require('./routes/auth.routes');
const sessionRoutes   = require('./routes/session.routes');
const { Op }          = require('sequelize');

const app    = express();
const server = http.createServer(app);
const io     = new Server(server);

// --- Middleware ---
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false
}));

// --- Static Files ---
app.use(express.static(path.join(__dirname, 'public')));

// --- Routes ---
// Authentication API
app.use('/api', authRoutes);
// Session & Stats API (protected by auth middleware inside)
app.use('/api/sessions', sessionRoutes);

// Root route → dashboard if logged in, else login page
app.get('/', (req, res) => {
  if (req.session.userId) {
    return res.sendFile(path.join(__dirname, 'public', 'index.html'));
  }
  return res.redirect('/login');
});
app.get('/login', (req, res) => {
  if (req.session.userId) return res.redirect('/');
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});
app.get('/signup', (req, res) => {
  if (req.session.userId) return res.redirect('/');
  res.sendFile(path.join(__dirname, 'public', 'signup.html'));
});

// --- Socket.IO Setup ---
io.on('connection', socket => {
  // Join personal room
  socket.on('join-dashboard', ({ userId }) => {
    socket.join(`user:${userId}`);
  });
});

// Helper to broadcast friend activity
async function broadcastActivity(userId, payload) {
  io.to(`user:${userId}`).emit('friendActivity', payload);
}

// Monkey-patch SessionModel.create & update to emit events
const originalCreate = SessionModel.create.bind(SessionModel);
SessionModel.create = async function(values, options) {
  const s = await originalCreate(values, options);
  // Notify friends (this is placeholder; implement friend lookup logic)
  // broadcastActivityToFriends(values.userId, { type:'start', ... });
  return s;
};

// --- Cron Jobs ---
// 1. Every minute: enforce 16h max & auto-stop at midnight
cron.schedule('*/1 * * * *', async () => {
  const now = new Date();

  // Auto-stop sessions >16h
  const cutoff16 = new Date(now.getTime() - 16 * 3600 * 1000);
  const longSessions = await SessionModel.findAll({
    where: {
      status: 'open',
      startTime: { [Op.lte]: cutoff16 }
    }
  });
  for (let s of longSessions) {
    s.endTime     = new Date(s.startTime.getTime() + 16 * 3600 * 1000);
    s.status      = 'closed';
    s.goalReached = s.timeGoal > 0 && (16 * 60) >= s.timeGoal;
    await s.save();
    // broadcastActivity(s.userId, { type:'stop', sessionId:s.id });
  }

  // Auto-stop at 23:59 for any open session crossing midnight
  if (now.getHours() === 0 && now.getMinutes() === 0) {
    const opens = await SessionModel.findAll({ where: { status: 'open' } });
    const yesterdayEnd = new Date(now.getTime() - 60000);
    for (let s of opens) {
      s.endTime = yesterdayEnd;
      s.status  = 'closed';
      await s.save();
      // broadcastActivity(s.userId, { type:'stop', sessionId:s.id });
    }
  }
});

// 2. Daily at 01:00am → cleanup sessions older than 7 days
cron.schedule('0 1 * * *', async () => {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 7);
  await SessionModel.destroy({
    where: { startTime: { [Op.lt]: cutoff } }
  });
});

// --- Database Sync & Server Start ---
(async () => {
  try {
    await db.authenticate();
    await db.sync(); 
    const PORT = process.env.PORT || 3000;
    server.listen(PORT, () => {
      console.log(`🚀 L-E Study running at http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
})();
