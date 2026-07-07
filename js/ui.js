/**
 * UI Utilities Module
 */
const UI = (() => {

  /**
   * Show a toast notification
   */
  function toast(message, type = 'info', duration = 3000) {
    const container = document.getElementById('toast-container');
    const el = document.createElement('div');
    el.className = `toast ${type}`;

    const icons = { success: '✓', error: '✗', info: 'ℹ' };
    el.innerHTML = `<span>${icons[type] || 'ℹ'}</span> ${message}`;

    container.appendChild(el);

    setTimeout(() => {
      el.classList.add('removing');
      setTimeout(() => el.remove(), 300);
    }, duration);
  }

  /**
   * Show modal
   */
  function showModal(title, bodyHTML) {
    document.getElementById('modal-title').textContent = title;
    document.getElementById('modal-body').innerHTML = bodyHTML;
    document.getElementById('modal-overlay').classList.remove('hidden');
  }

  /**
   * Hide modal
   */
  function hideModal() {
    document.getElementById('modal-overlay').classList.add('hidden');
  }

  /**
   * Get day type display info
   */
  function getDayTypeInfo(type) {
    const types = {
      'כוח': { label: 'כוח 💪', class: 'strength', icon: '💪' },
      'הליכה': { label: 'הליכה 🚶', class: 'walk', icon: '🚶' },
      'מנוחה': { label: 'מנוחה 😴', class: 'rest', icon: '😴' }
    };
    return types[type] || { label: type, class: '', icon: '📋' };
  }

  /**
   * Get category color
   */
  function getCategoryColor(slot) {
    const colors = {
      'A1': '#f97316',
      'A2': '#f59e0b',
      'B1': '#10b981',
      'B2': '#06b6d4',
      'C1': '#3b82f6',
      'C2': '#8b5cf6',
      'D1': '#ec4899',
      'D2': '#f43f5e',
      'extra': '#6b7280'
    };
    return colors[slot] || '#6b7280';
  }

  /**
   * Get category label
   */
  function getCategoryLabel(slot) {
    const labels = {
      'A1': 'A1 - דחיפה',
      'A2': 'A2 - משיכה',
      'B1': 'B1 - תליה/משיכה',
      'B2': 'B2 - כתפיים',
      'C1': 'C1 - רגליים',
      'C2': 'C2 - ישבן/גב',
      'D1': 'D1 - ליבה',
      'D2': 'D2 - ליבה צידית',
      'extra': 'תוספות'
    };
    return labels[slot] || slot;
  }

  /**
   * Parse date string to Date object
   */
  function parseDate(dateStr) {
    if (!dateStr) return null;
    // Format: DD/MM/YYYY or YYYY-MM-DD HH:MM:SS
    if (dateStr.includes('/')) {
      const [d, m, y] = dateStr.split('/');
      return new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
    }
    return new Date(dateStr);
  }

  /**
   * Format date for display
   */
  function formatDate(dateStr) {
    const date = parseDate(dateStr);
    if (!date || isNaN(date.getTime())) return dateStr;
    return date.toLocaleDateString('he-IL', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  }

  /**
   * Format short date
   */
  function formatShortDate(dateStr) {
    const date = parseDate(dateStr);
    if (!date || isNaN(date.getTime())) return '';
    return date.toLocaleDateString('he-IL', { day: 'numeric', month: 'numeric' });
  }

  function findTodayIndex(planDays) {
    return window.appCurrentPlanIndex || 0;
  }

  /**
   * Parse sets string to get number of sets
   * e.g., "3×10-12" → 3, "2×8-12" → 2
   */
  function parseSetsCount(setsStr) {
    if (!setsStr) return 0;
    const match = setsStr.match(/(\d+)\s*[×x]/i);
    return match ? parseInt(match[1]) : 1;
  }

  /**
   * Parse reps from sets string
   * e.g., "3×10-12" → "10-12"
   */
  function parseReps(setsStr) {
    if (!setsStr) return '';
    const match = setsStr.match(/[×x]\s*(.+)/i);
    return match ? match[1].trim() : setsStr;
  }

  /**
   * Get difficulty class
   */
  function getDifficultyClass(diff) {
    if (!diff) return 'intermediate';
    if (diff.includes('מתחיל')) return 'beginner';
    if (diff.includes('מתקדם') || diff.includes('קשה')) return 'advanced';
    return 'intermediate';
  }

  /**
   * Get required equipment based on exercise name
   */
  function getEquipment(name) {
    if (!name) return null;
    const n = name.toLowerCase();
    
    if (n.includes('band') || n.includes('pallof') || n.includes('face pull')) return { label: 'גומיה', icon: '➰' };
    if (n.includes('wall')) return { label: 'קיר', icon: '🧱' };
    if (n.includes('box') || n.includes('bulgarian') || n.includes('incline') || n.includes('hip thrust') || n.includes('copenhagen')) return { label: 'כיסא', icon: '🪑' };
    if (n.includes('hang') || n.includes('pull-up') || n.includes('inverted row') || n.includes('chin-up')) return { label: 'מוט', icon: '🧗‍♂️' };
    if (n.includes('foam roll')) return { label: 'גליל עיסוי', icon: '🪵' };
    
    // Default or bodyweight exercises
    return { label: 'ללא ציוד', icon: '💪' };
  }

  // Rest Timer Logic
  let timerInterval;
  let timerEndTime;
  let timerOnComplete = null;

  function initTimer() {
    document.getElementById('rest-timer-close').addEventListener('click', () => {
      document.getElementById('rest-timer').classList.add('hidden');
      clearInterval(timerInterval);
      timerOnComplete = null;
    });

    document.querySelectorAll('.timer-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const seconds = parseInt(e.target.dataset.time);
        let remaining = 0;
        if (timerEndTime && timerEndTime > Date.now()) {
            remaining = Math.round((timerEndTime - Date.now()) / 1000);
        }
        // If timer is already running, add time. Otherwise set it.
        startTimer(remaining > 0 ? remaining + seconds : seconds, timerOnComplete);
      });
    });
  }

  function startTimer(seconds, onComplete = null) {
    document.getElementById('rest-timer').classList.remove('hidden');
    clearInterval(timerInterval);
    
    if (onComplete !== undefined) {
      timerOnComplete = onComplete;
    }
    
    timerEndTime = Date.now() + seconds * 1000;
    updateTimerDisplay(seconds);

    timerInterval = setInterval(() => {
      const remaining = Math.round((timerEndTime - Date.now()) / 1000);
      if (remaining <= 0) {
        clearInterval(timerInterval);
        updateTimerDisplay(0);
        playTimerSound();
        UI.toast('המנוחה הסתיימה! 💪', 'success');
        
        setTimeout(() => {
          document.getElementById('rest-timer').classList.add('hidden');
          if (typeof timerOnComplete === 'function') {
            timerOnComplete();
          }
          timerOnComplete = null;
        }, 1500);
      } else {
        updateTimerDisplay(remaining);
      }
    }, 1000);
  }

  function updateTimerDisplay(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    document.getElementById('rest-timer-display').textContent = 
      `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  function playTimerSound() {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.5, ctx.currentTime + 0.05);
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.5);
      osc.start();
      osc.stop(ctx.currentTime + 0.5);
    } catch (e) {
      // Audio not supported
    }
  }

  // Modal close handlers
  document.getElementById('modal-close').addEventListener('click', hideModal);
  document.getElementById('modal-overlay').addEventListener('click', (e) => {
    if (e.target === document.getElementById('modal-overlay')) hideModal();
  });

  return {
    toast,
    showModal,
    hideModal,
    getDayTypeInfo,
    getCategoryColor,
    getCategoryLabel,
    parseDate,
    formatDate,
    formatShortDate,
    findTodayIndex,
    parseSetsCount,
    parseReps,
    getDifficultyClass,
    getEquipment,
    initTimer,
    startTimer
  };
})();

window.UI = UI;
