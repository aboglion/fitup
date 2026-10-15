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
        querySelectorAll: () => [],
        querySelector: () => null,
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
    navigator: { language: 'he', vibrate: () => {} },
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
  sandbox.I18n.init();

  // Load data
  const dataCode = fs.readFileSync(path.join(root, 'js/data.js'), 'utf8');
  vm.runInContext(dataCode, sandbox);

  // Mock UI
  sandbox.UI = {
    parseSetsCount: (s) => 1,
    getCategoryColor: () => '#3b82f6',
    getCategoryLabel: () => 'Warmup',
    parseReps: () => '5',
    getEquipment: () => ({ icon: '🧘', label: 'Bodyweight' }),
    getImageUrl: () => '',
    getGifUrl: () => '',
    formatTempo: (t) => t,
    findTodayIndex: () => 0,
    toast: (msg, type) => {},
    showModal: () => {},
    hideModal: () => {},
    enrichHeartRateText: (t) => t,
    getDayTypeInfo: () => ({ name: 'Strength A', isDeload: false }),
    getLocalDateString: () => '2026-10-15',
    getHRZones: () => ({ max: 178, zone2: [107, 125], zone5: [151, 169] }),
    getMicroMobilitySubExercises: () => [
      { id: 'kneeling-hip-flexor', nameKey: 'kneeling_hip_flexor', targetKey: 'target', descKey: 'desc', gif: 'hip.gif' },
      { id: 'deep-squat-hold', nameKey: 'deep_squat_hold', targetKey: 'target', descKey: 'desc', gif: 'squat.gif' }
    ],
    DEEP_MOBILITY_SUB_EXERCISES: [
      { id: 'hip-90-90', nameKey: 'hip_90_90', targetKey: 'target', descKey: 'desc', gif: 'hip90.gif' },
      { id: 'couch-stretch', nameKey: 'couch_stretch', targetKey: 'target', descKey: 'desc', gif: 'couch.gif' }
    ]
  };

  let savedTracking = null;
  sandbox.DB = {
    getSetting: async (key) => (key === 'planStartDate' ? '2026-10-11' : null),
    setSetting: async () => {},
    getDayTracking: async () => savedTracking,
    saveDayTracking: async (idx, tr) => {
      savedTracking = JSON.parse(JSON.stringify(tr));
    },
    getAllTracking: async () => [],
    getAllPlan: async () => [],
    loadTrainingPlan: async () => [],
    getExerciseGuide: async () => ({}),
    syncRestDays: async () => {}
  };

  // Load today.js
  const todayCode = fs.readFileSync(path.join(root, 'js/today.js'), 'utf8');
  vm.runInContext(todayCode, sandbox);
  sandbox.TodayPage = sandbox.window.TodayPage;

  sandbox.getSavedTracking = () => savedTracking;
  sandbox.setSavedTracking = (t) => { savedTracking = t; };

  return sandbox;
}

test('Mobility Protocol Streamlining - Suppresses setsHTML and target outcome cheat', () => {
  const todayContent = fs.readFileSync(path.join(root, 'js/today.js'), 'utf8');

  // Verify that mobility protocols suppress progressive overload cheat sheet
  assert.ok(
    todayContent.includes("const isMobilityProtocol = (ex.name || '').toLowerCase().includes('mobility');"),
    'buildExerciseNoteAndGuideHTML must detect mobility protocol'
  );

  // Verify that setsHTML is suppressed for mobility protocols
  assert.ok(
    todayContent.includes("if (setsCount > 0 && !isMobilityProtocol)"),
    'renderExercises must suppress setsHTML for mobility protocols'
  );

  // Verify that toggleMicroMobilitySubStep marks setData and completion
  assert.ok(
    todayContent.includes("isNoModalExercise"),
    'isNoModalExercise must exist'
  );
  assert.ok(
    todayContent.includes("name.includes('micro mobility')"),
    'isNoModalExercise must include micro mobility'
  );
});

test('Mobility Protocol Auto-Completion - Completing sub-exercises marks exercise status and setData', async () => {
  const sandbox = createSandbox();

  const mockDay = {
    dayIndex: 0,
    dayType: 'Strength A',
    exercises: [
      {
        id: 'micro-mobility-protocol',
        name: 'Micro Mobility Protocol',
        slot: 'A3',
        sets: '1×5 mins',
        tempo: 'slow',
        rest: 0
      }
    ]
  };

  await sandbox.TodayPage.init([mockDay]);

  // Toggle first sub exercise
  await sandbox.TodayPage.toggleMicroMobilitySubStep('kneeling-hip-flexor', 0);
  assert.equal(sandbox.getSavedTracking().exerciseStatus[0], false);

  // Toggle second sub exercise -> both done!
  await sandbox.TodayPage.toggleMicroMobilitySubStep('deep-squat-hold', 0);

  const tracking = sandbox.getSavedTracking();
  assert.equal(tracking.exerciseStatus[0], true, 'Exercise must be marked complete when all sub steps are done');
  assert.equal(tracking.setData[0].set_0_done, true, 'set_0_done must be true in setData');
  assert.equal(tracking.setData[0].set_0_result, 'in_window', 'set_0_result must be in_window');
});

test('Mobility Protocol - toggleAllMicroMobilitySteps marks all and sets completion', async () => {
  const sandbox = createSandbox();

  const mockDay = {
    dayIndex: 0,
    dayType: 'Strength A',
    exercises: [
      {
        id: 'micro-mobility-protocol',
        name: 'Micro Mobility Protocol',
        slot: 'A3',
        sets: '1×5 mins',
        tempo: 'slow',
        rest: 0
      }
    ]
  };

  await sandbox.TodayPage.init([mockDay]);

  // Mark all sub exercises at once
  await sandbox.TodayPage.toggleAllMicroMobilitySteps(0);

  let tracking = sandbox.getSavedTracking();
  assert.equal(tracking.exerciseStatus[0], true);
  assert.equal(tracking.setData[0].set_0_done, true);
  assert.equal(tracking.microMobilitySteps['kneeling-hip-flexor'], true);
  assert.equal(tracking.microMobilitySteps['deep-squat-hold'], true);

  // Unmark all sub exercises at once
  await sandbox.TodayPage.toggleAllMicroMobilitySteps(0);

  tracking = sandbox.getSavedTracking();
  assert.equal(tracking.exerciseStatus[0], false);
  assert.equal(tracking.setData[0].set_0_done, false);
  assert.equal(tracking.microMobilitySteps['kneeling-hip-flexor'], false);
  assert.equal(tracking.microMobilitySteps['deep-squat-hold'], false);
});
