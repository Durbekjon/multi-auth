const CACHE_NAME = 'auth-app-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/faceid.html',
  '/qrcode.html',
  '/workers.html',
  '/documentation.html',
  '/assets/packs/css/bootstrap.min.css',
  '/assets/packs/css/font.css',
  '/assets/style/styles.css',
  '/assets/style/faceid.css',
  '/assets/packs/js/bootstrap.bundle.min.js',
  '/assets/packs/js/jsQR.js',
  '/assets/packs/js/face-api.js',
  '/assets/js/index.js',
  '/assets/js/faceid.js',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches
      .match(event.request)
      .then((response) => response || fetch(event.request))
  );
});
