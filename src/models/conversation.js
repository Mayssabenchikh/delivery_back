const db = require('../config/database');

const Conversation = {
  // Créer ou récupérer une conversation pour une delivery
  findOrCreateByDelivery: async (deliveryId, clientId, driverId) => {
    // Vérifier si une conversation existe déjà pour cette delivery
    const checkSql = `SELECT * FROM conversations WHERE delivery_id = ? AND type = 'delivery_thread'`;
    const [existing] = await db.query(checkSql, [deliveryId]);
    
    if (existing && existing.length > 0) {
      return existing[0];
    }
    
    // Créer une nouvelle conversation
    const insertSql = `INSERT INTO conversations (type, subject, delivery_id, created_at) 
                       VALUES ('delivery_thread', CONCAT('Delivery #', ?), ?, NOW())`;
    const [result] = await db.query(insertSql, [deliveryId, deliveryId]);
    
    // Récupérer la conversation créée
    const getSql = `SELECT * FROM conversations WHERE id = ?`;
    const [newConv] = await db.query(getSql, [result.insertId]);
    return newConv[0];
  },

  // Récupérer toutes les conversations d'un utilisateur (client ou driver)
  getUserConversations: async (userId, role) => {
    let sql = `
      SELECT 
        c.id,
        c.type,
        c.subject,
        c.delivery_id,
        c.created_at,
        d.id AS delivery_id,
        d.status AS delivery_status,
        d.pickup_address,
        d.dropoff_address,
        CASE 
          WHEN ? = 'client' THEN u_driver.name
          ELSE u_client.name
        END AS other_user_name,
        CASE 
          WHEN ? = 'client' THEN u_driver.id
          ELSE u_client.id
        END AS other_user_id,
        (SELECT COUNT(*) FROM messages m WHERE m.conversation_id = c.id AND m.status = 'sent' AND m.sender_id != ?) AS unread_count,
        (SELECT m.text FROM messages m WHERE m.conversation_id = c.id ORDER BY m.created_at DESC LIMIT 1) AS last_message_text,
        (SELECT m.created_at FROM messages m WHERE m.conversation_id = c.id ORDER BY m.created_at DESC LIMIT 1) AS last_message_time
      FROM conversations c
      INNER JOIN deliveries d ON c.delivery_id = d.id
      LEFT JOIN drivers dr ON d.driver_id = dr.id
      LEFT JOIN users u_driver ON dr.user_id = u_driver.id
      LEFT JOIN users u_client ON d.client_id = u_client.id
      WHERE c.type = 'delivery_thread'
    `;
    
    if (role === 'client') {
      sql += ` AND d.client_id = ?`;
    } else if (role === 'driver') {
      sql += ` AND d.driver_id = (SELECT id FROM drivers WHERE user_id = ?)`;
    }
    
    sql += ` ORDER BY COALESCE(last_message_time, c.created_at) DESC, c.created_at DESC`;
    
    const params = [role, role, userId];
    if (role === 'client') {
      params.push(userId);
    } else if (role === 'driver') {
      params.push(userId);
    }
    
    const [results] = await db.query(sql, params);
    return results;
  },

  // Récupérer une conversation par ID avec vérification d'accès
  getById: async (conversationId, userId, role) => {
    let sql = `
      SELECT 
        c.*,
        d.id AS delivery_id,
        d.client_id,
        d.driver_id,
        d.status AS delivery_status,
        u_client.name AS client_name,
        u_client.is_online AS client_is_online,
        u_client.id AS client_user_id,
        u_driver.name AS driver_name,
        u_driver.is_online AS driver_is_online,
        u_driver.id AS driver_user_id,
        dr.id AS driver_table_id
      FROM conversations c
      INNER JOIN deliveries d ON c.delivery_id = d.id
      LEFT JOIN users u_client ON d.client_id = u_client.id
      LEFT JOIN drivers dr ON d.driver_id = dr.id
      LEFT JOIN users u_driver ON dr.user_id = u_driver.id
      WHERE c.id = ?
    `;
    
    const [results] = await db.query(sql, [conversationId]);
    
    if (!results || results.length === 0) {
      return null;
    }
    
    const conv = results[0];
    
    // Vérifier l'accès
    if (role === 'client' && conv.client_id !== userId) {
      return null;
    }
    if (role === 'driver' && conv.driver_table_id) {
      const driverCheckSql = `SELECT user_id FROM drivers WHERE id = ?`;
      const [driverCheck] = await db.query(driverCheckSql, [conv.driver_table_id]);
      if (!driverCheck || driverCheck.length === 0 || driverCheck[0].user_id !== userId) {
        return null;
      }
    }
    
    return conv;
  }
};

module.exports = Conversation;

