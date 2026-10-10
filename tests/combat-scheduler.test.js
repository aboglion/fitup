import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const require = createRequire(import.meta.url);
const CombatScheduler = require('../js/combat-scheduler.js');

// Helper: JS getDay -> Hebrew-ish weekday names for readability
const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// Hard-constraint verifier: combat days must never host strength or rest day-types
function assertHardConstraints(permutation, classBlocks, practiceBlock) {
  const combatBlocks = practiceBlock === null ? classBlocks.slice() : [...classBlocks, practiceBlock];
  for (const cb of combatBlocks) {
    const off = permutation[cb];
    assert.ok(![0, 2, 4].includes(off), `Combat block ${cb} hosts strength offset ${off}`);
    assert.notEqual(off, 6, `Combat block ${cb} hosts Rest`);
  }
}

test('Golden case - classes Tue+Thu produce perm [0,1,2,5,4,3,6] with practice Sat', () => {
  const result = CombatScheduler.computeWeek({ classDays: [2, 4], practice: 'auto' });
  assert.deepEqual(result.permutation, [0, 1, 2, 5, 4, 3, 6]);
  assert.equal(result.practiceDay, 6); // Saturday (JS getDay)
  assert.equal(result.hosts.class1, 'zone2'); // Tue hosts Zone 2
  assert.equal(result.hosts.class2, 'vo2'); // Thu hosts VO2 Max
  assert.equal(result.hosts.practice, 'recovery'); // Sat hosts Active Recovery
});

test('Golden case - practice off keeps identity permutation for Tue+Thu', () => {
  const result = CombatScheduler.computeWeek({ classDays: [2, 4], practice: 'off' });
  assert.deepEqual(result.permutation, [0, 1, 2, 3, 4, 5, 6]); // Tue=Zone2, Thu=Recovery unchanged
  assert.equal(result.practiceDay, null);
  assert.equal(result.hosts.class1, 'zone2');
  assert.equal(result.hosts.class2, 'recovery');
});

test('Exhaustive: all 21 class-day pairs x practice auto satisfy hard constraints', () => {
  const pairs = [];
  for (let i = 0; i < 7; i++) {
    for (let j = i + 1; j < 7; j++) pairs.push([i, j]);
  }
  assert.equal(pairs.length, 21);
  for (const pair of pairs) {
    const result = CombatScheduler.computeWeek({ classDays: pair, practice: 'auto' });
    assert.ok(result.permutation, `${pair} produced a permutation`);
    const classBlocks = pair.map(CombatScheduler.blockPosOf);
    const practiceBlock = result.practiceDay === null ? null : CombatScheduler.blockPosOf(result.practiceDay);
    assertHardConstraints(result.permutation, classBlocks, practiceBlock);
  }
});

test('Exhaustive: all 21 pairs x practice off satisfy hard constraints', () => {
  for (let i = 0; i < 7; i++) {
    for (let j = i + 1; j < 7; j++) {
      const result = CombatScheduler.computeWeek({ classDays: [i, j], practice: 'off' });
      const classBlocks = [i, j].map(CombatScheduler.blockPosOf);
      assertHardConstraints(result.permutation, classBlocks, null);
      if (result.practiceDay !== null) {
        assertHardConstraints(result.permutation, classBlocks, CombatScheduler.blockPosOf(result.practiceDay));
      }
    }
  }
});

test('All 7 single-class modes are valid and deterministic', () => {
  for (let dow = 0; dow < 7; dow++) {
    const r1 = CombatScheduler.computeWeek({ classDays: [dow], practice: 'auto' });
    const r2 = CombatScheduler.computeWeek({ classDays: [dow], practice: 'auto' });
    assert.deepEqual(r1.permutation, r2.permutation, `deterministic for dow ${dow}`);
    const classBlocks = [dow].map(CombatScheduler.blockPosOf);
    const practiceBlock = r1.practiceDay === null ? null : CombatScheduler.blockPosOf(r1.practiceDay);
    assertHardConstraints(r1.permutation, classBlocks, practiceBlock);
  }
});

test('Adjacent class days emit class_days_adjacent warning', () => {
  // Sun(0) + Mon(1) are adjacent
  const result = CombatScheduler.computeWeek({ classDays: [0, 1], practice: 'auto' });
  assert.ok(result.warnings.includes('class_days_adjacent'), `warnings=${result.warnings}`);
});

test('Optimal layout never places a strength slot adjacent to two rest-less strength days', () => {
  // Structural: the permutation is always a full bijection
  const result = CombatScheduler.computeWeek({ classDays: [2, 5], practice: 'auto' });
  const sorted = result.permutation.slice().sort((a, b) => a - b);
  assert.deepEqual(sorted, [0, 1, 2, 3, 4, 5, 6], 'permutation is a bijection of 0..6');
});

test('eraForDayIndex resolves the active era accounting for history boundaries', () => {
  const settings = {
    history: [
      { from: 0, enabled: false },
      { from: 105, enabled: true, perm: [0, 1, 2, 5, 4, 3, 6], classDays: [2, 4], practiceDay: 6 },
      { from: 210, enabled: false }
    ]
  };
  assert.equal(CombatScheduler.eraForDayIndex(settings, 50), null); // before first enabled era
  assert.deepEqual(CombatScheduler.eraForDayIndex(settings, 150), settings.history[1]); // active era
  assert.equal(CombatScheduler.eraForDayIndex(settings, 300), null); // disabled after
  assert.equal(CombatScheduler.eraForDayIndex(null, 150), null); // no settings
});

test('combatInfoForDay maps dayIndex + weekday to combat info', () => {
  const settings = {
    history: [
      { from: 0, enabled: true, perm: [0, 1, 2, 5, 4, 3, 6], classDays: [2, 4], practiceDay: 6, sport: 'muay_thai' }
    ]
  };
  // Tuesday (dow 2) -> class1, host type zone2
  const tue = CombatScheduler.combatInfoForDay(settings, 108, 2);
  assert.deepEqual(tue, { kind: 'class1', hostType: 'zone2', hostOffset: 1, guidance: 'combat_guidance_zone2', pending: false });

  // Thursday (dow 4) -> class2, host type vo2
  const thu = CombatScheduler.combatInfoForDay(settings, 110, 4);
  assert.deepEqual(thu.kind, 'class2');
  assert.deepEqual(thu.hostType, 'vo2');

  // Saturday (dow 6) -> practice, recovery
  const sat = CombatScheduler.combatInfoForDay(settings, 112, 6);
  assert.deepEqual(sat.kind, 'practice');
  assert.deepEqual(sat.hostType, 'recovery');

  // Monday layout must be restored by the permutation: M=Legs, no combat info
  const mon = CombatScheduler.combatInfoForDay(settings, 107, 1);
  assert.equal(mon, null);
});

test('combatInfoForDay respects era boundaries and disabled mode', () => {
  const settings = {
    history: [
      { from: 0, enabled: false },
      { from: 105, enabled: true, perm: [0, 1, 2, 5, 4, 3, 6], classDays: [2, 4], practiceDay: 6 }
    ]
  };
  assert.equal(CombatScheduler.combatInfoForDay(settings, 100, 2), null); // before era start
  assert.equal(CombatScheduler.combatInfoForDay(settings, 108, 2).kind, 'class1');
});

test('blockPosOf maps JS getDay to Mon-based block positions', () => {
  assert.equal(CombatScheduler.blockPosOf(0), 6); // Sunday -> block 6
  assert.equal(CombatScheduler.blockPosOf(1), 0); // Monday -> block 0
  assert.equal(CombatScheduler.blockPosOf(6), 5); // Saturday -> block 5
});

test('hardClass preference steers VO2 slot onto the chosen class day when feasible', () => {
  // Classes on Tue(2) + Thu(4): both VO2-on-Tue and VO2-on-Thu arrangements exist.
  const forFirst = CombatScheduler.computeWeek({ classDays: [2, 4], practice: 'off', hardClass: 'first' });
  const forSecond = CombatScheduler.computeWeek({ classDays: [2, 4], practice: 'off', hardClass: 'second' });
  // Bijections always hold
  assert.deepEqual(forFirst.permutation.slice().sort(), [0, 1, 2, 3, 4, 5, 6], 'bijection');
  assert.deepEqual(forSecond.permutation.slice().sort(), [0, 1, 2, 3, 4, 5, 6], 'bijection');
  // hardClass=first -> class1 (Tue) hosts vo2; hardClass=second -> class2 (Thu) hosts vo2
  assert.equal(forFirst.hosts.class1, 'vo2', 'hardClass=first puts VO2 on class1');
  assert.equal(forSecond.hosts.class2, 'vo2', 'hardClass=second puts VO2 on class2');
  // Neither class ever lands on a strength/rest slot
  assert.ok(['zone2', 'vo2', 'recovery'].includes(forFirst.hosts.class2), 'class2 host is stackable');
  assert.ok(['zone2', 'vo2', 'recovery'].includes(forSecond.hosts.class1), 'class1 host is stackable');
});

test('hardClass sweep: all class-day pairs keep hard constraints under both hard preferences', () => {
  for (let i = 0; i < 7; i++) {
    for (let j = i + 1; j < 7; j++) {
      for (const hard of ['first', 'second']) {
        const result = CombatScheduler.computeWeek({ classDays: [i, j], practice: 'off', hardClass: hard });
        const classBlocks = [i, j].map(CombatScheduler.blockPosOf);
        assertHardConstraints(result.permutation, classBlocks, null);
        assert.deepEqual(result.permutation.slice().sort(), [0, 1, 2, 3, 4, 5, 6], 'bijection');
      }
    }
  }
});
// ---- Integration: era-based seeding over the real data.daily ----
function loadDaily() {
  const dataCode = fs.readFileSync(path.join(__dirname, '../js/data.js'), 'utf8');
  const w = {};
  new Function('window', dataCode)(w);
  return w.TRAINING_DATA.daily;
}

test('Integration - golden era permutation maps real data.daily to the expected week layout', () => {
  const daily = loadDaily();
  assert.equal(daily.length, 560, 'data.daily has 560 days');

  const perm = [0, 1, 2, 5, 4, 3, 6]; // golden case
  const settings = { rev: 1, enabled: true, history: [{ from: 98, enabled: true, perm, classDays: [2, 4], practiceDay: 6 }] };

  // Week block starting at dayIndex 98 (plan start date is Monday)
  const layout = [];
  for (let i = 98; i <= 104; i++) {
    const blockPosScript = ((i - 98) % 7 + 7) % 7;
    const src = 98 + perm[blockPosScript];
    layout.push(daily[src].dayType);
  }
  assert.deepEqual(layout, [
    'Legs + Core',
    'Zone 2 Cardio',
    'Push + Skill',
    'VO2 Max',
    'Pull + Grip',
    'Active Recovery',
    'Rest'
  ], 'permuted week layout (Mon..Sun)');

  // combatInfo alignment: Tue class1 zone2, Thu class2 vo2, Sat practice recovery
  const tue = CombatScheduler.combatInfoForDay(settings, 99, 2);
  assert.deepEqual(tue.kind, 'class1');
  assert.deepEqual(tue.hostType, 'zone2');
  const thu = CombatScheduler.combatInfoForDay(settings, 101, 4);
  assert.deepEqual(thu.kind, 'class2');
  assert.deepEqual(thu.hostType, 'vo2');
  const sat = CombatScheduler.combatInfoForDay(settings, 103, 6);
  assert.deepEqual(sat.kind, 'practice');
  assert.deepEqual(sat.hostType, 'recovery');
});

test('Integration - weeks before era.from are identity, weeks after are permuted', () => {
  const daily = loadDaily();
  const perm = [0, 1, 2, 5, 4, 3, 6];
  const settings = { rev: 2, enabled: true, history: [{ from: 105, enabled: true, perm, classDays: [2, 4], practiceDay: 6 }] };

  // Before era: identity order on a standard week (week 6, index 35-41).
  // Weeks 1-3 are Phase-0 ramp weeks (Saturday hosts a light walk instead of VO2)
  // so a standard microcycle week is used for the assertion.
  const before = [];
  for (let i = 35; i < 42; i++) before.push(daily[i].dayType);
  assert.deepEqual(before, [
    'Legs + Core', 'Zone 2 Cardio', 'Push + Skill', 'Active Recovery',
    'Pull + Grip', 'VO2 Max', 'Rest'
  ], 'identity week before era');

  // After era start (105 = Monday of week 16): permuted
  const after = [];
  for (let i = 105; i <= 111; i++) {
    const bp = (i - 105) % 7;
    after.push(daily[105 + perm[bp]].dayType);
  }
  assert.deepEqual(after, [
    'Legs + Core', 'Zone 2 Cardio', 'Push + Skill', 'VO2 Max',
    'Pull + Grip', 'Active Recovery', 'Rest'
  ], 'permuted week from era start');
});

test('Integration - disabling combat (identity era) restores original weekday content', () => {
  const daily = loadDaily();
  const perm = [0, 1, 2, 5, 4, 3, 6];
  const settings = {
    rev: 3,
    enabled: true,
    history: [
      { from: 0, enabled: false },
      { from: 28, enabled: true, perm, classDays: [2, 4], practiceDay: 6 },
      { from: 49, enabled: false }
    ]
  };
  // Enable at week-start 28 (week 5, standard microcycle). Week 3 was a Phase-0
  // ramp week (Saturday hosts light walk), so a standard week is used here.
  const eraActive = CombatScheduler.eraForDayIndex(settings, 30);
  assert.deepEqual(eraActive.perm, perm, 'permuted era active in week 5');
  const permutedBlock = [];
  for (let i = 28; i < 35; i++) {
    const bp = (i - 28) % 7;
    permutedBlock.push(daily[28 + perm[bp]].dayType);
  }
  assert.deepEqual(permutedBlock, [
    'Legs + Core', 'Zone 2 Cardio', 'Push + Skill', 'VO2 Max',
    'Pull + Grip', 'Active Recovery', 'Rest'
  ], 'permuted week while era active');

  // After disabled era (from 49 = week-start of week 8), identity applies again
  assert.equal(CombatScheduler.eraForDayIndex(settings, 52), null);
  const restored = [];
  for (let i = 49; i < 56; i++) restored.push(daily[i].dayType);
  assert.deepEqual(restored, [
    'Legs + Core', 'Zone 2 Cardio', 'Push + Skill', 'Active Recovery',
    'Pull + Grip', 'VO2 Max', 'Rest'
  ], 'identity restored after disabled era');
});

test('Pending mode - combat info is returned BEFORE the era boundary using identity guidance', () => {
  const settings = {
    rev: 1,
    enabled: true,
    history: [{ from: 98, enabled: true, perm: [0, 1, 2, 5, 4, 3, 6], classDays: [2, 4], practiceDay: 6 }]
  };
  // dayIndex 92 = this week's Tuesday (before boundary 98). Actual content pre-boundary is Zone2.
  const tue = CombatScheduler.combatInfoForDay(settings, 92, 2, 'Zone 2 Cardio');
  assert.equal(tue.kind, 'class1');
  assert.equal(tue.pending, true);
  assert.equal(tue.hostType, 'zone2'); // guided by actual day content this week
  // Thursday pre-boundary: current content is Active Recovery
  const thu = CombatScheduler.combatInfoForDay(settings, 94, 4, 'Active Recovery');
  assert.equal(thu.kind, 'class2');
  assert.equal(thu.pending, true);
  assert.equal(thu.hostType, 'recovery');
  // Non-combat weekday stays null even pre-boundary
  assert.equal(CombatScheduler.combatInfoForDay(settings, 93, 3, 'Push + Skill'), null);
  // After boundary: pending=false, guided by the era permutation
  const tueActive = CombatScheduler.combatInfoForDay(settings, 99, 2, 'Zone 2 Cardio');
  assert.equal(tueActive.kind, 'class1');
  assert.equal(tueActive.pending, false);
  assert.equal(tueActive.hostType, 'zone2');
});
