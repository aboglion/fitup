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

  // Assert descriptive angle labels with degrees and positions
  assert.equal(I18n.translations.he['Angle 1'], 'זווית 75° (מתונה)');
  assert.equal(I18n.translations.he['Angle 2 (45°)'], 'זווית 45° (בינונית)');
  assert.equal(I18n.translations.he['Angle 3'], 'זווית 30° (עמוקה)');
  assert.equal(I18n.translations.he['Feet-Elevated'], 'רגליים מוגבהות (180°)');

  assert.equal(I18n.translations.en['Angle 1'], 'Angle 75° (Gentle)');
  assert.equal(I18n.translations.en['Angle 2 (45°)'], 'Angle 45° (Moderate)');
  assert.equal(I18n.translations.en['Angle 3'], 'Angle 30° (Steep)');
  assert.equal(I18n.translations.en['Feet-Elevated'], 'Feet-Elevated (180°)');

  assert.equal(I18n.translations.ar['Angle 1'], 'زاوية 75° (معتدلة)');
  assert.equal(I18n.translations.ar['Angle 2 (45°)'], 'زاوية 45° (متوسطة)');
  assert.equal(I18n.translations.ar['Angle 3'], 'زاوية 30° (عميقة)');
  assert.equal(I18n.translations.ar['Feet-Elevated'], 'أقدام مرفوعة (180°)');

  // Test that showExerciseDetails in ExercisesPage generates angle header above GIF without label stutter
  let modalTitle = '';
  let modalContent = '';
  mockWindow.UI.showModal = (title, content) => {
    modalTitle = title;
    modalContent = content;
  };

  // Default mock language is EN
  mockWindow.ExercisesPage.showExerciseDetails({ name: 'TRX Row', category: 'Back' });
  assert.ok(modalContent.includes('exercise-guide-angle-header'), 'ExercisesPage modal must include exercise-guide-angle-header above GIF');
  assert.ok(modalContent.includes('📐'), 'Angle header must show 📐 icon');
  assert.ok(!modalContent.includes('Angle: Angle'), 'ExercisesPage modal must not stutter "Angle: Angle"');
  assert.ok(modalContent.includes('75° (Gentle)'), 'ExercisesPage modal must show descriptive 75° (Gentle)');

  // Switch to Hebrew and test localized modal rendering
  await I18n.setLanguage('he');
  mockWindow.ExercisesPage.showExerciseDetails({ name: 'TRX Row', category: 'Back' });
  assert.ok(!modalContent.includes('זווית: זווית'), 'ExercisesPage modal must not stutter "זווית: זווית"');
  assert.ok(modalContent.includes('75° (מתונה)'), 'ExercisesPage modal must show descriptive 75° (מתונה)');

  // Test that showImageModal in UI generates angle header above GIF without label stutter
  mockWindow.UI.showImageModal('TRX Row');
  const imageModalContent = elements['modal-body']?.innerHTML || '';
  assert.ok(imageModalContent.includes('gif-modal-stage-header'), 'UI.showImageModal must include gif-modal-stage-header above GIF');
  assert.ok(imageModalContent.includes('📐'), 'gif-modal-stage-header must show 📐 icon');
  assert.ok(imageModalContent.includes('75° (מתונה)'), 'UI.showImageModal must show descriptive 75° (מתונה)');
  assert.ok(imageModalContent.includes('trx-angle-mini-diagram'), 'UI.showImageModal must include trx-angle-mini-diagram');
  assert.ok(modalContent.includes('trx-angle-mini-diagram'), 'ExercisesPage modal must include trx-angle-mini-diagram');

  // Test UI.getTrxAngleSvg across all angle tiers
  assert.equal(typeof mockWindow.UI.getTrxAngleSvg, 'function');
  const svg75 = mockWindow.UI.getTrxAngleSvg('75');
  const svg45 = mockWindow.UI.getTrxAngleSvg('Angle 2 (45°)');
  const svg30 = mockWindow.UI.getTrxAngleSvg('Angle 3');
  const svg180 = mockWindow.UI.getTrxAngleSvg('Feet-Elevated (180°)');

  assert.ok(svg75.includes('trx-angle-mini-diagram') && svg75.includes('75°'), 'SVG 75 must render 75°');
  assert.ok(svg45.includes('trx-angle-mini-diagram') && svg45.includes('45°'), 'SVG 45 must render 45°');
  assert.ok(svg30.includes('trx-angle-mini-diagram') && svg30.includes('30°'), 'SVG 30 must render 30°');
  assert.ok(svg180.includes('trx-angle-mini-diagram') && svg180.includes('180°'), 'SVG 180 must render 180°');

  // Test TodayPage.showFormRuleModal renders multi-stage angle progression diagrams for TRX Row
  let formRuleModalHtml = '';
  mockWindow.UI.showModal = (title, content) => { formRuleModalHtml = content; };
  mockWindow.TodayPage.showFormRuleModal('TRX Row');
  assert.ok(formRuleModalHtml.includes('trx-angle-mini-diagram'), 'showFormRuleModal must include angle diagrams for TRX');
  assert.ok(formRuleModalHtml.includes('75°'), 'showFormRuleModal must include 75°');
  assert.ok(formRuleModalHtml.includes('180°'), 'showFormRuleModal must include 180° for TRX Row');

  // Regression test: TodayPage.init & render with equipment banner must not throw ReferenceError: statesMap is not defined
  const mockDB = {
    getSetting: async () => '2026-01-01',
    getDayTracking: async () => ({ exerciseStatus: {}, setData: {} }),
    getAllTracking: async () => [],
    getAllProgressionState: async () => [
      { exerciseId: 'trx-row', currentStageIndex: 1 }
    ],
    getExerciseGuide: async () => [],
    getNutrition: async () => null,
    saveNutrition: async () => {}
  };
  global.DB = mockDB;
  mockWindow.DB = mockDB;
  mockDoc.body = createMockElement();

  const planDays = [
    {
      dayNum: 1,
      dayOfWeek: 'Sunday',
      week: 'Week 1',
      dayType: 'Legs & Core',
      exercises: [
        { name: 'TRX Row', sets: '3x10', weight: 'Bodyweight' }
      ]
    },
    {
      dayNum: 2,
      dayOfWeek: 'Monday',
      week: 'Week 1',
      dayType: 'Upper & Core',
      exercises: [
        { name: 'TRX Row', sets: '3x10', weight: 'Bodyweight' }
      ]
    }
  ];

  await assert.doesNotReject(async () => {
    await mockWindow.TodayPage.init(planDays);
  }, 'TodayPage.init must not throw ReferenceError: statesMap is not defined');
});

