const jwt = require('jsonwebtoken');
const Message = require('../models/message');
const Conversation = require('../models/conversation');
const db = require('../config/database');

let io;

const initializeSocket = (server) => {
  io = require('socket.io')(server, {
    cors: {
      origin: 'http://localhost:4200',
      credentials: true
    }
  });

  // Middleware d'authentification Socket.io
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];
      
      if (!token) {
        return next(new Error('Authentication error: No token provided'));
      }

      jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
          return next(new Error('Authentication error: Invalid token'));
        }
        socket.userId = decoded.id;
        socket.userRole = decoded.role;
        next();
      });
    } catch (error) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', async (socket) => {
    console.log(`✅ User ${socket.userId} (${socket.userRole}) connected, socket ID: ${socket.id}`);

    // Mettre à jour le statut en ligne dans la base de données
    try {
      await db.query('UPDATE users SET is_online = 1, last_seen = NOW() WHERE id = ?', [socket.userId]);
      console.log(`📊 Updated is_online = 1 for user ${socket.userId}`);
      
      // Notifier les autres utilisateurs dans les conversations actives
      const conversationsSql = `
        SELECT DISTINCT c.id, 
          CASE 
            WHEN d.client_id = ? THEN dr.user_id
            ELSE d.client_id
          END AS other_user_id
        FROM conversations c
        INNER JOIN deliveries d ON c.delivery_id = d.id
        LEFT JOIN drivers dr ON d.driver_id = dr.id
        WHERE (d.client_id = ? OR dr.user_id = ?)
      `;
      const [conversations] = await db.query(conversationsSql, [socket.userId, socket.userId, socket.userId]);
      
      console.log(`📋 Found ${conversations.length} conversations for user ${socket.userId}`);
      
      conversations.forEach(conv => {
        if (conv.other_user_id) {
          console.log(`📤 Notifying user ${conv.other_user_id} that user ${socket.userId} is online`);
          io.to(`user_${conv.other_user_id}`).emit('user_online_status', {
            user_id: socket.userId,
            is_online: true
          });
        }
      });
    } catch (error) {
      console.error('❌ Error updating online status:', error);
    }

    // Rejoindre la room de l'utilisateur pour recevoir ses messages
    socket.join(`user_${socket.userId}`);
    console.log(`🏠 User ${socket.userId} joined room: user_${socket.userId}`);

    // Rejoindre une conversation spécifique
    socket.on('join_conversation', async (conversationId) => {
      try {
        console.log(`🔄 User ${socket.userId} attempting to join conversation ${conversationId}`);
        // Vérifier l'accès à la conversation
        const conversation = await Conversation.getById(conversationId, socket.userId, socket.userRole);
        if (conversation) {
          socket.join(`conversation_${conversationId}`);
          console.log(`✅ User ${socket.userId} joined conversation ${conversationId} (room: conversation_${conversationId})`);
          
          // Marquer les messages comme vus
          await Message.markAsSeen(conversationId, socket.userId);
          
          // Notifier l'autre utilisateur que vous êtes en ligne
          let otherUserId = null;
          if (socket.userRole === 'client') {
            otherUserId = conversation.driver_user_id;
          } else if (socket.userRole === 'driver') {
            otherUserId = conversation.client_user_id || conversation.client_id;
          }
          
          if (otherUserId) {
            console.log(`👤 Other user ID for conversation ${conversationId}: ${otherUserId}`);
            // Vérifier le statut en ligne de l'autre utilisateur et l'envoyer
            const [otherUser] = await db.query('SELECT is_online FROM users WHERE id = ?', [otherUserId]);
            if (otherUser && otherUser.length > 0) {
              const isOnline = otherUser[0].is_online === 1 || otherUser[0].is_online === true;
              console.log(`📊 User ${otherUserId} is_online status in DB:`, isOnline);
              socket.emit('user_online_status', {
                user_id: otherUserId,
                is_online: isOnline
              });
              console.log(`📤 Sent user_online_status to socket for user ${otherUserId}:`, isOnline);
            } else {
              console.log(`⚠️ User ${otherUserId} not found in database`);
            }
            
            // Notifier l'autre utilisateur que vous êtes en ligne
            console.log(`📤 Broadcasting to user_${otherUserId} that user ${socket.userId} is online`);
            io.to(`user_${otherUserId}`).emit('user_online_status', {
              user_id: socket.userId,
              is_online: true
            });
          } else {
            console.log(`⚠️ No other user ID found for conversation ${conversationId}`);
          }
        } else {
          console.log(`❌ User ${socket.userId} denied access to conversation ${conversationId}`);
        }
      } catch (error) {
        console.error('❌ Error joining conversation:', error);
      }
    });

    // Quitter une conversation
    socket.on('leave_conversation', (conversationId) => {
      socket.leave(`conversation_${conversationId}`);
      console.log(`User ${socket.userId} left conversation ${conversationId}`);
    });

    // Envoyer un message
    socket.on('send_message', async (data) => {
      try {
        const { conversation_id, text, attachment_url, attachment_mime_type } = data;

        if (!conversation_id) {
          socket.emit('error', { message: 'conversation_id is required' });
          return;
        }

        // Vérifier l'accès à la conversation
        const conversation = await Conversation.getById(conversation_id, socket.userId, socket.userRole);
        if (!conversation) {
          socket.emit('error', { message: 'Conversation not found or access denied' });
          return;
        }

        // Déterminer le receiver_id
        let receiverId = null;
        let attachmentId = null;

        if (attachment_url) {
          // Si un attachment_url est fourni, créer l'attachment
          const Attachment = require('../models/attachment');
          const attachment = await Attachment.create({
            sent_by: 'message',
            entity_id: 0,
            url: attachment_url,
            mime_type: attachment_mime_type || null
          });
          attachmentId = attachment.id;
        }

        if (socket.userRole === 'client') {
          const driverSql = `SELECT user_id FROM drivers WHERE id = ?`;
          const [drivers] = await db.query(driverSql, [conversation.driver_table_id]);
          if (drivers && drivers.length > 0) {
            receiverId = drivers[0].user_id;
          }
        } else if (socket.userRole === 'driver') {
          receiverId = conversation.client_id;
        }

        // Créer le message
        const message = await Message.create({
          conversation_id,
          sender_id: socket.userId,
          receiver_id: receiverId,
          text: text || null,
          attachment_id: attachmentId
        });

        // Mettre à jour l'entity_id de l'attachment si présent
        if (attachmentId) {
          await db.query('UPDATE attachments SET entity_id = ? WHERE id = ?', [message.id, attachmentId]);
        }

        // Récupérer le message complet avec les infos de l'expéditeur
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

        // Envoyer le message à tous les participants de la conversation
        console.log(`Emitting new_message via socket to conversation_${conversation_id}`, fullMessage);
        io.to(`conversation_${conversation_id}`).emit('new_message', fullMessage);

        // Notifier le receiver s'il n'est pas dans la conversation
        if (receiverId) {
          console.log(`Emitting new_message_notification to user_${receiverId}`);
          io.to(`user_${receiverId}`).emit('new_message_notification', {
            conversation_id,
            message: fullMessage
          });
        }

        // Confirmer l'envoi à l'expéditeur
        socket.emit('message_sent', fullMessage);
      } catch (error) {
        console.error('Error sending message via socket:', error);
        socket.emit('error', { message: error.message });
      }
    });

    // Marquer les messages comme vus
    socket.on('mark_as_seen', async (conversationId) => {
      try {
        await Message.markAsSeen(conversationId, socket.userId);
        io.to(`conversation_${conversationId}`).emit('messages_seen', {
          conversation_id: conversationId,
          user_id: socket.userId
        });
      } catch (error) {
        console.error('Error marking messages as seen:', error);
      }
    });

    socket.on('disconnect', async () => {
      console.log(`User ${socket.userId} disconnected`);
      
      // Mettre à jour le statut hors ligne dans la base de données
      try {
        await db.query('UPDATE users SET is_online = 0, last_seen = NOW() WHERE id = ?', [socket.userId]);
        
        // Notifier les autres utilisateurs dans les conversations actives
        const conversationsSql = `
          SELECT DISTINCT c.id, 
            CASE 
              WHEN d.client_id = ? THEN dr.user_id
              ELSE d.client_id
            END AS other_user_id
          FROM conversations c
          INNER JOIN deliveries d ON c.delivery_id = d.id
          LEFT JOIN drivers dr ON d.driver_id = dr.id
          WHERE (d.client_id = ? OR dr.user_id = ?)
        `;
        const [conversations] = await db.query(conversationsSql, [socket.userId, socket.userId, socket.userId]);
        
        conversations.forEach(conv => {
          if (conv.other_user_id) {
            io.to(`user_${conv.other_user_id}`).emit('user_online_status', {
              user_id: socket.userId,
              is_online: false
            });
          }
        });
      } catch (error) {
        console.error('Error updating offline status:', error);
      }
    });
  });

  return io;
};

const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized');
  }
  return io;
};

module.exports = { initializeSocket, getIO };

