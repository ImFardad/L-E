// routes/auth.routes.js
const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/authController');

router.post('/signup', ctrl.signupStep1);
router.post('/verify', ctrl.signupStep2);
router.post('/login', ctrl.login);
router.get('/me', ctrl.me);

module.exports = router;
