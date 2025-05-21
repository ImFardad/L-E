// controllers/sessionController.js
const Session = require('../models/session');
const { Op } = require('sequelize');

// شروع سشن
exports.startSession = async (req, res) => {
  const userId = req.session.userId;
  const { subject, timeGoal } = req.body;
  // ببند سشن قبلی باز مانده (e.g. پس از ریست 24:00)
  await Session.update(
    { endTime: new Date(), status: 'closed' },
    { where: { userId, status: 'open' }}
  );
  const s = await Session.create({
    userId, subject, startTime: new Date(), timeGoal
  });
  res.json({ sessionId: s.id, startTime: s.startTime });
};

// توقف سشن
exports.stopSession = async (req, res) => {
  const userId = req.session.userId;
  const { sessionId } = req.params;
  const s = await Session.findOne({ where: { id: sessionId, userId } });
  if (!s || s.status === 'closed') return res.status(400).json({ error:'invalid' });
  s.endTime = new Date();
  s.status = 'closed';
  // چک گول
  if (s.timeGoal > 0) {
    const duration = (s.endTime - s.startTime)/60000;
    s.goalReached = duration >= s.timeGoal;
  }
  await s.save();
  res.json({ endTime: s.endTime, goalReached: s.goalReached });
};

// ورودی دستی
exports.manualSession = async (req, res) => {
  const userId = req.session.userId;
  let { subject, startTime, endTime, timeGoal } = req.body;
  startTime = new Date(startTime); endTime = new Date(endTime);
  const duration = (endTime - startTime)/60000;
  const goalReached = timeGoal>0 && duration>=timeGoal;
  const s = await Session.create({
    userId, subject, startTime, endTime, timeGoal, goalReached, status:'closed'
  });
  res.json(s);
};

// استات‌ها
exports.getStatsToday = async (req, res) => {
  const userId = req.session.userId;
  const start = new Date(); start.setHours(0,0,0,0);
  const sessions = await Session.findAll({
    where: { userId,
      startTime: { [Op.gte]: start },
      status: 'closed'
    }
  });
  const totalMin = sessions.reduce((sum,s)=>sum + (s.endTime-s.startTime)/60000,0);
  res.json({
    minutes: totalMin,
    sessions: sessions.length
  });
};

exports.getStatsWeek = async (req,res) => {
  const userId = req.session.userId;
  const start = new Date(); start.setHours(0,0,0,0);
  start.setDate(start.getDate()-6);
  const sessions = await Session.findAll({
    where: { userId,
      startTime: { [Op.gte]: start },
      status: 'closed'
    }
  });
  // جمع روزانه و حداکثر روز
  const byDay = {};
  sessions.forEach(s=>{
    const day = s.startTime.toISOString().slice(0,10);
    byDay[day] = (byDay[day]||0)+ (s.endTime-s.startTime)/60000;
  });
  const bestDay = Object.entries(byDay).reduce((a,b)=>b[1]>a[1]?b:a,[null,0])[0];
  res.json({
    totalMin: Object.values(byDay).reduce((a,b)=>a+b,0),
    bestDay,
    daily: byDay
  });
};

// چارت هفتگی
exports.getWeeklyChart = async (req,res) => {
  const userId = req.session.userId;
  const today = new Date(); today.setHours(0,0,0,0);
  const labels = [], data = [], colors = [];
  for (let i=6;i>=0;i--) {
    const day = new Date(today); day.setDate(day.getDate()-i);
    const dayKey = day.toISOString().slice(0,10);
    labels.push(dayKey.slice(5));
    const sessions = await Session.findAll({
      where: { userId,
        startTime: { [Op.between]: [day, new Date(day.getTime()+86400000)] },
        status: 'closed'
      }
    });
    // هر درس مجزا
    sessions.forEach(s=>{
      const dur = (s.endTime-s.startTime)/60000;
      data.push({ day: dayKey, subject: s.subject, minutes: dur });
    });
  }
  res.json({ data, labels });
};
