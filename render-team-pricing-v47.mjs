import { readFile, writeFile } from "node:fs/promises";

const VERSION = 47;

async function patchTextFile(path, updater) {
  const before = await readFile(path, "utf8");
  const after = updater(before);
  if (after !== before) {
    await writeFile(path, after, "utf8");
  }
}

function block(fn) {
  const source = fn.toString();
  return source.slice(source.indexOf("/*") + 2, source.lastIndexOf("*/")).trim();
}

function replaceFunction(source, name, replacement) {
  const start = source.indexOf(`function ${name}`);
  if (start < 0) return source;
  const prefixStart = source.slice(Math.max(0, start - 6), start) === "async " ? start - 6 : start;
  const signatureStart = source.indexOf("(", start);
  if (signatureStart < 0) return source;
  let signatureDepth = 0;
  let signatureEnd = -1;
  for (let index = signatureStart; index < source.length; index += 1) {
    const char = source[index];
    if (char === "(") signatureDepth += 1;
    if (char === ")") {
      signatureDepth -= 1;
      if (signatureDepth === 0) {
        signatureEnd = index;
        break;
      }
    }
  }
  if (signatureEnd < 0) return source;
  const braceStart = source.indexOf("{", signatureEnd);
  if (braceStart < 0) return source;
  let depth = 0;
  let quote = null;
  let lineComment = false;
  let blockComment = false;
  for (let index = braceStart; index < source.length; index += 1) {
    const char = source[index];
    const next = source[index + 1];
    if (lineComment) {
      if (char === "\n") lineComment = false;
      continue;
    }
    if (blockComment) {
      if (char === "*" && next === "/") {
        blockComment = false;
        index += 1;
      }
      continue;
    }
    if (quote) {
      if (char === "\\") {
        index += 1;
        continue;
      }
      if (char === quote) quote = null;
      continue;
    }
    if (char === "/" && next === "/") {
      lineComment = true;
      index += 1;
      continue;
    }
    if (char === "/" && next === "*") {
      blockComment = true;
      index += 1;
      continue;
    }
    if (char === "\"" || char === "'" || char === "`") {
      quote = char;
      continue;
    }
    if (char === "{") depth += 1;
    if (char === "}") {
      depth -= 1;
      if (depth === 0) {
        return `${source.slice(0, prefixStart)}${replacement}\n${source.slice(index + 1)}`;
      }
    }
  }
  return source;
}

function ensureAfter(source, needle, insertion) {
  if (source.includes(insertion.trim())) return source;
  const index = source.indexOf(needle);
  if (index < 0) return source;
  return `${source.slice(0, index + needle.length)}${insertion}${source.slice(index + needle.length)}`;
}

function patchIndex(html) {
  let next = html
    .replace(/styles\.css\?v=\d+/g, `styles.css?v=${VERSION}`)
    .replace(/app\.js\?v=\d+/g, `app.js?v=${VERSION}`)
    .replace(/Prix par personne/g, "Prix par &eacute;quipe");

  if (!next.includes('id="route-distance"')) {
    next = next.replace(/(<span id="route-duration">[^<]*<\/span>\s*)/, `$1                    <span id="route-distance">3,2 km</span>\n`);
  }
  if (!next.includes('name="distance"')) {
    next = next.replace(/(\s*<label>\s*Dur[^<]*\s*<input name="duration"[^>]*>\s*<\/label>)/, `$1
                <label>
                  Distance approximative
                  <input name="distance" type="text" placeholder="3,2 km" value="3,2 km" />
                </label>`);
  }
  if (!next.includes('id="route-details-distance"')) {
    next = next.replace(/(\s*<label>\s*Dur[^<]*\s*<input id="route-details-duration"[^>]*>\s*<\/label>)/, `$1
                  <label>
                    Distance approximative
                    <input id="route-details-distance" name="route-details-distance" type="text" placeholder="3,2 km" />
                  </label>`);
  }
  return next;
}

function patchStyles(css) {
  if (css.includes(".shop-team-note")) return css;
  return `${css}

.shop-team-note {
  display: block;
  margin-top: 5px;
  color: var(--muted);
  font-size: 0.78rem;
  line-height: 1.35;
}
`;
}

function patchApp(app) {
  let next = app;
  next = ensureAfter(next, '  routePuzzleCount: $("#route-puzzle-count"),', '\n  routeDistance: $("#route-distance"),');
  next = ensureAfter(next, '  routeDetailsDurationInput: $("#route-details-duration"),', '\n  routeDetailsDistanceInput: $("#route-details-distance"),');
  if (!/duration:\s*90,\s*\n\s*distance:/.test(next)) {
    next = next.replace(/duration:\s*90,/, 'duration: 90,\n        distance: "3,2 km",');
  }
  if (!next.includes("pricePerTeam: 18")) {
    next = next.replace(/(\n\s*)pricePerPerson:\s*18,/, '$1pricePerTeam: 18,$1pricePerPerson: 18,');
  }

  next = replaceFunction(next, "getRoutePrice", block(function () {/*
function getRoutePrice(route) {
  const storedPrice = route?.pricePerTeam ?? route?.pricePerPerson;
  if (route && (storedPrice === undefined || storedPrice === null)) {
    return 18;
  }
  const price = Number(storedPrice);
  return Number.isFinite(price) && price >= 0 ? price : 0;
}
*/}));

  next = replaceFunction(next, "formatPrice", block(function () {/*
function formatPrice(value) {
  return new Intl.NumberFormat("fr-BE", {
    style: "currency",
    currency: "EUR",
  }).format(getRoutePrice({ pricePerTeam: value }));
}
*/}));

  if (!next.includes("function formatRouteDistance")) {
    next = ensureAfter(next, block(function () {/*
function formatPrice(value) {
  return new Intl.NumberFormat("fr-BE", {
    style: "currency",
    currency: "EUR",
  }).format(getRoutePrice({ pricePerTeam: value }));
}
*/}), `

function formatRouteDistance(route) {
  const value = String(route?.distance || "").trim();
  return value || "Distance \\u00e0 d\\u00e9finir";
}
`);
  }

  next = replaceFunction(next, "renderShop", block(function () {/*
function renderShop() {
  if (!els.shopList || !els.shopEmpty) return;
  const routes = getShopRoutes();
  els.shopEmpty.textContent = routes.length
    ? ""
    : "Aucun parcours n\u2019est ouvert \u00e0 la vente pour le moment.";
  els.shopList.innerHTML = routes
    .map((route) => {
      const price = getRoutePrice(route);
      const distance = formatRouteDistance(route);
      const coverImage = getRouteCoverImage(route);
      return `
        <article class="shop-route-card">
          <div class="shop-route-visual ${coverImage ? "has-image" : ""}" aria-hidden="true">
            ${coverImage ? `<img src="${escapeHtml(coverImage.dataUrl)}" alt="" />` : ""}
            <span>${escapeHtml(route.area || "Erez\u00e9e")}</span>
            <strong>${escapeHtml(distance)}</strong>
          </div>
          <div class="shop-route-copy">
            <span class="shop-badge">${escapeHtml(route.area || "Erez\u00e9e")}</span>
            <h3>${escapeHtml(route.title)}</h3>
            <p>${escapeHtml(route.description || "Parcours ext\u00e9rieur \u00e0 Erez\u00e9e.")}</p>
            <div class="metric-strip">
              <span class="metric">${route.duration || 90} min</span>
              <span class="metric">${escapeHtml(distance)}</span>
              <span class="metric">${route.puzzles?.length || 0} \u00e9nigmes</span>
              <span class="metric">${formatPrice(price)} / \u00e9quipe</span>
            </div>
          </div>
          <form class="shop-buy-form" data-shop-route="${escapeHtml(route.id)}">
            <label>
              Nombre d\u2019\u00e9quipes
              <input name="players" type="number" min="1" max="20" value="1" data-shop-player-count="${escapeHtml(route.id)}" />
              <span class="shop-team-note">Maximum conseill\u00e9 : 6 joueurs par \u00e9quipe.</span>
            </label>
            <strong data-shop-total="${escapeHtml(route.id)}">${formatPrice(price)}</strong>
            <button class="primary-button full-button" type="submit">Acheter</button>
            <p class="form-message" data-shop-message="${escapeHtml(route.id)}"></p>
          </form>
        </article>
      `;
    })
    .join("");

  $$("[data-shop-player-count]").forEach((input) => {
    input.addEventListener("input", updateShopTotal);
    input.addEventListener("change", updateShopTotal);
  });
  $$("[data-shop-route]").forEach((form) => {
    form.addEventListener("submit", startCheckout);
  });
}
*/}));

  next = replaceFunction(next, "updateShopTotal", block(function () {/*
function updateShopTotal(event) {
  const routeId = event.currentTarget.dataset.shopPlayerCount;
  const route = getRoute(routeId);
  if (!route) return;
  const teamCount = Math.min(20, Math.max(1, Number(event.currentTarget.value) || 1));
  event.currentTarget.value = String(teamCount);
  const total = els.shopList.querySelector(`[data-shop-total="${routeId}"]`);
  if (total) total.textContent = formatPrice(getRoutePrice(route) * teamCount);
}
*/}));

  next = replaceFunction(next, "startCheckout", block(function () {/*
async function startCheckout(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const routeId = form.dataset.shopRoute;
  const route = getRoute(routeId);
  const message = form.querySelector(`[data-shop-message="${routeId}"]`);
  const teamCount = Math.min(20, Math.max(1, Number(new FormData(form).get("players")) || 1));
  if (!route || !isRouteVisibleInShop(route)) {
    if (message) message.textContent = "Ce parcours n\u2019est pas disponible \u00e0 la vente.";
    return;
  }
  if (!canUseBackend()) {
    if (message) message.textContent = "Le paiement sera disponible sur le site en ligne.";
    return;
  }

  const button = form.querySelector("button[type='submit']");
  if (button) button.disabled = true;
  if (message) message.textContent = "Pr\u00e9paration du paiement s\u00e9curis\u00e9...";

  try {
    const response = await fetch(API_CHECKOUT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ routeId, teamCount }),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok || !payload.url) {
      throw new Error(payload.message || "Paiement indisponible pour le moment.");
    }
    window.location.href = payload.url;
  } catch (error) {
    if (message) message.textContent = error.message || "Paiement indisponible pour le moment.";
    if (button) button.disabled = false;
  }
}
*/}));

  next = replaceFunction(next, "renderRouteSummary", block(function () {/*
function renderRouteSummary(team, route, progress, currentIndex) {
  const step = Math.min(progress.total, Math.max(1, currentIndex + 1 || 1));
  els.routeArea.textContent = route.area || "Parcours";
  els.routeTitle.textContent = route.title || "Parcours";
  if (els.routeDuration) els.routeDuration.textContent = `${route.duration || 0} min`;
  if (els.routeDistance) els.routeDistance.textContent = formatRouteDistance(route);
  if (els.routePuzzleCount) {
    els.routePuzzleCount.textContent = `${progress.total} ${progress.total > 1 ? "\u00e9nigmes" : "\u00e9nigme"}`;
  }
  if (els.routeCurrentStep) {
    els.routeCurrentStep.textContent = team.status === "won"
      ? "Parcours termin\u00e9"
      : team.status === "briefing"
        ? "Briefing"
        : `\u00c9tape ${step} / ${progress.total}`;
  }

  const cover = getRouteCoverImage(route);
  if (!els.routeHero) return;
  els.routeHero.classList.toggle("has-cover", Boolean(cover));
  els.routeHero.style.backgroundImage = cover
    ? `linear-gradient(135deg, rgba(12, 34, 29, 0.9), rgba(18, 60, 50, 0.62)), url("${cover.dataUrl}")`
    : "";
}
*/}));

  next = next.replace(
    /<span class="metric">\$\{route\.duration\} min<\/span>\s*(?:<span class="metric">\$\{escapeHtml\(formatRouteDistance\(route\)\)\}<\/span>\s*)*<span class="metric">\$\{formatPrice\(getRoutePrice\(route\)\)\} \/ (?:personne|per team|\\u00e9quipe)<\/span>/g,
    '<span class="metric">${route.duration} min</span>\n              <span class="metric">${escapeHtml(formatRouteDistance(route))}</span>\n              <span class="metric">${formatPrice(getRoutePrice(route))} / \\u00e9quipe</span>',
  );

  next = replaceFunction(next, "renderRouteDetailsEditor", block(function () {/*
function renderRouteDetailsEditor(route) {
  if (!route) return;
  const activeRouteDetailFields = [
    els.routeDetailsTitleInput,
    els.routeDetailsAreaInput,
    els.routeDetailsDurationInput,
    els.routeDetailsDistanceInput,
    els.routeDetailsPriceInput,
    els.routeDetailsShopVisibleInput,
    els.routeDetailsDescriptionInput,
    els.routeDetailsBriefingInput,
    els.routeDetailsFinishInput,
    els.routeDetailsStartPlaceInput,
    els.routeDetailsStartAddressInput,
    els.routeDetailsStartLatInput,
    els.routeDetailsStartLngInput,
  ];
  if (activeRouteDetailFields.includes(document.activeElement)) return;
  els.routeDetailsTitleInput.value = route.title || "";
  els.routeDetailsAreaInput.value = route.area || "";
  els.routeDetailsDurationInput.value = String(route.duration || 90);
  els.routeDetailsDistanceInput.value = route.distance || "";
  els.routeDetailsPriceInput.value = String(getRoutePrice(route));
  els.routeDetailsShopVisibleInput.checked = isRouteVisibleInShop(route);
  els.routeDetailsDescriptionInput.value = route.description || "";
  els.routeDetailsBriefingInput.value = route.briefingText || "";
  els.routeDetailsFinishInput.value = route.finishMessage || "";
  els.routeDetailsStartPlaceInput.value = route.startPlace || "";
  els.routeDetailsStartAddressInput.value = route.startAddress || "";
  els.routeDetailsStartLatInput.value = formatOptionalCoordinate(route.startLat);
  els.routeDetailsStartLngInput.value = formatOptionalCoordinate(route.startLng);
  els.routeDetailsImageInput.value = "";
  renderRouteCoverPreview(route);
  els.routeDetailsMessage.textContent = `Modification de "${route.title}".`;
}
*/}));

  next = replaceFunction(next, "updateRouteDetailsDraft", block(function () {/*
function updateRouteDetailsDraft() {
  const route = getActiveRoute();
  if (!route) return;
  route.title = els.routeDetailsTitleInput.value.trim();
  route.area = els.routeDetailsAreaInput.value.trim();
  route.duration = Math.max(1, Number(els.routeDetailsDurationInput.value) || 90);
  route.distance = els.routeDetailsDistanceInput.value.trim();
  route.pricePerTeam = Math.max(0, Number(els.routeDetailsPriceInput.value) || 0);
  route.pricePerPerson = route.pricePerTeam;
  route.shopVisible = els.routeDetailsShopVisibleInput.checked;
  route.description = els.routeDetailsDescriptionInput.value.trim();
  route.briefingText = els.routeDetailsBriefingInput.value.trim();
  route.finishMessage = els.routeDetailsFinishInput.value.trim();
  route.startPlace = els.routeDetailsStartPlaceInput.value.trim();
  route.startAddress = els.routeDetailsStartAddressInput.value.trim();
  route.startLat = parseOptionalCoordinate(els.routeDetailsStartLatInput.value);
  route.startLng = parseOptionalCoordinate(els.routeDetailsStartLngInput.value);
  saveData();
  refreshRouteDetailsPreview(route);
  renderShop();
  renderPlayer();
}
*/}));

  next = replaceFunction(next, "refreshRouteDetailsPreview", block(function () {/*
function refreshRouteDetailsPreview(route) {
  const button = els.routeList.querySelector(`[data-set-route="${route.id}"]`);
  const card = button?.closest(".route-card");
  if (card) {
    const title = card.querySelector("h3");
    const description = card.querySelector("p");
    const metrics = card.querySelectorAll(".metric");
    if (title) title.textContent = route.title;
    if (description) description.textContent = route.description || route.area;
    if (metrics[0]) metrics[0].textContent = route.area;
    if (metrics[1]) metrics[1].textContent = `${route.duration} min`;
    if (metrics[2]) metrics[2].textContent = formatRouteDistance(route);
    if (metrics[3]) metrics[3].textContent = `${formatPrice(getRoutePrice(route))} / \u00e9quipe`;
    if (metrics[4]) {
      metrics[4].textContent = isRouteVisibleInShop(route) ? "Boutique visible" : "Boutique masqu\u00e9e";
      metrics[4].classList.toggle("is-success", isRouteVisibleInShop(route));
      metrics[4].classList.toggle("is-muted", !isRouteVisibleInShop(route));
    }
  }

  const activeOption = els.routeSelect.querySelector(`option[value="${route.id}"]`);
  if (activeOption) activeOption.textContent = route.title;
}
*/}));

  next = replaceFunction(next, "createRoute", block(function () {/*
async function createRoute(event) {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  const imageFile = form.get("cover-image");
  const route = {
    id: createId("route"),
    title: String(form.get("title")).trim(),
    area: String(form.get("area")).trim(),
    duration: Number(form.get("duration")) || 90,
    distance: String(form.get("distance") || "").trim() || "\u00c0 d\u00e9finir",
    pricePerTeam: Math.max(0, Number(form.get("price")) || 0),
    pricePerPerson: Math.max(0, Number(form.get("price")) || 0),
    shopVisible: form.get("shop-visible") === "on",
    description: String(form.get("description")).trim(),
    briefingText: String(form.get("briefing-text") || "").trim(),
    finishMessage: String(form.get("finish-message") || "").trim(),
    startPlace: String(form.get("start-place") || "").trim(),
    startAddress: String(form.get("start-address") || "").trim(),
    startLat: parseOptionalCoordinate(form.get("start-lat")),
    startLng: parseOptionalCoordinate(form.get("start-lng")),
    puzzles: [],
  };

  if (imageFile?.size) {
    try {
      route.coverImage = await prepareRouteCoverImage(imageFile);
    } catch (error) {
      showToast(error?.message || "L\u2019image n\u2019a pas pu \u00eatre ajout\u00e9e.");
      return;
    }
  }

  data.routes.push(route);
  setActiveRoute(route.id);
  event.currentTarget.reset();
  showToast("Parcours ajout\u00e9.");
}
*/}));

  next = replaceFunction(next, "handleCheckoutReturn", block(function () {/*
async function handleCheckoutReturn() {
  if (!canUseBackend()) return;
  const params = new URLSearchParams(window.location.search);
  if (params.get("checkout") === "cancel") {
    showToast("Paiement annul\u00e9.");
    window.history.replaceState({}, "", `${window.location.pathname}${window.location.hash || "#player"}`);
    return;
  }
  if (params.get("checkout") !== "success") return;
  const sessionId = params.get("session_id");
  if (!sessionId) return;

  try {
    els.activationMessage.textContent = "R\u00e9cup\u00e9ration de votre code d\u2019activation...";
    const response = await fetch(`${API_CHECKOUT_SESSION_URL}?session_id=${encodeURIComponent(sessionId)}`, {
      headers: { Accept: "application/json" },
      cache: "no-store",
      credentials: "same-origin",
    });
    const payload = await response.json().catch(() => ({}));
    const activationCodes = Array.isArray(payload.activationCodes) && payload.activationCodes.length
      ? payload.activationCodes
      : payload.activationCode
        ? [payload.activationCode]
        : [];
    if (!response.ok || !activationCodes.length) {
      throw new Error(payload.message || "Le code n\u2019est pas encore disponible.");
    }

    const newCodes = activationCodes.filter((code) => !data.codes.some((item) => item.code === code));
    newCodes.reverse().forEach((code, index) => {
      data.codes.unshift({
        code,
        routeId: payload.routeId,
        status: "available",
        teamId: null,
        createdAt: Date.now() + index,
        source: "stripe",
        stripeSessionId: sessionId,
        customerEmail: payload.customerEmail || null,
        customerName: payload.customerName || null,
        customerFirstName: payload.customerFirstName || null,
        customerLastName: payload.customerLastName || null,
        customerAddress: payload.customerAddress || null,
        teamCount: payload.teamCount || activationCodes.length,
        confirmationEmailSentAt: payload.emailSent ? Date.now() : null,
      });
    });
    if (newCodes.length) saveData({ sync: false });

    renderPlayer();
    els.activationCode.value = activationCodes[0];
    const mailInfo = payload.emailSent
      ? " Un e-mail de confirmation vient aussi d\u2019\u00eatre envoy\u00e9."
      : payload.emailConfigured === false
        ? " L\u2019e-mail de confirmation sera actif d\u00e8s que l\u2019envoi mail sera configur\u00e9."
        : "";
    const codeLabel = activationCodes.length > 1 ? "Codes cr\u00e9\u00e9s" : "Code cr\u00e9\u00e9";
    els.activationMessage.textContent = `${codeLabel} : ${activationCodes.join(", ")}. Vous pouvez valider le premier code pour d\u00e9marrer.${mailInfo}`;
    showToast(payload.emailSent ? "Paiement valid\u00e9, code envoy\u00e9 par e-mail." : "Paiement valid\u00e9, code cr\u00e9\u00e9.");
  } catch (error) {
    els.activationMessage.textContent = error.message || "Impossible de r\u00e9cup\u00e9rer le code.";
  } finally {
    window.history.replaceState({}, "", `${window.location.pathname}${window.location.hash || "#player"}`);
  }
}
*/}));

  next = next.replace(/(\[\s*els\.routeDetailsTitleInput,\s*els\.routeDetailsAreaInput,\s*els\.routeDetailsDurationInput,)(?!\s*els\.routeDetailsDistanceInput,)/g, "$1\n    els.routeDetailsDistanceInput,");
  return next;
}

function patchServer(server) {
  let next = server;
  next = replaceFunction(next, "getRoutePriceCents", block(function () {/*
function getRoutePriceCents(route) {
  const storedPrice = route?.pricePerTeam ?? route?.pricePerPerson;
  if (route && (storedPrice === undefined || storedPrice === null)) {
    return 1800;
  }
  const price = Number(storedPrice);
  if (!Number.isFinite(price) || price < 0) return 0;
  return Math.round(price * 100);
}
*/}));

  if (!next.includes("function getTeamCount")) {
    next = ensureAfter(next, block(function () {/*
function getPlayerCount(value) {
  const count = Number(value);
  if (!Number.isFinite(count)) return 1;
  return Math.min(20, Math.max(1, Math.floor(count)));
}
*/}), `

function getTeamCount(value) {
  const count = Number(value);
  if (!Number.isFinite(count)) return 1;
  return Math.min(20, Math.max(1, Math.floor(count)));
}
`);
  }

  if (!next.includes("function findExistingStripeCodes")) {
    next = ensureAfter(next, block(function () {/*
function findExistingStripeCode(data, sessionId) {
  return data.codes.find((item) => (
    item.source === "stripe"
      && compactText(item.stripeSessionId) === compactText(sessionId)
  )) || null;
}
*/}), `

function findExistingStripeCodes(data, sessionId) {
  return data.codes
    .filter((item) => item.source === "stripe" && compactText(item.stripeSessionId) === compactText(sessionId))
    .sort((a, b) => (Number(a.teamIndex) || 0) - (Number(b.teamIndex) || 0) || a.createdAt - b.createdAt);
}
`);
  }

  next = replaceFunction(next, "createStripeCode", block(function () {/*
function createStripeCode(data, route, session, options = {}) {
  const customer = getStripeCustomerInfo(session);
  const teamCount = getTeamCount(options.teamCount ?? session?.metadata?.teamCount ?? session?.metadata?.playerCount);
  const teamIndex = Number(options.teamIndex) || 1;
  const activationCode = {
    code: makeActivationCode(route, data),
    routeId: route.id,
    status: "available",
    teamId: null,
    createdAt: Date.now() + teamIndex,
    source: "stripe",
    stripeSessionId: session.id || null,
    stripePaymentIntentId: session.payment_intent || null,
    stripeCustomerId: customer.stripeCustomerId,
    customerEmail: customer.email,
    customerName: customer.name,
    customerFirstName: customer.firstName,
    customerLastName: customer.lastName,
    customerPhone: customer.phone,
    customerAddress: customer.address,
    teamCount,
    teamIndex,
  };
  data.codes.unshift(activationCode);
  return activationCode;
}
*/}));

  next = replaceFunction(next, "createOrReuseStripeCode", block(function () {/*
async function createOrReuseStripeCode(session) {
  const result = await withDataMutation(async () => {
    const stored = await readStoredData();
    if (!stored) {
      return { status: 409, payload: { message: "Aucune donnee serveur disponible." } };
    }
    const routeId = compactText(session?.metadata?.routeId || session?.client_reference_id);
    const route = stored.routes.find((item) => item.id === routeId);
    if (!route) {
      return { status: 400, payload: { message: "Parcours introuvable pour ce paiement." } };
    }
    const requestedTeamCount = getTeamCount(session?.metadata?.teamCount ?? session?.metadata?.playerCount);
    const existingCodes = findExistingStripeCodes(stored, session.id);
    const activationCodes = existingCodes.length
      ? existingCodes
      : Array.from({ length: requestedTeamCount }, (_, index) => createStripeCode(stored, route, session, { teamCount: requestedTeamCount, teamIndex: index + 1 }));
    if (!existingCodes.length) await writeStoredData(stored);
    const firstCode = activationCodes[0];
    const codeValues = activationCodes.map((item) => item.code);
    const teamCount = firstCode.teamCount || codeValues.length;
    return {
      status: 200,
      payload: {
        ok: true,
        reused: Boolean(existingCodes.length),
        code: codeValues[0],
        activationCode: codeValues[0],
        activationCodes: codeValues,
        routeId: route.id,
        routeTitle: route.title,
        stripeSessionId: session.id,
        customerEmail: firstCode.customerEmail,
        customerName: firstCode.customerName,
        customerFirstName: firstCode.customerFirstName,
        customerLastName: firstCode.customerLastName,
        customerAddress: firstCode.customerAddress,
        teamCount,
        emailSubject: codeValues.length > 1 ? "Vos codes Escape Erezee" : "Votre code Escape Erezee",
        emailBody: buildActivationMailBody(codeValues, route, { ...firstCode, teamCount }),
        emailSent: activationCodes.every((item) => Boolean(item.confirmationEmailSentAt)),
      },
    };
  });
  if (result.status === 200) {
    const mailResult = await sendConfirmationEmailForCode(result.payload.activationCode);
    result.payload.emailSent = Boolean(mailResult.sent || result.payload.emailSent);
    result.payload.emailConfigured = Boolean(mailResult.configured);
  }
  return result;
}
*/}));

  next = replaceFunction(next, "buildActivationMailBody", block(function () {/*
function buildActivationMailBody(code, route, customer = {}) {
  const codes = Array.isArray(code) ? code : [code];
  const greetingName = getFirstText(customer.customerFirstName, customer.customerName);
  const codeLines = codes.length > 1
    ? ["Vos codes d'activation sont :", ...codes.map((item, index) => `- Equipe ${index + 1} : ${item}`)]
    : [`Votre code d'activation est : ${codes[0]}`];
  return [
    greetingName ? `Bonjour ${greetingName},` : "Bonjour,",
    "",
    `Merci pour votre achat du parcours ${route.title}.`,
    ...codeLines,
    "",
    "Informations de votre reservation :",
    `- Parcours : ${route.title}`,
    customer.teamCount ? `- Equipes : ${customer.teamCount}` : null,
    "- Recommandation : maximum 6 joueurs par equipe",
    customer.customerName ? `- Nom : ${customer.customerName}` : null,
    customer.customerEmail ? `- E-mail : ${customer.customerEmail}` : null,
    customer.customerAddress ? `- Adresse : ${formatCustomerAddress(customer.customerAddress).replace(/\n/g, ", ")}` : null,
    "",
    `Vous pouvez demarrer la partie ici : ${PUBLIC_APP_URL}/index.html#player`,
    "",
    "Bonne aventure !",
  ].filter((line) => line !== null).join("\n");
}
*/}));

  next = replaceFunction(next, "buildActivationMailHtml", block(function () {/*
function buildActivationMailHtml(code, route, customer = {}) {
  const codes = Array.isArray(code) ? code : [code];
  const address = formatCustomerAddress(customer.customerAddress);
  const addressHtml = address ? address.split("\n").map((line) => escapeHtml(line)).join("<br>") : "";
  const codeHtml = codes.length > 1
    ? `<ul>${codes.map((item, index) => `<li><strong>Equipe ${index + 1} :</strong> ${escapeHtml(item)}</li>`).join("")}</ul>`
    : `<p style="font-size:20px">Votre code d'activation : <strong>${escapeHtml(codes[0])}</strong></p>`;
  const rows = [
    ["Parcours", route.title],
    customer.teamCount ? ["Equipes", customer.teamCount] : null,
    ["Recommandation", "Maximum 6 joueurs par equipe"],
    customer.customerName ? ["Nom", customer.customerName] : null,
    customer.customerEmail ? ["E-mail", customer.customerEmail] : null,
    addressHtml ? ["Adresse", addressHtml, true] : null,
  ].filter(Boolean);
  return `
    <div style="font-family:Arial,sans-serif;color:#123c32;line-height:1.5">
      <h1 style="margin:0 0 12px">${codes.length > 1 ? "Vos codes Escape Erezee" : "Votre code Escape Erezee"}</h1>
      <p>Merci pour votre achat du parcours <strong>${escapeHtml(route.title)}</strong>.</p>
      ${codeHtml}
      <table cellpadding="6" cellspacing="0" style="border-collapse:collapse">
        ${rows.map(([label, value, isHtml]) => `
          <tr>
            <td style="font-weight:bold;vertical-align:top">${escapeHtml(label)}</td>
            <td>${isHtml ? value : escapeHtml(value)}</td>
          </tr>
        `).join("")}
      </table>
      <p><a href="${escapeHtml(PUBLIC_APP_URL)}/index.html#player">Demarrer la partie</a></p>
      <p>Bonne aventure !</p>
    </div>
  `;
}
*/}));

  next = replaceFunction(next, "sendConfirmationEmailForCode", block(function () {/*
async function sendConfirmationEmailForCode(codeValue) {
  if (!RESEND_API_KEY || !MAIL_FROM) return { configured: false, sent: false };
  const pending = await withDataMutation(async () => {
    const stored = await readStoredData();
    const code = stored?.codes?.find((item) => item.code === codeValue);
    if (!stored || !code) return null;
    const sessionCodes = code.stripeSessionId
      ? stored.codes.filter((item) => item.source === "stripe" && compactText(item.stripeSessionId) === compactText(code.stripeSessionId)).sort((a, b) => (Number(a.teamIndex) || 0) - (Number(b.teamIndex) || 0) || a.createdAt - b.createdAt)
      : [code];
    if (sessionCodes.every((item) => item.confirmationEmailSentAt)) return { alreadySent: true };
    if (sessionCodes.some((item) => item.confirmationEmailStatus === "sending" && Date.now() - Number(item.confirmationEmailStartedAt || 0) < 5 * 60 * 1000)) return { alreadySending: true };
    const route = stored.routes.find((item) => item.id === code.routeId);
    if (!route || !code.customerEmail) {
      sessionCodes.forEach((item) => {
        item.confirmationEmailStatus = code.customerEmail ? "error" : "missing_email";
        item.confirmationEmailError = code.customerEmail ? "Parcours introuvable." : "Adresse e-mail manquante.";
      });
      await writeStoredData(stored);
      return { configured: true, sent: false, skipped: true };
    }
    sessionCodes.forEach((item) => {
      item.confirmationEmailStatus = "sending";
      item.confirmationEmailStartedAt = Date.now();
      item.confirmationEmailError = null;
    });
    await writeStoredData(stored);
    return { code: { ...code, code: sessionCodes.map((item) => item.code), teamCount: code.teamCount || sessionCodes.length }, codeValues: sessionCodes.map((item) => item.code), route };
  });
  if (!pending || pending.alreadySent || pending.alreadySending || pending.skipped) {
    return { configured: true, sent: Boolean(pending?.alreadySent), skipped: Boolean(pending?.skipped || pending?.alreadySending) };
  }
  try {
    const subject = Array.isArray(pending.code.code) && pending.code.code.length > 1 ? "Vos codes Escape Erezee" : "Votre code Escape Erezee";
    const mailResult = await sendResendEmail({ to: pending.code.customerEmail, subject, text: buildActivationMailBody(pending.code.code, pending.route, pending.code), html: buildActivationMailHtml(pending.code.code, pending.route, pending.code) });
    await withDataMutation(async () => {
      const stored = await readStoredData();
      if (!stored) return;
      stored.codes.filter((item) => pending.codeValues.includes(item.code)).forEach((item) => {
        item.confirmationEmailStatus = "sent";
        item.confirmationEmailSentAt = Date.now();
        item.confirmationEmailProvider = mailResult.provider;
        item.confirmationEmailId = mailResult.id || null;
        item.confirmationEmailError = null;
      });
      await writeStoredData(stored);
    });
    return mailResult;
  } catch (error) {
    await withDataMutation(async () => {
      const stored = await readStoredData();
      if (!stored) return;
      stored.codes.filter((item) => pending.codeValues.includes(item.code)).forEach((item) => {
        item.confirmationEmailStatus = "error";
        item.confirmationEmailError = error.message || "E-mail non envoye.";
      });
      await writeStoredData(stored);
    });
    return { configured: true, sent: false, error: error.message || "E-mail non envoye." };
  }
}
*/}));

  next = replaceFunction(next, "handleCreateCheckoutSession", block(function () {/*
async function handleCreateCheckoutSession(request, response) {
  if (request.method !== "POST") {
    sendJson(response, 405, { message: "Methode non autorisee." });
    return true;
  }
  if (!STRIPE_SECRET_KEY) {
    sendJson(response, 503, { message: "Paiement Stripe non configure." });
    return true;
  }
  try {
    const body = await readRequestBody(request);
    const payload = body ? JSON.parse(body) : {};
    const stored = await readStoredData();
    if (!stored) {
      sendJson(response, 409, { message: "Aucune donnee serveur disponible." });
      return true;
    }
    const route = stored.routes.find((item) => item.id === compactText(payload.routeId));
    if (!route || !isRouteVisibleInShop(route)) {
      sendJson(response, 404, { message: "Ce parcours n'est pas disponible a la vente." });
      return true;
    }
    const unitAmount = getRoutePriceCents(route);
    if (unitAmount <= 0) {
      sendJson(response, 400, { message: "Le prix du parcours doit etre superieur a 0." });
      return true;
    }
    const teamCount = getTeamCount(payload.teamCount ?? payload.playerCount);
    const origin = getRequestOrigin(request);
    const params = new URLSearchParams();
    appendStripeParam(params, "mode", "payment");
    appendStripeParam(params, "client_reference_id", route.id);
    appendStripeParam(params, "customer_creation", "always");
    appendStripeParam(params, "billing_address_collection", "required");
    appendStripeParam(params, "success_url", `${origin}/index.html?checkout=success&session_id={CHECKOUT_SESSION_ID}#player`);
    appendStripeParam(params, "cancel_url", `${origin}/index.html?checkout=cancel#player`);
    appendStripeParam(params, "line_items[0][quantity]", teamCount);
    appendStripeParam(params, "line_items[0][price_data][currency]", "eur");
    appendStripeParam(params, "line_items[0][price_data][unit_amount]", unitAmount);
    appendStripeParam(params, "line_items[0][price_data][product_data][name]", route.title);
    appendStripeParam(params, "line_items[0][price_data][product_data][description]", route.description || route.area || route.title);
    appendStripeParam(params, "metadata[routeId]", route.id);
    appendStripeParam(params, "metadata[teamCount]", teamCount);
    appendStripeParam(params, "custom_fields[0][key]", "prenom");
    appendStripeParam(params, "custom_fields[0][label][type]", "custom");
    appendStripeParam(params, "custom_fields[0][label][custom]", "Prenom");
    appendStripeParam(params, "custom_fields[0][type]", "text");
    appendStripeParam(params, "custom_fields[0][text][maximum_length]", 80);
    appendStripeParam(params, "custom_fields[0][optional]", "false");
    appendStripeParam(params, "custom_fields[1][key]", "nom");
    appendStripeParam(params, "custom_fields[1][label][type]", "custom");
    appendStripeParam(params, "custom_fields[1][label][custom]", "Nom");
    appendStripeParam(params, "custom_fields[1][type]", "text");
    appendStripeParam(params, "custom_fields[1][text][maximum_length]", 80);
    appendStripeParam(params, "custom_fields[1][optional]", "false");
    appendStripeParam(params, "custom_text[submit][message]", "Votre code d'activation sera envoye par e-mail apres paiement.");
    const session = await stripeRequest("POST", "/v1/checkout/sessions", params);
    sendJson(response, 200, { ok: true, url: session.url, sessionId: session.id });
  } catch (error) {
    sendJson(response, 400, { message: error.message || "Paiement indisponible." });
  }
  return true;
}
*/}));

  return next;
}

await patchTextFile("index.html", patchIndex);
await patchTextFile("styles.css", patchStyles);
await patchTextFile("app.js", patchApp);
await patchTextFile("server.mjs", patchServer);
await patchTextFile("service-worker.js", (worker) => worker.replace(/escape-erezee-v\d+/g, `escape-erezee-v${VERSION}`));
