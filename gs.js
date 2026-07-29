
// ============================================================
// 1. הגדרות
// ============================================================
function debugFitSources() {
  Logger.log("steps: " + JSON.stringify(fetchGoogleFitSteps()));
  Logger.log("sleep: " + JSON.stringify(fetchGoogleFitSleep()));
  Logger.log("heartRate: " + JSON.stringify(fetchGoogleFitHeartRate24h()));
  Logger.log("heartPoints: " + JSON.stringify(fetchGoogleFitHeartPoints24h()));
  Logger.log("energy: " + JSON.stringify(fetchGoogleFitEnergyExpended24h()));
}

function getConfig() {
  const config = {
    telegramToken: String(TELEGRAM_BOT_TOKEN || "").trim(),
    geminiKey: String(GEMINI_API_KEY || "").trim(),
    filename: String(FILENAME || "fitup-data.json").trim(),
    webAppUrl: String(WEB_APP_URL || "").trim(),
    allowedChatId: String(ALLOWED_CHAT_ID || "").trim()
  };

  if (!config.telegramToken) {
    throw new Error("TELEGRAM_BOT_TOKEN חסר");
  }

  if (!config.geminiKey) {
    throw new Error("GEMINI_API_KEY חסר");
  }

  return config;
}


// ============================================================
// 2. כניסת Web App
// ============================================================

function doPost(e) {
  try {
    const raw = e && e.postData ? e.postData.contents : "";
    const data = raw ? JSON.parse(raw) : {};

    if (data && data.update_id !== undefined) {
      handleTelegramWebhook(data);
    } else {
      handleFitUpSync(data);
    }

    return HtmlService.createHtmlOutput("OK");

  } catch (error) {
    console.error("doPost error:", error);
    return HtmlService.createHtmlOutput("OK");
  }
}

function doGet(e) {
  return ContentService.createTextOutput(
    JSON.stringify(getFitUpData() || {})
  ).setMimeType(ContentService.MimeType.JSON);
}



// ============================================================
// 3. סנכרון נתוני FitUp
// ============================================================

function handleFitUpSync(incomingData) {
  const lock = LockService.getScriptLock();

  try {
    lock.waitLock(15000);

    const existingData = getFitUpDataNoLock() || {};
    const mergedData = mergeFitUpData(
      existingData,
      incomingData || {}
    );

    saveFitUpDataNoLock(mergedData);

    return ContentService
      .createTextOutput(JSON.stringify({
        status: "success",
        data: mergedData
      }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    console.error("FitUp sync error:", error);

    return ContentService
      .createTextOutput(JSON.stringify({
        error: String(error.message || error)
      }))
      .setMimeType(ContentService.MimeType.JSON);

  } finally {
    try {
      lock.releaseLock();
    } catch (ignore) {}
  }
}

function mergeFitUpData(existingData, incomingData) {
  const result = existingData || {};

  if (incomingData.tracking) {
    result.tracking = incomingData.tracking;
  }

  if (incomingData.settings) {
    result.settings = incomingData.settings;
  }

  if (incomingData.photos) {
    result.photos = incomingData.photos;
  }

  if (incomingData.plan) {
    result.plan = incomingData.plan;
  }

  if (incomingData.nutrition) {
    if (!result.nutrition) {
      result.nutrition = {};
    }

    Object.keys(incomingData.nutrition).forEach(function(date) {
      const incomingDay = normalizeNutritionDay(
        incomingData.nutrition[date]
      );

      if (!result.nutrition[date]) {
        result.nutrition[date] = incomingDay;
        return;
      }

      result.nutrition[date] = mergeNutritionDay(
        normalizeNutritionDay(result.nutrition[date]),
        incomingDay
      );
    });
  }

  return result;
}

function normalizeNutritionDay(day) {
  const result = day || {};

  if (
    typeof result.calories === "number" ||
    typeof result.protein === "number"
  ) {
    const oldCalories = Number(result.calories || 0);
    const oldProtein = Number(result.protein || 0);
    const oldSupplements = Array.isArray(result.supplements)
      ? result.supplements
      : [];

    result.meals = Array.isArray(result.meals)
      ? result.meals
      : [];

    if (oldCalories > 0 || oldProtein > 0) {
      result.meals.push({
        id: "legacy_" + new Date().getTime(),
        name: "דיווחים קודמים",
        calories: oldCalories,
        protein: oldProtein,
        time: "00:00",
        bonus: {}
      });
    }

    result.supplements_taken = oldSupplements;

    delete result.calories;
    delete result.protein;
    delete result.supplements;
  }

  if (!Array.isArray(result.meals)) {
    result.meals = [];
  }

  if (!Array.isArray(result.supplements_taken)) {
    result.supplements_taken = [];
  }

  if (!Array.isArray(result.deleted_meals)) {
    result.deleted_meals = [];
  }

  return result;
}

function mergeNutritionDay(existingDay, incomingDay) {
  const existing = normalizeNutritionDay(existingDay);
  const incoming = normalizeNutritionDay(incomingDay);

  const deletedIds = {};

  existing.deleted_meals.forEach(function(id) {
    deletedIds[String(id)] = true;
  });

  incoming.deleted_meals.forEach(function(id) {
    deletedIds[String(id)] = true;
  });

  const mealMap = {};
  const mealsWithoutId = [];

  existing.meals.forEach(function(meal) {
    if (!meal) return;

    if (meal.id) {
      mealMap[String(meal.id)] = meal;
    } else {
      mealsWithoutId.push(meal);
    }
  });

  incoming.meals.forEach(function(meal) {
    if (!meal) return;

    if (meal.id) {
      mealMap[String(meal.id)] = meal;
    } else {
      mealsWithoutId.push(meal);
    }
  });

  const mergedMeals = [];

  Object.keys(mealMap).forEach(function(id) {
    if (!deletedIds[id]) {
      mergedMeals.push(mealMap[id]);
    }
  });

  mealsWithoutId.forEach(function(meal) {
    mergedMeals.push(meal);
  });

  existing.meals = mergedMeals;
  existing.deleted_meals = Object.keys(deletedIds);

  const mergedSupplements = [];

  existing.supplements_taken
    .concat(incoming.supplements_taken)
    .forEach(function(item) {
      const supplement = String(item || "").trim();

      if (
        supplement &&
        mergedSupplements.indexOf(supplement) === -1
      ) {
        mergedSupplements.push(supplement);
      }
    });

  existing.supplements_taken = mergedSupplements;

  return existing;
}


// ============================================================
// 4. Telegram Webhook
// ============================================================

function handleTelegramWebhook(update) {
  if (!update || update.update_id === undefined) {
    return;
  }

  const updateId = String(update.update_id);
  const cache = CacheService.getScriptCache();

  const processedKey = "telegram_done_" + updateId;
  const processingKey = "telegram_processing_" + updateId;

  if (cache.get(processedKey)) {
    return;
  }

  if (cache.get(processingKey)) {
    return;
  }

  cache.put(
    processingKey,
    "1",
    PROCESSING_CACHE_SECONDS
  );

  try {
    if (update.message) {
      handleTelegramMessage(update.message);
    } else if (update.callback_query) {
      handleTelegramCallback(update.callback_query);
    }

    cache.put(
      processedKey,
      "1",
      UPDATE_CACHE_SECONDS
    );

  } catch (error) {
    console.error("Telegram webhook failed:", error);
    cache.remove(processingKey);
    throw error;

  } finally {
    cache.remove(processingKey);
  }
}

function isAllowedChat(chatId) {
  const config = getConfig();

  if (!config.allowedChatId) {
    return true;
  }

  return String(chatId) === config.allowedChatId;
}

function handleTelegramMessage(message) {
  if (!message || !message.chat) {
    return;
  }

  const chatId = String(message.chat.id);

  if (!isAllowedChat(chatId)) {
    sendTelegramMessage(
      chatId,
      "גישה חסומה. הבוט מוגדר לשימוש פרטי בלבד."
    );
    return;
  }

  PropertiesService.getScriptProperties()
    .setProperty("TELEGRAM_CHAT_ID", chatId);

  let text = String(
    message.text || message.caption || ""
  ).trim();

  const photo = Array.isArray(message.photo)
    ? message.photo
    : null;

  if (!text && !photo) {
    sendTelegramMessage(
      chatId,
      "המערכת אינה יכולה לעבד כרגע את סוג ההודעה הזה."
    );
    return;
  }

  if (text === "/start") {
    sendTelegramMessage(
      chatId,
      "החיבור הושלם. המערכת מזהה את השחקן."
    );
    return;
  }

  if (text === "/status") {
    sendTelegramMessage(chatId, buildStatusMessage());
    return;
  }

  if (text === "/sleep") {
    sendTelegramMessage(chatId, buildSleepStatusMessage());
    return;
  }

  if (text === "/help") {
    sendTelegramMessage(
      chatId,
      "פקודות זמינות:\n" +
      "/start - התחברות למערכת\n" +
      "/status - סטטוס יומי\n" +
      "/sleep - נתוני שינה מ-Google Fit\n" +
      "/help - עזרה\n\n" +
      "אפשר לשלוח טקסט, ארוחה או תמונת אוכל."
    );
    return;
  }

  try {
    let imageData = null;

    if (photo && photo.length > 0) {
      sendTelegramMessage(
        chatId,
        "המערכת מפעילה סורק ויזואלי..."
      );

      imageData = getTelegramPhotoBase64(photo);

      if (!imageData) {
        sendTelegramMessage(
          chatId,
          "לא הצלחתי להוריד את התמונה. נסה לשלוח אותה שוב."
        );
        return;
      }

      if (!text) {
        text =
          "העליתי תמונת אוכל. נתח אותה, הערך קלוריות " +
          "וחלבון, והוסף דיווח תזונה.";
      }
    }

    const fitupData = getFitUpData();
    const steps = getCachedSteps();
    const sleep = getCachedSleep();
    const heartPoints = getCachedHeartPoints24h();
    const energy = getCachedEnergyExpended24h();

    let aiResponse = askGeminiAI(
      text,
      fitupData,
      steps,
      sleep,
      imageData,
      heartPoints,
      energy
    );

    const nutritionResult = extractNutritionBlock(aiResponse);

    if (nutritionResult.nutrition) {
      updateNutritionData(nutritionResult.nutrition);
      aiResponse = nutritionResult.visibleText;
    }

    if (!aiResponse || !aiResponse.trim()) {
      aiResponse = "המערכת לא הפיקה תשובה. נסה שוב.";
    }

    sendTelegramMessage(chatId, aiResponse);

  } catch (error) {
    console.error("Telegram message error:", error);

    // הוספנו את השגיאה האמיתית להודעה כדי שנראה אותה בטלגרם
    sendTelegramMessage(
      chatId,
      "שגיאת מערכת בעיבוד הבקשה. השגיאה: \n" + String(error.message)
    );

    throw error;
  }

}

function handleTelegramCallback(callbackQuery) {
  const chatId =
    callbackQuery &&
    callbackQuery.message &&
    callbackQuery.message.chat
      ? String(callbackQuery.message.chat.id)
      : "";

  if (!chatId || !isAllowedChat(chatId)) {
    return;
  }

  answerTelegramCallback(
    callbackQuery.id,
    "המערכת קיבלה את הפעולה."
  );

  const action = String(callbackQuery.data || "");

  if (action === "status") {
    sendTelegramMessage(chatId, buildStatusMessage());
    return;
  }

  if (action === "sleep") {
    sendTelegramMessage(chatId, buildSleepStatusMessage());
    return;
  }

  sendTelegramMessage(chatId, "הפעולה התקבלה: " + action);
}


// ============================================================
// 5. Gemini AI
// ============================================================

function askGeminiAI(
  userMessage,
  fitupData,
  steps,
  sleep,
  imageData,
  heartPoints,
  energy
) {
  const config = getConfig();

  const url =
    "https://generativelanguage.googleapis.com/v1beta/models/" +
    encodeURIComponent(GEMINI_MODEL) +
    ":generateContent?key=" +
    encodeURIComponent(config.geminiKey);

  const systemPrompt = buildSystemPrompt(
    fitupData,
    steps,
    sleep,
    heartPoints,
    energy
  );

  const userParts = [{
    text: String(userMessage || "")
  }];

  // תיקון: inlineData ו-mimeType במקום inline_data ו-mime_type
  if (imageData && imageData.data) {
    userParts.push({
      inlineData: {
        mimeType: imageData.mimeType || "image/jpeg",
        data: imageData.data
      }
    });
  }

  const payload = {
    // תיקון: systemInstruction במקום system_instruction
    systemInstruction: {
      parts: [{
        text: systemPrompt
      }]
    },
    contents: [{
      role: "user",
      parts: userParts
    }],
    generationConfig: {
      temperature: 0.65,
      topK: 32,
      topP: 0.9,
      maxOutputTokens: 700
    }
  };

  const response = UrlFetchApp.fetch(url, {
    method: "post",
    contentType: "application/json",
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  });

  const statusCode = response.getResponseCode();
  const rawBody = response.getContentText();

  let json;

  try {
    json = JSON.parse(rawBody);
  } catch (error) {
    throw new Error(
      "Gemini החזיר JSON לא תקין. HTTP " + statusCode
    );
  }

  if (statusCode < 200 || statusCode >= 300 || (json.error && json.error.message)) {
    throw new Error(
      "Gemini error: " +
      (
        json.error && json.error.message
          ? json.error.message
          : "HTTP " + statusCode
      )
    );
  }

  const candidates = json.candidates || [];

  if (
    !candidates.length ||
    !candidates[0].content ||
    !candidates[0].content.parts
  ) {
    return "המערכת שותקת כרגע. נסה שוב בעוד רגע.";
  }

  return candidates[0].content.parts
    .map(function(part) {
      return part.text || "";
    })
    .join("")
    .trim()
    .replace(/\*\*/g, "")
    .replace(/\*/g, "");
}


function buildSystemPrompt(
  fitupData,
  steps,
  sleep,
  heartPoints,
  energy
) {
  const todayStr = getIsraelDateString();
  const aiContext24h = getCachedAiContext24h();

  let prompt =
    "אתה המערכת, ישות AI בסגנון RPG ו-Solo Leveling " +
    "שמלווה שחקן בכושר, התאוששות ותזונה. " +
    "ענה תמיד בעברית. תשובה קצרה: עד 4 משפטים. " +
    "הטון סמכותי, חד ומדרבן, אך לא משפיל ולא מסוכן. " +
    "מותר להשתמש במונחים Stats, EXP, Level Up, Debuff. " +
    "לשחקן יש רק משקל גוף וגומיות התנגדות של 30, 40 ו-50 ק\"ג. " +
    "אסור להציע משקולות חופשיות, מכונות או ציוד חדר כושר. " +
    "חלוקת האימונים: Legs + Core, Push + Skill, Pull + Grip, Active Recovery. " +
    "אם השחקן מדווח על כאב חד, סחרחורת, כאב חזה או קוצר נשימה, " +
    "הורה לו לעצור ולפנות לעזרה רפואית במקרה הצורך. " +
    "כשיש דיווח אוכל או תמונת אוכל, תן הערכת קלוריות וחלבון וציין שזו הערכה. " +
    "בכל דיווח תזונה הוסף בסוף התשובה בלבד JSON תקין בפורמט: " +
    "<NUTRITION>{\"meal_name\":\"שם האוכל\",\"calories\":0," +
    "\"protein\":0,\"supplements_taken\":[]," +
    "\"bonus_supplements\":{}}</NUTRITION>. " +
    "אל תשתמש בכוכביות Markdown ואל תוסיף טקסט אחרי בלוק NUTRITION.\n\n";

  if (!fitupData) {
    prompt += "נתוני אפליקציה אינם זמינים.\n";
  } else {
    const settings = fitupData.settings || {};
    const level = Number(settings.level || 1);
    const xp = Number(settings.xp || 0);

    prompt += "סטטוס שחקן: רמה " + level + ", XP " + xp + ".\n";

    const tracking = Array.isArray(fitupData.tracking)
      ? fitupData.tracking
      : [];

    let completedCount = 0;

    tracking.slice(-7).forEach(function(item) {
      if (item && item.completed) {
        completedCount++;
      }
    });

    prompt +=
      "אימונים שהושלמו בשבעת הרישומים האחרונים: " +
      completedCount + ".\n";

    if (tracking.length > 0) {
      const lastWorkout = tracking[tracking.length - 1];

      if (lastWorkout) {
        prompt +=
          "אימון אחרון: " +
          String(lastWorkout.dayType || "לא ידוע") +
          ".\n";
      }
    }

    const nutrition = fitupData.nutrition || {};
    const todayNutrition = normalizeNutritionDay(
      nutrition[todayStr] || {}
    );

    let calories = 0;
    let protein = 0;

    todayNutrition.meals.forEach(function(meal) {
      calories += Number(meal.calories || 0);
      protein += Number(meal.protein || 0);
    });

    prompt +=
      "תזונה היום: " +
      calories + " קלוריות, " +
      protein + " גרם חלבון.\n";

    prompt +=
      "תוספים שנלקחו: " +
      (
        todayNutrition.supplements_taken.length
          ? todayNutrition.supplements_taken.join(", ")
          : "אין דיווח"
      ) +
      ".\n";
  }

  if (sleep && sleep.totalMinutes > 0) {
    prompt +=
      "נתוני שינה אחרונים: " +
      formatSleepDuration(sleep.totalMinutes) +
      ".\n";
  } else {
    prompt += "נתוני שינה: לא זמינים.\n";
  }

  prompt +=
    "צעדים ב-24 שעות: " +
    (
      steps === null || steps === undefined
        ? "לא זמין"
        : steps
    ) +
    ".\n";


  prompt +=
    "Heart Points (נקודות לב - מדד מאמץ אירובי. לפחות 22 ליום זה טוב, מעל 40 זה אימון עצים): " +
    (
      heartPoints === null || heartPoints === undefined
        ? "לא זמין"
        : heartPoints
    ) +
    ". התייחס לזה במקום דופק כדי לנתח את העומס הקרדיו-וסקולרי שלו.\n";

  prompt +=
    "Energy Expended ב-24 שעות: " +
    (
      energy === null || energy === undefined
        ? "לא זמין"
        : energy + " קק\"ל"
    ) +
    ".\n";

  if (aiContext24h && aiContext24h.summary) {
    prompt +=
      "תמונת 24 שעות אחרונות לניתוח:\n" +
      JSON.stringify({
        window: aiContext24h.window || null,
        summary: aiContext24h.summary || null,
        sleep: aiContext24h.sleep || null,
        hourly: {
          steps: summarizeHourlyForPrompt(
            aiContext24h.hourly && aiContext24h.hourly.steps
          ),
          energy: summarizeHourlyForPrompt(
            aiContext24h.hourly && aiContext24h.hourly.energy
          ),
          heartPoints: summarizeHourlyForPrompt(
            aiContext24h.hourly && aiContext24h.hourly.heartPoints
          )
        },
        sessions: summarizeSessionsForPrompt(
          aiContext24h.sessions || []
        ),
        nutritionToday: aiContext24h.nutritionToday || null
      }) +
      "\n";
  } else {
    prompt += "תמונת 24 שעות מפורטת: לא זמינה.\n";
  }

  prompt +=
    "השתמש בכל הנתונים כדי לתת תובנה חכמה אחת או שתיים על עומס, התאוששות, פעילות ותזונה. " +
    "אם יש פיזור פעילות שעתית או סשנים בולטים, התייחס אליהם. " +
    "אם חסרים נתונים, ציין זאת בקצרה ואל תמציא. " +
    "העדף תובנות מבוססות דפוסי 24 שעות על פני חזרה יבשה על מספרים.";

  return prompt;
}

function summarizeHourlyForPrompt(items) {
  const list = Array.isArray(items) ? items : [];

  if (!list.length) {
    return [];
  }

  return list
    .filter(function(item) {
      return Number(item.value || 0) > 0;
    })
    .map(function(item) {
      return {
        hour: item.hour,
        value: item.value
      };
    })
    .slice(-12);
}

function summarizeSessionsForPrompt(sessions) {
  const list = Array.isArray(sessions) ? sessions : [];

  if (!list.length) {
    return [];
  }

  return list
    .map(function(session) {
      return {
        name: session.name,
        activityType: session.activityType,
        startTime: session.startTime,
        endTime: session.endTime,
        durationMinutes: session.durationMinutes
      };
    })
    .slice(-8);
}


// ============================================================
// 6. AI Context 24h
// ============================================================

function getCachedAiContext24h() {
  const props = PropertiesService.getScriptProperties();
  const cachedRaw = props.getProperty("CACHED_AI_CONTEXT_24H");

  if (cachedRaw) {
    try {
      const cached = JSON.parse(cachedRaw);
      const maximumAge = AI_CONTEXT_CACHE_MINUTES * 60 * 1000;

      if (
        Date.now() - Number(cached.timestamp || 0) < maximumAge
      ) {
        return cached.data;
      }
    } catch (ignore) {}
  }

  const data = getAiContext24h();

  props.setProperty(
    "CACHED_AI_CONTEXT_24H",
    JSON.stringify({
      data: data,
      timestamp: Date.now()
    })
  );

  return data;
}

function getAiContext24h() {
  try {
    const now = Date.now();
    const startTimeMillis = now - 24 * 60 * 60 * 1000;
    const endTimeMillis = now;

    const fitupData = getFitUpData() || {};
    const sleep = getCachedSleep();
    const steps = getCachedSteps();
    const heartPoints = getCachedHeartPoints24h();
    const energy = getCachedEnergyExpended24h();

    const hourlySteps = fetchAggregateBuckets24h({
      dataTypeName: "com.google.step_count.delta",
      dataSourceId:
        "derived:com.google.step_count.delta:" +
        "com.google.android.gms:estimated_steps",
      startTimeMillis: startTimeMillis,
      endTimeMillis: endTimeMillis,
      bucketDurationMillis: 60 * 60 * 1000,
      valueType: "int"
    });

    const hourlyEnergy = fetchAggregateBuckets24h({
      dataTypeName: "com.google.calories.expended",
      startTimeMillis: startTimeMillis,
      endTimeMillis: endTimeMillis,
      bucketDurationMillis: 60 * 60 * 1000,
      valueType: "float"
    });

    const hourlyHeartPoints = fetchAggregateBuckets24h({
      dataTypeName: "com.google.heart_minutes",
      dataSourceId:
        "derived:com.google.heart_minutes:" +
        "com.google.android.gms:merge_heart_minutes",
      startTimeMillis: startTimeMillis,
      endTimeMillis: endTimeMillis,
      bucketDurationMillis: 60 * 60 * 1000,
      valueType: "float"
    });

    const sessions = fetchSessions24h(
      startTimeMillis,
      endTimeMillis
    );

    const nutritionToday = buildNutritionSummaryForToday(fitupData);

    return {
      window: {
        startTimeMillis: startTimeMillis,
        endTimeMillis: endTimeMillis,
        startLabel: formatIsoDateTime(startTimeMillis),
        endLabel: formatIsoDateTime(endTimeMillis)
      },

      summary: {
        steps24h: steps,
        sleepTotalMinutes: sleep ? sleep.totalMinutes : null,

        heartPoints24h: heartPoints,
        energy24h: energy,
        sessionsCount: Array.isArray(sessions) ? sessions.length : 0,
        activeHoursSteps: countActiveHours(hourlySteps),
        activeHoursHeartPoints: countActiveHours(hourlyHeartPoints)
      },

      sleep: sleep
        ? {
            totalMinutes: sleep.totalMinutes,
            lightMinutes: sleep.lightMinutes,
            deepMinutes: sleep.deepMinutes,
            remMinutes: sleep.remMinutes,
            awakeMinutes: sleep.awakeMinutes,
            startTime: sleep.startTime
              ? formatIsoDateTime(sleep.startTime)
              : null,
            endTime: sleep.endTime
              ? formatIsoDateTime(sleep.endTime)
              : null
          }
        : null,

      hourly: {
        steps: hourlySteps,
        energy: hourlyEnergy,
        heartPoints: hourlyHeartPoints
      },

      sessions: sessions,
      nutritionToday: nutritionToday
    };

  } catch (error) {
    console.error("getAiContext24h error:", error);
    return null;
  }
}

function fetchAggregateBuckets24h(options) {
  try {
    const token = ScriptApp.getOAuthToken();

    const aggregateByItem = {
      dataTypeName: String(options.dataTypeName || "")
    };

    if (options.dataSourceId) {
      aggregateByItem.dataSourceId = String(options.dataSourceId);
    }

    const payload = {
      aggregateBy: [aggregateByItem],
      bucketByTime: {
        durationMillis: Number(
          options.bucketDurationMillis || 3600000
        )
      },
      startTimeMillis: Number(options.startTimeMillis || 0),
      endTimeMillis: Number(options.endTimeMillis || 0)
    };

    const response = UrlFetchApp.fetch(
      "https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate",
      {
        method: "post",
        headers: {
          Authorization: "Bearer " + token
        },
        contentType: "application/json",
        payload: JSON.stringify(payload),
        muteHttpExceptions: true
      }
    );

    if (
      response.getResponseCode() < 200 ||
      response.getResponseCode() >= 300
    ) {
      console.warn(
        "fetchAggregateBuckets24h HTTP:",
        response.getResponseCode(),
        options.dataTypeName
      );
      return [];
    }

    const data = JSON.parse(response.getContentText());
    const results = [];

    (data.bucket || []).forEach(function(bucket) {
      const startMillis = Number(bucket.startTimeMillis || 0);
      const endMillis = Number(bucket.endTimeMillis || 0);

      let total = 0;

      (bucket.dataset || []).forEach(function(dataset) {
        (dataset.point || []).forEach(function(point) {
          (point.value || []).forEach(function(value) {
            if (options.valueType === "int") {
              total += Number(value.intVal || 0);
            } else {
              if (typeof value.fpVal === "number") {
                total += Number(value.fpVal || 0);
              } else if (typeof value.intVal === "number") {
                total += Number(value.intVal || 0);
              }
            }
          });
        });
      });

      results.push({
        hour: formatHourLabel(startMillis),
        startTimeMillis: startMillis,
        endTimeMillis: endMillis,
        value: roundMetric(total)
      });
    });

    return results;

  } catch (error) {
    console.error("fetchAggregateBuckets24h error:", error);
    return [];
  }
}

function fetchSessions24h(startTimeMillis, endTimeMillis) {
  try {
    const token = ScriptApp.getOAuthToken();

    const url =
      "https://www.googleapis.com/fitness/v1/users/me/sessions" +
      "?startTime=" + encodeURIComponent(new Date(startTimeMillis).toISOString()) +
      "&endTime=" + encodeURIComponent(new Date(endTimeMillis).toISOString());

    const response = UrlFetchApp.fetch(url, {
      method: "get",
      headers: {
        Authorization: "Bearer " + token
      },
      muteHttpExceptions: true
    });

    if (
      response.getResponseCode() < 200 ||
      response.getResponseCode() >= 300
    ) {
      console.warn(
        "fetchSessions24h HTTP:",
        response.getResponseCode()
      );
      return [];
    }

    const json = JSON.parse(response.getContentText());
    const sessions = Array.isArray(json.session) ? json.session : [];

    return sessions
      .map(function(session) {
        const startMillis = session.startTimeMillis
          ? Number(session.startTimeMillis)
          : (
              session.startTime
                ? new Date(session.startTime).getTime()
                : 0
            );

        const endMillis = session.endTimeMillis
          ? Number(session.endTimeMillis)
          : (
              session.endTime
                ? new Date(session.endTime).getTime()
                : 0
            );

        const durationMinutes =
          startMillis > 0 && endMillis > startMillis
            ? Math.round((endMillis - startMillis) / 60000)
            : null;

        return {
          id: session.id || null,
          name: session.name || "Session",
          description: session.description || "",
          activityType: session.activityType || null,
          startTime: startMillis ? formatIsoDateTime(startMillis) : null,
          endTime: endMillis ? formatIsoDateTime(endMillis) : null,
          durationMinutes: durationMinutes
        };
      })
      .filter(function(session) {
        return session.durationMinutes === null || session.durationMinutes > 0;
      })
      .sort(function(a, b) {
        const aStart = a.startTime ? new Date(a.startTime).getTime() : 0;
        const bStart = b.startTime ? new Date(b.startTime).getTime() : 0;
        return aStart - bStart;
      });

  } catch (error) {
    console.error("fetchSessions24h error:", error);
    return [];
  }
}

function buildNutritionSummaryForToday(fitupData) {
  const todayStr = getIsraelDateString();
  const nutrition = fitupData && fitupData.nutrition
    ? fitupData.nutrition
    : {};

  const day = normalizeNutritionDay(
    nutrition[todayStr] || {}
  );

  let calories = 0;
  let protein = 0;

  day.meals.forEach(function(meal) {
    calories += Number(meal.calories || 0);
    protein += Number(meal.protein || 0);
  });

  return {
    date: todayStr,
    calories: calories,
    protein: protein,
    mealsCount: day.meals.length,
    supplementsTaken: day.supplements_taken || [],
    meals: day.meals.slice(-10).map(function(meal) {
      return {
        id: meal.id || null,
        name: meal.name || "Meal",
        calories: Number(meal.calories || 0),
        protein: Number(meal.protein || 0),
        time: meal.time || null
      };
    })
  };
}

function countActiveHours(items) {
  const list = Array.isArray(items) ? items : [];
  let count = 0;

  list.forEach(function(item) {
    if (Number(item.value || 0) > 0) {
      count++;
    }
  });

  return count;
}

function roundMetric(value) {
  const num = Number(value || 0);

  if (!isFinite(num)) {
    return 0;
  }

  return Math.round(num * 10) / 10;
}

function formatHourLabel(millis) {
  if (!millis) {
    return "לא ידוע";
  }

  return Utilities.formatDate(
    new Date(millis),
    TIME_ZONE,
    "HH:mm"
  );
}

function formatIsoDateTime(millis) {
  if (!millis) {
    return null;
  }

  return Utilities.formatDate(
    new Date(millis),
    TIME_ZONE,
    "yyyy-MM-dd HH:mm"
  );
}


// ============================================================
// 7. תזונה
// ============================================================

function extractNutritionBlock(aiResponse) {
  const text = String(aiResponse || "");

  const match = text.match(
    /<NUTRITION>\s*([\s\S]*?)\s*<\/NUTRITION>/i
  );

  if (!match || !match[1]) {
    return {
      nutrition: null,
      visibleText: text
    };
  }

  try {
    const nutrition = JSON.parse(
      match[1]
        .replace(/```json/gi, "")
        .replace(/```/g, "")
        .trim()
    );

    return {
      nutrition: sanitizeNutrition(nutrition),
      visibleText: text
        .replace(/<NUTRITION>[\s\S]*?<\/NUTRITION>/gi, "")
        .trim()
    };

  } catch (error) {
    console.warn("Nutrition parse failed:", error);

    return {
      nutrition: null,
      visibleText: text
        .replace(/<NUTRITION>[\s\S]*?<\/NUTRITION>/gi, "")
        .trim()
    };
  }
}

function sanitizeNutrition(input) {
  const data = input || {};

  return {
    meal_name: String(
      data.meal_name || "ארוחה שדווחה לבוט"
    ).slice(0, 120),

    calories: Math.max(
      0,
      Math.round(Number(data.calories || 0))
    ),

    protein: Math.max(
      0,
      Math.round(Number(data.protein || 0))
    ),

    supplements_taken: Array.isArray(data.supplements_taken)
      ? data.supplements_taken
          .map(function(item) {
            return String(item || "").trim().slice(0, 80);
          })
          .filter(Boolean)
      : [],

    bonus_supplements:
      data.bonus_supplements &&
      typeof data.bonus_supplements === "object"
        ? data.bonus_supplements
        : {}
  };
}

function updateNutritionData(newNutrition) {
  const lock = LockService.getScriptLock();

  try {
    lock.waitLock(15000);

    const data = getFitUpDataNoLock() || {};
    const todayStr = getIsraelDateString();

    if (!data.nutrition) {
      data.nutrition = {};
    }

    if (!data.nutrition[todayStr]) {
      data.nutrition[todayStr] = {
        meals: [],
        supplements_taken: [],
        deleted_meals: []
      };
    }

    const todayData = normalizeNutritionDay(
      data.nutrition[todayStr]
    );

    const nutrition = sanitizeNutrition(newNutrition);

    todayData.meals.push({
      id:
        "bot_" +
        new Date().getTime() +
        "_" +
        Math.floor(Math.random() * 100000),
      name: nutrition.meal_name,
      calories: nutrition.calories,
      protein: nutrition.protein,
      time: getIsraelTimeString(),
      bonus: nutrition.bonus_supplements
    });

    nutrition.supplements_taken.forEach(function(supplement) {
      if (todayData.supplements_taken.indexOf(supplement) === -1) {
        todayData.supplements_taken.push(supplement);
      }
    });

    data.nutrition[todayStr] = todayData;
    saveFitUpDataNoLock(data);

    return data;

  } finally {
    try {
      lock.releaseLock();
    } catch (ignore) {}
  }
}


// ============================================================
// 8. Google Drive
// ============================================================

function getFitUpData() {
  const lock = LockService.getScriptLock();

  try {
    lock.waitLock(15000);
    return getFitUpDataNoLock();

  } finally {
    try {
      lock.releaseLock();
    } catch (ignore) {}
  }
}

function getFitUpDataNoLock() {
  try {
    const file = getDataFile();
    const raw = file.getBlob().getDataAsString();

    return raw && raw.trim()
      ? JSON.parse(raw)
      : {};

  } catch (error) {
    console.error("Read FitUp data error:", error);
    return {};
  }
}

function saveFitUpDataNoLock(data) {
  getDataFile().setContent(JSON.stringify(data || {}));
}

function getDataFile() {
  const props = PropertiesService.getScriptProperties();
  const savedFileId = props.getProperty("FITUP_FILE_ID");

  if (savedFileId) {
    try {
      return DriveApp.getFileById(savedFileId);
    } catch (error) {
      props.deleteProperty("FITUP_FILE_ID");
    }
  }

  const config = getConfig();

  const file = DriveApp.createFile(
    config.filename,
    "{}",
    MimeType.PLAIN_TEXT
  );

  props.setProperty("FITUP_FILE_ID", file.getId());

  return file;
}


// ============================================================
// 9. Telegram API
// ============================================================

function telegramApi(method, payload) {
  const config = getConfig();

  const url =
    "https://api.telegram.org/bot" +
    config.telegramToken +
    "/" +
    method;

  const response = UrlFetchApp.fetch(url, {
    method: "post",
    contentType: "application/json",
    payload: JSON.stringify(payload || {}),
    muteHttpExceptions: true
  });

  const statusCode = response.getResponseCode();
  const body = response.getContentText();

  let json;

  try {
    json = JSON.parse(body);
  } catch (error) {
    throw new Error(
      "Telegram החזיר JSON לא תקין. HTTP " + statusCode
    );
  }

  if (statusCode < 200 || statusCode >= 300 || !json.ok) {
    throw new Error(
      "Telegram error: " +
      (json.description || "HTTP " + statusCode)
    );
  }

  return json.result;
}

function sendTelegramMessage(chatId, text) {
  const message = String(text || "").trim();

  if (!message) {
    return;
  }

  const parts = splitTelegramMessage(
    message,
    MAX_TELEGRAM_MESSAGE_LENGTH
  );

  parts.forEach(function(part) {
    telegramApi("sendMessage", {
      chat_id: String(chatId),
      text: part,
      disable_web_page_preview: true
    });
  });
}

function splitTelegramMessage(text, maxLength) {
  const result = [];
  let remaining = String(text || "");

  while (remaining.length > maxLength) {
    let cut = remaining.lastIndexOf("\n", maxLength);

    if (cut < maxLength * 0.5) {
      cut = remaining.lastIndexOf(" ", maxLength);
    }

    if (cut < maxLength * 0.5) {
      cut = maxLength;
    }

    result.push(remaining.slice(0, cut).trim());
    remaining = remaining.slice(cut).trim();
  }

  if (remaining) {
    result.push(remaining);
  }

  return result;
}

function answerTelegramCallback(callbackQueryId, text) {
  try {
    telegramApi("answerCallbackQuery", {
      callback_query_id: callbackQueryId,
      text: String(text || "").slice(0, 200)
    });
  } catch (error) {
    console.error("Callback error:", error);
  }
}


// ============================================================
// 10. Webhook
// ============================================================

function setupWebhook() {

// ClearCaches
  const props = PropertiesService.getScriptProperties();
  props.deleteProperty("CACHED_SLEEP");
  props.deleteProperty("CACHED_STEPS");
  props.deleteProperty("CACHED_HEART_POINTS_24H");
  props.deleteProperty("CACHED_ENERGY_24H");
  props.deleteProperty("CACHED_AI_CONTEXT_24H");
  console.log("המטמון נוקה בהצלחה! הבוט ימשוך נתונים חדשים.");

  const config = getConfig();

  if (!config.webAppUrl) {
    throw new Error("חסר Script Property בשם WEB_APP_URL");
  }

  const response = UrlFetchApp.fetch(
    "https://api.telegram.org/bot" +
    config.telegramToken +
    "/setWebhook",
    {
      method: "post",
      contentType: "application/json",
      payload: JSON.stringify({
        url: config.webAppUrl,
        drop_pending_updates: true,
        allowed_updates: ["message", "callback_query"]
      }),
      muteHttpExceptions: true
    }
  );

  Logger.log(response.getContentText());
}

function getWebhookInfo() {
  const config = getConfig();

  const response = UrlFetchApp.fetch(
    "https://api.telegram.org/bot" +
    config.telegramToken +
    "/getWebhookInfo",
    {
      method: "get",
      muteHttpExceptions: true
    }
  );

  Logger.log(response.getContentText());
}


// ============================================================
// 11. תמונות Telegram
// ============================================================

function getTelegramPhotoBase64(photoArray) {
  try {
    if (!photoArray || !photoArray.length) {
      return null;
    }

    const config = getConfig();
    const largestPhoto = photoArray[photoArray.length - 1];
    const fileId = largestPhoto.file_id;

    const getFileResponse = UrlFetchApp.fetch(
      "https://api.telegram.org/bot" +
      config.telegramToken +
      "/getFile?file_id=" +
      encodeURIComponent(fileId),
      {
        muteHttpExceptions: true
      }
    );

    const fileJson = JSON.parse(
      getFileResponse.getContentText()
    );

    if (
      !fileJson.ok ||
      !fileJson.result ||
      !fileJson.result.file_path
    ) {
      return null;
    }

    const imageResponse = UrlFetchApp.fetch(
      "https://api.telegram.org/file/bot" +
      config.telegramToken +
      "/" +
      fileJson.result.file_path,
      {
        muteHttpExceptions: true
      }
    );

    if (imageResponse.getResponseCode() !== 200) {
      return null;
    }

    const blob = imageResponse.getBlob();

    if (blob.getBytes().length > 8 * 1024 * 1024) {
      return null;
    }

    let mime = blob.getContentType() || "image/jpeg";
    
    // תיקון קריטי: טלגרם לפעמים מחזיר את התמונה כקובץ כללי. נכריח אותו להיות jpeg
    if (mime === "application/octet-stream") {
      mime = "image/jpeg";
    }

    return {
      data: Utilities.base64Encode(blob.getBytes()),
      mimeType: mime
    };


  } catch (error) {
    console.error("Photo download error:", error);
    return null;
  }
}


// ============================================================
// 12. Google Fit — צעדים
// ============================================================

function getCachedSteps() {
  const props = PropertiesService.getScriptProperties();
  const cachedRaw = props.getProperty("CACHED_STEPS");

  if (cachedRaw) {
    try {
      const cached = JSON.parse(cachedRaw);
      const maximumAge = STEPS_CACHE_MINUTES * 60 * 1000;

      if (
        Date.now() - Number(cached.timestamp || 0) < maximumAge
      ) {
        return cached.steps;
      }
    } catch (ignore) {}
  }

  const steps = fetchGoogleFitSteps();

  props.setProperty(
    "CACHED_STEPS",
    JSON.stringify({
      steps: steps,
      timestamp: Date.now()
    })
  );

  return steps;
}

function fetchGoogleFitSteps() {
  try {
    const token = ScriptApp.getOAuthToken();
    const endTimeMillis = Date.now();
    const startTimeMillis = endTimeMillis - 24 * 60 * 60 * 1000;

    const payload = {
      aggregateBy: [{
        dataTypeName: "com.google.step_count.delta",
        dataSourceId:
          "derived:com.google.step_count.delta:" +
          "com.google.android.gms:estimated_steps"
      }],
      bucketByTime: {
        durationMillis: 86400000
      },
      startTimeMillis: startTimeMillis,
      endTimeMillis: endTimeMillis
    };

    const response = UrlFetchApp.fetch(
      "https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate",
      {
        method: "post",
        headers: {
          Authorization: "Bearer " + token
        },
        contentType: "application/json",
        payload: JSON.stringify(payload),
        muteHttpExceptions: true
      }
    );

    if (
      response.getResponseCode() < 200 ||
      response.getResponseCode() >= 300
    ) {
      console.warn(
        "Google Fit steps HTTP:",
        response.getResponseCode()
      );
      return null;
    }

    const data = JSON.parse(response.getContentText());
    let total = 0;

    (data.bucket || []).forEach(function(bucket) {
      (bucket.dataset || []).forEach(function(dataset) {
        (dataset.point || []).forEach(function(point) {
          (point.value || []).forEach(function(value) {
            total += Number(value.intVal || 0);
          });
        });
      });
    });

    return total;

  } catch (error) {
    console.error("Google Fit steps error:", error);
    return null;
  }
}


// ============================================================
// 13. Google Fit — שינה
// ============================================================

function getCachedSleep() {
  const props = PropertiesService.getScriptProperties();
  const cachedRaw = props.getProperty("CACHED_SLEEP");

  if (cachedRaw) {
    try {
      const cached = JSON.parse(cachedRaw);
      const maximumAge = SLEEP_CACHE_MINUTES * 60 * 1000;

      if (
        Date.now() - Number(cached.timestamp || 0) < maximumAge
      ) {
        return cached.data;
      }
    } catch (ignore) {}
  }

  const sleep = fetchGoogleFitSleep();

  props.setProperty(
    "CACHED_SLEEP",
    JSON.stringify({
      data: sleep,
      timestamp: Date.now()
    })
  );

  return sleep;
}

function fetchGoogleFitSleep() {
  try {
    const token = ScriptApp.getOAuthToken();
    const endMillis = Date.now();
    const startMillis = endMillis - 36 * 60 * 60 * 1000;

    const payload = {
      aggregateBy: [{
        dataTypeName: "com.google.sleep.segment"
      }],
      startTimeMillis: startMillis,
      endTimeMillis: endMillis
    };

    const response = UrlFetchApp.fetch(
      "https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate",
      {
        method: "post",
        headers: {
          Authorization: "Bearer " + token
        },
        contentType: "application/json",
        payload: JSON.stringify(payload),
        muteHttpExceptions: true
      }
    );

    if (response.getResponseCode() < 200 || response.getResponseCode() >= 300) {
      console.warn("Google Fit sleep HTTP:", response.getResponseCode());
      return null;
    }

    const data = JSON.parse(response.getContentText());

    const sleep = {
      totalMinutes: 0,
      lightMinutes: 0,
      deepMinutes: 0,
      remMinutes: 0,
      awakeMinutes: 0,
      genericSleepMinutes: 0, // משתנה זמני למניעת ספירה כפולה
      startTime: null,
      endTime: null
    };

    (data.bucket || []).forEach(function(bucket) {
      (bucket.dataset || []).forEach(function(dataset) {
        (dataset.point || []).forEach(function(point) {
          const start = Number(point.startTimeNanos || 0) / 1000000;
          const end = Number(point.endTimeNanos || 0) / 1000000;

          if (!start || !end || end <= start) {
            return;
          }

          const minutes = Math.round((end - start) / 60000);
          const value = point.value && point.value[0] ? Number(point.value[0].intVal || 0) : 0;

          if (value === 1) {
            sleep.awakeMinutes += minutes;
          } else if (value === 2) {
            sleep.genericSleepMinutes += minutes;
          } else if (value === 4) {
            sleep.lightMinutes += minutes;
          } else if (value === 5) {
            sleep.deepMinutes += minutes;
          } else if (value === 6) {
            sleep.remMinutes += minutes;
          }

          if (value !== 1 && value !== 3) {
            if (!sleep.startTime || start < sleep.startTime) {
              sleep.startTime = start;
            }
            if (!sleep.endTime || end > sleep.endTime) {
              sleep.endTime = end;
            }
          }
        });
      });
    });

    // חישוב חכם לסך כל השינה (מונע הכפלות)
    sleep.totalMinutes = sleep.lightMinutes + sleep.deepMinutes + sleep.remMinutes;
    if (sleep.totalMinutes === 0 && sleep.genericSleepMinutes > 0) {
      sleep.totalMinutes = sleep.genericSleepMinutes;
    }

    if (sleep.totalMinutes <= 0) {
      return null;
    }

    delete sleep.genericSleepMinutes;
    return sleep;

  } catch (error) {
    console.error("Google Fit sleep error:", error);
    return null;
  }
}


// ============================================================
// 15. Google Fit — Heart Points 24h
// ============================================================

function getCachedHeartPoints24h() {
  const props = PropertiesService.getScriptProperties();
  const cachedRaw = props.getProperty("CACHED_HEART_POINTS_24H");

  if (cachedRaw) {
    try {
      const cached = JSON.parse(cachedRaw);
      const maximumAge = HEART_POINTS_CACHE_MINUTES * 60 * 1000;

      if (
        Date.now() - Number(cached.timestamp || 0) < maximumAge
      ) {
        return cached.value;
      }
    } catch (ignore) {}
  }

  const value = fetchGoogleFitHeartPoints24h();

  props.setProperty(
    "CACHED_HEART_POINTS_24H",
    JSON.stringify({
      value: value,
      timestamp: Date.now()
    })
  );

  return value;
}

function fetchGoogleFitHeartPoints24h() {
  try {
    const token = ScriptApp.getOAuthToken();
    const endTimeMillis = Date.now();
    const startTimeMillis = endTimeMillis - 24 * 60 * 60 * 1000;

    const payload = {
      aggregateBy: [{
        dataTypeName: "com.google.heart_minutes",
        dataSourceId:
          "derived:com.google.heart_minutes:" +
          "com.google.android.gms:merge_heart_minutes"
      }],
      bucketByTime: {
        durationMillis: 86400000
      },
      startTimeMillis: startTimeMillis,
      endTimeMillis: endTimeMillis
    };

    const response = UrlFetchApp.fetch(
      "https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate",
      {
        method: "post",
        headers: {
          Authorization: "Bearer " + token
        },
        contentType: "application/json",
        payload: JSON.stringify(payload),
        muteHttpExceptions: true
      }
    );

    if (
      response.getResponseCode() < 200 ||
      response.getResponseCode() >= 300
    ) {
      console.warn(
        "Google Fit heart minutes HTTP:",
        response.getResponseCode()
      );
      console.warn(response.getContentText());
      return null;
    }

    const data = JSON.parse(response.getContentText());
    let total = 0;
    let found = false;

    (data.bucket || []).forEach(function(bucket) {
      (bucket.dataset || []).forEach(function(dataset) {
        (dataset.point || []).forEach(function(point) {
          (point.value || []).forEach(function(value) {
            if (typeof value.fpVal === "number") {
              total += Number(value.fpVal || 0);
              found = true;
            } else if (typeof value.intVal === "number") {
              total += Number(value.intVal || 0);
              found = true;
            }
          });
        });
      });
    });

    return found ? Math.round(total) : null;

  } catch (error) {
    console.error("Google Fit heart minutes error:", error);
    return null;
  }
}


// ============================================================
// 16. Google Fit — Energy Expended 24h
// ============================================================

function getCachedEnergyExpended24h() {
  const props = PropertiesService.getScriptProperties();
  const cachedRaw = props.getProperty("CACHED_ENERGY_24H");

  if (cachedRaw) {
    try {
      const cached = JSON.parse(cachedRaw);
      const maximumAge = ENERGY_CACHE_MINUTES * 60 * 1000;

      if (
        Date.now() - Number(cached.timestamp || 0) < maximumAge
      ) {
        return cached.value;
      }
    } catch (ignore) {}
  }

  const value = fetchGoogleFitEnergyExpended24h();

  props.setProperty(
    "CACHED_ENERGY_24H",
    JSON.stringify({
      value: value,
      timestamp: Date.now()
    })
  );

  return value;
}

function fetchGoogleFitEnergyExpended24h() {
  try {
    const token = ScriptApp.getOAuthToken();
    const endTimeMillis = Date.now();
    const startTimeMillis = endTimeMillis - 24 * 60 * 60 * 1000;

    const payload = {
      aggregateBy: [{
        dataTypeName: "com.google.calories.expended"
      }],
      bucketByTime: {
        durationMillis: 86400000
      },
      startTimeMillis: startTimeMillis,
      endTimeMillis: endTimeMillis
    };

    const response = UrlFetchApp.fetch(
      "https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate",
      {
        method: "post",
        headers: {
          Authorization: "Bearer " + token
        },
        contentType: "application/json",
        payload: JSON.stringify(payload),
        muteHttpExceptions: true
      }
    );

    if (
      response.getResponseCode() < 200 ||
      response.getResponseCode() >= 300
    ) {
      console.warn(
        "Google Fit energy HTTP:",
        response.getResponseCode()
      );
      return null;
    }

    const data = JSON.parse(response.getContentText());
    let total = 0;
    let found = false;

    (data.bucket || []).forEach(function(bucket) {
      (bucket.dataset || []).forEach(function(dataset) {
        (dataset.point || []).forEach(function(point) {
          (point.value || []).forEach(function(value) {
            if (typeof value.fpVal === "number") {
              total += Number(value.fpVal || 0);
              found = true;
            } else if (typeof value.intVal === "number") {
              total += Number(value.intVal || 0);
              found = true;
            }
          });
        });
      });
    });

    return found ? Math.round(total) : null;

  } catch (error) {
    console.error("Google Fit energy error:", error);
    return null;
  }
}


// ============================================================
// 17. שינה, זמן, תצוגה
// ============================================================

function formatSleepDuration(minutes) {
  const total = Math.max(0, Number(minutes || 0));
  const hours = Math.floor(total / 60);
  const mins = total % 60;

  return hours + " שעות ו-" + mins + " דקות";
}

function formatSleepTime(millis) {
  if (!millis) {
    return "לא זמין";
  }

  return Utilities.formatDate(
    new Date(millis),
    TIME_ZONE,
    "HH:mm"
  );
}

function buildSleepStatusMessage() {
  const sleep = getCachedSleep();

  if (!sleep || sleep.totalMinutes <= 0) {
    return (
      "לא נמצאו נתוני שינה ב-Google Fit. " +
      "ודא שהשעון או הטלפון מסנכרנים שינה ל-Google Fit."
    );
  }

  const lines = [
    "סטטוס שינה:",
    "סה\"כ שינה: " + formatSleepDuration(sleep.totalMinutes),
    "תחילת שינה: " + formatSleepTime(sleep.startTime),
    "סיום שינה: " + formatSleepTime(sleep.endTime)
  ];

  if (sleep.lightMinutes > 0) {
    lines.push("שינה קלה: " + sleep.lightMinutes + " דקות");
  }

  if (sleep.deepMinutes > 0) {
    lines.push("שינה עמוקה: " + sleep.deepMinutes + " דקות");
  }

  if (sleep.remMinutes > 0) {
    lines.push("REM: " + sleep.remMinutes + " דקות");
  }

  if (sleep.awakeMinutes > 0) {
    lines.push("ערות: " + sleep.awakeMinutes + " דקות");
  }

  return lines.join("\n");
}


// ============================================================
// 18. סטטוס, תאריך והתראות
// ============================================================

function getIsraelDateString() {
  return Utilities.formatDate(
    new Date(),
    TIME_ZONE,
    "yyyy-MM-dd"
  );
}

function getIsraelTimeString() {
  return Utilities.formatDate(
    new Date(),
    TIME_ZONE,
    "HH:mm"
  );
}

function getIsraelHour() {
  return Number(
    Utilities.formatDate(
      new Date(),
      TIME_ZONE,
      "H"
    )
  );
}

function buildStatusMessage() {
  const data = getFitUpData() || {};
  const todayStr = getIsraelDateString();

  const steps = getCachedSteps();
  const sleep = getCachedSleep();
  const heartPoints = getCachedHeartPoints24h();
  const energy = getCachedEnergyExpended24h();

  const nutrition = data.nutrition || {};
  const day = normalizeNutritionDay(
    nutrition[todayStr] || {}
  );

  let calories = 0;
  let protein = 0;

  day.meals.forEach(function(meal) {
    calories += Number(meal.calories || 0);
    protein += Number(meal.protein || 0);
  });

  const settings = data.settings || {};

  const lines = [
    "סטטוס מערכת:",
    "רמה: " + Number(settings.level || 1),
    "XP: " + Number(settings.xp || 0),
    "צעדים 24ש: " + (
      steps === null || steps === undefined
        ? "לא זמין"
        : steps
    ),
    "קלוריות היום: " + calories,
    "חלבון היום: " + protein + " גרם",
    "תוספים: " + (
      day.supplements_taken.length
        ? day.supplements_taken.join(", ")
        : "לא דווח"
    )
  ];

  if (sleep && sleep.totalMinutes > 0) {
    lines.push(
      "שינה אחרונה: " +
      formatSleepDuration(sleep.totalMinutes)
    );
  } else {
    lines.push("שינה אחרונה: לא זמינה");
  }

  lines.push(
    "Heart Points 24ש: " +
    (
      heartPoints === null || heartPoints === undefined
        ? "לא זמין"
        : heartPoints
    )
  );

  lines.push(
    "Energy Expended 24ש: " +
    (
      energy === null || energy === undefined
        ? "לא זמין"
        : energy + " קק\"ל"
    )
  );

  return lines.join("\n");
}


/*
 * צור Trigger מסוג Time-driven עבור frequentCheck.
 * המלצה: פעם ב-2 או 3 שעות.
 */
function frequentCheck() {
  const props = PropertiesService.getScriptProperties();
  const chatId = String(
    props.getProperty("TELEGRAM_CHAT_ID") || ""
  );

  if (!chatId || !isAllowedChat(chatId)) {
    return;
  }

  const hour = getIsraelHour();

  if (hour < 8 || hour > 21) {
    return;
  }

  const todayStr = getIsraelDateString();
  const alertKey = "ALERT_SENT_" + todayStr + "_" + hour;

  if (props.getProperty(alertKey)) {
    return;
  }

  const fitupData = getFitUpData() || {};
  const steps = getCachedSteps();
  const sleep = getCachedSleep();
  const heartPoints = getCachedHeartPoints24h();
  const energy = getCachedEnergyExpended24h();
  const aiContext24h = getCachedAiContext24h();

  const tracking = Array.isArray(fitupData.tracking)
    ? fitupData.tracking
    : [];

  const trainedToday = tracking.some(function(item) {
    return item &&
      item.date === todayStr &&
      item.completed === true;
  });

  const nutrition = fitupData.nutrition || {};
  const day = normalizeNutritionDay(
    nutrition[todayStr] || {}
  );

  let calories = 0;
  let protein = 0;

  day.meals.forEach(function(meal) {
    calories += Number(meal.calories || 0);
    protein += Number(meal.protein || 0);
  });

  const sleepInfo =
    sleep && sleep.totalMinutes > 0
      ? formatSleepDuration(sleep.totalMinutes)
      : "לא זמין";

  const contextLite = aiContext24h
    ? JSON.stringify({
        summary: aiContext24h.summary || null,
        sessions: summarizeSessionsForPrompt(aiContext24h.sessions || []),
        hourly: {
          steps: summarizeHourlyForPrompt(
            aiContext24h.hourly && aiContext24h.hourly.steps
          ),
          energy: summarizeHourlyForPrompt(
            aiContext24h.hourly && aiContext24h.hourly.energy
          ),
          heartPoints: summarizeHourlyForPrompt(
            aiContext24h.hourly && aiContext24h.hourly.heartPoints
          )
        },
        nutritionToday: aiContext24h.nutritionToday || null
      })
    : "לא זמין";

  const instruction =
    "צור התראת פוש יזומה לשחקן. " +
    "אם אין סיבה טובה לשלוח הודעה, ענה רק SKIP. " +
    "אחרת כתוב עד 3 משפטים בעברית, בסגנון המערכת, " +
    "ללא בלוק NUTRITION. " +
    "השעה: " + hour + ". " +
    "אימון הושלם היום: " +
    (trainedToday ? "כן" : "לא") +
    ". צעדים ב-24 שעות: " +
    (
      steps === null || steps === undefined
        ? "לא ידוע"
        : steps
    ) +
    ". שינה אחרונה: " + sleepInfo +
    ". קלוריות היום: " + calories +
    ". חלבון היום: " + protein + " גרם. " +
    "Heart Points 24 שעות: " +
    (
      heartPoints === null || heartPoints === undefined
        ? "לא זמין"
        : heartPoints
    ) +
    ". Energy Expended 24 שעות: " +
    (
      energy === null || energy === undefined
        ? "לא זמין"
        : energy + " קק\"ל"
    ) +
    ". הקשר מורחב ל-24 שעות: " + contextLite + ".";

  try {
    const aiResponse = askGeminiAI(
      instruction,
      fitupData,
      steps,
      sleep,
      null,
      heartPoints,
      energy
    );

    const response = aiResponse
      .replace(/<NUTRITION>[\s\S]*?<\/NUTRITION>/gi, "")
      .trim();

    if (response && response.toUpperCase() !== "SKIP") {
      sendTelegramMessage(
        chatId,
        "התראת מערכת:\n" + response
      );

      props.setProperty(alertKey, String(Date.now()));
      cleanOldAlertKeys();
    }

  } catch (error) {
    console.error("frequentCheck error:", error);
  }
}

function cleanOldAlertKeys() {
  const props = PropertiesService.getScriptProperties();
  const allProperties = props.getProperties();
  const now = Date.now();

  Object.keys(allProperties).forEach(function(key) {
    if (key.indexOf("ALERT_SENT_") !== 0) {
      return;
    }

    const timestamp = Number(allProperties[key] || 0);

    if (
      timestamp &&
      now - timestamp > 3 * 24 * 60 * 60 * 1000
    ) {
      props.deleteProperty(key);
    }
  });
}


// ============================================================
// 19. פונקציות בדיקה
// ============================================================

function testTelegramSend() {
  sendTelegramMessage(
    "564841233",
    "בדיקה: הבוט הצליח לשלוח הודעה."
  );
}

function testDirectWebhook() {
  const testUpdate = {
    update_id: Date.now(),
    message: {
      message_id: 1,
      date: Math.floor(Date.now() / 1000),
      chat: {
        id: 564841233,
        type: "private"
      },
      from: {
        id: 564841233,
        is_bot: false,
        first_name: "Test"
      },
      text: "/start"
    }
  };

  handleTelegramWebhook(testUpdate);
}

function testAiContext24h() {
  Logger.log(JSON.stringify(getCachedAiContext24h(), null, 2));
}

function testStatus() {
  Logger.log(buildStatusMessage());
}

function testSleep() {
  Logger.log(buildSleepStatusMessage());
}

function testPrompt() {
  const fitupData = getFitUpData();
  const steps = getCachedSteps();
  const sleep = getCachedSleep();
  const heartPoints = getCachedHeartPoints24h();
  const energy = getCachedEnergyExpended24h();

  Logger.log(
    buildSystemPrompt(
      fitupData,
      steps,
      sleep,
      heartPoints,
      energy
    )
  );
}


function checkFitDataDebug() {
  const token = ScriptApp.getOAuthToken();
  const endTimeMillis = Date.now();
  
  console.log("--- מתחיל בדיקת עומק (שיטות ישנות) ---");
  
  // 1. שינה - שיטה ישנה (ללא קיבוץ)
  try {
    const sleepPayloadOld = {
      aggregateBy: [{ dataTypeName: "com.google.sleep.segment" }],
      startTimeMillis: endTimeMillis - 36 * 60 * 60 * 1000,
      endTimeMillis: endTimeMillis
    };
    const res = UrlFetchApp.fetch("https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate", {
      method: "post", headers: { Authorization: "Bearer " + token }, contentType: "application/json",
      payload: JSON.stringify(sleepPayloadOld), muteHttpExceptions: true
    });
    console.log("שינה (שיטה ישנה - סטטוס):", res.getResponseCode());
    console.log("שינה (שיטה ישנה - תוכן):", res.getContentText().substring(0, 300));
  } catch (e) { console.log("שגיאה:", e); }

  // 2. דופק - שיטה ישנה (Raw Dataset)
  try {
    const recentStartTime = endTimeMillis - (24 * 60 * 60 * 1000);
    const hrRes = UrlFetchApp.fetch(
      "https://www.googleapis.com/fitness/v1/users/me/dataSources/derived:com.google.heart_rate.bpm:com.google.android.gms:merge_heart_rate_bpm/datasets/" + recentStartTime + "000000-" + endTimeMillis + "000000",
      {
        method: "get", headers: { Authorization: "Bearer " + token }, muteHttpExceptions: true
      }
    );
    console.log("דופק (שיטה ישנה - סטטוס):", hrRes.getResponseCode());
    if (hrRes.getResponseCode() == 200) {
        const d = JSON.parse(hrRes.getContentText());
        console.log("דופק (שיטה ישנה - מספר נקודות דגימה שנמצאו):", d.point ? d.point.length : 0);
    } else {
        console.log("דופק (שיטה ישנה - תוכן):", hrRes.getContentText().substring(0, 300));
    }
  } catch (e) { console.log("שגיאה:", e); }
  
  console.log("--- סיום בדיקה ---");
}

