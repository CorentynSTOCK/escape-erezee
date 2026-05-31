import { readFile, writeFile } from "node:fs/promises";

const VERSION = 90;
const LOGO_SRC = `assets/logo-stock-sevrin-v${VERSION}.jpg?v=${VERSION}`;
const HERO_SRC = `assets/home-hero-vicinal-v${VERSION}.jpg?v=${VERSION}`;
const SOCIAL_HERO_SRC = `https://escape-erezee.be/assets/home-hero-vicinal-v${VERSION}.jpg?v=${VERSION}`;

async function patchTextFile(filePath, patcher) {
  const input = await readFile(filePath, "utf8");
  const output = patcher(input);
  if (output !== input) await writeFile(filePath, output, "utf8");
}

function replaceWithCheck(input, pattern, replacement, label) {
  let replaced = false;
  const output = input.replace(pattern, (...args) => {
    replaced = true;
    return typeof replacement === "function" ? replacement(...args) : replacement;
  });
  if (!replaced) throw new Error(`Patch v${VERSION} introuvable: ${label}`);
  return output;
}

function patchIndex(html) {
  let next = html;
  next = next.replace(/styles\.css\?v=\d+/g, `styles.css?v=${VERSION}`);
  next = next.replace(/app\.js\?v=\d+/g, `app.js?v=${VERSION}`);
  next = replaceWithCheck(next, /(<img\s+class="home-hero-bg"\s+src=")[^"]+("[^>]*>)/, (_m, before, after) => `${before}${HERO_SRC}${after}`, "image de fond accueil");
  next = replaceWithCheck(next, /(<img\s+class="home-hero-logo"\s+src=")[^"]+("[^>]*>)/, (_m, before, after) => `${before}${LOGO_SRC}${after}`, "logo accueil");
  next = replaceWithCheck(next, /(<span\s+class="brand-mark brand-logo-mark"\s+aria-hidden="true">\s*<img\s+src=")[^"]+("[^>]*>\s*<\/span>)/, (_m, before, after) => `${before}${LOGO_SRC}${after}`, "logo navigation");
  next = next.replace(/(<meta\s+(?:property="og:image"|name="twitter:image")[^>]*content=")[^"]+("[^>]*>)/g, (_m, before, after) => `${before}${SOCIAL_HERO_SRC}${after}`);
  if (!next.includes(HERO_SRC) || !next.includes(LOGO_SRC)) throw new Error(`Patch v${VERSION} incomplet: visuels accueil absents`);
  return next;
}

function patchStyles(css) {
  const marker = `/* render-home-visual-v${VERSION} */`;
  const block = `
${marker}
.brand-logo-mark {
  display: grid;
  overflow: hidden;
  padding: 0;
  background: #10231f;
}

.brand-logo-mark img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.home-hero-bg {
  opacity: 1;
}

.home-hero-overlay {
  background:
    linear-gradient(90deg, rgba(9, 22, 20, 0.94), rgba(9, 22, 20, 0.70) 42%, rgba(9, 22, 20, 0.18)),
    linear-gradient(180deg, rgba(9, 22, 20, 0.08), rgba(9, 22, 20, 0.78));
}

.home-hero-logo {
  width: min(300px, 62vw);
  max-width: 62vw;
  aspect-ratio: 520 / 347;
  object-fit: cover;
  border: 1px solid rgba(255, 255, 255, 0.24);
  border-radius: 8px;
  box-shadow: 0 18px 50px rgba(0, 0, 0, 0.32);
}
`;
  if (css.includes(marker)) return css;
  return `${css.trimEnd()}\n${block}`;
}

function ensureShellAsset(sw, asset) {
  if (sw.includes(asset)) return sw;
  const marker = '  "./assets/icon.svg",';
  if (!sw.includes(marker)) throw new Error(`Patch v${VERSION} introuvable: cache assets marker`);
  return sw.replace(marker, `${marker}\n  "${asset}",`);
}

function patchServiceWorker(sw) {
  let next = sw.replace(/escape-erezee-v\d+/g, `escape-erezee-v${VERSION}`);
  next = next.replace(/"\.\/styles\.css(?:\?v=\d+)?"/g, `"./styles.css?v=${VERSION}"`);
  next = next.replace(/"\.\/app\.js(?:\?v=\d+)?"/g, `"./app.js?v=${VERSION}"`);
  next = ensureShellAsset(next, `./${LOGO_SRC}`);
  next = ensureShellAsset(next, `./${HERO_SRC}`);
  return next;
}

await patchTextFile("index.html", patchIndex);
await patchTextFile("styles.css", patchStyles);
await patchTextFile("service-worker.js", patchServiceWorker);
console.log(`Render home visual patch v${VERSION} applied.`);