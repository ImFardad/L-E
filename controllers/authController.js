// controllers/authController.js
const bcrypt = require('bcrypt');
const { Op } = require('sequelize');
const User = require('../models/User');
const { sendVerificationEmail } = require('../config/email');

// STEP 1: فقط بررسی یکتا بودن و ارسال کد
exports.signupStep1 = async (req, res) => {
  try {
    const { firstName, lastName, phone, email, password } = req.body;
    if (!firstName || !lastName || !phone || !email || !password) {
      return res.status(400).json({ error: 'All fields are required.' });
    }

    // چک تکراری بودن تلفن یا ایمیل
    const existing = await User.findOne({
      where: {
        [Op.or]: [
          { phone },
          { email }
        ]
      }
    });
    if (existing) {
      return res.status(400).json({ error: 'Phone or Email already in use.' });
    }

    // یکتاست → تولید کد و ذخیره در سشن
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const passwordHash = await bcrypt.hash(password, 12);

    req.session.pendingSignup = {
      firstName,
      lastName,
      phone,
      email,
      passwordHash,
      verificationCode: code,
      createdAt: Date.now()
    };

    await sendVerificationEmail(email, code);
    return res.json({ status: 'code-sent' });

  } catch (err) {
    console.error('signupStep1 error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

// STEP 2: ورود کد و تکمیل ثبت‌نام
exports.signupStep2 = async (req, res) => {
  try {
    const { code } = req.body;
    const pending = req.session.pendingSignup;
    if (!pending) {
      return res.status(400).json({ error: 'No pending signup.' });
    }
    if (pending.verificationCode !== code) {
      return res.status(400).json({ error: 'Invalid code.' });
    }

    // ایجاد کاربر با Sequelize
    const friendCode = Math.random().toString(36).slice(2, 10).toUpperCase();
    const user = await User.create({
      firstName: pending.firstName,
      lastName: pending.lastName,
      phone: pending.phone,
      email: pending.email,
      passwordHash: pending.passwordHash,
      verificationCode: null,
      isVerified: true,
      friendCode
    });

    // لاگین خودکار
    req.session.userId = user.id;
    delete req.session.pendingSignup;
    req.session.save(err => {
      if (err) console.error('session save error:', err);
    });

    return res.json({ status: 'verified' });

  } catch (err) {
    console.error('signupStep2 error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

// LOGIN
exports.login = async (req, res) => {
  try {
    const { phone, password } = req.body;
    if (!phone || !password) {
      return res.status(400).json({ error: 'All fields are required.' });
    }

    const user = await User.findOne({ where: { phone } });
    if (!user || !user.isVerified) {
      return res.status(400).json({ error: 'Invalid credentials.' });
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      return res.status(400).json({ error: 'Invalid credentials.' });
    }

    req.session.userId = user.id;
    req.session.save(err => {
      if (err) console.error('session save error:', err);
    });

    return res.json({ status: 'ok' });

  } catch (err) {
    console.error('login error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

// GET /api/me
exports.me = async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({ error: 'Not logged in.' });
    }

    const user = await User.findByPk(req.session.userId, {
      attributes: ['id', 'firstName', 'lastName', 'phone', 'email', 'friendCode']
    });
    if (!user) {
      return res.status(500).json({ error: 'User not found.' });
    }

    return res.json({ user });

  } catch (err) {
    console.error('me error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};
