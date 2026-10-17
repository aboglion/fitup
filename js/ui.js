/**
 * UI Utilities Module
 */
const UI = (() => {

  /**
   * Show a toast notification
   */
  function toast(message, type = 'info', duration = 3000) {
    const container = document.getElementById('toast-container');
    const el = document.createElement('div');
    el.className = `toast ${type}`;

    const icons = { success: '✓', error: '✗', info: 'ℹ' };
    el.innerHTML = `<span>${icons[type] || 'ℹ'}</span> ${message}`;

    container.appendChild(el);

    setTimeout(() => {
      el.classList.add('removing');
      setTimeout(() => el.remove(), 300);
    }, duration);
  }

  let modalStack = [];
  let isHiding = false;

  /**
   * Show modal
   */
  function showModal(title, bodyHTML) {
    modalStack.push({ title, bodyHTML });
    history.pushState({ isModal: true }, '');

    renderCurrentModal();
  }

  function handleImageLoaded(imgEl) {
    if (!imgEl) return;
    imgEl.classList.add('loaded');
    imgEl.style.opacity = '1';
    const container = imgEl.closest('.skeleton-loading');
    if (container) {
      container.classList.remove('skeleton-loading');
      container.classList.add('skeleton-loaded');
    }
  }

  function renderCurrentModal() {
    if (modalStack.length === 0) {
      document.getElementById('modal-overlay').classList.add('hidden');
      const modalEl = document.getElementById('modal');
      if (modalEl) modalEl.classList.remove('modal-exercise');
      return;
    }
    const current = modalStack[modalStack.length - 1];
    const modalEl = document.getElementById('modal');
    const isExercise = current.isExercise || (typeof current.title === 'string' && current.title.includes('exercise-header-row'));
    if (modalEl) {
      if (isExercise) {
        modalEl.classList.add('modal-exercise');
      } else {
        modalEl.classList.remove('modal-exercise');
      }
    }
    document.getElementById('modal-title').innerHTML = current.title;
    document.getElementById('modal-body').innerHTML = current.bodyHTML;
    document.getElementById('modal-overlay').classList.remove('hidden');

    setTimeout(() => {
      document.querySelectorAll('#modal-body .skeleton-img, #modal-header .skeleton-img').forEach(img => {
        if (img.complete && img.naturalWidth > 0) {
          handleImageLoaded(img);
        }
      });
    }, 15);
  }

  /**
   * Hide modal
   */
  function hideModal() {
    if (modalStack.length > 0) {
      if (!isHiding) {
        isHiding = true;
        history.back();
        setTimeout(() => { isHiding = false; }, 100);
      }
    } else {
      document.getElementById('modal-overlay').classList.add('hidden');
      const modalEl = document.getElementById('modal');
      if (modalEl) modalEl.classList.remove('modal-exercise');
    }
  }

  /**
   * Modern, Promise-based confirm dialog (replaces native window.confirm)
   */
  function confirm(options) {
    return new Promise((resolve) => {
      const opts = typeof options === 'string' ? { message: options } : (options || {});
      const title = opts.title || (window.I18n ? I18n.t('confirmation_title') : 'Confirmation');
      const message = opts.message || '';
      const confirmText = opts.confirmText || (window.I18n ? I18n.t('confirm_btn') : 'Confirm');
      const cancelText = opts.cancelText || (window.I18n ? I18n.t('cancel_btn') : 'Cancel');
      const confirmType = opts.type || 'primary';
      const icon = opts.icon || (confirmType === 'danger' ? '⚠️' : (confirmType === 'warning' ? '⚡' : '❓'));

      let confirmBtnClass = 'btn-primary';
      let confirmBtnStyle = 'padding: 12px; font-size: 14px; font-weight: 800; border-radius: 12px; width: 100%; border: none;';
      if (confirmType === 'danger') {
        confirmBtnClass = 'btn-danger';
        confirmBtnStyle += ' background: linear-gradient(135deg, #ef4444, #dc2626); color: #fff;';
      } else if (confirmType === 'warning') {
        confirmBtnStyle += ' background: linear-gradient(135deg, #f59e0b, #d97706); color: #fff;';
      }

      const bodyHTML = `
        <div class="custom-confirm-modal" style="text-align: center; padding: 12px 6px;">
          <div style="font-size: 42px; margin-bottom: 12px; filter: drop-shadow(0 4px 8px rgba(0,0,0,0.3));">${icon}</div>
          <p style="font-size: 14.5px; line-height: 1.55; color: var(--text-primary); margin-bottom: 22px; font-weight: 500;">
            ${message}
          </p>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
            <button id="ui-confirm-cancel" class="btn-secondary" style="padding: 12px; font-size: 14px; font-weight: 700; border-radius: 12px; width: 100%;">
              ${cancelText}
            </button>
            <button id="ui-confirm-ok" class="${confirmBtnClass}" style="${confirmBtnStyle}">
              ${confirmText}
            </button>
          </div>
        </div>
      `;

      showModal(title, bodyHTML);

      let isSettled = false;
      const finish = (result) => {
        if (isSettled) return;
        isSettled = true;
        hideModal();
        resolve(result);
      };

      const okBtn = document.getElementById('ui-confirm-ok');
      const cancelBtn = document.getElementById('ui-confirm-cancel');
      if (okBtn) okBtn.onclick = () => finish(true);
      if (cancelBtn) cancelBtn.onclick = () => finish(false);

      const closeBtn = document.getElementById('modal-close');
      const onDismiss = () => {
        if (!isSettled) {
          isSettled = true;
          resolve(false);
        }
      };
      if (closeBtn) closeBtn.addEventListener('click', onDismiss, { once: true });
    });
  }

  // Handle browser back button for modals
  window.addEventListener('popstate', (e) => {
    if (modalStack.length > 0) {
      modalStack.pop();
      renderCurrentModal();
    }
  });

  const imageTrials = {};

  const EXERCISE_GIF_ALIASES = {
    'ARM BLOCK - SINGLE-ARM LATERAL RAISE': 'Dumbbell Lateral Raise.gif',
    'ARM BLOCK - DB OVERHEAD TRICEPS EXT': 'DB OH Triceps Ext.gif',
    'ARM BLOCK - SINGLE-ARM CURL': 'Single-Arm Curl.gif',
    'ONE-ARM DB ROW': 'One-Arm DB Row.gif',
    'ONE ARM DB ROW': 'One-Arm DB Row.gif',
    'TUCK L-SIT': 'L-Sit Tuck (Bars).gif',
    'PUSH-UP BARS PROGRESSION': 'Push-up Bars Progression.gif',
    'PUSH-UP VOLUME (DAY 5)': 'Push-up.gif',
    'CHIN UP': 'Chin-up.gif',
    'CHIN UP NEGATIVE': 'Chin-up Negative.gif',
    'CHIN UP NEGATIVE (3S)': 'Chin-up Negative.gif',
    'CHIN UP PROGRESSION': 'Chin-Up Negative.gif',
    'FULL CHIN UP': 'Chin-up.gif',
    'WEIGHTED CHIN UP': 'Weighted Chin-Up.gif',
    'PULL UP (OVERHAND)': 'Pull-up (Overhand).gif',
    'PULL UP PROGRESSION': 'Pull-Up Negative.gif',
    'PULL UP NEGATIVE': 'Pull-Up Negative.gif',
    'PULL UP NEGATIVE (3S)': 'Pull-Up Negative.gif',
    'PULL UP NEGATIVE (5S)': 'Pull-Up Negative.gif',
    'WEIGHTED PULL UP': 'Weighted Pull-Up.gif',
    'ELEVATED PIKE PUSH UP': 'Elevated Pike Push-up.gif',
    'PIKE PUSH UP': 'Pike Push-up.gif',
    'DIAMOND PUSH UP': 'Diamond Push-Up.gif',
    'WEIGHTED DIAMOND PUSH UP': 'Weighted Diamond Push-Up.gif',
    'PIKE HOLD': 'Pike Hold.gif',
    'PIKE PROGRESSION': 'Pike Progression.gif',
    'FEET ELEVATED PIKE HOLD': 'Feet-Elevated Pike Hold.gif',
    'PUSH UP': 'Push-up.gif',
    'INCLINE PUSH UP': 'Incline Push-Up.gif',
    'DEFICIT PUSH UP': 'Deficit Push-Up.gif',
    'FEET ELEVATED PUSH UP': 'Feet-Elevated Push-Up.gif',
    'WEIGHTED DEFICIT PUSH UP': 'Weighted Deficit Push-Up.gif',
    'PUSH UP BARS PROGRESSION': 'Push-up Bars Progression.gif',
    'DB RDL': 'Dumbbell Romanian Deadlift (RDL).gif',
    'DB ROMANIAN DEADLIFT': 'Dumbbell Romanian Deadlift (RDL).gif',
    'GOBLET ROMANIAN DEADLIFT': 'Dumbbell Romanian Deadlift (RDL).gif',
    'DB SINGLE LEG RDL': 'Dumbbell Single-Leg RDL.gif',
    'SINGLE LEG RDL': 'Dumbbell Single-Leg RDL.gif',
    'DB CURL': 'Dumbbell Biceps Curl.gif',
    'HAMMER CURL': 'Dumbbell Hammer Curl.gif',
    'SINGLE ARM CURL': 'Single-Arm Curl.gif',
    'SINGLE ARM HAMMER CURL': 'Dumbbell Hammer Curl.gif',
    'ARM BLOCK DB CURL': 'Arm Block - DB Curl.gif',
    'ARM BLOCK SINGLE ARM CURL': 'Single-Arm Curl.gif',
    'DB LATERAL RAISE': 'Dumbbell Lateral Raise.gif',
    'SINGLE ARM LATERAL RAISE': 'Dumbbell Lateral Raise.gif',
    'ARM BLOCK DB LATERAL RAISE': 'Arm Block - DB Lateral Raise.gif',
    'ARM BLOCK SINGLE ARM LATERAL RAISE': 'Dumbbell Lateral Raise.gif',
    'ARM BLOCK DB OH TRICEPS EXT': 'DB OH Triceps Ext.gif',
    'ARM BLOCK DB OVERHEAD TRICEPS EXT': 'DB OH Triceps Ext.gif',
    'DB OH TRICEPS EXT': 'DB OH Triceps Ext.gif',
    'DB OVERHEAD TRICEPS EXTENSION': 'DB OH Triceps Ext.gif',
    'DB BULGARIAN SPLIT SQUAT': 'DB Bulgarian Split Squat.gif',
    'GOBLET BULGARIAN SPLIT SQUAT': 'DB BSS (Goblet).gif',
    'DB BSS': 'DB Bulgarian Split Squat.gif',
    'DB BSS (GOBLET)': 'DB BSS (Goblet).gif',
    'DB GLUTE BRIDGE': 'DB Glute Bridge.gif',
    'GLUTE BRIDGE': 'Glute Bridge.gif',
    'DB HIP THRUST': 'DB Glute Bridge.gif',
    'ONE ARM DB ROW': 'Dumbbell One-Arm Row.gif',
    'PALLOF PRESS': 'Pallof Press (Band).gif',
    'PALLOF PRESS PROGRESSION': 'Pallof Press (Band).gif',
    'PALLOF HOLD': 'Pallof Press (Band).gif',
    'REVERSE LUNGE': 'Reverse Lunge + DB.gif',
    'GOBLET REVERSE LUNGE': 'Reverse Lunge (Goblet).gif',
    'REVERSE LUNGE DB': 'Reverse Lunge + DB.gif',
    'REVERSE LUNGE PISTOL SQUAT': 'Reverse Lunge + DB.gif',
    'PISTOL SQUAT': 'PISTOL SQUAT.gif',
    'PISTOL SQUAT PROGRESSION': 'PISTOL SQUAT.gif',
    'PISTOL SQUAT TO CHAIR': 'PISTOL SQUAT.gif',
    'FULL PISTOL SQUAT': 'Full Pistol Squat.gif',
    'SEATED DB OHP': 'Seated DB OHP.gif',
    'SEATED DB OVERHEAD PRESS': 'Seated DB OHP.gif',
    'SINGLE ARM SEATED OHP': 'Single-Arm Seated OHP.gif',
    'SINGLE ARM FLOOR PRESS': 'Single-Arm Floor Press.gif',
    'DB FLOOR PRESS': 'Dumbbell Floor Press.gif',
    'DB HAMMER CURL': 'Dumbbell Hammer Curl.gif',
    'STANDING SINGLE LEG CALF RAISE': 'Standing Single-Leg Calf Raise.gif',
    'SEATED SINGLE LEG CALF RAISE': 'Seated Single-Leg Calf Raise.gif',
    'SINGLE LEG CALF RAISE': 'Single-Leg Calf Raise.gif',
    'SUITCASE CARRY': 'Suitcase Carry.gif',
    'WALKING LUNGE (GOBLET)': 'Walking Lunge (Goblet).gif',
    'WALL SIT': 'Wall Sit.gif',
    'WALL SIT PROGRESSION': 'Wall Sit.gif',
    'WALL WALK (PARTIAL)': 'Wall Walk (Partial).gif',
    'TRX FACE PULL': 'TRX Face Pull.gif',
    'TRX FACE PULL (ANGLE 1)': 'TRX Face Pull (Angle 1).gif',
    'TRX FACE PULL (ANGLE 2)': 'TRX Face Pull (Angle 2).gif',
    'TRX FACE PULL (ANGLE 3)': 'TRX Face Pull (Angle 3).gif',
    'ANGLE 1 (GENTLE)': 'TRX Face Pull (Angle 1).gif',
    'ANGLE 2 (MODERATE)': 'TRX Face Pull (Angle 2).gif',
    'ANGLE 3 (STEEP)': 'TRX Face Pull (Angle 3).gif',
    'TRX ROW': 'TRX Row.gif',
    'TRX ROW ANGLE 1': 'TRX Row.gif',
    'TRX ROW ANGLE 2': 'TRX Row.gif',
    'TRX ROW ANGLE 2 45': 'TRX Row.gif',
    'TRX ROW ANGLE 3': 'TRX Row.gif',
    'TRX ROW FEET ELEVATED': 'TRX Row.gif',
    'TRX ROW 75': 'TRX Row.gif',
    'TRX ROW 45': 'TRX Row.gif',
    'TRX ROW 30': 'TRX Row.gif',
    'TRX Y T W': 'TRX Y-T-W.gif',
    'TRX Y T W ANGLE 1': 'TRX Y-T-W.gif',
    'TRX Y T W ANGLE 2': 'TRX Y-T-W.gif',
    'TRX Y T W ANGLE 3': 'TRX Y-T-W.gif',
    'TRX Y T W 75': 'TRX Y-T-W.gif',
    'TRX Y T W 45': 'TRX Y-T-W.gif',
    'TRX Y T W 30': 'TRX Y-T-W.gif',
    'TRX FACE PULL ANGLE 1': 'TRX Face Pull (Angle 1).gif',
    'TRX FACE PULL ANGLE 2': 'TRX Face Pull (Angle 2).gif',
    'TRX FACE PULL ANGLE 3': 'TRX Face Pull (Angle 3).gif',
    'TRX FACE PULL 75': 'TRX Face Pull (Angle 1).gif',
    'TRX FACE PULL 45': 'TRX Face Pull (Angle 2).gif',
    'TRX FACE PULL 30': 'TRX Face Pull (Angle 3).gif',
    'L SIT PROGRESSION': 'Tuck Hold (Bars).gif',
    'L SIT TUCK (BARS)': 'Tuck Hold (Bars).gif',
    'TUCK HOLD (CHAIR)': 'Tuck Hold (Chair).gif',
    'TUCK HOLD (BARS)': 'Tuck Hold (Bars).gif',
    'HOLLOW BODY HOLD': 'Hollow Body Hold.gif',
    'DEEP MOBILITY PROTOCOL': 'Deep Mobility Protocol.gif',
    'MICRO MOBILITY PROTOCOL': 'Deep Mobility Protocol.gif',
    'BRISK WALKING': 'Brisk Walking.gif',
    'BRISK WALKING (ZONE 2)': 'Brisk Walking.gif',
    'RELAXED WALKING': 'Relaxed Walking.gif',
    'ACTIVE RECOVERY WALK': 'Relaxed Walking.gif',
    'ZONE 2 LIGHT WALK': 'Relaxed Walking.gif',
    'VO2 MAX NORWEGIAN 4X4': 'VO2 Max Norwegian.gif',
    'ONE LEG EXTENDED': 'One Leg Extended.gif',
    'ONE LEG EXTENDED L SIT': 'One Leg Extended.gif',
    'FULL L SIT': 'Full L-Sit.gif',
    'SCAPULAR PULL UP': 'Scapular Pull-up.gif',
    'FULL PULL UP': 'Pull-Up (Overhand).gif',
    'WRIST ROCKS': 'Wrist Rocks.gif',
    'ASSISTED PISTOL': 'Pistol Squat to Chair.gif',
    'PISTOL TO CHAIR': 'Pistol Squat to Chair.gif',
    'PISTOL TO HIGH BOX': 'Pistol Squat to Chair.gif',
    'PISTOL TO LOW BOX': 'Pistol Squat to Chair.gif',
    'FULL PISTOL': 'Full Pistol Squat.gif',
    'WEIGHTED 3KG': 'Full Pistol Squat.gif',
    'WEIGHTED 6KG': 'Full Pistol Squat.gif',
    'BODYWEIGHT': 'Dead Bug.gif',
    'LIGHT BAND 30KG': 'Band Pull-Apart.gif',
    'BAND 30KG': 'Band Pull-Apart.gif',
    'BAND 40KG': 'Band Pull-Apart.gif',
    'BAND 50KG': 'Band Pull-Apart.gif',
    'PALLOF HOLD 2H 30KG': 'Pallof Press (Band).gif',
    'PALLOF PRESS 2H 30KG': 'Pallof Press (Band).gif',
    'SINGLE ARM 30KG': 'Pallof Press (Band).gif',
    'SINGLE ARM 40KG': 'Pallof Press (Band).gif',
    'SINGLE ARM SPLIT STANCE 40KG': 'Pallof Press (Band).gif',
    'SINGLE ARM 50KG': 'Pallof Press (Band).gif',
    'SINGLE ARM ONE LEG 50KG': 'Pallof Press (Band).gif',
    '1KG': 'Dead Bug.gif',
    '2KG': 'Dead Bug.gif',
    '3KG': 'Dead Bug.gif',
    'FEET ELEVATED': 'TRX Row.gif',
    'HOLLOW HOLD': 'Hollow Body Hold.gif',
    'INCLINE DIAMOND': 'Incline Diamond Push-Up.gif',
    'INCLINE DIAMOND PUSH UP': 'Incline Diamond Push-Up.gif',
    'L SIT': 'Full L-Sit.gif',
    'NEGATIVE PULL UP': 'Pull-Up Negative.gif',
    'PULL UP': 'Pull-up (Overhand).gif',
    'PULL UP VEST 2KG': 'Weighted Pull-Up.gif',
    'VEST 4KG': 'Weighted Pull-Up.gif',
    'VEST 5KG': 'Weighted Pull-Up.gif',
    'TOWEL HANG VEST 5KG': 'Towel Hang.gif',
    'TUCK HOLD': 'Tuck Hold (Chair).gif',
    'TUCK L SIT': 'Tuck Hold (Bars).gif',
    'WEIGHTED DEFICIT VEST 5KG': 'Weighted Deficit Push-Up.gif',
    'WEIGHTED DIAMOND VEST 5KG': 'Weighted Diamond Push-Up.gif',
    'BAND NECK FLEXION EXTENSION': 'Band Neck Flexion & Extension.gif',
    'CAT COW': 'Cat-Cow.gif',
    'CAT-COW': 'Cat-Cow.gif',
    '90 90 HIP STRETCH': '90-90 Hip Stretch.gif',
    '90/90 HIP STRETCH': '90-90 Hip Stretch.gif',
    'THORACIC ROTATIONS': 'Thoracic Rotations.gif',
    'COUCH STRETCH': 'Couch Stretch.gif',
    'SLEEPER STRETCH': 'Sleeper Stretch.gif',
    'PRONE Y T W': 'Prone Y-T-W.gif',
    'PRONE Y-T-W': 'Prone Y-T-W.gif',
    'KNEELING HIP FLEXOR STRETCH': 'Couch Stretch.gif',
    'DEEP SQUAT HOLD': 'Deep Squat Hold.gif',
    'DOORWAY CHEST STRETCH': 'Doorway Chest Stretch.gif',
    'WORLDS GREATEST STRETCH': 'Worlds Greatest Stretch.gif',
    'WORLD\'S GREATEST STRETCH': 'Worlds Greatest Stretch.gif',
    'NORDIC CURL PROGRESSION': 'Nordic Curl Progression.gif',
    'NORDIC CURL': 'Nordic Curl Progression.gif',
    'SINGLE LEG GLUTE BRIDGE': 'Single-Leg Glute Bridge.gif',
    'SINGLE-LEG GLUTE BRIDGE': 'Single-Leg Glute Bridge.gif',
    'HEELS ELEVATED GOBLET SQUAT': 'Heels-Elevated Goblet Squat.gif',
    'HEELS-ELEVATED GOBLET SQUAT': 'Heels-Elevated Goblet Squat.gif',
    'DEAD BUG': 'Dead Bug.gif',
    'BODYWEIGHT SQUAT': 'Bodyweight Squat.gif',
    'HIGH KNEES': 'High Knees.gif',
    'DEAD HANG': 'Dead Hang.gif',
    'TOWEL HANG': 'Towel Hang.gif',
    'ARM CIRCLES': 'Arm Circles.gif',
    'WALL SLIDES': 'Wall Slides.gif',
    'WALL HANDSTAND': 'Wall Handstand.gif',
    'WALL WALK PARTIAL': 'Wall Walk (Partial).gif',
    'WALL WALK FULL': 'Wall Walk (Full).gif',
    'SEATED BAND ROW': 'Seated Band Row.gif',
    'PUSH UP VOLUME DAY 5': 'Push-Up Volume (Day 5).gif',
    'BAND PULL APART': 'Band Pull-Apart.gif',
    'BAND PULL-APART': 'Band Pull-Apart.gif',
    'PULL UP OVERHAND': 'Pull-Up (Overhand).gif',
    'SCAPULAR PUSH UP': 'Scapular Push-up.gif'
  };

  const DEEP_MOBILITY_SUB_EXERCISES = [
    { id: 'cat-cow', nameKey: 'sub_ex_cat_cow', targetKey: 'sub_target_cat_cow', descKey: 'sub_desc_cat_cow', gif: 'Cat-Cow.gif', defaultTarget: '10 reps' },
    { id: 'hip-stretch-9090', nameKey: 'sub_ex_hip_stretch', targetKey: 'sub_target_hip_stretch', descKey: 'sub_desc_hip_stretch', gif: '90-90 Hip Stretch.gif', defaultTarget: '8 / side' },
    { id: 'thoracic-rotations', nameKey: 'sub_ex_thoracic_rotations', targetKey: 'sub_target_thoracic_rotations', descKey: 'sub_desc_thoracic_rotations', gif: 'Thoracic Rotations.gif', defaultTarget: '8 / side' },
    { id: 'couch-stretch', nameKey: 'sub_ex_couch_stretch', targetKey: 'sub_target_couch_stretch', descKey: 'sub_desc_couch_stretch', gif: 'Couch Stretch.gif', defaultTarget: '45s / side' },
    { id: 'sleeper-stretch', nameKey: 'sub_ex_sleeper_stretch', targetKey: 'sub_target_sleeper_stretch', descKey: 'sub_desc_sleeper_stretch', gif: 'Sleeper Stretch.gif', defaultTarget: '30s / side' },
    { id: 'prone-ytw', nameKey: 'sub_ex_prone_ytw', targetKey: 'sub_target_prone_ytw', descKey: 'sub_desc_prone_ytw', gif: 'Prone Y-T-W.gif', defaultTarget: '8 / shape' }
  ];

  const MICRO_MOBILITY_A_SUB_EXERCISES = [
    { id: 'doorway-chest-stretch', nameKey: 'micro_ex_doorway_chest_stretch', targetKey: 'micro_target_30s_side', descKey: 'micro_desc_doorway_chest_stretch', gif: 'Doorway Chest Stretch.gif', defaultTarget: '30s / side' },
    { id: 'worlds-greatest-stretch', nameKey: 'micro_ex_worlds_greatest_stretch', targetKey: 'micro_target_30s_side', descKey: 'micro_desc_worlds_greatest_stretch', gif: 'Worlds Greatest Stretch.gif', defaultTarget: '30s / side' }
  ];

  const MICRO_MOBILITY_B_SUB_EXERCISES = [
    { id: 'kneeling-hip-flexor', nameKey: 'micro_ex_kneeling_hip_flexor', targetKey: 'micro_target_30s_side', descKey: 'micro_desc_kneeling_hip_flexor', gif: 'Kneeling Hip Flexor Stretch.gif', defaultTarget: '30s / side' },
    { id: 'deep-squat-hold', nameKey: 'micro_ex_deep_squat_hold', targetKey: 'micro_target_30s', descKey: 'micro_desc_deep_squat_hold', gif: 'Deep Squat Hold.gif', defaultTarget: '30s' }
  ];

  const MICRO_MOBILITY_SUB_EXERCISES = [
    ...MICRO_MOBILITY_A_SUB_EXERCISES,
    ...MICRO_MOBILITY_B_SUB_EXERCISES
  ];

  function getMicroMobilitySubExercises(dayIndexOrVariant) {
    if (typeof dayIndexOrVariant === 'string') {
      const v = dayIndexOrVariant.toUpperCase();
      if (/\bA\b/.test(v) || v.includes(' A') || v.includes('A ') || v.includes('A(') || v.includes('פוקוס עליון') || v.includes('UPPER FOCUS')) {
        return MICRO_MOBILITY_A_SUB_EXERCISES;
      }
      if (/\bB\b/.test(v) || v.includes(' B') || v.includes('B ') || v.includes('B(') || v.includes('פוקוס תחתון') || v.includes('LOWER FOCUS')) {
        return MICRO_MOBILITY_B_SUB_EXERCISES;
      }
    }

    let dayNum = 1;
    if (typeof dayIndexOrVariant === 'number') {
      if (dayIndexOrVariant >= 1 && dayIndexOrVariant <= 7) {
        dayNum = dayIndexOrVariant;
      } else {
        dayNum = ((dayIndexOrVariant % 7) + 7) % 7 + 1;
      }
    } else {
      if (window.TodayPage && typeof window.TodayPage.getCurrentDayIndex === 'function') {
        const idx = window.TodayPage.getCurrentDayIndex();
        dayNum = ((idx % 7) + 7) % 7 + 1;
      } else if (window.TodayPage && window.TodayPage.currentDayIndex !== undefined) {
        const idx = window.TodayPage.currentDayIndex;
        dayNum = ((idx % 7) + 7) % 7 + 1;
      }
    }

    // Days 3 (Push) & 5 (Pull) are Upper Focus (Variant A)
    if (dayNum === 3 || dayNum === 5) {
      return MICRO_MOBILITY_A_SUB_EXERCISES;
    }
    // Days 1 (Legs), 2 (Cardio) are Lower Focus (Variant B)
    return MICRO_MOBILITY_B_SUB_EXERCISES;
  }

  const EXERCISE_PNG_ALIASES = {
    'MICRO MOBILITY A': 'MICRO MOBILITY A.png',
    'MICRO MOBILITY A (UPPER FOCUS)': 'MICRO MOBILITY A.png',
    'MICRO MOBILITY B': 'MICRO MOBILITY B.png',
    'MICRO MOBILITY B (LOWER FOCUS)': 'MICRO MOBILITY B.png',
    'ARM BLOCK - SINGLE-ARM LATERAL RAISE': 'DB LATERAL RAISE.png',
    'ARM BLOCK - DB OVERHEAD TRICEPS EXT': 'DB OH TRICEPS EXT.png',
    'ARM BLOCK - SINGLE-ARM CURL': 'SINGLE-ARM CURL.png',
    'ONE-ARM DB ROW': 'ONE-ARM DB ROW.png',
    'ONE ARM DB ROW': 'ONE-ARM DB ROW.png',
    'TUCK L-SIT': 'L-SIT TUCK (BARS).png',
    'TUCK L SIT': 'L-SIT TUCK (BARS).png',
    'DB ROMANIAN DEADLIFT': 'DB RDL.png',
    'GOBLET ROMANIAN DEADLIFT': 'DB RDL.png',
    'SINGLE LEG RDL': 'DB SINGLE-LEG RDL.png',
    'SEATED DB OVERHEAD PRESS': 'SEATED DB OHP.png',
    'SINGLE ARM SEATED OHP': 'SINGLE-ARM SEATED OHP.png',
    'SINGLE ARM FLOOR PRESS': 'SINGLE-ARM FLOOR PRESS.png',
    'SINGLE ARM CURL': 'SINGLE-ARM CURL.png',
    'SINGLE ARM HAMMER CURL': 'DB HAMMER CURL.png',
    'SINGLE ARM LATERAL RAISE': 'DB LATERAL RAISE.png',
    'ARM BLOCK SINGLE ARM LATERAL RAISE': 'DB LATERAL RAISE.png',
    'DB OVERHEAD TRICEPS EXTENSION': 'DB OH TRICEPS EXT.png',
    'ARM BLOCK DB OVERHEAD TRICEPS EXT': 'DB OH TRICEPS EXT.png',
    'ARM BLOCK SINGLE ARM CURL': 'SINGLE-ARM CURL.png',
    'STANDING SINGLE LEG CALF RAISE': 'STANDING SINGLE-LEG CALF RAISE.png',
    'SEATED SINGLE LEG CALF RAISE': 'SEATED SINGLE-LEG CALF RAISE.png',
    'SINGLE LEG CALF RAISE': 'SINGLE-LEG CALF RAISE.png',
    'PALLOF PRESS PROGRESSION': 'PALLOF HOLD.png',
    'PALLOF HOLD': 'PALLOF PRESS.png',
    'PIKE PROGRESSION': 'PIKE PROGRESSION.png',
    'FEET ELEVATED PIKE HOLD': 'PIKE HOLD.png',
    'PIKE PUSH UP': 'PIKE PUSH-UP.png',
    'ELEVATED PIKE PUSH UP': 'ELEVATED PIKE PUSH-UP.png',
    'PUSH UP BARS PROGRESSION': 'PUSH-UP BARS PROGRESSION.png',
    'PUSH-UP BARS PROGRESSION': 'PUSH-UP BARS PROGRESSION.png',
    'PUSH UP VOLUME (DAY 5)': 'PUSH-UP.png',
    'PUSH UP VOLUME': 'PUSH-UP.png',
    'PULL UP PROGRESSION': 'PULL-UP NEGATIVE.png',
    'WEIGHTED PULL UP': 'WEIGHTED PULL-UP.png',
    'CHIN UP PROGRESSION': 'CHIN-UP NEGATIVE.png',
    'CHIN-UP PROGRESSION': 'CHIN-UP NEGATIVE.png',
    'NEGATIVE CHIN-UP': 'CHIN-UP NEGATIVE.png',
    'NEGATIVE CHIN UP': 'CHIN-UP NEGATIVE.png',
    'CHIN-UP NEGATIVE': 'CHIN-UP NEGATIVE.png',
    'CHIN UP NEGATIVE': 'CHIN-UP NEGATIVE.png',
    'WEIGHTED CHIN UP': 'WEIGHTED CHIN-UP.png',
    'WEIGHTED DEFICIT PUSH UP': 'WEIGHTED DEFICIT PUSH-UP.png',
    'HAMMER CURL': 'DB HAMMER CURL.png',
    'SINGLE ARM HAMMER CURL': 'DB HAMMER CURL.png',
    'L SIT PROGRESSION': 'L-SIT TUCK (BARS).png',
    'REVERSE LUNGE DB': 'REVERSE LUNGE + DB.png',
    'GOBLET REVERSE LUNGE': 'REVERSE LUNGE + DB.png',
    'GOBLET BULGARIAN SPLIT SQUAT': 'DB BSS (GOBLET).png',
    'PISTOL SQUAT': 'PISTOL SQUAT.png',
    'PISTOL SQUAT PROGRESSION': 'PISTOL SQUAT.png',
    'NORDIC CURL PROGRESSION': 'NORDIC CURL PROGRESSION.png',
    'FULL PISTOL SQUAT': 'FULL PISTOL SQUAT.png',
    'REVERSE LUNGE PISTOL SQUAT': 'REVERSE LUNGE + DB.png',
    'DB HIP THRUST': 'DB GLUTE BRIDGE.png',
    'DB GLUTE BRIDGE': 'DB GLUTE BRIDGE.png',
    'SINGLE LEG GLUTE BRIDGE': 'SINGLE-LEG GLUTE BRIDGE.png',
    'SINGLE-LEG GLUTE BRIDGE': 'SINGLE-LEG GLUTE BRIDGE.png',
    'WALL SIT': 'WALL SIT.png',
    'BRISK WALKING (ZONE 2)': 'BRISK WALKING.png',
    'ACTIVE RECOVERY WALK': 'RELAXED WALKING.png',
    'ZONE 2 LIGHT WALK': 'BRISK WALKING.png',
    'DEFICIT PUSH UP': 'DEFICIT PUSH-UP.png',
    'INCLINE PUSH UP': 'INCLINE PUSH-UP.png',
    'WEIGHTED DIAMOND PUSH UP': 'DIAMOND PUSH-UP.png',
    '1 KG': 'DEAD BUG.png',
    '2 KG': 'DEAD BUG.png',
    '3 KG': 'DEAD BUG.png',
    '15S HOLD': 'TOWEL HANG.png',
    '25S HOLD': 'TOWEL HANG.png',
    '35S HOLD': 'TOWEL HANG.png',
    '45S HOLD': 'TOWEL HANG.png',
    'ANGLE 1 (GENTLE)': 'TRX FACE PULL (ANGLE 1).png',
    'ANGLE 2 (MODERATE)': 'TRX FACE PULL (ANGLE 2).png',
    'ANGLE 3 (STEEP)': 'TRX FACE PULL (ANGLE 3).png',
    'TRX ROW': 'TRX ROW.png',
    'TRX ROW ANGLE 1': 'TRX ROW.png',
    'TRX ROW ANGLE 2': 'TRX ROW.png',
    'TRX ROW ANGLE 2 45': 'TRX ROW.png',
    'TRX ROW ANGLE 3': 'TRX ROW.png',
    'TRX ROW FEET ELEVATED': 'TRX ROW.png',
    'TRX Y T W': 'TRX Y-T-W.png',
    'TRX Y T W ANGLE 1': 'TRX Y-T-W.png',
    'TRX Y T W ANGLE 2': 'TRX Y-T-W.png',
    'TRX Y T W ANGLE 3': 'TRX Y-T-W.png',
    'TRX FACE PULL ANGLE 1': 'TRX FACE PULL (ANGLE 1).png',
    'TRX FACE PULL ANGLE 2': 'TRX FACE PULL (ANGLE 2).png',
    'TRX FACE PULL ANGLE 3': 'TRX FACE PULL (ANGLE 3).png',
    'FEET ELEVATED': 'TRX ROW.png',
    'FEET ELEVATED PIKE HOLD': 'FEET-ELEVATED PIKE HOLD.png',
    'TUCK HOLD (CHAIR)': 'TUCK HOLD (CHAIR).png',
    'TUCK HOLD (BARS)': 'L-SIT TUCK (BARS).png',
    'ONE LEG EXTENDED': 'ONE-LEG EXTENDED L-SIT.png',
    'ONE LEG EXTENDED L SIT': 'ONE-LEG EXTENDED L-SIT.png',
    'FULL L SIT': 'FULL L-SIT.png',
    'SCAPULAR PULL UP': 'SCAPULAR PULL-UP.png',
    'SCAPULAR PUSH UP': 'SCAPULAR PUSH-UP.png',
    'CHIN UP NEGATIVE (3S)': 'CHIN-UP NEGATIVE.png',
    'FULL CHIN UP': 'CHIN-UP NEGATIVE.png',
    'PULL UP NEGATIVE (3S)': 'PULL-UP NEGATIVE.png',
    'PULL UP NEGATIVE (5S)': 'PULL-UP NEGATIVE.png',
    'FULL PULL UP': 'PULL-UP (OVERHAND).png',
    'ASSISTED PISTOL': 'PISTOL SQUAT TO CHAIR.png',
    'PISTOL TO CHAIR': 'PISTOL SQUAT TO CHAIR.png',
    'PISTOL TO HIGH BOX': 'PISTOL SQUAT TO CHAIR.png',
    'PISTOL TO LOW BOX': 'PISTOL SQUAT TO CHAIR.png',
    'FULL PISTOL': 'FULL PISTOL SQUAT.png',
    'WEIGHTED 3KG': 'FULL PISTOL SQUAT.png',
    'WEIGHTED 6KG': 'FULL PISTOL SQUAT.png',
    'BODYWEIGHT': 'DEAD BUG.png',
    'LIGHT BAND 30KG': 'BAND PULL-APART.png',
    'BAND 30KG': 'BAND PULL-APART.png',
    'BAND 40KG': 'BAND PULL-APART.png',
    'BAND 50KG': 'BAND PULL-APART.png',
    'PALLOF HOLD 2H 30KG': 'PALLOF HOLD.png',
    'PALLOF PRESS 2H 30KG': 'PALLOF PRESS.png',
    'SINGLE ARM 30KG': 'PALLOF PRESS.png',
    'SINGLE ARM 40KG': 'PALLOF PRESS.png',
    'SINGLE ARM SPLIT STANCE 40KG': 'PALLOF PRESS.png',
    'SINGLE ARM 50KG': 'PALLOF PRESS.png',
    'SINGLE ARM ONE LEG 50KG': 'PALLOF PRESS.png',
    '1KG': 'DEAD BUG.png',
    '2KG': 'DEAD BUG.png',
    '3KG': 'DEAD BUG.png',
    'HOLLOW HOLD': 'HOLLOW BODY HOLD.png',
    'INCLINE DIAMOND': 'INCLINE DIAMOND PUSH-UP.png',
    'INCLINE DIAMOND PUSH UP': 'INCLINE DIAMOND PUSH-UP.png',
    'L SIT': 'FULL L-SIT.png',
    'NEGATIVE PULL UP': 'PULL-UP NEGATIVE.png',
    'PULL UP': 'PULL-UP (OVERHAND).png',
    'PULL UP VEST 2KG': 'WEIGHTED PULL-UP.png',
    'VEST 4KG': 'WEIGHTED PULL-UP.png',
    'VEST 5KG': 'WEIGHTED PULL-UP.png',
    'TOWEL HANG VEST 5KG': 'TOWEL HANG.png',
    'TUCK HOLD': 'TUCK HOLD (CHAIR).png',
    'TUCK L SIT': 'L-SIT TUCK (BARS).png',
    'WEIGHTED DEFICIT VEST 5KG': 'WEIGHTED DEFICIT PUSH-UP.png',
    'WEIGHTED DIAMOND VEST 5KG': 'WEIGHTED DIAMOND PUSH-UP.png',
    'BAND NECK FLEXION EXTENSION': 'BAND NECK FLEXION & EXTENSION.png',
    'TOWEL HANG 5KG': 'TOWEL HANG.png',
    'TOWEL HANG + 5KG': 'TOWEL HANG.png'
  };

  function safeDecodeURIComponent(uri) {
    if (!uri) return '';
    try {
      return decodeURIComponent(uri);
    } catch (_) {
      try {
        return decodeURIComponent(uri.replace(/%(?![0-9a-fA-F]{2})/g, '%25'));
      } catch (_) {
        return uri.replace(/%([0-9a-fA-F]{2})/g, (match, hex) => {
          const code = parseInt(hex, 16);
          if (code >= 0x20 && code <= 0x7E) {
            return String.fromCharCode(code);
          }
          return match;
        });
      }
    }
  }

  function handleImageFallback(imgEl, type) {
    if (!imgEl) return;
    const currentSrc = imgEl.src || '';
    const urlDecoded = safeDecodeURIComponent(currentSrc);

    if (type === 'gif') {
      const match = urlDecoded.match(/images\/gifs\/([^/?#]+)/);
      if (match) {
        const rawFilename = match[1];
        if (!imgEl.dataset.origFilename) {
          imgEl.dataset.origFilename = rawFilename;
        }
        const origKey = imgEl.dataset.origFilename;
        const lastDot = origKey.lastIndexOf('.');
        const baseName = lastDot !== -1 ? origKey.substring(0, lastDot) : origKey;
        const cleanBase = baseName.replace(/[-_]+/g, ' ').trim();
        const upperBase = cleanBase.toUpperCase();

        const variations = [];

        // Check alias mapping first
        if (EXERCISE_GIF_ALIASES[upperBase]) {
          variations.push(EXERCISE_GIF_ALIASES[upperBase]);
        }

        // Hyphenated case variations (e.g. Chin-Up -> Chin-up.gif)
        const titleHyphenLowerUp = baseName.replace(/-Up\b/g, '-up');
        if (titleHyphenLowerUp !== baseName) variations.push(titleHyphenLowerUp + '.gif');
        const wordLowerUp = baseName.replace(/\bUp\b/g, 'up');
        if (wordLowerUp !== baseName) variations.push(wordLowerUp + '.gif');

        // DB / Dumbbell variations
        const dbToDumbbell = baseName.replace(/\bDB\b/gi, 'Dumbbell');
        if (dbToDumbbell !== baseName) variations.push(dbToDumbbell + '.gif');
        const dumbbellToDb = baseName.replace(/\bDumbbell\b/gi, 'DB');
        if (dumbbellToDb !== baseName) variations.push(dumbbellToDb + '.gif');

        // Strip parentheses
        const strippedParen = baseName.replace(/\s*\([^)]*\)/g, '').trim();
        if (strippedParen !== baseName) {
          variations.push(strippedParen + '.gif');
          variations.push(strippedParen.replace(/\bDB\b/gi, 'Dumbbell') + '.gif');
        }

        // Standard string transformations
        variations.push(cleanBase.toUpperCase() + '.gif');
        variations.push(cleanBase.toLowerCase() + '.gif');
        variations.push(cleanBase.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ') + '.gif');
        variations.push(cleanBase.replace(/\s+/g, '_') + '.gif');
        variations.push(cleanBase.replace(/\s+/g, '_').toLowerCase() + '.gif');
        variations.push(cleanBase.replace(/\s+/g, '_').toUpperCase() + '.gif');
        variations.push(cleanBase.replace(/\s+/g, '-') + '.gif');
        variations.push(cleanBase.replace(/\s+/g, '-').toLowerCase() + '.gif');

        // Filter duplicates while preserving order
        const uniqueVariations = Array.from(new Set(variations)).filter(v => v !== rawFilename);

        if (!imageTrials[origKey]) {
          imageTrials[origKey] = 0;
        }

        const trialIndex = imageTrials[origKey];
        if (trialIndex < uniqueVariations.length) {
          imageTrials[origKey]++;
          imgEl.src = encodeMediaPath(`images/gifs/${uniqueVariations[trialIndex]}`);
          return;
        }

        if (imgEl.dataset.fallbackExname) {
          const fallbackName = imgEl.dataset.fallbackExname;
          delete imgEl.dataset.fallbackExname;
          delete imageTrials[origKey];
          imgEl.dataset.origFilename = '';
          imgEl.src = getGifUrl(fallbackName);
          return;
        }
      }
      if (imgEl.parentElement) {
        const b = imgEl.parentElement.querySelector('.fb-gif-badge');
        if (b) b.style.display = 'none';
      }
      const containerG = imgEl.closest('.skeleton-loading');
      if (containerG) containerG.classList.remove('skeleton-loading');
      imgEl.style.display = 'none';
    } else if (type === 'png') {
      const match = urlDecoded.match(/images\/exercises\/([^/?#]+)/);
      if (match) {
        const rawFilename = match[1];
        if (!imgEl.dataset.origFilename) {
          imgEl.dataset.origFilename = rawFilename;
        }
        const origKey = imgEl.dataset.origFilename;
        const lastDot = origKey.lastIndexOf('.');
        const baseName = lastDot !== -1 ? origKey.substring(0, lastDot) : origKey;
        const cleanBase = baseName.replace(/[-_]+/g, ' ').trim();
        const upperBase = cleanBase.toUpperCase();

        let dbVariant = upperBase;
        if (upperBase.startsWith('DUMBBELL ')) {
          dbVariant = 'DB ' + upperBase.slice(9);
        } else if (upperBase.startsWith('DB ')) {
          dbVariant = 'DUMBBELL ' + upperBase.slice(3);
        }

        const strippedParenBase = baseName.replace(/\s*\([^)]*\)/g, '').trim().toUpperCase();
        let dbVariantStripped = strippedParenBase;
        if (strippedParenBase.startsWith('DUMBBELL ')) {
          dbVariantStripped = 'DB ' + strippedParenBase.slice(9);
        } else if (strippedParenBase.startsWith('DB ')) {
          dbVariantStripped = 'DUMBBELL ' + strippedParenBase.slice(3);
        }

        // Prioritize explicit PNG aliases & uppercase disk filenames with spaces
        const variations = [
          EXERCISE_PNG_ALIASES[upperBase] || null,
          upperBase + '.png',
          dbVariant + '.png',
          upperBase.replace(/\s*\([^)]*\)/g, '').trim() + '.png',
          dbVariant.replace(/\s*\([^)]*\)/g, '').trim() + '.png',
          strippedParenBase + '.png',
          dbVariantStripped + '.png'
        ].filter(Boolean);

        const uniqueVariations = Array.from(new Set(variations)).filter(v => v !== rawFilename);

        if (!imageTrials[origKey]) {
          imageTrials[origKey] = 0;
        }

        const trialIndex = imageTrials[origKey];
        if (trialIndex < uniqueVariations.length) {
          imageTrials[origKey]++;
          imgEl.src = encodeMediaPath(`images/exercises/${uniqueVariations[trialIndex]}`) + '?v=136';
          return;
        }

        if (imgEl.dataset.fallbackExname) {
          const fallbackName = imgEl.dataset.fallbackExname;
          delete imgEl.dataset.fallbackExname;
          delete imageTrials[origKey];
          imgEl.dataset.origFilename = '';
          imgEl.src = getImageUrl(fallbackName);
          return;
        }
      }
      const containerP = imgEl.closest('.skeleton-loading');
      if (containerP) containerP.classList.remove('skeleton-loading');
      if (imgEl.classList.contains('exercise-image') || imgEl.classList.contains('exercise-hero-image')) {
        if (imgEl.parentElement) imgEl.parentElement.style.display = 'none';
      } else {
        imgEl.style.display = 'none';
      }
    }
  }

  const NO_GIF_EXERCISES = new Set([]);

  function hasGif(title) {
    if (!title) return false;
    const upper = title.trim().toUpperCase();
    return !NO_GIF_EXERCISES.has(upper);
  }

  function encodeMediaPath(path) {
    // Percent-encode each segment so names with spaces / & survive innerHTML attribute injection on any protocol
    return path.split('/').map(encodeURIComponent).join('/');
  }

  function getImageUrl(title, dayIndex) {
    if (!title) return null;
    const cleanTitle = title.toUpperCase().replace(/[^A-Z0-9]+/g, ' ').trim();
    if (cleanTitle.includes('MICRO MOBILITY A')) {
      return encodeMediaPath('images/exercises/MICRO MOBILITY A.png') + '?v=136';
    }
    if (cleanTitle.includes('MICRO MOBILITY B')) {
      return encodeMediaPath('images/exercises/MICRO MOBILITY B.png') + '?v=136';
    }
    if (cleanTitle === 'MICRO MOBILITY PROTOCOL' || cleanTitle === 'MICRO MOBILITY') {
      let currentDayIndex = dayIndex;
      if (currentDayIndex === undefined || currentDayIndex === null) {
        if (window.TodayPage && typeof window.TodayPage.getCurrentDayIndex === 'function') {
          currentDayIndex = window.TodayPage.getCurrentDayIndex();
        } else if (window.TodayPage && window.TodayPage.currentDayIndex !== undefined) {
          currentDayIndex = window.TodayPage.currentDayIndex;
        }
      }
      let dayNum = 1;
      if (typeof currentDayIndex === 'number') {
        dayNum = ((currentDayIndex % 7) + 7) % 7 + 1;
      }
      const isVariantA = (dayNum === 3 || dayNum === 5);
      return encodeMediaPath(isVariantA ? 'images/exercises/MICRO MOBILITY A.png' : 'images/exercises/MICRO MOBILITY B.png') + '?v=136';
    }
    const aliasPng = EXERCISE_PNG_ALIASES[cleanTitle];
    const path = aliasPng ? `images/exercises/${aliasPng}` : `images/exercises/${title.replace(/\//g, '-').toUpperCase()}.png`;
    return encodeMediaPath(path) + '?v=136';
  }

  function getGifUrl(title) {
    if (!title) return null;
    if (title.startsWith('images/') || title.startsWith('http://') || title.startsWith('https://')) {
      return encodeMediaPath(title);
    }
    const cleanTitle = title.toUpperCase().replace(/[^A-Z0-9]+/g, ' ').trim();
    const aliasGif = EXERCISE_GIF_ALIASES[cleanTitle];
    let fileName = aliasGif || title;
    if (!fileName.toLowerCase().endsWith('.gif')) {
      fileName += '.gif';
    }
    const path = `images/gifs/${fileName}`;
    return encodeMediaPath(path);
  }

  /**
   * Helper to resolve the angle tier ('75', '45', '30', '180') from an exercise/stage string
   */
  function resolveTrxAngleTier(str) {
    if (!str) return '75';
    const s = String(str).toLowerCase();
    if (s.includes('180') || s.includes('elevated') || s.includes('מוגבה') || s.includes('مرفوع') || s.includes('feet') || s.includes('רגליים') || s.includes('أقدام')) {
      return '180';
    }
    if (s.includes('30') || s.includes('angle 3') || s.includes('זווית 3') || s.includes('זאויה 3') || s.includes('steep') || s.includes('עמוקה') || s.includes('عميقة')) {
      return '30';
    }
    if (s.includes('45') || s.includes('angle 2') || s.includes('זווית 2') || s.includes('זאויה 2') || s.includes('moderate') || s.includes('בינונית') || s.includes('متوسطة')) {
      return '45';
    }
    return '75';
  }

  /**
   * Returns a lightweight, high-contrast, biomechanically accurate mini-SVG illustration
   * showing the athlete's body angle relative to the TRX straps and ground.
   */
  function getTrxAngleSvg(angleOrStage, options = {}) {
    const width = options.width || 44;
    const height = options.height || 28;
    const tier = resolveTrxAngleTier(angleOrStage);
    const title = options.title || (typeof I18n !== 'undefined' ? I18n.t(`Angle ${tier}°`) : `TRX ${tier}°`);

    let content = '';

    if (tier === '75') {
      content = `
        <line x1="2" y1="26" x2="44" y2="26" stroke="currentColor" stroke-opacity="0.3" stroke-width="1.5" stroke-linecap="round"/>
        <line x1="4" y1="3" x2="12" y2="3" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"/>
        <line x1="8" y1="3" x2="22" y2="10" stroke="#f59e0b" stroke-width="1.5" stroke-linecap="round"/>
        <line x1="28" y1="10" x2="22" y2="10" stroke="#38bdf8" stroke-width="1.6" stroke-linecap="round"/>
        <line x1="28" y1="10" x2="33" y2="26" stroke="#38bdf8" stroke-width="2.5" stroke-linecap="round"/>
        <circle cx="27" cy="5.5" r="2.2" fill="#38bdf8"/>
        <path d="M 37 26 A 4 4 0 0 0 34.5 22.5" fill="none" stroke="#60a5fa" stroke-width="1.2"/>
        <text x="37" y="19" font-size="7" font-weight="900" fill="#60a5fa" font-family="'Inter', system-ui, sans-serif">75°</text>
      `;
    } else if (tier === '45') {
      content = `
        <line x1="2" y1="26" x2="44" y2="26" stroke="currentColor" stroke-opacity="0.3" stroke-width="1.5" stroke-linecap="round"/>
        <line x1="4" y1="3" x2="12" y2="3" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"/>
        <line x1="8" y1="3" x2="16" y2="13" stroke="#f59e0b" stroke-width="1.5" stroke-linecap="round"/>
        <line x1="22" y1="14" x2="16" y2="13" stroke="#38bdf8" stroke-width="1.6" stroke-linecap="round"/>
        <line x1="22" y1="14" x2="35" y2="26" stroke="#38bdf8" stroke-width="2.5" stroke-linecap="round"/>
        <circle cx="20" cy="10" r="2.2" fill="#38bdf8"/>
        <path d="M 40 26 A 5 5 0 0 0 37 22.5" fill="none" stroke="#60a5fa" stroke-width="1.2"/>
        <text x="33" y="14" font-size="7" font-weight="900" fill="#60a5fa" font-family="'Inter', system-ui, sans-serif">45°</text>
      `;
    } else if (tier === '30') {
      content = `
        <line x1="2" y1="26" x2="44" y2="26" stroke="currentColor" stroke-opacity="0.3" stroke-width="1.5" stroke-linecap="round"/>
        <line x1="4" y1="3" x2="12" y2="3" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"/>
        <line x1="8" y1="3" x2="15" y2="15" stroke="#f59e0b" stroke-width="1.5" stroke-linecap="round"/>
        <line x1="22" y1="18" x2="15" y2="15" stroke="#38bdf8" stroke-width="1.6" stroke-linecap="round"/>
        <line x1="22" y1="18" x2="38" y2="26" stroke="#38bdf8" stroke-width="2.5" stroke-linecap="round"/>
        <circle cx="18.5" cy="15.5" r="2.2" fill="#38bdf8"/>
        <path d="M 43 26 A 5 5 0 0 0 40 23.5" fill="none" stroke="#60a5fa" stroke-width="1.2"/>
        <text x="30" y="12" font-size="7" font-weight="900" fill="#60a5fa" font-family="'Inter', system-ui, sans-serif">30°</text>
      `;
    } else {
      content = `
        <line x1="2" y1="26" x2="44" y2="26" stroke="currentColor" stroke-opacity="0.3" stroke-width="1.5" stroke-linecap="round"/>
        <rect x="29" y="16" width="13" height="10" rx="1.5" fill="rgba(148, 163, 184, 0.2)" stroke="#94a3b8" stroke-width="1"/>
        <line x1="14" y1="3" x2="22" y2="3" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"/>
        <line x1="18" y1="3" x2="18" y2="11" stroke="#f59e0b" stroke-width="1.5" stroke-linecap="round"/>
        <line x1="16" y1="16" x2="18" y2="11" stroke="#38bdf8" stroke-width="1.6" stroke-linecap="round"/>
        <line x1="16" y1="16" x2="33" y2="16" stroke="#38bdf8" stroke-width="2.5" stroke-linecap="round"/>
        <circle cx="12" cy="16" r="2.2" fill="#38bdf8"/>
        <text x="22" y="10" font-size="6.5" font-weight="900" fill="#60a5fa" font-family="'Inter', system-ui, sans-serif">180°</text>
      `;
    }

    return `<svg class="trx-angle-mini-diagram" width="${width}" height="${height}" viewBox="0 0 46 28" fill="none" xmlns="http://www.w3.org/2000/svg" style="display: block; vertical-align: middle; flex-shrink: 0;" aria-label="${title}"><title>${title}</title>${content}</svg>`;
  }

  function showImageModal(title, src, fallbackTitle) {
    let effectiveTitle = title || '';
    if (fallbackTitle) {
      const fbClean = fallbackTitle.trim();
      const tClean = effectiveTitle.trim();
      // If title is just a generic stage/angle/tier name, resolve using the base fallback exercise
      if (/^(angle\s*\d+|זווית|زاوية|\d+°|feet-elevated|רגליים|أقدام|bodyweight|\+?\s*\d+\s*kg|band\s*\d+\s*kg|incline\s*\d+%?)/i.test(tClean)) {
        if (fbClean.toLowerCase().includes('face pull')) {
          let baseAngle = 'Angle 1';
          if (/2|45|moderate|בינונית|متوسطة/i.test(tClean)) baseAngle = 'Angle 2';
          else if (/3|30|steep|עמוקה|عميقة/i.test(tClean)) baseAngle = 'Angle 3';
          effectiveTitle = `TRX Face Pull (${baseAngle})`;
        } else {
          effectiveTitle = fbClean;
        }
      }
    }

    const pngPath = getImageUrl(effectiveTitle);
    const fallbackAttr = fallbackTitle ? `data-fallback-exname="${fallbackTitle.replace(/"/g, '&quot;')}"` : '';

    let gifPath;
    if (src && src.includes('.gif')) {
      const effLower = effectiveTitle.toLowerCase();
      const srcLower = safeDecodeURIComponent(src).toLowerCase();
      // If src doesn't match the exercise (e.g. TRX Face Pull passed for TRX Row or TRX Y-T-W), recalculate
      if ((effLower.includes('trx row') && !srcLower.includes('trx row')) ||
          (effLower.includes('trx y-t-w') && !srcLower.includes('trx y-t-w'))) {
        gifPath = getGifUrl(effectiveTitle);
      } else {
        gifPath = src;
      }
    } else {
      gifPath = getGifUrl(effectiveTitle);
    }
    const cleanTitle = (effectiveTitle || '').toUpperCase().replace(/[^A-Z0-9]+/g, ' ').trim();
    const gifExists = hasGif(effectiveTitle) || (gifPath && gifPath.includes('.gif')) || !!EXERCISE_GIF_ALIASES[cleanTitle];
    const equip = getEquipment(effectiveTitle);

    let extraNote = '';
    const lowerTitle = effectiveTitle.toLowerCase();
    if (lowerTitle.includes('chin-up') || lowerTitle.includes('pull-up')) {
      extraNote = `
        <div style="background: rgba(59, 130, 246, 0.1); padding: 12px; border-radius: 10px; border: 1px solid rgba(59, 130, 246, 0.3); margin-top: 4px;">
          <p style="font-size: 13px; margin-bottom: 6px; color: var(--text-primary);"><strong>${I18n.t('grip_tip_title')}</strong></p>
          <ul style="font-size: 12px; color: var(--text-secondary); padding-inline-start: 18px; margin: 0; line-height: 1.5;">
            <li style="margin-bottom: 4px;"><strong>Chin-up:</strong> ${I18n.t('grip_chin')}</li>
            <li><strong>Pull-up:</strong> ${I18n.t('grip_pull')}</li>
          </ul>
        </div>
      `;
    } else if (lowerTitle.includes('neck') || lowerTitle.includes('צוואר')) {
      extraNote = `
        <div style="background: rgba(245, 158, 11, 0.12); padding: 12px; border-radius: 10px; border: 1px solid rgba(245, 158, 11, 0.3); margin-top: 4px;">
          <p style="font-size: 13px; margin-bottom: 6px; color: var(--text-primary);"><strong>${I18n.t('neck_tip_title')}</strong></p>
          <ul style="font-size: 12px; color: var(--text-secondary); padding-inline-start: 18px; margin: 0; line-height: 1.5;">
            <li style="margin-bottom: 6px;">${I18n.t('neck_flexion_cue')}</li>
            <li>${I18n.t('neck_extension_cue')}</li>
          </ul>
        </div>
      `;
    }

    const searchTitle = (effectiveTitle || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    const fallbackSearch = (fallbackTitle || '').toLowerCase().replace(/[^a-z0-9]/g, '');

    function matchExerciseRecord(e) {
      if (!e) return false;
      const eClean = (e.name || '').toLowerCase().replace(/[^a-z0-9]/g, '');
      const idClean = (e.id || '').toLowerCase().replace(/[^a-z0-9]/g, '');
      if (eClean === searchTitle || idClean === searchTitle) return true;
      if (fallbackSearch && (eClean === fallbackSearch || idClean === fallbackSearch)) return true;
      if (e.stages && e.stages.some(s => s.toLowerCase().replace(/[^a-z0-9]/g, '') === searchTitle)) return true;
      return false;
    }

    const exData = (window.TRAINING_DATA?.exercises || []).find(matchExerciseRecord);

    // Look for matching plan exercise in current day or anywhere in active plan days
    let planEx = null;
    if (window.TodayPage && typeof window.TodayPage.getCurrentDayIndex === 'function') {
      const curIdx = window.TodayPage.getCurrentDayIndex();
      const curDay = window.allPlanDays?.[curIdx] || window.TRAINING_DATA?.daily?.[curIdx];
      if (curDay?.exercises) {
        planEx = curDay.exercises.find(matchExerciseRecord);
      }
    }
    if (!planEx) {
      const allDays = window.allPlanDays || window.TRAINING_DATA?.daily || [];
      for (const d of allDays) {
        const found = (d.exercises || []).find(matchExerciseRecord);
        if (found) {
          planEx = found;
          break;
        }
      }
    }

    const isWarmup = !!(planEx?.isWarmup || exData?.category === 'Warmup' || lowerTitle.includes('warmup') || lowerTitle.includes('חימום') || ['arm-circles', 'wall-slides', 'scapular-push-up', 'scapular-pull-up', 'dead-hang', 'high-knees', 'bodyweight-squat', 'glute-bridge', 'dead-bug', 'seated-band-row'].includes(exData?.id || ''));
    const isCardio = !!(exData?.category === 'Cardio' || lowerTitle.includes('walking') || lowerTitle.includes('cardio') || lowerTitle.includes('vo2 max'));
    const isMobility = !!(lowerTitle.includes('mobility') || lowerTitle.includes('מוביליות'));
    const isBodyweight = !exData?.startingWeight && !planEx?.weight;

    let metadataHTML = '';
    if (exData || planEx || isWarmup || isMobility || isCardio) {
      const secLabel = I18n.t('unit_seconds', 'שניות');
      const repsLabel = I18n.t('unit_reps', 'חזרות');
      const kgLabel = I18n.t('unit_kg', 'ק״ג');
      const perSideLabel = I18n.t('per_side', 'לכל צד');
      const minLbl = I18n.t('min_label', 'מינ׳');
      const maxLbl = I18n.t('max_label', 'מקס׳');

      // 1. Rest formatting
      let restText = null;
      const rRange = planEx?.restRange || exData?.restRange;
      const rSec = planEx?.rest !== undefined ? planEx.rest : exData?.restSeconds;
      if (rRange && rRange[0] !== rRange[1]) {
        restText = `${rRange[0]}-${rRange[1]} ${secLabel}`;
      } else if (rSec !== undefined && rSec !== null) {
        if (rSec === 0) {
          restText = I18n.t('continuous_flow', 'מעבר רציף (ללא מנוחה)');
        } else {
          restText = `${rSec} ${secLabel}`;
        }
      }

      // 2. Reps / Target formatting
      let repText = null;
      if (exData?.windowMin && exData?.windowMax) {
        repText = `${exData.windowMin}-${exData.windowMax} ${repsLabel}`;
      } else {
        const rawTarget = planEx?.sets || planEx?.repWindow || exData?.repWindow;
        if (rawTarget) {
          let str = String(rawTarget);
          if (str.includes('forward') && str.includes('backward')) {
            str = str.replace(/forward/i, I18n.t('direction_forward', 'לפנים'))
                     .replace(/backward/i, I18n.t('direction_backward', 'לאחור'));
          }
          if (str.includes('each side')) {
            str = str.replace(/each side/i, I18n.t('each_side_suffix', 'לכל צד'));
          }
          if (str.includes('Slow')) {
            str = str.replace(/\(Slow\)/i, `(${I18n.t('slow_controlled_tag', 'איטי ומבוקר')})`);
          }
          if (str.includes('secs')) {
            str = str.replace(/secs/i, secLabel);
          }
          if (str.includes('mins')) {
            str = str.replace(/mins/i, I18n.t('unit_minutes', 'דקות'));
          }
          if (/^\d+$/.test(str.trim())) {
            str = `${str.trim()} ${repsLabel}`;
          }
          repText = str;
        }
      }

      // 3. Weight / Resistance formatting
      let weightText = null;
      if (exData?.startingWeight != null) {
        weightText = `${exData.startingWeight} ${kgLabel} (${exData.loadType || perSideLabel}) [${minLbl} ${exData.minWeight || 3}${kgLabel} | ${maxLbl} ${exData.maxWeight || 32}${kgLabel}]`;
      } else if (planEx?.weight) {
        let w = String(planEx.weight);
        if (/^bodyweight$/i.test(w.trim())) {
          weightText = I18n.t('bodyweight_load', 'משקל גוף (Bodyweight)');
        } else if (w.startsWith('Band')) {
          weightText = w.replace(/Band/i, I18n.t('band_label', 'גומייה'));
        } else if (w.startsWith('Incline')) {
          weightText = w.replace(/Incline/i, I18n.t('incline_label', 'שיפוע'));
        } else {
          weightText = w;
        }
      } else if (isWarmup || isBodyweight) {
        weightText = I18n.t('bodyweight_load', 'משקל גוף (Bodyweight)');
      }

      // 4. Tempo formatting
      let tempoText = exData?.tempo || planEx?.tempo;
      if (!tempoText) {
        if (isWarmup) {
          tempoText = I18n.t('tempo_warmup_flow', 'תנועה רציפה וזורמת');
        } else if (isMobility) {
          tempoText = I18n.t('tempo_slow_hold', 'איטי ומבוקר (החזקה בסוף טווח)');
        } else if (isCardio) {
          tempoText = I18n.t('tempo_steady_cardio', 'קצב יציב ומדוד (זון 2)');
        } else if (exData || planEx) {
          tempoText = I18n.t('tempo_controlled', '2-1-2 מבוקר');
        }
      }

      // 5. Structure formatting
      let structureText = null;
      const rawStruct = planEx?.structure || exData?.structure;
      if (rawStruct === 'pair') {
        structureText = I18n.t('structure_pair', 'סופר-סט / זוג (Pair)');
      } else if (rawStruct === 'circuit') {
        structureText = I18n.t('structure_circuit', 'מעגל (Circuit)');
      } else if (isWarmup) {
        structureText = I18n.t('structure_warmup_dynamic', 'חימום דינמי והכנת מפרקים');
      } else if (isCardio) {
        structureText = I18n.t('structure_cardio_protocol', 'פרוטוקול אירובי וסיבולת');
      } else if (isMobility) {
        structureText = I18n.t('structure_mobility_protocol', 'מוביליות וטווחי תנועה');
      } else if (rawStruct === 'straight') {
        structureText = I18n.t('structure_straight', 'סטים רגילים (Straight Sets)');
      } else if (exData?.category) {
        structureText = exData.category;
      }

      // 6. Muscle focus
      let muscleFocusText = null;
      const exId = (exData?.id || planEx?.id || searchTitle).toLowerCase();
      if (typeof StatsPage !== 'undefined' && typeof StatsPage.getMuscleForExercise === 'function') {
        const mKey = StatsPage.getMuscleForExercise({ id: exId, name: effectiveTitle });
        if (mKey) {
          muscleFocusText = I18n.t('muscle_' + mKey) || mKey;
        }
      } else if (typeof AnatomyMap !== 'undefined' && typeof AnatomyMap.getMusclesForExercise === 'function') {
        const muscles = AnatomyMap.getMusclesForExercise(effectiveTitle);
        if (muscles && muscles.length > 0) {
          muscleFocusText = muscles.map(m => I18n.t('muscle_' + m) || m).join(', ');
        }
      }

      // 7. Rule resolution
      const ruleKey = 'rule_' + (exId || searchTitle).replace(/[-_]+/g, '_');
      let ruleText = (I18n.t(ruleKey) !== ruleKey) ? I18n.t(ruleKey) : (exData?.rule || '');
      if (ruleText) {
        ruleText = enrichHeartRateText(ruleText);
      }

      const chips = [];
      if (repText) chips.push({ icon: '🎯', label: I18n.t('label_rep_window', 'יעד חזרות:'), val: enrichHeartRateText(repText) });
      if (restText) chips.push({ icon: '⏳', label: I18n.t('label_rest', 'מנוחה:'), val: enrichHeartRateText(restText) });
      if (tempoText) chips.push({ icon: '⏱️', label: I18n.t('label_tempo', 'טמפו:'), val: enrichHeartRateText(tempoText) });
      if (structureText) chips.push({ icon: '🏗️', label: I18n.t('label_structure', 'מבנה:'), val: enrichHeartRateText(structureText) });
      if (muscleFocusText) chips.push({ icon: '💪', label: I18n.t('label_target_muscle', 'מיקוד שרירי:'), val: muscleFocusText });
      if (weightText) chips.push({ icon: '⚖️', label: I18n.t('label_starting_weight', 'משקל / התנגדות:'), val: enrichHeartRateText(weightText), fullWidth: true });

      if (chips.length > 0 || ruleText) {
        metadataHTML = `
          <div style="background: var(--bg-card); padding: 10px 12px; border-radius: 12px; border: 1px solid var(--border-light); display: flex; flex-direction: column; gap: 6px;">
            <div style="font-size: 13px; font-weight: 800; color: var(--accent-primary, #3b82f6); display: flex; align-items: center; gap: 6px;">
              <span>📋</span> <span>${I18n.t('zero_decisions_spec', 'מפרט ופרוטוקול ביצוע ("Zero Decisions")')}</span>
            </div>
            ${chips.length > 0 ? `
              <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 6px; font-size: 12px;">
                ${chips.map(chip => `
                  <div style="background: var(--bg-elevated); border: 1px solid var(--border-color); padding: 5px 8px; border-radius: 6px; ${chip.fullWidth ? 'grid-column: 1/-1;' : ''}">
                    ${chip.icon} <b>${chip.label}</b> ${chip.val}
                  </div>
                `).join('')}
              </div>
            ` : ''}
            ${ruleText ? `
              <div style="margin-top: 2px; padding: 6px 8px; background: rgba(245, 158, 11, 0.12); border-right: 3px solid #f59e0b; border-radius: 6px; font-size: 11.5px; color: var(--text-primary); line-height: 1.4;">
                <b>⚠️ ${I18n.t('mechanical_stop_rule', 'כלל טכניקה / Mechanical Stop:')}</b> ${ruleText}
              </div>
            ` : ''}
          </div>
        `;
      }
    }

    const isDeepMobilitySub = (DEEP_MOBILITY_SUB_EXERCISES || []).some(s => {
      const sName = (I18n.t(s.nameKey) || '').toLowerCase();
      const tLower = (title || '').toLowerCase();
      return sName.includes(tLower) || tLower.includes(sName) || s.id.toLowerCase() === tLower || (s.gif && s.gif.toLowerCase().includes(tLower));
    });

    const isMicroMobilitySub = (MICRO_MOBILITY_SUB_EXERCISES || []).some(s => {
      const sName = (I18n.t(s.nameKey) || '').toLowerCase();
      const tLower = (title || '').toLowerCase();
      return sName.includes(tLower) || tLower.includes(sName) || s.id.toLowerCase() === tLower || (s.gif && s.gif.toLowerCase().includes(tLower));
    });

    const isMobilitySub = isDeepMobilitySub || isMicroMobilitySub || (fallbackTitle && fallbackTitle.toLowerCase().includes('mobility'));
    const parentTitle = fallbackTitle || (isMicroMobilitySub ? 'Micro Mobility Protocol' : 'Deep Mobility Protocol');

    const headerBoxHTML = isMobilitySub ? `
      <button type="button" class="btn-secondary" 
              style="width: 40px; height: 40px; min-width: 40px; border-radius: 10px; background: var(--bg-card); border: 1px solid var(--border-light); display: flex; align-items: center; justify-content: center; cursor: pointer; color: var(--text-primary); transition: all 0.2s ease; box-shadow: 0 2px 8px rgba(0,0,0,0.2); flex-shrink: 0;"
              onclick="UI.showImageModal('${parentTitle.replace(/'/g, "\\'")}')"
              title="${I18n.t('back_to_protocol', 'חזור לפרוטוקול המלא')}">
        <span style="font-size: 18px;">↩️</span>
      </button>
    ` : `
      <div class="skeleton-loading exercise-header-thumb-box" 
           title="${I18n.t('anatomy_muscle_map', 'מפת שרירים')}"
           onclick="event.stopPropagation(); UI.showAnatomyPreview('${pngPath}', '${effectiveTitle.replace(/'/g, "\\'")}')">
        <div class="skeleton-placeholder" style="gap: 2px;">
          <div class="skeleton-spinner" style="width: 16px; height: 16px; border-width: 2px;"></div>
        </div>
        <img src="${pngPath}" 
             class="modal-title-img skeleton-img exercise-header-thumb-img"
             ${fallbackAttr}
             alt="${effectiveTitle}" 
             loading="eager" 
             decoding="async" 
             onload="UI.handleImageLoaded(this)"
             onerror="UI.handleImageFallback(this, 'png')">
      </div>
    `;

    const equips = getEquipments(effectiveTitle);
    const equipsHTML = (equips && equips.length > 0)
      ? `<div class="exercise-header-equipments">` +
          equips.map(eq => `<span class="exercise-header-equip-tag">${eq.icon} ${eq.label}</span>`).join('') +
        `</div>`
      : '';

    const modalTitleHTML = `
      <div class="exercise-header-row">
        ${headerBoxHTML}
        <div class="exercise-header-details">
          <span class="exercise-header-title" title="${effectiveTitle}">${effectiveTitle}</span>
          ${equipsHTML}
        </div>
      </div>
    `;

    let mediaHTML = '';

    if (lowerTitle.includes('deep mobility')) {
      const subExercises = DEEP_MOBILITY_SUB_EXERCISES || [];
      mediaHTML = `
        <div style="background: var(--bg-card); border: 1px solid var(--border-light); border-radius: 14px; padding: 14px; display: flex; flex-direction: column; gap: 12px;">
          <div style="font-weight: 800; font-size: 14px; color: var(--text-primary); display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 6px;">
            <span style="display: flex; align-items: center; gap: 6px;"><span style="color: var(--success, #10b981);">🧘</span> <span>${I18n.t('deep_mobility_title')} (${subExercises.length} ${I18n.t('unit_exercises', 'תרגילים')})</span></span>
            <span style="font-size: 11px; background: var(--bg-elevated); color: var(--text-secondary); padding: 2px 8px; border-radius: 6px; border: 1px solid var(--border-color);">${I18n.t('full_protocol_badge', 'פרוטוקול מלא')}</span>
          </div>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(135px, 1fr)); gap: 10px;">
            ${subExercises.map((sub, idx) => {
        const subTitle = I18n.t(sub.nameKey);
        const subTarget = I18n.t(sub.targetKey);
        const subGifUrl = getGifUrl(sub.gif);
        return `
                <div style="background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: 10px; overflow: hidden; padding: 8px; display: flex; flex-direction: column; align-items: center; text-align: center; gap: 6px; cursor: pointer; transition: transform 0.2s ease, border-color 0.2s ease;"
                     onclick="UI.showImageModal('${subTitle.replace(/'/g, "\\'")}', '${subGifUrl}', 'Deep Mobility Protocol')"
                     onmouseover="this.style.borderColor='var(--success)'; this.style.transform='translateY(-2px)';"
                     onmouseout="this.style.borderColor='var(--border-color)'; this.style.transform='none';">
                  <div style="width: 100%; height: 95px; border-radius: 8px; overflow: hidden; background: #ffffff; display: flex; align-items: center; justify-content: center; position: relative;">
                    <img src="${subGifUrl}" style="width: 100%; height: 100%; object-fit: contain; mix-blend-mode: multiply;" alt="${subTitle}" loading="lazy">
                    <span style="position: absolute; top: 4px; right: 4px; font-size: 10px; font-weight: 800; background: rgba(0,0,0,0.75); color: #34d399; padding: 1px 5px; border-radius: 4px;">#${idx + 1}</span>
                  </div>
                  <div style="font-size: 12px; font-weight: 700; color: var(--text-primary); line-height: 1.2; word-break: break-word;">${subTitle}</div>
                  <span style="font-size: 10px; background: var(--bg-elevated); border: 1px solid var(--border-light); color: var(--text-secondary); padding: 1px 5px; border-radius: 4px; font-weight: 600;">🎯 ${subTarget}</span>
                </div>
              `;
      }).join('')}
          </div>
          <button type="button" class="btn-primary" style="padding: 10px; font-size: 13px; font-weight: 800; background: linear-gradient(135deg, #10b981, #059669); margin-top: 4px;" onclick="UI.hideModal(); if (window.TodayPage && TodayPage.openDeepMobilityModal) TodayPage.openDeepMobilityModal(0);">
            ${I18n.t('deep_mobility_open_runner', '🧘 הפעל מדריך מוביליות אינטראקטיבי')}
          </button>
        </div>
      `;
    } else if (lowerTitle.includes('micro mobility') || lowerTitle.includes('מיקרו-מוביליות')) {
      const subExercises = getMicroMobilitySubExercises(title);
      const isVariantA = subExercises === MICRO_MOBILITY_A_SUB_EXERCISES;
      const variantTitle = isVariantA ? I18n.t('micro_mobility_a_title') : I18n.t('micro_mobility_b_title');
      mediaHTML = `
        <div style="background: var(--bg-card); border: 1px solid var(--border-light); border-radius: 14px; padding: 14px; display: flex; flex-direction: column; gap: 12px;">
          <div style="font-weight: 800; font-size: 14px; color: var(--text-primary); display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 6px;">
            <span style="display: flex; align-items: center; gap: 6px;"><span style="color: var(--accent-volt, #d4ff00);">⚡</span> <span>${variantTitle} (${subExercises.length} ${I18n.t('unit_exercises', 'תרגילים')})</span></span>
            <span style="font-size: 11px; background: var(--bg-elevated); color: var(--text-secondary); padding: 2px 8px; border-radius: 6px; border: 1px solid var(--border-color);">${I18n.t('fast_protocol_badge', 'פרוטוקול מהיר')}</span>
          </div>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(135px, 1fr)); gap: 10px;">
            ${subExercises.map((sub, idx) => {
        const subTitle = I18n.t(sub.nameKey);
        const subTarget = I18n.t(sub.targetKey);
        const subGifUrl = getGifUrl(sub.gif);
        return `
                <div style="background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: 10px; overflow: hidden; padding: 8px; display: flex; flex-direction: column; align-items: center; text-align: center; gap: 6px; cursor: pointer; transition: transform 0.2s ease, border-color 0.2s ease;"
                     onclick="UI.showImageModal('${subTitle.replace(/'/g, "\\'")}', '${subGifUrl}', '${variantTitle.replace(/'/g, "\\'")}')"
                     onmouseover="this.style.borderColor='var(--accent-primary)'; this.style.transform='translateY(-2px)';"
                     onmouseout="this.style.borderColor='var(--border-color)'; this.style.transform='none';">
                  <div style="width: 100%; height: 95px; border-radius: 8px; overflow: hidden; background: #ffffff; display: flex; align-items: center; justify-content: center; position: relative;">
                    <img src="${subGifUrl}" style="width: 100%; height: 100%; object-fit: contain; mix-blend-mode: multiply;" alt="${subTitle}" loading="lazy">
                    <span style="position: absolute; top: 4px; right: 4px; font-size: 10px; font-weight: 800; background: rgba(0,0,0,0.75); color: #fff; padding: 1px 5px; border-radius: 4px;">#${idx + 1}</span>
                  </div>
                  <div style="font-size: 12px; font-weight: 700; color: var(--text-primary); line-height: 1.2; word-break: break-word;">${subTitle}</div>
                  <span style="font-size: 10px; background: var(--bg-elevated); border: 1px solid var(--border-light); color: var(--text-secondary); padding: 1px 5px; border-radius: 4px; font-weight: 600;">🎯 ${subTarget}</span>
                </div>
              `;
      }).join('')}
          </div>
          <button type="button" class="btn-primary" style="padding: 10px; font-size: 13px; font-weight: 800; background: linear-gradient(135deg, #3b82f6, #1d4ed8); margin-top: 4px;" onclick="UI.hideModal(); if (window.TodayPage && TodayPage.openMicroMobilityModal) TodayPage.openMicroMobilityModal(0);">
            ${I18n.t('micro_mobility_open_runner')}
          </button>
        </div>
      `;
    } else if (gifExists) {
      let stageHeaderHTML = '';
      const resolvedStageName = planEx?.currentStageName || 
        (window.TodayPage && typeof window.TodayPage.resolveExerciseStage === 'function' ? window.TodayPage.resolveExerciseStage(planEx, null) : null) ||
        (window.ExercisesPage?.EXERCISE_WEIGHT_PROGRESSION?.[effectiveTitle]?.[0]?.weight);

      if (resolvedStageName) {
        const isAngle = resolvedStageName.toLowerCase().startsWith('angle') || resolvedStageName.includes('°') || resolvedStageName.includes('זווית') || resolvedStageName.includes('زاوية') || (effectiveTitle || '').toLowerCase().includes('trx');
        const isIncline = resolvedStageName.toLowerCase().includes('incline');
        const stageLabel = (typeof I18n !== 'undefined' && I18n.t(resolvedStageName) !== resolvedStageName) ? I18n.t(resolvedStageName) : resolvedStageName;
        const icon = isAngle ? '📐' : (isIncline ? '📈' : '🎯');
        const tagText = isAngle ? (I18n.t('angle_tag') || 'זווית') : (isIncline ? (I18n.t('incline_tag') || 'שיפוע') : (I18n.t('stage_tag') || 'שלב'));
        const badgeLabel = isAngle ? 'TRX Progression' : (isIncline ? (I18n.t('incline_tag') || 'שיפוע') : (I18n.t('stage_tag') || 'שלב'));
        const cleanAngleLabel = isAngle ? stageLabel.replace(/^(?:זווית|Angle|زاوية)\s*/i, '') : stageLabel;
        const angleSvg = isAngle ? getTrxAngleSvg(resolvedStageName, { width: 42, height: 26 }) : '';
        stageHeaderHTML = `
          <div class="gif-modal-stage-header" style="display: flex; align-items: center; justify-content: space-between; background: rgba(59, 130, 246, 0.12); border: 1px solid rgba(59, 130, 246, 0.35); padding: 6px 12px; border-radius: 10px; margin-bottom: 8px; gap: 8px;">
            <div style="display: flex; align-items: center; gap: 8px; font-weight: 800; font-size: 13px; color: var(--text-primary); min-width: 0;">
              <span style="font-size: 16px;">${icon}</span>
              ${angleSvg ? `<div class="trx-angle-badge-icon" style="background: rgba(15, 23, 42, 0.55); border: 1px solid rgba(59, 130, 246, 0.35); border-radius: 6px; padding: 1px 3px; display: inline-flex; align-items: center;" title="${stageLabel}">${angleSvg}</div>` : ''}
              <span>${tagText}: <b style="color: var(--accent-primary);"><bdi dir="ltr">${cleanAngleLabel}</bdi></b></span>
            </div>
            <span style="font-size: 11px; background: rgba(59, 130, 246, 0.2); border: 1px solid rgba(59, 130, 246, 0.4); color: var(--accent-primary); padding: 2px 7px; border-radius: 6px; font-weight: 700; white-space: nowrap;">
              ${badgeLabel}
            </span>
          </div>
        `;
      }

      mediaHTML = `
        ${stageHeaderHTML}
        <div class="gif-container skeleton-loading" style="position: relative; width: 100%; min-height: 180px; max-height: clamp(190px, 28vh, 230px); background: rgba(0, 0, 0, 0.25); border-radius: 12px; overflow: hidden; display: flex; align-items: center; justify-content: center; border: 1px solid var(--border-color); padding: 4px; box-shadow: inset 0 0 16px rgba(0,0,0,0.15);">
          <div class="skeleton-placeholder">
            <div class="skeleton-spinner"></div>
            <span class="skeleton-text">🎬 ${I18n.t('loading_gif')}</span>
          </div>
          <img src="${gifPath}" 
               class="skeleton-img"
               ${fallbackAttr}
               style="width: 100%; height: 100%; border-radius: 8px; object-fit: contain; max-height: clamp(180px, 28vh, 220px); display: block; margin: 0 auto;" 
               alt="${effectiveTitle} GIF" 
               loading="eager" 
               decoding="async" 
               onload="UI.handleImageLoaded(this)"
               onerror="UI.handleImageFallback(this, 'gif')">
        </div>
      `;
    } else {
      let stageHeaderHTML = '';
      const resolvedStageName = planEx?.currentStageName || 
        (window.TodayPage && typeof window.TodayPage.resolveExerciseStage === 'function' ? window.TodayPage.resolveExerciseStage(planEx, null) : null) ||
        (window.ExercisesPage?.EXERCISE_WEIGHT_PROGRESSION?.[effectiveTitle]?.[0]?.weight);

      if (resolvedStageName) {
        const isAngle = resolvedStageName.toLowerCase().startsWith('angle') || resolvedStageName.includes('°') || resolvedStageName.includes('זווית') || resolvedStageName.includes('زاوية') || (effectiveTitle || '').toLowerCase().includes('trx');
        const isIncline = resolvedStageName.toLowerCase().includes('incline');
        const stageLabel = (typeof I18n !== 'undefined' && I18n.t(resolvedStageName) !== resolvedStageName) ? I18n.t(resolvedStageName) : resolvedStageName;
        const icon = isAngle ? '📐' : (isIncline ? '📈' : '🎯');
        const tagText = isAngle ? (I18n.t('angle_tag') || 'זווית') : (isIncline ? (I18n.t('incline_tag') || 'שיפוע') : (I18n.t('stage_tag') || 'שלב'));
        const badgeLabel = isAngle ? 'TRX Progression' : (isIncline ? (I18n.t('incline_tag') || 'שיפוע') : (I18n.t('stage_tag') || 'שלב'));
        const cleanAngleLabel = isAngle ? stageLabel.replace(/^(?:זווית|Angle|زاوية)\s*/i, '') : stageLabel;
        const angleSvg = isAngle ? getTrxAngleSvg(resolvedStageName, { width: 42, height: 26 }) : '';
        stageHeaderHTML = `
          <div class="gif-modal-stage-header" style="display: flex; align-items: center; justify-content: space-between; background: rgba(59, 130, 246, 0.12); border: 1px solid rgba(59, 130, 246, 0.35); padding: 6px 12px; border-radius: 10px; margin-bottom: 8px; gap: 8px;">
            <div style="display: flex; align-items: center; gap: 8px; font-weight: 800; font-size: 13px; color: var(--text-primary); min-width: 0;">
              <span style="font-size: 16px;">${icon}</span>
              ${angleSvg ? `<div class="trx-angle-badge-icon" style="background: rgba(15, 23, 42, 0.55); border: 1px solid rgba(59, 130, 246, 0.35); border-radius: 6px; padding: 1px 3px; display: inline-flex; align-items: center;" title="${stageLabel}">${angleSvg}</div>` : ''}
              <span>${tagText}: <b style="color: var(--accent-primary);"><bdi dir="ltr">${cleanAngleLabel}</bdi></b></span>
            </div>
            <span style="font-size: 11px; background: rgba(59, 130, 246, 0.2); border: 1px solid rgba(59, 130, 246, 0.4); color: var(--accent-primary); padding: 2px 7px; border-radius: 6px; font-weight: 700; white-space: nowrap;">
              ${badgeLabel}
            </span>
          </div>
        `;
      }

      mediaHTML = `
        ${stageHeaderHTML}
        <div class="skeleton-loading" style="position: relative; width: 100%; min-height: 180px; max-height: clamp(190px, 28vh, 230px); border-radius: 12px; overflow: hidden; background: rgba(0, 0, 0, 0.25); border: 1px solid var(--border-color); padding: 4px; display: flex; align-items: center; justify-content: center;">
          <div class="skeleton-placeholder">
            <div class="skeleton-spinner"></div>
          </div>
          <img src="${pngPath}" 
               class="skeleton-img"
               ${fallbackAttr}
               style="width: 100%; height: 100%; border-radius: 8px; object-fit: contain; max-height: clamp(180px, 28vh, 220px); display: block; margin: 0 auto;" 
               alt="${effectiveTitle}" 
               loading="eager" 
               decoding="async" 
               onload="UI.handleImageLoaded(this)"
               onerror="UI.handleImageFallback(this, 'png')">
        </div>
      `;
    }

    let biomechanicalHTML = '';
    if (typeof InjuryEngine !== 'undefined') {
      const baseAd = InjuryEngine.EXERCISE_ADAPTATIONS[effectiveTitle] || 
        (fallbackTitle ? InjuryEngine.EXERCISE_ADAPTATIONS[fallbackTitle] : null) ||
        Object.entries(InjuryEngine.EXERCISE_ADAPTATIONS).find(([k]) => effectiveTitle.toLowerCase().includes(k.toLowerCase()) || k.toLowerCase().includes(effectiveTitle.toLowerCase()))?.[1];

      if (baseAd) {
        const activeAd = InjuryEngine.getExerciseAdaptation(effectiveTitle) || (fallbackTitle ? InjuryEngine.getExerciseAdaptation(fallbackTitle) : null);
        const jDefs = baseAd.joints || [];
        const jointStatusChips = jDefs.map(jId => {
          const jDef = InjuryEngine.JOINTS[jId] || { labelKey: jId };
          const jName = I18n.t(jDef.labelKey) || jId;
          const state = InjuryEngine.getJointState(jId);
          let stateColor = '#10b981';
          let stateBg = 'rgba(16, 185, 129, 0.15)';
          let stateIcon = '🟢';
          let stateText = I18n.t('injury_state_normal');
          if (state === 1) {
            stateColor = '#f59e0b';
            stateBg = 'rgba(245, 158, 11, 0.15)';
            stateIcon = '🟡';
            stateText = I18n.t('injury_state_sensitive');
          } else if (state === 2) {
            stateColor = '#ef4444';
            stateBg = 'rgba(239, 68, 68, 0.15)';
            stateIcon = '🔴';
            stateText = I18n.t('injury_state_injured');
          }
          return `<span style="font-size: 11px; font-weight: 700; color: ${stateColor}; background: ${stateBg}; border: 1px solid ${stateColor}40; padding: 2px 7px; border-radius: 6px; display: inline-flex; align-items: center; gap: 4px;">${stateIcon} ${jName}: ${stateText}</span>`;
        }).join(' ');

        const sensitiveKey = baseAd.sensitive?.cueKey || baseAd.sensitive_note_key;
        const sensitiveText = sensitiveKey ? I18n.t(sensitiveKey) : '';
        const injuredKey = baseAd.injured?.cueKey || baseAd.injured_note_key;
        const injuredText = injuredKey ? I18n.t(injuredKey) : '';
        const substituteRaw = (activeAd && activeAd.substituteName) || baseAd.injured?.substitute || baseAd.injured_substitute;
        const substituteText = substituteRaw ? (I18n.t(substituteRaw) || substituteRaw) : '';

        let activeAlertBox = '';
        if (activeAd) {
          if (activeAd.type === 'injured') {
            activeAlertBox = `
              <div style="background: rgba(239, 68, 68, 0.15); border: 1px solid rgba(239, 68, 68, 0.4); border-radius: 8px; padding: 8px 10px; margin-bottom: 6px; font-size: 12px; color: #fca5a5; font-weight: 700; display: flex; align-items: center; gap: 6px;">
                <span>🚨</span> <span>${I18n.t('today_adapted_banner_title')}: <b>${I18n.t('injury_badge_swapped')} ⟵ ${substituteText}</b></span>
              </div>
            `;
          } else if (activeAd.type === 'sensitive') {
            activeAlertBox = `
              <div style="background: rgba(245, 158, 11, 0.15); border: 1px solid rgba(245, 158, 11, 0.4); border-radius: 8px; padding: 8px 10px; margin-bottom: 6px; font-size: 12px; color: #fde047; font-weight: 700; display: flex; align-items: center; gap: 6px;">
                <span>${I18n.t('today_adapted_banner_title')}: <b>${I18n.t('injury_badge_rom_shield')}</b></span>
              </div>
            `;
          }
        }

        biomechanicalHTML = `
          <div style="background: var(--bg-card); padding: 12px; border-radius: 12px; border: 1px solid var(--border-light); display: flex; flex-direction: column; gap: 8px;">
            <div style="display: flex; align-items: center; gap: 6px;">
              <div style="font-size: 13px; font-weight: 800; color: #10b981; display: flex; align-items: center; gap: 6px;">
                <span>🛡️</span> <span>${I18n.t('injury_section_title')}</span>
              </div>
            </div>
            ${activeAlertBox}
            <div style="display: flex; flex-wrap: wrap; gap: 6px; margin: 2px 0;">
              ${jointStatusChips}
            </div>
            <div style="font-size: 11px; line-height: 1.4; background: var(--bg-elevated); border: 1px solid var(--border-color); border-radius: 8px; padding: 8px 10px; display: flex; flex-direction: column; gap: 6px;">
              ${sensitiveText ? `
              <div>
                <b style="color: #f59e0b;">🟡 ${I18n.t('injury_sensitive_protocol')}:</b>
                <span style="color: var(--text-secondary); margin-inline-start: 4px;">${sensitiveText}</span>
              </div>` : ''}
              ${injuredText ? `
              <div>
                <b style="color: #ef4444;">🔴 ${I18n.t('injury_injured_protocol')}:</b>
                <span style="color: var(--text-secondary); margin-inline-start: 4px;">${injuredText}</span>
              </div>` : ''}
            </div>
          </div>
        `;
      }
    }

    showModal(modalTitleHTML, `
      <div style="display: flex; flex-direction: column; gap: 10px; width: 100%;">
        ${mediaHTML}
        ${metadataHTML}
        ${biomechanicalHTML}
        ${extraNote}
      </div>
    `);
  }

  function showAnatomyPreview(pngPath, title) {
    if (!pngPath) return;
    const muscleMapText = (typeof I18n !== 'undefined' && I18n.t) ? I18n.t('anatomy_muscle_map') : 'מפת שרירים';
    const backBtnText = (typeof I18n !== 'undefined' && I18n.t) ? (I18n.t('back_to_exercise') || 'חזור לתרגיל') : 'חזור לתרגיל';
    const modalTitle = `
      <div style="display: flex; align-items: center; gap: 8px; width: 100%; min-width: 0;">
        <button type="button" class="btn-secondary" onclick="UI.hideModal()" 
                style="background: var(--bg-elevated); border: 1px solid var(--border-light); border-radius: 8px; padding: 4px 10px; font-size: 12px; font-weight: 800; color: var(--text-primary); cursor: pointer; display: inline-flex; align-items: center; gap: 5px; flex-shrink: 0; transition: all 0.2s; box-shadow: 0 2px 6px rgba(0,0,0,0.2);"
                onmouseover="this.style.borderColor='var(--accent-primary)'; this.style.transform='translateY(-1px)';"
                onmouseout="this.style.borderColor='var(--border-light)'; this.style.transform='none';"
                title="${backBtnText}">
          <span style="font-size: 14px;">↩️</span>
          <span>${backBtnText}</span>
        </button>
        <span style="font-size: 15px; font-weight: 800; color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${title}</span>
        <span style="font-size: 11.5px; font-weight: 700; color: var(--accent-primary, #3b82f6); white-space: nowrap;">(${muscleMapText})</span>
      </div>
    `;
    const modalBody = `
      <div style="display: flex; flex-direction: column; gap: 12px; width: 100%;">
        <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 14px; background: #ffffff; border-radius: 14px; border: 1px solid var(--border-color); box-shadow: 0 4px 16px rgba(0,0,0,0.25);">
          <img src="${pngPath}" style="width: 100%; max-height: 55vh; object-fit: contain; mix-blend-mode: multiply; border-radius: 8px;" alt="${title} Anatomy" loading="eager">
        </div>
        <button type="button" class="btn-primary" onclick="UI.hideModal()" 
                style="width: 100%; padding: 11px 16px; font-size: 14px; font-weight: 800; display: flex; align-items: center; justify-content: center; gap: 8px; background: linear-gradient(135deg, #3b82f6, #1d4ed8); border: none; border-radius: 10px; cursor: pointer; color: #ffffff; box-shadow: 0 4px 14px rgba(37, 99, 235, 0.3); transition: transform 0.15s ease;"
                onmouseover="this.style.transform='translateY(-1px)';"
                onmouseout="this.style.transform='none';">
          <span style="font-size: 16px;">↩️</span>
          <span>${backBtnText}</span>
        </button>
      </div>
    `;
    showModal(modalTitle, modalBody);
  }


  /**
   * Get day type display info
   */
  function getDayTypeInfo(type) {
    if (!type) return { label: '', class: '', icon: '📋', isDeload: false };

    const isDeload = type.toLowerCase().includes('deload');

    const keyMap = {
      'Legs + Core': 'day_type_legs_core',
      'Push + Skill': 'day_type_push_skill',
      'Pull + Grip': 'day_type_pull_grip',
      'Zone 2 Cardio': 'day_type_zone2',
      'Active Recovery': 'day_type_active_recovery',
      'VO2 Max': 'day_type_vo2_max',
      'Rest': 'day_type_rest',
      'Legs + Push (Strength A)': 'day_type_strength_a',
      'Pull + Skill (Strength B)': 'day_type_strength_b',
      'Lower Strength': 'day_type_lower_strength',
      'Upper Push': 'day_type_upper_push',
      'Upper Pull + Skill': 'day_type_upper_pull'
    };

    const classMap = {
      'Legs + Core': { class: 'strength', icon: '🦵' },
      'Push + Skill': { class: 'strength', icon: '💥' },
      'Pull + Grip': { class: 'strength', icon: '🧲' },
      'Zone 2 Cardio': { class: 'walk', icon: '🫀' },
      'Active Recovery': { class: 'recovery', icon: '🌿' },
      'VO2 Max': { class: 'vo2', icon: '🔴' },
      'Rest': { class: 'rest', icon: '😴' },
      'Legs + Push (Strength A)': { class: 'strength', icon: '🦵' },
      'Pull + Skill (Strength B)': { class: 'strength', icon: '🧲' },
      'Lower Strength': { class: 'strength', icon: '🦵' },
      'Upper Push': { class: 'strength', icon: '💥' },
      'Upper Pull + Skill': { class: 'strength', icon: '🧲' }
    };

    const cleanType = type.replace(/\s*\([^)]*deload[^)]*\)/gi, '').trim();
    const meta = classMap[cleanType] || { class: 'strength', icon: '📋' };
    const i18nKey = keyMap[cleanType];
    let label = (i18nKey && typeof I18n !== 'undefined' && I18n.t)
      ? I18n.t(i18nKey)
      : (cleanType || type);

    if (isDeload) {
      const deloadPrefix = (typeof I18n !== 'undefined' && I18n.t) ? I18n.t('deload_prefix') : '🌿 ';
      return {
        label: `${label} (Deload)`,
        class: `${meta.class} deload`.trim(),
        icon: meta.icon || '🌿',
        isDeload: true
      };
    }

    return {
      label: label || type,
      class: meta.class,
      icon: meta.icon,
      isDeload: false
    };
  }

  /**
   * Get category color
   */
  function getCategoryColor(slot) {
    const colors = {
      'W0': '#f59e0b', 'W1': '#f59e0b', 'W2': '#f59e0b', 'W3': '#f59e0b', 'W4': '#f59e0b', 'W5': '#f59e0b',
      'A1': '#f97316', 'A2': '#f59e0b', 'A3': '#eab308', 'A4': '#84cc16', 'A5': '#22c55e', 'A6': '#10b981', 'A7': '#06b6d4', 'A8': '#3b82f6',
      'B1': '#10b981', 'B2': '#06b6d4', 'B3': '#14b8a6', 'B4': '#0d9488',
      'C1': '#3b82f6', 'C2': '#8b5cf6', 'C3': '#a78bfa',
      'D1': '#ec4899', 'D2': '#f43f5e', 'D3': '#fb7185', 'D4': '#f472b6',
      'E1': '#6366f1', 'E2': '#818cf8',
      'F1': '#a855f7',
      'extra': '#6b7280'
    };
    return colors[slot] || '#6b7280';
  }

  /**
   * Get category label
   */
  function getCategoryLabel(slot) {
    const labels = {
      'W0': '🔥 Warmup', 'W1': '🔥 Warmup', 'W2': '🔥 Warmup', 'W3': '🔥 Warmup', 'W4': '🔥 Warmup', 'W5': '🔥 Warmup',
      'A1': 'A1', 'A2': 'A2', 'A3': 'A3', 'A4': 'A4', 'A5': 'A5', 'A6': 'A6', 'A7': 'A7', 'A8': 'A8',
      'B1': 'B1', 'B2': 'B2', 'B3': 'B3', 'B4': 'B4',
      'C1': 'C1', 'C2': 'C2', 'C3': 'C3',
      'D1': 'D1', 'D2': 'D2', 'D3': 'D3', 'D4': 'D4',
      'E1': 'E1', 'E2': 'E2',
      'F1': 'F1',
      'extra': 'Extras'
    };
    return labels[slot] || slot;
  }

  /**
   * Parse date string to Date object
   */
  function parseDate(dateStr) {
    if (!dateStr) return null;
    if (dateStr.includes('/')) {
      const [d, m, y] = dateStr.split('/');
      return new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
    }
    return new Date(dateStr);
  }

  /**
   * Format date for display
   */
  function formatDate(dateStr) {
    const date = parseDate(dateStr);
    if (!date || isNaN(date.getTime())) return dateStr;
    return date.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  }

  /**
   * Format short date
   */
  function formatShortDate(dateStr) {
    const date = parseDate(dateStr);
    if (!date || isNaN(date.getTime())) return '';
    return date.toLocaleDateString('en-US', { day: 'numeric', month: 'numeric' });
  }

  /**
   * Get Local Date String (YYYY-MM-DD) avoiding UTC shifts
   * Treats times before 04:00 AM as belonging to the previous day 
   * for consistent late-night logging (meals/workouts).
   */
  function getLocalDateString(d = new Date()) {
    const adjustedDate = new Date(d.getTime());
    if (adjustedDate.getHours() < 4) {
      adjustedDate.setDate(adjustedDate.getDate() - 1);
    }
    const year = adjustedDate.getFullYear();
    const month = String(adjustedDate.getMonth() + 1).padStart(2, '0');
    const day = String(adjustedDate.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  function findTodayIndex(planDays) {
    if (Array.isArray(planDays) && planDays.length > 0) {
      const todayStr = getLocalDateString().split('-').reverse().join('/');
      const match = planDays.findIndex(d => d && d.date === todayStr);
      if (match !== -1) return match;
    }
    return window.appCurrentPlanIndex || 0;
  }

  /**
   * Get localized Day of Week name for a plan day (Sunday = Day 1 in all languages)
   */
  function getDayOfWeekName(day) {
    if (!day) return '';
    const dayNames = (typeof I18n !== 'undefined' && I18n.t)
      ? [I18n.t('sun'), I18n.t('mon'), I18n.t('tue'), I18n.t('wed'), I18n.t('thu'), I18n.t('fri'), I18n.t('sat')]
      : ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    const enDays = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const heDays = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
    const arDays = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

    // 1. Explicit named day of week has highest priority
    const rawDow = (typeof day.dayOfWeek === 'string' && day.dayOfWeek) || (typeof day['Day of Week'] === 'string' && day['Day of Week']);
    if (rawDow) {
      const clean = rawDow.replace(/^(יום|يوم)\s+/i, '').trim();
      const lower = clean.toLowerCase();
      let idx = enDays.indexOf(lower);
      if (idx === -1) idx = heDays.indexOf(clean);
      if (idx === -1) idx = arDays.indexOf(clean);
      if (idx !== -1) return dayNames[idx];
    }

    // 2. Real calendar date
    if (day.date && typeof day.date === 'string') {
      let d = null;
      if (day.date.includes('/')) {
        const parts = day.date.split('/');
        const [dd, mm, yyyy] = parts.map(Number);
        if (yyyy && mm && dd) d = new Date(yyyy, mm - 1, dd);
      } else if (day.date.includes('-')) {
        const parts = day.date.split('-');
        const [yyyy, mm, dd] = parts.map(Number);
        if (yyyy && mm && dd) d = new Date(yyyy, mm - 1, dd);
      }
      if (d && !isNaN(d.getTime())) {
        return dayNames[d.getDay()];
      }
    }

    // 3. Fallback to dayIndex modulo 7 (Sunday = 0 in Sunday-start Israeli microcycle)
    if (typeof day.dayIndex === 'number') {
      const dow = ((day.dayIndex % 7) + 7) % 7;
      return dayNames[dow];
    }

    return rawDow || '';
  }

  /**
   * Parse sets string to get number of sets
   */
  function parseSetsCount(setsStr) {
    if (!setsStr) return 0;
    const match = setsStr.match(/(\d+)\s*[×x]/i);
    return match ? parseInt(match[1]) : 1;
  }

  /**
   * Parse reps from sets string
   */
  function parseReps(setsStr) {
    if (!setsStr) return '';
    const match = setsStr.match(/[×x]\s*(.+)/i);
    return match ? match[1].trim() : setsStr;
  }

  /**
   * Get difficulty class
   */
  function getDifficultyClass(diff) {
    if (!diff) return 'intermediate';
    if (diff.includes('Beginner')) return 'beginner';
    if (diff.includes('Advanced') || diff.includes('Expert')) return 'advanced';
    return 'intermediate';
  }

  /**
   * Get all required equipment for an exercise name (returns array)
   */
  function getEquipments(name) {
    if (!name) return [];
    const n = name.toLowerCase();

    // Professional SVG Icons
    const icons = {
      db: `<svg width="1.2em" height="1.2em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6.5 17.5l11-11"/><path d="M6 6l12 12"/><circle cx="5" cy="5" r="2"/><circle cx="19" cy="19" r="2"/><circle cx="19" cy="5" r="2"/><circle cx="5" cy="19" r="2"/></svg>`,
      trx: `<svg width="1.2em" height="1.2em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v8"/><path d="M7 10l-4 10"/><path d="M17 10l4 10"/><path d="M3 20h4"/><path d="M17 20h4"/></svg>`,
      bars: `<svg width="1.2em" height="1.2em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 6h16"/><path d="M4 18h16"/><path d="M7 6v12"/><path d="M17 6v12"/></svg>`,
      vest: `<svg width="1.2em" height="1.2em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2h12v6l-2 2v10H8V10L6 8V2z"/><path d="M9 2v4"/><path d="M15 2v4"/></svg>`,
      band: `<svg width="1.2em" height="1.2em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="2" width="14" height="20" rx="7" ry="7" transform="rotate(-45 12 12)"/><path d="M12 2v20" opacity="0.3" transform="rotate(-45 12 12)"/></svg>`,
      wall: `<svg width="1.2em" height="1.2em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/><line x1="9" y1="3" x2="9" y2="9"/><line x1="15" y1="9" x2="15" y2="15"/><line x1="9" y1="15" x2="9" y2="21"/></svg>`,
      bench: `<svg width="1.2em" height="1.2em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 10h16v2H4z"/><path d="M6 12v6"/><path d="M18 12v6"/></svg>`,
      bar: `<svg width="1.2em" height="1.2em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 5h20"/><path d="M6 5v14"/><path d="M18 5v14"/></svg>`,
      towel: `<svg width="1.2em" height="1.2em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="4" width="12" height="16" rx="2" ry="2"/><path d="M6 8h12"/><path d="M6 16h12"/></svg>`,
      treadmill: `<svg width="1.2em" height="1.2em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 18h16l-3-12H7L4 18z"/><circle cx="12" cy="18" r="2"/></svg>`,
      bodyweight: `<svg width="1.2em" height="1.2em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="7" r="4"/><path d="M6 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2"/></svg>`
    };

    // v15.7.1: Nordic Curl Progression is bodyweight-only (feet anchored, no external load).
    // The name contains "curl", which would otherwise match the dumbbell heuristic below.
    if (n.includes('nordic')) {
      return [{ label: I18n.t('equip_bodyweight'), icon: icons.bodyweight, key: 'bodyweight' }];
    }

    // Bodyweight Glute Bridge (warmup / early progression) has no dumbbells
    if (n === 'glute bridge' || (n.includes('glute bridge') && !n.includes('db') && !n.includes('dumbbell'))) {
      return [{ label: I18n.t('equip_bodyweight'), icon: icons.bodyweight, key: 'bodyweight' }];
    }

    const results = [];

    // Weighted variants get top priority (integrated from today's local work)
    if (n.includes('weighted')) {
      results.push({ label: I18n.t('equip_weighted'), icon: icons.vest, key: 'weighted' });
    }

    const hasTowel = n.includes('towel');
    const hasBar = n.includes('pull-up') || n.includes('chin-up') || n.includes('dead hang') || n.includes('scapular pull-up') || n.includes('front lever') || (hasTowel && (n.includes('hang') || n.includes('grip')));

    if (hasTowel) {
      results.push({ label: I18n.t('equip_towel'), icon: icons.towel, key: 'towel' });
    }

    if (hasBar || (!hasTowel && n.includes('hang') && !n.includes('dead bug'))) {
      results.push({ label: I18n.t('equip_bar'), icon: icons.bar, key: 'bar' });
    }

    if (results.length > 0) return results;

    if (n.includes('vest')) results.push({ label: I18n.t('equip_vest'), icon: icons.vest, key: 'vest' });
    else if (n.includes('trx')) results.push({ label: I18n.t('equip_trx'), icon: icons.trx, key: 'trx' });
    else if (n.includes('bars') || n.includes('push-up bars') || n.includes('parallettes') || n.includes('l-sit')) results.push({ label: I18n.t('equip_bars'), icon: icons.bars, key: 'bars' });
    else if (n.includes('band') || n.includes('pallof') || n.includes('face pull') || n.includes('woodchop')) results.push({ label: I18n.t('equip_band'), icon: icons.band, key: 'band' });
    else if (n.includes('db') || n.includes('dumbbell') || n.includes('suitcase') || n.includes('rdl') || n.includes('floor press') || n.includes('ohp') || n.includes('curl') || n.includes('row') || n.includes('pistol') || n.includes('goblet') || n.includes('calf raise') || n.includes('lunge') || n.includes('lateral raise') || n.includes('lateral') || n.includes('bridge')) results.push({ label: I18n.t('equip_db'), icon: icons.db, key: 'db' });
    else if (n.includes('wall') || n.includes('handstand')) results.push({ label: I18n.t('equip_wall'), icon: icons.wall, key: 'wall' });
    else if (n.includes('bench dip') || n.includes('step-up') || n.includes('bulgarian') || n.includes('chair') || n.includes('elevated')) results.push({ label: I18n.t('equip_bench'), icon: icons.bench, key: 'bench' });
    else if (n.includes('walking') || n.includes('vo2') || n.includes('zone 2')) results.push({ label: I18n.t('equip_treadmill'), icon: icons.treadmill, key: 'treadmill' });
    else results.push({ label: I18n.t('equip_bodyweight'), icon: icons.bodyweight, key: 'bodyweight' });

    return results;
  }

  function getEquipment(name) {
    const list = getEquipments(name);
    return list.length > 0 ? list[0] : null;
  }

  /**
   * Format tempo string for display (translated)
   */
  function formatTempo(tempo) {
    if (!tempo) return '';

    // Direct keyword matches
    const directMap = {
      'static': 'tempo_static',
      'slow': 'tempo_slow',
      'walk': 'tempo_walk'
    };
    if (directMap[tempo]) return I18n.t(directMap[tempo]);

    // "Xs descent + Ys squeeze" pattern
    const squeezeMatch = tempo.match(/^(\d+)s descent \+ (\d+)s squeeze$/);
    if (squeezeMatch) {
      return I18n.t('tempo_descent_squeeze', '', { d: squeezeMatch[1], s: squeezeMatch[2] });
    }

    // "Xs pause at bottom" pattern
    const pauseBottomMatch = tempo.match(/^(\d+)s pause at bottom$/);
    if (pauseBottomMatch) {
      return I18n.t('tempo_pause_bottom', '', { n: pauseBottomMatch[1] });
    }

    // "Xs descent" pattern
    const descentMatch = tempo.match(/^(\d+)s descent$/);
    if (descentMatch) {
      return I18n.t('tempo_descent', '', { n: descentMatch[1] });
    }

    // "Xs pause" pattern
    const pauseMatch = tempo.match(/^(\d+)s pause$/);
    if (pauseMatch) {
      return I18n.t('tempo_pause', '', { n: pauseMatch[1] });
    }

    // km/h patterns (speed values for cardio)
    const kmhEffortRest = tempo.match(/^([\d.]+) km\/h effort \/ ([\d.]+) km\/h rest$/);
    if (kmhEffortRest) {
      return I18n.t('tempo_kmh_effort_rest', '', { effort: kmhEffortRest[1], rest: kmhEffortRest[2] });
    }

    const kmhMatch = tempo.match(/^([\d.]+) km\/h$/);
    if (kmhMatch) {
      return I18n.t('tempo_kmh', '', { speed: kmhMatch[1] });
    }

    // Fallback: return as-is
    return tempo;
  }

  // Rest Timer Logic
  let timerInterval;
  let timerEndTime;
  let timerOnComplete = null;
  let timerTotalSeconds = 60;

  function updateTimerButtonLabels() {
    const lang = window.I18n ? window.I18n.getLang() : 'en';
    const unit = lang === 'he' ? 'ש' : (lang === 'ar' ? 'ث' : 's');

    const bMinus15 = document.getElementById('timer-minus-15');
    const bPlus30 = document.getElementById('timer-plus-30');
    const bPlus60 = document.getElementById('timer-plus-60');
    if (bMinus15) bMinus15.textContent = `-15${unit}`;
    if (bPlus30) bPlus30.textContent = `+30${unit}`;
    if (bPlus60) bPlus60.textContent = `+60${unit}`;
  }

  function initTimer() {
    const closeBtn = document.getElementById('rest-timer-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        stopTimer();
      });
    }

    const skipBtn = document.getElementById('rest-timer-skip-btn');
    if (skipBtn) {
      skipBtn.addEventListener('click', () => {
        stopTimer();
        if (window.Effects3D && window.Effects3D.playTimerBeep) {
          Effects3D.playTimerBeep();
        } else {
          playTimerSound(true);
        }
        if (navigator.vibrate) navigator.vibrate([150]);
        UI.toast(window.I18n ? I18n.t('timer_skip_ready') : 'Ready for next set! 💪', 'success');
        if (typeof timerOnComplete === 'function') {
          timerOnComplete();
        }
        timerOnComplete = null;
      });
    }

    document.querySelectorAll('.timer-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const seconds = parseInt(e.currentTarget.dataset.time, 10) || 0;
        addTimerSeconds(seconds);
      });
    });

    updateTimerButtonLabels();
  }

  function getTimerRemaining() {
    if (timerEndTime && timerEndTime > Date.now()) {
      return Math.max(0, Math.round((timerEndTime - Date.now()) / 1000));
    }
    return 0;
  }

  function isTimerActive() {
    return !!(timerInterval && timerEndTime && timerEndTime > Date.now());
  }

  function addTimerSeconds(seconds) {
    const remaining = getTimerRemaining();
    const newSeconds = remaining > 0 ? remaining + seconds : seconds;
    if (newSeconds <= 0) {
      stopTimer();
      playTimerSound(true);
      UI.toast(window.I18n ? I18n.t('rest_complete_toast') : 'Rest complete!', 'success');
      if (typeof timerOnComplete === 'function') {
        timerOnComplete();
      }
      timerOnComplete = null;
      return;
    }
    timerTotalSeconds = Math.max(timerTotalSeconds, newSeconds);
    startTimer(newSeconds, timerOnComplete);
  }

  function startTimer(seconds, onComplete = null) {
    const timerContainer = document.getElementById('rest-timer');
    if (timerContainer) timerContainer.classList.remove('hidden');
    clearInterval(timerInterval);

    if (onComplete !== undefined) {
      timerOnComplete = onComplete;
    }

    timerTotalSeconds = Math.max(1, seconds);
    timerEndTime = Date.now() + seconds * 1000;
    updateTimerButtonLabels();
    updateTimerDisplay(seconds);

    timerInterval = setInterval(() => {
      const remaining = Math.round((timerEndTime - Date.now()) / 1000);
      if (remaining <= 0) {
        clearInterval(timerInterval);
        updateTimerDisplay(0);
        playTimerSound(true);
        if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
        UI.toast(I18n.t('rest_complete_toast'), 'success');

        setTimeout(() => {
          if (timerContainer) timerContainer.classList.add('hidden');
          if (typeof timerOnComplete === 'function') {
            timerOnComplete();
          }
          timerOnComplete = null;
        }, 1200);
      } else {
        if (remaining <= 3 && remaining >= 1) {
          playTimerSound(false);
          if (navigator.vibrate) navigator.vibrate(60);
        }
        updateTimerDisplay(remaining);
      }
    }, 1000);
  }

  function updateTimerDisplay(seconds) {
    const mins = Math.floor(Math.max(0, seconds) / 60);
    const secs = Math.max(0, seconds) % 60;
    const timeStr = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    const display = document.getElementById('rest-timer-display');
    if (display) {
      display.textContent = timeStr;
    }
    const progressBar = document.getElementById('rest-timer-progress-bar');
    if (progressBar) {
      const pct = timerTotalSeconds > 0 ? Math.max(0, Math.min(100, (seconds / timerTotalSeconds) * 100)) : 0;
      progressBar.style.width = `${pct}%`;
    }
    // Update live in-modal rest timer display if modal is currently open
    const modalTimerDisplay = document.getElementById('modal-rest-timer-val');
    if (modalTimerDisplay) {
      modalTimerDisplay.textContent = timeStr;
    }
  }

  function playBeepSound(freq = 800, duration = 0.15) {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.4, ctx.currentTime + 0.02);
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + duration);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch (e) {
      // Audio not supported
    }
  }

  function playTimerSound(isFinal = false) {
    if (window.Effects3D && window.Effects3D.playTimerBeep) {
      window.Effects3D.playTimerBeep(isFinal);
    } else {
      playBeepSound(isFinal ? 1000 : 880, isFinal ? 0.4 : 0.08);
    }
    if (isFinal) {
      if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
    } else {
      if (navigator.vibrate) navigator.vibrate(40);
    }
  }

  // Cache of loaded voices
  let cachedVoices = [];
  function loadVoices() {
    if ('speechSynthesis' in window) {
      cachedVoices = window.speechSynthesis.getVoices() || [];
    }
  }

  if ('speechSynthesis' in window) {
    loadVoices();
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }

  /**
   * Find best matching female voice for a given language code ('he', 'ar', 'en')
   */
  function findBestFemaleVoice(langCode) {
    if (!('speechSynthesis' in window)) return null;
    const voices = cachedVoices.length ? cachedVoices : (window.speechSynthesis.getVoices() || []);
    if (!voices || voices.length === 0) return null;

    const targetPrefix = (langCode || 'he').toLowerCase().substring(0, 2);
    const matching = voices.filter(v => v.lang && v.lang.toLowerCase().replace('_', '-').startsWith(targetPrefix));

    if (!matching.length) return null;

    // Female voice indicators & high quality names
    const femaleKeywords = [
      'female', 'woman', 'girl', 'נקבה', 'أنثى',
      'carmit', 'hila', 'עברית',
      'laila', 'mona', 'zariyah', 'salma', 'neda', 'عربي',
      'samantha', 'victoria', 'karen', 'zira', 'aria', 'jenny', 'susan', 'hazel', 'natural', 'google us english', 'google uk english female', 'siri'
    ];

    // Male voice indicators to strictly avoid/penalize
    const maleKeywords = [
      'male', 'man', 'זכר', 'ذكر',
      'maged', 'tarik', 'george', 'david', 'mark', 'guy', 'alex', 'fred', 'richard', 'james', 'daniel', 'stephan', 'michael'
    ];

    let bestVoice = null;
    let highestScore = -9999;

    for (const voice of matching) {
      const vName = (voice.name || '').toLowerCase();
      let score = 0;

      // Penalize male names
      if (maleKeywords.some(m => vName.includes(m))) {
        score -= 1000;
      }

      // Reward female keywords & names
      if (femaleKeywords.some(f => vName.includes(f))) {
        score += 500;
      }

      // Quality bonuses (Google, Neural, Premium, Natural, Enhanced)
      if (vName.includes('google')) score += 200;
      if (vName.includes('neural') || vName.includes('natural') || vName.includes('enhanced') || vName.includes('premium')) score += 150;
      if (voice.default) score += 50;

      if (score > highestScore) {
        highestScore = score;
        bestVoice = voice;
      }
    }

    return bestVoice;
  }

  function speakVoiceCue(customMessage = null) {
    if (!('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const lang = window.I18n ? window.I18n.getLang() : 'he';

      // Vocalized messages (Niqqud for Hebrew, Harakat for Arabic) for 100% crystal-clear pronunciation
      let message = customMessage || 'זְמַן הַמְּנוּחָה הִסְתַּיֵּם! הַסֶּט הַבָּא מַמְתִּין לָךְ, בְּהַצְלָחָה!';
      let speechLang = 'he-IL';

      if (lang === 'en') {
        message = customMessage || 'Rest time is up! Get ready for your next set!';
        speechLang = 'en-US';
      } else if (lang === 'ar') {
        message = customMessage || 'انْتَهَتْ فَتْرَةُ الرَّاحَةِ! الْمَجْمُوعَةُ التَّالِيَةُ جَاهِزَةٌ.';
        speechLang = 'ar-SA';
      }

      const utterance = new SpeechSynthesisUtterance(message);
      utterance.lang = speechLang;

      // Assign the best female voice if available
      const femaleVoice = findBestFemaleVoice(lang);
      if (femaleVoice) {
        utterance.voice = femaleVoice;
      }

      // Expressive female pitch & natural articulation rate
      utterance.pitch = 1.22; // Feminine, warm, energetic inflection
      utterance.rate = 0.92;  // Relaxed pace to prevent rushing or slurred pronunciation
      utterance.volume = 1.0;

      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn('Speech synthesis failed:', e);
    }
  }

  // Modal close handlers
  document.getElementById('modal-close').addEventListener('click', hideModal);
  document.getElementById('modal-overlay').addEventListener('click', (e) => {
    if (e.target === document.getElementById('modal-overlay')) hideModal();
  });

  /**
   * Compress and resize an image File or Data URL to lightweight Base64 string
   */
  function compressImage(fileOrDataUrl, maxDim = 500, quality = 0.65) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        let dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };
      img.onerror = (err) => reject(err);

      if (typeof fileOrDataUrl === 'string') {
        img.src = fileOrDataUrl;
      } else {
        const reader = new FileReader();
        reader.onload = (e) => { img.src = e.target.result; };
        reader.onerror = (err) => reject(err);
        reader.readAsDataURL(fileOrDataUrl);
      }
    });
  }

  function stopTimer() {
    const timerEl = document.getElementById('rest-timer');
    if (timerEl) timerEl.classList.add('hidden');
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
    timerOnComplete = null;
  }

  /**
   * Calculate Estimated 1RM using Epley Formula: 1RM = Weight * (1 + Reps / 30)
   */
  function calculate1RM(weight, reps) {
    const w = parseFloat(weight);
    const r = parseInt(reps, 10);
    if (isNaN(w) || isNaN(r) || w <= 0 || r <= 0) return 0;
    if (r === 1) return Math.round(w * 10) / 10;
    const val = w * (1 + r / 30);
    return Math.round(val * 10) / 10;
  }

  /**
   * Calculate Estimated 1RM using Brzycki Formula: 1RM = Weight * (36 / (37 - Reps))
   */
  function calculateBrzycki1RM(weight, reps) {
    const w = parseFloat(weight);
    const r = parseInt(reps, 10);
    if (isNaN(w) || isNaN(r) || w <= 0 || r <= 0 || r >= 37) return 0;
    const val = w * (36 / (37 - r));
    return Math.round(val * 10) / 10;
  }

  /**
   * Calculate intensity percentage table based on 1RM
   */
  function get1RMPercentages(oneRepMax) {
    const max = parseFloat(oneRepMax) || 0;
    if (max <= 0) return [];
    const table = [
      { pct: 100, reps: 1, label: '100% (1RM)' },
      { pct: 95, reps: 2, label: '95%' },
      { pct: 90, reps: 4, label: '90%' },
      { pct: 85, reps: 6, label: '85%' },
      { pct: 80, reps: 8, label: '80%' },
      { pct: 75, reps: 10, label: '75%' },
      { pct: 70, reps: 12, label: '70%' },
      { pct: 65, reps: 15, label: '65%' }
    ];
    return table.map(item => ({
      ...item,
      weight: Math.round((max * (item.pct / 100)) * 10) / 10
    }));
  }

  /**
   * Show Interactive Estimated 1RM Calculator Modal
   */
  function showOneRepMaxModal(exerciseName = '', initialWeight = 0, initialReps = 0, historicalPeak = null) {
    let w = parseFloat(initialWeight) || (historicalPeak && historicalPeak.weight) || 50;
    let r = parseInt(initialReps, 10) || (historicalPeak && historicalPeak.reps) || 8;
    if (w <= 0) w = 50;
    if (r <= 0) r = 8;

    const modalTitle = `🧮 ${I18n.t('e1rm_title')}${exerciseName ? ` — ${I18n.t(exerciseName) || exerciseName}` : ''}`;

    const renderModalContent = (currW, currR) => {
      const epley = calculate1RM(currW, currR);
      const brzycki = calculateBrzycki1RM(currW, currR);
      const pcts = get1RMPercentages(epley);

      let peakHtml = '';
      if (historicalPeak && historicalPeak.peak1RM > 0) {
        peakHtml = `
          <div class="e1rm-pr-banner">
            <span class="e1rm-pr-banner-icon">🏆</span>
            <div class="e1rm-pr-banner-text">
              <strong>${I18n.t('e1rm_history_peak')}: ${historicalPeak.peak1RM} kg</strong>
              <span>${historicalPeak.details || ''}</span>
            </div>
          </div>
        `;
      }

      const pctsHtml = pcts.map(p => `
        <div class="e1rm-pct-cell">
          <span class="e1rm-pct-header">${p.label}</span>
          <span class="e1rm-pct-kg">${p.weight} kg</span>
          <span class="e1rm-pct-reps">~${p.reps} reps</span>
        </div>
      `).join('');

      return `
        <div class="e1rm-modal-container">
          ${peakHtml}

          <div class="e1rm-hero-card">
            <span class="e1rm-hero-badge">⚡ ${I18n.t('e1rm_estimated')}</span>
            <div class="e1rm-hero-value" id="e1rm-modal-hero-val">${epley}<span>kg</span></div>
            <div class="e1rm-formula-sub" id="e1rm-modal-formula-sub">
              ${I18n.t('e1rm_epley_formula')}: ${currW}kg × (1 + ${currR}/30)
              ${brzycki > 0 ? ` • Brzycki: ${brzycki}kg` : ''}
            </div>
          </div>

          <div class="e1rm-inputs-grid">
            <!-- Weight Input -->
            <div class="e1rm-input-box">
              <label class="e1rm-input-label">
                <span>🏋️ ${I18n.t('e1rm_weight_input')}</span>
              </label>
              <div class="e1rm-stepper-wrap">
                <button type="button" class="e1rm-step-btn" id="e1rm-w-minus">-</button>
                <input type="number" id="e1rm-input-weight" class="e1rm-number-input" value="${currW}" min="1" max="500" step="0.5">
                <button type="button" class="e1rm-step-btn" id="e1rm-w-plus">+</button>
              </div>
              <div class="e1rm-quick-pills">
                <button type="button" class="e1rm-quick-pill" data-w-delta="-5">-5kg</button>
                <button type="button" class="e1rm-quick-pill" data-w-delta="-2.5">-2.5</button>
                <button type="button" class="e1rm-quick-pill" data-w-delta="2.5">+2.5</button>
                <button type="button" class="e1rm-quick-pill" data-w-delta="5">+5kg</button>
              </div>
            </div>

            <!-- Reps Input -->
            <div class="e1rm-input-box">
              <label class="e1rm-input-label">
                <span>🔢 ${I18n.t('e1rm_reps_input')}</span>
              </label>
              <div class="e1rm-stepper-wrap">
                <button type="button" class="e1rm-step-btn" id="e1rm-r-minus">-</button>
                <input type="number" id="e1rm-input-reps" class="e1rm-number-input" value="${currR}" min="1" max="30" step="1">
                <button type="button" class="e1rm-step-btn" id="e1rm-r-plus">+</button>
              </div>
              <div class="e1rm-quick-pills">
                <button type="button" class="e1rm-quick-pill" data-r-set="3">3</button>
                <button type="button" class="e1rm-quick-pill" data-r-set="5">5</button>
                <button type="button" class="e1rm-quick-pill" data-r-set="8">8</button>
                <button type="button" class="e1rm-quick-pill" data-r-set="10">10</button>
                <button type="button" class="e1rm-quick-pill" data-r-set="12">12</button>
              </div>
            </div>
          </div>

          <div class="e1rm-pct-table-card">
            <div class="e1rm-pct-title">
              <span>📊 ${I18n.t('e1rm_percentages_table')}</span>
            </div>
            <div class="e1rm-pct-grid" id="e1rm-modal-pct-grid">
              ${pctsHtml}
            </div>
          </div>
        </div>
      `;
    };

    showModal(modalTitle, renderModalContent(w, r));

    // Bind real-time interactive events
    setTimeout(() => {
      const wInput = document.getElementById('e1rm-input-weight');
      const rInput = document.getElementById('e1rm-input-reps');
      if (!wInput || !rInput) return;

      const updateAll = () => {
        const currentW = parseFloat(wInput.value) || 0;
        const currentR = parseInt(rInput.value, 10) || 0;
        const newEpley = calculate1RM(currentW, currentR);
        const newBrzycki = calculateBrzycki1RM(currentW, currentR);
        const newPcts = get1RMPercentages(newEpley);

        const heroVal = document.getElementById('e1rm-modal-hero-val');
        if (heroVal) heroVal.innerHTML = `${newEpley}<span>kg</span>`;

        const formSub = document.getElementById('e1rm-modal-formula-sub');
        if (formSub) {
          formSub.innerHTML = `${I18n.t('e1rm_epley_formula')}: ${currentW}kg × (1 + ${currentR}/30)${newBrzycki > 0 ? ` • Brzycki: ${newBrzycki}kg` : ''}`;
        }

        const pctGrid = document.getElementById('e1rm-modal-pct-grid');
        if (pctGrid) {
          pctGrid.innerHTML = newPcts.map(p => `
            <div class="e1rm-pct-cell">
              <span class="e1rm-pct-header">${p.label}</span>
              <span class="e1rm-pct-kg">${p.weight} kg</span>
              <span class="e1rm-pct-reps">~${p.reps} reps</span>
            </div>
          `).join('');
        }
      };

      wInput.oninput = updateAll;
      rInput.oninput = updateAll;

      const wMin = document.getElementById('e1rm-w-minus');
      const wPlu = document.getElementById('e1rm-w-plus');
      const rMin = document.getElementById('e1rm-r-minus');
      const rPlu = document.getElementById('e1rm-r-plus');

      if (wMin) wMin.onclick = () => {
        wInput.value = Math.max(1, Math.round((parseFloat(wInput.value || 0) - 1) * 2) / 2);
        updateAll();
      };
      if (wPlu) wPlu.onclick = () => {
        wInput.value = Math.max(1, Math.round((parseFloat(wInput.value || 0) + 1) * 2) / 2);
        updateAll();
      };
      if (rMin) rMin.onclick = () => {
        rInput.value = Math.max(1, parseInt(rInput.value || 1, 10) - 1);
        updateAll();
      };
      if (rPlu) rPlu.onclick = () => {
        rInput.value = Math.min(30, parseInt(rInput.value || 1, 10) + 1);
        updateAll();
      };

      document.querySelectorAll('.e1rm-quick-pill[data-w-delta]').forEach(btn => {
        btn.onclick = () => {
          const delta = parseFloat(btn.dataset.wDelta);
          wInput.value = Math.max(1, Math.round((parseFloat(wInput.value || 0) + delta) * 2) / 2);
          updateAll();
        };
      });

      document.querySelectorAll('.e1rm-quick-pill[data-r-set]').forEach(btn => {
        btn.onclick = () => {
          rInput.value = parseInt(btn.dataset.rSet, 10);
          updateAll();
        };
      });
    }, 50);
  }

  /**
   * Calculate Maximum Heart Rate (HRmax)
   * Prioritizes custom user override if provided, otherwise applies Tanaka formula.
   */
  function calculateHRmax(age, customHRmax = null) {
    const cMax = parseInt(customHRmax, 10);
    if (cMax && cMax >= 100 && cMax <= 240) {
      return cMax;
    }
    const a = parseInt(age, 10) || 30;
    // Tanaka formula: 208 - (0.7 * age)
    return Math.round(208 - (0.7 * a));
  }

  /**
   * Calculate all training heart rate zones for given age or custom HRmax
   */
  function getHRZones(age = 30, customHRmax = null) {
    const a = parseInt(age, 10) || 30;
    const max = calculateHRmax(a, customHRmax);
    const tanaka = Math.round(208 - (0.7 * a));
    const fox = Math.max(100, 220 - a);
    return {
      age: a,
      customHRmax: (customHRmax && parseInt(customHRmax, 10) >= 100) ? parseInt(customHRmax, 10) : null,
      max,
      isCustom: !!(customHRmax && parseInt(customHRmax, 10) >= 100),
      tanaka,
      fox,
      // Target Zones
      zone1: [Math.round(max * 0.50), Math.round(max * 0.60)], // Warmup / Cooldown (50-60%)
      zone2: [Math.round(max * 0.60), Math.round(max * 0.70)], // Zone 2 Base (60-70%)
      zone3: [Math.round(max * 0.70), Math.round(max * 0.80)], // Aerobic Tempo (70-80%)
      zone4: [Math.round(max * 0.80), Math.round(max * 0.90)], // Anaerobic Threshold (80-90%)
      zone5: [Math.round(max * 0.85), Math.round(max * 0.95)]  // Norwegian 4x4 Work (85-95%)
    };
  }

  /**
   * Enrich text containing heart rate percentages with user's personal numerical BPM targets
   */
  function enrichHeartRateText(text) {
    if (!text || typeof text !== 'string') return text || '';
    const userAge = (typeof window !== 'undefined' && window._cachedUserAge) ? window._cachedUserAge : 43;
    const customHRmax = (typeof window !== 'undefined' && window._cachedCustomHRmax) ? window._cachedCustomHRmax : null;
    const hr = (typeof getHRZones === 'function')
      ? getHRZones(userAge, customHRmax)
      : { max: 178, zone1: [89, 107], zone2: [107, 125], zone5: [151, 169] };

    let res = text;
    // Clean any existing BPM annotations to ensure fresh/accurate interpolation without duplication
    res = res.replace(/(?:85|90)%?\s*[-–]\s*95%?(?:\s*(?:דופק\s*מרבי|דופק|HRmax|HR|من أقصى معدل نبض|أقصى نبض|نبض))?\s*\(\d+[-–]\d+\s*BPM\)/gi, (m) => m.replace(/\s*\(\d+[-–]\d+\s*BPM\)/, ''));
    res = res.replace(/60%?\s*[-–]\s*70%?(?:\s*(?:דופק\s*מרבי|דופק|HRmax|HR|من أقصى معدل نبض|أقصى نبض|نبض))?\s*\(\d+[-–]\d+\s*BPM\)/gi, (m) => m.replace(/\s*\(\d+[-–]\d+\s*BPM\)/, ''));
    res = res.replace(/50%?\s*[-–]\s*60%?(?:\s*(?:דופק\s*מרבי|דופק|HRmax|HR|من أقصى معدل نبض|أقصى نبض|نبض))?\s*\(\d+[-–]\d+\s*BPM\)/gi, (m) => m.replace(/\s*\(\d+[-–]\d+\s*BPM\)/, ''));

    res = res.replace(/((?:85|90)%?\s*[-–]\s*95%?(?:\s*(?:דופק\s*מרבי|דופק|HRmax|HR|من أقصى معدل نبض|أقصى نبض|نبض))?)/gi, `$1 (${hr.zone5[0]}-${hr.zone5[1]} BPM)`);
    res = res.replace(/(60%?\s*[-–]\s*70%?(?:\s*(?:דופק\s*מרבי|דופק|HRmax|HR|من أقصى معدل نبض|أقصى نبض|نبض))?)/gi, `$1 (${hr.zone2[0]}-${hr.zone2[1]} BPM)`);
    res = res.replace(/(50%?\s*[-–]\s*60%?(?:\s*(?:דופק\s*מרבי|דופק|HRmax|HR|من أقصى معدل نبض|أقصى نبض|نبض))?)/gi, `$1 (${hr.zone1[0]}-${hr.zone1[1]} BPM)`);

    return res;
  }

  /**
   * Show Interactive Max Heart Rate & Target Zones Calculator Modal
   */
  function showHeartRateModal(initialAge = null, initialCustomHRmax = null) {
    let age = initialAge || window._cachedUserAge || 43;
    let customHRmax = initialCustomHRmax || window._cachedCustomHRmax || null;

    const modalTitle = I18n.t('hr_modal_title');

    const renderContent = (currAge, currCustom) => {
      const z = getHRZones(currAge, currCustom);
      return `
        <div class="hr-modal-container" style="display: flex; flex-direction: column; gap: 14px; text-align: start;">
          
          <!-- Hero Badge -->
          <div style="background: linear-gradient(135deg, rgba(239, 68, 68, 0.15), rgba(59, 130, 246, 0.15)); border: 1px solid rgba(239, 68, 68, 0.35); border-radius: 14px; padding: 16px; text-align: center;">
            <div style="font-size: 11px; text-transform: uppercase; font-weight: 800; color: #f87171; letter-spacing: 1px; margin-bottom: 4px;">
              ${I18n.t('hr_calculated_max')}
            </div>
            <div id="hr-modal-hero-val" style="font-size: 3rem; font-weight: 900; line-height: 1; color: var(--text-primary); margin: 6px 0;">
              ${z.max} <span style="font-size: 1.1rem; color: var(--text-secondary); font-weight: 600;">BPM</span>
            </div>
            <div id="hr-modal-formula-desc" style="font-size: 12px; color: var(--text-secondary);">
              ${z.isCustom ? '🎯 דופק מותאם אישית (משעון דופק / בדיקת מאמץ)' : `📐 נוסחת Tanaka המדעית: 208 - (0.7 × ${z.age}) = ${z.tanaka} BPM • נוסחת Fox: ${z.fox} BPM`}
            </div>
          </div>

          <!-- Inputs -->
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; background: rgba(0,0,0,0.2); border-radius: 12px; padding: 12px; border: 1px solid rgba(255,255,255,0.08);">
            <div>
              <label style="display: block; font-size: 11px; font-weight: 700; color: var(--text-secondary); margin-bottom: 4px;">
                ${I18n.t('hr_age_label')}
              </label>
              <input type="number" id="hr-modal-input-age" min="15" max="100" value="${z.age}"
                style="width: 100%; box-sizing: border-box; padding: 8px 10px; border-radius: 8px; background: var(--bg-input); border: 1px solid var(--border-light); color: var(--text-primary); font-size: 15px; font-weight: 800; text-align: center;"
                dir="ltr">
            </div>
            <div>
              <label style="display: block; font-size: 11px; font-weight: 700; color: var(--text-secondary); margin-bottom: 4px;">
                ${I18n.t('hr_custom_max_label')}
              </label>
              <input type="number" id="hr-modal-input-custom" min="100" max="230" placeholder="אופציונלי" value="${z.customHRmax || ''}"
                style="width: 100%; box-sizing: border-box; padding: 8px 10px; border-radius: 8px; background: var(--bg-input); border: 1px solid var(--border-light); color: var(--text-primary); font-size: 15px; font-weight: 800; text-align: center;"
                dir="ltr">
            </div>
          </div>

          <!-- Training Target Cards -->
          <div style="display: flex; flex-direction: column; gap: 8px;">
            <!-- Zone 2 -->
            <div style="background: rgba(34, 197, 94, 0.08); border: 1px solid rgba(34, 197, 94, 0.3); border-radius: 10px; padding: 10px 12px;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                <span style="font-weight: 800; color: #4ade80; font-size: 13px;">🟢 יום 2 — Zone 2 Aerobic Base (60%–70%)</span>
                <span id="hr-zone2-val" style="font-weight: 900; color: #4ade80; font-size: 14px;">${z.zone2[0]} – ${z.zone2[1]} BPM</span>
              </div>
              <div style="font-size: 11.5px; color: var(--text-secondary); line-height: 1.4;">
                🗣️ <b>מבחן הדיבור:</b> קצב המאפשר דיבור במשפטים שלמים ברצף ללא התנשפות (נשימה מהאף).
              </div>
            </div>

            <!-- Norwegian 4x4 Work -->
            <div style="background: rgba(239, 68, 68, 0.08); border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 10px; padding: 10px 12px;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                <span style="font-weight: 800; color: #f87171; font-size: 13px;">🔴 יום 6 — 4×4 Work Effort (85%–95%)</span>
                <span id="hr-zone5-val" style="font-weight: 900; color: #f87171; font-size: 14px;">${z.zone5[0]} – ${z.zone5[1]} BPM</span>
              </div>
              <div style="font-size: 11.5px; color: var(--text-secondary); line-height: 1.4;">
                ⚡ <b>מאמץ שיא (4 דקות):</b> דיבור מקוטע של מילה-שתיים בלבד, נשימה כבדה, פיתוח צריכת חמצן מרבית (VO2 Max). יש להעלות מהירות לריצה (7.5-10+ קמ״ש) במידת הצורך!
              </div>
            </div>

            <!-- Norwegian 4x4 Rest -->
            <div style="background: rgba(59, 130, 246, 0.08); border: 1px solid rgba(59, 130, 246, 0.3); border-radius: 10px; padding: 10px 12px;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                <span style="font-weight: 800; color: #60a5fa; font-size: 13px;">🔵 יום 6 — 4×4 Active Recovery (60%–70%)</span>
                <span id="hr-zone-rest-val" style="font-weight: 900; color: #60a5fa; font-size: 14px;">${z.zone2[0]} – ${z.zone2[1]} BPM</span>
              </div>
              <div style="font-size: 11.5px; color: var(--text-secondary); line-height: 1.4;">
                🚶 <b>התאוששות פעילה (3 דקות):</b> הליכה מתונה (~4.5 קמ״ש) להורדת הדופק לקראת האינטרוול הבא.
              </div>
            </div>
          </div>

          <!-- Guide / How to know -->
          <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.1); border-radius: 10px; padding: 10px 12px; font-size: 12px; line-height: 1.5; color: var(--text-secondary);">
            <div style="font-weight: 800; color: var(--text-primary); margin-bottom: 6px;">💡 איך יודעים את הדופק המרבי בפועל?</div>
            <ul style="margin: 0; padding-inline-start: 18px; display: flex; flex-direction: column; gap: 4px;">
              <li><b>חישוב אוטומטי (נוסחת Tanaka):</b> המערכת מחשבת לפי גילך באופן מיידי.</li>
              <li><b>שעון דופק / צמיד חכם:</b> הדופק המרבי האמיתי שנרשם בספרינט מלא או בסוף אינטרוול 4 מתוך 4×4. אם ידוע, הזן אותו בשדה "דופק מרבי ידוע".</li>
              <li><b>בדיקת מאמץ במעבדה (ארגומטריה):</b> הבדיקה המדויקת ביותר.</li>
              <li><b>ללא שעון:</b> מבחן הדיבור מספק בקרה אמינה — דיבור רציף = Zone 2; חוסר יכולת לדבר = 85%+!</li>
            </ul>
          </div>

          <!-- Save Button -->
          <button id="hr-modal-save-btn" class="btn-primary" style="padding: 12px; font-size: 15px; font-weight: 800; border-radius: 10px;">
            💾 ${I18n.t('save_preferences', 'שמור הגדרות')}
          </button>
        </div>
      `;
    };

    showModal(modalTitle, renderContent(age, customHRmax));

    setTimeout(() => {
      const aInput = document.getElementById('hr-modal-input-age');
      const cInput = document.getElementById('hr-modal-input-custom');
      const saveBtn = document.getElementById('hr-modal-save-btn');
      if (!aInput || !saveBtn) return;

      const refreshLiveView = () => {
        const curA = parseInt(aInput.value, 10) || 30;
        const curC = cInput.value ? parseInt(cInput.value, 10) : null;
        const newZ = getHRZones(curA, curC);

        const heroVal = document.getElementById('hr-modal-hero-val');
        if (heroVal) heroVal.innerHTML = `${newZ.max} <span style="font-size: 1.1rem; color: var(--text-secondary); font-weight: 600;">BPM</span>`;

        const desc = document.getElementById('hr-modal-formula-desc');
        if (desc) {
          desc.innerHTML = newZ.isCustom ? '🎯 דופק מותאם אישית (משעון דופק / בדיקת מאמץ)' : `📐 נוסחת Tanaka המדעית: 208 - (0.7 × ${newZ.age}) = ${newZ.tanaka} BPM • נוסחת Fox: ${newZ.fox} BPM`;
        }

        const z2Val = document.getElementById('hr-zone2-val');
        if (z2Val) z2Val.textContent = `${newZ.zone2[0]} – ${newZ.zone2[1]} BPM`;

        const z5Val = document.getElementById('hr-zone5-val');
        if (z5Val) z5Val.textContent = `${newZ.zone5[0]} – ${newZ.zone5[1]} BPM`;

        const zRestVal = document.getElementById('hr-zone-rest-val');
        if (zRestVal) zRestVal.textContent = `${newZ.zone2[0]} – ${newZ.zone2[1]} BPM`;
      };

      aInput.oninput = refreshLiveView;
      if (cInput) cInput.oninput = refreshLiveView;

      saveBtn.onclick = async () => {
        const finalAge = parseInt(aInput.value, 10) || 30;
        const finalCustom = cInput.value ? parseInt(cInput.value, 10) : null;

        window._cachedUserAge = finalAge;
        window._cachedCustomHRmax = finalCustom;

        await DB.setSetting('userAge', finalAge);
        await DB.setSetting('customHRmax', finalCustom);

        // Also update settings page inputs if present
        const sAge = document.getElementById('settings-user-age');
        if (sAge) sAge.value = finalAge;
        const sCustom = document.getElementById('settings-custom-hrmax');
        if (sCustom) sCustom.value = finalCustom || '';

        if (typeof CloudSync !== 'undefined' && CloudSync.scheduleSync) {
          CloudSync.scheduleSync();
        }

        toast(I18n.t('hr_saved_toast'), 'success');
        hideModal();

        if (window.TodayPage && window.TodayPage.render) {
          window.TodayPage.render();
        }
      };
    }, 50);
  }

  return {
    toast,
    showModal,
    hideModal,
    confirm,
    showImageModal,
    showAnatomyPreview,
    calculate1RM,
    calculateBrzycki1RM,
    get1RMPercentages,
    showOneRepMaxModal,
    calculateHRmax,
    getHRZones,
    enrichHeartRateText,
    showHeartRateModal,
    hasGif,
    handleImageLoaded,
    __build: 'media-fix-2026-08-26',
    handleImageFallback,
    getDayTypeInfo,
    getCategoryColor,
    getCategoryLabel,
    parseDate,
    formatDate,
    formatShortDate,
    getLocalDateString,
    findTodayIndex,
    getDayOfWeekName,
    parseSetsCount,
    parseReps,
    getDifficultyClass,
    getEquipment,
    getEquipments,
    formatTempo,
    initTimer,
    startTimer,
    stopTimer,
    getTimerRemaining,
    isTimerActive,
    addTimerSeconds,
    hasGif,
    getImageUrl,
    getGifUrl,
    showImageModal,
    safeDecodeURIComponent,
    speakVoiceCue,
    compressImage,
    EXERCISE_GIF_ALIASES,
    EXERCISE_PNG_ALIASES,
    DEEP_MOBILITY_SUB_EXERCISES,
    MICRO_MOBILITY_SUB_EXERCISES,
    MICRO_MOBILITY_A_SUB_EXERCISES,
    MICRO_MOBILITY_B_SUB_EXERCISES,
    getMicroMobilitySubExercises,
    getTrxAngleSvg
  };
})();

window.UI = UI;
