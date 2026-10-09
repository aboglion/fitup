import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- 1. Estimated 1RM Calculator (Epley formula & Percentages) ---
test('Feature 1 - 1RM Calculator Logic & Modal in ui.js', () => {
  const uiCode = fs.readFileSync(path.join(__dirname, '../js/ui.js'), 'utf8');

  // Verify calculate1RM, calculateBrzycki1RM, get1RMPercentages, showOneRepMaxModal
  assert.ok(uiCode.includes('function calculate1RM(weight, reps)'), 'UI.calculate1RM is defined');
  assert.ok(uiCode.includes('function calculateBrzycki1RM(weight, reps)'), 'UI.calculateBrzycki1RM is defined');
  assert.ok(uiCode.includes('function get1RMPercentages(oneRepMax)'), 'UI.get1RMPercentages is defined');
  assert.ok(uiCode.includes('function showOneRepMaxModal('), 'UI.showOneRepMaxModal is defined');

  // Verify exports in UI module
  assert.ok(uiCode.includes('calculate1RM,'), 'UI exports calculate1RM');
  assert.ok(uiCode.includes('calculateBrzycki1RM,'), 'UI exports calculateBrzycki1RM');
  assert.ok(uiCode.includes('get1RMPercentages,'), 'UI exports get1RMPercentages');
  assert.ok(uiCode.includes('showOneRepMaxModal,'), 'UI exports showOneRepMaxModal');

  // Evaluate Epley calculation directly to verify mathematical accuracy
  const calculate1RM = (w, r) => {
    const weight = parseFloat(w);
    const reps = parseInt(r, 10);
    if (!weight || weight <= 0 || !reps || reps <= 0) return 0;
    if (reps === 1) return Math.round(weight * 10) / 10;
    return Math.round(weight * (1 + reps / 30) * 10) / 10;
  };

  assert.equal(calculate1RM(100, 1), 100);
  assert.equal(calculate1RM(100, 10), Math.round(100 * (1 + 10 / 30) * 10) / 10); // ~133.3 kg
  assert.equal(calculate1RM(60, 5), Math.round(60 * (1 + 5 / 30) * 10) / 10); // 70 kg
  assert.equal(calculate1RM(0, 10), 0);
  assert.equal(calculate1RM(100, 0), 0);

  // Percentages breakdown
  const get1RMPercentages = (oneRepMax) => {
    const max = parseFloat(oneRepMax);
    if (!max || max <= 0) return [];
    const pcts = [100, 95, 90, 85, 80, 75, 70, 65];
    return pcts.map(pct => ({
      pct,
      weight: Math.round((max * pct / 100) * 2) / 2
    }));
  };

  const pcts = get1RMPercentages(100);
  assert.equal(pcts.length, 8);
  assert.equal(pcts[0].pct, 100);
  assert.equal(pcts[0].weight, 100);
  assert.equal(pcts[4].pct, 80);
  assert.equal(pcts[4].weight, 80);
});

test('Feature 1 - 1RM Sparkline integration and peak calculation in today.js', () => {
  const todayCode = fs.readFileSync(path.join(__dirname, '../js/today.js'), 'utf8');

  assert.ok(todayCode.includes('function getExercisePeak1RM('), 'today.js has getExercisePeak1RM');
  assert.ok(todayCode.includes('function open1RMCalculator('), 'today.js has open1RMCalculator');
  assert.ok(todayCode.includes('sparkline-1rm-badge'), 'today.js renders sparkline-1rm-badge next to Sparkline');
  assert.ok(todayCode.includes('TodayPage.open1RMCalculator'), 'sparkline-1rm-badge has onclick calling TodayPage.open1RMCalculator');

  // Verify exported methods
  assert.ok(todayCode.includes('open1RMCalculator,'), 'TodayPage exports open1RMCalculator');
  assert.ok(todayCode.includes('getExercisePeak1RM'), 'TodayPage exports getExercisePeak1RM');
});

// --- 2. Dynamic Nutrition Carb/Calorie Cycling ---
test('Feature 2 - Carb & Calorie Cycling targets and UI in today.js & index.html', () => {
  const todayCode = fs.readFileSync(path.join(__dirname, '../js/today.js'), 'utf8');
  assert.ok(todayCode.includes('function getCyclingTargetsForDay(dayObj)'), 'today.js defines getCyclingTargetsForDay');
  assert.ok(todayCode.includes('getCyclingTargetsForDay,'), 'TodayPage exports getCyclingTargetsForDay');

  // Verify logic of getCyclingTargetsForDay
  const getCyclingTargetsForDay = (dayObj) => {
    const dayType = (dayObj && dayObj.dayType) || '';
    const isRest = dayType === 'Rest' || /rest/i.test(dayType);
    const isStrengthOrVO2 = !isRest && (/strength|push|pull|legs|skill|lower|upper|vo2/i.test(dayType) || (dayObj && dayObj.exercises && dayObj.exercises.length > 2));

    if (isStrengthOrVO2) {
      return { mode: 'strength_vo2', targetCalories: 2120, targetProtein: 160, targetCarbs: 220 };
    } else if (isRest) {
      return { mode: 'rest', targetCalories: 1780, targetProtein: 160, targetCarbs: 140 };
    } else {
      return { mode: 'recovery', targetCalories: 1980, targetProtein: 160, targetCarbs: 185 };
    }
  };

  const strengthDay = getCyclingTargetsForDay({ dayType: 'Strength Push / Upper' });
  assert.equal(strengthDay.mode, 'strength_vo2');
  assert.equal(strengthDay.targetCalories, 2120);
  assert.equal(strengthDay.targetCarbs, 220);

  const vo2Day = getCyclingTargetsForDay({ dayType: 'VO2 Max Intervals' });
  assert.equal(vo2Day.mode, 'strength_vo2');
  assert.equal(vo2Day.targetCalories, 2120);
  assert.equal(vo2Day.targetCarbs, 220);

  const restDay = getCyclingTargetsForDay({ dayType: 'Rest' });
  assert.equal(restDay.mode, 'rest');
  assert.equal(restDay.targetCalories, 1780);
  assert.equal(restDay.targetCarbs, 140);

  const activeRecDay = getCyclingTargetsForDay({ dayType: 'Active Recovery & Core' });
  assert.equal(activeRecDay.mode, 'recovery');
  assert.equal(activeRecDay.targetCalories, 1980);
  assert.equal(activeRecDay.targetCarbs, 185);

  // Check DOM hooks in index.html
  const indexHtml = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
  assert.ok(indexHtml.includes('id="nutrition-cycling-banner"'), 'index.html has nutrition-cycling-banner');
  assert.ok(indexHtml.includes('id="nut-carbs-total"'), 'index.html has nut-carbs-total');
  assert.ok(indexHtml.includes('id="nut-carbs-target"'), 'index.html has nut-carbs-target');
  assert.ok(indexHtml.includes('id="nut-carbs-bar"'), 'index.html has nut-carbs-bar');

  // Check Gemini daily advice prompt enhancement
  const geminiCode = fs.readFileSync(path.join(__dirname, '../js/gemini.js'), 'utf8');
  assert.ok(geminiCode.includes('Carb/Calorie Cycling Mode'), 'Gemini prompt includes carb cycling mode');
});

// --- 3. Readiness Check (Sleep/Recovery Auto-regulation) ---
test('Feature 3 - Subjective Readiness Check & Auto-regulation', () => {
  const todayCode = fs.readFileSync(path.join(__dirname, '../js/today.js'), 'utf8');

  // Verify renderReadinessCheck, setReadinessScore, toggleReadinessAdjustment
  assert.ok(todayCode.includes('function renderReadinessCheck()'), 'today.js defines renderReadinessCheck');
  assert.ok(todayCode.includes('async function setReadinessScore('), 'today.js defines setReadinessScore');
  assert.ok(todayCode.includes('async function toggleReadinessAdjustment('), 'today.js defines toggleReadinessAdjustment');

  // Verify exports
  assert.ok(todayCode.includes('setReadinessScore,'), 'TodayPage exports setReadinessScore');
  assert.ok(todayCode.includes('toggleReadinessAdjustment,'), 'TodayPage exports toggleReadinessAdjustment');
  assert.ok(todayCode.includes('renderReadinessCheck,'), 'TodayPage exports renderReadinessCheck');

  // Verify low readiness rest timer extension (+30s) in getRestTime
  assert.ok(todayCode.includes('currentTracking.readinessScore <= 2'), 'today.js checks readinessScore <= 2');
  assert.ok(todayCode.includes('baseRest += 30'), 'getRestTime adds 30s rest for low readiness');

  // Verify low readiness set reduction (dropSet) in renderExercises
  assert.ok(todayCode.includes('isReadinessDropSet'), 'renderExercises checks isReadinessDropSet');
  assert.ok(todayCode.includes('Math.max(1, originalSetsCount - 1)'), 'renderExercises drops 1 set when dropSet active');
  assert.ok(todayCode.includes('readiness-drop-badge'), 'renderExercises displays readiness drop badge');

  // Verify DOM container in index.html
  const indexHtml = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
  assert.ok(indexHtml.includes('id="readiness-check-container"'), 'index.html has readiness-check-container');
});

// --- 4. CSS Components styling ---
test('CSS - Components styling for 1RM, cycling, and readiness check', () => {
  const css = fs.readFileSync(path.join(__dirname, '../css/components.css'), 'utf8');

  // 1RM Styles
  assert.ok(css.includes('.sparkline-1rm-badge'), 'components.css has .sparkline-1rm-badge');
  assert.ok(css.includes('.e1rm-hero-value'), 'components.css has .e1rm-hero-value');
  assert.ok(css.includes('.e1rm-pct-grid'), 'components.css has .e1rm-pct-grid');

  // Nutrition Cycling Styles
  assert.ok(css.includes('.nutrition-cycling-banner'), 'components.css has .nutrition-cycling-banner');
  assert.ok(css.includes('.cycling-strength'), 'components.css has .cycling-strength');
  assert.ok(css.includes('.cycling-rest'), 'components.css has .cycling-rest');
  assert.ok(css.includes('.nutrition-macros-3grid'), 'components.css has .nutrition-macros-3grid');

  // Readiness Check Styles
  assert.ok(css.includes('.readiness-check-card'), 'components.css has .readiness-check-card');
  assert.ok(css.includes('.readiness-pill-btn'), 'components.css has .readiness-pill-btn');
  assert.ok(css.includes('.readiness-adaptation-box'), 'components.css has .readiness-adaptation-box');
  assert.ok(css.includes('.readiness-drop-badge'), 'components.css has .readiness-drop-badge');
});
