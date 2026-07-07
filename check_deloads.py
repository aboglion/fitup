import json

with open('training_data.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

strength_days = [d for d in data.get('daily', []) if d.get('סוג יום') == 'כוח']

weeks = {}
for d in strength_days:
    week = d.get('שבוע')
    week_num = int(week.split()[1])
    if week_num not in weeks:
        weeks[week_num] = d

for w in [8, 16, 24, 25, 32, 33, 40, 41, 48, 49]:
    if w in weeks:
        print(f"Week {w}: A1 = {weeks[w].get('A1 - תרגיל')} | {weeks[w].get('A1 - סטים×חזרות')} | RPE: {weeks[w].get('RPE מתוכנן')}")

