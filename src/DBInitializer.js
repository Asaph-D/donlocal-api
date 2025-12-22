// src/DBInitializer.js
require('dotenv').config();
const { sequelize } = require('./config/database');
const User = require('./models/User');
const Resource = require('./models/Resource');
const Category = require('./models/Category');
const Message = require('./models/Message');
const bcrypt = require('bcryptjs');

/**
 * Initialise la base de données avec des données par défaut
 */
async function initializeDatabase() {
  try {
    console.log('🔄 Début de l\'initialisation de la base de données...');

    // Définir les relations avant la synchronisation
    User.hasMany(Resource, { foreignKey: 'author', onDelete: 'CASCADE' });
    Resource.belongsTo(User, { foreignKey: 'author' });

    User.hasMany(Message, { foreignKey: 'sender', as: 'sentMessages' });
    User.hasMany(Message, { foreignKey: 'receiver', as: 'receivedMessages' });
    Message.belongsTo(User, { foreignKey: 'sender', as: 'senderInfo' });
    Message.belongsTo(User, { foreignKey: 'receiver', as: 'receiverInfo' });

    Resource.hasMany(Message, { foreignKey: 'resource', onDelete: 'CASCADE' });
    Message.belongsTo(Resource, { foreignKey: 'resource' });

    // Synchroniser les modèles
    await sequelize.sync({ alter: true });
    console.log('✅ Modèles synchronisés');

    // Initialiser les données
    await createDefaultCategories();
    await createDefaultUsers();
    await createDefaultResources();
    await createDefaultMessages();

    console.log('✅ Base de données initialisée avec succès!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur lors de l\'initialisation:', error.message);
    process.exit(1);
  }
}

/**
 * Crée les catégories par défaut
 */
async function createDefaultCategories() {
  try {
    const categoriesCount = await Category.count();
    
    if (categoriesCount > 0) {
      console.log('⏭️  Les catégories existent déjà');
      return;
    }

    const defaultCategories = [
      {
        id: 'CAT001',
        name: 'Dons',
        icon: '🎁',
        color: '#FF6B6B',
        description: 'Partager des objets dont vous n\'avez plus besoin'
      },
      {
        id: 'CAT002',
        name: 'Services',
        icon: '🔧',
        color: '#4ECDC4',
        description: 'Offrir ou chercher des services (réparation, nettoyage, etc.)'
      },
      {
        id: 'CAT003',
        name: 'Échanges',
        icon: '🔄',
        color: '#45B7D1',
        description: 'Échanger des biens ou services avec d\'autres'
      },
      {
        id: 'CAT004',
        name: 'Aide',
        icon: '🤝',
        color: '#96CEB4',
        description: 'Demander ou offrir de l\'aide (mouvements, conseils, etc.)'
      },
      {
        id: 'CAT005',
        name: 'Vêtements',
        icon: '👕',
        color: '#FFEAA7',
        description: 'Partager des vêtements et accessoires'
      },
      {
        id: 'CAT006',
        name: 'Électronique',
        icon: '💻',
        color: '#DFE6E9',
        description: 'Dons et échanges d\'appareils électroniques'
      },
      {
        id: 'CAT007',
        name: 'Livres',
        icon: '📚',
        color: '#A29BFE',
        description: 'Partager des livres et ressources éducatives'
      },
      {
        id: 'CAT008',
        name: 'Mobilier',
        icon: '🛋️',
        color: '#FAB1A0',
        description: 'Dons et échanges de meubles'
      }
    ];

    await Category.bulkCreate(defaultCategories);
    console.log(`✅ ${defaultCategories.length} catégories créées`);
  } catch (error) {
    console.error('❌ Erreur lors de la création des catégories:', error.message);
  }
}

/**
 * Crée les utilisateurs par défaut
 */
async function createDefaultUsers() {
  try {
    const usersCount = await User.count();
    
    if (usersCount > 0) {
      console.log('⏭️  Les utilisateurs existent déjà');
      return;
    }

    const defaultUsers = [
      {
        name: 'Jean Dupont',
        email: 'jean.dupont@example.com',
        password: await bcrypt.hash('password123', 10),
        phone: '+237612345678',
        whatsapp: '+237612345678',
        location: 'Yaoundé',
        avatar: 'https://i.pravatar.cc/150?img=1',
        bio: 'Passionné par le partage et l\'entraide communautaire',
        emailVerified: true
      },
      {
        name: 'Marie Nguegoue',
        email: 'marie.nguegoue@example.com',
        password: await bcrypt.hash('password123', 10),
        phone: '+237698765432',
        whatsapp: '+237698765432',
        location: 'Douala',
        avatar: 'https://i.pravatar.cc/150?img=2',
        bio: 'J\'aime aider les gens de mon quartier',
        emailVerified: true
      },
      {
        name: 'Pierre Martin',
        email: 'pierre.martin@example.com',
        password: await bcrypt.hash('password123', 10),
        phone: '+237681234567',
        whatsapp: '+237681234567',
        location: 'Bamenda',
        avatar: 'https://i.pravatar.cc/150?img=3',
        bio: 'Artisan et passionné de bricolage',
        emailVerified: true
      },
      {
        name: 'Aminata Diallo',
        email: 'aminata.diallo@example.com',
        password: await bcrypt.hash('password123', 10),
        phone: '+237675432109',
        whatsapp: '+237675432109',
        location: 'Garoua',
        avatar: 'https://i.pravatar.cc/150?img=4',
        bio: 'Étudiante cherchant à créer une communauté d\'entraide',
        emailVerified: true
      },
      {
        name: 'Claude Feu',
        email: 'claude.feu@example.com',
        password: await bcrypt.hash('password123', 10),
        phone: '+237690123456',
        whatsapp: '+237690123456',
        location: 'Buea',
        avatar: 'https://i.pravatar.cc/150?img=5',
        bio: 'Entrepreneur social',
        emailVerified: true
      }
    ];

    const createdUsers = await User.bulkCreate(defaultUsers);
    console.log(`✅ ${createdUsers.length} utilisateurs créés`);
  } catch (error) {
    console.error('❌ Erreur lors de la création des utilisateurs:', error.message);
  }
}

/**
 * Crée les ressources par défaut
 */
async function createDefaultResources() {
  try {
    const resourcesCount = await Resource.count();
    
    if (resourcesCount > 0) {
      console.log('⏭️  Les ressources existent déjà');
      return;
    }

    const users = await User.findAll({ limit: 5 });
    
    if (users.length === 0) {
      console.log('⚠️  Aucun utilisateur trouvé. Créez d\'abord les utilisateurs.');
      return;
    }

    const defaultResources = [
      {
        title: 'Vélo enfant en bon état',
        description: 'Vélo de 24 pouces, parfait pour un enfant de 8-12 ans. Très peu utilisé, en excellent état. Couleur rouge vif avec casque inclus.',
        category: 'don',
        imageUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400',
        location: 'Yaoundé - Quartier Bastos',
        status: 'disponible',
        views: 0,
        author: users[0].id
      },
      {
        title: 'Service de réparation électrique',
        description: 'Je propose mes services pour tous les travaux électriques : installation, réparation, entretien. 15 ans d\'expérience. Devis gratuit.',
        category: 'service',
        imageUrl: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=400',
        location: 'Douala - Bonanjo',
        status: 'disponible',
        views: 0,
        author: users[2].id
      },
      {
        title: 'Échange : Table basse contre chaises',
        description: 'Je propose ma belle table basse en bois (bon état) en échange de 4 chaises confortables. Idéale pour une salle à manger.',
        category: 'echange',
        imageUrl: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400',
        location: 'Bamenda - Nkwen',
        status: 'disponible',
        views: 0,
        author: users[1].id
      },
      {
        title: 'Besoin d\'aide pour déménagement',
        description: 'Je cherche 2-3 personnes pour m\'aider à déménager le 25 décembre. Mon logement est au 3e étage. En échange, je fournirai à manger et à boire.',
        category: 'aide',
        imageUrl: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=400',
        location: 'Garoua - Centre-ville',
        status: 'disponible',
        views: 0,
        author: users[3].id
      },
      {
        title: 'Lots de vêtements de marque',
        description: 'Lot de vêtements de marque (T-shirts, chemises, pantalons) taille M et L. Vêtements peu portés, très bon état.',
        category: 'don',
        imageUrl: 'https://images.unsplash.com/photo-1489987046614-19164713d5a6?w=400',
        location: 'Buea - Down Beach',
        status: 'disponible',
        views: 0,
        author: users[4].id
      },
      {
        title: 'Ancien laptop donné',
        description: 'Laptop HP EliteBook, 8GB RAM, 256GB SSD. Complètement fonctionnel, parfait pour étudiant ou utilisation basique.',
        category: 'don',
        imageUrl: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=400',
        location: 'Yaoundé - Mvan',
        status: 'disponible',
        views: 0,
        author: users[0].id
      },
      {
        title: 'Livres de développement personnel',
        description: 'Collection de 10 livres sur le développement personnel et l\'entrepreneuriat. En français, en bon état.',
        category: 'don',
        imageUrl: 'https://images.unsplash.com/photo-1507842217343-583f20270319?w=400',
        location: 'Douala - Akwa',
        status: 'disponible',
        views: 0,
        author: users[1].id
      },
      {
        title: 'Canapé 3 places à récupérer',
        description: 'Magnifique canapé 3 places, gris clair, très confortable. À récupérer avant le 31 décembre. Localisation avec accès facile.',
        category: 'don',
        imageUrl: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400',
        location: 'Bamenda - Mile 2',
        status: 'disponible',
        views: 0,
        author: users[2].id
      }
    ];

    await Resource.bulkCreate(defaultResources);
    console.log(`✅ ${defaultResources.length} ressources créées`);
  } catch (error) {
    console.error('❌ Erreur lors de la création des ressources:', error.message);
  }
}

/**
 * Crée les messages par défaut
 */
async function createDefaultMessages() {
  try {
    const messagesCount = await Message.count();
    
    if (messagesCount > 0) {
      console.log('⏭️  Les messages existent déjà');
      return;
    }

    const users = await User.findAll({ limit: 5 });
    
    if (users.length < 2) {
      console.log('⚠️  Pas assez d\'utilisateurs pour créer des messages.');
      return;
    }

    const defaultMessages = [
      {
        sender: users[0].id,
        receiver: users[1].id,
        content: 'Bonjour, je suis intéressé par votre offre de service. Pouvez-vous me contacter?',
        read: false
      },
      {
        sender: users[1].id,
        receiver: users[0].id,
        content: 'Bien sûr ! Je peux passer demain après-midi. C\'est possible pour vous?',
        read: false
      },
      {
        sender: users[2].id,
        receiver: users[3].id,
        content: 'Bonsoir, je peux vous aider pour votre déménagement. Combien de temps cela prendra-t-il?',
        read: false
      },
      {
        sender: users[3].id,
        receiver: users[4].id,
        content: 'Merci pour votre générosité! Quand puis-je venir récupérer les vêtements?',
        read: false
      },
      {
        sender: users[4].id,
        receiver: users[0].id,
        content: 'J\'ai vu que vous aviez un laptop à donner. Je suis très intéressé.',
        read: false
      }
    ];

    await Message.bulkCreate(defaultMessages);
    console.log(`✅ ${defaultMessages.length} messages créés`);
  } catch (error) {
    console.error('❌ Erreur lors de la création des messages:', error.message);
  }
}

// Exécuter l'initialisation si le fichier est lancé directement
if (require.main === module) {
  initializeDatabase();
}

module.exports = { initializeDatabase };
