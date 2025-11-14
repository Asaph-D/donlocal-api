// src/models/Message.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Message = sequelize.define('Message', {
  content: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Le contenu est requis' },
      len: [1, 1000],
    },
  },
  read: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
}, {
  indexes: [
    {
      fields: ['sender', 'receiver'],
    },
  ],
});

module.exports = Message;
