/**
 * Cloud Synchronization Module (Google Drive Direct)
 * Handles direct sync with Google Drive appData / user Drive files and Google OAuth2 Sign-In.
 */
const CloudSync = (() => {
  let isSyncing = false;
  let syncTimeout = null;
  let currentStatus = 'idle'; // 'idle' | 'syncing' | 'synced' | 'reauth_needed' | 'offline' | 'error'
  const statusListeners = [];
  const dataUpdateListeners = [];
  let cachedDriveFileId = null;
  let lastKnownCloudModified = null;
  let autoSyncIntervalId = null;
  const FILE_NAME = 'fitup-data.json';

  function onDataUpdate(callback) {
    if (typeof callback === 'function') {
      dataUpdateListeners.push(callback);
    }
  }

  function notifyDataUpdated(source = 'unknown') {
    dataUpdateListeners.forEach(cb => {
      try { cb(source); } catch (e) { console.error('Data update listener error:', e); }
    });
    if (source !== 'broadcast') {
      broadcastDataUpdate(source);
    }
  }

  // Cross-tab / cross-window synchronization bus
  let syncBroadcastChannel = null;
  try {
    if (typeof BroadcastChannel !== 'undefined') {
      syncBroadcastChannel = new BroadcastChannel('fitup_sync_bus');
      syncBroadcastChannel.onmessage = (event) => {
        if (event.data && event.data.type === 'DATA_UPDATED') {
          console.log('[CloudSync] Received cross-tab DATA_UPDATED message:', event.data.source);
          notifyDataUpdated('broadcast');
        }
      };
    }
  } catch (e) {
    console.warn('BroadcastChannel not supported:', e);
  }

  function broadcastDataUpdate(source = 'local') {
    if (syncBroadcastChannel) {
      try {
        syncBroadcastChannel.postMessage({ type: 'DATA_UPDATED', source, ts: Date.now() });
      } catch (e) {
        console.warn('Broadcast error:', e);
      }
    }
  }

  // Default Client ID for standard Google Identity Services (or configurable in DB)
  const DEFAULT_CLIENT_ID = '189174154188-blcjekhejsmenu6vg9ptt2e5pqnnfbv8.apps.googleusercontent.com'; 

  function setStatus(status, detail = '') {
    currentStatus = status;
    statusListeners.forEach(cb => {
      try { cb(status, detail); } catch (e) { console.error('Sync status listener error:', e); }
    });
  }

  function getStatus() {
    return currentStatus;
  }

  function onSyncStatusChange(callback) {
    if (typeof callback === 'function') {
      statusListeners.push(callback);
    }
  }

  /**
   * Prompt user to re-authenticate with Google
   */
  function promptReauth() {
    if (typeof UI !== 'undefined' && UI.toast) {
      UI.toast('פג תוקף אסימון גוגל ⚠️ לחץ בהגדרות או כאן לחיבור מחדש', 'warning');
    }
  }

  /**
   * Opportunistically refresh token during user gestures (click/tap) if expiring within 15 minutes
   */
  async function proactiveRefreshIfExpiring() {
    try {
      const hasUserActivation = typeof navigator !== 'undefined' && navigator.userActivation ? navigator.userActivation.isActive : false;
      if (!hasUserActivation) return;

      const token = await getAccessToken();
      const profile = await getUserProfile();
      if (!token || !profile || !profile.email) return;

      const expiryTimestamp = await DB.getSetting('googleTokenExpiry');
      // If token expires in less than 15 minutes (900 seconds) or is already expired
      const shouldRefresh = !expiryTimestamp || (expiryTimestamp - Date.now() < 900000);
      if (shouldRefresh) {
        console.log('[CloudSync] Token nearing expiry during user interaction. Proactively refreshing in background...');
        await trySilentRefresh();
      }
    } catch (e) {
      console.debug('[CloudSync] Proactive refresh check skipped:', e);
    }
  }

  /**
   * Schedule background sync (debounced 3s)
   */
  function scheduleSync() {
    if (syncTimeout) clearTimeout(syncTimeout);
    broadcastDataUpdate('local');

    // Opportunistically refresh token while user activation gesture is active
    proactiveRefreshIfExpiring();

    syncTimeout = setTimeout(() => {
      syncData(false);
    }, 3000);
  }

  /**
   * Get Google Access Token
   */
  async function getAccessToken() {
    return await DB.getSetting('googleAccessToken');
  }

  /**
   * Save Google Access Token with expiration TTL calculation
   */
  async function setAccessToken(token, userProfile = null, expiresIn = 3600) {
    await DB.setSetting('googleAccessToken', token);
    await DB.setSetting('googleTokenExpired', false);

    const ttlSeconds = typeof expiresIn === 'number' && expiresIn > 0 ? expiresIn : parseInt(expiresIn, 10) || 3600;
    // Keep 60s safety buffer before absolute expiry
    const expiryTimestamp = Date.now() + Math.max(600, (ttlSeconds - 60)) * 1000;
    await DB.setSetting('googleTokenExpiry', expiryTimestamp);

    if (userProfile) {
      await DB.setSetting('googleUserProfile', userProfile);
    }
    return token;
  }

  /**
   * Check if user is identified / logged in with Google profile
   */
  async function isLoggedIn() {
    const profile = await getUserProfile();
    const token = await getAccessToken();
    return Boolean((profile && (profile.name || profile.email)) || (token && token.length > 10));
  }

  /**
   * Check if active valid token is ready for API calls (checks TTL timestamp)
   */
  async function hasValidToken() {
    const token = await getAccessToken();
    const isExpiredFlag = await DB.getSetting('googleTokenExpired');
    const expiryTimestamp = await DB.getSetting('googleTokenExpiry');

    if (!token || token.length < 10 || isExpiredFlag) return false;
    if (expiryTimestamp && Date.now() >= expiryTimestamp) return false;

    return true;
  }

  /**
   * Ensure active valid access token, performing silent refresh in background if expired
   */
  async function ensureValidToken() {
    const isValid = await hasValidToken();
    if (isValid) {
      return await getAccessToken();
    }

    const token = await getAccessToken();
    const profile = await getUserProfile();
    const isExplicitlyExpired = await DB.getSetting('googleTokenExpired');

    // If active user gesture is present, proactively attempt silent GIS token renewal
    const hasUserActivation = typeof navigator !== 'undefined' && navigator.userActivation ? navigator.userActivation.isActive : false;
    if (hasUserActivation && profile && profile.email) {
      console.log('[CloudSync] Token expired/near expiry with active user gesture. Attempting token refresh...');
      const refreshed = await trySilentRefresh();
      if (refreshed) {
        return await getAccessToken();
      }
    }

    // If token exists and was not explicitly rejected with 401, allow using it for API call
    // rather than preemptively failing and disconnecting!
    if (token && token.length > 10 && !isExplicitlyExpired) {
      console.log('[CloudSync] Token TTL near limit, attempting API call before disconnecting...');
      return token;
    }

    if (profile && (profile.email || profile.name)) {
      console.log('[CloudSync] Token missing or expired without active user gesture. Setting reauth_needed.');
      setStatus('reauth_needed');
    }

    return null;
  }

  /**
   * Handle Expired Token without deleting user profile (preserves login session identity)
   */
  async function handleTokenExpired() {
    await DB.setSetting('googleAccessToken', null);
    await DB.setSetting('googleTokenExpired', true);
    await DB.setSetting('googleTokenExpiry', 0);
    setStatus('reauth_needed');
    promptReauth();
  }

  /**
   * Attempt token renewal via GIS OAuth token client if profile exists and user gesture is present
   */
  async function trySilentRefresh() {
    const profile = await getUserProfile();
    if (!profile || !profile.email) return false;

    // Check user activation. In modern browsers, opening a popup requires a direct user gesture (click/tap).
    // In Google Identity Services (GIS), requestAccessToken() ALWAYS opens a popup window.
    // If called without user activation (e.g. on page load, reload, or background sync),
    // browsers automatically block the popup and log [GSI_LOGGER] popup blocked.
    const hasUserActivation = typeof navigator !== 'undefined' && navigator.userActivation ? navigator.userActivation.isActive : false;
    if (typeof navigator !== 'undefined' && navigator.userActivation && !hasUserActivation) {
      console.log('[CloudSync] Skipping GIS popup request without user gesture.');
      // Do not prematurely set reauth_needed here; current token may still be usable
      return false;
    }

    const clientId = await getClientId();
    if (window.google && window.google.accounts && window.google.accounts.oauth2) {
      return new Promise((resolve) => {
        let settled = false;
        const done = (val) => {
          if (!settled) {
            settled = true;
            resolve(val);
          }
        };

        // Safety timeout so Promise never hangs
        const timeout = setTimeout(() => {
          console.warn('[CloudSync] Token refresh timed out');
          setStatus('reauth_needed');
          done(false);
        }, 8000);

        try {
          const client = window.google.accounts.oauth2.initTokenClient({
            client_id: clientId,
            scope: 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/fitness.activity.read https://www.googleapis.com/auth/fitness.body.read https://www.googleapis.com/auth/fitness.heart_rate.read',
            hint: profile.email,
            prompt: '',
            callback: async (response) => {
              clearTimeout(timeout);
              if (response.access_token) {
                const expiresIn = response.expires_in || 3600;
                await setAccessToken(response.access_token, profile, expiresIn);
                await DB.setSetting('googleTokenExpired', false);
                setStatus('synced');
                console.log('[CloudSync] Token refresh succeeded for:', profile.email);
                done(true);
              } else {
                console.log('[CloudSync] Token refresh required user interaction.');
                setStatus('reauth_needed');
                done(false);
              }
            },
            error_callback: (err) => {
              clearTimeout(timeout);
              console.warn('[CloudSync] GIS Token refresh error / popup blocked:', err);
              setStatus('reauth_needed');
              done(false);
            }
          });
          client.requestAccessToken({ prompt: '' });
        } catch (e) {
          clearTimeout(timeout);
          console.warn('[CloudSync] Silent refresh error:', e);
          setStatus('reauth_needed');
          done(false);
        }
      });
    }
    return false;
  }

  /**
   * Get Google User Profile
   */
  async function getUserProfile() {
    return await DB.getSetting('googleUserProfile');
  }

  /**
   * Logout from Google
   */
  async function logout() {
    await DB.setSetting('googleAccessToken', null);
    await DB.setSetting('googleUserProfile', null);
    await DB.setSetting('googleTokenExpired', false);
    await DB.setSetting('googleTokenExpiry', null);
    setStatus('idle');
    if (typeof UI !== 'undefined' && UI.toast) UI.toast('התנתקת מחשבון גוגל', 'info');
  }

  /**
   * Find existing fitup-data.json file ID in Google Drive
   */
  async function findDriveFileId(token) {
    if (cachedDriveFileId) return cachedDriveFileId;
    try {
      const q = encodeURIComponent(`name = '${FILE_NAME}' and trashed = false`);
      const res = await fetch(`https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(id,name,modifiedTime)`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.status === 401) {
        return { error: 401 };
      }
      if (!res.ok) return null;
      const data = await res.json();
      if (data.files && data.files.length > 0) {
        cachedDriveFileId = data.files[0].id;
        if (data.files[0].modifiedTime && !lastKnownCloudModified) {
          lastKnownCloudModified = data.files[0].modifiedTime;
        }
        return data.files[0].id;
      }
      return null;
    } catch (e) {
      console.error('Find Drive file error:', e);
      return null;
    }
  }

  /**
   * Save data directly to Google Drive
   */
  async function syncData(manual = false) {
    if (!navigator.onLine) {
      await DB.setSetting('pendingSyncQueue', true);
      setStatus('offline');
      if (manual && typeof UI !== 'undefined' && UI.toast) {
        UI.toast('אין חיבור לאינטרנט. השינויים נשמרו מקומית ויסונכרנו אוטומטית ברגע שתתחבר! 📶', 'warning');
      }
      return { success: false, error: 'Offline' };
    }

    if (isSyncing) return { success: false, error: 'כבר מתבצע סנכרון כרגע.' };

    const token = await ensureValidToken();
    const legacyUrl = await DB.getSetting('cloudSyncUrl');

    if (!token && !legacyUrl) {
      const profile = await getUserProfile();
      if (profile && (profile.email || profile.name)) {
        setStatus('reauth_needed');
      } else {
        setStatus('idle');
      }
      if (manual && typeof UI !== 'undefined' && UI.toast) {
        if (profile && (profile.email || profile.name)) {
          UI.toast('פג תוקף אסימון גוגל ⚠️ לחץ להתחברות מחדש', 'warning');
        } else {
          UI.toast('לא התחברת לחשבון גוגל (Google Drive).', 'error');
        }
      }
      return { success: false, error: 'Not logged in or reauth needed' };
    }

    try {
      isSyncing = true;
      setStatus('syncing');
      if (manual && typeof UI !== 'undefined' && UI.toast) {
        UI.toast('מסנכרן נתונים מול Google Drive...', 'info');
      }

      const dataToSync = await DB.exportData();

      // If legacy Google Apps Script URL exists and no direct OAuth token
      if (!token && legacyUrl) {
        const response = await fetch(legacyUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify(dataToSync)
        });
        if (!response.ok) throw new Error('שגיאת רשת מול שרת גוגל');
        const result = await response.json();
        if (result.status === 'success') {
          if (result.data) await DB.importData(result.data, true);
          const timestamp = new Date().toISOString();
          await DB.setSetting('lastSyncDate', timestamp);
          setStatus('synced');
          if (manual && typeof UI !== 'undefined' && UI.toast) UI.toast('הסנכרון עבר בהצלחה! ✅', 'success');
          return { success: true, timestamp };
        }
      }

      // Direct Google Drive REST API
      const fileIdResult = await findDriveFileId(token);
      if (fileIdResult && fileIdResult.error === 401) {
        await handleTokenExpired();
        throw new Error('פג תוקף אסימון הגישה של גוגל. נא להתחבר מחדש.');
      }

      const fileId = typeof fileIdResult === 'string' ? fileIdResult : null;
      const jsonContent = JSON.stringify(dataToSync, null, 2);

      let uploadUrl;
      let method;
      let headers = {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json; charset=UTF-8'
      };
      let multipartResponseBody = null;

      if (fileId) {
        // Update existing file
        uploadUrl = `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`;
        method = 'PATCH';
      } else {
        // Create new file via multipart upload
        const metadata = { name: FILE_NAME, mimeType: 'application/json' };
        const boundary = '-------314159265358979323846';
        const delimiter = "\r\n--" + boundary + "\r\n";
        const close_delim = "\r\n--" + boundary + "--";

        multipartResponseBody =
          delimiter +
          'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
          JSON.stringify(metadata) +
          delimiter +
          'Content-Type: application/json\r\n\r\n' +
          jsonContent +
          close_delim;

        uploadUrl = 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart';
        method = 'POST';
        headers['Content-Type'] = 'multipart/related; boundary="' + boundary + '"';
      }

      const res = await fetch(uploadUrl, {
        method: method,
        headers: headers,
        body: method === 'PATCH' ? jsonContent : multipartResponseBody
      });

      if (!res.ok) {
        if (res.status === 401) {
          await handleTokenExpired();
          throw new Error('פג תוקף אסימון הגישה של גוגל. נא להתחבר מחדש.');
        }
        throw new Error(`שגיאת Google Drive (HTTP ${res.status})`);
      }

      const timestamp = new Date().toISOString();
      await DB.setSetting('lastSyncDate', timestamp);
      await DB.setSetting('pendingSyncQueue', false);
      const resJson = await res.json().catch(() => null);
      if (resJson && resJson.id) {
        cachedDriveFileId = resJson.id;
      }
      if (resJson && resJson.modifiedTime) {
        lastKnownCloudModified = resJson.modifiedTime;
        await DB.setSetting('lastKnownCloudModifiedTime', resJson.modifiedTime);
      }
      setStatus('synced');
      broadcastDataUpdate('local');

      if (manual && typeof UI !== 'undefined' && UI.toast) UI.toast('הנתונים נשמרו בהצלחה ב-Google Drive! ☁️', 'success');
      return { success: true, timestamp };

    } catch (error) {
      console.error('Cloud Sync Error:', error);
      if (currentStatus !== 'reauth_needed') setStatus('error', error.message);
      if (manual && typeof UI !== 'undefined' && UI.toast) UI.toast('שגיאה בסנכרון: ' + error.message, 'error');
      return { success: false, error: error.message };
    } finally {
      isSyncing = false;
    }
  }

  /**
   * Pull data from Google Drive file
   */
  async function pullData() {
    if (!navigator.onLine) {
      setStatus('offline');
      return { success: false, error: 'Offline' };
    }

    const token = await ensureValidToken();
    const legacyUrl = await DB.getSetting('cloudSyncUrl');

    if (!token && !legacyUrl) {
      const profile = await getUserProfile();
      if (profile && (profile.email || profile.name)) {
        setStatus('reauth_needed');
      } else {
        setStatus('idle');
      }
      return { success: false, error: 'Not logged in or reauth needed' };
    }

    try {
      setStatus('syncing');

      if (!token && legacyUrl) {
        const response = await fetch(legacyUrl);
        if (!response.ok) throw new Error('Network error');
        const data = await response.json();
        if (data && !data.error) {
          await DB.importData(data, true);
          if (window.I18n && window.I18n.init) await window.I18n.init();
          setStatus('synced');
          notifyDataUpdated('cloud');
          return { success: true };
        }
      }

      const fileIdResult = await findDriveFileId(token);
      if (fileIdResult && fileIdResult.error === 401) {
        await handleTokenExpired();
        return { success: false, error: 'Token expired' };
      }

      const fileId = typeof fileIdResult === 'string' ? fileIdResult : null;
      if (!fileId) {
        setStatus('synced');
        return { success: false, error: 'No backup file found in Drive' };
      }

      const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.ok) {
        if (res.status === 401) {
          await handleTokenExpired();
          return { success: false, error: 'Token expired' };
        }
        throw new Error(`HTTP ${res.status}`);
      }

      const data = await res.json();
      if (data) {
        await DB.importData(data, true);
        if (window.I18n && window.I18n.init) await window.I18n.init();
        setStatus('synced');
        notifyDataUpdated('cloud');
        return { success: true };
      }
      setStatus('error', 'Invalid data');
      return { success: false, error: 'Invalid data' };

    } catch (error) {
      console.error('Cloud Sync Pull Error:', error);
      if (currentStatus !== 'reauth_needed') setStatus('error', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get formatted last sync text
   */
  async function getLastSyncText() {
    const timestamp = await DB.getSetting('lastSyncDate');
    if (!timestamp) return 'מעולם לא בוצע סנכרון';

    const date = new Date(timestamp);
    return date.toLocaleString('he-IL', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  }

  /**
   * Get embedded Google OAuth Client ID
   */
  async function getClientId() {
    return DEFAULT_CLIENT_ID;
  }

  /**
   * Detect if running as standalone PWA / WebApp on Android or iOS
   */
  function isStandalone() {
    return Boolean(
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone ||
      document.referrer.includes('android-app://') ||
      window.location.search.includes('mode=pwa')
    );
  }

  /**
   * Open Google OAuth login flow in an external system browser window / Chrome Custom Tab
   */
  function openExternalGoogleOAuth(clientId) {
    const redirectUri = window.location.origin + window.location.pathname;
    const scope = 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/fitness.activity.read https://www.googleapis.com/auth/fitness.body.read https://www.googleapis.com/auth/fitness.heart_rate.read';
    
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${encodeURIComponent(clientId)}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&response_type=token` +
      `&scope=${encodeURIComponent(scope)}` +
      `&include_granted_scopes=true` +
      `&prompt=select_account`;

    console.log('Opening external Google OAuth URL:', authUrl);

    // In PWA standalone mode, target="_blank" opens in Chrome Custom Tab / System Browser window
    const newWin = window.open(authUrl, '_blank');
    if (!newWin || newWin.closed || typeof newWin.closed === 'undefined') {
      window.location.href = authUrl;
    }
  }

  /**
   * Handle OAuth Token Redirect Callback from URL (hash or search)
   */
  async function handleOAuthRedirect() {
    const hash = window.location.hash || '';
    const search = window.location.search || '';
    let token = null;

    if (hash.includes('access_token=')) {
      const params = new URLSearchParams(hash.substring(1));
      token = params.get('access_token');
    } else if (search.includes('access_token=')) {
      const params = new URLSearchParams(search.substring(1));
      token = params.get('access_token');
    }

    if (token) {
      console.log('Google OAuth callback token detected in URL!');
      try {
        const params = new URLSearchParams(hash.includes('access_token=') ? hash.substring(1) : search.substring(1));
        const expiresIn = parseInt(params.get('expires_in'), 10) || 3600;
        const fetchedProfile = await fetchGoogleProfile(token);
        await setAccessToken(token, fetchedProfile, expiresIn);
        setStatus('synced');
        
        // Clean URL hash without reloading page
        const cleanUrl = window.location.origin + window.location.pathname;
        window.history.replaceState(null, '', cleanUrl);

        if (typeof UI !== 'undefined' && UI.toast) {
          UI.toast(`התחברת בהצלחה לחשבון גוגל (${fetchedProfile.name || fetchedProfile.email || ''})! ☁️`, 'success');
        }
        
        // Auto pull cloud data after successful login
        pullData().catch(e => console.warn('Post-login pull error:', e));

        return { success: true, profile: fetchedProfile };
      } catch (err) {
        console.error('Error handling Google OAuth callback:', err);
      }
    }
    return null;
  }

  /**
   * Sign-in with Google OAuth Token Client (GIS API) or External Browser Window Fallback
   */
  async function loginWithGoogle(onSuccess, onError) {
    const clientId = await getClientId();
    const profile = await getUserProfile();

    // If running in PWA standalone display mode on Android/iOS, launch external system browser (Chrome Custom Tab)
    if (isStandalone()) {
      console.log('Running in PWA Standalone mode. Opening Google OAuth in external system browser...');
      openExternalGoogleOAuth(clientId);
      return;
    }

    if (window.google && window.google.accounts && window.google.accounts.oauth2) {
      try {
        const clientOptions = {
          client_id: clientId,
          scope: 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/fitness.activity.read https://www.googleapis.com/auth/fitness.body.read https://www.googleapis.com/auth/fitness.heart_rate.read',
          callback: async (response) => {
            if (response.access_token) {
              const fetchedProfile = await fetchGoogleProfile(response.access_token);
              const finalProfile = (fetchedProfile && fetchedProfile.email) ? fetchedProfile : profile;
              const expiresIn = response.expires_in || 3600;
              await setAccessToken(response.access_token, finalProfile, expiresIn);
              setStatus('synced');
              if (onSuccess) onSuccess(finalProfile);
            } else if (response.error) {
              console.warn('Google OAuth error:', response.error);
              if (response.error === 'popup_closed_by_user') {
                if (onError) onError('התחברות גוגל בוטלה');
              } else {
                console.log('Falling back to external browser OAuth...');
                openExternalGoogleOAuth(clientId);
              }
            }
          },
          error_callback: (error) => {
            console.warn('Google OAuth error_callback:', error);
            if (error.type === 'popup_closed') {
              if (onError) onError('התחברות גוגל בוטלה');
            } else if (error.type === 'popup_failed_to_open') {
              console.log('Popup failed to open, falling back to external OAuth window...');
              openExternalGoogleOAuth(clientId);
            } else {
              if (onError) onError(error.type || 'Google OAuth error');
            }
          }
        };

        if (profile && profile.email) {
          clientOptions.hint = profile.email;
        }

        const client = window.google.accounts.oauth2.initTokenClient(clientOptions);
        client.requestAccessToken();
        return;
      } catch (e) {
        console.warn('GIS Token client init failed, opening external OAuth window:', e);
        openExternalGoogleOAuth(clientId);
        return;
      }
    }

    // Fallback if GIS window.google is not available or blocked by PWA/browser
    openExternalGoogleOAuth(clientId);
  }

  async function fetchGoogleProfile(token) {
    try {
      const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn('Fetch Google Profile error:', e);
    }
    return { name: 'משתמש גוגל', email: '' };
  }

  // Check for Google OAuth callback on script execution
  handleOAuthRedirect();

  // Listener for regaining internet connection to auto-retry pending sync
  window.addEventListener('online', async () => {
    console.log('Network connection restored. Processing offline sync queue...');
    const hasPendingSync = await DB.getSetting('pendingSyncQueue');
    if ((hasPendingSync || (await isLoggedIn())) && navigator.onLine) {
      const res = await syncData(false);
      if (res && res.success) {
        await DB.setSetting('pendingSyncQueue', false);
        if (typeof UI !== 'undefined' && UI.toast) {
          UI.toast('התחברת לרשת! נתוני האימון האופליין סונכרנו בהצלחה ☁️✅', 'success');
        }
      }
    }
  });

  window.addEventListener('offline', () => {
    setStatus('offline');
  });

  /**
   * Display Sync Conflict Resolution Modal
   */
  function showConflictModal(localData, cloudData, onChoice) {
    const localCompleted = (localData.tracking || []).filter(t => t.completed).length;
    const cloudCompleted = (cloudData.tracking || []).filter(t => t.completed).length;
    const localDate = localData.lastSyncDate ? new Date(localData.lastSyncDate).toLocaleString() : '—';
    const cloudDate = cloudData.lastSyncDate ? new Date(cloudData.lastSyncDate).toLocaleString() : '—';

    const title = (window.I18n && window.I18n.t('sync_conflict_title')) || 'Cloud Sync Conflict Detected ☁️';
    const desc = (window.I18n && window.I18n.t('sync_conflict_desc')) || 'The workout data on your device differs from the backup saved in Google Drive. Please choose which version to retain:';

    const bodyHTML = `
      <div style="padding: 10px 0; text-align: start;">
        <p style="font-size: 13px; color: var(--text-secondary); margin-bottom: 16px; line-height: 1.5;">${desc}</p>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 20px;">
          <div style="background: var(--bg-card); border: 2px solid var(--accent-primary); border-radius: 12px; padding: 14px; display: flex; flex-direction: column; gap: 6px;">
            <div style="font-size: 14px; font-weight: 800; color: var(--accent-primary); display: flex; align-items: center; gap: 6px;">
              📱 Local Device
            </div>
            <div style="font-size: 11px; color: var(--text-muted);">Updated: ${localDate}</div>
            <div style="font-size: 16px; font-weight: 900; color: var(--text-primary); margin-top: 4px;">${localCompleted} Workouts</div>
          </div>

          <div style="background: var(--bg-card); border: 2px solid #10b981; border-radius: 12px; padding: 14px; display: flex; flex-direction: column; gap: 6px;">
            <div style="font-size: 14px; font-weight: 800; color: #10b981; display: flex; align-items: center; gap: 6px;">
              ☁️ Google Drive
            </div>
            <div style="font-size: 11px; color: var(--text-muted);">Updated: ${cloudDate}</div>
            <div style="font-size: 16px; font-weight: 900; color: var(--text-primary); margin-top: 4px;">${cloudCompleted} Workouts</div>
          </div>
        </div>

        <div style="display: flex; flex-direction: column; gap: 10px;">
          <button id="btn-keep-local" class="btn-primary" style="padding: 12px; font-size: 14px; font-weight: 800; width: 100%;">
            ${(window.I18n && window.I18n.t('keep_local_data')) || '📱 Keep Device Data (Overwrite Cloud)'}
          </button>
          <button id="btn-keep-cloud" class="btn-secondary" style="padding: 12px; font-size: 14px; font-weight: 800; width: 100%; border-color: #10b981; color: #10b981;">
            ${(window.I18n && window.I18n.t('keep_cloud_data')) || '☁️ Restore Cloud Data (Overwrite Device)'}
          </button>
        </div>
      </div>
    `;

    if (typeof UI !== 'undefined' && UI.showModal) {
      UI.showModal(title, bodyHTML);
      const btnLocal = document.getElementById('btn-keep-local');
      const btnCloud = document.getElementById('btn-keep-cloud');
      if (btnLocal) btnLocal.onclick = () => { UI.closeModal(); onChoice('local'); };
      if (btnCloud) btnCloud.onclick = () => { UI.closeModal(); onChoice('cloud'); };
    }
  }

  /**
   * Check for sync conflicts between local DB and cloud data, prompting user if mismatch exists.
   */
  async function checkAndResolveConflict(cloudData) {
    if (!cloudData) return 'local';
    const localData = await DB.exportData();
    const localCompleted = (localData.tracking || []).filter(t => t.completed).length;
    const cloudCompleted = (cloudData.tracking || []).filter(t => t.completed).length;

    if (localCompleted !== cloudCompleted && localCompleted > 0 && cloudCompleted > 0) {
      return new Promise((resolve) => {
        showConflictModal(localData, cloudData, (choice) => {
          resolve(choice);
        });
      });
    }

    return 'local';
  }

  /**
   * Smart lightweight polling: checks file metadata on Google Drive first
   */
  async function checkAndPullIfUpdated() {
    if (!navigator.onLine) return false;
    if (isSyncing) return false;

    const token = await ensureValidToken();
    const legacyUrl = await DB.getSetting('cloudSyncUrl');

    if (!token && !legacyUrl) return false;

    try {
      if (token) {
        const fileIdResult = await findDriveFileId(token);
        if (fileIdResult && fileIdResult.error === 401) {
          await handleTokenExpired();
          return false;
        }

        const fileId = typeof fileIdResult === 'string' ? fileIdResult : (fileIdResult && fileIdResult.id ? fileIdResult.id : null);
        if (!fileId) return false;

        const metaRes = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?fields=id,modifiedTime,version`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (metaRes.status === 401) {
          await handleTokenExpired();
          return false;
        }

        if (metaRes.status === 404) {
          cachedDriveFileId = null;
          return false;
        }

        if (!metaRes.ok) return false;

        const meta = await metaRes.json();
        const driveModified = meta.modifiedTime;

        if (!lastKnownCloudModified) {
          lastKnownCloudModified = await DB.getSetting('lastKnownCloudModifiedTime') || await DB.getSetting('lastSyncDate');
        }

        if (driveModified && driveModified !== lastKnownCloudModified) {
          console.log('[CloudSync] Newer data found on Google Drive:', driveModified, 'Local was:', lastKnownCloudModified);
          const pullResult = await pullData();
          if (pullResult && pullResult.success) {
            lastKnownCloudModified = driveModified;
            await DB.setSetting('lastKnownCloudModifiedTime', driveModified);
            return true;
          }
        }
      } else if (legacyUrl) {
        const pullResult = await pullData();
        return Boolean(pullResult && pullResult.success);
      }
    } catch (e) {
      console.warn('[CloudSync] Check update error:', e);
    }
    return false;
  }

  /**
   * Start periodic auto-sync polling
   */
  function startAutoSync(intervalMs = 120000) {
    if (autoSyncIntervalId) clearInterval(autoSyncIntervalId);

    // Initial check after short delay
    setTimeout(() => {
      checkAndPullIfUpdated();
    }, 10000);

    autoSyncIntervalId = setInterval(() => {
      if (document.visibilityState === 'visible' && navigator.onLine) {
        checkAndPullIfUpdated();
      }
    }, intervalMs);
  }

  /**
   * Stop periodic auto-sync polling
   */
  function stopAutoSync() {
    if (autoSyncIntervalId) {
      clearInterval(autoSyncIntervalId);
      autoSyncIntervalId = null;
    }
  }

  return {
    syncData,
    pullData,
    scheduleSync,
    getLastSyncText,
    getAccessToken,
    setAccessToken,
    isLoggedIn,
    hasValidToken,
    ensureValidToken,
    trySilentRefresh,
    proactiveRefreshIfExpiring,
    getUserProfile,
    logout,
    loginWithGoogle,
    getStatus,
    setStatus,
    onSyncStatusChange,
    showConflictModal,
    checkAndResolveConflict,
    handleOAuthRedirect,
    isStandalone,
    checkAndPullIfUpdated,
    startAutoSync,
    stopAutoSync,
    onDataUpdate,
    notifyDataUpdated,
    broadcastDataUpdate
  };
})();

window.CloudSync = CloudSync;

