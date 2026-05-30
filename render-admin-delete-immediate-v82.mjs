import { access, readFile, writeFile } from "node:fs/promises";

const VERSION = 82;

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

function replaceInFunction(input, signature, oldText, newText) {
  const start = input.indexOf(signature);
  if (start < 0) {
    throw new Error(`Patch v${VERSION} introuvable: ${signature}`);
  }
  const end = findFunctionEnd(input, start);
  if (end < 0) {
    throw new Error(`Patch v${VERSION} impossible: fin de ${signature}`);
  }

  const before = input.slice(0, start);
  const body = input.slice(start, end);
  const after = input.slice(end);
  if (body.includes(newText.trim())) return input;
  if (!body.includes(oldText)) {
    throw new Error(`Patch v${VERSION} introuvable dans ${signature}: sauvegarde`);
  }
  return before + body.replace(oldText, newText) + after;
}

function patchApp(app) {
  let next = app;

  next = replaceInFunction(
    next,
    "function deleteTeamFromProgress(teamId)",
    "\n  saveData();\n  renderAdmin();",
    "\n  saveData({ immediate: true });\n  renderAdmin();",
  );

  next = replaceInFunction(
    next,
    "function deleteUsedCode(codeValue)",
    "\n  saveData();\n  renderCodeList();",
    "\n  saveData({ immediate: true });\n  renderCodeList();",
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

await patchTextFile("app.js", patchApp);
await patchIfExists("index.html", patchHtml);
await patchIfExists("suivi.html", patchHtml);
await patchTextFile("service-worker.js", patchServiceWorker);
console.log("Admin delete immediate v82 applied.");
