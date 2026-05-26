import { readFile, writeFile } from "node:fs/promises";

const VERSION = 61;

async function patchTextFile(filePath, patcher) {
  const input = await readFile(filePath, "utf8");
  const output = patcher(input);
  if (output !== input) {
    await writeFile(filePath, output, "utf8");
  }
}

const CRITICAL_STYLE = `    <style id="critical-public-fallback">
      #home-view.is-active { display: block; }
      body:not(.app-loaded) #home-view.is-active { display: block; }
    </style>`;

const FALLBACK_BOOT = `    <script id="public-fallback-boot">
      (function () {
        function showHomeIfNeeded() {
          var home = document.getElementById("home-view");
          if (!home) return;
          if (!document.querySelector(".view.is-active")) {
            home.classList.add("is-active");
          }
        }
        window.addEventListener("DOMContentLoaded", showHomeIfNeeded);
        window.addEventListener("error", function () { setTimeout(showHomeIfNeeded, 0); });
        setTimeout(showHomeIfNeeded, 250);
        setTimeout(showHomeIfNeeded, 1200);
      }());
    </script>`;

function ensureIndexFallback(html) {
  let next = html
    .replace(/styles\.css\?v=\d+/g, `styles.css?v=${VERSION}`)
    .replace(/app\.js\?v=\d+/g, `app.js?v=${VERSION}`);

  next = next.replace(
    /<section class="view home-view(?![^\"]*is-active)" id="home-view"/,
    '<section class="view home-view is-active" id="home-view"',
  );

  if (!next.includes('id="critical-public-fallback"')) {
    next = next.replace("  </head>", `${CRITICAL_STYLE}\n  </head>`);
  }

  if (!next.includes('id="public-fallback-boot"')) {
    next = next.replace("  </body>", `${FALLBACK_BOOT}\n  </body>`);
  }

  return next;
}

function hardenApp(app) {
  return app
    .split(`const $ = (selector) => document.querySelector(selector);
const $ = (selector) => Array.from(document.querySelectorAll(selector));`)
    .join(`const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => Array.from(document.querySelectorAll(selector));`)
    .split(`$("[data-map-zoom]").forEach`)
    .join(`$$("[data-map-zoom]").forEach`)
    .replaceAll(`element.classList.toggle("is-active", name === view);`, `element?.classList?.toggle("is-active", name === view);`)
    .replaceAll(`link.classList.toggle("is-active", link.dataset.route === view);`, `link?.classList?.toggle("is-active", link.dataset.route === view);`)
    .replace(
      `function render() {
  renderPlayer();
  renderAdmin();
  renderMonitor();
}`,
      `function render() {
  document.body.classList.add("app-loaded");
  renderPlayer();
  renderAdmin();
  renderMonitor();
}`,
    );
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

await patchTextFile("index.html", ensureIndexFallback);
await patchTextFile("app.js", hardenApp);
await patchTextFile("service-worker.js", fixServiceWorker);

console.log("Public fallback v61 applique.");
