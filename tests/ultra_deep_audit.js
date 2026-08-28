const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.join(__dirname, '..');
console.log("==================================================");
console.log("=== FITUP ULTRA-DEEP 360° SYSTEM INTEGRITY AUDIT ===");
console.log("==================================================");

let errors = [];
let warnings = [];
let info = [];

// ----------------------------------------------------
// 1. ENVIRONMENT SETUP & DEPENDENCY LOADING
// ----------------------------------------------------

const mockElement = () => ({
  addEventListener: () => {},
  classList: { add: () => {}, remove: () => {}, contains: () => false },
  appendChild: () => {},
  style: {},
  dataset: {}
});

// i18n
const i18nContent = fs.readFileSync(path.join(root, 'js/i18n.js'), 'utf8');
const i18nSandbox = { 
  window: { addEventListener: () => {} }, 
  console: console, 
  document: { 
    documentElement: { style: { setProperty: () => {} }, setAttribute: () => {} }, 
    querySelectorAll: () => [],
    getElementById: mockElement
  } 
};
vm.createContext(i18nSandbox);
vm.runInContext(i18nContent, i18nSandbox);
const I18n = i18nSandbox.window.I18n;

// data.js
const dataJsContent = fs.readFileSync(path.join(root, 'js/data.js'), 'utf8');
const dataSandbox = { window: { addEventListener: () => {} }, console: console };
vm.createContext(dataSandbox);
vm.runInContext(dataJsContent, dataSandbox);
const TRAINING_DATA = dataSandbox.window.TRAINING_DATA;

// exercises.js
const exercisesContent = fs.readFileSync(path.join(root, 'js/exercises.js'), 'utf8');
const exercisesSandbox = { window: { TRAINING_DATA, addEventListener: () => {} }, console: console, UI: { getEquipment: () => '' } };
vm.createContext(exercisesSandbox);
vm.runInContext(exercisesContent, exercisesSandbox);
const SKILL_TREES = exercisesSandbox.window.SKILL_TREES;

// stats.js
const statsContent = fs.readFileSync(path.join(root, 'js/stats.js'), 'utf8');
const statsSandbox = { window: { TRAINING_DATA, addEventListener: () => {} }, console: console, DB: {}, UI: { findTodayIndex: () => 0, getLocalDateString: () => '2026-08-29' }, I18n };
vm.createContext(statsSandbox);
vm.runInContext(statsContent, statsSandbox);
const StatsPage = statsSandbox.window.StatsPage;

// progression.js
const progressionContent = fs.readFileSync(path.join(root, 'js/progression.js'), 'utf8');
const progressionSandbox = { window: { TRAINING_DATA, addEventListener: () => {} }, console: console, DB: {}, UI: { toast: () => {} }, I18n };
vm.createContext(progressionSandbox);
vm.runInContext(progressionContent, progressionSandbox);
const ProgressionEngine = progressionSandbox.window.ProgressionEngine;

// ui.js
const uiContent = fs.readFileSync(path.join(root, 'js/ui.js'), 'utf8');
const uiSandbox = { 
  window: { TRAINING_DATA, addEventListener: () => {} }, 
  console: console, 
  document: { 
    getElementById: mockElement, 
    querySelectorAll: () => [], 
    createElement: mockElement
  },
  history: { pushState: () => {}, back: () => {} },
  addEventListener: () => {},
  I18n
};
vm.createContext(uiSandbox);
vm.runInContext(uiContent, uiSandbox);
const UI = uiSandbox.window.UI;

info.push("Loaded core modules: I18n, TRAINING_DATA, SKILL_TREES, StatsPage, ProgressionEngine, UI.");

// Collect distinct exercises from all 560 days
const distinctExercises = new Set();
TRAINING_DATA.daily.forEach(day => {
  (day.exercises || []).forEach(ex => distinctExercises.add(ex.name));
});

// ----------------------------------------------------
// 2. ASSET RESOLUTION AUDIT (PNGs & GIFs)
// ----------------------------------------------------
console.log("\n--- AUDITING ASSET INTEGRITY (GIFs & PNGs) ---");

let missingPngCount = 0;
let missingGifCount = 0;

distinctExercises.forEach(exName => {
  const pngUrl = UI.getImageUrl(exName);
  const gifUrl = UI.getGifUrl(exName);

  const pngRelative = decodeURIComponent(pngUrl);
  const gifRelative = decodeURIComponent(gifUrl);

  const pngPath = path.join(root, pngRelative);
  const gifPath = path.join(root, gifRelative);

  const pngExists = fs.existsSync(pngPath);

  if (!pngExists) {
    const cleanUpper = exName.toUpperCase().replace(/[^A-Z0-9]+/g, ' ').trim();
    const diskFilename = cleanUpper + '.png';
    const altPath = path.join(root, 'images/exercises', diskFilename);
    if (!fs.existsSync(altPath)) {
      errors.push(`Missing PNG asset for exercise: '${exName}' -> expected '${pngRelative}' or '${diskFilename}'`);
      missingPngCount++;
    }
  }

  const cleanUpper = exName.toUpperCase().replace(/[^A-Z0-9]+/g, ' ').trim();
  const gifAlias = uiSandbox.window.EXERCISE_GIF_ALIASES ? uiSandbox.window.EXERCISE_GIF_ALIASES[cleanUpper] : null;
  if (!fs.existsSync(gifPath) && !gifAlias) {
    warnings.push(`No exact GIF asset for exercise: '${exName}' (will fall back to static image/placeholder in UI)`);
    missingGifCount++;
  }
});

if (missingPngCount === 0) {
  info.push(`100% of all ${distinctExercises.size} active exercises have valid PNG image assets on disk!`);
}

// ----------------------------------------------------
// 3. I18N & LOCALIZATION COVERAGE AUDIT
// ----------------------------------------------------
console.log("\n--- AUDITING I18N & LOCALIZATION ---");

const languages = ['he', 'en', 'ar'];
const requiredMuscles = ['chest', 'shoulders', 'triceps', 'lats', 'traps', 'biceps', 'forearms', 'quads', 'hamstrings', 'glutes', 'calves', 'core', 'obliques', 'lowerBack', 'neck'];

languages.forEach(lang => {
  requiredMuscles.forEach(m => {
    const key = 'muscle_' + m;
    const translated = I18n.t(key, lang);
    if (!translated || translated === key) {
      warnings.push(`Missing muscle translation for '${m}' in language '${lang}' (key: '${key}')`);
    }
  });
});

info.push(`I18n translations key counts: HE=${Object.keys(I18n.translations.he || {}).length}, EN=${Object.keys(I18n.translations.en || {}).length}, AR=${Object.keys(I18n.translations.ar || {}).length}`);

// ----------------------------------------------------
// 4. PROGRESSION ENGINE EDGE CASE TESTING
// ----------------------------------------------------
console.log("\n--- TESTING PROGRESSION ENGINE EDGE CASES ---");

const dummyExercise = { id: 'heels-elevated-goblet-squat', startingWeight: 6, minWeight: 3, maxWeight: 32, increment: 1 };

// Test 1: Min Weight Bound (3kg)
const minWeightState = { currentWeightKg: 3 };
const minDec = ProgressionEngine.calculateWeightedDecision(dummyExercise, minWeightState, [{ result: 'below' }], 1);
if (minDec.newWeight < 3) {
  errors.push(`ProgressionEngine Bug: Weight dropped below minimum threshold (3kg -> ${minDec.newWeight}kg)`);
} else {
  info.push("ProgressionEngine minimum weight bound (3kg floor) verified.");
}

// Test 2: Max Weight Bound (32kg)
const maxWeightState = { currentWeightKg: 32 };
const maxDec = ProgressionEngine.calculateWeightedDecision(dummyExercise, maxWeightState, [{ result: 'above' }], 1);
if (maxDec.newWeight > 32) {
  errors.push(`ProgressionEngine Bug: Weight exceeded maximum threshold (32kg -> ${maxDec.newWeight}kg)`);
} else {
  info.push("ProgressionEngine maximum weight bound (32kg ceiling) verified.");
}

// Test 3: Deload Week Weight Maintenance in calculateWeightedDecision
const deloadState = { currentWeightKg: 14 };
const deloadDec = ProgressionEngine.calculateWeightedDecision(dummyExercise, deloadState, [{ result: 'above' }], 8);
if (deloadDec.newWeight !== 14 || deloadDec.action !== 'maintain') {
  errors.push(`ProgressionEngine Bug: Deload week did not maintain weight (expected 14kg, got ${deloadDec.newWeight}kg)`);
} else {
  info.push("ProgressionEngine deload week decision logic (action maintain) verified.");
}

// Test 4: Prescription Deload Reduction (-2kg)
const deloadPrescription = ProgressionEngine.getDisplayPrescription('heels-elevated-goblet-squat', 8, { currentWeightKg: 14 });
if (deloadPrescription && deloadPrescription.targetWeightKg === 12) {
  info.push("ProgressionEngine getDisplayPrescription deload load reduction (14kg -> 12kg) verified.");
} else {
  errors.push(`ProgressionEngine Bug: getDisplayPrescription failed deload load reduction (expected 12kg, got ${deloadPrescription ? deloadPrescription.targetWeightKg : 'null'})`);
}

// ----------------------------------------------------
// 5. HTML PAGE STRUCTURE & SCRIPT INCLUSION AUDIT
// ----------------------------------------------------
console.log("\n--- AUDITING HTML PAGES & SCRIPT INCLUSIONS ---");

const htmlFiles = ['index.html', 'about.html', 'privacy.html', 'terms.html'];
htmlFiles.forEach(file => {
  const filePath = path.join(root, file);
  if (!fs.existsSync(filePath)) return;

  const content = fs.readFileSync(filePath, 'utf8');

  // Check UTF-8 charset
  if (!content.toLowerCase().includes('meta charset="utf-8"') && !content.toLowerCase().includes("meta charset='utf-8'")) {
    warnings.push(`${file} missing UTF-8 meta charset tag.`);
  }

  // Check Viewport
  if (!content.includes('viewport')) {
    warnings.push(`${file} missing viewport meta tag.`);
  }

  // Check Title
  if (!/<title[^>]*>/i.test(content)) {
    errors.push(`${file} missing <title> element.`);
  }
});

info.push(`Audited ${htmlFiles.length} HTML files for structural best practices and meta tags.`);

// ----------------------------------------------------
// 6. EXPORT GUIDE GENERATION TESTING
// ----------------------------------------------------
console.log("\n--- TESTING EXPORT GUIDE GENERATOR ---");

try {
  const exportGuideContent = fs.readFileSync(path.join(root, 'js/export-guide.js'), 'utf8');
  const exportSandbox = { 
    window: { TRAINING_DATA, addEventListener: () => {} }, 
    console: console, 
    I18n,
    document: { createElement: mockElement },
    URL: { createObjectURL: () => 'blob://dummy' }
  };
  vm.createContext(exportSandbox);
  vm.runInContext(exportGuideContent, exportSandbox);

  const exportFunc = exportSandbox.window.exportProgramGuideHTML || exportSandbox.window.ExportGuide?.generateHTML;
  if (typeof exportFunc === 'function') {
    const htmlOutput = exportFunc();
    if (typeof htmlOutput === 'string' && htmlOutput.length > 5000) {
      if (htmlOutput.includes('32kg') && htmlOutput.includes('Zero Decisions')) {
        info.push("exportProgramGuideHTML() generates valid HTML matching v15.6 specs (32kg, Zero Decisions)!");
      } else {
        warnings.push("exportProgramGuideHTML() generated HTML but might be missing updated keywords.");
      }
    } else {
      errors.push("exportProgramGuideHTML() returned empty or truncated string.");
    }
  } else {
    // Check if function exported on exportSandbox.window.exportProgramGuideHTML or similar
    info.push("export-guide.js script evaluated successfully.");
  }
} catch (e) {
  errors.push(`Failed to test export-guide.js: ${e.message}`);
}

// ----------------------------------------------------
// SUMMARY REPORT
// ----------------------------------------------------
console.log("\n==================================================");
console.log("=== ULTRA-DEEP AUDIT RESULTS SUMMARY ===");
console.log("==================================================");
console.log(`INFO (${info.length}):`);
info.forEach(i => console.log(`  ✓ ${i}`));

console.log(`\nWARNINGS (${warnings.length}):`);
warnings.forEach(w => console.log(`  ⚠️  ${w}`));

console.log(`\nERRORS (${errors.length}):`);
errors.forEach(e => console.log(`  ❌ ${e}`));
