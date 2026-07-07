/**
 * Statistics Page Module
 */
const StatsPage = (() => {
  let allPlanDays = [];

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

    const strengthDays = allPlanDays.filter(d => d.dayType === 'כוח');
    const completedStrength = strengthDays.filter(d => trackingMap[d.dayIndex] && trackingMap[d.dayIndex].completed).length;

    const walkDays = allPlanDays.filter(d => d.dayType === 'הליכה');
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
          if (day.dayType === 'כוח') totalXP += 500;
          else if (day.dayType === 'הליכה') totalXP += 200;
          else if (day.dayType === 'מנוחה') totalXP += 50;
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
    const currentWeekDays = allPlanDays.filter(d => d.week === `שבוע ${currentWeekNum}`);
    const lastWeekDays = allPlanDays.filter(d => d.week === `שבוע ${currentWeekNum - 1}`);
    
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

      if (day.dayType === 'מנוחה') {
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
   * Render charts
   */
  function renderCharts(trackingMap, weightValues) {
    const container = document.getElementById('stats-charts');

    // 365-Day Heatmap
    // Remove the last day (slice to 364) to make it a perfect multiple of 14, creating a symmetric table
    const heatmapDays = allPlanDays.slice(0, 364);
    const heatmapCells = heatmapDays.map(day => {
      const tracking = trackingMap[day.dayIndex];
      const isCompleted = tracking && tracking.completed;
      let colorClass = 'heat-empty';
      
      if (isCompleted) {
        if (day.dayType === 'כוח') colorClass = 'heat-strength';
        else if (day.dayType === 'הליכה') colorClass = 'heat-walk';
        else if (day.dayType === 'מנוחה') colorClass = 'heat-rest';
      }
      
      const tooltip = `יום ${day.dayIndex + 1} (${day.dayType}) - ${isCompleted ? 'הושלם' : 'לא הושלם'}`;
      return `<div class="heat-cell ${colorClass}" title="${tooltip}"></div>`;
    }).join('');

    const heatmapHtml = `
      <div class="chart-card" style="grid-column: 1 / -1; margin-bottom: var(--space-lg);">
        <div class="chart-title" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px;">
          <span>🗓️ מפת התמדה שנתית (365 ימים)</span>
          <div style="display: flex; gap: 12px; font-size: 11px; font-weight: normal; flex-wrap: wrap;">
             <div style="display: flex; align-items: center; gap: 4px;"><div class="heat-cell heat-strength" style="width: 12px; height: 12px; border-radius: 3px;"></div> כוח</div>
             <div style="display: flex; align-items: center; gap: 4px;"><div class="heat-cell heat-walk" style="width: 12px; height: 12px; border-radius: 3px;"></div> הליכה</div>
             <div style="display: flex; align-items: center; gap: 4px;"><div class="heat-cell heat-rest" style="width: 12px; height: 12px; border-radius: 3px;"></div> מנוחה</div>
             <div style="display: flex; align-items: center; gap: 4px;"><div class="heat-cell heat-empty" style="width: 12px; height: 12px; border-radius: 3px;"></div> ריק</div>
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

  return {
    init,
    render
  };
})();
