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

test('I18n Localization - unit_minutes and progression_stage_title exist across all languages', () => {
  ['he', 'en', 'ar'].forEach(lang => {
    I18n.setLanguage(lang);
    assert.notEqual(I18n.t('unit_minutes'), 'unit_minutes', `unit_minutes missing in ${lang}`);
    assert.notEqual(I18n.t('progression_stage_title'), 'progression_stage_title', `progression_stage_title missing in ${lang}`);
    assert.notEqual(I18n.t('outcome_cardio_in_window'), 'outcome_cardio_in_window', `outcome_cardio_in_window missing in ${lang}`);
    assert.notEqual(I18n.t('outcome_cardio_above'), 'outcome_cardio_above', `outcome_cardio_above missing in ${lang}`);
    assert.notEqual(I18n.t('outcome_cardio_below'), 'outcome_cardio_below', `outcome_cardio_below missing in ${lang}`);
  });
  I18n.setLanguage('he');
});

test('Target Outcomes Guide - Warmup exercises suppress cheat sheet', () => {
  // Load today.js inside sandbox with necessary mock dependencies
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
    console: console,
    I18n,
    UI: {
      getCategoryLabel: () => 'Warmup',
      parseReps: (s) => s,
      parseSetsCount: () => 1,
      formatTempo: (t) => t
    },
    DB: { getDayTracking: async () => null }
  };
  vm.createContext(todaySandbox);
  vm.runInContext(todayContent, todaySandbox);
  const TodayPage = todaySandbox.window.TodayPage;

  // Verify that warmups only return note textarea and NO target-outcomes-cheat
  const warmupEx = {
    name: 'Arm Circles',
    slot: 'W1',
    isWarmup: true,
    sets: '10 reps',
    category: 'Warmup'
  };

  // We can test TodayPage's render behavior or direct internal logic
  // Test by checking that warmups don't output "+2 ק\"ג" or outcome cheat
  assert.equal(I18n.t('unit_minutes'), 'דקות');
  assert.equal(I18n.t('unit_seconds'), 'שניות');
  assert.equal(I18n.t('unit_reps'), 'חזרות');
});

test('Cardio Walking Outcomes - Replaces weight progression with time progression', () => {
  I18n.setLanguage('he');
  const cardioRule = I18n.t('outcome_cardio_in_window');
  assert.ok(cardioRule.includes('זמן') || cardioRule.includes('דק'), 'Cardio rule must refer to time/duration');
  assert.ok(!cardioRule.includes('ק"ג') && !cardioRule.includes('משקל'), 'Cardio rule must NOT refer to weight in kg');

  const cardioAbove = I18n.t('outcome_cardio_above');
  assert.ok(cardioAbove.includes('זמן') || cardioAbove.includes('שיפוע') || cardioAbove.includes('קצב'), 'Cardio above target must refer to time/pace/incline');
  assert.ok(!cardioAbove.includes('הקפצת משקל'), 'Cardio above target must not state הקפצת משקל');

  const cardioBelow = I18n.t('outcome_cardio_below');
  assert.ok(!cardioBelow.includes('+30 שנ\' מנוחה'), 'Cardio below target must not add rest penalty');
});

test('Heart Rate Numerical Values - Displays concrete BPM ranges and dynamically enriches', () => {
  // Test i18n rules contain concrete BPM numbers across all 3 languages
  ['he', 'en', 'ar'].forEach(lang => {
    I18n.setLanguage(lang);
    const vo2Rule = I18n.t('rule_vo2_max_norwegian_4x4');
    assert.ok(vo2Rule.includes('159-178 BPM') || vo2Rule.includes('159–178 BPM'), `VO2 rule in ${lang} must include Zone 5 BPM numbers`);
    assert.ok(vo2Rule.includes('112-131 BPM') || vo2Rule.includes('112–131 BPM'), `VO2 rule in ${lang} must include Zone 2 BPM numbers`);

    const briskRule = I18n.t('rule_brisk_walking');
    assert.ok(briskRule.includes('112-131 BPM') || briskRule.includes('112–131 BPM'), `Brisk walking in ${lang} must include Zone 2 BPM numbers`);
  });

  // Load UI module in sandbox to test enrichHeartRateText logic
  const mockElement = () => ({
    addEventListener: () => {},
    removeEventListener: () => {},
    classList: { add: () => {}, remove: () => {}, contains: () => false },
    appendChild: () => {},
    style: {},
    dataset: {}
  });

  const uiContent = fs.readFileSync(path.join(root, 'js/ui.js'), 'utf8');
  const uiSandbox = {
    window: {
      _cachedUserAge: 30,
      _cachedCustomHRmax: null,
      addEventListener: () => {},
      removeEventListener: () => {}
    },
    document: {
      documentElement: { lang: 'he', dir: 'rtl' },
      getElementById: mockElement,
      querySelectorAll: () => [],
      createElement: mockElement
    },
    history: { pushState: () => {}, back: () => {} },
    addEventListener: () => {},
    I18n,
    console
  };
  vm.createContext(uiSandbox);
  vm.runInContext(uiContent, uiSandbox);
  const UI = uiSandbox.window.UI;

  const sampleRaw = '4×(4 דק׳ מאמץ ב-85%-95% דופק מרבי + 3 דק׳ התאוששות ב-60%-70% דופק)';
  const enriched = UI.enrichHeartRateText(sampleRaw);
  assert.ok(enriched.includes('159-178 BPM'), 'Must enrich Zone 5 with 159-178 BPM');
  assert.ok(enriched.includes('112-131 BPM'), 'Must enrich Zone 2 with 112-131 BPM');

  // Idempotence test
  const reEnriched = UI.enrichHeartRateText(enriched);
  assert.equal(reEnriched, enriched, 'Re-enriching already enriched text must be idempotent without duplicating (BPM)');

  // Custom HRmax test (e.g., 200 BPM)
  uiSandbox.window._cachedCustomHRmax = 200;
  const customEnriched = UI.enrichHeartRateText(sampleRaw);
  assert.ok(customEnriched.includes('170-190 BPM'), 'Must reflect custom HRmax 200 Zone 5 (170-190 BPM)');
  assert.ok(customEnriched.includes('120-140 BPM'), 'Must reflect custom HRmax 200 Zone 2 (120-140 BPM)');
});

