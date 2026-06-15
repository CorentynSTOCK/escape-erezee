import fs from "node:fs";

const VERSION = 178;
const APP_PATH = "app.js";
const INDEX_PATH = "index.html";
const PACKAGE_PATH = "package.json";
const SERVER_PATH = "server.mjs";
const SERVICE_WORKER_PATH = "service-worker.js";
const MARKER = "stripe-multi-team-codes-v178";
const SCRIPT_NAME = `render-stripe-multi-team-codes-v${VERSION}.mjs`;

function read(path) {
  return fs.readFileSync(path, "utf8");
}

function write(path, content) {
  fs.writeFileSync(path, content, "utf8");
}

function removeBlock(source, startToken, endToken) {
  const start = source.indexOf(startToken);
  if (start === -1) return source;
  const end = source.indexOf(endToken, start);
  if (end === -1) {
    throw new Error(`Could not remove block starting with ${startToken}.`);
  }
  return source.slice(0, start) + source.slice(end);
}

function patchServer() {
  let server = read(SERVER_PATH);

  server = removeBlock(server, "/* stripe-multi-team-codes-v175 */", "function buildActivationMailBody(code, route, customer = {}) {");
  server = removeBlock(server, "/* stripe-multi-team-codes-v178 */", "function buildActivationMailBody(code, route, customer = {}) {");
  server = removeBlock(server, "function buildActivationMailBodyForCodesV175", "async function sendConfirmationEmailForCode(codeValue) {");
  server = removeBlock(server, "function buildActivationMailBodyForCodesV178", "async function sendConfirmationEmailForCode(codeValue) {");

  const anchor = server.indexOf("function buildActivationMailBody(code, route, customer = {}) {");
  const originalStart = server.indexOf("async function createOrReuseStripeCode(session) {");
  const start = originalStart !== -1 && originalStart < anchor ? originalStart : anchor;
  const end = anchor;
  if (start === -1 || end === -1) {
    throw new Error("Could not locate Stripe code creation block.");
  }

  const multiCodeBlock = `
/* ${MARKER} */
function findStripeCodesV178(data, sessionId) {
  const sessionKey = compactText(sessionId);
  return (Array.isArray(data?.codes) ? data.codes : []).filter((item) => (
    item.source === "stripe"
      && compactText(item.stripeSessionId) === sessionKey
  ));
}

function getStripeTeamCountV178(session) {
  return getPlayerCount(session?.metadata?.playerCount);
}

function ensureStripeCodesForSessionV178(data, route, session) {
  const desiredCount = getStripeTeamCountV178(session);
  const existing = findStripeCodesV178(data, session.id);
  const codes = existing.slice();
  let createdCount = 0;

  for (let index = existing.length; index < desiredCount; index += 1) {
    const activationCode = createStripeCode(data, route, session);
    activationCode.orderIndex = index + 1;
    activationCode.orderTotal = desiredCount;
    codes.push(activationCode);
    createdCount += 1;
  }

  codes.forEach((code, index) => {
    code.orderIndex = Number(code.orderIndex || index + 1);
    code.orderTotal = Math.max(desiredCount, codes.length);
    code.playerCount = desiredCount;
  });

  return { codes, createdCount, teamCount: desiredCount };
}

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

    const { codes, createdCount, teamCount } = ensureStripeCodesForSessionV178(stored, route, session);
    if (createdCount > 0) {
      await writeStoredData(stored);
    }

    const orderedCodes = codes
      .slice()
      .sort((left, right) => Number(left.orderIndex || 0) - Number(right.orderIndex || 0));
    const activationCodes = orderedCodes.map((item) => item.code).filter(Boolean);
    const primaryCode = orderedCodes[0];

    return {
      status: 200,
      payload: {
        ok: true,
        reused: createdCount === 0,
        code: activationCodes[0],
        activationCode: activationCodes[0],
        codes: activationCodes,
        activationCodes,
        routeId: route.id,
        routeTitle: route.title,
        stripeSessionId: session.id,
        customerEmail: primaryCode?.customerEmail || null,
        customerName: primaryCode?.customerName || null,
        customerFirstName: primaryCode?.customerFirstName || null,
        customerLastName: primaryCode?.customerLastName || null,
        customerAddress: primaryCode?.customerAddress || null,
        playerCount: teamCount,
        teamCount,
        emailSubject: activationCodes.length > 1 ? "Vos codes Escape Erezee" : "Votre code Escape Erezee",
        emailBody: buildActivationMailBodyForCodesV178(activationCodes, route, primaryCode || {}),
        emailSent: orderedCodes.length > 0 && orderedCodes.every((item) => Boolean(item.confirmationEmailSentAt)),
      },
    };
  });

  if (result.status === 200) {
    const mailResult = await sendConfirmationEmailForStripeOrderV178(result.payload.stripeSessionId);
    result.payload.emailSent = Boolean(mailResult.sent || result.payload.emailSent);
    result.payload.emailConfigured = Boolean(mailResult.configured);
  }

  return result;
}

`;

  server = server.slice(0, start) + multiCodeBlock + server.slice(end);

  const helperAnchor = "async function sendConfirmationEmailForCode(codeValue) {";
  if (!server.includes(helperAnchor)) {
    throw new Error("Could not locate confirmation email helper anchor.");
  }

  const helperBlock = `
function buildActivationMailBodyForCodesV178(codeValues, route, customer = {}) {
  if (!Array.isArray(codeValues) || codeValues.length <= 1) {
    return buildActivationMailBody(codeValues?.[0], route, customer);
  }
  const greetingName = getFirstText(customer.customerFirstName, customer.customerName);
  return [
    greetingName ? \`Bonjour \${greetingName},\` : "Bonjour,",
    "",
    \`Merci pour votre achat du parcours \${route.title}.\`,
    "Vos codes d'activation sont :",
    ...codeValues.map((code, index) => \`- Equipe \${index + 1} : \${code}\`),
    "",
    "Chaque equipe doit utiliser un code different pour demarrer sa partie.",
    "",
    "Informations de votre reservation :",
    \`- Parcours : \${route.title}\`,
    \`- Equipes : \${codeValues.length}\`,
    customer.customerName ? \`- Nom : \${customer.customerName}\` : null,
    customer.customerEmail ? \`- E-mail : \${customer.customerEmail}\` : null,
    customer.customerAddress ? \`- Adresse : \${formatCustomerAddress(customer.customerAddress).replace(/\\n/g, ", ")}\` : null,
    "",
    \`Vous pouvez demarrer la partie ici : \${PUBLIC_APP_URL}/index.html#player\`,
    "",
    "Bonne aventure !",
  ].filter((line) => line !== null).join("\\n");
}

function buildActivationMailHtmlForCodesV178(codeValues, route, customer = {}) {
  if (!Array.isArray(codeValues) || codeValues.length <= 1) {
    return buildActivationMailHtml(codeValues?.[0], route, customer);
  }
  const address = formatCustomerAddress(customer.customerAddress);
  const addressHtml = address
    ? address.split("\\n").map((line) => escapeHtml(line)).join("<br>")
    : "";
  const rows = [
    ["Parcours", route.title],
    ["Equipes", String(codeValues.length)],
    customer.customerName ? ["Nom", customer.customerName] : null,
    customer.customerEmail ? ["E-mail", customer.customerEmail] : null,
    addressHtml ? ["Adresse", addressHtml, true] : null,
  ].filter(Boolean);

  return \`
    <div style="font-family:Arial,sans-serif;color:#123c32;line-height:1.5">
      <h1 style="margin:0 0 12px">Vos codes Escape Erezee</h1>
      <p>Merci pour votre achat du parcours <strong>\${escapeHtml(route.title)}</strong>.</p>
      <p>Chaque equipe doit utiliser un code different :</p>
      <ol>
        \${codeValues.map((code, index) => \`<li><strong>Equipe \${index + 1} :</strong> \${escapeHtml(code)}</li>\`).join("")}
      </ol>
      <table cellpadding="6" cellspacing="0" style="border-collapse:collapse">
        \${rows.map(([label, value, isHtml]) => \`
          <tr>
            <td style="font-weight:bold;vertical-align:top">\${escapeHtml(label)}</td>
            <td>\${isHtml ? value : escapeHtml(value)}</td>
          </tr>
        \`).join("")}
      </table>
      <p><a href="\${escapeHtml(PUBLIC_APP_URL)}/index.html#player">Demarrer la partie</a></p>
      <p>Bonne aventure !</p>
    </div>
  \`;
}

async function sendConfirmationEmailForStripeOrderV178(sessionId) {
  if (!RESEND_API_KEY || !MAIL_FROM) {
    return { configured: false, sent: false };
  }

  const pending = await withDataMutation(async () => {
    const stored = await readStoredData();
    const codes = findStripeCodesV178(stored, sessionId);
    if (!stored || !codes.length) return null;
    const route = stored.routes.find((item) => item.id === codes[0].routeId);
    const customer = codes[0];

    if (codes.every((code) => code.confirmationEmailSentAt)) {
      return { alreadySent: true };
    }
    if (codes.some((code) => code.confirmationEmailStatus === "sending" && Date.now() - Number(code.confirmationEmailStartedAt || 0) < 5 * 60 * 1000)) {
      return { alreadySending: true };
    }
    if (!route || !customer.customerEmail) {
      codes.forEach((code) => {
        code.confirmationEmailStatus = customer.customerEmail ? "error" : "missing_email";
        code.confirmationEmailError = customer.customerEmail ? "Parcours introuvable." : "Adresse e-mail manquante.";
      });
      await writeStoredData(stored);
      return { configured: true, sent: false, skipped: true };
    }

    codes.forEach((code) => {
      code.confirmationEmailStatus = "sending";
      code.confirmationEmailStartedAt = Date.now();
      code.confirmationEmailError = null;
    });
    await writeStoredData(stored);

    const orderedCodes = codes.slice().sort((left, right) => Number(left.orderIndex || 0) - Number(right.orderIndex || 0));
    return {
      route,
      customer: { ...customer },
      codeValues: orderedCodes.map((code) => code.code).filter(Boolean),
    };
  });

  if (!pending || pending.alreadySent || pending.alreadySending || pending.skipped) {
    return {
      configured: true,
      sent: Boolean(pending?.alreadySent),
      skipped: Boolean(pending?.skipped || pending?.alreadySending),
    };
  }

  try {
    const subject = pending.codeValues.length > 1 ? "Vos codes Escape Erezee" : "Votre code Escape Erezee";
    const mailResult = await sendResendEmail({
      to: pending.customer.customerEmail,
      subject,
      text: buildActivationMailBodyForCodesV178(pending.codeValues, pending.route, pending.customer),
      html: buildActivationMailHtmlForCodesV178(pending.codeValues, pending.route, pending.customer),
    });
    await withDataMutation(async () => {
      const stored = await readStoredData();
      const codes = findStripeCodesV178(stored, sessionId);
      if (!stored || !codes.length) return;
      codes.forEach((code) => {
        code.confirmationEmailStatus = "sent";
        code.confirmationEmailSentAt = Date.now();
        code.confirmationEmailProvider = mailResult.provider;
        code.confirmationEmailId = mailResult.id || null;
        code.confirmationEmailError = null;
      });
      await writeStoredData(stored);
    });
    return mailResult;
  } catch (error) {
    await withDataMutation(async () => {
      const stored = await readStoredData();
      const codes = findStripeCodesV178(stored, sessionId);
      if (!stored || !codes.length) return;
      codes.forEach((code) => {
        code.confirmationEmailStatus = "error";
        code.confirmationEmailError = error.message || "E-mail non envoye.";
      });
      await writeStoredData(stored);
    });
    return { configured: true, sent: false, error: error.message || "E-mail non envoye." };
  }
}

`;

  server = server.replace(helperAnchor, helperBlock + helperAnchor);
  server = server.replace(
    /appendStripeParam\(params, "custom_text\[submit\]\[message\]", "[^"]*"\);/,
    'appendStripeParam(params, "custom_text[submit][message]", "Vos codes d\\\'activation seront envoyes par e-mail apres paiement.");',
  );

  write(SERVER_PATH, server);
}

function patchApp() {
  let app = read(APP_PATH);

  app = app
    .replace('metric.textContent = metric.textContent.replace(// personne|/ pers./gi, "/ equipe");', 'metric.textContent = metric.textContent.replace(new RegExp("/ personne|/ pers\\\\.", "gi"), "/ equipe");')
    .replace('if (summaryStrong) summaryStrong.textContent = summaryStrong.textContent.replace(// personne/gi, "/ equipe");', 'if (summaryStrong) summaryStrong.textContent = summaryStrong.textContent.replace(new RegExp("/ personne", "gi"), "/ equipe");')
    .replace('metric.textContent = metric.textContent.replace(// pers.|/ personne/gi, "/ equipe");', 'metric.textContent = metric.textContent.replace(new RegExp("/ pers\\\\.|/ personne", "gi"), "/ equipe");');

  app = app
    .replace(/\n\/\* stripe-multi-team-codes-v175 \*\/\nwindow\.__stripeMultiTeamCodesV175 = true;\n?/g, "\n")
    .replace(/\n\/\* stripe-multi-team-codes-v178 \*\/\nwindow\.__stripeMultiTeamCodesV178 = true;\n?/g, "\n");

  const start = app.indexOf("async function handleCheckoutReturn() {");
  const end = app.indexOf("function escapeHtml(value) {", start);
  if (start === -1 || end === -1) {
    throw new Error("Could not locate checkout return handler.");
  }

  const checkoutHandler = `async function handleCheckoutReturn() {
  if (!canUseBackend()) return;
  const params = new URLSearchParams(window.location.search);
  if (params.get("checkout") === "cancel") {
    showToast("Paiement annule.");
    window.history.replaceState({}, "", \`${window.location.pathname}\${window.location.hash || "#player"}\`);
    return;
  }
  if (params.get("checkout") !== "success") return;
  const sessionId = params.get("session_id");
  if (!sessionId) return;

  try {
    els.activationMessage.textContent = "Recuperation de vos codes d'activation...";
    const response = await fetch(\`${API_CHECKOUT_SESSION_URL}?session_id=\${encodeURIComponent(sessionId)}\`, {
      headers: { Accept: "application/json" },
      cache: "no-store",
      credentials: "same-origin",
    });
    const payload = await response.json().catch(() => ({}));
    const activationCodes = (Array.isArray(payload.activationCodes)
      ? payload.activationCodes
      : Array.isArray(payload.codes)
        ? payload.codes
        : [payload.activationCode])
      .map((item) => (typeof item === "string" ? item : item?.code))
      .map((item) => String(item || "").trim())
      .filter(Boolean);
    if (!response.ok || !activationCodes.length) {
      throw new Error(payload.message || "Les codes ne sont pas encore disponibles.");
    }

    let added = false;
    activationCodes.slice().reverse().forEach((activationCode, index) => {
      if (data.codes.some((item) => item.code === activationCode)) return;
      data.codes.unshift({
        code: activationCode,
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
        playerCount: payload.teamCount || payload.playerCount || activationCodes.length,
        orderIndex: activationCodes.length - index,
        orderTotal: activationCodes.length,
        confirmationEmailSentAt: payload.emailSent ? Date.now() : null,
      });
      added = true;
    });
    if (added) saveData({ sync: false });

    renderPlayer();
    els.activationCode.value = activationCodes[0];
    const mailInfo = payload.emailSent
      ? " Un e-mail de confirmation vient aussi d'etre envoye avec tous les codes."
      : payload.emailConfigured === false
        ? " L'e-mail de confirmation sera actif des que l'envoi mail sera configure."
        : "";
    const codesLabel = activationCodes.length > 1
      ? \`Codes crees : \${activationCodes.join(", ")}. Chaque equipe utilise un code different.\`
      : \`Code cree : \${activationCodes[0]}. Vous pouvez le valider pour demarrer.\`;
    els.activationMessage.textContent = \`${codesLabel}\${mailInfo}\`;
    showToast(payload.emailSent ? "Paiement valide, codes envoyes par e-mail." : "Paiement valide, codes crees.");
  } catch (error) {
    els.activationMessage.textContent = error.message || "Impossible de recuperer les codes.";
  } finally {
    window.history.replaceState({}, "", \`${window.location.pathname}\${window.location.hash || "#player"}\`);
  }
}

`;

  app = app.slice(0, start) + checkoutHandler + app.slice(end);
  if (!app.includes(`/* ${MARKER} */`)) {
    app += `

/* ${MARKER} */
window.__stripeMultiTeamCodesV178 = true;
`;
  }

  write(APP_PATH, app);
}

function patchIndex() {
  let html = read(INDEX_PATH);
  html = html
    .replace(/styles\.css\?v=\d+/g, `styles.css?v=${VERSION}`)
    .replace(/app\.js\?v=\d+/g, `app.js?v=${VERSION}`);
  write(INDEX_PATH, html);
}

function patchServiceWorker() {
  if (!fs.existsSync(SERVICE_WORKER_PATH)) return;
  let worker = read(SERVICE_WORKER_PATH);
  worker = worker.replace(/escape-erezee-v\d+/g, `escape-erezee-v${VERSION}`);
  write(SERVICE_WORKER_PATH, worker);
}

function patchPackage() {
  if (!fs.existsSync(PACKAGE_PATH)) return;
  const pkg = JSON.parse(read(PACKAGE_PATH));
  let start = pkg.scripts?.start || "";
  start = start
    .replace(/ && node render-stripe-multi-team-codes-v175\.mjs/g, "")
    .replace(/ && node render-app-regex-hotfix-v176\.mjs/g, "");
  if (!start.includes(`node ${SCRIPT_NAME}`)) {
    if (start.includes("node render-v174-regex-safe-v177.mjs && node server.mjs")) {
      start = start.replace("node render-v174-regex-safe-v177.mjs && node server.mjs", `node render-v174-regex-safe-v177.mjs && node ${SCRIPT_NAME} && node server.mjs`);
    } else if (start.includes("node render-team-price-layout-v174.mjs && node server.mjs")) {
      start = start.replace("node render-team-price-layout-v174.mjs && node server.mjs", `node render-team-price-layout-v174.mjs && node ${SCRIPT_NAME} && node server.mjs`);
    }
  }
  pkg.scripts.start = start;
  write(PACKAGE_PATH, `${JSON.stringify(pkg, null, 2)}\n`);
}

patchServer();
patchApp();
patchIndex();
patchServiceWorker();
patchPackage();

console.log(`Stripe multi-team codes v${VERSION} applied.`);
