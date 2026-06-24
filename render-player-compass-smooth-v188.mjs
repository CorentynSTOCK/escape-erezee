import { readFile, writeFile } from "node:fs/promises";

const VERSION = 188;
const scriptBaseUrl = new URL("./", import.meta.url);

async function patchFile(filePath, patcher) {
  const fileUrl = new URL(filePath, scriptBaseUrl);
  const input = await readFile(fileUrl, "utf8");
  const output = patcher(input);
  if (output !== input) await writeFile(fileUrl, output, "utf8");
}

function findFunctionEnd(input, start) {
  const parametersEnd = input.indexOf(")", start);
  const bodyStart = input.indexOf("{", parametersEnd >= 0 ? parametersEnd : start);
  if (bodyStart < 0) return -1;
  let depth = 0;
  let quote = null;
  let escaped = false;
  for (let index = bodyStart; index < input.length; index += 1) {
    const char = input[index];
    if (quote) {
      if (escaped) escaped = false;
      else if (char === "\\") escaped = true;
      else if (char === quote) quote = null;
      continue;
    }
    if (char === '"' || char === "'" || char === "`") {
      quote = char;
      continue;
    }
    if (char === "{") depth += 1;
    if (char === "}") {
      depth -= 1;
      if (depth === 0) return index + 1;
    }
  }
  return -1;
}

function replaceFunction(input, signature, replacement) {
  const start = input.indexOf(signature);
  if (start < 0) throw new Error(`Patch v${VERSION} introuvable: ${signature}`);
  const end = findFunctionEnd(input, start);
  if (end < 0) throw new Error(`Patch v${VERSION} impossible: ${signature}`);
  return input.slice(0, start) + replacement + input.slice(end);
}

function patchIndex(html) {
  return html
    .replace(/styles\.css\?v=\d+/g, `styles.css?v=${VERSION}`)
    .replace(/app\.js\?v=\d+/g, `app.js?v=${VERSION}`);
}

function patchApp(app) {
  const marker = `/* player-compass-smooth-v${VERSION} */`;
  if (app.includes(marker)) return app;

  let next = app;
  const helpers = `${marker}
const PLAYER_COMPASS_ACTIVE_INTERVAL_V188 = 250;
const PLAYER_COMPASS_IDLE_INTERVAL_V188 = 60000;
let playerPendingHeadingV188 = null;
let playerCompassPaintTimerV188 = null;
let playerCompassLastAppliedAtV188 = 0;
let playerCompassSmoothedHeadingV188 = null;
let playerMapContinuousHeadingV188 = null;
let playerLastAbsoluteHeadingAtV188 = 0;

function playerScreenAngleV188() {
  const orientationAngle = Number(window.screen?.orientation?.angle);
  if (Number.isFinite(orientationAngle)) return orientationAngle;
  const legacyAngle = Number(window.orientation);
  return Number.isFinite(legacyAngle) ? legacyAngle : 0;
}

function playerEventHeadingV188(event) {
  const webkitHeading = Number(event?.webkitCompassHeading);
  if (Number.isFinite(webkitHeading) && webkitHeading >= 0) {
    playerLastAbsoluteHeadingAtV188 = Date.now();
    return normalizeGuidanceAngleV183(webkitHeading);
  }
  const alpha = Number(event?.alpha);
  if (!Number.isFinite(alpha)) return null;
  const isAbsolute = event?.absolute === true || event?.type === "deviceorientationabsolute";
  if (isAbsolute) playerLastAbsoluteHeadingAtV188 = Date.now();
  else if (Date.now() - playerLastAbsoluteHeadingAtV188 < 1500) return null;
  return normalizeGuidanceAngleV183(360 - alpha + playerScreenAngleV188());
}

function playerShortestHeadingDeltaV188(from, to) {
  return normalizeGuidanceAngleV183(to - from + 180) - 180;
}

function playerApplyPendingHeadingV188() {
  playerCompassPaintTimerV188 = null;
  const heading = Number(playerPendingHeadingV188);
  if (!Number.isFinite(heading) || document.visibilityState === "hidden") return;
  playerPendingHeadingV188 = null;

  if (!Number.isFinite(playerCompassSmoothedHeadingV188)) {
    playerCompassSmoothedHeadingV188 = heading;
  } else {
    const delta = playerShortestHeadingDeltaV188(playerCompassSmoothedHeadingV188, heading);
    const smoothing = playerNavigationActiveV183 ? 0.68 : 0.5;
    playerCompassSmoothedHeadingV188 = normalizeGuidanceAngleV183(
      playerCompassSmoothedHeadingV188 + delta * smoothing,
    );
  }

  const paintedHeading = playerCompassSmoothedHeadingV188;
  const minimumDelta = playerNavigationActiveV183 ? 1.2 : 3;
  if (Number.isFinite(playerLastPaintedHeadingV184)) {
    const paintedDelta = Math.abs(playerShortestHeadingDeltaV188(playerLastPaintedHeadingV184, paintedHeading));
    if (paintedDelta < minimumDelta && Date.now() - playerCompassLastAppliedAtV188 < 900) return;
  }

  playerCompassLastAppliedAtV188 = Date.now();
  playerLastHeadingPaintAtV184 = playerCompassLastAppliedAtV188;
  playerLastPaintedHeadingV184 = paintedHeading;
  playerCompassHeadingV183 = paintedHeading;
  updatePlayerGuidanceArrowHeadingV185(paintedHeading);
  if (playerNavigationActiveV183) applyPlayerMapHeadingV184(paintedHeading);
}

function playerScheduleHeadingPaintV188(heading) {
  playerPendingHeadingV188 = heading;
  if (playerCompassPaintTimerV188 !== null) return;
  const interval = playerNavigationActiveV183
    ? PLAYER_COMPASS_ACTIVE_INTERVAL_V188
    : PLAYER_COMPASS_IDLE_INTERVAL_V188;
  const delay = Math.max(0, interval - (Date.now() - playerCompassLastAppliedAtV188));
  playerCompassPaintTimerV188 = window.setTimeout(() => {
    window.requestAnimationFrame(playerApplyPendingHeadingV188);
  }, delay);
}

function playerResetCompassSmoothingV188() {
  playerCompassSmoothedHeadingV188 = Number.isFinite(playerCompassHeadingV183)
    ? playerCompassHeadingV183
    : null;
  playerPendingHeadingV188 = null;
  if (playerCompassPaintTimerV188 !== null) {
    window.clearTimeout(playerCompassPaintTimerV188);
    playerCompassPaintTimerV188 = null;
  }
}

function playerContinuousMapHeadingV188(heading) {
  const normalized = normalizeGuidanceAngleV183(heading);
  if (!Number.isFinite(playerMapContinuousHeadingV188)) {
    playerMapContinuousHeadingV188 = normalized;
    return playerMapContinuousHeadingV188;
  }
  playerMapContinuousHeadingV188 += playerShortestHeadingDeltaV188(
    normalizeGuidanceAngleV183(playerMapContinuousHeadingV188),
    normalized,
  );
  return playerMapContinuousHeadingV188;
}
`;

  next = next.replace("\nfunction handlePlayerOrientationV183(event)", `\n${helpers}\nfunction handlePlayerOrientationV183(event)`);

  next = replaceFunction(next, "function handlePlayerOrientationV183(event)", `function handlePlayerOrientationV183(event) {
  if (document.visibilityState === "hidden") return;
  const heading = playerEventHeadingV188(event);
  if (!Number.isFinite(heading)) return;
  playerCompassPermissionStateV185 = "granted";
  playerScheduleHeadingPaintV188(heading);
}`);

  next = replaceFunction(next, "function applyPlayerMapHeadingV184(heading)", `function applyPlayerMapHeadingV184(heading) {
  const map = document.querySelector("#player-map");
  if (!map || !Number.isFinite(Number(heading))) return;
  const normalized = normalizeGuidanceAngleV183(heading);
  const continuous = playerContinuousMapHeadingV188(normalized);
  map.classList.add("is-heading-up");
  map.style.setProperty("--player-map-rotation", (-continuous) + "deg");
  map.style.setProperty("--player-map-counter-rotation", continuous + "deg");
  if (playerGuidanceContextV183) {
    const [, , target, playerPosition] = playerGuidanceContextV183;
    if (isUsablePosition(target) && isUsablePosition(playerPosition)) {
      const bearing = playerMapBearingV182(playerPosition, target);
      document.querySelector("#player-navigation-arrow")?.style.setProperty(
        "--player-guidance-rotation",
        normalizeGuidanceAngleV183(bearing - normalized) + "deg",
      );
    }
  }
}`);

  next = replaceFunction(next, "function resetPlayerMapHeadingV184()", `function resetPlayerMapHeadingV184() {
  const map = document.querySelector("#player-map");
  if (!map) return;
  map.classList.remove("is-heading-up");
  map.style.removeProperty("--player-map-rotation");
  map.style.removeProperty("--player-map-counter-rotation");
  playerLastPaintedHeadingV184 = null;
  playerMapContinuousHeadingV188 = null;
}`);

  next = next.replace(
    '  playerNavigationActiveV183 = true;\n  if (Number.isFinite(playerCompassHeadingV183)) applyPlayerMapHeadingV184(playerCompassHeadingV183);',
    '  playerNavigationActiveV183 = true;\n  playerResetCompassSmoothingV188();\n  if (Number.isFinite(playerCompassHeadingV183)) applyPlayerMapHeadingV184(playerCompassHeadingV183);',
  );
  next = next.replace(
    '  playerNavigationActiveV183 = false;\n  resetPlayerMapHeadingV184();',
    '  playerNavigationActiveV183 = false;\n  playerResetCompassSmoothingV188();\n  resetPlayerMapHeadingV184();',
  );

  return next;
}

function patchStyles(css) {
  const marker = `/* player-compass-smooth-v${VERSION} */`;
  if (css.includes(marker)) return css;
  return `${css.trimEnd()}

${marker}
#player-map.is-heading-up .map-tiles,
#player-map.is-heading-up .map-layer,
.player-map-north {
  transition-duration: 190ms;
  transition-timing-function: linear;
}

#player-map.is-heading-up .map-tiles,
#player-map.is-heading-up .map-layer {
  backface-visibility: hidden;
}
`;
}

await patchFile("index.html", patchIndex);
await patchFile("app.js", patchApp);
await patchFile("styles.css", patchStyles);
await patchFile("service-worker.js", (worker) => worker.replace(/escape-erezee-v\d+/g, `escape-erezee-v${VERSION}`));

console.log(`Player compass smooth v${VERSION} applied.`);
