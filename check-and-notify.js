const { getBlobStore } = require('./lib/blobStore');

const headers = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

// A device counts as "currently watching" if its last heartbeat was within this window.
const ACTIVE_WINDOW_MS = 60 * 1000;
// Entries older than this are just deleted outright to keep the store tidy.
const STALE_CLEANUP_MS = ACTIVE_WINDOW_MS * 10;

exports.handler = async function (event) {
  try {
    if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers };
    if (event.httpMethod !== 'POST') {
      return { statusCode: 405, headers, body: JSON.stringify({ error: 'method not allowed' }) };
    }
    if (!process.env.NETLIFY_SITE_ID || !process.env.NETLIFY_AUTH_TOKEN) {
      return { statusCode: 500, headers, body: JSON.stringify({ error: 'NETLIFY_SITE_ID / NETLIFY_AUTH_TOKEN not set' }) };
    }

    let body;
    try { body = JSON.parse(event.body || '{}'); } catch (e) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'invalid JSON body' }) };
    }
    const clientId = body.clientId;
    if (!clientId) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'missing clientId' }) };
    }

    const store = getBlobStore('presence');
    const now = Date.now();
    await store.setJSON(clientId, { lastSeen: now });

    const { blobs } = await store.list();
    let count = 0;
    await Promise.all(blobs.map(async (b) => {
      const entry = await store.get(b.key, { type: 'json' });
      if (!entry) return;
      const age = now - entry.lastSeen;
      if (age <= ACTIVE_WINDOW_MS) {
        count++;
      } else if (age > STALE_CLEANUP_MS) {
        await store.delete(b.key);
      }
    }));

    return { statusCode: 200, headers, body: JSON.stringify({ count }) };

  } catch (e) {
    console.error('presence function error:', e);
    return { statusCode: 500, headers, body: JSON.stringify({ error: String(e && e.message || e) }) };
  }
};
