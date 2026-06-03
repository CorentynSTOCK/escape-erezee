import { readFile, writeFile } from "node:fs/promises";

const VERSION = 100;
const scriptBaseUrl = new URL("./", import.meta.url);

async function patchTextFile(filePath, patcher) {
  const fileUrl = new URL(filePath, scriptBaseUrl);
  const input = await readFile(fileUrl, "utf8");
  const output = patcher(input);
  if (output !== input) await writeFile(fileUrl, output, "utf8");
}

function bumpAssetVersions(text) {
  return text
    .replace(/styles\.css\?v=\d+/g, `styles.css?v=${VERSION}`)
    .replace(/app\.js\?v=\d+/g, `app.js?v=${VERSION}`);
}

function patchIndex(html) {
  let next = bumpAssetVersions(html);

  if (!next.includes('id="player-sync-panel"')) {
    const briefingMarker = `              <section class="briefing-panel is-hidden" id="briefing-panel"`;
    if (!next.includes(briefingMarker)) throw new Error("player briefing marker not found");
    next = next.replace(
      briefingMarker,
      `              <section class="player-sync-panel is-hidden" id="player-sync-panel" role="status" aria-live="polite">
                <div class="player-sync-copy">
                  <span class="player-sync-kicker">&Eacute;tat du jeu</span>
                  <strong id="player-sync-title">Synchronisation</strong>
                  <p id="player-sync-text">Connexion et position en attente.</p>
                </div>
                <button class="secondary-button compact-button" type="button" id="force-player-sync-button">Resynchroniser</button>
              </section>

${briefingMarker}`,
    );
  }

  return next;
}

const playerSyncHelpers = `
const PLAYER_SYNC_WARN_MS = 120000;
const PLAYER_SYNC_DANGER_MS = 300000;

function formatPlayerSyncRelativeTime(timestamp) {
  if (!timestamp) return "jamais";
  const elapsed = Math.max(0, Date.now() - Number(timestamp));
  if (elapsed < 10000) return "a l'instant";
  if (elapsed < 60000) return \`il y a \${Math.round(elapsed / 1000)} s\`;
  if (elapsed < 3600000) return \`il y a \${Math.round(elapsed / 60000)} min\`;
  return \`il y a \${Math.round(elapsed / 3600000)} h\`;
}

function getPlayerSyncStatus(team, route) {
  if (!team) {
    return {
      tone: "is-warn",
      title: "Synchronisation",
      text: "Connexion et position en attente.",
    };
  }

  if (!canUseBackend()) {
    return {
      tone: "is-danger",
      title: "Mode local",
      text: "Le serveur n'est pas disponible sur cette adresse. Gardez cette page ouverte.",
    };
  }

  const lastPositionAt = Number(team.lastPosition?.at) || 0;
  const positionAge = lastPositionAt ? Date.now() - lastPositionAt : Number.POSITIVE_INFINITY;
  const lastContactLabel = lastPlayerServerContactAt
    ? \`Serveur contacte \${formatPlayerSyncRelativeTime(lastPlayerServerContactAt)}.\`
    : "Contact serveur en attente.";

  if (!serverSyncEnabled && lastPlayerServerErrorAt) {
    return {
      tone: "is-danger",
      title: "Serveur en attente",
      text: "Nouvel essai automatique en cours. Appuyez sur Resynchroniser si l'ecran semble fige.",
    };
  }

  if (team.status === "briefing") {
    const startState = route ? getBriefingStartState(team, route) : { allowed: false };
    return startState.allowed
      ? {
          tone: "is-ok",
          title: "Depart valide",
          text: \`Position de depart confirmee. \${lastContactLabel}\`,
        }
      : {
          tone: "is-warn",
          title: "GPS a confirmer",
          text: "Localisez-vous au point de depart avant de lancer l'aventure.",
        };
  }

  if (team.status === "won" || team.status === "lost") {
    return {
      tone: "is-ok",
      title: "Partie terminee",
      text: \`Resultat conserve. \${lastContactLabel}\`,
    };
  }

  if (lastPlayerGpsErrorAt && (!lastPositionAt || lastPlayerGpsErrorAt > lastPositionAt)) {
    return {
      tone: "is-warn",
      title: "GPS a verifier",
      text: "Autorisez la localisation puis relancez le suivi si la carte ne bouge plus.",
    };
  }

  if (!lastPositionAt) {
    return {
      tone: "is-warn",
      title: "Position en attente",
      text: "Activez le suivi GPS pour envoyer l'avancee a la gestion.",
    };
  }

  if (positionAge > PLAYER_SYNC_DANGER_MS) {
    return {
      tone: "is-danger",
      title: "Position figee",
      text: \`Derniere position recue \${formatPlayerSyncRelativeTime(lastPositionAt)}. Appuyez sur Resynchroniser.\`,
    };
  }

  if (positionAge > PLAYER_SYNC_WARN_MS) {
    return {
      tone: "is-warn",
      title: "Position peu recente",
      text: \`Derniere position recue \${formatPlayerSyncRelativeTime(lastPositionAt)}. Le suivi va se relancer.\`,
    };
  }

  return {
    tone: "is-ok",
    title: "Suivi actif",
    text: \`Position envoyee \${formatPlayerSyncRelativeTime(lastPositionAt)}. \${lastContactLabel}\`,
  };
}

function renderPlayerSyncPanel(team, route = team ? getRoute(team.routeId) : null) {
  if (!els.playerSyncPanel) return;
  els.playerSyncPanel.classList.toggle("is-hidden", !team);
  if (!team) return;

  const status = getPlayerSyncStatus(team, route);
  els.playerSyncPanel.classList.remove("is-ok", "is-warn", "is-danger");
  els.playerSyncPanel.classList.add(status.tone);
  if (els.playerSyncTitle) els.playerSyncTitle.textContent = status.title;
  if (els.playerSyncText) els.playerSyncText.textContent = status.text;
  if (els.forcePlayerSyncButton) {
    els.forcePlayerSyncButton.disabled = serverSaveInFlight || playerPositionRefreshInFlight;
  }
}

async function forcePlayerSync() {
  const team = getCurrentTeam();
  if (!team) return;

  const route = getRoute(team.routeId);
  if (els.forcePlayerSyncButton) els.forcePlayerSyncButton.disabled = true;
  showToast("Synchronisation en cours...");

  try {
    await refreshPlayerRoutesFromServer({ force: true });
    const refreshedTeam = getCurrentTeam() || team;
    const refreshedRoute = getRoute(refreshedTeam.routeId) || route;
    if (refreshedTeam.status === "briefing") {
      locateBriefingStart();
    } else if (refreshedTeam.status === "playing") {
      requestPlayerPositionRefresh(true);
    }
    saveData({ immediate: true });
    renderPlayerSyncPanel(refreshedTeam, refreshedRoute);
  } finally {
    window.setTimeout(() => renderPlayerSyncPanel(getCurrentTeam()), 800);
  }
}
`;

function patchApp(js) {
  let next = js;

  if (!next.includes("playerSyncPanel:")) {
    const marker = `  teamNameForm: $("#team-name-form"),
  teamNameInput: $("#team-name-input"),`;
    if (!next.includes(marker)) throw new Error("player selectors marker not found");
    next = next.replace(
      marker,
      `  teamNameForm: $("#team-name-form"),
  playerSyncPanel: $("#player-sync-panel"),
  playerSyncTitle: $("#player-sync-title"),
  playerSyncText: $("#player-sync-text"),
  forcePlayerSyncButton: $("#force-player-sync-button"),
  teamNameInput: $("#team-name-input"),`,
    );
  }

  if (!next.includes("lastPlayerServerContactAt")) {
    const marker = `let playerPositionRefreshInFlight = false;
let briefingGeolocationWatchId = null;`;
    if (!next.includes(marker)) throw new Error("player sync vars marker not found");
    next = next.replace(
      marker,
      `let playerPositionRefreshInFlight = false;
let lastPlayerServerContactAt = 0;
let lastPlayerServerErrorAt = 0;
let lastPlayerGpsErrorAt = 0;
let briefingGeolocationWatchId = null;`,
    );
  }

  if (!next.includes("lastPlayerServerContactAt = Date.now();\n    lastPlayerServerErrorAt = 0;\n    const localTeamId")) {
    const marker = `    const localTeamId = localStorage.getItem(SESSION_KEY);`;
    if (!next.includes(marker)) throw new Error("initial server contact marker not found");
    next = next.replace(
      marker,
      `    lastPlayerServerContactAt = Date.now();
    lastPlayerServerErrorAt = 0;
    const localTeamId = localStorage.getItem(SESSION_KEY);`,
    );
  }

  if (!next.includes("lastPlayerServerErrorAt = Date.now();\n    renderPlayerSyncPanel(getCurrentTeam());\n    showServerSyncNotice")) {
    const marker = `    serverWasTemporarilyUnavailable = true;
    console.warn(error);
    showServerSyncNotice("Connexion serveur temporairement indisponible. Nouvel essai automatique en cours.");`;
    if (!next.includes(marker)) throw new Error("initial server error marker not found");
    next = next.replace(
      marker,
      `    serverWasTemporarilyUnavailable = true;
    console.warn(error);
    lastPlayerServerErrorAt = Date.now();
    renderPlayerSyncPanel(getCurrentTeam());
    showServerSyncNotice("Connexion serveur temporairement indisponible. Nouvel essai automatique en cours.");`,
    );
  }

  if (!next.includes("lastPlayerServerErrorAt = Date.now();\n        renderPlayerSyncPanel(getCurrentTeam());\n        return;")) {
    const marker = `      if (!response.ok) return;`;
    if (!next.includes(marker)) throw new Error("player route response marker not found");
    next = next.replace(
      marker,
      `      if (!response.ok) {
        lastPlayerServerErrorAt = Date.now();
        renderPlayerSyncPanel(getCurrentTeam());
        return;
      }`,
    );
  }

  if (!next.includes("lastPlayerRouteRefreshAt = Date.now();\n      lastPlayerServerContactAt = lastPlayerRouteRefreshAt;")) {
    const marker = `      lastPlayerRouteRefreshAt = Date.now();`;
    if (!next.includes(marker)) throw new Error("player route success marker not found");
    next = next.replace(
      marker,
      `      lastPlayerRouteRefreshAt = Date.now();
      lastPlayerServerContactAt = lastPlayerRouteRefreshAt;
      lastPlayerServerErrorAt = 0;
      serverSyncEnabled = true;
      renderPlayerSyncPanel(currentTeam);`,
    );
  }

  if (!next.includes("lastPlayerServerErrorAt = Date.now();\n      serverSyncEnabled = false;\n      renderPlayerSyncPanel(getCurrentTeam());\n    })")) {
    const marker = `    .catch((error) => console.warn(error))`;
    if (!next.includes(marker)) throw new Error("player route catch marker not found");
    next = next.replace(
      marker,
      `    .catch((error) => {
      console.warn(error);
      lastPlayerServerErrorAt = Date.now();
      serverSyncEnabled = false;
      renderPlayerSyncPanel(getCurrentTeam());
    })`,
    );
  }

  if (!next.includes("lastPlayerServerContactAt = Date.now();\n    lastPlayerServerErrorAt = 0;\n  } catch")) {
    const marker = `    if (!response.ok) {
      throw new Error("Sauvegarde backend refus\u00e9e.");
    }
    serverSyncEnabled = true;
  } catch`;
    if (!next.includes(marker)) throw new Error("server save success marker not found");
    next = next.replace(
      marker,
      `    if (!response.ok) {
      throw new Error("Sauvegarde backend refus\u00e9e.");
    }
    serverSyncEnabled = true;
    lastPlayerServerContactAt = Date.now();
    lastPlayerServerErrorAt = 0;
    renderPlayerSyncPanel(getCurrentTeam());
  } catch`,
    );
  }

  if (!next.includes("lastPlayerServerErrorAt = Date.now();\n    renderPlayerSyncPanel(getCurrentTeam());\n    showToast(\"Sauvegarde serveur interrompue")) {
    const marker = `    console.warn(error);
    serverSyncEnabled = false;
    showToast("Sauvegarde serveur interrompue. Les donn\u00e9es restent conserv\u00e9es sur cette machine.");`;
    if (!next.includes(marker)) throw new Error("server save error marker not found");
    next = next.replace(
      marker,
      `    console.warn(error);
    serverSyncEnabled = false;
    lastPlayerServerErrorAt = Date.now();
    renderPlayerSyncPanel(getCurrentTeam());
    showToast("Sauvegarde serveur interrompue. Les donn\u00e9es restent conserv\u00e9es sur cette machine.");`,
    );
  }

  if (!next.includes("renderPlayerSyncPanel(team, route);\n\n  if (!team || !route)")) {
    const marker = `  els.gamePanel.classList.toggle("is-hidden", !team);

  if (!team || !route) {`;
    if (!next.includes(marker)) throw new Error("render player panel marker not found");
    next = next.replace(
      marker,
      `  els.gamePanel.classList.toggle("is-hidden", !team);
  renderPlayerSyncPanel(team, route);

  if (!team || !route) {`,
    );
  }

  if (!next.includes("function renderPlayerSyncPanel(")) {
    const marker = `function renderTeamIdentity(team) {`;
    if (!next.includes(marker)) throw new Error("player sync helper marker not found");
    next = next.replace(marker, `${playerSyncHelpers}\n\n${marker}`);
  }

  if (!next.includes("lastPlayerGpsErrorAt = 0;\n  touchTeam(team);")) {
    const marker = `  lastPlayerPositionRefreshAt = team.lastPosition.at;
  touchTeam(team);`;
    if (!next.includes(marker)) throw new Error("gps success marker not found");
    next = next.replace(
      marker,
      `  lastPlayerPositionRefreshAt = team.lastPosition.at;
  lastPlayerGpsErrorAt = 0;
  touchTeam(team);`,
    );
  }

  if (!next.includes("renderPlayerSyncPanel(team, route);\n  renderPlayerMap(team, puzzle);")) {
    const marker = `  saveData({ immediate: true });
  renderPlayerMap(team, puzzle);`;
    if (!next.includes(marker)) throw new Error("gps render marker not found");
    next = next.replace(
      marker,
      `  saveData({ immediate: true });
  renderPlayerSyncPanel(team, route);
  renderPlayerMap(team, puzzle);`,
    );
  }

  if (!next.includes("lastPlayerGpsErrorAt = Date.now();\n  renderPlayerSyncPanel(getCurrentTeam());")) {
    const marker = `function handleGeolocationError() {
  els.distanceNote.textContent = "Position non disponible. Verifiez l'autorisation GPS puis reessayez.";
}`;
    if (!next.includes(marker)) throw new Error("gps error marker not found");
    next = next.replace(
      marker,
      `function handleGeolocationError() {
  lastPlayerGpsErrorAt = Date.now();
  renderPlayerSyncPanel(getCurrentTeam());
  els.distanceNote.textContent = "Position non disponible. Verifiez l'autorisation GPS puis reessayez.";
}`,
    );
  }

  if (!next.includes('forcePlayerSyncButton?.addEventListener("click", forcePlayerSync)')) {
    const marker = `  els.locateButton.addEventListener("click", locatePlayer);`;
    if (!next.includes(marker)) throw new Error("force sync listener marker not found");
    next = next.replace(
      marker,
      `${marker}
  els.forcePlayerSyncButton?.addEventListener("click", forcePlayerSync);`,
    );
  }

  return next;
}

function patchStyles(css) {
  let next = css;

  if (!next.includes("player-rescue-v100")) {
    next += `

/* player-rescue-v100 */
.player-sync-panel {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 12px;
  align-items: center;
  padding: 12px;
  border: 1px solid var(--line);
  border-radius: var(--radius);
  background: #f8fbfa;
}

.player-sync-panel.is-hidden {
  display: none;
}

.player-sync-panel.is-ok {
  border-color: rgba(40, 127, 79, 0.28);
  background: #f4fbf6;
}

.player-sync-panel.is-warn {
  border-color: rgba(216, 151, 30, 0.34);
  background: #fff9eb;
}

.player-sync-panel.is-danger {
  border-color: rgba(184, 66, 61, 0.32);
  background: #fff5f4;
}

.player-sync-copy {
  min-width: 0;
}

.player-sync-kicker {
  display: block;
  margin-bottom: 3px;
  color: var(--muted);
  font-size: 0.68rem;
  font-weight: 950;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.player-sync-panel strong {
  display: block;
  color: var(--green);
  font-size: 0.96rem;
}

.player-sync-panel p {
  margin: 4px 0 0;
  color: var(--muted);
  font-size: 0.82rem;
  line-height: 1.35;
}

.player-sync-panel .compact-button {
  min-width: 132px;
}

@media (max-width: 480px) {
  .player-sync-panel {
    grid-template-columns: 1fr;
  }

  .player-sync-panel .compact-button {
    width: 100%;
  }
}
`;
  }

  return next;
}

function patchServiceWorker(sw) {
  return bumpAssetVersions(sw).replace(/escape-erezee-v\d+/g, `escape-erezee-v${VERSION}`);
}

await patchTextFile("index.html", patchIndex);
await patchTextFile("app.js", patchApp);
await patchTextFile("styles.css", patchStyles);
await patchTextFile("service-worker.js", patchServiceWorker);
