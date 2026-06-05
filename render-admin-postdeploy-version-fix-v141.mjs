import { readFile, writeFile } from 'node:fs/promises';

const VERSION = 142;

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

function findBlockEnd(input, start) {
  const bodyStart = input.indexOf('{', start);
  if (bodyStart < 0) return -1;
  let depth = 0;
  let quote = null;
  let escaped = false;
  for (let index = bodyStart; index < input.length; index += 1) {
    const char = input[index];
    if (quote) {
      if (escaped) escaped = false;
      else if (char === '\\') escaped = true;
      else if (char === quote) quote = null;
      continue;
    }
    if (char === '"' || char === "'" || char === '`') {
      quote = char;
      continue;
    }
    if (char === '{') depth += 1;
    if (char === '}') {
      depth -= 1;
      if (depth === 0) return index + 1;
    }
  }
  return -1;
}

function replaceBlock(input, signature, replacement) {
  const start = input.indexOf(signature);
  if (start < 0) throw new Error(`Patch v${VERSION} introuvable: ${signature}`);
  const end = findBlockEnd(input, start);
  if (end < 0) throw new Error(`Patch v${VERSION} impossible: ${signature}`);
  return `${input.slice(0, start)}${replacement}${input.slice(end)}`;
}

async function runPostDeployChecksV136() {
  const health = await buildAdminHealthStatusV136();
  const staticChecks = await Promise.all([
    fileCheckV136('Accueil', 'index.html', ['app.js?v=142', 'styles.css?v=142']),
    publicUrlCheckV137('Suivi grand ecran', 'suivi.html', ['<!doctype html']),
    publicUrlCheckV137('Sitemap SEO', 'sitemap.xml', ['escape-erezee.be']),
    publicUrlCheckV137('Robots SEO', 'robots.txt', ['Sitemap:']),
  ]);
  const shopRoutes = health.routes.filter((route) => route.visible && Number(route.pricePerPerson) > 0);
  const checkoutDryRun = {
    id: 'checkout-dry-run',
    label: 'Parcours client achat',
    status: health.commerce.stripeConfigured && health.commerce.stripeWebhookConfigured && shopRoutes.length ? 'ok' : 'warning',
    detail: health.commerce.stripeConfigured && health.commerce.stripeWebhookConfigured && shopRoutes.length
      ? `${shopRoutes.length} parcours vendable(s), Stripe pret. Aucun paiement reel lance.`
      : 'Configuration achat a verifier. Aucun paiement reel lance.',
  };
  const checks = [...health.checks, ...staticChecks, checkoutDryRun];
  const status = getHealthStatusFromChecksV136(checks);
  return { ok: status !== 'critical', status, checkedAt: Date.now(), checks, health };
}

function patchServer(server) {
  return replaceBlock(server, 'async function runPostDeployChecksV136', runPostDeployChecksV136.toString());
}

function patchApp(app) {
  let output = bumpAssetVersions(app);
  if (output.includes('admin-health-action-hold-v142')) return output;

  output = output.replace(
    'let adminHealthLastPayloadV136 = null;\n',
    'let adminHealthLastPayloadV136 = null;\nlet adminHealthManualActionHoldUntilV142 = 0;\n'
  );

  output = output.replace(
    '  const force = Boolean(options && options.force);\n',
    '  const force = Boolean(options && options.force);\n  const autoRefresh = Boolean(options && options.auto);\n  if (autoRefresh && Date.now() < adminHealthManualActionHoldUntilV142) return;\n'
  );

  output = output.replace(
    '  refs.summary.textContent = kind === "simulation" ? "Simulation multi-joueurs en cours..." : "Test post-deploiement en cours...";\n',
    '  refs.summary.textContent = kind === "simulation" ? "Simulation multi-joueurs en cours..." : "Test post-deploiement en cours...";\n  adminHealthManualActionHoldUntilV142 = Date.now() + 30000;\n'
  );

  output = output.replace(
    '    adminHealthRenderChecksV136(payload, kind === "simulation" ? "Simulation joueurs" : "Test deploiement");\n',
    '    adminHealthRenderChecksV136(payload, kind === "simulation" ? "Simulation joueurs" : "Test deploiement");\n    adminHealthManualActionHoldUntilV142 = Date.now() + 30000;\n'
  );

  output = output.replace(
    '    if (adminView && adminView.classList.contains("is-active") && document.querySelector("#admin-health-v136")) {\n      adminHealthRefreshV136({ force: true });\n    }\n',
    '    if (adminView && adminView.classList.contains("is-active") && document.querySelector("#admin-health-v136")) {\n      adminHealthRefreshV136({ force: true, auto: true });\n    }\n'
  );

  return `${output}\n/* admin-health-action-hold-v142 */\n`;
}

function patchServiceWorker(worker) {
  return bumpAssetVersions(worker).replace(/escape-erezee-v\d+/g, `escape-erezee-v${VERSION}`);
}

await patchTextFile('server.mjs', patchServer);
await patchTextFile('app.js', patchApp);
await patchTextFile('styles.css', bumpAssetVersions);
await patchTextFile('index.html', bumpAssetVersions);
await patchTextFile('suivi.html', bumpAssetVersions);
await patchTextFile('service-worker.js', patchServiceWorker);

console.log(`Post deploy version and admin health display fix v${VERSION} applied.`);
