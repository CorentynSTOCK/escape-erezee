const STORAGE_KEY = "escape-erezee-data-v1";
const SESSION_KEY = "escape-erezee-team";
const ACTIVE_ROUTE_KEY = "escape-erezee-active-route";
const API_DATA_URL = "/api/data";
const API_CHECKOUT_URL = "/api/shop/checkout";
const API_CHECKOUT_SESSION_URL = "/api/shop/checkout-session";
const ADMIN_SESSION_URL = "/api/admin/session";
const ADMIN_LOGIN_URL = "/api/admin/login";
const ADMIN_LOGOUT_URL = "/api/admin/logout";

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => Array.from(document.querySelectorAll(selector));

const els = {
  views: {
    home: $("#home-view"),
    shop: $("#shop-view"),
    player: $("#player-view"),
    admin: $("#admin-view"),
  },
  navLinks: $$(".nav-link"),
  toast: $("#toast"),
  installAppButton: $("#install-app-button"),
  loginPanel: $("#login-panel"),
  gamePanel: $("#game-panel"),
  routeHero: $("#route-hero"),
  briefingPanel: $("#briefing-panel"),
  briefingTitle: $("#briefing-title"),
  briefingText: $("#briefing-text"),
  briefingMap: $("#briefing-map"),
  briefingStartText: $("#briefing-start-text"),
  briefingDirectionsLink: $("#briefing-directions-link"),
  briefingLocationStatus: $("#briefing-location-status"),
  briefingLocateButton: $("#briefing-locate-button"),
  startAdventureButton: $("#start-adventure-button"),
  startPointCard: $("#start-point-card"),
  startPointText: $("#start-point-text"),
  startDirectionsLink: $("#start-directions-link"),
  activationForm: $("#activation-form"),
  activationCode: $("#activation-code"),
  activationMessage: $("#activation-message"),
  shopList: $("#shop-list"),
  shopEmpty: $("#shop-empty"),
  resetSessionButton: $("#reset-session-button"),
  teamName: $("#team-name"),
  editTeamButton: $("#edit-team-button"),
  teamNameForm: $("#team-name-form"),
  teamNameInput: $("#team-name-input"),
  countdown: $("#countdown"),
  routeArea: $("#route-area"),
  routeTitle: $("#route-title"),
  routeDuration: $("#route-duration"),
  routePuzzleCount: $("#route-puzzle-count"),
  routeDistance: $("#route-distance"),
  routeCurrentStep: $("#route-current-step"),
  gameStatus: $("#game-status"),
  progressText: $("#progress-text"),
  elapsedTime: $("#elapsed-time"),
  progressFill: $("#progress-fill"),
  progressBlock: $(".progress-block"),
  finishPanel: $("#finish-panel"),
  finishLabel: $("#finish-label"),
  finishTitle: $("#finish-title"),
  finishSubtitle: $("#finish-subtitle"),
  finishTime: $("#finish-time"),
  finishScore: $("#finish-score"),
  finishRank: $("#finish-rank"),
  rankingList: $("#ranking-list"),
  mapPanel: $(".map-panel"),
  riddleCard: $("#riddle-card"),
  stepNumber: $("#step-number"),
  stepPlace: $("#step-place"),
  stepTitle: $("#step-title"),
  riddleText: $("#riddle-text"),
  riddleMedia: $("#riddle-media"),
  answerZone: $("#answer-zone"),
  hintButton: $("#hint-button"),
  hintState: $("#hint-state"),
  answerMessage: $("#answer-message"),
  locateButton: $("#locate-button"),
  demoUnlockButton: $("#demo-unlock-button"),
  distanceNote: $("#distance-note"),
  playerMap: $("#player-map"),
  adminLoginPanel: $("#admin-login-panel"),
  adminContent: $("#admin-content"),
  adminLoginForm: $("#admin-login-form"),
  adminPasswordInput: $("#admin-password"),
  adminLoginMessage: $("#admin-login-message"),
  adminLogoutButton: $("#admin-logout-button"),
  seedButton: $("#seed-button"),
  generateCodeButton: $("#generate-code-button"),
  routeList: $("#route-list"),
  routeCount: $("#route-count"),
  routeForm: $("#route-form"),
  routeDetailsForm: $("#route-details-form"),
  routeDetailsTitleInput: $("#route-details-title"),
  routeDetailsAreaInput: $("#route-details-area"),
  routeDetailsDurationInput: $("#route-details-duration"),
  routeDetailsDistanceInput: $("#route-details-distance"),
  routeDetailsPriceInput: $("#route-details-price"),
  routeDetailsShopVisibleInput: $("#route-details-shop-visible"),
  routeDetailsDescriptionInput: $("#route-details-description"),
  routeDetailsBriefingInput: $("#route-details-briefing"),
  routeDetailsFinishInput: $("#route-details-finish-message"),
  routeDetailsStartPlaceInput: $("#route-details-start-place"),
  routeDetailsStartAddressInput: $("#route-details-start-address"),
  routeDetailsStartLatInput: $("#route-details-start-lat"),
  routeDetailsStartLngInput: $("#route-details-start-lng"),
  routeDetailsImageInput: $("#route-details-image"),
  routeDetailsImagePreview: $("#route-details-image-preview"),
  removeRouteImageButton: $("#remove-route-image"),
  routeDetailsMessage: $("#route-details-message"),
  routeSelect: $("#route-select"),
  puzzleList: $("#puzzle-list"),
  puzzleForm: $("#puzzle-form"),
  puzzleContentForm: $("#puzzle-content-form"),
  contentPuzzleSelect: $("#content-puzzle-select"),
  contentTitleInput: $("#content-title"),
  contentPlaceInput: $("#content-place"),
  contentQuestionInput: $("#content-question"),
  contentArrivalInput: $("#content-arrival-message"),
  contentImageInput: $("#content-image"),
  contentImagePreview: $("#content-image-preview"),
  removeContentImageButton: $("#remove-content-image"),
  contentTypeSelect: $("#content-type"),
  contentAnswerInput: $("#content-answer"),
  contentMessage: $("#content-message"),
  geoForm: $("#geo-form"),
  geoPuzzleSelect: $("#geo-puzzle-select"),
  geoLatInput: $("#geo-lat"),
  geoLngInput: $("#geo-lng"),
  geoRadiusInput: $("#geo-radius"),
  geoRequiredInput: $("#geo-required"),
  geoMessage: $("#geo-message"),
  adminMap: $("#admin-map"),
  hintsForm: $("#hints-form"),
  hintPuzzleSelect: $("#hint-puzzle-select"),
  hintListEditor: $("#hint-list-editor"),
  addHintButton: $("#add-hint-button"),
  hintEditorMessage: $("#hint-editor-message"),
  teamTable: $("#team-table"),
  teamLiveMap: $("#team-live-map"),
  codeList: $("#code-list"),
  imageViewer: $("#image-viewer"),
  imageViewerTitle: $("#image-viewer-title"),
  imageViewerImage: $("#image-viewer-img"),
  imageViewerCloseButton: $("#image-viewer-close"),
  imageZoomOutButton: $("#image-zoom-out"),
  imageZoomResetButton: $("#image-zoom-reset"),
  imageZoomInButton: $("#image-zoom-in"),
  arrivalModal: $("#arrival-modal"),
  arrivalModalMessage: $("#arrival-modal-message"),
  arrivalModalCloseButton: $("#arrival-modal-close"),
  arrivalModalOkButton: $("#arrival-modal-ok"),
};

const TILE_SIZE = 256;
const MAP_ZOOM = 16;
const MAP_MIN_ZOOM = 3;
const MAP_MAX_ZOOM = 19;
const MAP_PADDING = 56;
const DEFAULT_CENTER = { lat: 50.29225, lng: 5.55995 };

let selectedGeoPuzzleId = null;
let selectedHintPuzzleId = null;
let selectedContentPuzzleId = null;

/* player-mobile-runtime-v187 */
const PLAYER_TEAM_SYNC_URL_V187 = "/api/player/team-sync";
const PLAYER_SESSION_STATE_KEY_V187 = "escape-erezee-player-session-v187";
let playerLastGuidancePaintAtV187 = 0;
let playerTrackingPausedByVisibilityV187 = false;

function playerSessionTeamV187() {
  const teamId = localStorage.getItem(SESSION_KEY);
  return teamId ? data?.teams?.find((team) => team.id === teamId) || null : null;
}

function playerTeamPayloadV187(team) {
  if (!team) return null;
  return {
    id: team.id,
    code: team.code,
    name: team.name,
    routeId: team.routeId,
    startAt: team.startAt,
    finishedAt: team.finishedAt,
    timeExpiredAt: team.timeExpiredAt,
    status: team.status,
    updatedAt: team.updatedAt,
    answers: team.answers || {},
    unlockedPuzzleIds: team.unlockedPuzzleIds || [],
    attempts: team.attempts || {},
    hints: team.hints || {},
    photoNames: team.photoNames || {},
    lastPosition: team.lastPosition || null,
  };
}

function persistCompactPlayerSessionV187(team) {
  if (!team) return;
  try {
    localStorage.setItem(PLAYER_SESSION_STATE_KEY_V187, JSON.stringify(playerTeamPayloadV187(team)));
  } catch (error) {
    console.warn("Sauvegarde locale legere indisponible.", error);
  }
}

function restoreCompactPlayerSessionV187(baseData) {
  if (!baseData || !Array.isArray(baseData.teams)) return baseData;
  try {
    const sessionTeamId = localStorage.getItem(SESSION_KEY);
    const raw = localStorage.getItem(PLAYER_SESSION_STATE_KEY_V187);
    if (!sessionTeamId || !raw) return baseData;
    const team = JSON.parse(raw);
    if (!team || team.id !== sessionTeamId || !team.code || !team.routeId) return baseData;
    const index = baseData.teams.findIndex((item) => item.id === team.id);
    if (index >= 0) baseData.teams[index] = team;
    else baseData.teams.push(team);
  } catch (error) {
    console.warn("Restauration locale legere impossible.", error);
  }
  return baseData;
}

function mergeSyncedPlayerTeamV187(serverTeam) {
  if (!serverTeam?.id || !Array.isArray(data?.teams)) return;
  const index = data.teams.findIndex((team) => team.id === serverTeam.id);
  if (index >= 0) data.teams[index] = serverTeam;
  else data.teams.push(serverTeam);
  persistCompactPlayerSessionV187(serverTeam);
}

function pausePlayerTrackingV187() {
  if (geolocationWatchId === null || !navigator.geolocation) return;
  navigator.geolocation.clearWatch(geolocationWatchId);
  geolocationWatchId = null;
  geolocationWatchPuzzleId = null;
  playerTrackingPausedByVisibilityV187 = true;
  const team = playerSessionTeamV187();
  if (team) saveData({ immediate: true });
}

function resumePlayerTrackingV187() {
  if (!playerTrackingPausedByVisibilityV187 || document.visibilityState !== "visible") return;
  playerTrackingPausedByVisibilityV187 = false;
  const team = playerSessionTeamV187();
  const route = team ? getRoute(team.routeId) : null;
  const puzzle = route ? getCurrentPuzzle(team, route) : null;
  if (!team || team.status !== "playing" || !puzzle?.requireLocation || !navigator.geolocation) return;
  geolocationWatchPuzzleId = puzzle.id;
  geolocationWatchId = navigator.geolocation.watchPosition(
    handleGeolocationPosition,
    handleGeolocationError,
    playerTrackingOptionsV189(),
  );
  requestPlayerPositionRefresh(true);
}

document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "hidden") pausePlayerTrackingV187();
  else resumePlayerTrackingV187();
});

window.addEventListener("pagehide", () => {
  const team = playerSessionTeamV187();
  if (team) persistCompactPlayerSessionV187(team);
});

let data = loadData();
let toastTimer = null;
let deferredInstallPrompt = null;
let ticker = null;
let imageViewerZoom = 1;
let serverSyncEnabled = false;
let serverSaveTimer = null;
let serverSaveInFlight = false;
let serverSavePending = false;
let geolocationWatchId = null;
let geolocationWatchPuzzleId = null;
const PLAYER_POSITION_REFRESH_MS = 60000;
let lastPlayerPositionRefreshAt = 0;
let playerPositionRefreshInFlight = false;
let briefingGeolocationWatchId = null;
let serverSyncNoticeShown = false;
let serverReconnectTimer = null;
let serverWasTemporarilyUnavailable = false;
let initialShopServerSyncPending = canUseBackend();
let initialShopServerSyncFailed = false;
let initialAdminServerSyncPending = canUseBackend();
let initialAdminServerSyncFailed = false;
let adminAuthenticated = !canUseBackend();
let adminSessionChecked = false;
let adminSessionCheckPromise = null;
const ADMIN_DELETE_TOMBSTONE_MS = 60000;
let lastAdminDeleteAt = 0;
const pendingDeletedTeamIds = new Map();
const pendingDeletedCodeValues = new Map();
let liveTeamRefreshInFlight = false;
let lastLiveTeamRefreshAt = 0;
let lastLiveTeamSuccessAt = 0;
let lastLiveTeamErrorAt = 0;
const ADMIN_TEAM_SYNC_WARN_MS = 120000;
const ADMIN_TEAM_SYNC_DANGER_MS = 300000;
let playerRouteRefreshPromise = null;
let lastPlayerRouteRefreshAt = 0;
const mapRenderOptions = new WeakMap();

function createSeedData() {
  const routeId = "route-tramway";
  return {
    activeRouteId: routeId,
    routes: [
      {
        id: routeId,
        title: "Le Secret du Tramway",
        area: "Erezée centre",
        duration: 90,
        distance: "3,2 km",
        pricePerTeam: 18,
        pricePerPerson: 18,
        shopVisible: true,
        description:
          "Un parcours familial entre traces du tramway vicinal, rivière et coeur du village.",
        briefingText: "Votre mission commence sur les traces du tramway vicinal. Rejoignez le point de depart, observez les lieux et lancez le chrono quand toute l'equipe est prete.",
        finishMessage: "Mission accomplie : vous avez retrouve les secrets d'Erezee et termine le parcours.",
        startPlace: "Ancienne gare vicinale",
        startAddress: "Erezee centre",
        startLat: 50.29285,
        startLng: 5.55765,
        puzzles: [
          {
            id: "puzzle-gare",
            title: "Le départ oublié",
            place: "Ancienne gare vicinale",
            type: "text",
            requireLocation: true,
            lat: 50.29285,
            lng: 5.55765,
            radius: 120,
            question:
              "Sur les rails du souvenir, je portais voyageurs et histoires. Quel mot relie Erezée à cette ancienne ligne ?",
            answer: "TRAMWAY",
            hints: [
              { afterAttempts: 1, afterSeconds: 600, text: "Regardez les panneaux liés au transport d’autrefois." },
              { afterAttempts: 2, afterSeconds: 1200, text: "Le mot commence par TRA." },
            ],
          },
          {
            id: "puzzle-riviere",
            title: "La voix de l’eau",
            place: "Bord de l’Aisne",
            type: "text",
            requireLocation: true,
            lat: 50.2908,
            lng: 5.55885,
            radius: 130,
            question:
              "Elle accompagne la promenade, traverse le paysage et garde son nom court. Quelle rivière cherchez-vous ?",
            answer: "AISNE",
            hints: [
              { afterAttempts: 1, afterSeconds: 600, text: "Son nom compte cinq lettres." },
              { afterAttempts: 2, afterSeconds: 1200, text: "A...SNE." },
            ],
          },
          {
            id: "puzzle-photo",
            title: "La marque de pierre",
            place: "Sentier du village",
            type: "photo",
            requireLocation: true,
            lat: 50.29355,
            lng: 5.5612,
            radius: 140,
            question:
              "Trouvez un repère en pierre portant une marque gravée, puis prenez-le en photo pour valider l’étape.",
            answer: "PHOTO",
            hints: [
              { afterAttempts: 1, afterSeconds: 600, text: "Cherchez un objet fixe, ancien, près du chemin." },
              { afterAttempts: 2, afterSeconds: 1200, text: "La réponse attendue est une photo, pas un mot." },
            ],
          },
          {
            id: "puzzle-final",
            title: "Le nom retrouvé",
            place: "Place du village",
            type: "text",
            requireLocation: false,
            lat: 50.29225,
            lng: 5.55995,
            radius: 160,
            question:
              "Assemblez vos découvertes : quel village accueille cette aventure ?",
            answer: "EREZEE",
            hints: [
              { afterAttempts: 1, afterSeconds: 600, text: "La réponse est le nom de la commune." },
              { afterAttempts: 2, afterSeconds: 1200, text: "Écrivez EREZEE sans accent." },
            ],
          },
        ],
      },
    ],
    codes: [
      {
        code: "742-ERE-931",
        routeId,
        status: "available",
        teamId: null,
        createdAt: Date.now() - 1000 * 60 * 60 * 4,
      },
      {
        code: "128-VAL-402",
        routeId,
        status: "available",
        teamId: null,
        createdAt: Date.now() - 1000 * 60 * 60 * 2,
      },
    ],
    teams: [
      {
        id: "team-demo",
        name: "Équipe Demo",
        routeId,
        code: "391-DEMO-640",
        startAt: Date.now() - 1000 * 60 * 21,
        finishedAt: null,
        status: "playing",
        answers: { "puzzle-gare": "TRAMWAY" },
        unlockedPuzzleIds: ["puzzle-gare", "puzzle-riviere"],
        attempts: { "puzzle-riviere": 1 },
        hints: { "puzzle-riviere": 1 },
        photoNames: {},
      },
    ],
  };
}

function clearStoredData() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Safari private mode or a full local storage can reject writes/removals.
  }
}

function writeStoredData(value) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
    return true;
  } catch (error) {
    console.warn("Stockage local indisponible, utilisation du backend uniquement.", error);
    clearStoredData();
    return false;
  }
}

function loadData() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return restoreCompactPlayerSessionV187(JSON.parse(stored));
    }
  } catch {
    clearStoredData();
  }
  const seed = createSeedData();
  if (location.hash !== "#player") writeStoredData(seed);
  return restoreCompactPlayerSessionV187(seed);
}

function saveData(options = {}) {
  const playerTeam = playerSessionTeamV187();
  const lightweightPlayerMode = !isAdminRouteActive() && location.hash === "#player";
  const adminServerMode = isAdminRouteActive() && adminAuthenticated;
  if (lightweightPlayerMode) {
    if (playerTeam) persistCompactPlayerSessionV187(playerTeam);
  } else if (!adminServerMode) {
    writeStoredData(data);
  }
  if (options.sync !== false) {
    scheduleServerSave(Boolean(options.immediate));
  }
}

function canUseBackend() {
  return ["http:", "https:"].includes(location.protocol);
}

function isValidAppData(value) {
  return Boolean(
    value
      && typeof value === "object"
      && Array.isArray(value.routes)
      && Array.isArray(value.codes)
      && Array.isArray(value.teams),
  );
}

async function fetchDataFromServerWithRetry() {
  let lastError = null;
  const retryStatuses = new Set([408, 425, 429, 500, 502, 503, 504]);

  for (let attempt = 1; attempt <= 7; attempt += 1) {
    try {
      const separator = API_DATA_URL.includes("?") ? "&" : "?";
      const response = await fetch(API_DATA_URL + separator + "sync=" + Date.now() + "-" + attempt, {
        headers: { Accept: "application/json" },
        cache: "no-store",
        credentials: "same-origin",
      });

      if (!retryStatuses.has(response.status) || attempt === 7) {
        return response;
      }

      lastError = new Error("Backend temporairement indisponible (" + response.status + ").");
    } catch (error) {
      lastError = error;
      if (attempt === 7) {
        throw lastError || new Error("Connexion serveur impossible.");
      }
    }

    await new Promise((resolve) => setTimeout(resolve, Math.min(1200 * attempt, 6000)));
  }

  throw lastError || new Error("Connexion serveur impossible.");
}

function getSessionTeamSyncFreshness(team) {
  if (!team) return 0;
  return Math.max(
    Number(team.updatedAt) || 0,
    Number(team.lastPosition?.at) || 0,
    Number(team.finishedAt) || 0,
    Number(team.startAt) || 0,
  );
}

function getSessionTeamAnswerCount(team) {
  return Object.keys(team?.answers || {}).length;
}

function shouldPreserveLocalSessionTeam(localTeam, serverTeam) {
  if (!localTeam) return false;
  if (!serverTeam) return true;
  return (
    getSessionTeamAnswerCount(localTeam) >= getSessionTeamAnswerCount(serverTeam)
    && getSessionTeamSyncFreshness(localTeam) >= getSessionTeamSyncFreshness(serverTeam)
  );
}

function mergeLocalSessionTeam(serverData, localTeam, localTeamId) {
  if (!localTeam || !localTeamId || isAdminRouteActive()) {
    return { data: serverData, preserved: false };
  }
  const hasKnownCode = serverData.codes?.some((code) => code.code === localTeam.code || code.teamId === localTeamId);
  if (!hasKnownCode) {
    return { data: serverData, preserved: false };
  }
  const serverTeam = serverData.teams.find((team) => team.id === localTeamId);
  if (!shouldPreserveLocalSessionTeam(localTeam, serverTeam)) {
    return { data: serverData, preserved: false };
  }
  return {
    data: {
      ...serverData,
      teams: [
        ...serverData.teams.filter((team) => team.id !== localTeamId),
        localTeam,
      ],
    },
    preserved: true,
  };
}

/* final-system-v189 */
const PUBLIC_CATALOG_URL_V189 = "/api/public/catalog";
const PLAYER_ACTIVATE_URL_V189 = "/api/player/activate";
const PLAYER_SESSION_URL_V189 = "/api/player/session";
const ADMIN_LIVE_URL_V189 = "/api/admin/live";
const PLAYER_GUIDANCE_GPS_INTERVAL_V189 = 1000;
const PLAYER_IDLE_GPS_INTERVAL_V189 = 60000;
let playerLastProcessedGpsAtV189 = 0;
let adminFullDataLoadedV191 = false;

function routeLooksLikePublicCatalogV191(route) {
  const puzzles = Array.isArray(route?.puzzles) ? route.puzzles : [];
  if (!puzzles.length) return false;
  return puzzles.every((puzzle) => (
    String(puzzle?.id || "").startsWith("public-")
    && !String(puzzle?.title || "").trim()
    && !String(puzzle?.question || "").trim()
    && !String(puzzle?.place || "").trim()
    && !Number.isFinite(Number(puzzle?.lat))
    && !Number.isFinite(Number(puzzle?.lng))
  ));
}

function hasSparseAdminRouteDataV191() {
  const routes = Array.isArray(data?.routes) ? data.routes : [];
  return routes.some(routeLooksLikePublicCatalogV191);
}

function playerTrackingOptionsV189() {
  const guidance = Boolean(playerNavigationActiveV183);
  return {
    enableHighAccuracy: guidance,
    maximumAge: guidance ? 1000 : PLAYER_IDLE_GPS_INTERVAL_V189,
    timeout: 15000,
  };
}

function restartPlayerTrackingForModeV189() {
  playerLastProcessedGpsAtV189 = 0;
  if (geolocationWatchId === null || !navigator.geolocation) return;
  navigator.geolocation.clearWatch(geolocationWatchId);
  geolocationWatchId = null;
  const team = getCurrentTeam();
  const route = team ? getRoute(team.routeId) : null;
  const puzzle = route ? getCurrentPuzzle(team, route) : null;
  if (!team || team.status !== "playing" || !puzzle?.requireLocation) return;
  geolocationWatchPuzzleId = puzzle.id;
  geolocationWatchId = navigator.geolocation.watchPosition(
    handleGeolocationPosition,
    handleGeolocationError,
    playerTrackingOptionsV189(),
  );
}

function replaceRouteV189(route) {
  if (!route?.id) return;
  const index = data.routes.findIndex((item) => item.id === route.id);
  if (index >= 0) data.routes[index] = route;
  else data.routes.push(route);
}

function replaceTeamV189(team) {
  if (!team?.id) return;
  const index = data.teams.findIndex((item) => item.id === team.id);
  if (index >= 0) data.teams[index] = team;
  else data.teams.push(team);
}

async function fetchPlayerSessionV189(team) {
  if (!team?.id || !team?.code) return null;
  const response = await fetch(PLAYER_SESSION_URL_V189, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    credentials: "same-origin",
    cache: "no-store",
    body: JSON.stringify({ teamId: team.id, code: team.code }),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.message || "Session joueur indisponible.");
  return payload;
}

function persistSafeClientStateV189() {
  try {
    writeStoredData({
      activeRouteId: data.activeRouteId,
      routes: data.routes,
      codes: [],
      teams: data.teams,
    });
  } catch (error) {
    console.warn("Cache local final indisponible.", error);
  }
}

async function syncDataFromServer() {
  if (!canUseBackend()) return;

  try {
    if (isAdminRouteActive()) {
      const response = await fetchDataFromServerWithRetry();
      if (response.status === 401 || response.status === 403) {
        adminAuthenticated = false;
        adminFullDataLoadedV191 = false;
        adminSessionChecked = true;
        initialAdminServerSyncPending = false;
        renderAdminAccess();
        return;
      }
      if (!response.ok) throw new Error("Le backend gestion n'a pas repondu correctement.");
      const serverData = await response.json();
      if (!isValidAppData(serverData)) throw new Error("Les donnees gestion ne sont pas lisibles.");
      data = serverData;
      adminFullDataLoadedV191 = true;
      serverSyncEnabled = true;
      initialAdminServerSyncPending = false;
      initialAdminServerSyncFailed = false;
      render();
      return;
    }

    const response = await fetch(PUBLIC_CATALOG_URL_V189, {
      headers: { Accept: "application/json" },
      cache: "no-store",
      credentials: "same-origin",
    });
    if (!response.ok) throw new Error("Le catalogue public n'a pas repondu correctement.");
    const catalog = await response.json();
    if (!catalog || !Array.isArray(catalog.routes)) throw new Error("Le catalogue public est invalide.");

    const currentTeamId = localStorage.getItem(SESSION_KEY);
    const localTeam = currentTeamId ? data.teams.find((team) => team.id === currentTeamId) || null : null;
    data = {
      activeRouteId: catalog.activeRouteId || catalog.routes[0]?.id || null,
      routes: catalog.routes,
      codes: [],
      teams: localTeam ? [localTeam] : [],
    };
    adminFullDataLoadedV191 = false;

    if (localTeam) {
      try {
        const session = await fetchPlayerSessionV189(localTeam);
        if (session?.route) replaceRouteV189(session.route);
        if (session?.team) replaceTeamV189(session.team);
      } catch (error) {
        console.warn("Reprise de session differee.", error);
      }
    }

    serverSyncEnabled = true;
    serverWasTemporarilyUnavailable = false;
    initialShopServerSyncPending = false;
    initialShopServerSyncFailed = false;
    initialAdminServerSyncPending = false;
    initialAdminServerSyncFailed = false;
    persistSafeClientStateV189();
    render();
  } catch (error) {
    serverSyncEnabled = false;
    serverWasTemporarilyUnavailable = true;
    if (isAdminRouteActive()) adminFullDataLoadedV191 = false;
    initialShopServerSyncFailed = true;
    initialAdminServerSyncFailed = true;
    renderShop();
    renderAdmin();
    console.warn(error);
    showServerSyncNotice("Connexion serveur temporairement indisponible. Nouvel essai automatique en cours.");
    queueServerReconnect();
  }
}

function showServerSyncNotice(message) {
  if (serverSyncNoticeShown) return;
  serverSyncNoticeShown = true;
  showToast(message);
}

function queueServerReconnect() {
  if (!canUseBackend() || serverSyncEnabled || serverReconnectTimer) return;
  serverReconnectTimer = window.setTimeout(() => {
    serverReconnectTimer = null;
    syncDataFromServer();
  }, 5000);
}


function shouldAllowPlayerServerSave() {
  return Boolean(localStorage.getItem(SESSION_KEY));
}

function requestPlayerPositionRefresh(force = false) {
  const team = getCurrentTeam();
  if (!team || team.status !== "playing") return;
  const route = getRoute(team.routeId);
  const puzzle = getCurrentPuzzle(team, route);
  if (!route || !puzzle || !navigator.geolocation) return;
  if (playerPositionRefreshInFlight) return;
  if (!force && Date.now() - lastPlayerPositionRefreshAt < PLAYER_POSITION_REFRESH_MS) return;

  lastPlayerPositionRefreshAt = Date.now();
  playerPositionRefreshInFlight = true;
  navigator.geolocation.getCurrentPosition(
    async (position) => {
      try {
        await handleGeolocationPosition(position);
      } finally {
        playerPositionRefreshInFlight = false;
      }
    },
    (error) => {
      playerPositionRefreshInFlight = false;
      handleGeolocationError(error);
    },
    playerTrackingOptionsV189(),
  );
}

function canAttemptServerSave() {
  if (!canUseBackend()) return false;
  if (shouldAllowPlayerServerSave()) return true;
  if (!isAdminRouteActive() || !adminAuthenticated) return false;
  return Boolean(adminFullDataLoadedV191 && !hasSparseAdminRouteDataV191());
}

function scheduleServerSave(immediate = false) {
  if (!canAttemptServerSave()) return;
  clearTimeout(serverSaveTimer);
  if (immediate) {
    persistDataToServer();
    return;
  }
  serverSaveTimer = setTimeout(persistDataToServer, 350);
}

async function persistDataToServer() {
  if (!canAttemptServerSave()) return;
  if (serverSaveInFlight) {
    serverSavePending = true;
    return;
  }

  serverSaveInFlight = true;
  try {
    const isPlayerWrite = !isAdminRouteActive() && shouldAllowPlayerServerSave();
    if (isPlayerWrite) {
      const team = playerSessionTeamV187();
      if (!team) return;
      const response = await fetch(PLAYER_TEAM_SYNC_URL_V187, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ team: playerTeamPayloadV187(team) }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload.message || "Synchronisation joueur refusee.");
      }
      if (payload.team) mergeSyncedPlayerTeamV187(payload.team);
      const localCode = data.codes?.find((code) => code.code === team.code);
      if (localCode && payload.team?.id) {
        localCode.status = "used";
        localCode.teamId = payload.team.id;
      }
      serverSyncEnabled = true;
      return;
    }

    const headers = { "Content-Type": "application/json" };
    if (isAdminRouteActive() && adminAuthenticated) {
      if (!adminFullDataLoadedV191 || hasSparseAdminRouteDataV191()) {
        throw new Error("Sauvegarde admin bloquee: donnees parcours incompletes.");
      }
      headers["X-Escape-Admin-Write"] = "1";
    }
    const response = await fetch(API_DATA_URL, {
      method: "PUT",
      headers,
      credentials: "same-origin",
      body: JSON.stringify(data),
    });
    if (response.status === 403) {
      adminAuthenticated = false;
      adminSessionChecked = true;
      renderAdminAccess();
      showToast("Connexion gestion requise pour modifier ces donnees.");
      return;
    }
    if (!response.ok) throw new Error("Sauvegarde backend refusee.");
    serverSyncEnabled = true;
  } catch (error) {
    console.warn(error);
    serverSyncEnabled = false;
    showToast("Synchronisation serveur interrompue. Votre progression reste conservee sur ce telephone.");
  } finally {
    serverSaveInFlight = false;
    if (serverSavePending) {
      serverSavePending = false;
      scheduleServerSave(true);
    }
  }
}

function flushServerSave() {
  if (!canAttemptServerSave()) return;
  clearTimeout(serverSaveTimer);
  persistDataToServer();
}

function prunePendingAdminDeletes() {
  const now = Date.now();
  pendingDeletedTeamIds.forEach((deletedAt, teamId) => {
    if (now - deletedAt > ADMIN_DELETE_TOMBSTONE_MS) pendingDeletedTeamIds.delete(teamId);
  });
  pendingDeletedCodeValues.forEach((deletedAt, codeValue) => {
    if (now - deletedAt > ADMIN_DELETE_TOMBSTONE_MS) pendingDeletedCodeValues.delete(codeValue);
  });
}

function rememberPendingAdminDelete(kind, value) {
  if (!value) return;
  lastAdminDeleteAt = Date.now();
  if (kind === "team") pendingDeletedTeamIds.set(value, lastAdminDeleteAt);
  if (kind === "code") pendingDeletedCodeValues.set(value, lastAdminDeleteAt);
}

function filterPendingAdminDeletes(serverData) {
  prunePendingAdminDeletes();
  const teams = serverData.teams.filter((team) => !pendingDeletedTeamIds.has(team.id));
  const codes = serverData.codes.filter((code) => !pendingDeletedCodeValues.has(code.code));
  return {
    teams,
    codes,
    changed: teams.length !== serverData.teams.length || codes.length !== serverData.codes.length,
  };
}

async function refreshLiveTeamsFromServer() {
  if (!canUseBackend() || liveTeamRefreshInFlight) return;
  if (!isAdminRouteActive() || !adminAuthenticated) return;

  liveTeamRefreshInFlight = true;
  lastLiveTeamRefreshAt = Date.now();
  const refreshStartedAt = lastLiveTeamRefreshAt;
  try {
    const response = await fetch(ADMIN_LIVE_URL_V189 + "?live=" + Date.now(), {
      headers: { Accept: "application/json" },
      cache: "no-store",
      credentials: "same-origin",
    });
    if (!response.ok) {
      serverSyncEnabled = false;
      lastLiveTeamErrorAt = Date.now();
      renderTeamSyncSummary();
      return;
    }

    const serverData = await response.json();
    if (!serverData || !Array.isArray(serverData.teams) || !Array.isArray(serverData.codes)) return;

    if (refreshStartedAt < lastAdminDeleteAt) return;

    const filteredServerData = filterPendingAdminDeletes(serverData);
    data.teams = filteredServerData.teams;
    data.codes = filteredServerData.codes;
    if (filteredServerData.changed) saveData({ immediate: true });
    serverSyncEnabled = true;
    lastLiveTeamSuccessAt = Date.now();
    renderTeamTable();
    renderCodeList();
  } catch (error) {
    console.warn(error);
    serverSyncEnabled = false;
    lastLiveTeamErrorAt = Date.now();
    renderTeamSyncSummary();
  } finally {
    liveTeamRefreshInFlight = false;
  }
}

async function refreshPlayerRoutesFromServer(options = {}) {
  if (!canUseBackend()) return;
  if (playerRouteRefreshPromise) return playerRouteRefreshPromise;
  if (!options.force && Date.now() - lastPlayerRouteRefreshAt < 15000) return;
  const team = getCurrentTeam();
  if (!team?.id || !team?.code) return;

  playerRouteRefreshPromise = fetchPlayerSessionV189(team)
    .then((session) => {
      if (session?.route) replaceRouteV189(session.route);
      if (session?.team) replaceTeamV189(session.team);
      persistSafeClientStateV189();
      lastPlayerRouteRefreshAt = Date.now();
    })
    .catch((error) => console.warn(error))
    .finally(() => {
      playerRouteRefreshPromise = null;
    });
  return playerRouteRefreshPromise;
}

function isAdminRouteActive() {
  return location.hash.replace("#", "") === "admin";
}

function renderAdminAccess() {
  if (!els.adminLoginPanel || !els.adminContent) return;
  const loginRequired = canUseBackend() && !adminAuthenticated;
  els.adminLoginPanel.classList.toggle("is-hidden", !loginRequired);
  els.adminContent.classList.toggle("is-hidden", loginRequired);
  if (!loginRequired && els.adminLoginMessage) {
    els.adminLoginMessage.textContent = "";
  }
}

async function checkAdminSession(options = {}) {
  if (!canUseBackend()) {
    adminAuthenticated = true;
    adminSessionChecked = true;
    renderAdminAccess();
    return true;
  }

  if (adminSessionCheckPromise && !options.force) {
    return adminSessionCheckPromise;
  }

  adminSessionCheckPromise = fetch(ADMIN_SESSION_URL, {
    headers: { Accept: "application/json" },
    cache: "no-store",
    credentials: "same-origin",
  })
    .then(async (response) => {
      const payload = response.ok ? await response.json() : { authenticated: false };
      adminAuthenticated = Boolean(payload.authenticated);
      adminSessionChecked = true;
      renderAdminAccess();
      return adminAuthenticated;
    })
    .catch((error) => {
      console.warn(error);
      adminAuthenticated = false;
      adminSessionChecked = true;
      renderAdminAccess();
      return false;
    })
    .finally(() => {
      adminSessionCheckPromise = null;
    });

  return adminSessionCheckPromise;
}

async function handleAdminLogin(event) {
  event.preventDefault();
  const password = els.adminPasswordInput.value;
  if (!password) {
    els.adminLoginMessage.textContent = "Indiquez le mot de passe gestion.";
    return;
  }

  try {
    const response = await fetch(ADMIN_LOGIN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ password }),
    });
    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      els.adminLoginMessage.textContent = payload.message || "Mot de passe incorrect.";
      return;
    }

    adminAuthenticated = true;
    adminSessionChecked = true;
    els.adminLoginForm.reset();
    els.adminLoginMessage.textContent = "";
    await syncDataFromServer();
    renderAdmin();
    showToast("Acces gestion ouvert.");
  } catch (error) {
    console.warn(error);
    els.adminLoginMessage.textContent = "Connexion impossible pour le moment.";
  }
}

async function handleAdminLogout() {
  if (canUseBackend()) {
    await fetch(ADMIN_LOGOUT_URL, {
      method: "POST",
      credentials: "same-origin",
    }).catch((error) => console.warn(error));
  }
  adminAuthenticated = !canUseBackend();
  adminSessionChecked = true;
  renderAdmin();
  showToast("Accès gestion fermé.");
}

function createId(prefix) {
  if (crypto?.randomUUID) {
    return `${prefix}-${crypto.randomUUID().slice(0, 8)}`;
  }
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

function setHashView() {
  const requestedView = location.hash.replace("#", "");
  const view = ["home", "shop", "player", "admin"].includes(requestedView) ? requestedView : "home";
  Object.entries(els.views).forEach(([name, element]) => {
    element.classList.toggle("is-active", name === view);
  });
  els.navLinks.forEach((link) => {
    link.classList.toggle("is-active", link.dataset.route === view);
  });
  if (view === "admin" && !adminSessionChecked) {
    checkAdminSession().then(() => {
      if (isAdminRouteActive()) renderAdmin();
    });
  }
  render();
}

function showToast(message) {
  els.toast.textContent = message;
  els.toast.classList.add("is-visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    els.toast.classList.remove("is-visible");
  }, 2600);
}

function isStandaloneApp() {
  return window.matchMedia?.("(display-mode: standalone)")?.matches || window.navigator.standalone === true;
}

function updateInstallButton() {
  if (!els.installAppButton) return;
  els.installAppButton.hidden = isStandaloneApp();
}

async function installApp() {
  if (isStandaloneApp()) {
    showToast("L’application est déjà installée sur cet appareil.");
    updateInstallButton();
    return;
  }

  if (deferredInstallPrompt) {
    const promptEvent = deferredInstallPrompt;
    deferredInstallPrompt = null;
    promptEvent.prompt();
    const choice = await promptEvent.userChoice.catch(() => null);
    if (choice?.outcome === "accepted") {
      showToast("Installation lancée.");
      updateInstallButton();
      return;
    }
  }

  const isiOS = /iphone|ipad|ipod/i.test(navigator.userAgent || "");
  showToast(isiOS
    ? "Sur iPhone : Partager, puis Sur l’écran d’accueil."
    : "Ouvrez le menu du navigateur, puis choisissez Installer l’application.");
}

function updateModalLock() {
  const imageViewerOpen = els.imageViewer && !els.imageViewer.classList.contains("is-hidden");
  const arrivalModalOpen = els.arrivalModal && !els.arrivalModal.classList.contains("is-hidden");
  document.body.classList.toggle("has-modal", Boolean(imageViewerOpen || arrivalModalOpen));
}

function openArrivalModal(message) {
  const text = String(message || "").trim();
  if (!els.arrivalModal || !els.arrivalModalMessage || !text) return false;
  els.arrivalModalMessage.textContent = text;
  els.arrivalModal.classList.remove("is-hidden");
  updateModalLock();
  els.arrivalModalCloseButton?.focus();
  return true;
}

function closeArrivalModal() {
  if (!els.arrivalModal) return;
  els.arrivalModal.classList.add("is-hidden");
  updateModalLock();
}

function getActiveRoute() {
  const savedId = localStorage.getItem(ACTIVE_ROUTE_KEY);
  const routeId = savedId || data.activeRouteId;
  return data.routes.find((route) => route.id === routeId) || data.routes[0];
}

function setActiveRoute(routeId) {
  data.activeRouteId = routeId;
  selectedGeoPuzzleId = null;
  selectedHintPuzzleId = null;
  selectedContentPuzzleId = null;
  localStorage.setItem(ACTIVE_ROUTE_KEY, routeId);
  saveData({ immediate: true });
  renderAdmin();
}

function getRoute(routeId) {
  return data.routes.find((route) => route.id === routeId);
}

function getCurrentTeam() {
  const teamId = localStorage.getItem(SESSION_KEY);
  return data.teams.find((team) => team.id === teamId) || null;
}

function getTeamProgress(team, route) {
  const solved = route.puzzles.filter((puzzle) => team.answers[puzzle.id]).length;
  const total = Math.max(route.puzzles.length, 1);
  return {
    solved,
    total,
    percent: Math.round((solved / total) * 100),
  };
}

function getCurrentPuzzle(team, route) {
  return route.puzzles.find((puzzle) => !team.answers[puzzle.id]) || route.puzzles[route.puzzles.length - 1];
}

function getTeamTarget(team, route) {
  const puzzle = team && route ? getCurrentPuzzle(team, route) : null;
  if (!puzzle) return null;
  return {
    puzzle,
    lat: getPuzzleLat(puzzle),
    lng: getPuzzleLng(puzzle),
    radius: getPuzzleRadius(puzzle),
  };
}

function getRouteRanking(route) {
  return data.teams
    .filter((team) => team.routeId === route.id && team.status === "won" && team.finishedAt)
    .map((team) => ({
      team,
      seconds: elapsedSeconds(team),
    }))
    .sort((a, b) => a.seconds - b.seconds || a.team.finishedAt - b.team.finishedAt);
}

function elapsedSeconds(team) {
  if (!team?.startAt) return 0;
  const end = team.finishedAt || Date.now();
  return Math.max(0, Math.floor((end - team.startAt) / 1000));
}

function remainingSeconds(team, route) {
  return Math.max(0, route.duration * 60 - elapsedSeconds(team));
}

function formatClock(seconds) {
  const minutes = Math.floor(seconds / 60).toString().padStart(2, "0");
  const rest = Math.floor(seconds % 60).toString().padStart(2, "0");
  return `${minutes}:${rest}`;
}

function formatDuration(seconds) {
  const safeSeconds = Math.max(0, Math.floor(seconds));
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const rest = safeSeconds % 60;
  if (hours) {
    return `${hours} h ${minutes.toString().padStart(2, "0")} min ${rest.toString().padStart(2, "0")} s`;
  }
  return `${minutes} min ${rest.toString().padStart(2, "0")} s`;
}

function formatRelativeTime(timestamp) {
  const ageSeconds = Math.max(0, Math.floor((Date.now() - Number(timestamp || 0)) / 1000));
  if (!timestamp) return "jamais";
  if (ageSeconds < 10) return "a l'instant";
  if (ageSeconds < 60) return `il y a ${ageSeconds} s`;
  const ageMinutes = Math.floor(ageSeconds / 60);
  if (ageMinutes < 60) return `il y a ${ageMinutes} min`;
  const ageHours = Math.floor(ageMinutes / 60);
  return `il y a ${ageHours} h`;
}

function formatDistanceMeters(distance) {
  if (!Number.isFinite(distance)) return "--";
  if (distance < 1000) return `${Math.round(distance)} m`;
  return `${(distance / 1000).toFixed(1).replace(".", ",")} km`;
}

function isUsablePosition(position) {
  return Boolean(
    position
      && Number.isFinite(Number(position.lat))
      && Number.isFinite(Number(position.lng)),
  );
}

function touchTeam(team) {
  if (!team) return;
  team.updatedAt = Date.now();
}

function getRoutePrice(route) {
  const storedPrice = route?.pricePerTeam ?? route?.pricePerPerson;
  if (route && (storedPrice === undefined || storedPrice === null)) {
    return 18;
  }
  const price = Number(storedPrice);
  return Number.isFinite(price) && price >= 0 ? price : 0;
}


function formatPrice(value) {
  return new Intl.NumberFormat("fr-BE", {
    style: "currency",
    currency: "EUR",
  }).format(getRoutePrice({ pricePerTeam: value }));
}

function formatRouteDistance(route) {
  const value = String(route?.distance || "").trim();
  return value || "Distance \u00e0 d\u00e9finir";
}



function formatCustomerAddress(address) {
  if (!address) return "";
  return [
    address.line1,
    address.line2,
    [address.postalCode, address.city].filter(Boolean).join(" "),
    address.state,
    address.country,
  ].filter(Boolean).join(", ");
}

function isRouteVisibleInShop(route) {
  return route?.shopVisible !== false;
}

function getShopRoutes() {
  return data.routes.filter(isRouteVisibleInShop);
}

function getPuzzleLat(puzzle) {
  return Number.isFinite(Number(puzzle?.lat)) ? Number(puzzle.lat) : DEFAULT_CENTER.lat;
}

function getPuzzleLng(puzzle) {
  return Number.isFinite(Number(puzzle?.lng)) ? Number(puzzle.lng) : DEFAULT_CENTER.lng;
}

function getPuzzleRadius(puzzle) {
  const radius = Number(puzzle?.radius);
  return Number.isFinite(radius) && radius > 0 ? Math.min(1000, Math.max(20, radius)) : 120;
}

function latLngToWorld(lat, lng, zoom = MAP_ZOOM) {
  const sin = Math.sin((lat * Math.PI) / 180);
  const scale = TILE_SIZE * 2 ** zoom;
  return {
    x: ((lng + 180) / 360) * scale,
    y: (0.5 - Math.log((1 + sin) / (1 - sin)) / (4 * Math.PI)) * scale,
  };
}

function worldToLatLng(x, y, zoom = MAP_ZOOM) {
  const scale = TILE_SIZE * 2 ** zoom;
  const lng = (x / scale) * 360 - 180;
  const n = Math.PI - (2 * Math.PI * y) / scale;
  const lat = (180 / Math.PI) * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)));
  return { lat, lng };
}

function metersToPixels(meters, lat, zoom = MAP_ZOOM) {
  const metersPerPixel = (156543.03392 * Math.cos((lat * Math.PI) / 180)) / 2 ** zoom;
  return Math.max(12, meters / metersPerPixel);
}

function formatCoordinate(value) {
  return Number(value).toFixed(5);
}

function parseOptionalCoordinate(value) {
  const normalized = String(value ?? "").trim().replace(",", ".");
  if (!normalized) return null;
  const coordinate = Number(normalized);
  return Number.isFinite(coordinate) ? coordinate : null;
}

function formatOptionalCoordinate(value) {
  const coordinate = parseOptionalCoordinate(value);
  return coordinate === null ? "" : formatCoordinate(coordinate);
}

function getRouteStart(route) {
  const firstPuzzle = route?.puzzles?.[0] || null;
  const routeLat = parseOptionalCoordinate(route?.startLat);
  const routeLng = parseOptionalCoordinate(route?.startLng);
  const puzzleLat = parseOptionalCoordinate(firstPuzzle?.lat);
  const puzzleLng = parseOptionalCoordinate(firstPuzzle?.lng);
  const hasRouteCoordinates = routeLat !== null && routeLng !== null;
  const hasPuzzleCoordinates = puzzleLat !== null && puzzleLng !== null;

  return {
    place: route?.startPlace || firstPuzzle?.place || route?.area || "Point de depart",
    address: route?.startAddress || "",
    lat: hasRouteCoordinates ? routeLat : hasPuzzleCoordinates ? puzzleLat : null,
    lng: hasRouteCoordinates ? routeLng : hasPuzzleCoordinates ? puzzleLng : null,
  };
}

function getRouteStartDirectionsUrl(route) {
  const start = getRouteStart(route);
  const destination = Number.isFinite(start.lat) && Number.isFinite(start.lng)
    ? `${start.lat},${start.lng}`
    : [start.place, start.address, route?.area, "Belgique"].filter(Boolean).join(", ");
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}&travelmode=walking`;
}

function renderStartPoint(route) {
  if (!els.startPointCard || !route) return;
  const start = getRouteStart(route);
  const hasCoordinates = Number.isFinite(start.lat) && Number.isFinite(start.lng);
  const coordinateLabel = hasCoordinates ? `GPS ${formatCoordinate(start.lat)}, ${formatCoordinate(start.lng)}` : "";
  const details = [start.place, start.address, coordinateLabel].filter(Boolean).join(" \u00b7 ");
  els.startPointText.textContent = details || "Le point de d\u00e9part sera communique avant le lancement.";
  if (els.startDirectionsLink) {
    els.startDirectionsLink.href = getRouteStartDirectionsUrl(route);
    els.startDirectionsLink.style.display = "inline-flex";
  }
}

function getMapCenter(target, playerPosition) {
  if (!playerPosition) return target;
  return {
    lat: (target.lat + playerPosition.lat) / 2,
    lng: (target.lng + playerPosition.lng) / 2,
  };
}

function getFittingMapViewForBounds(points, zones, width, height, fallbackCenter = DEFAULT_CENTER) {
  const usableWidth = Math.max(120, width - MAP_PADDING * 2);
  const usableHeight = Math.max(120, height - MAP_PADDING * 2);
  const safePoints = points
    .filter(isUsablePosition)
    .map((point) => ({ lat: Number(point.lat), lng: Number(point.lng) }));
  const safeZones = zones
    .filter(isUsablePosition)
    .map((zone) => ({
      lat: Number(zone.lat),
      lng: Number(zone.lng),
      radius: Number(zone.radius) || 0,
    }));

  if (!safePoints.length && !safeZones.length) {
    return { center: fallbackCenter, zoom: MAP_ZOOM };
  }

  for (let zoom = MAP_ZOOM; zoom >= MAP_MIN_ZOOM; zoom -= 1) {
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;

    safePoints.forEach((point) => {
      const world = latLngToWorld(point.lat, point.lng, zoom);
      minX = Math.min(minX, world.x);
      maxX = Math.max(maxX, world.x);
      minY = Math.min(minY, world.y);
      maxY = Math.max(maxY, world.y);
    });

    safeZones.forEach((zone) => {
      const world = latLngToWorld(zone.lat, zone.lng, zoom);
      const radiusPixels = metersToPixels(zone.radius, zone.lat, zoom);
      minX = Math.min(minX, world.x - radiusPixels);
      maxX = Math.max(maxX, world.x + radiusPixels);
      minY = Math.min(minY, world.y - radiusPixels);
      maxY = Math.max(maxY, world.y + radiusPixels);
    });

    if (maxX - minX <= usableWidth && maxY - minY <= usableHeight) {
      return {
        center: worldToLatLng((minX + maxX) / 2, (minY + maxY) / 2, zoom),
        zoom,
      };
    }
  }

  const zoom = MAP_MIN_ZOOM;
  const worlds = [...safePoints, ...safeZones].map((point) => latLngToWorld(point.lat, point.lng, zoom));
  const minX = Math.min(...worlds.map((point) => point.x));
  const maxX = Math.max(...worlds.map((point) => point.x));
  const minY = Math.min(...worlds.map((point) => point.y));
  const maxY = Math.max(...worlds.map((point) => point.y));
  return {
    center: worldToLatLng((minX + maxX) / 2, (minY + maxY) / 2, zoom),
    zoom,
  };
}

function getFittingMapView(target, player, radius, width, height) {
  if (!player) return { center: target, zoom: MAP_ZOOM };
  return getFittingMapViewForBounds([player], [{ ...target, radius }], width, height, target);
}

function clampMapZoom(value) {
  const zoom = Number(value);
  if (!Number.isFinite(zoom)) return MAP_ZOOM;
  return Math.min(MAP_MAX_ZOOM, Math.max(MAP_MIN_ZOOM, Math.round(zoom)));
}

function getMapZoomOverride(container, fallbackZoom) {
  const manualZoom = Number(container.dataset.mapManualZoom);
  return clampMapZoom(Number.isFinite(manualZoom) ? manualZoom : fallbackZoom);
}

function rerenderMap(container) {
  if (!container) return;
  window.setTimeout(() => {
    container.dataset.mapKey = "";
    const options = mapRenderOptions.get(container);
    if (options) renderTileMap(container, options);
  }, 80);
}

function zoomMap(container, delta) {
  const currentZoom = Number(container.dataset.mapCurrentZoom);
  const nextZoom = clampMapZoom((Number.isFinite(currentZoom) ? currentZoom : MAP_ZOOM) + delta);
  container.dataset.mapManualZoom = String(nextZoom);
  rerenderMap(container);
}

function toggleMapFullscreen(container) {
  const requestFullscreen = container.requestFullscreen || container.webkitRequestFullscreen;
  const exitFullscreen = document.exitFullscreen || document.webkitExitFullscreen;
  const fullscreenElement = document.fullscreenElement || document.webkitFullscreenElement;
  if (!requestFullscreen || !exitFullscreen) {
    showToast("Le plein écran n’est pas disponible sur ce navigateur.");
    return;
  }
  const action = fullscreenElement === container
    ? exitFullscreen.call(document)
    : requestFullscreen.call(container);
  Promise.resolve(action)
    .then(() => rerenderMap(container))
    .catch(() => showToast("Le plein écran n’a pas pu être ouvert."));
}

function ensureMapControls(container) {
  if (!container.matches("#player-map, #admin-map, #team-live-map")) return;
  if (!document.body.dataset.mapFullscreenBound) {
    document.body.dataset.mapFullscreenBound = "1";
    ["fullscreenchange", "webkitfullscreenchange"].forEach((eventName) => {
      document.addEventListener(eventName, () => {
        $("#player-map, #admin-map, #team-live-map").forEach(rerenderMap);
      });
    });
  }
  if (container.querySelector(".map-controls")) return;
  const controls = document.createElement("div");
  controls.className = "map-controls";
  controls.innerHTML = `
    <button class="map-control-button" type="button" data-map-zoom-out aria-label="Dézoomer la carte" title="Dézoomer">-</button>
    <button class="map-control-button" type="button" data-map-zoom-in aria-label="Zoomer la carte" title="Zoomer">+</button>
    <button class="map-control-button" type="button" data-map-recenter aria-label="Recentrer la carte" title="Recentrer">&#8857;</button>
    <button class="map-control-button" type="button" data-map-fullscreen aria-label="Afficher la carte en plein écran" title="Plein écran">⛶</button>
  `;
  controls.addEventListener("click", (event) => event.stopPropagation());
  controls.querySelector("[data-map-zoom-out]").addEventListener("click", (event) => {
    event.preventDefault();
    zoomMap(container, -1);
  });
  controls.querySelector("[data-map-zoom-in]").addEventListener("click", (event) => {
    event.preventDefault();
    zoomMap(container, 1);
  });
  controls.querySelector("[data-map-recenter]")?.addEventListener("click", (event) => {
    event.preventDefault();
    delete container.dataset.mapManualZoom;
    container.dataset.mapKey = "";
    rerenderMap(container);
    if (container.id === "player-map" && typeof requestPlayerPositionRefresh === "function") {
      requestPlayerPositionRefresh(true);
    }
  });
  controls.querySelector("[data-map-fullscreen]").addEventListener("click", (event) => {
    event.preventDefault();
    toggleMapFullscreen(container);
  });
  container.appendChild(controls);
}

function renderTileMap(container, options = {}) {
  if (!container) return;
  mapRenderOptions.set(container, options);
  const rect = container.getBoundingClientRect();
  const width = Math.max(Math.round(rect.width), 320);
  const height = Math.max(Math.round(rect.height), 180);
  const target = options.target || options.center || DEFAULT_CENTER;
  const radius = Number(options.radius || 120);
  const player = isUsablePosition(options.player) ? options.player : null;
  const players = Array.isArray(options.players)
    ? options.players.filter(isUsablePosition)
    : player
      ? [{ ...player, label: "Vous" }]
      : [];
  const targets = Array.isArray(options.targets)
    ? options.targets.filter(isUsablePosition)
    : [{ ...target, radius, label: options.editable ? "Point" : "Objectif" }];
  const view = options.fitToPoints
    ? getFittingMapViewForBounds(players, targets, width, height, target)
    : options.fitToPlayer
      ? getFittingMapView(target, player, radius, width, height)
      : { center: options.center || target, zoom: options.zoom || MAP_ZOOM };
  const center = view.center;
  const zoom = getMapZoomOverride(container, view.zoom);
  const renderKey = JSON.stringify({
    w: width,
    h: height,
    zoom,
    center: [center.lat.toFixed(5), center.lng.toFixed(5)],
    targets: targets.map((item) => [
      Number(item.lat).toFixed(5),
      Number(item.lng).toFixed(5),
      Math.round(Number(item.radius) || radius),
      item.label || "",
    ]),
    players: players.map((item) => [
      Number(item.lat).toFixed(5),
      Number(item.lng).toFixed(5),
      item.label || "",
      item.variant || "",
    ]),
    editable: Boolean(options.editable),
  });

  if (container.dataset.mapKey === renderKey) return;
  container.dataset.mapKey = renderKey;
  container.dataset.mapCurrentZoom = String(zoom);
  ensureMapControls(container);

  const tiles = container.querySelector(".map-tiles");
  const layer = container.querySelector(".map-layer");
  const centerWorld = latLngToWorld(center.lat, center.lng, zoom);
  const topLeft = {
    x: centerWorld.x - width / 2,
    y: centerWorld.y - height / 2,
  };
  const startX = Math.floor(topLeft.x / TILE_SIZE);
  const startY = Math.floor(topLeft.y / TILE_SIZE);
  const endX = Math.floor((topLeft.x + width) / TILE_SIZE);
  const endY = Math.floor((topLeft.y + height) / TILE_SIZE);
  const maxTile = 2 ** zoom;
  const tileMarkup = [];

  for (let x = startX; x <= endX; x += 1) {
    for (let y = startY; y <= endY; y += 1) {
      if (y < 0 || y >= maxTile) continue;
      const wrappedX = ((x % maxTile) + maxTile) % maxTile;
      tileMarkup.push(
        `<img class="map-tile" alt="" src="https://tile.openstreetmap.org/${zoom}/${wrappedX}/${y}.png" style="left:${Math.round(x * TILE_SIZE - topLeft.x)}px;top:${Math.round(y * TILE_SIZE - topLeft.y)}px" />`,
      );
    }
  }

  const pointFor = (point) => {
    const world = latLngToWorld(point.lat, point.lng, zoom);
    return {
      x: world.x - topLeft.x,
      y: world.y - topLeft.y,
    };
  };

  const overlay = [];
  targets.forEach((item, index) => {
    const targetPoint = pointFor(item);
    const targetRadius = Number(item.radius) || radius;
    const radiusPixels = metersToPixels(targetRadius, Number(item.lat), zoom);
    const label = item.label || (options.editable ? "Point" : "Objectif");
    overlay.push(
      `<span class="map-zone" style="left:${targetPoint.x}px;top:${targetPoint.y}px;width:${radiusPixels * 2}px;height:${radiusPixels * 2}px"></span>`,
      `<span class="map-marker marker-target marker-index-${index % 6}" style="left:${targetPoint.x}px;top:${targetPoint.y}px"><span class="marker-symbol" aria-hidden="true">&#9873;</span><span class="marker-label">${escapeHtml(label)}</span></span>`,
    );
  });

  if (player && targets.length === 1 && players.length === 1) {
    const targetPoint = pointFor(targets[0]);
    const playerPoint = pointFor(player);
    const dx = targetPoint.x - playerPoint.x;
    const dy = targetPoint.y - playerPoint.y;
    const lineLength = Math.sqrt(dx ** 2 + dy ** 2);
    const lineAngle = (Math.atan2(dy, dx) * 180) / Math.PI;
    overlay.push(
      `<span class="map-route-line" style="left:${playerPoint.x}px;top:${playerPoint.y}px;width:${lineLength}px;transform:rotate(${lineAngle}deg)"></span>`,
    );
  }

  players.forEach((item, index) => {
    const playerPoint = pointFor(item);
    const label = item.label || "Equipe";
    overlay.push(
      `<span class="map-marker marker-player marker-index-${index % 6}" style="left:${playerPoint.x}px;top:${playerPoint.y}px"><span class="marker-symbol" aria-hidden="true"></span><span class="marker-label">${escapeHtml(label)}</span></span>`,
    );
  });

  tiles.innerHTML = tileMarkup.join("");
  layer.innerHTML = overlay.join("");
}

function normalizeAnswer(value) {
  return value
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase();
}

function getPuzzleImage(puzzle) {
  return puzzle?.image?.dataUrl ? puzzle.image : null;
}

function getRouteCoverImage(route) {
  return route?.coverImage?.dataUrl ? route.coverImage : null;
}

function preparePuzzleImage(file) {
  if (!file || !file.type.startsWith("image/")) {
    return Promise.reject(new Error("Choisissez un fichier image."));
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("L’image n’a pas pu être lue."));
    reader.onload = () => {
      const image = new Image();
      image.onerror = () => reject(new Error("Cette image ne peut pas être utilisée."));
      image.onload = () => {
        try {
          const maxSide = 1200;
          const scale = Math.min(1, maxSide / Math.max(image.width, image.height));
          const canvas = document.createElement("canvas");
          canvas.width = Math.max(1, Math.round(image.width * scale));
          canvas.height = Math.max(1, Math.round(image.height * scale));
          const context = canvas.getContext("2d");
          if (!context) {
            reject(new Error("L’image n’a pas pu être préparée."));
            return;
          }
          context.fillStyle = "#ffffff";
          context.fillRect(0, 0, canvas.width, canvas.height);
          context.imageSmoothingQuality = "high";
          context.drawImage(image, 0, 0, canvas.width, canvas.height);
          resolve({
            dataUrl: canvas.toDataURL("image/jpeg", 0.82),
            name: file.name,
          });
        } catch {
          reject(new Error("L’image n’a pas pu être préparée."));
        }
      };
      image.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

function prepareRouteCoverImage(file) {
  return preparePuzzleImage(file);
}

function ensureTeamState(team) {
  team.answers ||= {};
  team.unlockedPuzzleIds ||= [];
  team.attempts ||= {};
  team.hints ||= {};
  team.photoNames ||= {};
  team.status ||= team.startAt ? "playing" : "briefing";
  team.updatedAt ||= team.startAt || Date.now();
}

function checkGameStatus(team, route) {
  if (!team || !route || team.status !== "playing") return;
  const progress = getTeamProgress(team, route);
  if (progress.solved >= route.puzzles.length) {
    team.status = "won";
    if (typeof exitPlayerNavigationV183 === "function") exitPlayerNavigationV183();
    team.finishedAt = Date.now();
    touchTeam(team);
    saveData({ immediate: true });
    showToast("Bravo, parcours termine !");
    return;
  }
  if (remainingSeconds(team, route) <= 0 && !team.timeExpiredAt) {
    team.timeExpiredAt = Date.now();
    touchTeam(team);
    saveData({ immediate: true });
    showToast("Temps ecoule, mais vous pouvez continuer le parcours.");
  }
}

function startTicker() {
  clearInterval(ticker);
  ticker = setInterval(() => {
    const now = Date.now();
    const team = getCurrentTeam();
    if (team) {
      const route = getRoute(team.routeId);
      const previousStatus = team.status;
      checkGameStatus(team, route);
      renderPlayerClockV184(team, route);
      const renderKey = getPlayerRenderKeyV184(team, route);
      const needsFullRender = location.hash === "#player" && (
        renderKey !== playerRenderKeyV184
        || previousStatus !== team.status
        || now - playerLastFullRenderAtV184 >= 30000
      );
      if (needsFullRender) {
        playerRenderKeyV184 = renderKey;
        playerLastFullRenderAtV184 = now;
        renderPlayer();
      }
      if (geolocationWatchId === null || now - lastPlayerPositionRefreshAt >= 90000) requestPlayerPositionRefresh();
    }
    if (isAdminRouteActive() && adminAuthenticated && now - lastLiveTeamRefreshAt > 5000) {
      refreshLiveTeamsFromServer();
    }
    if (isAdminRouteActive() && adminAuthenticated) renderTeamTable();
  }, 1000);
}

function render() {
  renderPlayer();
  renderAdmin();
}

function renderShop() {
  if (!els.shopList || !els.shopEmpty) return;
  if (canUseBackend() && initialShopServerSyncPending) {
    els.shopList.innerHTML = "";
    els.shopEmpty.textContent = initialShopServerSyncFailed
      ? "Connexion au serveur temporairement indisponible. Nouvel essai automatique en cours."
      : "Chargement des parcours...";
    return;
  }
  const routes = getShopRoutes();
  const selectedTeamCounts = new Map(
    $$("[data-shop-player-count]").map((input) => [input.dataset.shopPlayerCount, input.value]),
  );
  els.shopEmpty.textContent = routes.length
    ? ""
    : "Aucun parcours n\u2019est ouvert \u00e0 la vente pour le moment.";
  els.shopList.innerHTML = routes
    .map((route) => {
      const price = getRoutePrice(route);
      const distance = formatRouteDistance(route);
      const coverImage = getRouteCoverImage(route);
      const teamCount = Math.min(20, Math.max(1, Number(selectedTeamCounts.get(route.id)) || 1));
      return `
        <article class="shop-route-card">
          <div class="shop-route-visual ${coverImage ? "has-image" : ""}" aria-hidden="true">
            ${coverImage ? `<img src="${escapeHtml(coverImage.dataUrl)}" alt="" />` : ""}
            <span>${escapeHtml(route.area || "Erez\u00e9e")}</span>
            <strong>${escapeHtml(distance)}</strong>
          </div>
          <div class="shop-route-copy">
            <span class="shop-badge">${escapeHtml(route.area || "Erez\u00e9e")}</span>
            <h3>${escapeHtml(route.title)}</h3>
            <p>${escapeHtml(route.description || "Parcours ext\u00e9rieur \u00e0 Erez\u00e9e.")}</p>
            <div class="metric-strip">
              <span class="metric">${route.duration || 90} min</span>
              <span class="metric">${escapeHtml(distance)}</span>
              <span class="metric">${route.puzzles?.length || 0} \u00e9nigmes</span>
              <span class="metric">${formatPrice(price)} / \u00e9quipe</span>
            </div>
          </div>
          <form class="shop-buy-form" data-shop-route="${escapeHtml(route.id)}">
            <label>
              Nombre d\u2019\u00e9quipes
              <input name="players" type="number" min="1" max="20" value="${teamCount}" data-shop-player-count="${escapeHtml(route.id)}" />
              <span class="shop-team-note">Maximum conseill\u00e9 : 6 joueurs par \u00e9quipe.</span>
            </label>
            <strong data-shop-total="${escapeHtml(route.id)}">${formatPrice(price * teamCount)}</strong>
            <button class="primary-button full-button" type="submit">Acheter</button>
            <p class="form-message" data-shop-message="${escapeHtml(route.id)}"></p>
          </form>
        </article>
      `;
    })
    .join("");

  $$("[data-shop-player-count]").forEach((input) => {
    input.addEventListener("input", updateShopTotal);
    input.addEventListener("change", updateShopTotal);
  });
  $$("[data-shop-route]").forEach((form) => {
    form.addEventListener("submit", startCheckout);
  });
}


function updateShopTotal(event) {
  const routeId = event.currentTarget.dataset.shopPlayerCount;
  const route = getRoute(routeId);
  if (!route) return;
  const teamCount = Math.min(20, Math.max(1, Number(event.currentTarget.value) || 1));
  event.currentTarget.value = String(teamCount);
  const total = els.shopList.querySelector(`[data-shop-total="${routeId}"]`);
  if (total) total.textContent = formatPrice(getRoutePrice(route) * teamCount);
}


async function startCheckout(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const routeId = form.dataset.shopRoute;
  const route = getRoute(routeId);
  const message = form.querySelector(`[data-shop-message="${routeId}"]`);
  const teamCount = Math.min(20, Math.max(1, Number(new FormData(form).get("players")) || 1));
  if (!route || !isRouteVisibleInShop(route)) {
    if (message) message.textContent = "Ce parcours n\u2019est pas disponible \u00e0 la vente.";
    return;
  }
  if (!canUseBackend()) {
    if (message) message.textContent = "Le paiement sera disponible sur le site en ligne.";
    return;
  }

  const button = form.querySelector("button[type='submit']");
  if (button) button.disabled = true;
  if (message) message.textContent = "Pr\u00e9paration du paiement s\u00e9curis\u00e9...";

  try {
    const response = await fetch(API_CHECKOUT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ routeId, teamCount, playerCount: teamCount }),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok || !payload.url) {
      throw new Error(payload.message || "Paiement indisponible pour le moment.");
    }
    window.location.href = payload.url;
  } catch (error) {
    if (message) message.textContent = error.message || "Paiement indisponible pour le moment.";
    if (button) button.disabled = false;
  }
}


function getRouteBriefingText(route) {
  return route?.briefingText?.trim()
    || route?.description?.trim()
    || "Prenez le temps de lire la mission, puis rejoignez le point de d\u00e9part avant de lancer le chrono.";
}

function getRouteFinishMessage(route) {
  return route?.finishMessage?.trim() || "";
}

function getPuzzleArrivalMessage(puzzle, distance, accuracyText = "") {
  const customMessage = puzzle?.arrivalMessage?.trim();
  if (customMessage) return customMessage;
  return `Vous \u00eates dans la bonne zone, \u00e0 ${Math.round(distance)} m du point.${accuracyText}`;
}


function getRouteStartRadius(route) {
  const configuredRadius = Number(route?.startRadius);
  if (Number.isFinite(configuredRadius) && configuredRadius > 0) {
    return Math.min(1000, Math.max(20, configuredRadius));
  }
  const firstPuzzleRadius = getPuzzleRadius(route?.puzzles?.[0]);
  return Math.min(1000, Math.max(80, firstPuzzleRadius, 120));
}

function getBriefingStoredPosition(team) {
  if (isUsablePosition(team?.briefingStartLocation)) return team.briefingStartLocation;
  if (isUsablePosition(team?.lastPosition)) return team.lastPosition;
  return null;
}

function getBriefingStartState(team, route) {
  const start = getRouteStart(route);
  const hasCoordinates = Number.isFinite(start.lat) && Number.isFinite(start.lng);
  if (!hasCoordinates) {
    return {
      canStart: true,
      hasCoordinates: false,
      position: null,
      distance: null,
      radius: null,
    };
  }

  const radius = getRouteStartRadius(route);
  const position = getBriefingStoredPosition(team);
  if (!position) {
    return {
      canStart: false,
      hasCoordinates: true,
      position: null,
      distance: null,
      radius,
    };
  }

  const distance = distanceInMeters(position.lat, position.lng, start.lat, start.lng);
  const inside = distance <= radius;
  return {
    canStart: inside,
    hasCoordinates: true,
    position,
    distance,
    radius,
  };
}

function formatBriefingDistance(distance) {
  if (!Number.isFinite(distance)) return "";
  if (distance < 1000) return `${Math.max(0, Math.round(distance))} m`;
  return `${(distance / 1000).toFixed(1).replace(".", ",")} km`;
}

function setBriefingLocationMessage(kind, message) {
  if (!els.briefingLocationStatus) return;
  els.briefingLocationStatus.textContent = message;
  els.briefingLocationStatus.classList.toggle("is-ready", kind === "ready");
  els.briefingLocationStatus.classList.toggle("is-blocked", kind === "blocked");
  els.briefingLocationStatus.classList.toggle("is-active", kind === "active");
  els.briefingLocationStatus.classList.toggle("is-error", kind === "error");
}

function updateBriefingLocationUi(team, route, forcedMessage = null) {
  if (!els.briefingLocationStatus || !els.startAdventureButton) return;
  const state = getBriefingStartState(team, route);
  const shouldBlock = team?.status === "briefing" && !state.canStart;
  els.startAdventureButton.disabled = shouldBlock;
  els.startAdventureButton.setAttribute("aria-disabled", shouldBlock ? "true" : "false");

  if (els.briefingLocateButton) {
    els.briefingLocateButton.hidden = !state.hasCoordinates;
    els.briefingLocateButton.disabled = briefingGeolocationWatchId !== null;
    els.briefingLocateButton.textContent = state.position ? "Actualiser ma position" : "Me localiser au depart";
  }

  if (forcedMessage) {
    setBriefingLocationMessage(forcedMessage.kind, forcedMessage.text);
    return;
  }

  if (!state.hasCoordinates) {
    setBriefingLocationMessage("ready", "Aucune zone GPS de depart n'est configuree pour ce parcours. Vous pouvez commencer.");
    return;
  }

  if (!state.position) {
    setBriefingLocationMessage("blocked", "Localisez votre equipe au point de depart avant de commencer l'aventure.");
    return;
  }

  const accuracy = Number(state.position.accuracy);
  const accuracyText = Number.isFinite(accuracy) ? ` Precision +/-${Math.round(accuracy)} m.` : "";
  if (state.canStart) {
    setBriefingLocationMessage("ready", `Position validee au point de depart. Vous pouvez commencer.${accuracyText}`);
    return;
  }

  const remaining = Math.max(0, state.distance - state.radius);
  setBriefingLocationMessage("blocked", `Vous etes a ${formatBriefingDistance(state.distance)} du depart. Rapprochez-vous encore de ${formatBriefingDistance(remaining)} pour commencer.${accuracyText}`);
}

function canStartAdventureFromBriefing(team, route) {
  return getBriefingStartState(team, route).canStart;
}

function stopBriefingGeolocationWatch() {
  if (briefingGeolocationWatchId === null || !navigator.geolocation) return;
  navigator.geolocation.clearWatch(briefingGeolocationWatchId);
  briefingGeolocationWatchId = null;
}

async function handleBriefingGeolocationPosition(position) {
  const team = getCurrentTeam();
  if (!team || team.status !== "briefing") {
    stopBriefingGeolocationWatch();
    return;
  }

  const route = getRoute(team.routeId);
  const start = getRouteStart(route);
  if (!route || !Number.isFinite(start.lat) || !Number.isFinite(start.lng)) {
    updateBriefingLocationUi(team, route);
    stopBriefingGeolocationWatch();
    return;
  }

  const radius = getRouteStartRadius(route);
  const lat = position.coords.latitude;
  const lng = position.coords.longitude;
  const distance = distanceInMeters(lat, lng, start.lat, start.lng);
  const inside = distance <= radius;
  const capturedAt = Date.now();
  const lastPosition = {
    lat,
    lng,
    accuracy: position.coords.accuracy,
    at: capturedAt,
  };
  team.lastPosition = lastPosition;
  team.briefingStartLocation = {
    ...lastPosition,
    distance,
    radius,
    inside,
  };
  touchTeam(team);
  saveData({ immediate: true });
  renderBriefing(route);

  if (inside) {
    stopBriefingGeolocationWatch();
    updateBriefingLocationUi(team, route);
    showToast("Position validee au point de depart.");
  }
}

function handleBriefingGeolocationError() {
  const team = getCurrentTeam();
  const route = team ? getRoute(team.routeId) : null;
  stopBriefingGeolocationWatch();
  updateBriefingLocationUi(team, route, {
    kind: "error",
    text: "Position non disponible. Verifiez l'autorisation GPS puis reessayez.",
  });
}

function locateBriefingStart() {
  const team = getCurrentTeam();
  if (!team || team.status !== "briefing") return;
  const route = getRoute(team.routeId);
  const start = getRouteStart(route);
  if (!route || !Number.isFinite(start.lat) || !Number.isFinite(start.lng)) {
    updateBriefingLocationUi(team, route);
    return;
  }

  if (!navigator.geolocation) {
    updateBriefingLocationUi(team, route, {
      kind: "error",
      text: "La geolocalisation n'est pas disponible sur cet appareil.",
    });
    return;
  }

  if (briefingGeolocationWatchId !== null) {
    updateBriefingLocationUi(team, route, {
      kind: "active",
      text: "Recherche de votre position au point de depart...",
    });
    return;
  }

  requestPlayerOrientationPermissionV185({ showNotice: true, briefing: true });
  stopGeolocationWatch();
  updateBriefingLocationUi(team, route, {
    kind: "active",
    text: "Recherche de votre position au point de depart...",
  });
  briefingGeolocationWatchId = navigator.geolocation.watchPosition(
    handleBriefingGeolocationPosition,
    handleBriefingGeolocationError,
    { enableHighAccuracy: true, maximumAge: 1000, timeout: 15000 },
  );
  if (els.briefingLocateButton) els.briefingLocateButton.disabled = true;
}

function renderBriefing(route) {
  if (!els.briefingPanel || !route) return;
  const team = getCurrentTeam();
  const start = getRouteStart(route);
  const hasCoordinates = Number.isFinite(start.lat) && Number.isFinite(start.lng);
  const coordinateLabel = hasCoordinates ? `GPS ${formatCoordinate(start.lat)}, ${formatCoordinate(start.lng)}` : "";
  const startDetails = [start.place, start.address, coordinateLabel].filter(Boolean).join(" " + String.fromCharCode(183) + " ");
  const mapTarget = hasCoordinates
    ? { lat: start.lat, lng: start.lng }
    : { ...DEFAULT_CENTER };
  const startRadius = getRouteStartRadius(route);
  const locationState = getBriefingStartState(team, route);
  const playerPosition = isUsablePosition(locationState.position)
    ? { ...locationState.position, label: "Vous" }
    : null;

  els.briefingTitle.textContent = publicRouteTextV156(route, "title") || publicMessageV156("Votre mission");
  els.briefingText.textContent = publicRouteTextV156(route, "briefingText") || getRouteBriefingText(route);
  els.briefingStartText.textContent = startDetails || "Le point de d\u00e9part sera communiqu\u00e9 sur place.";
  if (els.briefingDirectionsLink) {
    els.briefingDirectionsLink.href = getRouteStartDirectionsUrl(route);
  }
  renderTileMap(els.briefingMap, {
    target: mapTarget,
    targets: [{ ...mapTarget, radius: startRadius, label: "D\u00e9part" }],
    player: playerPosition,
    fitToPoints: Boolean(playerPosition && hasCoordinates),
    zoom: MAP_ZOOM,
    editable: false,
  });
  updateBriefingLocationUi(team, route);
}


/* player-i18n-source-v151 */
function playerLangV151() {
  const active = document.querySelector("#language-switcher [aria-pressed='true'], #language-switcher .is-active");
  const candidate = active?.dataset?.lang || (typeof escapeI18nLanguage === "function" ? escapeI18nLanguage() : "") || (document.documentElement.lang || "fr").slice(0, 2);
  return ["fr", "en", "nl"].includes(candidate) ? candidate : "fr";
}

function playerLabelV151(key) {
  const labels = {
    fr: {
      route: "Parcours",
      ready: "Pret",
      won: "Gagne",
      lost: "Perdu",
      playing: "En cours",
      briefing: "Briefing",
      routeFinished: "Parcours termine",
      lockedZone: "Rendez-vous dans la zone indiquee sur la carte pour debloquer cette enigme.",
      puzzleSingular: "enigme",
      puzzlePlural: "enigmes",
    },
    en: {
      route: "Route",
      ready: "Ready",
      won: "Won",
      lost: "Lost",
      playing: "In progress",
      briefing: "Briefing",
      routeFinished: "Route completed",
      lockedZone: "Go to the area shown on the map to unlock this puzzle.",
      puzzleSingular: "puzzle",
      puzzlePlural: "puzzles",
    },
    nl: {
      route: "Route",
      ready: "Klaar",
      won: "Gewonnen",
      lost: "Verloren",
      playing: "Bezig",
      briefing: "Briefing",
      routeFinished: "Route voltooid",
      lockedZone: "Ga naar de zone op de kaart om dit raadsel te ontgrendelen.",
      puzzleSingular: "raadsel",
      puzzlePlural: "raadsels",
    },
  };
  const lang = playerLangV151();
  return labels[lang]?.[key] || labels.fr[key] || key;
}

function playerPuzzleCountLabelV151(total) {
  const count = Number(total) || 0;
  return count + " " + playerLabelV151(count > 1 ? "puzzlePlural" : "puzzleSingular");
}

function playerProgressLabelV151(solved, total) {
  return (Number(solved) || 0) + " / " + (Number(total) || 0) + " " + playerLabelV151(Number(total) > 1 ? "puzzlePlural" : "puzzleSingular");
}

function playerStepLabelV151(step, total) {
  const lang = playerLangV151();
  const prefix = lang === "nl" ? "Stap" : lang === "en" ? "Step" : "Etape";
  return prefix + " " + step + " / " + total;
}

function playerCurrentStepLabelV151(status, step, total) {
  if (status === "won") return playerLabelV151("routeFinished");
  if (status === "briefing") return playerLabelV151("briefing");
  return playerStepLabelV151(step, total);
}

function playerStatusLabelV151(status) {
  if (status === "briefing") return playerLabelV151("briefing");
  if (status === "won") return playerLabelV151("won");
  if (status === "lost") return playerLabelV151("lost");
  return playerLabelV151("playing");
}

function playerTeamNameV151(name) {
  const value = String(name || "");
  const match = value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").match(/^Equipe\s+(\d+)$/i);
  if (match && playerLangV151() !== "fr") return "Team " + match[1];
  return value;
}


function renderRouteSummary(team, route, progress, currentIndex) {
  const step = Math.min(progress.total, Math.max(1, currentIndex + 1 || 1));
  els.routeArea.textContent = publicRouteTextV156(route, "area") || playerLabelV151("route");
  els.routeTitle.textContent = publicRouteTextV156(route, "title") || playerLabelV151("route");
  if (els.routeDuration) els.routeDuration.textContent = `${route.duration || 0} min`;
  if (els.routeDistance) els.routeDistance.textContent = formatRouteDistance(route);
  if (els.routePuzzleCount) {
    els.routePuzzleCount.textContent = playerPuzzleCountLabelV151(progress.total);
  }
  if (els.routeCurrentStep) {
    els.routeCurrentStep.textContent = playerCurrentStepLabelV151(team.status, step, progress.total);
  }

  const cover = getRouteCoverImage(route);
  if (!els.routeHero) return;
  els.routeHero.classList.toggle("has-cover", Boolean(cover));
  els.routeHero.style.backgroundImage = cover
    ? `linear-gradient(135deg, rgba(12, 34, 29, 0.9), rgba(18, 60, 50, 0.62)), url("${cover.dataUrl}")`
    : "";
}



/* player-puzzle-i18n-v154 */
function playerPuzzleTextV154(puzzle, field) {
  const value = String(puzzle?.[field] || "");
  if (!value) return "";
  return typeof escapeI18nTranslateText === "function" ? escapeI18nTranslateText(value) : value;
}

function playerPuzzleHintTextV154(puzzle, index) {
  const value = String(puzzle?.hints?.[index]?.text || "");
  if (!value) return "";
  return typeof escapeI18nTranslateText === "function" ? escapeI18nTranslateText(value) : value;
}

function playerPuzzleMessageV154(value) {
  const text = String(value || "");
  if (!text) return "";
  return typeof escapeI18nTranslateText === "function" ? escapeI18nTranslateText(text) : text;
}

function renderPlayer() {
  const team = getCurrentTeam();
  const route = team ? getRoute(team.routeId) : null;

  if (location.hash === "#shop") renderShop();
  els.resetSessionButton.style.display = team ? "inline-flex" : "none";
  els.loginPanel.classList.toggle("is-hidden", Boolean(team));
  els.gamePanel.classList.toggle("is-hidden", !team);

  if (!team || !route) {
    stopGeolocationWatch();
    return;
  }

  ensureTeamState(team);
  checkGameStatus(team, route);

  const progress = getTeamProgress(team, route);
  const currentPuzzle = getCurrentPuzzle(team, route);
  const currentIndex = route.puzzles.findIndex((puzzle) => puzzle.id === currentPuzzle?.id);
  const elapsed = elapsedSeconds(team);
  const isBriefing = team.status === "briefing";
  if (isBriefing) {
    stopGeolocationWatch();
  }

  renderTeamIdentity(team);
  els.countdown.textContent = isBriefing ? playerLabelV151("ready") : formatPlayerClockV186(team, route);
  renderRouteSummary(team, route, progress, currentIndex);
  renderStartPoint(route);
  els.progressText.textContent = playerProgressLabelV151(progress.solved, progress.total);
  els.elapsedTime.textContent = `${Math.floor(elapsed / 60)} min`;
  els.progressFill.style.width = `${progress.percent}%`;

  const statusLabel = getPlayerStatusLabelV186(team, route);
  els.gameStatus.textContent = statusLabel;
  els.gameStatus.classList.toggle("is-success", team.status === "won");
  els.gameStatus.classList.toggle("is-danger", team.status === "lost");
  els.gameStatus.classList.toggle("is-briefing", isBriefing);
  els.gameStatus.classList.toggle("is-overtime", isTeamOvertimeV186(team, route));

  const gameFinished = team.status === "won" || team.status === "lost";
  els.briefingPanel?.classList.toggle("is-hidden", !isBriefing);
  els.routeHero?.classList.toggle("is-hidden", isBriefing);
  els.finishPanel.classList.toggle("is-hidden", !gameFinished);
  els.startPointCard?.classList.toggle("is-hidden", !isBriefing);
  els.progressBlock?.classList.toggle("is-hidden", isBriefing);
  els.mapPanel.classList.toggle("is-hidden", gameFinished || isBriefing);
  els.riddleCard.classList.toggle("is-hidden", gameFinished || isBriefing);

  if (isBriefing) {
    renderBriefing(route);
    return;
  }

  if (gameFinished) {
    stopGeolocationWatch();
    renderFinishPanel(team, route);
    return;
  }

  if (!currentPuzzle) {
    stopGeolocationWatch();
    return;
  }

  const unlocked = !currentPuzzle.requireLocation || team.unlockedPuzzleIds.includes(currentPuzzle.id);
  if (geolocationWatchId !== null) {
    geolocationWatchPuzzleId = currentPuzzle.id;
  }
  renderPlayerMap(team, currentPuzzle);
  els.stepNumber.textContent = String(Math.max(currentIndex + 1, 1));
  els.stepPlace.textContent = publicPuzzleTextV156(route, currentPuzzle, "place");
  els.stepTitle.textContent = publicPuzzleTextV156(route, currentPuzzle, "title");
  els.riddleText.textContent = unlocked
    ? publicPuzzleTextV156(route, currentPuzzle, "question")
    : playerLabelV151("lockedZone");
  renderPuzzleMedia(currentPuzzle, unlocked);
  els.locateButton.disabled = team.status !== "playing";
  if (els.demoUnlockButton) {
    els.demoUnlockButton.disabled = !currentPuzzle.requireLocation || team.status !== "playing" || unlocked;
  }
  const answerRenderKey = [
    team.id,
    currentPuzzle.id,
    currentPuzzle.type,
    unlocked ? "unlocked" : "locked",
    team.status,
    team.answers[currentPuzzle.id] ? "answered" : "pending",
  ].join("|");

  if (els.answerZone.dataset.renderKey !== answerRenderKey) {
    els.answerZone.dataset.renderKey = answerRenderKey;
    els.answerMessage.textContent = "";
    renderAnswerZone(team, route, currentPuzzle, unlocked);
  }
  renderHint(team, currentPuzzle, unlocked);
}

function renderTeamIdentity(team) {
  els.teamName.textContent = playerTeamNameV151(team.name);
  if (document.activeElement !== els.teamNameInput) {
    els.teamNameInput.value = team.name;
  }
}

function renderFinishPanel(team, route) {
  const ranking = getRouteRanking(route);
  const currentRankIndex = ranking.findIndex((entry) => entry.team.id === team.id);
  const hasWon = team.status === "won";
  const progress = getTeamProgress(team, route);

  els.finishPanel.classList.toggle("is-won", hasWon);
  els.finishPanel.classList.toggle("is-lost", !hasWon);
  els.finishLabel.textContent = hasWon ? "Parcours réussi" : "Partie perdue";
  els.finishTitle.textContent = hasWon ? "Félicitations !" : "Le temps est écoulé";
  const customFinishMessage = publicRouteTextV156(route, "finishMessage") || getRouteFinishMessage(route);
  els.finishSubtitle.textContent = hasWon
    ? customFinishMessage || `${team.name} a terminé "${route.title}".`
    : `${team.name} n’a pas terminé "${route.title}" dans le temps imparti.`;
  els.finishTime.textContent = formatDuration(elapsedSeconds(team));
  els.finishScore.textContent = `${progress.solved} / ${progress.total}`;
  els.finishRank.textContent = hasWon && currentRankIndex >= 0 ? `#${currentRankIndex + 1}` : "Non classé";

  els.rankingList.innerHTML = ranking.length
    ? ranking
        .slice(0, 10)
        .map((entry, index) => `
          <li class="${entry.team.id === team.id ? "is-current" : ""}">
            <span class="rank-number">${index + 1}</span>
            <strong>${escapeHtml(entry.team.name)}</strong>
            <span class="rank-time">${formatDuration(entry.seconds)}</span>
          </li>
        `)
        .join("")
    : `<li><span class="rank-number">--</span><strong>Aucune équipe gagnante pour le moment</strong><span class="rank-time">--</span></li>`;
}

/* player-map-guidance-v182 */
function playerMapLanguageV182() {
  if (typeof playerLangV151 === "function") return playerLangV151();
  const active = document.querySelector("#language-switcher [aria-pressed='true'], #language-switcher .is-active");
  const language = active?.dataset?.lang || (document.documentElement.lang || "fr").slice(0, 2);
  return ["fr", "en", "nl"].includes(language) ? language : "fr";
}

function playerMapLabelsV182() {
  const labels = {
    fr: {
      you: "Vous",
      target: "Prochaine étape",
      waiting: "Activez votre position pour commencer le guidage.",
      inside: "Vous êtes dans la zone de l'étape.",
      remaining: (distance, direction) => "Encore " + distance + " vers la zone · direction " + direction,
      updated: (time, accuracy) => "Position actualisée à " + time + accuracy,
      accuracy: (meters) => " · précision ±" + meters + " m",
      directions: "Itinéraire à pied",
    },
    en: {
      you: "You",
      target: "Next stop",
      waiting: "Enable your location to start guidance.",
      inside: "You are inside the stop area.",
      remaining: (distance, direction) => distance + " left to the area · head " + direction,
      updated: (time, accuracy) => "Position updated at " + time + accuracy,
      accuracy: (meters) => " · accuracy ±" + meters + " m",
      directions: "Walking directions",
    },
    nl: {
      you: "Jij",
      target: "Volgende halte",
      waiting: "Activeer je locatie om de begeleiding te starten.",
      inside: "Je bent in de zone van de halte.",
      remaining: (distance, direction) => "Nog " + distance + " tot de zone · richting " + direction,
      updated: (time, accuracy) => "Positie bijgewerkt om " + time + accuracy,
      accuracy: (meters) => " · nauwkeurigheid ±" + meters + " m",
      directions: "Wandelroute",
    },
  };
  return labels[playerMapLanguageV182()] || labels.fr;
}

function playerMapDistanceV182(meters) {
  const value = Math.max(0, Number(meters) || 0);
  if (value < 1000) return Math.round(value) + " m";
  return (value / 1000).toFixed(1).replace(".", ",") + " km";
}

function playerMapBearingV182(from, to) {
  const toRad = (value) => (value * Math.PI) / 180;
  const toDeg = (value) => (value * 180) / Math.PI;
  const lat1 = toRad(Number(from.lat));
  const lat2 = toRad(Number(to.lat));
  const deltaLng = toRad(Number(to.lng) - Number(from.lng));
  const y = Math.sin(deltaLng) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(deltaLng);
  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

function playerMapCardinalV182(bearing) {
  const directionsByLanguage = {
    fr: ["N", "NE", "E", "SE", "S", "SO", "O", "NO"],
    en: ["N", "NE", "E", "SE", "S", "SW", "W", "NW"],
    nl: ["N", "NO", "O", "ZO", "Z", "ZW", "W", "NW"],
  };
  const directions = directionsByLanguage[playerMapLanguageV182()] || directionsByLanguage.fr;
  return directions[Math.round(Number(bearing) / 45) % 8];
}

function updatePlayerMapGuidanceV182(team, puzzle, target, playerPosition) {
  const labels = playerMapLabelsV182();
  const status = document.querySelector("#player-map-guidance-status");
  const detail = document.querySelector("#player-map-guidance-detail");
  const youLegend = document.querySelector("#player-map-legend-you");
  const targetLegend = document.querySelector("#player-map-legend-target");
  const directionsLink = document.querySelector("#player-directions-link");
  if (youLegend) youLegend.textContent = labels.you;
  if (targetLegend) targetLegend.textContent = labels.target;
  if (directionsLink) {
    directionsLink.textContent = labels.directions;
    directionsLink.href = "https://www.google.com/maps/dir/?api=1&destination=" + encodeURIComponent(target.lat) + "," + encodeURIComponent(target.lng) + "&travelmode=walking";
  }
  if (!status || !detail) return;
  if (!isUsablePosition(playerPosition)) {
    status.textContent = labels.waiting;
    detail.textContent = "";
    return;
  }
  const distance = distanceInMeters(playerPosition.lat, playerPosition.lng, target.lat, target.lng);
  const radius = getPuzzleRadius(puzzle);
  const remaining = Math.max(0, distance - radius);
  const direction = playerMapCardinalV182(playerMapBearingV182(playerPosition, target));
  status.textContent = distance <= radius ? labels.inside : labels.remaining(playerMapDistanceV182(remaining), direction);
  const accuracyValue = Number(playerPosition.accuracy);
  const accuracy = Number.isFinite(accuracyValue) ? labels.accuracy(Math.round(accuracyValue)) : "";
  const updatedAt = Number(playerPosition.at || team?.updatedAt || Date.now());
  const locale = playerMapLanguageV182() === "nl" ? "nl-BE" : playerMapLanguageV182() === "en" ? "en-GB" : "fr-BE";
  const time = new Date(updatedAt).toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" });
  detail.textContent = labels.updated(time, accuracy);
}

function renderPlayerMap(team, puzzle) {
  const target = {
    lat: getPuzzleLat(puzzle),
    lng: getPuzzleLng(puzzle),
  };
  const labels = playerMapLabelsV182();
  const playerPosition = isUsablePosition(team.lastPosition)
    ? { ...team.lastPosition, label: labels.you }
    : null;
  renderTileMap(els.playerMap, {
    target,
    targets: [{ ...target, radius: getPuzzleRadius(puzzle), label: labels.target }],
    radius: getPuzzleRadius(puzzle),
    player: playerPosition,
    fitToPlayer: true,
    editable: false,
  });
  updatePlayerMapGuidanceV183(team, puzzle, target, playerPosition);
}

/* player-inapp-guidance-v183 */
let playerNavigationActiveV183 = false;
let playerCompassHeadingV183 = null;
let playerMovementHeadingV183 = null;
let playerCompassBoundV183 = false;
let playerWakeLockV183 = null;
let playerGuidanceContextV183 = null;
let playerArrivalBuzzPuzzleV183 = null;

function playerGuidanceLabelsV183() {
  const labels = {
    fr: {
      navigation: "Mode guidage",
      exit: "Quitter le guidage",
      waiting: "Activez votre position",
      toZone: "jusqu'à la zone",
      arrived: "Vous êtes arrivé dans la zone",
      direction: (value) => "Direction " + value,
      compass: "La flèche suit l'orientation du téléphone",
      fallback: "Direction générale sur une carte orientée au nord",
      precise: (value) => "GPS précis à ±" + value + " m",
      weak: (value) => "Signal GPS imprécis (±" + value + " m) · placez-vous à découvert",
      stale: "Position ancienne · relancez la géolocalisation",
      safety: "Suivez les chemins autorisés et arrêtez-vous pour consulter l'écran.",
    },
    en: {
      navigation: "Guidance mode",
      exit: "Exit guidance",
      waiting: "Enable your location",
      toZone: "to the target area",
      arrived: "You have reached the target area",
      direction: (value) => "Direction " + value,
      compass: "The arrow follows your phone orientation",
      fallback: "General direction on a north-up map",
      precise: (value) => "GPS accuracy ±" + value + " m",
      weak: (value) => "Weak GPS signal (±" + value + " m) · move into an open area",
      stale: "Old position · restart location tracking",
      safety: "Stay on authorised paths and stop walking before checking the screen.",
    },
    nl: {
      navigation: "Navigatiemodus",
      exit: "Navigatie afsluiten",
      waiting: "Activeer je locatie",
      toZone: "tot de doelzone",
      arrived: "Je bent in de doelzone aangekomen",
      direction: (value) => "Richting " + value,
      compass: "De pijl volgt de richting van je telefoon",
      fallback: "Algemene richting op een kaart met het noorden bovenaan",
      precise: (value) => "GPS-nauwkeurigheid ±" + value + " m",
      weak: (value) => "Zwak GPS-signaal (±" + value + " m) · ga naar een open plek",
      stale: "Oude positie · start de lokalisatie opnieuw",
      safety: "Blijf op toegestane paden en stop met wandelen voordat je op het scherm kijkt.",
    },
  };
  return labels[playerMapLanguageV182()] || labels.fr;
}

function normalizeGuidanceAngleV183(value) {
  return ((Number(value) % 360) + 360) % 360;
}

/* player-compass-smooth-v188 */
const PLAYER_COMPASS_ACTIVE_INTERVAL_V188 = 1000;
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

function handlePlayerOrientationV183(event) {
  if (document.visibilityState === "hidden") return;
  const heading = playerEventHeadingV188(event);
  if (!Number.isFinite(heading)) return;
  playerCompassPermissionStateV185 = "granted";
  playerScheduleHeadingPaintV188(heading);
}

async function enablePlayerCompassV183() {
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

async function requestPlayerWakeLockV183() {
  // Disabled in v184 to reduce heat and battery use during long games.
}

async function releasePlayerWakeLockV183() {
  try {
    await playerWakeLockV183?.release?.();
  } catch {
    // The browser may already have released it while the tab was hidden.
  }
  playerWakeLockV183 = null;
}

async function enterPlayerNavigationV183() {
  const panel = document.querySelector("#player-map")?.closest(".map-panel");
  if (!panel) return;
  playerNavigationActiveV183 = true;
  restartPlayerTrackingForModeV189();
  playerResetCompassSmoothingV188();
  if (Number.isFinite(playerCompassHeadingV183)) applyPlayerMapHeadingV184(playerCompassHeadingV183);
  panel.classList.add("is-navigation-mode");
  document.body.classList.add("player-navigation-open");
  document.querySelector("#player-navigation-button")?.setAttribute("aria-pressed", "true");
  delete document.querySelector("#player-map")?.dataset?.mapManualZoom;
  rerenderMap(document.querySelector("#player-map"));
  requestPlayerPositionRefresh(true);
  await enablePlayerCompassV183();
  await requestPlayerWakeLockV183();
}

async function exitPlayerNavigationV183() {
  const panel = document.querySelector("#player-map")?.closest(".map-panel");
  playerNavigationActiveV183 = false;
  restartPlayerTrackingForModeV189();
  playerResetCompassSmoothingV188();
  resetPlayerMapHeadingV184();
  panel?.classList.remove("is-navigation-mode");
  document.body.classList.remove("player-navigation-open");
  document.querySelector("#player-navigation-button")?.setAttribute("aria-pressed", "false");
  rerenderMap(document.querySelector("#player-map"));
  await releasePlayerWakeLockV183();
}

function updatePlayerMapGuidanceV183(team, puzzle, target, playerPosition) {
  updatePlayerMapGuidanceV182(team, puzzle, target, playerPosition);
  playerGuidanceContextV183 = [team, puzzle, target, playerPosition];
  const labels = playerGuidanceLabelsV183();
  const arrow = document.querySelector("#player-navigation-arrow");
  const directionNode = document.querySelector("#player-navigation-direction");
  const distanceNode = document.querySelector("#player-navigation-distance");
  const distanceLabel = document.querySelector("#player-navigation-distance-label");
  const signalNode = document.querySelector("#player-navigation-signal");
  const safetyNode = document.querySelector("#player-navigation-safety");
  const navigationButton = document.querySelector("#player-navigation-button");
  const closeButton = document.querySelector("#player-navigation-close");
  if (navigationButton) navigationButton.textContent = labels.navigation;
  if (closeButton) closeButton.textContent = labels.exit;
  if (safetyNode) safetyNode.textContent = labels.safety;
  if (!arrow || !directionNode || !distanceNode || !distanceLabel || !signalNode) return;

  signalNode.className = "";
  if (!isUsablePosition(playerPosition)) {
    arrow.style.setProperty("--player-guidance-rotation", "0deg");
    arrow.classList.add("is-waiting");
    directionNode.textContent = labels.fallback;
    distanceNode.textContent = "--";
    distanceLabel.textContent = labels.waiting;
    signalNode.textContent = "";
    return;
  }

  arrow.classList.remove("is-waiting");
  const distance = distanceInMeters(playerPosition.lat, playerPosition.lng, target.lat, target.lng);
  const radius = getPuzzleRadius(puzzle);
  const remaining = Math.max(0, distance - radius);
  const bearing = playerMapBearingV182(playerPosition, target);
  const cardinal = playerMapCardinalV182(bearing);
  const phoneHeading = Number.isFinite(playerCompassHeadingV183)
    ? playerCompassHeadingV183
    : Number.isFinite(playerMovementHeadingV183)
      ? playerMovementHeadingV183
      : null;
  const rotation = Number.isFinite(phoneHeading)
    ? normalizeGuidanceAngleV183(bearing - phoneHeading)
    : bearing;
  arrow.style.setProperty("--player-guidance-rotation", rotation + "deg");
  directionNode.textContent = Number.isFinite(phoneHeading) ? labels.compass : labels.direction(cardinal) + " · " + labels.fallback;
  distanceNode.textContent = distance <= radius ? "✓" : playerMapDistanceV182(remaining);
  distanceLabel.textContent = distance <= radius ? labels.arrived : labels.toZone;

  const age = Date.now() - Number(playerPosition.at || team?.updatedAt || 0);
  const accuracy = Math.round(Number(playerPosition.accuracy));
  if (age > 90000) {
    signalNode.textContent = labels.stale;
    signalNode.classList.add("is-stale");
  } else if (Number.isFinite(accuracy) && accuracy > 40) {
    signalNode.textContent = labels.weak(accuracy);
    signalNode.classList.add("is-weak");
  } else if (Number.isFinite(accuracy)) {
    signalNode.textContent = labels.precise(accuracy);
    signalNode.classList.add("is-good");
  } else {
    signalNode.textContent = "";
  }

  if (distance <= radius && playerArrivalBuzzPuzzleV183 !== puzzle.id) {
    playerArrivalBuzzPuzzleV183 = puzzle.id;
    navigator.vibrate?.([120, 80, 120]);
  }
}

document.addEventListener("click", (event) => {
  const navigationButton = event.target.closest?.("#player-navigation-button");
  const closeButton = event.target.closest?.("#player-navigation-close");
  if (navigationButton) {
    event.preventDefault();
    if (playerNavigationActiveV183) exitPlayerNavigationV183();
    else enterPlayerNavigationV183();
  }
  if (closeButton) {
    event.preventDefault();
    exitPlayerNavigationV183();
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && playerNavigationActiveV183) exitPlayerNavigationV183();
});

document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible" && playerNavigationActiveV183) requestPlayerWakeLockV183();
});

window.addEventListener("hashchange", () => {
  if (playerNavigationActiveV183 && location.hash !== "#player") exitPlayerNavigationV183();
});

/* player-performance-v184 */
let playerLastFullRenderAtV184 = 0;
let playerRenderKeyV184 = "";
let playerPendingPositionV184 = null;
let playerGpsHandlerRunningV184 = false;
let playerLastRouteRefreshAtV184 = 0;
let playerLastGpsSyncAtV184 = 0;
let playerLastMapRenderAtV184 = 0;
let playerLastSyncedPositionV184 = null;
let playerLastRenderedPositionV184 = null;
let playerLastHeadingPaintAtV184 = 0;
let playerLastPaintedHeadingV184 = null;

function getPlayerRenderKeyV184(team, route) {
  if (!team || !route) return "none";
  const progress = getTeamProgress(team, route);
  const puzzle = getCurrentPuzzle(team, route);
  const language = typeof playerMapLanguageV182 === "function" ? playerMapLanguageV182() : "fr";
  return [team.id, team.status, progress.solved, team.unlockedPuzzleIds?.length || 0, puzzle?.id || "", team.timeExpiredAt ? "overtime" : "timed", language].join("|");
}

function renderPlayerClockV184(team, route) {
  if (!team || !route) return;
  const isBriefing = team.status === "briefing";
  if (els.countdown) {
    els.countdown.textContent = isBriefing ? playerLabelV151("ready") : formatPlayerClockV186(team, route);
  }
  if (els.elapsedTime) {
    els.elapsedTime.textContent = Math.floor(elapsedSeconds(team) / 60) + " min";
  }
}

function positionDistanceV184(first, second) {
  if (!isUsablePosition(first) || !isUsablePosition(second)) return Infinity;
  return distanceInMeters(first.lat, first.lng, second.lat, second.lng);
}

async function processPlayerGeolocationV184(position) {
  if (document.visibilityState === "hidden") return;
  const receivedAt = Date.now();
  const movementHeading = Number(position?.coords?.heading);
  if (Number.isFinite(movementHeading) && movementHeading >= 0) {
    playerMovementHeadingV183 = movementHeading;
  }

  const team = getCurrentTeam();
  if (!team || team.status !== "playing") {
    stopGeolocationWatch();
    return;
  }
  const route = getRoute(team.routeId);
  const puzzle = getCurrentPuzzle(team, route);
  if (!route || !puzzle) {
    stopGeolocationWatch();
    return;
  }

  const currentPosition = {
    lat: position.coords.latitude,
    lng: position.coords.longitude,
    accuracy: position.coords.accuracy,
    at: receivedAt,
  };
  team.lastPosition = currentPosition;
  lastPlayerPositionRefreshAt = receivedAt;
  touchTeam(team);
  geolocationWatchPuzzleId = puzzle.id;

  const target = { lat: getPuzzleLat(puzzle), lng: getPuzzleLng(puzzle) };
  const distance = distanceInMeters(currentPosition.lat, currentPosition.lng, target.lat, target.lng);
  const radius = getPuzzleRadius(puzzle);
  const accuracy = Number(currentPosition.accuracy);
  const accuracyText = Number.isFinite(accuracy) ? " Precision +/-" + Math.round(accuracy) + " m." : "";

  if (puzzle.requireLocation && distance <= radius && !team.unlockedPuzzleIds.includes(puzzle.id)) {
    unlockPuzzle(team, puzzle, "Vous etes a " + Math.round(distance) + " m du point." + accuracyText);
    playerLastGpsSyncAtV184 = receivedAt;
    playerLastSyncedPositionV184 = currentPosition;
    return;
  }

  const movedSinceSync = positionDistanceV184(playerLastSyncedPositionV184, currentPosition);
  const shouldSync = receivedAt - playerLastGpsSyncAtV184 >= 30000
    || (movedSinceSync >= 15 && receivedAt - playerLastGpsSyncAtV184 >= 12000);
  if (shouldSync) {
    playerLastGpsSyncAtV184 = receivedAt;
    playerLastSyncedPositionV184 = currentPosition;
    saveData({ immediate: true });
  }

  if (receivedAt - playerLastGuidancePaintAtV187 >= 1000) {
    playerLastGuidancePaintAtV187 = receivedAt;
    updatePlayerMapGuidanceV183(team, puzzle, target, currentPosition);
  }

  const movedSinceRender = positionDistanceV184(playerLastRenderedPositionV184, currentPosition);
  const shouldRender = receivedAt - playerLastMapRenderAtV184 >= 8000
    || (movedSinceRender >= 12 && receivedAt - playerLastMapRenderAtV184 >= 3500);
  if (shouldRender) {
    playerLastMapRenderAtV184 = receivedAt;
    playerLastRenderedPositionV184 = currentPosition;
    renderPlayerMap(team, puzzle);
    els.distanceNote.textContent = distance <= radius
      ? "Vous etes dans la zone." + accuracyText
      : "Position mise a jour : encore " + Math.round(Math.max(0, distance - radius)) + " m avant la zone." + accuracyText;
  }
}

function applyPlayerMapHeadingV184(heading) {
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
}

function resetPlayerMapHeadingV184() {
  const map = document.querySelector("#player-map");
  if (!map) return;
  map.classList.remove("is-heading-up");
  map.style.removeProperty("--player-map-rotation");
  map.style.removeProperty("--player-map-counter-rotation");
  playerLastPaintedHeadingV184 = null;
  playerMapContinuousHeadingV188 = null;
}

/* player-orientation-permission-v185 */
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

/* player-overtime-v186 */
function isTeamOvertimeV186(team, route) {
  if (!team || !route || team.status !== "playing") return false;
  return elapsedSeconds(team) >= Math.max(0, Number(route.duration) || 0) * 60;
}

function formatOvertimeClockV186(seconds) {
  const safeSeconds = Math.max(0, Math.floor(Number(seconds) || 0));
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const rest = safeSeconds % 60;
  if (hours) {
    return "+" + hours + ":" + minutes.toString().padStart(2, "0") + ":" + rest.toString().padStart(2, "0");
  }
  return "+" + minutes.toString().padStart(2, "0") + ":" + rest.toString().padStart(2, "0");
}

function formatPlayerClockV186(team, route) {
  if (!team || !route) return "00:00";
  if (isTeamOvertimeV186(team, route)) {
    const overtimeSeconds = elapsedSeconds(team) - Math.max(0, Number(route.duration) || 0) * 60;
    return formatOvertimeClockV186(overtimeSeconds);
  }
  return formatClock(remainingSeconds(team, route));
}

function getPlayerStatusLabelV186(team, route) {
  if (isTeamOvertimeV186(team, route)) {
    const labels = {
      fr: "Temps depasse",
      en: "Time exceeded",
      nl: "Tijd voorbij",
    };
    const language = typeof playerLangV151 === "function" ? playerLangV151() : "fr";
    return labels[language] || labels.fr;
  }
  return playerStatusLabelV151(team?.status);
}

function renderPuzzleMedia(puzzle, unlocked) {
  const image = unlocked ? getPuzzleImage(puzzle) : null;
  if (!image) {
    els.riddleMedia.classList.add("is-hidden");
    els.riddleMedia.innerHTML = "";
    els.riddleMedia.dataset.imageKey = "";
    return;
  }

  const imageKey = `${puzzle.id}-${image.name || ""}-${image.dataUrl.length}`;
  if (els.riddleMedia.dataset.imageKey === imageKey) return;

  els.riddleMedia.dataset.imageKey = imageKey;
  els.riddleMedia.classList.remove("is-hidden");
  els.riddleMedia.innerHTML = `
    <button class="image-preview-button" type="button" data-view-image aria-label="Agrandir l’image de l’énigme">
      <img src="${escapeHtml(image.dataUrl)}" alt="${escapeHtml(image.name || puzzle.title)}" />
    </button>
  `;
  els.riddleMedia.querySelector("[data-view-image]")?.addEventListener("click", () => {
    openImageViewer(image, puzzle.title);
  });
}

function getAnswerContext(teamId, routeId, puzzleId) {
  const team = data.teams.find((item) => item.id === teamId) || getCurrentTeam();
  const route = getRoute(team?.routeId || routeId);
  const puzzle = route?.puzzles.find((item) => item.id === puzzleId);
  return { team, route, puzzle };
}

function renderAnswerZone(team, route, puzzle, unlocked) {
  const gameClosed = team.status !== "playing";
  if (!unlocked) {
    els.answerZone.innerHTML = "";
    return;
  }

  const teamId = team.id;
  const routeId = route.id;
  const puzzleId = puzzle.id;

  if (gameClosed) {
    els.answerZone.innerHTML = `
      <div class="answer-form">
        <button class="primary-button" type="button" disabled>${team.status === "won" ? "Parcours réussi" : "Partie terminée"}</button>
      </div>
    `;
    return;
  }

  if (puzzle.type === "photo") {
    els.answerZone.innerHTML = `
      <form class="answer-form" id="photo-form">
        <label class="file-input">
          Photo demandée
          <input id="photo-answer" name="photo-answer" type="file" accept="image/*" capture="environment" required />
          <span class="preview-name" id="photo-preview">Aucune photo sélectionnée</span>
        </label>
        <button class="primary-button" type="submit">Envoyer la photo</button>
      </form>
    `;
    $("#photo-answer").addEventListener("change", (event) => {
      const file = event.target.files?.[0];
      $("#photo-preview").textContent = file ? file.name : "Aucune photo sélectionnée";
    });
    $("#photo-form").addEventListener("submit", (event) => {
      event.preventDefault();
      const context = getAnswerContext(teamId, routeId, puzzleId);
      if (!context.team || !context.route || !context.puzzle) return;
      submitPhotoAnswer(context.team, context.route, context.puzzle);
    });
    return;
  }

  els.answerZone.innerHTML = `
    <form class="answer-form" id="text-answer-form">
      <label for="text-answer">Réponse</label>
      <div class="answer-actions">
        <input id="text-answer" name="text-answer" autocomplete="off" required />
        <button class="primary-button" type="submit">Valider</button>
      </div>
    </form>
  `;
  $("#text-answer-form").addEventListener("submit", (event) => {
    event.preventDefault();
    const context = getAnswerContext(teamId, routeId, puzzleId);
    if (!context.team || !context.route || !context.puzzle) return;
    submitTextAnswer(context.team, context.route, context.puzzle);
  });
}

function renderHint(team, puzzle, unlocked) {
  const route = getRoute(team?.routeId);
  const shownCount = team.hints[puzzle.id] || 0;
  const attempts = team.attempts[puzzle.id] || 0;
  const hints = puzzle.hints || [];
  const nextHint = hints[shownCount];

  els.hintButton.disabled = !unlocked || !nextHint || team.status !== "playing";

  if (!unlocked) {
    els.hintState.textContent = "Disponible sur place";
    return;
  }

  if (!nextHint) {
    els.hintState.textContent = shownCount ? publicPuzzleHintV156(route, puzzle, shownCount - 1) : publicMessageV156("Aucun indice");
    return;
  }

  const canShow = attempts >= nextHint.afterAttempts || elapsedSeconds(team) >= nextHint.afterSeconds;
  els.hintButton.disabled = !canShow || team.status !== "playing";
  els.hintState.textContent = shownCount
    ? publicPuzzleHintV156(route, puzzle, shownCount - 1)
    : canShow
      ? publicMessageV156("Indice disponible")
      : publicMessageV156(`Disponible apr\u00e8s ${nextHint.afterAttempts} essai`);
}

function submitTextAnswer(team, route, puzzle) {
  const input = $("#text-answer");
  const proposed = normalizeAnswer(input.value);
  const expected = normalizeAnswer(puzzle.answer);
  const acceptedAnswersV156 = answerCandidatesV156(route, puzzle);

  team.attempts[puzzle.id] = (team.attempts[puzzle.id] || 0) + 1;
  touchTeam(team);

  if (proposed === expected || acceptedAnswersV156.has(proposed)) {
    team.answers[puzzle.id] = input.value.trim();
    unlockNextPuzzle(team, route, puzzle.id);
    touchTeam(team);
    saveData({ immediate: true });
    showToast("Bonne réponse.");
    render();
    return;
  }

  saveData();
  els.answerMessage.textContent = "Ce n’est pas encore la bonne réponse.";
  renderHint(team, puzzle, true);
}

function submitPhotoAnswer(team, route, puzzle) {
  const file = $("#photo-answer").files?.[0];
  if (!file) {
    els.answerMessage.textContent = "Ajoutez une photo pour continuer.";
    return;
  }
  team.attempts[puzzle.id] = (team.attempts[puzzle.id] || 0) + 1;
  team.photoNames[puzzle.id] = file.name;
  team.answers[puzzle.id] = "Photo envoyée";
  unlockNextPuzzle(team, route, puzzle.id);
  touchTeam(team);
  saveData({ immediate: true });
  showToast("Photo enregistrée.");
  render();
}

function unlockNextPuzzle(team, route, puzzleId) {
  const currentIndex = route.puzzles.findIndex((puzzle) => puzzle.id === puzzleId);
  const nextPuzzle = route.puzzles[currentIndex + 1];
  if (nextPuzzle && !nextPuzzle.requireLocation && !team.unlockedPuzzleIds.includes(nextPuzzle.id)) {
    team.unlockedPuzzleIds.push(nextPuzzle.id);
  }
  checkGameStatus(team, route);
}

function requestHint() {
  const team = getCurrentTeam();
  if (!team) return;
  const route = getRoute(team.routeId);
  const puzzle = getCurrentPuzzle(team, route);
  const shownCount = team.hints[puzzle.id] || 0;
  const nextHint = puzzle.hints?.[shownCount];
  if (!nextHint) return;

  team.hints[puzzle.id] = shownCount + 1;
  touchTeam(team);
  saveData();
  renderHint(team, puzzle, true);
}

function unlockCurrentPuzzleByDemo() {
  const team = getCurrentTeam();
  if (!team) return;
  const route = getRoute(team.routeId);
  const puzzle = getCurrentPuzzle(team, route);
  team.lastPosition = {
    lat: getPuzzleLat(puzzle),
    lng: getPuzzleLng(puzzle),
    accuracy: 0,
    at: Date.now(),
  };
  unlockPuzzle(team, puzzle, "Zone validée en démo.");
}

function unlockPuzzle(team, puzzle, message) {
  const teamForMessageV156 = getCurrentTeam();
  const routeForMessageV156 = teamForMessageV156 ? getRoute(teamForMessageV156.routeId) : null;
  const customArrivalMessage = publicPuzzleTextV156(routeForMessageV156, puzzle, "arrivalMessage") || puzzle?.arrivalMessage?.trim();
  const unlockMessage = publicMessageV156(customArrivalMessage || message || "\u00c9nigme d\u00e9bloqu\u00e9e.");
  if (!team.unlockedPuzzleIds.includes(puzzle.id)) {
    team.unlockedPuzzleIds.push(puzzle.id);
  }
  touchTeam(team);
  saveData({ immediate: true });
  els.distanceNote.textContent = unlockMessage;
  renderPlayer();
  if (!openArrivalModal(unlockMessage)) {
    showToast(unlockMessage);
  }
}

function stopGeolocationWatch() {
  if (geolocationWatchId === null || !navigator.geolocation) return;
  navigator.geolocation.clearWatch(geolocationWatchId);
  geolocationWatchId = null;
  geolocationWatchPuzzleId = null;
}

async function handleGeolocationPosition(position) {
  playerPendingPositionV184 = position;
  if (playerGpsHandlerRunningV184) return;
  const interval = playerNavigationActiveV183
    ? PLAYER_GUIDANCE_GPS_INTERVAL_V189
    : PLAYER_IDLE_GPS_INTERVAL_V189;
  const now = Date.now();
  if (now - playerLastProcessedGpsAtV189 < interval) return;

  playerGpsHandlerRunningV184 = true;
  playerLastProcessedGpsAtV189 = now;
  const nextPosition = playerPendingPositionV184;
  playerPendingPositionV184 = null;
  try {
    if (nextPosition) await processPlayerGeolocationV184(nextPosition);
  } finally {
    playerGpsHandlerRunningV184 = false;
  }
}

function handleGeolocationError() {
  els.distanceNote.textContent = window.playerDynamicTextV152 ? window.playerDynamicTextV152("Position non disponible. Verifiez l\'autorisation GPS puis reessayez.") : "Position non disponible. Verifiez l\'autorisation GPS puis reessayez.";
}

function locatePlayer() {
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
    playerTrackingOptionsV189(),
  );
}

function distanceInMeters(lat1, lng1, lat2, lng2) {
  const radius = 6371000;
  const toRad = (value) => (value * Math.PI) / 180;
  const deltaLat = toRad(lat2 - lat1);
  const deltaLng = toRad(lng2 - lng1);
  const a =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(deltaLng / 2) ** 2;
  return radius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

async function handleActivation(event) {
  event.preventDefault();
  const codeValue = els.activationCode.value.trim().toUpperCase();
  if (!codeValue) {
    els.activationMessage.textContent = "Entrez votre code d'activation.";
    return;
  }
  const submitButton = els.activationForm.querySelector("button[type='submit']");
  if (submitButton) submitButton.disabled = true;
  els.activationMessage.textContent = "Verification du code...";
  try {
    const response = await fetch(PLAYER_ACTIVATE_URL_V189, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      credentials: "same-origin",
      cache: "no-store",
      body: JSON.stringify({ code: codeValue }),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok || !payload.team || !payload.route) {
      throw new Error(payload.message || "Code introuvable.");
    }
    data.codes = [];
    replaceRouteV189(payload.route);
    replaceTeamV189(payload.team);
    data.activeRouteId = payload.route.id;
    localStorage.setItem(SESSION_KEY, payload.team.id);
    persistCompactPlayerSessionV187(payload.team);
    persistSafeClientStateV189();
    els.activationForm.reset();
    els.activationMessage.textContent = "";
    render();
    window.setTimeout(() => {
      document.querySelector("#briefing-panel")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  } catch (error) {
    els.activationMessage.textContent = error.message || "Activation impossible.";
  } finally {
    if (submitButton) submitButton.disabled = false;
  }
}

function startAdventure() {
  const team = getCurrentTeam();
  if (!team) return;
  const route = getRoute(team.routeId);
  if (!route || team.status !== "briefing") return;
  ensureTeamState(team);
  if (!canStartAdventureFromBriefing(team, route)) {
    updateBriefingLocationUi(team, route);
    showToast("Localisez votre equipe au point de depart avant de commencer.");
    return;
  }
  stopBriefingGeolocationWatch();
  team.status = "playing";
  team.startAt = Date.now();
  team.finishedAt = null;
  route.puzzles
    .filter((puzzle) => !puzzle.requireLocation)
    .forEach((puzzle) => {
      if (!team.unlockedPuzzleIds.includes(puzzle.id)) {
        team.unlockedPuzzleIds.push(puzzle.id);
      }
    });
  touchTeam(team);
  saveData({ immediate: true });
  renderPlayer();
  window.setTimeout(() => {
    document.querySelector("#player-game-guide-v192")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, 100);
  locatePlayer();
  requestPlayerPositionRefresh(true);
}

function resetSession() {
  stopGeolocationWatch();
  stopBriefingGeolocationWatch();
  localStorage.removeItem(SESSION_KEY);
  localStorage.removeItem(PLAYER_SESSION_STATE_KEY_V187);
  renderPlayer();
  showToast("Code déconnecté.");
}

function openTeamNameEditor() {
  const team = getCurrentTeam();
  if (!team) return;
  els.teamNameInput.value = team.name;
  els.teamNameForm.classList.remove("is-hidden");
  els.teamNameInput.focus();
  els.teamNameInput.select();
}

function saveTeamName(event) {
  event.preventDefault();
  const team = getCurrentTeam();
  if (!team) return;
  const name = els.teamNameInput.value.trim();
  if (!name) {
    showToast("Indiquez un nom d’équipe.");
    return;
  }
  team.name = name;
  touchTeam(team);
  saveData();
  els.teamNameForm.classList.add("is-hidden");
  renderPlayer();
  renderTeamTable();
  showToast("Nom d’équipe enregistré.");
}

function cleanPuzzleProgress(puzzleId, routeId) {
  data.teams
    .filter((team) => !routeId || team.routeId === routeId)
    .forEach((team) => {
      if (team.answers) delete team.answers[puzzleId];
      if (team.attempts) delete team.attempts[puzzleId];
      if (team.hints) delete team.hints[puzzleId];
      if (team.photoNames) delete team.photoNames[puzzleId];
      if (Array.isArray(team.unlockedPuzzleIds)) {
        team.unlockedPuzzleIds = team.unlockedPuzzleIds.filter((id) => id !== puzzleId);
      }
    });
}

function unlockRouteFreePuzzlesForTeams(route) {
  if (!route) return;
  const freePuzzleIds = route.puzzles
    .filter((puzzle) => !puzzle.requireLocation)
    .map((puzzle) => puzzle.id);
  if (!freePuzzleIds.length) return;
  data.teams
    .filter((team) => team.routeId === route.id)
    .forEach((team) => {
      team.unlockedPuzzleIds ||= [];
      freePuzzleIds.forEach((puzzleId) => {
        if (!team.unlockedPuzzleIds.includes(puzzleId)) {
          team.unlockedPuzzleIds.push(puzzleId);
        }
      });
    });
}

function deletePuzzleFromRoute(routeId, puzzleId) {
  const route = getRoute(routeId);
  const puzzle = route?.puzzles?.find((item) => item.id === puzzleId);
  if (!route || !puzzle) return;

  const teamCount = data.teams.filter((team) => team.routeId === routeId).length;
  const confirmed = window.confirm(
    'Supprimer l’énigme "' + puzzle.title + '" ?\n\nLes réponses, indices et photos liés à cette énigme seront retirés de ' + teamCount + ' équipe' + (teamCount > 1 ? 's' : '') + '.',
  );
  if (!confirmed) return;

  route.puzzles = route.puzzles.filter((item) => item.id !== puzzleId);
  cleanPuzzleProgress(puzzleId, routeId);
  unlockRouteFreePuzzlesForTeams(route);

  if (selectedContentPuzzleId === puzzleId) selectedContentPuzzleId = route.puzzles[0]?.id || null;
  if (selectedGeoPuzzleId === puzzleId) selectedGeoPuzzleId = route.puzzles[0]?.id || null;
  if (selectedHintPuzzleId === puzzleId) selectedHintPuzzleId = route.puzzles[0]?.id || null;
  if (geolocationWatchPuzzleId === puzzleId) stopGeolocationWatch();

  saveData();
  renderAdmin();
  renderPlayer();
  showToast('Énigme supprimée.');
}

function deleteRoute(routeId) {
  const route = getRoute(routeId);
  if (!route) return;
  if (data.routes.length <= 1) {
    showToast('Gardez au moins un parcours dans la gestion.');
    return;
  }

  const teamIds = new Set(data.teams.filter((team) => team.routeId === routeId).map((team) => team.id));
  const codeCount = data.codes.filter((code) => code.routeId === routeId).length;
  const teamCount = teamIds.size;
  const confirmed = window.confirm(
    'Supprimer le parcours "' + route.title + '" ?\n\nCette action supprimera aussi ' + route.puzzles.length + ' énigme' + (route.puzzles.length > 1 ? 's' : '') + ', ' + codeCount + ' code' + (codeCount > 1 ? 's' : '') + ' et ' + teamCount + ' équipe' + (teamCount > 1 ? 's' : '') + ' liés à ce parcours.',
  );
  if (!confirmed) return;

  data.routes = data.routes.filter((item) => item.id !== routeId);
  data.codes = data.codes.filter((code) => code.routeId !== routeId);
  data.teams = data.teams.filter((team) => team.routeId !== routeId);

  if (teamIds.has(localStorage.getItem(SESSION_KEY))) {
    localStorage.removeItem(SESSION_KEY);
    stopGeolocationWatch();
  }

  if (data.activeRouteId === routeId) {
    data.activeRouteId = data.routes[0]?.id || null;
    if (data.activeRouteId) {
      localStorage.setItem(ACTIVE_ROUTE_KEY, data.activeRouteId);
    } else {
      localStorage.removeItem(ACTIVE_ROUTE_KEY);
    }
  }

  selectedContentPuzzleId = null;
  selectedGeoPuzzleId = null;
  selectedHintPuzzleId = null;
  saveData();
  render();
  showToast('Parcours supprimé.');
}

function renderAdminInitialServerSyncState() {
  const message = initialAdminServerSyncFailed
    ? "Connexion serveur temporairement indisponible. Nouvel essai automatique en cours."
    : "Chargement des donnees serveur...";
  if (els.routeCount) els.routeCount.textContent = "serveur";
  if (els.routeList) {
    els.routeList.innerHTML = '<article class="admin-loading-card">' + message + '</article>';
  }
  if (els.teamTable) {
    els.teamTable.innerHTML = '<tr><td class="admin-loading-row" colspan="8">' + message + '</td></tr>';
  }
  if (els.codeList) {
    els.codeList.innerHTML = '<div class="admin-loading-card">' + message + '</div>';
  }
}

function renderAdmin() {
  renderAdminAccess();
  if (canUseBackend() && !adminAuthenticated) return;
  if (canUseBackend() && initialAdminServerSyncPending) {
    renderAdminInitialServerSyncState();
    return;
  }

  const activeRoute = getActiveRoute();
  if (!activeRoute) return;

  els.routeCount.textContent = `${data.routes.length} parcours`;
  els.routeList.innerHTML = data.routes
    .map((route) => {
      const teams = data.teams.filter((team) => team.routeId === route.id);
      const active = route.id === activeRoute.id;
      const visible = isRouteVisibleInShop(route);
      return `
        <article class="route-card">
          <div>
            <h3>${escapeHtml(route.title)}</h3>
            <p>${escapeHtml(route.description || route.area)}</p>
            <div class="metric-strip">
              <span class="metric">${escapeHtml(route.area)}</span>
              <span class="metric">${route.duration} min</span>
              <span class="metric">${formatPrice(getRoutePrice(route))} / equipe</span>
              <span class="metric ${visible ? "is-success" : "is-muted"}">${visible ? "Boutique visible" : "Boutique masquée"}</span>
              <span class="metric">${route.puzzles.length} énigmes</span>
              <span class="metric">${teams.length} équipe${teams.length > 1 ? "s" : ""}</span>
            </div>
          </div>
          <div class="route-card-actions">
            <button class="${active ? "primary-button" : "secondary-button"}" type="button" data-set-route="${route.id}">
              ${active ? "Actif" : "Choisir"}
            </button>
            <button class="danger-button compact-button" type="button" data-delete-route="${route.id}" ${data.routes.length <= 1 ? "disabled" : ""}>
              Supprimer
            </button>
          </div>
        </article>
      `;
    })
    .join("");

  renderRouteDetailsEditor(activeRoute);
  els.routeSelect.innerHTML = data.routes
    .map((route) => `<option value="${route.id}" ${route.id === activeRoute.id ? "selected" : ""}>${escapeHtml(route.title)}</option>`)
    .join("");

  els.puzzleList.innerHTML = activeRoute.puzzles.length
    ? activeRoute.puzzles
        .map((puzzle, index) => `
          <article class="puzzle-row">
            <span class="puzzle-index">${index + 1}</span>
            <div>
              <h3>${escapeHtml(puzzle.title)}</h3>
              <p>${escapeHtml(puzzle.place)} · ${puzzle.requireLocation ? `${puzzle.radius} m` : "sans géozone"}</p>
            </div>
            <div class="puzzle-row-actions">
              <span class="type-tag">${puzzle.type === "photo" ? "Photo" : "Texte"}${getPuzzleImage(puzzle) ? " + image" : ""}</span>
              <button class="danger-button compact-button" type="button" data-delete-puzzle="${puzzle.id}">Supprimer</button>
            </div>
          </article>
        `)
        .join("")
    : `<p class="form-message">Aucune énigme pour ce parcours.</p>`;

  renderPuzzleContentEditor(activeRoute);
  renderGeoEditor(activeRoute);
  renderHintEditor(activeRoute);
  renderTeamTable();
  renderCodeList();

  $$("[data-set-route]").forEach((button) => {
    button.addEventListener("click", () => setActiveRoute(button.dataset.setRoute));
  });
  $$("[data-delete-route]").forEach((button) => {
    button.addEventListener("click", () => deleteRoute(button.dataset.deleteRoute));
  });
  $$("[data-delete-puzzle]").forEach((button) => {
    button.addEventListener("click", () => deletePuzzleFromRoute(activeRoute.id, button.dataset.deletePuzzle));
  });
}


/* admin-multilingual-content-v156 */
const ADMIN_I18N_LANGS_V156 = [
  { id: "en", label: "Anglais" },
  { id: "nl", label: "Neerlandais" },
];

function activeLangV156() {
  if (typeof playerLangV151 === "function") return playerLangV151();
  if (typeof escapeI18nLanguage === "function") return escapeI18nLanguage();
  return (document.documentElement.lang || "fr").slice(0, 2);
}

function ensureLangBucketV156(target, lang) {
  target.i18n ||= {};
  target.i18n[lang] ||= {};
  return target.i18n[lang];
}

function routeLangValueV156(route, lang, field) {
  return route?.i18n?.[lang]?.[field] || ESCAPE_I18N_ROUTES?.[route?.id]?.[lang]?.[field] || "";
}

function puzzleLangValueV156(route, puzzle, lang, field) {
  return puzzle?.i18n?.[lang]?.[field] || ESCAPE_I18N_ROUTES?.[route?.id]?.[lang]?.puzzles?.[puzzle?.id]?.[field] || "";
}

function puzzleLangHintsV156(route, puzzle, lang) {
  const custom = puzzle?.i18n?.[lang]?.hints;
  if (Array.isArray(custom)) return custom;
  const fallback = ESCAPE_I18N_ROUTES?.[route?.id]?.[lang]?.puzzles?.[puzzle?.id]?.hints;
  return Array.isArray(fallback) ? fallback : [];
}

function publicRouteTextV156(route, field) {
  const lang = activeLangV156();
  const value = String(route?.[field] || "");
  if (!value || lang === "fr") return value;
  return routeLangValueV156(route, lang, field)
    || (typeof escapeI18nTranslateText === "function" ? escapeI18nTranslateText(value) : value);
}

function publicPuzzleTextV156(route, puzzle, field) {
  const lang = activeLangV156();
  const value = String(puzzle?.[field] || "");
  if (!value || lang === "fr") return value;
  return puzzleLangValueV156(route, puzzle, lang, field)
    || (typeof escapeI18nTranslateText === "function" ? escapeI18nTranslateText(value) : value);
}

function publicPuzzleHintV156(route, puzzle, index) {
  const lang = activeLangV156();
  const value = String(puzzle?.hints?.[index]?.text || "");
  if (!value || lang === "fr") return value;
  return puzzleLangHintsV156(route, puzzle, lang)[index]
    || (typeof escapeI18nTranslateText === "function" ? escapeI18nTranslateText(value) : value);
}

function publicMessageV156(value) {
  const text = String(value || "");
  if (!text) return "";
  return typeof escapeI18nTranslateText === "function" ? escapeI18nTranslateText(text) : text;
}

function answerCandidatesV156(route, puzzle) {
  const values = [
    puzzle?.answer,
    puzzle?.i18n?.en?.answer,
    puzzle?.i18n?.nl?.answer,
    ESCAPE_I18N_ROUTES?.[route?.id]?.en?.puzzles?.[puzzle?.id]?.answer,
    ESCAPE_I18N_ROUTES?.[route?.id]?.nl?.puzzles?.[puzzle?.id]?.answer,
  ].filter(Boolean);
  const normalized = new Set(values.map((value) => normalizeAnswer(String(value))));
  values.forEach((value) => {
    const key = normalizeAnswer(String(value));
    (ESCAPE_I18N_ANSWER_ALIASES?.[key] || []).forEach((alias) => normalized.add(normalizeAnswer(alias)));
  });
  return normalized;
}

function i18nInputV156(scope, lang, field, value, multiline = false) {
  const escaped = escapeHtml(value || "");
  const attr = 'data-i18n-' + scope + '-field="' + field + '" data-i18n-lang="' + lang + '"';
  return multiline
    ? '<textarea ' + attr + '>' + escaped + '</textarea>'
    : '<input ' + attr + ' value="' + escaped + '" />';
}

function renderRouteI18nEditorV156(route) {
  if (!els.routeDetailsForm || !route) return;
  let panel = document.querySelector("#route-i18n-editor-v156");
  if (!panel) {
    panel = document.createElement("section");
    panel.id = "route-i18n-editor-v156";
    panel.className = "i18n-editor-v156";
    els.routeDetailsForm.insertBefore(panel, els.routeDetailsMessage);
  }
  panel.innerHTML =
    '<p class="section-label">Traductions du parcours</p>' +
    ADMIN_I18N_LANGS_V156.map((lang) =>
      '<details class="i18n-lang-panel-v156" open>' +
        '<summary>' + lang.label + '</summary>' +
        '<label>Nom ' + i18nInputV156("route", lang.id, "title", routeLangValueV156(route, lang.id, "title")) + '</label>' +
        '<label>Zone ' + i18nInputV156("route", lang.id, "area", routeLangValueV156(route, lang.id, "area")) + '</label>' +
        '<label>Description ' + i18nInputV156("route", lang.id, "description", routeLangValueV156(route, lang.id, "description"), true) + '</label>' +
        '<label>Briefing ' + i18nInputV156("route", lang.id, "briefingText", routeLangValueV156(route, lang.id, "briefingText"), true) + '</label>' +
        '<label>Message de fin ' + i18nInputV156("route", lang.id, "finishMessage", routeLangValueV156(route, lang.id, "finishMessage"), true) + '</label>' +
      '</details>'
    ).join("");
}

function saveRouteI18nEditorV156(route) {
  if (!route) return;
  document.querySelectorAll("[data-i18n-route-field]").forEach((input) => {
    const lang = input.dataset.i18nLang;
    const field = input.dataset.i18nRouteField;
    const value = input.value.trim();
    const bucket = ensureLangBucketV156(route, lang);
    if (value) bucket[field] = value;
    else delete bucket[field];
  });
}

function renderPuzzleI18nEditorV156(route, puzzle) {
  if (!els.puzzleContentForm || !puzzle) return;
  let panel = document.querySelector("#puzzle-i18n-editor-v156");
  if (!panel) {
    panel = document.createElement("section");
    panel.id = "puzzle-i18n-editor-v156";
    panel.className = "i18n-editor-v156";
    els.puzzleContentForm.insertBefore(panel, els.contentMessage);
  }
  panel.innerHTML =
    '<p class="section-label">Traductions enigme</p>' +
    ADMIN_I18N_LANGS_V156.map((lang) =>
      '<details class="i18n-lang-panel-v156" open>' +
        '<summary>' + lang.label + '</summary>' +
        '<label>Titre ' + i18nInputV156("puzzle", lang.id, "title", puzzleLangValueV156(route, puzzle, lang.id, "title")) + '</label>' +
        '<label>Lieu ' + i18nInputV156("puzzle", lang.id, "place", puzzleLangValueV156(route, puzzle, lang.id, "place")) + '</label>' +
        '<label>Question ' + i18nInputV156("puzzle", lang.id, "question", puzzleLangValueV156(route, puzzle, lang.id, "question"), true) + '</label>' +
        '<label>Message arrivee ' + i18nInputV156("puzzle", lang.id, "arrivalMessage", puzzleLangValueV156(route, puzzle, lang.id, "arrivalMessage"), true) + '</label>' +
        '<label>Reponse attendue ' + i18nInputV156("puzzle", lang.id, "answer", puzzleLangValueV156(route, puzzle, lang.id, "answer")) + '</label>' +
        '<label>Indices, un par ligne <textarea data-i18n-puzzle-field="hints" data-i18n-lang="' + lang.id + '">' + escapeHtml(puzzleLangHintsV156(route, puzzle, lang.id).join("\\n")) + '</textarea></label>' +
      '</details>'
    ).join("");
}

function savePuzzleI18nEditorV156(puzzle) {
  if (!puzzle) return;
  document.querySelectorAll("[data-i18n-puzzle-field]").forEach((input) => {
    const lang = input.dataset.i18nLang;
    const field = input.dataset.i18nPuzzleField;
    const bucket = ensureLangBucketV156(puzzle, lang);
    if (field === "hints") {
      const hints = input.value.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
      if (hints.length) bucket.hints = hints;
      else delete bucket.hints;
      return;
    }
    const value = input.value.trim();
    if (value) bucket[field] = value;
    else delete bucket[field];
  });
}

function installAdminI18nStylesV156() {
  if (document.querySelector("#admin-i18n-styles-v156")) return;
  const style = document.createElement("style");
  style.id = "admin-i18n-styles-v156";
  style.textContent = [
    ".i18n-editor-v156 { border: 1px solid rgba(18,60,50,.18); border-radius: 8px; padding: 14px; display: grid; gap: 12px; background: #f8fbf9; }",
    ".i18n-lang-panel-v156 { border: 1px solid rgba(18,60,50,.14); border-radius: 8px; padding: 10px; background: #fff; }",
    ".i18n-lang-panel-v156 summary { cursor: pointer; font-weight: 800; color: #123c32; }",
    ".i18n-lang-panel-v156 label { display: grid; gap: 6px; margin-top: 10px; font-weight: 700; }",
    ".i18n-lang-panel-v156 input, .i18n-lang-panel-v156 textarea { width: 100%; }",
    ".i18n-lang-panel-v156 textarea { min-height: 86px; }",
  ].join("\\n");
  document.head.appendChild(style);
}

installAdminI18nStylesV156();

function renderRouteDetailsEditor(route) {
  if (!route) return;
  if (document.activeElement?.closest?.("#route-i18n-editor-v156")) return;
  const activeRouteDetailFields = [
    els.routeDetailsTitleInput,
    els.routeDetailsAreaInput,
    els.routeDetailsDurationInput,
    els.routeDetailsDistanceInput,
    els.routeDetailsPriceInput,
    els.routeDetailsShopVisibleInput,
    els.routeDetailsDescriptionInput,
    els.routeDetailsBriefingInput,
    els.routeDetailsFinishInput,
    els.routeDetailsStartPlaceInput,
    els.routeDetailsStartAddressInput,
    els.routeDetailsStartLatInput,
    els.routeDetailsStartLngInput,
  ];
  if (activeRouteDetailFields.includes(document.activeElement)) return;
  els.routeDetailsTitleInput.value = route.title || "";
  els.routeDetailsAreaInput.value = route.area || "";
  els.routeDetailsDurationInput.value = String(route.duration || 90);
  els.routeDetailsDistanceInput.value = route.distance || "";
  els.routeDetailsPriceInput.value = String(getRoutePrice(route));
  els.routeDetailsShopVisibleInput.checked = isRouteVisibleInShop(route);
  els.routeDetailsDescriptionInput.value = route.description || "";
  els.routeDetailsBriefingInput.value = route.briefingText || "";
  els.routeDetailsFinishInput.value = route.finishMessage || "";
  els.routeDetailsStartPlaceInput.value = route.startPlace || "";
  els.routeDetailsStartAddressInput.value = route.startAddress || "";
  els.routeDetailsStartLatInput.value = formatOptionalCoordinate(route.startLat);
  els.routeDetailsStartLngInput.value = formatOptionalCoordinate(route.startLng);
  els.routeDetailsImageInput.value = "";
  renderRouteCoverPreview(route);
  els.routeDetailsMessage.textContent = `Modification de "${route.title}".`;
  renderRouteI18nEditorV156(route);
}


function updateRouteDetailsDraft() {
  const route = getActiveRoute();
  if (!route) return;
  route.title = els.routeDetailsTitleInput.value.trim();
  route.area = els.routeDetailsAreaInput.value.trim();
  route.duration = Math.max(1, Number(els.routeDetailsDurationInput.value) || 90);
  route.distance = els.routeDetailsDistanceInput.value.trim();
  route.pricePerTeam = Math.max(0, Number(els.routeDetailsPriceInput.value) || 0);
  route.pricePerPerson = route.pricePerTeam;
  route.shopVisible = els.routeDetailsShopVisibleInput.checked;
  route.description = els.routeDetailsDescriptionInput.value.trim();
  route.briefingText = els.routeDetailsBriefingInput.value.trim();
  route.finishMessage = els.routeDetailsFinishInput.value.trim();
  route.startPlace = els.routeDetailsStartPlaceInput.value.trim();
  route.startAddress = els.routeDetailsStartAddressInput.value.trim();
  route.startLat = parseOptionalCoordinate(els.routeDetailsStartLatInput.value);
  route.startLng = parseOptionalCoordinate(els.routeDetailsStartLngInput.value);
  saveRouteI18nEditorV156(route);
  saveData();
  refreshRouteDetailsPreview(route);
  renderShop();
  renderPlayer();
}


function refreshRouteDetailsPreview(route) {
  const button = els.routeList.querySelector(`[data-set-route="${route.id}"]`);
  const card = button?.closest(".route-card");
  if (card) {
    const title = card.querySelector("h3");
    const description = card.querySelector("p");
    const metrics = card.querySelectorAll(".metric");
    if (title) title.textContent = route.title;
    if (description) description.textContent = route.description || route.area;
    if (metrics[0]) metrics[0].textContent = route.area;
    if (metrics[1]) metrics[1].textContent = `${route.duration} min`;
    if (metrics[2]) metrics[2].textContent = formatRouteDistance(route);
    if (metrics[3]) metrics[3].textContent = `${formatPrice(getRoutePrice(route))} / \u00e9quipe`;
    if (metrics[4]) {
      metrics[4].textContent = isRouteVisibleInShop(route) ? "Boutique visible" : "Boutique masqu\u00e9e";
      metrics[4].classList.toggle("is-success", isRouteVisibleInShop(route));
      metrics[4].classList.toggle("is-muted", !isRouteVisibleInShop(route));
    }
  }

  const activeOption = els.routeSelect.querySelector(`option[value="${route.id}"]`);
  if (activeOption) activeOption.textContent = route.title;
}


function renderRouteCoverPreview(route) {
  const image = getRouteCoverImage(route);
  els.removeRouteImageButton.disabled = !image;
  if (!image) {
    els.routeDetailsImagePreview.classList.add("is-empty");
    els.routeDetailsImagePreview.textContent = "Aucune image de boutique ajoutée.";
    return;
  }

  els.routeDetailsImagePreview.classList.remove("is-empty");
  els.routeDetailsImagePreview.innerHTML = `
    <button class="image-preview-button" type="button" data-view-route-image aria-label="Agrandir l’image de boutique">
      <img src="${escapeHtml(image.dataUrl)}" alt="${escapeHtml(image.name || route.title)}" />
    </button>
    <span>${escapeHtml(image.name || "Image de boutique")}</span>
  `;
  els.routeDetailsImagePreview.querySelector("[data-view-route-image]")?.addEventListener("click", () => {
    openImageViewer(image, route.title || "Image de boutique");
  });
}

function saveRouteDetails(event) {
  event.preventDefault();
  const route = getActiveRoute();
  if (!route) return;
  updateRouteDetailsDraft();
  if (!route.title || !route.area || !route.description) {
    els.routeDetailsMessage.textContent = "Complétez le nom, la zone et la description.";
    return;
  }
  renderAdmin();
  renderPlayer();
  showToast("Parcours enregistré.");
}

async function updateRouteCoverFromFile(event) {
  const route = getActiveRoute();
  const file = event.currentTarget.files?.[0];
  if (!route || !file) return;

  els.routeDetailsMessage.textContent = "Image de boutique en cours d’ajout...";
  try {
    route.coverImage = await prepareRouteCoverImage(file);
    saveData();
    renderRouteCoverPreview(route);
    renderShop();
    els.routeDetailsMessage.textContent = "Image de boutique enregistrée.";
    showToast("Image ajoutée à la boutique.");
  } catch (error) {
    els.routeDetailsMessage.textContent = error?.message || "L’image n’a pas pu être ajoutée.";
  } finally {
    els.routeDetailsImageInput.value = "";
  }
}

function removeRouteCoverImage() {
  const route = getActiveRoute();
  if (!route) return;

  delete route.coverImage;
  saveData();
  renderRouteCoverPreview(route);
  renderShop();
  els.routeDetailsMessage.textContent = "Image de boutique supprimée.";
  showToast("Image de boutique supprimée.");
}

function getSelectedContentPuzzle(route) {
  if (!route?.puzzles?.length) return null;
  const selected = route.puzzles.find((puzzle) => puzzle.id === selectedContentPuzzleId);
  return selected || route.puzzles[0];
}

function renderPuzzleContentEditor(route) {
  if (document.activeElement?.closest?.("#puzzle-i18n-editor-v156")) return;
  const puzzle = getSelectedContentPuzzle(route);
  if (!puzzle) {
    els.contentPuzzleSelect.innerHTML = `<option>Aucune énigme</option>`;
    els.contentTitleInput.value = "";
    els.contentPlaceInput.value = "";
    els.contentQuestionInput.value = "";
    els.contentArrivalInput.value = "";
    els.contentImageInput.value = "";
    els.contentImagePreview.classList.add("is-empty");
    els.contentImagePreview.textContent = "Aucune image ajoutée.";
    els.removeContentImageButton.disabled = true;
    els.contentTypeSelect.value = "text";
    els.contentAnswerInput.value = "";
    els.puzzleContentForm.querySelector("button[type='submit']").disabled = true;
    els.contentMessage.textContent = "Ajoutez une énigme avant de modifier son texte.";
    return;
  }

  selectedContentPuzzleId = puzzle.id;
  els.puzzleContentForm.querySelector("button[type='submit']").disabled = false;
  els.contentPuzzleSelect.innerHTML = route.puzzles
    .map((item, index) => `<option value="${item.id}" ${item.id === puzzle.id ? "selected" : ""}>${index + 1}. ${escapeHtml(item.title)}</option>`)
    .join("");
  els.contentTitleInput.value = puzzle.title || "";
  els.contentPlaceInput.value = puzzle.place || "";
  els.contentQuestionInput.value = puzzle.question || "";
  els.contentArrivalInput.value = puzzle.arrivalMessage || "";
  els.contentImageInput.value = "";
  renderPuzzleImagePreview(puzzle);
  els.contentTypeSelect.value = puzzle.type || "text";
  els.contentAnswerInput.value = puzzle.answer || "";
  els.contentMessage.textContent = `Modification de "${puzzle.title}".`;
  renderPuzzleI18nEditorV156(route, puzzle);
}

function renderPuzzleImagePreview(puzzle) {
  const image = getPuzzleImage(puzzle);
  els.removeContentImageButton.disabled = !image;
  if (!image) {
    els.contentImagePreview.classList.add("is-empty");
    els.contentImagePreview.textContent = "Aucune image ajoutée.";
    return;
  }

  els.contentImagePreview.classList.remove("is-empty");
  els.contentImagePreview.innerHTML = `
    <button class="image-preview-button" type="button" data-view-image aria-label="Agrandir l’image de l’énigme">
      <img src="${escapeHtml(image.dataUrl)}" alt="${escapeHtml(image.name || puzzle.title)}" />
    </button>
    <span>${escapeHtml(image.name || "Image de l’énigme")}</span>
  `;
  els.contentImagePreview.querySelector("[data-view-image]")?.addEventListener("click", () => {
    openImageViewer(image, puzzle.title);
  });
}

function savePuzzleContent(event) {
  event.preventDefault();
  const route = getActiveRoute();
  const puzzle = getSelectedContentPuzzle(route);
  if (!puzzle) return;

  updatePuzzleContentDraft();

  if (!puzzle.title || !puzzle.place || !puzzle.question || !puzzle.answer) {
    els.contentMessage.textContent = "Complétez tous les champs de l’énigme.";
    return;
  }

  saveData();
  renderAdmin();
  renderPlayer();
  showToast("Énigme enregistrée.");
}

function updatePuzzleContentDraft() {
  const route = getActiveRoute();
  const puzzle = getSelectedContentPuzzle(route);
  if (!puzzle) return;

  puzzle.title = els.contentTitleInput.value.trim();
  puzzle.place = els.contentPlaceInput.value.trim();
  puzzle.question = els.contentQuestionInput.value.trim();
  puzzle.arrivalMessage = els.contentArrivalInput.value.trim();
  puzzle.type = els.contentTypeSelect.value;
  puzzle.answer = els.contentAnswerInput.value.trim();
  savePuzzleI18nEditorV156(puzzle);
  saveData();
}

async function updatePuzzleImageFromFile(event) {
  const route = getActiveRoute();
  const puzzle = getSelectedContentPuzzle(route);
  const file = event.target.files?.[0];
  if (!puzzle || !file) return;

  els.contentMessage.textContent = "Image en cours d’ajout...";
  try {
    puzzle.image = await preparePuzzleImage(file);
    event.target.value = "";
    saveData();
    renderAdmin();
    renderPlayer();
    showToast("Image ajoutée à l’énigme.");
  } catch (error) {
    els.contentMessage.textContent = error?.message || "L’image n’a pas pu être ajoutée.";
    event.target.value = "";
  }
}

function removePuzzleImage() {
  const route = getActiveRoute();
  const puzzle = getSelectedContentPuzzle(route);
  if (!puzzle) return;

  delete puzzle.image;
  saveData();
  renderAdmin();
  renderPlayer();
  showToast("Image supprimée.");
}

function openImageViewer(image, title) {
  if (!image?.dataUrl) return;
  imageViewerZoom = 1;
  els.imageViewerTitle.textContent = title || image.name || "Image de l’énigme";
  els.imageViewerImage.src = image.dataUrl;
  els.imageViewerImage.alt = image.name || title || "Image de l’énigme";
  els.imageViewer.classList.remove("is-hidden");
  updateModalLock();
  updateImageViewerZoom();
  els.imageViewerCloseButton.focus();
}

function closeImageViewer() {
  els.imageViewer.classList.add("is-hidden");
  updateModalLock();
  els.imageViewerImage.removeAttribute("src");
}

function updateImageViewerZoom() {
  els.imageViewerImage.style.width = `${Math.round(imageViewerZoom * 100)}%`;
  els.imageZoomResetButton.textContent = `${Math.round(imageViewerZoom * 100)}%`;
  els.imageZoomOutButton.disabled = imageViewerZoom <= 1;
  els.imageZoomInButton.disabled = imageViewerZoom >= 3;
}

function zoomImageViewer(delta) {
  imageViewerZoom = Math.min(3, Math.max(1, Number((imageViewerZoom + delta).toFixed(2))));
  updateImageViewerZoom();
}

function resetImageViewerZoom() {
  imageViewerZoom = 1;
  updateImageViewerZoom();
}

function getSelectedGeoPuzzle(route) {
  if (!route?.puzzles?.length) return null;
  const selected = route.puzzles.find((puzzle) => puzzle.id === selectedGeoPuzzleId);
  return selected || route.puzzles[0];
}

function renderGeoEditor(route) {
  const puzzle = getSelectedGeoPuzzle(route);
  if (!puzzle) {
    els.geoPuzzleSelect.innerHTML = `<option>Aucune énigme</option>`;
    els.geoLatInput.value = "";
    els.geoLngInput.value = "";
    els.geoRadiusInput.value = "";
    els.geoRequiredInput.checked = false;
    els.geoForm.querySelector("button[type='submit']").disabled = true;
    els.geoMessage.textContent = "Ajoutez une énigme avant de régler une zone.";
    els.adminMap.dataset.mapKey = "";
    renderTileMap(els.adminMap, {
      center: DEFAULT_CENTER,
      target: DEFAULT_CENTER,
      radius: 120,
      editable: true,
    });
    return;
  }

  selectedGeoPuzzleId = puzzle.id;
  els.geoForm.querySelector("button[type='submit']").disabled = false;
  els.geoPuzzleSelect.innerHTML = route.puzzles
    .map((item, index) => `<option value="${item.id}" ${item.id === puzzle.id ? "selected" : ""}>${index + 1}. ${escapeHtml(item.title)}</option>`)
    .join("");
  els.geoLatInput.value = formatCoordinate(getPuzzleLat(puzzle));
  els.geoLngInput.value = formatCoordinate(getPuzzleLng(puzzle));
  els.geoRadiusInput.value = String(Math.round(getPuzzleRadius(puzzle)));
  els.geoRequiredInput.checked = Boolean(puzzle.requireLocation);
  els.geoMessage.textContent = `Cliquez sur la carte pour déplacer "${puzzle.title}".`;
  renderAdminMap(route, puzzle);
}

function renderAdminMap(route, puzzle) {
  const target = {
    lat: getPuzzleLat(puzzle),
    lng: getPuzzleLng(puzzle),
  };
  renderTileMap(els.adminMap, {
    center: target,
    target,
    radius: getPuzzleRadius(puzzle),
    editable: true,
  });
}

function updateGeoDraftFromMap(event) {
  const route = getActiveRoute();
  const puzzle = getSelectedGeoPuzzle(route);
  if (!puzzle) return;
  const rect = els.adminMap.getBoundingClientRect();
  const target = {
    lat: Number(els.geoLatInput.value) || getPuzzleLat(puzzle),
    lng: Number(els.geoLngInput.value) || getPuzzleLng(puzzle),
  };
  const zoom = Number(els.adminMap?.dataset.mapCurrentZoom) || MAP_ZOOM;
  const centerWorld = latLngToWorld(target.lat, target.lng, zoom);
  const topLeft = {
    x: centerWorld.x - rect.width / 2,
    y: centerWorld.y - rect.height / 2,
  };
  const point = worldToLatLng(topLeft.x + event.clientX - rect.left, topLeft.y + event.clientY - rect.top, zoom);

  els.geoLatInput.value = formatCoordinate(point.lat);
  els.geoLngInput.value = formatCoordinate(point.lng);
  els.geoMessage.textContent = "Point déplacé. Enregistrez pour appliquer la zone.";
  renderTileMap(els.adminMap, {
    center: point,
    target: point,
    radius: Number(els.geoRadiusInput.value) || getPuzzleRadius(puzzle),
    editable: true,
  });
}

function previewGeoDraft() {
  const route = getActiveRoute();
  const puzzle = getSelectedGeoPuzzle(route);
  if (!puzzle) return;
  const radius = Math.min(1000, Math.max(20, Number(els.geoRadiusInput.value) || getPuzzleRadius(puzzle)));
  const point = {
    lat: Number(els.geoLatInput.value) || getPuzzleLat(puzzle),
    lng: Number(els.geoLngInput.value) || getPuzzleLng(puzzle),
  };
  renderTileMap(els.adminMap, {
    center: point,
    target: point,
    radius,
    editable: true,
  });
}

function saveGeoZone(event) {
  event.preventDefault();
  const route = getActiveRoute();
  const puzzle = getSelectedGeoPuzzle(route);
  if (!puzzle) return;

  puzzle.lat = Number(els.geoLatInput.value) || getPuzzleLat(puzzle);
  puzzle.lng = Number(els.geoLngInput.value) || getPuzzleLng(puzzle);
  puzzle.radius = Math.min(1000, Math.max(20, Number(els.geoRadiusInput.value) || getPuzzleRadius(puzzle)));
  puzzle.requireLocation = els.geoRequiredInput.checked;
  saveData();
  render();
  showToast("Zone de validation enregistrée.");
}

function getSelectedHintPuzzle(route) {
  if (!route?.puzzles?.length) return null;
  const selected = route.puzzles.find((puzzle) => puzzle.id === selectedHintPuzzleId);
  return selected || route.puzzles[0];
}

function renderHintEditor(route) {
  const puzzle = getSelectedHintPuzzle(route);
  if (!puzzle) {
    els.hintPuzzleSelect.innerHTML = `<option>Aucune énigme</option>`;
    els.hintListEditor.innerHTML = "";
    els.addHintButton.disabled = true;
    els.hintsForm.querySelector("button[type='submit']").disabled = true;
    els.hintEditorMessage.textContent = "Ajoutez une énigme avant de créer des indices.";
    return;
  }

  selectedHintPuzzleId = puzzle.id;
  puzzle.hints ||= [];
  els.addHintButton.disabled = false;
  els.hintsForm.querySelector("button[type='submit']").disabled = false;
  els.hintPuzzleSelect.innerHTML = route.puzzles
    .map((item, index) => `<option value="${item.id}" ${item.id === puzzle.id ? "selected" : ""}>${index + 1}. ${escapeHtml(item.title)}</option>`)
    .join("");
  els.hintListEditor.innerHTML = puzzle.hints.length
    ? puzzle.hints.map((hint, index) => renderHintEditorRow(hint, index)).join("")
    : `<p class="form-message">Aucun indice pour cette énigme.</p>`;
  els.hintEditorMessage.textContent = puzzle.hints.length
    ? "Les indices sont délivrés dès qu’une des deux conditions est atteinte."
    : "Ajoutez un premier indice pour aider les équipes.";

  $$("[data-delete-hint]").forEach((button) => {
    button.addEventListener("click", () => deleteHint(Number(button.dataset.deleteHint)));
  });
}

function renderHintEditorRow(hint, index) {
  const afterAttempts = Math.max(0, Number(hint.afterAttempts) || 0);
  const afterMinutes = Math.max(0, Math.round((Number(hint.afterSeconds) || 0) / 60));
  return `
    <article class="hint-editor-row" data-hint-index="${index}">
      <div class="hint-editor-head">
        <strong>Indice ${index + 1}</strong>
        <button class="text-button" type="button" data-delete-hint="${index}">Supprimer</button>
      </div>
      <label>
        Texte de l’indice
        <textarea data-hint-field="text" required>${escapeHtml(hint.text || "")}</textarea>
      </label>
      <div class="hint-condition-grid">
        <label>
          Après essais
          <input data-hint-field="afterAttempts" type="number" min="0" value="${afterAttempts}" />
        </label>
        <label>
          Après minutes
          <input data-hint-field="afterMinutes" type="number" min="0" value="${afterMinutes}" />
        </label>
      </div>
    </article>
  `;
}

function collectHintRows() {
  return $$(".hint-editor-row")
    .map((row) => {
      const text = row.querySelector('[data-hint-field="text"]').value.trim();
      const afterAttempts = Math.max(0, Number(row.querySelector('[data-hint-field="afterAttempts"]').value) || 0);
      const afterMinutes = Math.max(0, Number(row.querySelector('[data-hint-field="afterMinutes"]').value) || 0);
      return {
        afterAttempts,
        afterSeconds: Math.round(afterMinutes * 60),
        text,
      };
    })
    .filter((hint) => hint.text);
}

function saveHints(event) {
  event.preventDefault();
  const route = getActiveRoute();
  const puzzle = getSelectedHintPuzzle(route);
  if (!puzzle) return;
  puzzle.hints = collectHintRows();
  saveData();
  renderHintEditor(route);
  renderPlayer();
  showToast("Indices enregistrés.");
}

function addHint() {
  const route = getActiveRoute();
  const puzzle = getSelectedHintPuzzle(route);
  if (!puzzle) return;
  puzzle.hints ||= [];
  puzzle.hints.push({
    afterAttempts: puzzle.hints.length + 1,
    afterSeconds: (puzzle.hints.length + 1) * 600,
    text: "Nouvel indice à personnaliser.",
  });
  saveData();
  renderHintEditor(route);
  showToast("Indice ajouté.");
}

function deleteHint(index) {
  const route = getActiveRoute();
  const puzzle = getSelectedHintPuzzle(route);
  if (!puzzle?.hints?.[index]) return;
  puzzle.hints.splice(index, 1);
  saveData();
  renderHintEditor(route);
  renderPlayer();
  showToast("Indice supprimé.");
}

function getTeamPositionDetails(team, route) {
  const position = team.lastPosition;
  if (!isUsablePosition(position)) return null;
  const target = getTeamTarget(team, route);
  const distance = target
    ? distanceInMeters(Number(position.lat), Number(position.lng), target.lat, target.lng)
    : NaN;
  return {
    position,
    target,
    distance,
    ageLabel: formatRelativeTime(position.at),
    isStale: Number(position.at) && Date.now() - Number(position.at) > 10 * 60 * 1000,
    accuracy: Number(position.accuracy),
  };
}

function getPositionMapUrl(position) {
  return `https://www.google.com/maps?q=${encodeURIComponent(`${position.lat},${position.lng}`)}`;
}

function getDirectionsMapUrl(position, target) {
  if (!target) return getPositionMapUrl(position);
  const origin = `${position.lat},${position.lng}`;
  const destination = `${target.lat},${target.lng}`;
  return `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}&travelmode=walking`;
}

function renderTeamPosition(team, route) {
  const details = getTeamPositionDetails(team, route);
  if (!details) {
    return `<span class="position-muted">Pas encore recue</span>`;
  }

  const precision = Number.isFinite(details.accuracy)
    ? `Precision +/-${Math.round(details.accuracy)} m`
    : "Precision inconnue";
  const distanceText = details.target
    ? `${formatDistanceMeters(details.distance)} de ${escapeHtml(details.target.puzzle.place || "l'objectif")}`
    : "Objectif inconnu";
  return `
    <div class="team-position">
      <strong>${details.isStale ? "Ancienne position" : "Position recue"}</strong>
      <span>${escapeHtml(details.ageLabel)} · ${precision}</span>
      <span>${distanceText}</span>
      <span class="position-actions">
        <a href="${escapeHtml(getPositionMapUrl(details.position))}" target="_blank" rel="noopener">Carte</a>
        ${details.target ? `<a href="${escapeHtml(getDirectionsMapUrl(details.position, details.target))}" target="_blank" rel="noopener">Guidage</a>` : ""}
      </span>
    </div>
  `;
}

function renderTeamLiveMap() {
  if (!els.teamLiveMap) return;

  const entries = data.teams
    .map((team) => {
      const route = getRoute(team.routeId);
      const details = route ? getTeamPositionDetails(team, route) : null;
      if (!route || !details || team.status !== "playing") return null;
      return { team, route, details };
    })
    .filter(Boolean);

  if (!entries.length) {
    const route = getActiveRoute();
    const target = route?.puzzles?.[0]
      ? { lat: getPuzzleLat(route.puzzles[0]), lng: getPuzzleLng(route.puzzles[0]), radius: getPuzzleRadius(route.puzzles[0]) }
      : { ...DEFAULT_CENTER, radius: 120 };
    renderTileMap(els.teamLiveMap, {
      target,
      radius: target.radius,
      editable: false,
    });
    const layer = els.teamLiveMap.querySelector(".map-layer");
    if (layer && !layer.querySelector(".map-empty-note")) {
      layer.insertAdjacentHTML("beforeend", `<span class="map-empty-note">Aucune position joueur recue pour le moment.</span>`);
    }
    return;
  }

  renderTileMap(els.teamLiveMap, {
    fitToPoints: true,
    players: entries.map((entry, index) => ({
      ...entry.details.position,
      label: `${index + 1}. ${entry.team.name}`,
      variant: String(index % 6),
    })),
    targets: entries.map((entry, index) => ({
      lat: entry.details.target.lat,
      lng: entry.details.target.lng,
      radius: entry.details.target.radius,
      label: `Obj. ${index + 1}`,
    })),
  });
}


const TEAM_AUTO_DELETE_MS = 10800000;

function getTeamStartedAt(team) {
  return Number(team?.startAt || team?.createdAt || 0);
}

function getTeamDeleteAvailability(team) {
  if (!team) return { available: false, label: "" };
  if (team.status === "won" || team.status === "lost") {
    return { available: true, label: "Partie terminée" };
  }
  const startedAt = getTeamStartedAt(team);
  if (!startedAt) return { available: false, label: "En cours" };
  const remainingMs = TEAM_AUTO_DELETE_MS - (Date.now() - startedAt);
  if (remainingMs <= 0) {
    return { available: true, label: "Plus de 3h" };
  }
  const remainingMinutes = Math.max(1, Math.ceil(remainingMs / 60000));
  return { available: false, label: "Suppression dans " + remainingMinutes + " min" };
}

function deleteTeamFromProgress(teamId) {
  const team = data.teams.find((item) => item.id === teamId);
  if (!team) return;
  const availability = getTeamDeleteAvailability(team);
  if (!availability.available) {
    showToast("Suppression disponible après 3h ou une fois la partie terminée.");
    return;
  }
  if (!window.confirm("Supprimer " + team.name + " de la progression ?")) return;

  rememberPendingAdminDelete("team", teamId);
  data.teams = data.teams.filter((item) => item.id !== teamId);
  const code = data.codes.find((item) => item.teamId === teamId || item.code === team.code);
  if (code) {
    code.teamId = null;
    code.status = "used";
    code.teamDeletedAt = Date.now();
  }
  if (localStorage.getItem(SESSION_KEY) === teamId) {
    localStorage.removeItem(SESSION_KEY);
  }
  saveData({ immediate: true });
  renderAdmin();
  renderPlayer();
  showToast("Équipe supprimée de la progression.");
}


function getTeamLastSyncAt(team) {
  return Math.max(
    Number(team?.updatedAt) || 0,
    Number(team?.lastPosition?.at) || 0,
    Number(team?.briefingStartLocation?.at) || 0,
    Number(team?.finishedAt) || 0,
    Number(team?.startAt) || 0,
    Number(team?.createdAt) || 0,
  );
}

function getTeamSyncHealth(team, route) {
  const lastPositionAt = Number(team?.lastPosition?.at) || 0;
  const lastSyncAt = getTeamLastSyncAt(team);
  const now = Date.now();
  const isTerminal = team?.status === "won" || team?.status === "lost";
  const progress = route ? getTeamProgress(team, route) : { solved: 0, total: 0 };

  if (isTerminal) {
    return {
      tone: "is-done",
      label: team.status === "won" ? "Termine" : "Cloture",
      detail: lastSyncAt ? `Derniere synchro ${formatRelativeTime(lastSyncAt)}` : "Synchro non datee",
      action: `${progress.solved}/${progress.total} enigmes`,
      lastSyncAt,
      lastPositionAt,
      needsAttention: false,
    };
  }

  if (team?.status === "briefing") {
    return {
      tone: lastPositionAt ? "is-ok" : "is-warn",
      label: lastPositionAt ? "Briefing localise" : "Briefing",
      detail: lastPositionAt ? `Position ${formatRelativeTime(lastPositionAt)}` : "En attente de position depart",
      action: "Pas encore en jeu",
      lastSyncAt,
      lastPositionAt,
      needsAttention: !lastPositionAt,
    };
  }

  if (!lastPositionAt) {
    return {
      tone: "is-danger",
      label: "Sans position",
      detail: lastSyncAt ? `Derniere synchro ${formatRelativeTime(lastSyncAt)}` : "Aucune synchro recue",
      action: "Demander au joueur de rouvrir le jeu et le GPS.",
      lastSyncAt,
      lastPositionAt,
      needsAttention: true,
    };
  }

  const positionAge = now - lastPositionAt;
  if (positionAge > ADMIN_TEAM_SYNC_DANGER_MS) {
    return {
      tone: "is-danger",
      label: "Position figee",
      detail: `Position ${formatRelativeTime(lastPositionAt)}`,
      action: "Faire rouvrir le jeu, garder l'ecran actif et verifier le GPS.",
      lastSyncAt,
      lastPositionAt,
      needsAttention: true,
    };
  }

  if (positionAge > ADMIN_TEAM_SYNC_WARN_MS) {
    return {
      tone: "is-warn",
      label: "A surveiller",
      detail: `Position ${formatRelativeTime(lastPositionAt)}`,
      action: "Actualisation attendue sous peu.",
      lastSyncAt,
      lastPositionAt,
      needsAttention: true,
    };
  }

  return {
    tone: "is-ok",
    label: "Synchro OK",
    detail: `Position ${formatRelativeTime(lastPositionAt)}`,
    action: `Derniere synchro ${formatRelativeTime(lastSyncAt)}`,
    lastSyncAt,
    lastPositionAt,
    needsAttention: false,
  };
}

function renderTeamSyncBadge(health) {
  return `
    <div class="team-sync-badge ${health.tone}">
      <strong>${escapeHtml(health.label)}</strong>
      <span>${escapeHtml(health.detail)}</span>
      <em>${escapeHtml(health.action)}</em>
    </div>
  `;
}

function renderTeamSyncSummary() {
  const target = $("#admin-sync-health-summary");
  if (!target) return;

  const entries = data.teams
    .map((team) => {
      const route = getRoute(team.routeId);
      return route ? { team, route, health: getTeamSyncHealth(team, route) } : null;
    })
    .filter(Boolean);
  const activeEntries = entries.filter((entry) => entry.team.status !== "won" && entry.team.status !== "lost");
  const dangerCount = activeEntries.filter((entry) => entry.health.tone === "is-danger").length;
  const warnCount = activeEntries.filter((entry) => entry.health.tone === "is-warn").length;
  const okCount = activeEntries.filter((entry) => entry.health.tone === "is-ok").length;
  const doneCount = entries.length - activeEntries.length;
  const serverTone = serverSyncEnabled ? "is-ok" : "is-danger";
  const serverLabel = serverSyncEnabled ? "Serveur connecte" : "Serveur a verifier";
  const serverDetail = lastLiveTeamSuccessAt
    ? `Dernier refresh ${formatRelativeTime(lastLiveTeamSuccessAt)}`
    : lastLiveTeamRefreshAt
      ? `Refresh tente ${formatRelativeTime(lastLiveTeamRefreshAt)}`
      : "En attente du premier refresh";
  const attentionList = activeEntries
    .filter((entry) => entry.health.needsAttention)
    .slice(0, 3)
    .map((entry) => `<li><strong>${escapeHtml(entry.team.name)}</strong> - ${escapeHtml(entry.health.label)} · ${escapeHtml(entry.health.detail)}</li>`)
    .join("");

  target.innerHTML = `
    <div class="sync-health-head">
      <div>
        <p class="section-label">Stabilite live</p>
        <h3>Suivi des synchronisations</h3>
      </div>
      <span class="sync-health-server ${serverTone}">${escapeHtml(serverLabel)} · ${escapeHtml(serverDetail)}</span>
    </div>
    <div class="sync-health-strip">
      <span class="sync-health-pill is-ok">${okCount} OK</span>
      <span class="sync-health-pill is-warn">${warnCount} a surveiller</span>
      <span class="sync-health-pill is-danger">${dangerCount} alerte</span>
      <span class="sync-health-pill is-done">${doneCount} terminee</span>
    </div>
    ${attentionList ? `<ul class="sync-health-alerts">${attentionList}</ul>` : '<p class="sync-health-note">Aucune alerte active sur les equipes en cours.</p>'}
  `;
}

function renderTeamTable() {
  els.teamTable.innerHTML = data.teams.length
    ? data.teams
        .map((team) => {
          const route = getRoute(team.routeId);
          if (!route) return "";
          const progress = getTeamProgress(team, route);
          const syncHealth = getTeamSyncHealth(team, route);
          const statusClass = team.status === "won" ? "is-success" : team.status === "lost" ? "is-danger" : "";
          const statusText = team.status === "won" ? "Gagné" : team.status === "lost" ? "Perdu" : "En cours";
          const deleteInfo = getTeamDeleteAvailability(team);
          const action = deleteInfo.available
            ? '<button class="danger-button compact-button" type="button" data-delete-team="' + escapeHtml(team.id) + '">Supprimer</button>'
            : '<span class="position-muted">' + escapeHtml(deleteInfo.label) + '</span>';
          return [
            '<tr>',
              '<td><strong>' + escapeHtml(team.name) + '</strong></td>',
              '<td>' + escapeHtml(team.code) + '</td>',
              '<td>' + escapeHtml(route.title) + '</td>',
              '<td><div class="mini-progress"><span>' + progress.solved + ' / ' + progress.total + '</span><span class="mini-progress-bar"><span style="width:' + progress.percent + '%"></span></span></div></td>',
              '<td>' + renderTeamPosition(team, route) + '</td>',
              '<td>' + renderTeamSyncBadge(syncHealth) + '</td>',
              '<td><span class="state-text ' + statusClass + '">' + statusText + '</span></td>',
              '<td>' + action + '</td>',
            '</tr>',
          ].join("");
        })
        .join("")
    : '<tr><td colspan="8">Aucune équipe connectée.</td></tr>';

  $$("[data-delete-team]").forEach((button) => {
    button.addEventListener("click", () => deleteTeamFromProgress(button.dataset.deleteTeam));
  });
  renderTeamSyncSummary();
  renderTeamLiveMap();
}

function renderCodeList() {
  els.codeList.innerHTML = data.codes
    .slice()
    .sort((a, b) => b.createdAt - a.createdAt)
    .map((code) => {
      const route = getRoute(code.routeId);
      const customerName = code.customerName || [code.customerFirstName, code.customerLastName].filter(Boolean).join(" ");
      const customerAddress = formatCustomerAddress(code.customerAddress);
      const customerDetails = [
        customerName ? `Client : ${customerName}` : "",
        code.customerEmail ? `E-mail : ${code.customerEmail}` : "",
        customerAddress ? `Adresse : ${customerAddress}` : "",
      ].filter(Boolean);
      const mailStatus = code.source === "stripe"
        ? code.confirmationEmailSentAt
          ? "Mail envoyé"
          : code.confirmationEmailStatus === "error"
            ? "Mail non envoyé"
            : code.confirmationEmailStatus === "missing_email"
              ? "E-mail manquant"
              : "Mail en attente"
        : "";
      return `
        <article class="code-row">
          <div>
            <strong>${escapeHtml(code.code)}</strong>
            ${customerDetails.length ? `<p class="code-customer">${customerDetails.map(escapeHtml).join(" · ")}</p>` : ""}
            ${mailStatus ? `<p class="code-mail-status">${escapeHtml(mailStatus)}</p>` : ""}
            <p>${escapeHtml(route?.title || "Parcours supprimé")} · ${code.status === "used" ? "utilisé" : "disponible"}</p>
          </div>
          <div class="code-actions">
            <button class="secondary-button" type="button" data-copy-code="${code.code}">Copier</button>
            ${
              code.status === "used"
                ? `<button class="danger-button" type="button" data-delete-code="${code.code}">Supprimer</button>`
                : ""
            }
          </div>
        </article>
      `;
    })
    .join("");

  $$("[data-copy-code]").forEach((button) => {
    button.addEventListener("click", () => copyCode(button.dataset.copyCode));
  });
  $$("[data-delete-code]").forEach((button) => {
    button.addEventListener("click", () => deleteUsedCode(button.dataset.deleteCode));
  });
}

function deleteUsedCode(codeValue) {
  const code = data.codes.find((item) => item.code === codeValue);
  if (!code || code.status !== "used") {
    showToast("Seuls les codes utilisés peuvent être supprimés.");
    return;
  }

  rememberPendingAdminDelete("code", codeValue);
  data.codes = data.codes.filter((item) => item.code !== codeValue);
  saveData({ immediate: true });
  renderCodeList();
  showToast("Code utilisé supprimé.");
}

async function createRoute(event) {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  const imageFile = form.get("cover-image");
  const route = {
    id: createId("route"),
    title: String(form.get("title")).trim(),
    area: String(form.get("area")).trim(),
    duration: Number(form.get("duration")) || 90,
    distance: String(form.get("distance") || "").trim() || "\u00c0 d\u00e9finir",
    pricePerTeam: Math.max(0, Number(form.get("price")) || 0),
    pricePerPerson: Math.max(0, Number(form.get("price")) || 0),
    shopVisible: form.get("shop-visible") === "on",
    description: String(form.get("description")).trim(),
    briefingText: String(form.get("briefing-text") || "").trim(),
    finishMessage: String(form.get("finish-message") || "").trim(),
    startPlace: String(form.get("start-place") || "").trim(),
    startAddress: String(form.get("start-address") || "").trim(),
    startLat: parseOptionalCoordinate(form.get("start-lat")),
    startLng: parseOptionalCoordinate(form.get("start-lng")),
    puzzles: [],
  };

  if (imageFile?.size) {
    try {
      route.coverImage = await prepareRouteCoverImage(imageFile);
    } catch (error) {
      showToast(error?.message || "L\u2019image n\u2019a pas pu \u00eatre ajout\u00e9e.");
      return;
    }
  }

  data.routes.push(route);
  setActiveRoute(route.id);
  event.currentTarget.reset();
  showToast("Parcours ajout\u00e9.");
}


async function createPuzzle(event) {
  event.preventDefault();
  const route = getActiveRoute();
  const form = new FormData(event.currentTarget);
  const imageFile = form.get("image");
  const puzzle = {
    id: createId("puzzle"),
    title: String(form.get("title")).trim(),
    place: String(form.get("place")).trim(),
    type: String(form.get("type")),
    requireLocation: true,
    lat: 50.29225,
    lng: 5.55995,
    radius: 120,
    question: String(form.get("question")).trim(),
    arrivalMessage: String(form.get("arrival-message") || "").trim(),
    answer: String(form.get("answer")).trim(),
    hints: [
      { afterAttempts: 1, afterSeconds: 600, text: "Premier indice à personnaliser." },
      { afterAttempts: 2, afterSeconds: 1200, text: "Deuxième indice à personnaliser." },
    ],
  };

  if (imageFile?.size) {
    try {
      puzzle.image = await preparePuzzleImage(imageFile);
    } catch (error) {
      showToast(error?.message || "L’image n’a pas pu être ajoutée.");
      return;
    }
  }

  route.puzzles.push(puzzle);
  selectedGeoPuzzleId = puzzle.id;
  selectedHintPuzzleId = puzzle.id;
  selectedContentPuzzleId = puzzle.id;
  saveData();
  event.currentTarget.reset();
  renderAdmin();
  showToast("Énigme ajoutée.");
}

function generateCode() {
  const route = getActiveRoute();
  const code = makeActivationCode(route);
  data.codes.unshift({
    code,
    routeId: route.id,
    status: "available",
    teamId: null,
    createdAt: Date.now(),
  });
  saveData();
  renderAdmin();
  showToast(`Code créé : ${code}`);
}

function makeActivationCode(route) {
  const prefix = route.area
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z]/gi, "")
    .slice(0, 3)
    .toUpperCase()
    .padEnd(3, "E");
  let code = "";
  do {
    const left = randomInt(100, 999);
    const right = randomInt(100, 999);
    code = `${left}-${prefix}-${right}`;
  } while (data.codes.some((item) => item.code === code));
  return code;
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function resetSeed() {
  data = createSeedData();
  saveData();
  localStorage.removeItem(SESSION_KEY);
  localStorage.setItem(ACTIVE_ROUTE_KEY, data.activeRouteId);
  render();
  showToast("Démo réinitialisée.");
}

async function copyCode(code) {
  try {
    await navigator.clipboard.writeText(code);
    showToast("Code copié.");
  } catch {
    showToast(code);
  }
}

async function handleCheckoutReturn() {
  if (!canUseBackend()) return;
  const params = new URLSearchParams(window.location.search);
  if (params.get("checkout") === "cancel") {
    showToast("Paiement annule.");
    window.history.replaceState({}, "", `${window.location.pathname}${window.location.hash || "#player"}`);
    return;
  }
  if (params.get("checkout") !== "success") return;
  const sessionId = params.get("session_id");
  if (!sessionId) return;

  try {
    els.activationMessage.textContent = "Recuperation de vos codes d'activation...";
    const response = await fetch(`${API_CHECKOUT_SESSION_URL}?session_id=${encodeURIComponent(sessionId)}`, {
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
    data.codes = [];

    renderPlayer();
    els.activationCode.value = activationCodes[0];
    const mailInfo = payload.emailSent
      ? " Un e-mail de confirmation vient aussi d'etre envoye avec tous les codes."
      : payload.emailConfigured === false
        ? " L'e-mail de confirmation sera actif des que l'envoi mail sera configure."
        : "";
    const codesLabel = activationCodes.length > 1
      ? `Codes crees : ${activationCodes.join(", ")}. Chaque equipe utilise un code different.`
      : `Code cree : ${activationCodes[0]}. Vous pouvez le valider pour demarrer.`;
    els.activationMessage.textContent = `${codesLabel}${mailInfo}`;
    showToast(payload.emailSent ? "Paiement valide, codes envoyes par e-mail." : "Paiement valide, codes crees.");
  } catch (error) {
    els.activationMessage.textContent = error.message || "Impossible de recuperer les codes.";
  } finally {
    window.history.replaceState({}, "", `${window.location.pathname}${window.location.hash || "#player"}`);
  }
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}


const IMAGE_FALLBACK_V157 = "assets/home-hero-vicinal-v90-small.jpg?v=157";

function setupImageHealthV157() {
  if (window.__escapeImageHealthV157) return;
  window.__escapeImageHealthV157 = true;
  document.addEventListener("error", (event) => {
    const img = event.target;
    if (!(img instanceof HTMLImageElement)) return;
    const src = img.currentSrc || img.getAttribute("src") || "";
    if (!src || src.startsWith("data:") || src.includes("tile.openstreetmap.org")) return;
    if (!src.includes("assets/") || img.dataset.imageHealthFallback === "1") return;
    img.dataset.imageHealthFallback = "1";
    img.classList.add("image-fallback-applied");
    img.src = IMAGE_FALLBACK_V157;
  }, true);
}

function bindEvents() {
  setupImageHealthV157();
  els.installAppButton?.addEventListener("click", installApp);
  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferredInstallPrompt = event;
    updateInstallButton();
  });
  window.addEventListener("appinstalled", () => {
    deferredInstallPrompt = null;
    showToast("Application installée.");
    updateInstallButton();
  });
  updateInstallButton();
  window.addEventListener("hashchange", () => {
    setHashView();
    if (isAdminRouteActive()) syncDataFromServer();
  });
  window.addEventListener("beforeunload", () => {
    stopGeolocationWatch();
    stopBriefingGeolocationWatch();
    flushServerSave();
  });
  els.activationForm.addEventListener("submit", handleActivation);
  els.startAdventureButton?.addEventListener("click", startAdventure);
  els.briefingLocateButton?.addEventListener("click", locateBriefingStart);
  els.resetSessionButton.addEventListener("click", resetSession);
  els.editTeamButton.addEventListener("click", openTeamNameEditor);
  els.teamNameForm.addEventListener("submit", saveTeamName);
  els.hintButton.addEventListener("click", requestHint);
  els.locateButton.addEventListener("click", locatePlayer);
  els.demoUnlockButton?.addEventListener("click", unlockCurrentPuzzleByDemo);
  els.adminLoginForm.addEventListener("submit", handleAdminLogin);
  els.adminLogoutButton.addEventListener("click", handleAdminLogout);
  els.seedButton?.addEventListener("click", resetSeed);
  els.generateCodeButton.addEventListener("click", generateCode);
  els.routeForm.addEventListener("submit", createRoute);
  els.routeDetailsForm.addEventListener("submit", saveRouteDetails);
  const routeDetailsSaveButton = els.routeDetailsForm.querySelector("button[type='submit']");
  routeDetailsSaveButton.addEventListener("click", saveRouteDetails);
  routeDetailsSaveButton.addEventListener("pointerdown", saveRouteDetails);
  [
    els.routeDetailsTitleInput,
    els.routeDetailsAreaInput,
    els.routeDetailsDurationInput,
    els.routeDetailsDistanceInput,
    els.routeDetailsPriceInput,
    els.routeDetailsShopVisibleInput,
    els.routeDetailsDescriptionInput,
    els.routeDetailsBriefingInput,
    els.routeDetailsFinishInput,
    els.routeDetailsStartPlaceInput,
    els.routeDetailsStartAddressInput,
    els.routeDetailsStartLatInput,
    els.routeDetailsStartLngInput,
  ].forEach((field) => {
    field.addEventListener("input", updateRouteDetailsDraft);
    field.addEventListener("change", updateRouteDetailsDraft);
  });
  els.routeDetailsImageInput.addEventListener("change", updateRouteCoverFromFile);
  els.removeRouteImageButton.addEventListener("click", removeRouteCoverImage);
  els.puzzleForm.addEventListener("submit", createPuzzle);
  els.puzzleContentForm.addEventListener("submit", savePuzzleContent);
  const contentSaveButton = els.puzzleContentForm.querySelector("button[type='submit']");
  contentSaveButton.addEventListener("click", savePuzzleContent);
  contentSaveButton.addEventListener("pointerdown", savePuzzleContent);
  els.contentPuzzleSelect.addEventListener("change", (event) => {
    selectedContentPuzzleId = event.target.value;
    renderPuzzleContentEditor(getActiveRoute());
  });
  [
    els.contentTitleInput,
    els.contentPlaceInput,
    els.contentQuestionInput,
    els.contentArrivalInput,
    els.contentTypeSelect,
    els.contentAnswerInput,
  ].forEach((field) => {
    field.addEventListener("input", updatePuzzleContentDraft);
    field.addEventListener("change", updatePuzzleContentDraft);
  });
  els.contentImageInput.addEventListener("change", updatePuzzleImageFromFile);
  els.removeContentImageButton.addEventListener("click", removePuzzleImage);
  els.imageViewerCloseButton.addEventListener("click", closeImageViewer);
  els.imageViewer.querySelector("[data-close-image-viewer]").addEventListener("click", closeImageViewer);
  els.arrivalModalCloseButton?.addEventListener("click", closeArrivalModal);
  els.arrivalModalOkButton?.addEventListener("click", closeArrivalModal);
  els.arrivalModal?.querySelector("[data-close-arrival-modal]")?.addEventListener("click", closeArrivalModal);
  els.imageZoomOutButton.addEventListener("click", () => zoomImageViewer(-0.25));
  els.imageZoomResetButton.addEventListener("click", resetImageViewerZoom);
  els.imageZoomInButton.addEventListener("click", () => zoomImageViewer(0.25));
  els.imageViewerImage.addEventListener("dblclick", () => {
    imageViewerZoom = imageViewerZoom > 1 ? 1 : 1.75;
    updateImageViewerZoom();
  });
  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !els.arrivalModal?.classList.contains("is-hidden")) {
      closeArrivalModal();
      return;
    }
    if (els.imageViewer.classList.contains("is-hidden")) return;
    if (event.key === "Escape") closeImageViewer();
    if (event.key === "+" || event.key === "=") zoomImageViewer(0.25);
    if (event.key === "-") zoomImageViewer(-0.25);
    if (event.key === "0") resetImageViewerZoom();
  });
  els.geoForm.addEventListener("submit", saveGeoZone);
  const geoSaveButton = els.geoForm.querySelector("button[type='submit']");
  geoSaveButton.addEventListener("click", saveGeoZone);
  geoSaveButton.addEventListener("pointerdown", saveGeoZone);
  els.geoPuzzleSelect.addEventListener("change", (event) => {
    selectedGeoPuzzleId = event.target.value;
    renderGeoEditor(getActiveRoute());
  });
  els.adminMap.addEventListener("click", updateGeoDraftFromMap);
  els.adminMap.addEventListener("pointerdown", updateGeoDraftFromMap);
  els.adminMap.addEventListener("mousedown", updateGeoDraftFromMap);
  els.geoLatInput.addEventListener("input", previewGeoDraft);
  els.geoLngInput.addEventListener("input", previewGeoDraft);
  els.geoRadiusInput.addEventListener("input", previewGeoDraft);
  els.hintsForm.addEventListener("submit", saveHints);
  els.hintPuzzleSelect.addEventListener("change", (event) => {
    selectedHintPuzzleId = event.target.value;
    renderHintEditor(getActiveRoute());
  });
  els.addHintButton.addEventListener("click", addHint);
  els.routeSelect.addEventListener("change", (event) => setActiveRoute(event.target.value));
  $$("[data-copy-code]").forEach((button) => {
    button.addEventListener("click", () => copyCode(button.dataset.copyCode));
  });
}

function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;
  if (!["http:", "https:"].includes(location.protocol)) return;

  navigator.serviceWorker.register("service-worker.js")
    .then((registration) => {
      registration.update().catch(() => {});
      let updateHandled = false;
      navigator.serviceWorker.addEventListener("controllerchange", () => {
        if (updateHandled) return;
        updateHandled = true;

        const currentTeam = getCurrentTeam();
        if (currentTeam || isAdminRouteActive()) {
          showToast("Nouvelle version installee. Actualisez la page quand possible.");
          return;
        }

        try {
          const lockKey = "escape-erezee-sw-reload-lock";
          const lockedUntil = Number(sessionStorage.getItem(lockKey) || 0);
          if (Date.now() < lockedUntil) return;
          sessionStorage.setItem(lockKey, String(Date.now() + 5000));
        } catch {
          // Session storage can be unavailable on some private browsers.
        }

        window.location.reload();
      });
    })
    .catch(() => {});
}

bindEvents();
setHashView();
startTicker();
registerServiceWorker();
syncDataFromServer().finally(handleCheckoutReturn);


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
      : { tone: "is-warn", title: "GPS a confirmer", text: "Localisez-vous au point de depart avant de lancer l&#039;aventure." };
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
  if (!team) {
    refs.panel.classList.add("is-hidden");
    return;
  }

  const status = playerRescueStatus(team, route);
  const requiresAttention = team.status === "playing" && status.tone !== "is-ok";
  refs.panel.classList.toggle("is-hidden", !requiresAttention);
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


/* admin-data-safety-v103 */
const ADMIN_DATA_SAFETY_URL = "/api/admin/data-safety";

function adminDataSafetyFormatTime(timestamp) {
  if (!timestamp) return "jamais";
  try {
    return new Intl.DateTimeFormat("fr-BE", {
      dateStyle: "short",
      timeStyle: "short",
    }).format(new Date(Number(timestamp)));
  } catch {
    return "date indisponible";
  }
}

function adminDataSafetyEnsurePanel() {
  const adminContent = document.querySelector("#admin-content");
  if (!adminContent) return null;

  let panel = document.querySelector("#admin-data-safety-panel");
  if (!panel) {
    panel = document.createElement("section");
    panel.className = "data-safety-panel";
    panel.id = "admin-data-safety-panel";
    panel.innerHTML = [
      '<div class="data-safety-copy">',
        '<p class="section-label">Securite des donnees</p>',
        '<h3>Sauvegardes serveur</h3>',
        '<p id="admin-data-safety-status">Verification en attente.</p>',
      "</div>",
      '<div class="data-safety-actions">',
        '<button class="secondary-button compact-button" type="button" id="admin-data-safety-refresh">Verifier</button>',
        '<button class="primary-button compact-button" type="button" id="admin-data-safety-backup">Creer une sauvegarde</button>',
      "</div>",
    ].join("");

    const firstSection = adminContent.querySelector(".admin-section, section");
    if (firstSection?.parentNode) {
      firstSection.parentNode.insertBefore(panel, firstSection);
    } else {
      adminContent.prepend(panel);
    }
  }

  const refreshButton = panel.querySelector("#admin-data-safety-refresh");
  const backupButton = panel.querySelector("#admin-data-safety-backup");
  if (refreshButton && refreshButton.dataset.bound !== "1") {
    refreshButton.dataset.bound = "1";
    refreshButton.addEventListener("click", () => adminDataSafetyRefresh());
  }
  if (backupButton && backupButton.dataset.bound !== "1") {
    backupButton.dataset.bound = "1";
    backupButton.addEventListener("click", () => adminDataSafetyCreateBackup());
  }

  return {
    panel,
    status: panel.querySelector("#admin-data-safety-status"),
    refreshButton,
    backupButton,
  };
}

function adminDataSafetyRender(payload) {
  const refs = adminDataSafetyEnsurePanel();
  if (!refs) return;

  if (!payload?.ok || !payload.data) {
    refs.status.textContent = payload?.message || "Statut des sauvegardes indisponible.";
    return;
  }

  const data = payload.data;
  const backups = payload.backups || {};
  const trackedTeams = Number(data.teamTracking ?? data.teams ?? 0);
  const totalTeams = Number(data.teams ?? 0);
  const archivedTeams = Number(data.teamArchive ?? Math.max(0, totalTeams - trackedTeams));
  const teamText = archivedTeams > 0
    ? trackedTeams + " equipes dans le suivi (" + totalTeams + " total, " + archivedTeams + " anciennes sans parcours)"
    : trackedTeams + " equipes dans le suivi";
  const latest = backups.latest
    ? "Derniere sauvegarde : " + adminDataSafetyFormatTime(backups.latest.modifiedAt)
    : "Aucune sauvegarde disponible.";
  refs.status.textContent = [
    data.routes + " parcours",
    teamText,
    data.codes + " codes",
    backups.count + " sauvegarde" + (backups.count > 1 ? "s" : ""),
    latest,
  ].join(" - ");
}

async function adminDataSafetyFetch(options = {}) {
  const response = await fetch(ADMIN_DATA_SAFETY_URL, {
    method: options.method || "GET",
    headers: { Accept: "application/json" },
    credentials: "same-origin",
    cache: "no-store",
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.message || "Statut sauvegarde indisponible.");
  return payload;
}

async function adminDataSafetyRefresh() {
  const refs = adminDataSafetyEnsurePanel();
  if (!refs) return;
  refs.status.textContent = "Verification des sauvegardes...";
  try {
    adminDataSafetyRender(await adminDataSafetyFetch());
  } catch (error) {
    refs.status.textContent = error.message || "Statut sauvegarde indisponible.";
  }
}

async function adminDataSafetyCreateBackup() {
  const refs = adminDataSafetyEnsurePanel();
  if (!refs) return;
  refs.backupButton.disabled = true;
  refs.status.textContent = "Creation de la sauvegarde...";
  try {
    const payload = await adminDataSafetyFetch({ method: "POST" });
    adminDataSafetyRender(payload);
    showToast("Sauvegarde serveur creee.");
  } catch (error) {
    refs.status.textContent = error.message || "Sauvegarde impossible.";
  } finally {
    refs.backupButton.disabled = false;
  }
}

function adminDataSafetyInstall() {
  if (window.__adminDataSafetyV103Installed) return;
  window.__adminDataSafetyV103Installed = true;
  const originalRenderAdmin = renderAdmin;
  renderAdmin = function renderAdminWithDataSafety(...args) {
    const result = originalRenderAdmin.apply(this, args);
    const adminContent = document.querySelector("#admin-content");
    if (adminContent && !adminContent.classList.contains("is-hidden")) {
      adminDataSafetyEnsurePanel();
      adminDataSafetyRefresh();
    }
    return result;
  };
  window.setTimeout(() => {
    const adminContent = document.querySelector("#admin-content");
    if (adminContent && !adminContent.classList.contains("is-hidden")) {
      adminDataSafetyEnsurePanel();
      adminDataSafetyRefresh();
    }
  }, 1200);
}

adminDataSafetyInstall();

/* admin-data-safety-counts-v104 */

/* shop-initial-sync-v105 */

/* service-worker-update-v106 */

/* admin-quick-console-v113 */
function adminQuickConsoleEscape(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function adminQuickConsoleRoutes() {
  return Array.isArray(data?.routes) ? data.routes : [];
}

function adminQuickConsoleRouteIds() {
  return new Set(adminQuickConsoleRoutes().map((route) => route?.id).filter(Boolean));
}

function adminQuickConsoleTeams() {
  const routeIds = adminQuickConsoleRouteIds();
  return (Array.isArray(data?.teams) ? data.teams : []).filter((team) => routeIds.has(team?.routeId));
}

function adminQuickConsoleCodes() {
  const routeIds = adminQuickConsoleRouteIds();
  return (Array.isArray(data?.codes) ? data.codes : []).filter((code) => routeIds.has(code?.routeId));
}

function adminQuickConsoleFormatSync() {
  const timestamp = typeof lastLiveTeamSuccessAt === "number" ? lastLiveTeamSuccessAt : 0;
  if (!serverSyncEnabled) return "serveur a verifier";
  if (!timestamp) return "connecte";
  if (typeof formatRelativeTime === "function") return formatRelativeTime(timestamp);
  const seconds = Math.max(0, Math.round((Date.now() - timestamp) / 1000));
  if (seconds < 60) return "a l'instant";
  const minutes = Math.round(seconds / 60);
  return "il y a " + minutes + " min";
}

function adminQuickConsoleEnsure() {
  const adminContent = document.querySelector("#admin-content");
  const topbar = document.querySelector(".admin-topbar");
  if (!adminContent || !topbar || adminContent.classList.contains("is-hidden")) return null;

  let consoleEl = document.querySelector("#admin-quick-console");
  if (!consoleEl) {
    consoleEl = document.createElement("section");
    consoleEl.id = "admin-quick-console";
    consoleEl.className = "admin-quick-console";
    consoleEl.setAttribute("aria-label", "Console rapide de gestion");
    consoleEl.innerHTML = [
      '<div class="admin-quick-card"><p>Parcours</p><strong data-admin-quick-routes>0</strong><span data-admin-quick-active-route>Actif non defini</span></div>',
      '<div class="admin-quick-card"><p>Suivi live</p><strong data-admin-quick-teams>0</strong><span data-admin-quick-teams-detail>Aucune equipe active</span></div>',
      '<div class="admin-quick-card"><p>Codes</p><strong data-admin-quick-codes>0</strong><span data-admin-quick-codes-detail>Aucun code actif</span></div>',
      '<div class="admin-quick-card"><p>Synchro</p><strong data-admin-quick-sync>--</strong><span>Actualisation auto</span></div>',
      '<div class="admin-quick-actions" aria-label="Raccourcis de gestion">',
        '<button class="secondary-button compact-button" type="button" data-admin-quick-jump="teams">Voir le suivi</button>',
        '<button class="secondary-button compact-button" type="button" data-admin-quick-jump="codes">Voir les codes</button>',
        '<button class="secondary-button compact-button" type="button" data-admin-quick-jump="routes">Voir les parcours</button>',
        '<button class="secondary-button compact-button" type="button" data-admin-quick-jump="backups">Sauvegardes</button>',
      '</div>',
    ].join("");
    topbar.insertAdjacentElement("afterend", consoleEl);
    consoleEl.addEventListener("click", (event) => {
      const button = event.target.closest("[data-admin-quick-jump]");
      if (!button) return;
      const targets = {
        teams: '[aria-labelledby="teams-heading"]',
        codes: '[aria-labelledby="codes-heading"]',
        routes: '[aria-labelledby="routes-heading"]',
        backups: "#admin-data-safety-panel",
      };
      const target = document.querySelector(targets[button.dataset.adminQuickJump]);
      if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  return consoleEl;
}

function adminQuickConsoleRender() {
  const consoleEl = adminQuickConsoleEnsure();
  if (!consoleEl) return;

  if (canUseBackend() && typeof initialAdminServerSyncPending !== "undefined" && initialAdminServerSyncPending) {
    const message = initialAdminServerSyncFailed ? "nouvel essai" : "chargement";
    consoleEl.querySelector("[data-admin-quick-routes]").textContent = "--";
    consoleEl.querySelector("[data-admin-quick-active-route]").textContent = "Donnees serveur en cours";
    consoleEl.querySelector("[data-admin-quick-teams]").textContent = "--";
    consoleEl.querySelector("[data-admin-quick-teams-detail]").textContent = "Suivi en attente";
    consoleEl.querySelector("[data-admin-quick-codes]").textContent = "--";
    consoleEl.querySelector("[data-admin-quick-codes-detail]").textContent = "Codes en attente";
    consoleEl.querySelector("[data-admin-quick-sync]").textContent = message;
    return;
  }

  const routes = adminQuickConsoleRoutes();
  const teams = adminQuickConsoleTeams();
  const activeTeams = teams.filter((team) => team.status !== "won" && team.status !== "lost");
  const finishedTeams = teams.length - activeTeams.length;
  const codes = adminQuickConsoleCodes();
  const availableCodes = codes.filter((code) => code.status !== "used").length;
  const activeRoute = routes.find((route) => route.id === data?.activeRouteId) || routes[0] || null;

  consoleEl.querySelector("[data-admin-quick-routes]").textContent = String(routes.length);
  consoleEl.querySelector("[data-admin-quick-active-route]").textContent = activeRoute
    ? "Actif : " + (activeRoute.title || activeRoute.name || "parcours")
    : "Aucun parcours actif";
  consoleEl.querySelector("[data-admin-quick-teams]").textContent = String(activeTeams.length);
  consoleEl.querySelector("[data-admin-quick-teams-detail]").textContent = finishedTeams
    ? finishedTeams + " terminee(s) dans l'historique"
    : "Aucune equipe terminee";
  consoleEl.querySelector("[data-admin-quick-codes]").textContent = String(codes.length);
  consoleEl.querySelector("[data-admin-quick-codes-detail]").textContent = availableCodes + " disponible(s)";
  consoleEl.querySelector("[data-admin-quick-sync]").textContent = adminQuickConsoleFormatSync();
}

function adminQuickConsoleInstall() {
  if (window.__adminQuickConsoleV113Installed) return;
  window.__adminQuickConsoleV113Installed = true;

  const originalRenderAdminQuickConsole = renderAdmin;
  renderAdmin = function renderAdminWithQuickConsole(...args) {
    const result = originalRenderAdminQuickConsole.apply(this, args);
    window.setTimeout(adminQuickConsoleRender, 0);
    return result;
  };

  if (typeof renderTeamTable === "function") {
    const originalRenderTeamTableQuickConsole = renderTeamTable;
    renderTeamTable = function renderTeamTableWithQuickConsole(...args) {
      const result = originalRenderTeamTableQuickConsole.apply(this, args);
      window.setTimeout(adminQuickConsoleRender, 0);
      return result;
    };
  }

  if (typeof renderCodeList === "function") {
    const originalRenderCodeListQuickConsole = renderCodeList;
    renderCodeList = function renderCodeListWithQuickConsole(...args) {
      const result = originalRenderCodeListQuickConsole.apply(this, args);
      window.setTimeout(adminQuickConsoleRender, 0);
      return result;
    };
  }

  window.setInterval(() => {
    if (location.hash === "#admin") adminQuickConsoleRender();
  }, 15000);
  window.setTimeout(adminQuickConsoleRender, 800);
}

adminQuickConsoleInstall();
/* admin-initial-sync-v114 */

/* admin-workspace-v115 */
const ADMIN_WORKSPACE_STORAGE_KEY = "escape-erezee-admin-tab-v115";
const ADMIN_WORKSPACE_TABS = [
  { id: "overview", label: "Vue d'ensemble" },
  { id: "live", label: "Suivi live" },
  { id: "routes", label: "Parcours" },
  { id: "puzzles", label: "Enigmes" },
  { id: "codes", label: "Codes" },
  { id: "backups", label: "Sauvegardes" },
];
const ADMIN_WORKSPACE_SECTION_GROUPS = {
  overview: ["admin-data-safety-panel", "routes-heading", "teams-heading", "codes-heading"],
  live: ["teams-heading"],
  routes: ["routes-heading", "create-route-heading", "route-details-heading"],
  puzzles: ["puzzles-heading", "content-heading", "create-puzzle-heading", "geo-heading", "hints-heading"],
  codes: ["codes-heading"],
  backups: ["admin-data-safety-panel"],
};
const ADMIN_WORKSPACE_COLLAPSIBLE_HEADINGS = [
  "create-route-heading",
  "route-details-heading",
  "content-heading",
  "create-puzzle-heading",
  "geo-heading",
  "hints-heading",
];

function adminWorkspaceEscape(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function adminWorkspaceNormalize(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function adminWorkspacePanelByHeading(headingId) {
  return document.querySelector('[aria-labelledby="' + headingId + '"]');
}

function adminWorkspaceManagedSections() {
  const uniqueIds = Array.from(new Set(Object.values(ADMIN_WORKSPACE_SECTION_GROUPS).flat()));
  return uniqueIds
    .map((id) => (id === "admin-data-safety-panel" ? document.querySelector("#admin-data-safety-panel") : adminWorkspacePanelByHeading(id)))
    .filter(Boolean);
}

function adminWorkspaceActiveTeams() {
  const routeIds = new Set((Array.isArray(data?.routes) ? data.routes : []).map((route) => route?.id).filter(Boolean));
  return (Array.isArray(data?.teams) ? data.teams : []).filter((team) => {
    if (!routeIds.has(team?.routeId)) return false;
    return team.status !== "won" && team.status !== "lost";
  });
}

function adminWorkspacePreferredTab() {
  const stored = localStorage.getItem(ADMIN_WORKSPACE_STORAGE_KEY);
  if (ADMIN_WORKSPACE_TABS.some((tab) => tab.id === stored)) return stored;
  return adminWorkspaceActiveTeams().length ? "live" : "overview";
}

function adminWorkspaceEnsureTabs() {
  const adminContent = document.querySelector("#admin-content");
  const topbar = document.querySelector(".admin-topbar");
  if (!adminContent || !topbar || adminContent.classList.contains("is-hidden")) return null;

  let tabs = document.querySelector("#admin-workspace-tabs");
  if (!tabs) {
    tabs = document.createElement("nav");
    tabs.id = "admin-workspace-tabs";
    tabs.className = "admin-workspace-tabs";
    tabs.setAttribute("aria-label", "Navigation admin");
    tabs.innerHTML = ADMIN_WORKSPACE_TABS.map((tab) =>
      '<button class="admin-workspace-tab" type="button" data-admin-tab="' + tab.id + '">' +
        adminWorkspaceEscape(tab.label) +
      '</button>',
    ).join("");
    const quickConsole = document.querySelector("#admin-quick-console");
    (quickConsole || topbar).insertAdjacentElement("afterend", tabs);
    tabs.addEventListener("click", (event) => {
      const button = event.target.closest("[data-admin-tab]");
      if (!button) return;
      adminWorkspaceSetTab(button.dataset.adminTab, { store: true, scroll: false });
    });
  }
  return tabs;
}

function adminWorkspaceSetTab(tabId, options = {}) {
  const tab = ADMIN_WORKSPACE_TABS.some((item) => item.id === tabId) ? tabId : adminWorkspacePreferredTab();
  const tabs = document.querySelector("#admin-workspace-tabs");
  if (tabs) {
    tabs.querySelectorAll("[data-admin-tab]").forEach((button) => {
      const selected = button.dataset.adminTab === tab;
      button.classList.toggle("is-active", selected);
      button.setAttribute("aria-selected", selected ? "true" : "false");
    });
  }

  if (options.store) {
    localStorage.setItem(ADMIN_WORKSPACE_STORAGE_KEY, tab);
  }

  const visibleIds = new Set(ADMIN_WORKSPACE_SECTION_GROUPS[tab] || ADMIN_WORKSPACE_SECTION_GROUPS.overview);
  adminWorkspaceManagedSections().forEach((section) => {
    const label = section.id === "admin-data-safety-panel" ? section.id : section.getAttribute("aria-labelledby");
    section.classList.toggle("is-admin-workspace-hidden", !visibleIds.has(label));
    section.dataset.adminWorkspaceSection = label || "";
  });

  const activityLog = document.querySelector("#admin-activity-log");
  if (activityLog) {
    activityLog.classList.toggle("is-admin-workspace-hidden", tab !== "overview");
  }

  if ((tab === "overview" || tab === "live") && typeof renderTeamLiveMap === "function") {
    window.setTimeout(() => renderTeamLiveMap(), 60);
  }
  if (tab === "codes") {
    window.setTimeout(adminCodeToolsApplyFilters, 0);
  }
}

function adminWorkspaceInstallQuickJumpTabs() {
  const consoleEl = document.querySelector("#admin-quick-console");
  if (!consoleEl || consoleEl.dataset.adminWorkspaceJumpReady === "true") return;
  consoleEl.dataset.adminWorkspaceJumpReady = "true";
  consoleEl.addEventListener("click", (event) => {
    const button = event.target.closest("[data-admin-quick-jump]");
    if (!button) return;
    const tabByJump = {
      teams: "live",
      codes: "codes",
      routes: "routes",
      backups: "backups",
    };
    const nextTab = tabByJump[button.dataset.adminQuickJump];
    if (nextTab) adminWorkspaceSetTab(nextTab, { store: true, scroll: false });
  }, true);
}

function adminWorkspaceFormatRelative(timestamp) {
  if (!timestamp) return "aucune date";
  if (typeof formatRelativeTime === "function") return formatRelativeTime(timestamp);
  const minutes = Math.max(0, Math.round((Date.now() - timestamp) / 60000));
  if (minutes < 1) return "a l'instant";
  return "il y a " + minutes + " min";
}

function adminActivityLogEnsure() {
  const tabs = document.querySelector("#admin-workspace-tabs");
  if (!tabs) return null;
  let log = document.querySelector("#admin-activity-log");
  if (!log) {
    log = document.createElement("section");
    log.id = "admin-activity-log";
    log.className = "admin-activity-log";
    log.setAttribute("aria-label", "Journal rapide admin");
    tabs.insertAdjacentElement("afterend", log);
  }
  return log;
}

function adminActivityLogRender() {
  const log = adminActivityLogEnsure();
  if (!log) return;
  const routes = Array.isArray(data?.routes) ? data.routes : [];
  const teams = Array.isArray(data?.teams) ? data.teams : [];
  const codes = Array.isArray(data?.codes) ? data.codes : [];
  const activeRoute = routes.find((route) => route.id === data?.activeRouteId) || routes[0] || null;
  const activeTeams = adminWorkspaceActiveTeams();
  const lastTeamSync = teams.reduce((latest, team) => Math.max(
    latest,
    Number(team?.updatedAt) || 0,
    Number(team?.lastPosition?.at) || 0,
    Number(team?.finishedAt) || 0,
    Number(team?.createdAt) || 0,
  ), 0);
  const availableCodes = codes.filter((code) => code.status !== "used").length;
  const usedCodes = codes.length - availableCodes;
  const lastCode = codes.reduce((latest, code) => Math.max(latest, Number(code?.createdAt) || 0), 0);

  const items = [
    {
      title: "Parcours actif",
      value: activeRoute ? activeRoute.title || "Parcours" : "Aucun",
      detail: routes.length + " parcours disponibles",
    },
    {
      title: "Suivi joueurs",
      value: activeTeams.length + " en cours",
      detail: teams.length ? "Derniere activite " + adminWorkspaceFormatRelative(lastTeamSync) : "Aucune equipe connectee",
    },
    {
      title: "Codes",
      value: codes.length + " au total",
      detail: availableCodes + " disponibles, " + usedCodes + " utilises",
    },
    {
      title: "Creation code",
      value: lastCode ? adminWorkspaceFormatRelative(lastCode) : "Aucun code",
      detail: "Filtre et copie rapide dans l'onglet Codes",
    },
  ];

  log.innerHTML = items.map((item) =>
    '<article class="admin-activity-item">' +
      '<p>' + adminWorkspaceEscape(item.title) + '</p>' +
      '<strong>' + adminWorkspaceEscape(item.value) + '</strong>' +
      '<span>' + adminWorkspaceEscape(item.detail) + '</span>' +
    '</article>',
  ).join("");
}

function adminWorkspaceEnsureCollapses() {
  ADMIN_WORKSPACE_COLLAPSIBLE_HEADINGS.forEach((headingId) => {
    const panel = adminWorkspacePanelByHeading(headingId);
    if (!panel || panel.dataset.adminCollapseReady === "true") return;
    const title = panel.querySelector(".panel-title");
    if (!title) return;
    panel.dataset.adminCollapseReady = "true";
    panel.classList.add("admin-collapsible-panel");
    const button = document.createElement("button");
    button.className = "secondary-button compact-button admin-collapse-toggle";
    button.type = "button";
    button.textContent = "Replier";
    button.setAttribute("aria-expanded", "true");
    button.addEventListener("click", () => {
      const collapsed = !panel.classList.contains("is-admin-collapsed");
      panel.classList.toggle("is-admin-collapsed", collapsed);
      button.textContent = collapsed ? "Ouvrir" : "Replier";
      button.setAttribute("aria-expanded", collapsed ? "false" : "true");
    });
    title.append(button);
  });
}

function adminCodeToolsEnsure() {
  const panel = adminWorkspacePanelByHeading("codes-heading");
  const codeList = document.querySelector("#code-list");
  if (!panel || !codeList) return null;
  let tools = document.querySelector("#admin-code-tools");
  if (!tools) {
    tools = document.createElement("div");
    tools.id = "admin-code-tools";
    tools.className = "admin-code-tools";
    tools.innerHTML = [
      '<label class="admin-code-search">Rechercher<input id="admin-code-search" type="search" placeholder="Code, client, e-mail"></label>',
      '<label>Statut<select id="admin-code-status"><option value="all">Tous</option><option value="available">Disponibles</option><option value="used">Utilises</option></select></label>',
      '<label>Parcours<select id="admin-code-route"><option value="all">Tous les parcours</option></select></label>',
      '<p id="admin-code-filter-count" class="admin-code-filter-count" role="status"></p>',
    ].join("");
    codeList.insertAdjacentElement("beforebegin", tools);
    tools.addEventListener("input", adminCodeToolsApplyFilters);
    tools.addEventListener("change", adminCodeToolsApplyFilters);
  }
  const routeSelect = tools.querySelector("#admin-code-route");
  const selected = routeSelect.value || "all";
  const routeOptions = (Array.isArray(data?.routes) ? data.routes : []).map((route) =>
    '<option value="' + adminWorkspaceEscape(route.id) + '">' + adminWorkspaceEscape(route.title || "Parcours") + '</option>',
  ).join("");
  routeSelect.innerHTML = '<option value="all">Tous les parcours</option>' + routeOptions;
  routeSelect.value = Array.from(routeSelect.options).some((option) => option.value === selected) ? selected : "all";
  return tools;
}

function adminCodeToolsApplyFilters() {
  const tools = adminCodeToolsEnsure();
  const codeList = document.querySelector("#code-list");
  if (!tools || !codeList) return;
  const rows = Array.from(codeList.querySelectorAll(".code-row"));
  const count = tools.querySelector("#admin-code-filter-count");
  const query = adminWorkspaceNormalize(tools.querySelector("#admin-code-search")?.value || "");
  const status = tools.querySelector("#admin-code-status")?.value || "all";
  const routeId = tools.querySelector("#admin-code-route")?.value || "all";
  const codesByValue = new Map((Array.isArray(data?.codes) ? data.codes : []).map((code) => [String(code.code), code]));
  let visible = 0;

  rows.forEach((row) => {
    const codeValue = row.querySelector("strong")?.textContent?.trim() || "";
    const code = codesByValue.get(codeValue);
    const rowStatus = code?.status === "used" ? "used" : "available";
    const rowRoute = code?.routeId || "";
    const haystack = adminWorkspaceNormalize(row.textContent);
    const matches = (!query || haystack.includes(query))
      && (status === "all" || status === rowStatus)
      && (routeId === "all" || routeId === rowRoute);
    row.classList.toggle("is-admin-code-filtered", !matches);
    row.dataset.adminCodeStatus = rowStatus;
    row.dataset.adminCodeRoute = rowRoute;
    if (matches) visible += 1;
  });

  if (!rows.length) {
    count.textContent = codeList.querySelector(".admin-loading-card") ? "Chargement des codes serveur." : "Aucun code actuellement.";
  } else {
    count.textContent = visible + " code(s) affiche(s) sur " + rows.length;
  }
}

function adminDeleteCodeConfirmInstall() {
  if (window.__adminDeleteCodeConfirmV115Installed || typeof deleteUsedCode !== "function") return;
  window.__adminDeleteCodeConfirmV115Installed = true;
  const originalDeleteUsedCodeV115 = deleteUsedCode;
  deleteUsedCode = function deleteUsedCodeWithConfirmV115(codeValue) {
    const code = data.codes.find((item) => item.code === codeValue);
    if (!code || code.status !== "used") {
      return originalDeleteUsedCodeV115.apply(this, arguments);
    }
    if (!window.confirm("Supprimer definitivement le code utilise " + codeValue + " ?")) return;
    return originalDeleteUsedCodeV115.apply(this, arguments);
  };
}

function adminWorkspaceRender() {
  adminWorkspaceEnsureTabs();
  adminWorkspaceInstallQuickJumpTabs();
  adminWorkspaceEnsureCollapses();
  adminActivityLogRender();
  adminCodeToolsApplyFilters();
  adminWorkspaceSetTab(adminWorkspacePreferredTab(), { store: false, scroll: false });
}

function adminWorkspaceInstall() {
  if (window.__adminWorkspaceV115Installed) return;
  window.__adminWorkspaceV115Installed = true;
  adminDeleteCodeConfirmInstall();

  const originalRenderAdminWorkspace = renderAdmin;
  renderAdmin = function renderAdminWithWorkspaceV115(...args) {
    const result = originalRenderAdminWorkspace.apply(this, args);
    window.setTimeout(adminWorkspaceRender, 0);
    return result;
  };

  if (typeof renderTeamTable === "function") {
    const originalRenderTeamTableWorkspace = renderTeamTable;
    renderTeamTable = function renderTeamTableWithWorkspaceV115(...args) {
      const result = originalRenderTeamTableWorkspace.apply(this, args);
      window.setTimeout(adminWorkspaceRender, 0);
      return result;
    };
  }

  if (typeof renderCodeList === "function") {
    const originalRenderCodeListWorkspace = renderCodeList;
    renderCodeList = function renderCodeListWithWorkspaceV115(...args) {
      const result = originalRenderCodeListWorkspace.apply(this, args);
      window.setTimeout(adminCodeToolsApplyFilters, 0);
      window.setTimeout(adminActivityLogRender, 0);
      return result;
    };
  }

  window.addEventListener("hashchange", () => {
    if (location.hash === "#admin") window.setTimeout(adminWorkspaceRender, 250);
  });
  window.setInterval(() => {
    if (location.hash === "#admin") adminWorkspaceRender();
  }, 30000);
  window.setTimeout(adminWorkspaceRender, 900);
}

adminWorkspaceInstall();

/* multilingual-v116 */
const ESCAPE_I18N_LANG_KEY = "escape-erezee-language-v116";
const ESCAPE_I18N_LANGS = [
  { id: "fr", label: "FR", name: "Francais" },
  { id: "en", label: "EN", name: "English" },
  { id: "nl", label: "NL", name: "Nederlands" },
];

const ESCAPE_I18N_UI = {
  en: {
    "Accueil": "Home",
    "Boutique": "Shop",
    "Jouer": "Play",
    "Gestion": "Admin",
    "Escape game extérieur à Erezée": "Outdoor escape game in Erezée",
    "Une aventure grandeur nature au cœur de la région": "A life-size adventure in the heart of the region",
    "Voir les parcours": "View routes",
    "J’ai déjà un code": "I already have a code",
    "Installer l’application": "Install the app",
    "Le concept": "The concept",
    "Un jeu d’énigmes qui se vit dehors": "An outdoor puzzle adventure",
    "Comment ça marche ?": "How does it work?",
    "Une aventure en quatre étapes": "An adventure in four steps",
    "Achetez votre parcours": "Buy your route",
    "Recevez votre code d'accès par email.": "Receive your access code by email.",
    "Rendez-vous au point de départ": "Go to the starting point",
    "Votre smartphone vous guide.": "Your smartphone guides you.",
    "Résolvez les énigmes": "Solve the puzzles",
    "Débloquez chaque étape du parcours.": "Unlock each step of the route.",
    "Terminez avant la fin du temps": "Finish before time runs out",
    "Affrontez le classement des meilleurs joueurs.": "Challenge the leaderboard.",
    "Avant de partir": "Before you go",
    "Prévoyez juste l’essentiel": "Bring only the essentials",
    "Un smartphone chargé avec la géolocalisation autorisée.": "A charged smartphone with location access enabled.",
    "Une équipe prête à observer les détails autour d’elle.": "A team ready to observe the details around them.",
    "Des chaussures adaptées à une balade extérieure.": "Shoes suitable for an outdoor walk.",
    "Le code reçu après l’achat du parcours.": "The code received after buying the route.",
    "Avis clients": "Customer reviews",
    "Ils ont testé l&#039;aventure": "They tried the adventure",
    "Super activité en famille, les enfants ont adoré !": "Great family activity, the children loved it!",
    "Une belle découverte de la région tout en s&#039;amusant.": "A lovely way to discover the region while having fun.",
    "Le parcours motive tout le monde à observer les détails.": "The route gets everyone looking closely at the details.",
    "Questions fréquentes": "Frequently asked questions",
    "Faut-il internet ?": "Do you need internet?",
    "Oui, une connexion mobile est recommandée pour charger la carte, synchroniser la progression et valider les étapes.": "Yes, mobile internet is recommended to load the map, sync progress and validate steps.",
    "Combien de temps durent les parcours ?": "How long do the routes take?",
    "Peut-on jouer avec des enfants ?": "Can children play?",
    "Oui, les enfants peuvent participer avec des adultes. Les énigmes demandent surtout observation, logique et coopération.": "Yes, children can play with adults. The puzzles mainly require observation, logic and cooperation.",
    "Les chiens sont-ils autorisés ?": "Are dogs allowed?",
    "Que faut-il prévoir ?": "What should we bring?",
    "Un smartphone chargé, des chaussures adaptées à la marche, le code reçu après achat et une équipe prête à observer.": "A charged smartphone, walking shoes, the code received after purchase and a team ready to observe.",
    "Explorer la région": "Explore the region",
    "Activités et idées de sorties": "Activities and outing ideas",
    "Escape game extérieur Ardenne": "Outdoor escape game Ardennes",
    "Activité famille Ardenne": "Family activity Ardennes",
    "Chasse au trésor Ardenne": "Treasure hunt Ardennes",
    "Activité touristique Érezée": "Tourist activity Erezée",
    "Activité près de Durbuy": "Activity near Durbuy",
    "Blog et actualités": "Blog and news",
    "Boutique Escape Erezée": "Escape Erezée shop",
    "Choisissez votre parcours": "Choose your route",
    "Parcours en vente": "Routes for sale",
    "Aventures disponibles": "Available adventures",
    "Prudence pendant les périodes de chasse": "Be careful during hunting periods",
    "Application joueur": "Player app",
    "Parcours en équipe": "Team route",
    "Changer de code": "Change code",
    "Entrez votre code": "Enter your code",
    "Code d’activation": "Activation code",
    "Valider": "Confirm",
    "Equipe": "Team",
    "Modifier": "Edit",
    "Nom d’équipe": "Team name",
    "Enregistrer": "Save",
    "Briefing": "Briefing",
    "Votre mission": "Your mission",
    "Point de départ": "Starting point",
    "Itinéraire": "Directions",
    "Me localiser au départ": "Locate me at the start",
    "Commencer l’aventure": "Start the adventure",
    "Parcours en cours": "Current route",
    "Avant de commencer": "Before starting",
    "Le point de départ du parcours apparaîtra ici.": "The route starting point will appear here.",
    "Ouvrir l’itinéraire": "Open directions",
    "Résultat": "Result",
    "Félicitations": "Congratulations",
    "Temps final": "Final time",
    "Énigmes résolues": "Puzzles solved",
    "Classement": "Ranking",
    "Classement du parcours": "Route leaderboard",
    "Me géolocaliser": "Locate me",
    "Indice": "Hint",
    "Réponse": "Answer",
    "Valider": "Submit",
    "Photo demandée": "Required photo",
    "Aucune photo sélectionnée": "No photo selected",
    "Envoyer la photo": "Send photo",
    "Aucun indice": "No hint",
    "Indice disponible": "Hint available",
    "Disponible sur place": "Available on site",
    "Parcours réussi": "Route completed",
    "Partie terminée": "Game over",
    "Partie perdue": "Game lost",
    "Le temps est écoulé": "Time is up",
    "Non classé": "Not ranked",
    "Aucune équipe gagnante pour le moment": "No winning team yet",
    "Rendez-vous dans la zone indiquée sur la carte pour débloquer cette énigme.": "Go to the area shown on the map to unlock this puzzle.",
    "Chargement des parcours...": "Loading routes...",
    "Connexion au serveur temporairement indisponible. Nouvel essai automatique en cours.": "Server connection temporarily unavailable. Automatic retry in progress.",
    "Aucun parcours n’est ouvert à la vente pour le moment.": "No route is currently open for sale.",
    "Nombre d’équipes": "Number of teams",
    "Maximum conseillé : 6 joueurs par équipe.": "Recommended maximum: 6 players per team.",
    "Acheter": "Buy",
    "Zone atteinte": "Area reached",
    "Vous y êtes": "You are there",
    "Continuer": "Continue",
    "Bonne réponse.": "Correct answer.",
    "Ce n’est pas encore la bonne réponse.": "That is not the right answer yet.",
    "Ajoutez une photo pour continuer.": "Add a photo to continue.",
    "Photo envoyée": "Photo sent",
    "Photo enregistrée.": "Photo saved.",
    "Briefing ouvert.": "Briefing opened.",
    "Aventure lancée.": "Adventure started.",
    "Code déconnecté.": "Code disconnected.",
    "Indiquez un nom d’équipe.": "Enter a team name.",
    "Nom d’équipe enregistré.": "Team name saved.",
    "Localisez votre equipe au point de depart avant de commencer.": "Locate your team at the starting point before beginning.",
    "Autorisez la géolocalisation pour vérifier votre présence au point de départ.": "Allow geolocation to check that you are at the starting point.",
    "Données chargées depuis le backend.": "Data loaded from the backend."
  },
  nl: {
    "Accueil": "Home",
    "Boutique": "Shop",
    "Jouer": "Spelen",
    "Gestion": "Beheer",
    "Escape game extérieur à Erezée": "Outdoor escape game in Erezée",
    "Une aventure grandeur nature au cœur de la région": "Een levensecht avontuur in het hart van de streek",
    "Voir les parcours": "Bekijk de routes",
    "J’ai déjà un code": "Ik heb al een code",
    "Installer l’application": "App installeren",
    "Le concept": "Het concept",
    "Un jeu d’énigmes qui se vit dehors": "Een puzzelspel in de buitenlucht",
    "Comment ça marche ?": "Hoe werkt het?",
    "Une aventure en quatre étapes": "Een avontuur in vier stappen",
    "Achetez votre parcours": "Koop je route",
    "Recevez votre code d'accès par email.": "Ontvang je toegangscode per e-mail.",
    "Rendez-vous au point de départ": "Ga naar het startpunt",
    "Votre smartphone vous guide.": "Je smartphone gidst je.",
    "Résolvez les énigmes": "Los de raadsels op",
    "Débloquez chaque étape du parcours.": "Ontgrendel elke stap van de route.",
    "Terminez avant la fin du temps": "Finish voor de tijd om is",
    "Affrontez le classement des meilleurs joueurs.": "Neem het op tegen het klassement.",
    "Avant de partir": "Voor vertrek",
    "Prévoyez juste l’essentiel": "Neem alleen het nodige mee",
    "Un smartphone chargé avec la géolocalisation autorisée.": "Een opgeladen smartphone met locatie toegestaan.",
    "Une équipe prête à observer les détails autour d’elle.": "Een team dat klaar is om details te observeren.",
    "Des chaussures adaptées à une balade extérieure.": "Schoenen geschikt voor een buitenwandeling.",
    "Le code reçu après l’achat du parcours.": "De code die je na aankoop ontvangt.",
    "Avis clients": "Klantenreviews",
    "Ils ont testé l&#039;aventure": "Zij testten het avontuur",
    "Super activité en famille, les enfants ont adoré !": "Geweldige gezinsactiviteit, de kinderen vonden het fantastisch!",
    "Une belle découverte de la région tout en s&#039;amusant.": "Een mooie ontdekking van de streek terwijl je plezier maakt.",
    "Le parcours motive tout le monde à observer les détails.": "De route motiveert iedereen om goed naar details te kijken.",
    "Questions fréquentes": "Veelgestelde vragen",
    "Faut-il internet ?": "Heb je internet nodig?",
    "Oui, une connexion mobile est recommandée pour charger la carte, synchroniser la progression et valider les étapes.": "Ja, mobiel internet wordt aanbevolen om de kaart te laden, voortgang te synchroniseren en stappen te valideren.",
    "Combien de temps durent les parcours ?": "Hoe lang duren de routes?",
    "Peut-on jouer avec des enfants ?": "Kunnen kinderen meespelen?",
    "Oui, les enfants peuvent participer avec des adultes. Les énigmes demandent surtout observation, logique et coopération.": "Ja, kinderen kunnen met volwassenen meespelen. De raadsels vragen vooral observatie, logica en samenwerking.",
    "Les chiens sont-ils autorisés ?": "Zijn honden toegelaten?",
    "Que faut-il prévoir ?": "Wat moet je meenemen?",
    "Un smartphone chargé, des chaussures adaptées à la marche, le code reçu après achat et une équipe prête à observer.": "Een opgeladen smartphone, wandelschoenen, de code na aankoop en een team dat klaar is om te observeren.",
    "Explorer la région": "Ontdek de streek",
    "Activités et idées de sorties": "Activiteiten en uitstaptips",
    "Escape game extérieur Ardenne": "Outdoor escape game Ardennen",
    "Activité famille Ardenne": "Gezinsactiviteit Ardennen",
    "Chasse au trésor Ardenne": "Schattenjacht Ardennen",
    "Activité touristique Érezée": "Toeristische activiteit Erezée",
    "Activité près de Durbuy": "Activiteit nabij Durbuy",
    "Blog et actualités": "Blog en nieuws",
    "Boutique Escape Erezée": "Escape Erezée shop",
    "Choisissez votre parcours": "Kies je route",
    "Parcours en vente": "Routes te koop",
    "Aventures disponibles": "Beschikbare avonturen",
    "Prudence pendant les périodes de chasse": "Wees voorzichtig tijdens de jachtperiodes",
    "Application joueur": "Spelersapp",
    "Parcours en équipe": "Teamroute",
    "Changer de code": "Code wijzigen",
    "Entrez votre code": "Voer je code in",
    "Code d’activation": "Activatiecode",
    "Valider": "Bevestigen",
    "Equipe": "Team",
    "Modifier": "Wijzigen",
    "Nom d’équipe": "Teamnaam",
    "Enregistrer": "Opslaan",
    "Briefing": "Briefing",
    "Votre mission": "Je missie",
    "Point de départ": "Startpunt",
    "Itinéraire": "Routebeschrijving",
    "Me localiser au départ": "Lokaliseer mij bij de start",
    "Commencer l’aventure": "Start het avontuur",
    "Parcours en cours": "Huidige route",
    "Avant de commencer": "Voor je begint",
    "Le point de départ du parcours apparaîtra ici.": "Het startpunt van de route verschijnt hier.",
    "Ouvrir l’itinéraire": "Open routebeschrijving",
    "Résultat": "Resultaat",
    "Félicitations": "Gefeliciteerd",
    "Temps final": "Eindtijd",
    "Énigmes résolues": "Opgeloste raadsels",
    "Classement": "Klassement",
    "Classement du parcours": "Routeklassement",
    "Me géolocaliser": "Lokaliseer mij",
    "Indice": "Hint",
    "Réponse": "Antwoord",
    "Valider": "Indienen",
    "Photo demandée": "Gevraagde foto",
    "Aucune photo sélectionnée": "Geen foto geselecteerd",
    "Envoyer la photo": "Foto verzenden",
    "Aucun indice": "Geen hint",
    "Indice disponible": "Hint beschikbaar",
    "Disponible sur place": "Beschikbaar ter plaatse",
    "Parcours réussi": "Route voltooid",
    "Partie terminée": "Spel afgelopen",
    "Partie perdue": "Spel verloren",
    "Le temps est écoulé": "De tijd is om",
    "Non classé": "Niet geklasseerd",
    "Aucune équipe gagnante pour le moment": "Nog geen winnend team",
    "Rendez-vous dans la zone indiquée sur la carte pour débloquer cette énigme.": "Ga naar de zone op de kaart om dit raadsel te ontgrendelen.",
    "Chargement des parcours...": "Routes laden...",
    "Connexion au serveur temporairement indisponible. Nouvel essai automatique en cours.": "Serververbinding tijdelijk niet beschikbaar. Nieuwe automatische poging bezig.",
    "Aucun parcours n’est ouvert à la vente pour le moment.": "Er staat momenteel geen route te koop.",
    "Nombre d’équipes": "Aantal teams",
    "Maximum conseillé : 6 joueurs par équipe.": "Aanbevolen maximum: 6 spelers per team.",
    "Acheter": "Kopen",
    "Zone atteinte": "Zone bereikt",
    "Vous y êtes": "Je bent er",
    "Continuer": "Doorgaan",
    "Bonne réponse.": "Juist antwoord.",
    "Ce n’est pas encore la bonne réponse.": "Dat is nog niet het juiste antwoord.",
    "Ajoutez une photo pour continuer.": "Voeg een foto toe om verder te gaan.",
    "Photo envoyée": "Foto verzonden",
    "Photo enregistrée.": "Foto opgeslagen.",
    "Briefing ouvert.": "Briefing geopend.",
    "Aventure lancée.": "Avontuur gestart.",
    "Code déconnecté.": "Code afgemeld.",
    "Indiquez un nom d’équipe.": "Voer een teamnaam in.",
    "Nom d’équipe enregistré.": "Teamnaam opgeslagen.",
    "Localisez votre equipe au point de depart avant de commencer.": "Lokaliseer je team bij het startpunt voordat je begint.",
    "Autorisez la géolocalisation pour vérifier votre présence au point de départ.": "Sta locatie toe om te controleren dat je bij het startpunt bent.",
    "Données chargées depuis le backend.": "Gegevens geladen vanaf de backend."
  }
};

const ESCAPE_I18N_ROUTES = {
  "route-serment-blier": {
    en: {
      title: "The Letter of the Lady of Soy",
      area: "Blier - Fond des Malades",
      description: "A narrative loop in Blier where each place guards a fragment of a letter attributed to a lady of Soy, from the time when plague and illness marked the paths of Fond des Malades.",
      puzzles: {
        "puzzle-lettre-soy-01-relais": { title: "The living relay", place: "STOCK & SEVRIN grocery", question: "In the story of the Lady of Soy, this first place is a passage point between villagers and paths. What word describes a place where something is passed on, received again or circulated?", hints: ["It is not only a shop: in the story, it is a place of passage.", "Something is received there, then passed on further.", "Six letters in French: it begins with REL and ends with AIS. English answer accepted: RELAY."] },
        "puzzle-lettre-soy-02-sceau": { title: "The mark of the estate", place: "Blier Castle", question: "In the time of great houses, what object or mark pressed into wax closed a letter and proved where it came from?", hints: ["The answer is linked to old letters and wax.", "It authenticates a document, like a signature before modern signatures.", "English answer accepted: SEAL."] },
        "puzzle-lettre-soy-03-vallee": { title: "The valley that separates", place: "Viewpoint", question: "From this viewpoint, what word describes the hollow landscape between the heights, crossed by paths to connect the villagers?", hints: ["This word describes the landscape seen from a high point.", "A river often runs through it between two slopes.", "English answer accepted: VALLEY."] },
        "puzzle-lettre-soy-04-croix": { title: "The prayer on the path", place: "Wooden cross", question: "What Christian wooden symbol marks this passage and accompanies the prayer of travellers and absent loved ones?", hints: ["Look at the visible landmark on site: the answer is its shape.", "It combines a vertical line and a horizontal line.", "English answer accepted: CROSS."] },
        "puzzle-lettre-soy-05-romaine": { title: "The road of news", place: "Roman road crossing", question: "Which adjective recalls the ancient origin of this old road, inherited from the world of Rome?", hints: ["Think of the great roads of Antiquity.", "The word comes directly from the name Rome.", "English answer accepted: ROMAN."] },
        "puzzle-lettre-soy-06-refuge": { title: "The house of the isolated", place: "House and chapel of Fond des Malades", question: "The Lady of Soy's letter says this place had two roles: isolating the sick to protect the villages, but also offering them one last shelter. What word means a place where someone is received and protected?", hints: ["The word does not name the illness, but the human function of the place.", "It is where one seeks protection when one can no longer stay elsewhere.", "English answers accepted: REFUGE or SHELTER."] },
        "puzzle-lettre-soy-07-memoire": { title: "The silent witness", place: "Path back to Blier", question: "When there is no sign, no date and no talkative stone left, what must be passed on so that the story of places and people does not disappear?", hints: ["The answer is not an object visible on site.", "It keeps a place's story alive when material traces are missing.", "English answer accepted: MEMORY."] },
        "puzzle-lettre-soy-08-final": { title: "The letter sealed again", place: "STOCK & SEVRIN grocery", question: "Complete the Lady of Soy's final sentence: \"Memory heals those whom the path does ___ forget.\" What is the missing word?", hints: ["The missing word completes a very common sentence.", "The sentence means that people kept apart must not be erased.", "English answer accepted: NOT."] }
      }
    },
    nl: {
      title: "De brief van de Dame van Soy",
      area: "Blier - Fond des Malades",
      description: "Een verhalende lus in Blier waarin elke plek een fragment bewaart van een brief die aan een Dame van Soy wordt toegeschreven, uit de tijd waarin pest en ziekte de wegen van Fond des Malades tekenden.",
      puzzles: {
        "puzzle-lettre-soy-01-relais": { title: "Het levende relais", place: "Kruidenier STOCK & SEVRIN", question: "In het verhaal van de Dame van Soy is deze eerste plek een doorgang tussen bewoners en wegen. Welk woord duidt een plek aan waar iets wordt doorgegeven, ontvangen of verder verspreid?", hints: ["Het is niet alleen een winkel: in het verhaal is het een doorgangsplek.", "Je ontvangt er iets en geeft het daarna verder.", "Nederlands antwoord aanvaard: RELAIS of TUSSENSTATION."] },
        "puzzle-lettre-soy-02-sceau": { title: "Het teken van het domein", place: "Kasteel van Blier", question: "In de tijd van de grote huizen: welk voorwerp of merkteken in was sloot een brief en bewees de herkomst?", hints: ["Het antwoord heeft te maken met oude brieven en was.", "Het bekrachtigt een document, zoals een handtekening voor moderne handtekeningen.", "Nederlands antwoord aanvaard: ZEGEL."] },
        "puzzle-lettre-soy-03-vallee": { title: "De vallei die scheidt", place: "Uitzichtpunt", question: "Vanaf dit uitzichtpunt: welk woord beschrijft het landschap dat tussen de hoogtes is uitgesleten en dat wegen moeten doorkruisen om bewoners te verbinden?", hints: ["Dit woord gaat over het landschap dat je vanaf een hoogte ziet.", "Vaak stroomt er een rivier tussen twee reliëfs.", "Nederlands antwoord aanvaard: DAL of VALLEI."] },
        "puzzle-lettre-soy-04-croix": { title: "Het gebed langs de weg", place: "Houten kruis", question: "Welk christelijk houten symbool markeert hier de doorgang en begeleidt het gebed van reizigers en afwezigen?", hints: ["Kijk naar het zichtbare herkenningspunt: de vorm is het antwoord.", "Het combineert een verticale en een horizontale lijn.", "Nederlands antwoord aanvaard: KRUIS."] },
        "puzzle-lettre-soy-05-romaine": { title: "De weg van het nieuws", place: "Kruising met de Romeinse weg", question: "Welk bijvoeglijk naamwoord herinnert aan de antieke oorsprong van deze oude weg, geërfd uit de wereld van Rome?", hints: ["Denk aan de grote wegen uit de Oudheid.", "Het woord komt rechtstreeks van Rome.", "Nederlands antwoord aanvaard: ROMEINS."] },
        "puzzle-lettre-soy-06-refuge": { title: "Het huis van de afgezonderden", place: "Huis en kapel van Fond des Malades", question: "De brief van de Dame van Soy vertelt dat deze plek twee rollen had: zieken isoleren om de dorpen te beschermen, maar ook een laatste onderkomen bieden. Welk woord betekent een plek waar iemand wordt ontvangen en beschermd?", hints: ["Het woord benoemt niet de ziekte, maar de menselijke functie van de plek.", "Je zoekt er bescherming wanneer je niet elders kunt blijven.", "Nederlands antwoord aanvaard: SCHUILPLAATS of TOEVLUCHT."] },
        "puzzle-lettre-soy-07-memoire": { title: "De stille getuige", place: "Weg terug naar Blier", question: "Wanneer er geen bord, datum of sprekende steen meer is, wat moet men dan doorgeven zodat het verhaal van plekken en mensen niet verdwijnt?", hints: ["Het antwoord is geen zichtbaar object.", "Het houdt de geschiedenis levend wanneer tastbare sporen ontbreken.", "Nederlands antwoord aanvaard: HERINNERING."] },
        "puzzle-lettre-soy-08-final": { title: "De brief weer gesloten", place: "Kruidenier STOCK & SEVRIN", question: "Vul de slotzin van de Dame van Soy aan: \"De herinnering geneest wie de weg ___ vergeet.\" Wat is het ontbrekende woord?", hints: ["Het ontbrekende woord vervolledigt een heel gewone zin.", "De zin betekent dat mensen die werden afgezonderd niet mogen worden uitgewist.", "Nederlands antwoord aanvaard: NIET."] }
      }
    }
  },
  "route-carnet-val-aisne": {
    en: {
      title: "On the Trail of the Vicinal Tram",
      area: "Blier - Pont d'Erezée - Fisenne",
      description: "A heritage loop through the Val d'Aisne, between vicinal tram, river, ice house, Fisenne mill and the memory of old paths.",
      puzzles: {
        "puzzle-carnet-aisne-01-carnet": { title: "The entrusted notebook", place: "STOCK & SEVRIN grocery", question: "What object will you symbolically carry throughout the loop to find the traces left in the valley?", hints: ["It is a small object used to write down routes, dates and observations.", "A line guard or miller could have recorded his passage in it.", "It is not a map: rather a personal route notebook."] },
        "puzzle-carnet-aisne-02-quatre": { title: "The track shed", place: "level crossing and tram shed", question: "According to the description of the place, how many tracks does the Blier shed have?", hints: ["This number is linked to the tram shed, not the level crossing.", "The answer is the number of storage tracks mentioned for this shed.", "It is the number after three and before five."] },
        "puzzle-carnet-aisne-03-trente-deux": { title: "The small chapel windows", place: "small chapel", question: "Count the visible bricks around the two chapel windows. What number do you get?", hints: ["Do not count the whole facade: focus only on the two windows.", "Add the bricks from both window frames.", "The total is an even number, a little above thirty."] },
        "puzzle-carnet-aisne-04-bruyere": { title: "The heather in the name", place: "crossroads, turn right", question: "According to this local interpretation, which moorland plant is hidden in the origin of the name Erezée?", hints: ["It grows readily on poor soils, moorland and heights.", "It is often found in open, poor and slightly wild landscapes.", "It often has mauve or pink flowers.", "English answer accepted: HEATHER."] },
        "puzzle-carnet-aisne-05-tta": { title: "The notebook's first station", place: "Tramway Touristique de l'Aisne station", question: "Which three-letter acronym stands for Tramway Touristique de l'Aisne?", hints: ["These are the initials of the full name.", "The first word is Tramway, the second is Touristique.", "The last letter comes from the river followed by the line."] },
        "puzzle-carnet-aisne-06-vicinal": { title: "The living vicinal", place: "Tramway Touristique de l'Aisne station", question: "What word describes the old Belgian secondary railways that connected nearby places and rural areas?", hints: ["This word is linked to the idea of neighbourhood.", "It is not a major international line, but a local network.", "It connected villages, countryside and small stations.", "It is often used for old Belgian rural trams."] },
        "puzzle-carnet-aisne-07-aisne": { title: "The Aisne bridge", place: "Pont d'Erezée roundabout", question: "Which river gives its name to the tourist tramway you have just met?", hints: ["Its name is in the tramway's full name.", "It is a river in the valley you are crossing.", "It is named just after Tramway Touristique de l'..."] },
        "puzzle-carnet-aisne-08-bief": { title: "The word of mills", place: "arboretum path, near the old mill", question: "What do you call the canal or water channel that brings water to a mill?", hints: ["It is not the whole river, but a useful diversion.", "It guides the water toward the wheel or mill installation.", "English answer accepted: MILLRACE or MILL LEAT.", "The French technical word is short and begins with B."] },
        "puzzle-carnet-aisne-09-alnus-glutinosa": { title: "The tree of the banks", place: "black alder", question: "What is the Latin name of the black alder shown on the sign?", hints: ["The answer is written on the tree sign.", "Look for the name in brackets below the French name.", "There are two words: the first is the alder genus, the second recalls its sticky character."] },
        "puzzle-carnet-aisne-10-sciure": { title: "The coat of cold", place: "old natural ice house of Fisenne", question: "According to the sign, what material formed a thick insulating 'duvet' of about 80 cm to help preserve the ice?", hints: ["Look for the part of the sign about insulation.", "This material comes from worked or cut wood.", "It is mentioned after the three successive doors, with a thickness of about 80 cm."] },
        "puzzle-carnet-aisne-11-quarante-huit": { title: "The wheel of Fisenne", place: "old Fisenne mill", question: "According to the mill sign, how many buckets does the wheel behind the mill have?", hints: ["The answer is in the text on the mill sign.", "A bucket is a small compartment that receives water on the wheel.", "The number is in the paragraph that starts with the wheel behind the mill."] },
        "puzzle-carnet-aisne-12-terre": { title: "The unwritten path", place: "dirt path", question: "What type of path does the notebook now lead you onto?", hints: ["Look at what is under your feet.", "It is neither asphalt, ballast nor pavement.", "The word also names the material of the ground."] },
        "puzzle-carnet-aisne-13-ravel": { title: "The slow way", place: "end of the dirt path, join the RAVeL opposite", question: "What name is used in Wallonia for this network of slow routes often laid out for pedestrians, cyclists and other gentle users?", hints: ["It is a well-known name for walkers and cyclists in Wallonia.", "It is a network, not a single street.", "The word is often written in capitals on slow-route signs."] },
        "puzzle-carnet-aisne-14-marchandise": { title: "The wagon that carried no passengers", place: "tram freight wagon", question: "What type of wagon carried goods, materials or products rather than passengers?", hints: ["This word contrasts with passengers.", "It describes what is transported to sell, deliver or use.", "English answers accepted: FREIGHT or GOODS."] },
        "puzzle-carnet-aisne-15-rail": { title: "The end of the old track", place: "end of the old tram track", question: "What word describes each metal bar on which a tram or train ran?", hints: ["There are usually two of them, parallel, on a railway track.", "Metal wheels run directly on them.", "The word is short and the same in French and English."] },
        "puzzle-carnet-aisne-16-chateau-ferme": { title: "The castle farm", place: "question about Fisenne castle", question: "What compound name is given to a rural complex that combines a castle function and an agricultural function?", hints: ["The first word evokes defence, nobility or power.", "The second evokes farm buildings and rural life.", "English answer accepted: CASTLE FARM."] },
        "puzzle-carnet-aisne-17-latin": { title: "The chapel sentence", place: "small Fisenne chapel and Jesus opposite", question: "The notebook only keeps the translation: 'The overwhelmed people of Fisenne proclaim the Immaculate.' To continue, find the original Latin formula that this sentence has lost.", hints: ["The translation speaks of Fisenne's inhabitants and an immaculate figure.", "The answer is a Latin formula in four words.", "Look up at the old words preserved in stone.", "The formula begins with ILLIBATAM and ends with PRAEDICANT."] },
        "puzzle-carnet-aisne-18-horizon": { title: "The notebook's horizon", place: "beautiful viewpoint", question: "What word describes the distant line where the landscape seems to meet the sky?", hints: ["It is especially visible from an open viewpoint.", "It is not a precise object, but an apparent limit of the landscape.", "The word speaks of distance, of what the eye reaches at the end of the view."] },
        "puzzle-carnet-aisne-19-ruisseau": { title: "The Ry de Blaire", place: "Ry-de-Blaire street", question: "In a Walloon place name, what does the word 'ry' often mean?", hints: ["It is smaller than a river.", "It is often found in a small valley or beside a path.", "English answer accepted: STREAM or BROOK."] },
        "puzzle-carnet-aisne-20-memoire": { title: "Memory closed again", place: "back to STOCK & SEVRIN grocery", question: "What word is missing from the notebook's final sentence?", hints: ["It is what places keep when uses disappear.", "The whole route is meant to awaken it.", "The word describes a memory preserved by a person, place or community."] }
      }
    },
    nl: {
      title: "In het spoor van de buurttram",
      area: "Blier - Pont d'Erezée - Fisenne",
      description: "Een erfgoedlus door de Val d'Aisne, tussen buurttram, rivier, ijskelder, molen van Fisenne en de herinnering aan oude wegen.",
      puzzles: {
        "puzzle-carnet-aisne-01-carnet": { title: "Het toevertrouwde notitieboek", place: "Kruidenier STOCK & SEVRIN", question: "Welk voorwerp draag je symbolisch tijdens de hele lus om de sporen in de vallei terug te vinden?", hints: ["Een klein voorwerp waarin je routes, datums en observaties noteert.", "Een lijnwachter of molenaar had er zijn passage in kunnen schrijven.", "Het is geen kaart, maar eerder een persoonlijk routeboekje."] },
        "puzzle-carnet-aisne-02-quatre": { title: "De remise van de sporen", place: "overweg en tramremise", question: "Volgens de beschrijving van de plek: hoeveel sporen telt de remise van Blier?", hints: ["Dit getal hoort bij de tramremise, niet bij de overweg.", "Het antwoord is het aantal stallingssporen dat voor deze remise wordt genoemd.", "Het is het getal na drie en voor vijf."] },
        "puzzle-carnet-aisne-03-trente-deux": { title: "De ramen van de kleine kapel", place: "kleine kapel", question: "Tel de zichtbare bakstenen rond de twee ramen van de kapel. Welk getal krijg je?", hints: ["Tel niet de hele gevel: focus alleen op de twee ramen.", "Tel de bakstenen van beide raamomlijstingen samen.", "Het totaal is een even getal, iets boven dertig."] },
        "puzzle-carnet-aisne-04-bruyere": { title: "De heide in de naam", place: "kruispunt, rechts nemen", question: "Volgens deze lokale interpretatie: welke heideplant zit verborgen in de oorsprong van de naam Erezée?", hints: ["Ze groeit graag op arme bodems, heidevelden en hoogtes.", "Je vindt ze vaak in open, schrale en wat wilde landschappen.", "Ze heeft vaak mauve of roze bloemen.", "Nederlands antwoord aanvaard: HEIDE."] },
        "puzzle-carnet-aisne-05-tta": { title: "Het eerste station van het boekje", place: "station van de Tramway Touristique de l'Aisne", question: "Welk drieletterig acroniem staat voor Tramway Touristique de l'Aisne?", hints: ["Het zijn de initialen van de volledige naam.", "Het eerste woord is Tramway, het tweede Touristique.", "De laatste letter komt van de rivier die de lijn volgt."] },
        "puzzle-carnet-aisne-06-vicinal": { title: "De levende buurttram", place: "station van de Tramway Touristique de l'Aisne", question: "Welk woord duidt de oude Belgische secundaire spoorlijnen aan die nabije plaatsen en platteland verbonden?", hints: ["Het woord heeft te maken met nabijheid of buurt.", "Het gaat niet om een grote internationale lijn, maar om een lokaal netwerk.", "Het verbond dorpen, platteland en kleine stations.", "Het wordt vaak gebruikt voor oude Belgische landelijke trams."] },
        "puzzle-carnet-aisne-07-aisne": { title: "De brug over de Aisne", place: "rotonde Pont d'Erezée", question: "Welke rivier geeft haar naam aan de toeristische tram die je net hebt ontmoet?", hints: ["Haar naam staat in de volledige naam van de tram.", "Het is een rivier in de vallei die je doorkruist.", "Ze wordt genoemd na Tramway Touristique de l'..."] },
        "puzzle-carnet-aisne-08-bief": { title: "Het woord van de molens", place: "pad van het arboretum, bij de oude molen", question: "Hoe heet het kanaal of de waterarm die water naar een molen voert?", hints: ["Het is niet de hele rivier, maar een nuttige aftakking.", "Het leidt water naar het wiel of de moleninstallatie.", "Nederlands antwoord aanvaard: MOLENGANG.", "De Franse technische term is kort en begint met B."] },
        "puzzle-carnet-aisne-09-alnus-glutinosa": { title: "De boom van de oevers", place: "zwarte els", question: "Wat is de Latijnse naam van de zwarte els op het bord?", hints: ["Het antwoord staat op het bord van de boom.", "Zoek de naam tussen haakjes onder de Franse naam.", "Er zijn twee woorden: het eerste is het geslacht van de els, het tweede verwijst naar zijn kleverige kant."] },
        "puzzle-carnet-aisne-10-sciure": { title: "De mantel van de kou", place: "oude natuurlijke ijskelder van Fisenne", question: "Volgens het bord: welk materiaal vormde een dikke isolerende laag van ongeveer 80 cm om het ijs te bewaren?", hints: ["Zoek het deel van het bord over isolatie.", "Dit materiaal komt van bewerkt of gezaagd hout.", "Het wordt genoemd na de drie opeenvolgende deuren, met een dikte van ongeveer 80 cm."] },
        "puzzle-carnet-aisne-11-quarante-huit": { title: "Het wiel van Fisenne", place: "oude molen van Fisenne", question: "Volgens het molenbord: hoeveel bakjes heeft het wiel achter de molen?", hints: ["Het antwoord staat in de tekst over de molen.", "Een bakje ontvangt water op het wiel.", "Het getal staat in de paragraaf over het wiel achter de molen."] },
        "puzzle-carnet-aisne-12-terre": { title: "Het ongeschreven pad", place: "aardeweg", question: "Over welk type pad laat het boekje je nu verdergaan?", hints: ["Kijk naar wat er onder je voeten ligt.", "Het is geen asfalt, ballast of stoep.", "Het woord duidt ook de stof van de bodem aan."] },
        "puzzle-carnet-aisne-13-ravel": { title: "De trage weg", place: "einde van de aardeweg, steek over naar de RAVeL", question: "Welke naam gebruikt men in Wallonië voor dit netwerk van trage wegen voor voetgangers, fietsers en andere zachte weggebruikers?", hints: ["Het is een bekende naam voor wandelaars en fietsers in Wallonië.", "Het duidt een netwerk aan, geen enkele straat.", "Het woord staat vaak in hoofdletters op borden van trage routes."] },
        "puzzle-carnet-aisne-14-marchandise": { title: "De wagon zonder reizigers", place: "goederenwagon van de tram", question: "Welk type wagon vervoerde goederen, materialen of producten in plaats van reizigers?", hints: ["Dit woord staat tegenover reizigers.", "Het duidt aan wat men vervoert om te verkopen, leveren of gebruiken.", "Nederlands antwoord aanvaard: GOEDEREN."] },
        "puzzle-carnet-aisne-15-rail": { title: "Het einde van het oude spoor", place: "einde van het oude tramspoor", question: "Welk woord duidt elke metalen staaf aan waarop een tram of trein reed?", hints: ["Meestal zijn er twee, parallel, op een spoorlijn.", "Metalen wielen rijden er rechtstreeks op.", "Het woord is kort: RAIL."] },
        "puzzle-carnet-aisne-16-chateau-ferme": { title: "De kasteelhoeve", place: "vraag over het kasteel van Fisenne", question: "Welke samengestelde naam geef je aan een landelijk geheel dat een kasteelfunctie en een landbouwfunctie combineert?", hints: ["Het eerste woord verwijst naar verdediging, adel of macht.", "Het tweede naar landbouwgebouwen en het plattelandsleven.", "Nederlands antwoord aanvaard: KASTEELHOEVE."] },
        "puzzle-carnet-aisne-17-latin": { title: "De zin van de kapel", place: "kleine kapel van Fisenne en Jezus ertegenover", question: "Het boekje bewaart alleen de vertaling: 'De terneergeslagen Fisennois verkondigen de Onbevlekte.' Zoek om verder te gaan de oorspronkelijke Latijnse formule die deze zin verloor.", hints: ["De vertaling spreekt over de inwoners van Fisenne en een onbevlekte figuur.", "Het antwoord is een Latijnse formule van vier woorden.", "Kijk omhoog naar de oude woorden in de steen.", "De formule begint met ILLIBATAM en eindigt met PRAEDICANT."] },
        "puzzle-carnet-aisne-18-horizon": { title: "De horizon van het boekje", place: "mooi uitzichtpunt", question: "Welk woord duidt de verre lijn aan waar het landschap de hemel lijkt te raken?", hints: ["Je ziet het vooral vanaf een open uitzichtpunt.", "Het is geen precies object, maar een schijnbare grens van het landschap.", "Het woord gaat over de verte, waar je blik eindigt."] },
        "puzzle-carnet-aisne-19-ruisseau": { title: "De Ry de Blaire", place: "straat Ry-de-Blaire", question: "Wat betekent het woord 'ry' vaak in een Waalse plaatsnaam?", hints: ["Het is kleiner dan een rivier.", "Je vindt het vaak in een dalletje of langs een pad.", "Nederlands antwoord aanvaard: BEEK."] },
        "puzzle-carnet-aisne-20-memoire": { title: "De herinnering weer gesloten", place: "terug bij kruidenier STOCK & SEVRIN", question: "Welk woord ontbreekt in de slotzin van het boekje?", hints: ["Het is wat plekken bewaren wanneer gebruiken verdwijnen.", "De hele route dient om het wakker te maken.", "Het woord duidt de herinnering aan die een persoon, plek of gemeenschap bewaart."] }
      }
    }
  },
  "route-545378b2": {
    en: {
      title: "The Lost Markers of Blier",
      area: "Blier",
      description: "A survey notebook was found in Blier. Inside, no complete map: only fragments of places, details of stone, track, water and old signs. To reconstruct the route, players must find each photographed element and note the hidden number nearby.",
      puzzles: {
        "puzzle-816e8468": { title: "The hidden digit", place: "Blier", question: "Find this place. What number do you see on site?", hints: ["Look for a black or very dark surface. The number is fixed directly on it."] },
        "puzzle-98e2c7e4": { title: "The numbered wall", place: "Blier Castle", question: "Find this wall. What is the large number displayed on site?", hints: ["Look for a stone wall with a metal plate. The right number is the largest black digit."] },
        "puzzle-f33754c9": { title: "Blier's livestock farm", place: "Blier", question: "Find this sign. What number is placed near it?", hints: ["Look for an illustrated sign. You can see a cow on a blue background."] },
        "puzzle-6f466203": { title: "The voices of the sign", place: "Railway", question: "The warning sounds dry, almost military. Yet in this sentence, some letters give it its voice. Without them, the words become silent. Find how many letters really make the warning sound.", hints: ["Do not count every character on the sign.", "Look for the letters that carry the sound of the words.", "A, E, I, O and U belong to the family to find. É belongs to the same family as E."] },
        "puzzle-9d108355": { title: "The red and white cross", place: "Blier", question: "Find this railway cross. What number is placed near it?", hints: ["Look for a railway signal. The shape is a Saint Andrew's cross."] },
        "puzzle-2b3f3f9d": { title: "Reserved fishing", place: "Blier", question: "This small warning looks ordinary, but not all its letters are equal. Some carry a mark, as if time had marked the word. Look closely at the inscription and find how many letters carry this special sign.", hints: ["Do not look for a hidden object around the sign: the answer is in the words.", "Some letters stand out visually from the others.", "Look at the accents: the circumflex and acute accents count."] },
        "puzzle-3e0fab21": { title: "The coats of arms by the water", place: "Blier", question: "At the bottom of the sign, several small marks watch silently. They are neither words nor fish, but each represents a territory or institution. Count these little coloured guardians: their number opens the next step.", hints: ["Look for a drawn character, not a real statue.", "It is linked to fishing and waterside information.", "The fisherman appears on a green sign with several languages and QR codes."] },
        "puzzle-6085f0e8": { title: "The fisherman guardian", place: "Blier", question: "A small guardian watches over the water, rod in hand and hat on head. He does not show a path, but a place where one observes, fishes and follows the river's rules. Find his sign in the real setting, then look for the number near him.", hints: ["It talks about fishing and rules. It has several QR codes."] },
        "puzzle-b6af933b": { title: "The Ourthe sign", place: "Blier", question: "Here, the sign seems to lock the river in a loop. A large black shape dominates the image, almost like a round doorway to the current. Look at the name under this symbol: the answer is not a letter, but the digit that this letter imitates.", hints: ["Do not answer with the name of the letter.", "Think of what this letter can recall in mathematics.", "The famous number begins with 3 and continues with 14."] },
        "puzzle-37044ce6": { title: "The forbidden fish", place: "Blier", question: "Even when its name disappears, the fish keeps its clues on its body. Look at it: neither its scales nor colour matter, but the small fins that help it move through the water. How many do you see?", hints: ["It is a fish illustration on a sign. Look near fishing information."] },
        "puzzle-e0c0f53e": { title: "The split stone", place: "Blier", question: "Find this wall detail. What number is placed near it?", hints: ["Look for a low horizontal stone. The crack is very visible.", "Near the campsite entrance."] },
        "puzzle-5587e70e": { title: "The exotic leaves", place: "Blier", question: "Find these leaves. What number is hidden near them?", hints: ["Look for a decorative plant. A yellow element appears in the background."] },
        "puzzle-4db33618": { title: "The large black letter", place: "Blier", question: "Even fragmented, turned over and mixed up, this shape keeps its secret. It is not only a letter: it hides a famous number learned at school and rarely forgotten. Find this number to open the last trace.", hints: ["It is fixed on a brick wall.", "Its shape looks like a large Q."] }
      }
    },
    nl: {
      title: "De verloren bakens van Blier",
      area: "Blier",
      description: "In Blier werd een verkenningsboekje gevonden. Geen volledige kaart, alleen fragmenten van plekken, details van steen, spoor, water en oude borden. Om de route te reconstrueren moeten spelers elk gefotografeerd element terugvinden en het verborgen nummer in de buurt noteren.",
      puzzles: {
        "puzzle-816e8468": { title: "Het verborgen cijfer", place: "Blier", question: "Vind deze plek. Welk nummer zie je ter plaatse?", hints: ["Zoek een zwart of zeer donker oppervlak. Het nummer is er rechtstreeks op bevestigd."] },
        "puzzle-98e2c7e4": { title: "De genummerde muur", place: "Kasteel van Blier", question: "Vind deze muur. Wat is het grote nummer dat ter plaatse wordt getoond?", hints: ["Zoek een stenen muur met een metalen plaat. Het juiste nummer is het grootste zwarte cijfer."] },
        "puzzle-f33754c9": { title: "De veeteelt van Blier", place: "Blier", question: "Vind dit uithangbord. Welk nummer staat erbij?", hints: ["Zoek een geïllustreerd bord. Je ziet een koe op een blauwe achtergrond."] },
        "puzzle-6f466203": { title: "De stemmen van het bord", place: "Spoorweg", question: "Het verbod klinkt droog, bijna militair. Toch geven sommige letters in deze zin het zijn stem. Zonder hen worden de woorden stil. Vind hoeveel letters de waarschuwing echt laten klinken.", hints: ["Tel niet alle tekens op het bord.", "Zoek de letters die de klank van de woorden dragen.", "A, E, I, O en U horen bij de familie die je zoekt. É hoort bij dezelfde familie als E."] },
        "puzzle-9d108355": { title: "Het rode en witte kruis", place: "Blier", question: "Vind dit spoorwegkruis. Welk nummer staat erbij?", hints: ["Zoek een sein dat met het spoor te maken heeft. De vorm is een Sint-Andrieskruis."] },
        "puzzle-2b3f3f9d": { title: "Gereserveerde visvangst", place: "Blier", question: "Deze kleine waarschuwing lijkt gewoon, maar niet alle letters zijn gelijk. Sommige dragen een teken, alsof de tijd het woord heeft gemarkeerd. Kijk goed naar de inscriptie en vind hoeveel letters dit bijzondere teken dragen.", hints: ["Zoek geen verborgen object rond het bord: het antwoord staat in de woorden.", "Sommige letters onderscheiden zich zichtbaar van de andere.", "Kijk naar de accenten: het dakje en de acute accenten tellen mee."] },
        "puzzle-3e0fab21": { title: "De wapenschilden aan het water", place: "Blier", question: "Onderaan het bord waken meerdere kleine tekens in stilte. Het zijn geen woorden en geen vissen, maar elk vertegenwoordigt een gebied of instelling. Tel deze kleine gekleurde wachters: hun aantal opent de volgende stap.", hints: ["Zoek een getekend personage, geen echt beeld.", "Het is verbonden met vissen en informatie aan de waterkant.", "De visser staat op een groen bord met meerdere talen en QR-codes."] },
        "puzzle-6085f0e8": { title: "De visserswachter", place: "Blier", question: "Een kleine wachter waakt over het water, hengel in de hand en hoed op het hoofd. Hij wijst geen weg aan, maar een plek waar men observeert, vist en de regels van de rivier volgt. Vind zijn bord in het echte decor en zoek dan het nummer erbij.", hints: ["Het gaat over vissen en regels. Er staan meerdere QR-codes op."] },
        "puzzle-b6af933b": { title: "Het teken van de Ourthe", place: "Blier", question: "Hier lijkt het teken de rivier in een lus te sluiten. Een grote zwarte vorm domineert het beeld, bijna als een ronde deur naar de stroming. Kijk naar de naam onder dit symbool: het antwoord is geen letter, maar het cijfer dat deze letter nadoet.", hints: ["Antwoord niet met de naam van de letter.", "Denk aan wat deze letter in de wiskunde kan oproepen.", "Het bekende getal begint met 3 en gaat verder met 14."] },
        "puzzle-37044ce6": { title: "De verboden vis", place: "Blier", question: "Zelfs wanneer zijn naam verdwijnt, houdt de vis zijn aanwijzingen op zijn lichaam. Kijk naar zijn lichaam: niet de schubben of kleur tellen, maar de kleine vinnen waarmee hij door het water glijdt. Hoeveel zie je er?", hints: ["Het is een afbeelding van een vis op een bord. Zoek bij de visinformatie."] },
        "puzzle-e0c0f53e": { title: "De gespleten steen", place: "Blier", question: "Vind dit detail van de muur. Welk nummer staat erbij?", hints: ["Zoek een lage horizontale steen. De scheur is heel zichtbaar.", "Dicht bij de ingang van de camping."] },
        "puzzle-5587e70e": { title: "De exotische bladeren", place: "Blier", question: "Vind deze bladeren. Welk nummer is erbij verborgen?", hints: ["Zoek een sierplant. Op de achtergrond zie je een geel element."] },
        "puzzle-4db33618": { title: "De grote zwarte letter", place: "Blier", question: "Zelfs gefragmenteerd, omgedraaid en gemengd bewaart deze vorm zijn geheim. Het is niet alleen een letter: hij verbergt een bekend getal dat je vaak op school leert en zelden vergeet. Vind dit getal om het laatste spoor te openen.", hints: ["Hij is bevestigd op een bakstenen muur.", "De vorm lijkt op een grote Q."] }
      }
    }
  }
};

const ESCAPE_I18N_ANSWER_ALIASES = {
  "RELAIS": ["RELAY", "TUSSENSTATION", "OVERDRACHTSPLAATS"],
  "SCEAU": ["SEAL", "ZEGEL"],
  "VALLEE": ["VALLEY", "DAL", "VALLEI"],
  "CROIX": ["CROSS", "KRUIS"],
  "ROMAINE": ["ROMAN", "ROMEINS"],
  "REFUGE": ["SHELTER", "SCHUILPLAATS", "TOEVLUCHT"],
  "MEMOIRE": ["MEMORY", "HERINNERING", "GEHEUGEN"],
  "PAS": ["NOT", "NIET"],
  "CARNET": ["NOTEBOOK", "LOGBOOK", "NOTITIEBOEK", "BOEKJE"],
  "QUATRE": ["FOUR", "VIER", "4"],
  "BRUYERE": ["HEATHER", "HEIDE"],
  "BIEF": ["MILLRACE", "MILL LEAT", "MOLENGANG"],
  "SCIURE": ["SAWDUST", "ZAAGSEL"],
  "TERRE": ["DIRT", "EARTH", "AARDE"],
  "MARCHANDISE": ["FREIGHT", "GOODS", "GOEDEREN"],
  "CHATEAU FERME": ["CASTLE FARM", "KASTEELHOEVE", "KASTEEL BOERDERIJ"],
  "RUISSEAU": ["STREAM", "BROOK", "BEEK"],
  "3,14": ["3.14", "PI"]
};

let escapeI18nMaps = null;

function escapeI18nNormalizeText(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function escapeI18nNormalizeAnswerValue(value) {
  if (typeof normalizeAnswer === "function") return normalizeAnswer(String(value || ""));
  return String(value || "").trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();
}

function escapeI18nAddMap(map, original, translated) {
  const base = escapeI18nNormalizeText(original);
  const value = escapeI18nNormalizeText(translated);
  if (!base || !value || base === value) return;
  map.originalToTranslated.set(base, value);
  map.knownToOriginal.set(base, base);
  map.knownToOriginal.set(value, base);
}

function escapeI18nBuildMaps() {
  const maps = {};
  ["en", "nl"].forEach((lang) => {
    const map = { originalToTranslated: new Map(), knownToOriginal: new Map() };
    Object.entries(ESCAPE_I18N_UI[lang] || {}).forEach(([fr, tr]) => escapeI18nAddMap(map, fr, tr));
    (Array.isArray(data?.routes) ? data.routes : []).forEach((route) => {
      const routeTranslation = ESCAPE_I18N_ROUTES[route.id]?.[lang];
      if (!routeTranslation) return;
      escapeI18nAddMap(map, route.title, routeTranslation.title);
      escapeI18nAddMap(map, route.area, routeTranslation.area);
      escapeI18nAddMap(map, route.description, routeTranslation.description);
      (route.puzzles || []).forEach((puzzle) => {
        const puzzleTranslation = routeTranslation.puzzles?.[puzzle.id];
        if (!puzzleTranslation) return;
        escapeI18nAddMap(map, puzzle.title, puzzleTranslation.title);
        escapeI18nAddMap(map, puzzle.place, puzzleTranslation.place);
        escapeI18nAddMap(map, puzzle.question, puzzleTranslation.question);
        (puzzle.hints || []).forEach((hint, index) => {
          if (puzzleTranslation.hints?.[index]) escapeI18nAddMap(map, hint.text, puzzleTranslation.hints[index]);
        });
      });
    });
    maps[lang] = map;
  });
  return maps;
}

function escapeI18nGetMaps() {
  escapeI18nMaps = escapeI18nBuildMaps();
  return escapeI18nMaps;
}

function escapeI18nInitialLanguage() {
  const queryLang = new URLSearchParams(location.search).get("lang");
  if (["fr", "en", "nl"].includes(queryLang)) {
    localStorage.setItem(ESCAPE_I18N_LANG_KEY, queryLang);
    return queryLang;
  }
  const stored = localStorage.getItem(ESCAPE_I18N_LANG_KEY);
  if (["fr", "en", "nl"].includes(stored)) return stored;
  const browserLang = String(navigator.language || "").toLowerCase();
  if (browserLang.startsWith("nl")) return "nl";
  if (browserLang.startsWith("en")) return "en";
  return "fr";
}

function escapeI18nLanguage() {
  return window.escapeErezeeLanguage || "fr";
}

function escapeI18nTranslateText(value) {
  const source = escapeI18nNormalizeText(value);
  if (!source) return "";
  const lang = escapeI18nLanguage();
  const maps = escapeI18nGetMaps();
  if (lang === "fr") {
    for (const map of Object.values(maps)) {
      const original = map.knownToOriginal.get(source);
      if (original) return original;
    }
    return source;
  }
  const langMap = maps[lang];
  if (!langMap) return source;
  const original = langMap.knownToOriginal.get(source) || source;
  let translated = langMap.originalToTranslated.get(original);
  if (!translated) translated = escapeI18nTranslateDynamic(original, lang);
  return translated || source;
}

function escapeI18nTranslateDynamic(value, lang) {
  let match = value.match(/^(\d+)\s+énigmes?$/i);
  if (match) return lang === "nl" ? match[1] + " raadsels" : match[1] + " puzzles";
  match = value.match(/^(\d+)\s*\/\s*(\d+)\s+énigmes?$/i);
  if (match) return lang === "nl" ? match[1] + " / " + match[2] + " raadsels" : match[1] + " / " + match[2] + " puzzles";
  match = value.match(/^Étape\s+(\d+)\s*\/\s*(\d+)$/i);
  if (match) return lang === "nl" ? "Stap " + match[1] + " / " + match[2] : "Step " + match[1] + " / " + match[2];
  match = value.match(/^Disponible après\s+(\d+)\s+essai/i);
  if (match) return lang === "nl" ? "Beschikbaar na " + match[1] + " poging" : "Available after " + match[1] + " attempt";
  match = value.match(/^([\d,.]+\s*€)\s*\/\s*équipe$/i);
  if (match) return lang === "nl" ? match[1] + " / team" : match[1] + " / team";
  if (value === "Prêt") return lang === "nl" ? "Klaar" : "Ready";
  if (value === "Gagné") return lang === "nl" ? "Gewonnen" : "Won";
  if (value === "Perdu") return lang === "nl" ? "Verloren" : "Lost";
  if (value === "En cours") return lang === "nl" ? "Bezig" : "In progress";
  if (value === "Parcours terminé") return lang === "nl" ? "Route voltooid" : "Route completed";
  return "";
}

function escapeI18nTranslateNode(node) {
  const raw = node.nodeValue || "";
  const trimmed = raw.trim();
  if (!trimmed) return;
  const translated = escapeI18nTranslateText(trimmed);
  if (!translated || translated === trimmed) return;
  node.nodeValue = raw.replace(trimmed, translated);
}

function escapeI18nApplyAttributes(root) {
  ["placeholder", "aria-label", "title", "alt"].forEach((attribute) => {
    root.querySelectorAll("[" + attribute + "]").forEach((element) => {
      const translated = escapeI18nTranslateText(element.getAttribute(attribute));
      if (translated) element.setAttribute(attribute, translated);
    });
  });
}

function escapeI18nApplyDom() {
  const lang = escapeI18nLanguage();
  document.documentElement.lang = lang === "fr" ? "fr-BE" : lang;
  document.title = lang === "nl"
    ? "Escape Erezée - outdoor escape game in de Ardennen"
    : lang === "en"
      ? "Escape Erezée - outdoor escape game in the Ardennes"
      : "Escape Erezée - Escape game extérieur en Ardenne";

  escapeI18nEnsureSwitcher();
  const roots = [
    document.querySelector(".side-nav"),
    document.querySelector("#home-view"),
    document.querySelector("#shop-view"),
    document.querySelector("#player-view"),
    document.querySelector("#arrival-modal"),
    document.querySelector("#image-viewer"),
    document.querySelector("#toast"),
  ].filter(Boolean);

  roots.forEach((root) => {
    if (root.closest("#admin-view")) return;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        const parent = node.parentElement;
        if (!parent) return NodeFilter.FILTER_REJECT;
        if (parent.closest("script, style, textarea, select, #admin-view, .language-switcher, [data-static-i18n-v128], [data-static-i18n-v130]")) {
          return NodeFilter.FILTER_REJECT;
        }
        return NodeFilter.FILTER_ACCEPT;
      },
    });
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(escapeI18nTranslateNode);
    escapeI18nApplyAttributes(root);
  });
}

function escapeI18nEnsureSwitcher() {
  const nav = document.querySelector(".side-nav");
  if (!nav) return;
  let switcher = document.querySelector("#language-switcher");
  if (!switcher) {
    switcher = document.createElement("div");
    switcher.id = "language-switcher";
    switcher.className = "language-switcher";
    switcher.setAttribute("aria-label", "Language");
    switcher.innerHTML = ESCAPE_I18N_LANGS.map((lang) =>
      '<button type="button" data-lang="' + lang.id + '" title="' + lang.name + '">' + lang.label + '</button>',
    ).join("");
    const brand = nav.querySelector(".brand");
    (brand || nav).insertAdjacentElement(brand ? "afterend" : "afterbegin", switcher);
    switcher.addEventListener("click", (event) => {
      const button = event.target.closest("[data-lang]");
      if (!button) return;
      escapeI18nSetLanguage(button.dataset.lang, { rerender: true });
    });
  }
  switcher.querySelectorAll("[data-lang]").forEach((button) => {
    const active = button.dataset.lang === escapeI18nLanguage();
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-pressed", active ? "true" : "false");
  });
}

function escapeI18nSetLanguage(lang, options = {}) {
  const nextLang = ["fr", "en", "nl"].includes(lang) ? lang : "fr";
  window.escapeErezeeLanguage = nextLang;
  localStorage.setItem(ESCAPE_I18N_LANG_KEY, nextLang);
  escapeI18nMaps = null;
  if (options.rerender) {
    if (typeof renderShop === "function") renderShop();
    if (typeof renderPlayer === "function") renderPlayer();
  }
  window.setTimeout(escapeI18nApplyDom, 0);
}

function escapeI18nInstallAnswerAliases() {
  if (window.__escapeI18nAnswerAliasesV116 || typeof submitTextAnswer !== "function") return;
  window.__escapeI18nAnswerAliasesV116 = true;
  const originalSubmitTextAnswerV116 = submitTextAnswer;
  submitTextAnswer = function submitTextAnswerI18nV116(team, route, puzzle) {
    const input = typeof $ === "function" ? $("#text-answer") : document.querySelector("#text-answer");
    if (input && puzzle?.answer) {
      const proposed = escapeI18nNormalizeAnswerValue(input.value);
      const expected = escapeI18nNormalizeAnswerValue(puzzle.answer);
      const aliases = ESCAPE_I18N_ANSWER_ALIASES[expected] || [];
      const accepted = [expected].concat(aliases.map(escapeI18nNormalizeAnswerValue));
      if (accepted.includes(proposed) && proposed !== expected) {
        const originalAnswer = puzzle.answer;
        puzzle.answer = input.value.trim();
        try {
          return originalSubmitTextAnswerV116.apply(this, arguments);
        } finally {
          puzzle.answer = originalAnswer;
        }
      }
    }
    return originalSubmitTextAnswerV116.apply(this, arguments);
  };
}

function escapeI18nInstallRenderHooks() {
  if (window.__escapeI18nRenderHooksV116) return;
  window.__escapeI18nRenderHooksV116 = true;
  const wrap = (name) => {
    if (typeof window[name] !== "function") return;
    const original = window[name];
    window[name] = function i18nWrappedRenderV116() {
      const result = original.apply(this, arguments);
      window.setTimeout(escapeI18nApplyDom, 0);
      return result;
    };
  };
  ["render", "renderShop", "renderPlayer", "renderBriefing", "renderHint", "renderAnswerZone", "renderFinishPanel", "openArrivalModal"].forEach(wrap);
  if (typeof showToast === "function") {
    const originalShowToastV116 = showToast;
    showToast = function showToastI18nV116(message) {
      return originalShowToastV116.call(this, escapeI18nTranslateText(message));
    };
  }
}

function escapeI18nInstall() {
  if (window.__escapeI18nV116Installed) return;
  window.__escapeI18nV116Installed = true;
  window.escapeErezeeLanguage = escapeI18nInitialLanguage();
  escapeI18nInstallAnswerAliases();
  escapeI18nInstallRenderHooks();
  window.addEventListener("hashchange", () => window.setTimeout(escapeI18nApplyDom, 150));
  window.setTimeout(() => escapeI18nSetLanguage(escapeI18nLanguage(), { rerender: false }), 0);
  window.setTimeout(escapeI18nApplyDom, 1200);
}

escapeI18nInstall();

/* multilingual-v118 */
(function installCanonicalTranslationsV118() {
  if (window.__escapeI18nCanonicalV118) return;
  window.__escapeI18nCanonicalV118 = true;
  const textOriginals = new WeakMap();
  const attributeName = (attribute) => 'data-i18n-original-' + attribute.replace(/[^a-z0-9-]/gi, '-').toLowerCase();

  function translateOriginalText(original) {
    const raw = original || '';
    const trimmed = raw.trim();
    if (!trimmed) return raw;
    const translated = typeof escapeI18nTranslateText === 'function' ? escapeI18nTranslateText(trimmed) : '';
    const replacement = translated && translated !== trimmed ? translated : trimmed;
    return raw.replace(trimmed, replacement);
  }

  escapeI18nTranslateNode = function escapeI18nTranslateNodeV118(node) {
    if (!node) return;
    if (!textOriginals.has(node)) textOriginals.set(node, node.nodeValue || '');
    const nextValue = translateOriginalText(textOriginals.get(node));
    if (node.nodeValue !== nextValue) node.nodeValue = nextValue;
  };

  escapeI18nApplyAttributes = function escapeI18nApplyAttributesV118(root) {
    ['placeholder', 'aria-label', 'title', 'alt'].forEach((attribute) => {
      root.querySelectorAll('[' + attribute + ']').forEach((element) => {
        const originalAttribute = attributeName(attribute);
        if (!element.hasAttribute(originalAttribute)) {
          element.setAttribute(originalAttribute, element.getAttribute(attribute) || '');
        }
        const nextValue = translateOriginalText(element.getAttribute(originalAttribute) || '');
        if (element.getAttribute(attribute) !== nextValue) element.setAttribute(attribute, nextValue);
      });
    });
  };

  const previousSetLanguageV118 = typeof escapeI18nSetLanguage === 'function' ? escapeI18nSetLanguage : null;
  if (previousSetLanguageV118) {
    escapeI18nSetLanguage = function escapeI18nSetLanguageV118(lang, options = {}) {
      const result = previousSetLanguageV118.call(this, lang, options);
      window.setTimeout(() => {
        if (typeof escapeI18nApplyDom === 'function') escapeI18nApplyDom();
      }, 0);
      return result;
    };
  }

  window.setTimeout(() => {
    if (typeof escapeI18nApplyDom === 'function') escapeI18nApplyDom();
  }, 0);
})();

/* multilingual-v119 */
(function installStaticFallbacksV119() {
  if (window.__escapeI18nStaticFallbacksV119) return;
  window.__escapeI18nStaticFallbacksV119 = true;

  const fallbackTranslationsV119 = {
    fr: {
      'Home': 'Accueil',
      'Shop': 'Boutique',
      'Play': 'Jouer',
      'Admin': 'Gestion',
      'Outdoor escape game in Erezée': 'Escape game extérieur à Erezée',
      'A life-size adventure in the heart of the region': 'Une aventure grandeur nature au cœur de la région',
      'An outdoor puzzle adventure': 'Un jeu d’énigmes qui se vit dehors',
      'Explore Erezée as a team, move from place to place with the map, unlock the puzzles on site and try to finish the route before the timer runs out.': 'Explorez Erezée en équipe, avancez de lieu en lieu grâce à la carte, débloquez les énigmes sur place et tentez de terminer le parcours avant la fin du chrono.',
      'Each route takes you around Erezée through a series of real places to reach. Once you are in the right area, the app unlocks the next puzzle: written answer, observation, photo or clue to use at the right moment.': 'Chaque parcours vous emmène dans les environs d’Erezée avec une suite d’étapes à rejoindre réellement. Une fois dans la bonne zone, l’application débloque l’énigme suivante: réponse écrite, observation, photo ou indice à utiliser au bon moment.'
    },
    en: {
      'Explorez Erezée en équipe, avancez de lieu en lieu grâce à la carte, débloquez les énigmes sur place et tentez de terminer le parcours avant la fin du chrono.': 'Explore Erezée as a team, move from place to place with the map, unlock the puzzles on site and try to finish the route before the timer runs out.',
      'Chaque parcours vous emmène dans les environs d’Erezée avec une suite d’étapes à rejoindre réellement. Une fois dans la bonne zone, l’application débloque l’énigme suivante: réponse écrite, observation, photo ou indice à utiliser au bon moment.': 'Each route takes you around Erezée through a series of real places to reach. Once you are in the right area, the app unlocks the next puzzle: written answer, observation, photo or clue to use at the right moment.'
    },
    nl: {
      'Accueil': 'Startpagina',
      'Boutique': 'Shop',
      'Jouer': 'Spelen',
      'Gestion': 'Beheer',
      'Home': 'Startpagina',
      'Shop': 'Shop',
      'Play': 'Spelen',
      'Admin': 'Beheer',
      'Outdoor escape game in Erezée': 'Outdoor escape game in Erezée',
      'A life-size adventure in the heart of the region': 'Een levensecht avontuur in het hart van de streek',
      'An outdoor puzzle adventure': 'Een puzzelspel in de buitenlucht',
      'Explorez Erezée en équipe, avancez de lieu en lieu grâce à la carte, débloquez les énigmes sur place et tentez de terminer le parcours avant la fin du chrono.': 'Verken Erezée in team, ga met de kaart van plek naar plek, ontgrendel de raadsels ter plaatse en probeer de route te voltooien voor de tijd om is.',
      'Chaque parcours vous emmène dans les environs d’Erezée avec une suite d’étapes à rejoindre réellement. Une fois dans la bonne zone, l’application débloque l’énigme suivante: réponse écrite, observation, photo ou indice à utiliser au bon moment.': 'Elke route neemt je mee rond Erezée via echte plekken die je moet bereiken. Zodra je in de juiste zone bent, ontgrendelt de app het volgende raadsel: geschreven antwoord, observatie, foto of aanwijzing op het juiste moment.',
      'Explore Erezée as a team, move from place to place with the map, unlock the puzzles on site and try to finish the route before the timer runs out.': 'Verken Erezée in team, ga met de kaart van plek naar plek, ontgrendel de raadsels ter plaatse en probeer de route te voltooien voor de tijd om is.',
      'Each route takes you around Erezée through a series of real places to reach. Once you are in the right area, the app unlocks the next puzzle: written answer, observation, photo or clue to use at the right moment.': 'Elke route neemt je mee rond Erezée via echte plekken die je moet bereiken. Zodra je in de juiste zone bent, ontgrendelt de app het volgende raadsel: geschreven antwoord, observatie, foto of aanwijzing op het juiste moment.'
    }
  };

  const previousTranslateTextV119 = typeof escapeI18nTranslateText === 'function' ? escapeI18nTranslateText : null;
  if (!previousTranslateTextV119) return;

  escapeI18nTranslateText = function escapeI18nTranslateTextV119(text) {
    const translated = previousTranslateTextV119.call(this, text);
    if (translated && translated !== text) return translated;
    const lang = typeof escapeI18nLanguage === 'function' ? escapeI18nLanguage() : 'fr';
    return fallbackTranslationsV119[lang]?.[text] || translated || '';
  };

  window.setTimeout(() => {
    if (typeof escapeI18nApplyDom === 'function') escapeI18nApplyDom();
  }, 0);
})();

/* multilingual-v120 */
(function installCanonicalTranslationsV120() {
  if (window.__escapeI18nCanonicalV120) return;
  window.__escapeI18nCanonicalV120 = true;
  const textOriginals = new WeakMap();
  const attributeName = (attribute) => 'data-i18n-original-v120-' + attribute.replace(/[^a-z0-9-]/gi, '-').toLowerCase();

  const exactFallbacks = {
    fr: {
      'Home': 'Accueil',
      'Shop': 'Boutique',
      'Play': 'Jouer',
      'Admin': 'Gestion',
      'Outdoor escape game in Erezée': 'Escape game extérieur à Erezée',
      'A life-size adventure in the heart of the region': 'Une aventure grandeur nature au cœur de la région',
      'An outdoor puzzle adventure': 'Un jeu d’énigmes qui se vit dehors'
    },
    en: {
      'Explorez Erezée en équipe, avancez de lieu en lieu grâce à la carte, débloquez les énigmes sur place et tentez de terminer le parcours avant la fin du chrono.': 'Explore Erezée as a team, move from place to place with the map, unlock the puzzles on site and try to finish the route before the timer runs out.',
      'Chaque parcours vous emmène dans les environs d’Erezée avec une suite d’étapes à rejoindre réellement. Une fois dans la bonne zone, l’application débloque l’énigme suivante: réponse écrite, observation, photo ou indice à utiliser au bon moment.': 'Each route takes you around Erezée through a series of real places to reach. Once you are in the right area, the app unlocks the next puzzle: written answer, observation, photo or clue to use at the right moment.'
    },
    nl: {
      'Accueil': 'Startpagina',
      'Boutique': 'Shop',
      'Jouer': 'Spelen',
      'Gestion': 'Beheer',
      'Home': 'Startpagina',
      'Shop': 'Shop',
      'Play': 'Spelen',
      'Admin': 'Beheer',
      'Outdoor escape game in Erezée': 'Outdoor escape game in Erezée',
      'A life-size adventure in the heart of the region': 'Een levensecht avontuur in het hart van de streek',
      'An outdoor puzzle adventure': 'Een puzzelspel in de buitenlucht',
      'Explorez Erezée en équipe, avancez de lieu en lieu grâce à la carte, débloquez les énigmes sur place et tentez de terminer le parcours avant la fin du chrono.': 'Verken Erezée in team, ga met de kaart van plek naar plek, ontgrendel de raadsels ter plaatse en probeer de route te voltooien voor de tijd om is.',
      'Chaque parcours vous emmène dans les environs d’Erezée avec une suite d’étapes à rejoindre réellement. Une fois dans la bonne zone, l’application débloque l’énigme suivante: réponse écrite, observation, photo ou indice à utiliser au bon moment.': 'Elke route neemt je mee rond Erezée via echte plekken die je moet bereiken. Zodra je in de juiste zone bent, ontgrendelt de app het volgende raadsel: geschreven antwoord, observatie, foto of aanwijzing op het juiste moment.',
      'Explore Erezée as a team, move from place to place with the map, unlock the puzzles on site and try to finish the route before the timer runs out.': 'Verken Erezée in team, ga met de kaart van plek naar plek, ontgrendel de raadsels ter plaatse en probeer de route te voltooien voor de tijd om is.',
      'Each route takes you around Erezée through a series of real places to reach. Once you are in the right area, the app unlocks the next puzzle: written answer, observation, photo or clue to use at the right moment.': 'Elke route neemt je mee rond Erezée via echte plekken die je moet bereiken. Zodra je in de juiste zone bent, ontgrendelt de app het volgende raadsel: geschreven antwoord, observatie, foto of aanwijzing op het juiste moment.'
    }
  };

  function phraseFallback(trimmed, lang) {
    const normalized = trimmed.replace(/s+/g, ' ');
    const exact = exactFallbacks[lang]?.[normalized];
    if (exact) return exact;
    if (normalized.startsWith('Explorez Erezée en équipe')) {
      if (lang === 'en') return exactFallbacks.en['Explorez Erezée en équipe, avancez de lieu en lieu grâce à la carte, débloquez les énigmes sur place et tentez de terminer le parcours avant la fin du chrono.'];
      if (lang === 'nl') return exactFallbacks.nl['Explorez Erezée en équipe, avancez de lieu en lieu grâce à la carte, débloquez les énigmes sur place et tentez de terminer le parcours avant la fin du chrono.'];
    }
    if (normalized.startsWith('Chaque parcours vous emmène')) {
      if (lang === 'en') return exactFallbacks.en['Chaque parcours vous emmène dans les environs d’Erezée avec une suite d’étapes à rejoindre réellement. Une fois dans la bonne zone, l’application débloque l’énigme suivante: réponse écrite, observation, photo ou indice à utiliser au bon moment.'];
      if (lang === 'nl') return exactFallbacks.nl['Chaque parcours vous emmène dans les environs d’Erezée avec une suite d’étapes à rejoindre réellement. Une fois dans la bonne zone, l’application débloque l’énigme suivante: réponse écrite, observation, photo ou indice à utiliser au bon moment.'];
    }
    return '';
  }

  function translateOriginalTextV120(original) {
    const raw = original || '';
    const trimmed = raw.trim();
    if (!trimmed) return raw;
    const lang = typeof escapeI18nLanguage === 'function' ? escapeI18nLanguage() : 'fr';
    const fallback = phraseFallback(trimmed, lang);
    const translated = fallback || (typeof escapeI18nTranslateText === 'function' ? escapeI18nTranslateText(trimmed) : '');
    const replacement = translated && translated !== trimmed ? translated : trimmed;
    return raw.replace(trimmed, replacement);
  }

  escapeI18nTranslateNode = function escapeI18nTranslateNodeV120(node) {
    if (!node) return;
    if (!textOriginals.has(node)) textOriginals.set(node, node.nodeValue || '');
    const nextValue = translateOriginalTextV120(textOriginals.get(node));
    if (node.nodeValue !== nextValue) node.nodeValue = nextValue;
  };

  escapeI18nApplyAttributes = function escapeI18nApplyAttributesV120(root) {
    ['placeholder', 'aria-label', 'title', 'alt'].forEach((attribute) => {
      root.querySelectorAll('[' + attribute + ']').forEach((element) => {
        const originalAttribute = attributeName(attribute);
        if (!element.hasAttribute(originalAttribute)) {
          element.setAttribute(originalAttribute, element.getAttribute(attribute) || '');
        }
        const nextValue = translateOriginalTextV120(element.getAttribute(originalAttribute) || '');
        if (element.getAttribute(attribute) !== nextValue) element.setAttribute(attribute, nextValue);
      });
    });
  };

  const previousSetLanguageV120 = typeof escapeI18nSetLanguage === 'function' ? escapeI18nSetLanguage : null;
  if (previousSetLanguageV120) {
    escapeI18nSetLanguage = function escapeI18nSetLanguageV120(lang, options = {}) {
      const result = previousSetLanguageV120.call(this, lang, options);
      window.setTimeout(() => {
        if (typeof escapeI18nApplyDom === 'function') escapeI18nApplyDom();
      }, 0);
      return result;
    };
  }

  window.setTimeout(() => {
    if (typeof escapeI18nApplyDom === 'function') escapeI18nApplyDom();
  }, 0);
})();

/* multilingual-v125 */
(function installCleanHomeTranslationsV125() {
  if (window.__escapeI18nHomeCleanV125) return;
  window.__escapeI18nHomeCleanV125 = true;

  const translations = {
    en: {
      concept: 'Each route takes you around Erezée through a series of real places to reach. Once you are in the right area, the app unlocks the next puzzle: written answer, observation, photo or clue to use at the right moment.',
      duration: 'The duration depends on the route and the team pace. Plan for an outdoor activity lasting from several dozen minutes to a few hours.',
      dogs: 'The routes take place outdoors. Dogs can join the team if the places crossed, the weather and leash rules allow it.'
    },
    nl: {
      concept: 'Elke route neemt je mee rond Erezée via echte plekken die je moet bereiken. Zodra je in de juiste zone bent, ontgrendelt de app het volgende raadsel: geschreven antwoord, observatie, foto of aanwijzing op het juiste moment.',
      duration: 'De duur hangt af van de route en het tempo van het team. Reken meestal op een buitenactiviteit van enkele tientallen minuten tot enkele uren.',
      dogs: 'De routes spelen zich buiten af. Honden kunnen mee als de plaatsen, het weer en de leibandregels dat toelaten.'
    }
  };

  function langV125() {
    const active = document.querySelector('.language-switcher [data-lang].is-active');
    if (active && active.dataset && active.dataset.lang) return active.dataset.lang;
    const lang = (document.documentElement.lang || 'fr').slice(0, 2).toLowerCase();
    return ['fr', 'en', 'nl'].includes(lang) ? lang : 'fr';
  }

  function patchV125() {
    const copy = translations[langV125()];
    if (!copy) return;
    document.querySelectorAll('#home-view p').forEach((p) => {
      const text = p.textContent.replace(/s+/g, ' ').trim();
      if (text.includes('Chaque parcours vous emmène')) p.textContent = copy.concept;
      if (text.includes('La durée dépend du parcours')) p.textContent = copy.duration;
      if (text.includes('Les parcours se déroulent dehors')) p.textContent = copy.dogs;
    });
  }

  function scheduleV125() {
    [0, 100, 350, 800, 1600, 3200, 5600].forEach((delay) => window.setTimeout(patchV125, delay));
  }

  document.addEventListener('click', (event) => {
    const target = event.target;
    if (target && target.closest && target.closest('[data-lang]')) scheduleV125();
  }, true);
  window.addEventListener('hashchange', scheduleV125);
  window.addEventListener('load', scheduleV125);
  scheduleV125();
})();

/* admin-backup-download-restore-v132 */
const ADMIN_DATA_SAFETY_DOWNLOAD_URL = "/api/admin/data-safety/download";
const ADMIN_DATA_SAFETY_RESTORE_URL = "/api/admin/data-safety/restore";

function adminBackupToolsFormatSizeV132(size) {
  const bytes = Number(size || 0);
  if (!Number.isFinite(bytes) || bytes <= 0) return "taille inconnue";
  if (bytes < 1024) return bytes + " o";
  if (bytes < 1024 * 1024) return Math.round(bytes / 1024) + " Ko";
  return (bytes / 1024 / 1024).toFixed(1).replace(".", ",") + " Mo";
}

function adminBackupToolsEnsureV132() {
  const safetyPanel = document.querySelector("#admin-data-safety-panel");
  if (!safetyPanel) return null;

  let tools = document.querySelector("#admin-backup-tools-v132");
  if (!tools) {
    tools = document.createElement("section");
    tools.className = "backup-tools-panel";
    tools.id = "admin-backup-tools-v132";
    tools.innerHTML = [
      '<div class="backup-tools-copy">',
        '<p class="section-label">Plan anti-perte</p>',
        '<h3>Restaurer ou telecharger une sauvegarde</h3>',
        '<p id="admin-backup-tools-note">Choisissez une sauvegarde recente. La restauration demande une confirmation manuelle.</p>',
      '</div>',
      '<div class="backup-tools-controls">',
        '<label for="admin-backup-select">Sauvegarde</label>',
        '<select id="admin-backup-select"></select>',
        '<button class="secondary-button compact-button" type="button" id="admin-backup-download">Telecharger</button>',
        '<button class="danger-button compact-button" type="button" id="admin-backup-restore">Restaurer</button>',
      '</div>',
    ].join("");
    safetyPanel.insertAdjacentElement("afterend", tools);
  }

  const select = tools.querySelector("#admin-backup-select");
  const downloadButton = tools.querySelector("#admin-backup-download");
  const restoreButton = tools.querySelector("#admin-backup-restore");
  const note = tools.querySelector("#admin-backup-tools-note");

  if (downloadButton && downloadButton.dataset.bound !== "1") {
    downloadButton.dataset.bound = "1";
    downloadButton.addEventListener("click", adminBackupToolsDownloadV132);
  }
  if (restoreButton && restoreButton.dataset.bound !== "1") {
    restoreButton.dataset.bound = "1";
    restoreButton.addEventListener("click", adminBackupToolsRestoreV132);
  }

  return { tools, select, downloadButton, restoreButton, note };
}

function adminBackupToolsRenderV132(payload) {
  const refs = adminBackupToolsEnsureV132();
  if (!refs) return;
  const backups = Array.isArray(payload?.backups?.recent) ? payload.backups.recent : [];
  refs.select.innerHTML = "";

  if (!backups.length) {
    const option = document.createElement("option");
    option.value = "";
    option.textContent = "Aucune sauvegarde disponible";
    refs.select.append(option);
    refs.downloadButton.disabled = true;
    refs.restoreButton.disabled = true;
    refs.note.textContent = "Creez une sauvegarde manuelle ou attendez la prochaine sauvegarde automatique avant modification.";
    return;
  }

  backups.forEach((backup) => {
    const option = document.createElement("option");
    option.value = backup.name;
    option.textContent = adminDataSafetyFormatTime(backup.modifiedAt) + " - " + adminBackupToolsFormatSizeV132(backup.size) + " - " + backup.name;
    refs.select.append(option);
  });
  refs.downloadButton.disabled = false;
  refs.restoreButton.disabled = false;
  refs.note.textContent = "Avant chaque restauration, le serveur cree automatiquement une sauvegarde de l'etat actuel.";
}

function adminBackupToolsSelectedNameV132() {
  return document.querySelector("#admin-backup-select")?.value || "";
}

function adminBackupToolsDownloadV132() {
  const name = adminBackupToolsSelectedNameV132();
  if (!name) return;
  window.open(ADMIN_DATA_SAFETY_DOWNLOAD_URL + "?name=" + encodeURIComponent(name), "_blank", "noopener");
}

async function adminBackupToolsRestoreV132() {
  const name = adminBackupToolsSelectedNameV132();
  if (!name) return;
  const typed = window.prompt("Pour restaurer cette sauvegarde, tapez RESTAURER en majuscules. Une sauvegarde de l'etat actuel sera creee avant restauration.");
  if (typed !== "RESTAURER") {
    showToast("Restauration annulee.");
    return;
  }

  const refs = adminBackupToolsEnsureV132();
  if (!refs) return;
  refs.restoreButton.disabled = true;
  refs.note.textContent = "Restauration en cours...";
  try {
    const response = await fetch(ADMIN_DATA_SAFETY_RESTORE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ name, confirm: "RESTAURER" }),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.message || "Restauration impossible.");
    adminDataSafetyRender(payload);
    if (typeof syncDataFromServer === "function") await syncDataFromServer();
    if (typeof renderAdmin === "function") renderAdmin();
    showToast("Sauvegarde restauree.");
  } catch (error) {
    refs.note.textContent = error.message || "Restauration impossible.";
  } finally {
    refs.restoreButton.disabled = false;
  }
}

if (typeof adminDataSafetyRender === "function" && !window.__adminBackupToolsV132Installed) {
  window.__adminBackupToolsV132Installed = true;
  const previousAdminDataSafetyRenderV132 = adminDataSafetyRender;
  adminDataSafetyRender = function adminDataSafetyRenderWithBackupToolsV132(payload) {
    previousAdminDataSafetyRenderV132(payload);
    adminBackupToolsRenderV132(payload);
  };
  window.setTimeout(() => {
    const safetyPanel = document.querySelector("#admin-data-safety-panel");
    if (safetyPanel) adminBackupToolsEnsureV132();
  }, 1500);
}

/* scheduled-backup-ui-v134 */
const ADMIN_DATA_SAFETY_VERIFY_URL_V134 = "/api/admin/data-safety/verify";

function adminBackupToolsEnsureVerifyV134() {
  const refs = adminBackupToolsEnsureV132?.();
  if (!refs?.tools || !refs.select) return null;
  let button = refs.tools.querySelector("#admin-backup-verify-v134");
  if (!button) {
    button = document.createElement("button");
    button.className = "secondary-button compact-button";
    button.type = "button";
    button.id = "admin-backup-verify-v134";
    button.textContent = "Tester";
    refs.downloadButton?.insertAdjacentElement("afterend", button);
  }
  if (button.dataset.bound !== "1") {
    button.dataset.bound = "1";
    button.addEventListener("click", adminBackupToolsVerifyV134);
  }
  button.disabled = !refs.select.value;
  return { ...refs, verifyButton: button };
}

async function adminBackupToolsVerifyV134() {
  const refs = adminBackupToolsEnsureVerifyV134();
  const name = adminBackupToolsSelectedNameV132?.();
  if (!refs || !name) return;
  refs.verifyButton.disabled = true;
  refs.note.textContent = "Verification de la sauvegarde sans restauration...";
  try {
    const response = await fetch(ADMIN_DATA_SAFETY_VERIFY_URL_V134, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ name }),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.message || "Verification impossible.");
    const verified = payload.verified || {};
    refs.note.textContent = "Sauvegarde lisible : " + (verified.routes || 0) + " parcours, " + (verified.teams || 0) + " equipes, " + (verified.codes || 0) + " codes. Aucune donnee live n'a ete modifiee.";
    showToast("Sauvegarde testee sans restauration.");
  } catch (error) {
    refs.note.textContent = error.message || "Verification impossible.";
  } finally {
    refs.verifyButton.disabled = false;
  }
}

if (typeof adminBackupToolsRenderV132 === "function" && !window.__scheduledBackupUiV134Installed) {
  window.__scheduledBackupUiV134Installed = true;
  const previousAdminBackupToolsRenderV134 = adminBackupToolsRenderV132;
  adminBackupToolsRenderV132 = function adminBackupToolsRenderWithScheduledV134(payload) {
    previousAdminBackupToolsRenderV134(payload);
    const refs = adminBackupToolsEnsureVerifyV134();
    if (refs?.note && !refs.note.textContent.includes("Sauvegarde lisible")) {
      const daily = payload?.backups?.dailyToday || payload?.backups?.dailyLatest;
      refs.note.textContent = daily
        ? refs.note.textContent + " Sauvegarde quotidienne active."
        : refs.note.textContent + " Une sauvegarde quotidienne sera creee automatiquement.";
    }
  };
}

/* admin-health-monitor-ui-v136 */
const ADMIN_HEALTH_URL_V136 = "/api/admin/health";
const ADMIN_POST_DEPLOY_URL_V136 = "/api/admin/post-deploy-check";
const ADMIN_PLAYER_SIMULATION_URL_V136 = "/api/admin/player-simulation";
let adminHealthRefreshInFlightV136 = false;
let adminHealthLastRefreshAtV136 = 0;
let adminHealthIntervalV136 = null;
let adminHealthLastPayloadV136 = null;
let adminHealthManualActionHoldUntilV142 = 0;

function adminHealthEscapeV136(value) {
  return String(value == null ? "" : value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function adminHealthFormatTimeV136(timestamp) {
  if (!timestamp) return "jamais";
  try {
    return new Intl.DateTimeFormat("fr-BE", { dateStyle: "short", timeStyle: "short" }).format(new Date(Number(timestamp)));
  } catch {
    return "date indisponible";
  }
}

function adminHealthEnsurePanelV136() {
  const adminContent = document.querySelector("#admin-content");
  if (!adminContent) return null;
  let panel = document.querySelector("#admin-health-v136");
  if (!panel) {
    panel = document.createElement("section");
    panel.className = "admin-health-panel";
    panel.id = "admin-health-v136";
    panel.innerHTML = [
      '<div class="admin-health-head">',
        '<div>',
          '<p class="section-label">Controle automatique</p>',
          '<h3>Centre de sante du site</h3>',
          '<p id="admin-health-summary-v136">Verification en attente.</p>',
        '</div>',
        '<div class="admin-health-actions">',
          '<button class="secondary-button compact-button" type="button" id="admin-health-refresh-v136">Verifier</button>',
          '<button class="secondary-button compact-button" type="button" id="admin-health-postdeploy-v136">Test deploiement</button>',
          '<button class="primary-button compact-button" type="button" id="admin-health-simulate-v136">Simuler joueurs</button>',
        '</div>',
      '</div>',
      '<div class="admin-health-grid" id="admin-health-grid-v136"></div>',
      '<div class="admin-health-alerts" id="admin-health-alerts-v136"></div>',
    ].join("");
    const safetyPanel = document.querySelector("#admin-data-safety-panel");
    if (safetyPanel && safetyPanel.parentNode) safetyPanel.parentNode.insertBefore(panel, safetyPanel);
    else adminContent.prepend(panel);
  }
  const refresh = panel.querySelector("#admin-health-refresh-v136");
  const postDeploy = panel.querySelector("#admin-health-postdeploy-v136");
  const simulate = panel.querySelector("#admin-health-simulate-v136");
  if (refresh && refresh.dataset.bound !== "1") {
    refresh.dataset.bound = "1";
    refresh.addEventListener("click", function () { adminHealthRefreshV136({ force: true }); });
  }
  if (postDeploy && postDeploy.dataset.bound !== "1") {
    postDeploy.dataset.bound = "1";
    postDeploy.addEventListener("click", function () { adminHealthRunActionV136("postDeploy"); });
  }
  if (simulate && simulate.dataset.bound !== "1") {
    simulate.dataset.bound = "1";
    simulate.addEventListener("click", function () { adminHealthRunActionV136("simulation"); });
  }
  return {
    panel: panel,
    summary: panel.querySelector("#admin-health-summary-v136"),
    grid: panel.querySelector("#admin-health-grid-v136"),
    alerts: panel.querySelector("#admin-health-alerts-v136"),
    refresh: refresh,
    postDeploy: postDeploy,
    simulate: simulate,
  };
}

function adminHealthStatusTextV136(status) {
  if (status === "critical") return "alerte";
  if (status === "warning") return "a surveiller";
  return "ok";
}

function adminHealthRenderChecksV136(payload, label) {
  const refs = adminHealthEnsurePanelV136();
  if (!refs) return;
  const checks = Array.isArray(payload && payload.checks) ? payload.checks : [];
  const status = payload && payload.status ? payload.status : "warning";
  adminHealthLastPayloadV136 = payload;
  refs.panel.dataset.status = status;
  refs.summary.textContent = (label || "Controle") + " : " + adminHealthStatusTextV136(status) + " - " + adminHealthFormatTimeV136((payload && payload.checkedAt) || Date.now());
  refs.grid.innerHTML = checks.map(function (check) {
    const state = check.status || "warning";
    return [
      '<article class="admin-health-card is-' + adminHealthEscapeV136(state) + '">',
      '<span>' + adminHealthEscapeV136(adminHealthStatusTextV136(state)) + '</span>',
      '<strong>' + adminHealthEscapeV136(check.label || check.id) + '</strong>',
      '<p>' + adminHealthEscapeV136(check.detail || "") + '</p>',
      '</article>'
    ].join("");
  }).join("");
  const alerts = Array.isArray(payload && payload.alerts) ? payload.alerts : checks.filter(function (check) { return check.status !== "ok"; });
  refs.alerts.innerHTML = alerts.length
    ? alerts.map(function (alert) {
      const state = alert.level || alert.status || "warning";
      return '<p class="admin-health-alert is-' + adminHealthEscapeV136(state) + '"><strong>' + adminHealthEscapeV136(alert.label || "Alerte") + '</strong> ' + adminHealthEscapeV136(alert.detail || "") + '</p>';
    }).join("")
    : '<p class="admin-health-alert is-ok"><strong>Aucune alerte.</strong> Les controles principaux sont au vert.</p>';
}

async function adminHealthFetchJsonV136(url, options) {
  const response = await fetch(url, Object.assign({
    credentials: "same-origin",
    cache: "no-store",
    headers: { Accept: "application/json" }
  }, options || {}));
  const payload = await response.json().catch(function () { return {}; });
  if (!response.ok) throw new Error(payload.message || "Controle indisponible.");
  return payload;
}

async function adminHealthRefreshV136(options) {
  const refs = adminHealthEnsurePanelV136();
  if (!refs || adminHealthRefreshInFlightV136) return;
  const force = Boolean(options && options.force);
  const autoRefresh = Boolean(options && options.auto);
  if (autoRefresh && Date.now() < adminHealthManualActionHoldUntilV142) return;
  if (!force && Date.now() - adminHealthLastRefreshAtV136 < 45000 && adminHealthLastPayloadV136) return;
  adminHealthRefreshInFlightV136 = true;
  refs.refresh.disabled = true;
  try {
    const payload = await adminHealthFetchJsonV136(ADMIN_HEALTH_URL_V136);
    adminHealthLastRefreshAtV136 = Date.now();
    adminHealthRenderChecksV136(payload, "Sante site");
  } catch (error) {
    refs.summary.textContent = error.message || "Controle indisponible.";
  } finally {
    refs.refresh.disabled = false;
    adminHealthRefreshInFlightV136 = false;
  }
}

async function adminHealthRunActionV136(kind) {
  const refs = adminHealthEnsurePanelV136();
  if (!refs) return;
  const button = kind === "simulation" ? refs.simulate : refs.postDeploy;
  button.disabled = true;
  refs.summary.textContent = kind === "simulation" ? "Simulation multi-joueurs en cours..." : "Test post-deploiement en cours...";
  adminHealthManualActionHoldUntilV142 = Date.now() + 30000;
  try {
    const url = kind === "simulation" ? ADMIN_PLAYER_SIMULATION_URL_V136 : ADMIN_POST_DEPLOY_URL_V136;
    const payload = await adminHealthFetchJsonV136(url, { method: "POST" });
    adminHealthRenderChecksV136(payload, kind === "simulation" ? "Simulation joueurs" : "Test deploiement");
    adminHealthManualActionHoldUntilV142 = Date.now() + 30000;
    showToast(kind === "simulation" ? "Simulation joueurs terminee." : "Test post-deploiement termine.");
  } catch (error) {
    refs.summary.textContent = error.message || "Test impossible.";
  } finally {
    button.disabled = false;
  }
}

function adminHealthStartAutoRefreshV136() {
  if (adminHealthIntervalV136) return;
  adminHealthIntervalV136 = window.setInterval(function () {
    const adminView = document.querySelector("#admin-view");
    if (adminView && adminView.classList.contains("is-active") && document.querySelector("#admin-health-v136")) {
      adminHealthRefreshV136({ force: true, auto: true });
    }
  }, 60000);
}

if (typeof renderAdmin === "function" && !window.__adminHealthMonitorV136Installed) {
  window.__adminHealthMonitorV136Installed = true;
  const previousRenderAdminV136 = renderAdmin;
  renderAdmin = function renderAdminWithHealthMonitorV136() {
    const result = previousRenderAdminV136.apply(this, arguments);
    window.setTimeout(function () {
      adminHealthEnsurePanelV136();
      adminHealthRefreshV136();
      adminHealthStartAutoRefreshV136();
    }, 0);
    return result;
  };
  window.setTimeout(function () {
    adminHealthEnsurePanelV136();
    adminHealthRefreshV136({ force: true });
    adminHealthStartAutoRefreshV136();
  }, 1600);
}

/* admin-ops-center-ui-v138 */
const ADMIN_INCIDENTS_URL_V138 = "/api/admin/incidents";
const ADMIN_INCIDENT_RESOLVE_URL_V138 = "/api/admin/incidents/resolve";
const ADMIN_ALERT_TEST_URL_V138 = "/api/admin/alert-test";
const ADMIN_LIVE_DASHBOARD_URL_V138 = "/api/admin/live-dashboard";
const ADMIN_SALES_DASHBOARD_URL_V138 = "/api/admin/sales-dashboard";
const ADMIN_MAINTENANCE_URL_V138 = "/api/admin/maintenance";
const ADMIN_SEO_DASHBOARD_URL_V138 = "/api/admin/seo-dashboard";
const PUBLIC_MAINTENANCE_URL_V138 = "/api/public/maintenance";
let adminOpsRefreshInFlightV138 = false;
let adminOpsLastRefreshAtV138 = 0;

function adminOpsEscapeV138(value) {
  return String(value == null ? "" : value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function adminOpsFormatTimeV138(timestamp) {
  if (!timestamp) return "jamais";
  try { return new Intl.DateTimeFormat("fr-BE", { dateStyle: "short", timeStyle: "short" }).format(new Date(Number(timestamp))); }
  catch { return "date indisponible"; }
}

function adminOpsFormatMoneyV138(cents) {
  return new Intl.NumberFormat("fr-BE", { style: "currency", currency: "EUR" }).format(Number(cents || 0) / 100);
}

async function adminOpsFetchJsonV138(url, options) {
  const response = await fetch(url, Object.assign({
    credentials: "same-origin",
    cache: "no-store",
    headers: { Accept: "application/json" }
  }, options || {}));
  const payload = await response.json().catch(function () { return {}; });
  if (!response.ok) throw new Error(payload.message || "Information indisponible.");
  return payload;
}

function adminOpsEnsurePanelV138() {
  const adminContent = document.querySelector("#admin-content");
  if (!adminContent) return null;
  let panel = document.querySelector("#admin-ops-v138");
  if (!panel) {
    panel = document.createElement("section");
    panel.className = "admin-ops-panel";
    panel.id = "admin-ops-v138";
    panel.innerHTML = [
      '<div class="admin-ops-head">',
        '<div>',
          '<p class="section-label">Pilotage</p>',
          '<h3>Exploitation et croissance</h3>',
          '<p id="admin-ops-summary-v138">Chargement des outils.</p>',
        '</div>',
        '<button class="secondary-button compact-button" type="button" id="admin-ops-refresh-v138">Actualiser</button>',
      '</div>',
      '<div class="admin-ops-grid">',
        '<article class="admin-ops-card" id="admin-incidents-card-v138"></article>',
        '<article class="admin-ops-card" id="admin-live-card-v138"></article>',
        '<article class="admin-ops-card" id="admin-sales-card-v138"></article>',
        '<article class="admin-ops-card" id="admin-maintenance-card-v138"></article>',
        '<article class="admin-ops-card admin-ops-card-wide" id="admin-seo-card-v138"></article>',
      '</div>'
    ].join("");
    const healthPanel = document.querySelector("#admin-health-v136");
    if (healthPanel && healthPanel.parentNode) healthPanel.insertAdjacentElement("afterend", panel);
    else adminContent.prepend(panel);
  }
  const refresh = panel.querySelector("#admin-ops-refresh-v138");
  if (refresh && refresh.dataset.bound !== "1") {
    refresh.dataset.bound = "1";
    refresh.addEventListener("click", function () { adminOpsRefreshV138({ force: true }); });
  }
  return panel;
}

function adminOpsRenderIncidentsV138(payload) {
  const card = document.querySelector("#admin-incidents-card-v138");
  if (!card) return;
  const incidents = Array.isArray(payload.incidents) ? payload.incidents : [];
  const open = incidents.filter(function (item) { return !item.resolvedAt; });
  card.innerHTML = [
    '<p class="section-label">Alertes externes</p>',
    '<h4>' + (open.length ? open.length + ' incident(s) ouvert(s)' : 'Aucun incident ouvert') + '</h4>',
    '<p>' + (payload.alertEmailConfigured ? 'E-mail configure : ' + adminOpsEscapeV138(payload.alertEmail || '') : 'Adresse alerte non configuree.') + '</p>',
    '<div class="admin-ops-actions"><button class="secondary-button compact-button" type="button" id="admin-alert-test-v138">Tester e-mail</button></div>',
    '<div class="admin-ops-list">' + (open.length ? open.slice(0, 4).map(function (incident) {
      return '<div class="admin-ops-row"><strong>' + adminOpsEscapeV138(incident.label) + '</strong><span>' + adminOpsEscapeV138(incident.detail) + '</span><button class="text-button" type="button" data-resolve-incident-v138="' + adminOpsEscapeV138(incident.id) + '">Resoudre</button></div>';
    }).join('') : '<span class="admin-ops-muted">Historique propre.</span>') + '</div>'
  ].join("");
  card.querySelector("#admin-alert-test-v138")?.addEventListener("click", adminOpsSendAlertTestV138);
  Array.from(card.querySelectorAll("[data-resolve-incident-v138]")).forEach(function (button) {
    button.addEventListener("click", function () { adminOpsResolveIncidentV138(button.dataset.resolveIncidentV138); });
  });
}

function adminOpsRenderLiveV138(payload) {
  const card = document.querySelector("#admin-live-card-v138");
  if (!card) return;
  const summary = payload.summary || {};
  const teams = Array.isArray(payload.teams) ? payload.teams : [];
  card.innerHTML = [
    '<p class="section-label">Suivi live</p>',
    '<h4>' + (summary.playing || 0) + ' en cours, ' + (summary.stale || 0) + ' bloquees</h4>',
    '<div class="admin-ops-mini"><span>Total ' + (summary.total || 0) + '</span><span>Terminees ' + (summary.finished || 0) + '</span><span>Sans GPS ' + (summary.withoutPosition || 0) + '</span></div>',
    '<div class="admin-ops-list">' + (teams.length ? teams.slice(0, 5).map(function (team) {
      return '<div class="admin-ops-row"><strong>' + adminOpsEscapeV138(team.name) + '</strong><span>' + adminOpsEscapeV138(team.routeTitle) + ' - ' + (team.progress?.solved || 0) + '/' + (team.progress?.total || 0) + ' - ' + (team.stale ? 'a surveiller' : 'ok') + '</span></div>';
    }).join('') : '<span class="admin-ops-muted">Aucune equipe active.</span>') + '</div>'
  ].join("");
}

function adminOpsRenderSalesV138(payload) {
  const card = document.querySelector("#admin-sales-card-v138");
  if (!card) return;
  const summary = payload.summary || {};
  const recent = Array.isArray(payload.recent) ? payload.recent : [];
  card.innerHTML = [
    '<p class="section-label">Ventes et clients</p>',
    '<h4>' + adminOpsFormatMoneyV138(summary.estimatedRevenueCents) + ' estime</h4>',
    '<div class="admin-ops-mini"><span>Codes ' + (summary.totalCodes || 0) + '</span><span>Stripe ' + (summary.stripe || 0) + '</span><span>Mails envoyes ' + (summary.emailsSent || 0) + '</span></div>',
    '<div class="admin-ops-list">' + (recent.length ? recent.slice(0, 4).map(function (code) {
      return '<div class="admin-ops-row"><strong>' + adminOpsEscapeV138(code.code) + '</strong><span>' + adminOpsEscapeV138(code.routeTitle) + ' - ' + adminOpsEscapeV138(code.source) + ' - ' + adminOpsEscapeV138(code.status) + '</span></div>';
    }).join('') : '<span class="admin-ops-muted">Aucun code pour le moment.</span>') + '</div>'
  ].join("");
}

function adminOpsRenderMaintenanceV138(payload) {
  const card = document.querySelector("#admin-maintenance-card-v138");
  if (!card) return;
  const maintenance = payload.maintenance || payload || {};
  card.innerHTML = [
    '<p class="section-label">Maintenance douce</p>',
    '<h4>' + (maintenance.enabled ? 'Message actif' : 'Message inactif') + '</h4>',
    '<label class="admin-ops-check"><input id="admin-maintenance-enabled-v138" type="checkbox" ' + (maintenance.enabled ? 'checked' : '') + ' /> Afficher un message public</label>',
    '<textarea id="admin-maintenance-message-v138" rows="3">' + adminOpsEscapeV138(maintenance.message || '') + '</textarea>',
    '<button class="secondary-button compact-button" type="button" id="admin-maintenance-save-v138">Enregistrer</button>'
  ].join("");
  card.querySelector("#admin-maintenance-save-v138")?.addEventListener("click", adminOpsSaveMaintenanceV138);
}

function adminOpsRenderSeoV138(payload) {
  const card = document.querySelector("#admin-seo-card-v138");
  if (!card) return;
  const summary = payload.summary || {};
  const pages = Array.isArray(payload.pages) ? payload.pages : [];
  const checks = Array.isArray(payload.checks) ? payload.checks : pages;
  const issues = checks.filter(function (check) { return check.status !== 'ok'; });
  const actions = Array.isArray(payload.nextActions) ? payload.nextActions : [];
  const queries = Array.isArray(payload.trackedQueries) ? payload.trackedQueries : [];
  const searchConsole = payload.searchConsole || {};
  function statusLabel(status) {
    if (status === 'critical') return 'Critique';
    if (status === 'warning') return 'A verifier';
    return 'OK';
  }
  function link(url, label) {
    if (!url) return '';
    return '<a class="admin-seo-link-v163" href="' + adminOpsEscapeV138(url) + '" target="_blank" rel="noopener">' + adminOpsEscapeV138(label) + '</a>';
  }
  card.innerHTML = [
    '<p class="section-label">Suivi SEO</p>',
    '<div class="admin-seo-head-v163">',
      '<div>',
        '<h4>' + ((summary.critical || 0) > 0 ? 'Points SEO critiques' : ((summary.warnings || 0) > 0 ? 'Optimisations SEO a planifier' : 'SEO stable')) + '</h4>',
        '<p class="admin-ops-muted">Dernier controle : ' + adminOpsEscapeV138(adminOpsFormatTimeV138(payload.checkedAt)) + '</p>',
      '</div>',
      '<div class="admin-seo-links-v163">' + [
        link(searchConsole.overview, 'Search Console'),
        link(searchConsole.sitemaps, 'Sitemap Google'),
        link('/sitemap.xml', 'sitemap.xml'),
        link('/robots.txt', 'robots.txt'),
      ].join('') + '</div>',
    '</div>',
    '<div class="admin-seo-metrics-v163">',
      '<span><strong>' + adminOpsEscapeV138(summary.pages || 0) + '</strong> pages</span>',
      '<span><strong>' + adminOpsEscapeV138(summary.routes || 0) + '</strong> parcours</span>',
      '<span><strong>' + adminOpsEscapeV138(summary.sitemapUrls || 0) + '</strong> URLs sitemap</span>',
      '<span><strong>' + adminOpsEscapeV138(summary.images || 0) + '</strong> images</span>',
      '<span class="' + ((summary.critical || summary.brokenImages) ? 'is-critical' : (summary.warnings ? 'is-warning' : 'is-ok')) + '"><strong>' + adminOpsEscapeV138((summary.critical || 0) + (summary.warnings || 0)) + '</strong> alertes</span>',
    '</div>',
    issues.length ? '<div class="admin-seo-issues-v163"><strong>A traiter en priorite</strong>' + issues.slice(0, 5).map(function (issue) {
      return '<div class="admin-seo-row-v163 is-' + adminOpsEscapeV138(issue.status) + '"><span>' + adminOpsEscapeV138(issue.label) + '</span><small>' + adminOpsEscapeV138(issue.detail || statusLabel(issue.status)) + '</small></div>';
    }).join('') + '</div>' : '<p class="admin-ops-muted">Aucun point critique detecte sur les pages controlees.</p>',
    '<div class="admin-seo-grid-v163">',
      '<section><strong>Pages controlees</strong><div class="admin-seo-list-v163">' + pages.slice(0, 12).map(function (page) {
        return '<a class="admin-seo-row-v163 is-' + adminOpsEscapeV138(page.status) + '" href="' + adminOpsEscapeV138(page.url || page.path || '#') + '" target="_blank" rel="noopener"><span>' + adminOpsEscapeV138(page.label) + '</span><small>' + adminOpsEscapeV138(statusLabel(page.status)) + '</small></a>';
      }).join('') + '</div></section>',
      '<section><strong>Routine SEO</strong><ul class="admin-seo-actions-v163">' + actions.map(function (action) {
        return '<li>' + adminOpsEscapeV138(action) + '</li>';
      }).join('') + '</ul><strong>Requetes a suivre</strong><p class="admin-seo-queries-v163">' + queries.map(function (query) {
        return '<span>' + adminOpsEscapeV138(query) + '</span>';
      }).join('') + '</p></section>',
    '</div>',
  ].join("");
}

async function adminOpsRefreshV138(options) {
  const panel = adminOpsEnsurePanelV138();
  if (!panel || adminOpsRefreshInFlightV138) return;
  const force = Boolean(options && options.force);
  if (!force && Date.now() - adminOpsLastRefreshAtV138 < 60000) return;
  adminOpsRefreshInFlightV138 = true;
  const summary = document.querySelector("#admin-ops-summary-v138");
  try {
    const results = await Promise.all([
      adminOpsFetchJsonV138(ADMIN_INCIDENTS_URL_V138),
      adminOpsFetchJsonV138(ADMIN_LIVE_DASHBOARD_URL_V138),
      adminOpsFetchJsonV138(ADMIN_SALES_DASHBOARD_URL_V138),
      adminOpsFetchJsonV138(ADMIN_MAINTENANCE_URL_V138),
      adminOpsFetchJsonV138(ADMIN_SEO_DASHBOARD_URL_V138),
    ]);
    adminOpsRenderIncidentsV138(results[0]);
    adminOpsRenderLiveV138(results[1]);
    adminOpsRenderSalesV138(results[2]);
    adminOpsRenderMaintenanceV138(results[3]);
    adminOpsRenderSeoV138(results[4]);
    adminOpsLastRefreshAtV138 = Date.now();
    if (summary) summary.textContent = 'Derniere actualisation : ' + adminOpsFormatTimeV138(adminOpsLastRefreshAtV138);
  } catch (error) {
    if (summary) summary.textContent = error.message || 'Outils indisponibles.';
  } finally {
    adminOpsRefreshInFlightV138 = false;
  }
}

async function adminOpsResolveIncidentV138(id) {
  await adminOpsFetchJsonV138(ADMIN_INCIDENT_RESOLVE_URL_V138, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: id }) });
  showToast('Incident marque comme resolu.');
  adminOpsRefreshV138({ force: true });
}

async function adminOpsSendAlertTestV138() {
  try {
    const payload = await adminOpsFetchJsonV138(ADMIN_ALERT_TEST_URL_V138, { method: 'POST' });
    showToast(payload.message || 'Test envoye.');
  } catch (error) {
    showToast(error.message || 'E-mail alerte non configure.');
  }
}

async function adminOpsSaveMaintenanceV138() {
  const enabled = document.querySelector('#admin-maintenance-enabled-v138')?.checked;
  const message = document.querySelector('#admin-maintenance-message-v138')?.value || '';
  await adminOpsFetchJsonV138(ADMIN_MAINTENANCE_URL_V138, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ enabled: enabled, message: message }) });
  showToast('Mode maintenance mis a jour.');
  adminOpsRefreshV138({ force: true });
  loadPublicMaintenanceV138();
}

function renderPublicMaintenanceV138(maintenance) {
  let banner = document.querySelector('#public-maintenance-v138');
  if (!maintenance || !maintenance.enabled) {
    if (banner) banner.remove();
    return;
  }
  if (!banner) {
    banner = document.createElement('div');
    banner.id = 'public-maintenance-v138';
    banner.className = 'public-maintenance-banner';
    document.body.prepend(banner);
  }
  banner.textContent = maintenance.message || 'Information temporaire : intervention technique en cours.';
}

async function loadPublicMaintenanceV138() {
  try {
    const maintenance = await adminOpsFetchJsonV138(PUBLIC_MAINTENANCE_URL_V138);
    renderPublicMaintenanceV138(maintenance);
  } catch {}
}

if (typeof renderAdmin === 'function' && !window.__adminOpsCenterV138Installed) {
  window.__adminOpsCenterV138Installed = true;
  const previousRenderAdminV138 = renderAdmin;
  renderAdmin = function renderAdminWithOpsCenterV138() {
    const result = previousRenderAdminV138.apply(this, arguments);
    window.setTimeout(function () {
      adminOpsEnsurePanelV138();
      adminOpsRefreshV138();
    }, 0);
    return result;
  };
  window.setTimeout(function () {
    adminOpsEnsurePanelV138();
    adminOpsRefreshV138({ force: true });
  }, 1900);
}

loadPublicMaintenanceV138();
window.setInterval(loadPublicMaintenanceV138, 120000);


/* admin-health-action-hold-v142 */

/* growth-suite-ui-v143 */
const PUBLIC_SITE_CONFIG_URL_V143 = "/api/public/site-config";
const ADMIN_BUSINESS_DASHBOARD_URL_V143 = "/api/admin/business-dashboard";
let publicSiteConfigV143 = { reviewUrl: "https://g.page/r/CfoZCZf_vyxPEBM/review" };
let adminGrowthRefreshInFlightV143 = false;
let adminGrowthLastRefreshAtV143 = 0;

function escapeGrowthV143(value) {
  return String(value == null ? "" : value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function routeLevelV143(route) {
  const count = Array.isArray(route?.puzzles) ? route.puzzles.length : 0;
  if (count >= 8) return "Challenge";
  if (count >= 5) return "Intermediaire";
  return "Familial";
}

function routeDepartureV143(route) {
  const first = Array.isArray(route?.puzzles) ? route.puzzles[0] : null;
  return first?.place || route?.area || "Point de depart indique dans le briefing";
}

function routeChecklistV143(route) {
  return [
    "Smartphone charge et batterie externe conseillee",
    "Chaussures adaptees a la marche exterieure",
    "Verifier la meteo et les periodes de chasse",
    "Se rendre au point de depart avant de commencer",
  ];
}

function validateShopReadinessV143(event) {
  const form = event.currentTarget;
  const checkbox = form.querySelector("[data-shop-ready-v143]");
  const message = form.querySelector("[data-shop-message]");
  if (checkbox && !checkbox.checked) {
    event.preventDefault();
    event.stopImmediatePropagation();
    if (message) message.textContent = "Confirmez les informations pratiques avant de passer au paiement.";
    checkbox.focus();
  }
}

function enhanceShopCardsV143() {
  if (!els.shopList) return;
  Array.from(els.shopList.querySelectorAll("[data-shop-route]")).forEach(function (form) {
    const routeId = form.dataset.shopRoute;
    const route = getRoute(routeId);
    if (!route || form.dataset.growthEnhancedV143 === "1") return;
    form.dataset.growthEnhancedV143 = "1";
    const button = form.querySelector("button[type='submit']");
    if (button) button.textContent = "Reserver maintenant";
    const participantsInput = form.querySelector("[name='players']");
    const total = form.querySelector("[data-shop-total]");
    const guide = document.createElement("div");
    guide.className = "shop-reservation-guide-v143";
    guide.innerHTML = [
      '<div class="shop-guide-summary-v143">',
        '<span>' + escapeGrowthV143(route.duration || 90) + ' min</span>',
        '<span>' + escapeGrowthV143(routeLevelV143(route)) + '</span>',
        '<span>' + escapeGrowthV143(route.puzzles?.length || 0) + ' enigmes</span>',
      '</div>',
      '<p><strong>Point de depart :</strong> ' + escapeGrowthV143(routeDepartureV143(route)) + '</p>',
      '<ul>' + routeChecklistV143(route).map(function (item) { return '<li>' + escapeGrowthV143(item) + '</li>'; }).join('') + '</ul>',
      '<label class="shop-ready-check-v143"><input type="checkbox" data-shop-ready-v143 /> J&#039;ai verifie les informations pratiques</label>',
    ].join("");
    form.insertBefore(guide, button || form.lastChild);
    if (participantsInput && total) {
      const update = function () {
        const players = Math.min(20, Math.max(1, Number(participantsInput.value) || 1));
        const price = getRoutePrice(route) * players;
        total.setAttribute("aria-label", "Total reservation " + formatPrice(price));
      };
      participantsInput.addEventListener("input", update);
      update();
    }
    form.addEventListener("submit", validateShopReadinessV143, { capture: true });
  });
}

function ensurePrepAndReviewSectionsV143() {
  const shopView = document.querySelector("#shop-view");
  const shopPanel = document.querySelector(".shop-panel");
  if (!shopView || !shopPanel) return;
  if (!document.querySelector("#before-you-go-v143")) {
    const section = document.createElement("section");
    section.className = "before-you-go-v143";
    section.id = "before-you-go-v143";
    section.innerHTML = [
      '<div>',
        '<p class="section-label">Avant de partir</p>',
        '<h2>Tout verifier avant l&#039;aventure</h2>',
        '<p>Les parcours se jouent dehors : preparez votre telephone, surveillez la meteo et restez attentif aux periodes de chasse indiquees localement.</p>',
      '</div>',
      '<div class="before-grid-v143">',
        '<span>Batterie chargee</span>',
        '<span>Internet mobile actif</span>',
        '<span>Chaussures de marche</span>',
        '<span>Chiens tenus en laisse</span>',
        '<span>Enfants accompagnes</span>',
        '<span>Respect des zones de chasse</span>',
      '</div>',
    ].join("");
    shopPanel.insertAdjacentElement("afterend", section);
  }
  if (!document.querySelector("#customer-reviews-v143")) {
    const reviews = document.createElement("section");
    reviews.className = "customer-reviews-v143";
    reviews.id = "customer-reviews-v143";
    reviews.innerHTML = [
      '<div class="reviews-head-v143">',
        '<p class="section-label">Avis clients</p>',
        '<h2>Ils ont joue en Ardenne</h2>',
      '</div>',
      '<div class="reviews-grid-v143">',
        '<article><strong>★★★★★</strong><p>Super activite en famille, les enfants ont adore !</p><span>- Sophie</span></article>',
        '<article><strong>★★★★★</strong><p>Une belle decouverte de la region tout en s&#039;amusant.</p><span>- Julien</span></article>',
        '<article><strong>★★★★★</strong><p>Parcours clair, nature superbe et enigmes bien dosees.</p><span>- Marie</span></article>',
      '</div>',
    ].join("");
    document.querySelector("#before-you-go-v143")?.insertAdjacentElement("afterend", reviews);
  }
}

function addFinishExperienceV143(team, route) {
  if (!els.finishPanel || !team || !route) return;
  let block = els.finishPanel.querySelector("#finish-experience-v143");
  if (!block) {
    block = document.createElement("div");
    block.id = "finish-experience-v143";
    block.className = "finish-experience-v143";
    els.finishPanel.appendChild(block);
  }
  const reviewUrl = publicSiteConfigV143.reviewUrl || "https://g.page/r/CfoZCZf_vyxPEBM/review";
  block.innerHTML = [
    '<div class="finish-actions-v143">',
      '<a class="primary-button" target="_blank" rel="noopener" href="' + escapeGrowthV143(reviewUrl) + '">Laisser un avis</a>',
      '<button class="secondary-button" type="button" id="souvenir-photo-v143">Photo souvenir</button>',
      '<a class="secondary-button" href="#shop">Decouvrir un autre parcours</a>',
    '</div>',
    '<p class="finish-note-v143">Votre retour aide les prochains joueurs a choisir leur aventure.</p>',
  ].join("");
  block.querySelector("#souvenir-photo-v143")?.addEventListener("click", function () { createSouvenirImageV143(team, route); });
}

function createSouvenirImageV143(team, route) {
  const canvas = document.createElement("canvas");
  canvas.width = 1200;
  canvas.height = 675;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const progress = getTeamProgress(team, route);
  ctx.fillStyle = "#123c32";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#f1b449";
  ctx.fillRect(0, 0, canvas.width, 18);
  ctx.fillStyle = "rgba(255,255,255,0.08)";
  ctx.fillRect(80, 80, 1040, 515);
  ctx.fillStyle = "#ffffff";
  ctx.font = "800 48px system-ui, sans-serif";
  ctx.fillText("Stock & Sevrin Escape Games", 120, 155);
  ctx.font = "900 72px system-ui, sans-serif";
  ctx.fillText(team.name || "Equipe", 120, 270);
  ctx.font = "700 38px system-ui, sans-serif";
  ctx.fillStyle = "#f6e3b0";
  ctx.fillText(route.title || "Parcours", 120, 340);
  ctx.fillStyle = "#ffffff";
  ctx.font = "700 34px system-ui, sans-serif";
  ctx.fillText("Temps : " + formatDuration(elapsedSeconds(team)), 120, 430);
  ctx.fillText("Score : " + progress.solved + " / " + progress.total + " enigmes", 120, 485);
  ctx.fillText(team.status === "won" ? "Parcours reussi" : "Partie terminee", 120, 540);
  ctx.fillStyle = "#f1b449";
  ctx.font = "800 30px system-ui, sans-serif";
  ctx.fillText("escape-erezee.be", 120, 610);
  const link = document.createElement("a");
  link.download = "souvenir-escape-erezee.png";
  link.href = canvas.toDataURL("image/png");
  link.click();
}

async function loadPublicSiteConfigV143() {
  if (!canUseBackend()) return;
  try {
    const response = await fetch(PUBLIC_SITE_CONFIG_URL_V143, { headers: { Accept: "application/json" }, cache: "no-store", credentials: "same-origin" });
    if (response.ok) publicSiteConfigV143 = await response.json();
  } catch {}
}

async function adminGrowthFetchJsonV143(url) {
  const response = await fetch(url, { credentials: "same-origin", cache: "no-store", headers: { Accept: "application/json" } });
  const payload = await response.json().catch(function () { return {}; });
  if (!response.ok) throw new Error(payload.message || "Stats indisponibles.");
  return payload;
}

function adminGrowthFormatTimeV143(timestamp) {
  if (!timestamp) return "jamais";
  try { return new Intl.DateTimeFormat("fr-BE", { dateStyle: "short", timeStyle: "short" }).format(new Date(Number(timestamp))); }
  catch { return "date indisponible"; }
}

function adminGrowthFormatMoneyV143(cents) {
  return new Intl.NumberFormat("fr-BE", { style: "currency", currency: "EUR" }).format(Number(cents || 0) / 100);
}

function adminGrowthEnsurePanelV143() {
  const adminContent = document.querySelector("#admin-content");
  if (!adminContent) return null;
  let panel = document.querySelector("#admin-growth-v143");
  if (!panel) {
    panel = document.createElement("section");
    panel.className = "admin-growth-panel-v143";
    panel.id = "admin-growth-v143";
    panel.innerHTML = [
      '<div class="admin-growth-head-v143">',
        '<div><p class="section-label">Journee et performance</p><h3>Suivi operationnel avance</h3><p id="admin-growth-summary-v143">Chargement des statistiques.</p></div>',
        '<button class="secondary-button compact-button" type="button" id="admin-growth-refresh-v143">Actualiser</button>',
      '</div>',
      '<div class="admin-growth-grid-v143">',
        '<article class="admin-growth-card-v143 admin-growth-wide-v143" id="admin-day-card-v143"></article>',
        '<article class="admin-growth-card-v143 admin-growth-wide-v143" id="admin-route-stats-v143"></article>',
      '</div>',
    ].join("");
    const opsPanel = document.querySelector("#admin-ops-v138");
    if (opsPanel && opsPanel.parentNode) opsPanel.insertAdjacentElement("afterend", panel);
    else adminContent.prepend(panel);
  }
  const refresh = panel.querySelector("#admin-growth-refresh-v143");
  if (refresh && refresh.dataset.bound !== "1") {
    refresh.dataset.bound = "1";
    refresh.addEventListener("click", function () { adminGrowthRefreshV143({ force: true }); });
  }
  return panel;
}

function adminGrowthRenderV143(payload) {
  const summary = payload.summary || {};
  const summaryNode = document.querySelector("#admin-growth-summary-v143");
  if (summaryNode) {
    summaryNode.textContent = "Derniere actualisation : " + adminGrowthFormatTimeV143(payload.checkedAt) + " - " + (summary.playingNow || 0) + " equipe(s) en cours";
  }
  const dayCard = document.querySelector("#admin-day-card-v143");
  const teams = Array.isArray(payload.todayTeams) ? payload.todayTeams : [];
  if (dayCard) {
    dayCard.innerHTML = [
      '<p class="section-label">Journee en cours</p>',
      '<h4>' + (summary.playingNow || 0) + ' en cours, ' + (summary.staleNow || 0) + ' a surveiller</h4>',
      '<div class="admin-growth-table-v143">',
        teams.length ? teams.slice(0, 12).map(function (team) {
          return '<div class="admin-growth-row-v143 ' + (team.stale ? 'is-warning' : '') + '"><strong>' + escapeGrowthV143(team.name) + '</strong><span>' + escapeGrowthV143(team.routeTitle) + '</span><span>' + (team.progress?.solved || 0) + '/' + (team.progress?.total || 0) + '</span><span>' + escapeGrowthV143(team.duration || '') + '</span><span>' + (team.hasPosition ? 'GPS ok' : 'Sans GPS') + '</span><span>' + (team.inactiveMinutes == null ? 'jamais' : team.inactiveMinutes + ' min') + '</span></div>';
        }).join('') : '<p class="admin-growth-muted-v143">Aucune equipe aujourd&#039;hui.</p>',
      '</div>',
    ].join("");
  }
  const statsCard = document.querySelector("#admin-route-stats-v143");
  const routes = Array.isArray(payload.routeStats) ? payload.routeStats : [];
  if (statsCard) {
    statsCard.innerHTML = [
      '<p class="section-label">Statistiques parcours</p>',
      '<h4>' + adminGrowthFormatMoneyV143(summary.estimatedRevenueCents) + ' estime - ' + (summary.completedTotal || 0) + ' parcours termines</h4>',
      '<div class="admin-route-stats-grid-v143">',
        routes.map(function (route) {
          const pressure = route.pressure;
          return '<article><strong>' + escapeGrowthV143(route.title) + '</strong><div class="admin-growth-mini-v143"><span>Codes ' + (route.soldCodes || 0) + '</span><span>Fin ' + (route.completionRate || 0) + '%</span><span>Moy. ' + escapeGrowthV143(route.averageDuration || 'n/a') + '</span><span>' + adminGrowthFormatMoneyV143(route.revenueCents) + '</span></div><p>' + (pressure && pressure.score ? 'Point de blocage : ' + escapeGrowthV143(pressure.title) + ' (' + pressure.score + ')' : 'Pas encore de blocage notable.') + '</p></article>';
        }).join(''),
      '</div>',
    ].join("");
  }
}

async function adminGrowthRefreshV143(options) {
  const panel = adminGrowthEnsurePanelV143();
  if (!panel || adminGrowthRefreshInFlightV143) return;
  const force = Boolean(options && options.force);
  if (!force && Date.now() - adminGrowthLastRefreshAtV143 < 60000) return;
  adminGrowthRefreshInFlightV143 = true;
  try {
    const payload = await adminGrowthFetchJsonV143(ADMIN_BUSINESS_DASHBOARD_URL_V143);
    adminGrowthLastRefreshAtV143 = Date.now();
    adminGrowthRenderV143(payload);
  } catch (error) {
    const summary = document.querySelector("#admin-growth-summary-v143");
    if (summary) summary.textContent = error.message || "Stats indisponibles.";
  } finally {
    adminGrowthRefreshInFlightV143 = false;
  }
}

function installGrowthSuiteV143() {
  if (window.__growthSuiteV143Installed) return;
  window.__growthSuiteV143Installed = true;
  const previousRenderShopV143 = renderShop;
  renderShop = function renderShopWithGrowthV143() {
    const result = previousRenderShopV143.apply(this, arguments);
    enhanceShopCardsV143();
    ensurePrepAndReviewSectionsV143();
    return result;
  };
  const previousRenderFinishPanelV143 = renderFinishPanel;
  renderFinishPanel = function renderFinishPanelWithGrowthV143(team, route) {
    const result = previousRenderFinishPanelV143.apply(this, arguments);
    addFinishExperienceV143(team, route);
    return result;
  };
  const previousRenderAdminV143 = renderAdmin;
  renderAdmin = function renderAdminWithGrowthV143() {
    const result = previousRenderAdminV143.apply(this, arguments);
    window.setTimeout(function () {
      adminGrowthEnsurePanelV143();
      adminGrowthRefreshV143();
    }, 0);
    return result;
  };
  loadPublicSiteConfigV143();
  window.setTimeout(function () {
    renderShop();
    const team = getCurrentTeam();
    if (team) renderPlayer();
    if (isAdminRouteActive()) renderAdmin();
  }, 500);
}

installGrowthSuiteV143();

/* growth-admin-tools-ui-v145 */
const ADMIN_PUBLIC_SETTINGS_URL_V145 = "/api/admin/public-settings";
const ADMIN_EXPORT_URL_V145 = "/api/admin/export.csv";
const ADMIN_ASSISTANT_URL_V145 = "/api/admin/assistant-dashboard";
const ADMIN_STRIPE_TEST_URL_V145 = "/api/admin/stripe-live-test";
let publicGrowthSettingsV145 = null;
function escV145(value) { return String(value == null ? "" : value).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;"); }
function starsV145(rating) { const count = Math.min(5, Math.max(1, Math.round(Number(rating) || 5))); return "★".repeat(count) + "☆".repeat(5 - count); }
function timeV145(value) { if (!value) return "jamais"; try { return new Intl.DateTimeFormat("fr-BE", { dateStyle: "short", timeStyle: "short" }).format(new Date(Number(value))); } catch { return "date indisponible"; } }
async function fetchJsonV145(url, options) { const response = await fetch(url, Object.assign({ credentials: "same-origin", cache: "no-store", headers: { Accept: "application/json" } }, options || {})); const payload = await response.json().catch(function () { return {}; }); if (!response.ok) throw new Error(payload.message || "Information indisponible."); return payload; }
async function loadPublicGrowthV145() { try { const response = await fetch("/api/public/site-config", { credentials: "same-origin", cache: "no-store", headers: { Accept: "application/json" } }); if (!response.ok) return; publicGrowthSettingsV145 = await response.json(); if (typeof publicSiteConfigV143 !== "undefined") publicSiteConfigV143 = publicGrowthSettingsV145; renderReviewsV145(); renderPhotosV145(); } catch {} }
function renderReviewsV145() { const grid = document.querySelector("#customer-reviews-v143 .reviews-grid-v143"); const reviews = Array.isArray(publicGrowthSettingsV145?.reviews) ? publicGrowthSettingsV145.reviews : []; if (!grid || !reviews.length) return; grid.innerHTML = reviews.map(function (review) { return '<article><strong>' + escV145(starsV145(review.rating)) + '</strong><p>' + escV145(review.text) + '</p><span>- ' + escV145(review.name) + '</span></article>'; }).join(""); }
function renderPhotosV145() { const shopPanel = document.querySelector(".shop-panel"); const photos = Array.isArray(publicGrowthSettingsV145?.localPhotos) ? publicGrowthSettingsV145.localPhotos : []; if (!shopPanel || !photos.length || document.querySelector("#local-photos-v145")) return; const section = document.createElement("section"); section.className = "local-photos-v145"; section.id = "local-photos-v145"; section.innerHTML = '<div><p class="section-label">Ambiance locale</p><h2>Erezee, Blier et Ardenne</h2></div><div class="local-photos-grid-v145">' + photos.slice(0, 4).map(function (photo) { return '<figure><img src="' + escV145(photo.src) + '" alt="' + escV145(photo.alt || '') + '" loading="lazy" /><figcaption>' + escV145(photo.caption || photo.alt || '') + '</figcaption></figure>'; }).join("") + '</div>'; (document.querySelector("#customer-reviews-v143") || shopPanel).insertAdjacentElement("afterend", section); }
function adminPanelV145() { const adminContent = document.querySelector("#admin-content"); if (!adminContent) return null; let panel = document.querySelector("#admin-tools-v145"); if (panel) return panel; panel = document.createElement("section"); panel.className = "admin-tools-panel-v145"; panel.id = "admin-tools-v145"; panel.innerHTML = '<div class="admin-tools-head-v145"><div><p class="section-label">Outils commerciaux</p><h3>Avis, exports et assistance</h3><p id="admin-tools-status-v145">Chargement.</p></div><button class="secondary-button compact-button" type="button" id="admin-tools-refresh-v145">Actualiser</button></div><div class="admin-tools-grid-v145"><article class="admin-tools-card-v145 admin-tools-wide-v145" id="admin-public-settings-v145"></article><article class="admin-tools-card-v145" id="admin-export-card-v145"></article><article class="admin-tools-card-v145 admin-tools-wide-v145" id="admin-assistant-card-v145"></article><article class="admin-tools-card-v145" id="admin-stripe-test-card-v145"></article></div>'; (document.querySelector("#admin-growth-v143") || document.querySelector("#admin-ops-v138") || adminContent).insertAdjacentElement("afterend", panel); panel.querySelector("#admin-tools-refresh-v145")?.addEventListener("click", refreshAdminToolsV145); return panel; }
function reviewInputsV145(settings) { const reviews = Array.isArray(settings?.reviews) ? settings.reviews.slice(0, 3) : []; while (reviews.length < 3) reviews.push({ name: "", text: "", rating: 5 }); return reviews.map(function (review, index) { return '<div class="admin-tools-review-v145"><label>Nom ' + (index + 1) + '<input data-review-name-v145="' + index + '" value="' + escV145(review.name || '') + '" /></label><label>Avis ' + (index + 1) + '<textarea data-review-text-v145="' + index + '" rows="3">' + escV145(review.text || '') + '</textarea></label></div>'; }).join(""); }
function renderAdminToolsV145(settings) { document.querySelector("#admin-public-settings-v145").innerHTML = '<p class="section-label">Google Avis</p><h4>Lien public et avis affiches</h4><label>Lien Google Avis<input id="admin-review-url-v145" type="url" value="' + escV145(settings.reviewUrl || '') + '" placeholder="https://search.google.com/local/writereview?placeid=..." /></label><div class="admin-tools-review-grid-v145">' + reviewInputsV145(settings) + '</div><div class="admin-tools-actions-v145"><button class="secondary-button compact-button" type="button" id="admin-settings-save-v145">Enregistrer</button><a class="text-button" target="_blank" rel="noopener" href="' + escV145(settings.reviewUrl || '#') + '">Tester le lien avis</a></div><p class="admin-tools-muted-v145">Des que tu as de vrais avis clients, remplace les exemples ici.</p>'; document.querySelector("#admin-export-card-v145").innerHTML = '<p class="section-label">Exports CSV</p><h4>Compta et suivi</h4><div class="admin-tools-actions-v145"><a class="secondary-button compact-button" href="' + ADMIN_EXPORT_URL_V145 + '?type=sales">Ventes</a><a class="secondary-button compact-button" href="' + ADMIN_EXPORT_URL_V145 + '?type=codes">Codes</a><a class="secondary-button compact-button" href="' + ADMIN_EXPORT_URL_V145 + '?type=teams">Equipes</a></div>'; document.querySelector("#admin-assistant-card-v145").innerHTML = '<p class="section-label">Mini assistance</p><h4>Retrouver vite une equipe</h4><div class="admin-assistant-search-v145"><input id="admin-assistant-query-v145" placeholder="Code, nom equipe ou e-mail" /><button class="secondary-button compact-button" type="button" id="admin-assistant-search-v145">Chercher</button></div><div class="admin-assistant-results-v145" id="admin-assistant-results-v145"><p class="admin-tools-muted-v145">Entrez un code pour voir la derniere synchro et quoi dire au client.</p></div>'; const options = (data.routes || []).filter(function (route) { return route.shopVisible !== false && Number(route.pricePerPerson) > 0; }).map(function (route) { return '<option value="' + escV145(route.id) + '">' + escV145(route.title) + '</option>'; }).join(""); document.querySelector("#admin-stripe-test-card-v145").innerHTML = '<p class="section-label">Stripe reel</p><h4>Test masque a 1 euro</h4><select id="admin-stripe-test-route-v145">' + options + '</select><button class="secondary-button compact-button" type="button" id="admin-stripe-test-v145">Creer le checkout test</button><p class="admin-tools-muted-v145" id="admin-stripe-result-v145">Paiement reel a lancer volontairement.</p>'; document.querySelector("#admin-settings-save-v145")?.addEventListener("click", saveAdminSettingsV145); document.querySelector("#admin-assistant-search-v145")?.addEventListener("click", searchAssistantV145); document.querySelector("#admin-stripe-test-v145")?.addEventListener("click", createStripeTestV145); }
async function refreshAdminToolsV145() { const panel = adminPanelV145(); if (!panel) return; try { const settings = await fetchJsonV145(ADMIN_PUBLIC_SETTINGS_URL_V145); publicGrowthSettingsV145 = settings; if (typeof publicSiteConfigV143 !== "undefined") publicSiteConfigV143 = settings; renderAdminToolsV145(settings); document.querySelector("#admin-tools-status-v145").textContent = "Derniere actualisation : " + timeV145(Date.now()); } catch (error) { document.querySelector("#admin-tools-status-v145").textContent = error.message || "Outils indisponibles."; } }
async function saveAdminSettingsV145() { const reviews = [0,1,2].map(function (index) { return { name: document.querySelector('[data-review-name-v145="' + index + '"]')?.value || '', text: document.querySelector('[data-review-text-v145="' + index + '"]')?.value || '', rating: 5 }; }); const payload = await fetchJsonV145(ADMIN_PUBLIC_SETTINGS_URL_V145, { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify({ reviewUrl: document.querySelector("#admin-review-url-v145")?.value || "", reviews }) }); publicGrowthSettingsV145 = payload; renderReviewsV145(); showToast("Avis et lien Google mis a jour."); refreshAdminToolsV145(); }
async function searchAssistantV145() { const results = document.querySelector("#admin-assistant-results-v145"); results.innerHTML = '<p class="admin-tools-muted-v145">Recherche en cours...</p>'; try { const payload = await fetchJsonV145(ADMIN_ASSISTANT_URL_V145 + '?query=' + encodeURIComponent(document.querySelector("#admin-assistant-query-v145")?.value || '')); const matches = Array.isArray(payload.matches) ? payload.matches : []; results.innerHTML = matches.length ? matches.map(function (match) { return '<article class="admin-assistant-result-v145"><strong>' + escV145(match.name) + '</strong><span>' + escV145(match.code || '') + ' - ' + escV145(match.routeTitle) + '</span><div class="admin-tools-mini-v145"><span>' + escV145(match.status) + '</span><span>' + (match.progress?.solved || 0) + '/' + (match.progress?.total || 0) + '</span><span>Sync ' + escV145(timeV145(match.lastActivityAt)) + '</span><span>' + (match.hasPosition ? 'GPS ok' : 'Sans GPS') + '</span></div><ul>' + (match.advice || []).map(function (item) { return '<li>' + escV145(item) + '</li>'; }).join('') + '</ul></article>'; }).join('') : '<p class="admin-tools-muted-v145">Aucun resultat.</p>'; } catch (error) { results.innerHTML = '<p class="form-message">' + escV145(error.message || 'Recherche impossible.') + '</p>'; } }
async function createStripeTestV145() { if (!window.confirm("Ce bouton cree une vraie session Stripe LIVE a 1 euro. Continuer ?")) return; const result = document.querySelector("#admin-stripe-result-v145"); try { const payload = await fetchJsonV145(ADMIN_STRIPE_TEST_URL_V145, { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify({ confirm: "CREATE_REAL_LIVE_CHECKOUT", routeId: document.querySelector("#admin-stripe-test-route-v145")?.value || "" }) }); result.innerHTML = 'Session creee pour ' + escV145(payload.routeTitle) + ' : <a target="_blank" rel="noopener" href="' + escV145(payload.url) + '">ouvrir Stripe Checkout</a>'; } catch (error) { result.textContent = error.message || "Session Stripe impossible."; } }
if (typeof renderAdmin === "function" && !window.__growthAdminToolsV145) { window.__growthAdminToolsV145 = true; const oldAdminV145 = renderAdmin; renderAdmin = function () { const result = oldAdminV145.apply(this, arguments); window.setTimeout(function () { adminPanelV145(); refreshAdminToolsV145(); }, 0); return result; }; const oldShopV145 = renderShop; renderShop = function () { const result = oldShopV145.apply(this, arguments); renderReviewsV145(); renderPhotosV145(); return result; }; }
loadPublicGrowthV145(); window.setTimeout(function () { renderReviewsV145(); renderPhotosV145(); if (isAdminRouteActive()) refreshAdminToolsV145(); }, 1600);


/* player-i18n-pure-v152 */
(function installPlayerI18nPureV152() {
  if (window.__playerI18nPureV152) return;
  window.__playerI18nPureV152 = true;

  const exact = {
    en: {
      "synchronisation": "Sync",
      "connexion et position en attente.": "Connection and position pending.",
      "mode local": "Local mode",
      "le serveur n'est pas disponible sur cette adresse. gardez cette page ouverte.": "The server is not available from this address. Keep this page open.",
      "serveur en attente": "Server pending",
      "nouvel essai automatique en cours. appuyez sur resynchroniser si l'ecran semble fige.": "Automatic retry in progress. Tap Resync if the screen seems frozen.",
      "depart valide": "Start confirmed",
      "position de depart confirmee.": "Start position confirmed.",
      "gps a confirmer": "GPS to confirm",
      "localisez-vous au point de depart avant de lancer l'aventure.": "Go to the start point and confirm your location before starting the adventure.",
      "partie terminee": "Game finished",
      "resultat conserve.": "Result saved.",
      "gps a verifier": "GPS needs attention",
      "autorisez la localisation puis relancez le suivi si la carte ne bouge plus.": "Allow location access, then restart tracking if the map no longer moves.",
      "position en attente": "Waiting for position",
      "activez le suivi gps pour envoyer l'avancee a la gestion.": "Enable GPS tracking to send progress to the admin.",
      "position figee": "Position frozen",
      "position peu recente": "Position not recent",
      "le suivi va se relancer.": "Tracking will restart.",
      "suivi actif": "Tracking active",
      "contact serveur en attente.": "Waiting for server contact.",
      "position non disponible. verifiez l'autorisation gps puis reessayez.": "Position unavailable. Check GPS permission and try again.",
      "la geolocalisation n'est pas disponible sur cet appareil.": "Location is not available on this device.",
      "suivi gps actif. la position est aussi visible dans la gestion.": "GPS tracking is active. The position is also visible in the admin.",
      "suivi gps actif. la carte et la gestion vont se mettre a jour automatiquement.": "GPS tracking is active. The map and admin will update automatically.",
      "recherche de votre position au point de depart...": "Searching for your position at the start point...",
      "actualiser ma position": "Refresh my position",
      "me localiser au depart": "Locate me at the start"
    },
    nl: {
      "synchronisation": "Synchronisatie",
      "connexion et position en attente.": "Verbinding en positie in afwachting.",
      "mode local": "Lokale modus",
      "le serveur n'est pas disponible sur cette adresse. gardez cette page ouverte.": "De server is niet beschikbaar via dit adres. Houd deze pagina open.",
      "serveur en attente": "Server in afwachting",
      "nouvel essai automatique en cours. appuyez sur resynchroniser si l'ecran semble fige.": "Automatische nieuwe poging bezig. Tik op opnieuw synchroniseren als het scherm vast lijkt te zitten.",
      "depart valide": "Start bevestigd",
      "position de depart confirmee.": "Startpositie bevestigd.",
      "gps a confirmer": "GPS te bevestigen",
      "localisez-vous au point de depart avant de lancer l'aventure.": "Ga naar het startpunt en bevestig je locatie voordat je begint.",
      "partie terminee": "Spel afgelopen",
      "resultat conserve.": "Resultaat bewaard.",
      "gps a verifier": "GPS controleren",
      "autorisez la localisation puis relancez le suivi si la carte ne bouge plus.": "Sta locatie toe en start de tracking opnieuw als de kaart niet meer beweegt.",
      "position en attente": "Wachten op positie",
      "activez le suivi gps pour envoyer l'avancee a la gestion.": "Schakel GPS-tracking in om de voortgang naar het beheer te sturen.",
      "position figee": "Positie vastgelopen",
      "position peu recente": "Positie niet recent",
      "le suivi va se relancer.": "De tracking wordt opnieuw gestart.",
      "suivi actif": "Tracking actief",
      "contact serveur en attente.": "Wachten op servercontact.",
      "position non disponible. verifiez l'autorisation gps puis reessayez.": "Positie niet beschikbaar. Controleer de GPS-toestemming en probeer opnieuw.",
      "la geolocalisation n'est pas disponible sur cet appareil.": "Locatie is niet beschikbaar op dit toestel.",
      "suivi gps actif. la position est aussi visible dans la gestion.": "GPS-tracking is actief. De positie is ook zichtbaar in het beheer.",
      "suivi gps actif. la carte et la gestion vont se mettre a jour automatiquement.": "GPS-tracking is actief. De kaart en het beheer worden automatisch bijgewerkt.",
      "recherche de votre position au point de depart...": "Zoeken naar je positie bij het startpunt...",
      "actualiser ma position": "Mijn positie vernieuwen",
      "me localiser au depart": "Lokaliseer mij bij de start"
    }
  };

  function langV152() {
    if (typeof playerLangV151 === "function") return playerLangV151();
    const active = document.querySelector("#language-switcher [aria-pressed='true'], #language-switcher .is-active");
    const candidate = active?.dataset?.lang || (typeof escapeI18nLanguage === "function" ? escapeI18nLanguage() : "") || (document.documentElement.lang || "fr").slice(0, 2);
    return ["fr", "en", "nl"].includes(candidate) ? candidate : "fr";
  }

  function keyV152(value) {
    return String(value == null ? "" : value)
      .replace(/&amp;#039;|&#039;/g, "'")
      .replace(/[’\`]/g, "'")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase();
  }

  function relativeV152(value, lang) {
    const key = keyV152(value);
    if (lang === "fr") return value;
    if (key === "jamais") return lang === "nl" ? "nooit" : "never";
    if (key === "a l'instant") return lang === "nl" ? "net nu" : "just now";
    let match = key.match(/^il y a (\d+) s$/);
    if (match) return lang === "nl" ? match[1] + " sec geleden" : match[1] + " sec ago";
    match = key.match(/^il y a (\d+) min$/);
    if (match) return lang === "nl" ? match[1] + " min geleden" : match[1] + " min ago";
    match = key.match(/^il y a (\d+) h$/);
    if (match) return lang === "nl" ? match[1] + " u geleden" : match[1] + " h ago";
    return value;
  }

  window.playerDynamicTextV152 = function playerDynamicTextV152(value) {
    const original = String(value == null ? "" : value);
    const trimmed = original.trim();
    const lang = langV152();
    if (!trimmed || lang === "fr") return original;
    const normalized = keyV152(trimmed);
    let translated = exact[lang]?.[normalized] || "";
    let match;
    if (!translated && (match = normalized.match(/^serveur contacte (.+)\.$/))) {
      translated = lang === "nl" ? "Server gecontacteerd " + relativeV152(match[1], lang) + "." : "Server contacted " + relativeV152(match[1], lang) + ".";
    }
    if (!translated && (match = normalized.match(/^derniere position recue (.+)\. appuyez sur resynchroniser\.$/))) {
      translated = lang === "nl" ? "Laatste positie ontvangen " + relativeV152(match[1], lang) + ". Tik op opnieuw syncen." : "Last position received " + relativeV152(match[1], lang) + ". Tap Resync.";
    }
    if (!translated && (match = normalized.match(/^derniere position recue (.+)\. le suivi va se relancer\.$/))) {
      translated = lang === "nl" ? "Laatste positie ontvangen " + relativeV152(match[1], lang) + ". De tracking wordt opnieuw gestart." : "Last position received " + relativeV152(match[1], lang) + ". Tracking will restart.";
    }
    if (!translated && (match = normalized.match(/^position envoyee (.+)\. (.+)$/))) {
      translated = lang === "nl" ? "Positie verzonden " + relativeV152(match[1], lang) + ". " + window.playerDynamicTextV152(match[2]) : "Position sent " + relativeV152(match[1], lang) + ". " + window.playerDynamicTextV152(match[2]);
    }
    return translated ? original.replace(trimmed, translated) : original;
  };

  if (typeof playerRescueRelativeTime === "function") {
    const originalRelativeV152 = playerRescueRelativeTime;
    playerRescueRelativeTime = function playerRescueRelativeTimePureV152(timestamp) {
      return relativeV152(originalRelativeV152.apply(this, arguments), langV152());
    };
  }
  if (typeof playerRescueStatus === "function") {
    const originalStatusV152 = playerRescueStatus;
    playerRescueStatus = function playerRescueStatusPureV152() {
      const status = originalStatusV152.apply(this, arguments);
      if (!status || langV152() === "fr") return status;
      return { ...status, title: window.playerDynamicTextV152(status.title), text: window.playerDynamicTextV152(status.text) };
    };
  }
  if (typeof setBriefingLocationMessage === "function") {
    const originalBriefingMessageV152 = setBriefingLocationMessage;
    setBriefingLocationMessage = function setBriefingLocationMessagePureV152(kind, message) {
      return originalBriefingMessageV152.call(this, kind, window.playerDynamicTextV152(message));
    };
  }
})();


/* player-i18n-source-fix-v153 */
(function installPlayerI18nSourceFixV153() {
  if (window.__playerI18nSourceFixV153) return;
  window.__playerI18nSourceFixV153 = true;
  const previous = window.playerDynamicTextV152;
  const extra = {
    en: {
      "etat du jeu": "Game status",
      "resynchroniser": "Resync",
      "position non disponible. verifiez l'autorisation gps puis reessayez.": "Position unavailable. Check GPS permission and try again."
    },
    nl: {
      "etat du jeu": "Spelstatus",
      "resynchroniser": "Opnieuw syncen",
      "position non disponible. verifiez l'autorisation gps puis reessayez.": "Positie niet beschikbaar. Controleer de GPS-toestemming en probeer opnieuw."
    }
  };
  function lang() {
    if (typeof playerLangV151 === "function") return playerLangV151();
    const active = document.querySelector("#language-switcher [aria-pressed='true'], #language-switcher .is-active");
    const candidate = active?.dataset?.lang || (document.documentElement.lang || "fr").slice(0, 2);
    return ["fr", "en", "nl"].includes(candidate) ? candidate : "fr";
  }
  function key(value) {
    return String(value == null ? "" : value)
      .replace(/&amp;#039;|&#039;/g, "'")
      .replace(/[â€™\`]/g, "'")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase();
  }
  window.playerDynamicTextV152 = function playerDynamicTextFixedV153(value) {
    const current = lang();
    if (current !== "fr") {
      const translated = extra[current]?.[key(value)];
      if (translated) return String(value == null ? "" : value).replace(String(value == null ? "" : value).trim(), translated);
    }
    return typeof previous === "function" ? previous(value) : String(value == null ? "" : value);
  };
})();

/* reviews-suite-ui-v165 */
function reviewRatingOptionsV165(value) {
  const current = Math.min(5, Math.max(1, Math.round(Number(value) || 5)));
  return [5, 4, 3, 2, 1].map(function (rating) {
    return '<option value="' + rating + '"' + (rating === current ? ' selected' : '') + '>' + rating + '/5</option>';
  }).join('');
}

function reviewUrlIsDirectV165(url) {
  return /^https:\/\/search\.google\.com\/local\/writereview\?placeid=/i.test(String(url || ''));
}

if (typeof reviewInputsV145 === 'function') {
  reviewInputsV145 = function reviewInputsV165(settings) {
    const reviews = Array.isArray(settings?.reviews) ? settings.reviews.slice(0, 6) : [];
    while (reviews.length < 6) reviews.push({ name: '', text: '', rating: 5 });
    return reviews.map(function (review, index) {
      return '<div class="admin-tools-review-v145 admin-review-v165">' +
        '<div class="admin-review-head-v165"><strong>Avis ' + (index + 1) + '</strong><label>Note<select data-review-rating-v145="' + index + '">' + reviewRatingOptionsV165(review.rating) + '</select></label></div>' +
        '<label>Nom<input data-review-name-v145="' + index + '" value="' + escV145(review.name || '') + '" /></label>' +
        '<label>Texte<textarea data-review-text-v145="' + index + '" rows="3">' + escV145(review.text || '') + '</textarea></label>' +
      '</div>';
    }).join('');
  };
}

if (typeof renderReviewsV145 === 'function') {
  renderReviewsV145 = function renderReviewsV165() {
    const section = document.querySelector('#customer-reviews-v143');
    const grid = section?.querySelector('.reviews-grid-v143');
    const reviews = Array.isArray(publicGrowthSettingsV145?.reviews) ? publicGrowthSettingsV145.reviews.slice(0, 6) : [];
    if (grid && reviews.length) {
      grid.innerHTML = reviews.map(function (review) {
        return '<article><strong>' + escV145(starsV145(review.rating)) + '</strong><p>' + escV145(review.text) + '</p><span>- ' + escV145(review.name) + '</span></article>';
      }).join('');
    }
    if (!section) return;
    let cta = section.querySelector('.reviews-cta-v165');
    if (!cta) {
      cta = document.createElement('div');
      cta.className = 'reviews-cta-v165';
      section.appendChild(cta);
    }
    const reviewUrl = publicGrowthSettingsV145?.reviewUrl || publicSiteConfigV143?.reviewUrl || 'https://g.page/r/CfoZCZf_vyxPEBM/review';
    cta.innerHTML = '<p>Vous avez deja joue ? Votre retour aide les prochaines equipes.</p><a class="secondary-button compact-button" target="_blank" rel="noopener" href="' + escV145(reviewUrl) + '">Laisser un avis</a>';
  };
}

if (typeof addFinishExperienceV143 === 'function') {
  addFinishExperienceV143 = function addFinishExperienceV165(team, route) {
    if (!els.finishPanel || !team || !route) return;
    let block = els.finishPanel.querySelector('#finish-experience-v143');
    if (!block) {
      block = document.createElement('div');
      block.id = 'finish-experience-v143';
      block.className = 'finish-experience-v143 finish-review-v165';
      els.finishPanel.appendChild(block);
    }
    const reviewUrl = publicGrowthSettingsV145?.reviewUrl || publicSiteConfigV143?.reviewUrl || 'https://g.page/r/CfoZCZf_vyxPEBM/review';
    const won = team.status === 'won';
    block.innerHTML = [
      '<div class="finish-review-card-v165">',
        '<p class="section-label">Avis client</p>',
        '<h3>' + (won ? 'Vous avez aime l aventure ?' : 'Merci d avoir joue') + '</h3>',
        '<p>' + (won ? 'Un avis Google aide enormement les prochaines equipes a choisir leur parcours.' : 'Votre retour reste precieux pour ameliorer les parcours et aider les prochains joueurs.') + '</p>',
        '<div class="finish-actions-v143">',
          '<a class="primary-button" target="_blank" rel="noopener" href="' + escapeGrowthV143(reviewUrl) + '">Laisser un avis</a>',
          '<button class="secondary-button" type="button" id="souvenir-photo-v143">Photo souvenir</button>',
          '<a class="secondary-button" href="#shop">Decouvrir un autre parcours</a>',
        '</div>',
      '</div>',
    ].join('');
    block.querySelector('#souvenir-photo-v143')?.addEventListener('click', function () { createSouvenirImageV143(team, route); });
  };
}

if (typeof renderAdminToolsV145 === 'function' && !window.__reviewsAdminWrapV165) {
  window.__reviewsAdminWrapV165 = true;
  const previousRenderAdminToolsV165 = renderAdminToolsV145;
  renderAdminToolsV145 = function renderAdminToolsWithReviewsV165(settings) {
    const result = previousRenderAdminToolsV165.apply(this, arguments);
    const card = document.querySelector('#admin-public-settings-v145');
    if (card && !card.querySelector('.admin-review-status-v165')) {
      const reviewUrl = settings?.reviewUrl || '';
      const status = document.createElement('div');
      status.className = 'admin-review-status-v165 ' + (reviewUrlIsDirectV165(reviewUrl) ? 'is-direct' : 'is-generic');
      status.innerHTML = '<strong>' + (reviewUrlIsDirectV165(reviewUrl) ? 'Lien Google direct configure' : 'Lien Google a verifier') + '</strong><span>' + (reviewUrlIsDirectV165(reviewUrl) ? 'Les boutons avis ouvrent directement la fiche Google.' : 'Collez le lien direct Google Avis quand il sera disponible.') + '</span>';
      card.querySelector('label')?.insertAdjacentElement('afterend', status);
    }
    return result;
  };
}

if (typeof saveAdminSettingsV145 === 'function') {
  saveAdminSettingsV145 = async function saveAdminSettingsV165() {
    const reviews = [0, 1, 2, 3, 4, 5].map(function (index) {
      return {
        name: document.querySelector('[data-review-name-v145="' + index + '"]')?.value || '',
        text: document.querySelector('[data-review-text-v145="' + index + '"]')?.value || '',
        rating: Number(document.querySelector('[data-review-rating-v145="' + index + '"]')?.value || 5),
      };
    });
    const payload = await fetchJsonV145(ADMIN_PUBLIC_SETTINGS_URL_V145, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ reviewUrl: document.querySelector('#admin-review-url-v145')?.value || '', reviews }),
    });
    publicGrowthSettingsV145 = payload;
    if (typeof publicSiteConfigV143 !== 'undefined') publicSiteConfigV143 = payload;
    renderReviewsV145();
    showToast('Avis clients mis a jour.');
    refreshAdminToolsV145();
  };
}



/* admin-robustness-v167 */
(function initAdminRobustnessV167() {
  if (window.__adminRobustnessV167) return;
  window.__adminRobustnessV167 = true;
  const state = { dirty: false, saving: false, lastSavedAt: null, lastError: "", status: null, timer: null };
  const forms = ["#route-form", "#route-details-form", "#puzzle-form", "#puzzle-content-form", "#geo-form", "#hints-form"];
  const endpoint = "/api/admin/robustness";
  const isAdminVisible = () => location.hash === "#admin" && !document.querySelector("#admin-content.is-hidden");
  const fmt = (value) => value ? new Intl.DateTimeFormat("fr-BE", { dateStyle: "short", timeStyle: "short" }).format(new Date(Number(value))) : "jamais";

  function ensurePanel() {
    const adminContent = document.querySelector("#admin-content");
    if (!adminContent) return null;
    let panel = document.querySelector("#admin-robustness-panel-v167");
    if (!panel) {
      panel = document.createElement("section");
      panel.id = "admin-robustness-panel-v167";
      panel.className = "admin-robustness-panel-v167";
      panel.innerHTML = '<div class="admin-robustness-head-v167"><div><p class="section-label">Robustesse admin</p><h3>Garde-fous et diagnostic</h3><p>Protection contre les pertes de parcours, sauvegarde avant ecriture sensible et controles de coherence.</p></div><div class="admin-robustness-actions-v167"><button class="secondary-button compact-button" type="button" data-robust-refresh>Verifier</button><button class="primary-button compact-button" type="button" data-robust-backup>Sauvegarde manuelle</button></div></div><div class="admin-robustness-grid-v167" data-robust-grid>Diagnostic en attente.</div><div class="admin-robustness-save-v167" data-robust-save>Etat sauvegarde: pret.</div>';
      const target = document.querySelector("#admin-data-safety-panel") || adminContent.querySelector("section");
      if (target?.parentNode) target.parentNode.insertBefore(panel, target.nextSibling);
      else adminContent.prepend(panel);
    }
    const refresh = panel.querySelector("[data-robust-refresh]");
    const backup = panel.querySelector("[data-robust-backup]");
    if (refresh && refresh.dataset.bound !== "1") {
      refresh.dataset.bound = "1";
      refresh.addEventListener("click", () => refreshStatus(true));
    }
    if (backup && backup.dataset.bound !== "1") {
      backup.dataset.bound = "1";
      backup.addEventListener("click", () => createBackup());
    }
    return panel;
  }

  function tile(label, value, status) {
    return '<article class="admin-robustness-tile-v167 is-' + status + '"><span>' + label + '</span><strong>' + value + '</strong></article>';
  }

  function render() {
    const panel = ensurePanel();
    if (!panel) return;
    const grid = panel.querySelector("[data-robust-grid]");
    const save = panel.querySelector("[data-robust-save]");
    if (save) {
      save.textContent = state.saving ? "Sauvegarde en cours..." : state.lastError ? "Derniere erreur: " + state.lastError : state.dirty ? "Modifications detectees: pensez a enregistrer." : state.lastSavedAt ? "Derniere sauvegarde: " + fmt(state.lastSavedAt) : "Etat sauvegarde: pret.";
      save.classList.toggle("is-warning", state.dirty);
      save.classList.toggle("is-error", Boolean(state.lastError));
    }
    if (!grid) return;
    if (!state.status) {
      grid.textContent = state.lastError || "Diagnostic en attente.";
      return;
    }
    const status = state.status;
    const warnings = (status.warnings || []).slice(0, 4);
    grid.innerHTML = [
      tile("Parcours proteges", String(status.summary?.routes ?? 0), status.validation?.ok ? "ok" : "error"),
      tile("Codes", String(status.summary?.codes ?? 0), "ok"),
      tile("Equipes en cours", String(status.summary?.playingTeams ?? 0), status.staleTeams?.length ? "warning" : "ok"),
      tile("Sauvegardes", String(status.summary?.backups ?? 0), status.latestBackup ? "ok" : "warning"),
      '<div class="admin-robustness-note-v167"><strong>' + (status.ok ? "Robustesse active" : "Point a verifier") + '</strong><span>Perte de parcours bloquee, doublons critiques bloques, sauvegarde pre-ecriture active.</span>' + (warnings.length ? '<ul><li>' + warnings.join("</li><li>") + '</li></ul>' : '<span>Aucune alerte importante detectee.</span>') + '</div>',
    ].join("");
  }

  async function refreshStatus(force = false) {
    if (!force && !isAdminVisible()) return;
    ensurePanel();
    try {
      const response = await fetch(endpoint, { credentials: "same-origin", cache: "no-store" });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.message || "Diagnostic indisponible.");
      state.status = payload;
      state.lastError = "";
    } catch (error) {
      state.lastError = error.message || "Diagnostic indisponible.";
    }
    render();
  }

  async function createBackup() {
    state.saving = true;
    state.lastError = "";
    render();
    try {
      const response = await fetch(endpoint, { method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "backup" }) });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.message || "Sauvegarde impossible.");
      state.status = payload.status || state.status;
      state.lastSavedAt = payload.backup?.modifiedAt || Date.now();
      state.dirty = false;
    } catch (error) {
      state.lastError = error.message || "Sauvegarde impossible.";
    }
    state.saving = false;
    render();
  }

  function bindDirty() {
    forms.forEach((selector) => {
      const form = document.querySelector(selector);
      if (!form || form.dataset.robustnessDirtyBoundV167 === "1") return;
      form.dataset.robustnessDirtyBoundV167 = "1";
      ["input", "change"].forEach((eventName) => form.addEventListener(eventName, () => { state.dirty = true; state.lastError = ""; render(); }, true));
      form.addEventListener("submit", () => window.setTimeout(() => { state.dirty = false; render(); }, 1200), true);
    });
  }

  function bindDanger() {
    if (document.body.dataset.robustnessDangerBoundV167 === "1") return;
    document.body.dataset.robustnessDangerBoundV167 = "1";
    document.body.addEventListener("click", (event) => {
      const button = event.target?.closest?.("[data-delete-code], [data-delete-team], [data-delete-route], [data-delete-puzzle]");
      if (!button || button.dataset.robustnessConfirmedV167 === "1") return;
      event.preventDefault();
      event.stopImmediatePropagation();
      const text = button.dataset.robustnessOriginalTextV167 || button.textContent || "Supprimer";
      button.dataset.robustnessOriginalTextV167 = text;
      button.dataset.robustnessConfirmedV167 = "1";
      button.textContent = "Recliquer pour confirmer";
      button.classList.add("is-awaiting-confirm-v167");
      window.setTimeout(() => {
        if (button.dataset.robustnessConfirmedV167 !== "1") return;
        delete button.dataset.robustnessConfirmedV167;
        button.textContent = text;
        button.classList.remove("is-awaiting-confirm-v167");
      }, 5500);
    }, true);
  }

  function wrapFetch() {
    if (window.fetch.__adminRobustnessWrappedV167) return;
    const originalFetch = window.fetch.bind(window);
    window.fetch = async (...args) => {
      const request = args[0];
      const options = args[1] || {};
      const url = typeof request === "string" ? request : request?.url || "";
      const method = String(options.method || request?.method || "GET").toUpperCase();
      const watches = url.includes("/api/data") && ["PUT", "POST"].includes(method);
      if (watches) { state.saving = true; state.lastError = ""; render(); }
      try {
        const response = await originalFetch(...args);
        if (watches) {
          const payload = await response.clone().json().catch(() => ({}));
          if (response.ok) { state.lastSavedAt = payload.savedAt || Date.now(); state.dirty = false; window.setTimeout(() => refreshStatus(true), 400); }
          else state.lastError = payload.message || "Sauvegarde refusee.";
        }
        return response;
      } catch (error) {
        if (watches) state.lastError = error.message || "Sauvegarde impossible.";
        throw error;
      } finally {
        if (watches) { state.saving = false; render(); }
      }
    };
    window.fetch.__adminRobustnessWrappedV167 = true;
  }

  function tick() {
    if (!isAdminVisible()) return;
    ensurePanel();
    bindDirty();
    bindDanger();
    refreshStatus();
    if (!state.timer) state.timer = window.setInterval(() => refreshStatus(), 60000);
  }

  window.addEventListener("beforeunload", (event) => {
    if (!state.dirty || !isAdminVisible()) return;
    event.preventDefault();
    event.returnValue = "";
  });
  window.addEventListener("hashchange", () => window.setTimeout(tick, 250));
  document.addEventListener("DOMContentLoaded", () => { wrapFetch(); window.setTimeout(tick, 700); window.setInterval(tick, 3000); });
  wrapFetch();
  window.setTimeout(tick, 700);
})();


/* admin-i18n-workspace-v170 */
function answerCandidatesV156(route, puzzle) {
  const normalize = typeof normalizeAnswer === "function"
    ? normalizeAnswer
    : function (value) { return String(value || "").trim().toLowerCase(); };
  const values = [];
  const pushValue = function (value) {
    if (Array.isArray(value)) value.forEach(pushValue);
    else if (value !== undefined && value !== null && String(value).trim()) values.push(String(value).trim());
  };
  const staticRoutes = typeof ESCAPE_I18N_ROUTES !== "undefined" ? ESCAPE_I18N_ROUTES : {};
  const aliases = typeof ESCAPE_I18N_ANSWER_ALIASES !== "undefined" ? ESCAPE_I18N_ANSWER_ALIASES : {};

  pushValue(puzzle?.answer);
  pushValue(puzzle?.acceptedAnswers);
  pushValue(puzzle?.answers);
  ["en", "nl"].forEach(function (lang) {
    const bucket = puzzle?.i18n?.[lang] || {};
    const staticPuzzle = staticRoutes?.[route?.id]?.[lang]?.puzzles?.[puzzle?.id] || {};
    pushValue(bucket.answer);
    pushValue(bucket.acceptedAnswers);
    pushValue(bucket.answerAliases);
    pushValue(staticPuzzle.answer);
    pushValue(staticPuzzle.acceptedAnswers);
    pushValue(staticPuzzle.answerAliases);
  });

  const normalized = new Set(values.map(function (value) { return normalize(value); }).filter(Boolean));
  values.forEach(function (value) {
    const key = normalize(value);
    (aliases[key] || []).forEach(function (alias) { normalized.add(normalize(alias)); });
  });
  return normalized;
}

(function initAdminI18nWorkspaceV170() {
  if (window.__adminI18nWorkspaceV170) return;
  window.__adminI18nWorkspaceV170 = true;

  const langs = [
    { id: "en", label: "Anglais", short: "EN" },
    { id: "nl", label: "Neerlandais", short: "NL" },
  ];
  const routeFields = [
    { key: "title", label: "Nom du parcours", type: "short" },
    { key: "area", label: "Zone / lieu", type: "short" },
    { key: "description", label: "Description boutique", type: "long" },
    { key: "briefingText", label: "Briefing joueur", type: "long" },
    { key: "finishMessage", label: "Message de fin", type: "long" },
  ];
  const puzzleFields = [
    { key: "title", label: "Titre de l'enigme", type: "short" },
    { key: "place", label: "Lieu", type: "short" },
    { key: "question", label: "Question", type: "long" },
    { key: "arrivalMessage", label: "Message d'arrivee", type: "long" },
    { key: "answer", label: "Reponse principale", type: "short" },
  ];
  const state = { routeId: "", puzzleId: "", lang: "en", lastKey: "" };

  function html(value) {
    return typeof escapeHtml === "function"
      ? escapeHtml(String(value == null ? "" : value))
      : String(value == null ? "" : value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
  }

  function routesV170() {
    return Array.isArray(data?.routes) ? data.routes : [];
  }

  function currentRouteV170() {
    const routes = routesV170();
    const active = routes.find(function (route) { return route.id === state.routeId; })
      || (typeof getActiveRoute === "function" ? getActiveRoute() : null)
      || routes[0]
      || null;
    if (active) state.routeId = active.id;
    return active;
  }

  function currentPuzzleV170(route) {
    const puzzles = Array.isArray(route?.puzzles) ? route.puzzles : [];
    const selected = puzzles.find(function (puzzle) { return puzzle.id === state.puzzleId; }) || puzzles[0] || null;
    if (selected) state.puzzleId = selected.id;
    return selected;
  }

  function ensureBucketV170(target, lang) {
    target.i18n ||= {};
    target.i18n[lang] ||= {};
    return target.i18n[lang];
  }

  function langValueV170(target, lang, field) {
    return String(target?.i18n?.[lang]?.[field] || "");
  }

  function setLangValueV170(target, lang, field, value) {
    const bucket = ensureBucketV170(target, lang);
    const clean = String(value || "").trim();
    if (clean) bucket[field] = clean;
    else delete bucket[field];
  }

  function sourceValueV170(target, field) {
    return String(target?.[field] || "");
  }

  function textArrayV170(value) {
    if (!Array.isArray(value)) return [];
    return value
      .map(function (item) {
        if (typeof item === "string") return item;
        return String(item?.text || item?.answer || item?.value || "");
      })
      .map(function (item) { return item.trim(); })
      .filter(Boolean);
  }

  function sourceHintsV170(puzzle) {
    return textArrayV170(puzzle?.hints);
  }

  function translatedHintsV170(puzzle, lang) {
    return textArrayV170(puzzle?.i18n?.[lang]?.hints);
  }

  function translatedAcceptedAnswersV170(puzzle, lang) {
    return textArrayV170(puzzle?.i18n?.[lang]?.acceptedAnswers || puzzle?.i18n?.[lang]?.answerAliases);
  }

  function setTextArrayV170(target, lang, field, raw) {
    const bucket = ensureBucketV170(target, lang);
    const values = String(raw || "")
      .split(/\r?\n/)
      .map(function (line) { return line.trim(); })
      .filter(Boolean);
    if (values.length) bucket[field] = values;
    else delete bucket[field];
  }

  function sourceAcceptedAnswersV170(puzzle) {
    return [
      puzzle?.answer,
      ...textArrayV170(puzzle?.acceptedAnswers),
      ...textArrayV170(puzzle?.answers),
    ].filter(Boolean);
  }

  function fieldNeededV170(value) {
    return String(value || "").trim().length > 0;
  }

  function coverageForLangV170(route, lang) {
    let total = 0;
    let done = 0;
    const missing = [];
    routeFields.forEach(function (field) {
      if (!fieldNeededV170(sourceValueV170(route, field.key))) return;
      total += 1;
      if (fieldNeededV170(langValueV170(route, lang, field.key))) done += 1;
      else missing.push("Parcours: " + field.label);
    });
    (route.puzzles || []).forEach(function (puzzle, index) {
      const label = "E" + (index + 1) + " - " + (puzzle.title || puzzle.id || "enigme");
      puzzleFields.forEach(function (field) {
        if (!fieldNeededV170(sourceValueV170(puzzle, field.key))) return;
        total += 1;
        if (fieldNeededV170(langValueV170(puzzle, lang, field.key))) done += 1;
        else missing.push(label + ": " + field.label);
      });
      const sourceHints = sourceHintsV170(puzzle);
      if (sourceHints.length) {
        total += sourceHints.length;
        const translatedHints = translatedHintsV170(puzzle, lang);
        done += Math.min(sourceHints.length, translatedHints.length);
        if (translatedHints.length < sourceHints.length) missing.push(label + ": indices");
      }
    });
    return { total, done, percent: total ? Math.round((done / total) * 100) : 100, missing };
  }

  function totalCoverageV170(route) {
    const items = langs.map(function (lang) { return coverageForLangV170(route, lang.id); });
    const total = items.reduce(function (sum, item) { return sum + item.total; }, 0);
    const done = items.reduce(function (sum, item) { return sum + item.done; }, 0);
    return { total, done, percent: total ? Math.round((done / total) * 100) : 100 };
  }

  function fieldControlV170(scope, field, source, value) {
    const tag = field.type === "long" ? "textarea" : "input";
    const sourceText = source ? html(source) : "<span class=\"i18n-empty-v170\">Pas de texte FR source.</span>";
    const attr = "data-i18n-v170=\"" + scope + "\" data-i18n-field=\"" + field.key + "\"";
    const input = tag === "textarea"
      ? "<textarea " + attr + ">" + html(value) + "</textarea>"
      : "<input " + attr + " value=\"" + html(value) + "\" />";
    return "<article class=\"i18n-field-v170\"><div><strong>" + html(field.label) + "</strong><p>" + sourceText + "</p></div><label><span>Traduction</span>" + input + "</label></article>";
  }

  function textAreaBlockV170(kind, label, sourceLines, valueLines) {
    const source = sourceLines.length
      ? "<ol>" + sourceLines.map(function (line) { return "<li>" + html(line) + "</li>"; }).join("") + "</ol>"
      : "<p class=\"i18n-empty-v170\">Aucun contenu FR source.</p>";
    return "<article class=\"i18n-field-v170\"><div><strong>" + html(label) + "</strong>" + source + "</div><label><span>Une ligne par element</span><textarea data-i18n-special-v170=\"" + kind + "\">" + html(valueLines.join("\n")) + "</textarea></label></article>";
  }

  function ensurePanelV170() {
    const adminContent = document.querySelector("#admin-content");
    if (!adminContent) return null;
    let panel = document.querySelector("#admin-i18n-workspace-v170");
    if (!panel) {
      panel = document.createElement("section");
      panel.id = "admin-i18n-workspace-v170";
      panel.className = "admin-i18n-workspace-v170";
      const anchor = document.querySelector("#admin-robustness-panel-v167")
        || document.querySelector("#admin-growth-v143")
        || document.querySelector("#route-details-form")?.closest("section");
      if (anchor?.parentNode) anchor.insertAdjacentElement("afterend", panel);
      else adminContent.prepend(panel);
    }
    return panel;
  }

  function renderPanelV170(force) {
    const panel = ensurePanelV170();
    if (!panel) return;
    if (!force && panel.contains(document.activeElement)) return;
    const route = currentRouteV170();
    if (!route) {
      panel.innerHTML = "<p class=\"section-label\">Traductions parcours</p><p>Aucun parcours disponible.</p>";
      return;
    }
    const puzzle = currentPuzzleV170(route);
    const lang = langs.find(function (item) { return item.id === state.lang; }) || langs[0];
    state.lang = lang.id;
    const coverage = coverageForLangV170(route, lang.id);
    const total = totalCoverageV170(route);
    const key = [route.id, puzzle?.id || "", lang.id, coverage.done, coverage.total, total.done, total.total].join("|");
    if (!force && state.lastKey === key) return;
    state.lastKey = key;

    const routeOptions = routesV170().map(function (item) {
      return "<option value=\"" + html(item.id) + "\"" + (item.id === route.id ? " selected" : "") + ">" + html(item.title || item.id) + "</option>";
    }).join("");
    const puzzleOptions = (route.puzzles || []).map(function (item, index) {
      return "<option value=\"" + html(item.id) + "\"" + (item.id === puzzle?.id ? " selected" : "") + ">" + (index + 1) + ". " + html(item.title || item.id) + "</option>";
    }).join("");
    const langButtons = langs.map(function (item) {
      return "<button class=\"" + (item.id === lang.id ? "is-active" : "") + "\" type=\"button\" data-i18n-lang-v170=\"" + item.id + "\">" + item.short + "</button>";
    }).join("");
    const routeEditor = routeFields.map(function (field) {
      return fieldControlV170("route", field, sourceValueV170(route, field.key), langValueV170(route, lang.id, field.key));
    }).join("");
    const puzzleEditor = puzzle ? puzzleFields.map(function (field) {
      return fieldControlV170("puzzle", field, sourceValueV170(puzzle, field.key), langValueV170(puzzle, lang.id, field.key));
    }).join("") : "<p>Aucune enigme selectionnee.</p>";
    const hintsEditor = puzzle ? textAreaBlockV170("hints", "Indices", sourceHintsV170(puzzle), translatedHintsV170(puzzle, lang.id)) : "";
    const answersEditor = puzzle ? textAreaBlockV170("acceptedAnswers", "Reponses acceptees supplementaires", sourceAcceptedAnswersV170(puzzle), translatedAcceptedAnswersV170(puzzle, lang.id)) : "";
    const missing = coverage.missing.slice(0, 8);

    panel.innerHTML = [
      "<div class=\"i18n-head-v170\"><div><p class=\"section-label\">Traductions parcours</p><h3>Atelier FR / EN / NL</h3><p>Le francais reste la source. Les champs remplis ici sont utilises par les joueurs selon la langue choisie.</p></div><div class=\"i18n-actions-v170\"><button class=\"secondary-button compact-button\" type=\"button\" data-i18n-export-v170>Exporter modele</button><button class=\"primary-button compact-button\" type=\"button\" data-i18n-save-v170>Enregistrer traductions</button></div></div>",
      "<div class=\"i18n-toolbar-v170\"><label>Parcours<select data-i18n-route-select-v170>" + routeOptions + "</select></label><label>Enigme<select data-i18n-puzzle-select-v170>" + puzzleOptions + "</select></label><div class=\"i18n-lang-tabs-v170\" role=\"group\" aria-label=\"Langue traduction\">" + langButtons + "</div></div>",
      "<div class=\"i18n-metrics-v170\"><span><strong>" + coverage.percent + "%</strong>" + html(lang.label) + "</span><span><strong>" + total.percent + "%</strong>Total EN/NL</span><span><strong>" + coverage.done + "/" + coverage.total + "</strong>Champs remplis</span><span><strong>" + (route.puzzles?.length || 0) + "</strong>Enigmes</span></div>",
      missing.length ? "<div class=\"i18n-missing-v170\"><strong>Champs a completer</strong><ul><li>" + missing.map(html).join("</li><li>") + "</li></ul></div>" : "<div class=\"i18n-missing-v170 is-ok\"><strong>Couverture complete pour cette langue.</strong></div>",
      "<div class=\"i18n-editor-grid-v170\"><section><h4>Parcours</h4>" + routeEditor + "</section><section><h4>Enigme selectionnee</h4>" + puzzleEditor + hintsEditor + answersEditor + "</section></div>",
      "<p class=\"form-message\" data-i18n-message-v170>Astuce : ajoutez les variantes de reponse utiles, une par ligne, pour accepter les formulations naturelles en anglais et neerlandais.</p>",
    ].join("");
    bindPanelV170(panel);
  }

  function bindPanelV170(panel) {
    panel.querySelector("[data-i18n-route-select-v170]")?.addEventListener("change", function (event) {
      state.routeId = event.target.value;
      state.puzzleId = "";
      renderPanelV170(true);
    });
    panel.querySelector("[data-i18n-puzzle-select-v170]")?.addEventListener("change", function (event) {
      state.puzzleId = event.target.value;
      renderPanelV170(true);
    });
    panel.querySelectorAll("[data-i18n-lang-v170]").forEach(function (button) {
      button.addEventListener("click", function () {
        state.lang = button.dataset.i18nLangV170;
        renderPanelV170(true);
      });
    });
    panel.querySelector("[data-i18n-save-v170]")?.addEventListener("click", savePanelV170);
    panel.querySelector("[data-i18n-export-v170]")?.addEventListener("click", exportTemplateV170);
  }

  function savePanelV170() {
    const panel = document.querySelector("#admin-i18n-workspace-v170");
    const route = currentRouteV170();
    const puzzle = currentPuzzleV170(route);
    if (!panel || !route) return;
    panel.querySelectorAll("[data-i18n-v170='route']").forEach(function (field) {
      setLangValueV170(route, state.lang, field.dataset.i18nField, field.value);
    });
    if (puzzle) {
      panel.querySelectorAll("[data-i18n-v170='puzzle']").forEach(function (field) {
        setLangValueV170(puzzle, state.lang, field.dataset.i18nField, field.value);
      });
      const hints = panel.querySelector("[data-i18n-special-v170='hints']");
      const accepted = panel.querySelector("[data-i18n-special-v170='acceptedAnswers']");
      if (hints) setTextArrayV170(puzzle, state.lang, "hints", hints.value);
      if (accepted) setTextArrayV170(puzzle, state.lang, "acceptedAnswers", accepted.value);
    }
    if (typeof saveData === "function") saveData({ immediate: true });
    const message = panel.querySelector("[data-i18n-message-v170]");
    if (message) message.textContent = "Traductions enregistrees pour " + state.lang.toUpperCase() + ".";
    if (typeof showToast === "function") showToast("Traductions enregistrees.");
    renderPanelV170(true);
  }

  function exportTemplateV170() {
    const payload = {
      exportedAt: new Date().toISOString(),
      note: "Modele de traduction. Le francais est la source; remplissez en/nl dans i18n.",
      routes: routesV170().map(function (route) {
        return {
          id: route.id,
          source: {
            title: route.title || "",
            area: route.area || "",
            description: route.description || "",
            briefingText: route.briefingText || "",
            finishMessage: route.finishMessage || "",
          },
          i18n: route.i18n || {},
          puzzles: (route.puzzles || []).map(function (puzzle) {
            return {
              id: puzzle.id,
              source: {
                title: puzzle.title || "",
                place: puzzle.place || "",
                question: puzzle.question || "",
                arrivalMessage: puzzle.arrivalMessage || "",
                answer: puzzle.answer || "",
                hints: sourceHintsV170(puzzle),
              },
              i18n: puzzle.i18n || {},
            };
          }),
        };
      }),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2) + "\n"], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "traductions-parcours-escape-erezee.json";
    link.click();
    window.setTimeout(function () { URL.revokeObjectURL(url); }, 2000);
  }

  function isAdminVisibleV170() {
    return location.hash === "#admin" && !document.querySelector("#admin-content.is-hidden");
  }

  function tickV170(force) {
    if (!isAdminVisibleV170()) return;
    renderPanelV170(Boolean(force));
  }

  window.addEventListener("hashchange", function () { window.setTimeout(function () { tickV170(true); }, 350); });
  document.addEventListener("DOMContentLoaded", function () {
    window.setTimeout(function () { tickV170(true); }, 900);
    window.setInterval(function () { tickV170(false); }, 2500);
  });
  window.setTimeout(function () { tickV170(true); }, 900);
})();

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

/* admin-workspace-order-v172 */
(function initAdminWorkspaceOrderV172() {
  if (window.__adminWorkspaceOrderV172) return;
  window.__adminWorkspaceOrderV172 = true;

  const storageKey = "escape-admin-zone-v172";
  const state = {
    active: window.localStorage?.getItem(storageKey) || "overview",
    busy: false,
    observer: null,
    observerTimer: null,
  };

  const zones = [
    { id: "overview", label: "Vue d'ensemble", hint: "Etat, suivi du jour, sauvegardes et controles.", selectors: ["#admin-growth-v143", "#admin-robustness-panel-v167", "#admin-robustness-panel-v166", "#admin-ops-v138", "#admin-health-monitor-v136", "#admin-health-v136", "#admin-data-safety-panel"] },
    { id: "routes", label: "Parcours", hint: "Catalogue, fiche active et creation.", selectors: ['[aria-labelledby="routes-heading"]', '[aria-labelledby="route-details-heading"]', '[aria-labelledby="create-route-heading"]'] },
    { id: "puzzles", label: "Enigmes", hint: "Scenario, contenu, carte, indices et traductions.", selectors: ['[aria-labelledby="puzzles-heading"]', '[aria-labelledby="content-heading"]', '[aria-labelledby="create-puzzle-heading"]', '[aria-labelledby="geo-heading"]', '[aria-labelledby="hints-heading"]', "#admin-i18n-workspace-v170"] },
    { id: "players", label: "Equipes et codes", hint: "Progression, assistance et codes d'activation.", selectors: ['[aria-labelledby="teams-heading"]', '[aria-labelledby="codes-heading"]', "#admin-assistance-v145", "#admin-support-v145"] },
    { id: "commerce", label: "Commerce SEO", hint: "Avis, exports, contenus publics et visibilite.", selectors: ["#admin-public-settings-v145", "#admin-tools-v145", "#admin-growth-tools-v145", "#admin-seo-dashboard-v139", "#admin-seo-dashboard-v140", "#admin-seo-dashboard", "#admin-postdeploy-v141", "#admin-postdeploy-panel-v141"] },
    { id: "tools", label: "Outils", hint: "Images, sauvegardes et panneaux techniques.", selectors: ["#admin-backup-download-restore-v132", "#admin-backup-layout-v133", "#admin-scheduled-backups-v134", "#admin-image-health-v157", "#admin-image-bank-v159", "#admin-image-bank-v160"] },
  ];

  function esc(value) {
    return String(value == null ? "" : value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  function adminIsVisible() {
    const content = document.querySelector("#admin-content");
    return location.hash === "#admin" && content && !content.classList.contains("is-hidden");
  }

  function routesV172() {
    return Array.isArray(window.data?.routes) ? window.data.routes : (Array.isArray(data?.routes) ? data.routes : []);
  }

  function teamsV172() {
    return Array.isArray(window.data?.teams) ? window.data.teams : (Array.isArray(data?.teams) ? data.teams : []);
  }

  function codesV172() {
    return Array.isArray(window.data?.codes) ? window.data.codes : (Array.isArray(data?.codes) ? data.codes : []);
  }

  function activeRouteTitleV172(routes) {
    const route = typeof getActiveRoute === "function" ? getActiveRoute() : routes.find(function (item) { return item.id === data?.activeRouteId; });
    return route?.title || "Aucun parcours actif";
  }

  function metricHtml(label, value) {
    return '<article class="admin-workspace-metric-v172"><strong>' + esc(value) + '</strong><span>' + esc(label) + '</span></article>';
  }

  function updateSummary(shell) {
    const routes = routesV172();
    const teams = teamsV172();
    const codes = codesV172();
    const playing = teams.filter(function (team) { return team.status === "playing"; }).length;
    const availableCodes = codes.filter(function (code) { return code.status !== "used"; }).length;
    const finished = teams.filter(function (team) { return team.status === "won" || team.status === "lost"; }).length;
    const summary = shell.querySelector("[data-admin-summary-v172]");
    if (!summary) return;
    summary.innerHTML = [
      metricHtml("Parcours", routes.length),
      metricHtml("Equipe(s) en cours", playing),
      metricHtml("Codes disponibles", availableCodes),
      metricHtml("Parties terminees", finished),
      '<article class="admin-workspace-metric-v172 is-wide"><strong>' + esc(activeRouteTitleV172(routes)) + '</strong><span>Parcours actif</span></article>',
    ].join("");
  }

  function ensureShell() {
    const content = document.querySelector("#admin-content");
    if (!content) return null;
    let shell = document.querySelector("#admin-workspace-v172");
    if (!shell) {
      shell = document.createElement("section");
      shell.id = "admin-workspace-v172";
      shell.className = "admin-workspace-v172";
      shell.innerHTML = [
        '<div class="admin-workspace-head-v172">',
          '<div><p class="section-label">Poste de pilotage</p><h2>Gestion organisee</h2></div>',
          '<nav class="admin-workspace-tabs-v172" aria-label="Sections gestion">' + zones.map(function (zone) { return '<button type="button" data-admin-zone-tab-v172="' + zone.id + '">' + esc(zone.label) + '</button>'; }).join("") + '</nav>',
        '</div>',
        '<div class="admin-workspace-summary-v172" data-admin-summary-v172></div>',
        '<div class="admin-workspace-groups-v172" data-admin-groups-v172></div>',
      ].join("");
      const topbar = content.querySelector(".admin-topbar");
      if (topbar) topbar.insertAdjacentElement("afterend", shell);
      else content.prepend(shell);
      shell.querySelectorAll("[data-admin-zone-tab-v172]").forEach(function (button) {
        button.addEventListener("click", function () {
          state.active = button.dataset.adminZoneTabV172 || "overview";
          window.localStorage?.setItem(storageKey, state.active);
          applyActiveZone(shell);
          if (state.active === "puzzles") {
            window.setTimeout(function () { if (typeof renderAdmin === "function") renderAdmin(); }, 60);
          }
        });
      });
    }
    const groups = shell.querySelector("[data-admin-groups-v172]");
    zones.forEach(function (zone) {
      let group = shell.querySelector('[data-admin-zone-v172="' + zone.id + '"]');
      if (!group) {
        group = document.createElement("section");
        group.className = "admin-zone-v172";
        group.dataset.adminZoneV172 = zone.id;
        group.innerHTML = [
          '<header class="admin-zone-head-v172"><div><p class="section-label">' + esc(zone.label) + '</p><h3>' + esc(zone.hint) + '</h3></div></header>',
          '<div class="admin-zone-body-v172" data-admin-zone-body-v172="' + zone.id + '"></div>',
        ].join("");
        groups.appendChild(group);
      }
    });
    updateSummary(shell);
    return shell;
  }

  function moveNodeToZone(shell, node, zoneId) {
    if (!node || node.id === "admin-workspace-v172" || (node.closest("#admin-workspace-v172") === shell && node.matches(".admin-zone-v172, .admin-zone-v172 *"))) return false;
    const body = shell.querySelector('[data-admin-zone-body-v172="' + zoneId + '"]');
    if (!body || node.parentElement === body) return false;
    body.appendChild(node);
    node.dataset.adminZoneV172 = zoneId;
    return true;
  }

  function moveKnownPanels(shell) {
    zones.forEach(function (zone) {
      zone.selectors.forEach(function (selector) {
        document.querySelectorAll(selector).forEach(function (node) { moveNodeToZone(shell, node, zone.id); });
      });
    });
  }

  function moveLoosePanels(shell) {
    const content = document.querySelector("#admin-content");
    if (!content) return;
    document.querySelectorAll("#admin-content > section, #admin-content > .admin-grid > section").forEach(function (node) {
      if (node.id === "admin-workspace-v172" || node.dataset.adminZoneV172) return;
      moveNodeToZone(shell, node, "tools");
    });
    const grid = content.querySelector(".admin-grid");
    if (grid) grid.classList.toggle("is-empty-v172", !grid.querySelector("section, article, form, div"));
  }

  function applyActiveZone(shell) {
    if (!zones.some(function (zone) { return zone.id === state.active; })) state.active = "overview";
    shell.querySelectorAll("[data-admin-zone-tab-v172]").forEach(function (button) {
      const active = button.dataset.adminZoneTabV172 === state.active;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", active ? "true" : "false");
    });
    shell.querySelectorAll("[data-admin-zone-v172]").forEach(function (group) {
      group.classList.toggle("is-active", group.dataset.adminZoneV172 === state.active);
    });
  }

  function refreshWorkspace() {
    if (!adminIsVisible() || state.busy) return;
    state.busy = true;
    try {
      const shell = ensureShell();
      if (!shell) return;
      moveKnownPanels(shell);
      moveLoosePanels(shell);
      applyActiveZone(shell);
      document.querySelector("#admin-content")?.classList.add("admin-organized-v172");
    } finally {
      state.busy = false;
    }
  }

  function observeAdmin() {
    const content = document.querySelector("#admin-content");
    if (!content || state.observer) return;
    state.observer = new MutationObserver(function () {
      clearTimeout(state.observerTimer);
      state.observerTimer = window.setTimeout(refreshWorkspace, 80);
    });
    state.observer.observe(content, { childList: true, subtree: true });
  }

  const previousRenderAdminV172 = renderAdmin;
  renderAdmin = function renderAdminWithWorkspaceOrderV172() {
    const result = previousRenderAdminV172.apply(this, arguments);
    window.setTimeout(refreshWorkspace, 0);
    window.setTimeout(refreshWorkspace, 250);
    window.setTimeout(observeAdmin, 300);
    return result;
  };

  window.addEventListener("hashchange", function () { window.setTimeout(refreshWorkspace, 120); });
  window.setTimeout(refreshWorkspace, 300);
})();



/* ux-optimization-v173 */
(function initUxOptimizationV173() {
  if (window.__uxOptimizationV173) return;
  window.__uxOptimizationV173 = true;

  function esc(value) {
    if (typeof escapeHtml === "function") return escapeHtml(String(value ?? ""));
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function routeById(routeId) {
    if (typeof getRoute === "function") return getRoute(routeId);
    return (Array.isArray(data?.routes) ? data.routes : []).find(function (route) { return route.id === routeId; }) || null;
  }

  function routePrice(route) {
    if (typeof getRoutePrice === "function") return getRoutePrice(route);
    return Number(route?.pricePerPlayer || route?.price || 0) || 0;
  }

  function priceLabel(value) {
    if (typeof formatPrice === "function") return formatPrice(value);
    return String(value || 0) + " EUR";
  }

  function currentTeamSafe() {
    try {
      return typeof getCurrentTeam === "function" ? getCurrentTeam() : null;
    } catch {
      return null;
    }
  }

  function currentRouteSafe(team) {
    try {
      return team && typeof getRoute === "function" ? getRoute(team.routeId) : null;
    } catch {
      return null;
    }
  }

  function currentPuzzleSafe(team, route) {
    try {
      return team && route && typeof getCurrentPuzzle === "function" ? getCurrentPuzzle(team, route) : null;
    } catch {
      return null;
    }
  }

  function progressSafe(team, route) {
    try {
      return team && route && typeof getTeamProgress === "function"
        ? getTeamProgress(team, route)
        : { solved: 0, total: route?.puzzles?.length || 0, percent: 0 };
    } catch {
      return { solved: 0, total: route?.puzzles?.length || 0, percent: 0 };
    }
  }

  function ensureShopGuide() {
    const shopPanel = document.querySelector(".shop-panel");
    if (!shopPanel || document.querySelector("#ux-shop-guide-v173")) return;
    const guide = document.createElement("section");
    guide.id = "ux-shop-guide-v173";
    guide.className = "ux-shop-guide-v173";
    guide.setAttribute("aria-label", "Comment reserver");
    guide.innerHTML = [
      '<div class="ux-guide-title-v173">',
        '<p class="section-label">Reservation simple</p>',
        '<h2>Choisissez, payez, jouez</h2>',
      '</div>',
      '<ol class="ux-guide-steps-v173">',
        '<li><strong>1</strong><span>Choisissez un parcours</span></li>',
        '<li><strong>2</strong><span>Paiement securise</span></li>',
        '<li><strong>3</strong><span>Code recu par email</span></li>',
        '<li><strong>4</strong><span>Depart verifie par GPS</span></li>',
      '</ol>',
    ].join("");
    shopPanel.insertAdjacentElement("beforebegin", guide);
  }

  function enhanceShopCards() {
    ensureShopGuide();
    document.querySelectorAll(".shop-route-card").forEach(function (card) {
      const form = card.querySelector("[data-shop-route]");
      const route = routeById(form?.dataset?.shopRoute || "");
      if (!route) return;

      card.dataset.uxReadyV173 = "1";
      const copy = card.querySelector(".shop-route-copy");
      if (copy && !copy.querySelector(".ux-route-highlights-v173")) {
        const duration = Number(route.duration || 90);
        const puzzleCount = route.puzzles?.length || 0;
        const tone = duration <= 75 ? "Ideal pour debuter" : puzzleCount >= 15 ? "Aventure complete" : "Balade ludique";
        const distance = route.distance ? esc(route.distance) : "parcours exterieur";
        copy.insertAdjacentHTML("beforeend", [
          '<div class="ux-route-highlights-v173">',
            '<span>' + esc(tone) + '</span>',
            '<span>' + esc(distance) + '</span>',
            '<span>Code email inclus</span>',
          '</div>',
        ].join(""));
      }

      if (form && !form.querySelector(".ux-buy-summary-v173")) {
        const price = priceLabel(routePrice(route));
        form.insertAdjacentHTML("afterbegin", [
          '<div class="ux-buy-summary-v173">',
            '<strong>' + esc(price) + ' / equipe</strong>',
            '<span>Total selon le nombre d\'equipes</span>',
          '</div>',
        ].join(""));
      }

      const button = form?.querySelector("button[type='submit']");
      if (button && !button.dataset.uxTextV173) {
        button.dataset.uxTextV173 = "1";
        button.textContent = "Reserver ce parcours";
      }

      const message = form?.querySelector(".form-message");
      if (message) {
        message.setAttribute("aria-live", "polite");
        message.setAttribute("aria-atomic", "true");
      }
    });
  }

  function enhanceCodeEntry() {
    const loginPanel = document.querySelector("#login-panel");
    const form = document.querySelector("#activation-form");
    if (!loginPanel || !form) return;

    if (!loginPanel.querySelector(".ux-code-helper-v173")) {
      form.insertAdjacentHTML("beforebegin", [
        '<div class="ux-code-helper-v173">',
          '<span>Vous avez deja achete ?</span>',
          '<strong>Entrez le code recu par email.</strong>',
          '<a href="#shop">Voir les parcours</a>',
        '</div>',
      ].join(""));
    }

    const input = document.querySelector("#activation-code");
    if (input && !input.dataset.uxBoundV173) {
      input.dataset.uxBoundV173 = "1";
      input.setAttribute("spellcheck", "false");
      input.addEventListener("input", function () {
        const clean = input.value.toUpperCase().replace(/\s+/g, "-").replace(/[^A-Z0-9-]/g, "").replace(/-+/g, "-");
        if (input.value !== clean) input.value = clean;
      });
    }

    const message = document.querySelector("#activation-message");
    if (message) {
      message.setAttribute("aria-live", "polite");
      message.setAttribute("aria-atomic", "true");
    }
  }

  function ensurePlayerStepper() {
    const phoneStatus = document.querySelector(".phone-status");
    if (!phoneStatus || document.querySelector("#ux-player-stepper-v173")) return null;
    const stepper = document.createElement("nav");
    stepper.id = "ux-player-stepper-v173";
    stepper.className = "ux-player-stepper-v173";
    stepper.setAttribute("aria-label", "Progression de l'aventure");
    stepper.innerHTML = [
      '<span data-ux-step-v173="code">Code</span>',
      '<span data-ux-step-v173="briefing">Briefing</span>',
      '<span data-ux-step-v173="puzzles">Enigmes</span>',
      '<span data-ux-step-v173="finish">Resultat</span>',
    ].join("");
    phoneStatus.insertAdjacentElement("afterend", stepper);
    return stepper;
  }

  function ensureNextAction() {
    const progressBlock = document.querySelector(".progress-block");
    if (!progressBlock) return null;
    let action = document.querySelector("#ux-next-action-v173");
    if (!action) {
      action = document.createElement("div");
      action.id = "ux-next-action-v173";
      action.className = "ux-next-action-v173";
      action.setAttribute("aria-live", "polite");
      action.innerHTML = '<span>Prochaine action</span><strong></strong>';
      progressBlock.insertAdjacentElement("afterend", action);
    }
    return action;
  }

  function enhancePlayer() {
    enhanceCodeEntry();
    const team = currentTeamSafe();
    const route = currentRouteSafe(team);
    const puzzle = currentPuzzleSafe(team, route);
    const progress = progressSafe(team, route);
    const finished = team?.status === "won" || team?.status === "lost";
    const unlocked = puzzle && (!puzzle.requireLocation || team?.unlockedPuzzleIds?.includes(puzzle.id));

    const stepper = ensurePlayerStepper();
    if (stepper) {
      const active = !team ? "code" : finished ? "finish" : progress.solved ? "puzzles" : "briefing";
      stepper.querySelectorAll("[data-ux-step-v173]").forEach(function (node) {
        const key = node.dataset.uxStepV173;
        node.classList.toggle("is-active", key === active);
        node.classList.toggle("is-done", ["code", "briefing", "puzzles"].indexOf(key) < ["code", "briefing", "puzzles", "finish"].indexOf(active));
      });
    }

    const action = ensureNextAction();
    if (action) {
      let label = "Entrez votre code pour ouvrir l'aventure.";
      let tone = "info";
      if (finished) {
        label = team.status === "won" ? "Consultez le classement et laissez un avis." : "La partie est terminee.";
        tone = team.status === "won" ? "ok" : "warn";
      } else if (puzzle && !unlocked) {
        label = "Rendez-vous dans la zone indiquee pour debloquer l'enigme.";
        tone = "gps";
      } else if (puzzle?.type === "photo") {
        label = "Prenez la photo demandee, puis envoyez-la.";
        tone = "photo";
      } else if (puzzle) {
        label = "Lisez l'enigme, observez autour de vous, puis validez la reponse.";
        tone = "answer";
      }
      action.dataset.tone = tone;
      const strong = action.querySelector("strong");
      if (strong) strong.textContent = label;
    }

    document.querySelectorAll("#answer-message, #distance-note, #hint-state").forEach(function (node) {
      node.setAttribute("aria-live", "polite");
      node.setAttribute("aria-atomic", "true");
    });
  }

  function enhanceAdmin() {
    const workspace = document.querySelector("#admin-workspace-v172");
    if (!workspace) return;
    let panel = workspace.querySelector(".ux-admin-helper-v173");
    if (!panel) {
      panel = document.createElement("div");
      panel.className = "ux-admin-helper-v173";
      panel.innerHTML = [
        '<div class="ux-admin-search-v173">',
          '<label for="ux-admin-search-input-v173">Recherche rapide</label>',
          '<input id="ux-admin-search-input-v173" type="search" placeholder="Code, equipe, client ou parcours" autocomplete="off" />',
          '<span data-ux-admin-search-result-v173>Affiche tout</span>',
        '</div>',
        '<div class="ux-admin-shortcuts-v173" aria-label="Raccourcis gestion">',
          '<button type="button" data-ux-admin-zone-v173="players">Equipes et codes</button>',
          '<button type="button" data-ux-admin-zone-v173="puzzles">Enigmes</button>',
          '<button type="button" data-ux-admin-zone-v173="routes">Parcours</button>',
          '<button type="button" data-ux-admin-zone-v173="overview">Sauvegardes</button>',
        '</div>',
        '<div class="ux-admin-routine-v173">',
          '<strong>Routine conseillee</strong>',
          '<span>Sauvegarde avant gros changement</span>',
          '<span>Verifier les equipes en cours</span>',
          '<span>Copier le code avant assistance</span>',
        '</div>',
      ].join("");
      const head = workspace.querySelector(".admin-workspace-head-v172");
      if (head) head.insertAdjacentElement("afterend", panel);
      else workspace.prepend(panel);

      panel.querySelector("[data-ux-admin-zone-v173]")?.closest(".ux-admin-shortcuts-v173")?.addEventListener("click", function (event) {
        const button = event.target.closest("[data-ux-admin-zone-v173]");
        if (!button) return;
        const zone = button.dataset.uxAdminZoneV173;
        const tab = workspace.querySelector('[data-admin-zone-tab-v172="' + zone + '"]');
        if (tab) tab.click();
      });

      panel.querySelector("#ux-admin-search-input-v173")?.addEventListener("input", function () {
        applyAdminSearch(panel);
      });
    }
    applyAdminSearch(panel);
  }

  function applyAdminSearch(panel) {
    const input = panel?.querySelector("#ux-admin-search-input-v173");
    const output = panel?.querySelector("[data-ux-admin-search-result-v173]");
    if (!input) return;
    const query = input.value.trim().toLowerCase();
    const rows = [
      ...document.querySelectorAll("#team-table tr"),
      ...document.querySelectorAll(".code-row"),
    ];
    let visible = 0;
    let searchable = 0;
    rows.forEach(function (row) {
      const empty = row.textContent.includes("Aucune equipe") || row.textContent.includes("Aucune");
      if (empty) return;
      searchable += 1;
      const match = !query || row.textContent.toLowerCase().includes(query);
      row.classList.toggle("ux-admin-filtered-v173", !match);
      if (match) visible += 1;
    });
    if (output) {
      output.textContent = query
        ? visible + " resultat(s) sur " + searchable
        : "Affiche tout";
    }
  }

  function applyUx() {
    if (location.hash === "#player") {
      enhancePlayer();
      return;
    }
    if (location.hash === "#admin") {
      enhanceAdmin();
      return;
    }
    enhanceShopCards();
  }

  if (typeof renderShop === "function" && !renderShop.__uxWrappedV173) {
    const previousRenderShopV173 = renderShop;
    renderShop = function renderShopUxV173() {
      const result = previousRenderShopV173.apply(this, arguments);
      window.setTimeout(enhanceShopCards, 0);
      return result;
    };
    renderShop.__uxWrappedV173 = true;
  }

  if (typeof renderPlayer === "function" && !renderPlayer.__uxWrappedV173) {
    const previousRenderPlayerV173 = renderPlayer;
    renderPlayer = function renderPlayerUxV173() {
      const result = previousRenderPlayerV173.apply(this, arguments);
      window.setTimeout(enhancePlayer, 0);
      return result;
    };
    renderPlayer.__uxWrappedV173 = true;
  }

  if (typeof renderAdmin === "function" && !renderAdmin.__uxWrappedV173) {
    const previousRenderAdminV173 = renderAdmin;
    renderAdmin = function renderAdminUxV173() {
      const result = previousRenderAdminV173.apply(this, arguments);
      window.setTimeout(enhanceAdmin, 0);
      return result;
    };
    renderAdmin.__uxWrappedV173 = true;
  }

  document.addEventListener("DOMContentLoaded", function () {
    window.setTimeout(applyUx, 700);
    window.setInterval(applyUx, 3500);
  });
  window.addEventListener("hashchange", function () { window.setTimeout(applyUx, 300); });
  window.setTimeout(applyUx, 700);
})();


/* team-price-layout-v174 */
(function initTeamPriceLayoutV174() {
  if (window.__teamPriceLayoutV174) return;
  window.__teamPriceLayoutV174 = true;

  function applyTeamPriceLabels() {
    if (location.hash === "#player") return;
    document.querySelectorAll(".shop-route-card").forEach(function (card) {
      card.querySelectorAll(".metric").forEach(function (metric) {
        metric.textContent = metric.textContent.replace(new RegExp("/ personne|/ pers\\.", "gi"), "/ equipe");
      });

      const playersLabel = card.querySelector(".shop-buy-form label");
      if (playersLabel) {
        const input = playersLabel.querySelector("input");
        playersLabel.childNodes.forEach(function (node) {
          if (node.nodeType === Node.TEXT_NODE && node.textContent.trim()) {
            node.textContent = "Nombre d'equipes ";
          }
        });
        if (input) {
          input.setAttribute("aria-label", "Nombre d'equipes");
        }
      }

      const form = card.querySelector("[data-shop-route]");
      const routeId = form?.dataset?.shopRoute || "";
      const route = typeof getRoute === "function" ? getRoute(routeId) : null;
      const total = route && card.querySelector("[data-shop-total]");
      if (route && total && typeof getRoutePrice === "function" && typeof formatPrice === "function") {
        const countInput = card.querySelector("[data-shop-player-count]");
        const teamCount = Math.min(20, Math.max(1, Number(countInput?.value) || 1));
        total.textContent = formatPrice(getRoutePrice(route) * teamCount);
      }

      const summaryStrong = card.querySelector(".ux-buy-summary-v173 strong");
      if (summaryStrong) summaryStrong.textContent = summaryStrong.textContent.replace(new RegExp("/ personne", "gi"), "/ equipe");
      const summaryNote = card.querySelector(".ux-buy-summary-v173 span");
      if (summaryNote) summaryNote.textContent = "Total selon le nombre d'equipes";
    });

    document.querySelectorAll(".route-card .metric").forEach(function (metric) {
      metric.textContent = metric.textContent.replace(new RegExp("/ pers\\.|/ personne", "gi"), "/ equipe");
    });

    document.querySelectorAll("label").forEach(function (label) {
      label.childNodes.forEach(function (node) {
        if (node.nodeType === Node.TEXT_NODE && /Prix par personne/i.test(node.textContent)) {
          node.textContent = node.textContent.replace(/Prix par personne/i, "Prix par equipe");
        }
      });
    });
  }

  if (typeof updateShopTotal === "function" && !updateShopTotal.__teamPriceV174) {
    const previousUpdateShopTotalV174 = updateShopTotal;
    updateShopTotal = function updateShopTotalTeamPriceV174(event) {
      previousUpdateShopTotalV174.apply(this, arguments);
      const routeId = event?.currentTarget?.dataset?.shopPlayerCount;
      const route = routeId && typeof getRoute === "function" ? getRoute(routeId) : null;
      const total = routeId && document.querySelector('[data-shop-total="' + routeId + '"]');
      if (route && total && typeof getRoutePrice === "function" && typeof formatPrice === "function") {
        const teamCount = Math.min(20, Math.max(1, Number(event?.currentTarget?.value) || 1));
        total.textContent = formatPrice(getRoutePrice(route) * teamCount);
      }
      applyTeamPriceLabels();
    };
    updateShopTotal.__teamPriceV174 = true;
  }

  function run() {
    applyTeamPriceLabels();
    window.setTimeout(applyTeamPriceLabels, 500);
  }

  document.addEventListener("DOMContentLoaded", run);
  window.addEventListener("hashchange", function () { window.setTimeout(run, 250); });
  window.setInterval(applyTeamPriceLabels, 3000);
  run();
})();


/* stripe-multi-team-codes-v178 */
window.__stripeMultiTeamCodesV178 = true;


/* stripe-team-count-v180 */
window.__stripeTeamCountV180 = true;


/* player-first-steps-v192 */
(function initPlayerFirstStepsV192() {
  if (window.__playerFirstStepsV192) return;
  window.__playerFirstStepsV192 = true;

  let helpRequested = false;
  let firstGuideDismissed = false;
  let activeTeamId = "";

  function language() {
    return typeof playerLangV151 === "function" ? playerLangV151() : "fr";
  }

  function labels() {
    const values = {
      fr: {
        code: "Code",
        briefing: "Départ",
        puzzles: "Énigmes",
        finish: "Résultat",
        briefingKicker: "Avant de lancer le chrono",
        briefingTitle: "Trois actions, dans cet ordre",
        briefingSteps: [
          "Rejoignez le point de départ indiqué sur la carte.",
          "Appuyez sur « Vérifier ma position » et acceptez les autorisations demandées.",
          "Quand la position est validée en vert, lancez l'aventure.",
        ],
        locate: "1. Vérifier ma position",
        refresh: "1. Actualiser ma position",
        start: "2. Commencer l'aventure",
        startHint: "Le bouton de départ s'active seulement lorsque votre équipe est dans la zone.",
        help: "Comment jouer ?",
        gameKicker: "Première étape",
        gameTitle: "Laissez l'application vous guider",
        gameSteps: [
          "Activez le mode guidage ci-dessous.",
          "Marchez vers le point jaune en restant sur les chemins autorisés.",
          "Dans la zone, l'énigme se déverrouille automatiquement : observez les lieux et répondez.",
        ],
        guide: "Me guider vers l'étape",
        read: "Voir l'énigme",
        hide: "J'ai compris",
        nextBriefing: "Rejoignez le départ, puis vérifiez votre position GPS.",
        nextLocked: "Activez le guidage et rejoignez le point jaune.",
        nextUnlocked: "Lisez l'énigme, observez autour de vous et validez votre réponse.",
      },
      en: {
        code: "Code",
        briefing: "Start",
        puzzles: "Puzzles",
        finish: "Result",
        briefingKicker: "Before starting the timer",
        briefingTitle: "Three actions, in this order",
        briefingSteps: [
          "Go to the starting point shown on the map.",
          "Tap “Check my position” and allow the requested permissions.",
          "When your position turns green, start the adventure.",
        ],
        locate: "1. Check my position",
        refresh: "1. Refresh my position",
        start: "2. Start the adventure",
        startHint: "The start button is enabled only when your team is inside the starting area.",
        help: "How to play",
        gameKicker: "First step",
        gameTitle: "Let the app guide you",
        gameSteps: [
          "Turn on guidance mode below.",
          "Walk towards the yellow point and stay on authorised paths.",
          "Inside the area, the puzzle unlocks automatically: observe your surroundings and answer.",
        ],
        guide: "Guide me to the step",
        read: "View the puzzle",
        hide: "Got it",
        nextBriefing: "Reach the start, then check your GPS position.",
        nextLocked: "Turn on guidance and reach the yellow point.",
        nextUnlocked: "Read the puzzle, look around you and submit your answer.",
      },
      nl: {
        code: "Code",
        briefing: "Start",
        puzzles: "Raadsels",
        finish: "Resultaat",
        briefingKicker: "Voor de timer start",
        briefingTitle: "Drie acties, in deze volgorde",
        briefingSteps: [
          "Ga naar het startpunt dat op de kaart staat.",
          "Tik op ‘Mijn positie controleren’ en sta de gevraagde machtigingen toe.",
          "Wanneer je positie groen wordt, start je het avontuur.",
        ],
        locate: "1. Mijn positie controleren",
        refresh: "1. Mijn positie vernieuwen",
        start: "2. Het avontuur starten",
        startHint: "De startknop wordt pas actief wanneer je team in de startzone is.",
        help: "Hoe speel je?",
        gameKicker: "Eerste stap",
        gameTitle: "Laat de app je begeleiden",
        gameSteps: [
          "Schakel hieronder de begeleidingsmodus in.",
          "Loop naar de gele stip en blijf op de toegestane paden.",
          "In de zone wordt het raadsel automatisch ontgrendeld: kijk om je heen en antwoord.",
        ],
        guide: "Begeleid mij naar de stap",
        read: "Bekijk het raadsel",
        hide: "Begrepen",
        nextBriefing: "Ga naar de start en controleer daarna je gps-positie.",
        nextLocked: "Schakel de begeleiding in en bereik de gele stip.",
        nextUnlocked: "Lees het raadsel, kijk om je heen en verstuur je antwoord.",
      },
    };
    return values[language()] || values.fr;
  }

  function currentContext() {
    const team = typeof getCurrentTeam === "function" ? getCurrentTeam() : null;
    const route = team && typeof getRoute === "function" ? getRoute(team.routeId) : null;
    const puzzle = team && route && typeof getCurrentPuzzle === "function" ? getCurrentPuzzle(team, route) : null;
    const progress = team && route && typeof getTeamProgress === "function"
      ? getTeamProgress(team, route)
      : { solved: 0, total: route?.puzzles?.length || 0 };
    return { team, route, puzzle, progress };
  }

  function numberedSteps(items) {
    return '<ol>' + items.map(function (item, index) {
      return '<li><b>' + (index + 1) + '</b><span>' + escapeHtml(item) + '</span></li>';
    }).join("") + '</ol>';
  }

  function ensureBriefingGuide(copy) {
    const briefing = document.querySelector("#briefing-panel");
    if (!briefing) return;
    let guide = briefing.querySelector("#player-briefing-guide-v192");
    if (!guide) {
      guide = document.createElement("section");
      guide.id = "player-briefing-guide-v192";
      guide.className = "player-first-steps-v192 player-briefing-guide-v192";
      const briefingText = briefing.querySelector("#briefing-text");
      briefingText?.insertAdjacentElement("afterend", guide);
    }
    guide.innerHTML = '<p>' + escapeHtml(copy.briefingKicker) + '</p><h3>' + escapeHtml(copy.briefingTitle) + '</h3>' + numberedSteps(copy.briefingSteps);
  }

  function ensureBriefingHint(copy) {
    const startButton = document.querySelector("#start-adventure-button");
    if (!startButton) return;
    let hint = document.querySelector("#player-start-hint-v192");
    if (!hint) {
      hint = document.createElement("p");
      hint.id = "player-start-hint-v192";
      hint.className = "player-start-hint-v192";
      startButton.insertAdjacentElement("beforebegin", hint);
    }
    hint.textContent = copy.startHint;
  }

  function ensureHelpButton(copy, context) {
    const stepper = document.querySelector("#ux-player-stepper-v173");
    if (!stepper) return;
    let button = document.querySelector("#player-help-button-v192");
    if (!button) {
      button = document.createElement("button");
      button.id = "player-help-button-v192";
      button.className = "player-help-button-v192";
      button.type = "button";
      button.addEventListener("click", function () {
        helpRequested = true;
        update();
        document.querySelector("#player-game-guide-v192")?.scrollIntoView({ behavior: "smooth", block: "center" });
      });
      stepper.insertAdjacentElement("afterend", button);
    }
    button.textContent = copy.help;
    button.hidden = context.team?.status !== "playing";
  }

  function ensureGameGuide(copy, context) {
    const mapPanel = document.querySelector("#player-map")?.closest(".map-panel");
    if (!mapPanel) return;
    let guide = document.querySelector("#player-game-guide-v192");
    if (!guide) {
      guide = document.createElement("section");
      guide.id = "player-game-guide-v192";
      guide.className = "player-first-steps-v192 player-game-guide-v192";
      mapPanel.insertAdjacentElement("beforebegin", guide);
      guide.addEventListener("click", function (event) {
        const action = event.target.closest("[data-player-guide-action-v192]");
        if (!action) return;
        if (action.dataset.playerGuideActionV192 === "guide") {
          enterPlayerNavigationV183();
        } else if (action.dataset.playerGuideActionV192 === "read") {
          document.querySelector("#riddle-card")?.scrollIntoView({ behavior: "smooth", block: "start" });
        } else {
          helpRequested = false;
          firstGuideDismissed = true;
          guide.classList.add("is-hidden");
        }
      });
    }

    const isPlaying = context.team?.status === "playing";
    const isFirstPuzzle = isPlaying && Number(context.progress?.solved || 0) === 0;
    const shouldShow = isPlaying && (helpRequested || (isFirstPuzzle && !firstGuideDismissed));
    guide.classList.toggle("is-hidden", !shouldShow);
    if (!isPlaying) return;

    const unlocked = context.puzzle && (!context.puzzle.requireLocation || context.team?.unlockedPuzzleIds?.includes(context.puzzle.id));
    const action = unlocked ? "read" : "guide";
    const actionLabel = unlocked ? copy.read : copy.guide;
    guide.innerHTML = [
      '<p>' + escapeHtml(copy.gameKicker) + '</p>',
      '<h3>' + escapeHtml(copy.gameTitle) + '</h3>',
      numberedSteps(copy.gameSteps),
      '<div class="player-first-steps-actions-v192">',
        '<button class="primary-button" type="button" data-player-guide-action-v192="' + action + '">' + escapeHtml(actionLabel) + '</button>',
        '<button class="secondary-button" type="button" data-player-guide-action-v192="hide">' + escapeHtml(copy.hide) + '</button>',
      '</div>',
    ].join("");
  }

  function updateStepper(copy, context) {
    const stepper = document.querySelector("#ux-player-stepper-v173");
    if (!stepper) return;
    const order = ["code", "briefing", "puzzles", "finish"];
    const active = !context.team
      ? "code"
      : context.team.status === "briefing"
        ? "briefing"
        : context.team.status === "won" || context.team.status === "lost"
          ? "finish"
          : "puzzles";
    const names = { code: copy.code, briefing: copy.briefing, puzzles: copy.puzzles, finish: copy.finish };
    stepper.querySelectorAll("[data-ux-step-v173]").forEach(function (node) {
      const key = node.dataset.uxStepV173;
      node.textContent = names[key] || key;
      node.classList.toggle("is-active", key === active);
      node.classList.toggle("is-done", order.indexOf(key) < order.indexOf(active));
    });
  }

  function updateNextAction(copy, context) {
    const action = document.querySelector("#ux-next-action-v173");
    const strong = action?.querySelector("strong");
    if (!action || !strong || !context.team) return;
    action.classList.toggle("is-hidden-v192", context.team.status === "briefing");
    if (context.team.status === "briefing") {
      action.dataset.tone = "gps";
      strong.textContent = copy.nextBriefing;
      return;
    }
    if (context.team.status !== "playing" || !context.puzzle) return;
    const unlocked = !context.puzzle.requireLocation || context.team.unlockedPuzzleIds?.includes(context.puzzle.id);
    action.dataset.tone = unlocked ? "answer" : "gps";
    strong.textContent = unlocked ? copy.nextUnlocked : copy.nextLocked;
  }

  function update() {
    if (location.hash !== "#player") return;
    const copy = labels();
    const context = currentContext();
    if ((context.team?.id || "") !== activeTeamId) {
      activeTeamId = context.team?.id || "";
      helpRequested = false;
      firstGuideDismissed = false;
    }
    const input = document.querySelector("#activation-code");
    if (input) {
      input.autocapitalize = "characters";
      input.enterKeyHint = "go";
    }
    ensureBriefingGuide(copy);
    ensureBriefingHint(copy);
    ensureHelpButton(copy, context);
    ensureGameGuide(copy, context);
    updateStepper(copy, context);
    updateNextAction(copy, context);

    if (context.team?.status === "briefing") {
      document.querySelector("#start-point-card")?.classList.add("is-hidden");
    }

    const locateButton = document.querySelector("#briefing-locate-button");
    const startButton = document.querySelector("#start-adventure-button");
    if (locateButton && context.team?.status === "briefing") {
      locateButton.textContent = context.team?.briefingStartLocation ? copy.refresh : copy.locate;
    }
    if (startButton) startButton.textContent = copy.start;
  }

  if (typeof renderPlayer === "function" && !renderPlayer.__firstStepsV192) {
    const previousRenderPlayerV192 = renderPlayer;
    renderPlayer = function renderPlayerFirstStepsV192() {
      const result = previousRenderPlayerV192.apply(this, arguments);
      update();
      window.setTimeout(update, 0);
      return result;
    };
    renderPlayer.__firstStepsV192 = true;
  }

  if (typeof updateBriefingLocationUi === "function" && !updateBriefingLocationUi.__firstStepsV192) {
    const previousBriefingLocationUiV192 = updateBriefingLocationUi;
    updateBriefingLocationUi = function updateBriefingLocationUiFirstStepsV192() {
      const result = previousBriefingLocationUiV192.apply(this, arguments);
      window.setTimeout(update, 0);
      return result;
    };
    updateBriefingLocationUi.__firstStepsV192 = true;
  }

  document.addEventListener("DOMContentLoaded", function () { window.setTimeout(update, 300); });
  window.addEventListener("hashchange", function () { window.setTimeout(update, 100); });
  window.setTimeout(update, 300);
})();
