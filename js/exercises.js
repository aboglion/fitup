/**
 * Exercises Guide Page Module
 * RPG-style Skill Tree organized by Day Type
 */
const ExercisesPage = (() => {
  let allExercises = [];
  let categories = [];
  let isTreeView = true;
  let activeTab = 'upper-a';

  // Day type tabs configuration
  const DAY_TABS = [
    { id: 'upper-a', label: 'כוח עליון A', subtitle: 'דחיפה · משיכה · בייספס', icon: '💪', color: '#f97316', bgColor: 'rgba(249, 115, 22, 0.15)', dayTypes: ['כוח עליון A'] },
    { id: 'upper-b', label: 'כוח עליון B', subtitle: 'דחיפה · משיכה · טרייספס', icon: '🏋️', color: '#a855f7', bgColor: 'rgba(168, 85, 247, 0.15)', dayTypes: ['כוח עליון B'] },
    { id: 'lower',   label: 'כוח תחתון',   subtitle: 'רגליים · ישבן · שוקיים',    icon: '🦵', color: '#3b82f6', bgColor: 'rgba(59, 130, 246, 0.15)', dayTypes: ['כוח תחתון'] },
    { id: 'walking', label: 'הליכה',       subtitle: 'הליכה · ליבה · גמישות',     icon: '🚶', color: '#10b981', bgColor: 'rgba(16, 185, 129, 0.15)', dayTypes: ['הליכה'] }
  ];

  // Band weight progression tiers (exercise name → sorted tiers)
  const BAND_WEIGHT_PROGRESSION = {
    'Banded OHP':          [{ weight: '30kg', fromWeek: 1 }, { weight: '40kg', fromWeek: 13 }, { weight: '50kg', fromWeek: 26 }],
    'Banded RDL':          [{ weight: '30kg', fromWeek: 1 }, { weight: '40kg', fromWeek: 13 }, { weight: '50kg', fromWeek: 26 }],
    'Banded Glute Bridge': [{ weight: '30kg', fromWeek: 1 }, { weight: '40kg', fromWeek: 13 }, { weight: '50kg', fromWeek: 26 }],
    'Pallof Press':        [{ weight: '30kg', fromWeek: 1 }, { weight: '40kg', fromWeek: 13 }],
    'Band Curl':           [{ weight: '30kg', fromWeek: 1 }, { weight: '40kg', fromWeek: 13 }],
    'Band Row':            [{ weight: '30kg', fromWeek: 1 }, { weight: '50kg', fromWeek: 26 }],
    'Single-arm Band Row': [{ weight: '40kg', fromWeek: 13 }, { weight: '50kg', fromWeek: 34 }],
    'Banded Push-up':      [{ weight: '50kg', fromWeek: 34 }],
    'Face Pull':           [{ weight: '30kg', fromWeek: 1 }],
    'Triceps Extension':   [{ weight: '30kg', fromWeek: 1 }, { weight: '40kg', fromWeek: 13 }],
    'Band External Rotation': [{ weight: '30kg', fromWeek: 1 }],
    'Band Lateral Raise':  [{ weight: '30kg', fromWeek: 26 }],
    'Banded Bulgarian Split Squat': [{ weight: '40kg', fromWeek: 26 }],
  };

  // Skill paths organized by day type
  const SKILL_TREES = {
    'upper-a': [
      {
        title: '🔥 חימום כתפיים',
        icon: '🛡️',
        exercises: [
          { name: 'Band External Rotation', unlockWeek: 1 }
        ]
      },
      {
        title: '💥 דחיפה (חזה)',
        icon: '🫁',
        exercises: [
          { name: 'Incline Push-up', unlockWeek: 1 },
          { name: 'Push-up רגיל', unlockWeek: 13 },
          { name: 'Offset Push-up', unlockWeek: 26, note: 'רוטציה שבועית', parallel: true },
          { name: 'Diamond Push-up', unlockWeek: 26, note: 'רוטציה שבועית', parallel: true },
          { name: 'Banded Push-up', unlockWeek: 34, note: 'רוטציה 3-שבועית', parallel: true },
          { name: 'Decline Push-up', unlockWeek: 34, note: 'רוטציה 3-שבועית', parallel: true }
        ]
      },
      {
        title: '🧲 משיכה אנכית',
        icon: '⬆️',
        exercises: [
          { name: 'Scapular Pull-up', unlockWeek: 1 },
          { name: 'Band-assisted Pull-up', unlockWeek: 13 },
          { name: 'Chin-up', unlockWeek: 26 },
          { name: 'Pull-up', unlockWeek: 34 }
        ]
      },
      {
        title: '🔗 משיכה אופקית',
        icon: '↔️',
        exercises: [
          { name: 'Band Row', unlockWeek: 1 },
          { name: 'Single-arm Band Row', unlockWeek: 13 }
        ]
      },
      {
        title: '🎯 כתפיים',
        icon: '🏔️',
        exercises: [
          { name: 'Banded OHP', unlockWeek: 1 },
          { name: 'Band Lateral Raise', unlockWeek: 26 },
          { name: 'Pike Push-up', unlockWeek: 34 }
        ]
      },
      {
        title: '🧱 ליבה',
        icon: '🔲',
        exercises: [
          { name: 'Hollow Body Hold', unlockWeek: 1 },
          { name: 'Pallof Press', unlockWeek: 1 },
          { name: 'Hanging Leg Raise', unlockWeek: 26 },
          { name: 'Copenhagen Plank', unlockWeek: 34 }
        ]
      },
      {
        title: '💪 זרועות',
        icon: '🦾',
        exercises: [
          { name: 'Band Curl', unlockWeek: 1 },
          { name: 'Face Pull', unlockWeek: 1 }
        ]
      }
    ],
    'upper-b': [
      {
        title: '🔥 חימום כתפיים',
        icon: '🛡️',
        exercises: [
          { name: 'Band External Rotation', unlockWeek: 1 }
        ]
      },
      {
        title: '💥 דחיפה (חזה)',
        icon: '🫁',
        exercises: [
          { name: 'Incline Push-up', unlockWeek: 1 },
          { name: 'Push-up רגיל', unlockWeek: 13 },
          { name: 'Offset Push-up', unlockWeek: 26, note: 'רוטציה שבועית', parallel: true },
          { name: 'Diamond Push-up', unlockWeek: 26, note: 'רוטציה שבועית', parallel: true },
          { name: 'Banded Push-up', unlockWeek: 34, note: 'רוטציה 3-שבועית', parallel: true },
          { name: 'Decline Push-up', unlockWeek: 34, note: 'רוטציה 3-שבועית', parallel: true }
        ]
      },
      {
        title: '🧲 משיכה אנכית',
        icon: '⬆️',
        exercises: [
          { name: 'Scapular Pull-up', unlockWeek: 1 },
          { name: 'Band-assisted Pull-up', unlockWeek: 13 },
          { name: 'Chin-up', unlockWeek: 26 },
          { name: 'Pull-up', unlockWeek: 34 }
        ]
      },
      {
        title: '🔗 משיכה אופקית',
        icon: '↔️',
        exercises: [
          { name: 'Band Row', unlockWeek: 1 },
          { name: 'Single-arm Band Row', unlockWeek: 13 }
        ]
      },
      {
        title: '🎯 כתפיים',
        icon: '🏔️',
        exercises: [
          { name: 'Banded OHP', unlockWeek: 1 },
          { name: 'Band Lateral Raise', unlockWeek: 26 },
          { name: 'Pike Push-up', unlockWeek: 34 }
        ]
      },
      {
        title: '🧱 ליבה',
        icon: '🔲',
        exercises: [
          { name: 'Hollow Body Hold', unlockWeek: 1 },
          { name: 'Pallof Press', unlockWeek: 1 },
          { name: 'Hanging Leg Raise', unlockWeek: 26 },
          { name: 'Copenhagen Plank', unlockWeek: 34 }
        ]
      },
      {
        title: '💪 זרועות',
        icon: '🦾',
        exercises: [
          { name: 'Triceps Extension', unlockWeek: 1 },
          { name: 'Face Pull', unlockWeek: 1 }
        ]
      }
    ],
    'lower': [
      {
        title: '🦵 רגליים',
        icon: '🏋️',
        exercises: [
          { name: 'Squat איטי', unlockWeek: 1 },
          { name: 'Split Squat', unlockWeek: 13 },
          { name: 'Bulgarian Split Squat', unlockWeek: 26 }
        ]
      },
      {
        title: '🍑 ישבן וגב תחתון',
        icon: '🔥',
        exercises: [
          { name: 'Banded Glute Bridge', unlockWeek: 1 },
          { name: 'Banded RDL', unlockWeek: 1 }
        ]
      },
      {
        title: '🧱 ליבה',
        icon: '🔲',
        exercises: [
          { name: 'Pallof Press', unlockWeek: 1 },
          { name: 'Copenhagen Plank', unlockWeek: 34 }
        ]
      },
      {
        title: '🦶 שוקיים',
        icon: '⚡',
        exercises: [
          { name: 'Single-leg Calf Raise', unlockWeek: 1 },
          { name: 'Tibialis Raise', unlockWeek: 1 }
        ]
      }
    ],
    'walking': [
      {
        title: '🚶 הליכה',
        icon: '🌳',
        exercises: [
          { name: 'הליכה מהירה', unlockWeek: 1, noImage: true }
        ]
      },
      {
        title: '🧱 ליבה ויציבות',
        icon: '🔲',
        exercises: [
          { name: 'Bird-Dog', unlockWeek: 1 },
          { name: 'Hollow Body Hold', unlockWeek: 1 }
        ]
      },
      {
        title: '🦶 שוקיים',
        icon: '⚡',
        exercises: [
          { name: 'Single-leg Calf Raise', unlockWeek: 1 },
          { name: 'Tibialis Raise', unlockWeek: 1 }
        ]
      },
      {
        title: '🧘 גמישות',
        icon: '🌊',
        exercises: [
          { name: 'מתיחות מלאות', unlockWeek: 1, noImage: true }
        ]
      }
    ]
  };

  // Cached completion data
  let completedPerType = {};

  /**
   * Load completion data from tracking DB
   */
  async function loadCompletionData() {
    try {
      const allPlan = await DB.getAllPlan();
      const allTracking = await DB.getAllTracking();
      const trackingMap = {};
      allTracking.forEach(t => { trackingMap[t.dayIndex] = t; });

      completedPerType = {};
      allPlan.forEach(day => {
        if (!day.dayType || day.dayType === 'מנוחה') return;
        if (!completedPerType[day.dayType]) {
          completedPerType[day.dayType] = { completed: 0, total: 0 };
        }
        completedPerType[day.dayType].total++;
        if (trackingMap[day.dayIndex] && trackingMap[day.dayIndex].completed) {
          completedPerType[day.dayType].completed++;
        }
      });
    } catch(e) {
      completedPerType = {};
    }
  }

  /**
   * Get completed workouts count for a tab
   */
  function getTabCompletedXP(tabId) {
    const tabConfig = DAY_TABS.find(t => t.id === tabId);
    if (!tabConfig) return { completed: 0, total: 0 };
    let completed = 0;
    let total = 0;
    (tabConfig.dayTypes || []).forEach(dt => {
      if (completedPerType[dt]) {
        completed += completedPerType[dt].completed;
        total += completedPerType[dt].total;
      }
    });
    return { completed, total };
  }

  /**
   * Initialize
   */
  async function init() {
    allExercises = await DB.getExerciseGuide();

    // Extract unique categories
    const catSet = new Set(allExercises.map(e => e.category));
    categories = Array.from(catSet);

    // Load completion data for XP system
    await loadCompletionData();

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
   * Switch tab
   */
  function switchTab(tabId) {
    activeTab = tabId;
    const currentWeek = Math.floor((window.appCurrentPlanIndex || 0) / 7) + 1;
    // Update tab buttons
    document.querySelectorAll('.rpg-tab-btn').forEach(btn => {
      const isActive = btn.dataset.tab === tabId;
      btn.classList.toggle('active', isActive);
      // Update the progress text color
      const progText = btn.querySelector('.rpg-tab-prog-text');
      if (progText) {
        const tabConf = DAY_TABS.find(t => t.id === btn.dataset.tab);
        progText.style.color = isActive && tabConf ? tabConf.color : 'var(--text-muted)';
      }
    });
    // Re-render XP header for this tab
    renderTabXPHeader();
    // Re-render tree
    renderSkillTreeContent();
  }

  /**
   * Calculate progress for a specific tab
   */
  function getTabProgress(tabId, currentWeek) {
    const paths = SKILL_TREES[tabId] || [];
    let total = 0;
    let unlocked = 0;
    paths.forEach(path => {
      path.exercises.forEach(ex => {
        total++;
        if (currentWeek >= ex.unlockWeek) unlocked++;
      });
    });
    return { total, unlocked, pct: total > 0 ? Math.round((unlocked / total) * 100) : 0 };
  }

  /**
   * Render skill tree with tabs
   */
  function renderSkillTree() {
    const container = document.getElementById('skill-tree-container');
    const currentWeek = Math.floor((window.appCurrentPlanIndex || 0) / 7) + 1;

    let html = '';

    // Tab bar with mini progress and subtitles
    html += '<div class="rpg-tab-bar">';
    DAY_TABS.forEach(tab => {
      const isActive = tab.id === activeTab;
      const xpData = getTabCompletedXP(tab.id);
      const xpPct = xpData.total > 0 ? Math.round((xpData.completed / xpData.total) * 100) : 0;
      html += `
        <button class="rpg-tab-btn ${isActive ? 'active' : ''}" 
                data-tab="${tab.id}" 
                onclick="ExercisesPage.switchTab('${tab.id}')"
                style="--tab-color: ${tab.color}; --tab-bg: ${tab.bgColor}">
          <span class="rpg-tab-icon">${tab.icon}</span>
          <span class="rpg-tab-label">${tab.label}</span>
          <span class="rpg-tab-subtitle">${tab.subtitle}</span>
          <span class="rpg-tab-progress">
            <span class="rpg-tab-prog-bar"><span class="rpg-tab-prog-fill" style="width: ${xpPct}%; background: ${tab.color}"></span></span>
            <span class="rpg-tab-prog-text" style="color: ${isActive ? tab.color : 'var(--text-muted)'}">${xpData.completed}/${xpData.total}</span>
          </span>
        </button>
      `;
    });
    html += '</div>';

    // Per-tab XP header (rendered dynamically)
    html += '<div id="rpg-xp-header"></div>';

    // Tree content container
    html += '<div id="rpg-tree-content" class="rpg-tree-content"></div>';

    container.innerHTML = html;

    // Now render the active tab's XP header and tree
    renderTabXPHeader();
    renderSkillTreeContent();
  }

  /**
   * Render the XP header for the active tab
   */
  function renderTabXPHeader() {
    const headerEl = document.getElementById('rpg-xp-header');
    if (!headerEl) return;

    const tabConfig = DAY_TABS.find(t => t.id === activeTab);
    const tabColor = tabConfig ? tabConfig.color : '#3b82f6';
    const tabLabel = tabConfig ? tabConfig.label : '';
    const tabIcon = tabConfig ? tabConfig.icon : '⚔️';
    const tabSubtitle = tabConfig ? tabConfig.subtitle : '';

    // Completion-based XP per tab
    const xpData = getTabCompletedXP(activeTab);
    const totalXP = xpData.completed * 100; // 100 XP per completed workout
    const totalPossible = xpData.total * 100;

    // Level thresholds based on completion count for this tab
    // Each tab has its own total workouts, so levels scale proportionally
    const totalWorkouts = xpData.total || 1;
    const levelThresholds = [
      { min: 0,                                        name: 'מתחיל',  num: 1 },
      { min: Math.round(totalWorkouts * 0.1),          name: 'חניך',    num: 2 },
      { min: Math.round(totalWorkouts * 0.25),         name: 'בינוני',  num: 3 },
      { min: Math.round(totalWorkouts * 0.5),          name: 'מתקדם',  num: 4 },
      { min: Math.round(totalWorkouts * 0.75),         name: 'מומחה',  num: 5 },
      { min: totalWorkouts,                            name: 'מאסטר',  num: 6 }
    ];

    let levelName = 'מתחיל';
    let levelNum = 1;
    let currentLevelMin = 0;
    let nextLevelMin = levelThresholds[1].min;

    for (let i = levelThresholds.length - 1; i >= 0; i--) {
      if (xpData.completed >= levelThresholds[i].min) {
        levelName = levelThresholds[i].name;
        levelNum = levelThresholds[i].num;
        currentLevelMin = levelThresholds[i].min;
        nextLevelMin = i < levelThresholds.length - 1 ? levelThresholds[i + 1].min : levelThresholds[i].min;
        break;
      }
    }

    // Progress within current level
    const levelRange = nextLevelMin - currentLevelMin;
    const levelProgress = levelRange > 0 ? Math.round(((xpData.completed - currentLevelMin) / levelRange) * 100) : 100;
    const isMaster = xpData.completed >= totalWorkouts;
    const nextLevelText = isMaster ? '🏆 הושלם!' : `${xpData.completed}/${nextLevelMin} אימונים ל-Lv.${levelNum + 1}`;

    headerEl.innerHTML = `
      <div class="rpg-progress-header" style="--header-color: ${tabColor}">
        <div class="rpg-level-badge" style="background: ${tabColor}">
          <span class="rpg-level-icon">${tabIcon}</span>
          <span class="rpg-level-text">Lv.${levelNum}</span>
        </div>
        <div class="rpg-xp-bar-container">
          <div class="rpg-xp-label-row">
            <span class="rpg-xp-category">${tabLabel}</span>
            <span class="rpg-xp-level-name">${levelName}</span>
          </div>
          <div class="rpg-xp-bar">
            <div class="rpg-xp-fill" style="width: ${levelProgress}%; background: ${tabColor}; box-shadow: 0 0 12px ${tabColor}55"></div>
          </div>
          <span class="rpg-xp-text">${nextLevelText}</span>
        </div>
      </div>
    `;
  }

  /**
   * Render the tree content for the active tab
   */
  function renderSkillTreeContent() {
    const contentEl = document.getElementById('rpg-tree-content');
    if (!contentEl) return;

    const currentWeek = Math.floor((window.appCurrentPlanIndex || 0) / 7) + 1;
    const paths = SKILL_TREES[activeTab] || [];
    const tabConfig = DAY_TABS.find(t => t.id === activeTab);
    const tabColor = tabConfig ? tabConfig.color : '#3b82f6';

    let html = '';

    paths.forEach((path, pathIndex) => {
      html += `
        <div class="rpg-skill-path" style="--path-color: ${tabColor}; animation-delay: ${pathIndex * 0.1}s">
          <div class="rpg-path-header">
            <span class="rpg-path-icon">${path.icon}</span>
            <span class="rpg-path-title">${path.title}</span>
          </div>
          <div class="rpg-nodes-track">
      `;

      // Group exercises by unlockWeek for branching
      const grouped = {};
      path.exercises.forEach(node => {
        if (!grouped[node.unlockWeek]) grouped[node.unlockWeek] = [];
        grouped[node.unlockWeek].push(node);
      });

      const sortedWeeks = Object.keys(grouped).map(Number).sort((a,b) => a - b);

      sortedWeeks.forEach((week, levelIndex) => {
        const nodes = grouped[week];
        const isLevelUnlocked = currentWeek >= week;
        const isLatestUnlock = isLevelUnlocked && 
          (levelIndex === sortedWeeks.length - 1 || currentWeek < sortedWeeks[levelIndex + 1]);

        // Connector line (except before first level)
        if (levelIndex > 0) {
          const prevUnlocked = currentWeek >= sortedWeeks[levelIndex - 1];
          html += `<div class="rpg-connector ${prevUnlocked && isLevelUnlocked ? 'active' : ''}">
            <div class="rpg-connector-line"></div>
            ${prevUnlocked && isLevelUnlocked ? '<div class="rpg-connector-energy"></div>' : ''}
          </div>`;
        }

        // Check if this is a parallel group (fork)
        const hasParallel = nodes.length > 1;

        if (hasParallel) {
          html += `<div class="rpg-fork-group">`;
          // Fork connector at top
          html += `<div class="rpg-fork-lines ${isLevelUnlocked ? 'active' : ''}" data-count="${nodes.length}"></div>`;
        }

        html += `<div class="rpg-level-row ${hasParallel ? 'parallel' : ''}">`;

        nodes.forEach((node, nodeIdx) => {
          const exData = allExercises.find(e => e.name === node.name);
          const isUnlocked = currentWeek >= node.unlockWeek;
          const stateClass = isUnlocked ? 'unlocked' : 'locked';
          const latestClass = isLatestUnlock && isUnlocked ? 'latest' : '';
          const imgSrc = node.noImage ? null : `images/exercises/${node.name.replace(/\//g, '-').toUpperCase()}.png`;

          let videoBtn = '';
          if (exData && exData.videoUrl) {
            videoBtn = `<a href="${exData.videoUrl}" target="_blank" class="rpg-video-btn" title="צפה בסרטון" onclick="event.stopPropagation()">▶</a>`;
          }

          const diffClass = exData ? UI.getDifficultyClass(exData.difficulty) : 'beginner';
          const equip = exData ? UI.getEquipment(exData.name) : null;

          html += `
            <div class="rpg-node ${stateClass} ${latestClass}" 
                 onclick="ExercisesPage.showExerciseDetails('${node.name.replace(/'/g, "\\'")}')"
                 style="animation-delay: ${(pathIndex * 0.1) + (levelIndex * 0.08) + (nodeIdx * 0.05)}s">
              <div class="rpg-node-hex">
                ${isUnlocked ? '' : '<div class="rpg-lock-icon">🔒</div>'}
                ${imgSrc ? `<img src="${imgSrc}" class="rpg-node-img" alt="${node.name}" onerror="this.style.display='none'; this.parentElement.querySelector('.rpg-node-emoji') && (this.parentElement.querySelector('.rpg-node-emoji').style.display='flex')">` : ''}
                ${!imgSrc || node.noImage ? `<div class="rpg-node-emoji" style="display:flex">${path.icon}</div>` : `<div class="rpg-node-emoji" style="display:none">${path.icon}</div>`}
                ${isUnlocked ? `<div class="rpg-node-glow" style="--glow-color: ${tabColor}"></div>` : ''}
              </div>
              <div class="rpg-node-info">
                <div class="rpg-node-name">${node.name}</div>
                <div class="rpg-node-badges">
                  ${!isUnlocked 
                    ? `<span class="rpg-unlock-badge locked">🔒 שבוע ${node.unlockWeek}</span>` 
                    : `<span class="rpg-unlock-badge unlocked">✓ שבוע ${node.unlockWeek}</span>`}
                  ${equip ? `<span class="rpg-equip-badge">${equip.icon}</span>` : ''}
                </div>
                ${(() => {
                  const tiers = BAND_WEIGHT_PROGRESSION[node.name];
                  if (!tiers || tiers.length === 0) return '';
                  const tierHtml = tiers.map((t, ti) => {
                    const tierActive = currentWeek >= t.fromWeek;
                    const tierLatest = tierActive && (ti === tiers.length - 1 || currentWeek < tiers[ti + 1].fromWeek);
                    return `<span class="rpg-band-tier ${tierActive ? 'active' : 'locked'} ${tierLatest ? 'current' : ''}" 
                                  title="שבוע ${t.fromWeek}">
                              <span class="rpg-band-tier-dot"></span>
                              <span class="rpg-band-tier-weight">${t.weight}</span>
                              <span class="rpg-band-tier-week">ש׳${t.fromWeek}</span>
                            </span>`;
                  }).join('<span class="rpg-band-tier-arrow">›</span>');
                  return `<div class="rpg-band-tiers">${tierHtml}</div>`;
                })()}
                ${node.note ? `<div class="rpg-node-note">🗓️ ${node.note}</div>` : ''}
              </div>
              ${videoBtn}
            </div>
          `;
        });

        html += `</div>`; // rpg-level-row

        if (hasParallel) {
          html += `</div>`; // rpg-fork-group
        }
      });

      html += `
          </div>
        </div>
      `;
    });

    contentEl.innerHTML = html;

    // Trigger staggered entrance animation
    requestAnimationFrame(() => {
      contentEl.querySelectorAll('.rpg-node').forEach(node => {
        node.classList.add('rpg-animate-in');
      });
    });
  }

  /**
   * Render exercises guide (flat list view)
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
    showExerciseDetails,
    switchTab
  };
})();
