import { readFile, writeFile } from "node:fs/promises";

const appFile = new URL("./app.js", import.meta.url);
let code = await readFile(appFile, "utf8");
const original = code;

const replace = (search, value) => {
  if (code.includes(search)) code = code.replace(search, value);
};
const insertBefore = (search, value, guard) => {
  if (!code.includes(guard) && code.includes(search)) code = code.replace(search, `${value}\n${search}`);
};

replace(
  'const MAP_ZOOM = 16;\n',
  'const MAP_ZOOM = 16;\nconst MAP_MIN_ZOOM = 3;\nconst MAP_PADDING = 56;\n',
);
replace(
  'let serverSavePending = false;\n',
  'let serverSavePending = false;\nlet geolocationWatchId = null;\nlet geolocationWatchPuzzleId = null;\n',
);

insertBefore(
  'function renderTileMap(container, options) {',
  `function getFittingMapView(target, player, radius, width, height) {
  if (!player) return { center: target, zoom: MAP_ZOOM };
  const usableWidth = Math.max(120, width - MAP_PADDING * 2);
  const usableHeight = Math.max(120, height - MAP_PADDING * 2);

  for (let zoom = MAP_ZOOM; zoom >= MAP_MIN_ZOOM; zoom -= 1) {
    const targetWorld = latLngToWorld(target.lat, target.lng, zoom);
    const playerWorld = latLngToWorld(player.lat, player.lng, zoom);
    const radiusPixels = metersToPixels(radius, target.lat, zoom);
    const minX = Math.min(playerWorld.x, targetWorld.x - radiusPixels);
    const maxX = Math.max(playerWorld.x, targetWorld.x + radiusPixels);
    const minY = Math.min(playerWorld.y, targetWorld.y - radiusPixels);
    const maxY = Math.max(playerWorld.y, targetWorld.y + radiusPixels);

    if (maxX - minX <= usableWidth && maxY - minY <= usableHeight) {
      return {
        center: worldToLatLng((minX + maxX) / 2, (minY + maxY) / 2, zoom),
        zoom,
      };
    }
  }

  const targetWorld = latLngToWorld(target.lat, target.lng, MAP_MIN_ZOOM);
  const playerWorld = latLngToWorld(player.lat, player.lng, MAP_MIN_ZOOM);
  return {
    center: worldToLatLng((targetWorld.x + playerWorld.x) / 2, (targetWorld.y + playerWorld.y) / 2, MAP_MIN_ZOOM),
    zoom: MAP_MIN_ZOOM,
  };
}
`,
  'function getFittingMapView',
);

replace(
  `  const center = options.center || DEFAULT_CENTER;
  const target = options.target || center;
  const radius = Number(options.radius || 120);
  const player = options.player || null;
`,
  `  const target = options.target || options.center || DEFAULT_CENTER;
  const radius = Number(options.radius || 120);
  const player = options.player || null;
  const view = options.fitToPlayer
    ? getFittingMapView(target, player, radius, width, height)
    : { center: options.center || target, zoom: options.zoom || MAP_ZOOM };
  const center = view.center;
  const zoom = view.zoom;
`,
);
replace('    h: height,\n    center:', '    h: height,\n    zoom,\n    center:');
replace('  const centerWorld = latLngToWorld(center.lat, center.lng);\n', '  const centerWorld = latLngToWorld(center.lat, center.lng, zoom);\n');
replace('  const maxTile = 2 ** MAP_ZOOM;\n', '  const maxTile = 2 ** zoom;\n');
replace('https://tile.openstreetmap.org/${MAP_ZOOM}/${wrappedX}/${y}.png', 'https://tile.openstreetmap.org/${zoom}/${wrappedX}/${y}.png');
replace('    const world = latLngToWorld(point.lat, point.lng);\n', '    const world = latLngToWorld(point.lat, point.lng, zoom);\n');
replace('  const radiusPixels = metersToPixels(radius, target.lat);\n', '  const radiusPixels = metersToPixels(radius, target.lat, zoom);\n');
replace(
  `  renderTileMap(els.playerMap, {
    center: getMapCenter(target, playerPosition),
    target,
    radius: getPuzzleRadius(puzzle),
    player: playerPosition,
    editable: false,
  });
`,
  `  renderTileMap(els.playerMap, {
    target,
    radius: getPuzzleRadius(puzzle),
    player: playerPosition,
    fitToPlayer: true,
    editable: false,
  });
`,
);

insertBefore(
  'function locatePlayer() {',
  `function stopGeolocationWatch() {
  if (geolocationWatchId === null || !navigator.geolocation) return;
  navigator.geolocation.clearWatch(geolocationWatchId);
  geolocationWatchId = null;
  geolocationWatchPuzzleId = null;
}

function handleGeolocationPosition(position) {
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

  team.lastPosition = {
    lat: position.coords.latitude,
    lng: position.coords.longitude,
    accuracy: position.coords.accuracy,
    at: Date.now(),
  };

  if (!puzzle.requireLocation) {
    saveData();
    renderPlayerMap(team, puzzle);
    return;
  }

  geolocationWatchPuzzleId = puzzle.id;
  const distance = distanceInMeters(
    position.coords.latitude,
    position.coords.longitude,
    getPuzzleLat(puzzle),
    getPuzzleLng(puzzle),
  );
  const radius = getPuzzleRadius(puzzle);
  const accuracy = Number(position.coords.accuracy);
  const accuracyText = Number.isFinite(accuracy) ? \` Précision ±\${Math.round(accuracy)} m.\` : "";

  if (distance <= radius && !team.unlockedPuzzleIds.includes(puzzle.id)) {
    unlockPuzzle(team, puzzle, \`Vous êtes à \${Math.round(distance)} m du point.\${accuracyText}\`);
    return;
  }

  saveData();
  renderPlayerMap(team, puzzle);
  els.distanceNote.textContent =
    distance <= radius
      ? \`Vous êtes dans la zone.\${accuracyText}\`
      : \`Position mise à jour : encore \${Math.round(distance - radius)} m avant la zone.\${accuracyText}\`;
}

function handleGeolocationError() {
  els.distanceNote.textContent = "Position non disponible. Vérifiez l’autorisation GPS puis réessayez.";
}
`,
  'function handleGeolocationPosition',
);

code = code.replace(
  /function locatePlayer\(\) \{[\s\S]*?\n\}\n\nfunction distanceInMeters/,
  `function locatePlayer() {
  const team = getCurrentTeam();
  if (!team) return;
  const route = getRoute(team.routeId);
  const puzzle = getCurrentPuzzle(team, route);
  if (!puzzle.requireLocation) {
    els.distanceNote.textContent = "Cette énigme est déjà accessible.";
    return;
  }

  if (!navigator.geolocation) {
    els.distanceNote.textContent = "La géolocalisation n’est pas disponible sur cet appareil.";
    return;
  }

  if (geolocationWatchId !== null && geolocationWatchPuzzleId === puzzle.id) {
    els.distanceNote.textContent = "Suivi GPS déjà actif. La carte se met à jour automatiquement.";
    return;
  }

  stopGeolocationWatch();
  els.distanceNote.textContent = "Suivi GPS activé. La carte va se mettre à jour automatiquement.";
  geolocationWatchPuzzleId = puzzle.id;
  geolocationWatchId = navigator.geolocation.watchPosition(
    handleGeolocationPosition,
    handleGeolocationError,
    { enableHighAccuracy: true, maximumAge: 1000, timeout: 15000 },
  );
}

function distanceInMeters`,
);
replace('function resetSession() {\n  localStorage.removeItem(SESSION_KEY);', 'function resetSession() {\n  stopGeolocationWatch();\n  localStorage.removeItem(SESSION_KEY);');
replace(
  '  window.addEventListener("beforeunload", flushServerSave);\n',
  '  window.addEventListener("beforeunload", () => {\n    stopGeolocationWatch();\n    flushServerSave();\n  });\n',
);

if (code !== original) {
  await writeFile(appFile, code, "utf8");
  console.log("Render runtime patch applied.");
} else {
  console.log("Render runtime patch already present.");
}
