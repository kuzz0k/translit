// Service worker: lets the app open without internet.
// This is a template — vite.config.js fills in the file list on build.
// Site files come from the network first (always fresh after a deploy),
// and from the cache when offline. Fonts are cached once.

const CACHE = 'translit-__VERSION__';

const APP_FILES = __APP_FILES__;

const FONT_HOSTS = ['fonts.googleapis.com', 'fonts.gstatic.com'];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE)
            .then((cache) => cache.addAll(APP_FILES))
            .then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys()
            .then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
            .then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (event) => {
    const request = event.request;
    if (request.method !== 'GET') return;

    const url = new URL(request.url);

    // Fonts: cache first, then network
    if (FONT_HOSTS.includes(url.hostname)) {
        event.respondWith(
            caches.match(request).then((cached) => cached || fetch(request).then((response) => {
                if (response.ok || response.type === 'opaque') {
                    const copy = response.clone();
                    caches.open(CACHE).then((cache) => cache.put(request, copy));
                }
                return response;
            }))
        );
        return;
    }

    if (url.origin !== self.location.origin) return;

    // Site files: network first, cache when offline
    event.respondWith(
        fetch(request)
            .then((response) => {
                if (response.ok) {
                    const copy = response.clone();
                    caches.open(CACHE).then((cache) => cache.put(request, copy));
                }
                return response;
            })
            .catch(() =>
                caches.match(request, { ignoreSearch: true })
                    .then((cached) => cached || (request.mode === 'navigate' ? caches.match('./') : undefined))
                    .then((cached) => cached || Response.error())
            )
    );
});
