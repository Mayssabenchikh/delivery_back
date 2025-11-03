
// routes/company.routes.js

const express = require('express');
const router = express.Router();
const register = require('../controllers/company');
const upload = require('../middleware/upload.middleware');
const auth = require('../middleware/auth.middleware');
// Routes publiques
router.post('/add', upload.single('logo'), register.create);
// Routes protégées (nécessitent authentification)
router.get('/all', auth, companyController.getAllCompanies);
router.get('/:id', auth, companyController.getCompanyById);


module.exports = router;