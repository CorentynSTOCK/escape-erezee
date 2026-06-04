import { readFile, writeFile } from "node:fs/promises";

const VERSION = 109;
const ORIGIN = "https://escape-erezee.be";

const pages = [
  {
    path: "escape-game-exterieur-ardenne.html",
    title: "Escape game extérieur Ardenne",
    desc: "Vivez un escape game extérieur en Ardenne belge avec énigmes, carte sur smartphone et parcours à faire en équipe.",
    image: "/assets/home-hero-vicinal-v90.jpg?v=90",
  },
  {
    path: "activite-famille-ardenne.html",
    title: "Activité famille Ardenne",
    desc: "Une activité famille en Ardenne belge pour marcher, observer et résoudre des énigmes ensemble à Érezée.",
    image: "/assets/home-hero-ardenne-v88.jpg?v=88",
  },
  {
    path: "chasse-au-tresor-ardenne.html",
    title: "Chasse au trésor Ardenne",
    desc: "Chasse au trésor moderne en Ardenne : suivez la carte, résolvez les énigmes et débloquez les étapes du parcours.",
    image: "/assets/home-hero-vicinal-v90.jpg?v=90",
  },
  {
    path: "activite-touristique-erezee.html",
    title: "Activité touristique Érezée",
    desc: "Découvrez Érezée autrement avec une activité touristique extérieure mêlant balade, patrimoine local et énigmes.",
    image: "/assets/home-hero-vicinal-v90.jpg?v=90",
  },
  {
    path: "activite-pres-de-durbuy.html",
    title: "Activité près de Durbuy",
    desc: "Une activité originale près de Durbuy : escape game extérieur et chasse au trésor à Érezée, en Ardenne belge.",
    image: "/assets/home-hero-ardenne-v88.jpg?v=88",
  },
];

const faq = [
  ["Faut-il internet ?", "Oui, une connexion mobile est recommandée pour charger la carte, synchroniser la progression et valider les étapes."],
  ["Combien de temps durent les parcours ?", "La durée dépend du parcours et du rythme de l'équipe. Prévoyez généralement une activité de plusieurs dizaines de minutes à quelques heures."],
  ["Peut-on jouer avec des enfants ?", "Oui, les enfants peuvent participer avec des adultes. Les énigmes demandent surtout observation, logique et coopération."],
  ["Les chiens sont-ils autorisés ?", "Les parcours se déroulent dehors. Les chiens peuvent accompagner l'équipe si les lieux traversés, la météo et la tenue en laisse le permettent."],
  ["Que faut-il prévoir ?", "Un smartphone chargé, des chaussures adaptées à la marche, le code reçu après achat et une équipe prête à observer."],
];

function canonicalFor(path) {
  return `${ORIGIN}/${path}`;
}

function absoluteImage(path) {
  return path.startsWith("http") ? path : `${ORIGIN}${path}`;
}

function jsonLd(value) {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

function schemaFor(page) {
  const canonical = canonicalFor(page.path);
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        name: page.title,
        description: page.desc,
        url: canonical,
        inLanguage: "fr-BE",
        isPartOf: {
          "@type": "WebSite",
          name: "Stock & Sevrin Escape Games",
          url: ORIGIN,
        },
        primaryImageOfPage: {
          "@type": "ImageObject",
          url: absoluteImage(page.image),
        },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Accueil", item: ORIGIN },
          { "@type": "ListItem", position: 2, name: page.title, item: canonical },
        ],
      },
      {
        "@type": "EntertainmentBusiness",
        name: "Stock & Sevrin Escape Games",
        url: ORIGIN,
        image: absoluteImage("/assets/logo-stock-sevrin-v90.jpg"),
        priceRange: "35-45 EUR",
        areaServed: [
          { "@type": "Place", name: "Érezée" },
          { "@type": "Place", name: "Durbuy" },
          { "@type": "AdministrativeArea", name: "Ardenne belge" },
        ],
        description: "Parcours d'escape game extérieur, chasse au trésor et activité touristique à Érezée.",
        address: {
          "@type": "PostalAddress",
          addressLocality: "Érezée",
          addressCountry: "BE",
        },
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

async function patchPage(page) {
  const input = await readFile(page.path, "utf8");
  let output = input
    .replace('content="index, follow"', 'content="index, follow, max-image-preview:large"')
    .replace('property="og:type" content="article"', 'property="og:type" content="website"');

  if (!output.includes("seo-landing-structured-data-v109")) {
    const script = `    <script type="application/ld+json" data-seo="seo-landing-structured-data-v109">${jsonLd(schemaFor(page))}</script>\n`;
    output = output.replace("  </head>", `${script}  </head>`);
  }

  if (output !== input) await writeFile(page.path, output, "utf8");
}

for (const page of pages) await patchPage(page);
console.log(`SEO landing structured data v${VERSION} applied.`);
