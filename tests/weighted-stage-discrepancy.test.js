import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.join(__dirname, '..');

test('Weighted Exercises Stage Discrepancy Prevention Test', () => {
  global.history = { pushState: () => {}, replaceState: () => {} };
  const mockStorage = {};
  const mockWindow = {
    location: { hash: '', reload: () => {} },
    addEventListener: () => {},
    history: { pushState: () => {}, replaceState: () => {} },
    localStorage: {
      getItem: (k) => mockStorage[k] || null,
      setItem: (k, v) => { mockStorage[k] = String(v); },
      removeItem: (k) => { delete mockStorage[k]; }
    }
  };
  global.localStorage = mockWindow.localStorage;

  const createMockElement = () => ({
    style: { setProperty: () => {}, removeProperty: () => {} },
    classList: { add: () => {}, remove: () => {}, contains: () => false },
    appendChild: () => {},
    querySelectorAll: () => [],
    addEventListener: () => {},
    removeEventListener: () => {},
    setAttribute: () => {},
    getAttribute: () => null,
    remove: () => {}
  });
  const elements = {};
  const getMockElement = (id) => {
    if (!elements[id]) {
      elements[id] = {
        id,
        innerHTML: '',
        style: { setProperty: () => {}, removeProperty: () => {} },
        classList: { add: () => {}, remove: () => {}, contains: () => false },
        appendChild: () => {},
        querySelectorAll: () => [],
        addEventListener: () => {},
        removeEventListener: () => {},
        setAttribute: () => {},
        getAttribute: () => null,
        remove: () => {}
      };
    }
    return elements[id];
  };
  const mockDoc = {
    createElement: createMockElement,
    getElementById: (id) => getMockElement(id),
    documentElement: { lang: 'he', dir: 'rtl', style: { setProperty: () => {} }, setAttribute: () => {} },
    querySelectorAll: () => []
  };

  // 1. Load I18n
  const i18nCode = fs.readFileSync(path.join(root, 'js/i18n.js'), 'utf8');
  new Function('window', 'document', i18nCode)(mockWindow, mockDoc);
  const I18n = mockWindow.I18n;

  // 2. Load UI
  const uiCode = fs.readFileSync(path.join(root, 'js/ui.js'), 'utf8');
  new Function('window', 'document', 'I18n', uiCode)(mockWindow, mockDoc, I18n);

  // 3. Load Training Data
  const trainingData = JSON.parse(fs.readFileSync(path.join(root, 'training_data.json'), 'utf8'));
  mockWindow.TRAINING_DATA = trainingData;

  // 4. Load ProgressionEngine
  const progressionCode = fs.readFileSync(path.join(root, 'js/progression.js'), 'utf8');
  new Function('window', 'document', 'I18n', progressionCode)(mockWindow, mockDoc, I18n);

  // 5. Load ExercisesPage
  const exercisesCode = fs.readFileSync(path.join(root, 'js/exercises.js'), 'utf8');
  new Function('window', 'document', 'I18n', 'UI', exercisesCode)(mockWindow, mockDoc, I18n, mockWindow.UI);

  // 6. Load TodayPage
  const todayCode = fs.readFileSync(path.join(root, 'js/today.js'), 'utf8');
  new Function('window', 'document', 'I18n', 'UI', 'ExercisesPage', 'ProgressionEngine', todayCode)(
    mockWindow, mockDoc, I18n, mockWindow.UI, mockWindow.ExercisesPage, mockWindow.ProgressionEngine
  );

  const week11Day = { week: 'Week 11' };

  // 1. Verify standard weighted dumbbell exercises NEVER resolve to a fake stage name
  const dbGluteBridge = { name: 'DB Glute Bridge', weight: '8 kg total' };
  const gobletRDL = { name: 'Goblet Romanian Deadlift', weight: '8 kg total' };
  const heelsElevatedSquat = { name: 'Heels-Elevated Goblet Squat', weight: '8 kg total' };
  const floorPress = { name: 'Single-Arm Floor Press', weight: '8 kg' };

  assert.equal(
    mockWindow.TodayPage.resolveExerciseStage(dbGluteBridge, week11Day),
    null,
    'DB Glute Bridge must NOT resolve 18 kg as a stage name on Week 11'
  );
  assert.equal(
    mockWindow.TodayPage.resolveExerciseStage(gobletRDL, week11Day),
    null,
    'Goblet Romanian Deadlift must NOT resolve 18 kg as a stage name on Week 11'
  );
  assert.equal(
    mockWindow.TodayPage.resolveExerciseStage(heelsElevatedSquat, week11Day),
    null,
    'Heels-Elevated Goblet Squat must NOT resolve 18 kg as a stage name on Week 11'
  );
  assert.equal(
    mockWindow.TodayPage.resolveExerciseStage(floorPress, week11Day),
    null,
    'Single-Arm Floor Press must NOT resolve a dumbbell weight as a stage name'
  );

  // 2. Verify variation / angle / incline / band exercises DO resolve to their valid stage names
  const trxRow = { name: 'TRX Row' };
  const briskWalk = { name: 'Brisk Walking' };
  const hollowBody = { name: 'Hollow Body Hold' };

  assert.equal(mockWindow.TodayPage.resolveExerciseStage(trxRow, { week: 'Week 1' }), 'Angle 1');
  assert.equal(mockWindow.TodayPage.resolveExerciseStage(briskWalk, { week: 'Week 3' }), 'Incline 4%');
  assert.equal(mockWindow.TodayPage.resolveExerciseStage(hollowBody, { week: 'Week 3' }), 'Tuck Hold');
});
