// controllers/authController.js
const bcrypt = require('bcrypt');
const db     = require('../config/db');
const { sendVerificationEmail } = require('../config/email');

// STEP 1: فقط بررسی یکتا بودن و ارسال کد
exports.signupStep1 = async (req, res) => {
  const { firstName, lastName, phone, email, password } = req.body;
  if (!firstName||!lastName||!phone||!email||!password) {
    return res.status(400).json({ error: 'All fields are required.' });
  }

  // چک تکراری بودن تلفن یا ایمیل
  db.get(`SELECT id FROM users WHERE phone = ? OR email = ?`, [phone,email], (err,row) => {
    if (err) return res.status(500).json({ error: 'DB error.' });
    if (row) {
      return res.status(400).json({ error: 'Phone or Email already in use.' });
    }
    // یکتاست → تولید کد و ذخیره در سشن
    const code = Math.floor(100000 + Math.random()*900000).toString();
    // هش پسورد
    bcrypt.hash(password,12).then(hash => {
      req.session.pendingSignup = {
        firstName, lastName, phone, email,
        passwordHash: hash,
        verificationCode: code,
        createdAt: Date.now()
      };
      // ایمیل ارسال کن
      sendVerificationEmail(email, code)
        .then(()=> res.json({ status: 'code-sent' }))
        .catch(()=> res.status(500).json({ error: 'Failed to send email.' }));
    });
  });
};

// STEP 2: ورود کد و تکمیل ثبت‌نام
exports.signupStep2 = (req, res) => {
  const { code } = req.body;
  const pending = req.session.pendingSignup;
  if (!pending) {
    return res.status(400).json({ error: 'No pending signup.' });
  }
  if (pending.verificationCode !== code) {
    return res.status(400).json({ error: 'Invalid code.' });
  }
  // درج کاربر در DB
  const sql = `INSERT INTO users
    (firstName,lastName,phone,email,passwordHash,friendCode,isVerified)
    VALUES (?, ?, ?, ?, ?, ?, 1)`;
  const friendCode = Math.random().toString(36).slice(2,10).toUpperCase();
  db.run(sql,
    [pending.firstName,pending.lastName,pending.phone,pending.email,pending.passwordHash,friendCode],
    function(err) {
      if (err) return res.status(500).json({ error: 'DB insert failed.' });
      // لاگین کن
      req.session.userId = this.lastID;
      delete req.session.pendingSignup;
      req.session.save();
      res.json({ status: 'verified' });
    }
  );
};

// LOGIN
exports.login = (req, res) => {
  const { phone, password } = req.body;
  if (!phone||!password) {
    return res.status(400).json({ error: 'All fields are required.' });
  }
  db.get(`SELECT * FROM users WHERE phone = ?`, [phone], async (err,user) => {
    if (err) return res.status(500).json({ error: 'DB error.' });
    if (!user || !user.isVerified) {
      return res.status(400).json({ error: 'Invalid credentials.' });
    }
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      return res.status(400).json({ error: 'Invalid credentials.' });
    }
    req.session.userId = user.id;
    req.session.save();
    res.json({ status: 'ok' });
  });
};

// GET /api/me
exports.me = (req, res) => {
  if (!req.session.userId) return res.status(401).json({ error: 'Not logged in.' });
  db.get(`SELECT id,firstName,lastName,phone,email,friendCode 
          FROM users WHERE id = ?`,
    [req.session.userId],
    (err,row) => {
      if (err||!row) return res.status(500).json({ error: 'DB error.' });
      res.json({ user: row });
    }
  );
};
