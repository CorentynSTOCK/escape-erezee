import { readFile, writeFile } from 'node:fs/promises';

const VERSION = 169;
const TRACKED_QUERIES = [
  'escape game exterieur Ardenne',
  'activite famille Ardenne',
  'chasse au tresor Ardenne',
  'activite touristique Erezee',
  'activite pres de Durbuy',
  'escape game pres de Durbuy',
  'activite enfant Erezee',
  'week-end famille Ardenne',
  'chasse au tresor famille Ardenne',
  'sortie groupe Ardenne',
];

async function patchOptional(filePath, patcher) {
  try {
    const input = await readFile(filePath, 'utf8');
    const output = patcher(input);
    if (output !== input) await writeFile(filePath, output, 'utf8');
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
}

function bumpVersions(text) {
  let next = text;
  for (let version = 1; version <= VERSION; version += 1) {
    next = next.split(`styles.css?v=${version}`).join(`styles.css?v=${VERSION}`);
    next = next.split(`app.js?v=${version}`).join(`app.js?v=${VERSION}`);
    next = next.split(`seo-pages.css?v=${version}`).join(`seo-pages.css?v=${VERSION}`);
    next = next.split(`escape-erezee-v${version}`).join(`escape-erezee-v${VERSION}`);
  }
  return next;
}

function patchServer(server) {
  let next = bumpVersions(server);
  const start = next.indexOf('    trackedQueries: [');
  if (start === -1) return next;
  const end = next.indexOf('    ],', start);
  if (end === -1) return next;
  const block = [
    '    trackedQueries: [',
    ...TRACKED_QUERIES.map((query) => `      '${query}',`),
    '    ],',
  ].join('\n');
  return `${next.slice(0, start)}${block}${next.slice(end + '    ],'.length)}`;
}

await patchOptional('server.mjs', patchServer);
for (const file of ['index.html', 'suivi.html', 'app.js', 'styles.css', 'seo-pages.css', 'service-worker.js']) {
  await patchOptional(file, bumpVersions);
}

console.log(`SEO continuous cleanup v${VERSION} applied.`);
