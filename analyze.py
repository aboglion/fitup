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

slots = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2', 'D1', 'D2']
for slot in slots:
    print(f"\n--- {slot} Progression ---")
    last_ex = None
    last_sr = None
    for i in sorted(weeks.keys()):
        day = weeks[i]
        ex = day.get(f"{slot} - תרגיל")
        sr = day.get(f"{slot} - סטים×חזרות")
        if ex != last_ex or sr != last_sr:
            print(f"Week {i}: {ex} | {sr}")
            last_ex = ex
            last_sr = sr
