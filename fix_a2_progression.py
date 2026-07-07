import json
import re

with open('training_data.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

for day in data['daily']:
    if day.get('סוג יום') != 'כוח':
        continue
        
    week_str = day.get('שבוע', '')
    try:
        week_num = int(re.search(r'\d+', week_str).group())
    except:
        continue

    if 'A2 - תרגיל' in day:
        if 26 <= week_num <= 32:
            day['A2 - תרגיל'] = 'Single-arm Band Row'
            day['A2 - סטים×חזרות'] = '4×8-10'
        elif week_num == 33:
            day['A2 - תרגיל'] = 'Band Row'
            day['A2 - סטים×חזרות'] = '2×10'
        elif 34 <= week_num <= 40:
            day['A2 - תרגיל'] = 'Single-arm Band Row'
            day['A2 - סטים×חזרות'] = '4×10-12'
        elif week_num == 41:
            day['A2 - תרגיל'] = 'Band Row'
            day['A2 - סטים×חזרות'] = '2×10'
        elif 42 <= week_num <= 48:
            day['A2 - תרגיל'] = 'Single-arm Band Row'
            day['A2 - סטים×חזרות'] = '5×8-10'
        elif week_num == 49:
            day['A2 - תרגיל'] = 'Band Row'
            day['A2 - סטים×חזרות'] = '2×10'
        elif week_num >= 50:
            day['A2 - תרגיל'] = 'Single-arm Band Row'
            day['A2 - סטים×חזרות'] = '5×10-12'

with open('training_data.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print("Fixed A2 progression")
