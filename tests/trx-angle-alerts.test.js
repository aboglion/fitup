import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.join(__dirname, '..');

test('TRX Angle Display Above GIF & Angle Change Alerts Test', async () => {
  global.history = { pushState: () => {}, replaceState: () => {} };
  const mockStorage = {};
  const mockWindow = {
    addEventListener: () => {},
    history: { pushState: () => {}, replaceState: () => {} },
    localStorage: {
      getItem: (k) => mockStorage[k] || null,
      setItem: (k, v) => { mockStorage[k] = String(v); },
      removeItem: (k) => { delete mockStorage[k]; }
    }
  };
  const createMockElement = () => ({
    style: {},
    classList: { add: () => {}, remove: () => {}, contains: () => false },
    appendChild: () => {},
    querySelectorAll: () => [],
    addEventListener: () => {},
    removeEventListener: () => {},
    setAttribute: () => {},
    getAttribute: () => null
  });
  const elements = {};
  const getMockElement = (id) => {
    if (!elements[id]) {
      elements[id] = {
        id,
        innerHTML: '',
        style: {},
        classList: { add: () => {}, remove: () => {}, contains: () => false },
        appendChild: () => {},
        querySelectorAll: () => [],
        addEventListener: () => {},
        removeEventListener: () => {},
        setAttribute: () => {},
        getAttribute: () => null
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

  // 3. Load ExercisesPage
  const exercisesCode = fs.readFileSync(path.join(root, 'js/exercises.js'), 'utf8');
  new Function('window', 'document', 'I18n', 'UI', exercisesCode)(mockWindow, mockDoc, I18n, mockWindow.UI);

  // 4. Load TodayPage
  const todayCode = fs.readFileSync(path.join(root, 'js/today.js'), 'utf8');
  new Function('window', 'document', 'I18n', 'UI', 'ExercisesPage', todayCode)(mockWindow, mockDoc, I18n, mockWindow.UI, mockWindow.ExercisesPage);

  // Assert i18n key symmetry for angle alert keys
  const alertKeys = [
    'angle_changed_title',
    'new_angle_badge',
    'angle_progression_label',
    'angle_updated_in_exercises',
    'angle_updated_in_exercises_plural',
    'angle_updated_tip'
  ];

  for (const k of alertKeys) {
    assert.ok(I18n.translations.en[k], `EN missing ${k}`);
    assert.ok(I18n.translations.he[k], `HE missing ${k}`);
    assert.ok(I18n.translations.ar[k], `AR missing ${k}`);
  }

  // Test resolveExerciseStage resolves week-based tiers for TRX Row
  assert.equal(typeof mockWindow.TodayPage.resolveExerciseStage, 'function');
  const trxRowEx = { name: 'TRX Row' };
  const week1Day = { week: 'Week 1' };
  const week18Day = { week: 'Week 18' };
  const week42Day = { week: 'Week 42' };
  const week60Day = { week: 'Week 60' };

  assert.equal(mockWindow.TodayPage.resolveExerciseStage(trxRowEx, week1Day), 'Angle 1');
  assert.equal(mockWindow.TodayPage.resolveExerciseStage(trxRowEx, week18Day), 'Angle 2 (45°)');
  assert.equal(mockWindow.TodayPage.resolveExerciseStage(trxRowEx, week42Day), 'Angle 3');
  assert.equal(mockWindow.TodayPage.resolveExerciseStage(trxRowEx, week60Day), 'Feet-Elevated');

  // Test that showExerciseDetails in ExercisesPage generates angle header above GIF
  let modalTitle = '';
  let modalContent = '';
  mockWindow.UI.showModal = (title, content) => {
    modalTitle = title;
    modalContent = content;
  };

  mockWindow.ExercisesPage.showExerciseDetails({ name: 'TRX Row', category: 'Back' });
  assert.ok(modalContent.includes('exercise-guide-angle-header'), 'ExercisesPage modal must include exercise-guide-angle-header above GIF');
  assert.ok(modalContent.includes('📐'), 'Angle header must show 📐 icon');

  // Test that showImageModal in UI generates angle header above GIF
  mockWindow.UI.showImageModal('TRX Row');
  const imageModalContent = elements['modal-body']?.innerHTML || '';
  assert.ok(imageModalContent.includes('gif-modal-stage-header'), 'UI.showImageModal must include gif-modal-stage-header above GIF');
  assert.ok(imageModalContent.includes('📐'), 'gif-modal-stage-header must show 📐 icon');
});

