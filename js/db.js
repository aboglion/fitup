/**
 * IndexedDB Database Module for FitUp
 * Handles all data persistence
 */
const DB = (() => {
  const DB_NAME = 'FitUpDB';
  const DB_VERSION = 2;
  let db = null;

  // Store names
  const STORES = {
    PLAN: 'trainingPlan',        // The full training plan (365 days)
    TRACKING: 'dayTracking',     // User's daily tracking data
    EXERCISES: 'exerciseGuide',  // Exercise guide reference
    SETTINGS: 'settings',        // App settings
    PHOTOS: 'progressPhotos'     // Progress photos
  };

  /**
   * Initialize the database
   */
  function init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);

      request.onupgradeneeded = (event) => {
        const database = event.target.result;

        // Training plan store - keyed by day number
        if (!database.objectStoreNames.contains(STORES.PLAN)) {
          const planStore = database.createObjectStore(STORES.PLAN, { keyPath: 'dayIndex' });
          planStore.createIndex('week', 'week', { unique: false });
          planStore.createIndex('date', 'date', { unique: false });
          planStore.createIndex('dayType', 'dayType', { unique: false });
        }

        // Day tracking store - user's progress data
        if (!database.objectStoreNames.contains(STORES.TRACKING)) {
          const trackStore = database.createObjectStore(STORES.TRACKING, { keyPath: 'dayIndex' });
          trackStore.createIndex('completed', 'completed', { unique: false });
          trackStore.createIndex('date', 'date', { unique: false });
        }

        // Exercise guide store
        if (!database.objectStoreNames.contains(STORES.EXERCISES)) {
          const exStore = database.createObjectStore(STORES.EXERCISES, { keyPath: 'name' });
          exStore.createIndex('category', 'category', { unique: false });
        }

        // Settings store
        if (!database.objectStoreNames.contains(STORES.SETTINGS)) {
          database.createObjectStore(STORES.SETTINGS, { keyPath: 'key' });
        }

        // Photos store
        if (!database.objectStoreNames.contains(STORES.PHOTOS)) {
          const photoStore = database.createObjectStore(STORES.PHOTOS, { keyPath: 'id' });
          photoStore.createIndex('date', 'date', { unique: false });
        }
      };

      request.onsuccess = (event) => {
        db = event.target.result;
        resolve(db);
      };
    });
  }

  /**
   * Generic transaction helper
   */
  function transaction(storeName, mode = 'readonly') {
    const tx = db.transaction(storeName, mode);
    return tx.objectStore(storeName);
  }

  /**
   * Put a single record
   */
  function put(storeName, data) {
    return new Promise((resolve, reject) => {
      const store = transaction(storeName, 'readwrite');
      const request = store.put(data);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get a single record by key
   */
  function get(storeName, key) {
    return new Promise((resolve, reject) => {
      const store = transaction(storeName, 'readonly');
      const request = store.get(key);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get all records from a store
   */
  function getAll(storeName) {
    return new Promise((resolve, reject) => {
      const store = transaction(storeName, 'readonly');
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get records by index
   */
  function getByIndex(storeName, indexName, value) {
    return new Promise((resolve, reject) => {
      const store = transaction(storeName, 'readonly');
      const index = store.index(indexName);
      const request = index.getAll(value);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Put multiple records in a single transaction
   */
  function putBulk(storeName, records) {
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);

      records.forEach(record => store.put(record));

      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  /**
   * Clear all records from a store
   */
  function clear(storeName) {
    return new Promise((resolve, reject) => {
      const store = transaction(storeName, 'readwrite');
      const request = store.clear();
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Delete entire database
   */
  function deleteDatabase() {
    return new Promise((resolve, reject) => {
      if (db) db.close();
      const request = indexedDB.deleteDatabase(DB_NAME);
      request.onsuccess = () => {
        db = null;
        resolve();
      };
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Count records in a store
   */
  function count(storeName) {
    return new Promise((resolve, reject) => {
      const store = transaction(storeName, 'readonly');
      const request = store.count();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // ============ High-level API ============

  /**
   * Load training plan from window.TRAINING_DATA into IndexedDB
   */
  async function loadTrainingPlan() {
    const data = window.TRAINING_DATA;
    if (!data) {
      throw new Error('שגיאה בטעינת הנתונים: המשתנה TRAINING_DATA לא קיים');
    }

    let restDays = await getSetting('restDays');
    if (!restDays || !Array.isArray(restDays)) {
      restDays = [5, 6]; // Default: Friday(5) and Saturday(6)
    }

    const dayNames = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
    const restTemplate1 = {
      dayType: 'Rest',
      plannedRPE: '—',
      exercises: []
    };
    
    const restTemplate2 = {
      dayType: 'Rest',
      plannedRPE: '—',
      exercises: []
    };

    let planStartDateStr = await getSetting('planStartDate');
    let effectiveStartDateStr = planStartDateStr;
    if (!effectiveStartDateStr) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      effectiveStartDateStr = UI.getLocalDateString(yesterday);
    }
    const startDate = new Date(effectiveStartDateStr + 'T12:00:00');

    let globalDayIndex = 0;
    let globalWorkoutSeq = 0;
    let globalRestSeq = 0;
    const newPlanData = [];

    data.daily.forEach((originalDay, index) => {
      const currentDate = new Date(startDate);
      currentDate.setDate(currentDate.getDate() + globalDayIndex);
      const realDayOfWeekNum = currentDate.getDay(); // 0-6

      let dayObj;
      if (originalDay.dayType === 'Rest') {
        const tpl = (globalRestSeq % 2 === 0) ? restTemplate1 : restTemplate2;
        dayObj = {
          ...originalDay,
          dayOfWeek: dayNames[realDayOfWeekNum],
          exercises: JSON.parse(JSON.stringify(tpl.exercises))
        };
      } else {
        dayObj = {
          ...originalDay,
          dayOfWeek: dayNames[realDayOfWeekNum],
          exercises: JSON.parse(JSON.stringify(originalDay.exercises || []))
        };
      }
        
        dayObj.dayIndex = globalDayIndex;
        dayObj.dayNum = globalDayIndex + 1;
        
        // Add a sequence ID for reliable migration
        if (dayObj.dayType !== 'Rest') {
          dayObj.workoutSeq = globalWorkoutSeq++;
        } else {
          dayObj.restSeq = globalRestSeq++;
        }

        dayObj.date = UI.getLocalDateString(currentDate).split('-').reverse().join('/');
        
        newPlanData.push(dayObj);
        globalDayIndex++;
    });

    await clear(STORES.PLAN);
    await putBulk(STORES.PLAN, newPlanData);

    const exerciseData = data.exercises;
    await clear(STORES.EXERCISES);
    await putBulk(STORES.EXERCISES, exerciseData);

    return newPlanData.length;
  }

  /**
   * Get day plan data
   */
  async function getDayPlan(dayIndex) {
    return get(STORES.PLAN, dayIndex);
  }

  /**
   * Get day tracking data (user's progress)
   */
  async function getDayTracking(dayIndex) {
    return get(STORES.TRACKING, dayIndex);
  }

  /**
   * Save day tracking data
   */
  async function saveDayTracking(dayIndex, data) {
    return put(STORES.TRACKING, { dayIndex, ...data });
  }

  /**
   * Get all tracking data
   */
  async function getAllTracking() {
    return getAll(STORES.TRACKING);
  }

  /**
   * Get all plan data
   */
  async function getAllPlan() {
    return getAll(STORES.PLAN);
  }

  /**
   * Get exercise guide
   */
  async function getExerciseGuide() {
    return getAll(STORES.EXERCISES);
  }

  /**
   * Get week data (plan + tracking)
   */
  async function getWeekData(weekLabel) {
    const planDays = await getByIndex(STORES.PLAN, 'week', weekLabel);
    const result = [];
    for (const day of planDays) {
      const tracking = await getDayTracking(day.dayIndex);
      result.push({ plan: day, tracking: tracking || null });
    }
    return result;
  }

  /**
   * Export all data as JSON (including tracking, settings, and progress photos)
   */
  async function exportData() {
    const tracking = await getAll(STORES.TRACKING);
    const settings = await getAll(STORES.SETTINGS);
    const photos = await getAll(STORES.PHOTOS);
    return {
      version: 2,
      exportDate: new Date().toISOString(),
      tracking,
      settings,
      photos
    };
  }

  /**
   * Import data from JSON
   */
  async function importData(data) {
    if (data.tracking) {
      await clear(STORES.TRACKING);
      await putBulk(STORES.TRACKING, data.tracking);
    }
    if (data.settings) {
      await clear(STORES.SETTINGS);
      // Filter out temporary data versions if they exist, or just import everything
      await putBulk(STORES.SETTINGS, data.settings);
    }
    if (data.photos) {
      await clear(STORES.PHOTOS);
      await putBulk(STORES.PHOTOS, data.photos);
    }
  }

  /**
   * Get a setting value
   */
  async function getSetting(key) {
    const record = await get(STORES.SETTINGS, key);
    return record ? record.value : null;
  }

  /**
   * Set a setting value
   */
  async function setSetting(key, value) {
    return put(STORES.SETTINGS, { key, value });
  }

  /**
   * Photo Management
   */
  async function savePhoto(id, date, dataUrl) {
    return put(STORES.PHOTOS, { id, date, dataUrl });
  }

  async function getAllPhotos() {
    const photos = await getAll(STORES.PHOTOS);
    return photos.sort((a, b) => new Date(a.date) - new Date(b.date));
  }

  async function deletePhoto(id) {
    return new Promise((resolve, reject) => {
      const store = transaction(STORES.PHOTOS, 'readwrite');
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async function clearTracking() {
    return clear(STORES.TRACKING);
  }

  /**
   * Automatically complete any Rest days that are in the past relative to the last completed workout date.
   */
  async function syncRestDays(allPlanDays) {
    const allTracking = await getAllTracking();
    
    // Find the last completed workout day
    let lastWorkoutIndex = -1;
    let lastWorkoutDate = null;
    
    for (let i = 0; i < allPlanDays.length; i++) {
      const day = allPlanDays[i];
      if (day.dayType !== 'Rest') {
        const track = allTracking.find(t => t.dayIndex === i);
        if (track && track.completed) {
          lastWorkoutIndex = i;
          if (track.date) {
            let parsedDate = null;
            if (track.date.includes('/')) {
              const [d, m, y] = track.date.split('/');
              parsedDate = new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
            } else {
              parsedDate = new Date(track.date);
            }
            if (parsedDate && !isNaN(parsedDate.getTime())) {
              lastWorkoutDate = parsedDate;
            }
          }
        }
      }
    }

    if (lastWorkoutIndex !== -1 && lastWorkoutDate) {
      const today = new Date();
      const d1 = new Date(lastWorkoutDate);
      d1.setHours(12, 0, 0, 0);
      const d2 = new Date(today);
      d2.setHours(12, 0, 0, 0);
      const diffTime = d2.getTime() - d1.getTime();
      const daysPassed = Math.floor(diffTime / (1000 * 60 * 60 * 24));

      if (daysPassed > 0) {
        // Find first incomplete workout after the last completed workout
        let firstIncompleteWorkoutIndex = allPlanDays.length;
        for (let i = lastWorkoutIndex + 1; i < allPlanDays.length; i++) {
          if (allPlanDays[i].dayType !== 'Rest') {
            const track = allTracking.find(t => t.dayIndex === i);
            if (!track || !track.completed) {
              firstIncompleteWorkoutIndex = i;
              break;
            }
          }
        }

        // Complete any Rest days that are in the past
        let updated = false;
        for (let i = lastWorkoutIndex + 1; i < firstIncompleteWorkoutIndex; i++) {
          const day = allPlanDays[i];
          const dayOffset = day.dayIndex - lastWorkoutIndex;
          if (dayOffset < daysPassed) {
            const track = allTracking.find(t => t.dayIndex === i);
            if (!track || !track.completed) {
              const restDate = new Date(lastWorkoutDate.getTime() + dayOffset * 24 * 60 * 60 * 1000);
              const yyyy = restDate.getFullYear();
              const mm = String(restDate.getMonth() + 1).padStart(2, '0');
              const dd = String(restDate.getDate()).padStart(2, '0');
              const trackDateStr = `${dd}/${mm}/${yyyy}`;
              
              const newTrack = {
                dayIndex: i,
                completed: true,
                autoCompleted: true,
                date: trackDateStr,
                lastUpdated: new Date().toISOString()
              };
              await saveDayTracking(i, newTrack);
              updated = true;
            }
          }
        }
        return updated;
      }
    }
    return false;
  }

  return {
    init,
    loadTrainingPlan,
    getDayPlan,
    getDayTracking,
    saveDayTracking,
    getAllTracking,
    clearTracking,
    syncRestDays,
    getAllPlan,
    getExerciseGuide,
    getWeekData,
    exportData,
    importData,
    getSetting,
    setSetting,
    savePhoto,
    getAllPhotos,
    deletePhoto,
    deleteDatabase,
    count,
    STORES
  };
})();
