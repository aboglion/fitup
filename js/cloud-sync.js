/**
 * Cloud Synchronization Module
 * Handles background pushing of data to Google Drive via Google Apps Script API.
 */
const CloudSync = (() => {
  let isSyncing = false;
  let syncTimeout = null;

  /**
   * Schedule a background sync (debounced)
   */
  function scheduleSync() {
    if (syncTimeout) clearTimeout(syncTimeout);
    syncTimeout = setTimeout(() => {
      syncData(false);
    }, 3000); // Wait 3 seconds of inactivity before syncing
  }

  /**
   * Sync all local data to the Cloud (Google Drive)
   */
  async function syncData(manual = false) {
    if (isSyncing) return { success: false, error: 'כבר מתבצע סנכרון כרגע.' };

    const url = await DB.getSetting('cloudSyncUrl');
    
    if (!url) {
      if (manual) {
        UI.toast('לא הוגדרה כתובת סנכרון (API) בהגדרות.', 'error');
      }
      return { success: false, error: 'No URL configured' };
    }

    try {
      isSyncing = true;
      if (manual) UI.toast('מתחיל סנכרון נתונים מול ענן גוגל...', 'info');

      // Extract all data from local IndexedDB
      const dataToSync = await DB.exportData();

      // Send via POST
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8', // GAS handles text/plain best for cross-origin POST
        },
        body: JSON.stringify(dataToSync)
      });

      if (!response.ok) {
        throw new Error('שגיאת רשת מול שרת גוגל');
      }

      const result = await response.json();
      
      if (result.status === 'success') {
        const timestamp = new Date().toISOString();
        await DB.setSetting('lastSyncDate', timestamp);
        
        if (manual) UI.toast('הסנכרון לענן עבר בהצלחה! ✅', 'success');
        return { success: true, timestamp };
      } else {
        throw new Error(result.error || 'שגיאה לא ידועה בשמירה בענן');
      }

    } catch (error) {
      console.error('Cloud Sync Error:', error);
      if (manual) {
        UI.toast('שגיאה בסנכרון לענן. בדוק את חיבור האינטרנט או הכתובת.', 'error');
      }
      return { success: false, error: error.message };
    } finally {
      isSyncing = false;
    }
  }

  /**
   * Get formatted last sync date
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
   * Pull data from the Cloud (Google Drive) in the background
   */
  async function pullData() {
    const url = await DB.getSetting('cloudSyncUrl');
    if (!url) return { success: false, error: 'No URL configured' };
    
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error('Network error');
      
      const data = await response.json();
      if (data && !data.error) {
        await DB.importData(data);
        return { success: true };
      }
      return { success: false, error: 'Invalid data format' };
    } catch (error) {
      console.error('Cloud Sync Pull Error:', error);
      return { success: false, error: error.message };
    }
  }

  return {
    syncData,
    pullData,
    scheduleSync,
    getLastSyncText
  };
})();
