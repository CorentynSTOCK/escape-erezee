import { readFile, writeFile } from "node:fs/promises";

const VERSION = 183;

async function patchFile(filePath, patcher) {
  const input = await readFile(filePath, "utf8");
  const output = patcher(input);
  if (output !== input) await writeFile(filePath, output, "utf8");
}

function patchIndex(html) {
  let next = html;
  if (!next.includes('id="player-navigation-summary"')) {
    next = next.replace(
      /(<article class="map-panel" aria-label="Carte du parcours">\s*)(<div class="map-canvas player-map" id="player-map")/,
      `$1<button class="navigation-close-button" id="player-navigation-close" type="button" aria-label="Quitter le mode guidage">Quitter le guidage</button>
                $2`,
    );
    next = next.replace(
      '<div class="player-map-guide" id="player-map-guidance" aria-live="polite">',
      `<div class="player-navigation-summary" id="player-navigation-summary" aria-live="polite">
                  <div class="player-navigation-arrow-block">
                    <span class="player-navigation-arrow" id="player-navigation-arrow" aria-hidden="true">↑</span>
                    <small id="player-navigation-direction">Direction générale</small>
                  </div>
                  <div class="player-navigation-distance-block">
                    <strong id="player-navigation-distance">--</strong>
                    <span id="player-navigation-distance-label">Activez votre position</span>
                    <small id="player-navigation-signal"></small>
                  </div>
                </div>
                <p class="player-navigation-safety" id="player-navigation-safety">Suivez les chemins autorisés et arrêtez-vous pour consulter l’écran.</p>
                <div class="player-map-guide" id="player-map-guidance" aria-live="polite">`,
    );
    next = next.replace(
      /<a class="secondary-button player-directions-link" id="player-directions-link"[^>]*>[^<]*<\/a>/,
      '<button class="primary-button player-navigation-button" id="player-navigation-button" type="button" aria-pressed="false">Mode guidage</button>',
    );
  }
  return next
    .replace(/styles\.css\?v=\d+/g, `styles.css?v=${VERSION}`)
    .replace(/app\.js\?v=\d+/g, `app.js?v=${VERSION}`);
}

function patchApp(app) {
  const marker = `/* player-inapp-guidance-v${VERSION} */`;
  if (app.includes(marker)) return app;

  let next = app.replace(
    "async function handleGeolocationPosition(position) {\n  await refreshPlayerRoutesFromServer();",
    `async function handleGeolocationPosition(position) {
  const movementHeadingV183 = Number(position?.coords?.heading);
  if (Number.isFinite(movementHeadingV183) && movementHeadingV183 >= 0) {
    playerMovementHeadingV183 = movementHeadingV183;
  }
  await refreshPlayerRoutesFromServer();`,
  );

  next = next.replace(
    "  updatePlayerMapGuidanceV182(team, puzzle, target, playerPosition);",
    "  updatePlayerMapGuidanceV183(team, puzzle, target, playerPosition);",
  );

  next = next.replace(
    '    team.status = "won";\n    team.finishedAt = Date.now();',
    '    team.status = "won";\n    if (typeof exitPlayerNavigationV183 === "function") exitPlayerNavigationV183();\n    team.finishedAt = Date.now();',
  );
  next = next.replace(
    '    team.status = "lost";\n    team.finishedAt = Date.now();',
    '    team.status = "lost";\n    if (typeof exitPlayerNavigationV183 === "function") exitPlayerNavigationV183();\n    team.finishedAt = Date.now();',
  );

  const helpers = `${marker}
let playerNavigationActiveV183 = false;
let playerCompassHeadingV183 = null;
let playerMovementHeadingV183 = null;
let playerCompassBoundV183 = false;
let playerWakeLockV183 = null;
let playerGuidanceContextV183 = null;
let playerArrivalBuzzPuzzleV183 = null;

function playerGuidanceLabelsV183() {
  const labels = {
    fr: {
      navigation: "Mode guidage",
      exit: "Quitter le guidage",
      waiting: "Activez votre position",
      toZone: "jusqu'à la zone",
      arrived: "Vous êtes arrivé dans la zone",
      direction: (value) => "Direction " + value,
      compass: "La flèche suit l'orientation du téléphone",
      fallback: "Direction générale sur une carte orientée au nord",
      precise: (value) => "GPS précis à ±" + value + " m",
      weak: (value) => "Signal GPS imprécis (±" + value + " m) · placez-vous à découvert",
      stale: "Position ancienne · relancez la géolocalisation",
      safety: "Suivez les chemins autorisés et arrêtez-vous pour consulter l'écran.",
    },
    en: {
      navigation: "Guidance mode",
      exit: "Exit guidance",
      waiting: "Enable your location",
      toZone: "to the target area",
      arrived: "You have reached the target area",
      direction: (value) => "Direction " + value,
      compass: "The arrow follows your phone orientation",
      fallback: "General direction on a north-up map",
      precise: (value) => "GPS accuracy ±" + value + " m",
      weak: (value) => "Weak GPS signal (±" + value + " m) · move into an open area",
      stale: "Old position · restart location tracking",
      safety: "Stay on authorised paths and stop walking before checking the screen.",
    },
    nl: {
      navigation: "Navigatiemodus",
      exit: "Navigatie afsluiten",
      waiting: "Activeer je locatie",
      toZone: "tot de doelzone",
      arrived: "Je bent in de doelzone aangekomen",
      direction: (value) => "Richting " + value,
      compass: "De pijl volgt de richting van je telefoon",
      fallback: "Algemene richting op een kaart met het noorden bovenaan",
      precise: (value) => "GPS-nauwkeurigheid ±" + value + " m",
      weak: (value) => "Zwak GPS-signaal (±" + value + " m) · ga naar een open plek",
      stale: "Oude positie · start de lokalisatie opnieuw",
      safety: "Blijf op toegestane paden en stop met wandelen voordat je op het scherm kijkt.",
    },
  };
  return labels[playerMapLanguageV182()] || labels.fr;
}

function normalizeGuidanceAngleV183(value) {
  return ((Number(value) % 360) + 360) % 360;
}

function handlePlayerOrientationV183(event) {
  const webkitHeading = Number(event?.webkitCompassHeading);
  const alpha = Number(event?.alpha);
  const heading = Number.isFinite(webkitHeading)
    ? webkitHeading
    : Number.isFinite(alpha)
      ? normalizeGuidanceAngleV183(360 - alpha)
      : null;
  if (!Number.isFinite(heading)) return;
  playerCompassHeadingV183 = heading;
  if (playerGuidanceContextV183) {
    updatePlayerMapGuidanceV183(...playerGuidanceContextV183);
  }
}

async function enablePlayerCompassV183() {
  if (playerCompassBoundV183) return;
  try {
    const orientation = window.DeviceOrientationEvent;
    if (!orientation) return;
    if (typeof orientation.requestPermission === "function") {
      const permission = await orientation.requestPermission();
      if (permission !== "granted") return;
    }
    window.addEventListener("deviceorientationabsolute", handlePlayerOrientationV183, true);
    window.addEventListener("deviceorientation", handlePlayerOrientationV183, true);
    playerCompassBoundV183 = true;
  } catch (error) {
    console.info("Boussole non disponible, guidage cardinal conservé.", error);
  }
}

async function requestPlayerWakeLockV183() {
  if (!playerNavigationActiveV183 || !navigator.wakeLock?.request || playerWakeLockV183) return;
  try {
    playerWakeLockV183 = await navigator.wakeLock.request("screen");
    playerWakeLockV183.addEventListener?.("release", () => {
      playerWakeLockV183 = null;
    });
  } catch {
    playerWakeLockV183 = null;
  }
}

async function releasePlayerWakeLockV183() {
  try {
    await playerWakeLockV183?.release?.();
  } catch {
    // The browser may already have released it while the tab was hidden.
  }
  playerWakeLockV183 = null;
}

async function enterPlayerNavigationV183() {
  const panel = document.querySelector("#player-map")?.closest(".map-panel");
  if (!panel) return;
  playerNavigationActiveV183 = true;
  panel.classList.add("is-navigation-mode");
  document.body.classList.add("player-navigation-open");
  document.querySelector("#player-navigation-button")?.setAttribute("aria-pressed", "true");
  delete document.querySelector("#player-map")?.dataset?.mapManualZoom;
  rerenderMap(document.querySelector("#player-map"));
  requestPlayerPositionRefresh(true);
  await enablePlayerCompassV183();
  await requestPlayerWakeLockV183();
}

async function exitPlayerNavigationV183() {
  const panel = document.querySelector("#player-map")?.closest(".map-panel");
  playerNavigationActiveV183 = false;
  panel?.classList.remove("is-navigation-mode");
  document.body.classList.remove("player-navigation-open");
  document.querySelector("#player-navigation-button")?.setAttribute("aria-pressed", "false");
  rerenderMap(document.querySelector("#player-map"));
  await releasePlayerWakeLockV183();
}

function updatePlayerMapGuidanceV183(team, puzzle, target, playerPosition) {
  updatePlayerMapGuidanceV182(team, puzzle, target, playerPosition);
  playerGuidanceContextV183 = [team, puzzle, target, playerPosition];
  const labels = playerGuidanceLabelsV183();
  const arrow = document.querySelector("#player-navigation-arrow");
  const directionNode = document.querySelector("#player-navigation-direction");
  const distanceNode = document.querySelector("#player-navigation-distance");
  const distanceLabel = document.querySelector("#player-navigation-distance-label");
  const signalNode = document.querySelector("#player-navigation-signal");
  const safetyNode = document.querySelector("#player-navigation-safety");
  const navigationButton = document.querySelector("#player-navigation-button");
  const closeButton = document.querySelector("#player-navigation-close");
  if (navigationButton) navigationButton.textContent = labels.navigation;
  if (closeButton) closeButton.textContent = labels.exit;
  if (safetyNode) safetyNode.textContent = labels.safety;
  if (!arrow || !directionNode || !distanceNode || !distanceLabel || !signalNode) return;

  signalNode.className = "";
  if (!isUsablePosition(playerPosition)) {
    arrow.style.setProperty("--player-guidance-rotation", "0deg");
    arrow.classList.add("is-waiting");
    directionNode.textContent = labels.fallback;
    distanceNode.textContent = "--";
    distanceLabel.textContent = labels.waiting;
    signalNode.textContent = "";
    return;
  }

  arrow.classList.remove("is-waiting");
  const distance = distanceInMeters(playerPosition.lat, playerPosition.lng, target.lat, target.lng);
  const radius = getPuzzleRadius(puzzle);
  const remaining = Math.max(0, distance - radius);
  const bearing = playerMapBearingV182(playerPosition, target);
  const cardinal = playerMapCardinalV182(bearing);
  const phoneHeading = Number.isFinite(playerCompassHeadingV183)
    ? playerCompassHeadingV183
    : Number.isFinite(playerMovementHeadingV183)
      ? playerMovementHeadingV183
      : null;
  const rotation = Number.isFinite(phoneHeading)
    ? normalizeGuidanceAngleV183(bearing - phoneHeading)
    : bearing;
  arrow.style.setProperty("--player-guidance-rotation", rotation + "deg");
  directionNode.textContent = Number.isFinite(phoneHeading) ? labels.compass : labels.direction(cardinal) + " · " + labels.fallback;
  distanceNode.textContent = distance <= radius ? "✓" : playerMapDistanceV182(remaining);
  distanceLabel.textContent = distance <= radius ? labels.arrived : labels.toZone;

  const age = Date.now() - Number(playerPosition.at || team?.updatedAt || 0);
  const accuracy = Math.round(Number(playerPosition.accuracy));
  if (age > 90000) {
    signalNode.textContent = labels.stale;
    signalNode.classList.add("is-stale");
  } else if (Number.isFinite(accuracy) && accuracy > 40) {
    signalNode.textContent = labels.weak(accuracy);
    signalNode.classList.add("is-weak");
  } else if (Number.isFinite(accuracy)) {
    signalNode.textContent = labels.precise(accuracy);
    signalNode.classList.add("is-good");
  } else {
    signalNode.textContent = "";
  }

  if (distance <= radius && playerArrivalBuzzPuzzleV183 !== puzzle.id) {
    playerArrivalBuzzPuzzleV183 = puzzle.id;
    navigator.vibrate?.([120, 80, 120]);
  }
}

document.addEventListener("click", (event) => {
  const navigationButton = event.target.closest?.("#player-navigation-button");
  const closeButton = event.target.closest?.("#player-navigation-close");
  if (navigationButton) {
    event.preventDefault();
    if (playerNavigationActiveV183) exitPlayerNavigationV183();
    else enterPlayerNavigationV183();
  }
  if (closeButton) {
    event.preventDefault();
    exitPlayerNavigationV183();
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && playerNavigationActiveV183) exitPlayerNavigationV183();
});

document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible" && playerNavigationActiveV183) requestPlayerWakeLockV183();
});

window.addEventListener("hashchange", () => {
  if (playerNavigationActiveV183 && location.hash !== "#player") exitPlayerNavigationV183();
});
`;

  next = next.replace("\nfunction renderPuzzleMedia(puzzle, unlocked) {", `\n${helpers}\nfunction renderPuzzleMedia(puzzle, unlocked) {`);
  return next;
}

function patchStyles(css) {
  const marker = `/* player-inapp-guidance-v${VERSION} */`;
  if (css.includes(marker)) return css;
  return `${css.trimEnd()}

${marker}
.player-navigation-summary {
  display: grid;
  grid-template-columns: 118px minmax(0, 1fr);
  gap: 14px;
  align-items: center;
  margin-top: 12px;
  padding: 13px;
  border: 1px solid #c7d8d1;
  border-radius: 6px;
  background: #f6faf8;
}

.player-navigation-arrow-block,
.player-navigation-distance-block {
  display: grid;
  justify-items: center;
  min-width: 0;
  text-align: center;
}

.player-navigation-arrow {
  display: grid;
  width: 68px;
  height: 68px;
  place-items: center;
  border: 5px solid #fff;
  border-radius: 50%;
  background: #087ca7;
  color: #fff;
  box-shadow: 0 0 0 2px #087ca7, 0 10px 24px rgba(8, 80, 105, 0.24);
  font-size: 2.6rem;
  font-weight: 950;
  line-height: 1;
  transform: rotate(var(--player-guidance-rotation, 0deg));
  transition: transform 220ms ease-out;
}

.player-navigation-arrow.is-waiting {
  background: #81918c;
  box-shadow: 0 0 0 2px #81918c;
}

.player-navigation-arrow-block small,
.player-navigation-distance-block small {
  max-width: 100%;
  margin-top: 8px;
  color: var(--muted);
  font-size: 0.72rem;
  font-weight: 750;
  line-height: 1.3;
  overflow-wrap: anywhere;
}

.player-navigation-distance-block strong {
  color: #102a23;
  font-size: clamp(2rem, 7vw, 3.2rem);
  line-height: 1;
}

.player-navigation-distance-block span {
  margin-top: 6px;
  color: #30453e;
  font-size: 0.88rem;
  font-weight: 850;
}

#player-navigation-signal.is-good { color: #216d4e; }
#player-navigation-signal.is-weak { color: #9a6200; }
#player-navigation-signal.is-stale { color: #a23b32; }

.player-navigation-safety {
  margin: 8px 0 0;
  padding: 9px 11px;
  border-left: 4px solid #d8942c;
  background: #fff7e7;
  color: #55411c;
  font-size: 0.78rem;
  font-weight: 750;
  line-height: 1.35;
}

.player-navigation-button {
  background: var(--amber);
  color: #162823;
}

.navigation-close-button {
  display: none;
}

body.player-navigation-open {
  overflow: hidden;
  overscroll-behavior: none;
}

.map-panel.is-navigation-mode {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100vw;
  height: 100dvh;
  padding: max(10px, env(safe-area-inset-top)) max(10px, env(safe-area-inset-right)) max(10px, env(safe-area-inset-bottom)) max(10px, env(safe-area-inset-left));
  border: 0;
  border-radius: 0;
  background: #f4f8f6;
}

.map-panel.is-navigation-mode .navigation-close-button {
  display: inline-flex;
  align-self: flex-start;
  min-height: 42px;
  align-items: center;
  padding: 8px 13px;
  border: 1px solid #b8cbc4;
  border-radius: 6px;
  background: #fff;
  color: #15352c;
  font-weight: 850;
}

.map-panel.is-navigation-mode .player-map {
  flex: 1 1 auto;
  width: 100%;
  height: auto;
  min-height: 230px;
}

.map-panel.is-navigation-mode .player-navigation-summary {
  flex: 0 0 auto;
  grid-template-columns: 105px minmax(0, 1fr);
  margin-top: 0;
  padding: 9px 12px;
}

.map-panel.is-navigation-mode .player-navigation-arrow {
  width: 58px;
  height: 58px;
  font-size: 2.2rem;
}

.map-panel.is-navigation-mode .player-map-guide {
  padding-top: 2px;
}

.map-panel.is-navigation-mode .player-navigation-safety,
.map-panel.is-navigation-mode .distance-note {
  margin: 0;
}

.map-panel.is-navigation-mode [data-map-fullscreen] {
  display: none;
}

@media (prefers-reduced-motion: reduce) {
  .player-navigation-arrow { transition: none; }
}

@media (max-width: 720px) {
  .player-navigation-summary {
    grid-template-columns: 96px minmax(0, 1fr);
    gap: 10px;
  }

  .player-navigation-arrow {
    width: 60px;
    height: 60px;
    font-size: 2.25rem;
  }

  .map-panel.is-navigation-mode .player-map-legend {
    display: none;
  }

  .map-panel.is-navigation-mode .player-map-guidance-copy {
    padding-left: 9px;
  }
}

@media (max-height: 700px) {
  .map-panel.is-navigation-mode .player-navigation-safety,
  .map-panel.is-navigation-mode .player-map-guide {
    display: none;
  }

  .map-panel.is-navigation-mode .player-map {
    min-height: 250px;
  }
}
`;
}

await patchFile("index.html", patchIndex);
await patchFile("app.js", patchApp);
await patchFile("styles.css", patchStyles);
await patchFile("service-worker.js", (worker) => worker.replace(/escape-erezee-v\d+/g, `escape-erezee-v${VERSION}`));

console.log(`Player in-app guidance v${VERSION} applied.`);
