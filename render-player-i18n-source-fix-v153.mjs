import { readFile, writeFile } from 'node:fs/promises';

const VERSION = 153;
const MARKER = 'player-i18n-source-fix-v153';

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

const EXTRA_PATCH = String.raw`
/* player-i18n-source-fix-v153 */
(function installPlayerI18nSourceFixV153() {
  if (window.__playerI18nSourceFixV153) return;
  window.__playerI18nSourceFixV153 = true;
  const previous = window.playerDynamicTextV152;
  const extra = {
    en: {
      "etat du jeu": "Game status",
      "resynchroniser": "Resync",
      "position non disponible. verifiez l'autorisation gps puis reessayez.": "Position unavailable. Check GPS permission and try again."
    },
    nl: {
      "etat du jeu": "Spelstatus",
      "resynchroniser": "Opnieuw syncen",
      "position non disponible. verifiez l'autorisation gps puis reessayez.": "Positie niet beschikbaar. Controleer de GPS-toestemming en probeer opnieuw."
    }
  };
  function lang() {
    if (typeof playerLangV151 === "function") return playerLangV151();
    const active = document.querySelector("#language-switcher [aria-pressed='true'], #language-switcher .is-active");
    const candidate = active?.dataset?.lang || (document.documentElement.lang || "fr").slice(0, 2);
    return ["fr", "en", "nl"].includes(candidate) ? candidate : "fr";
  }
  function key(value) {
    return String(value == null ? "" : value)
      .replace(/&amp;#039;|&#039;/g, "'")
      .replace(/[â€™\`]/g, "'")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase();
  }
  window.playerDynamicTextV152 = function playerDynamicTextFixedV153(value) {
    const current = lang();
    if (current !== "fr") {
      const translated = extra[current]?.[key(value)];
      if (translated) return String(value == null ? "" : value).replace(String(value == null ? "" : value).trim(), translated);
    }
    return typeof previous === "function" ? previous(value) : String(value == null ? "" : value);
  };
})();
`;

function patchApp(input) {
  let output = input;

  output = output.replace(
    /els\.routePuzzleCount\.textContent\s*=\s*`\$\{progress\.total\} \$\{progress\.total > 1 \? "\\u00e9nigmes" : "\\u00e9nigme"\}`;/,
    'els.routePuzzleCount.textContent = playerPuzzleCountLabelV151(progress.total);',
  );

  output = output.replace(
    /els\.routeCurrentStep\.textContent\s*=\s*team\.status === "won"[\s\S]*?: `\\u00c9tape \$\{step\} \/ \$\{progress\.total\}`;\n  \}/,
    'els.routeCurrentStep.textContent = playerCurrentStepLabelV151(team.status, step, progress.total);\n  }',
  );

  output = output.replace(
    /els\.countdown\.textContent\s*=\s*isBriefing \? "Pr\\u00eat" : formatClock\(remainingSeconds\(team, route\)\);/,
    'els.countdown.textContent = isBriefing ? playerLabelV151("ready") : formatClock(remainingSeconds(team, route));',
  );

  output = output.replace(
    /els\.progressText\.textContent\s*=\s*`\$\{progress\.solved\} \/ \$\{progress\.total\} \\u00e9nigmes`;/,
    'els.progressText.textContent = playerProgressLabelV151(progress.solved, progress.total);',
  );

  output = output.replace(
    /function handleGeolocationError\([^)]*\) \{\n  els\.distanceNote\.textContent = "Position non disponible\. Verifiez l'autorisation GPS puis reessayez\.";\n\}/,
    'function handleGeolocationError() {\n  els.distanceNote.textContent = window.playerDynamicTextV152 ? window.playerDynamicTextV152("Position non disponible. Verifiez l\\\'autorisation GPS puis reessayez.") : "Position non disponible. Verifiez l\\\'autorisation GPS puis reessayez.";\n}',
  );

  output = output.replace(
    'els.distanceNote.textContent = "La geolocalisation n\\\'est pas disponible sur cet appareil.";',
    'els.distanceNote.textContent = window.playerDynamicTextV152 ? window.playerDynamicTextV152("La geolocalisation n\\\'est pas disponible sur cet appareil.") : "La geolocalisation n\\\'est pas disponible sur cet appareil.";'
  );
  output = output.replace(
    'els.distanceNote.textContent = "Suivi GPS actif. La position est aussi visible dans la gestion.";',
    'els.distanceNote.textContent = window.playerDynamicTextV152 ? window.playerDynamicTextV152("Suivi GPS actif. La position est aussi visible dans la gestion.") : "Suivi GPS actif. La position est aussi visible dans la gestion.";'
  );
  output = output.replace(
    'els.distanceNote.textContent = "Suivi GPS actif. La carte et la gestion vont se mettre a jour automatiquement.";',
    'els.distanceNote.textContent = window.playerDynamicTextV152 ? window.playerDynamicTextV152("Suivi GPS actif. La carte et la gestion vont se mettre a jour automatiquement.") : "Suivi GPS actif. La carte et la gestion vont se mettre a jour automatiquement.";'
  );

  output = output.replace(
    '    if (refs.button) {\n    refs.button.disabled = serverSaveInFlight || playerPositionRefreshInFlight;\n  }',
    '    if (refs.button) {\n    refs.button.disabled = serverSaveInFlight || playerPositionRefreshInFlight;\n    refs.button.textContent = window.playerDynamicTextV152 ? window.playerDynamicTextV152("Resynchroniser") : "Resynchroniser";\n  }\n  const syncKickerV153 = refs.panel.querySelector(".player-sync-kicker");\n  if (syncKickerV153) syncKickerV153.textContent = window.playerDynamicTextV152 ? window.playerDynamicTextV152("Etat du jeu") : "Etat du jeu";',
  );

  if (!output.includes(MARKER)) output = `${output.trimEnd()}\n\n${EXTRA_PATCH}\n`;
  return output;
}

await patchTextFile('app.js', patchApp);
await patchTextFile('index.html', bumpAppReferences);
await patchTextFile('service-worker.js', bumpAppReferences);

console.log(`Player i18n source fix v${VERSION} applied.`);
