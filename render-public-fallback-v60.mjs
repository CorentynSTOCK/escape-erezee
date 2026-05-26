import { readFile, writeFile } from "node:fs/promises";

const VERSION = 60;

async function patchTextFile(filePath, patcher) {
  const input = await readFile(filePath, "utf8");
  const output = patcher(input);
  if (output !== input) {
    await writeFile(filePath, output, "utf8");
  }
}

function ensureHomeFallback(html) {
  let next = html
    .replace(/styles\.css\?v=\d+/g, `styles.css?v=${VERSION}`)
    .replace(/app\.js\?v=\d+/g, `app.js?v=${VERSION}`);

  next = next.replace(
    /<section class="view home-view(?![^\"]*is-active)" id="home-view"/,
    '<section class="view home-view is-active" id="home-view"',
  );

  return next;
}

function hardenApp(app) {
  let next = app
    .split(`const $ = (selector) => document.querySelector(selector);
const $ = (selector) => Array.from(document.querySelectorAll(selector));`)
    .join(`const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => Array.from(document.querySelectorAll(selector));`)
    .split(`$("[data-map-zoom]").forEach`)
    .join(`$$("[data-map-zoom]").forEach`);

  next = next
    .replaceAll(`element.classList.toggle("is-active", name === view);`, `element?.classList?.toggle("is-active", name === view);`)
    .replaceAll(`link.classList.toggle("is-active", link.dataset.route === view);`, `link?.classList?.toggle("is-active", link.dataset.route === view);`);

  return next;
}

function ensureStyleFallback(css) {
  let next = css;
  if (!next.includes("/* public-fallback-v60 */")) {
    next += `

/* public-fallback-v60 */
main:not(:has(.view.is-active)) #home-view {
  display: block;
}
`;
  }
  return next;
}

function fixServiceWorker(worker) {
  let next = worker.replace(/escape-erezee-v\d+/g, `escape-erezee-v${VERSION}`);
  if (!next.includes("NETWORK_FIRST_EXTENSIONS")) {
    next = next.replace(
      `self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;`,
      `const NETWORK_FIRST_EXTENSIONS = [".html", ".js", ".css", ".webmanifest"];

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;`,
    );
    next = next.replace(
      `  event.respondWith(caches.match(event.request).then((cached) => cached || fetch(event.request)));
});`,
      `  const requestUrl = new URL(event.request.url);
  const extension = requestUrl.pathname.slice(requestUrl.pathname.lastIndexOf("."));
  if (NETWORK_FIRST_EXTENSIONS.includes(extension)) {
    event.respondWith(fetch(event.request).catch(() => caches.match(event.request)));
    return;
  }
  event.respondWith(caches.match(event.request).then((cached) => cached || fetch(event.request)));
});`,
    );
  }
  return next;
}

await patchTextFile("index.html", ensureHomeFallback);
await patchTextFile("app.js", hardenApp);
await patchTextFile("styles.css", ensureStyleFallback);
await patchTextFile("service-worker.js", fixServiceWorker);

console.log("Public fallback v60 applique.");
