const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

test('Syntax Integrity - All JavaScript files parse without syntax errors', () => {
  const root = path.join(__dirname, '..');
  const jsDir = path.join(root, 'js');
  const files = [
    path.join(root, 'sw.js'),
    ...fs.readdirSync(jsDir).filter(f => f.endsWith('.js')).map(f => path.join(jsDir, f))
  ];

  for (const file of files) {
    if (!fs.existsSync(file)) continue;
    const code = fs.readFileSync(file, 'utf8');
    assert.doesNotThrow(() => {
      new vm.Script(code, { filename: path.basename(file) });
    }, `Syntax error in ${path.relative(root, file)}`);
  }
});
