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
      <title>מדריך תוכנית האימונים השנתית - FitUp</title>
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
        <h1>מדריך תוכנית האימונים המלא - 52 שבועות</h1>
        <p><strong>אפיון, הסברים, מילון תרגילים ופריסת ימים מלאה של תוכנית FitUp</strong></p>
      </div>

      <div class="section">
        <h2>📖 אפיון והסבר על התוכנית</h2>
        <p>תוכנית אימונים זו תוכננה למשך 365 ימים (52 שבועות) במטרה לבנות כוח, מסת שריר, תנועתיות, ולהקנות הרגלים בריאים ארוכי טווח. הפילוסופיה של התוכנית היא <strong>התקדמות הדרגתית (Progressive Overload)</strong> תוך מתן דגש שווה להתאוששות ולאיזון שרירי מלא.</p>

        <h3>⚙️ כיצד מחולקים הימים?</h3>
        <ul>
          <li><strong>💪 ימי כוח (א׳/ג׳/ה׳):</strong> תרגילי התנגדות לבניית שריר וכוח. מכילים סופרסטים מאוזנים Push/Pull ועלייה הדרגתית בסטים ובתרגיל לאורך השנה.</li>
          <li><strong>🚶 ימי הליכה (ב׳/ד׳):</strong> התאוששות פעילה — הליכה בהתקדמות של 25 דקות עד 50 דקות, בתוספת תרגילי ליבה ויציבה (Bird-Dog, Hollow Body, Calf Raise).</li>
          <li><strong>🧘 ימי מנוחה (ו׳/ש׳):</strong> מנוחה מלאה ומתיחות. תזונה ושינה — חלק קריטי בבניית השריר.</li>
        </ul>

        <h3>📈 פרוגרסיות מובנות בתוכנית</h3>
        <table>
          <tr><th>תחום</th><th>שלב 1 (שבועות 1-12)</th><th>שלב 2 (שבועות 13-33)</th><th>שלב 3 (שבועות 34-52)</th></tr>
          <tr><td><strong>לחיצה (A1)</strong></td><td>Incline Push-up</td><td>Offset Push-up / Diamond</td><td>Banded / Offset / Decline Push-up (רוטציה)</td></tr>
          <tr><td><strong>משיכה אנכית (B1)</strong></td><td>Scapular Pull-up / Band-assisted</td><td>Chin-up</td><td>Pull-up</td></tr>
          <tr><td><strong>משיכה אופקית (A2)</strong></td><td>Band Row</td><td>Single-arm Band Row</td><td>Single-arm Band Row</td></tr>
          <tr><td><strong>רגליים (C1)</strong></td><td>Squat איטי</td><td>Split Squat / Bulgarian</td><td>Banded Bulgarian Split Squat</td></tr>
          <tr><td><strong>גלוטאוס (C2)</strong></td><td>Banded RDL</td><td>Banded Hip Thrust</td><td>Single-leg Hip / Banded RDL (רוטציה)</td></tr>
          <tr><td><strong>ליבה (D1)</strong></td><td>Hollow Body Hold</td><td>Hanging Leg Raise</td><td>Hanging Leg Raise</td></tr>
          <tr><td><strong>כתפיים (B2)</strong></td><td>Banded OHP</td><td>Banded OHP</td><td>Pike Push-up</td></tr>
          <tr><td><strong>ידיים ושיקום (תוספות)</strong></td><td>Band Curl, Triceps Ext, Face Pull, Band Ext Rot.</td><td>עלייה בנפח (סטים)</td><td>עלייה בהתנגדות (משקל)</td></tr>
          <tr><td><strong>Anti-Rotation (D2)</strong></td><td>Pallof Press</td><td>Pallof Press</td><td>Copenhagen Plank</td></tr>
          <tr><td><strong>הליכה</strong></td><td>25-30 דקות</td><td>30-35 דקות</td><td>40-45 דקות</td></tr>
        </table>

        <h3>🔄 Deload — שבועות התאוששות (25, 33, 41, 49)</h3>
        <p>כל 8 שבועות יש <strong>שבוע Deload</strong>. שבוע 25 חוזר לתרגיל בסיסי כ-Push-up רגיל לאיפוס. שבועות 33, 41, 49 שומרים על <strong>אותו תרגיל מתקדם</strong> (Diamond Push-up, Chin-up, Bulgarian Squat) אך מורידים ל-<strong>3 סטים בלבד</strong> — כ-60% מהנפח הרגיל. מטרתו: מניעת אוברטריינינג, איפוס מערכת העצבים ושמירה על מומנטום ארוך טווח.</p>

        <h3>🔄 חימום, תוספות ורוטציות מתקדמות</h3>
        <p><strong>חימום קבוע:</strong> לפני כל אימון כוח יש לבצע <em>Band External Rotation</em> (2 סטים, 15 חזרות לכל יד) לשמירה על בריאות הכתף.</p>
        <p><strong>תוספות ידיים ושיקום:</strong> בסיום אימון כוח 1 (ראשון) מבוצעים <em>Band Curl</em> ו-<em>Face Pull</em>. בסיום אימון כוח 2 (שלישי) מבוצע <em>Triceps Extension</em>. תרגילים אלו עוברים אדפטציה בנפח ובהתנגדות לאורך השלבים.</p>
        <p><strong>רוטציות בשלב 3:</strong> כדי לספק גירוי משתנה לשריר ולמנוע שחיקה, אימוני הלחיצה והשרשרת האחורית מתבצעים ברוטציה שבועית. לחיצה: Banded -> Offset -> Decline. גלוטאוס: Single-leg Hip Thrust -> Banded RDL -> Single-leg Hip Thrust.</p>

        <h3>🤸 שדרוג כתפיים — מ-OHP ל-Pike Push-up</h3>
        <p>מ-<strong>שבוע 34</strong> ואילך, Banded OHP מוחלף ב-<strong>Pike Push-up</strong> — תרגיל מסת גוף המחקה דחיפה אנכית ומהווה שלב ביניים לכיוון Handstand Push-up. אין צורך בציוד ועומס על המפרק נמוך יותר.</p>
      </div>

      <div class="section">
        <h2>📚 מילון תרגילים ומטרות</h2>
        <p>פירוט התרגילים המופיעים בתוכנית, קבוצות השרירים עליהן הם עובדים, ומטרתם הפונקציונלית.</p>
        <div class="grid-container">
          ${exercises.map(ex => `
            <div class="exercise-card">
              <h4 style="margin-top: 0; margin-bottom: 8px; color: var(--primary);">${ex.name}</h4>
              <p style="margin: 0 0 10px 0;"><span class="badge">${ex.category || 'כללי'}</span></p>
              ${ex.description ? `<p style="font-size: 0.9em; margin-bottom: 5px;"><strong>הסבר:</strong> ${ex.description}</p>` : ''}
              ${ex.musclesWorked ? `<p style="font-size: 0.9em; margin: 0;"><strong>שרירים פועלים:</strong> ${ex.musclesWorked.join(', ')}</p>` : ''}
            </div>
          `).join('')}
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
    if (dayType === 'מנוחה') return 'badge rest';
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
          <h4 class="day-title">יום ${day.dayNum}: ${day.dayOfWeek} <span class="${getBadgeClass(day.dayType)}">${day.dayType}</span> <span style="font-size: 0.8em; color: var(--text-muted);">(RPE: ${day.plannedRPE})</span></h4>
          `;
          
          if (day.exercises && day.exercises.length > 0) {
            html += `<table>
              <tr>
                <th>תרגיל</th>
                <th width="150">סטים וחזרות</th>
                <th width="120">התנגדות / משקל</th>
              </tr>`;
            day.exercises.forEach(ex => {
              html += `<tr>
                <td><strong>${ex.name}</strong></td>
                <td dir="ltr" style="text-align: right;">${ex.sets || '-'}</td>
                <td dir="ltr" style="text-align: right;">${ex.weight || '-'}</td>
              </tr>`;
            });
            html += `</table>`;
          } else {
            html += `<p style="color: var(--text-muted);">מנוחה פעילה או פסיבית, ללא תרגילי כוח מוגדרים.</p>`;
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
      a.download = `FitUp-Program-Guide.html`;
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
