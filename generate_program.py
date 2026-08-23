#!/usr/bin/env python3
"""Generate FitUp Pro v15.6 Lean Edition — 52-week training program matching UPDATE_PROGRAM.md schema."""
import json, os, shutil
from datetime import datetime, timedelta

START_DATE = datetime(2026, 7, 6)
DAYS_ENG = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"]

# Deload occurs every 8 weeks: 8, 16, 24, 32, 40, 48, 56, 64, 72
DELOAD_WEEKS = set(range(8, 79, 8))

# ---------------------------------------------------------
# 1. Master Exercise Catalog Metadata Definition
# ---------------------------------------------------------
EXERCISES_CATALOG = [
    # Day 1 - Legs, Posterior Chain, Calves, Core, Carry
    {
        "id": "db-rdl",
        "name": "DB Romanian Deadlift",
        "category": "Legs",
        "type": "weighted",
        "startingWeight": 6,
        "minWeight": 3,
        "maxWeight": 24,
        "increment": 1,
        "loadType": "each",
        "restSeconds": 105,
        "restRange": [90, 120],
        "windowMin": 6,
        "windowMax": 12,
        "tempo": "3s descent",
        "compound": True,
        "structure": "straight",
        "rule": "neutral spine קשיח; אם הגב מתעגל, BELOW"
    },
    {
        "id": "single-leg-rdl",
        "name": "Single-Leg RDL",
        "category": "Legs",
        "type": "weighted",
        "startingWeight": 6,
        "minWeight": 3,
        "maxWeight": 20,
        "increment": 1,
        "loadType": "each",
        "restSeconds": 75,
        "restRange": [60, 90],
        "windowMin": 8,
        "windowMax": 10,
        "tempo": "3s descent",
        "compound": True,
        "structure": "straight",
        "toggleGroup": "day1-posterior-quad",
        "toggleActiveOn": "odd",
        "rule": "neutral spine; אם מאבד שיווי משקל, BELOW"
    },
    {
        "id": "reverse-lunge",
        "name": "Reverse Lunge + DB",
        "category": "Legs",
        "type": "weighted",
        "startingWeight": 6,
        "minWeight": 3,
        "maxWeight": 20,
        "increment": 1,
        "loadType": "each",
        "restSeconds": 75,
        "restRange": [60, 90],
        "windowMin": 10,
        "windowMax": 12,
        "tempo": "2s descent",
        "compound": True,
        "structure": "straight",
        "toggleGroup": "day1-posterior-quad",
        "toggleActiveOn": "even"
    },
    {
        "id": "pistol-squat-progression",
        "name": "Pistol Squat Progression",
        "category": "Legs",
        "type": "variation",
        "restSeconds": 105,
        "restRange": [90, 120],
        "windowMin": 3,
        "windowMax": 8,
        "tempo": "slow descent",
        "compound": True,
        "structure": "straight",
        "toggleGroup": "day1-posterior-quad",
        "toggleActiveOn": "even",
        "unlocked": False,
        "stages": [
            "Assisted Pistol", "Pistol to High Box", "Pistol to Chair",
            "Pistol to Low Box", "Full Pistol", "Weighted 3kg", "Weighted 6kg"
        ],
        "unlockCriteria": {
            "exercise": "bulgarian-split-squat",
            "targetReps": 12,
            "targetWeightKg": 12
        },
        "rule": "ירידה איטית; אם הברך קורסת פנימה (valgus), BELOW"
    },
    {
        "id": "bulgarian-split-squat",
        "name": "DB Bulgarian Split Squat",
        "category": "Legs",
        "type": "weighted",
        "startingWeight": 6,
        "minWeight": 3,
        "maxWeight": 24,
        "increment": 1,
        "loadType": "each",
        "restSeconds": 82,
        "restRange": [75, 90],
        "windowMin": 6,
        "windowMax": 12,
        "tempo": "2s descent",
        "compound": True,
        "structure": "straight"
    },
    {
        "id": "db-hip-thrust",
        "name": "DB Hip Thrust",
        "category": "Glutes",
        "type": "weighted",
        "startingWeight": 9,
        "minWeight": 3,
        "maxWeight": 24,
        "increment": 1,
        "loadType": "total",
        "restSeconds": 75,
        "restRange": [60, 90],
        "windowMin": 10,
        "windowMax": 15,
        "tempo": "1s pause at top",
        "compound": True,
        "structure": "straight",
        "rule": "כתפיים על ספסל; כפות רגליים רחבות; squeeze glutes"
    },
    {
        "id": "suitcase-carry",
        "name": "Suitcase Carry",
        "category": "Grip",
        "type": "weighted",
        "startingWeight": 12,
        "minWeight": 6,
        "maxWeight": 24,
        "increment": 1,
        "loadType": "total",
        "restSeconds": 60,
        "windowMin": 25,
        "windowMax": 40,
        "tempo": "controlled walk",
        "compound": False,
        "structure": "straight"
    },
    {
        "id": "standing-single-leg-calf-raise",
        "name": "Standing Single-Leg Calf Raise",
        "category": "Legs",
        "type": "weighted",
        "startingWeight": 6,
        "minWeight": 3,
        "maxWeight": 24,
        "increment": 1,
        "loadType": "single_hand",
        "restSeconds": 45,
        "windowMin": 12,
        "windowMax": 20,
        "tempo": "2s descent, 1s pause, 1s squeeze",
        "compound": False,
        "structure": "block",
        "blockId": "d1-calf-block",
        "blockOrder": 1
    },
    {
        "id": "seated-single-leg-calf-raise",
        "name": "Seated Single-Leg Calf Raise",
        "category": "Legs",
        "type": "weighted",
        "startingWeight": 6,
        "minWeight": 3,
        "maxWeight": 24,
        "increment": 1,
        "loadType": "on_knee",
        "restSeconds": 45,
        "windowMin": 15,
        "windowMax": 25,
        "tempo": "2s descent, 1s pause, 1s squeeze",
        "compound": False,
        "structure": "block",
        "blockId": "d1-calf-block",
        "blockOrder": 2
    },
    {
        "id": "pallof-press-progression",
        "name": "Pallof Press Progression",
        "category": "Core",
        "type": "variation",
        "restSeconds": 45,
        "windowMin": 10,
        "windowMax": 12,
        "tempo": "1s pause",
        "compound": False,
        "structure": "circuit",
        "circuitId": "d1-core-circuit",
        "circuitOrder": 1,
        "stages": [
            "Pallof Hold (2h,30kg)", "Pallof Press (2h,30kg)", "Single-Arm (30kg)",
            "Single-Arm (40kg)", "Single-Arm Split Stance (40kg)", "Single-Arm (50kg)", "Single-Arm One Leg (50kg)"
        ],
        "rule": "אין תנועה בגב; אם הגוף מסתובב, BELOW"
    },
    {
        "id": "dead-bug",
        "name": "Dead Bug",
        "category": "Core",
        "type": "variation",
        "restSeconds": 30,
        "windowMin": 12,
        "windowMax": 20,
        "tempo": "slow",
        "compound": False,
        "structure": "circuit",
        "circuitId": "d1-core-circuit",
        "circuitOrder": 2,
        "stages": ["Bodyweight", "1 kg", "2 kg", "3 kg"]
    },
    {
        "id": "hollow-body-hold",
        "name": "Hollow Body Hold",
        "category": "Core",
        "type": "timebased",
        "restSeconds": 30,
        "windowMin": 20,
        "windowMax": 30,
        "tempo": "static hold",
        "compound": False,
        "structure": "circuit",
        "circuitId": "d1-core-circuit",
        "circuitOrder": 3,
        "stages": ["Tuck Hold", "One-Leg Extended", "Hollow Hold"]
    },

    # Day 3 - Push, Shoulders, Rear Delts, Triceps
    {
        "id": "pike-progression",
        "name": "Pike Progression",
        "category": "Shoulders",
        "type": "variation",
        "restSeconds": 75,
        "restRange": [60, 90],
        "windowMin": 6,
        "windowMax": 12,
        "tempo": "2s descent",
        "compound": True,
        "structure": "straight",
        "stages": ["Pike Hold", "Feet-Elevated Pike Hold", "Pike Push-Up", "Elevated Pike Push-Up"]
    },
    {
        "id": "db-floor-press",
        "name": "DB Floor Press",
        "category": "Push",
        "type": "weighted",
        "startingWeight": 6,
        "minWeight": 3,
        "maxWeight": 24,
        "increment": 1,
        "loadType": "each",
        "restSeconds": 105,
        "restRange": [90, 120],
        "windowMin": 6,
        "windowMax": 12,
        "tempo": "2s descent",
        "compound": True,
        "structure": "straight"
    },
    {
        "id": "push-up-progression",
        "name": "Push-up Bars Progression",
        "category": "Push",
        "type": "variation",
        "restSeconds": 75,
        "restRange": [60, 90],
        "windowMin": 8,
        "windowMax": 15,
        "tempo": "2s descent",
        "compound": True,
        "structure": "straight",
        "stages": ["Incline Push-Up", "Push-Up", "Deficit Push-Up", "Weighted Deficit (Vest 5kg)"]
    },
    {
        "id": "seated-db-ohp",
        "name": "Seated DB Overhead Press",
        "category": "Shoulders",
        "type": "weighted",
        "startingWeight": 6,
        "minWeight": 3,
        "maxWeight": 24,
        "increment": 1,
        "loadType": "each",
        "restSeconds": 82,
        "restRange": [75, 90],
        "windowMin": 6,
        "windowMax": 12,
        "tempo": "2s descent",
        "compound": True,
        "structure": "straight"
    },
    {
        "id": "trx-y-t-w",
        "name": "TRX Y-T-W",
        "category": "Shoulders",
        "type": "variation",
        "restSeconds": 45,
        "windowMin": 8,
        "windowMax": 12,
        "tempo": "1s pause",
        "compound": False,
        "structure": "straight",
        "toggleGroup": "day3-rear-delt",
        "toggleActiveOn": "odd",
        "stages": ["Angle 1 (Gentle)", "Angle 2 (Moderate)", "Angle 3 (Steep)"]
    },
    {
        "id": "band-pull-apart",
        "name": "Band Pull-Apart",
        "category": "Shoulders",
        "type": "variation",
        "restSeconds": 45,
        "windowMin": 15,
        "windowMax": 25,
        "tempo": "1s squeeze",
        "compound": False,
        "structure": "straight",
        "toggleGroup": "day3-rear-delt",
        "toggleActiveOn": "even",
        "stages": ["Light Band 30kg", "Band 40kg", "Band 50kg"]
    },
    {
        "id": "db-lateral-raise",
        "name": "DB Lateral Raise",
        "category": "Shoulders",
        "type": "weighted",
        "startingWeight": 3,
        "minWeight": 3,
        "maxWeight": 12,
        "increment": 1,
        "loadType": "each",
        "restSeconds": 45,
        "windowMin": 12,
        "windowMax": 20,
        "tempo": "2s descent",
        "compound": False,
        "pairId": "d3-row-lateral",
        "pairType": "non-competing"
    },
    {
        "id": "db-oh-triceps-extension",
        "name": "DB Overhead Triceps Extension",
        "category": "Arms",
        "type": "weighted",
        "startingWeight": 6,
        "minWeight": 3,
        "maxWeight": 24,
        "increment": 1,
        "loadType": "total",
        "restSeconds": 45,
        "windowMin": 10,
        "windowMax": 15,
        "tempo": "2s descent",
        "compound": False,
        "structure": "straight"
    },
    {
        "id": "arm-block-lateral-raise",
        "name": "Arm Block - DB Lateral Raise",
        "category": "Shoulders",
        "type": "myo-reps",
        "startingWeight": 3,
        "minWeight": 3,
        "maxWeight": 12,
        "increment": 1,
        "loadType": "each",
        "restSeconds": 15,
        "windowMin": 12,
        "windowMax": 20,
        "structure": "myo-reps",
        "myoConfig": {
            "activationReps": 15,
            "miniSets": 3,
            "miniReps": 5,
            "stopRule": "two_consecutive_tempo_losses"
        }
    },
    {
        "id": "arm-block-triceps-ext",
        "name": "Arm Block - DB Overhead Triceps Ext",
        "category": "Arms",
        "type": "myo-reps",
        "startingWeight": 6,
        "minWeight": 3,
        "maxWeight": 24,
        "increment": 1,
        "loadType": "total",
        "restSeconds": 15,
        "windowMin": 10,
        "windowMax": 15,
        "structure": "myo-reps",
        "myoConfig": {
            "activationReps": 12,
            "miniSets": 3,
            "miniReps": 5,
            "stopRule": "two_consecutive_tempo_losses"
        }
    },

    # Day 5 - Pull, Grip, Core, Biceps
    {
        "id": "pull-up-progression",
        "name": "Pull-Up Progression",
        "category": "Pull",
        "type": "variation",
        "restSeconds": 105,
        "restRange": [90, 120],
        "windowMin": 3,
        "windowMax": 8,
        "tempo": "2s descent",
        "compound": True,
        "structure": "straight",
        "stages": [
            "Scapular Pull-Up", "Pull-Up Negative (3s)", "Pull-Up Negative (5s)",
            "Full Pull-Up", "Weighted Pull-Up (2kg)", "Weighted Pull-Up (4kg)", "Weighted Pull-Up (5kg)"
        ]
    },
    {
        "id": "chin-up-progression",
        "name": "Chin-Up Progression",
        "category": "Pull",
        "type": "variation",
        "restSeconds": 105,
        "restRange": [90, 120],
        "windowMin": 3,
        "windowMax": 8,
        "tempo": "2s descent",
        "compound": True,
        "structure": "straight",
        "stages": [
            "Chin-Up Negative (3s)", "Full Chin-Up", "Weighted Chin-Up (2kg)",
            "Weighted Chin-Up (4kg)", "Weighted Chin-Up (5kg)"
        ]
    },
    {
        "id": "one-arm-db-row",
        "name": "One-Arm DB Row",
        "category": "Pull",
        "type": "weighted",
        "startingWeight": 6,
        "minWeight": 3,
        "maxWeight": 24,
        "increment": 1,
        "loadType": "each",
        "restSeconds": 82,
        "restRange": [75, 90],
        "windowMin": 8,
        "windowMax": 12,
        "tempo": "2s descent",
        "compound": True,
        "structure": "straight"
    },
    {
        "id": "trx-row",
        "name": "TRX Row",
        "category": "Pull",
        "type": "variation",
        "restSeconds": 75,
        "restRange": [60, 90],
        "windowMin": 10,
        "windowMax": 15,
        "tempo": "2s descent",
        "compound": True,
        "pairId": "d3-row-lateral",
        "stages": ["Angle 1 (Gentle)", "Angle 2 (Moderate)", "Angle 3 (Steep)", "Feet Elevated"]
    },
    {
        "id": "trx-face-pull",
        "name": "TRX Face Pull",
        "category": "Shoulders",
        "type": "variation",
        "restSeconds": 45,
        "windowMin": 12,
        "windowMax": 20,
        "tempo": "2s descent",
        "compound": False,
        "structure": "straight",
        "stages": ["Angle 1 (Gentle)", "Angle 2 (Moderate)", "Angle 3 (Steep)"]
    },
    {
        "id": "push-up-volume",
        "name": "Push-Up Volume (Day 5)",
        "category": "Push",
        "type": "variation",
        "restSeconds": 75,
        "restRange": [60, 90],
        "windowMin": 10,
        "windowMax": 20,
        "tempo": "2s descent",
        "compound": True,
        "pairId": "d5-pushup-curl",
        "stages": ["Incline Push-Up", "Push-Up", "Deficit Push-Up", "Diamond Push-Up"]
    },
    {
        "id": "db-curl",
        "name": "DB Curl",
        "category": "Arms",
        "type": "weighted",
        "startingWeight": 3,
        "minWeight": 3,
        "maxWeight": 18,
        "increment": 1,
        "loadType": "each",
        "restSeconds": 45,
        "windowMin": 10,
        "windowMax": 15,
        "tempo": "2s descent",
        "compound": False,
        "pairId": "d5-pushup-curl",
        "microcycle": "biceps-microcycle"
    },
    {
        "id": "hammer-curl",
        "name": "Hammer Curl",
        "category": "Arms",
        "type": "weighted",
        "startingWeight": 3,
        "minWeight": 3,
        "maxWeight": 18,
        "increment": 1,
        "loadType": "each",
        "restSeconds": 45,
        "windowMin": 10,
        "windowMax": 15,
        "tempo": "2s descent",
        "compound": False,
        "structure": "straight",
        "microcycle": "biceps-microcycle"
    },
    {
        "id": "arm-block-biceps-curl",
        "name": "Arm Block - DB Curl",
        "category": "Arms",
        "type": "myo-reps",
        "startingWeight": 3,
        "minWeight": 3,
        "maxWeight": 18,
        "increment": 1,
        "loadType": "each",
        "restSeconds": 15,
        "windowMin": 10,
        "windowMax": 15,
        "structure": "myo-reps",
        "myoConfig": {
            "activationReps": 12,
            "miniSets": 3,
            "miniReps": 5,
            "stopRule": "two_consecutive_tempo_losses"
        }
    },
    {
        "id": "towel-hang",
        "name": "Towel Hang",
        "category": "Grip",
        "type": "timebased",
        "restSeconds": 45,
        "windowMin": 15,
        "windowMax": 45,
        "tempo": "static hold",
        "compound": False,
        "pairId": "d5-grip-core",
        "stages": ["15s Hold", "25s Hold", "35s Hold", "45s Hold"]
    },
    {
        "id": "l-sit-progression",
        "name": "L-Sit Progression",
        "category": "Core",
        "type": "timebased",
        "restSeconds": 45,
        "windowMin": 8,
        "windowMax": 20,
        "tempo": "static hold",
        "compound": False,
        "pairId": "d5-grip-core",
        "stages": ["Tuck Hold (Chair)", "Tuck Hold (Bars)", "One Leg Extended", "Full L-Sit"]
    },

    # Warmup & Cardio Utilities
    { "id": "high-knees", "name": "High Knees", "category": "Warmup", "type": "timebased", "restSeconds": 0, "windowMin": 30, "windowMax": 30 },
    { "id": "bodyweight-squat", "name": "Bodyweight Squat", "category": "Warmup", "type": "variation", "restSeconds": 30, "windowMin": 8, "windowMax": 8 },
    { "id": "arm-circles", "name": "Arm Circles", "category": "Warmup", "type": "variation", "restSeconds": 0, "windowMin": 10, "windowMax": 10 },
    { "id": "wall-slides", "name": "Wall Slides", "category": "Warmup", "type": "variation", "restSeconds": 30, "windowMin": 8, "windowMax": 8 },
    { "id": "scapular-push-up", "name": "Scapular Push-up", "category": "Warmup", "type": "variation", "restSeconds": 30, "windowMin": 10, "windowMax": 10 },
    { "id": "scapular-pull-up", "name": "Scapular Pull-up", "category": "Warmup", "type": "variation", "restSeconds": 30, "windowMin": 6, "windowMax": 6 },
    { "id": "dead-hang", "name": "Dead Hang", "category": "Warmup", "type": "timebased", "restSeconds": 30, "windowMin": 15, "windowMax": 15 },
    { "id": "seated-band-row", "name": "Seated Band Row", "category": "Warmup", "type": "variation", "restSeconds": 30, "windowMin": 12, "windowMax": 12 },
    { "id": "brisk-walking", "name": "Brisk Walking", "category": "Cardio", "type": "timebased", "restSeconds": 0, "windowMin": 30, "windowMax": 45 },
    { "id": "relaxed-walking", "name": "Relaxed Walking", "category": "Cardio", "type": "timebased", "restSeconds": 0, "windowMin": 25, "windowMax": 30 },
    { "id": "vo2-max-norwegian-4x4", "name": "VO2 Max Norwegian 4x4", "category": "Cardio", "type": "interval", "restSeconds": 0, "windowMin": 16, "windowMax": 16 },
    { "id": "micro-mobility-protocol", "name": "Micro Mobility Protocol", "category": "Warmup", "type": "timebased", "restSeconds": 0, "windowMin": 5, "windowMax": 5 },
    { "id": "deep-mobility-protocol", "name": "Deep Mobility Protocol", "category": "Warmup", "type": "timebased", "restSeconds": 0, "windowMin": 10, "windowMax": 10 },

    # Progressive Variation Stage Exercises (Skill Tree & Stage Parity)
    { "id": "diamond-push-up", "name": "Diamond Push-Up", "category": "Push", "type": "variation", "restSeconds": 90, "restRange": [60, 90], "windowMin": 8, "windowMax": 15, "tempo": "2s descent", "compound": False, "stages": ["Incline Diamond", "Diamond Push-Up", "Weighted Diamond (Vest 5kg)"], "rule": "ידיים בצורת מעוין מתחת לחזה; מרפקים צמודים לגוף" },
    { "id": "deficit-push-up", "name": "Deficit Push-Up", "category": "Push", "type": "variation", "restSeconds": 90, "restRange": [60, 90], "windowMin": 8, "windowMax": 15, "tempo": "2s descent", "compound": True, "rule": "ירידה עמוקה בין הידיות עד מתיחה בחזה" },
    { "id": "feet-elevated-push-up", "name": "Feet-Elevated Push-Up", "category": "Push", "type": "variation", "restSeconds": 90, "restRange": [60, 90], "windowMin": 8, "windowMax": 15, "tempo": "2s descent", "compound": True, "rule": "רגליים על ספסל/כיסא; גוף ישר כמו קרש" },
    { "id": "single-arm-floor-press", "name": "Single-Arm Floor Press", "category": "Push", "type": "weighted", "startingWeight": 9, "minWeight": 6, "maxWeight": 24, "increment": 3, "loadType": "each", "restSeconds": 120, "restRange": [90, 120], "windowMin": 6, "windowMax": 10, "tempo": "2s descent", "compound": True, "rule": "גב ומרפק נוגעים ברצפה; עבודה חד-צדדית עם ליבה קשיחה" },
    { "id": "weighted-deficit-push-up", "name": "Weighted Deficit Push-Up", "category": "Push", "type": "weighted", "startingWeight": 5, "minWeight": 5, "maxWeight": 10, "increment": 5, "loadType": "vest", "restSeconds": 90, "restRange": [60, 90], "windowMin": 6, "windowMax": 10, "tempo": "2s descent", "compound": True, "rule": "וסט משקולות 5-10 ק״ג; ביצוע על ידיות push-up" },

    { "id": "wall-walk-partial", "name": "Wall Walk (Partial)", "category": "Shoulders", "type": "variation", "restSeconds": 90, "restRange": [60, 90], "windowMin": 3, "windowMax": 5, "tempo": "slow", "compound": True, "rule": "טיפוס חלקי על הקיר; שמירה על ליבה מתוחה" },
    { "id": "wall-walk-full", "name": "Wall Walk (Full)", "category": "Shoulders", "type": "variation", "restSeconds": 90, "restRange": [60, 90], "windowMin": 3, "windowMax": 5, "tempo": "slow", "compound": True, "rule": "טיפוס מלא עד שבית החזה נוגע קרוב לקיר" },
    { "id": "wall-handstand", "name": "Wall Handstand", "category": "Shoulders", "type": "timebased", "restSeconds": 90, "restRange": [60, 90], "windowMin": 15, "windowMax": 40, "tempo": "static hold", "compound": True, "rule": "עמידת ידיים סטטית מול הקיר; דחיפה חזקה של הכתפיים" },
    { "id": "elevated-pike-push-up", "name": "Elevated Pike Push-Up", "category": "Shoulders", "type": "variation", "restSeconds": 90, "restRange": [60, 90], "windowMin": 6, "windowMax": 10, "tempo": "2s descent", "compound": True, "rule": "רגליים מוגבהות על כיסא; ירידה אלכסונית של הראש קדימה" },
    { "id": "single-arm-seated-ohp", "name": "Single-Arm Seated OHP", "category": "Shoulders", "type": "weighted", "startingWeight": 9, "minWeight": 6, "maxWeight": 24, "increment": 3, "loadType": "each", "restSeconds": 90, "restRange": [60, 90], "windowMin": 6, "windowMax": 10, "tempo": "2s descent", "compound": True, "rule": "לחיצת כתפיים חד-צדדית בישיבה; שמירה על יציבות הליבה" },
    { "id": "pull-up-overhand", "name": "Pull-Up (Overhand)", "category": "Pull", "type": "bodyweight", "restSeconds": 120, "restRange": [90, 120], "windowMin": 3, "windowMax": 8, "tempo": "2s descent", "compound": True, "rule": "אחיזה עילית רחבה; סנטר מעבר למתח, ירידה מבוקרת" },
    { "id": "chin-up", "name": "Chin-Up", "category": "Pull", "type": "bodyweight", "restSeconds": 120, "restRange": [90, 120], "windowMin": 3, "windowMax": 8, "tempo": "2s descent", "compound": True, "rule": "אחיזה תחתית (כפות ידיים אליך); סנטר מעבר למתח" },
    { "id": "weighted-pull-up", "name": "Weighted Pull-Up", "category": "Pull", "type": "weighted", "startingWeight": 5, "minWeight": 5, "maxWeight": 10, "increment": 5, "loadType": "vest", "restSeconds": 120, "restRange": [90, 120], "windowMin": 4, "windowMax": 6, "tempo": "2s descent", "compound": True, "rule": "מתח אחיזה עילית עם וסט משקולות 5-10 ק״ג" },
    { "id": "weighted-chin-up", "name": "Weighted Chin-Up", "category": "Pull", "type": "weighted", "startingWeight": 5, "minWeight": 5, "maxWeight": 10, "increment": 5, "loadType": "vest", "restSeconds": 120, "restRange": [90, 120], "windowMin": 4, "windowMax": 6, "tempo": "2s descent", "compound": True, "rule": "מתח אחיזה תחתית עם וסט משקולות 5-10 ק״ג" },
    { "id": "single-arm-curl", "name": "Single-Arm Curl", "category": "Arms", "type": "weighted", "startingWeight": 6, "minWeight": 3, "maxWeight": 18, "increment": 3, "loadType": "each", "restSeconds": 60, "restRange": [45, 60], "windowMin": 8, "windowMax": 12, "tempo": "2s descent", "compound": False, "rule": "כפיפת מרפקים חד-צדדית במצב עמידה/ישיבה" },
    { "id": "glute-bridge", "name": "Glute Bridge", "category": "Legs", "type": "bodyweight", "restSeconds": 60, "restRange": [45, 60], "windowMin": 12, "windowMax": 15, "tempo": "1s pause", "compound": True, "rule": "הרמת אגן בשכיבה על הגב; כיווץ יתדות בישבן 1 שניה" },
    { "id": "db-glute-bridge", "name": "DB Glute Bridge", "category": "Legs", "type": "weighted", "startingWeight": 9, "minWeight": 3, "maxWeight": 24, "increment": 3, "loadType": "on_hips", "restSeconds": 90, "restRange": [60, 90], "windowMin": 10, "windowMax": 15, "tempo": "1s pause", "compound": True, "rule": "משקולת מונחת על האגן; כיווץ חזק של הישבן בשיא התנועה" },
    { "id": "db-bss-goblet", "name": "DB BSS (Goblet)", "category": "Legs", "type": "weighted", "startingWeight": 9, "minWeight": 6, "maxWeight": 24, "increment": 3, "loadType": "goblet", "restSeconds": 90, "restRange": [60, 90], "windowMin": 8, "windowMax": 12, "tempo": "2s descent", "compound": True, "rule": "סקוואט בולגרי עם משקולת בודדת אחוזת חזה (Goblet)" },
    { "id": "walking-lunge-goblet", "name": "Walking Lunge (Goblet)", "category": "Legs", "type": "weighted", "startingWeight": 9, "minWeight": 6, "maxWeight": 24, "increment": 3, "loadType": "goblet", "restSeconds": 90, "restRange": [60, 90], "windowMin": 8, "windowMax": 12, "tempo": "2s descent", "compound": True, "rule": "מכרעיים בהליכה עם משקולת אחוזת חזה" },
    { "id": "wrist-rocks", "name": "Wrist Rocks", "category": "Warmup", "type": "timebased", "restSeconds": 0, "restRange": [0, 0], "windowMin": 10, "windowMax": 10, "tempo": "slow", "compound": False, "rule": "תנועתיות ושחרור מפרקי כף היד" }
]

def make_ex_obj(slot, ex_id, name, sets_str, rep_window=None, weight=None, tempo=None, rest=90, is_warmup=False,
                structure="straight", pair_id=None, circuit_id=None, block_id=None, block_order=None,
                circuit_order=None, toggle_group=None, toggle_active_on=None, microcycle=None, active_weeks=None, arm_block=False):
    obj = {
        "slot": slot,
        "id": ex_id,
        "name": name,
        "sets": sets_str,
        "repWindow": rep_window or sets_str,
        "weight": weight,
        "tempo": tempo,
        "rest": rest,
        "restRange": [max(30, rest - 15), rest + 30] if rest >= 45 else [rest, rest],
        "isWarmup": is_warmup,
        "structure": structure,
        "pairId": pair_id,
        "circuitId": circuit_id,
        "blockId": block_id,
        "blockOrder": block_order,
        "circuitOrder": circuit_order,
        "toggleGroup": toggle_group,
        "toggleActiveOn": toggle_active_on,
        "microcycle": microcycle,
        "armBlock": arm_block or ex_id.startswith("arm-block")
    }
    if active_weeks is not None:
        obj["activeWeeks"] = active_weeks
    return obj

def get_leg_warmup():
    return [
        make_ex_obj("W1", "high-knees", "High Knees", "30 secs", is_warmup=True, rest=0),
        make_ex_obj("W2", "bodyweight-squat", "Bodyweight Squat", "2×8 (Slow)", is_warmup=True, rest=30),
        make_ex_obj("W3", "dead-bug", "Dead Bug", "1×6 each side", is_warmup=True, rest=30),
        make_ex_obj("W4", "glute-bridge", "Glute Bridge", "1×12", is_warmup=True, rest=30),
    ]

def get_push_warmup():
    return [
        make_ex_obj("W1", "arm-circles", "Arm Circles", "10 forward, 10 backward", is_warmup=True, rest=0),
        make_ex_obj("W2", "wall-slides", "Wall Slides", "1×8 (Slow)", is_warmup=True, rest=30),
        make_ex_obj("W3", "scapular-push-up", "Scapular Push-up", "2×10", is_warmup=True, rest=30),
        make_ex_obj("W4", "band-pull-apart", "Band Pull-Apart", "1×15", weight="Band 30 kg", is_warmup=True, rest=30),
    ]

def get_pull_warmup():
    return [
        make_ex_obj("W1", "arm-circles", "Arm Circles", "10 forward, 10 backward", is_warmup=True, rest=0),
        make_ex_obj("W2", "wall-slides", "Wall Slides", "1×8", is_warmup=True, rest=30),
        make_ex_obj("W3", "scapular-pull-up", "Scapular Pull-up", "2×6", is_warmup=True, rest=30),
        make_ex_obj("W4", "dead-hang", "Dead Hang", "1×15 secs", is_warmup=True, rest=30),
        make_ex_obj("W5", "seated-band-row", "Seated Band Row", "1×12", weight="Band 30 kg", is_warmup=True, rest=30),
    ]

def generate_day_exercises(dow, week):
    is_deload = week in DELOAD_WEEKS
    is_odd = (week % 2 != 0)
    parity = "odd" if is_odd else "even"

    if dow == 0:  # Sunday - Rest
        return "Rest", "—", []

    if dow == 2:  # Tuesday - Zone 2 Cardio
        walking_time = "30 mins" if is_deload else "45 mins"
        incline = "Incline 2%" if is_deload else "Incline 4%"
        speed = "5.0 km/h" if is_deload else "5.5 km/h"
        return "Zone 2 Cardio", "—", [
            make_ex_obj("A1", "brisk-walking", "Brisk Walking", walking_time, weight=incline, tempo=speed, rest=0)
        ]

    if dow == 4:  # Thursday - Active Recovery
        return "Active Recovery", "—", [
            make_ex_obj("A1", "relaxed-walking", "Relaxed Walking", "25 mins", weight="Incline 0%", tempo="4.5 km/h", rest=0),
            make_ex_obj("A2", "deep-mobility-protocol", "Deep Mobility Protocol", "10 mins", weight="Bodyweight", tempo="slow", rest=0)
        ]

    if dow == 6:  # Saturday - VO2 Max / Cardio
        if is_deload:
            return "Zone 2 Cardio", "—", [
                make_ex_obj("A1", "brisk-walking", "Brisk Walking", "30 mins", weight="Incline 2%", tempo="5.0 km/h", rest=0)
            ]
        incline_val = "3%" if week <= 4 else ("4%" if week <= 8 else ("5%" if week <= 16 else "6%"))
        return "VO2 Max", "9-10", [
            make_ex_obj("A1", "vo2-max-norwegian-4x4", "VO2 Max Norwegian 4x4", "4x4 mins (3 min rest)", weight=f"Incline {incline_val}", tempo="6.5 km/h effort / 4.5 km/h rest", rest=0)
        ]

    # STRENGTH DAYS: DOW 1 (Legs), DOW 3 (Push), DOW 5 (Pull)

    # STRENGTH DAYS: DOW 1 (Legs), DOW 3 (Push), DOW 5 (Pull)

    # ---------------- DOW 1: LEGS + CORE ----------------
    if dow == 1:
        day_title = "Legs + Core (Deload)" if is_deload else "Legs + Core"
        rpe = "5-6" if is_deload else "7-8"
        exs = get_leg_warmup()

        # A1: DB RDL -> Single-Leg RDL on W18+ (odd weeks)
        if week >= 18 and is_odd:
            sl_sets = "2×8/leg" if is_deload else "2×8-10/leg"
            sl_weight = "3 kg" if is_deload else ("9 kg" if week >= 42 else "6 kg each")
            exs.append(make_ex_obj("A1", "single-leg-rdl", "Single-Leg RDL", sl_sets, rep_window="8-10/leg", weight=sl_weight, tempo="3s descent", rest=75, structure="straight", toggle_group="day1-posterior-quad", toggle_active_on="odd"))
        else:
            rdl_sets = "2×8" if is_deload else ("4×10" if 5 <= week <= 8 else "3×8")
            rdl_weight = "3 kg each" if is_deload else ("12 kg" if week >= 10 else ("9 kg" if week >= 5 else "6 kg each"))
            exs.append(make_ex_obj("A1", "db-rdl", "DB Romanian Deadlift", rdl_sets, rep_window="6-12", weight=rdl_weight, tempo="3s descent", rest=105, structure="straight"))

        # A2: Squat / Lunge Progression Swap (W1 DB BSS -> W18 Reverse Lunge -> W34 DB BSS Goblet -> W42 Pistol Squat -> W62 Walking Lunge)
        if week >= 62:
            wl_sets = "2×8/leg" if is_deload else "3×8-12/leg"
            exs.append(make_ex_obj("A2", "walking-lunge-goblet", "Walking Lunge (Goblet)", wl_sets, rep_window="8-12/leg", weight="18 kg", tempo="2s descent", rest=75, structure="straight"))
        elif week >= 42:
            ps_sets = "2×5/leg" if is_deload else "3×5-8/leg"
            exs.append(make_ex_obj("A2", "pistol-squat-progression", "Pistol Squat Progression", ps_sets, rep_window="5-8/leg", weight="Bodyweight", tempo="slow descent", rest=90, structure="straight"))
        elif week >= 34:
            bssg_sets = "2×8/leg" if is_deload else "3×8-12/leg"
            bssg_w = "9 kg" if is_deload else ("24 kg" if week >= 62 else ("21 kg" if week >= 58 else ("18 kg" if week >= 53 else "15 kg")))
            exs.append(make_ex_obj("A2", "db-bss-goblet", "DB BSS (Goblet)", bssg_sets, rep_window="8-12/leg", weight=bssg_w, tempo="2s descent", rest=82, structure="straight"))
        elif week >= 18:
            rl_sets = "2×8/leg" if is_deload else "2×10-12/leg"
            rl_w = "6 kg each" if is_deload else ("12 kg" if week >= 42 else "9 kg")
            exs.append(make_ex_obj("A2", "reverse-lunge", "Reverse Lunge + DB", rl_sets, rep_window="10-12/leg", weight=rl_w, tempo="2s descent", rest=75, structure="straight"))
        else:
            bss_sets = "2×8/leg" if is_deload else "3×6-12/leg"
            bss_w = "Bodyweight" if is_deload else ("9 kg" if week >= 10 else ("3 kg" if week >= 5 else "6 kg each"))
            exs.append(make_ex_obj("A2", "bulgarian-split-squat", "DB Bulgarian Split Squat", bss_sets, rep_window="6-12/leg", weight=bss_w, tempo="2s descent", rest=82, structure="straight"))

        # A3: Glute Bridge (W1-4) -> DB Hip Thrust (W5+)
        if week >= 5:
            ht_sets = "2×10" if is_deload else "3×10-15"
            ht_w = "6 kg" if is_deload else ("24 kg" if week >= 50 else ("21 kg" if week >= 34 else ("18 kg" if week >= 26 else ("15 kg" if week >= 18 else ("12 kg" if week >= 10 else "9 kg total")))))
            exs.append(make_ex_obj("A3", "db-hip-thrust", "DB Hip Thrust", ht_sets, rep_window="10-15", weight=ht_w, tempo="1s pause", rest=75, structure="straight"))
        else:
            gb_sets = "2×12" if is_deload else "3×12-15"
            exs.append(make_ex_obj("A3", "db-glute-bridge", "DB Glute Bridge", gb_sets, rep_window="12-15", weight="9 kg", tempo="1s pause", rest=60, structure="straight"))

        # A4: Suitcase Carry
        sc_sets = "2×25m/side" if is_deload else "3×25-40m/side"
        sc_w = "9 kg" if is_deload else ("24 kg" if week >= 53 else ("21 kg" if week >= 26 else ("18 kg" if week >= 18 else ("15 kg" if week >= 5 else "12 kg"))))
        exs.append(make_ex_obj("A4", "suitcase-carry", "Suitcase Carry", sc_sets, rep_window="25-40m/side", weight=sc_w, tempo="walk", rest=60, structure="straight"))

        # Calf Block (Standing + Seated Calf Raise)
        calf_standing_sets = "2×15/leg" if is_deload else "3×12-20/leg"
        calf_seated_sets = "2×15/leg" if is_deload else "2×15-25/leg"
        exs.append(make_ex_obj("A5", "standing-single-leg-calf-raise", "Standing Single-Leg Calf Raise", calf_standing_sets, rep_window="12-20/leg", weight="6 kg in hand", tempo="2s descent", rest=45, structure="straight" if is_deload else "block", block_id="d1-calf-block", block_order=1))
        exs.append(make_ex_obj("A6", "seated-single-leg-calf-raise", "Seated Single-Leg Calf Raise", calf_seated_sets, rep_window="15-25/leg", weight="6 kg on knee", tempo="2s descent", rest=45, structure="straight" if is_deload else "block", block_id="d1-calf-block", block_order=2))

        # Core Circuit (Pallof, Dead Bug/Hollow Body)
        if week >= 10:
            exs.append(make_ex_obj("A7", "pallof-press-progression", "Pallof Press Progression", "2×10-12/side", rep_window="10-12/side", weight="Band 30 kg", tempo="1s pause", rest=45, structure="straight" if is_deload else "circuit", circuit_id="d1-core-circuit", circuit_order=1))

        if week >= 5:
            exs.append(make_ex_obj("A8", "hollow-body-hold", "Hollow Body Hold", "2×15 secs" if is_deload else "2×20-30 secs", rep_window="20-30s", weight="Bodyweight", tempo="static", rest=30, structure="straight" if is_deload else "circuit", circuit_id="d1-core-circuit", circuit_order=2))
        else:
            exs.append(make_ex_obj("A8", "dead-bug", "Dead Bug", "2×8/side" if is_deload else "3×12-20/side", rep_window="12-20/side", weight="Bodyweight", tempo="slow", rest=30, structure="straight" if is_deload else "circuit", circuit_id="d1-core-circuit", circuit_order=2))

        exs.append(make_ex_obj("A9", "micro-mobility-protocol", "Micro Mobility Protocol", "1×5 mins", weight="Bodyweight", tempo="slow", rest=0))
        return day_title, rpe, exs

    # ---------------- DOW 3: PUSH + SHOULDERS ----------------
    if dow == 3:
        day_title = "Push + Skill (Deload)" if is_deload else "Push + Skill"
        rpe = "5-6" if is_deload else "7-8"
        exs = get_push_warmup()

        # A1: Pike Progression Swap (W1 Pike -> W10 Wall Walk Partial -> W18 Wall Walk Full -> W26 Wall Handstand -> W41 Elevated Pike Push-Up)
        if week >= 41:
            exs.append(make_ex_obj("A1", "elevated-pike-push-up", "Elevated Pike Push-Up", "2×8" if is_deload else "3×8-12", rep_window="8-12", weight="Bodyweight", tempo="2s descent", rest=90, structure="straight"))
        elif week >= 26:
            exs.append(make_ex_obj("A1", "wall-handstand", "Wall Handstand", "2×20s" if is_deload else "3×30-45s", rep_window="30-45s", weight="Bodyweight", tempo="static", rest=90, structure="straight"))
        elif week >= 18:
            exs.append(make_ex_obj("A1", "wall-walk-full", "Wall Walk (Full)", "2×3" if is_deload else "3×3-5", rep_window="3-5", weight="Bodyweight", tempo="slow", rest=90, structure="straight"))
        elif week >= 10:
            exs.append(make_ex_obj("A1", "wall-walk-partial", "Wall Walk (Partial)", "2×3" if is_deload else "3×3-5", rep_window="3-5", weight="Bodyweight", tempo="slow", rest=75, structure="straight"))
        else:
            exs.append(make_ex_obj("A1", "pike-progression", "Pike Progression", "2×15 secs" if is_deload else "2×15-30 secs", rep_window="6-12", weight="Bodyweight", tempo="2s descent", rest=75, structure="straight"))

        # A2: DB Floor Press -> Single-Arm Floor Press (W18+)
        if week >= 18:
            fp_w = "12 kg" if is_deload else ("24 kg" if week >= 42 else ("21 kg" if week >= 34 else ("18 kg" if week >= 26 else "15 kg")))
            exs.append(make_ex_obj("A2", "single-arm-floor-press", "Single-Arm Floor Press", "2×8/side" if is_deload else "3×8-12/side", rep_window="8-12/side", weight=fp_w, tempo="2s descent", rest=90, structure="straight"))
        else:
            exs.append(make_ex_obj("A2", "db-floor-press", "DB Floor Press", "2×8" if is_deload else "3×6-12", rep_window="6-12", weight="3 kg each" if is_deload else ("12 kg" if week >= 10 else ("9 kg" if week >= 5 else "6 kg each")), tempo="2s descent", rest=105, structure="straight"))

        # A3: Push-Up Main Swap (W1 Push-up Bars -> W10 Deficit Push-Up -> W18 Feet-Elevated Push-Up -> W62 Weighted Deficit Push-Up)
        if week >= 62:
            exs.append(make_ex_obj("A3", "weighted-deficit-push-up", "Weighted Deficit Push-Up", "2×8" if is_deload else "3×8-12", rep_window="8-12", weight="+5 kg", tempo="2s descent", rest=90, structure="straight"))
        elif week >= 18:
            exs.append(make_ex_obj("A3", "feet-elevated-push-up", "Feet-Elevated Push-Up", "2×8" if is_deload else "3×10-15", rep_window="10-15", weight="Bodyweight", tempo="2s descent", rest=75, structure="straight"))
        elif week >= 10:
            exs.append(make_ex_obj("A3", "deficit-push-up", "Deficit Push-Up", "2×8" if is_deload else "3×10-15", rep_window="10-15", weight="Bodyweight", tempo="2s descent", rest=75, structure="straight"))
        else:
            exs.append(make_ex_obj("A3", "push-up-progression", "Push-up Bars Progression", "2×6" if is_deload else "3×8-15", rep_window="8-15", weight="Bodyweight", tempo="2s descent", rest=75, structure="straight"))

        # A4: OHP Swap (W1 Seated DB OHP -> W49 Single-Arm Seated OHP)
        if week >= 49:
            ohp_w = "12 kg" if is_deload else ("24 kg" if week >= 62 else ("21 kg" if week >= 58 else "18 kg"))
            exs.append(make_ex_obj("A4", "single-arm-seated-ohp", "Single-Arm Seated OHP", "2×8/side" if is_deload else "3×8-12/side", rep_window="8-12/side", weight=ohp_w, tempo="2s descent", rest=82, structure="straight"))
        else:
            ohp_w = "3 kg each" if is_deload else ("12 kg" if week >= 42 else ("9 kg" if week >= 18 else "6 kg each"))
            exs.append(make_ex_obj("A4", "seated-db-ohp", "Seated DB Overhead Press", "2×8" if is_deload else "3×6-12", rep_window="6-12", weight=ohp_w, tempo="2s descent", rest=82, structure="straight"))

        # A5: Triceps Extension
        tri_w = "3 kg total" if is_deload else ("18 kg" if week >= 53 else ("15 kg" if week >= 50 else ("12 kg" if week >= 34 else ("9 kg" if week >= 10 else "6 kg total"))))
        exs.append(make_ex_obj("A5", "db-oh-triceps-extension", "DB Overhead Triceps Extension", "2×10" if is_deload else "4×10-15", rep_window="10-15", weight=tri_w, tempo="2s descent", rest=45, structure="straight"))

        # A6: Diamond Push-Up (W62+ Weighted Diamond)
        if week >= 62:
            exs.append(make_ex_obj("A6", "weighted-diamond-push-up", "Weighted Diamond Push-Up", "2×8" if is_deload else "2×8-12", rep_window="8-12", weight="+5 kg", tempo="2s descent", rest=60, structure="straight"))
        else:
            exs.append(make_ex_obj("A6", "diamond-push-up", "Diamond Push-Up", "2×10" if is_deload else "2×10-15", rep_window="10-15", weight="Bodyweight", tempo="2s descent", rest=45, structure="straight"))

        # Pair: TRX Row ↔ DB Lateral Raise
        lat_w = "3 kg each" if is_deload else ("9 kg" if week >= 53 else ("6 kg" if week >= 42 else "3 kg each"))
        exs.append(make_ex_obj("A7", "trx-row", "TRX Row", "2×10" if is_deload else "2×10-15", rep_window="10-15", weight="Bodyweight", tempo="2s descent", rest=75, structure="straight" if is_deload else "pair", pair_id="d3-row-lateral"))
        exs.append(make_ex_obj("A8", "db-lateral-raise", "DB Lateral Raise", "2×12" if is_deload else "2×12-20", rep_window="12-20", weight=lat_w, tempo="2s descent", rest=75, structure="straight" if is_deload else "pair", pair_id="d3-row-lateral"))

        # Rear Delt Toggle
        if is_odd:
            exs.append(make_ex_obj("A9", "trx-y-t-w", "TRX Y-T-W", "2×8/shape", rep_window="8-12/shape", weight="Bodyweight", tempo="1s pause", rest=45, structure="straight", toggle_group="day3-rear-delt", toggle_active_on="odd"))
        else:
            band_w = "Band 30 kg" if week < 5 else ("Band 50 kg" if week >= 9 else "Band 40 kg")
            exs.append(make_ex_obj("A9", "band-pull-apart", "Band Pull-Apart", "2×15" if is_deload else "3×15", rep_window="15-25", weight=band_w, tempo="1s squeeze", rest=45, structure="straight", toggle_group="day3-rear-delt", toggle_active_on="even"))

        # Arm Block (Myo-Reps)
        if week >= 10 and not is_deload:
            exs.append(make_ex_obj("A10", "arm-block-lateral-raise", "Arm Block - DB Lateral Raise", "Myo-Reps Cluster", rep_window="Myo-Reps Cluster", weight="3 kg each", tempo="2s descent", rest=15, structure="myo-reps"))
            exs.append(make_ex_obj("A11", "arm-block-triceps-ext", "Arm Block - DB Overhead Triceps Ext", "Myo-Reps Cluster", rep_window="Myo-Reps Cluster", weight="6 kg total", tempo="2s descent", rest=15, structure="myo-reps"))

        exs.append(make_ex_obj("A12", "micro-mobility-protocol", "Micro Mobility Protocol", "1×5 mins", weight="Bodyweight", tempo="slow", rest=0))
        return day_title, rpe, exs

    # ---------------- DOW 5: PULL + GRIP + BICEPS ----------------
    if dow == 5:
        day_title = "Pull + Grip (Deload)" if is_deload else "Pull + Grip"
        rpe = "5-6" if is_deload else "7-8"
        exs = get_pull_warmup()

        # A1: Pull-Up Swap (W1 Pull-Up Progression -> W5 Chin-Up Progression -> W10 Pull-Up Overhand / Chin-Up -> W62 Weighted Pull-Up / Chin-Up)
        if week >= 66 and not is_odd:
            exs.append(make_ex_obj("A1", "weighted-chin-up", "Weighted Chin-Up", "2×3" if is_deload else "3×3-6", rep_window="3-6", weight="+5 kg", tempo="2s descent", rest=105, structure="straight"))
        elif week >= 62 and is_odd:
            exs.append(make_ex_obj("A1", "weighted-pull-up", "Weighted Pull-Up", "2×3" if is_deload else "3×3-6", rep_window="3-6", weight="+5 kg", tempo="2s descent", rest=105, structure="straight"))
        elif week >= 10:
            if is_odd:
                exs.append(make_ex_obj("A1", "pull-up-overhand", "Pull-Up (Overhand)", "2×2" if is_deload else "3×3-8", rep_window="3-8", weight="Bodyweight", tempo="2s descent", rest=105, structure="straight"))
            else:
                exs.append(make_ex_obj("A1", "chin-up", "Chin-Up", "2×3" if is_deload else "3×4-10", rep_window="4-10", weight="Bodyweight", tempo="2s descent", rest=105, structure="straight"))
        elif week >= 5:
            exs.append(make_ex_obj("A1", "chin-up-progression", "Chin-Up Progression", "2×2" if is_deload else "3×3-8", rep_window="3-8", weight="Bodyweight", tempo="2s descent", rest=105, structure="straight"))
        else:
            exs.append(make_ex_obj("A1", "pull-up-progression", "Pull-Up Progression", "2×2" if is_deload else "3×3-8", rep_window="3-8", weight="Bodyweight", tempo="2s descent", rest=105, structure="straight"))

        # A2: One-Arm DB Row
        row_w = "3 kg" if is_deload else ("24 kg" if week >= 53 else ("21 kg" if week >= 42 else ("15 kg" if week >= 26 else ("12 kg" if week >= 10 else ("9 kg" if week >= 5 else "6 kg")))))
        exs.append(make_ex_obj("A2", "one-arm-db-row", "One-Arm DB Row", "2×8/side" if is_deload else "3×8-12/side", rep_window="8-12/side", weight=row_w, tempo="2s descent", rest=82, structure="straight"))

        # A3: TRX Face Pull
        exs.append(make_ex_obj("A3", "trx-face-pull", "TRX Face Pull", "2×10" if is_deload else "2×12-20", rep_window="12-20", weight="Bodyweight", tempo="2s descent", rest=45, structure="straight"))

        # Pair: Push-Up Volume ↔ Biceps Curl
        biceps_cycle_week = ((week - 1) % 3) + 1
        is_biceps_light = (biceps_cycle_week == 3)
        
        # Biceps Exercise Swap (W1 DB Curl -> W5 Hammer Curl -> W49 Single-Arm Curl)
        if week >= 49:
            biceps_ex_id = "single-arm-curl"
            biceps_ex_name = "Single-Arm Curl"
            biceps_w = "9 kg" if is_deload else ("18 kg" if week >= 66 else "15 kg")
        elif week >= 5:
            biceps_ex_id = "hammer-curl"
            biceps_ex_name = "Hammer Curl"
            biceps_w = "3 kg each" if is_deload else "6 kg each"
        else:
            biceps_ex_id = "db-curl"
            biceps_ex_name = "DB Curl"
            biceps_w = "3 kg each"

        if not is_biceps_light and not is_deload:
            exs.append(make_ex_obj("A4", "push-up-volume", "Push-Up Volume (Day 5)", "2×10-20", rep_window="10-20", weight="Bodyweight", tempo="2s descent", rest=75, structure="pair", pair_id="d5-pushup-curl"))
            exs.append(make_ex_obj("A5", biceps_ex_id, biceps_ex_name, "2×10-15", rep_window="10-15", weight=biceps_w, tempo="2s descent", rest=45, structure="pair", pair_id="d5-pushup-curl", microcycle="biceps-microcycle", active_weeks=[1, 2]))
        else:
            exs.append(make_ex_obj("A4", "push-up-volume", "Push-Up Volume (Day 5)", "2×10", rep_window="10-20", weight="Bodyweight", tempo="2s descent", rest=75, structure="straight"))

        # A6: Secondary Biceps
        exs.append(make_ex_obj("A6", "db-curl" if week >= 5 else "hammer-curl", "DB Curl" if week >= 5 else "Hammer Curl", "1×10" if is_deload else "2×10-15", rep_window="10-15", weight=biceps_w, tempo="2s descent", rest=45, structure="straight", microcycle="biceps-microcycle", active_weeks=[1, 2, 3]))

        # Pair: Towel Hang ↔ L-Sit Progression
        exs.append(make_ex_obj("A7", "towel-hang", "Towel Hang", "2×15-45 secs", rep_window="15-45s", weight="Bodyweight", tempo="static", rest=45, structure="straight" if is_deload else "pair", pair_id="d5-grip-core"))
        exs.append(make_ex_obj("A8", "l-sit-progression", "L-Sit Progression", "2×8-20 secs", rep_window="8-20s", weight="Bodyweight", tempo="static", rest=45, structure="straight" if is_deload else "pair", pair_id="d5-grip-core"))

        if week >= 10 and not is_deload:
            exs.append(make_ex_obj("A9", "arm-block-biceps-curl", "Arm Block - DB Curl", "Myo-Reps Cluster", rep_window="Myo-Reps Cluster", weight="3 kg each", tempo="2s descent", rest=15, structure="myo-reps"))

        exs.append(make_ex_obj("A10", "micro-mobility-protocol", "Micro Mobility Protocol", "1×5 mins", weight="Bodyweight", tempo="slow", rest=0))
        return day_title, rpe, exs

    return "Rest", "—", []

def generate_program():
    daily = []
    day_num = 0
    total_weeks = 52

    for week in range(1, total_weeks + 1):
        for dow in [1, 2, 3, 4, 5, 6, 0]:
            day_num += 1
            date = START_DATE + timedelta(days=day_num - 1)
            day_type, rpe, exercises = generate_day_exercises(dow, week)

            is_deload = week in DELOAD_WEEKS
            daily.append({
                "dayNum": day_num,
                "week": f"Week {week}",
                "dayOfWeek": DAYS_ENG[dow],
                "date": date.strftime("%d/%m/%Y"),
                "dayType": day_type,
                "plannedRPE": rpe,
                "isDeload": is_deload,
                "exercises": exercises
            })

    # Master Lean Structures definition matching UPDATE_PROGRAM.md spec
    lean_structures = {
        "pairs": [
            {
                "id": "d3-row-lateral",
                "dayIndex": 3,
                "name": "TRX Row ↔ DB Lateral Raise",
                "type": "non-competing",
                "restAfterPairSeconds": 75,
                "members": ["trx-row", "db-lateral-raise"]
            },
            {
                "id": "d5-pushup-curl",
                "dayIndex": 5,
                "name": "Push-Up Volume ↔ DB Curl",
                "type": "antagonistic",
                "restAfterPairSeconds": 75,
                "members": ["push-up-volume", "db-curl"]
            },
            {
                "id": "d5-grip-core",
                "dayIndex": 5,
                "name": "Towel Hang ↔ L-Sit Tuck",
                "type": "non-competing",
                "restAfterPairSeconds": 60,
                "members": ["towel-hang", "l-sit-progression"]
            }
        ],
        "circuits": [
            {
                "id": "d1-core-circuit",
                "dayIndex": 1,
                "name": "Core Citadel Circuit",
                "restAfterCircuitSeconds": 90,
                "exercises": ["pallof-press-progression", "dead-bug", "hollow-body-hold"]
            }
        ],
        "blocks": [
            {
                "id": "d1-calf-block",
                "dayIndex": 1,
                "name": "Calf Hypertrophy Block",
                "restAfterBlockSeconds": 60,
                "exercises": ["standing-single-leg-calf-raise", "seated-single-leg-calf-raise"]
            }
        ],
        "toggles": [
            {
                "id": "T1_DAY1",
                "toggleGroup": "day1-posterior-quad",
                "dayIndex": 1,
                "name": "Day 1 Posterior / Quad Toggle",
                "members": [
                    { "exerciseId": "single-leg-rdl", "activeOn": "odd" },
                    { "slotId": "lunge-pistol-slot", "activeOn": "even", "fallbackExerciseId": "reverse-lunge", "unlockedExerciseId": "pistol-squat-progression" }
                ]
            },
            {
                "id": "T2_DAY3",
                "toggleGroup": "day3-rear-delt",
                "dayIndex": 3,
                "name": "Day 3 Rear Delt Toggle",
                "members": [
                    { "exerciseId": "trx-y-t-w", "activeOn": "odd" },
                    { "exerciseId": "band-pull-apart", "activeOn": "even" }
                ]
            }
        ]
    }

    progression_settings = {
        "deloadEveryWeeks": 8,
        "deloadWeightReductionKg": 2,
        "deloadTimeTargetPercent": 70,
        "deloadSetsCeiling": 2,
        "legalWeights": [3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24],
        "allowUndoLastDecision": True,
        "zeroDecisions": True,
        "adaptiveRest": True,
        "armBlockConditional": True,
        "armBlock": {
            "enabledFromWeek": 10,
            "maxArmBlockExposurePerMusclePerWeek": 1,
            "muscleAreaMap": {
                "3": { "db-lateral-raise": "lateral-shoulder", "db-oh-triceps-extension": "triceps" },
                "5": { "db-curl": "biceps", "hammer-curl": "biceps" }
            }
        },
        "bicepsMicrocycle": {
            "heavyWeeks": 2,
            "lightWeeks": 1,
            "lightWeekExercise": "hammer-curl",
            "lightWeekSets": 2
        },
        "softenedProgression": {
            "enabled": True,
            "conditions": ["all_in_window", "all_reps_ge_max_minus_1", "previous_session_all_reps_ge_max"]
        },
        "frequencyAdditions": {
            "chestVolume": "Push-Up Volume on Day 5",
            "backVolume": "TRX Row on Day 3"
        },
        "leanMode": {
            "enabled": True,
            "dissolvePairsOnDeload": True,
            "dissolvePairsOnBelow": True,
            "adaptiveRestExtensionOnBelowSecs": 30
        }
    }

    return {
        "version": "15.6 Lean",
        "progressionSettings": progression_settings,
        "leanStructures": lean_structures,
        "daily": daily,
        "exercises": EXERCISES_CATALOG
    }

def to_training_data_json(program):
    rows = []
    for day in program["daily"]:
        row = {
            "Day": f"Day {day['dayNum']}",
            "Week": day["week"],
            "Day of Week": day["dayOfWeek"],
            "Date": day["date"],
            "Day Type": day["dayType"],
            "Planned RPE": day["plannedRPE"],
        }
        mapped = {}
        idx = 1
        for e in day["exercises"]:
            if e["slot"].startswith("W"):
                mapped[e["slot"]] = e
            else:
                mapped[f"A{idx}"] = e
                idx += 1
        for slot in ["W1","W2","W3","W4","W5","W6","W7","A1","A2","A3","A4","A5","A6","A7","A8","A9","A10","A11"]:
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

    img_dir = "images/exercises"
    if os.path.exists(img_dir):
        fallback = os.path.join(img_dir, "BODYWEIGHT SQUAT.png")
        for name in required:
            img = name.replace('/', '-').upper() + ".png"
            path = os.path.join(img_dir, img)
            if not os.path.exists(path) and os.path.exists(fallback):
                shutil.copy(fallback, path)

    print(f"Done — FitUp Pro v15.6 Lean Edition generated successfully!")
    print(f"Total days: {len(program['daily'])}, Master exercises in catalog: {len(program['exercises'])}")
