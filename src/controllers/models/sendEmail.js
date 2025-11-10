// utils/sendEmail.js
const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.email_SMTP, 
    pass: process.env.pass_SMTP 
  }
});

async function sendEmail(to, subject, text) {
  await transporter.sendMail({
    from: '"Support" <ibrahimghorbali605@gmail.com>',
    to,
    subject,
    text,
  });
}

module.exports = sendEmail;
