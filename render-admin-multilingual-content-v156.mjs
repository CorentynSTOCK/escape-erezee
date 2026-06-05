import { readFile, writeFile } from 'node:fs/promises';

const VERSION = 156;
const MARKER = 'admin-multilingual-content-v156';

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
/* admin-multilingual-content-v156 */
const ADMIN_I18N_LANGS_V156 = [
  { id: "en", label: "Anglais" },
  { id: "nl", label: "Neerlandais" },
];

function activeLangV156() {
  if (typeof playerLangV151 === "function") return playerLangV151();
  if (typeof escapeI18nLanguage === "function") return escapeI18nLanguage();
  return (document.documentElement.lang || "fr").slice(0, 2);
}

function ensureLangBucketV156(target, lang) {
  target.i18n ||= {};
  target.i18n[lang] ||= {};
  return target.i18n[lang];
}

function routeLangValueV156(route, lang, field) {
  return route?.i18n?.[lang]?.[field] || ESCAPE_I18N_ROUTES?.[route?.id]?.[lang]?.[field] || "";
}

function puzzleLangValueV156(route, puzzle, lang, field) {
  return puzzle?.i18n?.[lang]?.[field] || ESCAPE_I18N_ROUTES?.[route?.id]?.[lang]?.puzzles?.[puzzle?.id]?.[field] || "";
}

function puzzleLangHintsV156(route, puzzle, lang) {
  const custom = puzzle?.i18n?.[lang]?.hints;
  if (Array.isArray(custom)) return custom;
  const fallback = ESCAPE_I18N_ROUTES?.[route?.id]?.[lang]?.puzzles?.[puzzle?.id]?.hints;
  return Array.isArray(fallback) ? fallback : [];
}

function publicRouteTextV156(route, field) {
  const lang = activeLangV156();
  const value = String(route?.[field] || "");
  if (!value || lang === "fr") return value;
  return routeLangValueV156(route, lang, field)
    || (typeof escapeI18nTranslateText === "function" ? escapeI18nTranslateText(value) : value);
}

function publicPuzzleTextV156(route, puzzle, field) {
  const lang = activeLangV156();
  const value = String(puzzle?.[field] || "");
  if (!value || lang === "fr") return value;
  return puzzleLangValueV156(route, puzzle, lang, field)
    || (typeof escapeI18nTranslateText === "function" ? escapeI18nTranslateText(value) : value);
}

function publicPuzzleHintV156(route, puzzle, index) {
  const lang = activeLangV156();
  const value = String(puzzle?.hints?.[index]?.text || "");
  if (!value || lang === "fr") return value;
  return puzzleLangHintsV156(route, puzzle, lang)[index]
    || (typeof escapeI18nTranslateText === "function" ? escapeI18nTranslateText(value) : value);
}

function publicMessageV156(value) {
  const text = String(value || "");
  if (!text) return "";
  return typeof escapeI18nTranslateText === "function" ? escapeI18nTranslateText(text) : text;
}

function answerCandidatesV156(route, puzzle) {
  const values = [
    puzzle?.answer,
    puzzle?.i18n?.en?.answer,
    puzzle?.i18n?.nl?.answer,
    ESCAPE_I18N_ROUTES?.[route?.id]?.en?.puzzles?.[puzzle?.id]?.answer,
    ESCAPE_I18N_ROUTES?.[route?.id]?.nl?.puzzles?.[puzzle?.id]?.answer,
  ].filter(Boolean);
  const normalized = new Set(values.map((value) => normalizeAnswer(String(value))));
  values.forEach((value) => {
    const key = normalizeAnswer(String(value));
    (ESCAPE_I18N_ANSWER_ALIASES?.[key] || []).forEach((alias) => normalized.add(normalizeAnswer(alias)));
  });
  return normalized;
}

function i18nInputV156(scope, lang, field, value, multiline = false) {
  const escaped = escapeHtml(value || "");
  const attr = 'data-i18n-' + scope + '-field="' + field + '" data-i18n-lang="' + lang + '"';
  return multiline
    ? '<textarea ' + attr + '>' + escaped + '</textarea>'
    : '<input ' + attr + ' value="' + escaped + '" />';
}

function renderRouteI18nEditorV156(route) {
  if (!els.routeDetailsForm || !route) return;
  let panel = document.querySelector("#route-i18n-editor-v156");
  if (!panel) {
    panel = document.createElement("section");
    panel.id = "route-i18n-editor-v156";
    panel.className = "i18n-editor-v156";
    els.routeDetailsForm.insertBefore(panel, els.routeDetailsMessage);
  }
  panel.innerHTML =
    '<p class="section-label">Traductions du parcours</p>' +
    ADMIN_I18N_LANGS_V156.map((lang) =>
      '<details class="i18n-lang-panel-v156" open>' +
        '<summary>' + lang.label + '</summary>' +
        '<label>Nom ' + i18nInputV156("route", lang.id, "title", routeLangValueV156(route, lang.id, "title")) + '</label>' +
        '<label>Zone ' + i18nInputV156("route", lang.id, "area", routeLangValueV156(route, lang.id, "area")) + '</label>' +
        '<label>Description ' + i18nInputV156("route", lang.id, "description", routeLangValueV156(route, lang.id, "description"), true) + '</label>' +
        '<label>Briefing ' + i18nInputV156("route", lang.id, "briefingText", routeLangValueV156(route, lang.id, "briefingText"), true) + '</label>' +
        '<label>Message de fin ' + i18nInputV156("route", lang.id, "finishMessage", routeLangValueV156(route, lang.id, "finishMessage"), true) + '</label>' +
      '</details>'
    ).join("");
}

function saveRouteI18nEditorV156(route) {
  if (!route) return;
  document.querySelectorAll("[data-i18n-route-field]").forEach((input) => {
    const lang = input.dataset.i18nLang;
    const field = input.dataset.i18nRouteField;
    const value = input.value.trim();
    const bucket = ensureLangBucketV156(route, lang);
    if (value) bucket[field] = value;
    else delete bucket[field];
  });
}

function renderPuzzleI18nEditorV156(route, puzzle) {
  if (!els.puzzleContentForm || !puzzle) return;
  let panel = document.querySelector("#puzzle-i18n-editor-v156");
  if (!panel) {
    panel = document.createElement("section");
    panel.id = "puzzle-i18n-editor-v156";
    panel.className = "i18n-editor-v156";
    els.puzzleContentForm.insertBefore(panel, els.contentMessage);
  }
  panel.innerHTML =
    '<p class="section-label">Traductions enigme</p>' +
    ADMIN_I18N_LANGS_V156.map((lang) =>
      '<details class="i18n-lang-panel-v156" open>' +
        '<summary>' + lang.label + '</summary>' +
        '<label>Titre ' + i18nInputV156("puzzle", lang.id, "title", puzzleLangValueV156(route, puzzle, lang.id, "title")) + '</label>' +
        '<label>Lieu ' + i18nInputV156("puzzle", lang.id, "place", puzzleLangValueV156(route, puzzle, lang.id, "place")) + '</label>' +
        '<label>Question ' + i18nInputV156("puzzle", lang.id, "question", puzzleLangValueV156(route, puzzle, lang.id, "question"), true) + '</label>' +
        '<label>Message arrivee ' + i18nInputV156("puzzle", lang.id, "arrivalMessage", puzzleLangValueV156(route, puzzle, lang.id, "arrivalMessage"), true) + '</label>' +
        '<label>Reponse attendue ' + i18nInputV156("puzzle", lang.id, "answer", puzzleLangValueV156(route, puzzle, lang.id, "answer")) + '</label>' +
        '<label>Indices, un par ligne <textarea data-i18n-puzzle-field="hints" data-i18n-lang="' + lang.id + '">' + escapeHtml(puzzleLangHintsV156(route, puzzle, lang.id).join("\\n")) + '</textarea></label>' +
      '</details>'
    ).join("");
}

function savePuzzleI18nEditorV156(puzzle) {
  if (!puzzle) return;
  document.querySelectorAll("[data-i18n-puzzle-field]").forEach((input) => {
    const lang = input.dataset.i18nLang;
    const field = input.dataset.i18nPuzzleField;
    const bucket = ensureLangBucketV156(puzzle, lang);
    if (field === "hints") {
      const hints = input.value.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
      if (hints.length) bucket.hints = hints;
      else delete bucket.hints;
      return;
    }
    const value = input.value.trim();
    if (value) bucket[field] = value;
    else delete bucket[field];
  });
}

function installAdminI18nStylesV156() {
  if (document.querySelector("#admin-i18n-styles-v156")) return;
  const style = document.createElement("style");
  style.id = "admin-i18n-styles-v156";
  style.textContent = [
    ".i18n-editor-v156 { border: 1px solid rgba(18,60,50,.18); border-radius: 8px; padding: 14px; display: grid; gap: 12px; background: #f8fbf9; }",
    ".i18n-lang-panel-v156 { border: 1px solid rgba(18,60,50,.14); border-radius: 8px; padding: 10px; background: #fff; }",
    ".i18n-lang-panel-v156 summary { cursor: pointer; font-weight: 800; color: #123c32; }",
    ".i18n-lang-panel-v156 label { display: grid; gap: 6px; margin-top: 10px; font-weight: 700; }",
    ".i18n-lang-panel-v156 input, .i18n-lang-panel-v156 textarea { width: 100%; }",
    ".i18n-lang-panel-v156 textarea { min-height: 86px; }",
  ].join("\\n");
  document.head.appendChild(style);
}

installAdminI18nStylesV156();
`;

function patchApp(input) {
  let output = input;

  if (!output.includes(MARKER)) {
    output = output.replace(
      /function renderRouteDetailsEditor\(route\) \{/,
      `${HELPERS}\nfunction renderRouteDetailsEditor(route) {`,
    );
  }

  output = output.replace(
    'function renderRouteDetailsEditor(route) {\n  if (!route) return;',
    'function renderRouteDetailsEditor(route) {\n  if (!route) return;\n  if (document.activeElement?.closest?.("#route-i18n-editor-v156")) return;',
  );

  output = output.replace(
    '  els.routeDetailsMessage.textContent = `Modification de "${route.title}".`;\n}',
    '  els.routeDetailsMessage.textContent = `Modification de "${route.title}".`;\n  renderRouteI18nEditorV156(route);\n}',
  );

  output = output.replace(
    '  route.startLng = parseOptionalCoordinate(els.routeDetailsStartLngInput.value);\n  saveData();',
    '  route.startLng = parseOptionalCoordinate(els.routeDetailsStartLngInput.value);\n  saveRouteI18nEditorV156(route);\n  saveData();',
  );

  output = output.replace(
    'function renderPuzzleContentEditor(route) {\n  const puzzle = getSelectedContentPuzzle(route);',
    'function renderPuzzleContentEditor(route) {\n  if (document.activeElement?.closest?.("#puzzle-i18n-editor-v156")) return;\n  const puzzle = getSelectedContentPuzzle(route);',
  );

  output = output.replace(
    '  els.contentMessage.textContent = `Modification de "${puzzle.title}".`;\n}',
    '  els.contentMessage.textContent = `Modification de "${puzzle.title}".`;\n  renderPuzzleI18nEditorV156(route, puzzle);\n}',
  );

  output = output.replace(
    '  puzzle.answer = els.contentAnswerInput.value.trim();\n  saveData();',
    '  puzzle.answer = els.contentAnswerInput.value.trim();\n  savePuzzleI18nEditorV156(puzzle);\n  saveData();',
  );

  output = output.replace(
    '  els.routeArea.textContent = route.area || playerLabelV151("route");\n  els.routeTitle.textContent = route.title || playerLabelV151("route");',
    '  els.routeArea.textContent = publicRouteTextV156(route, "area") || playerLabelV151("route");\n  els.routeTitle.textContent = publicRouteTextV156(route, "title") || playerLabelV151("route");',
  );

  output = output.replace(
    '  els.briefingTitle.textContent = route.title || "Votre mission";\n  els.briefingText.textContent = getRouteBriefingText(route);',
    '  els.briefingTitle.textContent = publicRouteTextV156(route, "title") || publicMessageV156("Votre mission");\n  els.briefingText.textContent = publicRouteTextV156(route, "briefingText") || getRouteBriefingText(route);',
  );

  output = output.replace(
    '  els.stepPlace.textContent = playerPuzzleTextV154(currentPuzzle, "place");\n  els.stepTitle.textContent = playerPuzzleTextV154(currentPuzzle, "title");\n  els.riddleText.textContent = unlocked\n    ? playerPuzzleTextV154(currentPuzzle, "question")\n    : playerLabelV151("lockedZone");',
    '  els.stepPlace.textContent = publicPuzzleTextV156(route, currentPuzzle, "place");\n  els.stepTitle.textContent = publicPuzzleTextV156(route, currentPuzzle, "title");\n  els.riddleText.textContent = unlocked\n    ? publicPuzzleTextV156(route, currentPuzzle, "question")\n    : playerLabelV151("lockedZone");',
  );

  output = output.replace(
    'function renderHint(team, puzzle, unlocked) {\n  const shownCount = team.hints[puzzle.id] || 0;',
    'function renderHint(team, puzzle, unlocked) {\n  const route = getRoute(team?.routeId);\n  const shownCount = team.hints[puzzle.id] || 0;',
  );

  output = output.replace(
    '    els.hintState.textContent = shownCount ? playerPuzzleHintTextV154(puzzle, shownCount - 1) : playerPuzzleMessageV154("Aucun indice");',
    '    els.hintState.textContent = shownCount ? publicPuzzleHintV156(route, puzzle, shownCount - 1) : publicMessageV156("Aucun indice");',
  );

  output = output.replace(
    '  els.hintState.textContent = shownCount\n    ? playerPuzzleHintTextV154(puzzle, shownCount - 1)\n    : canShow\n      ? playerPuzzleMessageV154("Indice disponible")\n      : playerPuzzleMessageV154(`Disponible apr\\u00e8s ${nextHint.afterAttempts} essai`);',
    '  els.hintState.textContent = shownCount\n    ? publicPuzzleHintV156(route, puzzle, shownCount - 1)\n    : canShow\n      ? publicMessageV156("Indice disponible")\n      : publicMessageV156(`Disponible apr\\u00e8s ${nextHint.afterAttempts} essai`);',
  );

  output = output.replace(
    '  const expected = normalizeAnswer(puzzle.answer);',
    '  const expected = normalizeAnswer(puzzle.answer);\n  const acceptedAnswersV156 = answerCandidatesV156(route, puzzle);',
  );

  output = output.replace(
    '  if (proposed === expected) {',
    '  if (proposed === expected || acceptedAnswersV156.has(proposed)) {',
  );

  output = output.replace(
    '  const customArrivalMessage = puzzle?.arrivalMessage?.trim();\n  const unlockMessage = playerPuzzleMessageV154(customArrivalMessage || message || "\\u00c9nigme d\\u00e9bloqu\\u00e9e.");',
    '  const teamForMessageV156 = getCurrentTeam();\n  const routeForMessageV156 = teamForMessageV156 ? getRoute(teamForMessageV156.routeId) : null;\n  const customArrivalMessage = publicPuzzleTextV156(routeForMessageV156, puzzle, "arrivalMessage") || puzzle?.arrivalMessage?.trim();\n  const unlockMessage = publicMessageV156(customArrivalMessage || message || "\\u00c9nigme d\\u00e9bloqu\\u00e9e.");',
  );

  output = output.replace(
    '  const customFinishMessage = getRouteFinishMessage(route);',
    '  const customFinishMessage = publicRouteTextV156(route, "finishMessage") || getRouteFinishMessage(route);',
  );

  return output;
}

await patchTextFile('app.js', patchApp);
await patchTextFile('index.html', bumpAppReferences);
await patchTextFile('service-worker.js', bumpAppReferences);

console.log(`Admin multilingual content v${VERSION} applied.`);
