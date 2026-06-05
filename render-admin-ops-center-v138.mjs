import { readFile, writeFile } from 'node:fs/promises';

const VERSION = 138;

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

async function readJsonFileV138(filePath, fallback) {
  try {
    const raw = await readFile(filePath, 'utf8');
    return JSON.parse(raw);
  } catch (error) {
    if (error.code === 'ENOENT') return fallback;
    throw error;
  }
}

async function writeJsonFileV138(filePath, payload) {
  await mkdir(path.dirname(filePath), { recursive: true });
  const tempFile = `${filePath}.tmp`;
  await writeFile(tempFile, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
  await rename(tempFile, filePath);
}

function makeIncidentSignatureV138(alert) {
  return createHash('sha256')
    .update([alert.level || alert.status || 'warning', alert.label || '', alert.detail || ''].join('|'))
    .digest('hex')
    .slice(0, 16);
}

async function readAdminIncidentsV138() {
  const incidents = await readJsonFileV138(ADMIN_INCIDENTS_FILE_V138, []);
  return Array.isArray(incidents) ? incidents : [];
}

async function writeAdminIncidentsV138(incidents) {
  await writeJsonFileV138(ADMIN_INCIDENTS_FILE_V138, incidents.slice(0, 80));
}

async function sendAdminIncidentEmailV138(incident, health) {
  if (!ADMIN_ALERT_EMAIL_V138 || !RESEND_API_KEY || !MAIL_FROM) {
    return { configured: false, sent: false };
  }
  const lines = [
    'Alerte detectee sur Escape Erezee.',
    '',
    `Niveau : ${incident.level}`,
    `Controle : ${incident.label}`,
    `Detail : ${incident.detail}`,
    `Date : ${new Date(incident.lastSeenAt).toISOString()}`,
    '',
    `Parcours : ${health?.summary?.routes ?? 'n/a'}`,
    `Equipes en cours : ${health?.summary?.playingTeams ?? 'n/a'}`,
    `Sauvegardes : ${health?.summary?.backups ?? 'n/a'}`,
    '',
    `${PUBLIC_APP_URL}/index.html#admin`,
  ];
  return sendResendEmail({
    to: ADMIN_ALERT_EMAIL_V138,
    subject: `[Escape Erezee] ${incident.level === 'critical' ? 'Alerte critique' : 'Alerte'} - ${incident.label}`,
    text: lines.join('\n'),
    html: `<div style="font-family:Arial,sans-serif;color:#123c32;line-height:1.5"><h1>Alerte Escape Erezee</h1><p><strong>${escapeHtml(incident.label)}</strong></p><p>${escapeHtml(incident.detail)}</p><p><a href="${escapeHtml(PUBLIC_APP_URL)}/index.html#admin">Ouvrir l'admin</a></p></div>`,
  });
}

async function recordHealthIncidentsV138(health) {
  const alerts = Array.isArray(health?.alerts) ? health.alerts : [];
  if (!alerts.length) return { created: 0, notified: 0 };
  const now = Date.now();
  const incidents = await readAdminIncidentsV138();
  let created = 0;
  let notified = 0;
  for (const alert of alerts) {
    const signature = makeIncidentSignatureV138(alert);
    let incident = incidents.find((item) => item.signature === signature && !item.resolvedAt);
    if (!incident) {
      incident = {
        id: `incident-${now}-${Math.random().toString(36).slice(2, 8)}`,
        signature,
        level: alert.level || alert.status || 'warning',
        label: alert.label || 'Alerte',
        detail: alert.detail || '',
        firstSeenAt: now,
        lastSeenAt: now,
        occurrences: 0,
        notificationCount: 0,
        lastNotificationAt: null,
        resolvedAt: null,
      };
      incidents.unshift(incident);
      created += 1;
    }
    incident.lastSeenAt = now;
    incident.occurrences = Number(incident.occurrences || 0) + 1;
    if (!incident.lastNotificationAt || now - Number(incident.lastNotificationAt) > ADMIN_ALERT_COOLDOWN_MS_V138) {
      const result = await sendAdminIncidentEmailV138(incident, health).catch((error) => ({ configured: true, sent: false, error: error.message }));
      incident.lastNotificationAt = now;
      incident.lastNotificationStatus = result.sent ? 'sent' : result.configured === false ? 'not_configured' : 'error';
      incident.lastNotificationError = result.error || null;
      incident.notificationCount = Number(incident.notificationCount || 0) + (result.sent ? 1 : 0);
      if (result.sent) notified += 1;
    }
  }
  await writeAdminIncidentsV138(incidents);
  return { created, notified };
}

async function runAdminOpsMonitorV138() {
  try {
    const health = await buildAdminHealthStatusV136();
    await recordHealthIncidentsV138(health);
  } catch (error) {
    console.warn('Controle incidents admin impossible.', error);
  }
}

function startAdminOpsMonitorV138() {
  if (adminOpsMonitorTimerV138) return;
  setTimeout(runAdminOpsMonitorV138, 15000);
  adminOpsMonitorTimerV138 = setInterval(runAdminOpsMonitorV138, ADMIN_OPS_INTERVAL_MS_V138);
  adminOpsMonitorTimerV138?.unref?.();
}

async function resolveAdminIncidentV138(id) {
  const incidents = await readAdminIncidentsV138();
  const incident = incidents.find((item) => item.id === id);
  if (!incident) throw new Error('Incident introuvable.');
  incident.resolvedAt = Date.now();
  await writeAdminIncidentsV138(incidents);
  return incident;
}

function getRouteByIdV138(routes, routeId) {
  return routes.find((route) => route.id === routeId) || null;
}

function getLiveProgressV138(team, route) {
  const puzzleIds = new Set((route?.puzzles || []).map((puzzle) => puzzle.id));
  const answers = team?.answers && typeof team.answers === 'object' ? team.answers : {};
  const solved = Object.keys(answers).filter((id) => puzzleIds.has(id) && answers[id]).length;
  const total = puzzleIds.size;
  return { solved, total, percent: total ? Math.round((solved / total) * 100) : 0 };
}

async function buildLiveDashboardV138() {
  const stored = await readStoredData();
  const routes = Array.isArray(stored?.routes) ? stored.routes : [];
  const teams = Array.isArray(stored?.teams) ? stored.teams : [];
  const now = Date.now();
  const rows = teams.map((team) => {
    const route = getRouteByIdV138(routes, team.routeId);
    const lastActivityAt = getTeamLastActivityV136(team);
    const stale = team.status === 'playing' && (!lastActivityAt || now - lastActivityAt > 3 * 60 * 1000);
    return {
      id: team.id,
      name: team.name || team.code || team.id,
      code: team.code || '',
      routeTitle: route?.title || 'Parcours introuvable',
      status: team.status || 'playing',
      progress: getLiveProgressV138(team, route),
      lastActivityAt,
      lastPositionAt: team.lastPosition?.at || null,
      hasPosition: Boolean(team.lastPosition),
      stale,
    };
  }).sort((a, b) => Number(b.lastActivityAt || 0) - Number(a.lastActivityAt || 0));
  return {
    ok: true,
    checkedAt: now,
    summary: {
      total: rows.length,
      playing: rows.filter((row) => row.status === 'playing').length,
      stale: rows.filter((row) => row.stale).length,
      finished: rows.filter((row) => row.status === 'won' || row.status === 'lost').length,
      withoutPosition: rows.filter((row) => row.status === 'playing' && !row.hasPosition).length,
    },
    teams: rows.slice(0, 30),
  };
}

async function buildSalesDashboardV138() {
  const stored = await readStoredData();
  const routes = Array.isArray(stored?.routes) ? stored.routes : [];
  const codes = Array.isArray(stored?.codes) ? stored.codes : [];
  const routeById = new Map(routes.map((route) => [route.id, route]));
  const sourceCounts = codes.reduce((acc, code) => {
    const source = code.source || 'admin';
    acc[source] = (acc[source] || 0) + 1;
    return acc;
  }, {});
  const estimatedRevenueCents = codes
    .filter((code) => code.source === 'stripe')
    .reduce((sum, code) => {
      const route = routeById.get(code.routeId);
      const price = getRoutePriceCents(route);
      const count = getPlayerCount(code.playerCount || 1);
      return sum + price * count;
    }, 0);
  const recent = codes.slice().sort((a, b) => Number(b.createdAt || 0) - Number(a.createdAt || 0)).slice(0, 12).map((code) => ({
    code: code.code,
    routeTitle: routeById.get(code.routeId)?.title || 'Parcours introuvable',
    source: code.source || 'admin',
    status: code.status || 'available',
    createdAt: code.createdAt || null,
    customerName: code.customerName || [code.customerFirstName, code.customerLastName].filter(Boolean).join(' ') || '',
    customerEmail: code.customerEmail || '',
    playerCount: code.playerCount || null,
    emailStatus: code.confirmationEmailSentAt ? 'sent' : code.confirmationEmailStatus || '',
  }));
  return {
    ok: true,
    checkedAt: Date.now(),
    summary: {
      totalCodes: codes.length,
      available: codes.filter((code) => code.status !== 'used').length,
      used: codes.filter((code) => code.status === 'used').length,
      stripe: sourceCounts.stripe || 0,
      odoo: sourceCounts.odoo || 0,
      admin: sourceCounts.admin || 0,
      emailsSent: codes.filter((code) => code.confirmationEmailSentAt).length,
      emailErrors: codes.filter((code) => code.confirmationEmailStatus === 'error').length,
      estimatedRevenueCents,
    },
    recent,
  };
}

async function readAdminSettingsV138() {
  const settings = await readJsonFileV138(ADMIN_SETTINGS_FILE_V138, {});
  return {
    maintenance: {
      enabled: Boolean(settings?.maintenance?.enabled),
      message: compactText(settings?.maintenance?.message) || 'Information temporaire : le site reste accessible, mais une intervention technique est en cours.',
      updatedAt: settings?.maintenance?.updatedAt || null,
    },
  };
}

async function updateMaintenanceSettingsV138(payload) {
  const current = await readAdminSettingsV138();
  const next = {
    ...current,
    maintenance: {
      enabled: Boolean(payload?.enabled),
      message: compactText(payload?.message).slice(0, 240) || current.maintenance.message,
      updatedAt: Date.now(),
    },
  };
  await writeJsonFileV138(ADMIN_SETTINGS_FILE_V138, next);
  return next.maintenance;
}

async function publicCheckV138(label, pathname, includes = []) {
  const baseUrl = String(PUBLIC_APP_URL || 'https://escape-erezee.be').replace(/\/$/, '');
  const cleanPath = String(pathname || '').replace(/^\//, '');
  const targetUrl = `${baseUrl}/${cleanPath}`;
  if (typeof fetch !== 'function') return { label, path: pathname, status: 'warning', detail: 'Verification HTTP indisponible.' };
  try {
    const response = await fetch(`${targetUrl}?seo=${Date.now()}`, { cache: 'no-store' });
    const text = await response.text();
    const missing = includes.filter((needle) => !text.includes(needle));
    return {
      label,
      path: pathname,
      status: response.ok && !missing.length ? 'ok' : 'warning',
      detail: response.ok && !missing.length ? 'Accessible.' : `Reponse ${response.status}${missing.length ? `, contenu absent: ${missing.join(', ')}` : ''}.`,
    };
  } catch (error) {
    return { label, path: pathname, status: 'warning', detail: error.message || 'Verification impossible.' };
  }
}

async function buildSeoDashboardV138() {
  const checks = await Promise.all([
    publicCheckV138('Accueil', '', ['Stock & Sevrin']),
    publicCheckV138('Escape game Ardenne', 'escape-game-ardenne.html', ['Escape game']),
    publicCheckV138('Activite famille Ardenne', 'activite-famille-ardenne.html', ['Activite famille']),
    publicCheckV138('Blog', 'blog.html', ['Que faire']),
    publicCheckV138('Sitemap', 'sitemap.xml', ['escape-erezee.be']),
    publicCheckV138('Robots', 'robots.txt', ['Sitemap:']),
  ]);
  return {
    ok: checks.every((check) => check.status === 'ok'),
    checkedAt: Date.now(),
    checks,
    nextActions: [
      'Ajouter regulierement des photos locales et avis clients.',
      'Publier un article blog utile par mois.',
      'Controler Search Console apres chaque nouvelle page importante.',
    ],
  };
}

const SERVER_OPS_HELPERS = [
  '/* admin-ops-center-v138 */',
  'const ADMIN_ALERT_EMAIL_V138 = compactText(globalThis.process?.env?.ADMIN_ALERT_EMAIL || globalThis.process?.env?.ALERT_EMAIL || MAIL_REPLY_TO || "");',
  'const ADMIN_INCIDENTS_FILE_V138 = path.join(DATA_DIR, "admin-incidents.json");',
  'const ADMIN_SETTINGS_FILE_V138 = path.join(DATA_DIR, "admin-settings.json");',
  'const ADMIN_ALERT_COOLDOWN_MS_V138 = 6 * 60 * 60 * 1000;',
  'const ADMIN_OPS_INTERVAL_MS_V138 = 5 * 60 * 1000;',
  'let adminOpsMonitorTimerV138 = null;',
  readJsonFileV138.toString(),
  writeJsonFileV138.toString(),
  makeIncidentSignatureV138.toString(),
  readAdminIncidentsV138.toString(),
  writeAdminIncidentsV138.toString(),
  sendAdminIncidentEmailV138.toString(),
  recordHealthIncidentsV138.toString(),
  runAdminOpsMonitorV138.toString(),
  startAdminOpsMonitorV138.toString(),
  resolveAdminIncidentV138.toString(),
  getRouteByIdV138.toString(),
  getLiveProgressV138.toString(),
  buildLiveDashboardV138.toString(),
  buildSalesDashboardV138.toString(),
  readAdminSettingsV138.toString(),
  updateMaintenanceSettingsV138.toString(),
  publicCheckV138.toString(),
  buildSeoDashboardV138.toString(),
].join('\n\n');

const SERVER_OPS_ENDPOINTS = `  if (pathname === "/api/public/maintenance") {
    if (request.method !== "GET") {
      sendJson(response, 405, { message: "Methode non autorisee." });
      return true;
    }
    const settings = await readAdminSettingsV138();
    sendJson(response, 200, settings.maintenance);
    return true;
  }

  if (pathname === "/api/admin/incidents") {
    if (!isAdminRequest(request)) {
      sendJson(response, 401, { message: "Connexion gestion requise." });
      return true;
    }
    if (request.method !== "GET") {
      sendJson(response, 405, { message: "Methode non autorisee." });
      return true;
    }
    sendJson(response, 200, {
      ok: true,
      alertEmailConfigured: Boolean(ADMIN_ALERT_EMAIL_V138 && RESEND_API_KEY && MAIL_FROM),
      alertEmail: ADMIN_ALERT_EMAIL_V138 ? ADMIN_ALERT_EMAIL_V138.replace(/(.{2}).+(@.*)/, "$1***$2") : null,
      incidents: await readAdminIncidentsV138(),
    });
    return true;
  }

  if (pathname === "/api/admin/incidents/resolve") {
    if (!isAdminRequest(request)) {
      sendJson(response, 401, { message: "Connexion gestion requise." });
      return true;
    }
    if (request.method !== "POST") {
      sendJson(response, 405, { message: "Methode non autorisee." });
      return true;
    }
    const body = await readRequestBody(request);
    const payload = body ? JSON.parse(body) : {};
    sendJson(response, 200, { ok: true, incident: await resolveAdminIncidentV138(payload.id) });
    return true;
  }

  if (pathname === "/api/admin/alert-test") {
    if (!isAdminRequest(request)) {
      sendJson(response, 401, { message: "Connexion gestion requise." });
      return true;
    }
    if (request.method !== "POST") {
      sendJson(response, 405, { message: "Methode non autorisee." });
      return true;
    }
    const fakeIncident = { level: "info", label: "Test alerte", detail: "E-mail de test depuis l'admin.", lastSeenAt: Date.now() };
    const result = await sendAdminIncidentEmailV138(fakeIncident, await buildAdminHealthStatusV136()).catch((error) => ({ configured: true, sent: false, error: error.message }));
    sendJson(response, result.sent ? 200 : 400, { ok: Boolean(result.sent), ...result, message: result.sent ? "E-mail envoye." : "E-mail non configure ou non envoye." });
    return true;
  }

  if (pathname === "/api/admin/live-dashboard") {
    if (!isAdminRequest(request)) {
      sendJson(response, 401, { message: "Connexion gestion requise." });
      return true;
    }
    if (request.method !== "GET") {
      sendJson(response, 405, { message: "Methode non autorisee." });
      return true;
    }
    sendJson(response, 200, await buildLiveDashboardV138());
    return true;
  }

  if (pathname === "/api/admin/sales-dashboard") {
    if (!isAdminRequest(request)) {
      sendJson(response, 401, { message: "Connexion gestion requise." });
      return true;
    }
    if (request.method !== "GET") {
      sendJson(response, 405, { message: "Methode non autorisee." });
      return true;
    }
    sendJson(response, 200, await buildSalesDashboardV138());
    return true;
  }

  if (pathname === "/api/admin/maintenance") {
    if (!isAdminRequest(request)) {
      sendJson(response, 401, { message: "Connexion gestion requise." });
      return true;
    }
    if (request.method === "GET") {
      sendJson(response, 200, await readAdminSettingsV138());
      return true;
    }
    if (request.method === "POST") {
      const body = await readRequestBody(request);
      const payload = body ? JSON.parse(body) : {};
      sendJson(response, 200, { ok: true, maintenance: await updateMaintenanceSettingsV138(payload) });
      return true;
    }
    sendJson(response, 405, { message: "Methode non autorisee." });
    return true;
  }

  if (pathname === "/api/admin/seo-dashboard") {
    if (!isAdminRequest(request)) {
      sendJson(response, 401, { message: "Connexion gestion requise." });
      return true;
    }
    if (request.method !== "GET") {
      sendJson(response, 405, { message: "Methode non autorisee." });
      return true;
    }
    sendJson(response, 200, await buildSeoDashboardV138());
    return true;
  }
`;

function patchServerStart(server) {
  if (server.includes('startAdminOpsMonitorV138();')) return server;
  if (server.includes('      startAdminHealthMonitorV136();')) {
    return server.replace('      startAdminHealthMonitorV136();', '      startAdminHealthMonitorV136();\n      startAdminOpsMonitorV138();');
  }
  const marker = '      resolve({ server, url, lanUrls, port, host });';
  if (!server.includes(marker)) throw new Error(`Patch v${VERSION} introuvable: demarrage serveur`);
  return server.replace(marker, `      startAdminOpsMonitorV138();\n${marker}`);
}

function patchServer(server) {
  let output = ensureServerImport(server);
  output = insertAfterBlock(output, 'function startAdminHealthMonitorV136', `${SERVER_OPS_HELPERS}\n`, 'admin-ops-center-v138');
  output = insertAfterBlock(output, '  if (pathname === "/api/admin/health") {', SERVER_OPS_ENDPOINTS, 'pathname === "/api/admin/incidents"');
  output = patchServerStart(output);
  return output;
}

const APP_OPS_PATCH = `
/* admin-ops-center-ui-v138 */
const ADMIN_INCIDENTS_URL_V138 = "/api/admin/incidents";
const ADMIN_INCIDENT_RESOLVE_URL_V138 = "/api/admin/incidents/resolve";
const ADMIN_ALERT_TEST_URL_V138 = "/api/admin/alert-test";
const ADMIN_LIVE_DASHBOARD_URL_V138 = "/api/admin/live-dashboard";
const ADMIN_SALES_DASHBOARD_URL_V138 = "/api/admin/sales-dashboard";
const ADMIN_MAINTENANCE_URL_V138 = "/api/admin/maintenance";
const ADMIN_SEO_DASHBOARD_URL_V138 = "/api/admin/seo-dashboard";
const PUBLIC_MAINTENANCE_URL_V138 = "/api/public/maintenance";
let adminOpsRefreshInFlightV138 = false;
let adminOpsLastRefreshAtV138 = 0;

function adminOpsEscapeV138(value) {
  return String(value == null ? "" : value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function adminOpsFormatTimeV138(timestamp) {
  if (!timestamp) return "jamais";
  try { return new Intl.DateTimeFormat("fr-BE", { dateStyle: "short", timeStyle: "short" }).format(new Date(Number(timestamp))); }
  catch { return "date indisponible"; }
}

function adminOpsFormatMoneyV138(cents) {
  return new Intl.NumberFormat("fr-BE", { style: "currency", currency: "EUR" }).format(Number(cents || 0) / 100);
}

async function adminOpsFetchJsonV138(url, options) {
  const response = await fetch(url, Object.assign({
    credentials: "same-origin",
    cache: "no-store",
    headers: { Accept: "application/json" }
  }, options || {}));
  const payload = await response.json().catch(function () { return {}; });
  if (!response.ok) throw new Error(payload.message || "Information indisponible.");
  return payload;
}

function adminOpsEnsurePanelV138() {
  const adminContent = document.querySelector("#admin-content");
  if (!adminContent) return null;
  let panel = document.querySelector("#admin-ops-v138");
  if (!panel) {
    panel = document.createElement("section");
    panel.className = "admin-ops-panel";
    panel.id = "admin-ops-v138";
    panel.innerHTML = [
      '<div class="admin-ops-head">',
        '<div>',
          '<p class="section-label">Pilotage</p>',
          '<h3>Exploitation et croissance</h3>',
          '<p id="admin-ops-summary-v138">Chargement des outils.</p>',
        '</div>',
        '<button class="secondary-button compact-button" type="button" id="admin-ops-refresh-v138">Actualiser</button>',
      '</div>',
      '<div class="admin-ops-grid">',
        '<article class="admin-ops-card" id="admin-incidents-card-v138"></article>',
        '<article class="admin-ops-card" id="admin-live-card-v138"></article>',
        '<article class="admin-ops-card" id="admin-sales-card-v138"></article>',
        '<article class="admin-ops-card" id="admin-maintenance-card-v138"></article>',
        '<article class="admin-ops-card admin-ops-card-wide" id="admin-seo-card-v138"></article>',
      '</div>'
    ].join("");
    const healthPanel = document.querySelector("#admin-health-v136");
    if (healthPanel && healthPanel.parentNode) healthPanel.insertAdjacentElement("afterend", panel);
    else adminContent.prepend(panel);
  }
  const refresh = panel.querySelector("#admin-ops-refresh-v138");
  if (refresh && refresh.dataset.bound !== "1") {
    refresh.dataset.bound = "1";
    refresh.addEventListener("click", function () { adminOpsRefreshV138({ force: true }); });
  }
  return panel;
}

function adminOpsRenderIncidentsV138(payload) {
  const card = document.querySelector("#admin-incidents-card-v138");
  if (!card) return;
  const incidents = Array.isArray(payload.incidents) ? payload.incidents : [];
  const open = incidents.filter(function (item) { return !item.resolvedAt; });
  card.innerHTML = [
    '<p class="section-label">Alertes externes</p>',
    '<h4>' + (open.length ? open.length + ' incident(s) ouvert(s)' : 'Aucun incident ouvert') + '</h4>',
    '<p>' + (payload.alertEmailConfigured ? 'E-mail configure : ' + adminOpsEscapeV138(payload.alertEmail || '') : 'Adresse alerte non configuree.') + '</p>',
    '<div class="admin-ops-actions"><button class="secondary-button compact-button" type="button" id="admin-alert-test-v138">Tester e-mail</button></div>',
    '<div class="admin-ops-list">' + (open.length ? open.slice(0, 4).map(function (incident) {
      return '<div class="admin-ops-row"><strong>' + adminOpsEscapeV138(incident.label) + '</strong><span>' + adminOpsEscapeV138(incident.detail) + '</span><button class="text-button" type="button" data-resolve-incident-v138="' + adminOpsEscapeV138(incident.id) + '">Resoudre</button></div>';
    }).join('') : '<span class="admin-ops-muted">Historique propre.</span>') + '</div>'
  ].join("");
  card.querySelector("#admin-alert-test-v138")?.addEventListener("click", adminOpsSendAlertTestV138);
  Array.from(card.querySelectorAll("[data-resolve-incident-v138]")).forEach(function (button) {
    button.addEventListener("click", function () { adminOpsResolveIncidentV138(button.dataset.resolveIncidentV138); });
  });
}

function adminOpsRenderLiveV138(payload) {
  const card = document.querySelector("#admin-live-card-v138");
  if (!card) return;
  const summary = payload.summary || {};
  const teams = Array.isArray(payload.teams) ? payload.teams : [];
  card.innerHTML = [
    '<p class="section-label">Suivi live</p>',
    '<h4>' + (summary.playing || 0) + ' en cours, ' + (summary.stale || 0) + ' bloquees</h4>',
    '<div class="admin-ops-mini"><span>Total ' + (summary.total || 0) + '</span><span>Terminees ' + (summary.finished || 0) + '</span><span>Sans GPS ' + (summary.withoutPosition || 0) + '</span></div>',
    '<div class="admin-ops-list">' + (teams.length ? teams.slice(0, 5).map(function (team) {
      return '<div class="admin-ops-row"><strong>' + adminOpsEscapeV138(team.name) + '</strong><span>' + adminOpsEscapeV138(team.routeTitle) + ' - ' + (team.progress?.solved || 0) + '/' + (team.progress?.total || 0) + ' - ' + (team.stale ? 'a surveiller' : 'ok') + '</span></div>';
    }).join('') : '<span class="admin-ops-muted">Aucune equipe active.</span>') + '</div>'
  ].join("");
}

function adminOpsRenderSalesV138(payload) {
  const card = document.querySelector("#admin-sales-card-v138");
  if (!card) return;
  const summary = payload.summary || {};
  const recent = Array.isArray(payload.recent) ? payload.recent : [];
  card.innerHTML = [
    '<p class="section-label">Ventes et clients</p>',
    '<h4>' + adminOpsFormatMoneyV138(summary.estimatedRevenueCents) + ' estime</h4>',
    '<div class="admin-ops-mini"><span>Codes ' + (summary.totalCodes || 0) + '</span><span>Stripe ' + (summary.stripe || 0) + '</span><span>Mails envoyes ' + (summary.emailsSent || 0) + '</span></div>',
    '<div class="admin-ops-list">' + (recent.length ? recent.slice(0, 4).map(function (code) {
      return '<div class="admin-ops-row"><strong>' + adminOpsEscapeV138(code.code) + '</strong><span>' + adminOpsEscapeV138(code.routeTitle) + ' - ' + adminOpsEscapeV138(code.source) + ' - ' + adminOpsEscapeV138(code.status) + '</span></div>';
    }).join('') : '<span class="admin-ops-muted">Aucun code pour le moment.</span>') + '</div>'
  ].join("");
}

function adminOpsRenderMaintenanceV138(payload) {
  const card = document.querySelector("#admin-maintenance-card-v138");
  if (!card) return;
  const maintenance = payload.maintenance || payload || {};
  card.innerHTML = [
    '<p class="section-label">Maintenance douce</p>',
    '<h4>' + (maintenance.enabled ? 'Message actif' : 'Message inactif') + '</h4>',
    '<label class="admin-ops-check"><input id="admin-maintenance-enabled-v138" type="checkbox" ' + (maintenance.enabled ? 'checked' : '') + ' /> Afficher un message public</label>',
    '<textarea id="admin-maintenance-message-v138" rows="3">' + adminOpsEscapeV138(maintenance.message || '') + '</textarea>',
    '<button class="secondary-button compact-button" type="button" id="admin-maintenance-save-v138">Enregistrer</button>'
  ].join("");
  card.querySelector("#admin-maintenance-save-v138")?.addEventListener("click", adminOpsSaveMaintenanceV138);
}

function adminOpsRenderSeoV138(payload) {
  const card = document.querySelector("#admin-seo-card-v138");
  if (!card) return;
  const checks = Array.isArray(payload.checks) ? payload.checks : [];
  card.innerHTML = [
    '<p class="section-label">SEO continu</p>',
    '<h4>' + (payload.ok ? 'Pages principales accessibles' : 'A verifier') + '</h4>',
    '<div class="admin-ops-seo-list">' + checks.map(function (check) {
      return '<span class="admin-ops-pill is-' + adminOpsEscapeV138(check.status) + '">' + adminOpsEscapeV138(check.label) + '</span>';
    }).join('') + '</div>',
    '<p class="admin-ops-muted">Prochaine routine : articles blog, photos locales, avis clients et controle Search Console.</p>'
  ].join("");
}

async function adminOpsRefreshV138(options) {
  const panel = adminOpsEnsurePanelV138();
  if (!panel || adminOpsRefreshInFlightV138) return;
  const force = Boolean(options && options.force);
  if (!force && Date.now() - adminOpsLastRefreshAtV138 < 60000) return;
  adminOpsRefreshInFlightV138 = true;
  const summary = document.querySelector("#admin-ops-summary-v138");
  try {
    const results = await Promise.all([
      adminOpsFetchJsonV138(ADMIN_INCIDENTS_URL_V138),
      adminOpsFetchJsonV138(ADMIN_LIVE_DASHBOARD_URL_V138),
      adminOpsFetchJsonV138(ADMIN_SALES_DASHBOARD_URL_V138),
      adminOpsFetchJsonV138(ADMIN_MAINTENANCE_URL_V138),
      adminOpsFetchJsonV138(ADMIN_SEO_DASHBOARD_URL_V138),
    ]);
    adminOpsRenderIncidentsV138(results[0]);
    adminOpsRenderLiveV138(results[1]);
    adminOpsRenderSalesV138(results[2]);
    adminOpsRenderMaintenanceV138(results[3]);
    adminOpsRenderSeoV138(results[4]);
    adminOpsLastRefreshAtV138 = Date.now();
    if (summary) summary.textContent = 'Derniere actualisation : ' + adminOpsFormatTimeV138(adminOpsLastRefreshAtV138);
  } catch (error) {
    if (summary) summary.textContent = error.message || 'Outils indisponibles.';
  } finally {
    adminOpsRefreshInFlightV138 = false;
  }
}

async function adminOpsResolveIncidentV138(id) {
  await adminOpsFetchJsonV138(ADMIN_INCIDENT_RESOLVE_URL_V138, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: id }) });
  showToast('Incident marque comme resolu.');
  adminOpsRefreshV138({ force: true });
}

async function adminOpsSendAlertTestV138() {
  try {
    const payload = await adminOpsFetchJsonV138(ADMIN_ALERT_TEST_URL_V138, { method: 'POST' });
    showToast(payload.message || 'Test envoye.');
  } catch (error) {
    showToast(error.message || 'E-mail alerte non configure.');
  }
}

async function adminOpsSaveMaintenanceV138() {
  const enabled = document.querySelector('#admin-maintenance-enabled-v138')?.checked;
  const message = document.querySelector('#admin-maintenance-message-v138')?.value || '';
  await adminOpsFetchJsonV138(ADMIN_MAINTENANCE_URL_V138, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ enabled: enabled, message: message }) });
  showToast('Mode maintenance mis a jour.');
  adminOpsRefreshV138({ force: true });
  loadPublicMaintenanceV138();
}

function renderPublicMaintenanceV138(maintenance) {
  let banner = document.querySelector('#public-maintenance-v138');
  if (!maintenance || !maintenance.enabled) {
    if (banner) banner.remove();
    return;
  }
  if (!banner) {
    banner = document.createElement('div');
    banner.id = 'public-maintenance-v138';
    banner.className = 'public-maintenance-banner';
    document.body.prepend(banner);
  }
  banner.textContent = maintenance.message || 'Information temporaire : intervention technique en cours.';
}

async function loadPublicMaintenanceV138() {
  try {
    const maintenance = await adminOpsFetchJsonV138(PUBLIC_MAINTENANCE_URL_V138);
    renderPublicMaintenanceV138(maintenance);
  } catch {}
}

if (typeof renderAdmin === 'function' && !window.__adminOpsCenterV138Installed) {
  window.__adminOpsCenterV138Installed = true;
  const previousRenderAdminV138 = renderAdmin;
  renderAdmin = function renderAdminWithOpsCenterV138() {
    const result = previousRenderAdminV138.apply(this, arguments);
    window.setTimeout(function () {
      adminOpsEnsurePanelV138();
      adminOpsRefreshV138();
    }, 0);
    return result;
  };
  window.setTimeout(function () {
    adminOpsEnsurePanelV138();
    adminOpsRefreshV138({ force: true });
  }, 1900);
}

loadPublicMaintenanceV138();
window.setInterval(loadPublicMaintenanceV138, 120000);
`;

function patchApp(app) {
  let output = bumpAssetVersions(app);
  if (!output.includes('admin-ops-center-ui-v138')) output = `${output.trimEnd()}\n${APP_OPS_PATCH}\n`;
  return output;
}

function patchStyles(css) {
  let output = css;
  if (!output.includes('admin-ops-center-ui-v138')) {
    output = `${output.trimEnd()}

/* admin-ops-center-ui-v138 */
.admin-ops-panel {
  display: grid;
  gap: 14px;
  margin: 0 0 18px;
  padding: 16px;
  border: 1px solid rgba(44, 127, 163, 0.18);
  border-radius: var(--radius);
  background: #f7fbfd;
}

.admin-ops-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.admin-ops-head h3,
.admin-ops-card h4 {
  margin: 2px 0 6px;
  color: var(--green);
}

.admin-ops-head p:last-child,
.admin-ops-card p,
.admin-ops-muted {
  margin: 0;
  color: var(--muted);
  line-height: 1.4;
}

.admin-ops-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 12px;
}

.admin-ops-card {
  display: grid;
  gap: 10px;
  min-height: 180px;
  padding: 14px;
  border: 1px solid var(--line);
  border-radius: var(--radius);
  background: #fff;
}

.admin-ops-card-wide {
  grid-column: 1 / -1;
}

.admin-ops-actions,
.admin-ops-mini,
.admin-ops-seo-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.admin-ops-mini span,
.admin-ops-pill {
  display: inline-flex;
  padding: 5px 8px;
  border-radius: 999px;
  background: rgba(31, 106, 88, 0.1);
  color: var(--green);
  font-size: 0.78rem;
  font-weight: 900;
}

.admin-ops-pill.is-warning {
  background: rgba(216, 148, 44, 0.15);
  color: #8b5a00;
}

.admin-ops-list {
  display: grid;
  gap: 8px;
}

.admin-ops-row {
  display: grid;
  gap: 3px;
  padding: 9px 0;
  border-top: 1px solid var(--line);
}

.admin-ops-row span {
  color: var(--muted);
  font-size: 0.86rem;
}

.admin-ops-check {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--ink);
  font-weight: 800;
}

#admin-maintenance-message-v138 {
  width: 100%;
  resize: vertical;
  border: 1px solid var(--line);
  border-radius: var(--radius);
  padding: 10px;
  font: inherit;
}

.public-maintenance-banner {
  position: sticky;
  top: 0;
  z-index: 60;
  padding: 10px 16px;
  background: #fff4d8;
  border-bottom: 1px solid rgba(216, 148, 44, 0.28);
  color: var(--ink);
  font-weight: 800;
  text-align: center;
}

@media (max-width: 720px) {
  .admin-ops-head {
    display: grid;
  }
}
`;
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

console.log(`Admin ops center v${VERSION} applied.`);
