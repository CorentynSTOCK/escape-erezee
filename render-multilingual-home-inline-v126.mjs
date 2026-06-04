import { readFile, writeFile } from 'node:fs/promises';

const VERSION = 126;

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

const INLINE_SCRIPT = `
    <script id="multilingual-home-inline-v126">
      (function () {
        if (window.__escapeHomeInlineV126) return;
        window.__escapeHomeInlineV126 = true;
        var translations = {
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
        function lang() {
          var active = document.querySelector('.language-switcher [data-lang].is-active');
          if (active && active.dataset && active.dataset.lang) return active.dataset.lang;
          return (document.documentElement.lang || 'fr').slice(0, 2).toLowerCase();
        }
        function patch() {
          var copy = translations[lang()];
          if (!copy) return;
          document.querySelectorAll('#home-view p').forEach(function (p) {
            var text = (p.textContent || '').replace(/\s+/g, ' ').trim();
            if (text.indexOf('Chaque parcours vous emmène') !== -1) p.textContent = copy.concept;
            if (text.indexOf('La durée dépend du parcours') !== -1) p.textContent = copy.duration;
            if (text.indexOf('Les parcours se déroulent dehors') !== -1) p.textContent = copy.dogs;
          });
        }
        function schedule() {
          [0, 150, 450, 900, 1800, 3600, 6500].forEach(function (delay) { window.setTimeout(patch, delay); });
        }
        document.addEventListener('click', function (event) {
          if (event.target && event.target.closest && event.target.closest('[data-lang]')) schedule();
        }, true);
        window.addEventListener('hashchange', schedule);
        window.addEventListener('load', schedule);
        schedule();
      })();
    </script>`;

function patchIndex(html) {
  let output = bumpAssetVersions(html);
  if (output.includes('multilingual-home-inline-v126')) return output;
  const scriptPattern = /(<script\s+src="app\.js\?v=\d+"\s*><\/script>)/;
  if (!scriptPattern.test(output)) throw new Error('Script app.js introuvable pour v126');
  return output.replace(scriptPattern, `$1\n${INLINE_SCRIPT}`);
}

function patchServiceWorker(worker) {
  return bumpAssetVersions(worker).replace(/escape-erezee-v\d+/g, `escape-erezee-v${VERSION}`);
}

await patchTextFile('index.html', patchIndex);
await patchTextFile('service-worker.js', patchServiceWorker);

console.log(`Multilingual home inline v${VERSION} applied.`);
