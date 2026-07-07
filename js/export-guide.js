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
          <li><strong>💪 ימי כוח (א׳/ג׳/ה׳):</strong> תרגילי התנגדות לבניית שריר וכוח. מכילים פרוגרסיית Pull-up מובנית ואיזון שרשרת אחורית (Hip Thrust/Banded GM לסירוגין).</li>
          <li><strong>🚶 ימי הליכה (ב׳/ד׳):</strong> התאוששות פעילה + ליבה, יציבה ובריאות כתפיים. כוללים Face Pull, Dead Bug ו-Reverse Snow Angel.</li>
          <li><strong>🧘 ימי מנוחה (ו׳/ש׳):</strong> מנוחה מלאה, מתיחות ו-Foam Roll. תזונה ושינה — חלק קריטי בבניית השריר.</li>
        </ul>

        <h3>📈 פרוגרסיות מובנות בתוכנית</h3>
        <table>
          <tr><th>תחום</th><th>שלב 1 (שבועות 1-12)</th><th>שלב 2 (שבועות 13-24)</th><th>שלב 3 (שבועות 25+)</th></tr>
          <tr><td><strong>לחיצה</strong></td><td>Incline Push-up 2-3×6-12</td><td>Push-up רגיל / Diamond 3-4×8-12</td><td>Diamond Push-up 4-5×8-12</td></tr>
          <tr><td><strong>משיכה אנכית</strong></td><td>Active Hang + Scapular + Negative</td><td>Negative Pull-up → Pull-up 3-5×5-8</td><td>Chin-up 3-5×5-8</td></tr>
          <tr><td><strong>משיכה אופקית</strong></td><td>Band Row 3×8-12 | 30-40kg</td><td>Inverted Row 4×8-12 | 40kg</td><td>Inverted Row 5×מקס | 50kg</td></tr>
          <tr><td><strong>רגליים</strong></td><td>Squat איטי 3×8-12</td><td>Split Squat 3×8-10</td><td>Bulgarian Split Squat 5×8</td></tr>
          <tr><td><strong>שרשרת אחורית</strong></td><td>Hip Thrust/GM 3×10-12 | 30kg</td><td>Hip Thrust/GM 3×10-12 | 40kg</td><td>Hip Thrust/GM 4-5×8-12 | 50kg</td></tr>
          <tr><td><strong>ליבה</strong></td><td>Hollow Hold 2-3×20-30s</td><td>Hollow Hold 3×30-45s</td><td>Hanging Leg Raise 5×10-15</td></tr>
          <tr><td><strong>כתפיים</strong></td><td>Banded OHP 3×8-10 | 30kg</td><td>Banded OHP 3-4×8 | 40kg</td><td>Banded OHP 4-5×6-8 | 50kg</td></tr>
        </table>

        <h3>🔄 Deload — שבועות התאוששות (25, 33, 41, 49)</h3>
        <p>כל 8 שבועות יש <strong>שבוע Deload</strong> — נפח מופחת (3×5 חזרות) ועומס שלב אחד מתחת לשיא. מטרתו: מניעת אוברטריינינג, איפוס מערכת העצבים ושמירה על מומנטום ארוך טווח. לאחריו מגיע שיא כוח חדש.</p>

        <h3>⚖️ איזון שרשרת אחורית — Hip Thrust מול Banded GM</h3>
        <p><strong>שבועות אי-זוגיים:</strong> Banded Hip Thrust (גלוטאוס מקסימום) | <strong>שבועות זוגיים:</strong> Banded GM (Hamstrings + erector spinae). שילוב זה מונע חוסר איזון בין הגלוטאוס לירך האחורית ומפחית ריסק פציעות ברך ועמ"ש.</p>

        <h3>🛡️ בריאות כתפיים — Face Pull בכל יום הליכה</h3>
        <p>Face Pull מחזק את ה-Rotator Cuff וה-rear deltoid — הגנה קריטית מפני פציעות כתף לאחר כמות גדולה של Push-ups, Pull-ups ו-OHP. מופיע בכל 104 ימי ההליכה לאורך השנה.</p>
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
