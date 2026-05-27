import { readFile, writeFile } from "node:fs/promises";

const VERSION = 69;

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

  if (!next.includes("function canAttemptServerSave()")) {
    next = next.replace(
      "function scheduleServerSave(immediate = false) {",
      `function canAttemptServerSave() {
  return canUseBackend() && (serverSyncEnabled || (isAdminRouteActive() && adminAuthenticated));
}

function scheduleServerSave(immediate = false) {`,
    );
  }

  next = next
    .split("if (!serverSyncEnabled || !canUseBackend()) return;")
    .join("if (!canAttemptServerSave()) return;");

  next = next.replace(
    `    if (!response.ok) {
      throw new Error("Sauvegarde backend refusée.");
    }`,
    `    if (!response.ok) {
      throw new Error("Sauvegarde backend refusée.");
    }
    serverSyncEnabled = true;`,
  );

  next = next.replace(
    `function setActiveRoute(routeId) {
  data.activeRouteId = routeId;
  selectedGeoPuzzleId = null;
  selectedHintPuzzleId = null;
  selectedContentPuzzleId = null;
  localStorage.setItem(ACTIVE_ROUTE_KEY, routeId);
  saveData();
  renderAdmin();
}`,
    `function setActiveRoute(routeId) {
  data.activeRouteId = routeId;
  selectedGeoPuzzleId = null;
  selectedHintPuzzleId = null;
  selectedContentPuzzleId = null;
  localStorage.setItem(ACTIVE_ROUTE_KEY, routeId);
  saveData({ immediate: true });
  renderAdmin();
}`,
  );

  return next;
}

await patchTextFile("index.html", ensureIndex);
await patchTextFile("app.js", ensureApp);
await patchTextFile("service-worker.js", (worker) => worker.replace(/escape-erezee-v\d+/g, `escape-erezee-v${VERSION}`));

console.log("Admin save retry v69 applique.");
