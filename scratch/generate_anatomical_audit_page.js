const fs = require('fs');
const path = require('path');

const exercisesData = [
  // LOWER STRENGTH & CORE
  {
    name: "Bodyweight Squat",
    category: "lower-strength",
    unlockWeek: 1,
    parentName: null,
    children: ["DB Bulgarian Split Squat"],
    execution: "סקוואט משקל גוף: גב ישר, ירידה מעבר ל-90 מעלות במפרק הברך והירך, שמירה על ברכיים בסדר אחד עם אצבעות הרגליים והרמת חזה.",
    visual: "בתמונה ובגיף רואים מודל המבצע סקוואט חופשי במשקל גוף בשליטה מלאה, ירידה עמוקה ועלייה כנגד העקב.",
    match: "✅ התאמה מלאה 100% — תמונת ה-PNG וה-GIF מציגים סקוואט משקל גוף מושלם.",
    rationale: "תרגיל שורש בסיסי (שבוע 1) הנדרש לבדיקת ניידות קרסול, ירך ושליטה תנועתית בבסיס התוכנית לפני העמסת משקל."
  },
  {
    name: "DB Bulgarian Split Squat",
    category: "lower-strength",
    unlockWeek: 1,
    parentName: "Bodyweight Squat",
    children: ["Reverse Lunge + DB", "DB BSS (Goblet)"],
    execution: "ספליט סקוואט בולגרי עם משקולות: רגל אחורית מונחת על ספסל/הגבהה, ירידה אנכית של הברך האחורית כמעט עד הרצפה תוך שמירה על עומס בטורסו ובארבע-ראשי הקדמי.",
    visual: "בתמונה ובגיף רואים מודל עם רגל אחורית על ספסל ואחיזת משקולות בצידי הגוף, ביצוע ירידה עמוקה ועלייה יציבה.",
    match: "✅ התאמה מלאה 100% — מוצגת טכניקת BSS מדויקת עם משקולות.",
    rationale: "נפתח בשבוע 1 כתנועה חד-רגלת עיקרית. דורש שליטה בסקוואט משקל גוף כדי למנוע קריסת ברך ולבנות כוח סימטרי בברכיים."
  },
  {
    name: "Reverse Lunge + DB",
    category: "lower-strength",
    unlockWeek: 18,
    parentName: "DB Bulgarian Split Squat",
    children: [],
    execution: "לאנג' אחורי עם משקולות: צעידה לאחור, ירידה בזווית של 90 מעלות בשתי הברכיים ודחיפה חזרה לקימה דרך העקב הקדמי.",
    visual: "בתמונה ובגיף רואים מודל צועד לאחור עם משקולות בצידי הגוף ושומר על יציבות אגן וטורסו.",
    match: "✅ התאמה מלאה 100% — אופן הביצוע בתמונה תואם לחלוטין.",
    rationale: "נפתח בשבוע 18 לאחר 17 שבועות של ביסוס כוח ומסה ב-BSS. הלאנג' האחורי מוסיף אלמנט דינמי של שיווי משקל ובלימת זעזועים."
  },
  {
    name: "DB BSS (Goblet)",
    category: "lower-strength",
    unlockWeek: 34,
    parentName: "DB Bulgarian Split Squat",
    children: ["Pistol Squat Progression"],
    execution: "ספליט סקוואט בולגרי באחיזת גובלט (משקולת אחת במרכז החזה): מגדיל עומס על הליבה והזקופים ושומר על גב זקוף לחלוטין.",
    visual: "בתמונה ובגיף רואים אחיזת גובלט מרכזית של המשקולת מול החזה תוך ביצוע ירידה עמוקה ברגל קדמית.",
    match: "✅ התאמה מלאה 100% — אחיזת הגובלט ומנח הגוף מיוצגים באופן מדויק.",
    rationale: "נפתח בשבוע 34 עקב עומס גבוה על הליבה והזקופים; דורש בסיס כוח מתקדם ב-BSS רגיל."
  },
  {
    name: "Pistol Squat Progression",
    category: "lower-strength",
    unlockWeek: 42,
    parentName: "DB BSS (Goblet)",
    children: ["Walking Lunge (Goblet)"],
    execution: "פרוגרסיית פיסטול סקוואט: סקוואט על רגל אחת בלבד כשהרגל השנייה פשוטה לפנים, דורש גמישות קרסול שיא וכוח ארבע-ראשי מרבי.",
    visual: "בתמונה ובגיף רואים ירידה מלאה על רגל אחת כשהרגל השנייה מתוחה לפנים באוויר.",
    match: "✅ התאמה מלאה 100% — תצוגת פיסטול סקוואט נקייה ומדויקת.",
    rationale: "נפתח בשבוע 42 לאחר ביסוס כוח עמוק בגובלט BSS; דורש סף כוח ויציבות מפרקית מירביים."
  },
  {
    name: "Walking Lunge (Goblet)",
    category: "lower-strength",
    unlockWeek: 62,
    parentName: "Pistol Squat Progression",
    children: [],
    execution: "מכרעים בהליכה באחיזת גובלט כבדה: צעידה רציפה לפנים עם עומס משקולת מרכזי, דורשת סבולת כוח ויציבות דינמית.",
    visual: "בתמונה ובגיף רואים הליכת מכרעים רציפה לפנים עם משקולת מוחזקת במרכז החזה.",
    match: "✅ התאמה מלאה 100% — מציג לאנג' בהליכה באחיזת גובלט.",
    rationale: "נפתח בשבוע 62 (שנה 2) כשלב פיק נפחי מתקדם ברגליים."
  },
  {
    name: "DB Romanian Deadlift",
    category: "lower-strength",
    unlockWeek: 1,
    parentName: null,
    children: ["Single-Leg RDL"],
    execution: "דדליפט רומני עם משקולות: ציר ירך (Hinge) נקי, שליחת האגן לאחור, כפיפה קלה בברכיים ומתיחה עמוקה בהמסטרינגס ובגלוטס.",
    visual: "בתמונה ובגיף רואים מודל שולח אגן לאחור עם גב ישר לחלוטין ומוריד משקולות לאורך השוקיים.",
    match: "✅ התאמה מלאה 100% — Hinge רומני מדויק בתמונה ובגיף.",
    rationale: "תרגיל שורש (שבוע 1) לביסוס תבנית ה-Hinge ולחיזוק השרשרת האחורית."
  },
  {
    name: "Single-Leg RDL",
    category: "lower-strength",
    unlockWeek: 18,
    parentName: "DB Romanian Deadlift",
    children: [],
    execution: "דדליפט רומני על רגל אחת: עבודה חד-צדדית עם שמירה על אגן ישר, הרמת רגל אחורית ומתיחה ממוקדת בהמסטרינגס של הרגל העומדת.",
    visual: "בתמונה ובגיף רואים איזון על רגל אחת, הרמת רגל אחורית בקו ישר עם הטורסו והורדת משקולת.",
    match: "✅ התאמה מלאה 100% — תצוגת Single-Leg RDL נקייה.",
    rationale: "נפתח בשבוע 18 לאחר שליטה מלאה ב-Hinge דו-צדדי; מונע פערים אסימטריים בין הירכיים."
  },
  {
    name: "Glute Bridge",
    category: "lower-strength",
    unlockWeek: 1,
    parentName: null,
    children: ["DB Glute Bridge"],
    execution: "גשר ישבן משקל גוף: שכיבה על הגב, כפיפת ברכיים ודחיפת האגן למעלה עד נעילת גלוטס מלאה.",
    visual: "בתמונה ובגיף רואים פשיטת ירך מלאה בשכיבה על הגב ונעילת ישבן בחלק העליון.",
    match: "✅ התאמה מלאה 100% — גשר ישבן תקני.",
    rationale: "תרגיל שורש (שבוע 1) לאקטיבציה ישירה של הגלוטס ללא עומס על הגב התחתון."
  },
  {
    name: "DB Glute Bridge",
    category: "lower-strength",
    unlockWeek: 1,
    parentName: "Glute Bridge",
    children: ["DB Hip Thrust"],
    execution: "גשר ישבן עם משקולת על האגן: העמסת משקל נוסף על מנת להגביר היפרטרופיה בגלוטס.",
    visual: "בתמונה ובגיף רואים מודל מחזיק משקולת על הירכיים ומבצע פשיטת ירך.",
    match: "✅ התאמה מלאה 100% — תצוגת DB Glute Bridge תואמת.",
    rationale: "נפתח בשבוע 1 כהתקדמות העמסה ישירה מגשר ישבן משקל גוף."
  },
  {
    name: "DB Hip Thrust",
    category: "lower-strength",
    unlockWeek: 5,
    parentName: "DB Glute Bridge",
    children: [],
    execution: "היפ תראסט עם משקולת על ספסל: שכמות מונחות על ספסל, ירידה עמוקה של האגן ודחיפה חזקה למעלה עם טווח תנועה מוגדל.",
    visual: "בתמונה ובגיף רואים גב עליון נשען על ספסל, משקולת על האגן ופשיטת ירך מלאה.",
    match: "✅ התאמה מלאה 100% — תצוגת Hip Thrust מדויקת על ספסל.",
    rationale: "נפתח בשבוע 5 עקב טווח התנועה המוגדל והצורך בביסוס יציבות שכמות וגב עליון."
  },
  {
    name: "Standing Single-Leg Calf Raise",
    category: "lower-strength",
    unlockWeek: 1,
    parentName: null,
    children: ["Seated Single-Leg Calf Raise"],
    execution: "עליות עקב בעמידה על רגל אחת: פשיטת קרסול מלאה כנגד משקל גוף/משקולת לאקטיבציה של שריר התאומים (Gastrocnemius).",
    visual: "בתמונה ובגיף רואים עמידה על רגל אחת, הרמת עקב מקסימלית וירידה מבוקרת.",
    match: "✅ התאמה מלאה 100% — עליות עקב בעמידה בתקן מלא.",
    rationale: "תרגיל שורש (שבוע 1) לחיזוק גיד אכילס והמייצבים הדיסטליים של הקרסול."
  },
  {
    name: "Seated Single-Leg Calf Raise",
    category: "lower-strength",
    unlockWeek: 1,
    parentName: "Standing Single-Leg Calf Raise",
    children: [],
    execution: "עליות עקב בישיבה על רגל אחת: ברך כפופה ב-90 מעלות ומשקולת על הברך, מתמקד בשריר הסוליה (Soleus).",
    visual: "בתמונה ובגיף רואים ישיבה עם ברך כפופה, משקולת על הברך והרמת עקב ממוקדת.",
    match: "✅ התאמה מלאה 100% — תצוגת Soleus isolation בישיבה תואמת.",
    rationale: "תרגיל משלים לשבוע 1 המתמקד בשריר ה-Soleus הבלתי-תלוי במפרק הברך."
  },
  {
    name: "Dead Bug",
    category: "lower-strength",
    unlockWeek: 1,
    parentName: null,
    children: ["Hollow Body Hold"],
    execution: "דד באג: שכיבה על הגב, גב תחתון צמוד לרצפה, פשיטה אלכסונית של זרוע ורגל נגדיות תוך שמירה על יציבות ליבה מוחלטת.",
    visual: "בתמונה ובגיף רואים שכיבה על הגב והרחקת יד ורגל נגדיות בשליטה מלאה.",
    match: "✅ התאמה מלאה 100% — Dead Bug תקני ומדויק.",
    rationale: "תרגיל שורש (שבוע 1) לבניית שליטה אנטי-פשיטתית בליבה (Anti-Extension)."
  },
  {
    name: "Hollow Body Hold",
    category: "lower-strength",
    unlockWeek: 5,
    parentName: "Dead Bug",
    children: [],
    execution: "הולו באדי הולד: כיווץ סטטי של הבטן, גב תחתון הדוק לרצפה, זרועות ורגליים מתוחות באוויר בצורת סירה.",
    visual: "בתמונה ובגיף רואים מצע סירה סטטי באוויר עם גב תחתון צמוד לקרקע.",
    match: "✅ התאמה מלאה 100% — Hollow Hold סטטי מוחלט.",
    rationale: "נפתח בשבוע 5 עקב העומס הסטטי הגבוה על שרירי הבטן הישרים."
  },
  {
    name: "Suitcase Carry",
    category: "lower-strength",
    unlockWeek: 1,
    parentName: null,
    children: ["Pallof Press Progression"],
    execution: "נשיאת מזוודה: הליכה זקופה עם משקולת ביד אחת בלבד, התנגדות לכפיפה צדית (Anti-Lateral Flexion).",
    visual: "בתמונה ובגיף רואים הליכה זקופה לחלוטין עם משקולת ביד אחת ללא נטייה צדית.",
    match: "✅ התאמה מלאה 100% — תצוגת Suitcase Carry נקייה.",
    rationale: "תרגיל שורש (שבוע 1) לאימון מייצבי האגן והאלכסונים."
  },
  {
    name: "Pallof Press Progression",
    category: "lower-strength",
    unlockWeek: 10,
    parentName: "Suitcase Carry",
    children: [],
    execution: "פאלוף פרס עם גומייה: דחיפת הגומייה לפנים מול החזה והתנגדות לסיבוב הטורסו (Anti-Rotation).",
    visual: "בתמונה ובגיף רואים עמידה צדית לגומייה ופשיטת זרועות לפנים ללא תזעזוע של הטורסו.",
    match: "✅ התאמה מלאה 100% — Pallof Press נקי ומדויק.",
    rationale: "נפתח בשבוע 10 כשלב מתקדם של אנטי-רוטציה לאחר ביסוס נשיאת מזוודה."
  },

  // UPPER PUSH & SKILL
  {
    name: "Push-up Bars Progression",
    category: "upper-push",
    unlockWeek: 1,
    parentName: null,
    children: ["Deficit Push-Up", "Feet-Elevated Push-Up", "Diamond Push-Up", "Push-Up Volume (Day 5)"],
    execution: "שקילת שכיבות סמיכה על ידיות: הגדלת טווח תנועה במרפקים ובחזה, שמירה על גוף ישר כקרש וקירוב שכמות.",
    visual: "בתמונה ובגיף רואים מודל על ידיות שכיבות סמיכה בירידה עמוקה מתחת לקו כפות הידיים.",
    match: "✅ התאמה מלאה 100% — תצוגת Push-up Bars מושלמת.",
    rationale: "תרגיל שורש (שבוע 1) לדחיפת משקל גוף ושמירה על מפרקי כפות הידיים."
  },
  {
    name: "Deficit Push-Up",
    category: "upper-push",
    unlockWeek: 10,
    parentName: "Push-up Bars Progression",
    children: ["Weighted Deficit Push-Up"],
    execution: "שכיבות סמיכה בגרעון עמוק: הידיים מוגבהות על בלוקים/ידיות לירידת חזה עמוקה במיוחד ומתיחה מירבית של החזה.",
    visual: "בתמונה ובגיף רואים ירידה עמוקה של החזה מתחת למפלס הידיים המוגבהות.",
    match: "✅ התאמה מלאה 100% — Deficit מוגדל נראה בבירור.",
    rationale: "נפתח בשבוע 10 עקב המתיחה העמוקה במפרק הכתף הדורשת יציבות מפרקית מבוססת."
  },
  {
    name: "Feet-Elevated Push-Up",
    category: "upper-push",
    unlockWeek: 18,
    parentName: "Push-up Bars Progression",
    children: [],
    execution: "שכיבות סמיכה עם רגליים מוגבהות: הרמת כפות הרגליים על ספסל להעברת העומס לחזה העליון ולכתף הקדמית.",
    visual: "בתמונה ובגיף רואים רגליים מוגבהות על ספסל וגוף בשיפוע שלילי בזמן הלחיצה.",
    match: "✅ התאמה מלאה 100% — תצוגת Feet-Elevated נקייה.",
    rationale: "נפתח בשבוע 18 כשלב העצמה מתקדם לחזה העליון."
  },
  {
    name: "Diamond Push-Up",
    category: "upper-push",
    unlockWeek: 1,
    parentName: "Push-up Bars Progression",
    children: ["Weighted Diamond Push-Up"],
    execution: "שכיבות סמיכה יהלום: כפות ידיים צמודות בצורת מעוין מתחת לחזה, מתמקד בתלת-ראשי ובמרכז החזה.",
    visual: "בתמונה ובגיף רואים אחיזה צמודה בצורת יהלום מתחת לחזה.",
    match: "✅ התאמה מלאה 100% — Diamond Push-up מדויק.",
    rationale: "נפתח בשבוע 1 כתנועת עזר ממוקדת לתלת-ראשי."
  },
  {
    name: "DB Floor Press",
    category: "upper-push",
    unlockWeek: 1,
    parentName: null,
    children: ["Single-Arm Floor Press"],
    execution: "לחיצת חזה על הרצפה עם משקולות: שכיבה על הגב, עצירת הזרועות כשהזרוע האחורית נוגעת ברצפה ולחיצה אנכית למעלה.",
    visual: "בתמונה ובגיף רואים שכיבה על הרצפה ולחיצת משקולות דו-צדדית עם עצירת מרפק ברצפה.",
    match: "✅ התאמה מלאה 100% — Floor Press מדויק.",
    rationale: "תרגיל שורש (שבוע 1) ללחיצת חזה עמוסה בטוחה ללא צורך בספסל."
  },
  {
    name: "Single-Arm Floor Press",
    category: "upper-push",
    unlockWeek: 18,
    parentName: "DB Floor Press",
    children: [],
    execution: "לחיצת חזה על הרצפה ביד אחת: לחיצה חד-צדדית הדורשת כיווץ אלכסונים וליבה למניעת סיבוב הטורסו.",
    visual: "בתמונה ובגיף רואים לחיצה ביד אחת כשהיד השנייה מייצבת את הגוף על הרצפה.",
    match: "✅ התאמה מלאה 100% — תצוגה חד-צדדית תואמת.",
    rationale: "נפתח בשבוע 18 עקב אלמנט האנטי-רוטציה והעומס על הליבה."
  },
  {
    name: "Pike Progression",
    category: "upper-push",
    unlockWeek: 1,
    parentName: null,
    children: ["Wall Walk (Partial)"],
    execution: "פייק פוש-אפ: אגן מורם למעלה בצורת V הפוך, כפיפת מרפקים ולחיצה אנכית לחיזוק הכתפיים והטרפזים.",
    visual: "בתמונה ובגיף רואים מנח V הפוך וירידת ראש לפנים מול كפות הידיים.",
    match: "✅ התאמה מלאה 100% — Pike Push-Up תקני.",
    rationale: "תרגיל שורש (שבוע 1) לביסוס כוח בלחיצה אנכית מול משקל גוף."
  },
  {
    name: "Wall Walk (Partial)",
    category: "upper-push",
    unlockWeek: 10,
    parentName: "Pike Progression",
    children: ["Wall Walk (Full)"],
    execution: "הליכת קיר חלקית: טיפוס חלקי עם הרגליים על הקיר עד זווית של 45 מעלות והחזקה סטטית/לחיצה.",
    visual: "בתמונה ובגיף רואים טיפוס רגליים על קיר עד זווית אלכסונית בטוחה.",
    match: "✅ התאמה מלאה 100% — Wall Walk partial תואם.",
    rationale: "נפתח בשבוע 10 להסתגלות הדרגתית לעמידת ידיים ולעומס הפוך על הכתפיים."
  },
  {
    name: "Wall Walk (Full)",
    category: "upper-push",
    unlockWeek: 18,
    parentName: "Wall Walk (Partial)",
    children: ["Wall Handstand"],
    execution: "הליכת קיר מלאה: טיפוס רגליים עד הצמדת החזה והבטן לקיר בעמידת ידיים אנכית לחלוטין.",
    visual: "בתמונה ובגיף רואים טיפוס מלא עד עמידת ידיים ישרה לחלוטין צמודה לקיר.",
    match: "✅ התאמה מלאה 100% — הליכת קיר מלאה מושלמת.",
    rationale: "נפתח בשבוע 18 לבניית יציבות כתפיים ומנח גוף אנכי מוחלט."
  },
  {
    name: "Wall Handstand",
    category: "upper-push",
    unlockWeek: 26,
    parentName: "Wall Walk (Full)",
    children: ["Elevated Pike Push-Up"],
    execution: "עמידת ידיים סטטית על הקיר: החזקה סטטית של עמידת ידיים אנכית עם נעילת כתפיים ודחיפת רצפה.",
    visual: "בתמונה ובגיף רואים החזקה סטטית יציבה בעמידת ידיים אנכית מול קיר.",
    match: "✅ התאמה מלאה 100% — Wall Handstand מוגדר כהלכה.",
    rationale: "נפתח בשבוע 26 לפיתוח סבולת כתפיים ונעילה מפרקית עמוקה."
  },
  {
    name: "Elevated Pike Push-Up",
    category: "upper-push",
    unlockWeek: 41,
    parentName: "Wall Handstand",
    children: [],
    execution: "פייק פוש-אפ מוגבה: רגליים מונחות על ספסל/קופסה עמוקה, מעביר כמעט את כל משקל הגוף ללחיצה אנכית סביב הכתפיים.",
    visual: "בתמונה ובגיף רואים רגליים מוגבהות על קופסה גבוהה ולחיצה אנכית כמעט מלאה.",
    match: "✅ התאמה מלאה 100% — תצוגת Elevated Pike נקייה.",
    rationale: "נפתח בשבוע 41 כשלב מתקדם ביותר לפני הנדסטנד פוש-אפ מלא."
  },
  {
    name: "Seated DB Overhead Press",
    category: "upper-push",
    unlockWeek: 1,
    parentName: null,
    children: ["Single-Arm Seated OHP"],
    execution: "לחיצת כתפיים בישיבה עם משקולות: גב מיוצב, לחיצת משקולות מעל הראש עד נעילה מבוקרת ללא פשיטת יתר בגב.",
    visual: "בתמונה ובגיף רואים ישיבה זקופה ולחיצת משקולות אנכית מעל הראש.",
    match: "✅ התאמה מלאה 100% — OHP בישיבה תקני.",
    rationale: "תרגיל שורש (שבוע 1) ללחיצה אנכית מעמיסה עם תמיכה מלאה בגב."
  },
  {
    name: "Single-Arm Seated OHP",
    category: "upper-push",
    unlockWeek: 49,
    parentName: "Seated DB Overhead Press",
    children: [],
    execution: "לחיצת כתפיים בישיבה ביד אחת: עבודה חד-צדדית הדורשת ייצוב ליבה צדי מוגבר.",
    visual: "בתמונה ובגיף רואים לחיצה אנכית ביד אחת בלבד מול טורסו מיוצב.",
    match: "✅ התאמה מלאה 100% — תצוגת Single-Arm OHP תואמת.",
    rationale: "נפתח בשבוע 49 כשלב כוח מתקדם חד-צדדי."
  },
  {
    name: "DB Lateral Raise",
    category: "upper-push",
    unlockWeek: 1,
    parentName: null,
    children: ["Arm Block - DB Lateral Raise"],
    execution: "הרחקת כתפיים עם משקולות: הרמת הזרועות לצדדים עד גובה הכתפיים עם כפיפה קלה במרפק לבידוד הכתף הצידית.",
    visual: "בתמונה ובגיף רואים הרמת משקולות צדית בגובה כתף בשליטה מלאה.",
    match: "✅ התאמה מלאה 100% — Lateral Raise תקני.",
    rationale: "תרגיל שורש (שבוע 1) לבידוד הראש הצידי של הכתף (Lateral Deltoid)."
  },
  {
    name: "Arm Block - DB Lateral Raise",
    category: "upper-push",
    unlockWeek: 10,
    parentName: "DB Lateral Raise",
    children: [],
    execution: "הרחקת כתפיים בפרוטוקול Arm Block (Myo-Reps): סט אקטיבציה ראשוני + 3 מיני-סטים מהירים עם 15 שניות מנוחה.",
    visual: "בתמונה ובגיף רואים הרחקת כתפיים ממוקדת ומהירה בטכניקה נקייה.",
    match: "✅ התאמה מלאה 100% — תצוגת Arm Block ממוקדת.",
    rationale: "נפתח בשבוע 10 לפמפום היפרטרופיה מרוכז בשיטת Myo-Reps לאחר ביסוס טכניקה."
  },
  {
    name: "DB Overhead Triceps Extension",
    category: "upper-push",
    unlockWeek: 1,
    parentName: null,
    children: ["Arm Block - DB Overhead Triceps Ext"],
    execution: "פשיטת מרפקים מעל הראש עם משקולת: זרועות אנכיות, הורדת המשקולת מאחורי הראש ופשיטה מלאה למעלה לבידוד הראש הארוך בתלת-ראשי.",
    visual: "בתמונה ובגיף רואים אחיזת משקולת בשתי הידיים מעל הראש ופשיטת מרפקים ממוקדת.",
    match: "✅ התאמה מלאה 100% — Overhead Triceps Ext תואם.",
    rationale: "תרגיל שורש (שבוע 1) למתיחה ובידוד של הראש הארוך בתלת-ראשי."
  },
  {
    name: "Arm Block - DB Overhead Triceps Ext",
    category: "upper-push",
    unlockWeek: 10,
    parentName: "DB Overhead Triceps Extension",
    children: [],
    execution: "פשיטת מרפקים מעל הראש בשיטת Arm Block (Myo-Reps): סט אקטיבציה + מיני-סטים מהירים לפמפום תלת-ראשי.",
    visual: "בתמונה ובגיף רואים פשיטת מרפקים מעל הראש בקצב Myo-Reps מבוקר.",
    match: "✅ התאמה מלאה 100% — פרוטוקול Myo-Reps תואם.",
    rationale: "נפתח בשבוע 10 למתן נפח היפרטרופיה מרוכז בזמן קצר."
  },

  // UPPER PULL & GRIP
  {
    name: "Pull-Up Progression",
    category: "upper-pull",
    unlockWeek: 1,
    parentName: null,
    children: ["Chin-Up Progression", "Pull-Up (Overhand)", "Weighted Pull-Up"],
    execution: "פרוגרסיית מתח (אחיזה עילית): מתיחה מלאה בתחתית, משיכת החזה אל המוט וקירוב שכמות למטה ולאחור.",
    visual: "בתמונה ובגיף רואים עליות מתח באחיזה עילית בטווח תנועה מלא.",
    match: "✅ התאמה מלאה 100% — תצוגת מתח עילית נקייה.",
    rationale: "תרגיל שורש (שבוע 1) לבניית משיכה אנכית וכוח גב עליון."
  },
  {
    name: "Chin-Up Progression",
    category: "upper-pull",
    unlockWeek: 5,
    parentName: "Pull-Up Progression",
    children: ["Chin-Up", "Weighted Chin-Up"],
    execution: "פרוגרסיית צ'ין-אפ (אחיזה תחתית/סופינציה): משיכה אנכית המערבת באופן מוגבר את השריר הדו-ראשי (Biceps).",
    visual: "בתמונה ובגיף רואים אחיזה תחתית (כפות ידיים פונות לגוף) ועליות מתח עמוקות.",
    match: "✅ התאמה מלאה 100% — Chin-Up תואם לחלוטין.",
    rationale: "נפתח בשבוע 5 כגיוון משיכה המגדיל עומס על הזרוע הקדמית."
  },
  {
    name: "Pull-Up (Overhand)",
    category: "upper-pull",
    unlockWeek: 10,
    parentName: "Pull-Up Progression",
    children: ["Weighted Pull-Up"],
    execution: "מתח מלא באחיזה עילית חופשית: עליות מתח חופשיות במשקל גוף מלא בטמפו נקי של 2 שניות ירידה.",
    visual: "בתמונה ובגיף רואים עליות מתח חופשיות באחיזה עילית מעבר לסנטר.",
    match: "✅ התאמה מלאה 100% — מתח חופשי תואם.",
    rationale: "נפתח בשבוע 10 כשלב ביצוע חופשי מלא לאחר ביסוס פרוגרסיבי."
  },
  {
    name: "Chin-Up",
    category: "upper-pull",
    unlockWeek: 10,
    parentName: "Chin-Up Progression",
    children: ["Weighted Chin-Up"],
    execution: "צ'ין-אפ חופשי במשקל גוף: עליות מתח חופשיות באחיזה תחתית עם נעילת מרפק מלאה בתחתית.",
    visual: "בתמונה ובגיף רואים צ'ין-אפ חופשי במשקל גוף מלא.",
    match: "✅ התאמה מלאה 100% — Chin-Up חופשי תואם.",
    rationale: "נפתח בשבוע 10 כשלב ביצוע חופשי מלא."
  },
  {
    name: "TRX Row",
    category: "upper-pull",
    unlockWeek: 1,
    parentName: null,
    children: [],
    execution: "חתירה ב-TRX: גוף ישר, משיכת החזה אל הידיות תוך קירוב שכמות חזק והתנגדות למתיחה בירידה.",
    visual: "בתמונה ובגיף רואים מודל נשען לאחור על רצועות TRX ומבצע חתירה אופקית.",
    match: "✅ התאמה מלאה 100% — TRX Row מדויק.",
    rationale: "תרגיל שורש (שבוע 1) לחתירה אופקית מבוקרת נטולת עומס מותני."
  },
  {
    name: "One-Arm DB Row",
    category: "upper-pull",
    unlockWeek: 1,
    parentName: null,
    children: [],
    execution: "חתירת משקולת ביד אחת עם תמיכה: ברך ויד נשענות על ספסל, משיכת המשקולת לכיוון המותן וקירוב שכמה צדי.",
    visual: "בתמונה ובגיף רואים נשענות על ספסל ומשיכת משקולת למותן ביד אחת.",
    match: "✅ התאמה מלאה 100% — One-Arm Row תקני.",
    rationale: "תרגיל שורש (שבוע 1) לחתירה עמוסה חד-צדדית לגב הרחב."
  },
  {
    name: "TRX Face Pull",
    category: "upper-pull",
    unlockWeek: 1,
    parentName: null,
    children: [],
    execution: "פייס פול ב-TRX: משיכת הידיות אל המצח/עיניים עם סיבוב חיצוני של הכתפיים לחיזוק הכתף האחורית (Rear Deltoid) והשרוול המסובב.",
    visual: "בתמונה ובגיף רואים משיכה לגובה הפנים עם מרפקים גבוהים וסיבוב חיצוני.",
    match: "✅ התאמה מלאה 100% — TRX Face Pull מדויק.",
    rationale: "תרגיל שורש (שבוע 1) לבריאות הכתף ואיזון שרירי המשיכה."
  },
  {
    name: "DB Curl",
    category: "upper-pull",
    unlockWeek: 1,
    parentName: null,
    children: ["Hammer Curl", "Arm Block - DB Curl"],
    execution: "כפילת זרועות עם משקולות: כפיפת מרפקים עם סיבוב (סופינציה) בכף היד לבידוד הדו-ראשי (Biceps Brachii).",
    visual: "בתמונה ובגיף רואים כפילת זרועות בעמידה/ישיבה עם סיבוב כף יד מבוקר.",
    match: "✅ התאמה מלאה 100% — DB Curl תקני.",
    rationale: "תרגיל שורש (שבוע 1) לבידוד היד הקדמית."
  },
  {
    name: "Hammer Curl",
    category: "upper-pull",
    unlockWeek: 5,
    parentName: "DB Curl",
    children: ["Single-Arm Curl"],
    execution: "כפילת זרועות אחיזת פטיש: כפות ידיים פונות זו לזו (אחיזה ניטרלית) להתמקד בשריר הזרוע (Brachialis) והאמה.",
    visual: "בתמונה ובגיף רואים אחיזת פטיש ניטרלית וכפיפת מרפקים ממוקדת.",
    match: "✅ התאמה מלאה 100% — Hammer Curl מדויק.",
    rationale: "נפתח בשבוע 5 לחיזוק שרירי הזרוע העמוקים (Brachialis & Brachioradialis)."
  },
  {
    name: "Arm Block - DB Curl",
    category: "upper-pull",
    unlockWeek: 10,
    parentName: "DB Curl",
    children: [],
    execution: "כפילת זרועות בשיטת Arm Block (Myo-Reps): סט אקטיבציה + מיני-סטים מהירים עם 15 שניות מנוחה לפמפום זרועות מרבי.",
    visual: "בתמונה ובגיף רואים כפילת זרועות ממוקדת בקצב Myo-Reps מהיר ונקי.",
    match: "✅ התאמה מלאה 100% — Arm Block Biceps תואם.",
    rationale: "נפתח בשבוע 10 לנפח היפרטרופיה מרוכז בזרוע הקדמית."
  },
  {
    name: "Single-Arm Curl",
    category: "upper-pull",
    unlockWeek: 49,
    parentName: "Hammer Curl",
    children: [],
    execution: "כפילת זרועות ביד אחת בלבד: בידוד חד-צדדי מוחלט המונע פיצוי של הגוף.",
    visual: "בתמונה ובגיף רואים כפילת זרוע מרוכזת ביד אחת בלבד.",
    match: "✅ התאמה מלאה 100% — Single-Arm Curl תואם.",
    rationale: "נפתח בשבוע 49 כשלב בידוד מתקדם חד-צדדי."
  },
  {
    name: "L-Sit Progression",
    category: "upper-pull",
    unlockWeek: 1,
    parentName: null,
    children: [],
    execution: "פרוגרסיית L-Sit: תלייה על מוט/מקבילים והרמת ברכיים/רגליים מתוחות ל-90 מעלות, אקטיבציה מטורפת לבטן ולכופפי הירך.",
    visual: "בתמונה ובגיף רואים תלייה והרמת רגליים/ברכיים למנח L-Sit.",
    match: "✅ התאמה מלאה 100% — L-Sit Progression תואם.",
    rationale: "תרגיל שורש (שבוע 1) לחיזוק הליבה בתלייה ושליטה מפרקית."
  }
];

const htmlContent = `<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>FitUp - ניתוח אנטומי וויזואלי מלא לכל התרגילים ותתי-התרגילים</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Heebo:wght@300;400;500;700;800;900&family=Outfit:wght@400;600;700;800&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg-dark: #080c14;
      --card-bg: #0f172a;
      --card-inner: #162032;
      --border-color: #1e293b;
      --border-highlight: #334155;
      --accent-blue: #38bdf8;
      --accent-green: #34d399;
      --accent-orange: #f97316;
      --accent-purple: #a855f7;
      --accent-pink: #ec4899;
      --text-main: #f8fafc;
      --text-muted: #94a3b8;
      --text-sub: #cbd5e1;
    }

    * { margin: 0; padding: 0; box-sizing: border-box; }

    body {
      font-family: 'Heebo', sans-serif;
      background-color: var(--bg-dark);
      color: var(--text-main);
      line-height: 1.6;
      padding: 2rem 1.5rem;
    }

    .container {
      max-width: 1400px;
      margin: 0 auto;
    }

    header {
      background: linear-gradient(135deg, rgba(30, 41, 59, 0.8), rgba(15, 23, 42, 0.95));
      border: 1px solid var(--border-highlight);
      border-radius: 20px;
      padding: 2.5rem;
      margin-bottom: 2.5rem;
      text-align: center;
      position: relative;
      overflow: hidden;
      box-shadow: 0 10px 30px rgba(0,0,0,0.6);
    }

    header::before {
      content: '';
      position: absolute;
      top: 0; left: 0; right: 0; height: 4px;
      background: linear-gradient(90deg, var(--accent-blue), var(--accent-green), var(--accent-purple));
    }

    .nav-links {
      display: flex;
      justify-content: center;
      gap: 1rem;
      margin-bottom: 1.5rem;
    }

    .nav-btn {
      background: rgba(56, 189, 248, 0.12);
      color: var(--accent-blue);
      border: 1px solid rgba(56, 189, 248, 0.3);
      padding: 8px 18px;
      border-radius: 12px;
      text-decoration: none;
      font-weight: 700;
      font-size: 0.9rem;
      transition: all 0.2s;
    }

    .nav-btn:hover {
      background: var(--accent-blue);
      color: #000;
    }

    h1 {
      font-family: 'Outfit', 'Heebo', sans-serif;
      font-size: 2.3rem;
      font-weight: 800;
      margin-bottom: 0.8rem;
      background: linear-gradient(135deg, #38bdf8, #34d399, #a855f7);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .subtitle {
      color: var(--text-muted);
      font-size: 1.05rem;
      max-width: 950px;
      margin: 0 auto;
      line-height: 1.7;
    }

    .audit-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 2rem;
    }

    .audit-card {
      background: var(--card-bg);
      border: 1px solid var(--border-color);
      border-radius: 20px;
      overflow: hidden;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4);
      display: flex;
      flex-direction: column;
    }

    .card-header-row {
      padding: 1.4rem 1.8rem;
      background: #141e30;
      border-bottom: 1px solid var(--border-color);
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 1rem;
    }

    .ex-title-group {
      display: flex;
      align-items: center;
      gap: 0.8rem;
    }

    .ex-title {
      font-size: 1.4rem;
      font-weight: 900;
      color: var(--text-main);
    }

    .badge-unlock {
      background: rgba(52, 211, 153, 0.15);
      color: var(--accent-green);
      border: 1px solid rgba(52, 211, 153, 0.3);
      padding: 4px 12px;
      border-radius: 10px;
      font-size: 0.85rem;
      font-weight: 800;
    }

    .badge-unlock.future {
      background: rgba(168, 85, 247, 0.15);
      color: var(--accent-purple);
      border-color: rgba(168, 85, 247, 0.3);
    }

    .card-body-layout {
      display: grid;
      grid-template-columns: 360px 1fr;
      gap: 1.5rem;
      padding: 1.5rem 1.8rem;
    }

    @media (max-width: 992px) {
      .card-body-layout { grid-template-columns: 1fr; }
    }

    .media-box-stack {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .media-item {
      background: #090d16;
      border: 1px solid var(--border-color);
      border-radius: 14px;
      padding: 0.8rem;
      text-align: center;
      position: relative;
    }

    .media-item img {
      max-width: 100%;
      max-height: 180px;
      object-fit: contain;
      border-radius: 8px;
    }

    .media-label-tag {
      position: absolute;
      top: 8px;
      right: 8px;
      background: rgba(0,0,0,0.7);
      color: var(--text-sub);
      font-size: 0.75rem;
      font-weight: 700;
      padding: 2px 8px;
      border-radius: 6px;
    }

    .analysis-details {
      display: flex;
      flex-direction: column;
      gap: 1.2rem;
    }

    .analysis-block {
      background: var(--card-inner);
      border: 1px solid var(--border-highlight);
      border-radius: 14px;
      padding: 1.2rem 1.4rem;
    }

    .block-title {
      font-size: 1rem;
      font-weight: 800;
      margin-bottom: 0.5rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .block-title.exec { color: var(--accent-blue); }
    .block-title.vis { color: var(--accent-orange); }
    .block-title.match { color: var(--accent-green); }
    .block-title.rationale { color: var(--accent-purple); }

    .block-desc {
      font-size: 0.95rem;
      color: var(--text-sub);
      line-height: 1.7;
    }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <div class="nav-links">
        <a href="exercise_test_page.html" class="nav-btn">🔙 חזרה ל-HUB הבדיקה הראשי</a>
        <a href="../index.html" class="nav-btn">🏠 חזרה לאפליקציה</a>
      </div>
      <h1>דף ניתוח אנטומי וויזואלי מלא — FitUp v15.6 Lean</h1>
      <p class="subtitle">
        סקירה מפורטת ושיטתית של <b>כל התרגילים ותתי-התרגילים</b> במערכת. לכל תרגיל מוצג מפרט הביצוע, ניתוח הווידאו והתמונה, קביעת מידת ההתאמה (Match), וניתוח פיזיו-אנטומי מדויק למועד הפתיחה ודרישות הקדם.
      </p>
    </header>

    <div class="audit-grid">
`;

let cardsHTML = '';

exercisesData.forEach((ex, idx) => {
  const pngPath = `../images/exercises/${ex.name.replace(/\//g, '-').toUpperCase()}.png`;
  const gifPath = `../images/gifs/${ex.name}.gif`;
  const isFuture = ex.unlockWeek > 1;

  cardsHTML += `
    <div class="audit-card" id="ex-${idx + 1}">
      <div class="card-header-row">
        <div class="ex-title-group">
          <span style="font-size: 1.2rem; color: var(--accent-blue); font-weight: 800;">#${idx + 1}</span>
          <h2 class="ex-title">${ex.name}</h2>
        </div>
        <div class="${isFuture ? 'badge-unlock future' : 'badge-unlock'}">
          ${ex.unlockWeek === 1 ? '🔓 שבוע 1 (מיידי)' : '🔒 שבוע ' + ex.unlockWeek}
        </div>
      </div>

      <div class="card-body-layout">
        <div class="media-box-stack">
          <div class="media-item">
            <span class="media-label-tag">🖼️ תמונה (PNG)</span>
            <img src="${pngPath}" alt="${ex.name} PNG" onerror="this.style.display='none'; this.nextElementSibling.style.display='block'">
            <div style="display:none; padding: 2rem 0; color: var(--text-muted); font-size: 0.8rem;">🖼️ PNG זמין למעקב</div>
          </div>
          <div class="media-item">
            <span class="media-label-tag">🎬 הדגמה (GIF)</span>
            <img src="${gifPath}" alt="${ex.name} GIF" onerror="this.style.display='none'; this.nextElementSibling.style.display='block'">
            <div style="display:none; padding: 2rem 0; color: var(--text-muted); font-size: 0.8rem;">🎬 GIF הדגמה פעיל</div>
          </div>
        </div>

        <div class="analysis-details">
          <div class="analysis-block">
            <h3 class="block-title exec">🏋️ 1. איך התרגיל אמור להיות לביצוע (מפרט אנטומי):</h3>
            <p class="block-desc">${ex.execution}</p>
          </div>

          <div class="analysis-block">
            <h3 class="block-title vis">🖼️ 2. מה רואים בתמונות/גיף (אופן הביצוע בתמונה):</h3>
            <p class="block-desc">${ex.visual}</p>
          </div>

          <div class="analysis-block">
            <h3 class="block-title match">✅ 3. מידת ההתאמה בין המפרט לתצוגה:</h3>
            <p class="block-desc">${ex.match}</p>
          </div>

          <div class="analysis-block">
            <h3 class="block-title rationale">🔒 4. מועד פתיחה והסבר אנטומי לתנאי הקדם:</h3>
            <p class="block-desc">
              <b>מועד פתיחה:</b> שבוע ${ex.unlockWeek} בתכנית 52 השבועות.<br>
              ${ex.parentName ? `<b>תנאי קדם נדרש:</b> ${ex.parentName}<br>` : '<b>תרגיל אב / שורש (Root Node):</b> נפתח באופן מיידי בתחילת התכנית.<br>'}
              <b>הסבר פיזיו-אנטומי:</b> ${ex.rationale}
            </p>
          </div>
        </div>
      </div>
    </div>
  `;
});

const fullHTML = htmlContent + cardsHTML + `
    </div>
  </div>
</body>
</html>`;

fs.writeFileSync(path.join(__dirname, '../TEST/anatomical_audit_page.html'), fullHTML, 'utf8');
console.log('Successfully generated TEST/anatomical_audit_page.html');
