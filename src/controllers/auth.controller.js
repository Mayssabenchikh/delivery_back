const bcrypt = require('bcryptjs');
const db = require('../config/database');

exports.signUp = async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    const { name, email, phone, address, password } = req.body;

    // 1. Vérifier si l'email existe déjà
    const [existingUsers] = await connection.execute(
      'SELECT id FROM users WHERE email = ? OR phone = ?',
      [email, phone]
    );

    if (existingUsers.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Email or phone already registered'
      });
    }

    // 2. Hash du mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);

    // 3. Insérer le nouvel utilisateur
    const [result] = await connection.execute(
      `INSERT INTO users (name, email, phone, address, password, role, status, verified) 
       VALUES (?, ?, ?, ?, ?, 'client', 'active', 0)`,
      [name, email, phone, address, hashedPassword]
    );

    // 4. Récupérer l'utilisateur créé (sans le mot de passe)
    const [newUser] = await connection.execute(
      'SELECT id, name, email, phone, address, role, status, verified, created_at FROM users WHERE id = ?',
      [result.insertId]
    );

    // 5. Réponse succès
    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      user: newUser[0]
    });

  } catch (error) {
    console.error('Sign Up Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error. Please try again later.'
    });
  } finally {
    connection.release();
  }
};