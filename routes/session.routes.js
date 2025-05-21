// routes/session.routes.js
const router = require('express').Router();
const ctrl   = require('../controllers/sessionController');
const auth   = require('../middleware/auth.middleware');  // ← اینجا مسیر رو اصلاح کردیم

router.use(auth);

router.post('/',                     ctrl.startSession);
router.patch('/:sessionId/stop',     ctrl.stopSession);
router.post('/manual',               ctrl.manualSession);
router.get('/stats/today',           ctrl.getStatsToday);
router.get('/stats/week',            ctrl.getStatsWeek);
router.get('/stats/weekly-chart',    ctrl.getWeeklyChart);

module.exports = router;
