import { readFile, writeFile } from "node:fs/promises";

const VERSION = 99;
const scriptBaseUrl = new URL("./", import.meta.url);

async function patchTextFile(filePath, patcher) {
  const fileUrl = new URL(filePath, scriptBaseUrl);
  const input = await readFile(fileUrl, "utf8");
  const output = patcher(input);
  if (output !== input) await writeFile(fileUrl, output, "utf8");
}

function bumpAssetVersions(text) {
  return text
    .replace(/styles\.css\?v=\d+/g, `styles.css?v=${VERSION}`)
    .replace(/app\.js\?v=\d+/g, `app.js?v=${VERSION}`);
}

function patchIndex(html) {
  let next = bumpAssetVersions(html);

  if (!next.includes('id="admin-sync-health-summary"')) {
    const tableMarker = `              <div class="table-wrap">`;
    if (!next.includes(tableMarker)) throw new Error("admin team table marker not found");
    next = next.replace(
      tableMarker,
      `              <div class="sync-health-summary" id="admin-sync-health-summary" role="status" aria-live="polite"></div>
${tableMarker}`,
    );
  }

  if (!next.includes("<th>Synchro</th>")) {
    const headerMarker = `                      <th>Position</th>
                      <th>État</th>`;
    if (!next.includes(headerMarker)) throw new Error("team table header marker not found");
    next = next.replace(
      headerMarker,
      `                      <th>Position</th>
                      <th>Synchro</th>
                      <th>État</th>`,
    );
  }

  return next;
}

const syncHealthHelpers = `
function getTeamLastSyncAt(team) {
  return Math.max(
    Number(team?.updatedAt) || 0,
    Number(team?.lastPosition?.at) || 0,
    Number(team?.briefingStartLocation?.at) || 0,
    Number(team?.finishedAt) || 0,
    Number(team?.startAt) || 0,
    Number(team?.createdAt) || 0,
  );
}

function getTeamSyncHealth(team, route) {
  const lastPositionAt = Number(team?.lastPosition?.at) || 0;
  const lastSyncAt = getTeamLastSyncAt(team);
  const now = Date.now();
  const isTerminal = team?.status === "won" || team?.status === "lost";
  const progress = route ? getTeamProgress(team, route) : { solved: 0, total: 0 };

  if (isTerminal) {
    return {
      tone: "is-done",
      label: team.status === "won" ? "Termine" : "Cloture",
      detail: lastSyncAt ? \`Derniere synchro \${formatRelativeTime(lastSyncAt)}\` : "Synchro non datee",
      action: \`\${progress.solved}/\${progress.total} enigmes\`,
      lastSyncAt,
      lastPositionAt,
      needsAttention: false,
    };
  }

  if (team?.status === "briefing") {
    return {
      tone: lastPositionAt ? "is-ok" : "is-warn",
      label: lastPositionAt ? "Briefing localise" : "Briefing",
      detail: lastPositionAt ? \`Position \${formatRelativeTime(lastPositionAt)}\` : "En attente de position depart",
      action: "Pas encore en jeu",
      lastSyncAt,
      lastPositionAt,
      needsAttention: !lastPositionAt,
    };
  }

  if (!lastPositionAt) {
    return {
      tone: "is-danger",
      label: "Sans position",
      detail: lastSyncAt ? \`Derniere synchro \${formatRelativeTime(lastSyncAt)}\` : "Aucune synchro recue",
      action: "Demander au joueur de rouvrir le jeu et le GPS.",
      lastSyncAt,
      lastPositionAt,
      needsAttention: true,
    };
  }

  const positionAge = now - lastPositionAt;
  if (positionAge > ADMIN_TEAM_SYNC_DANGER_MS) {
    return {
      tone: "is-danger",
      label: "Position figee",
      detail: \`Position \${formatRelativeTime(lastPositionAt)}\`,
      action: "Faire rouvrir le jeu, garder l'ecran actif et verifier le GPS.",
      lastSyncAt,
      lastPositionAt,
      needsAttention: true,
    };
  }

  if (positionAge > ADMIN_TEAM_SYNC_WARN_MS) {
    return {
      tone: "is-warn",
      label: "A surveiller",
      detail: \`Position \${formatRelativeTime(lastPositionAt)}\`,
      action: "Actualisation attendue sous peu.",
      lastSyncAt,
      lastPositionAt,
      needsAttention: true,
    };
  }

  return {
    tone: "is-ok",
    label: "Synchro OK",
    detail: \`Position \${formatRelativeTime(lastPositionAt)}\`,
    action: \`Derniere synchro \${formatRelativeTime(lastSyncAt)}\`,
    lastSyncAt,
    lastPositionAt,
    needsAttention: false,
  };
}

function renderTeamSyncBadge(health) {
  return \`
    <div class="team-sync-badge \${health.tone}">
      <strong>\${escapeHtml(health.label)}</strong>
      <span>\${escapeHtml(health.detail)}</span>
      <em>\${escapeHtml(health.action)}</em>
    </div>
  \`;
}

function renderTeamSyncSummary() {
  const target = $("#admin-sync-health-summary");
  if (!target) return;

  const entries = data.teams
    .map((team) => {
      const route = getRoute(team.routeId);
      return route ? { team, route, health: getTeamSyncHealth(team, route) } : null;
    })
    .filter(Boolean);
  const activeEntries = entries.filter((entry) => entry.team.status !== "won" && entry.team.status !== "lost");
  const dangerCount = activeEntries.filter((entry) => entry.health.tone === "is-danger").length;
  const warnCount = activeEntries.filter((entry) => entry.health.tone === "is-warn").length;
  const okCount = activeEntries.filter((entry) => entry.health.tone === "is-ok").length;
  const doneCount = entries.length - activeEntries.length;
  const serverTone = serverSyncEnabled ? "is-ok" : "is-danger";
  const serverLabel = serverSyncEnabled ? "Serveur connecte" : "Serveur a verifier";
  const serverDetail = lastLiveTeamSuccessAt
    ? \`Dernier refresh \${formatRelativeTime(lastLiveTeamSuccessAt)}\`
    : lastLiveTeamRefreshAt
      ? \`Refresh tente \${formatRelativeTime(lastLiveTeamRefreshAt)}\`
      : "En attente du premier refresh";
  const attentionList = activeEntries
    .filter((entry) => entry.health.needsAttention)
    .slice(0, 3)
    .map((entry) => \`<li><strong>\${escapeHtml(entry.team.name)}</strong> - \${escapeHtml(entry.health.label)} · \${escapeHtml(entry.health.detail)}</li>\`)
    .join("");

  target.innerHTML = \`
    <div class="sync-health-head">
      <div>
        <p class="section-label">Stabilite live</p>
        <h3>Suivi des synchronisations</h3>
      </div>
      <span class="sync-health-server \${serverTone}">\${escapeHtml(serverLabel)} · \${escapeHtml(serverDetail)}</span>
    </div>
    <div class="sync-health-strip">
      <span class="sync-health-pill is-ok">\${okCount} OK</span>
      <span class="sync-health-pill is-warn">\${warnCount} a surveiller</span>
      <span class="sync-health-pill is-danger">\${dangerCount} alerte</span>
      <span class="sync-health-pill is-done">\${doneCount} terminee</span>
    </div>
    \${attentionList ? \`<ul class="sync-health-alerts">\${attentionList}</ul>\` : '<p class="sync-health-note">Aucune alerte active sur les equipes en cours.</p>'}
  \`;
}

`;

function patchApp(js) {
  let next = bumpAssetVersions(js);

  if (!next.includes("const ADMIN_TEAM_SYNC_WARN_MS = 120000;")) {
    const variableMarker = "let lastLiveTeamRefreshAt = 0;";
    if (!next.includes(variableMarker)) throw new Error("live team refresh variable marker not found");
    next = next.replace(
      variableMarker,
      `${variableMarker}
let lastLiveTeamSuccessAt = 0;
let lastLiveTeamErrorAt = 0;
const ADMIN_TEAM_SYNC_WARN_MS = 120000;
const ADMIN_TEAM_SYNC_DANGER_MS = 300000;`,
    );
  }

  if (!next.includes("function renderTeamSyncSummary()")) {
    const helperMarker = "function renderTeamTable() {";
    if (!next.includes(helperMarker)) throw new Error("renderTeamTable marker not found");
    next = next.replace(helperMarker, `${syncHealthHelpers}${helperMarker}`);
  }

  if (!next.includes("const syncHealth = getTeamSyncHealth(team, route);")) {
    const progressMarker = `          const progress = getTeamProgress(team, route);
          const statusClass = team.status === "won" ? "is-success" : team.status === "lost" ? "is-danger" : "";`;
    if (!next.includes(progressMarker)) throw new Error("team progress marker not found");
    next = next.replace(
      progressMarker,
      `          const progress = getTeamProgress(team, route);
          const syncHealth = getTeamSyncHealth(team, route);
          const statusClass = team.status === "won" ? "is-success" : team.status === "lost" ? "is-danger" : "";`,
    );
  }

  if (!next.includes("renderTeamSyncBadge(syncHealth)")) {
    const rowMarker = `              '<td>' + renderTeamPosition(team, route) + '</td>',
              '<td><span class="state-text ' + statusClass + '">' + statusText + '</span></td>',`;
    if (!next.includes(rowMarker)) throw new Error("team table row marker not found");
    next = next.replace(
      rowMarker,
      `              '<td>' + renderTeamPosition(team, route) + '</td>',
              '<td>' + renderTeamSyncBadge(syncHealth) + '</td>',
              '<td><span class="state-text ' + statusClass + '">' + statusText + '</span></td>',`,
    );
  }

  next = next.replace(': \'<tr><td colspan="7">Aucune équipe connectée.</td></tr>\';', ': \'<tr><td colspan="8">Aucune équipe connectée.</td></tr>\';');

  if (!next.includes("renderTeamSyncSummary();\n  renderTeamLiveMap();")) {
    const tableEndMarker = `  renderTeamLiveMap();
}`;
    if (!next.includes(tableEndMarker)) throw new Error("team table end marker not found");
    next = next.replace(
      tableEndMarker,
      `  renderTeamSyncSummary();
  renderTeamLiveMap();
}`,
    );
  }

  if (!next.includes("lastLiveTeamErrorAt = Date.now();\n      renderTeamSyncSummary();\n      return;")) {
    const responseMarker = `    if (!response.ok) {
      serverSyncEnabled = false;
      return;
    }`;
    if (!next.includes(responseMarker)) throw new Error("live refresh response marker not found");
    next = next.replace(
      responseMarker,
      `    if (!response.ok) {
      serverSyncEnabled = false;
      lastLiveTeamErrorAt = Date.now();
      renderTeamSyncSummary();
      return;
    }`,
    );
  }

  if (!next.includes("lastLiveTeamSuccessAt = Date.now();")) {
    const successMarker = `    serverSyncEnabled = true;
    renderTeamTable();`;
    if (!next.includes(successMarker)) throw new Error("live refresh success marker not found");
    next = next.replace(
      successMarker,
      `    serverSyncEnabled = true;
    lastLiveTeamSuccessAt = Date.now();
    renderTeamTable();`,
    );
  }

  if (!next.includes("lastLiveTeamErrorAt = Date.now();\n    renderTeamSyncSummary();\n  } finally")) {
    const catchMarker = `  } catch (error) {
    console.warn(error);
    serverSyncEnabled = false;
  } finally {`;
    if (!next.includes(catchMarker)) throw new Error("live refresh catch marker not found");
    next = next.replace(
      catchMarker,
      `  } catch (error) {
    console.warn(error);
    serverSyncEnabled = false;
    lastLiveTeamErrorAt = Date.now();
    renderTeamSyncSummary();
  } finally {`,
    );
  }

  return next;
}

function patchStyles(css) {
  let next = css;
  if (next.includes("/* render-admin-sync-health-v99 */")) return next;
  return `${next.trimEnd()}

/* render-admin-sync-health-v99 */
.sync-health-summary {
  display: grid;
  gap: 12px;
  margin: 14px 0 16px;
  padding: 14px;
  border: 1px solid var(--line);
  border-radius: var(--radius);
  background: #fbfdfc;
}

.sync-health-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.sync-health-head h3 {
  margin: 2px 0 0;
  font-size: 1rem;
}

.sync-health-server,
.sync-health-pill {
  display: inline-flex;
  min-height: 30px;
  align-items: center;
  border-radius: 999px;
  padding: 0 10px;
  font-size: 0.76rem;
  font-weight: 900;
}

.sync-health-strip {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.sync-health-server.is-ok,
.sync-health-pill.is-ok {
  background: rgba(40, 127, 79, 0.12);
  color: var(--success);
}

.sync-health-server.is-danger,
.sync-health-pill.is-danger {
  background: rgba(184, 66, 61, 0.12);
  color: var(--danger);
}

.sync-health-pill.is-warn {
  background: rgba(216, 148, 44, 0.16);
  color: #7a4d09;
}

.sync-health-pill.is-done {
  background: #edf0ee;
  color: var(--muted);
}

.sync-health-alerts,
.sync-health-note {
  margin: 0;
}

.sync-health-alerts {
  display: grid;
  gap: 6px;
  padding-left: 18px;
  color: var(--danger);
  font-size: 0.84rem;
  line-height: 1.45;
}

.sync-health-note {
  color: var(--muted);
  font-size: 0.84rem;
}

.team-sync-badge {
  display: grid;
  min-width: 190px;
  gap: 4px;
  padding-left: 10px;
  border-left: 4px solid #dce6e1;
}

.team-sync-badge strong {
  font-size: 0.86rem;
}

.team-sync-badge span,
.team-sync-badge em {
  color: var(--muted);
  font-size: 0.78rem;
  font-style: normal;
  line-height: 1.35;
}

.team-sync-badge.is-ok {
  border-color: var(--success);
}

.team-sync-badge.is-warn {
  border-color: var(--amber);
}

.team-sync-badge.is-danger {
  border-color: var(--danger);
}

.team-sync-badge.is-done {
  border-color: #aebbb6;
}

.team-sync-badge.is-ok strong {
  color: var(--success);
}

.team-sync-badge.is-warn strong {
  color: #7a4d09;
}

.team-sync-badge.is-danger strong {
  color: var(--danger);
}

.team-sync-badge.is-done strong {
  color: var(--muted);
}

@media (max-width: 720px) {
  .sync-health-head {
    display: grid;
  }
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
console.log(`Admin sync health v${VERSION} applied.`);
