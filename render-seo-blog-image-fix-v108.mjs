import { readFile, writeFile } from "node:fs/promises";

const VERSION = 108;

const replacements = new Map([
  ["/assets/lettre-dame-soy-cover.png", "/assets/home-hero-vicinal-v90.jpg?v=90"],
  ["/assets/sur-les-traces-du-vicinal-cover.png", "/assets/home-hero-vicinal-v90.jpg?v=90"],
  ["/assets/balises-blier-cover.png", "/assets/home-hero-ardenne-v88.jpg?v=88"],
]);

const files = [
  "blog/index.html",
  "blog/que-faire-a-erezee.html",
  "blog/que-faire-pres-de-durbuy.html",
  "blog/activites-familiales-ardenne-belge.html",
  "blog/top-10-activites-exterieures-ardenne.html",
  "blog/que-faire-vacances-ardenne.html",
];

async function patchFile(filePath) {
  const input = await readFile(filePath, "utf8");
  let output = input.replace(/seo-pages\.css\?v=\d+/g, `seo-pages.css?v=${VERSION}`);
  for (const [from, to] of replacements) output = output.replaceAll(from, to);
  if (output !== input) await writeFile(filePath, output, "utf8");
}

for (const file of files) await patchFile(file);
console.log(`SEO blog image fix v${VERSION} applied.`);
