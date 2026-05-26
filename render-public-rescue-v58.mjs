import { readFile, writeFile } from "node:fs/promises";

const VERSION = 58;

async function patchTextFile(filePath, patcher) {
  const input = await readFile(filePath, "utf8");
  const output = patcher(input);
  if (output !== input) {
    await writeFile(filePath, output, "utf8");
  }
}

function fixAppScript(app) {
  return app
    .split(`const $ = (selector) => document.querySelector(selector);
const $ = (selector) => Array.from(document.querySelectorAll(selector));`)
    .join(`const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => Array.from(document.querySelectorAll(selector));`)
    .split(`$("[data-map-zoom]").forEach`)
    .join(`$$("[data-map-zoom]").forEach`);
}

await patchTextFile("index.html", (html) => html
  .replace(/styles\.css\?v=\d+/g, `styles.css?v=${VERSION}`)
  .replace(/app\.js\?v=\d+/g, `app.js?v=${VERSION}`));

await patchTextFile("app.js", fixAppScript);

await patchTextFile("service-worker.js", (worker) =>
  worker.replace(/escape-erezee-v\d+/g, `escape-erezee-v${VERSION}`),
);

console.log("Public rescue v58 applique.");
