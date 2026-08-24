const fs = require('fs');
const path = require('path');

// Mock browser env
global.window = global;
global.document = {
  querySelector: () => null,
  querySelectorAll: () => [],
  addEventListener: () => {},
  createElement: () => ({ setAttribute: () => {}, appendChild: () => {}, style: {} }),
};

require('/home/uns/fitup/js/data.js');
require('/home/uns/fitup/js/progression.js');

const data = window.TRAINING_DATA;
const engine = window.ProgressionEngine;

const errors = [];
const warnings = [];

function assert(condition, msg) {
  if (!condition) {
    errors.push(msg);
  }
}

console.log("=== STARTING DETAILED INTEGRITY AUDIT ===");

// 1. LEGAL WEIGHTS
const expectedLegalWeights = [3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24];
assert(
  JSON.stringify(data.progressionSettings.legalWeights) === JSON.stringify(expectedLegalWeights),
  `Legal weights mismatch. Expected ${JSON.stringify(expectedLegalWeights)}, got ${JSON.stringify(data.progressionSettings.legalWeights)}`
);

// 2. DELOAD SETTINGS
assert(data.progressionSettings.deloadEveryWeeks === 8, `Deload every weeks should be 8, got ${data.progressionSettings.deloadEveryWeeks}`);
assert(data.progressionSettings.deloadWeightReductionKg === 2, `Deload weight reduction should be 2, got ${data.progressionSettings.deloadWeightReductionKg}`);
assert(data.progressionSettings.deloadTimeTargetPercent === 70, `Deload time target should be 70%, got ${data.progressionSettings.deloadTimeTargetPercent}`);
assert(data.progressionSettings.deloadSetsCeiling === 2, `Deload sets ceiling should be 2, got ${data.progressionSettings.deloadSetsCeiling}`);

// 3. REST RANGES IN UPDATE_PROGRAM.md (Section 6)
const expectedRestRanges = {
  "db-rdl": { base: 105, range: [90, 120] },
  "single-leg-rdl": { base: 75, range: [60, 90] },
  "db-floor-press": { base: 105, range: [90, 120] },
  "pull-up-progression": { base: 105, range: [90, 120] },
  "seated-db-ohp": { base: 82, range: [75, 90] },
  "bulgarian-split-squat": { base: 82, range: [75, 90] },
  "one-arm-db-row": { base: 82, range: [75, 90] },
  "reverse-lunge": { base: 75, range: [60, 90] },
  "pistol-squat-progression": { base: 105, range: [90, 120] },
  "db-hip-thrust": { base: 75, range: [60, 90] },
  "trx-row": { base: 75, range: [60, 90] },
  "push-up-volume": { base: 75, range: [60, 90] },
  "push-up-progression": { base: 75, range: [60, 90] },
  "pike-progression": { base: 75, range: [60, 90] },
  "db-lateral-raise": { base: 45 },
  "db-oh-triceps-extension": { base: 45 },
  "db-curl": { base: 45 },
  "hammer-curl": { base: 45 },
  "diamond-push-up": { base: 45 },
  "band-pull-apart": { base: 45 },
  "trx-ytw": { base: 45 },
  "trx-face-pull": { base: 45 },
  "standing-single-leg-calf-raise": { base: 45 },
  "seated-single-leg-calf-raise": { base: 45 },
  "suitcase-carry": { base: 60 },
  "pallof-press-progression": { base: 30 },
  "dead-bug": { base: 30 },
  "hollow-body-hold": { base: 30 },
  "l-sit-progression": { base: 45 },
  "towel-hang": { base: 45 },
  "band-neck-flexion": { base: 45 }
};

data.exercises.forEach(ex => {
  const exp = expectedRestRanges[ex.id];
  if (exp) {
    if (exp.base !== undefined) {
      assert(ex.restSeconds === exp.base || ex.rest === exp.base, `Exercise ${ex.id} base rest mismatch: expected ${exp.base}, got ${ex.restSeconds || ex.rest}`);
    }
    if (exp.range !== undefined) {
      assert(
        ex.restRange && ex.restRange[0] === exp.range[0] && ex.restRange[1] === exp.range[1],
        `Exercise ${ex.id} restRange mismatch: expected ${JSON.stringify(exp.range)}, got ${JSON.stringify(ex.restRange)}`
      );
    }
  }
});

// 4. LEAN MODE CONFIGURATION
const lean = data.progressionSettings.leanMode;
assert(lean.enabled === true, "leanMode should be enabled");
assert(lean.protectCompounds === true, "leanMode protectCompounds should be true");

// Protected exercises check
const expectedProtected = [
  "db-rdl", "single-leg-rdl", "bulgarian-split-squat", "reverse-lunge",
  "pistol-squat-progression", "db-hip-thrust", "suitcase-carry",
  "pike-progression", "db-floor-press", "push-up-progression",
  "seated-db-ohp", "db-oh-triceps-extension", "diamond-push-up",
  "pull-up-progression", "one-arm-db-row", "db-curl", "hammer-curl"
];
expectedProtected.forEach(pEx => {
  assert(lean.protectedExercises.includes(pEx), `Protected exercise ${pEx} missing from leanMode.protectedExercises`);
});

// Pairs check
assert(lean.pairs.length === 3, `Expected 3 pairs in leanMode, got ${lean.pairs.length}`);

// Circuits check
assert(lean.circuits.length === 1, `Expected 1 circuit in leanMode, got ${lean.circuits.length}`);
assert(lean.circuits[0].circuitId === 'd1-core-circuit', `Expected d1-core-circuit`);
assert(JSON.stringify(lean.circuits[0].members) === JSON.stringify(["pallof-press-progression", "dead-bug", "hollow-body-hold"]), `d1-core-circuit members mismatch`);

// Blocks check
assert(lean.blocks.length === 1, `Expected 1 block in leanMode, got ${lean.blocks.length}`);
assert(lean.blocks[0].blockId === 'd1-calf-block', `Expected d1-calf-block`);

// Toggles check
assert(lean.toggles.length === 2, `Expected 2 toggles in leanMode, got ${lean.toggles.length}`);
const rearDeltToggle = lean.toggles.find(t => t.toggleGroup === 'rear-delt');
assert(rearDeltToggle !== undefined, "rear-delt toggle missing");

const day1Toggle = lean.toggles.find(t => t.toggleGroup === 'day1-posterior-quad');
assert(day1Toggle !== undefined, "day1-posterior-quad toggle missing");

// 5. CHECK DAILY SCHEDULE FOR WEEKS 1-8
console.log("\n--- CHECKING DAILY SCHEDULE EXERCISES & DAYS ---");

// Day 1 check (Odd week e.g. Week 1 Day 1)
const w1d1 = data.daily.find(d => d.dayNum === 1 || (d.week === 'Week 1' && d.dayOfWeek === 'Monday'));
assert(w1d1 !== undefined, "Week 1 Day 1 missing");
if (w1d1) {
  const exIds = w1d1.exercises.filter(e => !e.isWarmup).map(e => e.id);
  assert(exIds.includes('db-rdl'), "W1D1 must include db-rdl");
  assert(exIds.includes('single-leg-rdl'), "W1D1 (odd) must include single-leg-rdl");
  assert(!exIds.includes('reverse-lunge'), "W1D1 (odd) must NOT include reverse-lunge");
  assert(exIds.includes('bulgarian-split-squat'), "W1D1 must include bulgarian-split-squat");
  assert(exIds.includes('db-hip-thrust'), "W1D1 must include db-hip-thrust");
  assert(exIds.includes('suitcase-carry'), "W1D1 must include suitcase-carry");
  assert(exIds.includes('standing-single-leg-calf-raise'), "W1D1 must include standing calf raise");
  assert(exIds.includes('seated-single-leg-calf-raise'), "W1D1 must include seated calf raise");
  assert(exIds.includes('pallof-press-progression'), "W1D1 must include pallof-press-progression");
  assert(exIds.includes('dead-bug'), "W1D1 must include dead-bug");
  assert(exIds.includes('hollow-body-hold'), "W1D1 must include hollow-body-hold");
}

// Day 1 check (Even week e.g. Week 2 Day 8)
const w2d1 = data.daily.find(d => d.dayNum === 8 || (d.week === 'Week 2' && d.dayOfWeek === 'Monday'));
assert(w2d1 !== undefined, "Week 2 Day 1 missing");
if (w2d1) {
  const exIds = w2d1.exercises.filter(e => !e.isWarmup).map(e => e.id);
  assert(exIds.includes('db-rdl'), "W2D1 must include db-rdl");
  assert(!exIds.includes('single-leg-rdl'), "W2D1 (even) must NOT include single-leg-rdl");
  assert(exIds.includes('reverse-lunge') || exIds.includes('pistol-squat-progression'), "W2D1 (even) must include reverse-lunge or pistol-squat-progression");
}

// Day 3 check (Odd vs Even week rear-delt toggle)
const w1d3 = data.daily.find(d => d.dayNum === 3 || (d.week === 'Week 1' && d.dayOfWeek === 'Wednesday'));
if (w1d3) {
  const exIds = w1d3.exercises.filter(e => !e.isWarmup).map(e => e.id);
  assert(exIds.includes('trx-ytw'), "W1D3 (odd) must include trx-ytw");
  assert(!exIds.includes('band-pull-apart'), "W1D3 (odd) main exercises must NOT include band-pull-apart (only in warmup)");
}

const w2d3 = data.daily.find(d => d.dayNum === 10 || (d.week === 'Week 2' && d.dayOfWeek === 'Wednesday'));
if (w2d3) {
  const exIds = w2d3.exercises.filter(e => !e.isWarmup).map(e => e.id);
  assert(!exIds.includes('trx-ytw'), "W2D3 (even) main exercises must NOT include trx-ytw");
  assert(exIds.includes('band-pull-apart'), "W2D3 (even) main exercises must include band-pull-apart");
}

// Day 4 check (Active recovery cervical protocol)
const w1d4 = data.daily.find(d => d.dayNum === 4 || (d.week === 'Week 1' && d.dayOfWeek === 'Thursday'));
if (w1d4) {
  const firstEx = w1d4.exercises[0];
  assert(firstEx && (firstEx.id === 'band-neck-flexion' || firstEx.name.includes('Neck')), "Day 4 first exercise must be Band Neck Flexion & Extension");
}

// Day 5 check (Microcycle Week 1 vs Week 3)
const w1d5 = data.daily.find(d => d.dayNum === 5 || (d.week === 'Week 1' && d.dayOfWeek === 'Friday'));
if (w1d5) {
  const exIds = w1d5.exercises.filter(e => !e.isWarmup).map(e => e.id);
  assert(exIds.includes('db-curl'), "W1D5 (Micro W1) must include db-curl");
  assert(exIds.includes('hammer-curl'), "W1D5 (Micro W1) must include hammer-curl");
}

const w3d5 = data.daily.find(d => d.dayNum === 19 || (d.week === 'Week 3' && d.dayOfWeek === 'Friday'));
if (w3d5) {
  const exIds = w3d5.exercises.filter(e => !e.isWarmup).map(e => e.id);
  assert(!exIds.includes('db-curl'), "W3D5 (Micro W3 Light) must NOT include db-curl");
  assert(exIds.includes('hammer-curl'), "W3D5 (Micro W3 Light) must include hammer-curl");
}

// Check Biceps Microcycle week calculation engine function
assert(engine.getBicepsMicrocycleWeek(1).type === 'heavy', "Week 1 biceps microcycle should be heavy");
assert(engine.getBicepsMicrocycleWeek(2).type === 'heavy', "Week 2 biceps microcycle should be heavy");
assert(engine.getBicepsMicrocycleWeek(3).type === 'light', "Week 3 biceps microcycle should be light");
assert(engine.getBicepsMicrocycleWeek(4).type === 'heavy', "Week 4 biceps microcycle should be heavy");
assert(engine.getBicepsMicrocycleWeek(8).type === 'deload', "Week 8 biceps microcycle should be deload");

// 6. TESTING PROGRESSION DECISION CALCULATIONS
console.log("\n--- TESTING PROGRESSION DECISIONS ---");
const testExWeighted = data.exercises.find(e => e.id === 'db-rdl');
if (testExWeighted) {
  // All above -> increase
  const resAbove = engine.calculateWeightedDecision(testExWeighted, { currentWeightKg: 6 }, [
    { result: 'above', reps: 13 },
    { result: 'above', reps: 13 },
    { result: 'above', reps: 13 }
  ], 1);
  assert(resAbove.action === 'increase' && resAbove.newWeight === 7, "All above should increase weight from 6 to 7");

  // All below -> decrease
  const resBelow = engine.calculateWeightedDecision(testExWeighted, { currentWeightKg: 6 }, [
    { result: 'below', reps: 5 },
    { result: 'below', reps: 5 },
    { result: 'below', reps: 5 }
  ], 1);
  assert(resBelow.action === 'decrease' && resBelow.newWeight === 5, "All below should decrease weight from 6 to 5");

  // Mixed -> maintain
  const resMixed = engine.calculateWeightedDecision(testExWeighted, { currentWeightKg: 6 }, [
    { result: 'in_window', reps: 10 },
    { result: 'above', reps: 13 },
    { result: 'below', reps: 5 }
  ], 1);
  assert(resMixed.action === 'maintain' && resMixed.newWeight === 6, "Mixed should maintain weight at 6");

  // Deload -> maintain
  const resDeload = engine.calculateWeightedDecision(testExWeighted, { currentWeightKg: 6 }, [
    { result: 'above', reps: 13 },
    { result: 'above', reps: 13 }
  ], 8);
  assert(resDeload.action === 'maintain' && resDeload.newWeight === 6, "Deload week should maintain current weight");
}

console.log("\n=== AUDIT SUMMARY ===");
console.log(`Errors found: ${errors.length}`);
errors.forEach((err, idx) => console.log(` [ERROR ${idx + 1}] ${err}`));
console.log(`Warnings found: ${warnings.length}`);
warnings.forEach((warn, idx) => console.log(` [WARN ${idx + 1}] ${warn}`));
