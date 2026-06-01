import { mkdir, readFile, writeFile } from "node:fs/promises";

const VERSION = 91;
const ORIGIN = "https://escape-erezee.be";
const RESERVE_URL = "/index.html#shop";
const IMAGE_LETTRE = "/assets/lettre-dame-soy-cover.png";
const IMAGE_VICINAL = "/assets/sur-les-traces-du-vicinal-cover.png";
const IMAGE_BALISES = "/assets/balises-blier-cover.png";

const landingPages = [
  {
    path: "escape-game-exterieur-ardenne.html",
    title: "Escape game extérieur Ardenne",
    desc: "Vivez un escape game extérieur en Ardenne belge avec énigmes, carte sur smartphone et parcours à faire en équipe.",
    image: IMAGE_LETTRE,
    text: [
      ["Un jeu dehors, dans de vrais paysages", "Les chemins, villages, points de vue et détails du patrimoine deviennent le décor du jeu. L'équipe avance de lieu en lieu et résout les énigmes directement sur smartphone."],
      ["Idéal pour une sortie originale", "Le format convient aux familles, groupes d'amis, couples, touristes ou petites équipes qui veulent découvrir la région autrement."],
    ],
  },
  {
    path: "activite-famille-ardenne.html",
    title: "Activité famille Ardenne",
    desc: "Une activité famille en Ardenne belge pour marcher, observer et résoudre des énigmes ensemble à Érezée.",
    image: IMAGE_BALISES,
    text: [
      ["Une sortie simple à organiser", "Après l'achat, vous recevez un code d'accès. Rendez-vous au point de départ avec un smartphone chargé et lancez l'aventure."],
      ["Bouger, réfléchir, coopérer", "Les énigmes alternent observation, logique et exploration. Les enfants peuvent participer avec les adultes."],
    ],
  },
  {
    path: "chasse-au-tresor-ardenne.html",
    title: "Chasse au trésor Ardenne",
    desc: "Chasse au trésor moderne en Ardenne : suivez la carte, résolvez les énigmes et débloquez les étapes du parcours.",
    image: IMAGE_VICINAL,
    text: [
      ["Un parcours à déverrouiller étape par étape", "Quand vous arrivez dans la bonne zone, l'application révèle l'énigme suivante. Chaque réponse vous rapproche de la fin du parcours."],
      ["Un défi accessible", "Le but n'est pas de courir partout, mais de lire le terrain, comprendre les indices et terminer avant la fin du temps."],
    ],
  },
  {
    path: "activite-touristique-erezee.html",
    title: "Activité touristique Érezée",
    desc: "Découvrez Érezée autrement avec une activité touristique extérieure mêlant balade, patrimoine local et énigmes.",
    image: IMAGE_LETTRE,
    text: [
      ["Une expérience locale", "Les parcours mettent en valeur les villages, chemins et ambiances ardennaises autour d'Érezée."],
      ["À faire pendant un séjour", "L'activité s'intègre facilement avant un restaurant, après une visite ou pendant un week-end en Ardenne."],
    ],
  },
  {
    path: "activite-pres-de-durbuy.html",
    title: "Activité près de Durbuy",
    desc: "Une activité originale près de Durbuy : escape game extérieur et chasse au trésor à Érezée, en Ardenne belge.",
    image: IMAGE_BALISES,
    text: [
      ["Une alternative aux sorties classiques", "Le parcours combine marche, observation et énigmes pour varier les activités pendant un séjour près de Durbuy."],
      ["Autonome et flexible", "Achetez votre parcours en ligne, recevez votre code et lancez l'aventure au moment qui vous convient."],
    ],
  },
];

const blogPosts = [
  {
    path: "blog/que-faire-a-erezee.html",
    title: "Que faire à Érezée ?",
    desc: "Idées d'activités à Érezée : balade, découverte de l'Ardenne, jeu de piste et escape game extérieur.",
    image: IMAGE_LETTRE,
    intro: "Érezée est une belle base pour profiter de l'Ardenne belge : villages, chemins, nature et petites découvertes locales.",
    items: ["Faire une balade dans les villages et paysages autour d'Érezée.", "Découvrir un parcours d'énigmes en équipe avec Escape Érezée.", "Prévoir une pause gourmande dans la région.", "Explorer les alentours en famille pendant les vacances."],
  },
  {
    path: "blog/que-faire-pres-de-durbuy.html",
    title: "Que faire près de Durbuy ?",
    desc: "Activités près de Durbuy : sorties extérieures, famille, nature et chasse au trésor en Ardenne.",
    image: IMAGE_BALISES,
    intro: "Autour de Durbuy, les activités ne manquent pas. Pour changer des visites classiques, un jeu de piste extérieur permet de découvrir l'Ardenne autrement.",
    items: ["Choisir une activité extérieure qui ne dépend pas d'un horaire fixe.", "Motiver toute l'équipe avec un objectif de jeu.", "Combiner Durbuy, Érezée et une sortie nature sur la journée.", "Garder une activité adaptée aux familles et aux groupes."],
  },
  {
    path: "blog/activites-familiales-ardenne-belge.html",
    title: "Activités familiales en Ardenne belge",
    desc: "Sélection d'activités familiales en Ardenne belge : nature, promenade, énigmes et jeux extérieurs.",
    image: IMAGE_LETTRE,
    intro: "En Ardenne belge, les meilleures activités familiales mélangent souvent mouvement, curiosité et coopération.",
    items: ["Une balade avec un objectif clair pour garder les enfants motivés.", "Un escape game extérieur pour chercher, observer et discuter ensemble.", "Une activité flexible, à lancer quand la météo et l'énergie du groupe sont bonnes.", "Un défi accessible aux enfants accompagnés d'adultes."],
  },
  {
    path: "blog/top-10-activites-exterieures-ardenne.html",
    title: "Top 10 des activités extérieures en Ardenne",
    desc: "Top 10 des activités extérieures en Ardenne : randonnée, vélo, patrimoine, chasse au trésor et escape game extérieur.",
    image: IMAGE_VICINAL,
    intro: "L'Ardenne est parfaite pour les activités dehors. Voici des idées simples pour profiter d'une journée active.",
    items: ["Randonnée sur les chemins balisés.", "Escape game extérieur à Érezée.", "Chasse au trésor ou jeu de piste en famille.", "Découverte des villages ardennais.", "Balade à vélo ou VTT.", "Observation de la nature.", "Visite d'un site patrimonial.", "Pique-nique avec point de vue.", "Sortie photo en forêt ou dans les villages.", "Défi en équipe avec classement final."],
  },
  {
    path: "blog/que-faire-vacances-ardenne.html",
    title: "Que faire pendant les vacances en Ardenne ?",
    desc: "Idées pour les vacances en Ardenne : activités familiales, sorties nature et escape game extérieur à Érezée.",
    image: IMAGE_BALISES,
    intro: "Pendant les vacances, l'idéal est de prévoir quelques activités qui plaisent à tout le monde sans demander une organisation lourde.",
    items: ["Bloquer une demi-journée pour une activité extérieure.", "Choisir un parcours d'énigmes pour visiter en s'amusant.", "Alterner moments calmes, nature et défis en équipe.", "Garder une option flexible en cas de changement de météo."],
  },
];

const faq = [
  ["Faut-il internet ?", "Oui, une connexion mobile est recommandée pour charger la carte, synchroniser la progression et valider les étapes."],
  ["Combien de temps durent les parcours ?", "La durée dépend du parcours et du rythme de l'équipe. Prévoyez généralement une activité de plusieurs dizaines de minutes à quelques heures."],
  ["Peut-on jouer avec des enfants ?", "Oui, les enfants peuvent participer avec des adultes. Les énigmes demandent surtout observation, logique et coopération."],
  ["Les chiens sont-ils autorisés ?", "Les parcours se déroulent dehors. Les chiens peuvent accompagner l'équipe si les lieux traversés, la météo et la tenue en laisse le permettent."],
  ["Que faut-il prévoir ?", "Un smartphone chargé, des chaussures adaptées à la marche, le code reçu après achat et une équipe prête à observer."],
];

const reviews = [
  ["Sophie", "Super activité en famille, les enfants ont adoré !"],
  ["Julien", "Une belle découverte de la région tout en s'amusant."],
  ["Nathalie", "Le parcours motive tout le monde à observer les détails."],
];

function escapeHtml(value) {
  return String(value ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function stars() {
  return '<span aria-label="5 étoiles">★★★★★</span>';
}

function shell({ title, desc, path, image, children }) {
  const canonical = `${ORIGIN}/${path}`.replace(/\/index\.html$/, "/");
  return `<!doctype html>
<html lang="fr-BE">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="robots" content="index, follow" />
    <meta name="description" content="${escapeHtml(desc)}" />
    <link rel="canonical" href="${escapeHtml(canonical)}" />
    <link rel="stylesheet" href="/seo-pages.css?v=${VERSION}" />
    <title>${escapeHtml(title)} | Stock & Sevrin Escape Games</title>
    <meta property="og:type" content="article" />
    <meta property="og:site_name" content="Stock & Sevrin Escape Games" />
    <meta property="og:title" content="${escapeHtml(title)}" />
    <meta property="og:description" content="${escapeHtml(desc)}" />
    <meta property="og:url" content="${escapeHtml(canonical)}" />
    <meta property="og:image" content="${escapeHtml(`${ORIGIN}${image}`)}" />
    <meta name="twitter:card" content="summary_large_image" />
  </head>
  <body>
    <header class="site-header">
      <a class="brand" href="/index.html#home">Stock & Sevrin <span>Escape Games</span></a>
      <nav aria-label="Navigation contenu">
        <a href="/escape-game-exterieur-ardenne.html">Escape game Ardenne</a>
        <a href="/activite-famille-ardenne.html">Famille</a>
        <a href="/blog/">Blog</a>
        <a class="reserve-link" href="${RESERVE_URL}">Réserver</a>
      </nav>
    </header>
    ${children}
    <footer class="site-footer">
      <p>Stock & Sevrin Escape Games - parcours d'énigmes extérieurs à Érezée.</p>
      <a href="${RESERVE_URL}">Voir les parcours disponibles</a>
    </footer>
  </body>
</html>`;
}

function howItWorks(className = "how") {
  return `<section class="${className}" aria-labelledby="${className}-title">
    <p class="eyebrow">Comment ça marche ?</p>
    <h2 id="${className}-title">Une aventure en quatre étapes</h2>
    <div class="steps">
      <article><span>1</span><h3>Achetez votre parcours</h3><p>Recevez votre code d'accès par email.</p></article>
      <article><span>2</span><h3>Rendez-vous au point de départ</h3><p>Votre smartphone vous guide.</p></article>
      <article><span>3</span><h3>Résolvez les énigmes</h3><p>Débloquez chaque étape du parcours.</p></article>
      <article><span>4</span><h3>Terminez avant la fin du temps</h3><p>Affrontez le classement des meilleurs joueurs.</p></article>
    </div>
  </section>`;
}

function reviewsBlock(className = "reviews") {
  return `<section class="${className}" aria-labelledby="${className}-title">
    <p class="eyebrow">Avis clients</p>
    <h2 id="${className}-title">Ils ont testé l'aventure</h2>
    <div class="review-grid">
      ${reviews.map(([name, quote]) => `<figure><div>${stars()}</div><blockquote>${escapeHtml(quote)}</blockquote><figcaption>- ${escapeHtml(name)}</figcaption></figure>`).join("\n      ")}
    </div>
  </section>`;
}

function faqBlock(className = "faq") {
  return `<section class="${className}" aria-labelledby="${className}-title">
    <p class="eyebrow">FAQ</p>
    <h2 id="${className}-title">Questions fréquentes</h2>
    ${faq.map(([question, answer]) => `<details><summary>${escapeHtml(question)}</summary><p>${escapeHtml(answer)}</p></details>`).join("\n    ")}
  </section>`;
}

function landingPage(page) {
  return shell({
    title: page.title,
    desc: page.desc,
    path: page.path,
    image: page.image,
    children: `<main>
      <section class="hero">
        <div>
          <p class="eyebrow">Aventure extérieure</p>
          <h1>${escapeHtml(page.title)}</h1>
          <p>${escapeHtml(page.desc)}</p>
          <a class="button" href="${RESERVE_URL}">Réserver un parcours</a>
        </div>
        <img src="${page.image}" alt="" />
      </section>
      <section class="content-grid">
        ${page.text.map(([heading, text]) => `<article><h2>${escapeHtml(heading)}</h2><p>${escapeHtml(text)}</p></article>`).join("\n        ")}
      </section>
      ${howItWorks()}
      ${reviewsBlock()}
      ${faqBlock()}
    </main>`,
  });
}

function blogPost(post) {
  return shell({
    title: post.title,
    desc: post.desc,
    path: post.path,
    image: post.image,
    children: `<main>
      <article class="article">
        <p class="eyebrow">Actualités Ardenne</p>
        <h1>${escapeHtml(post.title)}</h1>
        <img src="${post.image}" alt="" />
        <p class="lead">${escapeHtml(post.intro)}</p>
        <ul>${post.items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
        <p>Pour une sortie prête à jouer, réservez un parcours Escape Érezée et lancez l'aventure depuis votre smartphone.</p>
        <a class="button" href="${RESERVE_URL}">Réserver un parcours</a>
      </article>
    </main>`,
  });
}

function blogIndex() {
  return shell({
    title: "Blog et actualités Ardenne",
    desc: "Conseils et idées de sorties autour d'Érezée, Durbuy et l'Ardenne belge.",
    path: "blog/index.html",
    image: IMAGE_VICINAL,
    children: `<main>
      <section class="hero hero-compact">
        <div>
          <p class="eyebrow">Blog</p>
          <h1>Idées de sorties en Ardenne</h1>
          <p>Retrouvez des articles pour préparer une journée à Érezée, près de Durbuy ou en famille en Ardenne belge.</p>
        </div>
        <img src="${IMAGE_VICINAL}" alt="" />
      </section>
      <section class="article-list" aria-label="Articles">
        ${blogPosts.map((post) => `<article><h2><a href="/${post.path}">${escapeHtml(post.title)}</a></h2><p>${escapeHtml(post.desc)}</p><a href="/${post.path}">Lire l'article</a></article>`).join("\n        ")}
      </section>
    </main>`,
  });
}

const pageCss = `
:root{font-family:Inter,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:#14201d;background:#f4f7f5}
*{box-sizing:border-box}body{margin:0}a{color:inherit}.site-header{display:flex;align-items:center;justify-content:space-between;gap:20px;padding:18px clamp(18px,4vw,48px);background:#0f332b;color:#fff}.brand{font-weight:900;text-decoration:none}.brand span{display:block;font-size:.78rem;color:#d9ebe5}nav{display:flex;gap:14px;flex-wrap:wrap;align-items:center}nav a{text-decoration:none;color:#ecfbf6;font-weight:700}.reserve-link,.button{display:inline-flex;align-items:center;justify-content:center;min-height:44px;padding:0 18px;border-radius:8px;background:#d8942c;color:#11251f;text-decoration:none;font-weight:900}.reserve-link{min-height:36px}main{max-width:1120px;margin:0 auto;padding:34px 20px 54px}.hero{display:grid;grid-template-columns:minmax(0,1fr) minmax(280px,460px);gap:34px;align-items:center}.hero-compact{grid-template-columns:minmax(0,1fr) 360px}.hero img,.article img{width:100%;aspect-ratio:16/10;object-fit:cover;border-radius:8px;box-shadow:0 20px 60px rgba(18,60,50,.14)}.eyebrow{margin:0 0 10px;color:#1f6a58;font-size:.76rem;font-weight:900;letter-spacing:.08em;text-transform:uppercase}h1{margin:0 0 14px;font-size:clamp(2.2rem,6vw,4.4rem);line-height:1.02}h2{font-size:1.45rem}p,li{font-size:1.04rem;line-height:1.68}.lead{font-size:1.18rem}.content-grid,.review-grid,.steps,.article-list{display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:16px;margin-top:28px}.content-grid article,.steps article,.reviews figure,.article-list article,.faq details{padding:20px;border:1px solid #dce6e1;border-radius:8px;background:#fff}.how,.reviews,.faq{margin-top:34px}.steps span{display:grid;width:36px;height:36px;place-items:center;border-radius:999px;background:#123c32;color:#fff;font-weight:900}.reviews blockquote{margin:10px 0;line-height:1.55}.reviews span{color:#d8942c;letter-spacing:2px}.faq details{margin-top:10px}.faq summary{cursor:pointer;font-weight:900}.site-footer{padding:28px 20px;text-align:center;background:#10231f;color:#fff}.site-footer a{font-weight:900;color:#f1b449}.article{max-width:820px;margin:0 auto}.article-list a{font-weight:900;color:#123c32}@media(max-width:760px){.site-header{align-items:flex-start;flex-direction:column}.hero,.hero-compact{grid-template-columns:1fr}h1{font-size:2.4rem}}
`;

async function patchTextFile(filePath, patcher) {
  const input = await readFile(filePath, "utf8");
  const output = patcher(input);
  if (output !== input) await writeFile(filePath, output, "utf8");
}

async function writePage(filePath, content) {
  const dir = filePath.includes("/") ? filePath.split("/").slice(0, -1).join("/") : ".";
  await mkdir(dir, { recursive: true });
  await writeFile(filePath, content, "utf8");
}

async function generatePages() {
  await writeFile("seo-pages.css", pageCss.trimStart(), "utf8");
  for (const page of landingPages) await writePage(page.path, landingPage(page));
  await writePage("blog/index.html", blogIndex());
  for (const post of blogPosts) await writePage(post.path, blogPost(post));
}

function patchIndex(html) {
  let next = html
    .replace(/styles\.css\?v=\d+/g, `styles.css?v=${VERSION}`)
    .replace(/app\.js\?v=\d+/g, `app.js?v=${VERSION}`);

  const newHow = howItWorks("home-how");
  next = next.replace(/<section class="home-steps"[\s\S]*?<\/section>\s*(?=<section class="home-practical" aria-labelledby="home-practical-title">)/, `${newHow}\n\n          `);

  if (!next.includes("home-seo-reviews")) {
    const insert = `
          ${reviewsBlock("home-seo-reviews")}
          ${faqBlock("home-seo-faq")}
          <section class="home-seo-links" aria-labelledby="home-seo-links-title">
            <div>
              <p class="section-label">Explorer la région</p>
              <h2 id="home-seo-links-title">Activités et idées de sorties</h2>
            </div>
            <div class="home-link-grid">
              ${landingPages.map((page) => `<a href="/${page.path}">${escapeHtml(page.title)}</a>`).join("\n              ")}
              <a href="/blog/">Blog et actualités</a>
            </div>
          </section>
`;
    const marker = '        <section class="view shop-view"';
    const index = next.indexOf(marker);
    if (index === -1) throw new Error("Insertion accueil SEO introuvable");
    next = `${next.slice(0, index)}${insert}${next.slice(index)}`;
  }

  return next;
}

function patchStyles(css) {
  const marker = `/* render-seo-content-v${VERSION} */`;
  if (css.includes(marker)) return css;
  return `${css.trimEnd()}

${marker}
.home-how,
.home-seo-reviews,
.home-seo-faq,
.home-seo-links {
  padding: clamp(28px, 4vw, 52px);
  background: #ffffff;
}

.home-how .steps,
.home-seo-reviews .review-grid,
.home-link-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 14px;
}

.home-how article,
.home-seo-reviews figure,
.home-seo-faq details,
.home-link-grid a {
  margin: 0;
  padding: 18px;
  border: 1px solid var(--line);
  border-radius: var(--radius);
  background: var(--soft);
}

.home-how article span {
  display: grid;
  width: 36px;
  height: 36px;
  place-items: center;
  border-radius: 999px;
  background: var(--green);
  color: #fff;
  font-weight: 900;
}

.home-seo-reviews figure div {
  color: var(--amber);
  letter-spacing: 2px;
}

.home-seo-reviews blockquote {
  margin: 10px 0;
  line-height: 1.55;
}

.home-seo-faq details {
  margin-top: 10px;
}

.home-seo-faq summary,
.home-link-grid a {
  font-weight: 900;
}

.home-link-grid a {
  color: var(--green);
  text-decoration: none;
}
`;
}

function patchServer(server) {
  if (server.includes("SEO_STATIC_PATHS_V91")) return server;
  const staticPaths = [
    ...landingPages.map((page) => `/${page.path}`),
    "/blog/",
    ...blogPosts.map((post) => `/${post.path}`),
  ];
  const needle = 'function buildSitemapXml(routes, origin) {\n  const urls = [\n    `${origin}/`,';
  const replacement = [
    `const SEO_STATIC_PATHS_V91 = ${JSON.stringify(staticPaths)};`,
    "",
    "function buildSitemapXml(routes, origin) {",
    "  const urls = [",
    "    `${origin}/`,",
    "    ...SEO_STATIC_PATHS_V91.map((path) => `${origin}${path}`),",
  ].join("\n");
  if (!server.includes(needle)) throw new Error("Insertion sitemap SEO v91 introuvable");
  return server.replace(needle, replacement);
}

function patchServiceWorker(worker) {
  return worker
    .replace(/escape-erezee-v\d+/g, `escape-erezee-v${VERSION}`)
    .replace(/"\.\/styles\.css(?:\?v=\d+)?"/g, `"./styles.css?v=${VERSION}"`)
    .replace(/"\.\/app\.js(?:\?v=\d+)?"/g, `"./app.js?v=${VERSION}"`);
}

await generatePages();
await patchTextFile("index.html", patchIndex);
await patchTextFile("styles.css", patchStyles);
await patchTextFile("server.mjs", patchServer);
await patchTextFile("service-worker.js", patchServiceWorker);
console.log(`SEO content patch v${VERSION} applied.`);
