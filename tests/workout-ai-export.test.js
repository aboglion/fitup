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
      createElement: (tag) => {
        const el = getOrCreateElement(tag);
        if (tag === 'a') {
          el.click = () => {
            sandbox._downloadedFile = { href: el.href, download: el.download };
          };
        }
        return el;
      },
      execCommand: () => true
    },
    Blob: typeof Blob !== 'undefined' ? Blob : function(parts) { this.parts = parts; },
    URL: {
      createObjectURL: () => 'blob:mock',
      revokeObjectURL: () => {}
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
    _copiedText: '',
    _downloadedFile: null
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

  // Load program guide content
  if (fs.existsSync(path.join(root, 'js/program-guide-content.js'))) {
    const guideCode = fs.readFileSync(path.join(root, 'js/program-guide-content.js'), 'utf8');
    vm.runInContext(guideCode, sandbox);
  }

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
    'export_program_guide_title',
    'export_program_guide_success',
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

test('AI Workout Export - generateAiExportText generates workout details and instructions', () => {
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

  // Test English generation
  const textEn = sandbox.TodayPage.generateAiExportText(sampleDay, 'en');
  assert.ok(textEn.includes('DAILY WORKOUT PLAN'), 'English export should contain header');
  assert.ok(textEn.includes('Day 1'), 'English export should contain day number');
});

test('AI Workout Export - exportFullProgramGuide downloads PROGRAM_GUIDE.md and copies full markdown without popup modal', async () => {
  const sandbox = createSandbox();
  await sandbox.TodayPage.init(sandbox.window.TRAINING_DATA.daily);

  await sandbox.TodayPage.exportFullProgramGuide();

  // 1. Text should be copied to clipboard and be the full guide
  assert.ok(sandbox._copiedText, 'Markdown should be copied to clipboard');
  assert.ok(sandbox._copiedText.includes('FITUP') || sandbox._copiedText.includes('תוכנית') || sandbox._copiedText.includes('אימון'), 'Copied text should contain guide content');

  // 2. File should be downloaded directly as PROGRAM_GUIDE.md
  assert.ok(sandbox._downloadedFile, 'File download should be triggered');
  assert.equal(sandbox._downloadedFile.download, 'PROGRAM_GUIDE.md', 'Downloaded filename must be PROGRAM_GUIDE.md');

  // 3. Success toast shown
  assert.ok(sandbox._lastToast, 'Success toast should be triggered');
  assert.equal(sandbox._lastToast.type, 'success');

  // 4. No popup modal shown (direct seamless action as requested)
  assert.equal(sandbox._lastModal, undefined, 'No popup modal should be shown');
});

test('AI Workout Export - works directly on rest days (full program guide)', async () => {
  const sandbox = createSandbox();
  await sandbox.TodayPage.init(sandbox.window.TRAINING_DATA.daily);

  // Navigate to Rest Day (Day 7, index 6)
  await sandbox.TodayPage.goToDay(6);
  await sandbox.TodayPage.exportWorkoutToAiTxt();

  assert.ok(sandbox._copiedText, 'Program guide should be copied to clipboard even on rest days');
  assert.ok(sandbox._downloadedFile, 'File download should be triggered on rest days');
  assert.equal(sandbox._downloadedFile.download, 'PROGRAM_GUIDE.md');
});

test('UI Structure - Single top export button, no duplicate in overview banner, notes button removed from top row', () => {
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

  // 1. Single export button in day-summary-actions-row
  assert.ok(html.includes('id="export-workout-txt-btn"'), 'index.html must contain #export-workout-txt-btn');
  assert.ok(html.includes('export-ai-action-btn'), 'Button must have export-ai-action-btn class');
  assert.ok(html.includes('data-i18n="export_workout_txt_btn"'), 'Button must have data-i18n attribute');

  // 2. Notes button removed from day-summary-actions-row
  const rowMatch = html.match(/<div class="day-summary-actions-row">([\s\S]*?)<\/div>/);
  assert.ok(rowMatch, 'day-summary-actions-row must exist');
  assert.ok(!rowMatch[1].includes('id="toggle-notes-btn"'), 'toggle-notes-btn must be removed from day-summary-actions-row');

  // 3. Overview banner in today.js has no duplicate export button
  const todayJs = fs.readFileSync(path.join(root, 'js/today.js'), 'utf8');
  assert.ok(!todayJs.includes('TodayPage.exportWorkoutToAiTxt();" title="${I18n.t(\'export_workout_txt_title\')}"'), 'Duplicate export button in eq-banner-header must be removed');
});
