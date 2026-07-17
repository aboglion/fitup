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

    // ── FRONT VIEW ──
    // Body centered ~50%. Shoulders ~36/64 Y18. Chest ~44/56 Y26.
    // Biceps ~30/70 Y32. Core ~50 Y38. Obliques ~40/60 Y46.
    // Forearms ~26/74 Y44. Quads ~43/57 Y62.
    const frontCallouts = [
      // Left labels
      { id: 'chest-l',    label: 'חזה',          pct: m.chest.pct,     color: m.chest.color,     nodeX: 44, nodeY: 26, side: 'left' },
      { id: 'core',       label: 'שרירי בטן',    pct: m.core.pct,      color: m.core.color,      nodeX: 50, nodeY: 38, side: 'left' },
      { id: 'obliques-l', label: 'אובליקים',     pct: m.obliques.pct,  color: m.obliques.color,  nodeX: 40, nodeY: 50, side: 'left' },
      // Right labels
      { id: 'shoulders-r',label: 'כתפיים',       pct: m.shoulders.pct, color: m.shoulders.color, nodeX: 64, nodeY: 18, side: 'right' },
      { id: 'biceps-r',   label: 'ביספס',        pct: m.biceps.pct,    color: m.biceps.color,    nodeX: 70, nodeY: 33, side: 'right' },
      { id: 'forearm-r',  label: 'אמות',         pct: m.forearms.pct,  color: m.forearms.color,  nodeX: 74, nodeY: 46, side: 'right' },
      { id: 'quads-r',    label: 'ארבע ראשי',    pct: m.quads.pct,     color: m.quads.color,     nodeX: 57, nodeY: 62, side: 'right' },
      // Symmetric dots
      { hideLabel: true, id: 'shoulders-l', color: m.shoulders.color, nodeX: 36, nodeY: 18 },
      { hideLabel: true, id: 'chest-r',     color: m.chest.color,     nodeX: 56, nodeY: 26 },
      { hideLabel: true, id: 'biceps-l',    color: m.biceps.color,    nodeX: 30, nodeY: 33 },
      { hideLabel: true, id: 'quads-l',     color: m.quads.color,     nodeX: 43, nodeY: 62 },
      { hideLabel: true, id: 'obliques-r',  color: m.obliques.color,  nodeX: 60, nodeY: 50 },
      { hideLabel: true, id: 'forearm-l',   color: m.forearms.color,  nodeX: 26, nodeY: 46 },
    ];

    // ── BACK VIEW ──
    // Traps ~45/55 Y16. Lats ~38/62 Y28. Triceps ~28/72 Y34.
    // LowerBack ~50 Y42. Glutes ~44/56 Y52. Hamstrings ~43/57 Y65. Calves ~44/56 Y80.
    const backCallouts = [
      // Left labels (4)
      { id: 'traps-l',     label: 'טרפז',       pct: m.traps.pct,       color: m.traps.color,       nodeX: 45, nodeY: 16, side: 'left' },
      { id: 'triceps-l',   label: 'טריספס',     pct: m.triceps.pct,     color: m.triceps.color,     nodeX: 28, nodeY: 34, side: 'left' },
      { id: 'lowerBack',   label: 'גב תחתון',   pct: m.lowerBack.pct,   color: m.lowerBack.color,   nodeX: 50, nodeY: 48, side: 'left' },
      { id: 'hamstrings-l',label: 'המסטרינג',    pct: m.hamstrings.pct,  color: m.hamstrings.color,  nodeX: 43, nodeY: 65, side: 'left' },
      // Right labels (3)
      { id: 'lats-r',      label: 'רחב גבי',    pct: m.lats.pct,        color: m.lats.color,        nodeX: 62, nodeY: 28, side: 'right' },
      { id: 'glutes-r',    label: 'ישבן',        pct: m.glutes.pct,      color: m.glutes.color,      nodeX: 56, nodeY: 52, side: 'right' },
      { id: 'calves-r',    label: 'תאומים',      pct: m.calves.pct,      color: m.calves.color,      nodeX: 57, nodeY: 80, side: 'right' },
      // Symmetric dots
      { hideLabel: true, id: 'traps-r',     color: m.traps.color,       nodeX: 55, nodeY: 16 },
      { hideLabel: true, id: 'lats-l',      color: m.lats.color,        nodeX: 38, nodeY: 28 },
      { hideLabel: true, id: 'triceps-r',   color: m.triceps.color,     nodeX: 72, nodeY: 34 },
      { hideLabel: true, id: 'glutes-l',    color: m.glutes.color,      nodeX: 44, nodeY: 52 },
      { hideLabel: true, id: 'hamstrings-r',color: m.hamstrings.color,  nodeX: 57, nodeY: 65 },
      { hideLabel: true, id: 'calves-l',    color: m.calves.color,      nodeX: 43, nodeY: 80 },
      { hideLabel: true, id: 'midback',     color: m.traps.color,       nodeX: 50, nodeY: 24 },
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
              <div class="callout-label side-${c.side}" style="top: ${c.nodeY}%; --color: ${c.color};">
                <div class="callout-title">${c.label}</div>
                <div class="callout-value" style="color: ${c.color}">${c.pct}%</div>
                <div class="progress-glow-bar"><div class="progress-glow-fill" style="width: ${c.pct}%; background: ${c.color};"></div></div>
              </div>
            `).join('')}
            ${callouts.map(c => `
              <div class="anatomy-node" style="left: ${c.nodeX}%; top: ${c.nodeY}%; background-color: ${c.color}; color: ${c.color};"></div>
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
          aspect-ratio: 9 / 16;
        }
        .pane-title {
          position: absolute; top: 10px; left: 10px;
          background: rgba(0,0,0,0.7); padding: 4px 10px; border-radius: 7px;
          font-weight: 700; color: white; z-index: 30; font-size: 12px;
          border: 1px solid rgba(255,255,255,0.08); backdrop-filter: blur(6px);
        }
        .anatomy-image-bg {
          position: absolute; inset: 0;
          background-size: contain; background-position: center; background-repeat: no-repeat;
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
          z-index: 20; pointer-events: none; box-shadow: 0 3px 10px rgba(0,0,0,0.5);
          width: max-content; white-space: nowrap;
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
        ${generatePaneHTML(frontCallouts, 'מבט קדמי (Front)', 'images/anatomy-front.png')}
        ${generatePaneHTML(backCallouts, 'מבט אחורי (Back)', 'images/anatomy-back.png')}
      </div>`;
  }

  return { render };
})();
