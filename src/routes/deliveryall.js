// backend/routes/deliveryall.js
const express = require('express');
const router = express.Router();
const DeliveryAllController = require('../controllers/deliveryallController');
const authMiddleware = require('../middlewares/authMiddleware');

// Route de test sans auth
router.get('/test', (req, res) => {
  res.json({ message: 'DeliveryAll API is working!' });
});

// Route pour récupérer toutes les livraisons du livreur connecté (protégée)
router.get(
  '/driver',
  authMiddleware,
  DeliveryAllController.getAllDeliveriesByDriver
);
router.get(
  '/driver/kpi',
  authMiddleware,
  DeliveryAllController.getDriverKPI
);

// Routes CRUD générales
router.get('/', DeliveryAllController.getAllDeliveries);
router.get('/:id', DeliveryAllController.getDeliveryById);
router.post('/', DeliveryAllController.createDelivery);
router.put('/:id', DeliveryAllController.updateDelivery);
router.delete('/:id', DeliveryAllController.deleteDelivery);

module.exports = router;
