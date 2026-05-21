import { readFile, writeFile } from "node:fs/promises";

const INDEX_FILE = new URL("./index.html", import.meta.url);
const APP_FILE = new URL("./app.js", import.meta.url);
const STYLE_FILE = new URL("./styles.css", import.meta.url);
const SERVICE_WORKER_FILE = new URL("./service-worker.js", import.meta.url);

async function patchFile(fileUrl, patcher) {
  const original = await readFile(fileUrl, "utf8");
  const patched = patcher(original);
  if (patched !== original) {
    await writeFile(fileUrl, patched, "utf8");
  }
}

const START_POINT_CARD = `              <article class="start-point-card" id="start-point-card" aria-labelledby="start-point-title">
                <div>
                  <p class="section-label">Point de d&eacute;part</p>
                  <h3 id="start-point-title">Avant de commencer</h3>
                  <p id="start-point-text">Le point de d&eacute;part du parcours appara&icirc;tra ici.</p>
                </div>
                <a class="secondary-button start-directions-button" id="start-directions-link" href="#" target="_blank" rel="noopener">Ouvrir l&rsquo;itin&eacute;raire</a>
              </article>`;

const CREATE_ROUTE_START_FIELDS = `                <div class="start-editor-block">
                  <p class="section-label">D&eacute;part joueur</p>
                  <label>
                    Lieu de d&eacute;part
                    <input name="start-place" placeholder="Parking, place ou point de rendez-vous" />
                  </label>
                  <label>
                    Adresse de d&eacute;part
                    <input name="start-address" placeholder="Rue, num&eacute;ro, Erez&eacute;e" />
                  </label>
                  <div class="coordinate-grid">
                    <label>
                      Latitude d&eacute;part
                      <input name="start-lat" type="number" step="0.00001" placeholder="50.29285" />
                    </label>
                    <label>
                      Longitude d&eacute;part
                      <input name="start-lng" type="number" step="0.00001" placeholder="5.55765" />
                    </label>
                  </div>
                </div>`;

const ROUTE_DETAILS_START_FIELDS = `                <div class="start-editor-block">
                  <p class="section-label">D&eacute;part joueur</p>
                  <div class="coordinate-grid">
                    <label>
                      Lieu de d&eacute;part
                      <input id="route-details-start-place" name="route-details-start-place" placeholder="Parking, place ou point de rendez-vous" />
                    </label>
                    <label>
                      Adresse de d&eacute;part
                      <input id="route-details-start-address" name="route-details-start-address" placeholder="Rue, num&eacute;ro, Erez&eacute;e" />
                    </label>
                  </div>
                  <div class="coordinate-grid">
                    <label>
                      Latitude d&eacute;part
                      <input id="route-details-start-lat" name="route-details-start-lat" type="number" step="0.00001" placeholder="50.29285" />
                    </label>
                    <label>
                      Longitude d&eacute;part
                      <input id="route-details-start-lng" name="route-details-start-lng" type="number" step="0.00001" placeholder="5.55765" />
                    </label>
                  </div>
                </div>`;

const START_POINT_HELPERS = `function parseOptionalCoordinate(value) {
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
    ? \`\${start.lat},\${start.lng}\`
    : [start.place, start.address, route?.area, "Belgique"].filter(Boolean).join(", ");
  return \`https://www.google.com/maps/dir/?api=1&destination=\${encodeURIComponent(destination)}&travelmode=walking\`;
}

function renderStartPoint(route) {
  if (!els.startPointCard || !route) return;
  const start = getRouteStart(route);
  const hasCoordinates = Number.isFinite(start.lat) && Number.isFinite(start.lng);
  const coordinateLabel = hasCoordinates ? \`GPS \${formatCoordinate(start.lat)}, \${formatCoordinate(start.lng)}\` : "";
  const details = [start.place, start.address, coordinateLabel].filter(Boolean).join(" \\u00b7 ");
  els.startPointText.textContent = details || "Le point de depart sera communique avant le lancement.";
  if (els.startDirectionsLink) {
    els.startDirectionsLink.href = getRouteStartDirectionsUrl(route);
    els.startDirectionsLink.style.display = "inline-flex";
  }
}

`;

const START_POINT_CSS = `
/* start-point-v41 */
.start-point-card {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 12px;
  align-items: center;
  padding: 14px;
  border: 1px solid var(--line);
  border-radius: var(--radius);
  background: #ffffff;
}

.start-point-card h3,
.start-point-card p {
  margin: 0;
}

.start-point-card h3 {
  margin-top: 4px;
  font-size: 1.05rem;
  color: var(--green);
}

.start-point-card p:not(.section-label) {
  color: var(--muted);
  line-height: 1.45;
}

.start-directions-button {
  white-space: nowrap;
}

.start-editor-block {
  display: grid;
  gap: 12px;
  padding: 12px;
  border: 1px solid var(--line);
  border-radius: var(--radius);
  background: #fbfdfc;
}

.start-editor-block > .section-label {
  margin: 0;
}

@media (max-width: 480px) {
  .start-point-card {
    grid-template-columns: 1fr;
  }

  .start-directions-button {
    width: 100%;
  }
}
`;

await patchFile(INDEX_FILE, (code) => {
  let next = code
    .replace(/styles\.css\?v=\d+/g, "styles.css?v=41")
    .replace(/app\.js\?v=\d+/g, "app.js?v=41")
    .replace(/assets\/logo-escape\.(?:svg|jpg)(?:\?v=\d+)?/g, "assets/logo-escape.jpg?v=41");

  if (!next.includes('id="start-point-card"')) {
    next = next.replace(
      /(              <div class="route-hero" id="route-hero">[\s\S]*?              <\/div>\r?\n\r?\n)(              <div class="progress-block">)/,
      `$1\n${START_POINT_CARD}\n\n$2`,
    );
  }

  if (!next.includes('name="start-place"')) {
    next = next.replace(
      /(                <label>\r?\n                  Description\r?\n                  <textarea name="description" required placeholder="Description courte du parcours"><\/textarea>\r?\n                <\/label>\r?\n)(                <label class="file-input route-image-uploader">)/,
      `$1${CREATE_ROUTE_START_FIELDS}\n$2`,
    );
  }

  if (!next.includes('id="route-details-start-place"')) {
    next = next.replace(
      /(                <label>\r?\n                  Description\r?\n                  <textarea id="route-details-description" name="route-details-description" required><\/textarea>\r?\n                <\/label>\r?\n)(                <label class="file-input route-image-uploader">)/,
      `$1${ROUTE_DETAILS_START_FIELDS}\n$2`,
    );
  }

  return next;
});

await patchFile(APP_FILE, (code) => {
  let next = code
    .replace(/assets\/logo-escape\.(?:svg|jpg)(?:\?v=\d+)?/g, "assets/logo-escape.jpg?v=41");

  if (!next.includes('startPointCard: $("#start-point-card")')) {
    next = next.replace(
      '  routeHero: $("#route-hero"),\n',
      '  routeHero: $("#route-hero"),\n  startPointCard: $("#start-point-card"),\n  startPointText: $("#start-point-text"),\n  startDirectionsLink: $("#start-directions-link"),\n',
    );
  }

  if (!next.includes('routeDetailsStartPlaceInput: $("#route-details-start-place")')) {
    next = next.replace(
      '  routeDetailsDescriptionInput: $("#route-details-description"),\n',
      '  routeDetailsDescriptionInput: $("#route-details-description"),\n  routeDetailsStartPlaceInput: $("#route-details-start-place"),\n  routeDetailsStartAddressInput: $("#route-details-start-address"),\n  routeDetailsStartLatInput: $("#route-details-start-lat"),\n  routeDetailsStartLngInput: $("#route-details-start-lng"),\n',
    );
  }

  if (!next.includes('startPlace: "Ancienne gare vicinale"')) {
    next = next.replace(
      /(\s+description:\r?\n\s+"Un parcours familial entre traces du tramway vicinal, rivi[\s\S]*?coeur du village\.",\r?\n)(\s+puzzles: \[)/,
      `$1        startPlace: "Ancienne gare vicinale",\n        startAddress: "Erezee centre",\n        startLat: 50.29285,\n        startLng: 5.55765,\n$2`,
    );
  }

  if (!next.includes("function getRouteStart(route)")) {
    next = next.replace(
      'function getMapCenter(target, playerPosition) {\n',
      `${START_POINT_HELPERS}function getMapCenter(target, playerPosition) {\n`,
    );
  }

  if (!next.includes("renderStartPoint(route);")) {
    next = next.replace(
      "  renderRouteSummary(team, route, progress, currentIndex);\n",
      "  renderRouteSummary(team, route, progress, currentIndex);\n  renderStartPoint(route);\n",
    );
  }

  if (!next.includes("routeDetailsStartPlaceInput")) {
    return next;
  }

  if (!next.includes("els.routeDetailsStartPlaceInput,")) {
    next = next.replace(
      "    els.routeDetailsDescriptionInput,\n  ];",
      "    els.routeDetailsDescriptionInput,\n    els.routeDetailsStartPlaceInput,\n    els.routeDetailsStartAddressInput,\n    els.routeDetailsStartLatInput,\n    els.routeDetailsStartLngInput,\n  ];",
    );
  }

  if (!next.includes("els.routeDetailsStartPlaceInput.value = route.startPlace || \"\";")) {
    next = next.replace(
      "  els.routeDetailsDescriptionInput.value = route.description || \"\";\n",
      "  els.routeDetailsDescriptionInput.value = route.description || \"\";\n  els.routeDetailsStartPlaceInput.value = route.startPlace || \"\";\n  els.routeDetailsStartAddressInput.value = route.startAddress || \"\";\n  els.routeDetailsStartLatInput.value = formatOptionalCoordinate(route.startLat);\n  els.routeDetailsStartLngInput.value = formatOptionalCoordinate(route.startLng);\n",
    );
  }

  if (!next.includes("route.startPlace = els.routeDetailsStartPlaceInput.value.trim();")) {
    next = next.replace(
      "  route.description = els.routeDetailsDescriptionInput.value.trim();\n",
      "  route.description = els.routeDetailsDescriptionInput.value.trim();\n  route.startPlace = els.routeDetailsStartPlaceInput.value.trim();\n  route.startAddress = els.routeDetailsStartAddressInput.value.trim();\n  route.startLat = parseOptionalCoordinate(els.routeDetailsStartLatInput.value);\n  route.startLng = parseOptionalCoordinate(els.routeDetailsStartLngInput.value);\n",
    );
  }

  if (!next.includes('startPlace: String(form.get("start-place") || "").trim()')) {
    next = next.replace(
      "    description: String(form.get(\"description\")).trim(),\n",
      "    description: String(form.get(\"description\")).trim(),\n    startPlace: String(form.get(\"start-place\") || \"\").trim(),\n    startAddress: String(form.get(\"start-address\") || \"\").trim(),\n    startLat: parseOptionalCoordinate(form.get(\"start-lat\")),\n    startLng: parseOptionalCoordinate(form.get(\"start-lng\")),\n",
    );
  }

  if (!next.includes("els.routeDetailsStartLngInput,\n  ].forEach((field)")) {
    next = next.replace(
      "    els.routeDetailsDescriptionInput,\n  ].forEach((field) => {",
      "    els.routeDetailsDescriptionInput,\n    els.routeDetailsStartPlaceInput,\n    els.routeDetailsStartAddressInput,\n    els.routeDetailsStartLatInput,\n    els.routeDetailsStartLngInput,\n  ].forEach((field) => {",
    );
  }

  return next;
});

await patchFile(STYLE_FILE, (code) => {
  let next = code
    .replace(/assets\/logo-escape\.(?:svg|jpg)(?:\?v=\d+)?/g, "assets/logo-escape.jpg?v=41");
  if (!next.includes("start-point-v41")) {
    next = `${next.trimEnd()}\n${START_POINT_CSS}\n`;
  }
  return next;
});

await patchFile(SERVICE_WORKER_FILE, (code) => {
  let next = code.replace(/escape-erezee-v\d+/, "escape-erezee-v41");
  next = next.replace(/\.\/assets\/logo-escape\.(?:svg|jpg)(?:\?v=\d+)?/g, "./assets/logo-escape.jpg?v=41");
  if (!next.includes("./assets/logo-escape.jpg?v=41")) {
    next = next.replace(/(\s+"\.\/assets\/icon\.svg",)/, `$1\n  "./assets/logo-escape.jpg?v=41",`);
  }
  return next;
});
