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

  let modalStack = [];
  let isHiding = false;

  /**
   * Show modal
   */
  function showModal(title, bodyHTML) {
    modalStack.push({ title, bodyHTML });
    history.pushState({ isModal: true }, '');
    
    renderCurrentModal();
  }

  function renderCurrentModal() {
    if (modalStack.length === 0) {
      document.getElementById('modal-overlay').classList.add('hidden');
      return;
    }
    const current = modalStack[modalStack.length - 1];
    document.getElementById('modal-title').textContent = current.title;
    document.getElementById('modal-body').innerHTML = current.bodyHTML;
    document.getElementById('modal-overlay').classList.remove('hidden');
  }

  /**
   * Hide modal
   */
  function hideModal() {
    if (modalStack.length > 0) {
      if (!isHiding) {
        isHiding = true;
        history.back();
        setTimeout(() => { isHiding = false; }, 100);
      }
    } else {
      document.getElementById('modal-overlay').classList.add('hidden');
    }
  }

  // Handle browser back button for modals
  window.addEventListener('popstate', (e) => {
    if (modalStack.length > 0) {
      modalStack.pop();
      renderCurrentModal();
    }
  });

  const imageTrials = {};

  function handleImageFallback(imgEl, type) {
    const currentSrc = imgEl.src;
    const urlDecoded = decodeURIComponent(currentSrc);
    
    if (type === 'gif') {
      const match = urlDecoded.match(/images\/gifs\/([^/]+)$/);
      if (match) {
        const filename = match[1];
        const lastDot = filename.lastIndexOf('.');
        const baseName = lastDot !== -1 ? filename.substring(0, lastDot) : filename;
        const cleanBase = baseName.replace(/[-_]+/g, ' ');
        const variations = [
          cleanBase.toUpperCase() + '.gif',
          cleanBase.toLowerCase() + '.gif',
          cleanBase.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ') + '.gif',
          cleanBase.replace(/\s+/g, '_') + '.gif',
          cleanBase.replace(/\s+/g, '_').toLowerCase() + '.gif',
          cleanBase.replace(/\s+/g, '_').toUpperCase() + '.gif',
          cleanBase.replace(/\s+/g, '-') + '.gif',
          cleanBase.replace(/\s+/g, '-').toLowerCase() + '.gif',
        ];
        
        if (!imageTrials[filename]) {
          imageTrials[filename] = 0;
        }
        
        const trialIndex = imageTrials[filename];
        if (trialIndex < variations.length) {
          imageTrials[filename]++;
          imgEl.src = `images/gifs/${variations[trialIndex]}`;
          return;
        }
      }
      imgEl.style.display = 'none';
    } else if (type === 'png') {
      const match = urlDecoded.match(/images\/exercises\/([^/]+)$/);
      if (match) {
        const filename = match[1];
        const lastDot = filename.lastIndexOf('.');
        const baseName = lastDot !== -1 ? filename.substring(0, lastDot) : filename;
        const cleanBase = baseName.replace(/[-_]+/g, ' ');
        const variations = [
          cleanBase.toUpperCase() + '.png',
          cleanBase.toLowerCase() + '.png',
          cleanBase.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ') + '.png',
          cleanBase.replace(/\s+/g, '_') + '.png',
          cleanBase.replace(/\s+/g, '_').toLowerCase() + '.png',
          cleanBase.replace(/\s+/g, '_').toUpperCase() + '.png',
          cleanBase.replace(/\s+/g, '-') + '.png',
          cleanBase.replace(/\s+/g, '-').toLowerCase() + '.png',
        ];
        
        if (!imageTrials[filename]) {
          imageTrials[filename] = 0;
        }
        
        const trialIndex = imageTrials[filename];
        if (trialIndex < variations.length) {
          imageTrials[filename]++;
          imgEl.src = `images/exercises/${variations[trialIndex]}`;
          return;
        }
      }
      if (imgEl.classList.contains('exercise-image') || imgEl.classList.contains('exercise-hero-image')) {
        if (imgEl.parentElement) imgEl.parentElement.style.display = 'none';
      } else {
        imgEl.style.display = 'none';
      }
    }
  }

  function showImageModal(title, src) {
    const pngPath = `images/exercises/${title.replace(/\//g, '-').toUpperCase()}.png`;
    const gifPath = `images/gifs/${title}.gif`;
    
    let extraNote = '';
    const lowerTitle = title.toLowerCase();
    if (lowerTitle.includes('chin-up') || lowerTitle.includes('pull-up')) {
      extraNote = `
        <div style="background: rgba(59, 130, 246, 0.1); padding: 12px; border-radius: 8px; border: 1px solid rgba(59, 130, 246, 0.3); margin-top: 12px; text-align: right; direction: rtl;">
          <p style="font-size: 14px; margin-bottom: 8px; color: var(--text-primary);"><strong>💡 הבדלי אחיזה - חשוב לזכור:</strong></p>
          <ul style="font-size: 13px; color: var(--text-secondary); padding-right: 20px; margin: 0; line-height: 1.5;">
            <li style="margin-bottom: 4px;"><strong>Chin-up:</strong> כפות הידיים פונות לכיוון הפנים (אחיזה תחתית).</li>
            <li><strong>Pull-up:</strong> כפות הידיים באחיזה פונות לכיוון חוץ (אחיזה עילית).</li>
          </ul>
        </div>
      `;
    }
    
    showModal(title, `
      <div style="display: flex; flex-direction: column; gap: 16px; width: 100%; direction: rtl;">
        <img src="${pngPath}" style="width:100%; border-radius:8px; object-fit: contain; max-height: 40vh; display: block; margin: 0 auto;" alt="${title} תמונה" onerror="UI.handleImageFallback(this, 'png')">
        <img src="${gifPath}" style="width:100%; border-radius:8px; object-fit: contain; max-height: 40vh; display: block; margin: 0 auto;" alt="${title} GIF" onerror="UI.handleImageFallback(this, 'gif')">
        ${extraNote}
      </div>
    `);
  }


  /**
   * Get day type display info
   */
  function getDayTypeInfo(type) {
    const types = {
      'Lower Strength': { label: 'Lower Strength 🦵', class: 'strength', icon: '🦵' },
      'Upper Push': { label: 'Upper Push 💥', class: 'strength', icon: '💥' },
      'Upper Pull + Skill': { label: 'Upper Pull 🧲', class: 'strength', icon: '🧲' },
      'Active Recovery': { label: 'Recovery 🚶', class: 'walk', icon: '🚶' },
      'Rest': { label: 'Rest 😴', class: 'rest', icon: '😴' }
    };
    return types[type] || { label: type, class: '', icon: '📋' };
  }

  /**
   * Get category color
   */
  function getCategoryColor(slot) {
    const colors = {
      'W0': '#f59e0b', 'W1': '#f59e0b', 'W2': '#f59e0b',
      'A1': '#f97316', 'A2': '#f59e0b', 'A3': '#eab308', 'A4': '#84cc16', 'A5': '#22c55e', 'A6': '#10b981', 'A7': '#06b6d4', 'A8': '#3b82f6',
      'B1': '#10b981', 'B2': '#06b6d4', 'B3': '#14b8a6', 'B4': '#0d9488',
      'C1': '#3b82f6', 'C2': '#8b5cf6', 'C3': '#a78bfa',
      'D1': '#ec4899', 'D2': '#f43f5e', 'D3': '#fb7185', 'D4': '#f472b6',
      'E1': '#6366f1', 'E2': '#818cf8',
      'F1': '#a855f7',
      'extra': '#6b7280'
    };
    return colors[slot] || '#6b7280';
  }

  /**
   * Get category label
   */
  function getCategoryLabel(slot) {
    const labels = {
      'W0': '🔥 Warmup', 'W1': '🔥 Warmup', 'W2': '🔥 Warmup',
      'A1': 'A1', 'A2': 'A2', 'A3': 'A3', 'A4': 'A4', 'A5': 'A5', 'A6': 'A6', 'A7': 'A7', 'A8': 'A8',
      'B1': 'B1', 'B2': 'B2', 'B3': 'B3', 'B4': 'B4',
      'C1': 'C1', 'C2': 'C2', 'C3': 'C3',
      'D1': 'D1', 'D2': 'D2', 'D3': 'D3', 'D4': 'D4',
      'E1': 'E1', 'E2': 'E2',
      'F1': 'F1',
      'extra': 'Extras'
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
    return date.toLocaleDateString('en-US', {
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
    return date.toLocaleDateString('en-US', { day: 'numeric', month: 'numeric' });
  }

  /**
   * Get Local Date String (YYYY-MM-DD) avoiding UTC shifts
   */
  function getLocalDateString(d = new Date()) {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
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
    if (diff.includes('Beginner')) return 'beginner';
    if (diff.includes('Advanced') || diff.includes('Expert')) return 'advanced';
    return 'intermediate';
  }

  /**
   * Get required equipment based on exercise name
   */
  function getEquipment(name) {
    if (!name) return null;
    const n = name.toLowerCase();
    
    if (n.includes('band') || n.includes('pallof') || n.includes('face pull') || n.includes('woodchop')) return { label: 'Band', icon: '➰' };
    if (n.includes('wall')) return { label: 'Wall', icon: '🧱' };
    if (n.includes('bench dip') || n.includes('step-up') || n.includes('bulgarian') || n.includes('incline') || n.includes('decline') || n.includes('copenhagen')) return { label: 'Chair', icon: '🪑' };
    if (n.includes('towel') || n.includes('hang') || n.includes('pull-up') || n.includes('inverted row') || n.includes('chin-up') || n.includes('hanging')) return { label: 'Bar', icon: '🧗‍♂️' };
    if (n.includes('hamstring curl')) return { label: 'Towel', icon: '🧦' };
    if (n.includes('couch stretch')) return { label: 'Wall+Pillow', icon: '🧱' };
    if (n.includes('foam roll')) return { label: 'Foam Roller', icon: '🪵' };
    
    // Default or bodyweight exercises
    return { label: 'Bodyweight', icon: '💪' };
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
    showImageModal,
    handleImageFallback,
    getDayTypeInfo,
    getCategoryColor,
    getCategoryLabel,
    parseDate,
    formatDate,
    formatShortDate,
    getLocalDateString,
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
