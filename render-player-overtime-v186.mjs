import { readFile, writeFile } from "node:fs/promises";

const VERSION = 186;
const scriptBaseUrl = new URL("./", import.meta.url);

async function patchFile(filePath, patcher) {
  const fileUrl = new URL(filePath, scriptBaseUrl);
  const input = await readFile(fileUrl, "utf8");
  const output = patcher(input);
  if (output !== input) await writeFile(fileUrl, output, "utf8");
}

function patchIndex(html) {
  return html
    .replace(/styles\.css\?v=\d+/g, `styles.css?v=${VERSION}`)
    .replace(/app\.js\?v=\d+/g, `app.js?v=${VERSION}`);
}

function patchApp(app) {
  const marker = `/* player-overtime-v${VERSION} */`;
  if (app.includes(marker)) return app;

  let next = app;

  next = next.replace(
    /function checkGameStatus\(team, route\) \{[\s\S]*?\n\}\n\nfunction startTicker/,
    `function checkGameStatus(team, route) {
  if (!team || !route || team.status !== "playing") return;
  const progress = getTeamProgress(team, route);
  if (progress.solved >= route.puzzles.length) {
    team.status = "won";
    if (typeof exitPlayerNavigationV183 === "function") exitPlayerNavigationV183();
    team.finishedAt = Date.now();
    touchTeam(team);
    saveData({ immediate: true });
    showToast("Bravo, parcours termine !");
    return;
  }
  if (remainingSeconds(team, route) <= 0 && !team.timeExpiredAt) {
    team.timeExpiredAt = Date.now();
    touchTeam(team);
    saveData({ immediate: true });
    showToast("Temps ecoule, mais vous pouvez continuer le parcours.");
  }
}

function startTicker`,
  );

  next = next.replace(/formatClock\(remainingSeconds\(team, route\)\)/g, "formatPlayerClockV186(team, route)");

  next = next.replace(
    "  const statusLabel = playerStatusLabelV151(team.status);\n  els.gameStatus.textContent = statusLabel;",
    "  const statusLabel = getPlayerStatusLabelV186(team, route);\n  els.gameStatus.textContent = statusLabel;",
  );
  next = next.replace(
    '  els.gameStatus.classList.toggle("is-briefing", isBriefing);',
    '  els.gameStatus.classList.toggle("is-briefing", isBriefing);\n  els.gameStatus.classList.toggle("is-overtime", isTeamOvertimeV186(team, route));',
  );

  const helpers = `${marker}
function isTeamOvertimeV186(team, route) {
  if (!team || !route || team.status !== "playing") return false;
  return elapsedSeconds(team) >= Math.max(0, Number(route.duration) || 0) * 60;
}

function formatOvertimeClockV186(seconds) {
  const safeSeconds = Math.max(0, Math.floor(Number(seconds) || 0));
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const rest = safeSeconds % 60;
  if (hours) {
    return "+" + hours + ":" + minutes.toString().padStart(2, "0") + ":" + rest.toString().padStart(2, "0");
  }
  return "+" + minutes.toString().padStart(2, "0") + ":" + rest.toString().padStart(2, "0");
}

function formatPlayerClockV186(team, route) {
  if (!team || !route) return "00:00";
  if (isTeamOvertimeV186(team, route)) {
    const overtimeSeconds = elapsedSeconds(team) - Math.max(0, Number(route.duration) || 0) * 60;
    return formatOvertimeClockV186(overtimeSeconds);
  }
  return formatClock(remainingSeconds(team, route));
}

function getPlayerStatusLabelV186(team, route) {
  if (isTeamOvertimeV186(team, route)) {
    const labels = {
      fr: "Temps depasse",
      en: "Time exceeded",
      nl: "Tijd voorbij",
    };
    const language = typeof playerLangV151 === "function" ? playerLangV151() : "fr";
    return labels[language] || labels.fr;
  }
  return playerStatusLabelV151(team?.status);
}
`;

  next = next.replace("\nfunction renderPuzzleMedia(puzzle, unlocked) {", `\n${helpers}\nfunction renderPuzzleMedia(puzzle, unlocked) {`);
  return next;
}

function patchStyles(css) {
  const marker = `/* player-overtime-v${VERSION} */`;
  if (css.includes(marker)) return css;
  return `${css.trimEnd()}

${marker}
.status-pill.is-overtime {
  border-color: rgba(216, 148, 44, 0.5);
  background: #fff4d8;
  color: #7a4d00;
}
`;
}

await patchFile("index.html", patchIndex);
await patchFile("app.js", patchApp);
await patchFile("styles.css", patchStyles);
await patchFile("service-worker.js", (worker) => worker.replace(/escape-erezee-v\d+/g, `escape-erezee-v${VERSION}`));

console.log(`Player overtime v${VERSION} applied.`);
