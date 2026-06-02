import { readFile, writeFile } from "node:fs/promises";

const VERSION = 96;

const shopWarning = `
              <section class="hunting-warning shop-hunting-warning" data-hunting-warning-v${VERSION} aria-label="Prudence pendant les périodes de chasse">
                <strong>Prudence pendant les périodes de chasse</strong>
                <p>Avant de partir, vérifiez les informations locales, respectez les panneaux sur place et les chemins fermés. Si une battue ou une zone interdite est signalée, reportez le parcours.</p>
              </section>
`;

const seoFiles = [
  "escape-game-exterieur-ardenne.html",
  "activite-famille-ardenne.html",
  "chasse-au-tresor-ardenne.html",
  "activite-touristique-erezee.html",
  "activite-pres-de-durbuy.html",
  "blog/index.html",
  "blog/que-faire-a-erezee.html",
  "blog/que-faire-pres-de-durbuy.html",
  "blog/activites-familiales-ardenne-belge.html",
  "blog/top-10-activites-exterieures-ardenne.html",
  "blog/que-faire-vacances-ardenne.html",
];

async function patchTextFile(filePath, patcher) {
  const input = await readFile(filePath, "utf8");
  const output = patcher(input);
  if (output !== input) await writeFile(filePath, output, "utf8");
}

function removeHuntingWarnings(html) {
  return html
    .replace(/\s*<section class="hunting-warning" data-hunting-warning-v95[\s\S]*?<\/section>\s*/g, "\n")
    .replace(/\s*<section class="seo-hunting-warning" data-hunting-warning-v95[\s\S]*?<\/section>\s*/g, "\n")
    .replace(/\s*<section class="hunting-warning shop-hunting-warning" data-hunting-warning-v96[\s\S]*?<\/section>\s*/g, "\n");
}

function patchIndex(html) {
  let next = removeHuntingWarnings(html)
    .replace(/styles\.css\?v=\d+/g, `styles.css?v=${VERSION}`)
    .replace(/app\.js\?v=\d+/g, `app.js?v=${VERSION}`);

  const marker = '            <div class="shop-list" id="shop-list"></div>';
  if (!next.includes(marker)) throw new Error("Liste des parcours introuvable");
  return next.replace(marker, `${marker}${shopWarning}`);
}

function patchStyles(css) {
  const marker = `/* render-hunting-warning-placement-v${VERSION} */`;
  if (css.includes(marker)) return css;
  return `${css.trimEnd()}

${marker}
.shop-hunting-warning {
  margin: 18px 0 0;
}
`;
}

function patchSeoPage(html) {
  return removeHuntingWarnings(html);
}

function patchServiceWorker(worker) {
  return worker
    .replace(/escape-erezee-v\d+/g, `escape-erezee-v${VERSION}`)
    .replace(/"\.\/styles\.css(?:\?v=\d+)?"/g, `"./styles.css?v=${VERSION}"`)
    .replace(/"\.\/app\.js(?:\?v=\d+)?"/g, `"./app.js?v=${VERSION}"`);
}

await patchTextFile("index.html", patchIndex);
await patchTextFile("styles.css", patchStyles);
for (const file of seoFiles) await patchTextFile(file, patchSeoPage);
await patchTextFile("service-worker.js", patchServiceWorker);
console.log(`Hunting warning placement v${VERSION} applied.`);
