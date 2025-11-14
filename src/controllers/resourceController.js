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