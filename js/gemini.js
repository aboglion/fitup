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
   * Test API key validity
   */
  async function testApiKey(key, modelId = DEFAULT_MODEL) {
    const apiKey = key || await getApiKey();
    if (!apiKey) throw new Error(I18n.t('enter_api_key'));

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(modelId)}:generateContent?key=${encodeURIComponent(apiKey)}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: 'Valid config! Reply in one word: OK' }] }]
      })
    });

    if (!response.ok) {
      const errJson = await response.json().catch(() => ({}));
      throw new Error(errJson.error?.message || `HTTP ${response.status}: Invalid API key`);
    }

    return true;
  }

  /**
   * Analyze food image with Gemini AI Vision
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
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;

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

    const systemPrompt = `You are a professional sports nutritionist and encouraging RPG AI system.
Your job is to analyze the attached meal photo and estimate its nutritional values.

${langPrompt}
${fitContext}

CRITICAL ESTIMATION RULE (Worst-case / Strict estimation):
- Calculate calories and fat conservatively at the upper end of reasonable estimate range.
- Account for hidden uncounted ingredients (cooking oil, butter, dressings, sauces).

User Notes (if provided): "${userNotes}"

Return ONLY a valid JSON object matching this schema (NO Markdown formatting, NO surrounding text):
{
  "meal_name": "Short accurate name of meal",
  "calories": 550,
  "protein": 42,
  "carbs": 50,
  "fat": 12,
  "analysis": "Short professional nutritional insight (2-3 sentences)",
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
        temperature: 0.4,
        maxOutputTokens: 800
      }
    };

    const fallbackList = Array.from(new Set([model, DEFAULT_MODEL, 'gemini-2.5-flash', 'gemini-2.0-flash']));
    let response;
    let successfulModel = model;

    for (const modelCandidate of fallbackList) {
      const candidateUrl = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(modelCandidate)}:generateContent?key=${encodeURIComponent(apiKey)}`;
      response = await fetch(candidateUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        successfulModel = modelCandidate;
        if (successfulModel !== model) {
          console.warn(`Model ${model} was unavailable (404/deprecated). Automatically switched to ${successfulModel}.`);
          await setModel(successfulModel);
        }
        break;
      }

      // If error is not 404, break early (e.g. invalid API key or quota exceeded)
      if (response.status !== 404) {
        break;
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
  async function getDailyAdvice(totals = {}, goals = {}) {
    const apiKey = await getApiKey();
    if (!apiKey) return null;

    const model = await getModel();
    let fitDataText = 'אין מדדי Google Fit שנרשמו היום';

    if (window.GoogleFitService) {
      try {
        const fitData = await window.GoogleFitService.fetchDailyFitData();
        if (fitData && (fitData.steps > 0 || fitData.calories > 0 || fitData.heartPoints > 0)) {
          fitDataText = `צעדים: ${fitData.steps.toLocaleString()}, קלוריות שנשרפו במאמץ: ${fitData.calories} kcal, נקודות לב: ${fitData.heartPoints}`;
        }
      } catch (e) {
        console.warn('Google Fit context fetch error:', e);
      }
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
- Today's Nutrition Consumed: ${totals.calories || 0}/${goals.calories || 2000} kcal, ${totals.protein || 0}/${goals.protein || 140}g Protein.
${langPrompt}
Give a personalized 2-sentence tactical recommendation for optimal recovery and remaining calorie/protein targets.`;

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
    analyzeFood,
    getDailyAdvice,
    populateSelect,
    initSelects
  };
})();

window.GeminiService = GeminiService;

