import fs from "node:fs";

const VERSION = 173;
const APP_PATH = "app.js";
const CSS_PATH = "styles.css";
const INDEX_PATH = "index.html";
const PACKAGE_PATH = "package.json";
const SERVICE_WORKER_PATH = "service-worker.js";
const MARKER = "ux-optimization-v173";

function read(path) {
  return fs.readFileSync(path, "utf8");
}

function write(path, content) {
  fs.writeFileSync(path, content, "utf8");
}

function patchApp() {
  let app = read(APP_PATH);
  if (app.includes(MARKER)) return;

  app += `

/* ${MARKER} */
(function initUxOptimizationV173() {
  if (window.__uxOptimizationV173) return;
  window.__uxOptimizationV173 = true;

  function esc(value) {
    if (typeof escapeHtml === "function") return escapeHtml(String(value ?? ""));
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function routeById(routeId) {
    if (typeof getRoute === "function") return getRoute(routeId);
    return (Array.isArray(data?.routes) ? data.routes : []).find(function (route) { return route.id === routeId; }) || null;
  }

  function routePrice(route) {
    if (typeof getRoutePrice === "function") return getRoutePrice(route);
    return Number(route?.pricePerPlayer || route?.price || 0) || 0;
  }

  function priceLabel(value) {
    if (typeof formatPrice === "function") return formatPrice(value);
    return String(value || 0) + " EUR";
  }

  function currentTeamSafe() {
    try {
      return typeof getCurrentTeam === "function" ? getCurrentTeam() : null;
    } catch {
      return null;
    }
  }

  function currentRouteSafe(team) {
    try {
      return team && typeof getRoute === "function" ? getRoute(team.routeId) : null;
    } catch {
      return null;
    }
  }

  function currentPuzzleSafe(team, route) {
    try {
      return team && route && typeof getCurrentPuzzle === "function" ? getCurrentPuzzle(team, route) : null;
    } catch {
      return null;
    }
  }

  function progressSafe(team, route) {
    try {
      return team && route && typeof getTeamProgress === "function"
        ? getTeamProgress(team, route)
        : { solved: 0, total: route?.puzzles?.length || 0, percent: 0 };
    } catch {
      return { solved: 0, total: route?.puzzles?.length || 0, percent: 0 };
    }
  }

  function ensureShopGuide() {
    const shopPanel = document.querySelector(".shop-panel");
    if (!shopPanel || document.querySelector("#ux-shop-guide-v173")) return;
    const guide = document.createElement("section");
    guide.id = "ux-shop-guide-v173";
    guide.className = "ux-shop-guide-v173";
    guide.setAttribute("aria-label", "Comment reserver");
    guide.innerHTML = [
      '<div class="ux-guide-title-v173">',
        '<p class="section-label">Reservation simple</p>',
        '<h2>Choisissez, payez, jouez</h2>',
      '</div>',
      '<ol class="ux-guide-steps-v173">',
        '<li><strong>1</strong><span>Choisissez un parcours</span></li>',
        '<li><strong>2</strong><span>Paiement securise</span></li>',
        '<li><strong>3</strong><span>Code recu par email</span></li>',
        '<li><strong>4</strong><span>Depart verifie par GPS</span></li>',
      '</ol>',
    ].join("");
    shopPanel.insertAdjacentElement("beforebegin", guide);
  }

  function enhanceShopCards() {
    ensureShopGuide();
    document.querySelectorAll(".shop-route-card").forEach(function (card) {
      const form = card.querySelector("[data-shop-route]");
      const route = routeById(form?.dataset?.shopRoute || "");
      if (!route) return;

      card.dataset.uxReadyV173 = "1";
      const copy = card.querySelector(".shop-route-copy");
      if (copy && !copy.querySelector(".ux-route-highlights-v173")) {
        const duration = Number(route.duration || 90);
        const puzzleCount = route.puzzles?.length || 0;
        const tone = duration <= 75 ? "Ideal pour debuter" : puzzleCount >= 15 ? "Aventure complete" : "Balade ludique";
        const distance = route.distance ? esc(route.distance) : "parcours exterieur";
        copy.insertAdjacentHTML("beforeend", [
          '<div class="ux-route-highlights-v173">',
            '<span>' + esc(tone) + '</span>',
            '<span>' + esc(distance) + '</span>',
            '<span>Code email inclus</span>',
          '</div>',
        ].join(""));
      }

      if (form && !form.querySelector(".ux-buy-summary-v173")) {
        const price = priceLabel(routePrice(route));
        form.insertAdjacentHTML("afterbegin", [
          '<div class="ux-buy-summary-v173">',
            '<strong>' + esc(price) + ' / personne</strong>',
            '<span>Total calcule selon le nombre de participants</span>',
          '</div>',
        ].join(""));
      }

      const button = form?.querySelector("button[type='submit']");
      if (button && !button.dataset.uxTextV173) {
        button.dataset.uxTextV173 = "1";
        button.textContent = "Reserver ce parcours";
      }

      const message = form?.querySelector(".form-message");
      if (message) {
        message.setAttribute("aria-live", "polite");
        message.setAttribute("aria-atomic", "true");
      }
    });
  }

  function enhanceCodeEntry() {
    const loginPanel = document.querySelector("#login-panel");
    const form = document.querySelector("#activation-form");
    if (!loginPanel || !form) return;

    if (!loginPanel.querySelector(".ux-code-helper-v173")) {
      form.insertAdjacentHTML("beforebegin", [
        '<div class="ux-code-helper-v173">',
          '<span>Vous avez deja achete ?</span>',
          '<strong>Entrez le code recu par email.</strong>',
          '<a href="#shop">Voir les parcours</a>',
        '</div>',
      ].join(""));
    }

    const input = document.querySelector("#activation-code");
    if (input && !input.dataset.uxBoundV173) {
      input.dataset.uxBoundV173 = "1";
      input.setAttribute("spellcheck", "false");
      input.addEventListener("input", function () {
        const clean = input.value.toUpperCase().replace(/\s+/g, "-").replace(/[^A-Z0-9-]/g, "");
        if (input.value !== clean) input.value = clean;
      });
    }

    const message = document.querySelector("#activation-message");
    if (message) {
      message.setAttribute("aria-live", "polite");
      message.setAttribute("aria-atomic", "true");
    }
  }

  function ensurePlayerStepper() {
    const phoneStatus = document.querySelector(".phone-status");
    if (!phoneStatus || document.querySelector("#ux-player-stepper-v173")) return null;
    const stepper = document.createElement("nav");
    stepper.id = "ux-player-stepper-v173";
    stepper.className = "ux-player-stepper-v173";
    stepper.setAttribute("aria-label", "Progression de l'aventure");
    stepper.innerHTML = [
      '<span data-ux-step-v173="code">Code</span>',
      '<span data-ux-step-v173="briefing">Briefing</span>',
      '<span data-ux-step-v173="puzzles">Enigmes</span>',
      '<span data-ux-step-v173="finish">Resultat</span>',
    ].join("");
    phoneStatus.insertAdjacentElement("afterend", stepper);
    return stepper;
  }

  function ensureNextAction() {
    const progressBlock = document.querySelector(".progress-block");
    if (!progressBlock) return null;
    let action = document.querySelector("#ux-next-action-v173");
    if (!action) {
      action = document.createElement("div");
      action.id = "ux-next-action-v173";
      action.className = "ux-next-action-v173";
      action.setAttribute("aria-live", "polite");
      action.innerHTML = '<span>Prochaine action</span><strong></strong>';
      progressBlock.insertAdjacentElement("afterend", action);
    }
    return action;
  }

  function enhancePlayer() {
    enhanceCodeEntry();
    const team = currentTeamSafe();
    const route = currentRouteSafe(team);
    const puzzle = currentPuzzleSafe(team, route);
    const progress = progressSafe(team, route);
    const finished = team?.status === "won" || team?.status === "lost";
    const unlocked = puzzle && (!puzzle.requireLocation || team?.unlockedPuzzleIds?.includes(puzzle.id));

    const stepper = ensurePlayerStepper();
    if (stepper) {
      const active = !team ? "code" : finished ? "finish" : progress.solved ? "puzzles" : "briefing";
      stepper.querySelectorAll("[data-ux-step-v173]").forEach(function (node) {
        const key = node.dataset.uxStepV173;
        node.classList.toggle("is-active", key === active);
        node.classList.toggle("is-done", ["code", "briefing", "puzzles"].indexOf(key) < ["code", "briefing", "puzzles", "finish"].indexOf(active));
      });
    }

    const action = ensureNextAction();
    if (action) {
      let label = "Entrez votre code pour ouvrir l'aventure.";
      let tone = "info";
      if (finished) {
        label = team.status === "won" ? "Consultez le classement et laissez un avis." : "La partie est terminee.";
        tone = team.status === "won" ? "ok" : "warn";
      } else if (puzzle && !unlocked) {
        label = "Rendez-vous dans la zone indiquee pour debloquer l'enigme.";
        tone = "gps";
      } else if (puzzle?.type === "photo") {
        label = "Prenez la photo demandee, puis envoyez-la.";
        tone = "photo";
      } else if (puzzle) {
        label = "Lisez l'enigme, observez autour de vous, puis validez la reponse.";
        tone = "answer";
      }
      action.dataset.tone = tone;
      const strong = action.querySelector("strong");
      if (strong) strong.textContent = label;
    }

    document.querySelectorAll("#answer-message, #distance-note, #hint-state").forEach(function (node) {
      node.setAttribute("aria-live", "polite");
      node.setAttribute("aria-atomic", "true");
    });
  }

  function enhanceAdmin() {
    const workspace = document.querySelector("#admin-workspace-v172");
    if (!workspace) return;
    let panel = workspace.querySelector(".ux-admin-helper-v173");
    if (!panel) {
      panel = document.createElement("div");
      panel.className = "ux-admin-helper-v173";
      panel.innerHTML = [
        '<div class="ux-admin-search-v173">',
          '<label for="ux-admin-search-input-v173">Recherche rapide</label>',
          '<input id="ux-admin-search-input-v173" type="search" placeholder="Code, equipe, client ou parcours" autocomplete="off" />',
          '<span data-ux-admin-search-result-v173>Affiche tout</span>',
        '</div>',
        '<div class="ux-admin-shortcuts-v173" aria-label="Raccourcis gestion">',
          '<button type="button" data-ux-admin-zone-v173="players">Equipes et codes</button>',
          '<button type="button" data-ux-admin-zone-v173="puzzles">Enigmes</button>',
          '<button type="button" data-ux-admin-zone-v173="routes">Parcours</button>',
          '<button type="button" data-ux-admin-zone-v173="overview">Sauvegardes</button>',
        '</div>',
        '<div class="ux-admin-routine-v173">',
          '<strong>Routine conseillee</strong>',
          '<span>Sauvegarde avant gros changement</span>',
          '<span>Verifier les equipes en cours</span>',
          '<span>Copier le code avant assistance</span>',
        '</div>',
      ].join("");
      const head = workspace.querySelector(".admin-workspace-head-v172");
      if (head) head.insertAdjacentElement("afterend", panel);
      else workspace.prepend(panel);

      panel.querySelector("[data-ux-admin-zone-v173]")?.closest(".ux-admin-shortcuts-v173")?.addEventListener("click", function (event) {
        const button = event.target.closest("[data-ux-admin-zone-v173]");
        if (!button) return;
        const zone = button.dataset.uxAdminZoneV173;
        const tab = workspace.querySelector('[data-admin-zone-tab-v172="' + zone + '"]');
        if (tab) tab.click();
      });

      panel.querySelector("#ux-admin-search-input-v173")?.addEventListener("input", function () {
        applyAdminSearch(panel);
      });
    }
    applyAdminSearch(panel);
  }

  function applyAdminSearch(panel) {
    const input = panel?.querySelector("#ux-admin-search-input-v173");
    const output = panel?.querySelector("[data-ux-admin-search-result-v173]");
    if (!input) return;
    const query = input.value.trim().toLowerCase();
    const rows = [
      ...document.querySelectorAll("#team-table tr"),
      ...document.querySelectorAll(".code-row"),
    ];
    let visible = 0;
    let searchable = 0;
    rows.forEach(function (row) {
      const empty = row.textContent.includes("Aucune equipe") || row.textContent.includes("Aucune");
      if (empty) return;
      searchable += 1;
      const match = !query || row.textContent.toLowerCase().includes(query);
      row.classList.toggle("ux-admin-filtered-v173", !match);
      if (match) visible += 1;
    });
    if (output) {
      output.textContent = query
        ? visible + " resultat(s) sur " + searchable
        : "Affiche tout";
    }
  }

  function applyUx() {
    enhanceShopCards();
    enhancePlayer();
    enhanceAdmin();
  }

  if (typeof renderShop === "function" && !renderShop.__uxWrappedV173) {
    const previousRenderShopV173 = renderShop;
    renderShop = function renderShopUxV173() {
      const result = previousRenderShopV173.apply(this, arguments);
      window.setTimeout(enhanceShopCards, 0);
      return result;
    };
    renderShop.__uxWrappedV173 = true;
  }

  if (typeof renderPlayer === "function" && !renderPlayer.__uxWrappedV173) {
    const previousRenderPlayerV173 = renderPlayer;
    renderPlayer = function renderPlayerUxV173() {
      const result = previousRenderPlayerV173.apply(this, arguments);
      window.setTimeout(enhancePlayer, 0);
      return result;
    };
    renderPlayer.__uxWrappedV173 = true;
  }

  if (typeof renderAdmin === "function" && !renderAdmin.__uxWrappedV173) {
    const previousRenderAdminV173 = renderAdmin;
    renderAdmin = function renderAdminUxV173() {
      const result = previousRenderAdminV173.apply(this, arguments);
      window.setTimeout(enhanceAdmin, 0);
      return result;
    };
    renderAdmin.__uxWrappedV173 = true;
  }

  document.addEventListener("DOMContentLoaded", function () {
    window.setTimeout(applyUx, 700);
    window.setInterval(applyUx, 3500);
  });
  window.addEventListener("hashchange", function () { window.setTimeout(applyUx, 300); });
  window.setTimeout(applyUx, 700);
})();
`;

  write(APP_PATH, app);
}

function patchCss() {
  let css = read(CSS_PATH);
  if (css.includes(MARKER)) return;

  css += `

/* ${MARKER} */
:where(.primary-button, .secondary-button, .ghost-button, .text-button, .danger-button, button, a, input, textarea, select):focus-visible {
  outline: 3px solid rgba(226, 158, 31, 0.55);
  outline-offset: 3px;
}

.ux-shop-guide-v173 {
  display: grid;
  grid-template-columns: minmax(220px, 0.8fr) minmax(0, 1.5fr);
  gap: 16px;
  align-items: center;
  margin-bottom: 18px;
  padding: 16px;
  border: 1px solid var(--line);
  border-radius: var(--radius);
  background: linear-gradient(135deg, #ffffff, #f4f8f5);
}

.ux-guide-title-v173 h2 {
  margin: 2px 0 0;
  color: var(--green);
  font-size: 1.34rem;
}

.ux-guide-steps-v173 {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.ux-guide-steps-v173 li {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 8px;
  align-items: center;
  min-height: 58px;
  padding: 10px;
  border: 1px solid rgba(18, 60, 50, 0.1);
  border-radius: 8px;
  background: #fff;
  color: var(--ink);
  font-weight: 850;
}

.ux-guide-steps-v173 strong {
  display: inline-grid;
  width: 28px;
  height: 28px;
  place-items: center;
  border-radius: 50%;
  background: var(--green);
  color: #fff;
  font-size: 0.84rem;
}

.ux-route-highlights-v173 {
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
  margin-top: 12px;
}

.ux-route-highlights-v173 span {
  display: inline-flex;
  min-height: 28px;
  align-items: center;
  padding: 0 9px;
  border-radius: 999px;
  background: #eef5f1;
  color: var(--green);
  font-size: 0.74rem;
  font-weight: 900;
}

.ux-buy-summary-v173 {
  display: grid;
  gap: 2px;
  align-self: center;
}

.ux-buy-summary-v173 strong {
  color: var(--ink);
  font-size: 0.94rem;
}

.ux-buy-summary-v173 span {
  color: var(--muted);
  font-size: 0.78rem;
  font-weight: 750;
}

.shop-buy-form {
  grid-template-columns: minmax(170px, 1fr) minmax(120px, 170px) minmax(110px, 150px) minmax(160px, 210px);
}

.shop-buy-form .form-message {
  grid-column: 1 / -1;
}

.ux-code-helper-v173 {
  display: grid;
  gap: 5px;
  margin: -22px 0 18px;
  padding: 14px;
  border: 1px solid rgba(255, 255, 255, 0.22);
  border-radius: var(--radius);
  background: rgba(255, 255, 255, 0.12);
}

.ux-code-helper-v173 span,
.ux-code-helper-v173 a {
  color: rgba(255, 255, 255, 0.78);
  font-size: 0.86rem;
  font-weight: 800;
}

.ux-code-helper-v173 strong {
  color: #fff;
  font-size: 1.02rem;
}

.ux-code-helper-v173 a {
  justify-self: start;
  text-decoration: underline;
  text-underline-offset: 3px;
}

.ux-player-stepper-v173 {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 6px;
  margin: 10px 0 12px;
}

.ux-player-stepper-v173 span {
  display: grid;
  min-height: 34px;
  place-items: center;
  border: 1px solid var(--line);
  border-radius: 999px;
  background: #f7faf8;
  color: var(--muted);
  font-size: 0.72rem;
  font-weight: 900;
}

.ux-player-stepper-v173 span.is-active {
  border-color: var(--gold);
  background: rgba(241, 180, 73, 0.2);
  color: #7a4a06;
}

.ux-player-stepper-v173 span.is-done {
  border-color: rgba(40, 127, 79, 0.2);
  background: rgba(40, 127, 79, 0.1);
  color: var(--success);
}

.ux-next-action-v173 {
  display: grid;
  gap: 4px;
  margin: 0 0 12px;
  padding: 12px;
  border: 1px solid rgba(18, 60, 50, 0.12);
  border-radius: var(--radius);
  background: #f6faf8;
}

.ux-next-action-v173 span {
  color: var(--muted);
  font-size: 0.72rem;
  font-weight: 900;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.ux-next-action-v173 strong {
  color: var(--green);
  font-size: 0.94rem;
  line-height: 1.35;
}

.ux-next-action-v173[data-tone="gps"] {
  border-color: rgba(44, 127, 163, 0.24);
  background: rgba(44, 127, 163, 0.08);
}

.ux-next-action-v173[data-tone="ok"] {
  border-color: rgba(40, 127, 79, 0.25);
  background: rgba(40, 127, 79, 0.09);
}

.ux-next-action-v173[data-tone="warn"] {
  border-color: rgba(184, 66, 61, 0.22);
  background: rgba(184, 66, 61, 0.08);
}

.ux-admin-helper-v173 {
  display: grid;
  grid-template-columns: minmax(240px, 1fr) auto;
  gap: 10px;
  align-items: center;
  padding: 12px;
  border: 1px solid rgba(18, 60, 50, 0.12);
  border-radius: var(--radius);
  background: #f8fbf9;
}

.ux-admin-search-v173 {
  display: grid;
  grid-template-columns: auto minmax(180px, 1fr) auto;
  gap: 8px;
  align-items: center;
}

.ux-admin-search-v173 label,
.ux-admin-search-v173 span {
  color: var(--muted);
  font-size: 0.78rem;
  font-weight: 900;
}

.ux-admin-search-v173 input {
  min-height: 38px;
  border-radius: 8px;
}

.ux-admin-shortcuts-v173,
.ux-admin-routine-v173 {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.ux-admin-shortcuts-v173 {
  justify-content: flex-end;
}

.ux-admin-shortcuts-v173 button {
  min-height: 34px;
  padding: 0 10px;
  border: 1px solid rgba(18, 60, 50, 0.16);
  border-radius: 8px;
  background: #fff;
  color: var(--green);
  cursor: pointer;
  font-size: 0.78rem;
  font-weight: 900;
}

.ux-admin-routine-v173 {
  grid-column: 1 / -1;
}

.ux-admin-routine-v173 strong {
  color: var(--green);
  font-size: 0.9rem;
}

.ux-admin-routine-v173 span {
  display: inline-flex;
  min-height: 28px;
  align-items: center;
  padding: 0 9px;
  border-radius: 999px;
  background: #fff;
  color: var(--muted);
  font-size: 0.78rem;
  font-weight: 850;
}

.ux-admin-filtered-v173 {
  display: none !important;
}

@media (max-width: 980px) {
  .ux-shop-guide-v173,
  .ux-guide-steps-v173,
  .shop-buy-form {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 720px) {
  .ux-shop-guide-v173 {
    padding: 14px;
  }

  .ux-guide-steps-v173 {
    gap: 8px;
  }

  .ux-guide-steps-v173 li {
    min-height: 48px;
  }

  .ux-player-stepper-v173 {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .ux-admin-helper-v173 {
    display: grid;
  }

  .ux-admin-search-v173,
  .ux-admin-helper-v173 {
    grid-template-columns: 1fr;
  }

  .ux-admin-shortcuts-v173 {
    justify-content: stretch;
  }

  .ux-admin-shortcuts-v173 button {
    width: 100%;
  }
}
`;

  write(CSS_PATH, css);
}

function patchPackage() {
  const pkg = JSON.parse(read(PACKAGE_PATH));
  const script = pkg.scripts?.start || "";
  if (!script.includes(`render-ux-optimization-v${VERSION}.mjs`)) {
    pkg.scripts.start = script.replace(
      "node render-admin-workspace-order-v172.mjs && node server.mjs",
      `node render-admin-workspace-order-v172.mjs && node render-ux-optimization-v${VERSION}.mjs && node server.mjs`,
    );
  }
  write(PACKAGE_PATH, `${JSON.stringify(pkg, null, 2)}\n`);
}

function patchIndex() {
  if (!fs.existsSync(INDEX_PATH)) return;
  let html = read(INDEX_PATH);
  html = html
    .replace(/styles\.css\?v=\d+/g, `styles.css?v=${VERSION}`)
    .replace(/app\.js\?v=\d+/g, `app.js?v=${VERSION}`);
  write(INDEX_PATH, html);
}

function patchServiceWorker() {
  if (!fs.existsSync(SERVICE_WORKER_PATH)) return;
  let worker = read(SERVICE_WORKER_PATH);
  worker = worker.replace(/escape-erezee-v\d+/g, `escape-erezee-v${VERSION}`);
  write(SERVICE_WORKER_PATH, worker);
}

patchApp();
patchCss();
patchIndex();
patchPackage();
patchServiceWorker();

console.log(`UX optimization v${VERSION} applied.`);
