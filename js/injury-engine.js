/**
 * Injury & Biomechanical Safety Engine — FitUp Pro
 * Manages vulnerable joint states and applies Evidence-Based Joint-Sparing adaptations
 * (Restricted ROM / Safe Technique or Non-Provocative Substitutions).
 */
const InjuryEngine = (() => {
  const STORAGE_KEY = 'fitup_joint_injuries';

  // State constants:
  // 0: Normal (🟢 Healthy, 100% load)
  // 1: Sensitive (🟡 Protected technique, restricted ROM, controlled tempo)
  // 2: Injured (🔴 Joint-sparing substitute, unloads joint shear)
  const STATE_NORMAL = 0;
  const STATE_SENSITIVE = 1;
  const STATE_INJURED = 2;

  const JOINTS = {
    'knee_r': { id: 'knee_r', baseKey: 'knee', side: 'right', labelKey: 'joint_knee_r', defaultState: STATE_NORMAL },
    'knee_l': { id: 'knee_l', baseKey: 'knee', side: 'left', labelKey: 'joint_knee_l', defaultState: STATE_NORMAL },
    'shoulder_r': { id: 'shoulder_r', baseKey: 'shoulder', side: 'right', labelKey: 'joint_shoulder_r', defaultState: STATE_NORMAL },
    'shoulder_l': { id: 'shoulder_l', baseKey: 'shoulder', side: 'left', labelKey: 'joint_shoulder_l', defaultState: STATE_NORMAL },
    'elbow_r': { id: 'elbow_r', baseKey: 'elbow', side: 'right', labelKey: 'joint_elbow_r', defaultState: STATE_NORMAL },
    'elbow_l': { id: 'elbow_l', baseKey: 'elbow', side: 'left', labelKey: 'joint_elbow_l', defaultState: STATE_NORMAL },
    'wrist_r': { id: 'wrist_r', baseKey: 'wrist', side: 'right', labelKey: 'joint_wrist_r', defaultState: STATE_NORMAL },
    'wrist_l': { id: 'wrist_l', baseKey: 'wrist', side: 'left', labelKey: 'joint_wrist_l', defaultState: STATE_NORMAL },
    'lower_back': { id: 'lower_back', baseKey: 'lower_back', side: 'bilateral', labelKey: 'joint_lower_back', defaultState: STATE_NORMAL },
    'achilles_r': { id: 'achilles_r', baseKey: 'achilles', side: 'right', labelKey: 'joint_achilles_r', defaultState: STATE_NORMAL },
    'achilles_l': { id: 'achilles_l', baseKey: 'achilles', side: 'left', labelKey: 'joint_achilles_l', defaultState: STATE_NORMAL },
    'neck': { id: 'neck', baseKey: 'neck', side: 'bilateral', labelKey: 'joint_neck', defaultState: STATE_NORMAL }
  };

  /**
   * Biomechanical Mapping Table for Exercises:
   * Maps each exercise to its vulnerable joints and the exact clinical adaptation.
   */
  const EXERCISE_ADAPTATIONS = {
    // ── KNEE EXERCISES ──
    'Goblet Bulgarian Split Squat': {
      joints: ['knee_r', 'knee_l'],
      sensitive: {
        badgeKey: 'injury_badge_knee_rom',
        cueKey: 'injury_cue_bss_sensitive',
        tempo: '3-1-1'
      },
      injured: {
        substitute: 'DB Glute Bridge',
        secondarySubstitute: 'Single-Leg Glute Bridge',
        badgeKey: 'injury_badge_knee_sub',
        cueKey: 'injury_cue_bss_injured',
        secondaryCueKey: 'injury_cue_single_leg_bridge'
      }
    },
    'Heels-Elevated Goblet Squat': {
      joints: ['knee_r', 'knee_l'],
      sensitive: {
        badgeKey: 'injury_badge_knee_rom',
        cueKey: 'injury_cue_heels_squat_sensitive',
        tempo: '3-1-1'
      },
      injured: {
        substitute: 'DB Glute Bridge',
        secondarySubstitute: 'Wall Sit',
        badgeKey: 'injury_badge_knee_sub',
        cueKey: 'injury_cue_squat_injured',
        secondaryCueKey: 'injury_cue_wall_sit'
      }
    },
    'Bodyweight Squat': {
      joints: ['knee_r', 'knee_l'],
      sensitive: {
        badgeKey: 'injury_badge_knee_rom',
        cueKey: 'injury_cue_bw_squat_sensitive'
      },
      injured: {
        substitute: 'Glute Bridge',
        badgeKey: 'injury_badge_knee_sub',
        cueKey: 'injury_cue_bw_squat_injured'
      }
    },
    'Nordic Curl Progression': {
      joints: ['knee_r', 'knee_l'],
      sensitive: {
        badgeKey: 'injury_badge_knee_rom',
        cueKey: 'injury_cue_nordic_sensitive'
      },
      injured: {
        substitute: 'Goblet Romanian Deadlift',
        badgeKey: 'injury_badge_knee_sub',
        cueKey: 'injury_cue_nordic_injured'
      }
    },
    'High Knees': {
      joints: ['knee_r', 'knee_l'],
      sensitive: {
        badgeKey: 'injury_badge_knee_rom',
        cueKey: 'injury_cue_high_knees_sensitive'
      },
      injured: {
        substitute: 'Brisk Walking',
        badgeKey: 'injury_badge_knee_sub',
        cueKey: 'injury_cue_high_knees_injured'
      }
    },

    // ── SHOULDER EXERCISES ──
    'Single-Arm Seated OHP': {
      joints: ['shoulder_r', 'shoulder_l'],
      sensitive: {
        badgeKey: 'injury_badge_shoulder_rom',
        cueKey: 'injury_cue_ohp_sensitive',
        tempo: '3-0-1'
      },
      injured: {
        substitute: 'Single-Arm Floor Press',
        badgeKey: 'injury_badge_shoulder_sub',
        cueKey: 'injury_cue_ohp_injured'
      }
    },
    'Pike Progression': {
      joints: ['shoulder_r', 'shoulder_l', 'wrist_r', 'wrist_l'],
      sensitive: {
        badgeKey: 'injury_badge_shoulder_rom',
        cueKey: 'injury_cue_pike_sensitive'
      },
      injured: {
        substitute: 'Push-up Bars Progression',
        badgeKey: 'injury_badge_shoulder_sub',
        cueKey: 'injury_cue_pike_injured'
      }
    },
    'Elevated Pike Push-Up': {
      joints: ['shoulder_r', 'shoulder_l', 'wrist_r', 'wrist_l'],
      sensitive: {
        badgeKey: 'injury_badge_shoulder_rom',
        cueKey: 'injury_cue_pike_sensitive'
      },
      injured: {
        substitute: 'Push-up Bars Progression',
        badgeKey: 'injury_badge_shoulder_sub',
        cueKey: 'injury_cue_pike_injured'
      }
    },
    'Wall Handstand': {
      joints: ['shoulder_r', 'shoulder_l', 'wrist_r', 'wrist_l'],
      sensitive: {
        badgeKey: 'injury_badge_shoulder_rom',
        cueKey: 'injury_cue_handstand_sensitive'
      },
      injured: {
        substitute: 'Hollow Body Hold',
        badgeKey: 'injury_badge_shoulder_sub',
        cueKey: 'injury_cue_handstand_injured'
      }
    },
    'Wall Walk (Partial)': {
      joints: ['shoulder_r', 'shoulder_l', 'wrist_r', 'wrist_l'],
      sensitive: {
        badgeKey: 'injury_badge_shoulder_rom',
        cueKey: 'injury_cue_handstand_sensitive'
      },
      injured: {
        substitute: 'Hollow Body Hold',
        badgeKey: 'injury_badge_shoulder_sub',
        cueKey: 'injury_cue_handstand_injured'
      }
    },
    'Wall Walk (Full)': {
      joints: ['shoulder_r', 'shoulder_l', 'wrist_r', 'wrist_l'],
      sensitive: {
        badgeKey: 'injury_badge_shoulder_rom',
        cueKey: 'injury_cue_handstand_sensitive'
      },
      injured: {
        substitute: 'Hollow Body Hold',
        badgeKey: 'injury_badge_shoulder_sub',
        cueKey: 'injury_cue_handstand_injured'
      }
    },
    'Single-Arm Lateral Raise': {
      joints: ['shoulder_r', 'shoulder_l'],
      sensitive: {
        badgeKey: 'injury_badge_shoulder_rom',
        cueKey: 'injury_cue_lateral_sensitive'
      },
      injured: {
        substitute: 'TRX Face Pull',
        badgeKey: 'injury_badge_shoulder_sub',
        cueKey: 'injury_cue_lateral_injured'
      }
    },
    'Arm Block - Single-Arm Lateral Raise': {
      joints: ['shoulder_r', 'shoulder_l'],
      sensitive: {
        badgeKey: 'injury_badge_shoulder_rom',
        cueKey: 'injury_cue_lateral_sensitive'
      },
      injured: {
        substitute: 'TRX Face Pull',
        badgeKey: 'injury_badge_shoulder_sub',
        cueKey: 'injury_cue_lateral_injured'
      }
    },
    'TRX Y-T-W': {
      joints: ['shoulder_r', 'shoulder_l'],
      sensitive: {
        badgeKey: 'injury_badge_shoulder_rom',
        cueKey: 'injury_cue_ytw_sensitive'
      },
      injured: {
        substitute: 'Band Pull-Apart',
        badgeKey: 'injury_badge_shoulder_sub',
        cueKey: 'injury_cue_ytw_injured'
      }
    },

    // ── ELBOW & FOREARM EXERCISES ──
    'DB Overhead Triceps Extension': {
      joints: ['elbow_r', 'elbow_l'],
      sensitive: {
        badgeKey: 'injury_badge_elbow_rom',
        cueKey: 'injury_cue_triceps_ext_sensitive'
      },
      injured: {
        substitute: 'Single-Arm Floor Press',
        badgeKey: 'injury_badge_elbow_sub',
        cueKey: 'injury_cue_triceps_ext_injured'
      }
    },
    'Arm Block - DB Overhead Triceps Ext': {
      joints: ['elbow_r', 'elbow_l'],
      sensitive: {
        badgeKey: 'injury_badge_elbow_rom',
        cueKey: 'injury_cue_triceps_ext_sensitive'
      },
      injured: {
        substitute: 'Single-Arm Floor Press',
        badgeKey: 'injury_badge_elbow_sub',
        cueKey: 'injury_cue_triceps_ext_injured'
      }
    },
    'Diamond Push-Up': {
      joints: ['elbow_r', 'elbow_l', 'wrist_r', 'wrist_l'],
      sensitive: {
        badgeKey: 'injury_badge_elbow_rom',
        cueKey: 'injury_cue_diamond_sensitive'
      },
      injured: {
        substitute: 'Push-up Bars Progression',
        badgeKey: 'injury_badge_elbow_sub',
        cueKey: 'injury_cue_diamond_injured'
      }
    },
    'Weighted Diamond Push-Up': {
      joints: ['elbow_r', 'elbow_l', 'wrist_r', 'wrist_l'],
      sensitive: {
        badgeKey: 'injury_badge_elbow_rom',
        cueKey: 'injury_cue_diamond_sensitive'
      },
      injured: {
        substitute: 'Push-up Bars Progression',
        badgeKey: 'injury_badge_elbow_sub',
        cueKey: 'injury_cue_diamond_injured'
      }
    },
    'Single-Arm Curl': {
      joints: ['elbow_r', 'elbow_l'],
      sensitive: {
        badgeKey: 'injury_badge_elbow_rom',
        cueKey: 'injury_cue_curl_sensitive'
      },
      injured: {
        substitute: 'Single-Arm Hammer Curl',
        badgeKey: 'injury_badge_elbow_sub',
        cueKey: 'injury_cue_curl_injured'
      }
    },
    'Arm Block - Single-Arm Curl': {
      joints: ['elbow_r', 'elbow_l'],
      sensitive: {
        badgeKey: 'injury_badge_elbow_rom',
        cueKey: 'injury_cue_curl_sensitive'
      },
      injured: {
        substitute: 'Single-Arm Hammer Curl',
        badgeKey: 'injury_badge_elbow_sub',
        cueKey: 'injury_cue_curl_injured'
      }
    },
    'Chin-Up': {
      joints: ['elbow_r', 'elbow_l'],
      sensitive: {
        badgeKey: 'injury_badge_elbow_rom',
        cueKey: 'injury_cue_chinup_sensitive'
      },
      injured: {
        substitute: 'TRX Row',
        badgeKey: 'injury_badge_elbow_sub',
        cueKey: 'injury_cue_pullup_injured'
      }
    },
    'Chin-Up Progression': {
      joints: ['elbow_r', 'elbow_l'],
      sensitive: {
        badgeKey: 'injury_badge_elbow_rom',
        cueKey: 'injury_cue_chinup_sensitive'
      },
      injured: {
        substitute: 'TRX Row',
        badgeKey: 'injury_badge_elbow_sub',
        cueKey: 'injury_cue_pullup_injured'
      }
    },

    // ── WRIST EXERCISES (PUSH-UP VARIATIONS) ──
    'Push-up Bars Progression': {
      joints: ['wrist_r', 'wrist_l'],
      sensitive: {
        badgeKey: 'injury_badge_wrist_rom',
        cueKey: 'injury_cue_pushup_sensitive'
      },
      injured: {
        substitute: 'Single-Arm Floor Press',
        badgeKey: 'injury_badge_wrist_sub',
        cueKey: 'injury_cue_pushup_injured'
      }
    },
    'Push-Up Volume': {
      joints: ['wrist_r', 'wrist_l', 'shoulder_r', 'shoulder_l'],
      sensitive: {
        badgeKey: 'injury_badge_wrist_rom',
        cueKey: 'injury_cue_pushup_sensitive'
      },
      injured: {
        substitute: 'Single-Arm Floor Press',
        badgeKey: 'injury_badge_wrist_sub',
        cueKey: 'injury_cue_pushup_injured'
      }
    },
    'Push-Up Volume (Day 5)': {
      joints: ['wrist_r', 'wrist_l', 'shoulder_r', 'shoulder_l'],
      sensitive: {
        badgeKey: 'injury_badge_wrist_rom',
        cueKey: 'injury_cue_pushup_sensitive'
      },
      injured: {
        substitute: 'Single-Arm Floor Press',
        badgeKey: 'injury_badge_wrist_sub',
        cueKey: 'injury_cue_pushup_injured'
      }
    },
    'Deficit Push-Up': {
      joints: ['wrist_r', 'wrist_l', 'shoulder_r', 'shoulder_l'],
      sensitive: {
        badgeKey: 'injury_badge_wrist_rom',
        cueKey: 'injury_cue_pushup_sensitive'
      },
      injured: {
        substitute: 'Single-Arm Floor Press',
        badgeKey: 'injury_badge_wrist_sub',
        cueKey: 'injury_cue_pushup_injured'
      }
    },
    'Feet-Elevated Push-Up': {
      joints: ['wrist_r', 'wrist_l', 'shoulder_r', 'shoulder_l'],
      sensitive: {
        badgeKey: 'injury_badge_wrist_rom',
        cueKey: 'injury_cue_pushup_sensitive'
      },
      injured: {
        substitute: 'Single-Arm Floor Press',
        badgeKey: 'injury_badge_wrist_sub',
        cueKey: 'injury_cue_pushup_injured'
      }
    },
    'Weighted Deficit Push-Up': {
      joints: ['wrist_r', 'wrist_l', 'shoulder_r', 'shoulder_l'],
      sensitive: {
        badgeKey: 'injury_badge_wrist_rom',
        cueKey: 'injury_cue_pushup_sensitive'
      },
      injured: {
        substitute: 'Single-Arm Floor Press',
        badgeKey: 'injury_badge_wrist_sub',
        cueKey: 'injury_cue_pushup_injured'
      }
    },

    // ── LOWER BACK & SPINE EXERCISES ──
    'Goblet Romanian Deadlift': {
      joints: ['lower_back'],
      sensitive: {
        badgeKey: 'injury_badge_back_rom',
        cueKey: 'injury_cue_rdl_sensitive',
        tempo: '3-1-1'
      },
      injured: {
        substitute: 'DB Glute Bridge',
        secondarySubstitute: 'Dead Bug',
        badgeKey: 'injury_badge_back_sub',
        cueKey: 'injury_cue_rdl_injured',
        secondaryCueKey: 'injury_cue_rdl_secondary_injured'
      }
    },
    'Single-Leg RDL': {
      joints: ['lower_back'],
      sensitive: {
        badgeKey: 'injury_badge_back_rom',
        cueKey: 'injury_cue_single_rdl_sensitive'
      },
      injured: {
        substitute: 'DB Glute Bridge',
        secondarySubstitute: 'Dead Bug',
        badgeKey: 'injury_badge_back_sub',
        cueKey: 'injury_cue_rdl_injured',
        secondaryCueKey: 'injury_cue_rdl_secondary_injured'
      }
    },
    'Suitcase Carry': {
      joints: ['lower_back'],
      sensitive: {
        badgeKey: 'injury_badge_back_rom',
        cueKey: 'injury_cue_carry_sensitive'
      },
      injured: {
        substitute: 'Dead Bug',
        badgeKey: 'injury_badge_back_sub',
        cueKey: 'injury_cue_carry_injured'
      }
    },
    'One-Arm DB Row': {
      joints: ['lower_back'],
      sensitive: {
        badgeKey: 'injury_badge_back_rom',
        cueKey: 'injury_cue_db_row_sensitive'
      },
      injured: {
        substitute: 'Seated Band Row',
        badgeKey: 'injury_badge_back_sub',
        cueKey: 'injury_cue_db_row_injured'
      }
    },

    // ── ACHILLES & ANKLE EXERCISES ──
    'Standing Single-Leg Calf Raise': {
      joints: ['achilles_r', 'achilles_l'],
      sensitive: {
        badgeKey: 'injury_badge_achilles_rom',
        cueKey: 'injury_cue_calf_sensitive'
      },
      injured: {
        substitute: 'Brisk Walking',
        badgeKey: 'injury_badge_achilles_sub',
        cueKey: 'injury_cue_calf_injured'
      }
    },
    'Seated Single-Leg Calf Raise': {
      joints: ['achilles_r', 'achilles_l'],
      sensitive: {
        badgeKey: 'injury_badge_achilles_rom',
        cueKey: 'injury_cue_seated_calf_sensitive'
      },
      injured: {
        substitute: 'Brisk Walking',
        badgeKey: 'injury_badge_achilles_sub',
        cueKey: 'injury_cue_seated_calf_injured'
      }
    },
    'VO2 Max Norwegian 4x4': {
      joints: ['achilles_r', 'achilles_l', 'knee_r', 'knee_l'],
      sensitive: {
        badgeKey: 'injury_badge_achilles_rom',
        cueKey: 'injury_cue_vo2_sensitive'
      },
      injured: {
        substitute: 'Brisk Walking',
        badgeKey: 'injury_badge_achilles_sub',
        cueKey: 'injury_cue_vo2_injured'
      }
    },

    // ── CERVICAL / NECK EXERCISES ──
    'Band Neck Flexion & Extension': {
      joints: ['neck'],
      sensitive: {
        badgeKey: 'injury_badge_neck_rom',
        cueKey: 'injury_cue_neck_sensitive'
      },
      injured: {
        substitute: 'Relaxed Walking',
        badgeKey: 'injury_badge_neck_sub',
        cueKey: 'injury_cue_neck_injured'
      }
    }
  };

  /**
   * Internal storage cache
   */
  let jointStates = null;

  function loadStates() {
    if (jointStates) return jointStates;
    try {
      if (typeof localStorage !== 'undefined') {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          jointStates = JSON.parse(raw);
        }
      }
    } catch (e) {
      console.warn('[InjuryEngine] Failed to load from localStorage:', e);
    }
    if (!jointStates || typeof jointStates !== 'object') {
      jointStates = {};
    }
    // Ensure all joints have valid state structure
    Object.keys(JOINTS).forEach(k => {
      const entry = jointStates[k];
      if (entry === undefined) {
        jointStates[k] = { state: STATE_NORMAL, updatedAt: new Date().toISOString(), injuredAt: null };
      } else if (typeof entry === 'object' && entry !== null) {
        const s = [0, 1, 2].includes(Number(entry.state)) ? Number(entry.state) : STATE_NORMAL;
        jointStates[k] = {
          state: s,
          updatedAt: entry.updatedAt || new Date().toISOString(),
          injuredAt: entry.injuredAt || (s === STATE_INJURED ? new Date().toISOString() : null)
        };
      } else {
        const s = [0, 1, 2].includes(Number(entry)) ? Number(entry) : STATE_NORMAL;
        jointStates[k] = {
          state: s,
          updatedAt: new Date().toISOString(),
          injuredAt: s === STATE_INJURED ? new Date().toISOString() : null
        };
      }
    });
    return jointStates;
  }

  async function loadFromDB() {
    try {
      if (typeof DB !== 'undefined' && DB.getSetting) {
        const dbStates = await DB.getSetting(STORAGE_KEY);
        if (dbStates && typeof dbStates === 'object') {
          jointStates = { ...dbStates };
          Object.keys(JOINTS).forEach(k => {
            const entry = jointStates[k];
            if (entry === undefined) {
              jointStates[k] = { state: STATE_NORMAL, updatedAt: new Date().toISOString(), injuredAt: null };
            } else if (typeof entry === 'object' && entry !== null) {
              const s = [0, 1, 2].includes(Number(entry.state)) ? Number(entry.state) : STATE_NORMAL;
              jointStates[k] = {
                state: s,
                updatedAt: entry.updatedAt || new Date().toISOString(),
                injuredAt: entry.injuredAt || (s === STATE_INJURED ? new Date().toISOString() : null)
              };
            } else {
              const s = [0, 1, 2].includes(Number(entry)) ? Number(entry) : STATE_NORMAL;
              jointStates[k] = {
                state: s,
                updatedAt: new Date().toISOString(),
                injuredAt: s === STATE_INJURED ? new Date().toISOString() : null
              };
            }
          });
          if (typeof localStorage !== 'undefined') {
            try { localStorage.setItem(STORAGE_KEY, JSON.stringify(jointStates)); } catch (_) {}
          }
          notifyListeners();
          return jointStates;
        }
      }
    } catch (e) {
      console.warn('[InjuryEngine] Failed to load from DB:', e);
    }
    return loadStates();
  }

  function saveStates() {
    try {
      if (typeof localStorage !== 'undefined' && jointStates) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(jointStates));
      }
    } catch (e) {
      console.warn('[InjuryEngine] Failed to save to localStorage:', e);
    }
    if (typeof DB !== 'undefined' && DB.setSetting && jointStates) {
      DB.setSetting(STORAGE_KEY, jointStates).catch(e => {
        console.warn('[InjuryEngine] Failed to save to DB:', e);
      });
    }
    if (typeof window !== 'undefined' && window.CloudSync && window.CloudSync.scheduleSync) {
      window.CloudSync.scheduleSync();
    }
    notifyListeners();
  }

  function notifyListeners() {
    if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
      try {
        window.dispatchEvent(new CustomEvent('fitup_injury_changed', {
          detail: { states: { ...jointStates } }
        }));
      } catch (e) {
        // Ignore in restricted test environments
      }
    }
  }

  function getJointState(jointId) {
    const states = loadStates();
    const entry = states[jointId];
    if (entry === undefined) return STATE_NORMAL;
    if (typeof entry === 'object' && entry !== null) {
      return entry.state !== undefined ? entry.state : STATE_NORMAL;
    }
    return Number(entry);
  }

  function getJointDetails(jointId) {
    const states = loadStates();
    const entry = states[jointId];
    const s = getJointState(jointId);
    if (typeof entry === 'object' && entry !== null) {
      let daysInjured = 0;
      if (entry.injuredAt) {
        daysInjured = Math.max(0, (Date.now() - new Date(entry.injuredAt).getTime()) / (1000 * 60 * 60 * 24));
      }
      return {
        state: s,
        updatedAt: entry.updatedAt || new Date().toISOString(),
        injuredAt: entry.injuredAt || null,
        daysInjured
      };
    }
    return {
      state: s,
      updatedAt: new Date().toISOString(),
      injuredAt: null,
      daysInjured: 0
    };
  }

  function setJointState(jointId, state, options = {}) {
    if (!JOINTS[jointId]) return;
    const states = loadStates();
    const prevState = getJointState(jointId);
    const nextState = Math.max(0, Math.min(2, Number(state) || 0));
    const now = options.timestamp || new Date().toISOString();

    const existingEntry = (typeof states[jointId] === 'object' && states[jointId] !== null) ? states[jointId] : {};
    let injuredAt = existingEntry.injuredAt || null;

    if (nextState === STATE_INJURED && prevState !== STATE_INJURED) {
      injuredAt = now;
    } else if (nextState !== STATE_INJURED && prevState === STATE_INJURED) {
      // Joint recovered from INJURED (stepped down to Sensitive or Normal)
      if (injuredAt) {
        const daysInjured = (new Date(now).getTime() - new Date(injuredAt).getTime()) / (1000 * 60 * 60 * 24);
        const minDays = options.minDaysForDeload || 10;
        if (daysInjured >= minDays) {
          // Trigger post-injury load decay in ProgressionEngine
          if (typeof window !== 'undefined' && window.ProgressionEngine && window.ProgressionEngine.applyInjuryRecoveryDeload) {
            InjuryEngine.lastRecoveryDeloadPromise = window.ProgressionEngine.applyInjuryRecoveryDeload(jointId, daysInjured);
          }
        }
      }
      injuredAt = null;
    }

    states[jointId] = {
      state: nextState,
      updatedAt: now,
      injuredAt
    };
    saveStates();
    return nextState;
  }

  /**
   * 1-Tap cycle: Normal (0) -> Sensitive (1) -> Injured (2) -> Normal (0)
   */
  function cycleJointState(jointId) {
    const current = getJointState(jointId);
    const next = (current + 1) % 3;
    setJointState(jointId, next);
    return next;
  }

  function resetAllJoints() {
    const states = loadStates();
    const now = new Date().toISOString();
    Object.keys(JOINTS).forEach(k => {
      states[k] = {
        state: STATE_NORMAL,
        updatedAt: now,
        injuredAt: null
      };
    });
    saveStates();
  }

  function getActiveInjuries() {
    const states = loadStates();
    const active = {};
    Object.keys(states).forEach(k => {
      const s = getJointState(k);
      if (s > STATE_NORMAL) {
        const entry = typeof states[k] === 'object' ? states[k] : {};
        active[k] = {
          jointId: k,
          state: s,
          jointInfo: JOINTS[k],
          updatedAt: entry.updatedAt,
          injuredAt: entry.injuredAt
        };
      }
    });
    return active;
  }

  function hasActiveInjuries() {
    const states = loadStates();
    return Object.keys(states).some(k => getJointState(k) > STATE_NORMAL);
  }

  function hasInjuredJoints() {
    const states = loadStates();
    return Object.keys(states).some(k => getJointState(k) === STATE_INJURED);
  }

  /**
   * Determine adaptation for a given exercise based on active joint states.
   * Prioritizes INJURED (2) over SENSITIVE (1).
   * Supports session-level deduplication via existingExerciseNames.
   *
   * @param {string} exerciseName
   * @param {Array<string>} [existingExerciseNames=[]]
   * @returns {object|null} adaptation info or null if healthy
   */
  function getExerciseAdaptation(exerciseName, existingExerciseNames = []) {
    if (!exerciseName) return null;
    const cleanName = exerciseName.trim();
    const rule = EXERCISE_ADAPTATIONS[cleanName];
    if (!rule || !rule.joints) return null;

    let highestSeverity = STATE_NORMAL;
    let triggeringJoint = null;

    for (const jId of rule.joints) {
      const s = getJointState(jId);
      if (s > highestSeverity) {
        highestSeverity = s;
        triggeringJoint = jId;
      }
    }

    if (highestSeverity === STATE_NORMAL) return null;

    const jointDef = JOINTS[triggeringJoint] || { id: triggeringJoint, labelKey: triggeringJoint };

    if (highestSeverity === STATE_INJURED && rule.injured) {
      let chosenSubstitute = rule.injured.substitute;
      let chosenCueKey = rule.injured.cueKey;
      let isSecondary = false;

      // Deduplication & Secondary Fallback check
      if (existingExerciseNames && existingExerciseNames.length > 0) {
        const lowerExisting = existingExerciseNames.map(n => (n || '').toLowerCase().trim());
        const primaryLower = (chosenSubstitute || '').toLowerCase().trim();

        if (lowerExisting.includes(primaryLower)) {
          if (rule.injured.secondarySubstitute) {
            const secondaryLower = rule.injured.secondarySubstitute.toLowerCase().trim();
            if (!lowerExisting.includes(secondaryLower)) {
              chosenSubstitute = rule.injured.secondarySubstitute;
              chosenCueKey = rule.injured.secondaryCueKey || rule.injured.cueKey;
              isSecondary = true;
            } else {
              // Both primary and secondary exist in session -> trigger Volume Consolidation
              return {
                severity: STATE_INJURED,
                type: 'injured',
                jointId: triggeringJoint,
                jointDef,
                substituteName: chosenSubstitute,
                badgeKey: rule.injured.badgeKey,
                cueKey: chosenCueKey,
                originalExercise: cleanName,
                isConsolidated: true,
                consolidatedInto: chosenSubstitute
              };
            }
          } else {
            // No secondary substitute -> trigger Volume Consolidation
            return {
              severity: STATE_INJURED,
              type: 'injured',
              jointId: triggeringJoint,
              jointDef,
              substituteName: chosenSubstitute,
              badgeKey: rule.injured.badgeKey,
              cueKey: chosenCueKey,
              originalExercise: cleanName,
              isConsolidated: true,
              consolidatedInto: chosenSubstitute
            };
          }
        }
      }

      return {
        severity: STATE_INJURED,
        type: 'injured',
        jointId: triggeringJoint,
        jointDef,
        substituteName: chosenSubstitute,
        badgeKey: rule.injured.badgeKey,
        cueKey: chosenCueKey,
        originalExercise: cleanName,
        isSecondary
      };
    }

    if (highestSeverity === STATE_SENSITIVE && rule.sensitive) {
      return {
        severity: STATE_SENSITIVE,
        type: 'sensitive',
        jointId: triggeringJoint,
        jointDef,
        substituteName: null,
        badgeKey: rule.sensitive.badgeKey,
        cueKey: rule.sensitive.cueKey,
        tempo: rule.sensitive.tempo,
        originalExercise: cleanName
      };
    }

    return null;
  }

  /**
   * Adapts all exercises in a daily workout with intelligent deduplication & volume consolidation.
   * Completely prevents multiple identical cards (e.g. 3-4 DB Glute Bridges on Day 1).
   *
   * @param {Array<Object>} exercises
   * @returns {Array<Object>}
   */
  function adaptDayExercises(exercises) {
    if (!Array.isArray(exercises) || exercises.length === 0) return exercises;

    const adaptedList = [];
    const activeNames = [];
    const exerciseByActiveName = new Map();

    // Pass 1: Identify all native un-substituted exercises in the session
    exercises.forEach(ex => {
      const ad = getExerciseAdaptation(ex.name);
      if (!ad || ad.type !== 'injured' || !ad.substituteName) {
        activeNames.push(ex.name);
        exerciseByActiveName.set(ex.name, ex);
      }
    });

    // Pass 2: Apply adaptations with deduplication and volume capping
    exercises.forEach(ex => {
      const ad = getExerciseAdaptation(ex.name, activeNames);
      if (!ad) {
        adaptedList.push(ex);
        return;
      }

      if (ad.type === 'sensitive') {
        adaptedList.push({
          ...ex,
          injuryAdaptation: ad
        });
        return;
      }

      if (ad.type === 'injured' && ad.substituteName) {
        if (ad.isConsolidated) {
          // Consolidate into existing exercise card
          const targetEx = exerciseByActiveName.get(ad.consolidatedInto);
          if (targetEx) {
            const currentSetsMatch = (targetEx.sets || '').match(/^(\d+)/);
            const currentSets = currentSetsMatch ? parseInt(currentSetsMatch[1], 10) : (targetEx.setsCount || 3);
            const newSets = Math.min(5, currentSets + 1); // Capped at 5 sets max
            if (typeof targetEx.sets === 'string' && targetEx.sets.includes('×')) {
              targetEx.sets = targetEx.sets.replace(/^\d+/, newSets);
            } else {
              targetEx.sets = `${newSets} sets`;
            }
            targetEx.isVolumeConsolidated = true;
            targetEx.consolidatedSources = targetEx.consolidatedSources || [];
            targetEx.consolidatedSources.push(ex.name);
          }
          return;
        }

        activeNames.push(ad.substituteName);
        const subId = ad.substituteId || ad.substituteName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        const cloned = {
          ...ex,
          id: subId,
          name: ad.substituteName,
          originalId: ex.id,
          originalName: ex.name,
          injuryAdaptation: ad,
          isInjuredSubstitute: true
        };
        exerciseByActiveName.set(ad.substituteName, cloned);
        adaptedList.push(cloned);
      }
    });

    return adaptedList;
  }

  return {
    STATE_NORMAL,
    STATE_SENSITIVE,
    STATE_INJURED,
    JOINTS,
    EXERCISE_ADAPTATIONS,
    getJointState,
    getJointDetails,
    setJointState,
    cycleJointState,
    resetAllJoints,
    getActiveInjuries,
    hasActiveInjuries,
    hasInjuredJoints,
    getExerciseAdaptation,
    adaptDayExercises,
    loadFromDB
  };
})();

if (typeof window !== 'undefined') {
  window.InjuryEngine = InjuryEngine;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = InjuryEngine;
}
