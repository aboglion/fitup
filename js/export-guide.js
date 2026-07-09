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
        <h1>🏋️ FitUp Pro — מדריך תוכנית 52 שבועות</h1>
        <p><strong>אפיון, הסברים, מילון תרגילים ופריסת ימים מלאה</strong></p>
      </div>

      <div class="section">
        <h2>📖 אפיון והסבר על התוכנית — גרסה 3.1</h2>
        <p>תוכנית אימונים זו תוכננה למשך 52 שבועות (364 ימים) במטרה לבנות כוח, מסת שריר, תנועתיות, ולהקנות הרגלים בריאים ארוכי טווח. הפילוסופיה של התוכנית היא <strong>התקדמות הדרגתית (Progressive Overload)</strong> עם 4 שלבי התקדמות ושבועות דילואד מובנים.</p>

        <h3>🔧 כלים נדרשים</h3>
        <ul>
          <li>3 רצועות התנגדות: 30kg (כחול), 40kg (שחור), 50kg (אדום)</li>
          <li>מוט תליה (Pull-up bar)</li>
          <li>כיסא/ספסל</li>
          <li>מגבת (ל-Towel Grip Hang)</li>
          <li>רצפה + קיר</li>
        </ul>

        <h3>⚙️ מבנה שבועי</h3>
        <table>
          <tr><th>יום</th><th>סוג</th><th>RPE</th></tr>
          <tr><td>ד׳ (רביעי)</td><td>💪 כוח עליון A — דחיפה · משיכה · בייספס</td><td>7-8</td></tr>
          <tr><td>ה׳ (חמישי)</td><td>🚶 הליכה + ליבה + שוקיים</td><td>5-6</td></tr>
          <tr><td>ו׳ (שישי)</td><td>🧘 מנוחה — מתיחות + הליכה קלה</td><td>—</td></tr>
          <tr><td>ש׳ (שבת)</td><td>🧘 מנוחה — התאוששות</td><td>—</td></tr>
          <tr><td>א׳ (ראשון)</td><td>🦵 כוח תחתון + ליבה</td><td>7-8</td></tr>
          <tr><td>ב׳ (שני)</td><td>🚶 הליכה + תחתון קל + מתיחות מלאות</td><td>5-6</td></tr>
          <tr><td>ג׳ (שלישי)</td><td>💪 כוח עליון B — דחיפה · משיכה · Bench Dip</td><td>7-8</td></tr>
        </table>

        <h3>📈 4 שלבי התקדמות + מיקרו-פריודיזציה</h3>
        <p>כדי למנוע תקיעות (Plateau), הוספנו <strong>מיקרו-פריודיזציה</strong> בתוך הפאזות. העלאת סטים אחרי חצי פאזה (מ-3 ל-4 סטים), והחלפת תרגילים ברוטציות מגוונות.</p>
        <table>
          <tr><th>תחום</th><th>שלב 1 (1-12)</th><th>שלב 2 (13-24)</th><th>שלב 3 (25-33)</th><th>שלב 4 (34-52)</th></tr>
          <tr><td><strong>חימום כף יד</strong></td><td>Finger Push-up 2×5-8</td><td>Finger Push-up 2×8-10</td><td>Towel Grip Hang 2×20-30ש</td><td>Towel Grip Hang 2×30-45ש</td></tr>
          <tr><td><strong>חימום כתף</strong></td><td>Band External Rotation</td><td>Band External Rotation</td><td>Side-Lying External Rotation</td><td>Side-Lying External Rotation</td></tr>
          <tr><td><strong>דחיפה חזה</strong></td><td>Incline Push-up (3-4×6-10)</td><td>Push-up רגיל (3-4×8-12)</td><td>Offset / Diamond (רוטציה שבועית)</td><td>Banded / Offset / Decline (רוטציה 3-שבועית)</td></tr>
          <tr><td><strong>דחיפה אנכית (B)</strong></td><td>Bench Dip (3×8-12)</td><td>Bench Dip (3×10-15)</td><td>Bench Dip רגל אחת (3×8-12)</td><td>Bench Dip רגליים מורמות (3×8-12)</td></tr>
          <tr><td><strong>משיכה אנכית</strong></td><td>Band-assisted Pull-up (50kg)</td><td>Band-assisted Pull-up (40kg)</td><td>Band-assisted Pull-up (30kg)</td><td>Pull-up משקל גוף (4×2-6)</td></tr>
          <tr><td><strong>משיכה אופקית (A)</strong></td><td>Band Row (30-40kg)</td><td>Band Row (40kg)</td><td>Single-arm Band Row (30kg)</td><td>Single-arm Band Row (40kg)</td></tr>
          <tr><td><strong>משיכה אופקית (B)</strong></td><td>Band Pull-apart (30kg)</td><td>Band Pull-apart (40kg)</td><td>Single-arm Band Row (30kg)</td><td>Single-arm Band Row (40kg)</td></tr>
          <tr><td><strong>כתפיים</strong></td><td>Banded OHP (30kg)</td><td>Banded OHP (40kg) + Pike Push-up</td><td>Banded OHP (50kg) + Pike Push-up</td><td>Pike Push-up + Band Lateral Raise</td></tr>
          <tr><td><strong>רגליים</strong></td><td>Squat איטי / Step-ups</td><td>Split Squat + Step-ups</td><td>Bulgarian Split Squat + Lateral Lunges</td><td>Bulgarian Split Squat + Step-ups + Lateral Lunges</td></tr>
          <tr><td><strong>ישבן / המסטרינגס</strong></td><td>Glute Bridge + RDL (30kg)</td><td>Glute Bridge + RDL (40kg)</td><td>Glute Bridge + RDL (50kg)</td><td>Single-leg RDL + Floor Hamstring Curl</td></tr>
          <tr><td><strong>גב תחתון</strong></td><td>Superman 2×10-12</td><td>Superman 2×12-15</td><td>Superman 3×12-15</td><td>Superman Hold 3×20-30ש</td></tr>
          <tr><td><strong>ליבה (עליון)</strong></td><td>Hollow Body Hold</td><td>Hollow Body Hold</td><td>Hanging Leg Raise</td><td>Hanging Leg Raise</td></tr>
          <tr><td><strong>ליבה צידית</strong></td><td>Pallof Press</td><td>Pallof Press</td><td>Side Plank</td><td>Copenhagen Plank</td></tr>
          <tr><td><strong>רוטציה</strong></td><td>—</td><td>—</td><td>Band Woodchop 2×10 לכל צד</td><td>Band Woodchop 2×10 לכל צד</td></tr>
          <tr><td><strong>ידיים (A)</strong></td><td>Band Curl + Face Pull</td><td>Band Curl + Face Pull</td><td>Band Curl + Face Pull</td><td>Band Curl/Lateral Raise (רוטציה) + Face Pull</td></tr>
          <tr><td><strong>הליכה</strong></td><td>25-30 דקות</td><td>30-35 דקות</td><td>35-40 דקות</td><td>40-45 דקות</td></tr>
          <tr><td><strong>תחתון קל (שני)</strong></td><td>Reverse Lunges + Dead Bug</td><td>Reverse Lunges + Dead Bug</td><td>+ Floor Hamstring Curl</td><td>+ Floor Hamstring Curl + Hollow Body Rock</td></tr>
        </table>

        <h3>🔄 Deload — שבועות התאוששות (9, 17, 25, 33, 41, 49)</h3>
        <p>כל 8 שבועות יש <strong>שבוע Deload</strong>. בשבועות אלו, אותם תרגילים מתבצעים אך בנפח מופחת (~60% מהנפח — 3 סטים במקום 4, פחות חזרות, משקל קל יותר). המטרה: מניעת אוברטריינינג, איפוס מערכת העצבים ושמירה על מומנטום ארוך טווח.</p>

        <h3>🔥 חימום דו-שלבי</h3>
        <p><strong>שלבים 1-2:</strong> Finger Push-up (2×5-10) + Band External Rotation (2×15 לכל יד) + Scapular Pull-up (2×10-15).</p>
        <p><strong>שלבים 3-4:</strong> Towel Grip Hang (2×20-45 שניות) + Side-Lying External Rotation (2×15 לכל יד) + Scapular Pull-up + Hold.</p>

        <h3>🔄 רוטציות</h3>
        <p><strong>שלב 3 (רוטציה שבועית):</strong> Offset Push-up ↔ Diamond Push-up (שבוע אי-זוגי/זוגי).</p>
        <p><strong>שלב 4 (רוטציה 3-שבועית):</strong> יום A: Banded → Offset → Decline. יום B: Diamond → Offset → Banded.</p>

        <h3>🦵 יום שני — תחתון קל</h3>
        <p>יום שני כולל הליכה מהירה + Reverse Lunges איטיים + Bird-Dog + Dead Bug + Hollow Body + Couch Stretch + מתיחות מלאות. משלב 3 נוסף Floor Hamstring Curl, ומשלב 4 Hollow Body Rock.</p>

        <h3>🧘 גמישות מובנית</h3>
        <p><strong>Couch Stretch</strong> מופיע בסוף יום תחתון ויום שני. <strong>Toe Yoga</strong> מופיע כחימום כף רגל ביום תחתון.</p>
      </div>

      <div class="section">
        <h2>📚 מילון תרגילים</h2>
        <p>פירוט כל התרגילים המופיעים בתוכנית.</p>
        <div class="grid-container">
          ${exercises.map(ex => `
            <div class="exercise-card">
              <h4 style="margin-top: 0; margin-bottom: 8px; color: var(--primary);">${ex.name}</h4>
              <p style="margin: 0 0 6px 0;"><span class="badge">${ex.category || 'כללי'}</span> ${ex.difficulty ? `<span class="badge" style="background: #fef3c7; color: #92400e;">${ex.difficulty}</span>` : ''}</p>
              ${ex.weight ? `<p style="font-size: 0.9em; margin: 4px 0;"><strong>התנגדות:</strong> ${ex.weight}</p>` : ''}
              ${ex.setsProgression ? `<p style="font-size: 0.9em; margin: 4px 0;"><strong>התקדמות:</strong> ${ex.setsProgression}</p>` : ''}
              ${ex.videoUrl ? `<p style="font-size: 0.9em; margin: 4px 0;"><a href="${ex.videoUrl}" target="_blank" style="color: var(--primary);">▶ צפה בסרטון</a></p>` : ''}
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
