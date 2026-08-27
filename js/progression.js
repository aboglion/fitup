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
        return { type: 'deload', exercises: ['hammer-curl', 'single-arm-hammer-curl'], sets: 1, progressionAllowed: false };
      }

      const cyclePosition = ((weekNumber - 1) % 3) + 1;
      if (cyclePosition === 3) {
        return { type: 'light', exercises: ['hammer-curl', 'single-arm-hammer-curl'], sets: 2, progressionAllowed: false };
      }

      return { type: 'heavy', exercises: ['db-curl', 'single-arm-curl', 'hammer-curl', 'single-arm-hammer-curl'], sets: 'progressive', progressionAllowed: true };
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
    checkUnlockCriteria(exerciseId, allProgressionStates = {}) {
      const exercise = this.getExercise(exerciseId);
      if (!exercise) return { unlocked: true, reason: 'Exercise not found' };
      
      if (exercise.id === 'pistol-squat-progression') {
        // Unlock criteria: Goblet Reverse Lunge at 24kg total (= 24kg on single dumbbell)
        const lungeState = allProgressionStates['reverse-lunge'] || allProgressionStates['goblet-reverse-lunge'] || allProgressionStates['single-leg-rdl'];
        if (lungeState && (lungeState.currentWeightKg >= 24 || lungeState.currentStageIndex >= 2)) {
          return { unlocked: true, reason: 'Prerequisite strength achieved (24kg Goblet Reverse Lunge)' };
        }
        return { unlocked: false, reason: 'Requires Goblet Reverse Lunge 24kg total' };
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
      const deloadReduction = window.TRAINING_DATA?.progressionSettings?.deloadWeightReductionKg || 3;

      if (exercise.type === 'weighted') {
        const minW = exercise.minWeight || 3;
        updated.currentWeightKg = Math.max(minW, (updated.currentWeightKg || exercise.startingWeight || 6) - deloadReduction);
      } else if (exercise.stages && exercise.stages.length > 0) {
        updated.currentStageIndex = Math.max(0, (updated.currentStageIndex || 0) - 1);
      }

      updated.lastUpdated = new Date().toISOString();
      return updated;
    }

    // ----------------------------
    // Create Initial State
    // ----------------------------
    createInitialState(exerciseId) {
      const exercise = this.getExercise(exerciseId);
      const startWeight = exercise ? (exercise.startingWeight || 3) : 3;
      return {
        exerciseId,
        sessionKey: exerciseId,
        currentWeightKg: startWeight,
        currentStageIndex: 0,
        unlocked: exercise ? (exercise.unlocked ?? true) : true,
        lastUpdated: new Date().toISOString()
      };
    }

    // ----------------------------
    // Get Display Prescription
    // ----------------------------
    getDisplayPrescription(exerciseId, weekNumber = 1, state = null) {
      const exercise = this.getExercise(exerciseId);
      if (!exercise) return null;

      const isDeload = weekNumber % 8 === 0;
      const bicepsConfig = window.TRAINING_DATA?.progressionSettings?.bicepsMicrocycle;
      const isBicepsLightWeek = bicepsConfig && (weekNumber % bicepsConfig.cycleLength === 0);

      let sets = exercise.sets || 3;
      if (isDeload) sets = Math.min(sets, 2);
      else if (isBicepsLightWeek && (exercise.id === 'db-curl' || exercise.id === 'single-arm-curl' || exercise.id === 'hammer-curl' || exercise.id === 'single-arm-hammer-curl')) {
        sets = bicepsConfig.lightWeekSets || 2;
      }

      const currentWeight = state ? state.currentWeightKg : (exercise.startingWeight || 3);
      const currentStage = state ? (exercise.stages ? exercise.stages[state.currentStageIndex || 0] : null) : (exercise.stages ? exercise.stages[0] : null);

      return {
        exerciseId: exercise.id,
        name: exercise.name,
        sets,
        repWindow: exercise.repWindow || (exercise.windowMin && exercise.windowMax ? exercise.windowMin + "–" + exercise.windowMax : "8–12"),
        targetWeightKg: isDeload ? Math.max(exercise.minWeight || 3, currentWeight - 3) : currentWeight,
        targetStage: currentStage,
        restSeconds: exercise.rest || exercise.restSeconds || 60,
        isDeload,
        isBicepsLightWeek
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

          const exIdx = pastDay.exercises.findIndex(e => e.id === exerciseId || e.name === exerciseId);
          if (exIdx === -1) continue;

          const tracking = allTracking.find(t => t.dayIndex === i);
          if (!tracking || !tracking.setData || !tracking.setData[exIdx]) continue;

          const setData = tracking.setData[exIdx];
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
            return { dayIndex: i, sets };
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
  }

  window.ProgressionEngine = new ProgressionEngine();
})();
