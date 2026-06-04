import { readFile, writeFile } from "node:fs/promises";

const VERSION = 112;

const pageAltTexts = new Map([
  ["escape-game-exterieur-ardenne.html", "Escape game extérieur en Ardenne dans un décor naturel d'Érezée"],
  ["activite-famille-ardenne.html", "Activité famille en Ardenne avec parcours d'énigmes extérieur"],
  ["chasse-au-tresor-ardenne.html", "Chasse au trésor extérieure en Ardenne belge"],
  ["activite-touristique-erezee.html", "Activité touristique à Érezée entre nature et patrimoine"],
  ["activite-pres-de-durbuy.html", "Activité extérieure près de Durbuy en Ardenne belge"],
  ["blog/index.html", "Idées de sorties et activités extérieures en Ardenne"],
  ["blog/que-faire-a-erezee.html", "Que faire à Érezée avec une activité extérieure en Ardenne"],
  ["blog/que-faire-pres-de-durbuy.html", "Que faire près de Durbuy avec une activité en plein air"],
  ["blog/activites-familiales-ardenne-belge.html", "Activités familiales en Ardenne belge"],
  ["blog/top-10-activites-exterieures-ardenne.html", "Activités extérieures en Ardenne"],
  ["blog/que-faire-vacances-ardenne.html", "Vacances en Ardenne avec sorties nature et énigmes"],
]);

const homeImageAltTexts = new Map([
  ["assets/logo-stock-sevrin-v90.jpg?v=90", "Logo Stock & Sevrin Escape Games"],
  ["assets/home-hero-vicinal-v90.jpg?v=90", "Escape game extérieur en Ardenne dans la région d'Érezée"],
]);

function escapeAttribute(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

async function patchPage(filePath, altText) {
  const input = await readFile(filePath, "utf8");
  const output = input.replace(/<img\b([^>]*?)\salt=""([^>]*?)>/, `<img$1 alt="${escapeAttribute(altText)}"$2>`);
  if (output !== input) await writeFile(filePath, output, "utf8");
}

function patchImageAltBySrc(html, src, altText) {
  return html.replace(/<img\b[^>]*>/g, (tag) => {
    if (!tag.includes(`src="${src}"`) && !tag.includes(`src='${src}'`)) return tag;
    if (/\balt\s*=\s*["'][^"']+["']/i.test(tag)) return tag;

    const escapedAlt = escapeAttribute(altText);
    if (/\balt\s*=\s*["'][^"']*["']/i.test(tag)) {
      return tag.replace(/\balt\s*=\s*["'][^"']*["']/i, `alt="${escapedAlt}"`);
    }

    return tag.replace(/\s*\/?>$/, ` alt="${escapedAlt}" />`);
  });
}

async function patchHomePage() {
  const input = await readFile("index.html", "utf8");
  let output = input;

  for (const [src, altText] of homeImageAltTexts) {
    output = patchImageAltBySrc(output, src, altText);
  }

  if (output !== input) await writeFile("index.html", output, "utf8");
}

for (const [filePath, altText] of pageAltTexts) {
  await patchPage(filePath, altText);
}
await patchHomePage();

console.log(`SEO image alt v${VERSION} applied.`);
