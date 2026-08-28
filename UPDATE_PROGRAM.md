# מפרט מימוש מלא — FitUp v15.6 Lean

תוכנית אימון אדפטיבית, מבנה יעיל (Lean), זיווגים ומעגלים, Deload, מנוע משקולות, מיקרו-מחזור בייספס, מנוחות אדפטיביות, softened progression, תדירות כפולה חזה/גב, רוטציית כתף אחורית, רוטציית שרשרת אחורית/ארבע-ראשי ביום 1, Arm Block ב-Myo-Reps עם חוק עצירה אובייקטיבי ומגבלת חשיפה שבועית, שמירת ביצועים וסנכרון Google Drive

## מטרה

להגדיר את תוכנית FitUp v15.6 Lean כמקור אמת יחיד לתוכנית, תרגילים, progression, משקלים, מבנה יעיל, רוטציות, Arm Block ו-Deload; לשמר במלואם נתוני משתמש קיימים: מעקב אימונים, ביצועי סטים, משקל גוף, RPE, הערות, תזונה, תמונות, הגדרות וסנכרון Google Drive.

## החלטה סופית

FitUp v15.6 Lean הוא מקור האמת היחיד לתוכנית ול-progression.

IndexedDB הוא מקור האמת המקומי לביצועים ולמצב progression.

Google Drive הוא גיבוי וסנכרון דו-כיווני של כל נתוני המשתמש, כולל progressionState, progressionHistory, myoClusterHistory ו-armBlockExposure.

המערכת היא Zero Decisions: המשתמש לא מחשב משקלים ולא מחליט אם להעלות או להוריד עומס. הוא מדווח רק על תוצאת כל סט.

מבנה Lean: תרגילי בסיס כבדים בסטים ישרים עם מנוחה מלאה; אביזרים, תדירות שנייה, ליבה ותאומים בזיווגים/מעגלים/בלוקים.

Myo-Reps ב-Arm Block משתמשים בחוק עצירה אובייקטיבי: אובדן טמפו בשתי חזרות רצופות. חזרות עם אובדן טמפו אינן נספרות כחזרות נקיות.

Arm Block מוגבל לחשיפה אחת בשבוע לכל אזור שרירי.

==================================================
## 1. ציוד ומשקולות
==================================================

### ציוד זמין

- זוג דאמבלים מתכווננים
- פלטות של 1 ק״ג ו-2 ק״ג
- משקל עבודה חוקי לכל יד: 3–32 ק״ג בקפיצות של 1 ק״ג
- משקל עבודה חוקי לדאמבל יחיד: 3–32 ק״ג בקפיצות של 1 ק״ג
- מתח
- מקבילים / Push-Up Bars
- TRX
- גומייה 30 ק״ג, 40 ק״ג, 50 ק״ג
- כיסא / ספסל
- הליכון
- וסט 5 ק״ג, וסט 2 ק״ג (ל-Pull-Ups), וסט 4 ק״ג (ל-Pull-Ups)

### כללי משקל

- משקל `each` = המשקל לכל יד.
- משקל `total` = משקל על דאמבל יחיד או עומס כולל.
- משקל גוף, זמן ותרגילי וריאציה אינם משתמשים בקילוגרמים.
- אין להציג משקל מחושב מתוך טקסט חופשי בלבד. כל משקל חייב להגיע מרשימת משקלים חוקית.
- אין משקלים עשרוניים.
- אין קפיצה אוטומטית מעבר למשקל המקסימום הזמין.

### אכיפת משקל מינימלי ומניעת הצגת 0 ק״ג (Zero Decisions Protection)

- **איסור מוחלט על הצגת 0 ק״ג**: חל איסור מוחלט להציג "0 kg", "0 kg each" או סטי משקל של 0 KG עבור תרגילי משקולות (`type: "weighted"`).
- **גבול תחתון קשיח (`minWeight Floor`)**: כל תרגילי המשקולות מוגנים ע״י `minWeight` (3 ק״ג לפחות / משקל הפתיחה המוגדר). שום מנגנון התאוששות, חישוב או ירידה במשקל אינו רשאי לרדת מתחת ל-`minWeight`.
- **מנגנון נפילה חזרה (Fallback)**: במידה ומתרחשת שגיאת פענוח מחרוזת, חסר נתוני היסטוריה, או אתחול זיכרון — המערכת נופלת אוטומטית למשקל הבסיס המוגדר (`startingWeight`) או ל-`minWeight` החוקי הקרוב ביותר.
- **תקינות ייצוא נתונים**: כל קובצי הייצוא והסנכרון (JSON / Google Drive) מחויבים להכיל `progressionState` תקין ומאומת ללא ערכי משקל 0.

### רשימת משקלים חוקיים

```js
[3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32]
```

==================================================
## 2. מבנה שבועי
==================================================

| יום | שם | מטרה | משך יעד |
| --- | --- | --- | --- |
| 1 | Legs + Core + Carry | רגליים, שרשרת אחורית, המסטרינג, גלוטס, תאומים, core ונשיאה | 42–50 דק׳ |
| 2 | Zone 2 + Micro Mobility | בסיס אירובי והתאוששות | 40–50 דק׳ |
| 3 | Push + Shoulders + Triceps + Back Volume | חזה, כתפיים, טרייספס, rear delts, מיומנות overhead + נפח גב | 44–50 דק׳ |
| 4 | Active Recovery + Mobility | התאוששות פעילה, תנועתיות ותחזוקת מפרקים | 25–35 דק׳ |
| 5 | Pull + Grip + Core + Chest Volume | גב, מתח, בייספס, brachioradialis, אחיזה, core + נפח חזה | 42–48 דק׳ |
| 6 | Cardio | VO2 Max 4x4 או Zone 2 קל ב-Deload | 35–40 דק׳ |
| 7 | Complete Rest | התאוששות, שינה, תזונה והורדת עומס | — |

==================================================
## 3. כללי בטיחות מחייבים
==================================================

### עצור את האימון מיידית במקרה של

- כאב חד, מקרין או דוקר בגב תחתון, ברך, כתף או גיד אכילס.
- כאב בחזה, סחרחורת או קוצר נשימה לא רגיל.
- כאב בשורש כף היד שנשאר מעל 48 שעות.
- כאב במרפק שנשאר מעל 48 שעות.
- כל כאב שמכריח שינוי בטכניקה.
- אובדן neutral spine ב-RDL, Row, Carry או כל hip hinge.

### כללי טכניקה

- כל שכיבות הסמיכה מתבצעות על Push-Up Bars בלבד.
- TRX מיועד רק ל-Face Pull, Y-T-W ו-TRX Row.
- בתרגיל חד-צדדי: כל הסטים לצד ימין, מנוחה, כל הסטים לצד שמאל, ואז ממשיכים.
- חזרה מסתיימת כאשר אי אפשר להשלים אותה בטכניקה ובטמפו שנקבעו.
- אין כשל מכוון.
- אין RIR.
- אין "לפי תחושה".
- אין פינישרים ספונטניים.
- אין אימון השלמה מחוץ לתוכנית.

### כלל עצירה מיוחד לבייספס

כאב במרפק מעל 48 שעות מחייב חזרה מיידית לשבוע קל במיקרו-מחזור, ללא תלות במקום הנוכחי במחזור.

### חוק עצירה אובייקטיבי ב-Myo-Reps

בצבירי Myo-Reps, עצירה מתבצעת כאשר יש אובדן טמפו בשתי חזרות רצופות.

אובדן טמפו מוגדר כ:

- ירידה לא מבוקרת, מהירה מ-2 שניות, כאשר התרגיל מגדיר אקסצנטרי של 2 שניות או יותר.
- שימוש בתנופה / swing / momentum.
- שינוי טכניקה ברור כדי להשלים את החזרה.
- עצירה מכנית לא מתוכננת באמצע טווח התנועה.

חזרות עם אובדן טמפו אינן נספרות כחזרות נקיות.

==================================================
## 4. Deload כולל Deload Ceiling
==================================================

שבוע Deload יקרה בכל שבוע שמתחלק ב-8:

שבוע 8, 16, 24, 32, 40, 48, 56, 64, 72 וכן הלאה.

### חוקי Deload

- תקרת סטים (Ceiling): שני סטים בלבד לכל תרגיל כוח.
- תרגיל המוגדר מראש ל-2 סטים נשאר 2 סטים ב-Deload.
- עומס מופחת ב-2 ק״ג לכל יד/תרגיל משוקלל, אך לא מתחת למשקל המינימלי החוקי.
- אם הורדת 2 ק״ג אינה אפשרית, עגל מטה למשקל החוקי הקרוב.
- תרגילי משקל גוף נשארים באותה וריאציה, אך מבוצעים בשני סטים בלבד.
- תרגילי זמן מבוצעים בשני סטים בלבד, עם יעד של 70% מהיעד העליון, מעוגל מטה.
- Arm Block, אם פעיל, מבוצע כסט אקטיבציה יחיד בלבד, ללא מיני-סטים.
- כל הזיווגים, המעגלים והבלוקים מתפרקים ב-Deload — כל התרגילים המזווגים/מעגליים/בלוקיים מבוצעים כסטים ישרים.
- רוטציות (Toggles) אינן מתפרקות ב-Deload. מבצעים רק את התרגיל הפעיל לפי זוגיות השבוע, עם תקרת 2 סטים.
- Day 6 אינו מבצע VO2 Max בשבוע Deload; מבצע 30 דקות Zone 2 קל.
- אין קידום משקל או שלב בתוך שבוע Deload.
- אין איפוס progression לאחר Deload.
- בסיום השבוע, המשקל הבא חוזר בדיוק למצב `currentWeight` שנשמר לפני ה-Deload.
- Deload הוא התאוששות בלבד, לא רגרסיה קבועה.

### שילוב Deload עם מיקרו-מחזור בייספס

אם שבוע 3 של המחזור (הקל) חופף לשבוע Deload — אין כפילות. מבצעים סט אחד Single-Arm Hammer Curl בשלב הנוכחי.

### הצגת Deload במסך

- Banner בולט: "שבוע Deload — עומס מופחת להתאוששות".
- "2 סטים בלבד; המשקל הרגיל שלך נשמר ויחזור לאחר השבוע".
- צבע visual שונה עבור יום Deload.
- הכפתורים מתעדים ביצוע אך לא מפעילים שינוי progression.

==================================================
## 5. מנוע Progression — הגדרות תוצאות סט
==================================================

לכל סט המשתמש בוחר אחת משלוש תוצאות בלבד:

- **ABOVE**: עברת את המקסימום החלון בטכניקה ובטמפו תקינים.
- **IN_WINDOW**: הגעת לפחות למינימום החלון ועד המקסימום, כולל המקסימום.
- **BELOW**: לא הגעת למינימום החלון, או היה Mechanical Stop לפני המינימום.

החלטה מתקבלת רק כאשר כל הסטים של אותו תרגיל הושלמו.

### כללי החלטה

- אם כל הסטים ABOVE: התקדם.
- אם כל הסטים IN_WINDOW ובאימון הנוכחי כל הסטים הגיעו ל-max או max−1 ובאימון הקודם כל הסטים הגיעו למקסימום החלון ולא היה Mechanical Stop: התקדם (softened progression).
- אם כל הסטים BELOW: רד צעד אחד, רק אם ניתן לרדת בלי לעבור את המינימום החוקי.
- בכל תמהיל אחר: שמור על אותו עומס או שלב.

החלטה יכולה להתרחש פעם אחת בלבד לכל תרגיל בכל session.

לחיצה חוזרת, שינוי תוצאה או רענון לא יגרמו להחלטה נוספת.

החלטה נשמרת עם `decisionId` קבוע ו-`sessionKey`.

אין כפל קידום.

Undo יתאפשר רק להחלטה האחרונה של התרגיל, ורק אם לא נרשם אימון חדש מאז.

הערה: softened progression מיושם כברירת מחדל לכל התרגילים, למעט תרגילים המוגדרים עם `strictProgression = true`.

### תרגיל לא פעיל עקב Toggle

תרגיל שנמצא במצב לא פעיל עקב Toggle:

- לא מקבל סטים.
- לא מקבל החלטת progression.
- לא צובר BELOW / IN_WINDOW / ABOVE.
- שומר את מצב progression הקיים שלו.
- אינו מאפס משקל, שלב או היסטוריה.

==================================================
## 6. מנוחות אדפטיביות — שלושה מנגנונים
==================================================

### מנגנון 1: מנוחת פתיחה (Opening Rest)

מחושבת מהאימון הקודם של אותו תרגיל.

```js
function calculateOpeningRest(exercise, previousSessionData) {
  const baseRest = exercise.restSeconds;
  if (!previousSessionData) return baseRest;

  const allSetsInWindow = previousSessionData.sets.every(s => s.result === 'in_window');
  const allSetsAtMax = previousSessionData.sets.every(s => s.reps >= exercise.windowMax);
  const anyBelow = previousSessionData.sets.some(s => s.result === 'below');

  if (anyBelow && exercise.restRange) {
    return Math.min(exercise.restRange[1], baseRest + 30);
  }

  if (allSetsInWindow && allSetsAtMax && exercise.restRange) {
    return Math.max(exercise.restRange[0], baseRest - 15);
  }

  return baseRest;
}
```

### כלל מיוחד לתרגילי Toggle

עבור תרגיל הנמצא ב-Toggle, Opening Rest מחושב רק מהאימון הקודם שבו אותו תרגיל היה פעיל.

אם התרגיל לא היה פעיל בשבוע הקודם עקב Toggle, אין להשתמש בנתוני תרגיל אחר.

אם אין אימון קודם לאותו תרגיל, משתמשים ב-`baseRest`.

### מנגנון 2: מנוחה תוך-אימונית (Intra-Workout Rest)

מתארכת מיד לאחר סט עם BELOW טכני.

```js
function calculateIntraWorkoutRest(exercise, currentSetResult, baseRest) {
  if (currentSetResult === 'below' && exercise.restRange) {
    const extendedRest = Math.min(exercise.restRange[1], baseRest + 30);
    return {
      rest: extendedRest,
      message: `המנוחה הבאה: ${extendedRest} שניות (עקב ירידה בביצוע)`
    };
  }

  return {
    rest: baseRest,
    message: `מנוחה: ${baseRest} שניות`
  };
}
```

### מנגנון 3: מנוחה לאימון הבא (Next Session Rest)

נשמרת ב-`adaptiveRestHistory` ונקבעת מחדש לפי ביצועי כל האימון.

### הגדרות מנוחה בסיסיות

| תרגיל | Base | טווח |
| --- | ---: | ---: |
| DB RDL | 105 | 90–120 |
| Single-Leg RDL | 75 | 60–90 |
| Single-Arm Floor Press | 90 | 75–105 |
| Pull-Up/Chin-Up | 90 | 75–105 |
| Single-Arm Seated OHP | 75 | 60–90 |
| Goblet Bulgarian Split Squat | 82 | 75–90 |
| One-Arm DB Row | 75 | 60–90 |
| Heels-Elevated Goblet Squat | 75 | 60–90 |
| DB Glute Bridge | 75 | 60–90 |
| TRX Row | 75 | 60–90 |
| Push-Up Volume (Day 5) | 75 | 60–90 |
| Single-Arm Lateral Raise | 45 | — |
| DB Overhead Triceps Extension | 45 | — |
| Single-Arm Curl | 45 | — |
| Single-Arm Hammer Curl | 45 | — |
| Diamond Push-Up | 45 | — |
| Band Pull-Apart | 45 | — |
| TRX Y-T-W | 45 | — |
| TRX Face Pull | 45 | — |
| Standing Single-Leg Calf Raise | 45 | — |
| Seated Single-Leg Calf Raise | 45 | — |
| Suitcase Carry | 60 | — |
| Pallof Press Progression | 45 | — |
| Dead Bug | 30 | — |
| Hollow Body Hold | 30 | — |
| L-Sit Progression | 45 | — |
| Towel Hang | 45 | — |
| Band Neck Flexion & Extension | 45 | — |

==================================================
## 7. מצב Lean — זיווגים, מעגלים, בלוקים ורוטציה
==================================================

### עקרון יסוד — הגנה על תרגילי בסיס

תרגילים מורכבים כבדים מבוצעים תמיד כסטים ישרים עם מנוחה אדפטיבית מלאה. אין לזווג אותם.

רשימת תרגילים מוגנים:

- יום 1: Goblet Romanian Deadlift, Single-Leg RDL, Goblet Bulgarian Split Squat, Heels-Elevated Goblet Squat, DB Glute Bridge, Suitcase Carry
- יום 3: Pike Progression, Single-Arm Floor Press, Push-Up Bars, Single-Arm Seated OHP, DB Overhead Triceps Extension
- יום 5: Pull-Up, One-Arm DB Row, Single-Arm Curl, Single-Arm Hammer Curl

הגנה על תרגיל מוגן פירושה:

- אסור לזווג אותו.
- אסור להכניס אותו למעגל.
- אסור להכניס אותו לבלוק.
- מותר להשעות אותו זמנית באמצעות Toggle.
- השעיה ב-Toggle אינה מאפסת progression.

### סוגי מבנה Lean

#### Pair — זוג A1/A2

שני תרגילים לא-מתחרים או אנטגוניסטיים.

מבצעים A1, אז A2 ללא מנוחה ביניהם; הטיימר רץ רק לאחר השלמת A2.

#### Circuit — מעגל

רצף תרגילי ליבה/אנדורנס עם מנוחה מינימלית בין התרגילים ומנוחה אחת בין סבבים.

#### Block — בלוק

שני תרגילי תאומים המבוצעים כרצף עם מנוחה אחת משותפת.

#### Toggle — רוטציה

תרגילים או Slotים המתחלפים לפי זוגיות השבוע.

### כללי ברזל לזיווגים

- זוג תקף רק אם שני התרגילים פעילים באותו שבוע/סשן.
- אם אחד לא פעיל — הזוג מתפרק והתרגיל הפעיל מבוצע כסט ישר.
- ב-Deload כל הזיווגים/מעגלים/בלוקים מתפרקים לסטים ישרים.
- רוטציות (Toggles) אינן מתפרקות ב-Deload.
- אם התקבל BELOW באחד מחברי הזוג — הזוג מתפרק לשארית הסשן.
- לאחר BELOW בזוג, שני התרגילים עוברים לסטים ישרים עם מנוחה מלאה נפרדת, ומנוחה אדפטיבית (+30 שניות) מופעלת.
- תרגילים מוגנים לעולם אינם חלק מזוג.

### רוטציית כתף אחורית — יום 3

- שבועות אי-זוגיים: TRX Y-T-W פעיל, Band Pull-Apart כמנוחה בחימום בלבד.
- שבועות זוגיים: Band Pull-Apart פעיל, 3 סטים, TRX Y-T-W לא פעיל.
- שני מצבי ה-progression נשמרים תמיד.
- המעבר ביניהם אינו מאפס שלבים.

### התקדמות ליניארית ופתחי Unlock לפי עץ היכולות (RPG Skill Tree Schedule)

כל התרגילים בתוכנית כפופים ללוח הזמנים הדרגתי של עץ היכולות (Unlock Weeks):

- **Squat Tree**: `Bodyweight Squat` מבוצע בשבועות 1–4. בשבוע 5 ואילך נפתח ומוחלף ל-`Goblet Bulgarian Split Squat`.
- **Glute Focus**: `DB Glute Bridge` מבוצע החל משבוע 1 ברציפות לאורך כל התוכנית.
- **Hamstring Chain**: `Goblet Romanian Deadlift` מבוצע בשבועות 1–17. בשבוע 18 ואילך נפתח ומוחלף ל-`Single-Leg RDL`.
- **Quad Focus**: `Heels-Elevated Goblet Squat` מבוצע החל משבוע 1 ברציפות לאורך כל התוכנית.
- **Core Citadel**: `Dead Bug` פעיל משבוע 1. `Hollow Body Hold` מתווסף למעגל הליבה משבוע 5 ואילך. `Pallof Press Progression` מתווסף משבוע 10 ואילך.
- **Biceps Microcycle**: `Single-Arm Curl` פעיל משבוע 1. `Single-Arm Hammer Curl` מתווסף משבוע 5 ואילך. `Arm Block` מתווסף משבוע 10 ואילך.

המערכת מחליפה ופותחת את התרגילים באופן אוטומטי בהתאם לשבוע הנוכחי ולמצב העץ. השמירה על סטטוס Progression היא לכל תרגיל בנפרד.

==================================================
## 8. סוגי Progression
==================================================

### A. Weighted — תרגילים עם קילוגרמים

- כל הסטים ABOVE → העלה משקל ב-1 ק״ג. עגל למשקל החוקי הבא. אל תעבור את `maxWeight`.
- כל הסטים IN_WINDOW + תנאי softened → העלה משקל ב-1 ק״ג.
- כל הסטים BELOW → הורד משקל ב-1 ק״ג. אל תרד מתחת ל-`minWeight`.
- תוצאה מעורבת → שמור משקל.

### B. Variation — שכיבות סמיכה, מתח, TRX ותרגילי וריאציה

- כל הסטים ABOVE → עלה שלב וריאציה אחד.
- כל הסטים IN_WINDOW + תנאי softened → עלה שלב אחד.
- כל הסטים BELOW → רד שלב אחד, אם יש שלב קודם.
- מעורבת → הישאר בשלב.

### C. Time-Based — החזקות, hangs, L-sit

- כל הסטים ABOVE → עבור לשלב הבא או העלה יעד זמן.
- כל הסטים IN_WINDOW + תנאי softened → עבור לשלב הבא.
- כל הסטים BELOW → רד שלב רק בכישלון מלא בכל הסטים ויש שלב קודם.
- מעורבת → הישאר בשלב.

### D. Myo-Reps — Arm Block בלבד

מבוצע כצביר:

- סט אקטיבציה ליעד חזרות קבוע.
- 3 מיני-סטים של 5 חזרות.
- מנוחה 15 שניות בין מיני-סטים.

העומס/שלב נקבע על ידי המנוע — Zero Decisions.

חוק עצירה:

```js
stopRule: 'two_consecutive_tempo_losses'
```

עוצרים ביעד החזרות או כאשר מתרחשים שני אובדני טמפו רצופים.

חזרות עם אובדן טמפו אינן נספרות כחזרות נקיות.

קידום:

- השלמת הצביר המלא בטכניקה תקינה, ללא אובדן טמפו בכלל → התקדם לשלב/עומס הבא.
- השלמה חלקית, או אובדן טמפו כלשהו → שמור.
- כאב מפרקים → בטל Arm Block.

==================================================
## 9. מיקרו-מחזור בייספס — Day 5
==================================================

מבנה המחזור: 3 שבועות — 2 כבד + 1 קל, חוזר על עצמו ברצף.

| שבוע | תרגילים | סטים | עצימות |
| --- | --- | --- | --- |
| שבוע 1 (כבד) | Single-Arm Curl + Single-Arm Hammer Curl | 2-3 כל אחד | Progression רגיל |
| שבוע 2 (כבד) | Single-Arm Curl + Single-Arm Hammer Curl | 2-3 כל אחד | המשך Progression |
| שבוע 3 (קל) | Single-Arm Hammer Curl בלבד | 2 סטים | ~50-60% נפח, ללא קידום |

### נקודות שילוב

- אין התנגשות עם Deload קבוע.
- Progression מבוסס רק על שבועות כבדים.
- תנאי עצירה ללא שינוי.
- `currentWeight` נשמר בסוף שבוע 2 וחוזר אליו בשבוע 1 הבא.
- בשבוע קל (3), Single-Arm Curl לא פעיל → הזוג push-up-volume ↔ single-arm-curl מתפרק, ו-Push-Up Volume מבוצע כסט ישר.

```js
function getBicepsMicrocycleWeek(weekNumber) {
  if (weekNumber % 8 === 0) {
    return { type: 'deload', exercises: ['single-arm-hammer-curl'], sets: 1 };
  }

  const cyclePosition = ((weekNumber - 1) % 3) + 1;

  switch (cyclePosition) {
    case 1:
      return {
        type: 'heavy',
        exercises: ['single-arm-curl', 'single-arm-hammer-curl'],
        sets: 'progressive',
        progressionAllowed: true
      };
    case 2:
      return {
        type: 'heavy',
        exercises: ['single-arm-curl', 'single-arm-hammer-curl'],
        sets: 'progressive',
        progressionAllowed: true
      };
    case 3:
      return {
        type: 'light',
        exercises: ['single-arm-hammer-curl'],
        sets: 2,
        progressionAllowed: false
      };
  }
}
```

==================================================
## 10. יום 1 — Legs + Core + Carry
==================================================

### חימום קבוע

- High Knees — 30 שניות
- Bodyweight Squat — 2x8
- Dead Bug — 1x6 לכל צד
- Glute Bridge — 1x12

---

## תרגיל 1 א' — Goblet Romanian Deadlift

מוגן, מבוצע בשבועות 1-17. סטים ישרים.

| שדה | ערך |
| --- | --- |
| id | goblet-rdl |
| type | weighted |
| sets | 3 |
| rep window | 6–12 |
| starting weight | 6 ק״ג total |
| min / max weight | 3 / 32 ק״ג total |
| increment | 1 ק״ג total |
| rest | 105 (base), 90–120 |
| tempo | 3 שניות ירידה |
| category | Legs |
| compound | true |
| structure | straight |
| rule | neutral spine קשיח; אם הגב מתעגל, BELOW |

---

## תרגיל 1 ב' — Single-Leg RDL

מוגן, מבוצע משבוע 18 ואילך. סטים ישרים.

| שדה | ערך |
| --- | --- |
| id | single-leg-rdl |
| type | weighted |
| sets | 2 |
| rep window | 8–10 לכל רגל |
| starting weight | 6 ק״ג total |
| min / max weight | 3 / 32 ק״ג total |
| rest | 75 (base), 60–90 |
| structure | straight |
| rule | neutral spine; אם מאבד שיווי משקל, BELOW |

---

## תרגיל 2 — Heels-Elevated Goblet Squat

מוגן, סטים ישרים. מבוצע משבוע 1 לאורך כל התוכנית.

| שדה | ערך |
| --- | --- |
| id | heels-elevated-goblet-squat |
| type | weighted |
| sets | 2 |
| rep window | 8–12 |
| starting weight | 6 ק״ג total |
| min / max weight | 3 / 32 ק״ג total |
| increment | 1 ק״ג total |
| rest | 75 (base), 60–90 |
| tempo | 3s ירידה, 1s השהייה בתחתית, 1s עלייה |
| structure | straight |
| equipment | ספר/בלוק 2–5 ס״מ מתחת לשני העקבים |

---

## תרגיל 3 — Goblet Bulgarian Split Squat

מוגן, סטים ישרים.

| שדה | ערך |
| --- | --- |
| id | goblet-bulgarian-split-squat |
| type | weighted |
| sets | 3 |
| rep window | 6–12 לכל רגל |
| starting weight | 6 ק״ג total |
| min / max weight | 3 / 32 ק״ג total |
| rest | 82 (base), 75–90 |
| structure | straight |

---

## תרגיל 4 — DB Glute Bridge

מוגן, סטים ישרים.

| שדה | ערך |
| --- | --- |
| id | db-glute-bridge |
| type | weighted |
| sets | 3 |
| rep window | 10–15 |
| starting weight | 9 ק״ג total |
| min / max weight | 3 / 32 ק״ג total |
| rest | 75 (base), 60–90 |
| structure | straight |
| rule | כתפיים על ספסל; כפות רגליים רחבות; squeeze glutes |

---

## תרגיל 5 — Suitcase Carry

מוגן, סטים ישרים.

| שדה | ערך |
| --- | --- |
| id | suitcase-carry |
| type | weighted |
| sets | 3 |
| window | 25–40 מטר לכל צד |
| starting weight | 12 ק״ג |
| min / max weight | 6 / 32 ק״ג |
| rest | 60 שניות |
| structure | straight |

---

## בלוק תאומים — Standing + Seated Calf Raise

מבנה הבלוק:

מבצעים סט Standing, אז סט Seated ללא מנוחה ביניהם; מנוחה 45 שניות לאחר השלמת שניהם.

חוזרים עד השלמת כל הסטים:

- Standing 3
- Seated 2

סט Standing אחרון מבוצע לבדו לאחר סיום Seated.

| שדה | Standing Single-Leg Calf Raise | Seated Single-Leg Calf Raise |
| --- | --- | --- |
| id | standing-single-leg-calf-raise | seated-single-leg-calf-raise |
| type | weighted | weighted |
| sets | 3 | 2 |
| rep window | 12–20 לכל רגל | 15–25 לכל רגל |
| starting weight | 6 ק״ג ביד אחת | 6 ק״ג על הברך |
| min / max weight | 3 / 32 ק״ג | 3 / 32 ק״ג |
| rest | בלוק, 45 לאחר הזוג | בלוק, 45 לאחר הזוג |
| tempo | 2s ירידה, 1s עצירה בתחתית, 1s כיווץ | 2s ירידה, 1s עצירה בתחתית, 1s כיווץ |
| structure | block:d1-calf-block | block:d1-calf-block |
| blockOrder | 1 | 2 |

---

## מעגל Core — Pallof + Dead Bug + Hollow Body

מבנה המעגל:

מבצעים Pallof → Dead Bug → Hollow Body ברצף עם מנוחה מינימלית בין התרגילים; מנוחה 30 שניות לאחר השלמת סבב מלא.

המעגל מבוצע בסוף האימון בלבד, לאחר כל התרגילים המורכבים הכבדים.

| שדה | Pallof Press Progression | Dead Bug | Hollow Body Hold |
| --- | --- | --- | --- |
| id | pallof-press-progression | dead-bug | hollow-body-hold |
| type | variation | variation | timebased |
| sets | 2 | 3 | 2 |
| window | 10–12 לכל צד | 12–20 לכל צד | 20–30 שניות |
| rest | מעגל, 30 בין סבבים | מעגל, 30 בין סבבים | מעגל, 30 בין סבבים |
| structure | circuit:d1-core-circuit | circuit:d1-core-circuit | circuit:d1-core-circuit |
| circuitOrder | 1 | 2 | 3 |
| stages | Pallof Hold (2h,30kg) → Pallof Press (2h,30kg) → Single-Arm (30kg) → Single-Arm (40kg) → Single-Arm Split Stance (40kg) → Single-Arm (50kg) → Single-Arm One Leg (50kg) | Bodyweight, 1 ק״ג, 2 ק״ג, 3 ק״ג | Tuck Hold, One-Leg Extended, Hollow Hold |
| rule | אין תנועה בגב; אם הגוף מסתובב, BELOW | — | — |

==================================================
## 11. יום 3 — Push + Shoulders + Triceps + Back Volume
==================================================

### חימום קבוע

- Arm Circles — 10 לכל כיוון
- Wall Slides — 1x8
- Scapular Push-Up — 2x10
- Band Pull-Apart — 1x15

---

## תרגיל 1 — Pike Hold / Pike Push-Up

מוגן, סטים ישרים.

| שדה | ערך |
| --- | --- |
| id | pike-progression |
| type | variation |
| sets | 2 |
| window | 15–30 שניות או 6–12 חזרות |
| rest | 75 (base), 60–90 |
| structure | straight |
| stages | Pike Hold → Feet-Elevated Pike Hold → Pike Push-Up → Elevated Pike Push-Up |

---

## תרגיל 2 — Single-Arm Floor Press

מוגן, סטים ישרים.

| שדה | ערך |
| --- | --- |
| id | single-arm-floor-press |
| type | weighted |
| sets | 3 |
| rep window | 6–12 |
| starting weight | 6 ק״ג |
| min / max weight | 3 / 32 ק״ג |
| rest | 90 (base), 75–105 |
| structure | straight |

---

## תרגיל 3 — Push-Up Bars Progression

מוגן, סטים ישרים.

| שדה | ערך |
| --- | --- |
| id | push-up-progression |
| type | variation |
| sets | 3 |
| rep window | 8–15 |
| rest | 75 (base), 60–90 |
| structure | straight |
| note | חובה Push-Up Bars |
| stages | Incline Push-Up → Push-Up → Deficit Push-Up → Weighted Deficit (וסט 5 ק״ג) |

---

## תרגיל 4 — Single-Arm Seated OHP

מוגן, סטים ישרים.

| שדה | ערך |
| --- | --- |
| id | single-arm-seated-ohp |
| type | weighted |
| sets | 3 |
| rep window | 6–12 |
| starting weight | 6 ק״ג |
| min / max weight | 3 / 32 ק״ג |
| rest | 75 (base), 60–90 |
| structure | straight |

---

## תרגיל 5 — DB Overhead Triceps Extension

מוגן, סטים ישרים.

| שדה | ערך |
| --- | --- |
| id | db-overhead-triceps-extension |
| type | weighted |
| sets | 4 |
| rep window | 10–15 |
| starting weight | 6 ק״ג total |
| min / max weight | 3 / 32 ק״ג total |
| rest | 45 שניות |
| structure | straight |

---

## תרגיל 6 — Diamond Push-Up

מוגן, סטים ישרים.

| שדה | ערך |
| --- | --- |
| id | diamond-push-up |
| type | variation |
| sets | 2 |
| rep window | 10–15 |
| rest | 45 שניות |
| structure | straight |
| stages | Incline Diamond → Diamond Push-Up → Weighted Diamond (וסט 5 ק״ג) |

---

## זוג Lean — TRX Row ↔ Single-Arm Lateral Raise

מבנה הזוג:

מבצעים סט TRX Row, אז סט Single-Arm Lateral Raise ללא מנוחה ביניהם; מנוחה 75 שניות לאחר השלמת שניהם.

שני התרגילים בני 2 סטים.

| שדה | TRX Row | Single-Arm Lateral Raise |
| --- | --- | --- |
| id | trx-row | single-arm-lateral-raise |
| type | variation | weighted |
| sets | 2 | 2 |
| rep window | 10–15 | 12–20 |
| starting weight | — | 3 ק״ג |
| min / max weight | — | 3 / 12 ק״ג |
| rest | pair:d3-row-lateral, 75 לאחר הזוג | pair:d3-row-lateral, 75 לאחר הזוג |
| structure | pair | pair |
| pairId | d3-row-lateral | d3-row-lateral |
| orderInPair | 1 | 2 |
| pairType | non-competing | non-competing |
| purpose | weekly_back_frequency_2 | — |
| stages | Angle 1 → Angle 2 (45°) → Angle 3 → Feet-Elevated | — |
| rule | גוף קשיח, אין swing; squeeze shoulder blades | 2 שניות ירידה |

---

## רוטציית כתף אחורית — TRX Y-T-W / Band Pull-Apart

| שדה | TRX Y-T-W | Band Pull-Apart |
| --- | --- | --- |
| id | trx-ytw | band-pull-apart |
| type | variation | variation |
| sets | 2 | 3 |
| rep window | 8–12 מכל צורה | 15–20 |
| rest | 45 שניות | 45 שניות |
| toggleGroup | rear-delt | rear-delt |
| toggleActiveOn | odd | even |
| stages | Angle 1, Angle 2, Angle 3 | Band 30kg → Band 40kg → Band 50kg |
| rule | — | כתפיים למטה, squeeze shoulder blades, אין shrugging |

==================================================
## 12. יום 5 — Pull + Grip + Core + Chest Volume
==================================================

### חימום קבוע

- Arm Circles — 10 לכל כיוון
- Wall Slides — 1x8
- Scapular Push-Up — 2x6
- Dead Hang — 1x15 שניות
- Seated Band Row — 1x12

---

## תרגיל 1 — Pull-Up Progression

מוגן, סטים ישרים.

| שדה | ערך |
| --- | --- |
| id | pull-up-progression |
| type | variation |
| sets | 3 |
| rep window | 4–8 |
| rest | 90 (base), 75–105 |
| structure | straight |
| stages | Negative Pull-Up → Pull-Up → Chin-Up → Pull-Up + וסט 2 ק״ג → + וסט 4 ק״ג → + וסט 5 ק״ג |

---

## תרגיל 2 — One-Arm DB Row

מוגן, סטים ישרים.

| שדה | ערך |
| --- | --- |
| id | one-arm-db-row |
| type | weighted |
| sets | 3 |
| rep window | 6–12 לכל צד |
| starting weight | 6 ק״ג |
| min / max weight | 3 / 32 ק״ג |
| rest | 75 (base), 60–90 |
| structure | straight |
| rule | neutral spine; ללא סיבוב גוף מפצה |

---

## תרגיל 3 — TRX Face Pull

סטים ישרים.

| שדה | ערך |
| --- | --- |
| id | trx-face-pull |
| type | variation |
| sets | 2 |
| rep window | 12–20 |
| rest | 45 שניות |
| structure | straight |
| stages | Angle 1, Angle 2, Angle 3 |

---

## תרגיל 4 — Single-Arm Curl

מיקרו-מחזור, מוגן, סטים ישרים.

| שדה | ערך |
| --- | --- |
| id | single-arm-curl |
| type | weighted |
| sets | 2-3 לפי מיקרו-מחזור |
| rep window | 10–15 |
| starting weight | 3 ק״ג |
| min / max weight | 3 / 20 ק״ג |
| rest | 45 שניות |
| structure | straight |
| microcycle | biceps-microcycle |
| activeWeeks | [1, 2] |
| note | מתפקד כחבר בזוג push-up-volume רק בשבועות 1-2 |

---

## תרגיל 5 — Single-Arm Hammer Curl

מיקרו-מחזור, מוגן, סטים ישרים.

| שדה | ערך |
| --- | --- |
| id | single-arm-hammer-curl |
| type | weighted |
| sets | 2-3 לפי מיקרו-מחזור |
| rep window | 10–12 |
| starting weight | 3 ק״ג |
| min / max weight | 3 / 20 ק״ג |
| rest | 45 שניות |
| structure | straight |
| microcycle | biceps-microcycle |
| activeWeeks | [1, 2, 3] |
| lightWeekConfig | { sets: 2, progressionAllowed: false } |

---

## זוג Lean אנטגוניסט — Push-Up Volume ↔ Single-Arm Curl

מבנה הזוג:

מבצעים סט Push-Up Volume, אז סט Single-Arm Curl ללא מנוחה ביניהם; מנוחה 75 שניות לאחר השלמת שניהם.

הזוג פעיל רק כאשר Single-Arm Curl פעיל, כלומר שבועות מיקרו 1-2.

בשבוע קל (3) או ב-Deload הזוג מתפרק ו-Push-Up Volume מבוצע כסט ישר.

| שדה | Push-Up Volume (Day 5) | Single-Arm Curl |
| --- | --- | --- |
| id | push-up-volume-day5 | single-arm-curl |
| type | variation | weighted |
| sets | 2 | 2-3 |
| rep window | 10–15 | 10–15 |
| rest | pair:d5-pushup-curl, 75 לאחר הזוג | pair:d5-pushup-curl, 75 לאחר הזוג |
| structure | pair | pair |
| pairId | d5-pushup-curl | d5-pushup-curl |
| orderInPair | 1 | 2 |
| pairType | antagonist | antagonist |
| purpose | weekly_chest_frequency_2 | — |
| progressionLink | push-up-progression | — |
| rule | חובה Push-Up Bars; גוף קשיח; אין קימור גב תחתון | אין swing; עצור בכאב מרפק |

הערה:

כאשר מספר הסטים של Single-Arm Curl (3) גדול מזה של Push-Up Volume (2), הסט הנוסף של Single-Arm Curl מבוצע כסט ישר נפרד לאחר פירוק הזוג.

---

## זוג Lean לא-מתחרה — Towel Hang ↔ L-Sit

מבנה הזוג:

מבצעים סט Towel Hang, אז סט L-Sit ללא מנוחה ביניהם; מנוחה 45 שניות לאחר השלמת שניהם.

| שדה | Towel Hang | L-Sit Progression |
| --- | --- | --- |
| id | towel-hang | l-sit-progression |
| type | timebased | timebased |
| sets | 2 | 2 |
| window | 15–45 שניות | 8–20 שניות |
| rest | pair:d5-grip-lsit, 45 לאחר הזוג | pair:d5-grip-lsit, 45 לאחר הזוג |
| structure | pair | pair |
| pairId | d5-grip-lsit | d5-grip-lsit |
| orderInPair | 1 | 2 |
| pairType | non-competing | non-competing |
| stages | Dead Hang → Towel Hang → Towel Hang + וסט 5 ק״ג | Tuck L-Sit → One-Leg Extended L-Sit → Full L-Sit |

==================================================
## 13. אירובי, התאוששות ותנועתיות
==================================================

### Day 2 — Zone 2

- 45 דקות הליכה.
- מהירות התחלה 5.5 קמ״ש.
- שיפוע: 3% בשבועות 1–4, 4% בשבועות 5–8, 5% בשבועות 9–16, 6% לאחר מכן.
- מבחן דיבור: חייבת להיות אפשרות לדבר במשפט מלא; אם לא, הורד ל-5.0 קמ״ש.
- ב-Deload: 30 דקות, 5.0 קמ״ש, 2% שיפוע.

### Day 4 — Active Recovery + Joint Health

- בתחילת הסשן (A1), 5 דקות פרוטוקול צוואר (Cervical Health):
  - **Band Neck Flexion & Extension** (כפיפה ופשיטה כנגד גומייה מעוגנת בגובה הראש על המתח)
  - 2 סטים × 15-20 חזרות בכל כיוון (Flexion 2×15-20, Extension 2×15-20), טמפו איטי 3-1-3 עם Chin Tuck קבוע. מנוחה 45 שניות.
  - שלבי progression: גומייה 30 ק״ג (עיגון קרוב) ← גומייה 30 ק״ג (צעד אחורה) ← גומייה 40 ק״ג ← גומייה 50 ק״ג.
- בהמשך (A2), 25 דקות הליכה, 4.5 קמ״ש, שיפוע 0%.
- בסיום (A3), 10 דקות Mobility:
  - Cat-Cow 10
  - 90/90 Hip Stretch 8 לכל צד
  - Thoracic Rotations 8 לכל צד
  - Couch Stretch 45 שניות לכל צד
  - Sleeper Stretch 30 שניות לכל צד
  - Prone Y-T-W 8 לכל צורה

### Day 6 — VO2 Max 4x4

- חימום 10 דקות 4.5 קמ״ש 0%.
- 4 סבבים:
  - עבודה 4 דקות 6.5 קמ״ש, שיפוע עד 6%
  - התאוששות 3 דקות 4.5 קמ״ש 0%
- סיום 5 דקות 4.0 קמ״ש 0%.
- אין ספרינטים.
- ב-Deload: החלף ל-30 דקות Zone 2 קל.

### Micro Mobility לאחר כל יום כוח

- Dead Hang 30 שניות
- Deep Squat Hold 60 שניות
- Doorway Chest Stretch 30 שניות לכל צד
- World's Greatest Stretch 5 לכל צד

==================================================
## 14. Arm Block — Myo-Reps מותנה בהתאוששות
==================================================

Arm Block פעיל מהשבוע ה-10 ואילך.

### תנאי הפעלה

```js
function isArmBlockAllowed(dayTrackingData, weekNumber) {
  const settings = window.TRAININGDATA.progressionSettings.armBlock;
// Keep this check BEFORE the Deload check:
// Arm Block must not run before week 10, including Deload week 8.

  if (weekNumber < settings.enabledFromWeek) {
    return { active: false, reason: 'arm_block_not_started_yet' };
  }

  if (weekNumber % 8 === 0) {
    return { active: true, sets: 1, reason: 'deload_single_set' };
  }

  const mainExercises = getMainExercisesForDay(dayTrackingData.dayIndex);

  const anyMainBelow = mainExercises.some(exId => {
    const sets = dayTrackingData.setData[exId];
    return sets && sets.every(s => s.result === 'below');
  });

  if (anyMainBelow) {
    return { active: false, reason: 'main_exercise_failure' };
  }

  const lastTwoSessions = getLastTwoSessionsForDay(dayTrackingData.dayIndex);

  if (lastTwoSessions.length === 2) {
    const bothDeclining = lastTwoSessions.every(session => session.hasMainExerciseDecline);
    if (bothDeclining) {
      return { active: false, reason: 'consecutive_decline_until_deload' };
    }
  }

  if (dayTrackingData.elbowPain || dayTrackingData.shoulderPain) {
    return { active: false, reason: 'joint_pain_reported' };
  }

  const plannedArmBlockExercises = getArmBlockExerciseIdsForDay(
    dayTrackingData.dayIndex,
    weekNumber
  );

  const exposureLimitReached = checkWeeklyArmBlockExposureLimit(
    dayTrackingData.dayIndex,
    weekNumber,
    plannedArmBlockExercises
  );

  if (exposureLimitReached) {
    return {
      active: false,
      reason: 'weekly_arm_block_exposure_limit'
    };
  }

  return { active: true, sets: 2, reason: 'normal' };
}
```

### כללי Arm Block

- מבוצע רק לאחר שכל תרגילי הכוח העיקריים הושלמו.
- אם תרגיל עיקרי כלשהו ביום קיבל BELOW בכל הסטים — Arm Block מבוטל לאותו יום.
- אם יש שני אימונים רצופים עם ירידה בכוח בתרגילים עיקריים — Arm Block מבוטל עד ה-Deload הבא.
- אם המשתמש מדווח על כאב מרפק או כתף — Arm Block מבוטל עד אישור.
- בשבוע Deload: סט אקטיבציה יחיד בלבד, ללא מיני-סטים.
- Arm Block משתמש בחוק השלבים: progression מבוסס שלב/עומס, לא משקל חופשי.
- אין שינוי ב-Arm Block עקב מיקרו-מחזור הבייספס.
- Arm Block מוגבל לחשיפה אחת בשבוע לכל אזור שרירי.

### הגדרת Arm Block Exposure

```js
armBlock: {
  enabledFromWeek: 10,
  maxArmBlockExposurePerMusclePerWeek: 1,
  muscleAreaMap: {
    3: {
      "single-arm-lateral-raise": "lateral-shoulder",
      "db-overhead-triceps-extension": "triceps"
    },
    5: {
      "single-arm-curl": "biceps",
      "single-arm-hammer-curl": "biceps"
    }
  }
}
```

### משמעות החשיפה

- אם Arm Block כבר בוצע בשבוע הנוכחי עבור אזור מסוים, לא ניתן להפעיל Arm Block נוסף לאותו אזור באותו שבוע.
- חשיפה נספרת רק כאשר בוצע ונשמר לפחות סט אקטיבציה אחד של Myo-Reps בפועל.
- ביטול לפני ביצוע אינו נספר כחשיפה.
- ב-Deload, סט אקטיבציה יחיד נספר כחשיפה.
- אם אחד מהתרגילים המתוכננים ב-Arm Block שייך לאזור שכבר קיבל חשיפה שבועית, ה-Arm Block כולו מבוטל לאותו יום.

---

## פרוטוקול Myo-Reps — צביר חסוי

```js
myoConfig: {
  activationReps: 'stage_target',
  miniSets: 3,
  miniReps: 5,
  miniRestSeconds: 15,
  stopRule: 'two_consecutive_tempo_losses',
  tempoLossDefinition: [
    'eccentric_under_2_seconds',
    'swing_or_momentum',
    'technique_breakdown',
    'unplanned_mechanical_stop'
  ],
  countOnlyCleanReps: true,
  requireNoTempoLossForAdvance: true,
  progressionRule: 'full_cluster_clean_advance'
}
```

### סט אקטיבציה

- מבוצע ליעד החזרות של השלב הנוכחי.
- עוצרים ביעד החזרות.
- אם מתרחשים שני אובדני טמפו רצופים לפני הגעה ליעד — עוצרים מיד.
- חזרות עם אובדן טמפו אינן נספרות כחזרות נקיות.
- אם היה אובדן טמפו כלשהו, האקטיבציה אינה נחשבת clean, גם אם הושלם יעד החזרות בהמשך.

### מנוחה

- 15 שניות לאחר סט האקטיבציה.
- 15 שניות בין כל מיני-סט.

### מיני-סטים

- 3 מיני-סטים.
- 5 חזרות נקיות בכל מיני-סט.
- אם מתרחשים שני אובדני טמפו רצופים — המיני-סט מסתיים.
- חזרות עם אובדן טמפו אינן נספרות.
- מיני-סט עם אובדן טמפו כלשהו אינו נחשב clean.

### קידום

- השלמת הצביר המלא: אקטיבציה + כל המיני-סטים, ללא אובדן טמפו בכלל → עלייה לשלב/עומס הבא.
- השלמה חלקית → שמירה.
- אובדן טמפו כלשהו → שמירה.
- כאב מפרקים → ביטול Arm Block.

### Day 3 Arm Block

- Single-Arm Lateral Raise + DB Overhead Triceps Extension
- צביר Myo-Reps לכל תרגיל

שלבי Lateral Raise:

```text
3kg → 4kg → 5kg → 6kg → 7kg → 8kg
```

שלבי Triceps Extension:

```text
6kg → 7kg → 8kg → 9kg → 10kg → 12kg
```

### Day 5 Arm Block — alternation שבועי

- שבועות אי-זוגיים: Single-Arm Curl, צביר Myo-Reps.
- שבועות זוגיים: Single-Arm Hammer Curl, צביר Myo-Reps.

שלבי Single-Arm Curl:

```text
3kg → 4kg → 5kg → 6kg → 7kg → 8kg
```

שלבי Single-Arm Hammer Curl:

```text
3kg → 4kg → 5kg → 6kg → 7kg → 8kg
```

### תצוגת Arm Block במסך

- אם פעיל: "Arm Block פעיל — Myo-Reps [תרגילים]"
- אם מבוטל: "Arm Block מבוטל היום — [סיבה]"
- אם Deload: "Arm Block — סט אקטיבציה יחיד (Deload)"
- אם נחסם בגלל חשיפה שבועית: "Arm Block מבוטל — כבר בוצע Arm Block לאזור השרירי הזה השבוע"

==================================================
## 15. מבנה data.js
==================================================

```js
window.TRAININGDATA = {
  version: 15.6,
  programName: "FitUp v15.6 Lean",
  programType: "Adaptive 3-Day Strength + Lean Pairing + Frequency Optimization + Day1 Toggle + Objective Myo Stop + Arm Block Exposure Limit",
  progressionSettings: {
    deloadEveryWeeks: 8,
    deloadWeightReductionKg: 2,
    deloadTimeTargetPercent: 70,
    deloadSetsCeiling: 2,
    legalWeights: [3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32],
    decisionPolicy: "softened-all-above-progress_max-or-max-minus-1-plus-prev-max-maintain",
    allowUndoLastDecision: true,
    zeroDecisions: true,
    adaptiveRest: true,
    armBlockConditional: true,
    armBlock: {
      enabledFromWeek: 10,
      maxArmBlockExposurePerMusclePerWeek: 1,
      muscleAreaMap: {
        3: {
          "single-arm-lateral-raise": "lateral-shoulder",
          "db-overhead-triceps-extension": "triceps"
        },
        5: {
          "single-arm-curl": "biceps",
          "single-arm-hammer-curl": "biceps"
        }
      }
    },
    bicepsMicrocycle: {
      cycleLength: 3,
      heavyWeeks: [1, 2],
      lightWeeks: [3],
      lightWeekExercises: ["single-arm-hammer-curl"],
      lightWeekSets: 2,
      lightWeekProgressionAllowed: false
    },
    softenedProgression: {
      requireCurrentSessionMaxOrMaxMinus1: true,
      requirePreviousSessionAllMax: true,
      requireNoMechanicalStop: true
    },
    frequencyAdditions: {
      day3_backVolume: {
        exerciseId: "trx-row",
        sets: 2,
        purpose: "back_frequency_2"
      },
      day5_chestVolume: {
        exerciseId: "push-up-volume-day5",
        sets: 2,
        purpose: "chest_frequency_2"
      }
    },
    leanMode: {
      enabled: true,
      protectCompounds: true,
      protectedExercises: [
        "goblet-rdl",
        "single-leg-rdl",
        "goblet-bulgarian-split-squat",
        "goblet-reverse-lunge",
        "pistol-squat-progression",
        "db-hip-thrust",
        "suitcase-carry",
        "pike-progression",
        "single-arm-floor-press",
        "push-up-progression",
        "single-arm-seated-ohp",
        "db-overhead-triceps-extension",
        "diamond-push-up",
        "pull-up-progression",
        "one-arm-db-row",
        "single-arm-curl",
        "single-arm-hammer-curl"
      ],
      pairs: [
        {
          pairId: "d3-row-lateral",
          dayIndex: 3,
          type: "non-competing",
          members: [
            { exerciseId: "trx-row", orderInPair: 1 },
            { exerciseId: "single-arm-lateral-raise", orderInPair: 2 }
          ],
          restAfterPair: 75,
          dissolveOnDeload: true,
          dissolveIfMemberInactive: true
        },
        {
          pairId: "d5-pushup-curl",
          dayIndex: 5,
          type: "antagonist",
          members: [
            { exerciseId: "push-up-volume-day5", orderInPair: 1 },
            { exerciseId: "single-arm-curl", orderInPair: 2 }
          ],
          restAfterPair: 75,
          dissolveOnDeload: true,
          dissolveIfMemberInactive: true
        },
        {
          pairId: "d5-grip-lsit",
          dayIndex: 5,
          type: "non-competing",
          members: [
            { exerciseId: "towel-hang", orderInPair: 1 },
            { exerciseId: "l-sit-progression", orderInPair: 2 }
          ],
          restAfterPair: 45,
          dissolveOnDeload: true,
          dissolveIfMemberInactive: true
        }
      ],
      circuits: [
        {
          circuitId: "d1-core-circuit",
          dayIndex: 1,
          members: [
            "pallof-press-progression",
            "dead-bug",
            "hollow-body-hold"
          ],
          restBetweenRounds: 30,
          placement: "end_of_day",
          dissolveOnDeload: true
        }
      ],
      blocks: [
        {
          blockId: "d1-calf-block",
          dayIndex: 1,
          members: [
            "standing-single-leg-calf-raise",
            "seated-single-leg-calf-raise"
          ],
          restAfterBlock: 45,
          dissolveOnDeload: true
        }
      ],
      toggles: [
        {
          toggleGroup: "rear-delt",
          dayIndex: 3,
          retainBothStates: true,
          dissolveOnDeload: false,
          members: [
            { exerciseId: "trx-ytw", activeOn: "odd" },
            { exerciseId: "band-pull-apart", activeOn: "even" }
          ]
        },
        {
          toggleGroup: "day1-posterior-quad",
          dayIndex: 1,
          retainBothStates: true,
          dissolveOnDeload: false,
          members: [
            {
              exerciseId: "single-leg-rdl",
              activeOn: "odd"
            },
            {
              slotId: "lunge-pistol-slot",
              activeOn: "even",
              fallbackExerciseId: "goblet-reverse-lunge",
              unlockedExerciseId: "pistol-squat-progression",
              unlockExerciseId: "pistol-squat-progression"
            }
          ]
        }
      ]
    }
  },
  weeklySchedule: [...],
  exercises: [...],
  daily: [...]
};
```

==================================================
## 16. IndexedDB — גרסה ו-Stores
==================================================

גרסה:

```js
DBVERSION = 9;
```

### Stores

- trainingPlan
- dayTracking
- exerciseGuide
- settings
- progressPhotos
- nutritionTracking
- progressionState
- progressionHistory
- adaptiveRestHistory
- armBlockStatus
- armBlockExposure
- leanSessionState
- myoClusterHistory

### מבנה leanSessionState

keyPath: `sessionKey`

שומר פירוק זוגות לסשן, רוטציות פעילות ומבנה Lean.

```js
{
  sessionKey: "workout:dayIndex:15",
  dayIndex: 15,
  weekNumber: 3,
  dissolvedPairs: ["d5-pushup-curl"],
  dissolveReasons: {
    "d5-pushup-curl": "member_inactive_light_week"
  },
  activeToggle: {
    "rear-delt": "trx-ytw",
    "day1-posterior-quad": "single-leg-rdl"
  },
  armBlockScheme: "myo-reps",
  updatedAt: "2026-08-21T00:00:00.000Z"
}
```

### מבנה progressionState

keyPath: `exerciseId`

```js
{
  exerciseId: "single-leg-rdl",
  currentWeight: 6,
  currentStage: null,
  effectiveWeight: 6,
  weightMode: "each",
  currentSets: 2,
  windowMin: 8,
  windowMax: 10,
  lastOutcome: "maintain",
  lastSessionKey: "workout:dayIndex:15",
  lastDecisionId: "decision:uuid",
  previousSessionReps: [10, 10],
  structure: "straight",
  pairId: null,
  toggleGroup: "day1-posterior-quad",
  toggleActiveOn: "odd",
  unlocked: null,
  myoConfig: null,
  microcycleSnapshot: null,
  deloadSnapshot: null,
  updatedAt: "2026-08-21T00:00:00.000Z",
  schemaVersion: 15.6
}
```

### מבנה armBlockExposure

keyPath: `id`

```js
{
  id: "exposure:2026-W34:day3:lateral-shoulder",
  weekNumber: 34,
  dayIndex: 3,
  exerciseId: "single-arm-lateral-raise",
  muscleArea: "lateral-shoulder",
  scheme: "myo-reps",
  setsCompleted: 1,
  recordedAt: "2026-08-21T00:00:00.000Z"
}
```

### מבנה myoClusterHistory

keyPath: `sessionKey + exerciseId`

```js
{
  sessionKey: "workout:dayIndex:3",
  exerciseId: "single-arm-lateral-raise",
  activation: {
    target: 12,
    cleanReps: 12,
    totalRepsAttempted: 12,
    anyTempoLoss: false,
    tempoLossStop: false,
    jointPainReported: false
  },
  miniSets: [
    {
      setNumber: 1,
      target: 5,
      cleanReps: 5,
      totalRepsAttempted: 5,
      anyTempoLoss: false,
      tempoLossStop: false
    }
  ],
  result: "full_clean",
  updatedAt: "2026-08-21T00:00:00.000Z"
}
```

==================================================
## 17. API ב-db.js
==================================================

### פונקציות בסיס

```js
getProgressionState(exerciseId)
getAllProgressionStates()
saveProgressionState(state)
getProgressionHistory(exerciseId)
getLastProgressionDecision(exerciseId)
commitExerciseProgression(payload)
undoLastProgressionDecision(exerciseId)
initializeProgressionStatesFromProgram()
exportData()
importData(data, merge)
saveAdaptiveRestHistory(...)
getAdaptiveRestHistory(exerciseId)
checkUnlockCriteria(exerciseId)
getBicepsMicrocycleWeek(weekNumber)
saveMicrocycleSnapshot(exerciseId, weekNumber)
restoreMicrocycleSnapshot(exerciseId)
checkArmBlockEligibility(dayIndex, weekNumber)
saveArmBlockStatus(status)
getArmBlockStatus(sessionKey)
getActiveLeanStructure(dayIndex, weekNumber)
dissolvePairForSession(sessionKey, pairId, reason)
getToggleActiveExercise(toggleGroup, weekNumber, allProgressionStates)
resolveToggleSlot(slotMember, allProgressionStates)
isExerciseUnlocked(exerciseId, allProgressionStates)
saveLeanSessionState(state)
getLeanSessionState(sessionKey)
saveMyoClusterResult(sessionKey, exerciseId, clusterResult)
getMyoClusterResult(sessionKey, exerciseId)
saveArmBlockExposure(exposure)
getArmBlockExposuresForWeek(weekNumber)
checkWeeklyArmBlockExposureLimit(dayIndex, weekNumber, exerciseIds)
recordArmBlockExposure(dayIndex, weekNumber, exerciseId)
```

### פעולה קריטית — commitExerciseProgression

טרנזקציה יחידה על:

- dayTracking
- progressionState
- progressionHistory
- adaptiveRestHistory
- armBlockStatus
- armBlockExposure
- leanSessionState
- myoClusterHistory

הטרנזקציה חייבת:

- לשמור תוצאות סטים ב-dayTracking.
- לחשב החלטה רק אם כל הסטים קיימים.
- לבדוק אם קיים finalizedDecisionId ולהחזיר החלטה קיימת בלי כפל.
- לבדוק שבוע קל במיקרו-מחזור — אם כן, לא לבצע החלטת קידום.
- לבדוק האם התרגיל פעיל או מושעה עקב Toggle.
- לא לבצע החלטת קידום לתרגיל מושעה.
- לבדוק softened progression.
- לעדכן progressionState כולל previousSessionReps.
- לשמור microcycleSnapshot בסוף שבוע 2.
- ליצור progressionHistory רק בהחלטה ראשונה לסשן.
- לבדוק unlock criteria לתרגילים נעולים.
- לחשב ולשמור next session rest.
- לבדוק Arm Block eligibility ולשמור סטטוס.
- לזהות BELOW בתרגיל מזווג ולהפעיל dissolvePairForSession.
- לשמור תוצאות Myo-Reps כ-cleanReps, tempoLossStop, anyTempoLoss.
- לרשום Arm Block Exposure רק לאחר ביצוע בפועל.
- לבצע rollback מלא בכישלון.

==================================================
## 18. ProgressionEngine
==================================================

קובץ:

```text
js/progression.js
```

```js
class ProgressionEngine {
  constructor(programSettings) {}

  getExercise(exerciseId) {}
  evaluateSetResults(exercise, setResults) {}
  calculateWeightedDecision(exercise, state, setResults, weekNumber) {}
  calculateStageDecision(exercise, state, setResults, weekNumber) {}
  evaluateMyoReps(exercise, state, clusterResults) {}
  applyDeload(exercise, state) {}
  getDisplayPrescription(exercise, state, isDeload) {}
  createInitialState(exercise) {}
  calculateOpeningRest(exercise, previousSessionData) {}
  calculateIntraWorkoutRest(exercise, currentSetResult, baseRest) {}
  calculateNextSessionRest(exercise, currentSessionData) {}
  checkSoftenedProgression(exercise, state, setResults) {}
  checkUnlockCriteria(exercise, allProgressionStates) {}
  getBicepsMicrocycleWeek(weekNumber) {}
  isProgressionAllowed(exercise, weekNumber) {}
  checkArmBlockEligibility(dayTrackingData, weekNumber) {}
  checkWeeklyArmBlockExposureLimit(dayIndex, weekNumber, exerciseIds) {}
  getActiveLeanStructure(dayIndex, weekNumber) {}
  isPairActive(pair, weekNumber, allProgressionStates) {}
  decomposePairOnBelow(pairId, sessionKey) {}
  getToggleActiveExercise(toggle, weekNumber, allProgressionStates) {}
  resolveToggleSlot(slotMember, allProgressionStates) {}
  isExerciseUnlocked(exerciseId, allProgressionStates) {}
}
```

### getActiveLeanStructure

```js
getActiveLeanStructure(dayIndex, weekNumber) {
  const lean = this.settings.leanMode;
  const isDeload = weekNumber % this.settings.deloadEveryWeeks === 0;

  const result = {
    pairs: [],
    circuits: [],
    blocks: [],
    activeToggles: {},
    allDissolved: isDeload
  };

  if (!lean.enabled) {
    return result;
  }

  for (const toggle of lean.toggles.filter(t => t.dayIndex === dayIndex)) {
    result.activeToggles[toggle.toggleGroup] = this.getToggleActiveExercise(
      toggle,
      weekNumber,
      this.allProgressionStates
    );
  }

  if (isDeload) {
    return result;
  }

  for (const pair of lean.pairs.filter(p => p.dayIndex === dayIndex)) {
    if (this.isPairActive(pair, weekNumber)) {
      result.pairs.push(pair);
    }
  }

  for (const circuit of lean.circuits.filter(c => c.dayIndex === dayIndex)) {
    result.circuits.push(circuit);
  }

  for (const block of lean.blocks.filter(b => b.dayIndex === dayIndex)) {
    result.blocks.push(block);
  }

  return result;
}
```

### isPairActive

```js
isPairActive(pair, weekNumber) {
  if (pair.dissolveOnDeload && weekNumber % this.settings.deloadEveryWeeks === 0) {
    return false;
  }

  for (const member of pair.members) {
    const ex = this.getExercise(member.exerciseId);

    if (ex.microcycle === 'biceps-microcycle') {
      const cycleWeek = this.getBicepsMicrocycleWeek(weekNumber);
      if (!cycleWeek.exercises.includes(member.exerciseId)) {
        return false;
      }
    }
  }

  return true;
}
```

### decomposePairOnBelow

```js
decomposePairOnBelow(pairId, sessionKey) {
  return {
    pairId,
    dissolved: true,
    scope: 'rest_of_session',
    applyAdaptiveRestExtension: true,
    extensionSeconds: 30,
    fallbackStructure: 'straight_separate_rest'
  };
}
```

### getToggleActiveExercise

```js
getToggleActiveExercise(toggle, weekNumber, allProgressionStates) {
  const parity = weekNumber % 2 === 0 ? 'even' : 'odd';

  const member = toggle.members.find(m => m.activeOn === parity);

  if (!member) {
    return null;
  }

  if (member.slotId) {
    return this.resolveToggleSlot(member, allProgressionStates);
  }

  return member.exerciseId;
}
```

### resolveToggleSlot

```js
resolveToggleSlot(slotMember, allProgressionStates) {
  if (
    slotMember.unlockedExerciseId &&
    this.isExerciseUnlocked(slotMember.unlockedExerciseId, allProgressionStates)
  ) {
    return slotMember.unlockedExerciseId;
  }

  return slotMember.fallbackExerciseId;
}
```

### isExerciseUnlocked

```js
isExerciseUnlocked(exerciseId, allProgressionStates) {
  const state = allProgressionStates?.[exerciseId];

  if (!state) {
    return false;
  }

  if (typeof state.unlocked === 'boolean') {
    return state.unlocked;
  }

  return this.checkUnlockCriteria(exerciseId, allProgressionStates);
}
```

### checkWeeklyArmBlockExposureLimit

```js
checkWeeklyArmBlockExposureLimit(dayIndex, weekNumber, exerciseIds) {
  const settings = this.settings.armBlock;
  const limit = settings.maxArmBlockExposurePerMusclePerWeek;
  const muscleAreaMap = settings.muscleAreaMap[dayIndex];

  if (!muscleAreaMap) return false;

  const exposures = this.getArmBlockExposuresForWeek(weekNumber);

  for (const exerciseId of exerciseIds) {
    const muscleArea = muscleAreaMap[exerciseId];

    if (!muscleArea) continue;

    const currentExposure = exposures[muscleArea] || 0;

    if (currentExposure >= limit) {
      return true;
    }
  }

  return false;
}
```

### evaluateMyoReps

```js
evaluateMyoReps(exercise, state, clusterResults) {
  const cfg = exercise.myoConfig;

  const activation = clusterResults.activation;

  const activationComplete =
    activation.cleanReps >= cfg.activationReps &&
    !activation.anyTempoLoss &&
    !activation.tempoLossStop &&
    !activation.jointPainReported;

  const miniSetsComplete = clusterResults.miniSets.every(m =>
    m.cleanReps >= cfg.miniReps &&
    !m.anyTempoLoss &&
    !m.tempoLossStop &&
    !m.jointPainReported
  );

  const anyPain = clusterResults.jointPainReported;

  if (anyPain) {
    return { action: 'cancel_block', reason: 'joint_pain' };
  }

  if (activationComplete && miniSetsComplete) {
    return { action: 'increase_stage', reason: 'full_cluster_clean' };
  }

  if (activationComplete) {
    return { action: 'maintain', reason: 'partial_cluster' };
  }

  return { action: 'maintain', reason: 'activation_incomplete' };
}
```

==================================================
## 19. dayTracking — מבנה
==================================================

```js
{
  dayIndex: 15,
  completed: false,
  date: "21/08/2026",
  weekNumber: 3,
  microcyclePosition: 3,
  exerciseStatus: {
    "single-arm-floor-press": true,
    "trx-row": true
  },
  setData: {
    "single-arm-floor-press": [
      {
        setNumber: 1,
        result: "window",
        reps: 12,
        weight: 6,
        stage: null,
        restUsed: 90,
        mechanicalStop: false,
        updatedAt: "..."
      }
    ],
    "trx-row": [
      {
        setNumber: 1,
        result: "window",
        reps: 12,
        weight: null,
        stage: "Angle 2 (45°)",
        restUsed: 75,
        mechanicalStop: false,
        pairedSetWith: "single-arm-lateral-raise",
        updatedAt: "..."
      }
    ]
  },
  exerciseDecisions: {
    "single-arm-floor-press": {
      decisionId: "decision:uuid",
      action: "increase",
      reason: "all_window_max_or_max_minus_1_plus_prev_max",
      displayed: true,
      finalizedAt: "..."
    }
  },
  leanStructure: {
    activePairs: ["d3-row-lateral"],
    dissolvedPairs: [],
    activeCircuits: [],
    activeBlocks: [],
    activeToggles: {
      "rear-delt": "trx-ytw",
      "day1-posterior-quad": "single-leg-rdl"
    }
  },
  armBlock: {
    eligible: true,
    reason: "normal",
    sets: 2,
    scheme: "myo-reps",
    muscleAreas: ["lateral-shoulder", "triceps"]
  },
  myoClusters: {
    "single-arm-lateral-raise": {
      activation: {
        target: 12,
        cleanReps: 12,
        totalRepsAttempted: 12,
        anyTempoLoss: false,
        tempoLossStop: false,
        jointPainReported: false
      },
      miniSets: [
        {
          setNumber: 1,
          target: 5,
          cleanReps: 5,
          totalRepsAttempted: 5,
          anyTempoLoss: false,
          tempoLossStop: false
        },
        {
          setNumber: 2,
          target: 5,
          cleanReps: 5,
          totalRepsAttempted: 5,
          anyTempoLoss: false,
          tempoLossStop: false
        },
        {
          setNumber: 3,
          target: 5,
          cleanReps: 5,
          totalRepsAttempted: 5,
          anyTempoLoss: false,
          tempoLossStop: false
        }
      ],
      result: "full_clean"
    }
  },
  exerciseNotes: {},
  actualRPE: null,
  bodyWeight: null,
  elbowPain: false,
  shoulderPain: false,
  notes: "",
  lastUpdated: "..."
}
```

==================================================
## 20. UI במסך Today
==================================================

### תצוגה לכל תרגיל

חובה להציג:

- כותרת: שם התרגיל.
- Badge סוג: Weighted / Stage / Time / Myo-Reps.
- משקל נוכחי/שלב נוכחי.
- פרטי prescription: סטים, חלון חזרות/זמן, טמפו, מנוחה כולל טווח.
- כפתורי סט: BELOW / IN_WINDOW / ABOVE.
- הבהרה: "ABOVE = מעל המקסימום, IN_WINDOW = עד המקסימום (כולל)".
- החלטה בסיום הסטים:
  - "עלה ל-X"
  - "נשארים על X"
  - "יורדים ל-X"
  - "עברת לשלב הבא"
  - "עלייה מרוככת"
- תצוגת previous performance.
- Undo: כפתור "בטל החלטה אחרונה".
- Adaptive Rest Display: "מנוחה: X שניות (מבוסס על האימון הקודם)" + סיבה.

### תצוגת מבנה Lean

לתרגיל מזווג:

- Badge "A1" / "A2" + שם בן-הזוג.
- מיקוד עובר אוטומטית לתרגיל השני בזוג ללא הפעלת טיימר.
- הטיימר (restAfterPair) רץ רק לאחר דיווח תוצאה לתרגיל הסוגר.

למעגל:

- "מעגל Core — בצע ברצף, מנוחה 30 שניות בין סבבים".

לבלוק:

- "בלוק תאומים — Standing ואז Seated, מנוחה 45 שניות לאחר שניהם".

לרוטציה:

- "השבוע: TRX Y-T-W"
- "השבוע: Band Pull-Apart"

אם זוג התפרק:

- "הזוג פורק לסטים ישרים — [סיבה]".

### תצוגת רוטציית יום 1

בשבוע אי-זוגי:

```text
השבוע: Single-Leg RDL — מיקוד שרשרת אחורית
```

בשבוע זוגי, אם Pistol נעול:

```text
השבוע: Heels-Elevated Goblet Squat — מיקוד ארבע-ראשי
```

בשבוע זוגי, אם Pistol פתוח:

```text
השבוע: Pistol Squat — מיקוד ארבע-ראשי / כוח חד-צדדי
```

לתרגיל המושעה:

```text
לא פעיל השבוע — מצב ההתקדמות נשמר
```

### תצוגת תדירות שנייה

ליד TRX Row ביום 3:

```text
תדירות גב 2/2
```

ליד Push-Up Volume ביום 5:

```text
תדירות חזה 2/2
```

נפח שבועי מצטבר:

```text
חזה: 8 סטים שבועיים (3+3+2)
גב: 10 סטים שבועיים (3+3+2+2)
```

### תצוגת מיקרו-מחזור בייספס

שבוע כבד:

```text
שבוע כבד — Single-Arm Curl + Single-Arm Hammer Curl, progression פעיל
```

שבוע קל:

```text
שבוע קל — Single-Arm Hammer Curl בלבד, 2 סטים, ללא קידום
```

שבוע Deload:

```text
שבוע Deload — סט אחד Single-Arm Hammer Curl
```

### תצוגת Arm Block

אם פעיל:

```text
✅ Arm Block פעיל — Myo-Reps [תרגילים]
```

אם מבוטל:

```text
❌ Arm Block מבוטל — [סיבה]
```

אם Deload:

```text
⚠️ Arm Block — סט אקטיבציה יחיד
```

אם נחסם בגלל חשיפה שבועית:

```text
❌ Arm Block מבוטל — כבר בוצע Arm Block לאזור השרירי הזה השבוע
```

### תצוגת Myo-Reps

חובה להציג:

```text
עצירה: 2 חזרות רצופות עם אובדן טמפו.
חזרות עם אובדן טמפו אינן נספרות.
```

כפתורי דיווח:

```text
הושלם בטמפו תקין
עצירה — 2 חזרות עם אובדן טמפו
כאב מפרקים
```

### תרגילים נעולים

אייקון מנעול + הודעה:

```text
תרגיל זה ייפתח לאחר שתבצע [X חזרות] ב-[שם תרגיל דרישה] עם [Y ק״ג].
```

### הודעות Progression

```text
עלייה מרוככת: כל הסטים ≥ max−1, ובאימון הקודם הגעת למקסימום בכל הסטים. המשקל הבא: X ק״ג.
```

```text
נשארים על אותו משקל: תמהיל תוצאות. המשך לעבוד על טכניקה.
```

```text
לא מתקדמים: הסטים בחלון אך מתחת ל-max−1.
```

```text
שבוע קל: אין החלטות קידום. המשקל נשמר ויחזור בשבוע הבא.
```

```text
Myo-Reps: השלמת את הצביר המלא ללא אובדן טמפו — עוברים לשלב הבא.
```

```text
Myo-Reps: זוהה אובדן טמפו — הצביר לא clean, נשארים בשלב הנוכחי.
```

==================================================
## 21. סנכרון Google Drive וייצוא נתונים מקומי
==================================================

### א. ייצוא נתונים מקומי בקובץ JSON (Local Data Export)

המערכת מספקת אפשרות לייצוא מלא בלחיצה אחת של כל נתוני המשתמש לקובץ JSON חתום ומאומת (`fitup_backup_[DATE].json`):

- **תכולת קובץ הייצוא**:
  - `tracking` (כל היסטוריית האימונים, הסטים והביצועים)
  - `progressionState` (מצב המשקלים והשלבים הפעילים לכל תרגיל, מאומת ללא ערכי 0 kg)
  - `progressionHistory` (היסטוריית החלטות מנוע ה-Progression)
  - `settings` (הגדרות משתמש, שפה, העדפות)
  - `photos` & `nutrition` (תמונות, מעקב משקל גוף ויומן תזונה AI)
  - `adaptiveRestHistory`, `myoClusterHistory` & `armBlockExposure`
  - `schemaVersion` & `exportDate`
- **ייבוא (Import)**: ייבוא בלחיצה אחת עם בדיקת תקינות סכמה (Validation) ושחזור מלא של מצב התקדמות האימון ללא איבוד נתונים.

### ב. סנכרון Google Drive

Google Drive חייב לסנכרן:

- tracking
- progressionState
- progressionHistory
- settings
- photos
- nutrition
- adaptiveRestHistory
- armBlockStatus
- armBlockExposure
- leanSessionState
- myoClusterHistory
- schemaVersion
- exportDate

### מיזוג סנכרון

#### tracking

לפי dayIndex. בחר את הרשומה עם lastUpdated המאוחר יותר.

#### progressionState

לפי exerciseId. העדף updatedAt המאוחר יותר.

#### progressionHistory

מיזוג union לפי decisionId.

החלטה שסומנה undoneAt חייבת להישאר מבוטלת.

#### adaptiveRestHistory

מיזוג union לפי exerciseId + sessionKey.

#### armBlockStatus

מיזוג union לפי sessionKey.

#### armBlockExposure

מיזוג union לפי id.

אין לשכפל חשיפה קיימת עבור אותו weekNumber + exerciseId + muscleArea.

#### leanSessionState

מיזוג union לפי sessionKey.

#### myoClusterHistory

מיזוג union לפי sessionKey + exerciseId.

#### settings

לשמר תמיד מקומית credentials.

#### nutrition / photos

מיזוג לפי id, אין למחוק ללא פעולה מפורשת.

### טריגרים לסנכרון

- לאחר commitExerciseProgression
- Undo
- סיום יום
- שינוי משקל גוף/RPE
- תזונה
- תמונה
- שינוי מנוחה אדפטיבי
- שינוי microcycleSnapshot
- שינוי armBlockStatus
- שינוי armBlockExposure
- שינוי leanSessionState
- שמירת myoClusterHistory

debounce: 2-5 שניות.

==================================================
## 22. Migration מגרסה קיימת
==================================================

### באתחול

בדוק:

```js
settings.programSchemaVersion
```

אם קטן מ-15.6:

- בצע export אוטומטי ושמור backup.
- סמן plan ישן כ-legacy.
- נקה trainingPlan ו-exerciseGuide.
- טען את FitUp v15.6 Lean.
- צור progressionState לכל תרגיל.
- שדרג IndexedDB ל-DBVERSION = 9.

אל תמיר משקלים ישנים אוטומטית אלא אם יש התאמה מלאה.

הצג הודעת עדכון.

אין למחוק:

- nutritionTracking
- progressPhotos
- googleAccessToken
- theme
- language

### Migration לתרגילים ולמצבי Lean

#### TRX Row

התחל עם Angle 1. אין state קודם.

#### Push-Up Volume Day 5

העתק את השלב הנוכחי מ-push-up-progression.

#### DB Glute Bridge (תרגיל ישבן מרכזי רציף)

התרגיל `DB Glute Bridge` מבוצע ברציפות לאורך כל 80 השבועות ביום 1 (Legs + Core), ללא סרבול ציוד של ספסל/ספה וללא קיטועים. התקדמות המשקלים מבוצעת באופן רציף מ-6 ק"ג עד 32 ק"ג דרך 3 הכפתורים (`ABOVE`, `IN_WINDOW`, `BELOW`).

#### שדרוג תרגילים עפ"י עץ המיומנויות (Skill Tree Replacements)

בשבועות ה-Unlock המוגדרים בעץ המיומנויות (`js/exercises.js`), מחולל התכנית ומנוע ההתקדמות מחליפים באופן דינמי את התרגילים ביומן האימונים היומי:
- **שבוע 10:** `Push-up Bars Progression` ⬅️ `Deficit Push-Up`, `Pike Progression` ⬅️ `Wall Walk (Partial)`, `Pull-Up Progression` ⬅️ `Pull-Up (Overhand)`.
- **שבוע 18:** `Feet-Elevated Push-Up`, `Wall Walk (Full)`, `One-Leg Extended L-Sit`, `Single-Leg RDL`.
- **שבוע 26/34/41/62:** `Wall Handstand`, `Full L-Sit`, `Elevated Pike Push-Up`, `Weighted Deficit Push-Up`, `Weighted Pull-Up`.

#### Band Pull-Apart

התחל עם Band 30kg.

שמור state גם בשבועות שבהם אינו פעיל.

#### TRX Y-T-W

שמור state גם בשבועות שבהם אינו פעיל.

#### Single-Arm Hammer Curl

התחל עם משקל Single-Arm Curl − 1 ק״ג.

#### Pistol Squat

נעול. בדוק unlock criteria.

#### Single-Arm Curl

שמור microcycleSnapshot ראשון.

#### Arm Block

אתחל שלבי Myo-Reps לפי המשקל/שלב הנוכחי של כל תרגיל.

אתחל armBlockExposure כהיסטוריה ריקה או לפי נתוני ביצוע קיימים אם קיים מידע אמין.

#### Day1 Toggle

צור ומלא state עבור:

- single-leg-rdl
- heels-elevated-goblet-squat

כללים:

- Single-Leg RDL שומר state קיים.
- Heels-Elevated Goblet Squat שומר state קיים.
- אין לאפס progression בגלל מעבר ל-Toggle.

#### microcyclePosition

אתחל לפי weekNumber נוכחי.

#### leanSessionState

צור רשומה ריקה לכל session פעיל.

#### myoClusterHistory

צור store חדש אם לא קיים.

==================================================
## 23. התאמות למסכי Stats
==================================================

- גרף "Progression החלטות אחרונות".
- מספר עליות/שמירות/ירידות/עליות מרוככות.
- סטטוס Deload הבא.
- נוסחת התקדמות משוקללת: `(currentWeight - minWeight) / (maxWeight - minWeight)`.
- תרומת שריר מבוססת exerciseIds אמיתיים.
- גרף "מנוחות אדפטיביות".
- אחוז softened progression לעומת all_above progression.
- סטטוס unlock criteria.
- גרף מיקרו-מחזור בייספס.
- נפח בייספס שבועי.
- נפח חזה שבועי: הצגת 3+3+2 = 8 סטים.
- נפח גב שבועי: הצגת 3+3+2+2 = 10 סטים.
- סטטוס Arm Block: פעיל/מבוטל + סיבה + scheme (myo-reps).
- גרף זיווגים: כמה סטים בוצעו כזוג לעומת סטים ישרים; תדירות פירוק זוגות וסיבות.
- גרף רוטציית כתף אחורית: חלוקת נפח בין Y-T-W ל-Band Pull-Apart.
- גרף רוטציית יום 1: חלוקת נפח בין Single-Leg RDL לבין Heels-Elevated Goblet Squat.
- גרף Myo-Reps: אחוז צבירים clean, אחוז עצירות tempo loss, אחוז ביטולים בגלל כאב.
- גרף Arm Block Exposure: חשיפה שבועית לפי אזור שרירי.
- משך אימון ממוצע לכל יום.
- משך אימון ממוצע ליום 1 לאחר רוטציית Posterior/Quad.

==================================================
## 24. קבצים שיש לשנות
==================================================

```text
js/data.js
js/db.js
js/today.js
js/progression.js
js/stats.js
js/i18n.js
js/cloud-sync.js
index.html
CSS
```

==================================================
## 25. מפתחות i18n נדרשים
==================================================

```text
progressionTitle,
currentWeight,
currentStage,
setBelow,
setWindow,
setAbove,
setFailed,
setSucceeded,
setTooEasy,
windowDefinition,
decisionIncrease,
decisionMaintain,
decisionDecrease,
decisionSoftenedIncrease,
softenedProgressionExplanation,
decisionStageUp,
decisionStageMaintain,
decisionStageDown,
undoDecision,
undoSuccess,
deloadTitle,
deloadDescription,
deloadNormalWeight,
deloadNoProgression,
previousPerformance,
nextDeload,
progressionHistory,
technicalFailure,
adaptiveRest,
restExtended,
restShortened,
restReasonTechnical,
restReasonProgress,
openingRest,
intraWorkoutRest,
nextSessionRest,
hipThrust,
bandPullApart,
hammerCurl,
pistolSquatProgression,
exerciseLocked,
unlockCriteriaMessage,
microcycleHeavyWeek,
microcycleLightWeek,
microcycleDeloadWeek,
microcycleNoProgression,
microcycleWeightPreserved,
bicepsVolumeWarning,
elbowPainStop,
trxRow,
pushUpVolumeDay5,
chestFrequency2,
backFrequency2,
weeklyChestVolume,
weeklyBackVolume,
armBlockActive,
armBlockCancelled,
armBlockReasonMainBelow,
armBlockReasonConsecutiveDecline,
armBlockReasonJointPain,
armBlockDeloadSingleSet,
softenedCriteriaNotMet,
softenedNeedMaxOrMaxMinus1,
mechanicalStopDetected,
frequencyBadgeChest,
frequencyBadgeBack,

leanPairBadge,
leanPairA1,
leanPairA2,
leanPairWith,
leanPairRestAfter,
leanPairDissolved,
leanPairDissolveMemberInactive,
leanPairDissolveBelow,
leanPairDissolveDeload,
leanCircuitTitle,
leanCircuitRestBetweenRounds,
leanBlockTitle,
leanBlockRestAfter,
leanToggleWeekOdd,
leanToggleWeekEven,
leanProtectedExercise,
myoRepsTitle,
myoRepsActivation,
myoRepsMiniSets,
myoRepsComplete,
myoRepsPartial,
myoRepsStopRule,
armBlockMyoReps,
leanFocusNextInPair,
leanTimerAfterPair,

day1ToggleTitle,
day1TogglePosteriorWeek,
day1ToggleQuadWeek,
day1ToggleSingleLegRdlActive,
day1ToggleSingleLegRdlInactive,
day1ToggleLungePistolSlotActive,
day1ToggleLungePistolSlotInactive,
day1ToggleSlotLocked,
day1ToggleSlotUnlocked,
day1ToggleStateRetained,

myoStopRuleTwoTempoLosses,
myoTempoLossDefinition,
myoCleanRepsOnly,
myoTempoLossStopReport,
myoAnyTempoLossNoAdvance,
myoActivationIncompleteTempo,
myoMiniSetIncompleteTempo,
myoFullClusterClean,
myoPartialClusterMaintain,

armBlockWeeklyExposureLimit,
armBlockExposureRecorded,
armBlockReasonWeeklyExposureLimit,
armBlockMuscleAreaLateralShoulder,
armBlockMuscleAreaTriceps,
armBlockMuscleAreaBiceps
```

==================================================
## 26. בדיקות קבלה חובה
==================================================

| # | בדיקה | תוצאה צפויה |
| ---: | --- | --- |
| 1 | Weighted increase: 3 סטים ABOVE | state עובר ל-7 |
| 2 | Softened increase: 3 סטים IN_WINDOW (12,11,12 בחלון 6-12) + prev all 12 | state עובר ל-7 |
| 3 | Softened NOT met: 3 סטים IN_WINDOW (10,9,11) + prev all 12 | state נשאר 6 |
| 4 | Mixed maintain: תמהיל | משקל נשאר |
| 5 | All below: 3 סטים BELOW | ירידה ל-5 |
| 6 | Variation: כל הסטים ABOVE | stage up |
| 7 | Deload: משקל 12, שבוע 8 | תצוגה 10, 2 סטים. state נשאר 12 |
| 8 | Deload: כל הזיווגים/מעגלים/בלוקים מתפרקים; Toggles נשארים לפי parity | כל הזוגות/מעגלים/בלוקים סטים ישרים; Toggle פעיל לפי שבוע |
| 9 | Offline: שמירה מקומית וסנכרון | תקין |
| 10 | שני מכשירים: סנכרון | מדויק |
| 11 | Undo: ביטול החלטה | state חוזר + undoneAt |
| 12 | Migration: שמירת נתונים + שדרוג | תקין |
| 13 | RTL: תמיכה מלאה בעברית | תקין |
| 14 | בלוק תאומים: Standing 3 + Seated 2, מנוחה 45 לאחר הזוג | תקין |
| 15 | מעגל Core: Pallof+Dead Bug+Hollow ברצף, 30 בין סבבים | תקין |
| 16 | מעגל Core מבוצע בסוף האימון בלבד | תקין |
| 17 | זוג יום 3: TRX Row ↔ Lateral Raise, מנוחה 75 לאחר הזוג | תקין |
| 18 | זוג יום 5: Push-Up Volume ↔ Single-Arm Curl, מנוחה 75 לאחר הזוג | תקין |
| 19 | זוג יום 5 מתפרק בשבוע קל (3): Push-Up Volume סט ישר | תקין |
| 20 | BELOW בזוג: פירוק לשארית הסשן + מנוחה +30 | תקין |
| 21 | סט נוסף של Single-Arm Curl (3 לעומת 2) מבוצע ישר אחרי פירוק | תקין |
| 22 | זוג Towel Hang ↔ L-Sit, מנוחה 45 לאחר הזוג | תקין |
| 23 | רוטציה שבוע אי-זוגי: TRX Y-T-W פעיל | תקין |
| 24 | רוטציה שבוע זוגי: Band Pull-Apart פעיל | תקין |
| 25 | רוטציה: שני ה-states נשמרים, אין איפוס שלבים | תקין |
| 26 | Band Pull-Apart בחימום לא נספר כסט progression | תקין |
| 27 | Arm Block Myo-Reps: אקטיבציה + 3 מיני-סטים, 15 שניות ביניהם | תקין |
| 28 | Arm Block Myo-Reps: צביר מלא clean → עליית שלב | תקין |
| 29 | Arm Block Myo-Reps: צביר חלקי → שמירה | תקין |
| 30 | Arm Block Myo-Reps: כאב מרפק → ביטול | תקין |
| 31 | Arm Block Deload: סט אקטיבציה יחיד בלבד | תקין |
| 32 | תרגילים מוגנים לעולם לא מזווגים | תקין |
| 33 | Pistol Squat: נעול, נפתח אחרי BSS 3x12@12kg | תקין |
| 34 | מיקרו שבוע 1: Single-Arm Curl + Hammer, progression מותר | תקין |
| 35 | מיקרו שבוע 3: Hammer בלבד, 2 סטים, אין קידום | תקין |
| 36 | מיקרו + Deload: שבוע 8 = סט אחד Hammer | תקין |
| 37 | microcycleSnapshot: שמירה בסוף שבוע 2, חזרה בשבוע 1 | תקין |
| 38 | TRX Row ביום 3: 2 סטים, progression variation | תקין |
| 39 | Push-Up Volume ביום 5: חולק שלבים עם push-up-progression | תקין |
| 40 | נפח חזה שבועי: 3+3+2 = 8 סטים | תקין |
| 41 | נפח גב שבועי: 3+3+2+2 = 10 סטים | תקין |
| 42 | leanSessionState נשמר ומסונכרן | תקין |
| 43 | רוטציית יום 1 שבוע אי-זוגי: Single-Leg RDL פעיל, Lunge/Pistol Slot לא פעיל | תקין |
| 44 | רוטציית יום 1 שבוע זוגי: Lunge/Pistol Slot פעיל, Single-Leg RDL לא פעיל | תקין |
| 45 | Heels-Elevated Goblet Squat פעיל | תקין |
| 46 | Lunge/Pistol Slot כאשר Pistol פתוח: Pistol Squat פעיל | תקין |
| 47 | רוטציית יום 1: שני/כל ה-states נשמרים, אין איפוס | תקין |
| 48 | Opening Rest לתרגיל Toggle מחושב רק מהאימון הקודם של אותו תרגיל | תקין |
| 49 | Deload יום 1: רק התרגיל/Slot הפעיל לפי parity מבוצע, 2 סטים | תקין |
| 50 | תרגיל מושעה ב-Toggle לא מקבל החלטת progression | תקין |
| 51 | Myo-Reps: אובדן טמפו אחד בלבד, אך יעד הושלם → לא clean, maintain | תקין |
| 52 | Myo-Reps: שני אובדני טמפו רצופים → עצירה, tempoLossStop=true | תקין |
| 53 | Myo-Reps: חזרות עם אובדן טמפו לא נספרות כ-cleanReps | תקין |
| 54 | Myo-Reps: צביר מלא ללא אובדן טמפו → increase_stage | תקין |
| 55 | Myo-Reps: מיני-סט עם אובדן טמפו → maintain | תקין |
| 56 | Arm Block Exposure: יום 3 מבוצע ל-Lateral Raise ו-Triceps Extension → נרשמת חשיפה לכל אזור | תקין |
| 57 | Arm Block Exposure: יום 5 בייספס מותר לאחר יום 3 כי אזור שרירי שונה | תקין |
| 58 | Arm Block Exposure: ניסיון Arm Block נוסף לאותו אזור בייספס באותו שבוע נחסם | תקין |
| 59 | Arm Block Exposure: ניסיון Arm Block נוסף לכתף/תלת־ראשי באותו שבוע נחסם | תקין |
| 60 | Arm Block Exposure: ביטול לפני ביצוע לא נספר כחשיפה | תקין |
| 61 | Arm Block Exposure: Deload single activation נספר כחשיפה אם בוצע | תקין |
| 62 | myoClusterHistory ו-armBlockExposure נשמרים ומסונכרנים | תקין |

==================================================
## 27. הגדרה סופית
==================================================

| רכיב | מקור אמת |
| --- | --- |
| תוכנית | window.TRAININGDATA ב-js/data.js, גרסה 15.6 |
| ביצועי משתמש | IndexedDB |
| גיבוי | Google Drive |

### מדיניות

- Zero Decisions
- Deload אוטומטי
- מנוחות אדפטיביות (3 מנגנונים)
- Softened progression (דורש max או max−1 בסשן הנוכחי)
- Unlock criteria
- מיקרו-מחזור בייספס (2 כבד + 1 קל)
- Arm Block מותנה בהתאוששות, בפרוטוקול Myo-Reps חסוי
- חוק עצירה אובייקטיבי ב-Myo-Reps: two_consecutive_tempo_losses
- חזרות עם אובדן טמפו אינן נספרות כ-clean reps
- Arm Block מוגבל לחשיפה אחת בשבוע לכל אזור שרירי
- תדירות שנייה חזה וגב (2 סטים נוספים לכל אחד)
- מצב Lean: הגנה על תרגילי בסיס + זיווגים/מעגלים/בלוקים/רוטציה
- רוטציית כתף אחורית ביום 3
- רוטציית שרשרת אחורית/ארבע-ראשי ביום 1
- Lunge/Pistol Slot נפתר אוטומטית לפי Pistol unlock
- פירוק זוגות אוטומטי ב-Deload, בשבוע קל, או לאחר BELOW
- Toggles נשמרים גם ב-Deload ואינם מאפסים progression
- אין קידום כפול
- Audit trail מלא
- עבודה offline

---

FitUp v15.6 Lean — Adaptive 3-Day Strength + Lean Pairing + Frequency Optimization + Day1 Toggle + Objective Myo Stop + Arm Block Exposure Limit

תאריך: 21/08/2026

גרסת מסמך: סופית