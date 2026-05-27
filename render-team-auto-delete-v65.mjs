import { readFile, writeFile } from "node:fs/promises";

const VERSION = 65;
const TEAM_AUTO_DELETE_MS = 3 * 60 * 60 * 1000;

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

function ensureIndex(html) {
  let next = html
    .replace(/styles\.css\?v=\d+/g, `styles.css?v=${VERSION}`)
    .replace(/app\.js\?v=\d+/g, `app.js?v=${VERSION}`);

  next = next.replace(
    `                      <th>Progression</th>
                      <th>État</th>`,
    `                      <th>Progression</th>
                      <th>État</th>
                      <th>Action</th>`,
  );

  return next;
}

const START_TICKER = `function startTicker() {
  clearInterval(ticker);
  ticker = setInterval(() => {
    const team = getCurrentTeam();
    if (team) {
      const route = getRoute(team.routeId);
      checkGameStatus(team, route);
      renderPlayer();
    }
    if (location.hash.replace("#", "") === "admin") {
      renderTeamTable();
    }
  }, 1000);
}

`;

const TEAM_TABLE = `const TEAM_AUTO_DELETE_MS = ${TEAM_AUTO_DELETE_MS};

function getTeamStartedAt(team) {
  return Number(team?.startAt || team?.createdAt || 0);
}

function getTeamDeleteAvailability(team) {
  if (!team) return { available: false, label: "" };
  if (team.status === "won" || team.status === "lost") {
    return { available: true, label: "Partie terminée" };
  }
  const startedAt = getTeamStartedAt(team);
  if (!startedAt) return { available: false, label: "En cours" };
  const remainingMs = TEAM_AUTO_DELETE_MS - (Date.now() - startedAt);
  if (remainingMs <= 0) {
    return { available: true, label: "Plus de 3h" };
  }
  const remainingMinutes = Math.max(1, Math.ceil(remainingMs / 60000));
  return { available: false, label: "Suppression dans " + remainingMinutes + " min" };
}

function deleteTeamFromProgress(teamId) {
  const team = data.teams.find((item) => item.id === teamId);
  if (!team) return;
  const availability = getTeamDeleteAvailability(team);
  if (!availability.available) {
    showToast("Suppression disponible après 3h ou une fois la partie terminée.");
    return;
  }
  if (!window.confirm("Supprimer " + team.name + " de la progression ?")) return;

  data.teams = data.teams.filter((item) => item.id !== teamId);
  const code = data.codes.find((item) => item.teamId === teamId || item.code === team.code);
  if (code) {
    code.teamId = null;
    code.status = "used";
    code.teamDeletedAt = Date.now();
  }
  if (localStorage.getItem(SESSION_KEY) === teamId) {
    localStorage.removeItem(SESSION_KEY);
  }
  saveData();
  renderAdmin();
  renderPlayer();
  showToast("Équipe supprimée de la progression.");
}

function renderTeamTable() {
  els.teamTable.innerHTML = data.teams.length
    ? data.teams
        .map((team) => {
          const route = getRoute(team.routeId);
          if (!route) return "";
          const progress = getTeamProgress(team, route);
          const statusClass = team.status === "won" ? "is-success" : team.status === "lost" ? "is-danger" : "";
          const statusText = team.status === "won" ? "Gagné" : team.status === "lost" ? "Perdu" : "En cours";
          const deleteInfo = getTeamDeleteAvailability(team);
          const action = deleteInfo.available
            ? '<button class="danger-button compact-button" type="button" data-delete-team="' + escapeHtml(team.id) + '">Supprimer</button>'
            : '<span class="position-muted">' + escapeHtml(deleteInfo.label) + '</span>';
          return [
            '<tr>',
              '<td><strong>' + escapeHtml(team.name) + '</strong></td>',
              '<td>' + escapeHtml(team.code) + '</td>',
              '<td>' + escapeHtml(route.title) + '</td>',
              '<td><div class="mini-progress"><span>' + progress.solved + ' / ' + progress.total + '</span><span class="mini-progress-bar"><span style="width:' + progress.percent + '%"></span></span></div></td>',
              '<td><span class="state-text ' + statusClass + '">' + statusText + '</span></td>',
              '<td>' + action + '</td>',
            '</tr>',
          ].join("");
        })
        .join("")
    : '<tr><td colspan="6">Aucune équipe connectée.</td></tr>';

  $$("[data-delete-team]").forEach((button) => {
    button.addEventListener("click", () => deleteTeamFromProgress(button.dataset.deleteTeam));
  });
}

`;

function ensureApp(app) {
  let next = app;

  next = next.replace(
    `function startTicker() {
  clearInterval(ticker);
  ticker = setInterval(() => {
    const team = getCurrentTeam();
    if (!team) return;
    const route = getRoute(team.routeId);
    checkGameStatus(team, route);
    renderPlayer();
    renderTeamTable();
  }, 1000);
}

`,
    START_TICKER,
  );

  next = next.replace(
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
    els.activationMessage.textContent = "Cette partie a été retirée de la progression. Demandez un nouveau code si nécessaire.";
    return;
  }

  let team = code.teamId ? data.teams.find((item) => item.id === code.teamId) : null;`,
  );

  next = replaceBetween(next, "function renderTeamTable()", "function renderCodeList()", TEAM_TABLE);
  return next;
}

function ensureStyles(css) {
  if (css.includes("/* team-auto-delete-v65 */")) return css;
  return `${css}

/* team-auto-delete-v65 */
.compact-button {
  min-height: 34px;
  padding: 0 10px;
  font-size: 0.82rem;
}

.position-muted {
  color: var(--muted);
  font-size: 0.82rem;
  font-weight: 800;
}
`;
}

await patchTextFile("index.html", ensureIndex);
await patchTextFile("app.js", ensureApp);
await patchTextFile("styles.css", ensureStyles);
await patchTextFile("service-worker.js", (worker) => worker.replace(/escape-erezee-v\d+/g, `escape-erezee-v${VERSION}`));

console.log("Team auto delete v65 applique.");
