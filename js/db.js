/**
 * IndexedDB Database Module for FitUp
 * Handles all data persistence
 */
const DB = (() => {
  const DB_NAME = 'FitUpDB';
  const DB_VERSION = 1;
  let db = null;

  // Store names
  const STORES = {
    PLAN: 'trainingPlan',        // The full training plan (365 days)
    TRACKING: 'dayTracking',     // User's daily tracking data
    EXERCISES: 'exerciseGuide',  // Exercise guide reference
    SETTINGS: 'settings'         // App settings
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

    const planData = data.daily.map((day, idx) => ({
      dayIndex: idx,
      exercises: day.exercises || [],
      ...day
    }));

    await clear(STORES.PLAN);
    await putBulk(STORES.PLAN, planData);

    const exerciseData = data.exercises;
    await clear(STORES.EXERCISES);
    await putBulk(STORES.EXERCISES, exerciseData);

    return planData.length;
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

  return {
    init,
    loadTrainingPlan,
    getDayPlan,
    getDayTracking,
    saveDayTracking,
    getAllTracking,
    getAllPlan,
    getExerciseGuide,
    getWeekData,
    exportData,
    importData,
    getSetting,
    setSetting,
    deleteDatabase,
    count,
    STORES
  };
})();
