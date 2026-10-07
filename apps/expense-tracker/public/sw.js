// Bumping the version drops every older cache on activate.
const CACHE_NAME = "expense-tracker-v2";
const OFFLINE_URL = "/offline";
const PRECACHE = [
  OFFLINE_URL,
  "/manifest.json",
  "/icon-192.png",
  "/icon-512.png",
  "/apple-touch-icon.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((names) =>
        Promise.all(names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n)))
      )
      .then(() => self.clients.claim())
  );
});

const isStaticAsset = (url) =>
  url.pathname.startsWith("/_next/static/") ||
  /\.(?:png|svg|jpg|jpeg|webp|ico|woff2?|mp4)$/.test(url.pathname);

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Server actions (POST), Supabase, Gemini and other origins always go to the network.
  if (request.method !== "GET" || url.origin !== self.location.origin) return;

  // Pages hold private, signed-in data, so they are never cached; offline shows a fallback.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(() =>
        caches.match(OFFLINE_URL).then((page) => page || Response.error())
      )
    );
    return;
  }

  // Build output is content-hashed, so a cached copy can never be stale.
  if (isStaticAsset(url)) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((response) => {
            if (response.ok) {
              const copy = response.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
            }
            return response;
          })
      )
    );
  }
});
