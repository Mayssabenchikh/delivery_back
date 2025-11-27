const Delivery = require('./deliveries'); 
const db = require('../../config/database');

// CRUD
exports.getAllDeliveries = async (req, res) => {
  try {
    const result = await Delivery.getAll(req.query);
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

exports.getDeliveryById = async (req, res) => {
  try {
    const delivery = await Delivery.getById(req.params.id);
    if (!delivery) return res.status(404).json({ error: 'Livraison non trouvée' });
    res.json(delivery);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

exports.createDelivery = async (req, res) => {
  try {
    const delivery = await Delivery.create(req.body);
    res.status(201).json(delivery);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

exports.updateDelivery = async (req, res) => {
  try {
    const delivery = await Delivery.update(req.params.id, req.body);
    res.json(delivery);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

exports.deleteDelivery = async (req, res) => {
  try {
    const success = await Delivery.delete(req.params.id);
    res.json({ success });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

exports.markDelivered = async (req, res) => {
  try {
    const deliveryId = req.params.id;
    // Mettre à jour le status et completed_at en même temps
    const query = 'UPDATE deliveries SET status = ?, completed_at = NOW(), updated_at = NOW() WHERE id = ?';
    const status = 'delivered';

    const [result] = await db.query(query, [status, deliveryId]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Delivery not found' });
    }
    
    res.json({ message: 'Delivery marked as delivered', deliveryId, status });
  } catch (err) {
    console.error('Erreur lors de la mise à jour du status:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.assignDriver = async (req, res) => {
  try {
    const delivery = await Delivery.assignDriver(req.params.id, req.body.driverId);
    res.json(delivery);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// 🔥 Récupérer les livraisons du livreur connecté
exports.getDeliveriesByDriver = async (req, res) => {
  try {
    console.log('🎯 [CONTROLEUR] getDeliveriesByDriver called');
    const userId = req.user.id;
    const { status, page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    const [driverRows] = await db.query('SELECT id FROM drivers WHERE user_id = ?', [userId]);
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

    // S'assurer que payment_amount est inclus dans la requête
    let query = `
      SELECT d.id, d.client_id, d.company_id, d.driver_id,
             d.pickup_address, d.dropoff_address, d.receiver_name, d.receiver_phone,
             d.weight, d.size, d.price, d.payment_amount, d.currency, d.payment_method,
             d.status, d.completed_at, d.created_at, d.updated_at,
             u.name AS client_name,
             c.name AS company_name
      FROM deliveries d
      LEFT JOIN users u ON d.client_id = u.id
      LEFT JOIN companies c ON d.company_id = c.id
      WHERE d.driver_id = ?
    `;
    const params = [driverId];

    if (status && status !== 'all') {
      query += ` AND d.status = ?`;
      params.push(status);
    }

    query += ` ORDER BY d.created_at DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), parseInt(offset));

    const [deliveries] = await db.query(query, params);
    
    // Log pour déboguer
    if (deliveries.length > 0) {
      console.log('📊 [getDeliveriesByDriver] Sample delivery:', {
        id: deliveries[0].id,
        price: deliveries[0].price,
        payment_amount: deliveries[0].payment_amount,
        status: deliveries[0].status
      });
    }

    let countQuery = `SELECT COUNT(*) AS total FROM deliveries WHERE driver_id = ?`;
    const countParams = [driverId];
    if (status && status !== 'all') {
      countQuery += ` AND status = ?`;
      countParams.push(status);
    }

    const [countResult] = await db.query(countQuery, countParams);
    const total = countResult[0].total;

    return res.json({
      data: deliveries,
      total: total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / limit)
    });

  } catch (error) {
    console.error('💥 [CONTROLEUR] Error in getDeliveriesByDriver:', error);
    res.status(500).json({ error: 'Erreur serveur', details: error.message });
  }
};

// 🔥 Marquer une livraison comme "returned"
exports.markReturned = (req, res) => {
  const deliveryId = req.params.id;
  const query = 'UPDATE deliveries SET status = ? WHERE id = ?';
  const status = 'returned';

  db.execute(query, [status, deliveryId], (err, result) => {
    if (err) {
      console.error('Erreur lors de la mise à jour du status:', err);
      return res.status(500).json({ message: 'Server error', error: err.message });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Delivery not found' });
    }
    res.json({ message: 'Delivery marked as returned', deliveryId, status });
  });
};
