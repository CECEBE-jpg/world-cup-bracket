// Runs on Netlify's server, not in the browser — so ESPN's missing CORS headers
// don't matter here. The phone calls THIS function (same origin, no CORS issue),
// and this function does the actual outbound call to ESPN on its behalf.

const SYNC_DATES = [
  '20260628','20260629','20260630','20260701','20260702','20260703','20260704',
  '20260705','20260706','20260707','20260709','20260710','20260711',
  '20260714','20260715','20260718','20260719'
];

exports.handler = async function () {
  const events = [];

  await Promise.all(SYNC_DATES.map(async (d) => {
    try {
      const res = await fetch(
        `https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard?dates=${d}`
      );
      if (res.ok) {
        const json = await res.json();
        if (json.events) events.push(...json.events);
      }
    } catch (e) {
      // skip this date, keep going
    }
  }));

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=60', // avoid hammering ESPN on every page load
    },
    body: JSON.stringify({ events, fetchedAt: Date.now() }),
  };
};
