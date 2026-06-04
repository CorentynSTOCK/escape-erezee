import { writeFile, readFile } from 'node:fs/promises';

const VERSION = 127;
const FALLBACK_FILE = `home-i18n-fallback-v${VERSION}.js`;

const FALLBACK_JS = `(() => {
  if (window.__escapeHomeI18nFallbackV127) return;
  window.__escapeHomeI18nFallbackV127 = true;

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

  function activeLanguage() {
    const active = document.querySelector('.language-switcher [data-lang].is-active');
    if (active && active.dataset && active.dataset.lang) return active.dataset.lang;
    return (document.documentElement.lang || 'fr').slice(0, 2).toLowerCase();
  }

  function patchParagraphs() {
    const copy = translations[activeLanguage()];
    if (!copy) return;
    document.querySelectorAll('#home-view p').forEach((paragraph) => {
      const text = (paragraph.textContent || '').replace(/\s+/g, ' ').trim();
      if (text.includes('Chaque parcours vous emmène')) paragraph.textContent = copy.concept;
      if (text.includes('La durée dépend du parcours')) paragraph.textContent = copy.duration;
      if (text.includes('Les parcours se déroulent dehors')) paragraph.textContent = copy.dogs;
    });
  }

  function schedulePatch() {
    [0, 120, 360, 900, 1800, 3600, 7000].forEach((delay) => window.setTimeout(patchParagraphs, delay));
  }

  document.addEventListener('click', (event) => {
    if (event.target && event.target.closest && event.target.closest('[data-lang]')) schedulePatch();
  }, true);
  window.addEventListener('hashchange', schedulePatch);
  window.addEventListener('load', schedulePatch);
  schedulePatch();
})();
`;

function bumpAssetVersions(text) {
  return text
    .replace(/styles\.css\?v=\d+/g, `styles.css?v=${VERSION}`)
    .replace(/app\.js\?v=\d+/g, `app.js?v=${VERSION}`);
}

function patchIndex(html) {
  let output = bumpAssetVersions(html);
  output = output.replace(/\n\s*<script id="multilingual-home-inline-v126">[\s\S]*?<\/script>/, '');
  output = output.replace(/\n\s*<script src="home-i18n-fallback-v\d+\.js\?v=\d+"><\/script>/g, '');
  const appScriptPattern = /(<script\s+src="app\.js\?v=\d+"\s*><\/script>)/;
  if (!appScriptPattern.test(output)) throw new Error('Script app.js introuvable pour v127');
  return output.replace(appScriptPattern, `$1\n    <script src="${FALLBACK_FILE}?v=${VERSION}"></script>`);
}

function patchServiceWorker(worker) {
  return bumpAssetVersions(worker).replace(/escape-erezee-v\d+/g, `escape-erezee-v${VERSION}`);
}

await writeFile(FALLBACK_FILE, FALLBACK_JS, 'utf8');
await writeFile('index.html', patchIndex(await readFile('index.html', 'utf8')), 'utf8');
await writeFile('service-worker.js', patchServiceWorker(await readFile('service-worker.js', 'utf8')), 'utf8');

console.log(`Multilingual home external v${VERSION} applied.`);
