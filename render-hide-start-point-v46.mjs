import { readFile, writeFile } from "node:fs/promises";

async function patchTextFile(path, updater) {
  const before = await readFile(path, "utf8");
  const after = updater(before);
  if (after !== before) {
    await writeFile(path, after, "utf8");
  }
}

await patchTextFile("index.html", (html) => html
  .replace(/styles\.css\?v=\d+/g, "styles.css?v=46")
  .replace(/app\.js\?v=\d+/g, "app.js?v=46"));

await patchTextFile("service-worker.js", (worker) => worker
  .replace(/escape-erezee-v\d+/g, "escape-erezee-v46"));

await patchTextFile("app.js", (source) => source
  .replace(
    'els.startPointCard?.classList.toggle("is-hidden", true);',
    'els.startPointCard?.classList.toggle("is-hidden", !isBriefing);',
  )
  .replace(
    'els.startPointCard?.classList.toggle("is-hidden", isBriefing || gameFinished);',
    'els.startPointCard?.classList.toggle("is-hidden", !isBriefing);',
  ));

await patchTextFile("styles.css", (source) => {
  if (source.includes(".start-point-card.is-hidden")) return source;
  return source.replace(
    `.start-point-card {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 12px;
  align-items: center;
  padding: 14px;
  border: 1px solid var(--line);
  border-radius: var(--radius);
  background: #ffffff;
}
`,
    `.start-point-card {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 12px;
  align-items: center;
  padding: 14px;
  border: 1px solid var(--line);
  border-radius: var(--radius);
  background: #ffffff;
}

.start-point-card.is-hidden {
  display: none;
}
`,
  );
});
