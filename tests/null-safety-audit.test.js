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

test('Null Safety - UI.getDayOfWeekName handles null, empty, Day of Week with space, and dayIndex', () => {
  assert.equal(UI.getDayOfWeekName(null), '', 'null day should return empty string');
  assert.equal(UI.getDayOfWeekName(undefined), '', 'undefined day should return empty string');
  assert.equal(UI.getDayOfWeekName({}), '', 'empty day object should return empty string');

  // Test "Day of Week" property with space (from raw training_data.json)
  I18n.setLanguage('he');
  const rawDayWithSpace = { "Day of Week": "Sunday" };
  assert.equal(UI.getDayOfWeekName(rawDayWithSpace), 'ראשון', 'Should resolve Day of Week with space in Hebrew');

  const rawDayWedAr = { "Day of Week": "Wednesday" };
  I18n.setLanguage('ar');
  assert.equal(UI.getDayOfWeekName(rawDayWedAr), 'الأربعاء', 'Should resolve Wednesday in Arabic');

  // Test dayIndex only
  I18n.setLanguage('he');
  assert.equal(UI.getDayOfWeekName({ dayIndex: 0 }), 'ראשון', 'dayIndex 0 should be Sunday (ראשון)');
  assert.equal(UI.getDayOfWeekName({ dayIndex: 3 }), 'רביעי', 'dayIndex 3 should be Wednesday (רביעי)');
  assert.equal(UI.getDayOfWeekName({ dayIndex: 6 }), 'שבת', 'dayIndex 6 should be Saturday (שבת)');

  // Test date only
  assert.equal(UI.getDayOfWeekName({ date: "11/10/2026" }), 'ראשון', '11/10/2026 should be Sunday');
});

test('Null Safety - Calendar dayNum and stats tooltip null-safety', () => {
  // Verify that fallback day.dayNum || (day.dayIndex + 1) never produces undefined
  const rawDayWithoutNum = { dayIndex: 4, dayType: 'Active Recovery' };
  const dayNum = rawDayWithoutNum.dayNum || (rawDayWithoutNum.dayIndex + 1);
  assert.equal(dayNum, 5, 'Fallback dayNum should be 5');
  assert.notEqual(dayNum, undefined);
  assert.ok(!String(dayNum).includes('undefined'));

  // Verify typeLabel fallback
  I18n.setLanguage('he');
  const typeLabel = UI.getDayTypeInfo(rawDayWithoutNum.dayType).label;
  assert.ok(typeLabel && !typeLabel.includes('undefined'));
});
