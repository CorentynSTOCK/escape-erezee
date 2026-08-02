import { createServer } from "node:http";
import { createHash, createHmac, randomInt, timingSafeEqual } from "node:crypto";
import { mkdir, readFile, readdir, rename, stat, unlink, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT_DIR = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = globalThis.process?.env?.DATA_DIR || path.join(ROOT_DIR, "data");
const DATA_FILE = path.join(DATA_DIR, "escape-data.json");
const DATA_BACKUP_DIR = path.join(DATA_DIR, "backups");
const MAX_DATA_BACKUPS = 5;
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
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
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

function isSeedDemoData(value) {
  const routes = Array.isArray(value?.routes) ? value.routes : [];
  return (
    routes.length === 1
    && routes[0]?.id === "route-tramway"
    && routes[0]?.title === "Le Secret du Tramway"
  );
}

function isProtectedRouteCatalogReset(previousData, nextData) {
  const previousRoutes = Array.isArray(previousData?.routes) ? previousData.routes : [];
  const nextRoutes = Array.isArray(nextData?.routes) ? nextData.routes : [];
  if (previousRoutes.length < 2 || nextRoutes.length !== 1) return false;

  const nextRoute = nextRoutes[0] || {};
  const previousRouteIds = new Set(previousRoutes.map((route) => route?.id).filter(Boolean));
  return (
    !previousRouteIds.has(nextRoute.id)
    && nextRoute.id === "route-tramway"
    && nextRoute.title === "Le Secret du Tramway"
  );
}

function codesKeepSameCatalog(previousCodes, nextCodes) {
  if (!Array.isArray(previousCodes) || !Array.isArray(nextCodes)) return false;
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
  if (!previousData) return false;
  return (
    previousData.activeRouteId === nextData.activeRouteId
    && stableJson(previousData.routes) === stableJson(nextData.routes)
    && codesKeepSameCatalog(previousData.codes, nextData.codes)
    && Array.isArray(nextData.teams)
  );
}

function syncMergeObjectMap(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function syncMergeNumberMap(previous, next) {
  const merged = { ...syncMergeObjectMap(previous) };
  Object.entries(syncMergeObjectMap(next)).forEach(([key, value]) => {
    const nextNumber = Number(value);
    const previousNumber = Number(merged[key]);
    if (!Object.prototype.hasOwnProperty.call(merged, key)) {
      merged[key] = value;
      return;
    }
    if (Number.isFinite(nextNumber) && (!Number.isFinite(previousNumber) || nextNumber > previousNumber)) {
      merged[key] = value;
    }
  });
  return merged;
}

function syncMergeStringList(previous, next) {
  return Array.from(new Set([
    ...(Array.isArray(previous) ? previous : []),
    ...(Array.isArray(next) ? next : []),
  ].filter((item) => typeof item === "string" && item)));
}

function syncMergeTerminalStatus(status) {
  return status === "won" || status === "lost";
}

function syncMergeFreshness(team) {
  return Math.max(
    Number(team?.updatedAt) || 0,
    Number(team?.lastPosition?.at) || 0,
    Number(team?.briefingStartLocation?.at) || 0,
    Number(team?.finishedAt) || 0,
    Number(team?.startAt) || 0,
  );
}

function syncMergeAnswerCount(team) {
  return Object.keys(syncMergeObjectMap(team?.answers)).length;
}

function syncMergePlayerTeam(previousTeam, nextTeam) {
  const previous = previousTeam && typeof previousTeam === "object" ? previousTeam : {};
  const next = nextTeam && typeof nextTeam === "object" ? nextTeam : {};
  const merged = { ...previous };
  if (syncMergeFreshness(next) >= syncMergeFreshness(previous)) {
    ["id", "name", "routeId", "code"].forEach((field) => {
      if (typeof next[field] === "string" && next[field]) merged[field] = next[field];
    });
  }

  merged.answers = { ...syncMergeObjectMap(previous.answers), ...syncMergeObjectMap(next.answers) };
  merged.unlockedPuzzleIds = syncMergeStringList(previous.unlockedPuzzleIds, next.unlockedPuzzleIds);
  merged.attempts = syncMergeNumberMap(previous.attempts, next.attempts);
  merged.hints = syncMergeNumberMap(previous.hints, next.hints);
  merged.photoNames = { ...syncMergeObjectMap(previous.photoNames), ...syncMergeObjectMap(next.photoNames) };
  if (!merged.startAt && next.startAt) merged.startAt = next.startAt;

  const previousPositionAt = Number(previous.lastPosition?.at) || 0;
  const nextPositionAt = Number(next.lastPosition?.at) || 0;
  if (next.lastPosition && nextPositionAt >= previousPositionAt) merged.lastPosition = next.lastPosition;

  const previousTerminal = syncMergeTerminalStatus(previous.status);
  const nextTerminal = syncMergeTerminalStatus(next.status);
  if (nextTerminal && (!previousTerminal || syncMergeAnswerCount(next) >= syncMergeAnswerCount(previous) || (Number(next.finishedAt) || 0) >= (Number(previous.finishedAt) || 0))) {
    merged.status = next.status;
    merged.finishedAt = next.finishedAt || previous.finishedAt || next.updatedAt || Date.now();
  } else if (previousTerminal) {
    merged.status = previous.status;
    merged.finishedAt = previous.finishedAt;
  } else if (next.status) {
    merged.status = previous.status === "playing" && next.status === "briefing" ? previous.status : next.status;
    if (!syncMergeTerminalStatus(merged.status)) merged.finishedAt = null;
  }

  merged.updatedAt = Math.max(
    Number(previous.updatedAt) || 0,
    Number(next.updatedAt) || 0,
    Number(merged.lastPosition?.at) || 0,
    Number(merged.finishedAt) || 0,
  ) || previous.updatedAt || next.updatedAt || Date.now();
  return merged;
}

function syncMergePlayerCodes(previousCodes, nextCodes) {
  const nextByCode = new Map((Array.isArray(nextCodes) ? nextCodes : []).map((code) => [code.code, code]));
  return (Array.isArray(previousCodes) ? previousCodes : []).map((previousCode) => {
    const nextCode = nextByCode.get(previousCode.code);
    if (!nextCode || previousCode.teamDeletedAt) return previousCode;
    const merged = { ...previousCode };
    if (nextCode.status === "used") merged.status = "used";
    if (!merged.teamId && typeof nextCode.teamId === "string") merged.teamId = nextCode.teamId;
    return merged;
  });
}

function syncMergeCanAddPlayerTeam(data, team) {
  if (!team?.id) return false;
  const code = (data.codes || []).find((item) => item.code === team.code || item.teamId === team.id);
  return Boolean(code && !code.teamDeletedAt && (!code.teamId || code.teamId === team.id || code.code === team.code));
}

function syncMergePlayerSafeData(previousData, nextData) {
  if (!previousData) return nextData;
  const merged = {
    ...previousData,
    codes: syncMergePlayerCodes(previousData.codes, nextData.codes),
    teams: Array.isArray(previousData.teams) ? previousData.teams.map((team) => ({ ...team })) : [],
  };
  const teamIndexById = new Map(merged.teams.map((team, index) => [team.id, index]));
  (Array.isArray(nextData.teams) ? nextData.teams : []).forEach((nextTeam) => {
    if (!nextTeam?.id) return;
    const existingIndex = teamIndexById.get(nextTeam.id);
    if (existingIndex !== undefined) {
      merged.teams[existingIndex] = syncMergePlayerTeam(merged.teams[existingIndex], nextTeam);
      return;
    }
    if (!syncMergeCanAddPlayerTeam(merged, nextTeam)) return;
    const addedTeam = syncMergePlayerTeam({}, nextTeam);
    teamIndexById.set(addedTeam.id, merged.teams.length);
    merged.teams.push(addedTeam);
    const code = merged.codes.find((item) => item.code === addedTeam.code || item.teamId === addedTeam.id);
    if (code && !code.teamDeletedAt) {
      code.status = "used";
      code.teamId = addedTeam.id;
    }
  });
  return merged;
}

function getTeamFreshness(team) {
  return Math.max(
    Number(team?.updatedAt) || 0,
    Number(team?.lastPosition?.at) || 0,
    Number(team?.finishedAt) || 0,
    Number(team?.startAt) || 0,
  );
}

function countTeamProgressSignals(team) {
  return [
    team?.answers,
    team?.unlockedPuzzleIds,
    team?.attempts,
    team?.hints,
    team?.photoNames,
  ].reduce((total, value) => {
    if (Array.isArray(value)) return total + value.length;
    if (value && typeof value === "object") return total + Object.keys(value).length;
    return total;
  }, 0);
}

function shouldUseIncomingTeam(storedTeam, incomingTeam) {
  if (!storedTeam) return true;
  const storedFreshness = getTeamFreshness(storedTeam);
  const incomingFreshness = getTeamFreshness(incomingTeam);
  if (incomingFreshness && storedFreshness) return incomingFreshness >= storedFreshness;
  return countTeamProgressSignals(incomingTeam) >= countTeamProgressSignals(storedTeam);
}

function mergePlayerSafeUpdate(storedData, incomingData) {
  if (!storedData) return incomingData;

  const incomingCodes = new Map(incomingData.codes.map((code) => [code.code, code]));
  const codes = storedData.codes.map((storedCode) => {
    const incomingCode = incomingCodes.get(storedCode.code);
    if (!incomingCode) return storedCode;
    if (storedCode.status === "used" && incomingCode.status !== "used") return storedCode;
    return {
      ...storedCode,
      status: incomingCode.status,
      teamId: incomingCode.teamId ?? null,
    };
  });

  const teamsById = new Map(storedData.teams.map((team) => [team.id, team]));
  incomingData.teams.forEach((incomingTeam) => {
    const storedTeam = teamsById.get(incomingTeam.id);
    if (shouldUseIncomingTeam(storedTeam, incomingTeam)) {
      teamsById.set(incomingTeam.id, incomingTeam);
    }
  });

  return {
    ...storedData,
    codes,
    teams: [...teamsById.values()],
  };
}

function isAdminDataWriteRequest(request) {
  return isAdminRequest(request) && request.headers["x-escape-admin-write"] === "1";
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

async function pruneDataBackups() {
  try {
    const entries = await readdir(DATA_BACKUP_DIR, { withFileTypes: true });
    const backups = await Promise.all(entries
      .filter((entry) => entry.isFile() && entry.name.startsWith("escape-data-") && entry.name.endsWith(".json"))
      .map(async (entry) => {
        const filePath = path.join(DATA_BACKUP_DIR, entry.name);
        const fileStat = await stat(filePath);
        return { name: entry.name, modifiedAt: fileStat.mtimeMs };
      }));
    const excess = backups
      .sort((a, b) => Number(b.modifiedAt || 0) - Number(a.modifiedAt || 0))
      .slice(MAX_DATA_BACKUPS);
    await Promise.all(excess.map((backup) => unlink(path.join(DATA_BACKUP_DIR, backup.name)).catch(() => {})));
  } catch (error) {
    if (error.code !== "ENOENT") console.warn("Nettoyage des sauvegardes impossible.", error);
  }
}

async function backupStoredDataIfPresent(nextPayload) {
  try {
    const raw = await readFile(DATA_FILE, "utf8");
    const parsed = JSON.parse(raw);
    if (!isAppData(parsed) || stableJson(parsed) === stableJson(nextPayload)) return;
    await mkdir(DATA_BACKUP_DIR, { recursive: true });
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    const backupFile = path.join(DATA_BACKUP_DIR, `escape-data-before-write-${stamp}.json`);
    await writeFile(backupFile, `${JSON.stringify(parsed, null, 2)}\n`, "utf8");
    await pruneDataBackups();
  } catch (error) {
    if (error.code !== "ENOENT") console.warn("Sauvegarde de protection impossible.", error);
  }
}

async function writeStoredData(payload) {
  await mkdir(DATA_DIR, { recursive: true });
  await backupStoredDataIfPresent(payload);
  const tempFile = `${DATA_FILE}.tmp`;
  await writeFile(tempFile, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  await rename(tempFile, DATA_FILE);
}

const ADMIN_ROBUSTNESS_MIN_ROUTE_COUNT_V167 = 3;
const ADMIN_ROBUSTNESS_BACKUP_COOLDOWN_MS_V167 = 10 * 60 * 1000;
let adminRobustnessLastBackupAtV167 = 0;

function adminRobustnessHashV167(value) {
  return createHash("sha256").update(JSON.stringify(value || null)).digest("hex").slice(0, 16);
}

function adminRobustnessDuplicatesV167(values) {
  const seen = new Set();
  const duplicates = new Set();
  values.filter(Boolean).forEach((value) => {
    if (seen.has(value)) duplicates.add(value);
    seen.add(value);
  });
  return Array.from(duplicates);
}

function adminRouteContentStatsV191(route) {
  const puzzles = Array.isArray(route?.puzzles) ? route.puzzles : [];
  return {
    puzzleCount: puzzles.length,
    titleCount: puzzles.filter((puzzle) => compactText(puzzle?.title)).length,
    questionCount: puzzles.filter((puzzle) => compactText(puzzle?.question)).length,
    placeCount: puzzles.filter((puzzle) => compactText(puzzle?.place)).length,
    answerCount: puzzles.filter((puzzle) => compactText(puzzle?.answer) || (Array.isArray(puzzle?.acceptedAnswers) && puzzle.acceptedAnswers.length)).length,
    gpsCount: puzzles.filter((puzzle) => Number.isFinite(Number(puzzle?.lat)) && Number.isFinite(Number(puzzle?.lng))).length,
    lockedGpsCount: puzzles.filter((puzzle) => Boolean(puzzle?.requireLocation)).length,
    hintCount: puzzles.reduce((sum, puzzle) => sum + (Array.isArray(puzzle?.hints) ? puzzle.hints.filter(Boolean).length : 0), 0),
    imageCount: puzzles.filter((puzzle) => puzzle?.image?.dataUrl || puzzle?.image?.url).length,
    routeStartGps: Number.isFinite(Number(route?.startLat)) && Number.isFinite(Number(route?.startLng)),
  };
}

function adminRouteContentLossV191(previousRoute, nextRoute) {
  if (!previousRoute || !nextRoute) return [];
  const previous = adminRouteContentStatsV191(previousRoute);
  const next = adminRouteContentStatsV191(nextRoute);
  const issues = [];
  const criticalFields = [
    ["titleCount", "titres d'enigmes"],
    ["questionCount", "questions"],
    ["placeCount", "lieux"],
    ["answerCount", "reponses"],
    ["gpsCount", "points GPS"],
    ["lockedGpsCount", "verrouillages GPS"],
  ];
  criticalFields.forEach(([field, label]) => {
    const before = Number(previous[field]) || 0;
    const after = Number(next[field]) || 0;
    if (before >= 3 && after < Math.max(1, Math.floor(before * 0.5))) {
      issues.push(`${label}: ${before} -> ${after}`);
    }
  });
  if (previous.hintCount >= 6 && next.hintCount < Math.max(1, Math.floor(previous.hintCount * 0.5))) {
    issues.push(`indices: ${previous.hintCount} -> ${next.hintCount}`);
  }
  if (previous.imageCount >= 3 && next.imageCount < Math.max(1, Math.floor(previous.imageCount * 0.5))) {
    issues.push(`images d'enigmes: ${previous.imageCount} -> ${next.imageCount}`);
  }
  if (previous.routeStartGps && !next.routeStartGps) {
    issues.push("point GPS de depart supprime");
  }
  return issues;
}

function validateAdminDataPayloadV167(previousData, nextData, request) {
  const issues = [];
  const warnings = [];
  if (!isAppData(nextData)) return { ok: false, issues: ["Format de donnees invalide."], warnings };

  const previousRoutes = Array.isArray(previousData?.routes) ? previousData.routes : [];
  const nextRoutes = Array.isArray(nextData.routes) ? nextData.routes : [];
  const routeIds = nextRoutes.map((route) => compactText(route?.id));
  const routeIdSet = new Set(routeIds.filter(Boolean));
  const override = compactText(request?.headers?.["x-admin-danger-confirm"]) === "routes-delete";
  const contentOverride = compactText(request?.headers?.["x-admin-danger-confirm"]) === "route-content-loss";
  const previousRouteById = new Map(previousRoutes.map((route) => [compactText(route?.id), route]));

  if (nextRoutes.length < ADMIN_ROBUSTNESS_MIN_ROUTE_COUNT_V167) {
    issues.push("Sauvegarde bloquee: " + nextRoutes.length + " parcours seulement, " + ADMIN_ROBUSTNESS_MIN_ROUTE_COUNT_V167 + " minimum attendus.");
  }
  if (previousRoutes.length >= ADMIN_ROBUSTNESS_MIN_ROUTE_COUNT_V167 && nextRoutes.length < previousRoutes.length && !override) {
    issues.push("Sauvegarde bloquee: cette action ferait disparaitre un ou plusieurs parcours.");
  }
  const duplicateRouteIds = adminRobustnessDuplicatesV167(routeIds);
  if (duplicateRouteIds.length) issues.push("Identifiants de parcours en double: " + duplicateRouteIds.join(", ") + ".");
  if (routeIds.some((id) => !id)) issues.push("Un parcours n'a pas d'identifiant.");
  if (nextRoutes.some((route) => !compactText(route?.title))) issues.push("Un parcours n'a pas de titre.");
  if (nextData.activeRouteId && !routeIdSet.has(compactText(nextData.activeRouteId))) {
    issues.push("Le parcours actif ne correspond a aucun parcours existant.");
  }

  nextRoutes.forEach((route) => {
    const label = route?.title || route?.id || "Parcours";
    const puzzleIds = Array.isArray(route?.puzzles) ? route.puzzles.map((puzzle) => compactText(puzzle?.id)) : [];
    const duplicatePuzzleIds = adminRobustnessDuplicatesV167(puzzleIds);
    if (!Array.isArray(route?.puzzles) || route.puzzles.length === 0) warnings.push(label + ": aucune enigme renseignee.");
    if (duplicatePuzzleIds.length) issues.push(label + ": enigmes en double (" + duplicatePuzzleIds.join(", ") + ").");
    if (puzzleIds.some((id) => !id)) issues.push(label + ": une enigme n'a pas d'identifiant.");
    if (!contentOverride) {
      const losses = adminRouteContentLossV191(previousRouteById.get(compactText(route?.id)), route);
      if (losses.length) {
        issues.push(label + ": perte massive de contenu detectee (" + losses.join(", ") + "). Sauvegarde refusee pour proteger les parcours.");
      }
    }
  });

  const codeValues = Array.isArray(nextData.codes) ? nextData.codes.map((code) => compactText(code?.code)) : [];
  const duplicateCodes = adminRobustnessDuplicatesV167(codeValues);
  if (duplicateCodes.length) issues.push("Codes d'acces en double: " + duplicateCodes.slice(0, 5).join(", ") + ".");
  (nextData.codes || []).forEach((code) => {
    if (code?.routeId && !routeIdSet.has(compactText(code.routeId))) {
      issues.push("Code " + (code.code || "sans nom") + " lie a un parcours absent.");
    }
  });
  (nextData.teams || []).forEach((team) => {
    if (team?.routeId && !routeIdSet.has(compactText(team.routeId))) {
      warnings.push("Equipe " + (team.name || team.code || team.id || "sans nom") + " liee a un parcours absent.");
    }
  });

  return { ok: issues.length === 0, issues, warnings };
}

async function listAdminRobustnessBackupsV167() {
  if (typeof listDataBackups === "function") return listDataBackups();
  try {
    const entries = await readdir(DATA_BACKUP_DIR, { withFileTypes: true });
    const backups = await Promise.all(entries
      .filter((entry) => entry.isFile() && entry.name.endsWith(".json"))
      .map(async (entry) => {
        const filePath = path.join(DATA_BACKUP_DIR, entry.name);
        const fileStat = await stat(filePath);
        return { name: entry.name, size: fileStat.size, modifiedAt: fileStat.mtimeMs };
      }));
    return backups.sort((a, b) => b.modifiedAt - a.modifiedAt);
  } catch (error) {
    if (error.code === "ENOENT") return [];
    throw error;
  }
}

async function createAdminRobustnessBackupV167(reason = "manual") {
  if (reason === "manual" && typeof createManualDataBackup === "function") return createManualDataBackup();
  const raw = await readFile(DATA_FILE, "utf8");
  const parsed = JSON.parse(raw);
  if (!isAppData(parsed)) throw new Error("Donnees serveur illisibles.");
  await mkdir(DATA_BACKUP_DIR, { recursive: true });
  const safeReason = compactText(reason).replace(/[^a-z0-9-]+/gi, "-").slice(0, 40) || "admin";
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const fileName = "escape-data-" + safeReason + "-" + stamp + ".json";
  await writeFile(path.join(DATA_BACKUP_DIR, fileName), raw.endsWith("\n") ? raw : raw + "\n", "utf8");
  const fileStat = await stat(path.join(DATA_BACKUP_DIR, fileName));
  await pruneDataBackups();
  return { name: fileName, size: fileStat.size, modifiedAt: fileStat.mtimeMs };
}

async function createAdminPreSaveBackupV167(previousData, nextData) {
  if (!previousData || !nextData) return null;
  if (adminRobustnessHashV167(previousData) === adminRobustnessHashV167(nextData)) return null;
  const previousRoutes = Array.isArray(previousData.routes) ? previousData.routes.length : 0;
  const nextRoutes = Array.isArray(nextData.routes) ? nextData.routes.length : 0;
  const previousCodes = Array.isArray(previousData.codes) ? previousData.codes.length : 0;
  const nextCodes = Array.isArray(nextData.codes) ? nextData.codes.length : 0;
  const previousTeams = Array.isArray(previousData.teams) ? previousData.teams.length : 0;
  const nextTeams = Array.isArray(nextData.teams) ? nextData.teams.length : 0;
  const sensitive = nextRoutes < previousRoutes || nextCodes < previousCodes || nextTeams < previousTeams;
  if (!sensitive && Date.now() - adminRobustnessLastBackupAtV167 < ADMIN_ROBUSTNESS_BACKUP_COOLDOWN_MS_V167) return null;
  adminRobustnessLastBackupAtV167 = Date.now();
  try {
    return await createAdminRobustnessBackupV167("before-admin-save");
  } catch (error) {
    adminRobustnessLastBackupAtV167 = 0;
    throw error;
  }
}

function getTeamLastActivityV167(team) {
  const values = [team?.lastPosition?.at, team?.lastSeenAt, team?.lastSyncAt, team?.updatedAt, team?.finishedAt, team?.startAt]
    .map(Number)
    .filter((value) => Number.isFinite(value) && value > 0);
  return values.length ? Math.max(...values) : null;
}

async function buildAdminRobustnessStatusV167() {
  const checkedAt = Date.now();
  const stored = await readStoredData();
  const backups = await listAdminRobustnessBackupsV167();
  const validation = validateAdminDataPayloadV167(stored, stored, { headers: {} });
  const routes = Array.isArray(stored?.routes) ? stored.routes : [];
  const teams = Array.isArray(stored?.teams) ? stored.teams : [];
  const codes = Array.isArray(stored?.codes) ? stored.codes : [];
  const playingTeams = teams.filter((team) => team?.status === "playing");
  const staleTeams = playingTeams
    .map((team) => ({ id: team.id, name: team.name || team.code || team.id, lastActivityAt: getTeamLastActivityV167(team) }))
    .filter((team) => !team.lastActivityAt || checkedAt - team.lastActivityAt > 5 * 60 * 1000);
  const latestBackup = backups[0] || null;
  const backupAgeMs = latestBackup?.modifiedAt ? checkedAt - Number(latestBackup.modifiedAt) : null;
  const warnings = [
    ...validation.warnings,
    ...(staleTeams.length ? [staleTeams.length + " equipe(s) en cours sans activite depuis plus de 5 minutes."] : []),
    ...(!latestBackup ? ["Aucune sauvegarde detectee."] : backupAgeMs > 26 * 60 * 60 * 1000 ? ["Derniere sauvegarde trop ancienne."] : []),
  ];
  return {
    ok: Boolean(stored) && validation.ok,
    checkedAt,
    hash: stored ? adminRobustnessHashV167(stored) : null,
    summary: { routes: routes.length, codes: codes.length, teams: teams.length, playingTeams: playingTeams.length, backups: backups.length },
    guards: { routeLossBlocked: true, duplicateIdsBlocked: true, activeRouteChecked: true, adminPreSaveBackup: true, atomicWrite: true },
    validation,
    warnings,
    staleTeams,
    latestBackup,
    recentBackups: backups.slice(0, 5),
  };
}


async function listDataBackups() {
  try {
    const entries = await readdir(DATA_BACKUP_DIR, { withFileTypes: true });
    const backups = await Promise.all(entries
      .filter((entry) => entry.isFile() && entry.name.endsWith(".json"))
      .map(async (entry) => {
        const filePath = path.join(DATA_BACKUP_DIR, entry.name);
        const fileStat = await stat(filePath);
        return {
          name: entry.name,
          size: fileStat.size,
          modifiedAt: fileStat.mtimeMs,
        };
      }));
    return backups.sort((a, b) => b.modifiedAt - a.modifiedAt);
  } catch (error) {
    if (error.code === "ENOENT") return [];
    throw error;
  }
}

async function createManualDataBackup() {
  const raw = await readFile(DATA_FILE, "utf8");
  const parsed = JSON.parse(raw);
  if (!isAppData(parsed)) throw new Error("Donnees serveur illisibles.");

  await mkdir(DATA_BACKUP_DIR, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const fileName = `escape-data-manual-${stamp}.json`;
  const filePath = path.join(DATA_BACKUP_DIR, fileName);
  await writeFile(filePath, raw.endsWith("\n") ? raw : `${raw}\n`, "utf8");
  const fileStat = await stat(filePath);
  await pruneDataBackups();
  return { name: fileName, size: fileStat.size, modifiedAt: fileStat.mtimeMs };
}

async function getDataSafetyStatus() {
  const stored = await readStoredData();
  const dataFileStat = await stat(DATA_FILE).catch((error) => {
    if (error.code === "ENOENT") return null;
    throw error;
  });
  const backups = await listDataBackups();
  const routes = Array.isArray(stored?.routes) ? stored.routes : [];
  const routeIds = new Set(routes.map((route) => route?.id).filter(Boolean));
  const teams = Array.isArray(stored?.teams) ? stored.teams : [];
  const codes = Array.isArray(stored?.codes) ? stored.codes : [];
  const teamsLinkedToRoutes = teams.filter((team) => routeIds.has(team?.routeId));
  const teamsWithoutRoute = teams.filter((team) => team?.routeId && !routeIds.has(team.routeId));
  const codesLinkedToRoutes = codes.filter((code) => routeIds.has(code?.routeId));
  const codesWithoutRoute = codes.filter((code) => code?.routeId && !routeIds.has(code.routeId));

  return {
    ok: true,
    data: stored ? {
      routes: routes.length,
      teams: teams.length,
      teamTracking: teamsLinkedToRoutes.length,
      teamArchive: teamsWithoutRoute.length,
      teamPlaying: teamsLinkedToRoutes.filter((team) => team.status === "playing").length,
      teamWon: teamsLinkedToRoutes.filter((team) => team.status === "won").length,
      codes: codes.length,
      codesLinkedToRoutes: codesLinkedToRoutes.length,
      codesWithoutRoute: codesWithoutRoute.length,
      activeRouteId: stored.activeRouteId || null,
      size: dataFileStat?.size || 0,
      modifiedAt: dataFileStat?.mtimeMs || null,
    } : null,
    backups: {
      count: backups.length,
      latest: backups[0] || null,
      dailyLatest: backups.find(isDailyBackupV134) || null,
      dailyToday: backups.find((backup) => String(backup.name || '').startsWith(`escape-data-daily-${getDailyBackupDateKeyV134()}-`)) || null,
      recent: backups.slice(0, 5),
    },
  };
}

/* data-safety-restore-v132 */

function getSafeBackupName(rawName) {
  const name = path.basename(compactText(rawName));
  if (!/^escape-data-(manual|before-write|pre-restore|daily)-[A-Za-z0-9_.-]+\.json$/.test(name)) {
    throw new Error('Nom de sauvegarde invalide.');
  }
  return name;
}

async function readDataBackupByName(rawName) {
  const name = getSafeBackupName(rawName);
  const backups = await listDataBackups();
  if (!backups.some((backup) => backup.name === name)) {
    throw new Error('Sauvegarde introuvable.');
  }
  const raw = await readFile(path.join(DATA_BACKUP_DIR, name), 'utf8');
  const parsed = JSON.parse(raw);
  if (!isAppData(parsed)) throw new Error('Sauvegarde illisible.');
  return { name, raw: raw.endsWith('\n') ? raw : `${raw}\n`, data: parsed };
}

async function createPreRestoreDataBackup() {
  const raw = await readFile(DATA_FILE, 'utf8');
  const parsed = JSON.parse(raw);
  if (!isAppData(parsed)) throw new Error('Donnees serveur illisibles.');

  await mkdir(DATA_BACKUP_DIR, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const fileName = `escape-data-pre-restore-${stamp}.json`;
  const filePath = path.join(DATA_BACKUP_DIR, fileName);
  await writeFile(filePath, raw.endsWith('\n') ? raw : `${raw}\n`, 'utf8');
  const fileStat = await stat(filePath);
  await pruneDataBackups();
  return { name: fileName, size: fileStat.size, modifiedAt: fileStat.mtimeMs };
}

async function restoreDataBackupByName(rawName) {
  const backup = await readDataBackupByName(rawName);
  const beforeRestoreBackup = await createPreRestoreDataBackup();
  await writeStoredData(backup.data);
  const status = await getDataSafetyStatus();
  return {
    ...status,
    restored: { name: backup.name },
    beforeRestoreBackup,
  };
}

function sendDataBackupFile(response, backup) {
  response.writeHead(200, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'Content-Disposition': `attachment; filename="${backup.name}"`,
  });
  response.end(backup.raw);
}

/* scheduled-backup-v134 */

const DAILY_BACKUP_CHECK_INTERVAL_MS_V134 = 60 * 60 * 1000;

const DAILY_BACKUP_TIME_ZONE_V190 = String(globalThis.process?.env?.DAILY_BACKUP_TIME_ZONE || globalThis.process?.env?.BACKUP_TIME_ZONE || "Europe/Brussels").trim() || "Europe/Brussels";

let dailyBackupTimerV134 = null;

function getDailyBackupDateKeyV134(value = Date.now()) {
  const date = new Date(Number(value) || Date.now());
  try {
    const parts = new Intl.DateTimeFormat("fr-BE", {
      timeZone: DAILY_BACKUP_TIME_ZONE_V190,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(date).reduce((acc, part) => {
      if (part.type !== "literal") acc[part.type] = part.value;
      return acc;
    }, {});
    if (parts.year && parts.month && parts.day) return `${parts.year}-${parts.month}-${parts.day}`;
  } catch {
    // Keep backups running even if a platform has an incomplete Intl timezone table.
  }
  return date.toISOString().slice(0, 10);
}

function isDailyBackupV134(backup) {
  return /^escape-data-daily-\d{4}-\d{2}-\d{2}-/.test(String(backup?.name || ''));
}

async function pruneDailyDataBackupsV134() {
  await pruneDataBackups();
}

async function createDailyDataBackupIfNeededV134(options = {}) {
  const force = Boolean(options.force);
  const dateKey = getDailyBackupDateKeyV134();
  const backups = await listDataBackups();
  const existing = backups.find((backup) => String(backup.name || '').startsWith(`escape-data-daily-${dateKey}-`));
  if (existing && !force) {
    await pruneDataBackups();
    return { created: false, backup: existing, reason: 'already_exists' };
  }

  const raw = await readFile(DATA_FILE, 'utf8');
  const parsed = JSON.parse(raw);
  if (!isAppData(parsed)) throw new Error('Donnees serveur illisibles.');

  await mkdir(DATA_BACKUP_DIR, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const fileName = `escape-data-daily-${dateKey}-${stamp}.json`;
  const filePath = path.join(DATA_BACKUP_DIR, fileName);
  await writeFile(filePath, raw.endsWith('\n') ? raw : `${raw}\n`, 'utf8');
  const fileStat = await stat(filePath);
  await pruneDailyDataBackupsV134();
  return { created: true, backup: { name: fileName, size: fileStat.size, modifiedAt: fileStat.mtimeMs } };
}

async function verifyDataBackupWithoutRestoreV134(rawName) {
  const backup = await readDataBackupByName(rawName);
  return {
    ok: true,
    verified: {
      name: backup.name,
      routes: Array.isArray(backup.data.routes) ? backup.data.routes.length : 0,
      teams: Array.isArray(backup.data.teams) ? backup.data.teams.length : 0,
      codes: Array.isArray(backup.data.codes) ? backup.data.codes.length : 0,
      activeRouteId: backup.data.activeRouteId || null,
      size: Buffer.byteLength(backup.raw, 'utf8'),
      checkedAt: Date.now(),
    },
  };
}

function startDailyDataBackupsV134() {
  if (dailyBackupTimerV134) return;
  const runBackup = () => {
    createDailyDataBackupIfNeededV134()
      .then((result) => {
        if (result.created) console.log(`Sauvegarde quotidienne creee: ${result.backup.name}`);
      })
      .catch((error) => console.warn('Sauvegarde quotidienne impossible.', error));
  };
  setTimeout(runBackup, 5000);
  dailyBackupTimerV134 = setInterval(runBackup, DAILY_BACKUP_CHECK_INTERVAL_MS_V134);
  dailyBackupTimerV134?.unref?.();
}

/* admin-health-monitor-v136 */

const EXPECTED_ROUTE_TITLES_V136 = ["La Lettre de la Dame de Soy", "Sur les Traces du Vicinal", "Les Balises Perdues de Blier"];

const ADMIN_HEALTH_INTERVAL_MS_V136 = 5 * 60 * 1000;

let adminHealthMonitorTimerV136 = null;

let lastAdminHealthSnapshotV136 = null;

function getHealthStatusFromChecksV136(checks) {
  if (checks.some((check) => check.status === 'critical')) return 'critical';
  if (checks.some((check) => check.status === 'warning')) return 'warning';
  return 'ok';
}

function normalizeHealthTitleV136(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

function getTeamLastActivityV136(team) {
  const values = [
    team?.lastPosition?.at,
    team?.lastSeenAt,
    team?.lastSyncAt,
    team?.updatedAt,
    team?.finishedAt,
    team?.startAt,
  ].map(Number).filter((value) => Number.isFinite(value) && value > 0);
  return values.length ? Math.max(...values) : null;
}

function getTeamProgressHealthV136(team, route) {
  const puzzleIds = new Set((route?.puzzles || []).map((puzzle) => puzzle.id));
  const answers = team?.answers && typeof team.answers === 'object' ? team.answers : {};
  const solved = Object.keys(answers).filter((id) => puzzleIds.has(id) && answers[id]).length;
  const total = puzzleIds.size;
  return { solved, total, percent: total ? Math.round((solved / total) * 100) : 0 };
}

function compactHealthRouteV136(route) {
  return {
    id: route?.id || null,
    title: route?.title || '',
    puzzles: Array.isArray(route?.puzzles) ? route.puzzles.length : 0,
    visible: route?.shopVisible !== false,
    pricePerPerson: route?.pricePerPerson ?? null,
  };
}

async function buildAdminHealthStatusV136() {
  const checkedAt = Date.now();
  const stored = await readStoredData();
  const routes = Array.isArray(stored?.routes) ? stored.routes : [];
  const teams = Array.isArray(stored?.teams) ? stored.teams : [];
  const codes = Array.isArray(stored?.codes) ? stored.codes : [];
  const backups = typeof listDataBackups === 'function' ? await listDataBackups() : [];
  const expectedTitles = EXPECTED_ROUTE_TITLES_V136.map(normalizeHealthTitleV136);
  const routeTitles = routes.map((route) => normalizeHealthTitleV136(route?.title));
  const missingRouteTitles = expectedTitles.filter((title) => !routeTitles.includes(title));
  const latestBackup = backups[0] || null;
  const todayKey = new Date(checkedAt).toISOString().slice(0, 10);
  const dailyToday = backups.find((backup) => String(backup.name || '').startsWith(`escape-data-daily-${todayKey}-`)) || null;
  const latestBackupAgeMs = latestBackup?.modifiedAt ? checkedAt - Number(latestBackup.modifiedAt) : null;
  const routeById = new Map(routes.map((route) => [route.id, route]));
  const playingTeams = teams.filter((team) => team?.status === 'playing');
  const staleTeams = playingTeams
    .map((team) => ({
      id: team.id,
      name: team.name || team.code || team.id,
      routeTitle: routeById.get(team.routeId)?.title || 'Parcours introuvable',
      lastActivityAt: getTeamLastActivityV136(team),
      progress: getTeamProgressHealthV136(team, routeById.get(team.routeId)),
      hasPosition: Boolean(team.lastPosition),
    }))
    .filter((team) => !team.lastActivityAt || checkedAt - team.lastActivityAt > 3 * 60 * 1000);
  const finishedTeams = teams.filter((team) => team?.status === 'won' || team?.status === 'lost');
  const routeIssues = routes.flatMap((route) => {
    const issues = [];
    if (!Array.isArray(route.puzzles) || route.puzzles.length === 0) issues.push(`${route.title || route.id}: aucune enigme`);
    if (route.shopVisible !== false && !(Number(route.pricePerPerson) > 0)) issues.push(`${route.title || route.id}: prix boutique invalide`);
    return issues;
  });
  const orphanCodes = codes.filter((code) => code?.routeId && !routeById.has(code.routeId));
  const orphanTeams = teams.filter((team) => team?.routeId && !routeById.has(team.routeId));
  const checks = [
    {
      id: 'api',
      label: 'Site et API',
      status: stored ? 'ok' : 'critical',
      detail: stored ? 'Donnees serveur lisibles.' : 'Aucune donnee serveur lisible.',
    },
    {
      id: 'routes',
      label: 'Parcours actifs',
      status: missingRouteTitles.length ? 'critical' : routeIssues.length ? 'warning' : 'ok',
      detail: missingRouteTitles.length
        ? `${missingRouteTitles.length} parcours attendu(s) manquant(s).`
        : routeIssues.length
          ? routeIssues.slice(0, 3).join(' | ')
          : `${routes.length} parcours presents et coherents.`,
    },
    {
      id: 'backups',
      label: 'Sauvegardes',
      status: !backups.length ? 'critical' : !dailyToday || (latestBackupAgeMs && latestBackupAgeMs > 26 * 60 * 60 * 1000) ? 'warning' : 'ok',
      detail: !backups.length
        ? 'Aucune sauvegarde disponible.'
        : dailyToday
          ? `${backups.length} sauvegardes, quotidienne du jour presente.`
          : `${backups.length} sauvegardes, quotidienne du jour pas encore creee.`,
    },
    {
      id: 'live-sync',
      label: 'Suivi live',
      status: staleTeams.length ? 'warning' : 'ok',
      detail: staleTeams.length
        ? `${staleTeams.length} equipe(s) en cours sans activite recente.`
        : `${playingTeams.length} equipe(s) en cours, aucune equipe bloquee detectee.`,
    },
    {
      id: 'commerce',
      label: 'Stripe et e-mails',
      status: STRIPE_SECRET_KEY && STRIPE_WEBHOOK_SECRET && RESEND_API_KEY && MAIL_FROM ? 'ok' : 'warning',
      detail: [
        STRIPE_SECRET_KEY ? 'Stripe actif' : 'cle Stripe absente',
        STRIPE_WEBHOOK_SECRET ? 'webhook actif' : 'webhook absent',
        RESEND_API_KEY && MAIL_FROM ? 'e-mails configures' : 'e-mails a verifier',
      ].join(' - '),
    },
    {
      id: 'integrity',
      label: 'Coherence codes/equipes',
      status: orphanCodes.length || orphanTeams.length ? 'warning' : 'ok',
      detail: orphanCodes.length || orphanTeams.length
        ? `${orphanCodes.length} code(s) et ${orphanTeams.length} equipe(s) lies a un parcours absent.`
        : 'Codes et equipes rattaches a des parcours existants.',
    },
    {
      id: 'security',
      label: 'Securite admin',
      status: 'ok',
      detail: 'Tableau de sante reserve a la session gestion.',
    },
  ];
  const status = getHealthStatusFromChecksV136(checks);
  const alerts = checks
    .filter((check) => check.status !== 'ok')
    .map((check) => ({ id: check.id, level: check.status, label: check.label, detail: check.detail }));
  return {
    ok: status !== 'critical',
    status,
    checkedAt,
    summary: {
      routes: routes.length,
      teams: teams.length,
      playingTeams: playingTeams.length,
      finishedTeams: finishedTeams.length,
      codes: codes.length,
      availableCodes: codes.filter((code) => code.status !== 'used').length,
      backups: backups.length,
    },
    checks,
    alerts,
    routes: routes.map(compactHealthRouteV136),
    teams: { stale: staleTeams, playing: playingTeams.length, finished: finishedTeams.length },
    backups: {
      count: backups.length,
      latest: latestBackup,
      dailyToday,
      recent: backups.slice(0, 5),
      automatic: true,
      timeZone: DAILY_BACKUP_TIME_ZONE_V190,
    },
    commerce: {
      stripeConfigured: Boolean(STRIPE_SECRET_KEY),
      stripeWebhookConfigured: Boolean(STRIPE_WEBHOOK_SECRET),
      emailConfigured: Boolean(RESEND_API_KEY && MAIL_FROM),
      publicUrl: PUBLIC_APP_URL,
    },
  };
}

async function fileCheckV136(label, relativePath, includes = []) {
  const filePath = path.join(ROOT_DIR, relativePath);
  try {
    const raw = await readFile(filePath, 'utf8');
    const missing = includes.filter((needle) => !raw.includes(needle));
    return {
      id: `file-${relativePath}`,
      label,
      status: missing.length ? 'warning' : 'ok',
      detail: missing.length ? `Contenu attendu absent: ${missing.join(', ')}` : `${relativePath} OK`,
    };
  } catch {
    return { id: `file-${relativePath}`, label, status: 'critical', detail: `${relativePath} introuvable ou illisible.` };
  }
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
    fileCheckV136('Accueil', 'index.html', ['app.js?v=171169968865564463361160059957', 'styles.css?v=171169968865564463361160059957', 'local-seo-structured-data-v143']),
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
      ? `${shopRoutes.length} parcours vendable(s), Stripe pret. Tunnel de reservation pret. Aucun paiement reel lance.`
      : 'Configuration achat a verifier. Aucun paiement reel lance.',
  };
  let businessDryRun = {
    id: 'business-dashboard',
    label: 'Stats et journee en cours',
    status: 'warning',
    detail: 'Tableau business indisponible.',
  };
  try {
    const dashboard = await buildBusinessDashboardV143();
    businessDryRun = {
      id: 'business-dashboard',
      label: 'Stats et journee en cours',
      status: dashboard.ok ? 'ok' : 'warning',
      detail: `${dashboard.summary.routes} parcours, ${dashboard.summary.teamsToday} equipe(s) aujourd'hui, stats lisibles.`,
    };
  } catch (error) {
    businessDryRun.detail = error.message || businessDryRun.detail;
  }
  const checks = [...health.checks, ...staticChecks, checkoutDryRun, businessDryRun];
  const status = getHealthStatusFromChecksV136(checks);
  return { ok: status !== 'critical', status, checkedAt: Date.now(), checks, health };
}

async function runPlayerSimulationV136() {
  const stored = await readStoredData();
  const routes = Array.isArray(stored?.routes) ? stored.routes : [];
  const simulatedRoutes = routes.map((route) => {
    const puzzles = Array.isArray(route.puzzles) ? route.puzzles : [];
    const sampleTeams = [0, Math.ceil(puzzles.length / 2), puzzles.length].map((solved, index) => {
      const answers = Object.fromEntries(puzzles.slice(0, solved).map((puzzle) => [puzzle.id, 'simulation']));
      const team = {
        id: `simulation-${route.id}-${index}`,
        name: `Simulation ${index + 1}`,
        routeId: route.id,
        status: solved >= puzzles.length && puzzles.length ? 'won' : 'playing',
        startAt: Date.now() - (index + 1) * 60000,
        answers,
        lastPosition: puzzles[0] ? { lat: Number(puzzles[0].lat) || 0, lng: Number(puzzles[0].lng) || 0, at: Date.now() } : null,
      };
      return {
        name: team.name,
        status: team.status,
        progress: getTeamProgressHealthV136(team, route),
        lastActivityAt: getTeamLastActivityV136(team),
      };
    });
    return {
      id: route.id,
      title: route.title,
      puzzles: puzzles.length,
      simulatedTeams: sampleTeams,
      ok: puzzles.length > 0 && sampleTeams.every((team) => team.progress.total === puzzles.length),
    };
  });
  const checks = [{
    id: 'simulation-routes',
    label: 'Simulation multi-joueurs',
    status: simulatedRoutes.every((route) => route.ok) ? 'ok' : 'warning',
    detail: `${simulatedRoutes.reduce((sum, route) => sum + route.simulatedTeams.length, 0)} equipes simulees en lecture seule.`,
  }];
  return {
    ok: checks.every((check) => check.status === 'ok'),
    status: getHealthStatusFromChecksV136(checks),
    checkedAt: Date.now(),
    checks,
    routes: simulatedRoutes,
    note: 'Simulation en memoire uniquement: aucun code, aucune equipe et aucun parcours live ne sont modifies.',
  };
}

async function runAdminHealthMonitorV136() {
  try {
    lastAdminHealthSnapshotV136 = await buildAdminHealthStatusV136();
    if (lastAdminHealthSnapshotV136.status !== 'ok') console.warn('Alerte sante admin.', lastAdminHealthSnapshotV136.alerts);
  } catch (error) {
    console.warn('Controle sante admin impossible.', error);
  }
}

function startAdminHealthMonitorV136() {
  if (adminHealthMonitorTimerV136) return;
  setTimeout(runAdminHealthMonitorV136, 10000);
  adminHealthMonitorTimerV136 = setInterval(runAdminHealthMonitorV136, ADMIN_HEALTH_INTERVAL_MS_V136);
  adminHealthMonitorTimerV136?.unref?.();
}

/* admin-ops-center-v138 */

const ADMIN_ALERT_EMAIL_V138 = compactText(globalThis.process?.env?.ADMIN_ALERT_EMAIL || globalThis.process?.env?.ALERT_EMAIL || MAIL_REPLY_TO || "");

const ADMIN_BACKUP_EMAIL_ALERTS_V190 = /^(1|true|yes|oui)$/i.test(String(globalThis.process?.env?.ADMIN_BACKUP_EMAIL_ALERTS || ""));

const ADMIN_INCIDENTS_FILE_V138 = path.join(DATA_DIR, "admin-incidents.json");

const ADMIN_SETTINGS_FILE_V138 = path.join(DATA_DIR, "admin-settings.json");

const ADMIN_ALERT_COOLDOWN_MS_V138 = 6 * 60 * 60 * 1000;

const ADMIN_OPS_INTERVAL_MS_V138 = 5 * 60 * 1000;

let adminOpsMonitorTimerV138 = null;

async function readJsonFileV138(filePath, fallback) {
  try {
    const raw = await readFile(filePath, 'utf8');
    return JSON.parse(raw);
  } catch (error) {
    if (error.code === 'ENOENT') return fallback;
    throw error;
  }
}

async function writeJsonFileV138(filePath, payload) {
  await mkdir(path.dirname(filePath), { recursive: true });
  const tempFile = `${filePath}.tmp`;
  await writeFile(tempFile, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
  await rename(tempFile, filePath);
}

function makeIncidentSignatureV138(alert) {
  return createHash('sha256')
    .update([alert.level || alert.status || 'warning', alert.label || '', alert.detail || ''].join('|'))
    .digest('hex')
    .slice(0, 16);
}

function isBackupIncidentV190(alert) {
  const id = String(alert?.id || "").toLowerCase();
  const label = String(alert?.label || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  return id === "backups" || label.includes("sauvegarde");
}

function shouldNotifyAdminIncidentByEmailV190(alert) {
  return ADMIN_BACKUP_EMAIL_ALERTS_V190 || !isBackupIncidentV190(alert);
}

async function readAdminIncidentsV138() {
  const incidents = await readJsonFileV138(ADMIN_INCIDENTS_FILE_V138, []);
  return Array.isArray(incidents) ? incidents : [];
}

async function writeAdminIncidentsV138(incidents) {
  await writeJsonFileV138(ADMIN_INCIDENTS_FILE_V138, incidents.slice(0, 80));
}

async function sendAdminIncidentEmailV138(incident, health) {
  if (!ADMIN_ALERT_EMAIL_V138 || !RESEND_API_KEY || !MAIL_FROM) {
    return { configured: false, sent: false };
  }
  const lines = [
    'Alerte detectee sur Escape Erezee.',
    '',
    `Niveau : ${incident.level}`,
    `Controle : ${incident.label}`,
    `Detail : ${incident.detail}`,
    `Date : ${new Date(incident.lastSeenAt).toISOString()}`,
    '',
    `Parcours : ${health?.summary?.routes ?? 'n/a'}`,
    `Equipes en cours : ${health?.summary?.playingTeams ?? 'n/a'}`,
    `Sauvegardes : ${health?.summary?.backups ?? 'n/a'}`,
    '',
    `${PUBLIC_APP_URL}/index.html#admin`,
  ];
  return sendResendEmail({
    to: ADMIN_ALERT_EMAIL_V138,
    subject: `[Escape Erezee] ${incident.level === 'critical' ? 'Alerte critique' : 'Alerte'} - ${incident.label}`,
    text: lines.join('\n'),
    html: `<div style="font-family:Arial,sans-serif;color:#123c32;line-height:1.5"><h1>Alerte Escape Erezee</h1><p><strong>${escapeHtml(incident.label)}</strong></p><p>${escapeHtml(incident.detail)}</p><p><a href="${escapeHtml(PUBLIC_APP_URL)}/index.html#admin">Ouvrir l'admin</a></p></div>`,
  });
}

async function recordHealthIncidentsV138(health) {
  const alerts = Array.isArray(health?.alerts) ? health.alerts : [];
  if (!alerts.length) return { created: 0, notified: 0 };
  const now = Date.now();
  const incidents = await readAdminIncidentsV138();
  let created = 0;
  let notified = 0;
  for (const alert of alerts) {
    const signature = makeIncidentSignatureV138(alert);
    let incident = incidents.find((item) => item.signature === signature && !item.resolvedAt);
    if (!incident) {
      incident = {
        id: `incident-${now}-${Math.random().toString(36).slice(2, 8)}`,
        signature,
        level: alert.level || alert.status || 'warning',
        label: alert.label || 'Alerte',
        detail: alert.detail || '',
        firstSeenAt: now,
        lastSeenAt: now,
        occurrences: 0,
        notificationCount: 0,
        lastNotificationAt: null,
        resolvedAt: null,
      };
      incidents.unshift(incident);
      created += 1;
    }
    incident.lastSeenAt = now;
    incident.occurrences = Number(incident.occurrences || 0) + 1;
    if (!shouldNotifyAdminIncidentByEmailV190(alert)) {
      incident.lastNotificationStatus = 'muted_backup_email_disabled';
      incident.lastNotificationError = null;
      incident.notificationMutedReason = 'backup_email_disabled';
      continue;
    }
    if (!incident.lastNotificationAt || now - Number(incident.lastNotificationAt) > ADMIN_ALERT_COOLDOWN_MS_V138) {
      const result = await sendAdminIncidentEmailV138(incident, health).catch((error) => ({ configured: true, sent: false, error: error.message }));
      incident.lastNotificationAt = now;
      incident.lastNotificationStatus = result.sent ? 'sent' : result.configured === false ? 'not_configured' : 'error';
      incident.lastNotificationError = result.error || null;
      incident.notificationCount = Number(incident.notificationCount || 0) + (result.sent ? 1 : 0);
      if (result.sent) notified += 1;
    }
  }
  await writeAdminIncidentsV138(incidents);
  return { created, notified };
}

async function runAdminOpsMonitorV138() {
  try {
    const health = await buildAdminHealthStatusV136();
    await recordHealthIncidentsV138(health);
  } catch (error) {
    console.warn('Controle incidents admin impossible.', error);
  }
}

function startAdminOpsMonitorV138() {
  if (adminOpsMonitorTimerV138) return;
  setTimeout(runAdminOpsMonitorV138, 15000);
  adminOpsMonitorTimerV138 = setInterval(runAdminOpsMonitorV138, ADMIN_OPS_INTERVAL_MS_V138);
  adminOpsMonitorTimerV138?.unref?.();
}

async function resolveAdminIncidentV138(id) {
  const incidents = await readAdminIncidentsV138();
  const incident = incidents.find((item) => item.id === id);
  if (!incident) throw new Error('Incident introuvable.');
  incident.resolvedAt = Date.now();
  await writeAdminIncidentsV138(incidents);
  return incident;
}

function getRouteByIdV138(routes, routeId) {
  return routes.find((route) => route.id === routeId) || null;
}

function getLiveProgressV138(team, route) {
  const puzzleIds = new Set((route?.puzzles || []).map((puzzle) => puzzle.id));
  const answers = team?.answers && typeof team.answers === 'object' ? team.answers : {};
  const solved = Object.keys(answers).filter((id) => puzzleIds.has(id) && answers[id]).length;
  const total = puzzleIds.size;
  return { solved, total, percent: total ? Math.round((solved / total) * 100) : 0 };
}

async function buildLiveDashboardV138() {
  const stored = await readStoredData();
  const routes = Array.isArray(stored?.routes) ? stored.routes : [];
  const teams = Array.isArray(stored?.teams) ? stored.teams : [];
  const now = Date.now();
  const rows = teams.map((team) => {
    const route = getRouteByIdV138(routes, team.routeId);
    const lastActivityAt = getTeamLastActivityV136(team);
    const stale = team.status === 'playing' && (!lastActivityAt || now - lastActivityAt > 3 * 60 * 1000);
    return {
      id: team.id,
      name: team.name || team.code || team.id,
      code: team.code || '',
      routeTitle: route?.title || 'Parcours introuvable',
      status: team.status || 'playing',
      progress: getLiveProgressV138(team, route),
      lastActivityAt,
      lastPositionAt: team.lastPosition?.at || null,
      hasPosition: Boolean(team.lastPosition),
      stale,
    };
  }).sort((a, b) => Number(b.lastActivityAt || 0) - Number(a.lastActivityAt || 0));
  return {
    ok: true,
    checkedAt: now,
    summary: {
      total: rows.length,
      playing: rows.filter((row) => row.status === 'playing').length,
      stale: rows.filter((row) => row.stale).length,
      finished: rows.filter((row) => row.status === 'won' || row.status === 'lost').length,
      withoutPosition: rows.filter((row) => row.status === 'playing' && !row.hasPosition).length,
    },
    teams: rows.slice(0, 30),
  };
}

async function buildSalesDashboardV138() {
  const stored = await readStoredData();
  const routes = Array.isArray(stored?.routes) ? stored.routes : [];
  const codes = Array.isArray(stored?.codes) ? stored.codes : [];
  const routeById = new Map(routes.map((route) => [route.id, route]));
  const sourceCounts = codes.reduce((acc, code) => {
    const source = code.source || 'admin';
    acc[source] = (acc[source] || 0) + 1;
    return acc;
  }, {});
  const estimatedRevenueCents = codes
    .filter((code) => code.source === 'stripe')
    .reduce((sum, code) => {
      const route = routeById.get(code.routeId);
      return sum + revenueCentsV145(code, route);
    }, 0);
  const recent = codes.slice().sort((a, b) => Number(b.createdAt || 0) - Number(a.createdAt || 0)).slice(0, 12).map((code) => ({
    code: code.code,
    routeTitle: routeById.get(code.routeId)?.title || 'Parcours introuvable',
    source: code.source || 'admin',
    status: code.status || 'available',
    createdAt: code.createdAt || null,
    customerName: code.customerName || [code.customerFirstName, code.customerLastName].filter(Boolean).join(' ') || '',
    customerEmail: code.customerEmail || '',
    playerCount: code.playerCount || null,
    emailStatus: code.confirmationEmailSentAt ? 'sent' : code.confirmationEmailStatus || '',
  }));
  return {
    ok: true,
    checkedAt: Date.now(),
    summary: {
      totalCodes: codes.length,
      available: codes.filter((code) => code.status !== 'used').length,
      used: codes.filter((code) => code.status === 'used').length,
      stripe: sourceCounts.stripe || 0,
      odoo: sourceCounts.odoo || 0,
      admin: sourceCounts.admin || 0,
      emailsSent: codes.filter((code) => code.confirmationEmailSentAt).length,
      emailErrors: codes.filter((code) => code.confirmationEmailStatus === 'error').length,
      estimatedRevenueCents,
    },
    recent,
  };
}

/* growth-suite-v143 */

const PUBLIC_REVIEW_URL_V143 = compactText(globalThis.process?.env?.GOOGLE_REVIEW_URL || globalThis.process?.env?.PUBLIC_REVIEW_URL || "https://g.page/r/CfoZCZf_vyxPEBM/review");

function elapsedSecondsV143(team) {
  if (!team?.startAt) return 0;
  const end = team.finishedAt || Date.now();
  return Math.max(0, Math.floor((end - team.startAt) / 1000));
}

function formatDurationShortV143(seconds) {
  const safe = Math.max(0, Math.floor(Number(seconds) || 0));
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  if (hours) return `${hours} h ${String(minutes).padStart(2, '0')}`;
  return `${minutes} min`;
}

function getProgressV143(team, route) {
  const puzzleIds = new Set((route?.puzzles || []).map((puzzle) => puzzle.id));
  const answers = team?.answers && typeof team.answers === 'object' ? team.answers : {};
  const solved = Object.keys(answers).filter((id) => puzzleIds.has(id) && answers[id]).length;
  const total = puzzleIds.size;
  return { solved, total, percent: total ? Math.round((solved / total) * 100) : 0 };
}

function getPuzzlePressureV143(route, teams) {
  const routeTeams = teams.filter((team) => team.routeId === route.id);
  const rows = (route.puzzles || []).map((puzzle) => {
    const attempts = routeTeams.reduce((sum, team) => sum + Number(team?.attempts?.[puzzle.id] || 0), 0);
    const hints = routeTeams.reduce((sum, team) => sum + Number(team?.hints?.[puzzle.id] || 0), 0);
    const unfinishedHere = routeTeams.filter((team) => team.status === 'playing' && !team?.answers?.[puzzle.id]).length;
    return {
      id: puzzle.id,
      title: puzzle.title || puzzle.place || puzzle.id,
      attempts,
      hints,
      unfinishedHere,
      score: attempts + hints * 2 + unfinishedHere,
    };
  }).sort((a, b) => b.score - a.score || b.attempts - a.attempts);
  return rows[0] || null;
}

async function buildBusinessDashboardV143() {
  const stored = await readStoredData();
  const routes = Array.isArray(stored?.routes) ? stored.routes : [];
  const teams = Array.isArray(stored?.teams) ? stored.teams : [];
  const codes = Array.isArray(stored?.codes) ? stored.codes : [];
  const now = Date.now();
  const dayStart = new Date(now);
  dayStart.setHours(0, 0, 0, 0);
  const dayStartMs = dayStart.getTime();
  const routeById = new Map(routes.map((route) => [route.id, route]));
  const todayTeams = teams
    .filter((team) => team.status === 'playing' || Number(team.startAt || 0) >= dayStartMs || Number(team.finishedAt || 0) >= dayStartMs)
    .map((team) => {
      const route = routeById.get(team.routeId);
      const lastActivityAt = getTeamLastActivityV136(team);
      const progress = getProgressV143(team, route);
      return {
        id: team.id,
        name: team.name || team.code || team.id,
        code: team.code || '',
        routeTitle: route?.title || 'Parcours introuvable',
        status: team.status || 'playing',
        progress,
        startedAt: team.startAt || null,
        finishedAt: team.finishedAt || null,
        duration: formatDurationShortV143(elapsedSecondsV143(team)),
        lastActivityAt,
        inactiveMinutes: lastActivityAt ? Math.max(0, Math.round((now - Number(lastActivityAt)) / 60000)) : null,
        hasPosition: Boolean(team.lastPosition),
        stale: team.status === 'playing' && (!lastActivityAt || now - Number(lastActivityAt) > 3 * 60 * 1000),
      };
    })
    .sort((a, b) => (a.status === 'playing' ? -1 : 1) - (b.status === 'playing' ? -1 : 1) || Number(b.lastActivityAt || 0) - Number(a.lastActivityAt || 0));

  const routeStats = routes.map((route) => {
    const routeTeams = teams.filter((team) => team.routeId === route.id);
    const finished = routeTeams.filter((team) => team.status === 'won' || team.status === 'lost');
    const won = routeTeams.filter((team) => team.status === 'won');
    const durations = finished.map(elapsedSecondsV143).filter((value) => value > 0);
    const routeCodes = codes.filter((code) => code.routeId === route.id);
    const revenueCents = routeCodes
      .filter((code) => code.source === 'stripe')
      .reduce((sum, code) => sum + getRoutePriceCents(route) * getPlayerCount(code.playerCount || 1), 0);
    const pressure = getPuzzlePressureV143(route, teams);
    return {
      id: route.id,
      title: route.title || route.id,
      area: route.area || '',
      soldCodes: routeCodes.length,
      startedTeams: routeTeams.length,
      playing: routeTeams.filter((team) => team.status === 'playing').length,
      completed: won.length,
      lost: routeTeams.filter((team) => team.status === 'lost').length,
      completionRate: routeTeams.length ? Math.round((won.length / routeTeams.length) * 100) : 0,
      averageDuration: durations.length ? formatDurationShortV143(durations.reduce((sum, value) => sum + value, 0) / durations.length) : 'n/a',
      revenueCents,
      pressure,
    };
  });

  const totalRevenueCents = routeStats.reduce((sum, route) => sum + route.revenueCents, 0);
  const finishedTeams = teams.filter((team) => team.status === 'won' || team.status === 'lost');
  return {
    ok: true,
    checkedAt: now,
    summary: {
      routes: routes.length,
      teamsToday: todayTeams.length,
      playingNow: todayTeams.filter((team) => team.status === 'playing').length,
      staleNow: todayTeams.filter((team) => team.stale).length,
      completedTotal: teams.filter((team) => team.status === 'won').length,
      finishedTotal: finishedTeams.length,
      codes: codes.length,
      estimatedRevenueCents: totalRevenueCents,
    },
    todayTeams: todayTeams.slice(0, 60),
    routeStats,
  };
}


/* growth-admin-tools-v145 */
function normalizeReviewsV145(reviews) {
  const fallback = [
    { name: 'Sophie', text: 'Super activite en famille, les enfants ont adore !', rating: 5 },
    { name: 'Julien', text: 'Une belle decouverte de la region tout en s amusant.', rating: 5 },
    { name: 'Marie', text: 'Parcours clair, nature superbe et enigmes bien dosees.', rating: 5 },
    { name: 'Nathalie', text: 'Le parcours motive tout le monde a observer les details.', rating: 5 },
    { name: 'Thomas', text: 'Une activite originale pres de Durbuy, facile a lancer.', rating: 5 },
    { name: 'Laura', text: 'Tres bon moment dehors, avec juste ce qu il faut de challenge.', rating: 5 },
  ];
  return (Array.isArray(reviews) && reviews.length ? reviews : fallback)
    .map((review) => ({ name: compactText(review?.name).slice(0, 80) || 'Client', text: compactText(review?.text).slice(0, 320), rating: Math.min(5, Math.max(1, Math.round(Number(review?.rating) || 5))) }))
    .filter((review) => review.text).slice(0, 6);
}
function normalizePhotosV145(photos) {
  const fallback = [
    { src: '/assets/seo/activite-pres-durbuy-v158.svg?v=158', alt: 'Ambiance de parcours exterieur en Ardenne', caption: 'Chemins et patrimoine autour des parcours' },
    { src: '/assets/seo/activite-touristique-erezee-v158.svg?v=158', alt: 'Paysage ardennais pres d Erezee', caption: 'Nature et villages d Erezee' },
    { src: '/assets/seo/activite-touristique-erezee-v158.svg?v=158', alt: 'Ambiance du parcours de Blier', caption: 'Indices et exploration en equipe' },
  ];
  return (Array.isArray(photos) && photos.length ? photos : fallback)
    .map((photo) => ({ src: compactText(photo?.src || photo?.url).slice(0, 500), alt: compactText(photo?.alt || photo?.caption).slice(0, 140) || 'Photo locale', caption: compactText(photo?.caption || photo?.alt).slice(0, 160) }))
    .filter((photo) => photo.src).slice(0, 8);
}
async function readGrowthSettingsV145() {
  const raw = await readJsonFileV138(ADMIN_SETTINGS_FILE_V138, {});
  return { ok: true, reviewUrl: normalizeReviewUrlV171(raw.reviewUrl || raw.googleReviewUrl), businessName: 'Stock & Sevrin Escape Games', area: 'Erezee, Ardenne belge', reviews: normalizeReviewsV145(raw.reviews), localPhotos: normalizePhotosV145(raw.localPhotos), updatedAt: raw.publicSettingsUpdatedAt || null };
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
    return { filename: 'codes-' + new Date().toISOString().slice(0, 10) + '.csv', content: [csvLineV145(['code','parcours','statut','source','equipe','client','email','equipes','cree_le','mail_statut']), ...codes.map((code) => { const route = routeById.get(code.routeId), team = teams.find((item) => item.id === code.teamId || item.code === code.code); return csvLineV145([code.code, route?.title || code.routeId, code.status || 'available', code.source || 'admin', team?.name || code.teamId || '', code.customerName || [code.customerFirstName, code.customerLastName].filter(Boolean).join(' '), code.customerEmail || '', code.playerCount || '', dateCsvV145(code.createdAt), code.confirmationEmailSentAt ? 'sent' : code.confirmationEmailStatus || '']); })].join('\n') };
  }
  return { filename: 'ventes-' + new Date().toISOString().slice(0, 10) + '.csv', content: [csvLineV145(['date','code','parcours','source','client','email','equipes','montant_eur','stripe_session','test_interne']), ...codes.filter((code) => code.source === 'stripe' || code.customerEmail || code.customerName).map((code) => { const route = routeById.get(code.routeId); return csvLineV145([dateCsvV145(code.createdAt), code.code, route?.title || code.routeId, code.source || 'admin', code.customerName || [code.customerFirstName, code.customerLastName].filter(Boolean).join(' '), code.customerEmail || '', code.playerCount || '', (revenueCentsV145(code, route) / 100).toFixed(2), code.stripeSessionId || '', code.internalTest ? 'oui' : '']); })].join('\n') };
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




async function readAdminSettingsV138() {
  const settings = await readJsonFileV138(ADMIN_SETTINGS_FILE_V138, {});
  return {
    maintenance: {
      enabled: Boolean(settings?.maintenance?.enabled),
      message: compactText(settings?.maintenance?.message) || 'Information temporaire : le site reste accessible, mais une intervention technique est en cours.',
      updatedAt: settings?.maintenance?.updatedAt || null,
    },
  };
}

async function updateMaintenanceSettingsV138(payload) {
  const current = await readAdminSettingsV138();
  const next = {
    ...current,
    maintenance: {
      enabled: Boolean(payload?.enabled),
      message: compactText(payload?.message).slice(0, 240) || current.maintenance.message,
      updatedAt: Date.now(),
    },
  };
  await writeJsonFileV138(ADMIN_SETTINGS_FILE_V138, next);
  return next.maintenance;
}

async function publicCheckV138(label, pathname, includes = []) {
  const baseUrl = String(PUBLIC_APP_URL || 'https://escape-erezee.be').replace(/\/$/, '');
  const cleanPath = String(pathname || '').replace(/^\//, '');
  const targetUrl = `${baseUrl}/${cleanPath}`;
  if (typeof fetch !== 'function') return { label, path: pathname, status: 'warning', detail: 'Verification HTTP indisponible.' };
  try {
    const response = await fetch(`${targetUrl}?seo=${Date.now()}`, { cache: 'no-store' });
    const text = await response.text();
    const missing = includes.filter((needle) => !text.includes(needle));
    return {
      label,
      path: pathname,
      status: response.ok && !missing.length ? 'ok' : 'warning',
      detail: response.ok && !missing.length ? 'Accessible.' : `Reponse ${response.status}${missing.length ? `, contenu absent: ${missing.join(', ')}` : ''}.`,
    };
  } catch (error) {
    return { label, path: pathname, status: 'warning', detail: error.message || 'Verification impossible.' };
  }
}

async function buildSeoDashboardV138() {
  const checkedAt = Date.now();
  const baseUrl = String(PUBLIC_APP_URL || 'https://escape-erezee.be').replace(/\/+$/, '');
  const staticPages = [
    { label: 'Accueil', path: '/', keywords: ['Stock', 'Escape'], core: true },
    { label: 'Escape game exterieur Ardenne', path: '/escape-game-exterieur-ardenne.html', keywords: ['Escape game', 'Ardenne'], core: true },
    { label: 'Activite famille Ardenne', path: '/activite-famille-ardenne.html', keywords: ['famille', 'Ardenne'], core: true },
    { label: 'Chasse au tresor Ardenne', path: '/chasse-au-tresor-ardenne.html', keywords: ['Chasse', 'Ardenne'], core: true },
    { label: 'Activite touristique Erezee', path: '/activite-touristique-erezee.html', keywords: ['Erezee'], core: true },
    { label: 'Activite pres de Durbuy', path: '/activite-pres-de-durbuy.html', keywords: ['Durbuy'], core: true },
    { label: 'Blog', path: '/blog/', keywords: ['Blog', 'Ardenne'], core: true },
    { label: 'Article: Que faire a Erezee', path: '/blog/que-faire-a-erezee.html', keywords: ['Erezee'], content: true },
    { label: 'Article: Que faire pres de Durbuy', path: '/blog/que-faire-pres-de-durbuy.html', keywords: ['Durbuy'], content: true },
    { label: 'Article: Activites familiales Ardenne', path: '/blog/activites-familiales-ardenne-belge.html', keywords: ['famille'], content: true },
    { label: 'Article: Activites exterieures Ardenne', path: '/blog/top-10-activites-exterieures-ardenne.html', keywords: ['activites'], content: true },
    { label: 'Article: Vacances Ardenne', path: '/blog/que-faire-vacances-ardenne.html', keywords: ['vacances'], content: true },
    { label: 'Article: Activite enfant Erezee', path: '/blog/activite-enfant-erezee.html', keywords: ['enfant', 'Erezee'], content: true },
    { label: 'Article: Escape game pres de Durbuy', path: '/blog/escape-game-pres-de-durbuy.html', keywords: ['escape game', 'Durbuy'], content: true },
    { label: 'Article: Week-end famille Ardenne', path: '/blog/week-end-famille-ardenne.html', keywords: ['week-end', 'famille'], content: true },
    { label: 'Article: Sortie groupe Ardenne', path: '/blog/idee-sortie-groupe-ardenne.html', keywords: ['groupe', 'Ardenne'], content: true },
    { label: 'Article: Chasse au tresor famille Ardenne', path: '/blog/chasse-au-tresor-famille-ardenne.html', keywords: ['chasse', 'famille'], content: true },
  ];
  let routes = [];
  try {
    const stored = await readStoredData();
    const sourceRoutes = typeof getPublicRoutes === 'function' ? getPublicRoutes(stored) : (Array.isArray(stored?.routes) ? stored.routes : []);
    routes = sourceRoutes.map(function (route) {
      let path = '';
      try { path = getRoutePublicPath(route); } catch { path = '/parcours/' + compactText(route?.id || route?.title || 'parcours') + '.html'; }
      return {
        label: 'Parcours: ' + compactText(route?.title || route?.id || 'sans titre'),
        path: path,
        keywords: [compactText(route?.title || ''), compactText(route?.area || '')].filter(Boolean),
        route: true,
      };
    });
  } catch {}

  const pages = staticPages.concat(routes);
  const assetCache = new Map();

  function toAbsoluteUrl(pathname) {
    const value = String(pathname || '/');
    if (/^https?:\/\//i.test(value)) return value;
    return baseUrl + (value.startsWith('/') ? value : '/' + value);
  }

  function withFreshQuery(url, key) {
    return url + (url.includes('?') ? '&' : '?') + key + '=' + checkedAt;
  }

  async function fetchText(pathname, kind) {
    if (typeof fetch !== 'function') {
      return { ok: false, status: 0, url: toAbsoluteUrl(pathname), text: '', error: 'Verification HTTP indisponible.' };
    }
    const url = toAbsoluteUrl(pathname);
    try {
      const response = await fetch(withFreshQuery(url, kind || 'seoCheck'), { cache: 'no-store' });
      const text = await response.text().catch(function () { return ''; });
      return { ok: response.ok, status: response.status, url: url, text: text, contentType: response.headers.get('content-type') || '' };
    } catch (error) {
      return { ok: false, status: 0, url: url, text: '', error: error?.message || 'Verification impossible.' };
    }
  }

  function extractAttr(html, pattern) {
    const match = String(html || '').match(pattern);
    return match ? compactText(match[1]) : '';
  }

  function stripTags(html) {
    return String(html || '').replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  }

  function normalizeSeoTextV164(value) {
    return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  }

  function extractImageRefs(html, pageUrl) {
    const refs = new Set();
    const source = String(html || '');
    const attrPattern = /\b(?:src|href|content)=["']([^"']+\.(?:png|jpe?g|webp|gif|svg)(?:\?[^"']*)?)["']/gi;
    let match = attrPattern.exec(source);
    while (match) {
      const raw = compactText(match[1]);
      if (raw && !raw.startsWith('data:')) {
        try { refs.add(new URL(raw, pageUrl).href); } catch {}
      }
      match = attrPattern.exec(source);
    }
    return Array.from(refs);
  }

  async function checkAsset(url) {
    if (assetCache.has(url)) return assetCache.get(url);
    const result = (async function () {
      if (typeof fetch !== 'function') return { url: url, ok: false, status: 0, error: 'Verification HTTP indisponible.' };
      try {
        const response = await fetch(withFreshQuery(url, 'assetCheck'), { cache: 'no-store' });
        await response.arrayBuffer().catch(function () {});
        return { url: url, ok: response.ok, status: response.status };
      } catch (error) {
        return { url: url, ok: false, status: 0, error: error?.message || 'Image inaccessible.' };
      }
    })();
    assetCache.set(url, result);
    return result;
  }

  async function checkPage(page) {
    const result = await fetchText(page.path, 'pageCheck');
    const warnings = [];
    const critical = [];
    if (!result.ok) {
      critical.push('HTTP ' + result.status);
      return {
        label: page.label,
        path: page.path,
        url: result.url,
        status: 'critical',
        detail: result.error || ('Reponse HTTP ' + result.status + '.'),
        title: '',
        descriptionLength: 0,
        imageCount: 0,
        brokenImages: 0,
        warnings: warnings,
        critical: critical,
      };
    }
    const html = result.text;
    const visibleText = stripTags(html);
    const title = extractAttr(html, /<title[^>]*>([\s\S]*?)<\/title>/i);
    const description = extractAttr(html, /<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["'][^>]*>/i)
      || extractAttr(html, /<meta[^>]+content=["']([^"']*)["'][^>]+name=["']description["'][^>]*>/i);
    const canonical = extractAttr(html, /<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']*)["'][^>]*>/i)
      || extractAttr(html, /<link[^>]+href=["']([^"']*)["'][^>]+rel=["']canonical["'][^>]*>/i);
    const robots = extractAttr(html, /<meta[^>]+name=["']robots["'][^>]+content=["']([^"']*)["'][^>]*>/i)
      || extractAttr(html, /<meta[^>]+content=["']([^"']*)["'][^>]+name=["']robots["'][^>]*>/i);
    const ogImage = extractAttr(html, /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']*)["'][^>]*>/i)
      || extractAttr(html, /<meta[^>]+content=["']([^"']*)["'][^>]+property=["']og:image["'][^>]*>/i);
    if (!title) warnings.push('title manquant');
    if (!description) warnings.push('meta description manquante');
    if (description && (description.length < 70 || description.length > 180)) warnings.push('description a ajuster');
    if (!canonical) warnings.push('canonical manquant');
    if (robots && /noindex/i.test(robots)) critical.push('noindex detecte');
    if (!ogImage) warnings.push('og:image manquant');
    const visibleSearchText = normalizeSeoTextV164(visibleText);
    const missingKeywords = (page.keywords || []).filter(function (keyword) {
      return keyword && !visibleSearchText.includes(normalizeSeoTextV164(keyword));
    });
    if (missingKeywords.length && !page.optional) warnings.push('mot-cle absent: ' + missingKeywords.slice(0, 2).join(', '));
    const images = extractImageRefs(html, result.url);
    if (!images.length) warnings.push('aucune image detectee');
    const imageResults = await Promise.all(images.slice(0, 8).map(checkAsset));
    const brokenImages = imageResults.filter(function (image) { return !image.ok; });
    if (brokenImages.length) warnings.push(brokenImages.length + ' image(s) inaccessible(s)');
    const status = critical.length ? 'critical' : (warnings.length ? 'warning' : 'ok');
    return {
      label: page.label,
      path: page.path,
      url: result.url,
      status: status,
      detail: critical.concat(warnings).join(' ; ') || 'SEO OK.',
      title: title,
      descriptionLength: description.length,
      canonical: canonical,
      robots: robots,
      imageCount: images.length,
      brokenImages: brokenImages.length,
      warnings: warnings,
      critical: critical,
    };
  }

  function normalizeSitemapUrl(url) {
    return String(url || '').replace(/\/+$/, '');
  }

  const pageResults = await Promise.all(pages.map(checkPage));
  const sitemapResponse = await fetchText('/sitemap.xml', 'sitemapCheck');
  const sitemapUrls = Array.from(String(sitemapResponse.text || '').matchAll(/<loc>([\s\S]*?)<\/loc>/gi)).map(function (match) {
    return compactText(match[1]);
  });
  const sitemapSet = new Set(sitemapUrls.map(normalizeSitemapUrl));
  const expectedSitemapUrls = pages.filter(function (page) { return page.core || page.route || page.content; }).map(function (page) {
    return normalizeSitemapUrl(toAbsoluteUrl(page.path));
  });
  const missingFromSitemap = expectedSitemapUrls.filter(function (url) { return !sitemapSet.has(url); });
  const sitemapStatus = !sitemapResponse.ok ? 'critical' : (missingFromSitemap.length ? 'warning' : 'ok');
  const sitemapCheck = {
    label: 'Sitemap',
    path: '/sitemap.xml',
    url: sitemapResponse.url,
    status: sitemapStatus,
    detail: !sitemapResponse.ok ? ('HTTP ' + sitemapResponse.status) : (missingFromSitemap.length ? missingFromSitemap.length + ' URL(s) attendue(s) absente(s).' : sitemapUrls.length + ' URL(s) referencee(s).'),
  };
  const robotsResponse = await fetchText('/robots.txt', 'robotsCheck');
  const robotsHasSitemap = /Sitemap:/i.test(robotsResponse.text || '');
  const robotsStatus = !robotsResponse.ok ? 'critical' : (robotsHasSitemap ? 'ok' : 'warning');
  const robotsCheck = {
    label: 'Robots',
    path: '/robots.txt',
    url: robotsResponse.url,
    status: robotsStatus,
    detail: !robotsResponse.ok ? ('HTTP ' + robotsResponse.status) : (robotsHasSitemap ? 'Sitemap declare.' : 'Sitemap non declare.'),
  };
  const checks = pageResults.concat([sitemapCheck, robotsCheck]);
  const warningCount = checks.filter(function (check) { return check.status === 'warning'; }).length;
  const criticalCount = checks.filter(function (check) { return check.status === 'critical'; }).length;
  const imageCount = pageResults.reduce(function (sum, page) { return sum + Number(page.imageCount || 0); }, 0);
  const brokenImages = pageResults.reduce(function (sum, page) { return sum + Number(page.brokenImages || 0); }, 0);
  const summary = {
    pages: pageResults.length,
    routes: routes.length,
    ok: checks.filter(function (check) { return check.status === 'ok'; }).length,
    warnings: warningCount,
    critical: criticalCount,
    sitemapUrls: sitemapUrls.length,
    sitemapMissing: missingFromSitemap.length,
    images: imageCount,
    brokenImages: brokenImages,
  };
  return {
    ok: criticalCount === 0,
    checkedAt: checkedAt,
    baseUrl: baseUrl,
    summary: summary,
    checks: checks,
    pages: pageResults,
    sitemap: {
      status: sitemapStatus,
      url: sitemapResponse.url,
      count: sitemapUrls.length,
      missing: missingFromSitemap,
    },
    robots: robotsCheck,
    searchConsole: {
      overview: 'https://search.google.com/search-console?resource_id=https%3A%2F%2Fescape-erezee.be%2F',
      sitemaps: 'https://search.google.com/search-console/sitemaps?resource_id=https%3A%2F%2Fescape-erezee.be%2F',
      inspectHome: 'https://search.google.com/search-console/inspect?resource_id=https%3A%2F%2Fescape-erezee.be%2F&id=https%3A%2F%2Fescape-erezee.be%2F',
    },
    trackedQueries: [
      'escape game exterieur Ardenne',
      'activite famille Ardenne',
      'chasse au tresor Ardenne',
      'activite touristique Erezee',
      'activite pres de Durbuy',
      'escape game pres de Durbuy',
      'activite enfant Erezee',
      'week-end famille Ardenne',
      'chasse au tresor famille Ardenne',
      'sortie groupe Ardenne',
    ],
    nextActions: [
      'Controler Search Console chaque semaine au debut, puis chaque mois.',
      'Ajouter un article local ou une photo reelle quand une nouvelle activite est testee.',
      'Remplacer les avis exemples par des avis clients reels des qu ils arrivent.',
      'Inspecter manuellement les nouvelles pages importantes apres publication.',
    ],
  };
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
  const storedPrice = route?.pricePerTeam ?? route?.pricePerPerson;
  if (route && (storedPrice === undefined || storedPrice === null)) {
    return 1800;
  }
  const price = Number(storedPrice);
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

function getTeamCount(value) {
  const count = Number(value);
  if (!Number.isFinite(count)) return 1;
  return Math.min(20, Math.max(1, Math.floor(count)));
}


function appendStripeParam(params, key, value) {
  if (value === undefined || value === null) return;
  params.append(key, String(value));
}

const SEO_VERSION = 85;

function sendText(response, statusCode, content, contentType = "text/plain; charset=utf-8", headers = {}) {
  response.writeHead(statusCode, {
    "Content-Type": contentType,
    "Cache-Control": "no-cache",
    ...headers,
  });
  response.end(content);
}

function escapeXml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function getSeoOrigin(request) {
  return compactText(PUBLIC_APP_URL).replace(/\/+$/, "") || getRequestOrigin(request).replace(/\/+$/, "");
}

function slugifyRoute(value) {
  return compactText(value || "parcours")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase() || "parcours";
}

function getRoutePublicPath(route) {
  return `/parcours/${slugifyRoute(route?.title || route?.id)}.html`;
}

function getPublicRoutes(data) {
  return (Array.isArray(data?.routes) ? data.routes : []).filter(isRouteVisibleInShop);
}

function getRouteSeoDescription(route) {
  return compactText(route?.description)
    || `Escape game exterieur a ${compactText(route?.area) || "Erezee"} avec enigmes, marche et aventure en equipe.`;
}

function getRouteSeoImage(route, origin) {
  const searchable = compactText([route?.id, route?.slug, route?.title, route?.publicPath].filter(Boolean).join(" ")).toLowerCase();
  let imagePath = '/assets/seo/escape-game-ardenne-v158.svg?v=158';
  if (searchable.includes('vicinal')) imagePath = '/assets/seo/activite-pres-durbuy-v158.svg?v=158';
  if (searchable.includes('balises') || searchable.includes('blier')) imagePath = '/assets/seo/chasse-tresor-ardenne-v158.svg?v=158';
  if (searchable.includes('dame') || searchable.includes('soy') || searchable.includes('lettre')) imagePath = '/assets/seo/escape-game-ardenne-v158.svg?v=158';
  return origin + imagePath;
}

function makeJsonLd(value) {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

function getRouteOffer(route, origin) {
  const price = getRoutePriceCents(route) / 100;
  if (!Number.isFinite(price) || price <= 0) return undefined;
  return {
    "@type": "Offer",
    priceCurrency: "EUR",
    price: price.toFixed(2),
    availability: "https://schema.org/InStock",
    url: `${origin}/index.html#shop`,
  };
}

function renderRouteStructuredData(route, origin) {
  const offer = getRouteOffer(route, origin);
  return makeJsonLd({
    "@context": "https://schema.org",
    "@type": "Product",
    name: route.title,
    description: getRouteSeoDescription(route),
    image: getRouteSeoImage(route, origin),
    brand: { "@type": "Brand", name: "Escape Erezee" },
    category: "Escape game exterieur",
    areaServed: compactText(route.area) || "Erezee",
    offers: offer,
  });
}

function renderRouteSeoPage(route, routes, origin) {
  const canonical = `${origin}${getRoutePublicPath(route)}`;
  const description = getRouteSeoDescription(route);
  const title = `${route.title} | Escape Erezee`;
  const image = getRouteSeoImage(route, origin);
  const duration = Number(route.duration) ? `${Number(route.duration)} minutes` : "Duree variable";
  const distance = compactText(route.distance) || "Distance indiquee sur place";
  const price = getRoutePriceCents(route) > 0 ? `${(getRoutePriceCents(route) / 100).toFixed(2).replace(".", ",")} € / personne` : "Prix disponible dans la boutique";
  const otherRoutes = routes
    .filter((item) => item.id !== route.id)
    .map((item) => `<li><a href="${escapeHtml(getRoutePublicPath(item))}">${escapeHtml(item.title)}</a></li>`)
    .join("\n");

  return `<!doctype html>
<html lang="fr-BE">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="robots" content="index, follow" />
    <meta name="description" content="${escapeHtml(description)}" />
    <link rel="canonical" href="${escapeHtml(canonical)}" />
    <title>${escapeHtml(title)}</title>
    <meta property="og:type" content="product" />
    <meta property="og:site_name" content="Escape Erezee" />
    <meta property="og:title" content="${escapeHtml(title)}" />
    <meta property="og:description" content="${escapeHtml(description)}" />
    <meta property="og:url" content="${escapeHtml(canonical)}" />
    <meta property="og:image" content="${escapeHtml(image)}" />
    <meta name="twitter:card" content="summary_large_image" />
    <script type="application/ld+json">${renderRouteStructuredData(route, origin)}</script>
    <style>
      :root { color-scheme: light; font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; color: #14201d; background: #f4f7f5; }
      body { margin: 0; }
      main { max-width: 920px; margin: 0 auto; padding: 32px 20px 48px; }
      header, section { margin-bottom: 28px; }
      .eyebrow { color: #1f6a58; font-size: 0.78rem; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase; }
      h1 { margin: 8px 0 12px; font-size: clamp(2rem, 5vw, 3.8rem); line-height: 1.02; }
      h2 { font-size: 1.35rem; }
      p, li { font-size: 1.04rem; line-height: 1.65; }
      img { display: block; width: 100%; max-height: 430px; object-fit: cover; border-radius: 8px; margin: 22px 0; box-shadow: 0 18px 40px rgba(10, 35, 29, 0.13); }
      .facts { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px; padding: 0; list-style: none; }
      .facts li { border: 1px solid #dce6e1; border-radius: 8px; background: white; padding: 14px; }
      .facts strong { display: block; font-size: 0.75rem; color: #63736e; text-transform: uppercase; }
      .actions { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 24px; }
      .button { display: inline-flex; align-items: center; justify-content: center; min-height: 44px; border-radius: 8px; padding: 0 18px; color: white; background: #123c32; font-weight: 800; text-decoration: none; }
      .button.secondary { color: #123c32; background: white; border: 1px solid #b9cbc4; }
      nav ul { padding-left: 18px; }
    </style>
  </head>
  <body>
    <main>
      <header>
        <p class="eyebrow">Escape game exterieur a Erezee</p>
        <h1>${escapeHtml(route.title)}</h1>
        <p>${escapeHtml(description)}</p>
        <img src="${escapeHtml(image)}" alt="" loading="eager" decoding="async" fetchpriority="high" />
        <div class="actions">
          <a class="button" href="${origin}/index.html#shop">Reserver ce parcours</a>
          <a class="button secondary" href="${origin}/">Voir la boutique</a>
        </div>
      </header>
      <section aria-labelledby="infos-parcours">
        <h2 id="infos-parcours">Informations parcours</h2>
        <ul class="facts">
          <li><strong>Lieu</strong>${escapeHtml(compactText(route.area) || "Erezee")}</li>
          <li><strong>Duree</strong>${escapeHtml(duration)}</li>
          <li><strong>Distance</strong>${escapeHtml(distance)}</li>
          <li><strong>Enigmes</strong>${escapeHtml(String(route.puzzles?.length || 0))} etapes</li>
          <li><strong>Tarif</strong>${escapeHtml(price)}</li>
        </ul>
      </section>
      ${otherRoutes ? `<nav aria-labelledby="autres-parcours"><h2 id="autres-parcours">Autres parcours Escape Erezee</h2><ul>${otherRoutes}</ul></nav>` : ""}
    </main>
  </body>
</html>`;
}

const SEO_STATIC_PATHS_V91 = ["/escape-game-exterieur-ardenne.html","/activite-famille-ardenne.html","/chasse-au-tresor-ardenne.html","/activite-touristique-erezee.html","/activite-pres-de-durbuy.html","/blog/","/blog/que-faire-a-erezee.html","/blog/que-faire-pres-de-durbuy.html","/blog/activites-familiales-ardenne-belge.html","/blog/top-10-activites-exterieures-ardenne.html","/blog/que-faire-vacances-ardenne.html"];

/* seo-sitemap-meta-v131 */
const SEO_STATIC_PAGES_V168 = [
  {
    "path": "/",
    "priority": "1.0",
    "changefreq": "weekly"
  },
  {
    "path": "/escape-game-exterieur-ardenne.html",
    "priority": "0.9",
    "changefreq": "monthly"
  },
  {
    "path": "/activite-famille-ardenne.html",
    "priority": "0.85",
    "changefreq": "monthly"
  },
  {
    "path": "/chasse-au-tresor-ardenne.html",
    "priority": "0.85",
    "changefreq": "monthly"
  },
  {
    "path": "/activite-touristique-erezee.html",
    "priority": "0.85",
    "changefreq": "monthly"
  },
  {
    "path": "/activite-pres-de-durbuy.html",
    "priority": "0.85",
    "changefreq": "monthly"
  },
  {
    "path": "/blog/",
    "priority": "0.8",
    "changefreq": "weekly"
  },
  {
    "path": "/blog/que-faire-a-erezee.html",
    "priority": "0.74",
    "changefreq": "monthly"
  },
  {
    "path": "/blog/que-faire-pres-de-durbuy.html",
    "priority": "0.74",
    "changefreq": "monthly"
  },
  {
    "path": "/blog/activites-familiales-ardenne-belge.html",
    "priority": "0.74",
    "changefreq": "monthly"
  },
  {
    "path": "/blog/top-10-activites-exterieures-ardenne.html",
    "priority": "0.74",
    "changefreq": "monthly"
  },
  {
    "path": "/blog/que-faire-vacances-ardenne.html",
    "priority": "0.74",
    "changefreq": "monthly"
  },
  {
    "path": "/blog/activite-enfant-erezee.html",
    "priority": "0.74",
    "changefreq": "monthly"
  },
  {
    "path": "/blog/escape-game-pres-de-durbuy.html",
    "priority": "0.74",
    "changefreq": "monthly"
  },
  {
    "path": "/blog/week-end-famille-ardenne.html",
    "priority": "0.74",
    "changefreq": "monthly"
  },
  {
    "path": "/blog/idee-sortie-groupe-ardenne.html",
    "priority": "0.74",
    "changefreq": "monthly"
  },
  {
    "path": "/blog/chasse-au-tresor-famille-ardenne.html",
    "priority": "0.74",
    "changefreq": "monthly"
  }
];

function buildSitemapXml(routes, origin) {
  const lastmod = new Date().toISOString().slice(0, 10);
  const staticPages = SEO_STATIC_PAGES_V168.map((entry) => ({
    url: `${origin}${entry.path}`,
    priority: entry.priority,
    changefreq: entry.changefreq,
  }));
  const routePages = (Array.isArray(routes) ? routes : []).map((route) => ({
    url: `${origin}${getRoutePublicPath(route)}`,
    priority: '0.9',
    changefreq: 'weekly',
  }));
  const seen = new Set();
  const entries = [...staticPages, ...routePages].filter((entry) => {
    if (!entry.url || seen.has(entry.url)) return false;
    seen.add(entry.url);
    return true;
  });
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.map((entry) => `  <url>
    <loc>${escapeXml(entry.url)}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${entry.changefreq}</changefreq>
    <priority>${entry.priority}</priority>
  </url>`).join('\n')}
</urlset>
`;
}

async function handleSeoRequest(request, response, pathname) {
  if (request.method !== "GET" && request.method !== "HEAD") return false;
  const origin = getSeoOrigin(request);

  if (pathname === "/robots.txt") {
    sendText(response, 200, `User-agent: *
Allow: /
Sitemap: ${origin}/sitemap.xml
`, "text/plain; charset=utf-8");
    return true;
  }

  if (pathname === "/sitemap.xml") {
    const stored = await readStoredData();
    const routes = getPublicRoutes(stored);
    sendText(response, 200, buildSitemapXml(routes, origin), "application/xml; charset=utf-8");
    return true;
  }

  if (pathname.startsWith("/parcours/") && pathname.endsWith(".html")) {
    const stored = await readStoredData();
    const routes = getPublicRoutes(stored);
    const requestedSlug = decodeURIComponent(pathname.replace(/^\/parcours\//, "").replace(/\.html$/, ""));
    const route = routes.find((item) => slugifyRoute(item.title || item.id) === requestedSlug);
    if (!route) {
      sendText(response, 404, "Parcours introuvable", "text/plain; charset=utf-8");
      return true;
    }
    sendText(response, 200, renderRouteSeoPage(route, routes, origin), "text/html; charset=utf-8");
    return true;
  }

  return false;
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

function findExistingStripeCodes(data, sessionId) {
  return data.codes
    .filter((item) => item.source === "stripe" && compactText(item.stripeSessionId) === compactText(sessionId))
    .sort((a, b) => (Number(a.teamIndex) || 0) - (Number(b.teamIndex) || 0) || a.createdAt - b.createdAt);
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



/* stripe-multi-team-codes-v178 */
function findStripeCodesV178(data, sessionId) {
  const sessionKey = compactText(sessionId);
  return (Array.isArray(data?.codes) ? data.codes : []).filter((item) => (
    item.source === "stripe"
      && compactText(item.stripeSessionId) === sessionKey
  ));
}

function getStripeTeamCountV178(session) {
  return getPlayerCount(session?.metadata?.teamCount ?? session?.metadata?.playerCount ?? session?.metadata?.players);
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



function buildActivationMailBodyForCodesV178(codeValues, route, customer = {}) {
  if (!Array.isArray(codeValues) || codeValues.length <= 1) {
    return buildActivationMailBody(codeValues?.[0], route, customer);
  }
  const greetingName = getFirstText(customer.customerFirstName, customer.customerName);
  return [
    greetingName ? `Bonjour ${greetingName},` : "Bonjour,",
    "",
    `Merci pour votre achat du parcours ${route.title}.`,
    "Vos codes d'activation sont :",
    ...codeValues.map((code, index) => `- Equipe ${index + 1} : ${code}`),
    "",
    "Chaque equipe doit utiliser un code different pour demarrer sa partie.",
    "",
    "Informations de votre reservation :",
    `- Parcours : ${route.title}`,
    `- Equipes : ${codeValues.length}`,
    customer.customerName ? `- Nom : ${customer.customerName}` : null,
    customer.customerEmail ? `- E-mail : ${customer.customerEmail}` : null,
    customer.customerAddress ? `- Adresse : ${formatCustomerAddress(customer.customerAddress).replace(/\n/g, ", ")}` : null,
    "",
    `Vous pouvez demarrer la partie ici : ${PUBLIC_APP_URL}/index.html#player`,
    "",
    "Bonne aventure !",
  ].filter((line) => line !== null).join("\n");
}

function buildActivationMailHtmlForCodesV178(codeValues, route, customer = {}) {
  if (!Array.isArray(codeValues) || codeValues.length <= 1) {
    return buildActivationMailHtml(codeValues?.[0], route, customer);
  }
  const address = formatCustomerAddress(customer.customerAddress);
  const addressHtml = address
    ? address.split("\n").map((line) => escapeHtml(line)).join("<br>")
    : "";
  const rows = [
    ["Parcours", route.title],
    ["Equipes", String(codeValues.length)],
    customer.customerName ? ["Nom", customer.customerName] : null,
    customer.customerEmail ? ["E-mail", customer.customerEmail] : null,
    addressHtml ? ["Adresse", addressHtml, true] : null,
  ].filter(Boolean);

  return `
    <div style="font-family:Arial,sans-serif;color:#123c32;line-height:1.5">
      <h1 style="margin:0 0 12px">Vos codes Escape Erezee</h1>
      <p>Merci pour votre achat du parcours <strong>${escapeHtml(route.title)}</strong>.</p>
      <p>Chaque equipe doit utiliser un code different :</p>
      <ol>
        ${codeValues.map((code, index) => `<li><strong>Equipe ${index + 1} :</strong> ${escapeHtml(code)}</li>`).join("")}
      </ol>
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


/* review-routine-v171 */
const PUBLIC_REVIEW_URL_V171 = compactText(globalThis.process?.env?.GOOGLE_REVIEW_URL || globalThis.process?.env?.PUBLIC_REVIEW_URL || "https://g.page/r/CfoZCZf_vyxPEBM/review");

function normalizeReviewUrlV171(value) {
  const text = compactText(value);
  if (!text || /google\.com\/search\?q=Stock/i.test(text)) return PUBLIC_REVIEW_URL_V171;
  return text;
}

function isFinishedTeamV171(team) {
  return team?.status === "won" || team?.status === "lost";
}

function findReviewTeamV171(stored, payload) {
  const teams = Array.isArray(stored?.teams) ? stored.teams : [];
  const codes = Array.isArray(stored?.codes) ? stored.codes : [];
  const teamId = compactText(payload?.teamId || payload?.team_id);
  const codeValue = compactText(payload?.code || payload?.activationCode || payload?.activation_code).toUpperCase();
  if (teamId) {
    const directTeam = teams.find((team) => compactText(team.id) === teamId);
    if (directTeam) return directTeam;
  }
  if (codeValue) {
    const code = codes.find((item) => compactText(item.code).toUpperCase() === codeValue);
    if (code?.teamId) {
      const codeTeam = teams.find((team) => compactText(team.id) === compactText(code.teamId));
      if (codeTeam) return codeTeam;
    }
    return teams.find((team) => compactText(team.code).toUpperCase() === codeValue) || null;
  }
  return null;
}

function findReviewCodeV171(stored, team, payload) {
  const codes = Array.isArray(stored?.codes) ? stored.codes : [];
  const requestedCode = compactText(payload?.code || payload?.activationCode || payload?.activation_code).toUpperCase();
  const teamCode = compactText(team?.code).toUpperCase();
  return codes.find((code) => compactText(code.teamId) && compactText(code.teamId) === compactText(team?.id))
    || codes.find((code) => compactText(code.code).toUpperCase() === (requestedCode || teamCode))
    || null;
}

function customerNameForReviewV171(code, team) {
  return getFirstText(
    code?.customerFirstName,
    code?.customerName,
    team?.customerName,
    team?.name,
    "aventurier",
  );
}

function buildReviewReminderTextV171(team, route, code) {
  const name = customerNameForReviewV171(code, team);
  return [
    "Bonjour " + name + ",",
    "",
    "Merci encore d'avoir joue au parcours " + route.title + ".",
    "Votre retour aide beaucoup les prochaines equipes a choisir leur aventure en Ardenne.",
    "",
    "Vous pouvez laisser un avis ici : " + PUBLIC_REVIEW_URL_V171,
    "",
    "A bientot,",
    "Stock & Sevrin Escape Games",
  ].join("\n");
}

function buildReviewReminderHtmlV171(team, route, code) {
  const name = customerNameForReviewV171(code, team);
  return [
    '<div style="font-family:Arial,sans-serif;color:#123c32;line-height:1.55">',
      '<h1 style="margin:0 0 12px">Merci pour votre aventure</h1>',
      '<p>Bonjour ' + escapeHtml(name) + ',</p>',
      "<p>Merci encore d'avoir joue au parcours <strong>" + escapeHtml(route.title) + "</strong>.</p>",
      '<p>Votre retour aide beaucoup les prochaines equipes a choisir leur aventure en Ardenne.</p>',
      '<p><a href="' + escapeHtml(PUBLIC_REVIEW_URL_V171) + '" style="display:inline-block;background:#d9961f;color:#0f241f;text-decoration:none;font-weight:bold;padding:12px 16px;border-radius:8px">Laisser un avis Google</a></p>',
      '<p>A bientot,<br>Stock &amp; Sevrin Escape Games</p>',
    '</div>',
  ].join("");
}

async function sendReviewReminderForTeamV171(payload) {
  if (!RESEND_API_KEY || !MAIL_FROM) {
    return { status: 200, payload: { ok: true, configured: false, sent: false, skipped: true } };
  }

  const pending = await withDataMutation(async () => {
    const stored = await readStoredData();
    if (!stored) {
      return { status: 404, payload: { message: "Aucune donnee serveur disponible." } };
    }
    const team = findReviewTeamV171(stored, payload);
    if (!team) {
      return { status: 404, payload: { message: "Equipe introuvable." } };
    }
    const requestedCode = compactText(payload?.code || payload?.activationCode || payload?.activation_code).toUpperCase();
    if (requestedCode && compactText(team.code).toUpperCase() && requestedCode !== compactText(team.code).toUpperCase()) {
      return { status: 403, payload: { message: "Code equipe invalide." } };
    }
    if (!isFinishedTeamV171(team)) {
      return { status: 409, payload: { ok: true, configured: true, sent: false, skipped: true, reason: "not_finished" } };
    }
    const route = (Array.isArray(stored.routes) ? stored.routes : []).find((item) => item.id === team.routeId);
    if (!route) {
      return { status: 404, payload: { message: "Parcours introuvable." } };
    }
    const code = findReviewCodeV171(stored, team, payload);
    if (team.reviewReminderSentAt || code?.reviewReminderSentAt) {
      return { status: 200, payload: { ok: true, configured: true, sent: true, skipped: true, alreadySent: true } };
    }
    if (team.reviewReminderStatus === "sending" && Date.now() - Number(team.reviewReminderStartedAt || 0) < 5 * 60 * 1000) {
      return { status: 200, payload: { ok: true, configured: true, sent: false, skipped: true, reason: "already_sending" } };
    }
    const email = getFirstText(code?.customerEmail, team.customerEmail);
    if (!email) {
      team.reviewReminderStatus = "missing_email";
      team.reviewReminderCheckedAt = Date.now();
      if (code) code.reviewReminderStatus = "missing_email";
      await writeStoredData(stored);
      return { status: 200, payload: { ok: true, configured: true, sent: false, skipped: true, reason: "missing_email" } };
    }
    team.reviewReminderStatus = "sending";
    team.reviewReminderStartedAt = Date.now();
    team.reviewReminderError = null;
    if (code) {
      code.reviewReminderStatus = "sending";
      code.reviewReminderStartedAt = team.reviewReminderStartedAt;
      code.reviewReminderError = null;
    }
    await writeStoredData(stored);
    return {
      status: 200,
      payload: {
        ok: true,
        configured: true,
        teamId: team.id,
        codeValue: code?.code || team.code,
        mail: {
          to: email,
          subject: "Merci pour votre aventure a Erezee",
          text: buildReviewReminderTextV171(team, route, code),
          html: buildReviewReminderHtmlV171(team, route, code),
        },
      },
    };
  });

  if (pending.status !== 200 || !pending.payload?.mail) return pending;

  try {
    const mailResult = await sendResendEmail(pending.payload.mail);
    await withDataMutation(async () => {
      const stored = await readStoredData();
      if (!stored) return;
      const team = findReviewTeamV171(stored, { teamId: pending.payload.teamId, code: pending.payload.codeValue });
      const code = findReviewCodeV171(stored, team, { code: pending.payload.codeValue });
      const now = Date.now();
      if (team) {
        team.reviewReminderStatus = "sent";
        team.reviewReminderSentAt = now;
        team.reviewReminderProvider = mailResult.provider;
        team.reviewReminderId = mailResult.id || null;
        team.reviewReminderError = null;
      }
      if (code) {
        code.reviewReminderStatus = "sent";
        code.reviewReminderSentAt = now;
        code.reviewReminderProvider = mailResult.provider;
        code.reviewReminderId = mailResult.id || null;
        code.reviewReminderError = null;
      }
      await writeStoredData(stored);
    });
    return { status: 200, payload: { ok: true, configured: true, sent: true, provider: mailResult.provider, id: mailResult.id || null } };
  } catch (error) {
    await withDataMutation(async () => {
      const stored = await readStoredData();
      if (!stored) return;
      const team = findReviewTeamV171(stored, { teamId: pending.payload.teamId, code: pending.payload.codeValue });
      const code = findReviewCodeV171(stored, team, { code: pending.payload.codeValue });
      if (team) {
        team.reviewReminderStatus = "error";
        team.reviewReminderError = error.message || "E-mail non envoye.";
      }
      if (code) {
        code.reviewReminderStatus = "error";
        code.reviewReminderError = error.message || "E-mail non envoye.";
      }
      await writeStoredData(stored);
    });
    return { status: 200, payload: { ok: true, configured: true, sent: false, error: error.message || "E-mail non envoye." } };
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
    appendStripeParam(params, "custom_text[submit][message]", "Vos codes d\'activation seront envoyes par e-mail apres paiement.");
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

/* player-mobile-runtime-v187 */
const PLAYER_TEAM_SYNC_MAX_BODY_V187 = 256 * 1024;
const PLAYER_TEAM_BACKUP_INTERVAL_V187 = 15 * 60 * 1000;
let lastPlayerTeamBackupAtV187 = 0;

function finiteTimestampV187(value) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? Math.round(number) : null;
}

function safePlayerTextV187(value, maxLength = 500) {
  return String(value == null ? "" : value).trim().slice(0, maxLength);
}

function mergePuzzleTextMapV187(previous, incoming, allowedIds, maxLength = 500) {
  const result = { ...(previous && typeof previous === "object" ? previous : {}) };
  if (!incoming || typeof incoming !== "object") return result;
  allowedIds.forEach((id) => {
    if (!Object.prototype.hasOwnProperty.call(incoming, id)) return;
    const value = safePlayerTextV187(incoming[id], maxLength);
    if (value) result[id] = value;
  });
  return result;
}

function mergePuzzleNumberMapV187(previous, incoming, allowedIds) {
  const result = { ...(previous && typeof previous === "object" ? previous : {}) };
  if (!incoming || typeof incoming !== "object") return result;
  allowedIds.forEach((id) => {
    const value = Math.max(0, Math.min(10000, Math.floor(Number(incoming[id]) || 0)));
    result[id] = Math.max(Math.floor(Number(result[id]) || 0), value);
  });
  return result;
}

function mergePlayerPositionV187(previous, incoming) {
  if (!incoming || typeof incoming !== "object") return previous || null;
  const lat = Number(incoming.lat);
  const lng = Number(incoming.lng);
  const accuracy = Number(incoming.accuracy);
  const at = finiteTimestampV187(incoming.at);
  if (!Number.isFinite(lat) || lat < -90 || lat > 90) return previous || null;
  if (!Number.isFinite(lng) || lng < -180 || lng > 180) return previous || null;
  if (!at || at > Date.now() + 5 * 60 * 1000) return previous || null;
  if (finiteTimestampV187(previous?.at) && Number(previous.at) > at) return previous;
  return {
    lat,
    lng,
    accuracy: Number.isFinite(accuracy) ? Math.max(0, Math.min(100000, accuracy)) : null,
    at,
  };
}

function mergePlayerTeamV187(previous, incoming, route, code) {
  const puzzleIds = new Set((route?.puzzles || []).map((puzzle) => puzzle?.id).filter(Boolean));
  const base = previous || {
    id: safePlayerTextV187(incoming.id, 120),
    name: "Equipe",
    routeId: code.routeId,
    code: code.code,
    startAt: null,
    finishedAt: null,
    status: "briefing",
    updatedAt: Date.now(),
    answers: {},
    unlockedPuzzleIds: [],
    attempts: {},
    hints: {},
    photoNames: {},
  };
  const answers = mergePuzzleTextMapV187(base.answers, incoming.answers, puzzleIds, 1000);
  const unlockedPuzzleIds = Array.from(new Set([
    ...(Array.isArray(base.unlockedPuzzleIds) ? base.unlockedPuzzleIds : []),
    ...(Array.isArray(incoming.unlockedPuzzleIds) ? incoming.unlockedPuzzleIds : []),
  ])).filter((id) => puzzleIds.has(id));
  const allSolved = puzzleIds.size > 0 && Array.from(puzzleIds).every((id) => Boolean(answers[id]));
  let status = ["briefing", "playing", "won", "lost"].includes(base.status) ? base.status : "briefing";
  if (!["won", "lost"].includes(status)) {
    if (incoming.status === "playing" || incoming.status === "won") status = "playing";
    if (incoming.status === "won" && allSolved) status = "won";
  }
  const startAt = finiteTimestampV187(base.startAt) || finiteTimestampV187(incoming.startAt);
  const finishedAt = ["won", "lost"].includes(status)
    ? finiteTimestampV187(base.finishedAt) || finiteTimestampV187(incoming.finishedAt) || Date.now()
    : null;
  return {
    ...base,
    id: base.id,
    name: safePlayerTextV187(incoming.name || base.name || "Equipe", 100),
    routeId: code.routeId,
    code: code.code,
    startAt,
    finishedAt,
    timeExpiredAt: finiteTimestampV187(base.timeExpiredAt) || finiteTimestampV187(incoming.timeExpiredAt),
    status,
    updatedAt: Date.now(),
    answers,
    unlockedPuzzleIds,
    attempts: mergePuzzleNumberMapV187(base.attempts, incoming.attempts, puzzleIds),
    hints: mergePuzzleNumberMapV187(base.hints, incoming.hints, puzzleIds),
    photoNames: mergePuzzleTextMapV187(base.photoNames, incoming.photoNames, puzzleIds, 240),
    lastPosition: mergePlayerPositionV187(base.lastPosition, incoming.lastPosition),
  };
}

async function writePlayerTeamDataV187(payload) {
  await mkdir(DATA_DIR, { recursive: true });
  const now = Date.now();
  if (now - lastPlayerTeamBackupAtV187 >= PLAYER_TEAM_BACKUP_INTERVAL_V187) {
    if (typeof backupStoredDataIfPresent === "function") {
      await backupStoredDataIfPresent(payload);
    }
    lastPlayerTeamBackupAtV187 = now;
  }
  const tempFile = DATA_FILE + ".player.tmp";
  await writeFile(tempFile, JSON.stringify(payload, null, 2) + "\n", "utf8");
  await rename(tempFile, DATA_FILE);
}

async function handlePlayerTeamSyncV187(request, response) {
  if (request.method !== "POST") {
    sendJson(response, 405, { message: "Methode non autorisee." });
    return true;
  }
  try {
    const body = await readRequestBody(request);
    if (Buffer.byteLength(body, "utf8") > PLAYER_TEAM_SYNC_MAX_BODY_V187) {
      sendJson(response, 413, { message: "Synchronisation joueur trop volumineuse." });
      return true;
    }
    const payload = body ? JSON.parse(body) : {};
    const incoming = payload?.team;
    if (!incoming || typeof incoming !== "object") {
      sendJson(response, 400, { message: "Equipe invalide." });
      return true;
    }
    const result = await withDataMutation(async () => {
      const stored = await readStoredData();
      if (!stored) return { status: 404, payload: { message: "Donnees serveur absentes." } };
      const codeValue = safePlayerTextV187(incoming.code, 120);
      const code = stored.codes.find((item) => item?.code === codeValue);
      if (!code || code.teamDeletedAt) {
        return { status: 403, payload: { message: "Code joueur invalide." } };
      }
      const route = stored.routes.find((item) => item?.id === code.routeId);
      if (!route) return { status: 409, payload: { message: "Parcours indisponible." } };
      const requestedId = safePlayerTextV187(incoming.id, 120);
      let team = stored.teams.find((item) => item?.id === code.teamId)
        || stored.teams.find((item) => item?.code === code.code)
        || null;
      if (team && requestedId && team.id !== requestedId) {
        return { status: 409, payload: { message: "Cette equipe est deja liee a un autre appareil." } };
      }
      if (!team && (!requestedId || code.teamId)) {
        return { status: 409, payload: { message: "Session joueur incoherente." } };
      }
      team = mergePlayerTeamV187(team, { ...incoming, id: requestedId }, route, code);
      const teamIndex = stored.teams.findIndex((item) => item.id === team.id);
      if (teamIndex >= 0) stored.teams[teamIndex] = team;
      else stored.teams.push(team);
      code.status = "used";
      code.teamId = team.id;
      await writePlayerTeamDataV187(stored);
      return { status: 200, payload: { ok: true, savedAt: Date.now(), team } };
    });
    sendJson(response, result.status, result.payload);
  } catch (error) {
    sendJson(response, 400, { message: error.message || "Synchronisation joueur impossible." });
  }
  return true;
}


/* admin-stale-briefing-cleanup-v196 */
const ADMIN_STALE_BRIEFING_DELETE_MS_V196 = 60 * 60 * 1000;
const ADMIN_ACTIVE_TEAM_DELETE_MS_V196 = 3 * 60 * 60 * 1000;

function adminTeamActivityAtV196(team) {
  return Math.max(
    Number(team?.updatedAt) || 0,
    Number(team?.lastPosition?.at) || 0,
    Number(team?.briefingStartLocation?.at) || 0,
    Number(team?.finishedAt) || 0,
    Number(team?.startAt) || 0,
    Number(team?.createdAt) || 0,
  );
}

function adminTeamDeleteAllowedV196(team, now = Date.now()) {
  if (!team) return false;
  if (team.status === "won" || team.status === "lost") return true;
  if (team.status === "briefing") {
    const activityAt = adminTeamActivityAtV196(team);
    return !activityAt || now - activityAt >= ADMIN_STALE_BRIEFING_DELETE_MS_V196;
  }
  const startedAt = Number(team.startAt || team.createdAt || 0);
  return Boolean(startedAt && now - startedAt >= ADMIN_ACTIVE_TEAM_DELETE_MS_V196);
}

async function handleAdminTeamCleanupV196(request, response) {
  if (!isAdminRequest(request)) {
    sendJson(response, 401, { message: "Connexion gestion requise." });
    return true;
  }
  if (request.method !== "POST") {
    sendJson(response, 405, { message: "Methode non autorisee." });
    return true;
  }
  try {
    const body = await readRequestBody(request);
    if (Buffer.byteLength(body, "utf8") > 4096) throw new Error("Requete trop volumineuse.");
    const payload = body ? JSON.parse(body) : {};
    const teamId = compactText(payload.teamId).slice(0, 160);
    if (payload.action !== "delete-stale-team" || !teamId) {
      sendJson(response, 400, { message: "Action de suppression invalide." });
      return true;
    }
    const result = await withDataMutation(async () => {
      const stored = await readStoredData();
      if (!stored) return { status: 404, payload: { message: "Donnees serveur absentes." } };
      const team = stored.teams.find((item) => item?.id === teamId);
      if (!team) return { status: 404, payload: { message: "Equipe deja retiree." } };
      if (!adminTeamDeleteAllowedV196(team)) {
        return { status: 409, payload: { message: team.status === "briefing" ? "Ce briefing a ete actif il y a moins d'une heure." : "Cette equipe ne peut pas encore etre supprimee." } };
      }

      const deletedAt = Date.now();
      const nextData = {
        ...stored,
        teams: stored.teams.filter((item) => item?.id !== teamId),
        codes: stored.codes.map((item) => ({ ...item })),
      };
      const code = nextData.codes.find((item) => item?.teamId === teamId || item?.code === team.code);
      if (code) {
        code.teamId = null;
        code.status = "used";
        code.teamDeletedAt = deletedAt;
      }
      await createAdminPreSaveBackupV167(stored, nextData);
      await writeStoredData(nextData);
      return { status: 200, payload: { ok: true, deletedTeamId: teamId, codePreserved: Boolean(code), deletedAt } };
    });
    sendJson(response, result.status, result.payload);
  } catch (error) {
    sendJson(response, 400, { message: error.message || "Suppression de l'equipe impossible." });
  }
  return true;
}


/* final-system-v189 */
const PUBLIC_CATALOG_CACHE_MS_V189 = 60 * 1000;
const PLAYER_ACTIVATION_WINDOW_MS_V189 = 5 * 60 * 1000;
const PLAYER_ACTIVATION_LIMIT_V189 = 20;
const playerMediaCacheV189 = new Map();
const playerActivationAttemptsV189 = new Map();
let publicCatalogCacheV189 = null;
let publicCatalogCacheAtV189 = 0;

function requestIpV189(request) {
  return String(request.headers["x-forwarded-for"] || request.socket?.remoteAddress || "unknown")
    .split(",")[0]
    .trim();
}

function activationAllowedV189(request) {
  const key = requestIpV189(request);
  const now = Date.now();
  const previous = playerActivationAttemptsV189.get(key);
  const bucket = !previous || previous.resetAt <= now
    ? { count: 0, resetAt: now + PLAYER_ACTIVATION_WINDOW_MS_V189 }
    : previous;
  bucket.count += 1;
  playerActivationAttemptsV189.set(key, bucket);
  return bucket.count <= PLAYER_ACTIVATION_LIMIT_V189;
}

async function handleAdminLiveV189(request, response) {
  if (request.method !== "GET") {
    sendJson(response, 405, { message: "Methode non autorisee." });
    return true;
  }
  if (!isAdminRequest(request)) {
    sendJson(response, 401, { message: "Connexion gestion requise." });
    return true;
  }
  const stored = await readStoredData();
  if (!stored) {
    sendJson(response, 404, { message: "Aucune donnee serveur pour le moment." });
    return true;
  }
  sendJson(response, 200, {
    activeRouteId: stored.activeRouteId,
    codes: stored.codes,
    teams: stored.teams,
    updatedAt: Date.now(),
  });
  return true;
}

function publicCoverPathV189(route) {
  const searchable = [route?.id, route?.title, route?.area].filter(Boolean).join(" ").toLowerCase();
  if (searchable.includes("blier") || searchable.includes("balise") || searchable.includes("serment")) {
    return "/assets/seo/chasse-tresor-ardenne-v158.svg?v=189";
  }
  if (searchable.includes("vicinal") || searchable.includes("aisne") || searchable.includes("carnet")) {
    return "/assets/seo/activite-pres-durbuy-v158.svg?v=189";
  }
  return "/assets/seo/escape-game-ardenne-v158.svg?v=189";
}

function publicRouteV189(route) {
  const puzzleCount = Array.isArray(route?.puzzles) ? route.puzzles.length : 0;
  return {
    id: route.id,
    title: route.title,
    area: route.area,
    duration: route.duration,
    distance: route.distance,
    pricePerTeam: route.pricePerTeam,
    pricePerPerson: route.pricePerPerson,
    shopVisible: route.shopVisible !== false,
    description: route.description,
    i18n: route.i18n || {},
    puzzleCount,
    puzzles: Array.from({ length: puzzleCount }, (_, index) => ({ id: "public-" + route.id + "-" + index })),
    coverImage: { name: route.title || "Parcours", dataUrl: publicCoverPathV189(route) },
  };
}

function publicCatalogV189(stored) {
  const now = Date.now();
  if (publicCatalogCacheV189 && now - publicCatalogCacheAtV189 < PUBLIC_CATALOG_CACHE_MS_V189) {
    return publicCatalogCacheV189;
  }
  publicCatalogCacheV189 = {
    activeRouteId: stored.activeRouteId,
    routes: stored.routes.filter((route) => route.shopVisible !== false).map(publicRouteV189),
    updatedAt: now,
  };
  publicCatalogCacheAtV189 = now;
  return publicCatalogCacheV189;
}

function decodeDataUrlV189(value) {
  const match = String(value || "").match(/^data:([^;,]+)(;base64)?,([\s\S]+)$/);
  if (!match) return null;
  try {
    const buffer = match[2]
      ? Buffer.from(match[3], "base64")
      : Buffer.from(decodeURIComponent(match[3]), "utf8");
    return { mime: match[1] || "application/octet-stream", buffer };
  } catch {
    return null;
  }
}

function externalizeImageV189(image) {
  if (!image?.dataUrl || !String(image.dataUrl).startsWith("data:")) return image || null;
  const decoded = decodeDataUrlV189(image.dataUrl);
  if (!decoded) return null;
  const hash = createHash("sha256").update(decoded.buffer).digest("hex");
  playerMediaCacheV189.set(hash, decoded);
  return { ...image, dataUrl: "/api/player/media/" + hash };
}

function externalizeRouteV189(route) {
  return {
    ...route,
    coverImage: externalizeImageV189(route.coverImage),
    puzzles: (route.puzzles || []).map((puzzle) => ({
      ...puzzle,
      image: externalizeImageV189(puzzle.image),
    })),
  };
}

function findCodeAndTeamV189(stored, codeValue, teamId = "") {
  const code = stored.codes.find((item) => item?.code === codeValue && !item.teamDeletedAt) || null;
  if (!code) return { code: null, team: null, route: null };
  const team = stored.teams.find((item) => item?.id === (teamId || code.teamId))
    || stored.teams.find((item) => item?.code === code.code)
    || null;
  const route = stored.routes.find((item) => item?.id === code.routeId) || null;
  return { code, team, route };
}

async function handlePublicCatalogV189(request, response) {
  if (request.method !== "GET") {
    sendJson(response, 405, { message: "Methode non autorisee." });
    return true;
  }
  const stored = await readStoredData();
  if (!stored) {
    sendJson(response, 404, { message: "Catalogue indisponible." });
    return true;
  }
  sendJson(response, 200, publicCatalogV189(stored), {
    "Cache-Control": "public, max-age=60, stale-while-revalidate=300",
  });
  return true;
}

async function handlePlayerActivateV189(request, response) {
  if (request.method !== "POST") {
    sendJson(response, 405, { message: "Methode non autorisee." });
    return true;
  }
  if (!activationAllowedV189(request)) {
    sendJson(response, 429, { message: "Trop de tentatives. Reessayez dans quelques minutes." });
    return true;
  }
  try {
    const body = await readRequestBody(request);
    if (Buffer.byteLength(body, "utf8") > 4096) throw new Error("Requete trop volumineuse.");
    const payload = body ? JSON.parse(body) : {};
    const codeValue = String(payload.code || "").trim().toUpperCase().slice(0, 120);
    const result = await withDataMutation(async () => {
      const stored = await readStoredData();
      if (!stored) return { status: 404, payload: { message: "Donnees serveur absentes." } };
      let { code, team, route } = findCodeAndTeamV189(stored, codeValue);
      if (!code || !route) return { status: 404, payload: { message: "Code introuvable." } };
      if (!team) {
        const id = "team-" + Date.now() + "-" + randomInt(100000, 999999);
        team = {
          id,
          name: "Equipe " + (stored.teams.length + 1),
          routeId: route.id,
          code: code.code,
          startAt: null,
          finishedAt: null,
          status: "briefing",
          updatedAt: Date.now(),
          answers: {},
          unlockedPuzzleIds: (route.puzzles || []).filter((puzzle) => !puzzle.requireLocation).map((puzzle) => puzzle.id),
          attempts: {},
          hints: {},
          photoNames: {},
          lastPosition: null,
        };
        stored.teams.push(team);
        code.status = "used";
        code.teamId = team.id;
        await writePlayerTeamDataV187(stored);
      }
      return {
        status: 200,
        payload: { ok: true, team, route: externalizeRouteV189(route) },
      };
    });
    sendJson(response, result.status, result.payload);
  } catch (error) {
    sendJson(response, 400, { message: error.message || "Activation impossible." });
  }
  return true;
}

async function handlePlayerSessionV189(request, response) {
  if (request.method !== "POST") {
    sendJson(response, 405, { message: "Methode non autorisee." });
    return true;
  }
  try {
    const body = await readRequestBody(request);
    if (Buffer.byteLength(body, "utf8") > 4096) throw new Error("Requete trop volumineuse.");
    const payload = body ? JSON.parse(body) : {};
    const codeValue = String(payload.code || "").trim().toUpperCase().slice(0, 120);
    const teamId = String(payload.teamId || "").trim().slice(0, 120);
    const stored = await readStoredData();
    if (!stored) {
      sendJson(response, 404, { message: "Donnees serveur absentes." });
      return true;
    }
    const { code, team, route } = findCodeAndTeamV189(stored, codeValue, teamId);
    if (!code || !team || !route || team.id !== teamId || team.code !== code.code) {
      sendJson(response, 403, { message: "Session joueur invalide." });
      return true;
    }
    sendJson(response, 200, { ok: true, team, route: externalizeRouteV189(route) });
  } catch (error) {
    sendJson(response, 400, { message: error.message || "Session joueur impossible." });
  }
  return true;
}

function handlePlayerMediaV189(request, response, pathname) {
  if (request.method !== "GET") {
    sendJson(response, 405, { message: "Methode non autorisee." });
    return true;
  }
  const hash = pathname.slice("/api/player/media/".length);
  if (!/^[a-f0-9]{64}$/.test(hash)) {
    sendJson(response, 404, { message: "Media introuvable." });
    return true;
  }
  const media = playerMediaCacheV189.get(hash);
  if (!media) {
    sendJson(response, 404, { message: "Media expire. Rechargez le parcours." });
    return true;
  }
  response.writeHead(200, {
    "Content-Type": media.mime,
    "Content-Length": media.buffer.length,
    "Cache-Control": "public, max-age=31536000, immutable",
    "X-Content-Type-Options": "nosniff",
  });
  response.end(media.buffer);
  return true;
}


async function handleApi(request, response, pathname) {
  if (pathname === "/api/health") {
    sendJson(response, 200, { ok: true });
    return true;
  }


  if (pathname === "/api/player/review-reminder") {
    if (request.method !== "POST") {
      sendJson(response, 405, { message: "Methode non autorisee." });
      return true;
    }
    try {
      const body = await readRequestBody(request);
      const payload = body ? JSON.parse(body) : {};
      const result = await sendReviewReminderForTeamV171(payload);
      sendJson(response, result.status, result.payload);
    } catch (error) {
      sendJson(response, 400, { message: error.message || "Relance avis impossible." });
    }
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

  if (pathname === "/api/admin/robustness") {
    if (!isAdminRequest(request)) {
      sendJson(response, 401, { message: "Connexion gestion requise." });
      return true;
    }
    if (request.method === "GET") {
      try {
        sendJson(response, 200, await buildAdminRobustnessStatusV167());
      } catch (error) {
        sendJson(response, 500, { message: error.message || "Diagnostic robustesse indisponible." });
      }
      return true;
    }
    if (request.method === "POST") {
      try {
        const body = await readRequestBody(request).catch(() => "{}");
        const payload = body ? JSON.parse(body) : {};
        if (payload.action !== "backup") {
          sendJson(response, 400, { message: "Action robuste inconnue." });
          return true;
        }
        const backup = await withDataMutation(() => createAdminRobustnessBackupV167("manual"));
        sendJson(response, 200, { ok: true, backup, status: await buildAdminRobustnessStatusV167() });
      } catch (error) {
        sendJson(response, 500, { message: error.message || "Sauvegarde robuste impossible." });
      }
      return true;
    }
    sendJson(response, 405, { message: "Methode non autorisee." });
    return true;
  }

  if (pathname === "/api/admin/data-safety") {
    if (!isAdminRequest(request)) {
      sendJson(response, 401, { message: "Connexion gestion requise." });
      return true;
    }
    if (request.method === "GET") {
      sendJson(response, 200, await getDataSafetyStatus());
      return true;
    }
    if (request.method === "POST") {
      try {
        const backup = await withDataMutation(createManualDataBackup);
        const status = await getDataSafetyStatus();
        sendJson(response, 200, { ...status, backup });
      } catch (error) {
        sendJson(response, 500, { message: error.message || "Sauvegarde impossible." });
      }
      return true;
    }
    sendJson(response, 405, { message: "Methode non autorisee." });
    return true;
  }

  if (pathname === "/api/admin/data-safety/download") {
    if (!isAdminRequest(request)) {
      sendJson(response, 401, { message: "Connexion gestion requise." });
      return true;
    }
    if (request.method !== "GET") {
      sendJson(response, 405, { message: "Methode non autorisee." });
      return true;
    }
    try {
      const requestUrl = new URL(request.url, getRequestOrigin(request));
      const backup = await readDataBackupByName(requestUrl.searchParams.get("name"));
      sendDataBackupFile(response, backup);
    } catch (error) {
      sendJson(response, 404, { message: error.message || "Sauvegarde introuvable." });
    }
    return true;
  }

  if (pathname === "/api/admin/data-safety/verify") {
    if (!isAdminRequest(request)) {
      sendJson(response, 401, { message: "Connexion gestion requise." });
      return true;
    }
    if (request.method !== "POST") {
      sendJson(response, 405, { message: "Methode non autorisee." });
      return true;
    }
    try {
      const body = await readRequestBody(request);
      const payload = body ? JSON.parse(body) : {};
      const result = await verifyDataBackupWithoutRestoreV134(payload.name);
      sendJson(response, 200, result);
    } catch (error) {
      sendJson(response, 400, { message: error.message || "Verification impossible." });
    }
    return true;
  }

  if (pathname === "/api/admin/health") {
    if (!isAdminRequest(request)) {
      sendJson(response, 401, { message: "Connexion gestion requise." });
      return true;
    }
    if (request.method !== "GET") {
      sendJson(response, 405, { message: "Methode non autorisee." });
      return true;
    }
    sendJson(response, 200, await buildAdminHealthStatusV136());
    return true;
  }

  if (pathname === "/api/public/maintenance") {
    if (request.method !== "GET") {
      sendJson(response, 405, { message: "Methode non autorisee." });
      return true;
    }
    const settings = await readAdminSettingsV138();
    sendJson(response, 200, settings.maintenance);
    return true;
  }

  if (pathname === "/api/public/site-config") {
    if (request.method !== "GET") { sendJson(response, 405, { message: "Methode non autorisee." }); return true; }
    sendJson(response, 200, await readGrowthSettingsV145());
    return true;
  }

  if (pathname === "/api/admin/business-dashboard") {
    if (!isAdminRequest(request)) {
      sendJson(response, 401, { message: "Connexion gestion requise." });
      return true;
    }
    if (request.method !== "GET") {
      sendJson(response, 405, { message: "Methode non autorisee." });
      return true;
    }
    sendJson(response, 200, await buildBusinessDashboardV143());
    return true;
  }

  if (pathname === "/api/admin/public-settings") {
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
    response.writeHead(200, { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="${csv.filename}"`, "Cache-Control": "no-store" });
    response.end(`\uFEFF${csv.content}\n`);
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
    try {
      sendJson(response, 200, await createLiveStripeTestV145(request));
    } catch (error) {
      if (String(error?.message || '').includes('Confirmation manquante')) {
        sendJson(response, 400, { message: error.message, patch: 'stripe-live-test-status-v146' });
      } else {
        throw error;
      }
    }
    return true;
  }



  if (pathname === "/api/admin/incidents") {
    if (!isAdminRequest(request)) {
      sendJson(response, 401, { message: "Connexion gestion requise." });
      return true;
    }
    if (request.method !== "GET") {
      sendJson(response, 405, { message: "Methode non autorisee." });
      return true;
    }
    sendJson(response, 200, {
      ok: true,
      alertEmailConfigured: Boolean(ADMIN_ALERT_EMAIL_V138 && RESEND_API_KEY && MAIL_FROM),
      alertEmail: ADMIN_ALERT_EMAIL_V138 ? ADMIN_ALERT_EMAIL_V138.replace(/(.{2}).+(@.*)/, "$1***$2") : null,
      incidents: await readAdminIncidentsV138(),
    });
    return true;
  }

  if (pathname === "/api/admin/incidents/resolve") {
    if (!isAdminRequest(request)) {
      sendJson(response, 401, { message: "Connexion gestion requise." });
      return true;
    }
    if (request.method !== "POST") {
      sendJson(response, 405, { message: "Methode non autorisee." });
      return true;
    }
    const body = await readRequestBody(request);
    const payload = body ? JSON.parse(body) : {};
    sendJson(response, 200, { ok: true, incident: await resolveAdminIncidentV138(payload.id) });
    return true;
  }

  if (pathname === "/api/admin/alert-test") {
    if (!isAdminRequest(request)) {
      sendJson(response, 401, { message: "Connexion gestion requise." });
      return true;
    }
    if (request.method !== "POST") {
      sendJson(response, 405, { message: "Methode non autorisee." });
      return true;
    }
    const fakeIncident = { level: "info", label: "Test alerte", detail: "E-mail de test depuis l'admin.", lastSeenAt: Date.now() };
    const result = await sendAdminIncidentEmailV138(fakeIncident, await buildAdminHealthStatusV136()).catch((error) => ({ configured: true, sent: false, error: error.message }));
    sendJson(response, result.sent ? 200 : 400, { ok: Boolean(result.sent), ...result, message: result.sent ? "E-mail envoye." : "E-mail non configure ou non envoye." });
    return true;
  }

  if (pathname === "/api/admin/live-dashboard") {
    if (!isAdminRequest(request)) {
      sendJson(response, 401, { message: "Connexion gestion requise." });
      return true;
    }
    if (request.method !== "GET") {
      sendJson(response, 405, { message: "Methode non autorisee." });
      return true;
    }
    sendJson(response, 200, await buildLiveDashboardV138());
    return true;
  }

  if (pathname === "/api/admin/sales-dashboard") {
    if (!isAdminRequest(request)) {
      sendJson(response, 401, { message: "Connexion gestion requise." });
      return true;
    }
    if (request.method !== "GET") {
      sendJson(response, 405, { message: "Methode non autorisee." });
      return true;
    }
    sendJson(response, 200, await buildSalesDashboardV138());
    return true;
  }

  if (pathname === "/api/admin/maintenance") {
    if (!isAdminRequest(request)) {
      sendJson(response, 401, { message: "Connexion gestion requise." });
      return true;
    }
    if (request.method === "GET") {
      sendJson(response, 200, await readAdminSettingsV138());
      return true;
    }
    if (request.method === "POST") {
      const body = await readRequestBody(request);
      const payload = body ? JSON.parse(body) : {};
      sendJson(response, 200, { ok: true, maintenance: await updateMaintenanceSettingsV138(payload) });
      return true;
    }
    sendJson(response, 405, { message: "Methode non autorisee." });
    return true;
  }

  if (pathname === "/api/admin/seo-dashboard") {
    if (!isAdminRequest(request)) {
      sendJson(response, 401, { message: "Connexion gestion requise." });
      return true;
    }
    if (request.method !== "GET") {
      sendJson(response, 405, { message: "Methode non autorisee." });
      return true;
    }
    sendJson(response, 200, await buildSeoDashboardV138());
    return true;
  }


  if (pathname === "/api/admin/post-deploy-check") {
    if (!isAdminRequest(request)) {
      sendJson(response, 401, { message: "Connexion gestion requise." });
      return true;
    }
    if (request.method !== "GET" && request.method !== "POST") {
      sendJson(response, 405, { message: "Methode non autorisee." });
      return true;
    }
    sendJson(response, 200, await runPostDeployChecksV136());
    return true;
  }

  if (pathname === "/api/admin/player-simulation") {
    if (!isAdminRequest(request)) {
      sendJson(response, 401, { message: "Connexion gestion requise." });
      return true;
    }
    if (request.method !== "GET" && request.method !== "POST") {
      sendJson(response, 405, { message: "Methode non autorisee." });
      return true;
    }
    sendJson(response, 200, await runPlayerSimulationV136());
    return true;
  }



  if (pathname === "/api/admin/data-safety/restore") {
    if (!isAdminRequest(request)) {
      sendJson(response, 401, { message: "Connexion gestion requise." });
      return true;
    }
    if (request.method !== "POST") {
      sendJson(response, 405, { message: "Methode non autorisee." });
      return true;
    }
    try {
      const body = await readRequestBody(request);
      const payload = body ? JSON.parse(body) : {};
      if (payload.confirm !== "RESTAURER") {
        sendJson(response, 400, { message: "Confirmation RESTAURER requise." });
        return true;
      }
      const result = await withDataMutation(() => restoreDataBackupByName(payload.name));
      sendJson(response, 200, result);
    } catch (error) {
      sendJson(response, 500, { message: error.message || "Restauration impossible." });
    }
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

  if (pathname === "/api/player/team-sync") {
    return handlePlayerTeamSyncV187(request, response);
  }

  if (pathname === "/api/admin/team-cleanup") {
    return handleAdminTeamCleanupV196(request, response);
  }

  if (pathname === "/api/public/catalog") return handlePublicCatalogV189(request, response);
  if (pathname === "/api/player/activate") return handlePlayerActivateV189(request, response);
  if (pathname === "/api/player/session") return handlePlayerSessionV189(request, response);
  if (pathname.startsWith("/api/player/media/")) return handlePlayerMediaV189(request, response, pathname);
  if (pathname === "/api/admin/live") return handleAdminLiveV189(request, response);
  if (pathname === "/api/data" && !isAdminRequest(request)) {
    sendJson(response, 401, { message: "Connexion gestion requise." });
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
      const saveResult = await withDataMutation(async () => {
        const stored = await readStoredData();
        const adminWrite = isAdminRequest(request);
        if (isSeedDemoData(payload) && (!stored || !isSeedDemoData(stored))) {
          return { status: 409, payload: { message: "Protection anti-reinitialisation des parcours: sauvegarde refusee." } };
        }
        if (isProtectedRouteCatalogReset(stored, payload)) {
          return { status: 409, payload: { message: "Protection anti-reinitialisation des parcours: sauvegarde refusee." } };
        }
        if (!adminWrite && !stored) {
          return { status: 409, payload: { message: "Initialisation serveur reservee a la gestion." } };
        }
        if (!adminWrite && !isPlayerSafeUpdate(stored, payload)) {
          return { status: 403, payload: { message: "Acces gestion requis." } };
        }
        const nextPayload = adminWrite || !stored ? payload : syncMergePlayerSafeData(stored, payload);
        if (adminWrite) {
          const guard = validateAdminDataPayloadV167(stored, nextPayload, request);
          if (!guard.ok) {
            return { status: 409, payload: { message: guard.issues[0] || "Sauvegarde bloquee par la robustesse admin.", code: "ADMIN_ROBUSTNESS_GUARD_V167", issues: guard.issues, warnings: guard.warnings } };
          }
          await createAdminPreSaveBackupV167(stored, nextPayload);
        }
        await writeStoredData(nextPayload);
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
  const normalized = cleanPath.replace(/\\/g, "/");
  const blockedPrefixes = ["/.git", "/.tmp", "/data", "/backups", "/communication", "/scripts"];
  if (blockedPrefixes.some((prefix) => normalized === prefix || normalized.startsWith(prefix + "/"))) return null;
  const extension = path.extname(normalized).toLowerCase();
  const allowed = new Set([".html", ".css", ".js", ".svg", ".jpg", ".jpeg", ".png", ".webp", ".ico", ".webmanifest", ".xml", ".txt"]);
  if (extension && !allowed.has(extension)) return null;
  const resolved = path.resolve(ROOT_DIR, "." + normalized);
  if (resolved !== ROOT_DIR && !resolved.startsWith(ROOT_DIR + path.sep)) return null;
  return resolved;
}

async function serveStaticFile(response, pathname) {
  const filePath = resolveStaticPath(pathname);
  if (!filePath) {
    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8", "X-Content-Type-Options": "nosniff" });
    response.end("Not found");
    return;
  }
  try {
    const fileStat = await stat(filePath);
    const finalPath = fileStat.isDirectory() ? path.join(filePath, "index.html") : filePath;
    const content = await readFile(finalPath);
    const extension = path.extname(finalPath).toLowerCase();
    const immutable = [".css", ".js", ".svg", ".jpg", ".jpeg", ".png", ".webp", ".ico"].includes(extension);
    response.writeHead(200, {
      "Content-Type": MIME_TYPES[extension] || "application/octet-stream",
      "Content-Length": content.length,
      "Cache-Control": immutable ? "public, max-age=31536000, immutable" : "no-cache",
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "strict-origin-when-cross-origin",
      "Permissions-Policy": "camera=(), microphone=(), geolocation=(self), accelerometer=(self), gyroscope=(self)",
    });
    response.end(content);
  } catch {
    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8", "X-Content-Type-Options": "nosniff" });
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
      const seoHandled = await handleSeoRequest(request, response, requestUrl.pathname);
      if (seoHandled) return;
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
      startDailyDataBackupsV134();
      startAdminHealthMonitorV136();
      startAdminOpsMonitorV138();
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
