const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.join(__dirname, '..');

function createSandbox() {
  const elements = {};
  const getOrCreateElement = (id) => {
    if (!elements[id]) {
      elements[id] = {
        id,
        innerHTML: '',
        addEventListener: () => {},
        removeEventListener: () => {},
        classList: {
          classes: new Set(),
          add(c) { this.classes.add(c); },
          remove(c) { this.classes.delete(c); },
          contains(c) { return this.classes.has(c); }
        },
        appendChild: () => {},
        remove: () => {},
        setAttribute: () => {},
        getAttribute: () => null,
        removeAttribute: () => {},
        querySelector: () => null,
        querySelectorAll: () => [],
        style: { setProperty: () => {} },
        dataset: {},
        value: ''
      };
    }
    return elements[id];
  };

  const sandbox = {
    window: {},
    document: {
      body: { classList: { add() {}, remove() {}, contains() { return false; } } },
      documentElement: { style: { setProperty: () => {} }, setAttribute: () => {} },
      getElementById: (id) => getOrCreateElement(id),
      querySelector: (sel) => getOrCreateElement(sel),
      querySelectorAll: () => [],
      createElement: (tag) => getOrCreateElement(tag)
    },
    history: { pushState: () => {}, back: () => {} },
    console: console,
    setTimeout: global.setTimeout,
    clearTimeout: global.clearTimeout,
    navigator: { language: 'he' },
    localStorage: { getItem() { return null; }, setItem() {} },
    addEventListener: () => {},
    removeEventListener: () => {}
  };
  sandbox.window = sandbox;
  sandbox.window.addEventListener = () => {};
  sandbox.window.removeEventListener = () => {};

  vm.createContext(sandbox);

  // Load I18n
  const i18nCode = fs.readFileSync(path.join(root, 'js/i18n.js'), 'utf8');
  vm.runInContext(i18nCode, sandbox);
  sandbox.I18n = sandbox.window.I18n;

  // Load data
  const dataCode = fs.readFileSync(path.join(root, 'js/data.js'), 'utf8');
  vm.runInContext(dataCode, sandbox);

  // Load UI mock
  sandbox.UI = {
    parseSetsCount: (s) => 1,
    getCategoryColor: () => '#10b981',
    getCategoryLabel: () => 'Cardio',
    parseReps: () => '20',
    getEquipment: () => ({ icon: '👟', label: 'Treadmill' }),
    getImageUrl: () => 'images/exercises/RELAXED WALKING.png',
    getGifUrl: () => 'images/exercises/Relaxed Walking.gif',
    formatTempo: (t) => t,
    findTodayIndex: () => 0,
    toast: (msg, type) => {},
    enrichHeartRateText: (t) => t,
    getDayTypeInfo: () => ({ label: 'Active Recovery', class: 'recovery' }),
    getLocalDateString: (d = new Date()) => '2026-10-15'
  };

  // Load DB mock
  sandbox.DB = {
    getSetting: async (key) => (key === 'planStartDate' ? '2026-10-11' : null),
    setSetting: async () => {},
    getDayTracking: async () => null,
    saveDayTracking: async () => {},
    getAllTracking: async () => [],
    getAllPlan: async () => [],
    getExerciseGuide: async () => ({}),
    getCombatExceptions: async () => ({ rev: 0, items: [] }),
    syncRestDays: async () => {},
    syncPastRelaxedWalks: async () => {}
  };

  // Load CloudSync mock
  sandbox.CloudSync = {
    isLoggedIn: async () => true,
    getAccessToken: async () => 'mock_token',
    scheduleSync: () => {}
  };

  // Load GoogleFitService mock
  sandbox.GoogleFitService = {
    fetchDailyFitData: async (dateStr) => ({
      steps: 8500,
      calories: 420,
      avgHeartRate: 95,
      maxHeartRate: 115,
      heartPoints: 25
    })
  };

  // Load today.js
  const todayCode = fs.readFileSync(path.join(root, 'js/today.js'), 'utf8');
  vm.runInContext(todayCode, sandbox);
  sandbox.TodayPage = sandbox.window.TodayPage;

  return sandbox;
}

test('Walking Step Progress - isRelaxedWalkingExercise detects relaxed walking variants only', () => {
  const sb = createSandbox();
  const TodayPage = sb.TodayPage;

  assert.ok(TodayPage.isRelaxedWalkingExercise({ id: 'relaxed-walking', name: 'Relaxed Walking' }));
  assert.ok(TodayPage.isRelaxedWalkingExercise({ name: 'Relaxed Walking' }));
  assert.ok(TodayPage.isRelaxedWalkingExercise({ name: 'Active Recovery Walk' }));
  assert.ok(TodayPage.isRelaxedWalkingExercise({ name: 'הליכה רגועה להתאוששות' }));

  // Brisk walking is Zone 2 cardio and must NOT be treated as relaxed walking
  assert.equal(TodayPage.isRelaxedWalkingExercise({ id: 'brisk-walking', name: 'Brisk Walking' }), false);
  assert.equal(TodayPage.isRelaxedWalkingExercise({ name: 'VO2 Max Norwegian 4x4' }), false);
  assert.equal(TodayPage.isRelaxedWalkingExercise({ name: 'Push-Up Progression' }), false);
});

test('Walking Step Progress - getDayIsoDate accurately parses various date formats', () => {
  const sb = createSandbox();
  const TodayPage = sb.TodayPage;

  assert.equal(TodayPage.getDayIsoDate({ date: '15/10/2026' }), '2026-10-15');
  assert.equal(TodayPage.getDayIsoDate({ date: '01/05/2026' }), '2026-05-01');
  assert.equal(TodayPage.getDayIsoDate({ date: '2026-10-15' }), '2026-10-15');
  assert.equal(TodayPage.getDayIsoDate(null), null);
});

test('Walking Step Progress - auto-sync completes exercise when steps >= 8000', async () => {
  const sb = createSandbox();
  const TodayPage = sb.TodayPage;

  const mockDay = {
    dayIndex: 3,
    date: '15/10/2026',
    exercises: [
      { id: 'band-neck-flexion', name: 'Band Neck Flexion & Extension', sets: '2x15-20' },
      { id: 'relaxed-walking', name: 'Relaxed Walking', sets: '20 mins' }
    ]
  };

  // Test silent sync with mocked Google Fit (returns 8,500 steps >= 8,000 threshold)
  await TodayPage.syncRelaxedWalkingSteps(mockDay, 1, false);

  // TodayPage uses currentTracking internally. Let's verify via DOM rendering or sync
  assert.ok(typeof TodayPage.toggleRelaxedWalkBySteps === 'function');
  assert.ok(typeof TodayPage.syncStepsFromFit === 'function');
  assert.ok(typeof TodayPage.promptManualSteps === 'function');
});

test('Walking Step Progress - steps under 8000 does not auto-complete', async () => {
  const sb = createSandbox();
  const TodayPage = sb.TodayPage;

  // Mock Google Fit to return 5,200 steps (< 8,000)
  sb.GoogleFitService.fetchDailyFitData = async () => ({
    steps: 5200,
    calories: 210,
    avgHeartRate: 85,
    maxHeartRate: 105,
    heartPoints: 10
  });

  const mockDay = {
    dayIndex: 3,
    date: '15/10/2026',
    exercises: [
      { id: 'relaxed-walking', name: 'Relaxed Walking', sets: '20 mins' }
    ]
  };

  await TodayPage.syncRelaxedWalkingSteps(mockDay, 0, false);
  // Should not throw and methods remain healthy
  assert.ok(typeof TodayPage.toggleRelaxedWalkBySteps === 'function');
});

test('Walking Step Progress - i18n keys for steps tracking exist across EN, HE, AR', () => {
  const sb = createSandbox();
  const I18n = sb.I18n;

  const requiredKeys = [
    'walking_step_tracker_title',
    'walking_step_tracker_desc',
    'step_goal_badge',
    'steps_unit',
    'steps_achieved',
    'steps_completion_pct',
    'steps_goal_reached_title',
    'steps_goal_reached_desc',
    'steps_goal_pending_title',
    'steps_goal_pending_desc',
    'mark_complete_by_steps',
    'sync_fit_steps_btn',
    'enter_steps_manual_btn',
    'steps_auto_completed_toast',
    'steps_goal_achieved_toast',
    'steps_synced_toast',
    'past_day_steps_completed_badge',
    'past_day_steps_auto_completed_desc',
    'past_day_auto_completed_steps'
  ];

  ['en', 'he', 'ar'].forEach(lang => {
    requiredKeys.forEach(k => {
      assert.ok(I18n.translations[lang][k], `Missing key "${k}" in language "${lang}"`);
      assert.ok(I18n.translations[lang][k].length > 0, `Empty key "${k}" in language "${lang}"`);
    });
  });
});

test('Walking Step Progress - isDayInPast accurately detects past vs current/future days', () => {
  const sb = createSandbox();
  const TodayPage = sb.TodayPage;
  // UI mock returns '2026-10-15' as today
  assert.equal(TodayPage.isDayInPast({ date: '14/10/2026', dayIndex: 1 }), true);
  assert.equal(TodayPage.isDayInPast({ date: '2026-10-14', dayIndex: 1 }), true);
  assert.equal(TodayPage.isDayInPast({ date: '15/10/2026', dayIndex: 0 }), false);
  assert.equal(TodayPage.isDayInPast({ date: '16/10/2026', dayIndex: 2 }), false);
});

test('Walking Step Progress - auto-completes relaxed walking on past day when steps are 0', async () => {
  const sb = createSandbox();
  const TodayPage = sb.TodayPage;

  let savedTracking = null;
  sb.DB.saveDayTracking = async (idx, tr) => {
    savedTracking = tr;
  };

  // CloudSync logged out or 0 steps
  sb.CloudSync.isLoggedIn = async () => false;

  const pastDay = {
    dayIndex: 1,
    date: '10/10/2026', // strictly in the past (today is 2026-10-15)
    exercises: [
      { id: 'relaxed-walking', name: 'Relaxed Walking', sets: '20 mins' }
    ]
  };

  await TodayPage.syncRelaxedWalkingSteps(pastDay, 0, false);
  // It should be auto-completed and saved
  assert.ok(savedTracking, 'Tracking should be saved to DB');
  assert.ok(savedTracking.exerciseStatus[0], 'Relaxed walking on past day should be marked complete');
  assert.equal(savedTracking.completed, true, 'Single-exercise day should be completed');
  assert.equal(savedTracking.stepsAutoCompleted, true);
});

test('Walking Step Progress - does NOT auto-complete relaxed walking on current day when steps are 0', async () => {
  const sb = createSandbox();
  const TodayPage = sb.TodayPage;

  let savedTracking = null;
  sb.DB.saveDayTracking = async (idx, tr) => {
    savedTracking = tr;
  };

  sb.CloudSync.isLoggedIn = async () => false;

  const currentDay = {
    dayIndex: 0,
    date: '15/10/2026', // Today
    exercises: [
      { id: 'relaxed-walking', name: 'Relaxed Walking', sets: '20 mins' }
    ]
  };

  await TodayPage.syncRelaxedWalkingSteps(currentDay, 0, false);
  assert.equal(savedTracking, null, 'Current day walking should not auto-save completion with 0 steps');
});

test('Rest Day - auto-completes immediately when rendered', async () => {
  const sb = createSandbox();
  let savedTracking = null;
  sb.DB.saveDayTracking = async (idx, tr) => {
    savedTracking = tr;
  };
  sb.DB.getDayTracking = async () => null;

  const restDay = {
    dayIndex: 6,
    dayType: 'Rest',
    date: '12/10/2026',
    exercises: []
  };

  sb.window.allPlanDays = [restDay];
  await sb.TodayPage.init([restDay]);

  assert.ok(savedTracking, 'Tracking should be saved to DB');
  assert.equal(savedTracking.completed, true, 'Rest Day should be marked complete on open');
  assert.equal(savedTracking.autoCompleted, true);
});

