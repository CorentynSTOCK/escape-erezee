import { readFile, writeFile } from 'node:fs/promises';

const VERSION = 160;
const ASSET_VERSION = 158;

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

console.log(`Optimized SEO image bank URL cleanup v${VERSION} applied to ${patched} file(s).`);
