import { readFile, writeFile } from 'node:fs/promises';

const VERSION = 128;

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

function staticText(fr, en, nl) {
  return `<span data-lang-static="fr">${fr}</span><span data-lang-static="en">${en}</span><span data-lang-static="nl">${nl}</span>`;
}

function replaceOnce(text, pattern, replacement, label) {
  if (text.includes(replacement)) return text;
  const output = text.replace(pattern, replacement);
  if (output === text) throw new Error(`Remplacement introuvable: ${label}`);
  return output;
}

function patchIndex(html) {
  let output = bumpAssetVersions(html);
  output = output.replace(/\n\s*<script src="home-i18n-fallback-v\d+\.js\?v=\d+"><\/script>/g, '');

  output = replaceOnce(
    output,
    /<p>\s*Chaque parcours vous emmène dans les environs d’Erezée avec une suite\s+d’étapes à rejoindre réellement\. Une fois dans la bonne zone, l’application\s+débloque l’énigme suivante: réponse écrite, observation, photo ou indice à\s+utiliser au bon moment\.\s*<\/p>/,
    `<p data-static-i18n-v128>${staticText(
      'Chaque parcours vous emmène dans les environs d’Erezée avec une suite d’étapes à rejoindre réellement. Une fois dans la bonne zone, l’application débloque l’énigme suivante: réponse écrite, observation, photo ou indice à utiliser au bon moment.',
      'Each route takes you around Erezée through a series of real places to reach. Once you are in the right area, the app unlocks the next puzzle: written answer, observation, photo or clue to use at the right moment.',
      'Elke route neemt je mee rond Erezée via echte plekken die je moet bereiken. Zodra je in de juiste zone bent, ontgrendelt de app het volgende raadsel: geschreven antwoord, observatie, foto of aanwijzing op het juiste moment.',
    )}</p>`,
    'concept accueil',
  );

  output = replaceOnce(
    output,
    /<p>La durée dépend du parcours et du rythme de l'équipe\. Prévoyez généralement une activité de plusieurs dizaines de minutes à quelques heures\.<\/p>/,
    `<p data-static-i18n-v128>${staticText(
      "La durée dépend du parcours et du rythme de l'équipe. Prévoyez généralement une activité de plusieurs dizaines de minutes à quelques heures.",
      'The duration depends on the route and the team pace. Plan for an outdoor activity lasting from several dozen minutes to a few hours.',
      'De duur hangt af van de route en het tempo van het team. Reken meestal op een buitenactiviteit van enkele tientallen minuten tot enkele uren.',
    )}</p>`,
    'faq durée',
  );

  output = replaceOnce(
    output,
    /<p>Les parcours se déroulent dehors\. Les chiens peuvent accompagner l'équipe si les lieux traversés, la météo et la tenue en laisse le permettent\.<\/p>/,
    `<p data-static-i18n-v128>${staticText(
      "Les parcours se déroulent dehors. Les chiens peuvent accompagner l'équipe si les lieux traversés, la météo et la tenue en laisse le permettent.",
      'The routes take place outdoors. Dogs can join the team if the places crossed, the weather and leash rules allow it.',
      'De routes spelen zich buiten af. Honden kunnen mee als de plaatsen, het weer en de leibandregels dat toelaten.',
    )}</p>`,
    'faq chiens',
  );

  return output;
}

function patchApp(app) {
  let output = bumpAssetVersions(app);
  const currentSelector = 'script, style, textarea, select, #admin-view, .language-switcher';
  const patchedSelector = 'script, style, textarea, select, #admin-view, .language-switcher, [data-static-i18n-v128]';
  if (!output.includes(patchedSelector)) {
    if (!output.includes(currentSelector)) throw new Error('Sélecteur i18n introuvable pour v128');
    output = output.replace(currentSelector, patchedSelector);
  }
  return output;
}

function patchStyles(css) {
  if (css.includes('multilingual-static-v128')) return css;
  return `${css.trimEnd()}

/* multilingual-static-v128 */
[data-static-i18n-v128] [data-lang-static] { display: none; }
html:not([lang]) [data-static-i18n-v128] [data-lang-static="fr"],
html[lang^="fr"] [data-static-i18n-v128] [data-lang-static="fr"],
html[lang^="en"] [data-static-i18n-v128] [data-lang-static="en"],
html[lang^="nl"] [data-static-i18n-v128] [data-lang-static="nl"] { display: inline; }
`;
}

function patchServiceWorker(worker) {
  return bumpAssetVersions(worker).replace(/escape-erezee-v\d+/g, `escape-erezee-v${VERSION}`);
}

await patchTextFile('index.html', patchIndex);
await patchTextFile('app.js', patchApp);
await patchTextFile('styles.css', patchStyles);
await patchTextFile('service-worker.js', patchServiceWorker);

console.log(`Multilingual static home v${VERSION} applied.`);
