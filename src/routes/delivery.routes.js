const express = require('express');
const router = express.Router();
const deliveryController = require('../controllers/delivery.controller');
console.log('Delivery routes loaded');


router.post('/', deliveryController.createDelivery);
router.get('/', deliveryController.getAllDeliveries);
router.get('/history', deliveryController.getDeliveryHistory);
// Cancel a delivery (set status -> cancelled)
router.patch('/:id/cancel', deliveryController.cancelDelivery);

module.exports = router;
