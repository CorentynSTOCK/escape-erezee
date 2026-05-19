import { readFile, writeFile } from "node:fs/promises";

const APP_FILE = new URL("./app.js", import.meta.url);

let code = await readFile(APP_FILE, "utf8");
let changed = false;

function replaceOnce(search, replacement) {
  if (!code.includes(search)) return false;
  code = code.replace(search, replacement);
  changed = true;
  return true;
}

function replaceIfMissing(guard, search, replacement) {
  if (code.includes(guard)) return false;
  return replaceOnce(search, replacement);
}

function insertBeforeIfMissing(guard, search, insertion) {
  if (code.includes(guard) || !code.includes(search)) return false;
  code = code.replace(search, `${insertion}\n${search}`);
  changed = true;
  return true;
}

function replaceRegexIfMissing(guard, pattern, replacement) {
  if (code.includes(guard)) return false;
  const nextCode = code.replace(pattern, replacement);
  if (nextCode === code) return false;
  code = nextCode;
  changed = true;
  return true;
}

replaceIfMissing(
  "const ADMIN_SESSION_URL",
  'const API_DATA_URL = "/api/data";\n',
  'const API_DATA_URL = "/api/data";\nconst ADMIN_SESSION_URL = "/api/admin/session";\nconst ADMIN_LOGIN_URL = "/api/admin/login";\nconst ADMIN_LOGOUT_URL = "/api/admin/logout";\n',
);

replaceIfMissing(
  "adminLoginPanel:",
  '  playerMap: $("#player-map"),\n',
  `  playerMap: $("#player-map"),
  adminLoginPanel: $("#admin-login-panel"),
  adminContent: $("#admin-content"),
  adminLoginForm: $("#admin-login-form"),
  adminPasswordInput: $("#admin-password"),
  adminLoginMessage: $("#admin-login-message"),
  adminLogoutButton: $("#admin-logout-button"),
`,
);

replaceIfMissing(
  "let adminAuthenticated",
  "let serverSyncNoticeShown = false;\n",
  "let serverSyncNoticeShown = false;\nlet adminAuthenticated = !canUseBackend();\nlet adminSessionChecked = false;\nlet adminSessionCheckPromise = null;\n",
);

replaceIfMissing(
  "const MAP_MIN_ZOOM",
  "const MAP_ZOOM = 16;\n",
  "const MAP_ZOOM = 16;\nconst MAP_MIN_ZOOM = 3;\nconst MAP_PADDING = 56;\n",
);

replaceIfMissing(
  "geolocationWatchId",
  "let serverSavePending = false;\n",
  "let serverSavePending = false;\nlet geolocationWatchId = null;\nlet geolocationWatchPuzzleId = null;\n",
);

replaceOnce(
  `    const response = await fetch(API_DATA_URL, {
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
`,
  `    const response = await fetch(API_DATA_URL, {
      headers: { Accept: "application/json" },
      cache: "no-store",
      credentials: "same-origin",
    });
`,
);

replaceOnce(
  `    const response = await fetch(API_DATA_URL, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error("Sauvegarde backend refusée.");
    }
`,
  `    const response = await fetch(API_DATA_URL, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify(data),
    });
    if (response.status === 403) {
      adminAuthenticated = false;
      adminSessionChecked = true;
      renderAdminAccess();
      showToast("Connexion gestion requise pour modifier ces données.");
      return;
    }
    if (!response.ok) {
      throw new Error("Sauvegarde backend refusée.");
    }
`,
);

insertBeforeIfMissing(
  "function isAdminRouteActive",
  "function createId(prefix) {",
  `function isAdminRouteActive() {
  return location.hash.replace("#", "") === "admin";
}

function renderAdminAccess() {
  if (!els.adminLoginPanel || !els.adminContent) return;
  const loginRequired = canUseBackend() && !adminAuthenticated;
  els.adminLoginPanel.classList.toggle("is-hidden", !loginRequired);
  els.adminContent.classList.toggle("is-hidden", loginRequired);
  if (!loginRequired && els.adminLoginMessage) {
    els.adminLoginMessage.textContent = "";
  }
}

async function checkAdminSession(options = {}) {
  if (!canUseBackend()) {
    adminAuthenticated = true;
    adminSessionChecked = true;
    renderAdminAccess();
    return true;
  }

  if (adminSessionCheckPromise && !options.force) {
    return adminSessionCheckPromise;
  }

  adminSessionCheckPromise = fetch(ADMIN_SESSION_URL, {
    headers: { Accept: "application/json" },
    cache: "no-store",
    credentials: "same-origin",
  })
    .then(async (response) => {
      const payload = response.ok ? await response.json() : { authenticated: false };
      adminAuthenticated = Boolean(payload.authenticated);
      adminSessionChecked = true;
      renderAdminAccess();
      return adminAuthenticated;
    })
    .catch((error) => {
      console.warn(error);
      adminAuthenticated = false;
      adminSessionChecked = true;
      renderAdminAccess();
      return false;
    })
    .finally(() => {
      adminSessionCheckPromise = null;
    });

  return adminSessionCheckPromise;
}

async function handleAdminLogin(event) {
  event.preventDefault();
  const password = els.adminPasswordInput.value;
  if (!password) {
    els.adminLoginMessage.textContent = "Indiquez le mot de passe gestion.";
    return;
  }

  try {
    const response = await fetch(ADMIN_LOGIN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ password }),
    });
    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      els.adminLoginMessage.textContent = payload.message || "Mot de passe incorrect.";
      return;
    }

    adminAuthenticated = true;
    adminSessionChecked = true;
    els.adminLoginForm.reset();
    els.adminLoginMessage.textContent = "";
    renderAdmin();
    showToast("Accès gestion ouvert.");
  } catch (error) {
    console.warn(error);
    els.adminLoginMessage.textContent = "Connexion impossible pour le moment.";
  }
}

async function handleAdminLogout() {
  if (canUseBackend()) {
    await fetch(ADMIN_LOGOUT_URL, {
      method: "POST",
      credentials: "same-origin",
    }).catch((error) => console.warn(error));
  }
  adminAuthenticated = !canUseBackend();
  adminSessionChecked = true;
  renderAdmin();
  showToast("Accès gestion fermé.");
}
`,
);

replaceOnce(
  `function setHashView() {
  const view = location.hash.replace("#", "") === "admin" ? "admin" : "player";
  Object.entries(els.views).forEach(([name, element]) => {
    element.classList.toggle("is-active", name === view);
  });
  els.navLinks.forEach((link) => {
    link.classList.toggle("is-active", link.dataset.route === view);
  });
  render();
}
`,
  `function setHashView() {
  const view = location.hash.replace("#", "") === "admin" ? "admin" : "player";
  Object.entries(els.views).forEach(([name, element]) => {
    element.classList.toggle("is-active", name === view);
  });
  els.navLinks.forEach((link) => {
    link.classList.toggle("is-active", link.dataset.route === view);
  });
  if (view === "admin" && !adminSessionChecked) {
    checkAdminSession().then(() => {
      if (isAdminRouteActive()) renderAdmin();
    });
  }
  render();
}
`,
);

replaceOnce(
  `function renderAdmin() {
  const activeRoute = getActiveRoute();
`,
  `function renderAdmin() {
  renderAdminAccess();
  if (canUseBackend() && !adminAuthenticated) return;

  const activeRoute = getActiveRoute();
`,
);

replaceOnce(
  `  els.demoUnlockButton.addEventListener("click", unlockCurrentPuzzleByDemo);
  els.seedButton.addEventListener("click", resetSeed);
`,
  `  els.demoUnlockButton.addEventListener("click", unlockCurrentPuzzleByDemo);
  els.adminLoginForm.addEventListener("submit", handleAdminLogin);
  els.adminLogoutButton.addEventListener("click", handleAdminLogout);
  els.seedButton.addEventListener("click", resetSeed);
`,
);

insertBeforeIfMissing(
  "function getFittingMapView",
  "function renderTileMap(container, options) {",
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
);

replaceOnce(
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

replaceOnce(
  `    h: height,
    center: [center.lat.toFixed(5), center.lng.toFixed(5)],
`,
  `    h: height,
    zoom,
    center: [center.lat.toFixed(5), center.lng.toFixed(5)],
`,
);

replaceOnce("  const centerWorld = latLngToWorld(center.lat, center.lng);\n", "  const centerWorld = latLngToWorld(center.lat, center.lng, zoom);\n");
replaceOnce("  const maxTile = 2 ** MAP_ZOOM;\n", "  const maxTile = 2 ** zoom;\n");
replaceOnce("https://tile.openstreetmap.org/${MAP_ZOOM}/${wrappedX}/${y}.png", "https://tile.openstreetmap.org/${zoom}/${wrappedX}/${y}.png");
replaceOnce("    const world = latLngToWorld(point.lat, point.lng);\n", "    const world = latLngToWorld(point.lat, point.lng, zoom);\n");
replaceOnce("  const radiusPixels = metersToPixels(radius, target.lat);\n", "  const radiusPixels = metersToPixels(radius, target.lat, zoom);\n");

replaceOnce(
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

insertBeforeIfMissing(
  "function handleGeolocationPosition",
  "function locatePlayer() {",
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
);

replaceRegexIfMissing(
  "navigator.geolocation.watchPosition",
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

replaceOnce(
  `function resetSession() {
  localStorage.removeItem(SESSION_KEY);
`,
  `function resetSession() {
  stopGeolocationWatch();
  localStorage.removeItem(SESSION_KEY);
`,
);

replaceOnce(
  `  window.addEventListener("beforeunload", flushServerSave);
`,
  `  window.addEventListener("beforeunload", () => {
    stopGeolocationWatch();
    flushServerSave();
  });
`,
);

if (changed) {
  await writeFile(APP_FILE, code, "utf8");
  console.log("Render runtime patch applied.");
} else {
  console.log("Render runtime patch already present.");
}
