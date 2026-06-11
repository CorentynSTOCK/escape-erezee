import { readFile, writeFile } from 'node:fs/promises';

const VERSION = 157;
const FALLBACK_IMAGE = `/assets/home-hero-vicinal-v90-small.jpg?v=${VERSION}`;

const SAFE_IMAGES = {
  ardenne: `/assets/home-hero-ardenne-v88-q62.jpg?v=${VERSION}`,
  carnet: `/assets/carnet-val-aisne-cover.png?v=${VERSION}`,
  lettre: `/assets/lettre-dame-soy-cover.png?v=${VERSION}`,
  logo: `/assets/logo-stock-sevrin-v90.jpg?v=${VERSION}`,
  serment: `/assets/serment-blier-cover.png?v=${VERSION}`,
  vicinal: `/assets/home-hero-vicinal-v90.jpg?v=${VERSION}`,
  vicinalSmall: FALLBACK_IMAGE,
};

const PUBLIC_FILES = [
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
];

const PREFERRED_PAGE_IMAGES = new Map([
  ['escape-game-exterieur-ardenne.html', SAFE_IMAGES.lettre],
  ['activite-famille-ardenne.html', SAFE_IMAGES.serment],
  ['chasse-au-tresor-ardenne.html', SAFE_IMAGES.carnet],
  ['activite-touristique-erezee.html', SAFE_IMAGES.ardenne],
  ['activite-pres-de-durbuy.html', SAFE_IMAGES.vicinal],
  ['blog/index.html', SAFE_IMAGES.vicinal],
  ['blog/que-faire-a-erezee.html', SAFE_IMAGES.lettre],
  ['blog/que-faire-pres-de-durbuy.html', SAFE_IMAGES.vicinal],
  ['blog/activites-familiales-ardenne-belge.html', SAFE_IMAGES.serment],
  ['blog/top-10-activites-exterieures-ardenne.html', SAFE_IMAGES.carnet],
  ['blog/que-faire-vacances-ardenne.html', SAFE_IMAGES.ardenne],
  ['blog/activite-enfant-erezee.html', SAFE_IMAGES.serment],
  ['blog/escape-game-pres-de-durbuy.html', SAFE_IMAGES.vicinal],
  ['blog/week-end-famille-ardenne.html', SAFE_IMAGES.lettre],
  ['blog/idee-sortie-groupe-ardenne.html', SAFE_IMAGES.carnet],
  ['parcours/la-lettre-de-la-dame-de-soy.html', SAFE_IMAGES.lettre],
  ['parcours/sur-les-traces-du-vicinal.html', SAFE_IMAGES.vicinal],
  ['parcours/les-balises-perdues-de-blier.html', SAFE_IMAGES.ardenne],
]);

const STATIC_FALLBACK_SCRIPT = `<script id="image-health-v${VERSION}">
(function () {
  var fallback = "${FALLBACK_IMAGE}";
  function applyFallback(img) {
    if (!img || img.dataset.imageHealthFallback === "1") return;
    var src = img.currentSrc || img.getAttribute("src") || "";
    if (!src || src.indexOf("data:") === 0 || src.indexOf("tile.openstreetmap.org") !== -1) return;
    img.dataset.imageHealthFallback = "1";
    img.classList.add("image-fallback-applied");
    img.src = fallback;
  }
  document.addEventListener("error", function (event) {
    if (event.target && event.target.tagName === "IMG") applyFallback(event.target);
  }, true);
})();
</script>`;

async function readOptional(filePath) {
  try {
    return await readFile(filePath, 'utf8');
  } catch (error) {
    if (error.code === 'ENOENT') return null;
    throw error;
  }
}

async function patchOptional(filePath, patcher) {
  const input = await readOptional(filePath);
  if (input === null) return false;
  const output = patcher(input, filePath);
  if (output !== input) {
    await writeFile(filePath, output, 'utf8');
    return true;
  }
  return false;
}

function withVersionBump(text) {
  return text
    .replace(/styles\.css\?v=\d+/g, `styles.css?v=${VERSION}`)
    .replace(/app\.js\?v=\d+/g, `app.js?v=${VERSION}`)
    .replace(/seo-pages\.css\?v=\d+/g, `seo-pages.css?v=${VERSION}`)
    .replace(/escape-erezee-v\d+/g, `escape-erezee-v${VERSION}`);
}

function normalizeAssetUrls(text) {
  return text
    .replace(/\/assets\/home-hero-ardenne-v88\.jpg\?v=\d+/g, SAFE_IMAGES.ardenne)
    .replace(/assets\/home-hero-ardenne-v88\.jpg\?v=\d+/g, SAFE_IMAGES.ardenne.slice(1))
    .replace(/\/assets\/home-hero-vicinal-v90\.jpg\?v=\d+/g, SAFE_IMAGES.vicinal)
    .replace(/assets\/home-hero-vicinal-v90\.jpg\?v=\d+/g, SAFE_IMAGES.vicinal.slice(1))
    .replace(/\/assets\/logo-escape\.jpg\?v=\d+/g, SAFE_IMAGES.logo)
    .replace(/assets\/logo-escape\.jpg\?v=\d+/g, SAFE_IMAGES.logo.slice(1))
    .replace(/\/assets\/logo-stock-sevrin-v90\.jpg\?v=\d+/g, SAFE_IMAGES.logo)
    .replace(/assets\/logo-stock-sevrin-v90\.jpg\?v=\d+/g, SAFE_IMAGES.logo.slice(1));
}

function replaceFirstImageInBlock(html, blockClass, image) {
  const pattern = new RegExp(`(<[^>]+class=["'][^"']*${blockClass}[^"']*["'][\\s\\S]*?<img\\b[^>]*?\\bsrc=["'])[^"']+(["'][^>]*>)`, 'i');
  return html.replace(pattern, `$1${image}$2`);
}

function patchMetaImages(html, image) {
  const absolute = `https://escape-erezee.be${image}`;
  return html.replace(/(<meta\s+(?:property|name)=["'](?:og:image|twitter:image)["']\s+content=["'])[^"']+(["'][^>]*>)/gi, `$1${absolute}$2`);
}

function addStaticImageFallbackScript(html) {
  if (!html.includes('</body>') || html.includes(`image-health-v${VERSION}`)) return html;
  return html.replace('</body>', `  ${STATIC_FALLBACK_SCRIPT}\n  </body>`);
}

function addImageTagSafety(html) {
  return html.replace(/<img\b[^>]*>/g, (tag) => {
    let next = tag;
    if (!/\bdecoding=/.test(next)) next = next.replace(/\s*\/?>$/, ' decoding="async"$&');
    if (!/\bloading=/.test(next) && !/\bclass=["'][^"']*brand-logo/.test(next)) {
      next = next.replace(/\s*\/?>$/, ' loading="lazy"$&');
    }
    return next;
  });
}

function patchPublicHtml(html, filePath) {
  const preferred = PREFERRED_PAGE_IMAGES.get(filePath);
  let next = withVersionBump(normalizeAssetUrls(html));

  if (preferred) {
    next = replaceFirstImageInBlock(next, 'hero', preferred);
    next = replaceFirstImageInBlock(next, 'article', preferred);
    next = patchMetaImages(next, preferred);
  }

  next = addImageTagSafety(next);
  next = addStaticImageFallbackScript(next);
  return next;
}

function patchApp(app) {
  let next = withVersionBump(app);
  if (!next.includes('function setupImageHealthV157')) {
    const helper = `
const IMAGE_FALLBACK_V157 = "assets/home-hero-vicinal-v90-small.jpg?v=${VERSION}";

function setupImageHealthV157() {
  if (window.__escapeImageHealthV157) return;
  window.__escapeImageHealthV157 = true;
  document.addEventListener("error", (event) => {
    const img = event.target;
    if (!(img instanceof HTMLImageElement)) return;
    const src = img.currentSrc || img.getAttribute("src") || "";
    if (!src || src.startsWith("data:") || src.includes("tile.openstreetmap.org")) return;
    if (!src.includes("assets/") || img.dataset.imageHealthFallback === "1") return;
    img.dataset.imageHealthFallback = "1";
    img.classList.add("image-fallback-applied");
    img.src = IMAGE_FALLBACK_V157;
  }, true);
}
`;
    next = next.replace('function bindEvents() {', `${helper}\nfunction bindEvents() {`);
    next = next.replace('function bindEvents() {\n', 'function bindEvents() {\n  setupImageHealthV157();\n');
  }
  return next;
}

function patchCss(css) {
  let next = withVersionBump(css);
  const marker = `/* image-health-v${VERSION} */`;
  if (!next.includes(marker)) {
    next = `${next.trimEnd()}\n\n${marker}\n.image-fallback-applied {\n  object-fit: cover;\n  background: #eef5f1;\n}\n`;
  }
  return next;
}

let patched = 0;

for (const filePath of PUBLIC_FILES) {
  if (await patchOptional(filePath, patchPublicHtml)) patched += 1;
}

if (await patchOptional('app.js', patchApp)) patched += 1;
if (await patchOptional('styles.css', patchCss)) patched += 1;
if (await patchOptional('seo-pages.css', patchCss)) patched += 1;
if (await patchOptional('service-worker.js', withVersionBump)) patched += 1;
if (await patchOptional('server.mjs', withVersionBump)) patched += 1;

console.log(`Image health v${VERSION} applied to ${patched} file(s).`);
