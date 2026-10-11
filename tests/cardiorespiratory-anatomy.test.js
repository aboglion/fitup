import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.join(__dirname, '..');

// 1. Load I18n
const i18nCode = fs.readFileSync(path.join(root, 'js/i18n.js'), 'utf8');
const i18nWindow = { addEventListener: () => {} };
const i18nDoc = {
  documentElement: { style: { setProperty: () => {} }, setAttribute: () => {} },
  querySelectorAll: () => []
};
const evalI18n = new Function('window', 'document', i18nCode);
evalI18n(i18nWindow, i18nDoc);
const I18n = i18nWindow.I18n;

// 2. Load TRAINING_DATA
const dataCode = fs.readFileSync(path.join(root, 'js/data.js'), 'utf8');
const dataWindow = { addEventListener: () => {} };
const evalData = new Function('window', dataCode);
evalData(dataWindow);
const TRAINING_DATA = dataWindow.TRAINING_DATA;

// 3. Load UI
const uiCode = fs.readFileSync(path.join(root, 'js/ui.js'), 'utf8');
const uiWindow = { TRAINING_DATA, addEventListener: () => {} };
const mockEl = () => ({ addEventListener: () => {}, classList: { add: () => {}, remove: () => {}, contains: () => false }, appendChild: () => {}, style: {}, dataset: {} });
const uiDoc = { getElementById: mockEl, querySelectorAll: () => [], createElement: mockEl };
const evalUI = new Function('window', 'document', 'I18n', 'console', uiCode);
evalUI(uiWindow, uiDoc, I18n, console);
const UI = uiWindow.UI;

// 4. Load StatsPage
const statsCode = fs.readFileSync(path.join(root, 'js/stats.js'), 'utf8');
const statsWindow = { TRAINING_DATA, addEventListener: () => {} };
const evalStats = new Function('window', 'I18n', 'DB', 'UI', 'console', statsCode);
evalStats(statsWindow, I18n, {}, UI, console);
const StatsPage = statsWindow.StatsPage;

// 5. Load AnatomyMap
const anatomyCode = fs.readFileSync(path.join(root, 'js/anatomy.js'), 'utf8');
const anatomyWindow = {};
const evalAnatomy = new Function('window', 'I18n', 'DB', 'UI', 'console', anatomyCode);
evalAnatomy(anatomyWindow, I18n, {}, UI, console);
const AnatomyMap = anatomyWindow.AnatomyMap;

// 6. Load ExercisesPage
const exCode = fs.readFileSync(path.join(root, 'js/exercises.js'), 'utf8');
const exWindow = { TRAINING_DATA, addEventListener: () => {} };
const evalEx = new Function('window', 'I18n', 'DB', 'UI', 'console', exCode);
evalEx(exWindow, I18n, {}, UI, console);
const ExercisesPage = exWindow.ExercisesPage;

test('Cardiorespiratory - Heart and Lungs translations exist symmetrically across EN, HE, AR', () => {
  ['en', 'he', 'ar'].forEach(lang => {
    I18n.setLanguage(lang);
    const heart = I18n.t('muscle_heart');
    const lungs = I18n.t('muscle_lungs');

    assert.ok(heart && heart !== 'muscle_heart', `Heart translation must exist for ${lang}`);
    assert.ok(lungs && lungs !== 'muscle_lungs', `Lungs translation must exist for ${lang}`);
  });
  // Restore Hebrew
  I18n.setLanguage('he');
  assert.equal(I18n.t('muscle_heart'), 'לב (מערכת לב-ריאה)');
  assert.equal(I18n.t('muscle_lungs'), 'ריאות (אוורור ונפח חמצן)');
});

test('Cardiorespiratory - Skill Tree titles and condition fallback translations are localized', () => {
  I18n.setLanguage('he');
  assert.equal(I18n.t('squat_tree'), 'כוח רגליים וסקווט (Squat Tree)');
  assert.equal(I18n.t('quad_focus'), 'מיקוד ארבע-ראשי (Quad Focus)');
  assert.ok(I18n.t('cond_10kg_squat').includes('10'), 'Unlock condition cond_10kg_squat must be translated');
  assert.ok(I18n.t('level_up_condition').includes('תנאי'), 'level_up_condition must be translated');

  I18n.setLanguage('en');
  assert.equal(I18n.t('squat_tree'), 'Leg Strength & Squats (Squat Tree)');
  assert.equal(I18n.t('quad_focus'), 'Quadriceps Focus');
  assert.ok(I18n.t('cond_10kg_squat').includes('10kg'), 'Unlock condition cond_10kg_squat must be translated in EN');
});

test('Cardiorespiratory - AnatomyMap renders front callouts for both Heart and Lungs', () => {
  I18n.setLanguage('he');
  const mockContainer = { innerHTML: '' };
  const mockMuscleData = { heart: 75.5, lungs: 68.2, chest: 50.0 };

  AnatomyMap.render(mockContainer, mockMuscleData);
  assert.ok(mockContainer.innerHTML.includes('לב (מערכת לב-ריאה)'), 'Heart callout must render in AnatomyMap HTML');
  assert.ok(mockContainer.innerHTML.includes('ריאות (אוורור ונפח חמצן)'), 'Lungs callout must render in AnatomyMap HTML');
  assert.ok(mockContainer.innerHTML.includes('75.5%'), 'Heart formatted percentage must render');
  assert.ok(mockContainer.innerHTML.includes('68.2%'), 'Lungs formatted percentage must render');
});

test('Cardiorespiratory - StatsPage calculateMuscleProgressions includes heart and lungs', () => {
  // Empty tracking -> 0%
  const zeroPcts = StatsPage.calculateMuscleProgressions({});
  assert.equal(zeroPcts.heart, 0, 'Heart must be 0% with empty tracking');
  assert.equal(zeroPcts.lungs, 0, 'Lungs must be 0% with empty tracking');

  // Day 2 completed (Cardio / Active Recovery: VO2 Max Norwegian 4x4 or Walking)
  const day2Tracking = {
    1: { dayIndex: 1, completed: true }
  };
  const day2Pcts = StatsPage.calculateMuscleProgressions(day2Tracking);
  assert.ok(day2Pcts.heart > 0, `Day 2 completed should advance heart progress (got ${day2Pcts.heart}%)`);
  assert.ok(day2Pcts.lungs > 0, `Day 2 completed should advance lungs progress (got ${day2Pcts.lungs}%)`);
});

test('Equipment Integrity - Glute Bridge is bodyweight and L-Sit uses parallettes/bars', () => {
  const gluteEquip = UI.getEquipments('Glute Bridge');
  assert.equal(gluteEquip[0].key, 'bodyweight', 'Bodyweight Glute Bridge must have key=bodyweight');

  const dbGluteEquip = UI.getEquipments('DB Glute Bridge');
  assert.equal(dbGluteEquip[0].key, 'db', 'DB Glute Bridge must have key=db');

  const lsitEquip = UI.getEquipments('Tuck L-Sit');
  assert.equal(lsitEquip[0].key, 'bars', 'Tuck L-Sit must have key=bars (parallettes)');
});

test('Asset Integrity - 100% of distinct program exercises have valid GIFs and PNGs on disk', () => {
  const distinct = new Set();
  TRAINING_DATA.daily.forEach(d => (d.exercises || []).forEach(e => distinct.add(e.name)));

  const gifsOnDisk = new Set(fs.readdirSync(path.join(root, 'images/gifs')));
  const pngsOnDisk = new Set(fs.readdirSync(path.join(root, 'images/exercises')));

  distinct.forEach(name => {
    const gifUrl = decodeURIComponent(UI.getGifUrl(name) || '').replace('images/gifs/', '');
    assert.ok(gifsOnDisk.has(gifUrl), `GIF for ${name} must exist on disk (tried: ${gifUrl})`);

    const pngUrl = decodeURIComponent(UI.getImageUrl(name) || '').split('?')[0].replace('images/exercises/', '');
    assert.ok(pngsOnDisk.has(pngUrl), `PNG for ${name} must exist on disk (tried: ${pngUrl})`);
  });
});
