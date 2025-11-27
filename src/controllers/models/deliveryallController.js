const Delivery = require('./deliveries'); 
const db = require('../../config/database');

// 🔥 ROUTE : Récupérer toutes les livraisons du livreur connecté
exports.getAllDeliveriesByDriver = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    // 1. Trouver le driver_id
    const [driverRows] = await db.query(
      'SELECT id FROM drivers WHERE user_id = ?',
      [userId]
    );

    if (driverRows.length === 0) {
      return res.json({
        data: [],
        total: 0,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: 0,
        message: 'Profil driver non configuré'
      });
    }

    const driverId = driverRows[0].id;

    // 2. Récupérer toutes les livraisons
    const query = `
      SELECT d.*, 
             u.name AS client_name,
             c.name AS company_name
      FROM deliveries d
      LEFT JOIN users u ON d.client_id = u.id
      LEFT JOIN companies c ON d.company_id = c.id
      WHERE d.driver_id = ?
      ORDER BY d.created_at DESC
      LIMIT ? OFFSET ?
    `;
    const params = [driverId, parseInt(limit), parseInt(offset)];
    const [deliveries] = await db.query(query, params);

    // 3. Compter le total
    const countQuery = `SELECT COUNT(*) AS total FROM deliveries WHERE driver_id = ?`;
    const [countResult] = await db.query(countQuery, [driverId]);
    const total = countResult[0].total;

    // Réponse
    return res.json({
      data: deliveries,
      total: total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / limit)
    });

  } catch (error) {
    res.status(500).json({ 
      error: 'Erreur serveur',
      details: error.message 
    });
  }
  exports.getDriverKPI = async (req, res) => {
  try {
    const userId = req.user.id;

    // 1. Trouver le driver associé
    const [driverRows] = await db.query(
      'SELECT id FROM drivers WHERE user_id = ?',
      [userId]
    );
    if (driverRows.length === 0) {
      return res.status(404).json({ error: 'Driver not found' });
    }
    const driverId = driverRows[0].id;

    // ---------------------------
    // 2. Total deliveries (all)
    // ---------------------------
    const [[totalRes]] = await db.query(
      `SELECT COUNT(*) AS total FROM deliveries WHERE driver_id = ?`,
      [driverId]
    );

    // ---------------------------------
    // 3. Total deliveries today
    // ---------------------------------
    const [[todayRes]] = await db.query(
      `SELECT COUNT(*) AS total_today 
       FROM deliveries 
       WHERE driver_id = ? 
       AND DATE(updated_at) = CURDATE()`,
      [driverId]
    );

    // ---------------------------------
    // 4. Earnings per month
    // ---------------------------------
    const [earningsRows] = await db.query(
      `SELECT 
         DATE_FORMAT(updated_at, '%Y-%m') AS month,
         SUM(payment_amount - price) AS earnings
       FROM deliveries
       WHERE driver_id = ?
       AND status = 'delivered'
       GROUP BY DATE_FORMAT(updated_at, '%Y-%m')
       ORDER BY month DESC`,
      [driverId]
    );

    return res.json({
      total_deliveries: totalRes.total,
      total_today: todayRes.total_today,
      earnings_per_month: earningsRows
    });

  } catch (err) {
    console.error('💥 KPI error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

};
