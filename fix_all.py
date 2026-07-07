import json

with open("training_data.json", "r", encoding="utf-8") as f:
    data = json.load(f)

# 1. Build map of correct links and remove Foam Roll from exercises
link_map = {}
new_exercises = []
for ex in data.get("exercises", []):
    name = ex.get("תרגיל", "").strip()
    if name == "Foam Roll":
        continue # Remove it
    
    link = ex.get("קישור יוטיוב_link") or ex.get("קישור יוטיוב")
    if name and link:
        link_map[name] = link.strip()
    new_exercises.append(ex)

data["exercises"] = new_exercises

# 2. Process daily to remove Foam Roll and update all links to match the exercise
slots = ["A1", "A2", "A3", "A4", "B1", "B2", "B3", "B4", "C1", "C2", "C3", "C4", "D1", "D2", "E1", "תוספות"]

for day in data.get("daily", []):
    for slot in slots:
        ex_name_key = f"{slot} - תרגיל"
        ex_name = day.get(ex_name_key)
        
        if ex_name and isinstance(ex_name, str):
            ex_name = ex_name.strip()
            
            if ex_name == "Foam Roll":
                # Clear out this slot
                day[ex_name_key] = None
                if f"{slot} - סטים×חזרות" in day: day[f"{slot} - סטים×חזרות"] = None
                if f"{slot} - משקל/התנגדות" in day: day[f"{slot} - משקל/התנגדות"] = None
                if f"{slot} - קישור" in day: day[f"{slot} - קישור"] = None
            elif ex_name in link_map:
                # Sync the link
                day[f"{slot} - קישור"] = link_map[ex_name]

with open("training_data.json", "w", encoding="utf-8") as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print("Updated training_data.json")
