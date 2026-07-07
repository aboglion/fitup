import json
import re

with open('training_data.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

new_exercises = [
    {
      "תרגיל": "Band-assisted Pull-up",
      "קטגוריה": "B1 - משיכה",
      "סטים×חזרות לפי שלב": "שבועות 9-16: 3×5-8",
      "משקל/התנגדות": "גומייה עבה→בינונית",
      "קישור יוטיוב": "https://www.youtube.com/watch?v=HntT-qYnF6w",
      "קישור יוטיוב_link": "https://www.youtube.com/watch?v=HntT-qYnF6w",
      "רמת קושי": "בינוני"
    },
    {
      "תרגיל": "Banded RDL",
      "קטגוריה": "C2 - רגליים",
      "סטים×חזרות לפי שלב": "שבועות 1-16: 3×10-12",
      "משקל/התנגדות": "50kg",
      "קישור יוטיוב": "https://www.youtube.com/watch?v=JbE2L_W2wF8",
      "קישור יוטיוב_link": "https://www.youtube.com/watch?v=JbE2L_W2wF8",
      "רמת קושי": "בינוני"
    }
]

# Add to exercises array if not exists
existing_ex_names = [ex['תרגיל'] for ex in data['exercises']]
for nx in new_exercises:
    if nx['תרגיל'] not in existing_ex_names:
        data['exercises'].append(nx)

# Update the daily program
for day in data['daily']:
    if day.get('סוג יום') != 'כוח':
        continue
        
    week_str = day.get('שבוע', '')
    try:
        week_num = int(re.search(r'\d+', week_str).group())
    except:
        continue

    # Update B1 Progression:
    # Weeks 1-8: Scapular Pull-up
    # Weeks 9-16: Band-assisted Pull-up
    # Weeks 17-33: Chin-up
    # Weeks 34-53: Pull-up
    if 'B1 - תרגיל' in day:
        if 1 <= week_num <= 8:
            day['B1 - תרגיל'] = 'Scapular Pull-up'
            if week_num in [4,8]: # hypothetical deload, check original logic or just keep sets
                pass
        elif 9 <= week_num <= 16:
            day['B1 - תרגיל'] = 'Band-assisted Pull-up'
            if week_num in [9,10,11,12]:
                day['B1 - סטים×חזרות'] = '3×5-8'
            elif week_num in [13,14,15,16]:
                day['B1 - סטים×חזרות'] = '3×8-10'
        elif 17 <= week_num <= 33:
            day['B1 - תרגיל'] = 'Chin-up'
            if week_num == 25 or week_num == 33: # deload
                day['B1 - סטים×חזרות'] = '2×5' if week_num == 25 else '3×5'
        elif week_num >= 34:
            day['B1 - תרגיל'] = 'Pull-up'
            if week_num in [41, 49]: # deload
                day['B1 - סטים×חזרות'] = '3×5'

    # Update C2 Progression:
    # Weeks 1-16: Banded RDL
    # Weeks 17-33: Banded Hip Thrust
    # Weeks 34-53: Single-leg Hip Thrust (no change for this part)
    if 'C2 - תרגיל' in day:
        if 1 <= week_num <= 16:
            day['C2 - תרגיל'] = 'Banded RDL'
            if week_num in [1,2,3,4]:
                day['C2 - סטים×חזרות'] = '3×10-12'
            elif week_num in [5,6,7,8]:
                day['C2 - סטים×חזרות'] = '3×12-15'
            elif week_num in [9,10,11,12]:
                day['C2 - סטים×חזרות'] = '4×10-12'
            elif week_num in [13,14,15,16]:
                day['C2 - סטים×חזרות'] = '4×12-15'
        elif 17 <= week_num <= 33:
            day['C2 - תרגיל'] = 'Banded Hip Thrust'
            if week_num == 25 or week_num == 33: # deload
                day['C2 - סטים×חזרות'] = '2×10' if week_num == 25 else '3×10'

with open('training_data.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print("Program refactored successfully.")
