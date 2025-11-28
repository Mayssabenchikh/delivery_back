const express = require('express');
const router = express.Router();
const driverController = require('../../controllers/company/drivers.controller');
const { authMiddleware, isCompany } = require('../../middlewares/authMiddleware');

router.use(authMiddleware);
router.use(isCompany);

// Drivers CRUD
router.get('/', driverController.getAllDrivers);
router.get('/:id', driverController.getDriver);
router.post('/', driverController.addDriver);
router.put('/:id', driverController.updateDriver);
router.delete('/:id', driverController.deleteDriver);

module.exports = router;
