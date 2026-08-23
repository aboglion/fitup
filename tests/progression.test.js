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
  
  const result = ProgressionEngine.calculateWeightedDecision(exercise, state, setResults, 8, null);
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
