const db = require('../../config/database');

class Delivery {
  // Récupérer toutes les livraisons avec pagination et filtres (renommée pour éviter conflit)
  static async getAll({ status, page = 1, limit = 50, search }) {
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

    if (status && status !== 'all') {
      query += ' AND d.status = ?';
      params.push(status);
    }

    if (search) {
      query += ` AND (d.pickup_address LIKE ? OR d.dropoff_address LIKE ? OR d.receiver_name LIKE ? OR d.receiver_phone LIKE ?)`;
      const s = `%${search}%`;
      params.push(s, s, s, s);
    }

    query += ' ORDER BY d.created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const [rows] = await db.query(query, params);

    // Total
    const countQuery = 'SELECT COUNT(*) as total FROM deliveries WHERE 1=1' +
      (status && status !== 'all' ? ' AND status = ?' : '') +
      (search ? ' AND (pickup_address LIKE ? OR dropoff_address LIKE ? OR receiver_name LIKE ? OR receiver_phone LIKE ?)' : '');

    const countParams = [];
    if (status && status !== 'all') countParams.push(status);
    if (search) {
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

  // Créer, update, delete ... (garde tes méthodes existantes ici)

  // Récupérer les livraisons par livreur (paginated) - renommée getByDriverPaginated
  static async getByDriverPaginated({ driverId, page = 1, limit = 10, status }) {
    const offset = (page - 1) * limit;
    let query = `
      SELECT d.*, u.name as client_name, c.name as company_name, du.name as driver_name
      FROM deliveries d
      LEFT JOIN users u ON d.client_id = u.id
      LEFT JOIN companies c ON d.company_id = c.id
      LEFT JOIN users du ON d.driver_id = du.id
      WHERE d.driver_id = ?
    `;
    const params = [driverId];

    if (status && status !== 'all') {
      query += ' AND d.status = ?';
      params.push(status);
    }

    query += ' ORDER BY d.created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const [rows] = await db.query(query, params);

    // Total
    const countQuery = 'SELECT COUNT(*) as total FROM deliveries WHERE driver_id = ?' +
      (status && status !== 'all' ? ' AND status = ?' : '');
    const countParams = status && status !== 'all' ? [driverId, status] : [driverId];
    const [countRows] = await db.query(countQuery, countParams);
    const total = countRows[0].total;

    return { data: rows, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  // Récupérer les livraisons d'un livreur par son ID (simple list)
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

module.exports = Delivery;
