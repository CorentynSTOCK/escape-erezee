import { access, readFile, writeFile } from "node:fs/promises";

const VERSION = 85;

async function patchTextFile(filePath, patcher) {
  const input = await readFile(filePath, "utf8");
  const output = patcher(input);
  if (output !== input) await writeFile(filePath, output, "utf8");
}

async function patchIfExists(filePath, patcher) {
  try { await access(filePath); } catch { return; }
  await patchTextFile(filePath, patcher);
}

function sendText(response, statusCode, content, contentType = "text/plain; charset=utf-8", headers = {}) {
  response.writeHead(statusCode, {
    "Content-Type": contentType,
    "Cache-Control": "no-cache",
    ...headers,
  });
  response.end(content);
}

function escapeXml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function getSeoOrigin(request) {
  return compactText(PUBLIC_APP_URL).replace(/\/+$/, "") || getRequestOrigin(request).replace(/\/+$/, "");
}

function slugifyRoute(value) {
  return compactText(value || "parcours")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase() || "parcours";
}

function getRoutePublicPath(route) {
  return `/parcours/${slugifyRoute(route?.title || route?.id)}.html`;
}

function getPublicRoutes(data) {
  return (Array.isArray(data?.routes) ? data.routes : []).filter(isRouteVisibleInShop);
}

function getRouteSeoDescription(route) {
  return compactText(route?.description)
    || `Escape game exterieur a ${compactText(route?.area) || "Erezee"} avec enigmes, marche et aventure en equipe.`;
}

function getRouteSeoImage(route, origin) {
  const image = route?.image || route?.coverImage || null;
  const url = compactText(image?.url || image?.src || route?.imageUrl || route?.coverImageUrl);
  if (url && !url.startsWith("data:")) return url.startsWith("http") ? url : `${origin}${url.startsWith("/") ? "" : "/"}${url}`;
  return `${origin}/assets/logo-escape.jpg?v=${SEO_VERSION}`;
}

function makeJsonLd(value) {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

function getRouteOffer(route, origin) {
  const price = getRoutePriceCents(route) / 100;
  if (!Number.isFinite(price) || price <= 0) return undefined;
  return {
    "@type": "Offer",
    priceCurrency: "EUR",
    price: price.toFixed(2),
    availability: "https://schema.org/InStock",
    url: `${origin}/index.html#shop`,
  };
}

function renderRouteStructuredData(route, origin) {
  const offer = getRouteOffer(route, origin);
  return makeJsonLd({
    "@context": "https://schema.org",
    "@type": "Product",
    name: route.title,
    description: getRouteSeoDescription(route),
    image: getRouteSeoImage(route, origin),
    brand: { "@type": "Brand", name: "Escape Erezee" },
    category: "Escape game exterieur",
    areaServed: compactText(route.area) || "Erezee",
    offers: offer,
  });
}

function renderRouteSeoPage(route, routes, origin) {
  const canonical = `${origin}${getRoutePublicPath(route)}`;
  const description = getRouteSeoDescription(route);
  const title = `${route.title} | Escape Erezee`;
  const image = getRouteSeoImage(route, origin);
  const duration = Number(route.duration) ? `${Number(route.duration)} minutes` : "Duree variable";
  const distance = compactText(route.distance) || "Distance indiquee sur place";
  const price = getRoutePriceCents(route) > 0 ? `${(getRoutePriceCents(route) / 100).toFixed(2).replace(".", ",")} € / personne` : "Prix disponible dans la boutique";
  const otherRoutes = routes
    .filter((item) => item.id !== route.id)
    .map((item) => `<li><a href="${escapeHtml(getRoutePublicPath(item))}">${escapeHtml(item.title)}</a></li>`)
    .join("\n");

  return `<!doctype html>
<html lang="fr-BE">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="robots" content="index, follow" />
    <meta name="description" content="${escapeHtml(description)}" />
    <link rel="canonical" href="${escapeHtml(canonical)}" />
    <title>${escapeHtml(title)}</title>
    <meta property="og:type" content="product" />
    <meta property="og:site_name" content="Escape Erezee" />
    <meta property="og:title" content="${escapeHtml(title)}" />
    <meta property="og:description" content="${escapeHtml(description)}" />
    <meta property="og:url" content="${escapeHtml(canonical)}" />
    <meta property="og:image" content="${escapeHtml(image)}" />
    <meta name="twitter:card" content="summary_large_image" />
    <script type="application/ld+json">${renderRouteStructuredData(route, origin)}</script>
    <style>
      :root { color-scheme: light; font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; color: #14201d; background: #f4f7f5; }
      body { margin: 0; }
      main { max-width: 920px; margin: 0 auto; padding: 32px 20px 48px; }
      header, section { margin-bottom: 28px; }
      .eyebrow { color: #1f6a58; font-size: 0.78rem; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase; }
      h1 { margin: 8px 0 12px; font-size: clamp(2rem, 5vw, 3.8rem); line-height: 1.02; }
      h2 { font-size: 1.35rem; }
      p, li { font-size: 1.04rem; line-height: 1.65; }
      .facts { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px; padding: 0; list-style: none; }
      .facts li { border: 1px solid #dce6e1; border-radius: 8px; background: white; padding: 14px; }
      .facts strong { display: block; font-size: 0.75rem; color: #63736e; text-transform: uppercase; }
      .actions { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 24px; }
      .button { display: inline-flex; align-items: center; justify-content: center; min-height: 44px; border-radius: 8px; padding: 0 18px; color: white; background: #123c32; font-weight: 800; text-decoration: none; }
      .button.secondary { color: #123c32; background: white; border: 1px solid #b9cbc4; }
      nav ul { padding-left: 18px; }
    </style>
  </head>
  <body>
    <main>
      <header>
        <p class="eyebrow">Escape game exterieur a Erezee</p>
        <h1>${escapeHtml(route.title)}</h1>
        <p>${escapeHtml(description)}</p>
        <div class="actions">
          <a class="button" href="${origin}/index.html#shop">Reserver ce parcours</a>
          <a class="button secondary" href="${origin}/">Voir la boutique</a>
        </div>
      </header>
      <section aria-labelledby="infos-parcours">
        <h2 id="infos-parcours">Informations parcours</h2>
        <ul class="facts">
          <li><strong>Lieu</strong>${escapeHtml(compactText(route.area) || "Erezee")}</li>
          <li><strong>Duree</strong>${escapeHtml(duration)}</li>
          <li><strong>Distance</strong>${escapeHtml(distance)}</li>
          <li><strong>Enigmes</strong>${escapeHtml(String(route.puzzles?.length || 0))} etapes</li>
          <li><strong>Tarif</strong>${escapeHtml(price)}</li>
        </ul>
      </section>
      ${otherRoutes ? `<nav aria-labelledby="autres-parcours"><h2 id="autres-parcours">Autres parcours Escape Erezee</h2><ul>${otherRoutes}</ul></nav>` : ""}
    </main>
  </body>
</html>`;
}

function buildSitemapXml(routes, origin) {
  const urls = [
    `${origin}/`,
    ...routes.map((route) => `${origin}${getRoutePublicPath(route)}`),
  ];
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((url) => `  <url>
    <loc>${escapeXml(url)}</loc>
  </url>`).join("\n")}
</urlset>
`;
}

async function handleSeoRequest(request, response, pathname) {
  if (request.method !== "GET" && request.method !== "HEAD") return false;
  const origin = getSeoOrigin(request);

  if (pathname === "/robots.txt") {
    sendText(response, 200, `User-agent: *
Allow: /
Sitemap: ${origin}/sitemap.xml
`, "text/plain; charset=utf-8");
    return true;
  }

  if (pathname === "/sitemap.xml") {
    const stored = await readStoredData();
    const routes = getPublicRoutes(stored);
    sendText(response, 200, buildSitemapXml(routes, origin), "application/xml; charset=utf-8");
    return true;
  }

  if (pathname.startsWith("/parcours/") && pathname.endsWith(".html")) {
    const stored = await readStoredData();
    const routes = getPublicRoutes(stored);
    const requestedSlug = decodeURIComponent(pathname.replace(/^\/parcours\//, "").replace(/\.html$/, ""));
    const route = routes.find((item) => slugifyRoute(item.title || item.id) === requestedSlug);
    if (!route) {
      sendText(response, 404, "Parcours introuvable", "text/plain; charset=utf-8");
      return true;
    }
    sendText(response, 200, renderRouteSeoPage(route, routes, origin), "text/html; charset=utf-8");
    return true;
  }

  return false;
}

function patchServer(server) {
  let next = server;

  if (!next.includes("function handleSeoRequest(")) {
    const helpers = [
      `const SEO_VERSION = ${VERSION};`,
      sendText.toString(),
      escapeXml.toString(),
      getSeoOrigin.toString(),
      slugifyRoute.toString(),
      getRoutePublicPath.toString(),
      getPublicRoutes.toString(),
      getRouteSeoDescription.toString(),
      getRouteSeoImage.toString(),
      makeJsonLd.toString(),
      getRouteOffer.toString(),
      renderRouteStructuredData.toString(),
      renderRouteSeoPage.toString(),
      buildSitemapXml.toString(),
      handleSeoRequest.toString(),
    ].join("\n\n") + "\n\n";
    const marker = "async function stripeRequest";
    if (!next.includes(marker)) {
      throw new Error(`Patch v${VERSION} introuvable: insertion SEO`);
    }
    next = next.replace(marker, helpers + marker);
  }

  const handledLine = "      const handled = await handleApi(request, response, requestUrl.pathname);";
  const seoFlow = "      const seoHandled = await handleSeoRequest(request, response, requestUrl.pathname);\n      if (seoHandled) return;\n" + handledLine;
  if (!next.includes("const seoHandled = await handleSeoRequest")) {
    if (!next.includes(handledLine)) {
      throw new Error(`Patch v${VERSION} introuvable: flux serveur`);
    }
    next = next.replace(handledLine, seoFlow);
  }

  return next;
}

function patchIndexHtml(html) {
  let next = html
    .replace(/app\.js\?v=\d+/g, `app.js?v=${VERSION}`)
    .replace(/styles\.css\?v=\d+/g, `styles.css?v=${VERSION}`);

  if (!next.includes('id="seo-home-structured-data"')) {
    const oldDescription = `    <meta
      name="description"
      content="Escape Erezée - gestion et application joueur pour escape game extérieur."
    />`;
    const seoBlock = `    <meta
      name="description"
      content="Escape game extérieur à Erezée : réservez un parcours d'énigmes en équipe dans les villages et paysages de l'Ardenne belge."
    />
    <meta name="robots" content="index, follow" />
    <link rel="canonical" href="https://escape-erezee.be/" />
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="Escape Erezée" />
    <meta property="og:title" content="Escape Erezée - Escape game extérieur en Ardenne" />
    <meta property="og:description" content="Parcours d'énigmes extérieurs à Erezée, à vivre en équipe avec code d'activation et suivi de progression." />
    <meta property="og:url" content="https://escape-erezee.be/" />
    <meta property="og:image" content="https://escape-erezee.be/assets/logo-escape.jpg?v=${VERSION}" />
    <meta name="twitter:card" content="summary_large_image" />
    <script type="application/ld+json" id="seo-home-structured-data">[{"@context":"https://schema.org","@type":"WebSite","name":"Escape Erezée","url":"https://escape-erezee.be/","inLanguage":"fr-BE"},{"@context":"https://schema.org","@type":"LocalBusiness","name":"Escape Erezée","url":"https://escape-erezee.be/","description":"Escape game extérieur à Erezée, en Ardenne belge, avec parcours d'énigmes à faire en équipe.","areaServed":{"@type":"Place","name":"Erezée, Belgique"},"priceRange":"€€"}]</script>`;
    if (!next.includes(oldDescription)) {
      throw new Error(`Patch v${VERSION} introuvable: meta description accueil`);
    }
    next = next.replace(oldDescription, seoBlock);
  }

  next = next.replace("<title>Escape Erezée</title>", "<title>Escape Erezée - Escape game extérieur en Ardenne</title>");
  return next;
}

function patchSuiviHtml(html) {
  return html
    .replace(/app\.js\?v=\d+/g, `app.js?v=${VERSION}`)
    .replace(/styles\.css\?v=\d+/g, `styles.css?v=${VERSION}`)
    .replace(/<meta name="robots" content="[^"]*" \/>/, '<meta name="robots" content="noindex, nofollow" />');
}

function patchServiceWorker(worker) {
  let next = worker.replace(/escape-erezee-v\d+/g, `escape-erezee-v${VERSION}`);
  next = next.replace(/"\.\/app\.js(?:\?v=\d+)?"/g, `"./app.js?v=${VERSION}"`);
  next = next.replace(/"\.\/styles\.css(?:\?v=\d+)?"/g, `"./styles.css?v=${VERSION}"`);
  return next;
}

await patchTextFile("server.mjs", patchServer);
await patchIfExists("index.html", patchIndexHtml);
await patchIfExists("suivi.html", patchSuiviHtml);
await patchTextFile("service-worker.js", patchServiceWorker);
console.log("SEO public pages v85 applied.");
