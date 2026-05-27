import { readFile, writeFile } from "node:fs/promises";

const VERSION = 68;

async function patchTextFile(filePath, patcher) {
  const input = await readFile(filePath, "utf8");
  const output = patcher(input);
  if (output !== input) {
    await writeFile(filePath, output, "utf8");
  }
}

function ensureIndex(html) {
  return html
    .replace(/styles\.css\?v=\d+/g, `styles.css?v=${VERSION}`)
    .replace(/app\.js\?v=\d+/g, `app.js?v=${VERSION}`);
}

function ensureApp(app) {
  return app
    .split('$("[data-set-route]").forEach').join('$$("[data-set-route]").forEach')
    .split('$("[data-delete-route]").forEach').join('$$("[data-delete-route]").forEach')
    .split('$("[data-delete-puzzle]").forEach').join('$$("[data-delete-puzzle]").forEach');
}

await patchTextFile("index.html", ensureIndex);
await patchTextFile("app.js", ensureApp);
await patchTextFile("service-worker.js", (worker) => worker.replace(/escape-erezee-v\d+/g, `escape-erezee-v${VERSION}`));

console.log("Delete listeners v68 applique.");
