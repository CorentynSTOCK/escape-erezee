import fs from "node:fs";

const VERSION = 175;
const APP_PATH = "app.js";
const INDEX_PATH = "index.html";
const PACKAGE_PATH = "package.json";
const SERVER_PATH = "server.mjs";
const SERVICE_WORKER_PATH = "service-worker.js";
const MARKER = "stripe-multi-team-codes-v175";
const SCRIPT_NAME = `render-stripe-multi-team-codes-v${VERSION}.mjs`;

function read(path) {
  return fs.readFileSync(path, "utf8");
}

function write(path, content) {
  fs.writeFileSync(path, content, "utf8");
}

function patchServer() {
  let server = read(SERVER_PATH);

  const existingBlockStart = server.indexOf(`/* ${MARKER} */`);
  let start = -1;
  let end = -1;
  if (existingBlockStart !== -1) {
    const existingBlockEnd = server.indexOf("function buildActivationMailBody(code, route, customer = {}) {", existingBlockStart);
    if (existingBlockEnd === -1) {
      throw new Error("Could not clean existing Stripe multi-team block.");
    }
    start = existingBlockStart;
    end = existingBlockEnd;
  } else {
    start = server.indexOf("async function createOrReuseStripeCode(session) {");
    end = server.indexOf("function buildActivationMailBody(code, route, customer = {}) {", start);
  }

  const existingHelpersStart = server.indexOf("function buildActivationMailBodyForCodesV175");
  if (existingHelpersStart !== -1) {
    const existingHelpersEnd = server.indexOf("async function sendConfirmationEmailForCode(codeValue) {", existingHelpersStart);
    if (existingHelpersEnd === -1) {
      throw new Error("Could not clean existing Stripe multi-team helpers.");
    }
    server = `${server.slice(0, existingHelpersStart)}${server.slice(existingHelpersEnd)}`;
  }

  if (start === -1 || end === -1) {
    throw new Error("Could not locate Stripe code creation block.");
  }

  const replacement = `
/* ${MARKER} */
function findStripeCodesV175(data, sessionId) {
  const sessionKey = compactText(sessionId);
  return (Array.isArray(data?.codes) ? data.codes : []).filter((item) => (
    item.source === "stripe"
      && compactText(item.stripeSessionId) === sessionKey
  ));
}

function ensureStripeCodesForSessionV175(data, route, session, teamCount) {
  const desiredCount = getPlayerCount(teamCount);
  const existing = findStripeCodesV175(data, session.id);
  const codes = [...existing];
  let createdCount = 0;

  for (let index = existing.length; index < desiredCount; index += 1) {
    const activationCode = createStripeCode(data, route, session);
    activationCode.orderIndex = index + 1;
    activationCode.orderTotal = desiredCount;
    codes.push(activationCode);
    createdCount += 1;
  }

  codes.forEach((code, index) => {
    code.orderIndex ||= index + 1;
    code.orderTotal = desiredCount;
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

    const requestedTeamCount = getPlayerCount(session?.metadata?.playerCount);
    const { codes, createdCount, teamCount } = ensureStripeCodesForSessionV175(stored, route, session, requestedTeamCount);
    if (createdCount > 0) {
      await writeStoredData(stored);
    }

    const orderedCodes = codes
      .slice()
      .sort((left, right) => Number(left.orderIndex || 0) - Number(right.orderIndex || 0));
    const activationCodes = orderedCodes.map((item) => item.code);
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
        customerEmail: primaryCode.customerEmail,
        customerName: primaryCode.customerName,
        customerFirstName: primaryCode.customerFirstName,
        customerLastName: primaryCode.customerLastName,
        customerAddress: primaryCode.customerAddress,
        playerCount: teamCount,
        teamCount,
        emailSubject: activationCodes.length > 1 ? "Vos codes Escape Erezee" : "Votre code Escape Erezee",
        emailBody: buildActivationMailBodyForCodesV175(activationCodes, route, primaryCode),
        emailSent: orderedCodes.every((item) => Boolean(item.confirmationEmailSentAt)),
      },
    };
  });

  if (result.status === 200) {
    const mailResult = await sendConfirmationEmailForStripeOrderV175(result.payload.stripeSessionId);
    result.payload.emailSent = Boolean(mailResult.sent || result.payload.emailSent);
    result.payload.emailConfigured = Boolean(mailResult.configured);
  }

  return result;
}

`;

  server = `${server.slice(0, start)}${replacement}${server.slice(end)}`;

  const insertBefore = "async function sendConfirmationEmailForCode(codeValue) {";
  if (!server.includes("function buildActivationMailBodyForCodesV175")) {
    const helpers = `
function buildActivationMailBodyForCodesV175(codeValues, route, customer = {}) {
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

function buildActivationMailHtmlForCodesV175(codeValues, route, customer = {}) {
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

async function sendConfirmationEmailForStripeOrderV175(sessionId) {
  if (!RESEND_API_KEY || !MAIL_FROM) {
    return { configured: false, sent: false };
  }

  const pending = await withDataMutation(async () => {
    const stored = await readStoredData();
    const codes = findStripeCodesV175(stored, sessionId);
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
      codeValues: orderedCodes.map((code) => code.code),
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
      text: buildActivationMailBodyForCodesV175(pending.codeValues, pending.route, pending.customer),
      html: buildActivationMailHtmlForCodesV175(pending.codeValues, pending.route, pending.customer),
    });
    await withDataMutation(async () => {
      const stored = await readStoredData();
      const codes = findStripeCodesV175(stored, sessionId);
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
      const codes = findStripeCodesV175(stored, sessionId);
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
    server = server.replace(insertBefore, `${helpers}${insertBefore}`);
  }

  server = server
    .replace(/Votre code d'activation sera envoy[^"]*paiement\./g, "Vos codes d'activation seront envoyes par e-mail apres paiement.")
    .replace(/Vos codes d'activation seront envoy[^"]*paiement\./g, "Vos codes d'activation seront envoyes par e-mail apres paiement.")
    .replace(
      /appendStripeParam\(params, "custom_text\[submit\]\[message\]", "[^"]*"\);/,
      'appendStripeParam(params, "custom_text[submit][message]", "Vos codes d\\\'activation seront envoyes par e-mail apres paiement.");',
    );

  write(SERVER_PATH, server);
}

function patchApp() {
  let app = read(APP_PATH);
  const start = app.indexOf("async function handleCheckoutReturn() {");
  const end = app.indexOf("function escapeHtml(value) {", start);
  if (start === -1 || end === -1) {
    throw new Error("Could not locate checkout return handler.");
  }

  const replacement = `async function handleCheckoutReturn() {
  if (!canUseBackend()) return;
  const params = new URLSearchParams(window.location.search);
  if (params.get("checkout") === "cancel") {
    showToast("Paiement annule.");
    window.history.replaceState({}, "", \`${window.location.pathname}${window.location.hash || "#player"}\`);
    return;
  }
  if (params.get("checkout") !== "success") return;
  const sessionId = params.get("session_id");
  if (!sessionId) return;

  try {
    els.activationMessage.textContent = "Recuperation de vos codes d'activation...";
    const response = await fetch(\`${API_CHECKOUT_SESSION_URL}?session_id=${encodeURIComponent(sessionId)}\`, {
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
      ? \`Codes crees : ${activationCodes.join(", ")}. Chaque equipe utilise un code different.\`
      : \`Code cree : ${activationCodes[0]}. Vous pouvez le valider pour demarrer.\`;
    els.activationMessage.textContent = \`${codesLabel}${mailInfo}\`;
    showToast(payload.emailSent ? "Paiement valide, codes envoyes par e-mail." : "Paiement valide, codes crees.");
  } catch (error) {
    els.activationMessage.textContent = error.message || "Impossible de recuperer les codes.";
  } finally {
    window.history.replaceState({}, "", \`${window.location.pathname}${window.location.hash || "#player"}\`);
  }
}

`;

  app = `${app.slice(0, start)}${replacement}${app.slice(end)}`;
  if (!app.includes(MARKER)) {
    app += `

/* ${MARKER} */
window.__stripeMultiTeamCodesV175 = true;
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
  const pkg = JSON.parse(read(PACKAGE_PATH));
  const start = pkg.scripts?.start || "";
  if (!start.includes(SCRIPT_NAME)) {
    pkg.scripts.start = start.replace(
      "node render-team-price-layout-v174.mjs && node server.mjs",
      `node render-team-price-layout-v174.mjs && node ${SCRIPT_NAME} && node server.mjs`,
    );
  }
  write(PACKAGE_PATH, `${JSON.stringify(pkg, null, 2)}\n`);
}

patchServer();
patchApp();
patchIndex();
patchServiceWorker();
patchPackage();

console.log(`Stripe multi-team codes v${VERSION} applied.`);
