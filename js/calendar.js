/**
 * Calendar Page Module
 */
const CalendarPage = (() => {
  let allPlanDays = [];
  let currentWeekNum = 1;
  const totalWeeks = 52;

  /**
   * Initialize
   */
  function init(planDays) {
    allPlanDays = planDays;

    // Find current week
    const todayIdx = UI.findTodayIndex(planDays);
    const todayDay = planDays[todayIdx];
    if (todayDay && todayDay.week) {
      const match = todayDay.week.match(/\d+/);
      if (match) currentWeekNum = parseInt(match[0]);
    }

    document.getElementById('cal-prev-week').addEventListener('click', () => navigateWeek(-1));
    document.getElementById('cal-next-week').addEventListener('click', () => navigateWeek(1));
  }

  /**
   * Navigate weeks
   */
  function navigateWeek(offset) {
    const newWeek = currentWeekNum + offset;
    if (newWeek >= 1 && newWeek <= totalWeeks) {
      currentWeekNum = newWeek;
      render();
    }
  }

  /**
   * Render calendar page
   */
  async function render() {
    const weekLabel = `שבוע ${currentWeekNum}`;
    document.getElementById('cal-week-label').textContent = weekLabel;

    // Get days for this week
    const weekDays = allPlanDays.filter(d => d.week === weekLabel);

    // Get tracking data
    const trackingPromises = weekDays.map(d => DB.getDayTracking(d.dayIndex));
    const trackingData = await Promise.all(trackingPromises);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Render calendar grid
    const grid = document.getElementById('calendar-grid');
    grid.innerHTML = weekDays.map((day, idx) => {
      const tracking = trackingData[idx];
      const isCompleted = tracking && tracking.completed;
      const typeInfo = UI.getDayTypeInfo(day.dayType);
      const isToday = (day.dayIndex === window.appCurrentPlanIndex);

      return `
        <div class="calendar-day ${isToday ? 'today' : ''} ${isCompleted ? 'completed' : ''}"
             onclick="CalendarPage.selectDay(${day.dayIndex})">
          <div class="calendar-day-name">${day.dayOfWeek}</div>
          <div class="calendar-day-date">${day.dayNum}</div>
          <span class="calendar-day-type ${typeInfo.class}">${typeInfo.label}</span>
        </div>
      `;
    }).join('');

    // Render week stats
    renderWeekStats(weekDays, trackingData);
  }

  /**
   * Render week statistics
   */
  function renderWeekStats(weekDays, trackingData) {
    const container = document.getElementById('week-stats');

    let completedDays = 0;
    let strengthDays = 0;
    let walkDays = 0;
    let totalRPE = 0;
    let rpeCount = 0;

    weekDays.forEach((day, idx) => {
      const tracking = trackingData[idx];
      if (tracking && tracking.completed) completedDays++;
      if (day.dayType === 'כוח') strengthDays++;
      if (day.dayType === 'הליכה') walkDays++;
      if (tracking && tracking.actualRPE) {
        totalRPE += tracking.actualRPE;
        rpeCount++;
      }
    });

    const avgRPE = rpeCount > 0 ? (totalRPE / rpeCount).toFixed(1) : '—';

    container.innerHTML = `
      <h3 style="font-size: 16px; font-weight: 700; margin-bottom: 16px;">סיכום שבוע ${currentWeekNum}</h3>
      <div class="week-stats-grid">
        <div class="week-stat">
          <div class="week-stat-value">${completedDays}/${weekDays.length}</div>
          <div class="week-stat-label">ימים הושלמו</div>
        </div>
        <div class="week-stat">
          <div class="week-stat-value">${strengthDays}</div>
          <div class="week-stat-label">אימוני כוח 💪</div>
        </div>
        <div class="week-stat">
          <div class="week-stat-value">${walkDays}</div>
          <div class="week-stat-label">ימי הליכה 🚶</div>
        </div>
        <div class="week-stat">
          <div class="week-stat-value">${avgRPE}</div>
          <div class="week-stat-label">RPE ממוצע</div>
        </div>
      </div>
    `;
  }

  /**
   * Select a day from calendar
   */
  function selectDay(dayIndex) {
    TodayPage.goToDay(dayIndex);
    // Switch to today page
    App.navigateTo('today');
  }

  return {
    init,
    render,
    selectDay
  };
})();
