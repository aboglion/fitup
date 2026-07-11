/**
 * Main App Module - Initialization and navigation
 */
const App = (() => {
  let allPlanDays = [];
  let currentPage = 'today';

  /**
   * Initialize the application
   */
  async function init() {
    try {
      // Register Service Worker for PWA
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('./sw.js')
          .then(reg => console.log('SW registered!', reg))
          .catch(err => console.error('SW failed', err));
      }

      // Initialize IndexedDB
      await DB.init();

      // Check if plan is loaded or needs update
      const currentDataVersion = 19; // v3.3 program update
      const savedDataVersion = await DB.getSetting('dataVersion');
      
      let planStartDate = await DB.getSetting('planStartDate');
      
      const planCount = await DB.count(DB.STORES.PLAN);
      const exCount = await DB.count(DB.STORES.EXERCISES);
      
      if (planCount === 0 || exCount === 0 || savedDataVersion !== currentDataVersion || !planStartDate) {
        console.log("Reloading training plan due to data version change, empty DB, or missing start date.");
        await DB.loadTrainingPlan();
        await DB.setSetting('dataVersion', currentDataVersion);
      }

      // Load all plan data
      allPlanDays = await DB.getAllPlan();
      allPlanDays.sort((a, b) => a.dayIndex - b.dayIndex);

      // --- Strict Calendar Alignment ---
      // Instead of sequential progression, align the planIndex perfectly with the real calendar
      // so that chosen rest days always match the real days of the week.
      const todayStr = new Date().toISOString().slice(0, 10);
      let planStartDateStr = await DB.getSetting('planStartDate');
      
      let planIndex = 0; // Default to day 1
      
      if (planStartDateStr) {
        const todayDateObj = new Date(todayStr + 'T12:00:00');
        const startDateObj = new Date(planStartDateStr + 'T12:00:00');
        
        const diffTime = todayDateObj - startDateObj;
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        
        planIndex = diffDays;
        if (planIndex < 0) planIndex = 0;
        if (planIndex >= allPlanDays.length) {
          planIndex = allPlanDays.length - 1;
        }
      }

      await DB.setSetting('lastActiveDate', todayStr);
      await DB.setSetting('currentPlanIndex', planIndex);
      window.appCurrentPlanIndex = planIndex;
      // ----------------------------------

      // Initialize page modules
      await TodayPage.init(allPlanDays);
      CalendarPage.init(allPlanDays);
      await ExercisesPage.init();
      StatsPage.init(allPlanDays);

      // Setup navigation
      setupNavigation();

      // Setup settings
      setupSettings();

      // Setup Timer
      UI.initTimer();

      // Handle browser back/forward buttons
      window.addEventListener('popstate', (e) => {
        if (e.state && e.state.page) {
          navigateTo(e.state.page, false);
        } else {
          const hashPage = window.location.hash.replace('#', '') || 'today';
          navigateTo(hashPage, false);
        }
      });

      // Handle initial load based on URL hash
      const initialPage = window.location.hash.replace('#', '') || 'today';
      if (initialPage !== 'today') {
        currentPage = null; // force navigation
        navigateTo(initialPage, false);
      }
      window.history.replaceState({ page: initialPage }, '', `#${initialPage}`);

      // Hide splash, show app
      setTimeout(async () => {
        document.getElementById('splash-screen').classList.add('hidden');
        document.getElementById('app').classList.remove('hidden');
        await autoShiftPlan();
        checkPhotoReminder();
      }, 1600);

    } catch (error) {
      console.error('App init error:', error);
      document.getElementById('splash-screen').innerHTML = `
        <div class="splash-content">
          <div style="font-size: 48px; margin-bottom: 16px;">⚠️</div>
          <h2>שגיאה בטעינת האפליקציה</h2>
          <p style="color: var(--text-secondary); margin-top: 8px;">${error.message}</p>
          <button onclick="location.reload()" class="btn-primary" style="margin-top: 24px; width: auto; padding: 12px 32px;">
            🔄 נסה שוב
          </button>
        </div>
      `;
    }
  }

  /**
   * Setup navigation handlers
   */
  function setupNavigation() {
    // Desktop nav
    document.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', () => navigateTo(link.dataset.page));
    });

    // Mobile bottom nav
    document.querySelectorAll('.bottom-nav-link').forEach(link => {
      link.addEventListener('click', () => navigateTo(link.dataset.page));
    });
  }

  /**
   * Check if user needs to be reminded to take a progress photo
   */
  async function checkPhotoReminder() {
    const photos = await DB.getAllPhotos();
    const lastPhotoDate = photos.length > 0 ? new Date(photos[photos.length - 1].date) : null;
    
    let planStartDateStr = await DB.getSetting('planStartDate');
    if (!planStartDateStr) return; // Do not remind if program hasn't started
    
    const startDateObj = new Date(planStartDateStr + 'T12:00:00');
    const now = new Date();
    const daysSinceStart = Math.floor((now - startDateObj) / (1000 * 60 * 60 * 24));
    
    let shouldRemind = false;
    
    const snoozeUntil = await DB.getSetting('photoSnoozeUntil');
    if (snoozeUntil && new Date(snoozeUntil) > now) {
      return; // Snoozed
    }

    // Best frequency for a 52-week plan is 1 month (28 days / 4 weeks)
    // It perfectly aligns with a typical mesocycle.
    const REMINDER_DAYS = 28;

    let modalText = '';

    if (!lastPhotoDate) {
      shouldRemind = true;
      if (daysSinceStart < 14) {
        modalText = "ברוך הבא לתוכנית! 🚀 כדי שתוכל לראות את ההתקדמות שלך בצורה הטובה ביותר בעתיד, מומלץ מאוד לצלם תמונת 'לפני' עכשיו (ביום הראשון).";
      } else {
        modalText = "עוד לא צילמת תמונת מצב! כדי שתוכל לעקוב אחר השינויים בגוף לאורך התוכנית, מומלץ לצלם ולהעלות תמונה עכשיו.";
      }
    } else {
      const daysSinceLastPhoto = Math.floor((now - lastPhotoDate) / (1000 * 60 * 60 * 24));
      if (daysSinceLastPhoto >= REMINDER_DAYS) {
        shouldRemind = true;
        modalText = "עברו 4 שבועות מהתמונה האחרונה שלך. הגיע הזמן לתעד את השינוי! מומלץ לצלם ולהעלות תמונה עדכנית עכשיו.";
      }
    }

    if (shouldRemind) {
      setTimeout(() => {
        UI.showModal('זמן לתמונת התקדמות! 📸', `
          <div style="text-align: center;">
            <p style="margin-bottom: 16px; font-size: 15px; color: var(--text-secondary);">${modalText}</p>
            <button id="remind-go-btn" class="btn-primary" style="width: 100%; margin-bottom: 8px;">למעבר לעמוד התקדמות</button>
            <button id="remind-later-btn" class="btn-secondary" style="width: 100%;">הזכר לי מחר (נודניק)</button>
          </div>
        `);
        document.getElementById('remind-go-btn').onclick = () => {
          UI.hideModal();
          navigateTo('stats');
        };
        document.getElementById('remind-later-btn').onclick = async () => {
          const tomorrow = new Date();
          tomorrow.setDate(tomorrow.getDate() + 1);
          await DB.setSetting('photoSnoozeUntil', tomorrow.toISOString());
          UI.hideModal();
          UI.toast('נזכיר לך מחר! ⏰', 'info');
        };
      }, 1000); // 1s after splash closes
    }
  }

  /**
   * Automatically push the plan forward if the user missed a workout.
   * If today is physically past the next incomplete workout, we shift the start date
   * so that today becomes the next incomplete workout.
   */
  async function autoShiftPlan() {
    const allPlanDays = await DB.getAllPlan();
    const allTracking = await DB.getAllTracking();
    const planStartDateStr = await DB.getSetting('planStartDate');
    if (!planStartDateStr) return;

    let firstIncompleteWorkoutIndex = -1;
    for (let i = 0; i < allPlanDays.length; i++) {
      const day = allPlanDays[i];
      if (day.dayType !== 'Rest') {
        const track = allTracking.find(t => t.dayIndex === i);
        if (!track || !track.completed) {
          firstIncompleteWorkoutIndex = i;
          break;
        }
      }
    }

    if (firstIncompleteWorkoutIndex === -1) return; // All workouts completed!

    const startDateObj = new Date(planStartDateStr + 'T12:00:00');
    const now = new Date();
    const daysDiff = Math.floor((now - startDateObj) / (1000 * 60 * 60 * 24));

    if (daysDiff > firstIncompleteWorkoutIndex) {
      const shiftDays = daysDiff - firstIncompleteWorkoutIndex;
      startDateObj.setDate(startDateObj.getDate() + shiftDays);
      await DB.setSetting('planStartDate', startDateObj.toISOString().slice(0, 10));
      await DB.loadTrainingPlan();
      
      // We must reload the page so everything is synced to the new calendar
      location.reload();
    }
  }

  /**
   * Navigate to a page
   */
  function navigateTo(pageName, pushState = true) {
    if (pageName === 'calendar') pageName = 'today'; // Fallback for old cached URLs
    if (pageName === currentPage) return;
    
    const pageEl = document.getElementById(`page-${pageName}`);
    if (!pageEl) pageName = 'today'; // Safety fallback

    if (pushState) {
      window.history.pushState({ page: pageName }, '', `#${pageName}`);
    }

    currentPage = pageName;

    // Update nav active states
    document.querySelectorAll('.nav-link, .bottom-nav-link').forEach(link => {
      link.classList.toggle('active', link.dataset.page === pageName);
    });

    // Show/hide pages
    document.querySelectorAll('.page').forEach(page => {
      page.classList.remove('active');
    });
    document.getElementById(`page-${pageName}`).classList.add('active');

    // Trigger render for the activated page
    switch (pageName) {
      case 'today':
        TodayPage.render();
        break;
      case 'exercises':
        ExercisesPage.render();
        break;
      case 'stats':
        StatsPage.render();
        break;
    }
  }

  /**
   * Setup settings page handlers
   */
  function setupSettings() {
    // Export data
    document.getElementById('export-data-btn').addEventListener('click', async () => {
      try {
        const data = await DB.exportData();
        const json = JSON.stringify(data, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `fitup-backup-${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
        UI.toast('הנתונים יוצאו בהצלחה! 📤', 'success');
      } catch (e) {
        UI.toast('שגיאה בייצוא: ' + e.message, 'error');
      }
    });

    // Export Program Guide
    if (window.ExporterGuide) {
      window.ExporterGuide.init();
    }

    // Import data
    document.getElementById('import-data-input').addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      try {
        const text = await file.text();
        const data = JSON.parse(text);
        await DB.importData(data);
        UI.toast('הנתונים שוחזרו בהצלחה! 📥', 'success');
        // Refresh current page
        navigateTo(currentPage);
      } catch (err) {
        UI.toast('שגיאה בייבוא: ' + err.message, 'error');
      }
    });

    // Reload plan
    document.getElementById('reload-plan-btn').addEventListener('click', async () => {
      try {
        const count = await DB.loadTrainingPlan();
        allPlanDays = await DB.getAllPlan();
        allPlanDays.sort((a, b) => a.dayIndex - b.dayIndex);
        UI.toast(`תוכנית נטענה מחדש (${count} ימים) 🔄`, 'success');
        setTimeout(() => location.reload(), 1000);
      } catch (err) {
        UI.toast('שגיאה: ' + err.message, 'error');
      }
    });

    // Clear all data
    document.getElementById('clear-all-btn').addEventListener('click', async () => {
      if (confirm('⚠️ האם אתה בטוח שברצונך למחוק את כל הנתונים? פעולה זו בלתי הפיכה!')) {
        if (confirm('אישור אחרון - כל הנתונים ימחקו לצמיתות. להמשיך?')) {
          try {
            await DB.deleteDatabase();
            UI.toast('כל הנתונים נמחקו', 'info');
            setTimeout(() => location.reload(), 1000);
          } catch (err) {
            UI.toast('שגיאה: ' + err.message, 'error');
          }
        }
      }
    });

    // Theme toggle
    const currentTheme = localStorage.getItem('theme') || 'dark';
    if (currentTheme === 'light') {
      document.documentElement.classList.add('light-theme');
    }
    
    document.getElementById('theme-toggle-btn').addEventListener('click', () => {
      document.documentElement.classList.toggle('light-theme');
      const newTheme = document.documentElement.classList.contains('light-theme') ? 'light' : 'dark';
      localStorage.setItem('theme', newTheme);
      UI.toast(`מצב תצוגה שונה ל${newTheme === 'light' ? 'בהיר ☀️' : 'כהה 🌙'}`, 'info');
    });


  }

  return {
    init,
    navigateTo
  };
})();

// Start the app when DOM is ready
document.addEventListener('DOMContentLoaded', () => App.init());
