import fs from "node:fs";

const VERSION = 176;
const APP_PATH = "app.js";
const INDEX_PATH = "index.html";
const PACKAGE_PATH = "package.json";
const SERVICE_WORKER_PATH = "service-worker.js";
const SCRIPT_NAME = `render-app-regex-hotfix-v${VERSION}.mjs`;

function read(path) {
  return fs.readFileSync(path, "utf8");
}

function write(path, content) {
  fs.writeFileSync(path, content, "utf8");
}

let app = read(APP_PATH);
app = app
  .replace('metric.textContent = metric.textContent.replace(// personne|/ pers./gi, "/ equipe");', 'metric.textContent = metric.textContent.replace(/\\/ personne|\\/ pers\\./gi, "/ equipe");')
  .replace('if (summaryStrong) summaryStrong.textContent = summaryStrong.textContent.replace(// personne/gi, "/ equipe");', 'if (summaryStrong) summaryStrong.textContent = summaryStrong.textContent.replace(/\\/ personne/gi, "/ equipe");')
  .replace('metric.textContent = metric.textContent.replace(// pers.|/ personne/gi, "/ equipe");', 'metric.textContent = metric.textContent.replace(/\\/ pers\\.|\\/ personne/gi, "/ equipe");');
write(APP_PATH, app);

let html = read(INDEX_PATH);
html = html
  .replace(/styles\.css\?v=\d+/g, `styles.css?v=${VERSION}`)
  .replace(/app\.js\?v=\d+/g, `app.js?v=${VERSION}`);
write(INDEX_PATH, html);

if (fs.existsSync(SERVICE_WORKER_PATH)) {
  let worker = read(SERVICE_WORKER_PATH);
  worker = worker.replace(/escape-erezee-v\d+/g, `escape-erezee-v${VERSION}`);
  write(SERVICE_WORKER_PATH, worker);
}

const pkg = JSON.parse(read(PACKAGE_PATH));
const start = pkg.scripts?.start || "";
if (!start.includes(SCRIPT_NAME)) {
  pkg.scripts.start = start.replace(
    "node render-stripe-multi-team-codes-v175.mjs && node server.mjs",
    `node render-stripe-multi-team-codes-v175.mjs && node ${SCRIPT_NAME} && node server.mjs`,
  );
}
write(PACKAGE_PATH, `${JSON.stringify(pkg, null, 2)}\n`);

console.log(`App regex hotfix v${VERSION} applied.`);
