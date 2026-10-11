const CACHE_VERSION = 'flour-v3';
const CACHE_FILES = [
  './',
  './latest.json',
  './manifest.json',
  './icon-192.jpg',
  './icon-512.jpg'
];

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_VERSION).then(cache => 
      cache.addAll(CACHE_FILES).catch(e => console.log(e))
    )
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => 
      Promise.all(
        keys.filter(k => k !== CACHE_VERSION).map(k => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  const url = event.request.url;
  
  // ✅ index.html و latest.json — من الشبكة دائماً (network-first)
  if (url.includes('index.html') || url.includes('latest.json') || url.endsWith('/flour/') || url.endsWith('/flour')) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          const clone = response.clone();
          caches.open(CACHE_VERSION).then(cache => cache.put(event.request, clone));
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }
  
  // ✅ الملفات الأخرى (أيقونات، manifest) — Cache first
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        if (response && response.status === 200 && event.request.method === 'GET') {
          const clone = response.clone();
          caches.open(CACHE_VERSION).then(cache => cache.put(event.request, clone));
        }
        return response;
      });
    })
  );
});
