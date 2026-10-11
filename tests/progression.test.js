import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Load progression.js in Node context
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const progressionCode = fs.readFileSync(path.join(__dirname, '../js/progression.js'), 'utf8');

const window = {};
const evalFunc = new Function('window', progressionCode);
evalFunc(window);

const ProgressionEngine = window.ProgressionEngine;

test('ProgressionEngine - calculateWeightedDecision all_above increases weight', () => {
  const exercise = { id: 'db-floor-press', startingWeight: 10, minWeight: 3, maxWeight: 24, increment: 1 };
  const state = { currentWeightKg: 10 };
  const setResults = [{ result: 'above' }, { result: 'above' }, { result: 'above' }];

  const result = ProgressionEngine.calculateWeightedDecision(exercise, state, setResults, 1, null);
  assert.equal(result.action, 'increase');
  assert.equal(result.newWeight, 11);
  assert.equal(result.reason, 'all_above_max');
});

test('ProgressionEngine - calculateWeightedDecision all_below decreases weight', () => {
  const exercise = { id: 'db-floor-press', startingWeight: 10, minWeight: 3, maxWeight: 24, increment: 1 };
  const state = { currentWeightKg: 10 };
  const setResults = [{ result: 'all_below' }, { result: 'all_below' }];

  const result = ProgressionEngine.calculateWeightedDecision(exercise, state, [{ result: 'below' }, { result: 'below' }], 1, null);
  assert.equal(result.action, 'decrease');
  assert.equal(result.newWeight, 9);
  assert.equal(result.reason, 'all_below_window');
});

test('ProgressionEngine - calculateWeightedDecision deload week maintains weight', () => {
  const exercise = { id: 'db-floor-press', startingWeight: 10, minWeight: 3, maxWeight: 24, increment: 1 };
  const state = { currentWeightKg: 10 };
  const setResults = [{ result: 'above' }, { result: 'above' }];

  // v15.7 Accelerated: deloads occur every 12 weeks (week 12 is a deload week)
  const result = ProgressionEngine.calculateWeightedDecision(exercise, state, setResults, 12, null);
  assert.equal(result.action, 'maintain');
  assert.equal(result.newWeight, 10);
  assert.equal(result.reason, 'deload_week_no_progression');
});

test('ProgressionEngine - calculateIntraWorkoutRest extends rest on below set', () => {
  const exercise = { id: 'db-floor-press', restSeconds: 90, restRange: [90, 120] };

  const restNormal = ProgressionEngine.calculateIntraWorkoutRest(exercise, 'in_window', 90);
  assert.equal(restNormal.rest, 90);

  const restExtended = ProgressionEngine.calculateIntraWorkoutRest(exercise, 'below', 90);
  assert.equal(restExtended.rest, 120);
});

test('ProgressionEngine - evaluateMyoReps increases stage on full clean cluster', () => {
  const exercise = {
    myoConfig: { activationReps: 12, miniSets: 3, miniReps: 5, stopRule: 'two_consecutive_tempo_losses' }
  };
  const clusterResults = {
    activation: { cleanReps: 12, anyTempoLoss: false, tempoLossStop: false },
    miniSets: [
      { cleanReps: 5, anyTempoLoss: false, tempoLossStop: false },
      { cleanReps: 5, anyTempoLoss: false, tempoLossStop: false },
      { cleanReps: 5, anyTempoLoss: false, tempoLossStop: false }
    ]
  };

  const evalResult = ProgressionEngine.evaluateMyoReps(exercise, null, clusterResults);
  assert.equal(evalResult.action, 'increase_stage');
  assert.equal(evalResult.reason, 'full_cluster_clean');
});

test('ProgressionEngine - evaluateMyoReps cancels block on joint pain', () => {
  const exercise = { myoConfig: { activationReps: 12, miniSets: 3, miniReps: 5 } };
  const clusterResults = { jointPainReported: true };

  const evalResult = ProgressionEngine.evaluateMyoReps(exercise, null, clusterResults);
  assert.equal(evalResult.action, 'cancel_block');
  assert.equal(evalResult.reason, 'joint_pain');
});

test('ProgressionEngine - Group A cadence promotes on 3rd in-window workout', () => {
  const exGroupA = { id: 'goblet-rdl', category: 'Legs', compound: true, startingWeight: 8, increment: 2, minWeight: 3, maxWeight: 32 };
  const inWindowResults = [{ result: 'in_window', reps: 10 }, { result: 'in_window', reps: 10 }, { result: 'in_window', reps: 10 }];

  // Session 1: 0 prior sessions -> maintain (1 of 3)
  const res1 = ProgressionEngine.calculateWeightedDecision(exGroupA, { currentWeightKg: 8, sessionsAtWeight: 0 }, inWindowResults, 1, null);
  assert.equal(res1.action, 'maintain');
  assert.equal(res1.newWeight, 8);
  assert.equal(res1.reason, 'cadence_group_a_accumulating_1_of_3');

  // Session 2: 1 prior session -> maintain (2 of 3)
  const res2 = ProgressionEngine.calculateWeightedDecision(exGroupA, { currentWeightKg: 8, sessionsAtWeight: 1 }, inWindowResults, 2, null);
  assert.equal(res2.action, 'maintain');
  assert.equal(res2.newWeight, 8);
  assert.equal(res2.reason, 'cadence_group_a_accumulating_2_of_3');

  // Session 3: 2 prior sessions -> increase (+2kg)!
  const res3 = ProgressionEngine.calculateWeightedDecision(exGroupA, { currentWeightKg: 8, sessionsAtWeight: 2 }, inWindowResults, 3, null);
  assert.equal(res3.action, 'increase');
  assert.equal(res3.newWeight, 10);
  assert.equal(res3.reason, 'cadence_group_a_3rd_session');

  // Performance above target: promotes earlier even on session 1!
  const resEarly = ProgressionEngine.calculateWeightedDecision(exGroupA, { currentWeightKg: 8, sessionsAtWeight: 0 }, [{ result: 'above' }, { result: 'above' }], 1, null);
  assert.equal(resEarly.action, 'increase');
  assert.equal(resEarly.newWeight, 10);
  assert.equal(resEarly.reason, 'all_above_max');
});

test('ProgressionEngine - Group B cadence promotes on 4th in-window workout', () => {
  const exGroupB = { id: 'single-arm-lateral-raise', category: 'Shoulders', compound: false, startingWeight: 8, increment: 2, minWeight: 3, maxWeight: 12 };
  const inWindowResults = [{ result: 'in_window', reps: 12 }, { result: 'in_window', reps: 12 }];

  // Sessions 1, 2, 3: accumulate
  const res1 = ProgressionEngine.calculateWeightedDecision(exGroupB, { currentWeightKg: 8, sessionsAtWeight: 0 }, inWindowResults, 1, null);
  assert.equal(res1.action, 'maintain');
  assert.equal(res1.reason, 'cadence_group_b_accumulating_1_of_4');

  const res2 = ProgressionEngine.calculateWeightedDecision(exGroupB, { currentWeightKg: 8, sessionsAtWeight: 1 }, inWindowResults, 2, null);
  assert.equal(res2.action, 'maintain');
  assert.equal(res2.reason, 'cadence_group_b_accumulating_2_of_4');

  const res3 = ProgressionEngine.calculateWeightedDecision(exGroupB, { currentWeightKg: 8, sessionsAtWeight: 2 }, inWindowResults, 3, null);
  assert.equal(res3.action, 'maintain');
  assert.equal(res3.reason, 'cadence_group_b_accumulating_3_of_4');

  // Session 4: 3 prior sessions -> increase (+2kg)!
  const res4 = ProgressionEngine.calculateWeightedDecision(exGroupB, { currentWeightKg: 8, sessionsAtWeight: 3 }, inWindowResults, 4, null);
  assert.equal(res4.action, 'increase');
  assert.equal(res4.newWeight, 10);
  assert.equal(res4.reason, 'cadence_group_b_4th_session');

  // Mixed results: hold longer (maintain)
  const resMixed = ProgressionEngine.calculateWeightedDecision(exGroupB, { currentWeightKg: 8, sessionsAtWeight: 2 }, [{ result: 'in_window' }, { result: 'below' }], 3, null);
  assert.equal(resMixed.action, 'maintain');
  assert.equal(resMixed.reason, 'mixed_results_maintain');
});

