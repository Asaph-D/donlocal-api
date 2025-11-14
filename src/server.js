// src/server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const { connectDB, sequelize } = require('./config/database');
const User = require('./models/User');
const Resource = require('./models/Resource');
const Category = require('./models/Category');
const Message = require('./models/Message');

// Initialiser l'application Express
const app = express();

// Middlewares de sécurité et performance
app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL }));
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(compression());

// Limiter les requêtes (100 requêtes par 15 minutes)
const limiter = rateLimit({
  windowMs: process.env.RATE_LIMIT_WINDOW_MS,
  max: process.env.RATE_LIMIT_MAX_REQUESTS,
});
app.use(limiter);

// Connexion à la base de données PostgreSQL
connectDB();

// Définir les relations entre modèles
User.hasMany(Resource, { foreignKey: 'author', onDelete: 'CASCADE' });
Resource.belongsTo(User, { foreignKey: 'author' });

User.hasMany(Message, { foreignKey: 'sender', as: 'sentMessages' });
User.hasMany(Message, { foreignKey: 'receiver', as: 'receivedMessages' });
Message.belongsTo(User, { foreignKey: 'sender', as: 'senderInfo' });
Message.belongsTo(User, { foreignKey: 'receiver', as: 'receiverInfo' });

Resource.hasMany(Message, { foreignKey: 'resource', onDelete: 'CASCADE' });
Message.belongsTo(Resource, { foreignKey: 'resource' });

// Synchroniser les modèles avec la base de données (optionnel, si tu n'utilises pas les migrations)
sequelize.sync({ alter: true })
  .then(() => console.log('✅ Modèles synchronisés avec la base de données'))
  .catch(err => console.error('❌ Erreur de synchronisation:', err));

// Importer les routes
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const resourceRoutes = require('./routes/resourceRoutes');
const uploadRoutes = require('./routes/uploadRoutes');

// Utiliser les routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/resources', resourceRoutes);
app.use('/api/upload', uploadRoutes);

// Middleware de gestion des erreurs
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Une erreur est survenue sur le serveur',
  });
});

// Démarrer le serveur
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Serveur démarré sur le port ${PORT}`);
});
