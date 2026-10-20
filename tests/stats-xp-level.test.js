const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

function setupStatsSandbox() {
  const root = path.join(__dirname, '..');
  const sandbox = {
    window: {},
    console: console,
    document: {
      getElementById: () => null
    },
    I18n: {
      t: (key) => key,
      currentLang: 'he'
    },
    UI: {
      findTodayIndex: () => 0,
      formatShortDate: () => '',
      getLocalDateString: () => '2026-10-20'
    },
    DB: {
      getSetting: async () => null,
      getAllPlan: async () => [],
      getAllTracking: async () => []
    }
  };
  sandbox.window = sandbox;
  vm.createContext(sandbox);

  const statsCode = fs.readFileSync(path.join(root, 'js/stats.js'), 'utf8');
  vm.runInContext(statsCode, sandbox);
  return sandbox.window.StatsPage;
}

test('StatsPage - getDayXP awards correct XP for all program day types', () => {
  const StatsPage = setupStatsSandbox();

  // Strength days
  assert.strictEqual(StatsPage.getDayXP({ dayType: 'Legs + Core' }), 500);
  assert.strictEqual(StatsPage.getDayXP({ dayType: 'Push + Skill' }), 500);
  assert.strictEqual(StatsPage.getDayXP({ dayType: 'Pull + Grip' }), 500);
  assert.strictEqual(StatsPage.getDayXP({ dayType: 'Legs + Core (Deload)' }), 500);

  // Cardio & Conditioning days
  assert.strictEqual(StatsPage.getDayXP({ dayType: 'VO2 Max' }), 400);
  assert.strictEqual(StatsPage.getDayXP({ dayType: 'Zone 2 Cardio' }), 300);

  // Recovery & Rest
  assert.strictEqual(StatsPage.getDayXP({ dayType: 'Active Recovery' }), 200);
  assert.strictEqual(StatsPage.getDayXP({ dayType: 'Rest' }), 50);
});

test('StatsPage - calculateXPAndLevel computes accurate levels and synchronized progress', () => {
  const StatsPage = setupStatsSandbox();

  const mockPlanDays = [
    { dayIndex: 0, dayType: 'Legs + Core' }, // 500 XP
    { dayIndex: 1, dayType: 'Zone 2 Cardio' }, // 300 XP
    { dayIndex: 2, dayType: 'Rest' }, // 50 XP
    { dayIndex: 3, dayType: 'Push + Skill' }, // 500 XP
    { dayIndex: 4, dayType: 'Active Recovery' }, // 200 XP
    { dayIndex: 5, dayType: 'Pull + Grip' }, // 500 XP
    { dayIndex: 6, dayType: 'VO2 Max' } // 400 XP
  ];

  // Case 0: 0 completed workouts
  const res0 = StatsPage.calculateXPAndLevel(mockPlanDays, []);
  assert.strictEqual(res0.totalXP, 0);
  assert.strictEqual(res0.currentLevel, 1);
  assert.strictEqual(res0.xpInCurrentLevel, 0);
  assert.strictEqual(res0.xpNeededForLevel, 500);
  assert.strictEqual(res0.levelProgress, 0);

  // Case 1: 1 strength workout completed (500 XP) -> Level 2
  const res1 = StatsPage.calculateXPAndLevel(mockPlanDays, [{ dayIndex: 0, completed: true }]);
  assert.strictEqual(res1.totalXP, 500);
  assert.strictEqual(res1.currentLevel, 2);
  assert.strictEqual(res1.xpInCurrentLevel, 0);
  assert.strictEqual(res1.xpNeededForLevel, 1500); // 2000 - 500
  assert.strictEqual(res1.levelProgress, 0);

  // Case 2: 2 strength workouts completed (1000 XP) -> Level 2
  const res2 = StatsPage.calculateXPAndLevel(mockPlanDays, [
    { dayIndex: 0, completed: true },
    { dayIndex: 3, completed: true }
  ]);
  assert.strictEqual(res2.totalXP, 1000);
  assert.strictEqual(res2.currentLevel, 2);
  assert.strictEqual(res2.xpInCurrentLevel, 500);
  assert.strictEqual(res2.xpNeededForLevel, 1500);
  assert.strictEqual(Math.round(res2.levelProgress), 33); // 500 / 1500 = 33.3%

  // Case 3: Reaching Level 3 (2000 XP threshold: 3 strength (1500) + 1 VO2 (400) + 1 rest (50) + not quite, let's make 2050 XP)
  const res3 = StatsPage.calculateXPAndLevel(mockPlanDays, [
    { dayIndex: 0, completed: true }, // 500
    { dayIndex: 1, completed: true }, // 300
    { dayIndex: 2, completed: true }, // 50
    { dayIndex: 3, completed: true }, // 500
    { dayIndex: 4, completed: true }, // 200
    { dayIndex: 5, completed: true }  // 500 -> total = 2050 XP
  ]);
  assert.strictEqual(res3.totalXP, 2050);
  assert.strictEqual(res3.currentLevel, 3);
  assert.strictEqual(res3.xpInCurrentLevel, 50); // 2050 - 2000
  assert.strictEqual(res3.xpNeededForLevel, 2500); // 4500 - 2000
  assert.strictEqual(res3.levelProgress, 2); // 50 / 2500 * 100 = 2%
});
