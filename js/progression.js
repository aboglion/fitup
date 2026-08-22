/**
 * FitUp v15.6 Lean Progression Engine
 * Zero Decisions Automation Engine for Progressive Overload, Rest Adaptation,
 * Myo-Reps Cluster Tracking, Microcycle Management, and Structural Toggles.
 */

(function () {
  'use strict';

  class ProgressionEngine {
    constructor(settings) {
      this.settings = settings || window.TRAINING_DATA?.progressionSettings || {
        deloadEveryWeeks: 8,
        armBlock: {
          enabledFromWeek: 10,
          maxArmBlockExposurePerMusclePerWeek: 1,
          muscleAreaMap: {
            3: { "db-lateral-raise": "lateral-shoulder", "db-oh-triceps-extension": "triceps" },
            5: { "db-curl": "biceps", "hammer-curl": "biceps" }
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

      // Condition 3: Previous session exists, all sets were at windowMax, no mechanical stop
      if (!previousSessionData || !previousSessionData.sets || previousSessionData.sets.length === 0) {
        return false;
      }
      const prevSets = previousSessionData.sets;
      const prevAllMax = prevSets.every(s => (s.reps || 0) >= (exercise.windowMax || 12) && !s.mechanicalStop);

      return prevAllMax;
    }

    // ----------------------------
    // 2. Progression Decision Calculators
    // ----------------------------
    calculateWeightedDecision(exercise, state, setResults, weekNumber, previousSessionData) {
      const isDeload = weekNumber % this.settings.deloadEveryWeeks === 0;
      const currentWeight = state ? state.currentWeightKg : (exercise.startingWeight || 6);

      if (isDeload) {
        return {
          action: 'maintain',
          newWeight: currentWeight,
          reason: 'deload_week_no_progression'
        };
      }

      const evaluation = this.evaluateSetResults(exercise, setResults);
      const softened = this.checkSoftenedProgression(exercise, state, setResults, previousSessionData);

      if (evaluation === 'all_above' || softened) {
        const increment = exercise.increment || 1;
        const newWeight = Math.min(exercise.maxWeight || 24, currentWeight + increment);
        return {
          action: 'increase',
          newWeight,
          reason: evaluation === 'all_above' ? 'all_above_max' : 'softened_progression_achieved'
        };
      }

      if (evaluation === 'all_below') {
        const decrement = exercise.increment || 1;
        const newWeight = Math.max(exercise.minWeight || 3, currentWeight - decrement);
        return {
          action: 'decrease',
          newWeight,
          reason: 'all_below_window'
        };
      }

      return {
        action: 'maintain',
        newWeight: currentWeight,
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
        const newStageIndex = Math.max(0, currentStageIndex - 1);
        return {
          action: newStageIndex < currentStageIndex ? 'decrease_stage' : 'maintain',
          newStageIndex,
          stageName: stages[newStageIndex] || '',
          reason: 'all_below_window'
        };
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
      if (weekNumber % (this.settings.deloadEveryWeeks || 8) === 0) {
        return { type: 'deload', exercises: ['hammer-curl'], sets: 1, progressionAllowed: false };
      }

      const cyclePosition = ((weekNumber - 1) % 3) + 1;
      if (cyclePosition === 3) {
        return { type: 'light', exercises: ['hammer-curl'], sets: 2, progressionAllowed: false };
      }

      return { type: 'heavy', exercises: ['db-curl', 'hammer-curl'], sets: 'progressive', progressionAllowed: true };
    }

    // ----------------------------
    // 5. Arm Block & Frequency Guard
    // ----------------------------
    isArmBlockAllowed(dayTrackingData, weekNumber, existingExposures = []) {
      const armBlockCfg = this.settings.armBlock || { enabledFromWeek: 10, maxArmBlockExposurePerMusclePerWeek: 1 };

      if (weekNumber < armBlockCfg.enabledFromWeek) {
        return { active: false, reason: 'arm_block_not_started_yet' };
      }

      if (weekNumber % (this.settings.deloadEveryWeeks || 8) === 0) {
        return { active: true, sets: 1, reason: 'deload_single_set' };
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
      const isDeload = weekNumber % (this.settings.deloadEveryWeeks || 8) === 0;

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
      const isDeload = weekNumber % (this.settings.deloadEveryWeeks || 8) === 0;
      if (isDeload) return false;

      // Check biceps microcycle week 3 (light week) where db-curl is disabled
      if (pair.id === 'd5-pushup-curl') {
        const cyclePos = ((weekNumber - 1) % 3) + 1;
        if (cyclePos === 3) return false;
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
    async commitExerciseProgression(exerciseData) {
      if (!window.DB) return null;

      const {
        exerciseId,
        dayIndex,
        weekNumber,
        setResults = [],
        previousSessionData = null
      } = exerciseData;

      const exercise = this.getExercise(exerciseId);
      if (!exercise) return null;

      // 1. Fetch current progression state
      let state = await DB.getProgressionState(exerciseId);
      if (!state) {
        state = {
          exerciseId,
          sessionKey: exerciseId,
          currentWeightKg: exercise.startingWeight || 6,
          currentStageIndex: 0,
          unlocked: exercise.unlocked ?? true,
          lastUpdated: new Date().toISOString()
        };
      }

      // 2. Calculate progression decision
      let decision;
      if (exercise.type === 'weighted') {
        decision = this.calculateWeightedDecision(exercise, state, setResults, weekNumber, previousSessionData);
        state.currentWeightKg = decision.newWeight;
      } else {
        decision = this.calculateStageDecision(exercise, state, setResults, weekNumber, previousSessionData);
        state.currentStageIndex = decision.newStageIndex;
      }

      state.lastUpdated = new Date().toISOString();
      await DB.saveProgressionState(state);

      // 3. Save progression history entry
      const historyEntry = {
        id: `dec_${exerciseId}_${Date.now()}`,
        exerciseId,
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
      await DB.saveAdaptiveRest(exerciseId, {
        exerciseId,
        lastRestSecs: nextRest,
        targetRestSecs: exercise.restSeconds || 90,
        lastUpdated: new Date().toISOString()
      });

      return { state, decision, historyEntry, nextRest };
    }
  }

  window.ProgressionEngine = new ProgressionEngine();
})();
