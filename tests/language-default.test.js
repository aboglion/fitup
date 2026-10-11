import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.join(__dirname, '..');
const i18nCode = fs.readFileSync(path.join(root, 'js/i18n.js'), 'utf8');

function createSandbox(options = {}) {
  const localStorageStore = { ...options.localStorage };
  const dbStore = { ...options.dbStore };

  const domElements = [];
  const sandbox = {
    navigator: options.navigator || { languages: ['en-US'], language: 'en-US' },
    localStorage: {
      getItem: (k) => (k in localStorageStore ? localStorageStore[k] : null),
      setItem: (k, v) => { localStorageStore[k] = String(v); },
      removeItem: (k) => { delete localStorageStore[k]; },
      _store: localStorageStore
    },
    document: {
      documentElement: {
        lang: 'en',
        dir: 'ltr',
        style: { setProperty: () => {} }
      },
      querySelectorAll: (selector) => {
        if (selector === '.login-lang-btn') {
          return [
            { dataset: { lang: 'en' }, classList: { toggle: (cls, on) => {} } },
            { dataset: { lang: 'he' }, classList: { toggle: (cls, on) => {} } },
            { dataset: { lang: 'ar' }, classList: { toggle: (cls, on) => {} } }
          ];
        }
        return [];
      }
    },
    window: {},
    DB: {
      getSetting: async (key) => (key in dbStore ? dbStore[key] : null),
      setSetting: async (key, val) => { dbStore[key] = val; },
      _store: dbStore
    },
    console
  };

  sandbox.window = sandbox;
  vm.createContext(sandbox);
  vm.runInContext(i18nCode, sandbox);
  const I18n = sandbox.window.I18n || sandbox.I18n;

  return { sandbox, I18n, dbStore, localStorageStore };
}

test('Device language detection: Hebrew (he, iw)', () => {
  const { I18n } = createSandbox({
    navigator: { languages: ['he-IL', 'en-US'], language: 'he-IL' }
  });
  assert.equal(I18n.detectDeviceLanguage(), 'he');

  const { I18n: I18nLegacy } = createSandbox({
    navigator: { languages: ['iw-IL'], language: 'iw-IL' }
  });
  assert.equal(I18nLegacy.detectDeviceLanguage(), 'he');
});

test('Device language detection: Arabic (ar)', () => {
  const { I18n } = createSandbox({
    navigator: { languages: ['ar-EG', 'en-US'], language: 'ar-EG' }
  });
  assert.equal(I18n.detectDeviceLanguage(), 'ar');

  const { I18n: I18nSaudi } = createSandbox({
    navigator: { languages: ['ar-SA'], language: 'ar-SA' }
  });
  assert.equal(I18nSaudi.detectDeviceLanguage(), 'ar');
});

test('Device language detection: English and other languages default to en', () => {
  const { I18n: I18nEn } = createSandbox({
    navigator: { languages: ['en-US', 'he-IL'], language: 'en-US' }
  });
  assert.equal(I18nEn.detectDeviceLanguage(), 'en');

  const { I18n: I18nFr } = createSandbox({
    navigator: { languages: ['fr-FR', 'en-US'], language: 'fr-FR' }
  });
  assert.equal(I18nFr.detectDeviceLanguage(), 'en');

  const { I18n: I18nRu } = createSandbox({
    navigator: { languages: ['ru-RU'], language: 'ru-RU' }
  });
  assert.equal(I18nRu.detectDeviceLanguage(), 'en');
});

test('Default language on first load: follows phone/browser language', async () => {
  // 1. Hebrew phone -> defaults to Hebrew
  const { I18n: I18nHe, sandbox: sandboxHe } = createSandbox({
    navigator: { languages: ['he-IL', 'en-US'], language: 'he-IL' }
  });
  await I18nHe.init();
  assert.equal(I18nHe.getLang(), 'he');
  assert.equal(sandboxHe.document.documentElement.lang, 'he');
  assert.equal(sandboxHe.document.documentElement.dir, 'rtl');

  // 2. Arabic phone -> defaults to Arabic
  const { I18n: I18nAr, sandbox: sandboxAr } = createSandbox({
    navigator: { languages: ['ar-EG'], language: 'ar-EG' }
  });
  await I18nAr.init();
  assert.equal(I18nAr.getLang(), 'ar');
  assert.equal(sandboxAr.document.documentElement.lang, 'ar');
  assert.equal(sandboxAr.document.documentElement.dir, 'rtl');

  // 3. English phone -> defaults to English
  const { I18n: I18nEn, sandbox: sandboxEn } = createSandbox({
    navigator: { languages: ['en-US'], language: 'en-US' }
  });
  await I18nEn.init();
  assert.equal(I18nEn.getLang(), 'en');
  assert.equal(sandboxEn.document.documentElement.lang, 'en');
  assert.equal(sandboxEn.document.documentElement.dir, 'ltr');

  // 4. Other language phone (e.g. Spanish) -> defaults to English
  const { I18n: I18nEs, sandbox: sandboxEs } = createSandbox({
    navigator: { languages: ['es-ES'], language: 'es-ES' }
  });
  await I18nEs.init();
  assert.equal(I18nEs.getLang(), 'en');
  assert.equal(sandboxEs.document.documentElement.lang, 'en');
  assert.equal(sandboxEs.document.documentElement.dir, 'ltr');
});

test('Saved preference overrides device language after user changes in settings', async () => {
  // Device is in Hebrew, but user previously selected English in settings
  const { I18n, sandbox, dbStore, localStorageStore } = createSandbox({
    navigator: { languages: ['he-IL'], language: 'he-IL' },
    dbStore: { language: 'en' },
    localStorage: { fitup_language: 'en' }
  });

  await I18n.init();
  assert.equal(I18n.getLang(), 'en', 'Saved setting English overrides Hebrew phone language');
  assert.equal(sandbox.document.documentElement.lang, 'en');
  assert.equal(sandbox.document.documentElement.dir, 'ltr');

  // User changes language to Arabic via settings
  await I18n.setLanguage('ar');
  assert.equal(I18n.getLang(), 'ar');
  assert.equal(dbStore.language, 'ar', 'Saved to database settings');
  assert.equal(localStorageStore.fitup_language, 'ar', 'Saved to localStorage');
  assert.equal(sandbox.document.documentElement.lang, 'ar');
  assert.equal(sandbox.document.documentElement.dir, 'rtl');

  // Next reload with updated saved setting loads Arabic
  const { I18n: I18nReloaded } = createSandbox({
    navigator: { languages: ['he-IL'], language: 'he-IL' },
    dbStore: { language: dbStore.language },
    localStorage: { fitup_language: localStorageStore.fitup_language }
  });
  await I18nReloaded.init();
  assert.equal(I18nReloaded.getLang(), 'ar', 'Persisted language Arabic loaded');
});
