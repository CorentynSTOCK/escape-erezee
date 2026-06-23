import { readFile, writeFile } from "node:fs/promises";

const VERSION = 185;
const scriptBaseUrl = new URL("./", import.meta.url);

async function patchFile(filePath, patcher) {
  const fileUrl = new URL(filePath, scriptBaseUrl);
  const input = await readFile(fileUrl, "utf8");
  const output = patcher(input);
  if (output !== input) await writeFile(fileUrl, output, "utf8");
}

function patchIndex(html) {
  return html
    .replace(/styles\.css\?v=\d+/g, `styles.css?v=${VERSION}`)
    .replace(/app\.js\?v=\d+/g, `app.js?v=${VERSION}`);
}

function patchApp(app) {
  const marker = `/* player-orientation-permission-v${VERSION} */`;
  if (app.includes(marker)) return app;

  let next = app;

  next = next.replace(
    /function handlePlayerOrientationV183\(event\) \{[\s\S]*?\n\}\n\nasync function enablePlayerCompassV183/,
    `function handlePlayerOrientationV183(event) {
  const webkitHeading = Number(event?.webkitCompassHeading);
  const alpha = Number(event?.alpha);
  const heading = Number.isFinite(webkitHeading)
    ? webkitHeading
    : Number.isFinite(alpha)
      ? normalizeGuidanceAngleV183(360 - alpha)
      : null;
  if (!Number.isFinite(heading)) return;
  playerCompassHeadingV183 = heading;
  playerCompassPermissionStateV185 = "granted";
  const now = Date.now();
  const paintInterval = playerNavigationActiveV183 ? 120 : 350;
  if (now - playerLastHeadingPaintAtV184 < paintInterval) return;
  if (Number.isFinite(playerLastPaintedHeadingV184)) {
    const delta = Math.abs(normalizeGuidanceAngleV183(heading - playerLastPaintedHeadingV184 + 180) - 180);
    if (delta < 2 && now - playerLastHeadingPaintAtV184 < 700) return;
  }
  playerLastHeadingPaintAtV184 = now;
  playerLastPaintedHeadingV184 = heading;
  updatePlayerGuidanceArrowHeadingV185(heading);
  if (playerNavigationActiveV183) {
    applyPlayerMapHeadingV184(heading);
  }
}

async function enablePlayerCompassV183`,
  );

  next = next.replace(
    /async function enablePlayerCompassV183\(\) \{[\s\S]*?\n\}\n\nasync function requestPlayerWakeLockV183/,
    `async function enablePlayerCompassV183() {
  if (playerCompassBoundV183) return;
  try {
    const orientation = window.DeviceOrientationEvent;
    if (!orientation) {
      playerCompassPermissionStateV185 = "unsupported";
      return;
    }
    if (typeof orientation.requestPermission === "function" && playerCompassPermissionStateV185 !== "granted") {
      const permission = await orientation.requestPermission();
      playerCompassPermissionStateV185 = permission === "granted" ? "granted" : "denied";
      if (permission !== "granted") {
        updatePlayerOrientationPermissionNoticeV185("denied");
        return;
      }
    }
    window.addEventListener("deviceorientationabsolute", handlePlayerOrientationV183, true);
    window.addEventListener("deviceorientation", handlePlayerOrientationV183, true);
    playerCompassBoundV183 = true;
    playerCompassPermissionStateV185 = "granted";
    updatePlayerOrientationPermissionNoticeV185("granted");
  } catch (error) {
    playerCompassPermissionStateV185 = "unsupported";
    console.info("Boussole non disponible, guidage cardinal conserve.", error);
  }
}

async function requestPlayerWakeLockV183`,
  );

  next = next.replace(
    /function locatePlayer\(\) \{[\s\S]*?\n\}\s*\nfunction distanceInMeters/,
    `function locatePlayer() {
  const team = getCurrentTeam();
  if (!team) return;
  const route = getRoute(team.routeId);
  const puzzle = getCurrentPuzzle(team, route);
  if (!puzzle.requireLocation) {
    els.distanceNote.textContent = "Cette enigme est deja accessible.";
    requestPlayerOrientationPermissionV185({ showNotice: true });
    return;
  }

  if (!navigator.geolocation) {
    els.distanceNote.textContent = "La geolocalisation n'est pas disponible sur cet appareil.";
    requestPlayerOrientationPermissionV185({ showNotice: true });
    return;
  }

  requestPlayerOrientationPermissionV185({ showNotice: true });

  if (geolocationWatchId !== null && geolocationWatchPuzzleId === puzzle.id) {
    els.distanceNote.textContent = "Suivi GPS deja actif. La carte et la fleche se mettent a jour automatiquement.";
    return;
  }

  stopGeolocationWatch();
  els.distanceNote.textContent = "Suivi GPS active. Si le telephone le demande, autorisez aussi mouvement et orientation pour que la fleche suive la boussole.";
  geolocationWatchPuzzleId = puzzle.id;
  geolocationWatchId = navigator.geolocation.watchPosition(
    handleGeolocationPosition,
    handleGeolocationError,
    { enableHighAccuracy: true, maximumAge: 1000, timeout: 15000 },
  );
}

function distanceInMeters`,
  );

  if (next.includes("function locateBriefingStart() {") && !next.includes("requestPlayerOrientationPermissionV185({ showNotice: true, briefing: true });")) {
    next = next.replace(
      "  stopGeolocationWatch();\n  updateBriefingLocationUi(team, route, {\n    kind: \"active\",\n    text: \"Recherche de votre position au point de depart...\",\n  });",
      "  requestPlayerOrientationPermissionV185({ showNotice: true, briefing: true });\n  stopGeolocationWatch();\n  updateBriefingLocationUi(team, route, {\n    kind: \"active\",\n    text: \"Recherche de votre position au point de depart...\",\n  });",
    );
  }

  const helpers = `${marker}
let playerCompassPermissionStateV185 = "unknown";
let playerCompassPermissionRequestV185 = null;

function playerOrientationPermissionLabelsV185() {
  const labels = {
    fr: {
      asking: "Autorisez aussi mouvement et orientation pour que la fleche suive la boussole.",
      granted: "Boussole active : la fleche suit maintenant la direction du telephone.",
      denied: "Boussole refusee : la fleche reste en direction generale. Vous pouvez l'autoriser dans les reglages du navigateur.",
      unsupported: "Boussole indisponible sur cet appareil : la fleche garde la direction generale.",
    },
    en: {
      asking: "Also allow motion and orientation so the arrow can follow the phone compass.",
      granted: "Compass active: the arrow now follows your phone direction.",
      denied: "Compass denied: the arrow keeps the general direction. You can allow it in browser settings.",
      unsupported: "Compass unavailable on this device: the arrow keeps the general direction.",
    },
    nl: {
      asking: "Sta ook beweging en orientatie toe zodat de pijl het kompas van je telefoon kan volgen.",
      granted: "Kompas actief: de pijl volgt nu de richting van je telefoon.",
      denied: "Kompas geweigerd: de pijl blijft de algemene richting tonen. Je kunt dit toestaan in de browserinstellingen.",
      unsupported: "Kompas niet beschikbaar op dit toestel: de pijl blijft de algemene richting tonen.",
    },
  };
  const language = typeof playerMapLanguageV182 === "function" ? playerMapLanguageV182() : "fr";
  return labels[language] || labels.fr;
}

function updatePlayerOrientationPermissionNoticeV185(kind, options = {}) {
  const labels = playerOrientationPermissionLabelsV185();
  const message = labels[kind] || "";
  if (!message) return;
  if (options.briefing && typeof updateBriefingLocationUi === "function") {
    const team = getCurrentTeam();
    const route = team ? getRoute(team.routeId) : null;
    updateBriefingLocationUi(team, route, { kind: kind === "denied" || kind === "unsupported" ? "blocked" : "active", text: message });
    return;
  }
  const signal = document.querySelector("#player-navigation-signal");
  if (signal && (kind === "denied" || kind === "unsupported" || kind === "granted")) {
    signal.textContent = message;
    signal.classList.remove("is-good", "is-weak", "is-stale");
    signal.classList.add(kind === "granted" ? "is-good" : "is-weak");
  }
}

function updatePlayerGuidanceArrowHeadingV185(heading) {
  if (!playerGuidanceContextV183) return;
  const [, , target, playerPosition] = playerGuidanceContextV183;
  const arrow = document.querySelector("#player-navigation-arrow");
  if (!arrow || !isUsablePosition(target) || !isUsablePosition(playerPosition)) return;
  const bearing = playerMapBearingV182(playerPosition, target);
  arrow.style.setProperty("--player-guidance-rotation", normalizeGuidanceAngleV183(bearing - normalizeGuidanceAngleV183(heading)) + "deg");
  const labels = typeof playerGuidanceLabelsV183 === "function" ? playerGuidanceLabelsV183() : null;
  const directionNode = document.querySelector("#player-navigation-direction");
  if (directionNode && labels?.compass) {
    directionNode.textContent = labels.compass;
  }
}

function requestPlayerOrientationPermissionV185(options = {}) {
  if (playerCompassBoundV183 || playerCompassPermissionStateV185 === "granted") {
    updatePlayerOrientationPermissionNoticeV185("granted", options);
    return Promise.resolve(true);
  }
  if (playerCompassPermissionRequestV185) return playerCompassPermissionRequestV185;

  if (options.showNotice) {
    updatePlayerOrientationPermissionNoticeV185("asking", options);
  }

  playerCompassPermissionRequestV185 = (async () => {
    const orientation = window.DeviceOrientationEvent;
    if (!orientation) {
      playerCompassPermissionStateV185 = "unsupported";
      updatePlayerOrientationPermissionNoticeV185("unsupported", options);
      return false;
    }
    try {
      if (typeof orientation.requestPermission === "function") {
        const permission = await orientation.requestPermission();
        playerCompassPermissionStateV185 = permission === "granted" ? "granted" : "denied";
        if (permission !== "granted") {
          updatePlayerOrientationPermissionNoticeV185("denied", options);
          return false;
        }
      } else {
        playerCompassPermissionStateV185 = "granted";
      }
      await enablePlayerCompassV183();
      const isReady = playerCompassPermissionStateV185 === "granted" || playerCompassBoundV183;
      updatePlayerOrientationPermissionNoticeV185(isReady ? "granted" : playerCompassPermissionStateV185, options);
      return isReady;
    } catch (error) {
      playerCompassPermissionStateV185 = "unsupported";
      console.info("Autorisation orientation indisponible.", error);
      updatePlayerOrientationPermissionNoticeV185("unsupported", options);
      return false;
    } finally {
      playerCompassPermissionRequestV185 = null;
    }
  })();

  return playerCompassPermissionRequestV185;
}
`;

  next = next.replace("\nfunction renderPuzzleMedia(puzzle, unlocked) {", `\n${helpers}\nfunction renderPuzzleMedia(puzzle, unlocked) {`);
  return next;
}

await patchFile("index.html", patchIndex);
await patchFile("app.js", patchApp);
await patchFile("service-worker.js", (worker) => worker.replace(/escape-erezee-v\d+/g, `escape-erezee-v${VERSION}`));

console.log(`Player orientation permission v${VERSION} applied.`);
