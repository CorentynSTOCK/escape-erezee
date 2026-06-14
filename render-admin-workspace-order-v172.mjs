import { readFile, writeFile } from 'node:fs/promises';

const VERSION = 172;

async function patchTextFile(filePath, patcher) {
  const input = await readFile(filePath, 'utf8');
  const output = patcher(input);
  if (output !== input) await writeFile(filePath, output, 'utf8');
}

async function patchOptional(filePath, patcher) {
  try {
    await patchTextFile(filePath, patcher);
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
}

function bumpAssets(text) {
  let next = text;
  for (let version = 1; version <= VERSION; version += 1) {
    next = next.split(`styles.css?v=${version}`).join(`styles.css?v=${VERSION}`);
    next = next.split(`app.js?v=${version}`).join(`app.js?v=${VERSION}`);
    next = next.split(`seo-pages.css?v=${version}`).join(`seo-pages.css?v=${VERSION}`);
    next = next.split(`escape-erezee-v${version}`).join(`escape-erezee-v${VERSION}`);
  }
  return next;
}

const APP_PATCH = String.raw`
/* admin-workspace-order-v172 */
(function initAdminWorkspaceOrderV172() {
  if (window.__adminWorkspaceOrderV172) return;
  window.__adminWorkspaceOrderV172 = true;

  const storageKey = "escape-admin-zone-v172";
  const state = {
    active: window.localStorage?.getItem(storageKey) || "overview",
    busy: false,
    observer: null,
    observerTimer: null,
  };

  const zones = [
    { id: "overview", label: "Vue d'ensemble", hint: "Etat, suivi du jour, sauvegardes et controles.", selectors: ["#admin-growth-v143", "#admin-robustness-panel-v167", "#admin-robustness-panel-v166", "#admin-ops-v138", "#admin-health-monitor-v136", "#admin-health-v136", "#admin-data-safety-panel"] },
    { id: "routes", label: "Parcours", hint: "Catalogue, fiche active et creation.", selectors: ['[aria-labelledby="routes-heading"]', '[aria-labelledby="route-details-heading"]', '[aria-labelledby="create-route-heading"]'] },
    { id: "puzzles", label: "Enigmes", hint: "Scenario, contenu, carte, indices et traductions.", selectors: ['[aria-labelledby="puzzles-heading"]', '[aria-labelledby="content-heading"]', '[aria-labelledby="create-puzzle-heading"]', '[aria-labelledby="geo-heading"]', '[aria-labelledby="hints-heading"]', "#admin-i18n-workspace-v170"] },
    { id: "players", label: "Equipes et codes", hint: "Progression, assistance et codes d'activation.", selectors: ['[aria-labelledby="teams-heading"]', '[aria-labelledby="codes-heading"]', "#admin-assistance-v145", "#admin-support-v145"] },
    { id: "commerce", label: "Commerce SEO", hint: "Avis, exports, contenus publics et visibilite.", selectors: ["#admin-public-settings-v145", "#admin-tools-v145", "#admin-growth-tools-v145", "#admin-seo-dashboard-v139", "#admin-seo-dashboard-v140", "#admin-seo-dashboard", "#admin-postdeploy-v141", "#admin-postdeploy-panel-v141"] },
    { id: "tools", label: "Outils", hint: "Images, sauvegardes et panneaux techniques.", selectors: ["#admin-backup-download-restore-v132", "#admin-backup-layout-v133", "#admin-scheduled-backups-v134", "#admin-image-health-v157", "#admin-image-bank-v159", "#admin-image-bank-v160"] },
  ];

  function esc(value) {
    return String(value == null ? "" : value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  function adminIsVisible() {
    const content = document.querySelector("#admin-content");
    return location.hash === "#admin" && content && !content.classList.contains("is-hidden");
  }

  function routesV172() {
    return Array.isArray(window.data?.routes) ? window.data.routes : (Array.isArray(data?.routes) ? data.routes : []);
  }

  function teamsV172() {
    return Array.isArray(window.data?.teams) ? window.data.teams : (Array.isArray(data?.teams) ? data.teams : []);
  }

  function codesV172() {
    return Array.isArray(window.data?.codes) ? window.data.codes : (Array.isArray(data?.codes) ? data.codes : []);
  }

  function activeRouteTitleV172(routes) {
    const route = typeof getActiveRoute === "function" ? getActiveRoute() : routes.find(function (item) { return item.id === data?.activeRouteId; });
    return route?.title || "Aucun parcours actif";
  }

  function metricHtml(label, value) {
    return '<article class="admin-workspace-metric-v172"><strong>' + esc(value) + '</strong><span>' + esc(label) + '</span></article>';
  }

  function updateSummary(shell) {
    const routes = routesV172();
    const teams = teamsV172();
    const codes = codesV172();
    const playing = teams.filter(function (team) { return team.status === "playing"; }).length;
    const availableCodes = codes.filter(function (code) { return code.status !== "used"; }).length;
    const finished = teams.filter(function (team) { return team.status === "won" || team.status === "lost"; }).length;
    const summary = shell.querySelector("[data-admin-summary-v172]");
    if (!summary) return;
    summary.innerHTML = [
      metricHtml("Parcours", routes.length),
      metricHtml("Equipe(s) en cours", playing),
      metricHtml("Codes disponibles", availableCodes),
      metricHtml("Parties terminees", finished),
      '<article class="admin-workspace-metric-v172 is-wide"><strong>' + esc(activeRouteTitleV172(routes)) + '</strong><span>Parcours actif</span></article>',
    ].join("");
  }

  function ensureShell() {
    const content = document.querySelector("#admin-content");
    if (!content) return null;
    let shell = document.querySelector("#admin-workspace-v172");
    if (!shell) {
      shell = document.createElement("section");
      shell.id = "admin-workspace-v172";
      shell.className = "admin-workspace-v172";
      shell.innerHTML = [
        '<div class="admin-workspace-head-v172">',
          '<div><p class="section-label">Poste de pilotage</p><h2>Gestion organisee</h2></div>',
          '<nav class="admin-workspace-tabs-v172" aria-label="Sections gestion">' + zones.map(function (zone) { return '<button type="button" data-admin-zone-tab-v172="' + zone.id + '">' + esc(zone.label) + '</button>'; }).join("") + '</nav>',
        '</div>',
        '<div class="admin-workspace-summary-v172" data-admin-summary-v172></div>',
        '<div class="admin-workspace-groups-v172" data-admin-groups-v172></div>',
      ].join("");
      const topbar = content.querySelector(".admin-topbar");
      if (topbar) topbar.insertAdjacentElement("afterend", shell);
      else content.prepend(shell);
      shell.querySelectorAll("[data-admin-zone-tab-v172]").forEach(function (button) {
        button.addEventListener("click", function () {
          state.active = button.dataset.adminZoneTabV172 || "overview";
          window.localStorage?.setItem(storageKey, state.active);
          applyActiveZone(shell);
          if (state.active === "puzzles") {
            window.setTimeout(function () { if (typeof renderAdmin === "function") renderAdmin(); }, 60);
          }
        });
      });
    }
    const groups = shell.querySelector("[data-admin-groups-v172]");
    zones.forEach(function (zone) {
      let group = shell.querySelector('[data-admin-zone-v172="' + zone.id + '"]');
      if (!group) {
        group = document.createElement("section");
        group.className = "admin-zone-v172";
        group.dataset.adminZoneV172 = zone.id;
        group.innerHTML = [
          '<header class="admin-zone-head-v172"><div><p class="section-label">' + esc(zone.label) + '</p><h3>' + esc(zone.hint) + '</h3></div></header>',
          '<div class="admin-zone-body-v172" data-admin-zone-body-v172="' + zone.id + '"></div>',
        ].join("");
        groups.appendChild(group);
      }
    });
    updateSummary(shell);
    return shell;
  }

  function moveNodeToZone(shell, node, zoneId) {
    if (!node || node.id === "admin-workspace-v172" || (node.closest("#admin-workspace-v172") === shell && node.matches(".admin-zone-v172, .admin-zone-v172 *"))) return false;
    const body = shell.querySelector('[data-admin-zone-body-v172="' + zoneId + '"]');
    if (!body || node.parentElement === body) return false;
    body.appendChild(node);
    node.dataset.adminZoneV172 = zoneId;
    return true;
  }

  function moveKnownPanels(shell) {
    zones.forEach(function (zone) {
      zone.selectors.forEach(function (selector) {
        document.querySelectorAll(selector).forEach(function (node) { moveNodeToZone(shell, node, zone.id); });
      });
    });
  }

  function moveLoosePanels(shell) {
    const content = document.querySelector("#admin-content");
    if (!content) return;
    document.querySelectorAll("#admin-content > section, #admin-content > .admin-grid > section").forEach(function (node) {
      if (node.id === "admin-workspace-v172" || node.dataset.adminZoneV172) return;
      moveNodeToZone(shell, node, "tools");
    });
    const grid = content.querySelector(".admin-grid");
    if (grid) grid.classList.toggle("is-empty-v172", !grid.querySelector("section, article, form, div"));
  }

  function applyActiveZone(shell) {
    if (!zones.some(function (zone) { return zone.id === state.active; })) state.active = "overview";
    shell.querySelectorAll("[data-admin-zone-tab-v172]").forEach(function (button) {
      const active = button.dataset.adminZoneTabV172 === state.active;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", active ? "true" : "false");
    });
    shell.querySelectorAll("[data-admin-zone-v172]").forEach(function (group) {
      group.classList.toggle("is-active", group.dataset.adminZoneV172 === state.active);
    });
  }

  function refreshWorkspace() {
    if (!adminIsVisible() || state.busy) return;
    state.busy = true;
    try {
      const shell = ensureShell();
      if (!shell) return;
      moveKnownPanels(shell);
      moveLoosePanels(shell);
      applyActiveZone(shell);
      document.querySelector("#admin-content")?.classList.add("admin-organized-v172");
    } finally {
      state.busy = false;
    }
  }

  function observeAdmin() {
    const content = document.querySelector("#admin-content");
    if (!content || state.observer) return;
    state.observer = new MutationObserver(function () {
      clearTimeout(state.observerTimer);
      state.observerTimer = window.setTimeout(refreshWorkspace, 80);
    });
    state.observer.observe(content, { childList: true, subtree: true });
  }

  const previousRenderAdminV172 = renderAdmin;
  renderAdmin = function renderAdminWithWorkspaceOrderV172() {
    const result = previousRenderAdminV172.apply(this, arguments);
    window.setTimeout(refreshWorkspace, 0);
    window.setTimeout(refreshWorkspace, 250);
    window.setTimeout(observeAdmin, 300);
    return result;
  };

  window.addEventListener("hashchange", function () { window.setTimeout(refreshWorkspace, 120); });
  window.setTimeout(refreshWorkspace, 300);
})();
`;

function patchApp(app) {
  let next = bumpAssets(app);
  if (!next.includes('admin-workspace-order-v172')) next = `${next.trimEnd()}\n${APP_PATCH}\n`;
  return next;
}

function patchStyles(css) {
  let next = bumpAssets(css);
  if (next.includes('admin-workspace-order-v172')) return next;
  return `${next.trimEnd()}

/* admin-workspace-order-v172 */
.admin-workspace-v172 { display: grid; gap: 14px; margin: 0 0 18px; }
.admin-workspace-head-v172 { display: grid; gap: 12px; padding: 16px; border: 1px solid var(--line); border-radius: var(--radius); background: #fff; }
.admin-workspace-head-v172 h2, .admin-zone-head-v172 h3 { margin: 2px 0 0; color: var(--green); }
.admin-workspace-tabs-v172 { display: flex; flex-wrap: wrap; gap: 8px; }
.admin-workspace-tabs-v172 button { min-height: 38px; border: 1px solid rgba(18, 60, 50, 0.16); border-radius: 8px; background: #f8fbf9; color: var(--green); cursor: pointer; font-weight: 900; padding: 0 12px; }
.admin-workspace-tabs-v172 button.is-active { border-color: var(--gold); background: var(--gold); color: #0f241f; }
.admin-workspace-summary-v172 { display: grid; grid-template-columns: repeat(4, minmax(120px, 1fr)) minmax(220px, 1.4fr); gap: 10px; }
.admin-workspace-metric-v172 { display: grid; gap: 2px; min-height: 74px; align-content: center; border: 1px solid var(--line); border-radius: var(--radius); background: #fff; padding: 12px; }
.admin-workspace-metric-v172 strong { color: var(--green); font-size: 1.22rem; line-height: 1.15; }
.admin-workspace-metric-v172 span { color: var(--muted); font-size: 0.82rem; font-weight: 800; }
.admin-workspace-groups-v172 { display: grid; gap: 14px; }
.admin-zone-v172 { display: none; gap: 12px; }
.admin-zone-v172.is-active { display: grid; }
.admin-zone-head-v172 { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.admin-zone-body-v172 { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; align-items: start; }
.admin-zone-body-v172 > .wide-panel, .admin-zone-body-v172 > .admin-growth-panel-v143, .admin-zone-body-v172 > .admin-robustness-panel-v166, .admin-zone-body-v172 > .admin-robustness-panel-v167, .admin-zone-body-v172 > .admin-i18n-workspace-v170 { grid-column: 1 / -1; }
.admin-organized-v172 > .admin-grid.is-empty-v172 { display: none; }
@media (max-width: 980px) { .admin-workspace-summary-v172, .admin-zone-body-v172 { grid-template-columns: 1fr; } }
@media (max-width: 720px) { .admin-workspace-tabs-v172 { flex-wrap: nowrap; overflow-x: auto; padding-bottom: 4px; } .admin-workspace-tabs-v172 button { flex: 0 0 auto; } }
`;
}

function patchPackageJson(packageJson) {
  const parsed = JSON.parse(packageJson);
  const start = parsed.scripts?.start || '';
  if (!start.includes('render-admin-workspace-order-v172.mjs')) {
    parsed.scripts.start = start.replace(
      'node render-review-routine-v171.mjs && node server.mjs',
      'node render-review-routine-v171.mjs && node render-admin-workspace-order-v172.mjs && node server.mjs',
    );
  }
  return `${JSON.stringify(parsed, null, 2)}\n`;
}

await patchTextFile('app.js', patchApp);
await patchTextFile('styles.css', patchStyles);
await patchTextFile('index.html', bumpAssets);
await patchOptional('suivi.html', bumpAssets);
await patchOptional('seo-pages.css', bumpAssets);
await patchTextFile('service-worker.js', bumpAssets);
await patchTextFile('package.json', patchPackageJson);

console.log(`Admin workspace order v${VERSION} applied.`);
