const CACHE_VERSION = 'santinhohunter-shell-v2';
const APP_SHELL = [
  '/',
  '/hunt',
  '/manifest.webmanifest',
  '/icon-192.png',
  '/icon-512.png',
];
const PRIVATE_PATH_PREFIXES = [
  '/api/',
  '/candidate-photos/',
  '/candidates/',
  '/captures',
  '/matches',
  '/rankings',
  '/admin',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then(async (cache) => {
      await Promise.allSettled(APP_SHELL.map((path) => cache.add(path)));
      await self.skipWaiting();
    }),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== CACHE_VERSION).map((key) => caches.delete(key))),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  if (
    request.method !== 'GET' ||
    url.origin !== self.location.origin ||
    PRIVATE_PATH_PREFIXES.some((prefix) => url.pathname.startsWith(prefix))
  ) {
    return;
  }

  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(request));
    return;
  }

  if (isStaticAsset(url.pathname)) {
    event.respondWith(cacheFirst(request));
  }
});

function isStaticAsset(pathname) {
  return (
    pathname.startsWith('/_expo/') ||
    pathname.startsWith('/assets/') ||
    pathname === '/manifest.webmanifest' ||
    pathname === '/icon-192.png' ||
    pathname === '/icon-512.png'
  );
}

async function networkFirst(request) {
  const cache = await caches.open(CACHE_VERSION);
  try {
    const response = await fetch(request);
    if (response.ok) {
      await cache.put(request, response.clone());
    }
    return response;
  } catch {
    return (await cache.match(request)) || (await cache.match('/')) || Response.error();
  }
}

async function cacheFirst(request) {
  const cache = await caches.open(CACHE_VERSION);
  const cached = await cache.match(request);
  if (cached) {
    return cached;
  }

  const response = await fetch(request);
  if (response.ok) {
    await cache.put(request, response.clone());
  }
  return response;
}
