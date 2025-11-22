const pool = require("../config/database");

exports.getComapanies = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const [comapanies] = await connection.execute(
      "SELECT c.id, c.name, u.email, u.phone, u.address, c.logo_url, u.status FROM companies c JOIN users u ON c.user_id = u.id WHERE u.status = 'active'"
    );
    res.json({
      success: true,
      data: comapanies,
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
