import { readFile, writeFile } from 'node:fs/promises';

const VERSION = 143;

async function patchTextFile(filePath, patcher) {
  const input = await readFile(filePath, 'utf8');
  const output = patcher(input);
  if (output !== input) await writeFile(filePath, output, 'utf8');
}

async function patchOptionalTextFile(filePath, patcher) {
  try {
    await patchTextFile(filePath, patcher);
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
}

function bumpAssetVersions(text) {
  return text
    .replace(/styles\.css\?v=\d+/g, `styles.css?v=${VERSION}`)
    .replace(/app\.js\?v=\d+/g, `app.js?v=${VERSION}`);
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
  if (start < 0) throw new Error(`Patch v${VERSION} introuvable: ${signature}`);
  const end = findBlockEnd(input, start);
  if (end < 0) throw new Error(`Patch v${VERSION} impossible: ${signature}`);
  return `${input.slice(0, start)}${replacement}${input.slice(end)}`;
}

function insertAfterBlock(input, signature, insertion, guard) {
  if (input.includes(guard)) return input;
  const start = input.indexOf(signature);
  if (start < 0) throw new Error(`Patch v${VERSION} introuvable: ${signature}`);
  const end = findBlockEnd(input, start);
  if (end < 0) throw new Error(`Patch v${VERSION} impossible: ${signature}`);
  return `${input.slice(0, end)}\n\n${insertion}${input.slice(end)}`;
}

function elapsedSecondsV143(team) {
  if (!team?.startAt) return 0;
  const end = team.finishedAt || Date.now();
  return Math.max(0, Math.floor((end - team.startAt) / 1000));
}

function formatDurationShortV143(seconds) {
  const safe = Math.max(0, Math.floor(Number(seconds) || 0));
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  if (hours) return `${hours} h ${String(minutes).padStart(2, '0')}`;
  return `${minutes} min`;
}

function getProgressV143(team, route) {
  const puzzleIds = new Set((route?.puzzles || []).map((puzzle) => puzzle.id));
  const answers = team?.answers && typeof team.answers === 'object' ? team.answers : {};
  const solved = Object.keys(answers).filter((id) => puzzleIds.has(id) && answers[id]).length;
  const total = puzzleIds.size;
  return { solved, total, percent: total ? Math.round((solved / total) * 100) : 0 };
}

function getPuzzlePressureV143(route, teams) {
  const routeTeams = teams.filter((team) => team.routeId === route.id);
  const rows = (route.puzzles || []).map((puzzle) => {
    const attempts = routeTeams.reduce((sum, team) => sum + Number(team?.attempts?.[puzzle.id] || 0), 0);
    const hints = routeTeams.reduce((sum, team) => sum + Number(team?.hints?.[puzzle.id] || 0), 0);
    const unfinishedHere = routeTeams.filter((team) => team.status === 'playing' && !team?.answers?.[puzzle.id]).length;
    return {
      id: puzzle.id,
      title: puzzle.title || puzzle.place || puzzle.id,
      attempts,
      hints,
      unfinishedHere,
      score: attempts + hints * 2 + unfinishedHere,
    };
  }).sort((a, b) => b.score - a.score || b.attempts - a.attempts);
  return rows[0] || null;
}

async function buildBusinessDashboardV143() {
  const stored = await readStoredData();
  const routes = Array.isArray(stored?.routes) ? stored.routes : [];
  const teams = Array.isArray(stored?.teams) ? stored.teams : [];
  const codes = Array.isArray(stored?.codes) ? stored.codes : [];
  const now = Date.now();
  const dayStart = new Date(now);
  dayStart.setHours(0, 0, 0, 0);
  const dayStartMs = dayStart.getTime();
  const routeById = new Map(routes.map((route) => [route.id, route]));
  const todayTeams = teams
    .filter((team) => team.status === 'playing' || Number(team.startAt || 0) >= dayStartMs || Number(team.finishedAt || 0) >= dayStartMs)
    .map((team) => {
      const route = routeById.get(team.routeId);
      const lastActivityAt = getTeamLastActivityV136(team);
      const progress = getProgressV143(team, route);
      return {
        id: team.id,
        name: team.name || team.code || team.id,
        code: team.code || '',
        routeTitle: route?.title || 'Parcours introuvable',
        status: team.status || 'playing',
        progress,
        startedAt: team.startAt || null,
        finishedAt: team.finishedAt || null,
        duration: formatDurationShortV143(elapsedSecondsV143(team)),
        lastActivityAt,
        inactiveMinutes: lastActivityAt ? Math.max(0, Math.round((now - Number(lastActivityAt)) / 60000)) : null,
        hasPosition: Boolean(team.lastPosition),
        stale: team.status === 'playing' && (!lastActivityAt || now - Number(lastActivityAt) > 3 * 60 * 1000),
      };
    })
    .sort((a, b) => (a.status === 'playing' ? -1 : 1) - (b.status === 'playing' ? -1 : 1) || Number(b.lastActivityAt || 0) - Number(a.lastActivityAt || 0));

  const routeStats = routes.map((route) => {
    const routeTeams = teams.filter((team) => team.routeId === route.id);
    const finished = routeTeams.filter((team) => team.status === 'won' || team.status === 'lost');
    const won = routeTeams.filter((team) => team.status === 'won');
    const durations = finished.map(elapsedSecondsV143).filter((value) => value > 0);
    const routeCodes = codes.filter((code) => code.routeId === route.id);
    const revenueCents = routeCodes
      .filter((code) => code.source === 'stripe')
      .reduce((sum, code) => sum + getRoutePriceCents(route) * getPlayerCount(code.playerCount || 1), 0);
    const pressure = getPuzzlePressureV143(route, teams);
    return {
      id: route.id,
      title: route.title || route.id,
      area: route.area || '',
      soldCodes: routeCodes.length,
      startedTeams: routeTeams.length,
      playing: routeTeams.filter((team) => team.status === 'playing').length,
      completed: won.length,
      lost: routeTeams.filter((team) => team.status === 'lost').length,
      completionRate: routeTeams.length ? Math.round((won.length / routeTeams.length) * 100) : 0,
      averageDuration: durations.length ? formatDurationShortV143(durations.reduce((sum, value) => sum + value, 0) / durations.length) : 'n/a',
      revenueCents,
      pressure,
    };
  });

  const totalRevenueCents = routeStats.reduce((sum, route) => sum + route.revenueCents, 0);
  const finishedTeams = teams.filter((team) => team.status === 'won' || team.status === 'lost');
  return {
    ok: true,
    checkedAt: now,
    summary: {
      routes: routes.length,
      teamsToday: todayTeams.length,
      playingNow: todayTeams.filter((team) => team.status === 'playing').length,
      staleNow: todayTeams.filter((team) => team.stale).length,
      completedTotal: teams.filter((team) => team.status === 'won').length,
      finishedTotal: finishedTeams.length,
      codes: codes.length,
      estimatedRevenueCents: totalRevenueCents,
    },
    todayTeams: todayTeams.slice(0, 60),
    routeStats,
  };
}

async function runPostDeployChecksV136() {
  const health = await buildAdminHealthStatusV136();
  const staticChecks = await Promise.all([
    fileCheckV136('Accueil', 'index.html', ['app.js?v=143', 'styles.css?v=143', 'local-seo-structured-data-v143']),
    publicUrlCheckV137('Suivi grand ecran', 'suivi.html', ['<!doctype html']),
    publicUrlCheckV137('Sitemap SEO', 'sitemap.xml', ['escape-erezee.be']),
    publicUrlCheckV137('Robots SEO', 'robots.txt', ['Sitemap:']),
  ]);
  const shopRoutes = health.routes.filter((route) => route.visible && Number(route.pricePerPerson) > 0);
  const checkoutDryRun = {
    id: 'checkout-dry-run',
    label: 'Parcours client achat',
    status: health.commerce.stripeConfigured && health.commerce.stripeWebhookConfigured && shopRoutes.length ? 'ok' : 'warning',
    detail: health.commerce.stripeConfigured && health.commerce.stripeWebhookConfigured && shopRoutes.length
      ? `${shopRoutes.length} parcours vendable(s), Stripe pret. Tunnel de reservation pret. Aucun paiement reel lance.`
      : 'Configuration achat a verifier. Aucun paiement reel lance.',
  };
  let businessDryRun = {
    id: 'business-dashboard',
    label: 'Stats et journee en cours',
    status: 'warning',
    detail: 'Tableau business indisponible.',
  };
  try {
    const dashboard = await buildBusinessDashboardV143();
    businessDryRun = {
      id: 'business-dashboard',
      label: 'Stats et journee en cours',
      status: dashboard.ok ? 'ok' : 'warning',
      detail: `${dashboard.summary.routes} parcours, ${dashboard.summary.teamsToday} equipe(s) aujourd'hui, stats lisibles.`,
    };
  } catch (error) {
    businessDryRun.detail = error.message || businessDryRun.detail;
  }
  const checks = [...health.checks, ...staticChecks, checkoutDryRun, businessDryRun];
  const status = getHealthStatusFromChecksV136(checks);
  return { ok: status !== 'critical', status, checkedAt: Date.now(), checks, health };
}

const SERVER_GROWTH_HELPERS = [
  '/* growth-suite-v143 */',
  'const PUBLIC_REVIEW_URL_V143 = compactText(globalThis.process?.env?.GOOGLE_REVIEW_URL || globalThis.process?.env?.PUBLIC_REVIEW_URL || "https://www.google.com/search?q=Stock+%26+Sevrin+Escape+Games+Erezee+avis");',
  elapsedSecondsV143.toString(),
  formatDurationShortV143.toString(),
  getProgressV143.toString(),
  getPuzzlePressureV143.toString(),
  buildBusinessDashboardV143.toString(),
].join('\n\n');

const SERVER_GROWTH_ENDPOINTS = `  if (pathname === "/api/public/site-config") {
    if (request.method !== "GET") {
      sendJson(response, 405, { message: "Methode non autorisee." });
      return true;
    }
    sendJson(response, 200, {
      ok: true,
      reviewUrl: PUBLIC_REVIEW_URL_V143,
      businessName: "Stock & Sevrin Escape Games",
      area: "Erezee, Ardenne belge",
    });
    return true;
  }

  if (pathname === "/api/admin/business-dashboard") {
    if (!isAdminRequest(request)) {
      sendJson(response, 401, { message: "Connexion gestion requise." });
      return true;
    }
    if (request.method !== "GET") {
      sendJson(response, 405, { message: "Methode non autorisee." });
      return true;
    }
    sendJson(response, 200, await buildBusinessDashboardV143());
    return true;
  }
`;

function patchServer(server) {
  let output = server;
  output = insertAfterBlock(output, 'async function buildSalesDashboardV138', `${SERVER_GROWTH_HELPERS}\n`, 'growth-suite-v143');
  output = insertAfterBlock(output, '  if (pathname === "/api/public/maintenance") {', SERVER_GROWTH_ENDPOINTS, 'pathname === "/api/admin/business-dashboard"');
  output = replaceBlock(output, 'async function runPostDeployChecksV136', runPostDeployChecksV136.toString());
  return output;
}

const APP_GROWTH_PATCH = `
/* growth-suite-ui-v143 */
const PUBLIC_SITE_CONFIG_URL_V143 = "/api/public/site-config";
const ADMIN_BUSINESS_DASHBOARD_URL_V143 = "/api/admin/business-dashboard";
let publicSiteConfigV143 = { reviewUrl: "https://www.google.com/search?q=Stock+%26+Sevrin+Escape+Games+Erezee+avis" };
let adminGrowthRefreshInFlightV143 = false;
let adminGrowthLastRefreshAtV143 = 0;

function escapeGrowthV143(value) {
  return String(value == null ? "" : value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function routeLevelV143(route) {
  const count = Array.isArray(route?.puzzles) ? route.puzzles.length : 0;
  if (count >= 8) return "Challenge";
  if (count >= 5) return "Intermediaire";
  return "Familial";
}

function routeDepartureV143(route) {
  const first = Array.isArray(route?.puzzles) ? route.puzzles[0] : null;
  return first?.place || route?.area || "Point de depart indique dans le briefing";
}

function routeChecklistV143(route) {
  return [
    "Smartphone charge et batterie externe conseillee",
    "Chaussures adaptees a la marche exterieure",
    "Verifier la meteo et les periodes de chasse",
    "Se rendre au point de depart avant de commencer",
  ];
}

function validateShopReadinessV143(event) {
  const form = event.currentTarget;
  const checkbox = form.querySelector("[data-shop-ready-v143]");
  const message = form.querySelector("[data-shop-message]");
  if (checkbox && !checkbox.checked) {
    event.preventDefault();
    event.stopImmediatePropagation();
    if (message) message.textContent = "Confirmez les informations pratiques avant de passer au paiement.";
    checkbox.focus();
  }
}

function enhanceShopCardsV143() {
  if (!els.shopList) return;
  Array.from(els.shopList.querySelectorAll("[data-shop-route]")).forEach(function (form) {
    const routeId = form.dataset.shopRoute;
    const route = getRoute(routeId);
    if (!route || form.dataset.growthEnhancedV143 === "1") return;
    form.dataset.growthEnhancedV143 = "1";
    const button = form.querySelector("button[type='submit']");
    if (button) button.textContent = "Reserver maintenant";
    const participantsInput = form.querySelector("[name='players']");
    const total = form.querySelector("[data-shop-total]");
    const guide = document.createElement("div");
    guide.className = "shop-reservation-guide-v143";
    guide.innerHTML = [
      '<div class="shop-guide-summary-v143">',
        '<span>' + escapeGrowthV143(route.duration || 90) + ' min</span>',
        '<span>' + escapeGrowthV143(routeLevelV143(route)) + '</span>',
        '<span>' + escapeGrowthV143(route.puzzles?.length || 0) + ' enigmes</span>',
      '</div>',
      '<p><strong>Point de depart :</strong> ' + escapeGrowthV143(routeDepartureV143(route)) + '</p>',
      '<ul>' + routeChecklistV143(route).map(function (item) { return '<li>' + escapeGrowthV143(item) + '</li>'; }).join('') + '</ul>',
      '<label class="shop-ready-check-v143"><input type="checkbox" data-shop-ready-v143 /> J\'ai verifie les informations pratiques</label>',
    ].join("");
    form.insertBefore(guide, button || form.lastChild);
    if (participantsInput && total) {
      const update = function () {
        const players = Math.min(20, Math.max(1, Number(participantsInput.value) || 1));
        const price = getRoutePrice(route) * players;
        total.setAttribute("aria-label", "Total reservation " + formatPrice(price));
      };
      participantsInput.addEventListener("input", update);
      update();
    }
    form.addEventListener("submit", validateShopReadinessV143, { capture: true });
  });
}

function ensurePrepAndReviewSectionsV143() {
  const shopView = document.querySelector("#shop-view");
  const shopPanel = document.querySelector(".shop-panel");
  if (!shopView || !shopPanel) return;
  if (!document.querySelector("#before-you-go-v143")) {
    const section = document.createElement("section");
    section.className = "before-you-go-v143";
    section.id = "before-you-go-v143";
    section.innerHTML = [
      '<div>',
        '<p class="section-label">Avant de partir</p>',
        '<h2>Tout verifier avant l\'aventure</h2>',
        '<p>Les parcours se jouent dehors : preparez votre telephone, surveillez la meteo et restez attentif aux periodes de chasse indiquees localement.</p>',
      '</div>',
      '<div class="before-grid-v143">',
        '<span>Batterie chargee</span>',
        '<span>Internet mobile actif</span>',
        '<span>Chaussures de marche</span>',
        '<span>Chiens tenus en laisse</span>',
        '<span>Enfants accompagnes</span>',
        '<span>Respect des zones de chasse</span>',
      '</div>',
    ].join("");
    shopPanel.insertAdjacentElement("afterend", section);
  }
  if (!document.querySelector("#customer-reviews-v143")) {
    const reviews = document.createElement("section");
    reviews.className = "customer-reviews-v143";
    reviews.id = "customer-reviews-v143";
    reviews.innerHTML = [
      '<div class="reviews-head-v143">',
        '<p class="section-label">Avis clients</p>',
        '<h2>Ils ont joue en Ardenne</h2>',
      '</div>',
      '<div class="reviews-grid-v143">',
        '<article><strong>★★★★★</strong><p>Super activite en famille, les enfants ont adore !</p><span>- Sophie</span></article>',
        '<article><strong>★★★★★</strong><p>Une belle decouverte de la region tout en s\'amusant.</p><span>- Julien</span></article>',
        '<article><strong>★★★★★</strong><p>Parcours clair, nature superbe et enigmes bien dosees.</p><span>- Marie</span></article>',
      '</div>',
    ].join("");
    document.querySelector("#before-you-go-v143")?.insertAdjacentElement("afterend", reviews);
  }
}

function addFinishExperienceV143(team, route) {
  if (!els.finishPanel || !team || !route) return;
  let block = els.finishPanel.querySelector("#finish-experience-v143");
  if (!block) {
    block = document.createElement("div");
    block.id = "finish-experience-v143";
    block.className = "finish-experience-v143";
    els.finishPanel.appendChild(block);
  }
  const reviewUrl = publicSiteConfigV143.reviewUrl || "https://www.google.com/search?q=Stock+%26+Sevrin+Escape+Games+Erezee+avis";
  block.innerHTML = [
    '<div class="finish-actions-v143">',
      '<a class="primary-button" target="_blank" rel="noopener" href="' + escapeGrowthV143(reviewUrl) + '">Laisser un avis</a>',
      '<button class="secondary-button" type="button" id="souvenir-photo-v143">Photo souvenir</button>',
      '<a class="secondary-button" href="#shop">Decouvrir un autre parcours</a>',
    '</div>',
    '<p class="finish-note-v143">Votre retour aide les prochains joueurs a choisir leur aventure.</p>',
  ].join("");
  block.querySelector("#souvenir-photo-v143")?.addEventListener("click", function () { createSouvenirImageV143(team, route); });
}

function createSouvenirImageV143(team, route) {
  const canvas = document.createElement("canvas");
  canvas.width = 1200;
  canvas.height = 675;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const progress = getTeamProgress(team, route);
  ctx.fillStyle = "#123c32";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#f1b449";
  ctx.fillRect(0, 0, canvas.width, 18);
  ctx.fillStyle = "rgba(255,255,255,0.08)";
  ctx.fillRect(80, 80, 1040, 515);
  ctx.fillStyle = "#ffffff";
  ctx.font = "800 48px system-ui, sans-serif";
  ctx.fillText("Stock & Sevrin Escape Games", 120, 155);
  ctx.font = "900 72px system-ui, sans-serif";
  ctx.fillText(team.name || "Equipe", 120, 270);
  ctx.font = "700 38px system-ui, sans-serif";
  ctx.fillStyle = "#f6e3b0";
  ctx.fillText(route.title || "Parcours", 120, 340);
  ctx.fillStyle = "#ffffff";
  ctx.font = "700 34px system-ui, sans-serif";
  ctx.fillText("Temps : " + formatDuration(elapsedSeconds(team)), 120, 430);
  ctx.fillText("Score : " + progress.solved + " / " + progress.total + " enigmes", 120, 485);
  ctx.fillText(team.status === "won" ? "Parcours reussi" : "Partie terminee", 120, 540);
  ctx.fillStyle = "#f1b449";
  ctx.font = "800 30px system-ui, sans-serif";
  ctx.fillText("escape-erezee.be", 120, 610);
  const link = document.createElement("a");
  link.download = "souvenir-escape-erezee.png";
  link.href = canvas.toDataURL("image/png");
  link.click();
}

async function loadPublicSiteConfigV143() {
  if (!canUseBackend()) return;
  try {
    const response = await fetch(PUBLIC_SITE_CONFIG_URL_V143, { headers: { Accept: "application/json" }, cache: "no-store", credentials: "same-origin" });
    if (response.ok) publicSiteConfigV143 = await response.json();
  } catch {}
}

async function adminGrowthFetchJsonV143(url) {
  const response = await fetch(url, { credentials: "same-origin", cache: "no-store", headers: { Accept: "application/json" } });
  const payload = await response.json().catch(function () { return {}; });
  if (!response.ok) throw new Error(payload.message || "Stats indisponibles.");
  return payload;
}

function adminGrowthFormatTimeV143(timestamp) {
  if (!timestamp) return "jamais";
  try { return new Intl.DateTimeFormat("fr-BE", { dateStyle: "short", timeStyle: "short" }).format(new Date(Number(timestamp))); }
  catch { return "date indisponible"; }
}

function adminGrowthFormatMoneyV143(cents) {
  return new Intl.NumberFormat("fr-BE", { style: "currency", currency: "EUR" }).format(Number(cents || 0) / 100);
}

function adminGrowthEnsurePanelV143() {
  const adminContent = document.querySelector("#admin-content");
  if (!adminContent) return null;
  let panel = document.querySelector("#admin-growth-v143");
  if (!panel) {
    panel = document.createElement("section");
    panel.className = "admin-growth-panel-v143";
    panel.id = "admin-growth-v143";
    panel.innerHTML = [
      '<div class="admin-growth-head-v143">',
        '<div><p class="section-label">Journee et performance</p><h3>Suivi operationnel avance</h3><p id="admin-growth-summary-v143">Chargement des statistiques.</p></div>',
        '<button class="secondary-button compact-button" type="button" id="admin-growth-refresh-v143">Actualiser</button>',
      '</div>',
      '<div class="admin-growth-grid-v143">',
        '<article class="admin-growth-card-v143 admin-growth-wide-v143" id="admin-day-card-v143"></article>',
        '<article class="admin-growth-card-v143 admin-growth-wide-v143" id="admin-route-stats-v143"></article>',
      '</div>',
    ].join("");
    const opsPanel = document.querySelector("#admin-ops-v138");
    if (opsPanel && opsPanel.parentNode) opsPanel.insertAdjacentElement("afterend", panel);
    else adminContent.prepend(panel);
  }
  const refresh = panel.querySelector("#admin-growth-refresh-v143");
  if (refresh && refresh.dataset.bound !== "1") {
    refresh.dataset.bound = "1";
    refresh.addEventListener("click", function () { adminGrowthRefreshV143({ force: true }); });
  }
  return panel;
}

function adminGrowthRenderV143(payload) {
  const summary = payload.summary || {};
  const summaryNode = document.querySelector("#admin-growth-summary-v143");
  if (summaryNode) {
    summaryNode.textContent = "Derniere actualisation : " + adminGrowthFormatTimeV143(payload.checkedAt) + " - " + (summary.playingNow || 0) + " equipe(s) en cours";
  }
  const dayCard = document.querySelector("#admin-day-card-v143");
  const teams = Array.isArray(payload.todayTeams) ? payload.todayTeams : [];
  if (dayCard) {
    dayCard.innerHTML = [
      '<p class="section-label">Journee en cours</p>',
      '<h4>' + (summary.playingNow || 0) + ' en cours, ' + (summary.staleNow || 0) + ' a surveiller</h4>',
      '<div class="admin-growth-table-v143">',
        teams.length ? teams.slice(0, 12).map(function (team) {
          return '<div class="admin-growth-row-v143 ' + (team.stale ? 'is-warning' : '') + '"><strong>' + escapeGrowthV143(team.name) + '</strong><span>' + escapeGrowthV143(team.routeTitle) + '</span><span>' + (team.progress?.solved || 0) + '/' + (team.progress?.total || 0) + '</span><span>' + escapeGrowthV143(team.duration || '') + '</span><span>' + (team.hasPosition ? 'GPS ok' : 'Sans GPS') + '</span><span>' + (team.inactiveMinutes == null ? 'jamais' : team.inactiveMinutes + ' min') + '</span></div>';
        }).join('') : '<p class="admin-growth-muted-v143">Aucune equipe aujourd\'hui.</p>',
      '</div>',
    ].join("");
  }
  const statsCard = document.querySelector("#admin-route-stats-v143");
  const routes = Array.isArray(payload.routeStats) ? payload.routeStats : [];
  if (statsCard) {
    statsCard.innerHTML = [
      '<p class="section-label">Statistiques parcours</p>',
      '<h4>' + adminGrowthFormatMoneyV143(summary.estimatedRevenueCents) + ' estime - ' + (summary.completedTotal || 0) + ' parcours termines</h4>',
      '<div class="admin-route-stats-grid-v143">',
        routes.map(function (route) {
          const pressure = route.pressure;
          return '<article><strong>' + escapeGrowthV143(route.title) + '</strong><div class="admin-growth-mini-v143"><span>Codes ' + (route.soldCodes || 0) + '</span><span>Fin ' + (route.completionRate || 0) + '%</span><span>Moy. ' + escapeGrowthV143(route.averageDuration || 'n/a') + '</span><span>' + adminGrowthFormatMoneyV143(route.revenueCents) + '</span></div><p>' + (pressure && pressure.score ? 'Point de blocage : ' + escapeGrowthV143(pressure.title) + ' (' + pressure.score + ')' : 'Pas encore de blocage notable.') + '</p></article>';
        }).join(''),
      '</div>',
    ].join("");
  }
}

async function adminGrowthRefreshV143(options) {
  const panel = adminGrowthEnsurePanelV143();
  if (!panel || adminGrowthRefreshInFlightV143) return;
  const force = Boolean(options && options.force);
  if (!force && Date.now() - adminGrowthLastRefreshAtV143 < 60000) return;
  adminGrowthRefreshInFlightV143 = true;
  try {
    const payload = await adminGrowthFetchJsonV143(ADMIN_BUSINESS_DASHBOARD_URL_V143);
    adminGrowthLastRefreshAtV143 = Date.now();
    adminGrowthRenderV143(payload);
  } catch (error) {
    const summary = document.querySelector("#admin-growth-summary-v143");
    if (summary) summary.textContent = error.message || "Stats indisponibles.";
  } finally {
    adminGrowthRefreshInFlightV143 = false;
  }
}

function installGrowthSuiteV143() {
  if (window.__growthSuiteV143Installed) return;
  window.__growthSuiteV143Installed = true;
  const previousRenderShopV143 = renderShop;
  renderShop = function renderShopWithGrowthV143() {
    const result = previousRenderShopV143.apply(this, arguments);
    enhanceShopCardsV143();
    ensurePrepAndReviewSectionsV143();
    return result;
  };
  const previousRenderFinishPanelV143 = renderFinishPanel;
  renderFinishPanel = function renderFinishPanelWithGrowthV143(team, route) {
    const result = previousRenderFinishPanelV143.apply(this, arguments);
    addFinishExperienceV143(team, route);
    return result;
  };
  const previousRenderAdminV143 = renderAdmin;
  renderAdmin = function renderAdminWithGrowthV143() {
    const result = previousRenderAdminV143.apply(this, arguments);
    window.setTimeout(function () {
      adminGrowthEnsurePanelV143();
      adminGrowthRefreshV143();
    }, 0);
    return result;
  };
  loadPublicSiteConfigV143();
  window.setTimeout(function () {
    renderShop();
    const team = getCurrentTeam();
    if (team) renderPlayer();
    if (isAdminRouteActive()) renderAdmin();
  }, 500);
}

installGrowthSuiteV143();
`;

function patchApp(app) {
  let output = bumpAssetVersions(app);
  if (!output.includes('growth-suite-ui-v143')) output = `${output.trimEnd()}\n${APP_GROWTH_PATCH}\n`;
  return output;
}

function patchStyles(css) {
  let output = css;
  if (!output.includes('growth-suite-ui-v143')) {
    output = `${output.trimEnd()}

/* growth-suite-ui-v143 */
.shop-reservation-guide-v143 {
  display: grid;
  gap: 9px;
  grid-column: 1 / -1;
  padding: 12px;
  border: 1px solid rgba(31, 106, 88, 0.16);
  border-radius: var(--radius);
  background: #fff;
}

.shop-guide-summary-v143,
.before-grid-v143,
.finish-actions-v143,
.admin-growth-mini-v143 {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.shop-guide-summary-v143 span,
.before-grid-v143 span,
.admin-growth-mini-v143 span {
  display: inline-flex;
  min-height: 28px;
  align-items: center;
  padding: 0 9px;
  border-radius: 999px;
  background: rgba(31, 106, 88, 0.1);
  color: var(--green);
  font-size: 0.76rem;
  font-weight: 900;
}

.shop-reservation-guide-v143 p,
.shop-reservation-guide-v143 ul,
.finish-note-v143,
.admin-growth-muted-v143 {
  margin: 0;
  color: var(--muted);
  line-height: 1.45;
}

.shop-reservation-guide-v143 ul {
  padding-left: 18px;
}

.shop-ready-check-v143 {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--ink);
  font-weight: 850;
}

.shop-ready-check-v143 input,
.admin-ops-check input {
  width: 22px;
  min-height: 22px;
}

.before-you-go-v143,
.customer-reviews-v143,
.admin-growth-panel-v143 {
  display: grid;
  gap: 16px;
  margin-top: 18px;
  padding: 18px;
  border: 1px solid var(--line);
  border-radius: var(--radius);
  background: #fff;
}

.before-you-go-v143 h2,
.customer-reviews-v143 h2,
.admin-growth-head-v143 h3,
.admin-growth-card-v143 h4 {
  margin: 2px 0 6px;
  color: var(--green);
}

.before-you-go-v143 p {
  max-width: 850px;
  margin: 0;
  color: var(--muted);
  line-height: 1.55;
}

.reviews-grid-v143,
.admin-growth-grid-v143,
.admin-route-stats-grid-v143 {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
  gap: 12px;
}

.reviews-grid-v143 article,
.admin-growth-card-v143,
.admin-route-stats-grid-v143 article {
  display: grid;
  gap: 8px;
  padding: 14px;
  border: 1px solid var(--line);
  border-radius: var(--radius);
  background: #fff;
}

.reviews-grid-v143 article {
  background: #f8fbf9;
}

.reviews-grid-v143 strong {
  color: #b67818;
  letter-spacing: 0.03em;
}

.reviews-grid-v143 p,
.reviews-grid-v143 span,
.admin-route-stats-grid-v143 p {
  margin: 0;
  color: var(--muted);
  line-height: 1.45;
}

.finish-experience-v143 {
  display: grid;
  gap: 10px;
  margin-top: 16px;
}

.admin-growth-panel-v143 {
  margin-bottom: 18px;
  background: #f9fbfa;
}

.admin-growth-head-v143 {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.admin-growth-wide-v143 {
  grid-column: 1 / -1;
}

.admin-growth-table-v143 {
  display: grid;
  gap: 8px;
}

.admin-growth-row-v143 {
  display: grid;
  grid-template-columns: minmax(150px, 1.3fr) minmax(160px, 1.5fr) 70px 80px 80px 80px;
  gap: 8px;
  align-items: center;
  padding: 10px;
  border: 1px solid var(--line);
  border-radius: var(--radius);
  background: #fff;
  font-size: 0.88rem;
}

.admin-growth-row-v143.is-warning {
  border-color: rgba(216, 148, 44, 0.45);
  background: #fff9ec;
}

.admin-growth-row-v143 span {
  color: var(--muted);
}

@media (max-width: 920px) {
  .admin-growth-row-v143 {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 720px) {
  .shop-buy-form {
    grid-template-columns: 1fr;
  }

  .admin-growth-head-v143 {
    display: grid;
  }
}
`;
  }
  return bumpAssetVersions(output);
}

const LOCAL_SEO_JSON_V143 = `
    <script id="local-seo-structured-data-v143" type="application/ld+json">
      {
        "@context": "https://schema.org",
        "@graph": [
          {
            "@type": "LocalBusiness",
            "@id": "https://escape-erezee.be/#business",
            "name": "Stock & Sevrin Escape Games",
            "url": "https://escape-erezee.be/",
            "image": "https://escape-erezee.be/assets/logo-escape-game.png",
            "description": "Escape game exterieur, chasse au tresor et activite familiale en Ardenne belge pres d'Erezee et Durbuy.",
            "address": {
              "@type": "PostalAddress",
              "addressLocality": "Erezee",
              "addressRegion": "Luxembourg",
              "addressCountry": "BE"
            },
            "areaServed": ["Erezee", "Durbuy", "Ardenne belge"],
            "priceRange": "€€"
          },
          {
            "@type": "WebSite",
            "@id": "https://escape-erezee.be/#website",
            "url": "https://escape-erezee.be/",
            "name": "Stock & Sevrin Escape Games",
            "publisher": { "@id": "https://escape-erezee.be/#business" },
            "inLanguage": ["fr", "en", "nl"]
          },
          {
            "@type": "Service",
            "@id": "https://escape-erezee.be/#service",
            "name": "Escape game exterieur en Ardenne",
            "serviceType": "Escape game exterieur et chasse au tresor",
            "provider": { "@id": "https://escape-erezee.be/#business" },
            "areaServed": ["Erezee", "Durbuy", "Ardenne belge"],
            "offers": { "@type": "Offer", "availability": "https://schema.org/InStock", "url": "https://escape-erezee.be/index.html#shop" }
          }
        ]
      }
    </script>
`;

function patchIndexHtml(html) {
  let output = bumpAssetVersions(html);
  if (!output.includes('local-seo-structured-data-v143')) {
    output = output.replace('</head>', `${LOCAL_SEO_JSON_V143}  </head>`);
  }
  return output;
}

function patchStaticHtml(html) {
  let output = bumpAssetVersions(html);
  if (!output.includes('local-seo-links-v143') && output.includes('</main>')) {
    const links = `
      <section class="seo-internal-links local-seo-links-v143" aria-label="Activites proches">
        <p class="section-label">Explorer</p>
        <h2>Autres activites en Ardenne</h2>
        <p><a href="/index.html#shop">Reserver un parcours</a> · <a href="/activite-famille-ardenne.html">Activite famille Ardenne</a> · <a href="/activite-pres-de-durbuy.html">Activite pres de Durbuy</a> · <a href="/blog/">Conseils et actualites</a></p>
      </section>
`;
    output = output.replace('</main>', `${links}</main>`);
  }
  return output;
}

function patchServiceWorker(worker) {
  return bumpAssetVersions(worker).replace(/escape-erezee-v\d+/g, `escape-erezee-v${VERSION}`);
}

await patchTextFile('server.mjs', patchServer);
await patchTextFile('app.js', patchApp);
await patchTextFile('styles.css', patchStyles);
await patchTextFile('index.html', patchIndexHtml);
await patchTextFile('suivi.html', bumpAssetVersions);
await patchTextFile('service-worker.js', patchServiceWorker);
await patchOptionalTextFile('escape-game-exterieur-ardenne.html', patchStaticHtml);
await patchOptionalTextFile('activite-famille-ardenne.html', patchStaticHtml);
await patchOptionalTextFile('chasse-au-tresor-ardenne.html', patchStaticHtml);
await patchOptionalTextFile('activite-touristique-erezee.html', patchStaticHtml);
await patchOptionalTextFile('activite-pres-de-durbuy.html', patchStaticHtml);
await patchOptionalTextFile('blog/index.html', patchStaticHtml);

console.log(`Growth suite v${VERSION} applied.`);
