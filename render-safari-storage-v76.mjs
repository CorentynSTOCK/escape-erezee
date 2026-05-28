import { readFile, writeFile } from "node:fs/promises";

async function patchTextFile(filePath, patcher) {
  const input = await readFile(filePath, "utf8");
  const output = patcher(input);
  if (output !== input) {
    await writeFile(filePath, output, "utf8");
  }
}

function replaceOnce(input, search, replacement, label) {
  if (!input.includes(search)) {
    throw new Error(`Patch v76 introuvable: ${label}`);
  }
  return input.replace(search, replacement);
}

function patchApp(js) {
  let next = js;

  const oldStorage = `function loadData() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {
    localStorage.removeItem(STORAGE_KEY);
  }
  const seed = createSeedData();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
  return seed;
}

function saveData(options = {}) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  if (options.sync !== false) {
    scheduleServerSave(Boolean(options.immediate));
  }
}`;

  const newStorage = `function clearStoredData() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Safari private mode or a full local storage can reject writes/removals.
  }
}

function writeStoredData(value) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
    return true;
  } catch (error) {
    console.warn("Stockage local indisponible, utilisation du backend uniquement.", error);
    clearStoredData();
    return false;
  }
}

function loadData() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {
    clearStoredData();
  }
  const seed = createSeedData();
  writeStoredData(seed);
  return seed;
}

function saveData(options = {}) {
  writeStoredData(data);
  if (options.sync !== false) {
    scheduleServerSave(Boolean(options.immediate));
  }
}`;

  if (!next.includes("function writeStoredData(value)")) {
    next = replaceOnce(next, oldStorage, newStorage, "local storage guard");
  }

  return next;
}

function patchIndex(html) {
  return html
    .replace(/app\.js\?v=\d+/g, "app.js?v=76")
    .replace(/styles\.css\?v=\d+/g, "styles.css?v=76");
}

function patchServiceWorker(js) {
  let next = js.replace(/escape-erezee-v\d+/g, "escape-erezee-v76");
  next = next.replace(/"\.\/app\.js(?:\?v=\d+)?"/g, '"./app.js?v=76"');
  next = next.replace(/"\.\/styles\.css(?:\?v=\d+)?"/g, '"./styles.css?v=76"');
  return next;
}

await patchTextFile("app.js", patchApp);
await patchTextFile("index.html", patchIndex);
await patchTextFile("service-worker.js", patchServiceWorker);

console.log("Safari storage v76 applique.");
