import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';

const VERSION = 160;
const ASSET_VERSION = 158;
const DATA_DIR = globalThis.process?.env?.DATA_DIR || 'data';
const DATA_FILE = `${DATA_DIR.replace(/\/$/, '')}/escape-data.json`;

const IMAGES = [
  `/assets/seo/escape-game-ardenne-v${ASSET_VERSION}.svg?v=${ASSET_VERSION}`,
  `/assets/seo/activite-famille-ardenne-v${ASSET_VERSION}.svg?v=${ASSET_VERSION}`,
  `/assets/seo/chasse-tresor-ardenne-v${ASSET_VERSION}.svg?v=${ASSET_VERSION}`,
  `/assets/seo/activite-touristique-erezee-v${ASSET_VERSION}.svg?v=${ASSET_VERSION}`,
  `/assets/seo/activite-pres-durbuy-v${ASSET_VERSION}.svg?v=${ASSET_VERSION}`,
  `/assets/seo/blog-ardenne-v${ASSET_VERSION}.svg?v=${ASSET_VERSION}`,
];

const FILES = [
  'index.html',
  'suivi.html',
  'escape-game-exterieur-ardenne.html',
  'activite-famille-ardenne.html',
  'chasse-au-tresor-ardenne.html',
  'activite-touristique-erezee.html',
  'activite-pres-de-durbuy.html',
  'blog/index.html',
  'blog/que-faire-a-erezee.html',
  'blog/que-faire-pres-de-durbuy.html',
  'blog/activites-familiales-ardenne-belge.html',
  'blog/top-10-activites-exterieures-ardenne.html',
  'blog/que-faire-vacances-ardenne.html',
  'blog/activite-enfant-erezee.html',
  'blog/escape-game-pres-de-durbuy.html',
  'blog/week-end-famille-ardenne.html',
  'blog/idee-sortie-groupe-ardenne.html',
  'parcours/la-lettre-de-la-dame-de-soy.html',
  'parcours/sur-les-traces-du-vicinal.html',
  'parcours/les-balises-perdues-de-blier.html',
  'server.mjs',
  'styles.css',
  'seo-pages.css',
  'service-worker.js',
];

const FINAL_HINT_TRANSLATIONS = {
  'route-carnet-val-aisne': {
    'puzzle-carnet-aisne-04-bruyere': {
      en: 'In the phrase "heather on the mountain", keep only the plant name.',
      nl: 'In de uitdrukking "heide op de berg", behoud alleen de naam van de plant.',
    },
    'puzzle-carnet-aisne-06-vicinal': {
      en: 'It is often used for old Belgian rural tramways.',
      nl: 'Het wordt vaak gebruikt voor de oude Belgische buurttrams op het platteland.',
    },
    'puzzle-carnet-aisne-08-bief': {
      en: 'Look for the miller’s technical water-channel word: four letters, beginning with B.',
      nl: 'Zoek het technische woord voor het waterkanaal van de molenaar: vier letters, begint met B.',
    },
    'puzzle-carnet-aisne-17-latin': {
      en: 'The phrase begins with ILLIBATAM and ends with PRAEDICANT.',
      nl: 'De formule begint met ILLIBATAM en eindigt met PRAEDICANT.',
    },
  },
};

async function readOptional(path) {
  try {
    return await readFile(path, 'utf8');
  } catch (error) {
    if (error.code === 'ENOENT') return null;
    throw error;
  }
}

function replaceAll(text, from, to) {
  return text.split(from).join(to);
}

function cleanImageUrls(text) {
  let next = text;
  for (const image of IMAGES) {
    for (let suffix = 0; suffix <= 999; suffix += 1) {
      next = replaceAll(next, `${image}${suffix}`, image);
      next = replaceAll(next, `${image}?v=${suffix}`, image);
    }
  }
  return next;
}

function bumpVersions(text) {
  let next = text;
  for (let version = 1; version <= VERSION; version += 1) {
    next = replaceAll(next, `styles.css?v=${version}`, `styles.css?v=${VERSION}`);
    next = replaceAll(next, `app.js?v=${version}`, `app.js?v=${VERSION}`);
    next = replaceAll(next, `seo-pages.css?v=${version}`, `seo-pages.css?v=${VERSION}`);
    next = replaceAll(next, `escape-erezee-v${version}`, `escape-erezee-v${VERSION}`);
  }
  return next;
}

async function completeFinalRouteTranslations() {
  const input = await readOptional(DATA_FILE);
  if (input === null) return 0;

  const data = JSON.parse(input);
  if (!Array.isArray(data?.routes)) return 0;

  let patched = 0;
  for (const route of data.routes) {
    const routeHints = FINAL_HINT_TRANSLATIONS[route.id];
    if (!routeHints || !Array.isArray(route.puzzles)) continue;

    for (const puzzle of route.puzzles) {
      const translations = routeHints[puzzle.id];
      if (!translations) continue;

      for (const lang of ['en', 'nl']) {
        puzzle.i18n ||= {};
        puzzle.i18n[lang] ||= {};
        const hints = Array.isArray(puzzle.i18n[lang].hints)
          ? [...puzzle.i18n[lang].hints]
          : [];

        if (!hints[3]) {
          while (hints.length < 3) hints.push('');
          hints[3] = translations[lang];
          puzzle.i18n[lang].hints = hints;
          patched += 1;
        }
      }
    }
  }

  if (patched) {
    await mkdir(DATA_DIR, { recursive: true });
    const tempFile = `${DATA_FILE}.i18n-v162.tmp`;
    await writeFile(tempFile, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
    await rename(tempFile, DATA_FILE);
  }

  return patched;
}

let patched = 0;
for (const file of FILES) {
  const input = await readOptional(file);
  if (input === null) continue;
  const output = bumpVersions(cleanImageUrls(input));
  if (output !== input) {
    await writeFile(file, output, 'utf8');
    patched += 1;
  }
}

const translationPatches = await completeFinalRouteTranslations();
console.log(`Optimized SEO image bank URL cleanup v${VERSION} applied to ${patched} file(s).`);
console.log(`Final EN/NL route content migration v162 applied to ${translationPatches} field(s).`);
