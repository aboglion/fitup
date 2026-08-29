window.ExporterGuide = (() => {

  const GUIDE_I18N = {
    en: {
      title: "FitUp Pro v15.6 Lean Edition — Master Training Program Guide",
      subtitle: "Zero Decisions 3-Button Progression & Adaptive Rest — Complete Blueprint",
      overview_title: "📖 Program Specifications & Philosophy — v15.6 Lean Edition",
      overview_desc: "This training program was engineered under the <strong>v15.6 Lean Protocol</strong> for lower back protection, athletic body sculpting, V-Taper development, arm hyper-trophy, and joint longevity through <strong>Progressive Overload</strong>.",
      zero_decisions_title: "🎯 'Zero Decisions' & 3-Button Outcome Classifier",
      zero_decisions_desc: "The program eliminates guesswork with 3 objective set outcome selectors across all workouts:",
      mental_load: "<strong>Zero Decisions & 3 Outcome Buttons:</strong> Predefined weights, sets, reps, tempo, and rest. Every set is logged as 🚀 <strong>ABOVE</strong>, ✅ <strong>IN_WINDOW</strong>, or ⚠️ <strong>BELOW</strong> (Mechanical Stop). Reaching a mechanical stop automatically extends adaptive rest by +30s. All weighted movements strictly enforce prescribed starting loads and a minimum weight floor (3kg minimum), preventing invalid 0kg displays.",
      strength_cardio: "<strong>Fixed 7-Day Weekly Structure:</strong> 3 strength days (with Day 3 Toggles & Day 1 Linear Progression), Zone 2 cardio day, VO2 Max 4x4 day, Active Recovery & Cervical Health day, and Rest day.",
      deload_cycles: "<strong>Scientific Recovery (Deload Cycles):</strong> Scheduled deload weeks (every 8 weeks: Weeks 8, 16, 24, 32, 40, 48, 56, 64, 72...) reduce volume to 2 sets (~60% load) for neural and joint recovery.",
      time_efficiency_title: "⏱️ Lean Architecture & Structural Optimization (40–45 min target)",
      time_efficiency_list: [
        "<strong>Protected Compound Lifts:</strong> Heavy compound exercises are strictly performed in straight sets with full adaptive rest to protect performance.",
        "<strong>Lean Pairs (Antagonistic & Non-Competing):</strong> Pair non-competing exercises (Day 3: TRX Row ↔ Single-Arm Lateral Raise; Day 5: Push-Up Volume ↔ Single-Arm Curl; Day 5: Towel Hang ↔ L-Sit). Perform Ex A → Ex B → 45-75s rest.",
        "<strong>Arm Block Myo-Reps Protocol:</strong> Active from Week 10 onwards. Myo-reps cluster (1 activation set + 3 mini-sets of 5 reps with 15s rest). Stopped objectively after two consecutive tempo losses, capped at 1 exposure per muscle area per week.",
        "<strong>Progression Trees & Weekly Alternating Toggles:</strong> Day 1 features continuous quad focus (Heels-Elevated Goblet Squat) and linear posterior unlocks (Single-Leg RDL). Day 3 alternates TRX Y-T-W (odd weeks) with Band Pull-Apart (even weeks).",
        "<strong>Biceps 3-Week Microcycle:</strong> Weeks 1-2 heavy progressive overload, Week 3 light preservation (Single-Arm Hammer Curl 2 sets, no progression).",
        "<strong>Data Backup & Cloud Sync:</strong> One-click local JSON export/import alongside automatic bidirectional Google Drive cloud synchronization."
      ],
      equipment_title: "🔧 Required Equipment & Specifications",
      equipment_list: [
        "Modular Dumbbells: 8 plates × 3kg (32kg max weight capacity) + 2 handles (3–32kg legal range per dumbbell)",
        "Pull-up Bar (Pull-Up, Chin-Up, Dead Hang, Towel Hang)",
        "Push-up Bars / Parallettes (All push exercises: Push-Up, Deficit, Pike, L-sit — no palms flat on floor)",
        "TRX Suspension Trainer (Face Pull, TRX Row, Y-T-W at fixed angles)",
        "Resistance Bands: 30kg (Pull-Apart, Pallof, Neck Flexion/Extension), 40kg, 50kg",
        "Bench / Sturdy Chair (Goblet BSS, Feet-Elevated Push-Up, Pike Hold)",
        "Treadmill (Zone 2: 4% incline @ 5.5 km/h; VO2 Max 4x4: 3–6% incline @ 6.5 km/h)",
        "Weighted Vest / Backpack (+2kg, +4kg, +5kg for designated exercises)"
      ],
      weekly_structure_title: "⚙️ Weekly Structure (7 Days)",
      col_day: "Day",
      col_type: "Workout Type",
      col_intensity: "Intensity / Focus",
      days_table: [
        { day: "Day 1", type: "🦵 Legs + Core + Carry", focus: "45 min — RPE 7–9 — Hamstring Chain (Goblet RDL / Single-Leg RDL), Quad Focus (Heels-Elevated Goblet Squat), Goblet BSS, DB Glute Bridge, Suitcase Carry, Calf Block, Core Circuit + Micro Mobility B" },
        { day: "Day 2", type: "🫀 Zone 2 Cardio + Daily Mobility", focus: "45 min — Treadmill (4% incline, 5.5 km/h) + Micro Mobility B" },
        { day: "Day 3", type: "💥 Push + Shoulders + Triceps + Back Volume", focus: "45 min — RPE 7–9 — Pike Hold/Push-Up, Single-Arm Floor Press, Push-Up Bars, Single-Arm Seated OHP, DB Overhead Triceps Ext, Diamond Push-Up, TRX Row ↔ Single-Arm Lateral Raise pair, Rear Delt Toggle + Arm Block (W10+) + Micro Mobility A" },
        { day: "Day 4", type: "🌿 Active Recovery + Cervical & Joint Health", focus: "30 min — Cervical Health (Band Neck Flexion & Extension 2x15-20) + 25 min Treadmill (0% incline, 4.5 km/h) + 10 min Deep Mobility" },
        { day: "Day 5", type: "🧲 Pull + Grip + Core + Chest Volume", focus: "45 min — RPE 7–9 — Pull-Up, One-Arm Row, TRX Face Pull, Biceps Microcycle (Single-Arm Curl & Single-Arm Hammer Curl), Push-Up Volume ↔ Single-Arm Curl pair, Towel Hang ↔ L-Sit pair + Arm Block (W10+) + Micro Mobility A" },
        { day: "Day 6", type: "🔴 VO2 Max 4×4 Cardio", focus: "35 min — Norwegian 4x4: 10m warmup, 4x(4m effort @ 6.5 km/h, 3m rest), 5m cooldown (Zone 2 in Deload)" },
        { day: "Day 7", type: "😴 Full Rest Day", focus: "Complete Recovery, Nutrition & Sleep" }
      ],
      arm_block_title: "💪 Arm Block v15.6 (Myo-Reps Cluster Protocol)",
      arm_block_desc: "Active from Week 10 at end of Day 3 (Single-Arm Lateral Raise + Overhead Triceps Extension) and Day 5 (Single-Arm Curl / Single-Arm Hammer Curl). 1 activation set to target + 3 mini-sets of 5 reps with 15s rest. Objective stop rule: 2 consecutive tempo losses terminates cluster. Capped at 1 exposure per muscle area per week.",
      dictionary_title: "📚 Exercise Dictionary",
      dictionary_subtitle: "Comprehensive list of all exercises in the program.",
      full_plan_title: "📅 Full Program Breakdown",
      full_plan_desc: "Detailed daily schedule of exercises, sets, reps, and tempos.",
      table_ex: "Exercise",
      table_sets: "Sets & Reps",
      table_weight: "Resistance / Weight",
      table_tempo: "Tempo",
      table_rest: "Rest",
      exporting_btn: "⏳ Preparing Guide...",
      export_btn: "📄 View & Download Full Guide",
      toast_success: "Program guide generated and downloaded! 📄",
      toast_error: "Error exporting guide"
    },
    he: {
      title: "FitUp Pro v15.6 Lean — מדריך תוכנית האימונים המלא",
      subtitle: "פרוטוקול \"אפס החלטות\" בשיטת 3 כפתורים + מנוחה דינמית אדפטיבית — פריסה מלאה",
      overview_title: "📖 אפיון והסבר על התוכנית — גרסה v15.6 Lean",
      overview_desc: "תוכנית אימונים זו תוכננה עפ\"י פרוטוקול <strong>v15.6 Lean</strong> ומותאמת להגנה על הגב התחתון, לבניית גוף אתלטי, V-Taper, זרועות בולטות, וחיזוק גידים ומפרקים באמצעות <strong>התקדמות הדרגתית מבוקרת (Progressive Overload)</strong>.",
      zero_decisions_title: "🎯 פילוסופיית \"אפס החלטות\" ומנגנון 3 תוצאות סט",
      zero_decisions_desc: "התוכנית נבנתה במכוון סביב הרעיון של <strong>אפס החלטות מצד המתאמן</strong> באמצעות דיווח 3 תוצאות אובייקטיביות בלבד:",
      mental_load: "<strong>אפס החלטות ודירוג 3 כפתורים:</strong> כל תרגיל, משקל, סטים, חזרות, קצב (Tempo) וזמני מנוחה קבועים מראש. בסיום סט בוחרים: 🚀 <strong>מעל היעד</strong>, ✅ <strong>בתחום היעד</strong>, או ⚠️ <strong>כשל / עצירה מכנית</strong> (מפעיל אוטומטית +30 שנ' מנוחה אדפטיבית). כל תרגילי המשקולות מוגנים ע\"י משקל מינימלי קשיח (לפחות 3 ק\"ג / משקל התחלתי מוגדר), המונע לחלוטין הצגת 0 ק\"ג.",
      strength_cardio: "<strong>מבנה שבועי קבוע (7 ימים):</strong> יום 1 (רגליים+ליבה+אחיזה), יום 2 (Zone 2+מוביליות), יום 3 (דחיפה+כתפיים+טריספס+נפח גב), יום 4 (התאוששות פעילה+פרוטוקול צוואר), יום 5 (משיכה+גב+ביספס+נפח חזה), יום 6 (VO2 Max 4x4), יום 7 (מנוחה מלאה).",
      deload_cycles: "<strong>התאוששות מדעית (Deload Cycles):</strong> שבועות דילואד מוגדרים מראש (כל 8 שבועות: 8, 16, 24, 32, 40, 48, 56, 64, 72...) שבהם הנפח יורד ל-2 סטים (~60% משקל) להורדת עומס מעצבים ומפרקים.",
      time_efficiency_title: "⏱️ מבנה Lean וייעול זמנים (אימון ב-40–45 דקות)",
      time_efficiency_list: [
        "<strong>הגנה על תרגילי בסיס:</strong> תרגילי כוח מורכבים כבדים מבוצעים תמיד כסטים ישרים עם מנוחה אדפטיבית מלאה להגנה על ביצועים.",
        "<strong>זיווגי Lean (אנטגוניסטיים ולא-מתחרים):</strong> זיווג תרגילים לא מתחרים (יום 3: TRX Row ↔ Single-Arm Lateral Raise; יום 5: Push-Up Volume ↔ Single-Arm Curl; יום 5: Towel Hang ↔ L-Sit). מבוצע א' ← ב' ← מנוחה 45-75 שנ'.",
        "<strong>פרוטוקול Arm Block ב-Myo-Reps:</strong> פעיל משבוע 10. צביר Myo-Reps (סט אקטיבציה + 3 מיני-סטים של 5 חזרות עם 15 שנ' מנוחה). עצירה אובייקטיבית ב-2 אובדני טמפו רצופים, מוגבל לחשיפה אחת בשבוע לכל אזור שרירי.",
        "<strong>עצי התקדמות ורוטציות שבועיות:</strong> יום 1 כולל פוקוס קוואדס רציף (Heels-Elevated Goblet Squat) ופתיחת שלבים ליניארית בשרשרת האחורית (Single-Leg RDL). יום 3 מחליף TRX Y-T-W (אי-זוגי) עם Band Pull-Apart (זוגי).",
        "<strong>מיקרו-מחזור בייספס (3 שבועות):</strong> שבועות 1-2 עומס כבד וקידום, שבוע 3 קל (Single-Arm Hammer Curl בלבד, 2 סטים, ללא קידום).",
        "<strong>גיבוי נתונים וסנכרון ענן:</strong> ייצוא/ייבוא קובץ JSON מקומי בלחיצה אחת לצד סנכרון ענן דו-כיווני ל-Google Drive."
      ],
      equipment_title: "🔧 ציוד נדרש ושימוש קבוע",
      equipment_list: [
        "משקולות מודולריות: 8 פלטות × 3 ק\"ג (קיבולת 32 ק\"ג max) + 2 ידיות (טווח חוקי 3–32 ק\"ג ליד)",
        "מוט מתח (Pull-Up, Chin-Up, Dead Hang, Towel Hang)",
        "Push-up Bars (כל תרגילי הדחיפה: Push-Up, Deficit, Pike, L-sit — אין כפות ידיים על הרצפה)",
        "TRX (Face Pull, TRX Row, Y-T-W בזוויות קבועות)",
        "גומיות התנגדות: 30 ק\"ג (Pull-Apart, Pallof, כפיפה/פשיטת צוואר), 40 ק\"ג, 50 ק\"ג",
        "כיסא / ספסל יציב (Goblet BSS, Feet-Elevated Push-Up, Pike Hold)",
        "הליכון (Zone 2: שיפוע 4% ב-5.5 קמ\"ש; VO2 Max 4×4: שיפוע 3%–6% ב-6.5 קמ\"ש)",
        "וסט משוקלל (+2, +4, +5 ק\"ג לתרגילים המסומנים בלבד)"
      ],
      weekly_structure_title: "⚙️ מבנה שבועי קבוע (7 ימים)",
      col_day: "יום",
      col_type: "סוג אימון",
      col_intensity: "עצימות / דגשים",
      days_table: [
        { day: "יום 1", type: "🦵 רגליים + ליבה + אחיזה/נשיאה", focus: "45 דק' — RPE 7–9 — שרשרת המסטרינג (Goblet RDL / Single-Leg RDL), פוקוס קוואדס (Heels-Elevated Goblet Squat), Goblet BSS, DB Glute Bridge, Suitcase Carry, בלוק תאומים, מעגל ליבה + מיקרו-מוביליות B" },
        { day: "יום 2", type: "🫀 Zone 2 Cardio + מוביליות יומית", focus: "45 דק' — 45 דק' הליכה בשיפוע 4% (5.5 קמ\"ש, דופק Zone 2) + מיקרו-מוביליות B" },
        { day: "יום 3", type: "💥 דחיפה + כתפיים + טריספס + נפח גב", focus: "45 דק' — RPE 7–9 — Pike Hold/Push-Up, Single-Arm Floor Press, Push-Up Bars, OHP, Triceps Ext, Diamond Push-Up, זוג TRX Row ↔ Single-Arm Lateral Raise, רוטציית כתף אחורית + Arm Block (משבוע 10) + מיקרו-מוביליות A" },
        { day: "יום 4", type: "🌿 התאוששות פעילה + בריאות צוואר ומפרקים", focus: "30 דק' — פרוטוקול צוואר (Band Neck Flexion & Extension 2x15-20) + 25 דק' הליכון 0% (4.5 קמ\"ש) + 10 דק' דיפ-מוביליות" },
        { day: "יום 5", type: "🧲 משיכה + גב + ביספס + נפח חזה", focus: "45 דק' — RPE 7–9 — מתח, One-Arm Row, TRX Face Pull, מיקרו-מחזור בייספס, זוג Push-Up Volume ↔ Single-Arm Curl, זוג Towel Hang ↔ L-Sit + Arm Block (משבוע 10) + מיקרו-מוביליות A" },
        { day: "יום 6", type: "🔴 VO2 Max 4×4 Cardio", focus: "35 דק' — פרוטוקול נורבגי: 10 דק' חימום, 4×(4 דק' מאמץ 6.5 קמ\"ש בשיפוע השלב / 3 דק' מנוחה), 5 דק' שחרור" },
        { day: "יום 7", type: "😴 מנוחה מלאה", focus: "התאוששות מלאה, תזונה ושינה" }
      ],
      arm_block_title: "💪 בלוק זרועות v15.6 (פרוטוקול Myo-Reps Cluster)",
      arm_block_desc: "מתבצע בסוף יום 3 (Lateral + Triceps) ויום 5 (Curl / Hammer) משבוע 10. סט אקטיבציה יחיד ליעד + 3 מיני-סטים של 5 חזרות עם 15 שנ' מנוחה. חוק עצירה אובייקטיבי: 2 אובדני טמפו רצופים מסיימים את הצביר. חשיפה מוגבלת לפעם אחת בשבוע לכל אזור שרירי.",
      dictionary_title: "📚 מילון תרגילים",
      dictionary_subtitle: "פירוט כל התרגילים המופיעים בתוכנית.",
      full_plan_title: "📅 פירוט התוכנית המלאה",
      full_plan_desc: "כאן תוכלו לראות כל יום ויום בתוכנית, כולל תרגילים, חזרות וזמני עבודה.",
      table_ex: "תרגיל",
      table_sets: "סטים וחזרות",
      table_weight: "התנגדות / משקל",
      table_tempo: "קצב (Tempo)",
      table_rest: "מנוחה",
      exporting_btn: "⏳ מכין מדריך...",
      export_btn: "📄 צפה והורד מדריך מלא",
      toast_success: "המדריך נוצר והורד בהצלחה! 📄",
      toast_error: "שגיאה בייצוא המדריך"
    },
    ar: {
      title: "FitUp Pro v15.6 Lean — دليل برنامج التدريب الكامل",
      subtitle: "بروتوكول \"صفر قرارات\" بنظام 3 أزرار + الراحة الديناميكية — الإصدار Lean",
      overview_title: "📖 المواصفات والشفافية — الإصدار v15.6 Lean",
      overview_desc: "تم تصميم هذا البرنامج وفق بروتوكول <strong>v15.6 Lean</strong> لحماية أسفل الظهر وبناء جسم رياضي مع التركيز على <strong>التحميل الزائد التدريجي (Progressive Overload)</strong>.",
      zero_decisions_title: "🎯 فلسفة \"صفر قرارات\" ونظام الأزرار الثلاثة",
      zero_decisions_desc: "يلغي البرنامج التخمين كلياً عبر اختيار واحدة من 3 نتائج محددة للمجموعة:",
      mental_load: "<strong>صفر قرارات وتقييم 3 أزرار:</strong> الأوزان والمجموعات والتكرارات محددة مسبقاً. عند نهاية المجموعة تختار: 🚀 <strong>أعلى من الهدف</strong>, ✅ <strong>ضمن الهدف</strong>, أو ⚠️ <strong>فشل / توقف ميكانيكي</strong> (يزيد الراحة تلقائياً +30 ثانية).",
      strength_cardio: "<strong>الهيكل الأسبوعي (7 أيام):</strong> اليوم 1 (الأرجل+الظهر/الكتف), اليوم 2 (Zone 2+مرونة), اليوم 3 (الدفع+الكتفين+الترايسبس), اليوم 4 (التعافي النشط+صحة الرقبة), اليوم 5 (السحب+القبضة+البايسبس), اليوم 6 (VO2 Max 4x4), اليوم 7 (راحة كاملة).",
      deload_cycles: "<strong>التعافي العلمي (أسابيع Deload):</strong> أسابيع تعافي محددة (كل 8 أسابيع: 8, 16, 24, 32, 40, 48, 56, 64, 72...) يقل فيها الحجم إلى مجموعتين (~60% وزن).",
      time_efficiency_title: "⏱️ بنية Lean وتحسين الوقت (40-45 دقيقة)",
      time_efficiency_list: [
        "<strong>حماية التمارين المركبة:</strong> التمارين المركبة الثقيلة تتم دائماً في مجموعات مستقيمة مع راحة كاملة.",
        "<strong>ثنائيات Lean (المزدوجة):</strong> دمج تمارين غير متنافسة (اليوم 3: TRX Row ↔ Single-Arm Lateral Raise; اليوم 5: Push-Up Volume ↔ Single-Arm Curl).",
        "<strong>بروتوكول بلوك الذراعين Myo-Reps:</strong> مفعل من الأسبوع 10. مجموعة تنشيط + 3 مجموعات مصغرة (5 تكرارات مع 15 ثانية راحة). توقف عند فقدان الإيقاع مرتين متتاليتين.",
        "<strong>التناوب الأسبوعي (Toggles):</strong> اليوم 3 يتناول TRX Y-T-W و Band Pull-Apart. اليوم 1 يتبع مسار التقدم الخطي (Heels-Elevated Goblet Squat & Single-Leg RDL).",
        "<strong>دورة البايسبس (3 أسابيع):</strong> أسبوعان حمولة زائدة وأسبوع خفيف."
      ],
      equipment_title: "🔧 المعدات المطلوبة",
      equipment_list: [
        "أثقال يدوية قابلة للتعديل (3–32 كغم)",
        "عقلة (Pull-Up, Chin-Up, Dead Hang, Towel Hang)",
        "مقابض ضغط / Parallettes (جميع تمارين الضغط)",
        "حبال TRX (Face Pull, TRX Row, Y-T-W)",
        "أربطة مقاومة: 30 كغم، 40 كغم، 50 كغم",
        "كرسي / مقعد ثابت",
        "جهاز مشي",
        "سترة ثقيلة (+2 كغم، +4 كغم، +5 كغم)"
      ],
      weekly_structure_title: "⚙️ الهيكل الأسبوعي (7 أيام)",
      col_day: "اليوم",
      col_type: "نوع التمرين",
      col_intensity: "الشدة / التركيز",
      days_table: [
        { day: "اليوم 1", type: "Legs + Core + Grip", focus: "45 دقيقة — RPE 7–9 — Hamstring Chain (RDL), Quad Focus (Heels-Elevated Goblet Squat), Goblet BSS, DB Glute Bridge, Suitcase Carry, Core + المرونة المصغرة ب" },
        { day: "اليوم 2", type: "Zone 2 Cardio + المرونة اليومية", focus: "45 دقيقة — مشي مائل (4%, 5.5 كم/س) + المرونة المصغرة ب" },
        { day: "اليوم 3", type: "Push + Shoulders + Triceps", focus: "45 دقيقة — RPE 7–9 — Single-Arm Floor Press, OHP, Single-Arm Lateral Raise + بلوك الذراعين (من الأسبوع 10) + المرونة المصغرة أ" },
        { day: "اليوم 4", type: "Active Recovery + صحة الرقبة", focus: "30 دقيقة — تمارين الرقبة + مشي 25 دقيقة (0%, 4.5 كم/س) + مرونة عميقة" },
        { day: "اليوم 5", type: "Pull + Back + Biceps", focus: "45 دقيقة — RPE 7–9 — عقلة, Rows, TRX Face Pull, Curls + بلوك الذراعين (من الأسبوع 10) + المرونة المصغرة أ" },
        { day: "اليوم 6", type: "VO2 Max 4×4 Cardio", focus: "35 دقيقة — بروتوكول نرويجي 4x4" },
        { day: "اليوم 7", type: "Rest Day", focus: "راحة كاملة وتغذية ونوم" }
      ],
      arm_block_title: "💪 بلوك الذراعين v15.6 (بروتوكول Myo-Reps)",
      arm_block_desc: "يتم إجراؤه في نهاية اليوم 3 واليوم 5 من الأسبوع 10. مجموعة تنشيطية واحدة + 3 مجموعات مصغرة (5 تكرارات مع 15 ثانية راحة). توقف عند فقدان الإيقاع مرتين متتاليتين.",
      dictionary_title: "📚 قاموس التمارين",
      dictionary_subtitle: "قائمة شاملة بجميع التمارين المذكورة في البرنامج.",
      full_plan_title: "📅 تفاصيل البرنامج الكامل",
      full_plan_desc: "هنا يمكنك رؤية كل يوم في البرنامج بما في ذلك التمارين والتكرارات وأوقات الراحة.",
      table_ex: "التمرين",
      table_sets: "المجموعات والتكرارات",
      table_weight: "المقاومة / الوزن",
      table_tempo: "الإيقاع (Tempo)",
      table_rest: "الراحة",
      exporting_btn: "⏳ جاري إعداد الدليل...",
      export_btn: "📄 عرض وتحميل الدليل الكامل",
      toast_success: "تم إنشاء الدليل وتحميله بنجاح! 📄",
      toast_error: "حدث خطأ أثناء تصدير الدليل"
    }
  };

  async function generateProgramGuide() {
    const allPlan = await DB.getAllPlan();
    allPlan.sort((a, b) => a.dayIndex - b.dayIndex);
    const exercises = await DB.getExerciseGuide();
    
    const lang = (window.I18n ? window.I18n.getLang() : 'en');
    const dir = (window.I18n ? window.I18n.getDir() : 'ltr');
    const t = GUIDE_I18N[lang] || GUIDE_I18N['en'];

    let html = `
    <!DOCTYPE html>
    <html lang="${lang}" dir="${dir}">
    <head>
      <meta charset="UTF-8">
      <title>${t.title}</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Heebo:wght@300;400;500;700&family=Inter:wght@300;400;500;600;700&family=Cairo:wght@400;600;700&display=swap');
        :root {
          --primary: #3b82f6;
          --bg-main: #f8fafc;
          --bg-card: #ffffff;
          --text-main: #0f172a;
          --text-muted: #64748b;
          --border: #e2e8f0;
        }
        body { 
          font-family: ${dir === 'rtl' ? (lang === 'ar' ? "'Cairo', sans-serif" : "'Heebo', sans-serif") : "'Inter', sans-serif"}; 
          line-height: 1.6; 
          color: var(--text-main); 
          max-width: 1000px; 
          margin: 0 auto; 
          padding: 20px; 
          background: var(--bg-main); 
        }
        h1, h2, h3, h4 { color: var(--text-main); margin-top: 1.5em; }
        .header { 
          text-align: center; 
          border-bottom: 3px solid var(--primary); 
          padding-bottom: 20px; 
          margin-bottom: 30px; 
        }
        .header h1 { margin-top: 0; font-size: 2.2em; color: var(--primary); }
        .section { 
          background: var(--bg-card); 
          padding: 30px; 
          border-radius: 12px; 
          box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); 
          margin-bottom: 30px; 
        }
        table { 
          width: 100%; 
          border-collapse: collapse; 
          margin-top: 10px; 
          font-size: 0.95em;
        }
        th, td { 
          padding: 12px; 
          border: 1px solid var(--border); 
          text-align: ${dir === 'rtl' ? 'right' : 'left'}; 
        }
        th { background-color: #f1f5f9; font-weight: 700; }
        .week-block { 
          margin-top: 40px; 
          border-top: 4px solid var(--primary); 
          padding-top: 20px; 
        }
        .day-block { 
          margin-bottom: 25px; 
          padding: 20px; 
          border: 1px solid var(--border); 
          border-${dir === 'rtl' ? 'right' : 'left'}: 5px solid var(--primary); 
          background: var(--bg-card); 
          border-radius: 8px;
        }
        .day-title {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 15px;
          margin-top: 0;
        }
        .exercise-card { 
          background: var(--bg-main); 
          padding: 20px; 
          margin-bottom: 15px; 
          border-radius: 8px; 
          border: 1px solid var(--border); 
        }
        .badge { 
          display: inline-block; 
          padding: 4px 10px; 
          border-radius: 12px; 
          font-size: 0.85em; 
          font-weight: bold; 
          background: #e0f2fe; 
          color: #0369a1; 
        }
        .badge.rest { background: #f1f5f9; color: #475569; }
        .badge.walk { background: #dcfce7; color: #166534; }
        .grid-container {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 20px;
        }
        ul, ol { padding-${dir === 'rtl' ? 'right' : 'left'}: 20px; }
        li { margin-bottom: 8px; }
        @media print {
          body { background: white; }
          .section, .day-block, .exercise-card { box-shadow: none; border: 1px solid #ccc; break-inside: avoid; }
          .week-block { page-break-before: always; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>🏋️ ${t.title}</h1>
        <p><strong>${t.subtitle}</strong></p>
      </div>

      <div class="section">
        <h2>${t.overview_title}</h2>
        <p>${t.overview_desc}</p>

        <h3>${t.zero_decisions_title}</h3>
        <p>${t.zero_decisions_desc}</p>
        <ul>
          <li>${t.mental_load}</li>
          <li>${t.strength_cardio}</li>
          <li>${t.deload_cycles}</li>
        </ul>

        <h3>${t.time_efficiency_title}</h3>
        <ul>
          ${t.time_efficiency_list ? t.time_efficiency_list.map(item => `<li>${item}</li>`).join('') : ''}
        </ul>

        <h3>${t.equipment_title}</h3>
        <ul>
          ${t.equipment_list.map(item => `<li>${item}</li>`).join('')}
        </ul>

        <h3>${t.weekly_structure_title}</h3>
        <table>
          <tr><th>${t.col_day}</th><th>${t.col_type}</th><th>${t.col_intensity}</th></tr>
          ${t.days_table.map(row => `<tr><td>${row.day}</td><td>${row.type}</td><td>${row.focus}</td></tr>`).join('')}
        </table>

        <h3>${t.arm_block_title}</h3>
        <p>${t.arm_block_desc}</p>
        <ul>
          <li><strong>${lang === 'he' ? 'סט אקטיבציה:' : (lang === 'ar' ? 'مجموعة التنشيط:' : 'Activation Set:')}</strong> ${lang === 'he' ? 'ביצוע ליעד החזרות של השלב הנוכחי (למשל 12 חזרות). מנוחה 15 שניות.' : (lang === 'ar' ? 'التنفيذ لهدف التكرارات. راحة 15 ثانية.' : 'Executed to stage target reps. Rest 15 seconds.')}</li>
          <li><strong>${lang === 'he' ? 'מיני-סטים:' : (lang === 'ar' ? 'المجموعات المصغرة:' : 'Mini-Sets:')}</strong> ${lang === 'he' ? '3 מיני-סטים של 5 חזרות נקיות, 15 שניות מנוחה ביניהם.' : (lang === 'ar' ? '3 مجموعات مصغرة من 5 تكرارات، 15 ثانية راحة بينها.' : '3 mini-sets of 5 clean reps each, 15s rest between mini-sets.')}</li>
          <li><strong>${lang === 'he' ? 'חוק עצירה אובייקטיבי (two_consecutive_tempo_losses):' : (lang === 'ar' ? 'قانون التوقف الموضوعي:' : 'Objective Stop Rule (two_consecutive_tempo_losses):')}</strong> ${lang === 'he' ? 'שני אובדני טמפו רצופים (אקסצנטרי מתחת ל-2 שניות, תנופה או שינוי טכניקה) מסיימים את הצביר מיד. חזרות עם אובדן טמפו אינן נספרות.' : (lang === 'ar' ? 'فقدان الإيقاع مرتين متتاليتين ينهي التجميع فوراً.' : 'Two consecutive tempo losses immediately terminates the cluster. Non-tempo reps are not counted.')}</li>
          <li><strong>${lang === 'he' ? 'מגבלת חשיפה שבועית:' : (lang === 'ar' ? 'حد التعرض الأسبوعي:' : 'Weekly Exposure Limit:')}</strong> ${lang === 'he' ? 'חשיפה אחת בלבד בשבוע לכל אזור שרירי (כתף צדית, טריספס, בייספס).' : (lang === 'ar' ? 'تعرض واحد فقط أسبوعياً لكل منطقة عضلية.' : 'Max 1 exposure per muscle area per week (Lateral Shoulder, Triceps, Biceps).')}</li>
        </ul>
      </div>

      <div class="section">
        <h2>${t.dictionary_title}</h2>
        <p>${t.dictionary_subtitle}</p>
        <div class="grid-container">
          ${exercises.map(ex => {
            const hasNoGif = ex.name.toLowerCase().includes('walking') || ['Slow Jogging', 'Dead Hang', 'Full Pistol Squat'].includes(ex.name);
            return `
            <div class="exercise-card">
              <h4 style="margin-top: 0; margin-bottom: 8px; color: var(--primary);">${ex.name}</h4>
              <p style="margin: 0 0 6px 0;"><span class="badge">${ex.category || 'General'}</span> ${ex.difficulty ? `<span class="badge" style="background: #fef3c7; color: #92400e;">${ex.difficulty}</span>` : ''}</p>
              ${ex.weight ? `<p style="font-size: 0.9em; margin: 4px 0;"><strong>Resistance:</strong> <bdi dir="ltr">${ex.weight}</bdi></p>` : ''}
              ${ex.setsProgression ? `<p style="font-size: 0.9em; margin: 4px 0;"><strong>Progression:</strong> ${ex.setsProgression}</p>` : ''}
              ${!hasNoGif ? `<p style="font-size: 0.9em; margin: 4px 0;"><a href="images/gifs/${ex.name}.gif" target="_blank" style="color: var(--primary);">▶ Watch GIF</a></p>` : ''}
            </div>
            `;
          }).join('')}
        </div>
      </div>

      <div class="section">
        <h2>${t.full_plan_title}</h2>
        <p>${t.full_plan_desc}</p>
        
        ${generateWeeksHtml(allPlan, t)}
      </div>

    </body>
    </html>
    `;

    return html;
  }

  function getBadgeClass(dayType) {
    if (dayType === 'Rest') return 'badge rest';
    if (dayType === 'Cardio') return 'badge walk';
    return 'badge';
  }

  function generateWeeksHtml(allPlan, t) {
    const weeks = {};
    allPlan.forEach(day => {
      if (!weeks[day.week]) weeks[day.week] = [];
      weeks[day.week].push(day);
    });

    let html = '';
    for (const [weekName, days] of Object.entries(weeks)) {
      html += `<div class="week-block">
        <h3>${weekName}</h3>`;
      
      days.forEach(day => {
        html += `
        <div class="day-block">
          <h4 class="day-title">Day <span dir="ltr">#${day.dayNum}</span>: ${day.dayOfWeek} <span class="${getBadgeClass(day.dayType)}">${day.dayType}</span> <span style="font-size: 0.8em; color: var(--text-muted);">(RPE: ${day.plannedRPE})</span></h4>
          `;
          
          if (day.exercises && day.exercises.length > 0) {
            html += `<table>
              <tr>
                <th>${t.table_ex}</th>
                <th width="140">${t.table_sets}</th>
                <th width="120">${t.table_weight}</th>
                <th width="100">${t.table_tempo}</th>
                <th width="90">${t.table_rest}</th>
              </tr>`;
            day.exercises.forEach(ex => {
              html += `<tr>
                <td><strong>${ex.name}</strong></td>
                <td dir="ltr" style="text-align: right;">${ex.sets || '-'}</td>
                <td dir="ltr" style="text-align: right;"><bdi dir="ltr">${ex.weight || '-'}</bdi></td>
                <td dir="ltr" style="text-align: right;">${ex.tempo ? (UI.formatTempo ? UI.formatTempo(ex.tempo) : ex.tempo) : '-'}</td>
                <td dir="ltr" style="text-align: right;">${ex.rest ? ex.rest + 's' : '-'}</td>
              </tr>`;
            });
            html += `</table>`;
          } else {
            html += `<p style="color: var(--text-muted);">${t.days_table[6]?.focus || 'Rest Day'}</p>`;
          }
          
        html += `</div>`;
      });
      html += `</div>`;
    }
    return html;
  }

  async function handleExport() {
    const lang = (window.I18n ? window.I18n.getLang() : 'en');
    const t = GUIDE_I18N[lang] || GUIDE_I18N['en'];

    try {
      const btn = document.getElementById('export-guide-btn');
      if(btn) {
        btn.innerHTML = t.exporting_btn;
        btn.disabled = true;
      }

      const html = await generateProgramGuide();
      const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `FitUp-Pro-Guide-${lang}.html`;
      a.click();
      
      setTimeout(() => {
        URL.revokeObjectURL(url);
      }, 1000);
      
      if(btn) {
        btn.innerHTML = t.export_btn;
        btn.disabled = false;
      }
      if(window.UI && window.UI.toast) {
        UI.toast(t.toast_success, 'success');
      }
    } catch(err) {
      console.error(err);
      const btn = document.getElementById('export-guide-btn');
      if(btn) {
        btn.innerHTML = t.export_btn;
        btn.disabled = false;
      }
      if(window.UI && window.UI.toast) {
        UI.toast(t.toast_error, 'error');
      }
    }
  }

  return {
    init: () => {
      const btn = document.getElementById('export-guide-btn');
      if (btn) {
        btn.addEventListener('click', handleExport);
      }
    }
  };

})();

window.ExportGuidePage = window.ExporterGuide;
