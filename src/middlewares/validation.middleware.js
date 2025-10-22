const { body, validationResult } = require('express-validator');

// Validation Sign Up
exports.validateSignUp = [
  body('name')
    .trim()
    .notEmpty().withMessage('Full name is required')
    .isLength({ min: 3 }).withMessage('Name must be at least 3 characters'),
  
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Invalid email format')
    .normalizeEmail(),
  
  body('phone')
    .trim()
    .notEmpty().withMessage('Phone is required')
    .matches(/^\+?\d{8,15}$/).withMessage('Invalid phone format'),
  
  body('address')
    .trim()
    .notEmpty().withMessage('Address is required')
    .isLength({ min: 10 }).withMessage('Address must be at least 10 characters'),
  
  body('password')
    .trim()
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  
  // Middleware pour vérifier les erreurs
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array().map(err => ({
          field: err.path,
          message: err.msg
        }))
      });
    }
    next();
  }
];