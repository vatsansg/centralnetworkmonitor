'use strict';

const express = require('express');
const { listVenueBlobs, getVenueBlob, bustCache } = require('../services/blobService');
const { verifyToken } = require('../middleware/auth');
const logger = require('../utils/logger');

const router = express.Router();

router.use(verifyToken);

router.get('/', async (req, res) => {
  try {
    const venues = await listVenueBlobs();
    res.json(venues);
  } catch (err) {
    logger.error({ msg: 'Failed to list blobs', error: err.message });
    res.status(500).json({ error: 'Failed to list venues' });
  }
});

router.get('/:venueId', async (req, res) => {
  try {
    const data = await getVenueBlob(req.params.venueId);
    if (!data) return res.status(404).json({ error: 'Venue not found' });
    res.json(data);
  } catch (err) {
    logger.error({ msg: 'Failed to get blob', venueId: req.params.venueId, error: err.message });
    res.status(500).json({ error: 'Failed to load venue data' });
  }
});

router.post('/refresh', async (req, res) => {
  try {
    bustCache();
    const venues = await listVenueBlobs({ bust: true });
    res.json(venues);
  } catch (err) {
    logger.error({ msg: 'Failed to refresh blobs', error: err.message });
    res.status(500).json({ error: 'Failed to refresh venues' });
  }
});

module.exports = router;
