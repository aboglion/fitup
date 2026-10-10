import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.join(__dirname, '..');

// Load I18n
const i18nCode = fs.readFileSync(path.join(root, 'js/i18n.js'), 'utf8');
const i18nSandbox = {
  window: {},
  document: { documentElement: { style: { setProperty: () => {} } }, querySelectorAll: () => [] },
  console
};
vm.createContext(i18nSandbox);
vm.runInContext(i18nCode, i18nSandbox);
const I18n = i18nSandbox.window.I18n || i18nSandbox.I18n;

import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const CombatScheduler = require('../js/combat-scheduler.js');

const mockElement = () => ({
  addEventListener: () => {},
  removeEventListener: () => {},
  classList: { add: () => {}, remove: () => {}, contains: () => false },
  style: {},
  appendChild: () => {},
  setAttribute: () => {},
  getAttribute: () => null
});

// Load UI
const uiCode = fs.readFileSync(path.join(root, 'js/ui.js'), 'utf8');
const uiSandbox = {
  window: { I18n, addEventListener: () => {}, removeEventListener: () => {} },
  I18n,
  document: {
    documentElement: { style: {} },
    getElementById: mockElement,
    querySelectorAll: () => [],
    querySelector: () => null,
    createElement: mockElement
  },
  history: { pushState: () => {}, back: () => {} },
  addEventListener: () => {},
  removeEventListener: () => {},
  console
};
vm.createContext(uiSandbox);
vm.runInContext(uiCode, uiSandbox);
const UI = uiSandbox.window.UI;

test('I18n - Weekday abbreviations and day types exist symmetrically across EN, HE, AR', () => {
  for (let dow = 0; dow < 7; dow++) {
    const key = `dow_${dow}`;
    assert.ok(I18n.translations.en[key], `en missing ${key}`);
    assert.ok(I18n.translations.he[key], `he missing ${key}`);
    assert.ok(I18n.translations.ar[key], `ar missing ${key}`);
  }

  const expectedTypes = [
    'day_type_legs_core',
    'day_type_push_skill',
    'day_type_pull_grip',
    'day_type_zone2',
    'day_type_active_recovery',
    'day_type_vo2_max',
    'day_type_rest'
  ];

  for (const tKey of expectedTypes) {
    assert.ok(I18n.translations.en[tKey], `en missing ${tKey}`);
    assert.ok(I18n.translations.he[tKey], `he missing ${tKey}`);
    assert.ok(I18n.translations.ar[tKey], `ar missing ${tKey}`);
  }
});

test('I18n - Zero language leaks between English, Hebrew, and Arabic', () => {
  const hebrewRegex = /[\u0590-\u05FF]/;
  const arabicRegex = /[\u0600-\u06FF]/;

  // In EN, only language_selection may mention Arabic/Hebrew
  for (const [k, v] of Object.entries(I18n.translations.en)) {
    if (k === 'language_selection') continue;
    assert.ok(!hebrewRegex.test(v), `English key "${k}" contains Hebrew: "${v}"`);
    assert.ok(!arabicRegex.test(v), `English key "${k}" contains Arabic: "${v}"`);
  }

  // In AR, no Hebrew allowed
  for (const [k, v] of Object.entries(I18n.translations.ar)) {
    if (k === 'language_selection') continue;
    assert.ok(!hebrewRegex.test(v), `Arabic key "${k}" contains Hebrew: "${v}"`);
  }

  // In HE, no Arabic allowed
  for (const [k, v] of Object.entries(I18n.translations.he)) {
    if (k === 'language_selection') continue;
    assert.ok(!arabicRegex.test(v), `Hebrew key "${k}" contains Arabic: "${v}"`);
  }
});

test('UI.getDayTypeInfo - Localizes workout titles according to active language', () => {
  // Test Hebrew
  I18n.setLanguage('he');
  const legsHe = UI.getDayTypeInfo('Legs + Core');
  assert.equal(legsHe.label, 'אימון רגליים וליבה 🦵');
  const pushHe = UI.getDayTypeInfo('Push + Skill');
  assert.equal(pushHe.label, 'אימון דחיפה (Push) 💥');

  // Test English
  I18n.setLanguage('en');
  const legsEn = UI.getDayTypeInfo('Legs + Core');
  assert.equal(legsEn.label, 'Legs + Core 🦵');

  // Test Arabic
  I18n.setLanguage('ar');
  const legsAr = UI.getDayTypeInfo('Legs + Core');
  assert.equal(legsAr.label, 'الأرجل والجذع 🦵');

  // Reset to Hebrew
  I18n.setLanguage('he');
});

test('UI.findTodayIndex - Matches current calendar date when available', () => {
  const todayStr = UI.getLocalDateString().split('-').reverse().join('/');
  const mockPlanDays = [
    { dayIndex: 0, date: '01/01/2026' },
    { dayIndex: 1, date: todayStr },
    { dayIndex: 2, date: '31/12/2026' }
  ];

  const found = UI.findTodayIndex(mockPlanDays);
  assert.equal(found, 1, 'Found todayIndex matching todayStr');
});

test('Combat Scheduler - Golden week permutes weekdays accurately for Mon+Thu classes', () => {
  const result = CombatScheduler.computeWeek({ classDays: [1, 4], practice: 'auto' });
  // Sun..Sat assignment
  // dow 0 (Sun) -> blockPos 6 -> perm[6] = 0 (Legs)
  // dow 1 (Mon) -> blockPos 0 -> perm[0] = 1 (Zone 2)
  // dow 2 (Tue) -> blockPos 1 -> perm[1] = 6 (Rest)
  // dow 3 (Wed) -> blockPos 2 -> perm[2] = 2 (Push)
  // dow 4 (Thu) -> blockPos 3 -> perm[3] = 5 (VO2 Max)
  // dow 5 (Fri) -> blockPos 4 -> perm[4] = 4 (Pull)
  // dow 6 (Sat) -> blockPos 5 -> perm[5] = 3 (Recovery)
  const bpSun = CombatScheduler.blockPosOf(0);
  const bpMon = CombatScheduler.blockPosOf(1);
  const bpThu = CombatScheduler.blockPosOf(4);

  assert.equal(result.permutation[bpSun], 0, 'Sunday is Legs');
  assert.equal(result.permutation[bpMon], 1, 'Monday is Zone 2');
  assert.equal(result.permutation[bpThu], 5, 'Thursday is VO2 Max');
  assert.equal(result.practiceDay, 6, 'Saturday is practice day (Recovery)');
});
