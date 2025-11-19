const pool = require("../config/database");

exports.getComapanies = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const [comapanies] = await connection.execute("SELECT c.id, c.name, u.email, u.phone, u.address, c.logo_url, u.status FROM companies c join users u on c.user_id = u.id where u.status = 'active'");
    
    const baseUrl = process.env.SERVER_URL || 'http://localhost:3200';
    const companiesWithFullUrls = comapanies.map(company => ({
      ...company,
      logo_url: company.logo_url ? `${baseUrl}/uploads/${company.logo_url}` : null
    }));

    res.json({
      success: true,
      data: companiesWithFullUrls,
    });
  } catch (error) {
    console.error('Get Companies Error:', error);
    res.status(500).json({
      success: false,
      message: "Server error. Please try again later.",
    });
  } finally {
    connection.release();
  }
};

exports.getCompany = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { id } = req.params;
    const [company] = await connection.execute("SELECT c.id, c.name, u.email, u.phone, u.address, c.logo_url, u.status FROM companies c join users u on c.user_id = u.id where c.id = ? AND u.status = 'active'", [id]);
    
    if (company[0] && company[0].logo_url) {
      const baseUrl = process.env.SERVER_URL || 'http://localhost:3200';
      company[0].logo_url = `${baseUrl}/uploads/${company[0].logo_url}`;
    }

    res.json({
      success: true,
      data: company[0] || null,
    });
  } catch (error) {
    console.error('Get Company Error:', error);
    res.status(500).json({
      success: false,
      message: "Server error. Please try again later.",
    });
  } finally {
    connection.release();
  }
};

exports.deleteContacts = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { id } = req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "id is required",
      });
    }

    await connection.execute("DELETE FROM contact where id = ?", [id]);

    res.json({
      success: true,
      message: "Contact deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error. Please try again later.",
    });
  } finally {
    connection.release();
  }
};
