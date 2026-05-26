import { readFile, writeFile } from "node:fs/promises";

const VERSION = 53;

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

await patchTextFile("styles.css", (css) => {
  let next = css
    .replace(
      ".brand {\n  display: grid;\n  grid-template-columns: 48px 1fr;\n  align-items: center;\n  gap: 12px;\n}",
      ".brand {\n  display: grid;\n  grid-template-columns: 1fr;\n  align-items: center;\n  gap: 4px;\n}",
    )
    .replace(
      ".brand-logo-mark {\n  overflow: hidden;\n  padding: 3px;\n  background: #111c1a;\n}\n\n.brand-logo-mark img {\n  width: 100%;\n  height: 100%;\n  object-fit: contain;\n  clip-path: none;\n}",
      ".brand-logo-mark {\n  display: none;\n}",
    )
    .replace(
      ".brand-logo-mark {\n  overflow: hidden;\n  background: #111c1a;\n}\n\n.brand-logo-mark img {\n  width: 100%;\n  height: 100%;\n  object-fit: cover;\n}",
      ".brand-logo-mark {\n  display: none;\n}",
    );

  return next;
});

await patchTextFile("service-worker.js", (worker) => worker
  .replace(/escape-erezee-v\d+/g, `escape-erezee-v${VERSION}`));
