import { readFile, writeFile } from 'node:fs/promises';

const VERSION = 147;
const FILES = [
  'server.mjs',
  'app.js',
  'blog/index.html',
  'blog/activite-enfant-erezee.html',
  'blog/escape-game-pres-de-durbuy.html',
  'blog/week-end-famille-ardenne.html',
  'blog/idee-sortie-groupe-ardenne.html',
  'escape-game-exterieur-ardenne.html',
  'activite-famille-ardenne.html',
  'chasse-au-tresor-ardenne.html',
  'activite-touristique-erezee.html',
  'activite-pres-de-durbuy.html',
];

const REPLACEMENTS = [
  ['/assets/balises-blier-cover.png', `/assets/home-hero-ardenne-v88.jpg?v=${VERSION}`],
  ['/assets/sur-les-traces-du-vicinal-cover.png', `/assets/home-hero-vicinal-v90.jpg?v=${VERSION}`],
];

let patched = 0;
for (const file of FILES) {
  let input;
  try {
    input = await readFile(file, 'utf8');
  } catch (error) {
    if (error.code === 'ENOENT') continue;
    throw error;
  }

  let output = input;
  for (const [from, to] of REPLACEMENTS) {
    output = output.replaceAll(from, to);
  }

  if (output !== input) {
    await writeFile(file, output, 'utf8');
    patched += 1;
  }
}

console.log(`Growth image fallback v${VERSION} applied to ${patched} file(s).`);
