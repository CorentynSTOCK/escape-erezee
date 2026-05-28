import { access, readFile, writeFile } from "node:fs/promises";

const VERSION = 77;

async function patchTextFile(filePath, patcher) {
  const input = await readFile(filePath, "utf8");
  const output = patcher(input);
  if (output !== input) {
    await writeFile(filePath, output, "utf8");
  }
}

async function patchIfExists(filePath, patcher) {
  try {
    await access(filePath);
  } catch {
    return;
  }
  await patchTextFile(filePath, patcher);
}

function findFunctionEnd(input, start) {
  const bodyStart = input.indexOf("{", start);
  if (bodyStart < 0) return -1;

  let depth = 0;
  let quote = null;
  let escaped = false;
  for (let i = bodyStart; i < input.length; i += 1) {
    const char = input[i];
    if (quote) {
      if (escaped) {
        escaped = false;
      } else if (char === "\\") {
        escaped = true;
      } else if (char === quote) {
        quote = null;
      }
      continue;
    }
    if (char === '"' || char === "'" || char === "`") {
      quote = char;
      continue;
    }
    if (char === "{") depth += 1;
    if (char === "}") {
      depth -= 1;
      if (depth === 0) return i + 1;
    }
  }
  return -1;
}

function replaceFunction(input, signature, replacement) {
  const start = input.indexOf(signature);
  if (start < 0) {
    throw new Error(`Patch v${VERSION} introuvable: ${signature}`);
  }
  const end = findFunctionEnd(input, start);
  if (end < 0) {
    throw new Error(`Patch v${VERSION} impossible: fin de ${signature}`);
  }
  return input.slice(0, start) + replacement + input.slice(end);
}

function patchApp(app) {
  let next = app;

  const tableStart = next.indexOf("function renderTeamTable()");
  const tableEnd = tableStart >= 0 ? findFunctionEnd(next, tableStart) : -1;
  const currentTable = tableStart >= 0 && tableEnd > tableStart ? next.slice(tableStart, tableEnd) : "";
  if (!currentTable.includes("renderTeamPosition(team, route)")) {
    next = replaceFunction(next, "function renderTeamTable()", `function renderTeamTable() {
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
              '<td>' + renderTeamPosition(team, route) + '</td>',
              '<td><span class="state-text ' + statusClass + '">' + statusText + '</span></td>',
              '<td>' + action + '</td>',
            '</tr>',
          ].join("");
        })
        .join("")
    : '<tr><td colspan="7">Aucune équipe connectée.</td></tr>';

  $$("[data-delete-team]").forEach((button) => {
    button.addEventListener("click", () => deleteTeamFromProgress(button.dataset.deleteTeam));
  });
  renderTeamLiveMap();
}`);
  }

  const refreshStart = next.indexOf("async function refreshLiveTeamsFromServer()");
  const refreshEnd = refreshStart >= 0 ? findFunctionEnd(next, refreshStart) : -1;
  const currentRefresh = refreshStart >= 0 && refreshEnd > refreshStart ? next.slice(refreshStart, refreshEnd) : "";
  if (!currentRefresh.includes('"?live=" + Date.now()')) {
    next = replaceFunction(next, "async function refreshLiveTeamsFromServer()", `async function refreshLiveTeamsFromServer() {
  if (!canUseBackend() || liveTeamRefreshInFlight) return;
  if (!isAdminRouteActive() || !adminAuthenticated) return;

  liveTeamRefreshInFlight = true;
  lastLiveTeamRefreshAt = Date.now();
  try {
    const response = await fetch(API_DATA_URL + "?live=" + Date.now(), {
      headers: { Accept: "application/json" },
      cache: "no-store",
      credentials: "same-origin",
    });
    if (!response.ok) {
      serverSyncEnabled = false;
      return;
    }

    const serverData = await response.json();
    if (!isValidAppData(serverData)) return;

    data.teams = serverData.teams;
    data.codes = serverData.codes;
    saveData({ sync: false });
    serverSyncEnabled = true;
    renderTeamTable();
    renderCodeList();
  } catch (error) {
    console.warn(error);
    serverSyncEnabled = false;
  } finally {
    liveTeamRefreshInFlight = false;
  }
}`);
  }

  return next;
}

function patchHtml(html) {
  let next = html
    .replace(/app\.js\?v=\d+/g, `app.js?v=${VERSION}`)
    .replace(/styles\.css\?v=\d+/g, `styles.css?v=${VERSION}`);

  if (!next.includes("<th>Position</th>")) {
    next = next.replace(
      `<th>Progression</th>\n                      <th>État</th>`,
      `<th>Progression</th>\n                      <th>Position</th>\n                      <th>État</th>`,
    );
  }
  if (!next.includes("<th>Action</th>")) {
    next = next.replace(
      `<th>État</th>`,
      `<th>État</th>\n                      <th>Action</th>`,
    );
  }
  return next;
}

function patchServiceWorker(worker) {
  let next = worker.replace(/escape-erezee-v\d+/g, `escape-erezee-v${VERSION}`);
  next = next.replace(/"\.\/app\.js(?:\?v=\d+)?"/g, `"./app.js?v=${VERSION}"`);
  next = next.replace(/"\.\/styles\.css(?:\?v=\d+)?"/g, `"./styles.css?v=${VERSION}"`);
  return next;
}

await patchTextFile("app.js", patchApp);
await patchIfExists("index.html", patchHtml);
await patchIfExists("suivi.html", patchHtml);
await patchTextFile("service-worker.js", patchServiceWorker);

console.log("Admin progress v77 applied.");
