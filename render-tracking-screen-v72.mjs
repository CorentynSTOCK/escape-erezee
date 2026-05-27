import { readFile, writeFile } from "node:fs/promises";

const VERSION = 72;

async function patchTextFile(filePath, patcher) {
  const input = await readFile(filePath, "utf8");
  const output = patcher(input);
  if (output !== input) {
    await writeFile(filePath, output, "utf8");
  }
}

function ensureIndex(html) {
  let next = html
    .replace(/styles\.css\?v=\d+/g, `styles.css?v=${VERSION}`)
    .replace(/app\.js\?v=\d+/g, `app.js?v=${VERSION}`);

  if (!next.includes('href="#suivi" id="open-tracking-screen"')) {
    next = next.replace(
      `              <div class="panel-title">
                <div>
                  <p class="section-label">Équipes</p>
                  <h2 id="teams-heading">Progression en direct</h2>
                </div>
              </div>`,
      `              <div class="panel-title">
                <div>
                  <p class="section-label">Équipes</p>
                  <h2 id="teams-heading">Progression en direct</h2>
                </div>
                <a class="secondary-button" href="#suivi" id="open-tracking-screen">Grand écran</a>
              </div>`,
    );
  }

  if (!next.includes('id="tracking-view"')) {
    next = next.replace(
      `        </section>
      </main>`,
      `        </section>

        <section class="view tracking-view" id="tracking-view" aria-labelledby="tracking-title">
          <div class="tracking-login admin-panel is-hidden" id="tracking-login-notice">
            <p class="section-label">Suivi</p>
            <h1 id="tracking-title">Accès gestion requis</h1>
            <p>Connectez-vous à l’espace gestion pour afficher le suivi grand écran.</p>
            <a class="primary-button" href="#admin">Se connecter</a>
          </div>

          <div class="tracking-screen" id="tracking-content">
            <header class="tracking-header">
              <div>
                <p class="section-label">Suivi des parcours</p>
                <h1>Carte grand écran</h1>
              </div>
              <div class="tracking-actions">
                <button class="secondary-button" type="button" id="tracking-select-all">Tout afficher</button>
                <button class="secondary-button" type="button" id="tracking-clear">Tout masquer</button>
                <a class="primary-button" href="#admin">Retour gestion</a>
              </div>
            </header>

            <div class="tracking-layout">
              <section class="tracking-map-panel" aria-label="Carte de suivi grand écran">
                <div class="map-canvas tracking-live-map" id="tracking-map" aria-label="Carte de suivi des équipes">
                  <div class="map-tiles" aria-hidden="true"></div>
                  <div class="map-layer" aria-hidden="true"></div>
                  <div class="map-attribution">© OpenStreetMap</div>
                </div>
              </section>

              <aside class="tracking-sidebar" aria-labelledby="tracking-teams-title">
                <p class="section-label">Filtres</p>
                <h2 id="tracking-teams-title">Équipes suivies</h2>
                <p class="tracking-summary" id="tracking-summary"></p>
                <div class="tracking-team-filters" id="tracking-team-filters"></div>
              </aside>
            </div>
          </div>
        </section>
      </main>`,
    );
  }

  return next;
}

function ensureApp(app) {
  let next = app;

  if (!next.includes('const TRACKING_FILTER_KEY = "escape-erezee-tracking-teams";')) {
    next = next.replace(
      'const ACTIVE_ROUTE_KEY = "escape-erezee-active-route";',
      'const ACTIVE_ROUTE_KEY = "escape-erezee-active-route";\nconst TRACKING_FILTER_KEY = "escape-erezee-tracking-teams";',
    );
  }

  if (!next.includes('suivi: $("#tracking-view")')) {
    next = next.replace(
      '    admin: $("#admin-view"),\n  },',
      '    admin: $("#admin-view"),\n    suivi: $("#tracking-view"),\n  },',
    );
  }

  if (!next.includes('trackingMap: $("#tracking-map")')) {
    next = next.replace(
      '  teamTable: $("#team-table"),\n  teamLiveMap: $("#team-live-map"),\n  codeList: $("#code-list"),',
      '  teamTable: $("#team-table"),\n  teamLiveMap: $("#team-live-map"),\n  trackingLoginNotice: $("#tracking-login-notice"),\n  trackingContent: $("#tracking-content"),\n  trackingMap: $("#tracking-map"),\n  trackingTeamFilters: $("#tracking-team-filters"),\n  trackingSummary: $("#tracking-summary"),\n  trackingSelectAllButton: $("#tracking-select-all"),\n  trackingClearButton: $("#tracking-clear"),\n  codeList: $("#code-list"),',
    );
  }

  if (!next.includes('let trackingTeamFilter = loadTrackingTeamFilter();')) {
    next = next.replace(
      'let selectedContentPuzzleId = null;\n\nlet data = loadData();',
      'let selectedContentPuzzleId = null;\nlet trackingTeamFilter = loadTrackingTeamFilter();\n\nlet data = loadData();',
    );
  }

  next = next.replace(/#player-map, #admin-map, #team-live-map/g, '#player-map, #admin-map, #team-live-map, #tracking-map');

  next = next.replace(
    `function isAdminRouteActive() {
  return location.hash.replace("#", "") === "admin";
}`,
    `function isAdminRouteActive() {
  const view = location.hash.replace("#", "");
  return view === "admin" || view === "suivi";
}`,
  );

  next = next.replace(
    `function setHashView() {
  const requestedView = location.hash.replace("#", "");
  const view = ["home", "shop", "player", "admin"].includes(requestedView) ? requestedView : "home";
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
}`,
    `function setHashView() {
  const requestedView = location.hash.replace("#", "");
  const view = ["home", "shop", "player", "admin", "suivi"].includes(requestedView) ? requestedView : "home";
  document.body.classList.toggle("is-tracking-view", view === "suivi");
  Object.entries(els.views).forEach(([name, element]) => {
    element.classList.toggle("is-active", name === view);
  });
  els.navLinks.forEach((link) => {
    link.classList.toggle("is-active", link.dataset.route === view);
  });
  if ((view === "admin" || view === "suivi") && !adminSessionChecked) {
    checkAdminSession().then(() => {
      if (isAdminRouteActive()) {
        renderAdmin();
        renderTrackingScreen();
      }
    });
  }
  render();
}`,
  );

  next = next.replace(
    `function render() {
  renderPlayer();
  renderAdmin();
}`,
    `function render() {
  renderPlayer();
  renderAdmin();
  renderTrackingScreen();
}`,
  );

  next = next.replace(
    `    renderTeamTable();
  }, 1000);
}`,
    `    renderTeamTable();
    renderTrackingScreen();
  }, 1000);
}`,
  );

  next = next.replace(
    `    renderTeamTable();
    renderCodeList();
  } catch (error) {`,
    `    renderTeamTable();
    renderCodeList();
    renderTrackingScreen();
  } catch (error) {`,
  );

  if (!next.includes('function loadTrackingTeamFilter()')) {
    next = next.replace(
      'function renderTeamLiveMap() {',
      `function loadTrackingTeamFilter() {
  try {
    const parsed = JSON.parse(localStorage.getItem(TRACKING_FILTER_KEY) || "null");
    return Array.isArray(parsed) ? parsed.filter(Boolean) : null;
  } catch {
    return null;
  }
}

function setTrackingTeamFilter(ids) {
  trackingTeamFilter = Array.isArray(ids) ? ids.filter(Boolean) : null;
  if (trackingTeamFilter) {
    localStorage.setItem(TRACKING_FILTER_KEY, JSON.stringify(trackingTeamFilter));
  } else {
    localStorage.removeItem(TRACKING_FILTER_KEY);
  }
}

function getTrackingTeamEntries() {
  return data.teams
    .map((team) => {
      const route = getRoute(team.routeId);
      if (!route) return null;
      return {
        team,
        route,
        progress: getTeamProgress(team, route),
        details: getTeamPositionDetails(team, route),
      };
    })
    .filter(Boolean);
}

function getTrackingSelectedIds(entries) {
  const teamIds = entries.map((entry) => entry.team.id);
  if (!Array.isArray(trackingTeamFilter)) return new Set(teamIds);
  return new Set(trackingTeamFilter.filter((id) => teamIds.includes(id)));
}

function renderLiveTeamEntriesMap(container, entries, emptyMessage) {
  if (!container) return;
  const visibleEntries = entries.filter((entry) => entry.team.status === "playing" && entry.details);

  if (!visibleEntries.length) {
    const route = getActiveRoute();
    const target = route?.puzzles?.[0]
      ? { lat: getPuzzleLat(route.puzzles[0]), lng: getPuzzleLng(route.puzzles[0]), radius: getPuzzleRadius(route.puzzles[0]) }
      : { ...DEFAULT_CENTER, radius: 120 };
    renderTileMap(container, {
      target,
      radius: target.radius,
      editable: false,
    });
    const layer = container.querySelector(".map-layer");
    if (layer) {
      layer.insertAdjacentHTML("beforeend", `<span class="map-empty-note">${escapeHtml(emptyMessage || "Aucune position joueur recue pour le moment.")}</span>`);
    }
    return;
  }

  renderTileMap(container, {
    fitToPoints: true,
    players: visibleEntries.map((entry, index) => ({
      ...entry.details.position,
      label: `${index + 1}. ${entry.team.name}`,
      variant: String(index % 6),
    })),
    targets: visibleEntries
      .filter((entry) => entry.details.target)
      .map((entry, index) => ({
        lat: entry.details.target.lat,
        lng: entry.details.target.lng,
        radius: entry.details.target.radius,
        label: `Obj. ${index + 1}`,
      })),
  });
}

function renderTrackingTeamFilters(entries, selectedIds) {
  if (!els.trackingTeamFilters) return;
  if (!entries.length) {
    els.trackingTeamFilters.innerHTML = `<p class="tracking-empty">Aucune équipe connectée.</p>`;
    return;
  }

  els.trackingTeamFilters.innerHTML = entries
    .map((entry) => {
      const checked = selectedIds.has(entry.team.id);
      const statusText = entry.team.status === "won"
        ? "Terminé"
        : entry.team.status === "lost"
          ? "Perdu"
          : entry.team.status === "playing"
            ? "En cours"
            : "Briefing";
      const positionText = entry.details
        ? `${entry.details.isStale ? "Ancienne position" : "Position recue"} · ${entry.details.ageLabel}`
        : "Pas de position";
      return `
        <label class="tracking-team-card ${checked ? "is-selected" : ""}">
          <input type="checkbox" data-tracking-team="${escapeHtml(entry.team.id)}" ${checked ? "checked" : ""} />
          <span class="tracking-team-copy">
            <strong>${escapeHtml(entry.team.name)}</strong>
            <small>${escapeHtml(entry.route.title)} · ${statusText}</small>
            <small>${escapeHtml(positionText)}</small>
          </span>
          <span class="tracking-progress-pill">${entry.progress.solved}/${entry.progress.total}</span>
        </label>
      `;
    })
    .join("");

  $$("[data-tracking-team]").forEach((input) => {
    input.addEventListener("change", updateTrackingTeamSelection);
  });
}

function updateTrackingTeamSelection() {
  const inputs = $$("[data-tracking-team]");
  const selectedIds = inputs.filter((input) => input.checked).map((input) => input.dataset.trackingTeam);
  setTrackingTeamFilter(selectedIds.length === inputs.length ? null : selectedIds);
  renderTrackingScreen();
}

function renderTrackingScreen() {
  if (!els.trackingContent || location.hash.replace("#", "") !== "suivi") return;
  const loginRequired = canUseBackend() && !adminAuthenticated;
  els.trackingLoginNotice?.classList.toggle("is-hidden", !loginRequired);
  els.trackingContent.classList.toggle("is-hidden", loginRequired);
  if (loginRequired) return;

  const entries = getTrackingTeamEntries();
  const selectedIds = getTrackingSelectedIds(entries);
  const selectedEntries = entries.filter((entry) => selectedIds.has(entry.team.id));
  const positionedCount = selectedEntries.filter((entry) => entry.details).length;

  if (els.trackingSummary) {
    els.trackingSummary.textContent = `${selectedIds.size} équipe${selectedIds.size > 1 ? "s" : ""} affichée${selectedIds.size > 1 ? "s" : ""} sur ${entries.length}. ${positionedCount} position${positionedCount > 1 ? "s" : ""} recue${positionedCount > 1 ? "s" : ""}.`;
  }

  renderTrackingTeamFilters(entries, selectedIds);
  renderLiveTeamEntriesMap(
    els.trackingMap,
    selectedEntries,
    selectedEntries.length ? "Aucune position recue pour les équipes sélectionnées." : "Aucune équipe sélectionnée.",
  );
}

function renderTeamLiveMap() {`,
    );
  }

  if (!next.includes('trackingSelectAllButton?.addEventListener')) {
    next = next.replace(
      '  els.adminLogoutButton.addEventListener("click", handleAdminLogout);',
      `  els.adminLogoutButton.addEventListener("click", handleAdminLogout);
  els.trackingSelectAllButton?.addEventListener("click", () => {
    setTrackingTeamFilter(null);
    renderTrackingScreen();
  });
  els.trackingClearButton?.addEventListener("click", () => {
    setTrackingTeamFilter([]);
    renderTrackingScreen();
  });`,
    );
  }

  return next;
}

function ensureStyles(css) {
  if (css.includes("/* tracking-screen-v72 */")) return css;
  return `${css}

/* tracking-screen-v72 */
.is-tracking-view .side-nav {
  display: none;
}

.is-tracking-view .app-shell {
  display: block;
}

.is-tracking-view main,
.tracking-view.is-active {
  min-height: 100vh;
}

.tracking-view {
  padding: 0;
  background: #10231f;
  color: #f8fffb;
}

.tracking-login {
  max-width: 560px;
  margin: 48px auto;
  color: var(--ink);
}

.tracking-screen {
  min-height: 100vh;
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
}

.tracking-screen.is-hidden {
  display: none;
}

.tracking-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  padding: 18px 22px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.12);
  background: #10231f;
}

.tracking-header h1 {
  margin: 2px 0 0;
  font-size: 1.8rem;
  line-height: 1;
}

.tracking-header .section-label {
  color: #f1b449;
}

.tracking-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 8px;
}

.tracking-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 360px;
  min-height: calc(100vh - 77px);
}

.tracking-map-panel {
  min-width: 0;
  min-height: 0;
}

.tracking-live-map {
  width: 100%;
  height: 100%;
  min-height: calc(100vh - 77px);
  border: 0;
  border-radius: 0;
}

.tracking-sidebar {
  overflow: auto;
  padding: 18px;
  border-left: 1px solid var(--line);
  background: #f8fbf9;
  color: var(--ink);
}

.tracking-sidebar h2 {
  margin: 4px 0 8px;
  font-size: 1.25rem;
}

.tracking-summary {
  margin: 0 0 14px;
  color: var(--muted);
  font-size: 0.9rem;
  font-weight: 750;
}

.tracking-team-filters {
  display: grid;
  gap: 8px;
}

.tracking-team-card {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  gap: 10px;
  align-items: center;
  padding: 10px;
  border: 1px solid var(--line);
  border-radius: 6px;
  background: #fff;
}

.tracking-team-card.is-selected {
  border-color: rgba(31, 106, 88, 0.42);
  background: #eef7f3;
}

.tracking-team-card input {
  width: 18px;
  height: 18px;
}

.tracking-team-copy {
  display: grid;
  min-width: 0;
  gap: 3px;
}

.tracking-team-copy strong,
.tracking-team-copy small {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tracking-team-copy small {
  color: var(--muted);
  font-size: 0.78rem;
  font-weight: 750;
}

.tracking-progress-pill {
  min-width: 44px;
  padding: 5px 7px;
  border-radius: 6px;
  background: var(--green);
  color: #fff;
  font-size: 0.78rem;
  font-weight: 900;
  text-align: center;
}

.tracking-empty {
  margin: 0;
  padding: 14px;
  border: 1px dashed var(--line);
  border-radius: 6px;
  background: #fff;
  color: var(--muted);
  font-weight: 750;
}

@media (max-width: 900px) {
  .tracking-header,
  .tracking-actions {
    display: grid;
    justify-content: stretch;
  }

  .tracking-layout {
    grid-template-columns: 1fr;
  }

  .tracking-live-map {
    min-height: 68vh;
  }

  .tracking-sidebar {
    border-left: 0;
    border-top: 1px solid var(--line);
  }
}
`;
}

await patchTextFile("index.html", ensureIndex);
await patchTextFile("app.js", ensureApp);
await patchTextFile("styles.css", ensureStyles);
await patchTextFile("service-worker.js", (worker) => worker.replace(/escape-erezee-v\d+/g, `escape-erezee-v${VERSION}`));

console.log("Tracking screen v72 applique.");
