import { access, readFile, writeFile } from "node:fs/promises";

const VERSION = 84;

async function patchTextFile(filePath, patcher) {
  const input = await readFile(filePath, "utf8");
  const output = patcher(input);
  if (output !== input) await writeFile(filePath, output, "utf8");
}

async function patchIfExists(filePath, patcher) {
  try { await access(filePath); } catch { return; }
  await patchTextFile(filePath, patcher);
}

function patchServer(server) {
  const oldText = '["name", "routeId", "code"].forEach((field) => {';
  const newText = '["id", "name", "routeId", "code"].forEach((field) => {';
  if (server.includes(newText)) return server;
  if (!server.includes(oldText)) {
    throw new Error(`Patch v${VERSION} introuvable: champs equipe joueur`);
  }
  return server.replace(oldText, newText);
}

function patchHtml(html) {
  return html
    .replace(/app\.js\?v=\d+/g, `app.js?v=${VERSION}`)
    .replace(/styles\.css\?v=\d+/g, `styles.css?v=${VERSION}`);
}

function patchServiceWorker(worker) {
  let next = worker.replace(/escape-erezee-v\d+/g, `escape-erezee-v${VERSION}`);
  next = next.replace(/"\.\/app\.js(?:\?v=\d+)?"/g, `"./app.js?v=${VERSION}"`);
  next = next.replace(/"\.\/styles\.css(?:\?v=\d+)?"/g, `"./styles.css?v=${VERSION}"`);
  return next;
}

await patchTextFile("server.mjs", patchServer);
await patchIfExists("index.html", patchHtml);
await patchIfExists("suivi.html", patchHtml);
await patchTextFile("service-worker.js", patchServiceWorker);
console.log("Player team id merge v84 applied.");
