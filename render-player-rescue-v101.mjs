import { readFile, writeFile } from "node:fs/promises";

const VERSION = 101;
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

function patchApp(js) {
  if (js.includes("player-rescue-v101")) return js;

  return `${js}

/* player-rescue-v101 */
const PLAYER_RESCUE_WARN_MS = 120000;
const PLAYER_RESCUE_DANGER_MS = 300000;
const playerRescueState = {
  lastServerContactAt: 0,
  lastServerErrorAt: 0,
  lastGpsErrorAt: 0,
};

function playerRescueRelativeTime(timestamp) {
  if (!timestamp) return "jamais";
  const elapsed = Math.max(0, Date.now() - Number(timestamp));
  if (elapsed < 10000) return "a l'instant";
  if (elapsed < 60000) return "il y a " + Math.round(elapsed / 1000) + " s";
  if (elapsed < 3600000) return "il y a " + Math.round(elapsed / 60000) + " min";
  return "il y a " + Math.round(elapsed / 3600000) + " h";
}

function playerRescueEnsurePanel() {
  const gamePanel = document.querySelector("#game-panel");
  if (!gamePanel) return null;

  let panel = document.querySelector("#player-sync-panel");
  if (!panel) {
    panel = document.createElement("section");
    panel.className = "player-sync-panel is-hidden";
    panel.id = "player-sync-panel";
    panel.setAttribute("role", "status");
    panel.setAttribute("aria-live", "polite");
    panel.innerHTML = [
      '<div class="player-sync-copy">',
      '<span class="player-sync-kicker">Etat du jeu</span>',
      '<strong id="player-sync-title">Synchronisation</strong>',
      '<p id="player-sync-text">Connexion et position en attente.</p>',
      "</div>",
      '<button class="secondary-button compact-button" type="button" id="force-player-sync-button">Resynchroniser</button>',
    ].join("");

    const briefingPanel = document.querySelector("#briefing-panel");
    if (briefingPanel?.parentNode) {
      briefingPanel.parentNode.insertBefore(panel, briefingPanel);
    } else {
      gamePanel.appendChild(panel);
    }
  }

  const button = panel.querySelector("#force-player-sync-button");
  if (button && button.dataset.playerRescueBound !== "1") {
    button.dataset.playerRescueBound = "1";
    button.addEventListener("click", playerRescueForceSync);
  }

  return {
    panel,
    title: panel.querySelector("#player-sync-title"),
    text: panel.querySelector("#player-sync-text"),
    button,
  };
}

function playerRescueMarkServerContact() {
  playerRescueState.lastServerContactAt = Date.now();
  playerRescueState.lastServerErrorAt = 0;
}

function playerRescueMarkServerError() {
  if (!canUseBackend()) return;
  playerRescueState.lastServerErrorAt = Date.now();
}

function playerRescueStatus(team, route) {
  if (!team) {
    return { tone: "is-warn", title: "Synchronisation", text: "Connexion et position en attente." };
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
  const contactLabel = playerRescueState.lastServerContactAt
    ? "Serveur contacte " + playerRescueRelativeTime(playerRescueState.lastServerContactAt) + "."
    : "Contact serveur en attente.";

  if (!serverSyncEnabled && playerRescueState.lastServerErrorAt) {
    return {
      tone: "is-danger",
      title: "Serveur en attente",
      text: "Nouvel essai automatique en cours. Appuyez sur Resynchroniser si l'ecran semble fige.",
    };
  }

  if (team.status === "briefing") {
    const startState = route ? getBriefingStartState(team, route) : { allowed: false };
    return startState.allowed
      ? { tone: "is-ok", title: "Depart valide", text: "Position de depart confirmee. " + contactLabel }
      : { tone: "is-warn", title: "GPS a confirmer", text: "Localisez-vous au point de depart avant de lancer l'aventure." };
  }

  if (team.status === "won" || team.status === "lost") {
    return { tone: "is-ok", title: "Partie terminee", text: "Resultat conserve. " + contactLabel };
  }

  if (playerRescueState.lastGpsErrorAt && (!lastPositionAt || playerRescueState.lastGpsErrorAt > lastPositionAt)) {
    return {
      tone: "is-warn",
      title: "GPS a verifier",
      text: "Autorisez la localisation puis relancez le suivi si la carte ne bouge plus.",
    };
  }

  if (!lastPositionAt) {
    return { tone: "is-warn", title: "Position en attente", text: "Activez le suivi GPS pour envoyer l'avancee a la gestion." };
  }

  if (positionAge > PLAYER_RESCUE_DANGER_MS) {
    return {
      tone: "is-danger",
      title: "Position figee",
      text: "Derniere position recue " + playerRescueRelativeTime(lastPositionAt) + ". Appuyez sur Resynchroniser.",
    };
  }

  if (positionAge > PLAYER_RESCUE_WARN_MS) {
    return {
      tone: "is-warn",
      title: "Position peu recente",
      text: "Derniere position recue " + playerRescueRelativeTime(lastPositionAt) + ". Le suivi va se relancer.",
    };
  }

  return {
    tone: "is-ok",
    title: "Suivi actif",
    text: "Position envoyee " + playerRescueRelativeTime(lastPositionAt) + ". " + contactLabel,
  };
}

function playerRescueRender() {
  const refs = playerRescueEnsurePanel();
  if (!refs) return;

  const team = getCurrentTeam();
  const route = team ? getRoute(team.routeId) : null;
  refs.panel.classList.toggle("is-hidden", !team);
  if (!team) return;

  const status = playerRescueStatus(team, route);
  refs.panel.classList.remove("is-ok", "is-warn", "is-danger");
  refs.panel.classList.add(status.tone);
  refs.title.textContent = status.title;
  refs.text.textContent = status.text;
  if (refs.button) {
    refs.button.disabled = serverSaveInFlight || playerPositionRefreshInFlight;
  }
}

async function playerRescueForceSync() {
  const team = getCurrentTeam();
  if (!team) return;

  const refs = playerRescueEnsurePanel();
  if (refs?.button) refs.button.disabled = true;
  showToast("Synchronisation en cours...");

  try {
    await refreshPlayerRoutesFromServer({ force: true });
    if (serverSyncEnabled) playerRescueMarkServerContact();
    else playerRescueMarkServerError();

    const refreshedTeam = getCurrentTeam() || team;
    if (refreshedTeam.status === "briefing") {
      locateBriefingStart();
    } else if (refreshedTeam.status === "playing") {
      requestPlayerPositionRefresh(true);
    }

    saveData({ immediate: true });
  } finally {
    window.setTimeout(playerRescueRender, 800);
  }
}

function playerRescueInstall() {
  if (window.__playerRescueV101Installed) return;
  window.__playerRescueV101Installed = true;

  const originalRenderPlayer = renderPlayer;
  renderPlayer = function renderPlayerWithRescue(...args) {
    const result = originalRenderPlayer.apply(this, args);
    playerRescueRender();
    return result;
  };

  const originalSyncDataFromServer = syncDataFromServer;
  syncDataFromServer = async function syncDataFromServerWithRescue(...args) {
    const result = await originalSyncDataFromServer.apply(this, args);
    if (serverSyncEnabled) playerRescueMarkServerContact();
    else playerRescueMarkServerError();
    playerRescueRender();
    return result;
  };

  const originalRefreshPlayerRoutesFromServer = refreshPlayerRoutesFromServer;
  refreshPlayerRoutesFromServer = async function refreshPlayerRoutesFromServerWithRescue(...args) {
    const result = await originalRefreshPlayerRoutesFromServer.apply(this, args);
    if (serverSyncEnabled) playerRescueMarkServerContact();
    else playerRescueMarkServerError();
    playerRescueRender();
    return result;
  };

  const originalPersistDataToServer = persistDataToServer;
  persistDataToServer = async function persistDataToServerWithRescue(...args) {
    const result = await originalPersistDataToServer.apply(this, args);
    if (serverSyncEnabled) playerRescueMarkServerContact();
    else playerRescueMarkServerError();
    playerRescueRender();
    return result;
  };

  const originalHandleGeolocationPosition = handleGeolocationPosition;
  handleGeolocationPosition = async function handleGeolocationPositionWithRescue(position) {
    const result = await originalHandleGeolocationPosition(position);
    const team = getCurrentTeam();
    if (team?.lastPosition?.at) playerRescueState.lastGpsErrorAt = 0;
    playerRescueRender();
    return result;
  };

  const originalHandleGeolocationError = handleGeolocationError;
  handleGeolocationError = function handleGeolocationErrorWithRescue(...args) {
    playerRescueState.lastGpsErrorAt = Date.now();
    const result = originalHandleGeolocationError.apply(this, args);
    playerRescueRender();
    return result;
  };

  playerRescueRender();
  window.setTimeout(playerRescueRender, 1200);
}

playerRescueInstall();
`;
}

function patchStyles(css) {
  if (css.includes("player-rescue-v101")) return css;

  return `${css}

/* player-rescue-v101 */
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

function patchServiceWorker(sw) {
  return bumpAssetVersions(sw).replace(/escape-erezee-v\d+/g, `escape-erezee-v${VERSION}`);
}

await patchTextFile("index.html", bumpAssetVersions);
await patchTextFile("app.js", patchApp);
await patchTextFile("styles.css", patchStyles);
await patchTextFile("service-worker.js", patchServiceWorker);
