import { readFile, writeFile } from "node:fs/promises";

const VERSION = 106;
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
  if (app.includes("service-worker-update-v106")) return app;
  const previous = `function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;
  if (!["http:", "https:"].includes(location.protocol)) return;
  navigator.serviceWorker.register("service-worker.js").catch(() => {});
}`;
  const next = `function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;
  if (!["http:", "https:"].includes(location.protocol)) return;

  navigator.serviceWorker.register("service-worker.js")
    .then((registration) => {
      registration.update().catch(() => {});
      let updateHandled = false;
      navigator.serviceWorker.addEventListener("controllerchange", () => {
        if (updateHandled) return;
        updateHandled = true;

        const currentTeam = getCurrentTeam();
        if (currentTeam || isAdminRouteActive()) {
          showToast("Nouvelle version installee. Actualisez la page quand possible.");
          return;
        }

        try {
          const lockKey = "escape-erezee-sw-reload-lock";
          const lockedUntil = Number(sessionStorage.getItem(lockKey) || 0);
          if (Date.now() < lockedUntil) return;
          sessionStorage.setItem(lockKey, String(Date.now() + 5000));
        } catch {
          // Session storage can be unavailable on some private browsers.
        }

        window.location.reload();
      });
    })
    .catch(() => {});
}`;
  if (!app.includes(previous)) {
    throw new Error(`Patch v${VERSION} introuvable: registerServiceWorker`);
  }
  return `${app.replace(previous, next)}
/* service-worker-update-v106 */
`;
}

function patchServiceWorker(worker) {
  return bumpAssetVersions(worker).replace(/escape-erezee-v\d+/g, `escape-erezee-v${VERSION}`);
}

await patchTextFile("app.js", patchApp);
await patchTextFile("index.html", bumpAssetVersions);
await patchTextFile("service-worker.js", patchServiceWorker);
