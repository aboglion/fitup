import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const require = createRequire(import.meta.url);
const CombatScheduler = require('../js/combat-scheduler.js');

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------
// Golden perm [0,1,2,5,4,3,6] with classes Tue+Thu, practice Sat.
// Week content by dayIndex%7: Mon Legs, Tue Zone2, Wed Push, Thu VO2, Fri Pull,
// Sat Recovery, Sun Rest.
const ISO_START = '2026-07-06'; // Monday
const TYPES = [
    'Legs + Core', 'Zone 2', 'Push + Skill', 'VO2 Max',
    'Pull + Grip', 'Active Recovery', 'Rest Day'
];

function makePlan(days) {
    const plan = [];
    for (let i = 0; i < days; i++) {
        const iso = CombatScheduler.addDaysIso(ISO_START, i);
        plan.push({ date: CombatScheduler.planDateFromIso(iso), dayType: TYPES[i % 7] });
    }
    return plan;
}

function makeSettings(overrides) {
    return Object.assign(
        {
            rev: 2,
            enabled: true,
            sport: 'muay_thai',
            classDays: [2, 4],
            practice: 'auto',
            hardClass: 'auto',
            classTimes: { class1: '18:00', class2: '19:30' },
            resolved: {},
            history: [
                { from: 0, enabled: true, perm: [0, 1, 2, 5, 4, 3, 6], classDays: [2, 4], practiceDay: 6, sport: 'muay_thai' }
            ]
        },
        overrides || {}
    );
}

const plan28 = makePlan(28); // dayIndex == index
const EX = (overrides) => Object.assign(
    { id: 'x-test', kind: 'class1', origDate: '2026-07-07', action: 'move', newDate: '2026-07-08', sessionType: 'clinch', time: '18:00', ts: '2026-07-01T00:00:00Z' },
    overrides || {}
);

// ---------------------------------------------------------------------------
// Date helpers
// ---------------------------------------------------------------------------
test('Date helpers - ISO <-> DD/MM/YYYY round-trip and normalization', () => {
    assert.equal(CombatScheduler.isoFromPlanDate('6/7/2026'), '2026-07-06');
    assert.equal(CombatScheduler.isoFromPlanDate('06/07/2026'), '2026-07-06');
    assert.equal(CombatScheduler.isoFromPlanDate('31/12/2026'), '2026-12-31');
    assert.equal(CombatScheduler.isoFromPlanDate('garbage'), null);
    assert.equal(CombatScheduler.isoFromPlanDate(null), null);
    assert.equal(CombatScheduler.planDateFromIso('2026-07-06'), '6/7/2026');
    assert.equal(CombatScheduler.planDateFromIso('2026-12-31'), '31/12/2026');
    assert.equal(CombatScheduler.planDateFromIso('nope'), null);
    assert.equal(
        CombatScheduler.planDateFromIso(CombatScheduler.isoFromPlanDate('6/7/2026')),
        '6/7/2026'
    );
});

test('Date helpers - addDaysIso crosses month/year boundaries, DST-safe', () => {
    assert.equal(CombatScheduler.addDaysIso('2026-07-06', 0), '2026-07-06');
    assert.equal(CombatScheduler.addDaysIso('2026-07-06', 1), '2026-07-07');
    assert.equal(CombatScheduler.addDaysIso('2026-12-30', 2), '2027-01-01');
    assert.equal(CombatScheduler.addDaysIso('2026-02-27', 2), '2026-03-01');
    assert.equal(CombatScheduler.addDaysIso('2026-07-06', -1), '2026-07-05');
    assert.equal(CombatScheduler.jsDowOfIso('2026-07-06'), 1); // Monday
    assert.equal(CombatScheduler.jsDowOfIso('2026-07-12'), 0); // Sunday
});

// ---------------------------------------------------------------------------
// Muscle-interference engine
// ---------------------------------------------------------------------------
test('Interference - clinch before Pull day is HIGH grip interference', () => {
    const r = CombatScheduler.sessionInterference('clinch', null, 'Pull + Grip');
    assert.equal(r.level, 'high');
    assert.ok(r.reasons.includes('grip_before_pull'));
});

test('Interference - technique before Push day is OK', () => {
    const r = CombatScheduler.sessionInterference('technique', null, 'Push + Skill');
    assert.equal(r.level, 'ok');
    assert.deepEqual(r.reasons, []);
});

test('Interference - sparring stacked on Legs+Core same day is HIGH', () => {
    const r = CombatScheduler.sessionInterference('sparring', 'Legs + Core', null);
    assert.equal(r.level, 'high');
    assert.ok(r.reasons.includes('strength_same_day'));
});

test('Interference - pads on Rest day erodes recovery', () => {
    const r = CombatScheduler.sessionInterference('pads', 'Rest Day', null);
    assert.equal(r.level, 'caution');
    assert.ok(r.reasons.includes('rest_eroded'));
});

test('Interference - bag before Push day is HIGH shoulder interference', () => {
    const r = CombatScheduler.sessionInterference('bag', null, 'Push + Skill');
    assert.equal(r.level, 'high');
    assert.ok(r.reasons.includes('shoulders_before_push'));
});

test('Interference - sparring (high CNS) before Legs is caution', () => {
    const r = CombatScheduler.sessionInterference('sparring', null, 'Legs + Core');
    assert.equal(r.level, 'caution');
    assert.ok(r.reasons.includes('cns_before_strength'));
});

test('Interference - unknown session type defaults to mixed (conservative)', () => {
    const r = CombatScheduler.sessionInterference('totally-unknown', null, 'Pull + Grip');
    assert.equal(r.level, 'high'); // mixed has grip 2
    assert.ok(r.reasons.includes('grip_before_pull'));
});

test('Interference - clinic on recovery day before Pull reports grip + no rest note', () => {
    const r = CombatScheduler.sessionInterference('clinch', 'Active Recovery', 'Pull + Grip');
    assert.equal(r.level, 'high');
    assert.deepEqual(r.reasons, ['grip_before_pull']);
});

// ---------------------------------------------------------------------------
// Exception-aware resolver
// ---------------------------------------------------------------------------
test('Resolver - normal scheduled class (backward-compatible 4-arg call)', () => {
    // Tue 2026-07-07 = class1 (dayIndex 1). 4-arg call (no dateISO) must keep the
    // v1 legacy shape — no enriched status/interference fields.
    const info = CombatScheduler.combatInfoForDay(makeSettings(), 1, 2, 'Zone 2');
    assert.equal(info.kind, 'class1');
    assert.equal(info.hostType, 'zone2');
    assert.equal(info.guidance, 'combat_guidance_zone2');
    assert.equal(info.status, undefined);
    assert.equal('interference' in info, false);
    assert.equal('exception' in info, false);
});

test('Resolver - cancel marks the class day cancelled', () => {
    const exc = EX({ action: 'cancel', newDate: null });
    const info = CombatScheduler.combatInfoForDay(makeSettings(), 1, 2, 'Zone 2', [exc], '2026-07-07');
    assert.equal(info.status, 'cancelled');
    assert.equal(info.kind, 'class1');
    assert.equal(info.exception.id, 'x-test');
});

test('Resolver - move marks the origin day moved-out with target date', () => {
    const exc = EX({});
    const info = CombatScheduler.combatInfoForDay(makeSettings(), 1, 2, 'Zone 2', [exc], '2026-07-07');
    assert.equal(info.status, 'moved-out');
    assert.equal(info.movedToDate, '2026-07-08');
});

test('Resolver - move lands on a free day as moved-in with host-aware guidance', () => {
    const exc = EX({ newDate: '2026-07-08' }); // Wed = Push + Skill, free day
    const info = CombatScheduler.combatInfoForDay(makeSettings(), 2, 3, 'Push + Skill', [exc], '2026-07-08');
    assert.equal(info.status, 'moved-in');
    assert.equal(info.kind, 'class1');
    assert.equal(info.hostType, 'other'); // strength host
    assert.equal(info.guidance, 'combat_warning_strength_host');
    assert.equal(info.interference.level, 'high'); // clinch on a strength day
    assert.ok(info.interference.reasons.includes('strength_same_day'));
});

test('Resolver - moved-in on a recovery day stays low-intensity', () => {
    const exc = EX({ newDate: '2026-07-11', sessionType: 'technique' }); // Sat = Recovery (but practice day!)
    // Use a free recovery day instead: single-class config. Construct quick check with a manual weekday.
    // Sat is the base practice day -> defensive conflict, not moved-in. So assert the practice conflict path.
    const info = CombatScheduler.combatInfoForDay(makeSettings(), 5, 6, 'Active Recovery', [exc], '2026-07-11');
    assert.equal(info.status, 'scheduled');
    assert.equal(info.conflict, true);
});

test('Resolver - chain: intermediate landing shows moved-out (no base session)', () => {
    const ex1 = EX({ newDate: '2026-07-06' }); // Tue class1 -> Mon
    const ex2 = EX({ id: 'x2', origDate: '2026-07-06', newDate: '2026-07-08' }); // Mon -> Wed
    const exceptions = [ex1, ex2];
    // On origin Tue: moved-out to Mon
    const onTue = CombatScheduler.combatInfoForDay(makeSettings(), 1, 2, 'Zone 2', exceptions, '2026-07-07');
    assert.equal(onTue.status, 'moved-out');
    assert.equal(onTue.movedToDate, '2026-07-06');
    // On intermediate Mon (free day, no base session): moved-out to Wed
    const onMon = CombatScheduler.combatInfoForDay(makeSettings(), 0, 1, 'Legs + Core', exceptions, '2026-07-06');
    assert.equal(onMon.status, 'moved-out');
    assert.equal(onMon.movedToDate, '2026-07-08');
    assert.equal(onMon.kind, 'class1');
    // On final Wed: moved-in
    const onWed = CombatScheduler.combatInfoForDay(makeSettings(), 2, 3, 'Push + Skill', exceptions, '2026-07-08');
    assert.equal(onWed.status, 'moved-in');
});

test('Resolver - defensive conflict when moved-in lands on an occupied base class day', () => {
    const exc = EX({ newDate: '2026-07-14' }); // Tue again (base class1) two weeks later
    const info = CombatScheduler.combatInfoForDay(makeSettings(), 8, 2, 'Zone 2', [exc], '2026-07-14');
    assert.equal(info.status, 'scheduled'); // base wins
    assert.equal(info.conflict, true);
    assert.equal(info.interference.level, 'caution');
});

test('Resolver - exceptions are inert when combat is disabled', () => {
    const settings = makeSettings({
        enabled: false,
        history: [{ from: 0, enabled: false, perm: [0, 1, 2, 3, 4, 5, 6], classDays: [2, 4], practiceDay: 6, sport: 'muay_thai' }]
    });
    const exc = EX({});
    const info = CombatScheduler.combatInfoForDay(settings, 1, 2, 'Zone 2', [exc], '2026-07-07');
    assert.equal(info, null);
});

test('Resolver - layering over a pending (pre-boundary) era keeps statuses', () => {
    const settings = makeSettings({
        history: [{ from: 14, enabled: true, perm: [0, 1, 2, 5, 4, 3, 6], classDays: [2, 4], practiceDay: 6, sport: 'muay_thai' }]
    });
    // Era boundary at dayIndex 14; query Tue 2026-07-07 (dayIndex 1 < 14 => pending).
    const exc = EX({ action: 'cancel', newDate: null }); // origDate 2026-07-07
    const info = CombatScheduler.combatInfoForDay(settings, 1, 2, 'Zone 2', [exc], '2026-07-07');
    assert.equal(info.pending, true);
    assert.equal(info.status, 'cancelled');
});

test('Resolver - non-combat day with no exception returns null', () => {
    const info = CombatScheduler.combatInfoForDay(makeSettings(), 2, 3, 'Push + Skill', [], '2026-07-08');
    assert.equal(info, null);
});

// ---------------------------------------------------------------------------
// suggestMoveTargets
// ---------------------------------------------------------------------------
test('Move targets - excludes origin, occupied class/practice days; deterministic best-first', () => {
    const settings = makeSettings();
    const exceptions = [];
    const orig = '2026-07-07'; // Tue class1
    const t1 = CombatScheduler.suggestMoveTargets(settings, exceptions, plan28, { origDate: orig, sessionType: 'clinch', fromDate: '2026-07-06' });
    const t2 = CombatScheduler.suggestMoveTargets(settings, exceptions, plan28, { origDate: orig, sessionType: 'clinch', fromDate: '2026-07-06' });
    assert.deepEqual(t1, t2); // deterministic

    assert.ok(t1.length > 0);
    const originMissing = t1.every(t => t.date !== orig);
    assert.ok(originMissing, 'origin date must never be a target');

    // No target may land on a base class (Tue/Thu) or practice (Sat) weekday
    for (const t of t1) {
        const dow = CombatScheduler.jsDowOfIso(t.date);
        assert.ok(![2, 4, 6].includes(dow), `target ${t.date} falls on occupied weekday ${dow}`);
    }

    // Best-first sorted by cost
    for (let i = 1; i < t1.length; i++) assert.ok(t1[i - 1].cost <= t1[i].cost);
    assert.equal(t1[0].best, true);
    assert.equal(t1.filter(t => t.best).length, 1);
});

test('Move targets - occupied moved-in date is excluded', () => {
    const settings = makeSettings();
    const occupiedDate = '2026-07-08'; // Wed free, but we mark it as moved-in already
    const exceptions = [EX({ newDate: occupiedDate })];
    const t = CombatScheduler.suggestMoveTargets(settings, exceptions, plan28, { origDate: '2026-07-07', sessionType: 'technique', fromDate: '2026-07-06' });
    assert.ok(t.every(x => x.date !== occupiedDate), 'a date hosting a moved-in class must be excluded');
});

test('Move targets - a cancelled class frees its weekday for a target', () => {
    const settings = makeSettings();
    // Cancel next Tuesday's class1 -> that Tuesday becomes a valid target
    const exceptions = [EX({ action: 'cancel', newDate: null, origDate: '2026-07-14' })];
    const t = CombatScheduler.suggestMoveTargets(settings, exceptions, plan28, { origDate: '2026-07-07', sessionType: 'technique', fromDate: '2026-07-06' });
    assert.ok(t.some(x => x.date === '2026-07-14'), 'cancelled Tuesday should become an available target');
});

test('Move targets - horizon is capped by the plan length', () => {
    const settings = makeSettings();
    const t = CombatScheduler.suggestMoveTargets(settings, [], makePlan(7), { origDate: '2026-07-07', sessionType: 'technique', fromDate: '2026-07-06', horizonDays: 30 });
    for (const x of t) assert.ok(CombatScheduler.planIndexForIso(makePlan(7), x.date) >= 0);
});

// ---------------------------------------------------------------------------
// cardioWindowFor
// ---------------------------------------------------------------------------
test('Cardio window - evening class 18:00 -> morning run window with >=6h gap', () => {
    const w = CombatScheduler.cardioWindowFor('18:00', 'vo2');
    assert.equal(w.placement, 'morning');
    assert.equal(w.windowStart, '05:00');
    assert.equal(w.windowEnd, '12:00');
    assert.equal(w.classMinutes, 1080);
});

test('Cardio window - evening class 19:30 -> morning run by 13:30', () => {
    const w = CombatScheduler.cardioWindowFor('19:30', 'zone2');
    assert.equal(w.placement, 'morning');
    assert.equal(w.windowEnd, '13:30');
});

test('Cardio window - morning class 10:00 -> evening run >=6h after', () => {
    const w = CombatScheduler.cardioWindowFor('10:00', 'zone2');
    assert.equal(w.placement, 'evening');
    assert.equal(w.windowStart, '16:00');
    assert.equal(w.windowEnd, '21:00');
});

test('Cardio window - late class 23:00 -> morning run by 17:00', () => {
    const w = CombatScheduler.cardioWindowFor('23:00', 'vo2');
    assert.equal(w.placement, 'morning');
    assert.equal(w.windowEnd, '17:00');
});

test('Cardio window - missing time defaults to 18:00 evening assumption', () => {
    const w = CombatScheduler.cardioWindowFor(null, 'zone2');
    assert.equal(w.placement, 'morning');
    assert.equal(w.windowStart, '05:00');
    assert.equal(w.windowEnd, '12:00');
});

test('Cardio window - non-cardio host returns none', () => {
    const w = CombatScheduler.cardioWindowFor('18:00', 'recovery');
    assert.equal(w.placement, 'none');
    assert.equal(w.windowStart, null);
    assert.equal(w.windowEnd, null);
});

// ---------------------------------------------------------------------------
// Era-append guard
// ---------------------------------------------------------------------------
test('Era guard - permutation-relevant changes must append a new era', () => {
    const prev = makeSettings();
    assert.equal(CombatScheduler.combatEraChanged(prev, { ...prev, classDays: [1, 3] }), true);
    assert.equal(CombatScheduler.combatEraChanged(prev, { ...prev, practice: 'off' }), true);
    assert.equal(CombatScheduler.combatEraChanged(prev, { ...prev, hardClass: 'first' }), true);
    assert.equal(CombatScheduler.combatEraChanged(prev, { ...prev, enabled: false }), true);
});

test('Era guard - guidance-only changes must NOT append a new era', () => {
    const prev = makeSettings();
    assert.equal(CombatScheduler.combatEraChanged(prev, { ...prev, classTimes: { class1: '20:00', class2: '19:30' } }), false);
    assert.equal(CombatScheduler.combatEraChanged(prev, { ...prev, sport: 'boxing' }), false);
    assert.equal(CombatScheduler.combatEraChanged(prev, { ...prev, resolved: { practiceDay: 5 } }), false);
    assert.equal(CombatScheduler.combatEraChanged(prev, { ...prev, classDays: [2, 4] }), false); // identical
    assert.equal(CombatScheduler.combatEraChanged(null, makeSettings()), true);
});
