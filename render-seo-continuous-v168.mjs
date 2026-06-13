import { mkdir, readFile, writeFile } from 'node:fs/promises';

const VERSION = 168;
const ORIGIN = 'https://escape-erezee.be';
const RESERVE_URL = '/index.html#shop';
const ASSET_VERSION = 158;

const images = {
  escape: `/assets/seo/escape-game-ardenne-v${ASSET_VERSION}.svg?v=${ASSET_VERSION}`,
  family: `/assets/seo/activite-famille-ardenne-v${ASSET_VERSION}.svg?v=${ASSET_VERSION}`,
  treasure: `/assets/seo/chasse-tresor-ardenne-v${ASSET_VERSION}.svg?v=${ASSET_VERSION}`,
  erezee: `/assets/seo/activite-touristique-erezee-v${ASSET_VERSION}.svg?v=${ASSET_VERSION}`,
  durbuy: `/assets/seo/activite-pres-durbuy-v${ASSET_VERSION}.svg?v=${ASSET_VERSION}`,
  blog: `/assets/seo/blog-ardenne-v${ASSET_VERSION}.svg?v=${ASSET_VERSION}`,
};

const existingPosts = [
  {
    path: 'blog/que-faire-a-erezee.html',
    title: 'Que faire à Érezée ?',
    desc: "Idées d'activités à Érezée : balade, patrimoine, nature, activité famille et escape game extérieur en Ardenne.",
    image: images.erezee,
  },
  {
    path: 'blog/que-faire-pres-de-durbuy.html',
    title: 'Que faire près de Durbuy ?',
    desc: "Activités près de Durbuy : sorties extérieures, famille, nature, chasse au trésor et escape game à Érezée.",
    image: images.durbuy,
  },
  {
    path: 'blog/activites-familiales-ardenne-belge.html',
    title: 'Activités familiales en Ardenne belge',
    desc: "Sélection d'activités familiales en Ardenne belge : promenade, nature, énigmes, chasse au trésor et sortie extérieure.",
    image: images.family,
  },
  {
    path: 'blog/top-10-activites-exterieures-ardenne.html',
    title: 'Top 10 des activités extérieures en Ardenne',
    desc: "Top 10 des activités extérieures en Ardenne : randonnée, vélo, patrimoine, chasse au trésor et escape game extérieur.",
    image: images.blog,
  },
  {
    path: 'blog/que-faire-vacances-ardenne.html',
    title: 'Que faire pendant les vacances en Ardenne ?',
    desc: "Idées pour les vacances en Ardenne : activités familiales, sorties nature, visites et escape game extérieur à Érezée.",
    image: images.treasure,
  },
];

const newPosts = [
  {
    path: 'blog/activite-enfant-erezee.html',
    title: 'Activité enfant à Érezée : une sortie facile en Ardenne',
    desc: "Une idée d'activité enfant à Érezée : marcher, observer, résoudre des énigmes et découvrir l'Ardenne en famille.",
    image: images.family,
    intro: "Quand on cherche une activité avec des enfants à Érezée, le bon équilibre est simple : assez de mouvement pour se défouler, assez d'histoire pour éveiller la curiosité, et un objectif clair pour garder l'envie d'avancer.",
    sections: [
      ['Pourquoi le jeu fonctionne avec les enfants', "Un parcours d'énigmes transforme la balade en mission. Les enfants repèrent les détails, proposent des réponses et participent vraiment, pendant que les adultes gardent le rythme et relisent les consignes si nécessaire."],
      ['Une activité qui reste souple', "Le format sur smartphone permet de faire une pause, de prendre le temps d'observer ou de relancer une étape sans pression. C'est pratique pour les familles qui veulent une sortie structurée sans horaire trop rigide."],
      ['Conseils avant de partir', "Prévoyez un téléphone chargé, une batterie externe si possible, de l'eau et des chaussures adaptées. Vérifiez aussi la météo et les éventuelles informations locales liées aux périodes de chasse."],
      ['Pour quel âge ?', "Les parcours sont pensés comme une activité à vivre ensemble. Les enfants accompagnés peuvent chercher les indices et participer aux réponses, surtout quand un adulte aide à lire les textes plus longs."],
    ],
    links: [
      ['/activite-famille-ardenne.html', 'Activité famille Ardenne'],
      ['/activite-touristique-erezee.html', 'Activité touristique à Érezée'],
      ['/blog/week-end-famille-ardenne.html', 'Week-end famille en Ardenne'],
    ],
  },
  {
    path: 'blog/escape-game-pres-de-durbuy.html',
    title: 'Escape game près de Durbuy : une alternative originale',
    desc: "Découvrez un escape game extérieur près de Durbuy, à Érezée, pour jouer dehors en équipe pendant un séjour en Ardenne.",
    image: images.escape,
    intro: "Durbuy attire beaucoup de visiteurs, mais une belle journée dans la région peut aussi passer par les villages et chemins alentours. À Érezée, l'escape game extérieur offre une activité originale à quelques kilomètres de Durbuy.",
    sections: [
      ['Changer des visites classiques', "Après une visite, un repas ou une promenade à Durbuy, un parcours d'énigmes donne une nouvelle énergie à la journée. Le groupe suit une carte, observe les lieux et progresse étape par étape."],
      ['Un format pratique pendant un séjour', "L'achat en ligne donne accès à un code. Vous pouvez ensuite organiser le départ selon votre planning, la météo et le rythme du groupe, sans réserver un créneau compliqué."],
      ['Pour familles, couples et amis', "Le jeu repose sur la coopération plutôt que sur la performance physique. Chacun peut contribuer : lire, observer, chercher une piste ou valider une réponse."],
      ['Bien préparer son parcours', "Gardez de la marge dans votre programme, chargez le téléphone et vérifiez les consignes locales. En période de chasse, respectez toujours les panneaux et les fermetures temporaires."],
    ],
    links: [
      ['/activite-pres-de-durbuy.html', 'Activité près de Durbuy'],
      ['/escape-game-exterieur-ardenne.html', 'Escape game extérieur Ardenne'],
      ['/blog/que-faire-pres-de-durbuy.html', 'Que faire près de Durbuy ?'],
    ],
  },
  {
    path: 'blog/week-end-famille-ardenne.html',
    title: 'Week-end famille en Ardenne : idée de programme autour d’Érezée',
    desc: "Préparez un week-end famille en Ardenne autour d'Érezée : nature, villages, énigmes, Durbuy et activité extérieure.",
    image: images.blog,
    intro: "Un week-end famille en Ardenne fonctionne bien quand le programme alterne moments calmes, découverte locale et activité qui donne un vrai souvenir commun. Érezée est une bonne base pour construire une journée simple et vivante.",
    sections: [
      ['Le matin : découvrir doucement la région', "Commencez par une balade courte, un village ou un point de vue. L'objectif est de prendre l'air sans épuiser tout le monde dès le début de la journée."],
      ["L'après-midi : lancer une aventure", "Un escape game extérieur permet de donner un fil rouge au séjour. Les enfants cherchent, les adultes guident, et l'équipe avance ensemble dans les paysages ardennais."],
      ['En fin de journée : garder du temps libre', "Prévoyez une pause, un repas ou une activité plus calme. Le parcours devient alors le moment fort de la journée, sans rendre le week-end trop chargé."],
      ['À vérifier avant le départ', "La météo, l'état des chemins, la batterie du téléphone et les informations locales de chasse méritent un rapide contrôle avant de lancer l'aventure."],
    ],
    links: [
      ['/activite-famille-ardenne.html', 'Activité famille Ardenne'],
      ['/blog/que-faire-vacances-ardenne.html', 'Que faire pendant les vacances en Ardenne ?'],
      ['/activite-pres-de-durbuy.html', 'Activité près de Durbuy'],
    ],
  },
  {
    path: 'blog/idee-sortie-groupe-ardenne.html',
    title: 'Idée de sortie groupe en Ardenne : jouer en équipe dehors',
    desc: "Une idée de sortie groupe en Ardenne : escape game extérieur, énigmes, coopération et découverte autour d'Érezée.",
    image: images.treasure,
    intro: "Pour une sortie en groupe, l'idéal est de trouver une activité où tout le monde a un rôle. L'escape game extérieur coche cette case : il faut observer, discuter, tester des idées et avancer ensemble.",
    sections: [
      ['Créer un objectif commun', "La progression par étapes évite que la sortie devienne une simple promenade. Le groupe sait ce qu'il cherche, où il en est, et ce qu'il lui reste à résoudre."],
      ['Faire participer tous les profils', "Les plus observateurs repèrent les détails, les plus logiques croisent les indices, et les plus organisés gardent le cap. La réussite vient de la coopération."],
      ['Une sortie simple à organiser', "Chaque équipe a besoin d'un smartphone chargé et d'un code d'accès. Le départ se fait sur place, avec les informations du briefing."],
      ['Penser à la sécurité', "Pour une sortie en extérieur, gardez le groupe ensemble, respectez les routes et chemins, et reportez l'activité si une zone est signalée fermée pendant la période de chasse."],
    ],
    links: [
      ['/chasse-au-tresor-ardenne.html', 'Chasse au trésor Ardenne'],
      ['/escape-game-exterieur-ardenne.html', 'Escape game extérieur Ardenne'],
      ['/blog/top-10-activites-exterieures-ardenne.html', 'Top 10 des activités extérieures en Ardenne'],
    ],
  },
  {
    path: 'blog/chasse-au-tresor-famille-ardenne.html',
    title: 'Chasse au trésor en famille en Ardenne',
    desc: "Organisez une chasse au trésor en famille en Ardenne : parcours extérieur, indices, carte smartphone et énigmes à Érezée.",
    image: images.treasure,
    intro: "La chasse au trésor reste une valeur sûre pour motiver une famille à marcher, chercher et observer. En Ardenne, le décor réel donne tout de suite plus de relief à l'aventure.",
    sections: [
      ['Un jeu qui donne envie d’avancer', "Chaque étape débloquée apporte une petite victoire. Les enfants restent impliqués, les adultes participent, et la promenade prend un rythme naturel."],
      ['Entre nature et patrimoine', "Les parcours à Érezée s'appuient sur les villages, les chemins et les détails visibles sur place. Ce n'est pas seulement un jeu sur écran : le terrain compte vraiment."],
      ['Avant de réserver', "Choisissez un moment où le groupe a le temps, vérifiez que le téléphone est chargé et préparez une tenue adaptée à la météo."],
      ['Pendant les périodes de chasse', "La sécurité passe avant le jeu. Consultez les informations locales et respectez les panneaux présents sur les chemins ou aux entrées de zones naturelles."],
    ],
    links: [
      ['/chasse-au-tresor-ardenne.html', 'Chasse au trésor Ardenne'],
      ['/activite-famille-ardenne.html', 'Activité famille Ardenne'],
      ['/blog/activite-enfant-erezee.html', 'Activité enfant à Érezée'],
    ],
  },
];

const allPosts = [...existingPosts, ...newPosts];

const faq = [
  ['Faut-il réserver avant de venir ?', "Oui, l'achat en ligne permet de recevoir le code d'accès et de préparer le départ tranquillement."],
  ['Faut-il internet pendant le parcours ?', 'Oui, une connexion mobile est recommandée pour charger la carte, synchroniser la progression et valider les étapes.'],
  ['Peut-on jouer avec des enfants ?', 'Oui, les enfants peuvent participer avec des adultes. Les énigmes demandent surtout observation, logique et coopération.'],
  ['Que faire pendant les périodes de chasse ?', 'Vérifiez les informations locales, respectez les panneaux et reportez le parcours si une zone est fermée ou signalée.'],
];

const sitemapPages = [
  { path: '/', priority: '1.0', changefreq: 'weekly' },
  { path: '/escape-game-exterieur-ardenne.html', priority: '0.9', changefreq: 'monthly' },
  { path: '/activite-famille-ardenne.html', priority: '0.85', changefreq: 'monthly' },
  { path: '/chasse-au-tresor-ardenne.html', priority: '0.85', changefreq: 'monthly' },
  { path: '/activite-touristique-erezee.html', priority: '0.85', changefreq: 'monthly' },
  { path: '/activite-pres-de-durbuy.html', priority: '0.85', changefreq: 'monthly' },
  { path: '/blog/', priority: '0.8', changefreq: 'weekly' },
  ...allPosts.map((post) => ({ path: `/${post.path}`, priority: '0.74', changefreq: 'monthly' })),
];

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function jsonLd(value) {
  return JSON.stringify(value).replace(/</g, '\\u003c');
}

function canonicalFor(pathname) {
  return `${ORIGIN}/${pathname}`.replace(/\/index\.html$/, '/');
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
    <link rel="stylesheet" href="/seo-pages.css?v=${VERSION}" />
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

function articleSchema(post) {
  const canonical = canonicalFor(post.path);
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Article',
        headline: post.title,
        description: post.desc,
        image: `${ORIGIN}${post.image}`,
        mainEntityOfPage: canonical,
        author: { '@type': 'Organization', name: 'Stock & Sevrin Escape Games' },
        publisher: {
          '@type': 'Organization',
          name: 'Stock & Sevrin Escape Games',
          logo: { '@type': 'ImageObject', url: `${ORIGIN}/assets/logo-stock-sevrin-v90.jpg` },
        },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Accueil', item: ORIGIN },
          { '@type': 'ListItem', position: 2, name: 'Blog', item: `${ORIGIN}/blog/` },
          { '@type': 'ListItem', position: 3, name: post.title, item: canonical },
        ],
      },
      {
        '@type': 'FAQPage',
        mainEntity: faq.map(([question, answer]) => ({
          '@type': 'Question',
          name: question,
          acceptedAnswer: { '@type': 'Answer', text: answer },
        })),
      },
    ],
  };
}

function faqBlock() {
  return `<section class="faq" aria-labelledby="faq-title">
    <p class="eyebrow">FAQ</p>
    <h2 id="faq-title">Questions fréquentes</h2>
    ${faq.map(([question, answer]) => `<details><summary>${escapeHtml(question)}</summary><p>${escapeHtml(answer)}</p></details>`).join('\n    ')}
  </section>`;
}

function huntingNotice() {
  return `<aside class="notice">
    <strong>Prudence pendant les périodes de chasse</strong>
    <p>Avant de partir, vérifiez les informations locales, respectez les panneaux sur place et reportez le parcours si une zone est fermée.</p>
  </aside>`;
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
        <img src="${post.image}" alt="" loading="eager" decoding="async" fetchpriority="high" />
        <p class="lead">${escapeHtml(post.intro)}</p>
        ${post.sections.map(([heading, text]) => `<section><h2>${escapeHtml(heading)}</h2><p>${escapeHtml(text)}</p></section>`).join('\n        ')}
        ${huntingNotice()}
        <section>
          <h2>À lire aussi</h2>
          <div class="article-links">
            ${post.links.map(([href, label]) => `<a href="${href}">${escapeHtml(label)}</a>`).join('\n            ')}
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
    title: 'Blog et actualités Ardenne',
    desc: "Conseils, idées de sorties et contenus SEO autour d'Érezée, Durbuy et l'Ardenne belge.",
    path: 'blog/index.html',
    image: images.blog,
    schema: {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: 'Blog et actualités Ardenne',
      url: `${ORIGIN}/blog/`,
      hasPart: allPosts.map((post) => ({ '@type': 'Article', headline: post.title, url: canonicalFor(post.path) })),
    },
    children: `<main>
      <section class="hero hero-compact">
        <div>
          <p class="eyebrow">Blog</p>
          <h1>Idées de sorties en Ardenne</h1>
          <p>Articles pratiques pour préparer une activité à Érezée, près de Durbuy ou en famille en Ardenne belge.</p>
          <a class="button" href="${RESERVE_URL}">Voir les parcours</a>
        </div>
        <img src="${images.blog}" alt="" loading="eager" decoding="async" fetchpriority="high" />
      </section>
      <section class="seo-next-v168" aria-labelledby="seo-next-title">
        <p class="eyebrow">Contenus continus</p>
        <h2 id="seo-next-title">Nouveaux guides locaux</h2>
        <p>Ces articles renforcent les recherches locales autour des familles, groupes, enfants, Durbuy et activités extérieures en Ardenne.</p>
      </section>
      <section class="article-list" aria-label="Articles">
        ${allPosts.map((post) => `<article><img src="${post.image}" alt="" loading="lazy" decoding="async" /><h2><a href="/${post.path}">${escapeHtml(post.title)}</a></h2><p>${escapeHtml(post.desc)}</p><a href="/${post.path}">Lire l'article</a></article>`).join('\n        ')}
      </section>
    </main>`,
  });
}

async function readOptional(filePath) {
  try {
    return await readFile(filePath, 'utf8');
  } catch (error) {
    if (error.code === 'ENOENT') return null;
    throw error;
  }
}

async function patchOptional(filePath, patcher) {
  const input = await readOptional(filePath);
  if (input === null) return false;
  const output = patcher(input, filePath);
  if (output !== input) {
    await writeFile(filePath, output, 'utf8');
    return true;
  }
  return false;
}

async function writePage(filePath, content) {
  const dir = filePath.includes('/') ? filePath.split('/').slice(0, -1).join('/') : '.';
  await mkdir(dir, { recursive: true });
  await writeFile(filePath, content, 'utf8');
}

function replaceFunction(source, functionName, replacement) {
  const start = source.indexOf(`function ${functionName}(`);
  if (start === -1) throw new Error(`Patch v${VERSION} introuvable: ${functionName}`);
  const bodyStart = source.indexOf('{', start);
  if (bodyStart === -1) throw new Error(`Patch v${VERSION} impossible: ${functionName}`);
  let depth = 0;
  let quote = null;
  let escaped = false;
  for (let index = bodyStart; index < source.length; index += 1) {
    const char = source[index];
    if (quote) {
      if (escaped) escaped = false;
      else if (char === '\\') escaped = true;
      else if (char === quote) quote = null;
      continue;
    }
    if (char === '"' || char === "'" || char === '`') {
      quote = char;
      continue;
    }
    if (char === '{') depth += 1;
    if (char === '}') {
      depth -= 1;
      if (depth === 0) return `${source.slice(0, start)}${replacement}${source.slice(index + 1)}`;
    }
  }
  throw new Error(`Patch v${VERSION} impossible: ${functionName}`);
}

function buildSitemapXml(routes, origin) {
  const lastmod = new Date().toISOString().slice(0, 10);
  const staticPages = SEO_STATIC_PAGES_V168.map((entry) => ({
    url: `${origin}${entry.path}`,
    priority: entry.priority,
    changefreq: entry.changefreq,
  }));
  const routePages = (Array.isArray(routes) ? routes : []).map((route) => ({
    url: `${origin}${getRoutePublicPath(route)}`,
    priority: '0.9',
    changefreq: 'weekly',
  }));
  const seen = new Set();
  const entries = [...staticPages, ...routePages].filter((entry) => {
    if (!entry.url || seen.has(entry.url)) return false;
    seen.add(entry.url);
    return true;
  });
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.map((entry) => `  <url>
    <loc>${escapeXml(entry.url)}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${entry.changefreq}</changefreq>
    <priority>${entry.priority}</priority>
  </url>`).join('\n')}
</urlset>
`;
}

function bumpVersions(text) {
  let next = text;
  for (let version = 1; version <= VERSION; version += 1) {
    next = next.split(`styles.css?v=${version}`).join(`styles.css?v=${VERSION}`);
    next = next.split(`app.js?v=${version}`).join(`app.js?v=${VERSION}`);
    next = next.split(`seo-pages.css?v=${version}`).join(`seo-pages.css?v=${VERSION}`);
    next = next.split(`escape-erezee-v${version}`).join(`escape-erezee-v${VERSION}`);
  }
  return next;
}

function patchServer(server) {
  let next = bumpVersions(server);
  if (!next.includes('SEO_STATIC_PAGES_V168')) {
    const replacement = `const SEO_STATIC_PAGES_V168 = ${JSON.stringify(sitemapPages, null, 2)};\n\n${buildSitemapXml.toString()}`;
    next = replaceFunction(next, 'buildSitemapXml', replacement);
  }

  next = next
    .replace(
      "{ label: 'Article: Activite enfant Erezee', path: '/blog/activite-enfant-erezee.html', keywords: ['enfant', 'Erezee'], optional: true }",
      "{ label: 'Article: Activite enfant Erezee', path: '/blog/activite-enfant-erezee.html', keywords: ['enfant', 'Erezee'], content: true }",
    )
    .replace(
      "{ label: 'Article: Escape game pres de Durbuy', path: '/blog/escape-game-pres-de-durbuy.html', keywords: ['escape game', 'Durbuy'], optional: true }",
      "{ label: 'Article: Escape game pres de Durbuy', path: '/blog/escape-game-pres-de-durbuy.html', keywords: ['escape game', 'Durbuy'], content: true }",
    )
    .replace(
      "{ label: 'Article: Week-end famille Ardenne', path: '/blog/week-end-famille-ardenne.html', keywords: ['week-end', 'famille'], optional: true }",
      "{ label: 'Article: Week-end famille Ardenne', path: '/blog/week-end-famille-ardenne.html', keywords: ['week-end', 'famille'], content: true }",
    );

  if (!next.includes("path: '/blog/idee-sortie-groupe-ardenne.html'")) {
    const needle = "    { label: 'Article: Week-end famille Ardenne', path: '/blog/week-end-famille-ardenne.html', keywords: ['week-end', 'famille'], content: true },";
    const insertion = `${needle}\n    { label: 'Article: Sortie groupe Ardenne', path: '/blog/idee-sortie-groupe-ardenne.html', keywords: ['groupe', 'Ardenne'], content: true },\n    { label: 'Article: Chasse au tresor famille Ardenne', path: '/blog/chasse-au-tresor-famille-ardenne.html', keywords: ['chasse', 'famille'], content: true },`;
    if (next.includes(needle)) next = next.replace(needle, insertion);
  }

  next = next.replace(
    "'escape game pres de Durbuy',",
    "'escape game pres de Durbuy',\n      'activite enfant Erezee',\n      'week-end famille Ardenne',\n      'chasse au tresor famille Ardenne',\n      'sortie groupe Ardenne',",
  );
  return next;
}

function patchSeoCss(css) {
  let next = bumpVersions(css);
  const marker = `/* seo-continuous-v${VERSION} */`;
  if (next.includes(marker)) return next;
  return `${next.trimEnd()}

${marker}
.seo-next-v168 {
  margin-top: 34px;
  padding: 22px;
  border: 1px solid #dce6e1;
  border-radius: 8px;
  background: #fff;
}

.article-list article img {
  width: 100%;
  aspect-ratio: 16 / 9;
  object-fit: cover;
  border-radius: 8px;
  margin-bottom: 12px;
}

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
`;
}

await writePage('blog/index.html', blogIndex());
for (const post of newPosts) await writePage(post.path, blogPost(post));

await patchOptional('server.mjs', patchServer);
await patchOptional('seo-pages.css', patchSeoCss);

const publicFiles = [
  'index.html',
  'suivi.html',
  'app.js',
  'styles.css',
  'service-worker.js',
  ...existingPosts.map((post) => post.path),
];
for (const file of publicFiles) await patchOptional(file, bumpVersions);

console.log(`SEO continuous content v${VERSION} applied.`);
