const bcrypt = require('bcryptjs');
const db = require('../../config/database');

/* ============================================================
   🚚 GET ALL DRIVERS OF A COMPANY
   ============================================================ */
exports.getAllDrivers = async (req, res) => {
  try {
    const companyId = req.user.companyId;

    if (!companyId) {
      return res.status(403).json({ 
        success: false, 
        error: 'Company not found' 
      });
    }

    const [drivers] = await db.query(`
      SELECT 
        d.id,
        u.name AS patronim,
        u.phone AS phone_number,
        u.email AS email,
        u.address AS zone_couverture,
        d.status,
        COUNT(DISTINCT del.id) AS livraisons_effectuees,
        d.created_at
      FROM drivers d
      INNER JOIN users u ON d.user_id = u.id
      LEFT JOIN deliveries del 
        ON d.id = del.driver_id AND del.status = 'delivered'
      WHERE d.company_id = ?
      GROUP BY d.id
      ORDER BY d.created_at DESC
    `, [companyId]);

    res.json({
      success: true,
      drivers: drivers.map(d => ({
        id: d.id,
        patronim: d.patronim,
        phone_number: d.phone_number,
        email: d.email,
        status: d.status,
        livraisons_effectuees: parseInt(d.livraisons_effectuees) || 0,
        zone_couverture: d.zone_couverture || 'Non définie',
        created_at: d.created_at
      }))
    });

  } catch (error) {
    console.error('Get drivers error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch drivers' 
    });
  }
};

/* ============================================================
   🚚 GET SINGLE DRIVER
   ============================================================ */
exports.getDriver = async (req, res) => {
  try {
    const { id } = req.params;
    const companyId = req.user.companyId;

    const [drivers] = await db.query(`
      SELECT 
        d.*, 
        u.name AS patronim,
        u.email, 
        u.phone AS phone_number, 
        u.address AS zone_couverture
      FROM drivers d
      INNER JOIN users u ON d.user_id = u.id
      WHERE d.id = ? AND d.company_id = ?
    `, [id, companyId]);

    if (drivers.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Driver not found' 
      });
    }

    res.json({ success: true, driver: drivers[0] });

  } catch (error) {
    console.error('Get driver error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch driver' 
    });
  }
};

/* ============================================================
   🚚 ADD DRIVER
   ============================================================ */
exports.addDriver = async (req, res) => {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const { patronim, telephone, email, motDePasse, zoneCouverture } = req.body;
    const companyId = req.user.companyId;

    if (!companyId) {
      await connection.rollback();
      return res.status(403).json({ 
        success: false, 
        error: 'Company not found' 
      });
    }

    if (!patronim || !telephone || !email || !motDePasse) {
      await connection.rollback();
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields' 
      });
    }

    // Check if user exists
    const [existing] = await connection.query(
      'SELECT id FROM users WHERE email = ? OR phone = ?',
      [email, telephone]
    );

    if (existing.length > 0) {
      await connection.rollback();
      return res.status(400).json({ 
        success: false, 
        error: 'Email ou téléphone déjà utilisé' 
      });
    }

    const hashedPassword = await bcrypt.hash(motDePasse, 10);

    // Insert user
    const [userResult] = await connection.query(
      'INSERT INTO users (name, email, phone, password, role, address, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [patronim, email, telephone, hashedPassword, 'driver', zoneCouverture || '', 'active']
    );

    const userId = userResult.insertId;

    // Insert driver
    const [driverResult] = await connection.query(
      'INSERT INTO drivers (user_id, company_id, status) VALUES (?, ?, ?)',
      [userId, companyId, 'available']
    );

    await connection.commit();

    res.status(201).json({
      success: true,
      message: 'Driver added successfully',
      driver: {
        id: driverResult.insertId,
        userId
      }
    });

  } catch (error) {
    await connection.rollback();
    console.error('Add driver error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to add driver' 
    });

  } finally {
    connection.release();
  }
};

/* ============================================================
   🚚 UPDATE DRIVER
   ============================================================ */
exports.updateDriver = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, patronim, telephone, email, zoneCouverture } = req.body;
    const companyId = req.user.companyId;

    // Check ownership
    const [rows] = await db.query(
      'SELECT user_id FROM drivers WHERE id = ? AND company_id = ?',
      [id, companyId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Driver not found' 
      });
    }

    const userId = rows[0].user_id;

    // Update driver status
    if (status) {
      await db.query('UPDATE drivers SET status = ? WHERE id = ?', [status, id]);
    }

    // Update user fields
    const fields = [];
    const values = [];

    if (patronim) { fields.push('name = ?'); values.push(patronim); }
    if (telephone) { fields.push('phone = ?'); values.push(telephone); }
    if (email) { fields.push('email = ?'); values.push(email); }
    if (zoneCouverture) { fields.push('address = ?'); values.push(zoneCouverture); }

    if (fields.length > 0) {
      await db.query(
        `UPDATE users SET ${fields.join(', ')} WHERE id = ?`,
        [...values, userId]
      );
    }

    res.json({ success: true, message: 'Driver updated successfully' });

  } catch (error) {
    console.error('Update driver error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to update driver' 
    });
  }
};

/* ============================================================
   🚚 DELETE DRIVER
   ============================================================ */
exports.deleteDriver = async (req, res) => {
  try {
    const { id } = req.params;
    const companyId = req.user.companyId;

    const [rows] = await db.query(
      'SELECT user_id FROM drivers WHERE id = ? AND company_id = ?',
      [id, companyId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Driver not found' 
      });
    }

    const userId = rows[0].user_id;

    // Delete user → cascade deletes driver
    await db.query('DELETE FROM users WHERE id = ?', [userId]);

    res.json({ success: true, message: 'Driver deleted successfully' });

  } catch (error) {
    console.error('Delete driver error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to delete driver' 
    });
  }
};
