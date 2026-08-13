/**
 * Anatomy Map Module — v4 Professional
 * 14 muscle groups with weighted multi-exercise contribution model.
 * Positions calibrated with max-width constraint for consistent rendering.
 */
const AnatomyMap = (() => {

  function render(container, muscleData) {
    const getColor = (pct) => {
      if (pct === 0) return 'rgba(255, 255, 255, 0.35)';
      if (pct < 20) return '#ef4444';
      if (pct < 40) return '#f97316';
      if (pct < 60) return '#eab308';
      if (pct < 80) return '#3b82f6';
      if (pct < 100) return '#22d3ee';
      return '#10b981';
    };

    // Safe fallback for all muscle keys
    const keys = ['chest','shoulders','triceps','lats','traps','biceps','forearms',
                  'quads','hamstrings','glutes','calves','core','obliques','lowerBack'];
    const m = {};
    keys.forEach(k => {
      const pct = muscleData[k] != null ? Math.round(muscleData[k]) : 0;
      m[k] = { pct, color: getColor(pct) };
    });

    // Body centered 50%.
    const frontCallouts = [
      // Left labels (User's left, Character's right)
      { id: 'chest-l',    label: I18n.t('muscle_chest'),     pct: m.chest.pct,     color: m.chest.color,     nodeX: 45, nodeY: 25, side: 'left' },
      { id: 'core',       label: I18n.t('muscle_core'),      pct: m.core.pct,      color: m.core.color,      nodeX: 50, nodeY: 38, side: 'left' },
      { id: 'obliques-l', label: I18n.t('muscle_obliques'),  pct: m.obliques.pct,  color: m.obliques.color,  nodeX: 45, nodeY: 48, side: 'left' },
      // Right labels (User's right, Character's left)
      { id: 'shoulders-r',label: I18n.t('muscle_shoulders'), pct: m.shoulders.pct, color: m.shoulders.color, nodeX: 62, nodeY: 21, side: 'right' },
      { id: 'biceps-r',   label: I18n.t('muscle_biceps'),    pct: m.biceps.pct,    color: m.biceps.color,    nodeX: 64, nodeY: 32, side: 'right' },
      { id: 'forearm-r',  label: I18n.t('muscle_forearms'),  pct: m.forearms.pct,  color: m.forearms.color,  nodeX: 67, nodeY: 46, side: 'right' },
      { id: 'quads-r',    label: I18n.t('muscle_quads'),     pct: m.quads.pct,     color: m.quads.color,     nodeX: 55, nodeY: 60, side: 'right' },
      // Symmetric dots
      { hideLabel: true, id: 'shoulders-l', color: m.shoulders.color, nodeX: 38, nodeY: 21 },
      { hideLabel: true, id: 'chest-r',     color: m.chest.color,     nodeX: 55, nodeY: 25 },
      { hideLabel: true, id: 'biceps-l',    color: m.biceps.color,    nodeX: 36, nodeY: 32 },
      { hideLabel: true, id: 'quads-l',     color: m.quads.color,     nodeX: 45, nodeY: 60 },
      { hideLabel: true, id: 'obliques-r',  color: m.obliques.color,  nodeX: 55, nodeY: 48 },
      { hideLabel: true, id: 'forearm-l',   color: m.forearms.color,  nodeX: 33, nodeY: 46 },
    ];

    // ── BACK VIEW ──
    const backCallouts = [
      // Left labels (4)
      { id: 'traps-l',     label: I18n.t('muscle_traps'),      pct: m.traps.pct,       color: m.traps.color,       nodeX: 47, nodeY: 19, side: 'left' },
      { id: 'triceps-l',   label: I18n.t('muscle_triceps'),    pct: m.triceps.pct,     color: m.triceps.color,     nodeX: 36, nodeY: 34, side: 'left' },
      { id: 'lowerBack',   label: I18n.t('muscle_lower_back'), pct: m.lowerBack.pct,   color: m.lowerBack.color,   nodeX: 50, nodeY: 48, side: 'left' },
      { id: 'hamstrings-l',label: I18n.t('muscle_hamstrings'),  pct: m.hamstrings.pct,  color: m.hamstrings.color,  nodeX: 46, nodeY: 64, side: 'left' },
      // Right labels (3)
      { id: 'lats-r',      label: I18n.t('muscle_lats'),       pct: m.lats.pct,        color: m.lats.color,        nodeX: 56, nodeY: 31, side: 'right' },
      { id: 'glutes-r',    label: I18n.t('muscle_glutes'),     pct: m.glutes.pct,      color: m.glutes.color,      nodeX: 54, nodeY: 53, side: 'right' },
      { id: 'calves-r',    label: I18n.t('muscle_calves'),     pct: m.calves.pct,      color: m.calves.color,      nodeX: 54, nodeY: 78, side: 'right' },
      // Symmetric dots
      { hideLabel: true, id: 'traps-r',     color: m.traps.color,       nodeX: 53, nodeY: 19 },
      { hideLabel: true, id: 'lats-l',      color: m.lats.color,        nodeX: 44, nodeY: 31 },
      { hideLabel: true, id: 'triceps-r',   color: m.triceps.color,     nodeX: 64, nodeY: 34 },
      { hideLabel: true, id: 'glutes-l',    color: m.glutes.color,      nodeX: 46, nodeY: 53 },
      { hideLabel: true, id: 'hamstrings-r',color: m.hamstrings.color,  nodeX: 54, nodeY: 64 },
      { hideLabel: true, id: 'calves-l',    color: m.calves.color,      nodeX: 46, nodeY: 78 },
      { hideLabel: true, id: 'midback',     color: m.traps.color,       nodeX: 50, nodeY: 26 },
    ];

    const generatePaneHTML = (callouts, title, imagePath) => {
      const visible = callouts.filter(c => !c.hideLabel);
      return `
        <div class="anatomy-pane">
          <div class="anatomy-inner">
            <div class="pane-title">${title}</div>
            <div class="anatomy-image-bg" style="background-image: url('${imagePath}');"></div>
            <svg class="anatomy-svg-overlay" width="100%" height="100%">
              ${visible.map(c => {
                const lineEnd = c.side === 'left' ? 24 : 76;
                return `<line x1="${c.nodeX}%" y1="${c.nodeY}%" x2="${lineEnd}%" y2="${c.nodeY}%" stroke="${c.color}" stroke-dasharray="3,3" opacity="0.45" stroke-width="1"/>`;
              }).join('')}
            </svg>
            ${visible.map(c => `
              <div class="callout-label side-${c.side}" style="top: ${c.nodeY}%; --color: ${c.color}; cursor: pointer; pointer-events: auto;" onclick="AnatomyMap.showMuscleDetails('${c.id.split('-')[0]}', '${c.label.replace(/'/g, "\\'")}', ${c.pct})">
                <div class="callout-title">${c.label}</div>
                <div class="callout-value" style="color: ${c.color}">${c.pct}%</div>
                <div class="progress-glow-bar"><div class="progress-glow-fill" style="width: ${c.pct}%; background: ${c.color};"></div></div>
              </div>
            `).join('')}
            ${callouts.map(c => `
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
        @media (min-width: 768px) {
          .anatomy-dual-container { grid-template-columns: 1fr 1fr; }
        }
        .anatomy-pane {
          display: flex;
          justify-content: center;
          background: radial-gradient(ellipse at 50% 40%, #0d1a28 0%, #050a10 100%);
          border-radius: var(--radius-xl, 16px);
          border: 1px solid rgba(255,255,255,0.06);
          box-shadow: inset 0 0 60px rgba(0,0,0,0.6), 0 8px 32px rgba(0,0,0,0.3);
          overflow: hidden;
          padding: 0;
        }
        .anatomy-inner {
          position: relative;
          width: 100%;
          max-width: 380px;
          aspect-ratio: 1 / 1;
        }
        .pane-title {
          position: absolute; top: 10px; left: 10px;
          background: rgba(0,0,0,0.7); padding: 4px 10px; border-radius: 7px;
          font-weight: 700; color: white; z-index: 30; font-size: 12px;
          border: 1px solid rgba(255,255,255,0.08); backdrop-filter: blur(6px);
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
          box-shadow: 0 0 8px currentColor, 0 0 16px currentColor;
        }
        .anatomy-node::after {
          content: ''; position: absolute; inset: -3px; border-radius: 50%;
          border: 1px solid currentColor;
          animation: ping-pulse 2.5s cubic-bezier(0,0,0.2,1) infinite;
        }
        @keyframes ping-pulse { 75%,100% { transform: scale(2.5); opacity: 0; } }
        .callout-label {
          position: absolute; display: flex; flex-direction: column; gap: 1px;
          background: rgba(8,12,22,0.92); backdrop-filter: blur(10px);
          border: 1px solid rgba(255,255,255,0.08);
          padding: 3px 7px; border-radius: 5px; transform: translateY(-50%);
          z-index: 20; box-shadow: 0 3px 10px rgba(0,0,0,0.5);
          width: max-content; white-space: nowrap; transition: transform 0.2s ease, border-color 0.2s ease;
        }
        .callout-label:hover {
          transform: translateY(-50%) scale(1.05);
        }
        .callout-label.side-left {
          right: 77%; border-right: 2px solid var(--color);
          text-align: right; align-items: flex-end;
        }
        .callout-label.side-right {
          left: 77%; border-left: 2px solid var(--color);
          text-align: left; align-items: flex-start;
        }
        .callout-title { font-size: 10px; color: rgba(255,255,255,0.7); font-weight: 700; line-height: 1.2; }
        .callout-value { font-size: 12px; font-weight: 900; text-shadow: 0 0 6px currentColor; line-height: 1.2; }
        .progress-glow-bar {
          width: 100%; min-width: 36px; height: 2px; background: rgba(255,255,255,0.06);
          border-radius: 2px; margin-top: 2px; overflow: hidden;
        }
        .progress-glow-fill {
          height: 100%; border-radius: 2px; box-shadow: 0 0 6px currentColor; transition: width 1s ease-out;
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
      chest: ['Dumbbell Floor Press', 'Push-Up', 'Deficit Push-Up', 'Single-Arm Floor Press'],
      shoulders: ['Seated Dumbbell OHP', 'Pike Push-Up', 'Dumbbell Lateral Raise', 'TRX Face Pull'],
      triceps: ['Overhead Triceps Extension', 'Floor Press Lockout', 'Push-Up Lockout'],
      biceps: ['Biceps Curls', 'Hammer Curls', 'Pull-Up / Chin-Up', 'One-Arm DB Row'],
      forearms: ['Towel Hang', 'Suitcase Carry', 'Heavy Pull-Up Grip'],
      lats: ['Pull-Up', 'Chin-Up', 'One-Arm DB Row', 'Scapular Pull-Up'],
      traps: ['TRX Face Pull', 'TRX Y-T-W', 'One-Arm DB Row'],
      quads: ['Bulgarian Split Squat', 'Goblet Squat', 'Reverse Lunge', 'Walking Lunge'],
      hamstrings: ['Dumbbell RDL', 'Single-Leg RDL', 'Glute Bridge', 'Hip Thrust'],
      glutes: ['Dumbbell Hip Thrust', 'Bulgarian Split Squat', 'Single-Leg RDL'],
      calves: ['Single-Leg Calf Raise', 'Brisk Walking', 'VO2 Max 4x4'],
      core: ['Dead Bug', 'Hollow Body Hold', 'L-Sit Tuck', 'Plank'],
      obliques: ['Suitcase Carry', 'Pallof Press', 'Side Plank'],
      lowerBack: ['Dumbbell RDL', 'Single-Leg RDL', 'Hip Thrust']
    };

    const exerciseNames = muscleExerciseMap[muscleKey] || ['תרגילי התוכנית היחידיים המכוונים בקטגוריה זו'];

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
    } catch(e) {
      console.warn('Could not load exercise stats:', e);
    }

    const exercises = exerciseNames.map(exName => {
      let totalAppeared = 0;
      let completedCount = 0;

      if (allPlanDays && allPlanDays.length > 0) {
        allPlanDays.forEach(day => {
          if (day.exercises && Array.isArray(day.exercises)) {
            const hasEx = day.exercises.some(e => e.name && e.name.toLowerCase().includes(exName.toLowerCase()));
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
        exPct = Math.min(100, Math.round((completedCount / totalAppeared) * 100));
      }

      return {
        name: exName,
        pct: exPct,
        completedCount,
        totalAppeared
      };
    });

    const modalContent = `
      <div style="padding: 12px 4px; text-align: right;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px;">
          <span style="font-size: 20px; font-weight: 900; color: var(--text-primary);">${muscleName}</span>
          <span style="font-size: 14px; font-weight: 900; color: #38bdf8; background: rgba(56, 189, 248, 0.15); border: 1px solid rgba(56, 189, 248, 0.3); padding: 4px 12px; border-radius: 20px;">
            💪 ציון שריר: ${pct}%
          </span>
        </div>
        <div style="width: 100%; height: 8px; background: var(--bg-input); border-radius: 4px; overflow: hidden; margin-bottom: 18px;">
          <div style="height: 100%; width: ${pct}%; background: linear-gradient(90deg, #38bdf8, #34d399); border-radius: 4px; box-shadow: 0 0 10px rgba(56, 189, 248, 0.4);"></div>
        </div>

        <h4 style="font-size: 13px; font-weight: 700; color: var(--text-secondary); margin-bottom: 10px;">תרגילים בתוכנית והתקדמות אישית:</h4>

        <ul style="list-style: none; padding: 0; margin: 0 0 18px 0; display: flex; flex-direction: column; gap: 8px;">
          ${exercises.map(ex => `
            <li style="background: rgba(255,255,255,0.04); border: 1px solid var(--border-color); padding: 10px 12px; border-radius: 10px; display: flex; flex-direction: column; gap: 6px;">
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <span style="font-size: 13px; font-weight: 700; color: var(--text-primary); display: flex; align-items: center; gap: 6px;">
                  <span>🏋️‍♂️</span> <span>${ex.name}</span>
                </span>
                <span style="font-size: 12px; font-weight: 800; color: ${ex.pct > 50 ? '#34d399' : '#38bdf8'};">
                  ${ex.pct}%
                </span>
              </div>
              <div style="width: 100%; height: 5px; background: rgba(0,0,0,0.3); border-radius: 3px; overflow: hidden;">
                <div style="height: 100%; width: ${ex.pct}%; background: ${ex.pct > 50 ? 'linear-gradient(90deg, #34d399, #10b981)' : 'linear-gradient(90deg, #38bdf8, #6366f1)'}; border-radius: 3px; transition: width 0.6s ease;"></div>
              </div>
            </li>
          `).join('')}
        </ul>

        <button id="view-ex-dir-btn" class="btn-primary" style="width: 100%; padding: 12px; font-size: 14px; font-weight: 800; border-radius: 10px;">
          📖 פתח את מדריך התרגילים
        </button>
      </div>
    `;

    UI.showModal(`מפת שרירים - ${muscleName}`, modalContent);

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
