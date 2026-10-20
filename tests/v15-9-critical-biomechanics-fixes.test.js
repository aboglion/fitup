import test from 'node:test';
import assert from 'node:assert/strict';

// Load global mocks for browser environment
global.window = global;
global.document = {
  querySelector: () => null,
  querySelectorAll: () => [],
  addEventListener: () => {},
  createElement: () => ({ setAttribute: () => {}, appendChild: () => {}, style: {} })
};

await import('../js/i18n.js');
await import('../js/data.js');
await import('../js/progression.js');
await import('../js/injury-engine.js');
await import('../js/today.js');

const data = global.window.TRAINING_DATA;
const engine = global.window.ProgressionEngine;
const injury = global.window.InjuryEngine;
const today = global.window.TodayPage;

test('v15.9 Fix 1: Lateral Raise Ping-Pong Bug Resolution (10-18 Rep Window & Transition Buffer)', () => {
  const latEx = data.exercises.find(e => e.id === 'single-arm-lateral-raise');
  assert.ok(latEx, 'single-arm-lateral-raise must exist');
  assert.equal(latEx.repWindow, '10-18', 'Rep window must be 10-18');
  assert.equal(latEx.tempo, '2-1-2', 'Tempo must be 2-1-2');

  // Verify Transition Buffer in ProgressionEngine:
  // Trainee at 8kg with sessionsAtWeight = 0, facing 2nd below session (consecutiveBelow = 1)
  // When attemptsAtCurrentWeight <= 1 (session 1-2 at new weight), buffer protects from premature demotion:
  const exState = {
    currentWeightKg: 8,
    sessionsAtWeight: 0,
    attemptsAtCurrentWeight: 1, // 2nd attempt at 8kg
    consecutiveBelow: 1,
    history: []
  };
  const setResults = [
    { reps: 9, result: 'below' },
    { reps: 9, result: 'below' }
  ];

  const decision = engine.calculateWeightedDecision(latEx, exState, setResults, 6);
  assert.equal(decision.action, 'maintain', 'Transition buffer must maintain 8kg instead of premature demotion');
  assert.equal(decision.transitionBufferActive, true, 'transitionBufferActive must be true');
  assert.equal(decision.newWeight, 8, 'Weight must remain at 8kg');

  // Verify Buffer Expiration (Infinite Loop Prevention):
  // When attemptsAtCurrentWeight >= 2 (attempt 3+ at new weight), buffer expires and standard BELOW demotion executes:
  const expiredState = {
    currentWeightKg: 8,
    sessionsAtWeight: 0,
    attemptsAtCurrentWeight: 2, // 3rd attempt at 8kg - grace period expired
    consecutiveBelow: 1,
    history: []
  };
  const expiredDecision = engine.calculateWeightedDecision(latEx, expiredState, setResults, 6);
  assert.equal(expiredDecision.action, 'decrease', 'Buffer must expire after 2 sessions, triggering demotion');
  assert.equal(expiredDecision.newWeight, 6, 'Weight must decrease to 6kg');
  assert.equal(expiredDecision.reason, 'consecutive_below_decrease', 'Reason must be consecutive_below_decrease');
});

test('v15.9 Fix 2: Volume Stepping vs. Arm Block Volume Collision (Suppression Rule)', () => {
  // Mock Progression State where single-arm-lateral-raise is in Volume Stepping (prescribedSets = 3 or 4 > base 2)
  const allStates = {
    'single-arm-lateral-raise': {
      currentWeightKg: 6,
      sessionsAtWeight: 1, // At 6kg, session 2 prescribes 3 sets (stepping up)
      consecutiveBelow: 0
    }
  };

  const res = engine.isArmBlockAllowed({}, 6, [], 'single-arm-lateral-raise', allStates);
  assert.equal(res.active, false, 'Arm Block must be suppressed during Volume Stepping');
  assert.equal(res.reason, 'suppressed_due_to_volume_stepping', 'Reason must indicate volume stepping suppression');
  assert.ok(res.prescribedSets > 2, 'Main exercise prescribed sets must be > base');
});

test('v15.9 Fix 3: Achilles Tendon Collision Resolution (Calf Block on Day 3 & VO2 Max Incline Guidelines)', () => {
  // Calf block moved to Day 3
  const d3 = data.daily.find(d => d.week === 'Week 5' && d.dayOfWeek === 'Wednesday');
  const d3Ids = d3.exercises.map(e => e.id);
  assert.ok(d3Ids.includes('standing-single-leg-calf-raise'), 'Day 3 must include standing calf raise');
  assert.ok(d3Ids.includes('seated-single-leg-calf-raise'), 'Day 3 must include seated calf raise');

  const d5 = data.daily.find(d => d.week === 'Week 5' && d.dayOfWeek === 'Friday');
  const d5Ids = d5.exercises.map(e => e.id);
  assert.ok(!d5Ids.includes('standing-single-leg-calf-raise'), 'Day 5 must NOT include calf raise');
  assert.ok(!d5Ids.includes('seated-single-leg-calf-raise'), 'Day 5 must NOT include calf raise');

  // Lean structure blocks
  const lean = data.progressionSettings.leanMode;
  assert.equal(lean.blocks[0].blockId, 'd3-calf-block', 'Lean block must be d3-calf-block');
  assert.equal(lean.blocks[0].dayIndex, 3, 'Lean block dayIndex must be 3');

  // VO2 Max Norwegian 4x4 note check on daily instance
  const d6 = data.daily.find(d => d.week === 'Week 5' && d.dayOfWeek === 'Saturday');
  const vo2Instance = d6.exercises.find(e => e.id === 'vo2-max-norwegian-4x4');
  assert.ok(vo2Instance, 'VO2 Max instance must exist on Day 6');
  assert.ok(vo2Instance.tempo.includes('1-2%'), 'VO2 Max tempo note must specify 1-2% for running');
  assert.ok(vo2Instance.tempo.includes('4-6%'), 'VO2 Max tempo note must specify 4-6% for walking');
});

test('v15.9 Fix 4: Day 3 Pressing Sequence Bottleneck (Antagonistic Chin-Up at #4)', () => {
  const d3 = data.daily.find(d => d.week === 'Week 5' && d.dayOfWeek === 'Wednesday');
  const mainExs = d3.exercises.filter(e => !e.isWarmup && e.id !== 'micro-mobility-protocol');
  const chinIdx = mainExs.findIndex(e => e.id === 'chin-up' || e.id === 'chin-up-progression');
  const floorIdx = mainExs.findIndex(e => e.id === 'single-arm-floor-press');
  const pushupIdx = mainExs.findIndex(e => e.id === 'push-up-progression' || e.id === 'push-up-bars-progression');

  assert.ok(chinIdx > -1, 'Chin-Up Tree must exist on Day 3');
  assert.ok(floorIdx > -1, 'Floor press must exist on Day 3');
  assert.ok(pushupIdx > -1, 'Push-up must exist on Day 3');

  assert.ok(chinIdx > floorIdx, 'Chin-Up must follow Floor Press');
  assert.ok(chinIdx < pushupIdx, 'Chin-Up must precede Push-Up Tree to act as antagonistic pulling break');
});

test('v15.9 Fix 5: L4-S1 Disc Protection (Contralateral Hand-Supported Single-Leg RDL & Core Cues)', () => {
  const slRdl = data.exercises.find(e => e.id === 'single-leg-rdl');
  assert.ok(slRdl.rule.includes('Contralateral Hand-Supported'), 'Single-Leg RDL rule must mandate Contralateral Hand-Supported execution');

  // Verify Hollow Body Hold and L-Sit in InjuryEngine
  assert.ok(injury.EXERCISE_ADAPTATIONS['Hollow Body Hold'], 'Hollow Body Hold must be mapped in InjuryEngine');
  assert.deepEqual(injury.EXERCISE_ADAPTATIONS['Hollow Body Hold'].joints, ['lower_back'], 'Hollow Body Hold must map to lower_back');
  assert.equal(injury.EXERCISE_ADAPTATIONS['Hollow Body Hold'].injured.substitute, 'Dead Bug', 'Hollow Body Hold must substitute to Dead Bug');

  assert.ok(injury.EXERCISE_ADAPTATIONS['Tuck L-Sit'], 'Tuck L-Sit must be mapped in InjuryEngine');
  assert.equal(injury.EXERCISE_ADAPTATIONS['Tuck L-Sit'].injured.substitute, 'Dead Bug', 'Tuck L-Sit must substitute to Dead Bug');
});

test('v15.9 Fix 6: InjuryEngine Upper-Body Secondary Fallbacks & Volume Consolidation Safety', () => {
  // Verify secondary substitutes exist for upper pressing
  const ohp = injury.EXERCISE_ADAPTATIONS['Single-Arm Seated OHP'];
  assert.equal(ohp.injured.substitute, 'Single-Arm Floor Press');
  assert.equal(ohp.injured.secondarySubstitute, 'Band Pull-Apart');

  const pike = injury.EXERCISE_ADAPTATIONS['Pike Progression'];
  assert.equal(pike.injured.substitute, 'Push-up Bars Progression');
  assert.equal(pike.injured.secondarySubstitute, 'Scapular Push-up');

  const triceps = injury.EXERCISE_ADAPTATIONS['DB Overhead Triceps Extension'];
  assert.equal(triceps.injured.substitute, 'Single-Arm Floor Press');
  assert.equal(triceps.injured.secondarySubstitute, 'Band Pull-Apart');

  // Simulate shoulder injury with Single-Arm Floor Press already in session
  injury.setJointState('shoulder_r', 2);
  const ad = injury.getExerciseAdaptation('Single-Arm Seated OHP', ['Single-Arm Floor Press']);
  assert.equal(ad.substituteName, 'Band Pull-Apart', 'Must fallback to Band Pull-Apart instead of consolidating into Floor Press');
  assert.notEqual(ad.isConsolidated, true, 'Must not consolidate sets onto injured shoulder press');

  injury.resetAllJoints();
});

test('v15.9 Fix 7: Multi-Joint Conflict Resolution (Nordic Curl with Knee & Lower Back Injured)', () => {
  // Knee injured AND lower back injured
  injury.setJointState('knee_r', 2);
  injury.setJointState('lower_back', 2);

  const ad = injury.getExerciseAdaptation('Nordic Curl Progression');
  // Primary substitute is Goblet Romanian Deadlift, but lower_back is injured!
  // It must automatically bypass Goblet Romanian Deadlift and select DB Glute Bridge!
  assert.equal(ad.substituteName, 'DB Glute Bridge', 'Must bypass Goblet RDL and select DB Glute Bridge when lower back is also injured');

  injury.resetAllJoints();
});

test('v15.9 Fix 8: Missing Exercises in InjuryEngine & Arm Block Joint Safety', () => {
  // Chin-Up mapped to shoulder & elbow
  const chin = injury.EXERCISE_ADAPTATIONS['Chin-Up'];
  assert.ok(chin.joints.includes('shoulder_r'), 'Chin-up must monitor shoulder_r');
  assert.ok(chin.joints.includes('elbow_r'), 'Chin-up must monitor elbow_r');
  assert.equal(chin.injured.substitute, 'TRX Row');
  assert.equal(chin.injured.secondarySubstitute, 'Seated Band Row');

  // Dead Hang & Towel Hang
  assert.ok(injury.EXERCISE_ADAPTATIONS['Dead Hang'], 'Dead Hang must be mapped');
  assert.ok(injury.EXERCISE_ADAPTATIONS['Towel Hang'], 'Towel Hang must be mapped');

  // Arm Block suppression on joint sensitivity
  injury.setJointState('shoulder_l', 1);
  const armRes = engine.isArmBlockAllowed({}, 6, [], 'single-arm-lateral-raise');
  assert.equal(armRes.active, false, 'Arm Block must be suppressed when shoulder is sensitive');
  assert.equal(armRes.reason, 'joint_vulnerability_shoulder');

  injury.resetAllJoints();
});

test('v15.9 Fix 9: Nutrition Cycling Combat Refuel Boost & Maintenance Targets', () => {
  // Standard deficit strength day
  const stdStrength = today.getCyclingTargetsForDay({ dayType: 'Strength Push / Upper' });
  assert.equal(stdStrength.targetCalories, 2120);
  assert.equal(stdStrength.targetCarbs, 220);

  // Combat day: +450 kcal and +60g carbs
  const combatDay = today.getCyclingTargetsForDay({ dayType: 'Active Recovery' }, { hasCombat: true });
  assert.equal(combatDay.targetCalories, 1980 + 450); // 2430 kcal
  assert.equal(combatDay.targetCarbs, 185 + 60);       // 245 g
  assert.equal(combatDay.hasCombat, true);
  assert.equal(combatDay.descKey, 'carb_cycling_combat_desc');

  // Maintenance mode targets
  const maintStrength = today.getCyclingTargetsForDay({ dayType: 'Strength Push / Upper' }, { isMaintenance: true });
  assert.equal(maintStrength.targetCalories, 2650);
  assert.equal(maintStrength.targetCarbs, 310);

  const maintRest = today.getCyclingTargetsForDay({ dayType: 'Rest' }, { isMaintenance: true });
  assert.equal(maintRest.targetCalories, 2250);
  assert.equal(maintRest.targetCarbs, 210);
});
