import { readFile, writeFile } from 'node:fs/promises';

const TARGET = 'server.mjs';
const MARKER = 'stripe-live-test-status-v146';

const replacements = [
  {
    from: 'sendJson(response, 200, await createLiveStripeTestV145(request));',
    to: `try {
      sendJson(response, 200, await createLiveStripeTestV145(request));
    } catch (error) {
      if (String(error?.message || '').includes('Confirmation manquante')) {
        sendJson(response, 400, { message: error.message, patch: '${MARKER}' });
      } else {
        throw error;
      }
    }`,
  },
  {
    from: 'sendJson(response, 200, await createAdminStripeLiveTestV145(request));',
    to: `try {
      sendJson(response, 200, await createAdminStripeLiveTestV145(request));
    } catch (error) {
      if (String(error?.message || '').includes('Confirmation manquante')) {
        sendJson(response, 400, { message: error.message, patch: '${MARKER}' });
      } else {
        throw error;
      }
    }`,
  },
];

const input = await readFile(TARGET, 'utf8');
if (input.includes(MARKER)) {
  console.log('Stripe test status v146 already applied.');
  process.exit(0);
}

let output = input;
let changed = false;
for (const item of replacements) {
  if (output.includes(item.from)) {
    output = output.replace(item.from, item.to);
    changed = true;
  }
}

if (!changed) {
  throw new Error('Stripe live test endpoint introuvable pour le patch v146.');
}

await writeFile(TARGET, output, 'utf8');
console.log('Stripe test status v146 applied.');
