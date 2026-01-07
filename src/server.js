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

// Configuration CORS complète pour gérer les requêtes OPTIONS (preflight)
// IMPORTANT: CORS doit être configuré AVANT Helmet pour éviter les conflits
const corsOptions = {
  origin: function (origin, callback) {
    // Autoriser les requêtes sans origin (Postman, curl, etc.)
    if (!origin) return callback(null, true);

    // Liste des origines autorisées
    const allowedOrigins = [
      process.env.CLIENT_URL,
      'http://localhost:4200',
      'http://localhost:3000',
      'http://192.168.142.61:4200',
      'http://192.168.142.61:3000',
      'http://192.168.142.61:30631' // API elle-même si nécessaire
    ].filter(Boolean); // Retirer les valeurs undefined

    if (allowedOrigins.includes(origin) || process.env.NODE_ENV === 'development') {
      callback(null, true);
    } else {
      // En développement, autoriser toutes les origines pour faciliter le debug
      if (process.env.NODE_ENV === 'development') {
        callback(null, true);
      } else {
        callback(new Error('Non autorisé par CORS'));
      }
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin',
    'Access-Control-Request-Method',
    'Access-Control-Request-Headers'
  ],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  maxAge: 86400, // Cache preflight pour 24 heures
  preflightContinue: false,
  optionsSuccessStatus: 204 // Répondre avec 204 No Content pour OPTIONS
};

// Appliquer CORS en PREMIER, avant tous les autres middlewares
app.use(cors(corsOptions));

// Gérer explicitement les requêtes OPTIONS (preflight) pour toutes les routes
app.options('*', cors(corsOptions));

// Middlewares de sécurité et performance
// Configurer Helmet pour ne pas bloquer CORS
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginEmbedderPolicy: false
}));

app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(compression());

// Limiter les requêtes (100 requêtes par 15 minutes)
// Exclure les requêtes OPTIONS du rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes par défaut
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // 100 requêtes par défaut
  skip: (req) => {
    // Ignorer les requêtes OPTIONS (preflight)
    return req.method === 'OPTIONS';
  },
  standardHeaders: true,
  legacyHeaders: false,
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
  console.error('Error:', err.message);
  console.error('Stack:', err.stack);

  // Gérer les erreurs CORS spécifiquement
  if (err.message === 'Non autorisé par CORS') {
    return res.status(403).json({
      success: false,
      message: 'Origine non autorisée par CORS',
      error: err.message
    });
  }

  // Erreur générique
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Une erreur est survenue sur le serveur',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Démarrer le serveur
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Serveur démarré sur le port ${PORT}`);
});
