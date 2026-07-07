import json
import re

with open('training_data.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

new_exercises = [
    {
      "תרגיל": "Single-arm Band Row",
      "קטגוריה": "A2 - משיכה",
      "סטים×חזרות לפי שלב": "שבועות 1-12: 3×8-12 | שבועות 13+: 4×8-12",
      "משקל/התנגדות": "30→40→50kg",
      "קישור יוטיוב": "https://www.youtube.com/watch?v=vwf_-q-r1EA",
      "קישור יוטיוב_link": "https://www.youtube.com/watch?v=vwf_-q-r1EA",
      "רמת קושי": "בינוני-מתקדם"
    },
    {
      "תרגיל": "Banded Push-up",
      "קטגוריה": "A1 - דחיפה",
      "סטים×חזרות לפי שלב": "שבועות 34-53: 4×8-12",
      "משקל/התנגדות": "30→40→50kg",
      "קישור יוטיוב": "https://www.youtube.com/watch?v=dGYUa6Ekwqs",
      "קישור יוטיוב_link": "https://www.youtube.com/watch?v=dGYUa6Ekwqs",
      "רמת קושי": "מתקדם"
    },
    {
      "תרגיל": "Banded Bulgarian Split Squat",
      "קטגוריה": "C1 - רגליים",
      "סטים×חזרות לפי שלב": "שבועות 34-53: 4×8 לכל רגל",
      "משקל/התנגדות": "30→40→50kg",
      "קישור יוטיוב": "https://www.youtube.com/watch?v=-Rkf9lW-3U0",
      "קישור יוטיוב_link": "https://www.youtube.com/watch?v=-Rkf9lW-3U0",
      "רמת קושי": "מתקדם+"
    }
]

# Add new exercises and remove Inverted Row
filtered_exercises = [ex for ex in data['exercises'] if ex['תרגיל'] != 'Inverted Row']
filtered_exercises.extend(new_exercises)
data['exercises'] = filtered_exercises

# Update daily
for day in data['daily']:
    week_str = day['שבוע']
    try:
        week_num = int(re.search(r'\d+', week_str).group())
    except:
        week_num = 0
        
    for key, value in day.items():
        if isinstance(value, str):
            # Replace Inverted Row everywhere
            if 'Inverted Row' in value:
                value = value.replace('Inverted Row', 'Single-arm Band Row')
                day[key] = value
                
            # From week 34, replace Diamond Push-up and Bulgarian Split Squat
            if week_num >= 34:
                if 'Diamond Push-up' in value:
                    value = value.replace('Diamond Push-up', 'Banded Push-up')
                    day[key] = value
                if 'Bulgarian Split Squat' in value:
                    value = value.replace('Bulgarian Split Squat', 'Banded Bulgarian Split Squat')
                    day[key] = value

with open('training_data.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print("Updated training_data.json")
