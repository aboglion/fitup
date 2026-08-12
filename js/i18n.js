/**
 * Internationalization (i18n) Module
 * Handles English (Default), Hebrew, and Arabic translations, directions, and DOM updates.
 */
const I18n = (() => {
  // English is DEFAULT
  let currentLang = 'en';

  const CONFIG = {
    en: { dir: 'ltr', name: 'English', flag: '🇺🇸', font: "'Inter', sans-serif" },
    he: { dir: 'rtl', name: 'עברית', flag: '🇮🇱', font: "'Heebo', sans-serif" },
    ar: { dir: 'rtl', name: 'العربية', flag: '🇸🇦', font: "'Cairo', 'Tajawal', sans-serif" }
  };

  const TRANSLATIONS = {
    en: {
      // App & Nav
      app_title: "FitUp - Workout & AI Nutrition Tracking",
      app_subtitle: "Professional AI Workout & Nutrition Tracker",
      nav_today: "Today",
      nav_nutrition: "Nutrition & AI",
      nav_exercises: "Exercises",
      nav_stats: "Progress",
      nav_settings: "Settings",
      daily_progress: "Daily Progress",
      
      // Today Page
      back_to_today: "Back to Today's Workout",
      day_label: "Day",
      notes: "Notes",
      dates: "Dates",
      swap_workout: "Swap",
      actual_rpe: "Actual RPE",
      body_weight: "Body Weight (kg)",
      how_did_it_feel: "How did it feel? What was challenging?",
      auto_save_notice: "✨ Data saves automatically as you type",
      rest_day: "Rest Day",
      active_recovery: "Active Recovery",
      zone2_cardio: "Zone 2 Cardio",
      vo2max_cardio: "VO2 Max 4x4",
      rest_timer: "Rest Timer",
      finish_workout: "Finish Workout",
      workout_completed: "Workout Completed! 🎉",
      equipment_needed: "Equipment Needed",

      // Days of week
      sunday: "Sunday",
      monday: "Monday",
      tuesday: "Tuesday",
      wednesday: "Wednesday",
      thursday: "Thursday",
      friday: "Friday",
      saturday: "Saturday",

      // Nutrition & AI Page
      nutrition_ai_title: "Nutrition Log & AI",
      ai_settings: "AI Settings",
      gemini_setup_title: "Gemini AI Setup (Food Scanner)",
      gemini_setup_desc: "Enter a free Gemini API key to scan food photos for automatic calories and protein calculations.",
      api_key_label: "API Key (Google Gemini)",
      ai_model_label: "AI Model",
      save_ai_scanner: "✨ Save & Enable AI Scanner",
      get_free_key_tip: "💡 Don't have a key? Get one for free in a minute at",
      add_meal_ai: "📸 Add Meal with AI Scanner",
      snap_food: "Snap Food",
      upload_image: "Upload Photo",
      manual_meal_btn: "✏️ Add Meal Manually (No Photo)",
      meals_for_analysis: "✨ Food Analysis Preview",
      additional_notes_opt: "Additional Notes / Description (Optional):",
      food_notes_placeholder: "e.g. 200g chicken breast, half plate rice",
      analyze_ai_btn: "🤖 Analyze Calories & Protein with AI",
      daily_calorie_balance: "📊 Daily Calorie & Protein Balance",
      calories: "Calories",
      protein: "Protein",
      carbs: "Carbs",
      fat: "Fat",
      logged_meals_today: "🍽️ Today's Logged Meals",
      meals_count_zero: "0 meals",
      consumed_protein_powder: "🥛 Consumed {amount}g Protein Powder",
      delete_api_key_confirm: "Are you sure you want to delete the saved Gemini API key?",

      // Exercises Page
      exercise_list_title: "Exercise Directory",
      all_exercises: "All Exercises",
      search_exercise_placeholder: "Search exercise...",
      filter_all: "All",
      filter_chest: "Chest",
      filter_back: "Back",
      filter_legs: "Legs",
      filter_shoulders: "Shoulders",
      filter_arms: "Arms",
      filter_core: "Core",
      filter_cardio: "Cardio",
      resistance: "Resistance:",
      progression: "Progression:",
      watch_gif: "▶ Watch Animation",
      category: "Category",
      difficulty: "Difficulty",

      // Stats & Anatomy
      progress_title: "Progress & Stats",
      muscle_map_title: "Muscle Progression Map",
      workout_consistency: "Workout Consistency",
      total_workouts: "Total Workouts",
      completed_days: "Completed Days",
      streak: "Current Streak",
      body_weight_tracker: "Body Weight Tracker",
      
      // Settings Page
      settings_title: "Settings",
      language_selection: "🌐 Language / اللغة / שפה",
      select_language_desc: "Choose application interface language",
      google_drive_sync: "☁️ Google Account & Drive Sync",
      google_drive_desc: "Save and automatically sync your training data in your personal Google Drive.",
      not_connected_google: "Not connected to Google Account",
      local_offline_only: "Local offline storage only",
      last_sync: "Last sync:",
      connect_google: "🔑 Sign in with Google",
      sync_now: "🔄 Sync Now with Google Drive",
      logout_google: "Sign out of Google",
      gemini_settings_card: "🤖 Gemini AI Settings",
      gemini_settings_desc: "Configure API key and preferred model for food analysis.",
      api_key_active: "API Key is Active & Configured",
      delete_key: "🗑️ Delete Key",
      save_ai_settings: "Save AI Settings",
      backup_restore: "💾 Backup & Restore (Local File)",
      backup_restore_desc: "Export all your data to a JSON file or restore from a backup.",
      export_data: "📤 Export Data",
      import_data: "📥 Import Data",
      program_guide_card: "📖 Full Program Guide",
      program_guide_desc: "Generate a detailed 78-week guide with program structure, exercises, and progression stages.",
      view_download_guide: "📄 View & Download Full Guide",
      reload_plan_card: "🔄 Reset & Reload Plan",
      reload_plan_desc: "Reload the training program from original source data.",
      reload_plan_btn: "🔄 Reload Training Plan",
      clear_all_card: "🗑️ Clear All Data",
      clear_all_desc: "Delete all tracking, notes, and plan data. Action is permanent!",
      clear_all_btn: "🗑️ Delete Everything",
      appearance_card: "🌓 Appearance & Theme",
      appearance_desc: "Toggle between light and dark mode.",
      toggle_theme_btn: "Toggle Theme",
      about_card: "ℹ️ About FitUp",
      about_desc: "FitUp Pro v4.0 - AI Workout & Nutrition Tracker",
      about_sub: "78-Week Training Program • 546 Days",
      about_note: "All data stored locally in your browser and personal Google Drive.",

      // Login Modal
      welcome_title: "Welcome to FitUp!",
      welcome_sub: "Sync your workout and nutrition data safely to your Google Drive",
      offline_continue: "I am a new user / Continue offline only",

      // Toasts & Alerts
      saved_successfully: "Saved successfully! ",
      error_occurred: "An error occurred: ",
      language_changed: "Language set to English 🇺🇸",
      guide_generated: "Program guide generated and downloaded! 📄"
    },
    he: {
      // App & Nav
      app_title: "FitUp - מעקב אימונים ותזונה",
      app_subtitle: "אפליקציית מעקב אימונים ותזונה מקצועית ע״י AI",
      nav_today: "היום",
      nav_nutrition: "תזונה & AI",
      nav_exercises: "תרגילים",
      nav_stats: "התקדמות",
      nav_settings: "הגדרות",
      daily_progress: "התקדמות יומית",

      // Today Page
      back_to_today: "חזור לאימון של היום",
      day_label: "יום",
      notes: "הערות",
      dates: "תאריכים",
      swap_workout: "החלפה",
      actual_rpe: "RPE בפועל",
      body_weight: "משקל גוף (ק\"ג)",
      how_did_it_feel: "איך הרגשת? מה היה קשה?",
      auto_save_notice: "✨ הנתונים נשמרים אוטומטית בעת הקלדה",
      rest_day: "יום מנוחה",
      active_recovery: "התאוששות פעילה",
      zone2_cardio: "Zone 2 Cardio",
      vo2max_cardio: "VO2 Max 4x4",
      rest_timer: "טיימר מנוחה",
      finish_workout: "סיום אימון",
      workout_completed: "האימון הושלם בהצלחה! 🎉",
      equipment_needed: "ציוד נדרש",

      // Days of week
      sunday: "ראשון",
      monday: "שני",
      tuesday: "שלישי",
      wednesday: "רביעי",
      thursday: "חמישי",
      friday: "שישי",
      saturday: "שבת",

      // Nutrition & AI Page
      nutrition_ai_title: "יומן תזונה ו-AI",
      ai_settings: "הגדרות AI",
      gemini_setup_title: "הגדרת Gemini AI (סורק אוכל)",
      gemini_setup_desc: "כדי לצלם אוכל ולקבל חישוב קלוריות וחלבון אוטומטי, הזן מפתח Gemini API חינמי",
      api_key_label: "מפתח API (Google Gemini)",
      ai_model_label: "מודל בינה מלאכותית (AI Model)",
      save_ai_scanner: "✨ שמור והפעל סורק AI",
      get_free_key_tip: "💡 אין לך מפתח? ניתן להנפיק מפתח בחינם דרך",
      add_meal_ai: "📸 הוספת ארוחה מבוססת AI",
      snap_food: "צלם אוכל",
      upload_image: "העלה תמונה",
      manual_meal_btn: "✏️ הוספת ארוחה ידנית (ללא תמונה)",
      meals_for_analysis: "✨ מנות לניתוח AI",
      additional_notes_opt: "הערה/תיאור נוסף (אופציונלי):",
      food_notes_placeholder: "למשל: 200ג חזה עוף, חצי צלחת אורז",
      analyze_ai_btn: "🤖 נתח קלוריות וחלבון עם AI",
      daily_calorie_balance: "📊 מאזן קלורי ותזונה להיום",
      calories: "קלוריות",
      protein: "חלבון",
      carbs: "פחמימות",
      fat: "שומנים",
      logged_meals_today: "🍽️ פירוט ארוחות שנרשמו היום",
      meals_count_zero: "0 ארוחות",
      consumed_protein_powder: "🥛 צרכתי {amount}ג חלבון אבקתי",
      delete_api_key_confirm: "האם למחוק את מפתח ה-Gemini API השמור?",

      // Exercises Page
      exercise_list_title: "רשימת תרגילים",
      all_exercises: "לכל התרגילים",
      search_exercise_placeholder: "חפש תרגיל...",
      filter_all: "הכל",
      filter_chest: "חזה",
      filter_back: "גב",
      filter_legs: "רגליים",
      filter_shoulders: "כתפיים",
      filter_arms: "זרועות",
      filter_core: "ליבה",
      filter_cardio: "אירובי",
      resistance: "התנגדות:",
      progression: "התקדמות:",
      watch_gif: "▶ צפה ב-GIF",
      category: "קטגוריה",
      difficulty: "רמת קושי",

      // Stats & Anatomy
      progress_title: "התקדמות",
      muscle_map_title: "מפת התקדמות שרירים",
      workout_consistency: "עקביות אימונים",
      total_workouts: "סך הכל אימונים",
      completed_days: "ימים שהושלמו",
      streak: "רצף נוכחי",
      body_weight_tracker: "מעקב משקל גוף",

      // Settings Page
      settings_title: "הגדרות",
      language_selection: "🌐 Language / שפה / اللغة",
      select_language_desc: "בחר שפת ממשק לאפליקציה",
      google_drive_sync: "☁️ חיבור לחשבון Google & סנכרון דרייב",
      google_drive_desc: "שמור וסנכרן את הנתונים שלך אוטומטית ב-Google Drive האישי שלך.",
      not_connected_google: "לא מחובר לחשבון גוגל",
      local_offline_only: "עבודת אופליין מקומית בלבד",
      last_sync: "סנכרון אחרון:",
      connect_google: "🔑 התחבר עם חשבון גוגל",
      sync_now: "🔄 סנכרן עכשיו מול Google Drive",
      logout_google: "התנתק מגוגל",
      gemini_settings_card: "🤖 הגדרות מודל Gemini AI",
      gemini_settings_desc: "הגדר את מפתח ה-API והמודל המועדף לניתוח ארוחות אוכל",
      api_key_active: "מפתח API מוגדר ופעיל",
      delete_key: "🗑️ מחק מפתח",
      save_ai_settings: "שמור הגדרות AI",
      backup_restore: "💾 גיבוי ושחזור (קובץ מקומי)",
      backup_restore_desc: "ייצא את כל הנתונים שלך לקובץ, או שחזר מגיבוי קודם",
      export_data: "📤 ייצוא נתונים",
      import_data: "📥 ייבוא נתונים",
      program_guide_card: "📖 מדריך התוכנית המלא",
      program_guide_desc: "הפק מדריך מפורט של התוכנית השנתית, הכולל הסברים על מבנה התוכנית והתרגילים",
      view_download_guide: "📄 צפה והורד מדריך מלא",
      reload_plan_card: "🔄 איפוס תוכנית",
      reload_plan_desc: "טען מחדש את תוכנית האימונים מהנתונים המקוריים",
      reload_plan_btn: "🔄 טען תוכנית מחדש",
      clear_all_card: "🗑️ מחיקת כל הנתונים",
      clear_all_desc: "מחק את כל המידע כולל מעקב ותוכנית. פעולה זו בלתי הפיכה!",
      clear_all_btn: "🗑️ מחק הכל",
      appearance_card: "🌓 מראה ותצוגה",
      appearance_desc: "החלף בין מצב תצוגה בהיר לכהה",
      toggle_theme_btn: "החלף מצב תצוגה",
      about_card: "ℹ️ אודות",
      about_desc: "FitUp v4.0 Pro - אפליקציית מעקב אימונים ותזונה AI",
      about_sub: "תוכנית 78 שבועות • 546 ימים",
      about_note: "כל הנתונים נשמרים מקומית בדפדפן ובדרייב האישי שלך",

      // Login Modal
      welcome_title: "ברוך הבא ל-FitUp!",
      welcome_sub: "סנכרן את נתוני האימונים והתזונה שלך בצורה בטוחה ישירות מול Google Drive",
      offline_continue: "אני משתמש חדש / המשך מקומית באופליין בלבד",

      // Toasts & Alerts
      saved_successfully: "הנתונים שנשמרו בהצלחה! ",
      error_occurred: "אירעה שגיאה: ",
      language_changed: "השפה שונתה בהצלחה לעברית 🇮🇱",
      guide_generated: "המדריך נוצר והורד בהצלחה! 📄"
    },
    ar: {
      // App & Nav
      app_title: "FitUp - تتبع التمارين والتغذية بالذكاء الاصطناعي",
      app_subtitle: "تطبيق متقدم لتتبع التمارين وتحليل الوجبات بالذكاء الاصطناعي",
      nav_today: "اليوم",
      nav_nutrition: "التغذية والذكاء الاصطناعي",
      nav_exercises: "التمارين",
      nav_stats: "التقدم",
      nav_settings: "الإعدادات",
      daily_progress: "التقدم اليومي",

      // Today Page
      back_to_today: "العودة إلى تمرين اليوم",
      day_label: "اليوم",
      notes: "ملاحظات",
      dates: "التواريخ",
      swap_workout: "تبديل",
      actual_rpe: "معدل الجهد (RPE)",
      body_weight: "وزن الجسم (كجم)",
      how_did_it_feel: "كيف كان شعورك؟ ما الذي كان صعباً؟",
      auto_save_notice: "✨ يتم حفظ البيانات تلقائياً أثناء الكتابة",
      rest_day: "يوم راحة",
      active_recovery: "تعافي نشط",
      zone2_cardio: "تمارين كارديو Zone 2",
      vo2max_cardio: "VO2 Max 4x4",
      rest_timer: "مؤقت الراحة",
      finish_workout: "إنهاء التمرين",
      workout_completed: "تم إكمال التمرين بنجاح! 🎉",
      equipment_needed: "المعدات المطلوبة",

      // Days of week
      sunday: "الأحد",
      monday: "الإثنين",
      tuesday: "الثلاثاء",
      wednesday: "الأربعاء",
      thursday: "الخميس",
      friday: "الجمعة",
      saturday: "السبت",

      // Nutrition & AI Page
      nutrition_ai_title: "سجل التغذية والذكاء الاصطناعي",
      ai_settings: "إعدادات الذكاء الاصطناعي",
      gemini_setup_title: "إعداد Gemini AI (ماسح الطعام)",
      gemini_setup_desc: "لتقاط صور الطعام وحساب السعرات والبروتين تلقائياً، أدخل مفتاح Gemini API المجاني",
      api_key_label: "مفتاح API (Google Gemini)",
      ai_model_label: "نموذج الذكاء الاصطناعي",
      save_ai_scanner: "✨ حفظ وتفعيل ماسح AI",
      get_free_key_tip: "💡 ليس لديك مفتاح؟ يمكنك الحصول على مفتاح مجاني خلال دقيقة عبر",
      add_meal_ai: "📸 إضافة وجبة بالذكاء الاصطناعي",
      snap_food: "التقط صورة",
      upload_image: "رفع صورة",
      manual_meal_btn: "✏️ إضافة وجبة يدوياً (بدون صورة)",
      meals_for_analysis: "✨ تحليل الوجبة",
      additional_notes_opt: "ملاحظات إضافية / الوصف (اختياري):",
      food_notes_placeholder: "مثال: 200 جرام صدر دجاج، نصف طبق أرز",
      analyze_ai_btn: "🤖 تحليل السعرات والبروتين بالذكاء الاصطناعي",
      daily_calorie_balance: "📊 التوازن اليومي للسعرات والبروتين",
      calories: "السعرات",
      protein: "البروتين",
      carbs: "الكربوهيدرات",
      fat: "الدهون",
      logged_meals_today: "🍽️ الوجبات المسجلة اليوم",
      meals_count_zero: "0 وجبات",
      consumed_protein_powder: "🥛 استهلكت {amount}ج مسحوق بروتين",
      delete_api_key_confirm: "هل أنت تأكد من حذف مفتاح Gemini API؟",

      // Exercises Page
      exercise_list_title: "دليل التمارين",
      all_exercises: "جميع التمارين",
      search_exercise_placeholder: "البحث عن تمرين...",
      filter_all: "الكل",
      filter_chest: "الصدر",
      filter_back: "الظهر",
      filter_legs: "الأرجل",
      filter_shoulders: "الكتفين",
      filter_arms: "الذراعين",
      filter_core: "العضلات الأساسية",
      filter_cardio: "كارديو",
      resistance: "المقاومة:",
      progression: "التطور:",
      watch_gif: "▶ مشاهدة الحركة",
      category: "الفئة",
      difficulty: "مستوى الصعوبة",

      // Stats & Anatomy
      progress_title: "التقدم والإحصائيات",
      muscle_map_title: "خريطة تطور العضلات",
      workout_consistency: "الاستمرارية في التمارين",
      total_workouts: "إجمالي التمارين",
      completed_days: "الأيام المكتملة",
      streak: "السلسلة الحالية",
      body_weight_tracker: "تتبع وزن الجسم",

      // Settings Page
      settings_title: "الإعدادات",
      language_selection: "🌐 Language / اللغة / שפה",
      select_language_desc: "اختر لغة واجهة التطبيق",
      google_drive_sync: "☁️ ربط حساب Google والمزامنة",
      google_drive_desc: "احفظ وقم بمزامنة بياناتك تلقائياً في حساب Google Drive الخاص بك.",
      not_connected_google: "غير متصل بحساب Google",
      local_offline_only: "تخزين محلي فقط بدون اتصال",
      last_sync: "آخر مزامنة:",
      connect_google: "🔑 تسجيل الدخول باستخدام Google",
      sync_now: "🔄 المزامنة الآن مع Google Drive",
      logout_google: "تسجيل الخروج من Google",
      gemini_settings_card: "🤖 إعدادات نموذج Gemini AI",
      gemini_settings_desc: "قم بإعداد مفتاح API والنموذج المفضل لتحليل الوجبات",
      api_key_active: "مفتاح API مفعل ونشط",
      delete_key: "🗑️ حذف المفتاح",
      save_ai_settings: "حفظ إعدادات الذكاء الاصطناعي",
      backup_restore: "💾 النسخ الاحتياطي والاستعادة",
      backup_restore_desc: "تصدير جميع بياناتك إلى ملف JSON أو الاستعادة من نسخة سابقة",
      export_data: "📤 تصدير البيانات",
      import_data: "📥 استيراد البيانات",
      program_guide_card: "📖 دليل البرنامج الكامل",
      program_guide_desc: "إنشاء دليل مفصل لبرنامج الـ 78 أسبوعاً يتضمن شرح الهيكل والتمارين",
      view_download_guide: "📄 عرض وتحميل الدليل الكامل",
      reload_plan_card: "🔄 إعادة تحميل البرنامج",
      reload_plan_desc: "إعادة تحميل خطة التدريب من المصدر الأصلي",
      reload_plan_btn: "🔄 إعادة تحميل الخطة",
      clear_all_card: "🗑️ حذف جميع البيانات",
      clear_all_desc: "حذف جميع بيانات التتبع والبرنامج. هذا الإجراء دائم ولا يمكن التراجع عنه!",
      clear_all_btn: "🗑️ حذف كل شيء",
      appearance_card: "🌓 المظهر والشاشة",
      appearance_desc: "التبديل بين الوضع الفاتح والداكن",
      toggle_theme_btn: "تغيير المظهر",
      about_card: "ℹ️ حول التطبيق",
      about_desc: "FitUp v4.0 Pro - تطبيق تتبع التمارين والتغذية بالذكاء الاصطناعي",
      about_sub: "برنامج 78 أسبوعاً • 546 يوماً",
      about_note: "يتم حفظ جميع البيانات محلياً في متصفحك وحساب Google Drive الخاص بك",

      // Login Modal
      welcome_title: "مرحباً بك في FitUp!",
      welcome_sub: "قم بمزامنة بيانات التمارين والتغذية بأمان مباشرة إلى Google Drive",
      offline_continue: "أنا مستخدم جديد / المتابعة محلياً بدون اتصال",

      // Toasts & Alerts
      saved_successfully: "تم الحفظ بنجاح! ",
      error_occurred: "حدث خطأ: ",
      language_changed: "تم تغيير اللغة إلى العربية 🇸🇦",
      guide_generated: "تم إنشاء الدليل وتحميله بنجاح! 📄"
    }
  };

  /**
   * Initialize language from database or default to 'en'
   */
  async function init() {
    let saved = null;
    if (window.DB && window.DB.getSetting) {
      try {
        saved = await DB.getSetting('language');
      } catch (e) {
        console.warn('I18n: Failed to fetch language from DB, defaulting to en', e);
      }
    }
    
    currentLang = (saved && CONFIG[saved]) ? saved : 'en';
    applyToDOM();
  }

  /**
   * Set active language and save choice
   */
  async function setLanguage(lang) {
    if (!CONFIG[lang]) return;
    currentLang = lang;
    if (window.DB && window.DB.setSetting) {
      await DB.setSetting('language', lang);
    }
    applyToDOM();

    if (window.UI && window.UI.toast) {
      UI.toast(t('language_changed'), 'success');
    }

    // Re-render current active page if available
    if (window.App && window.App.navigateTo) {
      const hashPage = window.location.hash.replace('#', '') || 'today';
      window.App.navigateTo(hashPage, false);
    }
  }

  /**
   * Get translation for a key with optional string interpolation
   * e.g. t('consumed_protein_powder', 'Consumed protein', { amount: 30 })
   */
  function t(key, fallback = '', params = null) {
    let text = TRANSLATIONS[currentLang]?.[key] || TRANSLATIONS['en']?.[key] || fallback || key;
    if (params && typeof params === 'object') {
      Object.keys(params).forEach(pKey => {
        text = text.replace(new RegExp(`\\{${pKey}\\}`, 'g'), params[pKey]);
      });
    }
    return text;
  }

  /**
   * Update html dir, lang attributes, and all elements with [data-i18n]
   */
  function applyToDOM() {
    const config = CONFIG[currentLang] || CONFIG['en'];
    document.documentElement.lang = currentLang;
    document.documentElement.dir = config.dir;
    
    // Apply font stack according to language direction/family
    document.documentElement.style.setProperty('--font-family-active', config.font);

    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (key) {
        const translation = t(key);
        if (el.tagName === 'INPUT' && (el.type === 'text' || el.type === 'search')) {
          el.placeholder = translation;
        } else {
          el.textContent = translation;
        }
      }
    });

    // Update language select dropdowns if present
    const langSelects = document.querySelectorAll('.js-language-select');
    langSelects.forEach(select => {
      select.value = currentLang;
    });
  }

  return {
    init,
    setLanguage,
    t,
    getLang: () => currentLang,
    getDir: () => (CONFIG[currentLang] ? CONFIG[currentLang].dir : 'ltr'),
    getConfig: () => CONFIG[currentLang] || CONFIG['en'],
    AVAILABLE_LANGUAGES: CONFIG
  };
})();

window.I18n = I18n;
