import { createServer } from "node:http";
import { createHash, createHmac, randomInt, timingSafeEqual } from "node:crypto";
import { readFile, rename, stat, writeFile, mkdir } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT_DIR = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = globalThis.process?.env?.DATA_DIR || path.join(ROOT_DIR, "data");
const DATA_FILE = path.join(DATA_DIR, "escape-data.json");
const MAX_BODY_SIZE = 30 * 1024 * 1024;
const ADMIN_PASSWORD = globalThis.process?.env?.ADMIN_PASSWORD || "ErezeeGestion-2026!";
const ODOO_WEBHOOK_SECRET = globalThis.process?.env?.ODOO_WEBHOOK_SECRET || "";
const STRIPE_SECRET_KEY = globalThis.process?.env?.STRIPE_SECRET_KEY || "";
const STRIPE_WEBHOOK_SECRET = globalThis.process?.env?.STRIPE_WEBHOOK_SECRET || "";
const RESEND_API_KEY = globalThis.process?.env?.RESEND_API_KEY || "";
const MAIL_FROM = globalThis.process?.env?.MAIL_FROM || "";
const MAIL_REPLY_TO = globalThis.process?.env?.MAIL_REPLY_TO || "";
const PUBLIC_APP_URL = globalThis.process?.env?.PUBLIC_APP_URL || "https://escape-erezee.be";
const ADMIN_COOKIE_NAME = "escape_erezee_admin";
const ADMIN_SESSION_MAX_AGE = 12 * 60 * 60;
const ADMIN_SESSION_TOKEN = createHash("sha256")
  .update(`${ADMIN_PASSWORD}:${globalThis.process?.env?.ADMIN_SESSION_SECRET || DATA_FILE}`)
  .digest("hex");
let dataMutationQueue = Promise.resolve();

const MIME_TYPES = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".svg": "image/svg+xml",
  ".webmanifest": "application/manifest+json; charset=utf-8",
};

function sendJson(response, statusCode, payload, headers = {}) {
  response.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    ...headers,
  });
  response.end(JSON.stringify(payload));
}

function isAppData(value) {
  return Boolean(
    value
      && typeof value === "object"
      && Array.isArray(value.routes)
      && Array.isArray(value.codes)
      && Array.isArray(value.teams),
  );
}

function safeCompare(left, right) {
  const leftBuffer = Buffer.from(String(left || ""));
  const rightBuffer = Buffer.from(String(right || ""));
  if (leftBuffer.length !== rightBuffer.length) return false;
  return timingSafeEqual(leftBuffer, rightBuffer);
}

function parseCookies(cookieHeader = "") {
  return cookieHeader
    .split(";")
    .map((part) => part.trim())
    .filter(Boolean)
    .reduce((cookies, part) => {
      const separatorIndex = part.indexOf("=");
      if (separatorIndex === -1) return cookies;
      const name = decodeURIComponent(part.slice(0, separatorIndex));
      const value = decodeURIComponent(part.slice(separatorIndex + 1));
      cookies[name] = value;
      return cookies;
    }, {});
}

function isSecureRequest(request) {
  const forwardedProto = String(request.headers["x-forwarded-proto"] || "");
  return forwardedProto.split(",")[0].trim() === "https" || Boolean(request.socket?.encrypted);
}

function makeAdminCookie(request, value, maxAge) {
  const secure = isSecureRequest(request) ? "; Secure" : "";
  return `${ADMIN_COOKIE_NAME}=${encodeURIComponent(value)}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${maxAge}${secure}`;
}

function isAdminRequest(request) {
  const cookies = parseCookies(request.headers.cookie);
  return safeCompare(cookies[ADMIN_COOKIE_NAME], ADMIN_SESSION_TOKEN);
}

function stableJson(value) {
  return JSON.stringify(value ?? null);
}

function codesKeepSameCatalog(previousCodes, nextCodes) {
  if (!Array.isArray(previousCodes) || !Array.isArray(nextCodes)) return false;
  if (previousCodes.length !== nextCodes.length) return false;

  const previousByCode = new Map(previousCodes.map((code) => [code.code, code]));
  return nextCodes.every((nextCode) => {
    const previousCode = previousByCode.get(nextCode.code);
    if (!previousCode) return false;
    return (
      previousCode.routeId === nextCode.routeId
      && previousCode.createdAt === nextCode.createdAt
      && ["available", "used"].includes(nextCode.status)
      && (nextCode.teamId === null || typeof nextCode.teamId === "string")
    );
  });
}

function isPlayerSafeUpdate(previousData, nextData) {
  if (!previousData) return true;
  return (
    previousData.activeRouteId === nextData.activeRouteId
    && stableJson(previousData.routes) === stableJson(nextData.routes)
    && codesKeepSameCatalog(previousData.codes, nextData.codes)
    && Array.isArray(nextData.teams)
  );
}

async function readRequestBody(request) {
  const chunks = [];
  let size = 0;

  for await (const chunk of request) {
    size += chunk.length;
    if (size > MAX_BODY_SIZE) {
      throw new Error("Les donnees envoyees sont trop volumineuses.");
    }
    chunks.push(chunk);
  }

  return Buffer.concat(chunks).toString("utf8");
}

async function readStoredData() {
  try {
    const raw = await readFile(DATA_FILE, "utf8");
    const parsed = JSON.parse(raw);
    return isAppData(parsed) ? parsed : null;
  } catch (error) {
    if (error.code === "ENOENT") return null;
    throw error;
  }
}

async function writeStoredData(payload) {
  await mkdir(DATA_DIR, { recursive: true });
  const tempFile = `${DATA_FILE}.tmp`;
  await writeFile(tempFile, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  await rename(tempFile, DATA_FILE);
}

function withDataMutation(task) {
  const run = dataMutationQueue.then(task, task);
  dataMutationQueue = run.catch(() => {});
  return run;
}

function compactText(value) {
  const text = String(value ?? "").trim();
  return text || "";
}

function getFirstText(...values) {
  return values.map(compactText).find(Boolean) || "";
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function normalizeLookupValue(value) {
  return compactText(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/gi, "")
    .toLowerCase();
}

function getRequestOrigin(request) {
  const forwardedProto = compactText(request.headers["x-forwarded-proto"]).split(",")[0].trim();
  const proto = forwardedProto || (request.socket?.encrypted ? "https" : "http");
  const host = compactText(request.headers["x-forwarded-host"]).split(",")[0].trim()
    || compactText(request.headers.host)
    || "localhost";
  return `${proto}://${host}`;
}

function getRoutePriceCents(route) {
  if (route && (route.pricePerPerson === undefined || route.pricePerPerson === null)) {
    return 1800;
  }
  const price = Number(route?.pricePerPerson);
  if (!Number.isFinite(price) || price < 0) return 0;
  return Math.round(price * 100);
}

function isRouteVisibleInShop(route) {
  return route?.shopVisible !== false;
}

function getPlayerCount(value) {
  const count = Number(value);
  if (!Number.isFinite(count)) return 1;
  return Math.min(20, Math.max(1, Math.floor(count)));
}

function appendStripeParam(params, key, value) {
  if (value === undefined || value === null) return;
  params.append(key, String(value));
}

async function stripeRequest(method, endpoint, params = null) {
  if (!STRIPE_SECRET_KEY) {
    throw new Error("Stripe n'est pas encore configure.");
  }

  const options = {
    method,
    headers: {
      Authorization: `Bearer ${STRIPE_SECRET_KEY}`,
      "Stripe-Version": "2026-02-25.clover",
    },
  };

  if (params) {
    options.headers["Content-Type"] = "application/x-www-form-urlencoded";
    options.body = params.toString();
  }

  const response = await fetch(`https://api.stripe.com${endpoint}`, options);
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload?.error?.message || "Stripe n'a pas accepte la demande.");
  }
  return payload;
}

async function sendResendEmail({ to, subject, text, html }) {
  if (!RESEND_API_KEY || !MAIL_FROM) {
    return { configured: false, sent: false, provider: "resend" };
  }

  const body = {
    from: MAIL_FROM,
    to: [to],
    subject,
    text,
    html,
  };
  if (MAIL_REPLY_TO) {
    body.reply_to = MAIL_REPLY_TO;
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload?.message || payload?.error || "L'e-mail n'a pas pu etre envoye.");
  }
  return { configured: true, sent: true, provider: "resend", id: payload.id || null };
}

function verifyStripeSignature(rawBody, signatureHeader) {
  if (!STRIPE_WEBHOOK_SECRET) return false;
  const parts = String(signatureHeader || "").split(",").map((part) => part.trim());
  const timestamp = parts.find((part) => part.startsWith("t="))?.slice(2);
  const signatures = parts
    .filter((part) => part.startsWith("v1="))
    .map((part) => part.slice(3));
  if (!timestamp || !signatures.length) return false;

  const age = Math.abs(Date.now() / 1000 - Number(timestamp));
  if (!Number.isFinite(age) || age > 300) return false;

  const expected = createHmac("sha256", STRIPE_WEBHOOK_SECRET)
    .update(`${timestamp}.${rawBody}`)
    .digest("hex");
  return signatures.some((signature) => safeCompare(signature, expected));
}

function getOdooSecret(request, payload) {
  const authHeader = compactText(request.headers.authorization);
  const bearerSecret = authHeader.replace(/^Bearer\s+/i, "").trim();
  return getFirstText(
    request.headers["x-escape-webhook-secret"],
    request.headers["x-odoo-webhook-secret"],
    bearerSecret,
    payload?.secret,
    payload?.webhookSecret,
  );
}

function getOdooRouteCandidates(payload) {
  const product = payload?.product && typeof payload.product === "object" ? payload.product : {};
  const orderLine = payload?.orderLine && typeof payload.orderLine === "object" ? payload.orderLine : {};
  return [
    payload?.routeId,
    payload?.route_id,
    payload?.route,
    payload?.routeCode,
    payload?.route_code,
    payload?.productCode,
    payload?.product_code,
    payload?.default_code,
    payload?.sku,
    product.routeId,
    product.route_id,
    product.default_code,
    product.code,
    product.sku,
    product.name,
    orderLine.routeId,
    orderLine.route_id,
    orderLine.default_code,
    orderLine.productCode,
    orderLine.product_code,
    orderLine.name,
  ].filter((value) => compactText(value));
}

function resolveOdooRoute(data, payload) {
  const routes = Array.isArray(data?.routes) ? data.routes : [];
  const candidates = getOdooRouteCandidates(payload).map(normalizeLookupValue).filter(Boolean);

  for (const route of routes) {
    const routeValues = [
      route.id,
      route.title,
      route.area,
      route.odooProductCode,
      route.productCode,
      route.externalId,
    ].map(normalizeLookupValue);
    if (routeValues.some((value) => value && candidates.includes(value))) {
      return route;
    }
  }

  if (!candidates.length && routes.length === 1) {
    return routes[0];
  }

  return null;
}

function makeActivationCode(route, data) {
  const prefix = compactText(route?.area || route?.title || "ERE")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z]/gi, "")
    .slice(0, 3)
    .toUpperCase()
    .padEnd(3, "E");

  let code = "";
  do {
    code = `${randomInt(100, 1000)}-${prefix}-${randomInt(100, 1000)}`;
  } while (data.codes.some((item) => item.code === code));
  return code;
}

function getOdooOrderId(payload) {
  const order = payload?.order && typeof payload.order === "object" ? payload.order : {};
  return getFirstText(
    payload?.orderId,
    payload?.order_id,
    payload?.saleOrderId,
    payload?.sale_order_id,
    payload?.orderName,
    payload?.order_name,
    payload?.name,
    order.id,
    order.name,
  );
}

function getOdooOrderLineId(payload) {
  const orderLine = payload?.orderLine && typeof payload.orderLine === "object" ? payload.orderLine : {};
  return getFirstText(
    payload?.orderLineId,
    payload?.order_line_id,
    payload?.lineId,
    payload?.line_id,
    orderLine.id,
  );
}

function findExistingOdooCode(data, route, payload) {
  const orderId = getOdooOrderId(payload);
  if (!orderId) return null;
  const orderLineId = getOdooOrderLineId(payload);

  return data.codes.find((item) => (
    item.routeId === route.id
      && item.source === "odoo"
      && compactText(item.odooOrderId) === orderId
      && (!orderLineId || compactText(item.odooOrderLineId) === orderLineId)
  )) || null;
}

function createOdooCode(data, route, payload) {
  const partner = payload?.partner && typeof payload.partner === "object" ? payload.partner : {};
  const customer = payload?.customer && typeof payload.customer === "object" ? payload.customer : {};
  const orderId = getOdooOrderId(payload);
  const orderLineId = getOdooOrderLineId(payload);
  const activationCode = {
    code: makeActivationCode(route, data),
    routeId: route.id,
    status: "available",
    teamId: null,
    createdAt: Date.now(),
    source: "odoo",
    odooOrderId: orderId || null,
    odooOrderLineId: orderLineId || null,
    customerEmail: getFirstText(payload?.customerEmail, payload?.customer_email, customer.email, partner.email) || null,
    customerName: getFirstText(payload?.customerName, payload?.customer_name, customer.name, partner.name) || null,
  };
  data.codes.unshift(activationCode);
  return activationCode;
}

function findExistingStripeCode(data, sessionId) {
  return data.codes.find((item) => (
    item.source === "stripe"
      && compactText(item.stripeSessionId) === compactText(sessionId)
  )) || null;
}

function getStripeCustomField(session, key) {
  const field = Array.isArray(session?.custom_fields)
    ? session.custom_fields.find((item) => item?.key === key)
    : null;
  return getFirstText(field?.text?.value, field?.numeric?.value, field?.dropdown?.value) || null;
}

function normalizeStripeAddress(address) {
  if (!address || typeof address !== "object") return null;
  const normalized = {
    line1: getFirstText(address.line1) || null,
    line2: getFirstText(address.line2) || null,
    postalCode: getFirstText(address.postal_code, address.postalCode) || null,
    city: getFirstText(address.city) || null,
    state: getFirstText(address.state) || null,
    country: getFirstText(address.country) || null,
  };
  return Object.values(normalized).some(Boolean) ? normalized : null;
}

function formatCustomerAddress(address) {
  if (!address) return "";
  return [
    address.line1,
    address.line2,
    [address.postalCode, address.city].filter(Boolean).join(" "),
    address.state,
    address.country,
  ].filter(Boolean).join("\n");
}

function getStripeCustomerInfo(session) {
  const customerDetails = session?.customer_details && typeof session.customer_details === "object"
    ? session.customer_details
    : {};
  const firstName = getStripeCustomField(session, "prenom");
  const lastName = getStripeCustomField(session, "nom");
  const fallbackName = getFirstText(customerDetails.individual_name, customerDetails.name);
  const fullName = [firstName, lastName].filter(Boolean).join(" ") || fallbackName || null;

  return {
    email: getFirstText(session.customer_email, customerDetails.email) || null,
    name: fullName,
    firstName,
    lastName,
    phone: getFirstText(customerDetails.phone) || null,
    address: normalizeStripeAddress(customerDetails.address),
    stripeCustomerId: compactText(session.customer) || null,
  };
}

function createStripeCode(data, route, session) {
  const customer = getStripeCustomerInfo(session);
  const activationCode = {
    code: makeActivationCode(route, data),
    routeId: route.id,
    status: "available",
    teamId: null,
    createdAt: Date.now(),
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
    playerCount: getPlayerCount(session?.metadata?.playerCount),
  };
  data.codes.unshift(activationCode);
  return activationCode;
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

    const existing = findExistingStripeCode(stored, session.id);
    const activationCode = existing || createStripeCode(stored, route, session);
    if (!existing) {
      await writeStoredData(stored);
    }

    return {
      status: 200,
      payload: {
        ok: true,
        reused: Boolean(existing),
        code: activationCode.code,
        activationCode: activationCode.code,
        routeId: route.id,
        routeTitle: route.title,
        stripeSessionId: session.id,
        customerEmail: activationCode.customerEmail,
        customerName: activationCode.customerName,
        customerFirstName: activationCode.customerFirstName,
        customerLastName: activationCode.customerLastName,
        customerAddress: activationCode.customerAddress,
        playerCount: activationCode.playerCount,
        emailSubject: "Votre code Escape Erezee",
        emailBody: buildActivationMailBody(activationCode.code, route, activationCode),
        emailSent: Boolean(activationCode.confirmationEmailSentAt),
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

function buildActivationMailBody(code, route, customer = {}) {
  const greetingName = getFirstText(customer.customerFirstName, customer.customerName);
  return [
    greetingName ? `Bonjour ${greetingName},` : "Bonjour,",
    "",
    `Merci pour votre achat du parcours ${route.title}.`,
    `Votre code d'activation est : ${code}`,
    "",
    "Informations de votre reservation :",
    `- Parcours : ${route.title}`,
    customer.playerCount ? `- Participants : ${customer.playerCount}` : null,
    customer.customerName ? `- Nom : ${customer.customerName}` : null,
    customer.customerEmail ? `- E-mail : ${customer.customerEmail}` : null,
    customer.customerAddress ? `- Adresse : ${formatCustomerAddress(customer.customerAddress).replace(/\n/g, ", ")}` : null,
    "",
    `Vous pouvez demarrer la partie ici : ${PUBLIC_APP_URL}/index.html#player`,
    "",
    "Bonne aventure !",
  ].filter((line) => line !== null).join("\n");
}

function buildActivationMailHtml(code, route, customer = {}) {
  const address = formatCustomerAddress(customer.customerAddress);
  const addressHtml = address
    ? address.split("\n").map((line) => escapeHtml(line)).join("<br>")
    : "";
  const rows = [
    ["Parcours", route.title],
    customer.playerCount ? ["Participants", customer.playerCount] : null,
    customer.customerName ? ["Nom", customer.customerName] : null,
    customer.customerEmail ? ["E-mail", customer.customerEmail] : null,
    addressHtml ? ["Adresse", addressHtml, true] : null,
  ].filter(Boolean);

  return `
    <div style="font-family:Arial,sans-serif;color:#123c32;line-height:1.5">
      <h1 style="margin:0 0 12px">Votre code Escape Erezée</h1>
      <p>Merci pour votre achat du parcours <strong>${escapeHtml(route.title)}</strong>.</p>
      <p style="font-size:20px">Votre code d'activation : <strong>${escapeHtml(code)}</strong></p>
      <table cellpadding="6" cellspacing="0" style="border-collapse:collapse">
        ${rows.map(([label, value, isHtml]) => `
          <tr>
            <td style="font-weight:bold;vertical-align:top">${escapeHtml(label)}</td>
            <td>${isHtml ? value : escapeHtml(value)}</td>
          </tr>
        `).join("")}
      </table>
      <p><a href="${escapeHtml(PUBLIC_APP_URL)}/index.html#player">Démarrer la partie</a></p>
      <p>Bonne aventure !</p>
    </div>
  `;
}

async function sendConfirmationEmailForCode(codeValue) {
  if (!RESEND_API_KEY || !MAIL_FROM) {
    return { configured: false, sent: false };
  }

  const pending = await withDataMutation(async () => {
    const stored = await readStoredData();
    const code = stored?.codes?.find((item) => item.code === codeValue);
    if (!stored || !code) return null;
    if (code.confirmationEmailSentAt) {
      return { alreadySent: true };
    }
    if (code.confirmationEmailStatus === "sending" && Date.now() - Number(code.confirmationEmailStartedAt || 0) < 5 * 60 * 1000) {
      return { alreadySending: true };
    }
    const route = stored.routes.find((item) => item.id === code.routeId);
    if (!route || !code.customerEmail) {
      code.confirmationEmailStatus = code.customerEmail ? "error" : "missing_email";
      code.confirmationEmailError = code.customerEmail ? "Parcours introuvable." : "Adresse e-mail manquante.";
      await writeStoredData(stored);
      return { configured: true, sent: false, skipped: true };
    }
    code.confirmationEmailStatus = "sending";
    code.confirmationEmailStartedAt = Date.now();
    code.confirmationEmailError = null;
    await writeStoredData(stored);
    return { code: { ...code }, route };
  });

  if (!pending || pending.alreadySent || pending.alreadySending || pending.skipped) {
    return {
      configured: true,
      sent: Boolean(pending?.alreadySent),
      skipped: Boolean(pending?.skipped || pending?.alreadySending),
    };
  }

  try {
    const subject = "Votre code Escape Erezée";
    const mailResult = await sendResendEmail({
      to: pending.code.customerEmail,
      subject,
      text: buildActivationMailBody(pending.code.code, pending.route, pending.code),
      html: buildActivationMailHtml(pending.code.code, pending.route, pending.code),
    });
    await withDataMutation(async () => {
      const stored = await readStoredData();
      const code = stored?.codes?.find((item) => item.code === codeValue);
      if (!stored || !code) return;
      code.confirmationEmailStatus = "sent";
      code.confirmationEmailSentAt = Date.now();
      code.confirmationEmailProvider = mailResult.provider;
      code.confirmationEmailId = mailResult.id || null;
      code.confirmationEmailError = null;
      await writeStoredData(stored);
    });
    return mailResult;
  } catch (error) {
    await withDataMutation(async () => {
      const stored = await readStoredData();
      const code = stored?.codes?.find((item) => item.code === codeValue);
      if (!stored || !code) return;
      code.confirmationEmailStatus = "error";
      code.confirmationEmailError = error.message || "E-mail non envoye.";
      await writeStoredData(stored);
    });
    return { configured: true, sent: false, error: error.message || "E-mail non envoye." };
  }
}

async function handleOdooActivationCode(request, response) {
  if (request.method !== "POST") {
    sendJson(response, 405, { message: "Methode non autorisee." });
    return true;
  }

  if (!ODOO_WEBHOOK_SECRET) {
    sendJson(response, 503, { message: "Integration Odoo non configuree." });
    return true;
  }

  try {
    const body = await readRequestBody(request);
    const payload = body ? JSON.parse(body) : {};
    if (!safeCompare(getOdooSecret(request, payload), ODOO_WEBHOOK_SECRET)) {
      sendJson(response, 401, { message: "Cle Odoo invalide." });
      return true;
    }

    const result = await withDataMutation(async () => {
      const stored = await readStoredData();
      if (!stored) {
        return { status: 409, payload: { message: "Aucune donnee serveur disponible." } };
      }

      const route = resolveOdooRoute(stored, payload);
      if (!route) {
        return { status: 400, payload: { message: "Parcours introuvable pour cette commande." } };
      }

      const existing = findExistingOdooCode(stored, route, payload);
      const activationCode = existing || createOdooCode(stored, route, payload);
      if (!existing) {
        await writeStoredData(stored);
      }

      return {
        status: 200,
        payload: {
          ok: true,
          reused: Boolean(existing),
          code: activationCode.code,
          activationCode: activationCode.code,
          routeId: route.id,
          routeTitle: route.title,
          orderId: activationCode.odooOrderId,
          customerEmail: activationCode.customerEmail,
          emailSubject: "Votre code Escape Erezee",
          emailBody: buildActivationMailBody(activationCode.code, route),
        },
      };
    });

    sendJson(response, result.status, result.payload);
  } catch (error) {
    sendJson(response, 400, { message: error.message || "Creation du code impossible." });
  }

  return true;
}

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

    const playerCount = getPlayerCount(payload.playerCount);
    const origin = getRequestOrigin(request);
    const params = new URLSearchParams();
    appendStripeParam(params, "mode", "payment");
    appendStripeParam(params, "client_reference_id", route.id);
    appendStripeParam(params, "customer_creation", "always");
    appendStripeParam(params, "billing_address_collection", "required");
    appendStripeParam(params, "success_url", `${origin}/index.html?checkout=success&session_id={CHECKOUT_SESSION_ID}#player`);
    appendStripeParam(params, "cancel_url", `${origin}/index.html?checkout=cancel#player`);
    appendStripeParam(params, "line_items[0][quantity]", playerCount);
    appendStripeParam(params, "line_items[0][price_data][currency]", "eur");
    appendStripeParam(params, "line_items[0][price_data][unit_amount]", unitAmount);
    appendStripeParam(params, "line_items[0][price_data][product_data][name]", route.title);
    appendStripeParam(params, "line_items[0][price_data][product_data][description]", route.description || route.area || route.title);
    appendStripeParam(params, "metadata[routeId]", route.id);
    appendStripeParam(params, "metadata[playerCount]", playerCount);
    appendStripeParam(params, "custom_fields[0][key]", "prenom");
    appendStripeParam(params, "custom_fields[0][label][type]", "custom");
    appendStripeParam(params, "custom_fields[0][label][custom]", "Prénom");
    appendStripeParam(params, "custom_fields[0][type]", "text");
    appendStripeParam(params, "custom_fields[0][text][maximum_length]", 80);
    appendStripeParam(params, "custom_fields[0][optional]", "false");
    appendStripeParam(params, "custom_fields[1][key]", "nom");
    appendStripeParam(params, "custom_fields[1][label][type]", "custom");
    appendStripeParam(params, "custom_fields[1][label][custom]", "Nom");
    appendStripeParam(params, "custom_fields[1][type]", "text");
    appendStripeParam(params, "custom_fields[1][text][maximum_length]", 80);
    appendStripeParam(params, "custom_fields[1][optional]", "false");
    appendStripeParam(params, "custom_text[submit][message]", "Votre code d'activation sera envoyé par e-mail après paiement.");

    const session = await stripeRequest("POST", "/v1/checkout/sessions", params);
    sendJson(response, 200, { ok: true, url: session.url, sessionId: session.id });
  } catch (error) {
    sendJson(response, 400, { message: error.message || "Paiement indisponible." });
  }

  return true;
}

async function handleCheckoutSession(request, response) {
  if (request.method !== "GET") {
    sendJson(response, 405, { message: "Methode non autorisee." });
    return true;
  }
  if (!STRIPE_SECRET_KEY) {
    sendJson(response, 503, { message: "Paiement Stripe non configure." });
    return true;
  }

  try {
    const requestUrl = new URL(request.url, getRequestOrigin(request));
    const sessionId = compactText(requestUrl.searchParams.get("session_id"));
    if (!sessionId) {
      sendJson(response, 400, { message: "Session Stripe manquante." });
      return true;
    }

    const session = await stripeRequest("GET", `/v1/checkout/sessions/${encodeURIComponent(sessionId)}`);
    if (session.payment_status !== "paid") {
      sendJson(response, 409, { message: "Paiement pas encore valide." });
      return true;
    }

    const result = await createOrReuseStripeCode(session);
    sendJson(response, result.status, result.payload);
  } catch (error) {
    sendJson(response, 400, { message: error.message || "Code indisponible." });
  }

  return true;
}

async function handleStripeWebhook(request, response) {
  if (request.method !== "POST") {
    sendJson(response, 405, { message: "Methode non autorisee." });
    return true;
  }
  if (!STRIPE_WEBHOOK_SECRET) {
    sendJson(response, 503, { message: "Webhook Stripe non configure." });
    return true;
  }

  const rawBody = await readRequestBody(request);
  if (!verifyStripeSignature(rawBody, request.headers["stripe-signature"])) {
    sendJson(response, 401, { message: "Signature Stripe invalide." });
    return true;
  }

  try {
    const event = JSON.parse(rawBody);
    if (event.type === "checkout.session.completed") {
      const session = event.data?.object;
      if (session?.payment_status === "paid") {
        await createOrReuseStripeCode(session);
      }
    }
    sendJson(response, 200, { received: true });
  } catch (error) {
    sendJson(response, 400, { message: error.message || "Webhook Stripe illisible." });
  }

  return true;
}

async function handleApi(request, response, pathname) {
  if (pathname === "/api/health") {
    sendJson(response, 200, { ok: true });
    return true;
  }

  if (pathname === "/api/admin/session") {
    if (request.method !== "GET") {
      sendJson(response, 405, { message: "Methode non autorisee." });
      return true;
    }
    sendJson(response, 200, { authenticated: isAdminRequest(request) });
    return true;
  }

  if (pathname === "/api/admin/login") {
    if (request.method !== "POST") {
      sendJson(response, 405, { message: "Methode non autorisee." });
      return true;
    }
    try {
      const body = await readRequestBody(request);
      const payload = body ? JSON.parse(body) : {};
      if (!safeCompare(payload.password, ADMIN_PASSWORD)) {
        sendJson(response, 401, { message: "Mot de passe incorrect." });
        return true;
      }
      sendJson(response, 200, { ok: true }, {
        "Set-Cookie": makeAdminCookie(request, ADMIN_SESSION_TOKEN, ADMIN_SESSION_MAX_AGE),
      });
    } catch {
      sendJson(response, 400, { message: "Connexion impossible." });
    }
    return true;
  }

  if (pathname === "/api/admin/logout") {
    if (request.method !== "POST") {
      sendJson(response, 405, { message: "Methode non autorisee." });
      return true;
    }
    sendJson(response, 200, { ok: true }, {
      "Set-Cookie": makeAdminCookie(request, "", 0),
    });
    return true;
  }

  if (pathname === "/api/odoo/activation-code" || pathname === "/api/integrations/odoo/activation-code") {
    return handleOdooActivationCode(request, response);
  }

  if (pathname === "/api/shop/checkout") {
    return handleCreateCheckoutSession(request, response);
  }

  if (pathname === "/api/shop/checkout-session") {
    return handleCheckoutSession(request, response);
  }

  if (pathname === "/api/stripe/webhook") {
    return handleStripeWebhook(request, response);
  }

  if (pathname !== "/api/data") return false;

  if (request.method === "GET") {
    const stored = await readStoredData();
    if (!stored) {
      sendJson(response, 404, { message: "Aucune donnee serveur pour le moment." });
      return true;
    }
    sendJson(response, 200, stored);
    return true;
  }

  if (request.method === "PUT" || request.method === "POST") {
    try {
      const body = await readRequestBody(request);
      const payload = JSON.parse(body);
      if (!isAppData(payload)) {
        sendJson(response, 400, { message: "Format de donnees invalide." });
        return true;
      }
      const saveResult = await withDataMutation(async () => {
        const stored = await readStoredData();
        if (!isAdminRequest(request) && !isPlayerSafeUpdate(stored, payload)) {
          return { status: 403, payload: { message: "Acces gestion requis." } };
        }
        await writeStoredData(payload);
        return { status: 200, payload: { ok: true, savedAt: Date.now() } };
      });
      if (saveResult.status !== 200) {
        sendJson(response, saveResult.status, saveResult.payload);
        return true;
      }
      sendJson(response, saveResult.status, saveResult.payload);
    } catch (error) {
      sendJson(response, 400, { message: error.message || "Sauvegarde impossible." });
    }
    return true;
  }

  sendJson(response, 405, { message: "Methode non autorisee." });
  return true;
}

function resolveStaticPath(pathname) {
  const decoded = decodeURIComponent(pathname);
  const cleanPath = decoded === "/" ? "/index.html" : decoded;
  const resolved = path.resolve(ROOT_DIR, `.${cleanPath}`);
  if (!resolved.startsWith(ROOT_DIR)) return null;
  return resolved;
}

async function serveStaticFile(response, pathname) {
  const filePath = resolveStaticPath(pathname);
  if (!filePath) {
    response.writeHead(403);
    response.end("Forbidden");
    return;
  }

  try {
    const fileStat = await stat(filePath);
    const finalPath = fileStat.isDirectory() ? path.join(filePath, "index.html") : filePath;
    const content = await readFile(finalPath);
    const extension = path.extname(finalPath).toLowerCase();
    response.writeHead(200, {
      "Content-Type": MIME_TYPES[extension] || "application/octet-stream",
      "Cache-Control": pathname.startsWith("/api/") ? "no-store" : "no-cache",
    });
    response.end(content);
  } catch {
    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Not found");
  }
}

function getLanUrls(port) {
  return Object.values(os.networkInterfaces())
    .flat()
    .filter((item) => item && item.family === "IPv4" && !item.internal)
    .map((item) => `http://${item.address}:${port}/index.html`);
}

export function startServer(options = {}) {
  const port = Number(options.port) || 4173;
  const host = options.host || "127.0.0.1";

  const server = createServer(async (request, response) => {
    try {
      const requestUrl = new URL(request.url || "/", `http://${request.headers.host || `${host}:${port}`}`);
      const handled = await handleApi(request, response, requestUrl.pathname);
      if (handled) return;
      await serveStaticFile(response, requestUrl.pathname);
    } catch (error) {
      sendJson(response, 500, { message: error.message || "Erreur serveur." });
    }
  });

  return new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(port, host, () => {
      server.off("error", reject);
      const url = host === "0.0.0.0" ? `http://127.0.0.1:${port}/index.html` : `http://${host}:${port}/index.html`;
      const lanUrls = host === "0.0.0.0" ? getLanUrls(port) : [];
      console.log(`Escape Erezée prêt : ${url}`);
      lanUrls.forEach((lanUrl) => console.log(`Téléphone : ${lanUrl}`));
      resolve({ server, url, lanUrls, port, host });
    });
  });
}

const launchedFile = globalThis.process?.argv?.[1]
  ? path.resolve(globalThis.process.argv[1])
  : "";

if (launchedFile && launchedFile === fileURLToPath(import.meta.url)) {
  const port = Number(globalThis.process?.env?.PORT) || 4173;
  const host = globalThis.process?.env?.HOST || "0.0.0.0";
  startServer({ port, host }).catch((error) => {
    console.error(error);
    globalThis.process?.exit?.(1);
  });
}
