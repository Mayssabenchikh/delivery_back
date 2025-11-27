const db = require('../../config/database');

class DeliveryAll {
  // Récupérer toutes les livraisons avec pagination et filtres
  static async getAll({ page = 1, limit = 50, search }) {
    const offset = (page - 1) * limit;
    let query = `
      SELECT d.*, u.name as client_name, c.name as company_name, du.name as driver_name
      FROM deliveries d
      LEFT JOIN users u ON d.client_id = u.id
      LEFT JOIN companies c ON d.company_id = c.id
      LEFT JOIN users du ON d.driver_id = du.id
      WHERE 1=1
    `;
    const params = [];

    if (search) {
      query += ` AND (d.pickup_address LIKE ? OR d.dropoff_address LIKE ? OR d.receiver_name LIKE ? OR d.receiver_phone LIKE ?)`;
      const s = `%${search}%`;
      params.push(s, s, s, s);
    }

    query += ' ORDER BY d.created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const [rows] = await db.query(query, params);

    // Total
    let countQuery = 'SELECT COUNT(*) as total FROM deliveries WHERE 1=1';
    const countParams = [];
    if (search) {
      countQuery += ` AND (pickup_address LIKE ? OR dropoff_address LIKE ? OR receiver_name LIKE ? OR receiver_phone LIKE ?)`;
      const s = `%${search}%`;
      countParams.push(s, s, s, s);
    }

    const [countRows] = await db.query(countQuery, countParams);
    const total = countRows[0].total;

    return {
      data: rows,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  // Récupérer une livraison par ID
  static async getById(id) {
    const query = `
      SELECT 
        d.*, 
        u.name AS client_name,
        u.email AS client_email,
        u.phone AS client_phone,
        c.name AS company_name,
        du.name AS driver_name,
        du.phone AS driver_phone
      FROM deliveries d
      LEFT JOIN users u ON d.client_id = u.id
      LEFT JOIN users du ON d.driver_id = du.id
      LEFT JOIN companies c ON d.company_id = c.id
      WHERE d.id = ?;
    `;
    const [rows] = await db.query(query, [id]);
    return rows[0] || null;
  }

  // Récupérer toutes les livraisons d’un livreur avec pagination (toutes statuses)
  static async getByDriverPaginated({ driverId, page = 1, limit = 10 }) {
    const offset = (page - 1) * limit;
    const query = `
      SELECT d.*, u.name as client_name, c.name as company_name, du.name as driver_name
      FROM deliveries d
      LEFT JOIN users u ON d.client_id = u.id
      LEFT JOIN companies c ON d.company_id = c.id
      LEFT JOIN users du ON d.driver_id = du.id
      WHERE d.driver_id = ?
      ORDER BY d.created_at DESC
      LIMIT ? OFFSET ?
    `;
    const params = [driverId, limit, offset];
    const [rows] = await db.query(query, params);

    const countQuery = 'SELECT COUNT(*) as total FROM deliveries WHERE driver_id = ?';
    const [countRows] = await db.query(countQuery, [driverId]);
    const total = countRows[0].total;

    return { data: rows, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  // Récupérer toutes les livraisons d’un livreur (liste simple)
  static async getByDriver(driverId) {
    const query = `
      SELECT d.*, u.name as client_name, c.name as company_name
      FROM deliveries d
      LEFT JOIN users u ON d.client_id = u.id
      LEFT JOIN companies c ON d.company_id = c.id
      WHERE d.driver_id = ?
      ORDER BY d.created_at DESC
    `;
    const [rows] = await db.query(query, [driverId]);
    return rows;
  }
}

module.exports = DeliveryAll;
