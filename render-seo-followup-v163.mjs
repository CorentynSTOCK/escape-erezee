import { readFile, writeFile } from 'node:fs/promises';

const VERSION = 163;

async function patchTextFile(filePath, patcher) {
  const input = await readFile(filePath, 'utf8');
  const output = patcher(input);
  if (output !== input) await writeFile(filePath, output, 'utf8');
}

function findBlockEnd(input, start) {
  const bodyStart = input.indexOf('{', start);
  if (bodyStart < 0) return -1;
  let depth = 0;
  let quote = null;
  let escaped = false;
  for (let index = bodyStart; index < input.length; index += 1) {
    const char = input[index];
    if (quote) {
      if (escaped) escaped = false;
      else if (char === '\\') escaped = true;
      else if (char === quote) quote = null;
      continue;
    }
    if (char === '"' || char === "'" || char === '`') {
      quote = char;
      continue;
    }
    if (char === '{') depth += 1;
    if (char === '}') {
      depth -= 1;
      if (depth === 0) return index + 1;
    }
  }
  return -1;
}

function replaceBlock(input, signature, replacement) {
  const start = input.indexOf(signature);
  if (start < 0) throw new Error('Patch v' + VERSION + ' introuvable: ' + signature);
  const end = findBlockEnd(input, start);
  if (end < 0) throw new Error('Patch v' + VERSION + ' impossible: ' + signature);
  return input.slice(0, start) + replacement + input.slice(end);
}

function bumpVersions(text) {
  let next = text;
  for (let version = 1; version <= VERSION; version += 1) {
    next = next.split('styles.css?v=' + version).join('styles.css?v=' + VERSION);
    next = next.split('app.js?v=' + version).join('app.js?v=' + VERSION);
    next = next.split('seo-pages.css?v=' + version).join('seo-pages.css?v=' + VERSION);
    next = next.split('escape-erezee-v' + version).join('escape-erezee-v' + VERSION);
  }
  return next;
}

async function buildSeoDashboardV138() {
  const checkedAt = Date.now();
  const baseUrl = String(PUBLIC_APP_URL || 'https://escape-erezee.be').replace(/\/+$/, '');
  const staticPages = [
    { label: 'Accueil', path: '/', keywords: ['Stock', 'Escape'], core: true },
    { label: 'Escape game exterieur Ardenne', path: '/escape-game-exterieur-ardenne.html', keywords: ['Escape game', 'Ardenne'], core: true },
    { label: 'Activite famille Ardenne', path: '/activite-famille-ardenne.html', keywords: ['famille', 'Ardenne'], core: true },
    { label: 'Chasse au tresor Ardenne', path: '/chasse-au-tresor-ardenne.html', keywords: ['Chasse', 'Ardenne'], core: true },
    { label: 'Activite touristique Erezee', path: '/activite-touristique-erezee.html', keywords: ['Erezee'], core: true },
    { label: 'Activite pres de Durbuy', path: '/activite-pres-de-durbuy.html', keywords: ['Durbuy'], core: true },
    { label: 'Blog', path: '/blog/', keywords: ['Blog', 'Ardenne'], core: true },
    { label: 'Article: Que faire a Erezee', path: '/blog/que-faire-a-erezee.html', keywords: ['Erezee'], content: true },
    { label: 'Article: Que faire pres de Durbuy', path: '/blog/que-faire-pres-de-durbuy.html', keywords: ['Durbuy'], content: true },
    { label: 'Article: Activites familiales Ardenne', path: '/blog/activites-familiales-ardenne-belge.html', keywords: ['famille'], content: true },
    { label: 'Article: Activites exterieures Ardenne', path: '/blog/top-10-activites-exterieures-ardenne.html', keywords: ['activites'], content: true },
    { label: 'Article: Vacances Ardenne', path: '/blog/que-faire-vacances-ardenne.html', keywords: ['vacances'], content: true },
    { label: 'Article: Activite enfant Erezee', path: '/blog/activite-enfant-erezee.html', keywords: ['enfant', 'Erezee'], optional: true },
    { label: 'Article: Escape game pres de Durbuy', path: '/blog/escape-game-pres-de-durbuy.html', keywords: ['escape game', 'Durbuy'], optional: true },
    { label: 'Article: Week-end famille Ardenne', path: '/blog/week-end-famille-ardenne.html', keywords: ['week-end', 'famille'], optional: true },
  ];
  let routes = [];
  try {
    const stored = await readStoredData();
    const sourceRoutes = typeof getPublicRoutes === 'function' ? getPublicRoutes(stored) : (Array.isArray(stored?.routes) ? stored.routes : []);
    routes = sourceRoutes.map(function (route) {
      let path = '';
      try { path = getRoutePublicPath(route); } catch { path = '/parcours/' + compactText(route?.id || route?.title || 'parcours') + '.html'; }
      return {
        label: 'Parcours: ' + compactText(route?.title || route?.id || 'sans titre'),
        path: path,
        keywords: [compactText(route?.title || ''), compactText(route?.area || '')].filter(Boolean),
        route: true,
      };
    });
  } catch {}

  const pages = staticPages.concat(routes);
  const assetCache = new Map();

  function toAbsoluteUrl(pathname) {
    const value = String(pathname || '/');
    if (/^https?:\/\//i.test(value)) return value;
    return baseUrl + (value.startsWith('/') ? value : '/' + value);
  }

  function withFreshQuery(url, key) {
    return url + (url.includes('?') ? '&' : '?') + key + '=' + checkedAt;
  }

  async function fetchText(pathname, kind) {
    if (typeof fetch !== 'function') {
      return { ok: false, status: 0, url: toAbsoluteUrl(pathname), text: '', error: 'Verification HTTP indisponible.' };
    }
    const url = toAbsoluteUrl(pathname);
    try {
      const response = await fetch(withFreshQuery(url, kind || 'seoCheck'), { cache: 'no-store' });
      const text = await response.text().catch(function () { return ''; });
      return { ok: response.ok, status: response.status, url: url, text: text, contentType: response.headers.get('content-type') || '' };
    } catch (error) {
      return { ok: false, status: 0, url: url, text: '', error: error?.message || 'Verification impossible.' };
    }
  }

  function extractAttr(html, pattern) {
    const match = String(html || '').match(pattern);
    return match ? compactText(match[1]) : '';
  }

  function stripTags(html) {
    return String(html || '').replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  }

  function extractImageRefs(html, pageUrl) {
    const refs = new Set();
    const source = String(html || '');
    const attrPattern = /\b(?:src|href|content)=["']([^"']+\.(?:png|jpe?g|webp|gif|svg)(?:\?[^"']*)?)["']/gi;
    let match = attrPattern.exec(source);
    while (match) {
      const raw = compactText(match[1]);
      if (raw && !raw.startsWith('data:')) {
        try { refs.add(new URL(raw, pageUrl).href); } catch {}
      }
      match = attrPattern.exec(source);
    }
    return Array.from(refs);
  }

  async function checkAsset(url) {
    if (assetCache.has(url)) return assetCache.get(url);
    const result = (async function () {
      if (typeof fetch !== 'function') return { url: url, ok: false, status: 0, error: 'Verification HTTP indisponible.' };
      try {
        const response = await fetch(withFreshQuery(url, 'assetCheck'), { cache: 'no-store' });
        await response.arrayBuffer().catch(function () {});
        return { url: url, ok: response.ok, status: response.status };
      } catch (error) {
        return { url: url, ok: false, status: 0, error: error?.message || 'Image inaccessible.' };
      }
    })();
    assetCache.set(url, result);
    return result;
  }

  async function checkPage(page) {
    const result = await fetchText(page.path, 'pageCheck');
    const warnings = [];
    const critical = [];
    if (!result.ok) {
      critical.push('HTTP ' + result.status);
      return {
        label: page.label,
        path: page.path,
        url: result.url,
        status: 'critical',
        detail: result.error || ('Reponse HTTP ' + result.status + '.'),
        title: '',
        descriptionLength: 0,
        imageCount: 0,
        brokenImages: 0,
        warnings: warnings,
        critical: critical,
      };
    }
    const html = result.text;
    const visibleText = stripTags(html);
    const title = extractAttr(html, /<title[^>]*>([\s\S]*?)<\/title>/i);
    const description = extractAttr(html, /<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["'][^>]*>/i)
      || extractAttr(html, /<meta[^>]+content=["']([^"']*)["'][^>]+name=["']description["'][^>]*>/i);
    const canonical = extractAttr(html, /<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']*)["'][^>]*>/i)
      || extractAttr(html, /<link[^>]+href=["']([^"']*)["'][^>]+rel=["']canonical["'][^>]*>/i);
    const robots = extractAttr(html, /<meta[^>]+name=["']robots["'][^>]+content=["']([^"']*)["'][^>]*>/i)
      || extractAttr(html, /<meta[^>]+content=["']([^"']*)["'][^>]+name=["']robots["'][^>]*>/i);
    const ogImage = extractAttr(html, /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']*)["'][^>]*>/i)
      || extractAttr(html, /<meta[^>]+content=["']([^"']*)["'][^>]+property=["']og:image["'][^>]*>/i);
    if (!title) warnings.push('title manquant');
    if (!description) warnings.push('meta description manquante');
    if (description && (description.length < 70 || description.length > 180)) warnings.push('description a ajuster');
    if (!canonical) warnings.push('canonical manquant');
    if (robots && /noindex/i.test(robots)) critical.push('noindex detecte');
    if (!ogImage) warnings.push('og:image manquant');
    const missingKeywords = (page.keywords || []).filter(function (keyword) {
      return keyword && !visibleText.toLowerCase().includes(String(keyword).toLowerCase());
    });
    if (missingKeywords.length && !page.optional) warnings.push('mot-cle absent: ' + missingKeywords.slice(0, 2).join(', '));
    const images = extractImageRefs(html, result.url);
    if (!images.length) warnings.push('aucune image detectee');
    const imageResults = await Promise.all(images.slice(0, 8).map(checkAsset));
    const brokenImages = imageResults.filter(function (image) { return !image.ok; });
    if (brokenImages.length) warnings.push(brokenImages.length + ' image(s) inaccessible(s)');
    const status = critical.length ? 'critical' : (warnings.length ? 'warning' : 'ok');
    return {
      label: page.label,
      path: page.path,
      url: result.url,
      status: status,
      detail: critical.concat(warnings).join(' ; ') || 'SEO OK.',
      title: title,
      descriptionLength: description.length,
      canonical: canonical,
      robots: robots,
      imageCount: images.length,
      brokenImages: brokenImages.length,
      warnings: warnings,
      critical: critical,
    };
  }

  function normalizeSitemapUrl(url) {
    return String(url || '').replace(/\/+$/, '');
  }

  const pageResults = await Promise.all(pages.map(checkPage));
  const sitemapResponse = await fetchText('/sitemap.xml', 'sitemapCheck');
  const sitemapUrls = Array.from(String(sitemapResponse.text || '').matchAll(/<loc>([\s\S]*?)<\/loc>/gi)).map(function (match) {
    return compactText(match[1]);
  });
  const sitemapSet = new Set(sitemapUrls.map(normalizeSitemapUrl));
  const expectedSitemapUrls = pages.filter(function (page) { return page.core || page.route || page.content; }).map(function (page) {
    return normalizeSitemapUrl(toAbsoluteUrl(page.path));
  });
  const missingFromSitemap = expectedSitemapUrls.filter(function (url) { return !sitemapSet.has(url); });
  const sitemapStatus = !sitemapResponse.ok ? 'critical' : (missingFromSitemap.length ? 'warning' : 'ok');
  const sitemapCheck = {
    label: 'Sitemap',
    path: '/sitemap.xml',
    url: sitemapResponse.url,
    status: sitemapStatus,
    detail: !sitemapResponse.ok ? ('HTTP ' + sitemapResponse.status) : (missingFromSitemap.length ? missingFromSitemap.length + ' URL(s) attendue(s) absente(s).' : sitemapUrls.length + ' URL(s) referencee(s).'),
  };
  const robotsResponse = await fetchText('/robots.txt', 'robotsCheck');
  const robotsHasSitemap = /Sitemap:/i.test(robotsResponse.text || '');
  const robotsStatus = !robotsResponse.ok ? 'critical' : (robotsHasSitemap ? 'ok' : 'warning');
  const robotsCheck = {
    label: 'Robots',
    path: '/robots.txt',
    url: robotsResponse.url,
    status: robotsStatus,
    detail: !robotsResponse.ok ? ('HTTP ' + robotsResponse.status) : (robotsHasSitemap ? 'Sitemap declare.' : 'Sitemap non declare.'),
  };
  const checks = pageResults.concat([sitemapCheck, robotsCheck]);
  const warningCount = checks.filter(function (check) { return check.status === 'warning'; }).length;
  const criticalCount = checks.filter(function (check) { return check.status === 'critical'; }).length;
  const imageCount = pageResults.reduce(function (sum, page) { return sum + Number(page.imageCount || 0); }, 0);
  const brokenImages = pageResults.reduce(function (sum, page) { return sum + Number(page.brokenImages || 0); }, 0);
  const summary = {
    pages: pageResults.length,
    routes: routes.length,
    ok: checks.filter(function (check) { return check.status === 'ok'; }).length,
    warnings: warningCount,
    critical: criticalCount,
    sitemapUrls: sitemapUrls.length,
    sitemapMissing: missingFromSitemap.length,
    images: imageCount,
    brokenImages: brokenImages,
  };
  return {
    ok: criticalCount === 0,
    checkedAt: checkedAt,
    baseUrl: baseUrl,
    summary: summary,
    checks: checks,
    pages: pageResults,
    sitemap: {
      status: sitemapStatus,
      url: sitemapResponse.url,
      count: sitemapUrls.length,
      missing: missingFromSitemap,
    },
    robots: robotsCheck,
    searchConsole: {
      overview: 'https://search.google.com/search-console?resource_id=https%3A%2F%2Fescape-erezee.be%2F',
      sitemaps: 'https://search.google.com/search-console/sitemaps?resource_id=https%3A%2F%2Fescape-erezee.be%2F',
      inspectHome: 'https://search.google.com/search-console/inspect?resource_id=https%3A%2F%2Fescape-erezee.be%2F&id=https%3A%2F%2Fescape-erezee.be%2F',
    },
    trackedQueries: [
      'escape game exterieur Ardenne',
      'activite famille Ardenne',
      'chasse au tresor Ardenne',
      'activite touristique Erezee',
      'activite pres de Durbuy',
      'escape game pres de Durbuy',
    ],
    nextActions: [
      'Controler Search Console chaque semaine au debut, puis chaque mois.',
      'Ajouter un article local ou une photo reelle quand une nouvelle activite est testee.',
      'Remplacer les avis exemples par des avis clients reels des qu ils arrivent.',
      'Inspecter manuellement les nouvelles pages importantes apres publication.',
    ],
  };
}

function adminOpsRenderSeoV138(payload) {
  const card = document.querySelector("#admin-seo-card-v138");
  if (!card) return;
  const summary = payload.summary || {};
  const pages = Array.isArray(payload.pages) ? payload.pages : [];
  const checks = Array.isArray(payload.checks) ? payload.checks : pages;
  const issues = checks.filter(function (check) { return check.status !== 'ok'; });
  const actions = Array.isArray(payload.nextActions) ? payload.nextActions : [];
  const queries = Array.isArray(payload.trackedQueries) ? payload.trackedQueries : [];
  const searchConsole = payload.searchConsole || {};
  function statusLabel(status) {
    if (status === 'critical') return 'Critique';
    if (status === 'warning') return 'A verifier';
    return 'OK';
  }
  function link(url, label) {
    if (!url) return '';
    return '<a class="admin-seo-link-v163" href="' + adminOpsEscapeV138(url) + '" target="_blank" rel="noopener">' + adminOpsEscapeV138(label) + '</a>';
  }
  card.innerHTML = [
    '<p class="section-label">Suivi SEO</p>',
    '<div class="admin-seo-head-v163">',
      '<div>',
        '<h4>' + (payload.ok ? 'SEO stable' : 'Points SEO a verifier') + '</h4>',
        '<p class="admin-ops-muted">Dernier controle : ' + adminOpsEscapeV138(adminOpsFormatTimeV138(payload.checkedAt)) + '</p>',
      '</div>',
      '<div class="admin-seo-links-v163">' + [
        link(searchConsole.overview, 'Search Console'),
        link(searchConsole.sitemaps, 'Sitemap Google'),
        link('/sitemap.xml', 'sitemap.xml'),
        link('/robots.txt', 'robots.txt'),
      ].join('') + '</div>',
    '</div>',
    '<div class="admin-seo-metrics-v163">',
      '<span><strong>' + adminOpsEscapeV138(summary.pages || 0) + '</strong> pages</span>',
      '<span><strong>' + adminOpsEscapeV138(summary.routes || 0) + '</strong> parcours</span>',
      '<span><strong>' + adminOpsEscapeV138(summary.sitemapUrls || 0) + '</strong> URLs sitemap</span>',
      '<span><strong>' + adminOpsEscapeV138(summary.images || 0) + '</strong> images</span>',
      '<span class="' + ((summary.critical || summary.brokenImages) ? 'is-critical' : (summary.warnings ? 'is-warning' : 'is-ok')) + '"><strong>' + adminOpsEscapeV138((summary.critical || 0) + (summary.warnings || 0)) + '</strong> alertes</span>',
    '</div>',
    issues.length ? '<div class="admin-seo-issues-v163"><strong>A traiter en priorite</strong>' + issues.slice(0, 5).map(function (issue) {
      return '<div class="admin-seo-row-v163 is-' + adminOpsEscapeV138(issue.status) + '"><span>' + adminOpsEscapeV138(issue.label) + '</span><small>' + adminOpsEscapeV138(issue.detail || statusLabel(issue.status)) + '</small></div>';
    }).join('') + '</div>' : '<p class="admin-ops-muted">Aucun point critique detecte sur les pages controlees.</p>',
    '<div class="admin-seo-grid-v163">',
      '<section><strong>Pages controlees</strong><div class="admin-seo-list-v163">' + pages.slice(0, 12).map(function (page) {
        return '<a class="admin-seo-row-v163 is-' + adminOpsEscapeV138(page.status) + '" href="' + adminOpsEscapeV138(page.url || page.path || '#') + '" target="_blank" rel="noopener"><span>' + adminOpsEscapeV138(page.label) + '</span><small>' + adminOpsEscapeV138(statusLabel(page.status)) + '</small></a>';
      }).join('') + '</div></section>',
      '<section><strong>Routine SEO</strong><ul class="admin-seo-actions-v163">' + actions.map(function (action) {
        return '<li>' + adminOpsEscapeV138(action) + '</li>';
      }).join('') + '</ul><strong>Requetes a suivre</strong><p class="admin-seo-queries-v163">' + queries.map(function (query) {
        return '<span>' + adminOpsEscapeV138(query) + '</span>';
      }).join('') + '</p></section>',
    '</div>',
  ].join("");
}

function patchServer(server) {
  return bumpVersions(replaceBlock(server, 'async function buildSeoDashboardV138', buildSeoDashboardV138.toString()));
}

function patchApp(app) {
  return bumpVersions(replaceBlock(app, 'function adminOpsRenderSeoV138', adminOpsRenderSeoV138.toString()));
}

function patchStyles(css) {
  let next = bumpVersions(css);
  if (next.includes('seo-followup-v163')) return next;
  return next + `

/* seo-followup-v163 */
.admin-seo-head-v163 {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 16px;
}

.admin-seo-links-v163,
.admin-seo-queries-v163 {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.admin-seo-link-v163,
.admin-seo-queries-v163 span {
  border: 1px solid rgba(18, 60, 50, 0.18);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.72);
  color: #123c32;
  font-size: 0.82rem;
  font-weight: 800;
  padding: 7px 10px;
  text-decoration: none;
}

.admin-seo-metrics-v163 {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
  gap: 8px;
  margin: 12px 0 16px;
}

.admin-seo-metrics-v163 span {
  border: 1px solid rgba(18, 60, 50, 0.12);
  border-radius: 8px;
  background: rgba(246, 249, 247, 0.92);
  color: #52605c;
  padding: 10px;
}

.admin-seo-metrics-v163 strong {
  display: block;
  color: #123c32;
  font-size: 1.15rem;
}

.admin-seo-metrics-v163 .is-warning strong,
.admin-seo-row-v163.is-warning small {
  color: #a06400;
}

.admin-seo-metrics-v163 .is-critical strong,
.admin-seo-row-v163.is-critical small {
  color: #a13030;
}

.admin-seo-grid-v163 {
  display: grid;
  grid-template-columns: minmax(0, 1.15fr) minmax(260px, 0.85fr);
  gap: 18px;
  margin-top: 16px;
}

.admin-seo-list-v163,
.admin-seo-issues-v163 {
  display: grid;
  gap: 8px;
  margin-top: 10px;
}

.admin-seo-row-v163 {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 10px;
  border-left: 4px solid #1f6a58;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.78);
  color: #14201d;
  padding: 10px 12px;
  text-decoration: none;
}

.admin-seo-row-v163.is-warning {
  border-left-color: #d69a25;
}

.admin-seo-row-v163.is-critical {
  border-left-color: #c44d4d;
}

.admin-seo-row-v163 span {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.admin-seo-row-v163 small {
  color: #1f6a58;
  font-weight: 800;
}

.admin-seo-actions-v163 {
  margin: 10px 0 16px;
  padding-left: 20px;
}

.admin-seo-actions-v163 li {
  margin-bottom: 8px;
}

@media (max-width: 760px) {
  .admin-seo-head-v163,
  .admin-seo-grid-v163 {
    grid-template-columns: 1fr;
    display: grid;
  }
}
`;
}

function patchServiceWorker(worker) {
  return bumpVersions(worker);
}

await patchTextFile('server.mjs', patchServer);
await patchTextFile('app.js', patchApp);
await patchTextFile('styles.css', patchStyles);
await patchTextFile('index.html', bumpVersions);
await patchTextFile('suivi.html', bumpVersions);
await patchTextFile('seo-pages.css', bumpVersions);
await patchTextFile('service-worker.js', patchServiceWorker);

console.log('SEO follow-up dashboard v' + VERSION + ' applied.');
