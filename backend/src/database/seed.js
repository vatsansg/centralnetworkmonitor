'use strict';

const bcrypt = require('bcryptjs');
const logger = require('../utils/logger');

function seed(db) {
  const adminHash = bcrypt.hashSync('Admin@1234', 10);

  db.prepare(
    `INSERT OR IGNORE INTO users (username, email, password_hash, role, must_change_password)
     VALUES ('admin', 'admin@centralmonitor.local', ?, 'admin', 1)`
  ).run(adminHash);

  const settings = [
    ['app_name',              'Central Network Monitor',       'Application display name'],
    ['dashboard_refresh_sec', '60',                            'Dashboard polling interval (seconds)'],
    ['blob_stale_hours',      '48',                            'Hours before blobs are deleted by WebJob'],
    ['smtp_host',             '',                              'SMTP server hostname'],
    ['smtp_port',             '587',                           'SMTP server port'],
    ['smtp_user',             '',                              'SMTP username'],
    ['smtp_pass',             '',                              'SMTP password'],
    ['smtp_from',             'noreply@centralmonitor.local',  'From address for outbound emails'],
  ];

  for (const [key, value, description] of settings) {
    db.prepare(
      'INSERT OR IGNORE INTO system_settings (key, value, description) VALUES (?, ?, ?)'
    ).run(key, value, description);
  }

  logger.info('Seed complete');
}

module.exports = { seed };
