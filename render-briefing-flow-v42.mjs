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

const BRIEFING_PANEL = `              <section class="briefing-panel is-hidden" id="briefing-panel" aria-labelledby="briefing-title">
                <p class="section-label">Briefing</p>
                <h2 id="briefing-title">Votre mission</h2>
                <p id="briefing-text"></p>
                <article class="briefing-map-card" aria-label="Point de d&eacute;part du parcours">
                  <div class="map-canvas briefing-map" id="briefing-map" aria-label="Carte du point de d&eacute;part">
                    <div class="map-tiles" aria-hidden="true"></div>
                    <div class="map-layer" aria-hidden="true"></div>
                    <div class="map-attribution">&copy; OpenStreetMap</div>
                  </div>
                  <div class="briefing-start-row">
                    <div>
                      <strong>Point de d&eacute;part</strong>
                      <p id="briefing-start-text"></p>
                    </div>
                    <a class="secondary-button start-directions-button" id="briefing-directions-link" href="#" target="_blank" rel="noopener">Itin&eacute;raire</a>
                  </div>
                </article>
                <button class="primary-button full-button" type="button" id="start-adventure-button">Commencer l&rsquo;aventure</button>
              </section>`;

const ROUTE_CREATE_STORY_FIELDS = `                <label>
                  Texte de briefing
                  <textarea name="briefing-text" placeholder="Texte lu avant le lancement du chrono"></textarea>
                </label>
                <label>
                  Texte de fin de parcours
                  <textarea name="finish-message" placeholder="Message affich&eacute; quand l&rsquo;&eacute;quipe gagne"></textarea>
                </label>`;

const ROUTE_DETAILS_STORY_FIELDS = `                <label>
                  Texte de briefing
                  <textarea id="route-details-briefing" name="route-details-briefing" placeholder="Texte lu avant le lancement du chrono"></textarea>
                </label>
                <label>
                  Texte de fin de parcours
                  <textarea id="route-details-finish-message" name="route-details-finish-message" placeholder="Message affich&eacute; quand l&rsquo;&eacute;quipe gagne"></textarea>
                </label>`;

const CONTENT_ARRIVAL_FIELD = `                <label>
                  Message d&rsquo;arriv&eacute;e dans la zone
                  <textarea id="content-arrival-message" name="content-arrival-message" placeholder="Exemple : Vous y &ecirc;tes, observez la fa&ccedil;ade devant vous."></textarea>
                </label>`;

const CREATE_PUZZLE_ARRIVAL_FIELD = `                <label>
                  Message d&rsquo;arriv&eacute;e dans la zone
                  <textarea name="arrival-message" placeholder="Message affich&eacute; quand l&rsquo;&eacute;quipe arrive au bon endroit"></textarea>
                </label>`;

const BRIEFING_HELPERS = `function getRouteBriefingText(route) {
  return route?.briefingText?.trim()
    || route?.description?.trim()
    || "Prenez le temps de lire la mission, puis rejoignez le point de d\\u00e9part avant de lancer le chrono.";
}

function getRouteFinishMessage(route) {
  return route?.finishMessage?.trim() || "";
}

function getPuzzleArrivalMessage(puzzle, distance, accuracyText = "") {
  const customMessage = puzzle?.arrivalMessage?.trim();
  if (customMessage) return customMessage;
  return \`Vous \\u00eates dans la bonne zone, \\u00e0 \${Math.round(distance)} m du point.\${accuracyText}\`;
}

function renderBriefing(route) {
  if (!els.briefingPanel || !route) return;
  const start = getRouteStart(route);
  const hasCoordinates = Number.isFinite(start.lat) && Number.isFinite(start.lng);
  const coordinateLabel = hasCoordinates ? \`GPS \${formatCoordinate(start.lat)}, \${formatCoordinate(start.lng)}\` : "";
  const startDetails = [start.place, start.address, coordinateLabel].filter(Boolean).join(" " + String.fromCharCode(183) + " ");
  const mapTarget = hasCoordinates
    ? { lat: start.lat, lng: start.lng }
    : { ...DEFAULT_CENTER };

  els.briefingTitle.textContent = route.title || "Votre mission";
  els.briefingText.textContent = getRouteBriefingText(route);
  els.briefingStartText.textContent = startDetails || "Le point de d\\u00e9part sera communiqu\\u00e9 sur place.";
  if (els.briefingDirectionsLink) {
    els.briefingDirectionsLink.href = getRouteStartDirectionsUrl(route);
  }
  renderTileMap(els.briefingMap, {
    target: mapTarget,
    targets: [{ ...mapTarget, radius: 80, label: "D\\u00e9part" }],
    zoom: MAP_ZOOM,
    editable: false,
  });
}

`;

const BRIEFING_CSS = `
/* briefing-flow-v42 */
.briefing-panel {
  display: grid;
  gap: 14px;
  padding: 16px;
  border: 1px solid var(--line);
  border-radius: var(--radius);
  background: #ffffff;
}

.briefing-panel.is-hidden {
  display: none;
}

.briefing-panel h2,
.briefing-panel p {
  margin: 0;
}

.briefing-panel h2 {
  color: var(--green);
  font-size: 1.5rem;
}

.briefing-panel > p:not(.section-label) {
  color: var(--muted);
  line-height: 1.55;
}

.briefing-map-card {
  display: grid;
  gap: 12px;
}

.briefing-map {
  min-height: 230px;
}

.briefing-start-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 12px;
  align-items: center;
  padding: 12px;
  border: 1px solid var(--line);
  border-radius: var(--radius);
  background: #fbfdfc;
}

.briefing-start-row strong {
  color: var(--green);
}

.briefing-start-row p {
  margin: 4px 0 0;
  color: var(--muted);
  line-height: 1.4;
}

@media (max-width: 480px) {
  .briefing-start-row {
    grid-template-columns: 1fr;
  }

  .briefing-start-row .secondary-button {
    width: 100%;
  }
}
`;

await patchFile(INDEX_FILE, (code) => {
  let next = code
    .replace(/styles\.css\?v=\d+/g, "styles.css?v=42")
    .replace(/app\.js\?v=\d+/g, "app.js?v=42")
    .replace(/assets\/logo-escape\.(?:svg|jpg)(?:\?v=\d+)?/g, "assets/logo-escape.jpg?v=42");

  if (!next.includes('id="briefing-panel"')) {
    next = next.replace(
      /(              <form class="team-name-form is-hidden" id="team-name-form">[\s\S]*?              <\/form>\r?\n)(              <div class="route-hero" id="route-hero">)/,
      `$1${BRIEFING_PANEL}\n$2`,
    );
  }

  if (!next.includes('name="briefing-text"')) {
    next = next.replace(
      /(                <label>\r?\n                  Description\r?\n                  <textarea name="description" required placeholder="Description courte du parcours"><\/textarea>\r?\n                <\/label>\r?\n)(                <div class="start-editor-block">)/,
      `$1${ROUTE_CREATE_STORY_FIELDS}\n$2`,
    );
  }

  if (!next.includes('id="route-details-briefing"')) {
    next = next.replace(
      /(                <label>\r?\n                  Description\r?\n                  <textarea id="route-details-description" name="route-details-description" required><\/textarea>\r?\n                <\/label>\r?\n)(                <div class="start-editor-block">)/,
      `$1${ROUTE_DETAILS_STORY_FIELDS}\n$2`,
    );
  }

  if (!next.includes('id="content-arrival-message"')) {
    next = next.replace(
      /(                <label>\r?\n                  Texte affich[\s\S]*?                  <textarea id="content-question" name="content-question" required><\/textarea>\r?\n                <\/label>\r?\n)(                <label class="file-input puzzle-image-uploader">)/,
      `$1${CONTENT_ARRIVAL_FIELD}\n$2`,
    );
  }

  if (!next.includes('name="arrival-message"')) {
    next = next.replace(
      /(                <label>\r?\n                  Texte affich[\s\S]*?                  <textarea name="question" required placeholder="Votre [\s\S]*?"><\/textarea>\r?\n                <\/label>\r?\n)(                <label class="file-input">)/,
      `$1${CREATE_PUZZLE_ARRIVAL_FIELD}\n$2`,
    );
  }

  return next;
});

await patchFile(APP_FILE, (code) => {
  let next = code
    .replace(/assets\/logo-escape\.(?:svg|jpg)(?:\?v=\d+)?/g, "assets/logo-escape.jpg?v=42");
  next = next.replace(/\.join\(" \\\\u00b7 "\)/g, '.join(" " + String.fromCharCode(183) + " ")');
  next = next
    .replace(/"Pret"/g, '"Pr\\u00eat"')
    .replace(/"Aventure lancee\."/g, '"Aventure lanc\\u00e9e."')
    .replace(/"Enigme debloquee\."/g, '"\\u00c9nigme d\\u00e9bloqu\\u00e9e."')
    .replace(/"Depart"/g, '"D\\u00e9part"')
    .replace(/Vous etes dans la bonne zone, a/g, "Vous \\u00eates dans la bonne zone, \\u00e0")
    .replace(/point de depart/g, "point de d\\u00e9part")
    .replace(/depart sera communique/g, "d\\u00e9part sera communiqu\\u00e9");

  if (!next.includes('briefingPanel: $("#briefing-panel")')) {
    next = next.replace(
      '  routeHero: $("#route-hero"),\n',
      '  routeHero: $("#route-hero"),\n  briefingPanel: $("#briefing-panel"),\n  briefingTitle: $("#briefing-title"),\n  briefingText: $("#briefing-text"),\n  briefingMap: $("#briefing-map"),\n  briefingStartText: $("#briefing-start-text"),\n  briefingDirectionsLink: $("#briefing-directions-link"),\n  startAdventureButton: $("#start-adventure-button"),\n',
    );
  }

  if (!next.includes('progressBlock: $(".progress-block")')) {
    next = next.replace(
      '  progressFill: $("#progress-fill"),\n',
      '  progressFill: $("#progress-fill"),\n  progressBlock: $(".progress-block"),\n',
    );
  }

  if (!next.includes('routeDetailsBriefingInput: $("#route-details-briefing")')) {
    next = next.replace(
      '  routeDetailsDescriptionInput: $("#route-details-description"),\n',
      '  routeDetailsDescriptionInput: $("#route-details-description"),\n  routeDetailsBriefingInput: $("#route-details-briefing"),\n  routeDetailsFinishInput: $("#route-details-finish-message"),\n',
    );
  }

  if (!next.includes('contentArrivalInput: $("#content-arrival-message")')) {
    next = next.replace(
      '  contentQuestionInput: $("#content-question"),\n',
      '  contentQuestionInput: $("#content-question"),\n  contentArrivalInput: $("#content-arrival-message"),\n',
    );
  }

  if (!next.includes('finishMessage: "Mission accomplie')) {
    next = next.replace(
      /(        description:\r?\n\s+"Un parcours familial entre traces du tramway vicinal, rivi[\s\S]*?coeur du village\.",\r?\n)(\s+startPlace:)/,
      `$1        briefingText: "Votre mission commence sur les traces du tramway vicinal. Rejoignez le point de depart, observez les lieux et lancez le chrono quand toute l'equipe est prete.",\n        finishMessage: "Mission accomplie : vous avez retrouve les secrets d'Erezee et termine le parcours.",\n$2`,
    );
  }

  if (!next.includes("function renderBriefing(route)")) {
    next = next.replace(
      "function renderRouteSummary(team, route, progress, currentIndex) {\n",
      `${BRIEFING_HELPERS}function renderRouteSummary(team, route, progress, currentIndex) {\n`,
    );
  }

  if (!next.includes('team.status ||= team.startAt ? "playing" : "briefing";')) {
    next = next.replace(
      "  team.photoNames ||= {};\n",
      "  team.photoNames ||= {};\n  team.status ||= team.startAt ? \"playing\" : \"briefing\";\n",
    );
  }

  if (!next.includes('team.status === "briefing"\n        ? "Briefing"')) {
    next = next.replace(
      '      ? "Parcours termin\\u00e9"\n      : `\\u00c9tape ${step} / ${progress.total}`;',
      '      ? "Parcours termin\\u00e9"\n      : team.status === "briefing"\n        ? "Briefing"\n        : `\\u00c9tape ${step} / ${progress.total}`;',
    );
  }

  if (!next.includes('const isBriefing = team.status === "briefing";')) {
    next = next.replace(
      "  const elapsed = elapsedSeconds(team);\n\n  renderTeamIdentity(team);\n  els.countdown.textContent = formatClock(remainingSeconds(team, route));\n",
      "  const elapsed = elapsedSeconds(team);\n  const isBriefing = team.status === \"briefing\";\n  if (isBriefing) {\n    stopGeolocationWatch();\n  }\n\n  renderTeamIdentity(team);\n  els.countdown.textContent = isBriefing ? \"Pr\\u00eat\" : formatClock(remainingSeconds(team, route));\n",
    );
  }

  if (!next.includes('const statusLabel = team.status === "briefing" ? "Briefing"')) {
    next = next.replace(
      /  const statusLabel = team\.status === "won" \? ([\s\S]*?) : team\.status === "lost" \? ([\s\S]*?) : "En cours";\r?\n/,
      '  const statusLabel = team.status === "briefing" ? "Briefing" : team.status === "won" ? $1 : team.status === "lost" ? $2 : "En cours";\n',
    );
  }

  if (!next.includes('els.gameStatus.classList.toggle("is-briefing", isBriefing);')) {
    next = next.replace(
      '  els.gameStatus.classList.toggle("is-danger", team.status === "lost");\n',
      '  els.gameStatus.classList.toggle("is-danger", team.status === "lost");\n  els.gameStatus.classList.toggle("is-briefing", isBriefing);\n',
    );
  }

  if (!next.includes("renderBriefing(route);\n    return;")) {
    next = next.replace(
      /  const gameFinished = team\.status === "won" \|\| team\.status === "lost";\r?\n  els\.finishPanel\.classList\.toggle\("is-hidden", !gameFinished\);\r?\n  els\.mapPanel\.classList\.toggle\("is-hidden", gameFinished\);\r?\n  els\.riddleCard\.classList\.toggle\("is-hidden", gameFinished\);\r?\n\r?\n  if \(gameFinished\) \{\r?\n    stopGeolocationWatch\(\);\r?\n    renderFinishPanel\(team, route\);\r?\n    return;\r?\n  \}/,
      `  const gameFinished = team.status === "won" || team.status === "lost";
  els.briefingPanel?.classList.toggle("is-hidden", !isBriefing);
  els.routeHero?.classList.toggle("is-hidden", isBriefing);
  els.finishPanel.classList.toggle("is-hidden", !gameFinished);
  els.startPointCard?.classList.toggle("is-hidden", isBriefing || gameFinished);
  els.progressBlock?.classList.toggle("is-hidden", isBriefing);
  els.mapPanel.classList.toggle("is-hidden", gameFinished || isBriefing);
  els.riddleCard.classList.toggle("is-hidden", gameFinished || isBriefing);

  if (isBriefing) {
    renderBriefing(route);
    return;
  }

  if (gameFinished) {
    stopGeolocationWatch();
    renderFinishPanel(team, route);
    return;
  }`,
    );
  }

  if (!next.includes("const customFinishMessage = getRouteFinishMessage(route);")) {
    next = next.replace(
      /  els\.finishSubtitle\.textContent = hasWon\r?\n    \? (`\$\{team\.name\} a termin[\s\S]*?"\$\{route\.title\}"\.`)\r?\n    : (`\$\{team\.name\} n[\s\S]*?dans le temps imparti\.`);\r?\n/,
      '  const customFinishMessage = getRouteFinishMessage(route);\n  els.finishSubtitle.textContent = hasWon\n    ? customFinishMessage || $1\n    : $2;\n',
    );
  }

  if (!next.includes("const arrivalMessage = getPuzzleArrivalMessage")) {
    next = next.replace(
      /  if \(distance <= radius && !team\.unlockedPuzzleIds\.includes\(puzzle\.id\)\) \{\r?\n    unlockPuzzle\(team, puzzle, `[\s\S]*?\$\{Math\.round\(distance\)\} m du point\.\$\{accuracyText\}`\);\r?\n    return;\r?\n  \}/,
      "  if (distance <= radius && !team.unlockedPuzzleIds.includes(puzzle.id)) {\n    const arrivalMessage = getPuzzleArrivalMessage(puzzle, distance, accuracyText);\n    unlockPuzzle(team, puzzle, arrivalMessage);\n    return;\n  }",
    );
  }

  if (!next.includes('showToast(message ||')) {
    next = next.replace(
      /  showToast\(".*?nigme .*?"\);\r?\n/,
      '  showToast(message || "\\u00c9nigme d\\u00e9bloqu\\u00e9e.");\n',
    );
  }

  if (!next.includes('status: "briefing"')) {
    next = next.replace(
      "      startAt: Date.now(),\n      finishedAt: null,\n      status: \"playing\",\n",
      "      startAt: null,\n      finishedAt: null,\n      status: \"briefing\",\n",
    );
  }

  next = next.replace('  showToast("Partie ouverte.");\n', '  showToast("Briefing ouvert.");\n');

  if (!next.includes("function startAdventure()")) {
    next = next.replace(
      "function resetSession() {\n",
      `function startAdventure() {
  const team = getCurrentTeam();
  if (!team) return;
  const route = getRoute(team.routeId);
  if (!route || team.status !== "briefing") return;
  ensureTeamState(team);
  team.status = "playing";
  team.startAt = Date.now();
  team.finishedAt = null;
  route.puzzles
    .filter((puzzle) => !puzzle.requireLocation)
    .forEach((puzzle) => {
      if (!team.unlockedPuzzleIds.includes(puzzle.id)) {
        team.unlockedPuzzleIds.push(puzzle.id);
      }
    });
  touchTeam(team);
  saveData();
  renderPlayer();
  showToast("Aventure lanc\\u00e9e.");
  locatePlayer();
}

function resetSession() {
`,
    );
  }

  if (!next.includes("els.startAdventureButton?.addEventListener")) {
    next = next.replace(
      '  els.activationForm.addEventListener("submit", handleActivation);\n',
      '  els.activationForm.addEventListener("submit", handleActivation);\n  els.startAdventureButton?.addEventListener("click", startAdventure);\n',
    );
  }

  if (!next.includes("els.routeDetailsBriefingInput,")) {
    next = next.replace(
      "    els.routeDetailsDescriptionInput,\n    els.routeDetailsStartPlaceInput,",
      "    els.routeDetailsDescriptionInput,\n    els.routeDetailsBriefingInput,\n    els.routeDetailsFinishInput,\n    els.routeDetailsStartPlaceInput,",
    );
  }
  next = next.replace(
    "    els.routeDetailsDescriptionInput,\n    els.routeDetailsStartPlaceInput,",
    "    els.routeDetailsDescriptionInput,\n    els.routeDetailsBriefingInput,\n    els.routeDetailsFinishInput,\n    els.routeDetailsStartPlaceInput,",
  );

  if (!next.includes("els.routeDetailsBriefingInput.value = route.briefingText || \"\";")) {
    next = next.replace(
      "  els.routeDetailsDescriptionInput.value = route.description || \"\";\n",
      "  els.routeDetailsDescriptionInput.value = route.description || \"\";\n  els.routeDetailsBriefingInput.value = route.briefingText || \"\";\n  els.routeDetailsFinishInput.value = route.finishMessage || \"\";\n",
    );
  }

  if (!next.includes("route.briefingText = els.routeDetailsBriefingInput.value.trim();")) {
    next = next.replace(
      "  route.description = els.routeDetailsDescriptionInput.value.trim();\n",
      "  route.description = els.routeDetailsDescriptionInput.value.trim();\n  route.briefingText = els.routeDetailsBriefingInput.value.trim();\n  route.finishMessage = els.routeDetailsFinishInput.value.trim();\n",
    );
  }

  if (!next.includes('briefingText: String(form.get("briefing-text") || "").trim()')) {
    next = next.replace(
      "    description: String(form.get(\"description\")).trim(),\n",
      "    description: String(form.get(\"description\")).trim(),\n    briefingText: String(form.get(\"briefing-text\") || \"\").trim(),\n    finishMessage: String(form.get(\"finish-message\") || \"\").trim(),\n",
    );
  }

  if (!next.includes("els.contentArrivalInput.value = puzzle.arrivalMessage || \"\";")) {
    next = next.replace(
      "    els.contentQuestionInput.value = \"\";\n",
      "    els.contentQuestionInput.value = \"\";\n    els.contentArrivalInput.value = \"\";\n",
    );
    next = next.replace(
      "  els.contentQuestionInput.value = puzzle.question || \"\";\n",
      "  els.contentQuestionInput.value = puzzle.question || \"\";\n  els.contentArrivalInput.value = puzzle.arrivalMessage || \"\";\n",
    );
  }

  if (!next.includes("puzzle.arrivalMessage = els.contentArrivalInput.value.trim();")) {
    next = next.replace(
      "  puzzle.question = els.contentQuestionInput.value.trim();\n",
      "  puzzle.question = els.contentQuestionInput.value.trim();\n  puzzle.arrivalMessage = els.contentArrivalInput.value.trim();\n",
    );
  }

  if (!next.includes('arrivalMessage: String(form.get("arrival-message") || "").trim()')) {
    next = next.replace(
      "    question: String(form.get(\"question\")).trim(),\n",
      "    question: String(form.get(\"question\")).trim(),\n    arrivalMessage: String(form.get(\"arrival-message\") || \"\").trim(),\n",
    );
  }

  if (!next.includes("els.contentArrivalInput,\n    els.contentTypeSelect")) {
    next = next.replace(
      "    els.contentQuestionInput,\n    els.contentTypeSelect,",
      "    els.contentQuestionInput,\n    els.contentArrivalInput,\n    els.contentTypeSelect,",
    );
  }

  return next;
});

await patchFile(STYLE_FILE, (code) => {
  let next = code
    .replace(/assets\/logo-escape\.(?:svg|jpg)(?:\?v=\d+)?/g, "assets/logo-escape.jpg?v=42");
  if (!next.includes("briefing-flow-v42")) {
    next = `${next.trimEnd()}\n${BRIEFING_CSS}\n`;
  }
  return next;
});

await patchFile(SERVICE_WORKER_FILE, (code) => {
  let next = code.replace(/escape-erezee-v\d+/, "escape-erezee-v42");
  next = next.replace(/\.\/assets\/logo-escape\.(?:svg|jpg)(?:\?v=\d+)?/g, "./assets/logo-escape.jpg?v=42");
  if (!next.includes("./assets/logo-escape.jpg?v=42")) {
    next = next.replace(/(\s+"\.\/assets\/icon\.svg",)/, `$1\n  "./assets/logo-escape.jpg?v=42",`);
  }
  return next;
});
