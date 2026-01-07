// src/server.js
// Charger les variables d'environnement en premier
const path = require('path');
const fs = require('fs');

// Ne charger .env QUE si on n'est pas dans Kubernetes
// Dans Kubernetes, les variables sont injectées directement
const isKubernetes = process.env.KUBERNETES_SERVICE_HOST || process.env.KUBERNETES_PORT;

// Chemin vers le fichier .env
const envPath = path.join(__dirname, '..', '.env');

// Vérifier si le fichier .env existe et si on n'est pas dans Kubernetes
if (!isKubernetes && fs.existsSync(envPath)) {
  console.log(`✅ Fichier .env trouvé: ${envPath}`);

  // Lire le contenu du fichier pour debug (en développement seulement)
  if (process.env.NODE_ENV !== 'production') {
    try {
      const envContent = fs.readFileSync(envPath, 'utf8');
      const lines = envContent.split('\n').filter(line => line.trim() && !line.trim().startsWith('#'));
      console.log(`📄 Fichier .env contient ${lines.length} lignes (hors commentaires)`);

      // Vérifier si DB_PASSWORD est présent
      const hasDbPassword = lines.some(line => line.startsWith('DB_PASSWORD'));
      if (hasDbPassword) {
        const passwordLine = lines.find(line => line.startsWith('DB_PASSWORD'));
        console.log(`   DB_PASSWORD trouvé: ${passwordLine ? passwordLine.split('=')[0] + '=***' : 'non'}`);
      } else {
        console.warn('   ⚠️  DB_PASSWORD non trouvé dans le fichier .env');
      }
    } catch (err) {
      console.warn(`   ⚠️  Impossible de lire le fichier .env: ${err.message}`);
    }
  }

  const result = require('dotenv').config({ path: envPath });

  // Vérifier si dotenv a chargé des variables
  if (result.error) {
    console.error(`❌ Erreur lors du chargement de .env: ${result.error.message}`);
  } else if (result.parsed) {
    const loadedVars = Object.keys(result.parsed);
    console.log(`📦 ${loadedVars.length} variables chargées depuis .env`);
  } else {
    console.warn('⚠️  Aucune variable chargée depuis .env (fichier vide ou mal formaté?)');
  }
} else if (!isKubernetes) {
  // En Kubernetes, on n'a pas besoin de .env
  console.warn(`⚠️  Fichier .env non trouvé: ${envPath}`);
  console.warn('   Tentative de chargement depuis le répertoire courant...');
  require('dotenv').config(); // Essayer sans chemin spécifique
} else {
  console.log('☸️  Mode Kubernetes détecté - variables d\'environnement injectées par K8s');
}

// Debug : Afficher les variables DB chargées (en développement ou Kubernetes)
const isK8s = process.env.KUBERNETES_SERVICE_HOST || process.env.KUBERNETES_PORT;
if (process.env.NODE_ENV !== 'production' || isK8s) {
  console.log('🔍 Variables d\'environnement chargées:');
  console.log(`   DB_HOST: ${process.env.DB_HOST || '(non défini)'}`);
  console.log(`   POSTGRES_HOST: ${process.env.POSTGRES_HOST || '(non défini)'}`);
  console.log(`   DB_PORT: ${process.env.DB_PORT || '(non défini)'}`);
  console.log(`   POSTGRES_PORT: ${process.env.POSTGRES_PORT || '(non défini)'}`);
  console.log(`   DB_NAME: ${process.env.DB_NAME || '(non défini)'}`);
  console.log(`   POSTGRES_DB: ${process.env.POSTGRES_DB || '(non défini)'}`);
  console.log(`   DB_USER: ${process.env.DB_USER || '(non défini)'}`);
  console.log(`   POSTGRES_USER: ${process.env.POSTGRES_USER || '(non défini)'}`);
  console.log(`   DB_PASSWORD: ${process.env.DB_PASSWORD ? '***' : '(non défini ou vide)'}`);
  console.log(`   POSTGRES_PASSWORD: ${process.env.POSTGRES_PASSWORD ? '***' : '(non défini ou vide)'}`);
}

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
// path est déjà déclaré en haut du fichier
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
let server = app.listen(PORT, () => {
  console.log(`🚀 Serveur démarré sur le port ${PORT}`);
});

// Gérer les signaux de fermeture proprement
process.on('SIGTERM', () => {
  console.log('📛 SIGTERM reçu, fermeture gracieuse du serveur...');
  server.close(() => {
    console.log('✋ Serveur arrêté');
    process.exit(0);
  });
  // Si après 30s le serveur n'est pas fermé, force l'arrêt
  setTimeout(() => {
    console.error('⚠️ Force shutdown après timeout');
    process.exit(1);
  }, 30000);
});

process.on('SIGINT', () => {
  console.log('📛 SIGINT reçu, fermeture gracieuse...');
  server.close(() => {
    console.log('✋ Serveur arrêté');
    process.exit(0);
  });
});
