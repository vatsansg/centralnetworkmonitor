'use strict';

const { BlobServiceClient } = require('@azure/storage-blob');
const logger = require('../utils/logger');

const STALE_HOURS = parseInt(process.env.BLOB_STALE_HOURS || '48', 10);
const INTERVAL_MS = 60 * 60 * 1000; // every 1 hour

async function runCleanup() {
  const connStr = process.env.AZURE_STORAGE_CONNECTION_STRING;
  const container = process.env.AZURE_STORAGE_CONTAINER || 'allvenuesource';
  if (!connStr) { logger.warn('blobCleanup: AZURE_STORAGE_CONNECTION_STRING not set, skipping'); return; }

  const cutoff = new Date(Date.now() - STALE_HOURS * 60 * 60 * 1000);
  logger.info(`blobCleanup: scanning container=${container} cutoff=${cutoff.toISOString()}`);

  const client = BlobServiceClient.fromConnectionString(connStr).getContainerClient(container);
  let deleted = 0, kept = 0, errors = 0;

  for await (const blob of client.listBlobsFlat()) {
    if (!blob.name.endsWith('.json')) continue;
    try {
      const blobClient = client.getBlockBlobClient(blob.name);
      const buf = await blobClient.downloadToBuffer();
      const data = JSON.parse(buf.toString());
      const generatedAt = new Date(data.generated_at);
      if (generatedAt < cutoff) {
        await blobClient.delete();
        logger.info(`blobCleanup: deleted ${blob.name} (generated_at=${data.generated_at})`);
        deleted++;
      } else {
        kept++;
      }
    } catch (err) {
      logger.error(`blobCleanup: error on ${blob.name}: ${err.message}`);
      errors++;
    }
  }

  logger.info(`blobCleanup: done — deleted=${deleted} kept=${kept} errors=${errors}`);
}

function startCleanupScheduler() {
  // Run once shortly after startup, then every 6 hours
  setTimeout(() => {
    runCleanup().catch(err => logger.error(`blobCleanup startup run failed: ${err.message}`));
  }, 5 * 60 * 1000); // 5 min after start

  setInterval(() => {
    runCleanup().catch(err => logger.error(`blobCleanup scheduled run failed: ${err.message}`));
  }, INTERVAL_MS);

  logger.info(`blobCleanup: scheduler started (every ${INTERVAL_MS / 60000}min, stale after ${STALE_HOURS}h)`);
}

module.exports = { startCleanupScheduler, runCleanup };
