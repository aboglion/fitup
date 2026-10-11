import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test('Live Dashboard - CloudSync auto-sync & cross-tab bus architecture', () => {
  const cloudSyncCode = fs.readFileSync(path.join(__dirname, '../js/cloud-sync.js'), 'utf8');

  let broadcastMessageSent = null;
  class MockBroadcastChannel {
    constructor(name) {
      this.name = name;
    }
    postMessage(data) {
      broadcastMessageSent = data;
    }
  }

  const window = {
    addEventListener: () => {},
    location: { origin: 'http://localhost', pathname: '/', hash: '', search: '' },
    BroadcastChannel: MockBroadcastChannel
  };
  const document = {
    addEventListener: () => {},
    visibilityState: 'visible'
  };
  const navigator = { onLine: true };
  const DB = {
    getSetting: async () => null,
    setSetting: async () => {}
  };

  const evalSync = new Function(
    'window',
    'document',
    'navigator',
    'DB',
    'BroadcastChannel',
    `${cloudSyncCode}\nreturn window.CloudSync;`
  );

  const CloudSync = evalSync(window, document, navigator, DB, MockBroadcastChannel);

  assert.ok(CloudSync, 'CloudSync is defined');
  assert.equal(typeof CloudSync.startAutoSync, 'function', 'startAutoSync function exists');
  assert.equal(typeof CloudSync.stopAutoSync, 'function', 'stopAutoSync function exists');
  assert.equal(typeof CloudSync.checkAndPullIfUpdated, 'function', 'checkAndPullIfUpdated function exists');
  assert.equal(typeof CloudSync.onDataUpdate, 'function', 'onDataUpdate listener exists');
  assert.equal(typeof CloudSync.notifyDataUpdated, 'function', 'notifyDataUpdated emitter exists');
  assert.equal(typeof CloudSync.broadcastDataUpdate, 'function', 'broadcastDataUpdate function exists');

  // Test listener subscription & event notification
  let receivedSource = null;
  CloudSync.onDataUpdate((source) => {
    receivedSource = source;
  });

  CloudSync.notifyDataUpdated('test_source');
  assert.equal(receivedSource, 'test_source', 'Registered listener received correct source');
  assert.ok(broadcastMessageSent, 'Broadcast message was sent across tabs');
  assert.equal(broadcastMessageSent.type, 'DATA_UPDATED', 'Broadcast packet type is DATA_UPDATED');
});
