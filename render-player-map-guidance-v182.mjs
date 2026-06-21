import { readFile, writeFile } from "node:fs/promises";

const VERSION = 182;

async function patchFile(filePath, patcher) {
  const input = await readFile(filePath, "utf8");
  const output = patcher(input);
  if (output !== input) await writeFile(filePath, output, "utf8");
}

function patchIndex(html) {
  let next = html;
  if (!next.includes('id="player-map-guidance"')) {
    next = next.replace(
      /(<div class="map-canvas player-map" id="player-map"[\s\S]*?<\/div>\s*)(<div class="map-actions">[\s\S]*?<\/div>\s*<p class="distance-note")/,
      `$1<div class="player-map-guide" id="player-map-guidance" aria-live="polite">
                  <div class="player-map-legend" aria-label="Légende de la carte">
                    <span><i class="legend-dot legend-player" aria-hidden="true"></i><b id="player-map-legend-you">Vous</b></span>
                    <span><i class="legend-dot legend-target" aria-hidden="true"></i><b id="player-map-legend-target">Prochaine étape</b></span>
                  </div>
                  <div class="player-map-guidance-copy">
                    <strong id="player-map-guidance-status">Activez votre position pour commencer le guidage.</strong>
                    <span id="player-map-guidance-detail"></span>
                  </div>
                </div>
                <div class="map-actions">
                  <button class="secondary-button" type="button" id="locate-button">Me géolocaliser</button>
                  <a class="secondary-button player-directions-link" id="player-directions-link" href="#" target="_blank" rel="noopener">Itinéraire à pied</a>
                </div>
                <p class="distance-note"` ,
    );
  }
  return next
    .replace(/styles\.css\?v=\d+/g, `styles.css?v=${VERSION}`)
    .replace(/app\.js\?v=\d+/g, `app.js?v=${VERSION}`);
}

function patchApp(app) {
  const marker = `/* player-map-guidance-v${VERSION} */`;
  if (app.includes(marker)) return app;

  let next = app.replace(
    '    <button class="map-control-button" type="button" data-map-fullscreen aria-label="Afficher la carte en plein écran" title="Plein écran">⛶</button>',
    '    <button class="map-control-button" type="button" data-map-recenter aria-label="Recentrer la carte" title="Recentrer">&#8857;</button>\n    <button class="map-control-button" type="button" data-map-fullscreen aria-label="Afficher la carte en plein écran" title="Plein écran">⛶</button>',
  );

  next = next.replace(
    '  controls.querySelector("[data-map-fullscreen]").addEventListener("click", (event) => {',
    `  controls.querySelector("[data-map-recenter]")?.addEventListener("click", (event) => {
    event.preventDefault();
    delete container.dataset.mapManualZoom;
    container.dataset.mapKey = "";
    rerenderMap(container);
    if (container.id === "player-map" && typeof requestPlayerPositionRefresh === "function") {
      requestPlayerPositionRefresh(true);
    }
  });
  controls.querySelector("[data-map-fullscreen]").addEventListener("click", (event) => {`,
  );

  next = next.replace(
    '`<span class="map-marker marker-target marker-index-${index % 6}" style="left:${targetPoint.x}px;top:${targetPoint.y}px"><span class="marker-label">${escapeHtml(label)}</span></span>`',
    '`<span class="map-marker marker-target marker-index-${index % 6}" style="left:${targetPoint.x}px;top:${targetPoint.y}px"><span class="marker-symbol" aria-hidden="true">&#9873;</span><span class="marker-label">${escapeHtml(label)}</span></span>`',
  );
  next = next.replace(
    '`<span class="map-marker marker-player marker-index-${index % 6}" style="left:${playerPoint.x}px;top:${playerPoint.y}px"><span class="marker-label">${escapeHtml(label)}</span></span>`',
    '`<span class="map-marker marker-player marker-index-${index % 6}" style="left:${playerPoint.x}px;top:${playerPoint.y}px"><span class="marker-symbol" aria-hidden="true"></span><span class="marker-label">${escapeHtml(label)}</span></span>`',
  );

  const helpers = `${marker}
function playerMapLanguageV182() {
  if (typeof playerLangV151 === "function") return playerLangV151();
  const active = document.querySelector("#language-switcher [aria-pressed='true'], #language-switcher .is-active");
  const language = active?.dataset?.lang || (document.documentElement.lang || "fr").slice(0, 2);
  return ["fr", "en", "nl"].includes(language) ? language : "fr";
}

function playerMapLabelsV182() {
  const labels = {
    fr: {
      you: "Vous",
      target: "Prochaine étape",
      waiting: "Activez votre position pour commencer le guidage.",
      inside: "Vous êtes dans la zone de l'étape.",
      remaining: (distance, direction) => "Encore " + distance + " vers la zone · direction " + direction,
      updated: (time, accuracy) => "Position actualisée à " + time + accuracy,
      accuracy: (meters) => " · précision ±" + meters + " m",
      directions: "Itinéraire à pied",
    },
    en: {
      you: "You",
      target: "Next stop",
      waiting: "Enable your location to start guidance.",
      inside: "You are inside the stop area.",
      remaining: (distance, direction) => distance + " left to the area · head " + direction,
      updated: (time, accuracy) => "Position updated at " + time + accuracy,
      accuracy: (meters) => " · accuracy ±" + meters + " m",
      directions: "Walking directions",
    },
    nl: {
      you: "Jij",
      target: "Volgende halte",
      waiting: "Activeer je locatie om de begeleiding te starten.",
      inside: "Je bent in de zone van de halte.",
      remaining: (distance, direction) => "Nog " + distance + " tot de zone · richting " + direction,
      updated: (time, accuracy) => "Positie bijgewerkt om " + time + accuracy,
      accuracy: (meters) => " · nauwkeurigheid ±" + meters + " m",
      directions: "Wandelroute",
    },
  };
  return labels[playerMapLanguageV182()] || labels.fr;
}

function playerMapDistanceV182(meters) {
  const value = Math.max(0, Number(meters) || 0);
  if (value < 1000) return Math.round(value) + " m";
  return (value / 1000).toFixed(1).replace(".", ",") + " km";
}

function playerMapBearingV182(from, to) {
  const toRad = (value) => (value * Math.PI) / 180;
  const toDeg = (value) => (value * 180) / Math.PI;
  const lat1 = toRad(Number(from.lat));
  const lat2 = toRad(Number(to.lat));
  const deltaLng = toRad(Number(to.lng) - Number(from.lng));
  const y = Math.sin(deltaLng) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(deltaLng);
  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

function playerMapCardinalV182(bearing) {
  const directionsByLanguage = {
    fr: ["N", "NE", "E", "SE", "S", "SO", "O", "NO"],
    en: ["N", "NE", "E", "SE", "S", "SW", "W", "NW"],
    nl: ["N", "NO", "O", "ZO", "Z", "ZW", "W", "NW"],
  };
  const directions = directionsByLanguage[playerMapLanguageV182()] || directionsByLanguage.fr;
  return directions[Math.round(Number(bearing) / 45) % 8];
}

function updatePlayerMapGuidanceV182(team, puzzle, target, playerPosition) {
  const labels = playerMapLabelsV182();
  const status = document.querySelector("#player-map-guidance-status");
  const detail = document.querySelector("#player-map-guidance-detail");
  const youLegend = document.querySelector("#player-map-legend-you");
  const targetLegend = document.querySelector("#player-map-legend-target");
  const directionsLink = document.querySelector("#player-directions-link");
  if (youLegend) youLegend.textContent = labels.you;
  if (targetLegend) targetLegend.textContent = labels.target;
  if (directionsLink) {
    directionsLink.textContent = labels.directions;
    directionsLink.href = "https://www.google.com/maps/dir/?api=1&destination=" + encodeURIComponent(target.lat) + "," + encodeURIComponent(target.lng) + "&travelmode=walking";
  }
  if (!status || !detail) return;
  if (!isUsablePosition(playerPosition)) {
    status.textContent = labels.waiting;
    detail.textContent = "";
    return;
  }
  const distance = distanceInMeters(playerPosition.lat, playerPosition.lng, target.lat, target.lng);
  const radius = getPuzzleRadius(puzzle);
  const remaining = Math.max(0, distance - radius);
  const direction = playerMapCardinalV182(playerMapBearingV182(playerPosition, target));
  status.textContent = distance <= radius ? labels.inside : labels.remaining(playerMapDistanceV182(remaining), direction);
  const accuracyValue = Number(playerPosition.accuracy);
  const accuracy = Number.isFinite(accuracyValue) ? labels.accuracy(Math.round(accuracyValue)) : "";
  const updatedAt = Number(playerPosition.at || team?.updatedAt || Date.now());
  const locale = playerMapLanguageV182() === "nl" ? "nl-BE" : playerMapLanguageV182() === "en" ? "en-GB" : "fr-BE";
  const time = new Date(updatedAt).toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" });
  detail.textContent = labels.updated(time, accuracy);
}
`;

  const renderPlayerMap = `function renderPlayerMap(team, puzzle) {
  const target = {
    lat: getPuzzleLat(puzzle),
    lng: getPuzzleLng(puzzle),
  };
  const labels = playerMapLabelsV182();
  const playerPosition = isUsablePosition(team.lastPosition)
    ? { ...team.lastPosition, label: labels.you }
    : null;
  renderTileMap(els.playerMap, {
    target,
    targets: [{ ...target, radius: getPuzzleRadius(puzzle), label: labels.target }],
    radius: getPuzzleRadius(puzzle),
    player: playerPosition,
    fitToPlayer: true,
    editable: false,
  });
  updatePlayerMapGuidanceV182(team, puzzle, target, playerPosition);
}`;

  next = next.replace(
    /function renderPlayerMap\(team, puzzle\) \{[\s\S]*?\n\}\n\nfunction renderPuzzleMedia/,
    `${helpers}\n${renderPlayerMap}\n\nfunction renderPuzzleMedia`,
  );
  return next;
}

function patchStyles(css) {
  const marker = `/* player-map-guidance-v${VERSION} */`;
  if (css.includes(marker)) return css;
  return `${css.trimEnd()}

${marker}
.player-map {
  height: clamp(280px, 42vh, 360px);
}

.player-map-guide {
  display: grid;
  gap: 10px;
  padding: 12px 2px 2px;
}

.player-map-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 16px;
  align-items: center;
}

.player-map-legend span {
  display: inline-flex;
  gap: 7px;
  align-items: center;
  color: #263c36;
  font-size: 0.82rem;
}

.legend-dot {
  display: inline-block;
  width: 15px;
  height: 15px;
  border: 3px solid #fff;
  border-radius: 50%;
  box-shadow: 0 0 0 1px rgba(19, 34, 31, 0.28);
}

.legend-player {
  background: #087ca7;
}

.legend-target {
  border-radius: 4px;
  background: #f2a91f;
}

.player-map-guidance-copy {
  display: grid;
  gap: 3px;
  padding-left: 12px;
  border-left: 4px solid #087ca7;
}

.player-map-guidance-copy strong {
  color: #132a24;
  font-size: 0.94rem;
  line-height: 1.35;
}

.player-map-guidance-copy span {
  color: var(--muted);
  font-size: 0.78rem;
  font-weight: 750;
}

.map-actions > * {
  flex: 1 1 180px;
  min-width: 0;
  text-align: center;
}

.player-directions-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  text-decoration: none;
}

.map-zone {
  border-width: 3px;
  background: rgba(242, 169, 31, 0.23);
  box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.82);
}

.map-route-line {
  z-index: 1;
  height: 5px;
  background: linear-gradient(90deg, #087ca7 0%, #087ca7 55%, #f2a91f 100%);
  box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.75);
}

.map-route-line::after {
  position: absolute;
  top: 50%;
  right: -2px;
  width: 0;
  height: 0;
  border-top: 7px solid transparent;
  border-bottom: 7px solid transparent;
  border-left: 11px solid #f2a91f;
  content: "";
  transform: translate(70%, -50%);
}

.map-marker {
  min-width: 40px;
  min-height: 40px;
  border-width: 4px;
  box-shadow: 0 7px 18px rgba(11, 45, 38, 0.34);
}

.marker-player {
  z-index: 5;
  background: #087ca7;
  color: #087ca7;
  box-shadow: 0 0 0 7px rgba(8, 124, 167, 0.22), 0 8px 18px rgba(11, 45, 38, 0.34);
  animation: player-map-pulse-v182 1.8s ease-out infinite;
}

.marker-player .marker-symbol {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #fff;
}

.marker-target {
  z-index: 4;
  border-radius: 9px 9px 9px 2px;
  background: #f2a91f;
  color: #9b6200;
}

.marker-target .marker-symbol {
  color: #182b26;
  font-size: 1.15rem;
  line-height: 1;
}

.marker-label {
  top: calc(100% + 12px);
  padding: 6px 9px;
  border: 2px solid rgba(255, 255, 255, 0.88);
  font-size: 0.78rem;
  box-shadow: 0 5px 14px rgba(11, 45, 38, 0.22);
}

@keyframes player-map-pulse-v182 {
  0%, 100% { box-shadow: 0 0 0 6px rgba(8, 124, 167, 0.26), 0 8px 18px rgba(11, 45, 38, 0.34); }
  50% { box-shadow: 0 0 0 12px rgba(8, 124, 167, 0.08), 0 8px 18px rgba(11, 45, 38, 0.34); }
}

@media (prefers-reduced-motion: reduce) {
  .marker-player { animation: none; }
}

@media (max-width: 720px) {
  .player-map {
    height: min(54vh, 390px);
    min-height: 310px;
  }

  .map-controls {
    gap: 4px;
  }

  .map-control-button {
    width: 38px;
    height: 38px;
    min-width: 38px;
  }

  .map-actions {
    display: grid;
    grid-template-columns: 1fr 1fr;
  }

  .map-actions > * {
    width: 100%;
    min-height: 46px;
    padding-inline: 10px;
    white-space: normal;
  }
}

@media (max-width: 390px) {
  .map-actions {
    grid-template-columns: 1fr;
  }
}
`;
}

await patchFile("index.html", patchIndex);
await patchFile("app.js", patchApp);
await patchFile("styles.css", patchStyles);
await patchFile("service-worker.js", (worker) => worker.replace(/escape-erezee-v\d+/g, `escape-erezee-v${VERSION}`));

console.log(`Player map guidance v${VERSION} applied.`);
