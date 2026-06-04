import { readFile, writeFile } from 'node:fs/promises';

const VERSION = 132;

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

function getSafeBackupName(rawName) {
  const name = path.basename(compactText(rawName));
  if (!/^escape-data-(manual|before-write|pre-restore)-[A-Za-z0-9_.-]+\.json$/.test(name)) {
    throw new Error('Nom de sauvegarde invalide.');
  }
  return name;
}

async function readDataBackupByName(rawName) {
  const name = getSafeBackupName(rawName);
  const backups = await listDataBackups();
  if (!backups.some((backup) => backup.name === name)) {
    throw new Error('Sauvegarde introuvable.');
  }
  const raw = await readFile(path.join(DATA_BACKUP_DIR, name), 'utf8');
  const parsed = JSON.parse(raw);
  if (!isAppData(parsed)) throw new Error('Sauvegarde illisible.');
  return { name, raw: raw.endsWith('\n') ? raw : `${raw}\n`, data: parsed };
}

async function createPreRestoreDataBackup() {
  const raw = await readFile(DATA_FILE, 'utf8');
  const parsed = JSON.parse(raw);
  if (!isAppData(parsed)) throw new Error('Donnees serveur illisibles.');

  await mkdir(DATA_BACKUP_DIR, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const fileName = `escape-data-pre-restore-${stamp}.json`;
  const filePath = path.join(DATA_BACKUP_DIR, fileName);
  await writeFile(filePath, raw.endsWith('\n') ? raw : `${raw}\n`, 'utf8');
  const fileStat = await stat(filePath);
  return { name: fileName, size: fileStat.size, modifiedAt: fileStat.mtimeMs };
}

async function restoreDataBackupByName(rawName) {
  const backup = await readDataBackupByName(rawName);
  const beforeRestoreBackup = await createPreRestoreDataBackup();
  await writeStoredData(backup.data);
  const status = await getDataSafetyStatus();
  return {
    ...status,
    restored: { name: backup.name },
    beforeRestoreBackup,
  };
}

function sendDataBackupFile(response, backup) {
  response.writeHead(200, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'Content-Disposition': `attachment; filename="${backup.name}"`,
  });
  response.end(backup.raw);
}

const SERVER_BACKUP_HELPERS = [
  '/* data-safety-restore-v132 */',
  getSafeBackupName.toString(),
  readDataBackupByName.toString(),
  createPreRestoreDataBackup.toString(),
  restoreDataBackupByName.toString(),
  sendDataBackupFile.toString(),
].join('\n\n');

const SERVER_BACKUP_ENDPOINTS = `  if (pathname === "/api/admin/data-safety/download") {
    if (!isAdminRequest(request)) {
      sendJson(response, 401, { message: "Connexion gestion requise." });
      return true;
    }
    if (request.method !== "GET") {
      sendJson(response, 405, { message: "Methode non autorisee." });
      return true;
    }
    try {
      const requestUrl = new URL(request.url, getRequestOrigin(request));
      const backup = await readDataBackupByName(requestUrl.searchParams.get("name"));
      sendDataBackupFile(response, backup);
    } catch (error) {
      sendJson(response, 404, { message: error.message || "Sauvegarde introuvable." });
    }
    return true;
  }

  if (pathname === "/api/admin/data-safety/restore") {
    if (!isAdminRequest(request)) {
      sendJson(response, 401, { message: "Connexion gestion requise." });
      return true;
    }
    if (request.method !== "POST") {
      sendJson(response, 405, { message: "Methode non autorisee." });
      return true;
    }
    try {
      const body = await readRequestBody(request);
      const payload = body ? JSON.parse(body) : {};
      if (payload.confirm !== "RESTAURER") {
        sendJson(response, 400, { message: "Confirmation RESTAURER requise." });
        return true;
      }
      const result = await withDataMutation(() => restoreDataBackupByName(payload.name));
      sendJson(response, 200, result);
    } catch (error) {
      sendJson(response, 500, { message: error.message || "Restauration impossible." });
    }
    return true;
  }
`;

function patchServer(server) {
  let output = ensureServerImport(server);
  output = insertAfterBlock(output, 'async function getDataSafetyStatus', `${SERVER_BACKUP_HELPERS}\n`, 'data-safety-restore-v132');
  output = insertAfterBlock(output, '  if (pathname === "/api/admin/data-safety") {', SERVER_BACKUP_ENDPOINTS, 'pathname === "/api/admin/data-safety/download"');
  return output;
}

const APP_BACKUP_TOOLS_PATCH = `
/* admin-backup-download-restore-v132 */
const ADMIN_DATA_SAFETY_DOWNLOAD_URL = "/api/admin/data-safety/download";
const ADMIN_DATA_SAFETY_RESTORE_URL = "/api/admin/data-safety/restore";

function adminBackupToolsFormatSizeV132(size) {
  const bytes = Number(size || 0);
  if (!Number.isFinite(bytes) || bytes <= 0) return "taille inconnue";
  if (bytes < 1024) return bytes + " o";
  if (bytes < 1024 * 1024) return Math.round(bytes / 1024) + " Ko";
  return (bytes / 1024 / 1024).toFixed(1).replace(".", ",") + " Mo";
}

function adminBackupToolsEnsureV132() {
  const safetyPanel = document.querySelector("#admin-data-safety-panel");
  if (!safetyPanel) return null;

  let tools = document.querySelector("#admin-backup-tools-v132");
  if (!tools) {
    tools = document.createElement("section");
    tools.className = "backup-tools-panel";
    tools.id = "admin-backup-tools-v132";
    tools.innerHTML = [
      '<div class="backup-tools-copy">',
        '<p class="section-label">Plan anti-perte</p>',
        '<h3>Restaurer ou telecharger une sauvegarde</h3>',
        '<p id="admin-backup-tools-note">Choisissez une sauvegarde recente. La restauration demande une confirmation manuelle.</p>',
      '</div>',
      '<div class="backup-tools-controls">',
        '<label for="admin-backup-select">Sauvegarde</label>',
        '<select id="admin-backup-select"></select>',
        '<button class="secondary-button compact-button" type="button" id="admin-backup-download">Telecharger</button>',
        '<button class="danger-button compact-button" type="button" id="admin-backup-restore">Restaurer</button>',
      '</div>',
    ].join("");
    safetyPanel.insertAdjacentElement("afterend", tools);
  }

  const select = tools.querySelector("#admin-backup-select");
  const downloadButton = tools.querySelector("#admin-backup-download");
  const restoreButton = tools.querySelector("#admin-backup-restore");
  const note = tools.querySelector("#admin-backup-tools-note");

  if (downloadButton && downloadButton.dataset.bound !== "1") {
    downloadButton.dataset.bound = "1";
    downloadButton.addEventListener("click", adminBackupToolsDownloadV132);
  }
  if (restoreButton && restoreButton.dataset.bound !== "1") {
    restoreButton.dataset.bound = "1";
    restoreButton.addEventListener("click", adminBackupToolsRestoreV132);
  }

  return { tools, select, downloadButton, restoreButton, note };
}

function adminBackupToolsRenderV132(payload) {
  const refs = adminBackupToolsEnsureV132();
  if (!refs) return;
  const backups = Array.isArray(payload?.backups?.recent) ? payload.backups.recent : [];
  refs.select.innerHTML = "";

  if (!backups.length) {
    const option = document.createElement("option");
    option.value = "";
    option.textContent = "Aucune sauvegarde disponible";
    refs.select.append(option);
    refs.downloadButton.disabled = true;
    refs.restoreButton.disabled = true;
    refs.note.textContent = "Creez une sauvegarde manuelle ou attendez la prochaine sauvegarde automatique avant modification.";
    return;
  }

  backups.forEach((backup) => {
    const option = document.createElement("option");
    option.value = backup.name;
    option.textContent = adminDataSafetyFormatTime(backup.modifiedAt) + " - " + adminBackupToolsFormatSizeV132(backup.size) + " - " + backup.name;
    refs.select.append(option);
  });
  refs.downloadButton.disabled = false;
  refs.restoreButton.disabled = false;
  refs.note.textContent = "Avant chaque restauration, le serveur cree automatiquement une sauvegarde de l'etat actuel.";
}

function adminBackupToolsSelectedNameV132() {
  return document.querySelector("#admin-backup-select")?.value || "";
}

function adminBackupToolsDownloadV132() {
  const name = adminBackupToolsSelectedNameV132();
  if (!name) return;
  window.open(ADMIN_DATA_SAFETY_DOWNLOAD_URL + "?name=" + encodeURIComponent(name), "_blank", "noopener");
}

async function adminBackupToolsRestoreV132() {
  const name = adminBackupToolsSelectedNameV132();
  if (!name) return;
  const typed = window.prompt("Pour restaurer cette sauvegarde, tapez RESTAURER en majuscules. Une sauvegarde de l'etat actuel sera creee avant restauration.");
  if (typed !== "RESTAURER") {
    showToast("Restauration annulee.");
    return;
  }

  const refs = adminBackupToolsEnsureV132();
  if (!refs) return;
  refs.restoreButton.disabled = true;
  refs.note.textContent = "Restauration en cours...";
  try {
    const response = await fetch(ADMIN_DATA_SAFETY_RESTORE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ name, confirm: "RESTAURER" }),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.message || "Restauration impossible.");
    adminDataSafetyRender(payload);
    if (typeof syncDataFromServer === "function") await syncDataFromServer();
    if (typeof renderAdmin === "function") renderAdmin();
    showToast("Sauvegarde restauree.");
  } catch (error) {
    refs.note.textContent = error.message || "Restauration impossible.";
  } finally {
    refs.restoreButton.disabled = false;
  }
}

if (typeof adminDataSafetyRender === "function" && !window.__adminBackupToolsV132Installed) {
  window.__adminBackupToolsV132Installed = true;
  const previousAdminDataSafetyRenderV132 = adminDataSafetyRender;
  adminDataSafetyRender = function adminDataSafetyRenderWithBackupToolsV132(payload) {
    previousAdminDataSafetyRenderV132(payload);
    adminBackupToolsRenderV132(payload);
  };
  window.setTimeout(() => {
    const safetyPanel = document.querySelector("#admin-data-safety-panel");
    if (safetyPanel) adminBackupToolsEnsureV132();
  }, 1500);
}
`;

function patchApp(app) {
  let output = bumpAssetVersions(app);
  if (!output.includes('admin-backup-download-restore-v132')) {
    output = `${output.trimEnd()}\n${APP_BACKUP_TOOLS_PATCH}\n`;
  }
  return output;
}

function patchStyles(css) {
  if (css.includes('admin-backup-download-restore-v132')) return css;
  return `${css.trimEnd()}

/* admin-backup-download-restore-v132 */
.backup-tools-panel {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(300px, 420px);
  gap: 14px;
  align-items: start;
  margin: -8px 0 18px;
  padding: 16px;
  border: 1px solid rgba(184, 66, 61, 0.18);
  border-radius: var(--radius);
  background: #fffdf8;
}

.backup-tools-copy h3 {
  margin: 2px 0 6px;
  color: var(--green);
}

.backup-tools-copy p:last-child,
.backup-tools-controls label {
  color: var(--muted);
  font-size: 0.9rem;
  line-height: 1.45;
}

.backup-tools-controls {
  display: grid;
  grid-template-columns: 1fr auto auto;
  gap: 8px;
  align-items: end;
}

.backup-tools-controls label {
  grid-column: 1 / -1;
  font-weight: 900;
}

.backup-tools-controls select {
  min-height: 42px;
  min-width: 0;
  border: 1px solid var(--line);
  border-radius: var(--radius);
  background: #fff;
  color: var(--ink);
}

@media (max-width: 920px) {
  .backup-tools-panel,
  .backup-tools-controls {
    grid-template-columns: 1fr;
  }
}
`;
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

console.log(`Admin backup download restore v${VERSION} applied.`);
