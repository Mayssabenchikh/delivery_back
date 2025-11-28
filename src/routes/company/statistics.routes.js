const express = require('express');
const router = express.Router();
const statisticsController = require('../../controllers/company/statistics.controller');
const { authMiddleware, isCompany } = require('../../middlewares/authMiddleware');

router.use(authMiddleware);
router.use(isCompany);

// Statistics routes
router.get('/', statisticsController.getStatistics);
router.get('/performance', statisticsController.getPerformanceData);

module.exports = router;
