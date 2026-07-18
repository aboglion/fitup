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
// 1. מפתחות סודיים (חובה לעדכן!)
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
    return ContentService.createTextOutput(JSON.stringify({ error: error.message })).setMimeType(ContentService.MimeType.JSON);
  }
}

// ==========================================
// 3. סינכרון אפליקציית FitUp (שמירה לדרייב)
// ==========================================
function handleFitUpSync(data) {
  var files = DriveApp.getFilesByName(FILENAME);
  var file = files.hasNext() ? files.next() : DriveApp.createFile(FILENAME, "", MimeType.PLAIN_TEXT);
  file.setContent(JSON.stringify(data));
  return ContentService.createTextOutput(JSON.stringify({status: 'success'}))
    .setMimeType(ContentService.MimeType.JSON);
}

// ==========================================
// 4. בוט טלגרם + חיבור ל-Gemini
// ==========================================
function handleTelegramWebhook(update) {
  var message = update.message;
  if (!message || !message.text) return ContentService.createTextOutput("OK");
  
  var chatId = message.chat.id;
  var text = message.text;
  
  if (text === "/start") {
    PropertiesService.getScriptProperties().setProperty("TELEGRAM_CHAT_ID", chatId.toString());
    sendTelegramMessage(chatId, "התחברות לשרתי המערכת בוצעה בהצלחה... 'המערכת' (The System) מאזינה לך כעת. ⚡️");
  } 
  else {
    // שולפים את נתוני המשתמש ומעבירים אותם ישירות ל-Gemini!
    var fitupData = getFitUpData();
    var steps = fetchGoogleFitSteps();
    var aiResponse = askGeminiAI(text, fitupData, steps);
    
    sendTelegramMessage(chatId, aiResponse);
  }
  
  return ContentService.createTextOutput("OK");
}

// ==========================================
// 5. המוח של המערכת (Gemini AI API)
// ==========================================
function askGeminiAI(userMessage, fitupData, steps) {
  var url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=" + GEMINI_API_KEY;
  
  // -- הפרומפט המרכזי של "המערכת" (System Prompt) --
  var systemPrompt = "אתה 'המערכת' (The System), עוזר AI וירטואלי בעולם כושר בסגנון משחק תפקידים (בדומה ל-Solo Leveling). " +
                     "הטון שלך הוא קר, מקצועי, מסתורי אבל גם דוחף את המשתמש למצוינות, להפוך לחזק יותר ולעלות רמות. " +
                     "תמיד תענה בעברית, תשובות קצרות וקולעות (מקסימום 3-4 משפטים). אל תחפור. " +
                     "הנה הנתונים הנוכחיים של השחקן מתוך אפליקציית FitUp וגוגל פיט: ";
                     
  if (fitupData && fitupData.settings) {
    systemPrompt += "[רמה נוכחית: " + (fitupData.settings.level || 1) + ", נקודות ניסיון XP: " + (fitupData.settings.xp || 0) + "]. ";
  }
  systemPrompt += "[צעדים שבוצעו לאחרונה: " + (steps !== null ? steps : "לא ידוע") + "]. ";
  
  var payload = {
    "system_instruction": { "parts": [{ "text": systemPrompt }] },
    "contents": [{ "role": "user", "parts": [{ "text": userMessage }] }],
    "generationConfig": { "temperature": 0.7 } // יצירתיות
  };
  
  try {
    var response = UrlFetchApp.fetch(url, {
      method: "post",
      contentType: "application/json",
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    });
    
    var json = JSON.parse(response.getContentText());
    if (json.candidates && json.candidates.length > 0) {
      return json.candidates[0].content.parts[0].text;
    }
    return "שגיאת מערכת: לא ניתן לעבד נתונים כעת.";
  } catch (e) {
    return "שגיאת מערכת חמורה בחיבור לליבת ה-AI.";
  }
}

// ==========================================
// 6. התראות יזומות (בדיקה תכופה חכמה)
// ==========================================
function frequentCheck() {
  var chatId = PropertiesService.getScriptProperties().getProperty("TELEGRAM_CHAT_ID");
  if (!chatId) return; 
  
  var steps = fetchGoogleFitSteps();
  var fitupData = getFitUpData();
  var currentHour = new Date().getHours();
  
  // פרומפט מיוחד: נותנים ל-AI להחליט האם להציק למשתמש עכשיו!
  var checkInstruction = "השעה כעת היא " + currentHour + ":00. המטרה שלך היא לבדוק האם צריך להעיר את המשתמש. " +
    "אם בוקר (8-10): נסח הודעת מוטיבציה חזקה לפתיחת היום. " +
    "אם צהריים (13-16) ויש מעט צעדים: תן לו 'בעיטה' לקום מהכיסא. " +
    "אם ערב (18-21): בדוק או שאל האם הוא השלים את אימון היום. " +
    "אם השעה היא לא בין השעות האלה, או שאין לך משהו חשוב להגיד - תענה אך ורק את המילה האנגלית: SKIP (בלי שום מילה נוספת). " +
    "אם החלטת לשלוח הודעה, דבר בסגנון קר וסמכותי של 'המערכת'.";
    
  var aiResponse = askGeminiAI(checkInstruction, fitupData, steps);
  
  // אם Gemini החליט שאין צורך בהודעה עכשיו, הוא יחזיר SKIP ואנחנו נעצור
  if (aiResponse.trim().toUpperCase() !== "SKIP" && !aiResponse.includes("SKIP")) {
    sendTelegramMessage(chatId, "⚡️ " + aiResponse);
  }
}

// ==========================================
// 7. פונקציות עזר 
// ==========================================
function getFitUpData() {
  var files = DriveApp.getFilesByName(FILENAME);
  if (!files.hasNext()) return null;
  var data = files.next().getBlob().getDataAsString();
  if (!data || data.trim() === "") return null;
  try {
    return JSON.parse(data);
  } catch (e) {
    return null;
  }
}

function sendTelegramMessage(chatId, text) {
  UrlFetchApp.fetch("https://api.telegram.org/bot" + TELEGRAM_BOT_TOKEN + "/sendMessage", {
    method: "post",
    contentType: "application/json",
    payload: JSON.stringify({ chat_id: chatId, text: text, parse_mode: "Markdown" })
  });
}

function fetchGoogleFitSteps() {
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
  
  try {
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
  } catch(e) { return null; }
}

function setupWebhook() {
  var webAppUrl = "הכנס_כאן_את_הכתובת_שלך_מהפריסה"; 
  UrlFetchApp.fetch("https://api.telegram.org/bot" + TELEGRAM_BOT_TOKEN + "/setWebhook?url=" + webAppUrl);
}

// ==========================================
// 8. משיכת נתונים לאפליקציה (doGet)
// ==========================================
function doGet(e) {
  var files = DriveApp.getFilesByName(FILENAME);
  if (files.hasNext()) {
    return ContentService.createTextOutput(files.next().getBlob().getDataAsString()).setMimeType(ContentService.MimeType.JSON);
  }
  return ContentService.createTextOutput(JSON.stringify({})).setMimeType(ContentService.MimeType.JSON);
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
