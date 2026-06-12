import { readFile, writeFile } from 'node:fs/promises';

const VERSION = 161;
const ASSET_VERSION = 158;

const I = {
  escapeGame: `/assets/seo/escape-game-ardenne-v${ASSET_VERSION}.svg?v=${ASSET_VERSION}`,
  chasse: `/assets/seo/chasse-tresor-ardenne-v${ASSET_VERSION}.svg?v=${ASSET_VERSION}`,
  durbuy: `/assets/seo/activite-pres-durbuy-v${ASSET_VERSION}.svg?v=${ASSET_VERSION}`,
};

const ROUTE_IMAGE_FUNCTION = [
  'function getRouteSeoImage(route, origin) {',
  '  const searchable = compactText([route?.id, route?.slug, route?.title, route?.publicPath].filter(Boolean).join(" ")).toLowerCase();',
  `  let imagePath = '${I.escapeGame}';`,
  `  if (searchable.includes('vicinal')) imagePath = '${I.durbuy}';`,
  `  if (searchable.includes('balises') || searchable.includes('blier')) imagePath = '${I.chasse}';`,
  `  if (searchable.includes('dame') || searchable.includes('soy') || searchable.includes('lettre')) imagePath = '${I.escapeGame}';`,
  '  return origin + imagePath;',
  '}',
].join('\n');

function replaceFunction(source, functionName, replacement) {
  const start = source.indexOf(`function ${functionName}(`);
  if (start === -1) return source;
  const bodyStart = source.indexOf('{', start);
  if (bodyStart === -1) return source;
  let depth = 0;
  for (let index = bodyStart; index < source.length; index += 1) {
    const char = source[index];
    if (char === '{') depth += 1;
    if (char === '}') depth -= 1;
    if (depth === 0) return `${source.slice(0, start)}${replacement}${source.slice(index + 1)}`;
  }
  return source;
}

function patchRouteSeoPageImage(server) {
  let next = server;
  const imageInsertionNeedle = '        <p>${escapeHtml(description)}</p>\n        <div class="actions">';
  const imageInsertion = '        <p>${escapeHtml(description)}</p>\n        <img src="${escapeHtml(image)}" alt="" loading="eager" decoding="async" fetchpriority="high" />\n        <div class="actions">';
  if (!next.includes('fetchpriority="high" />\n        <div class="actions">')) {
    next = next.split(imageInsertionNeedle).join(imageInsertion);
  }

  const cssNeedle = '      p, li { font-size: 1.04rem; line-height: 1.65; }\n      .facts {';
  const cssInsertion = '      p, li { font-size: 1.04rem; line-height: 1.65; }\n      img { display: block; width: 100%; max-height: 430px; object-fit: cover; border-radius: 8px; margin: 22px 0; box-shadow: 0 18px 40px rgba(10, 35, 29, 0.13); }\n      .facts {';
  if (!next.includes('max-height: 430px; object-fit: cover; border-radius: 8px; margin: 22px 0;')) {
    next = next.split(cssNeedle).join(cssInsertion);
  }
  return next;
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

const input = await readFile('server.mjs', 'utf8');
let output = replaceFunction(input, 'getRouteSeoImage', ROUTE_IMAGE_FUNCTION);
output = patchRouteSeoPageImage(output);
output = bumpVersions(output);
if (output !== input) await writeFile('server.mjs', output, 'utf8');
console.log(`Route SEO images v${VERSION} applied.`);
