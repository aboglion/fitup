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

test('Biceps Microcycle - Week 1 is HEAVY_PROGRESSIVE', () => {
  const phase = ProgressionEngine.getBicepsMicrocyclePhase(1);
  assert.equal(phase.phase, 'HEAVY_PROGRESSIVE');
  assert.equal(phase.restSeconds, 90);
});

test('Biceps Microcycle - Week 2 is HEAVY_PROGRESSIVE', () => {
  const phase = ProgressionEngine.getBicepsMicrocyclePhase(2);
  assert.equal(phase.phase, 'HEAVY_PROGRESSIVE');
  assert.equal(phase.restSeconds, 90);
});

test('Biceps Microcycle - Week 3 is LIGHT_MYO', () => {
  const phase = ProgressionEngine.getBicepsMicrocyclePhase(3);
  assert.equal(phase.phase, 'LIGHT_MYO');
  assert.equal(phase.restSeconds, 60);
});

test('Biceps Microcycle - Week 4 loops back to HEAVY_PROGRESSIVE', () => {
  const phase = ProgressionEngine.getBicepsMicrocyclePhase(4);
  assert.equal(phase.phase, 'HEAVY_PROGRESSIVE');
});
