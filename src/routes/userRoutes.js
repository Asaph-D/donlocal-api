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