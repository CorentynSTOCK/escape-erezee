import { readFile, writeFile } from "node:fs/promises";

const VERSION = 57;

async function patchTextFile(filePath, patcher) {
  const input = await readFile(filePath, "utf8");
  const output = patcher(input);
  if (output !== input) {
    await writeFile(filePath, output, "utf8");
  }
}

await patchTextFile("index.html", (html) => html
  .replace(/styles\.css\?v=\d+/g, `styles.css?v=${VERSION}`)
  .replace(/app\.js\?v=\d+/g, `app.js?v=${VERSION}`));

await patchTextFile("app.js", (app) => app.replace(
  `const $ = (selector) => document.querySelector(selector);
const $ = (selector) => Array.from(document.querySelectorAll(selector));`,
  () => `const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => Array.from(document.querySelectorAll(selector));`,
));

await patchTextFile("service-worker.js", (worker) =>
  worker.replace(/escape-erezee-v\d+/g, `escape-erezee-v${VERSION}`),
);

console.log("Dollar selector fix v57 applique.");
