// Chrome Built-in AI Module (Gemini Nano via window.ai)
const AIModule = {
  session: null,
  available: false,

  async init() {
    try {
      if (typeof window !== 'undefined' && window.ai && window.ai.languageModel) {
        const caps = await window.ai.languageModel.capabilities();
        if (caps.available === 'readily' || caps.available === 'after-download') {
          this.available = true;
          this.session = await window.ai.languageModel.create({
            systemPrompt: 'אתה מאמן כושר מנוסה שמדבר בעברית. אתה נותן משפטי מוטיבציה קצרים, תובנות אימון, וסיכומים מקצועיים. ענה תמיד בעברית, בקצרה ובאנרגיה חיובית. השתמש באימוג\'ים.'
          });
          console.log('✅ Chrome AI (Gemini Nano) is available');
          return true;
        }
      }
    } catch(e) { console.log('Chrome AI not available:', e.message); }
    this.available = false;
    return false;
  },

  // Motivational messages for home screen & during workout
  async getMotivation(context = 'general') {
    const fallbacks = {
      general: [
        "💪 כל סט מקרב אותך ליעד! תמשיך ככה!",
        "🔥 הגוף שלך יכול יותר ממה שהמוח חושב!",
        "⭐ הצלחה נבנית מהתמדה – אתה על הדרך הנכונה!",
        "🎯 אל תוותר – הסט האחרון הוא הסט שעושה את ההבדל!",
        "🏆 מי שמתאמן היום, מרגיש את זה מחר!",
        "💥 כל אימון שאתה עושה הוא השקעה בגרסה הטובה ביותר שלך!",
        "🚀 הצעד הראשון כבר מאחוריך – עכשיו בוא נעוף!"
      ],
      rest: [
        "⏱️ נשימה עמוקה... הסט הבא שלך!",
        "🧘 מנוחה חכמה = ביצועים חזקים יותר",
        "💧 שתה מים, נשום עמוק, וקדימה!",
        "🔄 המנוחה הזו בונה את הכוח לסט הבא",
        "⚡ טען מצברים – הגוף שלך מתכונן לפיצוץ!"
      ],
      setComplete: [
        "✅ סט מושלם! יאללה לבא!",
        "🎯 ביצוע מעולה! ממשיכים!",
        "💪 חזק! עוד סט קרוב יותר למטרה!",
        "🔥 זה בוער! ממשיכים באותה אנרגיה!",
        "⭐ טכניקה מושלמת – ככה בדיוק!"
      ],
      workoutStart: [
        "🏁 יאללה! בוא נעשה אימון מטורף!",
        "⚡ הגוף מוכן, הראש מוכן – קדימה!",
        "🔥 היום אנחנו מרימים רמה!",
        "💪 כל רגע באימון = השקעה בעתיד שלך!"
      ]
    };

    const pool = fallbacks[context] || fallbacks.general;
    const fallback = pool[Math.floor(Math.random() * pool.length)];

    if (!this.available || !this.session) return fallback;

    try {
      const prompts = {
        general: 'תן משפט מוטיבציה קצר ואנרגטי לאימון כושר, עד 15 מילים, בעברית, עם אימוג\'י',
        rest: 'תן משפט מעודד קצר למנוחה בין סטים באימון, עד 12 מילים, בעברית, עם אימוג\'י',
        setComplete: 'תן משפט חיזוק קצר אחרי סיום סט מוצלח באימון, עד 12 מילים, בעברית, עם אימוג\'י',
        workoutStart: 'תן משפט מוטיבציה קצר לתחילת אימון, עד 12 מילים, בעברית, עם אימוג\'י'
      };
      const result = await this.session.prompt(prompts[context] || prompts.general);
      return result?.trim() || fallback;
    } catch(e) {
      return fallback;
    }
  },

  // Smart workout summary with insights
  async getWorkoutSummary(workoutLog) {
    const totalSets = workoutLog.reduce((sum, b) => sum + (b.setsCompleted || 0), 0);
    const totalExercises = workoutLog.length;
    const totalTime = workoutLog.reduce((sum, b) => sum + (b.duration || 0), 0);
    const promotions = workoutLog.filter(b => b.promoted).length;
    const avgRPE = workoutLog.reduce((sum, b) => sum + (b.rpe || 0), 0) / (totalExercises || 1);
    const personalRecords = workoutLog.filter(b => b.isPersonalRecord).length;

    const timeStr = totalTime > 60 
      ? `${Math.floor(totalTime/60)} דקות` 
      : `${totalTime} שניות`;

    const basicSummary = {
      headline: `🏋️ ${totalExercises} תרגילים | ${totalSets} סטים | ${timeStr}`,
      stats: {
        exercises: totalExercises,
        sets: totalSets,
        time: timeStr,
        promotions,
        personalRecords,
        avgRPE: Math.round(avgRPE * 10) / 10
      },
      insight: '',
      tip: '',
      reinforcement: '',
      grade: ''
    };

    // Generate grade
    if (promotions >= 2) basicSummary.grade = '🌟 אימון יוצא מן הכלל!';
    else if (promotions === 1) basicSummary.grade = '⭐ אימון מצוין!';
    else if (totalSets >= 10) basicSummary.grade = '💪 אימון חזק!';
    else basicSummary.grade = '✅ אימון טוב!';

    // Generate insights
    if (promotions > 0) {
      basicSummary.insight = `🎉 עלית ${promotions} רמ${promotions > 1 ? 'ות' : 'ה'}! ההתקדמות שלך מרשימה!`;
    } else if (avgRPE >= 8) {
      basicSummary.insight = '💪 עבדת קשה היום! הגוף שלך יודע להודות.';
    } else {
      basicSummary.insight = '📈 המשך להתמיד – ההתקדמות בדרך!';
    }

    // Generate tip
    if (avgRPE >= 9) {
      basicSummary.tip = '⚠️ שים לב לא להגזים – מנוחה היא חלק מהאימון.';
    } else if (promotions > 0) {
      basicSummary.tip = '🎯 עכשיו תתמקד בשליטה ברמה החדשה לפני שתעלה שוב.';
    } else {
      basicSummary.tip = '💡 נסה להוסיף חזרה אחת בכל סט בפעם הבאה.';
    }

    // Reinforcement message
    const reinforcements = [
      '🏆 כל אימון שאתה מסיים הוא ניצחון!',
      '🌟 הגוף שלך מתחזק עם כל יום שעובר!',
      '💎 ההתמדה שלך היא הנכס הכי חשוב!',
      '🔥 אתה בונה הרגלים של אלוף!',
      '🚀 ככה בדיוק מגיעים לתוצאות!'
    ];
    basicSummary.reinforcement = reinforcements[Math.floor(Math.random() * reinforcements.length)];

    // If AI available, enhance the summary
    if (this.available && this.session) {
      try {
        const prompt = `נתוני אימון כושר שהושלם עכשיו:
- ${totalExercises} תרגילים, ${totalSets} סטים, ${timeStr}
- ${promotions} קידומי רמה
- מאמץ ממוצע: ${Math.round(avgRPE)}/10
${personalRecords > 0 ? `- ${personalRecords} שיאים אישיים!` : ''}

תן בדיוק 3 שורות בעברית:
1. תובנה: [תובנה חכמה קצרה על הביצועים]
2. טיפ: [טיפ מקצועי אחד]
3. חיזוק: [משפט חיזוק אישי חזק]`;
        
        const result = await this.session.prompt(prompt);
        const lines = result.split('\n').filter(l => l.trim());
        
        const insightLine = lines.find(l => l.includes('תובנה'));
        const tipLine = lines.find(l => l.includes('טיפ'));
        const reinforceLine = lines.find(l => l.includes('חיזוק'));
        
        if (insightLine) basicSummary.insight = insightLine.replace(/^\d+\.\s*תובנה:\s*/i, '').trim();
        if (tipLine) basicSummary.tip = tipLine.replace(/^\d+\.\s*טיפ:\s*/i, '').trim();
        if (reinforceLine) basicSummary.reinforcement = reinforceLine.replace(/^\d+\.\s*חיזוק:\s*/i, '').trim();
      } catch(e) { /* fallback already set */ }
    }

    return basicSummary;
  },

  // Analyze exercise progress over time
  async analyzeProgress(exerciseName, history) {
    if (!history || history.length < 2) {
      return {
        trend: 'neutral',
        message: '📊 צריך לפחות 2 אימונים כדי לנתח מגמה',
        recommendation: 'המשך להתאמן ולתעד – הנתונים ייצברו!'
      };
    }

    const recentReps = history.slice(-3).map(h => h.totalReps || 0);
    const trend = recentReps[recentReps.length - 1] > recentReps[0] ? 'up' : 
                  recentReps[recentReps.length - 1] < recentReps[0] ? 'down' : 'stable';

    const basic = {
      trend,
      message: trend === 'up' ? `📈 מגמת עלייה ב-${exerciseName}! מעולה!` :
               trend === 'down' ? `📉 ירידה קלה – בדוק מנוחה ותזונה` :
               `📊 ביצועים יציבים – זה סימן טוב!`,
      recommendation: trend === 'up' ? 'שקול לעלות רמה אם השלמת את תנאי המעבר' :
                       trend === 'down' ? 'ודא מנוחה מספקת בין אימונים ושינה איכותית' :
                       'נסה להוסיף חזרה אחת בסט הבא'
    };

    if (this.available && this.session) {
      try {
        const prompt = `נתח בקצרה (2 שורות בעברית) התקדמות בתרגיל "${exerciseName}". נתונים אחרונים: ${JSON.stringify(history.slice(-5))}. 
שורה 1: מגמה: [תיאור המגמה]
שורה 2: המלצה: [המלצה אחת]`;
        const result = await this.session.prompt(prompt);
        const lines = result.split('\n').filter(l => l.trim());
        if (lines[0]) basic.message = lines[0].replace(/^מגמה:\s*/i, '').trim();
        if (lines[1]) basic.recommendation = lines[1].replace(/^המלצה:\s*/i, '').trim();
      } catch(e) {}
    }

    return basic;
  },

  // Get exercise form tips
  async getFormTip(exerciseName) {
    const tips = {
      'Push-Up': '💡 שמור על גוף ישר כמו קרש, מרפקים ב-45°',
      'Pull-Up': '💡 התחל עם כתפיים למטה, משוך את המרפקים לכיוון הירכיים',
      'Squat': '💡 ברכיים בכיוון האצבעות, גב ישר, עקבים על הרצפה',
      'Plank': '💡 הפעל את הליבה, אל תתן לירכיים לצנוח',
    };

    // Check for partial match
    const matchKey = Object.keys(tips).find(k => exerciseName.includes(k));
    const fallback = matchKey ? tips[matchKey] : '💡 התמקד בטכניקה נכונה ובתנועה מבוקרת';

    if (!this.available || !this.session) return fallback;

    try {
      const result = await this.session.prompt(`תן טיפ טכניקה קצר אחד (שורה אחת, עד 15 מילים, בעברית) לתרגיל: ${exerciseName}`);
      return '💡 ' + (result?.trim() || fallback);
    } catch(e) { return fallback; }
  }
};
