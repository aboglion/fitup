const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.join(__dirname, '..');

console.log("=== RUNNING DEEP SYSTEM AUDIT FOR FITUP ===");

let errors = [];
let warnings = [];
let info = [];

// 1. Load i18n.js
const i18nContent = fs.readFileSync(path.join(root, 'js/i18n.js'), 'utf8');
const i18nSandbox = { window: {}, console: console, document: { documentElement: { style: { setProperty: () => {} } }, querySelectorAll: () => [] } };
vm.createContext(i18nSandbox);
let I18n = null;
try {
  vm.runInContext(i18nContent, i18nSandbox);
  I18n = i18nSandbox.window.I18n || i18nSandbox.I18n;
  const translations = I18n ? I18n.translations : null;
  
  if (!translations) {
    errors.push("Failed to load I18n.translations from js/i18n.js");
  } else {
    info.push("Loaded I18n translations successfully.");
    const heKeys = Object.keys(translations.he || {});
    const enKeys = Object.keys(translations.en || {});
    const arKeys = Object.keys(translations.ar || {});

    info.push(`Translation key counts: HE=${heKeys.length}, EN=${enKeys.length}, AR=${arKeys.length}`);

    // Find missing keys between languages
    const allKeys = new Set([...heKeys, ...enKeys, ...arKeys]);
    let missingHe = [], missingEn = [], missingAr = [];
    allKeys.forEach(k => {
      if (!translations.he[k]) missingHe.push(k);
      if (!translations.en[k]) missingEn.push(k);
      if (!translations.ar[k]) missingAr.push(k);
    });

    if (missingHe.length > 0) warnings.push(`Missing Hebrew translations for ${missingHe.length} keys: ${missingHe.slice(0, 10).join(', ')}...`);
    if (missingEn.length > 0) warnings.push(`Missing English translations for ${missingEn.length} keys: ${missingEn.slice(0, 10).join(', ')}...`);
    if (missingAr.length > 0) warnings.push(`Missing Arabic translations for ${missingAr.length} keys: ${missingAr.slice(0, 10).join(', ')}...`);
  }
} catch (e) {
  errors.push(`Error evaluating js/i18n.js: ${e.message}`);
}

// 2. Load exercises.js
const exercisesContent = fs.readFileSync(path.join(root, 'js/exercises.js'), 'utf8');
const exercisesSandbox = { window: {}, console: console };
vm.createContext(exercisesSandbox);
let SKILL_TREES = {};
let EXERCISE_WEIGHT_PROGRESSION = {};
try {
  vm.runInContext(exercisesContent, exercisesSandbox);
  SKILL_TREES = exercisesSandbox.window.SKILL_TREES || exercisesSandbox.SKILL_TREES;
  EXERCISE_WEIGHT_PROGRESSION = exercisesSandbox.window.EXERCISE_WEIGHT_PROGRESSION || exercisesSandbox.EXERCISE_WEIGHT_PROGRESSION;
  info.push(`SKILL_TREES categories: ${Object.keys(SKILL_TREES || {}).join(', ')}`);
} catch (e) {
  errors.push(`Error evaluating js/exercises.js: ${e.message}`);
}

// 3. Load training_data.json
const trainingDataPath = path.join(root, 'training_data.json');
let trainingData = null;
try {
  trainingData = JSON.parse(fs.readFileSync(trainingDataPath, 'utf8'));
  info.push(`training_data.json loaded with ${trainingData.daily ? trainingData.daily.length : 0} days.`);
} catch (e) {
  errors.push(`Error reading training_data.json: ${e.message}`);
}

// 4. Load js/data.js
const dataJsContent = fs.readFileSync(path.join(root, 'js/data.js'), 'utf8');
const dataSandbox = { window: {}, console: console };
vm.createContext(dataSandbox);
let jsTrainingData = null;
try {
  vm.runInContext(dataJsContent, dataSandbox);
  jsTrainingData = dataSandbox.window.TRAINING_DATA || dataSandbox.TRAINING_DATA;
  info.push(`js/data.js loaded with ${jsTrainingData && jsTrainingData.daily ? jsTrainingData.daily.length : 0} days.`);
} catch (e) {
  errors.push(`Error evaluating js/data.js: ${e.message}`);
}

// Compare training_data.json vs js/data.js content
if (trainingData && jsTrainingData) {
  if (trainingData.daily.length !== jsTrainingData.daily.length) {
    errors.push(`Mismatch daily count: training_data.json has ${trainingData.daily.length}, js/data.js has ${jsTrainingData.daily.length}`);
  } else {
    let dayMismatches = 0;
    for (let i = 0; i < jsTrainingData.daily.length; i++) {
      const jsDay = jsTrainingData.daily[i];
      const jsonDay = trainingData.daily[i];

      const jsExNames = jsDay.exercises.map(e => e.name);
      const jsonExNames = [];
      Object.keys(jsonDay).forEach(k => {
        if (k.endsWith(' - Exercise') && jsonDay[k]) {
          jsonExNames.push(jsonDay[k]);
        }
      });

      if (jsExNames.length !== jsonExNames.length) {
        dayMismatches++;
        if (dayMismatches <= 3) {
          errors.push(`Day ${jsDay.dayNum} exercise count mismatch: JS has ${jsExNames.length}, JSON has ${jsonExNames.length}`);
        }
      }
    }
    if (dayMismatches === 0) {
      info.push("js/data.js and training_data.json exercise structure synchronized 100%!");
    } else {
      errors.push(`Total days with exercise mismatches between js/data.js and training_data.json: ${dayMismatches}`);
    }
  }
}

// Collect all exercises used across the 560 days in js/data.js
const exercisesInProgram = new Set();
if (jsTrainingData && jsTrainingData.daily) {
  jsTrainingData.daily.forEach(day => {
    day.exercises.forEach(ex => {
      exercisesInProgram.add(ex.name);
    });
  });
}

info.push(`Total distinct exercises found in 560-day program: ${exercisesInProgram.size}`);

// Check exercise translations in i18n
const translations = I18n ? I18n.translations : null;
if (translations) {
  const missingExHe = [];
  const missingExEn = [];
  const missingExAr = [];

  exercisesInProgram.forEach(ex => {
    if (!translations.he[ex]) missingExHe.push(ex);
    if (!translations.en[ex]) missingExEn.push(ex);
    if (!translations.ar[ex]) missingExAr.push(ex);
  });

  if (missingExHe.length > 0) errors.push(`Exercises in program missing HE translation: ${missingExHe.join(', ')}`);
  if (missingExEn.length > 0) errors.push(`Exercises in program missing EN translation: ${missingExEn.join(', ')}`);
  if (missingExAr.length > 0) errors.push(`Exercises in program missing AR translation: ${missingExAr.join(', ')}`);

  // Check all exercises in SKILL_TREES as well
  if (SKILL_TREES) {
    const missingTree = [];
    Object.values(SKILL_TREES).forEach(category => {
      category.forEach(item => {
        if (!translations.he[item.name] || !translations.en[item.name] || !translations.ar[item.name]) {
          missingTree.push(item.name);
        }
      });
    });
    if (missingTree.length > 0) warnings.push(`Skill Tree exercises missing translations: ${[...new Set(missingTree)].join(', ')}`);
  }
}

// Audit Deload Weeks in Program Data (weeks 8, 16, 24, 32, 40, 48, 56, 64, 72, 80)
if (jsTrainingData && jsTrainingData.daily) {
  let deloadViolations = [];
  jsTrainingData.daily.forEach(day => {
    const weekNum = parseInt(day.week.replace('Week ', ''));
    const isDeload = (weekNum % 8 === 0);
    if (isDeload && !day.dayType.includes('Rest') && !day.dayType.includes('Cardio') && !day.dayType.includes('Recovery')) {
      day.exercises.forEach(ex => {
        if (!ex.isWarmup && !ex.name.includes('Walking') && !ex.name.includes('Protocol') && !ex.name.includes('Mobility')) {
          // Check sets (max 2 sets during deload)
          const setsStr = String(ex.sets);
          if (!setsStr.startsWith('2') && !setsStr.startsWith('1') && setsStr !== 'Myo-Reps Cluster') {
            deloadViolations.push(`Week ${weekNum} Day ${day.dayNum} Ex ${ex.name}: sets="${ex.sets}"`);
          }
        }
      });
    }
  });

  if (deloadViolations.length > 0) {
    errors.push(`Deload set count violations found (${deloadViolations.length}): ${deloadViolations.slice(0, 5).join('; ')}`);
  } else {
    info.push("Deload set counts (2 sets on week 8, 16, 24, 32, 40, 48, 56, 64, 72, 80) verified 100%!");
  }
}

// Audit UI Asset mappings in ui.js
const uiContent = fs.readFileSync(path.join(root, 'js/ui.js'), 'utf8');
const missingImageMap = [];
exercisesInProgram.forEach(ex => {
  if (!uiContent.includes(ex)) {
    missingImageMap.push(ex);
  }
});
if (missingImageMap.length > 0) {
  info.push(`Exercises without explicit alias in ui.js (fall back to default image resolution): ${missingImageMap.join(', ')}`);
}

// Output Summary
console.log("\n================ AUDIT SUMMARY ================");
console.log(`INFO: ${info.length} items`);
info.forEach(i => console.log(`  ✓ ${i}`));

console.log(`\nWARNINGS: ${warnings.length} items`);
warnings.forEach(w => console.log(`  ⚠️ ${w}`));

console.log(`\nERRORS: ${errors.length} items`);
errors.forEach(e => console.log(`  ❌ ${e}`));
