/**
 * RestTimer Module - Floating Rest Timer & Adaptive Rest Logic
 * Controls rest timer countdown, audio/haptic notifications, intra-workout rest extensions,
 * and completion suppression.
 */
const RestTimerController = (() => {
  'use strict';

  let timerInterval = null;
  let remainingSeconds = 0;
  let totalSeconds = 60;
  let isTimerActive = false;

  /**
   * Start or reset floating rest timer
   */
  function start(seconds, onTick, onComplete) {
    stop();
    remainingSeconds = Math.max(5, seconds);
    totalSeconds = remainingSeconds;
    isTimerActive = true;

    const timerDisplay = document.getElementById('rest-timer-display');
    const timerContainer = document.getElementById('rest-timer');

    if (timerContainer) timerContainer.classList.remove('hidden');
    updateDisplay();

    timerInterval = setInterval(() => {
      remainingSeconds--;
      updateDisplay();

      if (onTick) onTick(remainingSeconds);

      if (remainingSeconds <= 0) {
        stop();
        triggerCompletionAlert();
        if (onComplete) onComplete();
      }
    }, 1000);
  }

  /**
   * Stop floating timer
   */
  function stop() {
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
    isTimerActive = false;
    const timerContainer = document.getElementById('rest-timer');
    if (timerContainer) timerContainer.classList.add('hidden');
  }

  /**
   * Skip active timer
   */
  function skip(onComplete) {
    stop();
    triggerCompletionAlert();
    if (onComplete) onComplete();
  }

  /**
   * Add or subtract seconds to active timer
   */
  function addTime(extraSeconds) {
    if (!isTimerActive) return;
    remainingSeconds += extraSeconds;
    if (remainingSeconds <= 0) {
      stop();
      triggerCompletionAlert();
      return;
    }
    totalSeconds = Math.max(totalSeconds, remainingSeconds);
    updateDisplay();
  }

  /**
   * Format and display time (MM:SS) & update progress bar
   */
  function updateDisplay() {
    const timerDisplay = document.getElementById('rest-timer-display');
    if (timerDisplay) {
      const mins = Math.floor(Math.max(0, remainingSeconds) / 60);
      const secs = Math.max(0, remainingSeconds) % 60;
      timerDisplay.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }
    const progressBar = document.getElementById('rest-timer-progress-bar');
    if (progressBar) {
      const pct = totalSeconds > 0 ? Math.max(0, Math.min(100, (remainingSeconds / totalSeconds) * 100)) : 0;
      progressBar.style.width = `${pct}%`;
    }
  }

  /**
   * Sound and Vibration alert on timer completion
   */
  function triggerCompletionAlert() {
    if (typeof Effects3D !== 'undefined' && Effects3D.playTimerBeep) {
      Effects3D.playTimerBeep();
    }
    if (navigator.vibrate) {
      navigator.vibrate([200, 100, 200]);
    }
  }

  /**
   * Calculate intra-workout adaptive rest (+30s if set outcome is BELOW)
   */
  function calculateIntraWorkoutRest(baseRestSeconds, isBelowOutcome) {
    if (isBelowOutcome) {
      const extendedRest = Math.min(180, baseRestSeconds + 30);
      return {
        restSeconds: extendedRest,
        wasExtended: true,
        message: `המנוחה הבאה: ${extendedRest} שניות (עקב ירידה בביצוע)`
      };
    }
    return {
      restSeconds: baseRestSeconds,
      wasExtended: false,
      message: `מנוחה: ${baseRestSeconds} שניות`
    };
  }

  return {
    start,
    stop,
    skip,
    addTime,
    calculateIntraWorkoutRest,
    isActive: () => isTimerActive,
    getRemainingSeconds: () => remainingSeconds
  };
})();

if (typeof window !== 'undefined') {
  window.RestTimerController = RestTimerController;
}
