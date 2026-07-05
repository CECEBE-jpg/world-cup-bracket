const { schedule } = require('@netlify/functions');
const { getBlobStore } = require('./lib/blobStore');
const webpush = require('web-push');
const { fetchAllEvents } = require('./lib/fetchEvents');

function describeMatch(ev) {
  const comp = ev.competitions[0];
  const home = comp.competitors.find(c => c.homeAway === 'home');
  const away = comp.competitors.find(c => c.homeAway === 'away');
  return {
    id: ev.id,
    // Deliberately no score or winner here — open the app to see the result.
    text: `Match ${home.team.abbreviation} vs ${away.team.abbreviation} has ended! Tap to view results now.`,
  };
}

const handler = async function () {
  try {
    if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
      console.error('check-and-notify: missing VAPID env vars');
      return { statusCode: 500 };
    }
    if (!process.env.NETLIFY_SITE_ID || !process.env.NETLIFY_AUTH_TOKEN) {
      console.error('check-and-notify: missing NETLIFY_SITE_ID / NETLIFY_AUTH_TOKEN env vars');
      return { statusCode: 500 };
    }

    webpush.setVapidDetails(
      'mailto:no-reply@example.com',
      process.env.VAPID_PUBLIC_KEY,
      process.env.VAPID_PRIVATE_KEY
    );

    const events = await fetchAllEvents();
    const finished = events.filter(e => e.competitions?.[0]?.status?.type?.completed);
    const finishedIds = finished.map(e => e.id);

    const stateStore = getBlobStore('bracket-state');
    let known = [];
    try {
      known = (await stateStore.get('known-finals', { type: 'json' })) || [];
    } catch (e) {
      known = [];
    }

    const newlyFinished = finished.filter(e => !known.includes(e.id));

    if (newlyFinished.length > 0) {
      const subStore = getBlobStore('push-subscriptions');
      const { blobs } = await subStore.list();

      const messages = newlyFinished.map(describeMatch);

      await Promise.all(blobs.map(async (b) => {
        const subscription = await subStore.get(b.key, { type: 'json' });
        if (!subscription) return;
        await Promise.all(messages.map(async (m) => {
          const payload = JSON.stringify({
            title: 'World Cup — Full Time',
            body: m.text,
          });
          try {
            await webpush.sendNotification(subscription, payload);
          } catch (err) {
            if (err.statusCode === 404 || err.statusCode === 410) {
              await subStore.delete(b.key);
            }
          }
        }));
      }));
    }

    await stateStore.setJSON('known-finals', finishedIds);
    return { statusCode: 200 };

  } catch (e) {
    console.error('check-and-notify function error:', e);
    return { statusCode: 500 };
  }
};

module.exports.handler = schedule('*/10 * * * *', handler);
