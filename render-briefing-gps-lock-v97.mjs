import { readFile, writeFile } from "node:fs/promises";

const VERSION = 97;
const scriptBaseUrl = new URL("./", import.meta.url);

const briefingLocationMarkup = `
                <div class="briefing-location-status is-blocked" id="briefing-location-status" role="status" aria-live="polite">
                  Autorisez la g&eacute;olocalisation pour v&eacute;rifier votre pr&eacute;sence au point de d&eacute;part.
                </div>
                <button class="secondary-button full-button" type="button" id="briefing-locate-button">Me localiser au d&eacute;part</button>
`;

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

function patchIndex(html) {
  let next = bumpAssetVersions(html);
  if (next.includes('id="briefing-location-status"')) return next;

  const startButtonPattern = /(\s*<button\b(?=[^>]*\bid="start-adventure-button")[^>]*>[\s\S]*?<\/button>)/;
  if (!startButtonPattern.test(next)) {
    throw new Error("Bouton de lancement du briefing introuvable");
  }

  return next.replace(startButtonPattern, `${briefingLocationMarkup}$1`);
}

const briefingHelpers = `
function getRouteStartRadius(route) {
  const configuredRadius = Number(route?.startRadius);
  if (Number.isFinite(configuredRadius) && configuredRadius > 0) {
    return Math.min(1000, Math.max(20, configuredRadius));
  }
  const firstPuzzleRadius = getPuzzleRadius(route?.puzzles?.[0]);
  return Math.min(1000, Math.max(80, firstPuzzleRadius, 120));
}

function getBriefingStoredPosition(team) {
  if (isUsablePosition(team?.briefingStartLocation)) return team.briefingStartLocation;
  if (isUsablePosition(team?.lastPosition)) return team.lastPosition;
  return null;
}

function getBriefingStartState(team, route) {
  const start = getRouteStart(route);
  const hasCoordinates = Number.isFinite(start.lat) && Number.isFinite(start.lng);
  if (!hasCoordinates) {
    return {
      canStart: true,
      hasCoordinates: false,
      position: null,
      distance: null,
      radius: null,
    };
  }

  const radius = getRouteStartRadius(route);
  const position = getBriefingStoredPosition(team);
  if (!position) {
    return {
      canStart: false,
      hasCoordinates: true,
      position: null,
      distance: null,
      radius,
    };
  }

  const distance = distanceInMeters(position.lat, position.lng, start.lat, start.lng);
  const inside = distance <= radius;
  return {
    canStart: inside,
    hasCoordinates: true,
    position,
    distance,
    radius,
  };
}

function formatBriefingDistance(distance) {
  if (!Number.isFinite(distance)) return "";
  if (distance < 1000) return \`\${Math.max(0, Math.round(distance))} m\`;
  return \`\${(distance / 1000).toFixed(1).replace(".", ",")} km\`;
}

function setBriefingLocationMessage(kind, message) {
  if (!els.briefingLocationStatus) return;
  els.briefingLocationStatus.textContent = message;
  els.briefingLocationStatus.classList.toggle("is-ready", kind === "ready");
  els.briefingLocationStatus.classList.toggle("is-blocked", kind === "blocked");
  els.briefingLocationStatus.classList.toggle("is-active", kind === "active");
  els.briefingLocationStatus.classList.toggle("is-error", kind === "error");
}

function updateBriefingLocationUi(team, route, forcedMessage = null) {
  if (!els.briefingLocationStatus || !els.startAdventureButton) return;
  const state = getBriefingStartState(team, route);
  const shouldBlock = team?.status === "briefing" && !state.canStart;
  els.startAdventureButton.disabled = shouldBlock;
  els.startAdventureButton.setAttribute("aria-disabled", shouldBlock ? "true" : "false");

  if (els.briefingLocateButton) {
    els.briefingLocateButton.hidden = !state.hasCoordinates;
    els.briefingLocateButton.disabled = briefingGeolocationWatchId !== null;
    els.briefingLocateButton.textContent = state.position ? "Actualiser ma position" : "Me localiser au depart";
  }

  if (forcedMessage) {
    setBriefingLocationMessage(forcedMessage.kind, forcedMessage.text);
    return;
  }

  if (!state.hasCoordinates) {
    setBriefingLocationMessage("ready", "Aucune zone GPS de depart n'est configuree pour ce parcours. Vous pouvez commencer.");
    return;
  }

  if (!state.position) {
    setBriefingLocationMessage("blocked", "Localisez votre equipe au point de depart avant de commencer l'aventure.");
    return;
  }

  const accuracy = Number(state.position.accuracy);
  const accuracyText = Number.isFinite(accuracy) ? \` Precision +/-\${Math.round(accuracy)} m.\` : "";
  if (state.canStart) {
    setBriefingLocationMessage("ready", \`Position validee au point de depart. Vous pouvez commencer.\${accuracyText}\`);
    return;
  }

  const remaining = Math.max(0, state.distance - state.radius);
  setBriefingLocationMessage("blocked", \`Vous etes a \${formatBriefingDistance(state.distance)} du depart. Rapprochez-vous encore de \${formatBriefingDistance(remaining)} pour commencer.\${accuracyText}\`);
}

function canStartAdventureFromBriefing(team, route) {
  return getBriefingStartState(team, route).canStart;
}

function stopBriefingGeolocationWatch() {
  if (briefingGeolocationWatchId === null || !navigator.geolocation) return;
  navigator.geolocation.clearWatch(briefingGeolocationWatchId);
  briefingGeolocationWatchId = null;
}

async function handleBriefingGeolocationPosition(position) {
  const team = getCurrentTeam();
  if (!team || team.status !== "briefing") {
    stopBriefingGeolocationWatch();
    return;
  }

  const route = getRoute(team.routeId);
  const start = getRouteStart(route);
  if (!route || !Number.isFinite(start.lat) || !Number.isFinite(start.lng)) {
    updateBriefingLocationUi(team, route);
    stopBriefingGeolocationWatch();
    return;
  }

  const radius = getRouteStartRadius(route);
  const lat = position.coords.latitude;
  const lng = position.coords.longitude;
  const distance = distanceInMeters(lat, lng, start.lat, start.lng);
  const inside = distance <= radius;
  const capturedAt = Date.now();
  const lastPosition = {
    lat,
    lng,
    accuracy: position.coords.accuracy,
    at: capturedAt,
  };
  team.lastPosition = lastPosition;
  team.briefingStartLocation = {
    ...lastPosition,
    distance,
    radius,
    inside,
  };
  touchTeam(team);
  saveData({ immediate: true });
  renderBriefing(route);

  if (inside) {
    stopBriefingGeolocationWatch();
    updateBriefingLocationUi(team, route);
    showToast("Position validee au point de depart.");
  }
}

function handleBriefingGeolocationError() {
  const team = getCurrentTeam();
  const route = team ? getRoute(team.routeId) : null;
  stopBriefingGeolocationWatch();
  updateBriefingLocationUi(team, route, {
    kind: "error",
    text: "Position non disponible. Verifiez l'autorisation GPS puis reessayez.",
  });
}

function locateBriefingStart() {
  const team = getCurrentTeam();
  if (!team || team.status !== "briefing") return;
  const route = getRoute(team.routeId);
  const start = getRouteStart(route);
  if (!route || !Number.isFinite(start.lat) || !Number.isFinite(start.lng)) {
    updateBriefingLocationUi(team, route);
    return;
  }

  if (!navigator.geolocation) {
    updateBriefingLocationUi(team, route, {
      kind: "error",
      text: "La geolocalisation n'est pas disponible sur cet appareil.",
    });
    return;
  }

  if (briefingGeolocationWatchId !== null) {
    updateBriefingLocationUi(team, route, {
      kind: "active",
      text: "Recherche de votre position au point de depart...",
    });
    return;
  }

  stopGeolocationWatch();
  updateBriefingLocationUi(team, route, {
    kind: "active",
    text: "Recherche de votre position au point de depart...",
  });
  briefingGeolocationWatchId = navigator.geolocation.watchPosition(
    handleBriefingGeolocationPosition,
    handleBriefingGeolocationError,
    { enableHighAccuracy: true, maximumAge: 1000, timeout: 15000 },
  );
  if (els.briefingLocateButton) els.briefingLocateButton.disabled = true;
}

`;

function patchApp(js) {
  let next = js;

  if (!next.includes('briefingLocationStatus: $("#briefing-location-status")')) {
    const selectorMarker = '  briefingDirectionsLink: $("#briefing-directions-link"),\n  startAdventureButton: $("#start-adventure-button"),';
    if (!next.includes(selectorMarker)) throw new Error("Selecteurs briefing introuvables");
    next = next.replace(
      selectorMarker,
      '  briefingDirectionsLink: $("#briefing-directions-link"),\n  briefingLocationStatus: $("#briefing-location-status"),\n  briefingLocateButton: $("#briefing-locate-button"),\n  startAdventureButton: $("#start-adventure-button"),',
    );
  }

  if (!next.includes("let briefingGeolocationWatchId = null;")) {
    const watchMarker = "let geolocationWatchPuzzleId = null;";
    if (!next.includes(watchMarker)) throw new Error("Variable de suivi GPS introuvable");
    next = next.replace(watchMarker, `${watchMarker}\nlet briefingGeolocationWatchId = null;`);
  }

  if (!next.includes("function getRouteStartRadius(route)")) {
    const briefingMarker = "function renderBriefing(route) {";
    if (!next.includes(briefingMarker)) throw new Error("Fonction briefing introuvable");
    next = next.replace(briefingMarker, `${briefingHelpers}${briefingMarker}`);
  }

  const oldRenderBriefing = `function renderBriefing(route) {
  if (!els.briefingPanel || !route) return;
  const start = getRouteStart(route);
  const hasCoordinates = Number.isFinite(start.lat) && Number.isFinite(start.lng);
  const coordinateLabel = hasCoordinates ? \`GPS \${formatCoordinate(start.lat)}, \${formatCoordinate(start.lng)}\` : "";
  const startDetails = [start.place, start.address, coordinateLabel].filter(Boolean).join(" " + String.fromCharCode(183) + " ");
  const mapTarget = hasCoordinates
    ? { lat: start.lat, lng: start.lng }
    : { ...DEFAULT_CENTER };

  els.briefingTitle.textContent = route.title || "Votre mission";
  els.briefingText.textContent = getRouteBriefingText(route);
  els.briefingStartText.textContent = startDetails || "Le point de d\\u00e9part sera communiqu\\u00e9 sur place.";
  if (els.briefingDirectionsLink) {
    els.briefingDirectionsLink.href = getRouteStartDirectionsUrl(route);
  }
  renderTileMap(els.briefingMap, {
    target: mapTarget,
    targets: [{ ...mapTarget, radius: 80, label: "D\\u00e9part" }],
    zoom: MAP_ZOOM,
    editable: false,
  });
}`;

  const newRenderBriefing = `function renderBriefing(route) {
  if (!els.briefingPanel || !route) return;
  const team = getCurrentTeam();
  const start = getRouteStart(route);
  const hasCoordinates = Number.isFinite(start.lat) && Number.isFinite(start.lng);
  const coordinateLabel = hasCoordinates ? \`GPS \${formatCoordinate(start.lat)}, \${formatCoordinate(start.lng)}\` : "";
  const startDetails = [start.place, start.address, coordinateLabel].filter(Boolean).join(" " + String.fromCharCode(183) + " ");
  const mapTarget = hasCoordinates
    ? { lat: start.lat, lng: start.lng }
    : { ...DEFAULT_CENTER };
  const startRadius = getRouteStartRadius(route);
  const locationState = getBriefingStartState(team, route);
  const playerPosition = isUsablePosition(locationState.position)
    ? { ...locationState.position, label: "Vous" }
    : null;

  els.briefingTitle.textContent = route.title || "Votre mission";
  els.briefingText.textContent = getRouteBriefingText(route);
  els.briefingStartText.textContent = startDetails || "Le point de d\\u00e9part sera communiqu\\u00e9 sur place.";
  if (els.briefingDirectionsLink) {
    els.briefingDirectionsLink.href = getRouteStartDirectionsUrl(route);
  }
  renderTileMap(els.briefingMap, {
    target: mapTarget,
    targets: [{ ...mapTarget, radius: startRadius, label: "D\\u00e9part" }],
    player: playerPosition,
    fitToPoints: Boolean(playerPosition && hasCoordinates),
    zoom: MAP_ZOOM,
    editable: false,
  });
  updateBriefingLocationUi(team, route);
}`;

  if (!next.includes("const locationState = getBriefingStartState(team, route);")) {
    if (!next.includes(oldRenderBriefing)) throw new Error("Corps renderBriefing inattendu");
    next = next.replace(oldRenderBriefing, newRenderBriefing);
  }

  if (!next.includes("if (!canStartAdventureFromBriefing(team, route))")) {
    const startMarker = `  ensureTeamState(team);
  team.status = "playing";`;
    if (!next.includes(startMarker)) throw new Error("Lancement aventure introuvable");
    next = next.replace(
      startMarker,
      `  ensureTeamState(team);
  if (!canStartAdventureFromBriefing(team, route)) {
    updateBriefingLocationUi(team, route);
    showToast("Localisez votre equipe au point de depart avant de commencer.");
    return;
  }
  stopBriefingGeolocationWatch();
  team.status = "playing";`,
    );
  }

  if (!next.includes("stopBriefingGeolocationWatch();\n  localStorage.removeItem(SESSION_KEY);")) {
    const resetMarker = `function resetSession() {
  stopGeolocationWatch();
  localStorage.removeItem(SESSION_KEY);`;
    if (!next.includes(resetMarker)) throw new Error("Reset session introuvable");
    next = next.replace(
      resetMarker,
      `function resetSession() {
  stopGeolocationWatch();
  stopBriefingGeolocationWatch();
  localStorage.removeItem(SESSION_KEY);`,
    );
  }

  if (!next.includes("stopBriefingGeolocationWatch();\n    flushServerSave();")) {
    const unloadMarker = `  window.addEventListener("beforeunload", () => {
    stopGeolocationWatch();
    flushServerSave();
  });`;
    if (!next.includes(unloadMarker)) throw new Error("beforeunload introuvable");
    next = next.replace(
      unloadMarker,
      `  window.addEventListener("beforeunload", () => {
    stopGeolocationWatch();
    stopBriefingGeolocationWatch();
    flushServerSave();
  });`,
    );
  }

  if (!next.includes('els.briefingLocateButton?.addEventListener("click", locateBriefingStart);')) {
    const listenerMarker = '  els.startAdventureButton?.addEventListener("click", startAdventure);';
    if (!next.includes(listenerMarker)) throw new Error("Listener bouton lancement introuvable");
    next = next.replace(
      listenerMarker,
      `${listenerMarker}\n  els.briefingLocateButton?.addEventListener("click", locateBriefingStart);`,
    );
  }

  return next;
}

function patchStyles(css) {
  const marker = `/* render-briefing-gps-lock-v${VERSION} */`;
  if (css.includes(marker)) return css;
  return `${css.trimEnd()}

${marker}
.briefing-location-status {
  padding: 12px;
  border: 1px solid var(--line);
  border-radius: var(--radius);
  background: #fbfdfc;
  color: var(--muted);
  line-height: 1.45;
}

.briefing-location-status.is-ready {
  border-color: rgba(40, 127, 79, 0.38);
  background: #effaf5;
  color: var(--success);
}

.briefing-location-status.is-blocked,
.briefing-location-status.is-active {
  border-color: rgba(216, 148, 44, 0.48);
  background: #fff8e8;
  color: #2a2112;
}

.briefing-location-status.is-error {
  border-color: rgba(184, 66, 61, 0.42);
  background: #fff1f0;
  color: var(--danger);
}
`;
}

function patchServiceWorker(worker) {
  return worker
    .replace(/escape-erezee-v\d+/g, `escape-erezee-v${VERSION}`)
    .replace(/"\.\/styles\.css(?:\?v=\d+)?"/g, `"./styles.css?v=${VERSION}"`)
    .replace(/"\.\/app\.js(?:\?v=\d+)?"/g, `"./app.js?v=${VERSION}"`);
}

await patchTextFile("index.html", patchIndex);
await patchTextFile("app.js", patchApp);
await patchTextFile("styles.css", patchStyles);
await patchTextFile("service-worker.js", patchServiceWorker);
console.log(`Briefing GPS lock v${VERSION} applied.`);
