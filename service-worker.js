const CACHE_NAME = "escape-erezee-v200";
const APP_SHELL = [
  "./",
  "./index.html",
  "./styles.css?v=198",
  "./app.js?v=200",
  "./manifest.webmanifest",
  "./assets/icon.svg",
  "./assets/home-hero-vicinal-v90.jpg?v=90",
  "./assets/logo-stock-sevrin-v90.jpg?v=90",
  "./assets/logo-escape.jpg?v=42",
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);
  const isApiRequest = url.pathname.startsWith("/api/");
  const isPublicApiRequest = url.pathname.startsWith("/api/public/");
  const isVersionedAsset = /\.(?:js|css)$/.test(url.pathname) && url.searchParams.has("v");

  if (isApiRequest) {
    event.respondWith(fetch(event.request, { cache: isPublicApiRequest ? "default" : "no-store" }));
    return;
  }

  if (isVersionedAsset) {
    event.respondWith(caches.match(event.request).then((cached) => cached || fetch(event.request)));
    return;
  }

  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request).catch(() => caches.match("./index.html")),
    );
    return;
  }

  event.respondWith(caches.match(event.request).then((cached) => cached || fetch(event.request)));
});
