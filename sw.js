// Réseau d'abord : en ligne, on sert toujours la dernière version publiée ; hors ligne, le cache prend le relais.
const CACHE = 'cookexpert-app-v6';
const FICHIERS = [
  './', 'index.html', 'css/style.css', 'manifest.webmanifest',
  'js/app.js', 'js/robot.js', 'js/balance.js', 'js/stockage.js', 'js/version.js',
  'lib/protocole.js', 'lib/balance.js', 'lib/conversion.js',
  'icons/icon.svg', 'icons/icon-192.png', 'icons/icon-512.png',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FICHIERS.map((f) => new Request(f, { cache: 'reload' })))).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((cles) => Promise.all(cles.filter((c) => c !== CACHE).map((c) => caches.delete(c))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin) return;
  e.respondWith(
    fetch(e.request, { cache: 'no-cache' })
      .then((r) => {
        if (r.ok) {
          const copie = r.clone();
          caches.open(CACHE).then((c) => c.put(e.request, copie));
        }
        return r;
      })
      .catch(() => caches.match(e.request, { ignoreSearch: true })),
  );
});

self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  e.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((l) => (l[0] ? l[0].focus() : self.clients.openWindow('./'))),
  );
});
