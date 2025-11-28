const db = require('../../config/database');

exports.getStatistics = async (req, res) => {
  try {
    const companyId = req.user.companyId;

    if (!companyId) {
      return res.status(403).json({ error: 'Company not found' });
    }

    // Get total deliveries
    const [totalResult] = await db.query(
      'SELECT COUNT(*) as total FROM deliveries WHERE company_id = ?',
      [companyId]
    );

    // Get delivered count
    const [deliveredResult] = await db.query(
      `SELECT COUNT(*) as total FROM deliveries 
       WHERE company_id = ? AND status = 'delivered'`,
      [companyId]
    );

    // Get cancelled count
    const [cancelledResult] = await db.query(
      `SELECT COUNT(*) as total FROM deliveries 
       WHERE company_id = ? AND status = 'cancelled'`,
      [companyId]
    );

    // Get active drivers
    const [driversResult] = await db.query(
      `SELECT COUNT(*) as total FROM drivers 
       WHERE company_id = ? AND status IN ('available', 'busy')`,
      [companyId]
    );

    // Get monthly stats
    const [monthlyStats] = await db.query(`
      SELECT 
        DATE_FORMAT(created_at, '%Y-%m') as month,
        COUNT(*) as total,
        SUM(CASE WHEN status = 'delivered' THEN 1 ELSE 0 END) as delivered
      FROM deliveries
      WHERE company_id = ? 
        AND created_at >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
      GROUP BY DATE_FORMAT(created_at, '%Y-%m')
      ORDER BY month
    `, [companyId]);

    // Get status distribution
    const [statusDist] = await db.query(`
      SELECT 
        status,
        COUNT(*) as count
      FROM deliveries
      WHERE company_id = ?
      GROUP BY status
    `, [companyId]);

    // Calculate percentages (mock for now)
    const lastMonthTotal = monthlyStats.length > 1 ? monthlyStats[monthlyStats.length - 2].total : 0;
    const currentMonthTotal = monthlyStats.length > 0 ? monthlyStats[monthlyStats.length - 1].total : 0;
    
    const percentageChange = lastMonthTotal > 0 
      ? Math.round(((currentMonthTotal - lastMonthTotal) / lastMonthTotal) * 100)
      : 0;

    res.json({
      success: true,
      statistics: {
        commandesTotales: totalResult[0].total,
        commandesLivrees: deliveredResult[0].total,
        commandesAnnulees: cancelledResult[0].total,
        livreursActifs: driversResult[0].total,
        percentageChangeTotales: `${percentageChange > 0 ? '+' : ''}${percentageChange}%`,
        percentageChangeLivrees: '+8%',
        percentageChangeAnnulees: '+3%',
        percentageChangeLivreurs: '+2%',
        monthlyData: monthlyStats,
        statusDistribution: statusDist
      }
    });
  } catch (error) {
    console.error('Get statistics error:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
};

exports.getPerformanceData = async (req, res) => {
  try {
    const companyId = req.user.companyId;

    // Average deliveries per driver
    const [avgDeliveries] = await db.query(`
      SELECT AVG(delivery_count) as average
      FROM (
        SELECT COUNT(*) as delivery_count
        FROM deliveries
        WHERE company_id = ? AND driver_id IS NOT NULL
        GROUP BY driver_id
      ) as driver_deliveries
    `, [companyId]);

    // Average delivery time (mock data)
    const avgTime = '32 min';

    // Customer satisfaction (mock)
    const satisfaction = '94.5%';

    // Total revenue
    const [revenueResult] = await db.query(`
      SELECT SUM(price) as total
      FROM deliveries
      WHERE company_id = ? AND status = 'delivered'
    `, [companyId]);

    // Active zones
    const [zonesResult] = await db.query(`
      SELECT DISTINCT dropoff_address
      FROM deliveries
      WHERE company_id = ? AND status != 'cancelled'
      LIMIT 5
    `, [companyId]);

    const zones = zonesResult.map(z => z.dropoff_address).join(', ');

    res.json({
      success: true,
      performance: {
        livraisonsMoyennes: parseFloat(avgDeliveries[0].average || 0).toFixed(1),
        tempsMoyen: avgTime,
        tauxSatisfaction: satisfaction,
        revenusTotaux: `${parseFloat(revenueResult[0].total || 0).toFixed(2)} dt`,
        zonesActives: zones || 'Aucune zone'
      }
    });
  } catch (error) {
    console.error('Get performance error:', error);
    res.status(500).json({ error: 'Failed to fetch performance data' });
  }
};
