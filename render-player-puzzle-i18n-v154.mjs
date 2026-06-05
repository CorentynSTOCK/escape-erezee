import { readFile, writeFile } from 'node:fs/promises';

const VERSION = 154;
const MARKER = 'player-puzzle-i18n-v154';

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

const HELPERS = String.raw`
/* player-puzzle-i18n-v154 */
function playerPuzzleTextV154(puzzle, field) {
  const value = String(puzzle?.[field] || "");
  if (!value) return "";
  return typeof escapeI18nTranslateText === "function" ? escapeI18nTranslateText(value) : value;
}

function playerPuzzleHintTextV154(puzzle, index) {
  const value = String(puzzle?.hints?.[index]?.text || "");
  if (!value) return "";
  return typeof escapeI18nTranslateText === "function" ? escapeI18nTranslateText(value) : value;
}

function playerPuzzleMessageV154(value) {
  const text = String(value || "");
  if (!text) return "";
  return typeof escapeI18nTranslateText === "function" ? escapeI18nTranslateText(text) : text;
}
`;

function patchApp(input) {
  let output = input;

  if (!output.includes(MARKER)) {
    output = output.replace(
      /function renderPlayer\(\) \{/,
      `${HELPERS}\nfunction renderPlayer() {`,
    );
  }

  output = output.replace(
    '  els.stepPlace.textContent = currentPuzzle.place;\n  els.stepTitle.textContent = currentPuzzle.title;\n  els.riddleText.textContent = unlocked\n    ? currentPuzzle.question\n    : playerLabelV151("lockedZone");',
    '  els.stepPlace.textContent = playerPuzzleTextV154(currentPuzzle, "place");\n  els.stepTitle.textContent = playerPuzzleTextV154(currentPuzzle, "title");\n  els.riddleText.textContent = unlocked\n    ? playerPuzzleTextV154(currentPuzzle, "question")\n    : playerLabelV151("lockedZone");',
  );

  output = output.replace(
    /    els\.hintState\.textContent = shownCount \? hints\[shownCount - 1\]\.text : "Aucun indice";/,
    '    els.hintState.textContent = shownCount ? playerPuzzleHintTextV154(puzzle, shownCount - 1) : playerPuzzleMessageV154("Aucun indice");',
  );

  output = output.replace(
    /  els\.hintState\.textContent = shownCount\n    \? hints\[shownCount - 1\]\.text\n    : canShow\n      \? "Indice disponible"\n      : `Disponible apr(?:ès|\\u00e8s) \$\{nextHint\.afterAttempts\} essai`;/,
    '  els.hintState.textContent = shownCount\n    ? playerPuzzleHintTextV154(puzzle, shownCount - 1)\n    : canShow\n      ? playerPuzzleMessageV154("Indice disponible")\n      : playerPuzzleMessageV154(`Disponible apr\\u00e8s ${nextHint.afterAttempts} essai`);',
  );

  output = output.replace(
    '  const unlockMessage = customArrivalMessage || message || "\\u00c9nigme d\\u00e9bloqu\\u00e9e.";',
    '  const unlockMessage = playerPuzzleMessageV154(customArrivalMessage || message || "\\u00c9nigme d\\u00e9bloqu\\u00e9e.");',
  );

  return output;
}

await patchTextFile('app.js', patchApp);
await patchTextFile('index.html', bumpAppReferences);
await patchTextFile('service-worker.js', bumpAppReferences);

console.log(`Player puzzle i18n v${VERSION} applied.`);
