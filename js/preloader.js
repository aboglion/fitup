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

      // 2. Fallback common exercises if TRAINING_DATA isn't loaded yet
      const commonExercises = [
        "Push-up", "Pull-Up (Overhand)", "Bodyweight Squat", "DB RDL",
        "DB Bulgarian Split Squat", "DB Curl", "Seated DB OHP", "Dead Hang",
        "Pike Hold", "High Knees", "Wall Slides", "DB Floor Press",
        "DB Lateral Raise", "DB OH Triceps Ext", "TRX Y-T-W", "Scapular Push-up",
        "Scapular Pull-up", "Band Pull-Apart", "Arm Circles", "Dead Bug",
        "Glute Bridge", "Suitcase Carry", "Single-Leg Calf Raise", "Towel Hang",
        "L-sit Tuck (Bars)", "Deep Mobility Protocol"
      ];

      commonExercises.forEach(name => {
        if (!isCardioOrNoImage(name, false)) {
          const pngName = name.replace(/\//g, '-').toUpperCase();
          urlSet.add(`images/exercises/${pngName}.png`);
          urlSet.add(`images/gifs/${name}.gif`);
        }
      });

      return Array.from(urlSet);
    },

    preloadSingleUrl: function(url) {
      return new Promise((resolve) => {
        let fetchDone = false;
        let imgDone = false;

        const checkDone = () => {
          if (fetchDone || imgDone) {
            resolve();
          }
        };

        // 1. Image Object Preload (Populates Browser Memory Cache)
        const img = new Image();
        img.onload = img.onerror = () => {
          imgDone = true;
          checkDone();
        };
        img.src = url;

        // 2. Fetch API Call (Triggers Service Worker Cache-First Storage)
        fetch(url, { cache: 'force-cache' })
          .then(() => {
            fetchDone = true;
            checkDone();
          })
          .catch(() => {
            fetchDone = true;
            checkDone();
          });

        // Safeguard timeout per image (max 4 seconds)
        setTimeout(resolve, 4000);
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
