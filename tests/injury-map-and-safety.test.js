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

// 2. Load InjuryEngine
const injuryCode = fs.readFileSync(path.join(root, 'js/injury-engine.js'), 'utf8');
const mockStorage = {};
const injuryWindow = {
  localStorage: {
    getItem: (k) => mockStorage[k] || null,
    setItem: (k, v) => { mockStorage[k] = String(v); },
    removeItem: (k) => { delete mockStorage[k]; }
  },
  dispatchEvent: () => {},
  addEventListener: () => {}
};
const evalInjury = new Function('window', 'localStorage', injuryCode);
evalInjury(injuryWindow, injuryWindow.localStorage);
const InjuryEngine = injuryWindow.InjuryEngine;

// 3. Load AnatomyMap
const anatomyCode = fs.readFileSync(path.join(root, 'js/anatomy.js'), 'utf8');
const anatomyWindow = {
  InjuryEngine,
  I18n,
  UI: { showToast: () => {}, showModal: () => {} }
};
const evalAnatomy = new Function('window', 'InjuryEngine', 'I18n', 'UI', 'console', anatomyCode);
evalAnatomy(anatomyWindow, InjuryEngine, I18n, anatomyWindow.UI, console);
const AnatomyMap = anatomyWindow.AnatomyMap;

test('InjuryEngine - Enumerates all 12 critical joints correctly', () => {
  const joints = InjuryEngine.JOINTS;
  const expectedJoints = [
    'knee_r', 'knee_l', 'shoulder_r', 'shoulder_l',
    'elbow_r', 'elbow_l', 'wrist_r', 'wrist_l',
    'lower_back', 'achilles_r', 'achilles_l', 'neck'
  ];

  expectedJoints.forEach(jId => {
    assert.ok(joints[jId], `Joint ${jId} must exist in InjuryEngine.JOINTS`);
    assert.strictEqual(joints[jId].defaultState, 0);
  });
});

test('InjuryEngine - 1-Tap cycle transitions: Normal (0) -> Sensitive (1) -> Injured (2) -> Normal (0)', () => {
  InjuryEngine.resetAllJoints();
  assert.strictEqual(InjuryEngine.getJointState('knee_r'), 0);

  const state1 = InjuryEngine.cycleJointState('knee_r');
  assert.strictEqual(state1, 1, 'First tap should set Sensitive (1)');
  assert.strictEqual(InjuryEngine.getJointState('knee_r'), 1);

  const state2 = InjuryEngine.cycleJointState('knee_r');
  assert.strictEqual(state2, 2, 'Second tap should set Injured (2)');
  assert.strictEqual(InjuryEngine.getJointState('knee_r'), 2);

  const state3 = InjuryEngine.cycleJointState('knee_r');
  assert.strictEqual(state3, 0, 'Third tap should reset to Normal (0)');
  assert.strictEqual(InjuryEngine.getJointState('knee_r'), 0);
});

test('InjuryEngine - Active injury counting and resetAllJoints', () => {
  InjuryEngine.resetAllJoints();
  assert.strictEqual(InjuryEngine.hasActiveInjuries(), false);
  assert.strictEqual(Object.keys(InjuryEngine.getActiveInjuries()).length, 0);

  InjuryEngine.setJointState('knee_r', 1);
  InjuryEngine.setJointState('shoulder_l', 2);

  assert.strictEqual(InjuryEngine.hasActiveInjuries(), true);
  const active = InjuryEngine.getActiveInjuries();
  assert.strictEqual(Object.keys(active).length, 2);
  assert.strictEqual(active.knee_r.state, 1);
  assert.strictEqual(active.shoulder_l.state, 2);

  InjuryEngine.resetAllJoints();
  assert.strictEqual(InjuryEngine.hasActiveInjuries(), false);
  assert.strictEqual(Object.keys(InjuryEngine.getActiveInjuries()).length, 0);
});

test('InjuryEngine - Knee adaptations: Sensitive gives ROM/Tempo cue, Injured gives DB Glute Bridge substitute', () => {
  InjuryEngine.resetAllJoints();

  // Healthy knee -> no adaptation
  const normalAdaptation = InjuryEngine.getExerciseAdaptation('Goblet Bulgarian Split Squat');
  assert.strictEqual(normalAdaptation, null);

  // Sensitive right knee (Grade 1)
  InjuryEngine.setJointState('knee_r', 1);
  const sensitiveBSS = InjuryEngine.getExerciseAdaptation('Goblet Bulgarian Split Squat');
  assert.ok(sensitiveBSS);
  assert.strictEqual(sensitiveBSS.type, 'sensitive');
  assert.strictEqual(sensitiveBSS.substituteName, null);
  assert.strictEqual(sensitiveBSS.tempo, '3-1-1');
  assert.strictEqual(sensitiveBSS.badgeKey, 'injury_badge_knee_rom');

  const sensitiveSquat = InjuryEngine.getExerciseAdaptation('Heels-Elevated Goblet Squat');
  assert.ok(sensitiveSquat);
  assert.strictEqual(sensitiveSquat.type, 'sensitive');

  // Injured right knee (Grade 2)
  InjuryEngine.setJointState('knee_r', 2);
  const injuredBSS = InjuryEngine.getExerciseAdaptation('Goblet Bulgarian Split Squat');
  assert.ok(injuredBSS);
  assert.strictEqual(injuredBSS.type, 'injured');
  assert.strictEqual(injuredBSS.substituteName, 'DB Glute Bridge');
  assert.strictEqual(injuredBSS.badgeKey, 'injury_badge_knee_sub');

  const injuredSquat = InjuryEngine.getExerciseAdaptation('Heels-Elevated Goblet Squat');
  assert.strictEqual(injuredSquat.substituteName, 'DB Glute Bridge');

  const injuredNordic = InjuryEngine.getExerciseAdaptation('Nordic Curl Progression');
  assert.strictEqual(injuredNordic.substituteName, 'Goblet Romanian Deadlift');

  InjuryEngine.resetAllJoints();
});

test('InjuryEngine - Shoulder adaptations: Seated OHP substitutes with Floor Press', () => {
  InjuryEngine.resetAllJoints();
  InjuryEngine.setJointState('shoulder_l', 2);

  const ohp = InjuryEngine.getExerciseAdaptation('Single-Arm Seated OHP');
  assert.ok(ohp);
  assert.strictEqual(ohp.type, 'injured');
  assert.strictEqual(ohp.substituteName, 'Single-Arm Floor Press');

  const lateral = InjuryEngine.getExerciseAdaptation('Single-Arm Lateral Raise');
  assert.ok(lateral);
  assert.strictEqual(lateral.substituteName, 'TRX Face Pull');

  InjuryEngine.resetAllJoints();
});

test('InjuryEngine - Lower back adaptations: RDL substitutes with DB Glute Bridge, Suitcase with Dead Bug', () => {
  InjuryEngine.resetAllJoints();
  InjuryEngine.setJointState('lower_back', 2);

  const rdl = InjuryEngine.getExerciseAdaptation('Goblet Romanian Deadlift');
  assert.ok(rdl);
  assert.strictEqual(rdl.type, 'injured');
  assert.strictEqual(rdl.substituteName, 'DB Glute Bridge');

  const carry = InjuryEngine.getExerciseAdaptation('Suitcase Carry');
  assert.ok(carry);
  assert.strictEqual(carry.type, 'injured');
  assert.strictEqual(carry.substituteName, 'Dead Bug');

  InjuryEngine.resetAllJoints();
});

test('InjuryEngine - Elbow & Wrist adaptations: Overhead Triceps Ext and Pushups substitute safely', () => {
  InjuryEngine.resetAllJoints();

  // Elbow injured
  InjuryEngine.setJointState('elbow_r', 2);
  const triceps = InjuryEngine.getExerciseAdaptation('DB Overhead Triceps Extension');
  assert.ok(triceps);
  assert.strictEqual(triceps.substituteName, 'Single-Arm Floor Press');

  const curl = InjuryEngine.getExerciseAdaptation('Single-Arm Curl');
  assert.ok(curl);
  assert.strictEqual(curl.substituteName, 'Single-Arm Hammer Curl');

  InjuryEngine.resetAllJoints();

  // Wrist injured
  InjuryEngine.setJointState('wrist_l', 2);
  const pushup = InjuryEngine.getExerciseAdaptation('Push-up Bars Progression');
  assert.ok(pushup);
  assert.strictEqual(pushup.substituteName, 'Single-Arm Floor Press');

  InjuryEngine.resetAllJoints();
});

test('AnatomyMap - Dual mode rendering: Muscles mode & Joints mode', () => {
  InjuryEngine.resetAllJoints();
  const mockContainer = { innerHTML: '' };
  const mockMuscleData = { chest: 45, quads: 60 };

  // 1. Muscles view
  AnatomyMap.setView('muscles');
  AnatomyMap.render(mockContainer, mockMuscleData);
  assert.ok(mockContainer.innerHTML.includes('anatomy-view-switcher-bar'));
  assert.ok(mockContainer.innerHTML.includes('חזה') || mockContainer.innerHTML.includes('Chest'));

  // 2. Joints view
  AnatomyMap.setView('joints');
  AnatomyMap.render(mockContainer, mockMuscleData);
  assert.ok(mockContainer.innerHTML.includes('joint-callout'));
  assert.ok(mockContainer.innerHTML.includes('ברך') || mockContainer.innerHTML.includes('Knee'));

  // 3. Mark knee as sensitive and re-render
  InjuryEngine.setJointState('knee_r', 1);
  AnatomyMap.render(mockContainer, mockMuscleData);
  assert.ok(mockContainer.innerHTML.includes('רגישות') || mockContainer.innerHTML.includes('Sensitive'));

  // Reset view back to muscles for clean state
  InjuryEngine.resetAllJoints();
  AnatomyMap.setView('muscles');
});

test('AnatomyMap - showMuscleDetails renders joint protection alert when joint is sensitive', async () => {
  InjuryEngine.resetAllJoints();
  InjuryEngine.setJointState('knee_r', 1);

  let capturedTitle = '';
  let capturedContent = '';
  anatomyWindow.UI.showModal = (title, content) => {
    capturedTitle = title;
    capturedContent = content;
  };

  await AnatomyMap.showMuscleDetails('quads', 'ארבע-ראשי', 75);
  assert.ok(capturedTitle.includes('ארבע-ראשי') || capturedTitle.includes('quads'));
  assert.ok(capturedContent.includes('רגישות מפרקית') || capturedContent.includes('Active Joint Sensitivity') || capturedContent.includes('knee_r'));
  assert.ok(capturedContent.includes('openJointsModal'));

  InjuryEngine.resetAllJoints();
});

test('InjuryEngine - Achilles tendon adaptations: Injured state suspends loaded calf raises to Brisk Walking', () => {
  InjuryEngine.resetAllJoints();
  assert.strictEqual(InjuryEngine.hasInjuredJoints(), false);

  // Achilles sensitive
  InjuryEngine.setJointState('achilles_r', 1);
  const sensitiveCalf = InjuryEngine.getExerciseAdaptation('Standing Single-Leg Calf Raise');
  assert.ok(sensitiveCalf);
  assert.strictEqual(sensitiveCalf.type, 'sensitive');
  assert.strictEqual(sensitiveCalf.badgeKey, 'injury_badge_achilles_rom');

  // Achilles injured: Loaded plantarflexion MUST be suspended (both soleus and gastrocnemius pull via Achilles)
  InjuryEngine.setJointState('achilles_r', 2);
  assert.strictEqual(InjuryEngine.hasInjuredJoints(), true);

  const injuredStandingCalf = InjuryEngine.getExerciseAdaptation('Standing Single-Leg Calf Raise');
  assert.ok(injuredStandingCalf);
  assert.strictEqual(injuredStandingCalf.type, 'injured');
  assert.strictEqual(injuredStandingCalf.substituteName, 'Brisk Walking', 'Standing calf raise must substitute with Brisk Walking, not loaded seated calf raise');

  const injuredSeatedCalf = InjuryEngine.getExerciseAdaptation('Seated Single-Leg Calf Raise');
  assert.ok(injuredSeatedCalf);
  assert.strictEqual(injuredSeatedCalf.type, 'injured');
  assert.strictEqual(injuredSeatedCalf.substituteName, 'Brisk Walking', 'Seated calf raise must also substitute with Brisk Walking to spare Achilles tendon');

  InjuryEngine.resetAllJoints();
  assert.strictEqual(InjuryEngine.hasInjuredJoints(), false);
});

test('PROGRAM_GUIDE.md - Includes Section 1.3 Biomechanical Joint & Injury Engine', () => {
  const guideContent = fs.readFileSync(path.join(root, 'PROGRAM_GUIDE.md'), 'utf8');
  assert.ok(guideContent.includes('### 1.3 Biomechanical Joint & Injury Engine'), 'Must include Section 1.3 header');
  assert.ok(guideContent.includes('Master Biomechanical Substitution Matrix'), 'Must include Master Substitution Matrix');
  assert.ok(guideContent.includes('DB Glute Bridge'), 'Must mention DB Glute Bridge substitute');
  assert.ok(guideContent.includes('24-Hour Pain Rule'), 'Must document 24-Hour Pain Rule');
  assert.ok(guideContent.includes('1-Tap Biomechanical Joint & Injury Engine'), 'Must include Appendix E entry');
  assert.ok(guideContent.includes('1.3.6 Clinical Safety Architecture, Red Flags & Medical Referral Protocol'), 'Must document Section 1.3.6 Clinical Safety');
  assert.ok(!guideContent.includes('quad/hip extension tension with **0 kg patellofemoral shear**'), 'Must not claim quad tension in glute bridge');
  assert.ok(!guideContent.includes('30%–40%'), 'Must not make ungrounded 30%-40% motor unit recruitment claims');
  assert.ok(!guideContent.includes('equivalent to 64 kg'), 'Must not make ungrounded 32kg single leg = 64kg bilateral equivalence claims');
  assert.ok(guideContent.includes('# FitUp Pro v15.9 Accelerated') || guideContent.includes('# FitUp Pro v15.8 Accelerated'), 'Header must be v15.9 or v15.8');
});

test('InjuryEngine & UI Modal - All exercise adaptations have valid cueKey translations and never yield undefined', () => {
  assert.strictEqual(I18n.t(undefined), '');
  assert.strictEqual(I18n.t(null), '');

  const adaptations = InjuryEngine.EXERCISE_ADAPTATIONS;
  assert.ok(Object.keys(adaptations).length > 0);

  ['he', 'en', 'ar'].forEach(lang => {
    I18n.setLanguage(lang);
    for (const [exName, rule] of Object.entries(adaptations)) {
      assert.ok(rule.sensitive && rule.sensitive.cueKey, `${exName} must have sensitive.cueKey`);
      assert.ok(rule.injured && rule.injured.cueKey, `${exName} must have injured.cueKey`);

      const sensitiveText = I18n.t(rule.sensitive.cueKey);
      const injuredText = I18n.t(rule.injured.cueKey);

      assert.notStrictEqual(sensitiveText, undefined);
      assert.notStrictEqual(sensitiveText, 'undefined');
      assert.ok(sensitiveText.length > 0, `${exName} sensitive text in ${lang} must not be empty`);

      assert.notStrictEqual(injuredText, undefined);
      assert.notStrictEqual(injuredText, 'undefined');
      assert.ok(injuredText.length > 0, `${exName} injured text in ${lang} must not be empty`);
    }
  });

  I18n.setLanguage('he');
});

