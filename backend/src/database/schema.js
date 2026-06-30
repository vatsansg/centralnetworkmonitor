'use strict';

const SCHEMA = `
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  id                   INTEGER PRIMARY KEY AUTOINCREMENT,
  username             TEXT UNIQUE NOT NULL,
  email                TEXT UNIQUE NOT NULL,
  password_hash        TEXT NOT NULL,
  role                 TEXT DEFAULT 'viewer' CHECK(role IN ('admin', 'operator', 'viewer')),
  theme                TEXT DEFAULT 'dark' CHECK(theme IN ('dark', 'light')),
  is_active            INTEGER DEFAULT 1,
  must_change_password INTEGER DEFAULT 0,
  created_at           TEXT DEFAULT (datetime('now')),
  last_login           TEXT
);

CREATE TABLE IF NOT EXISTS user_favourites (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  venue_id   TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  UNIQUE(user_id)
);

CREATE TABLE IF NOT EXISTS system_settings (
  key        TEXT PRIMARY KEY,
  value      TEXT NOT NULL,
  description TEXT,
  updated_at TEXT DEFAULT (datetime('now'))
);
`;

module.exports = SCHEMA;
