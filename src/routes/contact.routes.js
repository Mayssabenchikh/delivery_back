const express = require('express');
const router = express.Router();
const contactController = require('../controllers/contact-us.controller');

router.post('/',contactController.sendContact);
router.get('/',contactController.getContacts);
router.delete('/delete', contactController.deleteContacts)

module.exports = router;