/**
 * Combat Scheduler Module for FitUp
 * Pure weekly-permutation optimizer for the Combat Training Integration mode.
 *
 * The FitUp program is weekday-anchored: every week block in data.daily is
 * ordered Mon..Sun (blockPos 0..6). This module computes an optimal permutation
 * of the 7 day-types across the 7 weekdays so that combat class days and the
 * auto-assigned practice day fall on stackable cardio/recovery slots, while
 * strength days, rest placement and program logic stay intact.
 *
 * Deterministic, side-effect free, unit-testable in Node and browser.
 */
(function (root, factory) {
    if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        root.CombatScheduler = factory();
    }
})(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    // ---- Day-type base offsets (position within a data.daily week block) ----
    const BASE = { LEGS: 0, ZONE2: 1, PUSH: 2, RECOVERY: 3, PULL: 4, VO2: 5, REST: 6 };
    const NAMES = ['Legs', 'Zone 2', 'Push', 'Active Recovery', 'Pull', 'VO2 Max', 'Rest'];
    const HOST_TYPE_BY_OFFSET = { 1: 'zone2', 3: 'recovery', 5: 'vo2' };
    const STRENGTH = [BASE.LEGS, BASE.PUSH, BASE.PULL];

    // Soft-cost matrix (from the interference analysis in plans/combat-integration-v1.md)
    const COST = {
        pushAfterClass: 3,        // shoulder/triceps fatigue before pressing
        pullAfterClass: 2,        // grip/forearm fatigue
        legsAfterClass: 1,        // stance/footwork calves
        pullAfterPractice: 3,     // wrist/grip before towel hang & pull-ups
        pushAfterPractice: 2,     // wrists/shoulders
        strengthBeforeClass: 1,   // energy/time pressure
        strengthConsecutive: 2,   // spacing loss per pair
        legsAfterVO2: 2,          // heavy legs after intervals
        restNotBeforeLegs: 1,     // original recovery->legs pattern
        classOnRecovery: 1,       // recovery erosion
        practiceOnZone2: 1,       // bag stacks worse on treadmill day
        practiceOnVO2: 2,         // bag stacks worst on hard interval day
        practiceAdjacentClass: 1, // motor learning prefers distributed practice
        classAdjacent: 2,         // user-fixed input, reported as warning
        displacement: 1.0         // stability - minimal reshuffle (overrides ties toward identity)
    };

    /** JS getDay() (0=Sun..6=Sat) -> week block position (0=Mon..6=Sun) */
    function blockPosOf(jsDow) { return (((jsDow - 1) % 7) + 7) % 7; }

    function identityPerm() { return [0, 1, 2, 3, 4, 5, 6]; }

    function isStrength(off) { return STRENGTH.includes(off); }

    function strengthAfterCost(off) {
        if (off === BASE.PUSH) return COST.pushAfterClass;
        if (off === BASE.PULL) return COST.pullAfterClass;
        if (off === BASE.LEGS) return COST.legsAfterClass;
        return 0;
    }

    function strengthAfterPracticeCost(off) {
        if (off === BASE.PULL) return COST.pullAfterPractice;
        if (off === BASE.PUSH) return COST.pushAfterPractice;
        return 0;
    }

    /** Generate all permutations of [0..n-1] (lexicographic; n <= 7 -> 5040 max) */
    function permutations(n) {
        const a = Array.from({ length: n }, (_, i) => i);
        const out = [];
        const rec = (k) => {
            if (k === n) { out.push(a.slice()); return; }
            for (let i = k; i < n; i++) {
                [a[k], a[i]] = [a[i], a[k]];
                rec(k + 1);
                [a[k], a[i]] = [a[i], a[k]];
            }
        };
        rec(0);
        return out;
    }

    /** (tiebreak) lexicographically smaller permutation wins */
    function lexLess(a, b) {
        for (let i = 0; i < a.length; i++) {
            if (a[i] !== b[i]) return a[i] < b[i] ? -1 : 1;
        }
        return 0;
    }

    function cyclicDist(a, b) {
        const d = Math.abs(a - b);
        return Math.min(d, 7 - d);
    }

    /** Score a permutation (perm[blockPos] = baseOffset) for the given combat blocks */
    function scorePerm(perm, classBlocks, practiceBlock) {
        let cost = 0;

        // Stability: minimal displacement from identity
        for (let bp = 0; bp < 7; bp++) {
            if (perm[bp] !== bp) cost += COST.displacement;
        }

        // Strength spacing: consecutive strength days (cyclic)
        for (let bp = 0; bp < 7; bp++) {
            const next = perm[(bp + 1) % 7];
            if (isStrength(perm[bp]) && isStrength(next)) cost += COST.strengthConsecutive;
        }

        // Legs immediately after VO2-type day
        for (let bp = 0; bp < 7; bp++) {
            if (perm[bp] === BASE.VO2 && perm[(bp + 1) % 7] === BASE.LEGS) cost += COST.legsAfterVO2;
        }

        // Rest placement: prefer rest immediately before Legs
        for (let bp = 0; bp < 7; bp++) {
            if (perm[bp] === BASE.REST && perm[(bp + 1) % 7] !== BASE.LEGS) cost += COST.restNotBeforeLegs;
        }

        // Class-day interference
        for (const cb of classBlocks) {
            // day after class hosts a strength day?
            const after = perm[(cb + 1) % 7];
            if (isStrength(after)) cost += strengthAfterCost(after);
            // day before class hosts strength?
            const before = perm[(cb + 6) % 7];
            if (isStrength(before)) cost += COST.strengthBeforeClass;
            // class hosted on recovery slot erodes recovery
            if (perm[cb] === BASE.RECOVERY) cost += COST.classOnRecovery;
        }

        // Class adjacent to class
        if (classBlocks.length >= 2) {
            for (let i = 0; i < classBlocks.length; i++) {
                for (let j = i + 1; j < classBlocks.length; j++) {
                    if (cyclicDist(classBlocks[i], classBlocks[j]) === 1) cost += COST.classAdjacent;
                }
            }
        }

        // Practice-day interference
        if (practiceBlock !== null) {
            if (perm[practiceBlock] === BASE.ZONE2) cost += COST.practiceOnZone2;
            if (perm[practiceBlock] === BASE.VO2) cost += COST.practiceOnVO2;
            // bag work day before grip/strength day
            const afterPractice = perm[(practiceBlock + 1) % 7];
            cost += strengthAfterPracticeCost(afterPractice);
            // practice adjacent to a class day -> less distributed learning
            for (const cb of classBlocks) {
                if (cyclicDist(practiceBlock, cb) === 1) cost += COST.practiceAdjacentClass;
            }
        }

        return cost;
    }

    /**
     * Compute the optimal weekly permutation.
     *
     * @param {Object} opts
     * @param {number[]} opts.classDays - JS getDay() indices (0=Sun..6=Sat), 1 or 2 unique values
     * @param {string} opts.practice - 'auto' | 'off' (auto-assigns the optimal practice day)
     * @returns {Object} { practiceDay, permutation, hosts, score, warnings }
     *   permutation[blockPos] = baseOffset; hosts maps 'class1'|'class2'|'practice' to a host type
     *   ('zone2' | 'vo2' | 'recovery').
     */
    /**
     * Hard "hardest-class" constraint: the user-specified hard class day must
     * host the VO2 Max slot (class replaces the 4x4). Applied as a hard filter
     * when a valid permutation exists; otherwise the preference is silently
     * relaxed (feasibility is always preserved).
     */
    function hardClassRequiredBlock(classBlocks, hardClass) {
        if (!hardClass || hardClass === 'auto' || classBlocks.length < 2) return -1;
        return hardClass === 'first' ? classBlocks[0] : classBlocks[1];
    }

    function hasHardClassFeasible(allPerms, combatBlocks, hardBlock) {
        for (const perm of allPerms) {
            let ok = true;
            for (const cb of combatBlocks) {
                if (isStrength(perm[cb]) || perm[cb] === BASE.REST) { ok = false; break; }
            }
            if (ok && perm[hardBlock] === BASE.VO2) return true;
        }
        return false;
    }

    function computeWeek(opts) {
        const classDays = (opts && opts.classDays || [])
            .filter((d, i, arr) => Number.isInteger(d) && d >= 0 && d <= 6 && arr.indexOf(d) === i);
        if (classDays.length === 0 || classDays.length > 2) {
            throw new Error('classDays must contain 1 or 2 unique weekday indices (JS getDay 0-6)');
        }
        const practice = opts && opts.practice === 'off' ? 'off' : 'auto';
        const hardClass = opts && opts.hardClass ? opts.hardClass : 'auto';

        const classBlocks = classDays.map(blockPosOf);
        const practiceOptions = practice === 'off'
            ? [null]
            : [0, 1, 2, 3, 4, 5, 6].filter(bp => !classBlocks.includes(bp));

        const hardBlock = hardClassRequiredBlock(classBlocks, hardClass);
        const enforceHardClass = hardBlock >= 0 && classDays.length >= 2;

        let best = null;
        const allPerms = permutations(7);

        for (const practiceBlock of practiceOptions) {
            // If the hardClass preference is enforceable for this practice layout,
            // restrict the search to permutations honoring it.
            const combatBlocks = practiceBlock === null ? classBlocks : classBlocks.concat([practiceBlock]);
            const enforceHere = enforceHardClass && hasHardClassFeasible(allPerms, combatBlocks, hardBlock);
            const allowed = enforceHere
                ? allPerms.filter(perm => {
                    let ok = true;
                    for (const cb of combatBlocks) {
                        if (isStrength(perm[cb]) || perm[cb] === BASE.REST) { ok = false; break; }
                    }
                    return ok && perm[hardBlock] === BASE.VO2;
                })
                : allPerms;

            for (const perm of allowed) {
                // Hard constraints:
                // 1. Combat days never host strength day-types
                // 2. Combat days never host Rest
                let ok = true;
                for (const cb of combatBlocks) {
                    if (isStrength(perm[cb]) || perm[cb] === BASE.REST) { ok = false; break; }
                }
                if (!ok) continue;

                const score = scorePerm(perm, classBlocks, practiceBlock);
                const candidate = {
                    practiceDay: practiceBlock === null ? null : ((practiceBlock + 1) % 7), // JS getDay convention
                    permutation: perm.slice(),
                    score
                };
                if (!best || score < best.score || (score === best.score && lexLess(perm, best.permutation) < 0)) {
                    best = candidate;
                }
            }
        }

        // Build hosts map (kind -> host type) and warnings
        const hosts = {};
        if (classDays.length >= 1) hosts.class1 = HOST_TYPE_BY_OFFSET[best.permutation[classBlocks[0]]] || 'other';
        if (classDays.length >= 2) hosts.class2 = HOST_TYPE_BY_OFFSET[best.permutation[classBlocks[1]]] || 'other';
        if (best.practiceDay !== null) hosts.practice = HOST_TYPE_BY_OFFSET[best.permutation[blockPosOf(best.practiceDay)]] || 'other';

        const warnings = [];
        if (classDays.length === 2 && cyclicDist(classBlocks[0], classBlocks[1]) === 1) {
            warnings.push('class_days_adjacent');
        }
        for (const cb of classBlocks) {
            if (best.permutation[cb] === BASE.RECOVERY) warnings.push('class_on_recovery');
        }
        if (best.practiceDay !== null && best.permutation[best.practiceDay] === BASE.VO2) {
            warnings.push('practice_on_vo2');
        }
        // Force at least one stable warning array element for UI purposes
        if (warnings.length === 0) warnings.push('optimal');

        return { practiceDay: best.practiceDay, permutation: best.permutation, hosts, score: best.score, warnings };
    }

    /**
     * Resolve the active era for a given dayIndex.
     * history is append-only: [{ from: number, ...configuration }].
     * @param {Object} settings - stored combatSchedule setting (or null)
     * @param {number} dayIndex
     * @returns {Object|null} the active era, or null if combat mode off / never configured
     */
    function eraForDayIndex(settings, dayIndex) {
        if (!settings || !Array.isArray(settings.history) || settings.history.length === 0) return null;
        let active = null;
        for (const era of settings.history) {
            if (typeof era.from === 'number' && dayIndex >= era.from) active = era;
        }
        return active && active.enabled ? active : null;
    }

    /**
     * Weekday label of a day-type offset for preview grids.
     */
    function offsetName(offset) { return NAMES[offset] || `Type ${offset}`; }

    /**
     * Map a JS day-of-week to its role in the active combat config.
     * @returns {Object|null} { kind, hostType, hostOffset, guidance } or null if not a combat day
     */
    function combatInfoForDay(settings, dayIndex, jsDow) {
        const era = eraForDayIndex(settings, dayIndex);
        if (!era) return null;
        const bp = blockPosOf(jsDow);
        const hostOffset = era.perm ? era.perm[bp] : bp;
        const hostType = HOST_TYPE_BY_OFFSET[hostOffset] || 'other';

        let kind = null;
        if (Array.isArray(era.classDays)) {
            if (era.classDays[0] === jsDow) kind = 'class1';
            else if (era.classDays[1] === jsDow) kind = 'class2';
        }
        if (!kind && era.practiceDay === jsDow) kind = 'practice';
        if (!kind) return null;

        let guidance = null;
        if (kind === 'practice') {
            guidance = 'combat_guidance_practice';
        } else if (hostType === 'zone2') {
            guidance = 'combat_guidance_zone2';
        } else if (hostType === 'vo2') {
            guidance = 'combat_guidance_vo2';
        } else if (hostType === 'recovery') {
            guidance = 'combat_guidance_class_recovery';
        } else {
            guidance = 'combat_warning_strength_host';
        }
        return { kind, hostType, hostOffset, guidance };
    }

    return {
        BASE,
        NAMES,
        blockPosOf,
        identityPerm,
        computeWeek,
        eraForDayIndex,
        combatInfoForDay,
        offsetName
    };
});