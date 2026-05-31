import { readFile, writeFile } from "node:fs/promises";

const VERSION = 86;

async function patchTextFile(filePath, patcher) {
  const input = await readFile(filePath, "utf8");
  const output = patcher(input);
  if (output !== input) {
    await writeFile(filePath, output, "utf8");
  }
}

function replaceOnce(input, search, replacement, label) {
  if (input.includes(replacement)) return input;
  if (!input.includes(search)) {
    throw new Error(`Patch v${VERSION} introuvable: ${label}`);
  }
  return input.replace(search, replacement);
}

function patchApp(app) {
  let next = app;

  next = replaceOnce(
    next,
    `    if (response.status === 404) {
      saveData({ immediate: true });
      showServerSyncNotice("Backend initialis\u00e9 avec les donn\u00e9es de cette machine.");
      return;
    }`,
    `    if (response.status === 404) {
      serverSyncEnabled = false;
      showServerSyncNotice("Donnees serveur absentes. Sauvegarde suspendue pour proteger les parcours.");
      return;
    }`,
    "app 404 backend seed protection",
  );

  return next;
}

function patchServer(server) {
  let next = server;

  next = replaceOnce(
    next,
    `import { readFile, rename, stat, writeFile, mkdir } from "node:fs/promises";`,
    `import { readFile, readdir, rename, stat, unlink, writeFile, mkdir } from "node:fs/promises";`,
    "server fs imports",
  );

  next = replaceOnce(
    next,
    `const DATA_FILE = path.join(DATA_DIR, "escape-data.json");`,
    `const DATA_FILE = path.join(DATA_DIR, "escape-data.json");
const DATA_BACKUP_DIR = path.join(DATA_DIR, "backups");
const MAX_DATA_BACKUPS = 30;`,
    "server backup constants",
  );

  next = replaceOnce(
    next,
    `function stableJson(value) {
  return JSON.stringify(value ?? null);
}`,
    `function stableJson(value) {
  return JSON.stringify(value ?? null);
}

function isSeedDemoData(value) {
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
}`,
    "server demo seed detector",
  );

  next = replaceOnce(
    next,
    `function isPlayerSafeUpdate(previousData, nextData) {
  if (!previousData) return true;
  return (`,
    `function isPlayerSafeUpdate(previousData, nextData) {
  if (!previousData) return false;
  return (`,
    "server player cannot initialize backend",
  );

  next = replaceOnce(
    next,
    `async function writeStoredData(payload) {
  await mkdir(DATA_DIR, { recursive: true });
  const tempFile = \`${DATA_FILE}.tmp\`;
  await writeFile(tempFile, \`${JSON.stringify(payload, null, 2)}\\n\`, "utf8");
  await rename(tempFile, DATA_FILE);
}`,
    `async function pruneDataBackups() {
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
    await writeFile(backupFile, \`${JSON.stringify(parsed, null, 2)}\\n\`, "utf8");
    await pruneDataBackups();
  } catch (error) {
    if (error.code !== "ENOENT") console.warn("Sauvegarde de protection impossible.", error);
  }
}

async function writeStoredData(payload) {
  await mkdir(DATA_DIR, { recursive: true });
  await backupStoredDataIfPresent(payload);
  const tempFile = \`${DATA_FILE}.tmp\`;
  await writeFile(tempFile, \`${JSON.stringify(payload, null, 2)}\\n\`, "utf8");
  await rename(tempFile, DATA_FILE);
}`,
    "server protective backups",
  );

  next = replaceOnce(
    next,
    `        const stored = await readStoredData();
        if (!isAdminRequest(request) && !isPlayerSafeUpdate(stored, payload)) {
          return { status: 403, payload: { message: "Acces gestion requis." } };
        }
        await writeStoredData(payload);`,
    `        const stored = await readStoredData();
        if (isSeedDemoData(payload) && (!stored || !isSeedDemoData(stored))) {
          return { status: 409, payload: { message: "Protection anti-donnees demo: sauvegarde refusee." } };
        }
        if (!isAdminRequest(request) && !stored) {
          return { status: 409, payload: { message: "Initialisation serveur reservee a la gestion." } };
        }
        if (!isAdminRequest(request) && !isPlayerSafeUpdate(stored, payload)) {
          return { status: 403, payload: { message: "Acces gestion requis." } };
        }
        await writeStoredData(payload);`,
    "server data write guard",
  );

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
