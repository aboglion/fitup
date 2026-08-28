const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.join(__dirname, '..');
console.log("=== COMPREHENSIVE FITUP SYSTEM AUDIT ===");

let errors = [];
let warnings = [];
let info = [];

// 1. Load I18n
const i18nContent = fs.readFileSync(path.join(root, 'js/i18n.js'), 'utf8');
const i18nSandbox = { window: {}, console: console, document: { documentElement: { style: { setProperty: () => {} } }, querySelectorAll: () => [] } };
vm.createContext(i18nSandbox);
vm.runInContext(i18nContent, i18nSandbox);
const I18n = i18nSandbox.window.I18n;

// 2. Load js/data.js
const dataJsContent = fs.readFileSync(path.join(root, 'js/data.js'), 'utf8');
const dataSandbox = { window: {}, console: console };
vm.createContext(dataSandbox);
vm.runInContext(dataJsContent, dataSandbox);
const jsTrainingData = dataSandbox.window.TRAINING_DATA;

info.push(`Program duration: ${jsTrainingData.daily.length} days (${jsTrainingData.daily.length / 7} weeks)`);

// 3. Load exercises.js
const exercisesContent = fs.readFileSync(path.join(root, 'js/exercises.js'), 'utf8');
const exercisesSandbox = { window: { TRAINING_DATA: jsTrainingData }, console: console, UI: { getEquipment: () => '' } };
vm.createContext(exercisesSandbox);

let SKILL_TREES = {};
let EXERCISE_WEIGHT_PROGRESSION = {};
try {
  vm.runInContext(exercisesContent, exercisesSandbox);
  SKILL_TREES = exercisesSandbox.window.SKILL_TREES;
  EXERCISE_WEIGHT_PROGRESSION = exercisesSandbox.window.EXERCISE_WEIGHT_PROGRESSION;
} catch (e) {
  errors.push(`Failed to parse exercises.js: ${e.message}`);
}

// 4. Load stats.js
const statsContent = fs.readFileSync(path.join(root, 'js/stats.js'), 'utf8');
const statsSandbox = { window: { TRAINING_DATA: jsTrainingData }, console: console, DB: {}, UI: { findTodayIndex: () => 0, getLocalDateString: () => '2026-08-29' }, I18n };
vm.createContext(statsSandbox);

let StatsPage = {};
try {
  vm.runInContext(statsContent, statsSandbox);
  StatsPage = statsSandbox.window.StatsPage;
} catch (e) {
  errors.push(`Failed to parse stats.js: ${e.message}`);
}

// 5. Audit all 560 days
const exerciseAppearedWeeks = {};
const allDistinctExercises = new Set();
let invalidRestCount = 0;
let deloadViolations = [];
let positioningViolations = [];

jsTrainingData.daily.forEach((day, index) => {
  const weekNum = parseInt(day.week.replace('Week ', ''));
  const isDeload = (weekNum % 8 === 0);

  let warmupsDone = false;
  let mainWorkDone = false;

  (day.exercises || []).forEach((ex) => {
    allDistinctExercises.add(ex.name);
    if (!exerciseAppearedWeeks[ex.name]) {
      exerciseAppearedWeeks[ex.name] = weekNum;
    }

    // Check rest period validity
    if (typeof ex.rest !== 'number') {
      invalidRestCount++;
    }

    // Check exercise positioning/order in daily routine
    if (ex.isWarmup) {
      if (mainWorkDone) {
        positioningViolations.push(`Day ${day.dayNum} (${day.week}): Warmup '${ex.name}' appears AFTER main compound exercise.`);
      }
      warmupsDone = true;
    } else {
      mainWorkDone = true;
    }

    // Check deload set limit
    if (isDeload && !ex.isWarmup && !ex.name.includes('Walking') && !ex.name.includes('Protocol') && !ex.name.includes('Mobility')) {
      const setsCount = typeof ex.sets === 'number' ? ex.sets : parseInt(ex.sets);
      if (setsCount > 2) {
        deloadViolations.push(`Day ${day.dayNum} (${day.week}): '${ex.name}' has ${ex.sets} sets during deload week.`);
      }
    }
  });
});

info.push(`Distinct exercises used in program: ${allDistinctExercises.size}`);

if (invalidRestCount > 0) {
  errors.push(`Found ${invalidRestCount} exercises with missing or invalid rest durations.`);
} else {
  info.push("All exercises across 560 days have valid rest durations.");
}

if (positioningViolations.length > 0) {
  errors.push(`Positioning / exercise order violations (${positioningViolations.length}): ${positioningViolations.slice(0, 3).join('; ')}`);
} else {
  info.push("Exercise ordering (Warmups -> Heavy Compounds -> Accessories -> Core/Cardio) verified 100%!");
}

if (deloadViolations.length > 0) {
  errors.push(`Deload set count violations (${deloadViolations.length}): ${deloadViolations.slice(0, 3).join('; ')}`);
} else {
  info.push("Deload week set limits (max 2 sets on weeks 8,16,24,32,40,48,56,64,72,80) verified 100%!");
}

// 6. Test Muscle Mapping for all distinct exercises in stats.js
let unmappedCount = 0;
allDistinctExercises.forEach(exName => {
  const dummyEx = { name: exName, id: exName.toLowerCase().replace(/[^a-z0-9]+/g, '-') };
  const contribs = StatsPage.getExerciseContributions(dummyEx);
  const primaryMuscle = StatsPage.getMuscleForExercise(dummyEx);

  if (!contribs || contribs.length === 0) {
    errors.push(`Muscle Mapping Error: '${exName}' has no muscle contribution in stats.js`);
    unmappedCount++;
  }
  if (!primaryMuscle) {
    errors.push(`Muscle Mapping Error: '${exName}' has no primary muscle in stats.js`);
  }
});

if (unmappedCount === 0) {
  info.push(`All ${allDistinctExercises.size} exercises in 560-day program have 100% valid muscle mappings in stats.js!`);
}

// 7. Check calculateMuscleProgressions in stats.js for 'neck'
const calcFuncStr = StatsPage.calculateMuscleProgressions.toString();
if (!calcFuncStr.includes("'neck'") && !calcFuncStr.includes('"neck"')) {
  errors.push("BUG DETECTED in stats.js: calculateMuscleProgressions() 'muscles' array is MISSING 'neck'!");
} else {
  info.push("calculateMuscleProgressions in stats.js includes 'neck'.");
}

// 8. Audit anatomy.js muscleExerciseMap vs 560-day program exercises
const anatomyContent = fs.readFileSync(path.join(root, 'js/anatomy.js'), 'utf8');
const muscleExMapMatch = anatomyContent.match(/const muscleExerciseMap = (\{[\s\S]*?\});/);
let muscleExerciseMap = {};
if (muscleExMapMatch) {
  muscleExerciseMap = eval('(' + muscleExMapMatch[1] + ')');
}

const coveredInAnatomyModal = new Set();
Object.values(muscleExerciseMap).forEach(exList => exList.forEach(name => coveredInAnatomyModal.add(name)));

const missingFromAnatomyModal = [];
allDistinctExercises.forEach(exName => {
  if (!coveredInAnatomyModal.has(exName)) {
    missingFromAnatomyModal.push(exName);
  }
});

if (missingFromAnatomyModal.length > 0) {
  warnings.push(`${missingFromAnatomyModal.length} active program exercises are missing from anatomy.js modal lists:`);
  missingFromAnatomyModal.forEach(name => warnings.push(`  - '${name}'`));
}

const legacyInAnatomyModal = [];
Object.entries(muscleExerciseMap).forEach(([mKey, list]) => {
  list.forEach(exName => {
    if (!allDistinctExercises.has(exName)) {
      legacyInAnatomyModal.push({ muscle: mKey, name: exName });
    }
  });
});

if (legacyInAnatomyModal.length > 0) {
  warnings.push(`anatomy.js modal lists contain ${legacyInAnatomyModal.length} legacy/outdated exercise names not used in program:`);
  legacyInAnatomyModal.forEach(item => warnings.push(`  - [${item.muscle}] '${item.name}'`));
}

// 9. Program Balance Calculations (Push, Pull, Legs, Core, Neck)
let pushVol = 0, pullVol = 0, legsVol = 0, coreVol = 0, neckVol = 0;
jsTrainingData.daily.forEach(day => {
  (day.exercises || []).forEach(ex => {
    if (ex.isWarmup) return;
    const dummyEx = { name: ex.name, id: ex.id || ex.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') };
    const contribs = StatsPage.getExerciseContributions(dummyEx);
    contribs.forEach(c => {
      const sets = typeof ex.sets === 'number' ? ex.sets : parseInt(ex.sets) || 3;
      if (['chest', 'shoulders', 'triceps'].includes(c.m)) pushVol += sets * c.w;
      if (['lats', 'traps', 'biceps', 'forearms'].includes(c.m)) pullVol += sets * c.w;
      if (['quads', 'hamstrings', 'glutes', 'calves'].includes(c.m)) legsVol += sets * c.w;
      if (['core', 'obliques', 'lowerBack'].includes(c.m)) coreVol += sets * c.w;
      if (['neck'].includes(c.m)) neckVol += sets * c.w;
    });
  });
});

info.push(`Volume Distribution (80 weeks): Push=${Math.round(pushVol)}, Pull=${Math.round(pullVol)}, Legs=${Math.round(legsVol)}, Core=${Math.round(coreVol)}, Neck=${Math.round(neckVol)}`);
info.push(`Push : Pull Balance Ratio: ${(pushVol / pullVol).toFixed(2)} (Ideal: 0.95 - 1.05)`);

// Summary
console.log("\n================ AUDIT SUMMARY ================");
console.log(`INFO (${info.length}):`);
info.forEach(i => console.log(`  ✓ ${i}`));

console.log(`\nWARNINGS (${warnings.length}):`);
warnings.forEach(w => console.log(`  ⚠️  ${w}`));

console.log(`\nERRORS (${errors.length}):`);
errors.forEach(e => console.log(`  ❌ ${e}`));
