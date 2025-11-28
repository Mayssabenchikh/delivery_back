const db = require('../../config/database');

/* ============================================================
   📦 GET ALL DELIVERIES (Company)
   ============================================================ */
exports.getAllDeliveries = async (req, res) => {
  try {
    const companyId = req.user.companyId;

    if (!companyId) {
      return res.status(403).json({ 
        success: false, 
        error: 'Company ID not found' 
      });
    }

    const [deliveries] = await db.query(
      `SELECT 
        d.id,
        d.pickup_address,
        d.dropoff_address,
        d.receiver_name,
        d.receiver_phone,
        d.weight,
        d.size,
        d.price,
        d.currency,
        d.payment_method,
        d.payment_amount,
        d.status,
        d.completed_at,
        d.created_at,
        c.name AS client,
        CONCAT('#', d.id) AS id_display,
        IFNULL(CONCAT(u_driver.name), 'Non assigné') AS livreur_assigne
      FROM deliveries d
      INNER JOIN users c ON d.client_id = c.id
      LEFT JOIN drivers dr ON d.driver_id = dr.id
      LEFT JOIN users u_driver ON dr.user_id = u_driver.id
      WHERE d.company_id = ?
      ORDER BY d.created_at DESC`,
      [companyId]
    );

    // Format data for frontend
    const formattedDeliveries = deliveries.map(d => ({
      id: d.id_display,
      client: d.client,
      adresse_livraison: d.dropoff_address,
      receiver_phone: d.receiver_phone,
      statut: d.status,
      livreur_assigne: d.livreur_assigne,
      price: parseFloat(d.price),
      created_at: d.created_at
    }));

    return res.json({
      success: true,
      deliveries: formattedDeliveries
    });
  } catch (error) {
    console.error('Get All Deliveries Error:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch deliveries' 
    });
  }
};

/* ============================================================
   📦 GET SINGLE DELIVERY
   ============================================================ */
exports.getDelivery = async (req, res) => {
  try {
    const { id } = req.params;
    const companyId = req.user.companyId;

    const [deliveries] = await db.query(
      `SELECT 
        d.*,
        c.name AS client_name,
        c.email AS client_email,
        c.phone AS client_phone,
        IFNULL(CONCAT(u_driver.name), 'Non assigné') AS driver_name
      FROM deliveries d
      INNER JOIN users c ON d.client_id = c.id
      LEFT JOIN drivers dr ON d.driver_id = dr.id
      LEFT JOIN users u_driver ON dr.user_id = u_driver.id
      WHERE d.id = ? AND d.company_id = ?`,
      [id, companyId]
    );

    if (deliveries.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Delivery not found' 
      });
    }

    return res.json({
      success: true,
      delivery: deliveries[0]
    });
  } catch (error) {
    console.error('Get Delivery Error:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch delivery' 
    });
  }
};

/* ============================================================
   📦 ADD DELIVERY
   ============================================================ */
exports.addDelivery = async (req, res) => {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const companyId = req.user.companyId;
    const {
      client_id,
      driver_id,
      pickup_address,
      dropoff_address,
      receiver_name,
      receiver_phone,
      weight,
      size,
      price,
      payment_method,
      payment_amount
    } = req.body;

    // Validation
    if (!dropoff_address || !receiver_name || !receiver_phone) {
      await connection.rollback();
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields' 
      });
    }

    // Verify client exists
    const [clients] = await connection.query(
      'SELECT id FROM users WHERE id = ? AND role = "client"',
      [client_id]
    );

    if (clients.length === 0) {
      await connection.rollback();
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid client ID' 
      });
    }

    // Insert delivery
    const [result] = await connection.query(
      `INSERT INTO deliveries (
        client_id, company_id, driver_id, pickup_address, dropoff_address,
        receiver_name, receiver_phone, weight, size, price,
        payment_method, payment_amount, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
      [
        client_id,
        companyId,
        driver_id || null,
        pickup_address,
        dropoff_address,
        receiver_name,
        receiver_phone,
        weight || 0,
        size || 'M',
        price || 0,
        payment_method || 'cash',
        payment_amount || price || 0
      ]
    );

    await connection.commit();

    return res.status(201).json({
      success: true,
      message: 'Delivery created successfully',
      deliveryId: result.insertId
    });
  } catch (error) {
    await connection.rollback();
    console.error('Add Delivery Error:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to create delivery' 
    });
  } finally {
    connection.release();
  }
};

/* ============================================================
   📦 UPDATE DELIVERY
   ============================================================ */
exports.updateDelivery = async (req, res) => {
  const connection = await db.getConnection();

  try {
    const { id } = req.params;
    const companyId = req.user.companyId;
    const updates = req.body;

    // Verify delivery belongs to company
    const [deliveries] = await connection.query(
      'SELECT id FROM deliveries WHERE id = ? AND company_id = ?',
      [id, companyId]
    );

    if (deliveries.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Delivery not found' 
      });
    }

    // Build update query
    const allowedFields = [
      'pickup_address', 'dropoff_address', 'receiver_name',
      'receiver_phone', 'weight', 'size', 'price',
      'payment_method', 'payment_amount', 'status', 'driver_id'
    ];

    const updateFields = [];
    const updateValues = [];

    Object.keys(updates).forEach(key => {
      if (allowedFields.includes(key)) {
        updateFields.push(`${key} = ?`);
        updateValues.push(updates[key]);
      }
    });

    if (updateFields.length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'No valid fields to update' 
      });
    }

    // If status is changing to delivered, set completed_at
    if (updates.status === 'delivered') {
      updateFields.push('completed_at = NOW()');
    }

    updateValues.push(id);

    await connection.query(
      `UPDATE deliveries SET ${updateFields.join(', ')} WHERE id = ?`,
      updateValues
    );

    return res.json({
      success: true,
      message: 'Delivery updated successfully'
    });
  } catch (error) {
    console.error('Update Delivery Error:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to update delivery' 
    });
  } finally {
    connection.release();
  }
};

/* ============================================================
   📦 DELETE DELIVERY
   ============================================================ */
exports.deleteDelivery = async (req, res) => {
  try {
    const { id } = req.params;
    const companyId = req.user.companyId;

    // Verify delivery belongs to company
    const [deliveries] = await db.query(
      'SELECT id FROM deliveries WHERE id = ? AND company_id = ?',
      [id, companyId]
    );

    if (deliveries.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Delivery not found' 
      });
    }

    await db.query('DELETE FROM deliveries WHERE id = ?', [id]);

    return res.json({
      success: true,
      message: 'Delivery deleted successfully'
    });
  } catch (error) {
    console.error('Delete Delivery Error:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to delete delivery' 
    });
  }
};

/* ============================================================
   📦 GET CLIENTS LIST (for dropdown)
   ============================================================ */
exports.getClients = async (req, res) => {
  try {
    const [clients] = await db.query(
      `SELECT id, name, email, phone 
       FROM users 
       WHERE role = 'client' AND status = 'active'
       ORDER BY name ASC`
    );

    return res.json({
      success: true,
      clients: clients
    });
  } catch (error) {
    console.error('Get Clients Error:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch clients' 
    });
  }
};

/* ============================================================
   🚚 GET DRIVERS LIST (for dropdown)
   ============================================================ */
exports.getDrivers = async (req, res) => {
  try {
    const companyId = req.user.companyId;

    const [drivers] = await db.query(
      `SELECT 
        d.id,
        u.name,
        u.phone,
        d.status
      FROM drivers d
      INNER JOIN users u ON d.user_id = u.id
      WHERE d.company_id = ? AND d.status != 'suspended'
      ORDER BY u.name ASC`,
      [companyId]
    );

    return res.json({
      success: true,
      drivers: drivers
    });
  } catch (error) {
    console.error('Get Drivers Error:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch drivers' 
    });
  }
};
