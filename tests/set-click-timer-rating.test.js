import test from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test('Set Click - Timer and Rating Modal appear simultaneously on first click', () => {
  const todayCode = fs.readFileSync(path.join(__dirname, '../js/today.js'), 'utf8');

  // Verify handleSetClick triggers both selectSetOutcome (which starts timer) AND openSetOutcomeModal on first click
  assert.ok(todayCode.includes('function handleSetClick(exIdx, setIdx, triggerEl)'), 'today.js defines handleSetClick');
  assert.ok(todayCode.includes('const hasRating = !isNoModalExercise(ex);'), 'handleSetClick checks if exercise has rating option');
  assert.ok(todayCode.includes("await selectSetOutcome(exIdx, setIdx, 'in_window', triggerEl);"), 'handleSetClick immediately completes set and starts timer');
  assert.ok(todayCode.includes('openSetOutcomeModal(exIdx, setIdx, true);'), 'handleSetClick opens set outcome modal on first click for rating exercises');

  // Verify modal adapts title between initial effort rating and change set outcome
  assert.ok(todayCode.includes('function openSetOutcomeModal(exIdx, setIdx, isInitial = false)'), 'openSetOutcomeModal accepts isInitial parameter');
  assert.ok(todayCode.includes('modal-rest-timer-val'), 'openSetOutcomeModal renders live rest timer countdown pill');
  assert.ok(todayCode.includes('isAlreadyDone && !isInitial'), 'openSetOutcomeModal distinguishes initial rating from editing completed set');

  // Verify adaptive rest addition when set outcome switches to below
  assert.ok(todayCode.includes("outcome === 'below' && prevOutcome !== 'below'"), 'selectSetOutcome adds adaptive rest when switching to below');
  assert.ok(todayCode.includes('addTimerSeconds(30)'), 'selectSetOutcome extends active rest timer by 30s');
});

test('UI - Rest timer helper methods exported and sync to modal timer display', () => {
  const uiCode = fs.readFileSync(path.join(__dirname, '../js/ui.js'), 'utf8');

  assert.ok(uiCode.includes('function getTimerRemaining()'), 'ui.js defines getTimerRemaining');
  assert.ok(uiCode.includes('function isTimerActive()'), 'ui.js defines isTimerActive');
  assert.ok(uiCode.includes('function addTimerSeconds(seconds)'), 'ui.js defines addTimerSeconds');
  assert.ok(uiCode.includes('modalTimerDisplay'), 'ui.js syncs timer countdown to in-modal display');
  assert.ok(uiCode.includes('getTimerRemaining,'), 'UI exports getTimerRemaining');
  assert.ok(uiCode.includes('isTimerActive,'), 'UI exports isTimerActive');
  assert.ok(uiCode.includes('addTimerSeconds,'), 'UI exports addTimerSeconds');
});
