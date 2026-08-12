/**
 * Gemini Service Module
 * Handles direct integration with Google Gemini AI API for vision food analysis and model management.
 */
const GeminiService = (() => {
  const DEFAULT_MODEL = 'gemini-3.1-flash-lite';
  
  const AVAILABLE_MODELS = [
    { id: 'gemini-3.1-flash-lite', name: 'Gemini 3.1 Flash Lite (מומלץ - מהיר וקל)' },
    { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash' },
    { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro (עמוק ומפורט)' },
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
    if (!apiKey) throw new Error('נא להזין מפתח API');

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(modelId)}:generateContent?key=${encodeURIComponent(apiKey)}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: 'הגדרה תקינה! ענה במילה אחת: OK' }] }]
      })
    });

    if (!response.ok) {
      const errJson = await response.json().catch(() => ({}));
      throw new Error(errJson.error?.message || `HTTP ${response.status}: מפתח API לא תקין`);
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
      throw new Error('מפתח Gemini API אינו מוגדר. נא להגדיר מפתח בהגדרות התזונה.');
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

    const systemPrompt = `אתה תזונאי ספורט מקצועי ומערכת AI בסגנון RPG מעודדת וחדה.
תפקידך לנתח את תמונת האוכל המצורפת ולהעריך בזהירות אך בדיוק רב את הערכים התזונתיים של המנה.

אם המשתמש הוסיף הערות: "${userNotes}", התחשב בהן בחישוב.

החזר בתשובה בלבד JSON תקין בפורמט הבא (ללא Markdown וללא טקסט נוסף מחוץ ל-JSON):
{
  "meal_name": "שם קצר ומדויק של הארוחה (למשל: חזה עוף בתוספת אורז וירקות)",
  "calories": 550,
  "protein": 42,
  "carbs": 50,
  "fat": 12,
  "analysis": "תובנה תזונתית קצרה, מקצועית ומדרבנת (2-3 משפטים בעברית)",
  "confidence": "גבוהה/בינונית"
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
      parts.push({ text: `הערות המשתמש על המנה: ${userNotes}` });
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
      throw new Error(err.error?.message || `שגיאת תקשורת מול Gemini (HTTP ${response ? response.status : 'ERR'})`);
    }

    const result = await response.json();
    const candidateText = result.candidates?.[0]?.content?.parts?.map(p => p.text).join('') || '';

    if (!candidateText) {
      throw new Error('Gemini לא החזיר תשובה. נסה לצלם שוב בבהירות.');
    }

    // Extract JSON block
    try {
      const jsonMatch = candidateText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          meal_name: parsed.meal_name || 'ארוחה ללא שם',
          calories: Math.round(Number(parsed.calories || 0)),
          protein: Math.round(Number(parsed.protein || 0)),
          carbs: Math.round(Number(parsed.carbs || 0)),
          fat: Math.round(Number(parsed.fat || 0)),
          analysis: parsed.analysis || 'הארוחה הוקלדה בהצלחה.',
          confidence: parsed.confidence || 'בינונית'
        };
      }
    } catch (e) {
      console.warn('Could not parse JSON directly from Gemini, fallback to text response', e);
    }

    return {
      meal_name: 'ארוחת AI',
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
