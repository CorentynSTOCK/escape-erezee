import { readFile, writeFile } from "node:fs/promises";

const VERSION = 111;
const EXISTING_LOGO_URL = "https://escape-erezee.be/assets/logo-escape.jpg?v=85";

const routeLinks = [
  ["/parcours/la-lettre-de-la-dame-de-soy.html", "La Lettre de la Dame de Soy"],
  ["/parcours/sur-les-traces-du-vicinal.html", "Sur les Traces du Vicinal"],
  ["/parcours/les-balises-perdues-de-blier.html", "Les Balises Perdues de Blier"],
];

const publicContentFiles = [
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

function fixBrokenStructuredDataLogo(html) {
  return html
    .replaceAll("https://escape-erezee.be/assets/logo-stock-sevrin-v90.jpg", EXISTING_LOGO_URL)
    .replaceAll("/assets/logo-stock-sevrin-v90.jpg", "/assets/logo-escape.jpg?v=85");
}

function routeLinksBlock() {
  return `<section class="route-seo-links" data-seo-route-links-v111 aria-labelledby="route-seo-links-title">
    <p class="eyebrow">Parcours disponibles</p>
    <h2 id="route-seo-links-title">Nos escape games extérieurs à Érezée</h2>
    <div class="article-links">
      ${routeLinks.map(([href, label]) => `<a href="${href}">${label}</a>`).join("\n      ")}
    </div>
  </section>`;
}

function patchIndexHtml(html) {
  let next = fixBrokenStructuredDataLogo(html);

  if (!next.includes("data-seo-route-link-v111")) {
    const routeAnchors = routeLinks
      .map(([href, label]) => `              <a data-seo-route-link-v111 href="${href}">Parcours : ${label}</a>`)
      .join("\n");
    next = next.replace(
      '              <a href="/blog/">Blog et actualités</a>',
      `${routeAnchors}\n              <a href="/blog/">Blog et actualités</a>`,
    );
  }

  return next;
}

function patchPublicContentHtml(html) {
  let next = fixBrokenStructuredDataLogo(html);
  if (!next.includes("data-seo-route-links-v111")) {
    next = next.replace("</main>", `      ${routeLinksBlock()}\n    </main>`);
  }
  return next;
}

function patchSeoCss(css) {
  if (css.includes("seo-static-route-links-v111")) return css;
  return `${css.trimEnd()}

/* seo-static-route-links-v111 */
.route-seo-links {
  margin-top: 36px;
}

.route-seo-links h2 {
  margin-top: 6px;
}
`;
}

await patchTextFile("index.html", patchIndexHtml);
await patchTextFile("seo-pages.css", patchSeoCss);
for (const file of publicContentFiles) await patchTextFile(file, patchPublicContentHtml);
console.log(`SEO static route links v${VERSION} applied.`);
