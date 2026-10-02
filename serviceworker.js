// Modified from https://gist.github.com/adactio/3717b7da007a9363ddf21f584aae34af
// All files: try the network first, then the cache. Cache a fresh version if possible.
// Network first, so the HTML and the files it uses always come from the same version.
// (beware: the cache will grow and grow; there's no cleanup)
const cacheName = 'files';

// Take over from a previous version right away, instead of waiting for all tabs to close
addEventListener('install', () => skipWaiting());
addEventListener('activate', activateEvent => activateEvent.waitUntil(clients.claim()));

addEventListener('fetch',  fetchEvent => {
  const request = fetchEvent.request;
  if (request.method !== 'GET') { return }

  fetchEvent.respondWith(async function() {
    try {
      // no-cache: always check with the server, instead of using the browser's own cached copy
      const responseFromFetch = await fetch(request, { cache: 'no-cache' });
      const responseCopy = responseFromFetch.clone();

      fetchEvent.waitUntil(async function() {
        const myCache = await caches.open(cacheName);
        await myCache.put(request, responseCopy);
      }());

      return responseFromFetch;
    } catch (error) {
      const responseFromCache = await caches.match(request);
      return responseFromCache || Response.error();
    }
  }());
});
