import { readFile, writeFile } from "node:fs/promises";

const VERSION = 113;

const altTexts = [
  {
    src: "assets/logo-stock-sevrin-v90.jpg?v=90",
    alt: "Logo Stock & Sevrin Escape Games",
  },
  {
    src: "assets/home-hero-vicinal-v90.jpg?v=90",
    alt: "Escape game exterieur en Ardenne dans la region d'Erezee",
  },
];

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function escapeAttribute(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function patchImageAlt(html, src, alt) {
  const escapedSrc = escapeRegExp(src);
  const imagePattern = new RegExp(`<img\\b(?=[^>]*\\bsrc=["']${escapedSrc}["'])([^>]*)>`, "g");

  return html.replace(imagePattern, (tag) => {
    if (/\balt\s*=\s*["'][^"']+["']/i.test(tag)) return tag;

    const escapedAlt = escapeAttribute(alt);
    if (/\balt\s*=\s*["'][^"']*["']/i.test(tag)) {
      return tag.replace(/\balt\s*=\s*["'][^"']*["']/i, `alt="${escapedAlt}"`);
    }

    return tag.replace(/\s*\/?>$/, ` alt="${escapedAlt}" />`);
  });
}

const input = await readFile("index.html", "utf8");
let output = input;

for (const { src, alt } of altTexts) {
  output = patchImageAlt(output, src, alt);
}

if (output !== input) {
  await writeFile("index.html", output, "utf8");
}

console.log(`SEO home alt v${VERSION} applied.`);
