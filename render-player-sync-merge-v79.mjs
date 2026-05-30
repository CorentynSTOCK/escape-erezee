import { access, readFile, writeFile } from "node:fs/promises";

const VERSION = 79;

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

function insertAfterFunction(input, signature, insertion, marker) {
  if (input.includes(marker)) return input;
  const start = input.indexOf(signature);
  if (start < 0) {
    throw new Error(`Patch v${VERSION} introuvable: ${signature}`);
  }
  const end = findFunctionEnd(input, start);
  if (end < 0) {
    throw new Error(`Patch v${VERSION} impossible: insertion apres ${signature}`);
  }
  return input.slice(0, end) + "\n\n" + insertion + input.slice(end);
}

function patchServer(server) {
  let next = server;

  next = replaceFunction(next, "function codesKeepSameCatalog", `function codesKeepSameCatalog(previousCodes, nextCodes) {
  if (!Array.isArray(previousCodes) || !Array.isArray(nextCodes)) return false;

  const previousByCode = new Map(previousCodes.map((code) => [code.code, code]));
  return nextCodes.every((nextCode) => {
    const previousCode = previousByCode.get(nextCode.code);
    if (!previousCode) return false;
    return (
      previousCode.routeId === nextCode.routeId
      && previousCode.createdAt === nextCode.createdAt
      && ["available", "used"].includes(nextCode.status)
      && (nextCode.teamId === null || typeof nextCode.teamId === "string")
    );
  });
}`);

  next = replaceFunction(next, "function isPlayerSafeUpdate", `function isPlayerSafeUpdate(previousData, nextData) {
  if (!previousData) return true;
  return (
    codesKeepSameCatalog(previousData.codes, nextData.codes)
    && Array.isArray(nextData.teams)
  );
}`);

  next = insertAfterFunction(next, "function isPlayerSafeUpdate", `function asObjectMap(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function mergeNumberMap(previous, next) {
  const merged = { ...asObjectMap(previous) };
  Object.entries(asObjectMap(next)).forEach(([key, value]) => {
    const nextNumber = Number(value);
    const previousNumber = Number(merged[key]);
    if (!Object.prototype.hasOwnProperty.call(merged, key)) {
      merged[key] = value;
      return;
    }
    if (Number.isFinite(nextNumber) && (!Number.isFinite(previousNumber) || nextNumber > previousNumber)) {
      merged[key] = value;
    }
  });
  return merged;
}

function mergeStringList(previous, next) {
  return Array.from(new Set([
    ...(Array.isArray(previous) ? previous : []),
    ...(Array.isArray(next) ? next : []),
  ].filter((item) => typeof item === "string" && item)));
}

function isTerminalTeamStatus(status) {
  return status === "won" || status === "lost";
}

function getTeamFreshness(team) {
  return Math.max(
    Number(team?.updatedAt) || 0,
    Number(team?.lastPosition?.at) || 0,
    Number(team?.finishedAt) || 0,
    Number(team?.startAt) || 0,
  );
}

function countTeamAnswers(team) {
  return Object.keys(asObjectMap(team?.answers)).length;
}

function mergePlayerTeam(previousTeam, nextTeam) {
  const previous = previousTeam && typeof previousTeam === "object" ? previousTeam : {};
  const next = nextTeam && typeof nextTeam === "object" ? nextTeam : {};
  const merged = { ...previous };
  const previousFreshness = getTeamFreshness(previous);
  const nextFreshness = getTeamFreshness(next);

  if (nextFreshness >= previousFreshness) {
    ["name", "routeId", "code"].forEach((field) => {
      if (typeof next[field] === "string" && next[field]) {
        merged[field] = next[field];
      }
    });
  }

  merged.answers = { ...asObjectMap(previous.answers), ...asObjectMap(next.answers) };
  merged.unlockedPuzzleIds = mergeStringList(previous.unlockedPuzzleIds, next.unlockedPuzzleIds);
  merged.attempts = mergeNumberMap(previous.attempts, next.attempts);
  merged.hints = mergeNumberMap(previous.hints, next.hints);
  merged.photoNames = { ...asObjectMap(previous.photoNames), ...asObjectMap(next.photoNames) };

  if (!merged.startAt && next.startAt) {
    merged.startAt = next.startAt;
  }

  const previousPositionAt = Number(previous.lastPosition?.at) || 0;
  const nextPositionAt = Number(next.lastPosition?.at) || 0;
  if (next.lastPosition && nextPositionAt >= previousPositionAt) {
    merged.lastPosition = next.lastPosition;
  }

  const previousTerminal = isTerminalTeamStatus(previous.status);
  const nextTerminal = isTerminalTeamStatus(next.status);
  if (nextTerminal && (!previousTerminal || countTeamAnswers(next) >= countTeamAnswers(previous) || (Number(next.finishedAt) || 0) >= (Number(previous.finishedAt) || 0))) {
    merged.status = next.status;
    merged.finishedAt = next.finishedAt || previous.finishedAt || next.updatedAt || Date.now();
  } else if (previousTerminal) {
    merged.status = previous.status;
    merged.finishedAt = previous.finishedAt;
  } else if (next.status) {
    merged.status = previous.status === "playing" && next.status === "briefing" ? previous.status : next.status;
    if (!isTerminalTeamStatus(merged.status)) {
      merged.finishedAt = null;
    }
  }

  merged.updatedAt = Math.max(
    Number(previous.updatedAt) || 0,
    Number(next.updatedAt) || 0,
    Number(merged.lastPosition?.at) || 0,
    Number(merged.finishedAt) || 0,
  ) || previous.updatedAt || next.updatedAt || Date.now();

  return merged;
}

function mergePlayerCodes(previousCodes, nextCodes) {
  const nextByCode = new Map((Array.isArray(nextCodes) ? nextCodes : []).map((code) => [code.code, code]));
  return (Array.isArray(previousCodes) ? previousCodes : []).map((previousCode) => {
    const nextCode = nextByCode.get(previousCode.code);
    if (!nextCode || previousCode.teamDeletedAt) return previousCode;
    const merged = { ...previousCode };
    if (nextCode.status === "used") {
      merged.status = "used";
    }
    if (!merged.teamId && typeof nextCode.teamId === "string") {
      merged.teamId = nextCode.teamId;
    }
    return merged;
  });
}

function canAddPlayerTeam(data, team) {
  if (!team?.id) return false;
  const code = (data.codes || []).find((item) => item.code === team.code || item.teamId === team.id);
  return Boolean(
    code
      && !code.teamDeletedAt
      && (!code.teamId || code.teamId === team.id || code.code === team.code)
  );
}

function mergePlayerSafeData(previousData, nextData) {
  if (!previousData) return nextData;
  const merged = {
    ...previousData,
    codes: mergePlayerCodes(previousData.codes, nextData.codes),
    teams: Array.isArray(previousData.teams) ? previousData.teams.map((team) => ({ ...team })) : [],
  };

  const teamIndexById = new Map(merged.teams.map((team, index) => [team.id, index]));
  (Array.isArray(nextData.teams) ? nextData.teams : []).forEach((nextTeam) => {
    if (!nextTeam?.id) return;
    const existingIndex = teamIndexById.get(nextTeam.id);
    if (existingIndex !== undefined) {
      merged.teams[existingIndex] = mergePlayerTeam(merged.teams[existingIndex], nextTeam);
      return;
    }
    if (!canAddPlayerTeam(merged, nextTeam)) return;
    const addedTeam = mergePlayerTeam({}, nextTeam);
    teamIndexById.set(addedTeam.id, merged.teams.length);
    merged.teams.push(addedTeam);
    const code = merged.codes.find((item) => item.code === addedTeam.code || item.teamId === addedTeam.id);
    if (code && !code.teamDeletedAt) {
      code.status = "used";
      code.teamId = addedTeam.id;
    }
  });

  return merged;
}`, "function mergePlayerSafeData(");

  if (!next.includes("mergePlayerSafeData(stored, payload)")) {
    const saveResultStart = next.indexOf("const saveResult = await withDataMutation");
    const storedStart = next.indexOf("        const stored = await readStoredData();", saveResultStart);
    const saveReturn = "        return { status: 200, payload: { ok: true, savedAt: Date.now() } };";
    const saveReturnEnd = next.indexOf(saveReturn, storedStart) + saveReturn.length;
    if (saveResultStart < 0 || storedStart < 0 || saveReturnEnd < saveReturn.length) {
      throw new Error(`Patch v${VERSION} introuvable: sauvegarde API data`);
    }
    const newSave = `        const stored = await readStoredData();
        const adminWrite = isAdminRequest(request);
        if (!adminWrite && !isPlayerSafeUpdate(stored, payload)) {
          return { status: 403, payload: { message: "Acces gestion requis." } };
        }
        const nextPayload = adminWrite || !stored ? payload : mergePlayerSafeData(stored, payload);
        await writeStoredData(nextPayload);
        return { status: 200, payload: { ok: true, savedAt: Date.now() } };`;
    next = next.slice(0, storedStart) + newSave + next.slice(saveReturnEnd);
  }

  return next;
}

function replaceOnce(input, search, replacement, label) {
  if (!input.includes(search)) {
    throw new Error(`Patch v${VERSION} introuvable: ${label}`);
  }
  return input.replace(search, replacement);
}

function patchApp(app) {
  let next = app;

  if (!next.includes('updatedAt: Date.now(),\n      answers: {},')) {
    next = replaceOnce(
      next,
      'status: "briefing",\n      answers: {},',
      'status: "briefing",\n      updatedAt: Date.now(),\n      answers: {},',
      'creation equipe updatedAt',
    );
  }

  next = next.replace(
    'team.name = name;\n  saveData();',
    'team.name = name;\n  touchTeam(team);\n  saveData();',
  );

  next = next.replace(
    'team.answers[puzzle.id] = input.value.trim();\n    unlockNextPuzzle(team, route, puzzle.id);\n    saveData();',
    'team.answers[puzzle.id] = input.value.trim();\n    unlockNextPuzzle(team, route, puzzle.id);\n    touchTeam(team);\n    saveData();',
  );

  next = next.replace(
    'team.attempts[puzzle.id] = (team.attempts[puzzle.id] || 0) + 1;\n\n  if (proposed === expected) {',
    'team.attempts[puzzle.id] = (team.attempts[puzzle.id] || 0) + 1;\n  touchTeam(team);\n\n  if (proposed === expected) {',
  );

  next = next.replace(
    'team.answers[puzzle.id] = "Photo envoyée";\n  unlockNextPuzzle(team, route, puzzle.id);\n  saveData();',
    'team.answers[puzzle.id] = "Photo envoyée";\n  unlockNextPuzzle(team, route, puzzle.id);\n  touchTeam(team);\n  saveData();',
  );

  next = next.replace(
    'team.hints[puzzle.id] = shownCount + 1;\n  saveData();',
    'team.hints[puzzle.id] = shownCount + 1;\n  touchTeam(team);\n  saveData();',
  );

  return next;
}

function patchHtml(html) {
  return html
    .replace(/app\.js\?v=\d+/g, `app.js?v=${VERSION}`)
    .replace(/styles\.css\?v=\d+/g, `styles.css?v=${VERSION}`);
}

function patchServiceWorker(worker) {
  let next = worker.replace(/escape-erezee-v\d+/g, `escape-erezee-v${VERSION}`);
  next = next.replace(/"\.\/app\.js(?:\?v=\d+)?"/g, `"./app.js?v=${VERSION}"`);
  next = next.replace(/"\.\/styles\.css(?:\?v=\d+)?"/g, `"./styles.css?v=${VERSION}"`);
  return next;
}

await patchTextFile("server.mjs", patchServer);
await patchTextFile("app.js", patchApp);
await patchIfExists("index.html", patchHtml);
await patchIfExists("suivi.html", patchHtml);
await patchTextFile("service-worker.js", patchServiceWorker);

console.log("Player sync merge v79 applied.");
