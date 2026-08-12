/**
 * FitUp Background Image & GIF Preloader
 * Preloads all exercise PNGs, GIFs, and anatomy diagrams into browser cache and SW Cache Storage
 * immediately upon application initialization.
 */
(function() {
  'use strict';

  const Preloader = {
    started: false,
    completed: 0,
    total: 0,

    // Static assets to always preload
    staticAssets: [
      'images/anatomy-front.webp',
      'images/anatomy-back.webp'
    ],

    init: function() {
      if (this.started) return;
      this.started = true;

      // Run preloader after initial frame render so startup isn't blocked
      if ('requestIdleCallback' in window) {
        requestIdleCallback(() => this.startPreloading(), { timeout: 1500 });
      } else {
        setTimeout(() => this.startPreloading(), 500);
      }
    },

    getMediaUrls: function() {
      const urlSet = new Set(this.staticAssets);

      const isCardioOrNoImage = (name, noImage) => {
        if (noImage) return true;
        const lower = name.toLowerCase();
        return lower.includes('walking') || lower.includes('zone 2') || lower.includes('vo2 max') || lower.includes('cardio');
      };

      // 1. Extract from TRAINING_DATA if loaded
      if (window.TRAINING_DATA && Array.isArray(window.TRAINING_DATA.daily)) {
        window.TRAINING_DATA.daily.forEach(day => {
          if (Array.isArray(day.exercises)) {
            day.exercises.forEach(ex => {
              if (ex && ex.name && !isCardioOrNoImage(ex.name, ex.noImage)) {
                const cleanName = ex.name.trim();
                const pngName = cleanName.replace(/\//g, '-').toUpperCase();
                urlSet.add(`images/exercises/${pngName}.png`);
                urlSet.add(`images/gifs/${cleanName}.gif`);
              }
            });
          }
        });
      }

      // 2. Comprehensive GIF list on disk to ensure all GIFs download in background
      const allGifsOnDisk = [
        "Ankle Dorsiflexion Mobility.gif", "Arm Block - DB Curl.gif", "Arm Block - DB Lateral Raise.gif",
        "Arm Block - DB OH Triceps Ext.gif", "Arm Circles.gif", "Band Face-Pull.gif", "Band Pull-Apart.gif",
        "Banded Glute Bridge.gif", "Bodyweight Squat.gif", "Bulgarian Split Squat.gif", "Chin-Up Negative.gif",
        "Chin-Up.gif", "Chin-up Negative.gif", "Chin-up.gif", "DB BSS (Goblet).gif", "DB BSS.gif",
        "DB Bulgarian Split Squat.gif", "DB Curl.gif", "DB Floor Press.gif", "DB Glute Bridge.gif",
        "DB Hammer Curl.gif", "DB Hip Thrust.gif", "DB Lateral Raise.gif", "DB OH Triceps Ext.gif",
        "DB RDL.gif", "DB Single-Leg RDL.gif", "Dead Bug.gif", "Dead Hang.gif", "Deep Mobility Protocol.gif",
        "Deficit Push-Up.gif", "Dumbbell Biceps Curl.gif", "Dumbbell Floor Press.gif", "Dumbbell Hammer Curl.gif",
        "Dumbbell Lateral Raise.gif", "Dumbbell One-Arm Row.gif", "Dumbbell Romanian Deadlift (RDL).gif",
        "Dumbbell Single-Leg RDL.gif", "Dumbbell Standing Overhead Press (OHP).gif", "Dumbbell Suitcase Hold.gif",
        "Elevated Pike Push-Up.gif", "Elevated Pike Push-up.gif", "Feet-Elevated Push-Up.gif", "Glute Bridge.gif",
        "High Knees.gif", "Hollow Body Hold.gif", "Hollow Body Rock.gif", "L-sit Tuck (Bars).gif",
        "L-sit on Chair.gif", "One-Arm DB Row.gif", "PULL-UP NEGATIVE..gif", "Pallof Press (Band).gif",
        "Pallof Press.gif", "Pike Hold.gif", "Pike Push-up.gif", "Pistol Squat to Chair.gif", "Prone Y-T-W.gif",
        "Pull-Up (Overhand).gif", "Pull-Up Negative.gif", "Pull-up (Overhand).gif", "Push-Up (Bars).gif",
        "Push-up.gif", "Reverse Lunge (Goblet).gif", "Reverse Lunge + DB.gif", "Reverse Lunge.gif",
        "Scapular Pull-up.gif", "Scapular Push-up.gif", "Seated Band Row.gif", "Seated DB OHP.gif",
        "Single-Arm Curl.gif", "Single-Arm Floor Press.gif", "Single-Arm Seated OHP.gif", "Single-Leg Calf Raise.gif",
        "Single-Leg Glute Bridge.gif", "Suitcase Carry.gif", "TRX Face Pull (Angle 1).gif", "TRX Face Pull (Angle 2).gif",
        "TRX Face Pull (Angle 3).gif", "TRX Face Pull.gif", "TRX Y-T-W.gif", "Towel Hang.gif",
        "Walking Lunge (Goblet).gif", "Wall Handstand.gif", "Wall Slides.gif", "Wall Walk (Full).gif",
        "Wall Walk (Partial).gif", "Weighted Chin-Up.gif", "Weighted Deficit Push-Up.gif", "Weighted Pull-Up.gif",
        "Wrist Rocks.gif"
      ];

      allGifsOnDisk.forEach(gifName => {
        urlSet.add(`images/gifs/${gifName}`);
      });

      // 3. Comprehensive PNG list on disk
      const allPngsOnDisk = [
        "ARM BLOCK - DB CURL.png", "ARM BLOCK - DB LATERAL RAISE.png", "ARM BLOCK - DB OH TRICEPS EXT.png",
        "ARM CIRCLES.png", "BAND PULL-APART.png", "BODYWEIGHT SQUAT.png", "BRISK WALKING.png",
        "CHIN-UP NEGATIVE.png", "CHIN-UP.png", "DB BSS (GOBLET).png", "DB BSS.png", "DB BULGARIAN SPLIT SQUAT.png",
        "DB CURL.png", "DB FLOOR PRESS.png", "DB GLUTE BRIDGE.png", "DB HAMMER CURL.png", "DB HIP THRUST.png",
        "DB LATERAL RAISE.png", "DB OH TRICEPS EXT.png", "DB RDL.png", "DB SINGLE-LEG RDL.png", "DEAD BUG.png",
        "DEAD HANG.png", "DEEP MOBILITY PROTOCOL.png", "DEFICIT PUSH-UP.png", "ELEVATED PIKE PUSH-UP.png",
        "FEET-ELEVATED PUSH-UP.png", "GLUTE BRIDGE.png", "HIGH KNEES.png", "HOLLOW BODY HOLD.png",
        "L-SIT TUCK (BARS).png", "ONE-ARM DB ROW.png", "PALLOF PRESS.png", "PIKE HOLD.png",
        "PISTOL SQUAT TO CHAIR.png", "PULL-UP (OVERHAND).png", "PULL-UP NEGATIVE.png", "PUSH-UP (BARS).png",
        "PUSH-UP.png", "RELAXED WALKING.png", "REVERSE LUNGE + DB.png", "SCAPULAR PULL-UP.png",
        "SCAPULAR PUSH-UP.png", "SEATED BAND ROW.png", "SEATED DB OHP.png", "SINGLE-ARM CURL.png",
        "SINGLE-ARM FLOOR PRESS.png", "SINGLE-ARM SEATED OHP.png", "SINGLE-LEG CALF RAISE.png", "SUITCASE CARRY.png",
        "TOWEL HANG.png", "TRX FACE PULL (ANGLE 1).png", "TRX FACE PULL (ANGLE 2).png", "TRX FACE PULL (ANGLE 3).png",
        "TRX FACE PULL.png", "TRX Y-T-W.png", "VO2 MAX NORWEGIAN 4X4.png", "WALKING LUNGE (GOBLET).png",
        "WALL HANDSTAND.png", "WALL SLIDES.png", "WALL WALK (FULL).png", "WALL WALK (PARTIAL).png",
        "WEIGHTED CHIN-UP.png", "WEIGHTED DEFICIT PUSH-UP.png", "WEIGHTED PULL-UP.png", "WRIST ROCKS.png"
      ];

      allPngsOnDisk.forEach(pngName => {
        urlSet.add(`images/exercises/${pngName}`);
      });

      return Array.from(urlSet);
    },

    preloadSingleUrl: function(url) {
      return new Promise((resolve) => {
        let done = false;

        const checkDone = () => {
          if (!done) {
            done = true;
            resolve();
          }
        };

        // 1. Image Object Preload (Populates Browser Memory Cache)
        const img = new Image();
        img.onload = img.onerror = checkDone;
        img.src = url;

        // 2. Fetch API Call (Triggers Service Worker Cache-First Storage)
        fetch(url, { cache: 'force-cache' })
          .then(checkDone)
          .catch(checkDone);

        // Safeguard timeout per image (max 5 seconds)
        setTimeout(checkDone, 5000);
      });
    },

    startPreloading: async function() {
      const urls = this.getMediaUrls();
      this.total = urls.length;
      this.completed = 0;

      console.log(`[Preloader] Starting background preloading for ${this.total} media assets...`);

      // Concurrency worker queue (load 4 images in parallel)
      const CONCURRENCY = 4;
      const queue = [...urls];

      const worker = async () => {
        while (queue.length > 0) {
          const url = queue.shift();
          await this.preloadSingleUrl(url);
          this.completed++;
        }
      };

      const workers = Array.from({ length: CONCURRENCY }, () => worker());
      await Promise.all(workers);

      console.log(`[Preloader] Background preloading complete! (${this.completed}/${this.total} assets cached)`);
    }
  };

  window.Preloader = Preloader;
})();
