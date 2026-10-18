const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.join(__dirname, '..');
const muscleMapCode = fs.readFileSync(path.join(root, 'js/muscle-map.js'), 'utf8');

function createSandbox() {
  const sandbox = {
    window: {},
    self: {},
    console,
    I18n: {
      t: (k, fb) => {
        const dict = {
          muscle_chest: 'חזה',
          muscle_triceps: 'טריספס',
          muscle_quads: 'ארבע-ראשי',
          muscle_glutes: 'ישבן',
          muscle_lats: 'רחב גבי',
          muscle_primary: 'שריר מרכזי',
          muscle_secondary: 'שריר משני',
          muscle_untargeted: 'ללא עומס ישיר',
          view_front: 'מלפנים',
          view_back: 'מאחור'
        };
        return dict[k] || fb || k;
      }
    }
  };
  vm.createContext(sandbox);
  vm.runInContext(muscleMapCode, sandbox);
  return sandbox.MuscleMap || sandbox.window.MuscleMap || sandbox.self.MuscleMap;
}

test('MuscleMap - Core Module & Asset Integrity', () => {
  const mm = createSandbox();
  assert.ok(mm, 'MuscleMap module should be defined');
  assert.ok(mm.MALE_FRONT, 'MALE_FRONT diagram should exist');
  assert.ok(mm.MALE_BACK, 'MALE_BACK diagram should exist');
  assert.strictEqual(mm.MALE_FRONT.outline.length, 1);
  assert.strictEqual(mm.MALE_BACK.outline.length, 1);
  assert.strictEqual(mm.MALE_FRONT.muscles.length, 28);
  assert.strictEqual(mm.MALE_BACK.muscles.length, 30);
  assert.strictEqual(mm.MALE_FRONT.regionBox.UPPER_BODY, '170 39 680 729');
  assert.strictEqual(mm.MALE_FRONT.regionBox.LOWER_BODY, '170 633 680 817');
});

test('MuscleMap - Auto Region & View Detection', () => {
  const mm = createSandbox();

  // 1. Bench / Floor Press -> Upper-Body, Front
  const press = mm.resolveExerciseMuscles('db-floor-press');
  assert.strictEqual(press.region, 'UPPER_BODY');
  assert.strictEqual(press.view, 'FRONT');
  assert.ok(press.primary.includes('chest'));
  assert.ok(press.secondary.includes('triceps'));

  // 2. Pull-Up -> Upper-Body, Back
  const pullUp = mm.resolveExerciseMuscles('pull-up');
  assert.strictEqual(pullUp.region, 'UPPER_BODY');
  assert.strictEqual(pullUp.view, 'BACK');
  assert.ok(pullUp.primary.includes('lats'));

  // 3. Squat / Bulgarian Split Squat -> Lower-Body, Front
  const squat = mm.resolveExerciseMuscles('goblet-squat');
  assert.strictEqual(squat.region, 'LOWER_BODY');
  assert.strictEqual(squat.view, 'FRONT');
  assert.ok(squat.primary.includes('quads'));

  // 4. RDL / Romanian Deadlift -> Lower-Body, Back
  const rdl = mm.resolveExerciseMuscles('db-rdl');
  assert.strictEqual(rdl.region, 'LOWER_BODY');
  assert.strictEqual(rdl.view, 'BACK');
  assert.ok(rdl.primary.includes('hamstrings'));
  assert.ok(rdl.secondary.includes('glutes'));

  // 5. Calf Raise -> Lower-Body, Back
  const calf = mm.resolveExerciseMuscles('single-leg-calf-raise');
  assert.strictEqual(calf.region, 'LOWER_BODY');
  assert.strictEqual(calf.view, 'BACK');
  assert.ok(calf.primary.includes('calves'));
});

test('MuscleMap - SVG Rendering & Color Verification', () => {
  const mm = createSandbox();
  const svg = mm.renderSvg('db-floor-press');

  assert.ok(svg.startsWith('<svg'), 'Should generate valid SVG opening tag');
  assert.ok(svg.endsWith('</svg>'), 'Should generate valid SVG closing tag');
  assert.ok(svg.includes('170 39 680 729'), 'Should use Upper-Body cropped viewBox for floor press');
  assert.ok(svg.includes('#ef4444'), 'Should include Primary Red color gradient');
  assert.ok(svg.includes('#f97316'), 'Should include Secondary Orange color gradient');
  assert.ok(svg.includes('feGaussianBlur'), 'Should include high-tech glow filter');
});

test('MuscleMap - Outer Thumbnail Badge & Modal Section', () => {
  const mm = createSandbox();

  // Thumbnail Badge
  const badgeHtml = mm.renderThumbnailBadge('db-floor-press', { standalone: false, size: 34 });
  assert.ok(badgeHtml.includes('exercise-muscle-map-badge'));
  assert.ok(badgeHtml.includes('width: 34px'));
  assert.ok(badgeHtml.includes('height: 34px'));
  assert.ok(badgeHtml.includes('<svg'));

  // Modal Section
  const modalHtml = mm.renderModalSection('db-floor-press');
  assert.ok(modalHtml.includes('exercise-modal-muscle-map-card'));
  assert.ok(modalHtml.includes('modal-front'));
  assert.ok(modalHtml.includes('modal-back'));
  assert.ok(modalHtml.includes('שריר מרכזי'));
  assert.ok(modalHtml.includes('שריר משני'));
  assert.ok(modalHtml.includes('חזה'));
});
