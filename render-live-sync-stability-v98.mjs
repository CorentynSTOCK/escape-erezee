import { readFile, writeFile } from "node:fs/promises";

const VERSION = 98;
const scriptBaseUrl = new URL("./", import.meta.url);

async function patchTextFile(filePath, patcher) {
  const fileUrl = new URL(filePath, scriptBaseUrl);
  const input = await readFile(fileUrl, "utf8");
  const output = patcher(input);
  if (output !== input) await writeFile(fileUrl, output, "utf8");
}

function bumpAssetVersions(html) {
  return html
    .replace(/styles\.css\?v=\d+/g, `styles.css?v=${VERSION}`)
    .replace(/app\.js\?v=\d+/g, `app.js?v=${VERSION}`);
}

const playerPositionHelpers = `
function shouldAllowPlayerServerSave() {
  return Boolean(localStorage.getItem(SESSION_KEY));
}

function requestPlayerPositionRefresh(force = false) {
  const team = getCurrentTeam();
  if (!team || team.status !== "playing") return;
  const route = getRoute(team.routeId);
  const puzzle = getCurrentPuzzle(team, route);
  if (!route || !puzzle || !navigator.geolocation) return;
  if (playerPositionRefreshInFlight) return;
  if (!force && Date.now() - lastPlayerPositionRefreshAt < PLAYER_POSITION_REFRESH_MS) return;

  lastPlayerPositionRefreshAt = Date.now();
  playerPositionRefreshInFlight = true;
  navigator.geolocation.getCurrentPosition(
    async (position) => {
      try {
        await handleGeolocationPosition(position);
      } finally {
        playerPositionRefreshInFlight = false;
      }
    },
    (error) => {
      playerPositionRefreshInFlight = false;
      handleGeolocationError(error);
    },
    { enableHighAccuracy: true, maximumAge: 30000, timeout: 15000 },
  );
}

`;

function patchApp(js) {
  let next = js
    .replace(/styles\.css\?v=\d+/g, `styles.css?v=${VERSION}`)
    .replace(/app\.js\?v=\d+/g, `app.js?v=${VERSION}`);

  if (!next.includes("const PLAYER_POSITION_REFRESH_MS = 60000;")) {
    const variableMarker = "let geolocationWatchPuzzleId = null;";
    if (!next.includes(variableMarker)) throw new Error("GPS watch marker not found");
    next = next.replace(
      variableMarker,
      `${variableMarker}
const PLAYER_POSITION_REFRESH_MS = 60000;
let lastPlayerPositionRefreshAt = 0;
let playerPositionRefreshInFlight = false;`,
    );
  }

  const oldCanAttempt = `function canAttemptServerSave() {
  return canUseBackend() && (serverSyncEnabled || (isAdminRouteActive() && adminAuthenticated));
}`;
  const newCanAttempt = `function canAttemptServerSave() {
  return canUseBackend() && (
    serverSyncEnabled
    || shouldAllowPlayerServerSave()
    || (isAdminRouteActive() && adminAuthenticated)
  );
}`;
  if (!next.includes("shouldAllowPlayerServerSave()")) {
    if (!next.includes(oldCanAttempt)) throw new Error("canAttemptServerSave body not found");
    next = next.replace(oldCanAttempt, newCanAttempt);
  }

  if (!next.includes("function requestPlayerPositionRefresh(force = false)")) {
    const insertMarker = "function canAttemptServerSave() {";
    if (!next.includes(insertMarker)) throw new Error("position helper insert marker not found");
    next = next.replace(insertMarker, `${playerPositionHelpers}${insertMarker}`);
  }

  const oldRefreshSignature = `async function refreshPlayerRoutesFromServer() {
  if (!canAttemptServerSave()) return;
  if (playerRouteRefreshPromise) return playerRouteRefreshPromise;
  if (Date.now() - lastPlayerRouteRefreshAt < 5000) return;`;
  const newRefreshSignature = `async function refreshPlayerRoutesFromServer(options = {}) {
  if (!canUseBackend()) return;
  if (playerRouteRefreshPromise) return playerRouteRefreshPromise;
  if (!options.force && Date.now() - lastPlayerRouteRefreshAt < 5000) return;`;
  if (!next.includes("async function refreshPlayerRoutesFromServer(options = {})")) {
    if (!next.includes(oldRefreshSignature)) throw new Error("refreshPlayerRoutesFromServer signature not found");
    next = next.replace(oldRefreshSignature, newRefreshSignature);
  }

  const forbiddenBlockPattern = /    if \(response\.status === 403\) {\n      adminAuthenticated = false;\n      adminSessionChecked = true;\n      renderAdminAccess\(\);\n      showToast\("[^"]+"\);\n      return;\n    }/;
  const newForbiddenBlock = `    if (response.status === 403) {
      if (!isAdminRouteActive() && shouldAllowPlayerServerSave()) {
        await refreshPlayerRoutesFromServer({ force: true });
        serverSavePending = true;
        return;
      }
      adminAuthenticated = false;
      adminSessionChecked = true;
      renderAdminAccess();
      showToast("Connexion gestion requise pour modifier ces données.");
      return;
    }`;
  if (!next.includes("await refreshPlayerRoutesFromServer({ force: true });")) {
    if (!forbiddenBlockPattern.test(next)) throw new Error("403 save block not found");
    next = next.replace(forbiddenBlockPattern, newForbiddenBlock);
  }

  const oldTickerSnippet = `      checkGameStatus(team, route);
      renderPlayer();
    }
    if (isAdminRouteActive() && adminAuthenticated && Date.now() - lastLiveTeamRefreshAt > 5000) {`;
  const newTickerSnippet = `      checkGameStatus(team, route);
      renderPlayer();
      requestPlayerPositionRefresh();
    }
    if (isAdminRouteActive() && adminAuthenticated && Date.now() - lastLiveTeamRefreshAt > 5000) {`;
  if (!next.includes("requestPlayerPositionRefresh();")) {
    if (!next.includes(oldTickerSnippet)) throw new Error("ticker position refresh marker not found");
    next = next.replace(oldTickerSnippet, newTickerSnippet);
  }

  const oldGeoPosition = `  team.lastPosition = {
    lat: position.coords.latitude,
    lng: position.coords.longitude,
    accuracy: position.coords.accuracy,
    at: Date.now(),
  };
  touchTeam(team);`;
  const newGeoPosition = `  team.lastPosition = {
    lat: position.coords.latitude,
    lng: position.coords.longitude,
    accuracy: position.coords.accuracy,
    at: Date.now(),
  };
  lastPlayerPositionRefreshAt = team.lastPosition.at;
  touchTeam(team);`;
  if (!next.includes("lastPlayerPositionRefreshAt = team.lastPosition.at;")) {
    if (!next.includes(oldGeoPosition)) throw new Error("geolocation position marker not found");
    next = next.replace(oldGeoPosition, newGeoPosition);
  }

  next = next.replace(
    `    team.status = "won";
    team.finishedAt = Date.now();
    touchTeam(team);
    saveData();`,
    `    team.status = "won";
    team.finishedAt = Date.now();
    touchTeam(team);
    saveData({ immediate: true });`,
  );
  next = next.replace(
    `    team.status = "lost";
    team.finishedAt = Date.now();
    touchTeam(team);
    saveData();`,
    `    team.status = "lost";
    team.finishedAt = Date.now();
    touchTeam(team);
    saveData({ immediate: true });`,
  );
  next = next.replace(
    `    team.answers[puzzle.id] = input.value.trim();
    unlockNextPuzzle(team, route, puzzle.id);
    touchTeam(team);
    saveData();`,
    `    team.answers[puzzle.id] = input.value.trim();
    unlockNextPuzzle(team, route, puzzle.id);
    touchTeam(team);
    saveData({ immediate: true });`,
  );
  next = next.replace(
    /(  team\.answers\[puzzle\.id\] = "[^"]+";\n  unlockNextPuzzle\(team, route, puzzle\.id\);\n  touchTeam\(team\);\n)  saveData\(\);/,
    "$1  saveData({ immediate: true });",
  );
  next = next.replace(
    `  touchTeam(team);
  saveData();
  els.distanceNote.textContent = unlockMessage;`,
    `  touchTeam(team);
  saveData({ immediate: true });
  els.distanceNote.textContent = unlockMessage;`,
  );
  next = next.replace(
    `  saveData();
  renderPlayerMap(team, puzzle);`,
    `  saveData({ immediate: true });
  renderPlayerMap(team, puzzle);`,
  );
  next = next.replace(
    `  touchTeam(team);
  saveData();
  renderPlayer();
  showToast("Aventure lanc`,
    `  touchTeam(team);
  saveData({ immediate: true });
  renderPlayer();
  showToast("Aventure lanc`,
  );
  next = next.replace(
    `  showToast("Aventure lanc\\u00e9e.");
  locatePlayer();`,
    `  showToast("Aventure lanc\\u00e9e.");
  locatePlayer();
  requestPlayerPositionRefresh(true);`,
  );

  return next;
}

const serverMergeHelpers = `
function getTeamFreshness(team) {
  return Math.max(
    Number(team?.updatedAt) || 0,
    Number(team?.lastPosition?.at) || 0,
    Number(team?.briefingStartLocation?.at) || 0,
    Number(team?.finishedAt) || 0,
    Number(team?.startAt) || 0,
  );
}

function getTeamAnswerCount(team) {
  return Object.keys(team?.answers || {}).length;
}

function shouldAcceptPlayerTeamUpdate(previousTeam, nextTeam) {
  if (!nextTeam || typeof nextTeam !== "object") return false;
  if (!previousTeam) return true;
  const previousAnswers = getTeamAnswerCount(previousTeam);
  const nextAnswers = getTeamAnswerCount(nextTeam);
  if (nextAnswers > previousAnswers) return true;
  if (nextTeam.status === "won" && previousTeam.status !== "won") return true;
  if (nextTeam.status === "lost" && previousTeam.status === "playing") return true;
  if (nextAnswers === previousAnswers && getTeamFreshness(nextTeam) >= getTeamFreshness(previousTeam)) return true;
  return false;
}

function mergePlayerCodes(previousCodes, nextCodes) {
  const nextByCode = new Map((nextCodes || []).map((code) => [code.code, code]));
  return previousCodes.map((previousCode) => {
    const nextCode = nextByCode.get(previousCode.code);
    if (!nextCode) return previousCode;
    return {
      ...previousCode,
      status: nextCode.status,
      teamId: nextCode.teamId,
      teamDeletedAt: nextCode.teamDeletedAt || previousCode.teamDeletedAt,
    };
  });
}

function mergePlayerSafeUpdate(previousData, nextData) {
  if (!previousData) return nextData;
  const teamsById = new Map(previousData.teams.map((team) => [team.id, team]));
  nextData.teams.forEach((nextTeam) => {
    const previousTeam = teamsById.get(nextTeam.id);
    if (shouldAcceptPlayerTeamUpdate(previousTeam, nextTeam)) {
      teamsById.set(nextTeam.id, nextTeam);
    }
  });
  return {
    ...previousData,
    codes: mergePlayerCodes(previousData.codes, nextData.codes),
    teams: Array.from(teamsById.values()),
  };
}

`;

function patchServer(server) {
  let next = server;

  if (!next.includes("function mergePlayerSafeUpdate(previousData, nextData)")) {
    const helperMarker = `function isPlayerSafeUpdate(previousData, nextData) {
  if (!previousData) return true;
  return (
    previousData.activeRouteId === nextData.activeRouteId
    && stableJson(previousData.routes) === stableJson(nextData.routes)
    && codesKeepSameCatalog(previousData.codes, nextData.codes)
    && Array.isArray(nextData.teams)
  );
}
`;
    if (!next.includes(helperMarker)) throw new Error("server player-safe helper marker not found");
    next = next.replace(helperMarker, `${helperMarker}${serverMergeHelpers}`);
  }

  const oldWriteBlock = `        if (!isAdminRequest(request) && !isPlayerSafeUpdate(stored, payload)) {
          return { status: 403, payload: { message: "Acces gestion requis." } };
        }
        await writeStoredData(payload);`;
  const newWriteBlock = `        const isAdmin = isAdminRequest(request);
        if (!isAdmin && !isPlayerSafeUpdate(stored, payload)) {
          return { status: 403, payload: { message: "Acces gestion requis." } };
        }
        await writeStoredData(isAdmin ? payload : mergePlayerSafeUpdate(stored, payload));`;
  if (!next.includes("mergePlayerSafeUpdate(stored, payload)")) {
    if (!next.includes(oldWriteBlock)) throw new Error("server data write block not found");
    next = next.replace(oldWriteBlock, newWriteBlock);
  }

  return next;
}

function patchServiceWorker(worker) {
  return worker
    .replace(/escape-erezee-v\d+/g, `escape-erezee-v${VERSION}`)
    .replace(/"\.\/styles\.css(?:\?v=\d+)?"/g, `"./styles.css?v=${VERSION}"`)
    .replace(/"\.\/app\.js(?:\?v=\d+)?"/g, `"./app.js?v=${VERSION}"`);
}

await patchTextFile("index.html", bumpAssetVersions);
await patchTextFile("app.js", patchApp);
await patchTextFile("server.mjs", patchServer);
await patchTextFile("service-worker.js", patchServiceWorker);
console.log(`Live sync stability v${VERSION} applied.`);
