import { readFile, writeFile } from 'node:fs/promises';

const VERSION = 137;

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

function insertAfterBlock(input, signature, insertion, guard) {
  if (input.includes(guard)) return input;
  const start = input.indexOf(signature);
  if (start < 0) throw new Error(`Patch v${VERSION} introuvable: ${signature}`);
  const end = findBlockEnd(input, start);
  if (end < 0) throw new Error(`Patch v${VERSION} impossible: ${signature}`);
  return `${input.slice(0, end)}\n\n${insertion}${input.slice(end)}`;
}

async function publicUrlCheckV137(label, pathname, includes = []) {
  const baseUrl = String(PUBLIC_APP_URL || 'https://escape-erezee.be').replace(/\/$/, '');
  const cleanPath = String(pathname || '').replace(/^\//, '');
  const targetUrl = `${baseUrl}/${cleanPath}`;
  if (typeof fetch !== 'function') {
    return { id: `url-${cleanPath}`, label, status: 'warning', detail: 'Verification HTTP indisponible dans ce runtime.' };
  }
  try {
    const response = await fetch(`${targetUrl}?health=${Date.now()}`, { cache: 'no-store' });
    const text = await response.text();
    const missing = includes.filter((needle) => !text.includes(needle));
    const status = response.ok && !missing.length ? 'ok' : response.status >= 500 ? 'critical' : 'warning';
    return {
      id: `url-${cleanPath}`,
      label,
      status,
      detail: response.ok && !missing.length
        ? `${pathname} accessible publiquement.`
        : `${pathname} repond ${response.status}${missing.length ? `, contenu absent: ${missing.join(', ')}` : ''}.`,
    };
  } catch (error) {
    return { id: `url-${cleanPath}`, label, status: 'warning', detail: `${pathname} non verifie: ${error.message || 'requete impossible'}.` };
  }
}

async function runPostDeployChecksV136() {
  const health = await buildAdminHealthStatusV136();
  const staticChecks = await Promise.all([
    fileCheckV136('Accueil', 'index.html', ['app.js?v=137', 'styles.css?v=137']),
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
  let output = server;
  output = insertAfterBlock(output, 'async function fileCheckV136', `${publicUrlCheckV137.toString()}\n`, 'publicUrlCheckV137');
  output = replaceBlock(output, 'async function runPostDeployChecksV136', runPostDeployChecksV136.toString());
  return output;
}

function patchApp(app) {
  return bumpAssetVersions(app).replace(/Simuler 6 joueurs/g, 'Simuler joueurs');
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

console.log(`Admin health check fix v${VERSION} applied.`);
