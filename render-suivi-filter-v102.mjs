import { readFile, writeFile } from "node:fs/promises";

const scriptBaseUrl = new URL("./", import.meta.url);

async function patchTextFile(filePath, patcher) {
  const fileUrl = new URL(filePath, scriptBaseUrl);
  const input = await readFile(fileUrl, "utf8");
  const output = patcher(input);
  if (output !== input) await writeFile(fileUrl, output, "utf8");
}

function patchSuivi(html) {
  if (html.includes("suivi-filter-v102")) return html;

  const marker = `      function selectedIdsFor(entries) {
        const ids = entries.map((entry) => entry.team.id);
        if (!Array.isArray(selectedFilter)) return new Set(ids);
        return new Set(selectedFilter.filter((id) => ids.includes(id)));
      }`;

  const replacement = `      /* suivi-filter-v102 */
      function selectedIdsFor(entries) {
        const ids = entries.map((entry) => entry.team.id);
        if (!Array.isArray(selectedFilter)) return new Set(ids);

        const filteredIds = selectedFilter.filter((id) => ids.includes(id));
        if (ids.length && selectedFilter.length && !filteredIds.length) {
          saveFilter(null);
          return new Set(ids);
        }

        if (filteredIds.length !== selectedFilter.length) {
          saveFilter(filteredIds.length === ids.length ? null : filteredIds);
        }

        return new Set(filteredIds);
      }`;

  if (!html.includes(marker)) throw new Error("suivi selectedIdsFor marker not found");
  return html.replace(marker, replacement);
}

await patchTextFile("suivi.html", patchSuivi);
