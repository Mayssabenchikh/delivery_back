const db = require('../config/database');

const Attachment = {
  create: async (data) => {
    // Vérifier si la colonne original_filename existe
    let sql, values;
    try {
      // Essayer d'insérer avec original_filename
      sql = `INSERT INTO attachments (sent_by, entity_id, url, mime_type, original_filename, created_at)
             VALUES (?, ?, ?, ?, ?, NOW())`;
      values = [
        data.sent_by || 'message',
        data.entity_id,
        data.url,
        data.mime_type || null,
        data.original_filename || null
      ];
      const [result] = await db.query(sql, values);
      return { id: result.insertId, ...data };
    } catch (err) {
      // Si la colonne n'existe pas, utiliser l'ancienne requête
      if (err.code === 'ER_BAD_FIELD_ERROR') {
        sql = `INSERT INTO attachments (sent_by, entity_id, url, mime_type, created_at)
               VALUES (?, ?, ?, ?, NOW())`;
        values = [
          data.sent_by || 'message',
          data.entity_id,
          data.url,
          data.mime_type || null
        ];
        const [result] = await db.query(sql, values);
        return { id: result.insertId, ...data };
      }
      throw err;
    }
  },

  getByMessageId: async (messageId) => {
    const sql = `SELECT * FROM attachments WHERE entity_id = ? AND sent_by = 'message'`;
    const [results] = await db.query(sql, [messageId]);
    return results[0] || null;
  },

  getById: async (id) => {
    const sql = `SELECT * FROM attachments WHERE id = ?`;
    const [results] = await db.query(sql, [id]);
    return results[0] || null;
  }
};

module.exports = Attachment;

