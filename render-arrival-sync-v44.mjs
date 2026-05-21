import { readFile, writeFile } from "node:fs/promises";

const INDEX_FILE = new URL("./index.html", import.meta.url);
const APP_FILE = new URL("./app.js", import.meta.url);
const SERVER_FILE = new URL("./server.mjs", import.meta.url);
const SERVICE_WORKER_FILE = new URL("./service-worker.js", import.meta.url);

const PLAYER_REFRESH_STATE = `let playerRouteRefreshPromise = null;
let lastPlayerRouteRefreshAt = 0;
`;

const PLAYER_REFRESH_FUNCTION = `async function refreshPlayerRoutesFromServer() {
  if (!serverSyncEnabled || !canUseBackend()) return;
  if (playerRouteRefreshPromise) return playerRouteRefreshPromise;
  if (Date.now() - lastPlayerRouteRefreshAt < 5000) return;

  playerRouteRefreshPromise = fetch(API_DATA_URL, {
    headers: { Accept: "application/json" },
    cache: "no-store",
    credentials: "same-origin",
  })
    .then(async (response) => {
      if (!response.ok) return;
      const serverData = await response.json();
      if (!isValidAppData(serverData)) return;

      const currentTeam = getCurrentTeam();
      const currentTeamId = localStorage.getItem(SESSION_KEY);
      data.routes = serverData.routes;
      data.codes = serverData.codes;
      const serverTeamExists = currentTeamId && serverData.teams.some((team) => team.id === currentTeamId);
      data.teams = serverTeamExists || !currentTeam
        ? serverData.teams
        : [...serverData.teams, currentTeam];
      saveData({ sync: false });
      lastPlayerRouteRefreshAt = Date.now();
    })
    .catch((error) => console.warn(error))
    .finally(() => {
      playerRouteRefreshPromise = null;
    });

  return playerRouteRefreshPromise;
}

`;

async function patchFile(fileUrl, patcher) {
  const original = await readFile(fileUrl, "utf8");
  const patched = patcher(original);
  if (patched !== original) {
    await writeFile(fileUrl, patched, "utf8");
  }
}

await patchFile(INDEX_FILE, (code) => code
  .replace(/styles\.css\?v=\d+/g, "styles.css?v=44")
  .replace(/app\.js\?v=\d+/g, "app.js?v=44"));

await patchFile(APP_FILE, (code) => {
  let next = code;

  if (!next.includes("let playerRouteRefreshPromise = null;")) {
    const stateTarget = next.includes("let lastLiveTeamRefreshAt = 0;\n")
      ? "let lastLiveTeamRefreshAt = 0;\n"
      : "let adminSessionCheckPromise = null;\n";
    next = next.replace(stateTarget, `${stateTarget}${PLAYER_REFRESH_STATE}`);
  }

  if (!next.includes("async function refreshPlayerRoutesFromServer()")) {
    next = next.replace(
      "\nfunction isAdminRouteActive() {",
      `\n${PLAYER_REFRESH_FUNCTION}function isAdminRouteActive() {`,
    );
  }

  next = next.replace(
    'els.startPointCard?.classList.toggle("is-hidden", isBriefing || gameFinished);',
    'els.startPointCard?.classList.toggle("is-hidden", true);',
  );

  next = next.replace(
    'const unlockMessage = message || "\\u00c9nigme d\\u00e9bloqu\\u00e9e.";',
    'const customArrivalMessage = puzzle?.arrivalMessage?.trim();\n  const unlockMessage = customArrivalMessage || message || "\\u00c9nigme d\\u00e9bloqu\\u00e9e.";',
  );

  next = next.replace(
    "function handleGeolocationPosition(position) {\n  const team = getCurrentTeam();",
    "async function handleGeolocationPosition(position) {\n  await refreshPlayerRoutesFromServer();\n  const team = getCurrentTeam();",
  );

  if (!next.includes('headers["X-Escape-Admin-Write"] = "1";')) {
    next = next.replace(
      `    const response = await fetch(API_DATA_URL, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify(data),
    });`,
      `    const headers = { "Content-Type": "application/json" };
    if (isAdminRouteActive() && adminAuthenticated) {
      headers["X-Escape-Admin-Write"] = "1";
    }
    const response = await fetch(API_DATA_URL, {
      method: "PUT",
      headers,
      credentials: "same-origin",
      body: JSON.stringify(data),
    });`,
    );
  }

  return next;
});

await patchFile(SERVER_FILE, (code) => {
  let next = code;
  if (!next.includes("function isAdminDataWriteRequest")) {
    next = next.replace(
      "\nasync function readRequestBody(request) {",
      `\nfunction isAdminDataWriteRequest(request) {
  return isAdminRequest(request) && request.headers["x-escape-admin-write"] === "1";
}

async function readRequestBody(request) {`,
    );
  }
  next = next.replace(
    "const isAdmin = isAdminRequest(request);",
    "const isAdmin = isAdminDataWriteRequest(request);",
  );
  return next;
});

await patchFile(SERVICE_WORKER_FILE, (code) => code.replace(/escape-erezee-v\d+/, "escape-erezee-v44"));
