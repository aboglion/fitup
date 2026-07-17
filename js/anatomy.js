/**
 * Anatomy Map Module (Dual 2D Images Overlay)
 * Shows Front and Back views side by side with per-muscle progression highlights.
 * Each muscle gets its own percentage based on exercise progression stages × completion rate.
 */
const AnatomyMap = (() => {

  function render(container, muscleData) {
    const getColor = (pct) => {
      if (pct === 0) return 'rgba(255, 255, 255, 0.4)';
      if (pct < 20) return '#ef4444';
      if (pct < 40) return '#f97316';
      if (pct < 60) return '#eab308';
      if (pct < 80) return '#3b82f6';
      if (pct < 100) return '#22d3ee';
      return '#10b981'; // green / max
    };

    // Build per-muscle color map
    const m = {};
    for (const [key, pct] of Object.entries(muscleData)) {
      m[key] = { pct: Math.round(pct), color: getColor(pct) };
    }

    // Callouts for Front View — positions calibrated to standard anatomy front image
    const frontCallouts = [
      // Labeled callouts
      { id: 'shoulders-r', label: 'כתפיים',      pct: m.shoulders.pct, color: m.shoulders.color, nodeX: 64, nodeY: 21, side: 'right' },
      { id: 'chest',       label: 'חזה',          pct: m.chest.pct,     color: m.chest.color,     nodeX: 46, nodeY: 29, side: 'left' },
      { id: 'biceps-r',    label: 'יד קדמית',     pct: m.biceps.pct,    color: m.biceps.color,    nodeX: 69, nodeY: 36, side: 'right' },
      { id: 'core',        label: 'שרירי ליבה',   pct: m.core.pct,      color: m.core.color,      nodeX: 48, nodeY: 42, side: 'left' },
      { id: 'obliques-l',  label: 'אובליקים',     pct: m.obliques.pct,  color: m.obliques.color,  nodeX: 40, nodeY: 48, side: 'left' },
      { id: 'quads-r',     label: 'ארבע ראשי',    pct: m.quads.pct,     color: m.quads.color,     nodeX: 57, nodeY: 67, side: 'right' },
      // Hidden dot-only markers (symmetric counterparts)
      { hideLabel: true, id: 'shoulders-l', color: m.shoulders.color, nodeX: 36, nodeY: 21 },
      { hideLabel: true, id: 'biceps-l',    color: m.biceps.color,    nodeX: 31, nodeY: 36 },
      { hideLabel: true, id: 'quads-l',     color: m.quads.color,     nodeX: 43, nodeY: 67 },
      { hideLabel: true, id: 'obliques-r',  color: m.obliques.color,  nodeX: 60, nodeY: 48 },
      { hideLabel: true, id: 'forearm-l',   color: m.forearms.color,  nodeX: 27, nodeY: 48 },
      { hideLabel: true, id: 'forearm-r',   color: m.forearms.color,  nodeX: 73, nodeY: 48 },
    ];

    // Callouts for Back View
    const backCallouts = [
      // Labeled callouts
      { id: 'traps',        label: 'טרפז',        pct: m.traps.pct,       color: m.traps.color,       nodeX: 44, nodeY: 18, side: 'left' },
      { id: 'lats-r',       label: 'רחב גבי',     pct: m.lats.pct,        color: m.lats.color,        nodeX: 60, nodeY: 30, side: 'right' },
      { id: 'triceps-r',    label: 'יד אחורית',   pct: m.triceps.pct,     color: m.triceps.color,     nodeX: 70, nodeY: 42, side: 'right' },
      { id: 'glutes-l',     label: 'ישבן',         pct: m.glutes.pct,      color: m.glutes.color,      nodeX: 46, nodeY: 57, side: 'left' },
      { id: 'hamstrings-l', label: 'המסטרינג',     pct: m.hamstrings.pct,  color: m.hamstrings.color,  nodeX: 43, nodeY: 68, side: 'left' },
      { id: 'calves-r',     label: 'תאומים',       pct: m.calves.pct,      color: m.calves.color,      nodeX: 57, nodeY: 82, side: 'right' },
      // Hidden dot-only markers
      { hideLabel: true, id: 'lats-l',       color: m.lats.color,       nodeX: 40, nodeY: 30 },
      { hideLabel: true, id: 'triceps-l',    color: m.triceps.color,    nodeX: 30, nodeY: 42 },
      { hideLabel: true, id: 'glutes-r',     color: m.glutes.color,     nodeX: 54, nodeY: 57 },
      { hideLabel: true, id: 'hamstrings-r', color: m.hamstrings.color, nodeX: 57, nodeY: 68 },
      { hideLabel: true, id: 'calves-l',     color: m.calves.color,     nodeX: 43, nodeY: 82 },
      { hideLabel: true, id: 'midback',      color: m.traps.color,      nodeX: 50, nodeY: 26 },
    ];

    const generatePaneHTML = (callouts, title, imagePath) => {
      const visibleCallouts = callouts.filter(c => !c.hideLabel);
      
      return `
        <div class="anatomy-pane">
          <div class="pane-title">${title}</div>
          <div class="anatomy-image-bg" style="background-image: url('${imagePath}');"></div>
          
          <svg class="anatomy-svg-overlay" width="100%" height="100%">
            ${visibleCallouts.map(c => {
              const lineEndX = c.side === 'left' ? 28 : 72;
              return `
                <line x1="${c.nodeX}%" y1="${c.nodeY}%" x2="${lineEndX}%" y2="${c.nodeY}%" stroke="${c.color}" stroke-dasharray="3" opacity="0.6" />
                <line x1="${c.nodeX}%" y1="${c.nodeY}%" x2="${lineEndX}%" y2="${c.nodeY}%" stroke="${c.color}" stroke-width="0.5" opacity="0.3" />
              `;
            }).join('')}
          </svg>

          ${visibleCallouts.map(c => `
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
      `;
    };

    let html = `
      <style>
        .anatomy-dual-container {
          display: grid;
          grid-template-columns: 1fr;
          gap: 24px;
          width: 100%;
          padding: 10px 0;
        }
        @media (min-width: 768px) {
          .anatomy-dual-container {
            grid-template-columns: 1fr 1fr;
          }
        }

        .anatomy-pane {
          position: relative;
          width: 100%;
          height: 520px;
          background: radial-gradient(circle at center, #0a1118 0%, #020406 100%);
          border-radius: var(--radius-xl);
          border: 1px solid rgba(255, 255, 255, 0.05);
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: inset 0 0 50px rgba(0, 0, 0, 0.5);
          overflow: hidden;
        }

        .pane-title {
          position: absolute;
          top: 16px;
          left: 16px;
          background: rgba(0,0,0,0.6);
          padding: 6px 12px;
          border-radius: 8px;
          font-weight: bold;
          color: white;
          z-index: 30;
          font-size: 14px;
          border: 1px solid rgba(255,255,255,0.1);
          backdrop-filter: blur(4px);
        }

        .anatomy-image-bg {
          position: absolute;
          inset: 0;
          background-size: cover;
          background-position: center;
          background-repeat: no-repeat;
          opacity: 0.95;
          filter: drop-shadow(0 0 10px rgba(0,0,0,0.5));
          border-radius: inherit;
          -webkit-mask-image: linear-gradient(to bottom, transparent 0%, black 8%, black 92%, transparent 100%);
          mask-image: linear-gradient(to bottom, transparent 0%, black 8%, black 92%, transparent 100%);
        }

        .anatomy-svg-overlay {
          position: absolute;
          inset: 0;
          z-index: 15;
          pointer-events: none;
        }

        .anatomy-node {
          position: absolute;
          width: 8px;
          height: 8px;
          border-radius: 50%;
          transform: translate(-50%, -50%);
          z-index: 16;
          box-shadow: 0 0 10px currentColor;
        }

        .anatomy-node::after {
          content: '';
          position: absolute;
          inset: -4px;
          border-radius: 50%;
          border: 1px solid currentColor;
          animation: ping-pulse 2s cubic-bezier(0, 0, 0.2, 1) infinite;
        }
        
        @keyframes ping-pulse {
          75%, 100% { transform: scale(2.5); opacity: 0; }
        }

        .callout-label {
          position: absolute;
          display: flex;
          flex-direction: column;
          gap: 2px;
          background: rgba(10, 15, 25, 0.95);
          backdrop-filter: blur(8px);
          border: 1px solid rgba(255,255,255,0.1);
          padding: 5px 9px;
          border-radius: 8px;
          transform: translateY(-50%);
          z-index: 20;
          pointer-events: none;
          box-shadow: 0 4px 15px rgba(0,0,0,0.5);
          width: max-content;
          white-space: nowrap;
        }
        
        /* Direct anchors to the SVG lines */
        .callout-label.side-left {
          right: 73%; /* line ends at 28%, leaves 1% gap to label starting at 27% */
          border-right: 3px solid var(--color);
          text-align: right;
          align-items: flex-end;
        }
        .callout-label.side-right {
          left: 73%; /* line ends at 72%, leaves 1% gap to label starting at 73% */
          border-left: 3px solid var(--color);
          text-align: left;
          align-items: flex-start;
        }
        
        .callout-title {
          font-size: 11px;
          color: var(--text-secondary);
          font-weight: 700;
          line-height: 1.1;
        }
        .callout-value {
          font-size: 14px;
          font-weight: 900;
          display: flex;
          align-items: center;
          gap: 4px;
          text-shadow: 0 0 8px currentColor;
        }
        
        .progress-glow-bar {
          width: 100%;
          height: 3px;
          background: rgba(255,255,255,0.05);
          border-radius: 2px;
          margin-top: 4px;
          overflow: hidden;
        }
        .progress-glow-fill {
          height: 100%;
          border-radius: 2px;
          box-shadow: 0 0 8px currentColor;
          transition: width 1s;
        }
      </style>

      <div class="anatomy-dual-container">
        ${generatePaneHTML(frontCallouts, 'מבט קדמי (Front)', 'images/anatomy-front.png')}
        ${generatePaneHTML(backCallouts, 'מבט אחורי (Back)', 'images/anatomy-back.png')}
      </div>
    `;

    container.innerHTML = html;
  }

  return { render };
})();
