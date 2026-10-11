import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';

// Load TRAINING_DATA and ProgressionEngine in global scope
global.window = global;
global.document = {
    querySelector: () => null,
    querySelectorAll: () => [],
    addEventListener: () => { },
    createElement: () => ({ setAttribute: () => { }, appendChild: () => { }, style: {} }),
};

await import('../js/data.js');
await import('../js/progression.js');

const data = global.window.TRAINING_DATA;
const engine = global.window.ProgressionEngine;

const mainOf = (day) => day.exercises.filter(e => !e.isWarmup);
const dayOf = (week, dow) => data.daily.find(d => d.week === `Week ${week}` && d.dayOfWeek === dow);
const weekNum = (day) => parseInt(String(day.week).replace(/\D/g, ''), 10) || 1;

// ---------------------------------------------------------------------------
// 1. Nordic Curl Progression appears no earlier than Week 10
// ---------------------------------------------------------------------------
test('v15.7.1 - Nordic Curl Progression unlocks at Week 10 (never earlier)', () => {
    const nordic = data.exercises.find(e => e.id === 'nordic-curl-progression');
    assert.ok(nordic, 'nordic-curl-progression must exist in the catalog');
    assert.equal(nordic.name, 'Nordic Curl Progression');
    assert.equal(nordic.startingWeek, 10, 'calendar gate = Week 10');
    assert.equal(nordic.earliestWeek, 10, 'connective-tissue floor = Week 10');
    assert.equal(nordic.type, 'variation', 'bodyweight stage-based exercise (no external load)');
    assert.equal(nordic.sets, 2);
    assert.equal(nordic.repWindow, '6-10');
    assert.equal(nordic.restSeconds, 90);
    assert.equal(nordic.tempo, '3-1-1');
    assert.equal(nordic.compound, false);

    // No daily occurrence before week 10
    for (const day of data.daily) {
        if (weekNum(day) < 10) {
            assert.ok(!day.exercises.some(e => e.id === 'nordic-curl-progression'),
                `Nordic must not appear in ${day.week} ${day.dayOfWeek}`);
        }
    }
    // Engine gate
    assert.equal(engine.checkUnlockCriteria('nordic-curl-progression', {}, 9).unlocked, false);
    assert.equal(engine.checkUnlockCriteria('nordic-curl-progression', {}, 10).unlocked, true);
});

// ---------------------------------------------------------------------------
// 2. Day 1 placement: after RDL variations, before Heels-Elevated Goblet Squat
// ---------------------------------------------------------------------------
test('v15.7.1 - Nordic Curl Day 1 placement (after RDL toggle, before Heels-Elevated Goblet Squat)', () => {
    for (const week of [10, 11, 18, 24, 40, 60, 80]) {
        const d1 = dayOf(week, 'Monday');
        const ids = mainOf(d1).map(e => e.id);
        const i = ids.indexOf('nordic-curl-progression');
        assert.ok(i > -1, `Nordic must be present on Day 1 of week ${week}`);
        const prev = ids[i - 1];
        const next = ids[i + 1];
        assert.ok(['goblet-rdl', 'single-leg-rdl'].includes(prev),
            `Nordic must follow the RDL toggle (got ${prev})`);
        assert.equal(next, 'heels-elevated-goblet-squat',
            'Nordic must precede Heels-Elevated Goblet Squat');
    }
    // Deload week: 1 set only, hands-assisted, no progression
    const d12 = dayOf(12, 'Monday');
    const nordic12 = d12.exercises.find(e => e.id === 'nordic-curl-progression');
    assert.ok(nordic12, 'Nordic present on deload week 12 Day 1');
    assert.equal(nordic12.sets, '1×6-10', 'Deload = 1 set only');
    assert.equal(nordic12.rest, 90);
    assert.equal(nordic12.weight, 'Bodyweight');
});

// ---------------------------------------------------------------------------
// 3. Day 5 Single-Arm Lateral Raise appears only when unlocked
// ---------------------------------------------------------------------------
test('v15.7.1 - Day 5 Single-Arm Lateral Raise renders only when unlocked', () => {
    const d5 = dayOf(10, 'Friday');
    const lat = d5.exercises.find(e => e.id === 'single-arm-lateral-raise');
    assert.ok(lat, 'Day 5 lateral raise instance must exist');
    assert.equal(lat.startingWeek, 5, 'calendar gate = Week 5');
    assert.equal(lat.earliestWeek, 3, 'performance unlock from Week 3');
    assert.equal(lat.fallbackId, null, 'locked -> hidden (no fallback)');
    assert.equal(lat.sets, '2×12-15');
    assert.equal(lat.repWindow, '12-15');
    assert.equal(lat.tempo, '2-1-2');
    assert.equal(lat.rest, 75);
    assert.equal(lat.structure, 'pair');
    assert.equal(lat.pairId, 'd5-facepull-lateral');
    assert.equal(lat.orderInPair, 2);

    // Engine: locked at week 4 (no states), unlocked at week 5 (calendar gate)
    assert.equal(engine.checkUnlockCriteria('single-arm-lateral-raise', {}, 4).unlocked, false);
    assert.equal(engine.checkUnlockCriteria('single-arm-lateral-raise', {}, 5).unlocked, true);
});

// ---------------------------------------------------------------------------
// 4. When locked, TRX Face Pull remains straight sets
// ---------------------------------------------------------------------------
test('v15.7.1 - d5-facepull-lateral pair inactive while lateral raise is locked', () => {
    const pair = data.progressionSettings.leanMode.pairs.find(p => p.pairId === 'd5-facepull-lateral');
    assert.ok(pair, 'd5-facepull-lateral pair must exist');
    assert.equal(pair.dayIndex, 5);
    assert.equal(pair.restAfterPair, 75);
    assert.equal(pair.dissolveOnDeload, true);
    assert.equal(pair.dissolveIfMemberInactive, true);
    assert.deepEqual(pair.members.map(m => m.exerciseId), ['trx-face-pull', 'single-arm-lateral-raise']);

    assert.equal(engine.isPairActive(pair, 4, {}), false, 'pair omitted while lateral raise is locked');
    assert.equal(engine.isPairActive(pair, 5, {}), true, 'pair active once lateral raise is unlocked');
    assert.equal(engine.isPairActive(pair, 12, {}), false, 'pair dissolves on deload week 12');

    // Deload data: face pull straight with dedicated rest
    const d12 = dayOf(12, 'Friday');
    const fp = d12.exercises.find(e => e.id === 'trx-face-pull');
    assert.equal(fp.structure, 'straight');
    assert.equal(fp.rest, 45);
});

// ---------------------------------------------------------------------------
// 5. Day 3 first main exercise after warm-up is Single-Arm Seated OHP
// ---------------------------------------------------------------------------
test('v15.7.1 - Day 3 first main exercise is Single-Arm Seated OHP (all weeks)', () => {
    for (const week of [1, 2, 5, 10, 18, 24, 40, 60, 80]) {
        const d3 = dayOf(week, 'Wednesday');
        const first = mainOf(d3)[0];
        assert.equal(first.id, 'single-arm-seated-ohp', `Week ${week} Day 3 first main must be OHP`);
    }
});

// ---------------------------------------------------------------------------
// 6. Arm Block exposure remains max 1 per muscle area per week
// ---------------------------------------------------------------------------
test('v15.7.1 - Arm Block exposure settings unchanged', () => {
    const ab = data.progressionSettings.armBlock;
    assert.equal(ab.enabledFromWeek, 3);
    assert.equal(ab.maxArmBlockExposurePerMusclePerWeek, 1);
    assert.ok(ab.rampProtocol, 'Arm Block rampProtocol should be defined');
    assert.equal(ab.rampProtocol.week3.miniSets, 1);
    assert.equal(ab.rampProtocol.week4.miniSets, 2);
    assert.equal(ab.rampProtocol.week6Plus.miniSets, 3);
    assert.deepEqual(ab.muscleAreaMap, {
        "3": { "single-arm-lateral-raise": "lateral-shoulder", "db-overhead-triceps-extension": "triceps" },
        "5": { "single-arm-curl": "biceps", "single-arm-hammer-curl": "biceps" }
    });
});

// ---------------------------------------------------------------------------
// 7. No new Arm Block is added to Day 5
// ---------------------------------------------------------------------------
test('v15.7.1 - No Arm Block added to Day 5', () => {
    for (const day of data.daily) {
        if (day.dayOfWeek === 'Friday') {
            for (const ex of day.exercises) {
                if (ex.armBlock || ex.structure === 'myo-reps') {
                    assert.equal(ex.id, 'arm-block-biceps-curl',
                        'Day 5 arm block must remain only arm-block-biceps-curl');
                }
            }
        }
    }
});

// ---------------------------------------------------------------------------
// 8. No DB Stiff-Leg Deadlift exists in the dataset
// ---------------------------------------------------------------------------
test('v15.7.1 - No DB Stiff-Leg Deadlift in the dataset', () => {
    const all = [...data.exercises, ...data.daily.flatMap(d => d.exercises)];
    for (const ex of all) {
        assert.ok(!/stiff[- ]?leg/i.test(ex.name || ''),
            `DB Stiff-Leg Deadlift must not exist (found ${ex.name})`);
        assert.ok(!/stiff[- ]?leg/i.test(ex.id || ''),
            `DB Stiff-Leg Deadlift id must not exist (found ${ex.id})`);
    }
});

// ---------------------------------------------------------------------------
// 9. No fourth strength day is added
// ---------------------------------------------------------------------------
test('v15.7.1 - Weekly structure unchanged (3 strength days, 560 days)', () => {
    assert.equal(data.daily.length, 560);
    const strengthDows = new Set();
    for (const day of data.daily) {
        if (['Legs + Core', 'Push + Skill', 'Pull + Grip'].includes(day.dayType)) {
            strengthDows.add(day.dayOfWeek);
        }
    }
    assert.deepEqual([...strengthDows].sort(), ['Friday', 'Monday', 'Wednesday']);
});

// ---------------------------------------------------------------------------
// 10. Phase 0 remains Weeks 1-4
// ---------------------------------------------------------------------------
test('v15.7.1 - Phase 0 gates unchanged (Weeks 1-4, graduation Week 5)', () => {
    const gated = ['goblet-bulgarian-split-squat', 'single-arm-seated-ohp', 'pike-progression',
        'single-arm-lateral-raise', 'db-overhead-triceps-extension', 'single-arm-hammer-curl',
        'towel-hang', 'tuck-l-sit', 'push-up-volume', 'hollow-body-hold'];
    for (const id of gated) {
        const ex = data.exercises.find(e => e.id === id);
        assert.equal(ex.startingWeek, 5, `${id} calendar gate must stay Week 5`);
        assert.equal(ex.earliestWeek, 3, `${id} earliestWeek must stay 3`);
    }
    const carry = data.exercises.find(e => e.id === 'suitcase-carry');
    assert.equal(carry.startingWeek, 5);
    assert.equal(carry.earliestWeek, 4, 'suitcase-carry earliestWeek stays 4');
    const vo2 = data.exercises.find(e => e.id === 'vo2-max-norwegian-4x4');
    assert.equal(vo2.earliestWeek, 4, 'VO2 Max earliestWeek stays 4');
    // No Nordic in weeks 1-4
    for (const week of [1, 2, 3, 4]) {
        assert.ok(!dayOf(week, 'Monday').exercises.some(e => e.id === 'nordic-curl-progression'),
            `Nordic must not appear in Phase 0 week ${week}`);
    }
});

// ---------------------------------------------------------------------------
// 11. Deload remains every 12 weeks
// ---------------------------------------------------------------------------
test('v15.7.1 - Deload cadence unchanged (every 12 weeks)', () => {
    assert.equal(data.progressionSettings.deloadEveryWeeks, 12);
    for (const week of [12, 24, 36, 48, 60, 72]) {
        assert.equal(dayOf(week, 'Monday').isDeload, true, `Week ${week} must be a deload`);
    }
    for (const week of [11, 13, 23, 25]) {
        assert.equal(dayOf(week, 'Monday').isDeload, false, `Week ${week} must NOT be a deload`);
    }
});

// ---------------------------------------------------------------------------
// 12. Rep windows unchanged except the new Nordic Curl Progression entry
// ---------------------------------------------------------------------------
test('v15.7.1 - Rep windows frozen (only new Nordic entry added)', () => {
    const frozen = {
        'goblet-rdl': '6-12', 'single-leg-rdl': '8-10', 'heels-elevated-goblet-squat': '8-12',
        'goblet-bulgarian-split-squat': '6-12', 'db-glute-bridge': '10-15', 'suitcase-carry': '25-40m',
        'standing-single-leg-calf-raise': '12-20', 'seated-single-leg-calf-raise': '15-25',
        'pallof-press-progression': '10-12', 'dead-bug': '12-20', 'hollow-body-hold': '20-30s',
        'pike-progression': '15-30s or 6-12', 'single-arm-floor-press': '6-12', 'push-up-progression': '8-15',
        'deficit-push-up': '8-15', 'feet-elevated-push-up': '8-12', 'weighted-deficit-push-up': '6-12',
        'wall-walk-partial': '3-6', 'wall-walk-full': '3-6', 'wall-handstand': '20-45s',
        'elevated-pike-push-up': '6-10', 'pull-up-overhand': '4-8', 'chin-up': '4-8',
        'weighted-pull-up': '4-8', 'weighted-chin-up': '4-8', 'single-arm-seated-ohp': '6-12',
        'db-overhead-triceps-extension': '10-15', 'diamond-push-up': '10-15', 'trx-row': '10-15',
        'single-arm-lateral-raise': '12-20', 'trx-ytw': '8-12', 'band-pull-apart': '15-20',
        'pull-up-progression': '4-8', 'one-arm-db-row': '6-12', 'trx-face-pull': '12-20',
        'push-up-volume': '10-15', 'single-arm-curl': '10-15', 'single-arm-hammer-curl': '10-12',
        'towel-hang': '15-45s', 'tuck-l-sit': '8-20s', 'one-leg-extended-l-sit': '8-20s', 'full-l-sit': '8-20s'
    };
    for (const [id, rw] of Object.entries(frozen)) {
        const ex = data.exercises.find(e => e.id === id);
        assert.equal(ex.repWindow, rw, `repWindow of ${id} must stay ${rw}`);
    }
    const nordic = data.exercises.find(e => e.id === 'nordic-curl-progression');
    assert.equal(nordic.repWindow, '6-10');
    // Day 5 lateral instance uses the explicitly-stated 12-15 dose; Day 3 stays 12-20
    const d5lat = dayOf(10, 'Friday').exercises.find(e => e.id === 'single-arm-lateral-raise');
    assert.equal(d5lat.repWindow, '12-15');
    const d3lat = dayOf(10, 'Wednesday').exercises.find(e => e.id === 'single-arm-lateral-raise');
    assert.equal(d3lat.repWindow, '12-20');
});

// ---------------------------------------------------------------------------
// 13. All tempos and rest intervals are exact numeric values
// ---------------------------------------------------------------------------
test('v15.7.1 - Exact tempos and rest intervals', () => {
    const tempoOf = id => data.exercises.find(e => e.id === id).tempo;
    // v15.7.1 lengthened-position tempos
    assert.equal(tempoOf('single-arm-curl'), '2-1-2');
    assert.equal(tempoOf('single-arm-lateral-raise'), '2-1-2');
    assert.equal(tempoOf('db-overhead-triceps-extension'), '2-1-2');
    assert.equal(tempoOf('nordic-curl-progression'), '3-1-1');
    // Unchanged tempos (no forced stretch pauses)
    assert.equal(tempoOf('single-arm-hammer-curl'), '2s descent');
    assert.equal(tempoOf('goblet-rdl'), '3s descent', 'Goblet RDL keeps existing tempo (no full stretch pause)');
    assert.equal(tempoOf('heels-elevated-goblet-squat'), '3s descent, 1-2s pause at bottom, 1s ascent',
        'Heels-Elevated Goblet Squat keeps its paused-squat rule');
    // Rests
    assert.equal(data.exercises.find(e => e.id === 'goblet-rdl').restSeconds, 90);
    assert.deepEqual(data.exercises.find(e => e.id === 'goblet-rdl').restRange, [75, 120]);
    assert.equal(data.exercises.find(e => e.id === 'nordic-curl-progression').restSeconds, 90);
    assert.equal(data.exercises.find(e => e.id === 'trx-face-pull').restSeconds, 45);
    const d5 = dayOf(10, 'Friday');
    assert.equal(d5.exercises.find(e => e.id === 'trx-face-pull').rest, 75, 'pair member rest = pair rest');
    assert.equal(d5.exercises.find(e => e.id === 'single-arm-lateral-raise').rest, 75);
    assert.equal(dayOf(10, 'Monday').exercises.find(e => e.id === 'goblet-rdl').rest, 90);
});

// ---------------------------------------------------------------------------
// 14. Strength-day target duration remains <= 45 minutes
// ---------------------------------------------------------------------------
test('v15.7.1 - Strength-day duration estimate stays within 45 minutes', () => {
    // Deterministic estimator (documented assumptions):
    //   - warm-up item: 0.5 min each
    //   - main set: 0.67 min (~40s) of work
    //   - straight exercise: rest x (sets - 1)
    //   - pair: work for both members, pair rest counted once
    //   - Micro Mobility Protocol: 5 min
    const estimateMinutes = (day) => {
        let total = 0;
        const seenPairs = new Set();
        for (const ex of day.exercises) {
            if (ex.isWarmup) { total += 0.5; continue; }
            if (ex.id === 'micro-mobility-protocol') { total += 5; continue; }
            const sets = parseInt(String(ex.sets).split('×')[0], 10) || 1;
            const work = sets * 0.67;
            const rest = (ex.rest || 0) / 60;
            if (ex.pairId) {
                if (!seenPairs.has(ex.pairId)) {
                    seenPairs.add(ex.pairId);
                    total += work + rest; // pair rest counted once after both members
                } else {
                    total += work; // second member: work only
                }
            } else {
                total += work + rest * Math.max(1, sets - 1);
            }
        }
        return total;
    };
    for (const week of [10, 11, 18, 24, 40, 60, 80]) {
        for (const dow of ['Monday', 'Wednesday', 'Friday']) {
            const est = estimateMinutes(dayOf(week, dow));
            assert.ok(est <= 45, `Week ${week} ${dow} estimated ${est.toFixed(1)} min > 45`);
        }
    }
});

// ---------------------------------------------------------------------------
// 15. ProgressionEngine, IndexedDB version, cloud sync, backup/export, combat scheduler unchanged
// ---------------------------------------------------------------------------
test('v15.7.1 - Engine / IndexedDB / sync / scheduler / export untouched', () => {
    const read = f => fs.readFileSync(path.join(process.cwd(), f), 'utf8');
    const dbSrc = read('js/db.js');
    assert.match(dbSrc, /DB_VERSION\s*=\s*9/, 'IndexedDB version must remain 9');
    assert.match(dbSrc, /'15\.7\.1'/, 'v15LeanSchemaVersion marker bumped to 15.7.1');
    for (const f of ['js/progression.js', 'js/cloud-sync.js', 'js/combat-scheduler.js', 'js/export-guide.js', 'js/app.js']) {
        const src = read(f);
        assert.ok(!src.includes('nordic-curl-progression'),
            `${f} must not reference the new exercise (engine/sync/scheduler/export untouched)`);
        assert.ok(!src.includes('d5-facepull-lateral'),
            `${f} must not reference the new pair (engine/sync/scheduler/export untouched)`);
    }
});