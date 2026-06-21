const CACHE = 'gc-v6';
const ASSETS = [
  './',
  './index.html',
  './css/style.css',
  './js/data.js',
  './js/app.js',
  './img/grandure-connect.png',
  './img/icon-192.png',
  './img/icon-512.png',
  './img/aisha.jpeg',
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  // Network-first for all app assets so updates (including new images) always load fresh
  e.respondWith(
    fetch(e.request)
      .then(res => {
        const clone = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, clone));
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});
