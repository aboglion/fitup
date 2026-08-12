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
                   completedWalk, walkDays.length, avgRPE, streak, totalXP, currentLevel, xpForNextLevel, levelProgress, currPct, lastPct, monthPct);

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

    // Render charts & compact stats
    renderCharts(trackingMap, weightValues, metrics);

    // Render anatomy map
    renderAnatomy(trackingMap);

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
                          walk, totalWalk, avgRPE, streak, totalXP, currentLevel, xpForNextLevel, levelProgress, currPct, lastPct, monthPct) {
    const container = document.getElementById('stats-overview');

    const streakHTML = streak > 0 ? `
      <div class="streak-display" style="grid-column: 1 / -1; margin-bottom: 0;">
        <span class="streak-fire">🔥</span>
        <div>
          <span class="streak-number">${streak}</span>
          <div class="streak-text">ימים ברצף!</div>
        </div>
      </div>
    ` : '';

    const xpHTML = `
      <div class="xp-container" style="grid-column: 1 / -1; background: var(--bg-card); padding: var(--space-lg); border-radius: var(--radius-lg); border: 1px solid var(--border-color); display: flex; flex-direction: column; gap: var(--space-sm);">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="font-size: 24px;">⭐</span>
            <div>
              <div style="font-weight: 800; font-size: 18px; color: var(--text-primary);">רמה ${currentLevel}</div>
              <div style="font-size: 12px; color: var(--text-secondary);">${totalXP} / ${xpForNextLevel} XP</div>
            </div>
          </div>
          <div style="text-align: left;">
            <div style="font-size: 11px; font-weight: 600; color: var(--accent-primary); background: var(--bg-elevated); padding: 4px 10px; border-radius: 20px;">
              ${Math.round(levelProgress)}%
            </div>
          </div>
        </div>
        <div style="width: 100%; height: 8px; background: var(--bg-input); border-radius: 4px; overflow: hidden; margin-top: 4px;">
          <div style="height: 100%; width: ${levelProgress}%; background: var(--accent-gradient); transition: width 1s ease-out;"></div>
        </div>
      </div>
    `;

    const anatomyHTML = `
      <div id="anatomy-wrapper" style="grid-column: 1 / -1; margin-bottom: 0;">
        <div class="chart-title"><span>💪 מפת התקדמות שרירים</span></div>
        <div id="anatomy-map-container"></div>
      </div>
    `;

    container.innerHTML = `
      ${xpHTML}
      ${streakHTML}
      ${anatomyHTML}
    `;
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
      // Posterior Chain Synergist (DB Glute Bridge -> DB Hip Thrust 9-24kg)
      { stages: [1, 5, 10, 18, 26, 34, 42, 50, 53, 66], weight: 0.25, category: 'Legs' },
      // Unilateral Squat Assistance
      { stages: [1, 5, 18, 34, 53, 66], weight: 0.10, category: 'Legs' },
    ],
    glutes: [
      // Primary Hip Extension (DB Glute Bridge -> DB Hip Thrust 9-24kg with 2-3s pauses)
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
      // Hip Thrust Lumbar Stabilization
      { stages: [1, 5, 10, 18, 26, 34, 42, 50, 53, 66], weight: 0.25, category: 'Legs' },
      // Loaded Carry & Anti-Flexion Bracing (Suitcase Carry & Dead Bug)
      { stages: [1, 5, 18, 26, 34, 53, 66], weight: 0.15, category: 'Legs' },
    ],
  };

  /**
   * Calculate per-muscle progression percentages using weighted contributions.
   * Stage progress is based on current week progression in the 78-week plan.
   * Completion rate is calculated per category (Push, Pull, Legs, Cardio).
   * Formula: muscleProgress = Σ (exerciseStageProgress × weight) × categoryCompletionRate
   */
  function calculateMuscleProgressions(trackingMap) {
    const currentIdx = window.appCurrentPlanIndex != null 
      ? window.appCurrentPlanIndex 
      : (typeof UI !== 'undefined' ? UI.findTodayIndex(allPlanDays) : 0);
    const currentWeek = Math.floor(currentIdx / 7) + 1;
    const result = {};

    // Pre-calculate completion rates per category (Push, Pull, Legs, Cardio)
    const categoryStats = {
      Push: { total: 0, completed: 0 },
      Pull: { total: 0, completed: 0 },
      Legs: { total: 0, completed: 0 },
      Cardio: { total: 0, completed: 0 }
    };

    allPlanDays.forEach((day, index) => {
      const dIdx = day.dayIndex != null ? day.dayIndex : index;
      if (dIdx <= currentIdx) {
        const dt = day.dayType || '';
        const isPush = dt.includes('Push') || dt.includes('Strength A');
        const isPull = dt.includes('Pull') || dt.includes('Strength B');
        const isLegs = dt.includes('Legs');
        const isCardio = dt.includes('Recovery') || dt.includes('Zone') || dt.includes('VO2');

        const track = trackingMap[dIdx];
        let dayRatio = 0;
        if (track) {
          if (track.completed) {
            dayRatio = 1.0;
          } else if (track.exerciseStatus && day.exercises && day.exercises.length > 0) {
            const completedCount = Object.values(track.exerciseStatus).filter(Boolean).length;
            dayRatio = completedCount / day.exercises.length;
          }
        }

        if (isPush) {
          categoryStats.Push.total++;
          categoryStats.Push.completed += dayRatio;
        }
        if (isPull) {
          categoryStats.Pull.total++;
          categoryStats.Pull.completed += dayRatio;
        }
        if (isLegs) {
          categoryStats.Legs.total++;
          categoryStats.Legs.completed += dayRatio;
        }
        if (isCardio) {
          categoryStats.Cardio.total++;
          categoryStats.Cardio.completed += dayRatio;
        }
      }
    });

    const completionRates = {};
    for (const [cat, stat] of Object.entries(categoryStats)) {
      completionRates[cat] = stat.total > 0 ? stat.completed / stat.total : 0;
    }

    for (const [muscle, contributions] of Object.entries(MUSCLE_CONTRIBUTIONS)) {
      let weightedProgress = 0;
      let weightedCompletion = 0;

      for (const contrib of contributions) {
        // Stage progress for this contributing exercise
        let reached = 0;
        for (const week of contrib.stages) {
          if (currentWeek >= week) reached++;
        }
        const stageProgress = reached / contrib.stages.length;

        weightedProgress += stageProgress * contrib.weight;

        const cat = contrib.category || 'Push';
        const rate = completionRates[cat] != null ? completionRates[cat] : 0;
        weightedCompletion += rate * contrib.weight;
      }

      result[muscle] = Math.round(weightedProgress * 100 * weightedCompletion);
    }

    return result;
  }

  /**
   * Render anatomy map
   */
  function renderAnatomy(trackingMap) {
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
      title.innerHTML = '<span>💪 מפת התקדמות שרירים</span>';
      
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
      const muscleData = calculateMuscleProgressions(trackingMap);
      AnatomyMap.render(document.getElementById('anatomy-map-container'), muscleData);
    }
  }

  /**
   * Render charts
   */
  function renderCharts(trackingMap, weightValues, metrics) {
    const container = document.getElementById('stats-charts');

    // Progression Heatmap (up to current day)
    const todayIdx = UI.findTodayIndex(allPlanDays);
    const heatmapDays = allPlanDays.slice(0, todayIdx + 1);
    
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
      
      const tooltip = `יום ${dIdx + 1} (${day.dayType}) - ${isCompleted ? 'הושלם' : 'לא בוצע/דולג'}`;
      return `<div class="heat-cell ${colorClass}" title="${tooltip}"></div>`;
    }).join('');

    const heatmapHtml = `
      <div class="chart-card" style="grid-column: 1 / -1; margin-bottom: var(--space-lg);">
        <div class="chart-title" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px;">
          <span>🗓️ מפת התמדה (ימים שעברו)</span>
          <div style="display: flex; gap: 12px; font-size: 11px; font-weight: normal; flex-wrap: wrap;">
             <div style="display: flex; align-items: center; gap: 4px;"><div class="heat-cell heat-strength" style="width: 12px; height: 12px; border-radius: 3px;"></div> כוח</div>
             <div style="display: flex; align-items: center; gap: 4px;"><div class="heat-cell heat-deload" style="width: 12px; height: 12px; border-radius: 3px; background: #14b8a6;"></div> דילואד</div>
             <div style="display: flex; align-items: center; gap: 4px;"><div class="heat-cell heat-walk" style="width: 12px; height: 12px; border-radius: 3px;"></div> הליכה</div>
             <div style="display: flex; align-items: center; gap: 4px;"><div class="heat-cell heat-rest" style="width: 12px; height: 12px; border-radius: 3px;"></div> Rest</div>
             <div style="display: flex; align-items: center; gap: 4px;"><div class="heat-cell heat-empty" style="width: 12px; height: 12px; border-radius: 3px;"></div> לא בוצע/דולג</div>
          </div>
        </div>
        <div style="width: 100%; padding: var(--space-sm) 0; max-height: 80vh; overflow-y: auto;">
          <div style="display: grid; grid-template-columns: repeat(14, 1fr); gap: 4px; width: 100%;">
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
          <div class="chart-title">📊 מעקב משקל גוף</div>
          <div class="chart-bars">${weightBars}</div>
        </div>
      `;
    }

    // Compact Stat Cards (Placed at the very end)
    let compactStatsHtml = '';
    if (metrics) {
      compactStatsHtml = `
        <div class="chart-card" style="grid-column: 1 / -1; margin-top: 0; padding: 14px 16px;">
          <div class="chart-title" style="margin-bottom: 12px; font-size: 13px; color: var(--text-secondary); display: flex; align-items: center; justify-content: space-between;">
            <span style="font-weight: 700; display: flex; align-items: center; gap: 6px;">📊 מדדי תפוקה וסיכום</span>
          </div>
          <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px;">
            
            <div style="background: var(--bg-elevated); border: 1px solid var(--border-light); border-radius: 10px; padding: 8px 4px; text-align: center; display: flex; flex-direction: column; align-items: center; justify-content: center;">
              <span style="font-size: 13px; margin-bottom: 1px;">📅</span>
              <span style="font-size: 15px; font-weight: 900; color: var(--text-primary); line-height: 1.1;">${metrics.completed}</span>
              <span style="font-size: 9px; color: var(--text-muted); font-weight: 700; line-height: 1.1; margin-top: 2px;">ימים הושלמו (${metrics.total})</span>
            </div>

            <div style="background: var(--bg-elevated); border: 1px solid var(--border-light); border-radius: 10px; padding: 8px 4px; text-align: center; display: flex; flex-direction: column; align-items: center; justify-content: center;">
              <span style="font-size: 13px; margin-bottom: 1px;">💪</span>
              <span style="font-size: 15px; font-weight: 900; color: var(--text-primary); line-height: 1.1;">${metrics.strength}</span>
              <span style="font-size: 9px; color: var(--text-muted); font-weight: 700; line-height: 1.1; margin-top: 2px;">אימוני כוח (${metrics.totalStrength})</span>
            </div>

            <div style="background: var(--bg-elevated); border: 1px solid var(--border-light); border-radius: 10px; padding: 8px 4px; text-align: center; display: flex; flex-direction: column; align-items: center; justify-content: center;">
              <span style="font-size: 13px; margin-bottom: 1px;">🚶</span>
              <span style="font-size: 15px; font-weight: 900; color: var(--text-primary); line-height: 1.1;">${metrics.walk}</span>
              <span style="font-size: 9px; color: var(--text-muted); font-weight: 700; line-height: 1.1; margin-top: 2px;">ימי הליכה (${metrics.totalWalk})</span>
            </div>

            <div style="background: var(--bg-elevated); border: 1px solid var(--border-light); border-radius: 10px; padding: 8px 4px; text-align: center; display: flex; flex-direction: column; align-items: center; justify-content: center;">
              <span style="font-size: 13px; margin-bottom: 1px;">📈</span>
              <span style="font-size: 15px; font-weight: 900; color: var(--text-primary); line-height: 1.1;">${metrics.avgRPE}</span>
              <span style="font-size: 9px; color: var(--text-muted); font-weight: 700; line-height: 1.1; margin-top: 2px;">RPE ממוצע</span>
            </div>

            <div style="background: var(--bg-elevated); border: 1px solid var(--border-light); border-radius: 10px; padding: 8px 4px; text-align: center; display: flex; flex-direction: column; align-items: center; justify-content: center;">
              <span style="font-size: 13px; margin-bottom: 1px;">📅</span>
              <span style="font-size: 15px; font-weight: 900; color: var(--text-primary); line-height: 1.1;">${metrics.monthPct}%</span>
              <span style="font-size: 9px; color: var(--text-muted); font-weight: 700; line-height: 1.1; margin-top: 2px;">השלמה חודשית</span>
            </div>

            <div style="background: var(--bg-elevated); border: 1px solid var(--border-light); border-radius: 10px; padding: 8px 4px; text-align: center; display: flex; flex-direction: column; align-items: center; justify-content: center;">
              <span style="font-size: 13px; margin-bottom: 1px;">${metrics.currPct >= metrics.lastPct ? '📈' : '📉'}</span>
              <span style="font-size: 15px; font-weight: 900; color: ${metrics.currPct >= metrics.lastPct ? 'var(--success)' : 'var(--warning)'}; line-height: 1.1;">${metrics.currPct}%</span>
              <span style="font-size: 9px; color: var(--text-muted); font-weight: 700; line-height: 1.1; margin-top: 2px;">מגמה שבועית</span>
            </div>

          </div>
        </div>
      `;
    }

    container.innerHTML = `
      ${heatmapHtml}
      ${weightChart}
      ${compactStatsHtml}
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
      UI.toast('התמונה נשמרה בהצלחה!', 'success');
      
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
          <span>📸 מעקב תמונות מצב</span>
          <button id="add-photo-btn" class="btn-photo">
            <span style="font-size: 16px;">📷</span> צלם/העלה
          </button>
          <input type="file" id="photo-upload-input" accept="image/*" capture="environment" style="display: none;">
        </div>
        <p style="font-size: 13px; color: var(--text-secondary); margin-bottom: 12px;">
          מומלץ לצלם תמונה פעם ב-4 שבועות. התמונות נשמרות מקומית במכשיר שלך באופן מוקטן וחיסכוני.
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
        ${photos.length > 1 ? '<button id="play-timelapse-btn" class="btn-secondary" style="width: 100%;">▶️ נגן סרטון התקדמות</button>' : ''}
      `;
    } else {
      photosHtml += `<div style="text-align: center; padding: 24px; background: var(--bg-input); border-radius: 8px; color: var(--text-secondary);">עדיין אין תמונות. העלה תמונה ראשונה כדי להתחיל לעקוב!</div>`;
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
        if (confirm('האם אתה בטוח שברצונך למחוק תמונה זו?')) {
          const id = btn.dataset.id;
          const photo = photos.find(p => String(p.id) === id);
          await DB.deletePhoto(photo ? photo.id : id);
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
        <h3 style="margin-bottom: 16px; color: var(--text-primary);">סרטון התקדמות</h3>
        <div style="position: relative; width: 100%; max-width: 400px; margin: 0 auto; border-radius: 12px; overflow: hidden; background: #000; box-shadow: 0 10px 25px rgba(0,0,0,0.5);">
          <img id="timelapse-img" src="${photos[0].dataUrl}" style="width: 100%; height: auto; max-height: 60vh; object-fit: contain; display: block; transition: opacity 0.4s ease;">
          <div id="timelapse-date" style="position: absolute; bottom: 16px; left: 0; right: 0; text-align: center; color: white; font-weight: bold; font-size: 20px; text-shadow: 0 2px 6px rgba(0,0,0,0.9); background: linear-gradient(to top, rgba(0,0,0,0.8), transparent); padding: 20px 0 10px 0;">
            ${UI.formatShortDate(photos[0].date)}
          </div>
        </div>
        <div style="margin-top: 16px; color: var(--text-secondary); font-size: 14px;">
          מנגן...
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
        // Find existing listener or just hide modal
        UI.hideModal();
      } else {
        UI.hideModal();
      }
    };
  }

  return {
    init,
    render,
    calculateMuscleProgressions
  };
})();

window.StatsPage = StatsPage;
