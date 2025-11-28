const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/database');
const sendEmail = require('./models/sendEmail');

exports.signUp = async (req, res) => {
  const connection = await pool.getConnection();

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

  const connection = await pool.getConnection();

  try {
    const [results] = await connection.execute('SELECT * FROM users WHERE email = ?', [email]);

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

    // Si l'utilisateur est une company, récupérer le companyId
    let companyId = null;
    if (user.role === 'company') {
      const [companies] = await connection.execute(
        'SELECT id FROM companies WHERE user_id = ?',
        [user.id]
      );
      if (companies.length > 0) {
        companyId = companies[0].id;
      }
    }

    // Créer le payload du token avec companyId si disponible
    const tokenPayload = { 
      id: user.id, 
      role: user.role, 
      email: user.email 
    };
    if (companyId) {
      tokenPayload.companyId = companyId;
    }

    const token = jwt.sign(
      tokenPayload,
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
        phone: user.phone,
        address: user.address,
        companyId: companyId,
        createdAt: user.created_at
      },
    });
  } catch (err) {
    console.error('[LOGIN] Error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  } finally {
    connection.release();
  }
};

exports.forgotPassword = async (req, res) => {
  const { email } = req.body;
  const connection = await pool.getConnection();

  try {
    const [users] = await connection.query('SELECT * FROM users WHERE email = ?', [email]);
    if (users.length === 0) {
      return res.status(404).json({ message: 'No user found with this email' });
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes later

    await connection.query(
      'UPDATE users SET reset_code = ?, reset_code_expires = ? WHERE email = ?',
      [code, expiresAt, email]
    );

    await sendEmail(
      email,
      'Password Reset Code',
      `Your password reset code is ${code}. It expires in 15 minutes.`
    );

    res.json({ message: 'Reset code sent to your email' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  } finally {
    connection.release();
  }
};

exports.verifyResetCode = async (req, res) => {
  const { email, code } = req.body;
  const connection = await pool.getConnection();

  try {
    const [users] = await connection.query(
      'SELECT * FROM users WHERE email = ? AND reset_code = ?',
      [email, code]
    );

    if (users.length === 0) {
      return res.status(400).json({ message: 'Invalid code or email' });
    }

    const user = users[0];
    if (new Date(user.reset_code_expires) < new Date()) {
      return res.status(400).json({ message: 'Code has expired' });
    }

    res.json({ 
      success: true,
      message: 'Code verified successfully' 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  } finally {
    connection.release();
  }
};

exports.resetPassword = async (req, res) => {
  const { email, newPassword } = req.body;
  const connection = await pool.getConnection();

  try {
    const [users] = await connection.query(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      return res.status(400).json({ message: 'User not found' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await connection.query(
      'UPDATE users SET password = ?, reset_code = NULL, reset_code_expires = NULL WHERE email = ?',
      [hashedPassword, email]
    );

    res.json({ 
      success: true,
      message: 'Password updated successfully' 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  } finally {
    connection.release();
  }
};