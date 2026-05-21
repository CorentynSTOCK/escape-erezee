import { readFile, writeFile } from "node:fs/promises";

const INDEX_FILE = new URL("./index.html", import.meta.url);
const SERVICE_WORKER_FILE = new URL("./service-worker.js", import.meta.url);
const SERVER_FILE = new URL("./server.mjs", import.meta.url);
const LOGO_B64_FILE = new URL("./assets/logo-escape.jpg.b64", import.meta.url);
const LOGO_JPG_FILE = new URL("./assets/logo-escape.jpg", import.meta.url);
const LOGO_SVG_FILE = new URL("./assets/logo-escape.svg", import.meta.url);

async function patchFile(fileUrl, patcher) {
  const original = await readFile(fileUrl, "utf8");
  const patched = patcher(original);
  if (patched !== original) {
    await writeFile(fileUrl, patched, "utf8");
  }
}

async function writeLogoAsset() {
  let encoded = "";
  try {
    encoded = (await readFile(LOGO_B64_FILE, "utf8")).replace(/\s+/g, "");
  } catch {}
  if (!encoded) {
    try {
      const svg = await readFile(LOGO_SVG_FILE, "utf8");
      encoded = svg.match(/base64,([^"']+)/)?.[1]?.replace(/\s+/g, "") || "";
    } catch {}
  }
  if (encoded) {
    await writeFile(LOGO_JPG_FILE, Buffer.from(encoded, "base64"));
  }
}

const textFixes = [
  ["Presentation de Stock et Sevrin Escape Games", "Présentation de Stock et Sevrin Escape Games"],
  ["Escape game exterieur a Erezee", "Escape game extérieur à Erezée"],
  ["Une aventure grandeur nature au coeur de la region", "Une aventure grandeur nature au cœur de la région"],
  ["Une aventure grandeur nature au coeur de la région", "Une aventure grandeur nature au cœur de la région"],
  ["Explorez Erezee en equipe, avancez de lieu en lieu grace a la carte,", "Explorez Erezée en équipe, avancez de lieu en lieu grâce à la carte,"],
  ["debloquez les enigmes sur place et tentez de terminer le parcours avant", "débloquez les énigmes sur place et tentez de terminer le parcours avant"],
  ["J'ai deja un code", "J’ai déjà un code"],
  ["Un jeu d'enigmes qui se vit dehors", "Un jeu d’énigmes qui se vit dehors"],
  ["Chaque parcours vous emmene dans les environs d'Erezee avec une suite", "Chaque parcours vous emmène dans les environs d’Erezée avec une suite"],
  ["d'etapes a rejoindre reellement. Une fois dans la bonne zone, l'application", "d’étapes à rejoindre réellement. Une fois dans la bonne zone, l’application"],
  ["debloque l'enigme suivante: reponse ecrite, observation, photo ou indice a", "débloque l’énigme suivante: réponse écrite, observation, photo ou indice à"],
  ["Deroulement de l'aventure", "Déroulement de l’aventure"],
  ["Selectionnez l'aventure qui vous convient, selon la duree, la saison et le niveau de balade.", "Sélectionnez l’aventure qui vous convient, selon la durée, la saison et le niveau de balade."],
  ["Apres l'achat, le code d'activation ouvre la partie sur telephone, tablette ou ordinateur.", "Après l’achat, le code d’activation ouvre la partie sur téléphone, tablette ou ordinateur."],
  ["La carte vous guide vers les zones a atteindre pour reveler les enigmes du parcours.", "La carte vous guide vers les zones à atteindre pour révéler les énigmes du parcours."],
  ["Resolvez avant la fin", "Résolvez avant la fin"],
  ["Repondez aux defis, utilisez les indices si besoin, puis comparez votre temps au classement.", "Répondez aux défis, utilisez les indices si besoin, puis comparez votre temps au classement."],
  ["Prevoyez juste l'essentiel", "Prévoyez juste l’essentiel"],
  ["Un smartphone charge avec la geolocalisation autorisee.", "Un smartphone chargé avec la géolocalisation autorisée."],
  ["Une equipe prete a observer les details autour d'elle.", "Une équipe prête à observer les détails autour d’elle."],
  ["Des chaussures adaptees a une balade exterieure.", "Des chaussures adaptées à une balade extérieure."],
  ["Le code recu apres l'achat du parcours.", "Le code reçu après l’achat du parcours."],
];

await writeLogoAsset();

await patchFile(INDEX_FILE, (code) => {
  let next = code
    .replace(/styles\.css\?v=\d+/g, "styles.css?v=36")
    .replace(/app\.js\?v=\d+/g, "app.js?v=36")
    .replace(/assets\/logo-escape\.(?:svg|jpg)(?:\?v=\d+)?/g, "assets/logo-escape.jpg?v=36");

  for (const [from, to] of textFixes) {
    next = next.replaceAll(from, to);
  }

  return next;
});

await patchFile(SERVER_FILE, (code) => {
  if (code.includes('".jpg": "image/jpeg"')) return code;
  return code.replace(
    /(\s+"\.html": "text\/html; charset=utf-8",)/,
    `$1\n  ".jpg": "image/jpeg",\n  ".jpeg": "image/jpeg",`,
  );
});

await patchFile(SERVICE_WORKER_FILE, (code) => {
  let next = code.replace(/escape-erezee-v\d+/, "escape-erezee-v36");
  next = next.replace(/\.\/assets\/logo-escape\.(?:svg|jpg)(?:\?v=\d+)?/g, "./assets/logo-escape.jpg?v=36");

  if (!next.includes("./assets/logo-escape.jpg?v=36")) {
    next = next.replace(/(\s+"\.\/assets\/icon\.svg",)/, `$1\n  "./assets/logo-escape.jpg?v=36",`);
  }

  return next;
});
