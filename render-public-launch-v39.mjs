import { readFile, writeFile } from "node:fs/promises";

const INDEX_FILE = new URL("./index.html", import.meta.url);
const APP_FILE = new URL("./app.js", import.meta.url);
const STYLE_FILE = new URL("./styles.css", import.meta.url);
const SERVICE_WORKER_FILE = new URL("./service-worker.js", import.meta.url);

async function patchFile(fileUrl, patcher) {
  const original = await readFile(fileUrl, "utf8");
  const patched = patcher(original);
  if (patched !== original) {
    await writeFile(fileUrl, patched, "utf8");
  }
}

const ROUTE_HERO = `              <div class="route-hero" id="route-hero">
                <div class="route-hero-copy">
                  <p class="route-kicker">Parcours en cours</p>
                  <p class="route-place" id="route-area">Erez&eacute;e</p>
                  <h2 id="route-title">Le Secret du Tramway</h2>
                  <div class="route-meta" aria-label="Informations du parcours">
                    <span id="route-duration">90 min</span>
                    <span id="route-puzzle-count">4 &eacute;nigmes</span>
                    <span id="route-current-step">&Eacute;tape 1</span>
                  </div>
                </div>
                <span class="status-pill" id="game-status">En cours</span>
              </div>`;

const ROUTE_SUMMARY_FUNCTION = `function renderRouteSummary(team, route, progress, currentIndex) {
  const step = Math.min(progress.total, Math.max(1, currentIndex + 1 || 1));
  els.routeArea.textContent = route.area || "Parcours";
  els.routeTitle.textContent = route.title || "Parcours";
  if (els.routeDuration) els.routeDuration.textContent = String(route.duration || 0) + " min";
  if (els.routePuzzleCount) {
    els.routePuzzleCount.textContent = progress.total + " " + (progress.total > 1 ? "\\u00e9nigmes" : "\\u00e9nigme");
  }
  if (els.routeCurrentStep) {
    els.routeCurrentStep.textContent = team.status === "won"
      ? "Parcours termin\\u00e9"
      : "\\u00c9tape " + step + " / " + progress.total;
  }

  const cover = getRouteCoverImage(route);
  if (!els.routeHero) return;
  els.routeHero.classList.toggle("has-cover", Boolean(cover));
  els.routeHero.style.backgroundImage = cover
    ? 'linear-gradient(135deg, rgba(12, 34, 29, 0.9), rgba(18, 60, 50, 0.62)), url("' + cover.dataUrl + '")'
    : "";
}

`;

const PUBLIC_CSS = `
/* public-launch-cleanup */
.side-note,
#demo-unlock-button,
#seed-button {
  display: none !important;
}

.route-hero {
  position: relative;
  overflow: hidden;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: start;
  gap: 14px;
  min-height: 158px;
  background:
    radial-gradient(circle at 14% 18%, rgba(241, 180, 73, 0.26), transparent 34%),
    linear-gradient(135deg, rgba(18, 60, 50, 0.98), rgba(31, 106, 88, 0.86)),
    #123c32;
  background-position: center;
  background-size: cover;
}

.route-hero.has-cover::before {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(9, 22, 20, 0.12), rgba(9, 22, 20, 0.7));
  content: "";
}

.route-hero > * {
  position: relative;
  z-index: 1;
}

.route-hero-copy {
  min-width: 0;
}

.route-kicker {
  margin: 0 0 10px;
  color: #f3bd57;
  font-size: 0.72rem;
  font-weight: 950;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.route-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 14px;
}

.route-meta span {
  display: inline-flex;
  min-height: 30px;
  align-items: center;
  padding: 0 10px;
  border: 1px solid rgba(255, 255, 255, 0.22);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.13);
  color: rgba(255, 255, 255, 0.92);
  font-size: 0.76rem;
  font-weight: 900;
}

.progress-block {
  padding: 12px;
  border: 1px solid var(--line);
  border-radius: var(--radius);
  background: #fff;
}

@media (max-width: 480px) {
  .route-hero {
    grid-template-columns: 1fr;
    min-height: 0;
    padding: 16px;
  }

  .route-hero h2 {
    font-size: 1.24rem;
  }
}
`;

await patchFile(INDEX_FILE, (code) => {
  let next = code
    .replace(/styles\.css\?v=\d+/g, "styles.css?v=39")
    .replace(/app\.js\?v=\d+/g, "app.js?v=39")
    .replace(/assets\/logo-escape\.(?:svg|jpg)(?:\?v=\d+)?/g, "assets/logo-escape.jpg?v=39");

  next = next.replace(/\n\s*<div class="side-note">[\s\S]*?<\/div>\s*(?=<\/aside>)/, "\n");
  next = next.replace(/\n\s*<button class="secondary-button" type="button" id="seed-button">[\s\S]*?<\/button>/, "");
  next = next.replace(/\n\s*<button class="text-button" type="button" id="demo-unlock-button">[\s\S]*?<\/button>/, "");

  if (next.includes('<div class="route-hero">')) {
    next = next.replace(/\s*<div class="route-hero">[\s\S]*?\n\s*<div class="progress-block">/, `\n${ROUTE_HERO}\n\n              <div class="progress-block">`);
  }

  return next;
});

await patchFile(APP_FILE, (code) => {
  let next = code;

  if (!next.includes('routeHero: $("#route-hero")')) {
    next = next.replace(
      '  gamePanel: $("#game-panel"),\n',
      '  gamePanel: $("#game-panel"),\n  routeHero: $("#route-hero"),\n',
    );
  }
  if (!next.includes('routeDuration: $("#route-duration")')) {
    next = next.replace(
      '  routeTitle: $("#route-title"),\n',
      '  routeTitle: $("#route-title"),\n  routeDuration: $("#route-duration"),\n  routePuzzleCount: $("#route-puzzle-count"),\n  routeCurrentStep: $("#route-current-step"),\n',
    );
  }

  if (!next.includes("function renderRouteSummary(")) {
    next = next.replace("function renderPlayer() {", `${ROUTE_SUMMARY_FUNCTION}function renderPlayer() {`);
  }

  next = next.replace(
    /  els\.routeArea\.textContent = route\.area;\n  els\.routeTitle\.textContent = route\.title;\n  els\.progressText\.textContent = `\$\{progress\.solved\} \/ \$\{progress\.total\} [^`]+`;/,
    '  renderRouteSummary(team, route, progress, currentIndex);\n  els.progressText.textContent = `${progress.solved} / ${progress.total} \\u00e9nigmes`;',
  );

  next = next.replace(
    '  els.demoUnlockButton.disabled = !currentPuzzle.requireLocation || team.status !== "playing" || unlocked;',
    '  if (els.demoUnlockButton) {\n    els.demoUnlockButton.disabled = !currentPuzzle.requireLocation || team.status !== "playing" || unlocked;\n  }',
  );
  next = next.replace(
    '  els.demoUnlockButton.addEventListener("click", unlockCurrentPuzzleByDemo);',
    '  els.demoUnlockButton?.addEventListener("click", unlockCurrentPuzzleByDemo);',
  );
  next = next.replace(
    '  els.seedButton.addEventListener("click", resetSeed);',
    '  els.seedButton?.addEventListener("click", resetSeed);',
  );

  return next;
});

await patchFile(STYLE_FILE, (code) => {
  let next = code.trimEnd();
  if (!next.includes("public-launch-cleanup")) {
    next += `\n${PUBLIC_CSS}`;
  }
  return `${next}\n`;
});

await patchFile(SERVICE_WORKER_FILE, (code) => {
  let next = code.replace(/escape-erezee-v\d+/, "escape-erezee-v39");
  next = next.replace(/\.\/assets\/logo-escape\.(?:svg|jpg)(?:\?v=\d+)?/g, "./assets/logo-escape.jpg?v=39");
  if (!next.includes("./assets/logo-escape.jpg?v=39")) {
    next = next.replace(/(\s+"\.\/assets\/icon\.svg",)/, `$1\n  "./assets/logo-escape.jpg?v=39",`);
  }
  return next;
});
