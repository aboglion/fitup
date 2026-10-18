/**
 * FitUp v15.7 Accelerated Progression Engine
 * Zero Decisions Automation Engine for Progressive Overload, Rest Adaptation,
 * Myo-Reps Cluster Tracking, Microcycle Management, and Structural Toggles.
 */

(function () {
  'use strict';

  class ProgressionEngine {
    constructor(settings) {
      this.settings = settings || window.TRAINING_DATA?.progressionSettings || {
        deloadEveryWeeks: 12,
        armBlock: {
          enabledFromWeek: 3,
          maxArmBlockExposurePerMusclePerWeek: 1,
          muscleAreaMap: {
            3: { "db-lateral-raise": "lateral-shoulder", "arm-block-lateral-raise": "lateral-shoulder", "db-oh-triceps-extension": "triceps", "arm-block-triceps-ext": "triceps" },
            5: { "db-curl": "biceps", "single-arm-curl": "biceps", "hammer-curl": "biceps", "single-arm-hammer-curl": "biceps", "arm-block-biceps-curl": "biceps" }
          }
        },
        leanMode: { enabled: true, pairs: [], circuits: [], blocks: [], toggles: [] }
      };
    }

    getExercise(exerciseId) {
      if (!window.TRAINING_DATA || !window.TRAINING_DATA.exercises) return null;
      return window.TRAINING_DATA.exercises.find(e => e.id === exerciseId) || null;
    }

    // ----------------------------
    // 1. Set Evaluation & Softened Progression
    // ----------------------------
    evaluateSetResults(exercise, setResults) {
      if (!setResults || setResults.length === 0) return 'none';
      const allAbove = setResults.every(s => s.result === 'above');
      const allInWindow = setResults.every(s => s.result === 'in_window');
      const allBelow = setResults.every(s => s.result === 'below');

      if (allAbove) return 'all_above';
      if (allInWindow) return 'all_in_window';
      if (allBelow) return 'all_below';
      return 'mixed';
    }

    checkSoftenedProgression(exercise, state, setResults, previousSessionData) {
      if (!setResults || setResults.length === 0) return false;
      if (exercise.strictProgression) return false;

      // Condition 1: All sets in current session are in_window
      const allInWindow = setResults.every(s => s.result === 'in_window');
      if (!allInWindow) return false;

      // Condition 2: All current sets reached at least windowMax - 1 reps
      const currentMinTarget = (exercise.windowMax || 12) - 1;
      const currentRepsValid = setResults.every(s => (s.reps || 0) >= currentMinTarget && !s.mechanicalStop);
      if (!currentRepsValid) return false;

      // Time Decay Check: If more than 10 days passed since previous session, disable softened progression
      if (previousSessionData && previousSessionData.lastUpdated) {
        let prevDate;
        if (previousSessionData.lastUpdated.includes('/')) {
          // DD/MM/YYYY format
          const [d, m, y] = previousSessionData.lastUpdated.split('/');
          prevDate = new Date(`${y}-${m}-${d}`);
        } else {
          // ISO string
          prevDate = new Date(previousSessionData.lastUpdated);
        }

        if (!isNaN(prevDate.getTime())) {
          const daysGap = (Date.now() - prevDate.getTime()) / (1000 * 60 * 60 * 24);
          if (daysGap > 10) {
            console.log(`[ProgressionEngine] Softened progression canceled due to time decay (gap: ${Math.round(daysGap)} days)`);
            return false;
          }
        }
      }

      // v15.7 Accelerated: single-session softened gate — the previous-session all-max
      // requirement is removed so consistent trainees progress ~2x faster.
      return true;
    }

    // ----------------------------
    // 2. Progression Decision Calculators
    // ----------------------------
    isGroupA(exercise) {
      if (!exercise) return true;
      const id = (exercise.id || '').toLowerCase();
      const cat = (exercise.category || '').toLowerCase();

      // Group B (Small / Isolation): Shoulders lateral raise, Biceps, Triceps, Calves
      if (id.includes('lateral-raise') || id.includes('single-arm-curl') || id.includes('hammer-curl') || id.includes('biceps-curl') || id.includes('triceps') || id.includes('calf')) {
        return false;
      }
      if (cat === 'arms') return false;

      // Group A (Large / Compound): Legs, Chest, Back, Shoulders compound (OHP), Glutes, Core
      return true;
    }

    getCadenceTarget(exercise) {
      // Group A: every 3rd workout (needs 2 prior sessions at current weight)
      // Group B: every 4th workout (needs 3 prior sessions at current weight)
      return this.isGroupA(exercise) ? 3 : 4;
    }

    /**
     * Calculate smart progressive sets overload based on percentage load jump to next weight
     * and exercise classification (Group A Compound vs Group B Isolation).
     * Prevents shock ("שלא יהיה מכה") when jumping weights like 6->8kg (+33.3%), 8->10kg (+25%), or 10->12kg (+20%).
     *
     * @param {Object} exercise - Exercise definition
     * @param {number} currentWeightKg - Current weight in kg
     * @param {number} sessionsAtWeight - Accumulated qualifying sessions at current weight
     * @param {number} baseSets - Default base sets for the exercise (e.g. 2 for isolation, 3 for compound)
     * @returns {number} Prescribed sets for the current session
     */
    calculatePrescribedSets(exercise, currentWeightKg, sessionsAtWeight = 0, baseSets = null) {
      if (!exercise) return baseSets || 3;
      const isGrpA = this.isGroupA(exercise);
      const defaultBase = isGrpA ? 3 : 2;
      const base = (baseSets && baseSets > 0) ? baseSets : (exercise.sets || defaultBase);

      const curW = currentWeightKg || exercise.startingWeight || (isGrpA ? 8 : 6);
      const increment = exercise.increment || 2;
      const maxW = exercise.maxWeight || 32;

      // If already at maximum weight, no jump occurs -> keep base sets
      if (curW >= maxW) return base;

      // Percentage increase of the upcoming weight jump: (increment / currentWeight) * 100
      const pctJump = (increment / curW) * 100;
      const sessions = Math.max(0, sessionsAtWeight || 0);

      // 1. Tier 1: Highest Jump >= 30% (e.g. 6 kg -> 8 kg is +33.3% jump - "הכי הרבה זה")
      // Requires volume bridge (up to +2 sets peak for Group B, +1 set for Group A, hard-capped at 4 sets max)
      if (pctJump >= 30) {
        if (isGrpA) {
          // Compound: 3 -> 4 sets on 2nd+ session (capped at 4 sets max)
          return sessions >= 1 ? Math.min(4, base + 1) : base;
        } else {
          // Isolation (e.g. Lateral Raise): 2 sets -> 3 sets -> 4 sets before advancing to 8 kg!
          if (sessions === 0) return base;       // Session 1: 2 sets
          if (sessions === 1) return Math.min(4, base + 1);   // Session 2: 3 sets
          return Math.min(4, base + 2);                       // Session 3+: 4 sets (peak volume bridge)
        }
      }

      // 2. Tier 2: Moderate-High Jump 23% - 29% (e.g. 8 kg -> 10 kg is +25.0% jump)
      // Stepping bridge (+1 set for Group B and Group A, capped at 4 sets max)
      if (pctJump >= 23) {
        if (isGrpA) {
          return sessions >= 1 ? Math.min(4, base + 1) : base;
        } else {
          // Isolation: 2 sets for first 2 sessions -> 3 sets on session 3+ before advancing to 10 kg
          if (sessions <= 1) return base;
          return Math.min(4, base + 1); // 3 sets
        }
      }

      // 3. Tier 3: Moderate Jump 18% - 22% (e.g. 10 kg -> 12 kg is +20.0% jump)
      // Less volume ramp than 8->10 or 6->8 ("מ 10 ל 12 פחות מ 8 ל 10 או 6 ל 8")
      if (pctJump >= 18) {
        if (isGrpA) {
          return base; // Compounds handle 20% comfortably at 3 sets
        } else {
          // Isolation: brief stepping bridge on session 3 only
          return sessions >= 2 ? Math.min(4, base + 1) : base;
        }
      }

      // 4. Tier 4: Low Jump < 18% (e.g. 12 kg -> 14 kg is +16.7%, 14 -> 16 is +14.3%)
      // Jumps are manageable without set expansion
      return base;
    }

    calculateWeightedDecision(exercise, state, setResults, weekNumber, previousSessionData, isDeloadOverride = undefined) {
      const isDeload = isDeloadOverride !== undefined ? isDeloadOverride : (weekNumber % this.settings.deloadEveryWeeks === 0);
      const isGrpA = this.isGroupA(exercise);
      const defaultStartWeight = isGrpA ? 8 : 6;
      let currentWeight = state ? state.currentWeightKg : (exercise.startingWeight || defaultStartWeight);
      if (setResults && setResults.length > 0 && setResults[0].weightKg && setResults[0].weightKg > currentWeight) {
        currentWeight = setResults[0].weightKg;
      }

      if (isDeload) {
        return {
          action: 'maintain',
          newWeight: currentWeight,
          reason: 'deload_week_no_progression'
        };
      }

      const evaluation = this.evaluateSetResults(exercise, setResults);
      const softened = this.checkSoftenedProgression(exercise, state, setResults, previousSessionData);
      const increment = exercise.increment || 2;
      const maxWeight = exercise.maxWeight || 32;
      const minWeight = exercise.minWeight || 6;

      // 1. Performance Above Target: Auto-regulated Early Promotion (ביצועים מעל מעלים מוקדם יותר)
      if (evaluation === 'all_above') {
        const atCeiling = currentWeight >= maxWeight;
        const newWeight = Math.min(maxWeight, currentWeight + increment);
        return {
          action: 'increase',
          newWeight,
          atMaxWeight: atCeiling,
          reason: atCeiling ? 'max_weight_ceiling_reached' : 'all_above_max'
        };
      }

      // 2. Volume Stepping Bridge Fatigue Protection (Sisyphus Bug Fix):
      // If trainee is in a Volume Stepping bridge (prescribed sets > baseSets),
      // and performed the baseSets cleanly (in_window / above), but experienced BELOW ONLY on the added
      // bridge sets (sets >= baseSets):
      // Do NOT wipe out sessionsAtWeight to 0 or drop to baseSets (which causes an infinite regression loop).
      // Instead, step down volume by 1 set (e.g. 4 -> 3 sets) to consolidate work capacity safely.
      const baseSetsCount = exercise.sets || (isGrpA ? 3 : 2);
      const currentSessionsCount = state ? (state.sessionsAtWeight || 0) : 0;
      const prescribedBridgeSets = this.calculatePrescribedSets(exercise, currentWeight, currentSessionsCount, baseSetsCount);

      if (setResults && setResults.length > baseSetsCount) {
        const baseSetSlice = setResults.slice(0, baseSetsCount);
        const bridgeSetSlice = setResults.slice(baseSetsCount);
        const baseClean = baseSetSlice.every(s => s.result === 'in_window' || s.result === 'above');
        const bridgeHasBelow = bridgeSetSlice.some(s => s.result === 'below');

        if (baseClean && bridgeHasBelow) {
          const stepDownSets = Math.max(baseSetsCount, prescribedBridgeSets - 1);
          return {
            action: 'maintain',
            newWeight: currentWeight,
            targetSets: stepDownSets,
            newSessionsAtWeight: Math.max(0, currentSessionsCount - 1),
            reason: 'bridge_fatigue_step_down',
            stepDownSessions: true
          };
        }
      }

      // 3. Performance Below Target: Auto-regulated Reduction / Hold
      // First BELOW session maintains weight and relieves volume fatigue (sets to base).
      // Only 2 consecutive BELOW sessions trigger a weight demotion (-2kg down to minWeight floor).
      if (evaluation === 'all_below') {
        const consecutiveBelow = (state && typeof state.consecutiveBelow === 'number') ? state.consecutiveBelow : 0;
        const baseSets = exercise.sets || (isGrpA ? 3 : 2);
        const isLowWeightTier = !isGrpA && currentWeight <= 10;
        // Transition Rep Buffer (v15.9):
        // Strictly tracked via attemptsAtCurrentWeight <= 2 (attempts prior to this session < 2)
        // so the buffer expires after 2 sessions and cannot loop indefinitely.
        const attempts = (state && typeof state.attemptsAtCurrentWeight === 'number')
          ? state.attemptsAtCurrentWeight
          : (state && typeof state.sessionsAtWeight === 'number' ? state.sessionsAtWeight : 0);
        const isTransitionPhase = (attempts < 2);

        // On Tier 1/2 load jumps for Group B isolations (6->8 kg: +33.3%, 8->10 kg: +25.0%),
        // during the first 2 sessions at the new weight, a 2-session adaptation grace period
        // is granted where a 2nd below session maintains weight to prevent premature ping-pong demotion.
        if (isLowWeightTier && isTransitionPhase && consecutiveBelow === 1) {
          return {
            action: 'maintain',
            newWeight: currentWeight,
            targetSets: baseSets,
            reason: 'transition_buffer_maintain',
            transitionBufferActive: true
          };
        }

        const requiredConsecutiveBelow = (isLowWeightTier && isTransitionPhase) ? 2 : 1;
        if (consecutiveBelow >= requiredConsecutiveBelow) {
          const decrement = exercise.increment || 2;
          const newWeight = Math.max(minWeight, currentWeight - decrement);
          return {
            action: 'decrease',
            newWeight,
            targetSets: baseSets,
            reason: 'consecutive_below_decrease'
          };
        } else {
          return {
            action: 'maintain',
            newWeight: currentWeight,
            targetSets: baseSets,
            reason: 'first_below_maintain'
          };
        }
      }

      // 3. Performance In Window: Cadence-Based Progression
      // Group A: Promotes on 3rd workout (after 2 sessions accumulated at current weight)
      // Group B: Promotes on 4th workout (after 3 sessions accumulated at current weight)
      const targetCadence = isGrpA ? 3 : 4;
      const requiredPriorSessions = targetCadence - 1; // 2 for Group A, 3 for Group B
      const currentSessions = state ? (state.sessionsAtWeight || 0) : 0;
      const baseSets = exercise.sets || (isGrpA ? 3 : 2);
      const targetSets = this.calculatePrescribedSets(exercise, currentWeight, currentSessions, baseSets);

      if (evaluation === 'all_in_window' || softened) {
        if (currentSessions >= requiredPriorSessions) {
          const atCeiling = currentWeight >= maxWeight;
          const newWeight = Math.min(maxWeight, currentWeight + increment);
          return {
            action: 'increase',
            newWeight,
            targetSets: baseSets, // Resets to base sets at the higher weight to prevent shock
            atMaxWeight: atCeiling,
            reason: atCeiling ? 'max_weight_ceiling_reached' : (isGrpA ? 'cadence_group_a_3rd_session' : 'cadence_group_b_4th_session')
          };
        } else {
          return {
            action: 'maintain',
            newWeight: currentWeight,
            targetSets,
            reason: isGrpA ? `cadence_group_a_accumulating_${currentSessions + 1}_of_3` : `cadence_group_b_accumulating_${currentSessions + 1}_of_4`
          };
        }
      }

      return {
        action: 'maintain',
        newWeight: currentWeight,
        targetSets,
        reason: 'mixed_results_maintain'
      };
    }

    calculateStageDecision(exercise, state, setResults, weekNumber, previousSessionData) {
      const isDeload = weekNumber % this.settings.deloadEveryWeeks === 0;
      const stages = exercise.stages || [];
      const currentStageIndex = state ? state.currentStageIndex : 0;

      if (isDeload) {
        return {
          action: 'maintain',
          newStageIndex: currentStageIndex,
          stageName: stages[currentStageIndex] || '',
          reason: 'deload_week_no_progression'
        };
      }

      const evaluation = this.evaluateSetResults(exercise, setResults);
      const softened = this.checkSoftenedProgression(exercise, state, setResults, previousSessionData);

      if (evaluation === 'all_above' || softened) {
        const newStageIndex = Math.min(stages.length - 1, currentStageIndex + 1);
        return {
          action: newStageIndex > currentStageIndex ? 'increase_stage' : 'maintain',
          newStageIndex,
          stageName: stages[newStageIndex] || '',
          reason: evaluation === 'all_above' ? 'all_above_max' : 'softened_progression_achieved'
        };
      }

      if (evaluation === 'all_below') {
        const consecutiveBelow = (state && typeof state.consecutiveBelow === 'number') ? state.consecutiveBelow : 0;
        if (consecutiveBelow >= 1) {
          const newStageIndex = Math.max(0, currentStageIndex - 1);
          return {
            action: newStageIndex < currentStageIndex ? 'decrease_stage' : 'maintain',
            newStageIndex,
            stageName: stages[newStageIndex] || '',
            reason: 'consecutive_below_decrease_stage'
          };
        } else {
          return {
            action: 'maintain',
            newStageIndex: currentStageIndex,
            stageName: stages[currentStageIndex] || '',
            reason: 'first_below_maintain'
          };
        }
      }

      return {
        action: 'maintain',
        newStageIndex: currentStageIndex,
        stageName: stages[currentStageIndex] || '',
        reason: 'mixed_results_maintain'
      };
    }

    // ----------------------------
    // 3. Myo-Reps Evaluation
    // ----------------------------
    evaluateMyoReps(exercise, state, clusterResults) {
      const cfg = exercise.myoConfig || {
        activationReps: 15,
        miniSets: 3,
        miniReps: 5,
        stopRule: 'two_consecutive_tempo_losses'
      };

      if (!clusterResults) {
        return { action: 'maintain', reason: 'no_cluster_data' };
      }

      if (clusterResults.jointPainReported) {
        return { action: 'cancel_block', reason: 'joint_pain' };
      }

      const activation = clusterResults.activation || {};
      const targetActivation = typeof cfg.activationReps === 'number' ? cfg.activationReps : (exercise.windowMax || 15);
      const activationComplete = (activation.cleanReps >= targetActivation) && !activation.anyTempoLoss && !activation.tempoLossStop;

      const miniSets = clusterResults.miniSets || [];
      const miniSetsComplete = miniSets.length >= cfg.miniSets && miniSets.every(m => m.cleanReps >= cfg.miniReps && !m.anyTempoLoss && !m.tempoLossStop);

      if (activationComplete && miniSetsComplete) {
        return { action: 'increase_stage', reason: 'full_cluster_clean' };
      }

      return { action: 'maintain', reason: 'partial_cluster_or_tempo_loss' };
    }

    // ----------------------------
    // 4. Biceps Microcycle Controller
    // ----------------------------
    getBicepsMicrocycleWeek(weekNumber) {
      const phase = this.getBicepsMicrocyclePhase(weekNumber);
      if (phase.type === 'deload') {
        return { type: 'deload', exercises: phase.exercises, sets: phase.sets, progressionAllowed: false };
      }
      if (phase.type === 'light') {
        return { type: 'light', exercises: phase.exercises, sets: phase.sets, progressionAllowed: false };
      }
      return { type: 'heavy', exercises: phase.exercises, sets: 'progressive', progressionAllowed: true };
    }

    /**
     * v15.7 Accelerated — Biceps Microcycle phase resolver (3 heavy : 1 light, every 12th week = deload).
     * Exposes a phase descriptor consumed by the UI badges (today.js, stats.js).
     * NOTE: microcycle participation for Single-Arm Hammer Curl is still subject to the
     * Phase 0 performance unlock — the engine only describes the cycle; rendering hides
     * locked exercises regardless of cycle phase (Unlock Precedence Rule).
     */
    getBicepsMicrocyclePhase(weekNumber) {
      const bicepsCfg = this.settings.bicepsMicrocycle || { cycleLength: 4, heavyWeeks: [1, 2, 3], lightWeeks: [4], lightWeekExercises: ['hammer-curl', 'single-arm-hammer-curl'], lightWeekSets: 2 };

      if (weekNumber % (this.settings.deloadEveryWeeks || 12) === 0) {
        return {
          type: 'deload',
          phase: 'DELOAD',
          exercises: ['hammer-curl', 'single-arm-hammer-curl'],
          sets: 1,
          progressionAllowed: false,
          label: 'Deload — Hammer Curl only, 1 set'
        };
      }

      const cyclePosition = ((weekNumber - 1) % bicepsCfg.cycleLength) + 1;
      if (bicepsCfg.lightWeeks && bicepsCfg.lightWeeks.includes(cyclePosition)) {
        return {
          type: 'light',
          phase: 'LIGHT_MYO',
          exercises: bicepsCfg.lightWeekExercises || ['hammer-curl', 'single-arm-hammer-curl'],
          sets: bicepsCfg.lightWeekSets || 2,
          progressionAllowed: false,
          label: 'Light Myo-Preservation (Week 4)'
        };
      }

      return {
        type: 'heavy',
        phase: 'HEAVY_PROG',
        exercises: bicepsCfg.heavyWeekExercises || ['db-curl', 'single-arm-curl', 'hammer-curl', 'single-arm-hammer-curl'],
        sets: 'progressive',
        progressionAllowed: true,
        label: 'Heavy Progressive (Weeks 1-3)'
      };
    }

    // ----------------------------
    // 5. Arm Block & Frequency Guard
    // ----------------------------
    getArmBlockRampPhase(weekNumber) {
      if (weekNumber < 3) {
        return { active: false, phase: 'LOCKED', stage: 'Locked (Weeks 1-2)', miniSets: 0, miniReps: 0, rest: 0, label: 'נעול' };
      }
      if (weekNumber === 3) {
        return { active: true, phase: 'MICRO_DOSE_1', stage: 'Micro-Dose 1 (Week 3)', sets: '1+1 Myo-Mini', repWindow: '12 + 1×4', miniSets: 1, miniReps: 4, rest: 15, label: 'מינון מיקרו 1' };
      }
      if (weekNumber === 4 || weekNumber === 5) {
        return { active: true, phase: 'MICRO_DOSE_2', stage: `Micro-Dose ${weekNumber === 4 ? '2' : 'Consolidation'} (Weeks 4-5)`, sets: '1+2 Myo-Mini', repWindow: '12 + 2×4', miniSets: 2, miniReps: 4, rest: 15, label: weekNumber === 4 ? 'מינון מיקרו 2' : 'ביסוס מיקרו' };
      }
      return { active: true, phase: 'FULL_CLUSTER', stage: 'Full Arm Block Cluster (Week 6+)', sets: 'Myo-Reps Cluster', repWindow: 'Myo-Reps Cluster', miniSets: 3, miniReps: 5, rest: 15, label: 'צביר Myo מלא' };
    }

    isArmBlockAllowed(dayTrackingData, weekNumber, existingExposures = [], exerciseIdOrMuscleArea = null, allProgressionStates = {}) {
      const armBlockCfg = this.settings.armBlock || { enabledFromWeek: 3, maxArmBlockExposurePerMusclePerWeek: 1 };

      if (weekNumber < armBlockCfg.enabledFromWeek) {
        return { active: false, reason: 'arm_block_not_started_yet' };
      }

      if (weekNumber % (this.settings.deloadEveryWeeks || 12) === 0) {
        return { active: true, sets: 1, reason: 'deload_single_set' };
      }

      // 1. Injury Engine Check (v15.9): Automatic suppression if relevant joint is Sensitive (1) or Injured (2)
      if (typeof InjuryEngine !== 'undefined') {
        const areaStr = (exerciseIdOrMuscleArea || '').toLowerCase();
        if (areaStr.includes('shoulder') || areaStr.includes('lateral')) {
          if (InjuryEngine.getJointState('shoulder_r') > 0 || InjuryEngine.getJointState('shoulder_l') > 0) {
            return { active: false, reason: 'joint_vulnerability_shoulder' };
          }
        }
        if (areaStr.includes('triceps') || areaStr.includes('biceps') || areaStr.includes('elbow') || areaStr.includes('curl')) {
          if (InjuryEngine.getJointState('elbow_r') > 0 || InjuryEngine.getJointState('elbow_l') > 0) {
            return { active: false, reason: 'joint_vulnerability_elbow' };
          }
        }
      }

      // 2. Volume Stepping Bridge Suppression (v15.9):
      // When a trainee is in a Volume Stepping bridge (prescribedSets > baseSets, e.g. 3 or 4 sets),
      // the metabolic/hypertrophic volume threshold is already achieved via main sets.
      // Suppress the Arm Block for that muscle to prevent 10+ set overload and tendon strain.
      if (exerciseIdOrMuscleArea && allProgressionStates) {
        const exId = String(exerciseIdOrMuscleArea).toLowerCase();
        let targetMainId = null;
        if (exId.includes('lateral')) targetMainId = 'single-arm-lateral-raise';
        else if (exId.includes('triceps')) targetMainId = 'db-overhead-triceps-extension';
        else if (exId.includes('curl') || exId.includes('biceps')) targetMainId = 'single-arm-curl';

        if (targetMainId && allProgressionStates[targetMainId]) {
          const mainState = allProgressionStates[targetMainId];
          const mainEx = this.getExercise(targetMainId);
          if (mainEx) {
            const base = mainEx.sets || 2;
            const prescribed = this.calculatePrescribedSets(mainEx, mainState.currentWeightKg, mainState.sessionsAtWeight || 0, base);
            if (prescribed > base) {
              return { active: false, reason: 'suppressed_due_to_volume_stepping', prescribedSets: prescribed };
            }
          }
        }
      }

      if (dayTrackingData) {
        if (dayTrackingData.elbowPain || dayTrackingData.shoulderPain) {
          return { active: false, reason: 'joint_pain_reported' };
        }

        // Check if any main exercise had all sets below
        if (dayTrackingData.setData) {
          const mainBelow = Object.values(dayTrackingData.setData).some(sets => sets.length > 0 && sets.every(s => s.result === 'below'));
          if (mainBelow) {
            return { active: false, reason: 'main_exercise_failure' };
          }
        }
      }

      return { active: true, sets: 2, reason: 'normal' };
    }

    checkWeeklyArmBlockExposureLimit(dayIndex, weekNumber, exerciseIds, exposures = []) {
      const armBlockCfg = this.settings.armBlock || {};
      const limit = armBlockCfg.maxArmBlockExposurePerMusclePerWeek || 1;
      const muscleAreaMap = armBlockCfg.muscleAreaMap ? armBlockCfg.muscleAreaMap[dayIndex] : null;

      if (!muscleAreaMap) return false;

      const weeklyExposures = exposures.filter(e => e.week === weekNumber);

      for (const exId of exerciseIds) {
        const area = muscleAreaMap[exId];
        if (!area) continue;
        const count = weeklyExposures.filter(e => e.muscleArea === area).length;
        if (count >= limit) return true;
      }

      return false;
    }

    // ----------------------------
    // 6. Lean Structure Mechanics
    // ----------------------------
    getActiveLeanStructure(dayIndex, weekNumber, allProgressionStates = {}) {
      const lean = this.settings.leanMode || { enabled: true, pairs: [], circuits: [], blocks: [], toggles: [] };
      const isDeload = weekNumber % (this.settings.deloadEveryWeeks || 12) === 0;

      const result = {
        pairs: [],
        circuits: [],
        blocks: [],
        activeToggles: {},
        allDissolved: isDeload
      };

      if (!lean.enabled) return result;

      // Resolve toggles
      const dayToggles = (lean.toggles || []).filter(t => t.dayIndex === dayIndex);
      for (const toggle of dayToggles) {
        result.activeToggles[toggle.toggleGroup] = this.getToggleActiveExercise(toggle, weekNumber, allProgressionStates);
      }

      if (isDeload) return result;

      // Resolve pairs
      const dayPairs = (lean.pairs || []).filter(p => p.dayIndex === dayIndex);
      for (const pair of dayPairs) {
        if (this.isPairActive(pair, weekNumber, allProgressionStates)) {
          result.pairs.push(pair);
        }
      }

      // Resolve circuits & blocks
      result.circuits = (lean.circuits || []).filter(c => c.dayIndex === dayIndex);
      result.blocks = (lean.blocks || []).filter(b => b.dayIndex === dayIndex);

      return result;
    }

    isPairActive(pair, weekNumber, allProgressionStates = {}) {
      const isDeload = weekNumber % (this.settings.deloadEveryWeeks || 12) === 0;
      if (isDeload) return false;

      // Check biceps microcycle light week where the curl member is disabled
      if (pair.pairId === 'd5-pushup-curl') {
        const bicepsCfg = this.settings.bicepsMicrocycle || { cycleLength: 4, lightWeeks: [4] };
        const cyclePos = ((weekNumber - 1) % bicepsCfg.cycleLength) + 1;
        if (bicepsCfg.lightWeeks && bicepsCfg.lightWeeks.includes(cyclePos)) return false;
      }

      // Lean Pair Availability Rule (v15.7): a Lean Pair is rendered only if BOTH
      // paired exercises are unlocked for the current week (calendar gate OR
      // performance graduation). If either member is still locked, the pair is
      // omitted and NO automatic substitution is created (member renders as a
      // straight set on its own). Unlock Precedence Rule — the ProgressionEngine
      // unlock logic is authoritative over any day-card/appendix description.
      if (pair.dissolveIfMemberInactive !== false) {
        const members = (pair.members || []).map(m => (typeof m === 'string' ? m : (m && m.exerciseId))).filter(Boolean);
        for (const memberId of members) {
          if (memberId && !this.checkUnlockCriteria(memberId, allProgressionStates, weekNumber).unlocked) {
            return false;
          }
        }
      }

      return true;
    }

    decomposePairOnBelow(pairId, sessionKey) {
      return {
        pairId,
        dissolved: true,
        scope: 'rest_of_session',
        applyAdaptiveRestExtension: true,
        extensionSeconds: 30,
        fallbackStructure: 'straight_separate_rest'
      };
    }

    getToggleActiveExercise(toggle, weekNumber, allProgressionStates = {}) {
      const parity = weekNumber % 2 === 0 ? 'even' : 'odd';
      const member = toggle.members ? toggle.members.find(m => m.activeOn === parity) : null;

      if (!member) return null;
      if (member.slotId) {
        return this.resolveToggleSlot(member, allProgressionStates);
      }
      return member.exerciseId;
    }

    resolveToggleSlot(slotMember, allProgressionStates = {}) {
      if (slotMember.unlockedExerciseId && this.isExerciseUnlocked(slotMember.unlockedExerciseId, allProgressionStates)) {
        return slotMember.unlockedExerciseId;
      }
      return slotMember.fallbackExerciseId;
    }

    isExerciseUnlocked(exerciseId, allProgressionStates = {}) {
      const state = allProgressionStates[exerciseId];
      if (!state) {
        const ex = this.getExercise(exerciseId);
        if (ex && typeof ex.unlocked === 'boolean') return ex.unlocked;
        return false;
      }
      if (typeof state.unlocked === 'boolean') return state.unlocked;
      return false;
    }

    // ----------------------------
    // 7. Adaptive Rest Algorithm
    // ----------------------------
    calculateOpeningRest(exercise, previousSessionData) {
      const baseRest = exercise.restSeconds || 90;
      if (!previousSessionData || !previousSessionData.sets || previousSessionData.sets.length === 0) {
        return baseRest;
      }

      const sets = previousSessionData.sets;
      const anyBelow = sets.some(s => s.result === 'below');
      const allInWindow = sets.every(s => s.result === 'in_window');
      const allAtMax = sets.every(s => (s.reps || 0) >= (exercise.windowMax || 12));

      if (anyBelow && exercise.restRange) {
        return Math.min(exercise.restRange[1], baseRest + 30);
      }
      if (allInWindow && allAtMax && exercise.restRange) {
        return Math.max(exercise.restRange[0], baseRest - 15);
      }
      return baseRest;
    }

    calculateIntraWorkoutRest(exercise, currentSetResult, baseRest) {
      if (currentSetResult === 'below' && exercise.restRange) {
        const extendedRest = Math.min(exercise.restRange[1], baseRest + 30);
        return { rest: extendedRest, message: `מנוחה מורחבת: ${extendedRest} שניות (עקב ירידה בביצוע)` };
      }
      return { rest: baseRest, message: `מנוחה: ${baseRest} שניות` };
    }

    calculateNextSessionRest(exercise, currentSessionData) {
      return this.calculateOpeningRest(exercise, currentSessionData);
    }

    // ----------------------------
    // 8. Atomic Progression Transaction Commit
    // ----------------------------

    // Helper to find exercise by ID or Name
    findExerciseIdByName(name) {
      if (!name) return null;
      if (!window.TRAINING_DATA || !window.TRAINING_DATA.exercises) return null;
      const ex = window.TRAINING_DATA.exercises.find(e => e.id === name || e.name === name || e.id === name.toLowerCase().replace(/\s+/g, '-'));
      return ex ? ex.id : name;
    }

    // ----------------------------
    // Check Unlock Criteria
    // ----------------------------
    checkUnlockCriteria(exerciseId, allProgressionStates = {}, weekNumber = 0) {
      const exercise = this.getExercise(exerciseId);
      if (!exercise) return { unlocked: true, reason: 'Exercise not found' };

      // v15.7 Accelerated — "Calendar ceiling, performance accelerator":
      // An exercise is never locked later than its calendar gate, but can unlock
      // earlier (from earliestWeek onward) when performance criteria are met.
      const calendarGate = exercise.calendarGate !== undefined ? exercise.calendarGate : (exercise.startingWeek || 0);
      if (weekNumber > 0 && calendarGate > 0 && weekNumber >= calendarGate) {
        return { unlocked: true, reason: 'Calendar gate reached' };
      }

      // Earliest-week safety floor (connective tissue adaptation)
      const earliestWeek = exercise.earliestWeek || 1;
      if (weekNumber > 0 && weekNumber < earliestWeek) {
        return { unlocked: false, reason: `Earliest unlock week ${earliestWeek}` };
      }

      if (exercise.unlockCriteria) {
        const criteria = exercise.unlockCriteria;
        const targetState = allProgressionStates[criteria.exercise];

        if (!targetState) {
          return { unlocked: false, reason: `Requires previous progression (${criteria.exercise})` };
        }

        if (criteria.targetWeightKg !== undefined) {
          if ((targetState.currentWeightKg || 0) < criteria.targetWeightKg) {
            return { unlocked: false, reason: `Requires ${criteria.targetWeightKg}kg on ${criteria.exercise}` };
          }
        }

        if (criteria.targetStageIndex !== undefined) {
          if ((targetState.currentStageIndex || 0) < criteria.targetStageIndex) {
            return { unlocked: false, reason: `Requires stage level ${criteria.targetStageIndex} on ${criteria.exercise}` };
          }
        }

        if (criteria.targetReps !== undefined) {
          const lastReps = targetState.lastSessionReps || 0;
          if (lastReps < criteria.targetReps) {
            return { unlocked: false, reason: `Requires ${criteria.targetReps} reps on ${criteria.exercise}` };
          }
        }

        if (criteria.minSessionsCompleted !== undefined) {
          const sessions = targetState.sessionsCompleted || 0;
          if (sessions < criteria.minSessionsCompleted) {
            return { unlocked: false, reason: `Requires ${criteria.minSessionsCompleted} sessions of ${criteria.exercise}` };
          }
        }

        return { unlocked: true, reason: 'Prerequisite strength achieved' };
      }

      if (exercise.id === 'pistol-squat' && !exercise.unlockCriteria) {
        const squatState = allProgressionStates['heels-elevated-goblet-squat'] || allProgressionStates['goblet-bulgarian-split-squat'] || allProgressionStates['single-leg-rdl'];
        if (squatState && (squatState.currentWeightKg >= 12 || squatState.currentStageIndex >= 2)) {
          return { unlocked: true, reason: 'Prerequisite strength achieved (BSS / Heels-Elevated Goblet Squat)' };
        }
        return { unlocked: false, reason: 'Requires Bulgarian Split Squat / Heels-Elevated Goblet Squat strength threshold' };
      }

      return { unlocked: exercise.unlocked ?? true, reason: 'Unlocked' };
    }

    // ----------------------------
    // Apply Deload
    // ----------------------------
    applyDeload(exerciseId, state) {
      const exercise = this.getExercise(exerciseId);
      if (!exercise || !state) return state;

      const updated = { ...state };
      const deloadReduction = window.TRAINING_DATA?.progressionSettings?.deloadWeightReductionKg || 2;

      if (exercise.type === 'weighted') {
        const minW = exercise.minWeight || 6;
        updated.currentWeightKg = Math.max(minW, (updated.currentWeightKg || exercise.startingWeight || 6) - deloadReduction);
      } else if (exercise.stages && exercise.stages.length > 0) {
        updated.currentStageIndex = Math.max(0, (updated.currentStageIndex || 0) - 1);
      }

      updated.lastUpdated = new Date().toISOString();
      return updated;
    }

    // ----------------------------
    // 9. Auto-Regulated Deload (v15.7 Accelerated)
    // ----------------------------
    async checkAutoDeloadTrigger(currentDayIndex) {
      const cfg = this.settings.autoDeload || {
        consecutiveFailedSessions: 2,
        minFailedExercisesPerSession: 2,
        demotionsInDays: 7,
        demotionThreshold: 3,
        painFlagThreshold: 2
      };
      try {
        if (!window.DB || !window.DB.getAllTracking || !window.DB.getAllPlan) {
          return { triggered: false, reason: 'db_unavailable' };
        }

        const allTracking = await window.DB.getAllTracking();
        const planDays = await window.DB.getAllPlan();
        if (!allTracking || !Array.isArray(allTracking) || !planDays || !Array.isArray(planDays)) {
          return { triggered: false, reason: 'no_data' };
        }

        // Scan the last 7 plan days before the current day
        const startIdx = Math.max(0, currentDayIndex - 7);
        let consecutiveFailures = 0;
        let painFlags = 0;

        for (let i = startIdx; i < currentDayIndex; i++) {
          const day = planDays[i];
          if (!day || !day.exercises) continue;
          const tracking = allTracking.find(t => t.dayIndex === i);
          if (!tracking || !tracking.setData) continue;

          const isStrengthDay = /strength|push|pull|legs|skill/i.test(String(day.dayType || ''));
          let failedExercises = 0;
          for (let exIdx = 0; exIdx < day.exercises.length; exIdx++) {
            const setData = tracking.setData[exIdx];
            if (!setData) continue;
            const results = Object.keys(setData)
              .filter(k => k.startsWith('set_') && k.endsWith('_result'))
              .map(k => setData[k]);
            if (results.length > 0 && results.every(r => r === 'below')) failedExercises++;
          }

          if (tracking.elbowPain || tracking.shoulderPain || tracking.jointPain) painFlags++;

          if (isStrengthDay) {
            if (failedExercises >= (cfg.minFailedExercisesPerSession || 2)) {
              consecutiveFailures++;
            } else {
              consecutiveFailures = 0;
            }
          }
        }

        if (consecutiveFailures >= (cfg.consecutiveFailedSessions || 2)) {
          return { triggered: true, reason: 'two_consecutive_failed_sessions', consecutiveFailures };
        }

        // Count load demotions from progression history within the window
        if (window.DB.getAllProgressionHistory) {
          const history = await window.DB.getAllProgressionHistory();
          if (history && Array.isArray(history)) {
            const cutoff = Date.now() - (cfg.demotionsInDays || 7) * 86400000;
            const demotions = history.filter(h => h.action === 'decrease' && new Date(h.timestamp).getTime() >= cutoff).length;
            if (demotions >= (cfg.demotionThreshold || 3)) {
              return { triggered: true, reason: 'excessive_demotions', demotions };
            }
          }
        }

        if (painFlags >= (cfg.painFlagThreshold || 2)) {
          return { triggered: true, reason: 'repeated_joint_pain', painFlags };
        }

        return { triggered: false, reason: 'ok' };
      } catch (err) {
        console.warn('[ProgressionEngine] Auto-deload check failed:', err);
        return { triggered: false, reason: 'error' };
      }
    }

    // ----------------------------
    // Create Initial State
    // ----------------------------
    createInitialState(exerciseId, allProgressionStates = {}) {
      const exercise = this.getExercise(exerciseId);
      const isWeightedEx = exercise && (exercise.type === 'weighted' || exercise.startingWeight != null);
      let startWeight = isWeightedEx ? (exercise.startingWeight || 8) : 0;

      // Parent weight inheritance mapping for direct replacements (strictly weighted-to-weighted).
      // Unilateral replacements (Single-Leg RDL replacing bilateral Goblet RDL)
      // derive starting weight safely as 50% of bilateral load (rounded to nearest even kg, min 8 kg)
      // to maintain mechanical tension without risking pelvic rotational torque on L4-S1.
      if (exerciseId === 'single-leg-rdl' && allProgressionStates) {
        const gobletState = allProgressionStates['goblet-rdl'] || allProgressionStates['goblet-romanian-deadlift'];
        const gobletW = gobletState ? (gobletState.currentWeightKg || 0) : 0;
        if (gobletW > 0) {
          startWeight = Math.max(8, Math.round((gobletW * 0.5) / 2) * 2);
        }
      }

      const parentIdMap = {
        // Direct identical bilateral substitutions only (if any)
      };

      const candidateParents = parentIdMap[exerciseId];
      if (candidateParents && allProgressionStates && isWeightedEx) {
        for (let pId of candidateParents) {
          const parentState = allProgressionStates[pId];
          const parentDef = this.getExercise(pId);
          if (parentDef && (parentDef.type === 'weighted' || parentDef.startingWeight != null) && parentState && parentState.currentWeightKg > 0) {
            startWeight = parentState.currentWeightKg;
            break;
          }
        }
      }

      return {
        exerciseId,
        sessionKey: exerciseId,
        currentWeightKg: startWeight,
        currentStageIndex: 0,
        sessionsAtWeight: 0,
        attemptsAtCurrentWeight: 0,
        consecutiveBelow: 0,
        unlocked: exercise ? (exercise.unlocked ?? true) : true,
        lastUpdated: new Date().toISOString()
      };
    }

    // ----------------------------
    // Get Display Prescription
    // ----------------------------
    getDisplayPrescription(exerciseId, weekNumber = 1, state = null, isDeloadOverride = undefined) {
      const exercise = this.getExercise(exerciseId);
      if (!exercise) return null;

      const isDeload = isDeloadOverride !== undefined ? isDeloadOverride : (weekNumber % (this.settings.deloadEveryWeeks || 12) === 0);
      const bicepsConfig = window.TRAINING_DATA?.progressionSettings?.bicepsMicrocycle;
      const isBicepsLightWeek = bicepsConfig && bicepsConfig.lightWeeks && bicepsConfig.lightWeeks.includes(((weekNumber - 1) % bicepsConfig.cycleLength) + 1);

      const isGrpA = this.isGroupA(exercise);
      let baseSets = exercise.sets || (isGrpA ? 3 : 2);
      let sets = baseSets;

      const currentWeight = state ? state.currentWeightKg : (exercise.startingWeight || (isGrpA ? 8 : 6));
      const sessionsAtWeight = state ? (state.sessionsAtWeight || 0) : 0;

      if (isDeload) {
        sets = Math.min(sets, 2);
      } else if (isBicepsLightWeek && (exercise.id === 'db-curl' || exercise.id === 'single-arm-curl' || exercise.id === 'hammer-curl' || exercise.id === 'single-arm-hammer-curl')) {
        sets = bicepsConfig.lightWeekSets || 2;
      } else if (exercise.type === 'weighted' || exercise.startingWeight != null) {
        sets = this.calculatePrescribedSets(exercise, currentWeight, sessionsAtWeight, baseSets);
      }

      const currentStage = state ? (exercise.stages ? exercise.stages[state.currentStageIndex || 0] : null) : (exercise.stages ? exercise.stages[0] : null);

      const deloadRed = window.TRAINING_DATA?.progressionSettings?.deloadWeightReductionKg || 2;
      const atMaxWeight = currentWeight >= (exercise.maxWeight || 32);

      return {
        exerciseId: exercise.id,
        name: exercise.name,
        sets,
        repWindow: exercise.repWindow || (exercise.windowMin && exercise.windowMax ? exercise.windowMin + "–" + exercise.windowMax : "8–12"),
        targetWeightKg: isDeload ? Math.max(exercise.minWeight || 6, currentWeight - deloadRed) : currentWeight,
        targetStage: currentStage,
        restSeconds: exercise.rest || exercise.restSeconds || 60,
        isDeload,
        isBicepsLightWeek,
        atMaxWeight
      };
    }

    async getPreviousSessionData(exerciseId, currentDayIndex) {
      if (!window.DB || !window.DB.getAllTracking) return null;
      try {
        const allTracking = await window.DB.getAllTracking();
        if (!allTracking || !Array.isArray(allTracking)) return null;

        const planDays = await window.DB.getAllPlan();
        if (!planDays || !Array.isArray(planDays)) return null;

        for (let i = currentDayIndex - 1; i >= 0; i--) {
          const pastDay = planDays[i];
          if (!pastDay || !pastDay.exercises) continue;

          // Progression Engine evaluates main working sets only, never warmups
          let exIdx = pastDay.exercises.findIndex(e => (e.id === exerciseId || e.name === exerciseId) && !e.isWarmup && !(e.slot && e.slot.startsWith('W')));
          if (exIdx === -1) {
            exIdx = pastDay.exercises.findIndex(e => e.id === exerciseId || e.name === exerciseId);
          }
          if (exIdx === -1) continue;

          const tracking = allTracking.find(t => t.dayIndex === i);
          if (!tracking || !tracking.setData) continue;

          let setData = null;
          for (const key of Object.keys(tracking.setData)) {
            const entry = tracking.setData[key];
            if (entry && (entry.exerciseId === exerciseId || entry.exerciseName === exerciseId) && !entry.isWarmup) {
              setData = entry;
              break;
            }
          }
          if (!setData) {
            setData = tracking.setData[exIdx];
          }
          if (!setData) continue;
          const sets = [];
          for (let s = 0; s < 10; s++) {
            if (setData[`set_${s}_done`] || setData[`set_${s}_result`]) {
              sets.push({
                result: setData[`set_${s}_result`] || 'in_window',
                reps: parseInt(setData[`set_${s}_reps`]) || 0,
                weightKg: parseFloat(setData[`set_${s}_weight`]) || 0
              });
            }
          }
          if (sets.length > 0) {
            return {
              dayIndex: i,
              sets,
              lastUpdated: tracking.lastUpdated || tracking.date
            };
          }
        }
      } catch (err) {
        console.warn('[ProgressionEngine] Error fetching previous session data:', err);
      }
      return null;
    }

    async commitExerciseProgression(exerciseData) {
      if (!window.DB) return null;

      const exId = exerciseData.exerciseId || this.findExerciseIdByName(exerciseData.exerciseName);
      const dayIndex = exerciseData.dayIndex || 1;
      const weekNumber = exerciseData.weekNumber || 1;

      let setResults = exerciseData.setResults;
      if (!setResults || setResults.length === 0) {
        if (exerciseData.actualReps !== undefined) {
          setResults = [{
            result: exerciseData.result || 'in_window',
            reps: exerciseData.actualReps,
            weightKg: exerciseData.weightKg,
            RPE: exerciseData.RPE || 7,
            tempoLoss: exerciseData.tempoLossCount >= 2
          }];
        } else {
          setResults = [];
        }
      }

      const previousSessionData = exerciseData.previousSessionData || (await this.getPreviousSessionData(exId, dayIndex));

      const exercise = this.getExercise(exId);
      if (!exercise) return null;

      let state = await DB.getProgressionState(exId);
      if (!state) {
        state = this.createInitialState(exId);
      }

      // 2. Calculate progression decision
      let decision;
      if (exercise.type === 'weighted' || exercise.startingWeight != null) {
        decision = this.calculateWeightedDecision(exercise, state, setResults, weekNumber, previousSessionData, exerciseData.isDeload);
        state.currentWeightKg = decision.newWeight;
        if (decision.action === 'increase' || decision.action === 'decrease') {
          state.sessionsAtWeight = 0;
          state.attemptsAtCurrentWeight = 0;
          state.consecutiveBelow = 0;
        } else if (decision.action === 'maintain') {
          state.attemptsAtCurrentWeight = (state.attemptsAtCurrentWeight || 0) + 1;
          if (decision.reason === 'bridge_fatigue_step_down') {
            // Sisyphus Protection: step down volume bridge by 1 set rather than wiping progress
            state.sessionsAtWeight = typeof decision.newSessionsAtWeight === 'number'
              ? decision.newSessionsAtWeight
              : Math.max(0, (state.sessionsAtWeight || 1) - 1);
            state.consecutiveBelow = 0;
          } else if (decision.reason === 'transition_buffer_maintain') {
            // Transition buffer maintains weight and resets consecutiveBelow during initial 2 attempts
            state.consecutiveBelow = 0;
          } else if (decision.reason === 'first_below_maintain') {
            // If they were in an expanded volume bridge (>1 session), step down by 1 rather than resetting to 0
            if ((state.sessionsAtWeight || 0) > 1) {
              state.sessionsAtWeight = state.sessionsAtWeight - 1;
            } else {
              state.sessionsAtWeight = 0;
            }
            state.consecutiveBelow = (state.consecutiveBelow || 0) + 1;
          } else if (decision.reason && decision.reason.includes('accumulating')) {
            state.sessionsAtWeight = (state.sessionsAtWeight || 0) + 1;
            state.consecutiveBelow = 0;
          } else {
            state.consecutiveBelow = 0;
          }
        }
      } else {
        decision = this.calculateStageDecision(exercise, state, setResults, weekNumber, previousSessionData);
        state.currentStageIndex = decision.newStageIndex;
        if (decision.action === 'increase_stage' || decision.action === 'decrease_stage') {
          state.consecutiveBelow = 0;
        } else if (decision.action === 'maintain') {
          if (decision.reason === 'first_below_maintain') {
            state.consecutiveBelow = (state.consecutiveBelow || 0) + 1;
          } else {
            state.consecutiveBelow = 0;
          }
        }
      }

      // v15.7 Accelerated: track performance metrics used by performance-based unlocks
      if (setResults && setResults.length > 0) {
        const repsList = setResults.map(s => s.reps || 0).filter(r => r > 0);
        if (repsList.length > 0) {
          state.lastSessionReps = Math.max(...repsList);
        }
        state.sessionsCompleted = (state.sessionsCompleted || 0) + 1;
      }

      state.lastUpdated = new Date().toISOString();
      await DB.saveProgressionState(state);

      // 3. Save progression history entry
      const historyEntry = {
        id: `dec_${exId}_${Date.now()}`,
        exerciseId: exId,
        dayIndex,
        weekNumber,
        action: decision.action,
        reason: decision.reason,
        weightKg: state.currentWeightKg,
        stageIndex: state.currentStageIndex,
        timestamp: new Date().toISOString()
      };
      await DB.saveProgressionHistory(historyEntry);

      // 4. Save next session rest
      const nextRest = this.calculateNextSessionRest(exercise, { sets: setResults });
      await DB.saveAdaptiveRest(exId, {
        exerciseId: exId,
        lastRestSecs: nextRest,
        targetRestSecs: exercise.restSeconds || 90,
        lastUpdated: new Date().toISOString()
      });

      return { state, decision, historyEntry, nextRest };
    }

    /**
     * Post-Injury Load Safe Reset (Auto-Deload on Joint Recovery)
     * When a joint recovers from an extended INJURED state (>= 10-14 days),
     * applies an automatic safe load reduction (-2 to -4 kg) to primary compound exercises
     * loading that joint to prevent tendon relapse and ensure safe re-acclimatization.
     *
     * @param {string} jointId - Recovered joint ID (e.g. 'knee_r', 'shoulder_l', 'lower_back')
     * @param {number} daysInjured - Days spent in INJURED state
     * @returns {Promise<Array<Object>>} affected exercises with their updated states
     */
    async applyInjuryRecoveryDeload(jointId, daysInjured = 14) {
      if (!jointId || typeof DB === 'undefined' || !DB.getProgressionState) return [];

      const affected = [];
      const adaptations = (typeof InjuryEngine !== 'undefined') ? InjuryEngine.EXERCISE_ADAPTATIONS : {};

      for (const [exName, rule] of Object.entries(adaptations)) {
        if (!rule.joints || !rule.joints.includes(jointId)) continue;
        const exId = this.findExerciseIdByName(exName) || exName.toLowerCase().replace(/\s+/g, '-');
        const exDef = this.getExercise(exId);
        if (!exDef || (exDef.type !== 'weighted' && exDef.startingWeight == null)) continue;

        let state = await DB.getProgressionState(exId);
        if (!state || !state.currentWeightKg) continue;

        const minW = exDef.minWeight || 6;
        if (state.currentWeightKg <= minW) continue;

        // Reduction magnitude: -4kg if load was heavy (>=18kg), else -2kg
        const reduction = (state.currentWeightKg >= 18) ? 4 : 2;
        const previousWeight = state.currentWeightKg;
        const newWeight = Math.max(minW, state.currentWeightKg - reduction);

        if (newWeight < previousWeight) {
          state.currentWeightKg = newWeight;
          state.sessionsAtWeight = 0;
          state.consecutiveBelow = 0;
          state.lastUpdated = new Date().toISOString();

          await DB.saveProgressionState(state);

          const historyEntry = {
            id: `dec_${exId}_${Date.now()}`,
            exerciseId: exId,
            action: 'decrease',
            reason: 'post_injury_recovery_deload',
            weightKg: newWeight,
            previousWeightKg: previousWeight,
            jointId,
            daysInjured: Math.round(daysInjured),
            timestamp: new Date().toISOString()
          };
          if (DB.saveProgressionHistory) {
            await DB.saveProgressionHistory(historyEntry);
          }

          affected.push({
            exerciseId: exId,
            exerciseName: exName,
            previousWeight,
            newWeight,
            reduction
          });
        }
      }

      if (affected.length > 0 && typeof window !== 'undefined' && window.UI && window.UI.toast && typeof I18n !== 'undefined') {
        const msg = `${I18n.t('injury_post_recovery_deload') || 'התאמת עומס בטיחותית לאחר פציעה'}: ${affected.map(a => `${a.exerciseName} (${a.newWeight}kg)`).join(', ')}`;
        UI.toast(msg, 'info', 6000);
      }

      return affected;
    }
  }

  window.ProgressionEngine = new ProgressionEngine();
})();
