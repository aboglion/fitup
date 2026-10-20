/**
 * Main App Module - Initialization and navigation
 */
const App = (() => {
  let allPlanDays = [];
  let currentPage = 'today';
  let wakeLock = null;
  let isWakeLockUserEnabled = true;
  let deferredInstallPrompt = null;
  let isAppInitialized = false;

  /**
   * Request Wake Lock to prevent screen from turning off
   */
  async function requestWakeLock() {
    if (!isWakeLockUserEnabled) return false;
    try {
      if ('wakeLock' in navigator) {
        if (wakeLock !== null && !wakeLock.released) return true;
        wakeLock = await navigator.wakeLock.request('screen');
        console.log('Wake Lock activated');

        wakeLock.addEventListener('release', () => {
          console.log('Wake Lock released');
          wakeLock = null;
          updateWakeLockUI();
        });

        updateWakeLockUI();
        return true;
      }
    } catch (err) {
      console.warn('Wake Lock failed:', err.name, err.message);
    }
    updateWakeLockUI();
    return false;
  }

  /**
   * Release Wake Lock
   */
  function releaseWakeLock() {
    if (wakeLock) {
      wakeLock.release().then(() => {
        wakeLock = null;
        updateWakeLockUI();
      }).catch(err => {
        console.warn('Wake Lock release failed:', err);
        wakeLock = null;
        updateWakeLockUI();
      });
    }
  }

  /**
   * Toggle Wake Lock user setting
   */
  async function toggleWakeLock() {
    if (!('wakeLock' in navigator)) {
      if (window.UI && window.UI.toast) {
        UI.toast(I18n.t('wakelock_not_supported'), 'warning');
      }
      return;
    }
    isWakeLockUserEnabled = !isWakeLockUserEnabled;
    if (window.DB && window.DB.setSetting) {
      await DB.setSetting('wakeLockEnabled', isWakeLockUserEnabled);
    }
    if (isWakeLockUserEnabled) {
      const ok = await requestWakeLock();
      if (ok && window.UI && window.UI.toast) {
        UI.toast(I18n.t('wakelock_toast_on'), 'success');
      }
    } else {
      releaseWakeLock();
      if (window.UI && window.UI.toast) {
        UI.toast(I18n.t('wakelock_toast_off'), 'info');
      }
    }
    updateWakeLockUI();
  }

  /**
   * Update Wake Lock status text in UI
   */
  function updateWakeLockUI() {
    const textEl = document.getElementById('wakelock-btn-text');
    if (textEl && window.I18n) {
      if (!('wakeLock' in navigator)) {
        textEl.textContent = I18n.t('wakelock_not_supported');
      } else if (wakeLock !== null || isWakeLockUserEnabled) {
        textEl.textContent = I18n.t('wakelock_enabled');
      } else {
        textEl.textContent = I18n.t('wakelock_disabled');
      }
    }
  }

  /**
   * Setup PWA install prompt & event listeners
   */
  /**
   * Setup PWA install prompt & floating banner
   */
  function setupInstallPrompt() {
    const installBtn = document.getElementById('pwa-install-btn');
    const installedBadge = document.getElementById('pwa-installed-badge');
    const iosGuide = document.getElementById('pwa-ios-guide');

    const pwaBanner = document.getElementById('pwa-install-banner');
    const pwaBannerClose = document.getElementById('pwa-banner-close');
    const pwaBannerInstallBtn = document.getElementById('pwa-banner-install-btn');
    const pwaBannerTitle = document.getElementById('pwa-banner-title');
    const pwaBannerSub = document.getElementById('pwa-banner-sub');

    const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true ||
      document.referrer.includes('android-app://');

    const ua = navigator.userAgent || navigator.vendor || window.opera || '';
    const isIOS = /iPad|iPhone|iPod/.test(ua) && !window.MSStream;
    const isAndroid = /Android/i.test(ua);
    const isInAppBrowser = /FBAN|FBAV|Instagram|WhatsApp|Line|Twitter|Snapchat|MicroMessenger|GSA|AlohaBrowser|BytedanceWebview/i.test(ua) ||
      (isAndroid && /Version\/[0-9.]+/i.test(ua) && /Chrome\/[0-9.]+/i.test(ua) && !/SamsungBrowser/i.test(ua));

    let isBannerDismissed = localStorage.getItem('pwaBannerDismissed') === 'true';

    // Synchronize early prompt if captured before setup
    if (window.deferredInstallPrompt) {
      deferredInstallPrompt = window.deferredInstallPrompt;
    }

    function updatePwaUI() {
      const activePrompt = deferredInstallPrompt || window.deferredInstallPrompt;

      // 1. Settings Card Elements
      if (isStandalone) {
        if (installBtn) installBtn.style.display = 'none';
        if (installedBadge) installedBadge.style.display = 'flex';
        if (iosGuide) iosGuide.style.display = 'none';
      } else if (isIOS) {
        if (installBtn) installBtn.style.display = 'flex';
        if (installedBadge) installedBadge.style.display = 'none';
        if (iosGuide) iosGuide.style.display = 'none';
      } else {
        if (installBtn) installBtn.style.display = 'flex';
        if (installedBadge) installedBadge.style.display = 'none';
        if (iosGuide) iosGuide.style.display = 'none';
      }

      // 2. Floating PWA Banner Elements
      if (!pwaBanner) return;

      const loginScreen = document.getElementById('login-screen');
      const splashScreen = document.getElementById('splash-screen');
      const isIntroScreenActive = (loginScreen && !loginScreen.classList.contains('hidden')) ||
        (splashScreen && !splashScreen.classList.contains('hidden'));

      if (isStandalone || isBannerDismissed || isIntroScreenActive) {
        pwaBanner.classList.add('hidden');
        return;
      }

      if (isIOS) {
        if (pwaBannerTitle) pwaBannerTitle.textContent = I18n.t('pwa_banner_title');
        if (pwaBannerSub) pwaBannerSub.textContent = I18n.t('pwa_banner_ios_sub');
        pwaBanner.classList.remove('hidden');
      } else if (activePrompt) {
        if (pwaBannerTitle) pwaBannerTitle.textContent = I18n.t('pwa_banner_title');
        if (pwaBannerSub) pwaBannerSub.textContent = I18n.t('pwa_banner_sub');
        pwaBanner.classList.remove('hidden');
      } else {
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
        if (isMobile) {
          if (pwaBannerTitle) pwaBannerTitle.textContent = I18n.t('pwa_banner_title');
          if (pwaBannerSub) pwaBannerSub.textContent = I18n.t('pwa_banner_sub');
          pwaBanner.classList.remove('hidden');
        } else {
          pwaBanner.classList.add('hidden');
        }
      }
    }

    const triggerInstall = async () => {
      if (isStandalone) {
        if (window.UI && window.UI.toast) {
          UI.toast(I18n.t('pwa_installed_status'), 'info');
        }
        return;
      }

      let promptEvent = deferredInstallPrompt || window.deferredInstallPrompt;

      // If prompt not yet captured on Chromium, give it a brief wait
      if (!promptEvent && !isIOS && 'serviceWorker' in navigator) {
        promptEvent = await new Promise((resolve) => {
          const timer = setTimeout(() => resolve(null), 1200);
          const onPrompt = (e) => {
            clearTimeout(timer);
            window.removeEventListener('beforeinstallprompt', onPrompt);
            resolve(e);
          };
          window.addEventListener('beforeinstallprompt', onPrompt, { once: true });
        });
        if (promptEvent) {
          deferredInstallPrompt = promptEvent;
          window.deferredInstallPrompt = promptEvent;
        }
      }

      // If native browser prompt is available: EXECUTE 1-CLICK NATIVE INSTALL
      if (promptEvent) {
        try {
          promptEvent.prompt();
          const choice = await promptEvent.userChoice;
          if (choice && choice.outcome === 'accepted') {
            if (window.UI && window.UI.toast) {
              UI.toast(I18n.t('pwa_installed_toast'), 'success');
            }
            if (pwaBanner) pwaBanner.classList.add('hidden');
          }
        } catch (err) {
          console.warn('[PWA] Prompt invocation failed:', err);
        }
        deferredInstallPrompt = null;
        window.deferredInstallPrompt = null;
        updatePwaUI();
        return;
      }

      // If iOS device: display Safari instructions
      if (isIOS) {
        const isSafari = /Safari/i.test(ua) && !/CriOS|FxiOS|OPiOS|mercury/i.test(ua);
        const safariTip = !isSafari
          ? `<div style="margin-top: 12px; padding: 10px 12px; background: rgba(245, 158, 11, 0.15); border: 1px solid rgba(245, 158, 11, 0.35); border-radius: 8px; font-size: 12.5px; color: var(--text-primary); line-height: 1.5;">${I18n.t('pwa_ios_safari_tip')}</div>`
          : '';

        if (window.UI && window.UI.showModal) {
          window.UI.showModal(
            I18n.t('pwa_card_title'),
            `<div style="text-align: start; padding: 10px 0;">
               <p style="font-size: 14px; margin-bottom: 12px; color: var(--text-primary); line-height: 1.5; font-weight: 700;">${I18n.t('pwa_ios_guide_title')}</p>
               <ol style="margin: 0; padding-inline-start: 20px; font-size: 13px; color: var(--text-secondary); line-height: 1.8;">
                 <li style="margin-bottom: 6px;">1️⃣ ${I18n.t('pwa_ios_step1')}</li>
                 <li style="margin-bottom: 6px;">2️⃣ ${I18n.t('pwa_ios_step2')}</li>
                 <li style="margin-bottom: 6px;">3️⃣ ${I18n.t('pwa_ios_step3')}</li>
               </ol>
               ${safariTip}
             </div>`
          );
        } else if (window.UI && window.UI.toast) {
          UI.toast(I18n.t('pwa_ios_instructions'), 'info');
        }
        return;
      }

      // Android in-app browser detection (WhatsApp, Instagram, Facebook, Gmail, etc.)
      const chromeIntentUrl = isAndroid
        ? `intent://${location.host}${location.pathname}${location.search}${location.hash}#Intent;scheme=https;package=com.android.chrome;end`
        : '';

      if (isAndroid && isInAppBrowser) {
        if (window.UI && window.UI.showModal) {
          window.UI.showModal(
            I18n.t('pwa_inapp_title'),
            `<div style="text-align: start; padding: 10px 0;">
               <p style="font-size: 13.5px; margin-bottom: 14px; color: var(--text-primary); line-height: 1.5;">${I18n.t('pwa_inapp_desc')}</p>
               <a href="${chromeIntentUrl}" style="display: flex; align-items: center; justify-content: center; gap: 8px; width: 100%; padding: 12px 16px; background: linear-gradient(135deg, #10b981, #059669); color: #fff; font-weight: 800; font-size: 14px; border-radius: 12px; text-decoration: none; box-shadow: 0 4px 14px rgba(16,185,129,0.35); box-sizing: border-box;">
                 <span>🚀</span> <span>${I18n.t('pwa_open_in_chrome')}</span>
               </a>
               <button id="pwa-copy-app-link-btn" style="display: flex; align-items: center; justify-content: center; gap: 8px; width: 100%; padding: 10px 16px; margin-top: 10px; background: var(--bg-card); color: var(--text-primary); border: 1px solid var(--border-light); font-weight: 600; font-size: 13px; border-radius: 10px; cursor: pointer; box-sizing: border-box;">
                 <span>📋</span> <span>${I18n.t('pwa_copy_link')}</span>
               </button>
             </div>`
          );
          setTimeout(() => {
            const copyBtn = document.getElementById('pwa-copy-app-link-btn');
            if (copyBtn) {
              copyBtn.onclick = () => {
                navigator.clipboard.writeText(window.location.href).then(() => {
                  if (window.UI && window.UI.toast) UI.toast(I18n.t('pwa_link_copied'), 'success');
                }).catch(() => {
                  if (window.UI && window.UI.toast) UI.toast(window.location.href, 'info');
                });
              };
            }
          }, 80);
        }
        return;
      }

      // General fallback on Android / Desktop
      if (window.UI && window.UI.showModal) {
        window.UI.showModal(
          I18n.t('pwa_card_title'),
          `<div style="text-align: start; padding: 10px 0;">
             <p style="font-size: 14px; margin-bottom: 12px; color: var(--text-primary); line-height: 1.5; font-weight: 700;">${I18n.t('pwa_android_instructions_title')}</p>
             <ol style="margin: 0; padding-inline-start: 20px; font-size: 13px; color: var(--text-secondary); line-height: 1.8;">
               <li style="margin-bottom: 6px;">1️⃣ ${I18n.t('pwa_android_step1')}</li>
               <li style="margin-bottom: 6px;">2️⃣ ${I18n.t('pwa_android_step2')}</li>
               <li style="margin-bottom: 6px;">3️⃣ ${I18n.t('pwa_android_step3')}</li>
             </ol>
             ${isAndroid ? `
             <div style="margin-top: 14px; padding-top: 12px; border-top: 1px solid var(--border-light);">
               <a href="${chromeIntentUrl}" style="display: flex; align-items: center; justify-content: center; gap: 8px; width: 100%; padding: 12px; background: linear-gradient(135deg, var(--accent-primary), #2563eb); color: #fff; font-weight: 700; font-size: 13.5px; border-radius: 10px; text-decoration: none; box-sizing: border-box;">
                 <span>🚀</span> <span>${I18n.t('pwa_open_in_chrome')}</span>
               </a>
             </div>` : ''}
           </div>`
        );
      } else if (window.UI && window.UI.toast) {
        UI.toast(I18n.t('pwa_card_desc'), 'info');
      }
    };

    if (installBtn) installBtn.onclick = triggerInstall;
    if (pwaBannerInstallBtn) pwaBannerInstallBtn.onclick = triggerInstall;

    if (pwaBannerClose) {
      pwaBannerClose.onclick = () => {
        if (pwaBanner) pwaBanner.classList.add('hidden');
        localStorage.setItem('pwaBannerDismissed', 'true');
        isBannerDismissed = true;
      };
    }

    window.addEventListener('beforeinstallprompt', (e) => {
      console.log('PWA beforeinstallprompt event captured in app.js!');
      e.preventDefault();
      deferredInstallPrompt = e;
      window.deferredInstallPrompt = e;
      updatePwaUI();
    });

    window.addEventListener('appinstalled', () => {
      console.log('PWA appinstalled event!');
      deferredInstallPrompt = null;
      window.deferredInstallPrompt = null;
      if (window.UI && window.UI.toast) {
        UI.toast(I18n.t('pwa_installed_toast'), 'success');
      }
      if (pwaBanner) pwaBanner.classList.add('hidden');
      updatePwaUI();
    });

    updatePwaUI();
    setTimeout(updatePwaUI, 800);
    setTimeout(updatePwaUI, 2000);

    window.updatePwaBannerUI = updatePwaUI;
  }

  /**
   * Initialize the application
   */
  async function init() {
    try {
      // Preload muscle map anatomy images immediately on startup
      const imgFront = new Image(); imgFront.src = 'images/anatomy-front.webp';
      const imgBack = new Image(); imgBack.src = 'images/anatomy-back.webp';

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

      // Evict stale media from cache if needed
      if ('caches' in window) {
        caches.open('fitup-media-cache-v1').then(cache => {
          ['images/exercises/DB GLUTE BRIDGE.png', 'images/exercises/DB%20GLUTE%20BRIDGE.png', 'images/exercises/DB HIP THRUST.png', 'images/exercises/DB%20HIP%20THRUST.png', 'images/exercises/WRIST ROCKS.png', 'images/exercises/WRIST%20ROCKS.png'].forEach(p => {
            cache.delete(p, { ignoreSearch: true }).catch(() => {});
          });
        }).catch(() => {});
      }

      // Explicit Service Worker registration for PWA installability & offline caching
      if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
        navigator.serviceWorker.register('./sw.js')
          .then(reg => {
            console.log('SW registered!', reg.scope);
            reg.update();
          })
          .catch(err => console.error('SW registration failed:', err));
      } else if (!location.protocol.startsWith('http')) {
        console.info('SW skipped: running from file:// — serve via local server (e.g. python3 -m http.server) to enable PWA offline mode.');
      }

      // Setup PWA install prompt
      setupInstallPrompt();

      // Initialize IndexedDB with self-healing v15.7 Accelerated schema check
      await DB.init();
      await DB.ensureV15LeanSchema();

      // Check for Google OAuth callback token if returning from external browser redirect
      if (window.CloudSync && window.CloudSync.handleOAuthRedirect) {
        await window.CloudSync.handleOAuthRedirect();
      }

      // Initialize i18n
      if (window.I18n) {
        await window.I18n.init();
      }

      // Load Wake Lock settings and activate if enabled
      const savedWakeLock = await DB.getSetting('wakeLockEnabled');
      if (savedWakeLock !== undefined && savedWakeLock !== null) {
        isWakeLockUserEnabled = savedWakeLock;
      }
      if (isWakeLockUserEnabled) {
        requestWakeLock();
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
      const currentDataVersion = '15.7.0'; // FitUp v15.7 Accelerated — plan re-seed (deload cadence, arm block week, biceps 3:1, performance unlocks)
      const savedDataVersion = await DB.getSetting('dataVersion');

      let planStartDate = await DB.getSetting('planStartDate');
      let needReseed = false;
      if (planStartDate) {
        const s = new Date(planStartDate + 'T12:00:00');
        if (s.getDay() !== 0) {
          s.setDate(s.getDate() - s.getDay());
          planStartDate = UI.getLocalDateString(s);
          await DB.setSetting('planStartDate', planStartDate);
          needReseed = true;
        }
      }

      const planCount = await DB.count(DB.STORES.PLAN);
      const exCount = await DB.count(DB.STORES.EXERCISES);

      if (planCount === 0 || exCount === 0 || savedDataVersion !== currentDataVersion || !planStartDate || needReseed) {
        console.log("Reloading training plan due to data version update, empty DB, missing start date, or Sunday normalization.");
        const trackCount = await DB.count(DB.STORES.TRACKING).catch(() => 0);
        if (trackCount === 0) {
          await DB.clearTracking();
        }
        await DB.loadTrainingPlan();
        await DB.setSetting('dataVersion', currentDataVersion);
      }

      // Combat-schedule consistency: if the combat rev changed (e.g. after a cloud
      // restore or a settings rewrite) but the seeded plan still reflects the old
      // rev, re-apply the combat eras incrementally (future weeks only, history intact).
      if (window.CombatScheduler) {
        try {
          const combatCfg = await DB.getSetting('combatSchedule');
          const appliedRev = await DB.getSetting('combatAppliedRev');
          const currentRev = combatCfg && typeof combatCfg.rev === 'number' ? combatCfg.rev : 0;
          if (combatCfg && currentRev !== appliedRev) {
            console.log(`Combat schedule rev mismatch (cfg=${currentRev}, applied=${appliedRev}). Re-applying...`);
            await DB.applyCombatSchedule(combatCfg);
          }
        } catch (e) {
          console.warn('Combat schedule consistency check skipped:', e);
        }
      }

      // Non-blocking background pull from cloud
      const savedUrl = await DB.getSetting('cloudSyncUrl');
      const hasOAuthToken = await CloudSync.isLoggedIn();
      if (savedUrl || hasOAuthToken) {
        console.log("Pulling latest data from cloud (background)...");
        CloudSync.pullData().catch(err => console.warn('Background pull error:', err));
      }

      // Initialize Injury & Joint Safety states from DB/Cloud
      if (window.InjuryEngine && window.InjuryEngine.loadFromDB) {
        await window.InjuryEngine.loadFromDB();
      }

      // Load all plan data
      allPlanDays = await DB.getAllPlan();
      allPlanDays.sort((a, b) => a.dayIndex - b.dayIndex);

      // --- Auto-complete passed Rest days & past Relaxed Walks ---
      await DB.syncRestDays(allPlanDays);
      await DB.syncPastRelaxedWalks(allPlanDays);

      // --- Sequential Progress-Based Alignment ---
      // Find the active plan index (first incomplete or completed today)
      let planIndex = 0;
      const allTracking = await DB.getAllTracking();
      const todayStr = UI.getLocalDateString();
      for (let i = 0; i < allPlanDays.length; i++) {
        const track = allTracking.find(t => t.dayIndex === i);
        if (!track || !track.completed) {
          planIndex = i;
          break;
        }
        const isCompletedToday = track.completed && (
          track.date === todayStr ||
          (track.lastUpdated && track.lastUpdated.startsWith(todayStr))
        );
        if (isCompletedToday) {
          planIndex = i;
          const nextTrack = allTracking.find(t => t.dayIndex === i + 1);
          const nextCompletedToday = nextTrack && nextTrack.completed && (
            nextTrack.date === todayStr ||
            (nextTrack.lastUpdated && nextTrack.lastUpdated.startsWith(todayStr))
          );
          if (!nextCompletedToday) {
            break;
          }
        }
      }

      let planStartDateStr = await DB.getSetting('planStartDate');
      // Update dates first so UI.findTodayIndex can match day.date accurately
      updatePlanDaysDates(allPlanDays, planIndex, planStartDateStr);

      if (planStartDateStr) {
        const todayIdx = UI.findTodayIndex(allPlanDays);
        if (typeof todayIdx === 'number' && todayIdx >= 0) {
          planIndex = todayIdx;
        }
      } else if (allPlanDays[planIndex]?.dayType === 'Rest') {
        planIndex++;
      }

      // Re-anchor dates and day names in-memory anchored to planStartDate and final planIndex
      updatePlanDaysDates(allPlanDays, planIndex, planStartDateStr);

      await DB.setSetting('lastActiveDate', todayStr);
      await DB.setSetting('currentPlanIndex', planIndex);
      window.appCurrentPlanIndex = planIndex;
      window.allPlanDays = allPlanDays;
      window.updatePlanDaysDates = updatePlanDaysDates;
      // ----------------------------------

      // Preload Today's workout media immediately with top priority
      if (window.Preloader && typeof window.Preloader.preloadToday === 'function' && allPlanDays[planIndex]) {
        window.Preloader.preloadToday(allPlanDays[planIndex].exercises);
      }

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

      // Start background smart cloud auto-sync (checks every 2 minutes for updates)
      if (window.CloudSync && window.CloudSync.startAutoSync) {
        window.CloudSync.startAutoSync(120000);
      }

      // Handle data update events (from cloud pull or other open tabs/windows)
      if (window.CloudSync && window.CloudSync.onDataUpdate) {
        window.CloudSync.onDataUpdate(async (source) => {
          console.log('[App] Live data updated event received from:', source);

          if (window.InjuryEngine && window.InjuryEngine.loadFromDB) {
            await window.InjuryEngine.loadFromDB();
          }

          const activePage = document.querySelector('.page.active');
          const activeId = activePage ? activePage.id : '';

          if (activeId === 'page-stats') {
            if (window.StatsPage && window.StatsPage.render) {
              await window.StatsPage.render();
            }
          } else if (activeId === 'page-today' || activeId === 'page-nutrition') {
            if (window.TodayPage && window.TodayPage.render) {
              await window.TodayPage.render();
            }
          } else if (activeId === 'page-exercises') {
            if (window.ExercisesPage && window.ExercisesPage.render) {
              await window.ExercisesPage.render();
            }
          }
        });
      }

      // Setup settings
      setupSettings();

      // Setup Timer
      UI.initTimer();

      // Handle browser back/forward buttons
      window.addEventListener('popstate', (e) => {
        if (e.state && e.state.isModal) {
          return; // Modal state transition is handled by UI.js modalStack
        }
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
      if (loginScreen) loginScreen.classList.add('hidden');

      document.getElementById('app').classList.remove('hidden');
      checkPhotoReminder();
      setupAuthPromptBanner();
      isAppInitialized = true;

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

    // Best frequency for an 80-week plan is 1 month (28 days / 4 weeks)
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
   * Dynamically update the dates and day names of the plan days.
   * In all languages, weeks ALWAYS start on Sunday (Day 1 of the week).
   * Anchored to planStartDateStr (normalized to Sunday) when present.
   * In preview mode (before start), anchored to Sunday of the current week.
   */
  function updatePlanDaysDates(planDays, activeIndex, planStartDateStr) {
    if (!Array.isArray(planDays) || planDays.length === 0) return;
    const dayNames = [
      I18n.t('sun'), I18n.t('mon'), I18n.t('tue'),
      I18n.t('wed'), I18n.t('thu'), I18n.t('fri'), I18n.t('sat')
    ];
    let startDate;
    if (planStartDateStr) {
      const s = new Date(planStartDateStr + 'T12:00:00');
      if (s.getDay() !== 0) {
        s.setDate(s.getDate() - s.getDay());
      }
      startDate = s;
    } else {
      const now = new Date();
      const sun = new Date(now);
      sun.setDate(now.getDate() - now.getDay()); // Always Sunday of current week
      startDate = new Date(UI.getLocalDateString(sun) + 'T12:00:00');
    }

    planDays.forEach(day => {
      const d = new Date(startDate);
      d.setDate(startDate.getDate() + day.dayIndex);
      day.dayOfWeek = dayNames[d.getDay()];
      day.date = UI.getLocalDateString(d).split('-').reverse().join('/');
    });
  }

  function updatePlanDates(activeIndex) {
    DB.getSetting('planStartDate').then(str => {
      updatePlanDaysDates(allPlanDays, activeIndex, str);
    });
  }

  /**
   * Recalculates the current active plan index based on completion status.
   * If the program hasn't started, skips Rest days.
   */
  async function recalculatePlanIndex() {
    let planIndex = 0;
    const allTracking = await DB.getAllTracking();
    const todayStr = UI.getLocalDateString();
    for (let i = 0; i < allPlanDays.length; i++) {
      const track = allTracking.find(t => t.dayIndex === i);
      if (!track || !track.completed) {
        planIndex = i;
        break;
      }
      const isCompletedToday = track.completed && (
        track.date === todayStr ||
        (track.lastUpdated && track.lastUpdated.startsWith(todayStr))
      );
      if (isCompletedToday) {
        planIndex = i;
        const nextTrack = allTracking.find(t => t.dayIndex === i + 1);
        const nextCompletedToday = nextTrack && nextTrack.completed && (
          nextTrack.date === todayStr ||
          (nextTrack.lastUpdated && nextTrack.lastUpdated.startsWith(todayStr))
        );
        if (!nextCompletedToday) {
          break;
        }
      }
    }

    let planStartDateStr = await DB.getSetting('planStartDate');
    window.appNotStarted = !planStartDateStr;

    // Update dates first so UI.findTodayIndex can match day.date accurately
    updatePlanDaysDates(allPlanDays, planIndex, planStartDateStr);

    if (planStartDateStr) {
      const todayIdx = UI.findTodayIndex(allPlanDays);
      if (typeof todayIdx === 'number' && todayIdx >= 0) {
        planIndex = todayIdx;
      }
    }

    updatePlanDaysDates(allPlanDays, planIndex, planStartDateStr);
    window.appCurrentPlanIndex = planIndex;
    await DB.setSetting('currentPlanIndex', planIndex);

    await DB.setSetting('lastActiveDate', todayStr);
  }

  /**
   * Navigate to a page
   */
  function navigateTo(pageName, pushState = true) {
    if (pageName === 'calendar') pageName = 'today'; // Fallback for old cached URLs

    // Always hide any open modal overlay when switching views
    const modalOverlay = document.getElementById('modal-overlay');
    if (modalOverlay) modalOverlay.classList.add('hidden');

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
        if (pageName === 'nutrition' && window.TodayPage && window.TodayPage.resetNutritionDateToToday) {
          window.TodayPage.resetNutritionDateToToday();
        }
        if (window.TodayPage && window.TodayPage.render) window.TodayPage.render();
        break;
      case 'exercises':
        if (window.ExercisesPage && window.ExercisesPage.render) window.ExercisesPage.render();
        break;
      case 'stats':
        if (window.StatsPage && window.StatsPage.render) window.StatsPage.render();
        // Request wake lock so that leaving the dashboard open keeps screen on
        requestWakeLock();
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

    // Body Weight Setting Handler
    const saveUserWeightBtn = document.getElementById('save-user-weight-btn');
    const userWeightInput = document.getElementById('settings-user-weight');
    if (userWeightInput) {
      DB.getSetting('userWeight').then(savedW => {
        const val = savedW ? parseFloat(savedW) : 84;
        userWeightInput.value = val;
        window._cachedUserWeight = val;
      });
    }
    if (saveUserWeightBtn && userWeightInput) {
      saveUserWeightBtn.addEventListener('click', async () => {
        const val = parseFloat(userWeightInput.value);
        if (!val || isNaN(val) || val < 30 || val > 250) {
          UI.toast(I18n.t('invalid_weight'), 'warning');
          return;
        }
        window._cachedUserWeight = val;
        await DB.setSetting('userWeight', val);
        if (typeof CloudSync !== 'undefined' && CloudSync.scheduleSync) {
          CloudSync.scheduleSync();
        }
        UI.toast(I18n.t('weight_saved'), 'success');
        if (window.TodayPage && window.TodayPage.render) {
          window.TodayPage.render();
        }
      });
    }

    // ============ Heart Rate & Cardio Profile Settings ============
    const saveHrBtn = document.getElementById('save-hr-settings-btn');
    const userAgeInput = document.getElementById('settings-user-age');
    const customHrInput = document.getElementById('settings-custom-hrmax');
    const hrPreviewBadges = document.getElementById('settings-hr-preview-badges');

    const renderHrPreviewBadges = () => {
      if (!hrPreviewBadges || !userAgeInput) return;
      const ageVal = parseInt(userAgeInput.value, 10) || 43;
      const customVal = (customHrInput && customHrInput.value) ? parseInt(customHrInput.value, 10) : null;
      const zones = (typeof UI !== 'undefined' && UI.getHRZones) ? UI.getHRZones(ageVal, customVal) : null;
      if (!zones) return;

      hrPreviewBadges.innerHTML = `
        <span style="background: rgba(239, 68, 68, 0.15); border: 1px solid rgba(239, 68, 68, 0.4); color: #f87171; padding: 3px 8px; border-radius: 6px; font-weight: 700;">
          HRmax: ${zones.max} BPM
        </span>
        <span style="background: rgba(34, 197, 94, 0.15); border: 1px solid rgba(34, 197, 94, 0.4); color: #4ade80; padding: 3px 8px; border-radius: 6px; font-weight: 700;">
          Zone 2: ${zones.zone2[0]}–${zones.zone2[1]} BPM
        </span>
        <span style="background: rgba(59, 130, 246, 0.15); border: 1px solid rgba(59, 130, 246, 0.4); color: #60a5fa; padding: 3px 8px; border-radius: 6px; font-weight: 700;">
          4×4 Work: ${zones.zone5[0]}–${zones.zone5[1]} BPM
        </span>
      `;
    };

    if (userAgeInput) {
      DB.getSetting('userAge').then(savedAge => {
        const val = savedAge ? parseInt(savedAge, 10) : 43;
        userAgeInput.value = val;
        window._cachedUserAge = val;
        renderHrPreviewBadges();
      });
      userAgeInput.addEventListener('input', renderHrPreviewBadges);
    }

    if (customHrInput) {
      DB.getSetting('customHRmax').then(savedMax => {
        const val = savedMax ? parseInt(savedMax, 10) : null;
        if (val) customHrInput.value = val;
        window._cachedCustomHRmax = val;
        renderHrPreviewBadges();
      });
      customHrInput.addEventListener('input', renderHrPreviewBadges);
    }

    if (saveHrBtn && userAgeInput) {
      saveHrBtn.addEventListener('click', async () => {
        const ageVal = parseInt(userAgeInput.value, 10);
        if (!ageVal || isNaN(ageVal) || ageVal < 15 || ageVal > 100) {
          UI.toast('נא להזין גיל תקין בין 15 ל-100', 'warning');
          return;
        }
        const customVal = (customHrInput && customHrInput.value) ? parseInt(customHrInput.value, 10) : null;
        if (customVal && (customVal < 100 || customVal > 240)) {
          UI.toast('דופק מרבי צריך להיות בין 100 ל-240 פעימות לדקה', 'warning');
          return;
        }

        window._cachedUserAge = ageVal;
        window._cachedCustomHRmax = customVal;

        await DB.setSetting('userAge', ageVal);
        await DB.setSetting('customHRmax', customVal);

        renderHrPreviewBadges();

        if (typeof CloudSync !== 'undefined' && CloudSync.scheduleSync) {
          CloudSync.scheduleSync();
        }

        UI.toast(I18n.t('hr_saved_toast'), 'success');
        if (window.TodayPage && window.TodayPage.render) {
          window.TodayPage.render();
        }
      });
    }

    // ============ Combat Training Integration Settings ============
    const combatToggle = document.getElementById('combat-enabled-toggle');
    const combatBody = document.getElementById('combat-settings-body');
    const combatSaveBtn = document.getElementById('save-combat-settings-btn');
    const combatPreviewGrid = document.getElementById('combat-preview-grid');
    const combatPreviewWarnings = document.getElementById('combat-preview-warnings');
    const combatUnsavedNote = document.getElementById('combat-unsaved-note');
    const combatSportButtons = document.querySelectorAll('.combat-sport-chip');
    const combatPracticeButtons = document.querySelectorAll('.combat-practice-chip');
    const combatHardButtons = document.querySelectorAll('.combat-hard-chip');
    const combatDowRows = document.querySelectorAll('.combat-weekday-row');
    const combatClass1Time = document.getElementById('combat-class1-time');
    const combatClass2Time = document.getElementById('combat-class2-time');

    if (combatToggle && window.CombatScheduler) {
      // ---- State ----
      let combatState = {
        enabled: false,
        sport: 'muay_thai',
        classDays: [],
        practice: 'auto',
        hardClass: 'auto',
        classTimes: { class1: '18:00', class2: '18:00' }
      };
      let combatResolved = null;
      let combatSavedSnapshot = null; // persisted config for dirty-tracking

      const DAY_LETTERS = ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש'];

      function combatRefreshChips() {
        // Sport chips
        combatSportButtons.forEach(btn => {
          btn.classList.toggle('active', btn.dataset.sport === combatState.sport);
        });
        // Practice chips
        combatPracticeButtons.forEach(btn => {
          btn.classList.toggle('active', btn.dataset.practice === combatState.practice);
        });
        // Hard chips
        combatHardButtons.forEach(btn => {
          btn.classList.toggle('active', btn.dataset.hard === combatState.hardClass);
        });
        // Day-of-week chips
        combatDowRows.forEach(row => {
          const picker = row.dataset.picker;
          row.querySelectorAll('.combat-dow-chip').forEach(chip => {
            const dow = parseInt(chip.dataset.dow, 10);
            chip.textContent = I18n.t(`dow_${dow}`) || chip.textContent;
            const isClass1 = picker === 'class1' && combatState.classDays[0] === dow;
            const isClass2 = picker === 'class2' && combatState.classDays[1] === dow;
            chip.classList.toggle('active', isClass1 || isClass2);
          });
        });
      }

      function combatIsDirty() {
        if (!combatSavedSnapshot) return combatState.enabled; // nothing saved yet but enabled
        const s = combatSavedSnapshot;
        return !(s.enabled === combatState.enabled &&
          (s.sport || 'muay_thai') === combatState.sport &&
          JSON.stringify((s.classDays || []).slice().sort()) === JSON.stringify(combatState.classDays.slice().sort()) &&
          (s.practice || 'auto') === combatState.practice &&
          (s.hardClass || 'auto') === combatState.hardClass &&
          JSON.stringify(s.classTimes || {}) === JSON.stringify(combatState.classTimes));
      }

      function combatSyncTimesFromInputs() {
        if (combatClass1Time) combatState.classTimes.class1 = combatClass1Time.value || '18:00';
        if (combatClass2Time) combatState.classTimes.class2 = combatClass2Time.value || '18:00';
      }

      function combatSyncInputsFromState() {
        if (combatClass1Time) combatClass1Time.value = combatState.classTimes.class1 || '18:00';
        if (combatClass2Time) combatClass2Time.value = combatState.classTimes.class2 || '18:00';
      }

      function combatRefreshUnsavedNote() {
        if (!combatUnsavedNote) return;
        const dirty = combatIsDirty();
        combatUnsavedNote.style.display = dirty ? 'block' : 'none';
        if (combatSaveBtn) {
          combatSaveBtn.style.boxShadow = dirty ? '0 0 0 2px rgba(245,158,11,0.7)' : '';
          combatSaveBtn.style.animation = dirty ? 'combatPulse 1.2s ease-in-out infinite' : '';
        }
      }

      function combatComputePreview() {
        if (!combatState.enabled || combatState.classDays.length === 0) return;
        try {
          const opts = {
            classDays: combatState.classDays,
            practice: combatState.practice,
            hardClass: combatState.hardClass
          };
          combatResolved = CombatScheduler.computeWeek(opts);
          if (combatPreviewGrid) renderCombatPreviewGrid(combatResolved);
          else UI.toast(I18n.t('combat_opt_error'), 'danger');
          if (combatPreviewWarnings) {
            combatPreviewWarnings.textContent = '';
            const warnHtml = (combatResolved.warnings || [])
              .filter(w => w !== 'optimal' && I18n.t(`combat_warn_${w}`))
              .map(w => `<div style="color: #fbbf24; margin-top: 3px;">⚠️ ${I18n.t(`combat_warn_${w}`)}</div>`)
              .join('');
            combatPreviewWarnings.innerHTML = warnHtml;
          }
        } catch (e) {
          console.error('Combat preview error:', e);
          if (combatPreviewWarnings) {
            combatPreviewWarnings.textContent = I18n.t('combat_opt_error');
          }
        }
      }

      function renderCombatPreviewGrid(resolved) {
        if (!combatPreviewGrid) return;
        const isRTL = (window.I18n && window.I18n.getDir() === 'rtl') || document.documentElement.dir === 'rtl';
        combatPreviewGrid.setAttribute('dir', isRTL ? 'rtl' : 'ltr');
        combatPreviewGrid.style.direction = isRTL ? 'rtl' : 'ltr';
        const days = [];
        // Build Sun..Sat display order (JS getDay 0-6)
        for (let dow = 0; dow < 7; dow++) {
          const bp = CombatScheduler.blockPosOf(dow);
          const offset = resolved.permutation[bp];
          const isClass1 = combatState.classDays[0] === dow;
          const isClass2 = combatState.classDays[1] === dow;
          const isPractice = resolved.practiceDay === dow;
          let marker = '';
          if (isClass1) marker = '🥊';
          else if (isClass2) marker = '🥊';
          else if (isPractice) marker = '🥊';
          const isRest = offset === 6;
          const cellStyle = isRest
            ? 'background: rgba(148,163,184,0.12); color: var(--text-muted);'
            : isClass1 || isClass2 || isPractice
              ? 'background: rgba(239,68,68,0.15); border: 1px solid rgba(239,68,68,0.4);'
              : 'background: var(--bg-input);';
          const dayLetter = I18n.t(`dow_${dow}`) || dow;
          days.push(`
            <div style="display:flex; flex-direction:column; align-items:center; gap:4px; border-radius:8px; padding:6px 2px; ${cellStyle}">
              <span style="font-size:12px; font-weight:700;">${dayLetter}</span>
              <span style="font-size:10px; text-align:center; line-height:1.2;">${I18n.t(`combat_type_${offset}`) || name}</span>
              <span style="font-size:12px;">${marker || ''}</span>
            </div>
          `);
        }
        combatPreviewGrid.innerHTML = days.join('');
      }

      // ---- Load saved state ----
      (async () => {
        try {
          const saved = await DB.getSetting('combatSchedule');
          if (saved) {
            combatState.enabled = !!saved.enabled;
            combatState.sport = saved.sport || 'muay_thai';
            combatState.classDays = Array.isArray(saved.classDays) ? saved.classDays.slice() : [];
            combatState.practice = saved.practice || 'auto';
            combatState.hardClass = saved.hardClass || 'auto';
            combatState.classTimes = (saved.classTimes && typeof saved.classTimes === 'object')
              ? { class1: saved.classTimes.class1 || '18:00', class2: saved.classTimes.class2 || '18:00' }
              : { class1: '18:00', class2: '18:00' };
          }
        } catch (e) {
          console.warn('Combat settings load error:', e);
        }
        combatToggle.checked = combatState.enabled;
        combatBody.style.display = combatState.enabled ? 'block' : 'none';
        combatRefreshChips();
        combatSyncInputsFromState();
        if (combatState.enabled) combatComputePreview();
        combatSavedSnapshot = {
          enabled: combatState.enabled,
          sport: combatState.sport,
          classDays: combatState.classDays.slice(),
          practice: combatState.practice,
          hardClass: combatState.hardClass,
          classTimes: { ...combatState.classTimes }
        };
        combatRefreshUnsavedNote();
      })();

      // ---- Toggle ----
      combatToggle.addEventListener('change', () => {
        combatState.enabled = combatToggle.checked;
        combatBody.style.display = combatState.enabled ? 'block' : 'none';
        combatRefreshChips();
        if (combatState.enabled) combatComputePreview();
        combatRefreshUnsavedNote();
      });

      // ---- Sport selector ----
      combatSportButtons.forEach(btn => btn.addEventListener('click', () => {
        combatState.sport = btn.dataset.sport;
        combatRefreshChips();
        if (combatState.enabled) combatComputePreview();
        combatRefreshUnsavedNote();
      }));

      // ---- Practice selector ----
      combatPracticeButtons.forEach(btn => btn.addEventListener('click', () => {
        combatState.practice = btn.dataset.practice;
        combatRefreshChips();
        if (combatState.enabled) combatComputePreview();
        combatRefreshUnsavedNote();
      }));

      // ---- Hard class selector ----
      combatHardButtons.forEach(btn => btn.addEventListener('click', () => {
        combatState.hardClass = btn.dataset.hard;
        combatRefreshChips();
        if (combatState.enabled) combatComputePreview();
        combatRefreshUnsavedNote();
      }));

      // ---- Day-of-week selectors (mutually exclusive within each row) ----
      combatDowRows.forEach(row => {
        const picker = row.dataset.picker;
        const slotIdx = picker === 'class1' ? 0 : 1;
        row.querySelectorAll('.combat-dow-chip').forEach(chip => {
          chip.addEventListener('click', () => {
            const dow = parseInt(chip.dataset.dow, 10);
            const cur = combatState.classDays[slotIdx];
            if (cur === dow) {
              combatState.classDays[slotIdx] = undefined;
            } else {
              combatState.classDays[slotIdx] = dow;
            }
            // Avoid selecting the same weekday for both class days
            const otherIdx = slotIdx === 0 ? 1 : 0;
            if (combatState.classDays[slotIdx] === combatState.classDays[otherIdx]) {
              combatState.classDays[otherIdx] = undefined;
            }
            combatState.classDays = combatState.classDays.filter(d => d !== undefined);
            combatRefreshChips();
            if (combatState.enabled) combatComputePreview();
            combatRefreshUnsavedNote();
          });
        });
      });

      // ---- Class times (guidance-only: never appends an era) ----
      [combatClass1Time, combatClass2Time].forEach(input => {
        if (!input) return;
        input.addEventListener('change', () => {
          combatSyncTimesFromInputs();
          combatRefreshUnsavedNote();
        });
      });

      // ---- Save ----
      if (combatSaveBtn) {
        combatSaveBtn.addEventListener('click', async () => {
          combatSyncTimesFromInputs();

          if (!combatState.enabled) {
            // Disable path: append a disabled era from next Monday
            const boundary = await computeCombatBoundary();
            const cfg = await DB.getSetting('combatSchedule');
            const history = (cfg && Array.isArray(cfg.history)) ? cfg.history.slice() : [];
            history.push({ from: boundary, enabled: false });
            const classTimes = (cfg && cfg.classTimes) || { ...combatState.classTimes };
            const newCfg = { rev: (cfg && cfg.rev || 0) + 1, enabled: false, sport: combatState.sport, classDays: [], practice: 'off', hardClass: 'auto', classTimes, history };
            await DB.setSetting('combatSchedule', newCfg);
            await DB.applyCombatSchedule(newCfg);
            if (typeof CloudSync !== 'undefined' && CloudSync.scheduleSync) CloudSync.scheduleSync();
            UI.toast(I18n.t('combat_disabled'), 'info');
            combatSavedSnapshot = { enabled: false, sport: combatState.sport, classDays: [], practice: 'off', hardClass: 'auto', classTimes: { ...classTimes } };
            combatRefreshUnsavedNote();
            await refreshPlanInMemory();
            return;
          }

          const classDays = combatState.classDays.slice().sort((a, b) => a - b);
          if (classDays.length === 0) {
            UI.toast(I18n.t('combat_no_days'), 'warning');
            return;
          }
          try {
            combatResolved = CombatScheduler.computeWeek({
              classDays,
              practice: combatState.practice,
              hardClass: combatState.hardClass
            });
          } catch (e) {
            UI.toast(I18n.t('combat_opt_error'), 'danger');
            return;
          }

          const cfg = await DB.getSetting('combatSchedule');
          const base = {
            enabled: true,
            sport: combatState.sport,
            classDays: classDays.slice(),
            practice: combatState.practice,
            hardClass: combatState.hardClass
          };
          const classTimes = {
            class1: combatState.classTimes.class1 || '18:00',
            class2: combatState.classTimes.class2 || '18:00'
          };
          // Era-append guard: only permutation-relevant edits append a new era.
          // Class-time-only changes save the guidance metadata WITHOUT churning the
          // weekly permutation or re-seeding the plan.
          const eraChanged = CombatScheduler.combatEraChanged(cfg, base);
          const history = (cfg && Array.isArray(cfg.history)) ? cfg.history.slice() : [];

          if (eraChanged) {
            const boundary = await computeCombatBoundary();
            const effDateText = await formatCommitDate(boundary);

            const ok = window.UI && window.UI.confirm
              ? await UI.confirm({
                title: I18n.t('combat_confirm_title'),
                message: I18n.t('combat_confirm_msg', '', { date: effDateText }),
                confirmText: I18n.t('combat_confirm_apply'),
                type: 'primary',
                icon: '🥊'
              })
              : confirm(I18n.t('combat_confirm_msg', '', { date: effDateText }));
            if (!ok) return;

            history.push({
              from: boundary,
              enabled: true,
              perm: combatResolved.permutation.slice(),
              classDays: classDays.slice(),
              practiceDay: combatResolved.practiceDay,
              sport: combatState.sport
            });
          }

          const newCfg = {
            rev: (cfg && cfg.rev || 0) + 1,
            ...base,
            classTimes,
            resolved: combatResolved,
            history
          };
          await DB.setSetting('combatSchedule', newCfg);
          if (eraChanged) await DB.applyCombatSchedule(newCfg);
          if (typeof CloudSync !== 'undefined' && CloudSync.scheduleSync) CloudSync.scheduleSync();
          UI.toast(I18n.t('combat_saved'), 'success');
          combatSavedSnapshot = {
            enabled: true,
            sport: combatState.sport,
            classDays: classDays.slice(),
            practice: combatState.practice,
            hardClass: combatState.hardClass,
            classTimes: { ...classTimes }
          };
          combatRefreshUnsavedNote();
          await refreshPlanInMemory();
        });
      }

      /**
       * Compute the next Monday week-boundary dayIndex for the current plan position.
       */
      async function computeCombatBoundary() {
        let currentIdx = (typeof window.appCurrentPlanIndex === 'number') ? window.appCurrentPlanIndex : 0;
        const planStartStr = await DB.getSetting('planStartDate');
        if (!planStartStr) return 0;
        const start = new Date(planStartStr + 'T00:00:00');
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const daysSince = Math.floor((today - start) / 86400000);
        currentIdx = Math.max(currentIdx, daysSince);
        const weekStart = Math.floor(currentIdx / 7) * 7;
        if (weekStart === 0) return 0; // If within week 1, apply immediately from program start
        return weekStart + 7; // next full week block
      }

      async function formatCommitDate(boundary) {
        if (boundary <= 0) return I18n.t('combat_from_start');
        const planStartStr = await DB.getSetting('planStartDate');
        const planDate = planStartStr ? new Date(planStartStr + 'T00:00:00') : new Date();
        const d = new Date(planDate);
        d.setDate(d.getDate() + boundary);
        const dd = String(d.getDate()).padStart(2, '0');
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        return `${dd}/${mm}/${d.getFullYear()}`;
      }

      async function refreshPlanInMemory() {
        if (window.TodayPage && window.TodayPage.refreshPlan) {
          await window.TodayPage.refreshPlan();
        } else {
          // Fallback: reload all plan days and re-init pages
          const planDays = await DB.getAllPlan();
          planDays.sort((a, b) => a.dayIndex - b.dayIndex);
          if (window.TodayPage && window.TodayPage.init) await window.TodayPage.init(planDays);
          if (window.CalendarPage && window.CalendarPage.init) await window.CalendarPage.init(planDays);
        }
      }
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
        UI.toast(I18n.t('plan_reloaded', '', { count }), 'success');
        setTimeout(() => location.reload(), 1000);
      } catch (err) {
        UI.toast(I18n.t('error_prefix') + err.message, 'error');
      }
    });

    // Clear all data
    document.getElementById('clear-all-btn').addEventListener('click', async () => {
      const step1 = window.UI && window.UI.confirm
        ? await UI.confirm({
          title: I18n.t('clear_all_card') || 'מחיקת כל הנתונים',
          message: I18n.t('confirm_delete_all'),
          confirmText: I18n.t('clear_all_btn') || 'מחק',
          type: 'danger',
          icon: '⚠️'
        })
        : confirm(I18n.t('confirm_delete_all'));
      if (step1) {
        const step2 = window.UI && window.UI.confirm
          ? await UI.confirm({
            title: I18n.t('clear_all_card') || 'אישור סופי למחיקה',
            message: I18n.t('confirm_delete_final'),
            confirmText: I18n.t('delete_btn') || 'מחק לצמיתות',
            type: 'danger',
            icon: '💥'
          })
          : confirm(I18n.t('confirm_delete_final'));
        if (step2) {
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

    // 3D Effects & Sound Toggles
    const toggleSoundBtn = document.getElementById('toggle-sound-btn');
    const toggleEffects3dBtn = document.getElementById('toggle-effects3d-btn');
    const soundTextEl = document.getElementById('sound-btn-text');
    const effects3dTextEl = document.getElementById('effects3d-btn-text');

    const updateEffectsUI = () => {
      if (window.Effects3D) {
        const soundOn = window.Effects3D.isSoundActive();
        const effectsOn = window.Effects3D.isEffectsActive();
        if (soundTextEl) {
          soundTextEl.textContent = soundOn ? I18n.t('sound_enabled') : I18n.t('sound_disabled');
        }
        if (effects3dTextEl) {
          effects3dTextEl.textContent = effectsOn ? I18n.t('effects3d_enabled') : I18n.t('effects3d_disabled');
        }
      }
    };
    updateEffectsUI();

    if (toggleSoundBtn) {
      toggleSoundBtn.addEventListener('click', () => {
        if (window.Effects3D) {
          const current = window.Effects3D.isSoundActive();
          window.Effects3D.setSoundEnabled(!current);
          updateEffectsUI();
          if (!current) window.Effects3D.playSetSound('above');
        }
      });
    }

    const testVoiceBtn = document.getElementById('test-voice-btn');
    if (testVoiceBtn) {
      testVoiceBtn.addEventListener('click', () => {
        if (window.Effects3D && window.Effects3D.playCompletionMelody) {
          window.Effects3D.playCompletionMelody();
        } else if (window.UI && window.UI.speakVoiceCue) {
          window.UI.speakVoiceCue();
        }
      });
    }

    if (toggleEffects3dBtn) {
      toggleEffects3dBtn.addEventListener('click', () => {
        if (window.Effects3D) {
          const current = window.Effects3D.isEffectsActive();
          window.Effects3D.setEffects3dEnabled(!current);
          updateEffectsUI();
        }
      });
    }

    // Wake Lock toggle
    const toggleWakeLockBtn = document.getElementById('toggle-wakelock-btn');
    if (toggleWakeLockBtn) {
      toggleWakeLockBtn.addEventListener('click', () => {
        toggleWakeLock();
      });
    }
    updateWakeLockUI();

    // Theme toggle
    const currentTheme = localStorage.getItem('theme') || 'dark';
    if (currentTheme === 'light') {
      document.documentElement.classList.add('light-theme');
    }

    document.getElementById('theme-toggle-btn').addEventListener('click', () => {
      document.documentElement.classList.toggle('light-theme');
      const newTheme = document.documentElement.classList.contains('light-theme') ? 'light' : 'dark';
      localStorage.setItem('theme', newTheme);
      UI.toast(I18n.t('theme_changed', '', { theme: newTheme === 'light' ? I18n.t('theme_light') : I18n.t('theme_dark') }), 'info');
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
        const status = CloudSync.getStatus ? CloudSync.getStatus() : 'idle';
        const hasValid = CloudSync.hasValidToken ? await CloudSync.hasValidToken() : true;
        const loggedIn = CloudSync.isLoggedIn ? await CloudSync.isLoggedIn() : false;

        // If user is logged into Google but token expired, use this button click (user gesture) to re-authenticate seamlessly
        if (loggedIn && (status === 'reauth_needed' || !hasValid)) {
          CloudSync.loginWithGoogle(
            async (profile) => {
              UI.toast(`${I18n.t('connected_as')} ${profile.name || I18n.t('google_user')}!`, 'success');
              await updateGoogleUI();
              CloudSync.syncData(true);
            },
            (err) => UI.toast(I18n.t('error_prefix') + err, 'error')
          );
          return;
        }

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
          const confirmed = window.UI && window.UI.confirm
            ? await UI.confirm({
              title: I18n.t('delete_key') || 'מחיקת מפתח API',
              message: I18n.t('delete_key_confirm'),
              confirmText: I18n.t('delete_btn') || 'מחק',
              type: 'danger',
              icon: '🗑️'
            })
            : confirm(I18n.t('delete_key_confirm'));
          if (confirmed) {
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

  /**
   * Initialize and manage the Non-Intrusive Floating Auth Prompt Banner
   */
  async function setupAuthPromptBanner() {
    const banner = document.getElementById('login-prompt-banner');
    const bannerClose = document.getElementById('login-banner-close');
    const bannerBtn = document.getElementById('login-banner-btn');
    const bannerTitle = document.getElementById('login-banner-title');
    const bannerSub = document.getElementById('login-banner-sub');

    if (!banner) return;

    window.addEventListener('pointerdown', () => {
      window._lastUserGestureTime = Date.now();
    }, { capture: true, passive: true });

    let isDismissed = sessionStorage.getItem('authBannerDismissed') === 'true';
    let hasAutoTriggeredReauth = false;
    let isSimulatingClick = false;

    // Simulate automatic click on the login button when disconnect / reauth is detected
    const simulateAutoLoginClick = async () => {
      if (hasAutoTriggeredReauth) return;
      if (!bannerBtn || bannerBtn.disabled) return;

      // In modern browsers, opening GIS popup requires an active user gesture (click/tap).
      // Without user activation, synthetic button.click() will be blocked by the browser popup blocker.
      const hasUserActivation = (typeof navigator !== 'undefined' && navigator.userActivation)
        ? navigator.userActivation.isActive
        : Boolean(window._lastUserGestureTime && (Date.now() - window._lastUserGestureTime < 1000));

      if (!hasUserActivation) {
        console.log('[AuthPrompt] Google disconnect/reauth detected. Waiting for direct user click on banner to prevent browser popup block.');
        return;
      }

      hasAutoTriggeredReauth = true;
      isSimulatingClick = true;
      console.log('[AuthPrompt] Google disconnect/reauth detected. Simulating automatic login button click...');

      if (window.CloudSync && window.CloudSync.waitForGis && (!window.google || !window.google.accounts || !window.google.accounts.oauth2)) {
        await window.CloudSync.waitForGis(1500);
      } else {
        await new Promise(r => setTimeout(r, 100));
      }

      if (bannerBtn && !bannerBtn.disabled) {
        bannerBtn.click();
      }
      setTimeout(() => { isSimulatingClick = false; }, 500);
    };

    const updateBannerVisibility = async () => {
      // Don't display floating banner if full-screen login or splash screen is active
      const loginScreen = document.getElementById('login-screen');
      const splashScreen = document.getElementById('splash-screen');
      if ((loginScreen && !loginScreen.classList.contains('hidden')) ||
        (splashScreen && !splashScreen.classList.contains('hidden'))) {
        banner.classList.add('hidden');
        return;
      }

      const loggedIn = await CloudSync.isLoggedIn();
      const status = CloudSync.getStatus();
      const validToken = CloudSync.hasValidToken ? await CloudSync.hasValidToken() : true;
      const isReauthNeeded = status === 'reauth_needed' || (loggedIn && !validToken);

      // If logged in and synced with valid token, hide banner immediately
      if (loggedIn && !isReauthNeeded) {
        banner.classList.add('hidden');
        hasAutoTriggeredReauth = false;
        return;
      }

      // If re-auth is needed (session expired or token invalid / disconnected)
      if (isReauthNeeded) {
        if (bannerTitle) bannerTitle.textContent = I18n.t('auth_prompt_reauth_title');
        if (bannerSub) bannerSub.textContent = I18n.t('auth_prompt_reauth_sub');
        if (bannerBtn) bannerBtn.disabled = false;
        banner.classList.remove('hidden');

        // Simulate automatic click as if user clicked the button, while keeping banner visible
        simulateAutoLoginClick();
        return;
      }

      // If not logged in and not dismissed by user in this session
      if (!loggedIn && !isDismissed) {
        if (bannerTitle) bannerTitle.textContent = I18n.t('auth_prompt_title');
        if (bannerSub) bannerSub.textContent = I18n.t('auth_prompt_sub');
        banner.classList.remove('hidden');
      } else {
        banner.classList.add('hidden');
      }
    };

    // Close / Dismiss button handler
    if (bannerClose) {
      bannerClose.onclick = () => {
        banner.classList.add('hidden');
        sessionStorage.setItem('authBannerDismissed', 'true');
        isDismissed = true;
      };
    }

    // 1-Click Sign-In button handler
    if (bannerBtn) {
      bannerBtn.onclick = (e) => {
        const isAuto = isSimulatingClick || (e && !e.isTrusted);
        bannerBtn.disabled = true;
        CloudSync.loginWithGoogle(
          async (profile) => {
            bannerBtn.disabled = false;
            hasAutoTriggeredReauth = false;
            UI.toast(`${I18n.t('connected_as')} ${profile.name || I18n.t('google_user')}! 👋`, 'success');
            banner.classList.add('hidden');
            await CloudSync.pullData();
            if (typeof updateGoogleUI === 'function') updateGoogleUI();
          },
          (err) => {
            bannerBtn.disabled = false;
            if (err) {
              const msg = typeof err === 'string' ? err : (err.message || String(err));
              UI.toast(msg, 'warning');
            }
          },
          isAuto
        );
      };
    }

    // Initial checks (immediate and scheduled)
    updateBannerVisibility();
    setTimeout(updateBannerVisibility, 600);
    setTimeout(updateBannerVisibility, 1500);

    // Listen to sync status changes
    if (CloudSync.onSyncStatusChange) {
      CloudSync.onSyncStatusChange((newStatus) => {
        if (newStatus === 'synced') {
          hasAutoTriggeredReauth = false;
        }
        updateBannerVisibility();
      });
    }

    // Expose for language updates
    window.updateAuthPromptUI = updateBannerVisibility;
  }

  return {
    init,
    navigateTo,
    updatePlanDates,
    recalculatePlanIndex,
    shareBackup,
    requestWakeLock,
    releaseWakeLock,
    toggleWakeLock,
    isReady: () => isAppInitialized
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
    if (window.App && window.App.isReady && !window.App.isReady()) return;
    try {
      // 0. Re-request Wake Lock if user enabled it to prevent screen sleep during workouts
      if (window.App && window.App.requestWakeLock) {
        await window.App.requestWakeLock();
      }

      // 1. Update dates and active index since the day might have changed
      if (window.App && window.App.recalculatePlanIndex) {
        await window.App.recalculatePlanIndex();
      }

      // 2. Reset nutrition date to today and render UI immediately to reflect new day if it changed
      if (window.TodayPage && window.TodayPage.resetNutritionDateToToday) {
        window.TodayPage.resetNutritionDateToToday();
      }
      if (window.TodayPage && window.TodayPage.render) {
        window.TodayPage.render();
      }

      // 3. Proactive token check and sync on app foreground
      if (window.CloudSync && window.CloudSync.proactiveRefreshIfExpiring) {
        window.CloudSync.proactiveRefreshIfExpiring();
      }

      const savedUrl = await DB.getSetting('cloudSyncUrl');
      const hasOAuthToken = await CloudSync.isLoggedIn();
      if (savedUrl || hasOAuthToken) {
        console.log("App foregrounded, checking latest data...");
        if (window.CloudSync && window.CloudSync.checkAndPullIfUpdated) {
          await window.CloudSync.checkAndPullIfUpdated();
        } else {
          await CloudSync.pullData();
        }
        const activeSection = document.querySelector('.page.active');
        const activeId = activeSection ? activeSection.id : '';
        if (activeId === 'page-stats' && window.StatsPage && window.StatsPage.render) {
          window.StatsPage.render();
        } else if (window.TodayPage && window.TodayPage.render) {
          window.TodayPage.render();
        }
      }
    } catch (err) {
      console.warn('Visibility change handler error:', err);
    }
  }
});

window.addEventListener('focus', async () => {
  if (window.App && window.App.isReady && !window.App.isReady()) return;
  if (navigator.onLine && window.CloudSync && window.CloudSync.checkAndPullIfUpdated) {
    try {
      await window.CloudSync.checkAndPullIfUpdated();
    } catch (err) {
      console.warn('Focus handler sync error:', err);
    }
  }
});

/**
 * Manual trigger for Live Dashboard instant refresh
 */
window.refreshDashboardData = async function() {
  const badgeText = document.getElementById('stats-live-status-text');
  if (badgeText) badgeText.innerText = (window.I18n && window.I18n.t('syncing')) || 'מרענן...';
  
  try {
    if (window.CloudSync && window.CloudSync.checkAndPullIfUpdated) {
      await window.CloudSync.checkAndPullIfUpdated();
    } else if (window.CloudSync && window.CloudSync.pullData) {
      await window.CloudSync.pullData();
    }
    
    if (window.StatsPage && window.StatsPage.render) {
      await window.StatsPage.render();
    }
    
    if (window.UI && window.UI.toast) {
      UI.toast((window.I18n && window.I18n.t('dashboard_updated_toast')) || 'הדשבורד עודכן עם נתוני האימון האחרונים! ⚡', 'success');
    }
  } catch (e) {
    console.error('Refresh dashboard error:', e);
  } finally {
    if (badgeText) badgeText.innerText = (window.I18n && window.I18n.t('dashboard_live_active')) || 'דשבורד חי';
  }
};

