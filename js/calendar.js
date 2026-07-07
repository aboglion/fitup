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
  }



  /**
   * Select a day from calendar
   */
  function selectDay(dayIndex) {
    if (window.TodayPage) {
      TodayPage.goToDay(dayIndex);
      
      // Scroll to top of day view
      window.scrollTo({top: 0, behavior: 'smooth'});
    }
  }

  return {
    init,
    render,
    selectDay
  };
})();

// Expose to window for inline event handlers
window.CalendarPage = CalendarPage;
