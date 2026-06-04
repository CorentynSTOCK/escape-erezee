import { readFile, writeFile } from 'node:fs/promises';

const VERSION = 133;

async function patchTextFile(filePath, patcher) {
  const input = await readFile(filePath, 'utf8');
  const output = patcher(input);
  if (output !== input) await writeFile(filePath, output, 'utf8');
}

function bumpAssetVersions(text) {
  return text
    .replace(/styles\.css\?v=\d+/g, `styles.css?v=${VERSION}`)
    .replace(/app\.js\?v=\d+/g, `app.js?v=${VERSION}`);
}

function patchStyles(css) {
  let output = css;
  if (!output.includes('admin-backup-layout-v133')) {
    output = `${output.trimEnd()}

/* admin-backup-layout-v133 */
.backup-tools-panel {
  grid-column: 1 / -1;
  grid-template-columns: minmax(0, 1fr);
  margin-top: 0;
}

.backup-tools-controls {
  grid-template-columns: minmax(260px, 1fr) auto auto;
}

.backup-tools-controls select {
  width: 100%;
  padding: 0 10px;
}

.backup-tools-copy h3 {
  max-width: 42rem;
}

@media (max-width: 720px) {
  .backup-tools-controls {
    grid-template-columns: 1fr;
  }
}
`;
  }
  return bumpAssetVersions(output);
}

function patchServiceWorker(worker) {
  return bumpAssetVersions(worker).replace(/escape-erezee-v\d+/g, `escape-erezee-v${VERSION}`);
}

await patchTextFile('styles.css', patchStyles);
await patchTextFile('index.html', bumpAssetVersions);
await patchTextFile('suivi.html', bumpAssetVersions);
await patchTextFile('service-worker.js', patchServiceWorker);

console.log(`Admin backup layout v${VERSION} applied.`);
