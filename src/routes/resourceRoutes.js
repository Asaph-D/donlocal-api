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
