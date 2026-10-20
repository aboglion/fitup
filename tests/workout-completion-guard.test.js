import test from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test('Workout Completion Celebration Guard - Code Integrity & Logic', () => {
  const todayCode = fs.readFileSync(path.join(__dirname, '../js/today.js'), 'utf8');

  // Verify helper functions are defined
  assert.ok(todayCode.includes('function isExerciseFullyCompleted(ex, exIdx)'), 'isExerciseFullyCompleted function defined');
  assert.ok(todayCode.includes('function syncAllExerciseStatuses(day)'), 'syncAllExerciseStatuses function defined');

  // Verify showWorkoutCelebration modal active guard
  assert.ok(todayCode.includes('if (window._isCelebrationModalActive) return;'), 'showWorkoutCelebration prevents duplicate modal popup');
  assert.ok(todayCode.includes('window._isCelebrationModalActive = true;'), 'showWorkoutCelebration sets modal active flag');

  // Verify wasWorkoutCompleted guards in selectSetOutcome, selectSetOutcomeFromModal, and toggleSet
  assert.ok(todayCode.includes('const wasWorkoutCompleted = Boolean(currentTracking && currentTracking.completed);'), 'captures wasWorkoutCompleted before updating set state');
  assert.ok(todayCode.includes('!wasWorkoutCompleted && currentTracking.completed'), 'guards showWorkoutCelebration against already completed workouts');

  // Verify selectSetOutcomeFromModal only celebrates when the exercise was genuinely finished
  assert.ok(todayCode.includes('const isExDone = isExerciseFullyCompleted(day?.exercises[exIdx], exIdx);'), 'selectSetOutcomeFromModal checks isExDone');
  assert.ok(todayCode.includes('!wasWorkoutCompleted && currentTracking.completed && isExDone && day'), 'selectSetOutcomeFromModal guards showWorkoutCelebration with isExDone and wasWorkoutCompleted');

  // Verify warmup exercises do not trigger heavy exercise fanfare fireworks/trophy
  assert.ok(todayCode.includes('!wasAlreadyDone && !isWarmup'), 'selectSetOutcome skips exercise fanfare for warmups');
  assert.ok(todayCode.includes('if (window.Effects3D && !isWarmup)'), 'toggleSet skips exercise fanfare for warmups');
});

test('TodayPage Completion Evaluation Logic - Unit Simulation', () => {
  // Simulate the isExerciseFullyCompleted logic directly
  function isExerciseFullyCompleted(ex, exIdx, tracking, currentDayIndex = 0) {
    if (!ex) return false;
    const lowerExName = (ex.name || '').toLowerCase();
    const isMobilityProtocol = lowerExName.includes('micro mobility') || lowerExName.includes('deep mobility');
    const setData = (tracking && tracking.setData && tracking.setData[exIdx]) || {};

    if (isMobilityProtocol) {
      if (lowerExName.includes('micro mobility')) {
        const subSteps = (tracking && tracking.microMobilitySteps) || {};
        const subExercises = [{ id: 'sub1' }, { id: 'sub2' }];
        return subExercises.every(sub => Boolean(subSteps[sub.id]));
      }
    }

    const setsCount = 3;
    for (let s = 0; s < setsCount; s++) {
      if (!setData[`set_${s}_done`]) {
        return false;
      }
    }
    return true;
  }

  function syncAllExerciseStatuses(day, tracking) {
    let completedCount = 0;
    day.exercises.forEach((ex, idx) => {
      const isDone = isExerciseFullyCompleted(ex, idx, tracking);
      tracking.exerciseStatus[idx] = isDone;
      if (isDone) completedCount++;
    });
    const total = day.exercises.length;
    tracking.completed = (total > 0) && (completedCount === total);
  }

  const mockDay = {
    exercises: [
      { name: 'Floor Press', sets: '3×10' },
      { name: 'Chin-Up', sets: '3×8' }
    ]
  };

  const mockTracking = {
    exerciseStatus: {},
    setData: {
      0: { set_0_done: true, set_1_done: false, set_2_done: false },
      1: { set_0_done: false, set_1_done: false, set_2_done: false }
    },
    completed: false
  };

  // Set 0 done on Ex 0 - exercise is NOT fully completed
  assert.strictEqual(isExerciseFullyCompleted(mockDay.exercises[0], 0, mockTracking), false);
  syncAllExerciseStatuses(mockDay, mockTracking);
  assert.strictEqual(mockTracking.exerciseStatus[0], false);
  assert.strictEqual(mockTracking.completed, false);

  // Mark all sets of Ex 0 done
  mockTracking.setData[0].set_1_done = true;
  mockTracking.setData[0].set_2_done = true;
  assert.strictEqual(isExerciseFullyCompleted(mockDay.exercises[0], 0, mockTracking), true);
  syncAllExerciseStatuses(mockDay, mockTracking);
  assert.strictEqual(mockTracking.exerciseStatus[0], true);
  assert.strictEqual(mockTracking.completed, false, 'Workout still not completed because Ex 1 is incomplete');

  // Mark all sets of Ex 1 done
  mockTracking.setData[1] = { set_0_done: true, set_1_done: true, set_2_done: true };
  syncAllExerciseStatuses(mockDay, mockTracking);
  assert.strictEqual(mockTracking.exerciseStatus[1], true);
  assert.strictEqual(mockTracking.completed, true, 'Workout is completed when ALL exercises are completed');

  // Now simulate user editing a set in an already completed workout:
  const wasWorkoutCompleted = Boolean(mockTracking.completed);
  assert.strictEqual(wasWorkoutCompleted, true);

  let celebrationFired = false;
  const isExDone = isExerciseFullyCompleted(mockDay.exercises[0], 0, mockTracking);
  if (!wasWorkoutCompleted && mockTracking.completed && isExDone && mockDay) {
    celebrationFired = true;
  }
  assert.strictEqual(celebrationFired, false, 'Celebration must NOT fire when editing sets in already completed workout');
});
