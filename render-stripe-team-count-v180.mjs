import fs from "node:fs";

const VERSION = 180;
const APP_PATH = "app.js";
const INDEX_PATH = "index.html";
const SERVER_PATH = "server.mjs";
const SERVICE_WORKER_PATH = "service-worker.js";

function read(path) {
  return fs.readFileSync(path, "utf8");
}

function write(path, content) {
  fs.writeFileSync(path, content, "utf8");
}

function patchServer() {
  let server = read(SERVER_PATH);

  server = server.replace(
    "const playerCount = getPlayerCount(payload.playerCount);",
    "const playerCount = getPlayerCount(payload.teamCount ?? payload.playerCount ?? payload.players);",
  );

  if (!server.includes('appendStripeParam(params, "metadata[teamCount]", playerCount);')) {
    server = server.replace(
      'appendStripeParam(params, "metadata[playerCount]", playerCount);',
      'appendStripeParam(params, "metadata[playerCount]", playerCount);\n    appendStripeParam(params, "metadata[teamCount]", playerCount);',
    );
  }

  server = server.replace(
    "return getPlayerCount(session?.metadata?.playerCount);",
    "return getPlayerCount(session?.metadata?.teamCount ?? session?.metadata?.playerCount ?? session?.metadata?.players);",
  );

  write(SERVER_PATH, server);
}

function patchApp() {
  let app = read(APP_PATH);

  app = app.replace(
    "body: JSON.stringify({ routeId, teamCount }),",
    "body: JSON.stringify({ routeId, teamCount, playerCount: teamCount }),",
  );

  app = app.replace(
    "body: JSON.stringify({ routeId, playerCount: players }),",
    "body: JSON.stringify({ routeId, teamCount: players, playerCount: players }),",
  );

  if (!app.includes("stripe-team-count-v180")) {
    app += `

/* stripe-team-count-v180 */
window.__stripeTeamCountV180 = true;
`;
  }

  write(APP_PATH, app);
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

patchServer();
patchApp();
bumpRuntimeVersion();

console.log(`Stripe team count v${VERSION} applied.`);
