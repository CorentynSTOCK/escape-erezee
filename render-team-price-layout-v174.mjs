import fs from "node:fs";

const VERSION = 174;
const APP_PATH = "app.js";
const CSS_PATH = "styles.css";
const INDEX_PATH = "index.html";
const PACKAGE_PATH = "package.json";
const SERVER_PATH = "server.mjs";
const SERVICE_WORKER_PATH = "service-worker.js";
const MARKER = "team-price-layout-v174";
const SCRIPT_NAME = `render-team-price-layout-v${VERSION}.mjs`;

function read(path) {
  return fs.readFileSync(path, "utf8");
}

function write(path, content) {
  fs.writeFileSync(path, content, "utf8");
}

function patchApp() {
  let app = read(APP_PATH);

  app = app
    .replace("const total = price * 2;", "const total = price;")
    .replace("${formatPrice(price)} / personne", "${formatPrice(price)} / equipe")
    .replace("${formatPrice(getRoutePrice(route))} / pers.", "${formatPrice(getRoutePrice(route))} / equipe")
    .replace(/`\$\{formatPrice\(getRoutePrice\(route\)\)\} \/ pers\.`/g, "`${formatPrice(getRoutePrice(route))} / equipe`")
    .replace(/`\\$\{formatPrice\(getRoutePrice\(route\)\)\} \/ pers\.`/g, "`\\${formatPrice(getRoutePrice(route))} / equipe`")
    .replace("Participants\n              <input name=\"players\" type=\"number\" min=\"1\" max=\"20\" value=\"2\"", "Nombre d'equipes\n              <input name=\"players\" type=\"number\" min=\"1\" max=\"20\" value=\"1\"")
    .replace("'<strong>' + esc(price) + ' / personne</strong>'", "'<strong>' + esc(price) + ' / equipe</strong>'")
    .replace("'<span>Total calcule selon le nombre de participants</span>'", "'<span>Total selon le nombre d\\'equipes</span>'");

  if (!app.includes(MARKER)) {
    app += `

/* ${MARKER} */
(function initTeamPriceLayoutV174() {
  if (window.__teamPriceLayoutV174) return;
  window.__teamPriceLayoutV174 = true;

  function applyTeamPriceLabels() {
    document.querySelectorAll(".shop-route-card").forEach(function (card) {
      card.querySelectorAll(".metric").forEach(function (metric) {
        metric.textContent = metric.textContent.replace(/\/ personne|\/ pers\./gi, "/ equipe");
      });

      const playersLabel = card.querySelector(".shop-buy-form label");
      if (playersLabel) {
        const input = playersLabel.querySelector("input");
        playersLabel.childNodes.forEach(function (node) {
          if (node.nodeType === Node.TEXT_NODE && node.textContent.trim()) {
            node.textContent = "Nombre d'equipes ";
          }
        });
        if (input) {
          input.setAttribute("aria-label", "Nombre d'equipes");
        }
      }

      const form = card.querySelector("[data-shop-route]");
      const routeId = form?.dataset?.shopRoute || "";
      const route = typeof getRoute === "function" ? getRoute(routeId) : null;
      const total = route && card.querySelector("[data-shop-total]");
      if (route && total && typeof getRoutePrice === "function" && typeof formatPrice === "function") {
        const countInput = card.querySelector("[data-shop-player-count]");
        const teamCount = Math.min(20, Math.max(1, Number(countInput?.value) || 1));
        total.textContent = formatPrice(getRoutePrice(route) * teamCount);
      }

      const summaryStrong = card.querySelector(".ux-buy-summary-v173 strong");
      if (summaryStrong) summaryStrong.textContent = summaryStrong.textContent.replace(/\/ personne/gi, "/ equipe");
      const summaryNote = card.querySelector(".ux-buy-summary-v173 span");
      if (summaryNote) summaryNote.textContent = "Total selon le nombre d'equipes";
    });

    document.querySelectorAll(".route-card .metric").forEach(function (metric) {
      metric.textContent = metric.textContent.replace(/\/ pers\.|\/ personne/gi, "/ equipe");
    });

    document.querySelectorAll("label").forEach(function (label) {
      label.childNodes.forEach(function (node) {
        if (node.nodeType === Node.TEXT_NODE && /Prix par personne/i.test(node.textContent)) {
          node.textContent = node.textContent.replace(/Prix par personne/i, "Prix par equipe");
        }
      });
    });
  }

  if (typeof updateShopTotal === "function" && !updateShopTotal.__teamPriceV174) {
    const previousUpdateShopTotalV174 = updateShopTotal;
    updateShopTotal = function updateShopTotalTeamPriceV174(event) {
      previousUpdateShopTotalV174.apply(this, arguments);
      const routeId = event?.currentTarget?.dataset?.shopPlayerCount;
      const route = routeId && typeof getRoute === "function" ? getRoute(routeId) : null;
      const total = routeId && document.querySelector('[data-shop-total="' + routeId + '"]');
      if (route && total && typeof getRoutePrice === "function" && typeof formatPrice === "function") {
        const teamCount = Math.min(20, Math.max(1, Number(event?.currentTarget?.value) || 1));
        total.textContent = formatPrice(getRoutePrice(route) * teamCount);
      }
      applyTeamPriceLabels();
    };
    updateShopTotal.__teamPriceV174 = true;
  }

  function run() {
    applyTeamPriceLabels();
    window.setTimeout(applyTeamPriceLabels, 500);
  }

  document.addEventListener("DOMContentLoaded", run);
  window.addEventListener("hashchange", function () { window.setTimeout(run, 250); });
  window.setInterval(applyTeamPriceLabels, 3000);
  run();
})();
`;
  }

  write(APP_PATH, app);
}

function patchServer() {
  let server = read(SERVER_PATH);
  server = server
    .replace(/Participants/g, "Equipes")
    .replace(/participants/g, "equipes");
  write(SERVER_PATH, server);
}

function patchIndex() {
  let html = read(INDEX_PATH);
  html = html
    .replace(/Prix par personne/g, "Prix par equipe")
    .replace(/styles\.css\?v=\d+/g, `styles.css?v=${VERSION}`)
    .replace(/app\.js\?v=\d+/g, `app.js?v=${VERSION}`);
  write(INDEX_PATH, html);
}

function patchCss() {
  let css = read(CSS_PATH);
  if (css.includes(MARKER)) return;

  css += `

/* ${MARKER} */
.brand,
.brand *,
.nav-link,
.topbar,
.topbar *,
.shop-route-card,
.shop-route-card *,
.shop-buy-form,
.shop-buy-form *,
.route-card,
.route-card *,
.puzzle-row,
.puzzle-row *,
.code-row,
.code-row *,
.admin-panel,
.admin-panel *,
.ux-shop-guide-v173,
.ux-shop-guide-v173 *,
.ux-admin-helper-v173,
.ux-admin-helper-v173 * {
  min-width: 0;
}

.shop-route-card h3,
.shop-route-card p,
.route-card h3,
.route-card p,
.puzzle-row h3,
.puzzle-row p,
.code-row strong,
.code-row p,
.panel-title h2,
.topbar h1 {
  overflow-wrap: anywhere;
  word-break: normal;
}

.metric-strip,
.ux-route-highlights-v173,
.code-actions,
.topbar-actions,
.map-actions,
.answer-actions,
.image-viewer-actions {
  min-width: 0;
  max-width: 100%;
}

.metric,
.type-tag,
.shop-badge,
.ux-route-highlights-v173 span,
.ux-admin-routine-v173 span {
  max-width: 100%;
  white-space: normal;
  overflow-wrap: anywhere;
  text-align: center;
}

.primary-button,
.secondary-button,
.ghost-button,
.text-button,
.danger-button,
.full-button,
.copy-code,
.route-card button,
.ux-admin-shortcuts-v173 button {
  max-width: 100%;
  white-space: normal;
  overflow-wrap: anywhere;
  line-height: 1.2;
}

.shop-buy-form {
  grid-template-columns: minmax(150px, 1fr) minmax(120px, 150px) minmax(150px, 200px);
}

.shop-buy-form .ux-buy-summary-v173 {
  grid-column: auto;
}

.shop-buy-form strong,
.ux-buy-summary-v173 strong {
  font-size: clamp(1rem, 2.6vw, 1.22rem);
  line-height: 1.15;
  overflow-wrap: anywhere;
}

.ux-buy-summary-v173 span,
.shop-buy-form label,
.shop-buy-form .form-message {
  line-height: 1.35;
}

.route-card {
  grid-template-columns: minmax(0, 1fr) minmax(92px, auto);
}

.route-card > div,
.puzzle-row > div,
.code-row > div {
  min-width: 0;
}

.code-row {
  grid-template-columns: minmax(0, 1fr) minmax(120px, auto);
}

@media (max-width: 980px) {
  .shop-list {
    grid-template-columns: repeat(auto-fit, minmax(min(100%, 290px), 1fr));
  }

  .shop-buy-form,
  .ux-admin-helper-v173,
  .ux-admin-search-v173 {
    grid-template-columns: 1fr;
  }

  .shop-buy-form .ux-buy-summary-v173 {
    grid-column: 1;
  }
}

@media (max-width: 720px) {
  .view {
    overflow-x: hidden;
  }

  .shop-route-card,
  .route-card,
  .puzzle-row,
  .code-row {
    grid-template-columns: 1fr;
  }

  .shop-route-visual {
    min-height: 170px;
  }

  .metric-strip,
  .ux-route-highlights-v173,
  .code-actions {
    align-items: stretch;
  }

  .metric,
  .type-tag,
  .ux-route-highlights-v173 span {
    justify-content: center;
  }
}
`;

  write(CSS_PATH, css);
}

function patchPackage() {
  const pkg = JSON.parse(read(PACKAGE_PATH));
  const start = pkg.scripts?.start || "";
  if (!start.includes(SCRIPT_NAME)) {
    pkg.scripts.start = start.replace(
      "node render-ux-optimization-v173.mjs && node server.mjs",
      `node render-ux-optimization-v173.mjs && node ${SCRIPT_NAME} && node server.mjs`,
    );
  }
  write(PACKAGE_PATH, `${JSON.stringify(pkg, null, 2)}\n`);
}

function patchServiceWorker() {
  if (!fs.existsSync(SERVICE_WORKER_PATH)) return;
  let worker = read(SERVICE_WORKER_PATH);
  worker = worker.replace(/escape-erezee-v\d+/g, `escape-erezee-v${VERSION}`);
  write(SERVICE_WORKER_PATH, worker);
}

patchApp();
patchServer();
patchIndex();
patchCss();
patchPackage();
patchServiceWorker();

console.log(`Team price and layout v${VERSION} applied.`);
