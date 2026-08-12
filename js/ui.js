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
    document.getElementById('modal-title').innerHTML = current.title;
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

  const EXERCISE_GIF_ALIASES = {
    'CHIN-UP': 'Chin-up.gif',
    'CHIN-UP NEGATIVE': 'Chin-up Negative.gif',
    'PULL-UP (OVERHAND)': 'Pull-up (Overhand).gif',
    'PULL-UP NEGATIVE': 'Pull-Up Negative.gif',
    'ELEVATED PIKE PUSH-UP': 'Elevated Pike Push-up.gif',
    'PUSH-UP': 'Push-up.gif',
    'PUSH-UP (BARS)': 'Push-up.gif',
    'DEFICIT PUSH-UP': 'Deficit Push-Up.gif',
    'FEET-ELEVATED PUSH-UP': 'Feet-Elevated Push-Up.gif',
    'WEIGHTED DEFICIT PUSH-UP': 'Weighted Deficit Push-Up.gif',
    'WEIGHTED CHIN-UP': 'Weighted Chin-Up.gif',
    'WEIGHTED PULL-UP': 'Weighted Pull-Up.gif',
    'DB RDL': 'Dumbbell Romanian Deadlift (RDL).gif',
    'DB SINGLE-LEG RDL': 'Dumbbell Single-Leg RDL.gif',
    'DB CURL': 'Dumbbell Biceps Curl.gif',
    'SINGLE-ARM CURL': 'Single-Arm Curl.gif',
    'ARM BLOCK - DB CURL': 'Arm Block - DB Curl.gif',
    'DB LATERAL RAISE': 'Dumbbell Lateral Raise.gif',
    'ARM BLOCK - DB LATERAL RAISE': 'Arm Block - DB Lateral Raise.gif',
    'ARM BLOCK - DB OH TRICEPS EXT': 'DB OH Triceps Ext.gif',
    'DB OH TRICEPS EXT': 'DB OH Triceps Ext.gif',
    'DB BULGARIAN SPLIT SQUAT': 'DB Bulgarian Split Squat.gif',
    'DB BSS': 'DB Bulgarian Split Squat.gif',
    'DB BSS (GOBLET)': 'DB BSS (Goblet).gif',
    'DB GLUTE BRIDGE': 'DB Glute Bridge.gif',
    'GLUTE BRIDGE': 'Glute Bridge.gif',
    'DB HIP THRUST': 'DB Glute Bridge.gif',
    'ONE-ARM DB ROW': 'Dumbbell One-Arm Row.gif',
    'PALLOF PRESS': 'Pallof Press (Band).gif',
    'REVERSE LUNGE + DB': 'Reverse Lunge + DB.gif',
    'SEATED DB OHP': 'Seated DB OHP.gif',
    'SINGLE-ARM SEATED OHP': 'Single-Arm Seated OHP.gif',
    'SINGLE-ARM FLOOR PRESS': 'Single-Arm Floor Press.gif',
    'DB FLOOR PRESS': 'Dumbbell Floor Press.gif',
    'DB HAMMER CURL': 'Dumbbell Hammer Curl.gif',
    'SUITCASE CARRY': 'Suitcase Carry.gif',
    'WALKING LUNGE (GOBLET)': 'Walking Lunge (Goblet).gif',
    'WALL WALK (PARTIAL)': 'Wall Walk (Partial).gif',
    'TRX FACE PULL': 'TRX Face Pull.gif',
    'TRX FACE PULL (ANGLE 1)': 'TRX Face Pull (Angle 1).gif',
    'TRX FACE PULL (ANGLE 2)': 'TRX Face Pull (Angle 2).gif',
    'TRX FACE PULL (ANGLE 3)': 'TRX Face Pull (Angle 3).gif',
    'TRX Y-T-W': 'TRX Y-T-W.gif',
    'L-SIT TUCK (BARS)': 'L-sit Tuck (Bars).gif',
    'HOLLOW BODY HOLD': 'Hollow Body Hold.gif',
    'PIKE HOLD': 'Pike Hold.gif',
    'DEEP MOBILITY PROTOCOL': 'Deep Mobility Protocol.gif',
    'WRIST ROCKS': 'Wrist Rocks.gif'
  };

  function handleImageFallback(imgEl, type) {
    const currentSrc = imgEl.src;
    const urlDecoded = decodeURIComponent(currentSrc);
    
    if (type === 'gif') {
      const match = urlDecoded.match(/images\/gifs\/([^/]+)$/);
      if (match) {
        const rawFilename = match[1];
        if (!imgEl.dataset.origFilename) {
          imgEl.dataset.origFilename = rawFilename;
        }
        const origKey = imgEl.dataset.origFilename;
        const lastDot = origKey.lastIndexOf('.');
        const baseName = lastDot !== -1 ? origKey.substring(0, lastDot) : origKey;
        const cleanBase = baseName.replace(/[-_]+/g, ' ').trim();
        const upperBase = cleanBase.toUpperCase();
        
        const variations = [];
        
        // Check alias mapping first
        if (EXERCISE_GIF_ALIASES[upperBase]) {
          variations.push(EXERCISE_GIF_ALIASES[upperBase]);
        }

        // Hyphenated case variations (e.g. Chin-Up -> Chin-up.gif)
        const titleHyphenLowerUp = baseName.replace(/-Up\b/g, '-up');
        if (titleHyphenLowerUp !== baseName) variations.push(titleHyphenLowerUp + '.gif');
        const wordLowerUp = baseName.replace(/\bUp\b/g, 'up');
        if (wordLowerUp !== baseName) variations.push(wordLowerUp + '.gif');

        // DB / Dumbbell variations
        const dbToDumbbell = baseName.replace(/\bDB\b/gi, 'Dumbbell');
        if (dbToDumbbell !== baseName) variations.push(dbToDumbbell + '.gif');
        const dumbbellToDb = baseName.replace(/\bDumbbell\b/gi, 'DB');
        if (dumbbellToDb !== baseName) variations.push(dumbbellToDb + '.gif');

        // Strip parentheses
        const strippedParen = baseName.replace(/\s*\([^)]*\)/g, '').trim();
        if (strippedParen !== baseName) {
          variations.push(strippedParen + '.gif');
          variations.push(strippedParen.replace(/\bDB\b/gi, 'Dumbbell') + '.gif');
        }

        // Standard string transformations
        variations.push(cleanBase.toUpperCase() + '.gif');
        variations.push(cleanBase.toLowerCase() + '.gif');
        variations.push(cleanBase.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ') + '.gif');
        variations.push(cleanBase.replace(/\s+/g, '_') + '.gif');
        variations.push(cleanBase.replace(/\s+/g, '_').toLowerCase() + '.gif');
        variations.push(cleanBase.replace(/\s+/g, '_').toUpperCase() + '.gif');
        variations.push(cleanBase.replace(/\s+/g, '-') + '.gif');
        variations.push(cleanBase.replace(/\s+/g, '-').toLowerCase() + '.gif');

        // Filter duplicates while preserving order
        const uniqueVariations = Array.from(new Set(variations)).filter(v => v !== rawFilename);

        if (!imageTrials[origKey]) {
          imageTrials[origKey] = 0;
        }

        const trialIndex = imageTrials[origKey];
        if (trialIndex < uniqueVariations.length) {
          imageTrials[origKey]++;
          imgEl.src = `images/gifs/${uniqueVariations[trialIndex]}`;
          return;
        }
      }
      if (imgEl.parentElement) {
        const b = imgEl.parentElement.querySelector('.fb-gif-badge');
        if (b) b.style.display = 'none';
      }
      imgEl.style.display = 'none';
    } else if (type === 'png') {
      const match = urlDecoded.match(/images\/exercises\/([^/]+)$/);
      if (match) {
        const rawFilename = match[1];
        if (!imgEl.dataset.origFilename) {
          imgEl.dataset.origFilename = rawFilename;
        }
        const origKey = imgEl.dataset.origFilename;
        const lastDot = origKey.lastIndexOf('.');
        const baseName = lastDot !== -1 ? origKey.substring(0, lastDot) : origKey;
        const cleanBase = baseName.replace(/[-_]+/g, ' ').trim();
        const upperBase = cleanBase.toUpperCase();
        
        let dbVariant = upperBase;
        if (upperBase.startsWith('DUMBBELL ')) {
          dbVariant = 'DB ' + upperBase.slice(9);
        } else if (upperBase.startsWith('DB ')) {
          dbVariant = 'DUMBBELL ' + upperBase.slice(3);
        }

        const variations = [
          upperBase + '.png',
          dbVariant + '.png',
          cleanBase.toLowerCase() + '.png',
          cleanBase.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ') + '.png',
          upperBase.replace(/\s*\([^)]*\)/g, '').trim() + '.png',
          dbVariant.replace(/\s*\([^)]*\)/g, '').trim() + '.png',
          cleanBase.replace(/\s+/g, '_') + '.png',
          cleanBase.replace(/\s+/g, '_').toLowerCase() + '.png',
          cleanBase.replace(/\s+/g, '_').toUpperCase() + '.png',
          cleanBase.replace(/\s+/g, '-') + '.png',
          cleanBase.replace(/\s+/g, '-').toLowerCase() + '.png'
        ];

        const uniqueVariations = Array.from(new Set(variations)).filter(v => v !== rawFilename);

        if (!imageTrials[origKey]) {
          imageTrials[origKey] = 0;
        }
        
        const trialIndex = imageTrials[origKey];
        if (trialIndex < uniqueVariations.length) {
          imageTrials[origKey]++;
          imgEl.src = `images/exercises/${uniqueVariations[trialIndex]}`;
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

  const NO_GIF_EXERCISES = new Set([
    'BRISK WALKING',
    'RELAXED WALKING',
    'VO2 MAX NORWEGIAN 4X4'
  ]);

  function hasGif(title) {
    if (!title) return false;
    const upper = title.trim().toUpperCase();
    return !NO_GIF_EXERCISES.has(upper);
  }

  function showImageModal(title, src) {
    const pngPath = `images/exercises/${title.replace(/\//g, '-').toUpperCase()}.png`;
    const gifPath = `images/gifs/${title}.gif`;
    const gifExists = hasGif(title);
    const equip = getEquipment(title);
    
    let extraNote = '';
    const lowerTitle = title.toLowerCase();
    if (lowerTitle.includes('chin-up') || lowerTitle.includes('pull-up')) {
      extraNote = `
        <div style="background: rgba(59, 130, 246, 0.1); padding: 12px; border-radius: 10px; border: 1px solid rgba(59, 130, 246, 0.3); margin-top: 12px; text-align: right; direction: rtl;">
          <p style="font-size: 13px; margin-bottom: 6px; color: var(--text-primary);"><strong>💡 הבדלי אחיזה - חשוב לזכור:</strong></p>
          <ul style="font-size: 12px; color: var(--text-secondary); padding-right: 18px; margin: 0; line-height: 1.5;">
            <li style="margin-bottom: 4px;"><strong>Chin-up:</strong> כפות הידיים פונות לכיוון הפנים (אחיזה תחתית).</li>
            <li><strong>Pull-up:</strong> כפות הידיים באחיזה פונות לכיוון חוץ (אחיזה עילית).</li>
          </ul>
        </div>
      `;
    }

    const modalTitleHTML = `
      <div style="display: flex; align-items: center; gap: 16px; direction: rtl; width: 100%; flex-wrap: wrap;">
        <div style="width: 210px; height: 210px; min-width: 210px; max-width: 100%; border-radius: 16px; background: rgba(0, 0, 0, 0.25); border: 1px solid var(--border-light, rgba(255, 255, 255, 0.18)); display: flex; align-items: center; justify-content: center; overflow: hidden; padding: 6px; box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3); flex-shrink: 0;">
          <img src="${pngPath}" 
               style="width: 100%; height: 100%; object-fit: contain; border-radius: 12px;" 
               alt="${title} תמונה" 
               loading="eager" 
               decoding="async" 
               onerror="UI.handleImageFallback(this, 'png')">
        </div>
        <div style="display: flex; flex-direction: column; gap: 8px; justify-content: center; flex: 1; min-width: 140px;">
          <span style="font-size: 20px; font-weight: 900; color: var(--text-primary); line-height: 1.25;">${title}</span>
          ${equip ? `<span style="font-size: 13px; font-weight: 700; color: var(--text-secondary); display: inline-flex; align-items: center; gap: 6px; background: var(--bg-elevated); padding: 5px 12px; border-radius: 8px; border: 1px solid var(--border-light); width: max-content;">${equip.icon} ${equip.label}</span>` : ''}
        </div>
      </div>
    `;

    let mediaHTML = '';

    if (gifExists) {
      mediaHTML = `
        <div style="position: relative; width: 100%; min-height: 240px; background: rgba(0, 0, 0, 0.25); border-radius: 14px; overflow: hidden; display: flex; align-items: center; justify-content: center; border: 1px solid var(--border-color); padding: 6px; box-shadow: inset 0 0 20px rgba(0,0,0,0.15);">
          <img src="${gifPath}" 
               style="width: 100%; border-radius: 10px; object-fit: contain; max-height: 50vh; display: block; margin: 0 auto;" 
               alt="${title} GIF" 
               loading="eager" 
               decoding="async" 
               onerror="UI.handleImageFallback(this, 'gif')">
        </div>
      `;
    } else {
      mediaHTML = `
        <div style="position: relative; width: 100%; border-radius: 14px; overflow: hidden; background: rgba(0, 0, 0, 0.25); border: 1px solid var(--border-color); padding: 6px;">
          <img src="${pngPath}" 
               style="width: 100%; border-radius: 10px; object-fit: contain; max-height: 50vh; display: block; margin: 0 auto;" 
               alt="${title} תמונה" 
               loading="eager" 
               decoding="async" 
               onerror="UI.handleImageFallback(this, 'png')">
        </div>
      `;
    }

    showModal(modalTitleHTML, `
      <div style="display: flex; flex-direction: column; gap: 12px; width: 100%; direction: rtl;">
        ${mediaHTML}
        ${extraNote}
      </div>
    `);
  }


  /**
   * Get day type display info
   */
  function getDayTypeInfo(type) {
    if (!type) return { label: '', class: '', icon: '📋', isDeload: false };

    const isDeload = type.toLowerCase().includes('deload');

    const types = {
      'Legs + Core': { label: 'Legs + Core 🦵', class: 'strength', icon: '🦵' },
      'Push + Skill': { label: 'Push + Skill 💥', class: 'strength', icon: '💥' },
      'Pull + Grip': { label: 'Pull + Grip 🧲', class: 'strength', icon: '🧲' },
      'Zone 2 Cardio': { label: 'Zone 2 Cardio 🫀', class: 'walk', icon: '🫀' },
      'Active Recovery': { label: 'Active Recovery 🌿', class: 'recovery', icon: '🌿' },
      'VO2 Max': { label: 'VO2 Max 4x4 🔴', class: 'vo2', icon: '🔴' },
      'Rest': { label: 'Rest 😴', class: 'rest', icon: '😴' },
      'Legs + Push (Strength A)': { label: 'Strength A 🦵💥', class: 'strength', icon: '🦵' },
      'Pull + Skill (Strength B)': { label: 'Strength B 🧲', class: 'strength', icon: '🧲' },
      'Lower Strength': { label: 'Lower Strength 🦵', class: 'strength', icon: '🦵' },
      'Upper Push': { label: 'Upper Push 💥', class: 'strength', icon: '💥' },
      'Upper Pull + Skill': { label: 'Upper Pull 🧲', class: 'strength', icon: '🧲' },

      // Deload specific mappings
      'Legs + Core (Deload)': { label: 'Legs + Core 🌿 (Deload)', class: 'strength deload', icon: '🦵' },
      'Push + Skill (Deload)': { label: 'Push + Skill 🌿 (Deload)', class: 'strength deload', icon: '💥' },
      'Pull + Grip (Deload)': { label: 'Pull + Grip 🌿 (Deload)', class: 'strength deload', icon: '🧲' },
      'Zone 2 Cardio (Deload)': { label: 'Zone 2 Cardio 🌿 (Deload)', class: 'walk deload', icon: '🫀' },
      'Active Recovery (Deload)': { label: 'Active Recovery 🌿 (Deload)', class: 'recovery deload', icon: '🌿' }
    };

    if (types[type]) {
      return { ...types[type], isDeload };
    }

    if (isDeload) {
      const cleanType = type.replace(/\s*\([^)]*deload[^)]*\)/gi, '').trim();
      const baseInfo = types[cleanType] || { label: type, class: 'strength', icon: '🌿' };
      return {
        label: `${cleanType || type} 🌿 (Deload)`,
        class: `${baseInfo.class} deload`.trim(),
        icon: baseInfo.icon || '🌿',
        isDeload: true
      };
    }

    return { label: type, class: '', icon: '📋', isDeload: false };
  }

  /**
   * Get category color
   */
  function getCategoryColor(slot) {
    const colors = {
      'W0': '#f59e0b', 'W1': '#f59e0b', 'W2': '#f59e0b', 'W3': '#f59e0b', 'W4': '#f59e0b', 'W5': '#f59e0b',
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
      'W0': '🔥 Warmup', 'W1': '🔥 Warmup', 'W2': '🔥 Warmup', 'W3': '🔥 Warmup', 'W4': '🔥 Warmup', 'W5': '🔥 Warmup',
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
   */
  function parseSetsCount(setsStr) {
    if (!setsStr) return 0;
    const match = setsStr.match(/(\d+)\s*[×x]/i);
    return match ? parseInt(match[1]) : 1;
  }

  /**
   * Parse reps from sets string
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
    
    // Professional SVG Icons
    const icons = {
      db: `<svg width="1.2em" height="1.2em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6.5 17.5l11-11"/><path d="M6 6l12 12"/><circle cx="5" cy="5" r="2"/><circle cx="19" cy="19" r="2"/><circle cx="19" cy="5" r="2"/><circle cx="5" cy="19" r="2"/></svg>`,
      trx: `<svg width="1.2em" height="1.2em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v8"/><path d="M7 10l-4 10"/><path d="M17 10l4 10"/><path d="M3 20h4"/><path d="M17 20h4"/></svg>`,
      bars: `<svg width="1.2em" height="1.2em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 6h16"/><path d="M4 18h16"/><path d="M7 6v12"/><path d="M17 6v12"/></svg>`,
      vest: `<svg width="1.2em" height="1.2em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2h12v6l-2 2v10H8V10L6 8V2z"/><path d="M9 2v4"/><path d="M15 2v4"/></svg>`,
      band: `<svg width="1.2em" height="1.2em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="2" width="14" height="20" rx="7" ry="7" transform="rotate(-45 12 12)"/><path d="M12 2v20" opacity="0.3" transform="rotate(-45 12 12)"/></svg>`,
      wall: `<svg width="1.2em" height="1.2em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/><line x1="9" y1="3" x2="9" y2="9"/><line x1="15" y1="9" x2="15" y2="15"/><line x1="9" y1="15" x2="9" y2="21"/></svg>`,
      bench: `<svg width="1.2em" height="1.2em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 10h16v2H4z"/><path d="M6 12v6"/><path d="M18 12v6"/></svg>`,
      bar: `<svg width="1.2em" height="1.2em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 5h20"/><path d="M6 5v14"/><path d="M18 5v14"/></svg>`,
      towel: `<svg width="1.2em" height="1.2em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="4" width="12" height="16" rx="2" ry="2"/><path d="M6 8h12"/><path d="M6 16h12"/></svg>`,
      treadmill: `<svg width="1.2em" height="1.2em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 18h16l-3-12H7L4 18z"/><circle cx="12" cy="18" r="2"/></svg>`,
      bodyweight: `<svg width="1.2em" height="1.2em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="7" r="4"/><path d="M6 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2"/></svg>`
    };

    if (n.includes('vest')) return { label: 'וסט +5 ק"ג', icon: icons.vest };
    if (n.includes('trx')) return { label: 'רצועות TRX', icon: icons.trx };
    if (n.includes('bars') || n.includes('push-up bars') || n.includes('parallettes')) return { label: 'ידיות שחיקות / Bars', icon: icons.bars };
    if (n.includes('db') || n.includes('dumbbell') || n.includes('suitcase') || n.includes('rdl') || n.includes('floor press') || n.includes('ohp') || n.includes('curl') || n.includes('row')) return { label: 'משקולות DB', icon: icons.db };
    if (n.includes('band') || n.includes('pallof') || n.includes('face pull') || n.includes('woodchop')) return { label: 'גומיית התנגדות', icon: icons.band };
    if (n.includes('wall') || n.includes('handstand')) return { label: 'קיר פנוי', icon: icons.wall };
    if (n.includes('bench dip') || n.includes('step-up') || n.includes('bulgarian') || n.includes('chair') || n.includes('elevated')) return { label: 'כיסא / ספסל', icon: icons.bench };
    if (n.includes('towel') || n.includes('hang') || n.includes('pull-up') || n.includes('chin-up')) return { label: 'מתח / מגבת', icon: icons.towel };
    if (n.includes('walking') || n.includes('vo2') || n.includes('zone 2')) return { label: 'מסילת כושר / הליכה', icon: icons.treadmill };
    
    return { label: 'משקל גוף בלבד', icon: icons.bodyweight };
  }

  /**
   * Format tempo string to Hebrew matching UPDDATE.md
   */
  function formatTempo(tempo) {
    if (!tempo) return '';
    const map = {
      '2 secs down': "2 שנ' ירידה",
      '3 secs down': "3 שנ' ירידה",
      '4 secs down': "4 שנ' ירידה",
      '1 sec pause': "1 שנ' עצירה",
      '2 secs pause': "2 שנ' עצירה",
      '3 secs pause': "3 שנ' עצירה",
      '1 sec pause at bottom': "1 שנ' עצירה למטה",
      '2 secs pause at bottom': "2 שנ' עצירה למטה",
      '2 secs down + 1 sec squeeze': "2 שנ' ירידה + 1 שנ' כיווץ",
      'Slow': 'איטי',
      'Static': 'סטטי',
      'Walking': 'הליכה',
      'Flow': 'איטי',
      '5.5 km/h': "5.5 קמ'ש",
      '5.0 km/h': "5.0 קמ'ש",
      '4.5 km/h': "4.5 קמ'ש",
      '6.5 km/h effort / 4.5 km/h rest': "6.5 קמ'ש מאמץ / 4.5 קמ'ש מנוחה"
    };
    return map[tempo] || tempo;
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
    hasGif,
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
    formatTempo,
    initTimer,
    startTimer
  };
})();

window.UI = UI;
