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

for (const [filePath, altText] of pageAltTexts) {
  await patchPage(filePath, altText);
}

console.log(`SEO image alt v${VERSION} applied.`);
