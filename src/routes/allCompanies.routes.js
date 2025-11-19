const express = require('express');
const router = express.Router();
const allCompaniesController = require('../controllers/allCompanies.controller');

router.get('/', allCompaniesController.getComapanies);
router.get('/:id', allCompaniesController.getCompany);



module.exports = router;
