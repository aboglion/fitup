// Gemini Flash AI via Vercel Proxy (with fallback to local rules)
const AIModule = {
  session: null,
  available: false,
  systemPrompt: 'אתה מאמן כושר מנוסה שמדבר בעברית. אתה נותן משפטי מוטיבציה קצרים, תובנות אימון, וסיכומים מקצועיים. ענה תמיד בעברית, בקצרה ובאנרגיה חיובית. השתמש באימוג\'ים.',

  async init() {
    try {
      this.available = true;
      this.session = {
        prompt: async (promptText) => {
          return await this.callAPI(promptText, this.systemPrompt);
        }
      };
      console.log('✅ Gemini Flash AI via Vercel is ready');
      return true;
    } catch(e) {
      console.log('Gemini Flash AI Proxy init failed:', e.message);
      this.available = false;
      return false;
    }
  },

  async callAPI(prompt, systemPrompt = '') {
    // Default production URL — hardcoded so localhost / file:// work out of the box
    const DEFAULT_VERCEL_URL = 'https://fitupapp-one.vercel.app';

    try {
      // Priority: user-configured > last cached from Vercel visit > default
      let baseUrl = localStorage.getItem('fitpro_ai_api_url') ||
                    localStorage.getItem('fitpro_last_known_origin') ||
                    DEFAULT_VERCEL_URL;

      const cleanedBase = baseUrl.replace(/\/$/, '');
      const fetchUrl = cleanedBase.includes('/api/ai') ? cleanedBase : `${cleanedBase}/api/ai`;

      const response = await fetch(fetchUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ prompt, systemPrompt })
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || `HTTP ${response.status}`);
      }
      const data = await response.json();
      return data.text || '';
    } catch (e) {
      console.warn('API Call failed, falling back:', e.message);
      throw e;
    }
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
  },

  // Moderate username input for leaderboard
  async moderateName(name) {
    if (name.length < 2 || name.length > 15) {
      return { valid: false, reason: 'השם חייב להיות בין 2 ל-15 תווים' };
    }
    
    // Whitelist allowed characters to prevent HTML/script injection
    const allowedRegex = /^[a-zA-Z0-9\u0590-\u05fe\s\-_]+$/;
    if (!allowedRegex.test(name)) {
      return { valid: false, reason: 'השם יכול להכיל אותיות, מספרים, רווחים, מקף או קו תחתון בלבד' };
    }

    // Simple static blocklist for common bad words (Hebrew & English)
    const blocklist = [
      'זונה', 'בן זונה', 'קוקסינל', 'מניאק', 'שרמוטה', 'נאצי', 'היטלר', 'זין', 'כוס', 'תחת', 'כלב', 'חרא',
      'fuck', 'shit', 'bitch', 'asshole', 'bastard', 'nigger', 'nazi', 'hitler', 'cunt', 'dick', 'pussy'
    ];
    const lowerName = name.toLowerCase();
    for (const badWord of blocklist) {
      if (lowerName.includes(badWord)) {
        return { valid: false, reason: 'השם מכיל מילים לא ראויות' };
      }
    }

    if (this.available && this.session) {
      try {
        const prompt = `האם השם הבא מתאים לשימוש כשם משתמש ציבורי ראוי ומכבד באפליקציית כושר? 
אם הוא פוגעני, גס, שטותי לחלוטין או מיועד להעמסה/ספאם, ענה בדיוק במילה אחת: "לא".
אם השם תקין ומכבד, ענה בדיוק במילה אחת: "כן".
השם לבדיקה: "${name}"`;
        const result = await this.session.prompt(prompt);
        const cleanedResult = result.trim().toLowerCase();
        if (cleanedResult.includes('לא')) {
          return { valid: false, reason: 'שם לא מתאים או פוגעני לפי מערכת ה-AI' };
        }
      } catch(e) {
        console.log('AI moderation failed, relying on static rules:', e.message);
      }
    }

    return { valid: true };
  },

  // Generate global status summary for home screen
  async getGlobalStatusSummary(prog, todayPlan, daysData) {
    const totalWorkouts = prog.totalWorkouts || 0;
    const streak = prog.streak || 0;
    const xp = prog.xp || 0;
    const rank = prog.rank || 'מתחיל';
    
    let recentWorkoutsSummary = 'אין אימונים מתועדים עדיין.';
    if (prog.workoutHistory && prog.workoutHistory.length > 0) {
      const lastThree = prog.workoutHistory.slice(-3);
      recentWorkoutsSummary = lastThree.map(w => `${w.date}: ${w.dayName || w.dayId}`).join(', ');
    }
    
    const muscleLevels = [];
    if (daysData && daysData.days) {
      daysData.days.forEach(d => {
        d.muscles.forEach(m => {
          const levelIdx = prog.muscleLevels ? (prog.muscleLevels[m.id] || 0) : 0;
          const ex = m.exercises[levelIdx] || m.exercises[m.exercises.length - 1];
          if (ex) {
            muscleLevels.push(`${m.nameHe}: רמת ${ex.level === 'green' ? 'ירוק' : ex.level === 'blue' ? 'כחול' : ex.level === 'orange' ? 'כתום' : 'אדום'} (${ex.name})`);
          }
        });
      });
    }
    const levelsStr = muscleLevels.slice(0, 4).join(', ');

    let nextStep = '';
    if (todayPlan.type === 'workout') {
      const day = daysData.days.find(d => d.id === todayPlan.dayId);
      nextStep = `היום מתוכנן אימון: ${day ? day.name : todayPlan.dayId}.`;
    } else {
      nextStep = `היום הוא יום מנוחה.`;
    }

    const fallbackSummary = `👋 שלום אלוף! אתה כרגע בדרגת **${rank}** עם **${xp} XP**. צברת רצף של ${streak} ימים וסיימת ${totalWorkouts} אימונים סך הכל. האימונים האחרונים שלך היו: ${recentWorkoutsSummary}. הרמות הנוכחיות שלך: ${levelsStr}. ${nextStep} המשך להתקדם ולהתמיד בתוכנית! 💪`;

    if (!this.available || !this.session) return { text: fallbackSummary, isAI: false };

    try {
      const prompt = `נתח את מצב המתאמן הבא בצורה חכמה ומקצועית מאוד וכתוב סיכום בעברית:
- דרגה: ${rank} (${xp} XP)
- רצף נוכחי: ${streak} ימים
- סה"כ אימונים שבוצעו: ${totalWorkouts}
- אימונים אחרונים: ${recentWorkoutsSummary}
- רמות נוכחיות של תרגילים: ${levelsStr}
- מה מתוכנן להיום: ${nextStep}

דרישות הניסוח:
- כתוב פסקה אחת קצרה ומגובשת מאוד (עד 60 מילים).
- הניסוח צריך להיות אישי, מנוסח טוב, מעודד ומעצים.
- הסיכום צריך לשקף תמונה כוללת: מה שקרה (האימונים האחרונים), מה קורה עכשיו (הדרגה והרמה) ומה שצריך לקרות (האימון להיום).
- שלב מספר אימוג'ים מתאימים.`;

      const result = await this.session.prompt(prompt);
      return result?.trim() ? { text: result.trim(), isAI: true } : { text: fallbackSummary, isAI: false };
    } catch(e) {
      return { text: fallbackSummary, isAI: false };
    }
  }
};
