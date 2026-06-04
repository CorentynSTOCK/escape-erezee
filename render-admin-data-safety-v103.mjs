import { readFile, writeFile } from "node:fs/promises";

const VERSION = 103;
const scriptBaseUrl = new URL("./", import.meta.url);

async function patchTextFile(filePath, patcher) {
  const fileUrl = new URL(filePath, scriptBaseUrl);
  const input = await readFile(fileUrl, "utf8");
  const output = patcher(input);
  if (output !== input) await writeFile(fileUrl, output, "utf8");
}

function bumpAssetVersions(text) {
  return text
    .replace(/styles\.css\?v=\d+/g, `styles.css?v=${VERSION}`)
    .replace(/app\.js\?v=\d+/g, `app.js?v=${VERSION}`);
}

function findFunctionEnd(input, start) {
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
    if (char === '"' || char === "'" || char === "`") {
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

function insertAfterFunction(input, signature, insertion, guard) {
  if (input.includes(guard)) return input;
  const start = input.indexOf(signature);
  if (start < 0) throw new Error(`Patch v${VERSION} introuvable: ${signature}`);
  const end = findFunctionEnd(input, start);
  if (end < 0) throw new Error(`Patch v${VERSION} impossible: ${signature}`);
  return `${input.slice(0, end)}\n\n${insertion}${input.slice(end)}`;
}

function ensureServerImport(server) {
  const importLine = server.match(/import \{ ([^}]+) \} from "node:fs\/promises";/)?.[0];
  if (!importLine) throw new Error("fs/promises import not found");
  const names = importLine
    .replace('import { ', "")
    .replace(' } from "node:fs/promises";', "")
    .split(",")
    .map((name) => name.trim())
    .filter(Boolean);
  const needed = ["readFile", "readdir", "rename", "stat", "writeFile", "mkdir"];
  const merged = Array.from(new Set([...names, ...needed])).sort();
  return server.replace(importLine, `import { ${merged.join(", ")} } from "node:fs/promises";`);
}

function ensureBackupConstants(server) {
  if (server.includes("const DATA_BACKUP_DIR =")) return server;
  return server.replace(
    `const DATA_FILE = path.join(DATA_DIR, "escape-data.json");`,
    `const DATA_FILE = path.join(DATA_DIR, "escape-data.json");
const DATA_BACKUP_DIR = path.join(DATA_DIR, "backups");`,
  );
}

const SERVER_SAFETY_HELPERS = `async function listDataBackups() {
  try {
    const entries = await readdir(DATA_BACKUP_DIR, { withFileTypes: true });
    const backups = await Promise.all(entries
      .filter((entry) => entry.isFile() && entry.name.endsWith(".json"))
      .map(async (entry) => {
        const filePath = path.join(DATA_BACKUP_DIR, entry.name);
        const fileStat = await stat(filePath);
        return {
          name: entry.name,
          size: fileStat.size,
          modifiedAt: fileStat.mtimeMs,
        };
      }));
    return backups.sort((a, b) => b.modifiedAt - a.modifiedAt);
  } catch (error) {
    if (error.code === "ENOENT") return [];
    throw error;
  }
}

async function createManualDataBackup() {
  const raw = await readFile(DATA_FILE, "utf8");
  const parsed = JSON.parse(raw);
  if (!isAppData(parsed)) throw new Error("Donnees serveur illisibles.");

  await mkdir(DATA_BACKUP_DIR, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const fileName = \`escape-data-manual-\${stamp}.json\`;
  const filePath = path.join(DATA_BACKUP_DIR, fileName);
  await writeFile(filePath, raw.endsWith("\\n") ? raw : \`\${raw}\\n\`, "utf8");
  const fileStat = await stat(filePath);
  return { name: fileName, size: fileStat.size, modifiedAt: fileStat.mtimeMs };
}

async function getDataSafetyStatus() {
  const stored = await readStoredData();
  const dataFileStat = await stat(DATA_FILE).catch((error) => {
    if (error.code === "ENOENT") return null;
    throw error;
  });
  const backups = await listDataBackups();
  return {
    ok: true,
    data: stored ? {
      routes: Array.isArray(stored.routes) ? stored.routes.length : 0,
      teams: Array.isArray(stored.teams) ? stored.teams.length : 0,
      codes: Array.isArray(stored.codes) ? stored.codes.length : 0,
      activeRouteId: stored.activeRouteId || null,
      size: dataFileStat?.size || 0,
      modifiedAt: dataFileStat?.mtimeMs || null,
    } : null,
    backups: {
      count: backups.length,
      latest: backups[0] || null,
      recent: backups.slice(0, 5),
    },
  };
}
`;

function patchServer(server) {
  let next = ensureServerImport(server);
  next = ensureBackupConstants(next);
  next = insertAfterFunction(next, "async function writeStoredData", SERVER_SAFETY_HELPERS, "async function getDataSafetyStatus");

  if (!next.includes('pathname === "/api/admin/data-safety"')) {
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
    if (!next.includes(marker)) throw new Error("admin logout endpoint marker not found");
    next = next.replace(
      marker,
      `${marker}
  if (pathname === "/api/admin/data-safety") {
    if (!isAdminRequest(request)) {
      sendJson(response, 401, { message: "Connexion gestion requise." });
      return true;
    }
    if (request.method === "GET") {
      sendJson(response, 200, await getDataSafetyStatus());
      return true;
    }
    if (request.method === "POST") {
      try {
        const backup = await withDataMutation(createManualDataBackup);
        const status = await getDataSafetyStatus();
        sendJson(response, 200, { ...status, backup });
      } catch (error) {
        sendJson(response, 500, { message: error.message || "Sauvegarde impossible." });
      }
      return true;
    }
    sendJson(response, 405, { message: "Methode non autorisee." });
    return true;
  }
`,
    );
  }

  return next;
}

const APP_SAFETY_PATCH = `
/* admin-data-safety-v103 */
const ADMIN_DATA_SAFETY_URL = "/api/admin/data-safety";

function adminDataSafetyFormatTime(timestamp) {
  if (!timestamp) return "jamais";
  try {
    return new Intl.DateTimeFormat("fr-BE", {
      dateStyle: "short",
      timeStyle: "short",
    }).format(new Date(Number(timestamp)));
  } catch {
    return "date indisponible";
  }
}

function adminDataSafetyEnsurePanel() {
  const adminContent = document.querySelector("#admin-content");
  if (!adminContent) return null;

  let panel = document.querySelector("#admin-data-safety-panel");
  if (!panel) {
    panel = document.createElement("section");
    panel.className = "data-safety-panel";
    panel.id = "admin-data-safety-panel";
    panel.innerHTML = [
      '<div class="data-safety-copy">',
        '<p class="section-label">Securite des donnees</p>',
        '<h3>Sauvegardes serveur</h3>',
        '<p id="admin-data-safety-status">Verification en attente.</p>',
      "</div>",
      '<div class="data-safety-actions">',
        '<button class="secondary-button compact-button" type="button" id="admin-data-safety-refresh">Verifier</button>',
        '<button class="primary-button compact-button" type="button" id="admin-data-safety-backup">Creer une sauvegarde</button>',
      "</div>",
    ].join("");

    const firstSection = adminContent.querySelector(".admin-section, section");
    if (firstSection?.parentNode) {
      firstSection.parentNode.insertBefore(panel, firstSection);
    } else {
      adminContent.prepend(panel);
    }
  }

  const refreshButton = panel.querySelector("#admin-data-safety-refresh");
  const backupButton = panel.querySelector("#admin-data-safety-backup");
  if (refreshButton && refreshButton.dataset.bound !== "1") {
    refreshButton.dataset.bound = "1";
    refreshButton.addEventListener("click", () => adminDataSafetyRefresh());
  }
  if (backupButton && backupButton.dataset.bound !== "1") {
    backupButton.dataset.bound = "1";
    backupButton.addEventListener("click", () => adminDataSafetyCreateBackup());
  }

  return {
    panel,
    status: panel.querySelector("#admin-data-safety-status"),
    refreshButton,
    backupButton,
  };
}

function adminDataSafetyRender(payload) {
  const refs = adminDataSafetyEnsurePanel();
  if (!refs) return;

  if (!payload?.ok || !payload.data) {
    refs.status.textContent = payload?.message || "Statut des sauvegardes indisponible.";
    return;
  }

  const data = payload.data;
  const backups = payload.backups || {};
  const latest = backups.latest
    ? "Derniere sauvegarde : " + adminDataSafetyFormatTime(backups.latest.modifiedAt)
    : "Aucune sauvegarde disponible.";
  refs.status.textContent = [
    data.routes + " parcours",
    data.teams + " equipes",
    data.codes + " codes",
    backups.count + " sauvegarde" + (backups.count > 1 ? "s" : ""),
    latest,
  ].join(" - ");
}

async function adminDataSafetyFetch(options = {}) {
  const response = await fetch(ADMIN_DATA_SAFETY_URL, {
    method: options.method || "GET",
    headers: { Accept: "application/json" },
    credentials: "same-origin",
    cache: "no-store",
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.message || "Statut sauvegarde indisponible.");
  return payload;
}

async function adminDataSafetyRefresh() {
  const refs = adminDataSafetyEnsurePanel();
  if (!refs) return;
  refs.status.textContent = "Verification des sauvegardes...";
  try {
    adminDataSafetyRender(await adminDataSafetyFetch());
  } catch (error) {
    refs.status.textContent = error.message || "Statut sauvegarde indisponible.";
  }
}

async function adminDataSafetyCreateBackup() {
  const refs = adminDataSafetyEnsurePanel();
  if (!refs) return;
  refs.backupButton.disabled = true;
  refs.status.textContent = "Creation de la sauvegarde...";
  try {
    const payload = await adminDataSafetyFetch({ method: "POST" });
    adminDataSafetyRender(payload);
    showToast("Sauvegarde serveur creee.");
  } catch (error) {
    refs.status.textContent = error.message || "Sauvegarde impossible.";
  } finally {
    refs.backupButton.disabled = false;
  }
}

function adminDataSafetyInstall() {
  if (window.__adminDataSafetyV103Installed) return;
  window.__adminDataSafetyV103Installed = true;
  const originalRenderAdmin = renderAdmin;
  renderAdmin = function renderAdminWithDataSafety(...args) {
    const result = originalRenderAdmin.apply(this, args);
    const adminContent = document.querySelector("#admin-content");
    if (adminContent && !adminContent.classList.contains("is-hidden")) {
      adminDataSafetyEnsurePanel();
      adminDataSafetyRefresh();
    }
    return result;
  };
  window.setTimeout(() => {
    const adminContent = document.querySelector("#admin-content");
    if (adminContent && !adminContent.classList.contains("is-hidden")) {
      adminDataSafetyEnsurePanel();
      adminDataSafetyRefresh();
    }
  }, 1200);
}

adminDataSafetyInstall();
`;

function patchApp(app) {
  if (app.includes("admin-data-safety-v103")) return app;
  return `${app}\n${APP_SAFETY_PATCH}`;
}

function patchStyles(css) {
  if (css.includes("admin-data-safety-v103")) return css;
  return `${css}

/* admin-data-safety-v103 */
.data-safety-panel {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 14px;
  align-items: center;
  margin: 0 0 18px;
  padding: 16px;
  border: 1px solid rgba(44, 127, 163, 0.24);
  border-radius: var(--radius);
  background: #f6fbfd;
}

.data-safety-copy h3 {
  margin: 2px 0 6px;
  color: var(--green);
}

.data-safety-copy p:last-child {
  margin: 0;
  color: var(--muted);
  font-size: 0.9rem;
  line-height: 1.4;
}

.data-safety-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: flex-end;
}

@media (max-width: 720px) {
  .data-safety-panel {
    grid-template-columns: 1fr;
  }

  .data-safety-actions {
    justify-content: stretch;
  }

  .data-safety-actions .compact-button {
    flex: 1 1 180px;
  }
}
`;
}

function patchServiceWorker(worker) {
  return bumpAssetVersions(worker).replace(/escape-erezee-v\d+/g, `escape-erezee-v${VERSION}`);
}

await patchTextFile("server.mjs", patchServer);
await patchTextFile("app.js", patchApp);
await patchTextFile("styles.css", patchStyles);
await patchTextFile("index.html", bumpAssetVersions);
await patchTextFile("service-worker.js", patchServiceWorker);
