/**
 * Statistics Page Module
 */
const StatsPage = (() => {
  let allPlanDays = [];

  const STRENGTH_TYPES = ['Workout A', 'Workout B', 'Workout C'];
  const isStrengthDay = (dayType) => STRENGTH_TYPES.includes(dayType);


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

    // Render charts
    renderCharts(trackingMap, weightValues);

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

    container.innerHTML = `
      ${xpHTML}
      ${streakHTML}
      <div class="stat-card">
        <div class="stat-icon">📅</div>
        <div class="stat-value">${completed}</div>
        <div class="stat-label">ימים הושלמו מתוך ${total}</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">💪</div>
        <div class="stat-value">${strength}</div>
        <div class="stat-label">אימוני כוח מתוך ${totalStrength}</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">🚶</div>
        <div class="stat-value">${walk}</div>
        <div class="stat-label">ימי הליכה מתוך ${totalWalk}</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">📈</div>
        <div class="stat-value">${avgRPE}</div>
        <div class="stat-label">RPE ממוצע</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">📅</div>
        <div class="stat-value">${monthPct}%</div>
        <div class="stat-label">השלמה חודשית (30 ימים)</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">${currPct >= lastPct ? '📈' : '📉'}</div>
        <div class="stat-value" style="color: ${currPct >= lastPct ? 'var(--success)' : 'var(--warning)'};">${currPct}%</div>
        <div class="stat-label">מגמת השלמה שבועית</div>
      </div>
    `;
  }

  /**
   * Weighted multi-exercise contribution model.
   * Each muscle is trained by multiple exercises — each with its own progression
   * stages, weight (0-1 summing to 1), and relevant day type.
   * Formula: muscleProgress = Σ(stageProgress_i × weight_i) × completionRate
   */
  const MUSCLE_CONTRIBUTIONS = {
    chest: [
      // Push-up chain: Table→Knee→Push-up→Close-Grip→Diamond→Decline→Archer→One-Arm→Pseudo-Planche
      { stages: [1,4,7,10,13,16,22,25], weight: 0.75, dayType: 'Push + Skill' },
      // Pike/OHP chain: upper chest activation
      { stages: [1,4,7,10,13,19,25], weight: 0.15, dayType: 'Push + Skill' },
      // Band Pull-Apart / Prone Y-T-W: prehab (minor chest stretch)
      { stages: [1,5,9], weight: 0.10, dayType: 'Push + Skill' },
    ],
    shoulders: [
      // Pike→HSPU chain (primary OHP)
      { stages: [1,4,7,10,13,19,25], weight: 0.45, dayType: 'Push + Skill' },
      // Push-up chain (anterior delt involvement)
      { stages: [1,4,7,10,13,16,22,25], weight: 0.20, dayType: 'Push + Skill' },
      // Band Pull-Apart (rear delt)
      { stages: [1,5,9], weight: 0.15, dayType: 'Push + Skill' },
      // Prone Y-T-W (rotator cuff / rear delt)
      { stages: [1], weight: 0.10, dayType: 'Push + Skill' },
      // Handstand Practice (stability / all heads)
      { stages: [1], weight: 0.10, dayType: 'Push + Skill' },
    ],
    triceps: [
      // Push-up chain (all push-ups train triceps)
      { stages: [1,4,7,10,13,16,22,25], weight: 0.40, dayType: 'Push + Skill' },
      // Close-Grip / Diamond emphasis (extra triceps)
      { stages: [1,7,10], weight: 0.25, dayType: 'Push + Skill' },
      // Pike/HSPU chain (lockout = triceps heavy)
      { stages: [1,4,7,10,13,19,25], weight: 0.35, dayType: 'Push + Skill' },
    ],
    biceps: [
      // Pull-up/Chin-up progression (compound, major biceps builder)
      { stages: [1,4,10,13,19,25], weight: 0.40, dayType: 'Pull + Grip' },
      // Band Curl (isolation, weight progression: 30→40→50kg)
      { stages: [1,17,33], weight: 0.35, dayType: 'Pull + Grip' },
      // Seated Band Row (secondary biceps engagement)
      { stages: [1,5,13], weight: 0.25, dayType: 'Pull + Grip' },
    ],
    forearms: [
      // Dead Hang → Towel Hang
      { stages: [1,7], weight: 0.35, dayType: 'Pull + Grip' },
      // Pull-up progression (grip demand increases)
      { stages: [1,4,10,13,19,25], weight: 0.30, dayType: 'Pull + Grip' },
      // Band Curl (wrist flexors)
      { stages: [1,17,33], weight: 0.15, dayType: 'Pull + Grip' },
      // Seated Band Row (grip)
      { stages: [1,5,13], weight: 0.20, dayType: 'Pull + Grip' },
    ],
    lats: [
      // Pull-up/Chin-up progression (primary lat exercise)
      { stages: [1,4,10,13,19,25], weight: 0.60, dayType: 'Pull + Grip' },
      // Seated Band Row (horizontal pull, lat secondary)
      { stages: [1,5,13], weight: 0.30, dayType: 'Pull + Grip' },
      // Scapular Pull-up (lat activation)
      { stages: [1], weight: 0.10, dayType: 'Pull + Grip' },
    ],
    traps: [
      // Seated Band Row (upper back, traps secondary)
      { stages: [1,5,13], weight: 0.35, dayType: 'Pull + Grip' },
      // Band Pull-Apart (mid traps / rhomboids)
      { stages: [1,5,9], weight: 0.30, dayType: 'Push + Skill' },
      // Prone Y-T-W (lower traps)
      { stages: [1], weight: 0.15, dayType: 'Push + Skill' },
      // Pull-up (upper traps)
      { stages: [1,4,10,13,19,25], weight: 0.20, dayType: 'Pull + Grip' },
    ],
    quads: [
      // Squat progression (primary): BW→Lunge→Split→Bulgarian→Skater→Pistol
      { stages: [1,4,7,13,19,25,28], weight: 0.70, dayType: 'Legs + Core' },
      // Light leg stimulus on Push day
      { stages: [1,10,19], weight: 0.15, dayType: 'Push + Skill' },
      // Calf Raise (minor knee stabilization)
      { stages: [1,4], weight: 0.05, dayType: 'Legs + Core' },
      // Walking (Active Recovery — light quad usage)
      { stages: [1], weight: 0.10, dayType: 'Active Recovery' },
    ],
    hamstrings: [
      // RDL / Towel Curl progression (primary)
      { stages: [1,7,10], weight: 0.50, dayType: 'Legs + Core' },
      // Glute Bridge (hamstring synergist)
      { stages: [1,13], weight: 0.25, dayType: 'Legs + Core' },
      // Squat progression (eccentric hamstring work)
      { stages: [1,4,7,13,19,25,28], weight: 0.15, dayType: 'Legs + Core' },
      // Walking
      { stages: [1], weight: 0.10, dayType: 'Active Recovery' },
    ],
    glutes: [
      // Glute Bridge progression (primary)
      { stages: [1,13], weight: 0.40, dayType: 'Legs + Core' },
      // Squat progression (deep squat = glute activation)
      { stages: [1,4,7,13,19,25,28], weight: 0.25, dayType: 'Legs + Core' },
      // RDL / hip hinge (glute max)
      { stages: [1,7,10], weight: 0.20, dayType: 'Legs + Core' },
      // Light leg on Push day
      { stages: [1,10,19], weight: 0.10, dayType: 'Push + Skill' },
      // Walking
      { stages: [1], weight: 0.05, dayType: 'Active Recovery' },
    ],
    calves: [
      // Calf Raise → Single-Leg Calf Raise (primary)
      { stages: [1,4], weight: 0.65, dayType: 'Legs + Core' },
      // Walking (Active Recovery)
      { stages: [1], weight: 0.25, dayType: 'Active Recovery' },
      // Squat (ankle stability)
      { stages: [1,4,7,13,19,25,28], weight: 0.10, dayType: 'Legs + Core' },
    ],
    core: [
      // Core progression: Dead Bug→Hollow→H2A→L-sit→Dragon Flag (primary)
      { stages: [1,4,10,13,16,19,22,25], weight: 0.55, dayType: 'Legs + Core' },
      // L-sit on Pull day (secondary core)
      { stages: [1,13,16], weight: 0.15, dayType: 'Pull + Grip' },
      // Side Plank Hip Dip (core stability)
      { stages: [1], weight: 0.10, dayType: 'Pull + Grip' },
      // Push-up/plank stabilization
      { stages: [1,4,7,10,13,16,22,25], weight: 0.10, dayType: 'Push + Skill' },
      // Squat (core bracing)
      { stages: [1,4,7,13,19,25,28], weight: 0.10, dayType: 'Legs + Core' },
    ],
    obliques: [
      // Side Plank Hip Dip (primary oblique exercise)
      { stages: [1], weight: 0.40, dayType: 'Pull + Grip' },
      // L-sit progression (oblique stabilization)
      { stages: [1,13,16], weight: 0.25, dayType: 'Pull + Grip' },
      // Dragon Flag (anti-rotation, oblique engagement)
      { stages: [1,4,10,13,16,19,22,25], weight: 0.20, dayType: 'Legs + Core' },
      // Hollow Body (anti-extension, oblique co-contraction)
      { stages: [1,4,10], weight: 0.15, dayType: 'Legs + Core' },
    ],
    lowerBack: [
      // RDL / Towel Curl (posterior chain — erector spinae)
      { stages: [1,7,10], weight: 0.40, dayType: 'Legs + Core' },
      // Dragon Flag (spinal erector co-contraction)
      { stages: [1,4,10,13,16,19,22,25], weight: 0.25, dayType: 'Legs + Core' },
      // Squat (lower back stabilization)
      { stages: [1,4,7,13,19,25,28], weight: 0.20, dayType: 'Legs + Core' },
      // Dead Bug (lumbar stabilization)
      { stages: [1], weight: 0.15, dayType: 'Legs + Core' },
    ],
  };

  /**
   * Calculate per-muscle progression percentages using weighted contributions.
   * Each muscle = Σ (exerciseStageProgress × weight) × completionRate
   */
  function calculateMuscleProgressions(trackingMap) {
    const currentWeek = Math.floor((window.appCurrentPlanIndex || 0) / 7) + 1;
    const currentIdx = window.appCurrentPlanIndex || 0;
    const result = {};

    // Pre-calculate completion rates per day type
    const completionRates = {};
    ['Push + Skill', 'Pull + Grip', 'Legs + Core', 'Active Recovery'].forEach(dt => {
      let total = 0, completed = 0;
      allPlanDays.forEach(day => {
        if (day.dayType === dt && day.dayIndex <= currentIdx) {
          total++;
          if (trackingMap[day.dayIndex] && trackingMap[day.dayIndex].completed) completed++;
        }
      });
      completionRates[dt] = total > 0 ? completed / total : 0;
    });

    for (const [muscle, contributions] of Object.entries(MUSCLE_CONTRIBUTIONS)) {
      let weightedProgress = 0;
      let totalCompletionWeight = 0;

      for (const contrib of contributions) {
        // Stage progress for this contributing exercise
        let reached = 0;
        for (const week of contrib.stages) {
          if (currentWeek >= week) reached++;
        }
        const stageProgress = reached / contrib.stages.length;

        weightedProgress += stageProgress * contrib.weight;

        // Weighted completion rate (each contribution uses its own day type)
        totalCompletionWeight += (completionRates[contrib.dayType] || 0) * contrib.weight;
      }

      // Final: weighted stage progress × weighted completion rate
      result[muscle] = Math.round(weightedProgress * 100 * (totalCompletionWeight > 0 ? totalCompletionWeight : 0));
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
      
      // Append to stats-overview
      container.appendChild(anatomyWrapper);
    }
    
    if (typeof AnatomyMap !== 'undefined') {
      const muscleData = calculateMuscleProgressions(trackingMap);
      AnatomyMap.render(document.getElementById('anatomy-map-container'), muscleData);
    }
  }

  /**
   * Render charts
   */
  function renderCharts(trackingMap, weightValues) {
    const container = document.getElementById('stats-charts');

    // Progression Heatmap (up to current day)
    const todayIdx = UI.findTodayIndex(allPlanDays);
    const heatmapDays = allPlanDays.slice(0, todayIdx + 1);
    
    const heatmapCells = heatmapDays.map(day => {
      const tracking = trackingMap[day.dayIndex];
      const isCompleted = tracking && tracking.completed;
      let colorClass = 'heat-empty';
      
      if (isCompleted) {
        if (isStrengthDay(day.dayType)) colorClass = 'heat-strength';
        else if (day.dayType === 'Active Recovery') colorClass = 'heat-walk';
        else if (day.dayType === 'Rest') colorClass = 'heat-rest';
      }
      
      const tooltip = `יום ${day.dayIndex + 1} (${day.dayType}) - ${isCompleted ? 'הושלם' : 'לא בוצע/דולג'}`;
      return `<div class="heat-cell ${colorClass}" title="${tooltip}"></div>`;
    }).join('');

    const heatmapHtml = `
      <div class="chart-card" style="grid-column: 1 / -1; margin-bottom: var(--space-lg);">
        <div class="chart-title" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px;">
          <span>🗓️ מפת התמדה (ימים שעברו)</span>
          <div style="display: flex; gap: 12px; font-size: 11px; font-weight: normal; flex-wrap: wrap;">
             <div style="display: flex; align-items: center; gap: 4px;"><div class="heat-cell heat-strength" style="width: 12px; height: 12px; border-radius: 3px;"></div> כוח</div>
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

    container.innerHTML = `
      ${heatmapHtml}
      ${weightChart}
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
    render
  };
})();
