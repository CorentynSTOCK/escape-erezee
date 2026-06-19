import { readFile, writeFile } from "node:fs/promises";

const VERSION = 181;
const ORIGIN = "https://escape-erezee.be";
const PHOTO_ROOT = "/assets/experience";

const photos = {
  friends: {
    large: `${PHOTO_ROOT}/amis-patrimoine-640.jpg?v=${VERSION}`,
    width: 640,
    height: 427,
    alt: "Amis résolvant une énigme d'escape game extérieur dans un village ardennais",
  },
  family: {
    large: `${PHOTO_ROOT}/famille-village-640.jpg?v=${VERSION}`,
    width: 640,
    height: 427,
    alt: "Famille participant à un parcours d'énigmes extérieur en Ardenne",
  },
  observation: {
    large: `${PHOTO_ROOT}/observation-patrimoine-640.jpg?v=${VERSION}`,
    width: 640,
    height: 427,
    alt: "Équipe observant un détail du patrimoine pendant un escape game extérieur",
  },
  bridge: {
    large: `${PHOTO_ROOT}/equipe-pont-640.jpg?v=${VERSION}`,
    width: 640,
    height: 427,
    alt: "Équipe suivant un parcours d'énigmes près d'un pont en Ardenne",
  },
  village: {
    large: `${PHOTO_ROOT}/groupe-village-1200.jpg?v=${VERSION}`,
    width: 1200,
    height: 800,
    alt: "Groupe en aventure avec un smartphone dans un village ardennais",
  },
};

const pagePhotos = new Map([
  ["escape-game-exterieur-ardenne.html", photos.observation],
  ["activite-famille-ardenne.html", photos.family],
  ["chasse-au-tresor-ardenne.html", photos.bridge],
  ["activite-touristique-erezee.html", photos.friends],
  ["activite-pres-de-durbuy.html", photos.village],
  ["blog/que-faire-a-erezee.html", photos.friends],
  ["blog/que-faire-pres-de-durbuy.html", photos.village],
  ["blog/activites-familiales-ardenne-belge.html", photos.family],
  ["blog/top-10-activites-exterieures-ardenne.html", photos.bridge],
  ["blog/que-faire-vacances-ardenne.html", photos.village],
  ["blog/activite-enfant-erezee.html", photos.family],
  ["blog/escape-game-pres-de-durbuy.html", photos.observation],
  ["blog/week-end-famille-ardenne.html", photos.village],
  ["blog/idee-sortie-groupe-ardenne.html", photos.bridge],
  ["blog/chasse-au-tresor-famille-ardenne.html", photos.family],
]);

function escapeAttribute(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function setAttribute(tag, name, value) {
  const escapedValue = escapeAttribute(value);
  const pattern = new RegExp(`\\s${name}=(?:"[^"]*"|'[^']*')`, "i");
  if (pattern.test(tag)) return tag.replace(pattern, ` ${name}="${escapedValue}"`);
  return tag.replace(/^<img\b/i, `<img ${name}="${escapedValue}"`);
}

function removeAttribute(tag, name) {
  const pattern = new RegExp(`\\s${name}=(?:"[^"]*"|'[^']*')`, "gi");
  return tag.replace(pattern, "");
}

function setImageAttributes(tag, photo, { hero = true } = {}) {
  let next = tag;
  next = setAttribute(next, "src", photo.large);
  next = removeAttribute(next, "srcset");
  next = removeAttribute(next, "sizes");
  next = setAttribute(next, "alt", photo.alt);
  next = setAttribute(next, "width", String(photo.width));
  next = setAttribute(next, "height", String(photo.height));
  next = setAttribute(next, "decoding", "async");
  next = setAttribute(next, "loading", hero ? "eager" : "lazy");
  if (hero) next = setAttribute(next, "fetchpriority", "high");
  return next;
}

function replaceFirstImage(html, photo) {
  return html.replace(/<img\b[^>]*>/i, (tag) => setImageAttributes(tag, photo, { hero: true }));
}

function updateSocialImage(html, photo) {
  const absolute = `${ORIGIN}${photo.large}`;
  let next = html.replace(
    /(<meta\s+property=["']og:image["']\s+content=["'])[^"']*(["'][^>]*>)/i,
    `$1${absolute}$2`,
  );
  next = next.replace(
    /(<meta\s+name=["']twitter:image["']\s+content=["'])[^"']*(["'][^>]*>)/i,
    `$1${absolute}$2`,
  );
  next = next.replace(
    /("image"\s*:\s*")https:\/\/escape-erezee\.be\/assets\/[^"?]+(?:\?v=\d+)?(")/g,
    `$1${absolute}$2`,
  );
  return next;
}

async function patchOptional(filePath, patcher) {
  try {
    const input = await readFile(filePath, "utf8");
    const output = patcher(input);
    if (output !== input) await writeFile(filePath, output, "utf8");
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
}

function patchHome(html) {
  let next = html.replace(
    /<img\b[^>]*class=["'][^"']*home-hero-bg[^"']*["'][^>]*>/i,
    (tag) => setImageAttributes(tag, photos.village, { hero: true }),
  );
  next = next
    .replace(/styles\.css\?v=\d+/g, `styles.css?v=${VERSION}`)
    .replace(/app\.js\?v=\d+/g, `app.js?v=${VERSION}`);
  return next;
}

function patchBlogIndex(html) {
  const cycle = [photos.village, photos.friends, photos.family, photos.observation, photos.bridge];
  let imageIndex = 0;
  let next = html.replace(/<img\b[^>]*>/gi, (tag) => {
    const photo = cycle[imageIndex % cycle.length];
    const hero = imageIndex === 0;
    imageIndex += 1;
    return setImageAttributes(tag, photo, { hero });
  });
  next = updateSocialImage(next, photos.village);
  return next.replace(/seo-pages\.css\?v=\d+/g, `seo-pages.css?v=${VERSION}`);
}

function patchContentPage(html, photo) {
  let next = replaceFirstImage(html, photo);
  next = updateSocialImage(next, photo);
  return next.replace(/seo-pages\.css\?v=\d+/g, `seo-pages.css?v=${VERSION}`);
}

function patchSeoStyles(css) {
  const marker = `/* photo-bank-v${VERSION} */`;
  if (css.includes(marker)) return css;
  return `${css.trimEnd()}

${marker}
.article-list article img {
  display: block;
  width: 100%;
  height: auto;
  aspect-ratio: 3 / 2;
  margin: 0 0 14px;
  object-fit: cover;
  border-radius: 6px;
}
`;
}

function patchAppStyles(css) {
  const marker = `/* photo-bank-v${VERSION} */`;
  let next = css;
  if (!next.includes(marker)) {
    next = `${next.trimEnd()}

${marker}
.home-hero-bg {
  object-position: center 48%;
}
`;
  }
  return next;
}

await patchOptional("index.html", patchHome);
await patchOptional("styles.css", patchAppStyles);
await patchOptional("seo-pages.css", patchSeoStyles);
await patchOptional("blog/index.html", patchBlogIndex);

for (const [filePath, photo] of pagePhotos) {
  await patchOptional(filePath, (html) => patchContentPage(html, photo));
}

await patchOptional("service-worker.js", (worker) => worker.replace(/escape-erezee-v\d+/g, `escape-erezee-v${VERSION}`));

console.log(`Photo bank v${VERSION} applied.`);
