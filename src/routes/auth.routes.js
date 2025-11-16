const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { validateSignUp } = require('../middlewares/validation.middleware');

// POST /api/auth/signup
router.post('/signup', validateSignUp, authController.signUp);
router.post('/login', authController.login);

router.post('/forgot-password', authController.forgotPassword);
router.post('/verify-reset-code', authController.verifyResetCode);
router.post('/reset-password', authController.resetPassword);
router.get('/verify-email', authController.verifyEmail);
router.post('/resend-verification', authController.resendVerificationEmail);

module.exports = router;
