/**
 * Today Page Module - Daily workout view with tracking
 */
const TodayPage = (() => {
  let currentDayIndex = 0;
  let allPlanDays = [];
  let currentTracking = null;
  let allExercises = [];
  let allTrackingCache = null;

  let renderNutritionSectionRef = null;

  function isWeighted(ex) {
    if (!ex || !ex.weight) return false;
    const w = String(ex.weight).trim().toLowerCase();
    if (w === '' || w === '—' || w.startsWith('bodyweight') || w.startsWith('משקל גוף') || w.startsWith('incline') || w.includes('%')) {
      return false;
    }
    return true;
  }

  function extractNumericWeight(weightStr) {
    if (!weightStr) return '';
    const str = String(weightStr).trim();
    if (str.toLowerCase().startsWith('bodyweight') || str.toLowerCase().startsWith('משקל גוף') || str === '—' || str.toLowerCase().startsWith('incline') || str.includes('%')) {
      return '';
    }
    const match = str.match(/(\d+(?:\.\d+)?)/);
    return match ? match[1] : '';
  }

  /**
   * Get suggested numeric weight for set (supports ladder ranges e.g. "6-15 kg total (Ladder)")
   */
  function getSuggestedWeightForSet(ex, setIndex, totalSets, prevPerf) {
    if (prevPerf && prevPerf.setData && prevPerf.setData[`set_${setIndex}_weight`]) {
      return prevPerf.setData[`set_${setIndex}_weight`];
    }
    if (!ex || !ex.weight || !isWeighted(ex)) return '';
    const wStr = String(ex.weight).trim();

    // Check for range like "6-15 kg total (Ladder)" or "3-9 kg each (Ladder)"
    const rangeMatch = wStr.match(/(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)/);
    if (rangeMatch) {
      // Both sets start at the current stage weight (min weight of range for stage 1)
      return String(rangeMatch[1]);
    }

    return extractNumericWeight(wStr);
  }

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

    const swapWorkoutBtn = document.getElementById('swap-workout-btn');
    if (swapWorkoutBtn) {
      swapWorkoutBtn.addEventListener('click', showSwapModal);
    }

    // Auto-save inputs on change
    const actualRpe = document.getElementById('actual-rpe');
    if (actualRpe) actualRpe.addEventListener('change', autoSave);
    const bodyWeight = document.getElementById('body-weight');
    if (bodyWeight) bodyWeight.addEventListener('change', autoSave);
    const dayNotes = document.getElementById('day-notes');
    if (dayNotes) dayNotes.addEventListener('change', autoSave);

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
    const isDeloadDay = typeInfo.isDeload || (day.dayType && day.dayType.includes('Deload')) || (day.week && day.week.includes('Deload'));

    // Active Recovery & Deload UI Background differentiation
    if (day.dayType === 'Active Recovery') {
      document.body.classList.add('recovery-mode');
      document.body.classList.remove('deload-mode');
    } else if (isDeloadDay) {
      document.body.classList.add('deload-mode');
      document.body.classList.remove('recovery-mode');
    } else {
      document.body.classList.remove('recovery-mode');
      document.body.classList.remove('deload-mode');
    }
    
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
              <strong style="color: var(--accent-primary); display: block; margin-bottom: 4px;">${I18n.t('program_not_started')}</strong>
              ${I18n.t('program_not_started_desc')}
            </div>
          </div>
        `;
        summaryCard.parentNode.insertBefore(previewBanner, summaryCard);
      }
    } else if (previewBanner) {
      previewBanner.remove();
    }

    // Deload Alert Banner logic
    let deloadBanner = document.getElementById('deload-mode-banner');
    if (isDeloadDay) {
      if (summaryCard) summaryCard.classList.add('is-deload');
      if (!deloadBanner && summaryCard) {
        deloadBanner = document.createElement('div');
        deloadBanner.id = 'deload-mode-banner';
        deloadBanner.className = 'deload-warning-banner';
        deloadBanner.innerHTML = `
          <div class="deload-banner-icon">🌿</div>
          <div class="deload-banner-content">
            <strong class="deload-banner-title">${I18n.t('deload_title')}</strong>
            <span class="deload-banner-sub">${I18n.t('deload_desc')}</span>
          </div>
        `;
        summaryCard.parentNode.insertBefore(deloadBanner, summaryCard);
      }
    } else {
      if (summaryCard) summaryCard.classList.remove('is-deload');
      if (deloadBanner) deloadBanner.remove();
    }

    // Update summary card
    document.getElementById('day-number').textContent = '#' + day.dayNum;
    document.getElementById('today-date-badge').textContent = day.dayOfWeek;
    document.getElementById('day-week').textContent = day.week ? day.week.replace('Week', I18n.t('week_label_full')) : '';

    const realTodayIndex = UI.findTodayIndex(allPlanDays);
    const isToday = currentDayIndex === realTodayIndex;
    const todayBtn = document.getElementById('today-btn');
    if (todayBtn) {
      todayBtn.style.display = isToday ? 'none' : 'flex';
    }
    

    const typeBadge = document.getElementById('day-type');
    typeBadge.textContent = typeInfo.label;
    typeBadge.className = `type-badge ${typeInfo.class}`;

    const swapWorkoutBtn = document.getElementById('swap-workout-btn');
    if (swapWorkoutBtn) {
      if (!currentTracking.completed) {
        swapWorkoutBtn.style.display = 'flex';
      } else {
        swapWorkoutBtn.style.display = 'none';
      }
    }

    const rpeBadge = document.getElementById('day-rpe');
    if (day.plannedRPE && day.plannedRPE !== '—') {
      rpeBadge.textContent = `RPE ${day.plannedRPE}`;
      rpeBadge.style.display = '';
    } else {
      rpeBadge.style.display = 'none';
    }



  /**
   * Render Nutrition Section with Gemini AI & Photo Scanner
   */
  async function renderNutritionSection(queryDateStr) {
    renderNutritionSectionRef = renderNutritionSection;
    if (!queryDateStr) {
      const day = allPlanDays[currentDayIndex];
      queryDateStr = (day && day.date) ? day.date.split('/').reverse().join('-') : UI.getLocalDateString();
    }

    const parts = queryDateStr.split('-').map(Number);
    const dObj = new Date(parts[0], parts[1] - 1, parts[2]);
    const prevD = new Date(dObj); prevD.setDate(prevD.getDate() - 1);
    const nextD = new Date(dObj); nextD.setDate(nextD.getDate() + 1);
    const yesterdayStr = UI.getLocalDateString(prevD);
    const tomorrowStr = UI.getLocalDateString(nextD);
    const todayStr = UI.getLocalDateString();

    const setupCard = document.getElementById('gemini-setup-card');
    const mainContent = document.getElementById('nutrition-main-content');
    
    if (typeof GeminiService === 'undefined') return;
    if (GeminiService.initSelects) GeminiService.initSelects();

    const isConfigured = await GeminiService.isConfigured();

    if (!isConfigured) {
      if (setupCard) setupCard.style.display = 'block';
      if (mainContent) mainContent.style.display = 'none';

      // Bind setup button
      const saveKeyBtn = document.getElementById('save-gemini-key-btn');
      if (saveKeyBtn && !saveKeyBtn.hasAttribute('data-bound')) {
        saveKeyBtn.setAttribute('data-bound', 'true');
        saveKeyBtn.onclick = async () => {
          const keyInput = document.getElementById('gemini-api-key-input');
          const modelSelect = document.getElementById('gemini-model-select');
          const errorDiv = document.getElementById('gemini-key-error');
          const key = keyInput ? keyInput.value.trim() : '';
          const model = modelSelect ? modelSelect.value : 'gemini-3.1-flash-lite';

          if (!key) {
            if (errorDiv) { errorDiv.textContent = I18n.t('enter_api_key'); errorDiv.style.display = 'block'; }
            return;
          }

          saveKeyBtn.disabled = true;
          saveKeyBtn.textContent = I18n.t('checking_key');
          if (errorDiv) errorDiv.style.display = 'none';

          try {
            await GeminiService.testApiKey(key, model);
            await GeminiService.setApiKey(key);
            await GeminiService.setModel(model);
            UI.toast(I18n.t('key_saved_success'), 'success');
            if (window.updateGeminiSettingsUI) window.updateGeminiSettingsUI();
            renderNutritionSection(queryDateStr);
          } catch (err) {
            saveKeyBtn.disabled = false;
            saveKeyBtn.textContent = I18n.t('save_enable_ai');
            if (errorDiv) { errorDiv.textContent = err.message; errorDiv.style.display = 'block'; }
          }
        };
      }
      return;
    }

    if (setupCard) setupCard.style.display = 'none';
    if (mainContent) mainContent.style.display = 'block';

    // Display current model badge
    const modelBadge = document.getElementById('current-ai-model-badge');
    if (modelBadge) {
      const currentModel = await GeminiService.getModel();
      modelBadge.textContent = currentModel;
    }

    const deleteBadgeBtn = document.getElementById('delete-gemini-key-badge-btn');
    if (deleteBadgeBtn) {
      deleteBadgeBtn.onclick = async () => {
        if (confirm(I18n.t('delete_key_confirm'))) {
          await GeminiService.removeApiKey();
          UI.toast(I18n.t('key_deleted'), 'info');
          if (window.updateGeminiSettingsUI) window.updateGeminiSettingsUI();
          renderNutritionSection(queryDateStr);
        }
      };
    }

    // Set date label & nav controls
    const dateLabel = document.getElementById('nutrition-date-label');
    if (dateLabel) {
      const formattedDate = queryDateStr.split('-').reverse().join('/');
      dateLabel.innerHTML = `
        <div style="display: flex; align-items: center; gap: 4px;">
          <button id="nut-prev-day-btn" style="background: var(--bg-elevated); border: 1px solid var(--border-light); color: var(--text-primary); border-radius: 6px; padding: 2px 8px; cursor: pointer; font-size: 11px; font-weight: 700;" title="${I18n.t('nav_prev_nut_day')}">▶</button>
          <span style="font-weight: 700; color: var(--text-primary); font-size: 12px; margin: 0 4px;">${I18n.t('nut_date_label')} ${formattedDate}</span>
          <button id="nut-next-day-btn" style="background: var(--bg-elevated); border: 1px solid var(--border-light); color: var(--text-primary); border-radius: 6px; padding: 2px 8px; cursor: pointer; font-size: 11px; font-weight: 700;" title="${I18n.t('nav_next_nut_day')}">◀</button>
        </div>
      `;
      const prevBtn = document.getElementById('nut-prev-day-btn');
      const nextBtn = document.getElementById('nut-next-day-btn');
      if (prevBtn) prevBtn.onclick = () => renderNutritionSection(yesterdayStr);
      if (nextBtn) nextBtn.onclick = () => renderNutritionSection(tomorrowStr);
    }

    // Load nutrition data from DB for queryDateStr
    let nutrition = await DB.getNutrition(queryDateStr);
    if (!nutrition) nutrition = { meals: [], supplements_taken: [] };

    // Calculate totals
    let totalCals = 0;
    let totalProtein = 0;
    if (nutrition.meals && nutrition.meals.length > 0) {
      nutrition.meals.forEach(m => {
        totalCals += (m.calories || 0);
        totalProtein += (m.protein || 0);
      });
    }

    const targetCals = 1980; // 2200 with 10% reduction
    const targetProtein = 160;

    // Update HUD
    const nutCalsEl = document.getElementById('nut-calories-total');
    const nutProtEl = document.getElementById('nut-protein-total');
    const nutCalsTargetEl = document.getElementById('nut-calories-target');
    if (nutCalsEl) nutCalsEl.textContent = totalCals;
    if (nutProtEl) nutProtEl.textContent = totalProtein;
    if (nutCalsTargetEl) nutCalsTargetEl.textContent = targetCals;

    const calsPercent = Math.round((totalCals / targetCals) * 100);
    const proteinPercent = Math.round((totalProtein / targetProtein) * 100);

    const calsBar = document.getElementById('nut-calories-bar');
    const protBar = document.getElementById('nut-protein-bar');
    if (calsBar) calsBar.style.width = `${Math.min(100, (totalCals / targetCals) * 100)}%`;
    if (protBar) protBar.style.width = `${Math.min(100, (totalProtein / targetProtein) * 100)}%`;

    // Nav HUD
    const navCals = document.getElementById('nav-cals-text');
    const navProt = document.getElementById('nav-protein-text');
    const navCalsPercent = document.getElementById('nav-cals-percent');
    const navProtPercent = document.getElementById('nav-protein-percent');

    if (navCals) navCals.textContent = `${totalCals}`;
    if (navProt) navProt.textContent = `${totalProtein}`;
    if (navCalsPercent) navCalsPercent.textContent = `${calsPercent}%`;
    if (navProtPercent) navProtPercent.textContent = `${proteinPercent}%`;

    const desktopNavNut = document.getElementById('desktop-nav-nutrition');
    if (desktopNavNut) {
      desktopNavNut.innerHTML = `<span style="color: var(--warning);">${totalCals} ${I18n.t('nut_kcal_label')} (${calsPercent}%)</span><span style="color: var(--border-color);">|</span><span style="color: var(--success);">${totalProtein}g ${I18n.t('nut_protein_label')} (${proteinPercent}%)</span>`;
    }

    // Update Quick Protein Powder Completion Button
    const quickProtBtn = document.getElementById('quick-protein-powder-btn');
    if (quickProtBtn) {
      const remainingNeeded = Math.max(0, targetProtein - totalProtein);
      if (remainingNeeded <= 0) {
        quickProtBtn.innerHTML = I18n.t('protein_goal_reached');
        quickProtBtn.disabled = true;
        quickProtBtn.style.opacity = '0.6';
        quickProtBtn.style.cursor = 'default';
        quickProtBtn.onclick = null;
      } else {
        const powderAmount = Math.ceil(remainingNeeded * 1.1);
        quickProtBtn.innerHTML = `🥛 ${I18n.t('quick_protein_consumed')} ${powderAmount}g ${I18n.t('quick_protein_powder')}`;
        quickProtBtn.disabled = false;
        quickProtBtn.style.opacity = '1';
        quickProtBtn.style.cursor = 'pointer';

        quickProtBtn.onclick = async () => {
          let currentNut = await DB.getNutrition(queryDateStr);
          if (!currentNut) currentNut = { meals: [], supplements_taken: [] };
          if (!currentNut.meals) currentNut.meals = [];

          const now = new Date();
          const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

          const newMeal = {
            id: 'meal_' + Date.now(),
            name: I18n.t('protein_powder_name'),
            calories: Math.round(powderAmount * 4),
            protein: powderAmount,
            time: timeStr,
            analysis: I18n.t('protein_powder_analysis')
          };

          currentNut.meals.push(newMeal);
          await DB.saveNutrition(queryDateStr, currentNut);

          UI.toast(I18n.t('protein_added_toast'), 'success');
          if (typeof CloudSync !== 'undefined' && CloudSync.scheduleSync) {
            CloudSync.scheduleSync();
          }
          renderNutritionSection(queryDateStr);
        };
      }
    }

    // Render Meals Log List
    const mealsContainer = document.getElementById('meals-log-container');
    const countBadge = document.getElementById('meals-count-badge');

    if (countBadge) {
      countBadge.textContent = `${nutrition.meals ? nutrition.meals.length : 0} ${I18n.t('nut_meals_count')}`;
    }

    if (mealsContainer) {
      mealsContainer.innerHTML = '';

      if (nutrition.meals && nutrition.meals.length > 0) {
        nutrition.meals.forEach(meal => {
          const mealCard = document.createElement('div');
          mealCard.style.cssText = "background: var(--bg-input); border-radius: 12px; padding: 12px; border: 1px solid var(--border-light); display: flex; flex-direction: column; gap: 8px;";

          const imgHtml = meal.image ? `
            <img src="${meal.image}" alt="${meal.name}" loading="eager" decoding="async" style="width: 60px; height: 60px; border-radius: 8px; object-fit: cover; border: 1px solid var(--border-light); flex-shrink: 0;">
          ` : '';

          const analysisHtml = meal.analysis ? `
            <div style="font-size: 11px; color: var(--text-secondary); background: var(--bg-card); padding: 8px 10px; border-radius: 8px; border-right: 3px solid var(--accent-primary); line-height: 1.4;">
              🤖 <em>${meal.analysis}</em>
            </div>
          ` : '';

          const targetMoveDate = (queryDateStr === todayStr) ? yesterdayStr : todayStr;
          const targetMoveLabel = (queryDateStr === todayStr) ? I18n.t('move_to_yesterday') : I18n.t('move_to_today');

          mealCard.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 10px;">
              ${imgHtml}
              <div style="flex: 1;">
                <div style="font-size: 14px; font-weight: 800; color: var(--text-primary); margin-bottom: 2px;">${meal.name}</div>
                <div style="display: flex; gap: 8px; align-items: center; flex-wrap: wrap;">
                  <span style="font-size: 12px; font-weight: 700; color: var(--warning); background: var(--warning-bg); padding: 2px 6px; border-radius: 6px;">🔥 ${meal.calories} ${I18n.t('nut_kcal_label')}</span>
                  <span style="font-size: 12px; font-weight: 700; color: var(--success); background: var(--success-bg); padding: 2px 6px; border-radius: 6px;">🥩 ${meal.protein}g ${I18n.t('nut_protein_label')}</span>
                  <span style="font-size: 11px; color: var(--text-muted);">${meal.time || ''}</span>
                </div>
              </div>
              <div style="display: flex; gap: 6px; align-items: center;">
                <button class="move-meal-btn" data-id="${meal.id}" data-target="${targetMoveDate}" style="background: var(--bg-elevated); border: 1px solid var(--border-light); font-size: 11px; font-weight: 700; cursor: pointer; color: var(--accent-primary); padding: 4px 8px; border-radius: 6px; display: flex; align-items: center; gap: 4px;" title="${I18n.t('move_meal_title')}">
                  📅 ${targetMoveLabel}
                </button>
                <button class="delete-meal-btn" data-id="${meal.id}" style="background: none; border: none; font-size: 16px; cursor: pointer; color: var(--danger); padding: 4px;" title="${I18n.t('delete_meal')}">🗑️</button>
              </div>
            </div>
            ${analysisHtml}
          `;

          mealsContainer.appendChild(mealCard);
        });

        // Bind move handlers
        mealsContainer.querySelectorAll('.move-meal-btn').forEach(btn => {
          btn.onclick = async () => {
            const id = btn.dataset.id;
            const targetDateStr = btn.dataset.target;
            let currentNut = await DB.getNutrition(queryDateStr);
            if (currentNut && currentNut.meals) {
              const mealToMove = currentNut.meals.find(m => m.id === id);
              if (mealToMove) {
                currentNut.meals = currentNut.meals.filter(m => m.id !== id);
                await DB.saveNutrition(queryDateStr, currentNut);

                let targetNut = await DB.getNutrition(targetDateStr);
                if (!targetNut) targetNut = { meals: [], supplements_taken: [] };
                if (!targetNut.meals) targetNut.meals = [];
                targetNut.meals.push(mealToMove);
                await DB.saveNutrition(targetDateStr, targetNut);

                UI.toast(I18n.t('meal_moved_success'), 'success');
                if (typeof CloudSync !== 'undefined' && CloudSync.scheduleSync) {
                  CloudSync.scheduleSync();
                }
                renderNutritionSection(queryDateStr);
              }
            }
          };
        });

        // Bind delete handlers
        mealsContainer.querySelectorAll('.delete-meal-btn').forEach(btn => {
          btn.onclick = async () => {
            if (confirm(I18n.t('delete_meal_confirm'))) {
              const id = btn.dataset.id;
              let currentNut = await DB.getNutrition(queryDateStr);
              if (currentNut && currentNut.meals) {
                currentNut.meals = currentNut.meals.filter(m => m.id !== id);
                await DB.saveNutrition(queryDateStr, currentNut);
                UI.toast(I18n.t('meal_deleted'), 'info');
                if (typeof CloudSync !== 'undefined' && CloudSync.scheduleSync) {
                  CloudSync.scheduleSync();
                }
                renderNutritionSection(queryDateStr);
              }
            }
          };
        });

      } else {
        mealsContainer.innerHTML = `<div style="text-align: center; font-size: 13px; color: var(--text-muted); padding: 24px;">${I18n.t('no_meals_yet')}</div>`;
      }
    }

    // Wire Camera & Gallery Inputs
    setupCameraAndPhotoHandlers(queryDateStr);
  }

  function setupCameraAndPhotoHandlers(queryDateStr) {
    const cameraInput = document.getElementById('food-camera-input');
    const galleryInput = document.getElementById('food-gallery-input');
    const previewBox = document.getElementById('food-analysis-preview');
    const previewImg = document.getElementById('food-preview-img');
    const cancelBtn = document.getElementById('cancel-analysis-btn');
    const runAiBtn = document.getElementById('run-ai-analysis-btn');
    const userNotesInput = document.getElementById('food-user-notes');
    const manualMealBtn = document.getElementById('manual-meal-btn');

    let activeBase64Image = null;
    let activeMimeType = 'image/jpeg';

    const handleFileSelect = async (file) => {
      if (!file) return;
      activeMimeType = 'image/jpeg';
      try {
        const compressedBase64 = await UI.compressImage(file, 500, 0.65);
        activeBase64Image = compressedBase64;
        if (previewImg) previewImg.src = activeBase64Image;
        if (previewBox) previewBox.style.display = 'block';
      } catch (err) {
        console.error('Error compressing food image:', err);
        const reader = new FileReader();
        reader.onload = (e) => {
          activeBase64Image = e.target.result;
          if (previewImg) previewImg.src = activeBase64Image;
          if (previewBox) previewBox.style.display = 'block';
        };
        reader.readAsDataURL(file);
      }
    };

    if (cameraInput && !cameraInput.hasAttribute('data-bound')) {
      cameraInput.setAttribute('data-bound', 'true');
      cameraInput.onchange = (e) => handleFileSelect(e.target.files[0]);
    }

    if (galleryInput && !galleryInput.hasAttribute('data-bound')) {
      galleryInput.setAttribute('data-bound', 'true');
      galleryInput.onchange = (e) => handleFileSelect(e.target.files[0]);
    }

    if (cancelBtn && !cancelBtn.hasAttribute('data-bound')) {
      cancelBtn.setAttribute('data-bound', 'true');
      cancelBtn.onclick = () => {
        if (previewBox) previewBox.style.display = 'none';
        activeBase64Image = null;
        if (cameraInput) cameraInput.value = '';
        if (galleryInput) galleryInput.value = '';
      };
    }

    if (runAiBtn && !runAiBtn.hasAttribute('data-bound')) {
      runAiBtn.setAttribute('data-bound', 'true');
      runAiBtn.onclick = async () => {
        if (!activeBase64Image) {
          UI.toast(I18n.t('select_photo'), 'warning');
          return;
        }

        const notes = userNotesInput ? userNotesInput.value.trim() : '';

        runAiBtn.disabled = true;
        runAiBtn.innerHTML = `<span>⏳</span> ${I18n.t('analyzing_ai')}`;

        try {
          const analysisResult = await GeminiService.analyzeFood(activeBase64Image, activeMimeType, notes);
          
          let currentNut = await DB.getNutrition(queryDateStr);
          if (!currentNut) currentNut = { meals: [], supplements_taken: [] };
          if (!currentNut.meals) currentNut.meals = [];

          const now = new Date();
          const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

          const newMeal = {
            id: 'meal_' + Date.now(),
            name: analysisResult.meal_name,
            calories: analysisResult.calories,
            protein: analysisResult.protein,
            carbs: analysisResult.carbs,
            fat: analysisResult.fat,
            analysis: analysisResult.analysis,
            time: timeStr,
            image: activeBase64Image
          };

          currentNut.meals.push(newMeal);
          await DB.saveNutrition(queryDateStr, currentNut);

          UI.toast(`${I18n.t('meal_added_toast')} ${analysisResult.meal_name} (${analysisResult.calories} ${I18n.t('nut_kcal_label')}) 🎉`, 'success');
          CloudSync.scheduleSync();

          // Reset inputs
          if (previewBox) previewBox.style.display = 'none';
          activeBase64Image = null;
          if (cameraInput) cameraInput.value = '';
          if (galleryInput) galleryInput.value = '';
          if (userNotesInput) userNotesInput.value = '';

          renderNutritionSection(queryDateStr);

        } catch (err) {
          console.error('AI analysis error:', err);
          UI.toast(I18n.t('ai_analysis_error') + err.message, 'error');
        } finally {
          runAiBtn.disabled = false;
          runAiBtn.innerHTML = `<span>🤖</span> ${I18n.t('analyze_with_ai')}`;
        }
      };
    }

    if (manualMealBtn && !manualMealBtn.hasAttribute('data-bound')) {
      manualMealBtn.setAttribute('data-bound', 'true');
      manualMealBtn.onclick = async () => {
        const name = prompt(I18n.t('manual_meal_name'));
        if (!name || !name.trim()) return;
        const calsStr = prompt(I18n.t('manual_meal_cals'), '500');
        const protStr = prompt(I18n.t('manual_meal_protein'), '35');

        const cals = parseInt(calsStr) || 0;
        const prot = parseInt(protStr) || 0;

        let currentNut = await DB.getNutrition(queryDateStr);
        if (!currentNut) currentNut = { meals: [], supplements_taken: [] };
        if (!currentNut.meals) currentNut.meals = [];

        const now = new Date();
        const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

        currentNut.meals.push({
          id: 'meal_' + Date.now(),
          name: name.trim(),
          calories: cals,
          protein: prot,
          time: timeStr,
          analysis: I18n.t('manual_entry')
        });

        await DB.saveNutrition(queryDateStr, currentNut);
        UI.toast(I18n.t('meal_added_success'), 'success');
        CloudSync.scheduleSync();
        renderNutritionSection(queryDateStr);
      };
    }
  }
    
    // Bottom sheet interaction removed (Now handled by App router as a dedicated page)
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
          if (equip && equip.label !== I18n.t('equip_bodyweight') && equip.label !== I18n.t('equip_wall')) {
            let labelText = equip.label;
            if (labelText === I18n.t('equip_band') && isWeighted(ex)) {
              labelText = `${I18n.t('equip_band')} (<bdi dir="ltr">${ex.weight}</bdi>)`;
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
          const isWeightChanged = prevEx && ex.weight !== prevEx.weight && isWeighted(ex);
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
                  ${I18n.t(eq.exercises.length > 1 ? 'required_for_exercises_plural' : 'required_for_exercises')} <b style="font-family: 'Inter', sans-serif;">${eq.exercises.map(n => `#${n}`).join(', ')}</b>
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
                <span style="font-weight: 700; color: #ef4444;">${I18n.t('new_exercises_label')}</span> 
                ${newExercisesList.length > 1 ? '' : ''}<b style="font-family: 'Inter', sans-serif; color: #ef4444;">${newExercisesList.map(n => `#${n}`).join(', ')}</b>. ${I18n.t('new_exercises_tip')}
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
                <span style="font-weight: 700; color: var(--warning);">${I18n.t('load_volume_label')}</span> 
                ${I18n.t(changedExercisesList.length > 1 ? 'load_volume_updated_plural' : 'load_volume_updated')} <b style="font-family: 'Inter', sans-serif;">${changedExercisesList.map(n => `#${n}`).join(', ')}</b>
              </div>
            </div>
          `);
        }

        if (reportItems.length > 0) {
          eqBanner.innerHTML = `
            <div style="background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 12px; padding: 16px; box-shadow: 0 4px 12px rgba(0,0,0,0.02);">
              <div style="display: flex; align-items: center; margin-bottom: 12px; border-bottom: 1px solid var(--border-light); padding-bottom: 12px;">
                <h3 style="font-size: 15px; font-weight: 800; color: var(--text-primary); margin: 0; display: flex; align-items: center; gap: 8px;">
                  <span style="display: flex;">${reportSvgs.report}</span> ${I18n.t('workout_overview_title')}
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

    // --- Update Nutrition & AI System ---
    const dayDateStr = (day && day.date) ? day.date.split('/').reverse().join('-') : UI.getLocalDateString();
    await renderNutritionSection(dayDateStr);
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
            <p style="color: var(--text-secondary); font-size: 14px; max-width: 320px; margin: 0 auto;">
              ${I18n.t('rest_day_desc')}
            </p>
          </div>
          <button class="btn-primary rest-complete-btn ${isCompleted ? 'checked' : ''}" 
                  style="width: auto; padding: 10px 24px; font-weight: 600; display: inline-flex; align-items: center; gap: 8px; border: none; border-radius: 8px; cursor: pointer; transition: all 0.2s; background: ${isCompleted ? 'var(--success, #10b981)' : 'var(--accent-primary, #3b82f6)'}; color: white;"
                  onclick="TodayPage.toggleRestDayComplete()" ${disabledAttr}>
            ${isCompleted ? I18n.t('rest_day_completed') : I18n.t('rest_day_mark_complete')}
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
      const hasWeight = isWeighted(ex);

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
                <span class="prev-perf-label">${I18n.t('prev_performance')}</span>
                <span class="prev-perf-values">${prevSets.map((r, i) => `<span class="prev-set">Set ${i+1}: ${r}</span>`).join('')}</span>
                ${maxReps > 0 ? `<span class="prev-perf-pr">${I18n.t('prev_record')} ${maxReps}</span>` : ''}
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
          const suggestedWeightNum = getSuggestedWeightForSet(ex, s, setsCount, prevPerf);

          // Weight input - only show if exercise has weight data
          const weightInput = hasWeight ? `
            <div class="set-input-pill">
              <input type="number" class="set-input" placeholder="${suggestedWeightNum}" 
                     value="${setWeight}" ${disabledAttr}
                     data-ex="${idx}" data-set="${s}" data-field="weight"
                     onchange="TodayPage.updateSetData(${idx}, ${s}, 'weight', this.value)">
              <span class="set-unit">kg</span>
            </div>
          ` : '';

          setsHTML += `
            <div class="set-row">
              <button class="set-check ${setDone ? 'checked' : ''}" 
                      onclick="TodayPage.toggleSet(${idx}, ${s}, this)" ${disabledAttr}>✓</button>
              <div class="set-inputs-group">
                ${weightInput}
                <div class="set-input-pill">
                  <input type="text" inputmode="numeric" pattern="[0-9]*" class="set-input" placeholder="${prevReps}" 
                         value="${setReps}" ${disabledAttr} dir="ltr"
                         data-ex="${idx}" data-set="${s}" data-field="reps"
                         onchange="TodayPage.updateSetData(${idx}, ${s}, 'reps', this.value)">
                  <span class="set-unit">reps</span>
                </div>
              </div>
              <span class="set-label">${s + 1}</span>
            </div>
          `;
        }
        setsHTML += '</div>';
      }

      const gifPath = `images/gifs/${ex.name}.gif`;
      let videoBtn = '';
      if (!ex.name.toLowerCase().includes('walking')) {
        videoBtn = `<button type="button" class="exercise-video-btn" title="${I18n.t('view_gif_title')}" style="color: var(--danger);" onclick="UI.showImageModal('${ex.name.replace(/'/g, "\\'")}', '${gifPath}'); event.stopPropagation();">▶</button>`;
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
      const isWeightChanged = prevEx && ex.weight !== prevEx.weight && isWeighted(ex);

      const newBadgeHTML = isNewExercise ? `<div class="new-exercise-badge" style="position: absolute; bottom: 12px; left: 12px; background: #ef4444; color: white; padding: 4px 12px; border-radius: 6px; font-weight: 800; font-size: 13px; animation: blinkRed 1.5s infinite; box-shadow: 0 0 12px rgba(239, 68, 68, 0.8); z-index: 10;">${I18n.t('new_exercise_badge')}</div>` : '';

      // Detail line - only show weight if it exists
      const detailParts = [UI.getCategoryLabel(ex.slot)];
      if (ex.sets) {
        detailParts.push(isSetsChanged ? `<span class="alert-pulse-text" title="${I18n.t('sets_changed_title')}">${ex.sets}</span>` : ex.sets);
      }
      
      const equip = UI.getEquipment(ex.name);
      
      if (hasWeight) {
        let weightText = ex.weight;
        const bdiWeight = `<bdi dir="ltr">${weightText}</bdi>`;
        detailParts.push(isWeightChanged ? `<span class="alert-pulse-text" title="${I18n.t('weight_changed_title')}">${bdiWeight}</span>` : bdiWeight);
      }

      if (ex.tempo) {
        const formattedTempo = UI.formatTempo(ex.tempo);
        detailParts.push(`<span style="color: var(--accent-primary); font-weight: 600; background: rgba(59, 130, 246, 0.12); padding: 2px 8px; border-radius: 6px; border: 1px solid rgba(59, 130, 246, 0.25); display: inline-flex; align-items: center; gap: 4px;" title="${I18n.t('tempo_execution')}">⏱️ ${formattedTempo}</span>`);
      }

      if (ex.rest && ex.rest > 0) {
        detailParts.push(`<span style="color: var(--text-muted);">💤 ${ex.rest}s</span>`);
      }

      let cardioTimerBtn = '';
      const lowerExName = ex.name.toLowerCase();
      if (lowerExName.includes('vo2 max') || lowerExName.includes('norwegian')) {
        cardioTimerBtn = `<button type="button" class="btn-primary" style="padding: 4px 10px; font-size: 12px; margin-left: 6px;" onclick="event.stopPropagation(); TodayPage.startIntervalTimer('${ex.name.replace(/'/g, "\\'")}');">⏱️ ${I18n.t('timer_4x4')}</button>`;
      }

      return `
        <div class="exercise-card ${isCompleted ? 'completed' : ''} ${isNewExercise ? 'alert-pulse-card' : ''}" id="ex-card-${idx}" style="--glow-color: ${color};">
          <div class="exercise-hero-container" style="position: relative;">
            <div style="position: absolute; top: 12px; right: 12px; background: rgba(0,0,0,0.6); backdrop-filter: blur(4px); -webkit-backdrop-filter: blur(4px); color: white; padding: 4px 10px; border-radius: 8px; font-size: 14px; font-weight: 800; font-family: 'Inter', sans-serif; box-shadow: 0 2px 8px rgba(0,0,0,0.2); z-index: 10; border: 1px solid rgba(255,255,255,0.1);">
              #${idx + 1}
            </div>
            <img src="images/exercises/${ex.name.replace(/\//g, '-').toUpperCase()}.png" 
                 class="exercise-hero-image"
                 loading="eager" decoding="async"
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
              ${cardioTimerBtn}
              ${videoBtn}
              <button class="exercise-check ${isCompleted ? 'checked' : ''}" 
                      onclick="event.stopPropagation(); TodayPage.toggleExercise(${idx}, this)" ${disabledAttr}>✓</button>
            </div>
          </div>
          <div class="exercise-card-body">
            ${setsHTML}
            <div class="exercise-note">
              <textarea placeholder="${I18n.t('exercise_notes_placeholder')}" rows="2" ${disabledAttr}
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
        backupMessage = I18n.t('backup_first_time');
      }
    } else {
      const lastBackupDate = new Date(lastBackupStr);
      const now = new Date();
      const diffTime = Math.abs(now - lastBackupDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays >= 14) {
        needsBackupPrompt = true;
        backupMessage = I18n.t('backup_overdue', '', { days: diffDays });
      }
    }
    
    UI.showModal(I18n.t('celebration_title'), `
      <div style="text-align: center; padding: 16px;">
        <div class="celebration-confetti">🎊</div>
        <div style="font-size: 64px; margin-bottom: 16px; animation: bounceIn 0.6s ease;">💪</div>
        <h3 style="font-size: 22px; margin-bottom: 8px; color: var(--text-primary);">${I18n.t('celebration_subtitle')}</h3>
        <p style="color: var(--text-secondary); margin-bottom: 20px;">${typeInfo.label} — Day #${day.dayNum}</p>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 24px;">
          <div style="background: var(--bg-elevated); padding: 16px; border-radius: 12px;">
            <div style="font-size: 28px; font-weight: 800; color: var(--success);">${day.exercises.length}</div>
            <div style="font-size: 12px; color: var(--text-secondary);">${I18n.t('celebration_exercises')}</div>
          </div>
          <div style="background: var(--bg-elevated); padding: 16px; border-radius: 12px;">
            <div style="font-size: 28px; font-weight: 800; color: var(--accent-primary);">${totalSets}</div>
            <div style="font-size: 12px; color: var(--text-secondary);">${I18n.t('celebration_sets')}</div>
          </div>
          ${totalReps > 0 ? `
          <div style="background: var(--bg-elevated); padding: 16px; border-radius: 12px; grid-column: 1 / -1;">
            <div style="font-size: 28px; font-weight: 800; color: var(--warning);">${totalReps}</div>
            <div style="font-size: 12px; color: var(--text-secondary);">${I18n.t('celebration_reps_total')}</div>
          </div>` : ''}
        </div>
        
        ${needsBackupPrompt ? `
        <div style="margin-top: 16px; padding: 16px; border-radius: 12px; background: rgba(245, 158, 11, 0.1); border: 1px solid rgba(245, 158, 11, 0.2); margin-bottom: 16px;">
          <p style="font-size: 13px; color: var(--text-secondary); margin-bottom: 8px; direction: rtl; text-align: center;">⚠️ ${backupMessage}</p>
          <button id="celebration-backup-btn" class="btn-secondary" style="width: 100%; padding: 10px; font-size: 13px; display: flex; align-items: center; justify-content: center; gap: 6px;">
            ${I18n.t('celebration_backup')}
          </button>
        </div>` : ''}

        <button id="celebration-continue-btn" class="btn-primary" style="width: 100%; padding: 14px;">
          ${I18n.t('celebration_continue')}
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
    if (lowerName.includes('walking') || lowerName.includes('jogging')) {
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
      UI.toast(I18n.t('program_started'), 'success');
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
    UI.showModal(name, `<img src="${src}" loading="eager" decoding="async" style="width:100%; border-radius:8px;">`);
  }

  async function showSwapModal() {
    const currentDay = allPlanDays[currentDayIndex];
    const currentTypeInfo = UI.getDayTypeInfo(currentDay.dayType);
    
    // Find all other days in the same week
    const weekDays = allPlanDays.filter(d => d.week === currentDay.week);
    
    const validSwapTargets = [];
    for (const day of weekDays) {
      if (day.dayIndex === currentDayIndex) continue;
      
      // Check if it's already completed
      const track = await DB.getDayTracking(day.dayIndex);
      if (track && track.completed) continue;
      
      validSwapTargets.push(day);
    }
    
    if (validSwapTargets.length === 0) {
      UI.toast(I18n.t('swap_no_days'), 'warning');
      return;
    }
    
    let html = `<p style="margin-bottom: 12px; font-size: 14px; color: var(--text-secondary); line-height: 1.4;">
      ${I18n.t('swap_instructions', '', { dayType: `<b style="color: var(--text-primary);">${currentTypeInfo.label}</b>` })}
    </p>`;
    
    html += `<div style="display: flex; flex-direction: column; gap: 10px; margin-bottom: 16px;">`;
    
    validSwapTargets.forEach(targetDay => {
      const typeInfo = UI.getDayTypeInfo(targetDay.dayType);
      html += `
        <button class="btn-secondary" style="justify-content: flex-start; padding: 12px; background: var(--bg-elevated); border: 1px solid var(--border-light);" onclick="TodayPage.performSwap(${targetDay.dayIndex})">
          <div style="display: flex; flex-direction: column; align-items: flex-start;">
            <span style="font-weight: bold; color: var(--text-primary); margin-bottom: 4px;">${targetDay.dayOfWeek} - ${typeInfo.label}</span>
            <span style="font-size: 11px; color: var(--text-secondary);">${I18n.t('swap_with')} ${typeInfo.label}</span>
          </div>
        </button>
      `;
    });
    html += `</div>`;
    
    html += `
      <div style="background: rgba(245, 158, 11, 0.05); border: 1px solid rgba(245, 158, 11, 0.3); border-radius: 8px; padding: 12px; display: flex; align-items: flex-start; gap: 10px;">
        <span style="font-size: 16px; margin-top: 1px;">💡</span>
        <div style="font-size: 12px; color: var(--text-primary); line-height: 1.4;">
          <strong style="color: var(--warning); display: block; margin-bottom: 4px;">${I18n.t('swap_recovery_tip_title')}</strong>
          ${I18n.t('swap_recovery_tip_desc')}
        </div>
      </div>
    `;
    
    UI.showModal(I18n.t('swap_modal_title'), html);
  }

  async function performSwap(targetDayIndex) {
    UI.closeModal();
    try {
      await DB.swapWorkouts(currentDayIndex, targetDayIndex);
      allPlanDays = await DB.getAllPlan();
      UI.toast(I18n.t('swap_success'), 'success');
      
      if (typeof CalendarPage !== 'undefined' && document.getElementById('calendar-accordion-content')?.style.display === 'block') {
        CalendarPage.render();
      }
      
      render();
    } catch (e) {
      console.error(e);
      UI.toast(I18n.t('swap_error'), 'danger');
    }
  }

  let intervalTimerId = null;

  function startIntervalTimer(exName) {
    let currentRound = 1;
    let isWorkPhase = true; // true = 4m Work, false = 3m Rest
    let secondsLeft = 4 * 60;
    let isPaused = true;

    function renderModalContent() {
      const mins = Math.floor(secondsLeft / 60).toString().padStart(2, '0');
      const secs = (secondsLeft % 60).toString().padStart(2, '0');
      const statusText = isWorkPhase ? `🔴 ${I18n.t('vo2_round')} ${currentRound}/4 — ${I18n.t('vo2_effort')}` : `🟢 ${I18n.t('vo2_rest_phase')}`;
      const statusClass = isWorkPhase ? 'interval-status-work' : 'interval-status-rest';

      return `
        <div class="interval-timer-container">
          <div class="interval-status-badge ${statusClass}">
            ${statusText}
          </div>
          <div class="interval-ring-wrapper">
            <div class="interval-timer-time" id="interval-display">${mins}:${secs}</div>
          </div>
          <p style="font-size: 13px; color: var(--text-secondary); text-align: center;">
            ${isWorkPhase ? I18n.t('vo2_work_desc') : I18n.t('vo2_rest_desc')}
          </p>
          <div style="display: flex; gap: 10px; width: 100%; margin-top: 10px;">
            <button id="interval-toggle-btn" class="btn-primary" style="flex: 1;">${isPaused ? `▶️ ${I18n.t('vo2_start')}` : `⏸️ ${I18n.t('vo2_pause')}`}</button>
            <button id="interval-skip-btn" class="btn-secondary" style="flex: 1;">⏭️ ${I18n.t('vo2_skip')}</button>
          </div>
        </div>
      `;
    }

    UI.showModal('🏃 VO2 Max Norwegian 4×4', renderModalContent());

    function bindEvents() {
      const toggleBtn = document.getElementById('interval-toggle-btn');
      const skipBtn = document.getElementById('interval-skip-btn');
      
      if (toggleBtn) {
        toggleBtn.onclick = () => {
          isPaused = !isPaused;
          toggleBtn.textContent = isPaused ? `▶️ ${I18n.t('vo2_start')}` : `⏸️ ${I18n.t('vo2_pause')}`;
        };
      }
      
      if (skipBtn) {
        skipBtn.onclick = () => {
          advancePhase();
        };
      }
    }

    function advancePhase() {
      if (isWorkPhase) {
        if (currentRound >= 4) {
          clearInterval(intervalTimerId);
          UI.toast(I18n.t('vo2_complete'), 'success', 5000);
          UI.hideModal();
          return;
        }
        isWorkPhase = false;
        secondsLeft = 3 * 60;
        UI.toast(`🟢 ${I18n.t('vo2_switching_rest')} (${I18n.t('vo2_round')} ${currentRound})`, 'info');
      } else {
        currentRound++;
        isWorkPhase = true;
        secondsLeft = 4 * 60;
        UI.toast(`🔴 ${I18n.t('vo2_round')} ${currentRound}/4 — ${I18n.t('vo2_effort')}`, 'warning');
      }
      document.getElementById('modal-body').innerHTML = renderModalContent();
      bindEvents();
    }

    if (intervalTimerId) clearInterval(intervalTimerId);

    intervalTimerId = setInterval(() => {
      if (!isPaused && secondsLeft > 0) {
        secondsLeft--;
        const display = document.getElementById('interval-display');
        if (display) {
          const mins = Math.floor(secondsLeft / 60).toString().padStart(2, '0');
          const secs = (secondsLeft % 60).toString().padStart(2, '0');
          display.textContent = `${mins}:${secs}`;
        }
      } else if (!isPaused && secondsLeft <= 0) {
        if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
        advancePhase();
      }
    }, 1000);

    bindEvents();
  }

  return {
    init,
    render,
    renderNutritionSection: (dateStr) => renderNutritionSectionRef ? renderNutritionSectionRef(dateStr) : Promise.resolve(),
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
    performSwap,
    startIntervalTimer,
    getCurrentDayIndex: () => currentDayIndex
  };
})();

// Expose to window for inline event handlers
window.TodayPage = TodayPage;

