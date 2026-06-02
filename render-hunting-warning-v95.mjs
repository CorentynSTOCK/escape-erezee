import { readFile, writeFile } from "node:fs/promises";

const VERSION = 95;

const appWarning = `
          <section class="hunting-warning" data-hunting-warning-v${VERSION} aria-label="Prudence pendant les périodes de chasse">
            <strong>Prudence pendant les périodes de chasse</strong>
            <p>Avant de partir, vérifiez les informations locales, respectez les panneaux sur place et les chemins fermés. Si une battue ou une zone interdite est signalée, reportez le parcours.</p>
          </section>
`;

const seoWarning = `
      <section class="seo-hunting-warning" data-hunting-warning-v${VERSION} aria-label="Prudence pendant les périodes de chasse">
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

function patchIndex(html) {
  let next = html
    .replace(/styles\.css\?v=\d+/g, `styles.css?v=${VERSION}`)
    .replace(/app\.js\?v=\d+/g, `app.js?v=${VERSION}`);

  if (!next.includes(`data-hunting-warning-v${VERSION}`)) {
    const homeMarker = '          <section class="home-seo-reviews"';
    const shopMarker = '          <section class="shop-panel"';
    if (!next.includes(homeMarker) || !next.includes(shopMarker)) {
      throw new Error("Insertion avertissement chasse introuvable");
    }
    next = next.replace(homeMarker, `${appWarning}${homeMarker}`);
    next = next.replace(shopMarker, `${appWarning}${shopMarker}`);
  }

  return next;
}

function patchStyles(css) {
  const marker = `/* render-hunting-warning-v${VERSION} */`;
  if (css.includes(marker)) return css;
  return `${css.trimEnd()}

${marker}
.hunting-warning {
  margin: 0 clamp(20px, 4vw, 48px) clamp(18px, 3vw, 30px);
  padding: 16px 18px;
  border: 1px solid rgba(216, 148, 44, 0.55);
  border-radius: var(--radius);
  background: #fff8e8;
  color: #2a2112;
}

.shop-view .hunting-warning {
  margin-inline: 0;
}

.hunting-warning strong {
  display: block;
  margin-bottom: 6px;
  font-weight: 900;
}

.hunting-warning p {
  margin: 0;
  line-height: 1.55;
}
`;
}

function patchSeoPage(html) {
  if (html.includes(`data-hunting-warning-v${VERSION}`)) return html;
  const marker = "<main>\n";
  if (!html.includes(marker)) throw new Error("Insertion avertissement SEO introuvable");
  return html.replace(marker, `${marker}${seoWarning}`);
}

function patchSeoCss(css) {
  const marker = `/* render-hunting-warning-v${VERSION} */`;
  if (css.includes(marker)) return css;
  return `${css.trimEnd()}

${marker}
.seo-hunting-warning {
  margin: 0 0 26px;
  padding: 16px 18px;
  border: 1px solid rgba(216, 148, 44, 0.55);
  border-radius: 8px;
  background: #fff8e8;
  color: #2a2112;
}

.seo-hunting-warning strong {
  display: block;
  margin-bottom: 6px;
  font-weight: 900;
}

.seo-hunting-warning p {
  margin: 0;
  line-height: 1.55;
}
`;
}

function patchServiceWorker(worker) {
  return worker
    .replace(/escape-erezee-v\d+/g, `escape-erezee-v${VERSION}`)
    .replace(/"\.\/styles\.css(?:\?v=\d+)?"/g, `"./styles.css?v=${VERSION}"`)
    .replace(/"\.\/app\.js(?:\?v=\d+)?"/g, `"./app.js?v=${VERSION}"`);
}

await patchTextFile("index.html", patchIndex);
await patchTextFile("styles.css", patchStyles);
await patchTextFile("seo-pages.css", patchSeoCss);
for (const file of seoFiles) await patchTextFile(file, patchSeoPage);
await patchTextFile("service-worker.js", patchServiceWorker);
console.log(`Hunting warning patch v${VERSION} applied.`);
