import { readFile, writeFile } from 'node:fs/promises';

const VERSION = 170;

async function patchTextFile(filePath, patcher) {
  const input = await readFile(filePath, 'utf8');
  const output = patcher(input);
  if (output !== input) await writeFile(filePath, output, 'utf8');
}

async function patchOptional(filePath, patcher) {
  try {
    await patchTextFile(filePath, patcher);
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
}

function bumpAssets(text) {
  let next = text;
  for (let version = 1; version <= VERSION; version += 1) {
    next = next.split(`styles.css?v=${version}`).join(`styles.css?v=${VERSION}`);
    next = next.split(`app.js?v=${version}`).join(`app.js?v=${VERSION}`);
    next = next.split(`seo-pages.css?v=${version}`).join(`seo-pages.css?v=${VERSION}`);
    next = next.split(`escape-erezee-v${version}`).join(`escape-erezee-v${VERSION}`);
  }
  return next;
}

const APP_PATCH = String.raw`
/* admin-i18n-workspace-v170 */
function answerCandidatesV156(route, puzzle) {
  const normalize = typeof normalizeAnswer === "function"
    ? normalizeAnswer
    : function (value) { return String(value || "").trim().toLowerCase(); };
  const values = [];
  const pushValue = function (value) {
    if (Array.isArray(value)) value.forEach(pushValue);
    else if (value !== undefined && value !== null && String(value).trim()) values.push(String(value).trim());
  };
  const staticRoutes = typeof ESCAPE_I18N_ROUTES !== "undefined" ? ESCAPE_I18N_ROUTES : {};
  const aliases = typeof ESCAPE_I18N_ANSWER_ALIASES !== "undefined" ? ESCAPE_I18N_ANSWER_ALIASES : {};

  pushValue(puzzle?.answer);
  pushValue(puzzle?.acceptedAnswers);
  pushValue(puzzle?.answers);
  ["en", "nl"].forEach(function (lang) {
    const bucket = puzzle?.i18n?.[lang] || {};
    const staticPuzzle = staticRoutes?.[route?.id]?.[lang]?.puzzles?.[puzzle?.id] || {};
    pushValue(bucket.answer);
    pushValue(bucket.acceptedAnswers);
    pushValue(bucket.answerAliases);
    pushValue(staticPuzzle.answer);
    pushValue(staticPuzzle.acceptedAnswers);
    pushValue(staticPuzzle.answerAliases);
  });

  const normalized = new Set(values.map(function (value) { return normalize(value); }).filter(Boolean));
  values.forEach(function (value) {
    const key = normalize(value);
    (aliases[key] || []).forEach(function (alias) { normalized.add(normalize(alias)); });
  });
  return normalized;
}

(function initAdminI18nWorkspaceV170() {
  if (window.__adminI18nWorkspaceV170) return;
  window.__adminI18nWorkspaceV170 = true;

  const langs = [
    { id: "en", label: "Anglais", short: "EN" },
    { id: "nl", label: "Neerlandais", short: "NL" },
  ];
  const routeFields = [
    { key: "title", label: "Nom du parcours", type: "short" },
    { key: "area", label: "Zone / lieu", type: "short" },
    { key: "description", label: "Description boutique", type: "long" },
    { key: "briefingText", label: "Briefing joueur", type: "long" },
    { key: "finishMessage", label: "Message de fin", type: "long" },
  ];
  const puzzleFields = [
    { key: "title", label: "Titre de l'enigme", type: "short" },
    { key: "place", label: "Lieu", type: "short" },
    { key: "question", label: "Question", type: "long" },
    { key: "arrivalMessage", label: "Message d'arrivee", type: "long" },
    { key: "answer", label: "Reponse principale", type: "short" },
  ];
  const state = { routeId: "", puzzleId: "", lang: "en", lastKey: "" };

  function html(value) {
    return typeof escapeHtml === "function"
      ? escapeHtml(String(value == null ? "" : value))
      : String(value == null ? "" : value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
  }

  function routesV170() {
    return Array.isArray(data?.routes) ? data.routes : [];
  }

  function currentRouteV170() {
    const routes = routesV170();
    const active = routes.find(function (route) { return route.id === state.routeId; })
      || (typeof getActiveRoute === "function" ? getActiveRoute() : null)
      || routes[0]
      || null;
    if (active) state.routeId = active.id;
    return active;
  }

  function currentPuzzleV170(route) {
    const puzzles = Array.isArray(route?.puzzles) ? route.puzzles : [];
    const selected = puzzles.find(function (puzzle) { return puzzle.id === state.puzzleId; }) || puzzles[0] || null;
    if (selected) state.puzzleId = selected.id;
    return selected;
  }

  function ensureBucketV170(target, lang) {
    target.i18n ||= {};
    target.i18n[lang] ||= {};
    return target.i18n[lang];
  }

  function langValueV170(target, lang, field) {
    return String(target?.i18n?.[lang]?.[field] || "");
  }

  function setLangValueV170(target, lang, field, value) {
    const bucket = ensureBucketV170(target, lang);
    const clean = String(value || "").trim();
    if (clean) bucket[field] = clean;
    else delete bucket[field];
  }

  function sourceValueV170(target, field) {
    return String(target?.[field] || "");
  }

  function textArrayV170(value) {
    if (!Array.isArray(value)) return [];
    return value
      .map(function (item) {
        if (typeof item === "string") return item;
        return String(item?.text || item?.answer || item?.value || "");
      })
      .map(function (item) { return item.trim(); })
      .filter(Boolean);
  }

  function sourceHintsV170(puzzle) {
    return textArrayV170(puzzle?.hints);
  }

  function translatedHintsV170(puzzle, lang) {
    return textArrayV170(puzzle?.i18n?.[lang]?.hints);
  }

  function translatedAcceptedAnswersV170(puzzle, lang) {
    return textArrayV170(puzzle?.i18n?.[lang]?.acceptedAnswers || puzzle?.i18n?.[lang]?.answerAliases);
  }

  function setTextArrayV170(target, lang, field, raw) {
    const bucket = ensureBucketV170(target, lang);
    const values = String(raw || "")
      .split(/\r?\n/)
      .map(function (line) { return line.trim(); })
      .filter(Boolean);
    if (values.length) bucket[field] = values;
    else delete bucket[field];
  }

  function sourceAcceptedAnswersV170(puzzle) {
    return [
      puzzle?.answer,
      ...textArrayV170(puzzle?.acceptedAnswers),
      ...textArrayV170(puzzle?.answers),
    ].filter(Boolean);
  }

  function fieldNeededV170(value) {
    return String(value || "").trim().length > 0;
  }

  function coverageForLangV170(route, lang) {
    let total = 0;
    let done = 0;
    const missing = [];
    routeFields.forEach(function (field) {
      if (!fieldNeededV170(sourceValueV170(route, field.key))) return;
      total += 1;
      if (fieldNeededV170(langValueV170(route, lang, field.key))) done += 1;
      else missing.push("Parcours: " + field.label);
    });
    (route.puzzles || []).forEach(function (puzzle, index) {
      const label = "E" + (index + 1) + " - " + (puzzle.title || puzzle.id || "enigme");
      puzzleFields.forEach(function (field) {
        if (!fieldNeededV170(sourceValueV170(puzzle, field.key))) return;
        total += 1;
        if (fieldNeededV170(langValueV170(puzzle, lang, field.key))) done += 1;
        else missing.push(label + ": " + field.label);
      });
      const sourceHints = sourceHintsV170(puzzle);
      if (sourceHints.length) {
        total += sourceHints.length;
        const translatedHints = translatedHintsV170(puzzle, lang);
        done += Math.min(sourceHints.length, translatedHints.length);
        if (translatedHints.length < sourceHints.length) missing.push(label + ": indices");
      }
    });
    return { total, done, percent: total ? Math.round((done / total) * 100) : 100, missing };
  }

  function totalCoverageV170(route) {
    const items = langs.map(function (lang) { return coverageForLangV170(route, lang.id); });
    const total = items.reduce(function (sum, item) { return sum + item.total; }, 0);
    const done = items.reduce(function (sum, item) { return sum + item.done; }, 0);
    return { total, done, percent: total ? Math.round((done / total) * 100) : 100 };
  }

  function fieldControlV170(scope, field, source, value) {
    const tag = field.type === "long" ? "textarea" : "input";
    const sourceText = source ? html(source) : "<span class=\"i18n-empty-v170\">Pas de texte FR source.</span>";
    const attr = "data-i18n-v170=\"" + scope + "\" data-i18n-field=\"" + field.key + "\"";
    const input = tag === "textarea"
      ? "<textarea " + attr + ">" + html(value) + "</textarea>"
      : "<input " + attr + " value=\"" + html(value) + "\" />";
    return "<article class=\"i18n-field-v170\"><div><strong>" + html(field.label) + "</strong><p>" + sourceText + "</p></div><label><span>Traduction</span>" + input + "</label></article>";
  }

  function textAreaBlockV170(kind, label, sourceLines, valueLines) {
    const source = sourceLines.length
      ? "<ol>" + sourceLines.map(function (line) { return "<li>" + html(line) + "</li>"; }).join("") + "</ol>"
      : "<p class=\"i18n-empty-v170\">Aucun contenu FR source.</p>";
    return "<article class=\"i18n-field-v170\"><div><strong>" + html(label) + "</strong>" + source + "</div><label><span>Une ligne par element</span><textarea data-i18n-special-v170=\"" + kind + "\">" + html(valueLines.join("\n")) + "</textarea></label></article>";
  }

  function ensurePanelV170() {
    const adminContent = document.querySelector("#admin-content");
    if (!adminContent) return null;
    let panel = document.querySelector("#admin-i18n-workspace-v170");
    if (!panel) {
      panel = document.createElement("section");
      panel.id = "admin-i18n-workspace-v170";
      panel.className = "admin-i18n-workspace-v170";
      const anchor = document.querySelector("#admin-robustness-panel-v167")
        || document.querySelector("#admin-growth-v143")
        || document.querySelector("#route-details-form")?.closest("section");
      if (anchor?.parentNode) anchor.insertAdjacentElement("afterend", panel);
      else adminContent.prepend(panel);
    }
    return panel;
  }

  function renderPanelV170(force) {
    const panel = ensurePanelV170();
    if (!panel) return;
    if (!force && panel.contains(document.activeElement)) return;
    const route = currentRouteV170();
    if (!route) {
      panel.innerHTML = "<p class=\"section-label\">Traductions parcours</p><p>Aucun parcours disponible.</p>";
      return;
    }
    const puzzle = currentPuzzleV170(route);
    const lang = langs.find(function (item) { return item.id === state.lang; }) || langs[0];
    state.lang = lang.id;
    const coverage = coverageForLangV170(route, lang.id);
    const total = totalCoverageV170(route);
    const key = [route.id, puzzle?.id || "", lang.id, coverage.done, coverage.total, total.done, total.total].join("|");
    if (!force && state.lastKey === key) return;
    state.lastKey = key;

    const routeOptions = routesV170().map(function (item) {
      return "<option value=\"" + html(item.id) + "\"" + (item.id === route.id ? " selected" : "") + ">" + html(item.title || item.id) + "</option>";
    }).join("");
    const puzzleOptions = (route.puzzles || []).map(function (item, index) {
      return "<option value=\"" + html(item.id) + "\"" + (item.id === puzzle?.id ? " selected" : "") + ">" + (index + 1) + ". " + html(item.title || item.id) + "</option>";
    }).join("");
    const langButtons = langs.map(function (item) {
      return "<button class=\"" + (item.id === lang.id ? "is-active" : "") + "\" type=\"button\" data-i18n-lang-v170=\"" + item.id + "\">" + item.short + "</button>";
    }).join("");
    const routeEditor = routeFields.map(function (field) {
      return fieldControlV170("route", field, sourceValueV170(route, field.key), langValueV170(route, lang.id, field.key));
    }).join("");
    const puzzleEditor = puzzle ? puzzleFields.map(function (field) {
      return fieldControlV170("puzzle", field, sourceValueV170(puzzle, field.key), langValueV170(puzzle, lang.id, field.key));
    }).join("") : "<p>Aucune enigme selectionnee.</p>";
    const hintsEditor = puzzle ? textAreaBlockV170("hints", "Indices", sourceHintsV170(puzzle), translatedHintsV170(puzzle, lang.id)) : "";
    const answersEditor = puzzle ? textAreaBlockV170("acceptedAnswers", "Reponses acceptees supplementaires", sourceAcceptedAnswersV170(puzzle), translatedAcceptedAnswersV170(puzzle, lang.id)) : "";
    const missing = coverage.missing.slice(0, 8);

    panel.innerHTML = [
      "<div class=\"i18n-head-v170\"><div><p class=\"section-label\">Traductions parcours</p><h3>Atelier FR / EN / NL</h3><p>Le francais reste la source. Les champs remplis ici sont utilises par les joueurs selon la langue choisie.</p></div><div class=\"i18n-actions-v170\"><button class=\"secondary-button compact-button\" type=\"button\" data-i18n-export-v170>Exporter modele</button><button class=\"primary-button compact-button\" type=\"button\" data-i18n-save-v170>Enregistrer traductions</button></div></div>",
      "<div class=\"i18n-toolbar-v170\"><label>Parcours<select data-i18n-route-select-v170>" + routeOptions + "</select></label><label>Enigme<select data-i18n-puzzle-select-v170>" + puzzleOptions + "</select></label><div class=\"i18n-lang-tabs-v170\" role=\"group\" aria-label=\"Langue traduction\">" + langButtons + "</div></div>",
      "<div class=\"i18n-metrics-v170\"><span><strong>" + coverage.percent + "%</strong>" + html(lang.label) + "</span><span><strong>" + total.percent + "%</strong>Total EN/NL</span><span><strong>" + coverage.done + "/" + coverage.total + "</strong>Champs remplis</span><span><strong>" + (route.puzzles?.length || 0) + "</strong>Enigmes</span></div>",
      missing.length ? "<div class=\"i18n-missing-v170\"><strong>Champs a completer</strong><ul><li>" + missing.map(html).join("</li><li>") + "</li></ul></div>" : "<div class=\"i18n-missing-v170 is-ok\"><strong>Couverture complete pour cette langue.</strong></div>",
      "<div class=\"i18n-editor-grid-v170\"><section><h4>Parcours</h4>" + routeEditor + "</section><section><h4>Enigme selectionnee</h4>" + puzzleEditor + hintsEditor + answersEditor + "</section></div>",
      "<p class=\"form-message\" data-i18n-message-v170>Astuce : ajoutez les variantes de reponse utiles, une par ligne, pour accepter les formulations naturelles en anglais et neerlandais.</p>",
    ].join("");
    bindPanelV170(panel);
  }

  function bindPanelV170(panel) {
    panel.querySelector("[data-i18n-route-select-v170]")?.addEventListener("change", function (event) {
      state.routeId = event.target.value;
      state.puzzleId = "";
      renderPanelV170(true);
    });
    panel.querySelector("[data-i18n-puzzle-select-v170]")?.addEventListener("change", function (event) {
      state.puzzleId = event.target.value;
      renderPanelV170(true);
    });
    panel.querySelectorAll("[data-i18n-lang-v170]").forEach(function (button) {
      button.addEventListener("click", function () {
        state.lang = button.dataset.i18nLangV170;
        renderPanelV170(true);
      });
    });
    panel.querySelector("[data-i18n-save-v170]")?.addEventListener("click", savePanelV170);
    panel.querySelector("[data-i18n-export-v170]")?.addEventListener("click", exportTemplateV170);
  }

  function savePanelV170() {
    const panel = document.querySelector("#admin-i18n-workspace-v170");
    const route = currentRouteV170();
    const puzzle = currentPuzzleV170(route);
    if (!panel || !route) return;
    panel.querySelectorAll("[data-i18n-v170='route']").forEach(function (field) {
      setLangValueV170(route, state.lang, field.dataset.i18nField, field.value);
    });
    if (puzzle) {
      panel.querySelectorAll("[data-i18n-v170='puzzle']").forEach(function (field) {
        setLangValueV170(puzzle, state.lang, field.dataset.i18nField, field.value);
      });
      const hints = panel.querySelector("[data-i18n-special-v170='hints']");
      const accepted = panel.querySelector("[data-i18n-special-v170='acceptedAnswers']");
      if (hints) setTextArrayV170(puzzle, state.lang, "hints", hints.value);
      if (accepted) setTextArrayV170(puzzle, state.lang, "acceptedAnswers", accepted.value);
    }
    if (typeof saveData === "function") saveData({ immediate: true });
    const message = panel.querySelector("[data-i18n-message-v170]");
    if (message) message.textContent = "Traductions enregistrees pour " + state.lang.toUpperCase() + ".";
    if (typeof showToast === "function") showToast("Traductions enregistrees.");
    renderPanelV170(true);
  }

  function exportTemplateV170() {
    const payload = {
      exportedAt: new Date().toISOString(),
      note: "Modele de traduction. Le francais est la source; remplissez en/nl dans i18n.",
      routes: routesV170().map(function (route) {
        return {
          id: route.id,
          source: {
            title: route.title || "",
            area: route.area || "",
            description: route.description || "",
            briefingText: route.briefingText || "",
            finishMessage: route.finishMessage || "",
          },
          i18n: route.i18n || {},
          puzzles: (route.puzzles || []).map(function (puzzle) {
            return {
              id: puzzle.id,
              source: {
                title: puzzle.title || "",
                place: puzzle.place || "",
                question: puzzle.question || "",
                arrivalMessage: puzzle.arrivalMessage || "",
                answer: puzzle.answer || "",
                hints: sourceHintsV170(puzzle),
              },
              i18n: puzzle.i18n || {},
            };
          }),
        };
      }),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2) + "\n"], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "traductions-parcours-escape-erezee.json";
    link.click();
    window.setTimeout(function () { URL.revokeObjectURL(url); }, 2000);
  }

  function isAdminVisibleV170() {
    return location.hash === "#admin" && !document.querySelector("#admin-content.is-hidden");
  }

  function tickV170(force) {
    if (!isAdminVisibleV170()) return;
    renderPanelV170(Boolean(force));
  }

  window.addEventListener("hashchange", function () { window.setTimeout(function () { tickV170(true); }, 350); });
  document.addEventListener("DOMContentLoaded", function () {
    window.setTimeout(function () { tickV170(true); }, 900);
    window.setInterval(function () { tickV170(false); }, 2500);
  });
  window.setTimeout(function () { tickV170(true); }, 900);
})();
`;

const CSS_PATCH = `

/* admin-i18n-workspace-v170 */
.admin-i18n-workspace-v170 {
  border: 1px solid rgba(18, 60, 50, 0.16);
  border-radius: 8px;
  background: #f9fbf8;
  margin: 18px 0;
  padding: 18px;
  box-shadow: 0 12px 34px rgba(18, 60, 50, 0.08);
}

.i18n-head-v170,
.i18n-toolbar-v170,
.i18n-actions-v170,
.i18n-lang-tabs-v170 {
  display: flex;
  gap: 12px;
}

.i18n-head-v170 {
  align-items: flex-start;
  justify-content: space-between;
}

.i18n-head-v170 p {
  max-width: 780px;
  color: #586761;
}

.i18n-actions-v170,
.i18n-lang-tabs-v170 {
  flex-wrap: wrap;
}

.i18n-toolbar-v170 {
  align-items: end;
  flex-wrap: wrap;
  margin-top: 14px;
}

.i18n-toolbar-v170 label {
  display: grid;
  gap: 6px;
  min-width: min(280px, 100%);
  color: #55645e;
  font-size: 0.86rem;
  font-weight: 800;
}

.i18n-toolbar-v170 select,
.i18n-field-v170 input,
.i18n-field-v170 textarea {
  width: 100%;
}

.i18n-lang-tabs-v170 button {
  min-width: 48px;
  min-height: 40px;
  border: 1px solid rgba(18, 60, 50, 0.18);
  border-radius: 8px;
  background: #ffffff;
  color: #123c32;
  font-weight: 900;
}

.i18n-lang-tabs-v170 button.is-active {
  background: #123c32;
  color: #ffffff;
}

.i18n-metrics-v170 {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
  gap: 10px;
  margin: 16px 0;
}

.i18n-metrics-v170 span,
.i18n-missing-v170,
.i18n-field-v170 {
  border: 1px solid rgba(18, 60, 50, 0.12);
  border-radius: 8px;
  background: #ffffff;
  padding: 12px;
}

.i18n-metrics-v170 strong {
  display: block;
  color: #123c32;
  font-size: 1.2rem;
}

.i18n-missing-v170 {
  background: #fff8e8;
}

.i18n-missing-v170.is-ok {
  background: #edf8f2;
}

.i18n-missing-v170 ul {
  margin: 8px 0 0;
  padding-left: 18px;
}

.i18n-editor-grid-v170 {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 16px;
  margin-top: 16px;
}

.i18n-editor-grid-v170 section {
  display: grid;
  align-content: start;
  gap: 12px;
}

.i18n-editor-grid-v170 h4 {
  margin: 0;
  color: #123c32;
}

.i18n-field-v170 {
  display: grid;
  gap: 10px;
}

.i18n-field-v170 strong,
.i18n-field-v170 label span {
  display: block;
  color: #123c32;
}

.i18n-field-v170 p,
.i18n-field-v170 ol {
  margin: 6px 0 0;
  color: #5f6d68;
  line-height: 1.45;
}

.i18n-field-v170 textarea {
  min-height: 96px;
  resize: vertical;
}

.i18n-empty-v170 {
  color: #8a6a20;
  font-style: italic;
}

@media (max-width: 760px) {
  .i18n-head-v170,
  .i18n-toolbar-v170 {
    display: grid;
  }

  .i18n-actions-v170 > *,
  .i18n-toolbar-v170 label {
    width: 100%;
  }
}
`;

function patchApp(app) {
  let next = bumpAssets(app);
  if (!next.includes('admin-i18n-workspace-v170')) {
    next = `${next.trimEnd()}\n\n${APP_PATCH}\n`;
  }
  return next;
}

function patchStyles(styles) {
  let next = bumpAssets(styles);
  if (!next.includes('admin-i18n-workspace-v170')) {
    next = `${next.trimEnd()}${CSS_PATCH}`;
  }
  return next;
}

await patchTextFile('app.js', patchApp);
await patchTextFile('styles.css', patchStyles);
await patchTextFile('index.html', bumpAssets);
await patchOptional('suivi.html', bumpAssets);
await patchTextFile('service-worker.js', bumpAssets);

console.log(`Admin i18n workspace v${VERSION} applied.`);
