import { readFile, writeFile } from "node:fs/promises";

async function patchTextFile(path, updater) {
  const before = await readFile(path, "utf8");
  const after = updater(before);
  if (after !== before) {
    await writeFile(path, after, "utf8");
  }
}

await patchTextFile("index.html", (html) => html
  .replace(/styles\.css\?v=\d+/g, "styles.css?v=45")
  .replace(/app\.js\?v=\d+/g, "app.js?v=45"));

await patchTextFile("service-worker.js", (worker) => worker
  .replace(/escape-erezee-v\d+/g, "escape-erezee-v45"));

await patchTextFile("app.js", (source) => {
  let next = source;

  next = next.replace(
    `      const serverTeamExists = currentTeamId && serverData.teams.some((team) => team.id === currentTeamId);
      data.teams = serverTeamExists || !currentTeam
        ? serverData.teams
        : [...serverData.teams, currentTeam];`,
    `      data.teams = currentTeam && currentTeamId
        ? [
            ...serverData.teams.filter((team) => team.id !== currentTeamId),
            currentTeam,
          ]
        : serverData.teams;`,
  );

  if (!next.includes("function getAnswerContext(teamId, routeId, puzzleId)")) {
    next = next.replace(
      `function renderAnswerZone(team, route, puzzle, unlocked) {`,
      `function getAnswerContext(teamId, routeId, puzzleId) {
  const team = data.teams.find((item) => item.id === teamId) || getCurrentTeam();
  const route = getRoute(team?.routeId || routeId);
  const puzzle = route?.puzzles.find((item) => item.id === puzzleId);
  return { team, route, puzzle };
}

function renderAnswerZone(team, route, puzzle, unlocked) {`,
    );
  }

  if (!next.includes("const teamId = team.id;")) {
    next = next.replace(
      `  if (!unlocked) {
    els.answerZone.innerHTML = "";
    return;
  }

  if (gameClosed) {`,
      `  if (!unlocked) {
    els.answerZone.innerHTML = "";
    return;
  }

  const teamId = team.id;
  const routeId = route.id;
  const puzzleId = puzzle.id;

  if (gameClosed) {`,
    );
  }

  next = next.replace(
    `      submitPhotoAnswer(team, route, puzzle);`,
    `      const context = getAnswerContext(teamId, routeId, puzzleId);
      if (!context.team || !context.route || !context.puzzle) return;
      submitPhotoAnswer(context.team, context.route, context.puzzle);`,
  );

  next = next.replace(
    `    submitTextAnswer(team, route, puzzle);`,
    `    const context = getAnswerContext(teamId, routeId, puzzleId);
    if (!context.team || !context.route || !context.puzzle) return;
    submitTextAnswer(context.team, context.route, context.puzzle);`,
  );

  next = next.replace(
    `  if (nextPuzzle && !nextPuzzle.requireLocation) {
    team.unlockedPuzzleIds.push(nextPuzzle.id);
  }`,
    `  if (nextPuzzle && !nextPuzzle.requireLocation && !team.unlockedPuzzleIds.includes(nextPuzzle.id)) {
    team.unlockedPuzzleIds.push(nextPuzzle.id);
  }`,
  );

  return next;
});
