// config/db.js
const { Sequelize } = require('sequelize');
const path         = require('path');

// ساخت یک instance از Sequelize برای SQLite
const db = new Sequelize({
  dialect: 'sqlite',
  storage: path.resolve(__dirname, '../data.sqlite'),
  logging: false,         // برای غیرفعال کردن لاگ‌های SQL در کنسول
  define: {
    // اگر می‌خواهی فیلدهای createdAt/updatedAt را نداشته باشی
    timestamps: false
  }
});

// تابع کمکی برای اطمینان از اتصال
async function connectDB() {
  try {
    await db.authenticate();
    console.log('✅ Connected to SQLite via Sequelize');
  } catch (err) {
    console.error('❌ DB connection error:', err);
    process.exit(1);
  }
}

connectDB();

module.exports = db;
