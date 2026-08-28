import re

i18n_path = "/home/uns/fitup/js/i18n.js"
with open(i18n_path, "r", encoding="utf-8") as f:
    content = f.read()

en_keys = """
      staged_unlock: "Staged Unlock",
      prerequisite: "Prerequisite",
"""

he_keys = """
      staged_unlock: "פתיחה מדורגת",
      prerequisite: "תנאי קדם",
"""

ar_keys = """
      staged_unlock: "فتح تدريجي",
      prerequisite: "شرط مسبق",
"""

content = re.sub(r'(en:\s*{)', r'\1\n' + en_keys, content, count=1)
content = re.sub(r'(he:\s*{)', r'\1\n' + he_keys, content, count=1)
content = re.sub(r'(ar:\s*{)', r'\1\n' + ar_keys, content, count=1)

with open(i18n_path, "w", encoding="utf-8") as f:
    f.write(content)

ex_path = "/home/uns/fitup/js/exercises.js"
with open(ex_path, "r", encoding="utf-8") as f:
    ex = f.read()

ex = ex.replace("'📅 פתיחה מדורגת'", "`📅 ${I18n.t('staged_unlock')}`")
ex = ex.replace("'🔗 תנאי קדם: '", "`🔗 ${I18n.t('prerequisite')}: `")
ex = ex.replace("'שבוע'", "I18n.t('week_label')")

with open(ex_path, "w", encoding="utf-8") as f:
    f.write(ex)

print("Done")
