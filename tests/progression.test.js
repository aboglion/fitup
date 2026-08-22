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

test('ProgressionEngine - calculateNextProgression success increases weight', () => {
  const currentState = { currentWeightKg: 10, currentReps: 8, consecutiveFailures: 0 };
  const perf = { targetReps: 8, actualReps: 10, weightKg: 10, tempoLossCount: 0 };
  
  const result = ProgressionEngine.calculateNextProgression(currentState, perf);
  assert.equal(result.success, true);
  assert.equal(result.newState.currentWeightKg, 11);
  assert.equal(result.newState.consecutiveFailures, 0);
  assert.equal(result.triggeredDeload, false);
});

test('ProgressionEngine - calculateNextProgression failure retains weight on 1st fail', () => {
  const currentState = { currentWeightKg: 10, currentReps: 8, consecutiveFailures: 0 };
  const perf = { targetReps: 8, actualReps: 6, weightKg: 10, tempoLossCount: 0 };
  
  const result = ProgressionEngine.calculateNextProgression(currentState, perf);
  assert.equal(result.success, false);
  assert.equal(result.newState.currentWeightKg, 10);
  assert.equal(result.newState.consecutiveFailures, 1);
  assert.equal(Boolean(result.triggeredDeload), false);
});

test('ProgressionEngine - calculateNextProgression triggers deload on 2nd consecutive fail', () => {
  const currentState = { currentWeightKg: 20, currentReps: 8, consecutiveFailures: 1 };
  const perf = { targetReps: 8, actualReps: 6, weightKg: 20, tempoLossCount: 0 };
  
  const result = ProgressionEngine.calculateNextProgression(currentState, perf);
  assert.equal(result.success, false);
  assert.equal(result.triggeredDeload, true);
  assert.equal(result.newState.currentWeightKg, 17); // 85% of 20 = 17
  assert.equal(result.newState.consecutiveFailures, 0);
});

test('ProgressionEngine - calculateAdaptiveRest extends rest on tempo loss or missed reps', () => {
  const restNormal = ProgressionEngine.calculateAdaptiveRest('db-floor-press', 90, 8, 8, 0, 7);
  assert.equal(restNormal, 90);

  const restExtended = ProgressionEngine.calculateAdaptiveRest('db-floor-press', 90, 6, 8, 0, 7);
  assert.equal(restExtended, 120);

  const restTempoLoss = ProgressionEngine.calculateAdaptiveRest('db-floor-press', 90, 8, 8, 2, 7);
  assert.equal(restTempoLoss, 120);
});

test('ProgressionEngine - evaluateMyoSet stops on 2 consecutive tempo losses', () => {
  const miniSets = [
    { reps: 5, tempoLoss: 0 },
    { reps: 5, tempoLoss: 1 },
    { reps: 5, tempoLoss: 1 }
  ];
  const evalResult = ProgressionEngine.evaluateMyoSet(12, miniSets);
  assert.equal(evalResult.totalMiniReps, 15);
  assert.equal(evalResult.totalReps, 27);
  assert.equal(evalResult.stopReason, 'TEMPO_LOSS_STOP_RULE');
  assert.equal(evalResult.shouldStopNext, true);
});
