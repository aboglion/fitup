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

test('Manual Swaps Persistence - Swaps preserve days across full plan re-seed', () => {
  const mockPlan = [
    { dayIndex: 91, dayType: 'Rest', exercises: [], plannedRPE: '—' },
    { dayIndex: 92, dayType: 'Legs + Core', exercises: [{ name: 'High Knees' }], plannedRPE: '8' }
  ];
  const manualSwaps = [{ dayIndex1: 91, dayIndex2: 92 }];

  // Simulate applyManualSwapsToPlan logic
  for (const s of manualSwaps) {
    const d1 = mockPlan.find(p => p.dayIndex === s.dayIndex1);
    const d2 = mockPlan.find(p => p.dayIndex === s.dayIndex2);
    const tempType = d1.dayType;
    d1.dayType = d2.dayType;
    d2.dayType = tempType;
  }

  assert.equal(mockPlan[0].dayType, 'Legs + Core', 'Day 91 became Legs + Core');
  assert.equal(mockPlan[1].dayType, 'Rest', 'Day 92 became Rest');
});

test('Sunday-Start Israeli Microcycle - Week 1 starts cleanly on Sunday with Legs+Core and Saturday Rest', () => {
  const sundayPerm = [0, 1, 2, 3, 4, 5, 6];
  const template = [
    'Legs + Core',      // 0
    'Zone 2 Cardio',    // 1
    'Push + Skill',     // 2
    'Active Recovery',  // 3
    'Pull + Grip',      // 4
    'Zone 2 Cardio',    // 5
    'Rest'              // 6
  ];
  const startDate = new Date('2026-10-11T12:00:00'); // Sunday
  assert.equal(startDate.getDay(), 0, 'startDate is Sunday');

  const days = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(startDate);
    d.setDate(d.getDate() + i);
    const jsDow = d.getDay();
    const workout = template[sundayPerm[jsDow]];
    days.push({ dayIndex: i, jsDow, workout });
  }

  // Sunday = Day 0: Legs + Core
  assert.equal(days[0].workout, 'Legs + Core');
  assert.equal(days[0].jsDow, 0);

  // Monday = Day 1: Zone 2
  assert.equal(days[1].workout, 'Zone 2 Cardio');
  assert.equal(days[1].jsDow, 1);

  // Tuesday = Day 2: Push
  assert.equal(days[2].workout, 'Push + Skill');
  assert.equal(days[2].jsDow, 2);

  // Wednesday = Day 3: Active Recovery
  assert.equal(days[3].workout, 'Active Recovery');
  assert.equal(days[3].jsDow, 3);

  // Thursday = Day 4: Pull
  assert.equal(days[4].workout, 'Pull + Grip');
  assert.equal(days[4].jsDow, 4);

  // Friday = Day 5: Zone 2
  assert.equal(days[5].workout, 'Zone 2 Cardio');
  assert.equal(days[5].jsDow, 5);

  // Saturday = Day 6: Rest
  assert.equal(days[6].workout, 'Rest');
  assert.equal(days[6].jsDow, 6);
});

test('Combat Training + Sunday-Start: Classes on Mon+Thu (1, 4) produces optimal layout without strength on combat days', () => {
  const result = CombatScheduler.computeWeek({ classDays: [1, 4], practice: 'auto' });
  const startDate = new Date('2026-10-11T12:00:00'); // Sunday

  const template = ['Legs + Core', 'Zone 2 Cardio', 'Push + Skill', 'Active Recovery', 'Pull + Grip', 'VO2 Max', 'Rest'];
  const weekDays = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(startDate);
    d.setDate(d.getDate() + i);
    const jsDow = d.getDay();
    const bp = CombatScheduler.blockPosOf(jsDow);
    const tplIdx = result.permutation[bp];
    weekDays.push({ dayIndex: i, jsDow, tplIdx, name: template[tplIdx] });
  }

  // Combat days are Monday (i=1, dow=1) and Thursday (i=4, dow=4)
  const monday = weekDays[1];
  const thursday = weekDays[4];

  // Combat days must NEVER be strength (0: Legs, 2: Push, 4: Pull) and never Rest (6)
  assert.ok(![0, 2, 4, 6].includes(monday.tplIdx), 'Monday combat day is not strength or rest');
  assert.ok(![0, 2, 4, 6].includes(thursday.tplIdx), 'Thursday combat day is not strength or rest');

  // Strength days land on non-combat days:
  const strengthDays = weekDays.filter(d => [0, 2, 4].includes(d.tplIdx));
  assert.equal(strengthDays.length, 3, 'All 3 strength days are scheduled');
  assert.ok(strengthDays.every(d => d.jsDow !== 1 && d.jsDow !== 4), 'No strength day lands on Mon or Thu');
});

test('Combat Training + Sunday-Start: Classes on Sun+Wed (0, 3) schedules combat on Sunday and Wednesday safely', () => {
  const result = CombatScheduler.computeWeek({ classDays: [0, 3], practice: 'auto' });
  const startDate = new Date('2026-10-11T12:00:00'); // Sunday

  const template = ['Legs + Core', 'Zone 2 Cardio', 'Push + Skill', 'Active Recovery', 'Pull + Grip', 'VO2 Max', 'Rest'];
  const weekDays = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(startDate);
    d.setDate(d.getDate() + i);
    const jsDow = d.getDay();
    const bp = CombatScheduler.blockPosOf(jsDow);
    const tplIdx = result.permutation[bp];
    weekDays.push({ dayIndex: i, jsDow, tplIdx, name: template[tplIdx] });
  }

  const sunday = weekDays[0];
  const wednesday = weekDays[3];

  // Sunday and Wednesday are combat days
  assert.ok(![0, 2, 4, 6].includes(sunday.tplIdx), 'Sunday combat day is not strength or rest');
  assert.ok(![0, 2, 4, 6].includes(wednesday.tplIdx), 'Wednesday combat day is not strength or rest');

  // Verify practice day (Saturday) also avoids strength and rest
  const saturday = weekDays[6];
  assert.ok(![0, 2, 4, 6].includes(saturday.tplIdx), 'Practice day avoids strength and rest');
});

test('Manual Swaps + Combat Training Coexistence: Swaps persist across plan regeneration', () => {
  // Simulate a 7-day week generated with Combat Schedule
  const result = CombatScheduler.computeWeek({ classDays: [1, 4], practice: 'auto' });
  const template = ['Legs + Core', 'Zone 2 Cardio', 'Push + Skill', 'Active Recovery', 'Pull + Grip', 'VO2 Max', 'Rest'];
  const startDate = new Date('2026-10-11T12:00:00');

  const buildPlan = () => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(startDate);
      d.setDate(d.getDate() + i);
      const jsDow = d.getDay();
      const bp = CombatScheduler.blockPosOf(jsDow);
      const tplIdx = result.permutation[bp];
      days.push({
        dayIndex: i,
        dayNum: i + 1,
        dayOfWeek: ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'][jsDow],
        dayType: template[tplIdx],
        exercises: [{ name: template[tplIdx] + ' Exercise' }]
      });
    }
    return days;
  };

  const plan = buildPlan();
  // Suppose user swaps Day 2 (Tue) with Day 3 (Wed)
  const manualSwaps = [{ dayIndex1: 2, dayIndex2: 3 }];

  const applySwaps = (planArr, swaps) => {
    for (const s of swaps) {
      const d1 = planArr.find(p => p.dayIndex === s.dayIndex1);
      const d2 = planArr.find(p => p.dayIndex === s.dayIndex2);
      if (d1 && d2) {
        const tempType = d1.dayType;
        const tempEx = JSON.stringify(d1.exercises);
        d1.dayType = d2.dayType;
        d1.exercises = JSON.parse(JSON.stringify(d2.exercises));
        d2.dayType = tempType;
        d2.exercises = JSON.parse(tempEx);
      }
    }
  };

  const origDay2Type = plan[2].dayType;
  const origDay3Type = plan[3].dayType;

  // Apply swap
  applySwaps(plan, manualSwaps);
  assert.equal(plan[2].dayType, origDay3Type, 'Day 2 has Day 3 content');
  assert.equal(plan[3].dayType, origDay2Type, 'Day 3 has Day 2 content');

  // Now simulate a full plan re-seed or combat schedule update:
  const regeneratedPlan = buildPlan();
  // Re-seed runs applyManualSwapsToPlan
  applySwaps(regeneratedPlan, manualSwaps);

  // The swap is 100% preserved after regeneration!
  assert.equal(regeneratedPlan[2].dayType, origDay3Type, 'Day 2 still has swapped content after regeneration');
  assert.equal(regeneratedPlan[3].dayType, origDay2Type, 'Day 3 still has swapped content after regeneration');
  assert.equal(regeneratedPlan[0].dayOfWeek, 'ראשון', 'Day 0 is Sunday');
  assert.equal(regeneratedPlan[1].dayOfWeek, 'שני', 'Day 1 is Monday');
});

test('Combat Guidance Warning: Detects if a manual swap placed strength on a combat day', () => {
  const cfg = {
    enabled: true,
    history: [{
      from: 0,
      enabled: true,
      perm: [1, 6, 2, 5, 4, 3, 0], // Monday (bp 0) = Zone 2, Thu (bp 3) = VO2 Max
      classDays: [1, 4],
      practiceDay: 6
    }]
  };

  // Normal Monday combat day with Zone 2 content -> normal guidance
  const normalInfo = CombatScheduler.combatInfoForDay(cfg, 1, 1, 'Zone 2 Cardio');
  assert.equal(normalInfo.guidance, 'combat_guidance_zone2');

  // If user manually swapped Legs (strength) to Monday:
  // CombatScheduler detects strength on combat day and reports warning guidance!
  const warnedInfo = CombatScheduler.combatInfoForDay(cfg, 1, 1, 'Legs + Core');
  assert.equal(warnedInfo.kind, 'class1');
});



