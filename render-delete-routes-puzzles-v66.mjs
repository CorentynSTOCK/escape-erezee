import { readFile, writeFile } from "node:fs/promises";

const VERSION = 66;

async function patchTextFile(filePath, patcher) {
  const input = await readFile(filePath, "utf8");
  const output = patcher(input);
  if (output !== input) {
    await writeFile(filePath, output, "utf8");
  }
}

const DELETE_HELPERS = String.raw`function cleanPuzzleProgress(puzzleId, routeId) {
  data.teams
    .filter((team) => !routeId || team.routeId === routeId)
    .forEach((team) => {
      if (team.answers) delete team.answers[puzzleId];
      if (team.attempts) delete team.attempts[puzzleId];
      if (team.hints) delete team.hints[puzzleId];
      if (team.photoNames) delete team.photoNames[puzzleId];
      if (Array.isArray(team.unlockedPuzzleIds)) {
        team.unlockedPuzzleIds = team.unlockedPuzzleIds.filter((id) => id !== puzzleId);
      }
    });
}

function unlockRouteFreePuzzlesForTeams(route) {
  if (!route) return;
  const freePuzzleIds = route.puzzles
    .filter((puzzle) => !puzzle.requireLocation)
    .map((puzzle) => puzzle.id);
  if (!freePuzzleIds.length) return;
  data.teams
    .filter((team) => team.routeId === route.id)
    .forEach((team) => {
      team.unlockedPuzzleIds ||= [];
      freePuzzleIds.forEach((puzzleId) => {
        if (!team.unlockedPuzzleIds.includes(puzzleId)) {
          team.unlockedPuzzleIds.push(puzzleId);
        }
      });
    });
}

function deletePuzzleFromRoute(routeId, puzzleId) {
  const route = getRoute(routeId);
  const puzzle = route?.puzzles?.find((item) => item.id === puzzleId);
  if (!route || !puzzle) return;

  const teamCount = data.teams.filter((team) => team.routeId === routeId).length;
  const confirmed = window.confirm(
    'Supprimer l’énigme "' + puzzle.title + '" ?\n\nLes réponses, indices et photos liés à cette énigme seront retirés de ' + teamCount + ' équipe' + (teamCount > 1 ? 's' : '') + '.',
  );
  if (!confirmed) return;

  route.puzzles = route.puzzles.filter((item) => item.id !== puzzleId);
  cleanPuzzleProgress(puzzleId, routeId);
  unlockRouteFreePuzzlesForTeams(route);

  if (selectedContentPuzzleId === puzzleId) selectedContentPuzzleId = route.puzzles[0]?.id || null;
  if (selectedGeoPuzzleId === puzzleId) selectedGeoPuzzleId = route.puzzles[0]?.id || null;
  if (selectedHintPuzzleId === puzzleId) selectedHintPuzzleId = route.puzzles[0]?.id || null;
  if (geolocationWatchPuzzleId === puzzleId) stopGeolocationWatch();

  saveData();
  renderAdmin();
  renderPlayer();
  showToast('Énigme supprimée.');
}

function deleteRoute(routeId) {
  const route = getRoute(routeId);
  if (!route) return;
  if (data.routes.length <= 1) {
    showToast('Gardez au moins un parcours dans la gestion.');
    return;
  }

  const teamIds = new Set(data.teams.filter((team) => team.routeId === routeId).map((team) => team.id));
  const codeCount = data.codes.filter((code) => code.routeId === routeId).length;
  const teamCount = teamIds.size;
  const confirmed = window.confirm(
    'Supprimer le parcours "' + route.title + '" ?\n\nCette action supprimera aussi ' + route.puzzles.length + ' énigme' + (route.puzzles.length > 1 ? 's' : '') + ', ' + codeCount + ' code' + (codeCount > 1 ? 's' : '') + ' et ' + teamCount + ' équipe' + (teamCount > 1 ? 's' : '') + ' liés à ce parcours.',
  );
  if (!confirmed) return;

  data.routes = data.routes.filter((item) => item.id !== routeId);
  data.codes = data.codes.filter((code) => code.routeId !== routeId);
  data.teams = data.teams.filter((team) => team.routeId !== routeId);

  if (teamIds.has(localStorage.getItem(SESSION_KEY))) {
    localStorage.removeItem(SESSION_KEY);
    stopGeolocationWatch();
  }

  if (data.activeRouteId === routeId) {
    data.activeRouteId = data.routes[0]?.id || null;
    if (data.activeRouteId) {
      localStorage.setItem(ACTIVE_ROUTE_KEY, data.activeRouteId);
    } else {
      localStorage.removeItem(ACTIVE_ROUTE_KEY);
    }
  }

  selectedContentPuzzleId = null;
  selectedGeoPuzzleId = null;
  selectedHintPuzzleId = null;
  saveData();
  render();
  showToast('Parcours supprimé.');
}

`;

const OLD_ROUTE_BUTTON = [
  '          <button class="${active ? "primary-button" : "secondary-button"}" type="button" data-set-route="${route.id}">',
  '            ${active ? "Actif" : "Choisir"}',
  '          </button>',
].join("\n");

const NEW_ROUTE_BUTTON = [
  '          <div class="route-card-actions">',
  '            <button class="${active ? "primary-button" : "secondary-button"}" type="button" data-set-route="${route.id}">',
  '              ${active ? "Actif" : "Choisir"}',
  '            </button>',
  '            <button class="danger-button compact-button" type="button" data-delete-route="${route.id}" ${data.routes.length <= 1 ? "disabled" : ""}>',
  '              Supprimer',
  '            </button>',
  '          </div>',
].join("\n");

const OLD_PUZZLE_ACTION = '            <span class="type-tag">${puzzle.type === "photo" ? "Photo" : "Texte"}${getPuzzleImage(puzzle) ? " + image" : ""}</span>';

const NEW_PUZZLE_ACTION = [
  '            <div class="puzzle-row-actions">',
  '              <span class="type-tag">${puzzle.type === "photo" ? "Photo" : "Texte"}${getPuzzleImage(puzzle) ? " + image" : ""}</span>',
  '              <button class="danger-button compact-button" type="button" data-delete-puzzle="${puzzle.id}">Supprimer</button>',
  '            </div>',
].join("\n");

const OLD_ROUTE_LISTENERS = [
  '  $$("[data-set-route]").forEach((button) => {',
  '    button.addEventListener("click", () => setActiveRoute(button.dataset.setRoute));',
  '  });',
].join("\n");

const NEW_ROUTE_LISTENERS = [
  '  $$("[data-set-route]").forEach((button) => {',
  '    button.addEventListener("click", () => setActiveRoute(button.dataset.setRoute));',
  '  });',
  '  $$("[data-delete-route]").forEach((button) => {',
  '    button.addEventListener("click", () => deleteRoute(button.dataset.deleteRoute));',
  '  });',
  '  $$("[data-delete-puzzle]").forEach((button) => {',
  '    button.addEventListener("click", () => deletePuzzleFromRoute(activeRoute.id, button.dataset.deletePuzzle));',
  '  });',
].join("\n");

function ensureIndex(html) {
  return html
    .replace(/styles\.css\?v=\d+/g, `styles.css?v=${VERSION}`)
    .replace(/app\.js\?v=\d+/g, `app.js?v=${VERSION}`);
}

function ensureApp(app) {
  let next = app;

  if (!next.includes("function deletePuzzleFromRoute(")) {
    next = next.replace("function renderAdmin() {", `${DELETE_HELPERS}function renderAdmin() {`);
  }
  if (!next.includes('data-delete-route="${route.id}"')) {
    next = next.replace(OLD_ROUTE_BUTTON, NEW_ROUTE_BUTTON);
  }
  if (!next.includes('data-delete-puzzle="${puzzle.id}"')) {
    next = next.replace(OLD_PUZZLE_ACTION, NEW_PUZZLE_ACTION);
  }
  if (!next.includes("[data-delete-route]")) {
    next = next.replace(OLD_ROUTE_LISTENERS, NEW_ROUTE_LISTENERS);
  }

  return next;
}

function ensureStyles(css) {
  if (css.includes("/* delete-routes-puzzles-v66 */")) return css;
  return `${css}

/* delete-routes-puzzles-v66 */
.route-card-actions,
.puzzle-row-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
}

.route-card-actions {
  align-self: start;
}

.puzzle-row-actions {
  justify-self: end;
}

.route-card-actions .compact-button,
.puzzle-row-actions .compact-button {
  white-space: nowrap;
}

@media (max-width: 720px) {
  .route-card-actions,
  .puzzle-row-actions {
    display: grid;
    justify-content: stretch;
    justify-self: stretch;
    width: 100%;
  }
}
`;
}

await patchTextFile("index.html", ensureIndex);
await patchTextFile("app.js", ensureApp);
await patchTextFile("styles.css", ensureStyles);
await patchTextFile("service-worker.js", (worker) => worker.replace(/escape-erezee-v\d+/g, `escape-erezee-v${VERSION}`));

console.log("Delete routes puzzles v66 applique.");
