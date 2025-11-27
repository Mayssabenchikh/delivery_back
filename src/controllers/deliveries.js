const express = require('express');
const router = express.Router();
const DeliveryController = require('../controllers/models/deliveryController');
const authenticateToken = require('../middlewares/authMiddleware');
/*
// Routes CRUD
router.get('/', DeliveryController.getAllDeliveries);
router.get('/:id', DeliveryController.getDeliveryById);
router.post('/', DeliveryController.createDelivery);
router.put('/:id', DeliveryController.updateDelivery);
router.delete('/:id', DeliveryController.deleteDelivery);

// Routes spécifiques
router.patch('/:id/status', DeliveryController.updateDeliveryStatus);
router.patch('/:id/assign', DeliveryController.assignDriver);

// Route pour récupérer les livraisons du livreur connecté
router.get('/driver', authMiddleware, DeliveryController.getDeliveriesByDriver)
module.exports = router;*/
