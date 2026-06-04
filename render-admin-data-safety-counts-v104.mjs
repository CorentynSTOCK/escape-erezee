import { readFile, writeFile } from "node:fs/promises";

const VERSION = 104;
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

function findFunctionEnd(input, start) {
  const bodyStart = input.indexOf("{", start);
  if (bodyStart < 0) return -1;
  let depth = 0;
  let quote = null;
  let escaped = false;
  for (let index = bodyStart; index < input.length; index += 1) {
    const char = input[index];
    if (quote) {
      if (escaped) escaped = false;
      else if (char === "\\") escaped = true;
      else if (char === quote) quote = null;
      continue;
    }
    if (char === '"' || char === "'" || char === "`") {
      quote = char;
      continue;
    }
    if (char === "{") depth += 1;
    if (char === "}") {
      depth -= 1;
      if (depth === 0) return index + 1;
    }
  }
  return -1;
}

function replaceFunction(input, signature, replacement) {
  const start = input.indexOf(signature);
  if (start < 0) throw new Error(`Patch v${VERSION} introuvable: ${signature}`);
  const end = findFunctionEnd(input, start);
  if (end < 0) throw new Error(`Patch v${VERSION} impossible: ${signature}`);
  return `${input.slice(0, start)}${replacement}${input.slice(end)}`;
}

const DATA_STATUS_FUNCTION = `async function getDataSafetyStatus() {
  const stored = await readStoredData();
  const dataFileStat = await stat(DATA_FILE).catch((error) => {
    if (error.code === "ENOENT") return null;
    throw error;
  });
  const backups = await listDataBackups();
  const routes = Array.isArray(stored?.routes) ? stored.routes : [];
  const routeIds = new Set(routes.map((route) => route?.id).filter(Boolean));
  const teams = Array.isArray(stored?.teams) ? stored.teams : [];
  const codes = Array.isArray(stored?.codes) ? stored.codes : [];
  const teamsLinkedToRoutes = teams.filter((team) => routeIds.has(team?.routeId));
  const teamsWithoutRoute = teams.filter((team) => team?.routeId && !routeIds.has(team.routeId));
  const codesLinkedToRoutes = codes.filter((code) => routeIds.has(code?.routeId));
  const codesWithoutRoute = codes.filter((code) => code?.routeId && !routeIds.has(code.routeId));

  return {
    ok: true,
    data: stored ? {
      routes: routes.length,
      teams: teams.length,
      teamTracking: teamsLinkedToRoutes.length,
      teamArchive: teamsWithoutRoute.length,
      teamPlaying: teamsLinkedToRoutes.filter((team) => team.status === "playing").length,
      teamWon: teamsLinkedToRoutes.filter((team) => team.status === "won").length,
      codes: codes.length,
      codesLinkedToRoutes: codesLinkedToRoutes.length,
      codesWithoutRoute: codesWithoutRoute.length,
      activeRouteId: stored.activeRouteId || null,
      size: dataFileStat?.size || 0,
      modifiedAt: dataFileStat?.mtimeMs || null,
    } : null,
    backups: {
      count: backups.length,
      latest: backups[0] || null,
      recent: backups.slice(0, 5),
    },
  };
}`;

function patchServer(server) {
  if (!server.includes("async function getDataSafetyStatus")) return server;
  if (server.includes("teamTracking: teamsLinkedToRoutes.length")) return server;
  return replaceFunction(server, "async function getDataSafetyStatus", DATA_STATUS_FUNCTION);
}

const DATA_SAFETY_RENDER_FUNCTION = `function adminDataSafetyRender(payload) {
  const refs = adminDataSafetyEnsurePanel();
  if (!refs) return;

  if (!payload?.ok || !payload.data) {
    refs.status.textContent = payload?.message || "Statut des sauvegardes indisponible.";
    return;
  }

  const data = payload.data;
  const backups = payload.backups || {};
  const trackedTeams = Number(data.teamTracking ?? data.teams ?? 0);
  const totalTeams = Number(data.teams ?? 0);
  const archivedTeams = Number(data.teamArchive ?? Math.max(0, totalTeams - trackedTeams));
  const teamText = archivedTeams > 0
    ? trackedTeams + " equipes dans le suivi (" + totalTeams + " total, " + archivedTeams + " anciennes sans parcours)"
    : trackedTeams + " equipes dans le suivi";
  const latest = backups.latest
    ? "Derniere sauvegarde : " + adminDataSafetyFormatTime(backups.latest.modifiedAt)
    : "Aucune sauvegarde disponible.";
  refs.status.textContent = [
    data.routes + " parcours",
    teamText,
    data.codes + " codes",
    backups.count + " sauvegarde" + (backups.count > 1 ? "s" : ""),
    latest,
  ].join(" - ");
}`;

function patchApp(app) {
  if (!app.includes("admin-data-safety-v103")) return app;
  let next = app;
  if (!next.includes("admin-data-safety-counts-v104")) {
    next = replaceFunction(next, "function adminDataSafetyRender", DATA_SAFETY_RENDER_FUNCTION);
    next = `${next}\n/* admin-data-safety-counts-v104 */\n`;
  }
  return next;
}

function patchServiceWorker(worker) {
  return bumpAssetVersions(worker).replace(/escape-erezee-v\d+/g, `escape-erezee-v${VERSION}`);
}

await patchTextFile("server.mjs", patchServer);
await patchTextFile("app.js", patchApp);
await patchTextFile("index.html", bumpAssetVersions);
await patchTextFile("service-worker.js", patchServiceWorker);
