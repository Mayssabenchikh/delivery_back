const express = require('express');
const router = express.Router();
const authenticateToken = require('../middlewares/authMiddleware');
const chatController = require('../controllers/chat.controller');

// Route pour télécharger un fichier (accessible avec authentification)
router.get('/attachments/:filename', authenticateToken, chatController.downloadAttachment);

// Toutes les autres routes nécessitent une authentification
router.use(authenticateToken);

// Créer ou récupérer une conversation pour une delivery
router.post('/conversations', chatController.createOrGetConversation);

// Récupérer toutes les conversations de l'utilisateur
router.get('/conversations', chatController.getUserConversations);

// Récupérer une conversation spécifique avec ses messages
router.get('/conversations/:id', chatController.getConversation);

// Envoyer un message (avec upload de fichier optionnel)
router.post('/messages', chatController.uploadFile, chatController.sendMessage);

module.exports = router;

