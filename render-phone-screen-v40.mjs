import { readFile, writeFile } from "node:fs/promises";

const INDEX_FILE = new URL("./index.html", import.meta.url);
const STYLE_FILE = new URL("./styles.css", import.meta.url);
const SERVICE_WORKER_FILE = new URL("./service-worker.js", import.meta.url);

async function patchFile(fileUrl, patcher) {
  const original = await readFile(fileUrl, "utf8");
  const patched = patcher(original);
  if (patched !== original) {
    await writeFile(fileUrl, patched, "utf8");
  }
}

const PHONE_SCREEN_CSS = `
/* phone-screen-frame-v40 */
@media (min-width: 721px) {
  .player-layout {
    grid-template-columns: minmax(320px, 1fr) minmax(360px, 430px);
    align-items: start;
  }

  .phone-frame:not(.is-hidden) {
    height: clamp(600px, calc(100vh - 150px), 820px);
    height: clamp(600px, calc(100svh - 150px), 820px);
    max-width: 430px;
    overflow-y: auto;
    align-content: start;
    overscroll-behavior: contain;
    scrollbar-width: thin;
  }

  .phone-frame::-webkit-scrollbar {
    width: 6px;
  }

  .phone-frame::-webkit-scrollbar-thumb {
    border-radius: 999px;
    background: rgba(18, 60, 50, 0.28);
  }
}

@media (max-width: 720px) {
  .player-view {
    padding: 0;
    background: #f9fbfa;
  }

  .player-view > .topbar {
    margin: 0;
    padding: 18px;
    border-bottom: 1px solid var(--line);
    background: #f9fbfa;
  }

  .player-layout {
    gap: 0;
  }

  .phone-frame {
    max-width: none;
    min-height: calc(100vh - 190px);
    min-height: calc(100svh - 190px);
    margin: 0;
    padding: 16px;
    border: 0;
    border-radius: 0;
    background: #f9fbfa;
    box-shadow: none;
    overflow: visible;
  }

  .phone-status {
    position: sticky;
    top: 0;
    z-index: 5;
    margin: -16px -16px 0;
    padding: 12px 16px;
    border-bottom: 1px solid var(--line);
    background: rgba(249, 251, 250, 0.96);
    backdrop-filter: blur(8px);
  }
}
`;

await patchFile(INDEX_FILE, (code) => code
  .replace(/styles\.css\?v=\d+/g, "styles.css?v=40")
  .replace(/app\.js\?v=\d+/g, "app.js?v=40")
  .replace(/assets\/logo-escape\.(?:svg|jpg)(?:\?v=\d+)?/g, "assets/logo-escape.jpg?v=40"));

await patchFile(STYLE_FILE, (code) => {
  if (code.includes("phone-screen-frame-v40")) return code;
  return `${code.trimEnd()}\n${PHONE_SCREEN_CSS}\n`;
});

await patchFile(SERVICE_WORKER_FILE, (code) => {
  let next = code.replace(/escape-erezee-v\d+/, "escape-erezee-v40");
  next = next.replace(/\.\/assets\/logo-escape\.(?:svg|jpg)(?:\?v=\d+)?/g, "./assets/logo-escape.jpg?v=40");
  if (!next.includes("./assets/logo-escape.jpg?v=40")) {
    next = next.replace(/(\s+"\.\/assets\/icon\.svg",)/, `$1\n  "./assets/logo-escape.jpg?v=40",`);
  }
  return next;
});
