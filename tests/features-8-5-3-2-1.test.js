import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- ITEM 8: Modern UI.confirm() in place of native window.confirm ---
test('Item 8 - UI.confirm exists and has modern modal implementation', () => {
  const uiCode = fs.readFileSync(path.join(__dirname, '../js/ui.js'), 'utf8');
  assert.ok(uiCode.includes('function confirm(options)'), 'UI.confirm function defined in ui.js');
  assert.ok(uiCode.includes('return new Promise('), 'UI.confirm returns a Promise');
  assert.ok(uiCode.includes('custom-confirm-modal'), 'UI.confirm creates custom confirm modal');
  assert.ok(uiCode.includes('finish(true)'), 'UI.confirm resolves true on confirmation');
  assert.ok(uiCode.includes('finish(false)'), 'UI.confirm resolves false on cancel');

  // Verify UI.confirm is exported
  assert.ok(uiCode.includes('confirm,'), 'UI.confirm is exported in UI module');

  // Verify native confirm replacements in codebase
  const todayCode = fs.readFileSync(path.join(__dirname, '../js/today.js'), 'utf8');
  assert.ok(todayCode.includes('UI.confirm'), 'today.js uses UI.confirm');
  assert.ok(!todayCode.includes('window.confirm(I18n.t(\'joint_pain_prompt\'))') || todayCode.includes('UI.confirm'), 'today.js prioritizes UI.confirm for joint pain');

  const statsCode = fs.readFileSync(path.join(__dirname, '../js/stats.js'), 'utf8');
  assert.ok(statsCode.includes('UI.confirm'), 'stats.js uses UI.confirm for photo deletion');

  const appCode = fs.readFileSync(path.join(__dirname, '../js/app.js'), 'utf8');
  assert.ok(appCode.includes('UI.confirm'), 'app.js uses UI.confirm for clear data');
});

// --- ITEM 5: Rest Timer Upgrades ---
test('Item 5 - Rest Timer Upgrades (Skip button, +/- adjustments, Progress bar)', () => {
  const restTimerCode = fs.readFileSync(path.join(__dirname, '../js/rest-timer.js'), 'utf8');
  assert.ok(restTimerCode.includes('function skip(') && restTimerCode.includes('skip,'), 'RestTimerController has skip method');
  assert.ok(restTimerCode.includes('rest-timer-progress-bar'), 'RestTimerController updates progress bar');
  assert.ok(restTimerCode.includes('function addTime('), 'RestTimerController has addTime method');

  const indexHtml = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
  assert.ok(indexHtml.includes('id="rest-timer-progress-bar"'), 'index.html has rest-timer-progress-bar');
  assert.ok(indexHtml.includes('id="rest-timer-skip-btn"'), 'index.html has rest-timer-skip-btn');
  assert.ok(indexHtml.includes('id="timer-minus-15"'), 'index.html has timer-minus-15 button');
  assert.ok(indexHtml.includes('id="timer-plus-30"'), 'index.html has timer-plus-30 button');
  assert.ok(indexHtml.includes('id="timer-plus-60"'), 'index.html has timer-plus-60 button');

  const cssCode = fs.readFileSync(path.join(__dirname, '../css/components.css'), 'utf8');
  assert.ok(cssCode.includes('.rest-timer-progress-fill'), 'components.css styles rest timer progress fill');
  assert.ok(cssCode.includes('.rest-timer-skip-btn'), 'components.css styles rest timer skip button');

  const uiCode = fs.readFileSync(path.join(__dirname, '../js/ui.js'), 'utf8');
  assert.ok(uiCode.includes('rest-timer-skip-btn'), 'ui.js wires skip button click handler');
  assert.ok(uiCode.includes('timer-minus-15'), 'ui.js wires -15s button click handler');
});

// --- ITEM 3: Retroactive Workout Logging for Past Days ---
test('Item 3 - Retroactive workout logging for past days', () => {
  const todayCode = fs.readFileSync(path.join(__dirname, '../js/today.js'), 'utf8');
  assert.ok(todayCode.includes('function isDayEditable()'), 'today.js defines isDayEditable()');
  assert.ok(todayCode.includes('function checkDayEditableOrWarn()'), 'today.js defines checkDayEditableOrWarn()');
  assert.ok(todayCode.includes('currentDayIndex <= realTodayIndex'), 'isDayEditable allows past days and today');
  assert.ok(todayCode.includes('unlockedEarly'), 'isDayEditable supports unlockedEarly for future days');
  assert.ok(todayCode.includes('unlockEarly'), 'today.js provides unlockEarly function');
  assert.ok(todayCode.includes('retroactive_entry_badge'), 'today.js displays retroactive entry badge for past days');

  const i18nCode = fs.readFileSync(path.join(__dirname, '../js/i18n.js'), 'utf8');
  assert.ok(i18nCode.includes('retroactive_entry_badge'), 'i18n has retroactive_entry_badge translation');
  assert.ok(i18nCode.includes('unlock_early_entry'), 'i18n has unlock_early_entry translation');
});

// --- ITEM 2: Exercise Order Flexibility - Temporary Skip without "מכשיר תפוס" ---
test('Item 2 - Exercise Order Flexibility: Temporary skip strictly without "מכשיר תפוס"', () => {
  const todayCode = fs.readFileSync(path.join(__dirname, '../js/today.js'), 'utf8');
  const i18nCode = fs.readFileSync(path.join(__dirname, '../js/i18n.js'), 'utf8');

  // Verify user constraint: strictly "דלג זמנית" only, without "מכשיר תפוס"
  assert.ok(!todayCode.includes('מכשיר תפוס'), 'today.js does NOT contain "מכשיר תפוס"');
  assert.ok(!i18nCode.includes('מכשיר תפוס'), 'i18n.js does NOT contain "מכשיר תפוס"');

  assert.ok(todayCode.includes('function toggleSkipExerciseTemp(exIdx)'), 'today.js defines toggleSkipExerciseTemp');
  assert.ok(todayCode.includes('skippedExercises'), 'today.js tracks skippedExercises in state');
  assert.ok(todayCode.includes('btn-skip-temp'), 'today.js renders btn-skip-temp');
  assert.ok(todayCode.includes('btn-unskip-temp'), 'today.js renders btn-unskip-temp');
  assert.ok(todayCode.includes('skipped-temp-badge'), 'today.js renders skipped-temp-badge');

  // Verify that an exercise being skipped unlocks subsequent exercises
  assert.ok(todayCode.includes('const isSkipped = skipped['), 'isExerciseUnlocked checks if previous exercise was skipped');

  const cssCode = fs.readFileSync(path.join(__dirname, '../css/components.css'), 'utf8');
  assert.ok(cssCode.includes('.exercise-card.skipped-temp'), 'components.css styles skipped-temp card');
  assert.ok(cssCode.includes('.btn-skip-temp'), 'components.css styles btn-skip-temp');
  assert.ok(cssCode.includes('.btn-unskip-temp'), 'components.css styles btn-unskip-temp');
});

// --- ITEM 1: 1-Tap Set Completion ---
test('Item 1 - 1-Tap Set Completion (default in_window, modal on tap completed or hold)', () => {
  const todayCode = fs.readFileSync(path.join(__dirname, '../js/today.js'), 'utf8');
  assert.ok(todayCode.includes('function handleSetClick(exIdx, setIdx, triggerEl)'), 'today.js defines handleSetClick');
  assert.ok(todayCode.includes("selectSetOutcome(exIdx, setIdx, 'in_window'"), 'handleSetClick immediately marks set as in_window on 1-tap');
  assert.ok(todayCode.includes('openSetOutcomeModal(exIdx, setIdx)'), 'handleSetClick opens modal when set is already done');

  // Verify auto-fill of reps & weight when left empty on 1-tap completion
  assert.ok(todayCode.includes('!exData[`set_${setIdx}_reps`]'), 'selectSetOutcome auto-fills target reps if empty');
  assert.ok(todayCode.includes('!exData[`set_${setIdx}_weight`]'), 'selectSetOutcome auto-fills suggested weight if empty');

  // Verify set modal option choices & reset button
  assert.ok(todayCode.includes('change_set_outcome_title'), 'openSetOutcomeModal supports changing outcome');
  assert.ok(todayCode.includes('hero-reset-option'), 'openSetOutcomeModal includes reset button');
  assert.ok(todayCode.includes('oncontextmenu="TodayPage.openSetOutcomeModal'), 'set rows support contextmenu / long press for direct modal');

  // Verify TodayPage exports
  assert.ok(todayCode.includes('handleSetClick,'), 'TodayPage exports handleSetClick');
  assert.ok(todayCode.includes('toggleSkipExerciseTemp,'), 'TodayPage exports toggleSkipExerciseTemp');
  assert.ok(todayCode.includes('unlockEarly,'), 'TodayPage exports unlockEarly');
  assert.ok(todayCode.includes('isDayEditable,'), 'TodayPage exports isDayEditable');
});
