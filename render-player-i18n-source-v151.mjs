import { readFile, writeFile } from 'node:fs/promises';

const VERSION = 151;
const MARKER = 'player-i18n-source-v151';

async function patchTextFile(filePath, patcher) {
  const input = await readFile(filePath, 'utf8');
  const output = patcher(input);
  if (output !== input) await writeFile(filePath, output, 'utf8');
}

function bumpAppReferences(text) {
  return text
    .replace(/app\.js\?v=\d+/g, `app.js?v=${VERSION}`)
    .replace(/escape-erezee-v\d+/g, `escape-erezee-v${VERSION}`);
}

function insertBefore(input, signature, insertion, guard) {
  if (input.includes(guard)) return input;
  const index = input.indexOf(signature);
  if (index < 0) throw new Error(`Signature introuvable: ${signature}`);
  return input.slice(0, index) + insertion + '\n\n' + input.slice(index);
}

const HELPERS = String.raw`
/* player-i18n-source-v151 */
function playerLangV151() {
  const active = document.querySelector("#language-switcher [aria-pressed='true'], #language-switcher .is-active");
  const candidate = active?.dataset?.lang || (typeof escapeI18nLanguage === "function" ? escapeI18nLanguage() : "") || (document.documentElement.lang || "fr").slice(0, 2);
  return ["fr", "en", "nl"].includes(candidate) ? candidate : "fr";
}

function playerLabelV151(key) {
  const labels = {
    fr: {
      route: "Parcours",
      ready: "Pret",
      won: "Gagne",
      lost: "Perdu",
      playing: "En cours",
      briefing: "Briefing",
      routeFinished: "Parcours termine",
      lockedZone: "Rendez-vous dans la zone indiquee sur la carte pour debloquer cette enigme.",
      puzzleSingular: "enigme",
      puzzlePlural: "enigmes",
    },
    en: {
      route: "Route",
      ready: "Ready",
      won: "Won",
      lost: "Lost",
      playing: "In progress",
      briefing: "Briefing",
      routeFinished: "Route completed",
      lockedZone: "Go to the area shown on the map to unlock this puzzle.",
      puzzleSingular: "puzzle",
      puzzlePlural: "puzzles",
    },
    nl: {
      route: "Route",
      ready: "Klaar",
      won: "Gewonnen",
      lost: "Verloren",
      playing: "Bezig",
      briefing: "Briefing",
      routeFinished: "Route voltooid",
      lockedZone: "Ga naar de zone op de kaart om dit raadsel te ontgrendelen.",
      puzzleSingular: "raadsel",
      puzzlePlural: "raadsels",
    },
  };
  const lang = playerLangV151();
  return labels[lang]?.[key] || labels.fr[key] || key;
}

function playerPuzzleCountLabelV151(total) {
  const count = Number(total) || 0;
  return count + " " + playerLabelV151(count > 1 ? "puzzlePlural" : "puzzleSingular");
}

function playerProgressLabelV151(solved, total) {
  return (Number(solved) || 0) + " / " + (Number(total) || 0) + " " + playerLabelV151(Number(total) > 1 ? "puzzlePlural" : "puzzleSingular");
}

function playerStepLabelV151(step, total) {
  const lang = playerLangV151();
  const prefix = lang === "nl" ? "Stap" : lang === "en" ? "Step" : "Etape";
  return prefix + " " + step + " / " + total;
}

function playerCurrentStepLabelV151(status, step, total) {
  if (status === "won") return playerLabelV151("routeFinished");
  if (status === "briefing") return playerLabelV151("briefing");
  return playerStepLabelV151(step, total);
}

function playerStatusLabelV151(status) {
  if (status === "briefing") return playerLabelV151("briefing");
  if (status === "won") return playerLabelV151("won");
  if (status === "lost") return playerLabelV151("lost");
  return playerLabelV151("playing");
}

function playerTeamNameV151(name) {
  const value = String(name || "");
  const match = value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").match(/^Equipe\s+(\d+)$/i);
  if (match && playerLangV151() !== "fr") return "Team " + match[1];
  return value;
}
`;

function patchApp(input) {
  let output = insertBefore(input, 'function renderRouteSummary(team, route, progress, currentIndex) {', HELPERS, MARKER);
  output = output.replace(
    '  els.routeArea.textContent = route.area || "Parcours";\n  els.routeTitle.textContent = route.title || "Parcours";',
    '  els.routeArea.textContent = route.area || playerLabelV151("route");\n  els.routeTitle.textContent = route.title || playerLabelV151("route");',
  );
  output = output.replace(
    '    els.routePuzzleCount.textContent = `${progress.total} ${progress.total > 1 ? "\\\\u00e9nigmes" : "\\\\u00e9nigme"}`;\n  }',
    '    els.routePuzzleCount.textContent = playerPuzzleCountLabelV151(progress.total);\n  }',
  );
  output = output.replace(
    '    els.routeCurrentStep.textContent = team.status === "won"\n      ? "Parcours termin\\\\u00e9"\n      : team.status === "briefing"\n        ? "Briefing"\n        : `\\\\u00c9tape ${step} / ${progress.total}`;\n  }',
    '    els.routeCurrentStep.textContent = playerCurrentStepLabelV151(team.status, step, progress.total);\n  }',
  );
  output = output.replace(
    '  els.countdown.textContent = isBriefing ? "Pr\\\\u00eat" : formatClock(remainingSeconds(team, route));',
    '  els.countdown.textContent = isBriefing ? playerLabelV151("ready") : formatClock(remainingSeconds(team, route));',
  );
  output = output.replace(
    '  els.progressText.textContent = `${progress.solved} / ${progress.total} \\\\u00e9nigmes`;',
    '  els.progressText.textContent = playerProgressLabelV151(progress.solved, progress.total);',
  );
  output = output.replace(
    '  const statusLabel = team.status === "briefing" ? "Briefing" : team.status === "won" ? "Gagné" : team.status === "lost" ? "Perdu" : "En cours";',
    '  const statusLabel = playerStatusLabelV151(team.status);',
  );
  output = output.replace(
    '  els.riddleText.textContent = unlocked\n    ? currentPuzzle.question\n    : "Rendez-vous dans la zone indiquée sur la carte pour débloquer cette énigme.";',
    '  els.riddleText.textContent = unlocked\n    ? currentPuzzle.question\n    : playerLabelV151("lockedZone");',
  );
  output = output.replace(
    '  els.teamName.textContent = team.name;',
    '  els.teamName.textContent = playerTeamNameV151(team.name);',
  );
  return output;
}

await patchTextFile('app.js', patchApp);
await patchTextFile('index.html', bumpAppReferences);
await patchTextFile('service-worker.js', bumpAppReferences);

console.log(`Player i18n source v${VERSION} applied.`);
