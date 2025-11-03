const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
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
        message: 'Email or phone already registered',
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

    // 4. Récupérer l'utilisateur créé
    const [newUser] = await connection.execute(
      'SELECT id, name, email, phone, address, role, status, verified, created_at FROM users WHERE id = ?',
      [result.insertId]
    );

    // 5. Réponse succès
    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      user: newUser[0],
    });
  } catch (error) {
    console.error('Sign Up Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error. Please try again later.',
    });
  } finally {
    connection.release();
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;
  console.log('[LOGIN] body:', req.body);

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password required' });
  }

  try {
    const [results] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);

    if (!results || results.length === 0) {
      console.log('[LOGIN] User not found for email:', email);
      return res.status(400).json({ message: 'User not found' });
    }

    const user = results[0];

    if (!user.password) {
      console.error('[LOGIN] Missing password in DB for user id', user.id);
      return res.status(500).json({ message: 'Server error: missing password in DB' });
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      console.log('[LOGIN] Incorrect password for', email);
      return res.status(400).json({ message: 'Incorrect password' });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '12h' }
    );

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    console.error('[LOGIN] Error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
