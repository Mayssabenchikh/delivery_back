const express = require('express');
const router = express.Router();
const DeliveryController = require('../controllers/models/deliveryController');
const authMiddleware = require('../middlewares/authMiddleware');

console.log('🛣️ [ROUTES] Deliveries routes loaded');

// Route de test sans auth
router.get('/test', (req, res) => {
  console.log('✅ [ROUTES] /test route called');
  res.json({ message: 'Deliveries API is working!' });
});

// Routes statiques / spécifiques AVANT les routes paramétriques
router.get(
  '/driver',
  authMiddleware,
  (req, res, next) => {
    console.log('🛣️ [ROUTES] /driver route reached - auth passed');
    next();
  },
  DeliveryController.getDeliveriesByDriver
);

// Routes CRUD
router.get('/', DeliveryController.getAllDeliveries);
router.get('/:id', DeliveryController.getDeliveryById);
router.post('/', DeliveryController.createDelivery);
router.put('/:id', DeliveryController.updateDelivery);
router.delete('/:id', DeliveryController.deleteDelivery);

// Routes spécifiques
router.post('/:id/delivered', DeliveryController.markDelivered);
router.post('/:id/returned', DeliveryController.markReturned);
router.post('/:id/in_transit', DeliveryController.markReturned);
router.patch('/:id/assign', DeliveryController.assignDriver);

module.exports = router;
