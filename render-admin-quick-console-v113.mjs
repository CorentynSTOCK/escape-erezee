import { readFile, writeFile } from "node:fs/promises";

const VERSION = 113;

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

/* admin-quick-console-v113 */
function adminQuickConsoleEscape(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function adminQuickConsoleRoutes() {
  return Array.isArray(data?.routes) ? data.routes : [];
}

function adminQuickConsoleRouteIds() {
  return new Set(adminQuickConsoleRoutes().map((route) => route?.id).filter(Boolean));
}

function adminQuickConsoleTeams() {
  const routeIds = adminQuickConsoleRouteIds();
  return (Array.isArray(data?.teams) ? data.teams : []).filter((team) => routeIds.has(team?.routeId));
}

function adminQuickConsoleCodes() {
  const routeIds = adminQuickConsoleRouteIds();
  return (Array.isArray(data?.codes) ? data.codes : []).filter((code) => routeIds.has(code?.routeId));
}

function adminQuickConsoleFormatSync() {
  const timestamp = typeof lastLiveTeamSuccessAt === "number" ? lastLiveTeamSuccessAt : 0;
  if (!serverSyncEnabled) return "serveur a verifier";
  if (!timestamp) return "connecte";
  if (typeof formatRelativeTime === "function") return formatRelativeTime(timestamp);
  const seconds = Math.max(0, Math.round((Date.now() - timestamp) / 1000));
  if (seconds < 60) return "a l'instant";
  const minutes = Math.round(seconds / 60);
  return "il y a " + minutes + " min";
}

function adminQuickConsoleEnsure() {
  const adminContent = document.querySelector("#admin-content");
  const topbar = document.querySelector(".admin-topbar");
  if (!adminContent || !topbar || adminContent.classList.contains("is-hidden")) return null;

  let consoleEl = document.querySelector("#admin-quick-console");
  if (!consoleEl) {
    consoleEl = document.createElement("section");
    consoleEl.id = "admin-quick-console";
    consoleEl.className = "admin-quick-console";
    consoleEl.setAttribute("aria-label", "Console rapide de gestion");
    consoleEl.innerHTML = [
      '<div class="admin-quick-card"><p>Parcours</p><strong data-admin-quick-routes>0</strong><span data-admin-quick-active-route>Actif non defini</span></div>',
      '<div class="admin-quick-card"><p>Suivi live</p><strong data-admin-quick-teams>0</strong><span data-admin-quick-teams-detail>Aucune equipe active</span></div>',
      '<div class="admin-quick-card"><p>Codes</p><strong data-admin-quick-codes>0</strong><span data-admin-quick-codes-detail>Aucun code actif</span></div>',
      '<div class="admin-quick-card"><p>Synchro</p><strong data-admin-quick-sync>--</strong><span>Actualisation auto</span></div>',
      '<div class="admin-quick-actions" aria-label="Raccourcis de gestion">',
        '<button class="secondary-button compact-button" type="button" data-admin-quick-jump="teams">Voir le suivi</button>',
        '<button class="secondary-button compact-button" type="button" data-admin-quick-jump="codes">Voir les codes</button>',
        '<button class="secondary-button compact-button" type="button" data-admin-quick-jump="routes">Voir les parcours</button>',
        '<button class="secondary-button compact-button" type="button" data-admin-quick-jump="backups">Sauvegardes</button>',
      '</div>',
    ].join("");
    topbar.insertAdjacentElement("afterend", consoleEl);
    consoleEl.addEventListener("click", (event) => {
      const button = event.target.closest("[data-admin-quick-jump]");
      if (!button) return;
      const targets = {
        teams: '[aria-labelledby="teams-heading"]',
        codes: '[aria-labelledby="codes-heading"]',
        routes: '[aria-labelledby="routes-heading"]',
        backups: "#admin-data-safety-panel",
      };
      const target = document.querySelector(targets[button.dataset.adminQuickJump]);
      if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  return consoleEl;
}

function adminQuickConsoleRender() {
  const consoleEl = adminQuickConsoleEnsure();
  if (!consoleEl) return;

  const routes = adminQuickConsoleRoutes();
  const teams = adminQuickConsoleTeams();
  const activeTeams = teams.filter((team) => team.status !== "won" && team.status !== "lost");
  const finishedTeams = teams.length - activeTeams.length;
  const codes = adminQuickConsoleCodes();
  const availableCodes = codes.filter((code) => code.status !== "used").length;
  const activeRoute = routes.find((route) => route.id === data?.activeRouteId) || routes[0] || null;

  consoleEl.querySelector("[data-admin-quick-routes]").textContent = String(routes.length);
  consoleEl.querySelector("[data-admin-quick-active-route]").textContent = activeRoute
    ? "Actif : " + (activeRoute.title || activeRoute.name || "parcours")
    : "Aucun parcours actif";
  consoleEl.querySelector("[data-admin-quick-teams]").textContent = String(activeTeams.length);
  consoleEl.querySelector("[data-admin-quick-teams-detail]").textContent = finishedTeams
    ? finishedTeams + " terminee(s) dans l'historique"
    : "Aucune equipe terminee";
  consoleEl.querySelector("[data-admin-quick-codes]").textContent = String(codes.length);
  consoleEl.querySelector("[data-admin-quick-codes-detail]").textContent = availableCodes + " disponible(s)";
  consoleEl.querySelector("[data-admin-quick-sync]").textContent = adminQuickConsoleFormatSync();
}

function adminQuickConsoleInstall() {
  if (window.__adminQuickConsoleV113Installed) return;
  window.__adminQuickConsoleV113Installed = true;

  const originalRenderAdminQuickConsole = renderAdmin;
  renderAdmin = function renderAdminWithQuickConsole(...args) {
    const result = originalRenderAdminQuickConsole.apply(this, args);
    window.setTimeout(adminQuickConsoleRender, 0);
    return result;
  };

  if (typeof renderTeamTable === "function") {
    const originalRenderTeamTableQuickConsole = renderTeamTable;
    renderTeamTable = function renderTeamTableWithQuickConsole(...args) {
      const result = originalRenderTeamTableQuickConsole.apply(this, args);
      window.setTimeout(adminQuickConsoleRender, 0);
      return result;
    };
  }

  if (typeof renderCodeList === "function") {
    const originalRenderCodeListQuickConsole = renderCodeList;
    renderCodeList = function renderCodeListWithQuickConsole(...args) {
      const result = originalRenderCodeListQuickConsole.apply(this, args);
      window.setTimeout(adminQuickConsoleRender, 0);
      return result;
    };
  }

  window.setInterval(() => {
    if (location.hash === "#admin") adminQuickConsoleRender();
  }, 15000);
  window.setTimeout(adminQuickConsoleRender, 800);
}

adminQuickConsoleInstall();
`;

function patchApp(app) {
  if (app.includes("admin-quick-console-v113")) return app;
  return `${bumpAssetVersions(app).trimEnd()}${APP_PATCH}\n`;
}

function patchStyles(css) {
  if (css.includes("admin-quick-console-v113")) return css;
  return `${css.trimEnd()}

/* admin-quick-console-v113 */
#admin-data-safety-panel {
  align-self: start;
  min-height: 0;
}

.admin-quick-console {
  position: sticky;
  top: 12px;
  z-index: 8;
  display: grid;
  grid-template-columns: repeat(4, minmax(150px, 1fr)) auto;
  gap: 10px;
  align-items: stretch;
  margin: 0 0 18px;
  padding: 10px;
  border: 1px solid rgba(18, 60, 50, 0.12);
  border-radius: var(--radius);
  background: rgba(244, 247, 245, 0.94);
  box-shadow: 0 10px 28px rgba(18, 60, 50, 0.08);
  backdrop-filter: blur(10px);
}

.admin-quick-card {
  display: grid;
  gap: 4px;
  min-height: 78px;
  padding: 10px 12px;
  border: 1px solid var(--line);
  border-radius: var(--radius);
  background: #fff;
}

.admin-quick-card p,
.admin-quick-card span {
  margin: 0;
}

.admin-quick-card p {
  color: var(--green-2);
  font-size: 0.72rem;
  font-weight: 900;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.admin-quick-card strong {
  overflow: hidden;
  color: var(--green);
  font-size: 1.45rem;
  line-height: 1.05;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.admin-quick-card span {
  overflow: hidden;
  color: var(--muted);
  font-size: 0.8rem;
  font-weight: 750;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.admin-quick-actions {
  display: flex;
  min-width: 220px;
  flex-wrap: wrap;
  align-content: center;
  justify-content: flex-end;
  gap: 8px;
}

.admin-quick-actions .compact-button {
  min-height: 38px;
  padding: 0 12px;
  font-size: 0.82rem;
}

@media (max-width: 1260px) {
  .admin-quick-console {
    position: static;
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .admin-quick-actions {
    grid-column: 1 / -1;
    justify-content: stretch;
  }

  .admin-quick-actions .compact-button {
    flex: 1 1 160px;
  }
}

@media (max-width: 720px) {
  .admin-quick-console {
    grid-template-columns: 1fr;
  }

  .admin-quick-actions {
    display: grid;
    min-width: 0;
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

console.log(`Admin quick console v${VERSION} applied.`);
