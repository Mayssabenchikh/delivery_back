const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { validateSignUp } = require('../middlewares/validation.middleware');

// POST /api/auth/signup
router.post('/signup', validateSignUp, authController.signUp);

module.exports = router;