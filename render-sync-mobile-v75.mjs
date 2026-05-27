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
    throw new Error(`Patch v75 introuvable: ${label}`);
  }
  return input.replace(search, replacement);
}

function patchApp(js) {
  let next = js;

  if (!next.includes("let serverReconnectTimer = null;")) {
    next = replaceOnce(
      next,
      "let serverSyncNoticeShown = false;\nlet adminAuthenticated = !canUseBackend();",
      "let serverSyncNoticeShown = false;\nlet serverReconnectTimer = null;\nlet serverWasTemporarilyUnavailable = false;\nlet adminAuthenticated = !canUseBackend();",
      "sync state variables",
    );
  }

  const oldRetry = `async function fetchDataFromServerWithRetry() {
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
}`;

  const newRetry = `async function fetchDataFromServerWithRetry() {
  let lastError = null;
  const retryStatuses = new Set([408, 425, 429, 500, 502, 503, 504]);

  for (let attempt = 1; attempt <= 7; attempt += 1) {
    try {
      const separator = API_DATA_URL.includes("?") ? "&" : "?";
      const response = await fetch(\`${API_DATA_URL}\${separator}sync=\${Date.now()}-\${attempt}\`, {
        headers: { Accept: "application/json" },
        cache: "no-store",
        credentials: "same-origin",
      });

      if (!retryStatuses.has(response.status) || attempt === 7) {
        return response;
      }

      lastError = new Error(\`Backend temporairement indisponible (\${response.status}).\`);
    } catch (error) {
      lastError = error;
      if (attempt === 7) {
        throw lastError || new Error("Connexion serveur impossible.");
      }
    }

    await new Promise((resolve) => setTimeout(resolve, Math.min(1200 * attempt, 6000)));
  }

  throw lastError || new Error("Connexion serveur impossible.");
}`;

  if (!next.includes("retryStatuses = new Set")) {
    next = replaceOnce(next, oldRetry, newRetry, "server fetch retry");
  }

  const oldSuccess = `    data = serverData;
    saveData({ sync: false });
    render();
    showServerSyncNotice("Données chargées depuis le backend.");
  } catch (error) {
    serverSyncEnabled = false;
    console.warn(error);
    showServerSyncNotice("Connexion serveur temporairement indisponible. Les données restent sur cet appareil pour le moment.");
  }
}`;

  const newSuccess = `    data = serverData;
    saveData({ sync: false });
    render();
    if (serverWasTemporarilyUnavailable) {
      serverWasTemporarilyUnavailable = false;
      showToast("Connexion serveur rétablie. Données synchronisées.");
    } else {
      showServerSyncNotice("Données chargées depuis le backend.");
    }
  } catch (error) {
    serverSyncEnabled = false;
    serverWasTemporarilyUnavailable = true;
    console.warn(error);
    showServerSyncNotice("Connexion serveur temporairement indisponible. Nouvel essai automatique en cours.");
    queueServerReconnect();
  }
}`;

  if (!next.includes("Nouvel essai automatique en cours")) {
    next = replaceOnce(next, oldSuccess, newSuccess, "sync success/catch");
  }

  if (!next.includes("function queueServerReconnect()")) {
    const insertion = `
function queueServerReconnect() {
  if (!canUseBackend() || serverSyncEnabled || serverReconnectTimer) return;
  serverReconnectTimer = window.setTimeout(() => {
    serverReconnectTimer = null;
    syncDataFromServer();
  }, 5000);
}
`;
    next = replaceOnce(
      next,
      `function showServerSyncNotice(message) {
  if (serverSyncNoticeShown) return;
  serverSyncNoticeShown = true;
  showToast(message);
}
`,
      `function showServerSyncNotice(message) {
  if (serverSyncNoticeShown) return;
  serverSyncNoticeShown = true;
  showToast(message);
}
${insertion}`,
      "server reconnect helper",
    );
  }

  return next;
}

function patchIndex(html) {
  return html
    .replace(/app\.js\?v=\d+/g, "app.js?v=75")
    .replace(/styles\.css\?v=\d+/g, "styles.css?v=75");
}

function patchServiceWorker(js) {
  let next = js.replace(/escape-erezee-v\d+/g, "escape-erezee-v75");
  next = next.replace(/"\.\/app\.js"/g, '"./app.js?v=75"');
  next = next.replace(/"\.\/styles\.css"/g, '"./styles.css?v=75"');

  const oldFetch = `self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request).catch(() => caches.match("./index.html")),
    );
    return;
  }
  event.respondWith(caches.match(event.request).then((cached) => cached || fetch(event.request)));
});`;

  const newFetch = `self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);
  const isApiRequest = url.pathname.startsWith("/api/");
  const isFreshAsset = /\\.(?:js|css)$/.test(url.pathname);

  if (isApiRequest || isFreshAsset) {
    event.respondWith(fetch(event.request, { cache: "no-store" }));
    return;
  }

  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request).catch(() => caches.match("./index.html")),
    );
    return;
  }

  event.respondWith(caches.match(event.request).then((cached) => cached || fetch(event.request)));
});`;

  if (!next.includes("isApiRequest")) {
    next = replaceOnce(next, oldFetch, newFetch, "service worker fetch strategy");
  }

  return next;
}

await patchTextFile("app.js", patchApp);
await patchTextFile("index.html", patchIndex);
await patchTextFile("service-worker.js", patchServiceWorker);

console.log("Sync mobile v75 applique.");
