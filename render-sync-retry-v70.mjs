import { readFile, writeFile } from "node:fs/promises";

const VERSION = 70;

async function patchTextFile(filePath, patcher) {
  const input = await readFile(filePath, "utf8");
  const output = patcher(input);
  if (output !== input) {
    await writeFile(filePath, output, "utf8");
  }
}

function ensureIndex(html) {
  return html
    .replace(/styles\.css\?v=\d+/g, `styles.css?v=${VERSION}`)
    .replace(/app\.js\?v=\d+/g, `app.js?v=${VERSION}`);
}

function ensureApp(app) {
  let next = app;

  if (!next.includes("async function fetchDataFromServerWithRetry()")) {
    next = next.replace(
      "async function syncDataFromServer() {",
      `async function fetchDataFromServerWithRetry() {
  let lastError = null;
  for (let attempt = 1; attempt <= 4; attempt += 1) {
    try {
      return await fetch(API_DATA_URL, {
        headers: { Accept: "application/json" },
        cache: "no-store",
        credentials: "same-origin",
      });
    } catch (error) {
      lastError = error;
      if (attempt < 4) {
        await new Promise((resolve) => setTimeout(resolve, 900 * attempt));
      }
    }
  }
  throw lastError || new Error("Connexion serveur impossible.");
}

async function syncDataFromServer() {`,
    );
  }

  next = next.replace(
    `    const response = await fetch(API_DATA_URL, {
      headers: { Accept: "application/json" },
      cache: "no-store",
      credentials: "same-origin",
    });`,
    "    const response = await fetchDataFromServerWithRetry();",
  );

  next = next.replace(
    `    showServerSyncNotice("Mode local actif. Le backend sera utilisé dès qu’il sera disponible.");`,
    `    showServerSyncNotice("Connexion serveur temporairement indisponible. Les données restent sur cet appareil pour le moment.");`,
  );

  return next;
}

await patchTextFile("index.html", ensureIndex);
await patchTextFile("app.js", ensureApp);
await patchTextFile("service-worker.js", (worker) => worker.replace(/escape-erezee-v\d+/g, `escape-erezee-v${VERSION}`));

console.log("Sync retry v70 applique.");
