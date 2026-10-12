const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

test('DB Lazy Initialization & Concurrency Guard', async () => {
  const dbCode = fs.readFileSync(path.join(__dirname, '../js/db.js'), 'utf8');

  // Verify code structure
  assert.ok(dbCode.includes('let initPromise = null;'), 'db.js must track initPromise to deduplicate DB opens');
  assert.ok(dbCode.includes('async function getDb()'), 'db.js must provide getDb helper');
  assert.ok(dbCode.includes('if (db) return db;'), 'getDb must return existing db reference if available');
  assert.ok(dbCode.includes('return init();'), 'getDb must trigger init() lazily if db is null');

  // Verify getDb is awaited in CRUD operations
  assert.ok(dbCode.includes('async function put(') && dbCode.includes('await getDb();'), 'put must await getDb()');
  assert.ok(dbCode.includes('async function get(') && dbCode.includes('await getDb();'), 'get must await getDb()');
  assert.ok(dbCode.includes('async function getAll(') && dbCode.includes('await getDb();'), 'getAll must await getDb()');
  assert.ok(dbCode.includes('async function getByIndex(') && dbCode.includes('await getDb();'), 'getByIndex must await getDb()');
  assert.ok(dbCode.includes('async function putBulk(') && dbCode.includes('await getDb();'), 'putBulk must await getDb()');
  assert.ok(dbCode.includes('async function clear(') && dbCode.includes('await getDb();'), 'clear must await getDb()');
  assert.ok(dbCode.includes('async function count(') && dbCode.includes('await getDb();'), 'count must await getDb()');
  assert.ok(dbCode.includes('async function deletePhoto(') && dbCode.includes('await getDb();'), 'deletePhoto must await getDb()');

  // Functional simulation of DB with mocked IndexedDB
  let openCount = 0;
  const mockStorage = new Map();

  const mockIndexedDB = {
    open: (name, version) => {
      openCount++;
      const req = {
        result: {
          version,
          objectStoreNames: { contains: () => true },
          transaction: (storeName, mode) => ({
            objectStore: (sName) => ({
              get: (key) => {
                const getReq = { result: mockStorage.get(key) };
                setTimeout(() => { if (getReq.onsuccess) getReq.onsuccess(); }, 5);
                return getReq;
              },
              put: (val) => {
                const putReq = { result: val.key };
                mockStorage.set(val.key, val);
                setTimeout(() => { if (putReq.onsuccess) putReq.onsuccess(); }, 5);
                return putReq;
              }
            })
          }),
          close: () => {}
        },
        onsuccess: null,
        onerror: null,
        onupgradeneeded: null
      };

      setTimeout(() => {
        if (req.onsuccess) {
          req.onsuccess({ target: req });
        }
      }, 10);

      return req;
    }
  };

  const sandbox = {
    indexedDB: mockIndexedDB,
    console: console,
    window: {}
  };

  vm.createContext(sandbox);
  vm.runInContext(dbCode, sandbox);

  const DB = sandbox.window.DB;
  assert.ok(DB, 'DB object must be exported to window');

  // Verify that calling getSetting without prior DB.init() does NOT throw "db is null",
  // but lazily calls init() and returns data cleanly.
  await DB.setSetting('testKey', 'hello-world');
  const result = await DB.getSetting('testKey');
  assert.equal(result, 'hello-world', 'Lazy getSetting must read saved value correctly');
  assert.equal(openCount, 1, 'IndexedDB should have been opened only once');

  // Verify that calling DB.init() concurrently shares the same connection
  const [init1, init2] = await Promise.all([DB.init(), DB.init()]);
  assert.equal(init1, init2, 'Concurrent DB.init calls must return the same DB instance');
  assert.equal(openCount, 1, 'IndexedDB must still have opened only once');
});

test('App & CloudSync Focus/Foreground Guarding', () => {
  const appCode = fs.readFileSync(path.join(__dirname, '../js/app.js'), 'utf8');
  const cloudSyncCode = fs.readFileSync(path.join(__dirname, '../js/cloud-sync.js'), 'utf8');

  // Verify App.isReady exposure and event listener guards
  assert.ok(appCode.includes('isReady: () => isAppInitialized'), 'App must export isReady');
  assert.ok(appCode.includes('if (window.App && window.App.isReady && !window.App.isReady()) return;'), 'Event listeners must check App.isReady');

  // Verify checkAndPullIfUpdated catches unexpected token / db issues safely
  assert.ok(
    cloudSyncCode.includes('try {\n      const token = await ensureValidToken();'),
    'checkAndPullIfUpdated must wrap ensureValidToken in try/catch'
  );
});
