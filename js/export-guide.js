window.ExporterGuide = (() => {

  async function generateProgramGuide() {
    const allPlan = await DB.getAllPlan();
    allPlan.sort((a, b) => a.dayIndex - b.dayIndex);
    const exercises = await DB.getExerciseGuide();
    
    let html = `
    <!DOCTYPE html>
    <html lang="he" dir="rtl">
    <head>
      <meta charset="UTF-8">
      <title>מדריך תוכנית האימונים השנתית - FitUp Pro</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Heebo:wght@300;400;500;700&display=swap');
        :root {
          --primary: #3b82f6;
          --bg-main: #f8fafc;
          --bg-card: #ffffff;
          --text-main: #0f172a;
          --text-muted: #64748b;
          --border: #e2e8f0;
        }
        body { 
          font-family: 'Heebo', sans-serif; 
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
        .header h1 { margin-top: 0; font-size: 2.5em; color: var(--primary); }
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
          text-align: right; 
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
          border-right: 5px solid var(--primary); 
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
        ul, ol { padding-right: 20px; }
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
        <h1>🏋️ FitUp Pro Ultimate v4.0 — מדריך תוכנית 78 שבועות</h1>
        <p><strong>אפיון, הסברים, מילון תרגילים ופריסת 546 ימים מלאה (Dumbbell & Calisthenics Progression)</strong></p>
      </div>

      <div class="section">
        <h2>📖 אפיון והסבר על התוכנית — גרסה 4.0 Ultimate</h2>
        <p>תוכנית אימונים זו תוכננה למשך <strong>78 שבועות (546 ימים)</strong> במטרה לבנות כוח מרבי, מסת שריר איכותית, כושר קרדיו-וואסקולרי מתקדם (VO2 Max ו-Zone 2), ותנועתיות מלאה. התוכנית מבוססת על <strong>התקדמות הדרגתית מבוקרת (Progressive Overload)</strong> המשולבת עם משקולות יד (Dumbbells) ותרגילי משקל גוף מתקדמים.</p>

        <h3>🎯 פילוסופיית "אפס החלטות" ומעקב מובנה</h3>
        <p>התוכנית נבנתה במכוון סביב הרעיון של <strong>אפס החלטות מצד המתאמן</strong>, ומתבססת על התקדמות מתוכננת מראש לכל 78 השבועות:</p>
        <ul>
          <li><strong>מינימום עומס מנטלי:</strong> כל שילוב של תרגיל, משקל משקולת, סטים, חזרות, קצב ביצוע (Tempo) וזמני מנוחה קבועים ומובנים מראש.</li>
          <li><strong>שילוב כוח וקרדיו מתקדם:</strong> פיצול שבועי ייחודי המשלב 3 ימי כוח עצים (Legs + Core, Push + Skill, Pull + Grip), יום Zone 2 Incline Cardio, יום VO2 Max Norwegian 4x4, יום Active Recovery, ויום מנוחה מלאה.</li>
          <li><strong>התאוששות מדעית (Deload Cycles):</strong> כל שבוע 6 בכל בלוק של 6 שבועות הינו <strong>שבוע Deload</strong> (הפחתת נפח ועומס ל-2 סטים ו-RPE 6), המאפשר למערכת העצבים והמפרקים להתאושש באופן מלא.</li>
        </ul>

        <h3>🔧 ציוד נדרש</h3>
        <ul>
          <li><strong>זוג משקולות יד מתכווננות (Dumbbells):</strong> 2.5kg, 5kg, 7.5kg, 10kg, 12.5kg, 15kg</li>
          <li><strong>רצועות TRX / Gymnastic Rings</strong> (עבור TRX Rows ו-TRX Push-ups)</li>
          <li><strong>גומיית התנגדות (Bands):</strong> 30kg, 40kg, 50kg (עבור Pallof Press, Band Pull-Apart, Band Face-Pull)</li>
          <li><strong>ידיות שחיקות / Push-up Bars / Parallettes</strong></li>
          <li><strong>וסט שקול (+5kg Vest)</strong></li>
          <li><strong>מוט מתח (Pull-up Bar)</strong></li>
          <li><strong>כיסא / ספסל יציב + קיר פנוי + מסילת כושר / הליכה</strong></li>
        </ul>

        <h3>⚙️ מבנה שבועי (7 ימים)</h3>
        <table>
          <tr><th>יום</th><th>סוג אימון</th><th>עצימות / דגשים</th></tr>
          <tr><td>יום 1</td><td>🦵 Legs + Core</td><td>RPE 7–9 — סקואט, דדליפט, ליבה ומשקולות</td></tr>
          <tr><td>יום 2</td><td>💥 Push + Skill</td><td>RPE 7–9 — לחיצות חזה, כתפיים, TRX ועמידת ידיים</td></tr>
          <tr><td>יום 3</td><td>🫀 Zone 2 Cardio</td><td>30–40 דק' הליכה בשיפוע 10-12% (דופק 60-70% מרובי)</td></tr>
          <tr><td>יום 4</td><td>🧲 Pull + Grip</td><td>RPE 7–9 — מתח, חתירות DB, TRX, בייספס ואחיזה</td></tr>
          <tr><td>יום 5</td><td>🌿 Active Recovery</td><td>30 דק' הליכה קלה + מתיחות וניידות מפרקים</td></tr>
          <tr><td>יום 6</td><td>🔴 VO2 Max 4×4</td><td>פרוטוקול נורבגי: 4 סבבים של (4 דק' מאמץ 90-95% דופק / 3 דק' מנוחה)</td></tr>
          <tr><td>יום 7</td><td>😴 Rest Day</td><td>מנוחה מלאה והתאוששות</td></tr>
        </table>

        <h3>🔄 Deload — שבועות התאוששות (שבוע 6 בכל בלוק)</h3>
        <p>בשבועות 6, 12, 18, 24, 30, 36, 42, 48, 54, 60, 66, 72, 78 מתקיים <strong>שבוע Deload</strong>. בשבועות אלו, נפח האימון יורד ל-2 סטים בלבד, עם רזרבה של 2-4 חזרות מכשל (RPE 6), כדי לאפשר בנייה מחדש של רקמות החיבור ומניעת פציעות.</p>

        <h3>⏳ זמני מנוחה וקצב ביצוע (Tempo)</h3>
        <table>
          <tr><th>סוג תרגיל</th><th>קצב עבודה (Tempo)</th><th>מנוחה בין סטים</th></tr>
          <tr><td>תרגילי נגטיב עצימים (Pull-up Neg, HSPU Neg)</td><td>4-1-1-0 (ירידה 4 שנ')</td><td>180 שניות (3 דקות)</td></tr>
          <tr><td>תרגילי מורכבים (DB Squat, DB RDL, DB OHP, Push-up)</td><td>3-1-1-0 / 2-1-1-0</td><td>120 שניות (2 דקות)</td></tr>
          <tr><td>תרגילי בידוד (Biceps Curl, Lateral Raise, Face-Pull)</td><td>2-0-1-0</td><td>60–90 שניות</td></tr>
          <tr><td>חימום, ניידות והתאוששות</td><td>רציף בשליטה</td><td>ללא מנוחה</td></tr>
        </table>

      </div>

      <div class="section">
        <h2>📚 מילון תרגילים</h2>
        <p>פירוט כל התרגילים המופיעים בתוכנית.</p>
        <div class="grid-container">
          ${exercises.map(ex => {
            const hasNoGif = ex.name.toLowerCase().includes('walking') || ex.name.includes('הליכה') || ['Slow Jogging', 'Dead Hang', 'Full Pistol Squat'].includes(ex.name);
            return `
            <div class="exercise-card">
              <h4 style="margin-top: 0; margin-bottom: 8px; color: var(--primary);">${ex.name}</h4>
              <p style="margin: 0 0 6px 0;"><span class="badge">${ex.category || 'כללי'}</span> ${ex.difficulty ? `<span class="badge" style="background: #fef3c7; color: #92400e;">${ex.difficulty}</span>` : ''}</p>
              ${ex.weight ? `<p style="font-size: 0.9em; margin: 4px 0;"><strong>התנגדות:</strong> ${ex.weight}</p>` : ''}
              ${ex.setsProgression ? `<p style="font-size: 0.9em; margin: 4px 0;"><strong>התקדמות:</strong> ${ex.setsProgression}</p>` : ''}
              ${!hasNoGif ? `<p style="font-size: 0.9em; margin: 4px 0;"><a href="images/gifs/${ex.name}.gif" target="_blank" style="color: var(--primary);">▶ צפה ב-GIF</a></p>` : ''}
            </div>
            `;
          }).join('')}
        </div>
      </div>

      <div class="section">
        <h2>📅 פירוט התוכנית המלאה - 52 שבועות</h2>
        <p>כאן תוכלו לראות כל יום ויום בתוכנית השנתית, כולל תרגילים, חזרות וזמני עבודה. השתמשו במידע זה כרפרנס או להדפסה.</p>
        
        ${generateWeeksHtml(allPlan)}
      </div>

    </body>
    </html>
    `;

    return html;
  }

  function getBadgeClass(dayType) {
    if (dayType === 'Rest') return 'badge rest';
    if (dayType === 'הליכה') return 'badge walk';
    return 'badge';
  }

  function generateWeeksHtml(allPlan) {
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
          <h4 class="day-title">יום <span dir="ltr">#${day.dayNum}</span>: ${day.dayOfWeek} <span class="${getBadgeClass(day.dayType)}">${day.dayType}</span> <span style="font-size: 0.8em; color: var(--text-muted);">(RPE: ${day.plannedRPE})</span></h4>
          `;
          
          if (day.exercises && day.exercises.length > 0) {
            html += `<table>
              <tr>
                <th>תרגיל</th>
                <th width="140">סטים וחזרות</th>
                <th width="120">התנגדות / משקל</th>
                <th width="100">קצב (Tempo)</th>
                <th width="90">מנוחה</th>
              </tr>`;
            day.exercises.forEach(ex => {
              html += `<tr>
                <td><strong>${ex.name}</strong></td>
                <td dir="ltr" style="text-align: right;">${ex.sets || '-'}</td>
                <td dir="ltr" style="text-align: right;">${ex.weight || '-'}</td>
                <td dir="rtl" style="text-align: right;">${ex.tempo ? (UI.formatTempo ? UI.formatTempo(ex.tempo) : ex.tempo) : '-'}</td>
                <td dir="ltr" style="text-align: right;">${ex.rest ? ex.rest + 's' : '-'}</td>
              </tr>`;
            });
            html += `</table>`;
          } else {
            html += `<p style="color: var(--text-muted);">Rest Day</p>`;
          }
          
        html += `</div>`;
      });
      html += `</div>`;
    }
    return html;
  }

  async function handleExport() {
    try {
      const btn = document.getElementById('export-guide-btn');
      if(btn) {
        btn.innerHTML = '⏳ מכין מדריך...';
        btn.disabled = true;
      }

      const html = await generateProgramGuide();
      const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `FitUp-Pro-Guide.html`;
      a.click();
      
      setTimeout(() => {
        URL.revokeObjectURL(url);
      }, 1000);
      
      if(btn) {
        btn.innerHTML = '📄 צפה והורד מדריך מלא';
        btn.disabled = false;
      }
      if(window.UI && window.UI.toast) {
        UI.toast('המדריך נוצר והורד בהצלחה! 📄', 'success');
      }
    } catch(err) {
      console.error(err);
      const btn = document.getElementById('export-guide-btn');
      if(btn) {
        btn.innerHTML = '📄 צפה והורד מדריך מלא';
        btn.disabled = false;
      }
      if(window.UI && window.UI.toast) {
        UI.toast('שגיאה בייצוא המדריך', 'error');
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
