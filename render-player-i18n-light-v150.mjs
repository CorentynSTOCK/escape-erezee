import { readFile, writeFile } from 'node:fs/promises';

const VERSION = 150;
const MARKER = 'player-i18n-light-v150';

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

const APP_PATCH = String.raw`
/* player-i18n-light-v150 */
(function installPlayerI18nLightV150() {
  if (window.__playerI18nLightV150) return;
  window.__playerI18nLightV150 = true;

  function currentLangV150() {
    const active = document.querySelector("#language-switcher [aria-pressed='true'], #language-switcher .is-active");
    const lang = active?.dataset?.lang || window.escapeErezeeLanguage || (document.documentElement.lang || "fr").slice(0, 2);
    return ["fr", "en", "nl"].includes(lang) ? lang : "fr";
  }

  function applyV150() {
    if (currentLangV150() === "fr") return;
    if (typeof escapeI18nApplyDom === "function") escapeI18nApplyDom();
  }

  let queued = false;
  function queueV150(delay = 40) {
    if (queued) return;
    queued = true;
    window.setTimeout(() => {
      queued = false;
      applyV150();
    }, delay);
  }

  function burstV150() {
    [40, 160, 450, 1100].forEach((delay) => window.setTimeout(applyV150, delay));
  }

  function wrapV150(name) {
    try {
      const original = eval(name);
      if (typeof original !== "function" || original.__playerI18nLightV150) return;
      const wrapped = function playerI18nLightWrappedV150() {
        const result = original.apply(this, arguments);
        queueV150();
        return result;
      };
      wrapped.__playerI18nLightV150 = true;
      eval(name + " = wrapped");
    } catch {
      // Some bindings may not be writable depending on browser timing.
    }
  }

  [
    "escapeI18nSetLanguage",
    "renderPlayer",
    "renderRouteSummary",
    "renderAnswerZone",
    "renderBriefing",
    "playerRescueRender",
    "setBriefingLocationMessage",
    "handleGeolocationError",
    "handleBriefingGeolocationError",
  ].forEach(wrapV150);

  window.addEventListener("hashchange", burstV150);
  window.addEventListener("load", burstV150);
  window.setTimeout(burstV150, 0);
  window.setInterval(() => {
    if (document.querySelector("#player-view.is-active")) applyV150();
  }, 1800);
})();
`;

function patchApp(input) {
  let output = input.replace(/\/\* player-i18n-immediate-v149 \*\/[\s\S]*?\n\}\)\(\);\n?/g, '');
  if (!output.includes(MARKER)) output = `${output.trimEnd()}\n\n${APP_PATCH}\n`;
  return output;
}

await patchTextFile('app.js', patchApp);
await patchTextFile('index.html', bumpAppReferences);
await patchTextFile('service-worker.js', bumpAppReferences);

console.log(`Player i18n light v${VERSION} applied.`);
