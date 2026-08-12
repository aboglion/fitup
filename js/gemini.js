/**
 * Gemini Service Module
 * Handles direct integration with Google Gemini AI API for vision food analysis and model management.
 */
const GeminiService = (() => {
  const DEFAULT_MODEL = 'gemini-3.1-flash-lite';
  
  const AVAILABLE_MODELS = [
    { id: 'gemini-3.1-flash-lite', name: 'Gemini 3.1 Flash Lite (Recommended)' },
    { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash' },
    { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro (Deep & Detailed)' },
    { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash' }
  ];

  /**
   * Get configured API key
   */
  async function getApiKey() {
    return await DB.getSetting('geminiApiKey');
  }

  /**
   * Save API key
   */
  async function setApiKey(key) {
    const cleaned = String(key || '').trim();
    await DB.setSetting('geminiApiKey', cleaned);
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

    const systemPrompt = `You are a professional sports nutritionist and encouraging RPG AI system.
Your job is to analyze the attached meal photo and estimate its nutritional values.

${langPrompt}

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
    populateSelect,
    initSelects
  };
})();

window.GeminiService = GeminiService;
