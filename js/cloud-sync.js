/**
 * Cloud Synchronization Module (Google Drive Direct)
 * Handles direct sync with Google Drive appData / user Drive files and Google OAuth2 Sign-In.
 */
const CloudSync = (() => {
  let isSyncing = false;
  let syncTimeout = null;
  const FILE_NAME = 'fitup-data.json';

  // Default Client ID for standard Google Identity Services (or configurable in DB)
  const DEFAULT_CLIENT_ID = '189174154188-blcjekhejsmenu6vg9ptt2e5pqnnfbv8.apps.googleusercontent.com'; 

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
    if (userProfile) {
      await DB.setSetting('googleUserProfile', userProfile);
    }
    return token;
  }

  /**
   * Check if logged in with Google
   */
  async function isLoggedIn() {
    const token = await getAccessToken();
    return Boolean(token && token.length > 10);
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
    if (isSyncing) return { success: false, error: 'כבר מתבצע סנכרון כרגע.' };

    const token = await getAccessToken();
    const legacyUrl = await DB.getSetting('cloudSyncUrl');

    if (!token && !legacyUrl) {
      if (manual) UI.toast('לא התחברת לחשבון גוגל (Google Drive).', 'error');
      return { success: false, error: 'Not logged in' };
    }

    try {
      isSyncing = true;
      if (manual) UI.toast('מסנכרן נתונים מול Google Drive...', 'info');

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
          if (result.data) await DB.importData(result.data);
          const timestamp = new Date().toISOString();
          await DB.setSetting('lastSyncDate', timestamp);
          if (manual) UI.toast('הסנכרון עבר בהצלחה! ✅', 'success');
          return { success: true, timestamp };
        }
      }

      // Direct Google Drive REST API
      const fileId = await findDriveFileId(token);
      const jsonContent = JSON.stringify(dataToSync, null, 2);

      let uploadUrl;
      let method;
      let headers = {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json; charset=UTF-8'
      };

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

        const multipartResponseBody =
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
          await logout();
          throw new Error('פג תוקף אסימון הגישה של גוגל. נא להתחבר מחדש.');
        }
        throw new Error(`שגיאת Google Drive (HTTP ${res.status})`);
      }

      const timestamp = new Date().toISOString();
      await DB.setSetting('lastSyncDate', timestamp);

      if (manual) UI.toast('הנתונים נשמרו בהצלחה ב-Google Drive! ☁️', 'success');
      return { success: true, timestamp };

    } catch (error) {
      console.error('Cloud Sync Error:', error);
      if (manual) UI.toast('שגיאה בסנכרון: ' + error.message, 'error');
      return { success: false, error: error.message };
    } finally {
      isSyncing = false;
    }
  }

  /**
   * Pull data from Google Drive file
   */
  async function pullData() {
    const token = await getAccessToken();
    const legacyUrl = await DB.getSetting('cloudSyncUrl');

    if (!token && !legacyUrl) return { success: false, error: 'Not logged in' };

    try {
      if (!token && legacyUrl) {
        const response = await fetch(legacyUrl);
        if (!response.ok) throw new Error('Network error');
        const data = await response.json();
        if (data && !data.error) {
          await DB.importData(data);
          return { success: true };
        }
      }

      const fileId = await findDriveFileId(token);
      if (!fileId) return { success: false, error: 'No backup file found in Drive' };

      const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();
      if (data) {
        await DB.importData(data);
        return { success: true };
      }
      return { success: false, error: 'Invalid data' };

    } catch (error) {
      console.error('Cloud Sync Pull Error:', error);
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

    if (window.google && window.google.accounts && window.google.accounts.oauth2) {
      try {
        const client = window.google.accounts.oauth2.initTokenClient({
          client_id: clientId,
          scope: 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email',
          callback: async (response) => {
            if (response.access_token) {
              const profile = await fetchGoogleProfile(response.access_token);
              await setAccessToken(response.access_token, profile);
              if (onSuccess) onSuccess(profile);
            } else if (response.error) {
              console.warn('Google OAuth error:', response.error);
              if (onError) onError(response.error_description || response.error);
            }
          }
        });
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

  return {
    syncData,
    pullData,
    scheduleSync,
    getLastSyncText,
    getAccessToken,
    setAccessToken,
    isLoggedIn,
    getUserProfile,
    logout,
    loginWithGoogle
  };
})();

window.CloudSync = CloudSync;
