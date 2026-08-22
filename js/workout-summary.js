/**
 * WorkoutSummary Module - Completion Celebration & Workout Stats Summary
 * Handles completion modal rendering, confetti/3D particle feedback, volume summary,
 * and post-workout navigation.
 */
const WorkoutSummary = (() => {
  'use strict';

  /**
   * Calculate summary metrics for completed workout
   */
  function computeSummaryStats(dayData, trackingData) {
    let totalCompletedExercises = 0;
    let totalVolumeKg = 0;
    let totalSetsCount = 0;

    if (!dayData || !dayData.exercises) {
      return { totalCompletedExercises: 0, totalVolumeKg: 0, totalSetsCount: 0 };
    }

    const setData = trackingData.setData || {};

    dayData.exercises.forEach((ex, exIndex) => {
      const isCompleted = trackingData.exerciseStatus && trackingData.exerciseStatus[`ex_${exIndex}`];
      if (isCompleted) totalCompletedExercises++;

      const setNum = ex.sets || 3;
      for (let s = 0; s < setNum; s++) {
        const weight = parseFloat(setData[`ex_${exIndex}_set_${s}_weight`]) || 0;
        const reps = parseInt(setData[`ex_${exIndex}_set_${s}_reps`], 10) || 0;
        if (reps > 0) {
          totalSetsCount++;
          totalVolumeKg += (weight * reps);
        }
      }
    });

    return {
      totalCompletedExercises,
      totalExercises: dayData.exercises.length,
      totalVolumeKg: Math.round(totalVolumeKg),
      totalSetsCount
    };
  }

  /**
   * Render workout completion modal
   */
  function showCompletionModal(dayData, trackingData, onConfirm) {
    const stats = computeSummaryStats(dayData, trackingData);

    // Trigger celebration particle effect
    if (typeof Effects3D !== 'undefined' && Effects3D.triggerWorkoutCompleteConfetti) {
      Effects3D.triggerWorkoutCompleteConfetti();
    } else if (typeof confetti === 'function') {
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
    }

    const title = I18n.t('workout_completed_title') || '🎉 Workout Complete!';
    const bodyHTML = `
      <div style="text-align: center; padding: 12px 0;">
        <div style="font-size: 54px; margin-bottom: 12px; animation: bounce 0.6s ease;">🏆</div>
        <h3 style="font-size: 20px; font-weight: 800; color: var(--text-primary); margin-bottom: 8px;">
          ${I18n.t('great_job') || 'Great Job! Workout Completed!'}
        </h3>
        <p style="font-size: 13px; color: var(--text-secondary); margin-bottom: 20px;">
          ${I18n.t('workout_summary_desc') || 'You completed all exercises for today according to the program specifications.'}
        </p>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 20px;">
          <div style="background: var(--bg-elevated); padding: 12px; border-radius: 12px; border: 1px solid var(--border-light);">
            <div style="font-size: 11px; color: var(--text-muted); font-weight: 700;">${I18n.t('completed_exercises') || 'Exercises'}</div>
            <div style="font-size: 22px; font-weight: 900; color: var(--accent-primary);">${stats.totalCompletedExercises}/${stats.totalExercises}</div>
          </div>
          <div style="background: var(--bg-elevated); padding: 12px; border-radius: 12px; border: 1px solid var(--border-light);">
            <div style="font-size: 11px; color: var(--text-muted); font-weight: 700;">${I18n.t('total_volume') || 'Total Volume'}</div>
            <div style="font-size: 22px; font-weight: 900; color: var(--success);">${stats.totalVolumeKg} <span style="font-size: 12px;">kg</span></div>
          </div>
        </div>

        <button id="modal-finish-workout-btn" class="btn-primary" style="width: 100%; padding: 14px; font-size: 16px; font-weight: 800;">
          ${I18n.t('finish_workout_btn') || '✓ Done & Save Progress'}
        </button>
      </div>
    `;

    if (typeof UI !== 'undefined' && UI.showModal) {
      UI.showModal(title, bodyHTML);
      const finishBtn = document.getElementById('modal-finish-workout-btn');
      if (finishBtn) {
        finishBtn.onclick = () => {
          UI.closeModal();
          if (onConfirm) onConfirm();
        };
      }
    }
  }

  return {
    computeSummaryStats,
    showCompletionModal
  };
})();

if (typeof window !== 'undefined') {
  window.WorkoutSummary = WorkoutSummary;
}
