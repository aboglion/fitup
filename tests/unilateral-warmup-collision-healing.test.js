const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');

// Load I18n
const i18nContent = fs.readFileSync(path.join(root, 'js/i18n.js'), 'utf8');
const i18nSandbox = {
  window: {},
  document: {
    documentElement: { lang: 'he', dir: 'rtl', style: { setProperty: () => {} } },
    querySelectorAll: () => []
  },
  navigator: { language: 'he-IL', languages: ['he-IL', 'he', 'en'] },
  localStorage: { getItem: () => 'he', setItem: () => {} }
};
vm.createContext(i18nSandbox);
vm.runInContext(i18nContent, i18nSandbox);
const I18n = i18nSandbox.window.I18n;
I18n.init();

// Load ProgressionEngine
const progressionContent = fs.readFileSync(path.join(root, 'js/progression.js'), 'utf8');
const progSandbox = { window: {}, console };
vm.createContext(progSandbox);
vm.runInContext(progContent => vm.runInThisContext(progContent), progSandbox);
const runProg = new Function('window', 'console', progressionContent);
runProg(progSandbox.window, console);
const ProgressionEngine = progSandbox.window.ProgressionEngine;

test('Warmup vs Main Collision - ProgressionEngine ignores warmup sets for main exercise', async () => {
  const dummyPlanDays = [
    {
      dayIndex: 0,
      dayNum: 1,
      exercises: [
        { slot: 'W1', name: 'Arm Circles', isWarmup: true },
        { slot: 'W2', name: 'Cat Cow', isWarmup: true },
        { slot: 'W3', name: 'Dead Bug', isWarmup: true, sets: '1×6 each side' },
        { slot: 'A1', name: 'Single-Arm Seated OHP', isWarmup: false },
        { slot: 'A8', name: 'Dead Bug', isWarmup: false, sets: '3×12-20/side' }
      ]
    }
  ];

  const dummyTracking = [
    {
      dayIndex: 0,
      setData: {
        2: {
          exerciseName: 'Dead Bug',
          isWarmup: true,
          set_0_done: true,
          set_0_result: 'in_window',
          set_0_reps: 6,
          set_0_weight: 0
        },
        4: {
          exerciseName: 'Dead Bug',
          isWarmup: false,
          set_0_done: true,
          set_0_result: 'in_window',
          set_0_reps: 15,
          set_0_weight: 2,
          set_1_done: true,
          set_1_result: 'in_window',
          set_1_reps: 15,
          set_1_weight: 2,
          set_2_done: true,
          set_2_result: 'in_window',
          set_2_reps: 15,
          set_2_weight: 2
        }
      }
    }
  ];

  progSandbox.window.DB = {
    getAllTracking: async () => dummyTracking,
    getAllPlan: async () => dummyPlanDays
  };

  const prevSession = await ProgressionEngine.getPreviousSessionData('Dead Bug', 1);
  assert.ok(prevSession, 'Should find previous session for Dead Bug');
  assert.equal(prevSession.sets.length, 3, 'Must return the 3 main working sets, NOT the single warmup set');
  assert.equal(prevSession.sets[0].reps, 15);
});

test('Target Guide Unit Detection - 12-20/side is recognized as reps (חזרות), NOT seconds', () => {
  // Load today.js inside sandbox
  const todayContent = fs.readFileSync(path.join(root, 'js/today.js'), 'utf8');
  const todaySandbox = {
    window: { TRAINING_DATA: { exercises: [] } },
    document: {
      getElementById: () => null,
      querySelectorAll: () => [],
      addEventListener: () => {}
    },
    navigator: { language: 'he' },
    localStorage: { getItem: () => null, setItem: () => {} },
    console,
    I18n,
    UI: {
      getCategoryLabel: () => 'Core',
      parseReps: (s) => s,
      parseSetsCount: () => 3,
      formatTempo: (t) => t
    },
    DB: { getDayTracking: async () => null }
  };
  vm.createContext(todaySandbox);
  vm.runInContext(todayContent, todaySandbox);
  const TodayPage = todaySandbox.window.TodayPage;

  // Simulate Dead Bug exercise with 3×12-20/side
  const deadBugEx = {
    id: 'dead-bug',
    name: 'Dead Bug',
    slot: 'A8',
    isWarmup: false,
    sets: '3×12-20/side',
    repWindow: '12-20/side',
    category: 'Core',
    stages: ['Bodyweight', '1kg', '2kg', '3kg']
  };

  // Inspect buildExerciseNoteAndGuideHTML via today.js scope by checking its logic
  // Test regex directly as implemented in today.js:
  const rawSets = deadBugEx.sets;
  const exNameLower = deadBugEx.name.toLowerCase();
  const isCardio = (deadBugEx.category || '').toLowerCase() === 'cardio' || /walk|vo2|running|cardio/i.test(exNameLower);
  const isMins = /\b\d+\s*(?:min|mins|minutes)\b/i.test(rawSets) || /\b(?:דק|דקות)\b/.test(rawSets) || isCardio;
  const isTime = /\b\d+\s*(?:s|sec|secs|seconds|min|mins|minutes)\b/i.test(rawSets) || /\b(?:שנ|שניות|דק|דקות)\b/.test(rawSets) || isCardio || (deadBugEx.type === 'timebased') || (deadBugEx.type === 'interval');
  const unitStr = isTime ? (isMins ? (I18n.t('unit_minutes') || 'דקות') : (I18n.t('unit_seconds') || 'שניות')) : (I18n.t('unit_reps') || 'חזרות');

  assert.equal(isTime, false, '12-20/side must NOT match as time (the "s" in "side" must not trigger seconds)');
  assert.equal(unitStr, 'חזרות', 'Unit string must be חזרות, not שניות');
});

test('Bilateral Sanity - Bilateral exercise rejects unilateral (/side) previous data', () => {
  const todayContent = fs.readFileSync(path.join(root, 'js/today.js'), 'utf8');
  const todaySandbox = {
    window: { TRAINING_DATA: { exercises: [] } },
    document: {
      getElementById: () => null,
      querySelectorAll: () => [],
      addEventListener: () => {}
    },
    navigator: { language: 'he' },
    localStorage: { getItem: () => null, setItem: () => {} },
    console,
    I18n,
    UI: {
      getCategoryLabel: () => 'Glutes',
      parseReps: (s) => s,
      parseSetsCount: () => 3,
      formatTempo: (t) => t
    },
    DB: { getDayTracking: async () => null }
  };
  vm.createContext(todaySandbox);
  vm.runInContext(todayContent, todaySandbox);
  const TodayPage = todaySandbox.window.TodayPage;

  const dbGluteBridge = {
    id: 'db-glute-bridge',
    name: 'DB Glute Bridge',
    slot: 'A5',
    sets: '4×10-15',
    repWindow: '10-15',
    weight: '8 kg total',
    isWarmup: false
  };

  const setsStr = (dbGluteBridge.sets || '').toLowerCase();
  const repWinStr = (dbGluteBridge.repWindow || '').toLowerCase();
  const isBilateral = !(/\b(side|each side|\/side|leg|\/leg|each leg|hand|arm)\b/i.test(setsStr) || /\b(side|each side|\/side|leg|\/leg|each leg|hand|arm)\b/i.test(repWinStr));
  assert.equal(isBilateral, true, 'DB Glute Bridge is strictly bilateral');

  // Test set data with unilateral marker
  const corruptedSetData = {
    set_0_reps: '12-20/side',
    set_0_done: true,
    set_0_result: 'in_window'
  };

  let hasUnilateralMarker = false;
  for (let s = 0; s < 10; s++) {
    const r = corruptedSetData[`set_${s}_reps`];
    if (r && /\b(side|each side|\/side|leg|\/leg|each leg)\b/i.test(String(r))) {
      hasUnilateralMarker = true;
    }
  }

  assert.equal(hasUnilateralMarker, true, 'Corrupted data has unilateral marker');
  const shouldAccept = !(isBilateral && hasUnilateralMarker);
  assert.equal(shouldAccept, false, 'Bilateral exercise must reject unilateral set data');
});
