path = "/home/uns/fitup/js/exercises.js"
with open(path, "r", encoding="utf-8") as f:
    content = f.read()

import re

# Fix the broken ternary:
# condText.textContent = unlockCond ? I18n.t(unlockCond) : ''
#          ? '🎯 תנאי מעבר דרגה'
#          : (isReplace ? (parentShort ? `🔄 החלפת ${parentShort}` : '🔄 החלפת מקור') : '🔴 חיזוק: מתווסף במקביל');

old_block = """        condText.textContent = unlockCond ? I18n.t(unlockCond) : ''
          ? '🎯 תנאי מעבר דרגה'
          : (isReplace ? (parentShort ? `🔄 החלפת ${parentShort}` : '🔄 החלפת מקור') : '🔴 חיזוק: מתווסף במקביל');"""

# Wait, my previous replace actually replaced it with:
old_block_exact = """        condText.textContent = unlockCond ? I18n.t(unlockCond) : ''
          ? '🎯 תנאי מעבר דרגה'
          : (isReplace ? (parentShort ? `🔄 החלפת ${parentShort}` : '🔄 החלפת מקור') : '🔴 חיזוק: מתווסף במקביל');"""

new_block = """        condText.textContent = unlockCond
          ? I18n.t('level_up_condition')
          : (isReplace ? (parentShort ? `🔄 ${I18n.t('cond_replace')} ${parentShort}` : `🔄 ${I18n.t('cond_replace_orig')}`) : `🔴 ${I18n.t('cond_parallel')}`);"""

# wait, I need to check if the old block matches exactly, let's just use regex to replace it
content = re.sub(
    r"condText\.textContent = unlockCond \? I18n\.t\(unlockCond\) : ''\s*\?\s*'.*?'\s*:\s*\(isReplace \? \(parentShort \? `.*?` : '.*?'\) : '.*?'\);",
    r"condText.textContent = unlockCond ? I18n.t('level_up_condition') : (isReplace ? (parentShort ? `🔄 ${I18n.t('cond_replace') || 'Replacing'} ${parentShort}` : `🔄 ${I18n.t('cond_replace_orig') || 'Original replaced'}`) : `🔴 ${I18n.t('cond_parallel') || 'Added in parallel'}`);",
    content
)

# And earlier, timingText.textContent:
# timingText.textContent = unlockCond ? I18n.t(unlockCond) : (unlockWeekNum ? `${I18n.t('locked_week')} ${unlockWeekNum}`.replace('🔒 ', '📅 ') : '📅 פתיחה מדורגת');
# This is actually correct and translates the `unlockCond`. Wait, in the original code, `unlockCond` was put in `timingText` and "🎯 תנאי מעבר דרגה" in `condText`.
# My python script above already made timingText use I18n.t(unlockCond) which is correct!

# Let's add the translations for cond_replace, cond_replace_orig, cond_parallel to i18n
import os
i18n_path = "/home/uns/fitup/js/i18n.js"
with open(i18n_path, "r", encoding="utf-8") as f:
    i18n_content = f.read()

en_keys = """
      cond_replace: "Replacing",
      cond_replace_orig: "Original replaced",
      cond_parallel: "Added in parallel",
"""

he_keys = """
      cond_replace: "החלפת",
      cond_replace_orig: "החלפת מקור",
      cond_parallel: "חיזוק: מתווסף במקביל",
"""

ar_keys = """
      cond_replace: "استبدال",
      cond_replace_orig: "استبدال الأصل",
      cond_parallel: "يضاف بالتوازي",
"""

i18n_content = re.sub(r'(en:\s*{)', r'\1\n' + en_keys, i18n_content, count=1)
i18n_content = re.sub(r'(he:\s*{)', r'\1\n' + he_keys, i18n_content, count=1)
i18n_content = re.sub(r'(ar:\s*{)', r'\1\n' + ar_keys, i18n_content, count=1)

with open(i18n_path, "w", encoding="utf-8") as f:
    f.write(i18n_content)

with open(path, "w", encoding="utf-8") as f:
    f.write(content)
print("Fix applied.")
