/* 마루 비서실 service worker
   - data/status.json : network-first (항상 최신, 실패하면 캐시)
   - 정적 파일        : cache-first (offline/instant)
*/
var VERSION = 'maru-office-v1';
var STATIC_CACHE = VERSION + '-static';
var DATA_CACHE = VERSION + '-data';
var PRECACHE = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './manifest.json',
  './assets/office.png',
  './assets/icon-192.png',
  './assets/icon-512.png',
  './assets/icon-180.png'
];

self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(function (cache) { return cache.addAll(PRECACHE); })
      .then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.map(function (k) {
        if (k !== STATIC_CACHE && k !== DATA_CACHE) return caches.delete(k);
      }));
    }).then(function () { return self.clients.claim(); })
  );
});

function isStatus(url) {
  return url.pathname.indexOf('/data/status.json') !== -1;
}

self.addEventListener('fetch', function (event) {
  var req = event.request;
  if (req.method !== 'GET') return;

  var url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // status.json — network-first, 캐시로 폴백
  if (isStatus(url)) {
    event.respondWith(
      fetch(req)
        .then(function (res) {
          var copy = res.clone();
          caches.open(DATA_CACHE).then(function (c) { c.put('./data/status.json', copy); });
          return res;
        })
        .catch(function () {
          return caches.match('./data/status.json').then(function (hit) {
            return hit || new Response('{"offline":true}', { headers: { 'Content-Type': 'application/json' } });
          });
        })
    );
    return;
  }

  // 그 외 정적 자원 — cache-first
  event.respondWith(
    caches.match(req).then(function (hit) {
      if (hit) return hit;
      return fetch(req).then(function (res) {
        if (res && res.status === 200 && res.type === 'basic') {
          var copy = res.clone();
          caches.open(STATIC_CACHE).then(function (c) { c.put(req, copy); });
        }
        return res;
      }).catch(function () {
        if (req.mode === 'navigate') return caches.match('./index.html');
      });
    })
  );
});
