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

    // Render overview
    renderOverview(completedDays, totalDays, completedStrength, strengthDays.length,
                   completedWalk, walkDays.length, avgRPE, streak);

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
                          walk, totalWalk, avgRPE, streak) {
    const container = document.getElementById('stats-overview');

    const streakHTML = streak > 0 ? `
      <div class="streak-display">
        <span class="streak-fire">🔥</span>
        <div>
          <span class="streak-number">${streak}</span>
          <div class="streak-text">ימים ברצף!</div>
        </div>
      </div>
    ` : '';

    container.innerHTML = `
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
        <div class="stat-icon">🎯</div>
        <div class="stat-value">${total > 0 ? Math.round((completed / total) * 100) : 0}%</div>
        <div class="stat-label">אחוז השלמה כללי</div>
      </div>
    `;
  }

  /**
   * Render charts
   */
  function renderCharts(trackingMap, weightValues) {
    const container = document.getElementById('stats-charts');

    // Weekly completion chart
    const weeklyData = [];
    for (let w = 1; w <= 52; w++) {
      const weekLabel = `שבוע ${w}`;
      const weekDays = allPlanDays.filter(d => d.week === weekLabel);
      const completed = weekDays.filter(d => trackingMap[d.dayIndex] && trackingMap[d.dayIndex].completed).length;
      weeklyData.push({ week: w, completed, total: weekDays.length });
    }

    // Only show weeks that have some data
    const relevantWeeks = weeklyData.filter(w => w.completed > 0 || w.week <= (UI.findTodayIndex(allPlanDays) / 7 + 2));
    const displayWeeks = relevantWeeks.slice(0, 16); // Show up to 16 weeks

    const maxVal = Math.max(...displayWeeks.map(w => w.total), 1);

    const weeklyBars = displayWeeks.map(w => {
      const height = (w.completed / maxVal) * 100;
      return `
        <div class="chart-bar-container">
          <span class="chart-bar-value">${w.completed}</span>
          <div class="chart-bar" style="height: ${Math.max(height, 3)}%"></div>
          <span class="chart-bar-label">${w.week}</span>
        </div>
      `;
    }).join('');

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
      <div class="chart-card">
        <div class="chart-title">📊 השלמה שבועית</div>
        <div class="chart-bars">${weeklyBars}</div>
      </div>
      ${weightChart}
    `;
  }

  return {
    init,
    render
  };
})();
