// config/email.js
require('dotenv').config();
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS
  }
});

async function sendVerificationEmail(toEmail, code) {
  const mailOptions = {
    from: `"L‑E Study" <${process.env.GMAIL_USER}>`,
    to: toEmail,
    subject: 'کد تأیید حساب L‑E Study',
    html: `
      <p>سلام!</p>
      <p>برای تکمیل ثبت‌نام در <strong>L‑E Study</strong>، لطفاً این کد را وارد کنید:</p>
      <h2>${code}</h2>
      <p>این کد تا ۱۰ دقیقه معتبر است.</p>
    `
  };
  return transporter.sendMail(mailOptions);
}

module.exports = { sendVerificationEmail };
