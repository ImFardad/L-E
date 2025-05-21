// server.js
require('dotenv').config();
const path    = require('path');
const express = require('express');
const session = require('express-session');
const http    = require('http');
const { Server } = require('socket.io');
const authRoutes = require('./routes/auth.routes');
const db      = require('./config/db');

const app    = express();
const server = http.createServer(app);
const io     = new Server(server);

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false
}));

// روت ریشه: اگر login دارد → داشبورد، وگرنه → login
app.get('/', (req, res) => {
  if (req.session.userId) {
    return res.sendFile(path.join(__dirname, 'public', 'index.html'));
  }
  return res.redirect('/login');
});

// صفحه لاگین
app.get('/login', (req, res) => {
  if (req.session.userId) return res.redirect('/');
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});
// صفحه ثبت‌نام
app.get('/signup', (req, res) => {
  if (req.session.userId) return res.redirect('/');
  res.sendFile(path.join(__dirname, 'public', 'signup.html'));
});

// API احراز هویت
app.use('/api', authRoutes);

// فایل‌های استاتیک (css, js, assets)
app.use(express.static(path.join(__dirname, 'public')));

// Socket.IO (بعداً کاملش می‌کنیم)
io.on('connection', socket => {
  socket.on('join-dashboard', ({ userId }) => {
    socket.join(`user:${userId}`);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 L‑E Study running at http://localhost:${PORT}`);
});
