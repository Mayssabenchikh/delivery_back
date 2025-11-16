const sendEmail = require('./sendEmail');
const crypto = require('crypto');

/**
 * Generate a verification token and expiry date
 * @param {number} expiryHours - Hours until token expires (default 24)
 * @returns {Object} { token, expiresAt }
 */
function generateVerificationToken(expiryHours = 24) {
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + expiryHours * 60 * 60 * 1000);
  return { token, expiresAt };
}

/**
 * Generate a 6-digit verification code and expiry date
 * @param {number} expiryMinutes - Minutes until code expires (default 15)
 * @returns {Object} { code, expiresAt }
 */
function generateVerificationCode(expiryMinutes = 15) {
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000);
  return { code, expiresAt };
}

/**
 * Send verification email with link
 * @param {string} email - Recipient email
 * @param {string} token - Verification token
 * @returns {Promise}
 */
async function sendVerificationEmail(email, token) {
  const verifyUrl = `${process.env.SERVER_URL || `http://localhost:${process.env.PORT || 3200}`}/api/auth/verify-email?token=${token}&email=${encodeURIComponent(email)}`;
  
  const subject = 'Verify your W9ayt Delivery account';
  const text = `Welcome to W9ayt Delivery!\n\nPlease verify your account by clicking this link:\n${verifyUrl}\n\nThis link will expire in 24 hours.\n\nIf you didn't create this account, please ignore this email.`;
  
  return sendEmail(email, subject, text);
}

/**
 * Send password reset code email
 * @param {string} email - Recipient email
 * @param {string} code - Reset code
 * @returns {Promise}
 */
async function sendPasswordResetEmail(email, code) {
  const subject = 'Password Reset Code';
  const text = `Your password reset code is ${code}. It expires in 15 minutes.`;
  
  return sendEmail(email, subject, text);
}

module.exports = {
  generateVerificationToken,
  generateVerificationCode,
  sendVerificationEmail,
  sendPasswordResetEmail
};
