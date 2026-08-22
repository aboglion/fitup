/**
 * Cloud Synchronization Module (Google Drive Direct)
 * Handles direct sync with Google Drive appData / user Drive files and Google OAuth2 Sign-In.
 */
const CloudSync = (() => {
  let isSyncing = false;
  let syncTimeout = null;
  let currentStatus = 'idle'; // 'idle' | 'syncing' | 'synced' | 'reauth_needed' | 'offline' | 'error'
  const statusListeners = [];
  const FILE_NAME = 'fitup-data.json';

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
   * Schedule background sync (debounced 3s)
   */
  function scheduleSync() {
    if (syncTimeout) clearTimeout(syncTimeout);
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
   * Save Google Access Token
   */
  async function setAccessToken(token, userProfile = null) {
    await DB.setSetting('googleAccessToken', token);
    await DB.setSetting('googleTokenExpired', false);
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
   * Check if active valid token is ready for API calls
   */
  async function hasValidToken() {
    const token = await getAccessToken();
    const isExpired = await DB.getSetting('googleTokenExpired');
    return Boolean(token && token.length > 10 && !isExpired);
  }

  /**
   * Handle Expired Token without deleting user profile (preserves login session identity)
   */
  async function handleTokenExpired() {
    await DB.setSetting('googleAccessToken', null);
    await DB.setSetting('googleTokenExpired', true);
    setStatus('reauth_needed');
    promptReauth();
  }

  /**
   * Attempt silent token renewal via GIS OAuth token client if profile exists
   */
  async function trySilentRefresh() {
    const profile = await getUserProfile();
    if (!profile || !profile.email) return false;

    const clientId = await getClientId();
    if (window.google && window.google.accounts && window.google.accounts.oauth2) {
      return new Promise((resolve) => {
        try {
          const client = window.google.accounts.oauth2.initTokenClient({
            client_id: clientId,
            scope: 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/fitness.activity.read https://www.googleapis.com/auth/fitness.body.read https://www.googleapis.com/auth/fitness.heart_rate.read',
            hint: profile.email,
            prompt: '',
            callback: async (response) => {
              if (response.access_token) {
                await setAccessToken(response.access_token, profile);
                await DB.setSetting('googleTokenExpired', false);
                setStatus('synced');
                console.log('Silent token refresh succeeded for:', profile.email);
                resolve(true);
              } else {
                console.log('Silent token refresh required user interaction.');
                setStatus('reauth_needed');
                resolve(false);
              }
            }
          });
          client.requestAccessToken({ prompt: '' });
        } catch (e) {
          console.warn('Silent refresh error:', e);
          resolve(false);
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
    setStatus('idle');
    if (typeof UI !== 'undefined' && UI.toast) UI.toast('התנתקת מחשבון גוגל', 'info');
  }

  /**
   * Find existing fitup-data.json file ID in Google Drive
   */
  async function findDriveFileId(token) {
    try {
      const q = encodeURIComponent(`name = '${FILE_NAME}' and trashed = false`);
      const res = await fetch(`https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(id,name)`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.status === 401) {
        return { error: 401 };
      }
      if (!res.ok) return null;
      const data = await res.json();
      return data.files && data.files.length > 0 ? data.files[0].id : null;
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

    const token = await getAccessToken();
    const legacyUrl = await DB.getSetting('cloudSyncUrl');

    if (!token && !legacyUrl) {
      setStatus('idle');
      if (manual && typeof UI !== 'undefined' && UI.toast) {
        UI.toast('לא התחברת לחשבון גוגל (Google Drive).', 'error');
      }
      return { success: false, error: 'Not logged in' };
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
      setStatus('synced');

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

    const token = await getAccessToken();
    const legacyUrl = await DB.getSetting('cloudSyncUrl');

    if (!token && !legacyUrl) {
      setStatus('idle');
      return { success: false, error: 'Not logged in' };
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
   * Sign-in with Google OAuth Token Client (GIS API) or Manual Token Prompt
   */
  async function loginWithGoogle(onSuccess, onError) {
    const clientId = await getClientId();
    const profile = await getUserProfile();

    if (window.google && window.google.accounts && window.google.accounts.oauth2) {
      try {
        const clientOptions = {
          client_id: clientId,
          scope: 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/fitness.activity.read https://www.googleapis.com/auth/fitness.body.read https://www.googleapis.com/auth/fitness.heart_rate.read',
          callback: async (response) => {
            if (response.access_token) {
              const fetchedProfile = await fetchGoogleProfile(response.access_token);
              const finalProfile = (fetchedProfile && fetchedProfile.email) ? fetchedProfile : profile;
              await setAccessToken(response.access_token, finalProfile);
              setStatus('synced');
              if (onSuccess) onSuccess(finalProfile);
            } else if (response.error) {
              console.warn('Google OAuth error:', response.error);
              if (onError) onError(response.error_description || response.error);
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
        console.warn('GIS Token client init failed:', e);
      }
    }

    // Fallback: prompt for Access Token / Google Auth Key
    const inputToken = prompt('הכנס אסימון גישה (Google OAuth Access Token) או מפתח:');
    if (inputToken && inputToken.trim()) {
      setAccessToken(inputToken.trim()).then(() => {
        setStatus('synced');
        if (onSuccess) onSuccess({ name: 'משתמש גוגל', email: '' });
      });
    } else if (onError) {
      onError('לא הוכנס אסימון');
    }
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

  return {
    syncData,
    pullData,
    scheduleSync,
    getLastSyncText,
    getAccessToken,
    setAccessToken,
    isLoggedIn,
    hasValidToken,
    trySilentRefresh,
    getUserProfile,
    logout,
    loginWithGoogle,
    getStatus,
    onSyncStatusChange,
    showConflictModal,
    checkAndResolveConflict
  };
})();

window.CloudSync = CloudSync;

