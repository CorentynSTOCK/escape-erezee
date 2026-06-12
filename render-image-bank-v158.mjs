import { readFile, writeFile } from 'node:fs/promises';

const VERSION = 158;
const ORIGIN = 'https://escape-erezee.be';

const IMAGE_PATHS = {
  escapeGame: `/assets/seo/escape-game-ardenne-v${VERSION}.svg?v=${VERSION}`,
  famille: `/assets/seo/activite-famille-ardenne-v${VERSION}.svg?v=${VERSION}`,
  chasse: `/assets/seo/chasse-tresor-ardenne-v${VERSION}.svg?v=${VERSION}`,
  erezee: `/assets/seo/activite-touristique-erezee-v${VERSION}.svg?v=${VERSION}`,
  durbuy: `/assets/seo/activite-pres-durbuy-v${VERSION}.svg?v=${VERSION}`,
  blog: `/assets/seo/blog-ardenne-v${VERSION}.svg?v=${VERSION}`,
};

const PAGE_IMAGES = {
  'escape-game-exterieur-ardenne.html': IMAGE_PATHS.escapeGame,
  'activite-famille-ardenne.html': IMAGE_PATHS.famille,
  'chasse-au-tresor-ardenne.html': IMAGE_PATHS.chasse,
  'activite-touristique-erezee.html': IMAGE_PATHS.erezee,
  'activite-pres-de-durbuy.html': IMAGE_PATHS.durbuy,
  'blog/index.html': IMAGE_PATHS.blog,
  'blog/que-faire-a-erezee.html': IMAGE_PATHS.erezee,
  'blog/que-faire-pres-de-durbuy.html': IMAGE_PATHS.durbuy,
  'blog/activites-familiales-ardenne-belge.html': IMAGE_PATHS.famille,
  'blog/top-10-activites-exterieures-ardenne.html': IMAGE_PATHS.blog,
  'blog/que-faire-vacances-ardenne.html': IMAGE_PATHS.chasse,
  'blog/activite-enfant-erezee.html': IMAGE_PATHS.famille,
  'blog/escape-game-pres-de-durbuy.html': IMAGE_PATHS.escapeGame,
  'blog/week-end-famille-ardenne.html': IMAGE_PATHS.blog,
  'blog/idee-sortie-groupe-ardenne.html': IMAGE_PATHS.chasse,
  'parcours/la-lettre-de-la-dame-de-soy.html': IMAGE_PATHS.escapeGame,
  'parcours/sur-les-traces-du-vicinal.html': IMAGE_PATHS.durbuy,
  'parcours/les-balises-perdues-de-blier.html': IMAGE_PATHS.chasse,
};

const PAGE_GALLERIES = {
  'escape-game-exterieur-ardenne.html': [IMAGE_PATHS.escapeGame, IMAGE_PATHS.erezee, IMAGE_PATHS.chasse],
  'activite-famille-ardenne.html': [IMAGE_PATHS.famille, IMAGE_PATHS.blog, IMAGE_PATHS.erezee],
  'chasse-au-tresor-ardenne.html': [IMAGE_PATHS.chasse, IMAGE_PATHS.durbuy, IMAGE_PATHS.escapeGame],
  'activite-touristique-erezee.html': [IMAGE_PATHS.erezee, IMAGE_PATHS.escapeGame, IMAGE_PATHS.blog],
  'activite-pres-de-durbuy.html': [IMAGE_PATHS.durbuy, IMAGE_PATHS.blog, IMAGE_PATHS.chasse],
  'blog/index.html': [IMAGE_PATHS.blog, IMAGE_PATHS.erezee, IMAGE_PATHS.famille],
  'blog/que-faire-a-erezee.html': [IMAGE_PATHS.erezee, IMAGE_PATHS.escapeGame, IMAGE_PATHS.blog],
  'blog/que-faire-pres-de-durbuy.html': [IMAGE_PATHS.durbuy, IMAGE_PATHS.chasse, IMAGE_PATHS.blog],
  'blog/activites-familiales-ardenne-belge.html': [IMAGE_PATHS.famille, IMAGE_PATHS.erezee, IMAGE_PATHS.blog],
  'blog/top-10-activites-exterieures-ardenne.html': [IMAGE_PATHS.blog, IMAGE_PATHS.chasse, IMAGE_PATHS.durbuy],
  'blog/que-faire-vacances-ardenne.html': [IMAGE_PATHS.chasse, IMAGE_PATHS.famille, IMAGE_PATHS.blog],
  'blog/activite-enfant-erezee.html': [IMAGE_PATHS.famille, IMAGE_PATHS.chasse, IMAGE_PATHS.erezee],
  'blog/escape-game-pres-de-durbuy.html': [IMAGE_PATHS.escapeGame, IMAGE_PATHS.durbuy, IMAGE_PATHS.blog],
  'blog/week-end-famille-ardenne.html': [IMAGE_PATHS.blog, IMAGE_PATHS.famille, IMAGE_PATHS.erezee],
  'blog/idee-sortie-groupe-ardenne.html': [IMAGE_PATHS.chasse, IMAGE_PATHS.escapeGame, IMAGE_PATHS.durbuy],
  'parcours/la-lettre-de-la-dame-de-soy.html': [IMAGE_PATHS.escapeGame, IMAGE_PATHS.erezee],
  'parcours/sur-les-traces-du-vicinal.html': [IMAGE_PATHS.durbuy, IMAGE_PATHS.blog],
  'parcours/les-balises-perdues-de-blier.html': [IMAGE_PATHS.chasse, IMAGE_PATHS.famille],
};

const PUBLIC_FILES = Object.keys(PAGE_IMAGES);

const STATIC_FALLBACK_SCRIPT = `<script id="image-bank-v${VERSION}">
(function () {
  var fallback = "${IMAGE_PATHS.blog}";
  document.addEventListener("error", function (event) {
    var img = event.target;
    if (!img || img.tagName !== "IMG" || img.dataset.imageBankFallback === "1") return;
    var src = img.currentSrc || img.getAttribute("src") || "";
    if (!src || src.indexOf("data:") === 0 || src.indexOf("tile.openstreetmap.org") !== -1) return;
    if (src.indexOf("/assets/") === -1 && src.indexOf("assets/") === -1) return;
    img.dataset.imageBankFallback = "1";
    img.classList.add("image-bank-fallback");
    img.src = fallback;
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

function absolute(imagePath) {
  return `${ORIGIN}${imagePath}`;
}

function withVersionBump(text) {
  return text
    .replace(/styles[.]css[?]v=[0-9]+/g, `styles.css?v=${VERSION}`)
    .replace(/app[.]js[?]v=[0-9]+/g, `app.js?v=${VERSION}`)
    .replace(/seo-pages[.]css[?]v=[0-9]+/g, `seo-pages.css?v=${VERSION}`)
    .replace(/escape-erezee-v[0-9]+/g, `escape-erezee-v${VERSION}`);
}

function replaceLegacyAssetUrls(text, imagePath) {
  const legacy = '(?:home-hero-vicinal-v90(?:-small)?|home-hero-ardenne-v88|lettre-dame-soy-cover|sur-les-traces-du-vicinal-cover|balises-blier-cover)[.](?:jpg|png)(?:[?]v=[0-9]+)?';
  return text
    .replace(new RegExp(`https://escape-erezee[.]be/assets/${legacy}`, 'g'), absolute(imagePath))
    .replace(new RegExp(`/assets/${legacy}`, 'g'), imagePath);
}

function replaceContentImages(html, gallery) {
  let imageIndex = 0;
  return html.replace(/<img\b[^>]*>/gi, (tag) => {
    if (!gallery.length) return tag;
    if (/brand-logo|logo-stock-sevrin|logo-escape|icon[.]svg/i.test(tag)) return tag;
    const imagePath = gallery[Math.min(imageIndex, gallery.length - 1)];
    imageIndex += 1;
    return tag.replace(/\bsrc=["'][^"']+["']/i, `src="${imagePath}"`);
  });
}

function addImageTagSafety(html) {
  return html.replace(/<img\b[^>]*>/gi, (tag) => {
    let next = tag;
    if (!/\bdecoding=/.test(next)) next = next.replace(/\s*\/?>$/, ' decoding="async"$&');
    if (!/\bloading=/.test(next) && !/brand-logo|logo-stock-sevrin/i.test(next)) {
      next = next.replace(/\s*\/?>$/, ' loading="lazy"$&');
    }
    return next;
  });
}

function prioritizeFirstContentImage(html) {
  let prioritized = false;
  return html.replace(/<img\b[^>]*>/gi, (tag) => {
    if (prioritized) return tag;
    if (/brand-logo|logo-stock-sevrin|logo-escape|icon[.]svg/i.test(tag)) return tag;
    prioritized = true;
    return tag
      .replace(/\sloading=["'][^"']*["']/i, '')
      .replace(/\sfetchpriority=["'][^"']*["']/i, '')
      .replace(/\s*\/?>$/, ' loading="eager" fetchpriority="high"$&');
  });
}

function addFallbackScript(html) {
  if (!html.includes('</body>') || html.includes(`image-bank-v${VERSION}`)) return html;
  return html.replace('</body>', `  ${STATIC_FALLBACK_SCRIPT}\n  </body>`);
}

function patchPublicHtml(html, filePath) {
  const imagePath = PAGE_IMAGES[filePath];
  const gallery = PAGE_GALLERIES[filePath] || (imagePath ? [imagePath] : []);
  let next = withVersionBump(html);
  if (imagePath) {
    next = replaceLegacyAssetUrls(next, imagePath);
    next = replaceContentImages(next, gallery);
  }
  next = addImageTagSafety(next);
  next = prioritizeFirstContentImage(next);
  next = addFallbackScript(next);
  return next;
}

function patchCss(css) {
  const marker = `/* image-bank-v${VERSION} */`;
  let next = withVersionBump(css);
  if (!next.includes(marker)) {
    next = `${next.trimEnd()}\n\n${marker}\n.image-bank-fallback {\n  background: #eef5f1;\n  object-fit: cover;\n}\n`;
  }
  return next;
}

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

const getRouteSeoImageV158 = `function getRouteSeoImage(route, origin) {
  const searchable = compactText([route?.id, route?.slug, route?.title, route?.publicPath].filter(Boolean).join(' ')).toLowerCase();
  let imagePath = '${IMAGE_PATHS.escapeGame}';
  if (searchable.includes('vicinal')) imagePath = '${IMAGE_PATHS.durbuy}';
  if (searchable.includes('balises') || searchable.includes('blier')) imagePath = '${IMAGE_PATHS.chasse}';
  if (searchable.includes('dame') || searchable.includes('soy') || searchable.includes('lettre')) imagePath = '${IMAGE_PATHS.escapeGame}';
  return \`${origin}\${imagePath}\`;
}`;

function patchServer(server) {
  let next = withVersionBump(server);
  next = replaceFunction(next, 'getRouteSeoImage', getRouteSeoImageV158);
  return next
    .replace(/\/assets\/home-hero-vicinal-v90-small[.]jpg[?]v=[0-9]+/g, IMAGE_PATHS.blog)
    .replace(/\/assets\/home-hero-vicinal-v90[.]jpg[?]v=[0-9]+/g, IMAGE_PATHS.durbuy)
    .replace(/\/assets\/home-hero-ardenne-v88[.]jpg[?]v=[0-9]+/g, IMAGE_PATHS.erezee)
    .replace(/\/assets\/lettre-dame-soy-cover[.]png(?:[?]v=[0-9]+)?/g, IMAGE_PATHS.escapeGame)
    .replace(/\/assets\/sur-les-traces-du-vicinal-cover[.]png(?:[?]v=[0-9]+)?/g, IMAGE_PATHS.durbuy)
    .replace(/\/assets\/balises-blier-cover[.]png(?:[?]v=[0-9]+)?/g, IMAGE_PATHS.chasse);
}

let patched = 0;
for (const filePath of PUBLIC_FILES) {
  if (await patchOptional(filePath, patchPublicHtml)) patched += 1;
}
if (await patchOptional('server.mjs', patchServer)) patched += 1;
if (await patchOptional('styles.css', patchCss)) patched += 1;
if (await patchOptional('seo-pages.css', patchCss)) patched += 1;
if (await patchOptional('service-worker.js', withVersionBump)) patched += 1;
console.log(`Optimized SEO image bank v${VERSION} applied to ${patched} file(s).`);
