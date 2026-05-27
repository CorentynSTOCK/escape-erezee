import { readFile, writeFile } from "node:fs/promises";

async function patchTextFile(filePath, patcher) {
  const input = await readFile(filePath, "utf8");
  const output = patcher(input);
  if (output !== input) {
    await writeFile(filePath, output, "utf8");
  }
}

function ensureIndex(html) {
  if (html.includes('href="suivi.html" id="open-tracking-page"')) return html;
  return html.replace(
    `              <div class="panel-title">
                <div>
                  <p class="section-label">Équipes</p>
                  <h2 id="teams-heading">Progression en direct</h2>
                </div>
              </div>`,
    `              <div class="panel-title">
                <div>
                  <p class="section-label">Équipes</p>
                  <h2 id="teams-heading">Progression en direct</h2>
                </div>
                <a class="secondary-button" href="suivi.html" id="open-tracking-page">Grand écran</a>
              </div>`,
  );
}

await patchTextFile("index.html", ensureIndex);

console.log("Lien suivi grand écran v72 applique.");
