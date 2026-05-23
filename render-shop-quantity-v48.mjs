import { readFile, writeFile } from "node:fs/promises";

const VERSION = 48;

async function patchTextFile(path, updater) {
  const before = await readFile(path, "utf8");
  const after = updater(before);
  if (after !== before) {
    await writeFile(path, after, "utf8");
  }
}

function patchApp(app) {
  let next = app;
  if (!next.includes("const selectedTeamCounts = new Map(")) {
    next = next.replace(
      "  const routes = getShopRoutes();",
      `  const routes = getShopRoutes();
  const selectedTeamCounts = new Map(
    $$("[data-shop-player-count]").map((input) => [input.dataset.shopPlayerCount, input.value]),
  );`,
    );
  }
  if (!next.includes("Number(selectedTeamCounts.get(route.id))")) {
    next = next.replace(
      "      const coverImage = getRouteCoverImage(route);",
      `      const coverImage = getRouteCoverImage(route);
      const teamCount = Math.min(20, Math.max(1, Number(selectedTeamCounts.get(route.id)) || 1));`,
    );
  }
  next = next.replace(
    /<input name="players" type="number" min="1" max="20" value="1" data-shop-player-count="\$\{escapeHtml\(route\.id\)\}" \/>/g,
    '<input name="players" type="number" min="1" max="20" value="${teamCount}" data-shop-player-count="${escapeHtml(route.id)}" />',
  );
  next = next.replace(
    /<strong data-shop-total="\$\{escapeHtml\(route\.id\)\}">\$\{formatPrice\(price\)\}<\/strong>/g,
    '<strong data-shop-total="${escapeHtml(route.id)}">${formatPrice(price * teamCount)}</strong>',
  );
  return next;
}

await patchTextFile("index.html", (html) => html
  .replace(/styles\.css\?v=\d+/g, `styles.css?v=${VERSION}`)
  .replace(/app\.js\?v=\d+/g, `app.js?v=${VERSION}`));
await patchTextFile("app.js", patchApp);
await patchTextFile("service-worker.js", (worker) => worker.replace(/escape-erezee-v\d+/g, `escape-erezee-v${VERSION}`));
