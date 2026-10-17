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

test('UI.getDayOfWeekName localizes Sunday through Saturday correctly in Hebrew', () => {
  I18n.setLanguage('he');
  const expectedHe = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
  for (let i = 0; i < 7; i++) {
    const day = { dayIndex: i, date: `1${1 + i}/10/2026` };
    const name = UI.getDayOfWeekName(day);
    assert.equal(name, expectedHe[i], `Day index ${i} should be ${expectedHe[i]}`);
  }
});

test('UI.getDayOfWeekName localizes Sunday through Saturday correctly in Arabic', () => {
  I18n.setLanguage('ar');
  const expectedAr = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
  for (let i = 0; i < 7; i++) {
    const day = { dayIndex: i, date: `1${1 + i}/10/2026` };
    const name = UI.getDayOfWeekName(day);
    assert.equal(name, expectedAr[i], `Day index ${i} should be ${expectedAr[i]}`);
  }
});

test('UI.getDayOfWeekName localizes Sunday through Saturday correctly in English', () => {
  I18n.setLanguage('en');
  const expectedEn = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  for (let i = 0; i < 7; i++) {
    const day = { dayIndex: i, date: `1${1 + i}/10/2026` };
    const name = UI.getDayOfWeekName(day);
    assert.equal(name, expectedEn[i], `Day index ${i} should be ${expectedEn[i]}`);
  }
});

test('UI.getDayOfWeekName correctly translates existing English strings like "Monday" when language is Hebrew', () => {
  I18n.setLanguage('he');
  assert.equal(UI.getDayOfWeekName({ dayOfWeek: 'Monday', dayIndex: 1 }), 'שני');
  assert.equal(UI.getDayOfWeekName({ dayOfWeek: 'Sunday', dayIndex: 0 }), 'ראשון');
  assert.equal(UI.getDayOfWeekName({ dayOfWeek: 'Saturday', dayIndex: 6 }), 'שבת');
  // Explicit dayOfWeek overrides differing dayIndex
  assert.equal(UI.getDayOfWeekName({ dayOfWeek: 'Thursday', dayIndex: 1 }), 'חמישי');
  assert.equal(UI.getDayOfWeekName({ dayOfWeek: 'יום רביעי' }), 'רביעי');
  assert.equal(UI.getDayOfWeekName({ date: '2026-09-10' }), 'חמישי');
});

test('UI.getDayOfWeekName correctly translates existing English strings like "Monday" when language is Arabic', () => {
  I18n.setLanguage('ar');
  assert.equal(UI.getDayOfWeekName({ dayOfWeek: 'Monday', dayIndex: 1 }), 'الاثنين');
  assert.equal(UI.getDayOfWeekName({ dayOfWeek: 'Sunday', dayIndex: 0 }), 'الأحد');
  assert.equal(UI.getDayOfWeekName({ dayOfWeek: 'Saturday', dayIndex: 6 }), 'السبت');
  // Explicit dayOfWeek overrides differing dayIndex
  assert.equal(UI.getDayOfWeekName({ dayOfWeek: 'Thursday', dayIndex: 1 }), 'الخميس');
  assert.equal(UI.getDayOfWeekName({ dayOfWeek: 'יום רביעי' }), 'الأربعاء');
  assert.equal(UI.getDayOfWeekName({ date: '2026-09-10' }), 'الخميس');
});

test('Every week in the calendar starts on Sunday (Day 1 of week) across Hebrew, Arabic, and English', () => {
  const allPlanDays = [];
  for (let i = 0; i < 14; i++) {
    allPlanDays.push({
      dayIndex: i,
      dayNum: i + 1,
      week: i < 7 ? 'Week 1' : 'Week 2',
      dayType: i % 2 === 0 ? 'Legs + Core' : 'Rest'
    });
  }

  // Week 1 days:
  const week1Days = allPlanDays.slice(0, 7);
  assert.equal(week1Days.length, 7);
  assert.equal(week1Days[0].dayNum, 1, 'First day of week 1 is Day #1');
  assert.equal(week1Days[6].dayNum, 7, 'Last day of week 1 is Day #7');

  // Week 2 days:
  const week2Days = allPlanDays.slice(7, 14);
  assert.equal(week2Days.length, 7);
  assert.equal(week2Days[0].dayNum, 8, 'First day of week 2 is Day #8');
  assert.equal(week2Days[6].dayNum, 14, 'Last day of week 2 is Day #14');

  // Verify that dayIndex 0 is Sunday, dayIndex 1 is Monday, ..., dayIndex 6 is Saturday
  I18n.setLanguage('he');
  assert.equal(UI.getDayOfWeekName(week1Days[0]), 'ראשון');
  assert.equal(UI.getDayOfWeekName(week1Days[1]), 'שני');
  assert.equal(UI.getDayOfWeekName(week1Days[6]), 'שבת');

  I18n.setLanguage('ar');
  assert.equal(UI.getDayOfWeekName(week1Days[0]), 'الأحد');
  assert.equal(UI.getDayOfWeekName(week1Days[1]), 'الاثنين');
  assert.equal(UI.getDayOfWeekName(week1Days[6]), 'السبت');

  I18n.setLanguage('en');
  assert.equal(UI.getDayOfWeekName(week1Days[0]), 'Sunday');
  assert.equal(UI.getDayOfWeekName(week1Days[1]), 'Monday');
  assert.equal(UI.getDayOfWeekName(week1Days[6]), 'Saturday');
});

test('CalendarPage DOM grid direction is rtl in Hebrew and Arabic, and ltr in English', async () => {
  let gridDir = null;
  let gridInnerHTML = '';
  const mockGrid = {
    setAttribute: (attr, val) => { if (attr === 'dir') gridDir = val; },
    style: {},
    set innerHTML(val) { gridInnerHTML = val; },
    get innerHTML() { return gridInnerHTML; }
  };
  const mockPrevBtn = { disabled: false, textContent: '', addEventListener: () => {} };
  const mockNextBtn = { disabled: false, textContent: '', addEventListener: () => {} };
  const mockLabel = { textContent: '' };

  const calSandbox = {
    window: { I18n, UI, addEventListener: () => {}, removeEventListener: () => {} },
    I18n,
    UI,
    document: {
      documentElement: { dir: 'rtl', style: {} },
      getElementById: (id) => {
        if (id === 'calendar-grid') return mockGrid;
        if (id === 'cal-prev-week') return mockPrevBtn;
        if (id === 'cal-next-week') return mockNextBtn;
        if (id === 'cal-week-label') return mockLabel;
        return null;
      }
    },
    DB: {
      getSetting: async () => null,
      getCombatExceptions: async () => ({ rev: 0, items: [] }),
      getDayTracking: async () => null
    },
    console
  };

  const calendarCode = fs.readFileSync(path.join(root, 'js/calendar.js'), 'utf8');
  vm.createContext(calSandbox);
  vm.runInContext(calendarCode, calSandbox);
  const CalendarPage = calSandbox.window.CalendarPage;

  const mockPlanDays = [];
  for (let i = 0; i < 14; i++) {
    mockPlanDays.push({
      dayIndex: i,
      dayNum: i + 1,
      week: i < 7 ? 'Week 1' : 'Week 2',
      dayType: 'Legs + Core'
    });
  }

  // 1. Hebrew -> RTL
  I18n.setLanguage('he');
  calSandbox.document.documentElement.dir = 'rtl';
  CalendarPage.init(mockPlanDays);
  await CalendarPage.render();
  assert.equal(gridDir, 'rtl', 'Calendar grid must be rtl in Hebrew');
  assert.ok(gridInnerHTML.includes('ראשון'), 'Hebrew calendar must include יום ראשון');
  assert.ok(gridInnerHTML.includes('שבת'), 'Hebrew calendar must include יום שבת');
  assert.ok(!gridInnerHTML.includes('undefined'), 'No undefined text in calendar');

  // 2. Arabic -> RTL
  I18n.setLanguage('ar');
  calSandbox.document.documentElement.dir = 'rtl';
  await CalendarPage.render();
  assert.equal(gridDir, 'rtl', 'Calendar grid must be rtl in Arabic');
  assert.ok(gridInnerHTML.includes('الأحد'), 'Arabic calendar must include الأحد');
  assert.ok(gridInnerHTML.includes('السبت'), 'Arabic calendar must include السبت');

  // 3. English -> LTR
  I18n.setLanguage('en');
  calSandbox.document.documentElement.dir = 'ltr';
  await CalendarPage.render();
  assert.equal(gridDir, 'ltr', 'Calendar grid must be ltr in English');
  assert.ok(gridInnerHTML.includes('Sunday'), 'English calendar must include Sunday');
  assert.ok(gridInnerHTML.includes('Saturday'), 'English calendar must include Saturday');
});

test('CalendarPage highlights currently viewed day with .selected and real today with .today and badge', async () => {
  let gridInnerHTML = '';
  const mockGrid = {
    setAttribute: () => {},
    style: {},
    set innerHTML(val) { gridInnerHTML = val; },
    get innerHTML() { return gridInnerHTML; }
  };
  const mockPlanDays = [];
  for (let i = 0; i < 7; i++) {
    mockPlanDays.push({
      dayIndex: i,
      dayNum: i + 1,
      week: 'Week 1',
      dayType: i === 1 ? 'Rest' : 'Legs + Core',
      date: `1${1 + i}/10/2026`
    });
  }

  const calSandbox = {
    window: {
      I18n,
      UI,
      TodayPage: {
        getCurrentDayIndex: () => 1 // Currently viewing Day #2 (Monday, index 1)
      },
      appCurrentPlanIndex: 1
    },
    I18n,
    UI: {
      ...UI,
      findTodayIndex: () => 1 // Real today is Monday (index 1)
    },
    document: {
      documentElement: { dir: 'rtl', style: {} },
      getElementById: (id) => {
        if (id === 'calendar-grid') return mockGrid;
        if (id === 'cal-prev-week' || id === 'cal-next-week') return { disabled: false, addEventListener: () => {} };
        if (id === 'cal-week-label') return { textContent: '' };
        return null;
      }
    },
    DB: {
      getSetting: async () => null,
      getCombatExceptions: async () => ({ rev: 0, items: [] }),
      getDayTracking: async () => null
    },
    console
  };

  const calendarCode = fs.readFileSync(path.join(root, 'js/calendar.js'), 'utf8');
  vm.createContext(calSandbox);
  vm.runInContext(calendarCode, calSandbox);
  const CalendarPage = calSandbox.window.CalendarPage;

  I18n.setLanguage('he');
  CalendarPage.init(mockPlanDays);
  await CalendarPage.render();

  // Monday (Day #2, index 1) must have both 'selected' and 'today' and the 'היום' badge
  assert.ok(gridInnerHTML.includes('calendar-day selected today'), 'Monday card must have selected and today classes');
  assert.ok(gridInnerHTML.includes('calendar-today-badge'), 'Monday card must have the today badge');
  assert.ok(gridInnerHTML.includes('היום'), 'Today badge text must be present');
});
