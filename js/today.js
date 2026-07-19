/**
 * Today Page Module - Daily workout view with tracking
 */
const TodayPage = (() => {
  let currentDayIndex = 0;
  let allPlanDays = [];
  let currentTracking = null;
  let allExercises = [];
  let allTrackingCache = null;

  /**
   * Initialize the today page
   */
  async function init(planDays) {
    allPlanDays = planDays;
    currentDayIndex = UI.findTodayIndex(planDays);
    allExercises = await DB.getExerciseGuide();

    const todayBtn = document.getElementById('today-btn');
    if (todayBtn) todayBtn.addEventListener('click', goToToday);



    const toggleNotesBtn = document.getElementById('toggle-notes-btn');
    if (toggleNotesBtn) {
      toggleNotesBtn.addEventListener('click', () => {
        const content = document.getElementById('notes-accordion-content');
        if (content.style.display === 'none') {
          content.style.display = 'grid';
          document.getElementById('calendar-accordion-content').style.display = 'none'; // Close calendar if open
        } else {
          content.style.display = 'none';
        }
      });
    }

    const toggleCalBtn = document.getElementById('toggle-calendar-btn');
    if (toggleCalBtn) {
      toggleCalBtn.addEventListener('click', () => {
        const content = document.getElementById('calendar-accordion-content');
        if (content.style.display === 'none') {
          content.style.display = 'block';
          document.getElementById('notes-accordion-content').style.display = 'none'; // Close notes if open
          if (typeof CalendarPage !== 'undefined') CalendarPage.render(); // Make sure calendar is rendered
        } else {
          content.style.display = 'none';
        }
      });
    }

    // Auto-save inputs on change
    document.getElementById('actual-rpe').addEventListener('change', autoSave);
    document.getElementById('body-weight').addEventListener('change', autoSave);
    document.getElementById('day-notes').addEventListener('change', autoSave);

    // Day navigation arrows
    const prevBtn = document.getElementById('nav-prev-day');
    const nextBtn = document.getElementById('nav-next-day');
    if (prevBtn) prevBtn.addEventListener('click', () => navigate(-1));
    if (nextBtn) nextBtn.addEventListener('click', () => navigate(1));

    await render();
  }

  /**
   * Navigate to a specific day
   */
  function navigate(offset) {
    const newIndex = currentDayIndex + offset;
    if (newIndex >= 0 && newIndex < allPlanDays.length) {
      currentDayIndex = newIndex;
      render();
    }
  }

  /**
   * Go to today
   */
  function goToToday() {
    currentDayIndex = UI.findTodayIndex(allPlanDays);
    render();
  }

  /**
   * Go to a specific day index
   */
  function goToDay(dayIndex) {
    if (dayIndex >= 0 && dayIndex < allPlanDays.length) {
      currentDayIndex = dayIndex;
      render();
    }
  }

  /**
   * Render the today page
   */
  async function render() {
    const day = allPlanDays[currentDayIndex];
    if (!day) return;
    if (!day.exercises) day.exercises = [];

    // Load tracking data
    currentTracking = await DB.getDayTracking(currentDayIndex) || {
      exerciseStatus: {},
      setData: {},
      exerciseNotes: {},
      actualRPE: null,
      bodyWeight: null,
      notes: '',
      completed: false
    };

    // Cache all tracking data for performance history lookups
    allTrackingCache = await DB.getAllTracking();

    // Update header badges
    const typeInfo = UI.getDayTypeInfo(day.dayType);
    
    // Check if program started to show preview banner
    const isProgramStarted = await DB.getSetting('planStartDate');
    const summaryCard = document.getElementById('day-summary');
    let previewBanner = document.getElementById('preview-mode-banner');
    
    if (!isProgramStarted) {
      if (!previewBanner) {
        previewBanner = document.createElement('div');
        previewBanner.id = 'preview-mode-banner';
        previewBanner.innerHTML = `
          <div style="background: rgba(59, 130, 246, 0.1); border: 1px solid rgba(59, 130, 246, 0.3); border-radius: 12px; padding: 12px 16px; margin-bottom: 16px; display: flex; align-items: flex-start; gap: 12px;">
            <span style="font-size: 20px;">👀</span>
            <div style="font-size: 13px; color: var(--text-primary); line-height: 1.4;">
              <strong style="color: var(--accent-primary); display: block; margin-bottom: 4px;">מצב עיון: התוכנית טרם התחילה</strong>
              ברגע שתסמן תרגיל או יום מנוחה כהושלם, התוכנית תתחיל באופן רשמי והתאריכים ייקבעו בהתאם.
            </div>
          </div>
        `;
        summaryCard.parentNode.insertBefore(previewBanner, summaryCard);
      }
    } else if (previewBanner) {
      previewBanner.remove();
    }

    // Update summary card
    document.getElementById('day-number').textContent = '#' + day.dayNum;
    document.getElementById('today-date-badge').textContent = day.dayOfWeek;
    document.getElementById('day-week').textContent = day.week ? day.week.replace('Week', 'שבוע') : '';

    const realTodayIndex = UI.findTodayIndex(allPlanDays);
    const isToday = currentDayIndex === realTodayIndex;
    const todayBtn = document.getElementById('today-btn');
    if (todayBtn) {
      todayBtn.style.display = isToday ? 'none' : 'flex';
    }
    

    const typeBadge = document.getElementById('day-type');
    typeBadge.textContent = typeInfo.label;
    typeBadge.className = `type-badge ${typeInfo.class}`;

    const rpeBadge = document.getElementById('day-rpe');
    if (day.plannedRPE && day.plannedRPE !== '—') {
      rpeBadge.textContent = `RPE ${day.plannedRPE}`;
      rpeBadge.style.display = '';
    } else {
      rpeBadge.style.display = 'none';
    }

    // --- Update Nutrition Summary Card ---
    const nutritionCard = document.getElementById('nutrition-summary-card');
    if (nutritionCard) {
      let queryDateStr = null;
      if (day.date) {
        const parts = day.date.split('/');
        if (parts.length === 3) {
          queryDateStr = `${parts[2]}-${parts[1]}-${parts[0]}`;
        }
      }
      if (!queryDateStr) queryDateStr = UI.getLocalDateString(); // fallback

      let nutrition = null;
      if (typeof DB.getNutrition === 'function') {
        nutrition = await DB.getNutrition(queryDateStr);
      }

      if (nutrition && (nutrition.calories > 0 || nutrition.protein > 0 || (nutrition.supplements && nutrition.supplements.length > 0))) {
        nutritionCard.style.display = 'block';
        document.getElementById('nut-calories').textContent = nutrition.calories || 0;
        document.getElementById('nut-protein').textContent = nutrition.protein || 0;
        
        const suppContainer = document.getElementById('nut-supplements-container');
        const suppText = document.getElementById('nut-supplements');
        if (nutrition.supplements && nutrition.supplements.length > 0) {
          suppContainer.style.display = 'block';
          suppText.textContent = nutrition.supplements.join(', ');
        } else {
          suppContainer.style.display = 'none';
        }
      } else {
        nutritionCard.style.display = 'none';
      }
    }
    // -------------------------------------

    // Equipment Banner
    const eqBanner = document.getElementById('day-equipment-banner');
    if (eqBanner) {
      if (day.exercises && day.exercises.length > 0 && day.dayType !== 'Rest') {
        const equipmentMap = new Map();
        let newExercisesList = [];
        let changedExercisesList = [];

        day.exercises.forEach((ex, idx) => {
          const exNum = idx + 1;
          const equip = UI.getEquipment(ex.name);
          if (equip && equip.label !== 'משקל גוף בלבד' && equip.label !== 'קיר פנוי') {
            let labelText = equip.label;
            if (labelText === 'גומיית התנגדות' && ex.weight && ex.weight !== '—' && ex.weight !== 'משקל גוף') {
              labelText = `גומיית התנגדות (${ex.weight})`;
            }
            if (!equipmentMap.has(labelText)) {
              equipmentMap.set(labelText, { icon: equip.icon, label: labelText, exercises: [] });
            }
            equipmentMap.get(labelText).exercises.push(exNum);
          }
          
          let prevEx = null;
          for (let i = currentDayIndex - 1; i >= 0; i--) {
            const pastDay = allPlanDays[i];
            if (pastDay && pastDay.exercises) {
              prevEx = pastDay.exercises.find(e => e.name === ex.name);
              if (prevEx) break;
            }
          }
          
          const isNewExercise = !prevEx && currentDayIndex > 0 && day.dayType !== 'Rest';
          if (isNewExercise) newExercisesList.push(exNum);
          
          const isSetsChanged = prevEx && ex.sets !== prevEx.sets;
          const isWeightChanged = prevEx && ex.weight !== prevEx.weight && ex.weight !== null && ex.weight !== '—' && ex.weight !== 'משקל גוף';
          if (isSetsChanged || isWeightChanged) changedExercisesList.push(exNum);
        });
        
        let reportItems = [];
        
        const reportSvgs = {
          report: `<svg width="1.2em" height="1.2em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M16 13H8"/><path d="M16 17H8"/><path d="M10 9H8"/></svg>`,
          sparkles: `<svg width="1.2em" height="1.2em" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>`,
          trendUp: `<svg width="1.2em" height="1.2em" viewBox="0 0 24 24" fill="none" stroke="var(--warning)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>`,
          bodyweight: `<svg width="1.2em" height="1.2em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="7" r="4"/><path d="M6 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2"/></svg>`
        };

        // Equipment items
        if (equipmentMap.size > 0) {
          Array.from(equipmentMap.values()).forEach(eq => {
            reportItems.push(`
              <div style="display: flex; align-items: flex-start; gap: 10px; padding: 6px 0;">
                <span style="font-size: 16px; margin-top: 1px; display: flex; color: #f97316;">${eq.icon}</span>
                <div style="font-size: 13px; color: var(--text-primary); line-height: 1.4;">
                  <span style="font-weight: 700;">${eq.label}:</span> 
                  דרוש לתרגיל${eq.exercises.length > 1 ? 'ים' : ''} <b style="font-family: 'Inter', sans-serif;">${eq.exercises.map(n => `#${n}`).join(', ')}</b>
                </div>
              </div>
            `);
          });
        }

        // New exercises
        if (newExercisesList.length > 0) {
          reportItems.push(`
            <div style="display: flex; align-items: flex-start; gap: 10px; padding: 6px 0; background: rgba(239, 68, 68, 0.05); border-radius: 8px; margin: 2px -8px; padding-right: 8px;">
              <span style="font-size: 16px; margin-top: 1px; animation: blinkRed 2s infinite; border-radius: 50%; display: flex;">${reportSvgs.sparkles}</span>
              <div style="font-size: 13px; color: var(--text-primary); line-height: 1.4;">
                <span style="font-weight: 700; color: #ef4444;">תרגילים חדשים:</span> 
                תרגיל${newExercisesList.length > 1 ? 'ים' : ''} <b style="font-family: 'Inter', sans-serif; color: #ef4444;">${newExercisesList.map(n => `#${n}`).join(', ')}</b>. מומלץ לצפות בתמונת ההנפשה.
              </div>
            </div>
          `);
        }

        // Changed exercises
        if (changedExercisesList.length > 0) {
          reportItems.push(`
            <div style="display: flex; align-items: flex-start; gap: 10px; padding: 6px 0; background: rgba(245, 158, 11, 0.05); border-radius: 8px; margin: 2px -8px; padding-right: 8px;">
              <span style="font-size: 16px; margin-top: 1px; display: flex;">${reportSvgs.trendUp}</span>
              <div style="font-size: 13px; color: var(--text-primary); line-height: 1.4;">
                <span style="font-weight: 700; color: var(--warning);">עליית עומס/נפח:</span> 
                עודכנו סטים או משקלים בתרגיל${changedExercisesList.length > 1 ? 'ים' : ''} <b style="font-family: 'Inter', sans-serif;">${changedExercisesList.map(n => `#${n}`).join(', ')}</b>
              </div>
            </div>
          `);
        }

        if (reportItems.length > 0) {
          eqBanner.innerHTML = `
            <div style="background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 12px; padding: 16px; box-shadow: 0 4px 12px rgba(0,0,0,0.02);">
              <div style="display: flex; align-items: center; margin-bottom: 12px; border-bottom: 1px solid var(--border-light); padding-bottom: 12px;">
                <h3 style="font-size: 15px; font-weight: 800; color: var(--text-primary); margin: 0; display: flex; align-items: center; gap: 8px;">
                  <span style="display: flex;">${reportSvgs.report}</span> סקירת אימון ודרישות
                </h3>
              </div>
              <div style="display: flex; flex-direction: column; gap: 2px;">
                ${reportItems.join('')}
              </div>
            </div>
          `;
        } else {
          eqBanner.innerHTML = '';
        }
      } else {
        eqBanner.innerHTML = '';
      }
    }

    // Update progress
    updateProgress(day);

    // Render exercises
    renderExercises(day);

    // Update inputs
    document.getElementById('actual-rpe').value = currentTracking.actualRPE || '';
    document.getElementById('body-weight').value = currentTracking.bodyWeight || '';
    document.getElementById('day-notes').value = currentTracking.notes || '';

    // Update navigation info
    const prevBtn = document.getElementById('nav-prev-day');
    const nextBtn = document.getElementById('nav-next-day');
    if (prevBtn) prevBtn.disabled = currentDayIndex <= 0;
    if (nextBtn) nextBtn.disabled = currentDayIndex >= allPlanDays.length - 1;


  }


  /**
   * Update progress ring
   */
  function updateProgress(day) {
    const total = day.exercises.length;
    if (total === 0) {
      setProgressCircle(day.dayType === 'Rest' && currentTracking.completed ? 100 : 0);
      return;
    }

    let completed = 0;
    day.exercises.forEach((ex, idx) => {
      if (currentTracking.exerciseStatus && currentTracking.exerciseStatus[idx]) {
        completed++;
      }
    });

    const percent = Math.round((completed / total) * 100);
    setProgressCircle(percent);
  }

  /**
   * Set progress circle value
   */
  function setProgressCircle(percent) {
    const circles = document.querySelectorAll('.js-progress-circle');
    const texts = document.querySelectorAll('.js-progress-text');
    const circumference = 2 * Math.PI * 42; // r=42
    const offset = circumference - (percent / 100) * circumference;

    circles.forEach(circle => {
      circle.style.strokeDasharray = circumference;
      circle.style.strokeDashoffset = offset;
      
      // Add gradient definition if not exists
      const svg = circle.closest('svg');
      if (svg && !svg.querySelector('defs')) {
        const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
        const gradient = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
        gradient.id = 'progress-gradient';
        gradient.innerHTML = `
          <stop offset="0%" stop-color="#3b82f6"/>
          <stop offset="100%" stop-color="#8b5cf6"/>
        `;
        defs.appendChild(gradient);
        svg.insertBefore(defs, svg.firstChild);
      }
    });

    texts.forEach(text => {
      text.textContent = `${percent}%`;
    });
  }

  /**
   * Find previous tracking performance for a given exercise name
   * Looks back through plan days to find the last time this exercise was done with tracking data
   */
  function findPrevPerformance(exerciseName, beforeDayIndex) {
    if (!allTrackingCache || !exerciseName) return null;
    
    // Build tracking map for quick lookup
    const trackingMap = {};
    allTrackingCache.forEach(t => { trackingMap[t.dayIndex] = t; });
    
    // Search backwards from the day before current
    for (let i = beforeDayIndex - 1; i >= 0; i--) {
      const pastDay = allPlanDays[i];
      if (!pastDay || !pastDay.exercises) continue;
      
      const exIdx = pastDay.exercises.findIndex(e => e.name === exerciseName);
      if (exIdx === -1) continue;
      
      const tracking = trackingMap[i];
      if (!tracking || !tracking.setData || !tracking.setData[exIdx]) continue;
      
      // Found tracking data for this exercise
      return {
        dayIndex: i,
        dayNum: pastDay.dayNum,
        setData: tracking.setData[exIdx],
        completed: tracking.exerciseStatus && tracking.exerciseStatus[exIdx]
      };
    }
    return null;
  }

  /**
   * Look up video URL from exercise guide by name
   */


  /**
   * Render exercise cards
   */
  function renderExercises(day) {
    const realTodayIndex = UI.findTodayIndex(allPlanDays);
    const isToday = currentDayIndex === realTodayIndex;
    const disabledAttr = isToday ? '' : 'disabled style="opacity: 0.5; cursor: not-allowed;"';

    const container = document.getElementById('exercises-list');

    if (day.exercises.length === 0) {
      // Rest day
      const isCompleted = currentTracking.completed;
      container.innerHTML = `
        <div class="exercise-card ${isCompleted ? 'completed' : ''}" style="text-align: center; padding: 40px; display: flex; flex-direction: column; align-items: center; gap: 16px;">
          <div style="font-size: 48px;">😴</div>
          <div>
            <h3 style="font-size: 18px; margin-bottom: 8px;">Rest Day</h3>
            <p style="color: var(--text-secondary); font-size: 14px; max-width: 320px; margin: 0 auto; direction: rtl;">
              הגוף שלך צריך מנוחה כדי להיבנות ולהתחזק. הקפד על שינה טובה, תזונה נכונה ושתיית מים!
            </p>
          </div>
          <button class="btn-primary rest-complete-btn ${isCompleted ? 'checked' : ''}" 
                  style="width: auto; padding: 10px 24px; font-weight: 600; display: inline-flex; align-items: center; gap: 8px; border: none; border-radius: 8px; cursor: pointer; transition: all 0.2s; background: ${isCompleted ? 'var(--success, #10b981)' : 'var(--accent-primary, #3b82f6)'}; color: white;"
                  onclick="TodayPage.toggleRestDayComplete()" ${disabledAttr}>
            ${isCompleted ? '✓ יום מנוחה הושלם' : 'סמן כהושלם ויאללה לעבודה'}
          </button>
        </div>
      `;
      return;
    }
    container.innerHTML = day.exercises.map((ex, idx) => {
      const isCompleted = currentTracking.exerciseStatus && currentTracking.exerciseStatus[idx];
      const color = UI.getCategoryColor(ex.slot);
      const setsCount = UI.parseSetsCount(ex.sets);
      const reps = UI.parseReps(ex.sets);
      const setData = (currentTracking.setData && currentTracking.setData[idx]) || {};
      const exNote = (currentTracking.exerciseNotes && currentTracking.exerciseNotes[idx]) || '';

      // Check if exercise has weight data
      const hasWeight = ex.weight && ex.weight !== '—' && ex.weight !== 'משקל גוף';

      // Determine if this is a time-based exercise
      const isTime = ex.sets && (ex.sets.includes('mins') || ex.sets.includes('secs'));

      // Find previous tracking data for this exercise
      const prevPerf = findPrevPerformance(ex.name, currentDayIndex);

      let setsHTML = '';
      if (!isTime && setsCount > 0) {
        // Previous performance summary
        let prevPerfHTML = '';
        if (prevPerf && prevPerf.setData) {
          const prevSets = [];
          let maxReps = 0;
          for (let ps = 0; ps < 10; ps++) {
            const pr = prevPerf.setData[`set_${ps}_reps`];
            if (pr) {
              prevSets.push(pr);
              if (parseInt(pr) > maxReps) maxReps = parseInt(pr);
            }
          }
          if (prevSets.length > 0) {
            prevPerfHTML = `
              <div class="prev-performance">
                <span class="prev-perf-label">📊 ביצוע אחרון:</span>
                <span class="prev-perf-values">${prevSets.map((r, i) => `<span class="prev-set">Set ${i+1}: ${r}</span>`).join('')}</span>
                ${maxReps > 0 ? `<span class="prev-perf-pr">🏆 שיא: ${maxReps}</span>` : ''}
              </div>
            `;
          }
        }

        setsHTML = prevPerfHTML + '<div class="set-tracker">';
        for (let s = 0; s < setsCount; s++) {
          const setDone = setData[`set_${s}_done`] || false;
          const setReps = setData[`set_${s}_reps`] || '';
          const setWeight = setData[`set_${s}_weight`] || '';

          // Use previous performance as placeholder hint
          const prevReps = (prevPerf && prevPerf.setData && prevPerf.setData[`set_${s}_reps`]) || reps;
          const prevWeight = (prevPerf && prevPerf.setData && prevPerf.setData[`set_${s}_weight`]) || ex.weight;

          // Weight input - only show if exercise has weight data
          const weightInput = hasWeight ? `
              <input type="number" class="set-input" placeholder="${prevWeight}" 
                     value="${setWeight}" ${disabledAttr}
                     data-ex="${idx}" data-set="${s}" data-field="weight"
                     onchange="TodayPage.updateSetData(${idx}, ${s}, 'weight', this.value)">
              <span class="set-unit">kg</span>
          ` : '';

          setsHTML += `
            <div class="set-row">
              <span class="set-label">Set ${s + 1}</span>
              <input type="number" class="set-input" placeholder="${prevReps}" 
                     value="${setReps}" ${disabledAttr}
                     data-ex="${idx}" data-set="${s}" data-field="reps"
                     onchange="TodayPage.updateSetData(${idx}, ${s}, 'reps', this.value)">
              <span class="set-unit">reps</span>
              ${weightInput}
              <button class="set-check ${setDone ? 'checked' : ''}" 
                      onclick="TodayPage.toggleSet(${idx}, ${s}, this)" ${disabledAttr}>✓</button>
            </div>
          `;
        }
        setsHTML += '</div>';
      }

      const gifPath = `images/gifs/${ex.name}.gif`;
      let videoBtn = '';
      if (!ex.name.toLowerCase().includes('walking') && !ex.name.includes('הליכה')) {
        videoBtn = `<button type="button" class="exercise-video-btn" title="צפה ב-GIF" style="color: var(--danger);" onclick="UI.showImageModal('${ex.name.replace(/'/g, "\\'")}', '${gifPath}'); event.stopPropagation();">▶</button>`;
      }

      // Find previous occurrence
      let prevEx = null;
      for (let i = currentDayIndex - 1; i >= 0; i--) {
        const pastDay = allPlanDays[i];
        if (pastDay && pastDay.exercises) {
          prevEx = pastDay.exercises.find(e => e.name === ex.name);
          if (prevEx) break;
        }
      }

      const isNewExercise = !prevEx && currentDayIndex > 0 && day.dayType !== 'Rest';
      const isSetsChanged = prevEx && ex.sets !== prevEx.sets;
      const isWeightChanged = prevEx && ex.weight !== prevEx.weight && ex.weight !== null && ex.weight !== '—' && ex.weight !== 'משקל גוף';

      const newBadgeHTML = isNewExercise ? `<div class="new-exercise-badge" style="position: absolute; bottom: 12px; left: 12px; background: #ef4444; color: white; padding: 4px 12px; border-radius: 6px; font-weight: 800; font-size: 13px; animation: blinkRed 1.5s infinite; box-shadow: 0 0 12px rgba(239, 68, 68, 0.8); z-index: 10;">תרגיל חדש!</div>` : '';

      // Detail line - only show weight if it exists
      const detailParts = [UI.getCategoryLabel(ex.slot)];
      if (ex.sets) {
        detailParts.push(isSetsChanged ? `<span class="alert-pulse-text" title="שינוי בסטים/חזרות!">${ex.sets}</span>` : ex.sets);
      }
      
      const equip = UI.getEquipment(ex.name);
      
      if (hasWeight) {
        let weightText = ex.weight;
        if (equip && equip.label === 'גומיית התנגדות') {
          weightText = `משקל גומיה: ${ex.weight}`;
        }
        detailParts.push(isWeightChanged ? `<span class="alert-pulse-text" title="שינוי במשקל!">${weightText}</span>` : weightText);
      }

      return `
        <div class="exercise-card ${isCompleted ? 'completed' : ''} ${isNewExercise ? 'alert-pulse-card' : ''}" id="ex-card-${idx}" style="--glow-color: ${color};">
          <div class="exercise-hero-container" style="position: relative;">
            <div style="position: absolute; top: 12px; right: 12px; background: rgba(0,0,0,0.6); backdrop-filter: blur(4px); -webkit-backdrop-filter: blur(4px); color: white; padding: 4px 10px; border-radius: 8px; font-size: 14px; font-weight: 800; font-family: 'Inter', sans-serif; box-shadow: 0 2px 8px rgba(0,0,0,0.2); z-index: 10; border: 1px solid rgba(255,255,255,0.1);">
              #${idx + 1}
            </div>
            <img src="images/exercises/${ex.name.replace(/\//g, '-').toUpperCase()}.png" 
                 class="exercise-hero-image"
                 loading="lazy"
                 alt="${ex.name}" onerror="UI.handleImageFallback(this, 'png')"
                 onclick="TodayPage.handleImageClick(event, ${idx}, '${ex.name.replace(/'/g, "\\'")}')">
            ${newBadgeHTML}
          </div>
          <div class="exercise-card-header" onclick="TodayPage.toggleExpand(${idx})">
            <div class="exercise-card-info">
              <div class="exercise-category-dot" style="background: ${color}"></div>
              <div>
                <div class="exercise-card-name" style="display: flex; align-items: center; flex-wrap: wrap; gap: 8px;">
                  ${ex.name}
                  ${ex.isWarmup ? `<span style="background: linear-gradient(135deg, #f59e0b22, #f9731622); border: 1px solid #f59e0b44; padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: 600; color: #f59e0b; display: inline-flex; align-items: center; gap: 4px;">🔥 Warmup</span>` : ''}
                  ${equip ? `<span style="background: var(--bg-hover, rgba(255,255,255,0.05)); border: 1px solid var(--border-color); padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: normal; color: var(--text-secondary); display: inline-flex; align-items: center; gap: 4px;">${equip.icon} ${equip.label}</span>` : ''}
                </div>
                <div class="exercise-card-detail">
                  ${detailParts.join(' • ')}
                </div>
              </div>
            </div>
            <div class="exercise-card-actions">
              ${videoBtn}
              <button class="exercise-check ${isCompleted ? 'checked' : ''}" 
                      onclick="event.stopPropagation(); TodayPage.toggleExercise(${idx}, this)" ${disabledAttr}>✓</button>
            </div>
          </div>
          <div class="exercise-card-body">
            ${setsHTML}
            <div class="exercise-note">
              <textarea placeholder="הערות לתרגיל..." rows="2" ${disabledAttr}
                        onchange="TodayPage.updateExerciseNote(${idx}, this.value)">${exNote}</textarea>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  /**
   * Toggle exercise card expand
   */
  function toggleExpand(idx) {
    const card = document.getElementById(`ex-card-${idx}`);
    const isExpanding = !card.classList.contains('expanded');
    
    // First, close all other cards and remove focus
    document.querySelectorAll('.exercise-card').forEach(c => {
      c.classList.remove('expanded');
      c.classList.remove('focused');
    });
    
    const listContainer = document.getElementById('exercises-list');

    if (isExpanding) {
      card.classList.add('expanded');
      card.classList.add('focused');
      listContainer.classList.add('has-focus');
      
      // Small delay before scrolling to allow expansion animation to start
      setTimeout(() => {
        card.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 50);
    } else {
      listContainer.classList.remove('has-focus');
    }
  }

  /**
   * Handle image click: expand if dimmed, else show modal
   */
  function handleImageClick(event, idx, exName) {
    event.stopPropagation();
    const listContainer = document.getElementById('exercises-list');
    const card = document.getElementById(`ex-card-${idx}`);
    
    if (listContainer && listContainer.classList.contains('has-focus') && card && !card.classList.contains('focused')) {
      toggleExpand(idx);
    } else {
      UI.showImageModal(exName, '');
      if (card && !card.classList.contains('expanded')) {
        toggleExpand(idx);
      }
    }
  }

  /**
   * Toggle exercise completion
   */
  async function toggleExercise(idx, btn) {
    if (currentDayIndex !== UI.findTodayIndex(allPlanDays)) return;
    
    if (!currentTracking.exerciseStatus) currentTracking.exerciseStatus = {};
    const isNowCompleted = !currentTracking.exerciseStatus[idx];
    currentTracking.exerciseStatus[idx] = isNowCompleted;

    btn.classList.toggle('checked');
    const card = document.getElementById(`ex-card-${idx}`);
    card.classList.toggle('completed');

    // Haptic feedback
    if (isNowCompleted && navigator.vibrate) navigator.vibrate(50);

    // Update progress
    const day = allPlanDays[currentDayIndex];
    updateProgress(day);

    // Check if all exercises are done
    const total = day.exercises.length;
    let completed = 0;
    day.exercises.forEach((_, i) => {
      if (currentTracking.exerciseStatus[i]) completed++;
    });
    currentTracking.completed = completed === total;

    await autoSave();

    if (currentTracking.completed && isNowCompleted) {
      // All exercises done! Celebrate!
      showWorkoutCelebration(day);
    } else if (isNowCompleted && !currentTracking.completed) {
      handleExerciseCompleted(idx, day);
    }
  }

  /**
   * Show celebration modal when workout is fully completed
   */
  async function showWorkoutCelebration(day) {
    // Count total sets done
    let totalSets = 0;
    let totalReps = 0;
    if (currentTracking.setData) {
      Object.values(currentTracking.setData).forEach(exSets => {
        if (typeof exSets === 'object') {
          Object.entries(exSets).forEach(([key, val]) => {
            if (key.endsWith('_done') && val) totalSets++;
            if (key.endsWith('_reps') && val) totalReps += parseInt(val) || 0;
          });
        }
      });
    }

    const typeInfo = UI.getDayTypeInfo(day.dayType);

    // Check backup status for reminder
    const lastBackupStr = await DB.getSetting('lastBackupDate');
    let needsBackupPrompt = false;
    let backupMessage = "";
    
    if (!lastBackupStr) {
      const allTracking = await DB.getAllTracking();
      const completedWorkouts = allTracking.filter(t => t.completed).length;
      if (completedWorkouts >= 3) {
        needsBackupPrompt = true;
        backupMessage = "מומלץ לגבות את התקדמות האימונים שלך לראשונה!";
      }
    } else {
      const lastBackupDate = new Date(lastBackupStr);
      const now = new Date();
      const diffTime = Math.abs(now - lastBackupDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays >= 14) {
        needsBackupPrompt = true;
        backupMessage = `עברו ${diffDays} ימים מאז הגיבוי האחרון שלך. כדאי לגבות כעת!`;
      }
    }
    
    UI.showModal('🎉 אימון הושלם!', `
      <div style="text-align: center; padding: 16px;">
        <div class="celebration-confetti">🎊</div>
        <div style="font-size: 64px; margin-bottom: 16px; animation: bounceIn 0.6s ease;">💪</div>
        <h3 style="font-size: 22px; margin-bottom: 8px; color: var(--text-primary);">כל הכבוד! סיימת את האימון!</h3>
        <p style="color: var(--text-secondary); margin-bottom: 20px;">${typeInfo.label} — Day #${day.dayNum}</p>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 24px;">
          <div style="background: var(--bg-elevated); padding: 16px; border-radius: 12px;">
            <div style="font-size: 28px; font-weight: 800; color: var(--success);">${day.exercises.length}</div>
            <div style="font-size: 12px; color: var(--text-secondary);">תרגילים</div>
          </div>
          <div style="background: var(--bg-elevated); padding: 16px; border-radius: 12px;">
            <div style="font-size: 28px; font-weight: 800; color: var(--accent-primary);">${totalSets}</div>
            <div style="font-size: 12px; color: var(--text-secondary);">סטים</div>
          </div>
          ${totalReps > 0 ? `
          <div style="background: var(--bg-elevated); padding: 16px; border-radius: 12px; grid-column: 1 / -1;">
            <div style="font-size: 28px; font-weight: 800; color: var(--warning);">${totalReps}</div>
            <div style="font-size: 12px; color: var(--text-secondary);">חזרות בסה"כ</div>
          </div>` : ''}
        </div>
        
        ${needsBackupPrompt ? `
        <div style="margin-top: 16px; padding: 16px; border-radius: 12px; background: rgba(245, 158, 11, 0.1); border: 1px solid rgba(245, 158, 11, 0.2); margin-bottom: 16px;">
          <p style="font-size: 13px; color: var(--text-secondary); margin-bottom: 8px; direction: rtl; text-align: center;">⚠️ ${backupMessage}</p>
          <button id="celebration-backup-btn" class="btn-secondary" style="width: 100%; padding: 10px; font-size: 13px; display: flex; align-items: center; justify-content: center; gap: 6px;">
            📤 גבה את הנתונים כעת
          </button>
        </div>` : ''}

        <button id="celebration-continue-btn" class="btn-primary" style="width: 100%; padding: 14px;">
          🏆 מעולה! המשך הלאה
        </button>
      </div>
    `);

    document.getElementById('celebration-continue-btn').onclick = async () => {
      UI.hideModal();
      
      if (typeof App !== 'undefined' && App.recalculatePlanIndex) {
        await App.recalculatePlanIndex();
      }
      
      const activeIdx = UI.findTodayIndex(allPlanDays);
      if (currentDayIndex !== activeIdx) {
        goToDay(activeIdx);
      } else {
        render();
      }
    };

    if (needsBackupPrompt) {
      const backupBtn = document.getElementById('celebration-backup-btn');
      if (backupBtn) {
        backupBtn.onclick = async () => {
          if (typeof App !== 'undefined' && App.shareBackup) {
            const success = await App.shareBackup();
            if (success) {
              backupBtn.parentElement.style.display = 'none';
            }
          }
        };
      }
    }

    // Haptic celebration
    if (navigator.vibrate) navigator.vibrate([100, 50, 100, 50, 200]);
  }

  function getRestTime(ex) {
    if (!ex || !ex.name) return 90;
    
    if (ex.isWarmup) return 0;

    const lowerName = ex.name.toLowerCase();

    // Active Recovery / Skill practice / Mobility (0s — no rest timer)
    if (lowerName.includes('walking') || lowerName.includes('הליכה') || lowerName.includes('jogging')) {
        return 0;
    }
    if (lowerName.includes('handstand practice') || lowerName.includes('l-sit practice')) {
        return 0;
    }
    if (lowerName.includes('ankle dorsiflexion')) {
        return 0;
    }

    // 180 Seconds — Heavy eccentrics and chin-ups
    if (lowerName.includes('pull-up negative') || 
        lowerName.includes('chin-up negative') || 
        lowerName.includes('handstand push-up negative') ||
        lowerName.includes('hspu negative') ||
        lowerName === 'chin-up' || lowerName.includes('chin-up')) {
        return 180;
    }

    // 120 Seconds — Compound movements, L-sit holds, Dragon Flag
    const rules120 = ['squat', 'lunge', 'single-leg rdl', 'towel curl', 'push-up', 'pike push-up', 'wall handstand', 'wall walk', 'seated band row', 'l-sit on chair', 'l-sit on floor', 'dragon flag', 'pull-up (overhand)', 'explosive pull-up', 'tuck front lever'];
    for (const r of rules120) {
        if (lowerName.includes(r)) return 120;
    }

    // 90 Seconds — Isolation
    const rules90 = ['band curl', 'towel grip hang'];
    for (const r of rules90) {
        if (lowerName.includes(r)) return 90;
    }

    // 60 Seconds — Prehab, light core, accessories
    const rules60 = ['scapular pull-up', 'scapular push-up', 'band pull-apart', 'prone y-t-w', 'hollow rock', 'hollow-to-arch rock', 'dead bug', 'side plank hip dip', 'glute bridge', 'calf raise'];
    for (const r of rules60) {
        if (lowerName.includes(r)) return 60;
    }

    return 90; // Default
  }

  function handleExerciseCompleted(idx, day) {
    // Find next incomplete exercise
    let nextIdx = -1;
    for (let i = idx + 1; i < day.exercises.length; i++) {
        if (!currentTracking.exerciseStatus[i]) {
            nextIdx = i;
            break;
        }
    }

    if (nextIdx !== -1) {
        const restTime = getRestTime(day.exercises[idx]);
        
        if (restTime > 0) {
            // Start a timer for exercise transition
            UI.startTimer(restTime, () => {
                // Expand next exercise when timer finishes
                document.querySelectorAll('.exercise-card').forEach(c => c.classList.remove('expanded'));
                const nextCard = document.getElementById(`ex-card-${nextIdx}`);
                if (nextCard) {
                    nextCard.classList.add('expanded');
                    nextCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            });
        } else {
            // No rest needed, just expand next exercise
            document.querySelectorAll('.exercise-card').forEach(c => c.classList.remove('expanded'));
            const nextCard = document.getElementById(`ex-card-${nextIdx}`);
            if (nextCard) {
                nextCard.classList.add('expanded');
                nextCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }
    }
  }

  /**
   * Toggle set completion
   */
  async function toggleSet(exIdx, setIdx, btn) {
    if (currentDayIndex !== UI.findTodayIndex(allPlanDays)) return;

    if (!currentTracking.setData) currentTracking.setData = {};
    if (!currentTracking.setData[exIdx]) currentTracking.setData[exIdx] = {};

    const key = `set_${setIdx}_done`;
    const isNowDone = !currentTracking.setData[exIdx][key];
    currentTracking.setData[exIdx][key] = isNowDone;
    btn.classList.toggle('checked');

    // Check if all sets are done → auto-complete exercise
    const day = allPlanDays[currentDayIndex];
    const ex = day.exercises[exIdx];
    const setsCount = UI.parseSetsCount(ex.sets);
    let allSetsDone = true;
    for (let s = 0; s < setsCount; s++) {
      if (!currentTracking.setData[exIdx][`set_${s}_done`]) {
        allSetsDone = false;
        break;
      }
    }

    if (allSetsDone && !currentTracking.exerciseStatus[exIdx]) {
      if (!currentTracking.exerciseStatus) currentTracking.exerciseStatus = {};
      currentTracking.exerciseStatus[exIdx] = true;
      const card = document.getElementById(`ex-card-${exIdx}`);
      card.classList.add('completed');
      const checkBtn = card.querySelector('.exercise-check');
      if (checkBtn) checkBtn.classList.add('checked');
      updateProgress(day);

      const total = day.exercises.length;
      let completed = 0;
      day.exercises.forEach((_, i) => {
        if (currentTracking.exerciseStatus[i]) completed++;
      });
      currentTracking.completed = completed === total;
      
      await autoSave();
      
      if (currentTracking.completed) {
        showWorkoutCelebration(day);
      } else {
        handleExerciseCompleted(exIdx, day);
      }
    } else {
      await autoSave();
      
      // If we just marked a set as done (and not all sets are done), start a rest timer based on the exercise
      if (isNowDone) {
        const restTime = getRestTime(ex);
        if (restTime > 0) {
            UI.startTimer(restTime, null);
        }
      }
    }
  }

  /**
   * Update set data
   */
  async function updateSetData(exIdx, setIdx, field, value) {
    if (currentDayIndex !== UI.findTodayIndex(allPlanDays)) return;
    if (!currentTracking.setData) currentTracking.setData = {};
    if (!currentTracking.setData[exIdx]) currentTracking.setData[exIdx] = {};
    currentTracking.setData[exIdx][`set_${setIdx}_${field}`] = value;
    await autoSave();
  }

  /**
   * Update exercise note
   */
  async function updateExerciseNote(exIdx, value) {
    if (currentDayIndex !== UI.findTodayIndex(allPlanDays)) return;
    if (!currentTracking.exerciseNotes) currentTracking.exerciseNotes = {};
    currentTracking.exerciseNotes[exIdx] = value;
    await autoSave();
  }

  async function checkAndLockStartDate() {
    let startDate = await DB.getSetting('planStartDate');
    if (!startDate) {
      const d = new Date();
      d.setDate(d.getDate() - currentDayIndex);
      startDate = UI.getLocalDateString(d);
      await DB.setSetting('planStartDate', startDate);
      await DB.loadTrainingPlan();
      UI.toast('תוכנית האימונים התחילה בהצלחה! 🚀', 'success');
    }
  }

  async function toggleRestDayComplete() {
    if (currentDayIndex !== UI.findTodayIndex(allPlanDays)) return;
    
    currentTracking.completed = !currentTracking.completed;
    currentTracking.lastUpdated = new Date().toISOString();
    currentTracking.date = currentTracking.date || UI.getLocalDateString();
    
    await autoSave();
    
    const day = allPlanDays[currentDayIndex];
    if (currentTracking.completed) {
      showWorkoutCelebration(day);
    } else {
      render();
    }
  }

  /**
   * Auto-save tracking data
   */
  async function autoSave() {
    await checkAndLockStartDate();
    
    const rpe = document.getElementById('actual-rpe').value;
    const weight = document.getElementById('body-weight').value;
    const notes = document.getElementById('day-notes').value;

    currentTracking.actualRPE = rpe ? parseFloat(rpe) : null;
    currentTracking.bodyWeight = weight ? parseFloat(weight) : null;
    currentTracking.notes = notes;
    currentTracking.lastUpdated = new Date().toISOString();
    currentTracking.date = currentTracking.date || UI.getLocalDateString();

    await DB.saveDayTracking(currentDayIndex, currentTracking);

    // --- Auto-complete passed Rest days ---
    await DB.syncRestDays(allPlanDays);

    // --- Update the active plan index based on sequential progress ---
    let newActiveIndex = 0;
    const allTracking = await DB.getAllTracking();
    for (let i = 0; i < allPlanDays.length; i++) {
      const track = allTracking.find(t => t.dayIndex === i);
      if (!track || !track.completed) {
        newActiveIndex = i;
        break;
      }
    }
    
    if (newActiveIndex !== window.appCurrentPlanIndex) {
      window.appCurrentPlanIndex = newActiveIndex;
      await DB.setSetting('currentPlanIndex', newActiveIndex);
      if (typeof App !== 'undefined' && App.updatePlanDates) {
        await App.updatePlanDates(newActiveIndex);
      }
      
      // Re-render calendar so the correct today column is highlighted
      if (typeof CalendarPage !== 'undefined') {
        CalendarPage.render();
      }
    }

    // --- Schedule Background Cloud Sync ---
    if (typeof CloudSync !== 'undefined') {
      CloudSync.scheduleSync();
    }
  }


  /**
   * Skip current day and advance the plan
   */


  function showExerciseImage(name, src) {
    UI.showModal(name, `<img src="${src}" style="width:100%; border-radius:8px;">`);
  }

  return {
    init,
    render,
    navigate,
    goToDay,
    goToToday,
    toggleExpand,
    handleImageClick,
    toggleExercise,
    toggleRestDayComplete,
    toggleSet,
    updateSetData,
    updateExerciseNote,
    showExerciseImage,
    getCurrentDayIndex: () => currentDayIndex
  };
})();

// Expose to window for inline event handlers
window.TodayPage = TodayPage;
