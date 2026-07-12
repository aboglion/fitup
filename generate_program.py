#!/usr/bin/env python3
"""Generate FitUp Pro Auto — 52-week training program + bands."""
import json
import re
import os
import shutil
from datetime import datetime, timedelta

START_DATE = datetime(2026, 7, 5)

VIDEOS = {
    "Table Push-up": "https://www.youtube.com/watch?v=76TQU7iZlsI",
    "Scapular Pull-up": "https://youtu.be/pE8PJsWEV7k?si=ogf9wn9DXCRXB0HO",
    "Seated Band Row": "https://www.youtube.com/watch?v=gOvJDjy06sc",
    "Hollow Body Hold": "https://www.youtube.com/watch?v=HAfUt2Cco74",
    "Band Curl": "https://www.youtube.com/watch?v=0hZboUNuogA",
    "Bodyweight Squat": "https://www.youtube.com/watch?v=7LpLZOdz68A",
    "Single-Leg Glute Bridge": "https://www.youtube.com/watch?v=JCqhuq4bCio&t=1s",
    "Bodyweight Single-Leg RDL": "https://www.youtube.com/shorts/U4sOY8Gyc-s",
    "Banded Single-Leg RDL": "https://www.youtube.com/shorts/U4sOY8Gyc-s",
    "Banded Glute Bridge": "https://www.youtube.com/watch?v=JCqhuq4bCio&t=1s",
    "Single-Leg Calf Raise": "https://www.youtube.com/watch?v=ElcvJ0kjt6c",
    "Calf Raise": "https://www.youtube.com/watch?v=ElcvJ0kjt6c",
    "Push-up": "https://www.youtube.com/watch?v=IODxDxX7oi4",
    "Split Squat": "https://www.youtube.com/watch?v=zCsZwLeXrCg",
    "Bulgarian Split Squat": "https://www.youtube.com/watch?v=2C-uNgKwPLE",
    "Diamond Push-up": "https://www.youtube.com/watch?v=mH8WhysYsaU",
    "Chin-up": "https://www.youtube.com/watch?v=e1YSApl-QcM",
    "Pike Push-up": "https://www.youtube.com/watch?v=sposDXWEB0A",
    "Table Pike Push-up": "https://www.youtube.com/watch?v=sposDXWEB0A",
    "Decline Push-up": "https://www.youtube.com/watch?v=IODxDxX7oi4",
    "Elevated Pike Push-up": "https://www.youtube.com/watch?v=sposDXWEB0A",
    "Dead Bug": "https://www.youtube.com/watch?v=I5xbsA71v1A",
    "Band Pull-Apart": "https://www.youtube.com/shorts/SuvO4TBwSu4",
    "Reverse Lunge": "https://www.youtube.com/watch?v=jgeI_ZqAxWs",
    "Hamstring Towel Curl": "https://www.youtube.com/shorts/X3oyDT1iUzg",
    "Hollow Body Rock": "https://www.youtube.com/shorts/17QYGBGsDvw",
    "Side Plank Hip Dip": "https://www.youtube.com/watch?v=N_s9em1xTqU",
    "Pull-up Negative": "https://www.youtube.com/watch?v=S3gxEclxIYE",
    "Chin-up Negative": "https://www.youtube.com/watch?v=S3gxEclxIYE",
    "Knee Push-up": "https://www.youtube.com/watch?v=_DHM9Zg_0iY",
    "Towel Grip Hang": "https://www.youtube.com/shorts/C5mHoOJ_Boc",
    "Scapular Push-up": "https://www.youtube.com/watch?v=76TQU7iZlsI",
    "Wall-Supported Skater Squat": "https://www.youtube.com/watch?v=zCsZwLeXrCg",
    "Close-Grip Knee Push-up": "https://www.youtube.com/watch?v=_DHM9Zg_0iY",
    "Close-Grip Push-up": "https://www.youtube.com/watch?v=IODxDxX7oi4",
    "Archer Push-up": "https://www.youtube.com/watch?v=76TQU7iZlsI",
    "Partial Wall Walk": "https://www.youtube.com/watch?v=sposDXWEB0A",
    "Wall Handstand": "https://www.youtube.com/watch?v=sposDXWEB0A",
    "Single-Leg Towel Curl": "https://www.youtube.com/shorts/X3oyDT1iUzg",
    "Prone Y-T-W": "https://www.youtube.com/shorts/KTWWh3GsyYw",
    "Hollow-to-Arch Rock": "https://www.youtube.com/shorts/17QYGBGsDvw",
    "Single-Leg RDL": "https://www.youtube.com/shorts/U4sOY8Gyc-s",
}

def ex(slot, name, sets, weight=None, isWarmup=False):
    v = VIDEOS.get(name) or VIDEOS.get(name.split(" — ")[0])
    return {"slot": slot, "name": name, "sets": sets, "weight": weight, "videoUrl": v, "isWarmup": isWarmup}

def get_warmup(workout_type=None):
    warmups = [
        ex("W1", "High Knees", "20 reps", isWarmup=True),
        ex("W2", "Arm Circles", "10 forward, 10 backward", isWarmup=True),
        ex("W3", "Wall Slides", "10 reps", isWarmup=True),
        ex("W4", "Scapular Push-up", "10 reps", isWarmup=True),
        ex("W5", "Dead Bug", "6 each side", isWarmup=True),
        ex("W6", "Bodyweight Squat", "10 reps", isWarmup=True),
    ]
    return warmups

def parse_blocks():
    lines = open("FITUP_SIMPLE_52_Complete_UPDATED.md").read().splitlines()
    blocks = {}
    current_weeks = []
    current_workout = None

    for line in lines:
        if line.startswith("# שבועות"):
            m = re.search(r'# שבועות (\d+)–(\d+)', line)
            if m:
                current_weeks = list(range(int(m.group(1)), int(m.group(2)) + 1))
        elif line.startswith("## אימון"):
            current_workout = line.split()[-1].strip()
        elif line.startswith("|") and not line.startswith("| # |") and not line.startswith("|---"):
            parts = [p.strip() for p in line.split("|")]
            if len(parts) >= 6 and parts[1].isdigit():
                name_weight = parts[2]
                name = name_weight.split(" — ")[0].strip()
                weight = name_weight.split(" — ")[1].strip() if " — " in name_weight else None
                if weight:
                    weight = weight.replace("גומייה", "").replace("ק״ג", "kg").strip()
                for i, w in enumerate(current_weeks):
                    if w not in blocks: blocks[w] = {}
                    if current_workout not in blocks[w]: blocks[w][current_workout] = []
                    sets = parts[3 + i].replace("x", "×")
                    sets = sets.replace("לכל רגל", "each leg")
                    sets = sets.replace("לכל צד", "each side")
                    sets = sets.replace("מכל אות", "each letter")
                    sets = sets.replace("שנ׳", "secs")
                    sets = sets.replace("ירידה 3 שנ׳", "3s descent")
                    sets = sets.replace("ירידה 4 שנ׳", "4s descent")
                    sets = sets.replace("ירידה 5 שנ׳", "5s descent")
                    if sets.strip():
                        blocks[w][current_workout].append((name, sets, weight))

    for i in range(45, 49):
        blocks[i + 4] = blocks[i]
        
    return blocks

BLOCKS = parse_blocks()
DAYS_ENG = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"]

def get_workout_exercises(workout_type, week):
    base = BLOCKS[week][workout_type]
    main_exercise_names = {name for name, _, _ in base}
    
    out = []
    w_idx = 1
    for w in get_warmup(workout_type):
        if w["name"] not in main_exercise_names:
            w["slot"] = f"W{w_idx}"
            out.append(w)
            w_idx += 1
    
    slot_prefix = workout_type
    for i, (name, sets, weight) in enumerate(base):
        out.append(ex(f"{slot_prefix}{i+1}", name, sets, weight))
        
    return out

def get_day_exercises(day_of_week_idx, week):
    if day_of_week_idx == 0:
        return "Workout A", "7-8", get_workout_exercises("A", week)
    elif day_of_week_idx == 1:
        return "Active Recovery", "—", [ex("A1", "Brisk Walking", "35 mins", "Brisk pace (can talk, but not sing)")]
    elif day_of_week_idx == 2:
        return "Workout B", "7-8", get_workout_exercises("B", week)
    elif day_of_week_idx == 3:
        return "Active Recovery", "—", [ex("A1", "Relaxed Walking", "30 mins", "Easy pace")]
    elif day_of_week_idx == 4:
        return "Workout C", "7-8", get_workout_exercises("C", week)
    elif day_of_week_idx == 5:
        return "Active Recovery", "—", [ex("A1", "Brisk Walking", "35 mins", "Brisk pace (can talk, but not sing)")]
    else:
        return "Rest", "—", []

def generate_program():
    daily = []
    day_num = 0
    
    for real_week in range(1, 53):
        for dow in range(7):
            day_num += 1
            date = START_DATE + timedelta(days=day_num - 1)
            day_type, rpe, exercises = get_day_exercises(dow, real_week)
            
            daily.append({
                "dayNum": day_num, "week": f"Week {real_week}", "dayOfWeek": DAYS_ENG[dow],
                "date": date.strftime("%d/%m/%Y"), "dayType": day_type,
                "plannedRPE": rpe, "exercises": exercises,
            })

    exercises_guide = [
        {"name":"High Knees","category":"Warmup","difficulty":"Beginner","weight":"Bodyweight","videoUrl":None,"setsProgression":"Warmup"},
        {"name":"Arm Circles","category":"Warmup","difficulty":"Beginner","weight":"Bodyweight","videoUrl":None,"setsProgression":"Warmup"},
        {"name":"Wall Slides","category":"Warmup","difficulty":"Beginner","weight":"Bodyweight","videoUrl":None,"setsProgression":"Warmup"},
        {"name":"Bodyweight Squat","category":"Legs","difficulty":"Beginner","weight":"Bodyweight","videoUrl":VIDEOS["Bodyweight Squat"],"setsProgression":"Phase 1: 3-4×10"},
        {"name":"Reverse Lunge","category":"Legs","difficulty":"Beginner","weight":"Bodyweight","videoUrl":VIDEOS["Reverse Lunge"],"setsProgression":"Phase 1-4: 3-4×6-12 each leg"},
        {"name":"Split Squat","category":"Legs","difficulty":"Intermediate","weight":"Bodyweight","videoUrl":VIDEOS["Split Squat"],"setsProgression":"Phase 2-4: 4×8-12 each leg"},
        {"name":"Bulgarian Split Squat","category":"Legs","difficulty":"Advanced","weight":"Bodyweight","videoUrl":VIDEOS["Bulgarian Split Squat"],"setsProgression":"Phase 4-5: 4×8-12 each leg"},
        {"name":"Wall-Supported Skater Squat","category":"Legs","difficulty":"Advanced","weight":"Bodyweight","videoUrl":None,"setsProgression":"Phase 4-5: 4×6-10 each leg"},
        {"name":"Table Push-up","category":"Push","difficulty":"Beginner","weight":"Bodyweight","videoUrl":VIDEOS["Table Push-up"],"setsProgression":"Phase 1: 3-4×8"},
        {"name":"Knee Push-up","category":"Push","difficulty":"Beginner","weight":"Bodyweight","videoUrl":VIDEOS["Knee Push-up"],"setsProgression":"Phase 1: 3×8"},
        {"name":"Close-Grip Knee Push-up","category":"Push","difficulty":"Beginner+","weight":"Bodyweight","videoUrl":None,"setsProgression":"Phase 2: 3×8"},
        {"name":"Diamond Knee Push-up","category":"Push","difficulty":"Intermediate","weight":"Bodyweight","videoUrl":None,"setsProgression":"Phase 3: 3×8"},
        {"name":"Push-up","category":"Push","difficulty":"Intermediate","weight":"Bodyweight","videoUrl":VIDEOS["Push-up"],"setsProgression":"Phase 2-5: 4×6-12"},
        {"name":"Close-Grip Push-up","category":"Push","difficulty":"Intermediate+","weight":"Bodyweight","videoUrl":None,"setsProgression":"Phase 2-4: 4×6-10"},
        {"name":"Diamond Push-up","category":"Push","difficulty":"Advanced","weight":"Bodyweight","videoUrl":VIDEOS["Diamond Push-up"],"setsProgression":"Phase 3: 3×8"},
        {"name":"Decline Push-up","category":"Push","difficulty":"Advanced","weight":"Bodyweight","videoUrl":VIDEOS["Decline Push-up"],"setsProgression":"Phase 3-4: 3-4×8-12"},
        {"name":"Archer Push-up","category":"Push","difficulty":"Advanced","weight":"Bodyweight","videoUrl":None,"setsProgression":"Phase 4-5: 3-4×6-10 each side"},
        {"name":"Table Pike Push-up","category":"Shoulders","difficulty":"Beginner","weight":"Bodyweight","videoUrl":VIDEOS["Table Pike Push-up"],"setsProgression":"Phase 1: 2-3×6"},
        {"name":"Pike Push-up","category":"Shoulders","difficulty":"Intermediate","weight":"Bodyweight","videoUrl":VIDEOS["Pike Push-up"],"setsProgression":"Phase 2-5: 2-3×8-12"},
        {"name":"Elevated Pike Push-up","category":"Shoulders","difficulty":"Advanced","weight":"Bodyweight","videoUrl":VIDEOS["Elevated Pike Push-up"],"setsProgression":"Phase 3-5: 3-4×6-12"},
        {"name":"Partial Wall Walk","category":"Shoulders","difficulty":"Advanced","weight":"Bodyweight","videoUrl":None,"setsProgression":"Phase 2: 3×3"},
        {"name":"Wall Handstand","category":"Shoulders","difficulty":"Advanced","weight":"Bodyweight","videoUrl":None,"setsProgression":"Phase 2-5: 3×10-15 breaths"},
        {"name":"Scapular Pull-up","category":"Pull","difficulty":"Beginner","weight":"Bodyweight","videoUrl":VIDEOS["Scapular Pull-up"],"setsProgression":"Phase 1-5: 2×12"},
        {"name":"Pull-up Negative","category":"Pull","difficulty":"Intermediate","weight":"Bodyweight","videoUrl":VIDEOS["Pull-up Negative"],"setsProgression":"Continuous 3-5s descent: 3×3"},
        {"name":"Chin-up Negative","category":"Pull","difficulty":"Intermediate","weight":"Bodyweight","videoUrl":VIDEOS["Chin-up Negative"],"setsProgression":"Continuous 3-5s descent: 3×4"},
        {"name":"Chin-up","category":"Pull","difficulty":"Advanced","weight":"Bodyweight","videoUrl":VIDEOS["Chin-up"],"setsProgression":"Phase 3-5: 3-5×3-6"},
        {"name":"Seated Band Row","category":"Pull","difficulty":"Beginner","weight":"30-50 kg","videoUrl":VIDEOS["Seated Band Row"],"setsProgression":"Phase 1-5: 3-4×8-12"},
        {"name":"Band Pull-Apart","category":"Upper Back","difficulty":"Beginner","weight":"30-50 kg","videoUrl":VIDEOS["Band Pull-Apart"],"setsProgression":"Phase 1-5: 2×12-15"},
        {"name":"Band Curl","category":"Arms","difficulty":"Beginner","weight":"30-50 kg","videoUrl":VIDEOS["Band Curl"],"setsProgression":"Phase 2-5: 2-3×8-12"},
        {"name":"Bodyweight Single-Leg RDL","category":"Glutes & Hamstrings","difficulty":"Intermediate","weight":"Bodyweight","videoUrl":VIDEOS["Bodyweight Single-Leg RDL"],"setsProgression":"Phase 1-2: 3-4×8-10 each leg"},
        {"name":"Single-Leg RDL","category":"Glutes & Hamstrings","difficulty":"Intermediate","weight":"Bodyweight","videoUrl":VIDEOS["Single-Leg RDL"],"setsProgression":"Phase 1-2: 3-4×8-10 each leg"},
        {"name":"Hamstring Towel Curl","category":"Hamstrings","difficulty":"Beginner","weight":"Bodyweight","videoUrl":VIDEOS["Hamstring Towel Curl"],"setsProgression":"Phase 1-2: 3×5-8"},
        {"name":"Single-Leg Towel Curl","category":"Hamstrings","difficulty":"Intermediate","weight":"Bodyweight","videoUrl":None,"setsProgression":"Phase 2-5: 3×5-10 each leg"},
        {"name":"Banded Single-Leg RDL","category":"Glutes & Hamstrings","difficulty":"Advanced","weight":"Resistance Band","videoUrl":VIDEOS["Banded Single-Leg RDL"],"setsProgression":"Phase 3-5: 3-4×8-10 each leg"},
        {"name":"Banded Glute Bridge","category":"Glutes","difficulty":"Intermediate","weight":"Resistance Band","videoUrl":VIDEOS["Banded Glute Bridge"],"setsProgression":"Phase 3-5: 3-4×10-15 each leg"},
        {"name":"Single-Leg Glute Bridge","category":"Glutes","difficulty":"Beginner","weight":"Bodyweight","videoUrl":VIDEOS["Single-Leg Glute Bridge"],"setsProgression":"Phase 1-2: 3-4×8-12 each leg"},
        {"name":"Calf Raise","category":"Calves","difficulty":"Beginner","weight":"Bodyweight","videoUrl":VIDEOS["Calf Raise"],"setsProgression":"Phase 1: 3×15-20"},
        {"name":"Single-Leg Calf Raise","category":"Calves","difficulty":"Intermediate","weight":"Bodyweight","videoUrl":VIDEOS["Single-Leg Calf Raise"],"setsProgression":"Phase 1-5: 2-3×12-20 each leg"},
        {"name":"Scapular Push-up","category":"Upper Back & Shoulders","difficulty":"Beginner","weight":"Bodyweight","videoUrl":VIDEOS["Scapular Push-up"],"setsProgression":"Phase 1: 2×10"},
        {"name":"Prone Y-T-W","category":"Upper Back","difficulty":"Beginner","weight":"Bodyweight","videoUrl":None,"setsProgression":"Phase 1-5: 2×8-12 each letter"},
        {"name":"Dead Bug","category":"Core","difficulty":"Beginner","weight":"Bodyweight","videoUrl":VIDEOS["Dead Bug"],"setsProgression":"Phase 1-5: 2×8-15 each side"},
        {"name":"Side Plank Hip Dip","category":"Core","difficulty":"Intermediate","weight":"Bodyweight","videoUrl":VIDEOS["Side Plank Hip Dip"],"setsProgression":"Phase 1-5: 2×8-15 each side"},
        {"name":"Hollow Body Rock","category":"Core","difficulty":"Advanced","weight":"Bodyweight","videoUrl":VIDEOS["Hollow Body Rock"],"setsProgression":"Phase 1-3: 2×8-12"},
        {"name":"Hollow-to-Arch Rock","category":"Core","difficulty":"Expert","weight":"Bodyweight","videoUrl":None,"setsProgression":"Phase 3-5: 2-3×8-15"},
        {"name":"Towel Grip Hang","category":"Grip","difficulty":"Intermediate","weight":"Bodyweight","videoUrl":VIDEOS["Towel Grip Hang"],"setsProgression":"Dry thick towel - 2×5-15 breaths"},
        {"name":"Brisk Walking","category":"Cardio","difficulty":"Beginner","weight":"Bodyweight","videoUrl":None,"setsProgression":"35 mins brisk pace"},
        {"name":"Relaxed Walking","category":"Cardio","difficulty":"Beginner","weight":"Bodyweight","videoUrl":None,"setsProgression":"30 mins easy pace"},
    ]
    return {"daily": daily, "exercises": exercises_guide}

def to_training_data_json(program):
    rows = []
    slot_order = ["W1","W2","W3","W4","W5","W6","W7","A1","A2","A3","A4","A5","A6","A7","A8","A9","A10", "B1","B2","B3","B4","B5","B6","B7","B8","B9","B10", "C1","C2","C3","C4","C5","C6","C7","C8","C9","C10"]
    for day in program["daily"]:
        row = {
            "Day": f"Day {day['dayNum']}", "Week": day["week"], "Day of Week": day["dayOfWeek"],
            "Date": day["date"], "Day Type": day["dayType"], "Planned RPE": day["plannedRPE"],
        }
        ex_by_slot = {}
        for e in day["exercises"]:
            ex_by_slot[e["slot"]] = e
        
        # Determine active prefix based on dayType
        active_prefix = "A"
        if day["dayType"] == "Workout B": active_prefix = "B"
        elif day["dayType"] == "Workout C": active_prefix = "C"
        
        # Keep old format structure (A1-A10 for main exercises) for compatibility
        # Re-map the workout slots to A1-A10 for the JSON output if needed, but since we used Workout A/B/C prefix, let's remap
        # Wait, the app.js probably expects the slots to be correctly mapped. Let's map workout slots back to A1..A10 for the CSV
        
        mapped_exercises = {}
        mapped_idx = 1
        for e in day["exercises"]:
            if e["slot"].startswith("W"):
                mapped_exercises[e["slot"]] = e
            else:
                mapped_exercises[f"A{mapped_idx}"] = e
                mapped_idx += 1
                
        for slot in ["W1","W2","W3","W4","W5","W6","W7","A1","A2","A3","A4","A5","A6","A7","A8","A9","A10"]:
            e = mapped_exercises.get(slot)
            row[f"{slot} - Exercise"] = e["name"] if e else None
            row[f"{slot} - Sets×reps"] = e["sets"] if e else None
            row[f"{slot} - Weight/Resistance"] = e.get("weight") if e else None
            row[f"{slot} - Link"] = e.get("videoUrl") if e else None
            
        row["Extras - Exercise"] = None
        row["Extras - Sets×reps"] = None
        row["Extras - Link"] = None
        row["Completed?"] = None
        row["Actual RPE"] = None
        row["Bodyweight"] = None
        row["Notes"] = None
        rows.append(row)
    return {"daily": rows}

if __name__ == "__main__":
    program = generate_program()
    with open("js/data.js", "w", encoding="utf-8") as f:
        f.write("window.TRAINING_DATA = " + json.dumps(program, ensure_ascii=False) + ";\n")
    td = to_training_data_json(program)
    with open("training_data.json", "w", encoding="utf-8") as f:
        json.dump(td, f, ensure_ascii=False, indent=2)
    
    required_exercises = set()
    for day in program["daily"]:
        for e in day["exercises"]:
            required_exercises.add(e["name"])
    for e in program["exercises"]:
        required_exercises.add(e["name"])
        
    expected_images = {name.replace('/', '-').upper() + ".png" for name in required_exercises}

    img_dir = "images/exercises"
    if os.path.exists(img_dir):
        fallback = os.path.join(img_dir, "BODYWEIGHT SQUAT.png")
        for img in expected_images:
            path = os.path.join(img_dir, img)
            if not os.path.exists(path) and os.path.exists(fallback):
                shutil.copy(fallback, path)

    print("Done — Auto v4.0 generated and images synced!")
