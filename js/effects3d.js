/**
 * FitUp 3D Visual Animations & Web Audio API Synthesizer Module
 * Provides zero-latency audio feedback and 3D visual particle effects for Set and Exercise completions.
 */
const Effects3D = (() => {

  let audioCtx = null;
  let soundEnabled = localStorage.getItem('fitup_sound_enabled') !== 'false';
  let effectsEnabled = localStorage.getItem('fitup_effects3d_enabled') !== 'false';

  /**
   * Get or initialize Web Audio API Context
   */
  function getAudioContext() {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        audioCtx = new AudioContextClass();
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    return audioCtx;
  }

  // Ensure AudioContext resumes on first click/touch
  document.addEventListener('pointerdown', () => {
    getAudioContext();
  }, { once: true });

  /**
   * Check if sound is active
   */
  function isSoundActive() {
    return soundEnabled;
  }

  /**
   * Check if 3D effects are active
   */
  function isEffectsActive() {
    return effectsEnabled;
  }

  /**
   * Set sound toggle
   */
  function setSoundEnabled(val) {
    soundEnabled = !!val;
    localStorage.setItem('fitup_sound_enabled', soundEnabled ? 'true' : 'false');
  }

  /**
   * Set 3D effects toggle
   */
  function setEffects3dEnabled(val) {
    effectsEnabled = !!val;
    localStorage.setItem('fitup_effects3d_enabled', effectsEnabled ? 'true' : 'false');
  }

  // ==========================================
  // WEB AUDIO SYNTHESIZER (ZERO LATENCY)
  // ==========================================

  /**
   * Play Set Completion Sound Tones
   */
  function playSetSound(outcome = 'in_window') {
    if (!isSoundActive()) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(0.3, now);
      masterGain.connect(ctx.destination);

      if (outcome === 'above') {
        // 🚀 Above Target: Upbeat 3-note harmonic arpeggio (G5 -> C6 -> E6)
        const notes = [783.99, 1046.50, 1318.51];
        notes.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, now + idx * 0.05);

          gain.gain.setValueAtTime(0, now + idx * 0.05);
          gain.gain.linearRampToValueAtTime(0.4, now + idx * 0.05 + 0.01);
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.05 + 0.25);

          osc.connect(gain);
          gain.connect(masterGain);

          osc.start(now + idx * 0.05);
          osc.stop(now + idx * 0.05 + 0.25);
        });

        // Sparkling chime high layer
        const chime = ctx.createOscillator();
        const chimeGain = ctx.createGain();
        chime.type = 'sine';
        chime.frequency.setValueAtTime(2093.00, now + 0.1);
        chimeGain.gain.setValueAtTime(0.2, now + 0.1);
        chimeGain.exponentialRampToValueAtTime(0.001, now + 0.35);
        chime.connect(chimeGain);
        chimeGain.connect(masterGain);
        chime.start(now + 0.1);
        chime.stop(now + 0.35);

      } else if (outcome === 'below') {
        // ⚠️ Mechanical Stop: Warm double-tone (D5 -> A5)
        const notes = [587.33, 880.00];
        notes.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + idx * 0.07);

          gain.gain.setValueAtTime(0, now + idx * 0.07);
          gain.gain.linearRampToValueAtTime(0.35, now + idx * 0.07 + 0.01);
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.07 + 0.3);

          osc.connect(gain);
          gain.connect(masterGain);

          osc.start(now + idx * 0.07);
          osc.stop(now + idx * 0.07 + 0.3);
        });

      } else {
        // ✅ In Window / Default: Crisp 2-note ascending chord (E5 -> B5) + punchy sub bass
        const notes = [659.25, 987.77];
        notes.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + idx * 0.06);

          gain.gain.setValueAtTime(0, now + idx * 0.06);
          gain.gain.linearRampToValueAtTime(0.4, now + idx * 0.06 + 0.01);
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.22);

          osc.connect(gain);
          gain.connect(masterGain);

          osc.start(now + idx * 0.06);
          osc.stop(now + idx * 0.06 + 0.22);
        });

        // Sub bass thump
        const sub = ctx.createOscillator();
        const subGain = ctx.createGain();
        sub.type = 'sine';
        sub.frequency.setValueAtTime(110, now);
        sub.frequency.exponentialRampToValueAtTime(55, now + 0.15);
        subGain.gain.setValueAtTime(0.3, now);
        subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
        sub.connect(subGain);
        subGain.connect(masterGain);
        sub.start(now);
        sub.stop(now + 0.15);
      }
    } catch (e) {
      console.warn('Audio synthesis warning:', e);
    }
  }

  /**
   * Play Exercise Completion Fanfare Sound
   */
  function playExerciseSound() {
    if (!isSoundActive()) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(0.35, now);
      masterGain.connect(ctx.destination);

      // Triumphant 4-note brass fanfare chord (C5 -> E5 -> G5 -> C6)
      const chord = [523.25, 659.25, 783.99, 1046.50];
      chord.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = idx === chord.length - 1 ? 'triangle' : 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);

        gain.gain.setValueAtTime(0, now + idx * 0.08);
        gain.gain.linearRampToValueAtTime(0.4, now + idx * 0.08 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.6);

        osc.connect(gain);
        gain.connect(masterGain);

        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 0.6);
      });

      // Sparkling chime cascade after chord
      const chimes = [1567.98, 1760.00, 2093.00, 2637.02];
      chimes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + 0.3 + idx * 0.05);

        gain.gain.setValueAtTime(0.2, now + 0.3 + idx * 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3 + idx * 0.05 + 0.3);

        osc.connect(gain);
        gain.connect(masterGain);

        osc.start(now + 0.3 + idx * 0.05);
        osc.stop(now + 0.3 + idx * 0.05 + 0.3);
      });

      // Warm bass foundation
      const bass = ctx.createOscillator();
      const bassGain = ctx.createGain();
      bass.type = 'triangle';
      bass.frequency.setValueAtTime(130.81, now);
      bassGain.gain.setValueAtTime(0.4, now);
      bassGain.gain.exponentialRampToValueAtTime(0.001, now + 0.7);
      bass.connect(bassGain);
      bassGain.connect(masterGain);
      bass.start(now);
      bass.stop(now + 0.7);

    } catch (e) {
      console.warn('Exercise audio synthesis warning:', e);
    }
  }

  /**
   * Play Full Workout Completion Grand Sound
   */
  function playWorkoutSound() {
    if (!isSoundActive()) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(0.4, now);
      masterGain.connect(ctx.destination);

      // Grand orchestral synth fanfare roll (C4 -> G4 -> C5 -> E5 -> G5 -> C6 -> E6)
      const fanfare = [261.63, 392.00, 523.25, 659.25, 783.99, 1046.50, 1318.51];
      fanfare.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.07);

        gain.gain.setValueAtTime(0, now + idx * 0.07);
        gain.gain.linearRampToValueAtTime(0.35, now + idx * 0.07 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.07 + 0.9);

        osc.connect(gain);
        gain.connect(masterGain);

        osc.start(now + idx * 0.07);
        osc.stop(now + idx * 0.07 + 0.9);
      });

      // Golden bell chime flourish
      const bells = [2093.00, 2637.02, 3135.96];
      bells.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + 0.5 + idx * 0.08);

        gain.gain.setValueAtTime(0.25, now + 0.5 + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5 + idx * 0.08 + 0.6);

        osc.connect(gain);
        gain.connect(masterGain);

        osc.start(now + 0.5 + idx * 0.08);
        osc.stop(now + 0.5 + idx * 0.08 + 0.6);
      });

    } catch (e) {
      console.warn('Workout audio synthesis warning:', e);
    }
  }

  /**
   * Play Uplifting Rest Completion Musical Chime Melody
   */
  function playCompletionMelody() {
    if (!isSoundActive()) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(0.35, now);
      masterGain.connect(ctx.destination);

      // Uplifting 4-note melodic sequence: C5 -> E5 -> G5 -> C6
      const melodyNotes = [
        { freq: 523.25, time: 0, dur: 0.25 },   // C5
        { freq: 659.25, time: 0.12, dur: 0.25 }, // E5
        { freq: 783.99, time: 0.24, dur: 0.3 },  // G5
        { freq: 1046.50, time: 0.38, dur: 0.6 }  // C6 (Final resolving note)
      ];

      melodyNotes.forEach(n => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle'; // Soft, rich musical waveform
        osc.frequency.setValueAtTime(n.freq, now + n.time);

        gain.gain.setValueAtTime(0, now + n.time);
        gain.gain.linearRampToValueAtTime(0.4, now + n.time + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.001, now + n.time + n.dur);

        osc.connect(gain);
        gain.connect(masterGain);

        osc.start(now + n.time);
        osc.stop(now + n.time + n.dur);
      });

      // High sparkling bell chime accent on final note (E6 & G6)
      const chimes = [1318.51, 1567.98];
      chimes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + 0.38 + idx * 0.06);

        gain.gain.setValueAtTime(0.18, now + 0.38 + idx * 0.06);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.38 + idx * 0.06 + 0.45);

        osc.connect(gain);
        gain.connect(masterGain);

        osc.start(now + 0.38 + idx * 0.06);
        osc.stop(now + 0.38 + idx * 0.06 + 0.45);
      });

      // Warm bass foundation (C3 = 130.81Hz)
      const bass = ctx.createOscillator();
      const bassGain = ctx.createGain();
      bass.type = 'sine';
      bass.frequency.setValueAtTime(130.81, now);
      bassGain.gain.setValueAtTime(0.25, now);
      bassGain.gain.exponentialRampToValueAtTime(0.001, now + 0.7);
      bass.connect(bassGain);
      bassGain.connect(masterGain);
      bass.start(now);
      bass.stop(now + 0.7);

    } catch (e) {
      console.warn('Melody audio synthesis warning:', e);
    }
  }

  /**
   * Play Rest Timer Countdown Tick or Completion Chime
   * @param {boolean} isFinal - True if timer completed (0s), false for countdown ticks (3s, 2s, 1s)
   */
  function playTimerBeep(isFinal = false) {
    if (!isSoundActive()) return;
    if (isFinal) {
      playCompletionMelody();
      return;
    }
    const ctx = getAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(0.3, now);
      masterGain.connect(ctx.destination);

      // Subtle countdown tick (880Hz high woodblock tick)
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880.00, now);

      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.25, now + 0.005);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

      osc.connect(gain);
      gain.connect(masterGain);

      osc.start(now);
      osc.stop(now + 0.08);
    } catch (e) {
      console.warn('Timer beep audio synthesis warning:', e);
    }
  }

  // ==========================================
  // 3D VISUAL GRAPHICS ENGINE & PARTICLES
  // ==========================================

  /**
   * Helper to create 3D canvas overlay at specific screen coordinates
   */
  function createOverlayCanvas(x, y, width = 300, height = 300) {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    canvas.style.position = 'fixed';
    canvas.style.left = `${x - width / 2}px`;
    canvas.style.top = `${y - height / 2}px`;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    canvas.style.pointerEvents = 'none';
    canvas.style.zIndex = '999999';
    document.body.appendChild(canvas);
    return canvas;
  }

  /**
   * 3D Polyhedron / Star Particle Generator (Three.js WebGL with Canvas 3D Fallback)
   */
  function render3DParticleBurst(canvas, colorPalette, badgeText = '+1 SET') {
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;

    // Create 3D particles with (x, y, z) coordinates, velocity (vx, vy, vz), rotational velocities, and colors
    const particleCount = 35;
    const particles = [];

    for (let i = 0; i < particleCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const elevation = (Math.random() - 0.5) * Math.PI;
      const speed = 4 + Math.random() * 8;

      particles.push({
        x: 0,
        y: 0,
        z: 0,
        vx: Math.cos(angle) * Math.cos(elevation) * speed,
        vy: Math.sin(elevation) * speed - 2, // slight upward float
        vz: Math.sin(angle) * Math.cos(elevation) * speed,
        rx: Math.random() * Math.PI * 2,
        ry: Math.random() * Math.PI * 2,
        rz: Math.random() * Math.PI * 2,
        vrx: (Math.random() - 0.5) * 0.2,
        vry: (Math.random() - 0.5) * 0.2,
        vrz: (Math.random() - 0.5) * 0.2,
        size: 6 + Math.random() * 10,
        shape: Math.floor(Math.random() * 3), // 0: Cube, 1: Diamond/Tetrahedron, 2: Glowing Sphere
        color: colorPalette[Math.floor(Math.random() * colorPalette.length)],
        life: 1.0,
        decay: 0.02 + Math.random() * 0.02
      });
    }

    // Badge animation parameters
    let badgeScale = 0.2;
    let badgeOpacity = 1.0;
    let badgeYOffset = 0;

    let startTime = performance.now();

    function animate(currentTime) {
      const elapsed = currentTime - startTime;
      ctx.clearRect(0, 0, width, height);

      // Sort particles by 3D depth (Z-index) for proper 3D rendering order
      particles.sort((a, b) => b.z - a.z);

      let activeParticles = 0;

      particles.forEach(p => {
        if (p.life <= 0) return;
        activeParticles++;

        // Update 3D coordinates & rotations
        p.x += p.vx;
        p.y += p.vy;
        p.z += p.vz;
        p.vy += 0.15; // 3D gravity
        p.rx += p.vrx;
        p.ry += p.vry;
        p.rz += p.vrz;
        p.life -= p.decay;

        // 3D Perspective Projection
        const fov = 250;
        const scale = fov / (fov + p.z + 150);
        const projX = centerX + p.x * scale;
        const projY = centerY + p.y * scale;
        const projSize = Math.max(1, p.size * scale);

        ctx.save();
        ctx.translate(projX, projY);
        ctx.rotate(p.rz);
        ctx.globalAlpha = Math.max(0, p.life);
        ctx.fillStyle = p.color;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;

        if (p.shape === 0) {
          // 3D Cube Projection
          ctx.beginPath();
          ctx.rect(-projSize / 2, -projSize / 2, projSize, projSize);
          ctx.fill();
          ctx.stroke();
        } else if (p.shape === 1) {
          // 3D Diamond / Tetrahedron
          ctx.beginPath();
          ctx.moveTo(0, -projSize);
          ctx.lineTo(projSize * 0.8, 0);
          ctx.lineTo(0, projSize);
          ctx.lineTo(-projSize * 0.8, 0);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
        } else {
          // Glowing 3D Sphere
          ctx.beginPath();
          ctx.arc(0, 0, projSize, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();
      });

      // Render 3D Floating Achievement Badge
      if (badgeOpacity > 0) {
        if (badgeScale < 1.0) {
          badgeScale += (1.0 - badgeScale) * 0.25;
        }
        badgeYOffset -= 1.2;
        badgeOpacity -= 0.018;

        ctx.save();
        ctx.translate(centerX, centerY - 25 + badgeYOffset);
        ctx.scale(badgeScale, badgeScale);
        ctx.globalAlpha = Math.max(0, badgeOpacity);

        // Badge Backdrop Glow & Box
        ctx.shadowColor = colorPalette[0];
        ctx.shadowBlur = 15;
        ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
        ctx.strokeStyle = colorPalette[0];
        ctx.lineWidth = 2;

        const textWidth = ctx.measureText(badgeText).width + 30;
        const badgeW = Math.max(90, textWidth);
        const badgeH = 34;

        ctx.beginPath();
        ctx.roundRect(-badgeW / 2, -badgeH / 2, badgeW, badgeH, 10);
        ctx.fill();
        ctx.stroke();

        // Badge Text
        ctx.shadowBlur = 0;
        ctx.font = '900 14px Inter, Heebo, system-ui, sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(badgeText, 0, 1);

        ctx.restore();
      }

      if (activeParticles > 0 || badgeOpacity > 0) {
        requestAnimationFrame(animate);
      } else {
        canvas.remove();
      }
    }

    requestAnimationFrame(animate);
  }

  /**
   * Trigger Set Completion Visual & Audio Effect
   */
  function triggerSetEffect(eventOrEl, outcome = 'in_window') {
    // Audio synthesis
    playSetSound(outcome);

    // Haptic vibration
    if (navigator.vibrate) {
      navigator.vibrate(outcome === 'above' ? [40, 30, 40] : 45);
    }

    if (!isEffectsActive()) return;

    // Determine screen position of click / button
    let x = window.innerWidth / 2;
    let y = window.innerHeight / 2;

    if (eventOrEl) {
      if (eventOrEl.getBoundingClientRect) {
        const rect = eventOrEl.getBoundingClientRect();
        x = rect.left + rect.width / 2;
        y = rect.top + rect.height / 2;
      } else if (eventOrEl.clientX !== undefined) {
        x = eventOrEl.clientX;
        y = eventOrEl.clientY;
      }
    }

    // Color palettes per outcome
    const palettes = {
      above: ['#3b82f6', '#60a5fa', '#93c5fd', '#fbbf24', '#ffffff'],
      in_window: ['#10b981', '#34d399', '#6ee7b7', '#a7f3d0', '#ffffff'],
      below: ['#f59e0b', '#fbbf24', '#fef08a', '#38bdf8', '#ffffff']
    };

    const badges = {
      above: '🚀 +1 SET (SUPER!)',
      in_window: '✅ +1 SET (TARGET!)',
      below: '⚠️ +1 SET (SOLID!)'
    };

    const canvas = createOverlayCanvas(x, y, 320, 320);
    render3DParticleBurst(canvas, palettes[outcome] || palettes.in_window, badges[outcome] || '+1 SET');

    // Trigger Canvas Confetti burst if library is loaded
    if (typeof confetti === 'function') {
      confetti({
        particleCount: outcome === 'above' ? 30 : 20,
        spread: 60,
        startVelocity: 25,
        origin: { x: x / window.innerWidth, y: y / window.innerHeight },
        colors: palettes[outcome] || palettes.in_window,
        disableForReducedMotion: true
      });
    }
  }

  /**
   * Trigger Exercise Completion Visual Stage & Audio Effect
   */
  function triggerExerciseEffect(exerciseName = 'Exercise') {
    // Audio Fanfare
    playExerciseSound();

    // Haptics
    if (navigator.vibrate) {
      navigator.vibrate([60, 40, 80]);
    }

    if (!isEffectsActive()) return;

    // Full screen confetti fireworks stage celebration
    if (typeof confetti === 'function') {
      const count = 180;
      const defaults = {
        origin: { y: 0.6 }
      };

      function fire(particleRatio, opts) {
        confetti({
          ...defaults,
          ...opts,
          particleCount: Math.floor(count * particleRatio)
        });
      }

      fire(0.25, { spread: 26, startVelocity: 55, colors: ['#10b981', '#3b82f6'] });
      fire(0.2, { spread: 60, colors: ['#f59e0b', '#ec4899', '#8b5cf6'] });
      fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
      fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
      fire(0.1, { spread: 120, startVelocity: 45, colors: ['#ffffff', '#fbbf24'] });
    }

    // 3D Full-Stage Trophy / Star burst
    const canvas = createOverlayCanvas(window.innerWidth / 2, window.innerHeight / 3, 500, 500);
    render3DParticleBurst(canvas, ['#fbbf24', '#f59e0b', '#10b981', '#3b82f6', '#ec4899', '#ffffff'], `🏆 ${exerciseName.toUpperCase()} DONE!`);
  }

  /**
   * Trigger Full Workout Completion Grand Master Effect
   */
  function triggerWorkoutEffect() {
    // Grand Sound
    playWorkoutSound();

    // Celebration Haptics
    if (navigator.vibrate) {
      navigator.vibrate([100, 50, 100, 50, 250]);
    }

    if (!isEffectsActive()) return;

    // Grand Fireworks Multi-Shot
    if (typeof confetti === 'function') {
      const duration = 3 * 1000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 99999 };

      function randomInRange(min, max) {
        return Math.random() * (max - min) + min;
      }

      const interval = setInterval(function() {
        const timeLeft = animationEnd - Date.now();
        if (timeLeft <= 0) {
          return clearInterval(interval);
        }
        const particleCount = 50 * (timeLeft / duration);
        confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
        confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
      }, 250);
    }
  }

  return {
    isSoundActive,
    isEffectsActive,
    setSoundEnabled,
    setEffects3dEnabled,
    playSetSound,
    playExerciseSound,
    playWorkoutSound,
    playTimerBeep,
    playCompletionMelody,
    triggerSetEffect,
    triggerExerciseEffect,
    triggerWorkoutEffect
  };

})();

// Export globally
if (typeof window !== 'undefined') {
  window.Effects3D = Effects3D;
}
