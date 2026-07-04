const { getStore } = require('@netlify/blobs');

// Netlify's automatic credential injection for Blobs is unreliable in some
// deploy setups (a known, widely-reported issue). Supplying siteID + token
// manually sidesteps that entirely. NETLIFY_SITE_ID and NETLIFY_AUTH_TOKEN
// must be set as environment variables in Site configuration.
function getBlobStore(name) {
  return getStore({
    name,
    siteID: process.env.NETLIFY_SITE_ID,
    token: process.env.NETLIFY_AUTH_TOKEN,
  });
}

module.exports = { getBlobStore };
