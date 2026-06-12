import { readFile, writeFile } from 'node:fs/promises';

const VERSION = 164;

async function patchTextFile(filePath, patcher) {
  const input = await readFile(filePath, 'utf8');
  const output = patcher(input);
  if (output !== input) await writeFile(filePath, output, 'utf8');
}

function bumpVersions(text) {
  let next = text;
  for (let version = 1; version <= VERSION; version += 1) {
    next = next.split('styles.css?v=' + version).join('styles.css?v=' + VERSION);
    next = next.split('app.js?v=' + version).join('app.js?v=' + VERSION);
    next = next.split('seo-pages.css?v=' + version).join('seo-pages.css?v=' + VERSION);
    next = next.split('escape-erezee-v' + version).join('escape-erezee-v' + VERSION);
  }
  return next;
}

function patchServer(server) {
  let next = server;
  if (!next.includes('function normalizeSeoTextV164(value)')) {
    const marker = "  function stripTags(html) {\n    return String(html || '').replace(/<script[\\s\\S]*?<\\/script>/gi, ' ').replace(/<style[\\s\\S]*?<\\/style>/gi, ' ').replace(/<[^>]+>/g, ' ').replace(/\\s+/g, ' ').trim();\n  }\n\n";
    const insertion = marker + "  function normalizeSeoTextV164(value) {\n    return String(value || '').normalize('NFD').replace(/[\\u0300-\\u036f]/g, '').toLowerCase();\n  }\n\n";
    if (!next.includes(marker)) throw new Error('Patch v' + VERSION + ' introuvable: stripTags');
    next = next.replace(marker, insertion);
  }
  const oldKeywordBlock = "    const missingKeywords = (page.keywords || []).filter(function (keyword) {\n      return keyword && !visibleText.toLowerCase().includes(String(keyword).toLowerCase());\n    });";
  const newKeywordBlock = "    const visibleSearchText = normalizeSeoTextV164(visibleText);\n    const missingKeywords = (page.keywords || []).filter(function (keyword) {\n      return keyword && !visibleSearchText.includes(normalizeSeoTextV164(keyword));\n    });";
  if (next.includes(oldKeywordBlock)) next = next.replace(oldKeywordBlock, newKeywordBlock);
  return bumpVersions(next);
}

function patchApp(app) {
  const oldHeading = "'<h4>' + (payload.ok ? 'SEO stable' : 'Points SEO a verifier') + '</h4>',";
  const newHeading = "'<h4>' + ((summary.critical || 0) > 0 ? 'Points SEO critiques' : ((summary.warnings || 0) > 0 ? 'Optimisations SEO a planifier' : 'SEO stable')) + '</h4>',";
  return bumpVersions(app.includes(oldHeading) ? app.replace(oldHeading, newHeading) : app);
}

function patchServiceWorker(worker) {
  return bumpVersions(worker);
}

await patchTextFile('server.mjs', patchServer);
await patchTextFile('app.js', patchApp);
await patchTextFile('styles.css', bumpVersions);
await patchTextFile('index.html', bumpVersions);
await patchTextFile('suivi.html', bumpVersions);
await patchTextFile('seo-pages.css', bumpVersions);
await patchTextFile('service-worker.js', patchServiceWorker);

console.log('SEO follow-up polish v' + VERSION + ' applied.');
