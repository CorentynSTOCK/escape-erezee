import { readFile, writeFile } from 'node:fs/promises';

const VERSION = 134;

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

function getDailyBackupDateKeyV134(value = Date.now()) {
  return new Date(Number(value) || Date.now()).toISOString().slice(0, 10);
}

function isDailyBackupV134(backup) {
  return /^escape-data-daily-\d{4}-\d{2}-\d{2}-/.test(String(backup?.name || ''));
}

async function pruneDailyDataBackupsV134() {
  const backups = (await listDataBackups())
    .filter(isDailyBackupV134)
    .sort((a, b) => Number(b.modifiedAt || 0) - Number(a.modifiedAt || 0));
  const excess = backups.slice(MAX_DAILY_DATA_BACKUPS_V134);
  await Promise.all(excess.map((backup) => unlink(path.join(DATA_BACKUP_DIR, backup.name)).catch(() => {})));
}

async function createDailyDataBackupIfNeededV134(options = {}) {
  const force = Boolean(options.force);
  const dateKey = getDailyBackupDateKeyV134();
  const backups = await listDataBackups();
  const existing = backups.find((backup) => String(backup.name || '').startsWith(`escape-data-daily-${dateKey}-`));
  if (existing && !force) {
    return { created: false, backup: existing, reason: 'already_exists' };
  }

  const raw = await readFile(DATA_FILE, 'utf8');
  const parsed = JSON.parse(raw);
  if (!isAppData(parsed)) throw new Error('Donnees serveur illisibles.');

  await mkdir(DATA_BACKUP_DIR, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const fileName = `escape-data-daily-${dateKey}-${stamp}.json`;
  const filePath = path.join(DATA_BACKUP_DIR, fileName);
  await writeFile(filePath, raw.endsWith('\n') ? raw : `${raw}\n`, 'utf8');
  const fileStat = await stat(filePath);
  await pruneDailyDataBackupsV134();
  return { created: true, backup: { name: fileName, size: fileStat.size, modifiedAt: fileStat.mtimeMs } };
}

async function verifyDataBackupWithoutRestoreV134(rawName) {
  const backup = await readDataBackupByName(rawName);
  return {
    ok: true,
    verified: {
      name: backup.name,
      routes: Array.isArray(backup.data.routes) ? backup.data.routes.length : 0,
      teams: Array.isArray(backup.data.teams) ? backup.data.teams.length : 0,
      codes: Array.isArray(backup.data.codes) ? backup.data.codes.length : 0,
      activeRouteId: backup.data.activeRouteId || null,
      size: Buffer.byteLength(backup.raw, 'utf8'),
      checkedAt: Date.now(),
    },
  };
}

function startDailyDataBackupsV134() {
  if (dailyBackupTimerV134) return;
  const runBackup = () => {
    createDailyDataBackupIfNeededV134()
      .then((result) => {
        if (result.created) console.log(`Sauvegarde quotidienne creee: ${result.backup.name}`);
      })
      .catch((error) => console.warn('Sauvegarde quotidienne impossible.', error));
  };
  setTimeout(runBackup, 5000);
  dailyBackupTimerV134 = setInterval(runBackup, DAILY_BACKUP_CHECK_INTERVAL_MS_V134);
  dailyBackupTimerV134?.unref?.();
}

const SERVER_SCHEDULED_BACKUP_HELPERS = [
  '/* scheduled-backup-v134 */',
  'const DAILY_BACKUP_CHECK_INTERVAL_MS_V134 = 60 * 60 * 1000;',
  'const MAX_DAILY_DATA_BACKUPS_V134 = 45;',
  'let dailyBackupTimerV134 = null;',
  getDailyBackupDateKeyV134.toString(),
  isDailyBackupV134.toString(),
  pruneDailyDataBackupsV134.toString(),
  createDailyDataBackupIfNeededV134.toString(),
  verifyDataBackupWithoutRestoreV134.toString(),
  startDailyDataBackupsV134.toString(),
].join('\n\n');

const SERVER_VERIFY_ENDPOINT = `  if (pathname === "/api/admin/data-safety/verify") {
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
      const result = await verifyDataBackupWithoutRestoreV134(payload.name);
      sendJson(response, 200, result);
    } catch (error) {
      sendJson(response, 400, { message: error.message || "Verification impossible." });
    }
    return true;
  }
`;

function patchBackupNameValidation(server) {
  if (server.includes('manual|before-write|pre-restore|daily')) return server;
  if (!server.includes('manual|before-write|pre-restore')) {
    throw new Error(`Patch v${VERSION} introuvable: validation nom sauvegarde`);
  }
  return server.replace('manual|before-write|pre-restore', 'manual|before-write|pre-restore|daily');
}

function patchDataSafetyStatus(server) {
  if (server.includes('dailyLatest: backups.find(isDailyBackupV134)')) return server;
  const marker = `      latest: backups[0] || null,
      recent: backups.slice(0, 5),`;
  if (!server.includes(marker)) throw new Error(`Patch v${VERSION} introuvable: statut sauvegardes`);
  return server.replace(marker, `      latest: backups[0] || null,
      dailyLatest: backups.find(isDailyBackupV134) || null,
      dailyToday: backups.find((backup) => String(backup.name || '').startsWith(\`escape-data-daily-\${getDailyBackupDateKeyV134()}-\`)) || null,
      recent: backups.slice(0, 5),`);
}

function patchServerStart(server) {
  if (server.includes('startDailyDataBackupsV134();')) return server;
  const marker = '      resolve({ server, url, lanUrls, port, host });';
  if (!server.includes(marker)) throw new Error(`Patch v${VERSION} introuvable: demarrage serveur`);
  return server.replace(marker, `      startDailyDataBackupsV134();\n${marker}`);
}

function patchServer(server) {
  let output = ensureServerImport(server);
  output = patchBackupNameValidation(output);
  output = insertAfterBlock(output, 'function sendDataBackupFile', `${SERVER_SCHEDULED_BACKUP_HELPERS}\n`, 'scheduled-backup-v134');
  output = patchDataSafetyStatus(output);
  output = insertAfterBlock(output, '  if (pathname === "/api/admin/data-safety/download") {', SERVER_VERIFY_ENDPOINT, 'pathname === "/api/admin/data-safety/verify"');
  output = patchServerStart(output);
  return output;
}

const APP_SCHEDULED_BACKUPS_PATCH = `
/* scheduled-backup-ui-v134 */
const ADMIN_DATA_SAFETY_VERIFY_URL_V134 = "/api/admin/data-safety/verify";

function adminBackupToolsEnsureVerifyV134() {
  const refs = adminBackupToolsEnsureV132?.();
  if (!refs?.tools || !refs.select) return null;
  let button = refs.tools.querySelector("#admin-backup-verify-v134");
  if (!button) {
    button = document.createElement("button");
    button.className = "secondary-button compact-button";
    button.type = "button";
    button.id = "admin-backup-verify-v134";
    button.textContent = "Tester";
    refs.downloadButton?.insertAdjacentElement("afterend", button);
  }
  if (button.dataset.bound !== "1") {
    button.dataset.bound = "1";
    button.addEventListener("click", adminBackupToolsVerifyV134);
  }
  button.disabled = !refs.select.value;
  return { ...refs, verifyButton: button };
}

async function adminBackupToolsVerifyV134() {
  const refs = adminBackupToolsEnsureVerifyV134();
  const name = adminBackupToolsSelectedNameV132?.();
  if (!refs || !name) return;
  refs.verifyButton.disabled = true;
  refs.note.textContent = "Verification de la sauvegarde sans restauration...";
  try {
    const response = await fetch(ADMIN_DATA_SAFETY_VERIFY_URL_V134, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ name }),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.message || "Verification impossible.");
    const verified = payload.verified || {};
    refs.note.textContent = "Sauvegarde lisible : " + (verified.routes || 0) + " parcours, " + (verified.teams || 0) + " equipes, " + (verified.codes || 0) + " codes. Aucune donnee live n'a ete modifiee.";
    showToast("Sauvegarde testee sans restauration.");
  } catch (error) {
    refs.note.textContent = error.message || "Verification impossible.";
  } finally {
    refs.verifyButton.disabled = false;
  }
}

if (typeof adminBackupToolsRenderV132 === "function" && !window.__scheduledBackupUiV134Installed) {
  window.__scheduledBackupUiV134Installed = true;
  const previousAdminBackupToolsRenderV134 = adminBackupToolsRenderV132;
  adminBackupToolsRenderV132 = function adminBackupToolsRenderWithScheduledV134(payload) {
    previousAdminBackupToolsRenderV134(payload);
    const refs = adminBackupToolsEnsureVerifyV134();
    if (refs?.note && !refs.note.textContent.includes("Sauvegarde lisible")) {
      const daily = payload?.backups?.dailyToday || payload?.backups?.dailyLatest;
      refs.note.textContent = daily
        ? refs.note.textContent + " Sauvegarde quotidienne active."
        : refs.note.textContent + " Une sauvegarde quotidienne sera creee automatiquement.";
    }
  };
}
`;

function patchApp(app) {
  let output = bumpAssetVersions(app);
  if (!output.includes('scheduled-backup-ui-v134')) {
    output = `${output.trimEnd()}\n${APP_SCHEDULED_BACKUPS_PATCH}\n`;
  }
  return output;
}

function patchStyles(css) {
  let output = css;
  if (!output.includes('scheduled-backup-ui-v134')) {
    output = `${output.trimEnd()}\n\n/* scheduled-backup-ui-v134 */\n.backup-tools-controls {\n  grid-template-columns: minmax(260px, 1fr) auto auto auto;\n}\n\n#admin-backup-verify-v134 {\n  white-space: nowrap;\n}\n\n@media (max-width: 720px) {\n  .backup-tools-controls {\n    grid-template-columns: 1fr;\n  }\n}\n`;
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

console.log(`Scheduled backups v${VERSION} applied.`);
