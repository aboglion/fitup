import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';

// Load TRAINING_DATA and ProgressionEngine in global scope
global.window = global;
global.document = {
  querySelector: () => null,
  querySelectorAll: () => [],
  addEventListener: () => {},
  createElement: () => ({ setAttribute: () => {}, appendChild: () => {}, style: {} }),
};

await import('../js/data.js');
await import('../js/progression.js');

const data = global.window.TRAINING_DATA;
const engine = global.window.ProgressionEngine;

test('Program Integrity - Progression Settings & Deload Parameters', () => {
  const expectedLegalWeights = [3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24];
  assert.deepEqual(data.progressionSettings.legalWeights, expectedLegalWeights);

  assert.equal(data.progressionSettings.deloadEveryWeeks, 8);
  assert.equal(data.progressionSettings.deloadWeightReductionKg, 2);
  assert.equal(data.progressionSettings.deloadTimeTargetPercent, 70);
  assert.equal(data.progressionSettings.deloadSetsCeiling, 2);
});

test('Program Integrity - Exercise Rest Periods & Ranges', () => {
  const expectedRestRanges = {
    "goblet-rdl": { base: 105, range: [90, 120] },
    "single-leg-rdl": { base: 75, range: [60, 90] },
    "single-arm-floor-press": { base: 105, range: [90, 120] },
    "pull-up-progression": { base: 105, range: [90, 120] },
    "single-arm-seated-ohp": { base: 82, range: [75, 90] },
    "goblet-bulgarian-split-squat": { base: 82, range: [75, 90] },
    "one-arm-db-row": { base: 82, range: [75, 90] },
    "goblet-reverse-lunge": { base: 75, range: [60, 90] },
    "pistol-squat-progression": { base: 105, range: [90, 120] },
    "db-hip-thrust": { base: 75, range: [60, 90] },
    "trx-row": { base: 75 },
    "push-up-volume": { base: 75, range: [60, 90] },
    "push-up-progression": { base: 75, range: [60, 90] },
    "pike-progression": { base: 75, range: [60, 90] },
    "single-arm-lateral-raise": { base: 75 },
    "db-overhead-triceps-extension": { base: 45 },
    "single-arm-curl": { base: 45 },
    "single-arm-hammer-curl": { base: 45 },
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
        assert.equal(ex.restSeconds || ex.rest, exp.base, `Exercise ${ex.id} base rest mismatch`);
      }
      if (exp.range !== undefined) {
        assert.deepEqual(ex.restRange, exp.range, `Exercise ${ex.id} restRange mismatch`);
      }
    }
  });
});

test('Program Integrity - Lean Mode Mechanics & Protected Compounds', () => {
  const lean = data.progressionSettings.leanMode;
  assert.equal(lean.enabled, true);
  assert.equal(lean.protectCompounds, true);

  const expectedProtected = [
    "goblet-rdl", "single-leg-rdl", "goblet-bulgarian-split-squat", "goblet-reverse-lunge",
    "pistol-squat-progression", "glute-bridge", "suitcase-carry",
    "pike-progression", "single-arm-floor-press", "push-up-progression",
    "single-arm-seated-ohp", "db-overhead-triceps-extension", "diamond-push-up",
    "pull-up-progression", "one-arm-db-row", "single-arm-curl", "single-arm-hammer-curl"
  ];
  expectedProtected.forEach(pEx => {
    assert.ok(lean.protectedExercises.includes(pEx), `Protected exercise ${pEx} missing`);
  });

  assert.equal(lean.pairs.length, 3);
  assert.equal(lean.circuits.length, 1);
  assert.equal(lean.circuits[0].circuitId, 'd1-core-circuit');
  assert.deepEqual(lean.circuits[0].members, ["pallof-press-progression", "dead-bug", "hollow-body-hold"]);
  assert.equal(lean.blocks.length, 1);
  assert.equal(lean.blocks[0].blockId, 'd1-calf-block');
  assert.equal(lean.toggles.length, 1);
});

test('Program Integrity - Day 1 & Day 3 Alternating Toggles', () => {
  // Day 1 (RPG Skill Tree progression)
  const w1d1 = data.daily.find(d => d.week === 'Week 1' && d.dayOfWeek === 'Monday');
  const w18d1 = data.daily.find(d => d.week === 'Week 18' && d.dayOfWeek === 'Monday');

  assert.ok(w1d1, "Week 1 Day 1 missing");
  assert.ok(w18d1, "Week 18 Day 1 missing");

  const w1d1Ids = w1d1.exercises.filter(e => !e.isWarmup).map(e => e.id);
  const w18d1Ids = w18d1.exercises.filter(e => !e.isWarmup).map(e => e.id);

  assert.ok(w1d1Ids.includes('goblet-rdl'), "W1 must include goblet-rdl");
  assert.ok(!w1d1Ids.includes('single-leg-rdl'), "W1 must NOT include single-leg-rdl");
  assert.ok(w18d1Ids.includes('single-leg-rdl'), "W18 must include single-leg-rdl");
  assert.ok(!w18d1Ids.includes('goblet-rdl'), "W18 must NOT include goblet-rdl");

  // Day 3 (Rear delt toggle)
  const w1d3 = data.daily.find(d => d.week === 'Week 1' && d.dayOfWeek === 'Wednesday');
  const w2d3 = data.daily.find(d => d.week === 'Week 2' && d.dayOfWeek === 'Wednesday');

  const w1d3Ids = w1d3.exercises.filter(e => !e.isWarmup).map(e => e.id);
  const w2d3Ids = w2d3.exercises.filter(e => !e.isWarmup).map(e => e.id);

  assert.ok(w1d3Ids.includes('trx-ytw'), "W1D3 odd must include trx-ytw");
  assert.ok(!w1d3Ids.includes('band-pull-apart'), "W1D3 odd main exercises must NOT include band-pull-apart");
  assert.ok(!w2d3Ids.includes('trx-ytw'), "W2D3 even main exercises must NOT include trx-ytw");
  assert.ok(w2d3Ids.includes('band-pull-apart'), "W2D3 even main exercises must include band-pull-apart");
});

test('Program Integrity - Day 4 Cervical Protocol & Day 5 Biceps Microcycle', () => {
  const w1d4 = data.daily.find(d => d.week === 'Week 1' && d.dayOfWeek === 'Thursday');
  assert.ok(w1d4, "Day 4 missing");
  const firstEx = w1d4.exercises[0];
  assert.equal(firstEx.id, 'band-neck-flexion', "Day 4 first exercise must be Band Neck Flexion & Extension");

  // Biceps microcycle (hammer curl unlocks at week 5, week 6 is light week 3)
  const w5d5 = data.daily.find(d => d.week === 'Week 5' && d.dayOfWeek === 'Friday');
  const w6d5 = data.daily.find(d => d.week === 'Week 6' && d.dayOfWeek === 'Friday');

  const w5d5Ids = w5d5.exercises.filter(e => !e.isWarmup).map(e => e.id);
  const w6d5Ids = w6d5.exercises.filter(e => !e.isWarmup).map(e => e.id);

  assert.ok(w5d5Ids.includes('single-arm-curl') && w5d5Ids.includes('single-arm-hammer-curl'), "Micro Heavy week must include both curls");
  assert.ok(!w6d5Ids.includes('single-arm-curl') && w6d5Ids.includes('single-arm-hammer-curl'), "Micro Light week must include single-arm-hammer-curl only");
});

test('Program Integrity - Progression Engine Decisions', () => {
  const testEx = data.exercises.find(e => e.id === 'goblet-rdl');
  assert.ok(testEx);

  const resAbove = engine.calculateWeightedDecision(testEx, { currentWeightKg: 6 }, [
    { result: 'above', reps: 13 },
    { result: 'above', reps: 13 },
    { result: 'above', reps: 13 }
  ], 1);
  assert.equal(resAbove.action, 'increase');
  assert.equal(resAbove.newWeight, 7);

  const resBelow = engine.calculateWeightedDecision(testEx, { currentWeightKg: 6 }, [
    { result: 'below', reps: 5 },
    { result: 'below', reps: 5 },
    { result: 'below', reps: 5 }
  ], 1);
  assert.equal(resBelow.action, 'decrease');
  assert.equal(resBelow.newWeight, 5);

  const resDeload = engine.calculateWeightedDecision(testEx, { currentWeightKg: 6 }, [
    { result: 'above', reps: 13 },
    { result: 'above', reps: 13 }
  ], 8);
  assert.equal(resDeload.action, 'maintain');
  assert.equal(resDeload.newWeight, 6);
});
