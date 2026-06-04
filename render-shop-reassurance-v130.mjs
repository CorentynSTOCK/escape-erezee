import { readFile, writeFile } from 'node:fs/promises';

const VERSION = 130;

async function patchTextFile(filePath, patcher) {
  const input = await readFile(filePath, 'utf8');
  const output = patcher(input);
  if (output !== input) await writeFile(filePath, output, 'utf8');
}

function bumpAssetVersions(text) {
  return text
    .replace(/styles\.css\?v=\d+/g, `styles.css?v=${VERSION}`)
    .replace(/app\.js\?v=\d+/g, `app.js?v=${VERSION}`);
}

function langText(fr, en, nl) {
  return `<span data-lang-static="fr">${fr}</span><span data-lang-static="en">${en}</span><span data-lang-static="nl">${nl}</span>`;
}

function shopReassuranceBlock() {
  return `
              <section class="shop-reassurance" data-shop-reassurance-v130 aria-labelledby="shop-reassurance-title">
                <div class="shop-reassurance-head">
                  <p class="section-label" data-static-i18n-v130>${langText('Avant d’acheter', 'Before buying', 'Voor je koopt')}</p>
                  <h2 id="shop-reassurance-title" data-static-i18n-v130>${langText('Tout est prêt pour jouer dehors', 'Everything is ready for outdoor play', 'Alles is klaar om buiten te spelen')}</h2>
                  <p data-static-i18n-v130>${langText('Après l’achat, votre code ouvre le parcours choisi. Gardez simplement votre téléphone chargé et rejoignez le point de départ indiqué.', 'After purchase, your code opens the selected route. Just keep your phone charged and go to the indicated starting point.', 'Na aankoop opent je code de gekozen route. Zorg gewoon voor een opgeladen telefoon en ga naar het aangeduide startpunt.')}</p>
                </div>
                <div class="shop-reassurance-grid">
                  <article>
                    <strong>1</strong>
                    <h3 data-static-i18n-v130>${langText('Code par email', 'Code by email', 'Code per e-mail')}</h3>
                    <p data-static-i18n-v130>${langText('Le code d’accès est envoyé après le paiement et reste lié au parcours acheté.', 'The access code is sent after payment and stays linked to the purchased route.', 'De toegangscode wordt na betaling verzonden en blijft gekoppeld aan de gekochte route.')}</p>
                  </article>
                  <article>
                    <strong>2</strong>
                    <h3 data-static-i18n-v130>${langText('Départ vérifié par GPS', 'GPS-checked start', 'Start gecontroleerd met gps')}</h3>
                    <p data-static-i18n-v130>${langText('La page briefing vous guide vers la zone de départ avant de lancer l’aventure.', 'The briefing page guides you to the starting area before the adventure begins.', 'De briefingpagina gidst je naar de startzone voordat het avontuur begint.')}</p>
                  </article>
                  <article>
                    <strong>3</strong>
                    <h3 data-static-i18n-v130>${langText('Une équipe, un smartphone', 'One team, one smartphone', 'Een team, een smartphone')}</h3>
                    <p data-static-i18n-v130>${langText('Un téléphone avec batterie, internet mobile et géolocalisation suffit pour toute l’équipe.', 'One phone with battery, mobile internet and location access is enough for the whole team.', 'Een telefoon met batterij, mobiel internet en locatie is genoeg voor het hele team.')}</p>
                  </article>
                </div>
              </section>`;
}

function patchIndex(html) {
  let output = bumpAssetVersions(html);
  if (!output.includes('data-shop-reassurance-v130')) {
    const marker = '              </section>\n\n            <p class="shop-empty" id="shop-empty" role="status"></p>';
    if (!output.includes(marker)) throw new Error('Emplacement boutique introuvable pour v130');
    output = output.replace(
      marker,
      `              </section>${shopReassuranceBlock()}\n\n            <p class="shop-empty" id="shop-empty" role="status"></p>`,
    );
  }
  return output;
}

function patchApp(app) {
  let output = bumpAssetVersions(app);
  if (!output.includes('[data-static-i18n-v130]')) {
    const withV128 = 'script, style, textarea, select, #admin-view, .language-switcher, [data-static-i18n-v128]';
    if (output.includes(withV128)) {
      output = output.replace(withV128, `${withV128}, [data-static-i18n-v130]`);
    } else {
      const base = 'script, style, textarea, select, #admin-view, .language-switcher';
      if (!output.includes(base)) throw new Error('Sélecteur i18n introuvable pour v130');
      output = output.replace(base, `${base}, [data-static-i18n-v130]`);
    }
  }
  return output;
}

function patchStyles(css) {
  if (css.includes('shop-reassurance-v130')) return css;
  return `${css.trimEnd()}

/* shop-reassurance-v130 */
.shop-reassurance {
  display: grid;
  gap: 16px;
  margin-top: 18px;
  padding: 18px;
  border: 1px solid var(--line);
  border-radius: var(--radius);
  background: #fff;
  box-shadow: 0 12px 34px rgba(18, 60, 50, 0.06);
}

.shop-reassurance-head {
  max-width: 760px;
}

.shop-reassurance-head h2 {
  margin: 4px 0 8px;
  font-size: 1.35rem;
}

.shop-reassurance-head p:last-child {
  margin: 0;
  color: var(--muted);
  line-height: 1.55;
}

.shop-reassurance-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.shop-reassurance article {
  display: grid;
  align-content: start;
  gap: 8px;
  min-height: 156px;
  padding: 14px;
  border: 1px solid var(--line);
  border-radius: var(--radius);
  background: #f7faf8;
}

.shop-reassurance article > strong {
  display: grid;
  width: 32px;
  height: 32px;
  place-items: center;
  border-radius: 999px;
  background: var(--green);
  color: #fff;
  font-weight: 900;
}

.shop-reassurance h3 {
  margin: 0;
  font-size: 1rem;
}

.shop-reassurance article p {
  margin: 0;
  color: var(--muted);
  font-size: 0.9rem;
  line-height: 1.45;
}

[data-static-i18n-v130] [data-lang-static] { display: none; }
html:not([lang]) [data-static-i18n-v130] [data-lang-static="fr"],
html[lang^="fr"] [data-static-i18n-v130] [data-lang-static="fr"],
html[lang^="en"] [data-static-i18n-v130] [data-lang-static="en"],
html[lang^="nl"] [data-static-i18n-v130] [data-lang-static="nl"] { display: inline; }

@media (max-width: 900px) {
  .shop-reassurance-grid { grid-template-columns: 1fr; }
  .shop-reassurance article { min-height: auto; }
}
`;
}

function patchServiceWorker(worker) {
  return bumpAssetVersions(worker).replace(/escape-erezee-v\d+/g, `escape-erezee-v${VERSION}`);
}

await patchTextFile('index.html', patchIndex);
await patchTextFile('app.js', patchApp);
await patchTextFile('styles.css', patchStyles);
await patchTextFile('service-worker.js', patchServiceWorker);

console.log(`Shop reassurance v${VERSION} applied.`);
