import test from 'node:test';
import assert from 'node:assert/strict';

// Load global mocks for browser environment
global.window = global;
global.document = {
  querySelector: () => null,
  querySelectorAll: () => [],
  getElementById: () => null,
  addEventListener: () => {},
  createElement: () => ({ setAttribute: () => {}, appendChild: () => {}, style: {} })
};

await import('../js/i18n.js');
await import('../js/data.js');
await import('../js/progression.js');
await import('../js/today.js');

const I18n = global.window.I18n;
const TodayPage = global.window.TodayPage;

test('Swap Recommendation Engine - evaluateSwapCandidate is exported and callable', () => {
  assert.equal(typeof TodayPage.evaluateSwapCandidate, 'function', 'evaluateSwapCandidate must be a function');
});

test('Swap Recommendation Engine - Postponing Wednesday (Push) to Thursday (Active Recovery) is Highly Recommended (tier: best)', () => {
  // Mock standard week:
  // Day 0 (Sun): Legs + Core
  // Day 1 (Mon): Zone 2 Cardio
  // Day 2 (Tue): Rest
  // Day 3 (Wed): Push + Skill
  // Day 4 (Thu): Active Recovery
  // Day 5 (Fri): Pull + Grip
  // Day 6 (Sat): VO2 Max
  // Day 7 (Sun of next week): Legs + Core
  const mockPlanDays = [
    { dayIndex: 0, dayOfWeek: 'ראשון', dayType: 'Legs + Core', week: 1 },
    { dayIndex: 1, dayOfWeek: 'שני', dayType: 'Zone 2 Cardio', week: 1 },
    { dayIndex: 2, dayOfWeek: 'שלישי', dayType: 'Rest', week: 1 },
    { dayIndex: 3, dayOfWeek: 'רביעי', dayType: 'Push + Skill', week: 1 },
    { dayIndex: 4, dayOfWeek: 'חמישי', dayType: 'Active Recovery', week: 1 },
    { dayIndex: 5, dayOfWeek: 'שישי', dayType: 'Pull + Grip', week: 1 },
    { dayIndex: 6, dayOfWeek: 'שבת', dayType: 'VO2 Max', week: 1 },
    { dayIndex: 7, dayOfWeek: 'ראשון', dayType: 'Legs + Core', week: 2 }
  ];

  // Evaluate swapping Wednesday (idx 3) with Thursday (idx 4)
  const evalThu = TodayPage.evaluateSwapCandidate(3, 4, mockPlanDays);
  assert.equal(evalThu.tier, 'best', 'Swapping to Thursday should be tier: best');
  assert.ok(evalThu.score >= 80, `Score should be >= 80, got ${evalThu.score}`);
  assert.ok(evalThu.reasons.some(r => r.key === 'swap_reason_clean_rest_shift'), 'Must contain clean rest shift reason');
  assert.ok(evalThu.reasons.some(r => r.key === 'swap_reason_minimal_shift'), 'Must contain minimal shift reason');
});

test('Swap Recommendation Engine - Postponing Wednesday (Push) to Saturday (VO2 Max) triggers Caution (tier: caution)', () => {
  const mockPlanDays = [
    { dayIndex: 0, dayOfWeek: 'ראשון', dayType: 'Legs + Core', week: 1 },
    { dayIndex: 1, dayOfWeek: 'שני', dayType: 'Zone 2 Cardio', week: 1 },
    { dayIndex: 2, dayOfWeek: 'שלישי', dayType: 'Rest', week: 1 },
    { dayIndex: 3, dayOfWeek: 'רביעי', dayType: 'Push + Skill', week: 1 },
    { dayIndex: 4, dayOfWeek: 'חמישי', dayType: 'Active Recovery', week: 1 },
    { dayIndex: 5, dayOfWeek: 'שישי', dayType: 'Pull + Grip', week: 1 },
    { dayIndex: 6, dayOfWeek: 'שבת', dayType: 'VO2 Max', week: 1 },
    { dayIndex: 7, dayOfWeek: 'ראשון', dayType: 'Legs + Core', week: 2 }
  ];

  // Evaluate swapping Wednesday (idx 3) with Saturday (idx 6)
  // Simulated week:
  // Day 5: Pull + Grip (Strength)
  // Day 6: Push + Skill (Strength)
  // Day 7: Legs + Core (Strength)
  // Result: 3 consecutive strength days!
  const evalSat = TodayPage.evaluateSwapCandidate(3, 6, mockPlanDays);
  assert.equal(evalSat.tier, 'caution', 'Swapping to Saturday should be tier: caution due to 3 consecutive strength days');
  assert.ok(evalSat.score < 55, `Score should be < 55, got ${evalSat.score}`);
  assert.ok(evalSat.reasons.some(r => r.key === 'swap_reason_consecutive_3'), 'Must contain 3 consecutive strength days warning');
});

test('Swap Recommendation Engine - Push directly before VO2 Max flags Achilles tendon strain risk', () => {
  const mockPlanDays = [
    { dayIndex: 0, dayOfWeek: 'ראשון', dayType: 'Legs + Core', week: 1 },
    { dayIndex: 1, dayOfWeek: 'שני', dayType: 'Zone 2 Cardio', week: 1 },
    { dayIndex: 2, dayOfWeek: 'שלישי', dayType: 'Rest', week: 1 },
    { dayIndex: 3, dayOfWeek: 'רביעי', dayType: 'Push + Skill', week: 1 },
    { dayIndex: 4, dayOfWeek: 'חמישי', dayType: 'Active Recovery', week: 1 },
    { dayIndex: 5, dayOfWeek: 'שישי', dayType: 'Pull + Grip', week: 1 },
    { dayIndex: 6, dayOfWeek: 'שבת', dayType: 'VO2 Max', week: 1 },
    { dayIndex: 7, dayOfWeek: 'ראשון', dayType: 'Rest', week: 2 }
  ];

  // Swapping Wednesday (idx 3) with Friday (idx 5) places Push on Friday, immediately before Saturday VO2 Max!
  const evalFri = TodayPage.evaluateSwapCandidate(3, 5, mockPlanDays);
  assert.ok(evalFri.reasons.some(r => r.key === 'swap_reason_achilles_risk'), 'Must flag Achilles tendon risk for Push before VO2 Max');
});

test('Swap Recommendation Engine - Translations exist symmetrically across all 3 languages', () => {
  const requiredKeys = [
    'swap_rec_best',
    'swap_rec_viable',
    'swap_rec_caution',
    'swap_reason_ideal_spacing',
    'swap_reason_consecutive_3',
    'swap_reason_consecutive_2',
    'swap_reason_achilles_risk',
    'swap_reason_legs_after_vo2',
    'swap_reason_clean_rest_shift',
    'swap_reason_minimal_shift',
    'swap_reason_combat_clash',
    'swap_modal_subtitle'
  ];

  for (const k of requiredKeys) {
    assert.ok(I18n.translations.en[k], `Missing EN key: ${k}`);
    assert.ok(I18n.translations.he[k], `Missing HE key: ${k}`);
    assert.ok(I18n.translations.ar[k], `Missing AR key: ${k}`);
  }
});

test('Swap Targets Filter - Strictly upcoming days in the week (no backward swaps to earlier days)', () => {
  // When on Wednesday (idx 3 in week 1, or idx 66 in week 10), Sunday (0), Monday (1), Tuesday (2) must be excluded.
  const weekDays = [
    { dayIndex: 0, dayOfWeek: 'ראשון', dayType: 'Legs + Core', week: 1 },
    { dayIndex: 1, dayOfWeek: 'שני', dayType: 'Zone 2 Cardio', week: 1 },
    { dayIndex: 2, dayOfWeek: 'שלישי', dayType: 'Rest', week: 1 },
    { dayIndex: 3, dayOfWeek: 'רביעי', dayType: 'Push + Skill', week: 1 },
    { dayIndex: 4, dayOfWeek: 'חמישי', dayType: 'Active Recovery', week: 1 },
    { dayIndex: 5, dayOfWeek: 'שישי', dayType: 'Pull + Grip', week: 1 },
    { dayIndex: 6, dayOfWeek: 'שבת', dayType: 'VO2 Max', week: 1 }
  ];

  const currentDayIndex = 3; // Wednesday
  const realTodayIndex = 0; // Even if previewing with realToday in the past

  const validTargets = weekDays.filter(day => {
    // Strictly forward in time
    if (day.dayIndex <= currentDayIndex) return false;
    if (realTodayIndex >= 0 && day.dayIndex < realTodayIndex) return false;
    return true;
  });

  assert.equal(validTargets.length, 3, 'Only Thursday, Friday, Saturday should be valid swap targets');
  assert.deepEqual(validTargets.map(d => d.dayIndex), [4, 5, 6], 'Target indices must be strictly upcoming');
});

test('Swap Recommendation Engine - Postponement reason only applies forward (targetIdx === currIdx + 1), never backward', () => {
  const planDays = [
    { dayIndex: 0, dayOfWeek: 'ראשון', dayType: 'Legs + Core', week: 1 },
    { dayIndex: 1, dayOfWeek: 'שני', dayType: 'Zone 2 Cardio', week: 1 },
    { dayIndex: 2, dayOfWeek: 'שלישי', dayType: 'Push + Skill', week: 1 },
    { dayIndex: 3, dayOfWeek: 'רביעי', dayType: 'Active Recovery', week: 1 },
    { dayIndex: 4, dayOfWeek: 'חמישי', dayType: 'Pull + Grip', week: 1 },
    { dayIndex: 5, dayOfWeek: 'שישי', dayType: 'Zone 2 Cardio', week: 1 },
    { dayIndex: 6, dayOfWeek: 'שבת', dayType: 'Rest', week: 1 }
  ];

  // Moving Wednesday (idx 3) to Thursday (idx 4) is a 1-day postponement
  const evalForward = TodayPage.evaluateSwapCandidate(3, 4, planDays);
  assert.ok(evalForward.reasons.some(r => r.key === 'swap_reason_minimal_shift'), 'Next day must have minimal shift reason');

  // Moving Wednesday (idx 3) backwards to Tuesday (idx 2) is NOT a postponement
  const evalBackward = TodayPage.evaluateSwapCandidate(3, 2, planDays);
  assert.ok(!evalBackward.reasons.some(r => r.key === 'swap_reason_minimal_shift'), 'Backward day must NEVER have minimal shift reason');
});


