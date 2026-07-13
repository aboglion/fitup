#!/usr/bin/env python3
"""Generate FitUp Pro Hybrid v5.0 — 52-week training program."""
import json, os, shutil
from datetime import datetime, timedelta

START_DATE = datetime(2026, 7, 5)
DAYS_ENG = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"]

def ex(slot, name, sets, weight=None, isWarmup=False):
    return {"slot": slot, "name": name, "sets": sets, "weight": weight, "isWarmup": isWarmup}

def get_warmup():
    return [
        ex("W1", "High Knees", "20 reps", isWarmup=True),
        ex("W2", "Arm Circles", "10 forward, 10 backward", isWarmup=True),
        ex("W3", "Wall Slides", "10 reps", isWarmup=True),
        ex("W4", "Scapular Push-up", "10 reps", isWarmup=True),
        ex("W5", "Dead Bug", "6 each side", isWarmup=True),
    ]

# Phase definitions: (week_start, week_end) -> exercises per day type
# Volume pattern per 3-week block: week1=intro, week2=build, week3=peak
# Deload weeks: 6,12,18,24,30,36,42,48,52

DELOAD_WEEKS = {6,12,18,24,30,36,42,48,52}

def get_block_position(week):
    """Returns (block_week_1_based, is_deload) for volume scaling."""
    if week in DELOAD_WEEKS:
        return (0, True)
    # Find which 3-week sub-block within 6-week cycle
    cycle_pos = (week - 1) % 6  # 0-5
    if cycle_pos < 3:
        return (cycle_pos + 1, False)  # weeks 1,2,3 of first sub-block
    else:
        return (cycle_pos - 2, False)  # weeks 1,2,3 of second sub-block

def get_phase(week):
    """Get exercise phase (1-based) from week number."""
    phases = [
        (1, 3, 1), (4, 6, 2), (7, 9, 3), (10, 12, 4),
        (13, 15, 5), (16, 18, 6), (19, 21, 7), (22, 24, 8), (25, 52, 9)
    ]
    for s, e, p in phases:
        if s <= week <= e:
            return p
    return 9

def get_leg_phase(week):
    phases = [
        (1, 3, 1), (4, 6, 2), (7, 9, 3), (10, 12, 4),
        (13, 15, 5), (16, 18, 6), (19, 21, 7), (22, 24, 8),
        (25, 27, 9), (28, 52, 10)
    ]
    for s, e, p in phases:
        if s <= week <= e:
            return p
    return 10

def get_volume(week):
    """Returns (sets_main, reps_main) based on block position."""
    pos, is_deload = get_block_position(week)
    phase = get_phase(week)
    
    if is_deload:
        if phase <= 4:
            return "2", "4-5" if phase >= 3 else "6-8"
        return "2", "3-4"
    
    if phase <= 3:  # Beginner
        if pos == 1: return "3", "8-10"
        if pos == 2: return "3", "10-12"
        return "4", "8-12"
    elif phase <= 6:  # Intermediate
        if pos == 1: return "3", "6-8"
        if pos == 2: return "3", "8-10"
        return "4", "6-10"
    else:  # Advanced
        if pos == 1: return "3", "3-5"
        if pos == 2: return "3", "5-7"
        return "4", "3-8"

def fmt_sets(sets_n, reps):
    return f"{sets_n}×{reps}"

def get_lower_exercises(week):
    sets_n, reps = get_volume(week)
    phase = get_leg_phase(week)
    exercises = []
    
    # Mobility for Pistol Squat
    if phase >= 9:
        exercises.append(("Ankle Dorsiflexion Mobility", "1-2 mins per side", None))
    
    # Quad Dominant
    if phase == 1:
        exercises.append(("Bodyweight Squat", fmt_sets(sets_n, reps), None))
    elif phase == 2:
        exercises.append(("Reverse Lunge", fmt_sets(sets_n, reps), None))
    elif phase == 3 or phase == 4:
        exercises.append(("Split Squat", fmt_sets(sets_n, reps), None))
    elif phase == 5 or phase == 6:
        exercises.append(("Bulgarian Split Squat", fmt_sets(sets_n, reps), None))
    elif phase == 7 or phase == 8:
        exercises.append(("Wall-Supported Skater Squat", fmt_sets(sets_n, reps), None))
    elif phase == 9:
        exercises.append(("Pistol Squat to Chair", fmt_sets(sets_n, reps), None))
    else:
        exercises.append(("Full Pistol Squat", fmt_sets(sets_n, reps), None))
        
    # Hamstring Dominant
    if phase == 1 or phase == 2:
        exercises.append(("Bodyweight Single-Leg RDL", fmt_sets(sets_n, reps), None))
    elif phase == 3 or phase == 5 or phase == 7 or phase == 9:
        exercises.append(("Hamstring Towel Curl", fmt_sets(sets_n, reps), None))
    elif phase == 4 or phase == 6 or phase == 8 or phase == 10:
        exercises.append(("Banded Single-Leg RDL", fmt_sets(sets_n, reps), "30 kg"))
    
    # Glute
    if phase <= 4:
        exercises.append(("Single-Leg Glute Bridge", fmt_sets(sets_n, "10-12"), None))
    else:
        exercises.append(("Banded Glute Bridge", fmt_sets(sets_n, "12-15"), "30 kg"))
    
    # Calf
    if phase <= 1:
        exercises.append(("Calf Raise", fmt_sets(sets_n, "15-20"), None))
    else:
        exercises.append(("Single-Leg Calf Raise", fmt_sets(sets_n, "15-20"), None))
    
    # Core
    if phase <= 3:
        if phase == 1:
            exercises.append(("Dead Bug", fmt_sets(sets_n, reps), None))
        else:
            exercises.append(("Hollow Body Rock", fmt_sets(sets_n, reps), None))
    elif phase == 4:
        exercises.append(("Hollow-to-Arch Rock", fmt_sets(sets_n, reps), None))
    elif phase <= 6:
        hold = fmt_sets(sets_n, "15-30 secs")
        if phase == 5:
            exercises.append(("L-sit on Chair", hold, None))
        else:
            exercises.append(("L-sit on Floor", hold, None))
    elif phase == 7:
        exercises.append(("Dragon Flag Negative", fmt_sets(sets_n, reps), None))
    elif phase == 8:
        exercises.append(("Dragon Flag (Partial ROM)", fmt_sets(sets_n, reps), None))
    else:
        exercises.append(("Dragon Flag", fmt_sets(sets_n, reps), None))
    
    return exercises

def get_push_exercises(week):
    sets_n, reps = get_volume(week)
    phase = get_phase(week)
    exercises = []
    
    # Prehab
    exercises.append(("Band Pull-Apart", "2-3×15-20", "30 kg"))
    exercises.append(("Seated Band Row", "3-4×8-12", "30 kg"))
    
    # Main push
    if phase == 1:
        exercises.append(("Table Push-up", fmt_sets(sets_n, reps), None))
        exercises.append(("Knee Push-up", fmt_sets(sets_n, reps), None))
    elif phase == 2:
        exercises.append(("Push-up", fmt_sets(sets_n, reps), None))
    elif phase == 3:
        exercises.append(("Close-Grip Push-up", fmt_sets(sets_n, reps), None))
    elif phase == 4:
        exercises.append(("Diamond Push-up", fmt_sets(sets_n, reps), None))
    elif phase == 5:
        exercises.append(("Decline Push-up", fmt_sets(sets_n, reps), None))
    elif phase == 6:
        exercises.append(("Archer Push-up", fmt_sets(sets_n, reps), None))
    elif phase == 7:
        exercises.append(("Archer Push-up", fmt_sets(sets_n, reps), None))
    elif phase == 8:
        exercises.append(("One-Arm Push-up Lean", fmt_sets(sets_n, reps), None))
    else:
        exercises.append(("One-Arm Push-up Lean", fmt_sets(sets_n, reps), None))
        exercises.append(("Pseudo-Planche Lean", fmt_sets(sets_n, reps), None))
    
    # Shoulder
    hold = fmt_sets(sets_n, "15-30 secs")
    if phase == 1:
        exercises.append(("Table Pike Push-up", fmt_sets(sets_n, reps), None))
    elif phase == 2:
        exercises.append(("Pike Push-up", fmt_sets(sets_n, reps), None))
    elif phase == 3:
        exercises.append(("Elevated Pike Push-up", fmt_sets(sets_n, reps), None))
    elif phase == 4:
        exercises.append(("Wall Handstand", hold, None))
    elif phase == 5:
        exercises.append(("Wall Walk (Full)", fmt_sets(sets_n, reps), None))
    elif phase == 6:
        exercises.append(("Wall Walk (Full)", fmt_sets(sets_n, reps), None))
    elif phase == 7:
        exercises.append(("Wall Handstand Push-up Negative", hold, None))
    elif phase == 8:
        exercises.append(("Wall Handstand Push-up Negative", hold, None))
    else:
        exercises.append(("Handstand Push-up", fmt_sets(sets_n, reps), None))
    
    # Prehab finisher
    exercises.append(("Prone Y-T-W", "2-3×8-12", None))
    
    return exercises

def get_pull_exercises(week):
    sets_n, reps = get_volume(week)
    phase = get_phase(week)
    exercises = []
    
    # Skill work
    exercises.append(("Handstand Practice", "10-15 mins", None))
    
    # L-sit practice (from phase 5+)
    if phase >= 5:
        exercises.append(("L-sit Practice", "5-10 mins", None))
        
    # Scapular (warmup for pull)
    exercises.append(("Scapular Pull-up", "2×10-15", None))
    
    # Main pull
    if phase == 1:
        exercises.append(("Scapular Pull-up", fmt_sets(sets_n, reps), None))
        exercises.append(("Dead Hang", fmt_sets(sets_n, "15-30 secs"), None))
    elif phase == 2:
        exercises.append(("Pull-up Negative", fmt_sets(sets_n, reps), None))
    elif phase == 3:
        exercises.append(("Pull-up Negative", fmt_sets(sets_n, reps), None))
    elif phase == 4:
        exercises.append(("Chin-up Negative", fmt_sets(sets_n, reps), None))
    elif phase == 5:
        exercises.append(("Chin-up", fmt_sets(sets_n, reps), None))
    elif phase == 6:
        exercises.append(("Chin-up", fmt_sets(sets_n, reps), None))
    elif phase == 7:
        exercises.append(("Pull-up (Overhand)", fmt_sets(sets_n, reps), None))
    elif phase == 8:
        exercises.append(("Pull-up (Overhand)", fmt_sets(sets_n, reps), None))
    else:
        exercises.append(("Explosive Pull-up", fmt_sets(sets_n, reps), None))
        exercises.append(("Tuck Front Lever Row", fmt_sets(sets_n, reps), None))
    
    # Band Curl
    exercises.append(("Band Curl", "2-3×12-15", "30 kg"))
    
    # Towel Grip Hang (from phase 3+)
    if phase >= 3:
        exercises.append(("Towel Grip Hang", "2×20-30 secs", None))
    
    # Core finisher
    if phase <= 3:
        if phase == 1:
            exercises.append(("Dead Bug", fmt_sets(sets_n, reps), None))
        else:
            exercises.append(("Hollow Body Rock", fmt_sets(sets_n, reps), None))
    elif phase == 4:
        exercises.append(("Hollow-to-Arch Rock", fmt_sets(sets_n, reps), None))
    elif phase == 5:
        exercises.append(("L-sit on Chair", fmt_sets(sets_n, "15-30 secs"), None))
    elif phase == 6:
        exercises.append(("L-sit on Floor", fmt_sets(sets_n, "15-30 secs"), None))
    elif phase == 7:
        exercises.append(("Dragon Flag Negative", fmt_sets(sets_n, reps), None))
    elif phase == 8:
        exercises.append(("Dragon Flag (Partial ROM)", fmt_sets(sets_n, reps), None))
    else:
        exercises.append(("Dragon Flag", fmt_sets(sets_n, reps), None))
    
    exercises.append(("Side Plank Hip Dip", "2-3×8-10", None))
    
    return exercises

def build_exercise_list(raw_exercises, warmup=True):
    out = []
    if warmup:
        out = get_warmup()
    idx = 1
    for name, sets, weight in raw_exercises:
        out.append(ex(f"A{idx}", name, sets, weight))
        idx += 1
    return out

def get_day(dow, week):
    if dow == 0:  # Sunday - Lower Strength
        raw = get_lower_exercises(week)
        return "Lower Strength", "7-8", build_exercise_list(raw)
    elif dow == 1:  # Monday - Walk
        return "Active Recovery", "—", [ex("A1", "Brisk Walking", "30 mins")]
    elif dow == 2:  # Tuesday - Upper Push
        raw = get_push_exercises(week)
        return "Upper Push", "7-8", build_exercise_list(raw)
    elif dow == 3:  # Wednesday - Walk
        return "Active Recovery", "—", [ex("A1", "Relaxed Walking", "25 mins")]
    elif dow == 4:  # Thursday - Upper Pull + Skill
        raw = get_pull_exercises(week)
        return "Upper Pull + Skill", "7-8", build_exercise_list(raw)
    elif dow == 5:  # Friday - Walk
        return "Active Recovery", "—", [ex("A1", "Brisk Walking", "30 mins")]
    else:  # Saturday - Rest
        return "Rest", "—", []

def generate_program():
    daily = []
    day_num = 0
    for week in range(1, 53):
        for dow in range(7):
            day_num += 1
            date = START_DATE + timedelta(days=day_num - 1)
            day_type, rpe, exercises = get_day(dow, week)
            daily.append({
                "dayNum": day_num, "week": f"Week {week}",
                "dayOfWeek": DAYS_ENG[dow],
                "date": date.strftime("%d/%m/%Y"),
                "dayType": day_type,
                "plannedRPE": rpe, "exercises": exercises,
            })
    
    exercises_guide = [
        {"name":"High Knees","category":"Warmup","difficulty":"Beginner","weight":"Bodyweight","setsProgression":"Warmup"},
        {"name":"Arm Circles","category":"Warmup","difficulty":"Beginner","weight":"Bodyweight","setsProgression":"Warmup"},
        {"name":"Wall Slides","category":"Warmup","difficulty":"Beginner","weight":"Bodyweight","setsProgression":"Warmup"},
        {"name":"Scapular Push-up","category":"Warmup","difficulty":"Beginner","weight":"Bodyweight","setsProgression":"Warmup"},
        {"name":"Dead Bug","category":"Core","difficulty":"Beginner","weight":"Bodyweight","setsProgression":"Phase 1: 3-4×8-12"},
        {"name":"Bodyweight Squat","category":"Legs","difficulty":"Beginner","weight":"Bodyweight","setsProgression":"Phase 1: 3-4×8-12"},
        {"name":"Reverse Lunge","category":"Legs","difficulty":"Beginner","weight":"Bodyweight","setsProgression":"Phase 2: 3-4×8-12"},
        {"name":"Split Squat","category":"Legs","difficulty":"Intermediate","weight":"Bodyweight","setsProgression":"Phase 3-4: 3-4×8-12"},
        {"name":"Bodyweight Single-Leg RDL","category":"Legs","difficulty":"Intermediate","weight":"Bodyweight","setsProgression":"Phase 1-2: 3-4×8-12"},
        {"name":"Hamstring Towel Curl","category":"Legs","difficulty":"Intermediate","weight":"Bodyweight","setsProgression":"Phases 3, 5, 7, 9: 3-4×6-10"},
        {"name":"Bulgarian Split Squat","category":"Legs","difficulty":"Advanced","weight":"Bodyweight","setsProgression":"Phase 5-6: 3-4×6-10"},
        {"name":"Banded Single-Leg RDL","category":"Legs","difficulty":"Advanced","weight":"30 kg","setsProgression":"Phases 4, 6, 8, 10: 3-4×6-10"},
        {"name":"Wall-Supported Skater Squat","category":"Legs","difficulty":"Advanced","weight":"Bodyweight","setsProgression":"Phase 7-8: 3-4×3-8"},
        {"name":"Pistol Squat to Chair","category":"Legs","difficulty":"Expert","weight":"Bodyweight","setsProgression":"Phase 9: 3-4×3-8"},
        {"name":"Full Pistol Squat","category":"Legs","difficulty":"Elite","weight":"Bodyweight","setsProgression":"Phase 10: 3-4×3-8"},
        {"name":"Single-Leg Glute Bridge","category":"Glutes","difficulty":"Beginner","weight":"Bodyweight","setsProgression":"Phase 1-4: 3-4×10-12"},
        {"name":"Banded Glute Bridge","category":"Glutes","difficulty":"Intermediate","weight":"30 kg","setsProgression":"Phase 5+: 3-4×12-15"},
        {"name":"Calf Raise","category":"Calves","difficulty":"Beginner","weight":"Bodyweight","setsProgression":"Phase 1: 3-4×15-20"},
        {"name":"Single-Leg Calf Raise","category":"Calves","difficulty":"Intermediate","weight":"Bodyweight","setsProgression":"Phase 2+: 3-4×15-20"},
        {"name":"Table Push-up","category":"Push","difficulty":"Beginner","weight":"Bodyweight","setsProgression":"Phase 1: 3-4×8-12"},
        {"name":"Knee Push-up","category":"Push","difficulty":"Beginner","weight":"Bodyweight","setsProgression":"Phase 1: 3-4×8-12"},
        {"name":"Push-up","category":"Push","difficulty":"Intermediate","weight":"Bodyweight","setsProgression":"Phase 2: 3-4×8-12"},
        {"name":"Close-Grip Push-up","category":"Push","difficulty":"Intermediate","weight":"Bodyweight","setsProgression":"Phase 3: 3-4×8-12"},
        {"name":"Diamond Push-up","category":"Push","difficulty":"Advanced","weight":"Bodyweight","setsProgression":"Phase 4: 3-4×6-10"},
        {"name":"Decline Push-up","category":"Push","difficulty":"Advanced","weight":"Bodyweight","setsProgression":"Phase 5: 3-4×6-10"},
        {"name":"Archer Push-up","category":"Push","difficulty":"Advanced","weight":"Bodyweight","setsProgression":"Phase 6-7: 3-4×3-8"},
        {"name":"One-Arm Push-up Lean","category":"Push","difficulty":"Expert","weight":"Bodyweight","setsProgression":"Phase 8+: 3-4×3-8"},
        {"name":"Pseudo-Planche Lean","category":"Push","difficulty":"Expert","weight":"Bodyweight","setsProgression":"Phase 9+: 3-4×3-8"},
        {"name":"Table Pike Push-up","category":"Shoulders","difficulty":"Beginner","weight":"Bodyweight","setsProgression":"Phase 1: 3-4×8-12"},
        {"name":"Pike Push-up","category":"Shoulders","difficulty":"Intermediate","weight":"Bodyweight","setsProgression":"Phase 2: 3-4×8-12"},
        {"name":"Elevated Pike Push-up","category":"Shoulders","difficulty":"Advanced","weight":"Bodyweight","setsProgression":"Phase 3: 3-4×8-12"},
        {"name":"Wall Handstand","category":"Shoulders","difficulty":"Advanced","weight":"Bodyweight","setsProgression":"Phase 4: 3×15-30 secs"},
        {"name":"Wall Walk (Full)","category":"Shoulders","difficulty":"Expert","weight":"Bodyweight","setsProgression":"Phase 5-6: 3-4×6-10"},
        {"name":"Wall Handstand Push-up Negative","category":"Shoulders","difficulty":"Expert","weight":"Bodyweight","setsProgression":"Phase 7-8: 3-4×15-30 secs"},
        {"name":"Handstand Push-up","category":"Shoulders","difficulty":"Elite","weight":"Bodyweight","setsProgression":"Phase 9+: 3-4×3-8"},
        {"name":"Band Pull-Apart","category":"Upper Back","difficulty":"Beginner","weight":"30 kg","setsProgression":"All phases: 2-3×15-20"},
        {"name":"Prone Y-T-W","category":"Upper Back","difficulty":"Beginner","weight":"Bodyweight","setsProgression":"All phases: 2-3×8-12"},
        {"name":"Scapular Pull-up","category":"Pull","difficulty":"Beginner","weight":"Bodyweight","setsProgression":"All phases: 2×10-15"},
        {"name":"Dead Hang","category":"Pull","difficulty":"Beginner","weight":"Bodyweight","setsProgression":"Phase 1: 3×15-30 secs"},
        {"name":"Pull-up Negative","category":"Pull","difficulty":"Intermediate","weight":"Bodyweight","setsProgression":"Phase 2-3: 3-4×8-12"},
        {"name":"Chin-up Negative","category":"Pull","difficulty":"Intermediate","weight":"Bodyweight","setsProgression":"Phase 4: 3-4×6-10"},
        {"name":"Chin-up","category":"Pull","difficulty":"Advanced","weight":"Bodyweight","setsProgression":"Phase 5-6: 3-4×6-10"},
        {"name":"Pull-up (Overhand)","category":"Pull","difficulty":"Advanced","weight":"Bodyweight","setsProgression":"Phase 7-8: 3-4×3-8"},
        {"name":"Explosive Pull-up","category":"Pull","difficulty":"Expert","weight":"Bodyweight","setsProgression":"Phase 9+: 3-4×3-8"},
        {"name":"Tuck Front Lever Row","category":"Pull","difficulty":"Elite","weight":"Bodyweight","setsProgression":"Phase 9+: 3-4×3-8"},
        {"name":"Band Curl","category":"Arms","difficulty":"Beginner","weight":"30 kg","setsProgression":"All phases: 2-3×12-15"},
        {"name":"Towel Grip Hang","category":"Grip","difficulty":"Intermediate","weight":"Bodyweight","setsProgression":"Phase 3+: 2×20-30 secs"},
        {"name":"Hollow Body Rock","category":"Core","difficulty":"Intermediate","weight":"Bodyweight","setsProgression":"Phase 2-3: 3-4×8-12"},
        {"name":"Hollow-to-Arch Rock","category":"Core","difficulty":"Advanced","weight":"Bodyweight","setsProgression":"Phase 4: 3-4×6-10"},
        {"name":"Side Plank Hip Dip","category":"Core","difficulty":"Intermediate","weight":"Bodyweight","setsProgression":"All phases: 2-3×8-10"},
        {"name":"L-sit on Chair","category":"Core","difficulty":"Advanced","weight":"Bodyweight","setsProgression":"Phase 5: 3-4×15-30 secs"},
        {"name":"L-sit on Floor","category":"Core","difficulty":"Expert","weight":"Bodyweight","setsProgression":"Phase 6: 3-4×15-30 secs"},
        {"name":"Dragon Flag Negative","category":"Core","difficulty":"Expert","weight":"Bodyweight","setsProgression":"Phase 7: 3-4×3-8"},
        {"name":"Dragon Flag (Partial ROM)","category":"Core","difficulty":"Elite","weight":"Bodyweight","setsProgression":"Phase 8: 3-4×3-8"},
        {"name":"Dragon Flag","category":"Core","difficulty":"Elite","weight":"Bodyweight","setsProgression":"Phase 9+: 3-4×3-8"},
        {"name":"Handstand Practice","category":"Skill","difficulty":"Intermediate","weight":"Bodyweight","setsProgression":"10-15 mins practice"},
        {"name":"L-sit Practice","category":"Skill","difficulty":"Advanced","weight":"Bodyweight","setsProgression":"Phase 5+: 5-10 mins practice"},
        {"name":"Seated Band Row","category":"Upper Back","difficulty":"Intermediate","weight":"30 kg","setsProgression":"All phases: 3-4×8-12"},
        {"name":"Ankle Dorsiflexion Mobility","category":"Warmup","difficulty":"Beginner","weight":"Bodyweight","setsProgression":"Phase 9+: 1-2 mins per side"},
        {"name":"Brisk Walking","category":"Cardio","difficulty":"Beginner","weight":"Bodyweight","setsProgression":"30 mins brisk pace"},
        {"name":"Relaxed Walking","category":"Cardio","difficulty":"Beginner","weight":"Bodyweight","setsProgression":"25 mins easy pace"},
    ]
    return {"daily": daily, "exercises": exercises_guide}

def to_training_data_json(program):
    rows = []
    for day in program["daily"]:
        row = {
            "Day": f"Day {day['dayNum']}", "Week": day["week"],
            "Day of Week": day["dayOfWeek"], "Date": day["date"],
            "Day Type": day["dayType"], "Planned RPE": day["plannedRPE"],
        }
        mapped = {}
        idx = 1
        for e in day["exercises"]:
            if e["slot"].startswith("W"):
                mapped[e["slot"]] = e
            else:
                mapped[f"A{idx}"] = e
                idx += 1
        for slot in ["W1","W2","W3","W4","W5","W6","W7","A1","A2","A3","A4","A5","A6","A7","A8","A9","A10"]:
            e = mapped.get(slot)
            row[f"{slot} - Exercise"] = e["name"] if e else None
            row[f"{slot} - Sets×reps"] = e["sets"] if e else None
            row[f"{slot} - Weight/Resistance"] = e.get("weight") if e else None
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
    
    required = set()
    for day in program["daily"]:
        for e in day["exercises"]:
            required.add(e["name"])
    for e in program["exercises"]:
        required.add(e["name"])
    
    expected = {name.replace('/', '-').upper() + ".png" for name in required}
    img_dir = "images/exercises"
    if os.path.exists(img_dir):
        fallback = os.path.join(img_dir, "BODYWEIGHT SQUAT.png")
        for img in expected:
            path = os.path.join(img_dir, img)
            if not os.path.exists(path) and os.path.exists(fallback):
                shutil.copy(fallback, path)
    
    print(f"Done — FitUp Pro Hybrid v5.0 generated! {len(program['daily'])} days, {len(program['exercises'])} exercises.")
