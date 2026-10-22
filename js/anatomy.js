/**
 * Anatomy Map Module — v5 Professional with Biomechanical Joint & Injury Engine
 * Dual-Mode:
 * 1. Muscle Progression & Load Map (14 muscle groups + Cardiorespiratory)
 * 2. Joint & Vulnerability Anatomy Map (Interactive 1-Tap Injury & ROM protection)
 */
const AnatomyMap = (() => {
  let currentView = 'muscles'; // 'muscles' | 'joints'
  let lastContainer = null;
  let lastMuscleData = {};

  function setView(view) {
    currentView = view === 'joints' ? 'joints' : 'muscles';
    if (lastContainer) {
      render(lastContainer, lastMuscleData);
    }
  }

  function cycleJoint(jointId) {
    if (typeof InjuryEngine !== 'undefined') {
      const nextState = InjuryEngine.cycleJointState(jointId);
      const jointDef = InjuryEngine.JOINTS[jointId] || { labelKey: jointId };
      const jointName = I18n.t(jointDef.labelKey) || jointId;
      
      let stateName = I18n.t('injury_state_normal');
      if (nextState === 1) stateName = I18n.t('injury_state_sensitive');
      if (nextState === 2) stateName = I18n.t('injury_state_injured');

      if (typeof UI !== 'undefined' && UI.showToast) {
        if (nextState === 2) {
          UI.showToast(`⚠️ ${jointName}: ${stateName} — ${I18n.t('injury_clinical_warning_inline')}`);
        } else {
          UI.showToast(`${jointName}: ${stateName}`);
        }
      }

      if (lastContainer) {
        render(lastContainer, lastMuscleData);
      }

      // If TodayPage is available and on screen, refresh exercise view to apply adaptations immediately
      if (typeof TodayPage !== 'undefined' && typeof TodayPage.refreshCurrentDayView === 'function') {
        TodayPage.refreshCurrentDayView();
      }
    }
  }

  function resetInjuries() {
    if (typeof InjuryEngine !== 'undefined') {
      InjuryEngine.resetAllJoints();
      if (typeof UI !== 'undefined' && UI.showToast) {
        UI.showToast(I18n.t('injury_btn_reset_all'));
      }
      if (lastContainer) {
        render(lastContainer, lastMuscleData);
      }
      if (typeof TodayPage !== 'undefined' && typeof TodayPage.refreshCurrentDayView === 'function') {
        TodayPage.refreshCurrentDayView();
      }
    }
  }

  function openJointsModal() {
    setView('joints');
    const modalDiv = document.createElement('div');
    modalDiv.id = 'anatomy-modal-container';
    modalDiv.style.minHeight = '360px';
    modalDiv.style.padding = '4px 0';
    if (typeof UI !== 'undefined' && UI.showModal) {
      UI.showModal(`🛡️ ${I18n.t('injury_map_title')}`, modalDiv);
      render(modalDiv, lastMuscleData);
    }
  }

  function render(container, muscleData) {
    if (!container) return;
    lastContainer = container;
    lastMuscleData = muscleData || {};

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
      'quads', 'hamstrings', 'glutes', 'calves', 'core', 'obliques', 'lowerBack', 'neck', 'heart', 'lungs'];
    const m = {};
    keys.forEach(k => {
      const rawPct = lastMuscleData[k] != null ? Math.max(0, Math.min(100, Number(lastMuscleData[k]))) : 0;
      m[k] = { pct: rawPct, formatted: formatPct(rawPct), color: getColor(rawPct) };
    });

    // Count active injuries if InjuryEngine exists
    let activeInjuriesCount = 0;
    if (typeof InjuryEngine !== 'undefined') {
      activeInjuriesCount = Object.keys(InjuryEngine.getActiveInjuries()).length;
    }

    // ──────────────────────────────────────────
    // MUSCLE VIEW CALLOUTS
    // ──────────────────────────────────────────
    const frontMuscleCallouts = [
      { id: 'neck', label: I18n.t('muscle_neck'), pct: m.neck.pct, formatted: m.neck.formatted, color: m.neck.color, nodeX: 47.5, nodeY: 18, labelY: 7, side: 'left' },
      { id: 'chest-l', label: I18n.t('muscle_chest'), pct: m.chest.pct, formatted: m.chest.formatted, color: m.chest.color, nodeX: 45, nodeY: 24, labelY: 17, side: 'left' },
      { id: 'lungs', label: I18n.t('muscle_lungs'), pct: m.lungs.pct, formatted: m.lungs.formatted, color: m.lungs.color, nodeX: 47.5, nodeY: 24, labelY: 27, side: 'left' },
      { id: 'core', label: I18n.t('muscle_core'), pct: m.core.pct, formatted: m.core.formatted, color: m.core.color, nodeX: 50, nodeY: 34, labelY: 38, side: 'left' },
      { id: 'obliques-l', label: I18n.t('muscle_obliques'), pct: m.obliques.pct, formatted: m.obliques.formatted, color: m.obliques.color, nodeX: 45, nodeY: 39, labelY: 58, side: 'left' },
      { id: 'shoulders-r', label: I18n.t('muscle_shoulders'), pct: m.shoulders.pct, formatted: m.shoulders.formatted, color: m.shoulders.color, nodeX: 60, nodeY: 19, labelY: 12, side: 'right' },
      { id: 'heart', label: I18n.t('muscle_heart'), pct: m.heart.pct, formatted: m.heart.formatted, color: m.heart.color, nodeX: 53, nodeY: 25.5, labelY: 21.5, side: 'right' },
      { id: 'biceps-r', label: I18n.t('muscle_biceps'), pct: m.biceps.pct, formatted: m.biceps.formatted, color: m.biceps.color, nodeX: 62, nodeY: 30, labelY: 31, side: 'right' },
      { id: 'forearm-r', label: I18n.t('muscle_forearms'), pct: m.forearms.pct, formatted: m.forearms.formatted, color: m.forearms.color, nodeX: 65, nodeY: 40, labelY: 50, side: 'right' },
      { id: 'quads-r', label: I18n.t('muscle_quads'), pct: m.quads.pct, formatted: m.quads.formatted, color: m.quads.color, nodeX: 55, nodeY: 55, labelY: 69, side: 'right' },
    ];

    const backMuscleCallouts = [
      { id: 'traps-l', label: I18n.t('muscle_traps'), pct: m.traps.pct, formatted: m.traps.formatted, color: m.traps.color, nodeX: 46, nodeY: 18, labelY: 14, side: 'left' },
      { id: 'triceps-l', label: I18n.t('muscle_triceps'), pct: m.triceps.pct, formatted: m.triceps.formatted, color: m.triceps.color, nodeX: 39, nodeY: 30, labelY: 33, side: 'left' },
      { id: 'lowerBack', label: I18n.t('muscle_lower_back'), pct: m.lowerBack.pct, formatted: m.lowerBack.formatted, color: m.lowerBack.color, nodeX: 50, nodeY: 42, labelY: 52, side: 'left' },
      { id: 'hamstrings-l', label: I18n.t('muscle_hamstrings'), pct: m.hamstrings.pct, formatted: m.hamstrings.formatted, color: m.hamstrings.color, nodeX: 46, nodeY: 63, labelY: 71, side: 'left' },
      { id: 'lats-r', label: I18n.t('muscle_lats'), pct: m.lats.pct, formatted: m.lats.formatted, color: m.lats.color, nodeX: 56, nodeY: 33, labelY: 28, side: 'right' },
      { id: 'glutes-r', label: I18n.t('muscle_glutes'), pct: m.glutes.pct, formatted: m.glutes.formatted, color: m.glutes.color, nodeX: 54, nodeY: 51, labelY: 49, side: 'right' },
      { id: 'calves-r', label: I18n.t('muscle_calves'), pct: m.calves.pct, formatted: m.calves.formatted, color: m.calves.color, nodeX: 54, nodeY: 77, labelY: 70, side: 'right' },
    ];

    // ──────────────────────────────────────────
    // JOINT & INJURY VIEW CALLOUTS
    // ──────────────────────────────────────────
    const getJointVisuals = (jId) => {
      let state = 0;
      if (typeof InjuryEngine !== 'undefined') {
        state = InjuryEngine.getJointState(jId);
      }
      if (state === 2) {
        return {
          state,
          color: '#ef4444',
          badgeText: '🔴 ' + I18n.t('injury_state_injured'),
          shortVal: 'פציעה'
        };
      }
      if (state === 1) {
        return {
          state,
          color: '#f59e0b',
          badgeText: '🟡 ' + I18n.t('injury_state_sensitive'),
          shortVal: 'רגישות'
        };
      }
      return {
        state,
        color: '#00ff66',
        badgeText: '🟢 ' + I18n.t('injury_state_normal'),
        shortVal: 'תקין'
      };
    };

    const frontJointCallouts = [
      { id: 'neck', jointId: 'neck', label: I18n.t('joint_neck'), side: 'left', nodeX: 47.5, nodeY: 18, labelY: 8 },
      { id: 'shoulder_r', jointId: 'shoulder_r', label: I18n.t('joint_shoulder_r'), side: 'left', nodeX: 41, nodeY: 22, labelY: 19 },
      { id: 'elbow_r', jointId: 'elbow_r', label: I18n.t('joint_elbow_r'), side: 'left', nodeX: 35, nodeY: 34, labelY: 31 },
      { id: 'wrist_r', jointId: 'wrist_r', label: I18n.t('joint_wrist_r'), side: 'left', nodeX: 30, nodeY: 46, labelY: 45 },
      { id: 'knee_r', jointId: 'knee_r', label: I18n.t('joint_knee_r'), side: 'left', nodeX: 44, nodeY: 62, labelY: 67 },

      { id: 'shoulder_l', jointId: 'shoulder_l', label: I18n.t('joint_shoulder_l'), side: 'right', nodeX: 59, nodeY: 22, labelY: 19 },
      { id: 'elbow_l', jointId: 'elbow_l', label: I18n.t('joint_elbow_l'), side: 'right', nodeX: 65, nodeY: 34, labelY: 31 },
      { id: 'wrist_l', jointId: 'wrist_l', label: I18n.t('joint_wrist_l'), side: 'right', nodeX: 70, nodeY: 46, labelY: 45 },
      { id: 'knee_l', jointId: 'knee_l', label: I18n.t('joint_knee_l'), side: 'right', nodeX: 56, nodeY: 62, labelY: 67 }
    ].map(item => {
      const v = getJointVisuals(item.jointId);
      return {
        ...item,
        color: v.color,
        formatted: v.shortVal,
        badgeText: v.badgeText,
        state: v.state,
        isJoint: true
      };
    });

    const backJointCallouts = [
      { id: 'lower_back', jointId: 'lower_back', label: I18n.t('joint_lower_back'), side: 'left', nodeX: 50, nodeY: 42, labelY: 40 },
      { id: 'achilles_l', jointId: 'achilles_l', label: I18n.t('joint_achilles_l'), side: 'left', nodeX: 46, nodeY: 82, labelY: 76 },
      { id: 'achilles_r', jointId: 'achilles_r', label: I18n.t('joint_achilles_r'), side: 'right', nodeX: 54, nodeY: 82, labelY: 76 }
    ].map(item => {
      const v = getJointVisuals(item.jointId);
      return {
        ...item,
        color: v.color,
        formatted: v.shortVal,
        badgeText: v.badgeText,
        state: v.state,
        isJoint: true
      };
    });

    const activeFrontCallouts = currentView === 'joints' ? frontJointCallouts : frontMuscleCallouts;
    const activeBackCallouts = currentView === 'joints' ? backJointCallouts : backMuscleCallouts;

    const generatePaneHTML = (callouts, title, imagePath) => {
      return `
        <div class="anatomy-pane">
          <div class="anatomy-inner">
            <div class="anatomy-image-bg" style="background-image: url('${imagePath}');"></div>
            <svg class="anatomy-svg-overlay" viewBox="0 0 100 100" preserveAspectRatio="none" width="100%" height="100%">
              ${callouts.map(c => {
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
            ${callouts.map(c => {
              const labelY = c.labelY !== undefined ? c.labelY : c.nodeY;
              const clickAction = c.isJoint 
                ? `AnatomyMap.cycleJoint('${c.jointId}')`
                : `AnatomyMap.showMuscleDetails('${c.id.split('-')[0]}', '${c.label.replace(/'/g, "\\'")}', ${c.pct || 0})`;
              return `
                <div class="callout-label side-${c.side} ${c.isJoint ? 'joint-callout' : ''}" 
                     style="top: ${labelY}%; --color: ${c.color}; cursor: pointer; pointer-events: auto;" 
                     onclick="${clickAction}"
                     title="${c.isJoint ? I18n.t('injury_map_subtitle') : ''}">
                  <div class="callout-title">${c.label}</div>
                  <div class="callout-value" style="color: ${c.color}; text-shadow: 0 0 8px ${c.color};">
                    ${c.isJoint ? c.badgeText : c.formatted}
                  </div>
                  ${!c.isJoint ? `
                    <div class="progress-glow-bar"><div class="progress-glow-fill" style="width: ${Math.min(100, c.pct)}%; background: ${c.pct > 0 ? '#00ff66' : 'rgba(255,255,255,0.2)'};"></div></div>
                  ` : `
                    <div class="joint-state-pill" style="font-size: 8px; text-transform: uppercase; letter-spacing: 0.5px; opacity: 0.85; margin-top: 1px;">
                      ${c.state === 0 ? '🟢 ' + I18n.t('injury_state_normal') : (c.state === 1 ? '🟡 ' + I18n.t('injury_state_sensitive') : '🔴 ' + I18n.t('injury_state_injured'))}
                    </div>
                  `}
                </div>
              `;
            }).join('')}
            ${callouts.map(c => {
              const clickAction = c.isJoint 
                ? `AnatomyMap.cycleJoint('${c.jointId}')`
                : `AnatomyMap.showMuscleDetails('${c.id.split('-')[0]}', '${(c.label || c.id).replace(/'/g, "\\'")}', ${c.pct || 0})`;
              return `
                <div class="anatomy-node ${c.isJoint ? 'joint-node' : ''}" 
                     style="left: ${c.nodeX}%; top: ${c.nodeY}%; background-color: ${c.color}; color: ${c.color}; cursor: pointer; pointer-events: auto;" 
                     onclick="${clickAction}"></div>
              `;
            }).join('')}
          </div>
        </div>`;
    };

    container.innerHTML = `
      <style>
        .anatomy-view-switcher-bar {
          display: flex;
          justify-content: center;
          gap: 10px;
          margin-bottom: 12px;
          padding: 4px;
          background: rgba(0, 0, 0, 0.4);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
        }
        .anatomy-tab-btn {
          flex: 1;
          max-width: 200px;
          padding: 8px 14px;
          font-size: 13px;
          font-weight: 800;
          border-radius: 8px;
          border: 1px solid transparent;
          background: transparent;
          color: var(--text-secondary);
          cursor: pointer;
          transition: all 0.2s ease;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
        }
        .anatomy-tab-btn:hover {
          color: var(--text-primary);
          background: rgba(255, 255, 255, 0.05);
        }
        .anatomy-tab-btn.active {
          background: rgba(0, 255, 102, 0.12);
          border-color: rgba(0, 255, 102, 0.5);
          color: #00ff66;
          box-shadow: 0 0 12px rgba(0, 255, 102, 0.2);
        }
        .anatomy-tab-btn.active.joint-tab {
          background: rgba(245, 158, 11, 0.12);
          border-color: rgba(245, 158, 11, 0.5);
          color: #f59e0b;
          box-shadow: 0 0 12px rgba(245, 158, 11, 0.2);
        }
        .active-injury-pill {
          background: #ef4444;
          color: white;
          font-size: 10px;
          font-weight: 900;
          padding: 1px 6px;
          border-radius: 10px;
          animation: pulseRed 1.5s infinite;
        }
        @keyframes pulseRed {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.15); opacity: 0.85; }
        }
        .joints-info-card {
          background: rgba(0, 0, 0, 0.35);
          border: 1px solid rgba(245, 158, 11, 0.3);
          border-radius: 10px;
          padding: 10px 14px;
          margin-bottom: 12px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 8px;
          font-size: 12px;
          color: var(--text-primary);
        }
        .btn-reset-injuries {
          background: rgba(239, 68, 68, 0.15);
          border: 1px solid rgba(239, 68, 68, 0.4);
          color: #f87171;
          padding: 4px 10px;
          border-radius: 6px;
          font-size: 11px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .btn-reset-injuries:hover {
          background: rgba(239, 68, 68, 0.3);
          border-color: #ef4444;
          color: #ffffff;
        }
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
          background: transparent !important;
          border: none !important;
          border-radius: var(--radius-xl, 16px);
          box-shadow: none !important;
          overflow: visible;
          padding: 4px 0;
          position: relative;
        }
        .anatomy-inner {
          position: relative;
          width: 100%;
          max-width: 380px;
          aspect-ratio: 1 / 1;
          background: transparent;
        }
        .anatomy-image-bg {
          position: absolute; inset: 0;
          background-size: cover; background-position: center; background-repeat: no-repeat;
          opacity: 0.98;
          -webkit-mask-image: linear-gradient(to right, transparent 0%, black 10%, black 90%, transparent 100%),
                              linear-gradient(to bottom, transparent 0%, black 8%, black 92%, transparent 100%);
          -webkit-mask-composite: source-in;
          mask-image: linear-gradient(to right, transparent 0%, black 10%, black 90%, transparent 100%),
                      linear-gradient(to bottom, transparent 0%, black 8%, black 92%, transparent 100%);
          mask-composite: intersect;
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
          0% { transform: scale(0.8); opacity: 0.85; }
          15% { transform: scale(1.4); opacity: 0.7; }
          45% { transform: scale(2.0); opacity: 0; }
          100% { transform: scale(0.8); opacity: 0; }
        }
        .callout-label {
          position: absolute; display: flex; flex-direction: column; gap: 1px;
          align-items: center; text-align: center; justify-content: center;
          background: rgba(0, 0, 0, 0.65); backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px);
          border: 1px solid var(--color);
          padding: 3px 6px; border-radius: 6px; transform: translateY(-50%);
          z-index: 20; box-shadow: 0 4px 16px rgba(0,0,0,0.6), inset 0 0 10px rgba(0, 255, 102, 0.05);
          width: max-content; min-width: 52px; white-space: nowrap; transition: transform 0.2s ease, border-color 0.2s ease, background 0.2s ease;
        }
        .callout-label:hover {
          transform: translateY(-50%) scale(1.06);
          background: rgba(0, 0, 0, 0.85);
          border-color: var(--color);
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
        .callout-value { font-family: 'Inter', 'Heebo', system-ui, -apple-system, sans-serif; font-size: 13px; font-weight: 900; letter-spacing: 0.2px; line-height: 1.1; }
        .progress-glow-bar {
          width: 100%; min-width: 40px; height: 3px; background: rgba(255,255,255,0.1);
          border-radius: 2px; margin-top: 2px; overflow: hidden;
        }
        .progress-glow-fill {
          height: 100%; border-radius: 2px; box-shadow: 0 0 8px #00ff66; transition: width 1s ease-out;
        }
      </style>

      <div class="anatomy-view-switcher-bar">
        <button type="button" class="anatomy-tab-btn ${currentView === 'muscles' ? 'active' : ''}" onclick="AnatomyMap.setView('muscles')">
          ${I18n.t('injury_map_tab_muscles')}
        </button>
        <button type="button" class="anatomy-tab-btn joint-tab ${currentView === 'joints' ? 'active' : ''}" onclick="AnatomyMap.setView('joints')">
          ${I18n.t('injury_map_tab_joints')} ${activeInjuriesCount > 0 ? `<span class="active-injury-pill">${activeInjuriesCount}</span>` : ''}
        </button>
      </div>

      ${currentView === 'joints' ? `
        <div class="joints-info-card">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span>🛡️</span>
            <span>${I18n.t('injury_map_subtitle')}</span>
          </div>
          ${activeInjuriesCount > 0 ? `
            <button type="button" class="btn-reset-injuries" onclick="AnatomyMap.resetInjuries()">
              ↩️ ${I18n.t('injury_btn_reset_all')}
            </button>
          ` : ''}
        </div>
        ${typeof InjuryEngine !== 'undefined' && InjuryEngine.hasInjuredJoints && InjuryEngine.hasInjuredJoints() ? `
          <div class="clinical-safety-alert" style="background: rgba(239, 68, 68, 0.12); border: 1px solid rgba(239, 68, 68, 0.4); border-radius: 10px; padding: 10px 14px; margin-bottom: 12px; font-size: 11.5px; color: #fca5a5; line-height: 1.45;">
            <strong>⚠️ ${I18n.t('injury_clinical_warning_title')}:</strong> ${I18n.t('injury_clinical_warning_body')}
          </div>
        ` : ''}
      ` : ''}

      <div class="anatomy-dual-container">
        ${generatePaneHTML(activeFrontCallouts, I18n.t('anatomy_front'), 'images/anatomy-front.webp')}
        ${generatePaneHTML(activeBackCallouts, I18n.t('anatomy_back'), 'images/anatomy-back.webp')}
      </div>`;
  }

  const muscleExerciseMap = {
    chest: ['Single-Arm Floor Press', 'Push-up Bars Progression', 'Push-Up Volume (Day 5)', 'Deficit Push-Up', 'Feet-Elevated Push-Up', 'Weighted Deficit Push-Up', 'Diamond Push-Up', 'Scapular Push-up'],
    shoulders: ['Single-Arm Seated OHP', 'Pike Progression', 'Elevated Pike Push-Up', 'Wall Walk (Partial)', 'Wall Walk (Full)', 'Wall Handstand', 'Single-Arm Lateral Raise', 'Arm Block - Single-Arm Lateral Raise', 'TRX Y-T-W', 'TRX Face Pull', 'Scapular Push-up', 'Arm Circles', 'Wall Slides', 'Band Pull-Apart', 'Feet-Elevated Push-Up', 'Band Neck Flexion & Extension'],
    triceps: ['DB Overhead Triceps Extension', 'Arm Block - DB Overhead Triceps Ext', 'Single-Arm Floor Press', 'Push-up Bars Progression', 'Diamond Push-Up', 'Single-Arm Seated OHP', 'Deficit Push-Up', 'Feet-Elevated Push-Up', 'Weighted Deficit Push-Up', 'Elevated Pike Push-Up', 'Pike Progression', 'Push-Up Volume (Day 5)'],
    biceps: ['Single-Arm Curl', 'Single-Arm Hammer Curl', 'Arm Block - Single-Arm Curl', 'Chin-Up', 'Band-Assisted Chin-Up', 'Weighted Chin-Up', 'Chin-Up Progression', 'Pull-Up Progression', 'Band-Assisted Pull-Up', 'Pull-Up (Overhand)', 'Weighted Pull-Up', 'One-Arm DB Row', 'TRX Row', 'Seated Band Row'],
    forearms: ['Dead Hang', 'Towel Hang', 'Suitcase Carry', 'One-Arm DB Row', 'TRX Row', 'Chin-Up', 'Band-Assisted Chin-Up', 'Weighted Chin-Up', 'Pull-Up Progression', 'Band-Assisted Pull-Up', 'Pull-Up (Overhand)', 'Weighted Pull-Up', 'Single-Arm Hammer Curl', 'Seated Band Row'],
    lats: ['Pull-Up Progression', 'Band-Assisted Pull-Up', 'Pull-Up (Overhand)', 'Weighted Pull-Up', 'Chin-Up', 'Band-Assisted Chin-Up', 'Weighted Chin-Up', 'Chin-Up Progression', 'One-Arm DB Row', 'Seated Band Row', 'TRX Row', 'Scapular Pull-up'],
    traps: ['TRX Face Pull', 'TRX Y-T-W', 'Band Pull-Apart', 'Scapular Pull-up', 'One-Arm DB Row', 'Seated Band Row', 'Wall Slides', 'Deep Mobility Protocol', 'Band Neck Flexion & Extension'],
    quads: ['Heels-Elevated Goblet Squat', 'Goblet Bulgarian Split Squat', 'Bodyweight Squat', 'High Knees', 'Brisk Walking', 'VO2 Max Norwegian 4x4', 'Relaxed Walking', 'Wall Sit'],
    hamstrings: ['Goblet Romanian Deadlift', 'Single-Leg RDL', 'Nordic Curl Progression', 'Glute Bridge', 'DB Glute Bridge', 'Single-Leg Glute Bridge'],
    glutes: ['DB Glute Bridge', 'Glute Bridge', 'Goblet Bulgarian Split Squat', 'Heels-Elevated Goblet Squat', 'Single-Leg RDL', 'Bodyweight Squat', 'Goblet Romanian Deadlift', 'Nordic Curl Progression', 'Single-Leg Glute Bridge', 'Wall Sit'],
    calves: ['Standing Single-Leg Calf Raise', 'Seated Single-Leg Calf Raise', 'Brisk Walking', 'VO2 Max Norwegian 4x4', 'Relaxed Walking', 'Wall Sit'],
    core: ['Dead Bug', 'Hollow Body Hold', 'Foot-Supported L-Sit', 'Tuck L-Sit', 'One-Leg Extended L-Sit', 'Full L-Sit', 'Suitcase Carry', 'Pallof Press Progression', 'High Knees', 'Deficit Push-Up', 'Heels-Elevated Goblet Squat', 'Micro Mobility Protocol', 'Push-Up Volume (Day 5)', 'Push-up Bars Progression', 'Scapular Push-up', 'Wall Handstand', 'Wall Walk (Full)', 'Wall Walk (Partial)', 'Weighted Deficit Push-Up', 'Single-Leg Glute Bridge'],
    obliques: ['Suitcase Carry', 'Pallof Press Progression', 'Dead Bug', 'Single-Arm Floor Press', 'Single-Arm Seated OHP', 'Foot-Supported L-Sit', 'Tuck L-Sit', 'One-Leg Extended L-Sit', 'Full L-Sit', 'Hollow Body Hold'],
    lowerBack: ['Goblet Romanian Deadlift', 'Single-Leg RDL', 'DB Glute Bridge', 'Suitcase Carry'],
    neck: ['Band Neck Flexion & Extension', 'Deep Mobility Protocol', 'Micro Mobility Protocol', 'TRX Face Pull', 'Wall Slides', 'Band Pull-Apart'],
    heart: ['VO2 Max Norwegian 4x4', 'Brisk Walking', 'Relaxed Walking', 'High Knees', 'Heels-Elevated Goblet Squat', 'Goblet Bulgarian Split Squat', 'Push-Up Volume (Day 5)', 'Pull-Up Progression', 'Band-Assisted Pull-Up', 'Band-Assisted Chin-Up'],
    lungs: ['VO2 Max Norwegian 4x4', 'Brisk Walking', 'Relaxed Walking', 'High Knees', 'Heels-Elevated Goblet Squat', 'Goblet Bulgarian Split Squat', 'Push-Up Volume (Day 5)', 'Pull-Up Progression', 'Band-Assisted Pull-Up', 'Band-Assisted Chin-Up']
  };

  /**
   * Helper to retrieve all muscles targeted by an exercise name
   */
  function getMusclesForExercise(exerciseName) {
    if (!exerciseName) return [];
    const clean = (exerciseName || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    const matches = [];
    for (const [mKey, exList] of Object.entries(muscleExerciseMap)) {
      if (exList.some(e => {
        const c = e.toLowerCase().replace(/[^a-z0-9]/g, '');
        return c === clean || c.includes(clean) || clean.includes(c);
      })) {
        matches.push(mKey);
      }
    }
    return matches;
  }

  /**
   * Show detailed modal when a muscle group is clicked
   */
  async function showMuscleDetails(muscleKey, muscleName, pct) {
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
    if ((!allPlanDays || allPlanDays.length === 0) && typeof window !== 'undefined' && window.TRAINING_DATA && window.TRAINING_DATA.daily) {
      allPlanDays = window.TRAINING_DATA.daily;
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
              const trk = trackingMap[day.dayIndex];
              if (trk) {
                if (trk.completed) {
                  completedCount++;
                } else if (trk.exerciseStatus) {
                  const exIdxInDay = day.exercises.findIndex(e => {
                    const nameClean = cleanStr(e.name);
                    const idClean = cleanStr(e.id);
                    return nameClean.includes(targetClean) || targetClean.includes(nameClean) || (idClean && idClean === targetClean);
                  });
                  if (exIdxInDay >= 0 && (trk.exerciseStatus[exIdxInDay] || trk.exerciseStatus[String(exIdxInDay)])) {
                    completedCount++;
                  }
                }
              }
            }
          }
        });
      }

      let exPct = 0;
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

    const muscleJointMap = {
      quads: ['knee_r', 'knee_l'],
      hamstrings: ['knee_r', 'knee_l', 'lower_back'],
      glutes: ['knee_r', 'knee_l', 'lower_back'],
      chest: ['shoulder_r', 'shoulder_l', 'elbow_r', 'elbow_l', 'wrist_r', 'wrist_l'],
      shoulders: ['shoulder_r', 'shoulder_l', 'neck'],
      triceps: ['elbow_r', 'elbow_l', 'shoulder_r', 'shoulder_l'],
      biceps: ['elbow_r', 'elbow_l', 'wrist_r', 'wrist_l'],
      forearms: ['wrist_r', 'wrist_l', 'elbow_r', 'elbow_l'],
      lats: ['shoulder_r', 'shoulder_l', 'elbow_r', 'elbow_l'],
      traps: ['neck', 'shoulder_r', 'shoulder_l'],
      calves: ['achilles_r', 'achilles_l'],
      lowerBack: ['lower_back'],
      core: ['lower_back'],
      obliques: ['lower_back'],
      neck: ['neck']
    };

    let activeJointAlertHTML = '';
    if (typeof InjuryEngine !== 'undefined') {
      const relJoints = muscleJointMap[muscleKey] || [];
      const affected = relJoints.filter(jId => InjuryEngine.getJointState(jId) > 0);
      if (affected.length > 0) {
        const chips = affected.map(jId => {
          const jDef = InjuryEngine.JOINTS[jId] || { labelKey: jId };
          const jName = I18n.t(jDef.labelKey) || jId;
          const state = InjuryEngine.getJointState(jId);
          const icon = state === 2 ? '🔴' : '🟡';
          const txt = state === 2 ? I18n.t('injury_state_injured') : I18n.t('injury_state_sensitive');
          const col = state === 2 ? '#ef4444' : '#f59e0b';
          return `<span style="font-size: 11px; font-weight: 700; color: ${col}; background: ${col}20; border: 1px solid ${col}50; padding: 2px 7px; border-radius: 6px;">${icon} ${jName}: ${txt}</span>`;
        }).join(' ');

        activeJointAlertHTML = `
          <div style="background: rgba(245, 158, 11, 0.12); border: 1px solid rgba(245, 158, 11, 0.4); border-radius: 10px; padding: 10px 12px; margin-bottom: 14px; display: flex; flex-direction: column; gap: 6px;">
            <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 6px;">
              <span style="font-weight: 800; font-size: 12px; color: #fbbf24; display: flex; align-items: center; gap: 6px;">
                <span>🛡️</span> <span>${I18n.t('injury_muscle_alert')}</span>
              </span>
              <button type="button" style="background: rgba(245, 158, 11, 0.2); border: 1px solid rgba(245, 158, 11, 0.5); color: #fbbf24; border-radius: 6px; padding: 2px 8px; font-size: 11px; font-weight: 700; cursor: pointer;" onclick="AnatomyMap.openJointsModal();">
                ${I18n.t('today_injury_banner_btn')}
              </button>
            </div>
            <div style="display: flex; flex-wrap: wrap; gap: 6px;">
              ${chips}
            </div>
          </div>
        `;
      }
    }

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

        ${activeJointAlertHTML}

        <h4 style="font-size: 13px; font-weight: 700; color: var(--text-secondary); margin-bottom: 8px;">${I18n.t('anatomy_program_exercises')}</h4>
        <div style="background: rgba(0, 255, 102, 0.06); border: 1px solid rgba(0, 255, 102, 0.2); border-radius: 8px; padding: 8px 10px; margin-bottom: 12px; font-size: 11px; color: var(--text-secondary); line-height: 1.4;">
          ${I18n.t('cadence_model_banner')}
        </div>

        <ul style="list-style: none; padding: 0; margin: 0 0 18px 0; display: flex; flex-direction: column; gap: 8px;">
          ${exercises.map(ex => {
            const nameLower = (ex.name || '').toLowerCase();
            const isBW = nameLower.includes('bodyweight') || nameLower.includes('band') || nameLower.includes('walking') || 
                         nameLower.includes('mobility') || nameLower.includes('dead bug') || nameLower.includes('hollow') || 
                         nameLower.includes('pull-up') || nameLower.includes('push-up') || nameLower.includes('wall sit') || 
                         nameLower.includes('single-leg glute bridge') || nameLower.includes('nordic') || nameLower.includes('hang') || 
                         nameLower.includes('l-sit') || nameLower.includes('wall walk') || nameLower.includes('handstand') || 
                         nameLower.includes('high knees') || nameLower.includes('wrist rocks');
            const isWeighted = !isBW;
            const isGrpB = nameLower.includes('lateral raise') || (nameLower.includes('curl') && !nameLower.includes('nordic')) || nameLower.includes('triceps') || nameLower.includes('calf');
            const cadenceBadge = isWeighted
              ? (isGrpB
                  ? `<span style="font-size: 10px; font-weight: 700; color: #c084fc; background: rgba(168, 85, 247, 0.15); border: 1px solid rgba(168, 85, 247, 0.35); padding: 2px 6px; border-radius: 4px;">🎯 ${I18n.t('cadence_group_b_short')}</span>`
                  : `<span style="font-size: 10px; font-weight: 700; color: #60a5fa; background: rgba(59, 130, 246, 0.15); border: 1px solid rgba(59, 130, 246, 0.35); padding: 2px 6px; border-radius: 4px;">⚡ ${I18n.t('cadence_group_a_short')}</span>`)
              : '';
            const isArmBlock = nameLower.includes('arm block');
            const armBlockBadge = isArmBlock
              ? `<span style="font-size: 10px; font-weight: 700; color: #f87171; background: rgba(239, 68, 68, 0.15); border: 1px solid rgba(239, 68, 68, 0.35); padding: 2px 6px; border-radius: 4px;">🔥 Myo (W3+ Ramp)</span>`
              : '';

            let injuryBadge = '';
            if (typeof InjuryEngine !== 'undefined') {
              const ad = InjuryEngine.getExerciseAdaptation(ex.name);
              if (ad) {
                if (ad.type === 'injured') {
                  injuryBadge = `<span style="font-size: 10px; font-weight: 800; color: #f87171; background: rgba(239, 68, 68, 0.18); border: 1px solid rgba(239, 68, 68, 0.45); padding: 2px 6px; border-radius: 4px;">🚨 ${I18n.t('injury_badge_swapped')}: ${I18n.t(ad.substituteName) || ad.substituteName}</span>`;
                } else if (ad.type === 'sensitive') {
                  injuryBadge = `<span style="font-size: 10px; font-weight: 800; color: #fbbf24; background: rgba(245, 158, 11, 0.18); border: 1px solid rgba(245, 158, 11, 0.45); padding: 2px 6px; border-radius: 4px;">🛡️ ${I18n.t('injury_badge_rom_shield')}</span>`;
                }
              }
            }

            return `
            <li style="background: rgba(0, 255, 102, 0.04); border: 1px solid rgba(0, 255, 102, 0.2); padding: 10px 12px; border-radius: 10px; display: flex; flex-direction: column; gap: 6px; box-shadow: 0 4px 16px rgba(0,0,0,0.2);">
              <div style="display: flex; justify-content: space-between; align-items: center; gap: 6px;">
                <span style="font-size: 13px; font-weight: 700; color: var(--text-primary); display: flex; align-items: center; gap: 6px; flex-wrap: wrap;">
                  <span>🏋️‍♂️</span> <span>${ex.name}</span> ${cadenceBadge} ${armBlockBadge} ${injuryBadge}
                </span>
                <span style="font-size: 12px; font-weight: 900; color: #00ff66; text-shadow: 0 0 8px rgba(0, 255, 102, 0.6); flex-shrink: 0;">
                  ${ex.formatted}
                </span>
              </div>
              <div style="width: 100%; height: 5px; background: rgba(255,255,255,0.1); border-radius: 3px; overflow: hidden;">
                <div style="height: 100%; width: ${Math.min(100, ex.pct)}%; background: #00ff66; border-radius: 3px; transition: width 0.6s ease; box-shadow: 0 0 8px #00ff66;"></div>
              </div>
            </li>
          `;}).join('')}
        </ul>

        <div style="display: flex; gap: 8px; margin-top: 6px;">
          <button id="view-ex-dir-btn" class="anatomy-modal-btn" style="flex: 1;">
            📖 ${I18n.t('anatomy_open_guide')}
          </button>
          <button type="button" class="anatomy-modal-btn" style="flex: 1; background: rgba(16, 185, 129, 0.12); color: #10b981; border-color: rgba(16, 185, 129, 0.4);" onclick="AnatomyMap.openJointsModal();">
            🛡️ ${I18n.t('injury_map_tab_joints')}
          </button>
        </div>
      </div>
    `;

    UI.showModal(`${I18n.t('anatomy_muscle_map')} - ${muscleName}`, modalContent);

    if (typeof document !== 'undefined') {
      const btn = document.getElementById('view-ex-dir-btn');
      if (btn) {
        btn.onclick = () => {
          const overlay = document.getElementById('modal-overlay');
          if (overlay) overlay.classList.add('hidden');
          if (typeof App !== 'undefined') App.navigateTo('exercises');
        };
      }
    }
  }

  return {
    render,
    showMuscleDetails,
    setView,
    cycleJoint,
    resetInjuries,
    openJointsModal,
    getMusclesForExercise
  };
})();

if (typeof window !== 'undefined') {
  window.AnatomyMap = AnatomyMap;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AnatomyMap;
}
