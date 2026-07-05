/**
 * Exercises Guide Page Module
 */
const ExercisesPage = (() => {
  let allExercises = [];
  let categories = [];

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
      render(e.target.value, getActiveFilter());
    });
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
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    render(document.getElementById('exercise-search').value, category);
  }

  /**
   * Render exercises guide
   */
  function render(searchTerm = '', filterCategory = 'all') {
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
        ? `<a href="${ex.videoUrl}" target="_blank" class="guide-video-link">▶ צפה בסרטון</a>`
        : '';

      return `
        <div class="guide-card">
          <img src="images/exercises/${ex.name.replace(/\//g, '-').toUpperCase()}.png" class="exercise-image" alt="${ex.name}" onerror="this.style.display='none'">
          <div class="guide-card-title">
            ${ex.name}
          </div>
          <span class="guide-card-category">${ex.category || ''}</span>
          <div class="guide-card-sets">${ex.setsProgression || ''}</div>
          <div class="guide-card-meta">
            <span class="guide-difficulty ${diffClass}">${ex.difficulty || ''}</span>
            <span class="guide-weight">${ex.weight || ''}</span>
            ${videoLink}
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
