import { readFile, writeFile } from 'node:fs/promises';

const VERSION = 129;
const ORIGIN = 'https://escape-erezee.be';

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

function patchHead(html) {
  let output = bumpAssetVersions(html).replace('<html lang="fr">', '<html lang="fr-BE">');
  output = output.replace(/\n\s*<meta name="content-language"[^>]*>/g, '');
  output = output.replace(/\n\s*<link rel="alternate" hreflang="[^"]+"[^>]*>/g, '');
  output = output.replace(/\n\s*<meta property="og:locale[^>]*>/g, '');

  const hreflangBlock = `    <meta name="content-language" content="fr-BE, en, nl" />
    <link rel="alternate" hreflang="fr-BE" href="${ORIGIN}/" />
    <link rel="alternate" hreflang="en" href="${ORIGIN}/?lang=en" />
    <link rel="alternate" hreflang="nl" href="${ORIGIN}/?lang=nl" />
    <link rel="alternate" hreflang="x-default" href="${ORIGIN}/" />
    <meta property="og:locale" content="fr_BE" />
    <meta property="og:locale:alternate" content="en_GB" />
    <meta property="og:locale:alternate" content="nl_BE" />`;

  if (!output.includes('<link rel="canonical" href="https://escape-erezee.be/" />')) {
    throw new Error('Balise canonical introuvable pour hreflang v129');
  }
  return output.replace(
    '    <link rel="canonical" href="https://escape-erezee.be/" />',
    `    <link rel="canonical" href="https://escape-erezee.be/" />\n${hreflangBlock}`,
  );
}

function patchServiceWorker(worker) {
  return bumpAssetVersions(worker).replace(/escape-erezee-v\d+/g, `escape-erezee-v${VERSION}`);
}

await patchTextFile('index.html', patchHead);
await patchTextFile('service-worker.js', patchServiceWorker);

console.log(`SEO hreflang home v${VERSION} applied.`);
