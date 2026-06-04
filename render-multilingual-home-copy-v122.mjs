import { readFile, writeFile } from 'node:fs/promises';

const VERSION = 122;

async function patchTextFile(filePath, patcher) {
  const input = await readFile(filePath, 'utf8');
  const output = patcher(input);
  if (output !== input) await writeFile(filePath, output, 'utf8');
}

function bumpAssetVersions(text) {
  return text
    .replace(/styles\.css\?v=\d+/g, `styles.css?v=${VERSION}`)
    .replace(/app\.js\?v=\d+/g, `app.js?v=${VERSION}`);
}

const APP_PATCH = `

/* multilingual-v122 */
(function installHomeCopyTranslationsV122() {
  if (window.__escapeI18nHomeCopyV122) return;
  window.__escapeI18nHomeCopyV122 = true;

  const longCopy = {
    en: {
      intro: 'Explore Erezée as a team, move from place to place with the map, unlock the puzzles on site and try to finish the route before the timer runs out.',
      concept: 'Each route takes you around Erezée through a series of real places to reach. Once you are in the right area, the app unlocks the next puzzle: written answer, observation, photo or clue to use at the right moment.'
    },
    nl: {
      intro: 'Verken Erezée in team, ga met de kaart van plek naar plek, ontgrendel de raadsels ter plaatse en probeer de route te voltooien voor de tijd om is.',
      concept: 'Elke route neemt je mee rond Erezée via echte plekken die je moet bereiken. Zodra je in de juiste zone bent, ontgrendelt de app het volgende raadsel: geschreven antwoord, observatie, foto of aanwijzing op het juiste moment.'
    }
  };

  const introPattern = /Explorez Erezée en équipe[^.]*fin du chrono\./;
  const conceptPattern = /Chaque parcours vous emmène[\s\S]*?bon moment\./;

  function patchHomeLongCopyV122() {
    const lang = typeof escapeI18nLanguage === 'function' ? escapeI18nLanguage() : 'fr';
    const copy = longCopy[lang];
    if (!copy) return;
    const home = document.querySelector('#home-view');
    if (!home) return;
    const walker = document.createTreeWalker(home, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach((node) => {
      let next = node.nodeValue || '';
      next = next.replace(introPattern, copy.intro);
      next = next.replace(conceptPattern, copy.concept);
      if (next !== node.nodeValue) node.nodeValue = next;
    });
  }

  function scheduleHomeCopyPatchV122() {
    [0, 80, 240, 650, 1400].forEach((delay) => window.setTimeout(patchHomeLongCopyV122, delay));
  }

  const previousSetLanguageV122 = typeof escapeI18nSetLanguage === 'function' ? escapeI18nSetLanguage : null;
  if (previousSetLanguageV122) {
    escapeI18nSetLanguage = function escapeI18nSetLanguageV122(lang, options = {}) {
      const result = previousSetLanguageV122.call(this, lang, options);
      scheduleHomeCopyPatchV122();
      return result;
    };
  }

  const previousApplyDomV122 = typeof escapeI18nApplyDom === 'function' ? escapeI18nApplyDom : null;
  if (previousApplyDomV122) {
    escapeI18nApplyDom = function escapeI18nApplyDomV122() {
      const result = previousApplyDomV122.apply(this, arguments);
      scheduleHomeCopyPatchV122();
      return result;
    };
  }

  window.addEventListener('hashchange', scheduleHomeCopyPatchV122);
  scheduleHomeCopyPatchV122();
})();
`;

function patchApp(app) {
  if (app.includes('multilingual-v122')) return bumpAssetVersions(app);
  if (!app.includes('multilingual-v121')) {
    throw new Error(`Patch v${VERSION} introuvable: multilingual-v121 requis`);
  }
  return `${bumpAssetVersions(app).trimEnd()}${APP_PATCH}\n`;
}

function patchServiceWorker(worker) {
  return bumpAssetVersions(worker).replace(/escape-erezee-v\d+/g, `escape-erezee-v${VERSION}`);
}

await patchTextFile('app.js', patchApp);
await patchTextFile('index.html', bumpAssetVersions);
await patchTextFile('service-worker.js', patchServiceWorker);

console.log(`Multilingual home copy v${VERSION} applied.`);
