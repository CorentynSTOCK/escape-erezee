import { readFile, writeFile } from 'node:fs/promises';

const VERSION = 118;

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

const APP_PATCH = `

/* multilingual-v118 */
(function installCanonicalTranslationsV118() {
  if (window.__escapeI18nCanonicalV118) return;
  window.__escapeI18nCanonicalV118 = true;
  const textOriginals = new WeakMap();
  const attributeName = (attribute) => 'data-i18n-original-' + attribute.replace(/[^a-z0-9-]/gi, '-').toLowerCase();

  function translateOriginalText(original) {
    const raw = original || '';
    const trimmed = raw.trim();
    if (!trimmed) return raw;
    const translated = typeof escapeI18nTranslateText === 'function' ? escapeI18nTranslateText(trimmed) : '';
    const replacement = translated && translated !== trimmed ? translated : trimmed;
    return raw.replace(trimmed, replacement);
  }

  escapeI18nTranslateNode = function escapeI18nTranslateNodeV118(node) {
    if (!node) return;
    if (!textOriginals.has(node)) textOriginals.set(node, node.nodeValue || '');
    const nextValue = translateOriginalText(textOriginals.get(node));
    if (node.nodeValue !== nextValue) node.nodeValue = nextValue;
  };

  escapeI18nApplyAttributes = function escapeI18nApplyAttributesV118(root) {
    ['placeholder', 'aria-label', 'title', 'alt'].forEach((attribute) => {
      root.querySelectorAll('[' + attribute + ']').forEach((element) => {
        const originalAttribute = attributeName(attribute);
        if (!element.hasAttribute(originalAttribute)) {
          element.setAttribute(originalAttribute, element.getAttribute(attribute) || '');
        }
        const nextValue = translateOriginalText(element.getAttribute(originalAttribute) || '');
        if (element.getAttribute(attribute) !== nextValue) element.setAttribute(attribute, nextValue);
      });
    });
  };

  const previousSetLanguageV118 = typeof escapeI18nSetLanguage === 'function' ? escapeI18nSetLanguage : null;
  if (previousSetLanguageV118) {
    escapeI18nSetLanguage = function escapeI18nSetLanguageV118(lang, options = {}) {
      const result = previousSetLanguageV118.call(this, lang, options);
      window.setTimeout(() => {
        if (typeof escapeI18nApplyDom === 'function') escapeI18nApplyDom();
      }, 0);
      return result;
    };
  }

  window.setTimeout(() => {
    if (typeof escapeI18nApplyDom === 'function') escapeI18nApplyDom();
  }, 0);
})();
`;

function patchApp(app) {
  if (app.includes('multilingual-v118')) return bumpAssetVersions(app);
  if (!app.includes('multilingual-v116') || !app.includes('function escapeI18nSetLanguage')) {
    throw new Error(`Patch v${VERSION} introuvable: multilingual-v117 requis`);
  }
  return `${bumpAssetVersions(app).trimEnd()}${APP_PATCH}\n`;
}

function patchServiceWorker(worker) {
  return bumpAssetVersions(worker).replace(/escape-erezee-v\d+/g, `escape-erezee-v${VERSION}`);
}

await patchTextFile('app.js', patchApp);
await patchTextFile('index.html', bumpAssetVersions);
await patchTextFile('service-worker.js', patchServiceWorker);

console.log(`Multilingual switch v${VERSION} applied.`);
