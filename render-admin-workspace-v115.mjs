import { readFile, writeFile } from "node:fs/promises";

const VERSION = 115;

async function patchTextFile(filePath, patcher) {
  const input = await readFile(filePath, "utf8");
  const output = patcher(input);
  if (output !== input) await writeFile(filePath, output, "utf8");
}

function bumpAssetVersions(text) {
  return text
    .replace(/styles\.css\?v=\d+/g, `styles.css?v=${VERSION}`)
    .replace(/app\.js\?v=\d+/g, `app.js?v=${VERSION}`);
}

const APP_PATCH = `

/* admin-workspace-v115 */
const ADMIN_WORKSPACE_STORAGE_KEY = "escape-erezee-admin-tab-v115";
const ADMIN_WORKSPACE_TABS = [
  { id: "overview", label: "Vue d'ensemble" },
  { id: "live", label: "Suivi live" },
  { id: "routes", label: "Parcours" },
  { id: "puzzles", label: "Enigmes" },
  { id: "codes", label: "Codes" },
  { id: "backups", label: "Sauvegardes" },
];
const ADMIN_WORKSPACE_SECTION_GROUPS = {
  overview: ["admin-data-safety-panel", "routes-heading", "teams-heading", "codes-heading"],
  live: ["teams-heading"],
  routes: ["routes-heading", "create-route-heading", "route-details-heading"],
  puzzles: ["puzzles-heading", "content-heading", "create-puzzle-heading", "geo-heading", "hints-heading"],
  codes: ["codes-heading"],
  backups: ["admin-data-safety-panel"],
};
const ADMIN_WORKSPACE_COLLAPSIBLE_HEADINGS = [
  "create-route-heading",
  "route-details-heading",
  "content-heading",
  "create-puzzle-heading",
  "geo-heading",
  "hints-heading",
];

function adminWorkspaceEscape(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function adminWorkspaceNormalize(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\\u0300-\\u036f]/g, "")
    .toLowerCase();
}

function adminWorkspacePanelByHeading(headingId) {
  return document.querySelector('[aria-labelledby="' + headingId + '"]');
}

function adminWorkspaceManagedSections() {
  const uniqueIds = Array.from(new Set(Object.values(ADMIN_WORKSPACE_SECTION_GROUPS).flat()));
  return uniqueIds
    .map((id) => (id === "admin-data-safety-panel" ? document.querySelector("#admin-data-safety-panel") : adminWorkspacePanelByHeading(id)))
    .filter(Boolean);
}

function adminWorkspaceActiveTeams() {
  const routeIds = new Set((Array.isArray(data?.routes) ? data.routes : []).map((route) => route?.id).filter(Boolean));
  return (Array.isArray(data?.teams) ? data.teams : []).filter((team) => {
    if (!routeIds.has(team?.routeId)) return false;
    return team.status !== "won" && team.status !== "lost";
  });
}

function adminWorkspacePreferredTab() {
  const stored = localStorage.getItem(ADMIN_WORKSPACE_STORAGE_KEY);
  if (ADMIN_WORKSPACE_TABS.some((tab) => tab.id === stored)) return stored;
  return adminWorkspaceActiveTeams().length ? "live" : "overview";
}

function adminWorkspaceEnsureTabs() {
  const adminContent = document.querySelector("#admin-content");
  const topbar = document.querySelector(".admin-topbar");
  if (!adminContent || !topbar || adminContent.classList.contains("is-hidden")) return null;

  let tabs = document.querySelector("#admin-workspace-tabs");
  if (!tabs) {
    tabs = document.createElement("nav");
    tabs.id = "admin-workspace-tabs";
    tabs.className = "admin-workspace-tabs";
    tabs.setAttribute("aria-label", "Navigation admin");
    tabs.innerHTML = ADMIN_WORKSPACE_TABS.map((tab) =>
      '<button class="admin-workspace-tab" type="button" data-admin-tab="' + tab.id + '">' +
        adminWorkspaceEscape(tab.label) +
      '</button>',
    ).join("");
    const quickConsole = document.querySelector("#admin-quick-console");
    (quickConsole || topbar).insertAdjacentElement("afterend", tabs);
    tabs.addEventListener("click", (event) => {
      const button = event.target.closest("[data-admin-tab]");
      if (!button) return;
      adminWorkspaceSetTab(button.dataset.adminTab, { store: true, scroll: false });
    });
  }
  return tabs;
}

function adminWorkspaceSetTab(tabId, options = {}) {
  const tab = ADMIN_WORKSPACE_TABS.some((item) => item.id === tabId) ? tabId : adminWorkspacePreferredTab();
  const tabs = document.querySelector("#admin-workspace-tabs");
  if (tabs) {
    tabs.querySelectorAll("[data-admin-tab]").forEach((button) => {
      const selected = button.dataset.adminTab === tab;
      button.classList.toggle("is-active", selected);
      button.setAttribute("aria-selected", selected ? "true" : "false");
    });
  }

  if (options.store) {
    localStorage.setItem(ADMIN_WORKSPACE_STORAGE_KEY, tab);
  }

  const visibleIds = new Set(ADMIN_WORKSPACE_SECTION_GROUPS[tab] || ADMIN_WORKSPACE_SECTION_GROUPS.overview);
  adminWorkspaceManagedSections().forEach((section) => {
    const label = section.id === "admin-data-safety-panel" ? section.id : section.getAttribute("aria-labelledby");
    section.classList.toggle("is-admin-workspace-hidden", !visibleIds.has(label));
    section.dataset.adminWorkspaceSection = label || "";
  });

  const activityLog = document.querySelector("#admin-activity-log");
  if (activityLog) {
    activityLog.classList.toggle("is-admin-workspace-hidden", tab !== "overview");
  }

  if ((tab === "overview" || tab === "live") && typeof renderTeamLiveMap === "function") {
    window.setTimeout(() => renderTeamLiveMap(), 60);
  }
  if (tab === "codes") {
    window.setTimeout(adminCodeToolsApplyFilters, 0);
  }
}

function adminWorkspaceInstallQuickJumpTabs() {
  const consoleEl = document.querySelector("#admin-quick-console");
  if (!consoleEl || consoleEl.dataset.adminWorkspaceJumpReady === "true") return;
  consoleEl.dataset.adminWorkspaceJumpReady = "true";
  consoleEl.addEventListener("click", (event) => {
    const button = event.target.closest("[data-admin-quick-jump]");
    if (!button) return;
    const tabByJump = {
      teams: "live",
      codes: "codes",
      routes: "routes",
      backups: "backups",
    };
    const nextTab = tabByJump[button.dataset.adminQuickJump];
    if (nextTab) adminWorkspaceSetTab(nextTab, { store: true, scroll: false });
  }, true);
}

function adminWorkspaceFormatRelative(timestamp) {
  if (!timestamp) return "aucune date";
  if (typeof formatRelativeTime === "function") return formatRelativeTime(timestamp);
  const minutes = Math.max(0, Math.round((Date.now() - timestamp) / 60000));
  if (minutes < 1) return "a l'instant";
  return "il y a " + minutes + " min";
}

function adminActivityLogEnsure() {
  const tabs = document.querySelector("#admin-workspace-tabs");
  if (!tabs) return null;
  let log = document.querySelector("#admin-activity-log");
  if (!log) {
    log = document.createElement("section");
    log.id = "admin-activity-log";
    log.className = "admin-activity-log";
    log.setAttribute("aria-label", "Journal rapide admin");
    tabs.insertAdjacentElement("afterend", log);
  }
  return log;
}

function adminActivityLogRender() {
  const log = adminActivityLogEnsure();
  if (!log) return;
  const routes = Array.isArray(data?.routes) ? data.routes : [];
  const teams = Array.isArray(data?.teams) ? data.teams : [];
  const codes = Array.isArray(data?.codes) ? data.codes : [];
  const activeRoute = routes.find((route) => route.id === data?.activeRouteId) || routes[0] || null;
  const activeTeams = adminWorkspaceActiveTeams();
  const lastTeamSync = teams.reduce((latest, team) => Math.max(
    latest,
    Number(team?.updatedAt) || 0,
    Number(team?.lastPosition?.at) || 0,
    Number(team?.finishedAt) || 0,
    Number(team?.createdAt) || 0,
  ), 0);
  const availableCodes = codes.filter((code) => code.status !== "used").length;
  const usedCodes = codes.length - availableCodes;
  const lastCode = codes.reduce((latest, code) => Math.max(latest, Number(code?.createdAt) || 0), 0);

  const items = [
    {
      title: "Parcours actif",
      value: activeRoute ? activeRoute.title || "Parcours" : "Aucun",
      detail: routes.length + " parcours disponibles",
    },
    {
      title: "Suivi joueurs",
      value: activeTeams.length + " en cours",
      detail: teams.length ? "Derniere activite " + adminWorkspaceFormatRelative(lastTeamSync) : "Aucune equipe connectee",
    },
    {
      title: "Codes",
      value: codes.length + " au total",
      detail: availableCodes + " disponibles, " + usedCodes + " utilises",
    },
    {
      title: "Creation code",
      value: lastCode ? adminWorkspaceFormatRelative(lastCode) : "Aucun code",
      detail: "Filtre et copie rapide dans l'onglet Codes",
    },
  ];

  log.innerHTML = items.map((item) =>
    '<article class="admin-activity-item">' +
      '<p>' + adminWorkspaceEscape(item.title) + '</p>' +
      '<strong>' + adminWorkspaceEscape(item.value) + '</strong>' +
      '<span>' + adminWorkspaceEscape(item.detail) + '</span>' +
    '</article>',
  ).join("");
}

function adminWorkspaceEnsureCollapses() {
  ADMIN_WORKSPACE_COLLAPSIBLE_HEADINGS.forEach((headingId) => {
    const panel = adminWorkspacePanelByHeading(headingId);
    if (!panel || panel.dataset.adminCollapseReady === "true") return;
    const title = panel.querySelector(".panel-title");
    if (!title) return;
    panel.dataset.adminCollapseReady = "true";
    panel.classList.add("admin-collapsible-panel");
    const button = document.createElement("button");
    button.className = "secondary-button compact-button admin-collapse-toggle";
    button.type = "button";
    button.textContent = "Replier";
    button.setAttribute("aria-expanded", "true");
    button.addEventListener("click", () => {
      const collapsed = !panel.classList.contains("is-admin-collapsed");
      panel.classList.toggle("is-admin-collapsed", collapsed);
      button.textContent = collapsed ? "Ouvrir" : "Replier";
      button.setAttribute("aria-expanded", collapsed ? "false" : "true");
    });
    title.append(button);
  });
}

function adminCodeToolsEnsure() {
  const panel = adminWorkspacePanelByHeading("codes-heading");
  const codeList = document.querySelector("#code-list");
  if (!panel || !codeList) return null;
  let tools = document.querySelector("#admin-code-tools");
  if (!tools) {
    tools = document.createElement("div");
    tools.id = "admin-code-tools";
    tools.className = "admin-code-tools";
    tools.innerHTML = [
      '<label class="admin-code-search">Rechercher<input id="admin-code-search" type="search" placeholder="Code, client, e-mail"></label>',
      '<label>Statut<select id="admin-code-status"><option value="all">Tous</option><option value="available">Disponibles</option><option value="used">Utilises</option></select></label>',
      '<label>Parcours<select id="admin-code-route"><option value="all">Tous les parcours</option></select></label>',
      '<p id="admin-code-filter-count" class="admin-code-filter-count" role="status"></p>',
    ].join("");
    codeList.insertAdjacentElement("beforebegin", tools);
    tools.addEventListener("input", adminCodeToolsApplyFilters);
    tools.addEventListener("change", adminCodeToolsApplyFilters);
  }
  const routeSelect = tools.querySelector("#admin-code-route");
  const selected = routeSelect.value || "all";
  const routeOptions = (Array.isArray(data?.routes) ? data.routes : []).map((route) =>
    '<option value="' + adminWorkspaceEscape(route.id) + '">' + adminWorkspaceEscape(route.title || "Parcours") + '</option>',
  ).join("");
  routeSelect.innerHTML = '<option value="all">Tous les parcours</option>' + routeOptions;
  routeSelect.value = Array.from(routeSelect.options).some((option) => option.value === selected) ? selected : "all";
  return tools;
}

function adminCodeToolsApplyFilters() {
  const tools = adminCodeToolsEnsure();
  const codeList = document.querySelector("#code-list");
  if (!tools || !codeList) return;
  const rows = Array.from(codeList.querySelectorAll(".code-row"));
  const count = tools.querySelector("#admin-code-filter-count");
  const query = adminWorkspaceNormalize(tools.querySelector("#admin-code-search")?.value || "");
  const status = tools.querySelector("#admin-code-status")?.value || "all";
  const routeId = tools.querySelector("#admin-code-route")?.value || "all";
  const codesByValue = new Map((Array.isArray(data?.codes) ? data.codes : []).map((code) => [String(code.code), code]));
  let visible = 0;

  rows.forEach((row) => {
    const codeValue = row.querySelector("strong")?.textContent?.trim() || "";
    const code = codesByValue.get(codeValue);
    const rowStatus = code?.status === "used" ? "used" : "available";
    const rowRoute = code?.routeId || "";
    const haystack = adminWorkspaceNormalize(row.textContent);
    const matches = (!query || haystack.includes(query))
      && (status === "all" || status === rowStatus)
      && (routeId === "all" || routeId === rowRoute);
    row.classList.toggle("is-admin-code-filtered", !matches);
    row.dataset.adminCodeStatus = rowStatus;
    row.dataset.adminCodeRoute = rowRoute;
    if (matches) visible += 1;
  });

  if (!rows.length) {
    count.textContent = codeList.querySelector(".admin-loading-card") ? "Chargement des codes serveur." : "Aucun code actuellement.";
  } else {
    count.textContent = visible + " code(s) affiche(s) sur " + rows.length;
  }
}

function adminDeleteCodeConfirmInstall() {
  if (window.__adminDeleteCodeConfirmV115Installed || typeof deleteUsedCode !== "function") return;
  window.__adminDeleteCodeConfirmV115Installed = true;
  const originalDeleteUsedCodeV115 = deleteUsedCode;
  deleteUsedCode = function deleteUsedCodeWithConfirmV115(codeValue) {
    const code = data.codes.find((item) => item.code === codeValue);
    if (!code || code.status !== "used") {
      return originalDeleteUsedCodeV115.apply(this, arguments);
    }
    if (!window.confirm("Supprimer definitivement le code utilise " + codeValue + " ?")) return;
    return originalDeleteUsedCodeV115.apply(this, arguments);
  };
}

function adminWorkspaceRender() {
  adminWorkspaceEnsureTabs();
  adminWorkspaceInstallQuickJumpTabs();
  adminWorkspaceEnsureCollapses();
  adminActivityLogRender();
  adminCodeToolsApplyFilters();
  adminWorkspaceSetTab(adminWorkspacePreferredTab(), { store: false, scroll: false });
}

function adminWorkspaceInstall() {
  if (window.__adminWorkspaceV115Installed) return;
  window.__adminWorkspaceV115Installed = true;
  adminDeleteCodeConfirmInstall();

  const originalRenderAdminWorkspace = renderAdmin;
  renderAdmin = function renderAdminWithWorkspaceV115(...args) {
    const result = originalRenderAdminWorkspace.apply(this, args);
    window.setTimeout(adminWorkspaceRender, 0);
    return result;
  };

  if (typeof renderTeamTable === "function") {
    const originalRenderTeamTableWorkspace = renderTeamTable;
    renderTeamTable = function renderTeamTableWithWorkspaceV115(...args) {
      const result = originalRenderTeamTableWorkspace.apply(this, args);
      window.setTimeout(adminWorkspaceRender, 0);
      return result;
    };
  }

  if (typeof renderCodeList === "function") {
    const originalRenderCodeListWorkspace = renderCodeList;
    renderCodeList = function renderCodeListWithWorkspaceV115(...args) {
      const result = originalRenderCodeListWorkspace.apply(this, args);
      window.setTimeout(adminCodeToolsApplyFilters, 0);
      window.setTimeout(adminActivityLogRender, 0);
      return result;
    };
  }

  window.addEventListener("hashchange", () => {
    if (location.hash === "#admin") window.setTimeout(adminWorkspaceRender, 250);
  });
  window.setInterval(() => {
    if (location.hash === "#admin") adminWorkspaceRender();
  }, 30000);
  window.setTimeout(adminWorkspaceRender, 900);
}

adminWorkspaceInstall();
`;

function patchApp(app) {
  if (app.includes("admin-workspace-v115")) return app;
  const requiredMarkers = [
    "admin-quick-console-v113",
    "admin-initial-sync-v114",
    "function renderCodeList()",
    "function deleteUsedCode",
    "function renderTeamTable()",
  ];
  const missing = requiredMarkers.filter((marker) => !app.includes(marker));
  if (missing.length) {
    throw new Error(`Patch v${VERSION} introuvable: ${missing.join(", ")}`);
  }
  return `${bumpAssetVersions(app).trimEnd()}${APP_PATCH}\n`;
}

function patchStyles(css) {
  if (css.includes("admin-workspace-v115")) return css;
  return `${css.trimEnd()}

/* admin-workspace-v115 */
.admin-workspace-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 0 0 16px;
  padding: 8px;
  border: 1px solid rgba(18, 60, 50, 0.12);
  border-radius: var(--radius);
  background: #ffffff;
  box-shadow: 0 10px 26px rgba(18, 60, 50, 0.06);
}

.admin-workspace-tab {
  min-height: 40px;
  padding: 0 14px;
  border: 1px solid transparent;
  border-radius: 7px;
  background: transparent;
  color: var(--muted);
  font-size: 0.88rem;
  font-weight: 850;
}

.admin-workspace-tab.is-active {
  border-color: rgba(18, 60, 50, 0.16);
  background: var(--green);
  color: #fff;
}

.is-admin-workspace-hidden,
.is-admin-code-filtered {
  display: none !important;
}

.admin-activity-log {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
  margin: 0 0 16px;
}

.admin-activity-item {
  display: grid;
  gap: 5px;
  min-height: 96px;
  padding: 12px;
  border: 1px solid var(--line);
  border-radius: var(--radius);
  background: #fff;
}

.admin-activity-item p,
.admin-activity-item span {
  margin: 0;
}

.admin-activity-item p {
  color: var(--green-2);
  font-size: 0.72rem;
  font-weight: 900;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.admin-activity-item strong {
  overflow: hidden;
  color: var(--ink);
  font-size: 1.05rem;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.admin-activity-item span {
  color: var(--muted);
  font-size: 0.82rem;
  font-weight: 750;
  line-height: 1.35;
}

.admin-code-tools {
  display: grid;
  grid-template-columns: minmax(180px, 1.4fr) minmax(140px, 0.7fr) minmax(180px, 1fr);
  gap: 10px;
  align-items: end;
  margin: 0 0 12px;
  padding: 12px;
  border: 1px solid var(--line);
  border-radius: var(--radius);
  background: #f7faf8;
}

.admin-code-tools label {
  display: grid;
  gap: 6px;
  color: var(--green-2);
  font-size: 0.76rem;
  font-weight: 900;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.admin-code-tools input,
.admin-code-tools select {
  width: 100%;
  min-height: 40px;
  border: 1px solid var(--line);
  border-radius: 7px;
  background: #fff;
  color: var(--ink);
  font-size: 0.9rem;
  font-weight: 700;
  letter-spacing: 0;
  text-transform: none;
}

.admin-code-filter-count {
  grid-column: 1 / -1;
  margin: 0;
  color: var(--muted);
  font-size: 0.84rem;
  font-weight: 800;
}

.admin-collapsible-panel .panel-title {
  gap: 10px;
}

.admin-collapse-toggle {
  margin-left: auto;
  min-height: 34px;
  padding: 0 10px;
  white-space: nowrap;
}

.admin-collapsible-panel.is-admin-collapsed > :not(.panel-title) {
  display: none !important;
}

@media (max-width: 980px) {
  .admin-activity-log,
  .admin-code-tools {
    grid-template-columns: 1fr 1fr;
  }

  .admin-code-search,
  .admin-code-filter-count {
    grid-column: 1 / -1;
  }
}

@media (max-width: 720px) {
  .admin-workspace-tabs,
  .admin-activity-log,
  .admin-code-tools {
    grid-template-columns: 1fr;
  }

  .admin-workspace-tab {
    flex: 1 1 100%;
  }
}
`;
}

function patchServiceWorker(worker) {
  return bumpAssetVersions(worker).replace(/escape-erezee-v\d+/g, `escape-erezee-v${VERSION}`);
}

await patchTextFile("app.js", patchApp);
await patchTextFile("styles.css", patchStyles);
await patchTextFile("index.html", bumpAssetVersions);
await patchTextFile("service-worker.js", patchServiceWorker);

console.log(`Admin workspace v${VERSION} applied.`);
