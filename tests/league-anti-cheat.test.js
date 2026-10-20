const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

function setupLeagueSandbox() {
  const root = path.join(__dirname, '..');
  const sandbox = {
    window: {},
    console: console,
    document: {
      getElementById: () => null,
      querySelectorAll: () => []
    },
    I18n: {
      t: (key) => key,
      currentLang: 'he'
    },
    StatsPage: {
      calculateXPAndLevel: () => ({ totalXP: 2500, currentLevel: 3 }),
      getDayXP: (d) => 500
    },
    DB: {
      getAllPlan: async () => [
        { dayIndex: 0, dayType: 'Legs + Core' },
        { dayIndex: 1, dayType: 'Zone 2 Cardio' }
      ],
      getAllTracking: async () => [
        { dayIndex: 0, completed: true, date: '2026-10-15' },
        { dayIndex: 1, completed: true, date: '2026-10-16' }
      ]
    },
    CloudSync: {
      getUserProfile: async () => ({ name: 'דני כ.', email: 'dani@example.com' }),
      isLoggedIn: async () => true,
      getAccessToken: async () => 'mock_token'
    }
  };
  sandbox.window = sandbox;
  vm.createContext(sandbox);

  const leagueCode = fs.readFileSync(path.join(root, 'js/league.js'), 'utf8');
  vm.runInContext(leagueCode, sandbox);
  return sandbox.window.League;
}

test('League Anti-Cheat - Valid card passes verification', () => {
  const League = setupLeagueSandbox();

  const validCard = {
    userId: 'usr_valid_01',
    displayName: 'דני כ.',
    currentLevel: 3,
    totalXP: 2500,
    streak: 5,
    proofChain: [
      { idx: 0, date: '2026-10-15', xp: 500 },
      { idx: 1, date: '2026-10-16', xp: 500 },
      { idx: 2, date: '2026-10-17', xp: 500 },
      { idx: 3, date: '2026-10-18', xp: 500 },
      { idx: 4, date: '2026-10-19', xp: 500 }
    ]
  };

  const result = League.verifyLeagueCard(validCard);
  assert.strictEqual(result.valid, true);
});

test('League Anti-Cheat - Forged XP with mismatched proof chain fails', () => {
  const League = setupLeagueSandbox();

  const forgedCard = {
    userId: 'usr_cheater_01',
    displayName: 'מתחזה',
    currentLevel: 15,
    totalXP: 98000, // Inflated!
    streak: 5,
    proofChain: [
      { idx: 0, date: '2026-10-15', xp: 500 },
      { idx: 1, date: '2026-10-16', xp: 500 }
    ]
  };

  const result = League.verifyLeagueCard(forgedCard);
  assert.strictEqual(result.valid, false);
  assert.ok(result.reason.includes('mismatch'));
});

test('League Anti-Cheat - Level formula mismatch fails', () => {
  const League = setupLeagueSandbox();

  const mismatchedLevelCard = {
    userId: 'usr_cheater_02',
    displayName: 'שחקן',
    currentLevel: 10, // Invalid for 1000 XP (should be 2)
    totalXP: 1000,
    proofChain: [
      { idx: 0, date: '2026-10-15', xp: 500 },
      { idx: 1, date: '2026-10-16', xp: 500 }
    ]
  };

  const result = League.verifyLeagueCard(mismatchedLevelCard);
  assert.strictEqual(result.valid, false);
  assert.ok(result.reason.includes('Level mismatch'));
});

test('League Anti-Cheat - Workout exceeding 500 XP ceiling fails', () => {
  const League = setupLeagueSandbox();

  const invalidXpCard = {
    userId: 'usr_cheater_03',
    displayName: 'שחקן',
    currentLevel: 2,
    totalXP: 1200,
    proofChain: [
      { idx: 0, date: '2026-10-15', xp: 1200 } // Exceeds 500 cap
    ]
  };

  const result = League.verifyLeagueCard(invalidXpCard);
  assert.strictEqual(result.valid, false);
  assert.ok(result.reason.includes('exceeds ceiling'));
});

test('League Anti-Cheat - Future dated workout fails', () => {
  const League = setupLeagueSandbox();

  const futureCard = {
    userId: 'usr_cheater_04',
    displayName: 'שחקן מהעתיד',
    currentLevel: 2,
    totalXP: 500,
    proofChain: [
      { idx: 0, date: '2099-01-01', xp: 500 } // Far future
    ]
  };

  const result = League.verifyLeagueCard(futureCard);
  assert.strictEqual(result.valid, false);
  assert.ok(result.reason.includes('Future dated'));
});

test('League Leaderboard - All mock community players pass verification and sort correctly', async () => {
  const League = setupLeagueSandbox();

  const community = League.getMockCommunity();
  community.forEach(player => {
    const check = League.verifyLeagueCard(player);
    assert.strictEqual(check.valid, true, `Player ${player.displayName} failed verification: ${check.reason}`);
  });

  const roster = await League.fetchLeaderboard('xp');
  assert.ok(roster.length >= 6);

  // Verify descending sort
  for (let i = 0; i < roster.length - 1; i++) {
    assert.ok(roster[i].totalXP >= roster[i + 1].totalXP, `Rank ${roster[i].rank} (${roster[i].totalXP}) should be >= Rank ${roster[i+1].rank} (${roster[i+1].totalXP})`);
    assert.strictEqual(roster[i].rank, i + 1);
  }
});
