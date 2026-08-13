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
      // Safety timeout: ensure splash screen hides within max 2.5s if anything gets stuck
      setTimeout(() => {
        const splash = document.getElementById('splash-screen');
        const app = document.getElementById('app');
        if (splash && !splash.classList.contains('hidden') && app) {
          console.warn("Safety timeout: hiding splash screen to allow offline view.");
          splash.classList.add('hidden');
          app.classList.remove('hidden');
        }
      }, 2500);

      // Register Service Worker for PWA with automatic update force
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('./sw.js')
          .then(reg => {
            console.log('SW registered!', reg);
            reg.update();
          })
          .catch(err => console.error('SW failed', err));
      }

      // Initialize IndexedDB
      await DB.init();

      // Initialize i18n
      if (window.I18n) {
        await window.I18n.init();
      }

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
      const currentDataVersion = 40; // FitUp Pro Ultimate v4.0 78-week update
      const savedDataVersion = await DB.getSetting('dataVersion');
      
      let planStartDate = await DB.getSetting('planStartDate');
      
      const planCount = await DB.count(DB.STORES.PLAN);
      const exCount = await DB.count(DB.STORES.EXERCISES);
      
      if (planCount === 0 || exCount === 0 || savedDataVersion !== currentDataVersion || !planStartDate) {
        console.log("Reloading training plan due to v4.0 data version change, empty DB, or missing start date.");
        await DB.clearTracking();
        await DB.loadTrainingPlan();
        await DB.setSetting('dataVersion', currentDataVersion);
      }

      // Non-blocking background pull from cloud
      const savedUrl = await DB.getSetting('cloudSyncUrl');
      const hasOAuthToken = await CloudSync.isLoggedIn();
      if (savedUrl || hasOAuthToken) {
        console.log("Pulling latest data from cloud (background)...");
        CloudSync.pullData().catch(err => console.warn('Background pull error:', err));
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

      // Initialize page modules defensively
      if (window.TodayPage && window.TodayPage.init) {
        await window.TodayPage.init(allPlanDays);
      }
      if (window.CalendarPage && window.CalendarPage.init) {
        window.CalendarPage.init(allPlanDays);
      }
      if (window.ExercisesPage && window.ExercisesPage.init) {
        await window.ExercisesPage.init();
      }
      if (window.StatsPage && window.StatsPage.init) {
        window.StatsPage.init(allPlanDays);
      }

      // Initialize media preloader in background
      if (window.Preloader && window.Preloader.init) {
        window.Preloader.init();
      }

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
    const loginScreen = document.getElementById('login-screen');
    if (loginScreen) loginScreen.classList.add('hidden');
    document.getElementById('app').classList.add('hidden');
    
    document.getElementById('splash-screen').innerHTML = `
      <div class="splash-content" style="padding: 24px; text-align: center;">
        <div style="font-size: 48px; margin-bottom: 16px;">⚠️</div>
        <h2>${I18n.t('app_load_error')}</h2>
        <p style="color: var(--text-secondary); margin-top: 8px;">${msg}</p>
        <div style="display: flex; gap: 12px; justify-content: center; margin-top: 24px;">
          <button onclick="location.reload()" class="btn-primary" style="padding: 12px 24px;">
            ${I18n.t('try_again')}
          </button>
          <button onclick="DB.deleteDatabase().then(()=>location.reload())" class="btn-danger" style="padding: 12px 24px;">
            ${I18n.t('clear_all_btn')}
          </button>
        </div>
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

    const googleBtn = document.getElementById('login-google-btn');
    const bypassBtn = document.getElementById('login-bypass-btn');

    if (bypassBtn) {
      bypassBtn.onclick = () => {
        loginScreen.classList.add('hidden');
        document.getElementById('splash-screen').classList.remove('hidden');
        loadAppCore();
      };
    }

    if (googleBtn) {
      googleBtn.onclick = () => {
        googleBtn.disabled = true;
        googleBtn.textContent = I18n.t('connecting_google');
        CloudSync.loginWithGoogle(
          async (profile) => {
            UI.toast(`${I18n.t('hello_user')} ${profile.name || I18n.t('google_user')}! 👋`, 'success');
            await CloudSync.pullData();
            loginScreen.classList.add('hidden');
            document.getElementById('splash-screen').classList.remove('hidden');
            loadAppCore();
          },
          (err) => {
            googleBtn.disabled = false;
            googleBtn.innerHTML = `<svg width="20" height="20" viewBox="0 0 48 48" style="flex-shrink: 0;"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59A14.5 14.5 0 019.5 24c0-1.59.28-3.14.76-4.59l-7.98-6.19A23.99 23.99 0 000 24c0 3.77.9 7.35 2.56 10.54l7.97-5.95z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 5.95C6.51 42.62 14.62 48 24 48z"/></svg> ${I18n.t('connect_google')}`;
            const errStr = String(err);
            if (errStr.includes('invalid_client') || errStr.includes('401')) {
              UI.toast(I18n.t('google_updating'), 'warning');
            } else if (errStr.includes('access_denied') || errStr.includes('popup_closed') || errStr.includes('dismissed')) {
              UI.toast(I18n.t('google_cancelled'), 'warning');
            } else {
              UI.toast(I18n.t('google_error') + err, 'error');
            }
          }
        );
      };
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
        modalText = I18n.t('photo_reminder_first');
      } else {
        modalText = I18n.t('photo_reminder_never');
      }
    } else {
      const daysSinceLastPhoto = Math.floor((now - lastPhotoDate) / (1000 * 60 * 60 * 24));
      if (daysSinceLastPhoto >= REMINDER_DAYS) {
        shouldRemind = true;
        modalText = I18n.t('photo_reminder_4weeks');
      }
    }

    if (shouldRemind) {
      setTimeout(() => {
        UI.showModal(I18n.t('photo_reminder_title'), `
          <div style="text-align: center;">
            <p style="margin-bottom: 16px; font-size: 15px; color: var(--text-secondary);">${modalText}</p>
            <button id="remind-go-btn" class="btn-primary" style="width: 100%; margin-bottom: 8px;">${I18n.t('photo_go_btn')}</button>
            <button id="remind-later-btn" class="btn-secondary" style="width: 100%;">${I18n.t('photo_later_btn')}</button>
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
          UI.toast(I18n.t('remind_tomorrow'), 'info');
        };
      }, 1000); // 1s after splash closes
    }
  }

  /**
   * Dynamically update the dates and day names of the plan days relative to the active index.
   */
  function updatePlanDaysDates(planDays, activeIndex) {
    const today = new Date();
    const dayNames = [I18n.t('sun'), I18n.t('mon'), I18n.t('tue'), I18n.t('wed'), I18n.t('thu'), I18n.t('fri'), I18n.t('sat')];
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
      case 'nutrition':
        if (window.TodayPage && window.TodayPage.render) window.TodayPage.render();
        break;
      case 'exercises':
        if (window.ExercisesPage && window.ExercisesPage.render) window.ExercisesPage.render();
        break;
      case 'stats':
        if (window.StatsPage && window.StatsPage.render) window.StatsPage.render();
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
            title: 'FitUp Backup',
            text: 'My FitUp workout backup file'
          });
          await DB.setSetting('lastBackupDate', UI.getLocalDateString());
          UI.toast(I18n.t('backup_shared'), 'success');
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
      UI.toast(I18n.t('export_success'), 'success');
      return true;
    } catch (e) {
      if (e.name !== 'AbortError') {
        UI.toast(I18n.t('error_prefix') + e.message, 'error');
      }
      return false;
    }
  }

  /**
   * Setup settings page handlers
   */
  function setupSettings() {
    // Language selector buttons
    const settingsLangButtons = document.querySelectorAll('#settings-lang-buttons .login-lang-btn');
    if (settingsLangButtons.length && window.I18n) {
      settingsLangButtons.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.lang === window.I18n.getLang());
        btn.addEventListener('click', async () => {
          await window.I18n.setLanguage(btn.dataset.lang);
        });
      });
    }

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
        UI.toast(I18n.t('import_success'), 'success');
        setTimeout(() => location.reload(), 1000);
      } catch (err) {
        UI.toast(I18n.t('error_prefix') + err.message, 'error');
      }
    });

    // Reload plan
    document.getElementById('reload-plan-btn').addEventListener('click', async () => {
      try {
        const count = await DB.loadTrainingPlan();
        allPlanDays = await DB.getAllPlan();
        allPlanDays.sort((a, b) => a.dayIndex - b.dayIndex);
        UI.toast(I18n.t('plan_reloaded', '', {count}), 'success');
        setTimeout(() => location.reload(), 1000);
      } catch (err) {
        UI.toast(I18n.t('error_prefix') + err.message, 'error');
      }
    });

    // Clear all data
    document.getElementById('clear-all-btn').addEventListener('click', async () => {
      if (confirm(I18n.t('confirm_delete_all'))) {
        if (confirm(I18n.t('confirm_delete_final'))) {
          try {
            await DB.deleteDatabase();
            UI.toast(I18n.t('all_data_deleted'), 'info');
            setTimeout(() => location.reload(), 1000);
          } catch (err) {
            UI.toast(I18n.t('error_prefix') + err.message, 'error');
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
      UI.toast(I18n.t('theme_changed', '', {theme: newTheme === 'light' ? I18n.t('theme_light') : I18n.t('theme_dark')}), 'info');
    });

    // --- Google Drive & Account Settings ---
    const googleLoginBtn = document.getElementById('google-login-btn');
    const googleLogoutBtn = document.getElementById('google-logout-btn');
    const googleUserName = document.getElementById('google-user-name');
    const googleUserEmail = document.getElementById('google-user-email');
    const syncStatus = document.getElementById('last-sync-status');
    const syncBtn = document.getElementById('cloud-sync-btn');
    const cloudIndicator = document.getElementById('cloud-status-indicator');

    const updateGoogleUI = async () => {
      const loggedIn = await CloudSync.isLoggedIn();
      const profile = await CloudSync.getUserProfile();

      if (loggedIn) {
        if (googleUserName) googleUserName.textContent = profile?.name || I18n.t('google_user_connected');
        if (googleUserEmail) googleUserEmail.textContent = profile?.email || I18n.t('google_drive_active');
        if (googleLoginBtn) googleLoginBtn.style.display = 'none';
        if (googleLogoutBtn) googleLogoutBtn.style.display = 'block';
      } else {
        if (googleUserName) googleUserName.textContent = I18n.t('not_connected_google');
        if (googleUserEmail) googleUserEmail.textContent = I18n.t('local_offline_only');
        if (googleLoginBtn) googleLoginBtn.style.display = 'flex';
        if (googleLogoutBtn) googleLogoutBtn.style.display = 'none';
      }

      const syncText = await CloudSync.getLastSyncText();
      if (syncStatus) syncStatus.textContent = `${I18n.t('last_sync')}: ${syncText}`;
    };

    updateGoogleUI();

    // Handle sync status changes and update header indicator
    if (CloudSync.onSyncStatusChange) {
      CloudSync.onSyncStatusChange((status, detail) => {
        updateGoogleUI();
        if (!cloudIndicator) return;

        switch (status) {
          case 'synced':
            cloudIndicator.innerHTML = '☁️✅';
            cloudIndicator.title = 'מסונכרן בהצלחה מול Google Drive';
            cloudIndicator.style.borderColor = 'var(--success)';
            break;
          case 'syncing':
            cloudIndicator.innerHTML = '☁️🔄';
            cloudIndicator.title = 'מסנכרן נתונים ברקע...';
            cloudIndicator.style.borderColor = 'var(--warning)';
            break;
          case 'reauth_needed':
            cloudIndicator.innerHTML = '☁️⚠️';
            cloudIndicator.title = 'תוקף אסימון גוגל פג. לחץ להתחברות מחדש';
            cloudIndicator.style.borderColor = 'var(--danger)';
            break;
          case 'offline':
            cloudIndicator.innerHTML = '🔌';
            cloudIndicator.title = 'אין חיבור אינטרנט (אופליין)';
            cloudIndicator.style.borderColor = 'var(--border-light)';
            break;
          case 'error':
            cloudIndicator.innerHTML = '☁️❌';
            cloudIndicator.title = `שגיאת סנכרון: ${detail || ''}`;
            cloudIndicator.style.borderColor = 'var(--danger)';
            break;
          default:
            cloudIndicator.innerHTML = '☁️';
            cloudIndicator.title = 'Google Drive Sync';
            cloudIndicator.style.borderColor = 'var(--border-light)';
            break;
        }
      });
    }

    if (cloudIndicator) {
      cloudIndicator.onclick = async () => {
        const status = CloudSync.getStatus();
        if (status === 'reauth_needed' || !(await CloudSync.isLoggedIn())) {
          CloudSync.loginWithGoogle(
            async (profile) => {
              UI.toast(`${I18n.t('connected_as')} ${profile.name || I18n.t('google_user')}!`, 'success');
              await updateGoogleUI();
              CloudSync.syncData(true);
            },
            (err) => UI.toast(I18n.t('error_prefix') + err, 'error')
          );
        } else {
          navigateTo('settings');
        }
      };
    }

    if (googleLoginBtn) {
      googleLoginBtn.onclick = () => {
        CloudSync.loginWithGoogle(
          async (profile) => {
            UI.toast(`${I18n.t('connected_as')} ${profile.name || I18n.t('google_user')}!`, 'success');
            await updateGoogleUI();
            CloudSync.syncData(true);
          },
          (err) => UI.toast(I18n.t('error_prefix') + err, 'error')
        );
      };
    }

    if (googleLogoutBtn) {
      googleLogoutBtn.onclick = async () => {
        await CloudSync.logout();
        await updateGoogleUI();
        showLoginScreen();
      };
    }

    if (syncBtn) {
      syncBtn.addEventListener('click', async () => {
        syncBtn.disabled = true;
        syncBtn.textContent = I18n.t('syncing_drive');
        
        const result = await CloudSync.syncData(true);
        if (result.success) {
          await updateGoogleUI();
        }

        syncBtn.disabled = false;
        syncBtn.textContent = I18n.t('sync_now');
      });
    }
        


    // --- Gemini AI Settings ---
    const geminiKeyInput = document.getElementById('settings-gemini-key');
    const geminiModelSelect = document.getElementById('settings-gemini-model');
    const saveGeminiBtn = document.getElementById('save-settings-gemini-btn');
    const deleteSettingsGeminiBtn = document.getElementById('delete-settings-gemini-btn');
    const geminiInputWrapper = document.getElementById('settings-gemini-key-input-wrapper');
    const geminiActiveWrapper = document.getElementById('settings-gemini-key-active-wrapper');

    const updateGeminiSettingsUI = async () => {
      if (!window.GeminiService) return;
      
      const isConfigured = await window.GeminiService.isConfigured();
      
      if (isConfigured) {
        if (geminiInputWrapper) geminiInputWrapper.style.display = 'none';
        if (geminiActiveWrapper) geminiActiveWrapper.style.display = 'flex';
        if (saveGeminiBtn) saveGeminiBtn.textContent = I18n.t('save_model');
      } else {
        if (geminiInputWrapper) geminiInputWrapper.style.display = 'block';
        if (geminiActiveWrapper) geminiActiveWrapper.style.display = 'none';
        if (geminiKeyInput) geminiKeyInput.value = '';
        if (saveGeminiBtn) saveGeminiBtn.textContent = I18n.t('save_ai_settings');
      }
    };
    window.updateGeminiSettingsUI = updateGeminiSettingsUI;

    if (window.GeminiService) {
      if (window.GeminiService.initSelects) window.GeminiService.initSelects();
      
      window.GeminiService.getApiKey().then(key => {
        if (key && geminiKeyInput) geminiKeyInput.value = key;
        updateGeminiSettingsUI();
      });

      window.GeminiService.getModel().then(model => {
        if (model && geminiModelSelect) geminiModelSelect.value = model;
      });

      if (saveGeminiBtn) {
        saveGeminiBtn.onclick = async () => {
          const isConfigured = await window.GeminiService.isConfigured();
          const model = geminiModelSelect ? geminiModelSelect.value : 'gemini-3.1-flash-lite';
          
          if (!isConfigured) {
            const key = geminiKeyInput ? geminiKeyInput.value.trim() : '';
            if (!key) {
              UI.toast(I18n.t('enter_api_key'), 'warning');
              return;
            }

            saveGeminiBtn.disabled = true;
            saveGeminiBtn.textContent = I18n.t('checking_key');

            try {
              await window.GeminiService.testApiKey(key, model);
              await window.GeminiService.setApiKey(key);
              await window.GeminiService.setModel(model);
              UI.toast(I18n.t('key_saved_success'), 'success');
              await updateGeminiSettingsUI();
              // Sync API key to cloud so it's available on all devices
              if (typeof CloudSync !== 'undefined' && CloudSync.scheduleSync) CloudSync.scheduleSync();
              if (window.TodayPage && window.TodayPage.renderNutritionSection) {
                window.TodayPage.renderNutritionSection();
              }
            } catch (err) {
              UI.toast(I18n.t('error_prefix') + err.message, 'error');
            } finally {
              saveGeminiBtn.disabled = false;
            }
          } else {
            saveGeminiBtn.disabled = true;
            try {
              await window.GeminiService.setModel(model);
              UI.toast(I18n.t('model_updated'), 'success');
              if (typeof CloudSync !== 'undefined' && CloudSync.scheduleSync) CloudSync.scheduleSync();
              if (window.TodayPage && window.TodayPage.renderNutritionSection) {
                window.TodayPage.renderNutritionSection();
              }
            } catch (err) {
              UI.toast(I18n.t('error_prefix') + err.message, 'error');
            } finally {
              saveGeminiBtn.disabled = false;
              if (saveGeminiBtn) saveGeminiBtn.textContent = I18n.t('save_model');
            }
          }
        };
      }

      if (deleteSettingsGeminiBtn) {
        deleteSettingsGeminiBtn.onclick = async () => {
          if (confirm(I18n.t('delete_key_confirm'))) {
            await window.GeminiService.removeApiKey();
            UI.toast(I18n.t('key_deleted'), 'info');
            await updateGeminiSettingsUI();
            if (window.TodayPage && window.TodayPage.renderNutritionSection) {
              window.TodayPage.renderNutritionSection();
            }
          }
        };
      }
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

window.App = App;

// Start the app when DOM is ready (handles case where DOM is already ready)
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => App.init());
} else {
  App.init();
}

// Pull latest data when the app comes back to the foreground
document.addEventListener('visibilitychange', async () => {
  if (document.visibilityState === 'visible') {
    // 1. Update dates and active index since the day might have changed
    if (window.App && window.App.recalculatePlanIndex) {
      await window.App.recalculatePlanIndex();
    }
    
    // 2. Render UI immediately to reflect new day if it changed
    if (window.TodayPage && window.TodayPage.render) {
      window.TodayPage.render();
    }

    const savedUrl = await DB.getSetting('cloudSyncUrl');
    const hasOAuthToken = await CloudSync.isLoggedIn();
    if (savedUrl || hasOAuthToken) {
      console.log("App foregrounded, pulling latest data...");
      const result = await CloudSync.pullData();
      if (result && result.success) {
        // Always re-render TodayPage because it updates the global bottom navbar and the nutrition page
        if (window.TodayPage && window.TodayPage.render) {
          window.TodayPage.render();
        }
      }
    }
  }
});
