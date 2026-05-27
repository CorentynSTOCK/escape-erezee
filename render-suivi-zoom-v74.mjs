import { readFile, writeFile } from "node:fs/promises";

async function patchTextFile(filePath, patcher) {
  const input = await readFile(filePath, "utf8");
  const output = patcher(input);
  if (output !== input) {
    await writeFile(filePath, output, "utf8");
  }
}

function ensureSuivi(html) {
  let next = html;

  if (!next.includes("let currentMapZoom = 16;")) {
    next = next.replace(
      "      let mapZoomOverride = null;\n      let lastRenderOptions = null;",
      "      let mapZoomOverride = null;\n      let currentMapZoom = 16;\n      let lastRenderOptions = null;",
    );
  }

  next = next.replace(
    "        const zoom = clampZoom(mapZoomOverride ?? fit.zoom);\n        const center = fit.center;",
    "        const zoom = clampZoom(mapZoomOverride ?? fit.zoom);\n        currentMapZoom = zoom;\n        const center = fit.center;",
  );

  next = next.replace(
    "      els.zoomIn.addEventListener(\"click\", () => { mapZoomOverride = clampZoom((mapZoomOverride ?? 16) + 1); rerenderMap(); });",
    "      els.zoomIn.addEventListener(\"click\", () => { mapZoomOverride = clampZoom(currentMapZoom + 1); rerenderMap(); });",
  );

  next = next.replace(
    "      els.zoomOut.addEventListener(\"click\", () => { mapZoomOverride = clampZoom((mapZoomOverride ?? 16) - 1); rerenderMap(); });",
    "      els.zoomOut.addEventListener(\"click\", () => { mapZoomOverride = clampZoom(currentMapZoom - 1); rerenderMap(); });",
  );

  return next;
}

await patchTextFile("suivi.html", ensureSuivi);

console.log("Suivi zoom v74 applique.");
