const db = require('../config/database'); // Assure-toi que db.query est bien promisified

exports.getAllCompanies = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT id, name FROM companies');
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};
