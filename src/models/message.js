const db = require('../config/database');

const Message = {
  // Créer un message
  create: async (data) => {
    const sql = `INSERT INTO messages (conversation_id, sender_id, receiver_id, text, attachment_id, status, created_at)
                 VALUES (?, ?, ?, ?, ?, 'sent', NOW())`;
    const values = [
      data.conversation_id,
      data.sender_id,
      data.receiver_id || null,
      data.text || null,
      data.attachment_id || null
    ];
    const [result] = await db.query(sql, values);
    
    // Récupérer le message créé avec les infos de l'expéditeur
    const getSql = `
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
    const [message] = await db.query(getSql, [result.insertId]);
    return message[0];
  },

  // Récupérer tous les messages d'une conversation
  getByConversation: async (conversationId, userId) => {
    const sql = `
      SELECT 
        m.*,
        u.name AS sender_name,
        u.email AS sender_email,
        a.url AS attachment_url,
        a.mime_type AS attachment_mime_type
      FROM messages m
      LEFT JOIN users u ON m.sender_id = u.id
      LEFT JOIN attachments a ON m.attachment_id = a.id
      WHERE m.conversation_id = ?
      ORDER BY m.created_at ASC
    `;
    const [results] = await db.query(sql, [conversationId]);
    
    // Marquer les messages comme "seen" si l'utilisateur les voit
    if (results && results.length > 0) {
      const updateSql = `UPDATE messages SET status = 'seen' 
                         WHERE conversation_id = ? AND sender_id != ? AND status != 'seen'`;
      await db.query(updateSql, [conversationId, userId]);
    }
    
    return results;
  },

  // Marquer les messages comme vus
  markAsSeen: async (conversationId, userId) => {
    const sql = `UPDATE messages SET status = 'seen' 
                 WHERE conversation_id = ? AND sender_id != ? AND status != 'seen'`;
    const [result] = await db.query(sql, [conversationId, userId]);
    return result;
  }
};

module.exports = Message;

