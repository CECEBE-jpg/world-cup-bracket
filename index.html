const { schedule } = require('@netlify/functions');
const { getStore } = require('@netlify/blobs');
const webpush = require('web-push');
const { fetchAllEvents } = require('./lib/fetchEvents');

webpush.setVapidDetails(
  'mailto:no-reply@example.com',
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

function describeMatch(ev) {
  const comp = ev.competitions[0];
  const home = comp.competitors.find(c => c.homeAway === 'home');
  const away = comp.competitors.find(c => c.homeAway === 'away');
  return {
    id: ev.id,
    text: `${home.team.abbreviation} ${home.score} – ${away.score} ${away.team.abbreviation}`,
  };
}

const handler = async function () {
  const events = await fetchAllEvents();
  const finished = events.filter(e => e.competitions?.[0]?.status?.type?.completed);
  const finishedIds = finished.map(e => e.id);

  const stateStore = getStore('bracket-state');
  let known = [];
  try {
    known = (await stateStore.get('known-finals', { type: 'json' })) || [];
  } catch (e) {
    known = [];
  }

  const newlyFinished = finished.filter(e => !known.includes(e.id));

  if (newlyFinished.length > 0) {
    const subStore = getStore('push-subscriptions');
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
          // Subscription is no longer valid (user revoked, uninstalled, etc.) — clean it up.
          if (err.statusCode === 404 || err.statusCode === 410) {
            await subStore.delete(b.key);
          }
        }
      }));
    }));
  }

  await stateStore.setJSON('known-finals', finishedIds);

  return { statusCode: 200 };
};

module.exports.handler = schedule('*/10 * * * *', handler);
