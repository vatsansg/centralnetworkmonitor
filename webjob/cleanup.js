require('dotenv').config();

const { BlobServiceClient } = require('@azure/storage-blob');

const CONN_STR    = process.env.AZURE_STORAGE_CONNECTION_STRING;
const CONTAINER   = process.env.AZURE_STORAGE_CONTAINER || 'allvenuesource';
const STALE_HOURS = parseInt(process.env.BLOB_STALE_HOURS || '48', 10);

async function run() {
  if (!CONN_STR) {
    console.error('[ERROR] AZURE_STORAGE_CONNECTION_STRING is not set');
    process.exit(1);
  }

  const container = BlobServiceClient.fromConnectionString(CONN_STR).getContainerClient(CONTAINER);
  const cutoff = new Date(Date.now() - STALE_HOURS * 60 * 60 * 1000);
  let deleted = 0, kept = 0, errors = 0;

  console.log(`Cleanup run | Container: ${CONTAINER} | Cutoff: ${cutoff.toISOString()} (${STALE_HOURS}h ago)\n`);

  for await (const blob of container.listBlobsFlat()) {
    if (!blob.name.endsWith('.json')) continue;
    try {
      const blobClient = container.getBlockBlobClient(blob.name);
      const buffer = await blobClient.downloadToBuffer();
      const data = JSON.parse(buffer.toString());
      const generatedAt = new Date(data.generated_at);
      const ageH = Math.round((Date.now() - generatedAt.getTime()) / 3600000);

      if (generatedAt < cutoff) {
        await blobClient.delete();
        console.log(`[DELETED] ${blob.name} — generated_at: ${data.generated_at} (${ageH}h ago)`);
        deleted++;
      } else {
        console.log(`[KEPT]    ${blob.name} — age: ${ageH}h`);
        kept++;
      }
    } catch (err) {
      console.error(`[ERROR]   ${blob.name}: ${err.message}`);
      errors++;
    }
  }

  console.log(`\nCleanup complete: ${deleted} deleted, ${kept} kept, ${errors} errors`);
  process.exit(errors > 0 ? 1 : 0);
}

run().catch(e => { console.error(e); process.exit(1); });
