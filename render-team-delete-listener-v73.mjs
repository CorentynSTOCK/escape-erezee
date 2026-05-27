import { readFile, writeFile } from "node:fs/promises";

const VERSION = 73;

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
  return app.split('$("[data-delete-team]").forEach').join('$$("[data-delete-team]").forEach');
}

await patchTextFile("index.html", ensureIndex);
await patchTextFile("app.js", ensureApp);
await patchTextFile("service-worker.js", (worker) => worker.replace(/escape-erezee-v\d+/g, `escape-erezee-v${VERSION}`));

console.log("Team delete listener v73 applique.");
