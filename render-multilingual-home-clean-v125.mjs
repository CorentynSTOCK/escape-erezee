import { readFile, writeFile } from 'node:fs/promises';

const VERSION = 125;

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

/* multilingual-v125 */
(function installCleanHomeTranslationsV125() {
  if (window.__escapeI18nHomeCleanV125) return;
  window.__escapeI18nHomeCleanV125 = true;

  const translations = {
    en: {
      concept: 'Each route takes you around Erezée through a series of real places to reach. Once you are in the right area, the app unlocks the next puzzle: written answer, observation, photo or clue to use at the right moment.',
      duration: 'The duration depends on the route and the team pace. Plan for an outdoor activity lasting from several dozen minutes to a few hours.',
      dogs: 'The routes take place outdoors. Dogs can join the team if the places crossed, the weather and leash rules allow it.'
    },
    nl: {
      concept: 'Elke route neemt je mee rond Erezée via echte plekken die je moet bereiken. Zodra je in de juiste zone bent, ontgrendelt de app het volgende raadsel: geschreven antwoord, observatie, foto of aanwijzing op het juiste moment.',
      duration: 'De duur hangt af van de route en het tempo van het team. Reken meestal op een buitenactiviteit van enkele tientallen minuten tot enkele uren.',
      dogs: 'De routes spelen zich buiten af. Honden kunnen mee als de plaatsen, het weer en de leibandregels dat toelaten.'
    }
  };

  function langV125() {
    const active = document.querySelector('.language-switcher [data-lang].is-active');
    if (active && active.dataset && active.dataset.lang) return active.dataset.lang;
    const lang = (document.documentElement.lang || 'fr').slice(0, 2).toLowerCase();
    return ['fr', 'en', 'nl'].includes(lang) ? lang : 'fr';
  }

  function patchV125() {
    const copy = translations[langV125()];
    if (!copy) return;
    document.querySelectorAll('#home-view p').forEach((p) => {
      const text = p.textContent.replace(/\s+/g, ' ').trim();
      if (text.includes('Chaque parcours vous emmène')) p.textContent = copy.concept;
      if (text.includes('La durée dépend du parcours')) p.textContent = copy.duration;
      if (text.includes('Les parcours se déroulent dehors')) p.textContent = copy.dogs;
    });
  }

  function scheduleV125() {
    [0, 100, 350, 800, 1600, 3200, 5600].forEach((delay) => window.setTimeout(patchV125, delay));
  }

  document.addEventListener('click', (event) => {
    const target = event.target;
    if (target && target.closest && target.closest('[data-lang]')) scheduleV125();
  }, true);
  window.addEventListener('hashchange', scheduleV125);
  window.addEventListener('load', scheduleV125);
  scheduleV125();
})();
`;

function patchApp(app) {
  if (app.includes('multilingual-v125')) return bumpAssetVersions(app);
  if (!app.includes('multilingual-v120')) {
    throw new Error(`Patch v${VERSION} introuvable: multilingual-v120 requis`);
  }
  return `${bumpAssetVersions(app).trimEnd()}${APP_PATCH}\n`;
}

function patchServiceWorker(worker) {
  return bumpAssetVersions(worker).replace(/escape-erezee-v\d+/g, `escape-erezee-v${VERSION}`);
}

await patchTextFile('app.js', patchApp);
await patchTextFile('index.html', bumpAssetVersions);
await patchTextFile('service-worker.js', patchServiceWorker);

console.log(`Multilingual clean home v${VERSION} applied.`);
