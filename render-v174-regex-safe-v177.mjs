import fs from "node:fs";

const VERSION = 177;
const APP_PATH = "app.js";
const INDEX_PATH = "index.html";
const SERVICE_WORKER_PATH = "service-worker.js";

function read(path) {
  return fs.readFileSync(path, "utf8");
}

function write(path, content) {
  fs.writeFileSync(path, content, "utf8");
}

let app = read(APP_PATH);
app = app
  .replace(
    'metric.textContent = metric.textContent.replace(// personne|/ pers./gi, "/ equipe");',
    'metric.textContent = metric.textContent.replace(new RegExp("/ personne|/ pers\\\\.", "gi"), "/ equipe");',
  )
  .replace(
    'if (summaryStrong) summaryStrong.textContent = summaryStrong.textContent.replace(// personne/gi, "/ equipe");',
    'if (summaryStrong) summaryStrong.textContent = summaryStrong.textContent.replace(new RegExp("/ personne", "gi"), "/ equipe");',
  )
  .replace(
    'metric.textContent = metric.textContent.replace(// pers.|/ personne/gi, "/ equipe");',
    'metric.textContent = metric.textContent.replace(new RegExp("/ pers\\\\.|/ personne", "gi"), "/ equipe");',
  );
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

console.log(`v174 regex safe hotfix v${VERSION} applied.`);
