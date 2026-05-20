import { readFile, writeFile } from "node:fs/promises";

const APP_FILE = new URL("./app.js", import.meta.url);
const INDEX_FILE = new URL("./index.html", import.meta.url);
const SERVICE_WORKER_FILE = new URL("./service-worker.js", import.meta.url);

async function patchFile(fileUrl, patcher) {
  const original = await readFile(fileUrl, "utf8");
  const patched = patcher(original);
  if (patched !== original) {
    await writeFile(fileUrl, patched, "utf8");
  }
}

const GPS_FUNCTIONS = `function stopGeolocationWatch() {
  if (geolocationWatchId === null || !navigator.geolocation) return;
  navigator.geolocation.clearWatch(geolocationWatchId);
  geolocationWatchId = null;
  geolocationWatchPuzzleId = null;
}

function handleGeolocationPosition(position) {
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

  team.lastPosition = {
    lat: position.coords.latitude,
    lng: position.coords.longitude,
    accuracy: position.coords.accuracy,
    at: Date.now(),
  };
  touchTeam(team);

  geolocationWatchPuzzleId = puzzle.id;
  const distance = distanceInMeters(
    position.coords.latitude,
    position.coords.longitude,
    getPuzzleLat(puzzle),
    getPuzzleLng(puzzle),
  );
  const radius = getPuzzleRadius(puzzle);
  const accuracy = Number(position.coords.accuracy);
  const accuracyText = Number.isFinite(accuracy) ? \` Precision +/-\${Math.round(accuracy)} m.\` : "";

  if (puzzle.requireLocation && distance <= radius && !team.unlockedPuzzleIds.includes(puzzle.id)) {
    unlockPuzzle(team, puzzle, \`Vous etes a \${Math.round(distance)} m du point.\${accuracyText}\`);
    return;
  }

  saveData();
  renderPlayerMap(team, puzzle);
  els.distanceNote.textContent =
    distance <= radius
      ? \`Vous etes dans la zone.\${accuracyText}\`
      : \`Position mise a jour : encore \${Math.round(distance - radius)} m avant la zone.\${accuracyText}\`;
}

function handleGeolocationError() {
  els.distanceNote.textContent = "Position non disponible. Verifiez l'autorisation GPS puis reessayez.";
}

function locatePlayer() {
  const team = getCurrentTeam();
  if (!team) return;
  const route = getRoute(team.routeId);
  const puzzle = getCurrentPuzzle(team, route);
  if (!route || !puzzle) return;
  if (!navigator.geolocation) {
    els.distanceNote.textContent = "La geolocalisation n'est pas disponible sur cet appareil.";
    return;
  }

  if (geolocationWatchId !== null && geolocationWatchPuzzleId === puzzle.id) {
    els.distanceNote.textContent = "Suivi GPS actif. La position est aussi visible dans la gestion.";
    return;
  }

  stopGeolocationWatch();
  els.distanceNote.textContent = "Suivi GPS actif. La carte et la gestion vont se mettre a jour automatiquement.";
  geolocationWatchPuzzleId = puzzle.id;
  geolocationWatchId = navigator.geolocation.watchPosition(
    handleGeolocationPosition,
    handleGeolocationError,
    { enableHighAccuracy: true, maximumAge: 1000, timeout: 15000 },
  );
}
`;

await patchFile(APP_FILE, (code) => code.replace(
  /function stopGeolocationWatch\(\) \{[\s\S]*?\n\}\n\nfunction distanceInMeters/,
  `${GPS_FUNCTIONS}\n\nfunction distanceInMeters`,
));

await patchFile(INDEX_FILE, (code) => code
  .replace(/styles\.css\?v=\d+/g, "styles.css?v=29")
  .replace(/<script\s+src="app\.js\?v=\d+"\s+type="module"><\/script>/g, '<script src="app.js?v=29"></script>')
  .replace(/<script\s+type="module"\s+src="app\.js\?v=\d+"><\/script>/g, '<script src="app.js?v=29"></script>')
  .replace(/app\.js\?v=\d+/g, "app.js?v=29"));

await patchFile(SERVICE_WORKER_FILE, (code) => code.replace(/escape-erezee-v\d+/, "escape-erezee-v29"));
