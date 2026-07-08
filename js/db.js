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
      dayType: 'מנוחה',
      plannedRPE: '—',
      exercises: [
        { slot: 'A1', name: 'מתיחות מלאות', sets: '10 דקות', weight: null, videoUrl: 'https://www.youtube.com/watch?v=COO2S7lPBzA' },
        { slot: 'B1', name: 'הליכה קלה (אופציונלי)', sets: '15-20 דקות', weight: null, videoUrl: 'https://www.youtube.com/watch?v=iesCUs8CQEQ' }
      ]
    };
    
    const restTemplate2 = {
      dayType: 'מנוחה',
      plannedRPE: '—',
      exercises: [
        { slot: 'A1', name: 'שינה 7-8 שעות', sets: null, weight: null, videoUrl: null },
        { slot: 'A2', name: 'חלבון 160-170 גרם', sets: null, weight: null, videoUrl: null },
        { slot: 'B1', name: 'מים 2.5-3 ליטר', sets: null, weight: null, videoUrl: null }
      ]
    };

    let planStartDateStr = await getSetting('planStartDate');
    if (!planStartDateStr) {
      planStartDateStr = new Date().toISOString().slice(0, 10);
      await setSetting('planStartDate', planStartDateStr);
    }
    const startDate = new Date(planStartDateStr + 'T12:00:00');

    const newPlanData = [];
    let globalDayIndex = 0;
    let globalWorkoutSeq = 0;
    let globalRestSeq = 0;

    const weeksMap = new Map();
    data.daily.forEach(day => {
      if (!weeksMap.has(day.week)) {
        weeksMap.set(day.week, []);
      }
      weeksMap.get(day.week).push(day);
    });

    for (const [weekName, days] of weeksMap.entries()) {
      const workouts = days.filter(d => d.dayType !== 'מנוחה');
      
      let workoutIdx = 0;
      let restIdx = 0;

      for (let i = 0; i < 7; i++) {
        const currentDate = new Date(startDate);
        currentDate.setDate(currentDate.getDate() + globalDayIndex);
        const realDayOfWeekNum = currentDate.getDay(); // 0-6
        const isRest = restDays.includes(realDayOfWeekNum);
        
        let dayObj;

        if (isRest || workoutIdx >= workouts.length) {
          const tpl = (restIdx % 2 === 0) ? restTemplate1 : restTemplate2;
          dayObj = {
            ...tpl,
            week: weekName,
            dayOfWeek: dayNames[realDayOfWeekNum],
            exercises: JSON.parse(JSON.stringify(tpl.exercises))
          };
          restIdx++;

        } else {
          dayObj = {
            ...workouts[workoutIdx],
            week: weekName,
            dayOfWeek: dayNames[realDayOfWeekNum],
            exercises: JSON.parse(JSON.stringify(workouts[workoutIdx].exercises || []))
          };
          workoutIdx++;
        }
        
        dayObj.dayIndex = globalDayIndex;
        dayObj.dayNum = globalDayIndex + 1;
        
        // Add a sequence ID for reliable migration
        if (dayObj.dayType !== 'מנוחה') {
          dayObj.workoutSeq = globalWorkoutSeq++;
        } else {
          dayObj.restSeq = globalRestSeq++;
        }

        dayObj.date = currentDate.toISOString().slice(0, 10).split('-').reverse().join('/');
        
        newPlanData.push(dayObj);
        globalDayIndex++;
      }
    }

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
   * Export all data as JSON
   */
  async function exportData() {
    const tracking = await getAll(STORES.TRACKING);
    return {
      version: 1,
      exportDate: new Date().toISOString(),
      tracking
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

  return {
    init,
    loadTrainingPlan,
    getDayPlan,
    getDayTracking,
    saveDayTracking,
    getAllTracking,
    clearTracking,
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
