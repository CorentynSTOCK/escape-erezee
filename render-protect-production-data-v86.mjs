import { readFile, writeFile } from "node:fs/promises";

const VERSION = 86;

async function patchTextFile(filePath, patcher) {
  const input = await readFile(filePath, "utf8");
  const output = patcher(input);
  if (output !== input) await writeFile(filePath, output, "utf8");
}

function findFunctionEnd(input, start) {
  const bodyStart = input.indexOf("{", start);
  if (bodyStart < 0) return -1;
  let depth = 0;
  let quote = null;
  let escaped = false;
  for (let i = bodyStart; i < input.length; i += 1) {
    const char = input[i];
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
      if (depth === 0) return i + 1;
    }
  }
  return -1;
}

function replaceFunction(input, signature, replacement) {
  const start = input.indexOf(signature);
  if (start < 0) throw new Error(`Patch v${VERSION} introuvable: ${signature}`);
  const end = findFunctionEnd(input, start);
  if (end < 0) throw new Error(`Patch v${VERSION} impossible: fin de ${signature}`);
  return input.slice(0, start) + replacement + input.slice(end);
}

function insertAfterFunction(input, signature, insertion, marker) {
  if (input.includes(marker)) return input;
  const start = input.indexOf(signature);
  if (start < 0) throw new Error(`Patch v${VERSION} introuvable: ${signature}`);
  const end = findFunctionEnd(input, start);
  if (end < 0) throw new Error(`Patch v${VERSION} impossible: insertion apres ${signature}`);
  return input.slice(0, end) + "\n\n" + insertion + input.slice(end);
}

function patchApp(app) {
  let next = app;
  if (!next.includes("Sauvegarde suspendue pour proteger les parcours")) {
    next = next.replace(
      /    if \(response\.status === 404\) \{\n      saveData\(\{ immediate: true \}\);\n      showServerSyncNotice\([^\n]+\);\n      return;\n    \}/,
      `    if (response.status === 404) {
      serverSyncEnabled = false;
      showServerSyncNotice("Donnees serveur absentes. Sauvegarde suspendue pour proteger les parcours.");
      return;
    }`,
    );
  }
  if (!next.includes("Sauvegarde suspendue pour proteger les parcours")) {
    throw new Error(`Patch v${VERSION} introuvable: app 404 backend seed protection`);
  }
  return next;
}

function ensureImport(input) {
  return input.replace(
    `import { readFile, rename, stat, writeFile, mkdir } from "node:fs/promises";`,
    `import { readFile, readdir, rename, stat, unlink, writeFile, mkdir } from "node:fs/promises";`,
  );
}

function ensureBackupConstants(input) {
  if (input.includes("const DATA_BACKUP_DIR =")) return input;
  return input.replace(
    `const DATA_FILE = path.join(DATA_DIR, "escape-data.json");`,
    `const DATA_FILE = path.join(DATA_DIR, "escape-data.json");
const DATA_BACKUP_DIR = path.join(DATA_DIR, "backups");
const MAX_DATA_BACKUPS = 30;`,
  );
}

const SEED_DEMO_HELPER = `function isSeedDemoData(value) {
  const routes = Array.isArray(value?.routes) ? value.routes : [];
  const teams = Array.isArray(value?.teams) ? value.teams : [];
  const codes = Array.isArray(value?.codes) ? value.codes : [];
  return (
    routes.length === 1
    && routes[0]?.id === "route-tramway"
    && routes[0]?.title === "Le Secret du Tramway"
    && teams.some((team) => team?.id === "team-demo")
    && codes.some((code) => code?.code === "742-ERE-931")
  );
}`;

function ensureSeedDemoHelper(input) {
  return insertAfterFunction(input, "function stableJson", SEED_DEMO_HELPER, "function isSeedDemoData");
}

function hardenPlayerSafeUpdate(input) {
  return replaceFunction(input, "function isPlayerSafeUpdate", `function isPlayerSafeUpdate(previousData, nextData) {
  if (!previousData) return false;
  return (
    previousData.activeRouteId === nextData.activeRouteId
    && stableJson(previousData.routes) === stableJson(nextData.routes)
    && codesKeepSameCatalog(previousData.codes, nextData.codes)
    && Array.isArray(nextData.teams)
  );
}`);
}

const PROTECTED_WRITE_FUNCTION = `async function pruneDataBackups() {
  try {
    const entries = await readdir(DATA_BACKUP_DIR, { withFileTypes: true });
    const files = entries
      .filter((entry) => entry.isFile() && entry.name.startsWith("escape-data-before-write-") && entry.name.endsWith(".json"))
      .map((entry) => entry.name)
      .sort();
    const excess = files.slice(0, Math.max(0, files.length - MAX_DATA_BACKUPS));
    await Promise.all(excess.map((file) => unlink(path.join(DATA_BACKUP_DIR, file)).catch(() => {})));
  } catch (error) {
    if (error.code !== "ENOENT") console.warn("Nettoyage des sauvegardes impossible.", error);
  }
}

async function backupStoredDataIfPresent(nextPayload) {
  try {
    const raw = await readFile(DATA_FILE, "utf8");
    const parsed = JSON.parse(raw);
    if (!isAppData(parsed) || stableJson(parsed) === stableJson(nextPayload)) return;
    await mkdir(DATA_BACKUP_DIR, { recursive: true });
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    const backupFile = path.join(DATA_BACKUP_DIR, \`escape-data-before-write-\${stamp}.json\`);
    await writeFile(backupFile, \`\${JSON.stringify(parsed, null, 2)}\\n\`, "utf8");
    await pruneDataBackups();
  } catch (error) {
    if (error.code !== "ENOENT") console.warn("Sauvegarde de protection impossible.", error);
  }
}

async function writeStoredData(payload) {
  await mkdir(DATA_DIR, { recursive: true });
  await backupStoredDataIfPresent(payload);
  const tempFile = \`\${DATA_FILE}.tmp\`;
  await writeFile(tempFile, \`\${JSON.stringify(payload, null, 2)}\\n\`, "utf8");
  await rename(tempFile, DATA_FILE);
}`;

function hardenStoredDataWrites(input) {
  if (input.includes("async function backupStoredDataIfPresent")) return input;
  return replaceFunction(input, "async function writeStoredData", PROTECTED_WRITE_FUNCTION);
}

function hardenApiDataSave(input) {
  if (input.includes("Protection anti-donnees demo")) return input;
  const oldBlock = `        const stored = await readStoredData();
        const adminWrite = isAdminRequest(request);
        if (!adminWrite && !isPlayerSafeUpdate(stored, payload)) {
          return { status: 403, payload: { message: "Acces gestion requis." } };
        }
        const nextPayload = adminWrite || !stored ? payload : syncMergePlayerSafeData(stored, payload);
        await writeStoredData(nextPayload);
        return { status: 200, payload: { ok: true, savedAt: Date.now() } };`;
  const newBlock = `        const stored = await readStoredData();
        const adminWrite = isAdminRequest(request);
        if (isSeedDemoData(payload) && (!stored || !isSeedDemoData(stored))) {
          return { status: 409, payload: { message: "Protection anti-donnees demo: sauvegarde refusee." } };
        }
        if (!adminWrite && !stored) {
          return { status: 409, payload: { message: "Initialisation serveur reservee a la gestion." } };
        }
        if (!adminWrite && !isPlayerSafeUpdate(stored, payload)) {
          return { status: 403, payload: { message: "Acces gestion requis." } };
        }
        const nextPayload = adminWrite || !stored ? payload : syncMergePlayerSafeData(stored, payload);
        await writeStoredData(nextPayload);
        return { status: 200, payload: { ok: true, savedAt: Date.now() } };`;
  if (!input.includes(oldBlock)) {
    throw new Error(`Patch v${VERSION} introuvable: sauvegarde API data`);
  }
  return input.replace(oldBlock, newBlock);
}

function patchServer(server) {
  let next = ensureImport(server);
  next = ensureBackupConstants(next);
  next = ensureSeedDemoHelper(next);
  next = hardenPlayerSafeUpdate(next);
  next = hardenStoredDataWrites(next);
  next = hardenApiDataSave(next);
  return next;
}

function patchHtml(html) {
  return html.replace(/app\.js\?v=\d+/g, `app.js?v=${VERSION}`).replace(/styles\.css\?v=\d+/g, `styles.css?v=${VERSION}`);
}

function patchServiceWorker(worker) {
  let next = worker.replace(/escape-erezee-v\d+/g, `escape-erezee-v${VERSION}`);
  next = next.replace(/"\.\/app\.js(?:\?v=\d+)?"/g, `"./app.js?v=${VERSION}"`);
  next = next.replace(/"\.\/styles\.css(?:\?v=\d+)?"/g, `"./styles.css?v=${VERSION}"`);
  return next;
}

await patchTextFile("app.js", patchApp);
await patchTextFile("server.mjs", patchServer);
await patchTextFile("index.html", patchHtml);
await patchTextFile("suivi.html", patchHtml);
await patchTextFile("service-worker.js", patchServiceWorker);

console.log("Protection donnees production v86 appliquee.");
