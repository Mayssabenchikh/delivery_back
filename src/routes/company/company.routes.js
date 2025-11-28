const express = require('express');
const router = express.Router();
const companyController = require('../../controllers/company/company.controller');
const { authMiddleware } = require('../../middlewares/authMiddleware');

// GET /api/company/info - Get company basic info
router.get('/info', authMiddleware, companyController.getCompanyInfo);

// GET /api/company/profile - Get full company profile with contact info
router.get('/profile', authMiddleware, companyController.getCompanyProfile);

// PUT /api/company/profile - Update company profile
router.put('/profile', authMiddleware, companyController.updateCompanyProfile);

module.exports = router;
