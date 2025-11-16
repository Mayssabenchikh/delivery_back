const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/database');
const {
  generateVerificationToken,
  generateVerificationCode,
  sendVerificationEmail,
  sendPasswordResetEmail
} = require('./models/emailService');
exports.signUp = async (req, res) => {
  const connection = await pool.getConnection();

  try {
    const { name, email, phone, address, password } = req.body;

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

    const hashedPassword = await bcrypt.hash(password, 10);

    const [result] = await connection.execute(
      `INSERT INTO users (name, email, phone, address, password, role, status, verified)
       VALUES (?, ?, ?, ?, ?, 'client', 'active', 0)`,
      [name, email, phone, address, hashedPassword]
    );

    const { token, expiresAt } = generateVerificationToken();
    await connection.execute(
      'UPDATE users SET verification_token = ?, verification_token_expires = ? WHERE id = ?',
      [token, expiresAt, result.insertId]
    );

    const [newUser] = await connection.execute(
      'SELECT id, name, email, phone, address, role, status, verified, created_at FROM users WHERE id = ?',
      [result.insertId]
    );

    try {
      await sendVerificationEmail(email, token);
    } catch (mailErr) {
      console.error('Failed to send verification email:', mailErr);
    }
    res.status(201).json({
      success: true,
      message: 'Account created successfully. Please check your email to verify your account.',
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

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password required' });
  }

  const connection = await pool.getConnection();

  try {
    const [results] = await connection.execute('SELECT * FROM users WHERE email = ?', [email]);

    if (!results || results.length === 0) {
      return res.status(400).json({ message: 'User not found' });
    }

    const user = results[0];

    if (!user.password) {
      return res.status(500).json({ message: 'Server error' });
    }

    // Check if account is verified
    if (!user.verified) {
      return res.status(403).json({ 
        success: false,
        message: 'Please verify your email before logging in. Check your inbox for the verification link.' 
      });
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
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
        phone: user.phone,
        address: user.address,
        createdAt: user.created_at
      },
    });
  } catch (err) {
    console.error('Login Error:', err);
    res.status(500).json({ message: 'Server error' });
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

    const { code, expiresAt } = generateVerificationCode();

    await connection.query(
      'UPDATE users SET reset_code = ?, reset_code_expires = ? WHERE email = ?',
      [code, expiresAt, email]
    );

    await sendPasswordResetEmail(email, code);

    res.json({ message: 'Reset code sent to your email' });
  } catch (err) {
    console.error('Forgot Password Error:', err);
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
    console.error('Verify Reset Code Error:', err);
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
    console.error('Reset Password Error:', err);
    res.status(500).json({ message: 'Server error' });
  } finally {
    connection.release();
  }
};

exports.verifyEmail = async (req, res) => {
  const { token, email } = req.query;
  const connection = await pool.getConnection();

  try {
    if (!token || !email) {
      return res.status(400).json({ success: false, message: 'Token and email are required' });
    }

    const [users] = await connection.execute(
      'SELECT id, verification_token_expires, verified FROM users WHERE email = ? AND verification_token = ?',
      [email, token]
    );

    if (users.length === 0) {
      return res.status(400).json({ success: false, message: 'Invalid token or email' });
    }

    const user = users[0];
    if (user.verified) {
      const redirectUrl = process.env.EMAIL_VERIFY_REDIRECT;
      if (redirectUrl) {
        return res.redirect(`${redirectUrl}?verified=true&already=true`);
      }
      return res.json({ success: true, message: 'Account already verified' });
    }

    if (user.verification_token_expires && new Date(user.verification_token_expires) < new Date()) {
      return res.status(400).json({ success: false, message: 'Verification token has expired' });
    }

    await connection.execute(
      'UPDATE users SET verified = 1, verification_token = NULL, verification_token_expires = NULL WHERE id = ?',
      [user.id]
    );

    const redirectUrl = process.env.EMAIL_VERIFY_REDIRECT;
    if (redirectUrl) {
      return res.redirect(`${redirectUrl}?verified=true`);
    }

    res.json({ success: true, message: 'Account verified successfully' });
  } catch (err) {
    console.error('Verify Email Error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  } finally {
    connection.release();
  }
};

exports.resendVerificationEmail = async (req, res) => {
  const { email } = req.body;
  const connection = await pool.getConnection();

  try {
    if (!email) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email is required' 
      });
    }

    const [users] = await connection.execute(
      'SELECT id, verified FROM users WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'No account found with this email' 
      });
    }

    const user = users[0];
    if (user.verified) {
      return res.status(400).json({ 
        success: false, 
        message: 'Account is already verified' 
      });
    }

    const { token, expiresAt } = generateVerificationToken();

    await connection.execute(
      'UPDATE users SET verification_token = ?, verification_token_expires = ? WHERE id = ?',
      [token, expiresAt, user.id]
    );

    await sendVerificationEmail(email, token);

    res.json({ 
      success: true, 
      message: 'Verification email sent successfully. Please check your inbox.' 
    });
  } catch (err) {
    console.error('Resend Verification Email Error:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Server error. Please try again later.' 
    });
  } finally {
    connection.release();
  }
};