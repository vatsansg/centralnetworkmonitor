'use strict';

const nodemailer = require('nodemailer');
const logger = require('../utils/logger');

function getTransporter() {
  const host = process.env.SMTP_HOST;
  if (!host) return null;

  return nodemailer.createTransport({
    host,
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    auth: process.env.SMTP_USER ? {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    } : undefined,
    secure: false
  });
}

async function sendCredentials({ to, username, password }) {
  const transporter = getTransporter();
  if (!transporter) {
    logger.warn({ msg: 'SMTP not configured — skipping credential email', to, username });
    return;
  }

  const appUrl = process.env.APP_URL || 'http://localhost:5173';
  await transporter.sendMail({
    from: process.env.SMTP_FROM || 'noreply@centralmonitor.local',
    to,
    subject: 'Your Central Network Monitor account',
    text: [
      'You have been given access to Central Network Monitor.',
      '',
      `Username: ${username}`,
      `Temporary password: ${password}`,
      `Login at: ${appUrl}`,
      '',
      'You will be required to change your password on first login.'
    ].join('\n')
  });

  logger.info({ msg: 'Credential email sent', to, username });
}

module.exports = { sendCredentials };
