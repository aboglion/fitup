/**
 * Statistics Page Module
 */
const StatsPage = (() => {
  let allPlanDays = [];

  const isStrengthDay = (dayType) => {
    if (!dayType) return false;
    if (dayType === 'Rest' || dayType.includes('Active Recovery') || dayType.includes('Cardio') || dayType.includes('VO2')) return false;
    return true;
  };

  const formatCellDate = (rawDateStr) => {
    if (!rawDateStr) return '';
    let day = null, month = null, year = null;

    if (typeof rawDateStr === 'string') {
      if (rawDateStr.includes('/')) {
        const parts = rawDateStr.split('/');
        if (parts.length >= 2) {
          day = parseInt(parts[0], 10);
          month = parseInt(parts[1], 10);
          if (parts[2]) {
            year = parseInt(parts[2], 10) % 100;
          }
        }
      } else if (rawDateStr.includes('-')) {
        const datePart = rawDateStr.split('T')[0];
        const parts = datePart.split('-');
        if (parts.length === 3) {
          year = parseInt(parts[0], 10) % 100;
          month = parseInt(parts[1], 10);
          day = parseInt(parts[2], 10);
        }
      }
    }

    if (day === null || month === null || isNaN(day) || isNaN(month)) {
      const d = new Date(rawDateStr);
      if (!isNaN(d.getTime())) {
        day = d.getDate();
        month = d.getMonth() + 1;
        year = d.getFullYear() % 100;
      }
    }

    if (day !== null && month !== null && !isNaN(day) && !isNaN(month)) {
      if (year === null || isNaN(year)) {
        year = new Date().getFullYear() % 100;
      }
      const yy = String(year).padStart(2, '0');
      return `${day}/${month}/${yy}`;
    }
    return '';
  };


  /**
   * Initialize
   */
  function init(planDays) {
    allPlanDays = planDays;
  }

  /**
   * Render statistics page
   */
  async function render() {
    if (!allPlanDays || allPlanDays.length === 0) {
      allPlanDays = await DB.getAllPlan();
      allPlanDays.sort((a, b) => a.dayIndex - b.dayIndex);
    }
    const allTracking = await DB.getAllTracking();

    // Build tracking map
    const trackingMap = {};
    allTracking.forEach(t => { trackingMap[t.dayIndex] = t; });

    // Calculate stats
    const totalDays = allPlanDays.length;
    const completedDays = allTracking.filter(t => t.completed).length;

    const strengthDays = allPlanDays.filter(d => isStrengthDay(d.dayType));
    const completedStrength = strengthDays.filter(d => trackingMap[d.dayIndex] && trackingMap[d.dayIndex].completed).length;

    const walkDays = allPlanDays.filter(d => d.dayType === 'Active Recovery');
    const completedWalk = walkDays.filter(d => trackingMap[d.dayIndex] && trackingMap[d.dayIndex].completed).length;

    // Calculate streak
    const streak = calculateStreak(trackingMap);

    // RPE data
    const rpeValues = allTracking.filter(t => t.actualRPE).map(t => t.actualRPE);
    const avgRPE = rpeValues.length > 0
      ? (rpeValues.reduce((a, b) => a + b, 0) / rpeValues.length).toFixed(1)
      : '—';

    // Weight data
    const weightValues = allTracking.filter(t => t.bodyWeight).map(t => ({
      weight: t.bodyWeight,
      date: t.date
    }));

    // Calculate total XP
    let totalXP = 0;
    allTracking.forEach(t => {
      if (t.completed) {
        const day = trackingMap[t.dayIndex] ? allPlanDays[t.dayIndex] : null;
        if (day) {
          if (isStrengthDay(day.dayType)) totalXP += 500;
          else if (day.dayType === 'Active Recovery') totalXP += 200;
          else if (day.dayType === 'Rest') totalXP += 50;
        }
      }
    });

    const currentLevel = Math.floor(Math.sqrt(totalXP / 500)) + 1;
    const xpForCurrentLevel = currentLevel === 1 ? 0 : Math.pow(currentLevel - 1, 2) * 500;
    const xpForNextLevel = Math.pow(currentLevel, 2) * 500;
    const levelProgress = totalXP >= xpForNextLevel ? 100 : ((totalXP - xpForCurrentLevel) / (xpForNextLevel - xpForCurrentLevel)) * 100;

    // Calculate weekly trend
    const todayIdx = UI.findTodayIndex(allPlanDays);
    const currentWeekNum = Math.floor(todayIdx / 7) + 1;
    const currentWeekDays = allPlanDays.filter(d => d.week === `Week ${currentWeekNum}`);
    const lastWeekDays = allPlanDays.filter(d => d.week === `Week ${currentWeekNum - 1}`);

    const currCompleted = currentWeekDays.filter(d => trackingMap[d.dayIndex] && trackingMap[d.dayIndex].completed).length;
    const lastCompleted = lastWeekDays.filter(d => trackingMap[d.dayIndex] && trackingMap[d.dayIndex].completed).length;

    const currPct = currentWeekDays.length > 0 ? Math.round((currCompleted / currentWeekDays.length) * 100) : 0;
    const lastPct = lastWeekDays.length > 0 ? Math.round((lastCompleted / lastWeekDays.length) * 100) : 0;

    // Calculate monthly completion
    const currentMonthDays = allPlanDays.slice(Math.max(0, todayIdx - 29), todayIdx + 1);
    const monthCompleted = currentMonthDays.filter(d => trackingMap[d.dayIndex] && trackingMap[d.dayIndex].completed).length;
    const monthPct = currentMonthDays.length > 0 ? Math.round((monthCompleted / currentMonthDays.length) * 100) : 0;

    // Render overview
    renderOverview(completedDays, totalDays, completedStrength, strengthDays.length,
      completedWalk, walkDays.length, avgRPE, streak, totalXP, currentLevel, xpForNextLevel, levelProgress, currentWeekNum, currPct, lastPct, monthPct);

    // Metrics for compact cards at the bottom
    const metrics = {
      completed: completedDays,
      total: totalDays,
      strength: completedStrength,
      totalStrength: strengthDays.length,
      walk: completedWalk,
      totalWalk: walkDays.length,
      avgRPE,
      monthPct,
      currPct,
      lastPct
    };

    // Fetch plan start date
    const planStartDateStr = await DB.getSetting('planStartDate');

    // Fetch progression states for muscle progression calculation
    const allProgressionStates = await DB.getAllProgressionState();
    const exerciseGuide = await DB.getExerciseGuide();

    // Render charts & compact stats
    renderCharts(trackingMap, weightValues, metrics, currentWeekNum, planStartDateStr);

    // Render anatomy map
    renderAnatomy(trackingMap, allProgressionStates, exerciseGuide);

    // Render photos
    await renderPhotos();
  }

  /**
   * Calculate current streak
   */
  function calculateStreak(trackingMap) {
    let streak = 0;
    const todayIdx = UI.findTodayIndex(allPlanDays);

    // Count backwards from today
    for (let i = todayIdx; i >= 0; i--) {
      const day = allPlanDays[i];
      const tracking = trackingMap[i];

      if (day.dayType === 'Rest') {
        // Rest days don't break streak
        streak++;
        continue;
      }

      if (tracking && tracking.completed) {
        streak++;
      } else {
        break;
      }
    }

    return streak;
  }

  /**
   * Render overview stats
   */
  function renderOverview(completed, total, strength, totalStrength,
    walk, totalWalk, avgRPE, streak, totalXP, currentLevel, xpForNextLevel, levelProgress, currentWeekNum, currPct, lastPct, monthPct) {
    const container = document.getElementById('stats-overview');

    const streakHTML = streak > 0 ? `
      <div class="streak-display" style="grid-column: 1 / -1; margin-bottom: 0;">
        <span class="streak-fire">🔥</span>
        <div>
          <span class="streak-number">${streak}</span>
          <div class="streak-text">${I18n.t('streak_days')}</div>
        </div>
      </div>
    ` : '';

    const xpHTML = `
      <div class="xp-container" style="grid-column: 1 / -1; background: var(--bg-card); padding: var(--space-lg); border-radius: var(--radius-lg); border: 1px solid var(--border-color); display: flex; flex-direction: column; gap: var(--space-sm);">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="font-size: 24px;">⭐</span>
            <div>
              <div style="font-weight: 800; font-size: 18px; color: var(--text-primary);">${I18n.t('level_label')} ${currentLevel}</div>
              <div style="font-size: 12px; color: var(--text-secondary);">${totalXP} / ${xpForNextLevel} XP</div>
            </div>
          </div>
          <div style="display: flex; align-items: center; gap: 8px;">
            <button onclick="StatsPage.shareProgressCard()" class="btn-secondary" style="padding: 6px 12px; font-size: 12px; display: flex; align-items: center; gap: 4px; border-radius: 20px;">
              <span>📤</span> <span>${I18n.t('share_btn')}</span>
            </button>
            <div style="font-size: 11px; font-weight: 800; color: #00ff66; background: rgba(0, 255, 102, 0.1); border: 1px solid rgba(0, 255, 102, 0.3); padding: 4px 10px; border-radius: 20px; text-shadow: 0 0 5px rgba(0,255,102,0.5);">
              ${Math.round(levelProgress)}%
            </div>
          </div>
        </div>
        <div style="width: 100%; height: 8px; background: rgba(255,255,255,0.1); border-radius: 4px; overflow: hidden; margin-top: 4px;">
          <div style="height: 100%; width: ${levelProgress}%; background: #00ff66; box-shadow: 0 0 10px rgba(0, 255, 102, 0.6); transition: width 1s ease-out;"></div>
        </div>
      </div>
    `;

    const anatomyHTML = `
      <div id="anatomy-wrapper" style="grid-column: 1 / -1; margin-bottom: 0;">
        <div class="chart-title"><span>${I18n.t('muscle_map_title')}</span></div>
        <div id="anatomy-map-container"></div>
      </div>
    `;

    const fitContainerHTML = `
      <div id="stats-google-fit-container" style="grid-column: 1 / -1; margin-bottom: 0;"></div>
    `;

    container.innerHTML = `
      <style>
        #stats-overview .xp-container, #stats-charts .xp-container, #stats-charts .chart-card {
          border: 1px solid rgba(0, 255, 102, 0.25) !important;
          box-shadow: inset 0 0 20px rgba(0, 255, 102, 0.03), 0 4px 16px rgba(0,0,0,0.3) !important;
          background-color: var(--bg-card);
          background-image: linear-gradient(180deg, rgba(0, 255, 102, 0.04) 0%, transparent 100%) !important;
        }
        #stats-charts .chart-title, #stats-overview .chart-title span {
          color: #00ff66 !important;
          text-shadow: 0 0 8px rgba(0, 255, 102, 0.4);
        }
        #stats-charts .metric-box {
          background: rgba(0, 255, 102, 0.03) !important;
          border: 1px solid rgba(0, 255, 102, 0.15) !important;
          box-shadow: inset 0 0 10px rgba(0, 255, 102, 0.02) !important;
        }
      </style>
      ${xpHTML}
      ${fitContainerHTML}
      ${streakHTML}
      ${anatomyHTML}
    `;

    if (window.GoogleFitService) {
      window.GoogleFitService.renderWidget('stats-google-fit-container');
    }
  }

  /**
   * Weighted multi-exercise contribution model.
   * Each muscle is trained by multiple exercises — each with its own progression
   * stages, weight (0-1 summing to 1), and relevant day type.
   * Formula: muscleProgress = Σ(stageProgress_i × weight_i) × completionRate
   */
  /**
   * Weighted multi-exercise contribution model across the 78-week program.
   * Each muscle group is mapped to its actual exercise progressions in the program.
   * Each exercise has specific milestone weeks across all 78 weeks and a relative weight.
   * Formula: muscleProgress = Σ(stageProgress_i × weight_i) × categoryCompletionRate
   */
  const MUSCLE_CONTRIBUTIONS = {
    chest: [
      // Primary Pressing (Floor Press -> Single-Arm Floor Press -> Heavy Weighted Pressing)
      { stages: [1, 5, 10, 18, 26, 34, 42, 53, 62, 66], weight: 0.65, category: 'Push' },
      // Bodyweight Push-Up Progression (Push-up -> Deficit -> Elevated -> Vest Push-up)
      { stages: [1, 5, 10, 18, 26, 34, 41, 53, 62, 66], weight: 0.25, category: 'Push' },
      // Upper Chest / Handstand Stability (Pike Hold -> Wall Walk -> Wall Handstand)
      { stages: [1, 5, 10, 18, 26, 34, 42, 53, 66], weight: 0.10, category: 'Push' },
    ],
    shoulders: [
      // Overhead Pressing (Seated DB OHP -> Single-Arm Seated OHP 18-24kg)
      { stages: [1, 5, 10, 18, 26, 34, 42, 53, 58, 62, 66], weight: 0.45, category: 'Push' },
      // Pike / Wall Walk / Handstand Progression (Shoulder Overhead Stability)
      { stages: [1, 5, 10, 18, 26, 34, 42, 53, 66], weight: 0.25, category: 'Push' },
      // Lateral Delts (DB Lateral Raise 3-9kg + Arm Block Ladders)
      { stages: [1, 5, 10, 18, 34, 42, 53, 62, 66], weight: 0.20, category: 'Push' },
      // Rear Delts & Rotator Cuff (TRX Face Pull Angles 1-4 & TRX Y-T-W)
      { stages: [1, 5, 10, 18, 26, 34, 42, 53, 66], weight: 0.10, category: 'Pull' },
    ],
    triceps: [
      // Overhead Triceps Extension Isolation (DB OH Ext 6-24kg + Arm Block Ladders)
      { stages: [1, 5, 10, 18, 34, 42, 50, 53, 58, 66], weight: 0.45, category: 'Push' },
      // Compound Floor Press & Push-Up Lockout
      { stages: [1, 5, 10, 18, 26, 34, 42, 53, 62, 66], weight: 0.35, category: 'Push' },
      // Overhead Press Lockout (OHP & Pike Push-up)
      { stages: [1, 5, 10, 18, 34, 42, 53, 62, 66], weight: 0.20, category: 'Push' },
    ],
    biceps: [
      // Vertical Pulling Compound (Pull-Up / Chin-Up -> Weighted Pull-Up +5kg Vest)
      { stages: [1, 5, 10, 18, 26, 34, 42, 50, 53, 62, 66], weight: 0.45, category: 'Pull' },
      // Biceps Curls Isolation (DB Curl, Hammer Curl, Single-Arm Curl 3-18kg + Arm Block Ladders)
      { stages: [1, 5, 10, 18, 26, 34, 42, 53, 62, 66], weight: 0.40, category: 'Pull' },
      // Horizontal Row Synergist (One-Arm DB Row 6-24kg)
      { stages: [1, 5, 10, 18, 26, 34, 42, 53, 66], weight: 0.15, category: 'Pull' },
    ],
    forearms: [
      // Direct Grip Endurance (Towel Hang 15s -> 60s)
      { stages: [1, 5, 10, 18, 26, 34, 42, 58, 66], weight: 0.40, category: 'Pull' },
      // Loaded Carrying (Suitcase Carry 12-24kg Walk)
      { stages: [1, 5, 18, 26, 34, 53, 62, 66], weight: 0.35, category: 'Legs' },
      // Heavy Pull-Up & Row Grip Demand
      { stages: [1, 5, 10, 18, 26, 34, 42, 53, 62, 66], weight: 0.25, category: 'Pull' },
    ],
    lats: [
      // Vertical Pulling Primary (Pull-Up & Chin-Up -> Weighted +5kg)
      { stages: [1, 5, 10, 18, 26, 34, 42, 50, 53, 62, 66], weight: 0.60, category: 'Pull' },
      // Horizontal Row Primary (One-Arm DB Row 6-24kg)
      { stages: [1, 5, 10, 18, 26, 34, 42, 53, 66], weight: 0.35, category: 'Pull' },
      // Scapular Activation (Scapular Pull-up)
      { stages: [1, 10, 26, 53], weight: 0.05, category: 'Pull' },
    ],
    traps: [
      // Scapular Retraction & Rear Delt (TRX Face Pull, Y-T-W, Band Pull-Apart)
      { stages: [1, 5, 10, 18, 26, 34, 42, 53, 66], weight: 0.45, category: 'Pull' },
      // Heavy Row Upper Traps & Rhomboids (One-Arm DB Row 6-24kg)
      { stages: [1, 5, 10, 18, 26, 34, 42, 53, 66], weight: 0.35, category: 'Pull' },
      // Vertical Pull Scapular Control
      { stages: [1, 5, 10, 18, 34, 53, 66], weight: 0.20, category: 'Pull' },
    ],
    quads: [
      // Unilateral Squats & Goblet Progression (DB BSS -> Goblet BSS 15-24kg)
      { stages: [1, 5, 10, 18, 26, 34, 42, 53, 58, 62, 66], weight: 0.55, category: 'Legs' },
      // Advanced Knee Extension (Pistol Squat to Chair, Reverse Lunge, Walking Lunge 18kg)
      { stages: [1, 5, 18, 26, 34, 42, 53, 62, 66], weight: 0.35, category: 'Legs' },
      // Active Recovery & Cardio Walking
      { stages: [1, 10, 26, 53], weight: 0.10, category: 'Cardio' },
    ],
    hamstrings: [
      // Primary Hip Hinge (DB RDL -> DB Single-Leg RDL 12-24kg)
      { stages: [1, 5, 10, 18, 26, 34, 42, 50, 53, 66], weight: 0.65, category: 'Legs' },
      // Posterior Chain Synergist (DB Glute Bridge 9-32kg)
      { stages: [1, 5, 10, 18, 26, 34, 42, 50, 53, 66], weight: 0.25, category: 'Legs' },
      // Unilateral Squat Assistance
      { stages: [1, 5, 18, 34, 53, 66], weight: 0.10, category: 'Legs' },
    ],
    glutes: [
      // Primary Hip Extension (DB Glute Bridge 9-32kg with pauses)
      { stages: [1, 5, 10, 18, 26, 34, 42, 50, 53, 66], weight: 0.50, category: 'Legs' },
      // Single-Leg Hinge & Squat (Single-Leg RDL & BSS Goblet 12-24kg)
      { stages: [1, 5, 10, 18, 26, 34, 42, 50, 53, 66], weight: 0.40, category: 'Legs' },
      // Loaded Carry & Active Recovery
      { stages: [1, 10, 26, 53], weight: 0.10, category: 'Legs' },
    ],
    calves: [
      // Primary Calf Isolation (Single-Leg Calf Raise 0-24kg, 15-20 reps with pauses)
      { stages: [1, 5, 10, 18, 26, 34, 42, 50, 58, 66], weight: 0.75, category: 'Legs' },
      // Active Recovery & Cardio Intervals (Brisk Walking, VO2 Max 4x4)
      { stages: [1, 10, 26, 53], weight: 0.25, category: 'Cardio' },
    ],
    core: [
      // Core Flexion & Isometric (Dead Bug, Hollow Body Hold, L-sit Tuck)
      { stages: [1, 5, 10, 18, 26, 34, 42, 53, 62, 66], weight: 0.60, category: 'Legs' },
      // Anti-Rotation (Pallof Press Band 30-40kg)
      { stages: [1, 10, 26, 34, 53, 66], weight: 0.25, category: 'Legs' },
      // Pressing & Plank Stabilization
      { stages: [1, 5, 10, 18, 26, 34, 42, 53, 66], weight: 0.15, category: 'Push' },
    ],
    obliques: [
      // Anti-Lateral Flexion (Suitcase Carry Heavy Walk 12-24kg)
      { stages: [1, 5, 18, 26, 34, 53, 62, 66], weight: 0.45, category: 'Legs' },
      // Anti-Rotation & Isometric (Pallof Press & L-sit Tuck)
      { stages: [1, 5, 10, 18, 26, 34, 42, 53, 66], weight: 0.35, category: 'Legs' },
      // Core Co-contraction & Single-Arm Pressing Balance
      { stages: [1, 5, 18, 34, 53, 66], weight: 0.20, category: 'Push' },
    ],
    lowerBack: [
      // Lumbar Extension & Hinge (DB RDL -> DB Single-Leg RDL 12-24kg)
      { stages: [1, 5, 10, 18, 26, 34, 42, 50, 53, 66], weight: 0.60, category: 'Legs' },
      // DB Glute Bridge Lumbar Stabilization
      { stages: [1, 5, 10, 18, 26, 34, 42, 50, 53, 66], weight: 0.25, category: 'Legs' },
      // Loaded Carry & Anti-Flexion Bracing (Suitcase Carry & Dead Bug)
      { stages: [1, 5, 18, 26, 34, 53, 66], weight: 0.15, category: 'Legs' },
    ],
    neck: [
      // Neck Mobility & Deep Cervical Flexors (Deep Mobility Protocol — Day 4 Active Recovery)
      { stages: [1, 10, 26, 53], weight: 0.60, category: 'Cardio' },
      // Cervical Stabilization via Scapular Warmups (Wall Slides, Band Pull-Apart)
      { stages: [1, 5, 10, 18, 26, 34, 42, 53, 66], weight: 0.25, category: 'Push' },
      // Deep Neck Flexor & Upper Trap Co-contraction (TRX Face Pull)
      { stages: [1, 5, 10, 18, 26, 34, 42, 53, 66], weight: 0.15, category: 'Pull' },
    ],
  };

  /**
   * Exercise-to-muscle group mapping with primary and secondary contribution weights.
   */
  const EXERCISE_MUSCLE_MAPPING = {
    'db-floor-press': [{ m: 'chest', w: 1.0 }, { m: 'triceps', w: 0.5 }],
    'single-arm-floor-press': [{ m: 'chest', w: 1.0 }, { m: 'triceps', w: 0.5 }, { m: 'obliques', w: 0.3 }],
    'db-single-arm-floor-press': [{ m: 'chest', w: 1.0 }, { m: 'triceps', w: 0.5 }],
    'push-up': [{ m: 'chest', w: 1.0 }, { m: 'triceps', w: 0.5 }, { m: 'core', w: 0.3 }],
    'push-up-bars-progression': [{ m: 'chest', w: 1.0 }, { m: 'triceps', w: 0.5 }, { m: 'core', w: 0.3 }],
    'push-up-volume-day5': [{ m: 'chest', w: 1.0 }, { m: 'triceps', w: 0.5 }, { m: 'core', w: 0.3 }],
    'push-up-volume-day-5': [{ m: 'chest', w: 1.0 }, { m: 'triceps', w: 0.5 }, { m: 'core', w: 0.3 }],
    'deficit-push-up': [{ m: 'chest', w: 1.0 }, { m: 'triceps', w: 0.5 }, { m: 'core', w: 0.3 }],
    'incline-push-up': [{ m: 'chest', w: 1.0 }, { m: 'triceps', w: 0.4 }],
    'feet-elevated-push-up': [{ m: 'chest', w: 1.0 }, { m: 'shoulders', w: 0.5 }, { m: 'triceps', w: 0.5 }],
    'weighted-push-up': [{ m: 'chest', w: 1.0 }, { m: 'triceps', w: 0.5 }, { m: 'core', w: 0.4 }],
    'scapular-push-up': [{ m: 'chest', w: 0.5 }, { m: 'shoulders', w: 0.5 }, { m: 'core', w: 0.3 }],

    'seated-db-ohp': [{ m: 'shoulders', w: 1.0 }, { m: 'triceps', w: 0.5 }],
    'single-arm-seated-ohp': [{ m: 'shoulders', w: 1.0 }, { m: 'triceps', w: 0.5 }, { m: 'obliques', w: 0.3 }],
    'seated-db-overhead-press': [{ m: 'shoulders', w: 1.0 }, { m: 'triceps', w: 0.5 }],
    'seated-single-arm-ohp': [{ m: 'shoulders', w: 1.0 }, { m: 'triceps', w: 0.5 }, { m: 'obliques', w: 0.3 }],
    'db-lateral-raise': [{ m: 'shoulders', w: 1.0 }],
    'single-arm-lateral-raise': [{ m: 'shoulders', w: 1.0 }],
    'pike-push-up': [{ m: 'shoulders', w: 1.0 }, { m: 'triceps', w: 0.5 }],
    'pike-progression': [{ m: 'shoulders', w: 1.0 }, { m: 'triceps', w: 0.5 }],
    'trx-face-pull': [{ m: 'shoulders', w: 0.8 }, { m: 'traps', w: 0.8 }],
    'wall-walk': [{ m: 'shoulders', w: 1.0 }, { m: 'core', w: 0.5 }],
    'wall-handstand-hold': [{ m: 'shoulders', w: 1.0 }, { m: 'core', w: 0.5 }],

    'db-overhead-triceps-extension': [{ m: 'triceps', w: 1.0 }],
    'overhead-triceps-ext': [{ m: 'triceps', w: 1.0 }],
    'single-arm-overhead-triceps-ext': [{ m: 'triceps', w: 1.0 }],
    'diamond-push-up': [{ m: 'triceps', w: 1.0 }, { m: 'chest', w: 0.6 }],

    'pull-up': [{ m: 'lats', w: 1.0 }, { m: 'biceps', w: 0.6 }, { m: 'forearms', w: 0.4 }],
    'pull-up-progression': [{ m: 'lats', w: 1.0 }, { m: 'biceps', w: 0.6 }, { m: 'forearms', w: 0.4 }],
    'chin-up': [{ m: 'lats', w: 0.8 }, { m: 'biceps', w: 1.0 }, { m: 'forearms', w: 0.4 }],
    'weighted-pull-up': [{ m: 'lats', w: 1.0 }, { m: 'biceps', w: 0.6 }, { m: 'forearms', w: 0.5 }],
    'one-arm-db-row': [{ m: 'lats', w: 1.0 }, { m: 'traps', w: 0.5 }, { m: 'biceps', w: 0.5 }, { m: 'forearms', w: 0.4 }],
    'trx-row': [{ m: 'lats', w: 1.0 }, { m: 'biceps', w: 0.5 }],
    'seated-band-row': [{ m: 'lats', w: 1.0 }, { m: 'biceps', w: 0.5 }, { m: 'forearms', w: 0.4 }],
    'scapular-pull-up': [{ m: 'lats', w: 0.6 }, { m: 'traps', w: 0.6 }],
    'inverted-row': [{ m: 'lats', w: 1.0 }, { m: 'biceps', w: 0.5 }],

    'db-curl': [{ m: 'biceps', w: 1.0 }],
    'single-arm-curl': [{ m: 'biceps', w: 1.0 }],
    'hammer-curl': [{ m: 'biceps', w: 1.0 }, { m: 'forearms', w: 0.5 }],
    'single-arm-hammer-curl': [{ m: 'biceps', w: 1.0 }, { m: 'forearms', w: 0.5 }],
    'biceps-curl-ladder': [{ m: 'biceps', w: 1.0 }],

    'trx-ytw': [{ m: 'traps', w: 1.0 }, { m: 'shoulders', w: 0.6 }],
    'trx-y-t-w': [{ m: 'traps', w: 1.0 }, { m: 'shoulders', w: 0.6 }],
    'band-pull-apart': [{ m: 'traps', w: 1.0 }, { m: 'shoulders', w: 0.5 }],

    'db-bulgarian-split-squat': [{ m: 'quads', w: 1.0 }, { m: 'glutes', w: 0.7 }],
    'db-bss': [{ m: 'quads', w: 1.0 }, { m: 'glutes', w: 0.7 }],
    'db-bss-goblet': [{ m: 'quads', w: 1.0 }, { m: 'glutes', w: 0.7 }],
    'goblet-bulgarian-split-squat': [{ m: 'quads', w: 1.0 }, { m: 'glutes', w: 0.7 }],
    'goblet-squat': [{ m: 'quads', w: 1.0 }, { m: 'glutes', w: 0.5 }, { m: 'core', w: 0.3 }],
    'bodyweight-squat': [{ m: 'quads', w: 1.0 }, { m: 'glutes', w: 0.4 }],
    'reverse-lunge': [{ m: 'quads', w: 1.0 }, { m: 'glutes', w: 0.6 }],
    'heels-elevated-goblet-squat': [{ m: 'quads', w: 1.0 }, { m: 'glutes', w: 0.5 }, { m: 'core', w: 0.3 }],
    'reverse-lunge-pistol-squat': [{ m: 'quads', w: 1.0 }, { m: 'glutes', w: 0.6 }],
    'walking-lunge': [{ m: 'quads', w: 1.0 }, { m: 'glutes', w: 0.6 }],
    'pistol-squat-to-chair': [{ m: 'quads', w: 1.0 }, { m: 'glutes', w: 0.7 }, { m: 'core', w: 0.4 }],

    'db-rdl': [{ m: 'hamstrings', w: 1.0 }, { m: 'glutes', w: 0.7 }, { m: 'lowerBack', w: 0.6 }],
    'goblet-romanian-deadlift': [{ m: 'hamstrings', w: 1.0 }, { m: 'glutes', w: 0.7 }, { m: 'lowerBack', w: 0.6 }],
    'db-romanian-deadlift': [{ m: 'hamstrings', w: 1.0 }, { m: 'glutes', w: 0.7 }, { m: 'lowerBack', w: 0.6 }],
    'single-leg-db-rdl': [{ m: 'hamstrings', w: 1.0 }, { m: 'glutes', w: 0.8 }, { m: 'lowerBack', w: 0.6 }],
    'single-leg-rdl': [{ m: 'hamstrings', w: 1.0 }, { m: 'glutes', w: 0.8 }, { m: 'lowerBack', w: 0.6 }],
    'db-glute-bridge': [{ m: 'glutes', w: 1.0 }, { m: 'hamstrings', w: 0.5 }],
    'glute-bridge': [{ m: 'glutes', w: 1.0 }, { m: 'hamstrings', w: 0.5 }],

    'single-leg-calf-raise': [{ m: 'calves', w: 1.0 }],
    'standing-single-leg-calf-raise': [{ m: 'calves', w: 1.0 }],
    'seated-single-leg-calf-raise': [{ m: 'calves', w: 1.0 }],
    'seated-calf-raise': [{ m: 'calves', w: 1.0 }],
    'double-leg-calf-raise': [{ m: 'calves', w: 1.0 }],

    'dead-bug': [{ m: 'core', w: 1.0 }, { m: 'obliques', w: 0.5 }],
    'hollow-body-hold': [{ m: 'core', w: 1.0 }, { m: 'obliques', w: 0.4 }],
    'pallof-press-band': [{ m: 'obliques', w: 1.0 }, { m: 'core', w: 0.8 }],
    'pallof-press-progression': [{ m: 'obliques', w: 1.0 }, { m: 'core', w: 0.8 }],
    'l-sit-tuck-hold': [{ m: 'core', w: 1.0 }, { m: 'obliques', w: 0.5 }],
    'l-sit-progression': [{ m: 'core', w: 1.0 }, { m: 'obliques', w: 0.5 }],
    'suitcase-carry': [{ m: 'core', w: 0.8 }, { m: 'obliques', w: 1.0 }, { m: 'forearms', w: 0.8 }, { m: 'lowerBack', w: 0.5 }],
    'towel-hang': [{ m: 'forearms', w: 1.0 }],
    'dead-hang': [{ m: 'forearms', w: 1.0 }],
    'pistol-squat': [{ m: 'quads', w: 1.0 }, { m: 'glutes', w: 0.7 }, { m: 'core', w: 0.4 }],
    'bulgarian-split-squat': [{ m: 'quads', w: 1.0 }, { m: 'glutes', w: 0.7 }],
    'push-up-progression': [{ m: 'chest', w: 1.0 }, { m: 'triceps', w: 0.5 }, { m: 'core', w: 0.3 }],
    'db-oh-triceps-extension': [{ m: 'triceps', w: 1.0 }],
    'arm-block-lateral-raise': [{ m: 'shoulders', w: 1.0 }],
    'arm-block-triceps-ext': [{ m: 'triceps', w: 1.0 }],
    'chin-up-progression': [{ m: 'lats', w: 0.8 }, { m: 'biceps', w: 1.0 }, { m: 'forearms', w: 0.4 }],
    'push-up-volume': [{ m: 'chest', w: 1.0 }, { m: 'triceps', w: 0.5 }, { m: 'core', w: 0.3 }],
    'arm-block-biceps-curl': [{ m: 'biceps', w: 1.0 }],
    'high-knees': [{ m: 'quads', w: 0.5 }, { m: 'core', w: 0.5 }],
    'arm-circles': [{ m: 'shoulders', w: 0.5 }],
    'wall-slides': [{ m: 'traps', w: 0.5 }, { m: 'shoulders', w: 0.5 }],
    'brisk-walking': [{ m: 'calves', w: 0.3 }, { m: 'quads', w: 0.3 }],
    'relaxed-walking': [{ m: 'calves', w: 0.2 }, { m: 'quads', w: 0.2 }],
    'vo2-max-norwegian-4x4': [{ m: 'calves', w: 0.5 }, { m: 'quads', w: 0.5 }],
    'micro-mobility-protocol': [],
    'deep-mobility-protocol': [],
    'single-arm-floor-press': [{ m: 'chest', w: 1.0 }, { m: 'triceps', w: 0.5 }],
    'weighted-deficit-push-up': [{ m: 'chest', w: 1.0 }, { m: 'triceps', w: 0.5 }, { m: 'core', w: 0.3 }],
    'weighted-diamond-push-up': [{ m: 'triceps', w: 1.0 }, { m: 'chest', w: 0.6 }],
    'wall-walk-partial': [{ m: 'shoulders', w: 1.0 }, { m: 'core', w: 0.5 }],
    'wall-walk-full': [{ m: 'shoulders', w: 1.0 }, { m: 'core', w: 0.5 }],
    'wall-handstand': [{ m: 'shoulders', w: 1.0 }, { m: 'core', w: 0.5 }],
    'elevated-pike-push-up': [{ m: 'shoulders', w: 1.0 }, { m: 'triceps', w: 0.5 }],
    'single-arm-seated-ohp': [{ m: 'shoulders', w: 1.0 }, { m: 'triceps', w: 0.5 }, { m: 'obliques', w: 0.3 }],
    'pull-up-overhand': [{ m: 'lats', w: 1.0 }, { m: 'biceps', w: 0.6 }, { m: 'forearms', w: 0.4 }],
    'weighted-chin-up': [{ m: 'lats', w: 0.8 }, { m: 'biceps', w: 1.0 }, { m: 'forearms', w: 0.5 }],
    'walking-lunge-goblet': [{ m: 'quads', w: 1.0 }, { m: 'glutes', w: 0.6 }],
    'wrist-rocks': [{ m: 'forearms', w: 0.5 }],
    'band-neck-flexion': [{ m: 'neck', w: 1.0 }, { m: 'traps', w: 0.7 }, { m: 'shoulders', w: 0.3 }]
  };

  function getExerciseContributions(ex) {
    if (!ex) return [];
    const exId = (ex.id || ex.exerciseId || '').toLowerCase();
    if (EXERCISE_MUSCLE_MAPPING[exId]) return EXERCISE_MUSCLE_MAPPING[exId];

    const slug = (ex.name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-');
    for (const [key, map] of Object.entries(EXERCISE_MUSCLE_MAPPING)) {
      if (slug.includes(key) || key.includes(slug)) return map;
    }

    const name = (ex.name || '').toLowerCase();
    if (name.includes('pallof') || name.includes('oblique') || name.includes('carry')) {
      return [{ m: 'obliques', w: 1.0 }, { m: 'core', w: 0.8 }, { m: 'forearms', w: 0.5 }];
    }
    if (name.includes('ohp') || name.includes('overhead press') || name.includes('raise') || name.includes('shoulder') || name.includes('pike')) {
      return [{ m: 'shoulders', w: 1.0 }, { m: 'triceps', w: 0.4 }];
    }
    if (name.includes('press') || name.includes('push-up') || name.includes('chest')) {
      return [{ m: 'chest', w: 1.0 }, { m: 'triceps', w: 0.5 }];
    }
    if (name.includes('pull-up') || name.includes('row') || name.includes('chin-up') || name.includes('lat')) {
      return [{ m: 'lats', w: 1.0 }, { m: 'biceps', w: 0.5 }, { m: 'forearms', w: 0.4 }];
    }
    if (name.includes('face pull') || name.includes('y-t-w') || name.includes('pull-apart')) {
      return [{ m: 'traps', w: 1.0 }, { m: 'shoulders', w: 0.6 }];
    }
    if (name.includes('curl')) {
      return [{ m: 'biceps', w: 1.0 }];
    }
    if (name.includes('triceps') || name.includes('diamond')) {
      return [{ m: 'triceps', w: 1.0 }];
    }
    if (name.includes('squat') || name.includes('lunge')) {
      return [{ m: 'quads', w: 1.0 }, { m: 'glutes', w: 0.5 }];
    }
    if (name.includes('rdl') || name.includes('hinge') || name.includes('deadlift') || name.includes('romanian')) {
      return [{ m: 'hamstrings', w: 1.0 }, { m: 'glutes', w: 0.7 }, { m: 'lowerBack', w: 0.5 }];
    }
    if (name.includes('bridge') || name.includes('thrust') || name.includes('glute')) {
      return [{ m: 'glutes', w: 1.0 }, { m: 'hamstrings', w: 0.5 }];
    }
    if (name.includes('calf') || name.includes('calves')) {
      return [{ m: 'calves', w: 1.0 }];
    }
    if (name.includes('bug') || name.includes('hollow') || name.includes('l-sit') || name.includes('core')) {
      return [{ m: 'core', w: 1.0 }, { m: 'obliques', w: 0.5 }];
    }
    if (name.includes('hang')) {
      return [{ m: 'forearms', w: 1.0 }];
    }

    return [];
  }

  const EXERCISE_MUSCLE_MAP = {
    'db-floor-press': 'chest', 'single-arm-floor-press': 'chest', 'db-single-arm-floor-press': 'chest', 'push-up': 'chest', 'deficit-push-up': 'chest', 'incline-push-up': 'chest', 'feet-elevated-push-up': 'chest', 'weighted-push-up': 'chest', 'push-up-bars-progression': 'chest', 'push-up-volume-day5': [{ m: 'chest', w: 1.0 }, { m: 'triceps', w: 0.5 }, { m: 'core', w: 0.3 }],
    'push-up-volume-day5': 'chest', 'push-up-volume-day-5': 'chest', 'scapular-push-up': 'chest',
    'seated-db-ohp': 'shoulders', 'single-arm-seated-ohp': 'shoulders', 'seated-db-overhead-press': 'shoulders', 'seated-single-arm-ohp': 'shoulders', 'db-lateral-raise': 'shoulders', 'single-arm-lateral-raise': 'shoulders', 'pike-push-up': 'shoulders', 'pike-progression': 'shoulders', 'trx-face-pull': 'shoulders', 'wall-walk': 'shoulders', 'wall-handstand-hold': 'shoulders', 'band-pull-apart': 'shoulders', 'trx-ytw': [{ m: 'traps', w: 1.0 }, { m: 'shoulders', w: 0.6 }],
    'trx-ytw': 'traps', 'trx-y-t-w': 'traps',
    'overhead-triceps-ext': 'triceps', 'db-overhead-triceps-extension': 'triceps', 'single-arm-overhead-triceps-ext': 'triceps', 'diamond-push-up': 'triceps',
    'pull-up': 'lats', 'pull-up-progression': 'lats', 'chin-up': 'lats', 'weighted-pull-up': 'lats', 'one-arm-db-row': 'lats', 'trx-row': 'lats', 'seated-band-row': 'lats', 'scapular-pull-up': 'lats', 'inverted-row': 'lats',
    'db-curl': 'biceps', 'single-arm-curl': 'biceps', 'hammer-curl': 'biceps', 'single-arm-hammer-curl': 'biceps', 'biceps-curl-ladder': 'biceps',
    'db-bulgarian-split-squat': 'quads', 'db-bss': 'quads', 'db-bss-goblet': 'quads', 'goblet-bulgarian-split-squat': 'quads', 'goblet-squat': 'quads', 'bodyweight-squat': 'quads', 'reverse-lunge': 'quads', 'heels-elevated-goblet-squat': 'quads', 'reverse-lunge-pistol-squat': 'quads', 'walking-lunge': 'quads', 'pistol-squat-to-chair': 'quads',
    'db-rdl': 'hamstrings', 'goblet-romanian-deadlift': 'hamstrings', 'db-romanian-deadlift': 'hamstrings', 'single-leg-db-rdl': 'hamstrings', 'single-leg-rdl': 'hamstrings', 'db-glute-bridge': 'glutes', 'glute-bridge': 'glutes',
    'single-leg-calf-raise': 'calves', 'standing-single-leg-calf-raise': 'calves', 'seated-single-leg-calf-raise': 'calves', 'double-leg-calf-raise': 'calves', 'seated-calf-raise': 'calves',
    'dead-bug': 'core', 'hollow-body-hold': 'core', 'pallof-press-band': 'core', 'pallof-press-progression': 'core', 'l-sit-tuck-hold': 'core', 'l-sit-progression': 'core', 'suitcase-carry': 'obliques', 'dead-hang': 'forearms', 'towel-hang': 'forearms', 'pistol-squat': 'quads', 'bulgarian-split-squat': 'quads', 'push-up-progression': 'chest', 'db-oh-triceps-extension': 'triceps', 'arm-block-lateral-raise': 'shoulders', 'arm-block-triceps-ext': 'shoulders', 'chin-up-progression': 'lats', 'push-up-volume': 'chest', 'arm-block-biceps-curl': 'biceps', 'high-knees': 'quads', 'arm-circles': 'shoulders', 'wall-slides': 'shoulders', 'brisk-walking': 'calves', 'relaxed-walking': 'calves', 'vo2-max-norwegian-4x4': 'calves', 'micro-mobility-protocol': null, 'deep-mobility-protocol': null, 'band-neck-flexion': 'neck', 'single-arm-floor-press': 'chest', 'weighted-deficit-push-up': 'chest', 'weighted-diamond-push-up': 'triceps', 'wall-walk-partial': 'shoulders', 'wall-walk-full': 'shoulders', 'wall-handstand': 'shoulders', 'elevated-pike-push-up': 'shoulders', 'single-arm-seated-ohp': 'shoulders', 'pull-up-overhand': 'lats', 'weighted-chin-up': 'lats', 'walking-lunge-goblet': 'quads', 'wrist-rocks': 'forearms'
  };

  function getMuscleForExercise(ex) {
    if (!ex) return null;
    if (ex.id && EXERCISE_MUSCLE_MAP[ex.id]) return EXERCISE_MUSCLE_MAP[ex.id];
    if (ex.exerciseId && EXERCISE_MUSCLE_MAP[ex.exerciseId]) return EXERCISE_MUSCLE_MAP[ex.exerciseId];

    const slug = (ex.name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-');
    for (const [key, muscle] of Object.entries(EXERCISE_MUSCLE_MAP)) {
      if (slug.includes(key) || key.includes(slug)) return muscle;
    }

    const name = (ex.name || '').toLowerCase();
    if (name.includes('pallof') || name.includes('oblique') || name.includes('carry')) return 'core';
    if (name.includes('ohp') || name.includes('overhead press') || name.includes('raise') || name.includes('shoulder') || name.includes('pike') || name.includes('face pull')) return 'shoulders';
    if (name.includes('press') || name.includes('push-up') || name.includes('chest')) return 'chest';
    if (name.includes('pull-up') || name.includes('row') || name.includes('chin-up') || name.includes('lat')) return 'lats';
    if (name.includes('curl')) return 'biceps';
    if (name.includes('triceps') || name.includes('diamond')) return 'triceps';
    if (name.includes('squat') || name.includes('lunge')) return 'quads';
    if (name.includes('rdl') || name.includes('bridge') || name.includes('thrust') || name.includes('glute') || name.includes('deadlift') || name.includes('romanian')) return 'hamstrings';
    if (name.includes('calf') || name.includes('calves')) return 'calves';
    if (name.includes('bug') || name.includes('hollow') || name.includes('l-sit') || name.includes('hold') || name.includes('core')) return 'core';
    if (name.includes('hang')) return 'forearms';

    return null;
  }

  function getCompletedSetsForExercise(track, exIdx, setMultiplier) {
    if (!track) return 0;
    if (track.completed) return setMultiplier;

    // Check exerciseStatus
    if (track.exerciseStatus) {
      if (track.exerciseStatus[exIdx] === true || track.exerciseStatus[String(exIdx)] === true) {
        return setMultiplier;
      }
    }

    if (!track.setData) return 0;

    // Format A: Nested object by exIdx (e.g. track.setData[0] or track.setData["0"])
    const nestedData = track.setData[exIdx] || track.setData[String(exIdx)];
    if (nestedData && typeof nestedData === 'object') {
      let count = 0;
      for (let s = 0; s < setMultiplier; s++) {
        if (nestedData[`set_${s}_done`] || nestedData[`set_${s}_result`] || nestedData[`set_${s}_reps`] || nestedData[`set_${s}_weight`]) {
          count++;
        }
      }
      if (count > 0) return count;
    }

    // Format B: Flat keys e.g. track.setData["ex_0_set_0_done"] or track.setData["ex_0_set_0_reps"]
    let flatCount = 0;
    for (let s = 0; s < setMultiplier; s++) {
      if (
        track.setData[`ex_${exIdx}_set_${s}_done`] ||
        track.setData[`ex_${exIdx}_set_${s}_result`] ||
        track.setData[`ex_${exIdx}_set_${s}_reps`] ||
        track.setData[`ex_${exIdx}_set_${s}_weight`]
      ) {
        flatCount++;
      }
    }
    return flatCount;
  }

  /**
   * Calculate per-muscle progression percentages across the full 78-week program timeline.
   * Compares unlocked weight and stages against maximum weight/stages to reflect strength gains.
   * Formula: muscleProgress = Σ(exerciseProgress_i × weight_i) / Σ(weight_i)
   * where exerciseProgress = (currentWeight - minWeight) / (maxWeight - minWeight) * 100
   */
  function calculateMuscleProgressions(trackingMap, allProgressionStates, exerciseGuide) {
    const muscles = ['chest', 'shoulders', 'triceps', 'lats', 'traps', 'biceps', 'forearms',
      'quads', 'hamstrings', 'glutes', 'calves', 'core', 'obliques', 'lowerBack'];

    if (!allProgressionStates || !exerciseGuide) {
      const result = {};
      muscles.forEach(m => { result[m] = 0; });
      return result;
    }

    const muscleScores = {};
    const muscleWeights = {};
    muscles.forEach(m => { muscleScores[m] = 0; muscleWeights[m] = 0; });

    allProgressionStates.forEach(state => {
      const exDef = exerciseGuide.find(e => e.id === state.exerciseId);
      if (!exDef) return;

      let score = 0;
      if (exDef.type === 'weighted') {
        const minW = exDef.minWeight || 0;
        const maxW = exDef.maxWeight || 24;
        const curW = state.currentWeightKg || minW;
        if (maxW > minW) {
          score = Math.max(0, Math.min(100, ((curW - minW) / (maxW - minW)) * 100));
        }
      } else {
        const stages = exDef.stages || [];
        const maxStage = Math.max(1, stages.length - 1);
        const curStage = state.currentStageIndex || 0;
        score = Math.max(0, Math.min(100, (curStage / maxStage) * 100));
      }

      const contribs = getExerciseContributions(exDef);
      contribs.forEach(c => {
        if (muscleScores[c.m] !== undefined) {
          muscleScores[c.m] += score * c.w;
          muscleWeights[c.m] += c.w;
        }
      });
    });

    const result = {};
    muscles.forEach(m => {
      if (muscleWeights[m] > 0) {
        const avg = muscleScores[m] / muscleWeights[m];
        result[m] = Math.max(0, Math.min(100, Number(avg.toFixed(1))));
      } else {
        result[m] = 0;
      }
    });

    return result;
  }

  /**
   * Render anatomy map
   */
  function renderAnatomy(trackingMap, allProgressionStates, exerciseGuide) {
    const container = document.getElementById('stats-overview');

    // Create anatomy wrapper if it doesn't exist
    let anatomyWrapper = document.getElementById('anatomy-wrapper');
    if (!anatomyWrapper) {
      anatomyWrapper = document.createElement('div');
      anatomyWrapper.id = 'anatomy-wrapper';
      anatomyWrapper.style.gridColumn = '1 / -1';
      anatomyWrapper.style.marginBottom = 'var(--space-lg)';

      const title = document.createElement('div');
      title.className = 'chart-title';
      title.innerHTML = `<span>${I18n.t('muscle_map_title')}</span>`;

      const mapContainer = document.createElement('div');
      mapContainer.id = 'anatomy-map-container';

      anatomyWrapper.appendChild(title);
      anatomyWrapper.appendChild(mapContainer);

      const firstStatCard = container.querySelector('.stat-card');
      if (firstStatCard) {
        container.insertBefore(anatomyWrapper, firstStatCard);
      } else {
        container.appendChild(anatomyWrapper);
      }
    }

    if (typeof AnatomyMap !== 'undefined') {
      const muscleData = calculateMuscleProgressions(trackingMap, allProgressionStates, exerciseGuide);
      AnatomyMap.render(document.getElementById('anatomy-map-container'), muscleData);
    }
  }

  /**
   * Render charts
   */
  function renderCharts(trackingMap, weightValues, metrics, currentWeekNum, planStartDateStr) {
    const container = document.getElementById('stats-charts');
    const weekNum = currentWeekNum || 1;

    // Progression Heatmap: Show ONLY days that have actually passed or been completed
    let maxCompletedIdx = -1;
    Object.values(trackingMap).forEach(t => {
      if (t && t.completed && t.dayIndex != null) {
        if (t.dayIndex > maxCompletedIdx) maxCompletedIdx = t.dayIndex;
      }
    });

    let daysPassedIdx = -1;
    if (planStartDateStr) {
      const startDateObj = new Date(planStartDateStr + 'T00:00:00');
      const todayObj = new Date(UI.getLocalDateString() + 'T00:00:00');
      const diffTime = Math.max(0, todayObj - startDateObj);
      daysPassedIdx = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    }

    const activePlanIdx = window.appCurrentPlanIndex != null ? window.appCurrentPlanIndex : 0;

    let endIdx = Math.max(maxCompletedIdx, daysPassedIdx, activePlanIdx);
    if (!planStartDateStr && maxCompletedIdx < 0) {
      endIdx = 0; // Program hasn't started yet: show Day 1 only
    } else {
      endIdx = Math.min(endIdx, allPlanDays.length - 1);
    }

    const heatmapDays = allPlanDays.slice(0, Math.max(1, endIdx + 1));

    const heatmapCells = heatmapDays.map((day, index) => {
      const dIdx = day.dayIndex != null ? day.dayIndex : index;
      const tracking = trackingMap[dIdx];
      const isCompleted = tracking && tracking.completed;
      let colorClass = 'heat-empty';

      if (isCompleted) {
        if (day.dayType && day.dayType.includes('Deload')) colorClass = 'heat-deload';
        else if (isStrengthDay(day.dayType)) colorClass = 'heat-strength';
        else if (day.dayType === 'Active Recovery') colorClass = 'heat-walk';
        else if (day.dayType === 'Rest') colorClass = 'heat-rest';
      }

      let rawDate = (tracking && (tracking.date || tracking.lastUpdated)) || day.date;
      if (!rawDate && planStartDateStr) {
        const startDateObj = new Date(planStartDateStr + 'T00:00:00');
        startDateObj.setDate(startDateObj.getDate() + dIdx);
        rawDate = UI.getLocalDateString(startDateObj);
      }

      const displayDate = formatCellDate(rawDate);
      const tooltip = `Day ${dIdx + 1} (${day.dayType}) ${displayDate ? '[' + displayDate + '] ' : ''}- ${isCompleted ? '✓' : I18n.t('heat_skipped')}`;
      return `<div class="heat-cell ${colorClass}" title="${tooltip}">${displayDate}</div>`;
    }).join('');

    const heatmapHtml = `
      <div class="chart-card" style="grid-column: 1 / -1; margin-bottom: var(--space-lg);">
        <div class="chart-title" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px;">
          <span>${I18n.t('heatmap_title')} (${heatmapDays.length})</span>
          <div style="display: flex; gap: 12px; font-size: 11px; font-weight: normal; flex-wrap: wrap;">
             <div style="display: flex; align-items: center; gap: 4px;"><div class="heat-cell heat-strength" style="width: 12px; height: 12px; border-radius: 3px;"></div> ${I18n.t('heat_strength')}</div>
             <div style="display: flex; align-items: center; gap: 4px;"><div class="heat-cell heat-deload" style="width: 12px; height: 12px; border-radius: 3px; background: #14b8a6;"></div> ${I18n.t('heat_deload')}</div>
             <div style="display: flex; align-items: center; gap: 4px;"><div class="heat-cell heat-walk" style="width: 12px; height: 12px; border-radius: 3px;"></div> ${I18n.t('heat_walk')}</div>
             <div style="display: flex; align-items: center; gap: 4px;"><div class="heat-cell heat-rest" style="width: 12px; height: 12px; border-radius: 3px;"></div> ${I18n.t('heat_rest')}</div>
             <div style="display: flex; align-items: center; gap: 4px;"><div class="heat-cell heat-empty" style="width: 12px; height: 12px; border-radius: 3px;"></div> ${I18n.t('heat_skipped')}</div>
          </div>
        </div>
        <div style="width: 100%; padding: var(--space-sm) 0; max-height: 340px; overflow-y: auto;">
          <div class="heatmap-grid">
            ${heatmapCells}
          </div>
        </div>
      </div>
    `;

    // Weight chart
    let weightChart = '';
    if (weightValues.length > 0) {
      const sortedWeights = weightValues.sort((a, b) => {
        const da = UI.parseDate(a.date);
        const db = UI.parseDate(b.date);
        return (da || 0) - (db || 0);
      });

      const minW = Math.min(...sortedWeights.map(w => w.weight));
      const maxW = Math.max(...sortedWeights.map(w => w.weight));
      const range = maxW - minW || 1;

      const recentWeights = sortedWeights.slice(-12);
      const weightBars = recentWeights.map(w => {
        const height = ((w.weight - minW + 0.5) / (range + 1)) * 100;
        return `
          <div class="chart-bar-container">
            <span class="chart-bar-value">${w.weight}</span>
            <div class="chart-bar" style="height: ${Math.max(height, 5)}%; background: linear-gradient(135deg, #10b981, #06b6d4)"></div>
            <span class="chart-bar-label">${UI.formatShortDate(w.date)}</span>
          </div>
        `;
      }).join('');

      weightChart = `
        <div class="chart-card">
          <div class="chart-title">${I18n.t('weight_chart_title')}</div>
          <div class="chart-bars">${weightBars}</div>
        </div>
      `;
    }

    // Compact Stat Cards (Placed at the very end)
    let compactStatsHtml = '';
    if (metrics) {
      compactStatsHtml = `
        <div class="chart-card" style="grid-column: 1 / -1; margin-top: 0; padding: 16px 18px;">
          <div class="chart-title" style="margin-bottom: 14px; font-size: 14px; color: var(--text-primary); display: flex; align-items: center; justify-content: space-between;">
            <span style="font-weight: 800; display: flex; align-items: center; gap: 6px;">${I18n.t('metrics_title')}</span>
          </div>
          <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px;">
            
            <div class="metric-box" style="background: var(--bg-input); border: 1px solid var(--border-color); border-radius: 12px; padding: 10px 6px; text-align: center; display: flex; flex-direction: column; align-items: center; justify-content: center;">
              <span style="font-size: 16px; margin-bottom: 2px;">📅</span>
              <span style="font-size: 17px; font-weight: 900; color: #60a5fa; line-height: 1.1;">${metrics.completed}</span>
              <span style="font-size: 11px; color: var(--text-secondary); font-weight: 600; line-height: 1.2; margin-top: 4px;">${I18n.t('metric_days_done')} (${metrics.total})</span>
            </div>

            <div class="metric-box" style="background: var(--bg-input); border: 1px solid var(--border-color); border-radius: 12px; padding: 10px 6px; text-align: center; display: flex; flex-direction: column; align-items: center; justify-content: center;">
              <span style="font-size: 16px; margin-bottom: 2px;">💪</span>
              <span style="font-size: 17px; font-weight: 900; color: #f97316; line-height: 1.1;">${metrics.strength}</span>
              <span style="font-size: 11px; color: var(--text-secondary); font-weight: 600; line-height: 1.2; margin-top: 4px;">${I18n.t('metric_strength')} (${metrics.totalStrength})</span>
            </div>

            <div class="metric-box" style="background: var(--bg-input); border: 1px solid var(--border-color); border-radius: 12px; padding: 10px 6px; text-align: center; display: flex; flex-direction: column; align-items: center; justify-content: center;">
              <span style="font-size: 16px; margin-bottom: 2px;">🚶</span>
              <span style="font-size: 17px; font-weight: 900; color: #10b981; line-height: 1.1;">${metrics.walk}</span>
              <span style="font-size: 11px; color: var(--text-secondary); font-weight: 600; line-height: 1.2; margin-top: 4px;">${I18n.t('metric_walk')} (${metrics.totalWalk})</span>
            </div>

            <div class="metric-box" style="background: var(--bg-input); border: 1px solid var(--border-color); border-radius: 12px; padding: 10px 6px; text-align: center; display: flex; flex-direction: column; align-items: center; justify-content: center;">
              <span style="font-size: 16px; margin-bottom: 2px;">📈</span>
              <span style="font-size: 17px; font-weight: 900; color: #a78bfa; line-height: 1.1;">${metrics.avgRPE}</span>
              <span style="font-size: 11px; color: var(--text-secondary); font-weight: 600; line-height: 1.2; margin-top: 4px;">${I18n.t('metric_avg_rpe')}</span>
            </div>

            <div class="metric-box" style="background: var(--bg-input); border: 1px solid var(--border-color); border-radius: 12px; padding: 10px 6px; text-align: center; display: flex; flex-direction: column; align-items: center; justify-content: center;">
              <span style="font-size: 16px; margin-bottom: 2px;">📅</span>
              <span style="font-size: 17px; font-weight: 900; color: #38bdf8; line-height: 1.1;">${metrics.monthPct}%</span>
              <span style="font-size: 11px; color: var(--text-secondary); font-weight: 600; line-height: 1.2; margin-top: 4px;">${I18n.t('metric_monthly')}</span>
            </div>

            <div class="metric-box" style="background: var(--bg-input); border: 1px solid var(--border-color); border-radius: 12px; padding: 10px 6px; text-align: center; display: flex; flex-direction: column; align-items: center; justify-content: center;">
              <span style="font-size: 16px; margin-bottom: 2px;">${metrics.currPct >= metrics.lastPct ? '📈' : '📉'}</span>
              <span style="font-size: 17px; font-weight: 900; color: ${metrics.currPct >= metrics.lastPct ? '#10b981' : '#f59e0b'}; line-height: 1.1;">${metrics.currPct}%</span>
              <span style="font-size: 11px; color: var(--text-secondary); font-weight: 600; line-height: 1.2; margin-top: 4px;">${I18n.t('metric_weekly')}</span>
            </div>

          </div>
        </div>
      `;
    }

    const currentWeekDays = allPlanDays.filter(d => d.week === `Week ${weekNum}`);
    const isDeloadWeek = currentWeekDays.some(d => d.dayType && d.dayType.toLowerCase().includes('deload'));
    const deloadBadgeHTML = isDeloadWeek
      ? `<span class="badge deload-week-badge" style="background: rgba(20, 184, 166, 0.2); color: #2dd4bf; border: 1px solid rgba(20, 184, 166, 0.4); padding: 4px 12px; border-radius: 12px; font-size: 11px; font-weight: 800; display: inline-flex; align-items: center; gap: 4px;">🌿 Deload Week</span>`
      : '';

    const leanDashboardHTML = `
      <div class="xp-container" style="grid-column: 1 / -1; background: var(--bg-card); padding: var(--space-lg); border-radius: var(--radius-lg); border: 1px solid ${isDeloadWeek ? 'rgba(20, 184, 166, 0.4)' : 'rgba(59, 130, 246, 0.3)'}; display: flex; flex-direction: column; gap: var(--space-md); margin-top: 12px;">
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="font-size: 22px;">⚡</span>
            <div>
              <div style="font-weight: 800; font-size: 16px; color: var(--accent-primary, #3b82f6);">${I18n.t('lean_program_title')} (Zero Decisions Engine)</div>
              <div style="font-size: 12px; color: var(--text-secondary);">Week ${weekNum} • Dynamic Progression & Adaptive Rest</div>
            </div>
          </div>
          <div style="display: flex; align-items: center; gap: 6px;">
            ${deloadBadgeHTML}
            <span class="badge" style="background: rgba(59, 130, 246, 0.15); color: #60a5fa; border: 1px solid rgba(59, 130, 246, 0.3); padding: 4px 10px; border-radius: 12px; font-size: 11px; font-weight: 700;">Active v15.6</span>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 10px;">
          <div style="background: rgba(0, 0, 0, 0.2); border: 1px solid ${isDeloadWeek ? 'rgba(20, 184, 166, 0.4)' : 'var(--border-color)'}; border-radius: 8px; padding: 10px;">
            <div style="font-size: 11px; color: var(--text-muted); font-weight: 600;">🌿 Deload Status</div>
            <div style="font-size: 13px; font-weight: 800; color: ${isDeloadWeek ? '#2dd4bf' : '#10b981'}; margin-top: 2px;">${isDeloadWeek ? '🌿 Deload Active (-20% Vol)' : '✅ Full Training Volume'}</div>
          </div>

          <div style="background: rgba(0, 0, 0, 0.2); border: 1px solid var(--border-color); border-radius: 8px; padding: 10px;">
            <div style="font-size: 11px; color: var(--text-muted); font-weight: 600;">💪 Biceps Microcycle</div>
            <div style="font-size: 13px; font-weight: 800; color: #ec4899; margin-top: 2px;">${(window.ProgressionEngine && window.ProgressionEngine.getBicepsMicrocyclePhase) ? window.ProgressionEngine.getBicepsMicrocyclePhase(weekNum).label : 'Heavy Progressive (8-10 reps)'}</div>
          </div>

          <div style="background: rgba(0, 0, 0, 0.2); border: 1px solid var(--border-color); border-radius: 8px; padding: 10px;">
            <div style="font-size: 11px; color: var(--text-muted); font-weight: 600;">📊 Weekly Volume Target</div>
            <div style="font-size: 13px; font-weight: 800; color: #3b82f6; margin-top: 2px;">Chest: ${isDeloadWeek ? '6' : '8'} sets • Back: ${isDeloadWeek ? '8' : '10'} sets</div>
          </div>

          <div style="background: rgba(0, 0, 0, 0.2); border: 1px solid var(--border-color); border-radius: 8px; padding: 10px;">
            <div style="font-size: 11px; color: var(--text-muted); font-weight: 600;">🛡️ Arm Block Exposure Guard</div>
            <div style="font-size: 13px; font-weight: 800; color: #10b981; margin-top: 2px;">Max 2/wk per area (Active)</div>
          </div>

          <div style="background: rgba(0, 0, 0, 0.2); border: 1px solid var(--border-color); border-radius: 8px; padding: 10px;">
            <div style="font-size: 11px; color: var(--text-muted); font-weight: 600;">🔄 Progression Policy</div>
            <div style="font-size: 13px; font-weight: 800; color: #f59e0b; margin-top: 2px;">Softened (Deload @ 2 Fails -15%)</div>
          </div>
        </div>
      </div>
    `;



    function renderHypertrophyVolumeChart(trackingMap, weekNum) {
      const muscleVolumes = { chest: 0, lats: 0, shoulders: 0, biceps: 0, triceps: 0, quads: 0, hamstrings: 0, calves: 0, core: 0 };
      const currentWeekDays = allPlanDays.filter(d => d.week === `Week ${weekNum}`);
      currentWeekDays.forEach(day => {
        const tracking = trackingMap[day.dayIndex];
        if (!tracking) return;
        const setData = tracking.setData || {};
        (day.exercises || []).forEach((ex, exIdx) => {
          const muscle = getMuscleForExercise(ex);
          if (muscle && muscleVolumes[muscle] !== undefined) {
            let setsCount = 3;
            if (typeof ex.sets === 'number') {
              setsCount = ex.sets;
            } else if (typeof ex.sets === 'string') {
              if (ex.sets.includes('sec') || ex.sets.includes('min') || ex.sets.includes('hold')) {
                setsCount = 1;
              } else {
                const parsed = parseInt(ex.sets, 10);
                setsCount = isNaN(parsed) ? 3 : parsed;
              }
            }

            const completedSets = getCompletedSetsForExercise(tracking, exIdx, setsCount);
            muscleVolumes[muscle] += Number(completedSets) || 0;
          }
        });
      });

      const muscleLabels = {
        chest: I18n.t('muscle_chest') || 'Chest',
        lats: I18n.t('muscle_lats') || 'Back / Lats',
        shoulders: I18n.t('muscle_shoulders') || 'Shoulders',
        biceps: I18n.t('muscle_biceps') || 'Biceps',
        triceps: I18n.t('muscle_triceps') || 'Triceps',
        quads: I18n.t('muscle_quads') || 'Quads',
        hamstrings: I18n.t('muscle_hamstrings') || 'Hamstrings & Glutes',
        calves: I18n.t('muscle_calves') || 'Calves',
        core: I18n.t('muscle_core') || 'Core'
      };

      const volumeItems = Object.entries(muscleVolumes).map(([mKey, sets]) => {
        let zoneTag = '🔵 MV';
        let zoneColor = '#3b82f6';
        if (sets >= 12 && sets <= 18) {
          zoneTag = '🎯 MAV (Optimal)';
          zoneColor = '#10b981';
        } else if (sets >= 8 && sets < 12) {
          zoneTag = '🟢 MEV (Effective)';
          zoneColor = '#22c55e';
        } else if (sets > 18) {
          zoneTag = '⚠️ MRV (High Load)';
          zoneColor = '#f59e0b';
        }
        const pct = Math.min(100, Math.round((sets / 20) * 100));

        return `
          <div style="margin-bottom: 10px;">
            <div style="display: flex; justify-content: space-between; align-items: center; font-size: 12px; margin-bottom: 4px;">
              <span style="font-weight: 800; color: var(--text-primary);">${muscleLabels[mKey] || mKey}</span>
              <div style="display: flex; align-items: center; gap: 6px;">
                <span style="font-size: 10px; font-weight: 800; padding: 2px 6px; border-radius: 6px; background: rgba(255,255,255,0.06); color: ${zoneColor};">${zoneTag}</span>
                <span style="font-weight: 900; color: ${zoneColor}; font-size: 13px;">${sets} sets/wk</span>
              </div>
            </div>
            <div style="width: 100%; height: 8px; background: var(--bg-input); border-radius: 4px; overflow: hidden;">
              <div style="height: 100%; width: ${Math.max(4, pct)}%; background: ${zoneColor}; border-radius: 4px; transition: width 0.8s ease;"></div>
            </div>
          </div>
        `;
      }).join('');

      return `
        <div class="chart-card" style="grid-column: 1 / -1; margin-bottom: var(--space-lg);">
          <div class="chart-title" style="display: flex; justify-content: space-between; align-items: center;">
            <span>💪 ${I18n.t('hypertrophy_analytics_title') || 'Hypertrophy Volume Analysis (Direct Sets/Wk)'}</span>
            <span style="font-size: 11px; color: var(--text-muted); font-weight: 600;">Week ${weekNum}</span>
          </div>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 16px; margin-top: 10px;">
            ${volumeItems}
          </div>
        </div>
      `;
    }

    const hypertrophyVolumeHTML = renderHypertrophyVolumeChart(trackingMap, weekNum);

    container.innerHTML = `
      ${heatmapHtml}
      ${weightChart}
      ${hypertrophyVolumeHTML}
      ${compactStatsHtml}
      ${leanDashboardHTML}
    `;
  }

  /**
   * Photo Management
   */
  async function handlePhotoUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    const img = new Image();
    img.onload = async () => {
      const canvas = document.createElement('canvas');
      const MAX_DIMENSION = 800;
      let width = img.naturalWidth || img.width;
      let height = img.naturalHeight || img.height;

      // Fit within MAX_DIMENSION while keeping aspect ratio
      if (width > height) {
        if (width > MAX_DIMENSION) {
          height = Math.round((height * MAX_DIMENSION) / width);
          width = MAX_DIMENSION;
        }
      } else {
        if (height > MAX_DIMENSION) {
          width = Math.round((width * MAX_DIMENSION) / height);
          height = MAX_DIMENSION;
        }
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);

      // Compress image: WebP with JPEG fallback
      let dataUrl = canvas.toDataURL('image/webp', 0.7);
      if (!dataUrl.startsWith('data:image/webp')) {
        dataUrl = canvas.toDataURL('image/jpeg', 0.75);
      }

      // Log optimization results for development/monitoring
      const originalSizeKB = (file.size / 1024).toFixed(1);
      const approxCompressedSize = Math.round((dataUrl.length - (dataUrl.indexOf(',') + 1)) * 0.75);
      const compressedSizeKB = (approxCompressedSize / 1024).toFixed(1);
      console.log(`[Photo Optimizer] Compressed: ${originalSizeKB} KB -> ${compressedSizeKB} KB (saved ${((1 - approxCompressedSize / file.size) * 100).toFixed(1)}%)`);

      await DB.savePhoto(Date.now().toString(), new Date().toISOString(), dataUrl);
      if (typeof CloudSync !== 'undefined' && CloudSync.scheduleSync) {
        CloudSync.scheduleSync();
      }
      UI.toast(I18n.t('photo_saved'), 'success');

      // Redirect to the "today" page after uploading
      if (typeof App !== 'undefined') {
        App.navigateTo('today');
      } else {
        render(); // Fallback just in case
      }
    };
    img.src = URL.createObjectURL(file);
  }

  async function renderPhotos() {
    const container = document.getElementById('stats-charts');
    const photos = await DB.getAllPhotos();

    let photosHtml = `
      <div class="chart-card" style="grid-column: 1 / -1; margin-bottom: var(--space-lg);">
        <div class="chart-title" style="display: flex; justify-content: space-between; align-items: center;">
          <span>${I18n.t('photo_tracker_title')}</span>
          <button id="add-photo-btn" class="btn-photo">
            <span style="font-size: 16px;">📷</span> ${I18n.t('photo_capture_btn')}
          </button>
          <input type="file" id="photo-upload-input" accept="image/*" capture="environment" style="display: none;">
        </div>
        <p style="font-size: 13px; color: var(--text-secondary); margin-bottom: 12px;">
          ${I18n.t('photo_recommended')}
        </p>
    `;

    if (photos.length > 0) {
      const photoCards = photos.map((p) => `
        <div class="photo-card" style="position: relative; border-radius: 8px; overflow: hidden; border: 1px solid var(--border-color); background: #000;">
          <img src="${p.dataUrl}" style="width: 100%; height: 150px; object-fit: cover; display: block; opacity: 0.9;">
          <div style="position: absolute; bottom: 0; left: 0; right: 0; background: rgba(0,0,0,0.7); color: white; padding: 4px 8px; font-size: 12px; text-align: center;">
            ${UI.formatShortDate(p.date)}
          </div>
          <button class="delete-photo-btn" data-id="${p.id}" style="position: absolute; top: 4px; right: 4px; background: rgba(220,38,38,0.9); color: white; border: none; border-radius: 50%; width: 24px; height: 24px; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 12px; box-shadow: 0 2px 4px rgba(0,0,0,0.3);">✕</button>
        </div>
      `).join('');

      photosHtml += `
        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(100px, 1fr)); gap: 8px; margin-bottom: 16px;">
          ${photoCards}
        </div>
        ${photos.length > 1 ? `<button id="play-timelapse-btn" class="btn-secondary" style="width: 100%;">${I18n.t('photo_play_timelapse')}</button>` : ''}
      `;
    } else {
      photosHtml += `<div style="text-align: center; padding: 24px; background: var(--bg-input); border-radius: 8px; color: var(--text-secondary);">${I18n.t('no_photos_yet')}</div>`;
    }

    photosHtml += `</div>`;

    // Prepend photos before the charts
    container.innerHTML = photosHtml + container.innerHTML;

    // Attach listeners
    const addBtn = document.getElementById('add-photo-btn');
    const fileInput = document.getElementById('photo-upload-input');
    if (addBtn && fileInput) {
      addBtn.addEventListener('click', () => fileInput.click());
      fileInput.addEventListener('change', handlePhotoUpload);
    }

    document.querySelectorAll('.delete-photo-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        if (confirm(I18n.t('delete_photo_confirm'))) {
          const id = btn.dataset.id;
          const photo = photos.find(p => String(p.id) === id);
          await DB.deletePhoto(photo ? photo.id : id);
          if (typeof CloudSync !== 'undefined' && CloudSync.scheduleSync) {
            CloudSync.scheduleSync();
          }
          render();
        }
      });
    });

    const playBtn = document.getElementById('play-timelapse-btn');
    if (playBtn) {
      playBtn.addEventListener('click', () => playTimelapse(photos));
    }
  }

  function playTimelapse(photos) {
    if (!photos || photos.length < 2) return;

    let currentIndex = 0;
    const modalContent = `
      <div style="text-align: center; padding-bottom: 16px;">
        <h3 style="margin-bottom: 16px; color: var(--text-primary);">${I18n.t('timelapse_title')}</h3>
        <div style="position: relative; width: 100%; max-width: 400px; margin: 0 auto; border-radius: 12px; overflow: hidden; background: #000; box-shadow: 0 10px 25px rgba(0,0,0,0.5);">
          <img id="timelapse-img" src="${photos[0].dataUrl}" style="width: 100%; height: auto; max-height: 60vh; object-fit: contain; display: block; transition: opacity 0.4s ease;">
          <div id="timelapse-date" style="position: absolute; bottom: 16px; left: 0; right: 0; text-align: center; color: white; font-weight: bold; font-size: 20px; text-shadow: 0 2px 6px rgba(0,0,0,0.9); background: linear-gradient(to top, rgba(0,0,0,0.8), transparent); padding: 20px 0 10px 0;">
            ${UI.formatShortDate(photos[0].date)}
          </div>
        </div>
        <div style="margin-top: 16px; color: var(--text-secondary); font-size: 14px;">
          ${I18n.t('timelapse_playing')}
        </div>
      </div>
    `;

    UI.showModal('', modalContent);
    // Remove the default modal header title to keep it clean
    const titleEl = document.getElementById('modal-title');
    if (titleEl) titleEl.textContent = '';

    const imgEl = document.getElementById('timelapse-img');
    const dateEl = document.getElementById('timelapse-date');

    const interval = setInterval(() => {
      currentIndex++;
      if (currentIndex >= photos.length) {
        clearInterval(interval);
        return;
      }

      imgEl.style.opacity = 0.3;
      setTimeout(() => {
        imgEl.src = photos[currentIndex].dataUrl;
        dateEl.textContent = UI.formatShortDate(photos[currentIndex].date);
        imgEl.style.opacity = 1;
      }, 200);

    }, 1500);

    // Stop interval if modal closed
    const modalClose = document.getElementById('modal-close');
    const oldClose = modalClose.onclick;
    modalClose.onclick = () => {
      clearInterval(interval);
      if (oldClose) {
        UI.hideModal();
      } else {
        UI.hideModal();
      }
    };
  }

  async function shareProgressCard() {
    const isLoggedIn = await CloudSync.isLoggedIn();
    if (!isLoggedIn) {
      UI.showModal('🔒 שיתוף חברתי למשתמשים מחוברים', `
        <div style="text-align: center; padding: 16px;">
          <p style="margin-bottom: 16px; color: var(--text-secondary);">אפשרות השיתוף החברתי זמינה בלעדית למשתמשים שהתחברו לחשבון גוגל.</p>
          <button id="share-login-btn" class="btn-primary" style="width: 100%;">🔗 התחבר עכשיו לחשבון גוגל</button>
        </div>
      `);
      document.getElementById('share-login-btn').onclick = () => {
        UI.hideModal();
        if (typeof App !== 'undefined') App.navigateTo('settings');
      };
      return;
    }

    const profile = await CloudSync.getUserProfile();
    const userName = profile?.name || 'מתאמן FitUp';
    const allTracking = await DB.getAllTracking();
    const completedDays = allTracking.filter(t => t.completed).length;
    let totalXP = 0;
    allTracking.forEach(t => { if (t.completed) totalXP += 500; });
    const currentLevel = Math.floor(Math.sqrt(totalXP / 500)) + 1;

    const canvas = document.createElement('canvas');
    canvas.width = 600;
    canvas.height = 600;
    const ctx = canvas.getContext('2d');

    const grad = ctx.createLinearGradient(0, 0, 600, 600);
    grad.addColorStop(0, '#0f172a');
    grad.addColorStop(0.5, '#1e1b4b');
    grad.addColorStop(1, '#0f172a');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 600, 600);

    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 4;
    ctx.strokeRect(20, 20, 560, 560);

    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 34px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('FITUP PRO ULTIMATE', 300, 80);

    ctx.fillStyle = '#38bdf8';
    ctx.font = '20px sans-serif';
    ctx.fillText('🔥 Workout Progress Card 🔥', 300, 115);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 26px sans-serif';
    ctx.fillText(userName, 300, 190);

    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.roundRect(80, 230, 440, 240, 16);
    ctx.fill();
    ctx.strokeStyle = '#334155';
    ctx.stroke();

    ctx.fillStyle = '#e2e8f0';
    ctx.font = 'bold 24px sans-serif';
    ctx.fillText(`⭐ ${I18n.t('level_label')} ${currentLevel}`, 300, 280);
    ctx.fillText(`🏆 ${totalXP.toLocaleString()} XP`, 300, 330);
    ctx.fillText(`📅 ${completedDays} אימונים הושלמו`, 300, 380);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '16px sans-serif';
    ctx.fillText('FitUp Pro • 78-Week Prescriptive Program', 300, 530);

    canvas.toBlob(async (blob) => {
      if (!blob) return;
      const file = new File([blob], 'fitup-progress.png', { type: 'image/png' });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({
            files: [file],
            title: 'FitUp Progress',
            text: `הנה ההתקדמות שלי ב-FitUp Pro! רמה ${currentLevel} עם ${totalXP} XP! 💪`
          });
        } catch (e) {
          console.warn('Share cancelled or failed:', e);
        }
      } else {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'fitup-progress.png';
        a.click();
        UI.toast('תמונת ההישגים הורדה בהצלחה! 📸', 'success');
      }
    });
  }

  return {
    init,
    render,
    calculateMuscleProgressions,
    getExerciseContributions,
    getMuscleForExercise,
    shareProgressCard
  };
})();

window.StatsPage = StatsPage;
