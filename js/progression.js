/**
 * FitUp v15.6 Lean Progression Engine
 * Zero Decisions Automation Engine for Progressive Overload, Rest Adaptation,
 * Myo-Reps Cluster Tracking, Microcycle Management, and Structural Toggles.
 */

(function () {
  'use strict';

  const ProgressionEngine = {
    // ----------------------------
    // 1. Progression State Management
    // ----------------------------
    async getExerciseState(exerciseName) {
      if (!window.DB) return null;
      let state = await DB.getProgressionState(exerciseName);
      if (!state) {
        state = {
          exerciseName,
          currentWeightKg: 0,
          currentReps: 8,
          consecutiveFailures: 0,
          currentStageIndex: 0,
          isDeloading: false,
          lastUpdated: new Date().toISOString()
        };
      }
      return state;
    },

    // ----------------------------
    // 2. Softened Progression Logic
    // ----------------------------
    calculateNextProgression(currentState, performanceData) {
      // performanceData: { targetReps, actualReps, weightKg, RPE, tempoLossCount }
      const { targetReps, actualReps, weightKg, tempoLossCount = 0 } = performanceData;
      const state = { ...currentState };
      
      const success = (actualReps >= targetReps) && (tempoLossCount < 2);

      if (success) {
        state.consecutiveFailures = 0;
        state.isDeloading = false;
        // Micro-load increment (+1kg to +2.5kg based on load)
        const increment = weightKg >= 20 ? 2.5 : 1.0;
        state.currentWeightKg = (weightKg || 0) + increment;
        state.currentReps = targetReps;
      } else {
        state.consecutiveFailures = (state.consecutiveFailures || 0) + 1;
        if (state.consecutiveFailures >= 2) {
          // Trigger automatic deload (15% load reduction, flags deloading)
          state.isDeloading = true;
          state.currentWeightKg = Math.max(0, Math.round((weightKg || 0) * 0.85 * 2) / 2);
          state.consecutiveFailures = 0; // Reset count post-deload trigger
        } else {
          // Retain weight for second attempt
          state.currentWeightKg = weightKg;
        }
      }

      state.lastUpdated = new Date().toISOString();
      return { newState: state, success, triggeredDeload: state.isDeloading };
    },

    // ----------------------------
    // 3. Adaptive Rest Time Algorithm
    // ----------------------------
    calculateAdaptiveRest(exerciseName, targetRest, actualReps, targetReps, tempoLossCount = 0, rpe = 7) {
      let rest = targetRest || 90;
      
      // If tempo loss >= 2 or reps dropped -> recovery demand is higher (+30s)
      if (tempoLossCount >= 2 || actualReps < targetReps) {
        rest += 30;
      } else if (rpe <= 6 && tempoLossCount === 0 && actualReps >= targetReps) {
        // High execution performance -> reduce rest (-15s)
        rest -= 15;
      }

      // Bound adaptive rest between 45s and 180s
      rest = Math.max(45, Math.min(180, rest));
      return rest;
    },

    // ----------------------------
    // 4. Myo-Reps Engine with 2-Tempo-Loss Stop Rule
    // ----------------------------
    evaluateMyoSet(activationReps, miniSetsData = []) {
      // miniSetsData: [{ reps: 4, tempoLoss: 0 }, { reps: 3, tempoLoss: 1 }, ...]
      let totalTempoLoss = 0;
      let totalMiniReps = 0;
      let stopReason = null;
      const completedMiniSets = [];

      for (let i = 0; i < miniSetsData.length; i++) {
        const mini = miniSetsData[i];
        if (i >= 5) {
          stopReason = 'MAX_MINI_SETS';
          break;
        }

        totalTempoLoss += mini.tempoLoss || 0;
        
        if (mini.reps < 2) {
          stopReason = 'REPS_BELOW_THRESHOLD';
          completedMiniSets.push(mini);
          totalMiniReps += mini.reps;
          break;
        }

        completedMiniSets.push(mini);
        totalMiniReps += mini.reps;

        if (totalTempoLoss >= 2 || (mini.tempoLoss || 0) >= 2) {
          stopReason = 'TEMPO_LOSS_STOP_RULE';
          break;
        }
      }

      return {
        activationReps,
        totalMiniReps,
        totalReps: activationReps + totalMiniReps,
        completedMiniSetsCount: completedMiniSets.length,
        totalTempoLoss,
        stopReason: stopReason || 'COMPLETED',
        shouldStopNext: completedMiniSets.length >= 5 || totalTempoLoss >= 2
      };
    },

    // ----------------------------
    // 5. Biceps Microcycle Controller
    // ----------------------------
    getBicepsMicrocyclePhase(weekNumber) {
      // 3-week microcycle: Weeks 1-2 = HEAVY, Week 3 = LIGHT / MYO Focus
      const cycleWeek = ((weekNumber - 1) % 3) + 1;
      if (cycleWeek === 3) {
        return {
          phase: 'LIGHT_MYO',
          label: 'Light / Myo-Rep Focus',
          targetReps: '12-15',
          intensity: 'Moderate Weight / High Density',
          restSeconds: 60
        };
      }
      return {
        phase: 'HEAVY_PROGRESSIVE',
        label: 'Heavy Progressive Overload',
        targetReps: '8-10',
        intensity: 'Heavy Weight / Standard Rest',
        restSeconds: 90
      };
    },

    // ----------------------------
    // 6. Arm Block Frequency Guard
    // ----------------------------
    async canAddArmBlock(muscleArea, currentWeek) {
      if (!window.DB) return { allowed: true, count: 0 };
      const exposures = await DB.getArmBlockExposure();
      const weeklyExposures = exposures.filter(
        e => e.muscleArea === muscleArea && e.week === currentWeek
      );
      const count = weeklyExposures.length;
      return {
        allowed: count < 2,
        count,
        maxAllowed: 2
      };
    },

    async logArmBlockExposure(muscleArea, currentWeek, sessionDetails = {}) {
      if (!window.DB) return;
      const exposureRecord = {
        id: `${muscleArea}_W${currentWeek}_${Date.now()}`,
        muscleArea,
        week: currentWeek,
        timestamp: new Date().toISOString(),
        ...sessionDetails
      };
      await DB.saveArmBlockExposure(exposureRecord);
      
      // Update status record
      const status = (await DB.getArmBlockStatus(muscleArea)) || { muscleArea, totalExposures: 0 };
      status.totalExposures = (status.totalExposures || 0) + 1;
      status.lastExposureWeek = currentWeek;
      status.lastUpdated = new Date().toISOString();
      await DB.saveArmBlockStatus(muscleArea, status);
    },

    // ----------------------------
    // 7. Atomic Progression Transaction Commit
    // ----------------------------
    async commitExerciseProgression(exerciseData) {
      if (!window.DB) return null;

      const {
        exerciseName,
        dayIndex,
        weekNumber,
        targetReps,
        actualReps,
        weightKg,
        RPE = 7,
        tempoLossCount = 0,
        isMyoSet = false,
        myoDetails = null,
        isArmBlock = false,
        muscleArea = null,
        targetRest = 90
      } = exerciseData;

      // 1. Fetch active state
      const currentState = await this.getExerciseState(exerciseName);

      // 2. Evaluate progression
      const { newState, success, triggeredDeload } = this.calculateNextProgression(
        currentState,
        { targetReps, actualReps, weightKg, RPE, tempoLossCount }
      );

      // 3. Save new state
      await DB.saveProgressionState(newState);

      // 4. Log progression history
      const historyEntry = {
        id: `${exerciseName}_${Date.now()}`,
        exerciseName,
        dayIndex,
        weekNumber,
        weightKg,
        actualReps,
        targetReps,
        RPE,
        tempoLossCount,
        success,
        triggeredDeload,
        timestamp: new Date().toISOString()
      };
      await DB.saveProgressionHistory(historyEntry);

      // 5. Calculate and persist adaptive rest
      const adaptedRest = this.calculateAdaptiveRest(
        exerciseName, targetRest, actualReps, targetReps, tempoLossCount, RPE
      );
      await DB.saveAdaptiveRest(exerciseName, {
        exerciseName,
        lastRestSecs: adaptedRest,
        targetRestSecs: targetRest,
        lastUpdated: new Date().toISOString()
      });

      // 6. Record Myo-Rep cluster log if applicable
      if (isMyoSet && myoDetails) {
        const myoEvaluation = this.evaluateMyoSet(myoDetails.activationReps, myoDetails.miniSets);
        await DB.saveMyoClusterHistory({
          id: `myo_${exerciseName}_${Date.now()}`,
          exerciseName,
          dayIndex,
          weekNumber,
          evaluation: myoEvaluation,
          timestamp: new Date().toISOString()
        });
      }

      // 7. Record Arm Block exposure log if applicable
      if (isArmBlock && muscleArea) {
        await this.logArmBlockExposure(muscleArea, weekNumber, { exerciseName, dayIndex });
      }

      return {
        newState,
        historyEntry,
        adaptedRest,
        success,
        triggeredDeload
      };
    }
  };

  window.ProgressionEngine = ProgressionEngine;
})();
