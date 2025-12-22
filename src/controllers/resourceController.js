// ==========================================
// 12. RESOURCE CONTROLLER - src/controllers/resourceController.js
// ==========================================

const Resource = require('../models/Resource');
const User = require('../models/User');
const { Op } = require('sequelize');

// @desc    Get all resources
// @route   GET /api/resources
// @access  Public
exports.getResources = async (req, res) => {
  try {
    const { category, status, search, limit = 12, page = 1 } = req.query;

    // Build query
    const where = { isActive: true };

    if (category && category !== 'all') where.category = category;
    if (status) where.status = status;

    if (search) {
      where[Op.or] = [
        { title: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } },
        { location: { [Op.iLike]: `%${search}%` } }
      ];
    }

    // Pagination
    const limitInt = parseInt(limit);
    const offset = (parseInt(page) - 1) * limitInt;

    const resources = await Resource.findAll({
      where,
      include: [{ model: User, attributes: ['id', 'name', 'email', 'phone', 'whatsapp', 'location', 'avatar'] }],
      order: [['createdAt', 'DESC']],
      limit: limitInt,
      offset
    });

    const total = await Resource.count({ where });

    res.status(200).json({
      success: true,
      count: resources.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limitInt),
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
    const resource = await Resource.findByPk(req.params.id, {
      include: [{ model: User, attributes: ['id', 'name', 'email', 'phone', 'whatsapp', 'location', 'avatar', 'rating'] }]
    });

    if (!resource) return res.status(404).json({ success: false, message: 'Ressource introuvable' });

    await resource.increment('views');

    const updated = await Resource.findByPk(req.params.id, {
      include: [{ model: User, attributes: ['id', 'name', 'email', 'phone', 'whatsapp', 'location', 'avatar', 'rating'] }]
    });

    res.status(200).json({ success: true, data: updated });
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
    await User.increment('resourcesCount', { by: 1, where: { id: req.user.id } });

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
    const resource = await Resource.findByPk(req.params.id);
    if (!resource) return res.status(404).json({ success: false, message: 'Ressource introuvable' });

    if (resource.author.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Non autorisé à modifier cette ressource' });
    }

    await resource.update(req.body);

    res.status(200).json({ success: true, message: 'Ressource mise à jour avec succès', data: resource });
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
    const resource = await Resource.findByPk(req.params.id);
    if (!resource) return res.status(404).json({ success: false, message: 'Ressource introuvable' });

    if (resource.author.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Non autorisé à supprimer cette ressource' });
    }

    await resource.destroy();

    await User.decrement('resourcesCount', { by: 1, where: { id: resource.author } });

    res.status(200).json({ success: true, message: 'Ressource supprimée avec succès' });
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
    const resources = await Resource.findAll({ 
      where: { author: req.params.userId, isActive: true },
      order: [['createdAt', 'DESC']]
    });

    res.status(200).json({ success: true, count: resources.length, data: resources });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des ressources',
      error: error.message
    });
  }
};