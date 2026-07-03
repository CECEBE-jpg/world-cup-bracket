const { getStore } = require('@netlify/blobs');
const crypto = require('crypto');

function keyFor(subscription) {
  // Stable, unique-per-device key derived from the subscription's endpoint URL.
  return crypto.createHash('sha256').update(subscription.endpoint).digest('hex');
}

exports.handler = async function (event) {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers };
  }

  const store = getStore('push-subscriptions');

  if (event.httpMethod === 'POST') {
    try {
      const body = JSON.parse(event.body);
      const subscription = body.subscription;
      if (!subscription || !subscription.endpoint) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'missing subscription' }) };
      }
      await store.setJSON(keyFor(subscription), subscription);
      return { statusCode: 200, headers, body: JSON.stringify({ ok: true }) };
    } catch (e) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'bad request' }) };
    }
  }

  if (event.httpMethod === 'DELETE') {
    try {
      const body = JSON.parse(event.body);
      const subscription = body.subscription;
      if (subscription && subscription.endpoint) {
        await store.delete(keyFor(subscription));
      }
      return { statusCode: 200, headers, body: JSON.stringify({ ok: true }) };
    } catch (e) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'bad request' }) };
    }
  }

  return { statusCode: 405, headers, body: JSON.stringify({ error: 'method not allowed' }) };
};
