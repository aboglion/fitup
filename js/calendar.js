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

    // Build standard Sunday-Saturday calendar weeks
    // First, we need to know the dayOfWeek of the very first day (dayIndex 0)
    const firstDay = allPlanDays[0];
    const dayNames = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
    const startOffset = dayNames.indexOf(firstDay.dayOfWeek);
    
    // Calculate which days belong to the requested currentWeekNum (1-indexed)
    // Week 1 starts with up to `startOffset` empty padding days.
    const weekDays = [];
    for (let i = 0; i < 7; i++) {
      const globalIdx = ((currentWeekNum - 1) * 7) + i - startOffset;
      if (globalIdx < 0 || globalIdx >= allPlanDays.length) {
        weekDays.push(null); // Empty pad
      } else {
        weekDays.push(allPlanDays[globalIdx]);
      }
    }

    // Get tracking data only for valid days
    const trackingPromises = weekDays.map(d => d ? DB.getDayTracking(d.dayIndex) : Promise.resolve(null));
    const trackingData = await Promise.all(trackingPromises);

    // Render calendar grid
    const grid = document.getElementById('calendar-grid');
    grid.innerHTML = weekDays.map((day, idx) => {
      if (!day) {
        // Empty placeholder for padding
        return `
          <div class="calendar-day empty" style="opacity: 0.3; cursor: default; background: transparent; border: 1px dashed var(--border-color);">
            <div class="calendar-day-name">${dayNames[idx]}</div>
            <div class="calendar-day-date">-</div>
          </div>
        `;
      }
      
      const tracking = trackingData[idx];
      const isCompleted = tracking && tracking.completed;
      const typeInfo = UI.getDayTypeInfo(day.dayType);
      const isToday = (day.dayIndex === window.appCurrentPlanIndex);
      const isDeload = typeInfo.isDeload || (day.dayType && day.dayType.includes('Deload'));

      return `
        <div class="calendar-day ${isToday ? 'today' : ''} ${isCompleted ? 'completed' : ''} ${isDeload ? 'deload-day' : ''}"
             onclick="CalendarPage.selectDay(${day.dayIndex})">
          <div class="calendar-day-name">${day.dayOfWeek}</div>
          <div class="calendar-day-date" dir="ltr">#${day.dayNum}</div>
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
