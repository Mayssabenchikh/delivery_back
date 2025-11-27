const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware'); // middleware pour récupérer req.user
const profileController = require('../controllers/profilelivreurController');

router.use(authMiddleware);

// Récupérer le profil du livreur
router.get('/livreur', profileController.getLivreurProfile);

// Mettre à jour le profil
router.put('/livreur', profileController.updateLivreurProfile);

// Supprimer le compte
router.delete('/livreur', profileController.deleteLivreurProfile);

module.exports = router;
