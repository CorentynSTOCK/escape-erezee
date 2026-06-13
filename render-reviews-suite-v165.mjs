import { readFile, writeFile } from 'node:fs/promises';

const VERSION = 165;

async function patchTextFile(filePath, patcher) {
  const input = await readFile(filePath, 'utf8');
  const output = patcher(input);
  if (output !== input) await writeFile(filePath, output, 'utf8');
}

function findBlockEnd(input, start) {
  const bodyStart = input.indexOf('{', start);
  if (bodyStart < 0) return -1;
  let depth = 0;
  let quote = null;
  let escaped = false;
  for (let index = bodyStart; index < input.length; index += 1) {
    const char = input[index];
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
      if (depth === 0) return index + 1;
    }
  }
  return -1;
}

function replaceBlock(input, signature, replacement) {
  const start = input.indexOf(signature);
  if (start < 0) return input;
  const end = findBlockEnd(input, start);
  if (end < 0) throw new Error('Patch v' + VERSION + ' impossible: ' + signature);
  return input.slice(0, start) + replacement + input.slice(end);
}

function bump(text) {
  let next = text;
  for (let version = 1; version <= VERSION; version += 1) {
    next = next.split('styles.css?v=' + version).join('styles.css?v=' + VERSION);
    next = next.split('app.js?v=' + version).join('app.js?v=' + VERSION);
    next = next.split('seo-pages.css?v=' + version).join('seo-pages.css?v=' + VERSION);
    next = next.split('escape-erezee-v' + version).join('escape-erezee-v' + VERSION);
  }
  return next;
}

function normalizeReviewsV145(reviews) {
  const fallback = [
    { name: 'Sophie', text: 'Super activite en famille, les enfants ont adore !', rating: 5 },
    { name: 'Julien', text: 'Une belle decouverte de la region tout en s amusant.', rating: 5 },
    { name: 'Marie', text: 'Parcours clair, nature superbe et enigmes bien dosees.', rating: 5 },
    { name: 'Nathalie', text: 'Le parcours motive tout le monde a observer les details.', rating: 5 },
    { name: 'Thomas', text: 'Une activite originale pres de Durbuy, facile a lancer.', rating: 5 },
    { name: 'Laura', text: 'Tres bon moment dehors, avec juste ce qu il faut de challenge.', rating: 5 },
  ];
  return (Array.isArray(reviews) && reviews.length ? reviews : fallback)
    .map((review) => ({ name: compactText(review?.name).slice(0, 80) || 'Client', text: compactText(review?.text).slice(0, 320), rating: Math.min(5, Math.max(1, Math.round(Number(review?.rating) || 5))) }))
    .filter((review) => review.text).slice(0, 6);
}

function patchServer(server) {
  return bump(replaceBlock(server, 'function normalizeReviewsV145', normalizeReviewsV145.toString()));
}

const APP_PATCH = `
/* reviews-suite-ui-v165 */
function reviewRatingOptionsV165(value) {
  const current = Math.min(5, Math.max(1, Math.round(Number(value) || 5)));
  return [5, 4, 3, 2, 1].map(function (rating) {
    return '<option value="' + rating + '"' + (rating === current ? ' selected' : '') + '>' + rating + '/5</option>';
  }).join('');
}

function reviewUrlIsDirectV165(url) {
  return /^https:\\/\\/search\\.google\\.com\\/local\\/writereview\\?placeid=/i.test(String(url || ''));
}

if (typeof reviewInputsV145 === 'function') {
  reviewInputsV145 = function reviewInputsV165(settings) {
    const reviews = Array.isArray(settings?.reviews) ? settings.reviews.slice(0, 6) : [];
    while (reviews.length < 6) reviews.push({ name: '', text: '', rating: 5 });
    return reviews.map(function (review, index) {
      return '<div class="admin-tools-review-v145 admin-review-v165">' +
        '<div class="admin-review-head-v165"><strong>Avis ' + (index + 1) + '</strong><label>Note<select data-review-rating-v145="' + index + '">' + reviewRatingOptionsV165(review.rating) + '</select></label></div>' +
        '<label>Nom<input data-review-name-v145="' + index + '" value="' + escV145(review.name || '') + '" /></label>' +
        '<label>Texte<textarea data-review-text-v145="' + index + '" rows="3">' + escV145(review.text || '') + '</textarea></label>' +
      '</div>';
    }).join('');
  };
}

if (typeof renderReviewsV145 === 'function') {
  renderReviewsV145 = function renderReviewsV165() {
    const section = document.querySelector('#customer-reviews-v143');
    const grid = section?.querySelector('.reviews-grid-v143');
    const reviews = Array.isArray(publicGrowthSettingsV145?.reviews) ? publicGrowthSettingsV145.reviews.slice(0, 6) : [];
    if (grid && reviews.length) {
      grid.innerHTML = reviews.map(function (review) {
        return '<article><strong>' + escV145(starsV145(review.rating)) + '</strong><p>' + escV145(review.text) + '</p><span>- ' + escV145(review.name) + '</span></article>';
      }).join('');
    }
    if (!section) return;
    let cta = section.querySelector('.reviews-cta-v165');
    if (!cta) {
      cta = document.createElement('div');
      cta.className = 'reviews-cta-v165';
      section.appendChild(cta);
    }
    const reviewUrl = publicGrowthSettingsV145?.reviewUrl || publicSiteConfigV143?.reviewUrl || 'https://www.google.com/search?q=Stock+%26+Sevrin+Escape+Games+Erezee+avis';
    cta.innerHTML = '<p>Vous avez deja joue ? Votre retour aide les prochaines equipes.</p><a class="secondary-button compact-button" target="_blank" rel="noopener" href="' + escV145(reviewUrl) + '">Laisser un avis</a>';
  };
}

if (typeof addFinishExperienceV143 === 'function') {
  addFinishExperienceV143 = function addFinishExperienceV165(team, route) {
    if (!els.finishPanel || !team || !route) return;
    let block = els.finishPanel.querySelector('#finish-experience-v143');
    if (!block) {
      block = document.createElement('div');
      block.id = 'finish-experience-v143';
      block.className = 'finish-experience-v143 finish-review-v165';
      els.finishPanel.appendChild(block);
    }
    const reviewUrl = publicGrowthSettingsV145?.reviewUrl || publicSiteConfigV143?.reviewUrl || 'https://www.google.com/search?q=Stock+%26+Sevrin+Escape+Games+Erezee+avis';
    const won = team.status === 'won';
    block.innerHTML = [
      '<div class="finish-review-card-v165">',
        '<p class="section-label">Avis client</p>',
        '<h3>' + (won ? 'Vous avez aime l aventure ?' : 'Merci d avoir joue') + '</h3>',
        '<p>' + (won ? 'Un avis Google aide enormement les prochaines equipes a choisir leur parcours.' : 'Votre retour reste precieux pour ameliorer les parcours et aider les prochains joueurs.') + '</p>',
        '<div class="finish-actions-v143">',
          '<a class="primary-button" target="_blank" rel="noopener" href="' + escapeGrowthV143(reviewUrl) + '">Laisser un avis</a>',
          '<button class="secondary-button" type="button" id="souvenir-photo-v143">Photo souvenir</button>',
          '<a class="secondary-button" href="#shop">Decouvrir un autre parcours</a>',
        '</div>',
      '</div>',
    ].join('');
    block.querySelector('#souvenir-photo-v143')?.addEventListener('click', function () { createSouvenirImageV143(team, route); });
  };
}

if (typeof renderAdminToolsV145 === 'function' && !window.__reviewsAdminWrapV165) {
  window.__reviewsAdminWrapV165 = true;
  const previousRenderAdminToolsV165 = renderAdminToolsV145;
  renderAdminToolsV145 = function renderAdminToolsWithReviewsV165(settings) {
    const result = previousRenderAdminToolsV165.apply(this, arguments);
    const card = document.querySelector('#admin-public-settings-v145');
    if (card && !card.querySelector('.admin-review-status-v165')) {
      const reviewUrl = settings?.reviewUrl || '';
      const status = document.createElement('div');
      status.className = 'admin-review-status-v165 ' + (reviewUrlIsDirectV165(reviewUrl) ? 'is-direct' : 'is-generic');
      status.innerHTML = '<strong>' + (reviewUrlIsDirectV165(reviewUrl) ? 'Lien Google direct configure' : 'Lien Google a verifier') + '</strong><span>' + (reviewUrlIsDirectV165(reviewUrl) ? 'Les boutons avis ouvrent directement la fiche Google.' : 'Collez le lien direct Google Avis quand il sera disponible.') + '</span>';
      card.querySelector('label')?.insertAdjacentElement('afterend', status);
    }
    return result;
  };
}

if (typeof saveAdminSettingsV145 === 'function') {
  saveAdminSettingsV145 = async function saveAdminSettingsV165() {
    const reviews = [0, 1, 2, 3, 4, 5].map(function (index) {
      return {
        name: document.querySelector('[data-review-name-v145="' + index + '"]')?.value || '',
        text: document.querySelector('[data-review-text-v145="' + index + '"]')?.value || '',
        rating: Number(document.querySelector('[data-review-rating-v145="' + index + '"]')?.value || 5),
      };
    });
    const payload = await fetchJsonV145(ADMIN_PUBLIC_SETTINGS_URL_V145, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ reviewUrl: document.querySelector('#admin-review-url-v145')?.value || '', reviews }),
    });
    publicGrowthSettingsV145 = payload;
    if (typeof publicSiteConfigV143 !== 'undefined') publicSiteConfigV143 = payload;
    renderReviewsV145();
    showToast('Avis clients mis a jour.');
    refreshAdminToolsV145();
  };
}
`;

function patchApp(app) {
  let next = bump(app);
  if (!next.includes('reviews-suite-ui-v165')) next = next.trimEnd() + '\n' + APP_PATCH + '\n';
  return next;
}

function patchStyles(css) {
  let next = bump(css);
  if (next.includes('reviews-suite-ui-v165')) return next;
  return next.trimEnd() + `

/* reviews-suite-ui-v165 */
.admin-review-v165 {
  align-content: start;
}

.admin-review-head-v165 {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.admin-review-head-v165 label {
  display: inline-grid;
  grid-template-columns: auto minmax(76px, 92px);
  align-items: center;
  gap: 6px;
  margin: 0;
  font-size: 0.84rem;
}

.admin-review-status-v165 {
  display: grid;
  gap: 2px;
  border-left: 4px solid #d69a25;
  border-radius: 8px;
  background: rgba(246, 249, 247, 0.92);
  padding: 10px 12px;
}

.admin-review-status-v165.is-direct {
  border-left-color: #1f6a58;
}

.admin-review-status-v165 span,
.reviews-cta-v165 p,
.finish-review-card-v165 p {
  color: var(--muted);
  line-height: 1.5;
}

.reviews-cta-v165 {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-top: 16px;
  border-top: 1px solid var(--line);
  padding-top: 14px;
}

.reviews-cta-v165 p {
  margin: 0;
}

.finish-review-card-v165 {
  display: grid;
  gap: 10px;
  border: 1px solid rgba(18, 60, 50, 0.16);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.88);
  padding: 16px;
}

.finish-review-card-v165 h3 {
  margin: 0;
  color: var(--green);
}

.finish-review-card-v165 p {
  margin: 0;
}

@media (max-width: 720px) {
  .reviews-cta-v165,
  .admin-review-head-v165 {
    display: grid;
  }
}
`;
}

function patchServiceWorker(worker) {
  return bump(worker);
}

await patchTextFile('server.mjs', patchServer);
await patchTextFile('app.js', patchApp);
await patchTextFile('styles.css', patchStyles);
await patchTextFile('index.html', bump);
await patchTextFile('suivi.html', bump);
await patchTextFile('seo-pages.css', bump);
await patchTextFile('service-worker.js', patchServiceWorker);

console.log('Reviews suite v' + VERSION + ' applied.');
