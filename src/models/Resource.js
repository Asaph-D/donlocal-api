// src/models/Resource.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Resource = sequelize.define('Resource', {
  title: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Le titre est requis' },
      len: [5, 200],
    },
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      notEmpty: { msg: 'La description est requise' },
      len: [20, 2000],
    },
  },
  category: {
    type: DataTypes.ENUM('don', 'service', 'echange', 'aide'),
    allowNull: false,
    validate: {
      notEmpty: { msg: 'La catégorie est requise' },
    },
  },
  imageUrl: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  imagePublicId: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  location: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: { msg: 'La localisation est requise' },
    },
  },
  status: {
    type: DataTypes.ENUM('disponible', 'reserve', 'termine'),
    defaultValue: 'disponible',
  },
  views: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  expiresAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
}, {
  indexes: [
    {
      fields: ['title', 'description', 'location'],
    },
    {
      fields: ['category', 'status'],
    },
    {
      fields: ['author'],
    },
  ],
});

module.exports = Resource;
