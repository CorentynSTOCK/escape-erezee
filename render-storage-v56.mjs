import { readFile, writeFile } from "node:fs/promises";

const VERSION = 56;

async function patchTextFile(filePath, patcher) {
  const input = await readFile(filePath, "utf8");
  const output = patcher(input);
  if (output !== input) {
    await writeFile(filePath, output, "utf8");
  }
}

function ensureAppStorage(app) {
  if (!app.includes("const appStorageFallback = new Map();")) {
    app = app.replaceAll("localStorage.", "appStorage.");
    app = app.replace(
      `const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => Array.from(document.querySelectorAll(selector));
`,
      `const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => Array.from(document.querySelectorAll(selector));

const appStorageFallback = new Map();
const appStorage = {
  getItem(key) {
    try {
      const value = globalThis.localStorage?.getItem(key);
      return value ?? appStorageFallback.get(key) ?? null;
    } catch {
      return appStorageFallback.get(key) ?? null;
    }
  },
  setItem(key, value) {
    appStorageFallback.set(key, String(value));
    try {
      globalThis.localStorage?.setItem(key, String(value));
    } catch {}
  },
  removeItem(key) {
    appStorageFallback.delete(key);
    try {
      globalThis.localStorage?.removeItem(key);
    } catch {}
  },
};
`,
    );
  }
  return app;
}

await patchTextFile("index.html", (html) => html
  .replace(/styles\.css\?v=\d+/g, `styles.css?v=${VERSION}`)
  .replace(/app\.js\?v=\d+/g, `app.js?v=${VERSION}`));

await patchTextFile("app.js", ensureAppStorage);

await patchTextFile("service-worker.js", (worker) => worker
  .replace(/escape-erezee-v\d+/g, `escape-erezee-v${VERSION}`));

console.log("Storage fallback v56 appliqué.");
