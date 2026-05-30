import { access, readFile, writeFile } from "node:fs/promises";

const VERSION = 83;

async function patchTextFile(filePath, patcher) {
  const input = await readFile(filePath, "utf8");
  const output = patcher(input);
  if (output !== input) await writeFile(filePath, output, "utf8");
}

async function patchIfExists(filePath, patcher) {
  try { await access(filePath); } catch { return; }
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

function replaceInFunction(input, signature, replacer) {
  const start = input.indexOf(signature);
  if (start < 0) {
    throw new Error(`Patch v${VERSION} introuvable: ${signature}`);
  }
  const end = findFunctionEnd(input, start);
  if (end < 0) {
    throw new Error(`Patch v${VERSION} impossible: fin de ${signature}`);
  }
  const body = input.slice(start, end);
  return input.slice(0, start) + replacer(body) + input.slice(end);
}

function patchApp(app) {
  let next = app;

  if (!next.includes("const ADMIN_DELETE_TOMBSTONE_MS")) {
    const marker = "let adminSessionCheckPromise = null;\n";
    if (!next.includes(marker)) {
      throw new Error(`Patch v${VERSION} introuvable: variables admin`);
    }
    next = next.replace(marker, `${marker}const ADMIN_DELETE_TOMBSTONE_MS = 60000;\nlet lastAdminDeleteAt = 0;\nconst pendingDeletedTeamIds = new Map();\nconst pendingDeletedCodeValues = new Map();\n`);
  }

  if (!next.includes("function rememberPendingAdminDelete")) {
    const helpers = `function prunePendingAdminDeletes() {\n  const now = Date.now();\n  pendingDeletedTeamIds.forEach((deletedAt, teamId) => {\n    if (now - deletedAt > ADMIN_DELETE_TOMBSTONE_MS) pendingDeletedTeamIds.delete(teamId);\n  });\n  pendingDeletedCodeValues.forEach((deletedAt, codeValue) => {\n    if (now - deletedAt > ADMIN_DELETE_TOMBSTONE_MS) pendingDeletedCodeValues.delete(codeValue);\n  });\n}\n\nfunction rememberPendingAdminDelete(kind, value) {\n  if (!value) return;\n  lastAdminDeleteAt = Date.now();\n  if (kind === \"team\") pendingDeletedTeamIds.set(value, lastAdminDeleteAt);\n  if (kind === \"code\") pendingDeletedCodeValues.set(value, lastAdminDeleteAt);\n}\n\nfunction filterPendingAdminDeletes(serverData) {\n  prunePendingAdminDeletes();\n  const teams = serverData.teams.filter((team) => !pendingDeletedTeamIds.has(team.id));\n  const codes = serverData.codes.filter((code) => !pendingDeletedCodeValues.has(code.code));\n  return {\n    teams,\n    codes,\n    changed: teams.length !== serverData.teams.length || codes.length !== serverData.codes.length,\n  };\n}\n\n`;
    const marker = "async function refreshLiveTeamsFromServer()";
    if (!next.includes(marker)) {
      throw new Error(`Patch v${VERSION} introuvable: refresh admin`);
    }
    next = next.replace(marker, helpers + marker);
  }

  next = replaceInFunction(next, "function deleteTeamFromProgress(teamId)", (body) => {
    if (body.includes('rememberPendingAdminDelete("team", teamId);')) return body;
    const marker = '  data.teams = data.teams.filter((item) => item.id !== teamId);';
    if (!body.includes(marker)) {
      throw new Error(`Patch v${VERSION} introuvable: deleteTeam tombstone`);
    }
    return body.replace(marker, `  rememberPendingAdminDelete("team", teamId);\n${marker}`);
  });

  next = replaceInFunction(next, "function deleteUsedCode(codeValue)", (body) => {
    if (body.includes('rememberPendingAdminDelete("code", codeValue);')) return body;
    const marker = '  data.codes = data.codes.filter((item) => item.code !== codeValue);';
    if (!body.includes(marker)) {
      throw new Error(`Patch v${VERSION} introuvable: deleteCode tombstone`);
    }
    return body.replace(marker, `  rememberPendingAdminDelete("code", codeValue);\n${marker}`);
  });

  next = replaceInFunction(next, "async function refreshLiveTeamsFromServer()", (body) => {
    let output = body;
    if (!output.includes("const refreshStartedAt = lastLiveTeamRefreshAt;")) {
      const marker = "  lastLiveTeamRefreshAt = Date.now();\n";
      if (!output.includes(marker)) {
        throw new Error(`Patch v${VERSION} introuvable: refresh timestamp`);
      }
      output = output.replace(marker, `${marker}  const refreshStartedAt = lastLiveTeamRefreshAt;\n`);
    }

    const oldBlock = `    data.teams = serverData.teams;\n    data.codes = serverData.codes;\n    saveData({ sync: false });`;
    const newBlock = `    if (refreshStartedAt < lastAdminDeleteAt) return;\n\n    const filteredServerData = filterPendingAdminDeletes(serverData);\n    data.teams = filteredServerData.teams;\n    data.codes = filteredServerData.codes;\n    saveData(filteredServerData.changed ? { immediate: true } : { sync: false });`;
    if (!output.includes("const filteredServerData = filterPendingAdminDeletes(serverData);")) {
      if (!output.includes(oldBlock)) {
        throw new Error(`Patch v${VERSION} introuvable: refresh assignment`);
      }
      output = output.replace(oldBlock, newBlock);
    }
    return output;
  });

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

await patchTextFile("app.js", patchApp);
await patchIfExists("index.html", patchHtml);
await patchIfExists("suivi.html", patchHtml);
await patchTextFile("service-worker.js", patchServiceWorker);
console.log("Admin delete tombstone v83 applied.");
