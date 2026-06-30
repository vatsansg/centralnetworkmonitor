'use strict';

const express = require('express');
const db = require('../database/database');
const { getVenueBlob } = require('../services/blobService');
const { verifyToken } = require('../middleware/auth');
const logger = require('../utils/logger');

const router = express.Router();

router.use(verifyToken);

router.get('/', (req, res) => {
  const row = db.getFavourite(req.user.id);
  res.json({ venue_id: row ? row.venue_id : null });
});

router.put('/', async (req, res) => {
  const { venue_id } = req.body || {};
  if (!venue_id) return res.status(400).json({ error: 'venue_id required' });

  const blob = await getVenueBlob(venue_id);
  if (!blob) return res.status(404).json({ error: 'Venue not found' });

  db.setFavourite(req.user.id, venue_id);
  logger.info({ msg: 'Favourite set', userId: req.user.id, venue_id });
  res.json({ venue_id });
});

router.delete('/', (req, res) => {
  db.clearFavourite(req.user.id);
  res.json({ ok: true });
});

module.exports = router;
