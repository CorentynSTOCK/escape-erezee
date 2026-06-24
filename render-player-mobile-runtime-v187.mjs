import { readFile, writeFile } from "node:fs/promises";

const VERSION = 187;
const scriptBaseUrl = new URL("./", import.meta.url);

async function patchFile(filePath, patcher) {
  const fileUrl = new URL(filePath, scriptBaseUrl);
  const input = await readFile(fileUrl, "utf8");
  const output = patcher(input);
  if (output !== input) await writeFile(fileUrl, output, "utf8");
}

function findFunctionEnd(input, start) {
  const parametersEnd = input.indexOf(")", start);
  const bodyStart = input.indexOf("{", parametersEnd >= 0 ? parametersEnd : start);
  if (bodyStart < 0) return -1;
  let depth = 0;
  let quote = null;
  let escaped = false;
  for (let index = bodyStart; index < input.length; index += 1) {
    const char = input[index];
    if (quote) {
      if (escaped) escaped = false;
      else if (char === "\\") escaped = true;
      else if (char === quote) quote = null;
      continue;
    }
    if (char === '"' || char === "'" || char === "`") {
      quote = char;
      continue;
    }
    if (char === "{") depth += 1;
    if (char === "}") {
      depth -= 1;
      if (depth === 0) return index + 1;
    }
  }
  return -1;
}

function replaceFunction(input, signature, replacement) {
  const start = input.indexOf(signature);
  if (start < 0) throw new Error(`Patch v${VERSION} introuvable: ${signature}`);
  const end = findFunctionEnd(input, start);
  if (end < 0) throw new Error(`Patch v${VERSION} impossible: ${signature}`);
  return input.slice(0, start) + replacement + input.slice(end);
}

function patchIndex(html) {
  return html
    .replace(/styles\.css\?v=\d+/g, `styles.css?v=${VERSION}`)
    .replace(/app\.js\?v=\d+/g, `app.js?v=${VERSION}`);
}

const CLIENT_HELPERS = `/* player-mobile-runtime-v187 */
const PLAYER_TEAM_SYNC_URL_V187 = "/api/player/team-sync";
const PLAYER_SESSION_STATE_KEY_V187 = "escape-erezee-player-session-v187";
let playerLastGuidancePaintAtV187 = 0;
let playerTrackingPausedByVisibilityV187 = false;

function playerSessionTeamV187() {
  const teamId = localStorage.getItem(SESSION_KEY);
  return teamId ? data?.teams?.find((team) => team.id === teamId) || null : null;
}

function playerTeamPayloadV187(team) {
  if (!team) return null;
  return {
    id: team.id,
    code: team.code,
    name: team.name,
    routeId: team.routeId,
    startAt: team.startAt,
    finishedAt: team.finishedAt,
    timeExpiredAt: team.timeExpiredAt,
    status: team.status,
    updatedAt: team.updatedAt,
    answers: team.answers || {},
    unlockedPuzzleIds: team.unlockedPuzzleIds || [],
    attempts: team.attempts || {},
    hints: team.hints || {},
    photoNames: team.photoNames || {},
    lastPosition: team.lastPosition || null,
  };
}

function persistCompactPlayerSessionV187(team) {
  if (!team) return;
  try {
    localStorage.setItem(PLAYER_SESSION_STATE_KEY_V187, JSON.stringify(playerTeamPayloadV187(team)));
  } catch (error) {
    console.warn("Sauvegarde locale legere indisponible.", error);
  }
}

function restoreCompactPlayerSessionV187(baseData) {
  if (!baseData || !Array.isArray(baseData.teams)) return baseData;
  try {
    const sessionTeamId = localStorage.getItem(SESSION_KEY);
    const raw = localStorage.getItem(PLAYER_SESSION_STATE_KEY_V187);
    if (!sessionTeamId || !raw) return baseData;
    const team = JSON.parse(raw);
    if (!team || team.id !== sessionTeamId || !team.code || !team.routeId) return baseData;
    const index = baseData.teams.findIndex((item) => item.id === team.id);
    if (index >= 0) baseData.teams[index] = team;
    else baseData.teams.push(team);
  } catch (error) {
    console.warn("Restauration locale legere impossible.", error);
  }
  return baseData;
}

function mergeSyncedPlayerTeamV187(serverTeam) {
  if (!serverTeam?.id || !Array.isArray(data?.teams)) return;
  const index = data.teams.findIndex((team) => team.id === serverTeam.id);
  if (index >= 0) data.teams[index] = serverTeam;
  else data.teams.push(serverTeam);
  persistCompactPlayerSessionV187(serverTeam);
}

function pausePlayerTrackingV187() {
  if (geolocationWatchId === null || !navigator.geolocation) return;
  navigator.geolocation.clearWatch(geolocationWatchId);
  geolocationWatchId = null;
  geolocationWatchPuzzleId = null;
  playerTrackingPausedByVisibilityV187 = true;
  const team = playerSessionTeamV187();
  if (team) saveData({ immediate: true });
}

function resumePlayerTrackingV187() {
  if (!playerTrackingPausedByVisibilityV187 || document.visibilityState !== "visible") return;
  playerTrackingPausedByVisibilityV187 = false;
  const team = playerSessionTeamV187();
  const route = team ? getRoute(team.routeId) : null;
  const puzzle = route ? getCurrentPuzzle(team, route) : null;
  if (!team || team.status !== "playing" || !puzzle?.requireLocation || !navigator.geolocation) return;
  geolocationWatchPuzzleId = puzzle.id;
  geolocationWatchId = navigator.geolocation.watchPosition(
    handleGeolocationPosition,
    handleGeolocationError,
    { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 },
  );
  requestPlayerPositionRefresh(true);
}

document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "hidden") pausePlayerTrackingV187();
  else resumePlayerTrackingV187();
});

window.addEventListener("pagehide", () => {
  const team = playerSessionTeamV187();
  if (team) persistCompactPlayerSessionV187(team);
});
`;

function patchApp(app) {
  const marker = `/* player-mobile-runtime-v${VERSION} */`;
  if (app.includes(marker)) return app;

  let next = app;
  next = next.replace("\nlet data = loadData();", `\n${CLIENT_HELPERS}\nlet data = loadData();`);

  next = replaceFunction(next, "function loadData()", `function loadData() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return restoreCompactPlayerSessionV187(JSON.parse(stored));
    }
  } catch {
    clearStoredData();
  }
  const seed = createSeedData();
  if (location.hash !== "#player") writeStoredData(seed);
  return restoreCompactPlayerSessionV187(seed);
}`);

  next = replaceFunction(next, "function saveData(options = {})", `function saveData(options = {}) {
  const playerTeam = playerSessionTeamV187();
  const lightweightPlayerMode = !isAdminRouteActive() && location.hash === "#player";
  if (lightweightPlayerMode) {
    if (playerTeam) persistCompactPlayerSessionV187(playerTeam);
  } else {
    writeStoredData(data);
  }
  if (options.sync !== false) {
    scheduleServerSave(Boolean(options.immediate));
  }
}`);

  next = replaceFunction(next, "async function persistDataToServer()", `async function persistDataToServer() {
  if (!canAttemptServerSave()) return;
  if (serverSaveInFlight) {
    serverSavePending = true;
    return;
  }

  serverSaveInFlight = true;
  try {
    const isPlayerWrite = !isAdminRouteActive() && shouldAllowPlayerServerSave();
    if (isPlayerWrite) {
      const team = playerSessionTeamV187();
      if (!team) return;
      const response = await fetch(PLAYER_TEAM_SYNC_URL_V187, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ team: playerTeamPayloadV187(team) }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload.message || "Synchronisation joueur refusee.");
      }
      if (payload.team) mergeSyncedPlayerTeamV187(payload.team);
      const localCode = data.codes?.find((code) => code.code === team.code);
      if (localCode && payload.team?.id) {
        localCode.status = "used";
        localCode.teamId = payload.team.id;
      }
      serverSyncEnabled = true;
      return;
    }

    const headers = { "Content-Type": "application/json" };
    if (isAdminRouteActive() && adminAuthenticated) {
      headers["X-Escape-Admin-Write"] = "1";
    }
    const response = await fetch(API_DATA_URL, {
      method: "PUT",
      headers,
      credentials: "same-origin",
      body: JSON.stringify(data),
    });
    if (response.status === 403) {
      adminAuthenticated = false;
      adminSessionChecked = true;
      renderAdminAccess();
      showToast("Connexion gestion requise pour modifier ces donnees.");
      return;
    }
    if (!response.ok) throw new Error("Sauvegarde backend refusee.");
    serverSyncEnabled = true;
  } catch (error) {
    console.warn(error);
    serverSyncEnabled = false;
    showToast("Synchronisation serveur interrompue. Votre progression reste conservee sur ce telephone.");
  } finally {
    serverSaveInFlight = false;
    if (serverSavePending) {
      serverSavePending = false;
      scheduleServerSave(true);
    }
  }
}`);

  next = replaceFunction(next, "async function processPlayerGeolocationV184(position)", `async function processPlayerGeolocationV184(position) {
  if (document.visibilityState === "hidden") return;
  const receivedAt = Date.now();
  const movementHeading = Number(position?.coords?.heading);
  if (Number.isFinite(movementHeading) && movementHeading >= 0) {
    playerMovementHeadingV183 = movementHeading;
  }

  const team = getCurrentTeam();
  if (!team || team.status !== "playing") {
    stopGeolocationWatch();
    return;
  }
  const route = getRoute(team.routeId);
  const puzzle = getCurrentPuzzle(team, route);
  if (!route || !puzzle) {
    stopGeolocationWatch();
    return;
  }

  const currentPosition = {
    lat: position.coords.latitude,
    lng: position.coords.longitude,
    accuracy: position.coords.accuracy,
    at: receivedAt,
  };
  team.lastPosition = currentPosition;
  lastPlayerPositionRefreshAt = receivedAt;
  touchTeam(team);
  geolocationWatchPuzzleId = puzzle.id;

  const target = { lat: getPuzzleLat(puzzle), lng: getPuzzleLng(puzzle) };
  const distance = distanceInMeters(currentPosition.lat, currentPosition.lng, target.lat, target.lng);
  const radius = getPuzzleRadius(puzzle);
  const accuracy = Number(currentPosition.accuracy);
  const accuracyText = Number.isFinite(accuracy) ? " Precision +/-" + Math.round(accuracy) + " m." : "";

  if (puzzle.requireLocation && distance <= radius && !team.unlockedPuzzleIds.includes(puzzle.id)) {
    unlockPuzzle(team, puzzle, "Vous etes a " + Math.round(distance) + " m du point." + accuracyText);
    playerLastGpsSyncAtV184 = receivedAt;
    playerLastSyncedPositionV184 = currentPosition;
    return;
  }

  const movedSinceSync = positionDistanceV184(playerLastSyncedPositionV184, currentPosition);
  const shouldSync = receivedAt - playerLastGpsSyncAtV184 >= 30000
    || (movedSinceSync >= 15 && receivedAt - playerLastGpsSyncAtV184 >= 12000);
  if (shouldSync) {
    playerLastGpsSyncAtV184 = receivedAt;
    playerLastSyncedPositionV184 = currentPosition;
    saveData({ immediate: true });
  }

  if (receivedAt - playerLastGuidancePaintAtV187 >= 1000) {
    playerLastGuidancePaintAtV187 = receivedAt;
    updatePlayerMapGuidanceV183(team, puzzle, target, currentPosition);
  }

  const movedSinceRender = positionDistanceV184(playerLastRenderedPositionV184, currentPosition);
  const shouldRender = receivedAt - playerLastMapRenderAtV184 >= 8000
    || (movedSinceRender >= 12 && receivedAt - playerLastMapRenderAtV184 >= 3500);
  if (shouldRender) {
    playerLastMapRenderAtV184 = receivedAt;
    playerLastRenderedPositionV184 = currentPosition;
    renderPlayerMap(team, puzzle);
    els.distanceNote.textContent = distance <= radius
      ? "Vous etes dans la zone." + accuracyText
      : "Position mise a jour : encore " + Math.round(Math.max(0, distance - radius)) + " m avant la zone." + accuracyText;
  }
}`);

  next = replaceFunction(next, "function handlePlayerOrientationV183(event)", `function handlePlayerOrientationV183(event) {
  if (document.visibilityState === "hidden") return;
  const webkitHeading = Number(event?.webkitCompassHeading);
  const alpha = Number(event?.alpha);
  const heading = Number.isFinite(webkitHeading)
    ? webkitHeading
    : Number.isFinite(alpha)
      ? normalizeGuidanceAngleV183(360 - alpha)
      : null;
  if (!Number.isFinite(heading)) return;
  playerCompassHeadingV183 = heading;
  playerCompassPermissionStateV185 = "granted";
  const now = Date.now();
  const paintInterval = playerNavigationActiveV183 ? 250 : 600;
  if (now - playerLastHeadingPaintAtV184 < paintInterval) return;
  if (Number.isFinite(playerLastPaintedHeadingV184)) {
    const delta = Math.abs(normalizeGuidanceAngleV183(heading - playerLastPaintedHeadingV184 + 180) - 180);
    if (delta < 4 && now - playerLastHeadingPaintAtV184 < 1200) return;
  }
  playerLastHeadingPaintAtV184 = now;
  playerLastPaintedHeadingV184 = heading;
  updatePlayerGuidanceArrowHeadingV185(heading);
  if (playerNavigationActiveV183) applyPlayerMapHeadingV184(heading);
}`);

  next = next.replace(
    '        || now - playerLastFullRenderAtV184 >= 5000',
    '        || now - playerLastFullRenderAtV184 >= 30000',
  );
  next = next.replace(
    "      requestPlayerPositionRefresh();",
    "      if (geolocationWatchId === null || now - lastPlayerPositionRefreshAt >= 90000) requestPlayerPositionRefresh();",
  );
  next = next.replace(
    'puzzle?.id || "", language].join("|");',
    'puzzle?.id || "", team.timeExpiredAt ? "overtime" : "timed", language].join("|");',
  );
  next = next.replace(
    "    code.teamId = team.id;\n    saveData();",
    "    code.teamId = team.id;\n    localStorage.setItem(SESSION_KEY, team.id);\n    saveData();",
  );
  next = next.replace(
    "  localStorage.removeItem(SESSION_KEY);\n  renderPlayer();",
    "  localStorage.removeItem(SESSION_KEY);\n  localStorage.removeItem(PLAYER_SESSION_STATE_KEY_V187);\n  renderPlayer();",
  );
  next = next.replace(
    `  function applyUx() {
    enhanceShopCards();
    enhancePlayer();
    enhanceAdmin();
  }`,
    `  function applyUx() {
    if (location.hash === "#player") {
      enhancePlayer();
      return;
    }
    if (location.hash === "#admin") {
      enhanceAdmin();
      return;
    }
    enhanceShopCards();
  }`,
  );
  next = next.replace(
    "  function applyTeamPriceLabels() {\n    document.querySelectorAll(\".shop-route-card\")",
    "  function applyTeamPriceLabels() {\n    if (location.hash === \"#player\") return;\n    document.querySelectorAll(\".shop-route-card\")",
  );

  return next;
}

const SERVER_HELPERS = `/* player-mobile-runtime-v187 */
const PLAYER_TEAM_SYNC_MAX_BODY_V187 = 256 * 1024;
const PLAYER_TEAM_BACKUP_INTERVAL_V187 = 15 * 60 * 1000;
let lastPlayerTeamBackupAtV187 = 0;

function finiteTimestampV187(value) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? Math.round(number) : null;
}

function safePlayerTextV187(value, maxLength = 500) {
  return String(value == null ? "" : value).trim().slice(0, maxLength);
}

function mergePuzzleTextMapV187(previous, incoming, allowedIds, maxLength = 500) {
  const result = { ...(previous && typeof previous === "object" ? previous : {}) };
  if (!incoming || typeof incoming !== "object") return result;
  allowedIds.forEach((id) => {
    if (!Object.prototype.hasOwnProperty.call(incoming, id)) return;
    const value = safePlayerTextV187(incoming[id], maxLength);
    if (value) result[id] = value;
  });
  return result;
}

function mergePuzzleNumberMapV187(previous, incoming, allowedIds) {
  const result = { ...(previous && typeof previous === "object" ? previous : {}) };
  if (!incoming || typeof incoming !== "object") return result;
  allowedIds.forEach((id) => {
    const value = Math.max(0, Math.min(10000, Math.floor(Number(incoming[id]) || 0)));
    result[id] = Math.max(Math.floor(Number(result[id]) || 0), value);
  });
  return result;
}

function mergePlayerPositionV187(previous, incoming) {
  if (!incoming || typeof incoming !== "object") return previous || null;
  const lat = Number(incoming.lat);
  const lng = Number(incoming.lng);
  const accuracy = Number(incoming.accuracy);
  const at = finiteTimestampV187(incoming.at);
  if (!Number.isFinite(lat) || lat < -90 || lat > 90) return previous || null;
  if (!Number.isFinite(lng) || lng < -180 || lng > 180) return previous || null;
  if (!at || at > Date.now() + 5 * 60 * 1000) return previous || null;
  if (finiteTimestampV187(previous?.at) && Number(previous.at) > at) return previous;
  return {
    lat,
    lng,
    accuracy: Number.isFinite(accuracy) ? Math.max(0, Math.min(100000, accuracy)) : null,
    at,
  };
}

function mergePlayerTeamV187(previous, incoming, route, code) {
  const puzzleIds = new Set((route?.puzzles || []).map((puzzle) => puzzle?.id).filter(Boolean));
  const base = previous || {
    id: safePlayerTextV187(incoming.id, 120),
    name: "Equipe",
    routeId: code.routeId,
    code: code.code,
    startAt: null,
    finishedAt: null,
    status: "briefing",
    updatedAt: Date.now(),
    answers: {},
    unlockedPuzzleIds: [],
    attempts: {},
    hints: {},
    photoNames: {},
  };
  const answers = mergePuzzleTextMapV187(base.answers, incoming.answers, puzzleIds, 1000);
  const unlockedPuzzleIds = Array.from(new Set([
    ...(Array.isArray(base.unlockedPuzzleIds) ? base.unlockedPuzzleIds : []),
    ...(Array.isArray(incoming.unlockedPuzzleIds) ? incoming.unlockedPuzzleIds : []),
  ])).filter((id) => puzzleIds.has(id));
  const allSolved = puzzleIds.size > 0 && Array.from(puzzleIds).every((id) => Boolean(answers[id]));
  let status = ["briefing", "playing", "won", "lost"].includes(base.status) ? base.status : "briefing";
  if (!["won", "lost"].includes(status)) {
    if (incoming.status === "playing" || incoming.status === "won") status = "playing";
    if (incoming.status === "won" && allSolved) status = "won";
  }
  const startAt = finiteTimestampV187(base.startAt) || finiteTimestampV187(incoming.startAt);
  const finishedAt = ["won", "lost"].includes(status)
    ? finiteTimestampV187(base.finishedAt) || finiteTimestampV187(incoming.finishedAt) || Date.now()
    : null;
  return {
    ...base,
    id: base.id,
    name: safePlayerTextV187(incoming.name || base.name || "Equipe", 100),
    routeId: code.routeId,
    code: code.code,
    startAt,
    finishedAt,
    timeExpiredAt: finiteTimestampV187(base.timeExpiredAt) || finiteTimestampV187(incoming.timeExpiredAt),
    status,
    updatedAt: Date.now(),
    answers,
    unlockedPuzzleIds,
    attempts: mergePuzzleNumberMapV187(base.attempts, incoming.attempts, puzzleIds),
    hints: mergePuzzleNumberMapV187(base.hints, incoming.hints, puzzleIds),
    photoNames: mergePuzzleTextMapV187(base.photoNames, incoming.photoNames, puzzleIds, 240),
    lastPosition: mergePlayerPositionV187(base.lastPosition, incoming.lastPosition),
  };
}

async function writePlayerTeamDataV187(payload) {
  await mkdir(DATA_DIR, { recursive: true });
  const now = Date.now();
  if (now - lastPlayerTeamBackupAtV187 >= PLAYER_TEAM_BACKUP_INTERVAL_V187) {
    if (typeof backupStoredDataIfPresent === "function") {
      await backupStoredDataIfPresent(payload);
    }
    lastPlayerTeamBackupAtV187 = now;
  }
  const tempFile = DATA_FILE + ".player.tmp";
  await writeFile(tempFile, JSON.stringify(payload, null, 2) + "\\n", "utf8");
  await rename(tempFile, DATA_FILE);
}

async function handlePlayerTeamSyncV187(request, response) {
  if (request.method !== "POST") {
    sendJson(response, 405, { message: "Methode non autorisee." });
    return true;
  }
  try {
    const body = await readRequestBody(request);
    if (Buffer.byteLength(body, "utf8") > PLAYER_TEAM_SYNC_MAX_BODY_V187) {
      sendJson(response, 413, { message: "Synchronisation joueur trop volumineuse." });
      return true;
    }
    const payload = body ? JSON.parse(body) : {};
    const incoming = payload?.team;
    if (!incoming || typeof incoming !== "object") {
      sendJson(response, 400, { message: "Equipe invalide." });
      return true;
    }
    const result = await withDataMutation(async () => {
      const stored = await readStoredData();
      if (!stored) return { status: 404, payload: { message: "Donnees serveur absentes." } };
      const codeValue = safePlayerTextV187(incoming.code, 120);
      const code = stored.codes.find((item) => item?.code === codeValue);
      if (!code || code.teamDeletedAt) {
        return { status: 403, payload: { message: "Code joueur invalide." } };
      }
      const route = stored.routes.find((item) => item?.id === code.routeId);
      if (!route) return { status: 409, payload: { message: "Parcours indisponible." } };
      const requestedId = safePlayerTextV187(incoming.id, 120);
      let team = stored.teams.find((item) => item?.id === code.teamId)
        || stored.teams.find((item) => item?.code === code.code)
        || null;
      if (team && requestedId && team.id !== requestedId) {
        return { status: 409, payload: { message: "Cette equipe est deja liee a un autre appareil." } };
      }
      if (!team && (!requestedId || code.teamId)) {
        return { status: 409, payload: { message: "Session joueur incoherente." } };
      }
      team = mergePlayerTeamV187(team, { ...incoming, id: requestedId }, route, code);
      const teamIndex = stored.teams.findIndex((item) => item.id === team.id);
      if (teamIndex >= 0) stored.teams[teamIndex] = team;
      else stored.teams.push(team);
      code.status = "used";
      code.teamId = team.id;
      await writePlayerTeamDataV187(stored);
      return { status: 200, payload: { ok: true, savedAt: Date.now(), team } };
    });
    sendJson(response, result.status, result.payload);
  } catch (error) {
    sendJson(response, 400, { message: error.message || "Synchronisation joueur impossible." });
  }
  return true;
}
`;

function patchServer(server) {
  const marker = `/* player-mobile-runtime-v${VERSION} */`;
  if (server.includes(marker)) return server;
  let next = server;
  const handleApiIndex = next.indexOf("async function handleApi");
  if (handleApiIndex < 0) throw new Error(`Patch v${VERSION} introuvable: handleApi`);
  next = next.slice(0, handleApiIndex) + SERVER_HELPERS + "\n\n" + next.slice(handleApiIndex);
  const routeAnchor = '  if (pathname !== "/api/data") return false;';
  if (!next.includes(routeAnchor)) throw new Error(`Patch v${VERSION} introuvable: route api data`);
  next = next.replace(
    routeAnchor,
    `  if (pathname === "/api/player/team-sync") {
    return handlePlayerTeamSyncV187(request, response);
  }

${routeAnchor}`,
  );
  return next;
}

function patchStyles(css) {
  const marker = `/* player-mobile-runtime-v${VERSION} */`;
  if (css.includes(marker)) return css;
  return `${css.trimEnd()}

${marker}
#player-map.is-heading-up .map-tiles,
#player-map.is-heading-up .map-layer,
.player-map-north {
  transition-duration: 260ms;
}

#player-map {
  contain: layout paint;
}
`;
}

await patchFile("index.html", patchIndex);
await patchFile("app.js", patchApp);
await patchFile("server.mjs", patchServer);
await patchFile("styles.css", patchStyles);
await patchFile("service-worker.js", (worker) => worker.replace(/escape-erezee-v\d+/g, `escape-erezee-v${VERSION}`));

console.log(`Player mobile runtime v${VERSION} applied.`);
