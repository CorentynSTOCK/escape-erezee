import { readFile, writeFile } from "node:fs/promises";

const INDEX_FILE = new URL("./index.html", import.meta.url);
const APP_FILE = new URL("./app.js", import.meta.url);
const STYLE_FILE = new URL("./styles.css", import.meta.url);
const SERVICE_WORKER_FILE = new URL("./service-worker.js", import.meta.url);

const ARRIVAL_MODAL_HTML = `    <div class="arrival-modal is-hidden" id="arrival-modal" role="dialog" aria-modal="true" aria-labelledby="arrival-modal-title">
      <button class="arrival-modal-backdrop" type="button" aria-label="Fermer le message" data-close-arrival-modal></button>
      <section class="arrival-modal-panel">
        <button class="arrival-modal-close" type="button" id="arrival-modal-close" aria-label="Fermer le message">&times;</button>
        <p class="section-label">Zone atteinte</p>
        <h2 id="arrival-modal-title">Vous y &ecirc;tes</h2>
        <p id="arrival-modal-message"></p>
        <button class="primary-button full-button" type="button" id="arrival-modal-ok">Continuer</button>
      </section>
    </div>

`;

const ARRIVAL_MODAL_CSS = `.arrival-modal {
  position: fixed;
  inset: 0;
  z-index: 45;
  display: grid;
  place-items: center;
  padding: 18px;
}

.arrival-modal.is-hidden {
  display: none;
}

.arrival-modal-backdrop {
  position: absolute;
  inset: 0;
  min-height: 0;
  padding: 0;
  border-radius: 0;
  background: rgba(11, 31, 27, 0.72);
  backdrop-filter: blur(4px);
}

.arrival-modal-panel {
  position: relative;
  display: grid;
  gap: 14px;
  width: min(430px, calc(100vw - 32px));
  padding: 24px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: var(--radius);
  background: #fff;
  box-shadow: 0 28px 80px rgba(6, 24, 20, 0.34);
}

.arrival-modal-panel h2,
.arrival-modal-panel p {
  margin: 0;
}

.arrival-modal-panel h2 {
  padding-right: 36px;
  color: var(--ink);
  font-size: 1.55rem;
  line-height: 1.08;
}

.arrival-modal-panel > p:not(.section-label) {
  color: var(--muted);
  font-size: 1rem;
  line-height: 1.55;
}

.arrival-modal-close {
  position: absolute;
  top: 12px;
  right: 12px;
  display: grid;
  width: 34px;
  height: 34px;
  place-items: center;
  border: 1px solid var(--line);
  border-radius: 999px;
  background: #f7faf8;
  color: var(--green);
  font-size: 1.35rem;
  font-weight: 900;
  line-height: 1;
}

`;

const MODAL_FUNCTIONS = `function updateModalLock() {
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

`;

async function patchFile(fileUrl, patcher) {
  const original = await readFile(fileUrl, "utf8");
  const patched = patcher(original);
  if (patched !== original) {
    await writeFile(fileUrl, patched, "utf8");
  }
}

await patchFile(INDEX_FILE, (code) => {
  let next = code
    .replace(/styles\.css\?v=\d+/g, "styles.css?v=43")
    .replace(/app\.js\?v=\d+/g, "app.js?v=43")
    .replace(/<script\s+src="app\.js\?v=\d+"\s+type="module"><\/script>/g, '<script src="app.js?v=43"></script>')
    .replace(/<script\s+type="module"\s+src="app\.js\?v=\d+"><\/script>/g, '<script src="app.js?v=43"></script>');
  if (!next.includes('id="arrival-modal"')) {
    next = next.replace('    <div class="image-viewer is-hidden"', `${ARRIVAL_MODAL_HTML}    <div class="image-viewer is-hidden"`);
  }
  return next;
});

await patchFile(APP_FILE, (code) => {
  let next = code;

  if (!next.includes('arrivalModal: $("#arrival-modal")')) {
    next = next.replace(
      '  imageZoomInButton: $("#image-zoom-in"),',
      `  imageZoomInButton: $("#image-zoom-in"),
  arrivalModal: $("#arrival-modal"),
  arrivalModalMessage: $("#arrival-modal-message"),
  arrivalModalCloseButton: $("#arrival-modal-close"),
  arrivalModalOkButton: $("#arrival-modal-ok"),`,
    );
  }

  if (!next.includes("function updateModalLock()")) {
    next = next.replace(
      /function showToast\(message\) \{[\s\S]*?\n\}\n\nfunction getActiveRoute\(\)/,
      (match) => match.replace("\n\nfunction getActiveRoute()", `\n\n${MODAL_FUNCTIONS}function getActiveRoute()`),
    );
  }

  if (!next.includes("const unlockMessage = message")) {
    next = next.replace(
      /function unlockPuzzle\(team, puzzle, message\) \{[\s\S]*?\n\}\n\nfunction stopGeolocationWatch\(\)/,
      `function unlockPuzzle(team, puzzle, message) {
  const unlockMessage = message || "\\u00c9nigme d\\u00e9bloqu\\u00e9e.";
  if (!team.unlockedPuzzleIds.includes(puzzle.id)) {
    team.unlockedPuzzleIds.push(puzzle.id);
  }
  touchTeam(team);
  saveData();
  els.distanceNote.textContent = unlockMessage;
  renderPlayer();
  if (!openArrivalModal(unlockMessage)) {
    showToast(unlockMessage);
  }
}

function stopGeolocationWatch()`,
    );
  }

  next = next
    .replace('document.body.classList.add("has-modal");', "updateModalLock();")
    .replace('document.body.classList.remove("has-modal");', "updateModalLock();");

  if (!next.includes("data-close-arrival-modal")) {
    next = next.replace(
      '  els.imageViewer.querySelector("[data-close-image-viewer]").addEventListener("click", closeImageViewer);',
      `  els.imageViewer.querySelector("[data-close-image-viewer]").addEventListener("click", closeImageViewer);
  els.arrivalModalCloseButton?.addEventListener("click", closeArrivalModal);
  els.arrivalModalOkButton?.addEventListener("click", closeArrivalModal);
  els.arrivalModal?.querySelector("[data-close-arrival-modal]")?.addEventListener("click", closeArrivalModal);`,
    );
  }

  if (!next.includes('event.key === "Escape" && !els.arrivalModal')) {
    next = next.replace(
      '  window.addEventListener("keydown", (event) => {\n    if (els.imageViewer.classList.contains("is-hidden")) return;',
      `  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !els.arrivalModal?.classList.contains("is-hidden")) {
      closeArrivalModal();
      return;
    }
    if (els.imageViewer.classList.contains("is-hidden")) return;`,
    );
  }

  return next;
});

await patchFile(STYLE_FILE, (code) => {
  if (code.includes(".arrival-modal {")) return code;
  return code.replace(".image-viewer {\n", `${ARRIVAL_MODAL_CSS}.image-viewer {\n`);
});

await patchFile(SERVICE_WORKER_FILE, (code) => code.replace(/escape-erezee-v\d+/, "escape-erezee-v43"));
