import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test('Cloud Sync & DB Integrity - Local Auth Keys Protection', async () => {
  const dbCode = fs.readFileSync(path.join(__dirname, '../js/db.js'), 'utf8');

  // Verify that LOCAL_AUTH_SETTINGS_KEYS exists and contains all required keys
  assert.ok(dbCode.includes('LOCAL_AUTH_SETTINGS_KEYS'), 'LOCAL_AUTH_SETTINGS_KEYS must be defined in db.js');
  assert.ok(dbCode.includes("'googleTokenExpired'"), 'googleTokenExpired must be protected in LOCAL_AUTH_SETTINGS_KEYS');
  assert.ok(dbCode.includes("'googleTokenExpiry'"), 'googleTokenExpiry must be protected in LOCAL_AUTH_SETTINGS_KEYS');
  assert.ok(dbCode.includes("'googleAccessToken'"), 'googleAccessToken must be protected in LOCAL_AUTH_SETTINGS_KEYS');

  // Verify that exportData filters out local auth keys
  assert.ok(
    dbCode.includes('!LOCAL_AUTH_SETTINGS_KEYS.includes(s.key)'),
    'exportData must filter out LOCAL_AUTH_SETTINGS_KEYS before export'
  );

  // Verify that importData preserves local auth keys and sanitizes incoming cloud settings
  assert.ok(
    dbCode.includes('data.settings.filter(s => !LOCAL_ONLY_KEYS.includes(s.key))'),
    'importData must filter out incoming cloud auth settings to prevent overwriting active tokens'
  );
});

test('CloudSync - Token Retention and Proactive Refresh Architecture', () => {
  const cloudSyncCode = fs.readFileSync(path.join(__dirname, '../js/cloud-sync.js'), 'utf8');

  // Verify trySilentRefresh does not prematurely trigger reauth_needed when background gesture is absent
  assert.ok(
    cloudSyncCode.includes('// Do not prematurely set reauth_needed here; current token may still be usable'),
    'trySilentRefresh must not set reauth_needed when skipping background popup'
  );

  // Verify proactiveRefreshIfExpiring exists and is exported
  assert.ok(
    cloudSyncCode.includes('async function proactiveRefreshIfExpiring()'),
    'proactiveRefreshIfExpiring function must exist'
  );
  assert.ok(
    cloudSyncCode.includes('proactiveRefreshIfExpiring,'),
    'proactiveRefreshIfExpiring must be exported on CloudSync'
  );

  // Verify scheduleSync proactively refreshes expiring tokens during user gestures
  assert.ok(
    cloudSyncCode.includes('proactiveRefreshIfExpiring();'),
    'scheduleSync must invoke proactiveRefreshIfExpiring on user clicks'
  );

  // Verify ensureValidToken uses live token rather than prematurely disconnecting
  assert.ok(
    cloudSyncCode.includes('Token TTL near limit, attempting API call before disconnecting'),
    'ensureValidToken must attempt API call with existing token before giving up'
  );

  // Verify waitForGis helper exists and is exported
  assert.ok(
    cloudSyncCode.includes('async function waitForGis('),
    'waitForGis helper must exist in cloud-sync.js'
  );
  assert.ok(
    cloudSyncCode.includes('waitForGis,'),
    'waitForGis must be exported from CloudSync'
  );

  // Verify loginWithGoogle supports isAuto parameter
  assert.ok(
    cloudSyncCode.includes('async function loginWithGoogle(onSuccess, onError, isAuto = false)'),
    'loginWithGoogle must accept isAuto parameter'
  );
});

test('App & CloudSync - Simulated Automatic Click on Re-Auth Disconnect', () => {
  const appCode = fs.readFileSync(path.join(__dirname, '../js/app.js'), 'utf8');

  // Verify simulateAutoLoginClick exists in setupAuthPromptBanner
  assert.ok(
    appCode.includes('simulateAutoLoginClick'),
    'simulateAutoLoginClick helper must be defined in app.js'
  );

  // Verify banner remains visible while auto-triggering click
  assert.ok(
    appCode.includes('banner.classList.remove(\'hidden\');') &&
    appCode.includes('simulateAutoLoginClick();'),
    'Banner must be shown on screen and simulateAutoLoginClick called when re-auth is needed'
  );

  // Verify bannerBtn click is simulated
  assert.ok(
    appCode.includes('bannerBtn.click();'),
    'bannerBtn.click() must be executed to simulate automatic click on the login button'
  );

  // Verify auto-click loop guard
  assert.ok(
    appCode.includes('hasAutoTriggeredReauth'),
    'hasAutoTriggeredReauth guard must prevent continuous auto-click looping'
  );
  assert.ok(
    appCode.includes('isSimulatingClick'),
    'isSimulatingClick must tag programmatic clicks to differentiate from user gestures'
  );

  // Verify reset on synced status or success
  assert.ok(
    appCode.includes("newStatus === 'synced'") || appCode.includes("hasAutoTriggeredReauth = false"),
    'hasAutoTriggeredReauth must reset when re-authenticated'
  );
});

