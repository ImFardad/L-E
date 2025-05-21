// models/session.js
const { DataTypes } = require('sequelize');
const db = require('../config/db');

const Session = db.define('Session', {
  id: {
    type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER, allowNull: false
  },
  subject: {
    type: DataTypes.STRING, allowNull: false
  },
  startTime: {
    type: DataTypes.DATE, allowNull: false
  },
  endTime: {
    type: DataTypes.DATE, allowNull: true
  },
  timeGoal: {
    type: DataTypes.INTEGER, // goal in minutes
    defaultValue: 0
  },
  goalReached: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  status: {
    type: DataTypes.ENUM('open','closed'),
    defaultValue: 'open'
  }
}, {
  tableName: 'sessions',
  timestamps: false
});

module.exports = Session;
