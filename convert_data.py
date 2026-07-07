import json

with open('training_data.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

# Map exercises array and build a lookup map for the links
new_exercises = []
link_map = {}
for ex_row in data.get("exercises", []):
    name = ex_row.get("תרגיל", "").strip()
    link = ex_row.get("קישור יוטיוב_link") or ex_row.get("קישור יוטיוב", "")
    
    ex = {
        "name": name,
        "category": ex_row.get("קטגוריה", ""),
        "difficulty": ex_row.get("רמת קושי", ""),
        "weight": ex_row.get("משקל/התנגדות", ""),
        "videoUrl": link,
        "setsProgression": ex_row.get("סטים×חזרות לפי שלב", "")
    }
    new_exercises.append(ex)
    
    if name and link:
        link_map[name] = link

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
    slots = ["W1", "A1", "A2", "A3", "A4", "B1", "B2", "B3", "B4", "C1", "C2", "C3", "C4", "D1", "D2", "E1", "E2", "E3", "F1", "F2", "תוספות", "תוספות 2", "תוספות 3", "תוספות 4", "תוספות 5"]
    for slot in slots:
        ex_name = row.get(f"{slot} - תרגיל")
        if ex_name and str(ex_name).strip() and str(ex_name).strip() != "None" and str(ex_name).strip() != "—":
            ex_name_clean = str(ex_name).strip()
            
            # Lookup the link from the exercise definition directly to avoid duplication errors
            video_url = link_map.get(ex_name_clean, row.get(f"{slot} - קישור"))
            
            ex = {
                "slot": slot,
                "name": ex_name_clean,
                "sets": row.get(f"{slot} - סטים×חזרות"),
                "weight": row.get(f"{slot} - משקל/התנגדות"),
                "videoUrl": video_url
            }
            day_obj["exercises"].append(ex)
            
    new_daily.append(day_obj)

new_data = {
    "daily": new_daily,
    "exercises": new_exercises
}

with open('js/data.js', 'w', encoding='utf-8') as f:
    f.write('window.TRAINING_DATA = ' + json.dumps(new_data, ensure_ascii=False) + ';\n')
print("Done")
