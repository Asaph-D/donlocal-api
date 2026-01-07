const { Sequelize } = require('sequelize');

// Configuration de la connexion PostgreSQL
// IMPORTANT: Le mot de passe doit être une chaîne, même si vide
// Support des deux formats de variables : DB_* (local) et POSTGRES_* (Kubernetes)
// Priorité : DB_* > POSTGRES_* > valeurs par défaut
let dbPassword = process.env.DB_PASSWORD || process.env.POSTGRES_PASSWORD;

// Gérer tous les cas : undefined, null, chaîne "undefined", chaîne vide
if (!dbPassword || dbPassword === 'undefined' || dbPassword === 'null') {
  dbPassword = '';
}

// S'assurer que c'est toujours une chaîne - FORCER explicitement
let dbPasswordString;
if (typeof dbPassword === 'string') {
  dbPasswordString = dbPassword;
} else if (dbPassword === null || dbPassword === undefined) {
  dbPasswordString = '';
} else {
  dbPasswordString = String(dbPassword);
}

// Vérification finale : doit être une chaîne
if (typeof dbPasswordString !== 'string') {
  console.warn('⚠️  WARNING: dbPasswordString n\'est pas une chaîne, forçage...');
  dbPasswordString = '';
}

// Debug en développement ou Kubernetes
const isKubernetes = process.env.KUBERNETES_SERVICE_HOST || process.env.KUBERNETES_PORT;
if (process.env.NODE_ENV !== 'production' || isKubernetes) {
  console.log('🔍 Configuration DB:');
  console.log(`   Host: ${process.env.DB_HOST || process.env.POSTGRES_HOST || 'localhost'}`);
  console.log(`   Port: ${process.env.DB_PORT || process.env.POSTGRES_PORT || 5432}`);
  console.log(`   Database: ${process.env.DB_NAME || process.env.POSTGRES_DB || 'donlocal'}`);
  console.log(`   User: ${process.env.DB_USER || process.env.POSTGRES_USER || 'postgres'}`);
  console.log(`   Password: ${dbPasswordString ? '***' : '(vide)'}`);
  console.log(`   Password type: ${typeof dbPasswordString}`);
  console.log(`   Source: ${process.env.DB_PASSWORD ? 'DB_PASSWORD' : process.env.POSTGRES_PASSWORD ? 'POSTGRES_PASSWORD' : 'default'}`);
}

// Créer la configuration avec validation explicite
// IMPORTANT: Ne pas omettre le password même s'il est vide - Sequelize le transforme en undefined
// Support des deux formats : DB_* (local) et POSTGRES_* (Kubernetes)
const dbConfig = {
  dialect: 'postgres',
  host: process.env.DB_HOST || process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || process.env.POSTGRES_PORT) || 5432,
  database: process.env.DB_NAME || process.env.POSTGRES_DB || 'donlocal',
  username: process.env.DB_USER || process.env.POSTGRES_USER || 'postgres',
  // FORCER le password à être une chaîne - ne jamais l'omettre
  password: dbPasswordString || '', // Toujours une chaîne, même vide
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  define: {
    timestamps: true,
    underscored: true,
  },
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  },
  // Options dialect pour forcer le password
  dialectOptions: {
    // S'assurer que le password est toujours passé au driver pg
  }
};

// Validation finale avant de créer Sequelize
if (typeof dbConfig.password !== 'string') {
  console.error('❌ ERREUR CRITIQUE: Le mot de passe n\'est pas une chaîne!');
  console.error(`   Type reçu: ${typeof dbConfig.password}`);
  console.error(`   Valeur: ${dbConfig.password}`);
  dbConfig.password = ''; // Forcer à chaîne vide
}

// Debug final avant création
if (process.env.NODE_ENV === 'development') {
  console.log('🔍 Configuration finale Sequelize:');
  console.log(`   password type: ${typeof dbConfig.password}`);
  console.log(`   password value: ${dbConfig.password === '' ? '(chaîne vide)' : '***'}`);
  console.log(`   password length: ${dbConfig.password.length}`);
}

// Créer Sequelize avec la configuration
const sequelize = new Sequelize(dbConfig);

// Vérifier la configuration après création (via getter interne)
if (process.env.NODE_ENV === 'development') {
  // Accéder à la config via l'instance pour vérifier
  const config = sequelize.config;
  console.log('🔍 Configuration Sequelize après création:');
  console.log(`   password type: ${typeof config.password}`);
  console.log(`   password value: ${config.password === '' ? '(chaîne vide)' : config.password ? '***' : 'undefined'}`);
}

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ PostgreSQL Connected successfully');
    const dbName = process.env.DB_NAME || process.env.POSTGRES_DB || 'donlocal';
    const dbHost = process.env.DB_HOST || process.env.POSTGRES_HOST || 'localhost';
    const dbPort = process.env.DB_PORT || process.env.POSTGRES_PORT || 5432;
    console.log(`📊 Database: ${dbName}`);
    console.log(`🏠 Host: ${dbHost}:${dbPort}`);
  } catch (error) {
    console.error('❌ PostgreSQL Connection Error:', error.message);
    console.error('💡 Vérifiez vos variables d\'environnement:');
    console.error('   Variables DB_* (local):');
    console.error('     - DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD');
    console.error('   Variables POSTGRES_* (Kubernetes):');
    console.error('     - POSTGRES_HOST, POSTGRES_PORT, POSTGRES_DB, POSTGRES_USER, POSTGRES_PASSWORD');
    console.error(`   Valeurs actuelles:`);
    console.error(`     - DB_HOST: ${process.env.DB_HOST || '(non défini)'}`);
    console.error(`     - POSTGRES_HOST: ${process.env.POSTGRES_HOST || '(non défini)'}`);
    console.error(`     - DB_PASSWORD: ${process.env.DB_PASSWORD ? '***' : '(non défini)'}`);
    console.error(`     - POSTGRES_PASSWORD: ${process.env.POSTGRES_PASSWORD ? '***' : '(non défini)'}`);
    // Ne pas quitter en développement pour permettre le debug
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
  }
};

module.exports = { sequelize, connectDB };
