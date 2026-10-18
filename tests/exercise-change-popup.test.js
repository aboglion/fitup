import test from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test('Exercise Change Popup - CSS styling and unobtrusive floating layout', () => {
  const cssCode = fs.readFileSync(path.join(__dirname, '../css/components.css'), 'utf8');

  // Verify popup element exists with non-blocking fixed position and high z-index
  assert.ok(cssCode.includes('.exercise-change-popup {'), 'components.css defines .exercise-change-popup');
  assert.ok(cssCode.includes('position: fixed;'), 'exercise-change-popup is fixed in viewport');
  assert.ok(cssCode.includes('top: calc(18px + env(safe-area-inset-top, 0px));'), 'exercise-change-popup positioned unobtrusively at top');
  assert.ok(cssCode.includes('z-index: 10005;'), 'exercise-change-popup has high z-index');
  assert.ok(cssCode.includes('animation: exercisePopupJumpIn'), 'exercise-change-popup has jump-in animation');

  // Verify 3s progress bar and countdown
  assert.ok(cssCode.includes('.exercise-change-popup-progress {'), 'defines progress bar');
  assert.ok(cssCode.includes('popupProgressCountdown 3s linear forwards'), 'progress bar animates over 3 seconds');

  // Verify card alert neon red border pulse
  assert.ok(cssCode.includes('.exercise-card.alert-pulse-card {'), 'defines alert-pulse-card');
  assert.ok(cssCode.includes('pulse-neon-red-card'), 'card pulses with red neon border');

  // Verify light theme and RTL support
  assert.ok(cssCode.includes('html.light-theme .exercise-change-popup'), 'supports light theme');
  assert.ok(cssCode.includes('html[dir="rtl"] .exercise-change-popup-progress'), 'supports RTL direction for progress bar');
});

test('Exercise Change Popup - JS logic in today.js', () => {
  const todayCode = fs.readFileSync(path.join(__dirname, '../js/today.js'), 'utf8');

  // Verify change inspection method exists
  assert.ok(todayCode.includes('function getExerciseChangeDetails(idx)'), 'today.js defines getExerciseChangeDetails');
  assert.ok(todayCode.includes('function triggerExerciseChangePopup(idx)'), 'today.js defines triggerExerciseChangePopup');
  assert.ok(todayCode.includes('function dismissExerciseChangePopup('), 'today.js defines dismissExerciseChangePopup');

  // Verify popup triggers on accordion expand and dismisses on collapse
  assert.ok(todayCode.includes('triggerExerciseChangePopup(idx);'), 'toggleExpand calls triggerExerciseChangePopup on expansion');
  assert.ok(todayCode.includes('dismissExerciseChangePopup();'), 'toggleExpand dismisses popup on accordion collapse');

  // Verify 3000ms auto-dismiss timer
  assert.ok(todayCode.includes('setTimeout(() => {\n      dismissExerciseChangePopup();\n    }, 3000);') || todayCode.includes('dismissExerciseChangePopup();\n    }, 3000);'), 'auto-dismisses after exactly 3 seconds');

  // Verify card alert pulse includes weight and equipment changes
  assert.ok(todayCode.includes('const isCardAlert = isNewExercise || isAngleChanged || isWeightChanged || isEquipmentChanged;'), 'isCardAlert checks new exercise, angle, weight, and equipment changes');

  // Verify TodayPage exports
  assert.ok(todayCode.includes('triggerExerciseChangePopup,'), 'TodayPage exports triggerExerciseChangePopup');
  assert.ok(todayCode.includes('dismissExerciseChangePopup,'), 'TodayPage exports dismissExerciseChangePopup');
  assert.ok(todayCode.includes('getExerciseChangeDetails,'), 'TodayPage exports getExerciseChangeDetails');
});

test('Exercise Change Popup - I18n keys synchronization', () => {
  const i18nCode = fs.readFileSync(path.join(__dirname, '../js/i18n.js'), 'utf8');

  const requiredKeys = [
    'exercise_change_popup_title',
    'weight_increased_title',
    'weight_adjusted_title',
    'weight_updated_title',
    'equipment_changed_title',
    'new_stage_badge',
    'weight_prev_was',
    'new_exercise_popup_desc',
    'close_btn'
  ];

  requiredKeys.forEach(key => {
    assert.ok(i18nCode.includes(`${key}:`), `i18n.js includes key ${key}`);
  });
});
