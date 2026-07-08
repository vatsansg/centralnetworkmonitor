'use strict';

const { BlobServiceClient } = require('@azure/storage-blob');
const logger = require('../utils/logger');

const CONTAINER = () => process.env.AZURE_STORAGE_CONTAINER || 'allvenuesource';
const STALE_HOURS = parseInt(process.env.BLOB_STALE_HOURS || '48', 10);

function getContainerClient() {
  const connStr = process.env.AZURE_STORAGE_CONNECTION_STRING;
  if (!connStr) throw new Error('AZURE_STORAGE_CONNECTION_STRING is not set');
  return BlobServiceClient.fromConnectionString(connStr).getContainerClient(CONTAINER());
}

let _cache = null;
let _cacheTs = 0;
const CACHE_TTL_MS = 60 * 1000;

async function listVenueBlobs({ bust = false } = {}) {
  const now = Date.now();
  if (!bust && _cache && now - _cacheTs < CACHE_TTL_MS) {
    return _cache;
  }

  const container = getContainerClient();
  const results = [];

  for await (const blob of container.listBlobsFlat()) {
    if (!blob.name.endsWith('.json')) continue;
    try {
      const blobClient = container.getBlockBlobClient(blob.name);
      const buffer = await blobClient.downloadToBuffer();
      const data = JSON.parse(buffer.toString());
      const generatedAt = new Date(data.generated_at);
      const ageMinutes = Math.round((now - generatedAt.getTime()) / 60000);
      if (ageMinutes > STALE_HOURS * 60) {
        logger.info({ msg: 'Skipping stale blob from listing', blob: blob.name, ageMinutes });
        continue;
      }
      results.push({
        blob_name: blob.name,
        venue_id: data.venue_id,
        event_name: data.event_name,
        generated_at: data.generated_at,
        app_version: data.app_version,
        age_minutes: ageMinutes
      });
    } catch (err) {
      logger.warn({ msg: 'Failed to parse blob', blob: blob.name, error: err.message });
    }
  }

  results.sort((a, b) => a.venue_id.localeCompare(b.venue_id));

  _cache = results;
  _cacheTs = now;
  return results;
}

async function getVenueBlob(venueId) {
  const container = getContainerClient();
  const blobClient = container.getBlockBlobClient(`${venueId}.json`);
  try {
    const buffer = await blobClient.downloadToBuffer();
    return JSON.parse(buffer.toString());
  } catch (err) {
    if (err.statusCode === 404 || err.code === 'BlobNotFound') return null;
    throw err;
  }
}

async function deleteBlob(blobName) {
  const container = getContainerClient();
  await container.deleteBlob(blobName);
}

function bustCache() {
  _cache = null;
  _cacheTs = 0;
}

module.exports = { listVenueBlobs, getVenueBlob, deleteBlob, bustCache };
