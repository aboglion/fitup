import json
import re

with open('training_data.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

for day in data['daily']:
    week_str = day['שבוע']
    try:
        week_num = int(re.search(r'\d+', week_str).group())
    except:
        week_num = 0
        
    for k, v in list(day.items()):
        if isinstance(v, str):
            slot = k.split(' - ')[0] if ' - ' in k else None
            
            # 1. Single-arm Band Row
            if v == 'Single-arm Band Row':
                if slot:
                    # Update weight
                    weight_key = f"{slot} - משקל/התנגדות"
                    if week_num <= 12:
                        day[weight_key] = "30kg"
                        day[f"{slot} - סטים×חזרות"] = "3×8-12"
                    elif week_num <= 24:
                        day[weight_key] = "40kg"
                        day[f"{slot} - סטים×חזרות"] = "4×8-10"
                    else:
                        day[weight_key] = "50kg"
                        day[f"{slot} - סטים×חזרות"] = "4-5×6-8"
            
            # 2. Banded Push-up
            if v == 'Banded Push-up':
                if slot:
                    weight_key = f"{slot} - משקל/התנגדות"
                    if week_num <= 40:
                        day[weight_key] = "30kg"
                        day[f"{slot} - סטים×חזרות"] = "4×10-12"
                    elif week_num <= 46:
                        day[weight_key] = "40kg"
                        day[f"{slot} - סטים×חזרות"] = "4×8-10"
                    else:
                        day[weight_key] = "50kg"
                        day[f"{slot} - סטים×חזרות"] = "5×6-8"

            # 3. Banded Bulgarian Split Squat
            if v == 'Banded Bulgarian Split Squat':
                if slot:
                    weight_key = f"{slot} - משקל/התנגדות"
                    if week_num <= 40:
                        day[weight_key] = "30kg"
                        day[f"{slot} - סטים×חזרות"] = "4×8 לכל רגל"
                    elif week_num <= 46:
                        day[weight_key] = "40kg"
                        day[f"{slot} - סטים×חזרות"] = "4×6-8 לכל רגל"
                    else:
                        day[weight_key] = "50kg"
                        day[f"{slot} - סטים×חזרות"] = "5×5-8 לכל רגל"

with open('training_data.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print("Updated daily weights and sets in training_data.json")
