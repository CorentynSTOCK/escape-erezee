import { mkdir, readFile, writeFile } from "node:fs/promises";

const VERSION = 107;
const ORIGIN = "https://escape-erezee.be";
const RESERVE_URL = "/index.html#shop";
const IMAGE_LETTRE = "/assets/lettre-dame-soy-cover.png";
const IMAGE_VICINAL = "/assets/sur-les-traces-du-vicinal-cover.png";
const IMAGE_BALISES = "/assets/balises-blier-cover.png";

const posts = [
  {
    path: "blog/que-faire-a-erezee.html",
    title: "Que faire à Érezée ?",
    desc: "Idées d'activités à Érezée : balade, patrimoine, nature, activité famille et escape game extérieur en Ardenne.",
    image: IMAGE_LETTRE,
    intro: "Érezée est une excellente base pour profiter de l'Ardenne belge sans organiser une journée compliquée. On y trouve des villages calmes, des chemins de promenade, du patrimoine local et des activités faciles à partager en famille ou entre amis.",
    sections: [
      ["Découvrir Érezée autrement", "Pour une première découverte, commencez par une balade dans les villages et les paysages autour d'Érezée. Les parcours extérieurs permettent de transformer cette promenade en aventure : chaque détail observé sur place devient utile pour progresser."],
      ["Prévoir une activité famille", "Une activité famille à Érezée fonctionne bien quand chacun peut participer à son rythme. Les enfants cherchent les indices, les adultes aident à lire les consignes et tout le groupe avance ensemble. Le smartphone sert de guide, mais l'essentiel reste dehors."],
      ["Ajouter un défi à la promenade", "Un escape game extérieur donne un objectif clair à la sortie : résoudre les énigmes, débloquer les étapes et terminer avant la fin du temps. C'est une bonne option pendant un week-end, des vacances ou une journée touristique en Ardenne."],
      ["Conseils pratiques", "Prévoyez un téléphone chargé, des chaussures adaptées, de l'eau et quelques minutes pour lire le briefing avant de partir. Pendant les périodes de chasse, vérifiez toujours les informations locales et respectez les panneaux sur place."],
    ],
    links: [
      ["/activite-touristique-erezee.html", "Activité touristique à Érezée"],
      ["/activite-famille-ardenne.html", "Activité famille en Ardenne"],
      ["/escape-game-exterieur-ardenne.html", "Escape game extérieur Ardenne"],
    ],
  },
  {
    path: "blog/que-faire-pres-de-durbuy.html",
    title: "Que faire près de Durbuy ?",
    desc: "Activités près de Durbuy : sorties extérieures, famille, nature, chasse au trésor et escape game à Érezée.",
    image: IMAGE_BALISES,
    intro: "Durbuy attire beaucoup de visiteurs, mais les alentours offrent aussi de belles idées de sorties. À quelques kilomètres, Érezée permet de combiner nature, villages ardennais et jeu d'énigmes autonome.",
    sections: [
      ["Changer des visites classiques", "Après une visite de Durbuy, une activité extérieure permet de bouger, respirer et découvrir la région autrement. Le jeu de piste donne une structure à la balade et évite la simple promenade sans but."],
      ["Une sortie flexible", "L'avantage d'un parcours sur smartphone est la flexibilité : vous réservez en ligne, recevez votre code et lancez l'aventure au moment qui convient au groupe. C'est pratique pour un séjour où la météo et les horaires changent vite."],
      ["Pour familles, couples et groupes", "Les énigmes demandent surtout observation et coopération. Cela convient aux familles, aux couples qui cherchent une sortie originale ou aux groupes d'amis qui veulent un défi léger mais concret."],
      ["Organiser la journée", "Vous pouvez prévoir Durbuy le matin, une pause repas, puis un parcours à Érezée l'après-midi. Gardez toujours une marge de temps et vérifiez les consignes locales si vous traversez des zones naturelles."],
    ],
    links: [
      ["/activite-pres-de-durbuy.html", "Activité près de Durbuy"],
      ["/chasse-au-tresor-ardenne.html", "Chasse au trésor Ardenne"],
      ["/blog/que-faire-vacances-ardenne.html", "Que faire pendant les vacances en Ardenne ?"],
    ],
  },
  {
    path: "blog/activites-familiales-ardenne-belge.html",
    title: "Activités familiales en Ardenne belge",
    desc: "Sélection d'activités familiales en Ardenne belge : promenade, nature, énigmes, chasse au trésor et sortie extérieure.",
    image: IMAGE_LETTRE,
    intro: "Les meilleures activités familiales en Ardenne belge mélangent souvent trois choses simples : bouger, observer et partager un objectif. Une sortie réussie n'a pas besoin d'être compliquée, mais elle doit donner envie à tout le monde de participer.",
    sections: [
      ["La promenade avec un objectif", "Une balade classique peut vite perdre les plus jeunes. En ajoutant des énigmes, des lieux à trouver et une progression visible, la marche devient un jeu collectif."],
      ["Le jeu d'observation", "Un parcours d'escape game extérieur encourage les enfants à regarder les panneaux, les pierres, les bâtiments et les détails du paysage. Les adultes peuvent guider sans faire à leur place."],
      ["Une activité qui s'adapte au rythme", "Chaque famille avance différemment. Le format autonome permet de faire une pause, de relire une consigne ou de profiter d'un endroit avant de continuer."],
      ["Ce qu'il faut prévoir", "Un smartphone chargé, une batterie externe si possible, des chaussures confortables et une tenue adaptée à la météo. Si une zone est fermée ou signalée pour la chasse, reportez le parcours."],
    ],
    links: [
      ["/activite-famille-ardenne.html", "Activité famille Ardenne"],
      ["/chasse-au-tresor-ardenne.html", "Chasse au trésor Ardenne"],
      ["/blog/top-10-activites-exterieures-ardenne.html", "Top 10 des activités extérieures en Ardenne"],
    ],
  },
  {
    path: "blog/top-10-activites-exterieures-ardenne.html",
    title: "Top 10 des activités extérieures en Ardenne",
    desc: "Top 10 des activités extérieures en Ardenne : randonnée, vélo, patrimoine, chasse au trésor et escape game extérieur.",
    image: IMAGE_VICINAL,
    intro: "L'Ardenne est idéale pour une journée dehors. Voici dix idées d'activités extérieures à combiner selon la météo, l'âge du groupe et l'envie de bouger.",
    sections: [
      ["1. Une randonnée sur les chemins balisés", "La valeur sûre pour découvrir les paysages et prendre le temps d'observer."],
      ["2. Un escape game extérieur", "À Érezée, les parcours transforment les lieux réels en terrain de jeu avec énigmes, carte et progression sur smartphone."],
      ["3. Une chasse au trésor moderne", "Parfait pour garder les enfants motivés tout en visitant un village ou un coin de nature."],
      ["4. Une balade à vélo ou VTT", "L'Ardenne offre des itinéraires variés, à adapter au niveau du groupe."],
      ["5. Une sortie patrimoine", "Moulins, anciennes voies, chapelles, panneaux historiques et bâtiments ruraux donnent du relief à la promenade."],
      ["6 à 10. Nature, photo et défis", "Observation de la nature, pique-nique avec point de vue, sortie photo, défi en équipe et découverte des villages complètent très bien un séjour ardennais."],
    ],
    links: [
      ["/escape-game-exterieur-ardenne.html", "Escape game extérieur Ardenne"],
      ["/activite-touristique-erezee.html", "Activité touristique Érezée"],
      ["/blog/que-faire-pres-de-durbuy.html", "Que faire près de Durbuy ?"],
    ],
  },
  {
    path: "blog/que-faire-vacances-ardenne.html",
    title: "Que faire pendant les vacances en Ardenne ?",
    desc: "Idées pour les vacances en Ardenne : activités familiales, sorties nature, visites et escape game extérieur à Érezée.",
    image: IMAGE_BALISES,
    intro: "Pendant les vacances en Ardenne, l'idéal est d'alterner moments calmes, sorties nature et activités qui donnent un vrai souvenir au groupe. Un parcours d'énigmes peut devenir la sortie originale de la semaine.",
    sections: [
      ["Prévoir une demi-journée dehors", "Réservez un créneau où tout le monde a de l'énergie. Une activité extérieure fonctionne mieux quand le groupe n'est pas pressé et peut prendre le temps d'observer."],
      ["Choisir une activité flexible", "La météo change vite en Ardenne. Un parcours autonome permet de s'organiser plus librement qu'une activité à horaire fixe."],
      ["Varier les plaisirs", "Combinez une visite, une pause gourmande, une promenade et un jeu de piste. Cela donne une journée complète sans devoir rouler trop longtemps."],
      ["Rester attentif aux conditions locales", "En forêt et sur les chemins, respectez les panneaux, la météo, les fermetures temporaires et les périodes de chasse. La sécurité passe avant le jeu."],
    ],
    links: [
      ["/activite-famille-ardenne.html", "Activité famille Ardenne"],
      ["/activite-pres-de-durbuy.html", "Activité près de Durbuy"],
      ["/blog/que-faire-a-erezee.html", "Que faire à Érezée ?"],
    ],
  },
];

const faq = [
  ["Faut-il réserver à l'avance ?", "Oui, l'achat en ligne permet de recevoir le code d'accès avant de se rendre au point de départ."],
  ["Faut-il une connexion internet ?", "Oui, une connexion mobile est recommandée pour charger la carte, synchroniser la progression et valider les étapes."],
  ["Est-ce adapté aux enfants ?", "Oui, les enfants peuvent participer avec des adultes. Les énigmes demandent surtout observation et coopération."],
  ["Que faire en période de chasse ?", "Vérifiez les informations locales, respectez les panneaux et reportez le parcours si une zone est fermée ou si une battue est signalée."],
];

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;");
}

function jsonLd(value) {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

function canonicalFor(path) {
  return `${ORIGIN}/${path}`.replace(/\/index\.html$/, "/");
}

function shell({ title, desc, path, image, children, schema }) {
  const canonical = canonicalFor(path);
  return `<!doctype html>
<html lang="fr-BE">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="robots" content="index, follow, max-image-preview:large" />
    <meta name="description" content="${escapeHtml(desc)}" />
    <link rel="canonical" href="${escapeHtml(canonical)}" />
    <link rel="stylesheet" href="/seo-pages.css?v=107" />
    <title>${escapeHtml(title)} | Stock & Sevrin Escape Games</title>
    <meta property="og:type" content="article" />
    <meta property="og:site_name" content="Stock & Sevrin Escape Games" />
    <meta property="og:title" content="${escapeHtml(title)}" />
    <meta property="og:description" content="${escapeHtml(desc)}" />
    <meta property="og:url" content="${escapeHtml(canonical)}" />
    <meta property="og:image" content="${escapeHtml(`${ORIGIN}${image}`)}" />
    <meta name="twitter:card" content="summary_large_image" />
    <script type="application/ld+json">${jsonLd(schema)}</script>
  </head>
  <body>
    <header class="site-header">
      <a class="brand" href="/index.html#home">Stock & Sevrin <span>Escape Games</span></a>
      <nav aria-label="Navigation contenu">
        <a href="/escape-game-exterieur-ardenne.html">Escape game Ardenne</a>
        <a href="/activite-famille-ardenne.html">Famille</a>
        <a href="/activite-pres-de-durbuy.html">Durbuy</a>
        <a href="/blog/">Blog</a>
        <a class="reserve-link" href="${RESERVE_URL}">Réserver</a>
      </nav>
    </header>
    ${children}
    <footer class="site-footer">
      <p>Stock & Sevrin Escape Games - parcours d'énigmes extérieurs à Érezée, en Ardenne belge.</p>
      <a href="${RESERVE_URL}">Voir les parcours disponibles</a>
    </footer>
  </body>
</html>`;
}

function faqBlock() {
  return `<section class="faq" aria-labelledby="faq-title">
    <p class="eyebrow">FAQ</p>
    <h2 id="faq-title">Questions fréquentes</h2>
    ${faq.map(([question, answer]) => `<details><summary>${escapeHtml(question)}</summary><p>${escapeHtml(answer)}</p></details>`).join("\n    ")}
  </section>`;
}

function huntingNotice() {
  return `<aside class="notice">
    <strong>Prudence pendant les périodes de chasse</strong>
    <p>Avant de partir, vérifiez les informations locales, respectez les panneaux sur place et reportez le parcours si une zone est fermée.</p>
  </aside>`;
}

function articleSchema(post) {
  const canonical = canonicalFor(post.path);
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        headline: post.title,
        description: post.desc,
        image: `${ORIGIN}${post.image}`,
        mainEntityOfPage: canonical,
        author: { "@type": "Organization", name: "Stock & Sevrin Escape Games" },
        publisher: {
          "@type": "Organization",
          name: "Stock & Sevrin Escape Games",
          logo: { "@type": "ImageObject", url: `${ORIGIN}/assets/logo-stock-sevrin-v90.jpg` },
        },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Accueil", item: ORIGIN },
          { "@type": "ListItem", position: 2, name: "Blog", item: `${ORIGIN}/blog/` },
          { "@type": "ListItem", position: 3, name: post.title, item: canonical },
        ],
      },
      {
        "@type": "FAQPage",
        mainEntity: faq.map(([question, answer]) => ({
          "@type": "Question",
          name: question,
          acceptedAnswer: { "@type": "Answer", text: answer },
        })),
      },
    ],
  };
}

function blogPost(post) {
  return shell({
    title: post.title,
    desc: post.desc,
    path: post.path,
    image: post.image,
    schema: articleSchema(post),
    children: `<main>
      <article class="article">
        <p class="eyebrow">Actualités Ardenne</p>
        <h1>${escapeHtml(post.title)}</h1>
        <img src="${post.image}" alt="" />
        <p class="lead">${escapeHtml(post.intro)}</p>
        ${post.sections.map(([heading, text]) => `<section><h2>${escapeHtml(heading)}</h2><p>${escapeHtml(text)}</p></section>`).join("\n        ")}
        ${huntingNotice()}
        <section>
          <h2>À lire aussi</h2>
          <div class="article-links">
            ${post.links.map(([href, label]) => `<a href="${href}">${escapeHtml(label)}</a>`).join("\n            ")}
          </div>
        </section>
        ${faqBlock()}
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
    schema: {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: "Blog et actualités Ardenne",
      url: `${ORIGIN}/blog/`,
      hasPart: posts.map((post) => ({ "@type": "Article", headline: post.title, url: canonicalFor(post.path) })),
    },
    children: `<main>
      <section class="hero hero-compact">
        <div>
          <p class="eyebrow">Blog</p>
          <h1>Idées de sorties en Ardenne</h1>
          <p>Guides pratiques pour préparer une journée à Érezée, près de Durbuy ou en famille en Ardenne belge.</p>
          <a class="button" href="${RESERVE_URL}">Voir les parcours</a>
        </div>
        <img src="${IMAGE_VICINAL}" alt="" />
      </section>
      <section class="article-list" aria-label="Articles">
        ${posts.map((post) => `<article><h2><a href="/${post.path}">${escapeHtml(post.title)}</a></h2><p>${escapeHtml(post.desc)}</p><a href="/${post.path}">Lire l'article</a></article>`).join("\n        ")}
      </section>
    </main>`,
  });
}

const cssPatch = `

/* seo-blog-depth-v107 */
.notice {
  margin: 24px 0;
  padding: 18px;
  border: 1px solid #e4c16f;
  border-radius: 8px;
  background: #fff8e6;
}

.notice strong {
  display: block;
  margin-bottom: 6px;
  color: #684810;
}

.article section {
  margin-top: 28px;
}

.article-links {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
  gap: 12px;
}

.article-links a {
  padding: 14px;
  border: 1px solid #dce6e1;
  border-radius: 8px;
  background: #fff;
  color: #123c32;
  font-weight: 900;
  text-decoration: none;
}
`;

async function writePage(filePath, content) {
  const dir = filePath.includes("/") ? filePath.split("/").slice(0, -1).join("/") : ".";
  await mkdir(dir, { recursive: true });
  await writeFile(filePath, content, "utf8");
}

async function patchTextFile(filePath, patcher) {
  const input = await readFile(filePath, "utf8");
  const output = patcher(input);
  if (output !== input) await writeFile(filePath, output, "utf8");
}

await writePage("blog/index.html", blogIndex());
for (const post of posts) await writePage(post.path, blogPost(post));
await patchTextFile("seo-pages.css", (css) => css.includes("seo-blog-depth-v107") ? css : `${css.trimEnd()}${cssPatch}`);
console.log("SEO blog depth patch v107 applied.");
