// src/server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const path = require('path');
const { connectDB, sequelize } = require('./config/database');
const User = require('./models/User');
const Resource = require('./models/Resource');
const Category = require('./models/Category');
const Message = require('./models/Message');

// Initialiser l'application Express
const app = express();

// Middlewares de sécurité et performance
app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL || '*' }));
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(compression());

// Limiter les requêtes (désactivé en dev, actif en production)
if (process.env.NODE_ENV === 'production') {
  const limiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000,
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 1000,
    message: 'Trop de requêtes, veuillez réessayer plus tard',
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.use(limiter);
} else {
  console.log('⚠️  Rate limiter désactivé en mode développement');
}

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

// Route de santé pour les probes Kubernetes
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'API is healthy',
    timestamp: new Date().toISOString(),
  });
});

// Serve a simple landing page at `/` (returns index.html at project root if present)
app.use(express.static(path.join(__dirname, '..')));
app.get('/', (req, res) => {
  const indexPath = path.join(__dirname, '..', 'index.html');
  res.sendFile(indexPath, (err) => {
    if (err) {
      // fallback to health endpoint
      return res.redirect('/api/health');
    }
  });
});

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
