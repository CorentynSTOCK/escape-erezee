import { createServer } from "node:http";
import { createHash, timingSafeEqual } from "node:crypto";
import { readFile, rename, stat, writeFile, mkdir } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT_DIR = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = globalThis.process?.env?.DATA_DIR || path.join(ROOT_DIR, "data");
const DATA_FILE = path.join(DATA_DIR, "escape-data.json");
const MAX_BODY_SIZE = 30 * 1024 * 1024;
const ADMIN_PASSWORD = globalThis.process?.env?.ADMIN_PASSWORD || "ErezeeGestion-2026!";
const ADMIN_COOKIE_NAME = "escape_erezee_admin";
const ADMIN_SESSION_MAX_AGE = 12 * 60 * 60;
const ADMIN_SESSION_TOKEN = createHash("sha256")
  .update(`${ADMIN_PASSWORD}:${globalThis.process?.env?.ADMIN_SESSION_SECRET || DATA_FILE}`)
  .digest("hex");

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
      const stored = await readStoredData();
      if (!isAdminRequest(request) && !isPlayerSafeUpdate(stored, payload)) {
        sendJson(response, 403, { message: "Acces gestion requis." });
        return true;
      }
      await writeStoredData(payload);
      sendJson(response, 200, { ok: true, savedAt: Date.now() });
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
