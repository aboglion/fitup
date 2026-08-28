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
        "id": "goblet-rdl",
        "name": "Goblet Romanian Deadlift",
        "category": "Legs",
        "type": "weighted",
        "startingWeight": 6,
        "minWeight": 3,
        "maxWeight": 24,
        "increment": 1,
        "loadType": "each",
        "restSeconds": 105,
        "restRange": [90, 120],
        "repWindow": "6-12",
        "tempo": "3s descent",
        "compound": True,
        "structure": "straight",
        "sets": 3,
        "rule": "neutral spine קשיח; אם הגב מתעגל, BELOW"
    },
    {
        "id": "single-leg-rdl",
        "name": "Single-Leg RDL",
        "category": "Legs",
        "type": "weighted",
        "startingWeight": 6,
        "minWeight": 3,
        "maxWeight": 24,
        "increment": 1,
        "loadType": "each",
        "restSeconds": 75,
        "restRange": [60, 90],
        "repWindow": "8-10",
        "tempo": "3s descent",
        "compound": True,
        "structure": "straight",
        "sets": 2,
        "rule": "neutral spine; אם מאבד שיווי משקל, BELOW"
    },
    {
        "id": "goblet-reverse-lunge",
        "name": "Goblet Reverse Lunge",
        "category": "Legs",
        "type": "weighted",
        "startingWeight": 6,
        "minWeight": 3,
        "maxWeight": 24,
        "increment": 1,
        "loadType": "each",
        "restSeconds": 75,
        "restRange": [60, 90],
        "repWindow": "10-12",
        "tempo": "2s descent",
        "compound": True,
        "structure": "straight",
        "sets": 2
    },
    {
        "id": "pistol-squat-progression",
        "name": "Pistol Squat",
        "category": "Legs",
        "type": "weighted",
        "startingWeight": 6,
        "minWeight": 3,
        "maxWeight": 24,
        "increment": 1,
        "loadType": "total",
        "restSeconds": 105,
        "restRange": [90, 120],
        "repWindow": "3-8",
        "tempo": "slow descent",
        "compound": True,
        "structure": "straight",
        "sets": 2,
        "unlocked": False,
        "unlockCriteria": {
            "exercise": "goblet-bulgarian-split-squat",
            "targetReps": 12,
            "targetWeightKg": 24
        },
        "rule": "ירידה איטית; אם הברך קורסת פנימה (valgus), BELOW"
    },
    {
        "id": "goblet-bulgarian-split-squat",
        "name": "Goblet Bulgarian Split Squat",
        "category": "Legs",
        "type": "weighted",
        "startingWeight": 6,
        "minWeight": 3,
        "maxWeight": 24,
        "increment": 1,
        "loadType": "each",
        "restSeconds": 82,
        "restRange": [75, 90],
        "repWindow": "6-12",
        "tempo": "2s descent",
        "compound": True,
        "sets": 3,
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
        "repWindow": "10-15",
        "tempo": "1s pause at top",
        "compound": True,
        "sets": 3,
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
        "repWindow": "25-40m",
        "tempo": "controlled walk",
        "compound": False,
        "sets": 3,
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
        "repWindow": "12-20",
        "tempo": "2s descent, 1s pause, 1s squeeze",
        "compound": False,
        "sets": 3,
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
        "repWindow": "15-25",
        "tempo": "2s descent, 1s pause, 1s squeeze",
        "compound": False,
        "sets": 2,
        "structure": "block",
        "blockId": "d1-calf-block",
        "blockOrder": 2
    },
    {
        "id": "pallof-press-progression",
        "name": "Pallof Press Progression",
        "category": "Core",
        "type": "variation",
        "restSeconds": 30,
        "repWindow": "10-12",
        "tempo": "1s pause",
        "compound": False,
        "sets": 2,
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
        "repWindow": "12-20",
        "tempo": "slow",
        "compound": False,
        "sets": 3,
        "structure": "circuit",
        "circuitId": "d1-core-circuit",
        "circuitOrder": 2,
        "stages": ["Bodyweight", "1kg", "2kg", "3kg"]
    },
    {
        "id": "hollow-body-hold",
        "name": "Hollow Body Hold",
        "category": "Core",
        "type": "timebased",
        "restSeconds": 30,
        "repWindow": "20-30s",
        "tempo": "static hold",
        "compound": False,
        "sets": 2,
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
        "repWindow": "15-30s or 6-12",
        "tempo": "2s descent",
        "compound": True,
        "sets": 2,
        "structure": "straight",
        "stages": ["Pike Hold", "Feet-Elevated Pike Hold", "Pike Push-Up", "Elevated Pike Push-Up"]
    },
    {
        "id": "single-arm-floor-press",
        "name": "Single-Arm Floor Press",
        "category": "Push",
        "type": "weighted",
        "startingWeight": 6,
        "minWeight": 3,
        "maxWeight": 24,
        "increment": 1,
        "loadType": "each",
        "restSeconds": 105,
        "restRange": [90, 120],
        "repWindow": "6-12",
        "tempo": "2s descent",
        "compound": True,
        "sets": 3,
        "structure": "straight"
    },
    {
        "id": "push-up-progression",
        "name": "Push-up Bars Progression",
        "category": "Push",
        "type": "variation",
        "restSeconds": 75,
        "restRange": [60, 90],
        "repWindow": "8-15",
        "tempo": "2s descent",
        "compound": True,
        "sets": 3,
        "structure": "straight",
        "stages": ["Incline Push-Up", "Push-Up"]
    },
    {
        "id": "deficit-push-up",
        "name": "Deficit Push-Up",
        "category": "Push",
        "type": "variation",
        "restSeconds": 75,
        "restRange": [60, 90],
        "repWindow": "8-15",
        "tempo": "2s descent",
        "compound": True,
        "sets": 3,
        "structure": "straight"
    },
    {
        "id": "feet-elevated-push-up",
        "name": "Feet-Elevated Push-Up",
        "category": "Push",
        "type": "variation",
        "restSeconds": 75,
        "restRange": [60, 90],
        "repWindow": "8-12",
        "tempo": "2s descent",
        "compound": True,
        "sets": 3,
        "structure": "straight",
        "unlocked": False,
        "unlockCriteria": {
            "exercise": "deficit-push-up",
            "targetReps": 12
        }
    },
    {
        "id": "weighted-deficit-push-up",
        "name": "Weighted Deficit Push-Up",
        "category": "Push",
        "type": "weighted",
        "startingWeight": 5,
        "minWeight": 5,
        "maxWeight": 20,
        "increment": 1,
        "loadType": "total",
        "restSeconds": 90,
        "repWindow": "6-12",
        "tempo": "2s descent",
        "compound": True,
        "sets": 3,
        "structure": "straight",
        "unlocked": False,
        "unlockCriteria": {
            "exercise": "feet-elevated-push-up"
        }
    },
    {
        "id": "wall-walk-partial",
        "name": "Wall Walk (Partial)",
        "category": "Shoulders",
        "type": "variation",
        "restSeconds": 75,
        "repWindow": "3-6",
        "tempo": "controlled",
        "compound": True,
        "sets": 2,
        "structure": "straight",
        "unlocked": False,
        "unlockCriteria": {
            "exercise": "pike-progression",
            "targetStageIndex": 2,
            "targetReps": 10
        }
    },
    {
        "id": "wall-walk-full",
        "name": "Wall Walk (Full)",
        "category": "Shoulders",
        "type": "variation",
        "restSeconds": 90,
        "repWindow": "3-6",
        "tempo": "controlled",
        "compound": True,
        "sets": 2,
        "structure": "straight",
        "unlocked": False,
        "unlockCriteria": {
            "exercise": "wall-walk-partial"
        }
    },
    {
        "id": "wall-handstand",
        "name": "Wall Handstand",
        "category": "Shoulders",
        "type": "timebased",
        "restSeconds": 90,
        "repWindow": "20-45s",
        "tempo": "static hold",
        "compound": True,
        "sets": 2,
        "structure": "straight",
        "unlocked": False,
        "unlockCriteria": {
            "exercise": "wall-walk-full"
        }
    },
    {
        "id": "elevated-pike-push-up",
        "name": "Elevated Pike Push-Up",
        "category": "Shoulders",
        "type": "variation",
        "restSeconds": 90,
        "repWindow": "6-10",
        "tempo": "2s descent",
        "compound": True,
        "sets": 2,
        "structure": "straight",
        "unlocked": False,
        "unlockCriteria": {
            "exercise": "wall-handstand"
        }
    },
    {
        "id": "pull-up-overhand",
        "name": "Pull-Up (Overhand)",
        "category": "Pull",
        "type": "variation",
        "restSeconds": 105,
        "repWindow": "4-8",
        "tempo": "2s descent",
        "compound": True,
        "sets": 3,
        "structure": "straight"
    },
    {
        "id": "chin-up",
        "name": "Chin-Up",
        "category": "Pull",
        "type": "variation",
        "restSeconds": 105,
        "repWindow": "4-8",
        "tempo": "2s descent",
        "compound": True,
        "sets": 3,
        "structure": "straight"
    },
    {
        "id": "weighted-pull-up",
        "name": "Weighted Pull-Up",
        "category": "Pull",
        "type": "weighted",
        "startingWeight": 5,
        "minWeight": 5,
        "maxWeight": 20,
        "increment": 1,
        "loadType": "total",
        "restSeconds": 120,
        "repWindow": "4-8",
        "tempo": "2s descent",
        "compound": True,
        "sets": 3,
        "structure": "straight"
    },
    {
        "id": "weighted-chin-up",
        "name": "Weighted Chin-Up",
        "category": "Pull",
        "type": "weighted",
        "startingWeight": 5,
        "minWeight": 5,
        "maxWeight": 20,
        "increment": 1,
        "loadType": "total",
        "restSeconds": 120,
        "repWindow": "4-8",
        "tempo": "2s descent",
        "compound": True,
        "sets": 3,
        "structure": "straight"
    },
    {
        "id": "single-arm-seated-ohp",
        "name": "Single-Arm Seated OHP",
        "category": "Shoulders",
        "type": "weighted",
        "startingWeight": 6,
        "minWeight": 3,
        "maxWeight": 24,
        "increment": 1,
        "loadType": "each",
        "restSeconds": 82,
        "restRange": [75, 90],
        "repWindow": "6-12",
        "tempo": "2s descent",
        "compound": True,
        "sets": 3,
        "structure": "straight"
    },
    {
        "id": "db-overhead-triceps-extension",
        "name": "DB Overhead Triceps Extension",
        "category": "Arms",
        "type": "weighted",
        "startingWeight": 6,
        "minWeight": 3,
        "maxWeight": 24,
        "increment": 1,
        "loadType": "total",
        "restSeconds": 45,
        "repWindow": "10-15",
        "tempo": "2s descent",
        "compound": False,
        "sets": 4,
        "structure": "straight"
    },
    {
        "id": "diamond-push-up",
        "name": "Diamond Push-Up",
        "category": "Push",
        "type": "variation",
        "restSeconds": 45,
        "repWindow": "10-15",
        "tempo": "2s descent",
        "compound": False,
        "sets": 2,
        "structure": "straight",
        "stages": ["Incline Diamond", "Diamond Push-Up", "Weighted Diamond (vest 5kg)"]
    },
    {
        "id": "trx-row",
        "name": "TRX Row",
        "category": "Pull",
        "type": "variation",
        "restSeconds": 75,
        "repWindow": "10-15",
        "tempo": "2s descent",
        "compound": True,
        "sets": 2,
        "structure": "pair",
        "pairId": "d3-row-lateral",
        "orderInPair": 1,
        "stages": ["Angle 1", "Angle 2 (45°)", "Angle 3", "Feet-Elevated"]
    },
    {
        "id": "single-arm-lateral-raise",
        "name": "Single-Arm Lateral Raise",
        "category": "Shoulders",
        "type": "weighted",
        "startingWeight": 3,
        "minWeight": 3,
        "maxWeight": 12,
        "increment": 1,
        "loadType": "each",
        "restSeconds": 75,
        "repWindow": "12-20",
        "tempo": "2s descent",
        "compound": False,
        "sets": 2,
        "structure": "pair",
        "pairId": "d3-row-lateral",
        "orderInPair": 2
    },
    {
        "id": "trx-ytw",
        "name": "TRX Y-T-W",
        "category": "Shoulders",
        "type": "variation",
        "restSeconds": 45,
        "repWindow": "8-12",
        "tempo": "1s pause",
        "compound": False,
        "sets": 2,
        "structure": "straight",
        "toggleGroup": "rear-delt",
        "toggleActiveOn": "odd",
        "stages": ["Angle 1", "Angle 2", "Angle 3"]
    },
    {
        "id": "band-pull-apart",
        "name": "Band Pull-Apart",
        "category": "Shoulders",
        "type": "variation",
        "restSeconds": 45,
        "repWindow": "15-20",
        "tempo": "1s squeeze",
        "compound": False,
        "sets": 3,
        "structure": "straight",
        "toggleGroup": "rear-delt",
        "toggleActiveOn": "even",
        "stages": ["Band 30kg", "Band 40kg", "Band 50kg"]
    },
    
    # Day 5 - Pull, Grip, Core, Biceps
    {
        "id": "pull-up-progression",
        "name": "Pull-Up Progression",
        "category": "Pull",
        "type": "variation",
        "restSeconds": 105,
        "restRange": [90, 120],
        "repWindow": "4-8",
        "tempo": "2s descent",
        "compound": True,
        "sets": 3,
        "structure": "straight",
        "stages": [
            "Negative Pull-Up", "Pull-Up", "Chin-Up",
            "Pull-Up + vest 2kg", "+ vest 4kg", "+ vest 5kg"
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
        "repWindow": "6-12",
        "tempo": "2s descent",
        "compound": True,
        "sets": 3,
        "structure": "straight"
    },
    {
        "id": "trx-face-pull",
        "name": "TRX Face Pull",
        "category": "Shoulders",
        "type": "variation",
        "restSeconds": 45,
        "repWindow": "12-20",
        "tempo": "2s descent",
        "compound": False,
        "sets": 2,
        "structure": "straight",
        "stages": ["Angle 1", "Angle 2", "Angle 3"]
    },
    {
        "id": "push-up-volume",
        "name": "Push-Up Volume (Day 5)",
        "category": "Chest",
        "type": "variation",
        "restSeconds": 75,
        "restRange": [60, 90],
        "repWindow": "10-15",
        "tempo": "2s descent",
        "compound": True,
        "sets": 2,
        "structure": "pair",
        "pairId": "d5-pushup-curl",
        "orderInPair": 1,
        "progressionLink": "push-up-progression"
    },
    {
        "id": "single-arm-curl",
        "name": "Single-Arm Curl",
        "category": "Arms",
        "type": "weighted",
        "startingWeight": 3,
        "minWeight": 3,
        "maxWeight": 18,
        "increment": 1,
        "loadType": "each",
        "restSeconds": 45,
        "repWindow": "10-15",
        "tempo": "2s descent",
        "compound": False,
        "sets": "2-3",
        "structure": "straight",
        "microcycle": "biceps-microcycle",
        "activeWeeks": [1, 2]
    },
    {
        "id": "single-arm-hammer-curl",
        "name": "Single-Arm Hammer Curl",
        "category": "Arms",
        "type": "weighted",
        "startingWeight": 3,
        "minWeight": 3,
        "maxWeight": 18,
        "increment": 1,
        "loadType": "each",
        "restSeconds": 45,
        "repWindow": "10-12",
        "tempo": "2s descent",
        "compound": False,
        "sets": "2-3",
        "structure": "straight",
        "microcycle": "biceps-microcycle",
        "activeWeeks": [1, 2, 3],
        "lightWeekConfig": { "sets": 2, "progressionAllowed": False }
    },
    {
        "id": "towel-hang",
        "name": "Towel Hang",
        "category": "Grip",
        "type": "timebased",
        "restSeconds": 45,
        "repWindow": "15-45s",
        "tempo": "static hold",
        "compound": False,
        "sets": 2,
        "structure": "pair",
        "pairId": "d5-grip-lsit",
        "orderInPair": 1,
        "stages": ["Dead Hang", "Towel Hang", "Towel Hang + vest 5kg"]
    },
    {
        "id": "l-sit-progression",
        "name": "L-Sit Progression",
        "category": "Core",
        "type": "timebased",
        "restSeconds": 45,
        "repWindow": "8-20s",
        "tempo": "static hold",
        "compound": False,
        "sets": 2,
        "structure": "pair",
        "pairId": "d5-grip-lsit",
        "orderInPair": 2,
        "stages": ["Tuck L-Sit", "One-Leg Extended L-Sit", "Full L-Sit"]
    },
    {
        "id": "one-leg-extended-l-sit",
        "name": "One-Leg Extended L-Sit",
        "category": "Core",
        "type": "timebased",
        "restSeconds": 45,
        "repWindow": "8-20s",
        "tempo": "static hold",
        "compound": False,
        "sets": 2,
        "structure": "pair",
        "pairId": "d5-grip-lsit",
        "orderInPair": 2,
        "unlocked": False,
        "unlockCriteria": {
            "exercise": "l-sit-progression",
            "targetStageIndex": 0,
            "targetTime": 15
        }
    },
    {
        "id": "full-l-sit",
        "name": "Full L-Sit",
        "category": "Core",
        "type": "timebased",
        "restSeconds": 45,
        "repWindow": "8-20s",
        "tempo": "static hold",
        "compound": False,
        "sets": 2,
        "structure": "pair",
        "pairId": "d5-grip-lsit",
        "orderInPair": 2,
        "unlocked": False,
        "unlockCriteria": {
            "exercise": "one-leg-extended-l-sit"
        }
    },

    # Warmup & Cardio Utilities
    { "id": "high-knees", "name": "High Knees", "category": "Warmup", "type": "timebased", "restSeconds": 0, "repWindow": "30s" },
    { "id": "bodyweight-squat", "name": "Bodyweight Squat", "category": "Warmup", "type": "variation", "restSeconds": 30, "repWindow": "8" },
    { "id": "arm-circles", "name": "Arm Circles", "category": "Warmup", "type": "variation", "restSeconds": 0, "repWindow": "10" },
    { "id": "wall-slides", "name": "Wall Slides", "category": "Warmup", "type": "variation", "restSeconds": 30, "repWindow": "8" },
    { "id": "scapular-push-up", "name": "Scapular Push-up", "category": "Warmup", "type": "variation", "restSeconds": 30, "repWindow": "10" },
    { "id": "scapular-pull-up", "name": "Scapular Pull-up", "category": "Warmup", "type": "variation", "restSeconds": 30, "repWindow": "6" },
    { "id": "dead-hang", "name": "Dead Hang", "category": "Warmup", "type": "timebased", "restSeconds": 30, "repWindow": "15s" },
    { "id": "seated-band-row", "name": "Seated Band Row", "category": "Warmup", "type": "variation", "restSeconds": 30, "repWindow": "12" },
    { "id": "brisk-walking", "name": "Brisk Walking", "category": "Cardio", "type": "timebased", "restSeconds": 0, "repWindow": "30-45m" },
    { "id": "relaxed-walking", "name": "Relaxed Walking", "category": "Cardio", "type": "timebased", "restSeconds": 0, "repWindow": "25-30m" },
    { "id": "vo2-max-norwegian-4x4", "name": "VO2 Max Norwegian 4x4", "category": "Cardio", "type": "interval", "restSeconds": 0, "repWindow": "16m" },
    { "id": "micro-mobility-protocol", "name": "Micro Mobility Protocol", "category": "Warmup", "type": "timebased", "restSeconds": 0, "repWindow": "5m" },
    { "id": "deep-mobility-protocol", "name": "Deep Mobility Protocol", "category": "Warmup", "type": "timebased", "restSeconds": 0, "repWindow": "10m" },
    {
        "id": "band-neck-flexion",
        "name": "Band Neck Flexion & Extension",
        "category": "Warmup",
        "type": "variation",
        "restSeconds": 45,
        "repWindow": "15-20",
        "tempo": "3-1-3 slow",
        "compound": False,
        "sets": 2,
        "structure": "straight",
        "rule": "סט 1 (כפיפה): פנים הרחק מהעגינה (גומייה על מצח) | סט 2 (פשיטה): פנים לכיוון העגינה (גומייה על עורף). עגינה אופקית בגובה הראש!",
        "stages": ["Band 30kg (Close Anchor)", "Band 30kg (1 Step Back)", "Band 40kg", "Band 50kg"]
    },
    { "id": "glute-bridge", "name": "DB Glute Bridge", "category": "Warmup", "type": "weighted", "startingWeight": 9, "restSeconds": 60, "repWindow": "10-15" },

    # Arm Blocks (Myo-reps)
    {
        "id": "arm-block-lateral-raise",
        "name": "Arm Block - Single-Arm Lateral Raise",
        "category": "Shoulders",
        "type": "myo-reps",
        "startingWeight": 3,
        "minWeight": 3,
        "maxWeight": 12,
        "increment": 1,
        "loadType": "each",
        "restSeconds": 15,
        "repWindow": "Myo-Reps Cluster",
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
        "repWindow": "Myo-Reps Cluster",
        "structure": "myo-reps",
        "myoConfig": {
            "activationReps": 12,
            "miniSets": 3,
            "miniReps": 5,
            "stopRule": "two_consecutive_tempo_losses"
        }
    },
    {
        "id": "arm-block-biceps-curl",
        "name": "Arm Block - Single-Arm Curl",
        "category": "Arms",
        "type": "myo-reps",
        "startingWeight": 3,
        "minWeight": 3,
        "maxWeight": 18,
        "increment": 1,
        "loadType": "each",
        "restSeconds": 15,
        "repWindow": "Myo-Reps Cluster",
        "structure": "myo-reps",
        "myoConfig": {
            "activationReps": 12,
            "miniSets": 3,
            "miniReps": 5,
            "stopRule": "two_consecutive_tempo_losses"
        }
    }
]


def make_ex_obj(slot, ex_id, name, sets_str, rep_window=None, weight=None, tempo=None, rest=90, is_warmup=False,
                structure="straight", pair_id=None, circuit_id=None, block_id=None, block_order=None,
                circuit_order=None, toggle_group=None, toggle_active_on=None, microcycle=None, active_weeks=None, arm_block=False, order_in_pair=None):
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
        "orderInPair": order_in_pair,
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
            make_ex_obj("A1", "band-neck-flexion", "Band Neck Flexion & Extension", "2×15-20", rep_window="15-20", weight="Band 30 kg", tempo="3-1-3 slow", rest=45, structure="straight"),
            make_ex_obj("A2", "relaxed-walking", "Relaxed Walking", "25 mins", weight="Incline 0%", tempo="4.5 km/h", rest=0),
            make_ex_obj("A3", "deep-mobility-protocol", "Deep Mobility Protocol", "10 mins", weight="Bodyweight", tempo="slow", rest=0)
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

    # ---------------- DOW 1: LEGS + CORE ----------------
    if dow == 1:
        day_title = "Legs + Core (Deload)" if is_deload else "Legs + Core"
        rpe = "5-6" if is_deload else "7-8"
        exs = get_leg_warmup()

        # A1: Hamstring Chain
        if week < 18:
            exs.append(make_ex_obj("A1", "goblet-rdl", "Goblet Romanian Deadlift", "2×8" if is_deload else "3×6-12", rep_window="6-12", weight="6 kg total", tempo="3s descent", rest=105, structure="straight"))
        else:
            exs.append(make_ex_obj("A1", "single-leg-rdl", "Single-Leg RDL", "2×8/leg" if is_deload else "2×8-10/leg", rep_window="8-10", weight="6 kg total", tempo="3s descent", rest=75, structure="straight"))

        # A2: Lunge/Pistol Tree
        if week < 42:
            exs.append(make_ex_obj("A2", "goblet-reverse-lunge", "Goblet Reverse Lunge", "2×8/leg" if is_deload else "2×10-12/leg", rep_window="10-12", weight="6 kg total", tempo="2s descent", rest=75, structure="straight"))
        else:
            exs.append(make_ex_obj("A2", "pistol-squat-progression", "Pistol Squat", "2×8/leg" if is_deload else "2×3-8/leg", rep_window="3-8", weight="6 kg total", tempo="slow descent", rest=105, structure="straight"))

        # A3: Squat Tree
        if week < 5:
            exs.append(make_ex_obj("A3", "bodyweight-squat", "Bodyweight Squat", "2×8" if is_deload else "3×12", rep_window="8-15", weight="Bodyweight", tempo="2s descent", rest=60, structure="straight"))
        else:
            exs.append(make_ex_obj("A3", "goblet-bulgarian-split-squat", "Goblet Bulgarian Split Squat", "2×8/leg" if is_deload else "3×6-12/leg", rep_window="6-12", weight="6 kg total", tempo="2s descent", rest=82, structure="straight"))

        # A4: Glute Progression (DB Glute Bridge — all weeks)
        exs.append(make_ex_obj("A4", "glute-bridge", "DB Glute Bridge", "2×10" if is_deload else "3×10-15", rep_window="10-15", weight="9 kg total", tempo="1s pause", rest=75 if week >= 5 else 60, structure="straight"))

        # A5: Suitcase Carry
        exs.append(make_ex_obj("A5", "suitcase-carry", "Suitcase Carry", "2×25m/side" if is_deload else "3×25-40m/side", rep_window="25-40m", weight="12 kg", tempo="walk", rest=60, structure="straight"))

        # A6, A7: Calf Block (Standing + Seated Calf Raise)
        calf_standing_sets = "2×15/leg" if is_deload else "3×12-20/leg"
        calf_seated_sets = "2×15/leg" if is_deload else "2×15-25/leg"
        exs.append(make_ex_obj("A6", "standing-single-leg-calf-raise", "Standing Single-Leg Calf Raise", calf_standing_sets, rep_window="12-20", weight="6 kg in hand", tempo="2s descent", rest=45, structure="straight" if is_deload else "block", block_id="d1-calf-block", block_order=1))
        exs.append(make_ex_obj("A7", "seated-single-leg-calf-raise", "Seated Single-Leg Calf Raise", calf_seated_sets, rep_window="15-25", weight="6 kg on knee", tempo="2s descent", rest=45, structure="straight" if is_deload else "block", block_id="d1-calf-block", block_order=2))

        # Core Circuit
        if week >= 10:
            exs.append(make_ex_obj("A8", "pallof-press-progression", "Pallof Press Progression", "2×10-12/side", rep_window="10-12", weight="Band 30 kg", tempo="1s pause", rest=30, structure="straight" if is_deload else "circuit", circuit_id="d1-core-circuit", circuit_order=1))
        exs.append(make_ex_obj("A9", "dead-bug", "Dead Bug", "2×8/side" if is_deload else "3×12-20/side", rep_window="12-20", weight="Bodyweight", tempo="slow", rest=30, structure="straight" if is_deload else "circuit", circuit_id="d1-core-circuit", circuit_order=2))
        if week >= 5:
            exs.append(make_ex_obj("A10", "hollow-body-hold", "Hollow Body Hold", "2×15 secs" if is_deload else "2×20-30 secs", rep_window="20-30s", weight="Bodyweight", tempo="static", rest=30, structure="straight" if is_deload else "circuit", circuit_id="d1-core-circuit", circuit_order=3))

        exs.append(make_ex_obj("A11", "micro-mobility-protocol", "Micro Mobility Protocol", "1×5 mins", weight="Bodyweight", tempo="slow", rest=0))
        return day_title, rpe, exs

    # ---------------- DOW 3: PUSH + SHOULDERS ----------------
    if dow == 3:
        day_title = "Push + Skill (Deload)" if is_deload else "Push + Skill"
        rpe = "5-6" if is_deload else "7-8"
        exs = get_push_warmup()

        # A1: Pike / Overhead Skill Tree
        if week < 10:
            exs.append(make_ex_obj("A1", "pike-progression", "Pike Progression", "2×15 secs" if is_deload else "2×15-30 secs", rep_window="15-30s or 6-12", weight="Bodyweight", tempo="2s descent", rest=75, structure="straight"))
        elif week < 18:
            exs.append(make_ex_obj("A1", "wall-walk-partial", "Wall Walk (Partial)", "2×3" if is_deload else "2×3-6", rep_window="3-6", weight="Bodyweight", tempo="controlled", rest=75, structure="straight"))
        elif week < 26:
            exs.append(make_ex_obj("A1", "wall-walk-full", "Wall Walk (Full)", "2×3" if is_deload else "2×3-6", rep_window="3-6", weight="Bodyweight", tempo="controlled", rest=90, structure="straight"))
        elif week < 41:
            exs.append(make_ex_obj("A1", "wall-handstand", "Wall Handstand", "2×15 secs" if is_deload else "2×20-45 secs", rep_window="20-45s", weight="Bodyweight", tempo="static", rest=90, structure="straight"))
        else:
            exs.append(make_ex_obj("A1", "elevated-pike-push-up", "Elevated Pike Push-Up", "2×5" if is_deload else "2×6-10", rep_window="6-10", weight="Bodyweight", tempo="2s descent", rest=90, structure="straight"))

        # A2: Single-Arm Floor Press
        exs.append(make_ex_obj("A2", "single-arm-floor-press", "Single-Arm Floor Press", "2×8" if is_deload else "3×6-12", rep_window="6-12", weight="6 kg each", tempo="2s descent", rest=105, structure="straight"))

        # A3: Push-Up Tree
        if week < 10:
            exs.append(make_ex_obj("A3", "push-up-progression", "Push-up Bars Progression", "2×6" if is_deload else "3×8-15", rep_window="8-15", weight="Bodyweight", tempo="2s descent", rest=75, structure="straight"))
        elif week < 18:
            exs.append(make_ex_obj("A3", "deficit-push-up", "Deficit Push-Up", "2×6" if is_deload else "3×8-15", rep_window="8-15", weight="Bodyweight", tempo="2s descent", rest=75, structure="straight"))
        elif week < 62:
            exs.append(make_ex_obj("A3", "feet-elevated-push-up", "Feet-Elevated Push-Up", "2×6" if is_deload else "3×8-12", rep_window="8-12", weight="Bodyweight", tempo="2s descent", rest=75, structure="straight"))
        else:
            exs.append(make_ex_obj("A3", "weighted-deficit-push-up", "Weighted Deficit Push-Up", "2×6" if is_deload else "3×6-12", rep_window="6-12", weight="5 kg vest", tempo="2s descent", rest=90, structure="straight"))

        # A4: Single-Arm Seated OHP
        exs.append(make_ex_obj("A4", "single-arm-seated-ohp", "Single-Arm Seated OHP", "2×8" if is_deload else "3×6-12", rep_window="6-12", weight="6 kg each", tempo="2s descent", rest=82, structure="straight"))

        # A5: DB Overhead Triceps Extension
        exs.append(make_ex_obj("A5", "db-overhead-triceps-extension", "DB Overhead Triceps Extension", "2×10" if is_deload else "4×10-15", rep_window="10-15", weight="6 kg total", tempo="2s descent", rest=45, structure="straight"))

        # A6: Diamond Push-Up
        exs.append(make_ex_obj("A6", "diamond-push-up", "Diamond Push-Up", "2×10" if is_deload else "2×10-15", rep_window="10-15", weight="Bodyweight", tempo="2s descent", rest=45, structure="straight"))

        # Pair: TRX Row ↔ Single-Arm Lateral Raise
        exs.append(make_ex_obj("A7", "trx-row", "TRX Row", "2×10" if is_deload else "2×10-15", rep_window="10-15", weight="Bodyweight", tempo="2s descent", rest=75, structure="straight" if is_deload else "pair", pair_id="d3-row-lateral", order_in_pair=1))
        exs.append(make_ex_obj("A8", "single-arm-lateral-raise", "Single-Arm Lateral Raise", "2×12" if is_deload else "2×12-20", rep_window="12-20", weight="3 kg each", tempo="2s descent", rest=75, structure="straight" if is_deload else "pair", pair_id="d3-row-lateral", order_in_pair=2))

        # Rear Delt Toggle
        if is_odd:
            exs.append(make_ex_obj("A9", "trx-ytw", "TRX Y-T-W", "2×8" if is_deload else "2×8-12", rep_window="8-12", weight="Bodyweight", tempo="1s pause", rest=45, structure="straight", toggle_group="rear-delt", toggle_active_on="odd"))
        else:
            exs.append(make_ex_obj("A9", "band-pull-apart", "Band Pull-Apart", "2×15" if is_deload else "3×15-20", rep_window="15-20", weight="Band 30kg", tempo="1s squeeze", rest=45, structure="straight", toggle_group="rear-delt", toggle_active_on="even"))

        if week >= 10 and not is_deload:
            exs.append(make_ex_obj("A10", "arm-block-lateral-raise", "Arm Block - Single-Arm Lateral Raise", "Myo-Reps Cluster", rep_window="Myo-Reps Cluster", weight="3 kg each", tempo="2s descent", rest=15, structure="myo-reps"))
            exs.append(make_ex_obj("A11", "arm-block-triceps-ext", "Arm Block - DB Overhead Triceps Ext", "Myo-Reps Cluster", rep_window="Myo-Reps Cluster", weight="6 kg total", tempo="2s descent", rest=15, structure="myo-reps"))

        exs.append(make_ex_obj("A12", "micro-mobility-protocol", "Micro Mobility Protocol", "1×5 mins", weight="Bodyweight", tempo="slow", rest=0))
        return day_title, rpe, exs

    # ---------------- DOW 5: PULL + GRIP + BICEPS ----------------
    if dow == 5:
        day_title = "Pull + Grip (Deload)" if is_deload else "Pull + Grip"
        rpe = "5-6" if is_deload else "7-8"
        exs = get_pull_warmup()

        # A1: Pull-Up Progression Tree
        if week < 10:
            exs.append(make_ex_obj("A1", "pull-up-progression", "Pull-Up Progression", "2×2" if is_deload else "3×4-8", rep_window="4-8", weight="Bodyweight", tempo="2s descent", rest=105, structure="straight"))
        elif week < 62:
            exs.append(make_ex_obj("A1", "pull-up-overhand", "Pull-Up (Overhand)", "2×2" if is_deload else "3×4-8", rep_window="4-8", weight="Bodyweight", tempo="2s descent", rest=105, structure="straight"))
        else:
            exs.append(make_ex_obj("A1", "weighted-pull-up", "Weighted Pull-Up", "2×2" if is_deload else "3×4-8", rep_window="4-8", weight="5 kg vest", tempo="2s descent", rest=120, structure="straight"))

        # A2: One-Arm DB Row
        exs.append(make_ex_obj("A2", "one-arm-db-row", "One-Arm DB Row", "2×8/side" if is_deload else "3×6-12/side", rep_window="6-12", weight="6 kg", tempo="2s descent", rest=82, structure="straight"))

        # A3: TRX Face Pull
        exs.append(make_ex_obj("A3", "trx-face-pull", "TRX Face Pull", "2×10" if is_deload else "2×12-20", rep_window="12-20", weight="Bodyweight", tempo="2s descent", rest=45, structure="straight"))

        biceps_cycle_week = ((week - 1) % 3) + 1
        is_biceps_light = (biceps_cycle_week == 3)
        
        # A4 & A5: Pair: Push-Up Volume ↔ Biceps Curl
        if not is_biceps_light and not is_deload:
            exs.append(make_ex_obj("A4", "push-up-volume", "Push-Up Volume (Day 5)", "2×10-15", rep_window="10-15", weight="Bodyweight", tempo="2s descent", rest=75, structure="pair", pair_id="d5-pushup-curl", order_in_pair=1))
            exs.append(make_ex_obj("A5", "single-arm-curl", "Single-Arm Curl", "2×10-15", rep_window="10-15", weight="3 kg each", tempo="2s descent", rest=45, structure="pair", pair_id="d5-pushup-curl", order_in_pair=2, microcycle="biceps-microcycle", active_weeks=[1, 2]))
        else:
            exs.append(make_ex_obj("A4", "push-up-volume", "Push-Up Volume (Day 5)", "2×10-15", rep_window="10-15", weight="Bodyweight", tempo="2s descent", rest=75, structure="straight"))

        # A6: Secondary Biceps
        if week >= 5:
            exs.append(make_ex_obj("A6", "single-arm-hammer-curl", "Single-Arm Hammer Curl", "1×10" if is_deload else "2×10-12", rep_window="10-12", weight="3 kg each", tempo="2s descent", rest=45, structure="straight", microcycle="biceps-microcycle", active_weeks=[1, 2, 3]))

        # Pair: Towel Hang ↔ L-Sit Progression
        exs.append(make_ex_obj("A7", "towel-hang", "Towel Hang", "2×15-45 secs", rep_window="15-45s", weight="Bodyweight", tempo="static", rest=45, structure="straight" if is_deload else "pair", pair_id="d5-grip-lsit", order_in_pair=1))
        
        if week < 18:
            exs.append(make_ex_obj("A8", "l-sit-progression", "L-Sit Progression", "2×8-20 secs", rep_window="8-20s", weight="Bodyweight", tempo="static", rest=45, structure="straight" if is_deload else "pair", pair_id="d5-grip-lsit", order_in_pair=2))
        elif week < 34:
            exs.append(make_ex_obj("A8", "one-leg-extended-l-sit", "One-Leg Extended L-Sit", "2×8-20 secs", rep_window="8-20s", weight="Bodyweight", tempo="static", rest=45, structure="straight" if is_deload else "pair", pair_id="d5-grip-lsit", order_in_pair=2))
        else:
            exs.append(make_ex_obj("A8", "full-l-sit", "Full L-Sit", "2×8-20 secs", rep_window="8-20s", weight="Bodyweight", tempo="static", rest=45, structure="straight" if is_deload else "pair", pair_id="d5-grip-lsit", order_in_pair=2))

        if week >= 10 and not is_deload:
            exs.append(make_ex_obj("A9", "arm-block-biceps-curl", "Arm Block - Single-Arm Curl", "Myo-Reps Cluster", rep_window="Myo-Reps Cluster", weight="3 kg each", tempo="2s descent", rest=15, structure="myo-reps"))

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

    # Root leanStructures (flat members format)
    root_lean_structures = {
        "pairs": [
            {
                "id": "d3-row-lateral",
                "dayIndex": 3,
                "name": "TRX Row ↔ Single-Arm Lateral Raise",
                "type": "non-competing",
                "restAfterPairSeconds": 75,
                "members": ["trx-row", "single-arm-lateral-raise"]
            },
            {
                "id": "d5-pushup-curl",
                "dayIndex": 5,
                "name": "Push-Up Volume ↔ Single-Arm Curl",
                "type": "antagonistic",
                "restAfterPairSeconds": 75,
                "members": ["push-up-volume", "single-arm-curl"]
            },
            {
                "id": "d5-grip-lsit",
                "dayIndex": 5,
                "name": "Towel Hang ↔ L-Sit Progression",
                "type": "non-competing",
                "restAfterPairSeconds": 45,
                "members": ["towel-hang", "l-sit-progression"]
            }
        ],
        "circuits": [
            {
                "id": "d1-core-circuit",
                "dayIndex": 1,
                "name": "Core Citadel Circuit",
                "restAfterCircuitSeconds": 30,
                "exercises": ["pallof-press-progression", "dead-bug", "hollow-body-hold"]
            }
        ],
        "blocks": [
            {
                "id": "d1-calf-block",
                "dayIndex": 1,
                "name": "Calf Hypertrophy Block",
                "restAfterBlockSeconds": 45,
                "exercises": ["standing-single-leg-calf-raise", "seated-single-leg-calf-raise"]
            }
        ],
        "toggles": [
            {
                "id": "T2_DAY3",
                "toggleGroup": "rear-delt",
                "dayIndex": 3,
                "name": "Day 3 Rear Delt Toggle",
                "retainBothStates": True,
                "dissolveOnDeload": False,
                "members": [
                    { "exerciseId": "trx-ytw", "activeOn": "odd" },
                    { "exerciseId": "band-pull-apart", "activeOn": "even" }
                ]
            }
        ]
    }

    # progressionSettings.leanMode leanStructures (detailed members format)
    lean_mode_structures = {
        "pairs": [
            {
                "pairId": "d3-row-lateral",
                "dayIndex": 3,
                "type": "non-competing",
                "restAfterPair": 75,
                "dissolveOnDeload": True,
                "dissolveIfMemberInactive": True,
                "members": [{"exerciseId": "trx-row", "orderInPair": 1}, {"exerciseId": "single-arm-lateral-raise", "orderInPair": 2}]
            },
            {
                "pairId": "d5-pushup-curl",
                "dayIndex": 5,
                "type": "antagonist",
                "restAfterPair": 75,
                "dissolveOnDeload": True,
                "dissolveIfMemberInactive": True,
                "members": [{"exerciseId": "push-up-volume", "orderInPair": 1}, {"exerciseId": "single-arm-curl", "orderInPair": 2}]
            },
            {
                "pairId": "d5-grip-lsit",
                "dayIndex": 5,
                "type": "non-competing",
                "restAfterPair": 45,
                "dissolveOnDeload": True,
                "dissolveIfMemberInactive": True,
                "members": [{"exerciseId": "towel-hang", "orderInPair": 1}, {"exerciseId": "l-sit-progression", "orderInPair": 2}]
            }
        ],
        "circuits": [
            {
                "circuitId": "d1-core-circuit",
                "dayIndex": 1,
                "restBetweenRounds": 30,
                "placement": "end_of_day",
                "dissolveOnDeload": True,
                "members": ["pallof-press-progression", "dead-bug", "hollow-body-hold"]
            }
        ],
        "blocks": [
            {
                "blockId": "d1-calf-block",
                "dayIndex": 1,
                "restAfterBlock": 45,
                "dissolveOnDeload": True,
                "members": ["standing-single-leg-calf-raise", "seated-single-leg-calf-raise"]
            }
        ],
        "toggles": [
            {
                "toggleGroup": "rear-delt",
                "dayIndex": 3,
                "retainBothStates": True,
                "dissolveOnDeload": False,
                "members": [
                    { "exerciseId": "trx-ytw", "activeOn": "odd" },
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
                "3": { "single-arm-lateral-raise": "lateral-shoulder", "db-overhead-triceps-extension": "triceps" },
                "5": { "single-arm-curl": "biceps", "single-arm-hammer-curl": "biceps" }
            }
        },
        "bicepsMicrocycle": {
            "cycleLength": 3,
            "heavyWeeks": [1, 2],
            "lightWeeks": [3],
            "lightWeekExercises": ["single-arm-hammer-curl"],
            "lightWeekSets": 2,
            "lightWeekProgressionAllowed": False
        },
        "softenedProgression": {
            "enabled": True,
            "requireCurrentSessionMaxOrMaxMinus1": True,
            "requirePreviousSessionAllMax": True,
            "requireNoMechanicalStop": True
        },
        "frequencyAdditions": {
            "day3_backVolume": {"exerciseId": "trx-row", "sets": 2, "purpose": "back_frequency_2"},
            "day5_chestVolume": {"exerciseId": "push-up-volume", "sets": 2, "purpose": "chest_frequency_2"}
        },
        "leanMode": {
            "enabled": True,
            "protectCompounds": True,
            "protectedExercises": [
                "goblet-rdl", "single-leg-rdl", "goblet-bulgarian-split-squat", "goblet-reverse-lunge", "pistol-squat-progression",
                "glute-bridge", "suitcase-carry", "pike-progression", "single-arm-floor-press", "push-up-progression",
                "single-arm-seated-ohp", "db-overhead-triceps-extension", "diamond-push-up", "pull-up-progression",
                "one-arm-db-row", "single-arm-curl", "single-arm-hammer-curl"
            ],
            "pairs": lean_mode_structures["pairs"],
            "circuits": lean_mode_structures["circuits"],
            "blocks": lean_mode_structures["blocks"],
            "toggles": lean_mode_structures["toggles"]
        }
    }

    return {
        "version": "15.6 Lean",
        "progressionSettings": progression_settings,
        "leanStructures": root_lean_structures,
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
