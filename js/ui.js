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
      return;
    }
    const current = modalStack[modalStack.length - 1];
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
    }
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
    'PUSH-UP BARS PROGRESSION': 'Incline Push-Up.gif',
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
    'PIKE PROGRESSION': 'Pike Hold.gif',
    'FEET ELEVATED PIKE HOLD': 'Feet-Elevated Pike Hold.gif',
    'PUSH UP': 'Push-up.gif',
    'INCLINE PUSH UP': 'Incline Push-Up.gif',
    'DEFICIT PUSH UP': 'Deficit Push-Up.gif',
    'FEET ELEVATED PUSH UP': 'Feet-Elevated Push-Up.gif',
    'WEIGHTED DEFICIT PUSH UP': 'Weighted Deficit Push-Up.gif',
    'PUSH UP BARS PROGRESSION': 'Incline Push-Up.gif',
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
    'WALL WALK (PARTIAL)': 'Wall Walk (Partial).gif',
    'TRX FACE PULL': 'TRX Face Pull.gif',
    'TRX FACE PULL (ANGLE 1)': 'TRX Face Pull (Angle 1).gif',
    'TRX FACE PULL (ANGLE 2)': 'TRX Face Pull (Angle 2).gif',
    'TRX FACE PULL (ANGLE 3)': 'TRX Face Pull (Angle 3).gif',
    'ANGLE 1 (GENTLE)': 'TRX Face Pull (Angle 1).gif',
    'ANGLE 2 (MODERATE)': 'TRX Face Pull (Angle 2).gif',
    'ANGLE 3 (STEEP)': 'TRX Face Pull (Angle 3).gif',
    'TRX Y T W': 'TRX Y-T-W.gif',
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
    'FULL PULL UP': 'Chin-up.gif',
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
    'ANGLE 1': 'TRX Face Pull (Angle 1).gif',
    'ANGLE 2': 'TRX Face Pull (Angle 2).gif',
    'ANGLE 2 45': 'TRX Face Pull (Angle 2).gif',
    'ANGLE 3': 'TRX Face Pull (Angle 3).gif',
    'FEET ELEVATED': 'TRX Row.gif',
    'HOLLOW HOLD': 'Hollow Body Hold.gif',
    'INCLINE DIAMOND': 'Diamond Push-Up.gif',
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
    'WORLD\'S GREATEST STRETCH': 'Worlds Greatest Stretch.gif'
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
      if (v === 'A') return MICRO_MOBILITY_A_SUB_EXERCISES;
      if (v === 'B') return MICRO_MOBILITY_B_SUB_EXERCISES;
    }

    let dayNum = 1;
    if (typeof dayIndexOrVariant === 'number') {
      if (dayIndexOrVariant >= 1 && dayIndexOrVariant <= 7) {
        dayNum = dayIndexOrVariant;
      } else {
        dayNum = ((dayIndexOrVariant % 7) + 7) % 7 + 1;
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
    'PIKE PROGRESSION': 'PIKE HOLD.png',
    'FEET ELEVATED PIKE HOLD': 'PIKE HOLD.png',
    'PIKE PUSH UP': 'PIKE PUSH-UP.png',
    'ELEVATED PIKE PUSH UP': 'ELEVATED PIKE PUSH-UP.png',
    'PUSH UP BARS PROGRESSION': 'INCLINE PUSH-UP.png',
    'PUSH UP VOLUME (DAY 5)': 'PUSH-UP.png',
    'PUSH UP VOLUME': 'PUSH-UP.png',
    'PULL UP PROGRESSION': 'PULL-UP NEGATIVE.png',
    'WEIGHTED PULL UP': 'WEIGHTED PULL-UP.png',
    'CHIN UP PROGRESSION': 'CHIN-UP NEGATIVE.png',
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
    'FULL PISTOL SQUAT': 'FULL PISTOL SQUAT.png',
    'REVERSE LUNGE PISTOL SQUAT': 'REVERSE LUNGE + DB.png',
    'DB HIP THRUST': 'DB GLUTE BRIDGE.png',
    'DB GLUTE BRIDGE': 'DB GLUTE BRIDGE.png',
    'BRISK WALKING (ZONE 2)': 'BRISK WALKING.png',
    'ACTIVE RECOVERY WALK': 'RELAXED WALKING.png',
    'ZONE 2 LIGHT WALK': 'BRISK WALKING.png',
    'MICRO MOBILITY PROTOCOL': 'MICRO MOBILITY PROTOCOL.png',
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
    'ANGLE 1': 'TRX FACE PULL (ANGLE 1).png',
    'ANGLE 2': 'TRX FACE PULL (ANGLE 2).png',
    'ANGLE 2 45': 'TRX FACE PULL (ANGLE 2).png',
    'ANGLE 3': 'TRX FACE PULL (ANGLE 3).png',
    'HOLLOW HOLD': 'HOLLOW BODY HOLD.png',
    'INCLINE DIAMOND': 'DIAMOND PUSH-UP.png',
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
    'BAND NECK FLEXION EXTENSION': 'BAND NECK FLEXION & EXTENSION.png'
  };

  function handleImageFallback(imgEl, type) {
    const currentSrc = imgEl.src;
    const urlDecoded = decodeURIComponent(currentSrc);

    if (type === 'gif') {
      const match = urlDecoded.match(/images\/gifs\/([^/]+)$/);
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
          imgEl.src = `images/gifs/${uniqueVariations[trialIndex]}`;
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
      const match = urlDecoded.match(/images\/exercises\/([^/]+)$/);
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
          imgEl.src = `images/exercises/${uniqueVariations[trialIndex]}`;
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
    if (cleanTitle === 'MICRO MOBILITY PROTOCOL' || cleanTitle === 'MICRO MOBILITY') {
      let currentDayIndex = dayIndex;
      if (currentDayIndex === undefined || currentDayIndex === null) {
        if (window.TodayPage && window.TodayPage.currentDayIndex) {
          currentDayIndex = window.TodayPage.currentDayIndex;
        }
      }
      const dayNum = currentDayIndex ? (((currentDayIndex - 1) % 7) + 7) % 7 + 1 : 1;
      const isVariantA = (dayNum === 3 || dayNum === 5);
      return encodeMediaPath(isVariantA ? 'images/exercises/MICRO MOBILITY A.png' : 'images/exercises/MICRO MOBILITY B.png');
    }
    const aliasPng = EXERCISE_PNG_ALIASES[cleanTitle];
    const path = aliasPng ? `images/exercises/${aliasPng}` : `images/exercises/${title.replace(/\//g, '-').toUpperCase()}.png`;
    return encodeMediaPath(path);
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

  function showImageModal(title, src, fallbackTitle) {
    const pngPath = getImageUrl(title);
    const fallbackAttr = fallbackTitle ? `data-fallback-exname="${fallbackTitle.replace(/"/g, '&quot;')}"` : '';

    let gifPath;
    if (src && src.includes('.gif')) {
      gifPath = src;
    } else {
      gifPath = getGifUrl(title);
    }
    const cleanTitle = (title || '').toUpperCase().replace(/[^A-Z0-9]+/g, ' ').trim();
    const gifExists = hasGif(title) || (src && src.includes('.gif')) || !!EXERCISE_GIF_ALIASES[cleanTitle];
    const equip = getEquipment(title);

    let extraNote = '';
    const lowerTitle = title.toLowerCase();
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

    const searchTitle = (title || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    const exData = (window.TRAINING_DATA?.exercises || []).find(e => {
      const eClean = (e.name || '').toLowerCase().replace(/[^a-z0-9]/g, '');
      const idClean = (e.id || '').toLowerCase().replace(/[^a-z0-9]/g, '');
      const hasStageMatch = (e.stages || []).some(s => s.toLowerCase().replace(/[^a-z0-9]/g, '') === searchTitle || searchTitle.includes(s.toLowerCase().replace(/[^a-z0-9]/g, '')));
      return eClean === searchTitle || idClean === searchTitle || hasStageMatch || eClean.includes(searchTitle) || searchTitle.includes(eClean);
    });

    let metadataHTML = '';
    if (exData) {
      const secLabel = I18n.t('unit_seconds', 'שניות');
      const repsLabel = I18n.t('unit_reps', 'חזרות');
      const kgLabel = I18n.t('unit_kg', 'ק״ג');
      const perSideLabel = I18n.t('per_side', 'לכל צד');
      const minLbl = I18n.t('min_label', 'מינ׳');
      const maxLbl = I18n.t('max_label', 'מקס׳');

      const restText = exData.restRange ? `${exData.restRange[0]}-${exData.restRange[1]} ${secLabel}` : (exData.restSeconds ? `${exData.restSeconds} ${secLabel}` : null);
      const repText = (exData.windowMin && exData.windowMax) ? `${exData.windowMin}-${exData.windowMax} ${repsLabel}` : null;
      const weightText = exData.startingWeight != null ? `${exData.startingWeight} ${kgLabel} (${exData.loadType || perSideLabel}) [${minLbl} ${exData.minWeight || 3}${kgLabel} | ${maxLbl} ${exData.maxWeight || 32}${kgLabel}]` : null;

      const ruleKey = 'rule_' + (exData.id || '').replace(/[-_]+/g, '_');
      const ruleText = (I18n.t(ruleKey) !== ruleKey) ? I18n.t(ruleKey) : (exData.rule || '');

      metadataHTML = `
        <div style="background: var(--bg-hover, rgba(255,255,255,0.05)); padding: 12px; border-radius: 12px; border: 1px solid var(--border-light, rgba(255,255,255,0.1)); display: flex; flex-direction: column; gap: 8px;">
          <div style="font-size: 13px; font-weight: 800; color: var(--accent-primary, #3b82f6); display: flex; align-items: center; gap: 6px;">
            <span>📋</span> <span>${I18n.t('zero_decisions_spec', 'מפרט ופרוטוקול ביצוע ("Zero Decisions")')}</span>
          </div>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 8px; font-size: 12px;">
            ${exData.tempo ? `<div style="background: rgba(0,0,0,0.25); padding: 6px 10px; border-radius: 8px;">⏱️ <b>${I18n.t('label_tempo', 'טמפו:')}</b> ${exData.tempo}</div>` : ''}
            ${restText ? `<div style="background: rgba(0,0,0,0.25); padding: 6px 10px; border-radius: 8px;">⏳ <b>${I18n.t('label_rest', 'מנוחה:')}</b> ${restText}</div>` : ''}
            ${repText ? `<div style="background: rgba(0,0,0,0.25); padding: 6px 10px; border-radius: 8px;">🎯 <b>${I18n.t('label_rep_window', 'חלון חזרות:')}</b> ${repText}</div>` : ''}
            ${exData.structure ? `<div style="background: rgba(0,0,0,0.25); padding: 6px 10px; border-radius: 8px;">🏗️ <b>${I18n.t('label_structure', 'מבנה:')}</b> ${exData.structure}</div>` : ''}
            ${weightText ? `<div style="background: rgba(0,0,0,0.25); padding: 6px 10px; border-radius: 8px; grid-column: 1/-1;">⚖️ <b>${I18n.t('label_starting_weight', 'משקל התחלתי:')}</b> ${weightText}</div>` : ''}
          </div>
          ${ruleText ? `
            <div style="margin-top: 4px; padding: 8px 10px; background: rgba(245, 158, 11, 0.12); border-right: 3px solid #f59e0b; border-radius: 6px; font-size: 12px; color: var(--text-primary);">
              <b>⚠️ ${I18n.t('mechanical_stop_rule', 'כלל טכניקה / Mechanical Stop:')}</b> ${ruleText}
            </div>
          ` : ''}
        </div>
      `;
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
              style="width: 130px; height: 130px; min-width: 130px; border-radius: 14px; background: rgba(59, 130, 246, 0.15); border: 1px solid rgba(59, 130, 246, 0.4); display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; cursor: pointer; color: #93c5fd; font-weight: 800; font-size: 13px; transition: all 0.2s ease; box-shadow: 0 4px 14px rgba(0,0,0,0.25); flex-shrink: 0;"
              onclick="UI.showImageModal('${parentTitle.replace(/'/g, "\\'")}')"
              onmouseover="this.style.background='rgba(59, 130, 246, 0.25)'; this.style.transform='translateY(-2px)';"
              onmouseout="this.style.background='rgba(59, 130, 246, 0.15)'; this.style.transform='none';"
              title="${I18n.t('back_to_protocol', 'חזור לפרוטוקול המלא')}">
        <span style="font-size: 24px;">↩️</span>
        <span style="font-size: 12px; font-weight: 800;">${I18n.t('back_btn', 'חזור לפרוטוקול')}</span>
      </button>
    ` : `
      <div class="skeleton-loading" style="width: 140px; height: 140px; min-width: 140px; border-radius: 14px; background: #ffffff; border: 1px solid rgba(255, 255, 255, 0.3); display: flex; align-items: center; justify-content: center; overflow: hidden; padding: 6px; box-shadow: 0 4px 16px rgba(0, 0, 0, 0.25); flex-shrink: 0; position: relative;">
        <div class="skeleton-placeholder" style="gap: 4px;">
          <div class="skeleton-spinner" style="width: 22px; height: 22px; border-width: 2px;"></div>
        </div>
        <img src="${pngPath}" 
             class="modal-title-img skeleton-img"
             ${fallbackAttr}
             style="width: 100%; height: 100%; object-fit: contain; border-radius: 10px; mix-blend-mode: multiply;" 
             alt="${title}" 
             loading="eager" 
             decoding="async" 
             onload="UI.handleImageLoaded(this)"
             onerror="UI.handleImageFallback(this, 'png')">
      </div>
    `;

    const modalTitleHTML = `
      <div style="display: flex; align-items: center; gap: 16px; width: 100%;">
        ${headerBoxHTML}
        <div style="display: flex; flex-direction: column; gap: 6px; justify-content: center;">
          <span style="font-size: 19px; font-weight: 900; color: var(--text-primary); line-height: 1.25;">${title}</span>
          ${(() => {
        const equips = getEquipments(title);
        if (!equips || equips.length === 0) return '';
        return `<div style="display: flex; gap: 6px; flex-wrap: wrap;">` + equips.map(eq => `<span style="font-size: 12px; font-weight: 700; color: var(--text-secondary); display: inline-flex; align-items: center; gap: 6px; background: var(--bg-elevated); padding: 4px 10px; border-radius: 8px; border: 1px solid var(--border-light); width: max-content;">${eq.icon} ${eq.label}</span>`).join('') + `</div>`;
      })()}
        </div>
      </div>
    `;

    let mediaHTML = '';

    if (lowerTitle.includes('deep mobility')) {
      const subExercises = DEEP_MOBILITY_SUB_EXERCISES || [];
      mediaHTML = `
        <div style="background: rgba(16, 185, 129, 0.08); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 14px; padding: 14px; display: flex; flex-direction: column; gap: 12px;">
          <div style="font-weight: 800; font-size: 14px; color: #34d399; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 6px;">
            <span>🧘 ${I18n.t('deep_mobility_title')} (${subExercises.length} תרגילים)</span>
            <span style="font-size: 11px; background: rgba(59, 130, 246, 0.2); color: #60a5fa; padding: 2px 8px; border-radius: 6px; border: 1px solid rgba(59,130,246,0.3);">פרוטוקול מלא</span>
          </div>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(135px, 1fr)); gap: 10px;">
            ${subExercises.map((sub, idx) => {
              const subTitle = I18n.t(sub.nameKey);
              const subTarget = I18n.t(sub.targetKey);
              const subGifUrl = getGifUrl(sub.gif);
              return `
                <div style="background: rgba(0,0,0,0.35); border: 1px solid rgba(255,255,255,0.12); border-radius: 10px; overflow: hidden; padding: 8px; display: flex; flex-direction: column; align-items: center; text-align: center; gap: 6px; cursor: pointer; transition: transform 0.2s ease, border-color 0.2s ease;"
                     onclick="UI.showImageModal('${subTitle.replace(/'/g, "\\'")}', '${subGifUrl}', 'Deep Mobility Protocol')"
                     onmouseover="this.style.borderColor='rgba(52, 211, 153, 0.6)'"
                     onmouseout="this.style.borderColor='rgba(255, 255, 255, 0.12)'">
                  <div style="width: 100%; height: 95px; border-radius: 8px; overflow: hidden; background: #ffffff; display: flex; align-items: center; justify-content: center; position: relative;">
                    <img src="${subGifUrl}" style="width: 100%; height: 100%; object-fit: contain; mix-blend-mode: multiply;" alt="${subTitle}" loading="lazy">
                    <span style="position: absolute; top: 4px; right: 4px; font-size: 10px; font-weight: 800; background: rgba(0,0,0,0.75); color: #34d399; padding: 1px 5px; border-radius: 4px;">#${idx + 1}</span>
                  </div>
                  <div style="font-size: 12px; font-weight: 700; color: var(--text-primary); line-height: 1.2; word-break: break-word;">${subTitle}</div>
                  <span style="font-size: 10px; background: rgba(59, 130, 246, 0.15); border: 1px solid rgba(59, 130, 246, 0.3); color: #93c5fd; padding: 1px 5px; border-radius: 4px; font-weight: 600;">🎯 ${subTarget}</span>
                </div>
              `;
            }).join('')}
          </div>
          <button type="button" class="btn-primary" style="padding: 10px; font-size: 13px; font-weight: 800; background: linear-gradient(135deg, #10b981, #059669); margin-top: 4px;" onclick="UI.hideModal(); if (window.TodayPage && TodayPage.openDeepMobilityModal) TodayPage.openDeepMobilityModal(0);">
            🧘 הפעל מדריך מוביליות אינטראקטיבי
          </button>
        </div>
      `;
    } else if (lowerTitle.includes('micro mobility')) {
      const subExercises = MICRO_MOBILITY_SUB_EXERCISES || [];
      mediaHTML = `
        <div style="background: rgba(59, 130, 246, 0.08); border: 1px solid rgba(59, 130, 246, 0.3); border-radius: 14px; padding: 14px; display: flex; flex-direction: column; gap: 12px;">
          <div style="font-weight: 800; font-size: 14px; color: #60a5fa; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 6px;">
            <span>⚡ ${I18n.t('micro_mobility_title')} (${subExercises.length} תרגילים)</span>
            <span style="font-size: 11px; background: rgba(59, 130, 246, 0.2); color: #93c5fd; padding: 2px 8px; border-radius: 6px; border: 1px solid rgba(59,130,246,0.3);">פרוטוקול מהיר</span>
          </div>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(135px, 1fr)); gap: 10px;">
            ${subExercises.map((sub, idx) => {
              const subTitle = I18n.t(sub.nameKey);
              const subTarget = I18n.t(sub.targetKey);
              const subGifUrl = getGifUrl(sub.gif);
              return `
                <div style="background: rgba(0,0,0,0.35); border: 1px solid rgba(255,255,255,0.12); border-radius: 10px; overflow: hidden; padding: 8px; display: flex; flex-direction: column; align-items: center; text-align: center; gap: 6px; cursor: pointer; transition: transform 0.2s ease, border-color 0.2s ease;"
                     onclick="UI.showImageModal('${subTitle.replace(/'/g, "\\'")}', '${subGifUrl}', 'Micro Mobility Protocol')"
                     onmouseover="this.style.borderColor='rgba(96, 165, 250, 0.6)'"
                     onmouseout="this.style.borderColor='rgba(255, 255, 255, 0.12)'">
                  <div style="width: 100%; height: 95px; border-radius: 8px; overflow: hidden; background: #ffffff; display: flex; align-items: center; justify-content: center; position: relative;">
                    <img src="${subGifUrl}" style="width: 100%; height: 100%; object-fit: contain; mix-blend-mode: multiply;" alt="${subTitle}" loading="lazy">
                    <span style="position: absolute; top: 4px; right: 4px; font-size: 10px; font-weight: 800; background: rgba(0,0,0,0.75); color: #60a5fa; padding: 1px 5px; border-radius: 4px;">#${idx + 1}</span>
                  </div>
                  <div style="font-size: 12px; font-weight: 700; color: var(--text-primary); line-height: 1.2; word-break: break-word;">${subTitle}</div>
                  <span style="font-size: 10px; background: rgba(59, 130, 246, 0.15); border: 1px solid rgba(59, 130, 246, 0.3); color: #93c5fd; padding: 1px 5px; border-radius: 4px; font-weight: 600;">🎯 ${subTarget}</span>
                </div>
              `;
            }).join('')}
          </div>
          <button type="button" class="btn-primary" style="padding: 10px; font-size: 13px; font-weight: 800; background: linear-gradient(135deg, #3b82f6, #1d4ed8); margin-top: 4px;" onclick="UI.hideModal(); if (window.TodayPage && TodayPage.openMicroMobilityModal) TodayPage.openMicroMobilityModal(0);">
            ⚡ הפעל מדריך מיקרו-מוביליות אינטראקטיבי
          </button>
        </div>
      `;
    } else if (gifExists) {
      mediaHTML = `
        <div class="gif-container skeleton-loading" style="position: relative; width: 100%; min-height: 240px; background: rgba(0, 0, 0, 0.25); border-radius: 14px; overflow: hidden; display: flex; align-items: center; justify-content: center; border: 1px solid var(--border-color); padding: 6px; box-shadow: inset 0 0 20px rgba(0,0,0,0.15);">
          <div class="skeleton-placeholder">
            <div class="skeleton-spinner"></div>
            <span class="skeleton-text">🎬 ${I18n.t('loading_gif')}</span>
          </div>
          <img src="${gifPath}" 
               class="skeleton-img"
               ${fallbackAttr}
               style="width: 100%; border-radius: 10px; object-fit: contain; max-height: 50vh; display: block; margin: 0 auto;" 
               alt="${title} GIF" 
               loading="eager" 
               decoding="async" 
               onload="UI.handleImageLoaded(this)"
               onerror="UI.handleImageFallback(this, 'gif')">
        </div>
      `;
    } else {
      mediaHTML = `
        <div class="skeleton-loading" style="position: relative; width: 100%; min-height: 240px; border-radius: 14px; overflow: hidden; background: rgba(0, 0, 0, 0.25); border: 1px solid var(--border-color); padding: 6px; display: flex; align-items: center; justify-content: center;">
          <div class="skeleton-placeholder">
            <div class="skeleton-spinner"></div>
          </div>
          <img src="${pngPath}" 
               class="skeleton-img"
               ${fallbackAttr}
               style="width: 100%; border-radius: 10px; object-fit: contain; max-height: 50vh; display: block; margin: 0 auto;" 
               alt="${title}" 
               loading="eager" 
               decoding="async" 
               onload="UI.handleImageLoaded(this)"
               onerror="UI.handleImageFallback(this, 'png')">
        </div>
      `;
    }

    showModal(modalTitleHTML, `
      <div style="display: flex; flex-direction: column; gap: 12px; width: 100%;">
        ${mediaHTML}
        ${metadataHTML}
        ${extraNote}
      </div>
    `);
  }


  /**
   * Get day type display info
   */
  function getDayTypeInfo(type) {
    if (!type) return { label: '', class: '', icon: '📋', isDeload: false };

    const isDeload = type.toLowerCase().includes('deload');

    const types = {
      'Legs + Core': { label: 'Legs + Core 🦵', class: 'strength', icon: '🦵' },
      'Push + Skill': { label: 'Push + Skill 💥', class: 'strength', icon: '💥' },
      'Pull + Grip': { label: 'Pull + Grip 🧲', class: 'strength', icon: '🧲' },
      'Zone 2 Cardio': { label: 'Zone 2 Cardio 🫀', class: 'walk', icon: '🫀' },
      'Active Recovery': { label: 'Active Recovery 🌿', class: 'recovery', icon: '🌿' },
      'VO2 Max': { label: 'VO2 Max 4x4 🔴', class: 'vo2', icon: '🔴' },
      'Rest': { label: 'Rest 😴', class: 'rest', icon: '😴' },
      'Legs + Push (Strength A)': { label: 'Strength A 🦵💥', class: 'strength', icon: '🦵' },
      'Pull + Skill (Strength B)': { label: 'Strength B 🧲', class: 'strength', icon: '🧲' },
      'Lower Strength': { label: 'Lower Strength 🦵', class: 'strength', icon: '🦵' },
      'Upper Push': { label: 'Upper Push 💥', class: 'strength', icon: '💥' },
      'Upper Pull + Skill': { label: 'Upper Pull 🧲', class: 'strength', icon: '🧲' },

      // Deload specific mappings
      'Legs + Core (Deload)': { label: 'Legs + Core 🌿 (Deload)', class: 'strength deload', icon: '🦵' },
      'Push + Skill (Deload)': { label: 'Push + Skill 🌿 (Deload)', class: 'strength deload', icon: '💥' },
      'Pull + Grip (Deload)': { label: 'Pull + Grip 🌿 (Deload)', class: 'strength deload', icon: '🧲' },
      'Zone 2 Cardio (Deload)': { label: 'Zone 2 Cardio 🌿 (Deload)', class: 'walk deload', icon: '🫀' },
      'Active Recovery (Deload)': { label: 'Active Recovery 🌿 (Deload)', class: 'recovery deload', icon: '🌿' }
    };

    if (types[type]) {
      return { ...types[type], isDeload };
    }

    if (isDeload) {
      const cleanType = type.replace(/\s*\([^)]*deload[^)]*\)/gi, '').trim();
      const baseInfo = types[cleanType] || { label: type, class: 'strength', icon: '🌿' };
      return {
        label: `${cleanType || type} 🌿 (Deload)`,
        class: `${baseInfo.class} deload`.trim(),
        icon: baseInfo.icon || '🌿',
        isDeload: true
      };
    }

    return { label: type, class: '', icon: '📋', isDeload: false };
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
    return window.appCurrentPlanIndex || 0;
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
    else if (n.includes('bars') || n.includes('push-up bars') || n.includes('parallettes')) results.push({ label: I18n.t('equip_bars'), icon: icons.bars, key: 'bars' });
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

  function initTimer() {
    document.getElementById('rest-timer-close').addEventListener('click', () => {
      document.getElementById('rest-timer').classList.add('hidden');
      clearInterval(timerInterval);
      timerOnComplete = null;
    });

    document.querySelectorAll('.timer-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const seconds = parseInt(e.target.dataset.time);
        let remaining = 0;
        if (timerEndTime && timerEndTime > Date.now()) {
          remaining = Math.round((timerEndTime - Date.now()) / 1000);
        }
        // If timer is already running, add time. Otherwise set it.
        startTimer(remaining > 0 ? remaining + seconds : seconds, timerOnComplete);
      });
    });
  }

  function startTimer(seconds, onComplete = null) {
    document.getElementById('rest-timer').classList.remove('hidden');
    clearInterval(timerInterval);

    if (onComplete !== undefined) {
      timerOnComplete = onComplete;
    }

    timerEndTime = Date.now() + seconds * 1000;
    updateTimerDisplay(seconds);

    timerInterval = setInterval(() => {
      const remaining = Math.round((timerEndTime - Date.now()) / 1000);
      if (remaining <= 0) {
        clearInterval(timerInterval);
        updateTimerDisplay(0);
        playTimerSound(true);
        UI.toast(I18n.t('rest_complete_toast'), 'success');

        setTimeout(() => {
          document.getElementById('rest-timer').classList.add('hidden');
          if (typeof timerOnComplete === 'function') {
            timerOnComplete();
          }
          timerOnComplete = null;
        }, 1500);
      } else {
        if (remaining <= 3 && remaining >= 1) {
          playTimerSound(false);
        }
        updateTimerDisplay(remaining);
      }
    }, 1000);
  }

  function updateTimerDisplay(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    document.getElementById('rest-timer-display').textContent =
      `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
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

  return {
    toast,
    showModal,
    hideModal,
    showImageModal,
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
    parseSetsCount,
    parseReps,
    getDifficultyClass,
    getEquipment,
    getEquipments,
    formatTempo,
    initTimer,
    startTimer,
    hasGif,
    getImageUrl,
    getGifUrl,
    showImageModal,
    stopTimer,
    speakVoiceCue,
    compressImage,
    EXERCISE_GIF_ALIASES,
    EXERCISE_PNG_ALIASES,
    DEEP_MOBILITY_SUB_EXERCISES,
    MICRO_MOBILITY_SUB_EXERCISES,
    MICRO_MOBILITY_A_SUB_EXERCISES,
    MICRO_MOBILITY_B_SUB_EXERCISES,
    getMicroMobilitySubExercises
  };
})();

window.UI = UI;
