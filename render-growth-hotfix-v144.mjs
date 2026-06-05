import { readFile, writeFile } from 'node:fs/promises';

const VERSION = 144;

async function patchTextFile(filePath, patcher) {
  const input = await readFile(filePath, 'utf8');
  const output = patcher(input);
  if (output !== input) await writeFile(filePath, output, 'utf8');
}

async function patchOptionalTextFile(filePath, patcher) {
  try {
    await patchTextFile(filePath, patcher);
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
}

function bumpAssetVersions(text) {
  return text
    .replace(/styles\.css\?v=\d+/g, `styles.css?v=${VERSION}`)
    .replace(/app\.js\?v=\d+/g, `app.js?v=${VERSION}`);
}

function fixGeneratedApostrophes(text) {
  return text
    .replace(/J'ai verifie/g, 'J&#039;ai verifie')
    .replace(/l'aventure/g, 'l&#039;aventure')
    .replace(/s'amusant/g, 's&#039;amusant')
    .replace(/aujourd'hui/g, 'aujourd&#039;hui')
    .replace(/Aujourd'hui/g, 'Aujourd&#039;hui');
}

function patchApp(app) {
  return fixGeneratedApostrophes(bumpAssetVersions(app));
}

function patchServer(server) {
  return bumpAssetVersions(server)
    .replace(/app\.js\?v=143/g, `app.js?v=${VERSION}`)
    .replace(/styles\.css\?v=143/g, `styles.css?v=${VERSION}`);
}

function patchServiceWorker(worker) {
  return bumpAssetVersions(worker).replace(/escape-erezee-v\d+/g, `escape-erezee-v${VERSION}`);
}

await patchTextFile('app.js', patchApp);
await patchTextFile('server.mjs', patchServer);
await patchTextFile('styles.css', bumpAssetVersions);
await patchTextFile('index.html', bumpAssetVersions);
await patchTextFile('suivi.html', bumpAssetVersions);
await patchTextFile('service-worker.js', patchServiceWorker);
await patchOptionalTextFile('escape-game-exterieur-ardenne.html', bumpAssetVersions);
await patchOptionalTextFile('activite-famille-ardenne.html', bumpAssetVersions);
await patchOptionalTextFile('chasse-au-tresor-ardenne.html', bumpAssetVersions);
await patchOptionalTextFile('activite-touristique-erezee.html', bumpAssetVersions);
await patchOptionalTextFile('activite-pres-de-durbuy.html', bumpAssetVersions);
await patchOptionalTextFile('blog/index.html', bumpAssetVersions);

console.log(`Growth hotfix v${VERSION} applied.`);
