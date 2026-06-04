import { readFile, writeFile } from "node:fs/promises";

const VERSION = 110;
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
  return `<section class="route-seo-links" data-seo-route-links-v110 aria-labelledby="route-seo-links-title">
    <p class="eyebrow">Parcours disponibles</p>
    <h2 id="route-seo-links-title">Nos escape games extérieurs à Érezée</h2>
    <div class="article-links">
      ${routeLinks.map(([href, label]) => `<a href="${href}">${label}</a>`).join("\n      ")}
    </div>
  </section>`;
}

function patchIndexHtml(html) {
  let next = fixBrokenStructuredDataLogo(html);

  if (!next.includes("data-seo-route-link-v110")) {
    const routeAnchors = routeLinks
      .map(([href, label]) => `              <a data-seo-route-link-v110 href="${href}">Parcours : ${label}</a>`)
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
  if (!next.includes("data-seo-route-links-v110")) {
    next = next.replace("</main>", `      ${routeLinksBlock()}\n    </main>`);
  }
  return next;
}

function patchSeoCss(css) {
  if (css.includes("seo-route-depth-v110")) return css;
  return `${css.trimEnd()}

/* seo-route-depth-v110 */
.route-seo-links {
  margin-top: 36px;
}

.route-seo-links h2 {
  margin-top: 6px;
}
`;
}

function replaceFunction(source, functionName, nextFunctionName, replacement) {
  const start = source.indexOf(`function ${functionName}(`);
  if (start === -1) throw new Error(`Patch v${VERSION}: fonction ${functionName} introuvable`);
  const end = source.indexOf(`\n\nfunction ${nextFunctionName}(`, start);
  if (end === -1) throw new Error(`Patch v${VERSION}: fin de ${functionName} introuvable`);
  return `${source.slice(0, start)}${replacement}${source.slice(end)}`;
}

const renderRouteStructuredDataV110 = `function renderRouteStructuredData(route, origin) {
  const offer = getRouteOffer(route, origin);
  const title = compactText(route?.title) || "Parcours Escape Erezée";
  const area = compactText(route?.area) || "Érezée";
  const canonical = \`${origin}\${getRoutePublicPath(route)}\`;
  const description = getRouteSeoDescription(route);
  const image = getRouteSeoImage(route, origin);
  const faq = [
    ["Faut-il réserver ce parcours ?", "Oui, la réservation en ligne permet de recevoir un code d'accès avant de se rendre au point de départ."],
    ["Faut-il internet pendant le jeu ?", "Oui, une connexion mobile est recommandée pour charger la carte et synchroniser la progression."],
    ["Peut-on jouer en équipe ?", "Oui, les parcours sont pensés pour avancer en équipe, observer les lieux et résoudre les énigmes ensemble."],
    ["Que faire pendant les périodes de chasse ?", "Vérifiez les informations locales, respectez les panneaux sur place et reportez le parcours si une zone est fermée."],
  ];

  return makeJsonLd({
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Product",
        name: title,
        description,
        image,
        brand: { "@type": "Brand", name: "Stock & Sevrin Escape Games" },
        category: "Escape game extérieur",
        areaServed: area,
        offers: offer,
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Accueil", item: origin },
          { "@type": "ListItem", position: 2, name: "Parcours", item: \`${origin}/index.html#shop\` },
          { "@type": "ListItem", position: 3, name: title, item: canonical },
        ],
      },
      {
        "@type": "FAQPage",
        mainEntity: faq.map(([question, answer]) => ({
          "@type": "Question",
          name: question,
          acceptedAnswer: { "@type": "Answer", text: answer },
        })),
      },
    ],
  });
}`;

const renderRouteSeoPageV110 = `function renderRouteSeoPage(route, routes, origin) {
  const canonical = \`${origin}\${getRoutePublicPath(route)}\`;
  const routeTitle = compactText(route?.title) || "Parcours Escape Erezée";
  const description = getRouteSeoDescription(route);
  const title = \`${routeTitle} | Escape game extérieur à Érezée\`;
  const image = getRouteSeoImage(route, origin);
  const duration = Number(route.duration) ? \`${Number(route.duration)} minutes\` : "Durée indiquée dans la boutique";
  const distance = compactText(route.distance) || "Distance indiquée dans la boutique";
  const price = getRoutePriceCents(route) > 0 ? \`${(getRoutePriceCents(route) / 100).toFixed(2).replace(".", ",")} € / équipe\` : "Prix disponible dans la boutique";
  const area = compactText(route.area) || "Érezée";
  const puzzleCount = Array.isArray(route.puzzles) ? route.puzzles.length : 0;
  const otherRoutes = routes
    .filter((item) => item.id !== route.id)
    .map((item) => \`<li><a href="\${escapeHtml(getRoutePublicPath(item))}">\${escapeHtml(item.title)}</a></li>\`)
    .join("\\n");

  return \`<!doctype html>
<html lang="fr-BE">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="robots" content="index, follow, max-image-preview:large" />
    <meta name="description" content="\${escapeHtml(description)}" />
    <link rel="canonical" href="\${escapeHtml(canonical)}" />
    <title>\${escapeHtml(title)}</title>
    <meta property="og:type" content="product" />
    <meta property="og:site_name" content="Stock & Sevrin Escape Games" />
    <meta property="og:title" content="\${escapeHtml(title)}" />
    <meta property="og:description" content="\${escapeHtml(description)}" />
    <meta property="og:url" content="\${escapeHtml(canonical)}" />
    <meta property="og:image" content="\${escapeHtml(image)}" />
    <meta name="twitter:card" content="summary_large_image" />
    <script type="application/ld+json" data-seo="seo-route-depth-v110">\${renderRouteStructuredData(route, origin)}</script>
    <style>
      :root { color-scheme: light; font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; color: #14201d; background: #f4f7f5; }
      body { margin: 0; }
      main { max-width: 980px; margin: 0 auto; padding: 32px 20px 52px; }
      header, section, nav { margin-bottom: 30px; }
      .eyebrow { color: #1f6a58; font-size: 0.78rem; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase; }
      h1 { margin: 8px 0 12px; font-size: clamp(2rem, 5vw, 3.8rem); line-height: 1.02; }
      h2 { font-size: 1.35rem; }
      p, li { font-size: 1.04rem; line-height: 1.65; }
      img { display: block; width: 100%; max-height: 430px; object-fit: cover; border-radius: 8px; margin: 22px 0; box-shadow: 0 18px 40px rgba(10, 35, 29, 0.13); }
      .facts { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px; padding: 0; list-style: none; }
      .facts li { border: 1px solid #dce6e1; border-radius: 8px; background: white; padding: 14px; }
      .facts strong { display: block; font-size: 0.75rem; color: #63736e; text-transform: uppercase; }
      .content-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 16px; }
      .content-grid article, .notice { border: 1px solid #dce6e1; border-radius: 8px; background: white; padding: 18px; }
      .notice { background: #fff8e6; border-color: #e4c16f; }
      .actions { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 24px; }
      .button { display: inline-flex; align-items: center; justify-content: center; min-height: 44px; border-radius: 8px; padding: 0 18px; color: white; background: #123c32; font-weight: 800; text-decoration: none; }
      .button.secondary { color: #123c32; background: white; border: 1px solid #b9cbc4; }
      nav ul { padding-left: 18px; }
    </style>
  </head>
  <body>
    <main>
      <header>
        <p class="eyebrow">Escape game extérieur à Érezée</p>
        <h1>\${escapeHtml(routeTitle)}</h1>
        <p>\${escapeHtml(description)}</p>
        <img src="\${escapeHtml(image)}" alt="" />
        <div class="actions">
          <a class="button" href="\${origin}/index.html#shop">Réserver ce parcours</a>
          <a class="button secondary" href="\${origin}/">Voir la boutique</a>
        </div>
      </header>
      <section aria-labelledby="infos-parcours">
        <h2 id="infos-parcours">Informations parcours</h2>
        <ul class="facts">
          <li><strong>Lieu</strong>\${escapeHtml(area)}</li>
          <li><strong>Durée</strong>\${escapeHtml(duration)}</li>
          <li><strong>Distance</strong>\${escapeHtml(distance)}</li>
          <li><strong>Énigmes</strong>\${escapeHtml(String(puzzleCount))} étapes</li>
          <li><strong>Tarif</strong>\${escapeHtml(price)}</li>
        </ul>
      </section>
      <section aria-labelledby="deroulement-parcours">
        <p class="eyebrow">Déroulement</p>
        <h2 id="deroulement-parcours">Une aventure autonome sur smartphone</h2>
        <div class="content-grid">
          <article><h3>Avant de partir</h3><p>Achetez le parcours dans la boutique, recevez votre code d'accès et rendez-vous au point de départ avec un smartphone chargé.</p></article>
          <article><h3>Pendant le jeu</h3><p>La carte vous guide de zone en zone. Chaque étape demande d'observer le lieu, de comprendre l'indice et de valider la réponse.</p></article>
          <article><h3>En équipe</h3><p>Les parcours sont pensés pour les familles, amis et groupes qui veulent découvrir Érezée et l'Ardenne belge autrement.</p></article>
        </div>
      </section>
      <aside class="notice">
        <strong>Prudence pendant les périodes de chasse</strong>
        <p>Avant de partir, vérifiez les informations locales, respectez les panneaux sur place et reportez le parcours si une zone est fermée.</p>
      </aside>
      <section aria-labelledby="liens-utiles">
        <h2 id="liens-utiles">Préparer votre sortie</h2>
        <ul>
          <li><a href="\${origin}/escape-game-exterieur-ardenne.html">Escape game extérieur en Ardenne</a></li>
          <li><a href="\${origin}/activite-famille-ardenne.html">Activité famille en Ardenne</a></li>
          <li><a href="\${origin}/activite-touristique-erezee.html">Activité touristique à Érezée</a></li>
          <li><a href="\${origin}/blog/">Conseils et idées de sorties sur le blog</a></li>
        </ul>
      </section>
      \${otherRoutes ? \`<nav aria-labelledby="autres-parcours"><h2 id="autres-parcours">Autres parcours Stock & Sevrin</h2><ul>\${otherRoutes}</ul></nav>\` : ""}
    </main>
  </body>
</html>\`;
}`;

function patchServer(server) {
  let next = server;
  if (!next.includes("seo-route-depth-v110")) {
    next = replaceFunction(next, "renderRouteStructuredData", "renderRouteSeoPage", renderRouteStructuredDataV110);
    next = replaceFunction(next, "renderRouteSeoPage", "buildSitemapXml", renderRouteSeoPageV110);
  }
  return next;
}

await patchTextFile("server.mjs", patchServer);
await patchTextFile("index.html", patchIndexHtml);
await patchTextFile("seo-pages.css", patchSeoCss);
for (const file of publicContentFiles) await patchTextFile(file, patchPublicContentHtml);
console.log(`SEO route depth v${VERSION} applied.`);
