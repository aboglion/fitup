/**
 * Anatomy Map Module — v4 Professional
 * 14 muscle groups with weighted multi-exercise contribution model.
 * Positions calibrated with max-width constraint for consistent rendering.
 */
const AnatomyMap = (() => {

  function render(container, muscleData) {
    const getColor = (pct) => {
      if (pct === 0) return 'rgba(0, 255, 102, 0.45)';
      if (pct < 30) return '#00d656';
      if (pct < 60) return '#00ff66';
      if (pct < 85) return '#39ff14';
      return '#00ffaa';
    };

    const formatPct = (val) => {
      if (val == null || isNaN(val) || val <= 0) return '0%';
      if (val >= 100) return '100%';
      return val.toFixed(1) + '%';
    };

    // Safe fallback for all muscle keys
    const keys = ['chest', 'shoulders', 'triceps', 'lats', 'traps', 'biceps', 'forearms',
      'quads', 'hamstrings', 'glutes', 'calves', 'core', 'obliques', 'lowerBack', 'neck'];
    const m = {};
    keys.forEach(k => {
      const rawPct = muscleData[k] != null ? Math.max(0, Math.min(100, Number(muscleData[k]))) : 0;
      m[k] = { pct: rawPct, formatted: formatPct(rawPct), color: getColor(rawPct) };
    });

    // Body centered 50%.
    const frontCallouts = [
      // Left labels (User's left, Character's right)
      { id: 'neck', label: I18n.t('muscle_neck'), pct: m.neck.pct, formatted: m.neck.formatted, color: m.neck.color, nodeX: 47.5, nodeY: 18, labelY: 7, side: 'left' },
      { id: 'chest-l', label: I18n.t('muscle_chest'), pct: m.chest.pct, formatted: m.chest.formatted, color: m.chest.color, nodeX: 45, nodeY: 24, labelY: 18, side: 'left' },
      { id: 'core', label: I18n.t('muscle_core'), pct: m.core.pct, formatted: m.core.formatted, color: m.core.color, nodeX: 50, nodeY: 34, labelY: 38, side: 'left' },
      { id: 'obliques-l', label: I18n.t('muscle_obliques'), pct: m.obliques.pct, formatted: m.obliques.formatted, color: m.obliques.color, nodeX: 45, nodeY: 39, labelY: 58, side: 'left' },
      // Right labels (User's right, Character's left)
      { id: 'shoulders-r', label: I18n.t('muscle_shoulders'), pct: m.shoulders.pct, formatted: m.shoulders.formatted, color: m.shoulders.color, nodeX: 60, nodeY: 19, labelY: 12, side: 'right' },
      { id: 'biceps-r', label: I18n.t('muscle_biceps'), pct: m.biceps.pct, formatted: m.biceps.formatted, color: m.biceps.color, nodeX: 62, nodeY: 30, labelY: 31, side: 'right' },
      { id: 'forearm-r', label: I18n.t('muscle_forearms'), pct: m.forearms.pct, formatted: m.forearms.formatted, color: m.forearms.color, nodeX: 65, nodeY: 40, labelY: 50, side: 'right' },
      { id: 'quads-r', label: I18n.t('muscle_quads'), pct: m.quads.pct, formatted: m.quads.formatted, color: m.quads.color, nodeX: 55, nodeY: 55, labelY: 69, side: 'right' },
    ];

    // ── BACK VIEW ──
    const backCallouts = [
      // Left labels (4)
      { id: 'traps-l', label: I18n.t('muscle_traps'), pct: m.traps.pct, formatted: m.traps.formatted, color: m.traps.color, nodeX: 46, nodeY: 18, labelY: 14, side: 'left' },
      { id: 'triceps-l', label: I18n.t('muscle_triceps'), pct: m.triceps.pct, formatted: m.triceps.formatted, color: m.triceps.color, nodeX: 39, nodeY: 30, labelY: 33, side: 'left' },
      { id: 'lowerBack', label: I18n.t('muscle_lower_back'), pct: m.lowerBack.pct, formatted: m.lowerBack.formatted, color: m.lowerBack.color, nodeX: 50, nodeY: 42, labelY: 52, side: 'left' },
      { id: 'hamstrings-l', label: I18n.t('muscle_hamstrings'), pct: m.hamstrings.pct, formatted: m.hamstrings.formatted, color: m.hamstrings.color, nodeX: 46, nodeY: 63, labelY: 71, side: 'left' },
      // Right labels (3)
      { id: 'lats-r', label: I18n.t('muscle_lats'), pct: m.lats.pct, formatted: m.lats.formatted, color: m.lats.color, nodeX: 56, nodeY: 33, labelY: 28, side: 'right' },
      { id: 'glutes-r', label: I18n.t('muscle_glutes'), pct: m.glutes.pct, formatted: m.glutes.formatted, color: m.glutes.color, nodeX: 54, nodeY: 51, labelY: 49, side: 'right' },
      { id: 'calves-r', label: I18n.t('muscle_calves'), pct: m.calves.pct, formatted: m.calves.formatted, color: m.calves.color, nodeX: 54, nodeY: 77, labelY: 70, side: 'right' },
    ];

    const generatePaneHTML = (callouts, title, imagePath) => {
      const visible = callouts;
      return `
        <div class="anatomy-pane">
          <div class="anatomy-inner">
            <div class="anatomy-image-bg" style="background-image: url('${imagePath}');"></div>
            <svg class="anatomy-svg-overlay" viewBox="0 0 100 100" preserveAspectRatio="none" width="100%" height="100%">
              ${visible.map(c => {
        const labelY = c.labelY !== undefined ? c.labelY : c.nodeY;
        const targetX = c.side === 'left' ? 22 : 78;
        const midX = c.side === 'left' ? Math.min(c.nodeX - 5, 34) : Math.max(c.nodeX + 5, 66);
        return `
                  <path d="M ${c.nodeX} ${c.nodeY} L ${midX} ${labelY} L ${targetX} ${labelY}" 
                        stroke="${c.color}" stroke-width="0.85" fill="none" opacity="0.9" 
                        stroke-dasharray="1.5 1" style="filter: drop-shadow(0 0 3px ${c.color});" />
                  <circle cx="${c.nodeX}" cy="${c.nodeY}" r="1.1" fill="${c.color}" />
                  <circle cx="${targetX}" cy="${labelY}" r="0.9" fill="${c.color}" />
                `;
      }).join('')}
            </svg>
            ${visible.map(c => {
        const labelY = c.labelY !== undefined ? c.labelY : c.nodeY;
        return `
                <div class="callout-label side-${c.side}" style="top: ${labelY}%; --color: ${c.color}; cursor: pointer; pointer-events: auto;" onclick="AnatomyMap.showMuscleDetails('${c.id.split('-')[0]}', '${c.label.replace(/'/g, "\\'")}', ${c.pct})">
                  <div class="callout-title">${c.label}</div>
                  <div class="callout-value">${c.formatted}</div>
                  <div class="progress-glow-bar"><div class="progress-glow-fill" style="width: ${Math.min(100, c.pct)}%; background: ${c.pct > 0 ? '#00ff66' : 'rgba(255,255,255,0.2)'};"></div></div>
                </div>
              `;
      }).join('')}
            ${visible.map(c => `
              <div class="anatomy-node" style="left: ${c.nodeX}%; top: ${c.nodeY}%; background-color: ${c.color}; color: ${c.color}; cursor: pointer; pointer-events: auto;" onclick="AnatomyMap.showMuscleDetails('${c.id.split('-')[0]}', '${(c.label || c.id).replace(/'/g, "\\'")}', ${c.pct || 0})"></div>
            `).join('')}
          </div>
        </div>`;
    };

    container.innerHTML = `
      <style>
        .anatomy-dual-container {
          display: grid;
          grid-template-columns: 1fr;
          gap: 18px;
          width: 100%;
          padding: 6px 0;
        }
        .anatomy-pane {
          display: flex;
          justify-content: center;
          background: radial-gradient(ellipse at 50% 40%, #051a10 0%, #020b06 100%);
          border-radius: var(--radius-xl, 16px);
          border: 1px solid var(--border-color, rgba(255, 255, 255, 0.12));
          box-shadow: 0 4px 24px rgba(0, 0, 0, 0.4), inset 0 0 40px rgba(0, 255, 102, 0.06);
          overflow: hidden;
          padding: 0;
          transition: border-color var(--transition-fast, 0.2s), box-shadow var(--transition-fast, 0.2s);
        }
        .anatomy-inner {
          position: relative;
          width: 100%;
          max-width: 380px;
          aspect-ratio: 1 / 1;
        }
        .pane-title {
          position: absolute; top: 12px; left: 12px;
          background: rgba(4, 20, 12, 0.88); padding: 4px 12px; border-radius: 8px;
          font-family: 'Inter', 'Heebo', system-ui, -apple-system, sans-serif; font-weight: 800; color: #00ff66; z-index: 30; font-size: 12px;
          letter-spacing: 0.5px; text-transform: uppercase;
          border: 1px solid rgba(0, 255, 102, 0.3); backdrop-filter: blur(8px);
          box-shadow: 0 0 12px rgba(0, 255, 102, 0.25);
        }
        .anatomy-image-bg {
          position: absolute; inset: 0;
          background-size: cover; background-position: center; background-repeat: no-repeat;
          opacity: 0.92;
          -webkit-mask-image: linear-gradient(to bottom, transparent 0%, black 4%, black 94%, transparent 100%);
          mask-image: linear-gradient(to bottom, transparent 0%, black 4%, black 94%, transparent 100%);
        }
        .anatomy-svg-overlay { position: absolute; inset: 0; z-index: 15; pointer-events: none; }
        .anatomy-node {
          position: absolute; width: 6px; height: 6px; border-radius: 50%;
          transform: translate(-50%, -50%); z-index: 16;
          box-shadow: 0 0 6px currentColor, 0 0 12px currentColor;
          animation: heartbeat-core 1.4s infinite ease-in-out;
        }
        .anatomy-node::after {
          content: ''; position: absolute; inset: -2px; border-radius: 50%;
          border: 1.5px solid currentColor;
          animation: heartbeat-pulse 1.4s infinite ease-in-out;
        }
        @keyframes heartbeat-core {
          0%, 100% {
            transform: translate(-50%, -50%) scale(1);
            box-shadow: 0 0 5px currentColor, 0 0 10px currentColor;
          }
          15% {
            transform: translate(-50%, -50%) scale(1.3);
            box-shadow: 0 0 10px currentColor, 0 0 18px currentColor;
          }
          30% {
            transform: translate(-50%, -50%) scale(1.1);
          }
          45% {
            transform: translate(-50%, -50%) scale(1.4);
            box-shadow: 0 0 12px currentColor, 0 0 22px currentColor;
          }
          75% {
            transform: translate(-50%, -50%) scale(1);
          }
        }
        @keyframes heartbeat-pulse {
          0% {
            transform: scale(0.8);
            opacity: 0.85;
          }
          15% {
            transform: scale(1.4);
            opacity: 0.7;
          }
          45% {
            transform: scale(2.0);
            opacity: 0;
          }
          100% {
            transform: scale(0.8);
            opacity: 0;
          }
        }
        .callout-label {
          position: absolute; display: flex; flex-direction: column; gap: 1px;
          align-items: center; text-align: center; justify-content: center;
          background: rgba(0, 255, 102, 0.04); backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px);
          border: 1px solid rgba(0, 255, 102, 0.3);
          padding: 3px 6px; border-radius: 6px; transform: translateY(-50%);
          z-index: 20; box-shadow: 0 4px 16px rgba(0,0,0,0.5), inset 0 0 10px rgba(0, 255, 102, 0.05);
          width: max-content; min-width: 52px; white-space: nowrap; transition: transform 0.2s ease, border-color 0.2s ease, background 0.2s ease;
        }
        .callout-label:hover {
          transform: translateY(-50%) scale(1.06);
          background: rgba(0, 255, 102, 0.12);
          border-color: #00ff66;
        }
        .callout-label.side-left {
          right: 72%; border-right: 3px solid var(--color);
          text-align: center; align-items: center;
        }
        .callout-label.side-right {
          left: 72%; border-left: 3px solid var(--color);
          text-align: center; align-items: center;
        }
        .callout-title { font-family: 'Inter', 'Heebo', system-ui, -apple-system, sans-serif; font-size: 9.5px; color: #ffaa00; font-weight: 800; letter-spacing: 0.2px; text-transform: uppercase; line-height: 1.1; }
        .callout-value { font-family: 'Inter', 'Heebo', system-ui, -apple-system, sans-serif; font-size: 14px; font-weight: 900; color: #00ff66; letter-spacing: 0.2px; text-shadow: 0 0 8px rgba(0, 255, 102, 0.8); line-height: 1.1; }
        .progress-glow-bar {
          width: 100%; min-width: 40px; height: 3px; background: rgba(255,255,255,0.1);
          border-radius: 2px; margin-top: 2px; overflow: hidden;
        }
        .progress-glow-fill {
          height: 100%; border-radius: 2px; box-shadow: 0 0 8px #00ff66; transition: width 1s ease-out;
        }
      </style>
      <div class="anatomy-dual-container">
        ${generatePaneHTML(frontCallouts, I18n.t('anatomy_front'), 'images/anatomy-front.webp')}
        ${generatePaneHTML(backCallouts, I18n.t('anatomy_back'), 'images/anatomy-back.webp')}
      </div>`;
  }

  /**
   * Show detailed modal when a muscle group is clicked
   */
  async function showMuscleDetails(muscleKey, muscleName, pct) {
    const muscleExerciseMap = {
      chest: ['DB Floor Press', 'Push-up Bars Progression', 'Push-Up Volume (Day 5)', 'Push-Up', 'Deficit Push-Up', 'Feet-Elevated Push-Up', 'Single-Arm Floor Press', 'Weighted Deficit Push-Up', 'Diamond Push-Up', 'Scapular Push-up'],
      shoulders: ['Seated DB Overhead Press', 'Pike Progression', 'DB Lateral Raise', 'TRX Y-T-W', 'TRX Face Pull', 'Band Pull-Apart', 'Band Neck Flexion & Extension', 'Single-Arm Seated OHP', 'Arm Block - Single-Arm Lateral Raise', 'Scapular Push-up'],
      triceps: ['DB Overhead Triceps Extension', 'Arm Block - DB Overhead Triceps Ext', 'DB Floor Press', 'Push-up Bars Progression', 'Single-Arm Floor Press', 'Diamond Push-Up'],
      biceps: ['DB Curl', 'Hammer Curl', 'Arm Block - Single-Arm Curl', 'Single-Arm Curl', 'Pull-Up Progression', 'Chin-Up Progression', 'One-Arm DB Row', 'TRX Row'],
      forearms: ['Towel Hang', 'Suitcase Carry', 'Dead Hang', 'One-Arm DB Row', 'TRX Row'],
      lats: ['Pull-Up Progression', 'Chin-Up Progression', 'Weighted Pull-Up', 'Weighted Chin-Up', 'One-Arm DB Row', 'Seated Band Row', 'TRX Row', 'Scapular Pull-up'],
      traps: ['Band Neck Flexion & Extension', 'TRX Face Pull', 'TRX Y-T-W', 'Band Pull-Apart', 'One-Arm DB Row', 'TRX Row', 'Scapular Pull-up'],
      quads: ['DB Bulgarian Split Squat', 'Reverse Lunge + DB', 'Pistol Squat', 'Bodyweight Squat', 'DB BSS (Goblet)', 'Walking Lunge (Goblet)'],
      hamstrings: ['DB Romanian Deadlift', 'Single-Leg RDL', 'Glute Bridge', 'DB Glute Bridge'],
      glutes: ['DB Glute Bridge', 'DB Bulgarian Split Squat', 'Single-Leg RDL', 'Reverse Lunge + DB'],
      calves: ['Standing Single-Leg Calf Raise', 'Seated Single-Leg Calf Raise', 'Single-Leg Calf Raise', 'Brisk Walking', 'VO2 Max Norwegian 4x4'],
      core: ['Dead Bug', 'Hollow Body Hold', 'L-sit Tuck (Bars)', 'Suitcase Carry', 'Pallof Press Progression'],
      obliques: ['Suitcase Carry', 'Pallof Press Progression', 'Dead Bug'],
      lowerBack: ['DB Romanian Deadlift', 'Single-Leg RDL', 'DB Glute Bridge', 'Suitcase Carry'],
      neck: ['Deep Mobility Protocol', 'Wall Slides', 'Band Pull-Apart', 'TRX Face Pull', 'Band Neck Flexion & Extension']
    };

    const exerciseNames = muscleExerciseMap[muscleKey] || [I18n.t('anatomy_only_exercises')];

    let trackingMap = {};
    let allPlanDays = [];
    try {
      if (typeof DB !== 'undefined') {
        const trackingList = await DB.getAllTracking();
        if (trackingList) {
          trackingList.forEach(t => { trackingMap[t.dayIndex] = t; });
        }
        allPlanDays = await DB.getAllPlan();
      }
    } catch (e) {
      console.warn('Could not load exercise stats:', e);
    }

    const cleanStr = str => (str || '').toLowerCase().replace(/[^a-z0-9]/g, '');

    const exercises = exerciseNames.map(exName => {
      let totalAppeared = 0;
      let completedCount = 0;
      const targetClean = cleanStr(exName);

      if (allPlanDays && allPlanDays.length > 0) {
        allPlanDays.forEach(day => {
          if (day.exercises && Array.isArray(day.exercises)) {
            const hasEx = day.exercises.some(e => {
              const nameClean = cleanStr(e.name);
              const idClean = cleanStr(e.id);
              return nameClean.includes(targetClean) || targetClean.includes(nameClean) || (idClean && idClean === targetClean);
            });
            if (hasEx) {
              totalAppeared++;
              if (trackingMap[day.dayIndex] && trackingMap[day.dayIndex].completed) {
                completedCount++;
              }
            }
          }
        });
      }

      let exPct = pct;
      if (totalAppeared > 0) {
        exPct = Math.min(100, (completedCount / totalAppeared) * 100);
      }

      const formatScore = (val) => {
        if (val == null || isNaN(val) || val <= 0) return '0%';
        if (val >= 100) return '100%';
        return val.toFixed(1) + '%';
      };

      return {
        name: exName,
        pct: exPct,
        formatted: formatScore(exPct),
        completedCount,
        totalAppeared
      };
    });

    const formatModalScore = (val) => {
      if (val == null || isNaN(val) || val <= 0) return '0%';
      if (val >= 100) return '100%';
      return val.toFixed(1) + '%';
    };

    const modalContent = `
      <style>
        .anatomy-modal-btn {
          width: 100%; padding: 12px; font-size: 14px; font-weight: 800; border-radius: 10px;
          background: rgba(0, 255, 102, 0.1); color: #00ff66; border: 1px solid rgba(0, 255, 102, 0.4);
          box-shadow: 0 0 15px rgba(0, 255, 102, 0.1); cursor: pointer; transition: all 0.2s ease;
        }
        .anatomy-modal-btn:hover {
          background: rgba(0, 255, 102, 0.2);
          border-color: #00ff66;
          box-shadow: 0 0 20px rgba(0, 255, 102, 0.3);
          transform: translateY(-1px);
        }
      </style>
      <div style="padding: 12px 4px; text-align: right;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px;">
          <span style="font-size: 20px; font-weight: 900; color: var(--text-primary);">${muscleName}</span>
          <span style="font-size: 14px; font-weight: 900; color: #00ff66; background: rgba(0, 255, 102, 0.1); border: 1px solid rgba(0, 255, 102, 0.3); padding: 4px 12px; border-radius: 20px; text-shadow: 0 0 8px rgba(0, 255, 102, 0.5); box-shadow: inset 0 0 10px rgba(0, 255, 102, 0.05);">
            💪 ${I18n.t('anatomy_muscle_score')}: ${formatModalScore(pct)}
          </span>
        </div>
        <div style="width: 100%; height: 8px; background: rgba(255,255,255,0.1); border-radius: 4px; overflow: hidden; margin-bottom: 18px;">
          <div style="height: 100%; width: ${Math.min(100, pct)}%; background: #00ff66; border-radius: 4px; box-shadow: 0 0 10px rgba(0, 255, 102, 0.6);"></div>
        </div>

        <h4 style="font-size: 13px; font-weight: 700; color: var(--text-secondary); margin-bottom: 10px;">${I18n.t('anatomy_program_exercises')}</h4>

        <ul style="list-style: none; padding: 0; margin: 0 0 18px 0; display: flex; flex-direction: column; gap: 8px;">
          ${exercises.map(ex => `
            <li style="background: rgba(0, 255, 102, 0.04); border: 1px solid rgba(0, 255, 102, 0.2); padding: 10px 12px; border-radius: 10px; display: flex; flex-direction: column; gap: 6px; box-shadow: 0 4px 16px rgba(0,0,0,0.2);">
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <span style="font-size: 13px; font-weight: 700; color: var(--text-primary); display: flex; align-items: center; gap: 6px;">
                  <span>🏋️‍♂️</span> <span>${ex.name}</span>
                </span>
                <span style="font-size: 12px; font-weight: 900; color: #00ff66; text-shadow: 0 0 8px rgba(0, 255, 102, 0.6);">
                  ${ex.formatted}
                </span>
              </div>
              <div style="width: 100%; height: 5px; background: rgba(255,255,255,0.1); border-radius: 3px; overflow: hidden;">
                <div style="height: 100%; width: ${Math.min(100, ex.pct)}%; background: #00ff66; border-radius: 3px; transition: width 0.6s ease; box-shadow: 0 0 8px #00ff66;"></div>
              </div>
            </li>
          `).join('')}
        </ul>

        <button id="view-ex-dir-btn" class="anatomy-modal-btn">
          📖 ${I18n.t('anatomy_open_guide')}
        </button>
      </div>
    `;

    UI.showModal(`${I18n.t('anatomy_muscle_map')} - ${muscleName}`, modalContent);

    const btn = document.getElementById('view-ex-dir-btn');
    if (btn) {
      btn.onclick = () => {
        const overlay = document.getElementById('modal-overlay');
        if (overlay) overlay.classList.add('hidden');
        if (typeof App !== 'undefined') App.navigateTo('exercises');
      };
    }
  }

  return { render, showMuscleDetails };
})();

window.AnatomyMap = AnatomyMap;
