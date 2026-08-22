/**
 * SetLogger Module - 3-Button Set Outcome Classification & Sequential Flow
 * Manages set outcome evaluation (ABOVE, IN_WINDOW, BELOW), sequential set locking,
 * and set logging state for FitUp Lean.
 */
const SetLogger = (() => {
  'use strict';

  /**
   * Determine set outcome classification based on reps, target window, and tempo loss
   */
  function evaluateSetOutcome(actualReps, windowMin, windowMax, tempoLossCount = 0) {
    if (tempoLossCount >= 2 || actualReps < windowMin) {
      return { result: 'BELOW', label: '⚠️ BELOW / Mechanical Stop', code: 'below' };
    }
    if (actualReps > windowMax && tempoLossCount === 0) {
      return { result: 'ABOVE', label: '🚀 ABOVE', code: 'above' };
    }
    return { result: 'IN_WINDOW', label: '✅ IN_WINDOW', code: 'in_window' };
  }

  /**
   * Check if a specific set is unlocked for logging (Sequential Flow Rule)
   * Set N can only be logged if Set N-1 is already completed.
   */
  function isSetUnlocked(exerciseStatus, setIndex) {
    if (setIndex === 0) return true;
    const prevSetKey = `set_${setIndex - 1}`;
    return Boolean(exerciseStatus && exerciseStatus[prevSetKey]);
  }

  /**
   * Perform cascading reset if an earlier set is uncompleted/cleared.
   * If set N is cleared, set N+1 and above are automatically cleared.
   */
  function applyCascadingReset(setData, targetSetIndex) {
    const updatedSetData = { ...setData };
    let index = targetSetIndex;
    while (updatedSetData[`set_${index}`] !== undefined) {
      delete updatedSetData[`set_${index}`];
      delete updatedSetData[`set_${index}_reps`];
      delete updatedSetData[`set_${index}_weight`];
      delete updatedSetData[`set_${index}_result`];
      index++;
    }
    return updatedSetData;
  }

  return {
    evaluateSetOutcome,
    isSetUnlocked,
    applyCascadingReset
  };
})();

if (typeof window !== 'undefined') {
  window.SetLogger = SetLogger;
}
