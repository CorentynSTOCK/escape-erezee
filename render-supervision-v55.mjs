import { readFile, writeFile } from "node:fs/promises";

const VERSION = 55;

async function patchTextFile(filePath, patcher) {
  const input = await readFile(filePath, "utf8");
  const output = patcher(input);
  if (output !== input) {
    await writeFile(filePath, output, "utf8");
  }
}

function replaceBetween(source, startMarker, endMarker, replacement) {
  const start = source.indexOf(startMarker);
  if (start === -1) return source;
  const end = source.indexOf(endMarker, start);
  if (end === -1) return source;
  return `${source.slice(0, start)}${replacement}${source.slice(end)}`;
}

function insertAfter(source, marker, insertion) {
  if (source.includes(insertion.trim())) return source;
  const index = source.indexOf(marker);
  if (index === -1) return source;
  return `${source.slice(0, index + marker.length)}${insertion}${source.slice(index + marker.length)}`;
}

function ensureIndex(html) {
  html = html
    .replace(/styles\.css\?v=\d+/g, `styles.css?v=${VERSION}`)
    .replace(/app\.js\?v=\d+/g, `app.js?v=${VERSION}`);

  if (!html.includes('data-map-zoom="player-in"')) {
    html = html.replace(
      `                  <div class="map-layer" aria-hidden="true"></div>
                  <div class="map-attribution">`,
      `                  <div class="map-layer" aria-hidden="true"></div>
                  <div class="map-zoom-controls" aria-label="Zoom carte joueur">
                    <button type="button" data-map-zoom="player-in" aria-label="Zoomer">+</button>
                    <button type="button" data-map-zoom="player-out" aria-label="Dézoomer">-</button>
                    <button type="button" data-map-zoom="player-reset" aria-label="Ajuster la carte">⌖</button>
                  </div>
                  <div class="map-attribution">`,
    );
  }

  if (!html.includes('id="team-live-refresh"')) {
    html = html.replace(
      /<section class="admin-panel wide-panel" aria-labelledby="teams-heading">[\s\S]*?<section class="admin-panel" aria-labelledby="codes-heading">/,
      `${teamSectionHtml()}

            <section class="admin-panel" aria-labelledby="codes-heading">`,
    );
  }

  if (!html.includes('id="monitor-view"')) {
    html = html.replace(
      `      </main>`,
      `${monitorViewHtml()}
      </main>`,
    );
  }

  return html;
}

function teamSectionHtml() {
  return `            <section class="admin-panel wide-panel" aria-labelledby="teams-heading">
              <div class="panel-title">
                <div>
                  <p class="section-label">Équipes</p>
                  <h2 id="teams-heading">Progression en direct</h2>
                </div>
                <a class="secondary-button" href="#monitor">Écran supervision</a>
              </div>
              <div class="team-live-toolbar">
                <span id="team-live-updated">Suivi en attente de position.</span>
                <div class="team-live-actions">
                  <button class="secondary-button" type="button" id="team-live-refresh">Actualiser</button>
                  <button class="secondary-button" type="button" id="team-live-select-all">Tout suivre</button>
                  <button class="secondary-button" type="button" id="team-live-clear">Tout afficher</button>
                </div>
              </div>
              <div class="team-follow-list" id="team-follow-list"></div>
              <div class="map-canvas live-team-map" id="team-live-map" aria-label="Carte des équipes en direct">
                <div class="map-tiles" aria-hidden="true"></div>
                <div class="map-layer" aria-hidden="true"></div>
                <div class="map-zoom-controls" aria-label="Zoom carte équipes">
                  <button type="button" data-map-zoom="live-in" aria-label="Zoomer">+</button>
                  <button type="button" data-map-zoom="live-out" aria-label="Dézoomer">-</button>
                  <button type="button" data-map-zoom="live-reset" aria-label="Ajuster la carte">⌖</button>
                </div>
                <div class="map-attribution">© OpenStreetMap</div>
              </div>
              <div class="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Équipe</th>
                      <th>Code</th>
                      <th>Parcours</th>
                      <th>Progression</th>
                      <th>Position</th>
                      <th>État</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody id="team-table"></tbody>
                </table>
              </div>
            </section>`;
}

function monitorViewHtml() {
  return `

        <section class="view monitor-view" id="monitor-view" aria-labelledby="monitor-title">
          <header class="monitor-topbar">
            <div>
              <p class="section-label">Supervision terrain</p>
              <h1 id="monitor-title">Suivi des équipes</h1>
              <p id="monitor-updated">Suivi en attente de position.</p>
            </div>
            <div class="topbar-actions">
              <button class="secondary-button" type="button" id="monitor-refresh">Actualiser</button>
              <button class="secondary-button" type="button" id="monitor-fullscreen">Plein écran</button>
              <a class="primary-button" href="#admin">Retour gestion</a>
            </div>
          </header>
          <div class="monitor-layout">
            <aside class="monitor-sidebar">
              <h2>Équipes suivies</h2>
              <div class="team-follow-list" id="monitor-follow-list"></div>
            </aside>
            <section class="monitor-map-panel" aria-label="Carte de supervision">
              <div class="map-canvas monitor-map" id="monitor-map" aria-label="Carte plein écran des équipes">
                <div class="map-tiles" aria-hidden="true"></div>
                <div class="map-layer" aria-hidden="true"></div>
                <div class="map-zoom-controls" aria-label="Zoom carte supervision">
                  <button type="button" data-map-zoom="monitor-in" aria-label="Zoomer">+</button>
                  <button type="button" data-map-zoom="monitor-out" aria-label="Dézoomer">-</button>
                  <button type="button" data-map-zoom="monitor-reset" aria-label="Ajuster la carte">⌖</button>
                </div>
                <div class="map-attribution">© OpenStreetMap</div>
              </div>
            </section>
          </div>
        </section>`;
}

function ensureApp(app) {
  app = insertAfter(app, `    admin: $("#admin-view"),
`, `    monitor: $("#monitor-view"),
`);
  app = insertAfter(app, `  teamLiveMap: $("#team-live-map"),
`, `  teamFollowList: $("#team-follow-list"),
  teamLiveUpdated: $("#team-live-updated"),
  teamLiveRefreshButton: $("#team-live-refresh"),
  teamLiveSelectAllButton: $("#team-live-select-all"),
  teamLiveClearButton: $("#team-live-clear"),
  monitorMap: $("#monitor-map"),
  monitorFollowList: $("#monitor-follow-list"),
  monitorUpdated: $("#monitor-updated"),
  monitorRefreshButton: $("#monitor-refresh"),
  monitorFullscreenButton: $("#monitor-fullscreen"),
`);
  app = insertAfter(app, `const MAP_MIN_ZOOM = 3;
`, `const MAP_MAX_ZOOM = 19;
`);
  app = insertAfter(app, `const DEFAULT_CENTER = { lat: 50.29225, lng: 5.55995 };
`, `const LIVE_TEAM_FILTER_KEY = "escape-erezee-live-team-filter";
`);
  app = insertAfter(app, `let lastLiveTeamRefreshAt = 0;
`, `let lastLiveTeamRefreshCompletedAt = 0;
`);
  app = insertAfter(app, `let lastPlayerRouteRefreshAt = 0;
`, `let selectedLiveTeamIds = new Set(loadLiveTeamSelection());
let mapZoomOffsets = { player: 0, live: 0, monitor: 0 };
`);

  app = replaceBetween(app, "async function refreshLiveTeamsFromServer", "async function refreshPlayerRoutesFromServer", refreshLiveTeamsFunction());
  app = replaceBetween(app, "function isAdminRouteActive()", "function renderAdminAccess()", `function isAdminRouteActive() {
  return isSupervisionRouteActive();
}

`);
  app = replaceBetween(app, "function setHashView()", "function showToast", `${supervisionHelpers()}${setHashViewFunction()}

`);
  app = app.replace(
    `  const center = view.center;
  const zoom = view.zoom;`,
    `  const center = view.center;
  const zoom = clampMapZoom((view.zoom || MAP_ZOOM) + (Number(options.zoomOffset) || 0));`,
  );
  app = app.replace(
    `    fitToPlayer: true,
    editable: false,`,
    `    fitToPlayer: true,
    zoomOffset: mapZoomOffsets.player,
    editable: false,`,
  );
  app = replaceBetween(app, "function startTicker()", "function renderShop()", `${tickerAndRenderFunction()}

`);
  app = app.replaceAll("saveData();\n  els.distanceNote.textContent = unlockMessage;", "saveData({ immediate: true });\n  els.distanceNote.textContent = unlockMessage;");
  app = app.replaceAll("saveData();\n    renderPlayerMap(team, puzzle);", "saveData({ immediate: true });\n    renderPlayerMap(team, puzzle);");
  app = app.replaceAll("saveData();\n  renderPlayerMap(team, puzzle);", "saveData({ immediate: true });\n  renderPlayerMap(team, puzzle);");
  app = app.replace(
    `{ enableHighAccuracy: true, maximumAge: 1000, timeout: 15000 },`,
    `{ enableHighAccuracy: true, maximumAge: 0, timeout: 10000 },`,
  );
  if (!app.includes("code.teamDeletedAt")) {
    app = app.replace(
      `  if (!code) {
    els.activationMessage.textContent = "Code introuvable.";
    return;
  }

  let team = code.teamId ? data.teams.find((item) => item.id === code.teamId) : null;`,
      `  if (!code) {
    els.activationMessage.textContent = "Code introuvable.";
    return;
  }

  if (code.teamDeletedAt) {
    els.activationMessage.textContent = "Cette partie terminée a été retirée de la progression.";
    return;
  }

  let team = code.teamId ? data.teams.find((item) => item.id === code.teamId) : null;`,
    );
  }
  app = app.replace(
    /  if \(els\.demoUnlockButton\) \{\s*if \(els\.demoUnlockButton\) \{\s*if \(els\.demoUnlockButton\) \{\s*els\.demoUnlockButton\.disabled = !currentPuzzle\.requireLocation \|\| team\.status !== "playing" \|\| unlocked;\s*\}\s*\}\s*\}/,
    `  if (els.demoUnlockButton) {
    els.demoUnlockButton.disabled = !currentPuzzle.requireLocation || team.status !== "playing" || unlocked;
  }`,
  );

  const liveStart = app.includes("function getTeamStatusMeta(")
    ? app.indexOf("function getTeamStatusMeta(")
    : app.indexOf("function renderTeamLiveMap()");
  const liveEnd = app.indexOf("function renderCodeList()", liveStart);
  if (liveStart !== -1 && liveEnd !== -1) {
    app = `${app.slice(0, liveStart)}${liveSupervisionFunctions()}${app.slice(liveEnd)}`;
  }
  if (!app.includes('teamLiveRefreshButton?.addEventListener("click"')) {
    app = app.replace(
      `  els.demoUnlockButton?.addEventListener("click", unlockCurrentPuzzleByDemo);
  els.adminLoginForm.addEventListener("submit", handleAdminLogin);`,
      `  els.demoUnlockButton?.addEventListener("click", unlockCurrentPuzzleByDemo);
  $$("[data-map-zoom]").forEach((button) => {
    button.addEventListener("click", () => handleMapZoomAction(button.dataset.mapZoom));
  });
  els.teamLiveRefreshButton?.addEventListener("click", () => refreshLiveTeamsFromServer({ force: true }));
  els.teamLiveSelectAllButton?.addEventListener("click", selectAllLiveTeams);
  els.teamLiveClearButton?.addEventListener("click", clearLiveTeamSelection);
  els.monitorRefreshButton?.addEventListener("click", () => refreshLiveTeamsFromServer({ force: true }));
  els.monitorFullscreenButton?.addEventListener("click", requestMonitorFullscreen);
  els.adminLoginForm.addEventListener("submit", handleAdminLogin);`,
    );
  }
  return app;
}

function refreshLiveTeamsFunction() {
  return `async function refreshLiveTeamsFromServer(options = {}) {
  if (!serverSyncEnabled || !canUseBackend() || liveTeamRefreshInFlight) return;
  if (!options.force && (!isAdminRouteActive() || !adminAuthenticated)) return;
  if (!adminAuthenticated) return;

  liveTeamRefreshInFlight = true;
  lastLiveTeamRefreshAt = Date.now();
  try {
    const response = await fetch(API_DATA_URL, {
      headers: { Accept: "application/json" },
      cache: "no-store",
      credentials: "same-origin",
    });
    if (!response.ok) return;

    const serverData = await response.json();
    if (!isValidAppData(serverData)) return;

    data.teams = serverData.teams;
    data.codes = serverData.codes;
    saveData({ sync: false });
    lastLiveTeamRefreshCompletedAt = Date.now();
    renderTeamTable();
    renderCodeList();
    renderMonitor();
  } catch (error) {
    console.warn(error);
  } finally {
    liveTeamRefreshInFlight = false;
    updateLiveStatusLabels();
  }
}

`;
}

function supervisionHelpers() {
  return `function loadLiveTeamSelection() {
  try {
    const stored = JSON.parse(localStorage.getItem(LIVE_TEAM_FILTER_KEY) || "[]");
    return Array.isArray(stored) ? stored.filter((id) => typeof id === "string") : [];
  } catch {
    return [];
  }
}

function saveLiveTeamSelection() {
  localStorage.setItem(LIVE_TEAM_FILTER_KEY, JSON.stringify([...selectedLiveTeamIds]));
}

function isSupervisionRouteActive() {
  return ["admin", "monitor"].includes(location.hash.replace("#", ""));
}

function clampMapZoom(value) {
  return Math.max(MAP_MIN_ZOOM, Math.min(MAP_MAX_ZOOM, Math.round(value)));
}

function changeMapZoom(kind, delta) {
  if (!Object.prototype.hasOwnProperty.call(mapZoomOffsets, kind)) return;
  mapZoomOffsets[kind] = Math.max(-8, Math.min(8, mapZoomOffsets[kind] + delta));
  renderPlayer();
  renderTeamTable();
  renderMonitor();
}

function resetMapZoom(kind) {
  if (!Object.prototype.hasOwnProperty.call(mapZoomOffsets, kind)) return;
  mapZoomOffsets[kind] = 0;
  renderPlayer();
  renderTeamTable();
  renderMonitor();
}

function handleMapZoomAction(action) {
  const [kind, direction] = String(action || "").split("-");
  if (direction === "in") {
    changeMapZoom(kind, 1);
    return;
  }
  if (direction === "out") {
    changeMapZoom(kind, -1);
    return;
  }
  resetMapZoom(kind);
}

`;
}

function setHashViewFunction() {
  return `function setHashView() {
  const requestedView = location.hash.replace("#", "");
  const view = ["home", "shop", "player", "admin", "monitor"].includes(requestedView) ? requestedView : "home";
  Object.entries(els.views).forEach(([name, element]) => {
    element.classList.toggle("is-active", name === view);
  });
  els.navLinks.forEach((link) => {
    link.classList.toggle("is-active", link.dataset.route === view);
  });
  if ((view === "admin" || view === "monitor") && !adminSessionChecked) {
    checkAdminSession().then(() => {
      if (isSupervisionRouteActive()) {
        renderAdmin();
        renderMonitor();
      }
    });
  }
  render();
}`;
}

function tickerAndRenderFunction() {
  return `function startTicker() {
  clearInterval(ticker);
  ticker = setInterval(() => {
    const team = getCurrentTeam();
    if (team) {
      const route = getRoute(team.routeId);
      checkGameStatus(team, route);
      renderPlayer();
    }
    if (isAdminRouteActive() && adminAuthenticated && Date.now() - lastLiveTeamRefreshAt > 2000) {
      refreshLiveTeamsFromServer();
    }
    renderTeamTable();
    renderMonitor();
  }, 1000);
}

function render() {
  renderPlayer();
  renderAdmin();
  renderMonitor();
}`;
}

function liveSupervisionFunctions() {
  return `function getTeamStatusMeta(team) {
  if (team.status === "won") return { label: "Gagné", className: "is-success" };
  if (team.status === "lost") return { label: "Perdu", className: "is-danger" };
  if (team.status === "briefing") return { label: "Briefing", className: "is-briefing" };
  return { label: "En cours", className: "" };
}

function canDeleteTeamFromProgress(team) {
  return team?.status === "won" || team?.status === "lost";
}

function pruneLiveTeamSelection() {
  const validIds = new Set(data.teams.map((team) => team.id));
  const before = selectedLiveTeamIds.size;
  selectedLiveTeamIds = new Set([...selectedLiveTeamIds].filter((id) => validIds.has(id)));
  if (selectedLiveTeamIds.size !== before) saveLiveTeamSelection();
}

function getLiveTeamRows() {
  pruneLiveTeamSelection();
  return data.teams
    .map((team) => {
      const route = getRoute(team.routeId);
      if (!route) return null;
      return { team, route, details: getTeamPositionDetails(team, route) };
    })
    .filter(Boolean);
}

function getLiveTeamEntries() {
  const entries = getLiveTeamRows().filter((entry) => entry.details);
  if (!selectedLiveTeamIds.size) return entries;
  return entries.filter((entry) => selectedLiveTeamIds.has(entry.team.id));
}

function bindFollowControls(container) {
  container?.querySelectorAll("[data-follow-team]").forEach((input) => {
    input.addEventListener("change", () => {
      if (input.checked) {
        selectedLiveTeamIds.add(input.dataset.followTeam);
      } else {
        selectedLiveTeamIds.delete(input.dataset.followTeam);
      }
      saveLiveTeamSelection();
      renderTeamTable();
      renderMonitor();
    });
  });
}

function renderTeamFollowControls(container) {
  if (!container) return;
  const rows = getLiveTeamRows();
  if (!rows.length) {
    container.innerHTML = \`<p class="position-muted">Aucune équipe à suivre pour le moment.</p>\`;
    return;
  }

  container.innerHTML = rows
    .map(({ team, route, details }) => {
      const checked = selectedLiveTeamIds.has(team.id);
      const status = getTeamStatusMeta(team);
      const positionLabel = details ? \`GPS \${details.ageLabel}\` : "GPS en attente";
      return \`
        <label class="follow-chip \${checked ? "is-selected" : ""}">
          <input type="checkbox" data-follow-team="\${escapeHtml(team.id)}" \${checked ? "checked" : ""} />
          <span>
            <strong>\${escapeHtml(team.name)}</strong>
            <small>\${escapeHtml(route.title)} · \${status.label} · \${positionLabel}</small>
          </span>
        </label>
      \`;
    })
    .join("");
  bindFollowControls(container);
}

function updateLiveStatusLabels() {
  const selectedCount = selectedLiveTeamIds.size;
  const positionCount = getLiveTeamEntries().length;
  const refreshText = liveTeamRefreshInFlight
    ? "Actualisation en cours..."
    : lastLiveTeamRefreshCompletedAt
      ? \`Dernière mise à jour \${formatRelativeTime(lastLiveTeamRefreshCompletedAt)}.\`
      : "Suivi en attente de position.";
  const followText = selectedCount
    ? \`\${selectedCount} équipe\${selectedCount > 1 ? "s" : ""} suivie\${selectedCount > 1 ? "s" : ""}.\`
    : "Toutes les équipes avec GPS sont affichées.";
  const text = \`\${refreshText} \${followText} \${positionCount} position\${positionCount > 1 ? "s" : ""} visible\${positionCount > 1 ? "s" : ""}.\`;
  if (els.teamLiveUpdated) els.teamLiveUpdated.textContent = text;
  if (els.monitorUpdated) els.monitorUpdated.textContent = text;
}

function renderEmptyTeamMap(container, kind, message) {
  const route = getActiveRoute();
  const target = route?.puzzles?.[0]
    ? { lat: getPuzzleLat(route.puzzles[0]), lng: getPuzzleLng(route.puzzles[0]), radius: getPuzzleRadius(route.puzzles[0]) }
    : { ...DEFAULT_CENTER, radius: 120 };
  renderTileMap(container, {
    target,
    radius: target.radius,
    zoomOffset: mapZoomOffsets[kind] || 0,
    editable: false,
  });
  const layer = container.querySelector(".map-layer");
  layer?.querySelectorAll(".map-empty-note").forEach((node) => node.remove());
  layer?.insertAdjacentHTML("beforeend", \`<span class="map-empty-note">\${escapeHtml(message)}</span>\`);
}

function renderTeamMap(container, kind = "live") {
  if (!container) return;
  const entries = getLiveTeamEntries();
  if (!entries.length) {
    const message = selectedLiveTeamIds.size
      ? "Les équipes suivies n'ont pas encore transmis de position GPS."
      : "Aucune position joueur reçue pour le moment.";
    renderEmptyTeamMap(container, kind, message);
    return;
  }

  renderTileMap(container, {
    fitToPoints: true,
    zoomOffset: mapZoomOffsets[kind] || 0,
    players: entries.map((entry, index) => ({
      ...entry.details.position,
      label: \`\${index + 1}. \${entry.team.name}\`,
      variant: String(index % 6),
    })),
    targets: entries
      .filter((entry) => entry.details.target)
      .map((entry, index) => ({
        lat: entry.details.target.lat,
        lng: entry.details.target.lng,
        radius: entry.details.target.radius,
        label: \`Obj. \${index + 1}\`,
      })),
  });
}

function renderTeamLiveMap() {
  renderTeamFollowControls(els.teamFollowList);
  renderTeamMap(els.teamLiveMap, "live");
  updateLiveStatusLabels();
}

function deleteFinishedTeam(teamId) {
  const team = data.teams.find((item) => item.id === teamId);
  if (!team) return;
  if (!canDeleteTeamFromProgress(team)) {
    showToast("Seules les équipes terminées peuvent être supprimées.");
    return;
  }
  if (!window.confirm(\`Supprimer \${team.name} de la progression ?\`)) return;

  data.teams = data.teams.filter((item) => item.id !== teamId);
  const code = data.codes.find((item) => item.teamId === teamId || item.code === team.code);
  if (code) {
    code.teamId = null;
    code.teamDeletedAt = Date.now();
    code.status = "used";
  }
  selectedLiveTeamIds.delete(teamId);
  saveLiveTeamSelection();
  saveData({ immediate: true });
  renderAdmin();
  renderMonitor();
  showToast("Équipe supprimée de la progression.");
}

function renderTeamTable() {
  if (!els.teamTable) return;
  renderTeamLiveMap();
  const rows = getLiveTeamRows();
  els.teamTable.innerHTML = rows.length
    ? rows
        .map(({ team, route }) => {
          const progress = getTeamProgress(team, route);
          const status = getTeamStatusMeta(team);
          const deleteButton = canDeleteTeamFromProgress(team)
            ? \`<button class="danger-button compact-button" type="button" data-delete-team="\${escapeHtml(team.id)}">Supprimer</button>\`
            : \`<span class="position-muted">Partie active</span>\`;
          return \`
            <tr>
              <td>
                <label class="table-follow-check">
                  <input type="checkbox" data-follow-team="\${escapeHtml(team.id)}" \${selectedLiveTeamIds.has(team.id) ? "checked" : ""} />
                  <span>Suivre</span>
                </label>
                <strong>\${escapeHtml(team.name)}</strong>
              </td>
              <td>\${escapeHtml(team.code)}</td>
              <td>\${escapeHtml(route.title)}</td>
              <td>
                <div class="mini-progress">
                  <span>\${progress.solved} / \${progress.total}</span>
                  <span class="mini-progress-bar"><span style="width:\${progress.percent}%"></span></span>
                </div>
              </td>
              <td>\${renderTeamPosition(team, route)}</td>
              <td><span class="state-text \${status.className}">\${status.label}</span></td>
              <td>\${deleteButton}</td>
            </tr>
          \`;
        })
        .join("")
    : \`<tr><td colspan="7">Aucune équipe connectée.</td></tr>\`;

  bindFollowControls(els.teamTable);
  els.teamTable.querySelectorAll("[data-delete-team]").forEach((button) => {
    button.addEventListener("click", () => deleteFinishedTeam(button.dataset.deleteTeam));
  });
}

function renderMonitor() {
  if (!els.monitorMap) return;
  if (canUseBackend() && !adminAuthenticated) {
    if (els.monitorFollowList) {
      els.monitorFollowList.innerHTML = \`<p class="position-muted">Connectez-vous dans la gestion pour ouvrir la supervision.</p>\`;
    }
    if (els.monitorUpdated) {
      els.monitorUpdated.textContent = "Connexion gestion requise.";
    }
    renderEmptyTeamMap(els.monitorMap, "monitor", "Connexion gestion requise pour voir les positions.");
    return;
  }

  renderTeamFollowControls(els.monitorFollowList);
  renderTeamMap(els.monitorMap, "monitor");
  updateLiveStatusLabels();
}

function selectAllLiveTeams() {
  selectedLiveTeamIds = new Set(getLiveTeamRows().map((entry) => entry.team.id));
  saveLiveTeamSelection();
  renderTeamTable();
  renderMonitor();
}

function clearLiveTeamSelection() {
  selectedLiveTeamIds.clear();
  saveLiveTeamSelection();
  renderTeamTable();
  renderMonitor();
}

function requestMonitorFullscreen() {
  const target = els.views.monitor || document.documentElement;
  if (document.fullscreenElement) {
    document.exitFullscreen?.();
    return;
  }
  target.requestFullscreen?.().catch(() => {
    showToast("Le plein écran n'a pas pu être ouvert automatiquement.");
  });
}

`;
}

function ensureStyles(css) {
  if (css.includes("/* supervision-v55 */")) return css;
  return `${css}

/* supervision-v55 */
.map-zoom-controls {
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 6;
  display: grid;
  gap: 5px;
  pointer-events: auto;
}

.map-zoom-controls button {
  display: grid;
  width: 34px;
  height: 34px;
  min-height: 34px;
  place-items: center;
  border: 1px solid rgba(19, 34, 31, 0.16);
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.94);
  color: var(--green);
  box-shadow: 0 6px 16px rgba(18, 60, 50, 0.14);
  font-size: 1rem;
  font-weight: 950;
}

.team-live-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
  color: var(--muted);
  font-size: 0.86rem;
  font-weight: 800;
}

.team-live-actions,
.team-follow-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.team-follow-list {
  margin-bottom: 12px;
}

.follow-chip {
  display: flex;
  min-width: min(100%, 230px);
  flex: 1 1 230px;
  align-items: flex-start;
  gap: 9px;
  padding: 10px;
  border: 1px solid var(--line);
  border-radius: 6px;
  background: #fbfdfc;
  color: var(--ink);
  cursor: pointer;
}

.follow-chip.is-selected {
  border-color: rgba(44, 127, 163, 0.45);
  background: #eff8f7;
}

.follow-chip input,
.table-follow-check input {
  width: 16px;
  min-height: 16px;
  accent-color: var(--green);
}

.follow-chip span,
.table-follow-check {
  display: grid;
  gap: 3px;
}

.follow-chip small {
  color: var(--muted);
  font-size: 0.72rem;
  font-weight: 800;
  line-height: 1.35;
}

table {
  min-width: 980px;
}

.table-follow-check {
  display: inline-grid;
  grid-auto-flow: column;
  align-items: center;
  margin: 0 0 5px;
  color: var(--muted);
  font-size: 0.72rem;
  font-weight: 900;
}

.compact-button {
  min-height: 34px;
  padding: 0 10px;
}

.monitor-view {
  min-height: 100vh;
  padding: 0;
  background: #f4f7f5;
}

.monitor-view.is-active {
  display: grid;
  grid-template-rows: auto 1fr;
}

.app-shell:has(#monitor-view.is-active) {
  grid-template-columns: 1fr;
}

.app-shell:has(#monitor-view.is-active) .side-nav {
  display: none;
}

.monitor-topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  padding: 20px clamp(18px, 3vw, 34px);
  background: #0d352c;
  color: #fff;
}

.monitor-topbar h1,
.monitor-topbar p {
  margin: 0;
}

.monitor-topbar .section-label {
  color: var(--amber);
}

.monitor-topbar h1 {
  margin-top: 4px;
  font-size: clamp(1.55rem, 3vw, 2.8rem);
}

.monitor-topbar p:not(.section-label) {
  margin-top: 4px;
  color: rgba(255, 255, 255, 0.76);
  font-weight: 800;
}

.monitor-topbar .secondary-button {
  border-color: rgba(255, 255, 255, 0.28);
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
}

.monitor-layout {
  display: grid;
  grid-template-columns: minmax(260px, 320px) minmax(0, 1fr);
  gap: 16px;
  min-height: 0;
  height: calc(100vh - 112px);
  padding: 16px;
}

.monitor-sidebar,
.monitor-map-panel {
  min-width: 0;
  border: 1px solid var(--line);
  border-radius: var(--radius);
  background: #fff;
  box-shadow: 0 12px 34px rgba(18, 60, 50, 0.08);
}

.monitor-sidebar {
  overflow: auto;
  padding: 16px;
}

.monitor-sidebar h2 {
  margin: 0 0 12px;
  font-size: 1rem;
}

.monitor-sidebar .team-follow-list {
  display: grid;
}

.monitor-sidebar .follow-chip {
  min-width: 0;
}

.monitor-map-panel {
  padding: 12px;
}

.monitor-map {
  width: 100%;
  height: 100%;
  min-height: 560px;
}

.monitor-view:fullscreen {
  background: #f4f7f5;
}

.monitor-view:fullscreen .monitor-layout {
  height: calc(100vh - 112px);
}

@media (max-width: 720px) {
  .team-live-toolbar,
  .monitor-topbar,
  .monitor-layout {
    display: grid;
  }

  .team-live-actions {
    display: grid;
  }

  .monitor-view {
    min-height: auto;
  }

  .monitor-layout {
    grid-template-columns: 1fr;
    height: auto;
    padding: 12px;
  }

  .monitor-map {
    height: 72vh;
    min-height: 420px;
  }
}
`;
}

await patchTextFile("index.html", ensureIndex);
await patchTextFile("app.js", ensureApp);
await patchTextFile("styles.css", ensureStyles);
await patchTextFile("service-worker.js", (worker) => worker.replace(/escape-erezee-v\d+/g, `escape-erezee-v${VERSION}`));

console.log("Supervision terrain v55 appliquée.");
