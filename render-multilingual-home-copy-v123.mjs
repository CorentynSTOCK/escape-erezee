import { readFile, writeFile } from 'node:fs/promises';

const VERSION = 123;

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

/* multilingual-v123 */
(function installAutonomousHomeCopyV123() {
  if (window.__escapeI18nHomeCopyV123) return;
  window.__escapeI18nHomeCopyV123 = true;

  const copy = {
    en: {
      intro: 'Explore Erezée as a team, move from place to place with the map, unlock the puzzles on site and try to finish the route before the timer runs out.',
      concept: 'Each route takes you around Erezée through a series of real places to reach. Once you are in the right area, the app unlocks the next puzzle: written answer, observation, photo or clue to use at the right moment.'
    },
    nl: {
      intro: 'Verken Erezée in team, ga met de kaart van plek naar plek, ontgrendel de raadsels ter plaatse en probeer de route te voltooien voor de tijd om is.',
      concept: 'Elke route neemt je mee rond Erezée via echte plekken die je moet bereiken. Zodra je in de juiste zone bent, ontgrendelt de app het volgende raadsel: geschreven antwoord, observatie, foto of aanwijzing op het juiste moment.'
    }
  };

  const introPattern = /Explorez Erezée en équipe[\s\S]*?fin du chrono\./g;
  const conceptPattern = /Chaque parcours vous emmène[\s\S]*?bon moment\./g;

  function activeLanguageV123() {
    const active = document.querySelector('.language-switcher [data-lang].is-active');
    if (active?.dataset?.lang) return active.dataset.lang;
    const lang = (document.documentElement.lang || 'fr').slice(0, 2).toLowerCase();
    return ['fr', 'en', 'nl'].includes(lang) ? lang : 'fr';
  }

  function patchHomeCopyV123() {
    const lang = activeLanguageV123();
    const langCopy = copy[lang];
    if (!langCopy) return;
    const home = document.querySelector('#home-view');
    if (!home) return;
    const walker = document.createTreeWalker(home, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach((node) => {
      const value = node.nodeValue || '';
      const next = value.replace(introPattern, langCopy.intro).replace(conceptPattern, langCopy.concept);
      if (next !== value) node.nodeValue = next;
    });
  }

  function scheduleHomeCopyV123() {
    [0, 120, 320, 700, 1300, 2400, 4200].forEach((delay) => window.setTimeout(patchHomeCopyV123, delay));
  }

  document.addEventListener('click', (event) => {
    if (event.target?.closest?.('[data-lang]')) scheduleHomeCopyV123();
  }, true);
  window.addEventListener('hashchange', scheduleHomeCopyV123);
  window.addEventListener('load', scheduleHomeCopyV123);
  scheduleHomeCopyV123();
})();
`;

function patchApp(app) {
  if (app.includes('multilingual-v123')) return bumpAssetVersions(app);
  if (!app.includes('multilingual-v122')) {
    throw new Error(`Patch v${VERSION} introuvable: multilingual-v122 requis`);
  }
  return `${bumpAssetVersions(app).trimEnd()}${APP_PATCH}\n`;
}

function patchServiceWorker(worker) {
  return bumpAssetVersions(worker).replace(/escape-erezee-v\d+/g, `escape-erezee-v${VERSION}`);
}

await patchTextFile('app.js', patchApp);
await patchTextFile('index.html', bumpAssetVersions);
await patchTextFile('service-worker.js', patchServiceWorker);

console.log(`Multilingual autonomous home copy v${VERSION} applied.`);
