import { readFile, writeFile } from "node:fs/promises";

const SEO_BLOCK_START = '          <section class="home-seo-reviews"';
const SHOP_MARKER = '        <section class="view shop-view"';
const HOME_CLOSE_PATTERN = /          <\/section>\n        <\/section>\n\n+\s*<section class="view shop-view"/;

function moveSeoBlocksInsideHome(html) {
  const blockStart = html.indexOf(SEO_BLOCK_START);
  const shopStart = html.indexOf(SHOP_MARKER);
  if (blockStart === -1 || shopStart === -1 || blockStart > shopStart) return html;

  const block = html.slice(blockStart, shopStart).trimEnd();
  const withoutBlock = `${html.slice(0, blockStart)}${html.slice(shopStart)}`;
  if (!HOME_CLOSE_PATTERN.test(withoutBlock)) {
    throw new Error("Point d'insertion accueil SEO introuvable");
  }

  return withoutBlock.replace(
    HOME_CLOSE_PATTERN,
    `          </section>\n${block}\n        </section>\n\n        <section class="view shop-view"`,
  );
}

const input = await readFile("index.html", "utf8");
const output = moveSeoBlocksInsideHome(input);
if (output !== input) await writeFile("index.html", output, "utf8");
console.log("SEO home placement v93 applied.");
