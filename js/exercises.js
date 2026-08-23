/**
 * Exercises Guide Page Module
 * RPG-style Skill Tree organized by Day Type with SVG connectors
 */
const ExercisesPage = (() => {
  let allExercises = [];
  let categories = [];
  let isTreeView = true;
  let activeTab = null;

  // Day type tabs configuration
  const DAY_TABS = [
    { id: 'lower-strength', label: 'Legs + Core', subtitleKey: 'cat_lower_sub', icon: '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="width: 1.2em; height: 1.2em;"><path d="M6 12h12M3 8v8M21 8v8M6 6v12M18 6v12"/></svg>', color: '#f97316', bgColor: 'rgba(249, 115, 22, 0.15)', dayTypes: ['Legs + Core'] },
    { id: 'upper-push', label: 'Push + Skill', subtitleKey: 'cat_push_sub', icon: '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="width: 1.2em; height: 1.2em;"><path d="M17 11l-5-5-5 5M12 6v12M5 21h14"/></svg>', color: '#3b82f6', bgColor: 'rgba(59, 130, 246, 0.15)', dayTypes: ['Push + Skill'] },
    { id: 'upper-pull', label: 'Pull + Grip', subtitleKey: 'cat_pull_sub', icon: '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="width: 1.2em; height: 1.2em;"><path d="M6 20h12M12 4v12M8 12l4 4 4-4"/></svg>', color: '#a855f7', bgColor: 'rgba(168, 85, 247, 0.15)', dayTypes: ['Pull + Grip'] },
    { id: 'cardio', label: 'Cardio', subtitleKey: 'cat_cardio_sub', icon: '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 1.2em; height: 1.2em;"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>', color: '#10b981', bgColor: 'rgba(16, 185, 129, 0.15)', dayTypes: ['Active Recovery'] }
  ];

  // Exercise weight progression tiers (exercise name → sorted weight tiers)
  const EXERCISE_WEIGHT_PROGRESSION = {
    // Resistance Bands
    'Seated Band Row': [{ weight: '30 kg', fromWeek: 1 }, { weight: '40 kg', fromWeek: 5 }, { weight: '50 kg', fromWeek: 13 }],
    'Band Pull-Apart': [{ weight: '30 kg', fromWeek: 1 }, { weight: '40 kg', fromWeek: 5 }, { weight: '50 kg', fromWeek: 9 }],
    'Pallof Press': [{ weight: '30 kg', fromWeek: 10 }, { weight: '40 kg', fromWeek: 34 }],
    'Pallof Press Progression': [{ weight: 'Band 30 kg', fromWeek: 1 }],

    // Dumbbell Lower Body
    'DB Bulgarian Split Squat': [{ weight: 'Bodyweight', fromWeek: 1 }, { weight: '3 kg', fromWeek: 5 }, { weight: '9 kg', fromWeek: 10 }, { weight: '12 kg', fromWeek: 26 }],
    'Reverse Lunge + DB': [{ weight: '9 kg', fromWeek: 18 }, { weight: '12 kg', fromWeek: 42 }],
    'Reverse Lunge / Pistol Squat': [{ weight: '6 kg each', fromWeek: 2 }],
    'DB BSS (Goblet)': [{ weight: '15 kg', fromWeek: 34 }, { weight: '18 kg', fromWeek: 53 }, { weight: '21 kg', fromWeek: 58 }, { weight: '24 kg', fromWeek: 62 }],
    'Walking Lunge (Goblet)': [{ weight: '18 kg', fromWeek: 62 }],
    'DB RDL': [{ weight: '6 kg each', fromWeek: 1 }, { weight: '9 kg', fromWeek: 5 }, { weight: '12 kg', fromWeek: 10 }],
    'DB Romanian Deadlift': [{ weight: '6 kg each', fromWeek: 1 }, { weight: '9 kg', fromWeek: 5 }, { weight: '12 kg', fromWeek: 10 }],
    'DB Single-Leg RDL': [{ weight: '12 kg', fromWeek: 18 }, { weight: '15 kg', fromWeek: 26 }, { weight: '18 kg', fromWeek: 42 }, { weight: '21 kg', fromWeek: 50 }, { weight: '24 kg', fromWeek: 53 }],
    'Single-Leg RDL': [{ weight: '6 kg each', fromWeek: 1 }],
    'Glute Bridge': [{ weight: 'Bodyweight', fromWeek: 1 }],
    'DB Glute Bridge': [{ weight: '9 kg', fromWeek: 1 }],
    'DB Hip Thrust': [{ weight: '9 kg', fromWeek: 5 }, { weight: '12 kg', fromWeek: 10 }, { weight: '15 kg', fromWeek: 18 }, { weight: '18 kg', fromWeek: 26 }, { weight: '21 kg', fromWeek: 34 }, { weight: '24 kg', fromWeek: 50 }],
    'Single-Leg Calf Raise': [{ weight: 'Bodyweight', fromWeek: 1 }, { weight: '9 kg', fromWeek: 5 }, { weight: '12 kg', fromWeek: 18 }, { weight: '15 kg', fromWeek: 34 }, { weight: '18 kg', fromWeek: 42 }, { weight: '21 kg', fromWeek: 50 }, { weight: '24 kg', fromWeek: 58 }],
    'Standing Single-Leg Calf Raise': [{ weight: '6 kg in hand', fromWeek: 1 }],
    'Seated Single-Leg Calf Raise': [{ weight: '6 kg on knee', fromWeek: 1 }],
    'Suitcase Carry': [{ weight: '12 kg', fromWeek: 1 }, { weight: '15 kg', fromWeek: 5 }, { weight: '18 kg', fromWeek: 18 }, { weight: '21 kg', fromWeek: 26 }, { weight: '24 kg', fromWeek: 53 }],

    // Dumbbell Upper Body - Push
    'DB Floor Press': [{ weight: '6 kg each', fromWeek: 1 }, { weight: '9 kg', fromWeek: 5 }, { weight: '12 kg', fromWeek: 10 }],
    'Single-Arm Floor Press': [{ weight: '15 kg', fromWeek: 18 }, { weight: '18 kg', fromWeek: 26 }, { weight: '21 kg', fromWeek: 34 }, { weight: '24 kg', fromWeek: 42 }],
    'Seated DB OHP': [{ weight: '6 kg each', fromWeek: 1 }, { weight: '9 kg', fromWeek: 18 }, { weight: '12 kg', fromWeek: 42 }],
    'Seated DB Overhead Press': [{ weight: '6 kg each', fromWeek: 1 }, { weight: '9 kg', fromWeek: 18 }, { weight: '12 kg', fromWeek: 42 }],
    'Single-Arm Seated OHP': [{ weight: '18 kg', fromWeek: 53 }, { weight: '21 kg', fromWeek: 58 }, { weight: '24 kg', fromWeek: 62 }],
    'DB Lateral Raise': [{ weight: '3 kg each', fromWeek: 1 }, { weight: '6 kg', fromWeek: 42 }, { weight: '9 kg', fromWeek: 53 }],
    'DB OH Triceps Ext': [{ weight: '6 kg total', fromWeek: 1 }, { weight: '9 kg', fromWeek: 10 }, { weight: '12 kg', fromWeek: 34 }, { weight: '15 kg', fromWeek: 50 }, { weight: '18 kg', fromWeek: 53 }, { weight: '21 kg', fromWeek: 58 }, { weight: '24 kg', fromWeek: 66 }],
    'DB Overhead Triceps Extension': [{ weight: '6 kg total', fromWeek: 1 }, { weight: '9 kg', fromWeek: 10 }, { weight: '12 kg', fromWeek: 34 }, { weight: '15 kg', fromWeek: 50 }, { weight: '18 kg', fromWeek: 53 }],
    'Arm Block - DB Lateral Raise': [{ weight: '3-9 kg', fromWeek: 10 }, { weight: '9 kg', fromWeek: 74 }],
    'Arm Block - DB OH Triceps Ext': [{ weight: '6-15 kg', fromWeek: 10 }, { weight: '24 kg', fromWeek: 74 }],
    'Arm Block - DB Overhead Triceps Ext': [{ weight: '6-15 kg', fromWeek: 10 }, { weight: '24 kg', fromWeek: 74 }],
    'One-Arm DB Row': [{ weight: '6 kg', fromWeek: 1 }, { weight: '9 kg', fromWeek: 5 }, { weight: '12 kg', fromWeek: 10 }, { weight: '15 kg', fromWeek: 26 }, { weight: '21 kg', fromWeek: 42 }, { weight: '24 kg', fromWeek: 53 }],
    'TRX Row': [{ weight: 'Bodyweight', fromWeek: 1 }],
    'Diamond Push-Up': [{ weight: 'Bodyweight', fromWeek: 1 }, { weight: '+5 kg', fromWeek: 62 }],
    'Push-Up Volume': [{ weight: 'Bodyweight', fromWeek: 1 }],
    'Push-Up Volume (Day 5)': [{ weight: 'Bodyweight', fromWeek: 1 }],
    'DB Curl': [{ weight: '3 kg each', fromWeek: 1 }, { weight: '6 kg', fromWeek: 10 }, { weight: '9 kg', fromWeek: 34 }, { weight: '12 kg', fromWeek: 58 }],
    'DB Hammer Curl': [{ weight: '3 kg each', fromWeek: 1 }, { weight: '6 kg', fromWeek: 5 }, { weight: '12 kg', fromWeek: 53 }],
    'Hammer Curl': [{ weight: '3 kg each', fromWeek: 1 }, { weight: '6 kg', fromWeek: 5 }],
    'Arm Block - DB Curl': [{ weight: '3-12 kg', fromWeek: 10 }, { weight: '18 kg', fromWeek: 74 }],
    'Single-Arm Curl': [{ weight: '15 kg', fromWeek: 62 }, { weight: '18 kg', fromWeek: 66 }],

    // Bodyweight, Mobility, Warmup & Skill Progressions
    'Pistol Squat Progression': [{ weight: 'Bodyweight', fromWeek: 42 }],
    'Dead Bug': [{ weight: 'Bodyweight', fromWeek: 1 }],
    'Hollow Body Hold': [{ weight: 'Bodyweight', fromWeek: 1 }],
    'Pike Progression': [{ weight: 'Bodyweight', fromWeek: 1 }],
    'Push-up Bars Progression': [{ weight: 'Bodyweight', fromWeek: 1 }],
    'TRX Y-T-W': [{ weight: 'Bodyweight', fromWeek: 1 }],
    'Pull-Up Progression': [{ weight: 'Bodyweight', fromWeek: 1 }],
    'Chin-Up Progression': [{ weight: 'Bodyweight', fromWeek: 5 }],
    'TRX Face Pull': [{ weight: 'Bodyweight', fromWeek: 1 }],
    'Towel Hang': [{ weight: 'Bodyweight', fromWeek: 1 }],
    'L-Sit Progression': [{ weight: 'Bodyweight', fromWeek: 1 }],
    'High Knees': [{ weight: 'Bodyweight', fromWeek: 1 }],
    'Bodyweight Squat': [{ weight: 'Bodyweight', fromWeek: 1 }],
    'Arm Circles': [{ weight: 'Bodyweight', fromWeek: 1 }],
    'Wall Slides': [{ weight: 'Bodyweight', fromWeek: 1 }],
    'Scapular Push-up': [{ weight: 'Bodyweight', fromWeek: 1 }],
    'Scapular Pull-up': [{ weight: 'Bodyweight', fromWeek: 1 }],
    'Dead Hang': [{ weight: 'Bodyweight', fromWeek: 1 }],
    'Brisk Walking': [{ weight: 'Incline 4%', fromWeek: 1 }],
    'Relaxed Walking': [{ weight: 'Incline 0%', fromWeek: 1 }],
    'VO2 Max Norwegian 4x4': [{ weight: 'Incline 3%', fromWeek: 1 }],
    'Micro Mobility Protocol': [{ weight: 'Bodyweight', fromWeek: 1 }],
    'Deep Mobility Protocol': [{ weight: 'Bodyweight', fromWeek: 1 }],
    'Deficit Push-Up': [{ weight: 'Bodyweight', fromWeek: 10 }],
    'Feet-Elevated Push-Up': [{ weight: 'Bodyweight', fromWeek: 18 }],
    'Wall Walk (Partial)': [{ weight: 'Bodyweight', fromWeek: 10 }],
    'Wall Walk (Full)': [{ weight: 'Bodyweight', fromWeek: 18 }],
    'Wall Handstand': [{ weight: 'Bodyweight', fromWeek: 26 }],
    'Elevated Pike Push-Up': [{ weight: 'Bodyweight', fromWeek: 41 }],
    'Pull-Up (Overhand)': [{ weight: 'Bodyweight', fromWeek: 10 }],
    'Chin-Up': [{ weight: 'Bodyweight', fromWeek: 10 }],
    'Wrist Rocks': [{ weight: 'Bodyweight', fromWeek: 53 }],

    // Weighted Bodyweight
    'Weighted Deficit Push-Up': [{ weight: '+5 kg', fromWeek: 62 }],
    'Weighted Diamond Push-Up': [{ weight: '+5 kg', fromWeek: 62 }],
    'Weighted Pull-Up': [{ weight: '+5 kg', fromWeek: 62 }],
    'Weighted Chin-Up': [{ weight: '+5 kg', fromWeek: 66 }]
  };

  /**
   * Helper to retrieve weight tiers for any exercise (using map or dynamic plan extraction)
   */
  const getWeightTiers = (name) => {
    if (!name) return null;
    let lookupName = name;
    if (lookupName.startsWith('TRX Face Pull')) lookupName = 'TRX Face Pull';
    if (lookupName === 'DB BSS') lookupName = 'DB Bulgarian Split Squat';
    if (lookupName.includes('Calf Raise')) lookupName = 'Single-Leg Calf Raise';

    if (EXERCISE_WEIGHT_PROGRESSION[name]) {
      return EXERCISE_WEIGHT_PROGRESSION[name];
    }
    if (EXERCISE_WEIGHT_PROGRESSION[lookupName]) {
      return EXERCISE_WEIGHT_PROGRESSION[lookupName];
    }

    const cleanName = (name || '').toLowerCase().replace(/[^a-z0-9]+/g, '');
    for (const [key, tiers] of Object.entries(EXERCISE_WEIGHT_PROGRESSION)) {
      const cleanKey = key.toLowerCase().replace(/[^a-z0-9]+/g, '');
      if (cleanName === cleanKey || cleanName.includes(cleanKey) || cleanKey.includes(cleanName)) {
        return tiers;
      }
    }

    const plan = window.TRAINING_DATA?.daily;
    if (!plan || !Array.isArray(plan)) return null;

    const weekMap = new Map();
    plan.forEach(d => {
      const weekNum = typeof d.week === 'number' ? d.week : parseInt(String(d.week).replace(/\D/g, '')) || 1;
      const isDeload = d.dayType && String(d.dayType).includes('Deload');
      (d.exercises || []).forEach(e => {
        const eClean = (e.name || '').toLowerCase().replace(/[^a-z0-9]+/g, '');
        if ((e.name === name || eClean.includes(cleanName) || cleanName.includes(eClean)) && e.weight && !e.isWarmup && !isDeload) {
          if (!weekMap.has(weekNum)) {
            weekMap.set(weekNum, e.weight);
          }
        }
      });
    });

    const tiers = [];
    let lastWeight = null;
    Array.from(weekMap.entries()).sort((a, b) => a[0] - b[0]).forEach(([w, weight]) => {
      if (weight !== lastWeight) {
        tiers.push({ weight, fromWeek: w });
        lastWeight = weight;
      }
    });

    return tiers.length > 0 ? tiers : null;
  };

  const SKILL_TREES = {
    'lower-strength': [
      {
        title: 'warmup_mobility', icon: '⚡', exercises: [
          { name: 'High Knees', unlockWeek: 1 },
          { name: 'Deep Mobility Protocol', unlockWeek: 1 },
          { name: 'Micro Mobility Protocol', unlockWeek: 1 },
          { name: 'Wrist Rocks', unlockWeek: 53 }
        ]
      },
      {
        title: 'squat_lunge_tree', icon: '🏋️', exercises: [
          { name: 'Bodyweight Squat', unlockWeek: 1, id: 'squat-1' },
          { name: 'DB Bulgarian Split Squat', unlockWeek: 1, parentId: 'squat-1', id: 'squat-2' },
          { name: 'Reverse Lunge + DB', unlockWeek: 18, parentId: 'squat-2', id: 'squat-3' },
          { name: 'DB BSS (Goblet)', unlockWeek: 34, parentId: 'squat-2', id: 'squat-3b' },
          { name: 'Pistol Squat Progression', unlockWeek: 42, parentId: 'squat-3b', id: 'squat-4' },
          { name: 'Walking Lunge (Goblet)', unlockWeek: 62, parentId: 'squat-4', id: 'squat-5' }
        ]
      },
      {
        title: 'hamstring_chain', icon: '🦵', exercises: [
          { name: 'DB Romanian Deadlift', unlockWeek: 1, id: 'rdl-1' },
          { name: 'Single-Leg RDL', unlockWeek: 18, parentId: 'rdl-1', id: 'rdl-2' }
        ]
      },
      {
        title: 'glutes_calves', icon: '🍑', exercises: [
          { name: 'Glute Bridge', unlockWeek: 1, id: 'glute-1' },
          { name: 'DB Glute Bridge', unlockWeek: 1, parentId: 'glute-1', id: 'glute-2' },
          { name: 'DB Hip Thrust', unlockWeek: 5, parentId: 'glute-2', id: 'glute-3' },
          { name: 'Standing Single-Leg Calf Raise', unlockWeek: 1, id: 'calf-1' },
          { name: 'Seated Single-Leg Calf Raise', unlockWeek: 1, parentId: 'calf-1', id: 'calf-2' }
        ]
      },
      {
        title: 'core_citadel', icon: '🛡️', exercises: [
          { name: 'Dead Bug', unlockWeek: 1, id: 'core-1' },
          { name: 'Hollow Body Hold', unlockWeek: 5, parentId: 'core-1', id: 'core-2' },
          { name: 'Suitcase Carry', unlockWeek: 1, id: 'carry-1' },
          { name: 'Pallof Press Progression', unlockWeek: 10, parentId: 'carry-1', id: 'carry-2' }
        ]
      }
    ],
    'upper-push': [
      {
        title: 'warmup_shoulders', icon: '⚡', exercises: [
          { name: 'Arm Circles', unlockWeek: 1 },
          { name: 'Wall Slides', unlockWeek: 1 },
          { name: 'Scapular Push-up', unlockWeek: 1 },
          { name: 'Band Pull-Apart', unlockWeek: 1 }
        ]
      },
      {
        title: 'push_tree', icon: '💥', exercises: [
          { name: 'Push-up Bars Progression', unlockWeek: 1, id: 'push-1' },
          { name: 'DB Floor Press', unlockWeek: 1, id: 'floor-1' },
          { name: 'Push-Up Volume (Day 5)', unlockWeek: 1, parentId: 'push-1', id: 'push-vol' },
          { name: 'Diamond Push-Up', unlockWeek: 1, parentId: 'push-1', id: 'diamond-push-up' },
          { name: 'Deficit Push-Up', unlockWeek: 10, parentId: 'push-1', id: 'push-2a' },
          { name: 'Feet-Elevated Push-Up', unlockWeek: 18, parentId: 'push-1', id: 'push-2b' },
          { name: 'Single-Arm Floor Press', unlockWeek: 18, parentId: 'floor-1', id: 'floor-2' },
          { name: 'Weighted Deficit Push-Up', unlockWeek: 62, parentId: 'push-2a', id: 'push-3' }
        ]
      },
      {
        title: 'overhead_skill', icon: '🎯', exercises: [
          { name: 'Pike Progression', unlockWeek: 1, id: 'pike-1' },
          { name: 'Seated DB Overhead Press', unlockWeek: 1, id: 'ohp-1' },
          { name: 'Wall Walk (Partial)', unlockWeek: 10, parentId: 'pike-1', id: 'pike-2' },
          { name: 'Wall Walk (Full)', unlockWeek: 18, parentId: 'pike-2', id: 'pike-3' },
          { name: 'Wall Handstand', unlockWeek: 26, parentId: 'pike-3', id: 'pike-4' },
          { name: 'Elevated Pike Push-Up', unlockWeek: 41, parentId: 'pike-4', id: 'pike-5' },
          { name: 'Single-Arm Seated OHP', unlockWeek: 49, parentId: 'ohp-1', id: 'ohp-2' }
        ]
      },
      {
        title: 'accessory_prehab', icon: '🩹', exercises: [
          { name: 'DB Lateral Raise', unlockWeek: 1, id: 'lat-1' },
          { name: 'DB Overhead Triceps Extension', unlockWeek: 1, id: 'tri-1' },
          { name: 'TRX Y-T-W', unlockWeek: 1 },
          { name: 'Arm Block - DB Lateral Raise', unlockWeek: 10, parentId: 'lat-1', id: 'lat-2' },
          { name: 'Arm Block - DB Overhead Triceps Ext', unlockWeek: 10, parentId: 'tri-1', id: 'tri-2' }
        ]
      }
    ],
    'upper-pull': [
      {
        title: 'warmup_back', icon: '⚡', exercises: [
          { name: 'Wall Slides', unlockWeek: 1 },
          { name: 'Scapular Pull-up', unlockWeek: 1 },
          { name: 'Dead Hang', unlockWeek: 1 }
        ]
      },
      {
        title: 'pullup_tree', icon: '🧗', exercises: [
          { name: 'Pull-Up Progression', unlockWeek: 1, id: 'pull-1' },
          { name: 'Chin-Up Progression', unlockWeek: 5, parentId: 'pull-1', id: 'pull-1b' },
          { name: 'Pull-Up (Overhand)', unlockWeek: 10, parentId: 'pull-1', id: 'pull-2a' },
          { name: 'Chin-Up', unlockWeek: 10, parentId: 'pull-1b', id: 'pull-2b' },
          { name: 'Weighted Pull-Up', unlockWeek: 62, parentId: 'pull-2a', id: 'pull-3a' },
          { name: 'Weighted Chin-Up', unlockWeek: 66, parentId: 'pull-2b', id: 'pull-3b' }
        ]
      },
      {
        title: 'rows_horizontal', icon: '↔️', exercises: [
          { name: 'TRX Row', unlockWeek: 1, id: 'row-0' },
          { name: 'Seated Band Row', unlockWeek: 1, id: 'row-1' },
          { name: 'One-Arm DB Row', unlockWeek: 1, id: 'row-2' },
          { name: 'TRX Face Pull', unlockWeek: 1, id: 'row-3' }
        ]
      },
      {
        title: 'biceps_grip', icon: '✊', exercises: [
          { name: 'DB Curl', unlockWeek: 1, id: 'curl-1' },
          { name: 'Hammer Curl', unlockWeek: 5, parentId: 'curl-1', id: 'curl-2' },
          { name: 'Arm Block - DB Curl', unlockWeek: 10, parentId: 'curl-1', id: 'curl-2b' },
          { name: 'Single-Arm Curl', unlockWeek: 49, parentId: 'curl-2', id: 'curl-3' },
          { name: 'Towel Hang', unlockWeek: 1, id: 'towel-1' }
        ]
      },
      {
        title: 'hanging_core', icon: '🧱', exercises: [
          { name: 'L-Sit Progression', unlockWeek: 1, id: 'l-sit-progression' }
        ]
      }
    ],
    'cardio': [
      {
        title: 'cardio_recovery', icon: '🫀', exercises: [
          { name: 'Relaxed Walking', unlockWeek: 1 },
          { name: 'Brisk Walking', unlockWeek: 1 },
          { name: 'VO2 Max Norwegian 4x4', unlockWeek: 1 }
        ]
      }
    ]
  };

  // Cached completion data
  let completedPerType = {};

  /**
   * Load completion data from tracking DB
   */
  async function loadCompletionData() {
    try {
      const allPlan = await DB.getAllPlan();
      const allTracking = await DB.getAllTracking();
      const trackingMap = {};
      allTracking.forEach(t => { trackingMap[t.dayIndex] = t; });

      completedPerType = {};
      allPlan.forEach(day => {
        if (!day.dayType || day.dayType === 'Rest') return;
        if (!completedPerType[day.dayType]) {
          completedPerType[day.dayType] = { completed: 0, total: 0 };
        }
        completedPerType[day.dayType].total++;
        if (trackingMap[day.dayIndex] && trackingMap[day.dayIndex].completed) {
          completedPerType[day.dayType].completed++;
        }
      });
    } catch(e) {
      completedPerType = {};
    }
  }

  /**
   * Get completed workouts count for a tab
   */
  function getTabCompletedXP(tabId) {
    const tabConfig = DAY_TABS.find(t => t.id === tabId);
    if (!tabConfig) return { completed: 0, total: 0 };
    let completed = 0;
    let total = 0;
    (tabConfig.dayTypes || []).forEach(dt => {
      if (completedPerType[dt]) {
        completed += completedPerType[dt].completed;
        total += completedPerType[dt].total;
      }
    });
    return { completed, total };
  }

  /**
   * Helper to extract all 66 master exercises from SKILL_TREES with complete tree hierarchy
   */
  function getSkillTreeMasterExercises() {
    const list = [];
    const nodeMap = {};

    Object.values(SKILL_TREES).forEach(paths => {
      paths.forEach(p => {
        (p.exercises || []).forEach(node => {
          if (node.id || node.name) nodeMap[node.id || node.name] = node;
        });
      });
    });

    Object.entries(SKILL_TREES).forEach(([catKey, paths]) => {
      paths.forEach(p => {
        (p.exercises || []).forEach(node => {
          const parent = node.parentId ? nodeMap[node.parentId] : null;
          const tiers = getWeightTiers(node.name) || [{ weight: 'Bodyweight', fromWeek: node.unlockWeek || 1 }];
          const equip = UI.getEquipment(node.name);

          list.push({
            name: node.name,
            category: catKey,
            treeTitle: p.title,
            unlockWeek: node.unlockWeek || 1,
            id: node.id || '',
            parentId: node.parentId || '',
            parentName: parent ? parent.name : null,
            parentUnlockWeek: parent ? parent.unlockWeek : null,
            weight: tiers[0] ? tiers[0].weight : 'Bodyweight',
            difficulty: (node.unlockWeek || 1) > 26 ? 'Advanced' : (node.unlockWeek || 1) > 5 ? 'Intermediate' : 'Beginner',
            setsProgression: `Unlocks Week ${node.unlockWeek || 1}`,
            noImage: node.noImage || false
          });
        });
      });
    });

    const map = new Map();
    list.forEach(ex => {
      if (!map.has(ex.name)) map.set(ex.name, ex);
    });
    return Array.from(map.values());
  }

  /**
   * Initialize
   */
  async function init() {
    const dbExs = (await DB.getExerciseGuide()) || [];
    const masterExs = getSkillTreeMasterExercises();

    const nameMap = new Map();
    masterExs.forEach(ex => nameMap.set(ex.name, ex));
    dbExs.forEach(ex => {
      if (ex && ex.name) {
        nameMap.set(ex.name, { ...nameMap.get(ex.name), ...ex });
      }
    });

    allExercises = Array.from(nameMap.values());

    // Extract unique categories
    const catSet = new Set(allExercises.map(e => e.category));
    categories = Array.from(catSet);

    // Load completion data for XP system
    await loadCompletionData();

    // Render filter buttons
    renderFilters();

    // Search handler
    const searchEl = document.getElementById('exercise-search');
    if (searchEl) {
      searchEl.addEventListener('input', (e) => {
        if(!isTreeView) render(e.target.value, getActiveFilter());
      });
    }

    // Toggle tree view handler
    const treeBtn = document.getElementById('toggle-tree-btn');
    if (treeBtn) {
      treeBtn.addEventListener('click', toggleView);
    }

    // Window resize handler for SVG lines recalculation
    window.addEventListener('resize', debounce(() => {
      if (isTreeView && activeTab) renderSVGConnectors();
    }, 150));
  }

  function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  function toggleView() {
    isTreeView = !isTreeView;
    const btn = document.getElementById('toggle-tree-btn');
    const guideContainer = document.getElementById('exercise-guide');
    const treeContainer = document.getElementById('skill-tree-container');
    const searchBox = document.getElementById('exercise-search-box');
    const filters = document.getElementById('exercise-filters');

    if (isTreeView) {
      guideContainer.style.display = 'none';
      searchBox.style.display = 'none';
      filters.style.display = 'none';
      treeContainer.style.display = 'flex';
      btn.classList.add('active');
      btn.innerHTML = `<span>📚</span><span class="tree-btn-text">${I18n.t('all_exercises_btn')}</span>`;
      renderSkillTree();
    } else {
      treeContainer.style.display = 'none';
      guideContainer.style.display = 'grid';
      searchBox.style.display = 'block';
      filters.style.display = 'flex';
      btn.classList.remove('active');
      btn.innerHTML = `<span>🌳</span><span class="tree-btn-text">${I18n.t('progress_tree_btn')}</span>`;
      render(document.getElementById('exercise-search').value, getActiveFilter());
    }
  }

  /**
   * Render filter buttons
   */
  function renderFilters() {
    const container = document.getElementById('exercise-filters');
    container.innerHTML = `
      <button class="filter-btn active" data-filter="all" onclick="ExercisesPage.setFilter('all', this)">${I18n.t('filter_all')}</button>
      ${categories.map(cat => `
        <button class="filter-btn" data-filter="${cat}" onclick="ExercisesPage.setFilter('${cat}', this)">${cat}</button>
      `).join('')}
    `;
  }

  /**
   * Get active filter
   */
  function getActiveFilter() {
    const activeBtn = document.querySelector('.filter-btn.active');
    return activeBtn ? activeBtn.dataset.filter : 'all';
  }

  /**
   * Set filter
   */
  function setFilter(category, btn) {
    if(isTreeView) return;
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    render(document.getElementById('exercise-search').value, category);
  }

  /**
   * Switch tab
   */
  function switchTab(tabId) {
    activeTab = tabId;
    // Update tab buttons
    document.querySelectorAll('.rpg-tab-btn').forEach(btn => {
      const isActive = btn.dataset.tab === tabId;
      btn.classList.toggle('active', isActive);
      // Update the progress text color
      const progText = btn.querySelector('.rpg-tab-prog-text');
      if (progText) {
        const tabConf = DAY_TABS.find(t => t.id === btn.dataset.tab);
        progText.style.color = isActive && tabConf ? tabConf.color : 'var(--text-muted)';
      }
    });
    // Re-render XP header for this tab
    renderTabXPHeader();
    // Re-render tree
    renderSkillTreeContent();
  }

  /**
   * Calculate progress for a specific tab
   */
  function getTabProgress(tabId, currentWeek) {
    const paths = SKILL_TREES[tabId] || [];
    let total = 0;
    let unlocked = 0;
    paths.forEach(path => {
      path.exercises.forEach(ex => {
        total++;
        if (currentWeek >= ex.unlockWeek) unlocked++;
      });
    });
    return { total, unlocked, pct: total > 0 ? Math.round((unlocked / total) * 100) : 0 };
  }

  /**
   * Render skill tree with tabs
   */
  function renderSkillTree() {
    const container = document.getElementById('skill-tree-container');
    if (!activeTab) activeTab = DAY_TABS[0].id;

    let html = '';

    // Tab bar with mini progress and subtitles
    html += '<div class="rpg-tab-bar">';
    DAY_TABS.forEach(tab => {
      const isActive = tab.id === activeTab;
      const xpData = getTabCompletedXP(tab.id);
      const xpPct = xpData.total > 0 ? Math.round((xpData.completed / xpData.total) * 100) : 0;

      html += `
        <button class="rpg-tab-btn ${isActive ? 'active' : ''}" 
                data-tab="${tab.id}" 
                onclick="ExercisesPage.switchTab('${tab.id}')"
                style="--tab-color: ${tab.color}; --tab-bg: ${tab.bgColor}">
          <span class="rpg-tab-icon">${tab.icon}</span>
          <span class="rpg-tab-label">${tab.label}</span>
          <span class="rpg-tab-subtitle">${I18n.t(tab.subtitleKey)}</span>
          <span class="rpg-tab-progress">
            <span class="rpg-tab-prog-bar"><span class="rpg-tab-prog-fill" style="width: ${xpPct}%; background: ${tab.color}"></span></span>
            <span class="rpg-tab-prog-text" style="color: ${isActive ? tab.color : 'var(--text-muted)'}">${xpData.completed}/${xpData.total}</span>
          </span>
        </button>
      `;
    });
    html += '</div>';

    // Per-tab XP header (rendered dynamically)
    html += '<div id="rpg-xp-header"></div>';

    // Tree content container
    html += '<div id="rpg-tree-content" class="rpg-tree-content"></div>';

    container.innerHTML = html;

    // Now render the active tab's XP header and tree
    renderTabXPHeader();
    renderSkillTreeContent();
  }

  /**
   * Render the XP header for the active tab
   */
  function renderTabXPHeader() {
    const headerEl = document.getElementById('rpg-xp-header');
    if (!headerEl) return;

    if (!activeTab) {
      headerEl.innerHTML = `
        <div style="text-align: center; padding: 40px; color: var(--text-secondary);">
          <div style="font-size: 48px; margin-bottom: 16px;">🌳</div>
          <p>${I18n.t('select_category')}</p>
        </div>
      `;
      return;
    }

    const tabConfig = DAY_TABS.find(t => t.id === activeTab);
    const tabColor = tabConfig ? tabConfig.color : '#3b82f6';
    const tabLabel = tabConfig ? tabConfig.label : '';
    const tabIcon = tabConfig ? tabConfig.icon : '⚔️';

    // Completion-based XP per tab
    const xpData = getTabCompletedXP(activeTab);
    const totalWorkouts = xpData.total || 1;
    const levelThresholds = [
      { min: 0,                                        nameKey: 'level_beginner',  num: 1 },
      { min: Math.round(totalWorkouts * 0.1),          nameKey: 'level_apprentice', num: 2 },
      { min: Math.round(totalWorkouts * 0.25),         nameKey: 'level_intermediate', num: 3 },
      { min: Math.round(totalWorkouts * 0.5),          nameKey: 'level_advanced',  num: 4 },
      { min: Math.round(totalWorkouts * 0.75),         nameKey: 'level_expert',    num: 5 },
      { min: totalWorkouts,                            nameKey: 'level_master',   num: 6 }
    ];

    let levelName = I18n.t('level_beginner');
    let levelNum = 1;
    let currentLevelMin = 0;
    let nextLevelMin = levelThresholds[1].min;

    for (let i = levelThresholds.length - 1; i >= 0; i--) {
      if (xpData.completed >= levelThresholds[i].min) {
        levelName = I18n.t(levelThresholds[i].nameKey);
        levelNum = levelThresholds[i].num;
        currentLevelMin = levelThresholds[i].min;
        nextLevelMin = i < levelThresholds.length - 1 ? levelThresholds[i + 1].min : levelThresholds[i].min;
        break;
      }
    }

    // Progress within current level
    const levelRange = nextLevelMin - currentLevelMin;
    const levelProgress = levelRange > 0 ? Math.round(((xpData.completed - currentLevelMin) / levelRange) * 100) : 100;
    const isMaster = xpData.completed >= totalWorkouts;
    const nextLevelText = isMaster ? I18n.t('completed_all') : `${xpData.completed}/${nextLevelMin} ${I18n.t('workouts_to_level')}${levelNum + 1}`;

    headerEl.innerHTML = `
      <div class="rpg-progress-header" style="--header-color: ${tabColor}">
        <div class="rpg-level-badge" style="background: ${tabColor}">
          <span class="rpg-level-icon">${tabIcon}</span>
          <span class="rpg-level-text">Lv.${levelNum}</span>
        </div>
        <div class="rpg-xp-bar-container">
          <div class="rpg-xp-label-row">
            <span class="rpg-xp-category">${tabLabel}</span>
            <span class="rpg-xp-level-name">${levelName}</span>
          </div>
          <div class="rpg-xp-bar">
            <div class="rpg-xp-fill" style="width: ${levelProgress}%; background: ${tabColor}; box-shadow: 0 0 12px ${tabColor}55"></div>
          </div>
          <span class="rpg-xp-text">${nextLevelText}</span>
        </div>
      </div>
    `;
  }

  /**
   * Render the tree content for the active tab
   */
  function renderSkillTreeContent() {
    const contentEl = document.getElementById('rpg-tree-content');
    if (!contentEl) return;

    if (!activeTab) {
      contentEl.innerHTML = '';
      return;
    }

    const currentWeek = Math.floor((window.appCurrentPlanIndex || 0) / 7) + 1;
    const paths = SKILL_TREES[activeTab] || [];
    const tabConfig = DAY_TABS.find(t => t.id === activeTab);
    const tabColor = tabConfig ? tabConfig.color : '#3b82f6';

    let html = '';

    paths.forEach((path, pathIndex) => {
      html += `
        <div class="rpg-skill-path" style="--path-color: ${tabColor}; animation-delay: ${pathIndex * 0.1}s">
          <div class="rpg-path-header">
            <span class="rpg-path-icon">${path.icon}</span>
            <span class="rpg-path-title">${I18n.t(path.title)}</span>
          </div>
          <div class="rpg-nodes-track">
      `;

      // Group exercises by unlockWeek for progression rows
      const grouped = {};
      path.exercises.forEach(node => {
        if (!grouped[node.unlockWeek]) grouped[node.unlockWeek] = [];
        grouped[node.unlockWeek].push(node);
      });

      const sortedWeeks = Object.keys(grouped).map(Number).sort((a,b) => a - b);

      sortedWeeks.forEach((week, levelIndex) => {
        const nodes = grouped[week];
        const isLevelUnlocked = currentWeek >= week;
        const isLatestUnlock = isLevelUnlocked && 
          (levelIndex === sortedWeeks.length - 1 || currentWeek < sortedWeeks[levelIndex + 1]);

        // Fallback vertical connector line
        if (levelIndex > 0) {
          const prevUnlocked = currentWeek >= sortedWeeks[levelIndex - 1];
          const isNextTarget = prevUnlocked && !isLevelUnlocked;
          const arrowIcon = isLevelUnlocked ? '▼' : '🔒';
          const badgeText = isLevelUnlocked 
            ? `${arrowIcon}` 
            : `${arrowIcon} ${I18n.t('week_label_short') || 'W'}${week}`;

          html += `
            <div class="rpg-connector ${prevUnlocked && isLevelUnlocked ? 'active' : ''} ${isNextTarget ? 'next-target' : ''}">
              <div class="rpg-connector-line"></div>
              <div class="rpg-connector-badge">${badgeText}</div>
              ${prevUnlocked && isLevelUnlocked ? '<div class="rpg-connector-energy"></div>' : ''}
            </div>
          `;
        }

        const hasParallel = nodes.length > 1;

        if (hasParallel) {
          html += `<div class="rpg-fork-group">`;
          html += `<div class="rpg-fork-lines ${isLevelUnlocked ? 'active' : ''}" data-count="${nodes.length}"></div>`;
        }

        html += `<div class="rpg-level-row ${hasParallel ? 'parallel' : ''}">`;

        nodes.forEach((node, nodeIdx) => {
          const isUnlocked = currentWeek >= node.unlockWeek;
          const stateClass = isUnlocked ? 'unlocked' : 'locked';
          const latestClass = isLatestUnlock && isUnlocked ? 'latest' : '';
          const imgSrc = node.noImage ? null : `images/exercises/${node.name.replace(/\//g, '-').toUpperCase()}.png`;
          const equip = UI.getEquipment(node.name);
          const gifPath = `images/gifs/${node.name}.gif`;
          const videoBtn = UI.hasGif(node.name) ? `<button type="button" class="rpg-video-btn" title="${I18n.t('view_gif_title')}" onclick="event.stopPropagation(); UI.showImageModal('${node.name.replace(/'/g, "\\'")}', '${gifPath}')">▶</button>` : '';

          html += `
            <div class="rpg-node ${stateClass} ${latestClass}" 
                 data-node-id="${node.id || node.name}"
                 data-parent-id="${node.parentId || ''}"
                 onclick="UI.showImageModal('${node.name.replace(/'/g, "\\'")}', '${imgSrc || ''}')"
                 style="animation-delay: ${(pathIndex * 0.1) + (levelIndex * 0.08) + (nodeIdx * 0.05)}s">
              <div class="rpg-node-hex-wrap">
                <div class="rpg-node-hex" style="cursor: pointer;">
                  ${isUnlocked ? '' : '<div class="rpg-lock-icon">🔒</div>'}
                  ${imgSrc ? `<img src="${imgSrc}" class="rpg-node-img" alt="${node.name}" loading="eager" decoding="async" onerror="this.style.display='none'; this.parentElement.querySelector('.rpg-node-emoji') && (this.parentElement.querySelector('.rpg-node-emoji').style.display='flex')">` : ''}
                  ${!imgSrc || node.noImage ? `<div class="rpg-node-emoji" style="display:flex">${path.icon}</div>` : `<div class="rpg-node-emoji" style="display:none">${path.icon}</div>`}
                  ${isUnlocked ? `<div class="rpg-node-glow" style="--glow-color: ${tabColor}"></div>` : ''}
                </div>
              </div>
              <div class="rpg-node-info">
                <div class="rpg-node-name">${node.name}</div>
                <div class="rpg-node-badges">
                  ${!isUnlocked 
                    ? `<span class="rpg-unlock-badge locked">${I18n.t('locked_week')} ${node.unlockWeek}</span>` 
                    : `<span class="rpg-unlock-badge unlocked">${I18n.t('unlocked_week')} ${node.unlockWeek}</span>`}
                  ${equip && equip.label !== I18n.t('equip_bodyweight') ? `<span class="rpg-equip-badge" style="background: var(--bg-hover); color: var(--text-primary); border: 1px solid var(--border-light); padding: 4px 8px; border-radius: 6px; font-weight: 600; font-size: 11px; display: inline-flex; align-items: center; gap: 4px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); flex-shrink: 0; unicode-bidi: isolate; max-width: 100%; white-space: normal; word-break: break-word;">${equip.icon} ${equip.label}</span>` : ''}
                </div>
                ${(() => {
                  const tiers = getWeightTiers(node.name);
                  if (!tiers || tiers.length === 0) return '';
                  const wClass = (w) => {
                    const num = String(w || '').match(/\d+/);
                    return num ? 'evo-w' + num[0] : '';
                  };
                  if (tiers.length === 1) {
                    const t = tiers[0];
                    const tierActive = currentWeek >= t.fromWeek;
                    return `<div class="rpg-evo-single">
                      <span class="rpg-evo-card ${wClass(t.weight)} ${tierActive ? 'active current' : 'locked'}">
                        <span class="rpg-evo-weight">${t.weight}</span>
                        <span class="rpg-evo-week">${tierActive ? '✓' : '🔒'} ${I18n.t('week_label_short')}${t.fromWeek}</span>
                      </span>
                    </div>`;
                  }
                  let evoHtml = '';
                  tiers.forEach((t, ti) => {
                    const tierActive = currentWeek >= t.fromWeek;
                    const tierLatest = tierActive && (ti === tiers.length - 1 || currentWeek < tiers[ti + 1].fromWeek);
                    const tierCompleted = tierActive && !tierLatest;
                    const stClass = tierCompleted ? 'completed' : tierLatest ? 'active current' : 'locked';
                    if (ti > 0) {
                      const prevActive = currentWeek >= tiers[ti - 1].fromWeek;
                      evoHtml += `<div class="rpg-evo-connector ${prevActive && tierActive ? 'active' : ''}">
                        <div class="rpg-evo-line"></div>
                        <div class="rpg-evo-arrow-head">▸</div>
                      </div>`;
                    }
                    evoHtml += `<div class="rpg-evo-card ${wClass(t.weight)} ${stClass}">
                      <span class="rpg-evo-phase">Tier ${ti + 1}</span>
                      <span class="rpg-evo-weight">${t.weight}</span>
                      <span class="rpg-evo-week">${tierCompleted ? '✓' : tierLatest ? '◆' : '🔒'} ${I18n.t('week_label_full')} ${t.fromWeek}</span>
                    </div>`;
                  });
                  return `<div class="rpg-evo-chain">${evoHtml}</div>`;
                })()}
                ${node.note ? `<div class="rpg-node-note">🗓️ ${node.note}</div>` : ''}
              </div>
              ${videoBtn}
            </div>
          `;
        });

        html += `</div>`; // rpg-level-row

        if (hasParallel) {
          html += `</div>`; // rpg-fork-group
        }
      });

      html += `
          </div>
        </div>
      `;
    });

    contentEl.innerHTML = html;

    // Trigger staggered entrance animation and draw SVG lines
    requestAnimationFrame(() => {
      contentEl.querySelectorAll('.rpg-node').forEach(node => {
        node.classList.add('rpg-animate-in');
      });
      renderSVGConnectors();
    });
  }

  /**
   * Render SVG tree connector lines between parent & child nodes
   */
  function renderSVGConnectors() {
    const contentEl = document.getElementById('rpg-tree-content');
    if (!contentEl) return;

    const pathEls = contentEl.querySelectorAll('.rpg-skill-path');
    const tabConfig = DAY_TABS.find(t => t.id === activeTab);
    const tabColor = tabConfig ? tabConfig.color : '#3b82f6';

    pathEls.forEach(pathEl => {
      let svgCanvas = pathEl.querySelector('.rpg-path-svg-canvas');
      if (!svgCanvas) {
        svgCanvas = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svgCanvas.setAttribute('class', 'rpg-path-svg-canvas');
        svgCanvas.style.cssText = 'position:absolute; top:0; left:0; width:100%; height:100%; pointer-events:none; z-index:1;';
        pathEl.appendChild(svgCanvas);
      } else {
        svgCanvas.innerHTML = '';
      }

      const pathRect = pathEl.getBoundingClientRect();
      const nodes = pathEl.querySelectorAll('.rpg-node[data-node-id]');

      nodes.forEach(childNode => {
        const parentId = childNode.getAttribute('data-parent-id');
        if (!parentId) return;

        const parentNode = pathEl.querySelector(`.rpg-node[data-node-id="${parentId}"]`);
        if (!parentNode) return;

        const parentHex = parentNode.querySelector('.rpg-node-hex-wrap') || parentNode;
        const childHex = childNode.querySelector('.rpg-node-hex-wrap') || childNode;

        const parentRect = parentHex.getBoundingClientRect();
        const childRect = childHex.getBoundingClientRect();

        if (parentRect.width === 0 || childRect.width === 0) return;

        const x1 = parentRect.left + parentRect.width / 2 - pathRect.left;
        const y1 = parentRect.bottom - pathRect.top;

        const x2 = childRect.left + childRect.width / 2 - pathRect.left;
        const y2 = childRect.top - pathRect.top;

        const dy = Math.abs(y2 - y1);
        const cp1y = y1 + Math.max(dy * 0.45, 15);
        const cp2y = y2 - Math.max(dy * 0.45, 15);

        const isParentUnlocked = parentNode.classList.contains('unlocked');
        const isChildUnlocked = childNode.classList.contains('unlocked');
        const isActive = isParentUnlocked && isChildUnlocked;

        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', `M ${x1} ${y1} C ${x1} ${cp1y}, ${x2} ${cp2y}, ${x2} ${y2}`);

        if (isActive) {
          path.setAttribute('stroke', tabColor);
          path.setAttribute('stroke-width', '3');
          path.setAttribute('fill', 'none');
          path.setAttribute('class', 'rpg-svg-line active');
          path.setAttribute('style', `filter: drop-shadow(0 0 6px ${tabColor}); opacity: 0.85;`);
        } else {
          path.setAttribute('stroke', 'rgba(255, 255, 255, 0.18)');
          path.setAttribute('stroke-width', '2');
          path.setAttribute('stroke-dasharray', '5 4');
          path.setAttribute('fill', 'none');
          path.setAttribute('class', 'rpg-svg-line locked');
        }

        svgCanvas.appendChild(path);
      });
    });
  }

  /**
   * Render exercises guide (flat list view)
   */
  function render(searchTerm = '', filterCategory = 'all') {
    if(isTreeView) {
      renderSkillTree();
      return;
    }
    
    let filtered = allExercises;

    // Apply search
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(ex =>
        ex.name.toLowerCase().includes(term) ||
        (ex.category && ex.category.toLowerCase().includes(term))
      );
    }

    // Apply category filter
    if (filterCategory !== 'all') {
      filtered = filtered.filter(ex => ex.category === filterCategory);
    }

    const container = document.getElementById('exercise-guide');

    if (filtered.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; padding: 40px; grid-column: 1/-1;">
          <div style="font-size: 48px; margin-bottom: 16px;">🔍</div>
          <p style="color: var(--text-secondary);">${I18n.t('no_exercises_found')}</p>
        </div>
      `;
      return;
    }

    container.innerHTML = filtered.map(ex => {
      return generateGuideCardHTML(ex);
    }).join('');
  }

  /**
   * Generate HTML for a guide card
   */
  function generateGuideCardHTML(ex) {
    const diffClass = UI.getDifficultyClass(ex.difficulty);
    const gifPath = `images/gifs/${ex.name}.gif`;
    const videoLink = UI.hasGif(ex.name) ? `<button type="button" class="exercise-video-btn" title="${I18n.t('view_gif_title')}" style="color: var(--danger);" onclick="UI.showImageModal('${ex.name.replace(/'/g, "\\'")}', '${gifPath}'); event.stopPropagation();">▶</button>` : '';

    const equip = UI.getEquipment(ex.name);
    let weightDisplay = ex.weight || '';
    if (weightDisplay && equip && equip.label === I18n.t('equip_band') && weightDisplay !== '—') {
      weightDisplay = `${I18n.t('equip_band')}: ${weightDisplay}`;
    }

    const unlockWeek = ex.unlockWeek || 1;
    const weekBadgeHTML = unlockWeek > 1 
      ? `<span class="guide-unlock-badge locked" style="background: rgba(168, 85, 247, 0.15); color: #a855f7; border: 1px solid rgba(168, 85, 247, 0.3); padding: 2px 8px; border-radius: 6px; font-weight: 700; font-size: 11px;">🔒 ${I18n.t('locked_week') || 'שבוע'} ${unlockWeek}</span>`
      : `<span class="guide-unlock-badge unlocked" style="background: rgba(52, 211, 153, 0.15); color: #34d399; border: 1px solid rgba(52, 211, 153, 0.3); padding: 2px 8px; border-radius: 6px; font-weight: 700; font-size: 11px;">🔓 ${I18n.t('unlocked_week') || 'שבוע'} 1</span>`;

    const parentLineHTML = ex.parentName 
      ? `<div style="font-size: 11px; color: var(--accent-orange, #f97316); margin-top: 4px; font-weight: 600;">🔗 תנאי קדם: ${ex.parentName}</div>`
      : '';

    return `
      <div class="guide-card" style="cursor: pointer;" onclick="UI.showImageModal('${ex.name.replace(/'/g, "\\'")}')">
        <div class="guide-card-image-container diff-${diffClass} skeleton-loading">
          <div class="skeleton-placeholder" style="gap: 4px;">
            <div class="skeleton-spinner" style="width: 18px; height: 18px; border-width: 2px;"></div>
          </div>
          <img src="images/exercises/${ex.name.replace(/\//g, '-').toUpperCase()}.png" class="exercise-image skeleton-img" alt="${ex.name}" loading="eager" decoding="async" onload="UI.handleImageLoaded(this)" onerror="UI.handleImageFallback(this, 'png')">
        </div>
        <div class="guide-card-content">
          <div class="guide-card-title">
            <span style="flex: 0 1 auto; word-break: break-word;">${ex.name}</span>
            ${equip ? `<span class="guide-equipment" style="flex-shrink: 0; unicode-bidi: isolate;">${equip.icon} ${equip.label}</span>` : ''}
          </div>
          <div style="display: flex; align-items: center; gap: 8px; margin: 4px 0;">
            <span class="guide-card-category">${ex.category || ''}</span>
            ${weekBadgeHTML}
          </div>
          ${parentLineHTML}
          <div class="guide-card-sets">${ex.setsProgression || ''}</div>
          <div class="guide-card-meta">
            <span class="guide-difficulty ${diffClass}">${ex.difficulty || ''}</span>
            ${ex.tempo ? `<span class="guide-tempo" style="background: rgba(59, 130, 246, 0.12); color: var(--accent-primary); border: 1px solid rgba(59, 130, 246, 0.25); padding: 2px 6px; border-radius: 6px; font-weight: 600; font-size: 11px; display: inline-flex; align-items: center; gap: 4px;" title="${I18n.t('tempo_execution')}">⏱️ ${UI.formatTempo(ex.tempo)}</span>` : ''}
            ${weightDisplay ? `<span class="guide-weight"><bdi dir="ltr">${weightDisplay}</bdi></span>` : ''}
            ${videoLink}
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Show exercise details in modal
   */
  function showExerciseDetails(name) {
    const ex = allExercises.find(e => e.name === name);
    if(!ex) return;

    const html = generateGuideCardHTML(ex);
    const gifPath = `images/gifs/${ex.name}.gif`;
    const fullHtml = `
      <div style="display: flex; flex-direction: column; gap: 16px;">
        ${html}
        <div class="skeleton-loading" style="position: relative; width: 100%; min-height: 200px; border-radius: 12px; overflow: hidden; background: rgba(0, 0, 0, 0.25); border: 1px solid var(--border-color); display: flex; align-items: center; justify-content: center;">
          <div class="skeleton-placeholder">
            <div class="skeleton-spinner"></div>
            <span class="skeleton-text">🎬 ${I18n.t('loading_gif')}</span>
          </div>
          <img src="${gifPath}" 
               class="skeleton-img"
               style="width:100%; border-radius:8px; object-fit: contain; max-height: 40vh;" 
               alt="${ex.name} GIF" 
               loading="eager" 
               decoding="async" 
               onload="UI.handleImageLoaded(this)"
               onerror="UI.handleImageFallback(this, 'gif')">
        </div>
      </div>
    `;
    UI.showModal(ex.name, fullHtml);
  }

  return {
    init,
    render,
    setFilter,
    showExerciseDetails,
    switchTab,
    BAND_WEIGHT_PROGRESSION: EXERCISE_WEIGHT_PROGRESSION,
    EXERCISE_WEIGHT_PROGRESSION,
    SKILL_TREES,
    getWeightTiers
  };
})();

window.ExercisesPage = ExercisesPage;
