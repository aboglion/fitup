/**
 * Exercises Guide Page Module
 */
const ExercisesPage = (() => {
  let allExercises = [];
  let categories = [];
  let isTreeView = true;

  const SKILL_PATHS = [
    {
      title: 'דחיפה (Push)',
      exercises: [
        { name: 'Wall Push-up', unlockWeek: 1 },
        { name: 'Incline Push-up', unlockWeek: 1 },
        { name: 'Push-up רגיל', unlockWeek: 13 },
        { name: 'Diamond Push-up', unlockWeek: 17 },
        { name: 'Pike Push-up', unlockWeek: 25 }
      ]
    },
    {
      title: 'משיכה אופקית (Horizontal Pull)',
      exercises: [
        { name: 'Band Row', unlockWeek: 1 },
        { name: 'Inverted Row', unlockWeek: 13 }
      ]
    },
    {
      title: 'משיכה אנכית (Vertical Pull)',
      exercises: [
        { name: 'Active Hang', unlockWeek: 1 },
        { name: 'Scapular Pull-up', unlockWeek: 3 },
        { name: 'Negative Pull-up', unlockWeek: 5 },
        { name: 'Pull-up', unlockWeek: 17 },
        { name: 'Chin-up', unlockWeek: 21 }
      ]
    },
    {
      title: 'רגליים (Legs)',
      exercises: [
        { name: 'Box Squat', unlockWeek: 1 },
        { name: 'Squat איטי', unlockWeek: 9 },
        { name: 'Split Squat', unlockWeek: 13 },
        { name: 'Bulgarian Split Squat', unlockWeek: 17 }
      ]
    },
    {
      title: 'ליבה (Core)',
      exercises: [
        { name: 'Dead Bug', unlockWeek: 1 },
        { name: 'Hollow Body Hold', unlockWeek: 1 },
        { name: 'Hanging Leg Raise', unlockWeek: 17 }
      ]
    },
    {
      title: 'ישבן וגב תחתון',
      exercises: [
        { name: 'Banded GM', unlockWeek: 1 },
        { name: 'Banded Hip Thrust', unlockWeek: 5 }
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

      path.exercises.forEach(node => {
        const exData = allExercises.find(e => e.name === node.name);
        const isUnlocked = currentWeek >= node.unlockWeek;
        const stateClass = isUnlocked ? 'unlocked' : 'locked';
        
        // Use default fallback if not found
        const diffClass = exData ? UI.getDifficultyClass(exData.difficulty) : 'beginner';
        const diffLabel = exData ? exData.difficulty : '';
        const equip = exData ? UI.getEquipment(exData.name) : null;
        const imgSrc = `images/exercises/${node.name.replace(/\//g, '-').toUpperCase()}.png`;
        
        let videoBtn = '';
        if (exData && exData.videoUrl) {
          videoBtn = `<a href="${exData.videoUrl}" target="_blank" class="skill-video-btn" title="צפה בסרטון">▶</a>`;
        }

        html += `
          <div class="skill-node-wrapper ${stateClass}">
            <div class="skill-node ${stateClass}">
              ${videoBtn}
              <img src="${imgSrc}" class="skill-node-image" alt="${node.name}" onerror="this.style.display='none'">
              <div class="skill-node-content">
                <div class="skill-node-title">${node.name}</div>
                <div class="skill-node-meta">
                  <span class="skill-unlock-badge">${isUnlocked ? 'פתוח' : 'נפתח בשבוע ' + node.unlockWeek}</span>
                  ${diffLabel ? `<span class="guide-difficulty ${diffClass}">${diffLabel}</span>` : ''}
                  ${equip ? `<span class="guide-equipment">${equip.icon} ${equip.label}</span>` : ''}
                </div>
              </div>
            </div>
          </div>
        `;
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
    }).join('');
  }

  return {
    init,
    render,
    setFilter
  };
})();

