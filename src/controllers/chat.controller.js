const Conversation = require('../models/conversation');
const Message = require('../models/message');
const Attachment = require('../models/attachment');
const db = require('../config/database');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { getIO } = require('../services/socket.service');

// Configuration de multer pour l'upload de fichiers
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Utiliser le même chemin que le serveur (src/uploads/chat)
    const uploadDir = path.join(__dirname, '../uploads/chat');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
  fileFilter: (req, file, cb) => {
    // Accepter tous les types de fichiers
    cb(null, true);
  }
}).single('file');

// Créer ou récupérer une conversation pour une delivery
exports.createOrGetConversation = async (req, res) => {
  try {
    const { delivery_id } = req.body;
    const userId = req.user.id;
    const userRole = req.user.role;

    if (!delivery_id) {
      return res.status(400).json({ success: false, message: 'delivery_id is required' });
    }

    // Vérifier que la delivery existe et que l'utilisateur y a accès
    const deliverySql = `SELECT d.*, dr.user_id AS driver_user_id 
                         FROM deliveries d 
                         LEFT JOIN drivers dr ON d.driver_id = dr.id 
                         WHERE d.id = ?`;
    const [deliveries] = await db.query(deliverySql, [delivery_id]);
    
    if (!deliveries || deliveries.length === 0) {
      return res.status(404).json({ success: false, message: 'Delivery not found' });
    }

    const delivery = deliveries[0];

    // Vérifier l'accès
    if (userRole === 'client' && delivery.client_id !== userId) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    if (userRole === 'driver' && delivery.driver_user_id !== userId) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    // Vérifier qu'un driver est assigné
    if (!delivery.driver_id) {
      return res.status(400).json({ success: false, message: 'No driver assigned to this delivery' });
    }

    // Déterminer les IDs pour la conversation
    const clientId = delivery.client_id;
    const driverId = delivery.driver_user_id;

    // Créer ou récupérer la conversation
    const conversation = await Conversation.findOrCreateByDelivery(delivery_id, clientId, driverId);

    res.status(200).json({ success: true, conversation });
  } catch (error) {
    console.error('Error creating/getting conversation:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Récupérer toutes les conversations de l'utilisateur
exports.getUserConversations = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    const conversations = await Conversation.getUserConversations(userId, userRole);

    res.status(200).json({ success: true, conversations });
  } catch (error) {
    console.error('Error getting conversations:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Récupérer une conversation spécifique avec ses messages
exports.getConversation = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    const conversation = await Conversation.getById(id, userId, userRole);

    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Conversation not found or access denied' });
    }

    const messages = await Message.getByConversation(id, userId);

    res.status(200).json({ 
      success: true, 
      conversation,
      messages 
    });
  } catch (error) {
    console.error('Error getting conversation:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Envoyer un message
exports.sendMessage = async (req, res) => {
  try {
    const { conversation_id, text } = req.body;
    const userId = req.user.id;
    const userRole = req.user.role;

    if (!conversation_id) {
      return res.status(400).json({ success: false, message: 'conversation_id is required' });
    }

    // Vérifier l'accès à la conversation
    const conversation = await Conversation.getById(conversation_id, userId, userRole);
    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Conversation not found or access denied' });
    }

    // Déterminer le receiver_id
    let receiverId = null;
    if (userRole === 'client') {
      // Le receiver est le driver
      const driverSql = `SELECT user_id FROM drivers WHERE id = ?`;
      const [drivers] = await db.query(driverSql, [conversation.driver_table_id]);
      if (drivers && drivers.length > 0) {
        receiverId = drivers[0].user_id;
      }
    } else if (userRole === 'driver') {
      // Le receiver est le client
      receiverId = conversation.client_id;
    }

    // Gérer l'upload de fichier si présent
    let attachmentId = null;
    if (req.file) {
      // Utiliser une route API pour servir le fichier avec le bon Content-Type
      const fileUrl = `${req.protocol}://${req.get('host')}/api/chat/attachments/${req.file.filename}`;
      const attachment = await Attachment.create({
        sent_by: 'message',
        entity_id: 0, // Sera mis à jour après création du message
        url: fileUrl,
        mime_type: req.file.mimetype,
        original_filename: req.file.originalname || null
      });
      attachmentId = attachment.id;
    }

    // Créer le message
    const message = await Message.create({
      conversation_id,
      sender_id: userId,
      receiver_id: receiverId,
      text: text || null,
      attachment_id: attachmentId
    });

    // Mettre à jour l'entity_id de l'attachment si présent
    if (attachmentId) {
      await db.query('UPDATE attachments SET entity_id = ? WHERE id = ?', [message.id, attachmentId]);
    }

    // Récupérer le message complet avec toutes les informations (sender_name, attachment_url, etc.)
    // Note: original_filename peut ne pas exister dans certaines versions de la DB
    const messageSql = `
      SELECT 
        m.*,
        u.name AS sender_name,
        u.email AS sender_email,
        a.url AS attachment_url,
        a.mime_type AS attachment_mime_type
      FROM messages m
      LEFT JOIN users u ON m.sender_id = u.id
      LEFT JOIN attachments a ON m.attachment_id = a.id
      WHERE m.id = ?
    `;
    const [messages] = await db.query(messageSql, [message.id]);
    const fullMessage = messages[0];
    
    // Essayer de récupérer original_filename séparément si la colonne existe
    if (fullMessage && fullMessage.attachment_id) {
      try {
        const [filenameResult] = await db.query(
          'SELECT original_filename FROM attachments WHERE id = ?',
          [fullMessage.attachment_id]
        );
        if (filenameResult && filenameResult.length > 0 && filenameResult[0].original_filename) {
          fullMessage.attachment_original_filename = filenameResult[0].original_filename;
        }
      } catch (err) {
        // La colonne n'existe pas encore, ce n'est pas grave
        console.log('original_filename column not available, skipping');
      }
    }
    
    // S'assurer que le message a conversation_id pour Socket.io
    if (!fullMessage.conversation_id) {
      fullMessage.conversation_id = conversation_id;
    }

    // Émettre l'événement Socket.io pour les autres utilisateurs
    try {
      const io = getIO();
      if (io) {
        // S'assurer que le message a conversation_id
        if (!fullMessage.conversation_id) {
          fullMessage.conversation_id = conversation_id;
        }
        
        console.log(`📤 Emitting new_message to conversation_${conversation_id}`, {
          message_id: fullMessage.id,
          conversation_id: fullMessage.conversation_id,
          sender_id: fullMessage.sender_id,
          text: fullMessage.text ? fullMessage.text.substring(0, 50) + '...' : null,
          has_attachment: !!fullMessage.attachment_url
        });
        
        // Envoyer le message à tous les participants de la conversation
        io.to(`conversation_${conversation_id}`).emit('new_message', fullMessage);
        console.log(`✅ Message emitted to room: conversation_${conversation_id}`);
        
        // Notifier le receiver s'il n'est pas dans la conversation
        if (receiverId) {
          console.log(`📤 Emitting new_message_notification to user_${receiverId}`);
          io.to(`user_${receiverId}`).emit('new_message_notification', {
            conversation_id,
            message: fullMessage
          });
        }
      } else {
        console.error('❌ Socket.io instance not available');
      }
    } catch (error) {
      console.error('❌ Error emitting socket event:', error);
      // Continuer même si Socket.io échoue
    }

    res.status(201).json({ success: true, message: fullMessage });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Middleware pour l'upload de fichier
exports.uploadFile = (req, res, next) => {
  upload(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ success: false, message: 'File too large (max 10MB)' });
        }
      }
      return res.status(400).json({ success: false, message: err.message });
    }
    next();
  });
};

// Servir un fichier avec le bon Content-Type et Content-Disposition
exports.downloadAttachment = async (req, res) => {
  try {
    const { filename } = req.params;
    // Sécuriser le nom de fichier (empêcher les path traversal)
    const safeFilename = path.basename(filename);
    
    // Le fichier peut être dans src/uploads/chat (nouveau) ou uploads/chat (ancien)
    // __dirname est dans src/controllers, donc on remonte d'un niveau pour src/uploads/chat
    let filePath = path.join(__dirname, '../uploads/chat', safeFilename);
    
    // Si le fichier n'existe pas dans le nouvel emplacement, vérifier l'ancien
    if (!fs.existsSync(filePath)) {
      const oldPath = path.join(__dirname, '../../uploads/chat', safeFilename);
      if (fs.existsSync(oldPath)) {
        filePath = oldPath;
      } else {
        console.error('File not found in either location:', safeFilename);
        return res.status(404).json({ success: false, message: 'File not found' });
      }
    }

    // Récupérer le type MIME depuis la base de données si possible
    const db = require('../config/database');
    const [attachments] = await db.query(
      `SELECT mime_type FROM attachments WHERE url LIKE ?`,
      [`%${safeFilename}%`]
    );
    
    let mimeType = 'application/octet-stream';
    if (attachments && attachments.length > 0 && attachments[0].mime_type) {
      mimeType = attachments[0].mime_type;
    } else {
      // Essayer de deviner le type MIME à partir de l'extension
      const ext = path.extname(safeFilename).toLowerCase();
      const mimeTypes = {
        '.pdf': 'application/pdf',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.gif': 'image/gif',
        '.txt': 'text/plain',
        '.doc': 'application/msword',
        '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        '.xls': 'application/vnd.ms-excel',
        '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        '.zip': 'application/zip',
        '.rar': 'application/x-rar-compressed'
      };
      if (mimeTypes[ext]) {
        mimeType = mimeTypes[ext];
      }
    }

    // Définir les headers pour forcer le téléchargement avec le bon nom et type
    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${safeFilename}"`);
    res.setHeader('Cache-Control', 'no-cache');
    
    // Envoyer le fichier
    res.sendFile(filePath);
  } catch (error) {
    console.error('Error downloading attachment:', error);
    res.status(500).json({ success: false, message: 'Error downloading file' });
  }
};

