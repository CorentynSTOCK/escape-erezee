import { readFile, writeFile } from "node:fs/promises";

const VERSION = 184;

async function patchFile(filePath, patcher) {
  const input = await readFile(filePath, "utf8");
  const output = patcher(input);
  if (output !== input) await writeFile(filePath, output, "utf8");
}

function patchIndex(html) {
  let next = html;
  if (!next.includes('id="player-map-north"')) {
    next = next.replace(
      /(<div class="map-canvas player-map" id="player-map"[\s\S]*?<div class="map-attribution">[^<]*<\/div>)(\s*<\/div>\s*<div class="player-navigation-summary")/,
      '$1\n                  <div class="player-map-north" id="player-map-north" aria-hidden="true"><span>↑</span><b>N</b></div>$2',
    );
  }
  return next
    .replace(/styles\.css\?v=\d+/g, `styles.css?v=${VERSION}`)
    .replace(/app\.js\?v=\d+/g, `app.js?v=${VERSION}`);
}

function patchApp(app) {
  const marker = `/* player-performance-v${VERSION} */`;
  if (app.includes(marker)) return app;

  let next = app.replace(
    'function renderPlayer() {\n  const team = getCurrentTeam();\n  const route = team ? getRoute(team.routeId) : null;\n\n  renderShop();',
    'function renderPlayer() {\n  const team = getCurrentTeam();\n  const route = team ? getRoute(team.routeId) : null;\n\n  if (location.hash === "#shop") renderShop();',
  );

  next = next.replace(
    /function startTicker\(\) \{[\s\S]*?\n\}\n\nfunction render\(\) \{/,
    `function startTicker() {
  clearInterval(ticker);
  ticker = setInterval(() => {
    const now = Date.now();
    const team = getCurrentTeam();
    if (team) {
      const route = getRoute(team.routeId);
      const previousStatus = team.status;
      checkGameStatus(team, route);
      renderPlayerClockV184(team, route);
      const renderKey = getPlayerRenderKeyV184(team, route);
      const needsFullRender = location.hash === "#player" && (
        renderKey !== playerRenderKeyV184
        || previousStatus !== team.status
        || now - playerLastFullRenderAtV184 >= 5000
      );
      if (needsFullRender) {
        playerRenderKeyV184 = renderKey;
        playerLastFullRenderAtV184 = now;
        renderPlayer();
      }
      requestPlayerPositionRefresh();
    }
    if (isAdminRouteActive() && adminAuthenticated && now - lastLiveTeamRefreshAt > 5000) {
      refreshLiveTeamsFromServer();
    }
    if (isAdminRouteActive() && adminAuthenticated) renderTeamTable();
  }, 1000);
}

function render() {`,
  );

  next = next.replace(
    /async function handleGeolocationPosition\(position\) \{[\s\S]*?\n\}\n\nfunction handleGeolocationError/,
    `async function handleGeolocationPosition(position) {
  playerPendingPositionV184 = position;
  if (playerGpsHandlerRunningV184) return;
  playerGpsHandlerRunningV184 = true;
  try {
    while (playerPendingPositionV184) {
      const nextPosition = playerPendingPositionV184;
      playerPendingPositionV184 = null;
      await processPlayerGeolocationV184(nextPosition);
    }
  } finally {
    playerGpsHandlerRunningV184 = false;
  }
}

function handleGeolocationError`,
  );

  next = next.replace(
    /function handlePlayerOrientationV183\(event\) \{[\s\S]*?\n\}\n\nasync function enablePlayerCompassV183/,
    `function handlePlayerOrientationV183(event) {
  const webkitHeading = Number(event?.webkitCompassHeading);
  const alpha = Number(event?.alpha);
  const heading = Number.isFinite(webkitHeading)
    ? webkitHeading
    : Number.isFinite(alpha)
      ? normalizeGuidanceAngleV183(360 - alpha)
      : null;
  if (!Number.isFinite(heading)) return;
  playerCompassHeadingV183 = heading;
  if (!playerNavigationActiveV183) return;
  const now = Date.now();
  if (now - playerLastHeadingPaintAtV184 < 120) return;
  if (Number.isFinite(playerLastPaintedHeadingV184)) {
    const delta = Math.abs(normalizeGuidanceAngleV183(heading - playerLastPaintedHeadingV184 + 180) - 180);
    if (delta < 2 && now - playerLastHeadingPaintAtV184 < 500) return;
  }
  playerLastHeadingPaintAtV184 = now;
  playerLastPaintedHeadingV184 = heading;
  applyPlayerMapHeadingV184(heading);
}

async function enablePlayerCompassV183`,
  );

  next = next.replace(
    /async function requestPlayerWakeLockV183\(\) \{[\s\S]*?\n\}\n\nasync function releasePlayerWakeLockV183/,
    `async function requestPlayerWakeLockV183() {
  // Disabled in v184 to reduce heat and battery use during long games.
}

async function releasePlayerWakeLockV183`,
  );

  next = next.replace(
    '  playerNavigationActiveV183 = true;\n  panel.classList.add("is-navigation-mode");',
    '  playerNavigationActiveV183 = true;\n  if (Number.isFinite(playerCompassHeadingV183)) applyPlayerMapHeadingV184(playerCompassHeadingV183);\n  panel.classList.add("is-navigation-mode");',
  );
  next = next.replace(
    '  playerNavigationActiveV183 = false;\n  panel?.classList.remove("is-navigation-mode");',
    '  playerNavigationActiveV183 = false;\n  resetPlayerMapHeadingV184();\n  panel?.classList.remove("is-navigation-mode");',
  );

  const helpers = `${marker}
let playerLastFullRenderAtV184 = 0;
let playerRenderKeyV184 = "";
let playerPendingPositionV184 = null;
let playerGpsHandlerRunningV184 = false;
let playerLastRouteRefreshAtV184 = 0;
let playerLastGpsSyncAtV184 = 0;
let playerLastMapRenderAtV184 = 0;
let playerLastSyncedPositionV184 = null;
let playerLastRenderedPositionV184 = null;
let playerLastHeadingPaintAtV184 = 0;
let playerLastPaintedHeadingV184 = null;

function getPlayerRenderKeyV184(team, route) {
  if (!team || !route) return "none";
  const progress = getTeamProgress(team, route);
  const puzzle = getCurrentPuzzle(team, route);
  const language = typeof playerMapLanguageV182 === "function" ? playerMapLanguageV182() : "fr";
  return [team.id, team.status, progress.solved, team.unlockedPuzzleIds?.length || 0, puzzle?.id || "", language].join("|");
}

function renderPlayerClockV184(team, route) {
  if (!team || !route) return;
  const isBriefing = team.status === "briefing";
  if (els.countdown) {
    els.countdown.textContent = isBriefing ? playerLabelV151("ready") : formatClock(remainingSeconds(team, route));
  }
  if (els.elapsedTime) {
    els.elapsedTime.textContent = Math.floor(elapsedSeconds(team) / 60) + " min";
  }
}

function positionDistanceV184(first, second) {
  if (!isUsablePosition(first) || !isUsablePosition(second)) return Infinity;
  return distanceInMeters(first.lat, first.lng, second.lat, second.lng);
}

async function processPlayerGeolocationV184(position) {
  const receivedAt = Date.now();
  const movementHeading = Number(position?.coords?.heading);
  if (Number.isFinite(movementHeading) && movementHeading >= 0) {
    playerMovementHeadingV183 = movementHeading;
  }

  if (receivedAt - playerLastRouteRefreshAtV184 >= 30000) {
    playerLastRouteRefreshAtV184 = receivedAt;
    await refreshPlayerRoutesFromServer();
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
  const shouldSync = receivedAt - playerLastGpsSyncAtV184 >= 25000
    || (movedSinceSync >= 10 && receivedAt - playerLastGpsSyncAtV184 >= 8000);
  if (shouldSync) {
    playerLastGpsSyncAtV184 = receivedAt;
    playerLastSyncedPositionV184 = currentPosition;
    saveData({ immediate: true });
  }

  const movedSinceRender = positionDistanceV184(playerLastRenderedPositionV184, currentPosition);
  const shouldRender = document.visibilityState === "visible" && (
    receivedAt - playerLastMapRenderAtV184 >= 5000
    || (movedSinceRender >= 3 && receivedAt - playerLastMapRenderAtV184 >= 1000)
  );
  if (shouldRender) {
    playerLastMapRenderAtV184 = receivedAt;
    playerLastRenderedPositionV184 = currentPosition;
    renderPlayerMap(team, puzzle);
    els.distanceNote.textContent = distance <= radius
      ? "Vous etes dans la zone." + accuracyText
      : "Position mise a jour : encore " + Math.round(distance - radius) + " m avant la zone." + accuracyText;
  }
}

function applyPlayerMapHeadingV184(heading) {
  const map = document.querySelector("#player-map");
  if (!map || !Number.isFinite(Number(heading))) return;
  const normalized = normalizeGuidanceAngleV183(heading);
  map.classList.add("is-heading-up");
  map.style.setProperty("--player-map-rotation", (-normalized) + "deg");
  map.style.setProperty("--player-map-counter-rotation", normalized + "deg");
  if (playerGuidanceContextV183) {
    const [, , target, playerPosition] = playerGuidanceContextV183;
    if (isUsablePosition(target) && isUsablePosition(playerPosition)) {
      const bearing = playerMapBearingV182(playerPosition, target);
      document.querySelector("#player-navigation-arrow")?.style.setProperty(
        "--player-guidance-rotation",
        normalizeGuidanceAngleV183(bearing - normalized) + "deg",
      );
    }
  }
}

function resetPlayerMapHeadingV184() {
  const map = document.querySelector("#player-map");
  if (!map) return;
  map.classList.remove("is-heading-up");
  map.style.removeProperty("--player-map-rotation");
  map.style.removeProperty("--player-map-counter-rotation");
  playerLastPaintedHeadingV184 = null;
}
`;

  next = next.replace("\nfunction renderPuzzleMedia(puzzle, unlocked) {", `\n${helpers}\nfunction renderPuzzleMedia(puzzle, unlocked) {`);
  return next;
}

function patchStyles(css) {
  const marker = `/* player-performance-v${VERSION} */`;
  if (css.includes(marker)) return css;
  return `${css.trimEnd()}

${marker}
#player-map .map-tiles,
#player-map .map-layer {
  transform-origin: 50% 50%;
}

#player-map.is-heading-up .map-tiles,
#player-map.is-heading-up .map-layer {
  transform: rotate(var(--player-map-rotation, 0deg));
  transition: transform 140ms linear;
  will-change: transform;
}

#player-map.is-heading-up .map-marker {
  transform: translate(-50%, -50%) rotate(var(--player-map-counter-rotation, 0deg));
}

.player-map-north {
  position: absolute;
  top: 58px;
  left: 10px;
  z-index: 7;
  display: none;
  width: 38px;
  height: 38px;
  place-items: center;
  border: 2px solid rgba(255, 255, 255, 0.94);
  border-radius: 50%;
  background: rgba(19, 42, 36, 0.9);
  color: #fff;
  box-shadow: 0 5px 14px rgba(11, 45, 38, 0.24);
  font-size: 0.64rem;
  font-weight: 900;
  line-height: 1;
  transform: rotate(var(--player-map-rotation, 0deg));
  transition: transform 140ms linear;
}

.player-map-north span {
  position: absolute;
  top: 3px;
  font-size: 0.8rem;
}

.player-map-north b {
  margin-top: 9px;
}

#player-map.is-heading-up .player-map-north {
  display: grid;
}

.marker-player {
  animation: none;
}

@media (prefers-reduced-motion: reduce) {
  #player-map.is-heading-up .map-tiles,
  #player-map.is-heading-up .map-layer,
  .player-map-north {
    transition: none;
  }
}
`;
}

await patchFile("index.html", patchIndex);
await patchFile("app.js", patchApp);
await patchFile("styles.css", patchStyles);
await patchFile("service-worker.js", (worker) => worker.replace(/escape-erezee-v\d+/g, `escape-erezee-v${VERSION}`));

console.log(`Player performance v${VERSION} applied.`);
