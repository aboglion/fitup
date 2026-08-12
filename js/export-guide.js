window.ExporterGuide = (() => {

  const GUIDE_I18N = {
    en: {
      title: "FitUp Pro Ultimate v4.0 — 78-Week Training Program Guide",
      subtitle: "Full 546-Day Blueprint, Dumbbell & Calisthenics Progression Dictionary & Daily Breakdown",
      overview_title: "📖 Program Specifications & Philosophy — Version 4.0 Ultimate",
      overview_desc: "This training program was engineered for <strong>78 weeks (546 days)</strong> to maximize strength, muscle hypertrophy, cardiovascular fitness (Zone 2 & VO2 Max), and joint mobility based on <strong>Progressive Overload</strong>.",
      zero_decisions_title: "🎯 'Zero Decisions' Philosophy & Built-In Tracking",
      zero_decisions_desc: "The program eliminates guesswork with structured variables across all 78 weeks:",
      mental_load: "<strong>Minimal Mental Load:</strong> Exercise selection, weights, sets, reps, tempo, and rest intervals are predefined.",
      strength_cardio: "<strong>Hybrid Strength & Cardio:</strong> 3 intense strength days (Legs + Core, Push + Skill, Pull + Grip), Zone 2 cardio day, VO2 Max 4x4 day, Active Recovery day, and Rest day.",
      deload_cycles: "<strong>Scientific Recovery (Deload Cycles):</strong> Every 6th week is a Deload week (reduced volume to 2 sets, RPE 6) allowing neural and joint adaptation.",
      equipment_title: "🔧 Required Equipment",
      equipment_list: [
        "Adjustable Dumbbells pair (2.5kg, 5kg, 7.5kg, 10kg, 12.5kg, 15kg)",
        "TRX Suspension Trainer / Gymnastic Rings",
        "Resistance Bands (30kg, 40kg, 50kg)",
        "Push-up Bars / Parallettes",
        "Weighted Vest (+5kg)",
        "Pull-up Bar",
        "Bench / Sturdy Chair + Wall + Treadmill / Walking Path"
      ],
      weekly_structure_title: "⚙️ Weekly Structure (7 Days)",
      col_day: "Day",
      col_type: "Workout Type",
      col_intensity: "Intensity / Focus",
      days_table: [
        { day: "Day 1", type: "🦵 Legs + Core", focus: "RPE 7–9 — Squats, Deadlifts, Core & Dumbbells" },
        { day: "Day 2", type: "💥 Push + Skill", focus: "RPE 7–9 — Chest Press, Shoulders, TRX & Handstands" },
        { day: "Day 3", type: "🫀 Zone 2 Cardio", focus: "30–40 min Incline Walk (60-70% Max HR)" },
        { day: "Day 4", type: "🧲 Pull + Grip", focus: "RPE 7–9 — Pull-ups, Rows, Biceps & Grip" },
        { day: "Day 5", type: "🌿 Active Recovery", focus: "30 min Light Walk + Full Body Mobility & Stretching" },
        { day: "Day 6", type: "🔴 VO2 Max 4×4", focus: "Norwegian 4x4: 4 rounds of (4 min 90-95% HR / 3 min recovery)" },
        { day: "Day 7", type: "😴 Rest Day", focus: "Full Recovery & Nutrition" }
      ],
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
      title: "FitUp Pro Ultimate v4.0 — מדריך תוכנית 78 שבועות",
      subtitle: "אפיון, הסברים, מילון תרגילים ופריסת 546 ימים מלאה (Dumbbell & Calisthenics Progression)",
      overview_title: "📖 אפיון והסבר על התוכנית — גרסה 4.0 Ultimate",
      overview_desc: "תוכנית אימונים זו תוכננה למשך <strong>78 שבועות (546 ימים)</strong> במטרה לבנות כוח מרבי, מסת שריר איכותית, כושר קרדיו-וואסקולרי מתקדם (VO2 Max ו-Zone 2), ותנועתיות מלאה. התוכנית מבוססת על <strong>התקדמות הדרגתית מבוקרת (Progressive Overload)</strong>.",
      zero_decisions_title: "🎯 פילוסופיית \"אפס החלטות\" ומעקב מובנה",
      zero_decisions_desc: "התוכנית נבנתה במכוון סביב הרעיון של <strong>אפס החלטות מצד המתאמן</strong>:",
      mental_load: "<strong>מינימום עומס מנטלי:</strong> כל תרגיל, משקל, סטים, חזרות, קצב (Tempo) וזמני מנוחה מובנים מראש.",
      strength_cardio: "<strong>שילוב כוח וקרדיו מתקדם:</strong> 3 ימי כוח, יום Zone 2, יום VO2 Max 4x4, יום התאוששות ויום מנוחה.",
      deload_cycles: "<strong>התאוששות מדעית (Deload Cycles):</strong> כל שבוע 6 הינו שבוע Deload להתאוששות מערכת העצבים והמפרקים.",
      equipment_title: "🔧 ציוד נדרש",
      equipment_list: [
        "זוג משקולות יד מתכווננות (2.5kg, 5kg, 7.5kg, 10kg, 12.5kg, 15kg)",
        "רצועות TRX / טבעות התעמלות",
        "גומיות התנגדות (30kg, 40kg, 50kg)",
        "ידיות שחיקות / Parallettes",
        "וסט שקול (+5kg)",
        "מוט מתח",
        "כיסא / ספסל יציב + קיר פנוי + מסילת כושר / הליכה"
      ],
      weekly_structure_title: "⚙️ מבנה שבועי (7 ימים)",
      col_day: "יום",
      col_type: "סוג אימון",
      col_intensity: "עצימות / דגשים",
      days_table: [
        { day: "יום 1", type: "🦵 Legs + Core", focus: "RPE 7–9 — סקואט, דדליפט, ליבה ומשקולות" },
        { day: "יום 2", type: "💥 Push + Skill", focus: "RPE 7–9 — לחיצות חזה, כתפיים, TRX ועמידת ידיים" },
        { day: "יום 3", type: "🫀 Zone 2 Cardio", focus: "30–40 דק' הליכה בשיפוע 10-12% (דופק 60-70% מרובי)" },
        { day: "יום 4", type: "🧲 Pull + Grip", focus: "RPE 7–9 — מתח, חתירות DB, TRX, בייספס ואחיזה" },
        { day: "יום 5", type: "🌿 Active Recovery", focus: "30 דק' הליכה קלה + מתיחות וניידות מפרקים" },
        { day: "יום 6", type: "🔴 VO2 Max 4×4", focus: "פרוטוקול נורבגי: 4 סבבים של (4 דק' מאמץ 90-95% דופק / 3 דק' מנוחה)" },
        { day: "יום 7", type: "😴 Rest Day", focus: "מנוחה מלאה והתאוששות" }
      ],
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
      title: "FitUp Pro Ultimate v4.0 — دليل برنامج التدريب 78 أسبوعًا",
      subtitle: "المواصفات، الشرح، قاموس التمارين والتفصيل الكامل لـ 546 يوماً",
      overview_title: "📖 المواصفات والشفافية — الإصدار 4.0 Ultimate",
      overview_desc: "تم تصميم هذا البرنامج لـ <strong>78 أسبوعًا (546 يومًا)</strong> لبناء أقصى قوة، وزيادة الكتلة العضلية، وتحسين اللياقة البدنية والقلبية على أساس <strong>التحميل الزائد التدريجي (Progressive Overload)</strong>.",
      zero_decisions_title: "🎯 فلسفة \"صفر قرارات\" والتتبع المدمج",
      zero_decisions_desc: "تم بناء البرنامج خصيصاً لإلغاء التخمين لدى المتدرب عبر متغيرات محددة مسبقاً:",
      mental_load: "<strong>حد أدنى من الجهد الذهني:</strong> اختيار التمارين، الأوزان، المجموعات، التكرارات ومواعيد الراحة محددة مسبقاً.",
      strength_cardio: "<strong>دمج القوة والكارديو:</strong> 3 أيام قوة، يوم Zone 2 كارديو، يوم VO2 Max 4x4، يوم تعافي نشط، ويوم راحة.",
      deload_cycles: "<strong>التعافي العلمي (أسابيع Deload):</strong> كل أسبوع سادس هو أسبوع تعافي خفيف لتجديد المفاصل والجهاز العصبي.",
      equipment_title: "🔧 المعدات المطلوبة",
      equipment_list: [
        "زوج أثقال يدوية قابلة للتعديل (Dumbbells)",
        "حبال TRX / حلقات الجمباز",
        "أربطة مقاومة (30kg, 40kg, 50kg)",
        "مقابض تمارين الضغط (Parallettes)",
        "سترة ثقيلة (+5kg Vest)",
        "عقلة (Pull-up Bar)",
        "كرسي ثقيل + حائط + جهاز مشي / مسار مشي"
      ],
      weekly_structure_title: "⚙️ الهيكل الأسبوعي (7 أيام)",
      col_day: "اليوم",
      col_type: "نوع التمرين",
      col_intensity: "الشدة / التركيز",
      days_table: [
        { day: "اليوم 1", type: "🦵 Legs + Core", focus: "RPE 7–9 — سكوات، ديدليفت، العضلات الأساسية والأوزان" },
        { day: "اليوم 2", type: "💥 Push + Skill", focus: "RPE 7–9 — تمارين الضغط للصدر، الكتفين، TRX" },
        { day: "اليوم 3", type: "🫀 Zone 2 Cardio", focus: "30–40 دقيقة مشي مائل (نبض 60-70% من الأقصى)" },
        { day: "اليوم 4", type: "🧲 Pull + Grip", focus: "RPE 7–9 — عقلة، تمارين الظهر، الساعد والقبضة" },
        { day: "اليوم 5", type: "🌿 Active Recovery", focus: "30 دقيقة مشي خفيف + إطالات ومرونة المفاصل" },
        { day: "اليوم 6", type: "🔴 VO2 Max 4×4", focus: "بروتوكول نرويجي: 4 جولات (4 دقائق جهد 90-95% / 3 دقائق راحة)" },
        { day: "اليوم 7", type: "😴 Rest Day", focus: "راحة كاملة وتغذية" }
      ],
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

        <h3>${t.equipment_title}</h3>
        <ul>
          ${t.equipment_list.map(item => `<li>${item}</li>`).join('')}
        </ul>

        <h3>${t.weekly_structure_title}</h3>
        <table>
          <tr><th>${t.col_day}</th><th>${t.col_type}</th><th>${t.col_intensity}</th></tr>
          ${t.days_table.map(row => `<tr><td>${row.day}</td><td>${row.type}</td><td>${row.focus}</td></tr>`).join('')}
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
