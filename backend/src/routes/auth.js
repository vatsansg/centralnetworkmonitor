'use strict';

const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../database/database');
const { verifyToken } = require('../middleware/auth');
const logger = require('../utils/logger');

const router = express.Router();

const PASSWORD_RE = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;

router.post('/login', (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) return res.status(400).json({ error: 'Username and password required' });

  const user = db.getUserByUsername(username);
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });
  if (!user.is_active) return res.status(403).json({ error: 'Account is inactive' });

  const valid = bcrypt.compareSync(password, user.password_hash);
  if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

  db.updateUserLastLogin(user.id);

  const token = jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
  );

  logger.info({ msg: 'Login', username });
  res.json({
    token,
    user: {
      id: user.id,
      username: user.username,
      role: user.role,
      theme: user.theme,
      must_change_password: user.must_change_password
    }
  });
});

router.post('/logout', (req, res) => res.json({ ok: true }));

router.get('/me', verifyToken, (req, res) => {
  res.json({
    id: req.user.id,
    username: req.user.username,
    role: req.user.role,
    theme: req.user.theme,
    must_change_password: req.user.must_change_password
  });
});

router.post('/change-password', verifyToken, (req, res) => {
  const { current_password, new_password } = req.body || {};
  if (!current_password || !new_password) return res.status(400).json({ error: 'Both fields required' });

  if (!PASSWORD_RE.test(new_password)) {
    return res.status(400).json({ error: 'Password must be at least 8 characters with uppercase, lowercase, number, and special character' });
  }

  const user = db.getUserByUsername(req.user.username);
  const valid = bcrypt.compareSync(current_password, user.password_hash);
  if (!valid) return res.status(401).json({ error: 'Current password is incorrect' });

  const hash = bcrypt.hashSync(new_password, 10);
  db.updateUserPassword(req.user.id, hash);
  logger.info({ msg: 'Password changed', userId: req.user.id });
  res.json({ ok: true });
});

router.get('/preferences', verifyToken, (req, res) => {
  res.json({ theme: req.user.theme });
});

router.put('/preferences', verifyToken, (req, res) => {
  const { theme } = req.body || {};
  if (!['dark', 'light'].includes(theme)) return res.status(400).json({ error: 'Invalid theme' });
  db.updateUserTheme(req.user.id, theme);
  res.json({ theme });
});

module.exports = router;
