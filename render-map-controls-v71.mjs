import { readFile, writeFile } from "node:fs/promises";

const VERSION = 71;

async function patchTextFile(filePath, patcher) {
  const input = await readFile(filePath, "utf8");
  const output = patcher(input);
  if (output !== input) {
    await writeFile(filePath, output, "utf8");
  }
}

function ensureIndex(html) {
  return html
    .replace(/styles\.css\?v=\d+/g, `styles.css?v=${VERSION}`)
    .replace(/app\.js\?v=\d+/g, `app.js?v=${VERSION}`);
}

function ensureApp(app) {
  let next = app;

  if (!next.includes("const MAP_MAX_ZOOM = 19;")) {
    next = next.replace(
      "const MAP_MIN_ZOOM = 3;\nconst MAP_PADDING = 56;",
      "const MAP_MIN_ZOOM = 3;\nconst MAP_MAX_ZOOM = 19;\nconst MAP_PADDING = 56;",
    );
  }

  if (!next.includes("const mapRenderOptions = new WeakMap();")) {
    next = next.replace(
      "let playerRouteRefreshPromise = null;\nlet lastPlayerRouteRefreshAt = 0;",
      "let playerRouteRefreshPromise = null;\nlet lastPlayerRouteRefreshAt = 0;\nconst mapRenderOptions = new WeakMap();",
    );
  }

  if (!next.includes("function clampMapZoom(value)")) {
    next = next.replace(
      "function renderTileMap(container, options) {",
      `function clampMapZoom(value) {
  const zoom = Number(value);
  if (!Number.isFinite(zoom)) return MAP_ZOOM;
  return Math.min(MAP_MAX_ZOOM, Math.max(MAP_MIN_ZOOM, Math.round(zoom)));
}

function getMapZoomOverride(container, fallbackZoom) {
  const manualZoom = Number(container.dataset.mapManualZoom);
  return clampMapZoom(Number.isFinite(manualZoom) ? manualZoom : fallbackZoom);
}

function rerenderMap(container) {
  if (!container) return;
  window.setTimeout(() => {
    container.dataset.mapKey = "";
    const options = mapRenderOptions.get(container);
    if (options) renderTileMap(container, options);
  }, 80);
}

function zoomMap(container, delta) {
  const currentZoom = Number(container.dataset.mapCurrentZoom);
  const nextZoom = clampMapZoom((Number.isFinite(currentZoom) ? currentZoom : MAP_ZOOM) + delta);
  container.dataset.mapManualZoom = String(nextZoom);
  rerenderMap(container);
}

function toggleMapFullscreen(container) {
  const requestFullscreen = container.requestFullscreen || container.webkitRequestFullscreen;
  const exitFullscreen = document.exitFullscreen || document.webkitExitFullscreen;
  const fullscreenElement = document.fullscreenElement || document.webkitFullscreenElement;
  if (!requestFullscreen || !exitFullscreen) {
    showToast("Le plein écran n’est pas disponible sur ce navigateur.");
    return;
  }
  const action = fullscreenElement === container
    ? exitFullscreen.call(document)
    : requestFullscreen.call(container);
  Promise.resolve(action)
    .then(() => rerenderMap(container))
    .catch(() => showToast("Le plein écran n’a pas pu être ouvert."));
}

function ensureMapControls(container) {
  if (!container.matches("#player-map, #admin-map, #team-live-map")) return;
  if (!document.body.dataset.mapFullscreenBound) {
    document.body.dataset.mapFullscreenBound = "1";
    ["fullscreenchange", "webkitfullscreenchange"].forEach((eventName) => {
      document.addEventListener(eventName, () => {
        $$("#player-map, #admin-map, #team-live-map").forEach(rerenderMap);
      });
    });
  }
  if (container.querySelector(".map-controls")) return;
  const controls = document.createElement("div");
  controls.className = "map-controls";
  controls.innerHTML = ` + "`" + `
    <button class="map-control-button" type="button" data-map-zoom-out aria-label="Dézoomer la carte" title="Dézoomer">-</button>
    <button class="map-control-button" type="button" data-map-zoom-in aria-label="Zoomer la carte" title="Zoomer">+</button>
    <button class="map-control-button" type="button" data-map-fullscreen aria-label="Afficher la carte en plein écran" title="Plein écran">⛶</button>
  ` + "`" + `;
  controls.addEventListener("click", (event) => event.stopPropagation());
  controls.querySelector("[data-map-zoom-out]").addEventListener("click", (event) => {
    event.preventDefault();
    zoomMap(container, -1);
  });
  controls.querySelector("[data-map-zoom-in]").addEventListener("click", (event) => {
    event.preventDefault();
    zoomMap(container, 1);
  });
  controls.querySelector("[data-map-fullscreen]").addEventListener("click", (event) => {
    event.preventDefault();
    toggleMapFullscreen(container);
  });
  container.appendChild(controls);
}

function renderTileMap(container, options = {}) {`,
    );
  }

  next = next.replace(
    "function renderTileMap(container, options) {\n  if (!container) return;",
    "function renderTileMap(container, options = {}) {\n  if (!container) return;\n  mapRenderOptions.set(container, options);",
  );
  next = next.replace(
    "function renderTileMap(container, options = {}) {\n  if (!container) return;\n  const rect = container.getBoundingClientRect();",
    "function renderTileMap(container, options = {}) {\n  if (!container) return;\n  mapRenderOptions.set(container, options);\n  const rect = container.getBoundingClientRect();",
  );
  next = next.replace(
    "  const center = view.center;\n  const zoom = view.zoom;",
    "  const center = view.center;\n  const zoom = getMapZoomOverride(container, view.zoom);",
  );
  next = next.replace(
    "  container.dataset.mapKey = renderKey;\n\n  const tiles = container.querySelector(\".map-tiles\");",
    "  container.dataset.mapKey = renderKey;\n  container.dataset.mapCurrentZoom = String(zoom);\n  ensureMapControls(container);\n\n  const tiles = container.querySelector(\".map-tiles\");",
  );
  next = next.replace(
    "  const centerWorld = latLngToWorld(target.lat, target.lng);\n  const topLeft = {",
    "  const zoom = Number(els.adminMap?.dataset.mapCurrentZoom) || MAP_ZOOM;\n  const centerWorld = latLngToWorld(target.lat, target.lng, zoom);\n  const topLeft = {",
  );
  next = next.replace(
    "  const point = worldToLatLng(topLeft.x + event.clientX - rect.left, topLeft.y + event.clientY - rect.top);",
    "  const point = worldToLatLng(topLeft.x + event.clientX - rect.left, topLeft.y + event.clientY - rect.top, zoom);",
  );
  next = next.replace(
    "  $$(\"[data-delete-team]\").forEach((button) => {\n    button.addEventListener(\"click\", () => deleteTeamFromProgress(button.dataset.deleteTeam));\n  });\n}",
    "  $$(\"[data-delete-team]\").forEach((button) => {\n    button.addEventListener(\"click\", () => deleteTeamFromProgress(button.dataset.deleteTeam));\n  });\n  renderTeamLiveMap();\n}",
  );

  return next;
}

function ensureStyles(css) {
  if (css.includes("/* map-controls-v71 */")) return css;
  return `${css}

/* map-controls-v71 */
.map-controls {
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 7;
  display: flex;
  gap: 6px;
  padding: 4px;
  border: 1px solid rgba(19, 34, 31, 0.12);
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 10px 24px rgba(18, 60, 50, 0.16);
}

.map-control-button {
  display: grid;
  width: 34px;
  height: 34px;
  min-width: 34px;
  place-items: center;
  padding: 0;
  border: 1px solid #cbd9d3;
  border-radius: 6px;
  background: #ffffff;
  color: var(--green);
  font-size: 1.05rem;
  font-weight: 900;
  line-height: 1;
}

.map-control-button:hover,
.map-control-button:focus-visible {
  border-color: var(--green);
  background: #edf5f1;
}

.map-canvas:fullscreen,
.map-canvas:-webkit-full-screen {
  width: 100vw;
  height: 100vh;
  border: 0;
  border-radius: 0;
}

.map-canvas:fullscreen .map-controls,
.map-canvas:-webkit-full-screen .map-controls {
  top: 14px;
  right: 14px;
}

.map-canvas:fullscreen .map-control-button,
.map-canvas:-webkit-full-screen .map-control-button {
  width: 42px;
  height: 42px;
  min-width: 42px;
}
`;
}

await patchTextFile("index.html", ensureIndex);
await patchTextFile("app.js", ensureApp);
await patchTextFile("styles.css", ensureStyles);
await patchTextFile("service-worker.js", (worker) => worker.replace(/escape-erezee-v\d+/g, `escape-erezee-v${VERSION}`));

console.log("Map controls v71 applique.");
