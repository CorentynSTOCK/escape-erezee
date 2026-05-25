import { readFile, writeFile } from "node:fs/promises";

const VERSION = 51;

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
      ".shop-route-card {\n  display: grid;",
      ".shop-route-card {\n  container-type: inline-size;\n  display: grid;",
    )
    .replace(
      "grid-template-columns: minmax(140px, 180px) 1fr minmax(150px, 190px);",
      "grid-template-columns: minmax(0, 1fr) minmax(118px, 160px);",
    )
    .replace(
      ".shop-buy-form label {\n  display: grid;",
      ".shop-buy-form label {\n  display: grid;\n  grid-column: 1 / -1;",
    )
    .replace(
      ".shop-buy-form strong {\n  color: var(--green);\n  font-size: 1.35rem;\n}",
      ".shop-buy-form strong {\n  min-width: 0;\n  align-self: center;\n  color: var(--green);\n  font-size: 1.35rem;\n}",
    );

  if (!next.includes("@container (min-width: 620px)")) {
    next = next.replace(
      ".shop-empty {",
      `.shop-buy-form .full-button {
  min-width: 0;
}

.shop-buy-form .form-message {
  grid-column: 1 / -1;
  margin-top: 0;
}

@container (min-width: 620px) {
  .shop-buy-form {
    grid-template-columns: minmax(140px, 180px) minmax(0, 1fr) minmax(150px, 190px);
  }

  .shop-buy-form label {
    grid-column: auto;
  }
}

.shop-empty {`,
    );
  }

  return next;
});

await patchTextFile("service-worker.js", (worker) => worker
  .replace(/escape-erezee-v\d+/g, `escape-erezee-v${VERSION}`));
