const db = require('../config/database'); // pool MySQL
const bcrypt = require('bcryptjs');

// Utility: fetch deliverer by ID
exports.getLivreurById = async (userId) => {
  const [rows] = await db.execute(
    'SELECT id, name, email, phone, address FROM users WHERE id = ? AND role = ?',
    [userId, 'driver']
  );
  return rows[0] || null;
};

// GET /livreur
exports.getLivreurProfile = async (req, res) => {
  try {
    const user = await exports.getLivreurById(req.user.id);
    if (!user) return res.status(404).json({ message: 'Livreur non trouvé' });
    // renvoyer l'objet complet
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// PUT /livreur
exports.updateLivreur = async (userId, payload) => {
  const { name, password, phone, address } = payload;
  const updates = [];
  const values = [];

  if (name !== undefined) {
    updates.push('name = ?');
    values.push(name);
  }

  if (password) {
    const hashed = await bcrypt.hash(password, 10);
    updates.push('password = ?');
    values.push(hashed);
  }

  if (phone !== undefined) {
    updates.push('phone = ?');
    values.push(phone);
  }

  if (address !== undefined) {
    updates.push('address = ?');
    values.push(address);
  }

  if (updates.length === 0) return null;

  values.push(userId);

  const sql = `UPDATE users SET ${updates.join(', ')} WHERE id = ? AND role = 'driver'`;
  await db.execute(sql, values);

  // Récupérer l'utilisateur mis à jour
  const [rows] = await db.execute(
    'SELECT id, name, email, phone, address FROM users WHERE id = ? AND role = ?',
    [userId, 'driver']
  );
  return rows[0] || null;
};

// PUT handler
exports.updateLivreurProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const updated = await exports.updateLivreur(userId, req.body);
    if (!updated) return res.status(400).json({ message: 'Aucune donnée à mettre à jour' });
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// DELETE
exports.deleteLivreur = async (userId) => {
  await db.execute('DELETE FROM users WHERE id = ? AND role = ?', [userId, 'driver']);
};

exports.deleteLivreurProfile = async (req, res) => {
  try {
    await exports.deleteLivreur(req.user.id);
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};
