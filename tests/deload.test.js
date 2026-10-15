import test from 'node:test';
import assert from 'node:assert/strict';

function isDeloadWeek(weekNumber) {
  // v15.7 Accelerated: deloads every 12 weeks
  return weekNumber > 0 && weekNumber % 12 === 0;
}

function calculateDeloadSets(standardSets, isDeload) {
  if (!isDeload) return standardSets;
  return Math.min(2, standardSets);
}

function calculateDeloadWeight(weightKg, isDeload) {
  if (!isDeload || !weightKg) return weightKg;
  // Reduce load by 2kg, minimum 3kg
  return Math.max(3, weightKg - 2);
}

test('Deload Engine - Identifies weeks 12, 24, 36 as Deload weeks', () => {
  assert.equal(isDeloadWeek(1), false);
  assert.equal(isDeloadWeek(11), false);
  assert.equal(isDeloadWeek(12), true);
  assert.equal(isDeloadWeek(24), true);
  assert.equal(isDeloadWeek(36), true);
  assert.equal(isDeloadWeek(37), false);
});

test('Deload Engine - Enforces volume ceiling of 2 sets during deload', () => {
  assert.equal(calculateDeloadSets(4, true), 2);
  assert.equal(calculateDeloadSets(3, true), 2);
  assert.equal(calculateDeloadSets(2, true), 2);
  assert.equal(calculateDeloadSets(4, false), 4);
});

test('Deload Engine - Reduces load by 2kg during deload', () => {
  assert.equal(calculateDeloadWeight(12, true), 10);
  assert.equal(calculateDeloadWeight(4, true), 3); // Minimum bound 3kg
  assert.equal(calculateDeloadWeight(12, false), 12);
});

function resolveEffectiveDeload(weekNumber, overrides = {}) {
  const baseIsDeload = isDeloadWeek(weekNumber);
  if (overrides[weekNumber] === 'cancelled') return false;
  if (overrides[weekNumber] === 'postponed') return false;
  if (overrides[weekNumber - 1] === 'postponed') return true;
  return baseIsDeload;
}

test('Deload Overrides - Cancelling Deload week restores standard training mode', () => {
  // Week 12 is standard deload
  assert.equal(resolveEffectiveDeload(12, {}), true);
  // Cancel Week 12
  assert.equal(resolveEffectiveDeload(12, { 12: 'cancelled' }), false);
  // Uncancelled non-deload week remains false
  assert.equal(resolveEffectiveDeload(11, { 12: 'cancelled' }), false);
});

test('Deload Overrides - Postponing Deload week shifts deload to next week', () => {
  const overrides = { 12: 'postponed' };
  // Week 12 becomes non-deload
  assert.equal(resolveEffectiveDeload(12, overrides), false);
  // Week 13 becomes deload
  assert.equal(resolveEffectiveDeload(13, overrides), true);
  // Week 14 remains non-deload
  assert.equal(resolveEffectiveDeload(14, overrides), false);
});

function checkPassiveRest(dayIndex, allTracking) {
  if (!allTracking || !Array.isArray(allTracking) || dayIndex < 7) return false;
  const startIdx = Math.max(0, dayIndex - 7);
  const completedPastWeek = allTracking.filter(t => t && t.dayIndex >= startIdx && t.dayIndex < dayIndex && t.completed);
  return completedPastWeek.length === 0;
}

test('Deload Passive Rest Detection - Detects zero completed workouts in preceding 7 days', () => {
  // DayIndex 77 (start of week 12) with 0 completed workouts in days 70..76
  const inactiveTracking = [
    { dayIndex: 50, completed: true },
    { dayIndex: 77, completed: false }
  ];
  assert.equal(checkPassiveRest(77, inactiveTracking), true);

  // Active tracking: completed workout on day 74
  const activeTracking = [
    { dayIndex: 74, completed: true }
  ];
  assert.equal(checkPassiveRest(77, activeTracking), false);
});

