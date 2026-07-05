const { getBlobStore } = require('./lib/blobStore');
const webpush = require('web-push');

const headers = { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' };

exports.handler = async function () {
  try {
    if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
      return { statusCode: 500, headers, body: JSON.stringify({ error: 'VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY environment variables are not set' }) };
    }
    if (!process.env.NETLIFY_SITE_ID || !process.env.NETLIFY_AUTH_TOKEN) {
      return { statusCode: 500, headers, body: JSON.stringify({ error: 'NETLIFY_SITE_ID / NETLIFY_AUTH_TOKEN environment variables are not set' }) };
    }

    webpush.setVapidDetails(
      'mailto:no-reply@example.com',
      process.env.VAPID_PUBLIC_KEY,
      process.env.VAPID_PRIVATE_KEY
    );

    const subStore = getBlobStore('push-subscriptions');
    const { blobs } = await subStore.list();

    if (blobs.length === 0) {
      return { statusCode: 200, headers, body: JSON.stringify({ sent: 0, message: 'No subscribed devices found yet.' }) };
    }

    const payload = JSON.stringify({
      title: 'World Cup Bracket',
      body: '🏆 Match A vs B has ended! Tap to view results now.',
    });

    let sent = 0;
    const errors = [];
    await Promise.all(blobs.map(async (b) => {
      const subscription = await subStore.get(b.key, { type: 'json' });
      if (!subscription) return;
      try {
        await webpush.sendNotification(subscription, payload);
        sent++;
      } catch (err) {
        errors.push(String(err && err.message || err));
        if (err.statusCode === 404 || err.statusCode === 410) {
          await subStore.delete(b.key);
        }
      }
    }));

    return { statusCode: 200, headers, body: JSON.stringify({ sent, total: blobs.length, errors }) };

  } catch (e) {
    console.error('test-notify function error:', e);
    return { statusCode: 500, headers, body: JSON.stringify({ error: String(e && e.message || e) }) };
  }
};
