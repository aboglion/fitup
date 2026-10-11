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

  // Verify priority ordering: PNGs come before heavy GIFs
  const firstGifIndex = urls.findIndex(u => u.endsWith('.gif'));
  const firstPngIndex = urls.findIndex(u => u.endsWith('.png'));
  assert.ok(firstPngIndex < firstGifIndex, 'PNGs must be prioritized ahead of GIFs in the queue');

  const walkingGifIndex = urls.findIndex(u => u.includes('Relaxed Walking.gif'));
  assert.ok(walkingGifIndex > urls.length - 20, 'Heavy 17MB GIF should be positioned towards the end of the queue');

  // Verify preloadToday API
  assert.equal(typeof window.Preloader.preloadToday, 'function', 'preloadToday is a function');
  assert.equal(typeof window.Preloader.getProgress, 'function', 'getProgress is a function');
  const progress = window.Preloader.getProgress();
  assert.ok('completed' in progress && 'total' in progress && 'isDone' in progress, 'getProgress returns valid progress schema');
});

test('Service Worker - Uses dedicated MEDIA_CACHE and Cache-First strategy for images', () => {
  const swCode = fs.readFileSync(path.join(__dirname, '../sw.js'), 'utf8');
  assert.ok(swCode.includes("MEDIA_CACHE = 'fitup-media-cache-v1'"), 'SW defines MEDIA_CACHE');
  assert.ok(swCode.includes("caches.match(event.request, { ignoreSearch: true })"), 'SW checks cache first for images');
  assert.ok(swCode.includes("cacheName !== MEDIA_CACHE"), 'SW preserves MEDIA_CACHE on activate');
});
