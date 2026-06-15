import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const VERSION = 179;
const SCRIPT_TO_FIX = globalThis.process?.env?.MULTI_TEAM_SCRIPT_PATH || "render-stripe-multi-team-codes-v178.mjs";
const INDEX_PATH = "index.html";
const SERVICE_WORKER_PATH = "service-worker.js";

function read(filePath) {
  return fs.readFileSync(filePath, "utf8");
}

function write(filePath, content) {
  fs.writeFileSync(filePath, content, "utf8");
}

function fixNestedCheckoutTemplate(script) {
  const start = script.indexOf("const checkoutHandler = `");
  const end = script.indexOf("\n  app = app.slice(0, start)", start);
  if (start === -1 || end === -1) {
    throw new Error("Could not locate checkout handler template in multi-team script.");
  }

  const before = script.slice(0, start);
  const block = script.slice(start, end);
  const after = script.slice(end);
  const fixedBlock = block.replace(/(?<!\\)\$\{/g, "\\${");
  return before + fixedBlock + after;
}

function bumpRuntimeVersion() {
  if (fs.existsSync(INDEX_PATH)) {
    const html = read(INDEX_PATH)
      .replace(/styles\.css\?v=\d+/g, `styles.css?v=${VERSION}`)
      .replace(/app\.js\?v=\d+/g, `app.js?v=${VERSION}`);
    write(INDEX_PATH, html);
  }

  if (fs.existsSync(SERVICE_WORKER_PATH)) {
    const worker = read(SERVICE_WORKER_PATH).replace(/escape-erezee-v\d+/g, `escape-erezee-v${VERSION}`);
    write(SERVICE_WORKER_PATH, worker);
  }
}

const currentScript = read(SCRIPT_TO_FIX);
const fixedScript = fixNestedCheckoutTemplate(currentScript);
if (fixedScript !== currentScript) {
  write(SCRIPT_TO_FIX, fixedScript);
}

await import(`${pathToFileURL(path.resolve(SCRIPT_TO_FIX)).href}?v179=${Date.now()}`);
bumpRuntimeVersion();

console.log(`Stripe multi-team codes v${VERSION} applied.`);
