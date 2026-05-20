import { readFile, writeFile } from "node:fs/promises";

const INDEX_FILE = new URL("./index.html", import.meta.url);
const SERVICE_WORKER_FILE = new URL("./service-worker.js", import.meta.url);

async function patchFile(fileUrl, patcher) {
  const original = await readFile(fileUrl, "utf8");
  const patched = patcher(original);
  if (patched !== original) {
    await writeFile(fileUrl, patched, "utf8");
  }
}

await patchFile(INDEX_FILE, (code) => code
  .replace(/styles\.css\?v=\d+/g, "styles.css?v=27")
  .replace(/app\.js\?v=\d+/g, "app.js?v=27"));

await patchFile(SERVICE_WORKER_FILE, (code) => code.replace(/escape-erezee-v\d+/, "escape-erezee-v27"));
