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