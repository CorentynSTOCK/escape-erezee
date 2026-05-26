import { readFile, writeFile } from "node:fs/promises";

const VERSION = 59;

async function patchTextFile(filePath, patcher) {
  const input = await readFile(filePath, "utf8");
  const output = patcher(input);
  if (output !== input) {
    await writeFile(filePath, output, "utf8");
  }
}

function fixAppScript(app) {
  let next = app;

  next = next
    .split(`const $ = (selector) => document.querySelector(selector);
const $ = (selector) => Array.from(document.querySelectorAll(selector));`)
    .join(`const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => Array.from(document.querySelectorAll(selector));`)
    .split(`$("[data-map-zoom]").forEach`)
    .join(`$$("[data-map-zoom]").forEach`);

  next = next.replace(/\$\(("[^"\n]+"|'[^'\n]+')\)\.forEach/g, "$$($1).forEach");

  if (!next.includes("window.addEventListener(\"error\"")) {
    next = next.replace(
      `const $$ = (selector) => Array.from(document.querySelectorAll(selector));`,
      `const $$ = (selector) => Array.from(document.querySelectorAll(selector));

window.addEventListener("error", (event) => {
  console.error("Erreur application", event.message);
});`,
    );
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

await patchTextFile("index.html", (html) => html
  .replace(/styles\.css\?v=\d+/g, `styles.css?v=${VERSION}`)
  .replace(/app\.js\?v=\d+/g, `app.js?v=${VERSION}`));

await patchTextFile("app.js", fixAppScript);
await patchTextFile("service-worker.js", fixServiceWorker);

console.log("Public rescue v59 applique.");
