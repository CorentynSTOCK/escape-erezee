const STORAGE_KEY = "escape-erezee-data-v1";
const SESSION_KEY = "escape-erezee-team";
const ACTIVE_ROUTE_KEY = "escape-erezee-active-route";
const API_DATA_URL = "/api/data";

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => Array.from(document.querySelectorAll(selector));

const els = {
  views: {
    player: $("#player-view"),
    admin: $("#admin-view"),
  },
  navLinks: $$(".nav-link"),
  toast: $("#toast"),
  loginPanel: $("#login-panel"),
  gamePanel: $("#game-panel"),
  activationForm: $("#activation-form"),
  activationCode: $("#activation-code"),
  activationMessage: $("#activation-message"),
  resetSessionButton: $("#reset-session-button"),
  teamName: $("#team-name"),
  editTeamButton: $("#edit-team-button"),
  teamNameForm: $("#team-name-form"),
  teamNameInput: $("#team-name-input"),
  countdown: $("#countdown"),
  routeArea: $("#route-area"),
  routeTitle: $("#route-title"),
  gameStatus: $("#game-status"),
  progressText: $("#progress-text"),
  elapsedTime: $("#elapsed-time"),
  progressFill: $("#progress-fill"),
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
  seedButton: $("#seed-button"),
  generateCodeButton: $("#generate-code-button"),
  routeList: $("#route-list"),
  routeCount: $("#route-count"),
  routeForm: $("#route-form"),
  routeDetailsForm: $("#route-details-form"),
  routeDetailsTitleInput: $("#route-details-title"),
  routeDetailsAreaInput: $("#route-details-area"),
  routeDetailsDurationInput: $("#route-details-duration"),
  routeDetailsDescriptionInput: $("#route-details-description"),
  routeDetailsMessage: $("#route-details-message"),
  routeSelect: $("#route-select"),
  puzzleList: $("#puzzle-list"),
  puzzleForm: $("#puzzle-form"),
  puzzleContentForm: $("#puzzle-content-form"),
  contentPuzzleSelect: $("#content-puzzle-select"),
  contentTitleInput: $("#content-title"),
  contentPlaceInput: $("#content-place"),
  contentQuestionInput: $("#content-question"),
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
  codeList: $("#code-list"),
  imageViewer: $("#image-viewer"),
  imageViewerTitle: $("#image-viewer-title"),
  imageViewerImage: $("#image-viewer-img"),
  imageViewerCloseButton: $("#image-viewer-close"),
  imageZoomOutButton: $("#image-zoom-out"),
  imageZoomResetButton: $("#image-zoom-reset"),
  imageZoomInButton: $("#image-zoom-in"),
};

const TILE_SIZE = 256;
const MAP_ZOOM = 16;
const DEFAULT_CENTER = { lat: 50.29225, lng: 5.55995 };

let selectedGeoPuzzleId = null;
let selectedHintPuzzleId = null;
let selectedContentPuzzleId = null;

let data = loadData();
let toastTimer = null;
let ticker = null;
let imageViewerZoom = 1;
let serverSyncEnabled = false;
let serverSaveTimer = null;
let serverSaveInFlight = false;
let serverSavePending = false;
let serverSyncNoticeShown = false;

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
        description:
          "Un parcours familial entre traces du tramway vicinal, rivière et coeur du village.",
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

function loadData() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {
    localStorage.removeItem(STORAGE_KEY);
  }
  const seed = createSeedData();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
  return seed;
}

function saveData(options = {}) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
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

async function syncDataFromServer() {
  if (!canUseBackend()) return;

  try {
    const response = await fetch(API_DATA_URL, {
      headers: { Accept: "application/json" },
      cache: "no-store",
    });

    serverSyncEnabled = true;

    if (response.status === 404) {
      saveData({ immediate: true });
      showServerSyncNotice("Backend initialisé avec les données de cette machine.");
      return;
    }

    if (!response.ok) {
      throw new Error("Le backend n’a pas répondu correctement.");
    }

    const serverData = await response.json();
    if (!isValidAppData(serverData)) {
      throw new Error("Les données serveur ne sont pas lisibles.");
    }

    data = serverData;
    saveData({ sync: false });
    render();
    showServerSyncNotice("Données chargées depuis le backend.");
  } catch (error) {
    serverSyncEnabled = false;
    console.warn(error);
    showServerSyncNotice("Mode local actif. Le backend sera utilisé dès qu’il sera disponible.");
  }
}

function showServerSyncNotice(message) {
  if (serverSyncNoticeShown) return;
  serverSyncNoticeShown = true;
  showToast(message);
}

function scheduleServerSave(immediate = false) {
  if (!serverSyncEnabled || !canUseBackend()) return;
  clearTimeout(serverSaveTimer);
  if (immediate) {
    persistDataToServer();
    return;
  }
  serverSaveTimer = setTimeout(persistDataToServer, 350);
}

async function persistDataToServer() {
  if (!serverSyncEnabled || !canUseBackend()) return;
  if (serverSaveInFlight) {
    serverSavePending = true;
    return;
  }

  serverSaveInFlight = true;
  try {
    const response = await fetch(API_DATA_URL, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error("Sauvegarde backend refusée.");
    }
  } catch (error) {
    console.warn(error);
    serverSyncEnabled = false;
    showToast("Sauvegarde serveur interrompue. Les données restent conservées sur cette machine.");
  } finally {
    serverSaveInFlight = false;
    if (serverSavePending) {
      serverSavePending = false;
      scheduleServerSave(true);
    }
  }
}

function flushServerSave() {
  if (!serverSyncEnabled || !canUseBackend()) return;
  clearTimeout(serverSaveTimer);
  persistDataToServer();
}

function createId(prefix) {
  if (crypto?.randomUUID) {
    return `${prefix}-${crypto.randomUUID().slice(0, 8)}`;
  }
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

function setHashView() {
  const view = location.hash.replace("#", "") === "admin" ? "admin" : "player";
  Object.entries(els.views).forEach(([name, element]) => {
    element.classList.toggle("is-active", name === view);
  });
  els.navLinks.forEach((link) => {
    link.classList.toggle("is-active", link.dataset.route === view);
  });
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
  saveData();
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

function getMapCenter(target, playerPosition) {
  if (!playerPosition) return target;
  return {
    lat: (target.lat + playerPosition.lat) / 2,
    lng: (target.lng + playerPosition.lng) / 2,
  };
}

function renderTileMap(container, options) {
  if (!container) return;
  const rect = container.getBoundingClientRect();
  const width = Math.max(Math.round(rect.width), 320);
  const height = Math.max(Math.round(rect.height), 180);
  const center = options.center || DEFAULT_CENTER;
  const target = options.target || center;
  const radius = Number(options.radius || 120);
  const player = options.player || null;
  const renderKey = JSON.stringify({
    w: width,
    h: height,
    center: [center.lat.toFixed(5), center.lng.toFixed(5)],
    target: [target.lat.toFixed(5), target.lng.toFixed(5)],
    radius: Math.round(radius),
    player: player ? [player.lat.toFixed(5), player.lng.toFixed(5)] : null,
    editable: Boolean(options.editable),
  });

  if (container.dataset.mapKey === renderKey) return;
  container.dataset.mapKey = renderKey;

  const tiles = container.querySelector(".map-tiles");
  const layer = container.querySelector(".map-layer");
  const centerWorld = latLngToWorld(center.lat, center.lng);
  const topLeft = {
    x: centerWorld.x - width / 2,
    y: centerWorld.y - height / 2,
  };
  const startX = Math.floor(topLeft.x / TILE_SIZE);
  const startY = Math.floor(topLeft.y / TILE_SIZE);
  const endX = Math.floor((topLeft.x + width) / TILE_SIZE);
  const endY = Math.floor((topLeft.y + height) / TILE_SIZE);
  const maxTile = 2 ** MAP_ZOOM;
  const tileMarkup = [];

  for (let x = startX; x <= endX; x += 1) {
    for (let y = startY; y <= endY; y += 1) {
      if (y < 0 || y >= maxTile) continue;
      const wrappedX = ((x % maxTile) + maxTile) % maxTile;
      tileMarkup.push(
        `<img class="map-tile" alt="" src="https://tile.openstreetmap.org/${MAP_ZOOM}/${wrappedX}/${y}.png" style="left:${Math.round(x * TILE_SIZE - topLeft.x)}px;top:${Math.round(y * TILE_SIZE - topLeft.y)}px" />`,
      );
    }
  }

  const pointFor = (point) => {
    const world = latLngToWorld(point.lat, point.lng);
    return {
      x: world.x - topLeft.x,
      y: world.y - topLeft.y,
    };
  };

  const targetPoint = pointFor(target);
  const radiusPixels = metersToPixels(radius, target.lat);
  const overlay = [
    `<span class="map-zone" style="left:${targetPoint.x}px;top:${targetPoint.y}px;width:${radiusPixels * 2}px;height:${radiusPixels * 2}px"></span>`,
  ];

  if (player) {
    const playerPoint = pointFor(player);
    const dx = targetPoint.x - playerPoint.x;
    const dy = targetPoint.y - playerPoint.y;
    const lineLength = Math.sqrt(dx ** 2 + dy ** 2);
    const lineAngle = (Math.atan2(dy, dx) * 180) / Math.PI;
    overlay.push(
      `<span class="map-route-line" style="left:${playerPoint.x}px;top:${playerPoint.y}px;width:${lineLength}px;transform:rotate(${lineAngle}deg)"></span>`,
      `<span class="map-marker marker-player" style="left:${playerPoint.x}px;top:${playerPoint.y}px"><span class="marker-label">Vous</span></span>`,
    );
  }

  overlay.push(
    `<span class="map-marker marker-target" style="left:${targetPoint.x}px;top:${targetPoint.y}px"><span class="marker-label">${options.editable ? "Point" : "Objectif"}</span></span>`,
  );

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

function ensureTeamState(team) {
  team.answers ||= {};
  team.unlockedPuzzleIds ||= [];
  team.attempts ||= {};
  team.hints ||= {};
  team.photoNames ||= {};
}

function checkGameStatus(team, route) {
  if (!team || !route || team.status !== "playing") return;
  const progress = getTeamProgress(team, route);
  if (progress.solved >= route.puzzles.length) {
    team.status = "won";
    team.finishedAt = Date.now();
    saveData();
    showToast("Bravo, parcours terminé !");
    return;
  }
  if (remainingSeconds(team, route) <= 0) {
    team.status = "lost";
    team.finishedAt = Date.now();
    saveData();
    showToast("Temps écoulé.");
  }
}

function startTicker() {
  clearInterval(ticker);
  ticker = setInterval(() => {
    const team = getCurrentTeam();
    if (!team) return;
    const route = getRoute(team.routeId);
    checkGameStatus(team, route);
    renderPlayer();
    renderTeamTable();
  }, 1000);
}

function render() {
  renderPlayer();
  renderAdmin();
}

function renderPlayer() {
  const team = getCurrentTeam();
  const route = team ? getRoute(team.routeId) : null;

  els.resetSessionButton.style.display = team ? "inline-flex" : "none";
  els.loginPanel.classList.toggle("is-hidden", Boolean(team));
  els.gamePanel.classList.toggle("is-hidden", !team);

  if (!team || !route) return;

  ensureTeamState(team);
  checkGameStatus(team, route);

  const progress = getTeamProgress(team, route);
  const currentPuzzle = getCurrentPuzzle(team, route);
  const currentIndex = route.puzzles.findIndex((puzzle) => puzzle.id === currentPuzzle?.id);
  const elapsed = elapsedSeconds(team);

  renderTeamIdentity(team);
  els.countdown.textContent = formatClock(remainingSeconds(team, route));
  els.routeArea.textContent = route.area;
  els.routeTitle.textContent = route.title;
  els.progressText.textContent = `${progress.solved} / ${progress.total} énigmes`;
  els.elapsedTime.textContent = `${Math.floor(elapsed / 60)} min`;
  els.progressFill.style.width = `${progress.percent}%`;

  const statusLabel = team.status === "won" ? "Gagné" : team.status === "lost" ? "Perdu" : "En cours";
  els.gameStatus.textContent = statusLabel;
  els.gameStatus.classList.toggle("is-success", team.status === "won");
  els.gameStatus.classList.toggle("is-danger", team.status === "lost");

  const gameFinished = team.status === "won" || team.status === "lost";
  els.finishPanel.classList.toggle("is-hidden", !gameFinished);
  els.mapPanel.classList.toggle("is-hidden", gameFinished);
  els.riddleCard.classList.toggle("is-hidden", gameFinished);

  if (gameFinished) {
    renderFinishPanel(team, route);
    return;
  }

  if (!currentPuzzle) return;

  const unlocked = !currentPuzzle.requireLocation || team.unlockedPuzzleIds.includes(currentPuzzle.id);
  renderPlayerMap(team, currentPuzzle);
  els.stepNumber.textContent = String(Math.max(currentIndex + 1, 1));
  els.stepPlace.textContent = currentPuzzle.place;
  els.stepTitle.textContent = currentPuzzle.title;
  els.riddleText.textContent = unlocked
    ? currentPuzzle.question
    : "Rendez-vous dans la zone indiquée sur la carte pour débloquer cette énigme.";
  renderPuzzleMedia(currentPuzzle, unlocked);
  els.locateButton.disabled = !currentPuzzle.requireLocation || team.status !== "playing";
  els.demoUnlockButton.disabled = !currentPuzzle.requireLocation || team.status !== "playing" || unlocked;
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
  els.teamName.textContent = team.name;
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
  els.finishSubtitle.textContent = hasWon
    ? `${team.name} a terminé "${route.title}".`
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

function renderPlayerMap(team, puzzle) {
  const target = {
    lat: getPuzzleLat(puzzle),
    lng: getPuzzleLng(puzzle),
  };
  const playerPosition = team.lastPosition || null;
  renderTileMap(els.playerMap, {
    center: getMapCenter(target, playerPosition),
    target,
    radius: getPuzzleRadius(puzzle),
    player: playerPosition,
    editable: false,
  });
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

function renderAnswerZone(team, route, puzzle, unlocked) {
  const gameClosed = team.status !== "playing";
  if (!unlocked) {
    els.answerZone.innerHTML = "";
    return;
  }

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
      submitPhotoAnswer(team, route, puzzle);
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
    submitTextAnswer(team, route, puzzle);
  });
}

function renderHint(team, puzzle, unlocked) {
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
    els.hintState.textContent = shownCount ? hints[shownCount - 1].text : "Aucun indice";
    return;
  }

  const canShow = attempts >= nextHint.afterAttempts || elapsedSeconds(team) >= nextHint.afterSeconds;
  els.hintButton.disabled = !canShow || team.status !== "playing";
  els.hintState.textContent = shownCount
    ? hints[shownCount - 1].text
    : canShow
      ? "Indice disponible"
      : `Disponible après ${nextHint.afterAttempts} essai`;
}

function submitTextAnswer(team, route, puzzle) {
  const input = $("#text-answer");
  const proposed = normalizeAnswer(input.value);
  const expected = normalizeAnswer(puzzle.answer);

  team.attempts[puzzle.id] = (team.attempts[puzzle.id] || 0) + 1;

  if (proposed === expected) {
    team.answers[puzzle.id] = input.value.trim();
    unlockNextPuzzle(team, route, puzzle.id);
    saveData();
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
  saveData();
  showToast("Photo enregistrée.");
  render();
}

function unlockNextPuzzle(team, route, puzzleId) {
  const currentIndex = route.puzzles.findIndex((puzzle) => puzzle.id === puzzleId);
  const nextPuzzle = route.puzzles[currentIndex + 1];
  if (nextPuzzle && !nextPuzzle.requireLocation) {
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
  if (!team.unlockedPuzzleIds.includes(puzzle.id)) {
    team.unlockedPuzzleIds.push(puzzle.id);
  }
  saveData();
  els.distanceNote.textContent = message;
  showToast("Énigme débloquée.");
  renderPlayer();
}

function locatePlayer() {
  const team = getCurrentTeam();
  if (!team) return;
  const route = getRoute(team.routeId);
  const puzzle = getCurrentPuzzle(team, route);
  if (!puzzle.requireLocation) {
    els.distanceNote.textContent = "Cette énigme est déjà accessible.";
    return;
  }

  if (!navigator.geolocation) {
    els.distanceNote.textContent = "La géolocalisation n’est pas disponible sur cet appareil.";
    return;
  }

  els.distanceNote.textContent = "Recherche de votre position...";
  navigator.geolocation.getCurrentPosition(
    (position) => {
      team.lastPosition = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        accuracy: position.coords.accuracy,
        at: Date.now(),
      };
      const distance = distanceInMeters(
        position.coords.latitude,
        position.coords.longitude,
        getPuzzleLat(puzzle),
        getPuzzleLng(puzzle),
      );
      const radius = getPuzzleRadius(puzzle);

      if (distance <= radius) {
        unlockPuzzle(team, puzzle, `Vous êtes à ${Math.round(distance)} m du point.`);
      } else {
        saveData();
        renderPlayerMap(team, puzzle);
        els.distanceNote.textContent = `Encore ${Math.round(distance - radius)} m avant la zone.`;
      }
    },
    () => {
      els.distanceNote.textContent = "Position non disponible. Réessayez près du lieu.";
    },
    { enableHighAccuracy: true, maximumAge: 5000, timeout: 9000 },
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

function handleActivation(event) {
  event.preventDefault();
  const codeValue = els.activationCode.value.trim().toUpperCase();
  const code = data.codes.find((item) => item.code === codeValue);

  if (!code) {
    els.activationMessage.textContent = "Code introuvable.";
    return;
  }

  let team = code.teamId ? data.teams.find((item) => item.id === code.teamId) : null;

  if (!team) {
    const route = getRoute(code.routeId);
    team = {
      id: createId("team"),
      name: `Équipe ${data.teams.length + 1}`,
      routeId: code.routeId,
      code: code.code,
      startAt: Date.now(),
      finishedAt: null,
      status: "playing",
      answers: {},
      unlockedPuzzleIds: route.puzzles
        .filter((puzzle) => !puzzle.requireLocation)
        .map((puzzle) => puzzle.id),
      attempts: {},
      hints: {},
      photoNames: {},
    };
    data.teams.push(team);
    code.status = "used";
    code.teamId = team.id;
    saveData();
  }

  localStorage.setItem(SESSION_KEY, team.id);
  els.activationForm.reset();
  els.activationMessage.textContent = "";
  showToast("Partie ouverte.");
  render();
}

function resetSession() {
  localStorage.removeItem(SESSION_KEY);
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
  saveData();
  els.teamNameForm.classList.add("is-hidden");
  renderPlayer();
  renderTeamTable();
  showToast("Nom d’équipe enregistré.");
}

function renderAdmin() {
  const activeRoute = getActiveRoute();
  if (!activeRoute) return;

  els.routeCount.textContent = `${data.routes.length} parcours`;
  els.routeList.innerHTML = data.routes
    .map((route) => {
      const teams = data.teams.filter((team) => team.routeId === route.id);
      const active = route.id === activeRoute.id;
      return `
        <article class="route-card">
          <div>
            <h3>${escapeHtml(route.title)}</h3>
            <p>${escapeHtml(route.description || route.area)}</p>
            <div class="metric-strip">
              <span class="metric">${escapeHtml(route.area)}</span>
              <span class="metric">${route.duration} min</span>
              <span class="metric">${route.puzzles.length} énigmes</span>
              <span class="metric">${teams.length} équipe${teams.length > 1 ? "s" : ""}</span>
            </div>
          </div>
          <button class="${active ? "primary-button" : "secondary-button"}" type="button" data-set-route="${route.id}">
            ${active ? "Actif" : "Choisir"}
          </button>
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
            <span class="type-tag">${puzzle.type === "photo" ? "Photo" : "Texte"}${getPuzzleImage(puzzle) ? " + image" : ""}</span>
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
}

function renderRouteDetailsEditor(route) {
  if (!route) return;
  const activeRouteDetailFields = [
    els.routeDetailsTitleInput,
    els.routeDetailsAreaInput,
    els.routeDetailsDurationInput,
    els.routeDetailsDescriptionInput,
  ];
  if (activeRouteDetailFields.includes(document.activeElement)) return;
  els.routeDetailsTitleInput.value = route.title || "";
  els.routeDetailsAreaInput.value = route.area || "";
  els.routeDetailsDurationInput.value = String(route.duration || 90);
  els.routeDetailsDescriptionInput.value = route.description || "";
  els.routeDetailsMessage.textContent = `Modification de "${route.title}".`;
}

function updateRouteDetailsDraft() {
  const route = getActiveRoute();
  if (!route) return;
  route.title = els.routeDetailsTitleInput.value.trim();
  route.area = els.routeDetailsAreaInput.value.trim();
  route.duration = Math.max(1, Number(els.routeDetailsDurationInput.value) || 90);
  route.description = els.routeDetailsDescriptionInput.value.trim();
  saveData();
  refreshRouteDetailsPreview(route);
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
  }

  const activeOption = els.routeSelect.querySelector(`option[value="${route.id}"]`);
  if (activeOption) activeOption.textContent = route.title;
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

function getSelectedContentPuzzle(route) {
  if (!route?.puzzles?.length) return null;
  const selected = route.puzzles.find((puzzle) => puzzle.id === selectedContentPuzzleId);
  return selected || route.puzzles[0];
}

function renderPuzzleContentEditor(route) {
  const puzzle = getSelectedContentPuzzle(route);
  if (!puzzle) {
    els.contentPuzzleSelect.innerHTML = `<option>Aucune énigme</option>`;
    els.contentTitleInput.value = "";
    els.contentPlaceInput.value = "";
    els.contentQuestionInput.value = "";
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
  els.contentImageInput.value = "";
  renderPuzzleImagePreview(puzzle);
  els.contentTypeSelect.value = puzzle.type || "text";
  els.contentAnswerInput.value = puzzle.answer || "";
  els.contentMessage.textContent = `Modification de "${puzzle.title}".`;
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
  puzzle.type = els.contentTypeSelect.value;
  puzzle.answer = els.contentAnswerInput.value.trim();
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
  document.body.classList.add("has-modal");
  updateImageViewerZoom();
  els.imageViewerCloseButton.focus();
}

function closeImageViewer() {
  els.imageViewer.classList.add("is-hidden");
  document.body.classList.remove("has-modal");
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
  const centerWorld = latLngToWorld(target.lat, target.lng);
  const topLeft = {
    x: centerWorld.x - rect.width / 2,
    y: centerWorld.y - rect.height / 2,
  };
  const point = worldToLatLng(topLeft.x + event.clientX - rect.left, topLeft.y + event.clientY - rect.top);

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

function renderTeamTable() {
  els.teamTable.innerHTML = data.teams.length
    ? data.teams
        .map((team) => {
          const route = getRoute(team.routeId);
          if (!route) return "";
          const progress = getTeamProgress(team, route);
          const statusClass = team.status === "won" ? "is-success" : team.status === "lost" ? "is-danger" : "";
          const statusText = team.status === "won" ? "Gagné" : team.status === "lost" ? "Perdu" : "En cours";
          return `
            <tr>
              <td><strong>${escapeHtml(team.name)}</strong></td>
              <td>${escapeHtml(team.code)}</td>
              <td>${escapeHtml(route.title)}</td>
              <td>
                <div class="mini-progress">
                  <span>${progress.solved} / ${progress.total}</span>
                  <span class="mini-progress-bar"><span style="width:${progress.percent}%"></span></span>
                </div>
              </td>
              <td><span class="state-text ${statusClass}">${statusText}</span></td>
            </tr>
          `;
        })
        .join("")
    : `<tr><td colspan="5">Aucune équipe connectée.</td></tr>`;
}

function renderCodeList() {
  els.codeList.innerHTML = data.codes
    .slice()
    .sort((a, b) => b.createdAt - a.createdAt)
    .map((code) => {
      const route = getRoute(code.routeId);
      return `
        <article class="code-row">
          <div>
            <strong>${escapeHtml(code.code)}</strong>
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

  data.codes = data.codes.filter((item) => item.code !== codeValue);
  saveData();
  renderCodeList();
  showToast("Code utilisé supprimé.");
}

function createRoute(event) {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  const route = {
    id: createId("route"),
    title: String(form.get("title")).trim(),
    area: String(form.get("area")).trim(),
    duration: Number(form.get("duration")) || 90,
    distance: "À définir",
    description: String(form.get("description")).trim(),
    puzzles: [],
  };
  data.routes.push(route);
  setActiveRoute(route.id);
  event.currentTarget.reset();
  showToast("Parcours ajouté.");
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

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function bindEvents() {
  window.addEventListener("hashchange", setHashView);
  window.addEventListener("beforeunload", flushServerSave);
  els.activationForm.addEventListener("submit", handleActivation);
  els.resetSessionButton.addEventListener("click", resetSession);
  els.editTeamButton.addEventListener("click", openTeamNameEditor);
  els.teamNameForm.addEventListener("submit", saveTeamName);
  els.hintButton.addEventListener("click", requestHint);
  els.locateButton.addEventListener("click", locatePlayer);
  els.demoUnlockButton.addEventListener("click", unlockCurrentPuzzleByDemo);
  els.seedButton.addEventListener("click", resetSeed);
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
    els.routeDetailsDescriptionInput,
  ].forEach((field) => {
    field.addEventListener("input", updateRouteDetailsDraft);
    field.addEventListener("change", updateRouteDetailsDraft);
  });
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
  els.imageZoomOutButton.addEventListener("click", () => zoomImageViewer(-0.25));
  els.imageZoomResetButton.addEventListener("click", resetImageViewerZoom);
  els.imageZoomInButton.addEventListener("click", () => zoomImageViewer(0.25));
  els.imageViewerImage.addEventListener("dblclick", () => {
    imageViewerZoom = imageViewerZoom > 1 ? 1 : 1.75;
    updateImageViewerZoom();
  });
  window.addEventListener("keydown", (event) => {
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
  navigator.serviceWorker.register("service-worker.js").catch(() => {});
}

bindEvents();
setHashView();
startTicker();
registerServiceWorker();
syncDataFromServer();
