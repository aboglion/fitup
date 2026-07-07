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
      const currentDataVersion = 13; // Bumped to force Smart Scheduling rebuild
      const savedDataVersion = await DB.getSetting('dataVersion');
      
      const planCount = await DB.count(DB.STORES.PLAN);
      const exCount = await DB.count(DB.STORES.EXERCISES);
      
      if (planCount === 0 || exCount === 0 || savedDataVersion !== currentDataVersion) {
        console.log("Reloading training plan due to data version change or empty DB.");
        await DB.loadTrainingPlan();
        await DB.setSetting('dataVersion', currentDataVersion);
      }

      // Load all plan data
      allPlanDays = await DB.getAllPlan();
      allPlanDays.sort((a, b) => a.dayIndex - b.dayIndex);

      // --- Sequence Progression Logic ---
      const todayStr = new Date().toISOString().slice(0, 10);
      let lastDate = await DB.getSetting('lastActiveDate');
      let planIndex = await DB.getSetting('currentPlanIndex');

      if (planIndex === null || planIndex === undefined) {
        planIndex = 0;
      } else if (lastDate && lastDate !== todayStr) {
        planIndex++;
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
      setTimeout(() => {
        document.getElementById('splash-screen').classList.add('hidden');
        document.getElementById('app').classList.remove('hidden');
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

    // Smart Scheduling Rest Days
    DB.getSetting('restDays').then(restDays => {
      const selected = restDays || [5, 6];
      document.querySelectorAll('.rest-day-cb').forEach(cb => {
        if (selected.includes(parseInt(cb.value))) {
          cb.checked = true;
        }
      });
    });

    document.getElementById('save-rest-days-btn').addEventListener('click', async () => {
      const selectedBoxes = Array.from(document.querySelectorAll('.rest-day-cb:checked'));
      if (selectedBoxes.length !== 2) {
        UI.toast('יש לבחור בדיוק 2 ימי מנוחה', 'warning');
        return;
      }
      
      const newRestDays = selectedBoxes.map(cb => parseInt(cb.value));
      try {
        await DB.setSetting('restDays', newRestDays);
        // Force rebuild of training plan
        const count = await DB.loadTrainingPlan();
        allPlanDays = await DB.getAllPlan();
        allPlanDays.sort((a, b) => a.dayIndex - b.dayIndex);
        
        UI.toast('ימי המנוחה נשמרו! התוכנית חושבה מחדש 🗓️', 'success');
        setTimeout(() => location.reload(), 1500);
      } catch (err) {
        UI.toast('שגיאה: ' + err.message, 'error');
      }
    });
  }

  return {
    init,
    navigateTo
  };
})();

// Start the app when DOM is ready
document.addEventListener('DOMContentLoaded', () => App.init());
