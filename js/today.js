/**
 * Today Page Module - Daily workout view with tracking
 */
const TodayPage = (() => {
  let currentDayIndex = 0;
  let allPlanDays = [];
  let currentTracking = null;
  let allExercises = [];
  let allTrackingCache = null;

  let renderNutritionSectionRef = null;
  let selectedNutritionDate = null;
  let isEqBannerCollapsed = false;

  function toggleEqBanner() {
    isEqBannerCollapsed = !isEqBannerCollapsed;
    const body = document.getElementById('eq-banner-body');
    const header = document.getElementById('eq-banner-header');
    if (body && header) {
      const isHidden = isEqBannerCollapsed;
      body.style.display = isHidden ? 'none' : 'flex';
      header.style.paddingBottom = isHidden ? '0' : '10px';
      header.style.borderBottom = isHidden ? 'none' : '1px solid var(--border-light)';
      const arrow = document.getElementById('eq-banner-arrow');
      if (arrow) arrow.style.transform = `rotate(${isHidden ? '180deg' : '0deg'})`;
    }
  }

  function isWeighted(ex) {
    if (!ex || !ex.weight) return false;
    const w = String(ex.weight).trim().toLowerCase();
    if (w === '' || w === '—' || w.startsWith('bodyweight') || w.startsWith('משקל גוף') || w.startsWith('incline') || w.includes('%')) {
      return false;
    }
    return true;
  }

  /**
   * Helper to parse weight strings and determine if exercise is per hand / dual arm
   */
  function parseWeightDetails(weightStr, exName = '') {
    if (!weightStr) return null;
    const str = String(weightStr).trim();
    const lowerStr = str.toLowerCase();
    
    if (lowerStr === '' || lowerStr === '—' || lowerStr.startsWith('bodyweight') || lowerStr.startsWith('משקל גוף') || lowerStr.startsWith('incline') || lowerStr.includes('%')) {
      return null;
    }
    
    const isPerHand = lowerStr.includes('each') || lowerStr.includes('per hand') || lowerStr.includes('כל יד') || lowerStr.includes('לכל יד');
    
    // Clean display weight string by removing "each", "per hand", etc.
    let cleanWeight = str;
    if (isPerHand) {
      cleanWeight = str.replace(/\b(each|per hand)\b/gi, '').replace(/(כל יד|לכל יד)/gi, '').trim();
    }
    
    return {
      raw: str,
      cleanWeight: cleanWeight,
      isPerHand: isPerHand,
      multiplier: isPerHand ? '×2' : '1',
      handIcon: isPerHand ? '🖐️' : ''
    };
  }

  /**
   * Helper to build visual weight badge HTML
   */
  function buildWeightBadgeHTML(weightInfo, isCompact = false) {
    if (!weightInfo) return '';
    
    if (weightInfo.isPerHand) {
      const tagText = I18n.t('per_hand_tag') || 'כל יד';
      return `
        <span class="weight-badge per-hand" style="background: rgba(59, 130, 246, 0.14); border: 1px solid rgba(59, 130, 246, 0.35); color: var(--text-primary); padding: ${isCompact ? '2px 7px' : '4px 10px'}; border-radius: 8px; font-size: ${isCompact ? '12px' : '13px'}; font-weight: 800; display: inline-flex; align-items: center; gap: 5px; box-shadow: 0 2px 8px rgba(59, 130, 246, 0.12);" title="${tagText} (×2)">
          <bdi dir="ltr">${weightInfo.cleanWeight}</bdi>
          <span style="background: #3b82f6; color: #ffffff; padding: 2px 6px; border-radius: 5px; font-size: 10.5px; font-weight: 900; letter-spacing: 0.2px; display: inline-flex; align-items: center; gap: 3px;">
            ×2 🖐️ <span style="font-size: 10px;">${tagText}</span>
          </span>
        </span>
      `;
    } else {
      const tagText = I18n.t('regular_weight_tag') || 'משקל רגיל';
      return `
        <span class="weight-badge regular" style="background: var(--bg-input, rgba(255, 255, 255, 0.04)); border: 1px solid var(--border-color); color: var(--text-primary); padding: ${isCompact ? '2px 7px' : '4px 10px'}; border-radius: 8px; font-size: ${isCompact ? '12px' : '13px'}; font-weight: 800; display: inline-flex; align-items: center; gap: 5px;" title="${tagText}">
          <bdi dir="ltr">${weightInfo.cleanWeight}</bdi>
          <span style="background: var(--bg-hover, rgba(255, 255, 255, 0.08)); color: var(--text-secondary); padding: 2px 6px; border-radius: 5px; font-size: 10px; font-weight: 700;">
            ${tagText}
          </span>
        </span>
      `;
    }
  }

  function extractNumericWeight(weightStr) {
    if (!weightStr) return '';
    const str = String(weightStr).trim();
    if (str.toLowerCase().startsWith('bodyweight') || str.toLowerCase().startsWith('משקל גוף') || str === '—' || str.toLowerCase().startsWith('incline') || str.includes('%')) {
      return '';
    }
    const match = str.match(/(\d+(?:\.\d+)?)/);
    return match ? match[1] : '';
  }

  /**
   * Get suggested numeric weight for set (supports ladder ranges e.g. "6-15 kg total (Ladder)")
   */
  function getSuggestedWeightForSet(ex, setIndex, totalSets, prevPerf) {
    if (ex && ex.targetWeightKg != null && Number(ex.targetWeightKg) > 0) {
      return String(ex.targetWeightKg);
    }
    if (prevPerf && prevPerf.setData && prevPerf.setData[`set_${setIndex}_weight`] && parseFloat(prevPerf.setData[`set_${setIndex}_weight`]) > 0) {
      return prevPerf.setData[`set_${setIndex}_weight`];
    }
    if (!ex || !ex.weight || !isWeighted(ex)) return '';
    const wStr = String(ex.weight).trim();

    // Check for range like "6-15 kg total (Ladder)" or "3-9 kg each (Ladder)"
    const rangeMatch = wStr.match(/(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)/);
    if (rangeMatch) {
      return String(rangeMatch[1]);
    }

    const numW = extractNumericWeight(wStr);
    return (numW && parseFloat(numW) > 0) ? numW : '';
  }

  /**
   * Dynamically enrich exercise data with active progression states (weights & stages)
   * Includes auto-recovery backfill from completed tracking history if state store is empty
   */
  async function enrichDayWithProgression(day) {
    if (!day || !day.exercises || !Array.isArray(day.exercises)) return;
    const weekNum = day.week ? parseInt(day.week.replace(/\D/g, '')) || 1 : 1;
    const isDeload = weekNum % 8 === 0;

    let statesList = [];
    try {
      if (window.DB && window.DB.getAllProgressionState) {
        statesList = await DB.getAllProgressionState();
      }
    } catch (e) {
      console.warn('[Today] Failed to fetch progression states:', e);
    }

    const statesMap = {};
    if (Array.isArray(statesList)) {
      statesList.forEach(s => {
        if (s.exerciseId) statesMap[s.exerciseId] = s;
        if (s.sessionKey) statesMap[s.sessionKey] = s;
      });
    }

    // Ensure allTrackingCache is available for history backfill
    if (!allTrackingCache && window.DB && window.DB.getAllTracking) {
      try {
        allTrackingCache = await DB.getAllTracking();
      } catch (e) {
        allTrackingCache = [];
      }
    }

    // Dynamic Fallback: Check unlockCond before enriching state (Zero Decisions safety)
    if (window.ProgressionEngine) {
      for (let i = 0; i < day.exercises.length; i++) {
        let ex = day.exercises[i];
        let exId = ex.id || window.ProgressionEngine.findExerciseIdByName(ex.name) || ex.name.toLowerCase().replace(/\s+/g, '-');
        
        let maxDepth = 5;
        while (maxDepth > 0) {
          const unlockStatus = window.ProgressionEngine.checkUnlockCriteria(exId, statesMap);
          if (!unlockStatus.unlocked) {
            const exDef = window.ProgressionEngine.getExercise(exId);
            if (exDef && exDef.unlockCriteria && exDef.unlockCriteria.exercise) {
              const fallbackId = exDef.unlockCriteria.exercise;
              const fallbackDef = window.ProgressionEngine.getExercise(fallbackId);
              if (fallbackDef) {
                console.log(`[Today] Downgrading ${exId} -> ${fallbackId} due to unmet criteria (${unlockStatus.reason})`);
                ex.id = fallbackDef.id;
                ex.name = fallbackDef.name;
                // Inherit prescription details so the user gets the correct fallback parameters
                if (fallbackDef.sets) ex.sets = String(fallbackDef.sets);
                if (fallbackDef.repWindow) ex.repWindow = fallbackDef.repWindow;
                if (fallbackDef.restSeconds) ex.rest = fallbackDef.restSeconds;
                if (fallbackDef.tempo) ex.tempo = fallbackDef.tempo;
                if (fallbackDef.type) ex.type = fallbackDef.type;
                
                ex.weight = fallbackDef.startingWeight ? `${fallbackDef.startingWeight} kg` : (fallbackDef.type === 'variation' && fallbackDef.stages ? fallbackDef.stages[0] : 'Bodyweight');
                
                exId = fallbackId;
                maxDepth--;
                continue;
              }
            } else if (exId === 'pistol-squat-progression') {
               // Legacy hardcoded fallback if schema isn't perfect
               ex.id = 'heels-elevated-goblet-squat';
               ex.name = 'Heels-Elevated Goblet Squat';
               exId = 'heels-elevated-goblet-squat';
               maxDepth--;
               continue;
            }
          }
          break;
        }
      }
    }

    for (let ex of day.exercises) {
      const exId = ex.id || (window.ProgressionEngine ? window.ProgressionEngine.findExerciseIdByName(ex.name) : ex.name.toLowerCase().replace(/\s+/g, '-'));
      const exDef = window.ProgressionEngine ? window.ProgressionEngine.getExercise(exId) : null;
      let state = statesMap[exId] || statesMap[ex.name];

      // Auto-recovery / Backfill: If state is missing, look for past completed sessions in tracking history
      if (!state && allTrackingCache && Array.isArray(allTrackingCache)) {
        for (let i = currentDayIndex - 1; i >= 0; i--) {
          const pastDay = allPlanDays[i];
          if (!pastDay || !pastDay.exercises) continue;

          const pastExIdx = pastDay.exercises.findIndex(e => (e.id && exId && e.id === exId) || e.name === ex.name);
          if (pastExIdx === -1) continue;

          const pastTrack = allTrackingCache.find(t => t.dayIndex === i);
          if (!pastTrack || !pastTrack.setData || !pastTrack.setData[pastExIdx]) continue;

          const pastSetData = pastTrack.setData[pastExIdx];
          const pastSetsCount = UI.parseSetsCount(pastDay.exercises[pastExIdx].sets);

          let setsDoneCount = 0;
          let hasBelow = false;
          let lastLoggedW = 0;

          for (let s = 0; s < pastSetsCount; s++) {
            if (pastSetData[`set_${s}_done`]) setsDoneCount++;
            if (pastSetData[`set_${s}_result`] === 'below') hasBelow = true;
            if (pastSetData[`set_${s}_weight`]) lastLoggedW = parseFloat(pastSetData[`set_${s}_weight`]);
          }

          if (setsDoneCount >= pastSetsCount && pastSetsCount > 0) {
            const startW = exDef?.startingWeight || extractNumericWeight(ex.weight) || 6;
            let baseW = lastLoggedW > 0 ? lastLoggedW : startW;
            let calcW = hasBelow ? Math.max(exDef?.minWeight || 3, baseW - 1) : baseW + (exDef?.increment || 1);
            let calcStage = hasBelow ? 0 : 1;

            state = {
              exerciseId: exId,
              sessionKey: exId,
              currentWeightKg: calcW,
              currentStageIndex: calcStage,
              unlocked: true,
              lastUpdated: new Date().toISOString()
            };
            statesMap[exId] = state;
            if (window.DB && window.DB.saveProgressionState) {
              await DB.saveProgressionState(state);
            }
            break;
          }
        }
      }

      // Parent State Inheritance: If state is missing for direct replacement exercises (e.g. Glute Bridge -> Hip Thrust)
      if (!state) {
        const parentIdMap = {
          'db-hip-thrust': ['glute-bridge', 'db-glute-bridge', 'glute-1', 'DB Glute Bridge'],
          'weighted-deficit-push-up': ['deficit-push-up', 'push-up-progression', 'push-1'],
          'weighted-pull-up': ['pull-up-overhand', 'pull-up-progression', 'pull-1'],
          'weighted-chin-up': ['chin-up', 'chin-up-progression', 'pull-1b']
        };
        const candidateParents = parentIdMap[exId];
        if (candidateParents) {
          for (let pId of candidateParents) {
            if (statesMap[pId] && statesMap[pId].currentWeightKg > 0) {
              state = {
                exerciseId: exId,
                sessionKey: exId,
                currentWeightKg: statesMap[pId].currentWeightKg,
                currentStageIndex: 0,
                unlocked: true,
                lastUpdated: new Date().toISOString()
              };
              statesMap[exId] = state;
              if (window.DB && window.DB.saveProgressionState) {
                DB.saveProgressionState(state).catch(err => console.warn('[Today] Failed to save inherited state:', err));
              }
              break;
            }
          }
        }
      }

      // 1. Handle Weighted Exercises
      if (isWeighted(ex)) {
        const minW = exDef?.minWeight || 3;
        const startW = exDef?.startingWeight || extractNumericWeight(ex.weight) || minW || 6;
        let currentW = (state && state.currentWeightKg != null && state.currentWeightKg > 0) ? state.currentWeightKg : startW;
        currentW = Math.max(minW, currentW);
        const deloadRed = window.TRAINING_DATA?.progressionSettings?.deloadWeightReductionKg || 2;
        const targetW = isDeload ? Math.max(minW, currentW - deloadRed) : currentW;

        ex.targetWeightKg = targetW;

        if (ex.weight && /\d/.test(String(ex.weight))) {
          ex.weight = String(ex.weight).replace(/\d+(?:\.\d+)?/, targetW);
        } else {
          ex.weight = `${targetW} kg each`;
        }
      }

      // 2. Handle Variation / Stage Exercises
      if (exDef && exDef.stages && exDef.stages.length > 0) {
        const stageIdx = (state && state.currentStageIndex != null) ? state.currentStageIndex : 0;
        const stageName = exDef.stages[stageIdx] || exDef.stages[0];
        ex.currentStageIndex = stageIdx;
        ex.currentStageName = stageName;
      }
    }
  }

  /**
   * Check and auto-display once-per-day AI Smart Daily Briefing modal (or manual trigger)
   */
  async function checkAndShowDailyBriefing(forceOpen = false, forceRefresh = false) {
    try {
      const modal = document.getElementById('daily-briefing-modal');
      const content = document.getElementById('daily-briefing-content');
      const closeBtn = document.getElementById('close-daily-briefing-btn');
      const closeX = document.getElementById('close-daily-briefing-x');
      if (!modal || !content) return;

      // Ensure modal is attached directly to body to avoid inheriting display:none from hidden parents
      if (modal.parentElement && modal.parentElement !== document.body) {
        document.body.appendChild(modal);
      }

      const todayStr = (typeof UI !== 'undefined' && UI.getLocalDateString) ? UI.getLocalDateString() : new Date().toISOString().split('T')[0];
      const lastSeenDate = localStorage.getItem('fitup_last_daily_briefing_date');

      const hideModal = () => {
        modal.style.display = 'none';
        modal.classList.add('hidden');
        modal.classList.remove('active');
      };
      if (closeBtn) closeBtn.onclick = hideModal;
      if (closeX) closeX.onclick = hideModal;
      modal.onclick = (e) => { if (e.target === modal) hideModal(); };

      if (!forceOpen && lastSeenDate === todayStr) {
        return; // Already auto-shown today
      }

      modal.style.setProperty('display', 'flex', 'important');
      modal.style.zIndex = '100000';
      modal.classList.remove('hidden');
      modal.classList.add('active');
      localStorage.setItem('fitup_last_daily_briefing_date', todayStr);

      const cacheKey = `fitup_briefing_cache_${todayStr}`;
      const cachedBriefing = localStorage.getItem(cacheKey);

      if (cachedBriefing && !forceRefresh && !cachedBriefing.includes('briefing_loading') && cachedBriefing.length > 50) {
        content.innerHTML = cachedBriefing;
        return;
      }

      content.innerHTML = `<div style="text-align: center; padding: 24px; color: var(--text-muted); font-size: 13px;">${(typeof I18n !== 'undefined' && I18n.t('briefing_loading')) || 'Generating today\'s AI tactical briefing...'}</div>`;

    // Gather History Context
    let allTracking = [];
    try {
      allTracking = await DB.getAllTracking();
    } catch (e) {
      console.warn('Briefing DB fetch tracking error:', e);
    }
    let completedDays = 0;
    let rpeSum = 0;
    let rpeCount = 0;
    let bodyWeight = null;

    Object.values(allTracking || {}).forEach(tr => {
      if (tr.completed) completedDays++;
      if (tr.actualRPE) {
        rpeSum += parseFloat(tr.actualRPE);
        rpeCount++;
      }
      if (tr.bodyWeight) bodyWeight = tr.bodyWeight;
    });

    const streak = completedDays;
    const avgRPE = rpeCount > 0 ? (rpeSum / rpeCount).toFixed(1) : null;

    const historyContext = {
      streak,
      completedDays,
      avgRPE,
      bodyWeight
    };

    // Gather Today's Workout Context
    let planDaysList = allPlanDays;
    if (!planDaysList || planDaysList.length === 0) {
      try {
        planDaysList = await DB.getAllPlan();
      } catch (e) {}
    }
    const day = (planDaysList || [])[currentDayIndex] || {};
    let totalSets = 0;
    let requiredEquipment = [];

    (day.exercises || []).forEach(ex => {
      totalSets += UI.parseSetsCount(ex.sets);
      if (ex.weight && isWeighted(ex)) {
        requiredEquipment.push(`${ex.name}: ${ex.weight}`);
      }
    });

    const todayContext = {
      title: day.title || `Day ${day.day || (currentDayIndex + 1)}`,
      dayNum: day.day || (currentDayIndex + 1),
      dayType: day.dayType || 'Strength',
      muscles: day.targetMuscles || 'Full Body',
      exerciseCount: (day.exercises || []).length,
      totalSets: totalSets,
      plannedRPE: day.plannedRPE || 8,
      equipment: requiredEquipment.length > 0 ? requiredEquipment.join(', ') : 'Standard / Bodyweight'
    };

    // Gather Google Fit Context silently with timeout race to prevent popup blocking
    let fitContext = {};
    if (window.GoogleFitService && window.GoogleFitService.fetchDailyFitData) {
      try {
        const fitPromise = window.GoogleFitService.fetchDailyFitData();
        const timeoutPromise = new Promise(resolve => setTimeout(() => resolve(null), 400));
        const fitData = await Promise.race([fitPromise, timeoutPromise]);
        if (fitData) fitContext = fitData;
      } catch (e) {
        console.warn('Google Fit context for briefing error:', e);
      }
    }

    try {
      if (typeof GeminiService !== 'undefined' && GeminiService.getDailySmartBriefing) {
        const briefingText = await GeminiService.getDailySmartBriefing(historyContext, todayContext, fitContext);
        if (briefingText) {
          const formattedHtml = briefingText
            .replace(/\*\*(.*?)\*\*/g, '<strong style="color: var(--accent-primary);">$1</strong>')
            .replace(/\n\n/g, '<br><br>')
            .replace(/\n/g, '<br>');

          const htmlContainer = `
            <div style="background: var(--bg-elevated); padding: 16px; border-radius: 14px; border: 1px solid var(--border-light); line-height: 1.7;">
              ${formattedHtml}
            </div>
            <div style="text-align: right; margin-top: 10px;">
              <button onclick="TodayPage.openDailyBriefing(true)" style="background: none; border: none; color: var(--text-muted); font-size: 11px; cursor: pointer; text-decoration: underline;">🔄 ${I18n.t('refresh_advice') || 'רענן תדריך'}</button>
            </div>
          `;
          content.innerHTML = htmlContainer;
          localStorage.setItem(cacheKey, htmlContainer);
          return;
        }
      }
    } catch (e) {
      console.warn('Gemini briefing error, falling back to local smart summary:', e);
    }

    // Local Rule-Based Fallback Briefing
    const fallbackHtml = `
      <div style="background: var(--bg-elevated); padding: 16px; border-radius: 14px; border: 1px solid var(--border-light); line-height: 1.7;">
        <div style="margin-bottom: 10px;">
          🏆 <strong style="color: var(--accent-primary);">${I18n.t('briefing_momentum')}:</strong> ${completedDays > 0 ? `Great momentum with ${completedDays} completed workouts!` : 'Welcome to Day 1! Ready to build momentum!'}
        </div>
        <div style="margin-bottom: 10px;">
          🎯 <strong style="color: var(--accent-primary);">${I18n.t('briefing_mission')}:</strong> ${todayContext.title} (${todayContext.dayType}). Target: ${todayContext.exerciseCount} exercises, ${todayContext.totalSets} total sets. Planned RPE: ${todayContext.plannedRPE}.
        </div>
        <div>
          💡 <strong style="color: var(--accent-primary);">${I18n.t('briefing_tactical_tip')}:</strong> ${todayContext.equipment !== 'Standard / Bodyweight' ? `Required weights today: ${todayContext.equipment}. Focus on strict tempo & recovery!` : 'Focus on strict execution tempo and log each set accurately.'}
        </div>
      </div>
      <div style="text-align: right; margin-top: 10px;">
        <button onclick="TodayPage.openDailyBriefing(true)" style="background: none; border: none; color: var(--text-muted); font-size: 11px; cursor: pointer; text-decoration: underline;">🔄 ${I18n.t('refresh_advice') || 'רענן תדריך'}</button>
      </div>
    `;
    content.innerHTML = fallbackHtml;
    localStorage.setItem(cacheKey, fallbackHtml);
    } catch (err) {
      console.error('checkAndShowDailyBriefing error:', err);
    }
  }

  /**
   * Initialize the today page
   */
  async function init(planDays) {
    allPlanDays = planDays;
    currentDayIndex = UI.findTodayIndex(planDays);
    allExercises = await DB.getExerciseGuide();
    selectedNutritionDate = UI.getLocalDateString();

    const todayBtn = document.getElementById('today-btn');
    if (todayBtn) todayBtn.addEventListener('click', goToToday);



    const toggleNotesBtn = document.getElementById('toggle-notes-btn');
    if (toggleNotesBtn) {
      toggleNotesBtn.addEventListener('click', () => {
        const content = document.getElementById('notes-accordion-content');
        if (content.style.display === 'none') {
          content.style.display = 'grid';
          document.getElementById('calendar-accordion-content').style.display = 'none'; // Close calendar if open
        } else {
          content.style.display = 'none';
        }
      });
    }

    const toggleCalBtn = document.getElementById('toggle-calendar-btn');
    if (toggleCalBtn) {
      toggleCalBtn.addEventListener('click', () => {
        const content = document.getElementById('calendar-accordion-content');
        if (content.style.display === 'none') {
          content.style.display = 'block';
          document.getElementById('notes-accordion-content').style.display = 'none'; // Close notes if open
          if (typeof CalendarPage !== 'undefined') CalendarPage.render(); // Make sure calendar is rendered
        } else {
          content.style.display = 'none';
        }
      });
    }

    const swapWorkoutBtn = document.getElementById('swap-workout-btn');
    if (swapWorkoutBtn) {
      swapWorkoutBtn.addEventListener('click', showSwapModal);
    }

    const openBriefingBtn = document.getElementById('open-daily-briefing-btn');
    if (openBriefingBtn) {
      openBriefingBtn.addEventListener('click', () => checkAndShowDailyBriefing(true));
    }

    // Auto-save inputs on change
    const actualRpe = document.getElementById('actual-rpe');
    if (actualRpe) actualRpe.addEventListener('change', autoSave);
    const bodyWeight = document.getElementById('body-weight');
    if (bodyWeight) bodyWeight.addEventListener('change', autoSave);
    const dayNotes = document.getElementById('day-notes');
    if (dayNotes) dayNotes.addEventListener('change', autoSave);

    // Day navigation arrows
    const prevBtn = document.getElementById('nav-prev-day');
    const nextBtn = document.getElementById('nav-next-day');
    if (prevBtn) prevBtn.addEventListener('click', () => navigate(-1));
    if (nextBtn) nextBtn.addEventListener('click', () => navigate(1));

    await render();
  }

  /**
   * Navigate to a specific day
   */
  function navigate(offset) {
    const newIndex = currentDayIndex + offset;
    if (newIndex >= 0 && newIndex < allPlanDays.length) {
      currentDayIndex = newIndex;
      render();
    }
  }

  /**
   * Go to today
   */
  function goToToday() {
    currentDayIndex = UI.findTodayIndex(allPlanDays);
    selectedNutritionDate = UI.getLocalDateString();
    render();
  }

  function resetNutritionDateToToday() {
    selectedNutritionDate = UI.getLocalDateString();
  }

  /**
   * Go to a specific day index
   */
  function goToDay(dayIndex) {
    if (dayIndex >= 0 && dayIndex < allPlanDays.length) {
      currentDayIndex = dayIndex;
      render();
    }
  }

  /**
   * Render the today page
   */
  async function render() {
    const day = allPlanDays[currentDayIndex];
    if (!day) return;
    if (!day.exercises) day.exercises = [];

    // Dynamic enrichment with Progression Engine states BEFORE rendering UI
    await enrichDayWithProgression(day);

    // Load tracking data
    currentTracking = await DB.getDayTracking(currentDayIndex) || {
      exerciseStatus: {},
      setData: {},
      exerciseNotes: {},
      actualRPE: null,
      bodyWeight: null,
      notes: '',
      completed: false
    };

    // Cache all tracking data for performance history lookups
    allTrackingCache = await DB.getAllTracking();

    // Update header badges
    const typeInfo = UI.getDayTypeInfo(day.dayType);
    const isDeloadDay = typeInfo.isDeload || (day.dayType && day.dayType.includes('Deload')) || (day.week && day.week.includes('Deload'));

    // Deload UI Background differentiation
    if (isDeloadDay) {
      document.body.classList.add('deload-mode');
      document.body.classList.remove('recovery-mode');
    } else {
      document.body.classList.remove('recovery-mode');
      document.body.classList.remove('deload-mode');
    }
    
    // Check if program started to show preview banner
    const isProgramStarted = await DB.getSetting('planStartDate');
    const summaryCard = document.getElementById('day-summary');
    let previewBanner = document.getElementById('preview-mode-banner');
    
    if (!isProgramStarted) {
      if (!previewBanner) {
        previewBanner = document.createElement('div');
        previewBanner.id = 'preview-mode-banner';
        previewBanner.innerHTML = `
          <div style="background: rgba(59, 130, 246, 0.1); border: 1px solid rgba(59, 130, 246, 0.3); border-radius: 12px; padding: 12px 16px; margin-bottom: 16px; display: flex; align-items: flex-start; gap: 12px;">
            <span style="font-size: 20px;">👀</span>
            <div style="font-size: 13px; color: var(--text-primary); line-height: 1.4;">
              <strong style="color: var(--accent-primary); display: block; margin-bottom: 4px;">${I18n.t('program_not_started')}</strong>
              ${I18n.t('program_not_started_desc')}
            </div>
          </div>
        `;
        summaryCard.parentNode.insertBefore(previewBanner, summaryCard);
      }
    } else if (previewBanner) {
      previewBanner.remove();
    }

    // Deload Alert Banner logic
    let deloadBanner = document.getElementById('deload-mode-banner');
    if (isDeloadDay) {
      if (summaryCard) summaryCard.classList.add('is-deload');
      if (!deloadBanner && summaryCard) {
        deloadBanner = document.createElement('div');
        deloadBanner.id = 'deload-mode-banner';
        deloadBanner.className = 'deload-warning-banner';
        deloadBanner.innerHTML = `
          <div class="deload-banner-icon">🌿</div>
          <div class="deload-banner-content">
            <strong class="deload-banner-title">${I18n.t('deload_title')}</strong>
            <span class="deload-banner-sub">${I18n.t('deload_desc')}</span>
          </div>
        `;
        summaryCard.parentNode.insertBefore(deloadBanner, summaryCard);
      }
    } else {
      if (summaryCard) summaryCard.classList.remove('is-deload');
      if (deloadBanner) deloadBanner.remove();
    }

    // Update summary card
    document.getElementById('day-number').textContent = '#' + day.dayNum;
    document.getElementById('today-date-badge').textContent = day.dayOfWeek;
    document.getElementById('day-week').textContent = day.week ? day.week.replace('Week', I18n.t('week_label_full')) : '';

    const realTodayIndex = UI.findTodayIndex(allPlanDays);
    const isToday = currentDayIndex === realTodayIndex;
    const todayBtn = document.getElementById('today-btn');
    if (todayBtn) {
      todayBtn.style.display = isToday ? 'none' : 'flex';
    }

    let nonTodayBanner = document.getElementById('non-today-mode-banner');
    if (!isToday) {
      if (!nonTodayBanner && summaryCard) {
        nonTodayBanner = document.createElement('div');
        nonTodayBanner.id = 'non-today-mode-banner';
        nonTodayBanner.innerHTML = `
          <div style="background: rgba(245, 158, 11, 0.12); border: 1px solid rgba(245, 158, 11, 0.35); border-radius: 12px; padding: 10px 14px; margin-bottom: 16px; display: flex; align-items: center; justify-content: space-between; gap: 12px;">
            <div style="display: flex; align-items: center; gap: 10px;">
              <span style="font-size: 18px;">👁️</span>
              <div style="font-size: 13px; color: var(--warning, #f59e0b); font-weight: 700;">
                ${I18n.t('view_only_mode_banner')}
              </div>
            </div>
            <button type="button" class="btn-warning" style="padding: 6px 12px; font-size: 12px; font-weight: 700; white-space: nowrap; border-radius: 8px; border: none; cursor: pointer;" onclick="TodayPage.goToToday()">
              ${I18n.t('back_to_today')}
            </button>
          </div>
        `;
        summaryCard.parentNode.insertBefore(nonTodayBanner, summaryCard);
      }
    } else if (nonTodayBanner) {
      nonTodayBanner.remove();
    }

    let workoutCompletedBanner = document.getElementById('workout-completed-today-banner');
    if (isToday && currentTracking && currentTracking.completed) {
      if (!workoutCompletedBanner && summaryCard) {
        workoutCompletedBanner = document.createElement('div');
        workoutCompletedBanner.id = 'workout-completed-today-banner';
        workoutCompletedBanner.innerHTML = `
          <div style="background: rgba(16, 185, 129, 0.12); border: 1px solid rgba(16, 185, 129, 0.35); border-radius: 12px; padding: 12px 16px; margin-bottom: 16px; display: flex; align-items: center; justify-content: space-between; gap: 12px; animation: fadeIn 0.4s ease;">
            <div style="display: flex; align-items: center; gap: 10px;">
              <span style="font-size: 22px;">🏆</span>
              <div style="font-size: 13px; color: var(--success, #10b981); font-weight: 700;">
                ${I18n.t('workout_completed_today_banner')}
              </div>
            </div>
          </div>
        `;
        summaryCard.parentNode.insertBefore(workoutCompletedBanner, summaryCard);
      }
    } else if (workoutCompletedBanner) {
      workoutCompletedBanner.remove();
    }
    

    const typeBadge = document.getElementById('day-type');
    typeBadge.textContent = typeInfo.label;
    typeBadge.className = `type-badge ${typeInfo.class}`;

    const swapWorkoutBtn = document.getElementById('swap-workout-btn');
    if (swapWorkoutBtn) {
      if (!currentTracking.completed) {
        swapWorkoutBtn.style.display = 'flex';
      } else {
        swapWorkoutBtn.style.display = 'none';
      }
    }

    const rpeBadge = document.getElementById('day-rpe');
    if (day.plannedRPE && day.plannedRPE !== '—') {
      rpeBadge.textContent = `RPE ${day.plannedRPE}`;
      rpeBadge.style.display = '';
    } else {
      rpeBadge.style.display = 'none';
    }







  /**
   * Calculate burned calories from today's workout based on completed exercises, sets, volume, and body weight
   */
  function calculateWorkoutBurn(day, tracking) {
    if (!day || !day.exercises || day.dayType === 'Rest') return 0;

    let userWeightKg = 70;
    if (tracking && tracking.bodyWeight) {
      const bw = parseFloat(tracking.bodyWeight);
      if (!isNaN(bw) && bw > 30) userWeightKg = bw;
    }

    const setData = (tracking && tracking.setData) || {};
    let totalCompletedSets = 0;
    let totalVolumeKg = 0;

    day.exercises.forEach((ex, exIndex) => {
      const setsCount = UI.parseSetsCount(ex.sets);
      for (let s = 0; s < setsCount; s++) {
        if (setData[`ex_${exIndex}_set_${s}_done`]) {
          totalCompletedSets++;
          const weight = parseFloat(setData[`ex_${exIndex}_set_${s}_weight`]) || 0;
          const reps = parseInt(setData[`ex_${exIndex}_set_${s}_reps`], 10) || 0;
          if (reps > 0) {
            totalVolumeKg += (weight * reps);
          }
        }
      }
    });

    if (totalCompletedSets === 0) return 0;

    const dayType = String(day.dayType || '').toLowerCase();
    let caloriesBurned = 0;

    if (dayType.includes('zone 2') || dayType.includes('cardio') || dayType.includes('vo2 max')) {
      const totalPlannedSets = day.exercises.reduce((sum, ex) => sum + UI.parseSetsCount(ex.sets), 0) || 1;
      const completionRatio = totalCompletedSets / totalPlannedSets;
      caloriesBurned = Math.round(350 * completionRatio * (userWeightKg / 70));
    } else if (dayType.includes('active recovery')) {
      caloriesBurned = Math.round(totalCompletedSets * 8 * (userWeightKg / 70));
    } else {
      const baseSetBurn = totalCompletedSets * 11 * (userWeightKg / 70);
      const volumeBonus = (totalVolumeKg / 100) * 1.5;
      caloriesBurned = Math.round(baseSetBurn + volumeBonus);
    }

    return Math.max(0, caloriesBurned);
  }

  /**
   * Render Nutrition Section with Gemini AI & Photo Scanner
   */
  async function renderNutritionSection(queryDateStr) {
    renderNutritionSectionRef = renderNutritionSection;
    if (!queryDateStr) {
      if (!selectedNutritionDate) {
        selectedNutritionDate = UI.getLocalDateString();
      }
      queryDateStr = selectedNutritionDate;
    } else {
      selectedNutritionDate = queryDateStr;
    }

    const parts = queryDateStr.split('-').map(Number);
    const dObj = new Date(parts[0], parts[1] - 1, parts[2], 12, 0, 0);
    const prevD = new Date(dObj); prevD.setDate(prevD.getDate() - 1);
    const nextD = new Date(dObj); nextD.setDate(nextD.getDate() + 1);
    const yesterdayStr = UI.getLocalDateString(prevD);
    const tomorrowStr = UI.getLocalDateString(nextD);
    const todayStr = UI.getLocalDateString();

    const setupCard = document.getElementById('gemini-setup-card');
    const mainContent = document.getElementById('nutrition-main-content');
    
    if (typeof GeminiService === 'undefined') return;
    if (GeminiService.initSelects) GeminiService.initSelects();
    GeminiService.getApiKey().then(key => {
      if (key && GeminiService.discoverAvailableModels) GeminiService.discoverAvailableModels(key);
    });

    const isConfigured = await GeminiService.isConfigured();

    if (!isConfigured) {
      if (setupCard) setupCard.style.display = 'block';
      if (mainContent) mainContent.style.display = 'none';

      // Bind setup button
      const saveKeyBtn = document.getElementById('save-gemini-key-btn');
      if (saveKeyBtn && !saveKeyBtn.hasAttribute('data-bound')) {
        saveKeyBtn.setAttribute('data-bound', 'true');
        saveKeyBtn.onclick = async () => {
          const keyInput = document.getElementById('gemini-api-key-input');
          const modelSelect = document.getElementById('gemini-model-select');
          const errorDiv = document.getElementById('gemini-key-error');
          const key = keyInput ? keyInput.value.trim() : '';
          const model = modelSelect ? modelSelect.value : 'gemini-3.1-flash-lite';

          if (!key) {
            if (errorDiv) { errorDiv.textContent = I18n.t('enter_api_key'); errorDiv.style.display = 'block'; }
            return;
          }

          saveKeyBtn.disabled = true;
          saveKeyBtn.textContent = I18n.t('checking_key');
          if (errorDiv) errorDiv.style.display = 'none';

          try {
            await GeminiService.testApiKey(key, model);
            await GeminiService.setApiKey(key);
            await GeminiService.setModel(model);
            UI.toast(I18n.t('key_saved_success'), 'success');
            if (window.updateGeminiSettingsUI) window.updateGeminiSettingsUI();
            renderNutritionSection(queryDateStr);
          } catch (err) {
            saveKeyBtn.disabled = false;
            saveKeyBtn.textContent = I18n.t('save_enable_ai');
            if (errorDiv) { errorDiv.textContent = err.message; errorDiv.style.display = 'block'; }
          }
        };
      }
      return;
    }

    if (setupCard) setupCard.style.display = 'none';
    if (mainContent) mainContent.style.display = 'block';

    // Display current model badge
    const modelBadge = document.getElementById('current-ai-model-badge');
    if (modelBadge) {
      const currentModel = await GeminiService.getModel();
      modelBadge.textContent = currentModel;
    }

    const deleteBadgeBtn = document.getElementById('delete-gemini-key-badge-btn');
    if (deleteBadgeBtn) {
      deleteBadgeBtn.onclick = async () => {
        if (confirm(I18n.t('delete_key_confirm'))) {
          await GeminiService.removeApiKey();
          UI.toast(I18n.t('key_deleted'), 'info');
          if (window.updateGeminiSettingsUI) window.updateGeminiSettingsUI();
          renderNutritionSection(queryDateStr);
        }
      };
    }

    // Set date label & nav controls
    const dateLabel = document.getElementById('nutrition-date-label');
    if (dateLabel) {
      const formattedDate = queryDateStr.split('-').reverse().join('/');
      const isToday = queryDateStr === todayStr;
      const todayText = isToday ? ` (${I18n.t('nav_today')})` : '';

      const isRTL = (window.I18n && window.I18n.getDir() === 'rtl') || document.documentElement.dir === 'rtl';
      const prevArrow = isRTL ? '▶' : '◀';
      const nextArrow = isRTL ? '◀' : '▶';

      dateLabel.innerHTML = `
        <div style="display: flex; align-items: center; gap: 4px; flex-wrap: wrap;">
          <button id="nut-prev-day-btn" style="background: var(--bg-elevated); border: 1px solid var(--border-light); color: var(--text-primary); border-radius: 6px; padding: 2px 8px; cursor: pointer; font-size: 11px; font-weight: 700;" title="${I18n.t('nav_prev_nut_day')}">${prevArrow}</button>
          <span style="font-weight: 700; color: var(--text-primary); font-size: 12px; margin: 0 2px;">${I18n.t('nut_date_label')} ${formattedDate}${todayText}</span>
          <button id="nut-next-day-btn" style="background: var(--bg-elevated); border: 1px solid var(--border-light); color: var(--text-primary); border-radius: 6px; padding: 2px 8px; cursor: pointer; font-size: 11px; font-weight: 700;" title="${I18n.t('nav_next_nut_day')}">${nextArrow}</button>
          ${!isToday ? `<button id="nut-today-btn" style="background: var(--accent-primary); border: none; color: #fff; border-radius: 6px; padding: 2px 8px; cursor: pointer; font-size: 11px; font-weight: 700; margin-left: 4px;" title="${I18n.t('back_to_today')}">📅 ${I18n.t('nav_today')}</button>` : ''}
        </div>
      `;
      const prevBtn = document.getElementById('nut-prev-day-btn');
      const nextBtn = document.getElementById('nut-next-day-btn');
      const todayBtn = document.getElementById('nut-today-btn');
      if (prevBtn) prevBtn.onclick = () => renderNutritionSection(yesterdayStr);
      if (nextBtn) nextBtn.onclick = () => renderNutritionSection(tomorrowStr);
      if (todayBtn) todayBtn.onclick = () => renderNutritionSection(todayStr);
    }

    // Load nutrition data from DB for queryDateStr
    let nutrition = await DB.getNutrition(queryDateStr);
    if (!nutrition) nutrition = { meals: [], supplements_taken: [] };

    // Calculate totals
    let totalCals = 0;
    let totalProtein = 0;
    if (nutrition.meals && nutrition.meals.length > 0) {
      nutrition.meals.forEach(m => {
        totalCals += (m.calories || 0);
        totalProtein += (m.protein || 0);
      });
    }

    const targetCals = 1980; // 2200 with 10% reduction
    const targetProtein = 160;

    // Calculate Workout Burn & Info
    let workoutBurn = 0;
    let workoutInfo = { dayType: '', completedSets: 0, volumeKg: 0, burnedCals: 0 };
    if (allPlanDays && allPlanDays[currentDayIndex]) {
      const activeDay = allPlanDays[currentDayIndex];
      const tracking = currentTracking || {};
      workoutBurn = calculateWorkoutBurn(activeDay, tracking);

      const setData = tracking.setData || {};
      let setsDone = 0;
      let vol = 0;
      (activeDay.exercises || []).forEach((ex, exIndex) => {
        const count = UI.parseSetsCount(ex.sets);
        for (let s = 0; s < count; s++) {
          if (setData[`ex_${exIndex}_set_${s}_done`]) {
            setsDone++;
            const weight = parseFloat(setData[`ex_${exIndex}_set_${s}_weight`]) || 0;
            const reps = parseInt(setData[`ex_${exIndex}_set_${s}_reps`], 10) || 0;
            vol += (weight * reps);
          }
        }
      });

      workoutInfo = {
        dayType: activeDay.dayType,
        completedSets: setsDone,
        volumeKg: vol,
        burnedCals: workoutBurn
      };
    }

    // Update HUD
    const nutCalsEl = document.getElementById('nut-calories-total');
    const nutProtEl = document.getElementById('nut-protein-total');
    const nutCalsTargetEl = document.getElementById('nut-calories-target');
    const nutBurnEl = document.getElementById('nut-workout-burned');
    const nutNetEl = document.getElementById('nut-net-calories');
    const nutNetTargetEl = document.getElementById('nut-net-target');

    if (nutCalsEl) nutCalsEl.textContent = totalCals;
    if (nutProtEl) nutProtEl.textContent = totalProtein;
    if (nutCalsTargetEl) nutCalsTargetEl.textContent = targetCals;

    const netCals = totalCals - workoutBurn;
    if (nutBurnEl) nutBurnEl.textContent = workoutBurn;
    if (nutNetEl) nutNetEl.textContent = netCals;
    if (nutNetTargetEl) nutNetTargetEl.textContent = targetCals;

    const calsPercent = Math.round((totalCals / targetCals) * 100);
    const proteinPercent = Math.round((totalProtein / targetProtein) * 100);

    const calsBar = document.getElementById('nut-calories-bar');
    const protBar = document.getElementById('nut-protein-bar');
    if (calsBar) calsBar.style.width = `${Math.min(100, (totalCals / targetCals) * 100)}%`;
    if (protBar) protBar.style.width = `${Math.min(100, (totalProtein / targetProtein) * 100)}%`;

    // Nav HUD
    const navCals = document.getElementById('nav-cals-text');
    const navProt = document.getElementById('nav-protein-text');
    const navCalsPercent = document.getElementById('nav-cals-percent');
    const navProtPercent = document.getElementById('nav-protein-percent');

    if (navCals) navCals.textContent = `${totalCals}`;
    if (navProt) navProt.textContent = `${totalProtein}`;
    if (navCalsPercent) navCalsPercent.textContent = `${calsPercent}%`;
    if (navProtPercent) navProtPercent.textContent = `${proteinPercent}%`;

    const desktopNavNut = document.getElementById('desktop-nav-nutrition');
    if (desktopNavNut) {
      desktopNavNut.innerHTML = `<span style="color: var(--warning);">${totalCals} ${I18n.t('nut_kcal_label')} (${calsPercent}%)</span><span style="color: var(--border-color);">|</span><span style="color: var(--success);">${totalProtein}g ${I18n.t('nut_protein_label')} (${proteinPercent}%)</span>`;
    }

    // Render AI Daily Advice Card
    const aiCard = document.getElementById('ai-advice-card');
    const aiContent = document.getElementById('ai-advice-content');
    const refreshAiBtn = document.getElementById('refresh-ai-advice-btn');

    if (aiCard && aiContent) {
      const currentStateFingerprint = `${queryDateStr}_cals${totalCals}_prot${totalProtein}_meals${(nutrition.meals || []).length}_burn${workoutBurn}_comp${workoutInfo.completedSets > 0 ? 1 : 0}`;
      const adviceCacheKey = `fitup_ai_advice_cache_${queryDateStr}`;

      const fetchAdvice = async (forceRefresh = false) => {
        let cachedData = null;
        try {
          const raw = localStorage.getItem(adviceCacheKey);
          if (raw) {
            if (raw.startsWith('{')) {
              cachedData = JSON.parse(raw);
            } else {
              // Legacy plain string cache - clear
              localStorage.removeItem(adviceCacheKey);
            }
          }
        } catch (e) {
          localStorage.removeItem(adviceCacheKey);
        }

        if (cachedData && cachedData.fingerprint === currentStateFingerprint && !forceRefresh) {
          aiContent.textContent = cachedData.text;
          return;
        }

        aiContent.innerHTML = `<span style="color: var(--text-muted);">${I18n.t('ai_advice_loading')}</span>`;
        try {
          const adviceText = await GeminiService.getDailyAdvice(
            { calories: totalCals, protein: totalProtein },
            { calories: targetCals, protein: targetProtein },
            workoutInfo
          );
          if (adviceText) {
            aiContent.textContent = adviceText;
            localStorage.setItem(adviceCacheKey, JSON.stringify({
              fingerprint: currentStateFingerprint,
              text: adviceText
            }));
          } else {
            aiContent.innerHTML = `<span style="color: var(--text-muted);">${I18n.t('gemini_key_not_set')}</span>`;
          }
        } catch (err) {
          console.warn('AI advice fetch error:', err);
          aiContent.innerHTML = `<span style="color: var(--text-muted);">${I18n.t('gemini_no_response')}</span>`;
        }
      };

      if (refreshAiBtn) {
        refreshAiBtn.onclick = (e) => {
          e.stopPropagation();
          fetchAdvice(true);
        };
      }
      fetchAdvice(false);
    }

    // Update Quick Protein Powder Completion Button
    const quickProtBtn = document.getElementById('quick-protein-powder-btn');
    if (quickProtBtn) {
      const remainingNeeded = Math.max(0, targetProtein - totalProtein);
      if (remainingNeeded <= 0) {
        quickProtBtn.innerHTML = I18n.t('protein_goal_reached');
        quickProtBtn.disabled = true;
        quickProtBtn.style.opacity = '0.6';
        quickProtBtn.style.cursor = 'default';
        quickProtBtn.onclick = null;
      } else {
        const powderAmount = Math.ceil(remainingNeeded * 1.1);
        quickProtBtn.innerHTML = `🥛 ${I18n.t('quick_protein_consumed')} ${powderAmount}g ${I18n.t('quick_protein_powder')}`;
        quickProtBtn.disabled = false;
        quickProtBtn.style.opacity = '1';
        quickProtBtn.style.cursor = 'pointer';

        quickProtBtn.onclick = async () => {
          const targetDateStr = UI.getLocalDateString();
          let currentNut = await DB.getNutrition(targetDateStr);
          if (!currentNut) currentNut = { meals: [], supplements_taken: [] };
          if (!currentNut.meals) currentNut.meals = [];

          const now = new Date();
          const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

          const newMeal = {
            id: 'meal_' + Date.now(),
            name: I18n.t('protein_powder_name'),
            calories: Math.round(powderAmount * 4),
            protein: powderAmount,
            time: timeStr,
            analysis: I18n.t('protein_powder_analysis')
          };

          currentNut.meals.push(newMeal);
          await DB.saveNutrition(targetDateStr, currentNut);

          UI.toast(I18n.t('protein_added_toast'), 'success');
          if (typeof CloudSync !== 'undefined' && CloudSync.scheduleSync) {
            CloudSync.scheduleSync();
          }
          renderNutritionSection(targetDateStr);
        };
      }
    }

    // Render Meals Log List
    const mealsContainer = document.getElementById('meals-log-container');
    const countBadge = document.getElementById('meals-count-badge');

    if (countBadge) {
      countBadge.textContent = `${nutrition.meals ? nutrition.meals.length : 0} ${I18n.t('nut_meals_count')}`;
    }

    if (mealsContainer) {
      mealsContainer.innerHTML = '';

      if (nutrition.meals && nutrition.meals.length > 0) {
        nutrition.meals.forEach(meal => {
          const mealCard = document.createElement('div');
          mealCard.style.cssText = "background: var(--bg-input); border-radius: 12px; padding: 12px; border: 1px solid var(--border-light); display: flex; flex-direction: column; gap: 8px;";

          const imgHtml = meal.image ? `
            <img src="${meal.image}" alt="${meal.name}" loading="eager" decoding="async" style="width: 60px; height: 60px; border-radius: 8px; object-fit: cover; border: 1px solid var(--border-light); flex-shrink: 0;">
          ` : '';

          const analysisHtml = meal.analysis ? `
            <div style="font-size: 11px; color: var(--text-secondary); background: var(--bg-card); padding: 8px 10px; border-radius: 8px; border-right: 3px solid var(--accent-primary); line-height: 1.4;">
              🤖 <em>${meal.analysis}</em>
            </div>
          ` : '';

          const targetMoveDate = (queryDateStr === todayStr) ? yesterdayStr : todayStr;
          const targetMoveLabel = (queryDateStr === todayStr) ? I18n.t('move_to_yesterday') : I18n.t('move_to_today');

          mealCard.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 10px;">
              ${imgHtml}
              <div style="flex: 1;">
                <div style="font-size: 14px; font-weight: 800; color: var(--text-primary); margin-bottom: 2px;">${meal.name}</div>
                <div style="display: flex; gap: 8px; align-items: center; flex-wrap: wrap;">
                  <span style="font-size: 12px; font-weight: 700; color: var(--warning); background: var(--warning-bg); padding: 2px 6px; border-radius: 6px;">🔥 ${meal.calories} ${I18n.t('nut_kcal_label')}</span>
                  <span style="font-size: 12px; font-weight: 700; color: var(--success); background: var(--success-bg); padding: 2px 6px; border-radius: 6px;">🥩 ${meal.protein}g ${I18n.t('nut_protein_label')}</span>
                  <span style="font-size: 11px; color: var(--text-muted);">${meal.time || ''}</span>
                </div>
              </div>
              <div style="display: flex; gap: 6px; align-items: center;">
                <button class="move-meal-btn" data-id="${meal.id}" data-target="${targetMoveDate}" style="background: var(--bg-elevated); border: 1px solid var(--border-light); font-size: 11px; font-weight: 700; cursor: pointer; color: var(--accent-primary); padding: 4px 8px; border-radius: 6px; display: flex; align-items: center; gap: 4px;" title="${I18n.t('move_meal_title')}">
                  📅 ${targetMoveLabel}
                </button>
                <button class="delete-meal-btn" data-id="${meal.id}" style="background: none; border: none; font-size: 16px; cursor: pointer; color: var(--danger); padding: 4px;" title="${I18n.t('delete_meal')}">🗑️</button>
              </div>
            </div>
            ${analysisHtml}
          `;

          mealsContainer.appendChild(mealCard);
        });

        // Bind move handlers
        mealsContainer.querySelectorAll('.move-meal-btn').forEach(btn => {
          btn.onclick = async () => {
            const id = btn.dataset.id;
            const targetDateStr = btn.dataset.target;
            let currentNut = await DB.getNutrition(queryDateStr);
            if (currentNut && currentNut.meals) {
              const mealToMove = currentNut.meals.find(m => m.id === id);
              if (mealToMove) {
                currentNut.meals = currentNut.meals.filter(m => m.id !== id);
                await DB.saveNutrition(queryDateStr, currentNut);

                let targetNut = await DB.getNutrition(targetDateStr);
                if (!targetNut) targetNut = { meals: [], supplements_taken: [] };
                if (!targetNut.meals) targetNut.meals = [];
                targetNut.meals.push(mealToMove);
                await DB.saveNutrition(targetDateStr, targetNut);

                UI.toast(I18n.t('meal_moved_success'), 'success');
                if (typeof CloudSync !== 'undefined' && CloudSync.scheduleSync) {
                  CloudSync.scheduleSync();
                }
                renderNutritionSection(queryDateStr);
              }
            }
          };
        });

        // Bind delete handlers
        mealsContainer.querySelectorAll('.delete-meal-btn').forEach(btn => {
          btn.onclick = async () => {
            if (confirm(I18n.t('delete_meal_confirm'))) {
              const id = btn.dataset.id;
              let currentNut = await DB.getNutrition(queryDateStr);
              if (currentNut && currentNut.meals) {
                currentNut.meals = currentNut.meals.filter(m => m.id !== id);
                await DB.saveNutrition(queryDateStr, currentNut);
                UI.toast(I18n.t('meal_deleted'), 'info');
                if (typeof CloudSync !== 'undefined' && CloudSync.scheduleSync) {
                  CloudSync.scheduleSync();
                }
                renderNutritionSection(queryDateStr);
              }
            }
          };
        });

      } else {
        mealsContainer.innerHTML = `<div style="text-align: center; font-size: 13px; color: var(--text-muted); padding: 24px;">${I18n.t('no_meals_yet')}</div>`;
      }
    }

    // Wire Camera & Gallery Inputs
    setupCameraAndPhotoHandlers(queryDateStr);
  }

  function setupCameraAndPhotoHandlers(queryDateStr) {
    const cameraInput = document.getElementById('food-camera-input');
    const galleryInput = document.getElementById('food-gallery-input');
    const previewBox = document.getElementById('food-analysis-preview');
    const previewImg = document.getElementById('food-preview-img');
    const cancelBtn = document.getElementById('cancel-analysis-btn');
    const runAiBtn = document.getElementById('run-ai-analysis-btn');
    const userNotesInput = document.getElementById('food-user-notes');
    const manualMealBtn = document.getElementById('manual-meal-btn');

    let activeBase64Image = null;
    let activeMimeType = 'image/jpeg';

    const handleFileSelect = async (file) => {
      if (!file) return;
      activeMimeType = 'image/jpeg';
      try {
        const compressedBase64 = await UI.compressImage(file, 500, 0.65);
        activeBase64Image = compressedBase64;
        if (previewImg) previewImg.src = activeBase64Image;
        if (previewBox) previewBox.style.display = 'block';
      } catch (err) {
        console.error('Error compressing food image:', err);
        const reader = new FileReader();
        reader.onload = (e) => {
          activeBase64Image = e.target.result;
          if (previewImg) previewImg.src = activeBase64Image;
          if (previewBox) previewBox.style.display = 'block';
        };
        reader.readAsDataURL(file);
      }
    };

    if (cameraInput && !cameraInput.hasAttribute('data-bound')) {
      cameraInput.setAttribute('data-bound', 'true');
      cameraInput.onchange = (e) => handleFileSelect(e.target.files[0]);
    }

    if (galleryInput && !galleryInput.hasAttribute('data-bound')) {
      galleryInput.setAttribute('data-bound', 'true');
      galleryInput.onchange = (e) => handleFileSelect(e.target.files[0]);
    }

    if (cancelBtn && !cancelBtn.hasAttribute('data-bound')) {
      cancelBtn.setAttribute('data-bound', 'true');
      cancelBtn.onclick = () => {
        if (previewBox) previewBox.style.display = 'none';
        activeBase64Image = null;
        if (cameraInput) cameraInput.value = '';
        if (galleryInput) galleryInput.value = '';
      };
    }

    if (runAiBtn && !runAiBtn.hasAttribute('data-bound')) {
      runAiBtn.setAttribute('data-bound', 'true');
      runAiBtn.onclick = async () => {
        if (!activeBase64Image) {
          UI.toast(I18n.t('select_photo'), 'warning');
          return;
        }

        const notes = userNotesInput ? userNotesInput.value.trim() : '';

        runAiBtn.disabled = true;
        runAiBtn.innerHTML = `<span>⏳</span> ${I18n.t('analyzing_ai')}`;

        try {
          const analysisResult = await GeminiService.analyzeFood(activeBase64Image, activeMimeType, notes);
          
          const targetDateStr = UI.getLocalDateString();
          let currentNut = await DB.getNutrition(targetDateStr);
          if (!currentNut) currentNut = { meals: [], supplements_taken: [] };
          if (!currentNut.meals) currentNut.meals = [];

          const now = new Date();
          const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

          const newMeal = {
            id: 'meal_' + Date.now(),
            name: analysisResult.meal_name,
            calories: analysisResult.calories,
            protein: analysisResult.protein,
            carbs: analysisResult.carbs,
            fat: analysisResult.fat,
            analysis: analysisResult.analysis,
            time: timeStr,
            image: activeBase64Image
          };

          currentNut.meals.push(newMeal);
          await DB.saveNutrition(targetDateStr, currentNut);

          UI.toast(`${I18n.t('meal_added_toast')} ${analysisResult.meal_name} (${analysisResult.calories} ${I18n.t('nut_kcal_label')}) 🎉`, 'success');
          CloudSync.scheduleSync();

          // Reset inputs
          if (previewBox) previewBox.style.display = 'none';
          activeBase64Image = null;
          if (cameraInput) cameraInput.value = '';
          if (galleryInput) galleryInput.value = '';
          if (userNotesInput) userNotesInput.value = '';

          renderNutritionSection(targetDateStr);

        } catch (err) {
          console.error('AI analysis error:', err);
          UI.toast(I18n.t('ai_analysis_error') + err.message, 'error');
        } finally {
          runAiBtn.disabled = false;
          runAiBtn.innerHTML = `<span>🤖</span> ${I18n.t('analyze_with_ai')}`;
        }
      };
    }

    if (manualMealBtn && !manualMealBtn.hasAttribute('data-bound')) {
      manualMealBtn.setAttribute('data-bound', 'true');
      manualMealBtn.onclick = async () => {
        const name = prompt(I18n.t('manual_meal_name'));
        if (!name || !name.trim()) return;
        const calsStr = prompt(I18n.t('manual_meal_cals'), '500');
        const protStr = prompt(I18n.t('manual_meal_protein'), '35');

        const cals = parseInt(calsStr) || 0;
        const prot = parseInt(protStr) || 0;

        const targetDateStr = UI.getLocalDateString();
        let currentNut = await DB.getNutrition(targetDateStr);
        if (!currentNut) currentNut = { meals: [], supplements_taken: [] };
        if (!currentNut.meals) currentNut.meals = [];

        const now = new Date();
        const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

        currentNut.meals.push({
          id: 'meal_' + Date.now(),
          name: name.trim(),
          calories: cals,
          protein: prot,
          time: timeStr,
          analysis: I18n.t('manual_entry')
        });

        await DB.saveNutrition(targetDateStr, currentNut);
        UI.toast(I18n.t('meal_added_success'), 'success');
        CloudSync.scheduleSync();
        renderNutritionSection(targetDateStr);
      };
    }
  }
    
    // Equipment Banner (Accordion & Unified Equipment List)
    const eqBanner = document.getElementById('day-equipment-banner');
    if (eqBanner) {
      if (day.exercises && day.exercises.length > 0 && day.dayType !== 'Rest') {
        const unifiedRequirementsMap = new Map();
        let newExercisesList = [];
        let changedExercisesList = [];

        day.exercises.forEach((ex, idx) => {
          const exNum = idx + 1;
          const isW = isWeighted(ex);

          if (isW) {
            const weightInfo = parseWeightDetails(ex.weight, ex.name);
            if (weightInfo) {
              const nameLower = ex.name.toLowerCase();
              const weightLower = String(ex.weight).toLowerCase();
              const isVest = nameLower.includes('weighted') || weightLower.includes('vest') || weightLower.includes('+');
              const isBand = nameLower.includes('band') || weightLower.includes('band') || nameLower.includes('pallof');
              
              let equipLabel = I18n.t('equip_db') || 'משקולות DB';
              let equipIcon = `<svg width="1.2em" height="1.2em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6.5 6.5 11 11"/><path d="m21 21-1-1"/><path d="m3 3 1 1"/><path d="m18 22 4-4"/><path d="m2 6 4-4"/><path d="m3 10 7-7"/><path d="m14 21 7-7"/></svg>`;
              
              if (isBand) {
                equipLabel = I18n.t('equip_band') || 'גומיית התנגדות';
                equipIcon = `<svg width="1.2em" height="1.2em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="2" width="14" height="20" rx="7" ry="7" transform="rotate(-45 12 12)"/><path d="M12 2v20" opacity="0.3" transform="rotate(-45 12 12)"/></svg>`;
              } else if (isVest) {
                equipLabel = I18n.t('equip_vest') || 'וסט משקל';
                equipIcon = `<svg width="1.2em" height="1.2em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2h12v6l-2 2v10H8V10L6 8V2z"/><path d="M9 2v4"/><path d="M15 2v4"/></svg>`;
              } else {
                equipLabel = weightInfo.isPerHand ? `${equipLabel} (זוג)` : `${equipLabel} (אחת)`;
              }

              const reqKey = `weight_${isBand ? 'band' : (isVest ? 'vest' : (weightInfo.isPerHand ? '2x' : '1x'))}_${weightInfo.cleanWeight}`;
              if (!unifiedRequirementsMap.has(reqKey)) {
                unifiedRequirementsMap.set(reqKey, {
                  type: 'weight',
                  icon: equipIcon,
                  label: equipLabel,
                  weightInfo: weightInfo,
                  exercises: []
                });
              }
              unifiedRequirementsMap.get(reqKey).exercises.push(exNum);
            }
          }
          
          const equips = UI.getEquipments ? UI.getEquipments(ex.name) : [UI.getEquipment(ex.name)];
          equips.forEach(equip => {
            if (equip && equip.label !== I18n.t('equip_bodyweight') && equip.label !== I18n.t('equip_wall') && equip.label !== I18n.t('equip_db') && equip.key !== 'weighted' && equip.key !== 'vest' && equip.key !== 'band') {
              const reqKey = `equip_${equip.label}`;
              if (!unifiedRequirementsMap.has(reqKey)) {
                unifiedRequirementsMap.set(reqKey, {
                  type: 'equipment',
                  icon: equip.icon,
                  label: equip.label,
                  weightInfo: null,
                  exercises: []
                });
              }
              if (!unifiedRequirementsMap.get(reqKey).exercises.includes(exNum)) {
                unifiedRequirementsMap.get(reqKey).exercises.push(exNum);
              }
            }
          });
          
          let prevEx = null;
          for (let i = currentDayIndex - 1; i >= 0; i--) {
            const pastDay = allPlanDays[i];
            if (pastDay && pastDay.exercises) {
              prevEx = pastDay.exercises.find(e => (e.id && ex.id && e.id === ex.id) || e.name === ex.name);
              if (prevEx) break;
            }
          }
          
          const isNewExercise = !prevEx && currentDayIndex > 0 && day.dayType !== 'Rest';
          if (isNewExercise) newExercisesList.push(exNum);
          
          const isSetsChanged = prevEx && ex.sets !== prevEx.sets;
          const isWeightChanged = prevEx && ex.weight !== prevEx.weight && isWeighted(ex);
          if (isSetsChanged || isWeightChanged) changedExercisesList.push(exNum);
        });
        
        const reportSvgs = {
          report: `<svg width="1.2em" height="1.2em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M16 13H8"/><path d="M16 17H8"/><path d="M10 9H8"/></svg>`,
          sparkles: `<svg width="1.2em" height="1.2em" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>`,
          trendUp: `<svg width="1.2em" height="1.2em" viewBox="0 0 24 24" fill="none" stroke="var(--warning)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>`
        };

        let bodyItems = [];

        // 1. Unified Equipment & Weight items
        if (unifiedRequirementsMap.size > 0) {
          Array.from(unifiedRequirementsMap.values()).forEach(item => {
            const exercisesText = `${I18n.t(item.exercises.length > 1 ? 'required_for_exercises_plural' : 'required_for_exercises')} <b style="font-family: 'Inter', sans-serif;">${item.exercises.map(n => `#${n}`).join(', ')}</b>`;

            if (item.type === 'weight') {
              const badgeHTML = buildWeightBadgeHTML(item.weightInfo, true);
              bodyItems.push(`
                <div style="display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 7px 10px; background: var(--bg-input, rgba(255,255,255,0.03)); border: 1px solid var(--border-light); border-radius: 9px;">
                  <div style="display: flex; align-items: center; gap: 8px; font-size: 13px; color: var(--text-primary);">
                    <span style="font-size: 15px; color: #f97316; display: flex;">${item.icon}</span>
                    <span><span style="font-weight: 700;">${item.label}:</span> ${exercisesText}</span>
                  </div>
                  <div style="flex-shrink: 0;">
                    ${badgeHTML}
                  </div>
                </div>
              `);
            } else {
              bodyItems.push(`
                <div style="display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 7px 10px; background: var(--bg-input, rgba(255,255,255,0.03)); border: 1px solid var(--border-light); border-radius: 9px;">
                  <div style="display: flex; align-items: center; gap: 8px; font-size: 13px; color: var(--text-primary);">
                    <span style="font-size: 15px; color: #f97316; display: flex;">${item.icon}</span>
                    <span><span style="font-weight: 700;">${item.label}:</span> ${exercisesText}</span>
                  </div>
                </div>
              `);
            }
          });
        }

        // 2. New exercises
        if (newExercisesList.length > 0) {
          bodyItems.push(`
            <div style="display: flex; align-items: flex-start; gap: 10px; padding: 6px 10px; background: rgba(239, 68, 68, 0.08); border: 1px solid rgba(239, 68, 68, 0.2); border-radius: 8px;">
              <span style="font-size: 16px; margin-top: 1px; animation: blinkRed 2s infinite; border-radius: 50%; display: flex;">${reportSvgs.sparkles}</span>
              <div style="font-size: 13px; color: var(--text-primary); line-height: 1.4;">
                <span style="font-weight: 700; color: #ef4444;">${I18n.t('new_exercises_label')}</span> 
                <b style="font-family: 'Inter', sans-serif; color: #ef4444;">${newExercisesList.map(n => `#${n}`).join(', ')}</b>. ${I18n.t('new_exercises_tip')}
              </div>
            </div>
          `);
        }

        // 3. Changed exercises
        if (changedExercisesList.length > 0) {
          bodyItems.push(`
            <div style="display: flex; align-items: flex-start; gap: 10px; padding: 6px 10px; background: rgba(245, 158, 11, 0.08); border: 1px solid rgba(245, 158, 11, 0.2); border-radius: 8px;">
              <span style="font-size: 16px; margin-top: 1px; display: flex;">${reportSvgs.trendUp}</span>
              <div style="font-size: 13px; color: var(--text-primary); line-height: 1.4;">
                <span style="font-weight: 700; color: var(--warning);">${I18n.t('load_volume_label')}</span> 
                ${I18n.t(changedExercisesList.length > 1 ? 'load_volume_updated_plural' : 'load_volume_updated')} <b style="font-family: 'Inter', sans-serif;">${changedExercisesList.map(n => `#${n}`).join(', ')}</b>
              </div>
            </div>
          `);
        }

        if (bodyItems.length > 0) {
          const isHidden = isEqBannerCollapsed;
          eqBanner.innerHTML = `
            <div style="background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 14px; padding: 14px 16px; box-shadow: 0 4px 14px rgba(0,0,0,0.03); transition: all 0.3s ease;">
              <div id="eq-banner-header" onclick="TodayPage.toggleEqBanner()" style="display: flex; align-items: center; justify-content: space-between; cursor: pointer; user-select: none; padding-bottom: ${isHidden ? '0' : '10px'}; border-bottom: ${isHidden ? 'none' : '1px solid var(--border-light)'};">
                <h3 style="font-size: 15px; font-weight: 800; color: var(--text-primary); margin: 0; display: flex; align-items: center; gap: 8px;">
                  <span style="display: flex; color: var(--accent-primary);">${reportSvgs.report}</span> ${I18n.t('workout_overview_title')}
                </h3>
                <span id="eq-banner-arrow" style="font-size: 12px; color: var(--text-muted); transition: transform 0.3s ease; transform: rotate(${isHidden ? '180deg' : '0deg'});">
                  ▲
                </span>
              </div>
              <div id="eq-banner-body" style="display: ${isHidden ? 'none' : 'flex'}; flex-direction: column; gap: 8px; margin-top: ${isHidden ? '0' : '10px'};">
                ${bodyItems.join('')}
              </div>
            </div>
          `;
        } else {
          eqBanner.innerHTML = '';
        }
      } else {
        eqBanner.innerHTML = '';
      }
    }

    // Update progress
    updateProgress(day);

    // Dynamic enrichment with Progression Engine states
    await enrichDayWithProgression(day);

    // Render exercises
    renderExercises(day);

    // Update inputs
    document.getElementById('actual-rpe').value = currentTracking.actualRPE || '';
    document.getElementById('body-weight').value = currentTracking.bodyWeight || '';
    document.getElementById('day-notes').value = currentTracking.notes || '';

    // Update navigation info and arrows direction according to language direction
    const isRTL = (window.I18n && window.I18n.getDir() === 'rtl') || document.documentElement.dir === 'rtl';
    const prevBtn = document.getElementById('nav-prev-day');
    const nextBtn = document.getElementById('nav-next-day');
    if (prevBtn) {
      prevBtn.disabled = currentDayIndex <= 0;
      prevBtn.textContent = isRTL ? '▶' : '◀';
      prevBtn.title = I18n.t('prev_day_title');
    }
    if (nextBtn) {
      nextBtn.disabled = currentDayIndex >= allPlanDays.length - 1;
      nextBtn.textContent = isRTL ? '◀' : '▶';
      nextBtn.title = I18n.t('next_day_title');
    }

    setTimeout(() => {
      checkAndShowDailyBriefing(false);
    }, 400);
    await renderNutritionSection(selectedNutritionDate);
  }


  /**
   * Update progress ring
   */
  function updateProgress(day) {
    const total = day.exercises.length;
    if (total === 0) {
      setProgressCircle(day.dayType === 'Rest' && currentTracking.completed ? 100 : 0);
      return;
    }

    let completed = 0;
    day.exercises.forEach((ex, idx) => {
      const setData = (currentTracking.setData && currentTracking.setData[idx]) || {};
      const setsCount = UI.parseSetsCount(ex.sets);
      if (setsCount > 0) {
        let allSetsDone = true;
        for (let s = 0; s < setsCount; s++) {
          if (!setData[`set_${s}_done`]) {
            allSetsDone = false;
            break;
          }
        }
        if (!currentTracking.exerciseStatus) currentTracking.exerciseStatus = {};
        if (allSetsDone) {
          currentTracking.exerciseStatus[idx] = true;
        }
      }

      if (currentTracking.exerciseStatus && currentTracking.exerciseStatus[idx]) {
        completed++;
      }
    });

    const percent = Math.round((completed / total) * 100);
    setProgressCircle(percent);
  }

  /**
   * Set progress circle value
   */
  function setProgressCircle(percent) {
    const circles = document.querySelectorAll('.js-progress-circle');
    const texts = document.querySelectorAll('.js-progress-text');
    const circumference = 2 * Math.PI * 42; // r=42
    const offset = circumference - (percent / 100) * circumference;

    circles.forEach(circle => {
      circle.style.strokeDasharray = circumference;
      circle.style.strokeDashoffset = offset;
      
      // Add gradient definition if not exists
      const svg = circle.closest('svg');
      if (svg && !svg.querySelector('defs')) {
        const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
        const gradient = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
        gradient.id = 'progress-gradient';
        gradient.innerHTML = `
          <stop offset="0%" stop-color="#3b82f6"/>
          <stop offset="100%" stop-color="#8b5cf6"/>
        `;
        defs.appendChild(gradient);
        svg.insertBefore(defs, svg.firstChild);
      }
    });

    texts.forEach(text => {
      text.textContent = `${percent}%`;
    });
  }

  /**
   * Find previous tracking performance for a given exercise name
   * Looks back through plan days to find the last time this exercise was done with tracking data
   */
  function findPrevPerformance(exerciseName, beforeDayIndex) {
    if (!allTrackingCache || !exerciseName) return null;
    
    // Build tracking map for quick lookup
    const trackingMap = {};
    allTrackingCache.forEach(t => { trackingMap[t.dayIndex] = t; });
    
    // Search backwards from the day before current
    for (let i = beforeDayIndex - 1; i >= 0; i--) {
      const pastDay = allPlanDays[i];
      if (!pastDay || !pastDay.exercises) continue;
      
      const exIdx = pastDay.exercises.findIndex(e => e.name === exerciseName);
      if (exIdx === -1) continue;
      
      const tracking = trackingMap[i];
      if (!tracking || !tracking.setData || !tracking.setData[exIdx]) continue;
      
      // Found tracking data for this exercise
      return {
        dayIndex: i,
        dayNum: pastDay.dayNum,
        setData: tracking.setData[exIdx],
        completed: tracking.exerciseStatus && tracking.exerciseStatus[exIdx]
      };
    }
    return null;
  }

  /**
   * Look up video URL from exercise guide by name
   */


  function getLeanBadgesHTML(ex, weekNum) {
    if (!ex) return '';
    const name = ex.name.toLowerCase();
    const badges = [];

    // Lean Pairs
    if (name.includes('trx row') || name.includes('lateral raise') || name.includes('push-up') || name.includes('curl') || name.includes('towel hang') || name.includes('l-sit')) {
      if (name.includes('trx row') || (name.includes('lateral raise') && !name.includes('arm block'))) {
        badges.push(`<span class="lean-structure-badge pair" style="background: rgba(168, 85, 247, 0.15); border: 1px solid rgba(168, 85, 247, 0.35); color: #c084fc; padding: 2px 8px; border-radius: 6px; font-size: 11px; font-weight: 700; display: inline-flex; align-items: center; gap: 4px;">⚡ ${I18n.t('lean_pair_tag')}</span>`);
      }
    }

    // Core Citadel Circuit
    if (name.includes('pallof press') || name.includes('dead bug') || name.includes('hollow body hold')) {
      badges.push(`<span class="lean-structure-badge circuit" style="background: rgba(34, 197, 94, 0.15); border: 1px solid rgba(34, 197, 94, 0.35); color: #4ade80; padding: 2px 8px; border-radius: 6px; font-size: 11px; font-weight: 700; display: inline-flex; align-items: center; gap: 4px;">🛡️ ${I18n.t('lean_circuit_tag')}</span>`);
    }

    // Calf Block
    if (name.includes('calf raise')) {
      badges.push(`<span class="lean-structure-badge block" style="background: rgba(245, 158, 11, 0.15); border: 1px solid rgba(245, 158, 11, 0.35); color: #fbbf24; padding: 2px 8px; border-radius: 6px; font-size: 11px; font-weight: 700; display: inline-flex; align-items: center; gap: 4px;">🦵 ${I18n.t('lean_block_tag')}</span>`);
    }

    // Structural Toggle
    if (name.includes('single-leg rdl') || name.includes('pistol squat') || name.includes('y-t-w') || name.includes('pull-apart')) {
      badges.push(`<span class="lean-structure-badge toggle" style="background: rgba(59, 130, 246, 0.15); border: 1px solid rgba(59, 130, 246, 0.35); color: #60a5fa; padding: 2px 8px; border-radius: 6px; font-size: 11px; font-weight: 700; display: inline-flex; align-items: center; gap: 4px;">🔀 ${I18n.t('lean_toggle_tag')}</span>`);
    }

    // Biceps Microcycle
    if (name.includes('curl') && !name.includes('arm block')) {
      if (window.ProgressionEngine && window.ProgressionEngine.getBicepsMicrocyclePhase) {
        const phase = window.ProgressionEngine.getBicepsMicrocyclePhase(weekNum || 1);
        const color = phase.phase === 'LIGHT_MYO' ? '#ec4899' : '#3b82f6';
        badges.push(`<span class="lean-microcycle-badge" style="background: rgba(236, 72, 153, 0.15); border: 1px solid ${color}; color: ${color}; padding: 2px 8px; border-radius: 6px; font-size: 11px; font-weight: 700; display: inline-flex; align-items: center; gap: 4px;">💪 ${phase.phase === 'LIGHT_MYO' ? I18n.t('biceps_light_phase') : I18n.t('biceps_heavy_phase')}</span>`);
      }
    }

    // Myo-Reps Indicator
    if (name.includes('arm block') || name.includes('myo')) {
      badges.push(`<span class="lean-myo-badge" style="background: rgba(239, 68, 68, 0.15); border: 1px solid rgba(239, 68, 68, 0.35); color: #f87171; padding: 2px 8px; border-radius: 6px; font-size: 11px; font-weight: 700; display: inline-flex; align-items: center; gap: 4px;">🔥 ${I18n.t('myo_reps_title')}</span>`);
    }

    return badges.length > 0 ? `<div style="display: flex; flex-wrap: wrap; gap: 6px; margin-top: 4px; margin-bottom: 4px;">${badges.join('')}</div>` : '';
  }

  /**
   * Render exercise cards
   */
  function renderExercises(day) {
    const realTodayIndex = UI.findTodayIndex(allPlanDays);
    const isToday = currentDayIndex === realTodayIndex;
    const disabledAttr = isToday ? '' : 'disabled style="opacity: 0.5; cursor: not-allowed;"';

    const container = document.getElementById('exercises-list');
    if (!container) return;

    // Preserve currently expanded exercise cards or default to first incomplete unlocked exercise!
    const expandedIds = new Set(
      Array.from(container.querySelectorAll('.exercise-card.expanded')).map(card => card.id)
    );

    let defaultExpandedIdx = 0;
    if (day.exercises && day.exercises.length > 0) {
      for (let i = 0; i < day.exercises.length; i++) {
        const isDone = currentTracking.exerciseStatus && currentTracking.exerciseStatus[i];
        if (!isDone && isExerciseUnlocked(i)) {
          defaultExpandedIdx = i;
          break;
        }
      }
    }

    if (day.exercises.length === 0) {
      // Rest day
      const isCompleted = currentTracking.completed;
      container.innerHTML = `
        <div class="exercise-card ${isCompleted ? 'completed' : ''}" style="text-align: center; padding: 40px; display: flex; flex-direction: column; align-items: center; gap: 16px;">
          <div style="font-size: 48px;">😴</div>
          <div>
            <h3 style="font-size: 18px; margin-bottom: 8px;">Rest Day</h3>
            <p style="color: var(--text-secondary); font-size: 14px; max-width: 320px; margin: 0 auto;">
              ${I18n.t('rest_day_desc')}
            </p>
          </div>
          <button class="btn-primary rest-complete-btn ${isCompleted ? 'checked' : ''}" 
                  style="width: auto; padding: 10px 24px; font-weight: 600; display: inline-flex; align-items: center; gap: 8px; border: none; border-radius: 8px; cursor: pointer; transition: all 0.2s; background: ${isCompleted ? 'var(--success, #10b981)' : 'var(--accent-primary, #3b82f6)'}; color: white;"
                  onclick="TodayPage.toggleRestDayComplete()" ${disabledAttr}>
            ${isCompleted ? I18n.t('rest_day_completed') : I18n.t('rest_day_mark_complete')}
          </button>
        </div>
      `;
      return;
    }
    container.innerHTML = day.exercises.map((ex, idx) => {
      const setsCount = UI.parseSetsCount(ex.sets);
      const setData = (currentTracking.setData && currentTracking.setData[idx]) || {};
      
      // Auto-evaluate exercise completion from set status:
      if (setsCount > 0) {
        let allDone = true;
        for (let s = 0; s < setsCount; s++) {
          if (!setData[`set_${s}_done`]) {
            allDone = false;
            break;
          }
        }
        if (!currentTracking.exerciseStatus) currentTracking.exerciseStatus = {};
        if (allDone) {
          currentTracking.exerciseStatus[idx] = true;
        }
      }

      const isCompleted = currentTracking.exerciseStatus && currentTracking.exerciseStatus[idx];
      const isExUnlocked = isToday && isExerciseUnlocked(idx);
      const checkDisabledAttr = isExUnlocked ? '' : 'disabled style="opacity: 0.4; cursor: not-allowed;"';
      const exCheckContent = isExUnlocked ? '✓' : '🔒';
      const exCheckTitle = !isExUnlocked ? I18n.t('exercise_locked') : (setsCount > 1 && !isCompleted ? I18n.t('complete_sets_individually') : '');

      const cardId = `ex-card-${idx}`;
      const isExpanded = expandedIds.has(cardId) || (expandedIds.size === 0 && idx === defaultExpandedIdx);
      const color = UI.getCategoryColor(ex.slot);
      const reps = UI.parseReps(ex.sets);
      const exNote = (currentTracking.exerciseNotes && currentTracking.exerciseNotes[idx]) || '';

      // Check if exercise has weight data
      const hasWeight = isWeighted(ex);

      // Determine if this is a time-based exercise
      const isTime = ex.sets && (ex.sets.includes('mins') || ex.sets.includes('secs'));

      // Find previous tracking data for this exercise
      const prevPerf = findPrevPerformance(ex.name, currentDayIndex);

      let setsHTML = '';
      if (setsCount > 0) {
        // Previous performance summary
        let prevPerfHTML = '';
        if (prevPerf && prevPerf.setData) {
          const prevSets = [];
          let maxReps = 0;
          for (let ps = 0; ps < 10; ps++) {
            const pr = prevPerf.setData[`set_${ps}_reps`];
            if (pr) {
              prevSets.push(pr);
              if (parseInt(pr) > maxReps) maxReps = parseInt(pr);
            }
          }
          if (prevSets.length > 0) {
            prevPerfHTML = `
              <div class="prev-performance">
                <span class="prev-perf-label">${I18n.t('prev_performance')}</span>
                <span class="prev-perf-values">${prevSets.map((r, i) => `<span class="prev-set">Set ${i+1}: ${r}</span>`).join('')}</span>
                ${maxReps > 0 ? `<span class="prev-perf-pr">${I18n.t('prev_record')} ${maxReps}</span>` : ''}
              </div>
            `;
          }
        }

        setsHTML = prevPerfHTML + '<div class="set-tracker">';
        for (let s = 0; s < setsCount; s++) {
          const setDone = setData[`set_${s}_done`] || false;
          const setReps = setData[`set_${s}_reps`] || '';
          const setWeight = setData[`set_${s}_weight`] || '';

          const isSetRowUnlocked = isToday && isSetUnlocked(idx, s);
          const setDisabledAttr = isSetRowUnlocked ? '' : 'disabled style="opacity: 0.4; cursor: not-allowed;"';

          // Use previous performance as placeholder hint
          const prevReps = (prevPerf && prevPerf.setData && prevPerf.setData[`set_${s}_reps`]) || reps;
          const suggestedWeightNum = getSuggestedWeightForSet(ex, s, setsCount, prevPerf);

          // Dynamic unit label for time vs reps
          let unitLabel = 'reps';
          if (isTime) {
            if (ex.sets && ex.sets.includes('mins')) {
              unitLabel = 'mins';
            } else if (ex.sets && ex.sets.includes('secs')) {
              unitLabel = 'secs';
            } else {
              unitLabel = '';
            }
          }

          let placeholderText = prevReps;
          if (isTime && prevReps) {
            placeholderText = prevReps.toString().replace(/\s*(secs?|mins?|seconds?|minutes?)/gi, '').trim();
          }

          // Weight input - only show if exercise has weight data
          const weightInput = hasWeight ? `
            <div class="set-input-pill">
              <input type="number" class="set-input" placeholder="${suggestedWeightNum}" 
                     value="${setWeight}" ${setDisabledAttr}
                     data-ex="${idx}" data-set="${s}" data-field="weight"
                     onchange="TodayPage.updateSetData(${idx}, ${s}, 'weight', this.value)">
              <span class="set-unit">kg</span>
            </div>
          ` : '';

          const setResult = setData[`set_${s}_result`];
          let outcomeBadgeHTML = '';

          if (setResult === 'above') {
            outcomeBadgeHTML = `
              <button type="button" class="set-feedback-btn badge-above" 
                      onclick="TodayPage.openSetOutcomeModal(${idx}, ${s})" ${setDisabledAttr} title="${I18n.t('set_outcome_above')}">
                🚀
              </button>`;
          } else if (setResult === 'in_window') {
            outcomeBadgeHTML = `
              <button type="button" class="set-feedback-btn badge-in-window" 
                      onclick="TodayPage.openSetOutcomeModal(${idx}, ${s})" ${setDisabledAttr} title="${I18n.t('set_outcome_in_window')}">
                ✅
              </button>`;
          } else if (setResult === 'below') {
            outcomeBadgeHTML = `
              <button type="button" class="set-feedback-btn badge-below" 
                      onclick="TodayPage.openSetOutcomeModal(${idx}, ${s})" ${setDisabledAttr} title="${I18n.t('set_outcome_below')}">
                ⚠️
              </button>`;
          } else {
            outcomeBadgeHTML = `
              <button type="button" class="set-feedback-btn badge-pending" 
                      onclick="TodayPage.openSetOutcomeModal(${idx}, ${s})" ${setDisabledAttr} title="${I18n.t('how_was_it')}">
                ✓
              </button>`;
          }

          setsHTML += `
            <div class="set-row ${setDone ? 'done-row' : ''} ${!isSetRowUnlocked ? 'locked-set-row' : ''}">
              <span class="set-label">${s + 1}</span>
              <div class="set-inputs-group">
                ${weightInput}
                <div class="set-input-pill">
                  <input type="text" inputmode="numeric" pattern="[0-9]*" class="set-input" placeholder="${placeholderText}" 
                         value="${setReps}" ${setDisabledAttr} dir="ltr"
                         data-ex="${idx}" data-set="${s}" data-field="reps"
                         onchange="TodayPage.updateSetData(${idx}, ${s}, 'reps', this.value)">
                  ${unitLabel ? `<span class="set-unit">${unitLabel}</span>` : ''}
                </div>
              </div>
              ${outcomeBadgeHTML}
            </div>
          `;
        }
        setsHTML += '</div>';
      }

      const activeName = ex.currentStageName || ex.name;
      const gifPath = UI.getGifUrl(activeName);
      let videoBtn = '';
      if (!ex.name.toLowerCase().includes('walking')) {
        videoBtn = `<button type="button" class="exercise-video-btn" title="${I18n.t('view_gif_title')}" style="color: var(--danger);" onclick="UI.showImageModal('${activeName.replace(/'/g, "\\'")}', '${gifPath}', '${ex.name.replace(/'/g, "\\'")}'); event.stopPropagation();">▶</button>`;
      }

      // Find previous occurrence
      let prevEx = null;
      for (let i = currentDayIndex - 1; i >= 0; i--) {
        const pastDay = allPlanDays[i];
        if (pastDay && pastDay.exercises) {
          prevEx = pastDay.exercises.find(e => (e.id && ex.id && e.id === ex.id) || e.name === ex.name);
          if (prevEx) break;
        }
      }

      const isNewExercise = !prevEx && currentDayIndex > 0 && day.dayType !== 'Rest';
      const isSetsChanged = prevEx && ex.sets !== prevEx.sets;
      const isWeightChanged = prevEx && ex.weight !== prevEx.weight && isWeighted(ex);

      const newBadgeHTML = isNewExercise ? `<div class="new-exercise-badge" style="position: absolute; bottom: 12px; left: 12px; background: #ef4444; color: white; padding: 4px 12px; border-radius: 6px; font-weight: 800; font-size: 13px; animation: blinkRed 1.5s infinite; box-shadow: 0 0 12px rgba(239, 68, 68, 0.8); z-index: 10;">${I18n.t('new_exercise_badge')}</div>` : '';

      // Detail line - only show weight if it exists
      const detailParts = [UI.getCategoryLabel(ex.slot)];
      if (ex.sets) {
        detailParts.push(isSetsChanged ? `<span class="alert-pulse-text" title="${I18n.t('sets_changed_title')}">${ex.sets}</span>` : ex.sets);
      }
      
      const equip = UI.getEquipment(ex.name);
      
      if (hasWeight) {
        const weightInfo = parseWeightDetails(ex.weight, ex.name);
        const weightHTML = buildWeightBadgeHTML(weightInfo, true);
        detailParts.push(isWeightChanged ? `<span class="alert-pulse-text" title="${I18n.t('weight_changed_title')}">${weightHTML}</span>` : weightHTML);
      }

      if (ex.tempo) {
        const formattedTempo = UI.formatTempo(ex.tempo);
        detailParts.push(`<span style="color: var(--accent-primary); font-weight: 600; background: rgba(59, 130, 246, 0.12); padding: 2px 8px; border-radius: 6px; border: 1px solid rgba(59, 130, 246, 0.25); display: inline-flex; align-items: center; gap: 4px;" title="${I18n.t('tempo_execution')}">⏱️ ${formattedTempo}</span>`);
      }

      if (ex.rest && ex.rest > 0) {
        detailParts.push(`<span style="color: var(--text-muted);">💤 ${ex.rest}s</span>`);
      }

      let cardioTimerBtn = '';
      const lowerExName = ex.name.toLowerCase();
      if (lowerExName.includes('vo2 max') || lowerExName.includes('norwegian')) {
        cardioTimerBtn = `<button type="button" class="btn-primary" style="padding: 4px 10px; font-size: 12px; margin-left: 6px;" onclick="event.stopPropagation(); TodayPage.startIntervalTimer('${ex.name.replace(/'/g, "\\'")}');">⏱️ ${I18n.t('timer_4x4')}</button>`;
      }

      return `
        <div class="exercise-card ${isCompleted ? 'completed' : ''} ${!isExUnlocked ? 'locked' : ''} ${isExpanded ? 'expanded' : ''} ${isNewExercise ? 'alert-pulse-card' : ''}" id="${cardId}" style="--glow-color: ${color};">
          <div class="exercise-hero-container skeleton-loading" style="position: relative;">
            <div class="skeleton-placeholder" style="gap: 4px;">
              <div class="skeleton-spinner" style="width: 22px; height: 22px; border-width: 2px;"></div>
            </div>
            <div style="position: absolute; top: 12px; right: 12px; background: rgba(0,0,0,0.6); backdrop-filter: blur(4px); -webkit-backdrop-filter: blur(4px); color: white; padding: 4px 10px; border-radius: 8px; font-size: 14px; font-weight: 800; font-family: 'Inter', sans-serif; box-shadow: 0 2px 8px rgba(0,0,0,0.2); z-index: 10; border: 1px solid rgba(255,255,255,0.1);">
              #${idx + 1}
            </div>
            <img src="${UI.getImageUrl(activeName)}" 
                 class="exercise-hero-image skeleton-img"
                 data-fallback-exname="${ex.name.replace(/"/g, '&quot;')}"
                 loading="eager" decoding="async"
                 alt="${activeName}" 
                 onload="UI.handleImageLoaded(this)"
                 onerror="UI.handleImageFallback(this, 'png')"
                 onclick="TodayPage.handleImageClick(event, ${idx}, '${activeName.replace(/'/g, "\\'")}', '${ex.name.replace(/'/g, "\\'")}')">
            ${newBadgeHTML}
          </div>
          <div class="exercise-card-header" onclick="TodayPage.toggleExpand(${idx})">
            <div class="exercise-card-info">
              <div class="exercise-category-dot" style="background: ${color}"></div>
              <div>
                <div class="exercise-card-name" style="display: flex; align-items: center; flex-wrap: wrap; gap: 8px;">
                  ${ex.name}
                  ${ex.currentStageName ? `<span style="background: rgba(59, 130, 246, 0.15); border: 1px solid rgba(59, 130, 246, 0.35); color: var(--accent-primary); padding: 2px 8px; border-radius: 6px; font-size: 11px; font-weight: 700; display: inline-flex; align-items: center; gap: 4px;" title="${I18n.t('progression_stage_title') || 'שלב התקדמות'}">🎯 ${ex.currentStageName}</span>` : ''}
                  <button type="button" class="form-rule-info-btn" onclick="event.stopPropagation(); TodayPage.showFormRuleModal('${ex.name.replace(/'/g, "\\'")}')" style="background: rgba(59, 130, 246, 0.12); border: 1px solid rgba(59, 130, 246, 0.3); color: var(--accent-primary); border-radius: 50%; width: 22px; height: 22px; font-size: 12px; font-weight: bold; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; margin-left: 2px;" title="${I18n.t('form_rules_title') || 'חוקי טכניקה'}">ℹ️</button>
                  ${ex.isWarmup ? `<span style="background: linear-gradient(135deg, #f59e0b22, #f9731622); border: 1px solid #f59e0b44; padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: 600; color: #f59e0b; display: inline-flex; align-items: center; gap: 4px;">🔥 Warmup</span>` : ''}
                  ${!isExUnlocked ? `<span class="locked-badge">🔒 ${I18n.t('exercise_locked')}</span>` : ''}
                  ${equip ? `<span style="background: var(--bg-hover, rgba(255,255,255,0.05)); border: 1px solid var(--border-color); padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: normal; color: var(--text-secondary); display: inline-flex; align-items: center; gap: 4px;">${equip.icon} ${equip.label}</span>` : ''}
                </div>
                ${getLeanBadgesHTML(ex, day.week ? parseInt(day.week.replace(/\D/g, '')) || 1 : 1)}
                <div class="exercise-card-detail">
                  ${detailParts.join(' • ')}
                </div>
              </div>
            </div>
            <div class="exercise-card-actions">
              ${cardioTimerBtn}
              ${videoBtn}
              <button class="exercise-check ${isCompleted ? 'checked' : ''} ${!isExUnlocked ? 'locked-btn' : ''}" 
                      onclick="event.stopPropagation(); TodayPage.toggleExercise(${idx}, this)" ${checkDisabledAttr} title="${exCheckTitle}">${exCheckContent}</button>
            </div>
          </div>
          <div class="exercise-card-body">
            ${setsHTML}
            <div class="exercise-note">
              <textarea placeholder="${I18n.t('exercise_notes_placeholder')}" rows="2" ${checkDisabledAttr}
                        onchange="TodayPage.updateExerciseNote(${idx}, this.value)">${exNote}</textarea>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  /**
   * Toggle exercise card expand
   */
  function toggleExpand(idx) {
    const card = document.getElementById(`ex-card-${idx}`);
    const isExpanding = !card.classList.contains('expanded');
    
    // First, close all other cards and remove focus
    document.querySelectorAll('.exercise-card').forEach(c => {
      c.classList.remove('expanded');
      c.classList.remove('focused');
    });
    
    const listContainer = document.getElementById('exercises-list');

    if (isExpanding) {
      card.classList.add('expanded');
      card.classList.add('focused');
      listContainer.classList.add('has-focus');
      
      // Small delay before scrolling to allow expansion animation to start
      setTimeout(() => {
        card.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 50);
    } else {
      listContainer.classList.remove('has-focus');
    }
  }

  /**
   * Handle image click: expand accordion if closed, show GIF modal if already expanded
   */
  function handleImageClick(event, idx, exName, fallbackName) {
    event.stopPropagation();
    const card = document.getElementById(`ex-card-${idx}`);
    
    if (card && !card.classList.contains('expanded')) {
      // Accordion is closed - expand it (don't show GIF)
      toggleExpand(idx);
    } else {
      // Accordion is already open - show GIF modal
      UI.showImageModal(exName, '', fallbackName);
    }
  }

  function checkIsTodayOrWarn() {
    if (currentDayIndex < 0 || !allPlanDays || !allPlanDays[currentDayIndex]) return false;
    const realTodayIndex = UI.findTodayIndex(allPlanDays);
    if (currentDayIndex !== realTodayIndex) {
      if (window.UI && window.UI.toast) {
        UI.toast(I18n.t('not_today_warning'), 'warning');
      }
      return false;
    }
    return true;
  }

  function isExerciseUnlocked(exIdx) {
    if (exIdx <= 0) return true;
    if (!currentTracking.exerciseStatus) return false;
    for (let i = 0; i < exIdx; i++) {
      if (!currentTracking.exerciseStatus[i]) {
        return false;
      }
    }
    return true;
  }

  function checkExerciseUnlockedOrWarn(exIdx) {
    if (!checkIsTodayOrWarn()) return false;
    if (exIdx <= 0) return true;
    if (!currentTracking.exerciseStatus) currentTracking.exerciseStatus = {};
    const day = allPlanDays[currentDayIndex];
    for (let i = 0; i < exIdx; i++) {
      if (!currentTracking.exerciseStatus[i]) {
        const prevExName = (day && day.exercises && day.exercises[i]) ? day.exercises[i].name : `Exercise #${i + 1}`;
        if (window.UI && window.UI.toast) {
          UI.toast(I18n.t('must_complete_prev_exercise', '', { num: i + 1, name: prevExName }), 'warning');
        }
        return false;
      }
    }
    return true;
  }

  function isSetUnlocked(exIdx, setIdx) {
    if (!isExerciseUnlocked(exIdx)) return false;
    if (setIdx <= 0) return true;
    const setData = (currentTracking.setData && currentTracking.setData[exIdx]) || {};
    for (let s = 0; s < setIdx; s++) {
      if (!setData[`set_${s}_done`]) {
        return false;
      }
    }
    return true;
  }

  function checkSetUnlockedOrWarn(exIdx, setIdx) {
    if (!checkExerciseUnlockedOrWarn(exIdx)) return false;
    if (setIdx <= 0) return true;
    const setData = (currentTracking.setData && currentTracking.setData[exIdx]) || {};
    for (let s = 0; s < setIdx; s++) {
      if (!setData[`set_${s}_done`]) {
        if (window.UI && window.UI.toast) {
          UI.toast(I18n.t('must_complete_prev_set', '', { num: s + 1 }), 'warning');
        }
        return false;
      }
    }
    return true;
  }

  /**
   * Toggle exercise completion
   */
  async function toggleExercise(idx, btn) {
    if (!checkExerciseUnlockedOrWarn(idx)) return;
    
    const day = allPlanDays[currentDayIndex];
    const ex = (day && day.exercises) ? day.exercises[idx] : null;
    const setsCount = ex ? UI.parseSetsCount(ex.sets) : 0;

    if (!currentTracking.exerciseStatus) currentTracking.exerciseStatus = {};
    const isNowCompleted = !currentTracking.exerciseStatus[idx];

    if (setsCount > 1) {
      if (window.UI && window.UI.toast) {
        UI.toast(I18n.t('complete_sets_individually'), 'warning');
      }
      return;
    }

    if (isNowCompleted) {
      openExerciseOutcomeModal(idx);
    } else {
      currentTracking.exerciseStatus[idx] = false;
      if (btn) btn.classList.remove('checked');
      const card = document.getElementById(`ex-card-${idx}`);
      if (card) card.classList.remove('completed');

      updateProgress(day);
      await autoSave();
      renderExercises(day);
    }
  }

  function buildModalTargetBannerHTML(ex, exIdx) {
    if (!ex) return '';
    const setData = (currentTracking.setData && currentTracking.setData[exIdx]) || {};
    const weightInfo = parseWeightDetails(ex, setData);
    const weightBadge = weightInfo && weightInfo.suggestedWeightNum > 0 ? `<span style="color: #f59e0b; font-weight: 700; margin-inline-start: 4px;">• ${weightInfo.suggestedWeightNum} kg</span>` : '';
    const repTarget = UI.parseReps(ex.sets || '');
    
    return `
      <div style="background: rgba(59, 130, 246, 0.1); border: 1px solid rgba(59, 130, 246, 0.25); border-radius: 12px; padding: 10px 14px; margin: 10px 0 16px 0; display: flex; align-items: center; justify-content: center; gap: 8px; flex-wrap: wrap;">
        <span style="font-size: 13px; color: var(--text-secondary); font-weight: 600;">${I18n.t('planned_target')}</span>
        <span style="font-size: 15px; color: var(--accent-primary); font-weight: 800;" dir="ltr">${repTarget}</span>
        ${weightBadge}
      </div>
    `;
  }

  function isNoModalExercise(ex) {
    if (!ex) return false;
    if (ex.isWarmup || ex.rest === 0) return true;
    if (ex.slot && ex.slot.startsWith('W')) return true;
    const name = (ex.name || '').toLowerCase();
    if (name.includes('walking') || name.includes('deep mobility')) return true;
    return false;
  }

  function openExerciseOutcomeModal(exIdx) {
    if (!checkExerciseUnlockedOrWarn(exIdx)) return;
    const day = allPlanDays[currentDayIndex];
    if (!day || !day.exercises) return;
    const ex = day.exercises[exIdx];
    if (!ex) return;

    if (isNoModalExercise(ex)) {
      confirmExerciseOutcome(exIdx, 'in_window');
      return;
    }

    const title = `⚡ ${I18n.t('exercise_outcome_modal_title', '', { name: ex.name })}`;
    
    const modalHTML = `
      <div style="text-align: center; padding: 4px 0;">
        <div style="font-size: 16px; font-weight: 800; color: var(--accent-primary); margin-bottom: 4px;">
          ${ex.name}
        </div>
        ${buildModalTargetBannerHTML(ex, exIdx)}
        <p style="color: var(--text-secondary); font-size: 13px; margin-bottom: 18px;">
          ${I18n.t('set_outcome_prompt')}
        </p>

        <div style="display: flex; flex-direction: column; gap: 12px; margin-bottom: 18px;">
          <!-- Option 1 (PRIMARY HERO): Target Achieved / In Window -->
          <button type="button" class="set-modal-option-btn option-in-window hero-primary-option"
                  onclick="TodayPage.confirmExerciseOutcome(${exIdx}, 'in_window')">
            <div class="option-icon">✅</div>
            <div class="option-content">
              <div class="option-title">${I18n.t('set_outcome_in_window')}</div>
              <div class="option-desc">${I18n.t('set_outcome_in_window_desc')}</div>
            </div>
          </button>

          <!-- Option 2: Above Target -->
          <button type="button" class="set-modal-option-btn option-above"
                  onclick="TodayPage.confirmExerciseOutcome(${exIdx}, 'above')">
            <div class="option-icon">🚀</div>
            <div class="option-content">
              <div class="option-title">${I18n.t('set_outcome_above')}</div>
              <div class="option-desc">${I18n.t('set_outcome_above_desc')}</div>
            </div>
          </button>

          <!-- Option 3: Below Target / Mechanical Stop -->
          <button type="button" class="set-modal-option-btn option-below"
                  onclick="TodayPage.confirmExerciseOutcome(${exIdx}, 'below')">
            <div class="option-icon">⚠️</div>
            <div class="option-content">
              <div class="option-title">${I18n.t('set_outcome_below')}</div>
              <div class="option-desc">${I18n.t('set_outcome_below_desc')}</div>
            </div>
          </button>
        </div>
      </div>
    `;

    UI.showModal(title, modalHTML);
  }

  async function confirmExerciseOutcome(exIdx, outcome) {
    UI.hideModal();
    if (!checkExerciseUnlockedOrWarn(exIdx)) return;
    const day = allPlanDays[currentDayIndex];
    if (!day || !day.exercises) return;
    const ex = day.exercises[exIdx];
    if (!ex) return;

    if (!currentTracking.setData) currentTracking.setData = {};
    if (!currentTracking.setData[exIdx]) currentTracking.setData[exIdx] = {};
    const exData = currentTracking.setData[exIdx];

    const setsCount = UI.parseSetsCount(ex.sets);
    for (let s = 0; s < setsCount; s++) {
      exData[`set_${s}_result`] = outcome;
      exData[`set_${s}_done`] = true;
    }

    if (!currentTracking.exerciseStatus) currentTracking.exerciseStatus = {};
    currentTracking.exerciseStatus[exIdx] = true;

    if (navigator.vibrate) navigator.vibrate(50);

    updateProgress(day);

    const total = day.exercises.length;
    let completed = 0;
    day.exercises.forEach((_, i) => {
      if (currentTracking.exerciseStatus[i]) completed++;
    });
    currentTracking.completed = completed === total;

    await autoSave();

    renderExercises(day);

    if (window.Effects3D) {
      window.Effects3D.triggerExerciseEffect(ex.name);
    }

    await handleExerciseCompleted(exIdx, day);
    if (currentTracking.completed) {
      showWorkoutCelebration(day);
    }
  }



  /**
   * Show celebration modal when workout is fully completed
   */
  async function showWorkoutCelebration(day) {
    if (window.UI && window.UI.stopTimer) {
      window.UI.stopTimer();
    }
    // Count total sets done
    let totalSets = 0;
    let totalReps = 0;
    if (currentTracking.setData) {
      Object.values(currentTracking.setData).forEach(exSets => {
        if (typeof exSets === 'object') {
          Object.entries(exSets).forEach(([key, val]) => {
            if (key.endsWith('_done') && val) totalSets++;
            if (key.endsWith('_reps') && val) totalReps += parseInt(val) || 0;
          });
        }
      });
    }

    const typeInfo = UI.getDayTypeInfo(day.dayType);

    // Check backup status for reminder
    const lastBackupStr = await DB.getSetting('lastBackupDate');
    let needsBackupPrompt = false;
    let backupMessage = "";
    
    if (!lastBackupStr) {
      const allTracking = await DB.getAllTracking();
      const completedWorkouts = allTracking.filter(t => t.completed).length;
      if (completedWorkouts >= 3) {
        needsBackupPrompt = true;
        backupMessage = I18n.t('backup_first_time');
      }
    } else {
      const lastBackupDate = new Date(lastBackupStr);
      const now = new Date();
      const diffTime = Math.abs(now - lastBackupDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays >= 14) {
        needsBackupPrompt = true;
        backupMessage = I18n.t('backup_overdue', '', { days: diffDays });
      }
    }
    
    UI.showModal(I18n.t('celebration_title'), `
      <div style="text-align: center; padding: 16px;">
        <div class="celebration-confetti">🎊</div>
        <div style="font-size: 64px; margin-bottom: 16px; animation: bounceIn 0.6s ease;">💪</div>
        <h3 style="font-size: 22px; margin-bottom: 8px; color: var(--text-primary);">${I18n.t('celebration_subtitle')}</h3>
        <p style="color: var(--text-secondary); margin-bottom: 20px;">${typeInfo.label} — Day #${day.dayNum}</p>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 24px;">
          <div style="background: var(--bg-elevated); padding: 16px; border-radius: 12px;">
            <div style="font-size: 28px; font-weight: 800; color: var(--success);">${day.exercises.length}</div>
            <div style="font-size: 12px; color: var(--text-secondary);">${I18n.t('celebration_exercises')}</div>
          </div>
          <div style="background: var(--bg-elevated); padding: 16px; border-radius: 12px;">
            <div style="font-size: 28px; font-weight: 800; color: var(--accent-primary);">${totalSets}</div>
            <div style="font-size: 12px; color: var(--text-secondary);">${I18n.t('celebration_sets')}</div>
          </div>
          ${totalReps > 0 ? `
          <div style="background: var(--bg-elevated); padding: 16px; border-radius: 12px; grid-column: 1 / -1;">
            <div style="font-size: 28px; font-weight: 800; color: var(--warning);">${totalReps}</div>
            <div style="font-size: 12px; color: var(--text-secondary);">${I18n.t('celebration_reps_total')}</div>
          </div>` : ''}
        </div>
        
        ${needsBackupPrompt ? `
        <div style="margin-top: 16px; padding: 16px; border-radius: 12px; background: rgba(245, 158, 11, 0.1); border: 1px solid rgba(245, 158, 11, 0.2); margin-bottom: 16px;">
          <p style="font-size: 13px; color: var(--text-secondary); margin-bottom: 8px; direction: rtl; text-align: center;">⚠️ ${backupMessage}</p>
          <button id="celebration-backup-btn" class="btn-secondary" style="width: 100%; padding: 10px; font-size: 13px; display: flex; align-items: center; justify-content: center; gap: 6px;">
            ${I18n.t('celebration_backup')}
          </button>
        </div>` : ''}

        <button id="celebration-continue-btn" class="btn-primary" style="width: 100%; padding: 14px;">
          ${I18n.t('celebration_continue')}
        </button>
      </div>
    `);

    document.getElementById('celebration-continue-btn').onclick = async () => {
      UI.hideModal();
      
      if (typeof App !== 'undefined' && App.recalculatePlanIndex) {
        await App.recalculatePlanIndex();
      }
      
      const activeIdx = UI.findTodayIndex(allPlanDays);
      if (currentDayIndex !== activeIdx) {
        goToDay(activeIdx);
      } else {
        render();
      }
    };

    if (needsBackupPrompt) {
      const backupBtn = document.getElementById('celebration-backup-btn');
      if (backupBtn) {
        backupBtn.onclick = async () => {
          if (typeof App !== 'undefined' && App.shareBackup) {
            const success = await App.shareBackup();
            if (success) {
              backupBtn.parentElement.style.display = 'none';
            }
          }
        };
      }
    }

    // Haptic & 3D celebration
    if (window.Effects3D) {
      window.Effects3D.triggerWorkoutEffect();
    } else if (navigator.vibrate) {
      navigator.vibrate([100, 50, 100, 50, 200]);
    }
  }

  function getRestTime(ex) {
    if (!ex || !ex.name) return 90;
    
    const lowerName = ex.name.toLowerCase();
    if (lowerName.includes('walking') || lowerName.includes('jogging') || lowerName.includes('dorsiflexion')) {
      return 0;
    }
    if (ex.rest === 0) return 0;

    if (window.ProgressionEngine && window.ProgressionEngine.calculateAdaptiveRest && !ex.isWarmup) {
      const rpe = (currentTracking && currentTracking.actualRPE) || 7;
      return window.ProgressionEngine.calculateAdaptiveRest(
        ex.name,
        ex.rest || 90,
        UI.parseReps(ex.sets),
        UI.parseReps(ex.sets),
        0,
        rpe
      );
    }
    return ex.rest !== undefined ? parseInt(ex.rest) : 90;
  }

  async function handleExerciseCompleted(idx, day) {
    const ex = day.exercises[idx];
    const weekNum = day.week ? parseInt(day.week.replace(/\D/g, '')) || 1 : 1;
    const setData = (currentTracking.setData && currentTracking.setData[idx]) || {};
    const setsCount = UI.parseSetsCount(ex.sets);

    // Find next incomplete exercise (search forward from idx, then from start)
    let nextIdx = -1;
    for (let i = idx + 1; i < day.exercises.length; i++) {
      if (!currentTracking.exerciseStatus[i]) {
        nextIdx = i;
        break;
      }
    }
    if (nextIdx === -1) {
      for (let i = 0; i < idx; i++) {
        if (!currentTracking.exerciseStatus[i]) {
          nextIdx = i;
          break;
        }
      }
    }

    let restTime = getRestTime(day.exercises[idx]);
    
    // Apply intra-workout adaptive rest extension (+30s) if any set was BELOW
    let hasBelow = false;
    for (let s = 0; s < setsCount; s++) {
      if (setData[`set_${s}_result`] === 'below') { hasBelow = true; break; }
    }
    if (hasBelow) {
      restTime += 30;
      if (window.UI && window.UI.toast) {
        UI.toast(`${I18n.t('adaptive_rest_label')}: +30s (${restTime}s)`, 'warning');
      }
    }
    
    // Start rest timer IMMEDIATELY for zero delay on exercise completion (only if workout is not fully completed)
    if (!currentTracking.completed && restTime > 0 && window.UI && window.UI.startTimer) {
      UI.startTimer(restTime, null);
    }

    // Commit progression state via ProgressionEngine in background
    if (window.ProgressionEngine && window.ProgressionEngine.commitExerciseProgression) {
      let totalReps = 0;
      let lastWeight = 0;
      const setResults = [];

      for (let s = 0; s < setsCount; s++) {
        const setReps = parseInt(setData[`set_${s}_reps`]) || UI.parseReps(ex.sets);
        const setW = setData[`set_${s}_weight`] ? parseFloat(setData[`set_${s}_weight`]) : (ex.targetWeightKg || 0);
        totalReps += setReps;
        if (setW) lastWeight = setW;

        setResults.push({
          result: setData[`set_${s}_result`] || 'in_window',
          reps: setReps,
          weightKg: setW
        });
      }
      const avgReps = setsCount > 0 ? Math.round(totalReps / setsCount) : UI.parseReps(ex.sets);
      const isArmBlock = ex.name.toLowerCase().includes('arm block');

      await ProgressionEngine.commitExerciseProgression({
        exerciseId: ex.id || ex.name.toLowerCase().replace(/\s+/g, '-'),
        exerciseName: ex.name,
        dayIndex: currentDayIndex,
        weekNumber: weekNum,
        setResults: setResults,
        targetReps: UI.parseReps(ex.sets),
        actualReps: avgReps,
        weightKg: lastWeight,
        RPE: currentTracking.actualRPE || 7,
        tempoLossCount: hasBelow ? 2 : 0,
        isMyoSet: isArmBlock,
        isArmBlock: isArmBlock,
        muscleArea: ex.name.toLowerCase().includes('curl') ? 'Biceps' : 'Triceps',
        targetRest: ex.rest || 90
      });

      // Re-enrich and re-render day to immediately reflect updated progression states
      await enrichDayWithProgression(day);
      renderExercises(day);
    }
  }

  /**
   * Select Set Outcome (ABOVE, IN_WINDOW, BELOW) for Zero Decisions progression engine
   */
  async function selectSetOutcome(exIdx, setIdx, outcome, triggerEl = null) {
    if (!checkSetUnlockedOrWarn(exIdx, setIdx)) return;

    if (!currentTracking.setData) currentTracking.setData = {};
    if (!currentTracking.setData[exIdx]) currentTracking.setData[exIdx] = {};

    const exData = currentTracking.setData[exIdx];
    exData[`set_${setIdx}_result`] = outcome;
    exData[`set_${setIdx}_done`] = true;

    // Trigger 3D Visual Particle & Synthesizer Audio Effect for Set Completion
    if (window.Effects3D) {
      window.Effects3D.triggerSetEffect(triggerEl, outcome);
    }

    const day = allPlanDays[currentDayIndex];
    const ex = day.exercises[exIdx];
    const setsCount = UI.parseSetsCount(ex.sets);
    let allSetsDone = true;
    for (let s = 0; s < setsCount; s++) {
      if (!exData[`set_${s}_done`]) {
        allSetsDone = false;
        break;
      }
    }

    if (!currentTracking.exerciseStatus) currentTracking.exerciseStatus = {};
    currentTracking.exerciseStatus[exIdx] = allSetsDone;

    // Update day completion status (check if ALL exercises are done)
    const total = day.exercises.length;
    let completedCount = 0;
    day.exercises.forEach((_, i) => {
      if (currentTracking.exerciseStatus[i]) completedCount++;
    });
    currentTracking.completed = completedCount === total;

    updateProgress(day);
    await autoSave();
    renderExercises(day);

    if (allSetsDone) {
      // Trigger 3D Stage & Fanfare Effect for Exercise Completion
      if (window.Effects3D) {
        window.Effects3D.triggerExerciseEffect(ex.name);
      }
      handleExerciseCompleted(exIdx, day);
      if (currentTracking.completed) {
        showWorkoutCelebration(day);
      }
    } else if (exData[`set_${setIdx}_done`]) {
      // Individual set completed (not all sets yet) — start intra-workout rest timer
      let restTime = getRestTime(ex);
      if (outcome === 'below') {
        restTime += 30; // Intra-workout rest extension for BELOW outcome
        if (window.UI && window.UI.toast) {
          UI.toast(`${I18n.t('adaptive_rest_label')}: +30s (${restTime}s)`, 'warning');
        }
      }
      if (!currentTracking.completed && restTime > 0 && window.UI && window.UI.startTimer) {
        UI.startTimer(restTime, null);
      }
    }
  }

  /**
   * Open Set Outcome Modal ("How was Set #X?")
   */
  function openSetOutcomeModal(exIdx, setIdx) {
    if (!checkSetUnlockedOrWarn(exIdx, setIdx)) return;

    const day = allPlanDays[currentDayIndex];
    const ex = day.exercises[exIdx];

    if (isNoModalExercise(ex)) {
      const setData = (currentTracking.setData && currentTracking.setData[exIdx]) || {};
      const isAlreadyDone = setData[`set_${setIdx}_done`];
      if (isAlreadyDone) {
        clearSetOutcomeFromModal(exIdx, setIdx, false);
      } else {
        selectSetOutcome(exIdx, setIdx, 'in_window');
      }
      return;
    }

    const setData = (currentTracking.setData && currentTracking.setData[exIdx]) || {};
    const currentResult = setData[`set_${setIdx}_result`];
    const isAlreadyDone = setData[`set_${setIdx}_done`];

    const title = `⚡ ${I18n.t('set_outcome_modal_title', '', { set: setIdx + 1 })}`;
    
    let modalHTML = '';

    if (isAlreadyDone || currentResult) {
      // IF ALREADY MARKED: Show ONLY the Reset button!
      let currentResultText = I18n.t('how_was_it');
      let badgeClass = 'badge-in-window';
      if (currentResult === 'above') {
        currentResultText = I18n.t('set_outcome_above');
        badgeClass = 'badge-above';
      } else if (currentResult === 'in_window') {
        currentResultText = I18n.t('set_outcome_in_window');
        badgeClass = 'badge-in-window';
      } else if (currentResult === 'below') {
        currentResultText = I18n.t('set_outcome_below');
        badgeClass = 'badge-below';
      }

      modalHTML = `
        <div style="text-align: center; padding: 12px 0;">
          <div style="font-size: 15px; font-weight: 800; color: var(--accent-primary); margin-bottom: 6px;">
            ${ex.name}
          </div>
          <div style="font-size: 13px; color: var(--text-secondary); margin-bottom: 16px; display: flex; align-items: center; justify-content: center; gap: 8px;">
            <span>${I18n.t('set_label', 'סט')} ${setIdx + 1}</span> • <span class="set-feedback-btn ${badgeClass}" style="display: inline-flex; pointer-events: none; width: auto; padding: 4px 12px;">${currentResultText}</span>
          </div>

          <p style="color: var(--text-secondary); font-size: 13px; margin-bottom: 20px;">
            ${I18n.t('set_already_completed_prompt')}
          </p>

          <button type="button" class="btn-secondary hero-reset-option" 
                  style="width: 100%; padding: 14px; font-size: 15px; font-weight: 700; color: var(--danger, #ef4444); border: 2px dashed rgba(239, 68, 68, 0.4); background: rgba(239, 68, 68, 0.08); border-radius: 14px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px;"
                  onclick="TodayPage.clearSetOutcomeFromModal(${exIdx}, ${setIdx}, true)">
            🔄 ${I18n.t('clear_set_status')}
          </button>
        </div>
      `;
    } else {
      // IF NOT MARKED (OR POST-RESET): Show the 3 outcome choices!
      modalHTML = `
        <div style="text-align: center; padding: 4px 0;">
          <div style="font-size: 15px; font-weight: 800; color: var(--accent-primary); margin-bottom: 4px;">
            ${ex.name}
          </div>
          ${buildModalTargetBannerHTML(ex, exIdx)}
          <p style="color: var(--text-secondary); font-size: 13px; margin-bottom: 18px;">
            ${I18n.t('set_outcome_prompt')}
          </p>

          <div style="display: flex; flex-direction: column; gap: 12px; margin-bottom: 18px;">
            <!-- Option 1: In Window -->
            <button type="button" class="set-modal-option-btn option-in-window hero-primary-option"
                    onclick="TodayPage.selectSetOutcomeFromModal(${exIdx}, ${setIdx}, 'in_window')">
              <div class="option-icon">✅</div>
              <div class="option-content">
                <div class="option-title">${I18n.t('set_outcome_in_window')}</div>
                <div class="option-desc">${I18n.t('set_outcome_in_window_desc')}</div>
              </div>
            </button>

            <!-- Option 2: Above Target -->
            <button type="button" class="set-modal-option-btn option-above"
                    onclick="TodayPage.selectSetOutcomeFromModal(${exIdx}, ${setIdx}, 'above')">
              <div class="option-icon">🚀</div>
              <div class="option-content">
                <div class="option-title">${I18n.t('set_outcome_above')}</div>
                <div class="option-desc">${I18n.t('set_outcome_above_desc')}</div>
              </div>
            </button>

            <!-- Option 3: Below Target / Mechanical Stop -->
            <button type="button" class="set-modal-option-btn option-below"
                    onclick="TodayPage.selectSetOutcomeFromModal(${exIdx}, ${setIdx}, 'below')">
              <div class="option-icon">⚠️</div>
              <div class="option-content">
                <div class="option-title">${I18n.t('set_outcome_below')}</div>
                <div class="option-desc">${I18n.t('set_outcome_below_desc')}</div>
              </div>
            </button>
          </div>
        </div>
      `;
    }

    UI.showModal(title, modalHTML);
  }

  async function selectSetOutcomeFromModal(exIdx, setIdx, outcome) {
    UI.hideModal();
    await selectSetOutcome(exIdx, setIdx, outcome);
  }

  async function clearSetOutcomeFromModal(exIdx, setIdx, reopenModal = false) {
    UI.hideModal();
    if (!checkExerciseUnlockedOrWarn(exIdx)) return;
    if (currentTracking.setData && currentTracking.setData[exIdx]) {
      const day = allPlanDays[currentDayIndex];
      const ex = day ? day.exercises[exIdx] : null;
      const setsCount = ex ? UI.parseSetsCount(ex.sets) : 10;
      
      // Cascading reset: clear current set and all subsequent sets for this exercise
      for (let s = setIdx; s < setsCount; s++) {
        delete currentTracking.setData[exIdx][`set_${s}_result`];
        delete currentTracking.setData[exIdx][`set_${s}_done`];
      }
      
      if (!currentTracking.exerciseStatus) currentTracking.exerciseStatus = {};
      currentTracking.exerciseStatus[exIdx] = false;
      currentTracking.completed = false;

      updateProgress(day);
      await autoSave();
      renderExercises(day);

      if (reopenModal) {
        setTimeout(() => {
          openSetOutcomeModal(exIdx, setIdx);
        }, 150);
      }
    }
  }

  /**
   * Toggle set completion
   */
  async function toggleSet(exIdx, setIdx, btn) {
    if (!checkSetUnlockedOrWarn(exIdx, setIdx)) return;

    if (!currentTracking.setData) currentTracking.setData = {};
    if (!currentTracking.setData[exIdx]) currentTracking.setData[exIdx] = {};

    const key = `set_${setIdx}_done`;
    const isNowDone = !currentTracking.setData[exIdx][key];
    currentTracking.setData[exIdx][key] = isNowDone;
    
    // Auto-sync set outcome result if toggled
    if (isNowDone && !currentTracking.setData[exIdx][`set_${setIdx}_result`]) {
      currentTracking.setData[exIdx][`set_${setIdx}_result`] = 'in_window';
    } else if (!isNowDone) {
      // Cascading reset of subsequent sets if toggled off
      const day = allPlanDays[currentDayIndex];
      const ex = day ? day.exercises[exIdx] : null;
      const setsCount = ex ? UI.parseSetsCount(ex.sets) : 10;
      for (let s = setIdx; s < setsCount; s++) {
        delete currentTracking.setData[exIdx][`set_${s}_result`];
        delete currentTracking.setData[exIdx][`set_${s}_done`];
      }
    }

    if (isNowDone && window.Effects3D) {
      const outcome = currentTracking.setData[exIdx][`set_${setIdx}_result`] || 'in_window';
      window.Effects3D.triggerSetEffect(btn, outcome);
    }

    const day = allPlanDays[currentDayIndex];
    const ex = day.exercises[exIdx];
    const setsCount = UI.parseSetsCount(ex.sets);
    let allSetsDone = true;
    for (let s = 0; s < setsCount; s++) {
      if (!currentTracking.setData[exIdx][`set_${s}_done`]) {
        allSetsDone = false;
        break;
      }
    }

    if (!currentTracking.exerciseStatus) currentTracking.exerciseStatus = {};
    currentTracking.exerciseStatus[exIdx] = allSetsDone;

    updateProgress(day);

    const total = day.exercises.length;
    let completed = 0;
    day.exercises.forEach((_, i) => {
      if (currentTracking.exerciseStatus[i]) completed++;
    });
    currentTracking.completed = completed === total;
    
    await autoSave();
    renderExercises(day);

    if (allSetsDone) {
      if (window.Effects3D) {
        window.Effects3D.triggerExerciseEffect(ex.name);
      }
      await handleExerciseCompleted(exIdx, day);
      if (currentTracking.completed) {
        showWorkoutCelebration(day);
      }
    } else if (isNowDone) {
      const restTime = getRestTime(ex);
      if (!currentTracking.completed && restTime > 0 && window.UI && window.UI.startTimer) {
        UI.startTimer(restTime, null);
      }
    }
  }

  /**
   * Update set data
   */
  async function updateSetData(exIdx, setIdx, field, value) {
    if (!checkSetUnlockedOrWarn(exIdx, setIdx)) return;
    if (!currentTracking.setData) currentTracking.setData = {};
    if (!currentTracking.setData[exIdx]) currentTracking.setData[exIdx] = {};
    currentTracking.setData[exIdx][`set_${setIdx}_${field}`] = value;
    await autoSave();
  }

  /**
   * Update exercise note
   */
  async function updateExerciseNote(exIdx, value) {
    if (!checkExerciseUnlockedOrWarn(exIdx)) return;
    if (!currentTracking.exerciseNotes) currentTracking.exerciseNotes = {};
    currentTracking.exerciseNotes[exIdx] = value;
    await autoSave();
  }

  async function checkAndLockStartDate() {
    let startDate = await DB.getSetting('planStartDate');
    if (!startDate) {
      const d = new Date();
      d.setDate(d.getDate() - currentDayIndex);
      startDate = UI.getLocalDateString(d);
      await DB.setSetting('planStartDate', startDate);
      await DB.loadTrainingPlan();
      UI.toast(I18n.t('program_started'), 'success');
    }
  }

  async function toggleRestDayComplete() {
    if (!checkIsTodayOrWarn()) return;
    
    currentTracking.completed = !currentTracking.completed;
    currentTracking.lastUpdated = new Date().toISOString();
    currentTracking.date = currentTracking.date || UI.getLocalDateString();
    
    await autoSave();
    
    const day = allPlanDays[currentDayIndex];
    if (currentTracking.completed) {
      showWorkoutCelebration(day);
    } else {
      render();
    }
  }

  /**
   * Auto-save tracking data
   */
  async function autoSave() {
    await checkAndLockStartDate();
    
    const rpe = document.getElementById('actual-rpe').value;
    const weight = document.getElementById('body-weight').value;
    const notes = document.getElementById('day-notes').value;

    currentTracking.actualRPE = rpe ? parseFloat(rpe) : null;
    currentTracking.bodyWeight = weight ? parseFloat(weight) : null;
    currentTracking.notes = notes;
    currentTracking.lastUpdated = new Date().toISOString();
    currentTracking.date = currentTracking.date || UI.getLocalDateString();

    await DB.saveDayTracking(currentDayIndex, currentTracking);

    // --- Auto-complete passed Rest days ---
    await DB.syncRestDays(allPlanDays);

    // --- Update the active plan index based on sequential progress ---
    let newActiveIndex = 0;
    const allTracking = await DB.getAllTracking();
    const todayStr = UI.getLocalDateString();
    for (let i = 0; i < allPlanDays.length; i++) {
      const track = allTracking.find(t => t.dayIndex === i);
      if (!track || !track.completed) {
        newActiveIndex = i;
        break;
      }
      const isCompletedToday = track.completed && (
        track.date === todayStr ||
        (track.lastUpdated && track.lastUpdated.startsWith(todayStr))
      );
      if (isCompletedToday) {
        newActiveIndex = i;
        const nextTrack = allTracking.find(t => t.dayIndex === i + 1);
        const nextCompletedToday = nextTrack && nextTrack.completed && (
          nextTrack.date === todayStr ||
          (nextTrack.lastUpdated && nextTrack.lastUpdated.startsWith(todayStr))
        );
        if (!nextCompletedToday) {
          break;
        }
      }
    }
    
    if (newActiveIndex !== window.appCurrentPlanIndex) {
      window.appCurrentPlanIndex = newActiveIndex;
      await DB.setSetting('currentPlanIndex', newActiveIndex);
      if (typeof App !== 'undefined' && App.updatePlanDates) {
        await App.updatePlanDates(newActiveIndex);
      }
      
      // Re-render calendar so the correct today column is highlighted
      if (typeof CalendarPage !== 'undefined') {
        CalendarPage.render();
      }
    }

    // --- Schedule Background Cloud Sync ---
    if (typeof CloudSync !== 'undefined') {
      CloudSync.scheduleSync();
    }
  }


  /**
   * Skip current day and advance the plan
   */


  function showExerciseImage(name, src) {
    UI.showModal(name, `<img src="${src}" loading="eager" decoding="async" style="width:100%; border-radius:8px;">`);
  }

  async function showSwapModal() {
    const currentDay = allPlanDays[currentDayIndex];
    const currentTypeInfo = UI.getDayTypeInfo(currentDay.dayType);
    
    // Find all other days in the same week
    const weekDays = allPlanDays.filter(d => d.week === currentDay.week);
    
    const validSwapTargets = [];
    for (const day of weekDays) {
      if (day.dayIndex === currentDayIndex) continue;
      
      // Check if it's already completed
      const track = await DB.getDayTracking(day.dayIndex);
      if (track && track.completed) continue;
      
      validSwapTargets.push(day);
    }
    
    if (validSwapTargets.length === 0) {
      UI.toast(I18n.t('swap_no_days'), 'warning');
      return;
    }
    
    let html = `<p style="margin-bottom: 12px; font-size: 14px; color: var(--text-secondary); line-height: 1.4;">
      ${I18n.t('swap_instructions', '', { dayType: `<b style="color: var(--text-primary);">${currentTypeInfo.label}</b>` })}
    </p>`;
    
    html += `<div style="display: flex; flex-direction: column; gap: 10px; margin-bottom: 16px;">`;
    
    validSwapTargets.forEach(targetDay => {
      const typeInfo = UI.getDayTypeInfo(targetDay.dayType);
      html += `
        <button class="btn-secondary" style="justify-content: flex-start; padding: 12px; background: var(--bg-elevated); border: 1px solid var(--border-light);" onclick="TodayPage.performSwap(${targetDay.dayIndex})">
          <div style="display: flex; flex-direction: column; align-items: flex-start;">
            <span style="font-weight: bold; color: var(--text-primary); margin-bottom: 4px;">${targetDay.dayOfWeek} - ${typeInfo.label}</span>
            <span style="font-size: 11px; color: var(--text-secondary);">${I18n.t('swap_with')} ${typeInfo.label}</span>
          </div>
        </button>
      `;
    });
    html += `</div>`;
    
    html += `
      <div style="background: rgba(245, 158, 11, 0.05); border: 1px solid rgba(245, 158, 11, 0.3); border-radius: 8px; padding: 12px; display: flex; align-items: flex-start; gap: 10px;">
        <span style="font-size: 16px; margin-top: 1px;">💡</span>
        <div style="font-size: 12px; color: var(--text-primary); line-height: 1.4;">
          <strong style="color: var(--warning); display: block; margin-bottom: 4px;">${I18n.t('swap_recovery_tip_title')}</strong>
          ${I18n.t('swap_recovery_tip_desc')}
        </div>
      </div>
    `;
    
    UI.showModal(I18n.t('swap_modal_title'), html);
  }

  async function performSwap(targetDayIndex) {
    UI.closeModal();
    try {
      await DB.swapWorkouts(currentDayIndex, targetDayIndex);
      allPlanDays = await DB.getAllPlan();
      UI.toast(I18n.t('swap_success'), 'success');
      
      if (typeof CalendarPage !== 'undefined' && document.getElementById('calendar-accordion-content')?.style.display === 'block') {
        CalendarPage.render();
      }
      
      render();
    } catch (e) {
      console.error(e);
      UI.toast(I18n.t('swap_error'), 'danger');
    }
  }

  let intervalTimerId = null;

  function startIntervalTimer(exName) {
    let currentRound = 1;
    let isWorkPhase = true; // true = 4m Work, false = 3m Rest
    let secondsLeft = 4 * 60;
    let isPaused = true;

    function renderModalContent() {
      const mins = Math.floor(secondsLeft / 60).toString().padStart(2, '0');
      const secs = (secondsLeft % 60).toString().padStart(2, '0');
      const statusText = isWorkPhase ? `🔴 ${I18n.t('vo2_round')} ${currentRound}/4 — ${I18n.t('vo2_effort')}` : `🟢 ${I18n.t('vo2_rest_phase')}`;
      const statusClass = isWorkPhase ? 'interval-status-work' : 'interval-status-rest';

      return `
        <div class="interval-timer-container">
          <div class="interval-status-badge ${statusClass}">
            ${statusText}
          </div>
          <div class="interval-ring-wrapper">
            <div class="interval-timer-time" id="interval-display">${mins}:${secs}</div>
          </div>
          <p style="font-size: 13px; color: var(--text-secondary); text-align: center;">
            ${isWorkPhase ? I18n.t('vo2_work_desc') : I18n.t('vo2_rest_desc')}
          </p>
          <div style="display: flex; gap: 10px; width: 100%; margin-top: 10px;">
            <button id="interval-toggle-btn" class="btn-primary" style="flex: 1;">${isPaused ? `▶️ ${I18n.t('vo2_start')}` : `⏸️ ${I18n.t('vo2_pause')}`}</button>
            <button id="interval-skip-btn" class="btn-secondary" style="flex: 1;">⏭️ ${I18n.t('vo2_skip')}</button>
          </div>
        </div>
      `;
    }

    UI.showModal('🏃 VO2 Max Norwegian 4×4', renderModalContent());

    function bindEvents() {
      const toggleBtn = document.getElementById('interval-toggle-btn');
      const skipBtn = document.getElementById('interval-skip-btn');
      
      if (toggleBtn) {
        toggleBtn.onclick = () => {
          isPaused = !isPaused;
          toggleBtn.textContent = isPaused ? `▶️ ${I18n.t('vo2_start')}` : `⏸️ ${I18n.t('vo2_pause')}`;
        };
      }
      
      if (skipBtn) {
        skipBtn.onclick = () => {
          advancePhase();
        };
      }
    }

    function advancePhase() {
      if (isWorkPhase) {
        if (currentRound >= 4) {
          clearInterval(intervalTimerId);
          UI.toast(I18n.t('vo2_complete'), 'success', 5000);
          UI.hideModal();
          return;
        }
        isWorkPhase = false;
        secondsLeft = 3 * 60;
        UI.toast(`🟢 ${I18n.t('vo2_switching_rest')} (${I18n.t('vo2_round')} ${currentRound})`, 'info');
      } else {
        currentRound++;
        isWorkPhase = true;
        secondsLeft = 4 * 60;
        UI.toast(`🔴 ${I18n.t('vo2_round')} ${currentRound}/4 — ${I18n.t('vo2_effort')}`, 'warning');
      }
      document.getElementById('modal-body').innerHTML = renderModalContent();
      bindEvents();
    }

    if (intervalTimerId) clearInterval(intervalTimerId);

    intervalTimerId = setInterval(() => {
      if (!isPaused && secondsLeft > 0) {
        secondsLeft--;
        const display = document.getElementById('interval-display');
        if (display) {
          const mins = Math.floor(secondsLeft / 60).toString().padStart(2, '0');
          const secs = (secondsLeft % 60).toString().padStart(2, '0');
          display.textContent = `${mins}:${secs}`;
        }
      } else if (!isPaused && secondsLeft <= 0) {
        if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
        advancePhase();
      }
    }, 1000);

    bindEvents();
  }

  const EXERCISE_FORM_RULES = {
    'DB RDL': {
      rule: 'גב ניטרלי לגמרי לאורך כל התנועה, ציר ירך (Hip Hinge) הדוק ומתיחה מבוקרת בהמסטרינג.',
      belowTrigger: 'עגלת גב (Lumbopelvic flexion), כיפוף ברכיים מוגזם למצב סקואט, או חוסר מתיחה.'
    },
    'DB BULGARIAN SPLIT SQUAT': {
      rule: 'חזה זקוף, ירידה מבוקרת (2-3 שניות) עם ברך קדמית יציבה ומרכז כובד על קדמת כף הרגל.',
      belowTrigger: 'איבוד שיווי משקל חמור, קריסת ברך פנימה (Valgus), או עילוי עקב קדמי.'
    },
    'SINGLE-LEG RDL': {
      rule: 'אגן אופקי ומקביל לרצפה, רגל אחורית מתוחה קדימה/אחורה בקו ישר.',
      belowTrigger: 'סיבוב אגן צידי מופרז, איבוד יציבות מוחלט, או עגלת גב.'
    },
    'DB HIP THRUST': {
      rule: 'כיווץ מלא ונעילה של הגלוטאוס בשיא התנועה, מבט קדימה וסנטר אסוף (Posterior tilt).',
      belowTrigger: 'פשיטת יתר של הגב התחתון (Hyper-extension) או אי-הגעה לנעילה מלאה בשיא.'
    },
    'SUITCASE CARRY': {
      rule: 'עמידה והליכה זקופה לחלוטין ללא נטייה צידית, הליכה בקצב מדוד ורגוע.',
      belowTrigger: 'נטיית גוף צידית בולטת לעבר המשקולת או צעדים ממהרים ללא שליטה.'
    },
    'SINGLE-LEG CALF RAISE': {
      rule: 'ירידה מבוקרת (2 שניות), עצירה של 1 שניה בתחתית למניעת אלסטיות, כיווץ מלא בשיא.',
      belowTrigger: 'קפיצה/מומנטום בתחתית, או קיצור טווח העלייה על קצות האצבעות.'
    },
    'PALLOF PRESS': {
      rule: 'אגן וכתפיים נעולים קדימה ללא פיתול בעת הרחקת הידיים מהחזה.',
      belowTrigger: 'סיבוב גו, כיפוף מרפקים מוקדם, או סחף של הגומייה/כבל.'
    },
    'DEAD BUG': {
      rule: 'גב תחתון דחוס וצמוד לרצפה ללא רווח לאורך כל הסט, תנועה נגדית איטית.',
      belowTrigger: 'הקשתת גב תחתון וניתוק מהרצפה במהלך התנועה.'
    },
    'HOLLOW BODY HOLD': {
      rule: 'גב תחתון שטוח לחלוטין על הרצפה, שכמות מורמות, רגליים מתוחות לפנים.',
      belowTrigger: 'שבירת מנח הליבה והקשתת גב תחתון.'
    },
    'PIKE HOLD / PIKE PUSH-UP': {
      rule: 'זווית אגן גבוהה (Pike), ראש יורד קדימה ליצירת משולש בין הראש לידיים.',
      belowTrigger: 'נפילת מרפקים לצדדים או אובדן זווית האגן הגבוהה.'
    },
    'DB FLOOR PRESS': {
      rule: 'מרפקים ב-45 מעלות לגוף, עצירה קלה ורגועה של הזרוע על הרצפה בכל חזרה.',
      belowTrigger: 'הקפצת מרפקים מהרצפה או פתיחת מרפקים ל-90 מעלות (כתפיים).'
    },
    'PUSH-UP BARS PROGRESSION': {
      rule: 'גוף ישר כפלנק קשיח, מתיחה עמוקה בתחתית ונעילה מלאה למעלה.',
      belowTrigger: 'קריסת אגן כלפי מטה או קיצור טווח התנועה בתחתית.'
    },
    'SEATED DB OHP': {
      rule: 'גב נתמך בספסל/כיסא, מסלול לחיצה מעט קדימה (Scaption plane), נעילה בטוחה.',
      belowTrigger: 'הקשתת גב תחתון מוגזמת או זריקת משקל מוחלטת.'
    },
    'DB OH TRICEPS EXT': {
      rule: 'מרפקים מצביעים קדימה ונעולים במקום, פשיטה מלאה של זרוע אחורית למעלה.',
      belowTrigger: 'פתיחת מרפקים לצדדים או שימוש במומנטום של הגב.'
    },
    'DIAMOND PUSH-UP': {
      rule: 'אגודלים ואצבעות קרובות במרכז החזה, מרפקים צמודים לגוף בירידה.',
      belowTrigger: 'קריסת אגן או מרפקים נפתחים לצדדים.'
    },
    'TRX ROW': {
      rule: 'גוף ישר כחץ, משיכה לחזה התחתון תוך כיווץ חזק של השכמות בסוף התנועה.',
      belowTrigger: 'שבירת אגן (כיפוף ירך) או מומנטום של התנדנדות.'
    },
    'DB LATERAL RAISE': {
      rule: 'עצירה קצרה בשיא בגובה הכתף, הרמה דרך הכתף הצידית ללא הנפת גו.',
      belowTrigger: 'הנפת גב (Cheating) או הרמת המשקולת מעל גובה הכתפיים במומנטום.'
    },
    'TRX Y-T-W': {
      rule: 'זרועות כמעט ישרות, תנועה מבוקרת וטהורה מהכתף האחורית והשכמות.',
      belowTrigger: 'כיפוף מרפקים מוגזם במקום עבודת כתף אחורית.'
    },
    'BAND PULL-APART': {
      rule: 'מתיחת הגומייה עד לנגיעה קלה בחזה עם שכמות אסופות מאחור.',
      belowTrigger: 'שימוש בתנופת גב או כיפוף מרפקים.'
    },
    'PULL-UP PROGRESSION': {
      rule: 'סנטר עובר בבירור את המוט בעלייה, ירידה מלאה לנעילה (Dead hang).',
      belowTrigger: 'בעיטות רגליים (Kipping), או חצי טווח תנועה בירידה/בעלייה.'
    },
    'ONE-ARM DB ROW': {
      rule: 'משיכה לכיוון המותג/אגן, שכמה נמשכת לאחור, גב מקביל ומיוצב.',
      belowTrigger: 'סובב גו מוגזם (Torso rotation) או הנפת המשקולת עם מומנטום.'
    },
    'TRX FACE PULL': {
      rule: 'משיכה לכיוון המצח עם סיבוב חיצוני של הכתף (Hands high, elbows wide).',
      belowTrigger: 'משיכה לבטן/חזה במקום למצח, או שמיטת מרפקים.'
    },
    'DB CURL': {
      rule: 'מרפקים מצמודים לצדי הגוף, כיווץ מלא בשיא ללא תנועת כתף/גב.',
      belowTrigger: 'תנופה של הגב (Body swing) או הזזת מרפקים קדימה.'
    },
    'HAMMER CURL': {
      rule: 'אחיזה ניטרלית (אגודלים למעלה), עבודה אקסצנטרית איטית ומבוקרת בהורדה.',
      belowTrigger: 'זריקת המשקולת מומנטומטית.'
    },
    'TOWEL HANG': {
      rule: 'אחיזה חזקה במגבת, כתפיים אקטיביות (Scapular engagement) ללא צניחה.',
      belowTrigger: 'שמיטת אחיזה מוקדמת או הרפיית כתפיים סבילית.'
    },
    'L-SIT PROGRESSION': {
      rule: 'דחיפה חזקה של הרצפה/מקבילים כלפי מטה, ברכיים אסופות ואגן מורם.',
      belowTrigger: 'נגיעת עקבים/אגן ברצפה במהלך הזמן המתוכנן.'
    }
  };

  function showFormRuleModal(exName) {
    if (!exName) return;
    const cleanName = exName.trim().toUpperCase();
    const ruleObj = EXERCISE_FORM_RULES[cleanName] || EXERCISE_FORM_RULES[exName] || {
      rule: 'שמור על טכניקה נקייה, טווח תנועה מלא ושליטה בקצב (2 שניות בהורדה).',
      belowTrigger: 'איבוד טכניקה, אובדן קצב (Tempo Loss), או חוסר יכולת להשלים חזרה מלאה.'
    };

    const ruleKey = 'rule_' + (exName || '').toLowerCase().replace(/[^a-z0-9]/g, '_');
    const ruleText = (I18n.t(ruleKey) !== ruleKey) ? I18n.t(ruleKey) : (typeof ruleObj === 'string' ? ruleObj : ruleObj.rule);
    const belowTriggerText = typeof ruleObj === 'object' ? ruleObj.belowTrigger : 'איבוד טכניקה חמור או אובדן קצב (Tempo Loss > 2 שניות).';

    UI.showModal(`ℹ️ ${exName} — ${I18n.t('form_rules_title') || 'חוקי טכניקה'}`, `
      <div style="padding: 12px; display: flex; flex-direction: column; gap: 14px; text-align: start;">
        <div style="background: rgba(59, 130, 246, 0.1); border: 1px solid rgba(59, 130, 246, 0.3); border-radius: 12px; padding: 12px 14px;">
          <strong style="color: var(--accent-primary); display: flex; align-items: center; gap: 6px; font-size: 14px; margin-bottom: 6px;">
            🎯 ${I18n.t('form_rule_gold_standard') || 'תקן ביצוע זהב:'}
          </strong>
          <div style="font-size: 13px; color: var(--text-primary); line-height: 1.5;">${ruleText}</div>
        </div>

        <div style="background: rgba(245, 158, 11, 0.1); border: 1px solid rgba(245, 158, 11, 0.3); border-radius: 12px; padding: 12px 14px;">
          <strong style="color: var(--warning); display: flex; align-items: center; gap: 6px; font-size: 14px; margin-bottom: 6px;">
            ⚠️ ${I18n.t('form_rule_below_trigger') || 'קריטריון לסימון BELOW (⚠️):'}
          </strong>
          <div style="font-size: 13px; color: var(--text-primary); line-height: 1.5;">${belowTriggerText}</div>
        </div>

        <button type="button" class="btn-primary" onclick="UI.hideModal()" style="width: 100%; padding: 12px; margin-top: 6px;">
          ${I18n.t('modal_got_it') || 'הבנתי, תודה!'}
        </button>
      </div>
    `);
  }

  return {
    init,
    render,
    openDailyBriefing: (forceRefresh = false) => checkAndShowDailyBriefing(true, forceRefresh),
    checkAndShowDailyBriefing,
    renderNutritionSection: (dateStr) => renderNutritionSectionRef ? renderNutritionSectionRef(dateStr) : Promise.resolve(),
    resetNutritionDateToToday,
    navigate,
    goToDay,
    goToToday,
    toggleExpand,
    handleImageClick,
    toggleExercise,
    openExerciseOutcomeModal,
    confirmExerciseOutcome,
    toggleRestDayComplete,
    toggleSet,
    selectSetOutcome,
    openSetOutcomeModal,
    selectSetOutcomeFromModal,
    clearSetOutcomeFromModal,
    updateSetData,
    updateExerciseNote,
    showExerciseImage,
    performSwap,
    startIntervalTimer,
    showFormRuleModal,
    getCurrentDayIndex: () => currentDayIndex,
    parseWeightDetails,
    buildWeightBadgeHTML,
    toggleEqBanner
  };
})();

// Expose to window for inline event handlers
window.TodayPage = TodayPage;

