import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const progressionCode = fs.readFileSync(path.join(__dirname, '../js/progression.js'), 'utf8');

const window = {};
const evalFunc = new Function('window', progressionCode);
evalFunc(window);

const ProgressionEngine = window.ProgressionEngine;

test('Biceps Microcycle - Week 1 is heavy', () => {
  const cycle = ProgressionEngine.getBicepsMicrocycleWeek(1);
  assert.equal(cycle.type, 'heavy');
  assert.equal(cycle.progressionAllowed, true);
  assert.deepEqual(cycle.exercises, ['db-curl', 'hammer-curl']);
});

test('Biceps Microcycle - Week 2 is heavy', () => {
  const cycle = ProgressionEngine.getBicepsMicrocycleWeek(2);
  assert.equal(cycle.type, 'heavy');
  assert.equal(cycle.progressionAllowed, true);
  assert.deepEqual(cycle.exercises, ['db-curl', 'hammer-curl']);
});

test('Biceps Microcycle - Week 3 is light', () => {
  const cycle = ProgressionEngine.getBicepsMicrocycleWeek(3);
  assert.equal(cycle.type, 'light');
  assert.equal(cycle.progressionAllowed, false);
  assert.deepEqual(cycle.exercises, ['hammer-curl']);
  assert.equal(cycle.sets, 2);
});

test('Biceps Microcycle - Week 4 loops back to heavy', () => {
  const cycle = ProgressionEngine.getBicepsMicrocycleWeek(4);
  assert.equal(cycle.type, 'heavy');
  assert.equal(cycle.progressionAllowed, true);
  assert.deepEqual(cycle.exercises, ['db-curl', 'hammer-curl']);
});

test('Biceps Microcycle - Week 8 is deload', () => {
  const cycle = ProgressionEngine.getBicepsMicrocycleWeek(8);
  assert.equal(cycle.type, 'deload');
  assert.equal(cycle.progressionAllowed, false);
  assert.deepEqual(cycle.exercises, ['hammer-curl']);
  assert.equal(cycle.sets, 1);
});
