#!/usr/bin/env python3
"""Generate FitUp Pro v4.0 — 48-week training program + bands."""
import json
import re
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
    "Side Plank Hip Dips": "https://www.youtube.com/watch?v=N_s9em1xTqU",
    "Pull-up Negative": "https://www.youtube.com/watch?v=S3gxEclxIYE",
    "Chin-up Negative": "https://www.youtube.com/watch?v=S3gxEclxIYE",
    "Knee Push-up": "https://www.youtube.com/watch?v=_DHM9Zg_0iY",
    "Towel Grip Hang": "https://www.youtube.com/shorts/C5mHoOJ_Boc",
    "Scapular Push-up": "https://www.youtube.com/watch?v=76TQU7iZlsI",
    "Wall-Supported Skater Squat": "https://www.youtube.com/watch?v=zCsZwLeXrCg",
    "Close-Grip Knee Push-up": "https://www.youtube.com/watch?v=_DHM9Zg_0iY",
    "Diamond Knee Push-up": "https://www.youtube.com/watch?v=_DHM9Zg_0iY",
    "Close-Grip Push-up": "https://www.youtube.com/watch?v=IODxDxX7oi4",
    "Incline Archer Push-up": "https://www.youtube.com/watch?v=76TQU7iZlsI",
    "Partial Wall Walk": "https://www.youtube.com/watch?v=sposDXWEB0A",
    "Wall Handstand": "https://www.youtube.com/watch?v=sposDXWEB0A",
    "Single-Leg Towel Curl": "https://www.youtube.com/shorts/X3oyDT1iUzg",
    "Prone Y-T-W": "https://www.youtube.com/shorts/KTWWh3GsyYw",
    "Hollow-to-Arch Rock": "https://www.youtube.com/shorts/17QYGBGsDvw"
}

def ex(slot, name, sets, weight=None, isWarmup=False):
    v = VIDEOS.get(name) or VIDEOS.get(name.split(" — ")[0])
    return {"slot": slot, "name": name, "sets": sets, "weight": weight, "videoUrl": v, "isWarmup": isWarmup}

def get_warmup():
    return [
        ex("W1", "High Knees", "20 reps", isWarmup=True),
        ex("W2", "Arm Circles", "10 forward, 10 backward", isWarmup=True),
        ex("W3", "Wall Slides", "10 reps", isWarmup=True),
        ex("W4", "Scapular Push-up", "8 reps", isWarmup=True),
        ex("W5", "Bodyweight Squat", "8 reps", isWarmup=True),
        ex("W6", "Reverse Lunge", "5 each leg", isWarmup=True),
        ex("W7", "Dead Bug", "6 each side", isWarmup=True),
    ]

BLOCKS = {
    "1-3": {
        "A": [
            ("Bodyweight Squat", "3×10", None),
            ("Reverse Lunge", "3×6 each leg", None),
            ("Table Push-up", "3×8", None),
            ("Seated Band Row", "3×8", "30 kg"),
            ("Table Pike Push-up", "2×6", None),
            ("Band Pull-Apart", "2×12", None),
            ("Side Plank Hip Dips", "2×8 each side", None),
            ("Calf Raise", "3×15", None),
        ],
        "B": [
            ("Reverse Lunge", "3×8 each leg", None),
            ("Bodyweight Single-Leg RDL", "3×8 each leg", None),
            ("Hamstring Towel Curl", "3×5", None),
            ("Table Push-up", "3×8", None),
            ("Seated Band Row", "3×8", "30 kg"),
            ("Single-Leg Glute Bridge", "3×8 each leg", None),
            ("Prone Y-T-W", "2×8 each letter", None),
            ("Dead Bug", "2×8 each side", None),
        ],
        "C": [
            ("Scapular Pull-up", "2×12", None),
            ("Pull-up Negative", "3×3", None),
            ("Towel Grip Hang", "2×5 breaths", None),
            ("Band Pull-Apart", "2×12", None),
            ("Scapular Push-up", "2×10", None),
            ("Hollow Body Rock", "2×8", None),
            ("Single-Leg Calf Raise", "2×12 each leg", None),
        ]
    },
    "5-7": {
        "A": [
            ("Bodyweight Squat", "4×10", None),
            ("Reverse Lunge", "3×8 each leg", None),
            ("Table Push-up", "4×8", None),
            ("Seated Band Row", "4×8", "30 kg"),
            ("Table Pike Push-up", "3×6", None),
            ("Band Pull-Apart", "2×15", None),
            ("Side Plank Hip Dips", "2×10 each side", None),
            ("Calf Raise", "3×18", None),
        ],
        "B": [
            ("Reverse Lunge", "3×10 each leg", None),
            ("Bodyweight Single-Leg RDL", "3×10 each leg", None),
            ("Hamstring Towel Curl", "3×6", None),
            ("Knee Push-up", "3×8", None),
            ("Seated Band Row", "4×8", "30 kg"),
            ("Single-Leg Glute Bridge", "3×10 each leg", None),
            ("Prone Y-T-W", "2×10 each letter", None),
            ("Dead Bug", "2×10 each side", None),
        ]
    },
    "9-11": {
        "A": [
            ("Split Squat", "4×8 each leg", None),
            ("Bodyweight Single-Leg RDL", "3×10 each leg", None),
            ("Push-up", "4×6", None),
            ("Seated Band Row", "4×10", "30 kg"),
            ("Pike Push-up", "3×8", None),
            ("Band Pull-Apart", "2×15", None),
            ("Side Plank Hip Dips", "2×10 each side", None),
            ("Calf Raise", "3×20", None),
        ],
        "B": [
            ("Reverse Lunge", "4×8 each leg", None),
            ("Hamstring Towel Curl", "3×8", None),
            ("Close-Grip Knee Push-up", "3×8", None),
            ("Seated Band Row", "4×10", "30 kg"),
            ("Single-Leg Glute Bridge", "3×10 each leg", None),
            ("Prone Y-T-W", "2×10 each letter", None),
            ("Dead Bug", "2×10 each side", None),
            ("Single-Leg Calf Raise", "3×15 each leg", None),
        ],
        "C": [
            ("Scapular Pull-up", "2×12", None),
            ("Chin-up Negative", "3×4", None),
            ("Band Curl", "2×10", "30 kg"),
            ("Wall Handstand", "3×10 breaths", None),
            ("Pike Push-up", "2×8", None),
            ("Hollow Body Rock", "2×10", None),
            ("Towel Grip Hang", "2×8 breaths", None),
        ]
    },
    "13-15": {
        "A": [
            ("Split Squat", "4×10 each leg", None),
            ("Bodyweight Single-Leg RDL", "3×10 each leg", None),
            ("Close-Grip Push-up", "4×6", None),
            ("Seated Band Row", "4×10", "30 kg"),
            ("Pike Push-up", "3×8", None),
            ("Partial Wall Walk", "3×3", None),
            ("Band Pull-Apart", "2×15", None),
            ("Side Plank Hip Dips", "2×12 each side", None),
        ],
        "B": [
            ("Reverse Lunge", "4×10 each leg", None),
            ("Single-Leg Towel Curl", "3×5 each leg", None),
            ("Push-up", "4×8", None),
            ("Seated Band Row", "4×10", "30 kg"),
            ("Single-Leg Glute Bridge", "3×12 each leg", None),
            ("Prone Y-T-W", "2×10 each letter", None),
            ("Dead Bug", "2×12 each side", None),
            ("Single-Leg Calf Raise", "3×18 each leg", None),
        ]
    },
    "17-19": {
        "A": [
            ("Split Squat", "4×10 each leg", None),
            ("Banded Single-Leg RDL", "3×10 each leg", "30 kg"),
            ("Push-up", "4×6", None),
            ("Seated Band Row", "4×10", "40 kg"),
            ("Elevated Pike Push-up", "3×6", None),
            ("Wall Handstand", "3×10 breaths", None),
            ("Band Pull-Apart", "2×15", None),
            ("Side Plank Hip Dips", "2×12 each side", None),
        ],
        "B": [
            ("Reverse Lunge", "4×10 each leg", None),
            ("Single-Leg Towel Curl", "3×6 each leg", None),
            ("Decline Push-up", "3×8", None),
            ("Seated Band Row", "4×10", "40 kg"),
            ("Banded Glute Bridge", "3×12 each leg", "30 kg"),
            ("Prone Y-T-W", "2×10 each letter", None),
            ("Hollow Body Rock", "2×12", None),
            ("Single-Leg Calf Raise", "3×20 each leg", None),
        ],
        "C": [
            ("Scapular Pull-up", "2×12", None),
            ("Chin-up", "3×3", None),
            ("Band Curl", "3×10", "30 kg"),
            ("Wall Handstand", "3×12 breaths", None),
            ("Elevated Pike Push-up", "2×8", None),
            ("Hollow-to-Arch Rock", "2×8", None),
            ("Towel Grip Hang", "2×10 breaths", None),
        ]
    },
    "21-23": {
        "A": [
            ("Split Squat", "4×10 each leg", None),
            ("Banded Single-Leg RDL", "4×8 each leg", "30 kg"),
            ("Push-up", "4×8", None),
            ("Seated Band Row", "4×12", "40 kg"),
            ("Elevated Pike Push-up", "3×8", None),
            ("Wall Handstand", "3×12 breaths", None),
            ("Band Pull-Apart", "2×15", None),
            ("Hollow Body Rock", "2×12", None),
        ],
        "B": [
            ("Reverse Lunge", "4×10 each leg", None),
            ("Single-Leg Towel Curl", "3×6 each leg", None),
            ("Decline Push-up", "3×10", None),
            ("Seated Band Row", "4×12", "40 kg"),
            ("Banded Glute Bridge", "3×12 each leg", "30 kg"),
            ("Prone Y-T-W", "2×10 each letter", None),
            ("Dead Bug", "2×12 each side", None),
            ("Single-Leg Calf Raise", "3×20 each leg", None),
        ],
        "C": [
            ("Scapular Pull-up", "2×12", None),
            ("Chin-up", "3×5", None),
            ("Band Curl", "3×10", "30 kg"),
            ("Wall Handstand", "3×12 breaths", None),
            ("Elevated Pike Push-up", "2×10", None),
            ("Hollow-to-Arch Rock", "2×8", None),
            ("Towel Grip Hang", "2×10 breaths", None),
        ]
    },
    "25-27": {
        "A": [
            ("Split Squat", "4×12 each leg", None),
            ("Banded Single-Leg RDL", "4×8 each leg", "30 kg"),
            ("Incline Archer Push-up", "3×6 each side", None),
            ("Seated Band Row", "4×12", "40 kg"),
            ("Elevated Pike Push-up", "3×10", None),
            ("Wall Handstand", "3×12 breaths", None),
            ("Band Pull-Apart", "2×15", None),
            ("Hollow-to-Arch Rock", "3×10", None),
        ],
        "B": [
            ("Reverse Lunge", "4×12 each leg", None),
            ("Single-Leg Towel Curl", "3×8 each leg", None),
            ("Decline Push-up", "4×8", None),
            ("Seated Band Row", "4×12", "40 kg"),
            ("Banded Glute Bridge", "3×12 each leg", "30 kg"),
            ("Prone Y-T-W", "2×12 each letter", None),
            ("Side Plank Hip Dips", "2×12 each side", None),
            ("Single-Leg Calf Raise", "3×20 each leg", None),
        ],
        "C": [
            ("Scapular Pull-up", "2×12", None),
            ("Chin-up", "4×5", None),
            ("Band Curl", "3×10", "40 kg"),
            ("Wall Handstand", "3×12 breaths", None),
            ("Elevated Pike Push-up", "3×8", None),
            ("Hollow-to-Arch Rock", "3×10", None),
            ("Towel Grip Hang", "2×12 breaths", None),
        ]
    },
    "29-31": {
        "A": [
            ("Split Squat", "4×12 each leg", None),
            ("Banded Single-Leg RDL", "4×10 each leg", "30 kg"),
            ("Incline Archer Push-up", "4×6 each side", None),
            ("Seated Band Row", "4×12", "40 kg"),
            ("Elevated Pike Push-up", "4×8", None),
            ("Wall Handstand", "3×15 breaths", None),
            ("Band Pull-Apart", "2×15", None),
            ("Hollow-to-Arch Rock", "3×10", None),
        ],
        "B": [
            ("Reverse Lunge", "4×12 each leg", None),
            ("Single-Leg Towel Curl", "3×8 each leg", None),
            ("Decline Push-up", "4×10", None),
            ("Seated Band Row", "4×12", "40 kg"),
            ("Banded Glute Bridge", "3×15 each leg", "30 kg"),
            ("Prone Y-T-W", "2×12 each letter", None),
            ("Dead Bug", "2×15 each side", None),
            ("Single-Leg Calf Raise", "3×20 each leg", None),
        ],
        "C": [
            ("Scapular Pull-up", "2×12", None),
            ("Chin-up", "4×6", None),
            ("Band Curl", "3×10", "40 kg"),
            ("Wall Handstand", "3×12 breaths", None),
            ("Elevated Pike Push-up", "3×10", None),
            ("Hollow-to-Arch Rock", "3×10", None),
            ("Towel Grip Hang", "2×12 breaths", None),
        ]
    },
    "33-35": {
        "A": [
            ("Wall-Supported Skater Squat", "4×6 each leg", None),
            ("Banded Single-Leg RDL", "4×10 each leg", "40 kg"),
            ("Decline Push-up", "4×10", None),
            ("Seated Band Row", "4×10", "50 kg"),
            ("Elevated Pike Push-up", "4×10", None),
            ("Wall Handstand", "3×15 breaths", None),
            ("Band Pull-Apart", "2×15", None),
            ("Hollow-to-Arch Rock", "3×12", None),
        ],
        "B": [
            ("Wall-Supported Skater Squat", "4×6 each leg", None),
            ("Single-Leg Towel Curl", "3×8 each leg", None),
            ("Incline Archer Push-up", "3×8 each side", None),
            ("Seated Band Row", "4×10", "50 kg"),
            ("Banded Glute Bridge", "3×15 each leg", "40 kg"),
            ("Prone Y-T-W", "2×12 each letter", None),
            ("Side Plank Hip Dips", "2×15 each side", None),
            ("Single-Leg Calf Raise", "3×20 each leg", None),
        ],
        "C": [
            ("Scapular Pull-up", "2×12", None),
            ("Chin-up", "4×7", None),
            ("Band Curl", "3×10", "40 kg"),
            ("Wall Handstand", "3×12 breaths", None),
            ("Elevated Pike Push-up", "3×10", None),
            ("Hollow-to-Arch Rock", "3×10", None),
            ("Towel Grip Hang", "2×12 breaths", None),
        ]
    },
    "37-39": {
        "A": [
            ("Wall-Supported Skater Squat", "4×8 each leg", None),
            ("Banded Single-Leg RDL", "4×10 each leg", "40 kg"),
            ("Decline Push-up", "4×12", None),
            ("Seated Band Row", "4×12", "50 kg"),
            ("Elevated Pike Push-up", "4×10", None),
            ("Wall Handstand", "3×15 breaths", None),
            ("Band Pull-Apart", "2×15", None),
            ("Hollow-to-Arch Rock", "3×12", None),
        ],
        "B": [
            ("Wall-Supported Skater Squat", "4×8 each leg", None),
            ("Single-Leg Towel Curl", "3×10 each leg", None),
            ("Incline Archer Push-up", "3×10 each side", None),
            ("Seated Band Row", "4×12", "50 kg"),
            ("Banded Glute Bridge", "4×10 each leg", "40 kg"),
            ("Prone Y-T-W", "2×12 each letter", None),
            ("Dead Bug", "2×15 each side", None),
            ("Single-Leg Calf Raise", "3×20 each leg", None),
        ],
        "C": [
            ("Scapular Pull-up", "2×12", None),
            ("Chin-up", "5×5", None),
            ("Band Curl", "3×8", "50 kg"),
            ("Band Curl", "3×12", "40 kg"),
            ("Wall Handstand", "3×15 breaths", None),
            ("Elevated Pike Push-up", "4×10", None),
            ("Hollow-to-Arch Rock", "3×12", None),
            ("Towel Grip Hang", "2×15 breaths", None),
        ]
    },
    "41-43": {
        "A": [
            ("Wall-Supported Skater Squat", "4×10 each leg", None),
            ("Banded Single-Leg RDL", "4×10 each leg", "50 kg"),
            ("Decline Push-up", "4×12", None),
            ("Seated Band Row", "4×12", "50 kg"),
            ("Elevated Pike Push-up", "4×10", None),
            ("Wall Handstand", "3×15 breaths", None),
            ("Band Pull-Apart", "2×15", None),
            ("Hollow-to-Arch Rock", "3×12", None),
        ],
        "B": [
            ("Wall-Supported Skater Squat", "4×10 each leg", None),
            ("Single-Leg Towel Curl", "3×10 each leg", None),
            ("Incline Archer Push-up", "3×10 each side", None),
            ("Seated Band Row", "4×12", "50 kg"),
            ("Banded Glute Bridge", "4×10 each leg", "50 kg"),
            ("Prone Y-T-W", "2×12 each letter", None),
            ("Side Plank Hip Dips", "2×15 each side", None),
            ("Single-Leg Calf Raise", "3×20 each leg", None),
        ],
        "C": [
            ("Scapular Pull-up", "2×12", None),
            ("Chin-up", "5×6", None),
            ("Band Curl", "3×8", "50 kg"),
            ("Band Curl", "3×12", "40 kg"),
            ("Wall Handstand", "3×15 breaths", None),
            ("Elevated Pike Push-up", "4×12", None),
            ("Hollow-to-Arch Rock", "3×12", None),
            ("Towel Grip Hang", "2×15 breaths", None),
        ]
    },
    "45-48": {
        "A": [
            ("Wall-Supported Skater Squat", "4×10 each leg", None),
            ("Banded Single-Leg RDL", "4×10 each leg", "50 kg"),
            ("Decline Push-up", "4×12", None),
            ("Seated Band Row", "4×12", "50 kg"),
            ("Elevated Pike Push-up", "4×12", None),
            ("Wall Handstand", "3×15 breaths", None),
            ("Band Pull-Apart", "2×15", None),
            ("Hollow-to-Arch Rock", "3×15", None),
        ],
        "B": [
            ("Wall-Supported Skater Squat", "4×10 each leg", None),
            ("Single-Leg Towel Curl", "3×10 each leg", None),
            ("Incline Archer Push-up", "3×10 each side", None),
            ("Seated Band Row", "4×12", "50 kg"),
            ("Banded Glute Bridge", "4×12 each leg", "50 kg"),
            ("Prone Y-T-W", "2×12 each letter", None),
            ("Dead Bug", "2×15 each side", None),
            ("Single-Leg Calf Raise", "3×20 each leg", None),
        ],
        "C": [
            ("Scapular Pull-up", "2×12", None),
            ("Chin-up", "5×6", None),
            ("Band Curl", "3×8", "50 kg"),
            ("Band Curl", "3×12", "40 kg"),
            ("Wall Handstand", "3×15 breaths", None),
            ("Elevated Pike Push-up", "4×12", None),
            ("Hollow-to-Arch Rock", "3×12", None),
            ("Towel Grip Hang", "2×15 breaths", None),
        ]
    }
}

BLOCKS["5-7"]["C"] = BLOCKS["1-3"]["C"]
BLOCKS["13-15"]["C"] = BLOCKS["9-11"]["C"]

DAYS_ENG = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"]

def get_block_key(week):
    if week <= 4: return "1-3"
    elif week <= 8: return "5-7"
    elif week <= 12: return "9-11"
    elif week <= 16: return "13-15"
    elif week <= 20: return "17-19"
    elif week <= 24: return "21-23"
    elif week <= 28: return "25-27"
    elif week <= 32: return "29-31"
    elif week <= 36: return "33-35"
    elif week <= 40: return "37-39"
    elif week <= 44: return "41-43"
    else: return "45-48"

def apply_deload(sets_str):
    s = re.sub(r'^([345])(×)', r'2\2', sets_str)
    s = re.sub(r'^2(×)', r'1\1', s)
    return s

def get_workout_exercises(workout_type, week):
    key = get_block_key(week)
    base = BLOCKS[key][workout_type]
    
    is_deload = week in [4, 8, 12, 16, 20, 24, 28, 32, 36, 40, 44]
    
    main_exercise_names = {name for name, _, _ in base}
    
    out = []
    w_idx = 1
    for w in get_warmup():
        if w["name"] not in main_exercise_names:
            w["slot"] = f"W{w_idx}"
            out.append(w)
            w_idx += 1
    
    slot_prefix = "A"
    for i, (name, sets, weight) in enumerate(base):
        final_sets = apply_deload(sets) if is_deload else sets
        out.append(ex(f"{slot_prefix}{i+1}", name, final_sets, weight))
        
    return out

def get_day_exercises(day_of_week_idx, week):
    if day_of_week_idx == 0:
        return "Workout A", "7-8", get_workout_exercises("A", week)
    elif day_of_week_idx == 1:
        return "Active Recovery", "—", [ex("A1", "Relaxed Walking", "30-45 mins", "Zone 2 (4.5 - 6.0 km/h)")]
    elif day_of_week_idx == 2:
        return "Workout B", "7-8", get_workout_exercises("B", week)
    elif day_of_week_idx == 3:
        return "Active Recovery", "—", [ex("A1", "Relaxed Walking", "30-45 mins", "Zone 2 (4.5 - 6.0 km/h)")]
    elif day_of_week_idx == 4:
        return "Workout C", "7-8", get_workout_exercises("C", week)
    elif day_of_week_idx == 5:
        # For Day 6, we keep Relaxed Walking, but the user can optionally jog later as per the markdown guide.
        return "Active Recovery", "—", [ex("A1", "Relaxed Walking", "30-45 mins", "Zone 2 (4.5 - 6.0 km/h)")]
    else:
        return "Rest", "—", []

def generate_program():
    daily = []
    day_num = 0
    
    for real_week in range(1, 53):
        week = real_week if real_week <= 48 else 17 + (real_week - 49)
        
        for dow in range(7):
            day_num += 1
            date = START_DATE + timedelta(days=day_num - 1)
            day_type, rpe, exercises = get_day_exercises(dow, week)
            
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
        {"name":"Wall-Supported Skater Squat","category":"Legs","difficulty":"Advanced","weight":"Bodyweight","videoUrl":None,"setsProgression":"Phase 4-5: 4×6-10 each leg"},
        {"name":"Table Push-up","category":"Push","difficulty":"Beginner","weight":"Bodyweight","videoUrl":VIDEOS["Table Push-up"],"setsProgression":"Phase 1: 3-4×8"},
        {"name":"Knee Push-up","category":"Push","difficulty":"Beginner","weight":"Bodyweight","videoUrl":VIDEOS["Knee Push-up"],"setsProgression":"Phase 1: 3×8"},
        {"name":"Close-Grip Knee Push-up","category":"Push","difficulty":"Beginner+","weight":"Bodyweight","videoUrl":None,"setsProgression":"Phase 2: 3×8"},
        {"name":"Diamond Knee Push-up","category":"Push","difficulty":"Intermediate","weight":"Bodyweight","videoUrl":None,"setsProgression":"Phase 3: 3×8"},
        {"name":"Push-up","category":"Push","difficulty":"Intermediate","weight":"Bodyweight","videoUrl":VIDEOS["Push-up"],"setsProgression":"Phase 2-5: 4×6-12"},
        {"name":"Close-Grip Push-up","category":"Push","difficulty":"Intermediate+","weight":"Bodyweight","videoUrl":None,"setsProgression":"Phase 2-4: 4×6-10"},
        {"name":"Diamond Push-up","category":"Push","difficulty":"Advanced","weight":"Bodyweight","videoUrl":VIDEOS["Diamond Push-up"],"setsProgression":"Phase 3: 3×8"},
        {"name":"Decline Push-up","category":"Push","difficulty":"Advanced","weight":"Bodyweight","videoUrl":VIDEOS["Decline Push-up"],"setsProgression":"Phase 3-4: 3-4×8-12"},
        {"name":"Incline Archer Push-up","category":"Push","difficulty":"Advanced","weight":"Bodyweight","videoUrl":None,"setsProgression":"Phase 4-5: 3-4×6-10 each side"},
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
        {"name":"Band Pull-Apart","category":"Upper Back","difficulty":"Beginner","weight":"30 kg","videoUrl":VIDEOS["Band Pull-Apart"],"setsProgression":"Phase 1-5: 2×12-15"},
        {"name":"Band Curl","category":"Arms","difficulty":"Beginner","weight":"30-50 kg","videoUrl":VIDEOS["Band Curl"],"setsProgression":"Phase 2-5: 2-3×8-12"},
        {"name":"Bodyweight Single-Leg RDL","category":"Glutes & Hamstrings","difficulty":"Intermediate","weight":"Bodyweight","videoUrl":VIDEOS["Bodyweight Single-Leg RDL"],"setsProgression":"Phase 1-2: 3-4×8-10 each leg"},
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
        {"name":"Side Plank Hip Dips","category":"Core","difficulty":"Intermediate","weight":"Bodyweight","videoUrl":VIDEOS["Side Plank Hip Dips"],"setsProgression":"Phase 1-5: 2×8-15 each side"},
        {"name":"Hollow Body Rock","category":"Core","difficulty":"Advanced","weight":"Bodyweight","videoUrl":VIDEOS["Hollow Body Rock"],"setsProgression":"Phase 1-3: 2×8-12"},
        {"name":"Hollow-to-Arch Rock","category":"Core","difficulty":"Expert","weight":"Bodyweight","videoUrl":None,"setsProgression":"Phase 3-5: 2-3×8-15"},
        {"name":"Towel Grip Hang","category":"Grip","difficulty":"Intermediate","weight":"Bodyweight","videoUrl":VIDEOS["Towel Grip Hang"],"setsProgression":"Dry thick towel - 2×5-15 breaths"},
        {"name":"Relaxed Walking","category":"Cardio","difficulty":"Beginner","weight":"Bodyweight","videoUrl":None,"setsProgression":"30-45 mins in Zone 2"},
        {"name":"Slow Jogging","category":"Cardio","difficulty":"Intermediate","weight":"Bodyweight","videoUrl":None,"setsProgression":"Phase 3+: Day 6 option, slow pace"},
    ]
    return {"daily": daily, "exercises": exercises_guide}

def to_training_data_json(program):
    rows = []
    slot_order = ["W1","W2","W3","W4","W5","W6","W7","A1","A2","A3","A4","A5","A6","A7","A8","A9","A10"]
    for day in program["daily"]:
        row = {
            "Day": f"Day {day['dayNum']}", "Week": day["week"], "Day of Week": day["dayOfWeek"],
            "Date": day["date"], "Day Type": day["dayType"], "Planned RPE": day["plannedRPE"],
        }
        ex_by_slot = {}
        for e in day["exercises"]:
            ex_by_slot[e["slot"]] = e
        for slot in slot_order:
            e = ex_by_slot.get(slot)
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
    
    import os
    import shutil
    
    required_exercises = set()
    for day in program["daily"]:
        for e in day["exercises"]:
            required_exercises.add(e["name"])
    for e in program["exercises"]:
        required_exercises.add(e["name"])
        
    expected_images = {name.replace('/', '-').upper() + ".png" for name in required_exercises}

    renames = [
        ("images/exercises/INCLINE PUSH-UP.png", "images/exercises/TABLE PUSH-UP.png"),
        ("images/exercises/ELEVATED PIKE PUSH-UP.png", "images/exercises/TABLE PIKE PUSH-UP.png"),
        ("images/exercises/SCAPULAR PUSH-UPS.png", "images/exercises/SCAPULAR PUSH-UP.png"),
        ("images/exercises/BODYWEIGHT SQUATS.png", "images/exercises/BODYWEIGHT SQUAT.png"),
        ("images/exercises/REVERSE LUNGES.png", "images/exercises/REVERSE LUNGE.png"),
        ("images/exercises/DEAD BUGS.png", "images/exercises/DEAD BUG.png"),
    ]
    for src, dst in renames:
        if os.path.exists(src) and not os.path.exists(dst):
            os.rename(src, dst)

    img_dir = "images/exercises"
    if os.path.exists(img_dir):
        for f in os.listdir(img_dir):
            if f.endswith(".png") and f not in expected_images:
                try:
                    os.remove(os.path.join(img_dir, f))
                except Exception:
                    pass
                    
        fallback = os.path.join(img_dir, "BODYWEIGHT SQUAT.png")
        brisk_walk_src = "/home/uns/.gemini/antigravity/brain/3975ca3d-01cf-4bb1-bc0b-1dedfa2f6459/brisk_walking_illustration_1783791779977.png"
        slow_jog_src = "/home/uns/.gemini/antigravity/brain/3975ca3d-01cf-4bb1-bc0b-1dedfa2f6459/slow_jogging_illustration_1783792645294.png"
        for img in expected_images:
            path = os.path.join(img_dir, img)
            if not os.path.exists(path):
                if img == "RELAXED WALKING.png" and os.path.exists(brisk_walk_src):
                    shutil.copy(brisk_walk_src, path)
                elif img == "SLOW JOGGING.png" and os.path.exists(slow_jog_src):
                    shutil.copy(slow_jog_src, path)
                elif os.path.exists(fallback):
                    shutil.copy(fallback, path)

    print("Done — v4.0 generated and images synced!")
