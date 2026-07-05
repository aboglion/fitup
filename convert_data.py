import json

with open('training_data.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

new_daily = []
for row in data.get('daily', []):
    day_num_str = row.get("יום", "")
    try:
        day_num = int(str(day_num_str).replace("יום", "").strip())
    except:
        day_num = day_num_str
        
    day_obj = {
        "dayNum": day_num,
        "week": row.get("שבוע"),
        "dayOfWeek": row.get("יום בשבוע"),
        "date": row.get("תאריך"),
        "dayType": row.get("סוג יום"),
        "plannedRPE": row.get("RPE מתוכנן"),
        "exercises": []
    }
    
    # Extract exercises
    slots = ["A1", "A2", "A3", "A4", "B1", "B2", "B3", "B4", "C1", "C2", "C3", "C4", "D1", "D2", "E1"]
    for slot in slots:
        ex_name = row.get(f"{slot} - תרגיל")
        if ex_name and str(ex_name).strip() and str(ex_name).strip() != "None" and str(ex_name).strip() != "—":
            ex = {
                "slot": slot,
                "name": str(ex_name).strip(),
                "sets": row.get(f"{slot} - סטים×חזרות"),
                "weight": row.get(f"{slot} - משקל/התנגדות"),
                "videoUrl": row.get(f"{slot} - קישור")
            }
            day_obj["exercises"].append(ex)
            
    new_daily.append(day_obj)

# Map exercises array
new_exercises = []
for ex_row in data.get("exercises", []):
    ex = {
        "name": ex_row.get("תרגיל", ""),
        "category": ex_row.get("קטגוריה", ""),
        "difficulty": ex_row.get("רמת קושי", ""),
        "weight": ex_row.get("משקל/התנגדות", ""),
        "videoUrl": ex_row.get("קישור יוטיוב_link") or ex_row.get("קישור יוטיוב", ""),
        "setsProgression": ex_row.get("סטים×חזרות לפי שלב", "")
    }
    new_exercises.append(ex)

new_data = {
    "daily": new_daily,
    "exercises": new_exercises
}

with open('js/data.js', 'w', encoding='utf-8') as f:
    f.write('window.TRAINING_DATA = ' + json.dumps(new_data, ensure_ascii=False) + ';\n')
print("Done")
