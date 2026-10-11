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
