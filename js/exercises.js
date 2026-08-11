/**
 * Exercises Guide Page Module
 * RPG-style Skill Tree organized by Day Type
 */
const ExercisesPage = (() => {
  let allExercises = [];
  let categories = [];
  let isTreeView = true;
  let activeTab = null;

  // Day type tabs configuration
  const DAY_TABS = [
    { id: 'lower-strength', label: 'Legs + Core', subtitle: 'רגליים · ליבה', icon: '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="width: 1.2em; height: 1.2em;"><path d="M6 12h12M3 8v8M21 8v8M6 6v12M18 6v12"/></svg>', color: '#f97316', bgColor: 'rgba(249, 115, 22, 0.15)', dayTypes: ['Legs + Core'] },
    { id: 'upper-push', label: 'Push + Skill', subtitle: 'דחיפה · סקיל · רגליים קל', icon: '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="width: 1.2em; height: 1.2em;"><path d="M17 11l-5-5-5 5M12 6v12M5 21h14"/></svg>', color: '#3b82f6', bgColor: 'rgba(59, 130, 246, 0.15)', dayTypes: ['Push + Skill'] },
    { id: 'upper-pull', label: 'Pull + Grip', subtitle: 'משיכה · אחיזה · ליבה קלה', icon: '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="width: 1.2em; height: 1.2em;"><path d="M6 20h12M12 4v12M8 12l4 4 4-4"/></svg>', color: '#a855f7', bgColor: 'rgba(168, 85, 247, 0.15)', dayTypes: ['Pull + Grip'] },
    { id: 'cardio', label: 'Cardio', subtitle: 'אירובי · התאוששות', icon: '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 1.2em; height: 1.2em;"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>', color: '#10b981', bgColor: 'rgba(16, 185, 129, 0.15)', dayTypes: ['Active Recovery'] }
  ];

  // Band weight progression tiers (exercise name → sorted tiers)
  const BAND_WEIGHT_PROGRESSION = {
    'Seated Band Row': [{ weight: '30 kg', fromWeek: 1 }, { weight: '40 kg', fromWeek: 5 }, { weight: '50 kg', fromWeek: 13 }],
    'Band Pull-Apart': [{ weight: '30 kg', fromWeek: 1 }, { weight: '40 kg', fromWeek: 5 }, { weight: '50 kg', fromWeek: 9 }],
    'Band Curl': [{ weight: '30 kg', fromWeek: 1 }, { weight: '40 kg', fromWeek: 17 }, { weight: '50 kg', fromWeek: 33 }],
    'Banded Single-Leg RDL': [{ weight: '30 kg', fromWeek: 10 }, { weight: '40 kg', fromWeek: 21 }, { weight: '50 kg', fromWeek: 33 }],
    'Banded Glute Bridge': [{ weight: '30 kg', fromWeek: 13 }, { weight: '40 kg', fromWeek: 21 }, { weight: '50 kg', fromWeek: 33 }]
  };
  const SKILL_TREES = {
    'lower-strength': [
      {
        title: 'חימום וניידות', icon: '⚡', exercises: [
          { name: 'High Knees', unlockWeek: 1 }, { name: 'Arm Circles', unlockWeek: 1 }, { name: 'Wall Slides', unlockWeek: 1 }, { name: 'Scapular Push-up', unlockWeek: 1 }, { name: 'Dead Bug', unlockWeek: 1 }, { name: 'Ankle Dorsiflexion Mobility', unlockWeek: 1 }
        ]
      },
      {
        title: 'כוח רגליים (Squat & Hinge)', icon: '🏋️', exercises: [
          { name: 'Bodyweight Squat', unlockWeek: 1 }, { name: 'Reverse Lunge', unlockWeek: 1 }, { name: 'Split Squat', unlockWeek: 1 }, { name: 'Dumbbell Goblet Squat', unlockWeek: 1 }, { name: 'Bulgarian Split Squat', unlockWeek: 1 }, { name: 'Wall-Supported Skater Squat', unlockWeek: 1 }, { name: 'Pistol Squat to Chair', unlockWeek: 1 }, { name: 'Full Pistol Squat', unlockWeek: 1 }
        ]
      },
      {
        title: 'המסטרינג ושרשרת אחורית', icon: '🦵', exercises: [
          { name: 'Bodyweight Single-Leg RDL', unlockWeek: 1 }, { name: 'Banded Single-Leg RDL', unlockWeek: 1 }, { name: 'Hamstring Towel Curl', unlockWeek: 1 }, { name: 'Dumbbell Romanian Deadlift (RDL)', unlockWeek: 1 }, { name: 'Dumbbell Single-Leg RDL', unlockWeek: 1 }
        ]
      },
      {
        title: 'ישבן ותאומים', icon: '🍑', exercises: [
          { name: 'Single-Leg Glute Bridge', unlockWeek: 1 }, { name: 'Banded Glute Bridge', unlockWeek: 1 }, { name: 'Calf Raise', unlockWeek: 1 }, { name: 'Single-Leg Calf Raise', unlockWeek: 1 }, { name: 'Dumbbell Single-Leg Calf Raise', unlockWeek: 1 }
        ]
      },
      {
        title: 'מבצר הליבה', icon: '🛡️', exercises: [
          { name: 'Dead Bug', unlockWeek: 1 }, { name: 'Hollow Body Rock', unlockWeek: 1 }, { name: 'Hollow-to-Arch Rock', unlockWeek: 1 }, { name: 'L-sit on Chair', unlockWeek: 1 }, { name: 'L-sit on Floor', unlockWeek: 1 }, { name: 'Dragon Flag Negative', unlockWeek: 1 }, { name: 'Dragon Flag (Partial ROM)', unlockWeek: 1 }, { name: 'Dragon Flag', unlockWeek: 1 }, { name: 'Dumbbell Suitcase Hold', unlockWeek: 1 }, { name: 'Pallof Press (Band)', unlockWeek: 1 }
        ]
      }
    ],
    'upper-push': [
      {
        title: 'חימום והכנה', icon: '⚡', exercises: [
          { name: 'High Knees', unlockWeek: 1 }, { name: 'Arm Circles', unlockWeek: 1 }, { name: 'Wall Slides', unlockWeek: 1 }, { name: 'Scapular Push-up', unlockWeek: 1 }, { name: 'Dead Bug', unlockWeek: 1 }
        ]
      },
      {
        title: 'מיומנות עמידת ידיים', icon: '🤸', exercises: [
          { name: 'Handstand Practice', unlockWeek: 1 }
        ]
      },
      {
        title: 'לחיצות חזה ומשקולות', icon: '💥', exercises: [
          { name: 'Table Push-up', unlockWeek: 1 }, { name: 'Knee Push-up', unlockWeek: 1 }, { name: 'Push-up', unlockWeek: 1 }, { name: 'Close-Grip Push-up', unlockWeek: 1 }, { name: 'TRX Push-up', unlockWeek: 1 }, { name: 'Dumbbell Floor Press', unlockWeek: 1 }, { name: 'Diamond Push-up', unlockWeek: 1 }, { name: 'Decline Push-up', unlockWeek: 1 }, { name: 'Archer Push-up', unlockWeek: 1 }, { name: 'One-Arm Push-up Lean', unlockWeek: 1 }, { name: 'Pseudo-Planche Lean', unlockWeek: 1 }
        ]
      },
      {
        title: 'כתפיים ולחיצות מעל הראש', icon: '🎯', exercises: [
          { name: 'Table Pike Push-up', unlockWeek: 1 }, { name: 'Pike Push-up', unlockWeek: 1 }, { name: 'Elevated Pike Push-up', unlockWeek: 1 }, { name: 'Dumbbell Standing Overhead Press (OHP)', unlockWeek: 1 }, { name: 'Dumbbell Lateral Raise', unlockWeek: 1 }, { name: 'Wall Handstand', unlockWeek: 1 }, { name: 'Wall Walk (Full)', unlockWeek: 1 }, { name: 'Wall Handstand Push-up Negative', unlockWeek: 1 }, { name: 'Handstand Push-up', unlockWeek: 1 }
        ]
      },
      {
        title: 'מניעת פציעות כתף (Prehab)', icon: '🩹', exercises: [
          { name: 'Band Pull-Apart', unlockWeek: 1 }, { name: 'Prone Y-T-W', unlockWeek: 1 }, { name: 'Band Face-Pull', unlockWeek: 1 }
        ]
      }
    ],
    'upper-pull': [
      {
        title: 'חימום והכנה', icon: '⚡', exercises: [
          { name: 'High Knees', unlockWeek: 1 }, { name: 'Arm Circles', unlockWeek: 1 }, { name: 'Wall Slides', unlockWeek: 1 }, { name: 'Scapular Push-up', unlockWeek: 1 }, { name: 'Dead Bug', unlockWeek: 1 }
        ]
      },
      {
        title: 'חתירה וכוח רוחבי', icon: '↔️', exercises: [
          { name: 'Seated Band Row', unlockWeek: 1 }, { name: 'Inverted Row', unlockWeek: 1 }, { name: 'TRX Row', unlockWeek: 1 }, { name: 'Dumbbell Bent-Over Row', unlockWeek: 1 }, { name: 'Dumbbell One-Arm Row', unlockWeek: 1 }
        ]
      },
      {
        title: 'עליות מתח וכוח אנכי', icon: '🧗', exercises: [
          { name: 'Scapular Pull-up', unlockWeek: 1 }, { name: 'Dead Hang', unlockWeek: 1 }, { name: 'Pull-up Negative', unlockWeek: 1 }, { name: 'Chin-up Negative', unlockWeek: 1 }, { name: 'Chin-up', unlockWeek: 1 }, { name: 'Pull-up (Overhand)', unlockWeek: 1 }, { name: 'Explosive Pull-up', unlockWeek: 1 }, { name: 'Tuck Front Lever Row', unlockWeek: 1 }
        ]
      },
      {
        title: 'ידיים (Biceps) וכוח אחיזה', icon: '✊', exercises: [
          { name: 'Band Curl', unlockWeek: 1 }, { name: 'Dumbbell Biceps Curl', unlockWeek: 1 }, { name: 'Dumbbell Hammer Curl', unlockWeek: 1 }, { name: 'Towel Grip Hang', unlockWeek: 1 }
        ]
      },
      {
        title: 'גירוי ליבה קל', icon: '🧱', exercises: [
          { name: 'Side Plank Hip Dip', unlockWeek: 1 }, { name: 'L-sit on Chair', unlockWeek: 1 }, { name: 'L-sit on Floor', unlockWeek: 1 }
        ]
      }
    ],
    'cardio': [
      {
        title: 'אירובי קרדיו-וואסקולרי', icon: '🫀', exercises: [
          { name: 'Relaxed Walking', unlockWeek: 1 }, { name: 'Brisk Walking', unlockWeek: 1 }, { name: 'Zone 2 Incline Walking (10-12% Incline)', unlockWeek: 1 }, { name: 'Norwegian 4x4 VO2 Max Running / Walking', unlockWeek: 1 }
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
        if (!day.dayType || day.dayType === 'Rest') return;
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

    if (!activeTab) {
      headerEl.innerHTML = `
        <div style="text-align: center; padding: 40px; color: var(--text-secondary);">
          <div style="font-size: 48px; margin-bottom: 16px;">🌳</div>
          <p>בחר קטגוריה כדי לראות את עץ ההתקדמות</p>
        </div>
      `;
      return;
    }

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

    if (!activeTab) {
      contentEl.innerHTML = '';
      return;
    }

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
          html += `
            <div class="rpg-node ${stateClass} ${latestClass}" 
                 style="animation-delay: ${(pathIndex * 0.1) + (levelIndex * 0.08) + (nodeIdx * 0.05)}s">
              <div class="rpg-node-hex-wrap">
                <div class="rpg-node-hex" style="cursor: pointer;" onclick="event.stopPropagation(); UI.showImageModal('${node.name.replace(/'/g, "\\'")}', '${imgSrc || ''}')">
                  ${isUnlocked ? '' : '<div class="rpg-lock-icon">🔒</div>'}
                  ${imgSrc ? `<img src="${imgSrc}" class="rpg-node-img" alt="${node.name}" onerror="this.style.display='none'; this.parentElement.querySelector('.rpg-node-emoji') && (this.parentElement.querySelector('.rpg-node-emoji').style.display='flex')">` : ''}
                  ${!imgSrc || node.noImage ? `<div class="rpg-node-emoji" style="display:flex">${path.icon}</div>` : `<div class="rpg-node-emoji" style="display:none">${path.icon}</div>`}
                  ${isUnlocked ? `<div class="rpg-node-glow" style="--glow-color: ${tabColor}"></div>` : ''}
                </div>
              </div>
              <div class="rpg-node-info">
                <div class="rpg-node-name">${node.name}</div>
                <div class="rpg-node-badges">
                  ${!isUnlocked 
                    ? `<span class="rpg-unlock-badge locked">🔒 שבוע ${node.unlockWeek}</span>` 
                    : `<span class="rpg-unlock-badge unlocked">✓ שבוע ${node.unlockWeek}</span>`}
                  ${equip && equip.label !== 'משקל גוף בלבד' ? `<span class="rpg-equip-badge" style="background: var(--bg-hover); color: var(--text-primary); border: 1px solid var(--border-light); padding: 4px 8px; border-radius: 6px; font-weight: 600; font-size: 11px; display: inline-flex; align-items: center; gap: 4px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">${equip.icon} ${equip.label}</span>` : ''}
                </div>
                ${(() => {
                  const tiers = BAND_WEIGHT_PROGRESSION[node.name];
                  if (!tiers || tiers.length === 0) return '';
                  const wClass = (w) => 'evo-w' + parseInt(w);
                  if (tiers.length === 1) {
                    const t = tiers[0];
                    const tierActive = currentWeek >= t.fromWeek;
                    return `<div class="rpg-evo-single">
                      <span class="rpg-evo-card ${wClass(t.weight)} ${tierActive ? 'active current' : 'locked'}">
                        <span class="rpg-evo-weight">${t.weight}</span>
                        <span class="rpg-evo-week">${tierActive ? '✓' : '🔒'} ש׳${t.fromWeek}</span>
                      </span>
                    </div>`;
                  }
                  let evoHtml = '';
                  tiers.forEach((t, ti) => {
                    const tierActive = currentWeek >= t.fromWeek;
                    const tierLatest = tierActive && (ti === tiers.length - 1 || currentWeek < tiers[ti + 1].fromWeek);
                    const tierCompleted = tierActive && !tierLatest;
                    const stClass = tierCompleted ? 'completed' : tierLatest ? 'active current' : 'locked';
                    if (ti > 0) {
                      const prevActive = currentWeek >= tiers[ti - 1].fromWeek;
                      evoHtml += `<div class="rpg-evo-connector ${prevActive && tierActive ? 'active' : ''}">
                        <div class="rpg-evo-line"></div>
                        <div class="rpg-evo-arrow-head">▸</div>
                      </div>`;
                    }
                    evoHtml += `<div class="rpg-evo-card ${wClass(t.weight)} ${stClass}">
                      <span class="rpg-evo-phase">Tier ${ti + 1}</span>
                      <span class="rpg-evo-weight">${t.weight}</span>
                      <span class="rpg-evo-week">${tierCompleted ? '✓' : tierLatest ? '◆' : '🔒'} שבוע ${t.fromWeek}</span>
                    </div>`;
                  });
                  return `<div class="rpg-evo-chain">${evoHtml}</div>`;
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
    const gifPath = `images/gifs/${ex.name}.gif`;
    const videoLink = `<button type="button" class="exercise-video-btn" title="צפה ב-GIF" style="color: var(--danger);" onclick="UI.showImageModal('${ex.name.replace(/'/g, "\\'")}', '${gifPath}'); event.stopPropagation();">▶</button>`;

    const equip = UI.getEquipment(ex.name);
    let weightDisplay = ex.weight || '';
    if (weightDisplay && equip && equip.label === 'גומיית התנגדות' && weightDisplay !== '—' && weightDisplay !== 'משקל גוף') {
      weightDisplay = `משקל גומיה: ${weightDisplay}`;
    }

    return `
      <div class="guide-card">
        <div class="guide-card-image-container diff-${diffClass}">
          <img src="images/exercises/${ex.name.replace(/\//g, '-').toUpperCase()}.png" class="exercise-image" alt="${ex.name}" onclick="event.stopPropagation(); UI.showImageModal('${ex.name.replace(/'/g, "\\'")}', this.src)" onerror="UI.handleImageFallback(this, 'png')">
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
    const gifPath = `images/gifs/${ex.name}.gif`;
    const fullHtml = `
      <div style="display: flex; flex-direction: column; gap: 16px;">
        ${html}
        <img src="${gifPath}" style="width:100%; border-radius:8px; object-fit: contain; max-height: 40vh;" alt="${ex.name} GIF" onerror="UI.handleImageFallback(this, 'gif')">
      </div>
    `;
    UI.showModal(ex.name, fullHtml);
  }

  return {
    init,
    render,
    setFilter,
    showExerciseDetails,
    switchTab
  };
})();
