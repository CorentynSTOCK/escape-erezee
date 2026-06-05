import { readFile, writeFile } from 'node:fs/promises';

const VERSION = 152;
const MARKER = 'player-i18n-pure-v152';

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
/* player-i18n-pure-v152 */
(function installPlayerI18nPureV152() {
  if (window.__playerI18nPureV152) return;
  window.__playerI18nPureV152 = true;

  const exact = {
    en: {
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
      "position non disponible. verifiez l'autorisation gps puis reessayez.": "Position unavailable. Check GPS permission and try again.",
      "la geolocalisation n'est pas disponible sur cet appareil.": "Location is not available on this device.",
      "suivi gps actif. la position est aussi visible dans la gestion.": "GPS tracking is active. The position is also visible in the admin.",
      "suivi gps actif. la carte et la gestion vont se mettre a jour automatiquement.": "GPS tracking is active. The map and admin will update automatically.",
      "recherche de votre position au point de depart...": "Searching for your position at the start point...",
      "actualiser ma position": "Refresh my position",
      "me localiser au depart": "Locate me at the start"
    },
    nl: {
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
      "position non disponible. verifiez l'autorisation gps puis reessayez.": "Positie niet beschikbaar. Controleer de GPS-toestemming en probeer opnieuw.",
      "la geolocalisation n'est pas disponible sur cet appareil.": "Locatie is niet beschikbaar op dit toestel.",
      "suivi gps actif. la position est aussi visible dans la gestion.": "GPS-tracking is actief. De positie is ook zichtbaar in het beheer.",
      "suivi gps actif. la carte et la gestion vont se mettre a jour automatiquement.": "GPS-tracking is actief. De kaart en het beheer worden automatisch bijgewerkt.",
      "recherche de votre position au point de depart...": "Zoeken naar je positie bij het startpunt...",
      "actualiser ma position": "Mijn positie vernieuwen",
      "me localiser au depart": "Lokaliseer mij bij de start"
    }
  };

  function langV152() {
    if (typeof playerLangV151 === "function") return playerLangV151();
    const active = document.querySelector("#language-switcher [aria-pressed='true'], #language-switcher .is-active");
    const candidate = active?.dataset?.lang || (typeof escapeI18nLanguage === "function" ? escapeI18nLanguage() : "") || (document.documentElement.lang || "fr").slice(0, 2);
    return ["fr", "en", "nl"].includes(candidate) ? candidate : "fr";
  }

  function keyV152(value) {
    return String(value == null ? "" : value)
      .replace(/&amp;#039;|&#039;/g, "'")
      .replace(/[’\`]/g, "'")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase();
  }

  function relativeV152(value, lang) {
    const key = keyV152(value);
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

  window.playerDynamicTextV152 = function playerDynamicTextV152(value) {
    const original = String(value == null ? "" : value);
    const trimmed = original.trim();
    const lang = langV152();
    if (!trimmed || lang === "fr") return original;
    const normalized = keyV152(trimmed);
    let translated = exact[lang]?.[normalized] || "";
    let match;
    if (!translated && (match = normalized.match(/^serveur contacte (.+)\.$/))) {
      translated = lang === "nl" ? "Server gecontacteerd " + relativeV152(match[1], lang) + "." : "Server contacted " + relativeV152(match[1], lang) + ".";
    }
    if (!translated && (match = normalized.match(/^derniere position recue (.+)\. appuyez sur resynchroniser\.$/))) {
      translated = lang === "nl" ? "Laatste positie ontvangen " + relativeV152(match[1], lang) + ". Tik op opnieuw syncen." : "Last position received " + relativeV152(match[1], lang) + ". Tap Resync.";
    }
    if (!translated && (match = normalized.match(/^derniere position recue (.+)\. le suivi va se relancer\.$/))) {
      translated = lang === "nl" ? "Laatste positie ontvangen " + relativeV152(match[1], lang) + ". De tracking wordt opnieuw gestart." : "Last position received " + relativeV152(match[1], lang) + ". Tracking will restart.";
    }
    if (!translated && (match = normalized.match(/^position envoyee (.+)\. (.+)$/))) {
      translated = lang === "nl" ? "Positie verzonden " + relativeV152(match[1], lang) + ". " + window.playerDynamicTextV152(match[2]) : "Position sent " + relativeV152(match[1], lang) + ". " + window.playerDynamicTextV152(match[2]);
    }
    return translated ? original.replace(trimmed, translated) : original;
  };

  if (typeof playerRescueRelativeTime === "function") {
    const originalRelativeV152 = playerRescueRelativeTime;
    playerRescueRelativeTime = function playerRescueRelativeTimePureV152(timestamp) {
      return relativeV152(originalRelativeV152.apply(this, arguments), langV152());
    };
  }
  if (typeof playerRescueStatus === "function") {
    const originalStatusV152 = playerRescueStatus;
    playerRescueStatus = function playerRescueStatusPureV152() {
      const status = originalStatusV152.apply(this, arguments);
      if (!status || langV152() === "fr") return status;
      return { ...status, title: window.playerDynamicTextV152(status.title), text: window.playerDynamicTextV152(status.text) };
    };
  }
  if (typeof setBriefingLocationMessage === "function") {
    const originalBriefingMessageV152 = setBriefingLocationMessage;
    setBriefingLocationMessage = function setBriefingLocationMessagePureV152(kind, message) {
      return originalBriefingMessageV152.call(this, kind, window.playerDynamicTextV152(message));
    };
  }
})();
`;

function patchApp(input) {
  let output = input
    .replace(/\/\* player-i18n-stability-v148 \*\/[\s\S]*?\n\}\)\(\);\n?/g, '')
    .replace(/\/\* player-i18n-immediate-v149 \*\/[\s\S]*?\n\}\)\(\);\n?/g, '')
    .replace(/\/\* player-i18n-light-v150 \*\/[\s\S]*?\n\}\)\(\);\n?/g, '');
  if (!output.includes(MARKER)) output = `${output.trimEnd()}\n\n${APP_PATCH}\n`;
  output = output.replace(
    'els.distanceNote.textContent = "Position non disponible. Verifiez l\\\'autorisation GPS puis reessayez.";',
    'els.distanceNote.textContent = window.playerDynamicTextV152 ? window.playerDynamicTextV152("Position non disponible. Verifiez l\\\'autorisation GPS puis reessayez.") : "Position non disponible. Verifiez l\\\'autorisation GPS puis reessayez.";'
  );
  output = output.replace(
    'els.distanceNote.textContent = "La geolocalisation n\\\'est pas disponible sur cet appareil.";',
    'els.distanceNote.textContent = window.playerDynamicTextV152 ? window.playerDynamicTextV152("La geolocalisation n\\\'est pas disponible sur cet appareil.") : "La geolocalisation n\\\'est pas disponible sur cet appareil.";'
  );
  output = output.replace(
    'els.distanceNote.textContent = "Suivi GPS actif. La position est aussi visible dans la gestion.";',
    'els.distanceNote.textContent = window.playerDynamicTextV152 ? window.playerDynamicTextV152("Suivi GPS actif. La position est aussi visible dans la gestion.") : "Suivi GPS actif. La position est aussi visible dans la gestion.";'
  );
  output = output.replace(
    'els.distanceNote.textContent = "Suivi GPS actif. La carte et la gestion vont se mettre a jour automatiquement.";',
    'els.distanceNote.textContent = window.playerDynamicTextV152 ? window.playerDynamicTextV152("Suivi GPS actif. La carte et la gestion vont se mettre a jour automatiquement.") : "Suivi GPS actif. La carte et la gestion vont se mettre a jour automatiquement.";'
  );
  return output;
}

await patchTextFile('app.js', patchApp);
await patchTextFile('index.html', bumpAppReferences);
await patchTextFile('service-worker.js', bumpAppReferences);

console.log(`Player i18n pure v${VERSION} applied.`);
