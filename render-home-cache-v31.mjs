import { readFile, writeFile } from "node:fs/promises";

const INDEX_FILE = new URL("./index.html", import.meta.url);
const SERVICE_WORKER_FILE = new URL("./service-worker.js", import.meta.url);

async function patchFile(fileUrl, patcher) {
  const original = await readFile(fileUrl, "utf8");
  const patched = patcher(original);
  if (patched !== original) {
    await writeFile(fileUrl, patched, "utf8");
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

await patchFile(INDEX_FILE, (code) => {
  let next = code
    .replace(/styles\.css\?v=\d+/g, "styles.css?v=33")
    .replace(/app\.js\?v=\d+/g, "app.js?v=33")
    .replace(/assets\/logo-escape\.svg(?:\?v=\d+)?/g, "assets/logo-escape.svg?v=33");

  for (const [from, to] of textFixes) {
    next = next.replaceAll(from, to);
  }

  return next;
});

await patchFile(SERVICE_WORKER_FILE, (code) => {
  let next = code.replace(/escape-erezee-v\d+/, "escape-erezee-v33");
  next = next.replace(/\.\/assets\/logo-escape\.svg(?:\?v=\d+)?/g, "./assets/logo-escape.svg?v=33");

  if (!next.includes("./assets/logo-escape.svg?v=33")) {
    next = next.replace(/(\s+"\.\/assets\/icon\.svg",)/, `$1\n  "./assets/logo-escape.svg?v=33",`);
  }

  return next;
});
