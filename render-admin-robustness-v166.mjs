import { readFile, writeFile } from "node:fs/promises";

const VERSION = 166;

async function patchTextFile(filePath, patcher) {
  const input = await readFile(filePath, "utf8");
  const output = patcher(input);
  if (output !== input) await writeFile(filePath, output, "utf8");
}

function bumpAssetVersions(text) {
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
  if (start < 0) throw new Error(`Patch v${VERSION} introuvable: ${signature}`);
  const end = findBlockEnd(input, start);
  if (end < 0) throw new Error(`Patch v${VERSION} impossible: ${signature}`);
  return `${input.slice(0, end)}\n\n${insertion}${input.slice(end)}`;
}

function ensureServerImport(server) {
  const importMatch = server.match(/import \{ ([^}]+) \} from "node:fs\/promises";/);
  if (!importMatch) throw new Error("Import fs/promises introuvable.");
  const currentNames = importMatch[1].split(",").map((name) => name.trim()).filter(Boolean);
  const needed = ["mkdir", "readFile", "readdir", "rename", "stat", "writeFile"];
  const merged = Array.from(new Set([...currentNames, ...needed])).sort();
  return server.replace(importMatch[0], `import { ${merged.join(", ")} } from "node:fs/promises";`);
}

function ensureBackupConstant(server) {
  if (server.includes("const DATA_BACKUP_DIR =")) return server;
  return server.replace(
    `const DATA_FILE = path.join(DATA_DIR, "escape-data.json");`,
    `const DATA_FILE = path.join(DATA_DIR, "escape-data.json");\nconst DATA_BACKUP_DIR = path.join(DATA_DIR, "backups");`,
  );
}

const SERVER_HELPERS = `const ADMIN_ROBUSTNESS_MIN_ROUTE_COUNT_V166 = 3;
const ADMIN_ROBUSTNESS_BACKUP_COOLDOWN_MS_V166 = 10 * 60 * 1000;
let adminRobustnessLastAutoBackupAtV166 = 0;

function getDataHashV166(value) {
  return createHash("sha256").update(JSON.stringify(value || null)).digest("hex").slice(0, 16);
}

function normalizeRouteTitleV166(value) {
  return compactText(value)
    .normalize("NFD")
    .replace(/[\\u0300-\\u036f]/g, "")
    .replace(/\\s+/g, " ")
    .toLowerCase();
}

function findDuplicateValuesV166(values) {
  const seen = new Set();
  const duplicates = new Set();
  values.filter(Boolean).forEach((value) => {
    if (seen.has(value)) duplicates.add(value);
    seen.add(value);
  });
  return Array.from(duplicates);
}

function routeDeleteOverrideRequestedV166(request) {
  return compactText(request?.headers?.["x-admin-danger-confirm"]) === "routes-delete";
}

function validateAdminDataPayloadV166(previousData, nextData, request) {
  const issues = [];
  const warnings = [];
  if (!isAppData(nextData)) {
    issues.push("Format de donnees invalide.");
    return { ok: false, issues, warnings };
  }

  const previousRoutes = Array.isArray(previousData?.routes) ? previousData.routes : [];
  const nextRoutes = Array.isArray(nextData.routes) ? nextData.routes : [];
  const routeIds = nextRoutes.map((route) => compactText(route?.id));
  const duplicateRouteIds = findDuplicateValuesV166(routeIds);
  const routeIdSet = new Set(routeIds.filter(Boolean));
  const previousHadProductionRoutes = previousRoutes.length >= ADMIN_ROBUSTNESS_MIN_ROUTE_COUNT_V166;

  if (nextRoutes.length < ADMIN_ROBUSTNESS_MIN_ROUTE_COUNT_V166) {
    issues.push("Sauvegarde bloquee: " + nextRoutes.length + " parcours seulement, " + ADMIN_ROBUSTNESS_MIN_ROUTE_COUNT_V166 + " minimum attendus.");
  }
  if (
    previousHadProductionRoutes
    && nextRoutes.length < previousRoutes.length
    && !routeDeleteOverrideRequestedV166(request)
  ) {
    issues.push("Sauvegarde bloquee: cette action ferait disparaitre un ou plusieurs parcours.");
  }
  if (duplicateRouteIds.length) {
    issues.push("Identifiants de parcours en double: " + duplicateRouteIds.join(", ") + ".");
  }
  if (routeIds.some((id) => !id)) {
    issues.push("Un parcours n'a pas d'identifiant.");
  }
  if (nextRoutes.some((route) => !compactText(route?.title))) {
    issues.push("Un parcours n'a pas de titre.");
  }
  if (nextData.activeRouteId && !routeIdSet.has(compactText(nextData.activeRouteId))) {
    issues.push("Le parcours actif ne correspond a aucun parcours existant.");
  }

  nextRoutes.forEach((route) => {
    const puzzleIds = Array.isArray(route?.puzzles) ? route.puzzles.map((puzzle) => compactText(puzzle?.id)) : [];
    const duplicatePuzzleIds = findDuplicateValuesV166(puzzleIds);
    if (duplicatePuzzleIds.length) {
      issues.push((route?.title || route?.id || "Parcours") + ": enigmes en double (" + duplicatePuzzleIds.join(", ") + ").");
    }
    if (puzzleIds.some((id) => !id)) {
      issues.push((route?.title || route?.id || "Parcours") + ": une enigme n'a pas d'identifiant.");
    }
    if (!Array.isArray(route?.puzzles) || route.puzzles.length === 0) {
      warnings.push((route?.title || route?.id || "Parcours") + ": aucune enigme renseignee.");
    }
  });

  const codeValues = Array.isArray(nextData.codes) ? nextData.codes.map((code) => compactText(code?.code)) : [];
  const duplicateCodes = findDuplicateValuesV166(codeValues);
  if (duplicateCodes.length) {
    issues.push("Codes d'acces en double: " + duplicateCodes.slice(0, 5).join(", ") + ".");
  }
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

  const titleCount = new Set(nextRoutes.map((route) => normalizeRouteTitleV166(route?.title)).filter(Boolean)).size;
  if (titleCount < nextRoutes.length) {
    warnings.push("Plusieurs parcours semblent avoir le meme titre.");
  }

  return { ok: issues.length === 0, issues, warnings };
}

async function listAdminRobustnessBackupsV166() {
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

async function createAdminRobustnessBackupV166(reason = "manual") {
  if (reason === "manual" && typeof createManualDataBackup === "function") {
    return createManualDataBackup();
  }
  const raw = await readFile(DATA_FILE, "utf8");
  const parsed = JSON.parse(raw);
  if (!isAppData(parsed)) throw new Error("Donnees serveur illisibles.");
  await mkdir(DATA_BACKUP_DIR, { recursive: true });
  const safeReason = compactText(reason).replace(/[^a-z0-9-]+/gi, "-").slice(0, 40) || "admin";
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const fileName = "escape-data-" + safeReason + "-" + stamp + ".json";
  const filePath = path.join(DATA_BACKUP_DIR, fileName);
  await writeFile(filePath, raw.endsWith("\\n") ? raw : raw + "\\n", "utf8");
  const fileStat = await stat(filePath);
  return { name: fileName, size: fileStat.size, modifiedAt: fileStat.mtimeMs };
}

function shouldCreateAdminPreSaveBackupV166(previousData, nextData) {
  if (!previousData || !nextData) return false;
  if (getDataHashV166(previousData) === getDataHashV166(nextData)) return false;
  const previousRoutes = Array.isArray(previousData.routes) ? previousData.routes.length : 0;
  const nextRoutes = Array.isArray(nextData.routes) ? nextData.routes.length : 0;
  const previousCodes = Array.isArray(previousData.codes) ? previousData.codes.length : 0;
  const nextCodes = Array.isArray(nextData.codes) ? nextData.codes.length : 0;
  const previousTeams = Array.isArray(previousData.teams) ? previousData.teams.length : 0;
  const nextTeams = Array.isArray(nextData.teams) ? nextData.teams.length : 0;
  return nextRoutes < previousRoutes || nextCodes < previousCodes || nextTeams < previousTeams || Date.now() - adminRobustnessLastAutoBackupAtV166 > ADMIN_ROBUSTNESS_BACKUP_COOLDOWN_MS_V166;
}

async function createAdminPreSaveBackupV166(previousData, nextData) {
  if (!shouldCreateAdminPreSaveBackupV166(previousData, nextData)) return null;
  adminRobustnessLastAutoBackupAtV166 = Date.now();
  try {
    return await createAdminRobustnessBackupV166("before-admin-save");
  } catch (error) {
    adminRobustnessLastAutoBackupAtV166 = 0;
    throw error;
  }
}

function getTeamLastActivityV166(team) {
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

async function buildAdminRobustnessStatusV166() {
  const checkedAt = Date.now();
  const stored = await readStoredData();
  const backups = await listAdminRobustnessBackupsV166();
  const validation = validateAdminDataPayloadV166(stored, stored, { headers: {} });
  const routes = Array.isArray(stored?.routes) ? stored.routes : [];
  const teams = Array.isArray(stored?.teams) ? stored.teams : [];
  const codes = Array.isArray(stored?.codes) ? stored.codes : [];
  const playingTeams = teams.filter((team) => team?.status === "playing");
  const staleTeams = playingTeams
    .map((team) => ({ id: team.id, name: team.name || team.code || team.id, lastActivityAt: getTeamLastActivityV166(team) }))
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
    hash: stored ? getDataHashV166(stored) : null,
    summary: {
      routes: routes.length,
      codes: codes.length,
      teams: teams.length,
      playingTeams: playingTeams.length,
      backups: backups.length,
    },
    guards: {
      routeLossBlocked: true,
      duplicateIdsBlocked: true,
      activeRouteChecked: true,
      adminPreSaveBackup: true,
      atomicWrite: true,
    },
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
  next = insertAfterBlock(next, "async function writeStoredData", SERVER_HELPERS, "ADMIN_ROBUSTNESS_MIN_ROUTE_COUNT_V166");

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
    next = next.replace(
      marker,
      `${marker}
  if (pathname === "/api/admin/robustness") {
    if (!isAdminRequest(request)) {
      sendJson(response, 401, { message: "Connexion gestion requise." });
      return true;
    }
    if (request.method === "GET") {
      try {
        sendJson(response, 200, await buildAdminRobustnessStatusV166());
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
        const backup = await withDataMutation(() => createAdminRobustnessBackupV166("manual"));
        sendJson(response, 200, { ok: true, backup, status: await buildAdminRobustnessStatusV166() });
      } catch (error) {
        sendJson(response, 500, { message: error.message || "Sauvegarde robuste impossible." });
      }
      return true;
    }
    sendJson(response, 405, { message: "Methode non autorisee." });
    return true;
  }
`,
    );
  }

  if (!next.includes("validateAdminDataPayloadV166(stored, payload, request)")) {
    const marker = `        if (!isAdminRequest(request) && !isPlayerSafeUpdate(stored, payload)) {
          return { status: 403, payload: { message: "Acces gestion requis." } };
        }
        await writeStoredData(payload);
`;
    if (!next.includes(marker)) throw new Error("Bloc de sauvegarde /api/data introuvable.");
    next = next.replace(
      marker,
      `        const adminWrite = isAdminRequest(request);
        if (!adminWrite && !isPlayerSafeUpdate(stored, payload)) {
          return { status: 403, payload: { message: "Acces gestion requis." } };
        }
        if (adminWrite) {
          const guard = validateAdminDataPayloadV166(stored, payload, request);
          if (!guard.ok) {
            return {
              status: 409,
              payload: {
                message: guard.issues[0] || "Sauvegarde bloquee par la robustesse admin.",
                code: "ADMIN_ROBUSTNESS_GUARD",
                issues: guard.issues,
                warnings: guard.warnings,
              },
            };
          }
          await createAdminPreSaveBackupV166(stored, payload);
        }
        await writeStoredData(payload);
`,
    );
  }

  return next;
}

const APP_PATCH = `
/* admin-robustness-v166 */
(function initAdminRobustnessV166() {
  if (window.__adminRobustnessV166) return;
  window.__adminRobustnessV166 = true;

  const ROBUSTNESS_URL = "/api/admin/robustness";
  const trackedFormSelectors = [
    "#route-form",
    "#route-details-form",
    "#puzzle-form",
    "#puzzle-content-form",
    "#geo-form",
    "#hints-form",
  ];
  const state = {
    dirty: false,
    saving: false,
    lastSavedAt: null,
    lastError: "",
    status: null,
    timer: null,
  };

  function formatTime(value) {
    if (!value) return "jamais";
    try {
      return new Intl.DateTimeFormat("fr-BE", { dateStyle: "short", timeStyle: "short" }).format(new Date(Number(value)));
    } catch {
      return "date inconnue";
    }
  }

  function isAdminVisible() {
    return location.hash === "#admin" && !document.querySelector("#admin-content.is-hidden");
  }

  function ensurePanel() {
    const adminContent = document.querySelector("#admin-content");
    if (!adminContent) return null;
    let panel = document.querySelector("#admin-robustness-panel-v166");
    if (!panel) {
      panel = document.createElement("section");
      panel.id = "admin-robustness-panel-v166";
      panel.className = "admin-robustness-panel-v166";
      panel.innerHTML = [
        '<div class="admin-robustness-head-v166">',
          '<div>',
            '<p class="section-label">Robustesse admin</p>',
            '<h3>Garde-fous et diagnostic</h3>',
            '<p class="admin-robustness-copy-v166">Protection contre les pertes de parcours, sauvegarde avant ecriture sensible et controles de coherence.</p>',
          '</div>',
          '<div class="admin-robustness-actions-v166">',
            '<button class="secondary-button compact-button" type="button" data-admin-robust-refresh>Verifier</button>',
            '<button class="primary-button compact-button" type="button" data-admin-robust-backup>Sauvegarde manuelle</button>',
          '</div>',
        '</div>',
        '<div class="admin-robustness-grid-v166" data-admin-robust-grid>',
          '<span class="admin-robustness-loading-v166">Diagnostic en attente.</span>',
        '</div>',
        '<div class="admin-robustness-save-v166" data-admin-robust-save>Etat sauvegarde: pret.</div>',
      ].join("");
      const target = document.querySelector("#admin-data-safety-panel") || adminContent.querySelector("section");
      if (target?.parentNode) target.parentNode.insertBefore(panel, target.nextSibling);
      else adminContent.prepend(panel);
    }

    const refreshButton = panel.querySelector("[data-admin-robust-refresh]");
    const backupButton = panel.querySelector("[data-admin-robust-backup]");
    if (refreshButton && refreshButton.dataset.bound !== "1") {
      refreshButton.dataset.bound = "1";
      refreshButton.addEventListener("click", () => refreshRobustness({ force: true }));
    }
    if (backupButton && backupButton.dataset.bound !== "1") {
      backupButton.dataset.bound = "1";
      backupButton.addEventListener("click", () => createRobustnessBackup());
    }
    return panel;
  }

  function pill(label, value, status = "ok") {
    return [
      '<article class="admin-robustness-pill-v166 is-' + status + '">',
        '<span>' + label + '</span>',
        '<strong>' + value + '</strong>',
      '</article>',
    ].join("");
  }

  function renderPanel() {
    const panel = ensurePanel();
    if (!panel) return;
    const status = state.status;
    const grid = panel.querySelector("[data-admin-robust-grid]");
    const save = panel.querySelector("[data-admin-robust-save]");
    const saveState = state.saving
      ? "Sauvegarde en cours..."
      : state.lastError
        ? "Derniere erreur: " + state.lastError
        : state.dirty
          ? "Modifications detectees: pensez a enregistrer le formulaire."
          : state.lastSavedAt
            ? "Derniere sauvegarde detectee: " + formatTime(state.lastSavedAt)
            : "Etat sauvegarde: pret.";
    if (save) {
      save.textContent = saveState;
      save.classList.toggle("is-warning", state.dirty);
      save.classList.toggle("is-error", Boolean(state.lastError));
      save.classList.toggle("is-saving", state.saving);
    }
    if (!grid) return;
    if (!status) {
      grid.innerHTML = '<span class="admin-robustness-loading-v166">Diagnostic en attente.</span>';
      return;
    }
    const validationStatus = status.validation?.ok ? "ok" : "error";
    const backupStatus = status.latestBackup ? "ok" : "warning";
    const staleStatus = status.staleTeams?.length ? "warning" : "ok";
    const warningItems = (status.warnings || []).slice(0, 4);
    grid.innerHTML = [
      pill("Parcours proteges", String(status.summary?.routes ?? 0), validationStatus),
      pill("Codes", String(status.summary?.codes ?? 0), "ok"),
      pill("Equipes en cours", String(status.summary?.playingTeams ?? 0), staleStatus),
      pill("Sauvegardes", String(status.summary?.backups ?? 0), backupStatus),
      pill("Empreinte donnees", status.hash || "-", status.ok ? "ok" : "error"),
      '<div class="admin-robustness-notes-v166">',
        '<strong>' + (status.ok ? "Robustesse active" : "Point a verifier") + '</strong>',
        '<span>Perte de parcours bloquee, doublons critiques bloques, sauvegarde pre-ecriture active.</span>',
        warningItems.length ? '<ul>' + warningItems.map((item) => '<li>' + item + '</li>').join("") + '</ul>' : '<span>Aucune alerte importante detectee.</span>',
      '</div>',
    ].join("");
  }

  async function refreshRobustness(options = {}) {
    if (!isAdminVisible() && !options.force) return;
    const panel = ensurePanel();
    try {
      const response = await fetch(ROBUSTNESS_URL, { credentials: "same-origin", cache: "no-store" });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.message || "Diagnostic indisponible.");
      state.status = payload;
      state.lastError = "";
      renderPanel();
    } catch (error) {
      state.lastError = error.message || "Diagnostic indisponible.";
      if (panel) {
        const grid = panel.querySelector("[data-admin-robust-grid]");
        if (grid) grid.innerHTML = '<span class="admin-robustness-loading-v166 is-error">' + state.lastError + '</span>';
      }
      renderPanel();
    }
  }

  async function createRobustnessBackup() {
    const panel = ensurePanel();
    const button = panel?.querySelector("[data-admin-robust-backup]");
    if (button) button.disabled = true;
    state.saving = true;
    state.lastError = "";
    renderPanel();
    try {
      const response = await fetch(ROBUSTNESS_URL, {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "backup" }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.message || "Sauvegarde impossible.");
      state.status = payload.status || state.status;
      state.lastSavedAt = payload.backup?.modifiedAt || Date.now();
      state.dirty = false;
    } catch (error) {
      state.lastError = error.message || "Sauvegarde impossible.";
    } finally {
      state.saving = false;
      if (button) button.disabled = false;
      renderPanel();
    }
  }

  function bindDirtyTracking() {
    trackedFormSelectors.forEach((selector) => {
      const form = document.querySelector(selector);
      if (!form || form.dataset.robustnessDirtyBound === "1") return;
      form.dataset.robustnessDirtyBound = "1";
      form.addEventListener("input", () => {
        state.dirty = true;
        state.lastError = "";
        renderPanel();
      }, true);
      form.addEventListener("change", () => {
        state.dirty = true;
        state.lastError = "";
        renderPanel();
      }, true);
      form.addEventListener("submit", () => {
        window.setTimeout(() => {
          state.dirty = false;
          renderPanel();
        }, 1200);
      }, true);
    });
  }

  function bindDangerousActionGuard() {
    if (document.body.dataset.robustnessDangerBound === "1") return;
    document.body.dataset.robustnessDangerBound = "1";
    document.body.addEventListener("click", (event) => {
      const button = event.target?.closest?.("[data-delete-code], [data-delete-team], [data-delete-route], [data-delete-puzzle]");
      if (!button || button.dataset.robustnessConfirmed === "1") return;
      event.preventDefault();
      event.stopImmediatePropagation();
      const originalText = button.dataset.robustnessOriginalText || button.textContent || "Supprimer";
      button.dataset.robustnessOriginalText = originalText;
      button.dataset.robustnessConfirmed = "1";
      button.textContent = "Recliquer pour confirmer";
      button.classList.add("is-awaiting-confirm-v166");
      window.setTimeout(() => {
        if (button.dataset.robustnessConfirmed !== "1") return;
        delete button.dataset.robustnessConfirmed;
        button.textContent = originalText;
        button.classList.remove("is-awaiting-confirm-v166");
      }, 5500);
    }, true);
  }

  function wrapFetchForAdminSaves() {
    if (window.fetch.__adminRobustnessWrappedV166) return;
    const originalFetch = window.fetch.bind(window);
    window.fetch = async (...args) => {
      const request = args[0];
      const options = args[1] || {};
      const url = typeof request === "string" ? request : request?.url || "";
      const method = String(options.method || request?.method || "GET").toUpperCase();
      const watchesDataWrite = url.includes("/api/data") && ["PUT", "POST"].includes(method);
      if (watchesDataWrite) {
        state.saving = true;
        state.lastError = "";
        renderPanel();
      }
      try {
        const response = await originalFetch(...args);
        if (watchesDataWrite) {
          const cloned = response.clone();
          let payload = {};
          try { payload = await cloned.json(); } catch {}
          if (response.ok) {
            state.lastSavedAt = payload.savedAt || Date.now();
            state.dirty = false;
            window.setTimeout(() => refreshRobustness({ force: true }), 400);
          } else {
            state.lastError = payload.message || "Sauvegarde refusee.";
          }
        }
        return response;
      } catch (error) {
        if (watchesDataWrite) state.lastError = error.message || "Sauvegarde impossible.";
        throw error;
      } finally {
        if (watchesDataWrite) {
          state.saving = false;
          renderPanel();
        }
      }
    };
    window.fetch.__adminRobustnessWrappedV166 = true;
  }

  function tick() {
    if (isAdminVisible()) {
      ensurePanel();
      bindDirtyTracking();
      bindDangerousActionGuard();
      refreshRobustness();
      if (!state.timer) state.timer = window.setInterval(() => refreshRobustness(), 60000);
    }
  }

  window.addEventListener("beforeunload", (event) => {
    if (!state.dirty || !isAdminVisible()) return;
    event.preventDefault();
    event.returnValue = "";
  });
  window.addEventListener("hashchange", () => window.setTimeout(tick, 250));
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) tick();
  });
  document.addEventListener("DOMContentLoaded", () => {
    wrapFetchForAdminSaves();
    window.setTimeout(tick, 600);
    window.setInterval(tick, 3000);
  });
  wrapFetchForAdminSaves();
  window.setTimeout(tick, 600);
})();
`;

const CSS_PATCH = `

/* admin-robustness-v166 */
.admin-robustness-panel-v166 {
  border: 1px solid rgba(19, 58, 47, 0.16);
  border-radius: 8px;
  background: #f8fbf7;
  padding: 18px;
  margin: 18px 0;
  box-shadow: 0 12px 32px rgba(17, 45, 37, 0.08);
}

.admin-robustness-head-v166 {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.admin-robustness-copy-v166 {
  margin: 6px 0 0;
  color: #53645d;
  max-width: 720px;
}

.admin-robustness-actions-v166 {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: flex-end;
}

.admin-robustness-grid-v166 {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 10px;
  margin-top: 16px;
}

.admin-robustness-pill-v166,
.admin-robustness-notes-v166 {
  border: 1px solid rgba(19, 58, 47, 0.12);
  border-radius: 8px;
  background: #ffffff;
  padding: 12px;
}

.admin-robustness-pill-v166 span {
  display: block;
  color: #6a7770;
  font-size: 0.82rem;
}

.admin-robustness-pill-v166 strong {
  display: block;
  margin-top: 3px;
  color: #10241d;
  font-size: 1.08rem;
}

.admin-robustness-pill-v166.is-warning {
  border-color: rgba(214, 151, 40, 0.4);
  background: #fff7e5;
}

.admin-robustness-pill-v166.is-error {
  border-color: rgba(176, 58, 46, 0.4);
  background: #fff1ef;
}

.admin-robustness-notes-v166 {
  grid-column: 1 / -1;
  color: #45564f;
}

.admin-robustness-notes-v166 strong,
.admin-robustness-notes-v166 span {
  display: block;
}

.admin-robustness-notes-v166 ul {
  margin: 8px 0 0;
  padding-left: 18px;
}

.admin-robustness-save-v166,
.admin-robustness-loading-v166 {
  display: block;
  margin-top: 12px;
  border-radius: 8px;
  background: rgba(19, 58, 47, 0.08);
  color: #173a31;
  padding: 10px 12px;
  font-weight: 700;
}

.admin-robustness-save-v166.is-warning {
  background: #fff3d4;
  color: #6f4d0f;
}

.admin-robustness-save-v166.is-error,
.admin-robustness-loading-v166.is-error {
  background: #ffe7e2;
  color: #8d2d21;
}

.admin-robustness-save-v166.is-saving {
  background: #edf7ff;
  color: #1e597e;
}

.is-awaiting-confirm-v166 {
  outline: 2px solid rgba(176, 58, 46, 0.35);
}

@media (max-width: 720px) {
  .admin-robustness-head-v166 {
    display: grid;
  }

  .admin-robustness-actions-v166 {
    justify-content: stretch;
  }

  .admin-robustness-actions-v166 > * {
    width: 100%;
  }
}
`;

function patchApp(app) {
  if (app.includes("admin-robustness-v166")) return app;
  return `${app}\n${APP_PATCH}`;
}

function patchStyles(styles) {
  if (styles.includes("admin-robustness-v166")) return styles;
  return `${styles}${CSS_PATCH}`;
}

await patchTextFile("server.mjs", patchServer);
await patchTextFile("app.js", patchApp);
await patchTextFile("styles.css", patchStyles);
await patchTextFile("index.html", bumpAssetVersions);
await patchTextFile("suivi.html", bumpAssetVersions).catch(() => {});
