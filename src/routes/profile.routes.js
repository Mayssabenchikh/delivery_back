const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profile.controller');

// GET /api/profile?email=user@example.com - Get user profile by email
router.get('/', profileController.getProfile);

// PUT /api/profile/update - Update user profile (email used as identifier)
router.put('/update', profileController.updateProfile);

// POST /api/profile/verify-password - Verify user's current password
router.post('/verify-password', profileController.verifyPassword);

// POST /api/profile/delete-account - Delete user account
router.post('/delete-account', profileController.deleteAccount);

module.exports = router;
