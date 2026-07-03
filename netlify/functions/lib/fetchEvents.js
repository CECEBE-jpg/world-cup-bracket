// Shared by scores.js and check-and-notify.js so both pull from one place.
const SYNC_DATES = [
  '20260628','20260629','20260630','20260701','20260702','20260703','20260704',
  '20260705','20260706','20260707','20260709','20260710','20260711',
  '20260714','20260715','20260718','20260719'
];

async function fetchAllEvents() {
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
  return events;
}

module.exports = { fetchAllEvents, SYNC_DATES };
