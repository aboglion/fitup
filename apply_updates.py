import json
import re

with open('training_data.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

def get_week_num(week_str):
    if not week_str: return 0
    m = re.search(r'\d+', week_str)
    return int(m.group()) if m else 0

def find_slot_for(day, ex_name):
    slots = ["A1", "A2", "B1", "B2", "C1", "C2", "D1", "D2", "E1", "E2", "E3", "תוספות", "תוספות 2"]
    for s in slots:
        val = day.get(f"{s} - תרגיל")
        if val and ex_name.lower() in str(val).lower():
            return s
    return None

def find_empty_slot(day):
    slots = ["E1", "E2", "E3", "F1", "F2", "תוספות", "תוספות 2", "תוספות 3"]
    for s in slots:
        if not day.get(f"{s} - תרגיל") or day.get(f"{s} - תרגיל") == "—":
            return s
    return "תוספות 4"

for day in data.get('daily', []):
    week = get_week_num(day.get('שבוע', ''))
    if week == 0: continue
    
    day_type = day.get('סוג יום', '')
    day_of_week = day.get('יום בשבוע', '')
    
    phase = 1
    if 13 <= week <= 33:
        phase = 2
    elif 34 <= week <= 52:
        phase = 3
        
    if day_type == "כוח":
        day["W1 - תרגיל"] = "Band External Rotation"
        day["W1 - סטים×חזרות"] = "2×15 לכל יד"
        day["W1 - משקל/התנגדות"] = "30kg"
        day["W1 - קישור"] = None
        
        if day_of_week == "ראשון":
            slot_bc = find_slot_for(day, "Band Curl") or find_empty_slot(day)
            day[f"{slot_bc} - תרגיל"] = "Band Curl"
            day[f"{slot_bc} - סטים×חזרות"] = "2×12-15"
            day[f"{slot_bc} - משקל/התנגדות"] = "40kg" if phase == 3 else "30kg"
            day[f"{slot_bc} - קישור"] = None
            
            slot_fp = find_slot_for(day, "Face Pull")
            if not slot_fp:
                # Need to find an empty slot that is not slot_bc
                slots_to_check = ["E1", "E2", "E3", "F1", "F2", "תוספות", "תוספות 2", "תוספות 3", "תוספות 4", "תוספות 5"]
                for s in slots_to_check:
                    if (not day.get(f"{s} - תרגיל") or day.get(f"{s} - תרגיל") == "—") and s != slot_bc:
                        slot_fp = s
                        break
            day[f"{slot_fp} - תרגיל"] = "Face Pull"
            day[f"{slot_fp} - סטים×חזרות"] = "3×15" if phase >= 2 else "2×15"
            day[f"{slot_fp} - משקל/התנגדות"] = "40kg" if phase == 3 else "30kg"
            day[f"{slot_fp} - קישור"] = "https://www.youtube.com/watch?v=ljgqer1ZpXg"
            
        elif day_of_week == "שלישי":
            slot_te = find_slot_for(day, "Triceps Extension") or find_empty_slot(day)
            day[f"{slot_te} - תרגיל"] = "Triceps Extension"
            day[f"{slot_te} - סטים×חזרות"] = "2×12-15"
            day[f"{slot_te} - משקל/התנגדות"] = "40kg" if phase == 3 else "30kg"
            day[f"{slot_te} - קישור"] = None
            
        elif day_of_week == "חמישי":
            slot_cr = find_slot_for(day, "Calf Raise") or find_empty_slot(day)
            day[f"{slot_cr} - תרגיל"] = "Single-leg Calf Raise"
            day[f"{slot_cr} - סטים×חזרות"] = "4×12-15 לכל רגל"
            if phase == 1:
                day[f"{slot_cr} - משקל/התנגדות"] = "ללא משקל"
            elif phase == 2:
                day[f"{slot_cr} - משקל/התנגדות"] = "עם תיק על הגב או משקל קל"
            else:
                day[f"{slot_cr} - משקל/התנגדות"] = "עם תיק על הגב או משקל"
            if not day.get(f"{slot_cr} - קישור"):
                day[f"{slot_cr} - קישור"] = "https://www.youtube.com/watch?v=ElcvJ0kjt6c"

        # Phase 2 specific
        if phase == 2 and day_of_week == "ראשון":
            slot_pu = find_slot_for(day, "Push-up")
            if slot_pu:
                day[f"{slot_pu} - תרגיל"] = "Offset Push-up"
                day[f"{slot_pu} - סטים×חזרות"] = "3×8 לכל צד"
                day[f"{slot_pu} - משקל/התנגדות"] = None
                
        # Phase 3 specific
        if phase == 3:
            slot_pu = find_slot_for(day, "Push-up")
            if slot_pu:
                if day_of_week == "ראשון":
                    day[f"{slot_pu} - תרגיל"] = "Banded Push-up"
                    day[f"{slot_pu} - סטים×חזרות"] = "4×8-12"
                    day[f"{slot_pu} - משקל/התנגדות"] = "50kg"
                elif day_of_week == "שלישי":
                    day[f"{slot_pu} - תרגיל"] = "Offset Push-up"
                    day[f"{slot_pu} - סטים×חזרות"] = "4×8 לכל צד"
                    day[f"{slot_pu} - משקל/התנגדות"] = None
                elif day_of_week == "חמישי":
                    day[f"{slot_pu} - תרגיל"] = "Decline Push-up"
                    day[f"{slot_pu} - סטים×חזרות"] = "4×8-12"
                    day[f"{slot_pu} - משקל/התנגדות"] = None

            slot_glute = find_slot_for(day, "RDL") or find_slot_for(day, "Hip Thrust")
            if slot_glute:
                if day_of_week == "ראשון" or day_of_week == "חמישי":
                    day[f"{slot_glute} - תרגיל"] = "Single-leg Hip Thrust"
                    day[f"{slot_glute} - סטים×חזרות"] = "4×8-10 לכל רגל"
                    day[f"{slot_glute} - משקל/התנגדות"] = None
                elif day_of_week == "שלישי":
                    day[f"{slot_glute} - תרגיל"] = "Banded RDL"
                    day[f"{slot_glute} - סטים×חזרות"] = "4×10-12"
                    day[f"{slot_glute} - משקל/התנגדות"] = "50kg"
                    day[f"{slot_glute} - קישור"] = "https://www.youtube.com/watch?v=xZoWmGj_tEs"

    if day_type == "הליכה":
        walk_time = "25-30 דקות" if phase == 1 else ("30-35 דקות" if phase == 2 else "40-45 דקות")
        bird_dog_reps = "3×8 לכל צד" if phase == 1 else "3×10 לכל צד"
        
        day["A1 - תרגיל"] = "הליכה מהירה"
        day["A1 - סטים×חזרות"] = walk_time
        day["A1 - קישור"] = "https://www.youtube.com/watch?v=iesCUs8CQEQ"
        day["A1 - משקל/התנגדות"] = None
        
        day["A2 - תרגיל"] = "Bird-Dog"
        day["A2 - סטים×חזרות"] = bird_dog_reps
        day["A2 - קישור"] = "https://www.youtube.com/watch?v=cZxtPxeR2H8"
        day["A2 - משקל/התנגדות"] = None
        
        day["B1 - תרגיל"] = "Hollow Body Hold"
        day["B1 - סטים×חזרות"] = "3×30 שניות"
        day["B1 - קישור"] = "https://www.youtube.com/watch?v=HAfUt2Cco74"
        day["B1 - משקל/התנגדות"] = None
        
        day["B2 - תרגיל"] = "Single-leg Calf Raise"
        day["B2 - סטים×חזרות"] = "2×15 לכל רגל"
        day["B2 - משקל/התנגדות"] = "ללא משקל"
        day["B2 - קישור"] = "https://www.youtube.com/watch?v=ElcvJ0kjt6c"
        
        day["C1 - תרגיל"] = "Tibialis Raise"
        day["C1 - סטים×חזרות"] = "3×15"
        day["C1 - משקל/התנגדות"] = None
        day["C1 - קישור"] = "https://www.youtube.com/watch?v=RHWRxiBe1iU"
        
        if day_of_week == "רביעי":
            day["C2 - תרגיל"] = "מתיחות מלאות"
            day["C2 - סטים×חזרות"] = "10-15 דקות"
            day["C2 - קישור"] = "https://www.youtube.com/watch?v=COO2S7lPBzA"
            day["C2 - משקל/התנגדות"] = None


# Update exercises array
ex_list = data.get("exercises", [])

def update_or_add_ex(ex_name, category, sets, weight, link):
    found = False
    for e in ex_list:
        if e.get("תרגיל") == ex_name:
            if category: e["קטגוריה"] = category
            if sets: e["סטים×חזרות לפי שלב"] = sets
            if weight: e["משקל/התנגדות"] = weight
            if link: e["קישור יוטיוב"] = link
            found = True
            break
    if not found:
        ex_list.append({
            "תרגיל": ex_name,
            "קטגוריה": category,
            "סטים×חזרות לפי שלב": sets,
            "משקל/התנגדות": weight,
            "קישור יוטיוב": link
        })

update_or_add_ex("Band External Rotation", "W1 - חימום", "כל השלבים: 2×15 לכל יד", "30kg", "")
update_or_add_ex("Band Curl", "E1 - ידיים", "שלבים 1-2: 2×12-15, שלב 3: 2×12-15", "30-40kg", "")
update_or_add_ex("Triceps Extension", "E1 - ידיים", "שלבים 1-2: 2×12-15, שלב 3: 2×12-15", "30-40kg", "")
update_or_add_ex("Offset Push-up", "A1 - חזה/דחיפה", "שלב 2: 3×8 לכל צד, שלב 3: 4×8 לכל צד", "משקל גוף", "")
update_or_add_ex("Decline Push-up", "A1 - חזה/דחיפה", "שלב 3: 4×8-12", "משקל גוף", "")

# Face Pull update
update_or_add_ex("Face Pull", "תוספות - כתפיים", "שלב 1: 2×15, שלב 2: 3×15, שלב 3: 3×15", "30-40kg", "https://www.youtube.com/watch?v=ljgqer1ZpXg")
# Single-leg Calf Raise
update_or_add_ex("Single-leg Calf Raise", "B2 - תאומים", "כוח: 4×12-15 עם עומס, הליכה: 2×15 ללא עומס", "0-קג / עומס", "https://www.youtube.com/watch?v=ElcvJ0kjt6c")
# Single-leg Hip Thrust
update_or_add_ex("Single-leg Hip Thrust", "C2 - ישבן", "שלב 3: 4×8-10 לכל רגל", "משקל גוף", "https://www.youtube.com/watch?v=kY0w0zFq08A")
# Banded RDL
update_or_add_ex("Banded RDL", "C2 - ישבן/המסטרינגס", "שלב 3: 4×10-12", "50kg", "https://www.youtube.com/watch?v=xZoWmGj_tEs")

data["exercises"] = ex_list

with open('training_data.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

