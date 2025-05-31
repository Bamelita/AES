const CACHE_NAME = "aes-cache-v1";
const urlsToCache = [
  "index.html",
  "manifest.json",
  "icons/icon-192.png",
  "icons/icon-512.png",
  "https://cdn.jsdelivr.net/npm/crypto-js@4.1.1/crypto-js.min.js",
  "fondo.jpg"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(urlsToCache);
    })
  );
});

self.addEventListener("fetch", event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  );
});
