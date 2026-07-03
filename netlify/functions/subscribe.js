const { getStore } = require('@netlify/blobs');
const crypto = require('crypto');

function keyFor(subscription) {
  return crypto.createHash('sha256').update(subscription.endpoint).digest('hex');
}

const headers = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

exports.handler = async function (event) {
  try {
    if (event.httpMethod === 'OPTIONS') {
      return { statusCode: 204, headers };
    }

    if (event.httpMethod !== 'POST' && event.httpMethod !== 'DELETE') {
      return { statusCode: 405, headers, body: JSON.stringify({ error: 'method not allowed' }) };
    }

    let body;
    try {
      body = JSON.parse(event.body || '{}');
    } catch (e) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'invalid JSON body' }) };
    }

    const subscription = body.subscription;
    if (!subscription || !subscription.endpoint) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'missing subscription.endpoint' }) };
    }

    const store = getStore('push-subscriptions');

    if (event.httpMethod === 'POST') {
      await store.setJSON(keyFor(subscription), subscription);
      return { statusCode: 200, headers, body: JSON.stringify({ ok: true }) };
    }

    // DELETE
    await store.delete(keyFor(subscription));
    return { statusCode: 200, headers, body: JSON.stringify({ ok: true }) };

  } catch (e) {
    // Logged so it shows up in the Netlify Functions log for this invocation.
    console.error('subscribe function error:', e);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'internal error', detail: String(e && e.message || e) }),
    };
  }
};
