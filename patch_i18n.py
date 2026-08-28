import re

# 1. Update i18n.js
i18n_path = "/home/uns/fitup/js/i18n.js"
with open(i18n_path, "r", encoding="utf-8") as f:
    content = f.read()

en_keys = """
      // Skill tree conditions and legends
      legend_blue_arrow: "🔵 Blue Arrow — 🔄 Evolution & Replacement",
      legend_blue_desc: "(Replaces the previous exercise when reaching the unlock week)",
      legend_red_arrow: "🔴 Red Arrow — ➕ Strengthening & Isolation",
      legend_red_desc: "(Added as a complementary exercise and runs parallel in the program)",
      level_up_condition: "🎯 Level-up condition",
      cond_push_vol: "⚡ Complementary volume",
      cond_diamond: "⚡ Triceps strengthening",
      cond_15_flat: "⚡ 15 flat reps",
      cond_12_deficit: "⚡ 12 deep deficit",
      cond_12_feet_elevated: "⚡ 12 feet elevated reps",
      cond_10_pike: "⚡ 10 pike push-ups",
      cond_6_partial_walk: "⚡ 6 partial walk reps",
      cond_6_full_walk: "⚡ 6 full walk reps",
      cond_handstand_45s: "⚡ Handstand hold (45s)",
      cond_weekly_rotation: "⚡ Weekly rotation",
      cond_15s_tuck: "⚡ 15 seconds Tuck",
      cond_15s_one_leg: "⚡ 15 seconds one leg",
"""

he_keys = """
      // Skill tree conditions and legends
      legend_blue_arrow: "🔵 חץ כחול — 🔄 התפתחות & החלפה",
      legend_blue_desc: "(מחליף את התרגיל הקודם כשאנו מגיעים לשבוע הפתיחה)",
      legend_red_arrow: "🔴 חץ אדום — ➕ חיזוק & בידוד",
      legend_red_desc: "(מתווסף כחיזוק משלים ומתקיים במקביל בתכנית)",
      level_up_condition: "🎯 תנאי מעבר דרגה",
      cond_push_vol: "⚡ נפח משלים",
      cond_diamond: "⚡ חיזוק יד אחורית",
      cond_15_flat: "⚡ 15 חזרות שטוחות",
      cond_12_deficit: "⚡ 12 דפיציט עמוק",
      cond_12_feet_elevated: "⚡ 12 חזרות רגליים מוגבהות",
      cond_10_pike: "⚡ 10 פייק פושאפ",
      cond_6_partial_walk: "⚡ 6 חזרות טיפוס חלקי",
      cond_6_full_walk: "⚡ 6 חזרות טיפוס מלא",
      cond_handstand_45s: "⚡ עמידת ידיים (45 שנ׳)",
      cond_weekly_rotation: "⚡ רוטציה שבועית",
      cond_15s_tuck: "⚡ 15 שניות Tuck",
      cond_15s_one_leg: "⚡ 15 שניות רגל אחת",
"""

ar_keys = """
      // Skill tree conditions and legends
      legend_blue_arrow: "🔵 سهم أزرق — 🔄 تطور واستبدال",
      legend_blue_desc: "(يستبدل التمرين السابق عند الوصول إلى أسبوع الفتح)",
      legend_red_arrow: "🔴 سهم أحمر — ➕ تقوية وعزل",
      legend_red_desc: "(يُضاف كتمرين تكميلي ويستمر بالتوازي في البرنامج)",
      level_up_condition: "🎯 شرط الترقية",
      cond_push_vol: "⚡ حجم تكميلي",
      cond_diamond: "⚡ تقوية الترايسبس",
      cond_15_flat: "⚡ 15 تكرار مسطح",
      cond_12_deficit: "⚡ 12 تكرار عميق",
      cond_12_feet_elevated: "⚡ 12 تكرار بأقدام مرتفعة",
      cond_10_pike: "⚡ 10 تكرارات بايك",
      cond_6_partial_walk: "⚡ 6 تكرارات مشي جزئي",
      cond_6_full_walk: "⚡ 6 تكرارات مشي كامل",
      cond_handstand_45s: "⚡ وقوف على اليدين (45 ثانية)",
      cond_weekly_rotation: "⚡ تناوب أسبوعي",
      cond_15s_tuck: "⚡ 15 ثانية ثني",
      cond_15s_one_leg: "⚡ 15 ثانية قدم واحدة",
"""

# Insert into English block (before first key or after 'en: {')
content = re.sub(r'(en:\s*{)', r'\1\n' + en_keys, content, count=1)
# Insert into Hebrew block
content = re.sub(r'(he:\s*{)', r'\1\n' + he_keys, content, count=1)
# Insert into Arabic block
content = re.sub(r'(ar:\s*{)', r'\1\n' + ar_keys, content, count=1)

with open(i18n_path, "w", encoding="utf-8") as f:
    f.write(content)


# 2. Update exercises.js
ex_path = "/home/uns/fitup/js/exercises.js"
with open(ex_path, "r", encoding="utf-8") as f:
    ex = f.read()

# Replace hardcoded conditions with keys
replacements = {
    "'⚡ נפח משלים'": "'cond_push_vol'",
    "'⚡ חיזוק יד אחורית'": "'cond_diamond'",
    "'⚡ 15 חזרות שטוחות'": "'cond_15_flat'",
    "'⚡ 12 דפיציט עמוק'": "'cond_12_deficit'",
    "'⚡ 12 חזרות רגליים מוגבהות'": "'cond_12_feet_elevated'",
    "'⚡ 10 פייק פושאפ'": "'cond_10_pike'",
    "'⚡ 6 חזרות טיפוס חלקי'": "'cond_6_partial_walk'",
    "'⚡ 6 חזרות טיפוס מלא'": "'cond_6_full_walk'",
    "'⚡ עמידת ידיים (45 שנ׳)'": "'cond_handstand_45s'",
    "'⚡ רוטציה שבועית'": "'cond_weekly_rotation'",
    "'⚡ 15 שניות Tuck'": "'cond_15s_tuck'",
    "'⚡ 15 שניות רגל אחת'": "'cond_15s_one_leg'",
}

for old, new in replacements.items():
    ex = ex.replace(old, new)

# Replace legends
legend1_old = '<span style="background:rgba(59,130,246,0.15); color:#93c5fd; border:1px solid rgba(59,130,246,0.3); padding:2px 8px; border-radius:6px; font-weight:700; font-size:11px;">🔵 חץ כחול — 🔄 התפתחות & החלפה</span>'
legend1_new = '<span style="background:rgba(59,130,246,0.15); color:#93c5fd; border:1px solid rgba(59,130,246,0.3); padding:2px 8px; border-radius:6px; font-weight:700; font-size:11px;">${I18n.t(\'legend_blue_arrow\')}</span>'
ex = ex.replace(legend1_old, legend1_new)

legend1_desc_old = '<span>(מחליף את התרגיל הקודם כשאנו מגיעים לשבוע הפתיחה)</span>'
legend1_desc_new = '<span>${I18n.t(\'legend_blue_desc\')}</span>'
ex = ex.replace(legend1_desc_old, legend1_desc_new)

legend2_old = '<span style="background:rgba(239,68,68,0.15); color:#fca5a5; border:1px solid rgba(239,68,68,0.3); padding:2px 8px; border-radius:6px; font-weight:700; font-size:11px;">🔴 חץ אדום — ➕ חיזוק & בידוד</span>'
legend2_new = '<span style="background:rgba(239,68,68,0.15); color:#fca5a5; border:1px solid rgba(239,68,68,0.3); padding:2px 8px; border-radius:6px; font-weight:700; font-size:11px;">${I18n.t(\'legend_red_arrow\')}</span>'
ex = ex.replace(legend2_old, legend2_new)

legend2_desc_old = '<span>(מתווסף כחיזוק משלים ומתקיים במקביל בתכנית)</span>'
legend2_desc_new = '<span>${I18n.t(\'legend_red_desc\')}</span>'
ex = ex.replace(legend2_desc_old, legend2_desc_new)

level_up_old = '<span class="rpg-cond-label">🎯 תנאי מעבר דרגה</span>'
level_up_new = '<span class="rpg-cond-label">${I18n.t(\'level_up_condition\')}</span>'
ex = ex.replace(level_up_old, level_up_new)

# Update node.unlockCond usages to translate the keys dynamically
ex = ex.replace('data-unlock-cond="${node.unlockCond ? node.unlockCond.replace(/\\"/g, \'&quot;\') : \'\'}"', 'data-unlock-cond="${node.unlockCond ? node.unlockCond : \'\'}"')
ex = ex.replace('condText.textContent = unlockCond', 'condText.textContent = unlockCond ? I18n.t(unlockCond) : \'\'')

# And one more place where it is shown: 
ex = ex.replace('timingText.textContent = unlockCond ? unlockCond : (unlockWeekNum ? `📅 שבוע פתיחה ${unlockWeekNum}` : \'📅 פתיחה מדורגת\');', 'timingText.textContent = unlockCond ? I18n.t(unlockCond) : (unlockWeekNum ? `${I18n.t(\'locked_week\')} ${unlockWeekNum}`.replace(\'🔒 \', \'📅 \') : \'📅 פתיחה מדורגת\');')

with open(ex_path, "w", encoding="utf-8") as f:
    f.write(ex)

print("Updates successful.")
