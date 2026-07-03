const { fetchAllEvents } = require('./lib/fetchEvents');

exports.handler = async function () {
  const events = await fetchAllEvents();

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=60',
    },
    body: JSON.stringify({ events, fetchedAt: Date.now() }),
  };
};
