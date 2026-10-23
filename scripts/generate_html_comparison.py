import json, re, os

# Load generator data
with open('generate_program.py') as f:
    gen_text = f.read()

# Load exercises from generator
exercises_raw = []
# Match exercise dicts
# Look for { "id": "...", ... }
block_matches = re.findall(r'\{\s*"id":\s*"([^"]+)",\s*"name":\s*"([^"]+)",(.*?)\n    \}', gen_text, re.DOTALL)

ex_dict = {}
for ex_id, name, rest in block_matches:
    category_match = re.search(r'"category":\s*"([^"]+)"', rest)
    type_match = re.search(r'"type":\s*"([^"]+)"', rest)
    week_match = re.search(r'"startingWeek":\s*(\d+)', rest)
    sets_match = re.search(r'"sets":\s*(\d+)', rest)
    rep_match = re.search(r'"repWindow":\s*"([^"]+)"', rest)
    tempo_match = re.search(r'"tempo":\s*"([^"]+)"', rest)
    rule_match = re.search(r'"rule":\s*"([^"]+)"', rest)
    stages_match = re.search(r'"stages":\s*\[(.*?)\]', rest, re.DOTALL)
    
    stages = []
    if stages_match:
        stages = [s.strip().strip('"\'') for s in stages_match.group(1).split(',') if s.strip()]

    ex_dict[ex_id] = {
        'id': ex_id,
        'name': name,
        'category': category_match.group(1) if category_match else 'General',
        'type': type_match.group(1) if type_match else 'bodyweight',
        'startingWeek': int(week_match.group(1)) if week_match else 1,
        'sets': sets_match.group(1) if sets_match else '2-3',
        'repWindow': rep_match.group(1) if rep_match else '8-12',
        'tempo': tempo_match.group(1) if tempo_match else 'Standard',
        'rule': rule_match.group(1) if rule_match else '',
        'stages': stages
    }

print(f"Loaded {len(ex_dict)} exercises from generator.")

# Detailed data for the audited / updated exercises (Before vs After)
audited_exercises = [
    {
        "id": "nordic-eccentric",
        "nameEn": "Nordic Curl (Eccentric Only)",
        "nameHe": "כפיפת ברכיים נורדית — שלב אקצנטרי בלבד",
        "category": "Legs & Posterior Chain",
        "day": "יום 1 (רגליים וליבה)",
        "dayNum": 1,
        "unlockTiming": "שבוע 34+ (משבוע 34 ואילך)",
        "unlockPrereq": "לאחר השלמת שבועות 18–33 ב-Full ROM ושבועות 10–17 ב-Partial ROM",
        "setsReps": "2 סטים × 4–6 חזרות (1 סט בדילואוד)",
        "tempo": "ירידה איטית של 3–4 שניות, ללא עלייה בכוח המסטרינגס",
        "rest": "90 שניות",
        "beforeImg": "images/comparison_before/NORDIC CURL (ECCENTRIC ONLY).png",
        "beforeGif": "images/comparison_before/Nordic Curl (Eccentric Only).gif",
        "afterImg": "images/exercises/NORDIC CURL (ECCENTRIC ONLY).png",
        "afterGif": "images/gifs/Nordic Curl (Eccentric Only).gif",
        "beforeFlaw": "בתמונה הסטטית הגוף צף באוויר ללא ברכיים על המזרן. ב-GIF המתאמן הניח ידיים על הרצפה ודחף במקום לבצע שלב אקצנטרי טהור.",
        "afterFix": "הברכיים מעוגנות בכרית ייעודית, הקרסוליים מקובעים ברולר. הידיים מוחזקות מאחור/על האגן, והמתאמן בולם ירידה מלאה בקו ישר 3–4 שניות ללא מגע ידיים כלל ברצפה.",
        "biomechanicalCues": "קו ישר מהברך דרך האגן ועד הכתפיים (ללא שבירה במפרק הירך). בלימה איטית כנגד כוח המשיכה. שמירה מחמירה על שרשרת אחורית ללא עומס מותני."
    },
    {
        "id": "nordic-full",
        "nameEn": "Full Nordic Curl (Unassisted)",
        "nameHe": "כפיפת ברכיים נורדית מלאה (ללא סיוע)",
        "category": "Legs & Posterior Chain",
        "day": "יום 1 (רגליים וליבה)",
        "dayNum": 1,
        "unlockTiming": "שלב מיומנות שיא (Elite Hamstring Strength)",
        "unlockPrereq": "שליטה מלאה בבלימה אקצנטרית של 4 שניות",
        "setsReps": "2 סטים × 3–6 חזרות",
        "tempo": "3 שניות ירידה, 0-1 שניות עצירה, 1-2 שניות עלייה בכוח בלבד",
        "rest": "120 שניות",
        "beforeImg": "images/comparison_before/FULL NORDIC CURL.png",
        "beforeGif": "images/comparison_before/Full Nordic Curl.gif",
        "afterImg": "images/exercises/FULL NORDIC CURL.png",
        "afterGif": "images/gifs/Full Nordic Curl.gif",
        "beforeFlaw": "הסרטון הקודם הציג מתאמן שמניח ידיים על הרצפה ודוחף חזרה, כלומר היה מדובר בתרגיל Hands-Assisted ולא ב-Full Nordic אמיתי.",
        "afterFix": "ביצוע מלא ואותנטי ללא שום סיוע: ידיים שלובות מאחורי הגב, ירידה מבוקרת עד קו אופקי מלא ועלייה חזרה מעלה אך ורק באמצעות כיווץ ההמסטרינגס — אפס מגע ברצפה.",
        "biomechanicalCues": "גיוס מקסימלי של Biceps Femoris ו-Semitendinosus. פשיטת ירך יציבה לאורך כל התנועה."
    },
    {
        "id": "nordic-partial",
        "nameEn": "Hands-Assisted Nordic (Partial ROM)",
        "nameHe": "נורדיק בסיוע ידיים — טווח תנועה חלקי (30°–45°)",
        "category": "Legs & Posterior Chain",
        "day": "יום 1 (רגליים וליבה)",
        "dayNum": 1,
        "unlockTiming": "שבועות 10–17 (תחילת פרוגרשן נורדיק בתוכנית)",
        "unlockPrereq": "שער שבוע 10 (לא מופיע לפני שבוע 10)",
        "setsReps": "2 סטים × 4–6 חזרות (1 סט בדילואוד)",
        "tempo": "3-1-1 (3 שניות ירידה, 1 שניה עצירה, 1 שניה חזרה בסיוע)",
        "rest": "90 שניות",
        "beforeImg": "images/comparison_before/HANDS-ASSISTED NORDIC (PARTIAL ROM).png",
        "beforeGif": "images/comparison_before/Hands-Assisted Nordic (Partial ROM).gif",
        "afterImg": "images/exercises/HANDS-ASSISTED NORDIC (PARTIAL ROM).png",
        "afterGif": "images/gifs/Hands-Assisted Nordic (Partial ROM).gif",
        "beforeFlaw": "התמונה הייתה זהה לקובץ הראשי ולא הדגישה את הזווית המוגבלת. ה-GIF הכיל סימני מים וכיתובי יוטיוב זרים.",
        "afterFix": "הסרת כל סימני המים והכיתובים, חיתוך מדויק לפריימים 0–35 שמציגים ירידה מתונה של 35 מעלות ובלימה רכה בידיים, וחזרה בלולאה חלקה.",
        "biomechanicalCues": "הגנה מוחלטת על גיד ההמסטרינגס ובניית כוח גידים הדרגתי לפני מעבר לטווח מלא."
    },
    {
        "id": "nordic-fullrom-assist",
        "nameEn": "Hands-Assisted Nordic (Full ROM)",
        "nameHe": "נורדיק בסיוע ידיים — טווח תנועה מלא עם דחיפת ידיים",
        "category": "Legs & Posterior Chain",
        "day": "יום 1 (רגליים וליבה)",
        "dayNum": 1,
        "unlockTiming": "שבועות 18–33",
        "unlockPrereq": "השלמת שבועות 10–17 ב-Partial ROM",
        "setsReps": "2 סטים × 4–6 חזרות",
        "tempo": "3-1-1",
        "rest": "90 שניות",
        "beforeImg": "images/comparison_before/HANDS-ASSISTED NORDIC (FULL ROM).png",
        "beforeGif": "images/comparison_before/Hands-Assisted Nordic (Full ROM).gif",
        "afterImg": "images/exercises/HANDS-ASSISTED NORDIC (FULL ROM).png",
        "afterGif": "images/gifs/Hands-Assisted Nordic (Full ROM).gif",
        "beforeFlaw": "הכיל סימן מים מסחרי וכיתוב תחתון שלא התאימו לאפליקציה מקצועית.",
        "afterFix": "נקי מסימני מים, מציג ירידה מלאה עד לרצפה עם דחיפה מבוקרת של הידיים לעלייה.",
        "biomechanicalCues": "שליטה אקסצנטרית עמוקה תוך סיוע מינימלי של הידיים רק בשלב הקונצנטרי."
    },
    {
        "id": "foot-supported-lsit",
        "nameEn": "Foot-Supported L-Sit",
        "nameHe": "אל-סיט עם תמיכת עקבים קלה (להגנת דיסק L4-S1)",
        "category": "Core & Compression",
        "day": "יום 5 (משיכה, גב ובייספס)",
        "dayNum": 5,
        "unlockTiming": "שבועות 5–8 (יום 5, זוג 2 עם Towel Hang)",
        "unlockPrereq": "שבוע 5 (סיום Phase 0). בשבוע 9 משתדרג ל-Tuck L-Sit מלא באוויר",
        "setsReps": "2 סטים × 10–15 שניות החזקה סטטית",
        "tempo": "החזקה איזומטרית סטטית רציפה",
        "rest": "45 שניות בתוך הזוג, 90 שניות בין סטים",
        "beforeImg": "images/comparison_before/FOOT-SUPPORTED L-SIT.png",
        "beforeGif": "images/comparison_before/Foot-Supported L-Sit.gif",
        "afterImg": "images/exercises/FOOT-SUPPORTED L-SIT.png",
        "afterGif": "images/gifs/Foot-Supported L-Sit.gif",
        "beforeFlaw": "בסרטון הקודם לא היו מקבילים (המתאמן ישב על הרצפה או על כיסא רגיל).",
        "afterFix": "הדגמה מקצועית ומדויקת על מקבילי עץ (Parallettes): זרועות נעולות ישרות, שכמות דחוסות חזק מטה (Scapular Depression), אגן וירכיים מורמים באוויר, ועקבים נשענים קלות על המזרן.",
        "biomechanicalCues": "תמיכת העקבים מפחיתה ב-60% את מנוף ה-Iliopsoas על הגב התחתון, שומרת על מרווח L4-S1 ומלמדת דחיסת שכמות נכונה."
    },
    {
        "id": "weighted-chin-up",
        "nameEn": "Weighted Chin-Up (Vest 5kg)",
        "nameHe": "מתח בסופינציה עם ווסט משקל 5 ק\"ג",
        "category": "Upper Body Pull",
        "day": "יום 3 או יום 5",
        "dayNum": 3,
        "unlockTiming": "שבוע 66+ (משבוע 66 ואילך בתוכנית)",
        "unlockPrereq": "השלמת מתח חופשי במשקל גוף בנפח עבודה גבוה",
        "setsReps": "3 סטים × 4–8 חזרות",
        "tempo": "2 שניות ירידה מבוקרת (2s descent)",
        "rest": "90 שניות",
        "beforeImg": "images/comparison_before/WEIGHTED CHIN-UP.png",
        "beforeGif": "images/comparison_before/Weighted Chin-Up.gif",
        "afterImg": "images/exercises/WEIGHTED CHIN-UP.png",
        "afterGif": "images/gifs/Weighted Chin-Up.gif",
        "beforeFlaw": "בסרטון הקודם לא נראה שום ווסט או משקל, והמתאמן ביצע מתח משקל גוף רגיל.",
        "afterFix": "צילום סטודיו באיכות גבוהה על רקע לבן נקי: המתאמן לובש ווסט משקל ייעודי עם רצועות אבטחה, מבצע אחיזת סופינציה מושלמת (כפות ידיים פונות פנימה), עולה עד שסנטרו עובר את המוט ויורד לנעילה מבוקרת.",
        "biomechanicalCues": "אחיזת סופינציה מעמיסה באופן אופטימלי את שריר ה-Biceps Brachii במקביל ל-Latissimus Dorsi. שמירה על גוף יציב ללא נדנוד."
    },
    {
        "id": "trx-row-feet-elevated",
        "nameEn": "TRX Row (Feet-Elevated)",
        "nameHe": "חתירת TRX עם רגליים מוגבהות (מנח אופקי מלא)",
        "category": "Upper Body Pull & Horizontal Row",
        "day": "יום 3 (דחיקה ופלג גוף עליון)",
        "dayNum": 3,
        "unlockTiming": "שבוע 60+ (שלב השיא של חתירות TRX)",
        "unlockPrereq": "השלמת שבועות 1–17 (Angle 1), שבועות 18–41 (Angle 2), שבועות 42–59 (Angle 3)",
        "setsReps": "3 סטים × 8–12 חזרות",
        "tempo": "2 שניות ירידה, 1 שניה עצירה בחזה",
        "rest": "75 שניות",
        "beforeImg": "images/comparison_before/TRX ROW (FEET-ELEVATED).png",
        "beforeGif": "images/comparison_before/TRX Row (Feet-Elevated).gif",
        "afterImg": "images/exercises/TRX ROW (FEET-ELEVATED).png",
        "afterGif": "images/gifs/TRX Row (Feet-Elevated).gif",
        "beforeFlaw": "בסרטון הקודם רגלי המתאמן היו על הרצפה צמודות לקיר בשיפוע אלכסוני (לא מוגבהות).",
        "afterFix": "צילום חדר כושר מודרני באיכות גבוהה: רגלי המתאמן מוגבהות על מדרגה/קופסה, הגוף אופקי לחלוטין (180 מעלות ביחס לקרקע), והחזה נמשך במלואו אל ידיות ה-TRX כנגד כמעט 100% ממשקל הגוף.",
        "biomechanicalCues": "קירוב שכמות מקסימלי (Scapular Retraction & Depression), גוף ישר כקרש ללא שקיעת אגן."
    },
    {
        "id": "single-arm-pallof",
        "nameEn": "Single-Arm Pallof Press Variations",
        "nameHe": "לחיצות פאלוף ביד אחת (Square, Split Stance, One-Leg)",
        "category": "Core & Anti-Rotation",
        "day": "יום 1 ויום 5",
        "dayNum": 1,
        "unlockTiming": "שבועות 6+ בסבב הליבה",
        "unlockPrereq": "פתיחת שבוע 6 לאחר Dead Bug שלב 2",
        "setsReps": "2 סטים × 10–12 חזרות לכל צד",
        "tempo": "1 שניה עצירה מלאה בקצה הלחיצה",
        "rest": "30 שניות",
        "beforeImg": "images/comparison_before/SINGLE-ARM PALLOF PRESS.png",
        "beforeGif": "images/comparison_before/Single-Arm Pallof Press.gif",
        "afterImg": "images/exercises/SINGLE-ARM PALLOF PRESS.png",
        "afterGif": "images/gifs/Single-Arm Pallof Press.gif",
        "beforeFlaw": "במאגרים הגנריים קיימת רק לחיצה דו-ידנית בסיסית.",
        "afterFix": "סרטוני הדגמה אמיתיים בחדר כושר המציגים לחיצה ביד אחת עם כבל/גומייה, בלימת פיתול גו, ועמידות מתקדמות (פסיעה ורגל אחת).",
        "biomechanicalCues": "אפס תנועה וסיבוב בעמוד השדרה; שמירה על קו ישר של הזרוע כנגד מומנט הפיתול."
    }
]

# Generate the complete interactive HTML file
html_template = """<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>FitUp Pro — קטלוג תרגילים והשוואת תיקונים ביומכניים</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&family=Rubik:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: #090d16;
      --card-bg: rgba(18, 26, 43, 0.85);
      --card-border: rgba(255, 255, 255, 0.08);
      --text: #f1f5f9;
      --text-muted: #94a3b8;
      --text-dim: #64748b;
      --primary: #38bdf8;
      --accent-green: #10b981;
      --accent-green-glow: rgba(16, 185, 129, 0.25);
      --accent-rose: #f43f5e;
      --accent-rose-glow: rgba(244, 63, 94, 0.25);
      --accent-amber: #f59e0b;
      --accent-indigo: #6366f1;
      --header-bg: rgba(9, 13, 22, 0.92);
      --radius: 16px;
      --radius-sm: 10px;
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: 'Rubik', sans-serif;
      background: var(--bg);
      background-image: 
        radial-gradient(circle at 15% 15%, rgba(56, 189, 248, 0.08) 0%, transparent 40%),
        radial-gradient(circle at 85% 85%, rgba(99, 102, 241, 0.08) 0%, transparent 40%);
      background-attachment: fixed;
      color: var(--text);
      min-height: 100vh;
      line-height: 1.6;
      padding-bottom: 80px;
    }

    /* Top Sticky Header */
    header {
      position: sticky;
      top: 0;
      z-index: 100;
      backdrop-filter: blur(20px);
      background: var(--header-bg);
      border-bottom: 1px solid var(--card-border);
      padding: 18px 24px;
    }

    .header-inner {
      max-width: 1400px;
      margin: 0 auto;
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
    }

    .brand {
      display: flex;
      align-items: center;
      gap: 14px;
    }

    .logo-badge {
      background: linear-gradient(135deg, #0284c7, #38bdf8);
      color: #fff;
      font-family: 'Outfit', sans-serif;
      font-weight: 800;
      font-size: 1.2rem;
      padding: 6px 14px;
      border-radius: var(--radius-sm);
      letter-spacing: 0.5px;
      box-shadow: 0 4px 15px rgba(2, 132, 199, 0.35);
    }

    .title-group h1 {
      font-size: 1.35rem;
      font-weight: 700;
      color: #fff;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .title-group p {
      font-size: 0.85rem;
      color: var(--text-muted);
    }

    /* Filter & Control Bar */
    .controls-bar {
      max-width: 1400px;
      margin: 24px auto;
      padding: 0 24px;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .top-controls {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 14px;
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      padding: 14px 20px;
      border-radius: var(--radius);
      backdrop-filter: blur(10px);
    }

    .search-box {
      flex: 1;
      min-width: 260px;
      position: relative;
    }

    .search-input {
      width: 100%;
      background: rgba(11, 17, 30, 0.7);
      border: 1px solid var(--card-border);
      border-radius: var(--radius-sm);
      padding: 10px 16px 10px 38px;
      color: #fff;
      font-family: 'Rubik', sans-serif;
      font-size: 0.95rem;
      outline: none;
      transition: all 0.2s;
    }

    .search-input:focus {
      border-color: var(--primary);
      box-shadow: 0 0 0 3px rgba(56, 189, 248, 0.15);
    }

    .toggle-group {
      display: flex;
      align-items: center;
      background: rgba(11, 17, 30, 0.8);
      border: 1px solid var(--card-border);
      border-radius: var(--radius-sm);
      padding: 4px;
      gap: 4px;
    }

    .toggle-btn {
      background: transparent;
      border: none;
      color: var(--text-muted);
      padding: 6px 14px;
      border-radius: 6px;
      font-size: 0.85rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
    }

    .toggle-btn.active {
      background: var(--primary);
      color: #041226;
      font-weight: 600;
    }

    /* Tabs */
    .tabs-nav {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
    }

    .tab-btn {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      color: var(--text-muted);
      padding: 10px 18px;
      border-radius: var(--radius-sm);
      font-size: 0.9rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .tab-btn:hover {
      color: #fff;
      border-color: rgba(255, 255, 255, 0.18);
    }

    .tab-btn.active {
      background: linear-gradient(135deg, rgba(56, 189, 248, 0.15), rgba(99, 102, 241, 0.15));
      border-color: var(--primary);
      color: #fff;
      font-weight: 600;
    }

    .tab-count {
      background: rgba(255, 255, 255, 0.1);
      padding: 2px 7px;
      border-radius: 12px;
      font-size: 0.75rem;
    }

    /* Main Container */
    main {
      max-width: 1400px;
      margin: 0 auto;
      padding: 0 24px;
    }

    /* Comparison Card Grid */
    .comparison-grid {
      display: flex;
      flex-direction: column;
      gap: 28px;
    }

    .card {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: var(--radius);
      padding: 24px;
      backdrop-filter: blur(14px);
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.35);
      transition: border-color 0.2s, transform 0.2s;
    }

    .card:hover {
      border-color: rgba(56, 189, 248, 0.3);
    }

    .card-header {
      display: flex;
      flex-wrap: wrap;
      align-items: flex-start;
      justify-content: space-between;
      gap: 12px;
      margin-bottom: 20px;
      border-bottom: 1px solid var(--card-border);
      padding-bottom: 16px;
    }

    .card-title-group h2 {
      font-size: 1.35rem;
      font-weight: 700;
      color: #fff;
      margin-bottom: 4px;
    }

    .card-title-group .name-en {
      font-family: 'Outfit', sans-serif;
      font-size: 0.95rem;
      color: var(--primary);
      font-weight: 600;
      letter-spacing: 0.3px;
    }

    .badge-group {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    .badge {
      font-size: 0.8rem;
      padding: 5px 12px;
      border-radius: 8px;
      font-weight: 500;
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }

    .badge-day {
      background: rgba(99, 102, 241, 0.15);
      color: #a5b4fc;
      border: 1px solid rgba(99, 102, 241, 0.3);
    }

    .badge-week {
      background: rgba(245, 158, 11, 0.15);
      color: #fcd34d;
      border: 1px solid rgba(245, 158, 11, 0.3);
    }

    .badge-status-ok {
      background: rgba(16, 185, 129, 0.15);
      color: #6ee7b7;
      border: 1px solid rgba(16, 185, 129, 0.3);
    }

    /* Side-by-side Visual Comparison */
    .visual-comparison {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-bottom: 22px;
    }

    @media (max-width: 900px) {
      .visual-comparison {
        grid-template-columns: 1fr;
      }
    }

    .comparison-col {
      background: rgba(11, 17, 30, 0.6);
      border-radius: var(--radius-sm);
      border: 1px solid var(--card-border);
      padding: 16px;
      display: flex;
      flex-direction: column;
    }

    .col-before {
      border-top: 4px solid var(--accent-rose);
    }

    .col-after {
      border-top: 4px solid var(--accent-green);
    }

    .col-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 12px;
    }

    .col-title {
      font-size: 1rem;
      font-weight: 700;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .col-before .col-title { color: #fca5a5; }
    .col-after .col-title { color: #86efac; }

    .media-container {
      position: relative;
      background: #000;
      border-radius: var(--radius-sm);
      overflow: hidden;
      aspect-ratio: 4 / 3;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 14px;
      border: 1px solid rgba(255, 255, 255, 0.05);
      cursor: zoom-in;
    }

    .media-container img {
      max-width: 100%;
      max-height: 100%;
      object-fit: contain;
      display: block;
      transition: transform 0.2s;
    }

    .media-container:hover img {
      transform: scale(1.02);
    }

    .media-tag {
      position: absolute;
      bottom: 8px;
      right: 8px;
      background: rgba(0, 0, 0, 0.7);
      color: #fff;
      font-size: 0.7rem;
      padding: 2px 8px;
      border-radius: 4px;
      backdrop-filter: blur(4px);
    }

    .col-desc {
      font-size: 0.88rem;
      color: var(--text-muted);
      line-height: 1.5;
      background: rgba(255, 255, 255, 0.02);
      padding: 10px 12px;
      border-radius: 8px;
      flex: 1;
    }

    /* Biomechanical Specs Grid */
    .specs-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 12px;
      background: rgba(11, 17, 30, 0.4);
      border-radius: var(--radius-sm);
      padding: 16px;
      margin-bottom: 16px;
    }

    .spec-item {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .spec-label {
      font-size: 0.75rem;
      color: var(--text-dim);
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .spec-value {
      font-size: 0.92rem;
      font-weight: 600;
      color: var(--text);
    }

    .cues-box {
      background: rgba(56, 189, 248, 0.05);
      border: 1px solid rgba(56, 189, 248, 0.2);
      border-radius: var(--radius-sm);
      padding: 12px 16px;
      font-size: 0.88rem;
      color: #bae6fd;
      display: flex;
      align-items: flex-start;
      gap: 10px;
    }

    .cues-icon {
      font-size: 1.1rem;
      line-height: 1;
      flex-shrink: 0;
      margin-top: 2px;
    }

    /* Lightbox Modal */
    .lightbox {
      display: none;
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.92);
      z-index: 1000;
      align-items: center;
      justify-content: center;
      padding: 30px;
      backdrop-filter: blur(8px);
    }

    .lightbox.active {
      display: flex;
    }

    .lightbox img {
      max-width: 90vw;
      max-height: 85vh;
      border-radius: var(--radius-sm);
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.8);
      object-fit: contain;
    }

    .lightbox-close {
      position: absolute;
      top: 20px;
      right: 25px;
      color: #fff;
      font-size: 2rem;
      background: none;
      border: none;
      cursor: pointer;
      line-height: 1;
    }
  </style>
</head>
<body>

  <header>
    <div class="header-inner">
      <div class="brand">
        <div class="logo-badge">FITUP PRO</div>
        <div class="title-group">
          <h1>דוח השוואת תרגילים ולוח זמני פתיחה (Biomechanical Perfection Audit)</h1>
          <p>השוואה חזותית מלאה: לפני (מה שהיה שגוי) מול אחרי (התיקון המדויק), מועדי פתיחה והנחיות ביומכניות</p>
        </div>
      </div>
      <div class="toggle-group">
        <button class="toggle-btn active" id="btn-show-gifs" onclick="setMediaType('gif')">הצג אנימציות GIF</button>
        <button class="toggle-btn" id="btn-show-static" onclick="setMediaType('static')">הצג תמונות סטטיות</button>
      </div>
    </div>
  </header>

  <div class="controls-bar">
    <div class="top-controls">
      <div class="search-box">
        <input type="text" class="search-input" id="search-input" placeholder="חיפוש לפי שם תרגיל, שבוע, יום או מילת מפתח..." oninput="handleSearch()">
      </div>
      <div class="tabs-nav">
        <button class="tab-btn active" onclick="filterTab('all', this)">
          הכל <span class="tab-count" id="count-all">8</span>
        </button>
        <button class="tab-btn" onclick="filterTab('day1', this)">
          יום 1 (רגליים וליבה) <span class="tab-count">4</span>
        </button>
        <button class="tab-btn" onclick="filterTab('day3', this)">
          יום 3 (דחיקה ועליון) <span class="tab-count">2</span>
        </button>
        <button class="tab-btn" onclick="filterTab('day5', this)">
          יום 5 (משיכה וידיים) <span class="tab-count">2</span>
        </button>
      </div>
    </div>
  </div>

  <main>
    <div class="comparison-grid" id="exercises-container">
      <!-- Dynamic Exercise Cards injected via JS -->
    </div>
  </main>

  <div class="lightbox" id="lightbox" onclick="closeLightbox()">
    <button class="lightbox-close">&times;</button>
    <img id="lightbox-img" src="" alt="Full view" onclick="event.stopPropagation()">
  </div>

  <script>
    const EXERCISES = """ + json.dumps(audited_exercises, ensure_ascii=False, indent=2) + """;
    let currentMediaType = 'gif';
    let currentFilter = 'all';

    function setMediaType(type) {
      currentMediaType = type;
      document.getElementById('btn-show-gifs').classList.toggle('active', type === 'gif');
      document.getElementById('btn-show-static').classList.toggle('active', type === 'static');
      renderCards();
    }

    function filterTab(filter, btn) {
      currentFilter = filter;
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderCards();
    }

    function handleSearch() {
      renderCards();
    }

    function openLightbox(src) {
      const lb = document.getElementById('lightbox');
      const img = document.getElementById('lightbox-img');
      img.src = src;
      lb.classList.add('active');
    }

    function closeLightbox() {
      document.getElementById('lightbox').classList.remove('active');
    }

    function renderCards() {
      const container = document.getElementById('exercises-container');
      const query = document.getElementById('search-input').value.toLowerCase().trim();

      const filtered = EXERCISES.filter(ex => {
        // Tab filter
        if (currentFilter === 'day1' && ex.dayNum !== 1) return false;
        if (currentFilter === 'day3' && ex.dayNum !== 3) return false;
        if (currentFilter === 'day5' && ex.dayNum !== 5) return false;

        // Search query
        if (query) {
          const hay = (ex.nameEn + ' ' + ex.nameHe + ' ' + ex.unlockTiming + ' ' + ex.category + ' ' + ex.day).toLowerCase();
          if (!hay.includes(query)) return false;
        }
        return true;
      });

      container.innerHTML = filtered.map(ex => {
        const beforeSrc = currentMediaType === 'gif' ? ex.beforeGif : ex.beforeImg;
        const afterSrc = currentMediaType === 'gif' ? ex.afterGif : ex.afterImg;

        return `
          <div class="card" data-id="${ex.id}">
            <div class="card-header">
              <div class="card-title-group">
                <h2>${ex.nameHe}</h2>
                <div class="name-en">${ex.nameEn}</div>
              </div>
              <div class="badge-group">
                <span class="badge badge-day">📅 ${ex.day}</span>
                <span class="badge badge-week">🔓 פתיחה: ${ex.unlockTiming}</span>
                <span class="badge badge-status-ok">✔ תוקן ואומת ביומכנית</span>
              </div>
            </div>

            <div class="visual-comparison">
              <!-- Before Column -->
              <div class="comparison-col col-before">
                <div class="col-header">
                  <div class="col-title">❌ מה שהיה מקודם (שגוי / לא מתאים)</div>
                  <span class="badge" style="background: rgba(244,63,94,0.15); color: #fca5a5;">לפני</span>
                </div>
                <div class="media-container" onclick="openLightbox('${beforeSrc}')">
                  <img src="${beforeSrc}" alt="${ex.nameEn} Before" loading="lazy" onerror="this.src='${ex.beforeImg}'">
                  <span class="media-tag">${currentMediaType === 'gif' ? 'GIF מונפש' : 'סטטי'} (הקודם)</span>
                </div>
                <div class="col-desc">
                  <strong>הליקוי הקודם:</strong> ${ex.beforeFlaw}
                </div>
              </div>

              <!-- After Column -->
              <div class="comparison-col col-after">
                <div class="col-header">
                  <div class="col-title">✅ התיקון המדויק (100% פיזיקלי ותקני)</div>
                  <span class="badge" style="background: rgba(16,185,129,0.15); color: #6ee7b7;">עכשיו באפליקציה</span>
                </div>
                <div class="media-container" onclick="openLightbox('${afterSrc}')">
                  <img src="${afterSrc}" alt="${ex.nameEn} After" loading="lazy" onerror="this.src='${ex.afterImg}'">
                  <span class="media-tag">${currentMediaType === 'gif' ? 'GIF מונפש' : 'סטטי'} (המתוקן)</span>
                </div>
                <div class="col-desc">
                  <strong>התיקון שהוטמע:</strong> ${ex.afterFix}
                </div>
              </div>
            </div>

            <div class="specs-grid">
              <div class="spec-item">
                <span class="spec-label">מועד ושלב פתיחה</span>
                <span class="spec-value">${ex.unlockTiming}</span>
              </div>
              <div class="spec-item">
                <span class="spec-label">תנאי פתיחה ודרישות קדם</span>
                <span class="spec-value">${ex.unlockPrereq}</span>
              </div>
              <div class="spec-item">
                <span class="spec-label">סטי עבודה וחזרות</span>
                <span class="spec-value">${ex.setsReps}</span>
              </div>
              <div class="spec-item">
                <span class="spec-label">קצב תנועה (Tempo)</span>
                <span class="spec-value">${ex.tempo}</span>
              </div>
              <div class="spec-item">
                <span class="spec-label">זמני מנוחה</span>
                <span class="spec-value">${ex.rest}</span>
              </div>
            </div>

            <div class="cues-box">
              <span class="cues-icon">💡</span>
              <div>
                <strong>דגש ביומכני ומניעת פציעות:</strong> ${ex.biomechanicalCues}
              </div>
            </div>
          </div>
        `;
      }).join('');
    }

    // Initial render
    renderCards();
  </script>
</body>
</html>
"""

with open('exercise_comparison.html', 'w', encoding='utf-8') as f:
    f.write(html_template)

print("Saved exercise_comparison.html successfully!")
