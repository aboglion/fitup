import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test('Preloader - All media URLs returned by Preloader exist on disk (zero 404s)', () => {
  const preloaderCode = fs.readFileSync(path.join(__dirname, '../js/preloader.js'), 'utf8');
  const dataCode = fs.readFileSync(path.join(__dirname, '../js/data.js'), 'utf8');
  const uiCode = fs.readFileSync(path.join(__dirname, '../js/ui.js'), 'utf8');

  const window = { addEventListener: () => {} };
  const document = { getElementById: () => ({ addEventListener: () => {}, querySelector: () => null }) };

  // Evaluate data, UI, and preloader
  const evalData = new Function('window', dataCode);
  evalData(window);

  const evalUI = new Function('window', 'document', 'I18n', `${uiCode}\nwindow.UI = UI;`);
  evalUI(window, document, { t: s => s });

  const evalPreloader = new Function('window', preloaderCode);
  evalPreloader(window);

  assert.ok(window.Preloader, 'window.Preloader is defined');
  assert.equal(typeof window.Preloader.getMediaUrls, 'function', 'getMediaUrls is a function');

  const urls = window.Preloader.getMediaUrls();
  assert.ok(Array.isArray(urls), 'getMediaUrls returns an array');
  assert.ok(urls.length > 200, 'getMediaUrls returns comprehensive list of assets');

  const rootDir = path.join(__dirname, '..');
  const missingUrls = [];

  urls.forEach(u => {
    const filePath = path.join(rootDir, u);
    if (!fs.existsSync(filePath)) {
      missingUrls.push(u);
    }
  });

  assert.deepEqual(missingUrls, [], `All preloaded URLs must exist on disk. Found missing 404 URLs: ${missingUrls.join(', ')}`);
});
