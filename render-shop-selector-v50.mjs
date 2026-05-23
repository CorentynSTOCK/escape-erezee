import { readFile, writeFile } from "node:fs/promises";

const VERSION = 50;

async function patchTextFile(path, updater) {
  const before = await readFile(path, "utf8");
  const after = updater(before);
  if (after !== before) {
    await writeFile(path, after, "utf8");
  }
}

await patchTextFile("index.html", (html) => html
  .replace(/styles\.css\?v=\d+/g, `styles.css?v=${VERSION}`)
  .replace(/app\.js\?v=\d+/g, `app.js?v=${VERSION}`));

await patchTextFile("app.js", (app) => app
  .replace(/\$\("\[data-shop-player-count\]"\)\.map/g, () => '$$("[data-shop-player-count]").map'));

await patchTextFile("service-worker.js", (worker) => worker
  .replace(/escape-erezee-v\d+/g, `escape-erezee-v${VERSION}`));
