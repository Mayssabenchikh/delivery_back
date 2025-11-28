const db = require('../../config/database');

/* ============================================================
   🔥 GET COMPANY PROFILE
   ============================================================ */
exports.getCompanyProfile = async (req, res) => {
  try {
    const { company_id } = req.query;

    if (!company_id) {
      return res.status(400).json({ error: 'Company ID is required' });
    }

    const [companies] = await db.query(
      'SELECT c.*, u.name as contact_name, u.email, u.phone, u.address FROM companies c LEFT JOIN users u ON c.user_id = u.id WHERE c.id = ?',
      [company_id]
    );

    if (companies.length === 0) {
      return res.status(404).json({ error: 'Company not found' });
    }

    return res.json({
      success: true,
      data: companies[0]
    });
  } catch (error) {
    console.error('Get Company Profile Error:', error);
    return res.status(500).json({ error: 'Failed to fetch company profile' });
  }
};

/* ============================================================
   🔥 UPDATE COMPANY PROFILE
   ============================================================ */
exports.updateCompanyProfile = async (req, res) => {
  try {
    const { company_id } = req.query;
    const { name, tax_id, legal_status, contact_name, phone, address } = req.body;

    if (!company_id) {
      return res.status(400).json({ error: 'Company ID is required' });
    }

    // Verify company exists
    const [companies] = await db.query(
      'SELECT user_id FROM companies WHERE id = ?',
      [company_id]
    );

    if (companies.length === 0) {
      return res.status(404).json({ error: 'Company not found' });
    }

    const userId = companies[0].user_id;

    // Start transaction
    const connection = await db.getConnection();
    await connection.beginTransaction();

    try {
      // Update companies table
      if (name || tax_id || legal_status) {
        await connection.query(
          'UPDATE companies SET name = COALESCE(?, name), tax_id = COALESCE(?, tax_id), legal_status = COALESCE(?, legal_status) WHERE id = ?',
          [name || null, tax_id || null, legal_status || null, company_id]
        );
      }

      // Update users table (contact info)
      if (contact_name || phone || address) {
        await connection.query(
          'UPDATE users SET name = COALESCE(?, name), phone = COALESCE(?, phone), address = COALESCE(?, address) WHERE id = ?',
          [contact_name || null, phone || null, address || null, userId]
        );
      }

      await connection.commit();

      // Fetch updated data
      const [updatedCompany] = await db.query(
        'SELECT c.*, u.name as contact_name, u.email, u.phone, u.address FROM companies c LEFT JOIN users u ON c.user_id = u.id WHERE c.id = ?',
        [company_id]
      );

      return res.json({
        success: true,
        message: 'Company profile updated successfully',
        data: updatedCompany[0]
      });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Update Company Profile Error:', error);
    return res.status(500).json({ error: 'Failed to update company profile' });
  }
};

/* ============================================================
   🔥 GET COMPANY INFO (for dashboard)
   ============================================================ */
exports.getCompanyInfo = async (req, res) => {
  try {
    const { company_id } = req.query;

    if (!company_id) {
      return res.status(400).json({ error: 'Company ID is required' });
    }

    const [companies] = await db.query(
      'SELECT id, user_id, name, logo_url, tax_id, legal_status, created_at FROM companies WHERE id = ?',
      [company_id]
    );

    if (companies.length === 0) {
      return res.status(404).json({ error: 'Company not found' });
    }

    return res.json({
      success: true,
      data: companies[0]
    });
  } catch (error) {
    console.error('Get Company Info Error:', error);
    return res.status(500).json({ error: 'Failed to fetch company info' });
  }
};
