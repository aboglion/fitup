/**
 * IndexedDB Database Module for FitUp
 * Handles all data persistence
 */
const DB = (() => {
  const DB_NAME = 'FitUpDB';
  const DB_VERSION = 3;
  let db = null;

  // Store names
  const STORES = {
    PLAN: 'trainingPlan',        // The full training plan (365 days)
    TRACKING: 'dayTracking',     // User's daily tracking data
    EXERCISES: 'exerciseGuide',  // Exercise guide reference
    SETTINGS: 'settings',        // App settings
    PHOTOS: 'progressPhotos',    // Progress photos
    NUTRITION: 'nutritionTracking' // Nutrition data
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
        
        // Nutrition store
        if (!database.objectStoreNames.contains(STORES.NUTRITION)) {
          database.createObjectStore(STORES.NUTRITION, { keyPath: 'date' });
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
    
    // Fetch nutrition in the format the backend expects
    const nutritionList = await getAll(STORES.NUTRITION);
    const nutrition = {};
    if (nutritionList && nutritionList.length > 0) {
      nutritionList.forEach(n => {
        const { date, ...rest } = n;
        nutrition[date] = rest;
      });
    }
    
    return {
      version: 2,
      exportDate: new Date().toISOString(),
      tracking,
      settings,
      photos,
      nutrition
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
      // Preserve local-only keys that should never be overwritten by cloud data
      const LOCAL_ONLY_KEYS = ['googleAccessToken', 'googleUserProfile', 'cloudSyncUrl'];
      const preservedSettings = {};
      for (const key of LOCAL_ONLY_KEYS) {
        const record = await get(STORES.SETTINGS, key);
        if (record) preservedSettings[key] = record;
      }

      await clear(STORES.SETTINGS);
      // Import cloud settings
      await putBulk(STORES.SETTINGS, data.settings);

      // Restore preserved local-only settings
      for (const key of LOCAL_ONLY_KEYS) {
        if (preservedSettings[key]) {
          await put(STORES.SETTINGS, preservedSettings[key]);
        }
      }
    }
    if (data.photos) {
      await clear(STORES.PHOTOS);
      await putBulk(STORES.PHOTOS, data.photos);
    }
    if (data.nutrition) {
      await clear(STORES.NUTRITION);
      const nutritionArray = Object.keys(data.nutrition).map(date => {
        return { date, ...data.nutrition[date] };
      });
      await putBulk(STORES.NUTRITION, nutritionArray);
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
   * Swap two main workouts in the same week
   */
  async function swapWorkouts(dayIndex1, dayIndex2) {
    // 1. Get the plan data for both days
    const day1 = await getDayPlan(dayIndex1);
    const day2 = await getDayPlan(dayIndex2);

    if (!day1 || !day2) throw new Error('One or both days not found in plan');

    // 2. Get the tracking data for both days
    let track1 = await getDayTracking(dayIndex1);
    let track2 = await getDayTracking(dayIndex2);

    // If tracking data doesn't exist yet, we still need to swap the slots if they do later,
    // but the easiest is just to swap the tracking records and their dayIndex pointers.
    
    // 3. Swap plan properties (dayType, plannedRPE, exercises, workoutSeq, restSeq)
    // We KEEP dayIndex, dayNum, dayOfWeek, date, week intact
    const tempDayType = day1.dayType;
    const tempRPE = day1.plannedRPE;
    const tempExercises = JSON.stringify(day1.exercises);
    const tempWorkoutSeq = day1.workoutSeq;
    const tempRestSeq = day1.restSeq;

    day1.dayType = day2.dayType;
    day1.plannedRPE = day2.plannedRPE;
    day1.exercises = JSON.parse(JSON.stringify(day2.exercises));
    day1.workoutSeq = day2.workoutSeq;
    day1.restSeq = day2.restSeq;

    day2.dayType = tempDayType;
    day2.plannedRPE = tempRPE;
    day2.exercises = JSON.parse(tempExercises);
    day2.workoutSeq = tempWorkoutSeq;
    day2.restSeq = tempRestSeq;

    // Save swapped plans
    await put(STORES.PLAN, day1);
    await put(STORES.PLAN, day2);

    // 4. Swap tracking data
    // Remove the old tracking data
    const trackStore = transaction(STORES.TRACKING, 'readwrite');
    await new Promise((resolve) => {
      let count = 0;
      const complete = () => { if (++count === 2) resolve(); };
      trackStore.delete(dayIndex1).onsuccess = complete;
      trackStore.delete(dayIndex2).onsuccess = complete;
    });

    // Save swapped tracking data with updated dayIndex
    if (track1) {
      track1.dayIndex = dayIndex2;
      await saveDayTracking(dayIndex2, track1);
    }
    if (track2) {
      track2.dayIndex = dayIndex1;
      await saveDayTracking(dayIndex1, track2);
    }

    return true;
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

  async function getNutrition(dateStr) {
    return get(STORES.NUTRITION, dateStr);
  }

  async function saveNutrition(dateStr, data) {
    return put(STORES.NUTRITION, { date: dateStr, ...data });
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
    getNutrition,
    saveNutrition,
    count,
    swapWorkouts,
    STORES
  };
})();

window.DB = DB;
