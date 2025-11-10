const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { validateSignUp } = require('../middlewares/validation.middleware');

// POST /api/auth/signup
router.post('/signup', validateSignUp, authController.signUp);
router.post('/login', authController.login);


module.exports = router;

router.get('/test', (req, res) => {
  res.json({ message: 'Test route works' });
});
