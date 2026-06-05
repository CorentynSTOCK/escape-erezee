import { mkdir, readFile, writeFile } from 'node:fs/promises';

const VERSION = 145;
const EXTRA_POSTS = [
  ['blog/activite-enfant-erezee.html', 'Activite enfant a Erezee', 'Une idee d activite enfant a Erezee : marcher, observer, resoudre des enigmes et decouvrir l Ardenne en famille.', '/assets/home-hero-ardenne-v88.jpg?v=145', 'Pour occuper les enfants a Erezee, le plus efficace est souvent de transformer la promenade en mission. Un parcours d enigmes donne un but clair, tout en gardant le plaisir d etre dehors.'],
  ['blog/escape-game-pres-de-durbuy.html', 'Escape game pres de Durbuy', 'Vous cherchez un escape game pres de Durbuy ? Stock & Sevrin propose des parcours exterieurs a Erezee, en Ardenne belge.', '/assets/home-hero-vicinal-v90.jpg?v=145', 'Pres de Durbuy, un escape game exterieur permet de varier les activites touristiques classiques. A Erezee, le jeu se vit dehors, avec une carte, des zones GPS et des enigmes.'],
  ['blog/week-end-famille-ardenne.html', 'Week-end famille en Ardenne', 'Organiser un week-end famille en Ardenne : nature, Durbuy, Erezee, balade et escape game exterieur.', '/assets/balises-blier-cover.png', 'Un bon week-end famille en Ardenne alterne temps calme, balade, decouverte et activite originale. Un parcours d enigmes peut devenir le moment fort du sejour.'],
  ['blog/idee-sortie-groupe-ardenne.html', 'Idee de sortie groupe en Ardenne', 'Une idee de sortie groupe en Ardenne pour amis, familles ou petites equipes : escape game exterieur et chasse au tresor.', '/assets/sur-les-traces-du-vicinal-cover.png', 'Une sortie de groupe reussie doit etre facile a lancer, claire a comprendre et assez active pour impliquer tout le monde. Le jeu d enigmes exterieur coche ces cases.'],
];

async function patchTextFile(filePath, patcher) {
  const input = await readFile(filePath, 'utf8');
  const output = patcher(input);
  if (output !== input) await writeFile(filePath, output, 'utf8');
}
async function patchOptionalTextFile(filePath, patcher) {
  try { await patchTextFile(filePath, patcher); }
  catch (error) { if (error.code !== 'ENOENT') throw error; }
}
function bump(text) {
  return text
    .replace(/styles\.css\?v=\d+/g, `styles.css?v=${VERSION}`)
    .replace(/app\.js\?v=\d+/g, `app.js?v=${VERSION}`)
    .replace(/seo-pages\.css\?v=\d+/g, `seo-pages.css?v=${VERSION}`)
    .replace(/escape-erezee-v\d+/g, `escape-erezee-v${VERSION}`);
}
function blockEnd(input, start) {
  const body = input.indexOf('{', start);
  if (body < 0) return -1;
  let depth = 0, quote = null, escaped = false;
  for (let index = body; index < input.length; index += 1) {
    const char = input[index];
    if (quote) {
      if (escaped) escaped = false;
      else if (char === '\\') escaped = true;
      else if (char === quote) quote = null;
      continue;
    }
    if (char === '"' || char === "'" || char === '`') { quote = char; continue; }
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
  const end = blockEnd(input, start);
  if (end < 0) throw new Error(`Patch v${VERSION} impossible: ${signature}`);
  return input.slice(0, start) + replacement + input.slice(end);
}
function insertAfterBlock(input, signature, insertion, guard) {
  if (input.includes(guard)) return input;
  const start = input.indexOf(signature);
  if (start < 0) throw new Error(`Patch v${VERSION} introuvable: ${signature}`);
  const end = blockEnd(input, start);
  if (end < 0) throw new Error(`Patch v${VERSION} impossible: ${signature}`);
  return input.slice(0, end) + '\n\n' + insertion + input.slice(end);
}

const SERVER_HELPERS = String.raw`
/* growth-admin-tools-v145 */
function normalizeReviewsV145(reviews) {
  const fallback = [
    { name: 'Sophie', text: 'Super activite en famille, les enfants ont adore !', rating: 5 },
    { name: 'Julien', text: 'Une belle decouverte de la region tout en s amusant.', rating: 5 },
    { name: 'Marie', text: 'Parcours clair, nature superbe et enigmes bien dosees.', rating: 5 },
  ];
  return (Array.isArray(reviews) && reviews.length ? reviews : fallback)
    .map((review) => ({ name: compactText(review?.name).slice(0, 80) || 'Client', text: compactText(review?.text).slice(0, 320), rating: Math.min(5, Math.max(1, Math.round(Number(review?.rating) || 5))) }))
    .filter((review) => review.text).slice(0, 6);
}
function normalizePhotosV145(photos) {
  const fallback = [
    { src: '/assets/home-hero-vicinal-v90.jpg?v=145', alt: 'Ambiance de parcours exterieur en Ardenne', caption: 'Chemins et patrimoine autour des parcours' },
    { src: '/assets/home-hero-ardenne-v88.jpg?v=145', alt: 'Paysage ardennais pres d Erezee', caption: 'Nature et villages d Erezee' },
    { src: '/assets/balises-blier-cover.png', alt: 'Ambiance du parcours de Blier', caption: 'Indices et exploration en equipe' },
  ];
  return (Array.isArray(photos) && photos.length ? photos : fallback)
    .map((photo) => ({ src: compactText(photo?.src || photo?.url).slice(0, 500), alt: compactText(photo?.alt || photo?.caption).slice(0, 140) || 'Photo locale', caption: compactText(photo?.caption || photo?.alt).slice(0, 160) }))
    .filter((photo) => photo.src).slice(0, 8);
}
async function readGrowthSettingsV145() {
  const raw = await readJsonFileV138(ADMIN_SETTINGS_FILE_V138, {});
  return { ok: true, reviewUrl: compactText(raw.reviewUrl || raw.googleReviewUrl) || PUBLIC_REVIEW_URL_V143, businessName: 'Stock & Sevrin Escape Games', area: 'Erezee, Ardenne belge', reviews: normalizeReviewsV145(raw.reviews), localPhotos: normalizePhotosV145(raw.localPhotos), updatedAt: raw.publicSettingsUpdatedAt || null };
}
async function saveGrowthSettingsV145(payload) {
  const raw = await readJsonFileV138(ADMIN_SETTINGS_FILE_V138, {});
  await writeJsonFileV138(ADMIN_SETTINGS_FILE_V138, { ...raw, reviewUrl: compactText(payload?.reviewUrl).slice(0, 500), reviews: normalizeReviewsV145(payload?.reviews), localPhotos: normalizePhotosV145(payload?.localPhotos), publicSettingsUpdatedAt: Date.now() });
  return readGrowthSettingsV145();
}
function csvCellV145(value) { return '"' + String(value == null ? '' : value).replace(/\r?\n/g, ' ').replace(/"/g, '""').trim() + '"'; }
function csvLineV145(values) { return values.map(csvCellV145).join(','); }
function dateCsvV145(value) { const timestamp = Number(value); return Number.isFinite(timestamp) && timestamp > 0 ? new Date(timestamp).toISOString() : ''; }
function revenueCentsV145(code, route) { const actual = Number(code?.amountTotalCents || code?.stripeAmountTotal || code?.amount_total); return Number.isFinite(actual) && actual >= 0 ? actual : getRoutePriceCents(route) * getPlayerCount(code?.playerCount || 1); }
async function buildExportCsvV145(type) {
  const stored = await readStoredData();
  if (!stored) throw new Error('Aucune donnee serveur disponible.');
  const routes = Array.isArray(stored.routes) ? stored.routes : [], codes = Array.isArray(stored.codes) ? stored.codes : [], teams = Array.isArray(stored.teams) ? stored.teams : [];
  const routeById = new Map(routes.map((route) => [route.id, route]));
  const safeType = compactText(type || 'sales').toLowerCase();
  if (safeType === 'teams') {
    return { filename: 'equipes-' + new Date().toISOString().slice(0, 10) + '.csv', content: [csvLineV145(['team_id','nom','code','parcours','statut','enigmes_resolues','enigmes_total','debut','fin','derniere_synchro','lat','lng']), ...teams.map((team) => { const route = routeById.get(team.routeId), progress = getProgressV143(team, route); return csvLineV145([team.id, team.name, team.code, route?.title || team.routeId, team.status || 'playing', progress.solved, progress.total, dateCsvV145(team.startAt), dateCsvV145(team.finishedAt), dateCsvV145(getTeamLastActivityV136(team)), team.lastPosition?.lat ?? '', team.lastPosition?.lng ?? '']); })].join('\n') };
  }
  if (safeType === 'codes') {
    return { filename: 'codes-' + new Date().toISOString().slice(0, 10) + '.csv', content: [csvLineV145(['code','parcours','statut','source','equipe','client','email','participants','cree_le','mail_statut']), ...codes.map((code) => { const route = routeById.get(code.routeId), team = teams.find((item) => item.id === code.teamId || item.code === code.code); return csvLineV145([code.code, route?.title || code.routeId, code.status || 'available', code.source || 'admin', team?.name || code.teamId || '', code.customerName || [code.customerFirstName, code.customerLastName].filter(Boolean).join(' '), code.customerEmail || '', code.playerCount || '', dateCsvV145(code.createdAt), code.confirmationEmailSentAt ? 'sent' : code.confirmationEmailStatus || '']); })].join('\n') };
  }
  return { filename: 'ventes-' + new Date().toISOString().slice(0, 10) + '.csv', content: [csvLineV145(['date','code','parcours','source','client','email','participants','montant_eur','stripe_session','test_interne']), ...codes.filter((code) => code.source === 'stripe' || code.customerEmail || code.customerName).map((code) => { const route = routeById.get(code.routeId); return csvLineV145([dateCsvV145(code.createdAt), code.code, route?.title || code.routeId, code.source || 'admin', code.customerName || [code.customerFirstName, code.customerLastName].filter(Boolean).join(' '), code.customerEmail || '', code.playerCount || '', (revenueCentsV145(code, route) / 100).toFixed(2), code.stripeSessionId || '', code.internalTest ? 'oui' : '']); })].join('\n') };
}
function currentPuzzleV145(team, route) { const answers = team?.answers && typeof team.answers === 'object' ? team.answers : {}; return route?.puzzles?.find((puzzle) => !answers[puzzle.id]) || route?.puzzles?.[route.puzzles.length - 1] || null; }
function adviceV145(team, code, route) {
  const now = Date.now(), lastActivityAt = team ? getTeamLastActivityV136(team) : null, inactiveMinutes = lastActivityAt ? Math.round((now - lastActivityAt) / 60000) : null, currentPuzzle = team ? currentPuzzleV145(team, route) : null, progress = team ? getProgressV143(team, route) : { solved: 0, total: route?.puzzles?.length || 0, percent: 0 }, advice = [];
  if (!team && code?.status !== 'used') advice.push('Code disponible : dites au client d aller dans Jouer puis de saisir le code exactement comme dans l e-mail.', 'Si le code est refuse, verifier les tirets, les espaces et actualiser la page.');
  else if (!team) advice.push('Aucune equipe active trouvee pour ce code. Verifier que le client utilise le bon appareil et le bon code.');
  else {
    if (team.status === 'briefing') advice.push('L equipe est au briefing : lui demander d autoriser le GPS et de se rapprocher du point de depart.');
    if (team.status === 'won') advice.push('L equipe a termine le parcours. Proposer de laisser un avis et de telecharger sa photo souvenir.');
    if (team.status === 'lost') advice.push('Le temps est ecoule. Proposer un nouveau code si necessaire.');
    if (team.status === 'playing' && inactiveMinutes != null && inactiveMinutes >= 3) advice.push('Derniere synchro il y a ' + inactiveMinutes + ' min : demander d ouvrir la page, garder internet actif puis appuyer sur geolocaliser.');
    if (team.status === 'playing' && !team.lastPosition) advice.push('Aucune position GPS visible : verifier localisation, reseau mobile et economie d energie.');
    if (team.status === 'playing' && currentPuzzle) advice.push('Elle semble bloquee vers : ' + (currentPuzzle.title || currentPuzzle.place || currentPuzzle.id) + '.');
    if (!advice.length) advice.push('Progression coherente : aucun blocage evident detecte.');
  }
  return { advice, currentPuzzle, progress, inactiveMinutes, lastActivityAt };
}
async function buildAssistantV145(query) {
  const stored = await readStoredData();
  if (!stored) throw new Error('Aucune donnee serveur disponible.');
  const routes = stored.routes || [], teams = stored.teams || [], codes = stored.codes || [], q = normalizeLookupValue(query || ''), routeById = new Map(routes.map((route) => [route.id, route]));
  const rows = [];
  for (const team of teams) {
    if (q && ![team.id, team.name, team.code].map(normalizeLookupValue).some((value) => value.includes(q))) continue;
    const code = codes.find((item) => item.code === team.code || item.teamId === team.id), route = routeById.get(team.routeId), helper = adviceV145(team, code, route);
    rows.push({ type: 'team', id: team.id, name: team.name || team.code || team.id, code: team.code || code?.code || '', routeTitle: route?.title || 'Parcours introuvable', status: team.status || 'playing', lastActivityAt: helper.lastActivityAt, inactiveMinutes: helper.inactiveMinutes, progress: helper.progress, currentPuzzle: helper.currentPuzzle ? { id: helper.currentPuzzle.id, title: helper.currentPuzzle.title || '', place: helper.currentPuzzle.place || '' } : null, hasPosition: Boolean(team.lastPosition), position: team.lastPosition || null, advice: helper.advice });
  }
  for (const code of codes) {
    if (rows.length >= 12) break;
    if (q && ![code.code, code.customerEmail, code.customerName].map(normalizeLookupValue).some((value) => value.includes(q))) continue;
    if (rows.some((row) => row.code === code.code)) continue;
    const route = routeById.get(code.routeId), team = teams.find((item) => item.id === code.teamId || item.code === code.code), helper = adviceV145(team, code, route);
    rows.push({ type: team ? 'team' : 'code', id: team?.id || code.code, name: team?.name || code.customerName || 'Code non lance', code: code.code, routeTitle: route?.title || 'Parcours introuvable', status: team?.status || code.status || 'available', lastActivityAt: helper.lastActivityAt, inactiveMinutes: helper.inactiveMinutes, progress: helper.progress, currentPuzzle: helper.currentPuzzle ? { id: helper.currentPuzzle.id, title: helper.currentPuzzle.title || '', place: helper.currentPuzzle.place || '' } : null, hasPosition: Boolean(team?.lastPosition), position: team?.lastPosition || null, advice: helper.advice });
  }
  return { ok: true, checkedAt: Date.now(), matches: rows.slice(0, 12) };
}
async function createLiveStripeTestV145(request) {
  const body = await readRequestBody(request), payload = body ? JSON.parse(body) : {};
  if (compactText(payload.confirm) !== 'CREATE_REAL_LIVE_CHECKOUT') throw new Error('Confirmation manquante pour creer une session de paiement reel.');
  const stored = await readStoredData();
  if (!stored) throw new Error('Aucune donnee serveur disponible.');
  const route = (stored.routes || []).find((item) => item.id === compactText(payload.routeId)) || (stored.routes || []).find((item) => item.shopVisible !== false && Number(item.pricePerPerson) > 0);
  if (!route) throw new Error('Aucun parcours vendable pour tester Stripe.');
  const origin = getRequestOrigin(request), params = new URLSearchParams();
  appendStripeParam(params, 'mode', 'payment'); appendStripeParam(params, 'client_reference_id', route.id); appendStripeParam(params, 'customer_creation', 'always'); appendStripeParam(params, 'billing_address_collection', 'required'); appendStripeParam(params, 'success_url', origin + '/index.html?checkout=success&session_id={CHECKOUT_SESSION_ID}&live_test=1#player'); appendStripeParam(params, 'cancel_url', origin + '/index.html#admin'); appendStripeParam(params, 'line_items[0][quantity]', 1); appendStripeParam(params, 'line_items[0][price_data][currency]', 'eur'); appendStripeParam(params, 'line_items[0][price_data][unit_amount]', 100); appendStripeParam(params, 'line_items[0][price_data][product_data][name]', 'Test paiement reel masque - ' + route.title); appendStripeParam(params, 'line_items[0][price_data][product_data][description]', 'Session de test interne Stock & Sevrin. Aucun parcours public n est modifie.'); appendStripeParam(params, 'metadata[routeId]', route.id); appendStripeParam(params, 'metadata[playerCount]', 1); appendStripeParam(params, 'metadata[internalTest]', 'true'); appendStripeParam(params, 'custom_text[submit][message]', 'Test reel interne a 1 euro. Le code sera genere uniquement si le paiement est valide.');
  const session = await stripeRequest('POST', '/v1/checkout/sessions', params);
  return { ok: true, url: session.url, sessionId: session.id, routeId: route.id, routeTitle: route.title, amountCents: 100 };
}
`;

const SITE_CONFIG_ENDPOINT = `  if (pathname === "/api/public/site-config") {
    if (request.method !== "GET") { sendJson(response, 405, { message: "Methode non autorisee." }); return true; }
    sendJson(response, 200, await readGrowthSettingsV145());
    return true;
  }`;
const ADMIN_ENDPOINTS = `  if (pathname === "/api/admin/public-settings") {
    if (!isAdminRequest(request)) { sendJson(response, 401, { message: "Connexion gestion requise." }); return true; }
    if (request.method === "GET") { sendJson(response, 200, await readGrowthSettingsV145()); return true; }
    if (request.method === "POST") { const body = await readRequestBody(request); sendJson(response, 200, await saveGrowthSettingsV145(body ? JSON.parse(body) : {})); return true; }
    sendJson(response, 405, { message: "Methode non autorisee." }); return true;
  }

  if (pathname === "/api/admin/export.csv") {
    if (!isAdminRequest(request)) { sendJson(response, 401, { message: "Connexion gestion requise." }); return true; }
    if (request.method !== "GET") { sendJson(response, 405, { message: "Methode non autorisee." }); return true; }
    const requestUrl = new URL(request.url, getRequestOrigin(request));
    const csv = await buildExportCsvV145(requestUrl.searchParams.get("type"));
    response.writeHead(200, { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": \`attachment; filename="\${csv.filename}"\`, "Cache-Control": "no-store" });
    response.end(\`\\uFEFF\${csv.content}\\n\`);
    return true;
  }

  if (pathname === "/api/admin/assistant-dashboard") {
    if (!isAdminRequest(request)) { sendJson(response, 401, { message: "Connexion gestion requise." }); return true; }
    if (request.method !== "GET") { sendJson(response, 405, { message: "Methode non autorisee." }); return true; }
    const requestUrl = new URL(request.url, getRequestOrigin(request));
    sendJson(response, 200, await buildAssistantV145(requestUrl.searchParams.get("query") || ""));
    return true;
  }

  if (pathname === "/api/admin/stripe-live-test") {
    if (!isAdminRequest(request)) { sendJson(response, 401, { message: "Connexion gestion requise." }); return true; }
    if (request.method !== "POST") { sendJson(response, 405, { message: "Methode non autorisee." }); return true; }
    sendJson(response, 200, await createLiveStripeTestV145(request));
    return true;
  }
`;
function patchServer(server) {
  let output = bump(server);
  output = insertAfterBlock(output, 'async function buildBusinessDashboardV143', SERVER_HELPERS + '\n', 'growth-admin-tools-v145');
  output = replaceBlock(output, '  if (pathname === "/api/public/site-config") {', SITE_CONFIG_ENDPOINT);
  output = insertAfterBlock(output, '  if (pathname === "/api/admin/business-dashboard") {', ADMIN_ENDPOINTS, 'pathname === "/api/admin/export.csv"');
  output = output.replace('    playerCount: getPlayerCount(session?.metadata?.playerCount),\n  };', '    playerCount: getPlayerCount(session?.metadata?.playerCount),\n    amountTotalCents: Number.isFinite(Number(session?.amount_total)) ? Number(session.amount_total) : null,\n    currency: compactText(session?.currency) || "eur",\n    internalTest: session?.metadata?.internalTest === "true",\n  };');
  output = output.replace('      const price = getRoutePriceCents(route);\n      const count = getPlayerCount(code.playerCount || 1);\n      return sum + price * count;', '      return sum + revenueCentsV145(code, route);');
  return output;
}

const APP_PATCH = String.raw`
/* growth-admin-tools-ui-v145 */
const ADMIN_PUBLIC_SETTINGS_URL_V145 = "/api/admin/public-settings";
const ADMIN_EXPORT_URL_V145 = "/api/admin/export.csv";
const ADMIN_ASSISTANT_URL_V145 = "/api/admin/assistant-dashboard";
const ADMIN_STRIPE_TEST_URL_V145 = "/api/admin/stripe-live-test";
let publicGrowthSettingsV145 = null;
function escV145(value) { return String(value == null ? "" : value).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;"); }
function starsV145(rating) { const count = Math.min(5, Math.max(1, Math.round(Number(rating) || 5))); return "★".repeat(count) + "☆".repeat(5 - count); }
function timeV145(value) { if (!value) return "jamais"; try { return new Intl.DateTimeFormat("fr-BE", { dateStyle: "short", timeStyle: "short" }).format(new Date(Number(value))); } catch { return "date indisponible"; } }
async function fetchJsonV145(url, options) { const response = await fetch(url, Object.assign({ credentials: "same-origin", cache: "no-store", headers: { Accept: "application/json" } }, options || {})); const payload = await response.json().catch(function () { return {}; }); if (!response.ok) throw new Error(payload.message || "Information indisponible."); return payload; }
async function loadPublicGrowthV145() { try { const response = await fetch("/api/public/site-config", { credentials: "same-origin", cache: "no-store", headers: { Accept: "application/json" } }); if (!response.ok) return; publicGrowthSettingsV145 = await response.json(); if (typeof publicSiteConfigV143 !== "undefined") publicSiteConfigV143 = publicGrowthSettingsV145; renderReviewsV145(); renderPhotosV145(); } catch {} }
function renderReviewsV145() { const grid = document.querySelector("#customer-reviews-v143 .reviews-grid-v143"); const reviews = Array.isArray(publicGrowthSettingsV145?.reviews) ? publicGrowthSettingsV145.reviews : []; if (!grid || !reviews.length) return; grid.innerHTML = reviews.map(function (review) { return '<article><strong>' + escV145(starsV145(review.rating)) + '</strong><p>' + escV145(review.text) + '</p><span>- ' + escV145(review.name) + '</span></article>'; }).join(""); }
function renderPhotosV145() { const shopPanel = document.querySelector(".shop-panel"); const photos = Array.isArray(publicGrowthSettingsV145?.localPhotos) ? publicGrowthSettingsV145.localPhotos : []; if (!shopPanel || !photos.length || document.querySelector("#local-photos-v145")) return; const section = document.createElement("section"); section.className = "local-photos-v145"; section.id = "local-photos-v145"; section.innerHTML = '<div><p class="section-label">Ambiance locale</p><h2>Erezee, Blier et Ardenne</h2></div><div class="local-photos-grid-v145">' + photos.slice(0, 4).map(function (photo) { return '<figure><img src="' + escV145(photo.src) + '" alt="' + escV145(photo.alt || '') + '" loading="lazy" /><figcaption>' + escV145(photo.caption || photo.alt || '') + '</figcaption></figure>'; }).join("") + '</div>'; (document.querySelector("#customer-reviews-v143") || shopPanel).insertAdjacentElement("afterend", section); }
function adminPanelV145() { const adminContent = document.querySelector("#admin-content"); if (!adminContent) return null; let panel = document.querySelector("#admin-tools-v145"); if (panel) return panel; panel = document.createElement("section"); panel.className = "admin-tools-panel-v145"; panel.id = "admin-tools-v145"; panel.innerHTML = '<div class="admin-tools-head-v145"><div><p class="section-label">Outils commerciaux</p><h3>Avis, exports et assistance</h3><p id="admin-tools-status-v145">Chargement.</p></div><button class="secondary-button compact-button" type="button" id="admin-tools-refresh-v145">Actualiser</button></div><div class="admin-tools-grid-v145"><article class="admin-tools-card-v145 admin-tools-wide-v145" id="admin-public-settings-v145"></article><article class="admin-tools-card-v145" id="admin-export-card-v145"></article><article class="admin-tools-card-v145 admin-tools-wide-v145" id="admin-assistant-card-v145"></article><article class="admin-tools-card-v145" id="admin-stripe-test-card-v145"></article></div>'; (document.querySelector("#admin-growth-v143") || document.querySelector("#admin-ops-v138") || adminContent).insertAdjacentElement("afterend", panel); panel.querySelector("#admin-tools-refresh-v145")?.addEventListener("click", refreshAdminToolsV145); return panel; }
function reviewInputsV145(settings) { const reviews = Array.isArray(settings?.reviews) ? settings.reviews.slice(0, 3) : []; while (reviews.length < 3) reviews.push({ name: "", text: "", rating: 5 }); return reviews.map(function (review, index) { return '<div class="admin-tools-review-v145"><label>Nom ' + (index + 1) + '<input data-review-name-v145="' + index + '" value="' + escV145(review.name || '') + '" /></label><label>Avis ' + (index + 1) + '<textarea data-review-text-v145="' + index + '" rows="3">' + escV145(review.text || '') + '</textarea></label></div>'; }).join(""); }
function renderAdminToolsV145(settings) { document.querySelector("#admin-public-settings-v145").innerHTML = '<p class="section-label">Google Avis</p><h4>Lien public et avis affiches</h4><label>Lien Google Avis<input id="admin-review-url-v145" type="url" value="' + escV145(settings.reviewUrl || '') + '" placeholder="https://search.google.com/local/writereview?placeid=..." /></label><div class="admin-tools-review-grid-v145">' + reviewInputsV145(settings) + '</div><div class="admin-tools-actions-v145"><button class="secondary-button compact-button" type="button" id="admin-settings-save-v145">Enregistrer</button><a class="text-button" target="_blank" rel="noopener" href="' + escV145(settings.reviewUrl || '#') + '">Tester le lien avis</a></div><p class="admin-tools-muted-v145">Des que tu as de vrais avis clients, remplace les exemples ici.</p>'; document.querySelector("#admin-export-card-v145").innerHTML = '<p class="section-label">Exports CSV</p><h4>Compta et suivi</h4><div class="admin-tools-actions-v145"><a class="secondary-button compact-button" href="' + ADMIN_EXPORT_URL_V145 + '?type=sales">Ventes</a><a class="secondary-button compact-button" href="' + ADMIN_EXPORT_URL_V145 + '?type=codes">Codes</a><a class="secondary-button compact-button" href="' + ADMIN_EXPORT_URL_V145 + '?type=teams">Equipes</a></div>'; document.querySelector("#admin-assistant-card-v145").innerHTML = '<p class="section-label">Mini assistance</p><h4>Retrouver vite une equipe</h4><div class="admin-assistant-search-v145"><input id="admin-assistant-query-v145" placeholder="Code, nom equipe ou e-mail" /><button class="secondary-button compact-button" type="button" id="admin-assistant-search-v145">Chercher</button></div><div class="admin-assistant-results-v145" id="admin-assistant-results-v145"><p class="admin-tools-muted-v145">Entrez un code pour voir la derniere synchro et quoi dire au client.</p></div>'; const options = (data.routes || []).filter(function (route) { return route.shopVisible !== false && Number(route.pricePerPerson) > 0; }).map(function (route) { return '<option value="' + escV145(route.id) + '">' + escV145(route.title) + '</option>'; }).join(""); document.querySelector("#admin-stripe-test-card-v145").innerHTML = '<p class="section-label">Stripe reel</p><h4>Test masque a 1 euro</h4><select id="admin-stripe-test-route-v145">' + options + '</select><button class="secondary-button compact-button" type="button" id="admin-stripe-test-v145">Creer le checkout test</button><p class="admin-tools-muted-v145" id="admin-stripe-result-v145">Paiement reel a lancer volontairement.</p>'; document.querySelector("#admin-settings-save-v145")?.addEventListener("click", saveAdminSettingsV145); document.querySelector("#admin-assistant-search-v145")?.addEventListener("click", searchAssistantV145); document.querySelector("#admin-stripe-test-v145")?.addEventListener("click", createStripeTestV145); }
async function refreshAdminToolsV145() { const panel = adminPanelV145(); if (!panel) return; try { const settings = await fetchJsonV145(ADMIN_PUBLIC_SETTINGS_URL_V145); publicGrowthSettingsV145 = settings; if (typeof publicSiteConfigV143 !== "undefined") publicSiteConfigV143 = settings; renderAdminToolsV145(settings); document.querySelector("#admin-tools-status-v145").textContent = "Derniere actualisation : " + timeV145(Date.now()); } catch (error) { document.querySelector("#admin-tools-status-v145").textContent = error.message || "Outils indisponibles."; } }
async function saveAdminSettingsV145() { const reviews = [0,1,2].map(function (index) { return { name: document.querySelector('[data-review-name-v145="' + index + '"]')?.value || '', text: document.querySelector('[data-review-text-v145="' + index + '"]')?.value || '', rating: 5 }; }); const payload = await fetchJsonV145(ADMIN_PUBLIC_SETTINGS_URL_V145, { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify({ reviewUrl: document.querySelector("#admin-review-url-v145")?.value || "", reviews }) }); publicGrowthSettingsV145 = payload; renderReviewsV145(); showToast("Avis et lien Google mis a jour."); refreshAdminToolsV145(); }
async function searchAssistantV145() { const results = document.querySelector("#admin-assistant-results-v145"); results.innerHTML = '<p class="admin-tools-muted-v145">Recherche en cours...</p>'; try { const payload = await fetchJsonV145(ADMIN_ASSISTANT_URL_V145 + '?query=' + encodeURIComponent(document.querySelector("#admin-assistant-query-v145")?.value || '')); const matches = Array.isArray(payload.matches) ? payload.matches : []; results.innerHTML = matches.length ? matches.map(function (match) { return '<article class="admin-assistant-result-v145"><strong>' + escV145(match.name) + '</strong><span>' + escV145(match.code || '') + ' - ' + escV145(match.routeTitle) + '</span><div class="admin-tools-mini-v145"><span>' + escV145(match.status) + '</span><span>' + (match.progress?.solved || 0) + '/' + (match.progress?.total || 0) + '</span><span>Sync ' + escV145(timeV145(match.lastActivityAt)) + '</span><span>' + (match.hasPosition ? 'GPS ok' : 'Sans GPS') + '</span></div><ul>' + (match.advice || []).map(function (item) { return '<li>' + escV145(item) + '</li>'; }).join('') + '</ul></article>'; }).join('') : '<p class="admin-tools-muted-v145">Aucun resultat.</p>'; } catch (error) { results.innerHTML = '<p class="form-message">' + escV145(error.message || 'Recherche impossible.') + '</p>'; } }
async function createStripeTestV145() { if (!window.confirm("Ce bouton cree une vraie session Stripe LIVE a 1 euro. Continuer ?")) return; const result = document.querySelector("#admin-stripe-result-v145"); try { const payload = await fetchJsonV145(ADMIN_STRIPE_TEST_URL_V145, { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify({ confirm: "CREATE_REAL_LIVE_CHECKOUT", routeId: document.querySelector("#admin-stripe-test-route-v145")?.value || "" }) }); result.innerHTML = 'Session creee pour ' + escV145(payload.routeTitle) + ' : <a target="_blank" rel="noopener" href="' + escV145(payload.url) + '">ouvrir Stripe Checkout</a>'; } catch (error) { result.textContent = error.message || "Session Stripe impossible."; } }
if (typeof renderAdmin === "function" && !window.__growthAdminToolsV145) { window.__growthAdminToolsV145 = true; const oldAdminV145 = renderAdmin; renderAdmin = function () { const result = oldAdminV145.apply(this, arguments); window.setTimeout(function () { adminPanelV145(); refreshAdminToolsV145(); }, 0); return result; }; const oldShopV145 = renderShop; renderShop = function () { const result = oldShopV145.apply(this, arguments); renderReviewsV145(); renderPhotosV145(); return result; }; }
loadPublicGrowthV145(); window.setTimeout(function () { renderReviewsV145(); renderPhotosV145(); if (isAdminRouteActive()) refreshAdminToolsV145(); }, 1600);
`;
function patchApp(app) { return app.includes('growth-admin-tools-ui-v145') ? bump(app) : bump(app).trimEnd() + '\n' + APP_PATCH + '\n'; }
function patchStyles(css) {
  if (css.includes('growth-admin-tools-ui-v145')) return bump(css);
  return bump(css).trimEnd() + `

/* growth-admin-tools-ui-v145 */
.admin-tools-panel-v145,.local-photos-v145{display:grid;gap:16px;margin-top:18px;padding:18px;border:1px solid var(--line);border-radius:var(--radius);background:#fff}.admin-tools-panel-v145{background:#fbfaf6}.admin-tools-head-v145,.admin-tools-actions-v145,.admin-assistant-search-v145,.admin-tools-mini-v145{display:flex;flex-wrap:wrap;gap:10px;align-items:center}.admin-tools-head-v145{justify-content:space-between;align-items:flex-start}.admin-tools-head-v145 h3,.admin-tools-card-v145 h4,.local-photos-v145 h2{margin:2px 0 6px;color:var(--green)}.admin-tools-grid-v145,.local-photos-grid-v145{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:12px}.admin-tools-card-v145,.local-photos-grid-v145 figure,.admin-assistant-result-v145{display:grid;gap:10px;padding:14px;border:1px solid var(--line);border-radius:var(--radius);background:#fff}.admin-tools-wide-v145{grid-column:1/-1}.admin-tools-card-v145 label,.admin-tools-review-v145{display:grid;gap:6px;color:var(--ink);font-weight:850}.admin-tools-card-v145 input,.admin-tools-card-v145 textarea,.admin-tools-card-v145 select,.admin-assistant-search-v145 input{width:100%;border:1px solid var(--line);border-radius:var(--radius);padding:10px;font:inherit}.admin-tools-review-grid-v145{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:10px}.admin-tools-muted-v145,.local-photos-grid-v145 figcaption,.admin-assistant-result-v145 span,.admin-assistant-result-v145 li{margin:0;color:var(--muted);line-height:1.45}.admin-tools-mini-v145 span{display:inline-flex;min-height:28px;align-items:center;padding:0 9px;border-radius:999px;background:rgba(31,106,88,.1);color:var(--green);font-size:.78rem;font-weight:900}.admin-assistant-results-v145{display:grid;gap:10px}.admin-assistant-result-v145 ul{margin:0;padding-left:18px}.local-photos-grid-v145 figure{margin:0;padding:0;overflow:hidden}.local-photos-grid-v145 img{width:100%;aspect-ratio:4/3;object-fit:cover;background:#eef4f0}.local-photos-grid-v145 figcaption{padding:0 12px 12px;font-weight:800}@media(max-width:720px){.admin-tools-head-v145,.admin-assistant-search-v145{display:grid}}
`;
}
function escapeHtml(value) { return String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
function blogPage([path, title, desc, image, intro]) {
  return `<!doctype html><html lang="fr-BE"><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /><meta name="robots" content="index, follow, max-image-preview:large" /><meta name="description" content="${escapeHtml(desc)}" /><link rel="canonical" href="https://escape-erezee.be/${path}" /><link rel="stylesheet" href="/seo-pages.css?v=145" /><title>${escapeHtml(title)} | Stock & Sevrin Escape Games</title><meta property="og:type" content="article" /><meta property="og:title" content="${escapeHtml(title)}" /><meta property="og:description" content="${escapeHtml(desc)}" /><meta property="og:image" content="https://escape-erezee.be${escapeHtml(image)}" /></head><body><header class="site-header"><a class="brand" href="/index.html#home">Stock & Sevrin <span>Escape Games</span></a><nav aria-label="Navigation contenu"><a href="/escape-game-exterieur-ardenne.html">Escape game Ardenne</a><a href="/activite-famille-ardenne.html">Famille</a><a href="/activite-pres-de-durbuy.html">Durbuy</a><a href="/blog/">Blog</a><a class="reserve-link" href="/index.html#shop">Reserver</a></nav></header><main><article class="article"><p class="eyebrow">Actualites Ardenne</p><h1>${escapeHtml(title)}</h1><img src="${escapeHtml(image)}" alt="" /><p class="lead">${escapeHtml(intro)}</p><section><h2>Pourquoi choisir cette activite ?</h2><p>Le parcours transforme la balade en mission d equipe : observer, chercher les indices, resoudre les enigmes et decouvrir la region autrement.</p></section><section><h2>Comment s organiser</h2><p>Reservez en ligne, recevez votre code par e-mail, rendez-vous au point de depart avec un smartphone charge et laissez l application vous guider.</p></section><aside class="notice"><strong>Prudence pendant les periodes de chasse</strong><p>Avant de partir, verifiez les informations locales, respectez les panneaux sur place et reportez le parcours si une zone est fermee.</p></aside><section><h2>Continuer la decouverte</h2><div class="article-links"><a href="/index.html#shop">Reserver un parcours</a><a href="/activite-famille-ardenne.html">Activite famille Ardenne</a><a href="/blog/">Tous les articles</a></div></section></article></main><footer class="site-footer"><p>Stock & Sevrin Escape Games - parcours d enigmes exterieurs a Erezee.</p><a href="/index.html#shop">Voir les parcours disponibles</a></footer></body></html>`;
}
async function writeBlogPosts() { await mkdir('blog', { recursive: true }); await Promise.all(EXTRA_POSTS.map((post) => writeFile(post[0], blogPage(post), 'utf8'))); }
function patchBlogIndex(html) {
  let output = bump(html);
  if (output.includes('activite-enfant-erezee.html')) return output;
  const cards = EXTRA_POSTS.map((post) => `<article><img src="${post[3]}" alt="" loading="lazy" /><div><h2><a href="/${post[0]}">${escapeHtml(post[1])}</a></h2><p>${escapeHtml(post[2])}</p></div></article>`).join('\n');
  return output.replace('</main>', `<section class="content-grid extra-blog-v145" aria-labelledby="extra-blog-v145-title"><p class="eyebrow">Nouveaux conseils</p><h2 id="extra-blog-v145-title">Encore plus d idees pour l Ardenne</h2>${cards}</section></main>`);
}
function patchStaticPhotos(html) {
  let output = bump(html);
  if (output.includes('local-photo-strip-v145')) return output;
  const block = '<section class="content-grid local-photo-strip-v145" aria-labelledby="local-photo-strip-title-v145"><p class="eyebrow">Photos locales</p><h2 id="local-photo-strip-title-v145">Ambiance des parcours</h2><article><img src="/assets/home-hero-vicinal-v90.jpg?v=145" alt="Ambiance de parcours exterieur en Ardenne" loading="lazy" /><p>Chemins, villages et patrimoine servent de terrain de jeu.</p></article><article><img src="/assets/home-hero-ardenne-v88.jpg?v=145" alt="Paysage ardennais autour d Erezee" loading="lazy" /><p>Une activite a vivre dehors, au rythme de l equipe.</p></article></section>';
  return output.replace('</main>', block + '</main>');
}
function patchSitemap(server) {
  if (server.includes('blog/activite-enfant-erezee.html')) return server;
  return server.replace('  const routePages = (Array.isArray(routes) ? routes : []).map((route) => ({', "  staticPages.push(\n    { url: `${origin}/blog/activite-enfant-erezee.html`, priority: '0.76', changefreq: 'monthly' },\n    { url: `${origin}/blog/escape-game-pres-de-durbuy.html`, priority: '0.76', changefreq: 'monthly' },\n    { url: `${origin}/blog/week-end-famille-ardenne.html`, priority: '0.76', changefreq: 'monthly' },\n    { url: `${origin}/blog/idee-sortie-groupe-ardenne.html`, priority: '0.74', changefreq: 'monthly' },\n  );\n  const routePages = (Array.isArray(routes) ? routes : []).map((route) => ({");
}

await patchTextFile('server.mjs', (server) => patchSitemap(patchServer(server)));
await patchTextFile('app.js', patchApp);
await patchTextFile('styles.css', patchStyles);
await patchTextFile('index.html', bump);
await patchTextFile('suivi.html', bump);
await patchTextFile('service-worker.js', bump);
await writeBlogPosts();
await patchOptionalTextFile('blog/index.html', patchBlogIndex);
await patchOptionalTextFile('escape-game-exterieur-ardenne.html', patchStaticPhotos);
await patchOptionalTextFile('activite-famille-ardenne.html', patchStaticPhotos);
await patchOptionalTextFile('chasse-au-tresor-ardenne.html', patchStaticPhotos);
await patchOptionalTextFile('activite-touristique-erezee.html', patchStaticPhotos);
await patchOptionalTextFile('activite-pres-de-durbuy.html', patchStaticPhotos);
console.log(`Growth admin tools v${VERSION} applied.`);
