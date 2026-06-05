import { readFile, writeFile } from 'node:fs/promises';

const VERSION = 135;

async function patchTextFile(filePath, patcher) {
  const input = await readFile(filePath, 'utf8');
  const output = patcher(input);
  if (output !== input) await writeFile(filePath, output, 'utf8');
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

function insertAfterBlock(input, signature, insertion, guard) {
  if (input.includes(guard)) return input;
  const start = input.indexOf(signature);
  if (start < 0) throw new Error(`Patch v${VERSION} introuvable: ${signature}`);
  const end = findBlockEnd(input, start);
  if (end < 0) throw new Error(`Patch v${VERSION} impossible: ${signature}`);
  return `${input.slice(0, end)}\n\n${insertion}${input.slice(end)}`;
}

function ensureServerImport(server) {
  const importMatch = server.match(/import \{ ([^}]+) \} from "node:fs\/promises";/);
  if (!importMatch) throw new Error('Import fs/promises introuvable');
  const currentNames = importMatch[1].split(',').map((name) => name.trim()).filter(Boolean);
  const needed = ['mkdir', 'readFile', 'readdir', 'rename', 'stat', 'unlink', 'writeFile'];
  const merged = Array.from(new Set([...currentNames, ...needed])).sort();
  return server.replace(importMatch[0], `import { ${merged.join(', ')} } from "node:fs/promises";`);
}

function getHealthStatusFromChecksV135(checks) {
  if (checks.some((check) => check.status === 'critical')) return 'critical';
  if (checks.some((check) => check.status === 'warning')) return 'warning';
  return 'ok';
}

function normalizeHealthTitleV135(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

function getTeamLastActivityV135(team) {
  const values = [
    team?.lastPosition?.at,
    team?.lastSeenAt,
    team?.lastSyncAt,
    team?.updatedAt,
    team?.finishedAt,
    team?.startAt,
  ].map(Number).filter((value) => Number.isFinite(value) && value > 0);
  return values.length ? Math.max(...values) : null;
}

function getTeamProgressHealthV135(team, route) {
  const puzzleIds = new Set((route?.puzzles || []).map((puzzle) => puzzle.id));
  const answers = team?.answers && typeof team.answers === 'object' ? team.answers : {};
  const solved = Object.keys(answers).filter((id) => puzzleIds.has(id) && answers[id]).length;
  const total = puzzleIds.size;
  return {
    solved,
    total,
    percent: total ? Math.round((solved / total) * 100) : 0,
  };
}

function compactHealthRouteV135(route) {
  return {
    id: route?.id || null,
    title: route?.title || '',
    puzzles: Array.isArray(route?.puzzles) ? route.puzzles.length : 0,
    visible: route?.shopVisible !== false,
    pricePerPerson: route?.pricePerPerson ?? null,
  };
}

async function buildAdminHealthStatusV135() {
  const checkedAt = Date.now();
  const stored = await readStoredData();
  const routes = Array.isArray(stored?.routes) ? stored.routes : [];
  const teams = Array.isArray(stored?.teams) ? stored.teams : [];
  const codes = Array.isArray(stored?.codes) ? stored.codes : [];
  const backups = typeof listDataBackups === 'function' ? await listDataBackups() : [];
  const expectedTitles = EXPECTED_ROUTE_TITLES_V135.map(normalizeHealthTitleV135);
  const routeTitles = routes.map((route) => normalizeHealthTitleV135(route?.title));
  const missingRouteTitles = expectedTitles.filter((title) => !routeTitles.includes(title));
  const latestBackup = backups[0] || null;
  const todayKey = new Date(checkedAt).toISOString().slice(0, 10);
  const dailyToday = backups.find((backup) => String(backup.name || '').startsWith(`escape-data-daily-${todayKey}-`)) || null;
  const latestBackupAgeMs = latestBackup?.modifiedAt ? checkedAt - Number(latestBackup.modifiedAt) : null;
  const routeById = new Map(routes.map((route) => [route.id, route]));
  const playingTeams = teams.filter((team) => team?.status === 'playing');
  const staleTeams = playingTeams
    .map((team) => ({
      id: team.id,
      name: team.name || team.code || team.id,
      routeTitle: routeById.get(team.routeId)?.title || 'Parcours introuvable',
      lastActivityAt: getTeamLastActivityV135(team),
      progress: getTeamProgressHealthV135(team, routeById.get(team.routeId)),
      hasPosition: Boolean(team.lastPosition),
    }))
    .filter((team) => !team.lastActivityAt || checkedAt - team.lastActivityAt > 3 * 60 * 1000);
  const finishedTeams = teams.filter((team) => team?.status === 'won' || team?.status === 'lost');
  const routeIssues = routes.flatMap((route) => {
    const issues = [];
    if (!Array.isArray(route.puzzles) || route.puzzles.length === 0) issues.push(`${route.title || route.id}: aucune enigme`);
    if (route.shopVisible !== false && !(Number(route.pricePerPerson) > 0)) issues.push(`${route.title || route.id}: prix boutique invalide`);
    return issues;
  });
  const orphanCodes = codes.filter((code) => code?.routeId && !routeById.has(code.routeId));
  const orphanTeams = teams.filter((team) => team?.routeId && !routeById.has(team.routeId));
  const checks = [
    {
      id: 'api',
      label: 'Site et API',
      status: stored ? 'ok' : 'critical',
      detail: stored ? 'Donnees serveur lisibles.' : 'Aucune donnee serveur lisible.',
    },
    {
      id: 'routes',
      label: 'Parcours actifs',
      status: missingRouteTitles.length ? 'critical' : routeIssues.length ? 'warning' : 'ok',
      detail: missingRouteTitles.length
        ? `${missingRouteTitles.length} parcours attendu(s) manquant(s).`
        : routeIssues.length
          ? routeIssues.slice(0, 3).join(' | ')
          : `${routes.length} parcours presents et coherents.`,
    },
    {
      id: 'backups',
      label: 'Sauvegardes',
      status: !backups.length ? 'critical' : !dailyToday || (latestBackupAgeMs && latestBackupAgeMs > 26 * 60 * 60 * 1000) ? 'warning' : 'ok',
      detail: !backups.length
        ? 'Aucune sauvegarde disponible.'
        : dailyToday
          ? `${backups.length} sauvegardes, quotidienne du jour presente.`
          : `${backups.length} sauvegardes, quotidienne du jour pas encore creee.`,
    },
    {
      id: 'live-sync',
      label: 'Suivi live',
      status: staleTeams.length ? 'warning' : 'ok',
      detail: staleTeams.length
        ? `${staleTeams.length} equipe(s) en cours sans activite recente.`
        : `${playingTeams.length} equipe(s) en cours, aucune equipe bloquee detectee.`,
    },
    {
      id: 'commerce',
      label: 'Stripe et e-mails',
      status: STRIPE_SECRET_KEY && STRIPE_WEBHOOK_SECRET && RESEND_API_KEY && MAIL_FROM ? 'ok' : 'warning',
      detail: [
        STRIPE_SECRET_KEY ? 'Stripe actif' : 'cle Stripe absente',
        STRIPE_WEBHOOK_SECRET ? 'webhook actif' : 'webhook absent',
        RESEND_API_KEY && MAIL_FROM ? 'e-mails configures' : 'e-mails a verifier',
      ].join(' - '),
    },
    {
      id: 'integrity',
      label: 'Coherence codes/equipes',
      status: orphanCodes.length || orphanTeams.length ? 'warning' : 'ok',
      detail: orphanCodes.length || orphanTeams.length
        ? `${orphanCodes.length} code(s) et ${orphanTeams.length} equipe(s) lies a un parcours absent.`
        : 'Codes et equipes rattaches a des parcours existants.',
    },
    {
      id: 'security',
      label: 'Securite admin',
      status: 'ok',
      detail: 'Tableau de sante reserve a la session gestion.',
    },
  ];
  const status = getHealthStatusFromChecksV135(checks);
  const alerts = checks
    .filter((check) => check.status !== 'ok')
    .map((check) => ({ level: check.status, label: check.label, detail: check.detail }));

  return {
    ok: status !== 'critical',
    status,
    checkedAt,
    summary: {
      routes: routes.length,
      teams: teams.length,
      playingTeams: playingTeams.length,
      finishedTeams: finishedTeams.length,
      codes: codes.length,
      availableCodes: codes.filter((code) => code.status !== 'used').length,
      backups: backups.length,
    },
    checks,
    alerts,
    routes: routes.map(compactHealthRouteV135),
    teams: {
      stale: staleTeams,
      playing: playingTeams.length,
      finished: finishedTeams.length,
    },
    backups: {
      count: backups.length,
      latest: latestBackup,
      dailyToday,
      recent: backups.slice(0, 5),
    },
    commerce: {
      stripeConfigured: Boolean(STRIPE_SECRET_KEY),
      stripeWebhookConfigured: Boolean(STRIPE_WEBHOOK_SECRET),
      emailConfigured: Boolean(RESEND_API_KEY && MAIL_FROM),
      publicUrl: PUBLIC_APP_URL,
    },
  };
}

async function fileCheckV135(label, relativePath, includes = []) {
  const filePath = path.join(ROOT_DIR, relativePath);
  try {
    const raw = await readFile(filePath, 'utf8');
    const missing = includes.filter((needle) => !raw.includes(needle));
    return {
      id: `file-${relativePath}`,
      label,
      status: missing.length ? 'warning' : 'ok',
      detail: missing.length ? `Contenu attendu absent: ${missing.join(', ')}` : `${relativePath} OK`,
    };
  } catch (error) {
    return {
      id: `file-${relativePath}`,
      label,
      status: 'critical',
      detail: `${relativePath} introuvable ou illisible.`,
    };
  }
}

async function runPostDeployChecksV135() {
  const health = await buildAdminHealthStatusV135();
  const staticChecks = await Promise.all([
    fileCheckV135('Accueil', 'index.html', ['app.js?v=135', 'styles.css?v=135']),
    fileCheckV135('Suivi grand ecran', 'suivi.html', ['app.js?v=135', 'styles.css?v=135']),
    fileCheckV135('Sitemap SEO', 'sitemap.xml', ['escape-erezee.be']),
    fileCheckV135('Robots SEO', 'robots.txt', ['sitemap.xml']),
  ]);
  const shopRoutes = health.routes.filter((route) => route.visible && Number(route.pricePerPerson) > 0);
  const checkoutDryRun = {
    id: 'checkout-dry-run',
    label: 'Parcours client achat',
    status: health.commerce.stripeConfigured && health.commerce.stripeWebhookConfigured && shopRoutes.length ? 'ok' : 'warning',
    detail: health.commerce.stripeConfigured && health.commerce.stripeWebhookConfigured && shopRoutes.length
      ? `${shopRoutes.length} parcours vendable(s), Stripe pret. Aucun paiement reel lance.`
      : 'Configuration achat a verifier. Aucun paiement reel lance.',
  };
  const checks = [...health.checks, ...staticChecks, checkoutDryRun];
  const status = getHealthStatusFromChecksV135(checks);
  return {
    ok: status !== 'critical',
    status,
    checkedAt: Date.now(),
    checks,
    health,
  };
}

async function runPlayerSimulationV135() {
  const stored = await readStoredData();
  const routes = Array.isArray(stored?.routes) ? stored.routes : [];
  const simulatedRoutes = routes.map((route) => {
    const puzzles = Array.isArray(route.puzzles) ? route.puzzles : [];
    const sampleTeams = [0, Math.ceil(puzzles.length / 2), puzzles.length].map((solved, index) => {
      const answers = Object.fromEntries(puzzles.slice(0, solved).map((puzzle) => [puzzle.id, 'simulation']));
      const team = {
        id: `simulation-${route.id}-${index}`,
        name: `Simulation ${index + 1}`,
        routeId: route.id,
        status: solved >= puzzles.length && puzzles.length ? 'won' : 'playing',
        startAt: Date.now() - (index + 1) * 60000,
        answers,
        lastPosition: puzzles[0]
          ? { lat: Number(puzzles[0].lat) || 0, lng: Number(puzzles[0].lng) || 0, at: Date.now() }
          : null,
      };
      return {
        name: team.name,
        status: team.status,
        progress: getTeamProgressHealthV135(team, route),
        lastActivityAt: getTeamLastActivityV135(team),
      };
    });
    return {
      id: route.id,
      title: route.title,
      puzzles: puzzles.length,
      simulatedTeams: sampleTeams,
      ok: puzzles.length > 0 && sampleTeams.every((team) => team.progress.total === puzzles.length),
    };
  });
  const checks = [
    {
      id: 'simulation-routes',
      label: 'Simulation multi-joueurs',
      status: simulatedRoutes.every((route) => route.ok) ? 'ok' : 'warning',
      detail: `${simulatedRoutes.reduce((sum, route) => sum + route.simulatedTeams.length, 0)} equipes simulees en lecture seule.`,
    },
  ];
  return {
    ok: checks.every((check) => check.status === 'ok'),
    status: getHealthStatusFromChecksV135(checks),
    checkedAt: Date.now(),
    checks,
    routes: simulatedRoutes,
    note: 'Simulation en memoire uniquement: aucun code, aucune equipe et aucun parcours live ne sont modifies.',
  };
}

async function runAdminHealthMonitorV135() {
  try {
    lastAdminHealthSnapshotV135 = await buildAdminHealthStatusV135();
    if (lastAdminHealthSnapshotV135.status !== 'ok') {
      console.warn('Alerte sante admin.', lastAdminHealthSnapshotV135.alerts);
    }
  } catch (error) {
    console.warn('Controle sante admin impossible.', error);
  }
}

function startAdminHealthMonitorV135() {
  if (adminHealthMonitorTimerV135) return;
  setTimeout(runAdminHealthMonitorV135, 10000);
  adminHealthMonitorTimerV135 = setInterval(runAdminHealthMonitorV135, ADMIN_HEALTH_INTERVAL_MS_V135);
  adminHealthMonitorTimerV135?.unref?.();
}

const SERVER_HEALTH_HELPERS = [
  '/* admin-health-monitor-v135 */',
  'const EXPECTED_ROUTE_TITLES_V135 = ["La Lettre de la Dame de Soy", "Sur les Traces du Vicinal", "Les Balises Perdues de Blier"];',
  'const ADMIN_HEALTH_INTERVAL_MS_V135 = 5 * 60 * 1000;',
  'let adminHealthMonitorTimerV135 = null;',
  'let lastAdminHealthSnapshotV135 = null;',
  getHealthStatusFromChecksV135.toString(),
  normalizeHealthTitleV135.toString(),
  getTeamLastActivityV135.toString(),
  getTeamProgressHealthV135.toString(),
  compactHealthRouteV135.toString(),
  buildAdminHealthStatusV135.toString(),
  fileCheckV135.toString(),
  runPostDeployChecksV135.toString(),
  runPlayerSimulationV135.toString(),
  runAdminHealthMonitorV135.toString(),
  startAdminHealthMonitorV135.toString(),
].join('\n\n');

const SERVER_HEALTH_ENDPOINTS = `  if (pathname === "/api/admin/health") {
    if (!isAdminRequest(request)) {
      sendJson(response, 401, { message: "Connexion gestion requise." });
      return true;
    }
    if (request.method !== "GET") {
      sendJson(response, 405, { message: "Methode non autorisee." });
      return true;
    }
    sendJson(response, 200, await buildAdminHealthStatusV135());
    return true;
  }

  if (pathname === "/api/admin/post-deploy-check") {
    if (!isAdminRequest(request)) {
      sendJson(response, 401, { message: "Connexion gestion requise." });
      return true;
    }
    if (request.method !== "GET" && request.method !== "POST") {
      sendJson(response, 405, { message: "Methode non autorisee." });
      return true;
    }
    sendJson(response, 200, await runPostDeployChecksV135());
    return true;
  }

  if (pathname === "/api/admin/player-simulation") {
    if (!isAdminRequest(request)) {
      sendJson(response, 401, { message: "Connexion gestion requise." });
      return true;
    }
    if (request.method !== "GET" && request.method !== "POST") {
      sendJson(response, 405, { message: "Methode non autorisee." });
      return true;
    }
    sendJson(response, 200, await runPlayerSimulationV135());
    return true;
  }
`;

function patchServerStart(server) {
  if (server.includes('startAdminHealthMonitorV135();')) return server;
  if (server.includes('      startDailyDataBackupsV134();')) {
    return server.replace('      startDailyDataBackupsV134();', '      startDailyDataBackupsV134();\n      startAdminHealthMonitorV135();');
  }
  const marker = '      resolve({ server, url, lanUrls, port, host });';
  if (!server.includes(marker)) throw new Error(`Patch v${VERSION} introuvable: demarrage serveur`);
  return server.replace(marker, `      startAdminHealthMonitorV135();\n${marker}`);
}

function patchServer(server) {
  let output = ensureServerImport(server);
  output = insertAfterBlock(output, 'function startDailyDataBackupsV134', `${SERVER_HEALTH_HELPERS}\n`, 'admin-health-monitor-v135');
  output = insertAfterBlock(output, '  if (pathname === "/api/admin/data-safety/verify") {', SERVER_HEALTH_ENDPOINTS, 'pathname === "/api/admin/health"');
  output = patchServerStart(output);
  return output;
}

const APP_HEALTH_PATCH = `
/* admin-health-monitor-ui-v135 */
const ADMIN_HEALTH_URL_V135 = "/api/admin/health";
const ADMIN_POST_DEPLOY_URL_V135 = "/api/admin/post-deploy-check";
const ADMIN_PLAYER_SIMULATION_URL_V135 = "/api/admin/player-simulation";
let adminHealthRefreshInFlightV135 = false;
let adminHealthLastRefreshAtV135 = 0;
let adminHealthIntervalV135 = null;
let adminHealthLastPayloadV135 = null;

function adminHealthEscapeV135(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function adminHealthFormatTimeV135(timestamp) {
  if (!timestamp) return "jamais";
  try {
    return new Intl.DateTimeFormat("fr-BE", { dateStyle: "short", timeStyle: "short" }).format(new Date(Number(timestamp)));
  } catch {
    return "date indisponible";
  }
}

function adminHealthEnsurePanelV135() {
  const adminContent = document.querySelector("#admin-content");
  if (!adminContent) return null;
  let panel = document.querySelector("#admin-health-v135");
  if (!panel) {
    panel = document.createElement("section");
    panel.className = "admin-health-panel";
    panel.id = "admin-health-v135";
    panel.innerHTML = [
      '<div class="admin-health-head">',
        '<div>',
          '<p class="section-label">Controle automatique</p>',
          '<h3>Centre de sante du site</h3>',
          '<p id="admin-health-summary-v135">Verification en attente.</p>',
        '</div>',
        '<div class="admin-health-actions">',
          '<button class="secondary-button compact-button" type="button" id="admin-health-refresh-v135">Verifier</button>',
          '<button class="secondary-button compact-button" type="button" id="admin-health-postdeploy-v135">Test deploiement</button>',
          '<button class="primary-button compact-button" type="button" id="admin-health-simulate-v135">Simuler 6 joueurs</button>',
        '</div>',
      '</div>',
      '<div class="admin-health-grid" id="admin-health-grid-v135"></div>',
      '<div class="admin-health-alerts" id="admin-health-alerts-v135"></div>',
    ].join("");
    const safetyPanel = document.querySelector("#admin-data-safety-panel");
    if (safetyPanel?.parentNode) safetyPanel.parentNode.insertBefore(panel, safetyPanel);
    else adminContent.prepend(panel);
  }

  const refresh = panel.querySelector("#admin-health-refresh-v135");
  const postDeploy = panel.querySelector("#admin-health-postdeploy-v135");
  const simulate = panel.querySelector("#admin-health-simulate-v135");
  if (refresh && refresh.dataset.bound !== "1") {
    refresh.dataset.bound = "1";
    refresh.addEventListener("click", () => adminHealthRefreshV135({ force: true }));
  }
  if (postDeploy && postDeploy.dataset.bound !== "1") {
    postDeploy.dataset.bound = "1";
    postDeploy.addEventListener("click", () => adminHealthRunActionV135("postDeploy"));
  }
  if (simulate && simulate.dataset.bound !== "1") {
    simulate.dataset.bound = "1";
    simulate.addEventListener("click", () => adminHealthRunActionV135("simulation"));
  }
  return {
    panel,
    summary: panel.querySelector("#admin-health-summary-v135"),
    grid: panel.querySelector("#admin-health-grid-v135"),
    alerts: panel.querySelector("#admin-health-alerts-v135"),
    refresh,
    postDeploy,
    simulate,
  };
}

function adminHealthStatusTextV135(status) {
  if (status === "critical") return "alerte";
  if (status === "warning") return "a surveiller";
  return "ok";
}

function adminHealthRenderChecksV135(payload, label = "Controle") {
  const refs = adminHealthEnsurePanelV135();
  if (!refs) return;
  adminHealthLastPayloadV135 = payload;
  const checks = Array.isArray(payload?.checks) ? payload.checks : [];
  const status = payload?.status || "warning";
  refs.panel.dataset.status = status;
  refs.summary.textContent = `${label} : ${adminHealthStatusTextV135(status)} - ${adminHealthFormatTimeV135(payload?.checkedAt || Date.now())}`;
  refs.grid.innerHTML = checks.map((check) => `
    <article class="admin-health-card is-${adminHealthEscapeV135(check.status || "warning")}">
      <span>${adminHealthEscapeV135(adminHealthStatusTextV135(check.status))}</span>
      <strong>${adminHealthEscapeV135(check.label || check.id)}</strong>
      <p>${adminHealthEscapeV135(check.detail || "")}</p>
    </article>
  `).join("");
  const alerts = Array.isArray(payload?.alerts) ? payload.alerts : checks.filter((check) => check.status !== "ok");
  refs.alerts.innerHTML = alerts.length
    ? alerts.map((alert) => `<p class="admin-health-alert is-${adminHealthEscapeV135(alert.level || alert.status || "warning")}"><strong>${adminHealthEscapeV135(alert.label || "Alerte")}</strong> ${adminHealthEscapeV135(alert.detail || "")}</p>`).join("")
    : '<p class="admin-health-alert is-ok"><strong>Aucune alerte.</strong> Les controles principaux sont au vert.</p>';
}

async function adminHealthFetchJsonV135(url, options = {}) {
  const response = await fetch(url, {
    credentials: "same-origin",
    cache: "no-store",
    headers: { Accept: "application/json", ...(options.headers || {}) },
    ...options,
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.message || "Controle indisponible.");
  return payload;
}

async function adminHealthRefreshV135(options = {}) {
  const refs = adminHealthEnsurePanelV135();
  if (!refs || adminHealthRefreshInFlightV135) return;
  if (!options.force && Date.now() - adminHealthLastRefreshAtV135 < 45000 && adminHealthLastPayloadV135) return;
  adminHealthRefreshInFlightV135 = true;
  refs.refresh.disabled = true;
  try {
    const payload = await adminHealthFetchJsonV135(ADMIN_HEALTH_URL_V135);
    adminHealthLastRefreshAtV135 = Date.now();
    adminHealthRenderChecksV135(payload, "Sante site");
  } catch (error) {
    refs.summary.textContent = error.message || "Controle indisponible.";
  } finally {
    refs.refresh.disabled = false;
    adminHealthRefreshInFlightV135 = false;
  }
}

async function adminHealthRunActionV135(kind) {
  const refs = adminHealthEnsurePanelV135();
  if (!refs) return;
  const button = kind === "simulation" ? refs.simulate : refs.postDeploy;
  button.disabled = true;
  refs.summary.textContent = kind === "simulation" ? "Simulation multi-joueurs en cours..." : "Test post-deploiement en cours...";
  try {
    const url = kind === "simulation" ? ADMIN_PLAYER_SIMULATION_URL_V135 : ADMIN_POST_DEPLOY_URL_V135;
    const payload = await adminHealthFetchJsonV135(url, { method: "POST" });
    adminHealthRenderChecksV135(payload, kind === "simulation" ? "Simulation joueurs" : "Test deploiement");
    showToast(kind === "simulation" ? "Simulation joueurs terminee." : "Test post-deploiement termine.");
  } catch (error) {
    refs.summary.textContent = error.message || "Test impossible.";
  } finally {
    button.disabled = false;
  }
}

function adminHealthStartAutoRefreshV135() {
  if (adminHealthIntervalV135) return;
  adminHealthIntervalV135 = window.setInterval(() => {
    const adminViewActive = document.querySelector("#admin-view")?.classList.contains("is-active");
    if (adminViewActive && document.querySelector("#admin-health-v135")) {
      adminHealthRefreshV135({ force: true });
    }
  }, 60000);
}

if (typeof renderAdmin === "function" && !window.__adminHealthMonitorV135Installed) {
  window.__adminHealthMonitorV135Installed = true;
  const previousRenderAdminV135 = renderAdmin;
  renderAdmin = function renderAdminWithHealthMonitorV135(...args) {
    const result = previousRenderAdminV135.apply(this, args);
    window.setTimeout(() => {
      adminHealthEnsurePanelV135();
      adminHealthRefreshV135();
      adminHealthStartAutoRefreshV135();
    }, 0);
    return result;
  };
  window.setTimeout(() => {
    adminHealthEnsurePanelV135();
    adminHealthRefreshV135({ force: true });
    adminHealthStartAutoRefreshV135();
  }, 1600);
}
`;

function patchApp(app) {
  let output = bumpAssetVersions(app);
  if (!output.includes('admin-health-monitor-ui-v135')) {
    output = `${output.trimEnd()}\n${APP_HEALTH_PATCH}\n`;
  }
  return output;
}

function patchStyles(css) {
  let output = css;
  if (!output.includes('admin-health-monitor-ui-v135')) {
    output = `${output.trimEnd()}\n\n/* admin-health-monitor-ui-v135 */\n.admin-health-panel {\n  display: grid;\n  gap: 14px;\n  margin: 0 0 18px;\n  padding: 16px;\n  border: 1px solid rgba(31, 106, 88, 0.18);\n  border-radius: var(--radius);\n  background: #f8fcfa;\n}\n\n.admin-health-head {\n  display: flex;\n  align-items: flex-start;\n  justify-content: space-between;\n  gap: 16px;\n}\n\n.admin-health-head h3 {\n  margin: 2px 0 6px;\n  color: var(--green);\n}\n\n.admin-health-head p:last-child {\n  margin: 0;\n  color: var(--muted);\n}\n\n.admin-health-actions {\n  display: flex;\n  flex-wrap: wrap;\n  gap: 8px;\n  justify-content: flex-end;\n}\n\n.admin-health-grid {\n  display: grid;\n  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));\n  gap: 10px;\n}\n\n.admin-health-card {\n  min-height: 126px;\n  padding: 12px;\n  border: 1px solid var(--line);\n  border-radius: var(--radius);\n  background: #fff;\n}\n\n.admin-health-card span {\n  display: inline-flex;\n  margin-bottom: 8px;\n  padding: 3px 8px;\n  border-radius: 999px;\n  background: rgba(40, 127, 79, 0.12);\n  color: var(--success);\n  font-size: 0.72rem;\n  font-weight: 900;\n  text-transform: uppercase;\n}\n\n.admin-health-card.is-warning span,\n.admin-health-alert.is-warning strong {\n  color: #9a6700;\n}\n\n.admin-health-card.is-critical span,\n.admin-health-alert.is-critical strong {\n  color: var(--danger);\n}\n\n.admin-health-card.is-warning span {\n  background: rgba(216, 148, 44, 0.14);\n}\n\n.admin-health-card.is-critical span {\n  background: rgba(184, 66, 61, 0.12);\n}\n\n.admin-health-card strong {\n  display: block;\n  margin-bottom: 6px;\n  color: var(--ink);\n}\n\n.admin-health-card p,\n.admin-health-alert {\n  margin: 0;\n  color: var(--muted);\n  font-size: 0.88rem;\n  line-height: 1.4;\n}\n\n.admin-health-alerts {\n  display: grid;\n  gap: 8px;\n}\n\n.admin-health-alert {\n  padding: 10px 12px;\n  border: 1px solid var(--line);\n  border-radius: var(--radius);\n  background: #fff;\n}\n\n.admin-health-alert.is-ok {\n  border-color: rgba(40, 127, 79, 0.22);\n  background: rgba(40, 127, 79, 0.06);\n}\n\n@media (max-width: 720px) {\n  .admin-health-head,\n  .admin-health-actions {\n    display: grid;\n    justify-content: stretch;\n  }\n}\n`;
  }
  return bumpAssetVersions(output);
}

function patchServiceWorker(worker) {
  return bumpAssetVersions(worker).replace(/escape-erezee-v\d+/g, `escape-erezee-v${VERSION}`);
}

await patchTextFile('server.mjs', patchServer);
await patchTextFile('app.js', patchApp);
await patchTextFile('styles.css', patchStyles);
await patchTextFile('index.html', bumpAssetVersions);
await patchTextFile('suivi.html', bumpAssetVersions);
await patchTextFile('service-worker.js', patchServiceWorker);

console.log(`Admin health monitor v${VERSION} applied.`);
