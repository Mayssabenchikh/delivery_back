const express = require('express');
const router = express.Router();
const deliveryController = require('../../controllers/company/delivery.controller');
const { authMiddleware, isCompany } = require('../../middlewares/authMiddleware');

router.use(authMiddleware);
router.use(isCompany);

// Deliveries CRUD
router.get('/', deliveryController.getAllDeliveries);
router.get('/clients', deliveryController.getClients);
router.get('/drivers', deliveryController.getDrivers);
router.get('/:id', deliveryController.getDelivery);
router.post('/', deliveryController.addDelivery);
router.put('/:id', deliveryController.updateDelivery);
router.delete('/:id', deliveryController.deleteDelivery);

module.exports = router;
