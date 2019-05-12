// HTML files: try the network first, then the cache.
// Other files: try the cache first, then the network.
// Both: cache a fresh version if possible.
// (beware: the cache will grow and grow; there's no cleanup)
const cacheName = 'files';

addEventListener('fetch',  fetchEvent => {
  const request = fetchEvent.request;
  if (request.method !== 'GET') { return }

  fetchEvent.respondWith(async function() {
    const responseFromFetch = fetch(request);

    fetchEvent.waitUntil(async function() {
      const responseCopy = (await responseFromFetch).clone();
      const myCache = await caches.open(cacheName);
      await myCache.put(request, responseCopy);
    }());

    const responseFromCache = await caches.match(request);
    return responseFromCache || responseFromFetch;
  }());
});
