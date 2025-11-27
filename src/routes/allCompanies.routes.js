const express = require('express');
const router = express.Router();
const allCompaniesController = require('../controllers/allCompanies.controller');


router.get('/', allCompaniesController.getComapanies);
router.get('/:id', allCompaniesController.getCompany);
// Get companies by user_id (only active)
router.get('/by-user/:user_id', allCompaniesController.getCompaniesByUserId);



module.exports = router;
