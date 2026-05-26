import { readFile, writeFile } from "node:fs/promises";

const VERSION = 52;

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
      ".brand-logo-mark {\n  overflow: hidden;\n  background: #111c1a;\n}",
      ".brand-logo-mark {\n  overflow: hidden;\n  padding: 3px;\n  background: #111c1a;\n}",
    )
    .replace(
      ".brand-logo-mark img {\n  width: 100%;\n  height: 100%;\n  object-fit: cover;\n}",
      ".brand-logo-mark img {\n  width: 100%;\n  height: 100%;\n  object-fit: contain;\n  clip-path: none;\n}",
    )
    .replace(
      "/* logo-artifact-crop */\n.home-hero-logo,\n.brand-logo-mark img {\n  clip-path: inset(0 10px 8px 0);\n}",
      "/* logo-artifact-crop */\n.home-hero-logo {\n  clip-path: inset(0 10px 8px 0);\n}",
    );

  if (!next.includes(".brand-logo-mark img {\n  width: 100%;\n  height: 100%;\n  object-fit: contain;\n  clip-path: none;\n}")) {
    next = next.replace(
      ".brand-logo-mark img {\n  width: 100%;\n  height: 100%;\n  object-fit: contain;\n}",
      ".brand-logo-mark img {\n  width: 100%;\n  height: 100%;\n  object-fit: contain;\n  clip-path: none;\n}",
    );
  }

  return next;
});

await patchTextFile("service-worker.js", (worker) => worker
  .replace(/escape-erezee-v\d+/g, `escape-erezee-v${VERSION}`));
