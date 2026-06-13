import { readFile, writeFile } from "node:fs/promises";

const VERSION = 167;

async function patchTextFile(filePath, patcher) {
  const input = await readFile(filePath, "utf8");
  const output = patcher(input);
  if (output !== input) await writeFile(filePath, output, "utf8");
}

function bumpAssets(text) {
  return text
    .replace(/styles\.css\?v=\d+/g, `styles.css?v=${VERSION}`)
    .replace(/app\.js\?v=\d+/g, `app.js?v=${VERSION}`);
}

function findBlockEnd(input, start) {
  const bodyStart = input.indexOf("{", start);
  if (bodyStart < 0) return -1;
  let depth = 0;
  let quote = null;
  let escaped = false;
  for (let index = bodyStart; index < input.length; index += 1) {
    const char = input[index];
    if (quote) {
      if (escaped) escaped = false;
      else if (char === "\\") escaped = true;
      else if (char === quote) quote = null;
      continue;
    }
    if (char === "\"" || char === "'" || char === "`") {
      quote = char;
      continue;
    }
    if (char === "{") depth += 1;
    if (char === "}") {
      depth -= 1;
      if (depth === 0) return index + 1;
    }
  }
  return -1;
}

function insertAfterBlock(input, signature, insertion, guard) {
  if (input.includes(guard)) return input;
  const start = input.indexOf(signature);
  if (start < 0) throw new Error("Patch v167 introuvable: " + signature);
  const end = findBlockEnd(input, start);
  if (end < 0) throw new Error("Patch v167 impossible: " + signature);
  return input.slice(0, end) + "\n\n" + insertion + input.slice(end);
}

function ensureServerImport(server) {
  const match = server.match(/import \{ ([^}]+) \} from "node:fs\/promises";/);
  if (!match) throw new Error("Import fs/promises introuvable.");
  const current = match[1].split(",").map((item) => item.trim()).filter(Boolean);
  const needed = ["mkdir", "readFile", "readdir", "rename", "stat", "writeFile"];
  const merged = Array.from(new Set([...current, ...needed])).sort();
  return server.replace(match[0], "import { " + merged.join(", ") + " } from \"node:fs/promises\";");
}

function ensureBackupConstant(server) {
  if (server.includes("const DATA_BACKUP_DIR =")) return server;
  return server.replace(
    "const DATA_FILE = path.join(DATA_DIR, \"escape-data.json\");",
    "const DATA_FILE = path.join(DATA_DIR, \"escape-data.json\");\nconst DATA_BACKUP_DIR = path.join(DATA_DIR, \"backups\");",
  );
}

const SERVER_HELPERS = `const ADMIN_ROBUSTNESS_MIN_ROUTE_COUNT_V167 = 3;
const ADMIN_ROBUSTNESS_BACKUP_COOLDOWN_MS_V167 = 10 * 60 * 1000;
let adminRobustnessLastBackupAtV167 = 0;

function adminRobustnessHashV167(value) {
  return createHash("sha256").update(JSON.stringify(value || null)).digest("hex").slice(0, 16);
}

function adminRobustnessDuplicatesV167(values) {
  const seen = new Set();
  const duplicates = new Set();
  values.filter(Boolean).forEach((value) => {
    if (seen.has(value)) duplicates.add(value);
    seen.add(value);
  });
  return Array.from(duplicates);
}

function validateAdminDataPayloadV167(previousData, nextData, request) {
  const issues = [];
  const warnings = [];
  if (!isAppData(nextData)) return { ok: false, issues: ["Format de donnees invalide."], warnings };

  const previousRoutes = Array.isArray(previousData?.routes) ? previousData.routes : [];
  const nextRoutes = Array.isArray(nextData.routes) ? nextData.routes : [];
  const routeIds = nextRoutes.map((route) => compactText(route?.id));
  const routeIdSet = new Set(routeIds.filter(Boolean));
  const override = compactText(request?.headers?.["x-admin-danger-confirm"]) === "routes-delete";

  if (nextRoutes.length < ADMIN_ROBUSTNESS_MIN_ROUTE_COUNT_V167) {
    issues.push("Sauvegarde bloquee: " + nextRoutes.length + " parcours seulement, " + ADMIN_ROBUSTNESS_MIN_ROUTE_COUNT_V167 + " minimum attendus.");
  }
  if (previousRoutes.length >= ADMIN_ROBUSTNESS_MIN_ROUTE_COUNT_V167 && nextRoutes.length < previousRoutes.length && !override) {
    issues.push("Sauvegarde bloquee: cette action ferait disparaitre un ou plusieurs parcours.");
  }
  const duplicateRouteIds = adminRobustnessDuplicatesV167(routeIds);
  if (duplicateRouteIds.length) issues.push("Identifiants de parcours en double: " + duplicateRouteIds.join(", ") + ".");
  if (routeIds.some((id) => !id)) issues.push("Un parcours n'a pas d'identifiant.");
  if (nextRoutes.some((route) => !compactText(route?.title))) issues.push("Un parcours n'a pas de titre.");
  if (nextData.activeRouteId && !routeIdSet.has(compactText(nextData.activeRouteId))) {
    issues.push("Le parcours actif ne correspond a aucun parcours existant.");
  }

  nextRoutes.forEach((route) => {
    const label = route?.title || route?.id || "Parcours";
    const puzzleIds = Array.isArray(route?.puzzles) ? route.puzzles.map((puzzle) => compactText(puzzle?.id)) : [];
    const duplicatePuzzleIds = adminRobustnessDuplicatesV167(puzzleIds);
    if (!Array.isArray(route?.puzzles) || route.puzzles.length === 0) warnings.push(label + ": aucune enigme renseignee.");
    if (duplicatePuzzleIds.length) issues.push(label + ": enigmes en double (" + duplicatePuzzleIds.join(", ") + ").");
    if (puzzleIds.some((id) => !id)) issues.push(label + ": une enigme n'a pas d'identifiant.");
  });

  const codeValues = Array.isArray(nextData.codes) ? nextData.codes.map((code) => compactText(code?.code)) : [];
  const duplicateCodes = adminRobustnessDuplicatesV167(codeValues);
  if (duplicateCodes.length) issues.push("Codes d'acces en double: " + duplicateCodes.slice(0, 5).join(", ") + ".");
  (nextData.codes || []).forEach((code) => {
    if (code?.routeId && !routeIdSet.has(compactText(code.routeId))) {
      issues.push("Code " + (code.code || "sans nom") + " lie a un parcours absent.");
    }
  });
  (nextData.teams || []).forEach((team) => {
    if (team?.routeId && !routeIdSet.has(compactText(team.routeId))) {
      warnings.push("Equipe " + (team.name || team.code || team.id || "sans nom") + " liee a un parcours absent.");
    }
  });

  return { ok: issues.length === 0, issues, warnings };
}

async function listAdminRobustnessBackupsV167() {
  if (typeof listDataBackups === "function") return listDataBackups();
  try {
    const entries = await readdir(DATA_BACKUP_DIR, { withFileTypes: true });
    const backups = await Promise.all(entries
      .filter((entry) => entry.isFile() && entry.name.endsWith(".json"))
      .map(async (entry) => {
        const filePath = path.join(DATA_BACKUP_DIR, entry.name);
        const fileStat = await stat(filePath);
        return { name: entry.name, size: fileStat.size, modifiedAt: fileStat.mtimeMs };
      }));
    return backups.sort((a, b) => b.modifiedAt - a.modifiedAt);
  } catch (error) {
    if (error.code === "ENOENT") return [];
    throw error;
  }
}

async function createAdminRobustnessBackupV167(reason = "manual") {
  if (reason === "manual" && typeof createManualDataBackup === "function") return createManualDataBackup();
  const raw = await readFile(DATA_FILE, "utf8");
  const parsed = JSON.parse(raw);
  if (!isAppData(parsed)) throw new Error("Donnees serveur illisibles.");
  await mkdir(DATA_BACKUP_DIR, { recursive: true });
  const safeReason = compactText(reason).replace(/[^a-z0-9-]+/gi, "-").slice(0, 40) || "admin";
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const fileName = "escape-data-" + safeReason + "-" + stamp + ".json";
  await writeFile(path.join(DATA_BACKUP_DIR, fileName), raw.endsWith("\\n") ? raw : raw + "\\n", "utf8");
  const fileStat = await stat(path.join(DATA_BACKUP_DIR, fileName));
  return { name: fileName, size: fileStat.size, modifiedAt: fileStat.mtimeMs };
}

async function createAdminPreSaveBackupV167(previousData, nextData) {
  if (!previousData || !nextData) return null;
  if (adminRobustnessHashV167(previousData) === adminRobustnessHashV167(nextData)) return null;
  const previousRoutes = Array.isArray(previousData.routes) ? previousData.routes.length : 0;
  const nextRoutes = Array.isArray(nextData.routes) ? nextData.routes.length : 0;
  const previousCodes = Array.isArray(previousData.codes) ? previousData.codes.length : 0;
  const nextCodes = Array.isArray(nextData.codes) ? nextData.codes.length : 0;
  const previousTeams = Array.isArray(previousData.teams) ? previousData.teams.length : 0;
  const nextTeams = Array.isArray(nextData.teams) ? nextData.teams.length : 0;
  const sensitive = nextRoutes < previousRoutes || nextCodes < previousCodes || nextTeams < previousTeams;
  if (!sensitive && Date.now() - adminRobustnessLastBackupAtV167 < ADMIN_ROBUSTNESS_BACKUP_COOLDOWN_MS_V167) return null;
  adminRobustnessLastBackupAtV167 = Date.now();
  try {
    return await createAdminRobustnessBackupV167("before-admin-save");
  } catch (error) {
    adminRobustnessLastBackupAtV167 = 0;
    throw error;
  }
}

function getTeamLastActivityV167(team) {
  const values = [team?.lastPosition?.at, team?.lastSeenAt, team?.lastSyncAt, team?.updatedAt, team?.finishedAt, team?.startAt]
    .map(Number)
    .filter((value) => Number.isFinite(value) && value > 0);
  return values.length ? Math.max(...values) : null;
}

async function buildAdminRobustnessStatusV167() {
  const checkedAt = Date.now();
  const stored = await readStoredData();
  const backups = await listAdminRobustnessBackupsV167();
  const validation = validateAdminDataPayloadV167(stored, stored, { headers: {} });
  const routes = Array.isArray(stored?.routes) ? stored.routes : [];
  const teams = Array.isArray(stored?.teams) ? stored.teams : [];
  const codes = Array.isArray(stored?.codes) ? stored.codes : [];
  const playingTeams = teams.filter((team) => team?.status === "playing");
  const staleTeams = playingTeams
    .map((team) => ({ id: team.id, name: team.name || team.code || team.id, lastActivityAt: getTeamLastActivityV167(team) }))
    .filter((team) => !team.lastActivityAt || checkedAt - team.lastActivityAt > 5 * 60 * 1000);
  const latestBackup = backups[0] || null;
  const backupAgeMs = latestBackup?.modifiedAt ? checkedAt - Number(latestBackup.modifiedAt) : null;
  const warnings = [
    ...validation.warnings,
    ...(staleTeams.length ? [staleTeams.length + " equipe(s) en cours sans activite depuis plus de 5 minutes."] : []),
    ...(!latestBackup ? ["Aucune sauvegarde detectee."] : backupAgeMs > 26 * 60 * 60 * 1000 ? ["Derniere sauvegarde trop ancienne."] : []),
  ];
  return {
    ok: Boolean(stored) && validation.ok,
    checkedAt,
    hash: stored ? adminRobustnessHashV167(stored) : null,
    summary: { routes: routes.length, codes: codes.length, teams: teams.length, playingTeams: playingTeams.length, backups: backups.length },
    guards: { routeLossBlocked: true, duplicateIdsBlocked: true, activeRouteChecked: true, adminPreSaveBackup: true, atomicWrite: true },
    validation,
    warnings,
    staleTeams,
    latestBackup,
    recentBackups: backups.slice(0, 5),
  };
}
`;

function patchServer(server) {
  let next = ensureServerImport(server);
  next = ensureBackupConstant(next);
  next = insertAfterBlock(next, "async function writeStoredData", SERVER_HELPERS, "ADMIN_ROBUSTNESS_MIN_ROUTE_COUNT_V167");

  if (!next.includes('pathname === "/api/admin/robustness"')) {
    const marker = `  if (pathname === "/api/admin/logout") {
    if (request.method !== "POST") {
      sendJson(response, 405, { message: "Methode non autorisee." });
      return true;
    }
    sendJson(response, 200, { ok: true }, {
      "Set-Cookie": makeAdminCookie(request, "", 0),
    });
    return true;
  }
`;
    if (!next.includes(marker)) throw new Error("Endpoint admin logout introuvable.");
    next = next.replace(marker, marker + `
  if (pathname === "/api/admin/robustness") {
    if (!isAdminRequest(request)) {
      sendJson(response, 401, { message: "Connexion gestion requise." });
      return true;
    }
    if (request.method === "GET") {
      try {
        sendJson(response, 200, await buildAdminRobustnessStatusV167());
      } catch (error) {
        sendJson(response, 500, { message: error.message || "Diagnostic robustesse indisponible." });
      }
      return true;
    }
    if (request.method === "POST") {
      try {
        const body = await readRequestBody(request).catch(() => "{}");
        const payload = body ? JSON.parse(body) : {};
        if (payload.action !== "backup") {
          sendJson(response, 400, { message: "Action robuste inconnue." });
          return true;
        }
        const backup = await withDataMutation(() => createAdminRobustnessBackupV167("manual"));
        sendJson(response, 200, { ok: true, backup, status: await buildAdminRobustnessStatusV167() });
      } catch (error) {
        sendJson(response, 500, { message: error.message || "Sauvegarde robuste impossible." });
      }
      return true;
    }
    sendJson(response, 405, { message: "Methode non autorisee." });
    return true;
  }
`);
  }

  if (!next.includes("ADMIN_ROBUSTNESS_GUARD_V167")) {
    const modernMarker = `        const nextPayload = adminWrite || !stored ? payload : syncMergePlayerSafeData(stored, payload);
        await writeStoredData(nextPayload);
`;
    const modernPatch = `        const nextPayload = adminWrite || !stored ? payload : syncMergePlayerSafeData(stored, payload);
        if (adminWrite) {
          const guard = validateAdminDataPayloadV167(stored, nextPayload, request);
          if (!guard.ok) {
            return { status: 409, payload: { message: guard.issues[0] || "Sauvegarde bloquee par la robustesse admin.", code: "ADMIN_ROBUSTNESS_GUARD_V167", issues: guard.issues, warnings: guard.warnings } };
          }
          await createAdminPreSaveBackupV167(stored, nextPayload);
        }
        await writeStoredData(nextPayload);
`;
    if (next.includes(modernMarker)) {
      next = next.replace(modernMarker, modernPatch);
    } else {
      const legacyMarker = `        if (!isAdminRequest(request) && !isPlayerSafeUpdate(stored, payload)) {
          return { status: 403, payload: { message: "Acces gestion requis." } };
        }
        await writeStoredData(payload);
`;
      if (!next.includes(legacyMarker)) throw new Error("Bloc de sauvegarde /api/data introuvable.");
      next = next.replace(legacyMarker, `        const adminWrite = isAdminRequest(request);
        if (!adminWrite && !isPlayerSafeUpdate(stored, payload)) {
          return { status: 403, payload: { message: "Acces gestion requis." } };
        }
        if (adminWrite) {
          const guard = validateAdminDataPayloadV167(stored, payload, request);
          if (!guard.ok) {
            return { status: 409, payload: { message: guard.issues[0] || "Sauvegarde bloquee par la robustesse admin.", code: "ADMIN_ROBUSTNESS_GUARD_V167", issues: guard.issues, warnings: guard.warnings } };
          }
          await createAdminPreSaveBackupV167(stored, payload);
        }
        await writeStoredData(payload);
`);
    }
  }
  return next;
}

const APP_PATCH = `
/* admin-robustness-v167 */
(function initAdminRobustnessV167() {
  if (window.__adminRobustnessV167) return;
  window.__adminRobustnessV167 = true;
  const state = { dirty: false, saving: false, lastSavedAt: null, lastError: "", status: null, timer: null };
  const forms = ["#route-form", "#route-details-form", "#puzzle-form", "#puzzle-content-form", "#geo-form", "#hints-form"];
  const endpoint = "/api/admin/robustness";
  const isAdminVisible = () => location.hash === "#admin" && !document.querySelector("#admin-content.is-hidden");
  const fmt = (value) => value ? new Intl.DateTimeFormat("fr-BE", { dateStyle: "short", timeStyle: "short" }).format(new Date(Number(value))) : "jamais";

  function ensurePanel() {
    const adminContent = document.querySelector("#admin-content");
    if (!adminContent) return null;
    let panel = document.querySelector("#admin-robustness-panel-v167");
    if (!panel) {
      panel = document.createElement("section");
      panel.id = "admin-robustness-panel-v167";
      panel.className = "admin-robustness-panel-v167";
      panel.innerHTML = '<div class="admin-robustness-head-v167"><div><p class="section-label">Robustesse admin</p><h3>Garde-fous et diagnostic</h3><p>Protection contre les pertes de parcours, sauvegarde avant ecriture sensible et controles de coherence.</p></div><div class="admin-robustness-actions-v167"><button class="secondary-button compact-button" type="button" data-robust-refresh>Verifier</button><button class="primary-button compact-button" type="button" data-robust-backup>Sauvegarde manuelle</button></div></div><div class="admin-robustness-grid-v167" data-robust-grid>Diagnostic en attente.</div><div class="admin-robustness-save-v167" data-robust-save>Etat sauvegarde: pret.</div>';
      const target = document.querySelector("#admin-data-safety-panel") || adminContent.querySelector("section");
      if (target?.parentNode) target.parentNode.insertBefore(panel, target.nextSibling);
      else adminContent.prepend(panel);
    }
    const refresh = panel.querySelector("[data-robust-refresh]");
    const backup = panel.querySelector("[data-robust-backup]");
    if (refresh && refresh.dataset.bound !== "1") {
      refresh.dataset.bound = "1";
      refresh.addEventListener("click", () => refreshStatus(true));
    }
    if (backup && backup.dataset.bound !== "1") {
      backup.dataset.bound = "1";
      backup.addEventListener("click", () => createBackup());
    }
    return panel;
  }

  function tile(label, value, status) {
    return '<article class="admin-robustness-tile-v167 is-' + status + '"><span>' + label + '</span><strong>' + value + '</strong></article>';
  }

  function render() {
    const panel = ensurePanel();
    if (!panel) return;
    const grid = panel.querySelector("[data-robust-grid]");
    const save = panel.querySelector("[data-robust-save]");
    if (save) {
      save.textContent = state.saving ? "Sauvegarde en cours..." : state.lastError ? "Derniere erreur: " + state.lastError : state.dirty ? "Modifications detectees: pensez a enregistrer." : state.lastSavedAt ? "Derniere sauvegarde: " + fmt(state.lastSavedAt) : "Etat sauvegarde: pret.";
      save.classList.toggle("is-warning", state.dirty);
      save.classList.toggle("is-error", Boolean(state.lastError));
    }
    if (!grid) return;
    if (!state.status) {
      grid.textContent = state.lastError || "Diagnostic en attente.";
      return;
    }
    const status = state.status;
    const warnings = (status.warnings || []).slice(0, 4);
    grid.innerHTML = [
      tile("Parcours proteges", String(status.summary?.routes ?? 0), status.validation?.ok ? "ok" : "error"),
      tile("Codes", String(status.summary?.codes ?? 0), "ok"),
      tile("Equipes en cours", String(status.summary?.playingTeams ?? 0), status.staleTeams?.length ? "warning" : "ok"),
      tile("Sauvegardes", String(status.summary?.backups ?? 0), status.latestBackup ? "ok" : "warning"),
      '<div class="admin-robustness-note-v167"><strong>' + (status.ok ? "Robustesse active" : "Point a verifier") + '</strong><span>Perte de parcours bloquee, doublons critiques bloques, sauvegarde pre-ecriture active.</span>' + (warnings.length ? '<ul><li>' + warnings.join("</li><li>") + '</li></ul>' : '<span>Aucune alerte importante detectee.</span>') + '</div>',
    ].join("");
  }

  async function refreshStatus(force = false) {
    if (!force && !isAdminVisible()) return;
    ensurePanel();
    try {
      const response = await fetch(endpoint, { credentials: "same-origin", cache: "no-store" });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.message || "Diagnostic indisponible.");
      state.status = payload;
      state.lastError = "";
    } catch (error) {
      state.lastError = error.message || "Diagnostic indisponible.";
    }
    render();
  }

  async function createBackup() {
    state.saving = true;
    state.lastError = "";
    render();
    try {
      const response = await fetch(endpoint, { method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "backup" }) });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.message || "Sauvegarde impossible.");
      state.status = payload.status || state.status;
      state.lastSavedAt = payload.backup?.modifiedAt || Date.now();
      state.dirty = false;
    } catch (error) {
      state.lastError = error.message || "Sauvegarde impossible.";
    }
    state.saving = false;
    render();
  }

  function bindDirty() {
    forms.forEach((selector) => {
      const form = document.querySelector(selector);
      if (!form || form.dataset.robustnessDirtyBoundV167 === "1") return;
      form.dataset.robustnessDirtyBoundV167 = "1";
      ["input", "change"].forEach((eventName) => form.addEventListener(eventName, () => { state.dirty = true; state.lastError = ""; render(); }, true));
      form.addEventListener("submit", () => window.setTimeout(() => { state.dirty = false; render(); }, 1200), true);
    });
  }

  function bindDanger() {
    if (document.body.dataset.robustnessDangerBoundV167 === "1") return;
    document.body.dataset.robustnessDangerBoundV167 = "1";
    document.body.addEventListener("click", (event) => {
      const button = event.target?.closest?.("[data-delete-code], [data-delete-team], [data-delete-route], [data-delete-puzzle]");
      if (!button || button.dataset.robustnessConfirmedV167 === "1") return;
      event.preventDefault();
      event.stopImmediatePropagation();
      const text = button.dataset.robustnessOriginalTextV167 || button.textContent || "Supprimer";
      button.dataset.robustnessOriginalTextV167 = text;
      button.dataset.robustnessConfirmedV167 = "1";
      button.textContent = "Recliquer pour confirmer";
      button.classList.add("is-awaiting-confirm-v167");
      window.setTimeout(() => {
        if (button.dataset.robustnessConfirmedV167 !== "1") return;
        delete button.dataset.robustnessConfirmedV167;
        button.textContent = text;
        button.classList.remove("is-awaiting-confirm-v167");
      }, 5500);
    }, true);
  }

  function wrapFetch() {
    if (window.fetch.__adminRobustnessWrappedV167) return;
    const originalFetch = window.fetch.bind(window);
    window.fetch = async (...args) => {
      const request = args[0];
      const options = args[1] || {};
      const url = typeof request === "string" ? request : request?.url || "";
      const method = String(options.method || request?.method || "GET").toUpperCase();
      const watches = url.includes("/api/data") && ["PUT", "POST"].includes(method);
      if (watches) { state.saving = true; state.lastError = ""; render(); }
      try {
        const response = await originalFetch(...args);
        if (watches) {
          const payload = await response.clone().json().catch(() => ({}));
          if (response.ok) { state.lastSavedAt = payload.savedAt || Date.now(); state.dirty = false; window.setTimeout(() => refreshStatus(true), 400); }
          else state.lastError = payload.message || "Sauvegarde refusee.";
        }
        return response;
      } catch (error) {
        if (watches) state.lastError = error.message || "Sauvegarde impossible.";
        throw error;
      } finally {
        if (watches) { state.saving = false; render(); }
      }
    };
    window.fetch.__adminRobustnessWrappedV167 = true;
  }

  function tick() {
    if (!isAdminVisible()) return;
    ensurePanel();
    bindDirty();
    bindDanger();
    refreshStatus();
    if (!state.timer) state.timer = window.setInterval(() => refreshStatus(), 60000);
  }

  window.addEventListener("beforeunload", (event) => {
    if (!state.dirty || !isAdminVisible()) return;
    event.preventDefault();
    event.returnValue = "";
  });
  window.addEventListener("hashchange", () => window.setTimeout(tick, 250));
  document.addEventListener("DOMContentLoaded", () => { wrapFetch(); window.setTimeout(tick, 700); window.setInterval(tick, 3000); });
  wrapFetch();
  window.setTimeout(tick, 700);
})();
`;

const CSS_PATCH = `

/* admin-robustness-v167 */
.admin-robustness-panel-v167{border:1px solid rgba(19,58,47,.16);border-radius:8px;background:#f8fbf7;padding:18px;margin:18px 0;box-shadow:0 12px 32px rgba(17,45,37,.08)}
.admin-robustness-head-v167{display:flex;align-items:flex-start;justify-content:space-between;gap:16px}
.admin-robustness-head-v167 p{margin:6px 0 0;color:#53645d;max-width:720px}
.admin-robustness-actions-v167{display:flex;flex-wrap:wrap;gap:8px;justify-content:flex-end}
.admin-robustness-grid-v167{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px;margin-top:16px}
.admin-robustness-tile-v167,.admin-robustness-note-v167{border:1px solid rgba(19,58,47,.12);border-radius:8px;background:#fff;padding:12px}
.admin-robustness-tile-v167 span,.admin-robustness-note-v167 span{display:block;color:#6a7770;font-size:.86rem}
.admin-robustness-tile-v167 strong,.admin-robustness-note-v167 strong{display:block;color:#10241d}
.admin-robustness-tile-v167.is-warning{border-color:rgba(214,151,40,.42);background:#fff7e5}
.admin-robustness-tile-v167.is-error{border-color:rgba(176,58,46,.42);background:#fff1ef}
.admin-robustness-note-v167{grid-column:1/-1;color:#45564f}
.admin-robustness-note-v167 ul{margin:8px 0 0;padding-left:18px}
.admin-robustness-save-v167{display:block;margin-top:12px;border-radius:8px;background:rgba(19,58,47,.08);color:#173a31;padding:10px 12px;font-weight:700}
.admin-robustness-save-v167.is-warning{background:#fff3d4;color:#6f4d0f}
.admin-robustness-save-v167.is-error{background:#ffe7e2;color:#8d2d21}
.is-awaiting-confirm-v167{outline:2px solid rgba(176,58,46,.35)}
@media (max-width:720px){.admin-robustness-head-v167{display:grid}.admin-robustness-actions-v167{justify-content:stretch}.admin-robustness-actions-v167>*{width:100%}}
`;

function patchApp(app) {
  if (app.includes("admin-robustness-v167")) return app;
  return app + "\n" + APP_PATCH;
}

function patchStyles(styles) {
  if (styles.includes("admin-robustness-v167")) return styles;
  return styles + CSS_PATCH;
}

await patchTextFile("server.mjs", patchServer);
await patchTextFile("app.js", patchApp);
await patchTextFile("styles.css", patchStyles);
await patchTextFile("index.html", bumpAssets);
await patchTextFile("suivi.html", bumpAssets).catch(() => {});
