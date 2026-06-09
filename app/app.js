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
  const prev = navStack.pop();
  prev();
}

// Home
function renderHome() {
  navStack = [];
  const h = new Date().getHours();
  const g = h < 12 ? 'בוקר טוב ☀️' : h < 18 ? 'צהריים טובים 🌤️' : 'ערב טוב 🌙';
  document.getElementById('greeting-text').textContent = g;
  document.getElementById('current-date').textContent = new Date().toLocaleDateString('he-IL', {weekday:'long', year:'numeric', month:'long', day:'numeric'});

  const grid = document.getElementById('days-grid');
  grid.innerHTML = appData.days.map(d => `
    <div class="day-card" onclick="openDay('${d.id}')">
      <div class="day-card-top">
        <span class="day-card-emoji">${d.emoji}</span>
        <div class="day-card-info">
          <h3>${d.name}</h3>
          <p>${d.subtitle}</p>
        </div>
      </div>
      <div class="day-card-muscles">
        ${d.muscles.map(m => `<span class="muscle-tag">${m.nameHe}</span>`).join('')}
      </div>
    </div>
  `).join('');
  
  if (typeof updateSyncNav === 'function') {
    updateSyncNav(AuthModule.isConnected());
  }
  
  showScreen('screen-home', 'FitPro');
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

// Day View
function openDay(dayId) {
  navStack.push(() => renderHome());
  currentDay = appData.days.find(d => d.id === dayId);
  if (!currentDay) return;
  document.getElementById('day-emoji').textContent = currentDay.emoji;
  document.getElementById('day-title').textContent = currentDay.name;
  document.getElementById('day-subtitle').textContent = currentDay.subtitle;

  const list = document.getElementById('muscles-list');
  list.innerHTML = currentDay.muscles.map(m => `
    <div class="muscle-card" onclick="openMuscle('${m.id}')">
      <div class="muscle-card-inner">
        <img class="muscle-card-img" src="${m.imageData || `../${currentDay.folder}/${m.image}`}" alt="${m.name}" onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2270%22 height=%2270%22><rect fill=%22%231a1a3e%22 width=%2270%22 height=%2270%22/><text x=%2235%22 y=%2240%22 text-anchor=%22middle%22 fill=%22%23666%22 font-size=%2220%22>💪</text></svg>'">
        <div class="muscle-card-info">
          <h3>${m.name}</h3>
          <span class="muscle-name-he">${m.nameHe}</span>
          <div class="muscle-card-levels">
            ${m.exercises.map(e => `<span class="muscle-card-level">${appData.levelColors[e.level]?.emoji||''}</span>`).join('')}
          </div>
        </div>
      </div>
    </div>
  `).join('');
  showScreen('screen-day', currentDay.name);
}

// Muscle View
function openMuscle(muscleId) {
  navStack.push(() => openDay(currentDay.id));
  currentMuscle = currentDay.muscles.find(m => m.id === muscleId);
  if (!currentMuscle) return;

  document.getElementById('muscle-img').src = currentMuscle.imageData || `../${currentDay.folder}/${currentMuscle.image}`;
  document.getElementById('muscle-name').textContent = `${currentMuscle.name} - ${currentMuscle.nameHe}`;

  const badges = document.getElementById('level-badges');
  const levels = [...new Set(currentMuscle.exercises.map(e => e.level))];
  badges.innerHTML = levels.map(l => `<span class="level-badge">${appData.levelColors[l]?.emoji||''}</span>`).join('');

  const list = document.getElementById('exercises-list');
  list.innerHTML = currentMuscle.exercises.map((e, i) => `
    <div class="exercise-card" data-level="${e.level}" onclick="openExercise(${i})">
      <div class="exercise-card-inner">
        <img class="exercise-card-img" src="${e.imageData || `../${currentDay.folder}/${e.image}`}" alt="${e.name}" onerror="this.style.display='none'">
        <div class="exercise-card-info">
          <h4>${e.name}</h4>
          <div class="exercise-card-meta">
            <span class="exercise-level-dot">${appData.levelColors[e.level]?.emoji||''}</span>
            <span class="exercise-type-tag">${appData.exerciseTypes[e.type]?.name||e.type}</span>
            ${e.equipment ? `<span class="exercise-equip">${e.equipment}</span>` : ''}
          </div>
        </div>
        <span class="exercise-arrow">◀</span>
      </div>
    </div>
  `).join('');
  showScreen('screen-muscle', currentMuscle.nameHe);
}

// Exercise Detail
function openExercise(idx) {
  navStack.push(() => openMuscle(currentMuscle.id));
  currentExercise = currentMuscle.exercises[idx];
  if (!currentExercise) return;
  const e = currentExercise;
  const lc = appData.levelColors[e.level] || {};

  document.getElementById('exercise-detail').innerHTML = `
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
    ${e.video ? `<button class="ex-video-btn" onclick="playVideo('${e.video}')">▶ צפה בסרטון הדגמה</button>` : '<button class="ex-video-btn" disabled>אין סרטון זמין</button>'}
  `;
  showScreen('screen-exercise', e.name);
}

// Video
function playVideo(url) {
  const container = document.getElementById('video-container');
  let embedUrl = url;
  // YouTube
  const ytMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]+)/);
  if (ytMatch) {
    embedUrl = `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=1`;
    container.innerHTML = `<iframe src="${embedUrl}" allow="autoplay; encrypted-media" allowfullscreen></iframe>`;
  } else {
    window.open(url, '_blank');
    return;
  }
  document.getElementById('video-modal').classList.remove('hidden');
}

function closeVideoModal() {
  document.getElementById('video-modal').classList.add('hidden');
  document.getElementById('video-container').innerHTML = '';
}

// Admin
function showAdminPanel() {
  navStack.push(() => renderHome());
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

// Start Workout
let workoutLog = [];
let workoutStartTime = null;
let restTimerId = null;

function startWorkout() {
  if (!currentDay) return;
  workoutLog = [];
  workoutStartTime = Date.now();
  renderWorkoutScreen();
  showScreen('screen-workout', currentDay.name + ' - אימון');
  navStack.push(() => openDay(currentDay.id));
  AIModule.getMotivation('workoutStart').then(msg => {
    const el = document.getElementById('workout-motivation');
    if (el) { el.textContent = msg; el.classList.remove('hidden'); }
  });
}

function renderWorkoutScreen() {
  const exercises = [];
  currentDay.muscles.forEach(m => {
    m.exercises.forEach(e => {
      exercises.push({ muscle: m.nameHe, exercise: e, muscleId: m.id });
    });
  });
  
  const content = document.getElementById('workout-content');
  content.innerHTML = `
    <div class="workout-header-card">
      <h2>${currentDay.emoji} ${currentDay.name}</h2>
      <p id="workout-motivation" class="workout-motivation hidden"></p>
      <p class="workout-timer" id="workout-timer">00:00</p>
    </div>
    <div class="workout-exercises">
      ${exercises.map((item, idx) => {
        const e = item.exercise;
        const lc = appData.levelColors[e.level] || {};
        const imgSrc = getImgSrc(e, currentDay.folder);
        return `
        <div class="workout-exercise-card" id="wex-${idx}">
          <div class="wex-header" onclick="toggleWorkoutExercise(${idx})">
            <img class="wex-thumb" src="${imgSrc}" alt="" onerror="this.style.display='none'">
            <div class="wex-info">
              <h4>${lc.emoji||''} ${e.name}</h4>
              <span class="wex-meta">${item.muscle} • ${e.sets} סטים • ${e.reps}</span>
            </div>
            <span class="wex-check" id="wex-check-${idx}">○</span>
          </div>
          <div class="wex-body hidden" id="wex-body-${idx}">
            <div class="wex-sets" id="wex-sets-${idx}"></div>
          </div>
        </div>`;
      }).join('')}
    </div>
    <button class="admin-save-btn" onclick="finishWorkout()" style="margin-top:1rem">🏁 סיים אימון</button>
  `;
  
  // Start timer
  updateWorkoutTimer();
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
  const exercises = [];
  currentDay.muscles.forEach(m => m.exercises.forEach(e => exercises.push(e)));
  const e = exercises[idx];
  if (!e) return;
  const setsNum = parseInt(e.sets) || 3;
  const container = document.getElementById(`wex-sets-${idx}`);
  let html = '';
  for (let s = 0; s < setsNum; s++) {
    html += `
      <div class="wex-set-row" id="wex-set-${idx}-${s}">
        <span class="wex-set-num">סט ${s+1}</span>
        <input type="number" class="wex-set-input" id="wex-reps-${idx}-${s}" placeholder="חזרות" min="0">
        <button class="wex-set-done" onclick="markSet(${idx},${s})">✓</button>
      </div>`;
  }
  container.innerHTML = html;
}

function markSet(exIdx, setIdx) {
  const input = document.getElementById(`wex-reps-${exIdx}-${setIdx}`);
  const row = document.getElementById(`wex-set-${exIdx}-${setIdx}`);
  const reps = parseInt(input?.value) || 0;
  row.classList.add('completed');
  input.disabled = true;
  
  // Check if all sets for this exercise are done
  const exercises = [];
  currentDay.muscles.forEach(m => m.exercises.forEach(e => exercises.push(e)));
  const e = exercises[exIdx];
  const setsNum = parseInt(e?.sets) || 3;
  let allDone = true;
  let totalReps = 0;
  for (let s = 0; s < setsNum; s++) {
    const r = document.getElementById(`wex-set-${exIdx}-${s}`);
    if (!r || !r.classList.contains('completed')) { allDone = false; break; }
    totalReps += parseInt(document.getElementById(`wex-reps-${exIdx}-${s}`)?.value) || 0;
  }
  if (allDone) {
    document.getElementById(`wex-check-${exIdx}`).textContent = '✅';
    workoutLog.push({ exercise: e.name, setsCompleted: setsNum, totalReps, duration: 0 });
    AIModule.getMotivation('setComplete').then(msg => toast(msg));
  }
  saveData();
}

async function finishWorkout() {
  if (!confirm('לסיים את האימון?')) return;
  const duration = Math.floor((Date.now() - workoutStartTime) / 1000);
  workoutStartTime = null;
  
  // Get AI summary
  const summary = await AIModule.getWorkoutSummary(workoutLog);
  
  // Save to history
  if (!appData.workoutHistory) appData.workoutHistory = [];
  appData.workoutHistory.push({
    date: new Date().toISOString(),
    day: currentDay.id,
    dayName: currentDay.name,
    duration,
    log: workoutLog,
    summary
  });
  saveData();
  
  // Show summary screen
  renderSummaryScreen(summary, duration);
}

function renderSummaryScreen(summary, duration) {
  const min = Math.floor(duration / 60);
  const content = document.getElementById('summary-content');
  content.innerHTML = `
    <div class="summary-card">
      <div class="summary-grade">${summary.grade}</div>
      <h2 class="summary-headline">${summary.headline}</h2>
      <p class="summary-time">⏱️ זמן אימון: ${min} דקות</p>
      
      <div class="summary-stats-grid">
        <div class="summary-stat"><span class="summary-stat-num">${summary.stats.exercises}</span><span class="summary-stat-label">תרגילים</span></div>
        <div class="summary-stat"><span class="summary-stat-num">${summary.stats.sets}</span><span class="summary-stat-label">סטים</span></div>
        ${summary.stats.promotions > 0 ? `<div class="summary-stat highlight"><span class="summary-stat-num">${summary.stats.promotions}</span><span class="summary-stat-label">קידומים!</span></div>` : ''}
      </div>
      
      <div class="summary-section insight">
        <h4>💡 תובנה</h4>
        <p>${summary.insight}</p>
      </div>
      
      <div class="summary-section tip">
        <h4>🎯 טיפ</h4>
        <p>${summary.tip}</p>
      </div>
      
      <div class="summary-section reinforcement">
        <h4>💪 חיזוק</h4>
        <p>${summary.reinforcement}</p>
      </div>
      
      <button class="admin-save-btn" onclick="renderHome()" style="margin-top:1.5rem">🏠 חזרה לדף הבית</button>
    </div>
  `;
  navStack = [];
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
});
