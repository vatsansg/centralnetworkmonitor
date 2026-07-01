'use strict';

const express = require('express');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const db = require('../database/database');
const { verifyToken, requireRole } = require('../middleware/auth');
const { sendCredentials } = require('../services/emailService');
const logger = require('../utils/logger');

const router = express.Router();

function generatePassword() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let rand = '';
  while (rand.length < 8) {
    rand += chars[crypto.randomInt(0, chars.length)];
  }
  return `Cm${rand}!`;
}

router.use(verifyToken, requireRole('admin'));

router.get('/', (req, res) => {
  res.json(db.getAllUsers());
});

router.post('/', async (req, res) => {
  const { username, email, role } = req.body || {};
  if (!username || !email || !role) return res.status(400).json({ error: 'username, email, role required' });
  if (!['admin', 'operator', 'viewer'].includes(role)) return res.status(400).json({ error: 'Invalid role' });

  const password = generatePassword();
  const hash = bcrypt.hashSync(password, 10);

  try {
    const id = db.createUser({ username, email, password_hash: hash, role, must_change_password: 1 });
    await sendCredentials({ to: email, username, password });
    logger.info({ msg: 'User created', id, username, role });
    res.status(201).json({ id, username, email, role, temp_password: password });
  } catch (err) {
    if (err.message && err.message.includes('UNIQUE')) {
      return res.status(409).json({ error: 'Username or email already exists' });
    }
    throw err;
  }
});

router.put('/:id', (req, res) => {
  const { role, is_active } = req.body || {};
  db.updateUser(parseInt(req.params.id, 10), { role, is_active });
  res.json({ ok: true });
});

router.put('/:id/reset-password', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const user = db.getUserById(id);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const password = generatePassword();
  const hash = bcrypt.hashSync(password, 10);
  db.updateUserPassword(id, hash);
  db.setMustChangePassword(id, true);
  await sendCredentials({ to: user.email, username: user.username, password });
  logger.info({ msg: 'Password reset', id });
  res.json({ ok: true });
});

router.delete('/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (id === req.user.id) return res.status(400).json({ error: 'Cannot delete your own account' });

  const target = db.getUserById(id);
  if (!target) return res.status(404).json({ error: 'User not found' });

  if (target.role === 'admin' && db.countAdmins() <= 1) {
    return res.status(400).json({ error: 'Cannot delete the last admin account' });
  }

  db.deleteUser(id);
  logger.info({ msg: 'User deleted', id });
  res.json({ ok: true });
});

module.exports = router;
