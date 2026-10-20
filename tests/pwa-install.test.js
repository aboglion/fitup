const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

test('PWA Manifest & Icons Integrity', () => {
  const root = path.join(__dirname, '..');
  const manifestPath = path.join(root, 'manifest.json');
  assert.ok(fs.existsSync(manifestPath), 'manifest.json must exist');

  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  assert.ok(manifest.name, 'manifest must have a name');
  assert.ok(manifest.short_name, 'manifest must have a short_name');
  assert.strictEqual(manifest.display, 'standalone', 'display mode must be standalone');
  assert.ok(manifest.start_url, 'manifest must have a start_url');
  assert.ok(manifest.id, 'manifest must have an id');
  assert.ok(manifest.scope, 'manifest must have a scope');
  assert.ok(Array.isArray(manifest.icons) && manifest.icons.length >= 2, 'manifest must have icons');

  // Verify icons exist
  for (const icon of manifest.icons) {
    const iconPath = path.join(root, icon.src);
    assert.ok(fs.existsSync(iconPath), `Icon asset must exist on disk: ${icon.src}`);
  }
});

test('Service Worker Installation & Fetch Handlers', () => {
  const root = path.join(__dirname, '..');
  const swPath = path.join(root, 'sw.js');
  assert.ok(fs.existsSync(swPath), 'sw.js must exist');

  const swContent = fs.readFileSync(swPath, 'utf8');
  assert.ok(swContent.includes("addEventListener('install'"), 'sw.js must have install event listener');
  assert.ok(swContent.includes("addEventListener('activate'"), 'sw.js must have activate event listener');
  assert.ok(swContent.includes("addEventListener('fetch'"), 'sw.js must have fetch event listener');
  assert.ok(swContent.includes('Promise.allSettled'), 'sw.js install should use resilient precaching');
});

test('Index.html PWA Early Capture & Registration', () => {
  const root = path.join(__dirname, '..');
  const htmlPath = path.join(root, 'index.html');
  const htmlContent = fs.readFileSync(htmlPath, 'utf8');

  assert.ok(htmlContent.includes('<link rel="manifest" href="manifest.json">'), 'index.html must link to manifest.json');
  assert.ok(htmlContent.includes("window.addEventListener('beforeinstallprompt'"), 'index.html must capture beforeinstallprompt early');
  assert.ok(htmlContent.includes("navigator.serviceWorker.register('./sw.js')"), 'index.html must register Service Worker early');
});

test('App.js Service Worker Registration & Prompt Handling', () => {
  const root = path.join(__dirname, '..');
  const appPath = path.join(root, 'js', 'app.js');
  const appContent = fs.readFileSync(appPath, 'utf8');

  // Ensure SW registration is independent and not masked by an unreachable else if
  assert.ok(!appContent.includes("} else if ('serviceWorker' in navigator"), 'SW registration must not be inside an else if');
  assert.ok(appContent.includes("navigator.serviceWorker.register('./sw.js')"), 'app.js must register Service Worker');
  assert.ok(appContent.includes('window.deferredInstallPrompt'), 'app.js must support early window.deferredInstallPrompt');
  assert.ok(appContent.includes('promptEvent.prompt()'), 'app.js must trigger native prompt');
  assert.ok(appContent.includes('com.android.chrome'), 'app.js must provide Android Chrome intent escape');
});

test('I18n PWA Translation Keys Symmetry', () => {
  const root = path.join(__dirname, '..');
  const i18nPath = path.join(root, 'js', 'i18n.js');
  const i18nContent = fs.readFileSync(i18nPath, 'utf8');

  const requiredKeys = [
    'pwa_open_in_chrome',
    'pwa_inapp_title',
    'pwa_inapp_desc',
    'pwa_copy_link',
    'pwa_link_copied',
    'pwa_ios_guide_title',
    'pwa_ios_step1',
    'pwa_ios_step2',
    'pwa_ios_step3',
    'pwa_ios_safari_tip',
    'pwa_installed_toast',
    'pwa_installed_modal_title',
    'pwa_installed_modal_heading',
    'pwa_installed_modal_desc',
    'pwa_installed_where_icon_title',
    'pwa_installed_where_icon_desc',
    'pwa_installed_open_now',
    'pwa_installed_modal_close'
  ];

  for (const key of requiredKeys) {
    const matches = (i18nContent.match(new RegExp(`\\b${key}:`, 'g')) || []).length;
    assert.strictEqual(matches, 3, `Key "${key}" must be defined in all 3 languages (en, he, ar)`);
  }
});

test('PWA Install Deduplication & Persistence', () => {
  const root = path.join(__dirname, '..');
  const appPath = path.join(root, 'js', 'app.js');
  const appContent = fs.readFileSync(appPath, 'utf8');

  // Verify deduplication guard exists
  assert.ok(appContent.includes('hasHandledInstallSuccess'), 'app.js must have install deduplication guard');
  assert.ok(appContent.includes('handleAppInstalledSuccess'), 'app.js must have centralized handleAppInstalledSuccess handler');

  // Verify persistence check
  assert.ok(appContent.includes("localStorage.getItem('fitup_app_installed')"), 'app.js must check fitup_app_installed in localStorage');
  assert.ok(appContent.includes("localStorage.setItem('fitup_app_installed', 'true')"), 'app.js must persist fitup_app_installed to localStorage');

  // Verify post-install guidance and launch modal
  assert.ok(appContent.includes('showPostInstallModal'), 'app.js must display celebratory post-install modal');
  assert.ok(appContent.includes('pwa-open-app-btn'), 'app.js must support direct open app button in settings');

  // Verify index.html head persistence
  const htmlPath = path.join(root, 'index.html');
  const htmlContent = fs.readFileSync(htmlPath, 'utf8');
  assert.ok(htmlContent.includes("localStorage.setItem('fitup_app_installed', 'true')"), 'index.html must persist install status in head');
});
