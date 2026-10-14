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
  const exercise = { id: 'db-floor-press', startingWeight: 10, minWeight: 6, maxWeight: 24, increment: 1 };
  const state = { currentWeightKg: 10 };
  const setResults = [{ result: 'above' }, { result: 'above' }, { result: 'above' }];

  const result = ProgressionEngine.calculateWeightedDecision(exercise, state, setResults, 1, null);
  assert.equal(result.action, 'increase');
  assert.equal(result.newWeight, 11);
  assert.equal(result.reason, 'all_above_max');
});

test('ProgressionEngine - calculateWeightedDecision all_below decreases weight', () => {
  const exercise = { id: 'db-floor-press', startingWeight: 10, minWeight: 6, maxWeight: 24, increment: 2 };

  // 1st BELOW session maintains weight and sets targetSets to base
  const state1 = { currentWeightKg: 10, consecutiveBelow: 0 };
  const result1 = ProgressionEngine.calculateWeightedDecision(exercise, state1, [{ result: 'below' }, { result: 'below' }], 1, null);
  assert.equal(result1.action, 'maintain');
  assert.equal(result1.newWeight, 10);
  assert.equal(result1.reason, 'first_below_maintain');

  // 2nd consecutive BELOW session demotes weight
  const state2 = { currentWeightKg: 10, consecutiveBelow: 1 };
  const result2 = ProgressionEngine.calculateWeightedDecision(exercise, state2, [{ result: 'below' }, { result: 'below' }], 1, null);
  assert.equal(result2.action, 'decrease');
  assert.equal(result2.newWeight, 8);
  assert.equal(result2.reason, 'consecutive_below_decrease');

  // Decreasing at minWeight (6kg) cannot drop below 6kg handle floor
  const stateMin = { currentWeightKg: 6, consecutiveBelow: 1 };
  const resultMin = ProgressionEngine.calculateWeightedDecision(exercise, stateMin, [{ result: 'below' }, { result: 'below' }], 1, null);
  assert.equal(resultMin.action, 'decrease');
  assert.equal(resultMin.newWeight, 6);
});

test('ProgressionEngine - calculateWeightedDecision deload week maintains weight', () => {
  const exercise = { id: 'db-floor-press', startingWeight: 10, minWeight: 6, maxWeight: 24, increment: 1 };
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
  const exGroupA = { id: 'goblet-rdl', category: 'Legs', compound: true, startingWeight: 8, increment: 2, minWeight: 6, maxWeight: 32 };
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
  const exGroupB = { id: 'single-arm-lateral-raise', category: 'Shoulders', compound: false, startingWeight: 6, increment: 2, minWeight: 6, maxWeight: 12 };
  const inWindowResults = [{ result: 'in_window', reps: 12 }, { result: 'in_window', reps: 12 }];

  // Sessions 1, 2, 3: accumulate
  const res1 = ProgressionEngine.calculateWeightedDecision(exGroupB, { currentWeightKg: 6, sessionsAtWeight: 0 }, inWindowResults, 1, null);
  assert.equal(res1.action, 'maintain');
  assert.equal(res1.reason, 'cadence_group_b_accumulating_1_of_4');
  assert.equal(res1.targetSets, 2); // Session 1 base sets

  const res2 = ProgressionEngine.calculateWeightedDecision(exGroupB, { currentWeightKg: 6, sessionsAtWeight: 1 }, inWindowResults, 2, null);
  assert.equal(res2.action, 'maintain');
  assert.equal(res2.reason, 'cadence_group_b_accumulating_2_of_4');
  assert.equal(res2.targetSets, 3); // Stepped up to 3 sets (Tier 1: 6->8kg is +33.3%)

  const res3 = ProgressionEngine.calculateWeightedDecision(exGroupB, { currentWeightKg: 6, sessionsAtWeight: 2 }, inWindowResults, 3, null);
  assert.equal(res3.action, 'maintain');
  assert.equal(res3.reason, 'cadence_group_b_accumulating_3_of_4');
  assert.equal(res3.targetSets, 4); // Peak bridge to 4 sets for session 3

  // Session 4: 3 prior sessions -> increase (+2kg to 8kg)!
  const res4 = ProgressionEngine.calculateWeightedDecision(exGroupB, { currentWeightKg: 6, sessionsAtWeight: 3 }, inWindowResults, 4, null);
  assert.equal(res4.action, 'increase');
  assert.equal(res4.newWeight, 8);
  assert.equal(res4.targetSets, 2); // Resets back to base sets!
  assert.equal(res4.reason, 'cadence_group_b_4th_session');

  // Mixed results: hold longer (maintain)
  const resMixed = ProgressionEngine.calculateWeightedDecision(exGroupB, { currentWeightKg: 6, sessionsAtWeight: 2 }, [{ result: 'in_window' }, { result: 'below' }], 3, null);
  assert.equal(resMixed.action, 'maintain');
  assert.equal(resMixed.reason, 'mixed_results_maintain');
});

test('ProgressionEngine - calculatePrescribedSets percentage-based volume stepping', () => {
  const lateralRaise = { id: 'single-arm-lateral-raise', category: 'Shoulders', compound: false, startingWeight: 6, increment: 2 };
  const baseSets = 2;

  // Tier 1: 6 kg -> 8 kg (+33.3% jump)
  // Session 1 (0 prior sessions): base 2 sets
  const t1_s0 = ProgressionEngine.calculatePrescribedSets(lateralRaise, 6, 0, baseSets);
  assert.equal(t1_s0, 2);

  // Session 2 (1 prior session): step to 3 sets
  const t1_s1 = ProgressionEngine.calculatePrescribedSets(lateralRaise, 6, 1, baseSets);
  assert.equal(t1_s1, 3);

  // Session 3 (2 prior sessions): step to 4 sets (peak bridge)
  const t1_s2 = ProgressionEngine.calculatePrescribedSets(lateralRaise, 6, 2, baseSets);
  assert.equal(t1_s2, 4);

  // Tier 2: 8 kg -> 10 kg (+25.0% jump)
  // Session 1 & 2: base 2 sets
  const t2_s0 = ProgressionEngine.calculatePrescribedSets(lateralRaise, 8, 0, baseSets);
  assert.equal(t2_s0, 2);

  const t2_s1 = ProgressionEngine.calculatePrescribedSets(lateralRaise, 8, 1, baseSets);
  assert.equal(t2_s1, 2);

  // Session 3 (2 prior sessions): step to 3 sets
  const t2_s2 = ProgressionEngine.calculatePrescribedSets(lateralRaise, 8, 2, baseSets);
  assert.equal(t2_s2, 3);

  // Tier 3: 10 kg -> 12 kg (+20.0% jump) - less than 8->10 and 6->8
  const t3_s0 = ProgressionEngine.calculatePrescribedSets(lateralRaise, 10, 0, baseSets);
  assert.equal(t3_s0, 2);

  const t3_s1 = ProgressionEngine.calculatePrescribedSets(lateralRaise, 10, 1, baseSets);
  assert.equal(t3_s1, 2);

  const t3_s2 = ProgressionEngine.calculatePrescribedSets(lateralRaise, 10, 2, baseSets);
  assert.equal(t3_s2, 3);

  // Tier 4: 12 kg -> 14 kg (+16.7% jump, < 18%) - base sets maintained
  const t4_s0 = ProgressionEngine.calculatePrescribedSets(lateralRaise, 12, 0, baseSets);
  assert.equal(t4_s0, 2);

  const t4_s2 = ProgressionEngine.calculatePrescribedSets(lateralRaise, 12, 2, baseSets);
  assert.equal(t4_s2, 2);

  // Group A Compound Exercise (e.g. Floor Press starting base 3 sets)
  const floorPress = { id: 'single-arm-floor-press', category: 'Push', compound: true, startingWeight: 8, increment: 2 };
  // 8 -> 10kg (+25% jump): session 2 steps from 3 to 4 sets
  const fp_s0 = ProgressionEngine.calculatePrescribedSets(floorPress, 8, 0, 3);
  assert.equal(fp_s0, 3);
  const fp_s1 = ProgressionEngine.calculatePrescribedSets(floorPress, 8, 1, 3);
  assert.equal(fp_s1, 4);
});

test('ProgressionEngine - Arm Block Gradual Ramp Phase resolver', () => {
  // Weeks 1-2: Locked
  const w1 = ProgressionEngine.getArmBlockRampPhase(1);
  assert.equal(w1.active, false);
  assert.equal(w1.phase, 'LOCKED');

  const w2 = ProgressionEngine.getArmBlockRampPhase(2);
  assert.equal(w2.active, false);

  // Week 3: Micro-Dose 1 (1 activation set + 1 mini-set of 4 reps)
  const w3 = ProgressionEngine.getArmBlockRampPhase(3);
  assert.equal(w3.active, true);
  assert.equal(w3.phase, 'MICRO_DOSE_1');
  assert.equal(w3.miniSets, 1);
  assert.equal(w3.miniReps, 4);

  // Week 4 & 5: Micro-Dose 2 & Consolidation (1 activation set + 2 mini-sets of 4 reps)
  const w4 = ProgressionEngine.getArmBlockRampPhase(4);
  assert.equal(w4.active, true);
  assert.equal(w4.phase, 'MICRO_DOSE_2');
  assert.equal(w4.miniSets, 2);
  assert.equal(w4.miniReps, 4);

  const w5 = ProgressionEngine.getArmBlockRampPhase(5);
  assert.equal(w5.active, true);
  assert.equal(w5.phase, 'MICRO_DOSE_2');
  assert.equal(w5.miniSets, 2);
  assert.equal(w5.miniReps, 4);

  // Week 6+: Full Cluster (1 activation set + 3 mini-sets of 5 reps)
  const w6 = ProgressionEngine.getArmBlockRampPhase(6);
  assert.equal(w6.active, true);
  assert.equal(w6.phase, 'FULL_CLUSTER');
  assert.equal(w6.miniSets, 3);
  assert.equal(w6.miniReps, 5);

  // Allowance check
  assert.equal(ProgressionEngine.isArmBlockAllowed(null, 2).active, false);
  assert.equal(ProgressionEngine.isArmBlockAllowed(null, 3).active, true);
  assert.equal(ProgressionEngine.isArmBlockAllowed(null, 6).active, true);
});

test('ProgressionEngine - Single-Leg RDL initializes safely at 50% bilateral baseline without copying 100% load', () => {
  window.TRAINING_DATA = {
    exercises: [
      { id: 'single-leg-rdl', name: 'Single-Leg RDL', type: 'weighted', startingWeight: 8, minWeight: 6, maxWeight: 32, increment: 2 },
      { id: 'goblet-rdl', name: 'Goblet Romanian Deadlift', type: 'weighted', startingWeight: 8, minWeight: 6, maxWeight: 32, increment: 2 }
    ]
  };
  // Trainee has achieved 20kg on Goblet RDL at Week 17
  const statesMap20 = {
    'goblet-rdl': { currentWeightKg: 20, sessionsAtWeight: 2 }
  };
  const slState20 = ProgressionEngine.createInitialState('single-leg-rdl', statesMap20);
  // Starts safely at 50% (10 kg) to maintain mechanical tension without copying full 20kg
  assert.equal(slState20.currentWeightKg, 10);
  assert.equal(slState20.exerciseId, 'single-leg-rdl');

  // Trainee with 14kg on Goblet RDL
  const statesMap14 = {
    'goblet-rdl': { currentWeightKg: 14, sessionsAtWeight: 2 }
  };
  const slState14 = ProgressionEngine.createInitialState('single-leg-rdl', statesMap14);
  // Bounded by safe 8kg floor
  assert.equal(slState14.currentWeightKg, 8);
});

test('ProgressionEngine - calculateWeightedDecision and getDisplayPrescription handle 32kg ceiling overload', () => {
  window.TRAINING_DATA = {
    progressionSettings: { deloadEveryWeeks: 12, deloadWeightReductionKg: 2 },
    exercises: [
      { id: 'heels-elevated-goblet-squat', name: 'Heels-Elevated Goblet Squat', type: 'weighted', startingWeight: 8, minWeight: 6, maxWeight: 32, increment: 2 }
    ]
  };
  const ex = window.TRAINING_DATA.exercises[0];
  const ceilingState = { currentWeightKg: 32, sessionsAtWeight: 2 };
  
  // Clean in-window performance at 32kg
  const decisionInWindow = ProgressionEngine.calculateWeightedDecision(ex, ceilingState, [{ result: 'in_window' }, { result: 'in_window' }], 1, null);
  assert.equal(decisionInWindow.newWeight, 32);
  assert.equal(decisionInWindow.atMaxWeight, true);
  assert.equal(decisionInWindow.reason, 'max_weight_ceiling_reached');

  // Above window performance at 32kg
  const decisionAbove = ProgressionEngine.calculateWeightedDecision(ex, ceilingState, [{ result: 'above' }, { result: 'above' }], 1, null);
  assert.equal(decisionAbove.newWeight, 32);
  assert.equal(decisionAbove.atMaxWeight, true);
  assert.equal(decisionAbove.reason, 'max_weight_ceiling_reached');

  // Prescription reflects atMaxWeight on regular weeks (e.g. Week 35)
  const rx = ProgressionEngine.getDisplayPrescription('heels-elevated-goblet-squat', 35, ceilingState);
  assert.equal(rx.targetWeightKg, 32);
  assert.equal(rx.atMaxWeight, true);
});


