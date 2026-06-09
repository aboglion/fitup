// Google Auth + Drive Sync Module (Offline-First)
const DEFAULT_GOOGLE_CLIENT_ID = '210071068493-dg8f374ctpbriq30f4lapbdcqbfnguom.apps.googleusercontent.com'; // Set your default Client ID here for hosted users
const GOOGLE_CLIENT_ID = localStorage.getItem('fitpro_google_client_id') || DEFAULT_GOOGLE_CLIENT_ID;
const SCOPES = 'https://www.googleapis.com/auth/drive.appdata';
let gTokenClient = null;
let gAccessToken = null;
let gUserProfile = null;

const AuthModule = {
  init() {
    // Load saved token
    const saved = localStorage.getItem('fitpro_gtoken');
    if (saved) {
      gAccessToken = saved;
      this.updateUI(true);
    } else {
      this.updateUI(false);
    }
    // Load saved profile
    const profile = localStorage.getItem('fitpro_gprofile');
    if (profile) {
      try { gUserProfile = JSON.parse(profile); } catch(e) {}
    }
    
    if (!GOOGLE_CLIENT_ID) {
      console.log('⚠️ No Google Client ID set - cloud sync disabled');
      return;
    }
    
    // Load Google Identity Services
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.onload = () => this.setupGIS();
    document.head.appendChild(script);
  },

  setupGIS() {
    // Token client for Drive API access
    gTokenClient = google.accounts.oauth2.initTokenClient({
      client_id: GOOGLE_CLIENT_ID,
      scope: SCOPES + ' https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email',
      callback: async (resp) => {
        if (resp.error) { 
          console.error('Auth error:', resp); 
          toast('❌ שגיאה בהתחברות');
          return; 
        }
        gAccessToken = resp.access_token;
        localStorage.setItem('fitpro_gtoken', gAccessToken);
        
        // Fetch user profile
        await this.fetchUserProfile();
        
        this.updateUI(true);
        toast('✅ מחובר לגוגל בהצלחה');
        
        // Initial sync from Drive
        await this.syncFromDrive();
      }
    });
    
    // If we have a saved token, verify it
    if (gAccessToken) {
      this.verifyToken();
    }
  },

  async fetchUserProfile() {
    if (!gAccessToken) return;
    try {
      const res = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: { Authorization: `Bearer ${gAccessToken}` }
      });
      if (res.ok) {
        gUserProfile = await res.json();
        localStorage.setItem('fitpro_gprofile', JSON.stringify(gUserProfile));
      }
    } catch(e) { console.log('Profile fetch failed:', e); }
  },

  async verifyToken() {
    if (!gAccessToken) return;
    try {
      const res = await fetch('https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=' + gAccessToken);
      if (!res.ok) {
        this.handleAuthError();
      }
    } catch(e) {
      // Offline - keep token, will verify later
    }
  },

  signIn() {
    if (!GOOGLE_CLIENT_ID) {
      toast('⚠️ נדרש Google Client ID בהגדרות המערכת');
      return;
    }
    if (gTokenClient) {
      gTokenClient.requestAccessToken();
    } else {
      toast('⚠️ שירותי גוגל לא נטענו');
    }
  },

  signOut() {
    if (gAccessToken) {
      try { google.accounts.oauth2.revoke(gAccessToken); } catch(e) {}
    }
    gAccessToken = null;
    gUserProfile = null;
    localStorage.removeItem('fitpro_gtoken');
    localStorage.removeItem('fitpro_gprofile');
    this.updateUI(false);
    toast('👋 יצאת מהחשבון');
  },

  isConnected() {
    return !!gAccessToken;
  },

  getProfile() {
    return gUserProfile;
  },

  updateUI(connected) {
    if (typeof updateSyncNav === 'function') {
      updateSyncNav(connected);
    }
  },

  isDirty() {
    try {
      const data = JSON.parse(localStorage.getItem('fitpro_data') || '{}');
      return data.sync?.is_dirty || false;
    } catch(e) { return false; }
  },

  markDirty() {
    try {
      const data = JSON.parse(localStorage.getItem('fitpro_data') || '{}');
      if (!data.sync) data.sync = {};
      data.sync.is_dirty = true;
      data.sync.last_local_change = new Date().toISOString();
      localStorage.setItem('fitpro_data', JSON.stringify(data));
      this.updateUI(true);
      // Try background sync
      this.trySyncInBackground();
    } catch(e) {}
  },

  async trySyncInBackground() {
    if (!gAccessToken || !navigator.onLine) return;
    await this.syncToDrive();
  },

  async syncToDrive() {
    if (!gAccessToken) return false;
    let data = localStorage.getItem('fitpro_data');
    if (!data) {
      if (typeof appData !== 'undefined') {
        localStorage.setItem('fitpro_data', JSON.stringify(appData));
        data = localStorage.getItem('fitpro_data');
      }
    }
    if (!data) return false;
    
    try {
      // Find existing file
      const listRes = await fetch('https://www.googleapis.com/drive/v3/files?spaces=appDataFolder&q=name%3D%27fitpro_backup.json%27', {
        headers: { Authorization: `Bearer ${gAccessToken}` }
      });
      const list = await listRes.json();
      if (list.error) { this.handleAuthError(); return false; }

      let fileId = null;
      if (list.files && list.files.length > 0) {
        fileId = list.files[0].id;
      } else {
        // Create new empty file metadata in appDataFolder
        const createRes = await fetch('https://www.googleapis.com/drive/v3/files', {
          method: 'POST',
          headers: { 
            Authorization: `Bearer ${gAccessToken}`, 
            'Content-Type': 'application/json' 
          },
          body: JSON.stringify({
            name: 'fitpro_backup.json',
            parents: ['appDataFolder']
          })
        });
        if (!createRes.ok) { this.handleAuthError(); return false; }
        const createdFile = await createRes.json();
        fileId = createdFile.id;
      }

      // Upload/Update file content
      const res = await fetch(`https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${gAccessToken}`, 'Content-Type': 'application/json' },
        body: data
      });
      if (!res.ok) { this.handleAuthError(); return false; }

      // Clear dirty flag
      const appState = JSON.parse(data);
      if (!appState.sync) appState.sync = {};
      appState.sync.is_dirty = false;
      appState.sync.last_cloud_sync = new Date().toISOString();
      localStorage.setItem('fitpro_data', JSON.stringify(appState));
      
      // Update global state
      if (typeof appData !== 'undefined') {
        appData.sync = appState.sync;
      }
      
      this.updateUI(true);
      return true;
    } catch(e) { 
      console.error('Sync to Drive error:', e); 
      return false;
    }
  },

  async syncFromDrive() {
    if (!gAccessToken) return false;
    try {
      const listRes = await fetch('https://www.googleapis.com/drive/v3/files?spaces=appDataFolder&q=name%3D%27fitpro_backup.json%27', {
        headers: { Authorization: `Bearer ${gAccessToken}` }
      });
      const list = await listRes.json();
      if (list.error || !list.files || list.files.length === 0) return false;

      const fileId = list.files[0].id;
      const dataRes = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
        headers: { Authorization: `Bearer ${gAccessToken}` }
      });
      if (!dataRes.ok) return false;
      const cloudData = await dataRes.json();

      // Compare timestamps - cloud wins if newer AND local is not dirty
      const local = JSON.parse(localStorage.getItem('fitpro_data') || '{}');
      const localSync = local.sync?.last_cloud_sync || '1970-01-01';
      const cloudSync = cloudData.sync?.last_cloud_sync || '1970-01-01';

      if (cloudSync > localSync && !local.sync?.is_dirty) {
        localStorage.setItem('fitpro_data', JSON.stringify(cloudData));
        if (typeof appData !== 'undefined') {
          Object.assign(appData, cloudData);
        }
        return true;
      } else if (local.sync?.is_dirty) {
        // Local has unsaved changes, push to cloud
        await this.syncToDrive();
      }
      return false;
    } catch(e) { 
      console.error('Restore error:', e); 
      return false;
    }
  },

  handleAuthError() {
    gAccessToken = null;
    localStorage.removeItem('fitpro_gtoken');
    this.updateUI(false);
    console.log('Auth token expired - need re-authentication');
  },

  getSyncInfo() {
    try {
      const data = JSON.parse(localStorage.getItem('fitpro_data') || '{}');
      return {
        is_dirty: data.sync?.is_dirty || false,
        last_cloud_sync: data.sync?.last_cloud_sync || null,
        last_local_change: data.sync?.last_local_change || null
      };
    } catch(e) { return { is_dirty: false, last_cloud_sync: null, last_local_change: null }; }
  }
};

// Background sync on network recovery
window.addEventListener('online', () => {
  if (AuthModule.isDirty() && gAccessToken) {
    AuthModule.syncToDrive().then(ok => {
      if (ok) toast('☁️ סנכרון אוטומטי בוצע');
    });
  }
});

// Periodic sync check (every 5 min when online)
setInterval(() => {
  if (navigator.onLine && AuthModule.isDirty() && gAccessToken) {
    AuthModule.syncToDrive();
  }
}, 300000);
