/**
 * Gemini Service Module
 * Handles direct integration with Google Gemini AI API for vision food analysis and model management.
 * API keys are encrypted at rest using AES-256-GCM via the Crypto module.
 */
const GeminiService = (() => {
  const DEFAULT_MODEL = 'gemini-3.1-flash-lite';
  const ENC_PREFIX = 'ENC:';
  
  const AVAILABLE_MODELS = [
    { id: 'gemini-3.1-flash-lite', name: 'Gemini 3.1 Flash Lite (Recommended)' },
    { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash' },
    { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro (Deep & Detailed)' },
    { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash' }
  ];

  /**
   * Get the encryption password derived from the Google User ID.
   * Returns null if no Google profile is available.
   */
  async function getEncryptionPassword() {
    if (typeof CloudSync === 'undefined') return null;
    const profile = await CloudSync.getUserProfile();
    // Use Google's stable user ID (sub) as the encryption key
    if (profile && profile.sub) return 'fitup_key_' + profile.sub;
    // Fallback: use email if sub is missing
    if (profile && profile.email) return 'fitup_key_' + profile.email;
    return null;
  }

  /**
   * Get configured API key (decrypted)
   */
  async function getApiKey() {
    const stored = await DB.getSetting('geminiApiKey');
    if (!stored) return null;

    // Check if encrypted
    if (stored.startsWith(ENC_PREFIX)) {
      const password = await getEncryptionPassword();
      if (!password) {
        console.warn('Cannot decrypt API key: no Google profile available');
        return null;
      }
      const encData = stored.slice(ENC_PREFIX.length);
      const decrypted = await Crypto.decrypt(encData, password);
      if (!decrypted) {
        console.warn('API key decryption failed (wrong account or corrupted data)');
        return null;
      }
      return decrypted;
    }

    // Legacy: plain-text key found → auto-migrate to encrypted form
    const password = await getEncryptionPassword();
    if (password && typeof Crypto !== 'undefined') {
      const encrypted = await Crypto.encrypt(stored, password);
      if (encrypted) {
        await DB.setSetting('geminiApiKey', ENC_PREFIX + encrypted);
        console.log('API key auto-migrated to encrypted storage');
      }
    }
    return stored;
  }

  /**
   * Save API key (encrypted)
   */
  async function setApiKey(key) {
    const cleaned = String(key || '').trim();
    if (!cleaned) {
      await DB.setSetting('geminiApiKey', '');
      return '';
    }

    // Encrypt if possible
    const password = await getEncryptionPassword();
    if (password && typeof Crypto !== 'undefined') {
      const encrypted = await Crypto.encrypt(cleaned, password);
      if (encrypted) {
        await DB.setSetting('geminiApiKey', ENC_PREFIX + encrypted);
      } else {
        // Encryption failed, store plain (shouldn't happen)
        console.warn('Encryption failed, storing API key as plain text');
        await DB.setSetting('geminiApiKey', cleaned);
      }
    } else {
      // No Google profile yet, store plain text (will be migrated on next read after login)
      await DB.setSetting('geminiApiKey', cleaned);
    }

    // Sync API key to cloud for cross-device availability
    if (typeof CloudSync !== 'undefined' && CloudSync.scheduleSync) CloudSync.scheduleSync();
    return cleaned;
  }

  /**
   * Remove API key and clear saved model
   */
  async function removeApiKey() {
    await DB.setSetting('geminiApiKey', '');
    await DB.setSetting('geminiModel', '');
    if (typeof CloudSync !== 'undefined' && CloudSync.scheduleSync) CloudSync.scheduleSync();
  }

  /**
   * Get configured model (or default)
   */
  async function getModel() {
    const saved = await DB.getSetting('geminiModel');
    return saved || DEFAULT_MODEL;
  }

  /**
   * Save model choice
   */
  async function setModel(modelId) {
    const cleaned = String(modelId || DEFAULT_MODEL).trim();
    await DB.setSetting('geminiModel', cleaned);
    // Sync model choice to cloud for cross-device consistency
    if (typeof CloudSync !== 'undefined' && CloudSync.scheduleSync) CloudSync.scheduleSync();
    return cleaned;
  }

  /**
   * Check if Gemini API key is configured
   */
  async function isConfigured() {
    const key = await getApiKey();
    return Boolean(key && key.length > 5);
  }

  /**
   * Dynamically query Google Gemini API for currently available models.
   * Keeps model list updated even if Google deprecates or changes version numbers.
   * @param {string} apiKey 
   * @returns {Promise<Array<{id: string, name: string}>>}
   */
  async function discoverAvailableModels(apiKey) {
    const key = apiKey || await getApiKey();
    if (!key) return AVAILABLE_MODELS;

    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(key)}`;
      const res = await fetch(url);
      if (!res.ok) return AVAILABLE_MODELS;

      const data = await res.json();
      if (!data.models || !Array.isArray(data.models)) return AVAILABLE_MODELS;

      // Filter generateContent models suitable for vision/multimodal text
      const validModels = data.models
        .filter(m => m.supportedGenerationMethods && m.supportedGenerationMethods.includes('generateContent'))
        .map(m => m.name.replace(/^models\//, ''))
        .filter(id => id.startsWith('gemini-') && !id.includes('embedding') && !id.includes('aqa') && !id.includes('imagen') && !id.includes('tts') && !id.includes('bison'));

      if (validModels.length === 0) return AVAILABLE_MODELS;

      // Sort models: Flash Lite / Flash first (most cost-effective & fast), then Pro, higher version numbers top
      validModels.sort((a, b) => {
        const getScore = (id) => {
          let score = 0;
          if (id.includes('flash-lite')) score += 1000;
          else if (id.includes('flash')) score += 800;
          else if (id.includes('pro')) score += 500;
          
          const verMatch = id.match(/\d+(\.\d+)?/);
          if (verMatch) score += parseFloat(verMatch[0]) * 100;
          return score;
        };
        return getScore(b) - getScore(a);
      });

      const updatedModels = validModels.map(id => {
        let label = id;
        if (id.includes('3.1-flash-lite')) label = 'Gemini 3.1 Flash Lite (Recommended - Fast & Free)';
        else if (id.includes('flash-lite')) label = `${id} (Flash Lite - Free Tier)`;
        else if (id.includes('flash')) label = `${id} (Flash - Fast)`;
        else if (id.includes('pro')) label = `${id} (Pro - Detailed)`;
        return { id, name: label };
      });

      // Update in-memory AVAILABLE_MODELS registry
      AVAILABLE_MODELS.length = 0;
      AVAILABLE_MODELS.push(...updatedModels);

      // Refresh any UI dropdown selects in DOM
      initSelects();

      return AVAILABLE_MODELS;
    } catch (err) {
      console.warn('Could not fetch dynamic models list from Google API:', err);
      return AVAILABLE_MODELS;
    }
  }

  /**
   * Test API key validity with dynamic model fallback
   */
  async function testApiKey(key, modelId = DEFAULT_MODEL) {
    const apiKey = key || await getApiKey();
    if (!apiKey) throw new Error(I18n.t('enter_api_key'));

    // Attempt to refresh available models list dynamically first
    let candidateModels = [modelId, DEFAULT_MODEL, 'gemini-3.1-flash-lite', 'gemini-3.0-flash', 'gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'];
    try {
      const dynamic = await discoverAvailableModels(apiKey);
      if (dynamic && dynamic.length > 0) {
        candidateModels = Array.from(new Set([modelId, ...dynamic.map(m => m.id), ...candidateModels]));
      }
    } catch (e) {
      console.warn('API test dynamic discovery fallback:', e);
    }

    let lastError = null;
    let verifiedModel = null;

    for (const candidate of candidateModels) {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(candidate)}:generateContent?key=${encodeURIComponent(apiKey)}`;
      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ role: 'user', parts: [{ text: 'Valid config! Reply in one word: OK' }] }]
          })
        });

        if (response.ok) {
          verifiedModel = candidate;
          if (verifiedModel !== modelId) {
            console.log(`Model ${modelId} unavailable. Auto-selected working model: ${verifiedModel}`);
            await setModel(verifiedModel);
            if (typeof UI !== 'undefined' && UI.toast && window.I18n) {
              UI.toast(I18n.t('model_auto_updated', { model: verifiedModel }), 'info');
            }
          }
          return { success: true, model: verifiedModel };
        }

        const errJson = await response.json().catch(() => ({}));
        lastError = errJson.error?.message || `HTTP ${response.status}: Invalid API key`;

        // If error is authentication/quota (401/403/429), stop looping models immediately
        if (response.status === 401 || response.status === 403 || response.status === 429) {
          throw new Error(lastError);
        }
      } catch (err) {
        if (err.message && (err.message.includes('API key') || err.message.includes('quota'))) {
          throw err;
        }
        lastError = err.message;
      }
    }

    throw new Error(lastError || 'Invalid API key or model unavailable');
  }

  /**
   * Analyze food image with Gemini AI Vision using strict upper-bound estimation
   * @param {string} base64Image - Base64 encoded image string (with or without data URI header)
   * @param {string} mimeType - e.g. 'image/jpeg' or 'image/png'
   * @param {string} userNotes - optional user comments about the meal
   */
  async function analyzeFood(base64Image, mimeType = 'image/jpeg', userNotes = '') {
    const apiKey = await getApiKey();
    if (!apiKey) {
      throw new Error(I18n.t('gemini_key_not_set'));
    }

    const model = await getModel();

    // Ensure raw base64 without prefix
    let rawBase64 = base64Image;
    if (base64Image.includes(',')) {
      const parts = base64Image.split(',');
      rawBase64 = parts[1];
      const match = parts[0].match(/:(.*?);/);
      if (match) mimeType = match[1];
    }

    const currentLang = window.I18n ? window.I18n.getLang() : 'en';
    const langInstructions = {
      en: "CRITICAL LANGUAGE INSTRUCTION: Respond EXCLUSIVELY in English. Provide all meal names, analysis insights, and confidence values in English.",
      he: "דגש שפה קריטי: החזר את כל התשובה, שם המנה, והתובנות התזונתית בעברית בלבד.",
      ar: "ملاحظة حاسمة للغة: قم بالرد باللغة العربية فقط. قدم اسم الوجبة، والتحليل الغذائي باللغة العربية."
    };
    const langPrompt = langInstructions[currentLang] || langInstructions['en'];

    let fitContext = '';
    if (window.GoogleFitService) {
      try {
        const fitData = await window.GoogleFitService.fetchDailyFitData();
        if (fitData && (fitData.steps > 0 || fitData.calories > 0 || fitData.heartPoints > 0)) {
          fitContext = `\nUser's Today Activity Context (Google Fit Live Metrics):
- Daily Steps: ${fitData.steps.toLocaleString()}
- Active Expended Calories: ${fitData.calories} kcal
- Heart Exertion Points: ${fitData.heartPoints}
- Avg Heart Rate: ${fitData.avgHeartRate > 0 ? fitData.avgHeartRate + ' bpm' : 'N/A'}
Instructions for AI Analysis insight: Consider the user's live physical activity level when writing your 2-3 sentence nutritional insight (e.g. tailor recovery recommendations if steps/calories burned are high).`;
        }
      } catch (err) {
        console.warn('Could not fetch Google Fit data for AI prompt context:', err);
      }
    }

    const systemPrompt = `You are an elite sports nutritionist and rigorous calorie tracking system.
Your goal is to analyze the attached meal photo and provide a STRICT, UPPER-BOUND (WORST-CASE) nutritional estimate.

${langPrompt}
${fitContext}

CRITICAL ESTIMATION RULES (STRICT UPPER-BOUND / CONSERVATIVE CALORIE COUNTING):
1. ALWAYS ESTIMATE AT THE HIGH END / UPPER BOUND of reasonable calorie, protein, carb, and fat ranges. NEVER UNDERESTIMATE OR BE FORGIVING.
2. ACCOUNT FOR HIDDEN FATS & OILS: Factor in cooking oils, butter, salad dressings, heavy sauces, and frying fats that are not visually obvious (+100 to +250 kcal margin for added fats/oils).
3. PORTION SIZING: Assume generous upper-limit portion sizes unless notes specify otherwise.
4. IN THE ANALYSIS TEXT: Briefly explain the high-end estimation logic in 2-3 professional sentences (mentioning hidden oils, portion upper bounds, or food density factors).

User Notes (if provided): "${userNotes}"

Return ONLY a valid JSON object matching this schema (NO Markdown formatting, NO surrounding text):
{
  "meal_name": "Short accurate name of meal",
  "calories": 650,
  "protein": 42,
  "carbs": 55,
  "fat": 25,
  "analysis": "Short upper-bound analysis explaining calorie & macro choices (2-3 sentences)",
  "confidence": "high/medium/low"
}`;

    const parts = [
      { text: systemPrompt }
    ];

    if (rawBase64) {
      parts.push({
        inlineData: {
          mimeType: mimeType || 'image/jpeg',
          data: rawBase64
        }
      });
    }

    if (userNotes) {
      parts.push({ text: `User notes about the meal: ${userNotes}` });
    }

    const payload = {
      contents: [{
        role: 'user',
        parts: parts
      }],
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 800
      }
    };

    // Dynamically compile candidate fallback list starting with selected model & dynamic API discovery
    let fallbackList = [model, DEFAULT_MODEL, 'gemini-3.1-flash-lite', 'gemini-3.0-flash', 'gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'];
    try {
      const dynamicModels = await discoverAvailableModels(apiKey);
      if (dynamicModels && dynamicModels.length > 0) {
        fallbackList = Array.from(new Set([model, ...dynamicModels.map(m => m.id), ...fallbackList]));
      }
    } catch (e) {
      console.warn('Dynamic model discovery fallback error:', e);
    }

    let response;
    let successfulModel = model;

    for (const modelCandidate of fallbackList) {
      const candidateUrl = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(modelCandidate)}:generateContent?key=${encodeURIComponent(apiKey)}`;
      try {
        response = await fetch(candidateUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (response.ok) {
          successfulModel = modelCandidate;
          if (successfulModel !== model) {
            console.warn(`Model ${model} was unavailable (deprecated/blocked). Auto-switched to working model ${successfulModel}.`);
            await setModel(successfulModel);
            if (typeof UI !== 'undefined' && UI.toast && window.I18n) {
              UI.toast(I18n.t('model_auto_updated', { model: successfulModel }), 'info');
            }
          }
          break;
        }

        // If error is 404 or 400 (invalid model / deprecated model), continue loop to find active working model
        if (response.status === 404 || response.status === 400) {
          continue;
        } else {
          // Other errors (401 invalid key, 429 quota) shouldn't cycle models
          break;
        }
      } catch (err) {
        console.warn(`Model candidate ${modelCandidate} failed:`, err);
      }
    }

    if (!response || !response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error?.message || `Gemini communication error (HTTP ${response ? response.status : 'ERR'})`);
    }

    const result = await response.json();
    const candidateText = result.candidates?.[0]?.content?.parts?.map(p => p.text).join('') || '';

    if (!candidateText) {
      throw new Error(I18n.t('gemini_no_response'));
    }

    // Extract JSON block
    try {
      const jsonMatch = candidateText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          meal_name: parsed.meal_name || I18n.t('unnamed_meal'),
          calories: Math.round(Number(parsed.calories || 0)),
          protein: Math.round(Number(parsed.protein || 0)),
          carbs: Math.round(Number(parsed.carbs || 0)),
          fat: Math.round(Number(parsed.fat || 0)),
          analysis: parsed.analysis || I18n.t('meal_logged_success'),
          confidence: parsed.confidence || 'medium'
        };
      }
    } catch (e) {
      console.warn('Could not parse JSON directly from Gemini, fallback to text response', e);
    }

    return {
      meal_name: I18n.t('ai_meal_name'),
      calories: 400,
      protein: 25,
      carbs: 40,
      fat: 10,
      analysis: candidateText.replace(/[\{\}]/g, '').trim()
    };
  }

  /**
   * Get personalized AI daily nutrition & activity advice based on Google Fit & workout progress
   */
  async function getDailyAdvice(totals = {}, goals = {}, workoutContext = {}) {
    const apiKey = await getApiKey();
    if (!apiKey) return null;

    const model = await getModel();
    let fitDataText = 'No Google Fit metrics recorded today';

    if (window.GoogleFitService) {
      try {
        const fitData = await window.GoogleFitService.fetchDailyFitData();
        if (fitData && (fitData.steps > 0 || fitData.calories > 0 || fitData.heartPoints > 0)) {
          fitDataText = `Steps: ${fitData.steps.toLocaleString()}, Active Calories Expended: ${fitData.calories} kcal, Heart Points: ${fitData.heartPoints}`;
        }
      } catch (e) {
        console.warn('Google Fit context fetch error:', e);
      }
    }

    let workoutText = 'No workout logged today yet';
    if (workoutContext && workoutContext.burnedCals > 0) {
      workoutText = `${workoutContext.dayType || 'Workout'}: ${workoutContext.completedSets} sets completed, total volume ${workoutContext.volumeKg || 0}kg, estimated burn ${workoutContext.burnedCals} kcal`;
    }

    const currentLang = window.I18n ? window.I18n.getLang() : 'en';
    const langInstructions = {
      en: "Respond EXCLUSIVELY in English in 2 crisp encouraging sentences.",
      he: "החזר תשובה בעברית בלבד בתור 2 משפטים קצרים, מקצועיים ומעודדים.",
      ar: "قدم الرد باللغة العربية فقط في جملتين قصيرتين ومشجعتين."
    };
    const langPrompt = langInstructions[currentLang] || langInstructions['en'];

    const prompt = `You are an elite AI sports nutritionist. Analyze the user's daily metrics:
- Activity Context (Google Fit): ${fitDataText}
- Today's Completed Workout: ${workoutText}
- Nutrition Consumed: ${totals.calories || 0}/${goals.calories || 1980} kcal, ${totals.protein || 0}/${goals.protein || 160}g Protein.
- Net Calories (Consumed - Workout Burn): ${(totals.calories || 0) - (workoutContext.burnedCals || 0)} kcal.
${langPrompt}
Give a personalized 2-sentence tactical recommendation for optimal recovery, muscle synthesis, and remaining net calorie/protein targets.`;

    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.5, maxOutputTokens: 250 }
        })
      });

      if (!res.ok) return null;
      const data = await res.json();
      return data.candidates?.[0]?.content?.parts?.map(p => p.text).join('').trim() || null;
    } catch (e) {
      console.warn('AI Daily Advice fetch error:', e);
      return null;
    }
  }

  /**
   * Get personalized AI Smart Daily Briefing synthesizing streak, recent performance, today's workout targets, and recovery.
   */
  async function getDailySmartBriefing(historyContext = {}, todayContext = {}, fitContext = {}) {
    const apiKey = await getApiKey();
    const model = await getModel();

    const currentLang = window.I18n ? window.I18n.getLang() : 'en';
    const langInstructions = {
      en: "Respond EXCLUSIVELY in English. Use clear, professional, ultra-motivating tone.",
      he: "החזר תשובה בעברית בלבד. השתמש בטון מקצועי, מעצים, ומדויק.",
      ar: "قدم الرد باللغة العربية فقط. استخدم نبرة احترافية ومشجعة للغاية."
    };
    const langPrompt = langInstructions[currentLang] || langInstructions['en'];

    const prompt = `You are FitUp's AI Master Performance Coach. Generate a sharp, highly motivating 3-bullet Daily Tactical Briefing for the user.

${langPrompt}

USER CONTEXT DATA:
1. Training History & Momentum:
   - Current Streak: ${historyContext.streak || 0} days
   - Total Days Completed: ${historyContext.completedDays || 0} / 546
   - Recent Average RPE: ${historyContext.avgRPE || 'N/A'}
   - Body Weight: ${historyContext.bodyWeight ? historyContext.bodyWeight + ' kg' : 'N/A'}

2. Today's Workout Mission:
   - Program Day Title: ${todayContext.title || 'Day ' + (todayContext.dayNum || 1)}
   - Session Type: ${todayContext.dayType || 'Strength'}
   - Target Muscles: ${todayContext.muscles || 'Full Body'}
   - Planned Volume: ${todayContext.exerciseCount || 0} exercises (${todayContext.totalSets || 0} sets total)
   - Planned Target RPE: ${todayContext.plannedRPE || '8'}
   - Required Dumbbell Weights & Equipment: ${todayContext.equipment || 'Standard'}

3. Activity & Fitness (Google Fit):
   - Steps: ${fitContext.steps ? fitContext.steps.toLocaleString() : 'N/A'}
   - Expended Calories: ${fitContext.calories ? fitContext.calories + ' kcal' : 'N/A'}
   - Heart Points: ${fitContext.heartPoints || 0}

INSTRUCTIONS:
Provide a 3-bullet structured response with exact emojis matching this structure:
🏆 **[Momentum & Recovery]**: (1 energetic sentence acknowledging streak, past performance & physical readiness)
🎯 **[Today's Mission]**: (1 crisp sentence summarizing today's workout focus, key exercises, weights/equipment needed, and target intensity)
💡 **[Tactical Key]**: (1 actionable pro tip regarding execution tempo, rest timer adherence, or nutrition/protein target)

Keep total response concise, professional, and powerful!`;

    if (!apiKey) return null;

    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.4, maxOutputTokens: 350 }
        })
      });

      if (!res.ok) return null;
      const data = await res.json();
      return data.candidates?.[0]?.content?.parts?.map(p => p.text).join('').trim() || null;
    } catch (e) {
      console.warn('AI Daily Smart Briefing fetch error:', e);
      return null;
    }
  }

  function populateSelect(selectEl) {
    if (!selectEl) return;
    const currentVal = selectEl.value;
    selectEl.innerHTML = AVAILABLE_MODELS.map(m => 
      `<option value="${m.id}">${m.name}</option>`
    ).join('');
    if (currentVal && AVAILABLE_MODELS.some(m => m.id === currentVal)) {
      selectEl.value = currentVal;
    }
  }

  function initSelects() {
    populateSelect(document.getElementById('gemini-model-select'));
    populateSelect(document.getElementById('settings-gemini-model'));
  }

  return {
    DEFAULT_MODEL,
    AVAILABLE_MODELS,
    getApiKey,
    setApiKey,
    removeApiKey,
    getModel,
    setModel,
    isConfigured,
    testApiKey,
    discoverAvailableModels,
    analyzeFood,
    getDailyAdvice,
    getDailySmartBriefing,
    populateSelect,
    initSelects
  };
})();

window.GeminiService = GeminiService;

