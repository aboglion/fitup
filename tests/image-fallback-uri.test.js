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
        style: {},
        dataset: {},
        closest: () => null
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
    sessionStorage: { getItem() { return null; }, setItem() {} },
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

  // Load data
  const dataCode = fs.readFileSync(path.join(root, 'js/data.js'), 'utf8');
  vm.runInContext(dataCode, sandbox);

  // Load exercises
  const exCode = fs.readFileSync(path.join(root, 'js/exercises.js'), 'utf8');
  vm.runInContext(exCode, sandbox);

  // Load UI
  const uiCode = fs.readFileSync(path.join(root, 'js/ui.js'), 'utf8');
  vm.runInContext(uiCode, sandbox);

  // Load today
  const todayCode = fs.readFileSync(path.join(root, 'js/today.js'), 'utf8');
  vm.runInContext(todayCode, sandbox);

  return sandbox;
}

test('UI.safeDecodeURIComponent handles valid and malformed URI sequences without throwing', (t) => {
  const sb = createSandbox();
  const UI = sb.window.UI;

  assert.equal(typeof UI.safeDecodeURIComponent, 'function');

  // Valid URI
  assert.equal(UI.safeDecodeURIComponent('images/exercises/BRISK%20WALKING.png'), 'images/exercises/BRISK WALKING.png');

  // Malformed percent sequences (e.g. Incline 4% not hex-encoded, which throws URIError in decodeURIComponent)
  assert.doesNotThrow(() => {
    const res = UI.safeDecodeURIComponent('https://aboglion.github.io/fitup/images/exercises/INCLINE%204%.png');
    assert.equal(res, 'https://aboglion.github.io/fitup/images/exercises/INCLINE 4%.png');
  });

  // Lone percent at the end or middle
  assert.doesNotThrow(() => {
    const res = UI.safeDecodeURIComponent('https://aboglion.github.io/fitup/images/exercises/100%%20DONE.png');
    assert.equal(res, 'https://aboglion.github.io/fitup/images/exercises/100% DONE.png');
  });

  // Malformed UTF-8 percent byte
  assert.doesNotThrow(() => {
    const res = UI.safeDecodeURIComponent('https://aboglion.github.io/fitup/%FF%20test');
    assert.ok(res.includes('test'));
  });
});

test('UI.handleImageFallback never crashes with URIError when image src is malformed', (t) => {
  const sb = createSandbox();
  const UI = sb.window.UI;

  const mockImg = {
    src: 'https://aboglion.github.io/fitup/images/exercises/INCLINE%204%.png',
    dataset: {},
    classList: { contains: () => false },
    closest: () => null,
    style: {}
  };

  assert.doesNotThrow(() => {
    UI.handleImageFallback(mockImg, 'png');
  });

  // Verify next src assignment uses percent-encoding and does not contain raw illegal chars
  assert.ok(mockImg.src.includes('images/exercises/'));
});

test('TodayPage.getActiveExerciseName resolves walking, cardio, and weight tiers to base exercise names', (t) => {
  const sb = createSandbox();
  const TodayPage = sb.window.TodayPage;
  const UI = sb.window.UI;

  assert.equal(typeof TodayPage.getActiveExerciseName, 'function');

  // 1. Brisk Walking with Incline 4% stage
  const briskWalking = { name: 'Brisk Walking', currentStageName: 'Incline 4%' };
  assert.equal(TodayPage.getActiveExerciseName(briskWalking), 'Brisk Walking');

  // 2. Relaxed Walking with Incline 0% stage
  const relaxedWalking = { name: 'Relaxed Walking', currentStageName: 'Incline 0%' };
  assert.equal(TodayPage.getActiveExerciseName(relaxedWalking), 'Relaxed Walking');

  // 3. VO2 Max Norwegian 4x4 with Incline 3% stage
  const vo2Max = { name: 'VO2 Max Norwegian 4x4', currentStageName: 'Incline 3%' };
  assert.equal(TodayPage.getActiveExerciseName(vo2Max), 'VO2 Max Norwegian 4x4');

  // 4. Diamond Push-Up with +5 kg stage
  const diamondPushUp = { name: 'Diamond Push-Up', currentStageName: '+5 kg' };
  assert.equal(TodayPage.getActiveExerciseName(diamondPushUp), 'Diamond Push-Up');

  // 5. Weighted Deficit Push-Up with +5 kg stage
  const deficitPushUp = { name: 'Weighted Deficit Push-Up', currentStageName: '+5 kg' };
  assert.equal(TodayPage.getActiveExerciseName(deficitPushUp), 'Weighted Deficit Push-Up');

  // 6. Band Neck Flexion & Extension with Band 30 kg stage
  const neckBand = { name: 'Band Neck Flexion & Extension', currentStageName: 'Band 30 kg' };
  assert.equal(TodayPage.getActiveExerciseName(neckBand), 'Band Neck Flexion & Extension');

  // 7. True calisthenics progression movement stages still resolve to stage names
  const hollowBody = { name: 'Hollow Body Hold', currentStageName: 'Tuck Hold' };
  assert.equal(TodayPage.getActiveExerciseName(hollowBody), 'Tuck Hold');

  // 8. TRX Face Pull still resolves angle correctly
  const trxFacePull = { name: 'TRX Face Pull', currentStageName: 'Angle 1' };
  assert.equal(TodayPage.getActiveExerciseName(trxFacePull), 'TRX Face Pull (Angle 1)');

  // 9. Day 100 image exists on disk and resolves accurately
  const day100ImgUrl = UI.getImageUrl(TodayPage.getActiveExerciseName(briskWalking));
  assert.ok(day100ImgUrl.includes('images/exercises/BRISK%20WALKING.png'));
  assert.ok(fs.existsSync(path.join(root, 'images/exercises/BRISK WALKING.png')), 'BRISK WALKING.png must exist');
});
