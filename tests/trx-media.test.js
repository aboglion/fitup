const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.join(__dirname, '..');

function createSandbox() {
  const elements = {};
  const getOrCreateElement = (id) => {
    if (!elements[id]) {
      elements[id] = {
        id,
        innerHTML: '',
        addEventListener: () => { },
        removeEventListener: () => { },
        classList: { add: () => { }, remove: () => { }, contains: () => false },
        appendChild: () => { },
        remove: () => { },
        style: {},
        dataset: {}
      };
    }
    return elements[id];
  };

  const sandbox = {
    window: {},
    document: {
      body: { classList: { add() {}, remove() {}, contains() { return false; } } },
      documentElement: { style: { setProperty: () => {} }, setAttribute: () => {} },
      getElementById: (id) => getOrCreateElement(id),
      querySelector: (sel) => getOrCreateElement(sel),
      querySelectorAll: () => [],
      createElement: (tag) => getOrCreateElement(tag)
    },
    history: { pushState: () => {}, back: () => {} },
    console: console,
    setTimeout: global.setTimeout,
    clearTimeout: global.clearTimeout,
    navigator: { language: 'he' },
    localStorage: { getItem() { return null; }, setItem() {} },
    addEventListener: () => {},
    removeEventListener: () => {}
  };
  sandbox.window = sandbox;
  sandbox.window.addEventListener = () => {};
  sandbox.window.removeEventListener = () => {};

  vm.createContext(sandbox);

  // Load I18n
  const i18nCode = fs.readFileSync(path.join(root, 'js/i18n.js'), 'utf8');
  vm.runInContext(i18nCode, sandbox);
  sandbox.I18n = sandbox.window.I18n;

  // Load data
  const dataCode = fs.readFileSync(path.join(root, 'js/data.js'), 'utf8');
  vm.runInContext(dataCode, sandbox);
  sandbox.TRAINING_DATA = sandbox.window.TRAINING_DATA;

  // Load UI
  const uiCode = fs.readFileSync(path.join(root, 'js/ui.js'), 'utf8');
  vm.runInContext(uiCode, sandbox);

  // Load StatsPage
  const statsCode = fs.readFileSync(path.join(root, 'js/stats.js'), 'utf8');
  vm.runInContext(statsCode, sandbox);
  sandbox.StatsPage = sandbox.window.StatsPage;

  // Load ExercisesPage
  const exercisesCode = fs.readFileSync(path.join(root, 'js/exercises.js'), 'utf8');
  vm.runInContext(exercisesCode, sandbox);
  sandbox.ExercisesPage = sandbox.window.ExercisesPage;

  // Load AnatomyMap
  const anatomyCode = fs.readFileSync(path.join(root, 'js/anatomy.js'), 'utf8');
  vm.runInContext(anatomyCode, sandbox);
  sandbox.AnatomyMap = sandbox.window.AnatomyMap;

  return sandbox;
}

test('TRX Row & TRX Y-T-W media resolution integrity', (t) => {
  const sb = createSandbox();
  const UI = sb.window.UI;

  // 1. Direct getGifUrl resolution
  const trxRowGif = UI.getGifUrl('TRX Row');
  assert.equal(trxRowGif, 'images/gifs/TRX%20Row.gif', 'TRX Row must resolve to TRX Row.gif');

  const trxYtwGif = UI.getGifUrl('TRX Y-T-W');
  assert.equal(trxYtwGif, 'images/gifs/TRX%20Y-T-W.gif', 'TRX Y-T-W must resolve to TRX Y-T-W.gif');

  // 2. Direct getImageUrl resolution
  const trxRowPng = UI.getImageUrl('TRX Row');
  assert.ok(trxRowPng.includes('images/exercises/TRX%20ROW.png'), 'TRX Row must resolve to TRX ROW.png');

  const trxYtwPng = UI.getImageUrl('TRX Y-T-W');
  assert.ok(trxYtwPng.includes('images/exercises/TRX%20Y-T-W.png'), 'TRX Y-T-W must resolve to TRX Y-T-W.png');

  // 3. Files exist on disk
  assert.ok(fs.existsSync(path.join(root, 'images/gifs/TRX Row.gif')), 'TRX Row.gif must exist on disk');
  assert.ok(fs.existsSync(path.join(root, 'images/gifs/TRX Y-T-W.gif')), 'TRX Y-T-W.gif must exist on disk');
  assert.ok(fs.existsSync(path.join(root, 'images/exercises/TRX ROW.png')), 'TRX ROW.png must exist on disk');
  assert.ok(fs.existsSync(path.join(root, 'images/exercises/TRX Y-T-W.png')), 'TRX Y-T-W.png must exist on disk');

  // 4. Exercise stage variations of TRX Row and TRX Y-T-W
  assert.equal(UI.getGifUrl('TRX Row (Angle 1)'), 'images/gifs/TRX%20Row.gif');
  assert.equal(UI.getGifUrl('TRX Row (Feet-Elevated)'), 'images/gifs/TRX%20Row.gif');
  assert.equal(UI.getGifUrl('TRX Y-T-W (Angle 1)'), 'images/gifs/TRX%20Y-T-W.gif');

  // 5. TRX Face Pull still resolves its own assets
  assert.equal(UI.getGifUrl('TRX Face Pull'), 'images/gifs/TRX%20Face%20Pull.gif');
  assert.equal(UI.getGifUrl('TRX Face Pull (Angle 1)'), 'images/gifs/TRX%20Face%20Pull%20(Angle%201).gif');

  // 6. showImageModal fallbackTitle protection
  // Calling showImageModal with generic 'Angle 1' but fallbackTitle 'TRX Row'
  UI.showImageModal('Angle 1', '', 'TRX Row');
  const trxRowModalTitle = sb.document.getElementById('modal-title').innerHTML;
  const trxRowModalBody = sb.document.getElementById('modal-body').innerHTML;

  assert.ok(trxRowModalBody.includes('TRX%20Row.gif'), 'Modal for TRX Row must display TRX Row.gif');
  assert.ok(trxRowModalTitle.includes('TRX Row'), 'Modal title must be TRX Row');
  assert.ok(!trxRowModalBody.includes('Face%20Pull'), 'Modal for TRX Row must never show Face Pull');

  // Calling showImageModal with generic 'Angle 1' but fallbackTitle 'TRX Y-T-W'
  UI.showImageModal('Angle 1', '', 'TRX Y-T-W');
  const trxYtwModalTitle = sb.document.getElementById('modal-title').innerHTML;
  const trxYtwModalBody = sb.document.getElementById('modal-body').innerHTML;

  assert.ok(trxYtwModalBody.includes('TRX%20Y-T-W.gif'), 'Modal for TRX Y-T-W must display TRX Y-T-W.gif');
  assert.ok(trxYtwModalTitle.includes('TRX Y-T-W'), 'Modal title must be TRX Y-T-W');
  assert.ok(!trxYtwModalBody.includes('Face%20Pull'), 'Modal for TRX Y-T-W must never show Face Pull');
});

test('Wall Sit media resolution and asset integrity', () => {
  const sb = createSandbox();
  const UI = sb.window.UI;

  // 1. Direct getGifUrl resolution
  const wallSitGif = UI.getGifUrl('Wall Sit');
  assert.equal(wallSitGif, 'images/gifs/Wall%20Sit.gif', 'Wall Sit must resolve to Wall Sit.gif');

  // 2. Direct getImageUrl resolution
  const wallSitPng = UI.getImageUrl('Wall Sit');
  assert.ok(wallSitPng.includes('images/exercises/WALL%20SIT.png'), 'Wall Sit must resolve to WALL SIT.png');

  // 3. Files exist on disk
  assert.ok(fs.existsSync(path.join(root, 'images/gifs/Wall Sit.gif')), 'Wall Sit.gif must exist on disk');
  assert.ok(fs.existsSync(path.join(root, 'images/exercises/WALL SIT.png')), 'WALL SIT.png must exist on disk');

  // 4. showImageModal displays Wall Sit GIF
  UI.showImageModal('Wall Sit');
  const modalTitle = sb.document.getElementById('modal-title').innerHTML;
  const modalBody = sb.document.getElementById('modal-body').innerHTML;

  assert.ok(modalBody.includes('Wall%20Sit.gif'), 'Modal for Wall Sit must display Wall Sit.gif');
  assert.ok(modalTitle.includes('Wall Sit'), 'Modal title must be Wall Sit');
});

test('New exercises tree presence & anatomy integrity (Wall Sit, Single-Leg Glute Bridge, Nordic Curl Progression)', () => {
  const sb = createSandbox();
  const UI = sb.window.UI;
  const I18n = sb.window.I18n;
  const StatsPage = sb.window.StatsPage;
  const ExercisesPage = sb.window.ExercisesPage;
  const AnatomyMap = sb.window.AnatomyMap;

  // 1. Verify existence in SKILL_TREES under lower-strength
  const trees = ExercisesPage.SKILL_TREES['lower-strength'];
  assert.ok(trees, 'lower-strength skill tree must exist');

  const quadFocus = trees.find(t => t.title === 'quad_focus');
  assert.ok(quadFocus, 'quad_focus path must exist');
  const wallSitNode = quadFocus.exercises.find(e => e.name === 'Wall Sit');
  assert.ok(wallSitNode, 'Wall Sit must be in quad_focus');
  assert.equal(wallSitNode.id, 'wall-sit-1');
  assert.equal(wallSitNode.parentId, 'squat-heels-1');
  assert.equal(wallSitNode.relType, 'accessory');
  assert.equal(wallSitNode.unlockWeek, 1);

  const hamstringChain = trees.find(t => t.title === 'hamstring_chain');
  assert.ok(hamstringChain, 'hamstring_chain path must exist');
  const nordicNode = hamstringChain.exercises.find(e => e.name === 'Nordic Curl Progression');
  assert.ok(nordicNode, 'Nordic Curl Progression must be in hamstring_chain');
  assert.equal(nordicNode.id, 'nordic-1');
  assert.equal(nordicNode.unlockWeek, 10);

  const glutesCalves = trees.find(t => t.title === 'glutes_calves');
  assert.ok(glutesCalves, 'glutes_calves path must exist');
  const singleLegGluteNode = glutesCalves.exercises.find(e => e.name === 'Single-Leg Glute Bridge');
  assert.ok(singleLegGluteNode, 'Single-Leg Glute Bridge must be in glutes_calves');
  assert.equal(singleLegGluteNode.id, 'glute-2');
  assert.equal(singleLegGluteNode.parentId, 'glute-1');
  assert.equal(singleLegGluteNode.relType, 'accessory');
  assert.equal(singleLegGluteNode.unlockWeek, 1);

  // 2. Verify media on disk and URL resolution
  const exercises = [
    { name: 'Wall Sit', png: 'WALL SIT.png', gif: 'Wall Sit.gif' },
    { name: 'Single-Leg Glute Bridge', png: 'SINGLE-LEG GLUTE BRIDGE.png', gif: 'Single-Leg Glute Bridge.gif' },
    { name: 'Nordic Curl Progression', png: 'NORDIC CURL PROGRESSION.png', gif: 'Nordic Curl Progression.gif' }
  ];

  for (const ex of exercises) {
    assert.ok(fs.existsSync(path.join(root, 'images/exercises', ex.png)), `${ex.png} must exist on disk`);
    assert.ok(fs.existsSync(path.join(root, 'images/gifs', ex.gif)), `${ex.gif} must exist on disk`);

    const pngUrl = UI.getImageUrl(ex.name);
    assert.ok(pngUrl.includes(encodeURIComponent(ex.png).replace(/%20/g, '%20')), `getImageUrl(${ex.name}) must resolve to ${ex.png}`);

    const gifUrl = UI.getGifUrl(ex.name);
    assert.ok(gifUrl.includes(encodeURIComponent(ex.gif).replace(/%20/g, '%20')), `getGifUrl(${ex.name}) must resolve to ${ex.gif}`);

    assert.ok(UI.hasGif(ex.name), `hasGif(${ex.name}) must be true`);
  }

  // 3. Verify primary muscle mapping in StatsPage.getMuscleForExercise
  assert.equal(StatsPage.getMuscleForExercise({ id: 'wall-sit-1', name: 'Wall Sit' }), 'quads');
  assert.equal(StatsPage.getMuscleForExercise({ id: 'wall-sit', name: 'Wall Sit' }), 'quads');
  assert.equal(StatsPage.getMuscleForExercise({ id: 'glute-2', name: 'Single-Leg Glute Bridge' }), 'glutes');
  assert.equal(StatsPage.getMuscleForExercise({ id: 'single-leg-glute-bridge', name: 'Single-Leg Glute Bridge' }), 'glutes');
  assert.equal(StatsPage.getMuscleForExercise({ id: 'nordic-1', name: 'Nordic Curl Progression' }), 'hamstrings');
  assert.equal(StatsPage.getMuscleForExercise({ id: 'nordic-curl-progression', name: 'Nordic Curl Progression' }), 'hamstrings');

  // Verify Nordic Curl does NOT misclassify into biceps
  assert.notEqual(StatsPage.getMuscleForExercise({ name: 'Nordic Curl Progression' }), 'biceps');

  // 4. Verify volume contributions in StatsPage.getExerciseContributions
  const wallSitContribs = StatsPage.getExerciseContributions({ id: 'wall-sit', name: 'Wall Sit' });
  assert.ok(wallSitContribs.some(c => c.m === 'quads' && c.w === 1.0));
  assert.ok(wallSitContribs.some(c => c.m === 'glutes' && c.w === 0.4));
  assert.ok(wallSitContribs.some(c => c.m === 'calves' && c.w === 0.3));

  const singleLegBridgeContribs = StatsPage.getExerciseContributions({ id: 'single-leg-glute-bridge', name: 'Single-Leg Glute Bridge' });
  assert.ok(singleLegBridgeContribs.some(c => c.m === 'glutes' && c.w === 1.0));
  assert.ok(singleLegBridgeContribs.some(c => c.m === 'hamstrings' && c.w === 0.6));
  assert.ok(singleLegBridgeContribs.some(c => c.m === 'core' && c.w === 0.3));

  const nordicContribs = StatsPage.getExerciseContributions({ id: 'nordic-curl-progression', name: 'Nordic Curl Progression' });
  assert.ok(nordicContribs.some(c => c.m === 'hamstrings' && c.w === 1.0));
  assert.ok(nordicContribs.some(c => c.m === 'glutes' && c.w === 0.3));
  // Must NOT contain lowerBack or biceps
  assert.ok(!nordicContribs.some(c => c.m === 'lowerBack'));
  assert.ok(!nordicContribs.some(c => c.m === 'biceps'));

  // 5. Verify targeted muscles in AnatomyMap.getMusclesForExercise
  const wallSitMuscles = AnatomyMap.getMusclesForExercise('Wall Sit');
  assert.ok(wallSitMuscles.includes('quads'), 'Wall Sit must target quads');
  assert.ok(wallSitMuscles.includes('glutes'), 'Wall Sit must target glutes');

  const bridgeMuscles = AnatomyMap.getMusclesForExercise('Single-Leg Glute Bridge');
  assert.ok(bridgeMuscles.includes('glutes'), 'Single-Leg Glute Bridge must target glutes');
  assert.ok(bridgeMuscles.includes('hamstrings'), 'Single-Leg Glute Bridge must target hamstrings');
  assert.ok(bridgeMuscles.includes('core'), 'Single-Leg Glute Bridge must target core');

  const nordicMuscles = AnatomyMap.getMusclesForExercise('Nordic Curl Progression');
  assert.ok(nordicMuscles.includes('hamstrings'), 'Nordic Curl Progression must target hamstrings');
  assert.ok(nordicMuscles.includes('glutes'), 'Nordic Curl Progression must target glutes');
  assert.ok(!nordicMuscles.includes('biceps'), 'Nordic Curl Progression must NOT target biceps');

  // 6. Verify i18n technique rules
  ['he', 'en', 'ar'].forEach(lang => {
    I18n.setLanguage(lang);
    assert.ok(I18n.t('rule_wall_sit') && I18n.t('rule_wall_sit') !== 'rule_wall_sit');
    assert.ok(I18n.t('rule_single_leg_glute_bridge') && I18n.t('rule_single_leg_glute_bridge') !== 'rule_single_leg_glute_bridge');
    assert.ok(I18n.t('rule_nordic_curl_progression') && I18n.t('rule_nordic_curl_progression') !== 'rule_nordic_curl_progression');
  });

  // 7. Verify modal rendering with rules and muscles
  I18n.setLanguage('he');
  UI.showImageModal('Single-Leg Glute Bridge');
  const bridgeModalBody = sb.document.getElementById('modal-body').innerHTML;
  assert.ok(bridgeModalBody.includes('Single-Leg%20Glute%20Bridge.gif'), 'Modal should display Single-Leg Glute Bridge GIF');

  UI.showImageModal('Nordic Curl Progression');
  const nordicModalBody = sb.document.getElementById('modal-body').innerHTML;
  assert.ok(nordicModalBody.includes('Nordic%20Curl%20Progression.gif'), 'Modal should display Nordic Curl Progression GIF');
});

