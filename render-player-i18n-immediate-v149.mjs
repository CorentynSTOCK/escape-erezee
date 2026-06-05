import { readFile, writeFile } from 'node:fs/promises';

const VERSION = 149;
const MARKER = 'player-i18n-immediate-v149';

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
/* player-i18n-immediate-v149 */
(function installPlayerI18nImmediateV149() {
  if (window.__playerI18nImmediateV149) return;
  window.__playerI18nImmediateV149 = true;

  function applyNowV149() {
    try {
      if (typeof escapeI18nApplyDom === "function") escapeI18nApplyDom();
    } catch (error) {
      console.warn("Traduction joueur differee.", error);
    }
  }

  function burstV149() {
    [0, 30, 90, 180, 360, 700, 1200, 2200].forEach((delay) => {
      window.setTimeout(applyNowV149, delay);
    });
  }

  function wrapV149(name) {
    try {
      if (typeof window[name] === "function") {
        const original = window[name];
        if (original.__playerI18nImmediateV149) return;
        const wrapped = function playerI18nImmediateWrappedV149() {
          const result = original.apply(this, arguments);
          burstV149();
          return result;
        };
        wrapped.__playerI18nImmediateV149 = true;
        window[name] = wrapped;
      } else if (typeof eval(name) === "function") {
        const original = eval(name);
        if (original.__playerI18nImmediateV149) return;
        const wrapped = function playerI18nImmediateScopedWrappedV149() {
          const result = original.apply(this, arguments);
          burstV149();
          return result;
        };
        wrapped.__playerI18nImmediateV149 = true;
        eval(name + " = wrapped");
      }
    } catch {
      // Some browser contexts do not allow wrapping every binding. The burst timer remains enough.
    }
  }

  [
    "escapeI18nSetLanguage",
    "render",
    "renderPlayer",
    "renderRouteSummary",
    "renderAnswerZone",
    "renderBriefing",
    "playerRescueRender",
    "updateBriefingLocationUi",
    "locatePlayer",
    "handleGeolocationError",
    "handleBriefingGeolocationError",
  ].forEach(wrapV149);

  let queued = false;
  function queueV149() {
    if (queued) return;
    queued = true;
    window.setTimeout(() => {
      queued = false;
      burstV149();
    }, 0);
  }

  window.setTimeout(() => {
    if (document.body) {
      new MutationObserver((mutations) => {
        if (mutations.some((mutation) => mutation.target?.parentElement?.closest?.("#player-view,#toast,#arrival-modal,#image-viewer"))) {
          queueV149();
        }
      }).observe(document.body, { childList: true, characterData: true, subtree: true });
    }
    burstV149();
  }, 0);
  window.addEventListener("load", burstV149);
  window.addEventListener("hashchange", burstV149);
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) burstV149();
  });
})();
`;

await patchTextFile('app.js', (input) => input.includes(MARKER) ? input : `${input.trimEnd()}\n\n${APP_PATCH}\n`);
await patchTextFile('index.html', bumpAppReferences);
await patchTextFile('service-worker.js', bumpAppReferences);

console.log(`Player i18n immediate v${VERSION} applied.`);
