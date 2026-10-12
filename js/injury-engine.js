/**
 * Injury & Biomechanical Safety Engine — FitUp Pro
 * Manages vulnerable joint states and applies Zero-Compromise adaptations
 * (Restricted ROM / Safe Technique or 100% Muscle-Preserving Substitutions).
 */
const InjuryEngine = (() => {
  const STORAGE_KEY = 'fitup_joint_injuries';

  // State constants:
  // 0: Normal (🟢 Healthy, 100% load)
  // 1: Sensitive (🟡 Protected technique, restricted ROM, controlled tempo)
  // 2: Injured (🔴 Biomechanical equivalent substitute, 0 joint shear)
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
        badgeKey: 'injury_badge_knee_sub',
        cueKey: 'injury_cue_bss_injured'
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
        badgeKey: 'injury_badge_knee_sub',
        cueKey: 'injury_cue_squat_injured'
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
        badgeKey: 'injury_badge_back_sub',
        cueKey: 'injury_cue_rdl_injured'
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
        badgeKey: 'injury_badge_back_sub',
        cueKey: 'injury_cue_rdl_injured'
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
        substitute: 'Seated Single-Leg Calf Raise',
        badgeKey: 'injury_badge_achilles_sub',
        cueKey: 'injury_cue_calf_injured'
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
    // Ensure all joints have valid numeric state
    Object.keys(JOINTS).forEach(k => {
      if (jointStates[k] === undefined || ![0, 1, 2].includes(Number(jointStates[k]))) {
        jointStates[k] = STATE_NORMAL;
      } else {
        jointStates[k] = Number(jointStates[k]);
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
            if (jointStates[k] === undefined || ![0, 1, 2].includes(Number(jointStates[k]))) {
              jointStates[k] = STATE_NORMAL;
            } else {
              jointStates[k] = Number(jointStates[k]);
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
    return states[jointId] !== undefined ? states[jointId] : STATE_NORMAL;
  }

  function setJointState(jointId, state) {
    if (!JOINTS[jointId]) return;
    const states = loadStates();
    states[jointId] = Math.max(0, Math.min(2, Number(state) || 0));
    saveStates();
    return states[jointId];
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
    Object.keys(JOINTS).forEach(k => {
      states[k] = STATE_NORMAL;
    });
    saveStates();
  }

  function getActiveInjuries() {
    const states = loadStates();
    const active = {};
    Object.keys(states).forEach(k => {
      if (states[k] > STATE_NORMAL) {
        active[k] = {
          jointId: k,
          state: states[k],
          jointInfo: JOINTS[k]
        };
      }
    });
    return active;
  }

  function hasActiveInjuries() {
    const states = loadStates();
    return Object.values(states).some(v => v > STATE_NORMAL);
  }

  /**
   * Determine adaptation for a given exercise based on active joint states.
   * Prioritizes INJURED (2) over SENSITIVE (1).
   *
   * @param {string} exerciseName
   * @returns {object|null} adaptation info or null if healthy
   */
  function getExerciseAdaptation(exerciseName) {
    if (!exerciseName) return null;
    const cleanName = exerciseName.trim();
    const rule = EXERCISE_ADAPTATIONS[cleanName];
    if (!rule || !rule.joints) return null;

    const states = loadStates();
    let highestSeverity = STATE_NORMAL;
    let triggeringJoint = null;

    for (const jId of rule.joints) {
      const s = states[jId] || STATE_NORMAL;
      if (s > highestSeverity) {
        highestSeverity = s;
        triggeringJoint = jId;
      }
    }

    if (highestSeverity === STATE_NORMAL) return null;

    const jointDef = JOINTS[triggeringJoint] || { id: triggeringJoint, labelKey: triggeringJoint };

    if (highestSeverity === STATE_INJURED && rule.injured) {
      return {
        severity: STATE_INJURED,
        type: 'injured',
        jointId: triggeringJoint,
        jointDef,
        substituteName: rule.injured.substitute,
        badgeKey: rule.injured.badgeKey,
        cueKey: rule.injured.cueKey,
        originalExercise: cleanName
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

  return {
    STATE_NORMAL,
    STATE_SENSITIVE,
    STATE_INJURED,
    JOINTS,
    EXERCISE_ADAPTATIONS,
    getJointState,
    setJointState,
    cycleJointState,
    resetAllJoints,
    getActiveInjuries,
    hasActiveInjuries,
    getExerciseAdaptation,
    loadFromDB
  };
})();

if (typeof window !== 'undefined') {
  window.InjuryEngine = InjuryEngine;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = InjuryEngine;
}
