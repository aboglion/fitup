// State
let appData = JSON.parse(JSON.stringify(WORKOUT_DATA));
let navStack = [];
let currentDay = null, currentMuscle = null, currentExercise = null;

// Init
window.addEventListener('DOMContentLoaded', () => {
  loadSaved();
  setTimeout(() => {
    document.getElementById('splash-screen').classList.add('fade-out');
    document.getElementById('app').classList.remove('hidden');
    setTimeout(() => document.getElementById('splash-screen').remove(), 600);
  }, 1200);
  renderHome();
});

function loadSaved() {
  try {
    const s = localStorage.getItem('fitpro_data');
    if (s) appData = JSON.parse(s);
  } catch(e) {}
}
function saveData() {
  localStorage.setItem('fitpro_data', JSON.stringify(appData));
  try { AuthModule.markDirty(); } catch(e) {}
}

// Navigation
let isGoingBack = false;

function pushNav(callback) {
  if (isGoingBack) return;
  navStack.push(callback);
  history.pushState({ depth: navStack.length }, '');
}

function showScreen(id, title) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  const t = document.getElementById('nav-title');
  const b = document.getElementById('btn-back');
  if (title) t.textContent = title;
  b.classList.toggle('hidden', navStack.length === 0);
}

function goBack() {
  if (navStack.length === 0) return;
  history.back();
}

// Intercept popstate for browser back/forward buttons
window.addEventListener('popstate', (event) => {
  const targetDepth = (event.state && typeof event.state.depth === 'number') ? event.state.depth : 0;
  
  isGoingBack = true;
  while (navStack.length > targetDepth) {
    const prev = navStack.pop();
    if (prev) prev();
  }
  isGoingBack = false;
  
  const b = document.getElementById('btn-back');
  if (b) b.classList.toggle('hidden', navStack.length === 0);
});

// Home - Smart Today View
function renderHome() {
  navStack = [];
  if (!isGoingBack) {
    history.replaceState({ depth: 0 }, '');
  }
  const h = new Date().getHours();
  const g = h < 12 ? 'בוקר טוב ☀️' : h < 18 ? 'צהריים טובים 🌤️' : 'ערב טוב 🌙';
  document.getElementById('greeting-text').textContent = g;
  document.getElementById('current-date').textContent = new Date().toLocaleDateString('he-IL', {weekday:'long', year:'numeric', month:'long', day:'numeric'});

  // XP Bar
  const prog = TrainingEngine.getProgress();
  const nextXP = TrainingEngine.getNextRankXP();
  const pct = Math.min((prog.xp / nextXP) * 100, 100);
  const xpContainer = document.getElementById('xp-bar-container');
  if (xpContainer) {
    xpContainer.innerHTML = `
      <div class="xp-header">
        <span class="xp-rank">${TrainingEngine.getRankEmoji()} ${prog.rank}</span>
        <span class="xp-points">${prog.xp} XP</span>
      </div>
      <div class="xp-bar"><div class="xp-fill" style="width:${pct}%"></div></div>
      <div class="xp-stats-row">
        <span>🔥 רצף: ${prog.streak || 0} ימים</span>
        <span>💪 אימונים: ${prog.totalWorkouts || 0}</span>
      </div>`;
  }

  // Smart Today Card
  const plan = TrainingEngine.getTodayPlan();
  const todayCard = document.getElementById('today-card');
  if (plan.type === 'rest' || plan.type === 'done') {
    todayCard.innerHTML = `
      <div class="today-rest-card">
        <div class="rest-icon">${plan.type === 'done' ? '✅' : '😴'}</div>
        <h3>${plan.message}</h3>
        <p class="rest-tip">המנוחה בונה את השרירים. חזור מחר חזק יותר!</p>
      </div>`;
  } else {
    const day = appData.days.find(d => d.id === plan.dayId);
    if (day) {
      const muscleCount = day.muscles.length;
      todayCard.innerHTML = `
        <div class="today-workout-card" onclick="openDay('${day.id}')">
          <div class="today-badge">האימון שלך להיום</div>
          <div class="today-main">
            <span class="today-emoji">${day.emoji}</span>
            <div class="today-info">
              <h3>${day.name}</h3>
              <p>${day.subtitle}</p>
            </div>
          </div>
          <div class="today-muscles">
            ${day.muscles.map(m => {
              const cur = TrainingEngine.getCurrentExercise(m);
              const lc = appData.levelColors[cur.exercise.level] || {};
              return `<div class="today-muscle-chip">${lc.emoji||'🟢'} ${m.nameHe}</div>`;
            }).join('')}
          </div>
          <button class="today-start-btn">▶ התחל אימון</button>
        </div>`;
    }
  }

  // Weekly Progress
  const week = TrainingEngine.getWeekStatus();
  const weekEl = document.getElementById('weekly-progress');
  if (weekEl) {
    weekEl.innerHTML = `
      <h4 class="section-title">📅 השבוע שלי</h4>
      <div class="week-dots">
        ${week.map(d => `
          <div class="week-day ${d.isToday ? 'today' : ''} ${d.completed ? 'done' : ''}">
            <span class="week-dot">${d.completed ? '✅' : d.isToday ? '🔵' : '⚪'}</span>
            <span class="week-name">${d.name}</span>
          </div>`).join('')}
      </div>`;
  }

  // Stats overview
  const statsEl = document.getElementById('stats-overview');
  if (statsEl) {
    statsEl.innerHTML = `
      <h4 class="section-title">📊 סטטיסטיקות</h4>
      <div class="stats-grid">
        <div class="stat-mini"><span class="stat-mini-num">${prog.totalWorkouts || 0}</span><span class="stat-mini-label">אימונים</span></div>
        <div class="stat-mini"><span class="stat-mini-num">${prog.streak || 0}</span><span class="stat-mini-label">רצף ימים</span></div>
        <div class="stat-mini"><span class="stat-mini-num">${prog.xp || 0}</span><span class="stat-mini-label">XP</span></div>
        <div class="stat-mini"><span class="stat-mini-num">${Object.values(prog.muscleLevels || {}).filter(v=>v>0).length}</span><span class="stat-mini-label">שדרוגים</span></div>
      </div>
      <div class="all-days-link" onclick="showAllDays()">📋 כל ימי האימון →</div>
      <div class="leaderboard-link" onclick="showLeaderboard()">🏆 טבלת תחרות ומובילים →</div>`;
  }

  if (typeof updateSyncNav === 'function') {
    updateSyncNav(AuthModule.isConnected());
  }
  showScreen('screen-home', 'FitPro');
}

// Show all days (fallback grid)
function showAllDays() {
  pushNav(() => renderHome());
  const container = document.getElementById('today-card');
  container.innerHTML = appData.days.map(d => `
    <div class="day-card" onclick="openDay('${d.id}')">
      <div class="day-card-top">
        <span class="day-card-emoji">${d.emoji}</span>
        <div class="day-card-info"><h3>${d.name}</h3><p>${d.subtitle}</p></div>
      </div>
    </div>`).join('');
  document.getElementById('weekly-progress').innerHTML = '';
  document.getElementById('stats-overview').innerHTML = '';
}

function updateSyncNav(connected) {
  const indicator = document.getElementById('sync-status-indicator');
  const dropdown = document.getElementById('sync-dropdown');
  if (!indicator || !dropdown) return;

  const syncInfo = AuthModule.getSyncInfo();
  const isDirty = syncInfo.is_dirty;

  if (connected) {
    const profile = AuthModule.getProfile() || {};
    const lastSync = syncInfo.last_cloud_sync 
      ? new Date(syncInfo.last_cloud_sync).toLocaleString('he-IL', {hour:'2-digit', minute:'2-digit', second:'2-digit'}) 
      : 'לא בוצע';
    
    // Indicator: Show profile avatar with status badge
    indicator.innerHTML = `
      <div class="nav-avatar-wrap">
        <img src="${profile.picture || ''}" class="nav-avatar" onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2232%22 height=%2232%22><circle cx=%2216%22 cy=%2216%22 r=%2216%22 fill=%22%236c5ce7%22/><text x=%2216%22 y=%2221%22 text-anchor=%22middle%22 fill=%22white%22 font-size=%2214%22 font-weight=%22bold%22>${(profile.name || 'U').charAt(0)}</text></svg>'">
        <span class="status-badge ${isDirty ? 'dirty' : 'clean'}" title="${isDirty ? 'ממתין לסנכרון' : 'מסונכרן'}"></span>
      </div>
    `;

    // Dropdown: Show profile details + sync details + actions
    dropdown.innerHTML = `
      <div class="dropdown-user-header">
        <img src="${profile.picture || ''}" class="dropdown-avatar" onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2236%22 height=%2236%22><circle cx=%2218%22 cy=%2218%22 r=%2218%22 fill=%22%236c5ce7%22/><text x=%2218%22 y=%2223%22 text-anchor=%22middle%22 fill=%22white%22 font-size=%2214%22 font-weight=%22bold%22>${(profile.name || 'U').charAt(0)}</text></svg>'">
        <div class="dropdown-user-details">
          <span class="dropdown-user-name">${profile.name || 'משתמש גוגל'}</span>
          <span class="dropdown-user-email">${profile.email || ''}</span>
        </div>
      </div>
      <div class="dropdown-divider"></div>
      <div class="dropdown-sync-stats">
        <div class="dropdown-stat-row">
          <span>סנכרון אחרון:</span>
          <span class="stat-value">${lastSync}</span>
        </div>
        <div class="dropdown-stat-row">
          <span>שינויים ממתינים:</span>
          <span class="stat-value ${isDirty ? 'dirty' : 'clean'}">
            ${isDirty ? '🔄 כן' : '🟢 לא'}
          </span>
        </div>
      </div>
      <div class="dropdown-divider"></div>
      <div class="dropdown-actions">
        <button class="dropdown-btn primary" onclick="manualSync(); event.stopPropagation();">☁️ סנכרן עכשיו</button>
        <button class="dropdown-btn" onclick="manualRestore(); event.stopPropagation();">📥 שחזר מהענן</button>
        <button class="dropdown-btn danger" onclick="AuthModule.signOut(); event.stopPropagation();">🚪 התנתק</button>
      </div>
    `;
  } else {
    // Indicator: Cloud icon with offline lock badge
    indicator.innerHTML = `
      <div class="nav-connect-trigger" title="לא מחובר לענן">
        <span class="cloud-icon">☁️</span>
        <span class="status-badge disconnected">🔒</span>
      </div>
    `;

    // Dropdown: Promotional text + Sign-in button
    dropdown.innerHTML = `
      <div class="dropdown-promo">
        <h4>☁️ גיבוי וסנכרון לענן</h4>
        <p>חבר את חשבון הגוגל שלך כדי לסנכרן אימונים והתקדמות באופן אוטומטי בין כל המכשירים שלך.</p>
      </div>
      <div class="dropdown-actions">
        <button class="google-signin-btn sm" onclick="AuthModule.signIn(); event.stopPropagation();">
          <svg class="google-icon" viewBox="0 0 24 24" width="16" height="16">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          התחבר עם גוגל
        </button>
      </div>
    `;
  }
}

function toggleSyncDropdown(event) {
  event.stopPropagation();
  const dropdown = document.getElementById('sync-dropdown');
  if (dropdown) {
    dropdown.classList.toggle('hidden');
  }
}

// Close dropdown when clicking outside
window.addEventListener('click', () => {
  const dropdown = document.getElementById('sync-dropdown');
  if (dropdown) dropdown.classList.add('hidden');
});

// Day View - Show current level exercises only
function openDay(dayId) {
  pushNav(() => renderHome());
  currentDay = appData.days.find(d => d.id === dayId);
  if (!currentDay) return;
  document.getElementById('day-emoji').textContent = currentDay.emoji;
  document.getElementById('day-title').textContent = currentDay.name;
  document.getElementById('day-subtitle').textContent = currentDay.subtitle;

  // Day progress bar
  const progBar = document.getElementById('day-progress-bar');
  if (progBar) {
    const totalMuscles = currentDay.muscles.length;
    const upgraded = currentDay.muscles.filter(m => TrainingEngine.getMuscleLevel(m.id) > 0).length;
    const pct = totalMuscles > 0 ? (upgraded / totalMuscles) * 100 : 0;
    progBar.innerHTML = `<div class="day-prog-fill" style="width:${pct}%"></div><span class="day-prog-text">${upgraded}/${totalMuscles} שדרוגים</span>`;
  }

  const list = document.getElementById('muscles-list');
  list.innerHTML = currentDay.muscles.map(m => {
    const cur = TrainingEngine.getCurrentExercise(m);
    const e = cur.exercise;
    const lc = appData.levelColors[e.level] || {};
    const levelIdx = cur.levelIndex;
    const totalLevels = m.exercises.length;
    const imgSrc = e.imageData || `../${currentDay.folder}/${e.image}`;
    
    return `
    <div class="muscle-card-game" onclick="openMuscle('${m.id}')">
      <div class="muscle-card-inner">
        <img class="muscle-card-img" src="${imgSrc}" alt="${m.name}" onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2270%22 height=%2270%22><rect fill=%22%231a1a3e%22 width=%2270%22 height=%2270%22/><text x=%2235%22 y=%2240%22 text-anchor=%22middle%22 fill=%22%23666%22 font-size=%2220%22>💪</text></svg>'">
        <div class="muscle-card-info">
          <h3>${m.nameHe}</h3>
          <span class="current-exercise-name">${e.name}</span>
          <div class="level-progress-dots">
            ${m.exercises.map((ex, i) => {
              const elc = appData.levelColors[ex.level] || {};
              const state = i < levelIdx ? 'done' : i === levelIdx ? 'current' : 'locked';
              return `<span class="level-dot ${state}" style="--dot-color:${elc.hex || '#666'}" title="${elc.name || ''}">${state === 'done' ? '✓' : state === 'locked' ? '🔒' : elc.emoji || '●'}</span>`;
            }).join('')}
          </div>
        </div>
        <div class="muscle-level-badge" style="background:${lc.hex}22;border-color:${lc.hex};color:${lc.hex}">
          ${lc.emoji || ''} ${levelIdx + 1}/${totalLevels}
        </div>
      </div>
    </div>`;
  }).join('');
  showScreen('screen-day', currentDay.name);
}

// Muscle View - Show current exercise detail + level map
function openMuscle(muscleId) {
  pushNav(() => openDay(currentDay.id));
  currentMuscle = currentDay.muscles.find(m => m.id === muscleId);
  if (!currentMuscle) return;

  const cur = TrainingEngine.getCurrentExercise(currentMuscle);
  const e = cur.exercise;
  const lc = appData.levelColors[e.level] || {};

  // Show exercise detail directly (no separate screen needed)
  const detail = document.getElementById('exercise-detail');
  detail.innerHTML = `
    <div class="ex-detail-img-wrap">
      <img class="ex-detail-img" src="${e.imageData || `../${currentDay.folder}/${e.image}`}" alt="${e.name}" onerror="this.style.display='none'">
    </div>
    <div class="ex-detail-header">
      <h2>${e.name} ${e.equipment||''}</h2>
      <span class="ex-detail-level ${e.level}">${lc.emoji||''} ${lc.name||e.level}</span>
    </div>
    <div class="ex-detail-stats">
      <div class="stat-card"><div class="stat-label">סטים</div><div class="stat-value">${e.sets}</div></div>
      <div class="stat-card"><div class="stat-label">חזרות</div><div class="stat-value">${e.reps}</div></div>
      <div class="stat-card"><div class="stat-label">מנוחה</div><div class="stat-value">${e.rest}</div></div>
      <div class="stat-card"><div class="stat-label">טמפו</div><div class="stat-value">${e.tempo}</div></div>
    </div>
    <div class="ex-detail-progression">
      <h4>🎯 תנאי מעבר לרמה הבאה</h4>
      <p>${e.progression}</p>
    </div>
    
    <!-- Level Map -->
    <div class="level-map">
      <h4>🗺️ מפת רמות</h4>
      ${currentMuscle.exercises.map((ex, i) => {
        const elc = appData.levelColors[ex.level] || {};
        const state = i < cur.levelIndex ? 'completed' : i === cur.levelIndex ? 'current' : 'locked';
        return `
        <div class="level-map-item ${state}">
          <div class="level-map-connector"></div>
          <div class="level-map-dot" style="--level-color:${elc.hex}">${state === 'completed' ? '✅' : state === 'current' ? elc.emoji : '🔒'}</div>
          <div class="level-map-info">
            <span class="level-map-name">${state === 'locked' ? '???' : ex.name}</span>
            <span class="level-map-badge" style="color:${elc.hex}">${elc.name || ''}</span>
          </div>
        </div>`;
      }).join('')}
    </div>
    
    ${e.video ? `<button class="ex-video-btn" onclick="playVideo('${e.video}')">ℹ️ הסבר מפורט</button>` : '<button class="ex-video-btn" disabled>אין הסבר זמין</button>'}
  `;
  showScreen('screen-exercise', currentMuscle.nameHe);
}

// Video
function playVideo(url) {
  if (url) {
    window.open(url, '_blank');
  }
}

function closeVideoModal() {
  document.getElementById('video-modal').classList.add('hidden');
  document.getElementById('video-container').innerHTML = '';
}

// Admin
function showAdminPanel() {
  pushNav(() => renderHome());
  showScreen('screen-admin', 'ניהול');
  switchAdminTab('days');
}

function switchAdminTab(tab) {
  document.querySelectorAll('.admin-tab').forEach(t => t.classList.toggle('active', t.dataset.tab === tab));
  const c = document.getElementById('admin-content');

  if (tab === 'days') {
    c.innerHTML = appData.days.map((d,i) => `
      <div class="admin-item">
        <div class="admin-item-header">
          <h4>${d.emoji} ${d.name}</h4>
          <div class="admin-item-actions">
            <button class="admin-btn-sm" onclick="editDay(${i})">✏️ ערוך</button>
          </div>
        </div>
        <p style="color:var(--text-secondary);font-size:0.85rem">${d.subtitle} • ${d.muscles.length} קבוצות שריר</p>
      </div>
    `).join('') + `<button class="admin-btn-add" onclick="addDay()">+ הוסף יום</button>`;
  } else if (tab === 'muscles') {
    c.innerHTML = appData.days.map(d => `
      <h4 style="margin:0.75rem 0 0.5rem;color:var(--accent-secondary)">${d.emoji} ${d.name}</h4>
      ${d.muscles.map((m,mi) => `
        <div class="admin-item">
          <div class="admin-item-header">
            <h4>${m.nameHe} (${m.name})</h4>
            <div class="admin-item-actions">
              <button class="admin-btn-sm" onclick="editMuscle('${d.id}',${mi})">✏️</button>
              <button class="admin-btn-sm danger" onclick="deleteMuscle('${d.id}',${mi})">🗑️</button>
            </div>
          </div>
          <p style="color:var(--text-secondary);font-size:0.85rem">${m.exercises.length} תרגילים</p>
        </div>
      `).join('')}
      <button class="admin-btn-add" onclick="addMuscle('${d.id}')">+ הוסף שריר ל${d.name}</button>
    `).join('');
  } else if (tab === 'exercises') {
    c.innerHTML = appData.days.map(d =>
      d.muscles.map(m => `
        <h4 style="margin:0.75rem 0 0.5rem;color:var(--accent-secondary)">${d.emoji} ${m.nameHe}</h4>
        ${m.exercises.map((e,ei) => `
          <div class="admin-item">
            <div class="admin-item-header">
              <h4>${appData.levelColors[e.level]?.emoji||''} ${e.name}</h4>
              <div class="admin-item-actions">
                <button class="admin-btn-sm" onclick="editExercise('${d.id}','${m.id}',${ei})">✏️</button>
                <button class="admin-btn-sm danger" onclick="deleteExercise('${d.id}','${m.id}',${ei})">🗑️</button>
              </div>
            </div>
            <p style="color:var(--text-secondary);font-size:0.8rem">${e.sets} סטים • ${e.reps} חזרות • ${e.type}</p>
          </div>
        `).join('')}
        <button class="admin-btn-add" onclick="addExercise('${d.id}','${m.id}')">+ הוסף תרגיל</button>
      `).join('')
    ).join('');
  } else if (tab === 'history') {
    const prog = TrainingEngine.getProgress();
    const history = (prog.workoutHistory || []).slice().reverse();
    c.innerHTML = `
      <div class="admin-item" style="text-align:center">
        <h4>📊 סה"כ ${prog.totalWorkouts || 0} אימונים | ${prog.xp || 0} XP | רצף ${prog.streak || 0} ימים</h4>
      </div>
      ${history.length === 0 ? '<div class="admin-item"><p style="color:var(--text-secondary);text-align:center">אין היסטוריית אימונים עדיין</p></div>' :
      history.map(h => `
        <div class="admin-item">
          <div class="admin-item-header">
            <h4>${h.dayName || h.dayId}</h4>
            <span style="color:var(--text-muted);font-size:0.8rem">${h.date}</span>
          </div>
          <p style="color:var(--text-secondary);font-size:0.82rem">⏱️ ${Math.floor((h.duration||0)/60)} דקות${h.logs ? ` • ${h.logs.length} תרגילים` : ''}</p>
        </div>
      `).join('')}
      ${history.length > 0 ? '<button class="admin-btn-sm danger" onclick="clearHistory()" style="width:100%;padding:0.6rem;margin-top:0.5rem">🗑️ נקה היסטוריה</button>' : ''}`;
  } else if (tab === 'cloud') {
    const connected = AuthModule.isConnected();
    const profile = AuthModule.getProfile();
    const syncInfo = AuthModule.getSyncInfo();
    const lastSync = syncInfo.last_cloud_sync ? new Date(syncInfo.last_cloud_sync).toLocaleString('he-IL') : 'לא בוצע סנכרון';
    c.innerHTML = `
      <div class="admin-item" style="text-align:center">
        ${connected && profile ? `
          <div style="margin-bottom:1rem">
            <img src="${profile.picture || ''}" style="width:60px;height:60px;border-radius:50%;border:2px solid var(--accent-primary);margin-bottom:0.5rem" onerror="this.style.display='none'">
            <h4>${profile.name || 'משתמש'}</h4>
            <p style="color:var(--text-secondary);font-size:0.85rem">${profile.email || ''}</p>
          </div>
          <div class="cloud-status connected">☁️ מחובר ומסונכרן</div>
        ` : `
          <div class="cloud-status disconnected">🔒 לא מחובר לענן</div>
          <p style="color:var(--text-secondary);font-size:0.85rem;margin:0.75rem 0">התחבר עם חשבון גוגל כדי לגבות ולסנכרן נתונים</p>
        `}
        <button class="google-signin-btn" id="google-auth-btn" onclick="${connected ? 'AuthModule.signOut()' : 'AuthModule.signIn()'}">
          ${connected ? '🚪 התנתק מגוגל' : `<svg class="google-icon" viewBox="0 0 24 24" width="18" height="18"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg> התחבר עם גוגל`}
        </button>
      </div>
      ${connected ? `
      <div class="admin-item">
        <h4 style="margin-bottom:0.75rem">📊 מצב סנכרון</h4>
        <div class="sync-info-row"><span>סנכרון אחרון:</span><span>${lastSync}</span></div>
        <div class="sync-info-row"><span>שינויים ממתינים:</span><span>${syncInfo.is_dirty ? '🔴 כן' : '🟢 לא'}</span></div>
        <button class="admin-btn-sm" onclick="manualSync()" style="width:100%;padding:0.6rem;margin-top:0.75rem">☁️ סנכרן עכשיו</button>
        <button class="admin-btn-sm" onclick="manualRestore()" style="width:100%;padding:0.6rem;margin-top:0.5rem">📥 שחזר מהענן</button>
      </div>
      ` : ''}
      <div class="admin-item">
        <h4 style="margin-bottom:0.5rem;font-size:0.85rem;color:var(--text-muted)">ℹ️ אופליין-ראשון</h4>
        <p style="color:var(--text-secondary);font-size:0.8rem;line-height:1.5">המערכת שומרת הכל מקומית ועובדת ללא אינטרנט. סנכרון לענן מתבצע אוטומטית ברקע כשיש חיבור.</p>
      </div>
    `;
  } else if (tab === 'settings') {
    const currentClientId = localStorage.getItem('fitpro_google_client_id') || '';
    c.innerHTML = `
      <div class="admin-item">
        <h4 style="margin-bottom:0.75rem">⏱️ הגדרות טיימרים</h4>
        <div class="admin-form-group"><label>מנוחה תרגיל מורכב (שניות)</label><input class="admin-input" type="number" value="180" id="set-compound-rest"></div>
        <div class="admin-form-group"><label>מנוחה תרגיל בידוד (שניות)</label><input class="admin-input" type="number" value="90" id="set-isolation-rest"></div>
        <div class="admin-form-group"><label>מעבר סופר-סט (שניות)</label><input class="admin-input" type="number" value="10" id="set-superset-trans"></div>
      </div>
      <div class="admin-item">
        <h4 style="margin-bottom:0.75rem">☁️ סנכרון גוגל (Google Drive)</h4>
        <div class="admin-form-group">
          <label>Google Client ID</label>
          <input class="admin-input" type="text" id="set-google-client-id" value="${currentClientId}" placeholder="הכנס Client ID מותאם אישית (אופציונלי)">
        </div>
        <button class="admin-btn-sm" onclick="saveGoogleSettings()" style="width:100%;padding:0.6rem;margin-top:0.5rem">💾 שמור הגדרות סנכרון</button>
      </div>
      <div class="admin-item">
        <h4 style="margin-bottom:0.75rem">📦 ייצוא / ייבוא</h4>
        <button class="admin-btn-sm" onclick="exportData()" style="width:100%;padding:0.6rem;margin-bottom:0.5rem">📥 ייצוא נתונים (JSON)</button>
        <div style="position:relative"><button class="admin-btn-sm" style="width:100%;padding:0.6rem">📤 ייבוא נתונים</button><input type="file" accept=".json" onchange="importData(event)" style="position:absolute;inset:0;opacity:0;cursor:pointer"></div>
      </div>
      <div class="admin-item">
        <h4 style="margin-bottom:0.75rem;color:var(--red)">⚠️ איפוס</h4>
        <button class="admin-btn-sm danger" onclick="resetData()" style="width:100%;padding:0.6rem">🔄 איפוס לברירת מחדל</button>
      </div>
    `;
  }
}

// Admin CRUD
function editDay(idx) {
  const d = appData.days[idx];
  openModal('עריכת יום', `
    <div class="admin-form-group"><label>שם</label><input class="admin-input" id="ed-name" value="${d.name}"></div>
    <div class="admin-form-group"><label>תיאור</label><input class="admin-input" id="ed-sub" value="${d.subtitle}"></div>
    <div class="admin-form-group"><label>אימוג'י</label><input class="admin-input" id="ed-emoji" value="${d.emoji}"></div>
    <div class="admin-form-group"><label>תיקייה</label><input class="admin-input" id="ed-folder" value="${d.folder}"></div>
    <button class="admin-save-btn" onclick="saveDay(${idx})">💾 שמור</button>
  `);
}
function saveDay(idx) {
  appData.days[idx].name = document.getElementById('ed-name').value;
  appData.days[idx].subtitle = document.getElementById('ed-sub').value;
  appData.days[idx].emoji = document.getElementById('ed-emoji').value;
  appData.days[idx].folder = document.getElementById('ed-folder').value;
  saveData(); closeModal(); switchAdminTab('days'); toast('היום עודכן');
}
function addDay() {
  appData.days.push({ id:'day'+Date.now(), name:'יום חדש', subtitle:'תיאור', emoji:'🏋️', folder:'day_new', muscles:[] });
  saveData(); switchAdminTab('days'); toast('יום חדש נוסף');
}

function editMuscle(dayId, mi) {
  const d = appData.days.find(x=>x.id===dayId);
  const m = d.muscles[mi];
  const imgSrc = m.imageData || `../${d.folder}/${m.image}`;
  openModal('עריכת שריר', `
    <div class="admin-form-group"><label>שם (EN)</label><input class="admin-input" id="em-name" value="${m.name}"></div>
    <div class="admin-form-group"><label>שם (HE)</label><input class="admin-input" id="em-namehe" value="${m.nameHe}"></div>
    <div class="admin-form-group"><label>📷 תמונה</label>
      <div class="img-upload-area" id="em-img-area" onclick="document.getElementById('em-img-input').click()">
        <img id="em-img-preview" src="${imgSrc}" onerror="this.style.display='none';this.nextElementSibling.style.display='block'">
        <span class="placeholder" style="${m.imageData||m.image?'display:none':''}">📷 לחץ להעלאת תמונה</span>
        <input type="file" id="em-img-input" accept="image/*" onchange="handleImgUpload(event,'em-img-preview','em-img-area')" style="position:absolute;inset:0;opacity:0;cursor:pointer">
      </div>
    </div>
    <button class="admin-save-btn" onclick="saveMuscle('${dayId}',${mi})">💾 שמור</button>
  `);
}
function saveMuscle(dayId, mi) {
  const d = appData.days.find(x=>x.id===dayId);
  d.muscles[mi].name = document.getElementById('em-name').value;
  d.muscles[mi].nameHe = document.getElementById('em-namehe').value;
  const preview = document.getElementById('em-img-preview');
  if (preview && preview.src && preview.src.startsWith('data:')) {
    d.muscles[mi].imageData = preview.src;
  }
  saveData(); closeModal(); switchAdminTab('muscles'); toast('השריר עודכן');
}
function addMuscle(dayId) {
  const d = appData.days.find(x=>x.id===dayId);
  d.muscles.push({ id:'m'+Date.now(), name:'New Muscle', nameHe:'שריר חדש', image:'m1.png', exercises:[] });
  saveData(); switchAdminTab('muscles'); toast('שריר חדש נוסף');
}
function deleteMuscle(dayId, mi) {
  if (!confirm('למחוק שריר זה?')) return;
  const d = appData.days.find(x=>x.id===dayId);
  d.muscles.splice(mi, 1);
  saveData(); switchAdminTab('muscles'); toast('השריר נמחק');
}

function editExercise(dayId, muscleId, ei) {
  const d = appData.days.find(x=>x.id===dayId);
  const m = d.muscles.find(x=>x.id===muscleId);
  const e = m.exercises[ei];
  const lvlOpts = Object.entries(appData.levelColors).map(([k,v]) => `<option value="${k}" ${e.level===k?'selected':''}>${v.emoji} ${v.name}</option>`).join('');
  const typeOpts = Object.entries(appData.exerciseTypes).map(([k,v]) => `<option value="${k}" ${e.type===k?'selected':''}>${v.name}</option>`).join('');
  const imgSrc = e.imageData || `../${d.folder}/${e.image}`;
  openModal('עריכת תרגיל', `
    <div class="admin-form-group"><label>שם</label><input class="admin-input" id="ee-name" value="${e.name}"></div>
    <div class="admin-form-group"><label>רמה</label><select class="admin-select" id="ee-level">${lvlOpts}</select></div>
    <div class="admin-form-group"><label>סוג</label><select class="admin-select" id="ee-type">${typeOpts}</select></div>
    <div class="admin-form-group"><label>📷 תמונת התרגיל</label>
      <div class="img-upload-area" id="ee-img-area" onclick="document.getElementById('ee-img-input').click()">
        <img id="ee-img-preview" src="${imgSrc}" onerror="this.style.display='none';this.nextElementSibling.style.display='block'">
        <span class="placeholder" style="${e.imageData||e.image?'display:none':''}">📷 לחץ להעלאת תמונה</span>
        <input type="file" id="ee-img-input" accept="image/*" onchange="handleImgUpload(event,'ee-img-preview','ee-img-area')" style="position:absolute;inset:0;opacity:0;cursor:pointer">
      </div>
    </div>
    <div class="admin-form-group"><label>סרטון (URL)</label><input class="admin-input" id="ee-video" value="${e.video||''}"></div>
    <div class="admin-form-group"><label>סטים</label><input class="admin-input" id="ee-sets" value="${e.sets}"></div>
    <div class="admin-form-group"><label>חזרות</label><input class="admin-input" id="ee-reps" value="${e.reps}"></div>
    <div class="admin-form-group"><label>מנוחה</label><input class="admin-input" id="ee-rest" value="${e.rest}"></div>
    <div class="admin-form-group"><label>טמפו</label><input class="admin-input" id="ee-tempo" value="${e.tempo}"></div>
    <div class="admin-form-group"><label>ציוד</label><input class="admin-input" id="ee-equip" value="${e.equipment||''}"></div>
    <div class="admin-form-group"><label>תנאי מעבר</label><textarea class="admin-textarea" id="ee-prog">${e.progression}</textarea></div>
    <button class="admin-save-btn" onclick="saveExercise('${dayId}','${muscleId}',${ei})">💾 שמור</button>
  `);
}
function saveExercise(dayId, muscleId, ei) {
  const d = appData.days.find(x=>x.id===dayId);
  const m = d.muscles.find(x=>x.id===muscleId);
  const e = m.exercises[ei];
  e.name = document.getElementById('ee-name').value;
  e.level = document.getElementById('ee-level').value;
  e.type = document.getElementById('ee-type').value;
  e.video = document.getElementById('ee-video').value;
  e.sets = document.getElementById('ee-sets').value;
  e.reps = document.getElementById('ee-reps').value;
  e.rest = document.getElementById('ee-rest').value;
  e.tempo = document.getElementById('ee-tempo').value;
  e.equipment = document.getElementById('ee-equip').value || undefined;
  e.progression = document.getElementById('ee-prog').value;
  const preview = document.getElementById('ee-img-preview');
  if (preview && preview.src && preview.src.startsWith('data:')) {
    e.imageData = preview.src;
  }
  saveData(); closeModal(); switchAdminTab('exercises'); toast('התרגיל עודכן');
}
function addExercise(dayId, muscleId) {
  const d = appData.days.find(x=>x.id===dayId);
  const m = d.muscles.find(x=>x.id===muscleId);
  m.exercises.push({ id:'e'+Date.now(), name:'תרגיל חדש', level:'green', image:'m1_1.png', video:'', sets:'3', reps:'6-10', rest:'2-3 דקות', tempo:'3-1-X-1', type:'compound', progression:'תנאי מעבר' });
  saveData(); switchAdminTab('exercises'); toast('תרגיל חדש נוסף');
}
function deleteExercise(dayId, muscleId, ei) {
  if (!confirm('למחוק תרגיל זה?')) return;
  const d = appData.days.find(x=>x.id===dayId);
  const m = d.muscles.find(x=>x.id===muscleId);
  m.exercises.splice(ei, 1);
  saveData(); switchAdminTab('exercises'); toast('התרגיל נמחק');
}

function saveGoogleSettings() {
  const val = document.getElementById('set-google-client-id').value.trim();
  if (val) {
    localStorage.setItem('fitpro_google_client_id', val);
  } else {
    localStorage.removeItem('fitpro_google_client_id');
  }
  toast('💾 הגדרות סנכרון נשמרו. יש לרענן את העמוד.');
}

// Export/Import
function exportData() {
  const blob = new Blob([JSON.stringify(appData, null, 2)], {type:'application/json'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = 'fitpro_backup.json'; a.click();
  toast('הנתונים יוצאו בהצלחה');
}
function importData(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      appData = JSON.parse(e.target.result);
      saveData(); switchAdminTab('settings'); toast('הנתונים יובאו בהצלחה');
    } catch(err) { toast('שגיאה בקריאת הקובץ'); }
  };
  reader.readAsText(file);
}
async function manualSync() {
  toast('☁️ מסנכרן...');
  const ok = await AuthModule.syncBothDirections();
  if (ok) {
    toast('✅ הסנכרון הושלם בהצלחה!');
  }
  if (document.getElementById('screen-admin').classList.contains('active')) {
    switchAdminTab('cloud');
  }
  if (typeof updateSyncNav === 'function') {
    updateSyncNav(AuthModule.isConnected());
  }
}
async function manualRestore() {
  if (!confirm('לשחזר נתונים מהענן? שינויים מקומיים שלא סונכרנו יאבדו!')) return;
  toast('📥 משחזר...');
  const ok = await AuthModule.syncFromDrive();
  if (ok) {
    loadSaved();
    toast('✅ נתונים שוחזרו מהענן!');
    renderHome();
  } else {
    toast('ℹ️ אין נתונים חדשים בענן');
  }
}

function resetData() {
  if (!confirm('האם אתה בטוח? כל השינויים יאבדו!')) return;
  appData = JSON.parse(JSON.stringify(WORKOUT_DATA));
  localStorage.removeItem('fitpro_data');
  switchAdminTab('settings'); toast('המערכת אופסה');
}

function clearHistory() {
  if (!confirm('למחוק את כל היסטוריית האימונים?')) return;
  const p = TrainingEngine.getProgress();
  p.workoutHistory = [];
  p.totalWorkouts = 0;
  p.streak = 0;
  p.xp = 0;
  p.rank = 'מתחיל';
  TrainingEngine.saveProgress(p);
  switchAdminTab('history');
  toast('ההיסטוריה נמחקה');
}

// Modal
function openModal(title, bodyHtml) {
  document.getElementById('modal-title').textContent = title;
  document.getElementById('modal-body').innerHTML = bodyHtml;
  document.getElementById('modal-overlay').classList.remove('hidden');
}
function closeModal() {
  document.getElementById('modal-overlay').classList.add('hidden');
}

// Toast
function toast(msg) {
  const t = document.getElementById('toast');
  document.getElementById('toast-message').textContent = msg;
  t.classList.remove('hidden');
  setTimeout(() => t.classList.add('hidden'), 2500);
}

// Image Upload Handler
function handleImgUpload(event, previewId, areaId) {
  const file = event.target.files[0];
  if (!file) return;
  if (file.size > 2 * 1024 * 1024) { toast('⚠️ תמונה גדולה מדי (מקסימום 2MB)'); return; }
  const reader = new FileReader();
  reader.onload = (e) => {
    const img = document.getElementById(previewId);
    img.src = e.target.result;
    img.style.display = 'block';
    const placeholder = img.nextElementSibling;
    if (placeholder) placeholder.style.display = 'none';
  };
  reader.readAsDataURL(file);
}

// Resolve image source: prefer stored base64, fallback to file path
function getImgSrc(item, folder) {
  if (item.imageData) return item.imageData;
  return `../${folder}/${item.image}`;
}

// Start Workout - Only current-level exercises
let workoutLog = [];
let workoutStartTime = null;
let restTimerId = null;
let workoutExercises = []; // flat list of current-level exercises

function startWorkout() {
  if (!currentDay) return;
  workoutLog = [];
  workoutStartTime = Date.now();
  
  // Build exercise list with ONLY current level per muscle
  workoutExercises = [];
  currentDay.muscles.forEach(m => {
    const cur = TrainingEngine.getCurrentExercise(m);
    workoutExercises.push({ muscle: m.nameHe, muscleId: m.id, exercise: cur.exercise, levelIndex: cur.levelIndex, isMaxLevel: cur.isMaxLevel, setsData: [] });
  });
  
  renderWorkoutScreen();
  showScreen('screen-workout', currentDay.name + ' - אימון');
  pushNav(() => openDay(currentDay.id));
  AIModule.getMotivation('workoutStart').then(msg => {
    const el = document.getElementById('workout-motivation');
    if (el) { el.textContent = msg; el.classList.remove('hidden'); }
  });
}

function renderWorkoutScreen() {
  const content = document.getElementById('workout-content');
  content.innerHTML = `
    <div class="workout-header-card">
      <h2>${currentDay.emoji} ${currentDay.name}</h2>
      <p id="workout-motivation" class="workout-motivation hidden"></p>
      <p class="workout-timer" id="workout-timer">00:00</p>
      <div class="workout-progress-bar">
        <div class="workout-prog-fill" id="workout-prog-fill" style="width:0%"></div>
      </div>
      <span class="workout-prog-label" id="workout-prog-label">0/${workoutExercises.length} תרגילים</span>
    </div>
    <div class="workout-exercises">
      ${workoutExercises.map((item, idx) => {
        const e = item.exercise;
        const lc = appData.levelColors[e.level] || {};
        const imgSrc = getImgSrc(e, currentDay.folder);
        const setsNum = parseInt(e.sets) || 3;
        const targetReps = e.reps;
        return `
        <div class="workout-exercise-card" id="wex-${idx}">
          <div class="wex-header" onclick="toggleWorkoutExercise(${idx})">
            <img class="wex-thumb" src="${imgSrc}" alt="" onerror="this.style.display='none'">
            <div class="wex-info">
              <h4>${lc.emoji||''} ${e.name}</h4>
              <span class="wex-meta">${item.muscle} • ${setsNum} סטים • ${targetReps}</span>
            </div>
            <span class="wex-check" id="wex-check-${idx}">○</span>
          </div>
          <div class="wex-body hidden" id="wex-body-${idx}">
            <div class="wex-sets" id="wex-sets-${idx}"></div>
          </div>
        </div>`;
      }).join('')}
    </div>
    <button class="finish-workout-btn" onclick="finishWorkout()">🏁 סיים אימון</button>
  `;
  updateWorkoutTimer();
  // Auto-open first exercise
  if (workoutExercises.length > 0) toggleWorkoutExercise(0);
}

function updateWorkoutTimer() {
  if (!workoutStartTime) return;
  const elapsed = Math.floor((Date.now() - workoutStartTime) / 1000);
  const min = String(Math.floor(elapsed / 60)).padStart(2, '0');
  const sec = String(elapsed % 60).padStart(2, '0');
  const el = document.getElementById('workout-timer');
  if (el) el.textContent = `${min}:${sec}`;
  requestAnimationFrame(() => setTimeout(updateWorkoutTimer, 1000));
}

function toggleWorkoutExercise(idx) {
  const body = document.getElementById(`wex-body-${idx}`);
  body.classList.toggle('hidden');
  if (!body.classList.contains('hidden') && !body.dataset.init) {
    body.dataset.init = '1';
    renderExerciseSets(idx);
  }
}

function renderExerciseSets(idx) {
  const item = workoutExercises[idx];
  if (!item) return;
  const e = item.exercise;
  const setsNum = parseInt(e.sets) || 3;
  const repsRange = e.reps;
  const container = document.getElementById(`wex-sets-${idx}`);
  let html = '';
  for (let s = 0; s < setsNum; s++) {
    html += `
      <div class="wex-set-row" id="wex-set-${idx}-${s}">
        <span class="wex-set-num">סט ${s+1}</span>
        <div class="wex-set-inputs">
          <div class="wex-input-group">
            <label>חזרות</label>
            <div class="wex-counter">
              <button class="wex-counter-btn" onclick="adjustReps(${idx},${s},-1)">−</button>
              <input type="number" class="wex-set-input" id="wex-reps-${idx}-${s}" value="0" min="0">
              <button class="wex-counter-btn" onclick="adjustReps(${idx},${s},1)">+</button>
            </div>
          </div>
          <div class="wex-input-group">
            <label>RIR</label>
            <input type="range" class="wex-rir-slider" id="wex-rir-${idx}-${s}" min="0" max="5" value="2" oninput="updateRIRLabel(${idx},${s})">
            <span class="wex-rir-val" id="wex-rir-val-${idx}-${s}">2</span>
          </div>
          <label class="wex-strict-label">
            <input type="checkbox" id="wex-strict-${idx}-${s}" checked> טכניקה מושלמת
          </label>
        </div>
        <button class="wex-set-done" onclick="markSet(${idx},${s})">✓</button>
      </div>`;
  }
  container.innerHTML = html;
}

function adjustReps(exIdx, setIdx, delta) {
  const input = document.getElementById(`wex-reps-${exIdx}-${setIdx}`);
  if (input && !input.disabled) {
    input.value = Math.max(0, (parseInt(input.value) || 0) + delta);
  }
}

function updateRIRLabel(exIdx, setIdx) {
  const slider = document.getElementById(`wex-rir-${exIdx}-${setIdx}`);
  const label = document.getElementById(`wex-rir-val-${exIdx}-${setIdx}`);
  if (slider && label) label.textContent = slider.value;
}

function markSet(exIdx, setIdx) {
  const repsInput = document.getElementById(`wex-reps-${exIdx}-${setIdx}`);
  const rirSlider = document.getElementById(`wex-rir-${exIdx}-${setIdx}`);
  const strictCheck = document.getElementById(`wex-strict-${exIdx}-${setIdx}`);
  const row = document.getElementById(`wex-set-${exIdx}-${setIdx}`);
  
  const reps = parseInt(repsInput?.value) || 0;
  const rir = parseInt(rirSlider?.value) || 0;
  const strict = strictCheck?.checked || false;

  if (reps === 0) { toast('⚠️ הכנס מספר חזרות'); return; }

  row.classList.add('completed');
  repsInput.disabled = true;
  rirSlider.disabled = true;
  strictCheck.disabled = true;
  
  // Store set data
  const item = workoutExercises[exIdx];
  item.setsData.push({ reps, rir, strict });
  
  // Award XP for this set
  const targetMax = parseInt(item.exercise.reps.split('-').pop()) || 10;
  const xp = TrainingEngine.calcSetXP(reps, targetMax, strict, rir);
  TrainingEngine.addXP(xp, 'set');
  toast(`+${xp} XP ⚡`);

  // Check if all sets done
  const setsNum = parseInt(item.exercise.sets) || 3;
  if (item.setsData.length >= setsNum) {
    document.getElementById(`wex-check-${exIdx}`).textContent = '✅';
    document.getElementById(`wex-${exIdx}`).classList.add('exercise-done');
    
    // Check level up
    if (!item.isMaxLevel && TrainingEngine.checkLevelUp(item.muscleId, item.exercise, item.setsData)) {
      const newLevel = TrainingEngine.levelUp(item.muscleId);
      const nextEx = currentDay.muscles.find(m => m.id === item.muscleId)?.exercises[newLevel];
      showLevelUp(item.muscle, nextEx);
    }
    
    // Update progress bar
    const done = workoutExercises.filter(w => w.setsData.length >= (parseInt(w.exercise.sets) || 3)).length;
    const fill = document.getElementById('workout-prog-fill');
    const label = document.getElementById('workout-prog-label');
    if (fill) fill.style.width = `${(done / workoutExercises.length) * 100}%`;
    if (label) label.textContent = `${done}/${workoutExercises.length} תרגילים`;
    
    // Auto-open next exercise
    const nextIdx = exIdx + 1;
    if (nextIdx < workoutExercises.length) {
      setTimeout(() => toggleWorkoutExercise(nextIdx), 300);
    }
    
    workoutLog.push({ exercise: item.exercise.name, muscle: item.muscle, setsCompleted: setsNum, setsData: item.setsData });
    AIModule.getMotivation('setComplete').then(msg => toast(msg));
  } else {
    // Start rest timer
    startRestTimer(item.exercise.type === 'compound' ? 120 : 60);
  }
  saveData();
}

// Rest Timer
function startRestTimer(seconds) {
  const overlay = document.getElementById('rest-timer-overlay');
  if (!overlay) return;
  overlay.classList.remove('hidden');
  
  let remaining = seconds;
  const total = seconds;
  const circle = document.getElementById('rest-timer-progress');
  const text = document.getElementById('rest-timer-text');
  const circumference = 2 * Math.PI * 54;
  if (circle) { circle.style.strokeDasharray = circumference; circle.style.strokeDashoffset = 0; }
  
  AIModule.getMotivation('rest').then(msg => {
    const el = document.getElementById('rest-timer-motivation');
    if (el) el.textContent = msg;
  });
  
  clearInterval(restTimerId);
  restTimerId = setInterval(() => {
    remaining--;
    const min = Math.floor(remaining / 60);
    const sec = remaining % 60;
    if (text) text.textContent = `${min}:${String(sec).padStart(2, '0')}`;
    if (circle) circle.style.strokeDashoffset = circumference * (1 - remaining / total);
    
    if (remaining <= 0) {
      clearInterval(restTimerId);
      overlay.classList.add('hidden');
      toast('⏰ סיום מנוחה – קדימה לסט הבא!');
      try { navigator.vibrate?.(300); } catch(e) {}
    }
  }, 1000);
}

function skipRestTimer() {
  clearInterval(restTimerId);
  document.getElementById('rest-timer-overlay')?.classList.add('hidden');
}

// Level Up Animation
function showLevelUp(muscleName, nextExercise) {
  const overlay = document.getElementById('levelup-overlay');
  if (!overlay) return;
  document.getElementById('levelup-title').textContent = `🎉 עלית רמה!`;
  document.getElementById('levelup-detail').textContent = `${muscleName} – נפתח תרגיל חדש!`;
  const badge = document.getElementById('levelup-badge');
  if (badge && nextExercise) {
    const lc = appData.levelColors[nextExercise.level] || {};
    badge.innerHTML = `<span style="color:${lc.hex}">${lc.emoji} ${nextExercise.name}</span>`;
  }
  overlay.classList.remove('hidden');
  TrainingEngine.addXP(50, 'level_up');
  try { syncMyLeaderboardScore(); } catch(e) {}
}

function closeLevelUp() {
  document.getElementById('levelup-overlay')?.classList.add('hidden');
}

async function finishWorkout() {
  if (!confirm('לסיים את האימון?')) return;
  const duration = Math.floor((Date.now() - workoutStartTime) / 1000);
  workoutStartTime = null;
  
  // Record in engine
  TrainingEngine.recordWorkout(currentDay.id, currentDay.name, duration, workoutLog);
  
  // Get AI summary
  const summary = await AIModule.getWorkoutSummary(workoutLog);
  
  // Save to appData too
  if (!appData.workoutHistory) appData.workoutHistory = [];
  appData.workoutHistory.push({ date: new Date().toISOString(), day: currentDay.id, dayName: currentDay.name, duration, log: workoutLog, summary });
  saveData();
  try { syncMyLeaderboardScore(); } catch(e) {}
  
  renderSummaryScreen(summary, duration);
}

function renderSummaryScreen(summary, duration) {
  const min = Math.floor(duration / 60);
  const prog = TrainingEngine.getProgress();
  const content = document.getElementById('summary-content');
  content.innerHTML = `
    <div class="summary-card">
      <div class="summary-grade">${summary.grade}</div>
      <h2 class="summary-headline">${summary.headline}</h2>
      <p class="summary-time">⏱️ זמן אימון: ${min} דקות</p>
      
      <div class="summary-xp-award">
        <span class="xp-award-icon">⚡</span>
        <span class="xp-award-text">${prog.xp} XP כולל</span>
      </div>
      
      <div class="summary-stats-grid">
        <div class="summary-stat"><span class="summary-stat-num">${summary.stats.exercises}</span><span class="summary-stat-label">תרגילים</span></div>
        <div class="summary-stat"><span class="summary-stat-num">${summary.stats.sets}</span><span class="summary-stat-label">סטים</span></div>
        ${summary.stats.promotions > 0 ? `<div class="summary-stat highlight"><span class="summary-stat-num">${summary.stats.promotions}</span><span class="summary-stat-label">קידומים!</span></div>` : ''}
      </div>
      
      <div class="summary-section insight"><h4>💡 תובנה</h4><p>${summary.insight}</p></div>
      <div class="summary-section tip"><h4>🎯 טיפ</h4><p>${summary.tip}</p></div>
      <div class="summary-section reinforcement"><h4>💪 חיזוק</h4><p>${summary.reinforcement}</p></div>
      
      <button class="admin-save-btn" onclick="renderHome()" style="margin-top:1.5rem">🏠 חזרה לדף הבית</button>
    </div>
  `;
  navStack = [];
  if (!isGoingBack) {
    history.replaceState({ depth: 0 }, '');
  }
  showScreen('screen-summary', 'סיכום אימון');
}

// Init auth & AI on load
window.addEventListener('DOMContentLoaded', () => {
  AuthModule.init();
  AIModule.init().then(available => {
    if (available) console.log('AI ready');
    AIModule.getMotivation('general').then(msg => {
      const el = document.getElementById('ai-motivation');
      if (el) { el.textContent = msg; el.classList.remove('hidden'); }
    });
  });
  // Auto-sync leaderboard if opted in at startup
  setTimeout(() => {
    if (isLeaderboardOptedIn()) {
      syncMyLeaderboardScore();
    }
  }, 3000);
});

// ===== Global XP Leaderboard Logic =====
const LEADERBOARD_BUCKET = 'PiptH5Np4qkXcEqumcesZZ';

// Generate/get a persistent user ID for leaderboard (unique per user)
function getLeaderboardUserId() {
  const profile = AuthModule.getProfile();
  if (profile && profile.email) {
    // Generate a consistent ID from email to link guest accounts to signed-in accounts
    return `user_${btoa(profile.email).replace(/=/g, '').substring(0, 15)}`;
  }
  let localId = localStorage.getItem('fitpro_local_user_id');
  if (!localId) {
    localId = `local_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    localStorage.setItem('fitpro_local_user_id', localId);
  }
  return localId;
}

// Get user display name
function getLeaderboardDisplayName() {
  const savedName = localStorage.getItem('fitpro_leaderboard_name');
  if (savedName) return savedName;
  
  const profile = AuthModule.getProfile();
  if (profile && profile.name) return profile.name;
  
  return `מתאמן_אנונימי_${Math.floor(100 + Math.random() * 900)}`;
}

// Check if user has opted in
function isLeaderboardOptedIn() {
  const val = localStorage.getItem('fitpro_leaderboard_optin');
  return val !== 'false'; // default is true
}

// Sync current user score to the leaderboard
async function syncMyLeaderboardScore() {
  if (!isLeaderboardOptedIn()) return;
  
  try {
    const userId = getLeaderboardUserId();
    const displayName = getLeaderboardDisplayName();
    const profile = AuthModule.getProfile();
    const picture = profile ? profile.picture : '';
    const prog = TrainingEngine.getProgress();
    
    const payload = {
      id: userId,
      name: displayName,
      picture: picture,
      xp: prog.xp || 0,
      rank: prog.rank || 'מתחיל',
      streak: prog.streak || 0,
      totalWorkouts: prog.totalWorkouts || 0,
      updatedAt: new Date().toISOString()
    };
    
    await fetch(`https://kvdb.io/${LEADERBOARD_BUCKET}/${userId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
  } catch (e) {
    console.error('Failed to sync leaderboard score:', e);
  }
}

// Delete user from leaderboard
async function deleteMyLeaderboardScore() {
  try {
    const userId = getLeaderboardUserId();
    await fetch(`https://kvdb.io/${LEADERBOARD_BUCKET}/${userId}`, {
      method: 'DELETE'
    });
  } catch (e) {
    console.error('Failed to delete leaderboard score:', e);
  }
}

// Render Leaderboard screen contents
async function renderLeaderboard() {
  const container = document.getElementById('leaderboard-content');
  if (!container) return;
  
  // Show loading
  container.innerHTML = `
    <div class="leaderboard-loading">
      <div class="spinner"></div>
      <p>טוען נתונים מהענן...</p>
    </div>
  `;
  
  // Update UI components for opt-in
  const optInToggle = document.getElementById('leaderboard-optin-toggle');
  const nameRow = document.getElementById('optin-name-row');
  const displayNameInput = document.getElementById('leaderboard-display-name');
  
  if (optInToggle) {
    optInToggle.checked = isLeaderboardOptedIn();
  }
  if (nameRow) {
    nameRow.classList.toggle('hidden', !isLeaderboardOptedIn());
  }
  if (displayNameInput) {
    displayNameInput.value = getLeaderboardDisplayName();
  }
  
  try {
    // If opted in, push current score first so it is up-to-date
    if (isLeaderboardOptedIn()) {
      await syncMyLeaderboardScore();
    }
    
    // Fetch all entries
    const response = await fetch(`https://kvdb.io/${LEADERBOARD_BUCKET}/?values=true&format=json`);
    if (!response.ok) throw new Error('Network response was not ok');
    
    const rawData = await response.json();
    // rawData is an array of [key, value] pairs
    const players = rawData.map(item => item[1]).filter(p => p && typeof p === 'object' && typeof p.xp === 'number');
    
    // Sort players by XP descending
    players.sort((a, b) => b.xp - a.xp);
    
    if (players.length === 0) {
      container.innerHTML = `<div class="leaderboard-empty">אין עדיין משתתפים בתחרות. הובילו בראש! 🏆</div>`;
      document.getElementById('leaderboard-my-rank-card').classList.add('hidden');
      return;
    }
    
    // Render list
    let html = '<div class="leaderboard-list">';
    const myId = getLeaderboardUserId();
    let myRank = -1;
    
    players.forEach((player, index) => {
      const rank = index + 1;
      const isMe = player.id === myId;
      if (isMe) myRank = rank;
      
      let rankEmoji = '';
      if (rank === 1) rankEmoji = '🥇';
      else if (rank === 2) rankEmoji = '🥈';
      else if (rank === 3) rankEmoji = '🥉';
      else rankEmoji = `<span class="rank-num">${rank}</span>`;
      
      // Initials for avatar fallback
      const initials = (player.name || 'U').charAt(0);
      const avatarHtml = player.picture 
        ? `<img src="${player.picture}" class="player-avatar" onerror="this.outerHTML='<div class=\'player-avatar fallback\'>${initials}</div>'">`
        : `<div class="player-avatar fallback">${initials}</div>`;
        
      const timeAgo = getTimeAgo(player.updatedAt);
      
      html += `
        <div class="leaderboard-item ${isMe ? 'is-me' : ''} rank-${rank}">
          <div class="player-rank">${rankEmoji}</div>
          ${avatarHtml}
          <div class="player-info">
            <div class="player-name">${escapeHtml(player.name)} ${isMe ? '<span class="me-tag">(אני)</span>' : ''}</div>
            <div class="player-meta">
              <span class="player-title">${player.rank || 'מתחיל'}</span>
              ${player.streak > 0 ? `<span class="player-streak">🔥 ${player.streak} ימים</span>` : ''}
              <span class="player-updated" title="${player.updatedAt}">לפני ${timeAgo}</span>
            </div>
          </div>
          <div class="player-score">${player.xp.toLocaleString()} XP</div>
        </div>
      `;
    });
    
    html += '</div>';
    container.innerHTML = html;
    
    // Render my rank card
    const myRankCard = document.getElementById('leaderboard-my-rank-card');
    if (myRankCard) {
      if (isLeaderboardOptedIn() && myRank !== -1) {
        myRankCard.classList.remove('hidden');
        myRankCard.innerHTML = `
          <div class="my-rank-info">
            <span class="my-rank-emoji">🏆</span>
            <div class="my-rank-text">
              <h3>המיקום שלך: מקום <strong>${myRank}</strong> מתוך <strong>${players.length}</strong></h3>
              <p>המשיכו להתאמן כדי לעלות בדירוג!</p>
            </div>
          </div>
        `;
      } else {
        myRankCard.classList.add('hidden');
      }
    }
    
  } catch (e) {
    console.error('Failed to load leaderboard:', e);
    container.innerHTML = `
      <div class="leaderboard-error">
        <p>⚠️ שגיאה בטעינת טבלת המובילים. אנא ודאו שאתם מחוברים לאינטרנט ונסו שוב.</p>
        <button class="admin-btn-sm" onclick="renderLeaderboard()">🔄 נסה שוב</button>
      </div>
    `;
  }
}

// Toggle opt-in state
async function toggleLeaderboardOptIn() {
  const toggle = document.getElementById('leaderboard-optin-toggle');
  const nameRow = document.getElementById('optin-name-row');
  const optIn = toggle.checked;
  
  localStorage.setItem('fitpro_leaderboard_optin', optIn ? 'true' : 'false');
  nameRow.classList.toggle('hidden', !optIn);
  
  if (optIn) {
    toast('📢 הצטרפת לתחרות הציבורית!');
    await syncMyLeaderboardScore();
  } else {
    toast('🔕 הסרת את עצמך מהתחרות הציבורית');
    await deleteMyLeaderboardScore();
  }
  
  renderLeaderboard();
}

// Save custom display name
async function saveLeaderboardName() {
  const input = document.getElementById('leaderboard-display-name');
  const name = input.value.trim();
  if (!name) {
    toast('⚠️ השם לא יכול להיות ריק');
    return;
  }
  localStorage.setItem('fitpro_leaderboard_name', name);
  toast('✅ שם התצוגה עודכן!');
  await syncMyLeaderboardScore();
  renderLeaderboard();
}

// Show leaderboard screen
function showLeaderboard() {
  pushNav(() => renderHome());
  showScreen('screen-leaderboard', 'טבלת תחרות');
  renderLeaderboard();
}

// Refresh leaderboard manually
async function syncLeaderboard(manual = false) {
  const btn = document.getElementById('btn-refresh-leaderboard');
  if (btn) btn.classList.add('loading');
  
  await renderLeaderboard();
  
  if (btn) btn.classList.remove('loading');
  if (manual) toast('🔄 טבלת התחרות עודכנה!');
}

// Helper: format relative time
function getTimeAgo(dateString) {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'כמה שניות';
    if (diffMins < 60) return `${diffMins} דקות`;
    if (diffHours < 24) return `${diffHours} שעות`;
    return `${diffDays} ימים`;
  } catch (e) {
    return 'זמן קצר';
  }
}

// Helper: Escape HTML
function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}


