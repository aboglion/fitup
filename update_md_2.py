import re

with open("UPDATE_PROGRAM.md", "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace(
    "legalWeights: [3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24]",
    "legalWeights: [3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32]"
)

content = content.replace(
    'התקדמות המשקלים מבוצעת באופן רציף מ-6 ק"ג עד 24 ק"ג',
    'התקדמות המשקלים מבוצעת באופן רציף מ-6 ק"ג עד 32 ק"ג'
)

with open("UPDATE_PROGRAM.md", "w", encoding="utf-8") as f:
    f.write(content)
