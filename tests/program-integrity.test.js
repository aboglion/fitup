import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';

// Load TRAINING_DATA and ProgressionEngine in global scope
global.window = global;
global.document = {
  querySelector: () => null,
  querySelectorAll: () => [],
  addEventListener: () => { },
  createElement: () => ({ setAttribute: () => { }, appendChild: () => { }, style: {} }),
};

await import('../js/data.js');
await import('../js/progression.js');

const data = global.window.TRAINING_DATA;
const engine = global.window.ProgressionEngine;

test('Program Integrity - Progression Settings & Deload Parameters', () => {
  // Modular Dumbbells: strictly 2 kg steps from 6 kg to 32 kg
  const expectedLegalWeights = [6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32];
  assert.deepEqual(data.progressionSettings.legalWeights, expectedLegalWeights);

  assert.equal(data.progressionSettings.deloadEveryWeeks, 12);
  assert.equal(data.progressionSettings.deloadWeightReductionKg, 2);
  assert.equal(data.progressionSettings.deloadTimeTargetPercent, 70);
  assert.equal(data.progressionSettings.deloadSetsCeiling, 2);
});

test('Program Integrity - Exercise Rest Periods & Ranges', () => {
  const expectedRestRanges = {
    // v15.7.1: rest micro-optimization 105s -> 90s (adaptive +30s BELOW extension unchanged)
    "goblet-rdl": { base: 90, range: [75, 120] },
    "single-leg-rdl": { base: 75, range: [60, 90] },
    "single-arm-floor-press": { base: 90, range: [75, 105] },
    "pull-up-progression": { base: 90, range: [75, 105] },
    "single-arm-seated-ohp": { base: 75, range: [60, 90] },
    "goblet-bulgarian-split-squat": { base: 82, range: [75, 90] },
    "one-arm-db-row": { base: 75, range: [60, 90] },
    "heels-elevated-goblet-squat": { base: 75, range: [60, 90] },
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
    "goblet-rdl", "single-leg-rdl", "goblet-bulgarian-split-squat", "heels-elevated-goblet-squat",
    "db-glute-bridge", "suitcase-carry",
    "pike-progression", "single-arm-floor-press", "push-up-progression",
    "single-arm-seated-ohp", "db-overhead-triceps-extension", "diamond-push-up",
    "pull-up-progression", "one-arm-db-row", "single-arm-curl", "single-arm-hammer-curl"
  ];
  expectedProtected.forEach(pEx => {
    assert.ok(lean.protectedExercises.includes(pEx), `Protected exercise ${pEx} missing`);
  });

  // v15.7.1: d5-facepull-lateral (TRX Face Pull ↔ Single-Arm Lateral Raise) added
  assert.equal(lean.pairs.length, 4);
  const facepullPair = lean.pairs.find(p => p.pairId === 'd5-facepull-lateral');
  assert.ok(facepullPair, 'd5-facepull-lateral pair must exist');
  assert.equal(facepullPair.restAfterPair, 75);
  assert.equal(facepullPair.dissolveOnDeload, true);
  assert.equal(facepullPair.dissolveIfMemberInactive, true);
  assert.equal(lean.circuits.length, 1);
  assert.equal(lean.circuits[0].circuitId, 'd1-core-circuit');
  assert.deepEqual(lean.circuits[0].members, ["pallof-press-progression", "dead-bug", "hollow-body-hold"]);
  assert.equal(lean.blocks.length, 1);
  assert.equal(lean.blocks[0].blockId, 'd3-calf-block');
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

  // v15.7 Accelerated: 4-week biceps microcycle (3 heavy : 1 light).
  // Week 5 = heavy (position 1), Week 8 = light (position 4).
  const w5d5 = data.daily.find(d => d.week === 'Week 5' && d.dayOfWeek === 'Friday');
  const w8d5 = data.daily.find(d => d.week === 'Week 8' && d.dayOfWeek === 'Friday');

  const w5d5Ids = w5d5.exercises.filter(e => !e.isWarmup).map(e => e.id);
  const w8d5Ids = w8d5.exercises.filter(e => !e.isWarmup).map(e => e.id);

  assert.ok(w5d5Ids.includes('single-arm-curl') && w5d5Ids.includes('single-arm-hammer-curl'), "Micro Heavy week must include both curls");
  assert.ok(!w8d5Ids.includes('single-arm-curl') && w8d5Ids.includes('single-arm-hammer-curl'), "Micro Light week must include single-arm-hammer-curl only");
});

test('Program Integrity - Progression Engine Decisions', () => {
  const testEx = data.exercises.find(e => e.id === 'goblet-rdl');
  assert.ok(testEx);

  const resAbove = engine.calculateWeightedDecision(testEx, { currentWeightKg: 6 }, [
    { result: 'above', reps: 13 },
    { result: 'above', reps: 13 },
    { result: 'above', reps: 13 }
  ], 1);
  const inc = testEx.increment || 2;
  assert.equal(resAbove.action, 'increase');
  assert.equal(resAbove.newWeight, 6 + inc);

  // 1st BELOW session: maintains current weight to protect against fatigue/tempo loss
  const resBelow1 = engine.calculateWeightedDecision(testEx, { currentWeightKg: 8, consecutiveBelow: 0 }, [
    { result: 'below', reps: 5 },
    { result: 'below', reps: 5 },
    { result: 'below', reps: 5 }
  ], 1);
  assert.equal(resBelow1.action, 'maintain');
  assert.equal(resBelow1.newWeight, 8);
  assert.equal(resBelow1.reason, 'first_below_maintain');

  // 2nd consecutive BELOW session: decreases weight by decrement (bounded by minWeight: 6kg)
  const resBelow2 = engine.calculateWeightedDecision(testEx, { currentWeightKg: 8, consecutiveBelow: 1 }, [
    { result: 'below', reps: 5 },
    { result: 'below', reps: 5 },
    { result: 'below', reps: 5 }
  ], 1);
  assert.equal(resBelow2.action, 'decrease');
  assert.equal(resBelow2.newWeight, 6);
  assert.equal(resBelow2.reason, 'consecutive_below_decrease');

  // Decreasing at minWeight (6kg) cannot drop below 6kg handle floor
  const resBelowFloor = engine.calculateWeightedDecision(testEx, { currentWeightKg: 6, consecutiveBelow: 1 }, [
    { result: 'below', reps: 5 },
    { result: 'below', reps: 5 }
  ], 1);
  assert.equal(resBelowFloor.action, 'decrease');
  assert.equal(resBelowFloor.newWeight, 6);

  // v15.7 Accelerated: deloads occur every 12 weeks (week 12 is a deload week)
  const resDeload = engine.calculateWeightedDecision(testEx, { currentWeightKg: 6 }, [
    { result: 'above', reps: 13 },
    { result: 'above', reps: 13 }
  ], 12);
  assert.equal(resDeload.action, 'maintain');
  assert.equal(resDeload.newWeight, 6);
});

test('Program Integrity - Phase 0 Unlock Precedence (Goblet BSS & Single-Leg RDL gates)', () => {
  // Goblet BSS must NOT be unlocked at Week 1 — Phase 0 graduation rules are authoritative.
  const bss = engine.checkUnlockCriteria('goblet-bulgarian-split-squat', {}, 1);
  assert.equal(bss.unlocked, false, 'Goblet BSS must be locked at Week 1 (Phase 0 graduation)');

  // Calendar ceiling: Goblet BSS is unlocked at Week 5 regardless of performance states.
  const bssW5 = engine.checkUnlockCriteria('goblet-bulgarian-split-squat', {}, 5);
  assert.equal(bssW5.unlocked, true, 'Goblet BSS calendar gate = Week 5');

  // Performance acceleration: Goblet BSS unlocks before Week 5 when the prerequisite is met.
  const bssPerf = engine.checkUnlockCriteria('goblet-bulgarian-split-squat', {
    'heels-elevated-goblet-squat': { currentWeightKg: 12 }
  }, 3);
  assert.equal(bssPerf.unlocked, true, 'Goblet BSS performance unlock (Heels-Elevated Squat >= 10kg)');

  // Single-Leg RDL: calendar gate Week 18 (replaces Goblet RDL) — locked before, unlocked from 18.
  const slrEarly = engine.checkUnlockCriteria('single-leg-rdl', {}, 17);
  assert.equal(slrEarly.unlocked, false, 'Single-Leg RDL locked before Week 18');
  const slr18 = engine.checkUnlockCriteria('single-leg-rdl', {}, 18);
  assert.equal(slr18.unlocked, true, 'Single-Leg RDL unlocked at Week 18');

  // Hammer Curl: microcycle participation is only after its Phase 0 unlock.
  const hammer = engine.checkUnlockCriteria('single-arm-hammer-curl', {}, 1);
  assert.equal(hammer.unlocked, false, 'Single-Arm Hammer Curl locked until Single-Arm Curl >= 12 reps');
});

test('Program Integrity - Lean Pair Availability Rule (d5-pushup-curl)', () => {
  const pair = data.progressionSettings.leanMode.pairs.find(p => p.pairId === 'd5-pushup-curl');
  assert.ok(pair, 'd5-pushup-curl pair must exist');

  // Week 4: Push-Up Volume not yet unlocked (no states, before calendar gate) -> pair omitted.
  const w4 = engine.isPairActive(pair, 4, {});
  assert.equal(w4, false, 'd5-pushup-curl must be omitted while Push-Up Volume is locked');

  // Week 5: calendar gate unlocks Push-Up Volume -> pair active (heavy microcycle week).
  const w5 = engine.isPairActive(pair, 5, {});
  assert.equal(w5, true, 'd5-pushup-curl must render when both members are unlocked');

  // Week 4 of the biceps cycle (light) dissolves the pair even when unlocked.
  const lightWeek = engine.isPairActive(pair, 8, {});
  assert.equal(lightWeek, false, 'd5-pushup-curl must dissolve in biceps light week (cycle position 4)');
});

test('Program Integrity - Biceps Microcycle Phase Resolver', () => {
  const heavy = engine.getBicepsMicrocyclePhase(5);
  assert.equal(heavy.type, 'heavy');
  assert.equal(heavy.phase, 'HEAVY_PROG');
  assert.equal(heavy.progressionAllowed, true);

  const light = engine.getBicepsMicrocyclePhase(8);
  assert.equal(light.type, 'light');
  assert.equal(light.phase, 'LIGHT_MYO');
  assert.equal(light.progressionAllowed, false);
  assert.equal(light.sets, 2);

  const deload = engine.getBicepsMicrocyclePhase(12);
  assert.equal(deload.type, 'deload');
  assert.equal(deload.phase, 'DELOAD');
  assert.equal(deload.progressionAllowed, false);
  assert.equal(deload.sets, 1);
});

test('Program Integrity - calculateMuscleProgressions single-workout accuracy', () => {
  const statsPath = new URL('../js/stats.js', import.meta.url);
  const statsCode = fs.readFileSync(statsPath, 'utf8');
  const statsWindow = {
    appCurrentPlanIndex: 0,
    TRAINING_DATA: data
  };
  const evalFunc = new Function('window', 'I18n', 'DB', 'UI', statsCode);
  evalFunc(statsWindow, { t: k => k }, {}, { getLocalDateString: () => '2026-10-11' });

  const StatsPage = statsWindow.StatsPage;
  assert.ok(StatsPage, 'StatsPage must be exported');

  // Case 0: Empty tracking (0 workouts) -> all 15 muscles must be 0%
  const zeroPcts = StatsPage.calculateMuscleProgressions({});
  assert.equal(zeroPcts.obliques, 0);
  assert.equal(zeroPcts.core, 0);
  assert.equal(zeroPcts.chest, 0);
  assert.equal(zeroPcts.lowerBack, 0);

  // Case 1: Only Day 1 completed (1 workout out of 560 days)
  const day1Tracking = {
    0: { dayIndex: 0, completed: true }
  };
  const day1Pcts = StatsPage.calculateMuscleProgressions(day1Tracking);

  // Trained muscles on Day 1 (Legs + Core) should be around 0.5% - 2.0%
  assert.ok(day1Pcts.obliques > 0 && day1Pcts.obliques <= 2.5, `Obliques after 1 workout should be around 1%, got ${day1Pcts.obliques}%`);
  assert.ok(day1Pcts.core > 0 && day1Pcts.core <= 2.5, `Core after 1 workout should be around 1%, got ${day1Pcts.core}%`);
  assert.ok(day1Pcts.hamstrings > 0 && day1Pcts.hamstrings <= 2.5, `Hamstrings after 1 workout should be around 1%, got ${day1Pcts.hamstrings}%`);
  assert.ok(day1Pcts.lowerBack > 0 && day1Pcts.lowerBack <= 2.5, `Lower Back after 1 workout should be around 1.5%, got ${day1Pcts.lowerBack}%`);

  // Untrained muscles on Day 1 (Chest, Shoulders, Biceps, Triceps, Lats, Traps, Neck) must be strictly 0%
  assert.equal(day1Pcts.chest, 0, 'Chest must be 0% on Day 1');
  assert.equal(day1Pcts.shoulders, 0, 'Shoulders must be 0% on Day 1');
  assert.equal(day1Pcts.biceps, 0, 'Biceps must be 0% on Day 1');
  assert.equal(day1Pcts.triceps, 0, 'Triceps must be 0% on Day 1');
  assert.equal(day1Pcts.lats, 0, 'Lats must be 0% on Day 1');
  assert.equal(day1Pcts.traps, 0, 'Traps must be 0% on Day 1');
  assert.equal(day1Pcts.neck, 0, 'Neck must be 0% on Day 1');
});

test('Program Integrity - Balanced Push-Pull (Day 3 Chin-Up, Day 5 Calves, Week 4 Fallback, Age 42)', () => {
  // 1. Day 1 Calf block removed: Day 1 should not have calf raises
  const w1d1 = data.daily.find(d => d.week === 'Week 1' && d.dayOfWeek === 'Monday');
  const w1d1Ids = w1d1.exercises.map(e => e.id);
  assert.ok(!w1d1Ids.includes('standing-single-leg-calf-raise'), 'Day 1 must not include standing-single-leg-calf-raise');
  assert.ok(!w1d1Ids.includes('seated-single-leg-calf-raise'), 'Day 1 must not include seated-single-leg-calf-raise');

  // 2. Day 3 Chin-Up Progression Tree replaced Diamond Push-Up, Triceps Extension is 3 sets
  const w1d3 = data.daily.find(d => d.week === 'Week 1' && d.dayOfWeek === 'Wednesday');
  const w1d3Ids = w1d3.exercises.map(e => e.id);
  assert.ok(w1d3Ids.includes('band-assisted-chin-up') || w1d3Ids.includes('chin-up-progression'), 'Day 3 Week 1 must include band-assisted-chin-up or chin-up-progression');
  assert.ok(!w1d3Ids.includes('diamond-push-up'), 'Day 3 must not include diamond-push-up');

  const w10d3 = data.daily.find(d => d.week === 'Week 10' && d.dayOfWeek === 'Wednesday');
  const w10d3Ids = w10d3.exercises.map(e => e.id);
  assert.ok(w10d3Ids.includes('chin-up'), 'Day 3 Week 10 must unlock full chin-up');

  const w5d3 = data.daily.find(d => d.week === 'Week 5' && d.dayOfWeek === 'Wednesday');
  const tricepsExt = w5d3.exercises.find(e => e.id === 'db-overhead-triceps-extension');
  assert.ok(tricepsExt, 'Day 3 Week 5 must include db-overhead-triceps-extension');
  assert.equal(tricepsExt.sets, '3×10-15', 'Triceps extension on standard week must be 3 sets');

  // 3. Day 3 Calf Block present (v15.9: moved from Day 5 to protect Achilles before Day 6 VO2 Max)
  const w5d3Ids = w5d3.exercises.map(e => e.id);
  assert.ok(w5d3Ids.includes('standing-single-leg-calf-raise'), 'Day 3 must include standing calf raise');
  assert.ok(w5d3Ids.includes('seated-single-leg-calf-raise'), 'Day 3 must include seated calf raise');
  const calfEx = w5d3.exercises.find(e => e.id === 'standing-single-leg-calf-raise');
  assert.equal(calfEx.blockId, 'd3-calf-block', 'Day 3 calf raise must belong to d3-calf-block');

  // 4. Week 4 biceps preservation fallback
  const hammerCatalog = data.exercises.find(e => e.id === 'single-arm-hammer-curl');
  assert.equal(hammerCatalog.fallbackId, 'single-arm-curl', 'Hammer curl must fall back to single-arm-curl');

  // 5. Tanaka formula HR calculation for age 42 & age 43:
  // Age 42: HRmax = 208 - 0.7 * 42 = 178.6 -> 179 BPM
  const hrMax42 = Math.round(208 - (0.7 * 42));
  assert.equal(hrMax42, 179, 'Age 42 HRmax must be 179 BPM');

  // Age 43 (App Default): HRmax = 208 - 0.7 * 43 = 177.9 -> 178 BPM
  // Zone 2 (60-70%): 107 - 125 BPM
  // Zone 5 (85-95%): 151 - 169 BPM
  const hrMax43 = Math.round(208 - (0.7 * 43));
  assert.equal(hrMax43, 178, 'Age 43 HRmax must be 178 BPM');
  const z2Low = Math.round(hrMax43 * 0.60);
  const z2High = Math.round(hrMax43 * 0.70);
  assert.equal(z2Low, 107, 'Zone 2 low must be 107 BPM');
  assert.equal(z2High, 125, 'Zone 2 high must be 125 BPM');
  const z5Low = Math.round(hrMax43 * 0.85);
  const z5High = Math.round(hrMax43 * 0.95);
  assert.equal(z5Low, 151, 'Zone 5 low must be 151 BPM');
  assert.equal(z5High, 169, 'Zone 5 high must be 169 BPM');
});

test('Program Integrity - Locked exercise fallback does not duplicate in same session', () => {
  // Simulate Day 5 Week 1 unlock/fallback pass as performed by today.js
  const d5 = JSON.parse(JSON.stringify(data.daily.find(d => d.week === 'Week 1' && d.dayOfWeek === 'Friday')));
  const weekNum = 1;
  const statesMap = {};

  for (let i = 0; i < d5.exercises.length; i++) {
    let ex = d5.exercises[i];
    let exId = ex.id || engine.findExerciseIdByName(ex.name) || ex.name.toLowerCase().replace(/\s+/g, '-');

    let maxDepth = 5;
    while (maxDepth > 0) {
      const unlockStatus = engine.checkUnlockCriteria(exId, statesMap, weekNum);
      if (!unlockStatus.unlocked) {
        const exDef = engine.getExercise(exId);
        const fallbackId = exDef && exDef.fallbackId !== undefined
          ? exDef.fallbackId
          : (exDef && exDef.unlockCriteria ? exDef.unlockCriteria.exercise : null);
        if (fallbackId) {
          const fallbackDef = engine.getExercise(fallbackId);
          if (fallbackDef) {
            const isAlreadyInSession = d5.exercises.some((other, oIdx) => oIdx !== i && (other.id === fallbackId || other.name === fallbackDef.name));
            if (isAlreadyInSession) {
              d5.exercises.splice(i, 1);
              i--;
              break;
            }
            ex.id = fallbackDef.id;
            ex.name = fallbackDef.name;
            exId = fallbackId;
            maxDepth--;
            continue;
          }
        }
        if (exDef && exDef.fallbackId === null) {
          d5.exercises.splice(i, 1);
          i--;
        }
        break;
      }
      break;
    }
  }

  const curlCount = d5.exercises.filter(e => e.id === 'single-arm-curl').length;
  assert.equal(curlCount, 1, 'Day 5 Week 1 must render exactly one single-arm-curl (no duplicate fallback)');
});
