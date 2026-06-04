import { readFile, writeFile } from "node:fs/promises";

const VERSION = 105;
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

function patchApp(app) {
  if (app.includes("shop-initial-sync-v105")) return app;
  let next = app;

  next = next.replace(
    `let serverWasTemporarilyUnavailable = false;`,
    `let serverWasTemporarilyUnavailable = false;
let initialShopServerSyncPending = canUseBackend();
let initialShopServerSyncFailed = false;`,
  );

  next = next.replace(
    `    if (response.status === 404) {
      serverSyncEnabled = false;
      showServerSyncNotice("Donnees serveur absentes. Sauvegarde suspendue pour proteger les parcours.");
      return;
    }`,
    `    if (response.status === 404) {
      serverSyncEnabled = false;
      initialShopServerSyncFailed = true;
      renderShop();
      showServerSyncNotice("Donnees serveur absentes. Sauvegarde suspendue pour proteger les parcours.");
      return;
    }`,
  );

  next = next.replace(
    `    data = mergedSession.data;
    saveData(mergedSession.preserved ? { immediate: true } : { sync: false });
    render();`,
    `    data = mergedSession.data;
    initialShopServerSyncPending = false;
    initialShopServerSyncFailed = false;
    saveData(mergedSession.preserved ? { immediate: true } : { sync: false });
    render();`,
  );

  next = next.replace(
    `    serverSyncEnabled = false;
    serverWasTemporarilyUnavailable = true;
    console.warn(error);`,
    `    serverSyncEnabled = false;
    serverWasTemporarilyUnavailable = true;
    initialShopServerSyncFailed = true;
    renderShop();
    console.warn(error);`,
  );

  next = next.replace(
    `function renderShop() {
  if (!els.shopList || !els.shopEmpty) return;
  const routes = getShopRoutes();`,
    `function renderShop() {
  if (!els.shopList || !els.shopEmpty) return;
  if (canUseBackend() && initialShopServerSyncPending) {
    els.shopList.innerHTML = "";
    els.shopEmpty.textContent = initialShopServerSyncFailed
      ? "Connexion au serveur temporairement indisponible. Nouvel essai automatique en cours."
      : "Chargement des parcours...";
    return;
  }
  const routes = getShopRoutes();`,
  );

  if (!next.includes("initialShopServerSyncPending")) {
    throw new Error(`Patch v${VERSION} introuvable: etat initial boutique`);
  }
  if (!next.includes("Chargement des parcours...")) {
    throw new Error(`Patch v${VERSION} introuvable: rendu boutique`);
  }

  return `${next}
/* shop-initial-sync-v105 */
`;
}

function patchServiceWorker(worker) {
  return bumpAssetVersions(worker).replace(/escape-erezee-v\d+/g, `escape-erezee-v${VERSION}`);
}

await patchTextFile("app.js", patchApp);
await patchTextFile("index.html", bumpAssetVersions);
await patchTextFile("service-worker.js", patchServiceWorker);
