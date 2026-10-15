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
        style: { setProperty: () => {} },
        dataset: {},
        value: '',
        setAttribute: () => {},
        querySelectorAll: () => [],
        querySelector: () => null
      };
    }
    return elements[id];
  };

  const sandbox = {
    window: {},
    document: {
      body: { classList: { add() {}, remove() {}, contains() { return false; } }, appendChild: () => {}, removeChild: () => {} },
      documentElement: { style: { setProperty: () => {} }, setAttribute: () => {} },
      getElementById: (id) => getOrCreateElement(id),
      querySelector: (sel) => getOrCreateElement(sel),
      querySelectorAll: () => [],
      createElement: (tag) => getOrCreateElement(tag),
      execCommand: () => true
    },
    history: { pushState: () => {}, back: () => {} },
    console: console,
    setTimeout: global.setTimeout,
    clearTimeout: global.clearTimeout,
    navigator: {
      clipboard: {
        writeText: async (t) => { sandbox._copiedText = t; return true; }
      },
      language: 'he'
    },
    localStorage: { getItem() { return null; }, setItem() {} },
    addEventListener: () => {},
    removeEventListener: () => {},
    _copiedText: ''
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
    parseSetsCount: (s) => (s && s.includes('×')) ? parseInt(s.split('×')[0], 10) : 1,
    getCategoryColor: () => '#3b82f6',
    getCategoryLabel: () => 'Strength',
    parseReps: (s) => (s && s.includes('×')) ? s.split('×')[1] : s,
    getEquipment: (name) => ({ icon: '🏋️', label: 'משקולות DB' }),
    getEquipments: (name) => [{ icon: '🏋️', label: 'משקולות DB' }],
    getImageUrl: () => 'test.png',
    getGifUrl: () => 'test.gif',
    formatTempo: (t) => t,
    findTodayIndex: () => 0,
    getLocalDateString: () => '2026-10-15',
    getDayTypeInfo: () => ({ label: 'Workout', class: 'strength' }),
    getMicroMobilitySubExercises: () => [],
    toast: (msg, type) => {
      sandbox._lastToast = { msg, type };
    },
    showModal: (title, body) => {
      sandbox._lastModal = { title, body };
    }
  };

  // Mock DB
  sandbox.DB = {
    getAllPlan: async () => sandbox.window.TRAINING_DATA.daily,
    getDayTracking: async () => ({}),
    saveDayTracking: async () => {},
    getAllTracking: async () => [],
    getExerciseGuide: async () => [],
    getSetting: async () => null
  };

  // Load today.js
  const todayCode = fs.readFileSync(path.join(root, 'js/today.js'), 'utf8');
  vm.runInContext(todayCode, sandbox);
  sandbox.TodayPage = sandbox.window.TodayPage;

  return sandbox;
}

test('AI Workout Export - i18n keys exist across EN, HE, AR', () => {
  const sandbox = createSandbox();
  const keys = [
    'export_workout_txt_btn',
    'export_workout_txt_btn_title',
    'export_workout_txt_title',
    'export_workout_txt_copied',
    'export_workout_txt_download',
    'export_workout_txt_copy',
    'export_workout_open_chatgpt',
    'export_workout_open_gemini',
    'export_workout_rest_day',
    'export_workout_status_copied_title',
    'export_workout_status_ready_title',
    'export_workout_prompt_subtitle',
    'export_workout_preview_label',
    'export_workout_click_to_select',
    'export_workout_hint',
    'export_workout_downloaded'
  ];

  ['en', 'he', 'ar'].forEach(lang => {
    sandbox.I18n.setLanguage(lang);
    keys.forEach(k => {
      const translation = sandbox.I18n.t(k);
      assert.ok(translation, `Translation for key "${k}" in language "${lang}" should exist`);
      assert.notEqual(translation, k, `Key "${k}" should not return raw key in language "${lang}"`);
    });
  });
});

test('AI Workout Export - generateAiExportText generates complete workout details and AI instructions', () => {
  const sandbox = createSandbox();
  const sampleDay = sandbox.window.TRAINING_DATA.daily[0]; // Day 1
  assert.ok(sampleDay, 'Day 1 plan should exist');
  assert.ok(sampleDay.exercises.length > 0, 'Day 1 should have exercises');

  // Test Hebrew generation (default)
  const textHe = sandbox.TodayPage.generateAiExportText(sampleDay, 'he');
  assert.ok(textHe.includes('תוכנית אימון יומית'), 'Hebrew export should contain header');
  assert.ok(textHe.includes('יום 1'), 'Hebrew export should contain day number');
  assert.ok(textHe.includes('שאלה ל-AI') || textHe.includes('הנחיה ושאלה ל-AI'), 'Hebrew export should contain AI prompt');
  assert.ok(textHe.includes('ציוד שאין ברשותי') || textHe.includes('ציוד שאין לי'), 'Hebrew export should mention alternative exercises');
  assert.ok(textHe.includes('משקל גוף בלבד') || textHe.includes('Calisthenics'), 'Hebrew export should mention Calisthenics bodyweight option');
  assert.ok(textHe.includes('ציוד ביתי מאולתר'), 'Hebrew export should mention improvised home equipment');
  assert.ok(textHe.includes('גב התחתון'), 'Hebrew export should mention lower back safety');
  assert.ok(textHe.includes('Goblet Romanian Deadlift'), 'Hebrew export should include English exercise names');

  // Test English generation
  const textEn = sandbox.TodayPage.generateAiExportText(sampleDay, 'en');
  assert.ok(textEn.includes('DAILY WORKOUT PLAN'), 'English export should contain header');
  assert.ok(textEn.includes('Day 1'), 'English export should contain day number');
  assert.ok(textEn.includes('AI INSTRUCTION & PROMPT'), 'English export should contain AI prompt header');
  assert.ok(textEn.includes('EXACT ALTERNATIVE EXERCISES'), 'English export should request alternatives');
  assert.ok(textEn.includes('Bodyweight / Calisthenics'), 'English export should specify calisthenics');
});

test('AI Workout Export - exportWorkoutToAiTxt handles Rest day gracefully', async () => {
  const sandbox = createSandbox();
  await sandbox.TodayPage.init(sandbox.window.TRAINING_DATA.daily);

  // Navigate to Rest Day (Day 7, index 6)
  await sandbox.TodayPage.goToDay(6);
  await sandbox.TodayPage.exportWorkoutToAiTxt();

  assert.ok(sandbox._lastToast, 'Toast should be displayed for rest day');
  assert.equal(sandbox._lastToast.type, 'info');
  assert.ok(sandbox._lastToast.msg.includes('מנוחה') || sandbox._lastToast.msg.includes('Rest'), 'Toast should inform that today is rest day');
});

test('AI Workout Export - exportWorkoutToAiTxt copies to clipboard and opens modal on workout day', async () => {
  const sandbox = createSandbox();
  await sandbox.TodayPage.init(sandbox.window.TRAINING_DATA.daily);

  // Navigate to Day 1 (index 0)
  await sandbox.TodayPage.goToDay(0);
  await sandbox.TodayPage.exportWorkoutToAiTxt();

  assert.ok(sandbox._copiedText, 'Text should be copied to clipboard');
  assert.ok(sandbox._copiedText.includes('Day 1') || sandbox._copiedText.includes('יום 1'));
  assert.ok(sandbox._lastToast, 'Success toast should be triggered');
  assert.equal(sandbox._lastToast.type, 'success');
  assert.ok(sandbox._lastModal, 'Modal should be shown');
  assert.ok(sandbox._lastModal.body.includes('https://chatgpt.com/'), 'Modal should link to ChatGPT');
  assert.ok(sandbox._lastModal.body.includes('https://gemini.google.com/app'), 'Modal should link to Gemini');
  assert.ok(sandbox._lastModal.body.includes('ai-export-preview-textarea'), 'Modal should have preview textarea');
});

test('AI Workout Export - index.html contains export button in day summary actions row', () => {
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  assert.ok(html.includes('id="export-workout-txt-btn"'), 'index.html must contain #export-workout-txt-btn');
  assert.ok(html.includes('export-ai-action-btn'), 'Button must have export-ai-action-btn class');
  assert.ok(html.includes('data-i18n="export_workout_txt_btn"'), 'Button must have data-i18n attribute');
  assert.ok(html.includes('TodayPage.exportWorkoutToAiTxt'), 'Button must trigger TodayPage.exportWorkoutToAiTxt');
});
