// ==========================================
// GUIDE COMPLET - API EXPRESS DONLOCAL.CM
// ==========================================

/*
STRUCTURE DU PROJET API:

donlocal-api/
├── src/
│   ├── config/
│   │   ├── database.js
│   │   ├── cloudinary.js
│   │   └── jwt.js
│   ├── models/
│   │   ├── User.js
│   │   ├── Resource.js
│   │   ├── Category.js
│   │   └── Message.js
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── resourceController.js
│   │   ├── userController.js
│   │   └── uploadController.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── resourceRoutes.js
│   │   ├── userRoutes.js
│   │   └── uploadRoutes.js
│   ├── middleware/
│   │   ├── authMiddleware.js
│   │   ├── errorHandler.js
│   │   ├── uploadMiddleware.js
│   │   └── validation.js
│   ├── utils/
│   │   ├── emailService.js
│   │   └── helpers.js
│   └── server.js
├── .env
├── .gitignore
├── package.json
└── README.md
*/

// ==========================================
// 1. INSTALLATION - package.json
// ==========================================

/*
{
  "name": "donlocal-api",
  "version": "1.0.0",
  "description": "API REST pour DonLocal.cm",
  "main": "src/server.js",
  "scripts": {
    "start": "node src/server.js",
    "dev": "nodemon src/server.js",
    "test": "jest"
  },
  "dependencies": {
    "express": "^4.18.2",
    "mongoose": "^8.0.0",
    "bcryptjs": "^2.4.3",
    "jsonwebtoken": "^9.0.2",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1",
    "multer": "^1.4.5-lts.1",
    "cloudinary": "^1.41.0",
    "express-validator": "^7.0.1",
    "nodemailer": "^6.9.7",
    "compression": "^1.7.4",
    "helmet": "^7.1.0",
    "express-rate-limit": "^7.1.5"
  },
  "devDependencies": {
    "nodemon": "^3.0.2",
    "jest": "^29.7.0"
  }
}
*/

// COMMANDES D'INSTALLATION:
/*
# Créer le projet
mkdir donlocal-api
cd donlocal-api
npm init -y

# Installer les dépendances
npm install express mongoose bcryptjs jsonwebtoken cors dotenv multer cloudinary express-validator nodemailer compression helmet express-rate-limit

# Installer les dev dependencies
npm install --save-dev nodemon jest

# Créer la structure
mkdir -p src/{config,models,controllers,routes,middleware,utils}
touch src/server.js .env .gitignore
*/

// ==========================================
// 2. CONFIGURATION - .env
// ==========================================

/*
# Server
NODE_ENV=development
PORT=5000
API_URL=http://localhost:5000

# Database
MONGODB_URI=mongodb://localhost:27017/donlocal
# OU pour MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/donlocal?retryWrites=true&w=majority

# JWT
JWT_SECRET=votre_secret_jwt_super_securise_ici_changez_moi
JWT_EXPIRE=7d

# Cloudinary (pour upload images)
CLOUDINARY_CLOUD_NAME=votre_cloud_name
CLOUDINARY_API_KEY=votre_api_key
CLOUDINARY_API_SECRET=votre_api_secret

# Email (Nodemailer)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=votre_email@gmail.com
EMAIL_PASSWORD=votre_app_password

# Frontend URL (CORS)
CLIENT_URL=http://localhost:4200

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
*/

// ==========================================
// 3. DATABASE CONFIG - src/config/database.js
// ==========================================

const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;

// ==========================================
// 4. CLOUDINARY CONFIG - src/config/cloudinary.js
// ==========================================

const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

module.exports = cloudinary;

// ==========================================
// 5. USER MODEL - src/models/User.js
// ==========================================

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Le nom est requis'],
    trim: true,
    minlength: 3,
    maxlength: 100
  },
  email: {
    type: String,
    required: [true, 'L\'email est requis'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Email invalide']
  },
  password: {
    type: String,
    required: [true, 'Le mot de passe est requis'],
    minlength: 6,
    select: false
  },
  phone: {
    type: String,
    trim: true
  },
  whatsapp: {
    type: String,
    trim: true
  },
  location: {
    type: String,
    required: [true, 'La localisation est requise']
  },
  avatar: {
    type: String,
    default: null
  },
  bio: {
    type: String,
    maxlength: 500
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  resourcesCount: {
    type: Number,
    default: 0
  },
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  }
}, {
  timestamps: true
});

// Hash password avant sauvegarde
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Méthode pour comparer les mots de passe
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);

// ==========================================
// 6. RESOURCE MODEL - src/models/Resource.js
// ==========================================

const mongoose = require('mongoose');

const resourceSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Le titre est requis'],
    trim: true,
    minlength: 5,
    maxlength: 200
  },
  description: {
    type: String,
    required: [true, 'La description est requise'],
    minlength: 20,
    maxlength: 2000
  },
  category: {
    type: String,
    required: [true, 'La catégorie est requise'],
    enum: ['don', 'service', 'echange', 'aide']
  },
  imageUrl: {
    type: String,
    default: null
  },
  imagePublicId: {
    type: String,
    default: null
  },
  location: {
    type: String,
    required: [true, 'La localisation est requise']
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['disponible', 'reserve', 'termine'],
    default: 'disponible'
  },
  views: {
    type: Number,
    default: 0
  },
  expiresAt: {
    type: Date,
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index pour recherche
resourceSchema.index({ title: 'text', description: 'text', location: 'text' });
resourceSchema.index({ category: 1, status: 1 });
resourceSchema.index({ author: 1 });

module.exports = mongoose.model('Resource', resourceSchema);

// ==========================================
// 7. CATEGORY MODEL - src/models/Category.js
// ==========================================

const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  icon: {
    type: String,
    required: true
  },
  color: {
    type: String,
    required: true
  },
  description: String,
  count: {
    type: Number,
    default: 0
  }
});

module.exports = mongoose.model('Category', categorySchema);

// ==========================================
// 8. MESSAGE MODEL - src/models/Message.js
// ==========================================

const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  receiver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  resource: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Resource'
  },
  content: {
    type: String,
    required: true,
    maxlength: 1000
  },
  read: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

messageSchema.index({ sender: 1, receiver: 1 });

module.exports = mongoose.model('Message', messageSchema);

// ==========================================
// 9. AUTH MIDDLEWARE - src/middleware/authMiddleware.js
// ==========================================

const jwt = require('jsonwebtoken');
const User = require('../models/User');

exports.protect = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Non autorisé - Token manquant'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select('-password');

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Utilisateur introuvable'
      });
    }

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Non autorisé - Token invalide'
    });
  }
};

exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Non autorisé pour cette action'
      });
    }
    next();
  };
};

// ==========================================
// 10. UPLOAD MIDDLEWARE - src/middleware/uploadMiddleware.js
// ==========================================

const multer = require('multer');
const path = require('path');

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb(new Error('Seuls les fichiers JPEG, PNG et WEBP sont autorisés'));
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 2 * 1024 * 1024 // 2MB
  },
  fileFilter: fileFilter
});

module.exports = upload;

// SUITE DANS LE PROCHAIN MESSAGE...

// ==========================================
// 11. AUTH CONTROLLER - src/controllers/authController.js
// ==========================================

const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Générer JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE
  });
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
  try {
    const { name, email, password, phone, whatsapp, location } = req.body;

    // Vérifier si l'utilisateur existe
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'Un compte existe déjà avec cet email'
      });
    }

    // Créer l'utilisateur
    const user = await User.create({
      name,
      email,
      password,
      phone,
      whatsapp,
      location
    });

    // Générer token
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: 'Compte créé avec succès',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          whatsapp: user.whatsapp,
          location: user.location,
          role: user.role
        },
        token
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création du compte',
      error: error.message
    });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email et mot de passe requis'
      });
    }

    // Vérifier l'utilisateur
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Identifiants invalides'
      });
    }

    // Vérifier le mot de passe
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Identifiants invalides'
      });
    }

    // Générer token
    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      message: 'Connexion réussie',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          whatsapp: user.whatsapp,
          location: user.location,
          role: user.role,
          avatar: user.avatar
        },
        token
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la connexion',
      error: error.message
    });
  }
};

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du profil',
      error: error.message
    });
  }
};

// ==========================================
// 12. RESOURCE CONTROLLER - src/controllers/resourceController.js
// ==========================================

const Resource = require('../models/Resource');
const User = require('../models/User');

// @desc    Get all resources
// @route   GET /api/resources
// @access  Public
exports.getResources = async (req, res) => {
  try {
    const { category, status, search, limit = 12, page = 1 } = req.query;

    // Build query
    let query = { isActive: true };

    if (category && category !== 'all') {
      query.category = category;
    }

    if (status) {
      query.status = status;
    }

    if (search) {
      query.$text = { $search: search };
    }

    // Pagination
    const skip = (page - 1) * limit;

    // Execute query
    const resources = await Resource.find(query)
      .populate('author', 'name email phone whatsapp location avatar')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip);

    const total = await Resource.countDocuments(query);

    res.status(200).json({
      success: true,
      count: resources.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      data: resources
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des ressources',
      error: error.message
    });
  }
};

// @desc    Get single resource
// @route   GET /api/resources/:id
// @access  Public
exports.getResource = async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id)
      .populate('author', 'name email phone whatsapp location avatar rating');

    if (!resource) {
      return res.status(404).json({
        success: false,
        message: 'Ressource introuvable'
      });
    }

    // Increment views
    resource.views += 1;
    await resource.save();

    res.status(200).json({
      success: true,
      data: resource
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de la ressource',
      error: error.message
    });
  }
};

// @desc    Create resource
// @route   POST /api/resources
// @access  Private
exports.createResource = async (req, res) => {
  try {
    const { title, description, category, location, imageUrl, expiresAt } = req.body;

    const resource = await Resource.create({
      title,
      description,
      category,
      location,
      imageUrl,
      expiresAt,
      author: req.user.id
    });

    // Incrémenter le compteur de ressources de l'utilisateur
    await User.findByIdAndUpdate(req.user.id, {
      $inc: { resourcesCount: 1 }
    });

    res.status(201).json({
      success: true,
      message: 'Ressource créée avec succès',
      data: resource
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création de la ressource',
      error: error.message
    });
  }
};

// @desc    Update resource
// @route   PUT /api/resources/:id
// @access  Private
exports.updateResource = async (req, res) => {
  try {
    let resource = await Resource.findById(req.params.id);

    if (!resource) {
      return res.status(404).json({
        success: false,
        message: 'Ressource introuvable'
      });
    }

    // Vérifier que l'utilisateur est le propriétaire
    if (resource.author.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Non autorisé à modifier cette ressource'
      });
    }

    resource = await Resource.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      message: 'Ressource mise à jour avec succès',
      data: resource
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour de la ressource',
      error: error.message
    });
  }
};

// @desc    Delete resource
// @route   DELETE /api/resources/:id
// @access  Private
exports.deleteResource = async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id);

    if (!resource) {
      return res.status(404).json({
        success: false,
        message: 'Ressource introuvable'
      });
    }

    // Vérifier que l'utilisateur est le propriétaire
    if (resource.author.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Non autorisé à supprimer cette ressource'
      });
    }

    await resource.deleteOne();

    // Décrémenter le compteur de ressources de l'utilisateur
    await User.findByIdAndUpdate(resource.author, {
      $inc: { resourcesCount: -1 }
    });

    res.status(200).json({
      success: true,
      message: 'Ressource supprimée avec succès'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression de la ressource',
      error: error.message
    });
  }
};

// @desc    Get user resources
// @route   GET /api/resources/user/:userId
// @access  Public
exports.getUserResources = async (req, res) => {
  try {
    const resources = await Resource.find({ 
      author: req.params.userId,
      isActive: true 
    }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: resources.length,
      data: resources
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des ressources',
      error: error.message
    });
  }
};

// ==========================================
// 13. UPLOAD CONTROLLER - src/controllers/uploadController.js
// ==========================================

const cloudinary = require('../config/cloudinary');
const streamifier = require('streamifier');

// @desc    Upload image
// @route   POST /api/upload
// @access  Private
exports.uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Aucun fichier fourni'
      });
    }

    // Upload to Cloudinary
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'donlocal',
        transformation: [
          { width: 1200, height: 800, crop: 'limit' },
          { quality: 'auto' }
        ]
      },
      (error, result) => {
        if (error) {
          return res.status(500).json({
            success: false,
            message: 'Erreur lors de l\'upload',
            error: error.message
          });
        }

        res.status(200).json({
          success: true,
          message: 'Image uploadée avec succès',
          data: {
            url: result.secure_url,
            publicId: result.public_id
          }
        });
      }
    );

    streamifier.createReadStream(req.file.buffer).pipe(uploadStream);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'upload',
      error: error.message
    });
  }
};

// @desc    Delete image
// @route   DELETE /api/upload/:publicId
// @access  Private
exports.deleteImage = async (req, res) => {
  try {
    const { publicId } = req.params;

    await cloudinary.uploader.destroy(publicId);

    res.status(200).json({
      success: true,
      message: 'Image supprimée avec succès'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression',
      error: error.message
    });
  }
};

// ==========================================
// 14. USER CONTROLLER - src/controllers/userController.js
// ==========================================

const User = require('../models/User');

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
exports.updateProfile = async (req, res) => {
  try {
    const { name, phone, whatsapp, location, bio } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { name, phone, whatsapp, location, bio },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: 'Profil mis à jour avec succès',
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour du profil',
      error: error.message
    });
  }
};

// @desc    Get user profile
// @route   GET /api/users/:id
// @access  Public
exports.getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur introuvable'
      });
    }

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du profil',
      error: error.message
    });
  }
};

// SUITE DANS LE PROCHAIN MESSAGE...

// ==========================================
// 15. AUTH ROUTES - src/routes/authRoutes.js
// ==========================================

const express = require('express');
const router = express.Router();
const { register, login, getMe } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);

module.exports = router;

// ==========================================
// 16. RESOURCE ROUTES - src/routes/resourceRoutes.js
// ==========================================

const express = require('express');
const router = express.Router();
const {
  getResources,
  getResource,
  createResource,
  updateResource,
  deleteResource,
  getUserResources
} = require('../controllers/resourceController');
const { protect } = require('../middleware/authMiddleware');

router.route('/')
  .get(getResources)
  .post(protect, createResource);

router.route('/:id')
  .get(getResource)
  .put(protect, updateResource)
  .delete(protect, deleteResource);

router.get('/user/:userId', getUserResources);

module.exports = router;

// ==========================================
// 17. UPLOAD ROUTES - src/routes/uploadRoutes.js
// ==========================================

const express = require('express');
const router = express.Router();
const { uploadImage, deleteImage } = require('../controllers/uploadController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.post('/', protect, upload.single('image'), uploadImage);
router.delete('/:publicId', protect, deleteImage);

module.exports = router;

// ==========================================
// 18. USER ROUTES - src/routes/userRoutes.js
// ==========================================

const express = require('express');
const router = express.Router();
const { updateProfile, getUserProfile } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

router.put('/profile', protect, updateProfile);
router.get('/:id', getUserProfile);

module.exports = router;

// ==========================================
// 19. ERROR HANDLER - src/middleware/errorHandler.js
// ==========================================

const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = 'Ressource introuvable';
    error = { message, statusCode: 404 };
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const message = 'Valeur en double détectée';
    error = { message, statusCode: 400 };
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message);
    error = { message, statusCode: 400 };
  }

  res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || 'Erreur serveur',
    error: process.env.NODE_ENV === 'development' ? err : {}
  });
};

module.exports = errorHandler;

// ==========================================
// 20. VALIDATION MIDDLEWARE - src/middleware/validation.js
// ==========================================

const { body, validationResult } = require('express-validator');

// Validation pour l'inscription
exports.validateRegister = [
  body('name')
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage('Le nom doit contenir entre 3 et 100 caractères'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Email invalide'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Le mot de passe doit contenir au moins 6 caractères'),
  body('location')
    .notEmpty()
    .withMessage('La localisation est requise'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }
    next();
  }
];

// Validation pour la création de ressource
exports.validateResource = [
  body('title')
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('Le titre doit contenir entre 5 et 200 caractères'),
  body('description')
    .trim()
    .isLength({ min: 20, max: 2000 })
    .withMessage('La description doit contenir entre 20 et 2000 caractères'),
  body('category')
    .isIn(['don', 'service', 'echange', 'aide'])
    .withMessage('Catégorie invalide'),
  body('location')
    .notEmpty()
    .withMessage('La localisation est requise'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }
    next();
  }
];

// ==========================================
// 21. SERVER - src/server.js
// ==========================================

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const connectDB = require('./config/database');
const errorHandler = require('./middleware/errorHandler');

// Routes
const authRoutes = require('./routes/authRoutes');
const resourceRoutes = require('./routes/resourceRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const userRoutes = require('./routes/userRoutes');

// Connect to database
connectDB();

const app = express();

// ===== MIDDLEWARE =====

// Security headers
app.use(helmet());

// CORS
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:4200',
  credentials: true
}));

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression
app.use(compression());

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: 'Trop de requêtes, veuillez réessayer plus tard'
});

app.use('/api', limiter);

// Logging middleware (development)
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
  });
}

// ===== ROUTES =====

app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'API DonLocal.cm',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      resources: '/api/resources',
      upload: '/api/upload',
      users: '/api/users'
    }
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/resources', resourceRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/users', userRoutes);

// Error handler
app.use(errorHandler);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route introuvable'
  });
});

// ===== START SERVER =====

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════╗
║                                       ║
║   🌍 API DONLOCAL.CM                 ║
║                                       ║
║   ✅ Server: http://localhost:${PORT}  ║
║   ✅ Environment: ${process.env.NODE_ENV}        ║
║   ✅ Database: Connected              ║
║                                       ║
╚═══════════════════════════════════════╝
  `);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.log(`❌ Error: ${err.message}`);
  server.close(() => process.exit(1));
});

module.exports = app;

// ==========================================
// 22. .gitignore
// ==========================================

/*
node_modules/
.env
.env.local
.env.production
*.log
.DS_Store
coverage/
dist/
build/
uploads/
*.pem
*/

// ==========================================
// 23. COMMANDES DE DÉMARRAGE
// ==========================================

/*
# 1. INSTALLATION
npm install

# 2. CONFIGURATION
# Créer le fichier .env et remplir les variables

# 3. MONGODB LOCAL (optionnel)
# Installer MongoDB: https://www.mongodb.com/try/download/community
# Démarrer MongoDB:
mongod

# 4. MONGODB ATLAS (recommandé)
# Créer un cluster gratuit sur: https://www.mongodb.com/cloud/atlas
# Copier l'URI de connexion dans .env

# 5. CLOUDINARY (pour upload images)
# Créer un compte gratuit: https://cloudinary.com
# Copier les credentials dans .env

# 6. DÉMARRAGE
npm run dev     # Mode développement avec nodemon
npm start       # Mode production

# 7. TEST API
# Utiliser Postman, Insomnia ou Thunder Client (VS Code)
# Base URL: http://localhost:5000/api
*/

// ==========================================
// 24. EXEMPLES DE REQUÊTES API
// ==========================================

/*
=== AUTHENTIFICATION ===

1. INSCRIPTION
POST http://localhost:5000/api/auth/register
Content-Type: application/json

{
  "name": "Jean Dupont",
  "email": "jean@example.com",
  "password": "password123",
  "phone": "+237650000000",
  "whatsapp": "+237650000000",
  "location": "Douala, Akwa"
}

2. CONNEXION
POST http://localhost:5000/api/auth/login
Content-Type: application/json

{
  "email": "jean@example.com",
  "password": "password123"
}

3. PROFIL ACTUEL
GET http://localhost:5000/api/auth/me
Authorization: Bearer YOUR_TOKEN_HERE

=== RESSOURCES ===

4. LISTE DES RESSOURCES
GET http://localhost:5000/api/resources
GET http://localhost:5000/api/resources?category=don
GET http://localhost:5000/api/resources?search=table
GET http://localhost:5000/api/resources?page=1&limit=12

5. DÉTAILS D'UNE RESSOURCE
GET http://localhost:5000/api/resources/:id

6. CRÉER UNE RESSOURCE
POST http://localhost:5000/api/resources
Authorization: Bearer YOUR_TOKEN_HERE
Content-Type: application/json

{
  "title": "Table en bois massif",
  "description": "Belle table en excellent état, 6 places",
  "category": "don",
  "location": "Douala, Akwa",
  "imageUrl": "https://example.com/image.jpg"
}

7. MODIFIER UNE RESSOURCE
PUT http://localhost:5000/api/resources/:id
Authorization: Bearer YOUR_TOKEN_HERE
Content-Type: application/json

{
  "title": "Table en bois massif (Mise à jour)",
  "status": "reserve"
}

8. SUPPRIMER UNE RESSOURCE
DELETE http://localhost:5000/api/resources/:id
Authorization: Bearer YOUR_TOKEN_HERE

=== UPLOAD IMAGE ===

9. UPLOAD IMAGE
POST http://localhost:5000/api/upload
Authorization: Bearer YOUR_TOKEN_HERE
Content-Type: multipart/form-data

Form Data:
- image: [fichier image]

=== UTILISATEUR ===

10. PROFIL UTILISATEUR
GET http://localhost:5000/api/users/:userId

11. METTRE À JOUR PROFIL
PUT http://localhost:5000/api/users/profile
Authorization: Bearer YOUR_TOKEN_HERE
Content-Type: application/json

{
  "name": "Jean Dupont",
  "phone": "+237651111111",
  "location": "Douala, Bonanjo",
  "bio": "Passionné de partage local"
}
*/


// ==========================================
// GUIDE COMPLET - DÉPLOIEMENT & INTÉGRATION
// ==========================================

// ==========================================
// 1. SERVICE HTTP ANGULAR - src/app/core/services/api.service.ts
// ==========================================

import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private http = inject(HttpClient);
  private baseUrl = environment.apiUrl;

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    });
  }

  // GET Request
  get<T>(endpoint: string, params?: any): Observable<T> {
    const httpParams = new HttpParams({ fromObject: params });
    return this.http.get<T>(`${this.baseUrl}${endpoint}`, {
      headers: this.getHeaders(),
      params: httpParams
    }).pipe(
      catchError(this.handleError)
    );
  }

  // POST Request
  post<T>(endpoint: string, data: any): Observable<T> {
    return this.http.post<T>(`${this.baseUrl}${endpoint}`, data, {
      headers: this.getHeaders()
    }).pipe(
      catchError(this.handleError)
    );
  }

  // PUT Request
  put<T>(endpoint: string, data: any): Observable<T> {
    return this.http.put<T>(`${this.baseUrl}${endpoint}`, data, {
      headers: this.getHeaders()
    }).pipe(
      catchError(this.handleError)
    );
  }

  // DELETE Request
  delete<T>(endpoint: string): Observable<T> {
    return this.http.delete<T>(`${this.baseUrl}${endpoint}`, {
      headers: this.getHeaders()
    }).pipe(
      catchError(this.handleError)
    );
  }

  // Upload Image
  uploadImage(file: File): Observable<any> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    const formData = new FormData();
    formData.append('image', file);

    return this.http.post(`${this.baseUrl}/upload`, formData, { headers })
      .pipe(catchError(this.handleError));
  }

  private handleError(error: any): Observable<never> {
    console.error('API Error:', error);
    return throwError(() => error);
  }
}

// ==========================================
// 2. AUTH SERVICE AVEC API - src/app/core/services/auth.service.ts
// ==========================================

import { Injectable, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from './api.service';
import { User } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiService = inject(ApiService);
  private router = inject(Router);

  private currentUser = signal<User | null>(null);
  private isAuthenticated = signal<boolean>(false);

  getCurrentUser = this.currentUser.asReadonly();
  getAuthStatus = this.isAuthenticated.asReadonly();

  constructor() {
    this.loadUserFromToken();
  }

  // Register
  register(data: any) {
    return this.apiService.post<any>('/auth/register', data).pipe(
      map(response => {
        if (response.success) {
          this.setSession(response.data);
        }
        return response;
      })
    );
  }

  // Login
  login(credentials: { email: string; password: string }) {
    return this.apiService.post<any>('/auth/login', credentials).pipe(
      map(response => {
        if (response.success) {
          this.setSession(response.data);
        }
        return response;
      })
    );
  }

  // Logout
  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.currentUser.set(null);
    this.isAuthenticated.set(false);
    this.router.navigate(['/login']);
  }

  // Get Current User
  getMe() {
    return this.apiService.get<any>('/auth/me').pipe(
      map(response => {
        if (response.success) {
          this.currentUser.set(response.data);
        }
        return response;
      })
    );
  }

  private setSession(data: any) {
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    this.currentUser.set(data.user);
    this.isAuthenticated.set(true);
  }

  private loadUserFromToken() {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');

    if (token && user) {
      try {
        this.currentUser.set(JSON.parse(user));
        this.isAuthenticated.set(true);
        
        // Refresh user data
        this.getMe().subscribe();
      } catch (error) {
        this.logout();
      }
    }
  }
}

// ==========================================
// 3. RESOURCE SERVICE AVEC API - Mise à jour
// ==========================================

import { Injectable, inject, signal } from '@angular/core';
import { ApiService } from './api.service';
import { Resource } from '../models/resource.model';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class ResourceServiceWithAPI {
  private apiService = inject(ApiService);
  private resources = signal<Resource[]>([]);

  getResources = this.resources.asReadonly();

  // Fetch all resources
  fetchResources(params?: any) {
    return this.apiService.get<any>('/resources', params).pipe(
      map(response => {
        if (response.success) {
          this.resources.set(response.data);
        }
        return response;
      })
    );
  }

  // Get single resource
  getResourceById(id: string) {
    return this.apiService.get<any>(`/resources/${id}`);
  }

  // Create resource
  createResource(data: any) {
    return this.apiService.post<any>('/resources', data).pipe(
      map(response => {
        if (response.success) {
          this.resources.update(list => [...list, response.data]);
        }
        return response;
      })
    );
  }

  // Update resource
  updateResource(id: string, data: any) {
    return this.apiService.put<any>(`/resources/${id}`, data).pipe(
      map(response => {
        if (response.success) {
          this.resources.update(list =>
            list.map(r => r.id === id ? response.data : r)
          );
        }
        return response;
      })
    );
  }

  // Delete resource
  deleteResource(id: string) {
    return this.apiService.delete<any>(`/resources/${id}`).pipe(
      map(response => {
        if (response.success) {
          this.resources.update(list => list.filter(r => r.id !== id));
        }
        return response;
      })
    );
  }
}

// ==========================================
// 4. ENVIRONMENT CONFIG
// ==========================================

// src/environments/environment.ts (Development)
export const environment = {
  production: false,
  apiUrl: 'http://localhost:5000/api'
};

// src/environments/environment.prod.ts (Production)
export const environment = {
  production: true,
  apiUrl: 'https://your-api-domain.com/api'
};

// ==========================================
// 5. HTTP INTERCEPTOR - src/app/core/interceptors/http.interceptor.ts
// ==========================================

import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { NotificationService } from '../services/notification.service';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';

export const httpInterceptor: HttpInterceptorFn = (req, next) => {
  const notificationService = inject(NotificationService);

  return next(req).pipe(
    catchError(error => {
      let errorMessage = 'Une erreur est survenue';

      if (error.error?.message) {
        errorMessage = error.error.message;
      } else if (error.status === 0) {
        errorMessage = 'Impossible de contacter le serveur';
      } else if (error.status === 401) {
        errorMessage = 'Session expirée, veuillez vous reconnecter';
      } else if (error.status === 403) {
        errorMessage = 'Accès non autorisé';
      } else if (error.status === 404) {
        errorMessage = 'Ressource introuvable';
      } else if (error.status >= 500) {
        errorMessage = 'Erreur serveur, veuillez réessayer';
      }

      notificationService.error(errorMessage);
      return throwError(() => error);
    })
  );
};

// ==========================================
// 6. APP CONFIG - Ajouter l'interceptor
// ==========================================

import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { httpInterceptor } from './core/interceptors/http.interceptor';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(withInterceptors([httpInterceptor]))
  ]
};

// ==========================================
// 7. DÉPLOIEMENT - Guide complet
// ==========================================

/*
==========================================
DÉPLOIEMENT BACKEND (API)
==========================================

OPTION 1: RENDER.COM (Gratuit)
--------------------------------
1. Créer un compte sur render.com
2. Connecter votre repo GitHub
3. Créer un "Web Service"
4. Configuration:
   - Build Command: npm install
   - Start Command: npm start
   - Environment: Node
5. Variables d'environnement:
   - NODE_ENV=production
   - MONGODB_URI=your_mongodb_atlas_uri
   - JWT_SECRET=your_secret
   - CLOUDINARY_...
   - CLIENT_URL=https://your-frontend.com

OPTION 2: RAILWAY.APP (Gratuit)
---------------------------------
1. Créer un compte sur railway.app
2. New Project > Deploy from GitHub
3. Add variables d'environnement
4. Deploy automatique

OPTION 3: HEROKU
-----------------
1. Installer Heroku CLI
2. Commandes:
   heroku login
   heroku create donlocal-api
   heroku config:set NODE_ENV=production
   heroku config:set MONGODB_URI=...
   git push heroku main

==========================================
DÉPLOIEMENT FRONTEND (Angular)
==========================================

OPTION 1: VERCEL (Recommandé)
-------------------------------
1. Installer Vercel CLI:
   npm i -g vercel

2. Build:
   ng build --configuration production

3. Deploy:
   vercel --prod

OPTION 2: NETLIFY
------------------
1. Build:
   ng build --configuration production

2. Déployer le dossier dist/

3. Configuration _redirects:
   /* /index.html 200

OPTION 3: FIREBASE HOSTING
----------------------------
1. Installer Firebase CLI:
   npm i -g firebase-tools

2. Init:
   firebase init hosting

3. Build:
   ng build --configuration production

4. Deploy:
   firebase deploy

==========================================
BASE DE DONNÉES
==========================================

MONGODB ATLAS (Gratuit)
------------------------
1. Créer un compte: https://mongodb.com/cloud/atlas
2. Créer un cluster gratuit (M0)
3. Database Access: Créer un user
4. Network Access: Ajouter 0.0.0.0/0 (tous)
5. Connect: Copier l'URI de connexion
6. Remplacer <password> par votre mot de passe

URI Format:
mongodb+srv://username:password@cluster.mongodb.net/donlocal

==========================================
CLOUDINARY (Upload images)
==========================================

1. Créer un compte gratuit: https://cloudinary.com
2. Dashboard > Account Details
3. Copier:
   - Cloud Name
   - API Key
   - API Secret
4. Ajouter dans .env

==========================================
TESTS DE L'API
==========================================

# Test local
curl http://localhost:5000/api/resources

# Test production
curl https://your-api.com/api/resources

# Test avec Postman/Insomnia
Importer la collection depuis:
https://www.postman.com/downloads/

==========================================
MONITORING & LOGS
==========================================

# Voir les logs Render
render logs --tail

# Voir les logs Heroku
heroku logs --tail

# MongoDB Atlas
Monitoring > Metrics

==========================================
SÉCURITÉ - Checklist
==========================================

✅ Variables d'environnement sécurisées
✅ CORS configuré correctement
✅ Rate limiting activé
✅ Helmet.js pour les headers
✅ Validation des données (express-validator)
✅ JWT avec expiration
✅ Pas de données sensibles dans les logs
✅ HTTPS obligatoire en production
✅ Backup de la base de données

==========================================
COMMANDES UTILES
==========================================

# Build Angular
ng build --configuration production

# Test build Angular local
cd dist/donlocal
npx http-server -p 4200

# Variables d'env backend
heroku config:set KEY=VALUE
render env set KEY=VALUE

# MongoDB backup
mongodump --uri="mongodb+srv://..."

# Logs
heroku logs --tail
vercel logs
*/