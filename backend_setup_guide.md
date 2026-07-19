# המדריך השלם והמקיף למערכת FitUp (טלגרם + דרייב + Google Fit + Gemini AI)

המדריך הזה הוא ה"תנ"ך" להקמת המוח המרכזי של אפליקציית FitUp שלך.
בסוף המדריך הזה השרת שלך יבצע 5 תפקידים בו-זמנית:
1. **שמירת נתונים מ-FitUp:** גיבוי ל-Google Drive.
2. **בוט טלגרם חכם:** מענה להודעות שלך בטלגרם.
3. **שאיבת נתונים מ-Google Fit:** קריאת נתוני צעדים/שינה ישירות מהחשבון שלך.
4. **מאמן AI (Gemini):** שילוב מודל הבינה המלאכותית של גוגל (Gemini) שמשחק את תפקיד "המערכת" (The System) ועונה לך על סמך הנתונים הפיזיולוגיים ונתוני האימון שלך.
5. **התראות בוקר:** טריגר יומי שיבקש מ-Gemini לנסח עבורך הודעת מוטיבציה על סמך הנתונים שלך וישלח לך אותה.

---

## חלק א': הכנות מוקדמות

### 1. יצירת בוט טלגרם
1. כנס לטלגרם וחפש את **@BotFather** (עם וי כחול).
2. שלח לו: `/newbot` ובחר שם ושם משתמש (חייב להסתיים ב-bot).
3. קיבלת **Token** (מחרוזת ארוכה) - **שמור אותו בצד!**

### 2. קבלת מפתח ל-Gemini AI
1. כנס לאתר [Google AI Studio](https://aistudio.google.com/app/apikey).
2. לחץ על כפתור **Create API key** (צור מפתח).
3. העתק את ה-**API Key** ושמור אותו בצד.

### 3. הפעלת ה-Google Fit API
1. כנס לאתר [Google Cloud Console](https://console.cloud.google.com).
2. צור פרויקט חדש (New Project), קרא לו "FitUp Backend".
3. בתפריט הצד, חפש **APIs & Services** ולחץ על **Library**.
4. חפש **Fitness API** ולחץ עליו -> בחר **Enable** (הפעל).
5. ממסך הבית של הפרויקט, העתק את ה-**Project Number** (מספר הפרויקט).

---

## חלק ב': הגדרות הרשאות לשרת (Google Apps Script)

1. כנס ל-Google Drive, צור או פתח את ה-Google Apps Script שלנו.
2. **חיבור ה-Fit:** לחץ בצד שמאל על גלגל השיניים ⚙️ (Project Settings).
   - תחת **Google Cloud Platform (GCP) Project**, לחץ על **Change project**.
   - הדבק את ה-**Project Number** (שהעתקת קודם) ולחץ Set Project.
   - סמן ב-V את האופציה: **"Show "appsscript.json" manifest file in editor"**.
3. חזור לעורך הקוד (סמל של קוד <code> בשמאל).
4. תראה קובץ חדש בשם `appsscript.json`. החלף את התוכן שלו בתוכן הבא:

```json
{
  "timeZone": "Asia/Jerusalem",
  "dependencies": {},
  "exceptionLogging": "STACKDRIVER",
  "oauthScopes": [
    "https://www.googleapis.com/auth/script.external_request",
    "https://www.googleapis.com/auth/drive",
    "https://www.googleapis.com/auth/fitness.activity.read",
    "https://www.googleapis.com/auth/fitness.sleep.read"
  ]
}
```

---

## חלק ג': הקוד המושלם לשרת (עם Gemini AI ופרומפט מובנה)

בעורך הקוד, עבור לקובץ `Code.gs`, מחק הכל והדבק את הקוד הבא.
**חשוב: החלף למעלה את שני הטוקנים (טלגרם ו-Gemini) לאלה ששמרת!**

```javascript
// ==========================================
// 1. מפתחות סודיים
// ==========================================
const TELEGRAM_BOT_TOKEN = "הכנס_כאן_את_הטוקן_של_הטלגרם";
const GEMINI_API_KEY = "הכנס_כאן_את_הטוקן_של_גימיני";
const FILENAME = "fitup_training_data.json";

// ==========================================
// 2. הפונקציה הראשית
// ==========================================
function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    if (data.update_id && (data.message || data.callback_query)) {
      return handleTelegramWebhook(data);
    }
    return handleFitUpSync(data);
  } catch (error) {
    try {
      var data = JSON.parse(e.postData.contents);
      sendTelegramMessage(data.message.chat.id, "🔥 קריסת מערכת בסיסית: " + error.message);
    } catch(e2) {}
    return ContentService.createTextOutput(JSON.stringify({ error: error.message })).setMimeType(ContentService.MimeType.JSON);
  }
}

// ==========================================
// 3. סינכרון אפליקציית FitUp
// ==========================================
function handleFitUpSync(data) {
  var files = DriveApp.getFilesByName(FILENAME);
  var file = files.hasNext() ? files.next() : DriveApp.createFile(FILENAME, "", MimeType.PLAIN_TEXT);
  file.setContent(JSON.stringify(data));
  return ContentService.createTextOutput(JSON.stringify({status: 'success'})).setMimeType(ContentService.MimeType.JSON);
}

// ==========================================
// 4. בוט טלגרם + חיבור ל-Gemini
// ==========================================
function handleTelegramWebhook(update) {
  var message = update.message;
  if (!message) return HtmlService.createHtmlOutput("OK");
  
  var text = message.text || message.caption || "";
  var photo = message.photo;
  
  if (!text && !photo) return HtmlService.createHtmlOutput("OK");
  if (photo && !text) {
    text = "העליתי תמונה. תנתח אותה. אם זה אוכל תן לי הערכה מדויקת של קלוריות וחלבון ותרשום אותם בבלוק התזונה.";
  }
  
  // === מניעת כפילויות: בדיקת update_id ===
  var updateId = String(update.update_id);
  var props = PropertiesService.getScriptProperties();
  var lastUpdateId = props.getProperty("LAST_UPDATE_ID");
  
  if (lastUpdateId === updateId) {
    return HtmlService.createHtmlOutput("OK");
  }
  props.setProperty("LAST_UPDATE_ID", updateId);
  
  var chatId = message.chat.id;
  
  props.setProperty("TELEGRAM_CHAT_ID", chatId.toString());
  
  if (text === "/start") {
    sendTelegramMessage(chatId, "התחברות לשרתי המערכת בוצעה בהצלחה... 'המערכת' מאזינה לך כעת. ⚡️");
  } 
  else {
    try {
      var base64Image = null;
      if (photo && photo.length > 0) {
        sendTelegramMessage(chatId, "המערכת מפעילה סורק ויזואלי... 👁️");
        base64Image = getTelegramPhotoBase64(photo);
      }
      
      var fitupData = getFitUpData();
      var steps = getCachedSteps();
      var aiResponse = askGeminiAI(text, fitupData, steps, base64Image);
      
      // === חילוץ נתוני תזונה (Nutrition Parsing) ===
      var nutritionMatch = aiResponse.match(/\[NUTRITION:\s*([\s\S]*?)\]/);
      if (nutritionMatch && nutritionMatch[1]) {
        try {
          var nutritionData = JSON.parse(nutritionMatch[1]);
          fitupData = updateNutritionData(fitupData, nutritionData);
          saveFitUpData(fitupData);
          aiResponse = aiResponse.replace(/\[NUTRITION:\s*([\s\S]*?)\]/g, "").trim();
        } catch(e) {
          // כשל בפרסור, לא נורא
        }
      }
      
      sendTelegramMessage(chatId, aiResponse);  
    } catch (err) {
      sendTelegramMessage(chatId, "🚨 התגלתה שגיאה בקוד בעת העיבוד: " + err.message);
    }
  }
  return HtmlService.createHtmlOutput("OK");
}

// ==========================================
// 5. המוח של המערכת (Gemini AI) - גרסת מאסטר
// ==========================================
function askGeminiAI(userMessage, fitupData, steps, base64Image) {
  var url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=" + GEMINI_API_KEY;

  var systemPrompt = "אתה 'המערכת' (The System), ישות AI עילאית המלווה את השחקן באפליקציית FitUp (בסגנון משחק תפקידים RPG ו-Solo Leveling). " +
    "המטרה שלך: להפוך את המשתמש לגרסה החזקה ביותר של עצמו, ולהדריך אותו לחיים טובים, בריאים ועוצמתיים יותר. " +
    "סגנון הדיבור: חכם, עוטף אבל סמכותי. אתה כמו מנטור חזק שמגן על השחקן ודוחף אותו קדימה באהבה קשוחה. תענה תמיד בעברית קצרה, מדויקת וקולעת (מקסימום 4 משפטים), ותן לו תחושה שהוא גיבור שמתחזק מיום ליום. " +
    "הוראות קריטיות - אופן הפעולה של האפליקציה: " +
    "1. אימוני השחקן מחולקים לסוגים: Legs + Core, Push + Skill, Pull + Grip, Active Recovery (אירובי/מתיחות). " +
    "2. הציוד שיש לשחקן בבית בלבד: משקל גוף (מתח, מקבילים, רצפה) וגומיות התנגדות (Band) של 30קג, 40קג ו-50קג. לעולם אל תציע תרגילים עם משקולות חופשיות או מכונות כושר! " +
    "3. השחקן מתקדם במיומנויות (Skill Tree) ולכן חשוב לתת דגש על טכניקה, התאוששות שריר, ושליטה מוטורית. " +
    "4. אם הוא מתלונן על כאב: הצע פרוטוקול התאוששות ספציפי למשקל גוף. אם הוא מבקש תרגיל - התאם אותו לציוד שלו. " +
    "5. תזונה: אם השחקן מדווח על אוכל (קלוריות/חלבון), תוסף, או שולח תמונת אוכל, הגב לו על זה ובנוסף - הוסף *בסוף* התשובה בדיוק את הבלוק הבא: [NUTRITION: {\"meal_name\": \"שם האוכל\", \"calories\": מספר, \"protein\": מספר, \"supplements_taken\": [\"שם\"], \"bonus_supplements\": {\"שם תוסף\": כמות_במספר_רציף}}] (למשל אם אכל דג/בשר, הוסף בונוס של אומגה 3 או קריאטין בגרמים ב-bonus_supplements. אם אין בונוס השאר אובייקט ריק). " +
    "הנה נתוני השחקן כרגע:\n";
                     
  if (fitupData) {
    var level = fitupData.settings ? (fitupData.settings.level || 1) : 1;
    var xp = fitupData.settings ? (fitupData.settings.xp || 0) : 0;
    systemPrompt += "- סטטוס שחקן: רמה " + level + " | נקודות ניסיון: " + xp + ".\n";
    
    if (fitupData.tracking && fitupData.tracking.length > 0) {
      var completedCount = 0;
      var currentDayType = fitupData.plan && fitupData.plan.length > 0 ? fitupData.plan[0].dayType : "לא ידוע";
      
      for (var i = Math.max(0, fitupData.tracking.length - 7); i < fitupData.tracking.length; i++) {
        if (fitupData.tracking[i].completed) completedCount++;
      }
      systemPrompt += "- אימונים שהושלמו בשבוע האחרון: " + completedCount + ".\n";
      if(fitupData.tracking[fitupData.tracking.length-1]) {
          systemPrompt += "- אימון אחרון במערכת: " + fitupData.tracking[fitupData.tracking.length-1].dayType + ".\n";
      }
    }
    
    // הוספת סטטוס תזונה להיום
    var todayStr = new Date().toISOString().split('T')[0];
    if (fitupData.nutrition && fitupData.nutrition[todayStr]) {
       var n = fitupData.nutrition[todayStr];
       systemPrompt += "- תזונה שדווחה היום: " + n.calories + " קלוריות, " + n.protein + " גרם חלבון. תוספים: " + (n.supplements.length > 0 ? n.supplements.join(", ") : "אין עדיין") + ".\n";
    } else {
       systemPrompt += "- תזונה היום: טרם דווח.\n";
    }
  } else {
    systemPrompt += "- נתוני אפליקציה: לא זמינים כרגע.\n";
  }
  
  systemPrompt += "- צעדים שבוצעו היום: " + (steps !== null ? steps : "לא זמין") + ".\n\n";
  systemPrompt += "הוראת עיצוב: ענה בטקסט נקי. אל תשתמש בסימני כוכביות (**) בשום אופן.";
  
  var userParts = [{ "text": userMessage }];
  if (base64Image) {
    userParts.push({
      "inline_data": {
        "mime_type": "image/jpeg",
        "data": base64Image
      }
    });
  }
  
  var payload = {
    "system_instruction": { "parts": [{ "text": systemPrompt }] },
    "contents": [{ "role": "user", "parts": userParts }],
    "generationConfig": { 
      "temperature": 0.85, 
      "topK": 40,
      "topP": 0.95
    } 
  };
  
  try {
    var response = UrlFetchApp.fetch(url, {
      method: "post",
      contentType: "application/json",
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    });
    
    var json = JSON.parse(response.getContentText());
    if (json.error) return "שגיאת ג'מיני: " + json.error.message;
    if (json.candidates && json.candidates.length > 0) {
      var text = json.candidates[0].content.parts[0].text;
      return text.replace(/\*\*/g, '').replace(/\*/g, '');
    }
    return "המערכת שותקת כעת.";
  } catch (e) {
    return "שגיאת רשת בחיבור לליבת ה-AI.";
  }
}

// ==========================================
// 6. פונקציות עזר 
// ==========================================
function getTelegramPhotoBase64(photoArray) {
  try {
    var fileId = photoArray[photoArray.length - 1].file_id;
    var getFileUrl = "https://api.telegram.org/bot" + TELEGRAM_BOT_TOKEN + "/getFile?file_id=" + fileId;
    var fileResponse = UrlFetchApp.fetch(getFileUrl);
    var fileJson = JSON.parse(fileResponse.getContentText());
    
    if (fileJson.ok && fileJson.result && fileJson.result.file_path) {
      var filePath = fileJson.result.file_path;
      var downloadUrl = "https://api.telegram.org/file/bot" + TELEGRAM_BOT_TOKEN + "/" + filePath;
      var imageBlob = UrlFetchApp.fetch(downloadUrl).getBlob();
      return Utilities.base64Encode(imageBlob.getBytes());
    }
  } catch(e) {
    return null;
  }
  return null;
}
function updateNutritionData(data, newNutrition) {
  if (!data) data = {};
  if (!data.nutrition) data.nutrition = {};
  
  var now = new Date();
  var todayStr = now.toISOString().split('T')[0];
  if (!data.nutrition[todayStr]) {
    data.nutrition[todayStr] = { meals: [], supplements_taken: [] };
  }
  
  var todayData = data.nutrition[todayStr];
  
  // Backwards compatibility migration (in case today already has old structure)
  if (typeof todayData.calories === 'number') {
    var oldCalories = todayData.calories || 0;
    var oldProtein = todayData.protein || 0;
    var oldSupps = todayData.supplements || [];
    todayData.meals = [];
    if (oldCalories > 0 || oldProtein > 0) {
      todayData.meals.push({ id: "legacy", name: "דיווחים קודמים", calories: oldCalories, protein: oldProtein, time: "00:00" });
    }
    todayData.supplements_taken = oldSupps;
    delete todayData.calories;
    delete todayData.protein;
    delete todayData.supplements;
  }
  
  var currentHour = now.getHours().toString().padStart(2, '0') + ":" + now.getMinutes().toString().padStart(2, '0');
  
  if (newNutrition.calories || newNutrition.protein || newNutrition.meal_name || (newNutrition.bonus_supplements && Object.keys(newNutrition.bonus_supplements).length > 0)) {
    var mealName = newNutrition.meal_name || "ארוחה שדווחה לבוט";
    todayData.meals.push({
      id: "meal_" + new Date().getTime(),
      name: mealName,
      calories: newNutrition.calories || 0,
      protein: newNutrition.protein || 0,
      time: currentHour,
      bonus: newNutrition.bonus_supplements || {}
    });
  }
  
  if (newNutrition.supplements_taken && Array.isArray(newNutrition.supplements_taken)) {
    newNutrition.supplements_taken.forEach(function(sup) {
      if (todayData.supplements_taken.indexOf(sup) === -1) {
        todayData.supplements_taken.push(sup);
      }
    });
  }
  
  return data;
}

function saveFitUpData(data) {
  var files = DriveApp.getFilesByName(FILENAME);
  var file = files.hasNext() ? files.next() : DriveApp.createFile(FILENAME, "", MimeType.PLAIN_TEXT);
  file.setContent(JSON.stringify(data));
}
function getFitUpData() {
  try {
    var files = DriveApp.getFilesByName(FILENAME);
    if (!files.hasNext()) return null;
    var data = files.next().getBlob().getDataAsString();
    if (!data || data.trim() === "") return null;
    return JSON.parse(data);
  } catch (e) {
    return null;
  }
}

function getCachedSteps() {
  var props = PropertiesService.getScriptProperties();
  var cachedData = props.getProperty("CACHED_STEPS");
  
  if (cachedData) {
    try {
      var parsed = JSON.parse(cachedData);
      var age = Date.now() - parsed.timestamp;
      if (age < 30 * 60 * 1000) {
        return parsed.steps;
      }
    } catch(e) {}
  }
  
  var steps = fetchGoogleFitSteps();
  props.setProperty("CACHED_STEPS", JSON.stringify({
    steps: steps,
    timestamp: Date.now()
  }));
  return steps;
}

function fetchGoogleFitSteps() {
  try {
    var token = ScriptApp.getOAuthToken();
    var endTimeMillis = new Date().getTime();
    var startTimeMillis = endTimeMillis - (24 * 60 * 60 * 1000); 
    var payload = {
      "aggregateBy": [{
        "dataTypeName": "com.google.step_count.delta",
        "dataSourceId": "derived:com.google.step_count.delta:com.google.android.gms:estimated_steps"
      }],
      "bucketByTime": { "durationMillis": 86400000 },
      "startTimeMillis": startTimeMillis,
      "endTimeMillis": endTimeMillis
    };
    var response = UrlFetchApp.fetch("https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate", {
      method: "post",
      headers: { "Authorization": "Bearer " + token },
      contentType: "application/json",
      payload: JSON.stringify(payload)
    });
    var data = JSON.parse(response.getContentText());
    if (data.bucket && data.bucket[0] && data.bucket[0].dataset[0].point.length > 0) {
      return data.bucket[0].dataset[0].point[0].value[0].intVal;
    }
    return 0;
  } catch(e) { 
    return null; 
  }
}

function sendTelegramMessage(chatId, text) {
  try {
    var response = UrlFetchApp.fetch("https://api.telegram.org/bot" + TELEGRAM_BOT_TOKEN + "/sendMessage", {
      method: "post",
      contentType: "application/json",
      payload: JSON.stringify({ chat_id: chatId, text: text }), 
      muteHttpExceptions: true
    });
    var result = JSON.parse(response.getContentText());
    if (!result.ok) {
      UrlFetchApp.fetch("https://api.telegram.org/bot" + TELEGRAM_BOT_TOKEN + "/sendMessage", {
        method: "post",
        contentType: "application/json",
        payload: JSON.stringify({ chat_id: chatId, text: "תקלת שליחה: " + result.description })
      });
    }
  } catch(e) {}
}

function setupWebhook() {
  var webAppUrl = "הכנס_כאן_את_הכתובת_שלך_מהפריסה"; 
  UrlFetchApp.fetch("https://api.telegram.org/bot" + TELEGRAM_BOT_TOKEN + "/setWebhook?url=" + webAppUrl + "&drop_pending_updates=true");
}

function doGet(e) {
  var files = DriveApp.getFilesByName(FILENAME);
  if (files.hasNext()) {
    return ContentService.createTextOutput(files.next().getBlob().getDataAsString()).setMimeType(ContentService.MimeType.JSON);
  }
  return ContentService.createTextOutput(JSON.stringify({})).setMimeType(ContentService.MimeType.JSON);
}

// ==========================================
// 7. התראות יזומות (שעון מעורר של המערכת)
// ==========================================
function frequentCheck() {
  var chatId = PropertiesService.getScriptProperties().getProperty("TELEGRAM_CHAT_ID");
  if (!chatId) return; 
  
  var steps = fetchGoogleFitSteps();
  // מעדכנים את הקאש בכל בדיקה תזמונית
  PropertiesService.getScriptProperties().setProperty("CACHED_STEPS", JSON.stringify({
    steps: steps,
    timestamp: Date.now()
  }));
  
  var fitupData = getFitUpData();
  var currentHour = new Date().getHours();
  
  if (currentHour < 11 || currentHour > 21) return;  

  var trainedToday = false;
  if (fitupData && fitupData.tracking && fitupData.tracking.length > 0) {
    var lastWorkout = fitupData.tracking[fitupData.tracking.length - 1];
    var todayStr = new Date().toISOString().split('T')[0];
    if (lastWorkout.date === todayStr && lastWorkout.completed) {
      trainedToday = true;
    }
  }

  var nutritionStr = "אין דיווח תזונה להיום";
  var suppsRoutine = fitupData && fitupData.settings && fitupData.settings.supplementsRoutine ? fitupData.settings.supplementsRoutine : [];
  
  if (fitupData && fitupData.nutrition && fitupData.nutrition[todayStr]) {
    var n = fitupData.nutrition[todayStr];
    var totalCals = 0;
    var totalProtein = 0;
    if (n.meals && Array.isArray(n.meals)) {
      n.meals.forEach(function(m) { 
        totalCals += (m.calories || 0); 
        totalProtein += (m.protein || 0); 
      });
    }
    var taken = (n.supplements_taken && n.supplements_taken.length > 0) ? n.supplements_taken.join(", ") : "טרם נלקחו";
    nutritionStr = totalCals + " קלוריות, " + totalProtein + " גרם חלבון. תוספים שנלקחו: " + taken;
  }

  var hasMorningSupps = suppsRoutine.some(function(s) { 
      var h = parseInt((s.timeToTake || "09:00").split(':')[0]); 
      return h < 12; 
  });

  var stepStatus = (steps < 3000) ? "מעט מאוד צעדים, השחקן נייח לחלוטין" : (steps > 8000 ? "כמות צעדים יפה" : "תנועה סבירה, אבל יש מקום לשיפור");
  
  var checkInstruction = "פרומפט מערכת שקט - אל תענה על השאלה הזו כמו בשיחה, אלא נסח הודעת 'פוש' יזומה שתשלח לשחקן פתאום.\n" + 
    "השעה כעת: " + currentHour + ":00. \n" + 
    "סטטוס אימון להיום: " + (trainedToday ? "הושלם! השחקן כבר עשה את האימון שלו היום." : "לא הושלם. השחקן עדיין לא התאמן היום!") + "\n" +
    "סטטוס תנועה להיום: " + steps + " צעדים (" + stepStatus + ").\n" +
    "סטטוס תזונה להיום: " + nutritionStr + ".\n\n" +
    "ההנחיות שלך לפי הזמן הנוכחי:\n" +
    "1. בוקר (08:00-11:00): אם לא התאמן, תן מכת מחץ מוטיבציונית. " + (hasMorningSupps ? "ודא שלקח תוספי בוקר / קריאטין.\n" : "אין תוספי בוקר ברשימה, אל תזכיר תוספים כעת.\n") +
    "2. צהריים (12:00-16:00): אם עדיין לא התאמן ויש לו מעט צעדים, 'בעט' בו. ודא שהוא אוכל מספיק חלבון.\n" +
    "3. ערב (17:00-21:00): קריאה אחרונה לאימון. נזוף בו קלות אם חסר חלבון יומיומי.\n" +
    "4. לילה או זמן לא רלוונטי: אם אין צורך בשום הודעה - פשוט תענה את המילה באנגלית SKIP וזהו.\n\n" +
    "חשוב: ההודעה צריכה להיות פתאומית, קצרה (גג 3 משפטים), אכזרית אבל מדרבנת, ותפורה לנתונים האלה בדיוק.";
    
  var aiResponse = askGeminiAI(checkInstruction, fitupData, steps);
  
  if (aiResponse.trim().toUpperCase() !== "SKIP" && !aiResponse.includes("SKIP")) {
    sendTelegramMessage(chatId, "⚡️ התראת מערכת: " + aiResponse);
  }
}

```

---

## חלק ד': פריסה והפעלה
1. למעלה בסקריפט לחץ **Deploy** -> **New deployment**.
2. בחר **Web app**.
3. **Execute as:** `Me` (חשוב!).
4. **Who has access:** `Anyone`.
5. לחץ **Deploy** ואשר את ההרשאות.
6. העתק את ה-**Web app URL**.

---

## חלק ה': חיבור ה-Webhook (סיום)
1. גלול בקוד לפונקציה `setupWebhook()`.
2. הדבק את ה-**Web app URL** שהעתקת.
3. בחר בסרגל למעלה את `setupWebhook` ולחץ **Run**.

---

## חלק ו': הגדרת בדיקות תכופות (המוח היזום של המערכת)
1. ב-Apps Script, לחץ על סמל השעון ⏰ (**Triggers**).
2. לחץ **Add Trigger** למטה.
3. בחר בפונקציה: `frequentCheck`.
4. בחר Event source כ-`Time-driven` -> `Hour timer` -> `Every 2 hours` (או כל כמה שעות שתרצה).
5. שמור! המערכת תתעורר כל שעתיים, תבדוק את המדדים, ותיתן ל-Gemini להחליט האם זה זמן טוב לשלוח לך התראת מוטיבציה או לשמור על שקט.
