import test from 'node:test';
import assert from 'node:assert/strict';

function isDeloadWeek(weekNumber) {
  return weekNumber > 0 && weekNumber % 8 === 0;
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

test('Deload Engine - Identifies week 8, 16, 24 as Deload weeks', () => {
  assert.equal(isDeloadWeek(1), false);
  assert.equal(isDeloadWeek(7), false);
  assert.equal(isDeloadWeek(8), true);
  assert.equal(isDeloadWeek(16), true);
  assert.equal(isDeloadWeek(24), true);
  assert.equal(isDeloadWeek(25), false);
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
