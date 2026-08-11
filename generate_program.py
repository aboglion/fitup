#!/usr/bin/env python3
"""Generate FitUp Pro Ultimate v4.0 — 78-week training program."""
import json, os, shutil
from datetime import datetime, timedelta

START_DATE = datetime(2026, 7, 6)
DAYS_ENG = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"]

def ex(slot, name, sets, weight=None, tempo=None, rest=90, isWarmup=False):
    return {
        "slot": slot,
        "name": name,
        "sets": sets,
        "weight": weight,
        "tempo": tempo,
        "rest": rest,
        "isWarmup": isWarmup
    }

def get_leg_warmup():
    return [
        ex("W1", "High Knees", "30 secs", isWarmup=True, rest=0),
        ex("W2", "Bodyweight Squat", "2×8 (Slow)", isWarmup=True, rest=30),
        ex("W3", "Dead Bug", "1×6 each side", isWarmup=True, rest=30),
        ex("W4", "Glute Bridge", "1×12", isWarmup=True, rest=30),
    ]

def get_push_warmup(is_year2=False):
    warmups = [
        ex("W1", "Arm Circles", "10 forward, 10 backward", isWarmup=True, rest=0),
        ex("W2", "Wall Slides", "1×8 (Slow)", isWarmup=True, rest=30),
        ex("W3", "Scapular Push-up", "2×10", isWarmup=True, rest=30),
        ex("W4", "Band Pull-Apart", "1×15", isWarmup=True, rest=30),
    ]
    if is_year2:
        warmups.append(ex("W5", "Wrist Rocks", "1×10", isWarmup=True, rest=30))
    return warmups

def get_pull_warmup():
    return [
        ex("W1", "Arm Circles", "10 forward, 10 backward", isWarmup=True, rest=0),
        ex("W2", "Wall Slides", "1×8", isWarmup=True, rest=30),
        ex("W3", "Scapular Pull-up", "2×6", isWarmup=True, rest=30),
        ex("W4", "Dead Hang", "1×15 secs", isWarmup=True, rest=30),
        ex("W5", "Seated Band Row", "1×12", isWarmup=True, rest=30),
    ]

DELOAD_WEEKS = {9, 17, 25, 33, 41, 49, 57, 61, 65, 69, 73}

def get_vo2_incline(week):
    if week in DELOAD_WEEKS or week >= 69:
        return None
    if 1 <= week <= 4: return "3%"
    if 5 <= week <= 8: return "4%"
    if 10 <= week <= 16: return "5%"
    if 18 <= week <= 68: return "6%"
    return "4%"

def get_day_workout(dow, week):
    # dow: 1=Monday(Legs), 2=Tuesday(Zone2), 3=Wednesday(Push), 4=Thursday(Active Recovery), 5=Friday(Pull), 6=Saturday(VO2 Max), 0=Sunday(Rest)
    is_deload = week in DELOAD_WEEKS
    is_year2 = week >= 53

    # MAINTENANCE PHASE (Weeks 74–78)
    if week >= 74:
        if dow == 1: # Strength A
            raw = [
                ("DB Single-Leg RDL", "3×8/leg", "24 kg", "3 שנ' ירידה", 120),
                ("DB BSS (Goblet)", "3×8/leg", "24 kg", "2 שנ' ירידה", 90),
                ("Single-Arm Floor Press", "3×8/side", "24 kg", "2 שנ' ירידה", 120),
                ("Seated DB OHP", "3×8", "12 kg each", "2 שנ' ירידה", 90),
                ("DB Lateral Raise", "2×15", "9 kg each", "2 שנ' ירידה", 60),
                ("Dead Bug", "2×10/side", "Bodyweight", "איטי", 60),
                ("Arm Block - DB Lateral Raise", "1×15", "9 kg each", "2 שנ' ירידה", 60),
                ("Arm Block - DB OH Triceps Ext", "1×12", "24 kg total", "2 שנ' ירידה", 60),
            ]
            return "Legs + Push (Strength A)", "7-8", build_exercises(raw, get_leg_warmup())
        elif dow == 2:
            return "Zone 2 Cardio", "—", [ex("A1", "Brisk Walking", "45 mins", "Incline 4%", "5.5 קמ'ש", 0)]
        elif dow == 3:
            return "Active Recovery", "—", [ex("A1", "Relaxed Walking", "30 mins", "Incline 0%", "4.5 קמ'ש", 0)]
        elif dow == 4: # Strength B
            raw = [
                ("Pull-Up (Overhand)", "3×6", "Bodyweight", "2 שנ' ירידה", 120),
                ("Chin-Up", "2×5", "Bodyweight", "2 שנ' ירידה", 120),
                ("One-Arm DB Row", "3×10/side", "24 kg", "2 שנ' ירידה", 90),
                ("Wall Handstand", "3×30 secs", "Bodyweight", "סטטי", 90),
                ("Single-Arm Curl", "2×12/side", "18 kg", "2 שנ' ירידה", 60),
                ("Towel Hang", "2×45 secs", "Bodyweight", "סטטי", 60),
                ("Arm Block - DB Curl", "1×12", "18 kg each", "2 שנ' ירידה", 60),
            ]
            return "Pull + Skill (Strength B)", "7-8", build_exercises(raw, get_pull_warmup())
        elif dow == 5:
            return "Zone 2 Cardio", "—", [ex("A1", "Brisk Walking", "45 mins", "Incline 4%", "5.5 קמ'ש", 0)]
        elif dow == 6:
            return "Active Recovery", "—", [ex("A1", "Relaxed Walking", "30 mins", "Incline 0%", "4.5 קמ'ש", 0)]
        else:
            return "Rest", "—", []

    # CARDIO / RECOVERY DAYS (DOW 2, 4, 6, 0)
    if dow == 2:
        if is_deload:
            return "Zone 2 Cardio", "—", [ex("A1", "Brisk Walking", "30 mins", "Incline 2%", "5.0 קמ'ש", 0)]
        return "Zone 2 Cardio", "—", [ex("A1", "Brisk Walking", "45 mins", "Incline 4%", "5.5 קמ'ש", 0)]

    if dow == 4:
        return "Active Recovery", "—", [
            ex("A1", "Relaxed Walking", "25 mins", "Incline 0%", "4.5 קמ'ש", 0),
            ex("A2", "Deep Mobility Protocol", "10 mins", "Bodyweight", "איטי", 0)
        ]

    if dow == 6:
        if is_deload or week >= 69:
            return "Zone 2 Cardio", "—", [ex("A1", "Brisk Walking", "30 mins", "Incline 2%", "5.0 קמ'ש", 0)]
        incline = get_vo2_incline(week)
        return "VO2 Max", "9-10", [
            ex("A1", "VO2 Max Norwegian 4x4", "4x4 mins (3 min rest)", f"Incline {incline}", "6.5 קמ'ש מאמץ / 4.5 קמ'ש מנוחה", 0)
        ]

    if dow == 0:
        return "Rest", "—", []

    # STRENGTH DAYS (DOW 1, 3, 5)

    # DELOAD WEEKS (9, 17, 25, 33, 41, 49, 57, 61, 65, 69, 73)
    if is_deload:
        if dow == 1: # Day 1 Deload
            if week == 9: raw = [("DB RDL", "2×8", "3 kg each", "3 שנ' ירידה", 120), ("DB BSS", "2×8/leg", "Bodyweight", "2 שנ' ירידה", 90), ("DB Hip Thrust", "2×10", "6 kg", "2 שנ' עצירה", 90), ("Single-Leg Calf Raise", "2×15/leg", "6 kg", "2 שנ' ירידה", 60), ("Suitcase Carry", "2×25m/side", "9 kg", "הליכה", 90), ("Dead Bug", "2×8/side", "Bodyweight", "איטי", 60)]
            elif week == 17: raw = [("DB RDL", "2×8", "6 kg each", "3 שנ' ירידה", 120), ("DB BSS", "2×8/leg", "3 kg each", "2 שנ' ירידה", 90), ("DB Hip Thrust", "2×10", "6 kg", "2 שנ' עצירה", 90), ("Single-Leg Calf Raise", "2×15/leg", "6 kg", "2 שנ' ירידה", 60), ("Suitcase Carry", "2×25m/side", "9 kg", "הליכה", 90), ("Dead Bug", "2×8/side", "Bodyweight", "איטי", 60)]
            elif week == 25: raw = [("DB Single-Leg RDL", "2×8/leg", "6 kg", "3 שנ' ירידה", 120), ("DB BSS", "2×8/leg", "6 kg each", "2 שנ' ירידה", 90), ("DB Hip Thrust", "2×10", "9 kg", "2 שנ' עצירה", 90), ("Single-Leg Calf Raise", "2×15/leg", "6 kg", "2 שנ' ירידה", 60), ("Suitcase Carry", "2×25m/side", "9 kg", "הליכה", 90), ("Dead Bug", "2×8/side", "Bodyweight", "איטי", 60)]
            elif week == 33: raw = [("DB Single-Leg RDL", "2×8/leg", "9 kg", "3 שנ' ירידה", 120), ("DB BSS", "2×8/leg", "6 kg each", "2 שנ' ירידה", 90), ("DB Hip Thrust", "2×10", "9 kg", "2 שנ' עצירה", 90), ("Single-Leg Calf Raise", "2×15/leg", "6 kg", "2 שנ' ירידה", 60), ("Suitcase Carry", "2×25m/side", "12 kg", "הליכה", 90), ("Dead Bug", "2×8/side", "Bodyweight", "איטי", 60)]
            elif week == 41: raw = [("DB Single-Leg RDL", "2×8/leg", "6 kg", "3 שנ' ירידה", 120), ("DB BSS (Goblet)", "2×8/leg", "9 kg", "1 שנ' עצירה", 90), ("DB Hip Thrust", "2×10", "12 kg", "2 שנ' עצירה", 90), ("Single-Leg Calf Raise", "2×15/leg", "9 kg", "2 שנ' ירידה", 60), ("Dead Bug", "2×8/side", "Bodyweight", "איטי", 60)]
            elif week in (49, 57, 61, 65, 69): raw = [("DB Single-Leg RDL", "2×8/leg", "12 kg", "3 שנ' ירידה", 120), ("DB BSS (Goblet)", "2×8/leg", "12 kg", "1 שנ' עצירה", 90), ("DB Hip Thrust", "2×10", "12 kg", "2 שנ' עצירה", 90), ("Single-Leg Calf Raise", "2×15/leg", "12 kg", "2 שנ' ירידה", 60), ("Suitcase Carry", "2×25m/side", "12 kg", "הליכה", 90), ("Dead Bug", "2×8/side", "Bodyweight", "איטי", 60)]
            else: raw = [("DB Single-Leg RDL", "2×8/leg", "15 kg", "3 שנ' ירידה", 120), ("DB BSS (Goblet)", "2×8/leg", "15 kg", "1 שנ' עצירה", 90), ("DB Hip Thrust", "2×10", "15 kg", "2 שנ' עצירה", 90), ("Single-Leg Calf Raise", "2×15/leg", "15 kg", "2 שנ' ירידה", 60), ("Dead Bug", "2×8/side", "Bodyweight", "איטי", 60)]
            return "Legs + Core (Deload)", "5-6", build_exercises(raw, get_leg_warmup())

        elif dow == 3: # Day 3 Deload
            if week == 9: raw = [("Pike Hold", "2×15 secs", "Bodyweight", "סטטי", 90), ("DB Floor Press", "2×8", "3 kg each", "2 שנ' ירידה", 120), ("Push-up", "2×6", "Bodyweight", "2 שנ' ירידה", 90), ("Seated DB OHP", "2×8", "3 kg each", "2 שנ' ירידה", 90), ("DB Lateral Raise", "2×12", "3 kg each", "2 שנ' ירידה", 60), ("DB OH Triceps Ext", "2×10", "3 kg total", "2 שנ' ירידה", 60)]
            elif week == 17: raw = [("Wall Walk (Partial)", "2×2", "Bodyweight", "איטי", 90), ("DB Floor Press", "2×6", "6 kg each", "2 שנ' ירידה", 120), ("Push-up", "2×6", "Bodyweight", "2 שנ' ירידה", 90), ("Seated DB OHP", "2×8", "3 kg each", "2 שנ' ירידה", 90), ("DB Lateral Raise", "2×12", "3 kg each", "2 שנ' ירידה", 60), ("DB OH Triceps Ext", "2×10", "6 kg total", "2 שנ' ירידה", 60), ("Arm Block - DB Lateral Raise", "1×12", "3 kg each", "2 שנ' ירידה", 60), ("Arm Block - DB OH Triceps Ext", "1×10", "6 kg total", "2 שנ' ירידה", 60)]
            elif week == 25: raw = [("Single-Arm Floor Press", "2×8/side", "9 kg", "2 שנ' ירידה", 120), ("Feet-Elevated Push-Up", "2×6", "Bodyweight", "2 שנ' ירידה", 90), ("Seated DB OHP", "2×8", "3 kg each", "2 שנ' ירידה", 90), ("DB Lateral Raise", "2×12", "3 kg each", "2 שנ' ירידה", 60), ("DB OH Triceps Ext", "2×10", "6 kg total", "2 שנ' ירידה", 60), ("Arm Block - DB Lateral Raise", "1×12", "3 kg each", "2 שנ' ירידה", 60), ("Arm Block - DB OH Triceps Ext", "1×10", "6 kg total", "2 שנ' ירידה", 60)]
            elif week == 33: raw = [("Single-Arm Floor Press", "2×8/side", "9 kg", "2 שנ' ירידה", 120), ("Deficit Push-Up", "2×6", "Bodyweight", "2 שנ' ירידה", 90), ("Seated DB OHP", "2×8", "3 kg each", "2 שנ' ירידה", 90), ("DB Lateral Raise", "2×12", "3 kg each", "2 שנ' ירידה", 60), ("DB OH Triceps Ext", "2×10", "6 kg total", "2 שנ' ירידה", 60), ("Arm Block - DB Lateral Raise", "1×12", "3 kg each", "2 שנ' ירידה", 60), ("Arm Block - DB OH Triceps Ext", "1×10", "6 kg total", "2 שנ' ירידה", 60)]
            elif week == 41: raw = [("Single-Arm Floor Press", "2×8/side", "12 kg", "2 שנ' ירידה", 120), ("Elevated Pike Push-Up", "2×6", "Bodyweight", "2 שנ' ירידה", 90), ("Seated DB OHP", "2×8", "3 kg each", "2 שנ' ירידה", 90), ("DB Lateral Raise", "2×12", "3 kg each", "2 שנ' ירידה", 60), ("DB OH Triceps Ext", "2×10", "6 kg total", "2 שנ' ירידה", 60), ("Arm Block - DB Lateral Raise", "1×12", "3 kg each", "2 שנ' ירידה", 60), ("Arm Block - DB OH Triceps Ext", "1×10", "6 kg total", "2 שנ' ירידה", 60)]
            elif week in (49, 57, 61, 65, 69): raw = [("Single-Arm Floor Press", "2×8/side", "12 kg", "2 שנ' ירידה", 120), ("Single-Arm Seated OHP", "2×8/side", "9 kg", "2 שנ' ירידה", 90), ("DB Lateral Raise", "2×12", "6 kg each", "2 שנ' ירידה", 60), ("DB OH Triceps Ext", "2×10", "9 kg total", "2 שנ' ירידה", 60), ("Arm Block - DB Lateral Raise", "1×12", "6 kg each", "2 שנ' ירידה", 60), ("Arm Block - DB OH Triceps Ext", "1×10", "9 kg total", "2 שנ' ירידה", 60)]
            else: raw = [("Single-Arm Floor Press", "2×8/side", "15 kg", "2 שנ' ירידה", 120), ("Single-Arm Seated OHP", "2×8/side", "15 kg", "2 שנ' ירידה", 90), ("DB Lateral Raise", "2×12", "6 kg each", "2 שנ' ירידה", 60), ("DB OH Triceps Ext", "2×10", "15 kg total", "2 שנ' ירידה", 60), ("Arm Block - DB Lateral Raise", "1×12", "6 kg each", "2 שנ' ירידה", 60), ("Arm Block - DB OH Triceps Ext", "1×10", "15 kg total", "2 שנ' ירידה", 60)]
            return "Push + Skill (Deload)", "5-6", build_exercises(raw, get_push_warmup(is_year2))

        elif dow == 5: # Day 5 Deload
            if week == 9: raw = [("Pull-Up Negative", "2×2", "Bodyweight", "3 שנ' ירידה", 120), ("One-Arm DB Row", "2×8/side", "3 kg", "2 שנ' ירידה", 90), ("TRX Face Pull (Angle 1)", "2×10", "Bodyweight", "2 שנ' ירידה", 60), ("DB Curl", "2×10", "3 kg each", "2 שנ' ירידה", 60)]
            elif week == 17: raw = [("Pull-Up Negative", "2×2", "Bodyweight", "3 שנ' ירידה", 120), ("One-Arm DB Row", "2×8/side", "6 kg", "2 שנ' ירידה", 90), ("TRX Face Pull (Angle 2)", "2×10", "Bodyweight", "2 שנ' ירידה", 60), ("DB Curl", "2×10", "3 kg each", "2 שנ' ירידה", 60), ("Arm Block - DB Curl", "1×10", "3 kg each", "2 שנ' ירידה", 60)]
            elif week == 25: raw = [("Pull-Up (Overhand)", "2×2", "Bodyweight", "2 שנ' ירידה", 120), ("One-Arm DB Row", "2×8/side", "6 kg", "2 שנ' ירידה", 90), ("TRX Face Pull (Angle 2)", "2×10", "Bodyweight", "2 שנ' ירידה", 60), ("DB Hammer Curl", "2×10", "3 kg each", "2 שנ' ירידה", 60), ("Arm Block - DB Curl", "1×10", "3 kg each", "2 שנ' ירידה", 60)]
            elif week == 33: raw = [("Pull-Up (Overhand)", "2×3", "Bodyweight", "2 שנ' ירידה", 120), ("One-Arm DB Row", "2×8/side", "9 kg", "2 שנ' ירידה", 90), ("TRX Face Pull (Angle 3)", "2×10", "Bodyweight", "2 שנ' ירידה", 60), ("DB Curl", "2×10", "3 kg each", "2 שנ' ירידה", 60), ("Arm Block - DB Curl", "1×10", "3 kg each", "2 שנ' ירידה", 60)]
            elif week == 41: raw = [("Pull-Up (Overhand)", "2×3", "Bodyweight", "2 שנ' ירידה", 120), ("One-Arm DB Row", "2×8/side", "9 kg", "2 שנ' ירידה", 90), ("TRX Face Pull (Angle 3)", "2×10", "Bodyweight", "2 שנ' ירידה", 60), ("DB Curl", "2×10", "6 kg each", "2 שנ' ירידה", 60), ("Arm Block - DB Curl", "1×10", "6 kg each", "2 שנ' ירידה", 60)]
            elif week in (49, 57, 61, 65, 69): raw = [("Pull-Up (Overhand)", "2×4", "Bodyweight", "2 שנ' ירידה", 120), ("One-Arm DB Row", "2×8/side", "12 kg", "2 שנ' ירידה", 90), ("TRX Face Pull (Angle 3)", "2×10", "Bodyweight", "2 שנ' ירידה", 60), ("Single-Arm Curl", "2×10/side", "9 kg", "2 שנ' ירידה", 60), ("Arm Block - DB Curl", "1×10", "9 kg each", "2 שנ' ירידה", 60)]
            else: raw = [("Pull-Up (Overhand)", "2×4", "Bodyweight", "2 שנ' ירידה", 120), ("One-Arm DB Row", "2×8/side", "15 kg", "2 שנ' ירידה", 90), ("TRX Face Pull (Angle 3)", "2×10", "Bodyweight", "2 שנ' ירידה", 60), ("Single-Arm Curl", "2×10/side", "12 kg", "2 שנ' ירידה", 60), ("Arm Block - DB Curl", "1×10", "12 kg each", "2 שנ' ירידה", 60)]
            return "Pull + Grip (Deload)", "5-6", build_exercises(raw, get_pull_warmup())

    # REGULAR WEEKS (Non-Deload, Non-Maintenance)

    # Phase 1: Weeks 1–4
    if 1 <= week <= 4:
        if dow == 1:
            raw = [
                ("DB RDL", "3×8", "6 kg each", "3 שנ' ירידה", 120),
                ("DB Bulgarian Split Squat", "3×8/leg", "Bodyweight", "2 שנ' ירידה", 90),
                ("DB Glute Bridge", "3×12", "9 kg on hips", "1 שנ' עצירה", 90),
                ("Single-Leg Calf Raise", "3×15/leg", "Bodyweight", "2 שנ' ירידה", 60),
                ("Suitcase Carry", "3×25m/side", "12 kg", "הליכה", 90),
                ("Dead Bug", "3×8/side", "Bodyweight", "איטי", 60),
            ]
            return "Legs + Core", "7-8", build_exercises(raw, get_leg_warmup())
        elif dow == 3:
            raw = [
                ("Pike Hold", "3×15 secs", "Bodyweight", "סטטי", 90),
                ("DB Floor Press", "3×8", "6 kg each", "2 שנ' ירידה", 120),
                ("Push-up", "3×6", "Bodyweight", "2 שנ' ירידה", 90),
                ("Seated DB OHP", "3×8", "3 kg each", "2 שנ' ירידה", 90),
                ("DB Lateral Raise", "2×12", "3 kg each", "2 שנ' ירידה", 60),
                ("DB OH Triceps Ext", "2×12", "6 kg total", "2 שנ' ירידה", 60),
                ("TRX Y-T-W", "2×8/shape", "Bodyweight (Angle 1)", "1 שנ' עצירה", 60),
            ]
            return "Push + Skill", "7-8", build_exercises(raw, get_push_warmup())
        elif dow == 5:
            raw = [
                ("Pull-Up Negative", "3×2", "Bodyweight", "3 שנ' ירידה", 120),
                ("One-Arm DB Row", "3×8/side", "6 kg", "2 שנ' ירידה", 90),
                ("TRX Face Pull", "3×12", "Bodyweight (Angle 1)", "2 שנ' ירידה", 60),
                ("DB Curl", "2×10", "3 kg each", "2 שנ' ירידה", 60),
                ("Towel Hang", "3×15 secs", "Bodyweight", "סטטי", 60),
                ("L-sit Tuck (Bars)", "3×8 secs", "Bodyweight", "סטטי", 60),
            ]
            return "Pull + Grip", "7-8", build_exercises(raw, get_pull_warmup())

    # Phase 2: Weeks 5–8
    if 5 <= week <= 8:
        if dow == 1:
            raw = [
                ("DB RDL", "4×10", "9 kg each", "3 שנ' ירידה", 120),
                ("DB Bulgarian Split Squat", "3×10/leg", "3 kg each", "2 שנ' ירידה", 90),
                ("DB Hip Thrust", "3×15", "9 kg on hips", "2 שנ' עצירה", 90),
                ("Single-Leg Calf Raise", "3×18/leg", "9 kg in hand", "2 שנ' ירידה", 60),
                ("Suitcase Carry", "3×30m/side", "15 kg", "הליכה", 90),
                ("Hollow Body Hold", "3×15 secs", "Bodyweight", "סטטי", 60),
            ]
            return "Legs + Core", "7-8", build_exercises(raw, get_leg_warmup())
        elif dow == 3:
            raw = [
                ("Pike Hold", "3×20 secs", "Bodyweight (Feet on chair)", "סטטי", 90),
                ("DB Floor Press", "4×10", "9 kg each", "2 שנ' ירידה", 120),
                ("Push-up", "4×5", "Bodyweight", "2 שנ' ירידה", 90),
                ("Seated DB OHP", "3×10", "6 kg each", "2 שנ' ירידה", 90),
                ("DB Lateral Raise", "3×15", "3 kg each", "2 שנ' ירידה", 60),
                ("DB OH Triceps Ext", "3×12", "6 kg total", "2 שנ' ירידה", 60),
                ("TRX Y-T-W", "2×10/shape", "Bodyweight (Angle 1)", "1 שנ' עצירה", 60),
            ]
            return "Push + Skill", "7-8", build_exercises(raw, get_push_warmup())
        elif dow == 5:
            raw = [
                ("Pull-Up Negative", "4×3", "Bodyweight", "4 שנ' ירידה", 120),
                ("Chin-Up Negative", "3×3", "Bodyweight", "4 שנ' ירידה", 120),
                ("One-Arm DB Row", "3×10/side", "9 kg", "2 שנ' ירידה", 90),
                ("TRX Face Pull", "3×15", "Bodyweight (Angle 2)", "2 שנ' ירידה", 60),
                ("DB Hammer Curl", "3×12", "6 kg each", "2 שנ' ירידה", 60),
                ("Towel Hang", "3×25 secs", "Bodyweight", "סטטי", 60),
                ("L-sit Tuck (Bars)", "3×10 secs", "Bodyweight", "סטטי", 60),
            ]
            return "Pull + Grip", "7-8", build_exercises(raw, get_pull_warmup())

    # Phase 4: Weeks 10–16 (Arm block starts!)
    if 10 <= week <= 16:
        if dow == 1:
            raw = [
                ("DB RDL", "4×8", "12 kg each", "3 שנ' ירידה", 120),
                ("DB Bulgarian Split Squat", "4×8/leg", "9 kg each", "2 שנ' ירידה", 90),
                ("DB Hip Thrust", "4×10", "12 kg on hips", "2 שנ' עצירה", 90),
                ("Single-Leg Calf Raise", "3×20/leg", "9 kg", "2 שנ' ירידה", 60),
                ("Pallof Press", "3×12/side", "Band 30 kg", "1 שנ' עצירה", 60),
                ("Dead Bug", "3×10/side", "Bodyweight", "איטי", 60),
            ]
            return "Legs + Core", "7-8", build_exercises(raw, get_leg_warmup())
        elif dow == 3:
            raw = [
                ("Wall Walk (Partial)", "3×3", "Bodyweight", "איטי", 90),
                ("DB Floor Press", "4×6", "12 kg each", "2 שנ' ירידה", 120),
                ("Deficit Push-Up", "3×6", "Bodyweight", "2 שנ' ירידה", 90),
                ("Seated DB OHP", "3×8", "6 kg each", "2 שנ' ירידה", 90),
                ("DB Lateral Raise", "3×18", "3 kg each", "2 שנ' ירידה", 60),
                ("DB OH Triceps Ext", "3×10", "9 kg total", "2 שנ' ירידה", 60),
                ("Band Pull-Apart", "2×20", "Band 30 kg", "1 שנ' עצירה", 60),
                ("Arm Block - DB Lateral Raise", "2×12-20", "3-9 kg each (Ladder)", "2 שנ' ירידה", 60),
                ("Arm Block - DB OH Triceps Ext", "2×10-15", "6-15 kg total (Ladder)", "2 שנ' ירידה", 60),
            ]
            return "Push + Skill", "7-8", build_exercises(raw, get_push_warmup())
        elif dow == 5:
            raw = [
                ("Pull-Up (Overhand)", "3×1", "Bodyweight", "2 שנ' ירידה", 120),
                ("Chin-Up", "3×1", "Bodyweight", "2 שנ' ירידה", 120),
                ("One-Arm DB Row", "4×8/side", "12 kg", "2 שנ' ירידה", 90),
                ("TRX Face Pull", "3×12", "Bodyweight (Angle 2)", "2 שנ' ירידה", 60),
                ("DB Curl", "3×10", "6 kg each", "2 שנ' ירידה", 60),
                ("Towel Hang", "3×30 secs", "Bodyweight", "סטטי", 60),
                ("L-sit Tuck (Bars)", "3×10 secs", "Bodyweight", "סטטי", 60),
                ("Arm Block - DB Curl", "2×10-15", "3-12 kg each (Ladder)", "2 שנ' ירידה + 1 שנ' כיווץ", 60),
            ]
            return "Pull + Grip", "7-8", build_exercises(raw, get_pull_warmup())

    # Phase 6: Weeks 18–24
    if 18 <= week <= 24:
        if dow == 1:
            raw = [
                ("DB Bulgarian Split Squat", "4×10/leg", "9 kg each", "2 שנ' ירידה", 90),
                ("DB Single-Leg RDL", "4×10/leg", "12 kg", "3 שנ' ירידה", 120),
                ("DB Hip Thrust", "4×12", "15 kg on hips", "2 שנ' עצירה", 90),
                ("Reverse Lunge + DB", "3×10/leg", "9 kg each", "2 שנ' ירידה", 90),
                ("Single-Leg Calf Raise", "4×18/leg", "12 kg", "2 שנ' ירידה", 60),
                ("Suitcase Carry", "3×40m/side", "18 kg", "הליכה", 90),
            ]
            return "Legs + Core", "7-8", build_exercises(raw, get_leg_warmup())
        elif dow == 3:
            raw = [
                ("Wall Walk (Full)", "3×3", "Bodyweight", "איטי", 90),
                ("Single-Arm Floor Press", "4×8/side", "15 kg", "2 שנ' ירידה", 120),
                ("Feet-Elevated Push-Up", "4×6", "Bodyweight", "2 שנ' ירידה", 90),
                ("Seated DB OHP", "3×10", "9 kg each", "2 שנ' ירידה", 90),
                ("DB Lateral Raise", "3×20", "3 kg each", "3 שנ' ירידה", 60),
                ("DB OH Triceps Ext", "3×12", "9 kg total", "2 שנ' ירידה", 60),
                ("TRX Y-T-W", "3×10/shape", "Bodyweight (Angle 1)", "1 שנ' עצירה", 60),
                ("Arm Block - DB Lateral Raise", "2×12-20", "3-9 kg each (Ladder)", "2 שנ' ירידה", 60),
                ("Arm Block - DB OH Triceps Ext", "2×10-15", "6-15 kg total (Ladder)", "2 שנ' ירידה", 60),
            ]
            return "Push + Skill", "7-8", build_exercises(raw, get_push_warmup())
        elif dow == 5:
            raw = [
                ("Pull-Up (Overhand)", "4×3", "Bodyweight", "2 שנ' ירידה", 120),
                ("Chin-Up", "3×3", "Bodyweight", "2 שנ' ירידה", 120),
                ("One-Arm DB Row", "4×10/side", "12 kg", "2 שנ' ירידה", 90),
                ("TRX Face Pull", "3×15", "Bodyweight (Angle 3)", "2 שנ' ירידה", 60),
                ("DB Hammer Curl", "3×12", "6 kg each", "2 שנ' ירידה", 60),
                ("Towel Hang", "3×35 secs", "Bodyweight", "סטטי", 60),
                ("L-sit Tuck (Bars)", "3×12 secs", "Bodyweight", "סטטי", 60),
                ("Arm Block - DB Curl", "2×10-15", "3-12 kg each (Ladder)", "2 שנ' ירידה", 60),
            ]
            return "Pull + Grip", "7-8", build_exercises(raw, get_pull_warmup())

    # Phase 8: Weeks 26–32
    if 26 <= week <= 32:
        if dow == 1:
            raw = [
                ("DB Single-Leg RDL", "4×6/leg", "15 kg", "3 שנ' ירידה", 120),
                ("DB Bulgarian Split Squat", "4×6/leg", "12 kg each", "2 שנ' ירידה", 90),
                ("DB Hip Thrust", "4×8", "18 kg on hips", "2 שנ' עצירה", 90),
                ("Single-Leg Calf Raise", "4×15/leg", "12 kg", "2 שנ' ירידה", 60),
                ("Suitcase Carry", "4×30m/side", "21 kg", "הליכה", 90),
                ("Hollow Body Hold", "3×20 secs", "Bodyweight", "סטטי", 60),
            ]
            return "Legs + Core", "7-8", build_exercises(raw, get_leg_warmup())
        elif dow == 3:
            raw = [
                ("Wall Handstand", "3×20 secs", "Bodyweight (Face to wall)", "סטטי", 90),
                ("Single-Arm Floor Press", "4×6/side", "18 kg", "2 שנ' ירידה", 120),
                ("Deficit Push-Up", "4×6", "Bodyweight", "2 שנ' ירידה", 90),
                ("Seated DB OHP", "3×8", "9 kg each", "2 שנ' ירידה", 90),
                ("DB Lateral Raise", "3×15", "3 kg each", "2 שנ' ירידה", 60),
                ("DB OH Triceps Ext", "3×10", "9 kg total", "2 שנ' ירידה", 60),
                ("Band Pull-Apart", "3×20", "Band 30 kg", "1 שנ' עצירה", 60),
                ("Arm Block - DB Lateral Raise", "2×12-20", "Ladder", "2 שנ' ירידה", 60),
                ("Arm Block - DB OH Triceps Ext", "2×10-15", "Ladder", "2 שנ' ירידה", 60),
            ]
            return "Push + Skill", "7-8", build_exercises(raw, get_push_warmup())
        elif dow == 5:
            raw = [
                ("Pull-Up (Overhand)", "4×4", "Bodyweight", "2 שנ' ירידה", 120),
                ("Chin-Up", "3×4", "Bodyweight", "2 שנ' ירידה", 120),
                ("One-Arm DB Row", "4×8/side", "15 kg", "2 שנ' ירידה", 90),
                ("TRX Face Pull", "3×12", "Bodyweight (Angle 3)", "2 שנ' ירידה", 60),
                ("DB Curl", "3×10", "6 kg each", "2 שנ' ירידה", 60),
                ("Towel Hang", "3×40 secs", "Bodyweight", "סטטי", 60),
                ("L-sit Tuck (Bars)", "3×12 secs", "Bodyweight", "סטטי", 60),
                ("Arm Block - DB Curl", "2×10-15", "Ladder", "2 שנ' ירידה", 60),
            ]
            return "Pull + Grip", "7-8", build_exercises(raw, get_pull_warmup())

    # Phase 10: Weeks 34–40
    if 34 <= week <= 40:
        if dow == 1:
            raw = [
                ("DB Single-Leg RDL", "4×8/leg", "12 kg", "3 שנ' ירידה", 120),
                ("DB BSS (Goblet)", "4×8/leg", "15 kg", "1 שנ' עצירה למטה", 90),
                ("DB Hip Thrust", "4×10", "21 kg on hips", "2 שנ' עצירה", 90),
                ("Reverse Lunge + DB", "3×10/leg", "9 kg each", "2 שנ' ירידה", 90),
                ("Single-Leg Calf Raise", "4×20/leg", "15 kg", "2 שנ' ירידה", 60),
                ("Pallof Press", "3×15/side", "Band 40 kg", "1 שנ' עצירה", 60),
            ]
            return "Legs + Core", "7-8", build_exercises(raw, get_leg_warmup())
        elif dow == 3:
            raw = [
                ("Wall Handstand", "3×30 secs", "Bodyweight", "סטטי", 90),
                ("Single-Arm Floor Press", "4×8/side", "21 kg", "1 שנ' עצירה למטה", 120),
                ("Feet-Elevated Push-Up", "4×6", "Bodyweight", "2 שנ' ירידה", 90),
                ("Seated DB OHP", "3×10", "9 kg each", "2 שנ' ירידה", 90),
                ("DB Lateral Raise", "3×20", "3 kg each", "3 שנ' ירידה", 60),
                ("DB OH Triceps Ext", "3×12", "12 kg total", "2 שנ' ירידה", 60),
                ("TRX Y-T-W", "3×12/shape", "Bodyweight (Angle 1)", "1 שנ' עצירה", 60),
                ("Arm Block - DB Lateral Raise", "2×12-20", "Ladder", "2 שנ' ירידה", 60),
                ("Arm Block - DB OH Triceps Ext", "2×10-15", "Ladder", "2 שנ' ירידה", 60),
            ]
            return "Push + Skill", "7-8", build_exercises(raw, get_push_warmup())
        elif dow == 5:
            raw = [
                ("Pull-Up (Overhand)", "4×5", "Bodyweight", "2 שנ' ירידה", 120),
                ("Chin-Up", "3×5", "Bodyweight", "2 שנ' ירידה", 120),
                ("One-Arm DB Row", "4×10/side", "18 kg", "2 שנ' ירידה", 90),
                ("TRX Face Pull", "3×15", "Bodyweight (Angle 3)", "2 שנ' ירידה", 60),
                ("DB Curl", "3×12", "9 kg each", "2 שנ' ירידה", 60),
                ("Towel Hang", "3×45 secs", "Bodyweight", "סטטי", 60),
                ("L-sit Tuck (Bars)", "3×15 secs", "Bodyweight", "סטטי", 60),
                ("Arm Block - DB Curl", "2×10-15", "Ladder", "2 שנ' ירידה", 60),
            ]
            return "Pull + Grip", "7-8", build_exercises(raw, get_pull_warmup())

    # Phase 12: Weeks 42–48
    if 42 <= week <= 48:
        if dow == 1:
            raw = [
                ("Pistol Squat to Chair", "3×5/leg", "Bodyweight", "3 שנ' ירידה", 120),
                ("DB Single-Leg RDL", "4×8/leg", "18 kg", "3 שנ' ירידה", 120),
                ("DB Hip Thrust", "4×10", "21 kg on hips", "2 שנ' עצירה", 90),
                ("Reverse Lunge + DB", "3×12/leg", "12 kg each", "2 שנ' ירידה", 90),
                ("Single-Leg Calf Raise", "4×20/leg", "18 kg", "2 שנ' עצירה למטה", 60),
                ("Dead Bug", "3×12/side", "Bodyweight", "איטי", 60),
            ]
            return "Legs + Core", "7-8", build_exercises(raw, get_leg_warmup())
        elif dow == 3:
            raw = [
                ("Wall Handstand", "3×30 secs", "Bodyweight", "סטטי", 90),
                ("Single-Arm Floor Press", "4×8/side", "24 kg", "2 שנ' ירידה", 120),
                ("Elevated Pike Push-Up", "4×8", "Bodyweight", "2 שנ' ירידה", 90),
                ("Seated DB OHP", "3×12", "12 kg each", "2 שנ' ירידה", 90),
                ("DB Lateral Raise", "3×20", "6 kg each", "3 שנ' ירידה", 60),
                ("DB OH Triceps Ext", "3×15", "12 kg total", "2 שנ' ירידה", 60),
                ("Band Pull-Apart", "3×20", "Band 30 kg", "1 שנ' עצירה", 60),
                ("Arm Block - DB Lateral Raise", "2×12-20", "Ladder", "2 שנ' ירידה", 60),
                ("Arm Block - DB OH Triceps Ext", "2×10-15", "Ladder", "2 שנ' ירידה", 60),
            ]
            return "Push + Skill", "7-8", build_exercises(raw, get_push_warmup())
        elif dow == 5:
            raw = [
                ("Pull-Up (Overhand)", "4×5", "Bodyweight", "2 שנ' ירידה", 120),
                ("Chin-Up", "3×5", "Bodyweight", "2 שנ' ירידה", 120),
                ("One-Arm DB Row", "4×10/side", "21 kg", "2 שנ' ירידה", 90),
                ("TRX Face Pull", "3×18", "Bodyweight (Angle 3)", "2 שנ' ירידה", 60),
                ("DB Curl", "3×15", "9 kg each", "2 שנ' ירידה", 60),
                ("Towel Hang", "3×45 secs", "Bodyweight", "סטטי", 60),
                ("L-sit Tuck (Bars)", "3×15 secs", "Bodyweight", "סטטי", 60),
                ("Arm Block - DB Curl", "2×10-15", "Ladder", "2 שנ' ירידה", 60),
            ]
            return "Pull + Grip", "7-8", build_exercises(raw, get_pull_warmup())

    # Phase 14: Weeks 50–52
    if 50 <= week <= 52:
        if dow == 1:
            raw = [
                ("Pistol Squat to Chair", "3×8/leg", "Bodyweight", "3 שנ' ירידה", 120),
                ("DB Single-Leg RDL", "3×10/leg", "21 kg", "3 שנ' ירידה", 120),
                ("DB Hip Thrust", "3×12", "24 kg on hips", "2 שנ' עצירה", 90),
                ("Reverse Lunge + DB", "3×12/leg", "12 kg each", "2 שנ' ירידה", 90),
                ("Single-Leg Calf Raise", "4×20/leg", "21 kg", "2 שנ' עצירה למטה", 60),
                ("Dead Bug", "3×12/side", "Bodyweight", "איטי", 60),
            ]
            return "Legs + Core", "7-8", build_exercises(raw, get_leg_warmup())
        elif dow == 3:
            raw = [
                ("Wall Handstand", "3×30 secs", "Bodyweight", "סטטי", 90),
                ("Single-Arm Floor Press", "3×10/side", "24 kg", "2 שנ' ירידה", 120),
                ("Feet-Elevated Push-Up", "4×10", "Bodyweight", "2 שנ' ירידה", 90),
                ("Elevated Pike Push-Up", "3×10", "Bodyweight", "2 שנ' ירידה", 90),
                ("Seated DB OHP", "3×12", "12 kg each", "2 שנ' ירידה", 90),
                ("DB Lateral Raise", "3×20", "6 kg each", "3 שנ' ירידה", 60),
                ("DB OH Triceps Ext", "3×15", "15 kg total", "2 שנ' ירידה", 60),
                ("Arm Block - DB Lateral Raise", "2×12-20", "Ladder", "2 שנ' ירידה", 60),
                ("Arm Block - DB OH Triceps Ext", "2×10-15", "Ladder", "2 שנ' ירידה", 60),
            ]
            return "Push + Skill", "7-8", build_exercises(raw, get_push_warmup())
        elif dow == 5:
            raw = [
                ("Pull-Up (Overhand)", "4×6", "Bodyweight", "2 שנ' ירידה", 120),
                ("Chin-Up", "3×6", "Bodyweight", "2 שנ' ירידה", 120),
                ("One-Arm DB Row", "3×12/side", "21 kg", "2 שנ' ירידה", 90),
                ("TRX Face Pull", "3×18", "Bodyweight (Angle 3)", "2 שנ' ירידה", 60),
                ("DB Curl", "3×15", "9 kg each", "2 שנ' ירידה", 60),
                ("Towel Hang", "3×45 secs", "Bodyweight", "סטטי", 60),
                ("L-sit Tuck (Bars)", "3×15 secs", "Bodyweight", "סטטי", 60),
                ("Arm Block - DB Curl", "2×10-15", "Ladder", "2 שנ' ירידה", 60),
            ]
            return "Pull + Grip", "7-8", build_exercises(raw, get_pull_warmup())

    # YEAR 2 WEEKS (53–73)
    if 53 <= week <= 56:
        if dow == 1:
            raw = [("DB Single-Leg RDL", "4×8/leg", "24 kg", "3 שנ' ירידה", 120), ("DB BSS (Goblet)", "4×8/leg", "18 kg", "2 שנ' ירידה", 90), ("DB Hip Thrust", "4×10", "24 kg on hips", "2 שנ' עצירה", 90), ("Reverse Lunge + DB", "3×10/leg", "12 kg each", "2 שנ' ירידה", 90), ("Single-Leg Calf Raise", "4×20/leg", "21 kg", "2 שנ' ירידה", 60), ("Suitcase Carry", "4×30m/side", "24 kg", "הליכה", 90), ("Dead Bug", "3×12/side", "Bodyweight", "איטי", 60)]
            return "Legs + Core", "7-8", build_exercises(raw, get_leg_warmup())
        elif dow == 3:
            raw = [("Wall Handstand", "3×30 secs", "Bodyweight", "סטטי", 90), ("Single-Arm Floor Press", "4×8/side", "24 kg", "2 שנ' ירידה", 120), ("Deficit Push-Up", "4×8", "Bodyweight", "2 שנ' ירידה", 90), ("Single-Arm Seated OHP", "4×8/side", "18 kg", "2 שנ' ירידה", 90), ("DB Lateral Raise", "3×15", "9 kg each", "2 שנ' ירידה", 60), ("DB OH Triceps Ext", "3×12", "18 kg total", "2 שנ' ירידה", 60), ("Band Pull-Apart", "2×20", "Band 30 kg", "1 שנ' עצירה", 60), ("Arm Block - DB Lateral Raise", "2×12-20", "Ladder", "2 שנ' ירידה", 60), ("Arm Block - DB OH Triceps Ext", "2×10-15", "Ladder", "2 שנ' ירידה", 60)]
            return "Push + Skill", "7-8", build_exercises(raw, get_push_warmup(is_year2=True))
        elif dow == 5:
            raw = [("Pull-Up (Overhand)", "4×6", "Bodyweight", "2 שנ' ירידה", 120), ("Chin-Up", "3×6", "Bodyweight", "2 שנ' ירידה", 120), ("One-Arm DB Row", "4×10/side", "24 kg", "2 שנ' ירידה", 90), ("TRX Face Pull", "3×15", "Bodyweight (Angle 3)", "2 שנ' ירידה", 60), ("DB Hammer Curl", "3×12", "12 kg each", "2 שנ' ירידה", 60), ("Towel Hang", "3×45 secs", "Bodyweight", "סטטי", 60), ("L-sit Tuck (Bars)", "3×15 secs", "Bodyweight", "סטטי", 60), ("Arm Block - DB Curl", "2×10-15", "Ladder", "2 שנ' ירידה", 60)]
            return "Pull + Grip", "7-8", build_exercises(raw, get_pull_warmup())

    if 58 <= week <= 60:
        if dow == 1:
            raw = [("DB Single-Leg RDL", "4×8/leg", "24 kg", "3 שנ' ירידה", 120), ("DB BSS (Goblet)", "4×10/leg", "21 kg", "1 שנ' עצירה", 90), ("DB Hip Thrust", "4×12", "24 kg on hips", "2 שנ' עצירה", 90), ("Reverse Lunge + DB", "3×10/leg", "12 kg each", "2 שנ' ירידה", 90), ("Single-Leg Calf Raise", "4×20/leg", "24 kg", "2 שנ' עצירה", 60), ("Pallof Press", "3×15/side", "Band 40 kg", "1 שנ' עצירה", 60), ("Hollow Body Hold", "3×20 secs", "Bodyweight", "סטטי", 60)]
            return "Legs + Core", "7-8", build_exercises(raw, get_leg_warmup())
        elif dow == 3:
            raw = [("Wall Handstand", "3×35 secs", "Bodyweight", "סטטי", 90), ("Single-Arm Floor Press", "4×8/side", "24 kg", "2 שנ' ירידה", 120), ("Feet-Elevated Push-Up", "4×10", "Bodyweight", "2 שנ' ירידה", 90), ("Single-Arm Seated OHP", "4×10/side", "21 kg", "2 שנ' ירידה", 90), ("DB Lateral Raise", "3×18", "9 kg each", "3 שנ' ירידה", 60), ("DB OH Triceps Ext", "3×12", "21 kg total", "2 שנ' ירידה", 60), ("TRX Y-T-W", "3×10/shape", "Bodyweight (Angle 1)", "1 שנ' עצירה", 60), ("Arm Block - DB Lateral Raise", "2×12-20", "Ladder", "2 שנ' ירידה", 60), ("Arm Block - DB OH Triceps Ext", "2×10-15", "Ladder", "2 שנ' ירידה", 60)]
            return "Push + Skill", "7-8", build_exercises(raw, get_push_warmup(is_year2=True))
        elif dow == 5:
            raw = [("Pull-Up (Overhand)", "4×6", "Bodyweight", "2 שנ' ירידה", 120), ("Chin-Up", "3×6", "Bodyweight", "2 שנ' ירידה", 120), ("One-Arm DB Row", "4×10/side", "24 kg", "2 שנ' ירידה", 90), ("TRX Face Pull", "3×18", "Bodyweight (Angle 3)", "2 שנ' ירידה", 60), ("DB Curl", "3×12", "12 kg each", "2 שנ' ירידה", 60), ("Towel Hang", "3×50 secs", "Bodyweight", "סטטי", 60), ("L-sit Tuck (Bars)", "3×18 secs", "Bodyweight", "סטטי", 60), ("Arm Block - DB Curl", "2×10-15", "Ladder", "2 שנ' ירידה", 60)]
            return "Pull + Grip", "7-8", build_exercises(raw, get_pull_warmup())

    if 62 <= week <= 64:
        if dow == 1:
            raw = [("DB Single-Leg RDL", "4×6/leg", "24 kg", "3 שנ' ירידה", 120), ("DB BSS (Goblet)", "4×8/leg", "24 kg", "1 שנ' עצירה", 90), ("DB Hip Thrust", "4×10", "24 kg on hips", "3 שנ' עצירה", 90), ("Walking Lunge (Goblet)", "3×12/leg", "18 kg", "2 שנ' ירידה", 90), ("Single-Leg Calf Raise", "4×15/leg", "24 kg", "2 שנ' ירידה", 60), ("Suitcase Carry", "4×40m/side", "24 kg", "הליכה", 90), ("Hollow Body Hold", "3×25 secs", "Bodyweight", "סטטי", 60)]
            return "Legs + Core", "7-8", build_exercises(raw, get_leg_warmup())
        elif dow == 3:
            raw = [("Wall Handstand", "3×35 secs", "Bodyweight", "סטטי", 90), ("Single-Arm Floor Press", "5×6/side", "24 kg", "2 שנ' ירידה", 120), ("Weighted Deficit Push-Up", "4×6", "Vest +5 kg", "2 שנ' ירידה", 90), ("Single-Arm Seated OHP", "4×8/side", "24 kg", "2 שנ' ירידה", 90), ("DB Lateral Raise", "4×15", "9 kg each", "3 שנ' ירידה", 60), ("DB OH Triceps Ext", "3×10", "21 kg total", "2 שנ' ירידה", 60), ("Band Pull-Apart", "3×20", "Band 30 kg", "1 שנ' עצירה", 60), ("Arm Block - DB Lateral Raise", "2×12-20", "Ladder", "2 שנ' ירידה", 60), ("Arm Block - DB OH Triceps Ext", "2×10-15", "Ladder", "2 שנ' ירידה", 60)]
            return "Push + Skill", "7-8", build_exercises(raw, get_push_warmup(is_year2=True))
        elif dow == 5:
            raw = [("Weighted Pull-Up", "5×5", "Vest +5 kg", "2 שנ' ירידה", 120), ("Chin-Up", "4×5", "Bodyweight", "2 שנ' ירידה", 120), ("One-Arm DB Row", "4×8/side", "24 kg", "2 שנ' ירידה", 90), ("TRX Face Pull", "3×15", "Bodyweight (Angle 3)", "2 שנ' ירידה", 60), ("Single-Arm Curl", "4×10/side", "15 kg", "2 שנ' ירידה", 60), ("Towel Hang", "3×50 secs", "Bodyweight", "סטטי", 60), ("L-sit Tuck (Bars)", "3×20 secs", "Bodyweight", "סטטי", 60), ("Arm Block - DB Curl", "2×10-15", "Ladder", "2 שנ' ירידה", 60)]
            return "Pull + Grip", "7-8", build_exercises(raw, get_pull_warmup())

    if 66 <= week <= 68: # PEAK
        if dow == 1:
            raw = [("DB Single-Leg RDL", "4×6/leg", "24 kg", "3 שנ' ירידה", 120), ("DB BSS (Goblet)", "4×6/leg", "24 kg", "2 שנ' עצירה", 90), ("DB Hip Thrust", "4×8", "24 kg on hips", "3 שנ' עצירה", 90), ("Pistol Squat to Chair", "3×5/leg", "Bodyweight", "3 שנ' ירידה", 120), ("Single-Leg Calf Raise", "4×12/leg", "24 kg", "2 שנ' ירידה", 60), ("Suitcase Carry", "4×40m/side", "24 kg", "הליכה", 90), ("Pallof Press", "3×12/side", "Band 40 kg", "1 שנ' עצירה", 60)]
            return "Legs + Core", "8-9", build_exercises(raw, get_leg_warmup())
        elif dow == 3:
            raw = [("Wall Handstand", "3×40 secs", "Bodyweight", "סטטי", 90), ("Single-Arm Floor Press", "5×6/side", "24 kg", "2 שנ' ירידה", 120), ("Elevated Pike Push-Up", "4×8", "Bodyweight", "2 שנ' ירידה", 90), ("Single-Arm Seated OHP", "4×6/side", "24 kg", "2 שנ' ירידה", 90), ("DB Lateral Raise", "4×12", "9 kg each", "3 שנ' ירידה", 60), ("DB OH Triceps Ext", "3×8", "24 kg total", "2 שנ' ירידה", 60), ("TRX Y-T-W", "3×12/shape", "Bodyweight (Angle 1)", "1 שנ' עצירה", 60), ("Arm Block - DB Lateral Raise", "2×12-20", "Ladder", "2 שנ' ירידה", 60), ("Arm Block - DB OH Triceps Ext", "2×10-15", "Ladder", "2 שנ' ירידה", 60)]
            return "Push + Skill", "8-9", build_exercises(raw, get_push_warmup(is_year2=True))
        elif dow == 5:
            raw = [("Weighted Pull-Up", "5×5", "Vest +5 kg", "2 שנ' ירידה", 120), ("Weighted Chin-Up", "4×5", "Vest +5 kg", "2 שנ' ירידה", 120), ("One-Arm DB Row", "4×8/side", "24 kg", "2 שנ' ירידה", 90), ("TRX Face Pull", "3×18", "Bodyweight (Angle 4)", "2 שנ' ירידה", 60), ("Single-Arm Curl", "4×8/side", "18 kg", "2 שנ' ירידה", 60), ("Towel Hang", "3×60 secs", "Bodyweight", "סטטי", 60), ("L-sit Tuck (Bars)", "3×20 secs", "Bodyweight", "סטטי", 60), ("Arm Block - DB Curl", "2×10-15", "Ladder", "2 שנ' ירידה", 60)]
            return "Pull + Grip", "8-9", build_exercises(raw, get_pull_warmup())

    if 70 <= week <= 72: # TRANSITION
        if dow == 1:
            raw = [("DB Single-Leg RDL", "3×8/leg", "24 kg", "3 שנ' ירידה", 120), ("DB BSS (Goblet)", "3×8/leg", "24 kg", "2 שנ' ירידה", 90), ("DB Hip Thrust", "3×10", "24 kg on hips", "2 שנ' עצירה", 90), ("Single-Leg Calf Raise", "3×15/leg", "24 kg", "2 שנ' ירידה", 60), ("Suitcase Carry", "3×30m/side", "24 kg", "הליכה", 90)]
            return "Legs + Core", "7-8", build_exercises(raw, get_leg_warmup())
        elif dow == 3:
            raw = [("Wall Handstand", "3×30 secs", "Bodyweight", "סטטי", 90), ("Single-Arm Floor Press", "3×8/side", "24 kg", "2 שנ' ירידה", 120), ("Deficit Push-Up", "3×8", "Bodyweight", "2 שנ' ירידה", 90), ("Single-Arm Seated OHP", "3×8/side", "24 kg", "2 שנ' ירידה", 90), ("DB Lateral Raise", "3×15", "9 kg each", "2 שנ' ירידה", 60), ("DB OH Triceps Ext", "2×12", "24 kg total", "2 שנ' ירידה", 60), ("Arm Block - DB Lateral Raise", "2×12-20", "Ladder", "2 שנ' ירידה", 60), ("Arm Block - DB OH Triceps Ext", "2×10-15", "Ladder", "2 שנ' ירידה", 60)]
            return "Push + Skill", "7-8", build_exercises(raw, get_push_warmup(is_year2=True))
        elif dow == 5:
            raw = [("Pull-Up (Overhand)", "3×6", "Bodyweight", "2 שנ' ירידה", 120), ("Chin-Up", "3×5", "Bodyweight", "2 שנ' ירידה", 120), ("One-Arm DB Row", "3×10/side", "24 kg", "2 שנ' ירידה", 90), ("TRX Face Pull", "3×15", "Bodyweight (Angle 3)", "2 שנ' ירידה", 60), ("Single-Arm Curl", "3×12/side", "18 kg", "2 שנ' ירידה", 60), ("Towel Hang", "3×45 secs", "Bodyweight", "סטטי", 60), ("L-sit Tuck (Bars)", "3×15 secs", "Bodyweight", "סטטי", 60), ("Arm Block - DB Curl", "2×10-15", "Ladder", "2 שנ' ירידה", 60)]
            return "Pull + Grip", "7-8", build_exercises(raw, get_pull_warmup())

    # Fallback default
    return "Rest", "—", []

def build_exercises(raw_tuple_list, warmups):
    out = []
    for w in warmups:
        out.append(w)
    
    idx = 1
    for item in raw_tuple_list:
        name = item[0]
        sets = item[1]
        weight = item[2]
        tempo = item[3] if len(item) > 3 else "2 שנ' ירידה"
        rest = item[4] if len(item) > 4 else 90
        
        out.append(ex(f"A{idx}", name, sets, weight=weight, tempo=tempo, rest=rest))
        idx += 1
    return out

def generate_program():
    daily = []
    day_num = 0
    total_weeks = 78
    
    for week in range(1, total_weeks + 1):
        # DOW order: 1=Monday, 2=Tuesday, 3=Wednesday, 4=Thursday, 5=Friday, 6=Saturday, 0=Sunday
        for dow in [1, 2, 3, 4, 5, 6, 0]:
            day_num += 1
            date = START_DATE + timedelta(days=day_num - 1)
            day_type, rpe, exercises = get_day_workout(dow, week)
            
            daily.append({
                "dayNum": day_num,
                "week": f"Week {week}",
                "dayOfWeek": DAYS_ENG[dow],
                "date": date.strftime("%d/%m/%Y"),
                "dayType": day_type,
                "plannedRPE": rpe,
                "exercises": exercises
            })

    # Catalog of all exercises for exercises guide / DB
    all_exercise_names = set()
    for day in daily:
        for e in day["exercises"]:
            all_exercise_names.add(e["name"])

    exercises_guide = []
    for name in sorted(all_exercise_names):
        cat = "Legs"
        diff = "Intermediate"
        weight = "Dumbbells / Bodyweight"
        
        n_lower = name.lower()
        if "warmup" in n_lower or name in ["High Knees", "Arm Circles", "Wall Slides", "Scapular Push-up", "Scapular Pull-up", "Wrist Rocks"]:
            cat = "Warmup"
            diff = "Beginner"
            weight = "Bodyweight"
        elif "press" in n_lower or "push" in n_lower or "dip" in n_lower:
            cat = "Push"
            if "one-arm" in n_lower or "weighted" in n_lower: diff = "Advanced"
        elif "row" in n_lower or "pull" in n_lower or "chin" in n_lower:
            cat = "Pull"
            if "weighted" in n_lower: diff = "Advanced"
        elif "ohp" in n_lower or "raise" in n_lower or "handstand" in n_lower or "y-t-w" in n_lower:
            cat = "Shoulders"
        elif "curl" in n_lower or "triceps" in n_lower or "arm block" in n_lower:
            cat = "Arms"
        elif "rdl" in n_lower or "squat" in n_lower or "lunge" in n_lower or "calf" in n_lower:
            cat = "Legs"
        elif "glute" in n_lower or "hip thrust" in n_lower:
            cat = "Glutes"
        elif "bug" in n_lower or "hold" in n_lower or "hollow" in n_lower or "l-sit" in n_lower or "pallof" in n_lower:
            cat = "Core"
        elif "carry" in n_lower or "hang" in n_lower:
            cat = "Grip"
        elif "walking" in n_lower or "vo2" in n_lower:
            cat = "Cardio"
            diff = "Beginner"
            weight = "Bodyweight"

        exercises_guide.append({
            "name": name,
            "category": cat,
            "difficulty": diff,
            "weight": weight,
            "setsProgression": "FitUp Pro Ultimate v4.0 Schedule"
        })

    return {"daily": daily, "exercises": exercises_guide}

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

    img_dir = "images/exercises"
    if os.path.exists(img_dir):
        fallback = os.path.join(img_dir, "BODYWEIGHT SQUAT.png")
        for name in required:
            img = name.replace('/', '-').upper() + ".png"
            path = os.path.join(img_dir, img)
            if not os.path.exists(path) and os.path.exists(fallback):
                shutil.copy(fallback, path)

    print(f"Done — FitUp Pro Ultimate v4.0 generated! {len(program['daily'])} days, {len(program['exercises'])} exercise types.")
