const express = require('express');
const router = express.Router();
const { getAddressFromCoordinates, getCoordinatesFromAddress } = require('../controllers/location.controller');

router.get('/reverse', getAddressFromCoordinates);
router.get('/search', getCoordinatesFromAddress);

module.exports = router;
