import { readFile, writeFile } from "node:fs/promises";

const VERSION = 54;

async function patchTextFile(path, updater) {
  const before = await readFile(path, "utf8");
  const after = updater(before);
  if (after !== before) {
    await writeFile(path, after, "utf8");
  }
}

await writeFile("manifest.webmanifest", `${JSON.stringify({
  id: "/",
  name: "Stock & Sevrin Escape Games",
  short_name: "Escape Games",
  description: "Application joueur pour escape game extérieur à Erezée.",
  lang: "fr-BE",
  start_url: "/index.html#home",
  scope: "/",
  display: "standalone",
  display_override: ["standalone", "minimal-ui"],
  background_color: "#f4f7f5",
  theme_color: "#123c32",
  orientation: "portrait",
  categories: ["games", "travel"],
  icons: [
    {
      src: "assets/icon.svg",
      sizes: "any",
      type: "image/svg+xml",
      purpose: "any maskable",
    },
  ],
}, null, 2)}
`, "utf8");

await patchTextFile("index.html", (html) => {
  let next = html
    .replace(/styles\.css\?v=\d+/g, `styles.css?v=${VERSION}`)
    .replace(/app\.js\?v=\d+/g, `app.js?v=${VERSION}`);

  if (!next.includes('mobile-web-app-capable')) {
    next = next.replace(
      '    <meta name="theme-color" content="#123c32" />',
      `    <meta name="theme-color" content="#123c32" />
    <meta name="mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-title" content="Escape Games" />
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />`,
    );
  }

  if (!next.includes('rel="apple-touch-icon"')) {
    next = next.replace(
      '    <link rel="icon" href="assets/icon.svg" type="image/svg+xml" />',
      `    <link rel="icon" href="assets/icon.svg" type="image/svg+xml" />
    <link rel="apple-touch-icon" href="assets/icon.svg" />`,
    );
  }

  if (!next.includes('id="install-app-button"')) {
    next = next.replace(
      '                <a class="secondary-button" href="#player">J’ai déjà un code</a>',
      `                <a class="secondary-button" href="#player">J’ai déjà un code</a>
                <button class="secondary-button install-app-button" type="button" id="install-app-button">
                  Installer l’application
                </button>`,
    );
  }

  return next;
});

await patchTextFile("app.js", (app) => {
  let next = app;

  if (!next.includes("installAppButton:")) {
    next = next.replace('  toast: $("#toast"),', '  toast: $("#toast"),\n  installAppButton: $("#install-app-button"),');
  }

  if (!next.includes("deferredInstallPrompt")) {
    next = next.replace("let toastTimer = null;", "let toastTimer = null;\nlet deferredInstallPrompt = null;");
  }

  if (!next.includes("function isStandaloneApp()")) {
    next = next.replace(
      "function updateModalLock() {",
      `function isStandaloneApp() {
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

function updateModalLock() {`,
    );
  }

  if (!next.includes("beforeinstallprompt")) {
    next = next.replace(
      "function bindEvents() {",
      `function bindEvents() {
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
  updateInstallButton();`,
    );
  }

  return next;
});

await patchTextFile("service-worker.js", (worker) => worker
  .replace(/escape-erezee-v\d+/g, `escape-erezee-v${VERSION}`));
