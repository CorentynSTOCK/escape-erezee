import { readFile, writeFile } from 'node:fs/promises';

const VERSION = 148;
const MARKER = 'player-i18n-stability-v148';

async function patchTextFile(filePath, patcher) {
  const input = await readFile(filePath, 'utf8');
  const output = patcher(input);
  if (output !== input) await writeFile(filePath, output, 'utf8');
}

function bumpAppReferences(text) {
  return text
    .replace(/app\.js\?v=\d+/g, `app.js?v=${VERSION}`)
    .replace(/escape-erezee-v\d+/g, `escape-erezee-v${VERSION}`);
}

const APP_PATCH = String.raw`
/* player-i18n-stability-v148 */
(function installPlayerI18nStabilityV148() {
  if (window.__playerI18nStabilityV148) return;
  window.__playerI18nStabilityV148 = true;

  const exact = {
    en: {
      "etat du jeu": "Game status",
      "synchronisation": "Sync",
      "connexion et position en attente.": "Connection and position pending.",
      "mode local": "Local mode",
      "le serveur n'est pas disponible sur cette adresse. gardez cette page ouverte.": "The server is not available from this address. Keep this page open.",
      "serveur en attente": "Server pending",
      "nouvel essai automatique en cours. appuyez sur resynchroniser si l'ecran semble fige.": "Automatic retry in progress. Tap Resync if the screen seems frozen.",
      "depart valide": "Start confirmed",
      "position de depart confirmee.": "Start position confirmed.",
      "gps a confirmer": "GPS to confirm",
      "localisez-vous au point de depart avant de lancer l'aventure.": "Go to the start point and confirm your location before starting the adventure.",
      "partie terminee": "Game finished",
      "resultat conserve.": "Result saved.",
      "gps a verifier": "GPS needs attention",
      "autorisez la localisation puis relancez le suivi si la carte ne bouge plus.": "Allow location access, then restart tracking if the map no longer moves.",
      "position en attente": "Waiting for position",
      "activez le suivi gps pour envoyer l'avancee a la gestion.": "Enable GPS tracking to send progress to the admin.",
      "position figee": "Position frozen",
      "position peu recente": "Position not recent",
      "le suivi va se relancer.": "Tracking will restart.",
      "suivi actif": "Tracking active",
      "contact serveur en attente.": "Waiting for server contact.",
      "resynchroniser": "Resync",
      "synchronisation en cours...": "Sync in progress...",
      "position non disponible. verifiez l'autorisation gps puis reessayez.": "Position unavailable. Check GPS permission and try again.",
      "la geolocalisation n'est pas disponible sur cet appareil.": "Location is not available on this device.",
      "suivi gps actif. la position est aussi visible dans la gestion.": "GPS tracking is active. The position is also visible in the admin.",
      "suivi gps actif. la carte et la gestion vont se mettre a jour automatiquement.": "GPS tracking is active. The map and admin will update automatically.",
      "actualiser ma position": "Refresh my position",
      "me localiser au depart": "Locate me at the start",
      "me geolocaliser": "Locate me",
      "aucune zone gps de depart n'est configuree pour ce parcours. vous pouvez commencer.": "No GPS start zone is configured for this route. You can start.",
      "localisez votre equipe au point de depart avant de commencer l'aventure.": "Locate your team at the start point before beginning the adventure.",
      "position validee au point de depart. vous pouvez commencer.": "Position confirmed at the start point. You can begin.",
      "recherche de votre position au point de depart...": "Searching for your position at the start point...",
      "pret": "Ready",
      "en cours": "In progress",
      "gagne": "Won",
      "perdu": "Lost",
      "briefing": "Briefing",
      "parcours termine": "Route completed",
      "parcours reussi": "Route completed",
      "partie perdue": "Game lost",
      "felicitations !": "Congratulations!",
      "le temps est ecoule": "Time is up",
      "non classe": "Unranked",
      "aucune equipe gagnante pour le moment": "No winning team yet",
      "enigme": "puzzle",
      "enigmes": "puzzles",
      "reponse": "Answer",
      "valider": "Submit",
      "photo demandee": "Photo requested",
      "aucune photo selectionnee": "No photo selected",
      "envoyer la photo": "Send photo",
      "modifier": "Edit",
      "changer de code": "Change code"
    },
    nl: {
      "etat du jeu": "Spelstatus",
      "synchronisation": "Synchronisatie",
      "connexion et position en attente.": "Verbinding en positie in afwachting.",
      "mode local": "Lokale modus",
      "le serveur n'est pas disponible sur cette adresse. gardez cette page ouverte.": "De server is niet beschikbaar via dit adres. Houd deze pagina open.",
      "serveur en attente": "Server in afwachting",
      "nouvel essai automatique en cours. appuyez sur resynchroniser si l'ecran semble fige.": "Automatische nieuwe poging bezig. Tik op opnieuw synchroniseren als het scherm vast lijkt te zitten.",
      "depart valide": "Start bevestigd",
      "position de depart confirmee.": "Startpositie bevestigd.",
      "gps a confirmer": "GPS te bevestigen",
      "localisez-vous au point de depart avant de lancer l'aventure.": "Ga naar het startpunt en bevestig je locatie voordat je begint.",
      "partie terminee": "Spel afgelopen",
      "resultat conserve.": "Resultaat bewaard.",
      "gps a verifier": "GPS controleren",
      "autorisez la localisation puis relancez le suivi si la carte ne bouge plus.": "Sta locatie toe en start de tracking opnieuw als de kaart niet meer beweegt.",
      "position en attente": "Wachten op positie",
      "activez le suivi gps pour envoyer l'avancee a la gestion.": "Schakel GPS-tracking in om de voortgang naar het beheer te sturen.",
      "position figee": "Positie vastgelopen",
      "position peu recente": "Positie niet recent",
      "le suivi va se relancer.": "De tracking wordt opnieuw gestart.",
      "suivi actif": "Tracking actief",
      "contact serveur en attente.": "Wachten op servercontact.",
      "resynchroniser": "Opnieuw syncen",
      "synchronisation en cours...": "Synchronisatie bezig...",
      "position non disponible. verifiez l'autorisation gps puis reessayez.": "Positie niet beschikbaar. Controleer de GPS-toestemming en probeer opnieuw.",
      "la geolocalisation n'est pas disponible sur cet appareil.": "Locatie is niet beschikbaar op dit toestel.",
      "suivi gps actif. la position est aussi visible dans la gestion.": "GPS-tracking is actief. De positie is ook zichtbaar in het beheer.",
      "suivi gps actif. la carte et la gestion vont se mettre a jour automatiquement.": "GPS-tracking is actief. De kaart en het beheer worden automatisch bijgewerkt.",
      "actualiser ma position": "Mijn positie vernieuwen",
      "me localiser au depart": "Lokaliseer mij bij de start",
      "me geolocaliser": "Lokaliseer mij",
      "aucune zone gps de depart n'est configuree pour ce parcours. vous pouvez commencer.": "Er is geen GPS-startzone ingesteld voor deze route. Je kunt beginnen.",
      "localisez votre equipe au point de depart avant de commencer l'aventure.": "Lokaliseer je team bij het startpunt voordat je begint.",
      "position validee au point de depart. vous pouvez commencer.": "Positie bevestigd bij het startpunt. Je kunt beginnen.",
      "recherche de votre position au point de depart...": "Zoeken naar je positie bij het startpunt...",
      "pret": "Klaar",
      "en cours": "Bezig",
      "gagne": "Gewonnen",
      "perdu": "Verloren",
      "briefing": "Briefing",
      "parcours termine": "Route voltooid",
      "parcours reussi": "Route voltooid",
      "partie perdue": "Spel verloren",
      "felicitations !": "Gefeliciteerd!",
      "le temps est ecoule": "De tijd is om",
      "non classe": "Niet geklasseerd",
      "aucune equipe gagnante pour le moment": "Nog geen winnend team",
      "enigme": "raadsel",
      "enigmes": "raadsels",
      "reponse": "Antwoord",
      "valider": "Bevestigen",
      "photo demandee": "Foto gevraagd",
      "aucune photo selectionnee": "Geen foto geselecteerd",
      "envoyer la photo": "Foto verzenden",
      "modifier": "Wijzigen",
      "changer de code": "Code wijzigen"
    }
  };

  function langV148() {
    const active = document.querySelector("#language-switcher [aria-pressed='true'], #language-switcher .is-active");
    const candidate = active?.dataset?.lang || window.escapeErezeeLanguage || (document.documentElement.lang || "fr").slice(0, 2);
    return ["fr", "en", "nl"].includes(candidate) ? candidate : "fr";
  }

  function keyV148(value) {
    return String(value == null ? "" : value)
      .replace(/&amp;#039;|&#039;/g, "'")
      .replace(/[’\`]/g, "'")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase();
  }

  function translateRelativeV148(value, lang) {
    const key = keyV148(value);
    if (lang === "fr") return value;
    if (key === "jamais") return lang === "nl" ? "nooit" : "never";
    if (key === "a l'instant") return lang === "nl" ? "net nu" : "just now";
    let match = key.match(/^il y a (\d+) s$/);
    if (match) return lang === "nl" ? match[1] + " sec geleden" : match[1] + " sec ago";
    match = key.match(/^il y a (\d+) min$/);
    if (match) return lang === "nl" ? match[1] + " min geleden" : match[1] + " min ago";
    match = key.match(/^il y a (\d+) h$/);
    if (match) return lang === "nl" ? match[1] + " u geleden" : match[1] + " h ago";
    return value;
  }

  function translateDynamicV148(value) {
    const original = String(value == null ? "" : value);
    const trimmed = original.trim();
    if (!trimmed) return original;
    const lang = langV148();
    if (lang === "fr") return original;

    const dictionary = exact[lang] || {};
    const normalized = keyV148(trimmed);
    let translated = dictionary[normalized] || "";

    let match;
    if (!translated && (match = normalized.match(/^equipe (\d+)$/))) {
      translated = lang === "nl" ? "Team " + match[1] : "Team " + match[1];
    }
    if (!translated && (match = normalized.match(/^etape (\d+) \/ (\d+)$/))) {
      translated = lang === "nl" ? "Stap " + match[1] + " / " + match[2] : "Step " + match[1] + " / " + match[2];
    }
    if (!translated && (match = normalized.match(/^(\d+) \/ (\d+) enigmes?$/))) {
      translated = lang === "nl" ? match[1] + " / " + match[2] + " raadsels" : match[1] + " / " + match[2] + " puzzles";
    }
    if (!translated && (match = normalized.match(/^(\d+) enigmes?$/))) {
      translated = lang === "nl" ? match[1] + " raadsels" : match[1] + " puzzles";
    }
    if (!translated && (match = normalized.match(/^serveur contacte (.+)\.$/))) {
      translated = lang === "nl"
        ? "Server gecontacteerd " + translateRelativeV148(match[1], lang) + "."
        : "Server contacted " + translateRelativeV148(match[1], lang) + ".";
    }
    if (!translated && (match = normalized.match(/^derniere position recue (.+)\. appuyez sur resynchroniser\.$/))) {
      translated = lang === "nl"
        ? "Laatste positie ontvangen " + translateRelativeV148(match[1], lang) + ". Tik op opnieuw syncen."
        : "Last position received " + translateRelativeV148(match[1], lang) + ". Tap Resync.";
    }
    if (!translated && (match = normalized.match(/^derniere position recue (.+)\. le suivi va se relancer\.$/))) {
      translated = lang === "nl"
        ? "Laatste positie ontvangen " + translateRelativeV148(match[1], lang) + ". De tracking wordt opnieuw gestart."
        : "Last position received " + translateRelativeV148(match[1], lang) + ". Tracking will restart.";
    }
    if (!translated && (match = normalized.match(/^position envoyee (.+)\. (.+)$/))) {
      translated = lang === "nl"
        ? "Positie verzonden " + translateRelativeV148(match[1], lang) + ". " + translateDynamicV148(match[2])
        : "Position sent " + translateRelativeV148(match[1], lang) + ". " + translateDynamicV148(match[2]);
    }
    if (!translated && (match = normalized.match(/^vous etes dans la zone\.(.*)$/))) {
      translated = lang === "nl" ? "Je bent in de zone." + match[1] : "You are in the zone." + match[1];
    }
    if (!translated && (match = normalized.match(/^position mise a jour : encore (\d+) m avant la zone\.(.*)$/))) {
      translated = lang === "nl" ? "Positie bijgewerkt: nog " + match[1] + " m tot de zone." + match[2] : "Position updated: " + match[1] + " m left before the zone." + match[2];
    }
    if (!translated && (match = normalized.match(/^vous etes a (.+) du depart\. rapprochez-vous encore de (.+) pour commencer\.(.*)$/))) {
      translated = lang === "nl" ? "Je bent " + match[1] + " van de start. Kom nog " + match[2] + " dichterbij om te beginnen." + match[3] : "You are " + match[1] + " from the start. Move " + match[2] + " closer to begin." + match[3];
    }
    if (!translated && normalized.startsWith("precision +/-")) {
      translated = lang === "nl" ? trimmed.replace(/^Precision/i, "Nauwkeurigheid") : trimmed.replace(/^Precision/i, "Accuracy");
    }

    if (!translated) return original;
    return original.replace(trimmed, translated);
  }

  if (typeof escapeI18nTranslateText === "function") {
    const originalTranslateTextV148 = escapeI18nTranslateText;
    escapeI18nTranslateText = function translateTextWithPlayerDynamicsV148(value) {
      const translated = translateDynamicV148(value);
      if (translated !== String(value == null ? "" : value)) return translated;
      return originalTranslateTextV148.apply(this, arguments);
    };
  }

  if (typeof playerRescueRelativeTime === "function") {
    const originalRelativeTimeV148 = playerRescueRelativeTime;
    playerRescueRelativeTime = function playerRescueRelativeTimeI18nV148(timestamp) {
      return translateRelativeV148(originalRelativeTimeV148.apply(this, arguments), langV148());
    };
  }

  if (typeof playerRescueStatus === "function") {
    const originalStatusV148 = playerRescueStatus;
    playerRescueStatus = function playerRescueStatusI18nV148() {
      const status = originalStatusV148.apply(this, arguments);
      if (!status || langV148() === "fr") return status;
      return {
        ...status,
        title: translateDynamicV148(status.title),
        text: translateDynamicV148(status.text),
      };
    };
  }

  if (typeof setBriefingLocationMessage === "function") {
    const originalSetBriefingLocationMessageV148 = setBriefingLocationMessage;
    setBriefingLocationMessage = function setBriefingLocationMessageI18nV148(kind, message) {
      return originalSetBriefingLocationMessageV148.call(this, kind, translateDynamicV148(message));
    };
  }

  function translateTextNodeV148(node) {
    if (!node || !node.nodeValue || !node.parentElement) return;
    if (node.parentElement.closest("script,style,textarea,select,#admin-view,.language-switcher")) return;
    const translated = translateDynamicV148(node.nodeValue);
    if (translated !== node.nodeValue) node.nodeValue = translated;
  }

  function applyPlayerI18nV148(root = document) {
    if (langV148() === "fr") return;
    const roots = [
      root.querySelector?.("#player-view"),
      root.querySelector?.("#toast"),
      root.querySelector?.("#arrival-modal"),
      root.querySelector?.("#image-viewer"),
      root.matches?.("#player-view") ? root : null,
    ].filter(Boolean);
    roots.forEach((target) => {
      const walker = document.createTreeWalker(target, NodeFilter.SHOW_TEXT);
      while (walker.nextNode()) translateTextNodeV148(walker.currentNode);
      target.querySelectorAll("input[placeholder], textarea[placeholder], button, [aria-label], [title]").forEach((element) => {
        ["placeholder", "aria-label", "title"].forEach((attribute) => {
          if (element.hasAttribute(attribute)) element.setAttribute(attribute, translateDynamicV148(element.getAttribute(attribute)));
        });
        if (element.childNodes.length === 1 && element.firstChild?.nodeType === Node.TEXT_NODE) {
          translateTextNodeV148(element.firstChild);
        }
      });
    });
  }

  if (typeof escapeI18nApplyDom === "function") {
    const originalApplyDomV148 = escapeI18nApplyDom;
    escapeI18nApplyDom = function escapeI18nApplyDomPlayerStableV148() {
      const result = originalApplyDomV148.apply(this, arguments);
      applyPlayerI18nV148(document);
      return result;
    };
  }

  let scheduled = false;
  function scheduleApplyV148() {
    if (scheduled) return;
    scheduled = true;
    window.setTimeout(() => {
      scheduled = false;
      if (typeof escapeI18nApplyDom === "function") escapeI18nApplyDom();
      else applyPlayerI18nV148(document);
    }, 0);
  }

  const observer = new MutationObserver((mutations) => {
    if (langV148() === "fr") return;
    if (mutations.some((mutation) => mutation.target?.parentElement?.closest?.("#player-view,#toast,#arrival-modal,#image-viewer"))) {
      scheduleApplyV148();
    }
  });
  window.setTimeout(() => {
    const target = document.querySelector("#player-view");
    if (target) observer.observe(target, { childList: true, characterData: true, subtree: true });
    scheduleApplyV148();
  }, 0);
  window.addEventListener("hashchange", () => window.setTimeout(scheduleApplyV148, 50));
  window.addEventListener("click", (event) => {
    if (event.target?.closest?.("#language-switcher")) window.setTimeout(scheduleApplyV148, 80);
  }, true);
  window.setInterval(scheduleApplyV148, 4000);
})();
`;

await patchTextFile('app.js', (input) => input.includes(MARKER) ? input : `${input.trimEnd()}\n\n${APP_PATCH}\n`);
await patchTextFile('index.html', bumpAppReferences);
await patchTextFile('service-worker.js', bumpAppReferences);

console.log(`Player i18n stability v${VERSION} applied.`);
