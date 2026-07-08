/**
 * Exercises Guide Page Module
 */
const ExercisesPage = (() => {
  let allExercises = [];
  let categories = [];
  let isTreeView = true;

  const SKILL_PATHS = [
    {
      title: 'דחיפה חזה (Chest)',
      exercises: [
        { name: 'Incline Push-up', unlockWeek: 1 },
        { name: 'Push-up רגיל', unlockWeek: 13 },
        { name: 'Offset Push-up', unlockWeek: 26, note: 'רוטציה שבועית' },
        { name: 'Diamond Push-up', unlockWeek: 26, note: 'רוטציה שבועית' },
        { name: 'Banded Push-up', unlockWeek: 34, note: 'רוטציה 3-שבועית' },
        { name: 'Decline Push-up', unlockWeek: 34, note: 'רוטציה 3-שבועית' }
      ]
    },
    {
      title: 'משיכה אופקית (Horizontal Pull)',
      exercises: [
        { name: 'Band Row', unlockWeek: 1 },
        { name: 'Face Pull', unlockWeek: 1 },
        { name: 'Single-arm Band Row', unlockWeek: 13 }
      ]
    },
    {
      title: 'משיכה אנכית (Vertical Pull)',
      exercises: [
        { name: 'Scapular Pull-up', unlockWeek: 1 },
        { name: 'Band-assisted Pull-up', unlockWeek: 13 },
        { name: 'Chin-up', unlockWeek: 26 },
        { name: 'Pull-up', unlockWeek: 34 }
      ]
    },
    {
      title: 'רגליים (Legs)',
      exercises: [
        { name: 'Squat איטי', unlockWeek: 1 },
        { name: 'Split Squat', unlockWeek: 13 },
        { name: 'Bulgarian Split Squat', unlockWeek: 26 }
      ]
    },
    {
      title: 'ליבה (Core)',
      exercises: [
        { name: 'Hollow Body Hold', unlockWeek: 1 },
        { name: 'Bird-Dog', unlockWeek: 1, note: 'ימי הליכה' },
        { name: 'Hanging Leg Raise', unlockWeek: 26 }
      ]
    },
    {
      title: 'ליבה צידית (Side Core)',
      exercises: [
        { name: 'Pallof Press', unlockWeek: 1 },
        { name: 'Copenhagen Plank', unlockWeek: 34 }
      ]
    },
    {
      title: 'ישבן וגב תחתון',
      exercises: [
        { name: 'Banded Glute Bridge', unlockWeek: 1 },
        { name: 'Banded RDL', unlockWeek: 1 }
      ]
    },
    {
      title: 'שוקיים (Calves)',
      exercises: [
        { name: 'Single-leg Calf Raise', unlockWeek: 1 },
        { name: 'Tibialis Raise', unlockWeek: 1 }
      ]
    },
    {
      title: 'ידיים (Arms)',
      exercises: [
        { name: 'Band Curl', unlockWeek: 1 },
        { name: 'Triceps Extension', unlockWeek: 1 }
      ]
    },
    {
      title: 'כתפיים ושיקום (Shoulders & Rehab)',
      exercises: [
        { name: 'Band External Rotation', unlockWeek: 1 },
        { name: 'Banded OHP', unlockWeek: 1 },
        { name: 'Band Lateral Raise', unlockWeek: 26 },
        { name: 'Pike Push-up', unlockWeek: 34 }
      ]
    }
  ];

  /**
   * Initialize
   */
  async function init() {
    allExercises = await DB.getExerciseGuide();

    // Extract unique categories
    const catSet = new Set(allExercises.map(e => e.category));
    categories = Array.from(catSet);

    // Render filter buttons
    renderFilters();

    // Search handler
    document.getElementById('exercise-search').addEventListener('input', (e) => {
      if(!isTreeView) render(e.target.value, getActiveFilter());
    });

    // Toggle tree view handler
    document.getElementById('toggle-tree-btn').addEventListener('click', toggleView);
  }

  function toggleView() {
    isTreeView = !isTreeView;
    const btn = document.getElementById('toggle-tree-btn');
    const guideContainer = document.getElementById('exercise-guide');
    const treeContainer = document.getElementById('skill-tree-container');
    const searchBox = document.getElementById('exercise-search-box');
    const filters = document.getElementById('exercise-filters');
    const titleText = btn.querySelector('.tree-btn-text');

    if (isTreeView) {
      guideContainer.style.display = 'none';
      searchBox.style.display = 'none';
      filters.style.display = 'none';
      treeContainer.style.display = 'flex';
      btn.classList.add('active');
      btn.innerHTML = '<span>📚</span><span class="tree-btn-text">לכל התרגילים</span>';
      renderSkillTree();
    } else {
      treeContainer.style.display = 'none';
      guideContainer.style.display = 'grid';
      searchBox.style.display = 'block';
      filters.style.display = 'flex';
      btn.classList.remove('active');
      btn.innerHTML = '<span>🌳</span><span class="tree-btn-text">עץ התקדמות</span>';
      render(document.getElementById('exercise-search').value, getActiveFilter());
    }
  }

  /**
   * Render filter buttons
   */
  function renderFilters() {
    const container = document.getElementById('exercise-filters');
    container.innerHTML = `
      <button class="filter-btn active" data-filter="all" onclick="ExercisesPage.setFilter('all', this)">הכל</button>
      ${categories.map(cat => `
        <button class="filter-btn" data-filter="${cat}" onclick="ExercisesPage.setFilter('${cat}', this)">${cat}</button>
      `).join('')}
    `;
  }

  /**
   * Get active filter
   */
  function getActiveFilter() {
    const activeBtn = document.querySelector('.filter-btn.active');
    return activeBtn ? activeBtn.dataset.filter : 'all';
  }

  /**
   * Set filter
   */
  function setFilter(category, btn) {
    if(isTreeView) return;
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    render(document.getElementById('exercise-search').value, category);
  }

  /**
   * Render skill tree
   */
  
  function renderSkillTree() {
    const container = document.getElementById('skill-tree-container');
    const currentWeek = Math.floor((window.appCurrentPlanIndex || 0) / 7) + 1;

    let html = '';

    SKILL_PATHS.forEach(path => {
      html += `
        <div class="skill-path">
          <div class="skill-path-title">${path.title}</div>
          <div class="skill-nodes-list">
      `;

      // Group exercises by unlockWeek
      const grouped = {};
      path.exercises.forEach(node => {
        if (!grouped[node.unlockWeek]) grouped[node.unlockWeek] = [];
        grouped[node.unlockWeek].push(node);
      });

      const sortedWeeks = Object.keys(grouped).map(Number).sort((a,b) => a - b);

      sortedWeeks.forEach(week => {
        const nodes = grouped[week];
        const isLevelUnlocked = currentWeek >= week;
        const levelStateClass = isLevelUnlocked ? 'unlocked' : 'locked';

        html += `<div class="skill-level-wrapper ${levelStateClass}" style="position: relative; display: flex; flex-direction: column; align-items: center; width: 100%;">`;
        html += `<div class="skill-nodes-row" style="display: flex; gap: 16px; justify-content: center; flex-wrap: wrap; width: 100%;">`;

        nodes.forEach(node => {
          const exData = allExercises.find(e => e.name === node.name);
          // If the exercise unlocks earlier globally but is listed here for rotation, we still check the node's specific requirement.
          const isUnlocked = currentWeek >= node.unlockWeek;
          const stateClass = isUnlocked ? 'unlocked' : 'locked';
          
          const diffClass = exData ? UI.getDifficultyClass(exData.difficulty) : 'beginner';
          const diffLabel = exData ? exData.difficulty : '';
          const equip = exData ? UI.getEquipment(exData.name) : null;
          const imgSrc = `images/exercises/${node.name.replace(/\//g, '-').toUpperCase()}.png`;
          
          let videoBtn = '';
          if (exData && exData.videoUrl) {
            videoBtn = `<a href="${exData.videoUrl}" target="_blank" class="skill-video-btn" title="צפה בסרטון" onclick="event.stopPropagation()">▶</a>`;
          }

          html += `
            <div class="skill-node ${stateClass}" onclick="ExercisesPage.showExerciseDetails('${node.name.replace(/'/g, "\'")}')" style="cursor: pointer; flex: 1; min-width: 250px; max-width: 400px;">
              ${videoBtn}
              <img src="${imgSrc}" class="skill-node-image" alt="${node.name}" onerror="this.style.display='none'">
              <div class="skill-node-content">
                <div class="skill-node-title">${node.name}</div>
                <div class="skill-node-meta">
                  <span class="skill-unlock-badge">${isUnlocked ? 'פתוח' : 'נפתח בשבוע ' + node.unlockWeek}</span>
                  ${diffLabel ? `<span class="guide-difficulty ${diffClass}">${diffLabel}</span>` : ''}
                  ${equip ? `<span class="guide-equipment">${equip.icon} ${equip.label}</span>` : ''}
                </div>
                ${node.note ? `<div style="font-size: 11px; color: var(--accent-primary); font-weight: 600; margin-top: 6px; padding: 2px 6px; background: rgba(56, 189, 248, 0.1); border-radius: 4px; display: inline-block;">🗓️ ${node.note}</div>` : ''}
              </div>
            </div>
          `;
        });

        html += `</div></div>`;
      });

      html += `
          </div>
        </div>
      `;
    });

    container.innerHTML = html;
  }

  /**
   * Render exercises guide
   */
  function render(searchTerm = '', filterCategory = 'all') {
    if(isTreeView) {
      renderSkillTree();
      return;
    }
    
    let filtered = allExercises;

    // Apply search
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(ex =>
        ex.name.toLowerCase().includes(term) ||
        (ex.category && ex.category.toLowerCase().includes(term))
      );
    }

    // Apply category filter
    if (filterCategory !== 'all') {
      filtered = filtered.filter(ex => ex.category === filterCategory);
    }

    const container = document.getElementById('exercise-guide');

    if (filtered.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; padding: 40px; grid-column: 1/-1;">
          <div style="font-size: 48px; margin-bottom: 16px;">🔍</div>
          <p style="color: var(--text-secondary);">לא נמצאו תרגילים</p>
        </div>
      `;
      return;
    }

    container.innerHTML = filtered.map(ex => {
      return generateGuideCardHTML(ex);
    }).join('');
  }

  /**
   * Generate HTML for a guide card
   */
  function generateGuideCardHTML(ex) {
    const diffClass = UI.getDifficultyClass(ex.difficulty);
    const videoLink = ex.videoUrl
      ? `<a href="${ex.videoUrl}" target="_blank" class="exercise-video-btn" title="צפה בסרטון" style="text-decoration: none; color: var(--danger);">▶</a>`
      : '';

    const equip = UI.getEquipment(ex.name);
    let weightDisplay = ex.weight || '';
    if (weightDisplay && equip && equip.label === 'גומיה' && weightDisplay !== '—' && weightDisplay !== 'משקל גוף') {
      weightDisplay = `משקל גומיה: ${weightDisplay}`;
    }

    return `
      <div class="guide-card">
        <div class="guide-card-image-container diff-${diffClass}">
          <img src="images/exercises/${ex.name.replace(/\//g, '-').toUpperCase()}.png" class="exercise-image" alt="${ex.name}" onerror="this.parentElement.style.display='none'">
        </div>
        <div class="guide-card-content">
          <div class="guide-card-title">
            ${ex.name}
            ${equip ? `<span class="guide-equipment">${equip.icon} ${equip.label}</span>` : ''}
          </div>
          <span class="guide-card-category">${ex.category || ''}</span>
          <div class="guide-card-sets">${ex.setsProgression || ''}</div>
          <div class="guide-card-meta">
            <span class="guide-difficulty ${diffClass}">${ex.difficulty || ''}</span>
            ${weightDisplay ? `<span class="guide-weight">${weightDisplay}</span>` : ''}
            ${videoLink}
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Show exercise details in modal
   */
  function showExerciseDetails(name) {
    const ex = allExercises.find(e => e.name === name);
    if(!ex) return;

    const html = generateGuideCardHTML(ex);
    UI.showModal('פרטי תרגיל', html);
  }

  return {
    init,
    render,
    setFilter,
    showExerciseDetails
  };
})();

