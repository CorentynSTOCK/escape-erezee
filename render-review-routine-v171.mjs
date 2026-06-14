import { readFile, writeFile } from 'node:fs/promises';

const VERSION = 171;
const DIRECT_REVIEW_URL = 'https://g.page/r/CfoZCZf_vyxPEBM/review';
const GENERIC_REVIEW_URL = 'https://www.google.com/search?q=Stock+%26+Sevrin+Escape+Games+Erezee+avis';

async function patchTextFile(filePath, patcher) {
  const input = await readFile(filePath, 'utf8');
  const output = patcher(input);
  if (output !== input) await writeFile(filePath, output, 'utf8');
}

async function patchOptional(filePath, patcher) {
  try {
    await patchTextFile(filePath, patcher);
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
}

function bumpAssets(text) {
  let next = text;
  for (let version = 1; version <= VERSION; version += 1) {
    next = next.split(`styles.css?v=${version}`).join(`styles.css?v=${VERSION}`);
    next = next.split(`app.js?v=${version}`).join(`app.js?v=${VERSION}`);
    next = next.split(`seo-pages.css?v=${version}`).join(`seo-pages.css?v=${VERSION}`);
    next = next.split(`escape-erezee-v${version}`).join(`escape-erezee-v${VERSION}`);
  }
  return next;
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

function insertAfterBlock(input, signature, insertion, guard) {
  if (input.includes(guard)) return input;
  const start = input.indexOf(signature);
  if (start < 0) throw new Error(`Patch v${VERSION} introuvable: ${signature}`);
  const end = findBlockEnd(input, start);
  if (end < 0) throw new Error(`Patch v${VERSION} impossible: ${signature}`);
  return `${input.slice(0, end)}\n\n${insertion}${input.slice(end)}`;
}

function insertBefore(input, marker, insertion, guard) {
  if (input.includes(guard)) return input;
  const index = input.indexOf(marker);
  if (index < 0) throw new Error(`Patch v${VERSION} introuvable: ${marker}`);
  return `${input.slice(0, index)}${insertion}\n${input.slice(index)}`;
}

function replaceGenericReviewUrl(text) {
  return text.split(GENERIC_REVIEW_URL).join(DIRECT_REVIEW_URL);
}

const SERVER_HELPERS = String.raw`
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
`;

const SERVER_ENDPOINT = String.raw`
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

`;

function patchServer(server) {
  let next = replaceGenericReviewUrl(bumpAssets(server));
  next = insertAfterBlock(next, 'async function sendConfirmationEmailForCode', `${SERVER_HELPERS}\n`, 'review-routine-v171');
  next = insertBefore(next, '  if (pathname === "/api/admin/session") {', SERVER_ENDPOINT, 'pathname === "/api/player/review-reminder"');
  next = next.replace('reviewUrl: PUBLIC_REVIEW_URL_V143,', 'reviewUrl: PUBLIC_REVIEW_URL_V171,');
  next = next.replace(
    'reviewUrl: compactText(raw.reviewUrl || raw.googleReviewUrl) || PUBLIC_REVIEW_URL_V143,',
    'reviewUrl: normalizeReviewUrlV171(raw.reviewUrl || raw.googleReviewUrl),',
  );
  return next;
}

const APP_PATCH = String.raw`
/* review-routine-ui-v171 */
const REVIEW_URL_FALLBACK_V171 = "https://g.page/r/CfoZCZf_vyxPEBM/review";
const REVIEW_REMINDER_URL_V171 = "/api/player/review-reminder";

function reviewUrlIsDirectV171(url) {
  const text = String(url || "").trim();
  return /^https:\/\/g\.page\/r\/[^/]+\/review/i.test(text)
    || /^https:\/\/search\.google\.com\/local\/writereview\?placeid=/i.test(text)
    || /^https:\/\/maps\.app\.goo\.gl\//i.test(text);
}

function reviewUrlIsDirectV165(url) {
  return reviewUrlIsDirectV171(url);
}

function reviewUrlV171() {
  const candidates = [
    typeof publicGrowthSettingsV145 !== "undefined" ? publicGrowthSettingsV145?.reviewUrl : "",
    typeof publicSiteConfigV143 !== "undefined" ? publicSiteConfigV143?.reviewUrl : "",
    REVIEW_URL_FALLBACK_V171,
  ].map(function (value) { return String(value || "").trim(); }).filter(Boolean);
  return candidates.find(reviewUrlIsDirectV171) || REVIEW_URL_FALLBACK_V171;
}

function reviewHtmlV171(value) {
  if (typeof escapeGrowthV143 === "function") return escapeGrowthV143(value);
  if (typeof escV145 === "function") return escV145(value);
  if (typeof escapeHtml === "function") return escapeHtml(value);
  return String(value == null ? "" : value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function setReviewReminderStatusV171(node, message, tone) {
  if (!node) return;
  node.textContent = message;
  node.dataset.tone = tone || "muted";
}

async function sendReviewReminderV171(team, route, statusNode) {
  if (!team || !route || (team.status !== "won" && team.status !== "lost")) return;
  if (typeof canUseBackend === "function" && !canUseBackend()) return;
  const storageKey = "escape-review-reminder-v171-" + team.id;
  const known = window.localStorage?.getItem(storageKey);
  if (known === "done") {
    setReviewReminderStatusV171(statusNode, "Merci encore pour votre retour. Le bouton Google reste disponible ici.", "ok");
    return;
  }
  if (known === "pending") {
    setReviewReminderStatusV171(statusNode, "Message de remerciement en preparation.", "muted");
    return;
  }
  window.localStorage?.setItem(storageKey, "pending");
  try {
    const response = await fetch(REVIEW_REMINDER_URL_V171, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      credentials: "same-origin",
      cache: "no-store",
      body: JSON.stringify({ teamId: team.id, code: team.code || "" }),
    });
    const payload = await response.json().catch(function () { return {}; });
    if (!response.ok) throw new Error(payload.message || "Relance avis indisponible.");
    if (payload.sent || payload.alreadySent) {
      window.localStorage?.setItem(storageKey, "done");
      setReviewReminderStatusV171(statusNode, "Un petit message de remerciement a aussi ete envoye par e-mail.", "ok");
      return;
    }
    window.localStorage?.setItem(storageKey, "done");
    if (payload.reason === "missing_email") {
      setReviewReminderStatusV171(statusNode, "Nous n'avons pas d'e-mail de reservation pour cette equipe. Le bouton Google est disponible ici.", "muted");
    } else if (payload.reason === "not_finished") {
      window.localStorage?.removeItem(storageKey);
      setReviewReminderStatusV171(statusNode, "La relance e-mail se declenchera quand la partie sera terminee.", "muted");
    } else {
      setReviewReminderStatusV171(statusNode, "Merci encore pour votre retour. Le bouton Google reste disponible ici.", "muted");
    }
  } catch {
    window.localStorage?.removeItem(storageKey);
    setReviewReminderStatusV171(statusNode, "Le bouton Google Avis reste disponible ici. La relance e-mail sera retentee plus tard.", "muted");
  }
}

function renderFinishReviewRoutineV171(team, route) {
  if (!els.finishPanel || !team || !route) return;
  let block = els.finishPanel.querySelector("#finish-experience-v143");
  if (!block) {
    block = document.createElement("div");
    block.id = "finish-experience-v143";
    els.finishPanel.appendChild(block);
  }
  block.className = "finish-experience-v143 finish-review-v165 finish-review-v171";
  const reviewUrl = reviewUrlV171();
  const hasWon = team.status === "won";
  block.innerHTML = [
    '<div class="finish-review-card-v165 finish-thanks-v171">',
      '<p class="section-label">Merci</p>',
      '<h3>' + (hasWon ? 'Bravo, aventure terminee !' : "Merci d'avoir joue") + '</h3>',
      '<p>Votre avis aide les prochaines equipes a choisir leur parcours, et nous aide a ameliorer les aventures.</p>',
      '<div class="finish-actions-v143 finish-review-actions-v171">',
        '<a class="primary-button" target="_blank" rel="noopener" href="' + reviewHtmlV171(reviewUrl) + '">Laisser un avis Google</a>',
        '<button class="secondary-button" type="button" id="souvenir-photo-v143">Photo souvenir</button>',
        '<a class="secondary-button" href="#shop">Decouvrir un autre parcours</a>',
      '</div>',
      '<p class="finish-review-email-v171" id="finish-review-email-v171">Si votre e-mail de reservation est disponible, nous vous envoyons aussi un petit message de remerciement.</p>',
    '</div>',
  ].join("");
  block.querySelector("#souvenir-photo-v143")?.addEventListener("click", function () {
    if (typeof createSouvenirImageV143 === "function") createSouvenirImageV143(team, route);
  });
  sendReviewReminderV171(team, route, block.querySelector("#finish-review-email-v171"));
}

addFinishExperienceV143 = function addFinishExperienceV171(team, route) {
  renderFinishReviewRoutineV171(team, route);
};

if (typeof renderReviewsV145 === "function" && !window.__reviewRoutineReviewsV171) {
  window.__reviewRoutineReviewsV171 = true;
  const previousRenderReviewsV171 = renderReviewsV145;
  renderReviewsV145 = function renderReviewsWithDirectUrlV171() {
    const result = previousRenderReviewsV171.apply(this, arguments);
    document.querySelectorAll('.reviews-cta-v165 a, #customer-reviews-v143 a[href*="google"], #customer-reviews-v143 a[href*="g.page"]').forEach(function (link) {
      link.href = reviewUrlV171();
    });
    return result;
  };
}

if (typeof renderFinishPanel === "function" && !window.__reviewRoutineFinishWrapV171) {
  window.__reviewRoutineFinishWrapV171 = true;
  const previousRenderFinishPanelV171 = renderFinishPanel;
  renderFinishPanel = function renderFinishPanelWithReviewRoutineV171(team, route) {
    const result = previousRenderFinishPanelV171.apply(this, arguments);
    renderFinishReviewRoutineV171(team, route);
    return result;
  };
}
`;

function patchApp(app) {
  let next = replaceGenericReviewUrl(bumpAssets(app));
  if (!next.includes('review-routine-ui-v171')) next = `${next.trimEnd()}\n${APP_PATCH}\n`;
  return next;
}

function patchStyles(css) {
  let next = bumpAssets(css);
  if (next.includes('review-routine-ui-v171')) return next;
  return `${next.trimEnd()}

/* review-routine-ui-v171 */
.finish-review-v171 {
  margin-top: 16px;
}

.finish-thanks-v171 {
  border-color: rgba(217, 150, 31, 0.32);
  background: linear-gradient(180deg, rgba(255, 252, 244, 0.96), rgba(255, 255, 255, 0.94));
}

.finish-review-actions-v171 {
  align-items: center;
}

.finish-review-email-v171 {
  margin: 0;
  color: var(--muted);
  font-size: 0.92rem;
  line-height: 1.45;
}

.finish-review-email-v171[data-tone="ok"] {
  color: #1f6a58;
  font-weight: 800;
}

@media (max-width: 680px) {
  .finish-review-actions-v171 {
    display: grid;
  }

  .finish-review-actions-v171 .primary-button,
  .finish-review-actions-v171 .secondary-button {
    width: 100%;
    justify-content: center;
  }
}
`;
}

function patchPackageJson(packageJson) {
  const parsed = JSON.parse(packageJson);
  const start = parsed.scripts?.start || '';
  if (!start.includes('render-review-routine-v171.mjs')) {
    parsed.scripts.start = start.replace(
      'node render-admin-i18n-workspace-v170.mjs && node server.mjs',
      'node render-admin-i18n-workspace-v170.mjs && node render-review-routine-v171.mjs && node server.mjs',
    );
  }
  return `${JSON.stringify(parsed, null, 2)}\n`;
}

await patchTextFile('server.mjs', patchServer);
await patchTextFile('app.js', patchApp);
await patchTextFile('styles.css', patchStyles);
await patchTextFile('index.html', bumpAssets);
await patchOptional('suivi.html', bumpAssets);
await patchOptional('seo-pages.css', bumpAssets);
await patchTextFile('service-worker.js', bumpAssets);
await patchTextFile('package.json', patchPackageJson);

console.log(`Review routine v${VERSION} applied.`);
