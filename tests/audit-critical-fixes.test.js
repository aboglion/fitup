const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

// Setup headless mock environment
global.window = global;
global.localStorage = {
  _data: {},
  getItem(k) { return this._data[k] || null; },
  setItem(k, v) { this._data[k] = String(v); },
  removeItem(k) { delete this._data[k]; },
  clear() { this._data = {}; }
};

global.CustomEvent = class CustomEvent {
  constructor(name, opts = {}) {
    this.name = name;
    this.detail = opts.detail || {};
  }
};
global.dispatchEvent = () => {};
global.addEventListener = () => {};

// Mock DB
global.DB = {
  _settings: {},
  _states: {},
  _history: [],
  async getSetting(k) { return this._settings[k] || null; },
  async setSetting(k, v) { this._settings[k] = v; },
  async getProgressionState(exId) { return this._states[exId] ? JSON.parse(JSON.stringify(this._states[exId])) : null; },
  async saveProgressionState(state) { this._states[state.exerciseId] = JSON.parse(JSON.stringify(state)); },
  async saveProgressionHistory(entry) { this._history.push(entry); },
  async saveAdaptiveRest() {},
  async getAdaptiveRest() { return null; }
};

// Mock UI & I18n
global.UI = {
  toast() {},
  formatTempo(t) { return t; }
};

// Load required scripts in VM
const jsDir = path.join(__dirname, '..', 'js');
vm.runInThisContext(fs.readFileSync(path.join(jsDir, 'i18n.js'), 'utf8'));
vm.runInThisContext(fs.readFileSync(path.join(jsDir, 'injury-engine.js'), 'utf8'));
vm.runInThisContext(fs.readFileSync(path.join(jsDir, 'progression.js'), 'utf8'));

// ── TEST 1: Deduplication & Volume Consolidation on Day 1 ──
test('Fix 1 - Injury Engine Day 1 Deduplication & Secondary Fallbacks', () => {
  InjuryEngine.resetAllJoints();

  const day1Exercises = [
    { name: 'Goblet Romanian Deadlift', sets: '3×6-12' },
    { name: 'Heels-Elevated Goblet Squat', sets: '3×6-12' },
    { name: 'Goblet Bulgarian Split Squat', sets: '3×6-12' },
    { name: 'DB Glute Bridge', sets: '3×8-15' },
    { name: 'Suitcase Carry', sets: '3×45s' }
  ];

  // 1. Right Knee Injured (🔴)
  InjuryEngine.setJointState('knee_r', 2);

  const adaptedDay = InjuryEngine.adaptDayExercises(day1Exercises);

  // Assert: No multiple duplicate DB Glute Bridge cards
  const gluteBridges = adaptedDay.filter(e => e.name === 'DB Glute Bridge');
  assert.strictEqual(gluteBridges.length, 1, 'Only one DB Glute Bridge card should exist in the workout');

  // Heels-Elevated Goblet Squat should take secondary substitute (Wall Sit)
  const wallSit = adaptedDay.find(e => e.name === 'Wall Sit');
  assert.ok(wallSit, 'Heels-Elevated Goblet Squat should resolve to secondary substitute Wall Sit when Glute Bridge is taken');

  // Goblet Bulgarian Split Squat should take secondary substitute (Single-Leg Glute Bridge)
  const singleLegBridge = adaptedDay.find(e => e.name === 'Single-Leg Glute Bridge');
  assert.ok(singleLegBridge, 'Goblet BSS should resolve to Single-Leg Glute Bridge when primary is occupied');

  // 2. Both Knee and Lower Back Injured
  InjuryEngine.setJointState('lower_back', 2);
  const dualInjuryDay = InjuryEngine.adaptDayExercises(day1Exercises);

  // Goblet RDL should take Dead Bug as secondary substitute since Glute Bridge is already native
  const deadBug = dualInjuryDay.find(e => e.name === 'Dead Bug');
  assert.ok(deadBug, 'Goblet RDL should resolve to Dead Bug when lower back is injured and Glute Bridge is active');

  // Suitcase Carry also resolves to Dead Bug -> triggers volume consolidation into Dead Bug
  const deadBugs = dualInjuryDay.filter(e => e.name === 'Dead Bug');
  assert.strictEqual(deadBugs.length, 1, 'Duplicate Dead Bug substitutions must consolidate into a single card');

  InjuryEngine.resetAllJoints();
});

// ── TEST 2: Sisyphus Bug Fix (Volume Stepping Bridge Fatigue Step-Down & Early Promotion Guard) ──
test('Fix 2 - Volume Stepping Bridge Fatigue Step-Down & Early Promotion Guard', async () => {
  const lateralRaiseEx = {
    id: 'single-arm-lateral-raise',
    name: 'Single-Arm Lateral Raise',
    type: 'weighted',
    category: 'arms',
    startingWeight: 6,
    increment: 2,
    sets: 2,
    windowMin: 12,
    windowMax: 20
  };

  // Trainee is at 6kg, has completed 2 prior sessions (accumulating to 4 sets)
  const state = {
    exerciseId: 'single-arm-lateral-raise',
    currentWeightKg: 6,
    sessionsAtWeight: 2,
    consecutiveBelow: 0
  };

  // Trainee performs 4 sets:
  // Base sets (sets 1 & 2) are IN_WINDOW
  // Bridge sets (sets 3 & 4) experienced fatigue (BELOW)
  const setResults = [
    { result: 'in_window', reps: 15, weightKg: 6 },
    { result: 'in_window', reps: 14, weightKg: 6 },
    { result: 'in_window', reps: 12, weightKg: 6 },
    { result: 'below', reps: 8, weightKg: 6 } // failed on the 4th added set
  ];

  const decision = ProgressionEngine.calculateWeightedDecision(lateralRaiseEx, state, setResults, 3);

  // Must maintain weight and step down targetSets by 1 (4 -> 3 sets), NOT drop to 2 sets
  assert.strictEqual(decision.action, 'maintain');
  assert.strictEqual(decision.reason, 'bridge_fatigue_step_down');
  assert.strictEqual(decision.targetSets, 3, 'Volume should step down from 4 to 3 sets, not crash to 2');
  assert.strictEqual(decision.newSessionsAtWeight, 1, 'Decision must explicitly specify decrementing sessionsAtWeight to 1');

  // Verify commitExerciseProgression updates sessionsAtWeight from 2 down to 1 (not 0!)
  DB._states['single-arm-lateral-raise'] = { ...state };
  window.TRAINING_DATA = { exercises: [lateralRaiseEx] };

  const commitRes = await ProgressionEngine.commitExerciseProgression({
    exerciseId: 'single-arm-lateral-raise',
    exerciseName: 'Single-Arm Lateral Raise',
    dayIndex: 2,
    weekNumber: 3,
    setResults,
    actualReps: 12,
    weightKg: 6
  });

  assert.strictEqual(commitRes.state.sessionsAtWeight, 1, 'sessionsAtWeight should step down from 2 to 1 (prescribing 3 sets next)');
  assert.strictEqual(commitRes.state.consecutiveBelow, 0);

  // Natural Progression Verification after bridge decrement:
  // Next session at sessionsAtWeight = 1 prescribes 3 sets (not 4)
  const nextPrescribed = ProgressionEngine.calculatePrescribedSets(lateralRaiseEx, 6, commitRes.state.sessionsAtWeight);
  assert.strictEqual(nextPrescribed, 3, 'Next session after bridge fatigue must prescribe 3 sets');

  // Trainee reconquers the 3-set session cleanly
  const reconqueredThreeSets = [
    { result: 'in_window', reps: 15, weightKg: 6 },
    { result: 'in_window', reps: 14, weightKg: 6 },
    { result: 'in_window', reps: 12, weightKg: 6 }
  ];
  const step2Res = await ProgressionEngine.commitExerciseProgression({
    exerciseId: 'single-arm-lateral-raise',
    exerciseName: 'Single-Arm Lateral Raise',
    dayIndex: 3,
    weekNumber: 3,
    setResults: reconqueredThreeSets,
    actualReps: 12,
    weightKg: 6
  });
  // Counter advances from 1 -> 2 (NOT promoted to 8kg yet!)
  assert.strictEqual(step2Res.state.currentWeightKg, 6, 'Must remain at 6kg while consolidating 3 sets');
  assert.strictEqual(step2Res.state.sessionsAtWeight, 2, 'Counter advances from 1 to 2');

  // At sessionsAtWeight = 2, the peak bridge (4 sets) is prescribed again!
  const peakPrescribed = ProgressionEngine.calculatePrescribedSets(lateralRaiseEx, 6, step2Res.state.sessionsAtWeight);
  assert.strictEqual(peakPrescribed, 4, 'Trainee is strictly required to face and conquer 4 sets again before 8kg');
});

// ── TEST 3: Single-Leg RDL Starting Weight 50% Derivation (Week 18) ──
test('Fix 3 - Single-Leg RDL safely derives 50% of Goblet RDL weight without mechanical cliff', () => {
  window.TRAINING_DATA = {
    exercises: [
      { id: 'single-leg-rdl', name: 'Single-Leg RDL', type: 'weighted', startingWeight: 8, minWeight: 6, maxWeight: 32, increment: 2 },
      { id: 'goblet-rdl', name: 'Goblet Romanian Deadlift', type: 'weighted', startingWeight: 8, minWeight: 6, maxWeight: 32, increment: 2 }
    ]
  };

  // Case A: 20kg Goblet RDL -> 10kg Single-Leg RDL
  const state20 = ProgressionEngine.createInitialState('single-leg-rdl', {
    'goblet-rdl': { currentWeightKg: 20 }
  });
  assert.strictEqual(state20.currentWeightKg, 10, '20kg bilateral RDL should initialize Single-Leg RDL at 10kg');

  // Case B: 24kg Goblet RDL -> 12kg Single-Leg RDL
  const state24 = ProgressionEngine.createInitialState('single-leg-rdl', {
    'goblet-rdl': { currentWeightKg: 24 }
  });
  assert.strictEqual(state24.currentWeightKg, 12, '24kg bilateral RDL should initialize Single-Leg RDL at 12kg');

  // Case C: 14kg Goblet RDL -> 8kg Single-Leg RDL (rounded to even, minimum 8kg floor)
  const state14 = ProgressionEngine.createInitialState('single-leg-rdl', {
    'goblet-rdl': { currentWeightKg: 14 }
  });
  assert.strictEqual(state14.currentWeightKg, 8, '14kg bilateral RDL should initialize Single-Leg RDL at 8kg floor');
});

// ── TEST 4: Post-Injury Recovery Auto-Deload & Double-Demotion Prevention ──
test('Fix 4 - Post-Injury Auto-Deload on Joint Recovery (>= 14 days in Injured State) with Double-Demotion Prevention', async () => {
  InjuryEngine.resetAllJoints();

  const squatEx = {
    id: 'heels-elevated-goblet-squat',
    name: 'Heels-Elevated Goblet Squat',
    type: 'weighted',
    startingWeight: 8,
    minWeight: 6,
    maxWeight: 32,
    increment: 2
  };

  window.TRAINING_DATA = { exercises: [squatEx] };

  // Trainee had reached 22kg before knee injury
  DB._states['heels-elevated-goblet-squat'] = {
    exerciseId: 'heels-elevated-goblet-squat',
    currentWeightKg: 22,
    sessionsAtWeight: 2,
    consecutiveBelow: 0
  };

  // Knee injured 16 days ago
  const sixteenDaysAgo = new Date(Date.now() - 16 * 24 * 60 * 60 * 1000).toISOString();
  InjuryEngine.setJointState('knee_r', 2, { timestamp: sixteenDaysAgo });

  // Verify joint details record injured duration
  const details = InjuryEngine.getJointDetails('knee_r');
  assert.strictEqual(details.state, 2);
  assert.ok(details.daysInjured >= 15);

  // Transition knee back to Sensitive (1) -> triggers post-injury deload strictly ONCE
  InjuryEngine.setJointState('knee_r', 1);
  if (InjuryEngine.lastRecoveryDeloadPromise) {
    await InjuryEngine.lastRecoveryDeloadPromise;
  }

  // Verify Heels-Elevated Goblet Squat received automatic protective reduction (-4kg from 22kg to 18kg)
  const updatedState1 = await DB.getProgressionState('heels-elevated-goblet-squat');
  assert.strictEqual(updatedState1.currentWeightKg, 18, '22kg squat should safely deload to 18kg upon recovery from >14-day injury');
  assert.strictEqual(updatedState1.sessionsAtWeight, 0);

  // Subsequent transition from Sensitive (1) -> Normal (0):
  // Double-Demotion Prevention: Must NOT deload again! Weight must stay at 18kg.
  InjuryEngine.setJointState('knee_r', 0);
  if (InjuryEngine.lastRecoveryDeloadPromise) {
    await InjuryEngine.lastRecoveryDeloadPromise;
  }

  const updatedState2 = await DB.getProgressionState('heels-elevated-goblet-squat');
  assert.strictEqual(updatedState2.currentWeightKg, 18, 'Subsequent transition from Sensitive to Normal must NOT trigger a second deload');

  InjuryEngine.resetAllJoints();
});

// ── TEST 5: PROGRAM_GUIDE.md Content Verification & Catalog Integrity ──
test('Fix 5 - PROGRAM_GUIDE.md Documentation Integrity for All Fixes & SSOT Catalog', () => {
  const guidePath = path.join(__dirname, '..', 'PROGRAM_GUIDE.md');
  const content = fs.readFileSync(guidePath, 'utf8');

  // Fix 1: Deduplication rule & Secondary Fallbacks
  assert.ok(content.includes('Deduplication & Volume Consolidation Rule'), 'Guide must document Deduplication Rule');
  assert.ok(content.includes('Wall Sit'), 'Guide must document Wall Sit secondary fallback');
  assert.ok(content.includes('Single-Leg Glute Bridge'), 'Guide must document Single-Leg Glute Bridge secondary fallback');

  // Fix 2: Sisyphus bug fix & decrement explanation
  assert.ok(content.includes('Volume Stepping Bridge Fatigue Protection (Sisyphus Bug Fix)'), 'Guide must document Bridge Fatigue Protection');
  assert.ok(content.includes('sessionsAtWeight = Math.max(0, sessionsAtWeight - 1)'), 'Guide must document exact counter decrement');

  // Fix 3: Lean Pairs asymmetric sets & unilateral execution
  assert.ok(content.includes('Asymmetric Set Rule (Volume Stepping in Pairs)'), 'Guide must document Asymmetric Set Rule');
  assert.ok(content.includes('For Lean Pairs: perform Set $N$ of Exercise 1'), 'Guide must clarify Lean Pair execution order');

  // Fix 4: Single-Leg RDL 50% derivation (Harmonized across Sections 1.4, 2.2, and Table D.1)
  assert.ok(content.includes('50% of the achieved Goblet RDL weight'), 'Guide must document 50% Single-Leg RDL derivation');
  assert.ok(content.includes('Starts at 50% Goblet RDL, min 8kg'), 'Table D.1 must document 50% Goblet RDL start for single-leg-rdl');

  // Fix 5: Post-injury auto-deload & single execution guarantee
  assert.ok(content.includes('Post-Injury Load Safe Reset (Auto-Deload on Joint Recovery)'), 'Guide must document Post-Injury Safe Reset');
  assert.ok(content.includes('Single-Execution Guarantee (Prevention of Double-Demotion)'), 'Guide must document Single-Execution Guarantee');

  // Fix 6: Table D.1 formatting sanity — zero corrupted '→\\ge→' strings
  assert.strictEqual(content.includes('→\\ge→'), false, 'Table D.1 must have zero corrupted "→\\ge→" strings');
  assert.ok(content.includes('Squat ≥ 10kg'), 'Table D.1 must contain cleanly formatted ≥ symbols');

  // Catalog Registration: Secondary Fallback exercises must be registered in TRAINING_DATA.exercises
  const dataJsContent = fs.readFileSync(path.join(__dirname, '..', 'js/data.js'), 'utf8');
  assert.ok(dataJsContent.includes('"id": "wall-sit"'), 'data.js must register wall-sit in exercises catalog');
  assert.ok(dataJsContent.includes('"id": "single-leg-glute-bridge"'), 'data.js must register single-leg-glute-bridge in exercises catalog');

  // Appendix D opening line: 61 unique exercises across schedule & catalog progressions
  assert.ok(content.includes('all **61 unique exercises**'), 'Appendix D intro must state 61 unique exercises');
});
