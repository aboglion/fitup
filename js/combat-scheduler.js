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

    // ---- Combat Flexibility v2: session-type muscle profiles (load 1-5, cns 1-5, fatigue 0-3) ----
    const SESSION_PROFILES = {
        technique: { load: 1, cns: 1, muscles: { hips: 1, core: 1 } },
        bag: { load: 2, cns: 2, muscles: { wrists: 2, forearms: 2, shoulders: 2, calves: 1 } },
        pads: { load: 3, cns: 3, muscles: { shoulders: 3, triceps: 2, core: 2, calves: 2 } },
        sparring: { load: 4, cns: 4, muscles: { shoulders: 3, core: 3, neck: 2, calves: 2, grip: 2 } },
        clinch: { load: 4, cns: 3, muscles: { grip: 3, forearms: 3, neck: 3, core: 2, lumbar: 2 } },
        mixed: { load: 3, cns: 3, muscles: { shoulders: 2, grip: 2, core: 2, calves: 2 } }
    };

    // Muscle fatigue loads of the program day-types (used for interference scoring)
    const DAYTYPE_MUSCLES = {
        legs: { quads: 3, glutes: 3, calves: 2, core: 1 },
        push: { shoulders: 3, triceps: 3, chest: 2 },
        pull: { grip: 3, forearms: 2, lats: 2, biceps: 2 },
        zone2: { calves: 1 },
        vo2: { calves: 2, quads: 1 },
        recovery: {},
        rest: {}
    };

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

    // ========================================================================
    // Combat Flexibility v2 — pure helpers (side-effect free, unit-testable)
    // ========================================================================

    /** 'DD/MM/YYYY' -> 'YYYY-MM-DD' (normalizes 1-digit day/month). */
    function isoFromPlanDate(planDate) {
        if (!planDate) return null;
        const m = String(planDate).trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
        if (!m) return null;
        const dd = String(Number(m[1])).padStart(2, '0');
        const mm = String(Number(m[2])).padStart(2, '0');
        return m[3] + '-' + mm + '-' + dd;
    }

    /** 'YYYY-MM-DD' -> 'DD/MM/YYYY'. */
    function planDateFromIso(isoDate) {
        if (!isoDate) return null;
        const m = String(isoDate).trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
        if (!m) return null;
        return Number(m[3]) + '/' + Number(m[2]) + '/' + m[1];
    }

    /** Add days to an ISO date (local calendar arithmetic, DST-safe). */
    function addDaysIso(isoDate, days) {
        if (!isoDate) return null;
        const [y, m, d] = String(isoDate).split('-').map(Number);
        const dt = new Date(y, (m || 1) - 1, (d || 1) + days);
        const yy = dt.getFullYear();
        const mm = String(dt.getMonth() + 1).padStart(2, '0');
        const dd = String(dt.getDate()).padStart(2, '0');
        return yy + '-' + mm + '-' + dd;
    }

    /** Local today as ISO 'YYYY-MM-DD'. */
    function todayIso() {
        const now = new Date();
        return now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0');
    }

    /** JS getDay() (0=Sun..6=Sat) of an ISO date. */
    function jsDowOfIso(isoDate) {
        if (!isoDate) return null;
        const [y, m, d] = String(isoDate).split('-').map(Number);
        return new Date(y, (m || 1) - 1, d || 1).getDay();
    }

    /** 'HH:MM' (24h) -> minutes since midnight; null when invalid/absent. */
    function parseTime(str) {
        if (!str) return null;
        const m = String(str).trim().match(/^(\d{1,2}):(\d{2})$/);
        if (!m) return null;
        const h = Number(m[1]);
        const min = Number(m[2]);
        if (h > 23 || min > 59) return null;
        return h * 60 + min;
    }

    /** minutes since midnight -> 'HH:MM'. */
    function fmtTime(min) {
        const h = Math.floor(min / 60);
        const mm = min % 60;
        return String(h).padStart(2, '0') + ':' + String(mm).padStart(2, '0');
    }

    /**
     * Muscle-interference guidance for a combat session.
     * @param {string|null} sessionType - technique|bag|pads|sparring|clinch|mixed
     * @param {string|null} hostDayType - day-type of the SAME day (class stacked on it)
     * @param {string|null} nextDayType - day-type of the FOLLOWING calendar day
     * @returns {{ level:'ok'|'caution'|'high', reasons:string[], load:number, cns:number }}
     */
    function sessionInterference(sessionType, hostDayType, nextDayType) {
        const prof = SESSION_PROFILES[sessionType] || SESSION_PROFILES.mixed;
        const notes = [];
        const hostKey = dayTypeMuscleKey(hostDayType);
        const nextKey = dayTypeMuscleKey(nextDayType);
        const overlap = (a, b) => {
            if (!a || !b) return 0;
            let sum = 0;
            for (const muscle of Object.keys(a)) {
                if (b[muscle]) sum += Math.min(a[muscle], b[muscle]);
            }
            return sum;
        };

        // Same-day stacking on Rest / strength content
        if (hostKey === 'rest') notes.push({ level: 'caution', key: 'rest_eroded' });
        if (hostKey && hostKey !== 'rest' && hostKey !== 'recovery' && hostKey !== 'zone2' && hostKey !== 'vo2') {
            const ov = overlap(prof.muscles, DAYTYPE_MUSCLES[hostKey]);
            if (ov >= 4 || prof.load >= 3) notes.push({ level: 'high', key: 'strength_same_day' });
            else if (ov >= 2) notes.push({ level: 'caution', key: 'strength_same_day' });
        }

        // Next-day strength interference (muscle-specific)
        if (nextKey && DAYTYPE_MUSCLES[nextKey]) {
            const ov = overlap(prof.muscles, DAYTYPE_MUSCLES[nextKey]);
            if (nextKey === 'pull' && (prof.muscles.grip || 0) >= 2) {
                notes.push({ level: ov >= 2 ? 'high' : 'caution', key: 'grip_before_pull' });
            } else if (nextKey === 'push' && (prof.muscles.shoulders || 0) >= 2) {
                notes.push({ level: ov >= 2 ? 'high' : 'caution', key: 'shoulders_before_push' });
            } else if (prof.cns >= 4 && ov >= 1) {
                notes.push({ level: 'caution', key: 'cns_before_strength' });
            }
        }

        let level = 'ok';
        for (const n of notes) {
            if (n.level === 'high') level = 'high';
            else if (level !== 'high' && n.level === 'caution') level = 'caution';
        }
        return { level, reasons: notes.map(n => n.key), load: prof.load, cns: prof.cns };
    }

    /**
     * Cardio placement window for a class day.
     * Evening classes (>=16:00) prescribe a MORNING run >=6h before class;
     * morning classes (<12:00) prescribe an EVENING run >=6h after class.
     * @param {string|null} classTime - 'HH:MM' or null (default 18:00)
     * @param {string} hostType - 'zone2'|'vo2'|... (window only meaningful for cardio hosts)
     * @returns {{ placement:'morning'|'evening'|'none', classMinutes:number, windowStart:string|null, windowEnd:string|null }}
     */
    function cardioWindowFor(classTime, hostType) {
        if (hostType !== 'zone2' && hostType !== 'vo2') {
            return { placement: 'none', classMinutes: parseTime(classTime) || 18 * 60, windowStart: null, windowEnd: null };
        }
        const cm = parseTime(classTime) || 18 * 60;
        let placement;
        let ws;
        let we;
        if (cm >= 16 * 60) {
            // Evening class -> morning run: at least 6h before, never later than 12:00.
            placement = 'morning';
            ws = 5 * 60; // 05:00
            we = Math.max(cm - 6 * 60, 6 * 60); // latest start, floor 06:00
        } else {
            // Morning/midday class -> evening run: at least 6h after class.
            placement = 'evening';
            ws = Math.max(cm + 6 * 60, 16 * 60);
            we = 21 * 60; // 21:00
        }
        return { placement, classMinutes: cm, windowStart: fmtTime(ws), windowEnd: fmtTime(we) };
    }

    /** Find the plan index (== dayIndex) whose date matches the ISO date, or -1. */
    function planIndexForIso(planDays, isoDate) {
        if (!planDays || !isoDate) return -1;
        for (let i = 0; i < planDays.length; i++) {
            const d = planDays[i];
            if (d && isoFromPlanDate(d.date) === isoDate) return i;
        }
        return -1;
    }

    /**
     * True when a calendar date already hosts a combat session (base class/practice,
     * or a moved-in exception) and is therefore NOT a valid move target.
     * A base session that is itself cancelled/moved-out frees the date.
     */
    function isDateOccupied(settings, exceptions, planDays, dateIso) {
        for (const ex of (exceptions || [])) {
            if (ex && ex.action === 'move' && ex.newDate === dateIso) return true;
        }
        const idx = planIndexForIso(planDays, dateIso);
        if (idx === -1) return false;
        const jsDow = jsDowOfIso(dateIso);
        const day = planDays[idx];
        const info = combatInfoForDay(settings, idx, jsDow, day && day.dayType);
        if (!info) return false;
        for (const ex of (exceptions || [])) {
            if (ex && ex.origDate === dateIso && (ex.action === 'cancel' || ex.action === 'move')) return false;
        }
        return true;
    }

    /**
     * Rank candidate move-target dates for a class instance.
     * @param {Object|null} settings - combatSchedule setting
     * @param {Array} exceptions - combatExceptions items
     * @param {Array} planDays - plan day records indexed by dayIndex (each { date, dayType })
     * @param {Object} opts - { origDate (ISO), sessionType, horizonDays, fromDate (ISO) }
     * @returns {Array<{ date, dayType, dayIndex, level, reasons, cost, best }>} sorted best-first
     */
    function suggestMoveTargets(settings, exceptions, planDays, opts) {
        const origDate = opts && opts.origDate;
        const sessionType = (opts && opts.sessionType) || 'mixed';
        const horizon = (opts && opts.horizonDays) || 21;
        const fromIso = (opts && opts.fromDate) || todayIso();
        const origIdx = planIndexForIso(planDays, origDate);
        const candidates = [];

        for (let off = 0; off < horizon; off++) {
            const iso = addDaysIso(fromIso, off);
            if (iso === origDate) continue;
            if (isDateOccupied(settings, exceptions, planDays, iso)) continue;
            const idx = planIndexForIso(planDays, iso);
            if (idx === -1) continue; // beyond plan horizon
            const day = planDays[idx];
            const next = planDays[idx + 1];
            const prev = planDays[idx - 1];
            const inter = sessionInterference(sessionType, day && day.dayType, next && next.dayType);

            let cost = 0;
            if (inter.level === 'high') cost += 6;
            else if (inter.level === 'caution') cost += 3;
            if (prev && isStrengthDayType(prev.dayType)) cost += COST.strengthBeforeClass;
            if (isDateOccupied(settings, exceptions, planDays, addDaysIso(iso, -1)) ||
                isDateOccupied(settings, exceptions, planDays, addDaysIso(iso, 1))) {
                inter.reasons.push('sessions_adjacent');
                cost += 2;
            }
            if (origIdx >= 0) cost += Math.abs(idx - origIdx) * 0.5; // prefer close dates

            candidates.push({
                date: iso,
                dayType: (day && day.dayType) || '',
                dayIndex: idx,
                level: inter.level,
                reasons: inter.reasons,
                cost: Math.round(cost * 100) / 100,
                best: false
            });
        }

        candidates.sort((a, b) => (a.cost - b.cost) || (a.date < b.date ? -1 : 1));
        if (candidates.length) candidates[0].best = true;
        return candidates;
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
     * Map a day-type to its host offset for guidance purposes.
     */
    function mapDayTypeToOffset(dayType) {
        const t = String(dayType || '').toLowerCase();
        if (t.includes('zone 2') || t.includes('walk')) return BASE.ZONE2;
        if (t.includes('vo2')) return BASE.VO2;
        if (t.includes('recovery')) return BASE.RECOVERY;
        if (t.includes('legs')) return BASE.LEGS;
        if (t.includes('push')) return BASE.PUSH;
        if (t.includes('pull')) return BASE.PULL;
        if (t.includes('rest')) return BASE.REST;
        return null;
    }

    /** Map a day-type string to its DAYTYPE_MUSCLES key (for interference scoring). */
    function dayTypeMuscleKey(dayType) {
        const off = mapDayTypeToOffset(dayType);
        if (off === BASE.LEGS) return 'legs';
        if (off === BASE.PUSH) return 'push';
        if (off === BASE.PULL) return 'pull';
        if (off === BASE.ZONE2) return 'zone2';
        if (off === BASE.VO2) return 'vo2';
        if (off === BASE.RECOVERY) return 'recovery';
        if (off === BASE.REST) return 'rest';
        return null;
    }

    function isStrengthDayType(dayType) {
        const off = mapDayTypeToOffset(dayType);
        return off !== null && STRENGTH.includes(off);
    }

    /**
     * Map a JS day-of-week to its role in the combat config.
     *
     * Beyond the active era, this also reports combat days whose era boundary is in
     * the future (pending) — so the card/badge appears on the selected weekdays
     * immediately, using the pre-boundary (identity) content for guidance.
     *
     * @param {Object|null} settings - stored combatSchedule setting (or null)
     * @param {number} dayIndex
     * @param {number} jsDow - JS getDay() of the displayed date
     * @param {string} [actualDayType] - the day's actual content day-type (pre-boundary guidance)
     * @returns {Object|null} { kind, hostType, hostOffset, guidance, pending }
     */
    function combatInfoForDay(settings, dayIndex, jsDow, actualDayType, exceptions, dateISO) {
        let era = eraForDayIndex(settings, dayIndex);
        let pending = false;

        if (!era && settings && settings.enabled && Array.isArray(settings.history)) {
            // No active era for this dayIndex yet — find the newest enabled era
            // (its boundary may lie in the future => pending preview).
            let newestEnabled = null;
            for (const h of settings.history) {
                if (h && h.enabled) newestEnabled = h;
            }
            if (newestEnabled && typeof newestEnabled.from === 'number' && dayIndex < newestEnabled.from) {
                era = newestEnabled;
                pending = true;
            }
        }
        if (!era) return null; // combat off / never configured (exceptions are inert when disabled)

        const bp = blockPosOf(jsDow);
        let hostOffset;
        if (pending) {
            // Pre-boundary week: content is still the identity layout, so guide by
            // the day's actual content (correct for the current week).
            hostOffset = mapDayTypeToOffset(actualDayType);
            if (hostOffset === null || hostOffset === undefined) hostOffset = bp;
        } else {
            hostOffset = era.perm ? era.perm[bp] : bp;
        }
        const hostType = HOST_TYPE_BY_OFFSET[hostOffset] || 'other';

        let kind = null;
        if (Array.isArray(era.classDays)) {
            if (era.classDays[0] === jsDow) kind = 'class1';
            else if (era.classDays[1] === jsDow) kind = 'class2';
        }
        if (!kind && era.practiceDay === jsDow) kind = 'practice';

        const excs = Array.isArray(exceptions) ? exceptions : [];
        const guidanceFor = (k, hType) => {
            if (k === 'practice') return 'combat_guidance_practice';
            if (hType === 'zone2') return 'combat_guidance_zone2';
            if (hType === 'vo2') return 'combat_guidance_vo2';
            if (hType === 'recovery') return 'combat_guidance_class_recovery';
            return 'combat_warning_strength_host';
        };

        // Backward compatibility: callers that do not pass dateISO keep the v1
        // return shape (no status/interference/exception fields).
        if (typeof dateISO !== 'string') {
            if (!kind) return null;
            return { kind, hostType, hostOffset, guidance: guidanceFor(kind, hostType), pending };
        }

        // ---- Exception layer (enriched mode: dateISO provided) ----
        // Priority 1: this date is the ORIGIN of a move/cancel exception. Applies
        // even without a base-era session (chain intermediates: a class that was
        // moved here and then moved away again).
        const outEx = excs.find(e => e && e.origDate === dateISO && (e.action === 'cancel' || e.action === 'move'));
        if (outEx) {
            const status = outEx.action === 'cancel' ? 'cancelled' : 'moved-out';
            return Object.assign(
                {},
                { kind: kind || outEx.kind, hostType, hostOffset, guidance: guidanceFor(kind || outEx.kind, hostType), pending },
                { status, movedToDate: outEx.newDate || undefined, exception: outEx, interference: { level: 'ok', reasons: [] } }
            );
        }

        // Priority 2: base-era session scheduled on this date.
        if (kind) {
            const base = { kind, hostType, hostOffset, guidance: guidanceFor(kind, hostType), pending };
            // Defensive: a moved-in exception landed on a date that still has a base session
            // (should be impossible given the move invariant, but never crash on it).
            const movedIn = excs.find(e => e && e.action === 'move' && e.newDate === dateISO);
            if (movedIn) {
                return Object.assign({}, base, { status: 'scheduled', exception: movedIn, conflict: true, interference: { level: 'caution', reasons: ['sessions_adjacent'] } });
            }
            return Object.assign({}, base, { status: 'scheduled', interference: { level: 'ok', reasons: [] } });
        }

        // Priority 3: a moved-in exception landed on a free date. Host type and
        // interference are derived from THIS day's actual PLAN content, so they
        // stay correct across era boundaries and manual swaps.
        const movedIn = excs.find(e => e && e.action === 'move' && e.newDate === dateISO);
        if (!movedIn) return null;
        const mh = mapDayTypeToOffset(actualDayType);
        const mhost = HOST_TYPE_BY_OFFSET[mh] || 'other';
        const inter = sessionInterference(movedIn.sessionType, actualDayType, null);
        return {
            kind: movedIn.kind,
            hostType: mhost,
            hostOffset: mh,
            guidance: guidanceFor(movedIn.kind, mhost),
            pending,
            status: 'moved-in',
            exception: movedIn,
            interference: inter
        };
    }

    /**
     * True when a settings edit changes fields that drive the weekly permutation
     * (and therefore MUST append a new era). Guidance-only fields (classTimes,
     * sport label, resolved preview) do NOT require an era — bumping the rev alone
     * preserves history and avoids mid-week permutation churn on cosmetic edits.
     * @param {Object|null} prev - previously persisted combatSchedule
     * @param {Object|null} next - new combatSchedule
     */
    function combatEraChanged(prev, next) {
        const p = prev || {};
        const n = next || {};
        const norm = (a) => (a || []).slice().sort().join(',');
        if (!!p.enabled !== !!n.enabled) return true;
        if (norm(p.classDays) !== norm(n.classDays)) return true;
        if ((p.practice || 'auto') !== (n.practice || 'auto')) return true;
        if ((p.hardClass || 'auto') !== (n.hardClass || 'auto')) return true;
        return false;
    }

    return {
        BASE,
        NAMES,
        blockPosOf,
        identityPerm,
        computeWeek,
        eraForDayIndex,
        combatInfoForDay,
        offsetName,
        // ---- Combat Flexibility v2 exports ----
        SESSION_PROFILES,
        DAYTYPE_MUSCLES,
        sessionInterference,
        suggestMoveTargets,
        cardioWindowFor,
        isDateOccupied,
        planIndexForIso,
        combatEraChanged,
        isoFromPlanDate,
        planDateFromIso,
        addDaysIso,
        todayIso,
        jsDowOfIso,
        parseTime
    };
});