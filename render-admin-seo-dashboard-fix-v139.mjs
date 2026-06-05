import { readFile, writeFile } from 'node:fs/promises';

const VERSION = 139;

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

function findBlockEnd(input, start) {
  const bodyStart = input.indexOf('{', start);
  if (bodyStart < 0) return -1;
  let depth = 0;
  let quote = null;
  let escaped = false;
  for (let index = bodyStart; index < input.length; index += 1) {
    const char = input[index];
    if (quote) {
      if (escaped) escaped = false;
      else if (char === '\\') escaped = true;
      else if (char === quote) quote = null;
      continue;
    }
    if (char === '"' || char === "'" || char === '`') {
      quote = char;
      continue;
    }
    if (char === '{') depth += 1;
    if (char === '}') {
      depth -= 1;
      if (depth === 0) return index + 1;
    }
  }
  return -1;
}

function replaceBlock(input, signature, replacement) {
  const start = input.indexOf(signature);
  if (start < 0) throw new Error(`Patch v${VERSION} introuvable: ${signature}`);
  const end = findBlockEnd(input, start);
  if (end < 0) throw new Error(`Patch v${VERSION} impossible: ${signature}`);
  return `${input.slice(0, start)}${replacement}${input.slice(end)}`;
}

async function buildSeoDashboardV138() {
  const checks = await Promise.all([
    publicCheckV138('Accueil', '', ['Escape']),
    publicCheckV138('Escape game exterieur Ardenne', 'escape-game-exterieur-ardenne.html', ['Escape game']),
    publicCheckV138('Activite famille Ardenne', 'activite-famille-ardenne.html', ['Activite famille']),
    publicCheckV138('Chasse au tresor Ardenne', 'chasse-au-tresor-ardenne.html', ['Chasse']),
    publicCheckV138('Activite touristique Erezee', 'activite-touristique-erezee.html', ['Erezee']),
    publicCheckV138('Activite pres de Durbuy', 'activite-pres-de-durbuy.html', ['Durbuy']),
    publicCheckV138('Blog', 'blog/', ['Que faire']),
    publicCheckV138('Sitemap', 'sitemap.xml', ['escape-erezee.be']),
    publicCheckV138('Robots', 'robots.txt', ['Sitemap:']),
  ]);
  return {
    ok: checks.every((check) => check.status === 'ok'),
    checkedAt: Date.now(),
    checks,
    nextActions: [
      'Ajouter regulierement des photos locales et avis clients.',
      'Publier un article blog utile par mois.',
      'Controler Search Console apres chaque nouvelle page importante.',
    ],
  };
}

function patchServer(server) {
  return replaceBlock(server, 'async function buildSeoDashboardV138', buildSeoDashboardV138.toString());
}

function patchServiceWorker(worker) {
  return bumpAssetVersions(worker).replace(/escape-erezee-v\d+/g, `escape-erezee-v${VERSION}`);
}

await patchTextFile('server.mjs', patchServer);
await patchTextFile('app.js', bumpAssetVersions);
await patchTextFile('styles.css', bumpAssetVersions);
await patchTextFile('index.html', bumpAssetVersions);
await patchTextFile('suivi.html', bumpAssetVersions);
await patchTextFile('service-worker.js', patchServiceWorker);

console.log(`Admin SEO dashboard fix v${VERSION} applied.`);
