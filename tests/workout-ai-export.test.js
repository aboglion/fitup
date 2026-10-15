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
    getEquipment: (name) => ({ icon: '🏋️', label: 'משקולות DB', key: 'db' }),
    getEquipments: (name) => [{ icon: '🏋️', label: 'משקולות DB', key: 'db' }],
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

test('AI Workout Export - i18n keys for modal & both export options exist across EN, HE, AR', () => {
  const sandbox = createSandbox();
  const keys = [
    'export_workout_txt_btn',
    'export_workout_txt_btn_title',
    'export_program_guide_title',
    'export_program_guide_success',
    'export_ai_modal_title',
    'export_ai_modal_subtitle',
    'export_opt_today_title',
    'export_opt_today_subtitle',
    'export_opt_today_copy',
    'export_opt_today_download',
    'export_opt_today_preview_toggle',
    'export_opt_all_title',
    'export_opt_all_subtitle',
    'export_opt_all_copy',
    'export_opt_all_download',
    'export_opt_all_preview_toggle',
    'export_today_copied_toast',
    'export_all_copied_toast'
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

test('AI Workout Export - Today export produces English version even when app language is Hebrew or Arabic', () => {
  const sandbox = createSandbox();
  const sampleDay = sandbox.window.TRAINING_DATA.daily[0]; // Day 1
  assert.ok(sampleDay, 'Day 1 plan should exist');

  // Set app language to Hebrew
  sandbox.I18n.setLanguage('he');
  const textEnglishExport = sandbox.TodayPage.generateAiExportText(sampleDay, 'en');

  // Verify English headers, exercises, equipment, and AI prompts
  assert.ok(textEnglishExport.includes('DAILY WORKOUT PLAN — FITUP PRO'), 'Must have English header');
  assert.ok(textEnglishExport.includes('TODAY\'S EXERCISES:'), 'Must have English exercises section');
  assert.ok(textEnglishExport.includes('Goblet Romanian Deadlift'), 'Must contain English exercise names');
  assert.ok(textEnglishExport.includes('Required Equipment: Dumbbells'), 'Equipment must be in English (Dumbbells instead of Hebrew)');
  assert.ok(textEnglishExport.includes('AI INSTRUCTION & PROMPT (ChatGPT / Gemini / Claude)'), 'Prompt header must be in English');
  assert.ok(textEnglishExport.includes('EXACT ALTERNATIVE EXERCISES'), 'Prompt must request alternatives in English');
  assert.ok(textEnglishExport.includes('Bodyweight / Calisthenics'), 'Prompt must mention Calisthenics in English');
});

test('AI Workout Export - openAiExportModal opens modal with both options and copies English prompt to clipboard', async () => {
  const sandbox = createSandbox();
  await sandbox.TodayPage.init(sandbox.window.TRAINING_DATA.daily);

  await sandbox.TodayPage.openAiExportModal();

  // 1. Modal is shown
  assert.ok(sandbox._lastModal, 'Modal should be opened');
  assert.ok(sandbox._lastModal.title.includes('ייצוא ל-AI') || sandbox._lastModal.title.includes('Export to AI'));

  // 2. Contains Option 1: Today's workout in English
  assert.ok(sandbox._lastModal.body.includes('TodayPage.copyTodayWorkoutPrompt()'), 'Modal must have copy today workout button');
  assert.ok(sandbox._lastModal.body.includes('TodayPage.downloadTodayWorkoutPrompt()'), 'Modal must have download today workout button');
  assert.ok(sandbox._lastModal.body.includes('https://chatgpt.com/'), 'Modal must have ChatGPT link');
  assert.ok(sandbox._lastModal.body.includes('https://gemini.google.com/app'), 'Modal must have Gemini link');

  // 3. Contains Option 2: Full Program Guide (PROGRAM_GUIDE.md)
  assert.ok(sandbox._lastModal.body.includes('TodayPage.copyFullProgramGuide()'), 'Modal must have copy full program guide button');
  assert.ok(sandbox._lastModal.body.includes('TodayPage.downloadFullProgramGuide()'), 'Modal must have download PROGRAM_GUIDE.md button');
  assert.ok(sandbox._lastModal.body.includes('PROGRAM_GUIDE.md'), 'Modal must mention PROGRAM_GUIDE.md');

  // 4. Copied text contains today's English prompt upon opening
  assert.ok(sandbox._copiedText, 'English prompt should be copied upon opening modal');
  assert.ok(sandbox._copiedText.includes('DAILY WORKOUT PLAN — FITUP PRO'), 'Copied text must be the English workout prompt');
  assert.ok(sandbox._lastToast, 'Toast notification must be shown');
  assert.equal(sandbox._lastToast.type, 'success');
});

test('AI Workout Export - copyFullProgramGuide and downloadFullProgramGuide handle full PROGRAM_GUIDE.md', async () => {
  const sandbox = createSandbox();
  await sandbox.TodayPage.init(sandbox.window.TRAINING_DATA.daily);

  // Test copy full guide
  await sandbox.TodayPage.copyFullProgramGuide();
  assert.ok(sandbox._copiedText, 'Full program guide must be copied to clipboard');
  assert.ok(sandbox._copiedText.includes('FITUP') || sandbox._copiedText.includes('PROGRAM GUIDE') || sandbox._copiedText.includes('תוכנית'), 'Copied text should contain guide content');
  assert.equal(sandbox._lastToast.type, 'success');

  // Test download full guide
  sandbox.TodayPage.downloadFullProgramGuide();
  assert.ok(sandbox._downloadedFile, 'File download must be triggered');
  assert.equal(sandbox._downloadedFile.download, 'PROGRAM_GUIDE.md');
});

test('AI Workout Export - downloadTodayWorkoutPrompt downloads English TXT file', async () => {
  const sandbox = createSandbox();
  await sandbox.TodayPage.init(sandbox.window.TRAINING_DATA.daily);

  sandbox.TodayPage.downloadTodayWorkoutPrompt();
  assert.ok(sandbox._downloadedFile, 'Today workout download must be triggered');
  assert.ok(sandbox._downloadedFile.download.includes('workout-en.txt') || sandbox._downloadedFile.download.includes('.txt'));
});

test('UI Structure - Single top export button, no duplicate in overview banner, notes button removed from top row', () => {
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

  // 1. Single export button in day-summary-actions-row
  assert.ok(html.includes('id="export-workout-txt-btn"'), 'index.html must contain #export-workout-txt-btn');
  assert.ok(html.includes('TodayPage.openAiExportModal'), 'export button onclick must call openAiExportModal');

  // 2. Notes button removed from day-summary-actions-row
  const rowMatch = html.match(/<div class="day-summary-actions-row">([\s\S]*?)<\/div>/);
  assert.ok(rowMatch, 'day-summary-actions-row must exist');
  assert.ok(!rowMatch[1].includes('id="toggle-notes-btn"'), 'toggle-notes-btn must be removed from day-summary-actions-row');

  // 3. Overview banner in today.js has no duplicate export button
  const todayJs = fs.readFileSync(path.join(root, 'js/today.js'), 'utf8');
  assert.ok(!todayJs.includes('TodayPage.exportWorkoutToAiTxt();" title="${I18n.t(\'export_workout_txt_title\')}"'), 'Duplicate export button in eq-banner-header must be removed');
});
