const express = require('express');
const router = express.Router();
const kpiController = require('../controllers/kpi.controller');

// GET /api/kpi/deliveries
router.get('/deliveries', kpiController.getDeliveryStats);

module.exports = router;
