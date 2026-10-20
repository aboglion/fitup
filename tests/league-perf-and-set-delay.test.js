const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

test('League Performance - generateMyLeagueCard uses cachedPlanDays to avoid redundant 560-day DB reads', async () => {
  let dbGetAllPlanCallCount = 0;
  let dbGetAllTrackingCallCount = 0;

  const sandbox = {
    window: {},
    console: console,
    document: {
      getElementById: () => null,
      querySelectorAll: () => []
    },
    I18n: {
      t: (k) => k,
      currentLang: 'he'
    },
    StatsPage: {
      calculateXPAndLevel: () => ({ totalXP: 3000, currentLevel: 3 }),
      getDayXP: () => 500
    },
    DB: {
      getAllPlan: async () => {
        dbGetAllPlanCallCount++;
        return [
          { dayIndex: 0, dayType: 'Legs + Core' },
          { dayIndex: 1, dayType: 'Push + Core' }
        ];
      },
      getAllTracking: async () => {
        dbGetAllTrackingCallCount++;
        return [
          { dayIndex: 0, completed: true, date: '2026-10-15' }
        ];
      }
    },
    CloudSync: {
      getUserProfile: async () => ({ name: 'Test User', email: 'test@example.com' }),
      isLoggedIn: async () => true,
      getAccessToken: async () => 'test_token'
    }
  };
  sandbox.window = sandbox;
  vm.createContext(sandbox);

  const leagueCode = fs.readFileSync(path.join(__dirname, '../js/league.js'), 'utf8');
  vm.runInContext(leagueCode, sandbox);
  const League = sandbox.window.League;

  // 1st call: reads from DB
  const card1 = await League.generateMyLeagueCard();
  assert.strictEqual(dbGetAllPlanCallCount, 1);
  assert.strictEqual(card1.totalXP, 3000);

  // 2nd call: must use cached plan days, DB.getAllPlan must NOT be called again
  const card2 = await League.generateMyLeagueCard();
  assert.strictEqual(dbGetAllPlanCallCount, 1, 'DB.getAllPlan should be cached and not called repeatedly');

  // Test invalidation
  League.invalidatePlanCache();
  await League.generateMyLeagueCard();
  assert.strictEqual(dbGetAllPlanCallCount, 2, 'DB.getAllPlan should be called after invalidatePlanCache()');
});

test('League Performance - scheduleSync properly debounces score synchronization', async () => {
  let syncMyScoreCalls = 0;

  const sandbox = {
    window: {},
    console: console,
    setTimeout: setTimeout,
    clearTimeout: clearTimeout,
    document: {
      getElementById: () => null,
      querySelectorAll: () => []
    },
    I18n: {
      t: (k) => k,
      currentLang: 'he'
    },
    StatsPage: {
      calculateXPAndLevel: () => ({ totalXP: 1000, currentLevel: 2 }),
      getDayXP: () => 200
    },
    DB: {
      getAllPlan: async () => [{ dayIndex: 0, dayType: 'Workout' }],
      getAllTracking: async () => [{ dayIndex: 0, completed: true }]
    },
    CloudSync: {
      getUserProfile: async () => ({ name: 'Test', email: 'test@test.com' }),
      isLoggedIn: async () => {
        syncMyScoreCalls++;
        return false; // Stop after check
      },
      getAccessToken: async () => null
    }
  };
  sandbox.window = sandbox;
  vm.createContext(sandbox);

  const leagueCode = fs.readFileSync(path.join(__dirname, '../js/league.js'), 'utf8');
  vm.runInContext(leagueCode, sandbox);
  const League = sandbox.window.League;

  // Rapid scheduleSync calls (simulate rapid clicks)
  League.scheduleSync(50);
  League.scheduleSync(50);
  League.scheduleSync(50);

  // Before timeout fires, zero sync calls
  assert.strictEqual(syncMyScoreCalls, 0);

  // Wait for debounced timer to execute
  await new Promise(resolve => setTimeout(resolve, 80));

  // Exactly ONE sync execution
  assert.strictEqual(syncMyScoreCalls, 1, 'scheduleSync should debounce multiple triggers to exactly 1 call');
});

test('TodayPage Set Logging - autoSave does NOT trigger league sync on incomplete workout', () => {
  const todayCode = fs.readFileSync(path.join(__dirname, '../js/today.js'), 'utf8');

  // Verify that autoSave guards the League sync with completion check
  assert.ok(
    todayCode.includes('if (currentTracking && (currentTracking.completed || currentTracking.manuallyUncompleted)) {') &&
    todayCode.includes('window.League.scheduleSync();'),
    'today.js autoSave only schedules league sync if currentTracking is completed or uncompleted'
  );

  // Verify that bare syncMyScore is NOT called directly inside autoSave without condition
  assert.ok(
    !todayCode.includes('window.League.syncMyScore().catch'),
    'Bare blocking window.League.syncMyScore() should not exist in autoSave'
  );
});
