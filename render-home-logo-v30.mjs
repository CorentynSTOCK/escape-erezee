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

const HOME_SECTION = `        <section class="view home-view" id="home-view" aria-labelledby="home-title">
          <section class="home-hero" aria-label="Presentation de Stock et Sevrin Escape Games">
            <img class="home-hero-bg" src="assets/logo-escape.svg" alt="" />
            <div class="home-hero-overlay" aria-hidden="true"></div>
            <div class="home-hero-content">
              <img class="home-hero-logo" src="assets/logo-escape.svg" alt="Stock &amp; Sevrin Escape Games" />
              <p class="section-label">Escape game exterieur a Erezee</p>
              <h1 id="home-title">Une aventure grandeur nature au coeur de la region</h1>
              <p>
                Explorez Erezee en equipe, avancez de lieu en lieu grace a la carte,
                debloquez les enigmes sur place et tentez de terminer le parcours avant
                la fin du chrono.
              </p>
              <div class="home-actions">
                <a class="primary-button" href="#shop">Voir les parcours</a>
                <a class="secondary-button" href="#player">J'ai deja un code</a>
              </div>
            </div>
          </section>

          <section class="home-band" aria-labelledby="home-concept-title">
            <div>
              <p class="section-label">Le concept</p>
              <h2 id="home-concept-title">Un jeu d'enigmes qui se vit dehors</h2>
            </div>
            <p>
              Chaque parcours vous emmene dans les environs d'Erezee avec une suite
              d'etapes a rejoindre reellement. Une fois dans la bonne zone, l'application
              debloque l'enigme suivante: reponse ecrite, observation, photo ou indice a
              utiliser au bon moment.
            </p>
          </section>

          <section class="home-steps" aria-label="Deroulement de l'aventure">
            <article>
              <span>1</span>
              <h3>Choisissez un parcours</h3>
              <p>Selectionnez l'aventure qui vous convient, selon la duree, la saison et le niveau de balade.</p>
            </article>
            <article>
              <span>2</span>
              <h3>Recevez votre code</h3>
              <p>Apres l'achat, le code d'activation ouvre la partie sur telephone, tablette ou ordinateur.</p>
            </article>
            <article>
              <span>3</span>
              <h3>Partez sur le terrain</h3>
              <p>La carte vous guide vers les zones a atteindre pour reveler les enigmes du parcours.</p>
            </article>
            <article>
              <span>4</span>
              <h3>Resolvez avant la fin</h3>
              <p>Repondez aux defis, utilisez les indices si besoin, puis comparez votre temps au classement.</p>
            </article>
          </section>

          <section class="home-practical" aria-labelledby="home-practical-title">
            <div>
              <p class="section-label">Avant de partir</p>
              <h2 id="home-practical-title">Prevoyez juste l'essentiel</h2>
            </div>
            <ul>
              <li>Un smartphone charge avec la geolocalisation autorisee.</li>
              <li>Une equipe prete a observer les details autour d'elle.</li>
              <li>Des chaussures adaptees a une balade exterieure.</li>
              <li>Le code recu apres l'achat du parcours.</li>
            </ul>
          </section>
        </section>

`;

const HOME_CSS = `
.brand-logo-mark {
  overflow: hidden;
  background: #111c1a;
}

.brand-logo-mark img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.home-view {
  padding: 0;
  background: #f6faf8;
}

.home-hero {
  position: relative;
  overflow: hidden;
  display: grid;
  min-height: calc(100vh - 118px);
  align-items: end;
  padding: 46px;
  background: #102a26;
  color: #fff;
}

.home-hero-bg,
.home-hero-overlay {
  position: absolute;
  inset: 0;
}

.home-hero-bg {
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: 0.86;
}

.home-hero-overlay {
  background:
    linear-gradient(90deg, rgba(9, 22, 20, 0.9), rgba(9, 22, 20, 0.56) 48%, rgba(9, 22, 20, 0.18)),
    linear-gradient(180deg, rgba(9, 22, 20, 0.12), rgba(9, 22, 20, 0.84));
}

.home-hero-content {
  position: relative;
  z-index: 1;
  max-width: 760px;
}

.home-hero-logo {
  display: block;
  width: 210px;
  max-width: 58vw;
  margin-bottom: 18px;
  border: 1px solid rgba(255, 255, 255, 0.24);
  border-radius: var(--radius);
  box-shadow: 0 18px 48px rgba(0, 0, 0, 0.28);
}

.home-hero .section-label {
  color: #f3bd57;
}

.home-hero h1 {
  max-width: 12ch;
  margin: 8px 0 18px;
  font-size: 3.35rem;
  line-height: 0.98;
}

.home-hero p:not(.section-label) {
  max-width: 650px;
  margin: 0;
  color: rgba(255, 255, 255, 0.86);
  font-size: 1.08rem;
  line-height: 1.65;
}

.home-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 26px;
}

.home-actions .primary-button {
  background: #f1b449;
  color: #102a26;
}

.home-actions .secondary-button {
  border-color: rgba(255, 255, 255, 0.36);
  background: rgba(255, 255, 255, 0.12);
  color: #fff;
}

.home-band,
.home-practical {
  display: grid;
  grid-template-columns: minmax(220px, 0.42fr) minmax(0, 1fr);
  gap: 28px;
  align-items: start;
  padding: 42px 46px;
  border-bottom: 1px solid var(--line);
  background: #fff;
}

.home-band h2,
.home-practical h2 {
  margin: 4px 0 0;
  font-size: 1.9rem;
  line-height: 1.08;
}

.home-band > p {
  max-width: 820px;
  margin: 0;
  color: var(--muted);
  font-size: 1.02rem;
  line-height: 1.7;
}

.home-steps {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
  padding: 18px 46px 42px;
  background:
    linear-gradient(180deg, #fff, #f6faf8);
}

.home-steps article {
  min-height: 210px;
  padding: 18px;
  border: 1px solid var(--line);
  border-radius: var(--radius);
  background: #fff;
  box-shadow: 0 10px 30px rgba(18, 60, 50, 0.08);
}

.home-steps span {
  display: grid;
  width: 36px;
  height: 36px;
  margin-bottom: 28px;
  place-items: center;
  border-radius: 6px;
  background: rgba(44, 127, 163, 0.12);
  color: var(--river);
  font-weight: 950;
}

.home-steps h3 {
  margin: 0 0 8px;
  color: var(--green);
  font-size: 1.05rem;
}

.home-steps p {
  margin: 0;
  color: var(--muted);
  font-size: 0.92rem;
  line-height: 1.55;
}

.home-practical {
  border-bottom: 0;
  background: #f2f7f5;
}

.home-practical ul {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  padding: 0;
  margin: 0;
  list-style: none;
}

.home-practical li {
  padding: 14px 16px;
  border-left: 4px solid var(--amber);
  border-radius: var(--radius);
  background: #fff;
  color: var(--ink);
  line-height: 1.45;
}
`;

const HOME_MOBILE_CSS = `
  .home-hero {
    min-height: calc(100vh - 214px);
  }

  .home-steps {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
`;

const HOME_SMALL_CSS = `
  .home-view {
    padding: 0;
  }

  .home-hero {
    min-height: 68vh;
    padding: 26px 18px;
  }

  .home-hero h1 {
    max-width: 11ch;
    font-size: 2.28rem;
  }

  .home-hero p:not(.section-label) {
    font-size: 1rem;
  }

  .home-actions {
    display: grid;
  }

  .home-band,
  .home-practical {
    grid-template-columns: 1fr;
    gap: 14px;
    padding: 28px 18px;
  }

  .home-band h2,
  .home-practical h2 {
    font-size: 1.55rem;
  }

  .home-steps {
    grid-template-columns: 1fr;
    padding: 14px 18px 28px;
  }

  .home-steps article {
    min-height: auto;
  }

  .home-steps span {
    margin-bottom: 18px;
  }

  .home-practical ul {
    grid-template-columns: 1fr;
  }

  .nav-link {
    justify-content: center;
    gap: 6px;
    padding: 10px 6px;
    font-size: 0.82rem;
  }

  .nav-link span {
    width: 24px;
    height: 24px;
  }
`;

await patchFile(INDEX_FILE, (code) => {
  let next = code
    .replace(/styles\.css\?v=\d+/g, "styles.css?v=30")
    .replace(/<script\s+src="app\.js\?v=\d+"\s+type="module"><\/script>/g, '<script src="app.js?v=30"></script>')
    .replace(/<script\s+type="module"\s+src="app\.js\?v=\d+"><\/script>/g, '<script src="app.js?v=30"></script>')
    .replace(/app\.js\?v=\d+/g, "app.js?v=30");

  next = next.replace(
    /<a class="brand" href="#(?:shop|home)" aria-label="[^"]*">[\s\S]*?<\/a>/,
    `<a class="brand" href="#home" aria-label="Stock et Sevrin Escape Games">
          <span class="brand-mark brand-logo-mark" aria-hidden="true">
            <img src="assets/logo-escape.svg" alt="" />
          </span>
          <span>
            <strong>Stock &amp; Sevrin</strong>
            <small>Escape Games</small>
          </span>
        </a>`,
  );

  if (!next.includes('data-route="home"')) {
    next = next.replace(
      /<nav class="main-nav" aria-label="Espaces">\s*/,
      `<nav class="main-nav" aria-label="Espaces">
          <a class="nav-link" href="#home" data-route="home">
            <span aria-hidden="true">⌂</span>
            Accueil
          </a>
`,
    );
  }

  if (!next.includes('id="home-view"')) {
    next = next.replace(/        <section class="view shop-view"/, `${HOME_SECTION}        <section class="view shop-view"`);
  }

  return next;
});

await patchFile(APP_FILE, (code) => {
  let next = code;
  if (!next.includes('home: $("#home-view")')) {
    next = next.replace(/views:\s*\{\s*\n\s*shop: \$\("#shop-view"\),/, `views: {
    home: $("#home-view"),
    shop: $("#shop-view"),`);
  }
  next = next.replace(
    /const view = \["shop", "player", "admin"\]\.includes\(requestedView\) \? requestedView : "shop";/,
    `const view = ["home", "shop", "player", "admin"].includes(requestedView) ? requestedView : "home";`,
  );
  return next;
});

await patchFile(STYLE_FILE, (code) => {
  let next = code;
  if (!next.includes(".home-hero")) {
    next = next.replace(/\n\.primary-button,/, `${HOME_CSS}\n.primary-button,`);
  }
  next = next.replace(/grid-template-columns: repeat\(3, minmax\(0, 1fr\)\);/g, "grid-template-columns: repeat(4, minmax(0, 1fr));");
  if (!next.includes("min-height: calc(100vh - 214px);")) {
    next = next.replace(/(\n  \.side-note \{[\s\S]*?\n  \}\n)/, `$1${HOME_MOBILE_CSS}\n`);
  }
  if (!next.includes(".home-view {\n    padding: 0;")) {
    next = next.replace(/(\n  \.view \{[\s\S]*?\n  \}\n)/, `$1${HOME_SMALL_CSS}\n`);
  }
  return next;
});

await patchFile(SERVICE_WORKER_FILE, (code) => {
  let next = code.replace(/escape-erezee-v\d+/, "escape-erezee-v30");
  if (!next.includes("./assets/logo-escape.svg")) {
    next = next.replace(/(\s+"\.\/assets\/icon\.svg",)/, `$1\n  "./assets/logo-escape.svg",`);
  }
  return next;
});
