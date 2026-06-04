import { readFile, writeFile } from 'node:fs/promises';

const VERSION = 124;

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

/* multilingual-v124 */
(function installStaticParagraphTranslationsV124() {
  if (window.__escapeI18nStaticParagraphsV124) return;
  window.__escapeI18nStaticParagraphsV124 = true;

  const rules = {
    en: [
      { match: 'Chaque parcours vous emmène', text: 'Each route takes you around Erezée through a series of real places to reach. Once you are in the right area, the app unlocks the next puzzle: written answer, observation, photo or clue to use at the right moment.' },
      { match: 'La durée dépend du parcours', text: 'The duration depends on the route and the team pace. Plan for an outdoor activity lasting from several dozen minutes to a few hours.' },
      { match: 'Les parcours se déroulent dehors', text: 'The routes take place outdoors. Dogs can join the team if the places crossed, the weather and leash rules allow it.' }
    ],
    nl: [
      { match: 'Chaque parcours vous emmène', text: 'Elke route neemt je mee rond Erezée via echte plekken die je moet bereiken. Zodra je in de juiste zone bent, ontgrendelt de app het volgende raadsel: geschreven antwoord, observatie, foto of aanwijzing op het juiste moment.' },
      { match: 'La durée dépend du parcours', text: 'De duur hangt af van de route en het tempo van het team. Reken meestal op een buitenactiviteit van enkele tientallen minuten tot enkele uren.' },
      { match: 'Les parcours se déroulent dehors', text: 'De routes spelen zich buiten af. Honden kunnen mee als de plaatsen, het weer en de leibandregels dat toelaten.' }
    ]
  };

  function activeLanguageV124() {
    const active = document.querySelector('.language-switcher [data-lang].is-active');
    if (active?.dataset?.lang) return active.dataset.lang;
    const lang = (document.documentElement.lang || 'fr').slice(0, 2).toLowerCase();
    return ['fr', 'en', 'nl'].includes(lang) ? lang : 'fr';
  }

  function patchStaticParagraphsV124() {
    const langRules = rules[activeLanguageV124()];
    if (!langRules) return;
    document.querySelectorAll('#home-view p').forEach((paragraph) => {
      const text = paragraph.textContent.replace(/\s+/g, ' ').trim();
      const rule = langRules.find((entry) => text.includes(entry.match));
      if (rule && paragraph.textContent !== rule.text) paragraph.textContent = rule.text;
    });
  }

  function scheduleStaticParagraphsV124() {
    [0, 150, 400, 900, 1700, 3000, 5200].forEach((delay) => window.setTimeout(patchStaticParagraphsV124, delay));
  }

  document.addEventListener('click', (event) => {
    if (event.target?.closest?.('[data-lang]')) scheduleStaticParagraphsV124();
  }, true);
  window.addEventListener('hashchange', scheduleStaticParagraphsV124);
  window.addEventListener('load', scheduleStaticParagraphsV124);
  scheduleStaticParagraphsV124();
})();
`;

function patchApp(app) {
  if (app.includes('multilingual-v124')) return bumpAssetVersions(app);
  if (!app.includes('multilingual-v123')) {
    throw new Error(`Patch v${VERSION} introuvable: multilingual-v123 requis`);
  }
  return `${bumpAssetVersions(app).trimEnd()}${APP_PATCH}\n`;
}

function patchServiceWorker(worker) {
  return bumpAssetVersions(worker).replace(/escape-erezee-v\d+/g, `escape-erezee-v${VERSION}`);
}

await patchTextFile('app.js', patchApp);
await patchTextFile('index.html', bumpAssetVersions);
await patchTextFile('service-worker.js', patchServiceWorker);

console.log(`Multilingual static paragraphs v${VERSION} applied.`);
