
// ==========================================
// 8. ניהול תזונה ותוספים (זיכרון מקומי)
// ==========================================
function getTodayDateStr() {
  return new Date().toLocaleString('en-CA', {timeZone: 'Asia/Jerusalem'}).split(',')[0];
}

function cleanOldData(dataObj) {
  var now = new Date().getTime();
  var result = {};
  for (var dateStr in dataObj) {
    var dateObj = new Date(dateStr);
    if (!isNaN(dateObj.getTime())) {
      var diffDays = (now - dateObj.getTime()) / (1000 * 3600 * 24);
      if (diffDays <= 2) { // שומר נתונים של יומיים אחרונים בלבד
        result[dateStr] = dataObj[dateStr];
      }
    }
  }
  return result;
}

function getNutritionData() {
  var props = PropertiesService.getScriptProperties();
  var data = props.getProperty("NUTRITION_DATA");
  return data ? cleanOldData(JSON.parse(data)) : {};
}

function logNutrition(calories, protein) {
  var data = getNutritionData();
  var today = getTodayDateStr();
  if (!data[today]) data[today] = { cal: 0, pro: 0 };
  data[today].cal += parseInt(calories) || 0;
  data[today].pro += parseInt(protein) || 0;
  PropertiesService.getScriptProperties().setProperty("NUTRITION_DATA", JSON.stringify(data));
}

function getSupplementsInventory() {
  var props = PropertiesService.getScriptProperties();
  var data = props.getProperty("SUPPLEMENTS_INVENTORY");
  // ברירת מחדל אם אין רשימה
  if (!data) return ["אומגה 3", "מולטי ויטמין", "מגנזיום", "קריאטין", "חלבון"]; 
  return JSON.parse(data);
}

function addSupplement(name) {
  var inv = getSupplementsInventory();
  if (inv.indexOf(name) === -1) inv.push(name);
  PropertiesService.getScriptProperties().setProperty("SUPPLEMENTS_INVENTORY", JSON.stringify(inv));
}

function removeSupplement(name) {
  var inv = getSupplementsInventory();
  inv = inv.filter(function(item) { return item.trim() !== name.trim(); });
  PropertiesService.getScriptProperties().setProperty("SUPPLEMENTS_INVENTORY", JSON.stringify(inv));
}

function getSupplementsTaken() {
  var props = PropertiesService.getScriptProperties();
  var data = props.getProperty("SUPPLEMENTS_TAKEN");
  return data ? cleanOldData(JSON.parse(data)) : {};
}

function takeSupplement(name) {
  var data = getSupplementsTaken();
  var today = getTodayDateStr();
  if (!data[today]) data[today] = [];
  if (data[today].indexOf(name) === -1) data[today].push(name);
  PropertiesService.getScriptProperties().setProperty("SUPPLEMENTS_TAKEN", JSON.stringify(data));
}

function parseSystemCommands(text) {
  var cleanText = text;
  var logFoodRegex = /\[LOG_FOOD:\s*(\d+)\s*,\s*(\d+)\]/g;
  var addSuppRegex = /\[ADD_SUPP:\s*([^\]]+)\]/g;
  var rmSuppRegex = /\[RM_SUPP:\s*([^\]]+)\]/g;
  var takeSuppRegex = /\[TAKE_SUPP:\s*([^\]]+)\]/g;
  
  var match;
  while ((match = logFoodRegex.exec(text)) !== null) {
    logNutrition(match[1], match[2]);
  }
  while ((match = addSuppRegex.exec(text)) !== null) {
    addSupplement(match[1]);
  }
  while ((match = rmSuppRegex.exec(text)) !== null) {
    removeSupplement(match[1]);
  }
  while ((match = takeSuppRegex.exec(text)) !== null) {
    takeSupplement(match[1]);
  }
  
  // מחיקת הפקודות מהטקסט
  cleanText = cleanText.replace(/\[LOG_FOOD:[^\]]+\]/g, "");
  cleanText = cleanText.replace(/\[ADD_SUPP:[^\]]+\]/g, "");
  cleanText = cleanText.replace(/\[RM_SUPP:[^\]]+\]/g, "");
  cleanText = cleanText.replace(/\[TAKE_SUPP:[^\]]+\]/g, "");
  
  return cleanText.trim();
}
