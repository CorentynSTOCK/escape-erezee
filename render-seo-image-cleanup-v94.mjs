import { readFile, writeFile } from "node:fs/promises";

const GOOD_IMAGE = "/assets/home-hero-vicinal-v90.jpg?v=90";
const BROKEN_IMAGES = [
  "/assets/home-hero-ardenne-v88.jpg?v=88",
  "/assets/home-hero-ardenne-v88.jpg",
];

const files = [
  "escape-game-exterieur-ardenne.html",
  "activite-famille-ardenne.html",
  "chasse-au-tresor-ardenne.html",
  "activite-touristique-erezee.html",
  "activite-pres-de-durbuy.html",
  "blog/index.html",
  "blog/que-faire-a-erezee.html",
  "blog/que-faire-pres-de-durbuy.html",
  "blog/activites-familiales-ardenne-belge.html",
  "blog/top-10-activites-exterieures-ardenne.html",
  "blog/que-faire-vacances-ardenne.html",
];

async function patchFile(filePath) {
  const input = await readFile(filePath, "utf8");
  let output = input;
  for (const image of BROKEN_IMAGES) output = output.replaceAll(image, GOOD_IMAGE);
  if (output !== input) await writeFile(filePath, output, "utf8");
}

for (const file of files) await patchFile(file);
console.log("SEO image cleanup v94 applied.");
