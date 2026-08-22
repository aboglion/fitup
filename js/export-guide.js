window.ExporterGuide = (() => {

  const GUIDE_I18N = {
    en: {
      title: "FitUp Pro v15.6 Lean Edition — 78-Week Training Program Guide",
      subtitle: "Zero Decisions 3-Button Progression & Adaptive Rest — Full 546-Day Blueprint",
      overview_title: "📖 Program Specifications & Philosophy — v15.6 Lean Edition",
      overview_desc: "This training program was engineered for <strong>78 weeks (546 days)</strong> tailored for age 42 with lower back protection under the <strong>v15.6 Lean Protocol</strong>. It prioritizes athletic body, V-Taper, arm development, strong back, and joint longevity through <strong>Progressive Overload</strong>.",
      zero_decisions_title: "🎯 'Zero Decisions' & 3-Button Outcome Classifier",
      zero_decisions_desc: "The program eliminates guesswork with 3 objective set outcome selectors across all 78 weeks:",
      mental_load: "<strong>Zero Decisions & 3 Outcome Buttons:</strong> Predefined weights, sets, reps, tempo, and rest. Every set is logged as 🚀 <strong>ABOVE</strong>, ✅ <strong>IN_WINDOW</strong>, or ⚠️ <strong>BELOW</strong> (Mechanical Stop). Reaching a mechanical stop automatically extends adaptive rest by +30s.",
      strength_cardio: "<strong>Fixed 7-Day Weekly Structure:</strong> 3 strength days, Zone 2 cardio day, VO2 Max 4x4 day, Active Recovery day, and Rest day.",
      deload_cycles: "<strong>Scientific Recovery (Deload Cycles):</strong> Scheduled deload weeks (Weeks 8, 16, 24, 32, 40, 48, 56, 61, 65, 69, 73) reduce volume to 2 sets (~60% load) for neural and joint recovery.",
      time_efficiency_title: "⏱️ Time Efficiency & Antagonistic Supersets Protocol (45–50 min target)",
      time_efficiency_list: [
        "<strong>Antagonistic Supersets:</strong> Pair non-competing isolation exercises (e.g., Lateral Raise + Triceps Ext on Day 3). Perform Ex A → 45s rest → Ex B → 45s rest. Target muscle gets 120s full recovery while cutting clock time by 50%.",
        "<strong>Arm Block Integration:</strong> From Week 10 onwards, main table isolation sets (Lateral & Triceps) are capped at 2 sets as the Arm Block ladder handles primary progression.",
        "<strong>Single-Arm Staggered Rest:</strong> On unilateral work, rest 45s between right and left sides (giving Arm A 105s total rest without passive waiting).",
        "<strong>Micro-Mobility Integration:</strong> Perform Dead Hang or chest stretches during set rest periods to save 5 minutes post-workout."
      ],
      equipment_title: "🔧 Required Equipment & Specifications",
      equipment_list: [
        "Modular Dumbbells: 8 plates × 3kg (24kg total) + 2 handles (3, 6, 9, 12kg per dumbbell / up to 24kg single)",
        "Pull-up Bar (Pull-Up, Chin-Up, Dead Hang, Towel Hang)",
        "Push-up Bars / Parallettes (All push exercises: Push-Up, Deficit, Pike, L-sit)",
        "TRX Suspension Trainer (Face Pull, Y-T-W at fixed angles)",
        "Resistance Bands: 30kg (Pull-Apart, Pallof), 40kg (Advanced Pallof)",
        "Bench / Sturdy Chair (BSS, Feet-Elevated Push-Up, Pike Hold)",
        "Treadmill (Zone 2: 4% incline @ 5.5 km/h; VO2 Max 4x4: 3–6% incline @ 6.5 km/h)",
        "Weighted Vest / Backpack (+5kg for designated exercises)"
      ],
      weekly_structure_title: "⚙️ Weekly Structure (7 Days)",
      col_day: "Day",
      col_type: "Workout Type",
      col_intensity: "Intensity / Focus",
      days_table: [
        { day: "Day 1", type: "🦵 Legs + Core + Grip/Carry", focus: "50 min — RPE 7–9 — RDL, BSS, Hip Thrust, Calf Raise, Suitcase Carry, Core" },
        { day: "Day 2", type: "🫀 Zone 2 Cardio + Daily Mobility", focus: "50 min — 45 min Treadmill (4% incline, 5.5 km/h) + 5 min Micro Mobility" },
        { day: "Day 3", type: "💥 Push + Shoulders + Triceps + Handstand", focus: "55 min — RPE 7–9 — Handstand, Floor Press, Push-up, OHP, Lateral Raise + Arm Block (from W10)" },
        { day: "Day 4", type: "🌿 Active Recovery + Deep Mobility", focus: "30 min — 25 min Treadmill (0% incline, 4.5 km/h) + 10 min Macro Mobility" },
        { day: "Day 5", type: "🧲 Pull + Back + Biceps + Grip + Core", focus: "55 min — RPE 7–9 — Pull-ups, Chin-ups, One-Arm Row, TRX Face Pull, Curls, Towel Hang + Arm Block (from W10)" },
        { day: "Day 6", type: "🔴 VO2 Max 4×4 Cardio", focus: "35 min — Norwegian 4x4: 10m warmup, 4x(4m effort @ 6.5 km/h, 3m rest), 5m cooldown (Zone 2 in Deload)" },
        { day: "Day 7", type: "😴 Full Rest Day", focus: "Complete Recovery, Nutrition & Sleep" }
      ],
      arm_block_title: "💪 Arm Block v5 (Appendix B — Double Progression Ladder)",
      arm_block_desc: "Starts from Week 10 at the end of Day 3 (Lateral + Triceps) and Day 5 (Curl). 2 sets each, 60s rest. Advance 1 step when all reps completed in tempo.",
      dictionary_title: "📚 Exercise Dictionary",
      dictionary_subtitle: "Comprehensive list of all exercises in the 78-week program.",
      full_plan_title: "📅 Full 78-Week Program Breakdown",
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
      title: "FitUp Pro v15.6 Lean — מדריך תוכנית 78 שבועות",
      subtitle: "פרוטוקול \"אפס החלטות\" בשיטת 3 כפתורים + מנוחה דינמית אדפטיבית — פריסת 546 ימים מלאה",
      overview_title: "📖 אפיון והסבר על התוכנית — גרסה v15.6 Lean",
      overview_desc: "תוכנית אימונים זו תוכננה למשך <strong>78 שבועות (546 ימים)</strong> עפ\"י פרוטוקול <strong>v15.6 Lean</strong> ומותאמת לגיל 42 עם הגנה על הגב התחתון. התוכנית מבוססת על <strong>התקדמות הדרגתית מבוקרת (Progressive Overload)</strong> לבניית גוף אתלטי, V-Taper, זרועות בולטות, וחיזוק גידים ומפרקים.",
      zero_decisions_title: "🎯 פילוסופיית \"אפס החלטות\" ומנגנון 3 תוצאות סט",
      zero_decisions_desc: "התוכנית נבנתה במכוון סביב הרעיון של <strong>אפס החלטות מצד המתאמן</strong> באמצעות דיווח 3 תוצאות אובייקטיביות בלבד:",
      mental_load: "<strong>אפס החלטות ודירוג 3 כפתורים:</strong> כל תרגיל, משקל, סטים, חזרות, קצב (Tempo) וזמני מנוחה קבועים מראש. בסיום סט בוחרים: 🚀 <strong>מעל היעד</strong>, ✅ <strong>בתחום היעד</strong>, או ⚠️ <strong>כשל / עצירה מכנית</strong> (מפעיל אוטומטית +30 שנ' מנוחה אדפטיבית).",
      strength_cardio: "<strong>מבנה שבועי קבוע (7 ימים):</strong> יום 1 (רגליים+ליבה+אחיזה), יום 2 (Zone 2+מוביליות), יום 3 (דחיפה+עמידת ידיים+בלוק זרועות), יום 4 (התאוששות פעילה), יום 5 (משיכה+אחיזה+בלוק זרועות), יום 6 (VO2 Max 4x4), יום 7 (מנוחה מלאה).",
      deload_cycles: "<strong>התאוששות מדעית (Deload Cycles):</strong> שבועות דילואד מוגדרים מראש (שבועות 8, 16, 24, 32, 40, 48, 56, 61, 65, 69, 73) שבהם הנפח יורד ל-2 סטים (~60% משקל) להורדת עומס מעצבים ומפרקים.",
      time_efficiency_title: "⏱️ פרוטוקול ייעול זמנים וסופר-סטים (אימון ב-45–50 דקות)",
      time_efficiency_list: [
        "<strong>סופר-סטים אנטגוניסטיים (Antagonistic Supersets):</strong> בתרגילי בידוד (כמו Lateral Raise + Triceps Ext ביום 3, או Curl + Core ביום 5), בצע את תרגיל א' ← מנוחה 45 שנ' ← תרגיל ב' ← מנוחה 45 שנ'. השריר מרוויח 120 שנ' מנוחה מלאה, והזמן הכללי נחתך ב-50%.",
        "<strong>איחוד סטים כפולים מול בלוק הזרועות:</strong> החל משבוע 10, כשבלוק הזרועות נכנס לתוקף, צמצם ל-2 סטים בטבלה הראשית בתרגילי Lateral Raise ו-Triceps Extension כדי למנוע עומס נפחי כפול.",
        "<strong>מנוחה מוצלבת בתרגילים חד-צדדיים:</strong> בתרגילי Single-Arm / Single-Leg, בצע צד ימין ← מנוחה 45 שנ' ← צד שמאל ← מנוחה 45 שנ' (מעניק 105 שנ' מנוחה לצד ימין ללא זמן מת).",
        "<strong>שילוב מיקרו-מוביליות בזמני מנוחה:</strong> בצע את ה-Dead Hang ומתיחת החזה בזמן המנוחה בין סטי הליבה/הרגליים כדי לסיים את האימון מיד ולחסוך 5 דקות בסוף."
      ],
      equipment_title: "🔧 ציוד נדרש ושימוש קבוע",
      equipment_list: [
        "משקולות מודולריות: 8 פלטות × 3 ק\"ג (24 ק\"ג סה\"כ) + 2 ידיות (3 / 6 / 9 / 12 ק\"ג ליד, עד 24 ק\"ג בידית אחת)",
        "מוט מתח (Pull-Up, Chin-Up, Dead Hang, Towel Hang)",
        "Push-up Bars (כל תרגילי הדחיפה: Push-Up, Deficit, Pike, L-sit — אין כפות ידיים על הרצפה)",
        "TRX (Face Pull, Y-T-W בזוויות קבועות)",
        "גומיות התנגדות: 30 ק\"ג (Pull-Apart, Pallof), 40 ק\"ג (Pallof מתקדם)",
        "כיסא / ספסל יציב (BSS, Feet-Elevated Push-Up, Pike Hold)",
        "הליכון (Zone 2: שיפוע 4% ב-5.5 קמ\"ש; VO2 Max 4×4: שיפוע 3%–6% ב-6.5 קמ\"ש)",
        "וסט / תיק משוקלל (+5 ק\"ג לתרגילים המסומנים בלבד)"
      ],
      weekly_structure_title: "⚙️ מבנה שבועי קבוע (7 ימים)",
      col_day: "יום",
      col_type: "סוג אימון",
      col_intensity: "עצימות / דגשים",
      days_table: [
        { day: "יום 1", type: "🦵 רגליים + ליבה + אחיזה/נשיאה", focus: "50 דק' — RPE 7–9 — RDL, BSS, Hip Thrust, Calf Raise, Suitcase Carry, Dead Bug" },
        { day: "יום 2", type: "🫀 Zone 2 Cardio + מוביליות יומית", focus: "50 דק' — 45 דק' הליכה בשיפוע 4% (5.5 קמ\"ש, דופק Zone 2) + 5 דק' מיקרו-מוביליות" },
        { day: "יום 3", type: "💥 דחיפה + כתפיים + טריספס + Handstand", focus: "55 דק' — RPE 7–9 — עמידת ידיים, Floor Press, Push-up, OHP, Lateral Raise + בלוק זרועות (משבוע 10)" },
        { day: "יום 4", type: "🌿 התאוששות פעילה + מוביליות עמוקה", focus: "30 דק' — 25 דק' הליכון 0% (4.5 קמ\"ש) + 10 דק' מאקרו-מוביליות" },
        { day: "יום 5", type: "🧲 משיכה + גב + ביספס + אחיזה + ליבה", focus: "55 דק' — RPE 7–9 — מתח, Chin-up, One-Arm Row, TRX Face Pull, Curls, Towel Hang + בלוק זרועות (משבוע 10)" },
        { day: "יום 6", type: "🔴 VO2 Max 4×4 Cardio", focus: "35 דק' — פרוטוקול נורבגי: 10 דק' חימום, 4×(4 דק' מאמץ 6.5 קמ\"ש בשיפוע השלב / 3 דק' מנוחה), 5 דק' שחרור" },
        { day: "יום 7", type: "😴 מנוחה מלאה", focus: "התאוששות מלאה, תזונה ושינה" }
      ],
      arm_block_title: "💪 בלוק זרועות v5 (נספח ב' — התקדמות כפולה — משבוע 10)",
      arm_block_desc: "מתבצע בסוף יום 3 (Lateral + Triceps) ויום 5 (Curl) החל משבוע 10. 2 סטים כל תרגיל, מנוחה 60 שנ'. השלמת הכל בטמפו → עולים שלב אחד בסולם באימון הבא. עצירה מכנית = הסט נגמר.",
      dictionary_title: "📚 מילון תרגילים",
      dictionary_subtitle: "פירוט כל התרגילים המופיעים בתוכנית.",
      full_plan_title: "📅 פירוט התוכנית המלאה - 78 שבועות",
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
      title: "FitUp Pro v15.6 Lean — دليل برنامج التدريب 78 أسبوعًا",
      subtitle: "بروتوكول \"صفر قرارات\" بنظام 3 أزرار + الراحة الديناميكية — 546 يوماً",
      overview_title: "📖 المواصفات والشفافية — الإصدار v15.6 Lean",
      overview_desc: "تم تصميم هذا البرنامج لـ <strong>78 أسبوعًا (546 يومًا)</strong> وفق بروتوكول <strong>v15.6 Lean</strong> ومناسب لعمر 42 مع حماية أسفل الظهر. يعتمد على <strong>التحميل الزائد التدريجي (Progressive Overload)</strong>.",
      zero_decisions_title: "🎯 فلسفة \"صفر قرارات\" ونظام الأزرار الثلاثة",
      zero_decisions_desc: "يلغي البرنامج التخمين كلياً عبر اختيار واحدة من 3 نتائج محددة للمجموعة:",
      mental_load: "<strong>صفر قرارات وتقييم 3 أزرار:</strong> الأوزان والمجموعات والتكرارات محددة مسبقاً. عند نهاية المجموعة تختار: 🚀 <strong>أعلى من الهدف</strong>, ✅ <strong>ضمن الهدف</strong>, أو ⚠️ <strong>فشل / توقف ميكانيكي</strong> (يزيد الراحة تلقائياً +30 ثانية).",
      strength_cardio: "<strong>الهيكل الأسبوعي (7 أيام):</strong> اليوم 1 (الأرجل+الظهر/الكتف), اليوم 2 (Zone 2+مرونة), اليوم 3 (الدفع+المهارة+بلوك الذراعين), اليوم 4 (التعافي النشط), اليوم 5 (السحب+القبضة+بلوك الذراعين), اليوم 6 (VO2 Max 4x4), اليوم 7 (راحة كاملة).",
      deload_cycles: "<strong>التعافي العلمي (أسابيع Deload):</strong> أسابيع تعافي محددة (الأسابيع 8, 16, 24, 32, 40, 48, 56, 61, 65, 69, 73) يقل فيها الحجم إلى مجموعتين (~60% وزن).",
      time_efficiency_title: "⏱️ بروتوكول تحسين الوقت والمجموعات الفائقة (45-50 دقيقة)",
      time_efficiency_list: [
        "<strong>المجموعات الفائقة (Antagonistic Supersets):</strong> في تمارين العزل (مثل Lateral Raise + Triceps Ext)، قم بالتمرين أ ← راحة 45 ثانية ← التمرين ب ← راحة 45 ثانية. تحصل العضلة على 120 ثانية راحة كاملة.",
        "<strong>دمج مجموعات الذراعين:</strong> بدءًا من الأسبوع 10، قلل مجموعات العزل في الجدول الرئيسي إلى مجموعتين نظرًا لوجود بلوك الذراعين.",
        "<strong>الراحة المتقاطعة للتمارين الأحادية:</strong> في التمارين الأحادية، استرح 45 ثانية بين الجانبين الأيمن والأيسر.",
        "<strong>دمج التمدد الخفيف أثناء الراحة:</strong> قم بتمارين التعليق والتمدد خلال فترات الراحة لتوفير 5 دقائق."
      ],
      equipment_title: "🔧 المعدات المطلوبة",
      equipment_list: [
        "أثقال يدوية قابلة للتعديل: 8 أقراص × 3 كغم (24 كغم إجمالي) + مقبضان (3 / 6 / 9 / 12 كغم لكل يد، وحتى 24 كغم بمقبض واحد)",
        "عقلة (Pull-Up, Chin-Up, Dead Hang, Towel Hang)",
        "مقابض ضغط / Parallettes (جميع تمارين الضغط)",
        "حبال TRX (Face Pull, Y-T-W)",
        "أربطة مقاومة: 30 كغم (Pull-Apart, Pallof)، 40 كغم (Pallof متتقدم)",
        "كرسي / مقعد ثابت",
        "جهاز مشي (Zone 2: ميل 4% بسرعة 5.5 كم/س; VO2 Max 4x4: ميل 3-6% بسرعة 6.5 كم/س)",
        "سترة ثقيلة (+5 كغم)"
      ],
      weekly_structure_title: "⚙️ الهيكل الأسبوعي (7 أيام)",
      col_day: "اليوم",
      col_type: "نوع التمرين",
      col_intensity: "الشدة / التركيز",
      days_table: [
        { day: "اليوم 1", type: "Legs + Core + Grip", focus: "50 دقيقة — RPE 7–9 — RDL, BSS, Hip Thrust, Calf Raise, Suitcase Carry, Core" },
        { day: "اليوم 2", type: "Zone 2 Cardio + المرونة اليومية", focus: "50 دقيقة — 45 دقيقة مشي مائل (4%, 5.5 كم/س) + 5 دقائق مرونة خفيفة" },
        { day: "اليوم 3", type: "Push + Shoulders + Triceps", focus: "55 دقيقة — RPE 7–9 — الوقوف على اليدين, Floor Press, Push-up, OHP, Lateral Raise + بلوك الذراعين (من الأسبوع 10)" },
        { day: "اليوم 4", type: "Active Recovery + المرونة العملاقة", focus: "30 دقيقة — 25 دقيقة مشي (0%, 4.5 كم/س) + 10 دقائق تمارين مرونة عميقة" },
        { day: "اليوم 5", type: "Pull + Back + Biceps + Grip", focus: "55 دقيقة — RPE 7–9 — عقلة, Rows, TRX Face Pull, Curls, Towel Hang + بلوك الذراعين (من الأسبوع 10)" },
        { day: "اليوم 6", type: "VO2 Max 4×4 Cardio", focus: "35 دقيقة — بروتوكول نرويجي: 10 دقائق إحماء, 4×(4 دقائق جهد 6.5 كم/س / 3 دقائق راحة), 5 دقائق استرخاء" },
        { day: "اليوم 7", type: "Rest Day", focus: "راحة كاملة وتغذية ونوم" }
      ],
      arm_block_title: "💪 بلوك الذراعين v5 (التقدم المزدوج — من الأسبوع 10)",
      arm_block_desc: "يتم إجراؤه في نهاية اليوم 3 واليوم 5 من الأسبوع 10. مجموعتان لكل تمرين، راحة 60 ثانية. تقدم خطوة عند إكمال التكرارات.",
      dictionary_title: "📚 قاموس التمارين",
      dictionary_subtitle: "قائمة شاملة بجميع التمارين المذكورة في البرنامج.",
      full_plan_title: "📅 تفاصيل البرنامج الكامل - 78 أسبوعًا",
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
        <p><strong>${lang === 'he' ? 'יום 3 — סיום (2 סטים, מנוחה 60 שנ\')' : (lang === 'ar' ? 'اليوم 3 — الختام (مجموعتان)' : 'Day 3 Finisher (2 sets, 60s rest)')}:</strong></p>
        <table>
          <tr><th>${lang === 'he' ? 'שלב' : (lang === 'ar' ? 'الخطوة' : 'Step')}</th><th>DB Lateral Raise (2s descent)</th><th>DB OH Triceps Ext (2s descent)</th></tr>
          <tr><td>1</td><td>3 kg × 12</td><td>6 kg × 12</td></tr>
          <tr><td>2</td><td>3 kg × 15</td><td>6 kg × 15</td></tr>
          <tr><td>3</td><td>3 kg × 18</td><td>9 kg × 10</td></tr>
          <tr><td>4</td><td>3 kg × 20</td><td>9 kg × 12</td></tr>
          <tr><td>5</td><td>6 kg × 10</td><td>9 kg × 15</td></tr>
          <tr><td>6</td><td>6 kg × 12</td><td>12 kg × 10</td></tr>
          <tr><td>7</td><td>6 kg × 15</td><td>12 kg × 12</td></tr>
          <tr><td>8</td><td>9 kg × 10</td><td>15 kg × 10</td></tr>
          <tr><td>9</td><td>9 kg × 12</td><td>15 kg × 12</td></tr>
        </table>
        <p style="margin-top: 15px;"><strong>${lang === 'he' ? 'יום 5 — סיום (2 סטים, מנוחה 60 שנ\')' : (lang === 'ar' ? 'اليوم 5 — الختام (مجموعتان)' : 'Day 5 Finisher (2 sets, 60s rest)')}:</strong></p>
        <table>
          <tr><th>${lang === 'he' ? 'שלב' : (lang === 'ar' ? 'الخطوة' : 'Step')}</th><th>DB Curl (${lang === 'he' ? 'ליד' : (lang === 'ar' ? 'لكل يد' : 'each hand')})</th></tr>
          <tr><td>1</td><td>3 kg × 12</td></tr>
          <tr><td>2</td><td>3 kg × 15</td></tr>
          <tr><td>3</td><td>6 kg × 10</td></tr>
          <tr><td>4</td><td>6 kg × 12</td></tr>
          <tr><td>5</td><td>6 kg × 15</td></tr>
          <tr><td>6</td><td>9 kg × 10</td></tr>
          <tr><td>7</td><td>9 kg × 12</td></tr>
          <tr><td>8</td><td>12 kg × 10</td></tr>
        </table>
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
