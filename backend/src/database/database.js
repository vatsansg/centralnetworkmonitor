'use strict';

const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const fs = require('fs');
const SCHEMA = require('./schema');

const n = v => (v === undefined ? null : v);

let db;

function getDb() {
  if (!db) throw new Error('Database not initialized');
  return db;
}

function initialize() {
  if (db) return db;
  const dbPath = process.env.DB_PATH || './data/centralmonitor.db';
  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  db = new DatabaseSync(dbPath);
  db.exec(SCHEMA);
  return db;
}

function getRaw() { return getDb(); }

function close() { if (db) { db.close(); db = null; } }

// Users
function getUserByUsername(username) {
  return getDb().prepare('SELECT * FROM users WHERE username = ?').get(username);
}

function getUserById(id) {
  return getDb().prepare(
    'SELECT id, username, email, role, theme, is_active, must_change_password, created_at, last_login FROM users WHERE id = ?'
  ).get(id);
}

function getAllUsers() {
  return getDb().prepare(
    'SELECT id, username, email, role, theme, is_active, must_change_password, created_at, last_login FROM users ORDER BY created_at'
  ).all();
}

function createUser({ username, email, password_hash, role, must_change_password }) {
  const r = getDb().prepare(
    'INSERT INTO users (username, email, password_hash, role, must_change_password) VALUES (?, ?, ?, ?, ?)'
  ).run(n(username), n(email), n(password_hash), n(role) || 'viewer', n(must_change_password) || 0);
  return r.lastInsertRowid;
}

function updateUserPassword(id, password_hash) {
  getDb().prepare('UPDATE users SET password_hash = ?, must_change_password = 0 WHERE id = ?').run(n(password_hash), n(id));
}

function setMustChangePassword(id, flag) {
  getDb().prepare('UPDATE users SET must_change_password = ? WHERE id = ?').run(flag ? 1 : 0, n(id));
}

function updateUserLastLogin(id) {
  getDb().prepare("UPDATE users SET last_login = datetime('now') WHERE id = ?").run(n(id));
}

function updateUser(id, { role, is_active }) {
  getDb().prepare('UPDATE users SET role = COALESCE(?, role), is_active = COALESCE(?, is_active) WHERE id = ?')
    .run(n(role), n(is_active === undefined ? undefined : is_active), n(id));
}

function updateUserTheme(id, theme) {
  getDb().prepare('UPDATE users SET theme = ? WHERE id = ?').run(n(theme), n(id));
}

function deleteUser(id) {
  getDb().prepare('DELETE FROM users WHERE id = ?').run(n(id));
}

function countAdmins() {
  return getDb().prepare("SELECT COUNT(*) as cnt FROM users WHERE role = 'admin' AND is_active = 1").get().cnt;
}

// Favourites
function getFavourite(userId) {
  return getDb().prepare('SELECT venue_id FROM user_favourites WHERE user_id = ?').get(n(userId));
}

function setFavourite(userId, venueId) {
  getDb().prepare('INSERT OR REPLACE INTO user_favourites (user_id, venue_id) VALUES (?, ?)').run(n(userId), n(venueId));
}

function clearFavourite(userId) {
  getDb().prepare('DELETE FROM user_favourites WHERE user_id = ?').run(n(userId));
}

// Settings
function getSetting(key) {
  const row = getDb().prepare('SELECT value FROM system_settings WHERE key = ?').get(key);
  return row ? row.value : null;
}

function setSetting(key, value) {
  getDb().prepare("INSERT OR REPLACE INTO system_settings (key, value, updated_at) VALUES (?, ?, datetime('now'))").run(key, value);
}

function getAllSettings() {
  return getDb().prepare('SELECT key, value, description FROM system_settings').all();
}

module.exports = {
  initialize, getRaw, close,
  getUserByUsername, getUserById, getAllUsers, createUser,
  updateUserPassword, setMustChangePassword, updateUserLastLogin,
  updateUser, updateUserTheme, deleteUser, countAdmins,
  getFavourite, setFavourite, clearFavourite,
  getSetting, setSetting, getAllSettings
};
