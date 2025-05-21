// models/User.js
const db = require('../config/db');

class User {
  static create({ firstName, lastName, phone, email, passwordHash, verificationCode }, cb) {
    const sql = `INSERT INTO users
      (firstName, lastName, phone, email, passwordHash, verificationCode)
      VALUES (?, ?, ?, ?, ?, ?)`;
    db.run(sql, [firstName, lastName, phone, email, passwordHash, verificationCode], function(err) {
      cb(err, this?.lastID);
    });
  }

  static findByPhone(phone, cb) {
    db.get(`SELECT * FROM users WHERE phone = ?`, [phone], cb);
  }

  static verify(phone, friendCode, cb) {
    db.run(`
      UPDATE users
      SET isVerified = 1, verificationCode = NULL, friendCode = ?
      WHERE phone = ?
    `, [friendCode, phone], cb);
  }

  // … بقیه متدهای لازم مثل findById یا updatePassword
}

module.exports = User;
