// Only the public workbook is cached. No personal entries or third-party URLs enter CacheStorage.
const prefix = 'portfolio-renovation-workbook-';
const cacheName = prefix + '20261115-1';
const home = new URL('./', self.registration.scope);
const file = new URL('index.html', home);

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(cacheName);
    await cache.add(new Request(file.href, {cache: 'reload'}));
    await self.skipWaiting();
  })());
});
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    for (const key of await caches.keys()) {
      if (key.startsWith(prefix) && key !== cacheName) await caches.delete(key);
    }
    await self.clients.claim();
  })());
});
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || url.origin !== home.origin ||
      ![home.pathname, file.pathname].includes(url.pathname)) return;
  event.respondWith((async () => {
    try {
      const response = await fetch(event.request);
      if (response.ok) return response;
      if (response.status < 500) return response;
    } catch { /* The installed copy serves network failures. */ }
    return (await caches.open(cacheName)).match(file.href).then(cached => cached || Response.error());
  })());
});
