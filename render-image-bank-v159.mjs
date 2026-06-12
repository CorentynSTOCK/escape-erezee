import { readFile, writeFile } from 'node:fs/promises';

const VERSION = 159;
const ORIGIN = 'https://escape-erezee.be';
const ASSET_VERSION = 158;

const I = {
  escapeGame: `/assets/seo/escape-game-ardenne-v${ASSET_VERSION}.svg?v=${ASSET_VERSION}`,
  famille: `/assets/seo/activite-famille-ardenne-v${ASSET_VERSION}.svg?v=${ASSET_VERSION}`,
  chasse: `/assets/seo/chasse-tresor-ardenne-v${ASSET_VERSION}.svg?v=${ASSET_VERSION}`,
  erezee: `/assets/seo/activite-touristique-erezee-v${ASSET_VERSION}.svg?v=${ASSET_VERSION}`,
  durbuy: `/assets/seo/activite-pres-durbuy-v${ASSET_VERSION}.svg?v=${ASSET_VERSION}`,
  blog: `/assets/seo/blog-ardenne-v${ASSET_VERSION}.svg?v=${ASSET_VERSION}`,
};

const PAGE_IMAGES = {
  'escape-game-exterieur-ardenne.html': I.escapeGame,
  'activite-famille-ardenne.html': I.famille,
  'chasse-au-tresor-ardenne.html': I.chasse,
  'activite-touristique-erezee.html': I.erezee,
  'activite-pres-de-durbuy.html': I.durbuy,
  'blog/index.html': I.blog,
  'blog/que-faire-a-erezee.html': I.erezee,
  'blog/que-faire-pres-de-durbuy.html': I.durbuy,
  'blog/activites-familiales-ardenne-belge.html': I.famille,
  'blog/top-10-activites-exterieures-ardenne.html': I.blog,
  'blog/que-faire-vacances-ardenne.html': I.chasse,
  'blog/activite-enfant-erezee.html': I.famille,
  'blog/escape-game-pres-de-durbuy.html': I.escapeGame,
  'blog/week-end-famille-ardenne.html': I.blog,
  'blog/idee-sortie-groupe-ardenne.html': I.chasse,
  'parcours/la-lettre-de-la-dame-de-soy.html': I.escapeGame,
  'parcours/sur-les-traces-du-vicinal.html': I.durbuy,
  'parcours/les-balises-perdues-de-blier.html': I.chasse,
};

const LEGACY_BASES = [
  'home-hero-vicinal-v90.jpg',
  'home-hero-vicinal-v90-small.jpg',
  'home-hero-ardenne-v88.jpg',
  'lettre-dame-soy-cover.png',
  'sur-les-traces-du-vicinal-cover.png',
  'balises-blier-cover.png',
];

const FALLBACK_SCRIPT = `<script id="image-bank-v${VERSION}">
(function () {
  var fallback = "${I.blog}";
  document.addEventListener("error", function (event) {
    var img = event.target;
    if (!img || img.tagName !== "IMG" || img.dataset.imageBankFallback === "1") return;
    var src = img.currentSrc || img.getAttribute("src") || "";
    if (!src || src.indexOf("data:") === 0 || src.indexOf("tile.openstreetmap.org") !== -1) return;
    if (src.indexOf("assets/") === -1) return;
    img.dataset.imageBankFallback = "1";
    img.classList.add("image-bank-fallback");
    img.src = fallback;
  }, true);
})();
</script>`;

async function readOptional(path) {
  try {
    return await readFile(path, 'utf8');
  } catch (error) {
    if (error.code === 'ENOENT') return null;
    throw error;
  }
}

async function patchOptional(path, patcher) {
  const input = await readOptional(path);
  if (input === null) return false;
  const output = patcher(input, path);
  if (output !== input) {
    await writeFile(path, output, 'utf8');
    return true;
  }
  return false;
}

function replaceAll(text, from, to) {
  return text.split(from).join(to);
}

function absolute(path) {
  return `${ORIGIN}${path}`;
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

function replaceLegacyImages(text, imagePath, bases = LEGACY_BASES) {
  let next = text;
  for (const base of bases) {
    for (let version = 1; version <= VERSION; version += 1) {
      next = replaceAll(next, `${ORIGIN}/assets/${base}?v=${version}`, absolute(imagePath));
      next = replaceAll(next, `/assets/${base}?v=${version}`, imagePath);
      next = replaceAll(next, `assets/${base}?v=${version}`, imagePath.slice(1));
    }
    next = replaceAll(next, `${ORIGIN}/assets/${base}`, absolute(imagePath));
    next = replaceAll(next, `/assets/${base}`, imagePath);
    next = replaceAll(next, `assets/${base}`, imagePath.slice(1));
  }
  return next;
}

function addFallbackScript(html) {
  if (!html.includes('</body>') || html.includes(`image-bank-v${VERSION}`)) return html;
  return html.replace('</body>', `  ${FALLBACK_SCRIPT}\n  </body>`);
}

function patchPublicHtml(html, path) {
  const imagePath = PAGE_IMAGES[path];
  let next = bumpVersions(html);
  if (imagePath) next = replaceLegacyImages(next, imagePath);
  return addFallbackScript(next);
}

function patchServer(server) {
  let next = bumpVersions(server);
  next = replaceLegacyImages(next, I.durbuy, ['home-hero-vicinal-v90.jpg', 'home-hero-vicinal-v90-small.jpg', 'sur-les-traces-du-vicinal-cover.png']);
  next = replaceLegacyImages(next, I.erezee, ['home-hero-ardenne-v88.jpg']);
  next = replaceLegacyImages(next, I.escapeGame, ['lettre-dame-soy-cover.png']);
  next = replaceLegacyImages(next, I.chasse, ['balises-blier-cover.png']);
  return next;
}

function patchCss(css) {
  const marker = `/* image-bank-v${VERSION} */`;
  let next = bumpVersions(css);
  if (!next.includes(marker)) {
    next = `${next.trimEnd()}\n\n${marker}\n.image-bank-fallback {\n  background: #eef5f1;\n  object-fit: cover;\n}\n`;
  }
  return next;
}

let patched = 0;
for (const file of Object.keys(PAGE_IMAGES)) {
  if (await patchOptional(file, patchPublicHtml)) patched += 1;
}
if (await patchOptional('server.mjs', patchServer)) patched += 1;
if (await patchOptional('styles.css', patchCss)) patched += 1;
if (await patchOptional('seo-pages.css', patchCss)) patched += 1;
if (await patchOptional('service-worker.js', bumpVersions)) patched += 1;
console.log(`Optimized SEO image bank v${VERSION} applied to ${patched} file(s).`);
