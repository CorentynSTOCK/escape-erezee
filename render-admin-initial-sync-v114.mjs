import { readFile, writeFile } from "node:fs/promises";

const VERSION = 114;

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

function patchApp(app) {
  if (app.includes("admin-initial-sync-v114")) return app;
  let next = bumpAssetVersions(app);

  next = next.replace(
    `let initialShopServerSyncPending = canUseBackend();
let initialShopServerSyncFailed = false;`,
    `let initialShopServerSyncPending = canUseBackend();
let initialShopServerSyncFailed = false;
let initialAdminServerSyncPending = canUseBackend();
let initialAdminServerSyncFailed = false;`,
  );

  next = next.replace(
    `      initialShopServerSyncFailed = true;
      renderShop();
      showServerSyncNotice("Donnees serveur absentes. Sauvegarde suspendue pour proteger les parcours.");`,
    `      initialShopServerSyncFailed = true;
      initialAdminServerSyncFailed = true;
      renderShop();
      renderAdmin();
      showServerSyncNotice("Donnees serveur absentes. Sauvegarde suspendue pour proteger les parcours.");`,
  );

  next = next.replace(
    `    initialShopServerSyncPending = false;
    initialShopServerSyncFailed = false;
    saveData(mergedSession.preserved ? { immediate: true } : { sync: false });`,
    `    initialShopServerSyncPending = false;
    initialShopServerSyncFailed = false;
    initialAdminServerSyncPending = false;
    initialAdminServerSyncFailed = false;
    saveData(mergedSession.preserved ? { immediate: true } : { sync: false });`,
  );

  next = next.replace(
    `    initialShopServerSyncFailed = true;
    renderShop();
    console.warn(error);`,
    `    initialShopServerSyncFailed = true;
    initialAdminServerSyncFailed = true;
    renderShop();
    renderAdmin();
    console.warn(error);`,
  );

  const renderAdminMarker = `function renderAdmin() {
  renderAdminAccess();
  if (canUseBackend() && !adminAuthenticated) return;

  const activeRoute = getActiveRoute();`;
  const renderAdminPatch = `function renderAdminInitialServerSyncState() {
  const message = initialAdminServerSyncFailed
    ? "Connexion serveur temporairement indisponible. Nouvel essai automatique en cours."
    : "Chargement des donnees serveur...";
  if (els.routeCount) els.routeCount.textContent = "serveur";
  if (els.routeList) {
    els.routeList.innerHTML = '<article class="admin-loading-card">' + message + '</article>';
  }
  if (els.teamTable) {
    els.teamTable.innerHTML = '<tr><td class="admin-loading-row" colspan="8">' + message + '</td></tr>';
  }
  if (els.codeList) {
    els.codeList.innerHTML = '<div class="admin-loading-card">' + message + '</div>';
  }
}

function renderAdmin() {
  renderAdminAccess();
  if (canUseBackend() && !adminAuthenticated) return;
  if (canUseBackend() && initialAdminServerSyncPending) {
    renderAdminInitialServerSyncState();
    return;
  }

  const activeRoute = getActiveRoute();`;
  if (!next.includes(renderAdminMarker)) {
    throw new Error(`Patch v${VERSION} introuvable: renderAdmin`);
  }
  next = next.replace(renderAdminMarker, renderAdminPatch);

  const quickConsoleMarker = `  const consoleEl = adminQuickConsoleEnsure();
  if (!consoleEl) return;

  const routes = adminQuickConsoleRoutes();`;
  const quickConsolePatch = `  const consoleEl = adminQuickConsoleEnsure();
  if (!consoleEl) return;

  if (canUseBackend() && typeof initialAdminServerSyncPending !== "undefined" && initialAdminServerSyncPending) {
    const message = initialAdminServerSyncFailed ? "nouvel essai" : "chargement";
    consoleEl.querySelector("[data-admin-quick-routes]").textContent = "--";
    consoleEl.querySelector("[data-admin-quick-active-route]").textContent = "Donnees serveur en cours";
    consoleEl.querySelector("[data-admin-quick-teams]").textContent = "--";
    consoleEl.querySelector("[data-admin-quick-teams-detail]").textContent = "Suivi en attente";
    consoleEl.querySelector("[data-admin-quick-codes]").textContent = "--";
    consoleEl.querySelector("[data-admin-quick-codes-detail]").textContent = "Codes en attente";
    consoleEl.querySelector("[data-admin-quick-sync]").textContent = message;
    return;
  }

  const routes = adminQuickConsoleRoutes();`;
  if (next.includes(quickConsoleMarker)) {
    next = next.replace(quickConsoleMarker, quickConsolePatch);
  }

  if (!next.includes("initialAdminServerSyncPending")) {
    throw new Error(`Patch v${VERSION} introuvable: etat initial admin`);
  }

  return `${next.trimEnd()}
/* admin-initial-sync-v114 */
`;
}

function patchStyles(css) {
  if (css.includes("admin-initial-sync-v114")) return css;
  return `${css.trimEnd()}

/* admin-initial-sync-v114 */
.admin-loading-card {
  padding: 18px;
  border: 1px dashed #b8cbc3;
  border-radius: var(--radius);
  background: #f7faf8;
  color: var(--muted);
  font-weight: 850;
}

.admin-loading-row {
  color: var(--muted);
  font-weight: 850;
  text-align: center;
}
`;
}

function patchServiceWorker(worker) {
  return bumpAssetVersions(worker).replace(/escape-erezee-v\d+/g, `escape-erezee-v${VERSION}`);
}

await patchTextFile("app.js", patchApp);
await patchTextFile("styles.css", patchStyles);
await patchTextFile("index.html", bumpAssetVersions);
await patchTextFile("service-worker.js", patchServiceWorker);

console.log(`Admin initial sync v${VERSION} applied.`);
