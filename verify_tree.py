import json
import re

with open('training_data.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

def get_week_num(week_str):
    if not week_str: return 0
    m = re.search(r'\d+', week_str)
    return int(m.group()) if m else 0

first_appearance = {}

for day in data.get('daily', []):
    week = get_week_num(day.get('שבוע', ''))
    if week == 0: continue
    
    for key, val in day.items():
        if "תרגיל" in key and val and val != "—":
            if val not in first_appearance:
                first_appearance[val] = week
            else:
                if week < first_appearance[val]:
                    first_appearance[val] = week

print("Actual First Appearance (from daily workouts):")
for ex, week in sorted(first_appearance.items(), key=lambda x: x[1]):
    print(f"{ex}: week {week}")

