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

      // Check if this is a new installation but we have an encrypted URL in config
      let savedUrl = await DB.getSetting('cloudSyncUrl');
      const hasEncryptedUrl = CONFIG && CONFIG.encryptedUrl && CONFIG.encryptedUrl.length > 10;
      
      const planCount = await DB.count(DB.STORES.PLAN);
      
      if (!savedUrl && hasEncryptedUrl && planCount === 0) {
        // App is empty and we have an encrypted config, show Login Screen!
        return showLoginScreen();
      }

      await loadAppCore();
    } catch (error) {
      console.error('App init error:', error);
      showErrorScreen(error.message);
    }
  }

  /**
   * Load the core app after authentication or if no auth needed
   */
  async function loadAppCore() {
    try {
      const currentDataVersion = 21; // v5.0 program update
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

      // --- Auto-complete passed Rest days ---
      await DB.syncRestDays(allPlanDays);

      // --- Sequential Progress-Based Alignment ---
      // Find the first incomplete day index
      let planIndex = 0;
      const allTracking = await DB.getAllTracking();
      for (let i = 0; i < allPlanDays.length; i++) {
        const track = allTracking.find(t => t.dayIndex === i);
        if (!track || !track.completed) {
          planIndex = i;
          break;
        }
      }
      
      // If we haven't started yet and index points to a Rest day, skip to the first workout day
      let planStartDateStr = await DB.getSetting('planStartDate');
      if (!planStartDateStr && allPlanDays[planIndex]?.dayType === 'Rest') {
        planIndex++;
      }

      // Update dynamic dates and day names in-memory
      updatePlanDaysDates(allPlanDays, planIndex);

      const todayStr = UI.getLocalDateString();
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

      // Hide splash and login, show app
      document.getElementById('splash-screen').classList.add('hidden');
      const loginScreen = document.getElementById('login-screen');
      if(loginScreen) loginScreen.classList.add('hidden');
      
      document.getElementById('app').classList.remove('hidden');
      checkPhotoReminder();

    } catch (error) {
      console.error('Core init error:', error);
      showErrorScreen(error.message);
    }
  }

  function showErrorScreen(msg) {
    document.getElementById('splash-screen').classList.remove('hidden');
    document.getElementById('splash-screen').innerHTML = `
      <div class="splash-content">
        <div style="font-size: 48px; margin-bottom: 16px;">⚠️</div>
        <h2>שגיאה בטעינת האפליקציה</h2>
        <p style="color: var(--text-secondary); margin-top: 8px;">${msg}</p>
        <button onclick="location.reload()" class="btn-primary" style="margin-top: 24px; width: auto; padding: 12px 32px;">
          🔄 נסה שוב
        </button>
      </div>
    `;
  }

  /**
   * Show and handle the Login Screen
   */
  function showLoginScreen() {
    document.getElementById('splash-screen').classList.add('hidden');
    document.getElementById('app').classList.add('hidden');
    const loginScreen = document.getElementById('login-screen');
    loginScreen.classList.remove('hidden');

    const loginBtn = document.getElementById('login-btn');
    const bypassBtn = document.getElementById('login-bypass-btn');
    const passwordInput = document.getElementById('login-password');
    const errorMsg = document.getElementById('login-error');

    bypassBtn.onclick = () => {
      loginScreen.classList.add('hidden');
      document.getElementById('splash-screen').classList.remove('hidden');
      loadAppCore();
    };

    loginBtn.onclick = async () => {
      const password = passwordInput.value;
      if (!password) return;

      loginBtn.disabled = true;
      loginBtn.textContent = 'מתחבר...';
      errorMsg.style.display = 'none';

      try {
        // 1. Decrypt URL
        const decryptedUrl = await Crypto.decrypt(CONFIG.encryptedUrl, password);
        if (!decryptedUrl || !decryptedUrl.startsWith('http')) {
          throw new Error('סיסמה שגויה!');
        }

        // 2. Fetch data from Google Drive
        const response = await fetch(decryptedUrl);
        if (!response.ok) throw new Error('שגיאת רשת מול שרת גוגל');
        
        const data = await response.json();
        if (data.error || !data.tracking) {
           // Might be empty Drive
           console.log("Drive empty or error", data);
        } else {
           // 3. Import data
           await DB.importData(data);
        }

        // 4. Save decrypted URL locally
        await DB.setSetting('cloudSyncUrl', decryptedUrl);

        // 5. Load App
        loginBtn.textContent = 'הצלחה! 🚀';
        setTimeout(() => {
           loadAppCore();
        }, 1000);

      } catch (err) {
        console.error(err);
        errorMsg.textContent = err.message === 'סיסמה שגויה!' ? err.message : 'שגיאה בשאיבת נתונים. נסה שוב.';
        errorMsg.style.display = 'block';
        loginBtn.disabled = false;
        loginBtn.textContent = 'התחבר וטען נתונים';
      }
    };
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
   * Dynamically update the dates and day names of the plan days relative to the active index.
   */
  function updatePlanDaysDates(planDays, activeIndex) {
    const today = new Date();
    const dayNames = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
    planDays.forEach(day => {
      const d = new Date(today);
      d.setDate(today.getDate() + (day.dayIndex - activeIndex));
      day.dayOfWeek = dayNames[d.getDay()];
      day.date = UI.getLocalDateString(d).split('-').reverse().join('/');
    });
  }

  function updatePlanDates(activeIndex) {
    updatePlanDaysDates(allPlanDays, activeIndex);
  }

  /**
   * Recalculates the current active plan index based on completion status.
   * If the program hasn't started, skips Rest days.
   */
  async function recalculatePlanIndex() {
    let planIndex = 0;
    const allTracking = await DB.getAllTracking();
    for (let i = 0; i < allPlanDays.length; i++) {
      const track = allTracking.find(t => t.dayIndex === i);
      if (!track || !track.completed) {
        planIndex = i;
        break;
      }
    }
    
    let planStartDateStr = await DB.getSetting('planStartDate');
    window.appNotStarted = !planStartDateStr;
    
    // Auto-skip Rest days if the user has started and is behind schedule
    if (planStartDateStr) {
      const startDateObj = new Date(planStartDateStr + 'T00:00:00');
      const todayObj = new Date(UI.getLocalDateString() + 'T00:00:00');
      const diffTime = Math.abs(todayObj - startDateObj);
      const daysSinceStart = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      
      while (planIndex < daysSinceStart && planIndex < allPlanDays.length && allPlanDays[planIndex].dayType === 'Rest') {
        // Auto complete this rest day
        const track = allTracking.find(t => t.dayIndex === planIndex) || { dayIndex: planIndex };
        track.completed = true;
        track.lastUpdated = new Date().toISOString();
        track.date = UI.getLocalDateString(); // Use today's date for completion
        await DB.saveDayTracking(planIndex, track);
        planIndex++;
      }
    }

    updatePlanDaysDates(allPlanDays, planIndex, planStartDateStr);
    window.appCurrentPlanIndex = planIndex;
    await DB.setSetting('currentPlanIndex', planIndex);
    
    const todayStr = UI.getLocalDateString();
    await DB.setSetting('lastActiveDate', todayStr);
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
   * Export database and share it using the Web Share API (or fallback to download)
   */
  async function shareBackup() {
    try {
      const data = await DB.exportData();
      const json = JSON.stringify(data, null, 2);
      const fileName = `fitup-backup-${UI.getLocalDateString()}.json`;

      // Try using Web Share API first (mostly mobile devices / PWAs)
      if (navigator.canShare && navigator.share) {
        const file = new File([json], fileName, { type: 'application/json' });
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: 'גיבוי נתוני FitUp',
            text: 'קובץ הגיבוי של אימוני FitUp שלי'
          });
          await DB.setSetting('lastBackupDate', UI.getLocalDateString());
          UI.toast('הגיבוי שותף בהצלחה! 📤', 'success');
          return true;
        }
      }

      // Fallback: standard file download
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(url);
      await DB.setSetting('lastBackupDate', UI.getLocalDateString());
      UI.toast('הנתונים יוצאו בהצלחה! 📤', 'success');
      return true;
    } catch (e) {
      if (e.name !== 'AbortError') {
        UI.toast('שגיאה בייצוא: ' + e.message, 'error');
      }
      return false;
    }
  }

  /**
   * Setup settings page handlers
   */
  function setupSettings() {
    // Export data
    document.getElementById('export-data-btn').addEventListener('click', async () => {
      await shareBackup();
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
        setTimeout(() => location.reload(), 1000);
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

    // --- Google Drive Sync Settings ---
    const urlInput = document.getElementById('cloud-sync-url');
    const syncStatus = document.getElementById('last-sync-status');
    const syncBtn = document.getElementById('cloud-sync-btn');

    // Load initial status
    DB.getSetting('cloudSyncUrl').then(url => {
      if (url && urlInput) urlInput.value = url;
    });
    
    CloudSync.getLastSyncText().then(text => {
      syncStatus.textContent = `סנכרון אחרון: ${text}`;
    });

    // Save URL on change
    if (urlInput) {
      urlInput.addEventListener('change', async (e) => {
        await DB.setSetting('cloudSyncUrl', e.target.value.trim());
        UI.toast('כתובת API נשמרה', 'success');
      });
    }

    // Manual Sync Button
    if (syncBtn) {
      syncBtn.addEventListener('click', async () => {
        syncBtn.disabled = true;
        syncBtn.textContent = '🔄 מסנכרן...';
        
        const result = await CloudSync.syncData(true); // manual = true
        
        if (result.success) {
          const text = await CloudSync.getLastSyncText();
          syncStatus.textContent = `סנכרון אחרון: ${text}`;
        }
        
        syncBtn.disabled = false;
        syncBtn.textContent = '🔄 סנכרן עכשיו';
      });
    }

    // --- Encryption Tool ---
    const encryptUrlBtn = document.getElementById('encrypt-url-btn');
    const setupUrlInput = document.getElementById('setup-cloud-url');
    const setupPasswordInput = document.getElementById('setup-cloud-password');
    const encryptResult = document.getElementById('encrypted-result');

    if (encryptUrlBtn) {
      encryptUrlBtn.addEventListener('click', async () => {
        const url = setupUrlInput.value.trim();
        const pwd = setupPasswordInput.value;
        
        if (!url || !pwd) {
          UI.toast('נא להזין לינק וסיסמה', 'error');
          return;
        }
        
        encryptUrlBtn.textContent = 'מצפין...';
        const encrypted = await Crypto.encrypt(url, pwd);
        
        if (encrypted) {
          encryptResult.style.display = 'block';
          encryptResult.value = `const CONFIG = { encryptedUrl: "${encrypted}" };`;
          encryptUrlBtn.textContent = 'הוצפן בהצלחה!';
          
          // Also set it as the active sync url immediately for this device
          await DB.setSetting('cloudSyncUrl', url);
          if (document.getElementById('cloud-sync-url')) {
            document.getElementById('cloud-sync-url').value = url;
          }
          UI.toast('הוצפן והוגדר כפעיל!', 'success');
        } else {
          UI.toast('שגיאה בהצפנה', 'error');
          encryptUrlBtn.textContent = 'הצפן שוב';
        }
      });
    }
  }

  return {
    init,
    navigateTo,
    updatePlanDates,
    recalculatePlanIndex,
    shareBackup
  };
})();

// Start the app when DOM is ready
document.addEventListener('DOMContentLoaded', () => App.init());
