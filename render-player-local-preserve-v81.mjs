import { access, readFile, writeFile } from "node:fs/promises";

const VERSION = 81;

async function patchTextFile(filePath, patcher) {
  const input = await readFile(filePath, "utf8");
  const output = patcher(input);
  if (output !== input) await writeFile(filePath, output, "utf8");
}

async function patchIfExists(filePath, patcher) {
  try { await access(filePath); } catch { return; }
  await patchTextFile(filePath, patcher);
}

function patchApp(app) {
  let next = app;

  if (!next.includes("function getSessionTeamSyncFreshness")) {
    next = next.replace(
      "async function syncDataFromServer() {",
      `function getSessionTeamSyncFreshness(team) {
  if (!team) return 0;
  return Math.max(
    Number(team.updatedAt) || 0,
    Number(team.lastPosition?.at) || 0,
    Number(team.finishedAt) || 0,
    Number(team.startAt) || 0,
  );
}

function getSessionTeamAnswerCount(team) {
  return Object.keys(team?.answers || {}).length;
}

function shouldPreserveLocalSessionTeam(localTeam, serverTeam) {
  if (!localTeam) return false;
  if (!serverTeam) return true;
  return (
    getSessionTeamAnswerCount(localTeam) >= getSessionTeamAnswerCount(serverTeam)
    && getSessionTeamSyncFreshness(localTeam) >= getSessionTeamSyncFreshness(serverTeam)
  );
}

function mergeLocalSessionTeam(serverData, localTeam, localTeamId) {
  if (!localTeam || !localTeamId || isAdminRouteActive()) {
    return { data: serverData, preserved: false };
  }
  const hasKnownCode = serverData.codes?.some((code) => code.code === localTeam.code || code.teamId === localTeamId);
  if (!hasKnownCode) {
    return { data: serverData, preserved: false };
  }
  const serverTeam = serverData.teams.find((team) => team.id === localTeamId);
  if (!shouldPreserveLocalSessionTeam(localTeam, serverTeam)) {
    return { data: serverData, preserved: false };
  }
  return {
    data: {
      ...serverData,
      teams: [
        ...serverData.teams.filter((team) => team.id !== localTeamId),
        localTeam,
      ],
    },
    preserved: true,
  };
}

async function syncDataFromServer() {`,
    );
  }

  const oldSync = `    data = serverData;
    saveData({ sync: false });`;
  const newSync = `    const localTeamId = localStorage.getItem(SESSION_KEY);
    const localTeam = localTeamId ? data.teams.find((team) => team.id === localTeamId) : null;
    const mergedSession = mergeLocalSessionTeam(serverData, localTeam, localTeamId);
    data = mergedSession.data;
    saveData(mergedSession.preserved ? { immediate: true } : { sync: false });`;
  if (!next.includes("const mergedSession = mergeLocalSessionTeam(serverData, localTeam, localTeamId);")) {
    if (!next.includes(oldSync)) {
      throw new Error(`Patch v${VERSION} introuvable: sync session locale`);
    }
    next = next.replace(oldSync, newSync);
  }

  return next;
}

function patchHtml(html) {
  return html.replace(/app\.js\?v=\d+/g, `app.js?v=${VERSION}`).replace(/styles\.css\?v=\d+/g, `styles.css?v=${VERSION}`);
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
console.log("Player local preserve v81 applied.");
