const pool = require('../config/database');

exports.getDeliveryStats = async (req, res) => {
  const connection = await pool.getConnection();

  try {
    // Optional filtering by various owner identifiers to allow per-user KPIs
    // Accepts: companyId, clientId, driverId OR userId+role (role can be 'company'|'client'|'driver')
    const { companyId, clientId, driverId, userId, role } = req.query;
    let whereClause = '';
    const params = [];

    // If userId + role provided and role is company, resolve companyId from companies table
    let resolvedCompanyId = companyId;
    if (!resolvedCompanyId && userId && role === 'company') {
      const [companies] = await connection.execute('SELECT id FROM companies WHERE user_id = ?', [userId]);
      if (companies && companies.length > 0) {
        resolvedCompanyId = companies[0].id;
      }
    }

    if (resolvedCompanyId) {
      whereClause = ' WHERE company_id = ?';
      params.push(resolvedCompanyId);
    } else if (clientId) {
      whereClause = ' WHERE client_id = ?';
      params.push(clientId);
    } else if (driverId) {
      whereClause = ' WHERE driver_id = ?';
      params.push(driverId);
    }

    const [rows] = await connection.execute(
      `
      SELECT
        COUNT(*) AS total,
        CAST(SUM(CASE WHEN status = 'in_transit' THEN 1 ELSE 0 END) AS UNSIGNED) AS in_transit,
        CAST(SUM(CASE WHEN status = 'delivered' THEN 1 ELSE 0 END) AS UNSIGNED) AS delivered
      FROM deliveries
      ${whereClause}
    `,
      params
    );

    const stats = rows[0] || { total: 0, in_transit: 0, delivered: 0 };

    // Ensure numeric types in JSON (some MySQL drivers may return strings)
    stats.total = Number(stats.total) || 0;
    stats.in_transit = Number(stats.in_transit) || 0;
    stats.delivered = Number(stats.delivered) || 0;

    return res.json({ success: true, stats });
  } catch (error) {
    console.error('KPI Error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  } finally {
    connection.release();
  }
};
