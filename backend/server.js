'use strict';

require('dotenv').config();

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const path = require('path');

const db = require('./src/database/database');
const { seed } = require('./src/database/seed');
const { registerRoutes } = require('./src/routes/index');
const logger = require('./src/utils/logger');
const { startCleanupScheduler } = require('./src/services/blobCleanup');

const app = express();
const PORT = parseInt(process.env.PORT || '3001', 10);

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? false
    : ['http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true
}));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 500, standardHeaders: true, legacyHeaders: false }));
app.use(express.json());

app.get('/health', (_req, res) => res.json({ status: 'ok', ts: new Date().toISOString() }));
app.get('/api/version', (_req, res) => res.json({ version: require('./package.json').version, name: 'CentralNetworkMonitorApp' }));

registerRoutes(app);

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../frontend/dist')));
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
    }
  });
}

app.use((err, req, res, _next) => {
  logger.error({ msg: err.message, stack: err.stack, path: req.path });
  res.status(500).json({ error: 'Internal server error' });
});

const rawDb = db.initialize();
seed(rawDb);
startCleanupScheduler();

const server = app.listen(PORT, () => {
  logger.info(`Central Network Monitor running on port ${PORT}`);
});

process.on('SIGINT', () => {
  logger.info('Shutting down...');
  db.close();
  server.close(() => process.exit(0));
});

module.exports = app;
