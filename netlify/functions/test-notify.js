const { getStore } = require('@netlify/blobs');
const webpush = require('web-push');

webpush.setVapidDetails(
  'mailto:no-reply@example.com',
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

exports.handler = async function () {
  const subStore = getStore('push-subscriptions');
  const { blobs } = await subStore.list();

  if (blobs.length === 0) {
    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
      body: JSON.stringify({ sent: 0, message: 'No subscribed devices found yet.' }),
    };
  }

  const payload = JSON.stringify({
    title: 'World Cup Bracket',
    body: '🔔 Test notification — if you can see this, it works!',
  });

  let sent = 0;
  await Promise.all(blobs.map(async (b) => {
    const subscription = await subStore.get(b.key, { type: 'json' });
    if (!subscription) return;
    try {
      await webpush.sendNotification(subscription, payload);
      sent++;
    } catch (err) {
      if (err.statusCode === 404 || err.statusCode === 410) {
        await subStore.delete(b.key);
      }
    }
  }));

  return {
    statusCode: 200,
    headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
    body: JSON.stringify({ sent, total: blobs.length }),
  };
};
