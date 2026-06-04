import { readFile, writeFile } from 'node:fs/promises';

const VERSION = 119;

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

/* multilingual-v119 */
(function installStaticFallbacksV119() {
  if (window.__escapeI18nStaticFallbacksV119) return;
  window.__escapeI18nStaticFallbacksV119 = true;

  const fallbackTranslationsV119 = {
    fr: {
      'Home': 'Accueil',
      'Shop': 'Boutique',
      'Play': 'Jouer',
      'Admin': 'Gestion',
      'Outdoor escape game in Erezée': 'Escape game extérieur à Erezée',
      'A life-size adventure in the heart of the region': 'Une aventure grandeur nature au cœur de la région',
      'An outdoor puzzle adventure': 'Un jeu d’énigmes qui se vit dehors',
      'Explore Erezée as a team, move from place to place with the map, unlock the puzzles on site and try to finish the route before the timer runs out.': 'Explorez Erezée en équipe, avancez de lieu en lieu grâce à la carte, débloquez les énigmes sur place et tentez de terminer le parcours avant la fin du chrono.',
      'Each route takes you around Erezée through a series of real places to reach. Once you are in the right area, the app unlocks the next puzzle: written answer, observation, photo or clue to use at the right moment.': 'Chaque parcours vous emmène dans les environs d’Erezée avec une suite d’étapes à rejoindre réellement. Une fois dans la bonne zone, l’application débloque l’énigme suivante: réponse écrite, observation, photo ou indice à utiliser au bon moment.'
    },
    en: {
      'Explorez Erezée en équipe, avancez de lieu en lieu grâce à la carte, débloquez les énigmes sur place et tentez de terminer le parcours avant la fin du chrono.': 'Explore Erezée as a team, move from place to place with the map, unlock the puzzles on site and try to finish the route before the timer runs out.',
      'Chaque parcours vous emmène dans les environs d’Erezée avec une suite d’étapes à rejoindre réellement. Une fois dans la bonne zone, l’application débloque l’énigme suivante: réponse écrite, observation, photo ou indice à utiliser au bon moment.': 'Each route takes you around Erezée through a series of real places to reach. Once you are in the right area, the app unlocks the next puzzle: written answer, observation, photo or clue to use at the right moment.'
    },
    nl: {
      'Accueil': 'Startpagina',
      'Boutique': 'Shop',
      'Jouer': 'Spelen',
      'Gestion': 'Beheer',
      'Home': 'Startpagina',
      'Shop': 'Shop',
      'Play': 'Spelen',
      'Admin': 'Beheer',
      'Outdoor escape game in Erezée': 'Outdoor escape game in Erezée',
      'A life-size adventure in the heart of the region': 'Een levensecht avontuur in het hart van de streek',
      'An outdoor puzzle adventure': 'Een puzzelspel in de buitenlucht',
      'Explorez Erezée en équipe, avancez de lieu en lieu grâce à la carte, débloquez les énigmes sur place et tentez de terminer le parcours avant la fin du chrono.': 'Verken Erezée in team, ga met de kaart van plek naar plek, ontgrendel de raadsels ter plaatse en probeer de route te voltooien voor de tijd om is.',
      'Chaque parcours vous emmène dans les environs d’Erezée avec une suite d’étapes à rejoindre réellement. Une fois dans la bonne zone, l’application débloque l’énigme suivante: réponse écrite, observation, photo ou indice à utiliser au bon moment.': 'Elke route neemt je mee rond Erezée via echte plekken die je moet bereiken. Zodra je in de juiste zone bent, ontgrendelt de app het volgende raadsel: geschreven antwoord, observatie, foto of aanwijzing op het juiste moment.',
      'Explore Erezée as a team, move from place to place with the map, unlock the puzzles on site and try to finish the route before the timer runs out.': 'Verken Erezée in team, ga met de kaart van plek naar plek, ontgrendel de raadsels ter plaatse en probeer de route te voltooien voor de tijd om is.',
      'Each route takes you around Erezée through a series of real places to reach. Once you are in the right area, the app unlocks the next puzzle: written answer, observation, photo or clue to use at the right moment.': 'Elke route neemt je mee rond Erezée via echte plekken die je moet bereiken. Zodra je in de juiste zone bent, ontgrendelt de app het volgende raadsel: geschreven antwoord, observatie, foto of aanwijzing op het juiste moment.'
    }
  };

  const previousTranslateTextV119 = typeof escapeI18nTranslateText === 'function' ? escapeI18nTranslateText : null;
  if (!previousTranslateTextV119) return;

  escapeI18nTranslateText = function escapeI18nTranslateTextV119(text) {
    const translated = previousTranslateTextV119.call(this, text);
    if (translated && translated !== text) return translated;
    const lang = typeof escapeI18nLanguage === 'function' ? escapeI18nLanguage() : 'fr';
    return fallbackTranslationsV119[lang]?.[text] || translated || '';
  };

  window.setTimeout(() => {
    if (typeof escapeI18nApplyDom === 'function') escapeI18nApplyDom();
  }, 0);
})();
`;

function patchApp(app) {
  if (app.includes('multilingual-v119')) return bumpAssetVersions(app);
  if (!app.includes('multilingual-v118') || !app.includes('function installCanonicalTranslationsV118')) {
    throw new Error(`Patch v${VERSION} introuvable: multilingual-v118 requis`);
  }
  return `${bumpAssetVersions(app).trimEnd()}${APP_PATCH}\n`;
}

function patchServiceWorker(worker) {
  return bumpAssetVersions(worker).replace(/escape-erezee-v\d+/g, `escape-erezee-v${VERSION}`);
}

await patchTextFile('app.js', patchApp);
await patchTextFile('index.html', bumpAssetVersions);
await patchTextFile('service-worker.js', patchServiceWorker);

console.log(`Multilingual static fallbacks v${VERSION} applied.`);
