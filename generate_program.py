#!/usr/bin/env python3
"""Generate FitUp Pro 52-week training program."""
import json
from datetime import datetime, timedelta

START_DATE = datetime(2026, 7, 5)  # Sunday

# Video URLs
VIDEOS = {
    "Band External Rotation": "https://www.youtube.com/watch?v=dLSytuFOCX8",
    "Incline Push-up": "https://www.youtube.com/watch?v=76TQU7iZlsI",
    "Scapular Pull-up": "https://youtu.be/pE8PJsWEV7k?si=ogf9wn9DXCRXB0HO",
    "Band Row": "https://www.youtube.com/watch?v=gOvJDjy06sc",
    "Banded OHP": "https://www.youtube.com/watch?v=otxypVv_0Es",
    "Hollow Body Hold": "https://www.youtube.com/watch?v=HAfUt2Cco74",
    "Pallof Press": "https://www.youtube.com/watch?v=_2xWmYNnFS8",
    "Band Curl": "https://www.youtube.com/watch?v=0hZboUNuogA",
    "Face Pull": "https://www.youtube.com/watch?v=ljgqer1ZpXg",
    "Squat איטי": "https://www.youtube.com/watch?v=7LpLZOdz68A",
    "Banded Glute Bridge": "https://www.youtube.com/watch?v=JCqhuq4bCio&t=1s",
    "Banded RDL": "https://www.youtube.com/watch?v=xZoWmGj_tEs",
    "Single-leg Calf Raise": "https://www.youtube.com/watch?v=ElcvJ0kjt6c",
    "Tibialis Raise": "https://www.youtube.com/watch?v=RHWRxiBe1iU",
    "Push-up רגיל": "https://www.youtube.com/watch?v=IODxDxX7oi4",
    "Band-assisted Pull-up": "https://www.youtube.com/watch?v=ZHllQTJf7eA",
    "Single-arm Band Row": "https://www.youtube.com/watch?v=vwf_-q-r1EA",
    "Split Squat": "https://www.youtube.com/watch?v=zCsZwLeXrCg",
    "Triceps Extension": "https://www.youtube.com/watch?v=8-q04odgg4M",
    "Offset Push-up": "https://www.youtube.com/watch?v=sHpfTeWjIDs",
    "Diamond Push-up": "https://www.youtube.com/watch?v=mH8WhysYsaU",
    "Chin-up": "https://www.youtube.com/watch?v=e1YSApl-QcM",
    "Bulgarian Split Squat": "https://www.youtube.com/watch?v=DeCnHqrN22U",
    "Banded Push-up": "https://www.youtube.com/watch?v=WkBjkMjGMOg",
    "Decline Push-up": "https://www.youtube.com/watch?v=SKPab2YC8CE",
    "Pull-up": "https://www.youtube.com/watch?v=eGo4IYlbE5g",
    "Pike Push-up": "https://www.youtube.com/watch?v=sposDXWEB0A",
    "Band Lateral Raise": "https://www.youtube.com/watch?v=yfNg5sFndbw",
    "Hanging Leg Raise": "https://www.youtube.com/watch?v=rbOJSK07AGA",
    "Copenhagen Plank": "https://www.youtube.com/watch?v=FKx0daB6UaE",
    "הליכה מהירה": "https://www.youtube.com/watch?v=iesCUs8CQEQ",
    "הליכה (Rucking/עליות)": "https://www.youtube.com/watch?v=iesCUs8CQEQ",
    "Bird-Dog": "https://www.youtube.com/watch?v=ZdAHe9_HeEw",
    "מתיחות מלאות": "https://www.youtube.com/watch?v=COO2S7lPBzA",
    "הליכה קלה (אופציונלי)": "https://www.youtube.com/watch?v=iesCUs8CQEQ",
}

def ex(slot, name, sets, weight=None):
    return {"slot": slot, "name": name, "sets": sets, "weight": weight, "videoUrl": VIDEOS.get(name)}

def get_phase(week):
    if week <= 12: return 1
    if week <= 24: return 2
    if week <= 33: return 3
    return 4

def is_deload(week):
    return week in [25, 33, 41, 49]

DAYS_HEB = ["ראשון","שני","שלישי","רביעי","חמישי","שישי","שבת"]

def upper_a(week):
    """Sunday - Upper A"""
    phase = get_phase(week)
    deload = is_deload(week)
    exercises = []
    # Warmup
    exercises.append(ex("W1","Band External Rotation","2×15 לכל יד","30kg"))

    if phase == 1:
        v_sets = "4×6-10" if week > 6 else "3×6-10"
        p_sets = "4×8-12" if week > 6 else "3×8-12"
        exercises.append(ex("A1","Incline Push-up",v_sets))
        exercises.append(ex("A2","Scapular Pull-up",p_sets))
        exercises.append(ex("B1","Band Row",p_sets,"30kg"))
        exercises.append(ex("B2","Banded OHP","3×8-10","30kg"))
        exercises.append(ex("C1","Hollow Body Hold","2×20-30 שניות"))
        exercises.append(ex("C2","Pallof Press","3×10-12","30kg"))
        exercises.append(ex("D1","Band Curl","2×12-15","30kg"))
        exercises.append(ex("D2","Face Pull","2×15","30kg"))
    elif phase == 2:
        v_sets = "4×8-12" if week > 18 else "3×8-12"
        exercises.append(ex("A1","Push-up רגיל",v_sets))
        exercises.append(ex("A2","Band-assisted Pull-up","3×5-8"))
        exercises.append(ex("B1","Single-arm Band Row","3×8-10 לכל יד","40kg"))
        exercises.append(ex("B2","Banded OHP","3-4×8","40kg"))
        exercises.append(ex("C1","Hollow Body Hold","3×30 שניות"))
        exercises.append(ex("C2","Pallof Press","3×10-12","40kg"))
        exercises.append(ex("D1","Band Curl","2×12-15","40kg"))
        exercises.append(ex("D2","Face Pull","2-3×15","30kg"))
    elif phase == 3:
        if week == 25:  # Deload
            exercises.append(ex("A1","Push-up רגיל","3×8"))
            exercises.append(ex("A2","Band-assisted Pull-up","3×5"))
            exercises.append(ex("B1","Single-arm Band Row","2×8-10 לכל יד","40kg"))
            exercises.append(ex("B2","Banded OHP","2×8","40kg"))
            exercises.append(ex("C1","Hollow Body Hold","2×20 שניות"))
            exercises.append(ex("C2","Pallof Press","2×10","30kg"))
            exercises.append(ex("D1","Band Curl","2×12","30kg"))
            exercises.append(ex("D2","Face Pull","2×12","30kg"))
        elif week == 33:  # Deload
            exercises.append(ex("A1","Push-up רגיל","3×8"))
            exercises.append(ex("A2","Band-assisted Pull-up","3×5"))
            exercises.append(ex("B1","Single-arm Band Row","3×8-10 לכל יד","40kg"))
            exercises.append(ex("B2","Banded OHP","3×8","40kg"))
            exercises.append(ex("C1","Hollow Body Hold","3×20 שניות"))
            exercises.append(ex("C2","Pallof Press","3×10","30kg"))
            exercises.append(ex("D1","Band Curl","2×12","30kg"))
            exercises.append(ex("D2","Face Pull","2×12","30kg"))
        else:  # 26-32
            if week % 2 == 0:  # even = Diamond
                exercises.append(ex("A1","Diamond Push-up","4×8-12"))
            else:  # odd = Offset
                exercises.append(ex("A1","Offset Push-up","3×8 לכל צד"))
            exercises.append(ex("A2","Chin-up","3-4×5-8"))
            exercises.append(ex("B1","Single-arm Band Row","4×8-10 לכל יד","40kg"))
            exercises.append(ex("B2","Banded OHP","3-4×8","50kg"))
            exercises.append(ex("C1","Hollow Body Hold","3×30-45 שניות"))
            exercises.append(ex("C2","Pallof Press","3-4×8-10","40kg"))
            exercises.append(ex("D1","Band Curl","2×12-15","40kg"))
            exercises.append(ex("D2","Face Pull","3×15","30kg"))
    else:  # phase 4
        if week == 41 or week == 49:  # Deload
            exercises.append(ex("A1","Banded Push-up","3×8","50kg"))
            exercises.append(ex("A2","Pull-up","3×5"))
            exercises.append(ex("B1","Single-arm Band Row","3×8 לכל יד","50kg"))
            exercises.append(ex("B2","Pike Push-up","3×6"))
            exercises.append(ex("C1","Hollow Body Hold","3×30 שניות"))
            exercises.append(ex("C2","Band Row","3×10","50kg"))
            exercises.append(ex("D1","Band Curl","2×12","40kg"))
            exercises.append(ex("D2","Band Lateral Raise","3×12","30kg"))
        else:
            rot = (week - 34) % 3
            if rot == 0:
                exercises.append(ex("A1","Banded Push-up","4×8-10","50kg"))
            elif rot == 1:
                exercises.append(ex("A1","Offset Push-up","3×8 לכל צד"))
            else:
                exercises.append(ex("A1","Decline Push-up","4×8-10"))
            exercises.append(ex("A2","Pull-up","4×5-8"))
            exercises.append(ex("B1","Single-arm Band Row","4×8-10 לכל יד","50kg"))
            exercises.append(ex("B2","Pike Push-up","3×6-10"))
            exercises.append(ex("C1","Hollow Body Hold","3×30-45 שניות"))
            exercises.append(ex("C2","Band Row","3×10-12","50kg"))  # Replaced Face Pull with Band Row
            exercises.append(ex("D1","Band Curl","2×12-15","40kg"))
            exercises.append(ex("D2","Band Lateral Raise","3×12-15","30kg"))
    return exercises

def lower_core(week):
    """Tuesday - Lower + Core"""
    phase = get_phase(week)
    exercises = []

    if phase == 1:
        s_sets = "4×8-10" if week > 6 else "3×8-10"
        exercises.append(ex("A1","Squat איטי",s_sets))
        exercises.append(ex("A2","Banded Glute Bridge","3×12-15","30kg"))
        exercises.append(ex("B1","Banded RDL","3×10-12","30kg"))
        exercises.append(ex("B2","Pallof Press","3×10-12","30kg"))
        exercises.append(ex("C1","Single-leg Calf Raise","2-3×12-15 לכל רגל"))
        exercises.append(ex("D1","Tibialis Raise","3×15"))
    elif phase == 2:
        s_sets = "4×8-10 לכל רגל" if week > 18 else "3×8-10 לכל רגל"
        exercises.append(ex("A1","Split Squat",s_sets))
        exercises.append(ex("A2","Banded Glute Bridge","3×12-15","40kg"))
        exercises.append(ex("B1","Banded RDL","3×10-12","40kg"))
        exercises.append(ex("B2","Pallof Press","3×10-12","40kg"))
        exercises.append(ex("C1","Single-leg Calf Raise","3-4×12-15 לכל רגל"))
        exercises.append(ex("D1","Tibialis Raise","3×15"))
    elif phase == 3:
        if week == 25:
            exercises.append(ex("A1","Squat איטי","3×8"))
            exercises.append(ex("A2","Banded Glute Bridge","2×12","30kg"))
            exercises.append(ex("B1","Banded RDL","2×10","30kg"))
            exercises.append(ex("B2","Pallof Press","2×10","30kg"))
            exercises.append(ex("C1","Single-leg Calf Raise","2×12 לכל רגל"))
            exercises.append(ex("D1","Tibialis Raise","2×15"))
        elif week == 33:
            exercises.append(ex("A1","Split Squat","3×8 לכל רגל"))
            exercises.append(ex("A2","Banded Glute Bridge","3×12","40kg"))
            exercises.append(ex("B1","Banded RDL","3×10","40kg"))
            exercises.append(ex("B2","Pallof Press","3×10","30kg"))
            exercises.append(ex("C1","Single-leg Calf Raise","3×12 לכל רגל"))
            exercises.append(ex("D1","Tibialis Raise","3×15"))
        else:
            exercises.append(ex("A1","Bulgarian Split Squat","3×8 לכל רגל"))
            exercises.append(ex("A2","Banded Glute Bridge","3-4×12-15","50kg"))
            exercises.append(ex("B1","Banded RDL","3×10-12","50kg"))
            exercises.append(ex("B2","Pallof Press","3-4×8-10","40kg"))
            exercises.append(ex("C1","Single-leg Calf Raise","4×12-15 לכל רגל"))
            exercises.append(ex("D1","Tibialis Raise","3×15"))
    else:
        if week == 41 or week == 49:
            exercises.append(ex("A1","Bulgarian Split Squat","3×8 לכל רגל"))
            exercises.append(ex("A2","Banded Glute Bridge","3×12","50kg"))
            exercises.append(ex("B1","Banded RDL","3×10","50kg"))
            exercises.append(ex("B2","Copenhagen Plank","3×20 שניות לכל צד"))
            exercises.append(ex("C1","Single-leg Calf Raise","3×12 לכל רגל"))
            exercises.append(ex("D1","Tibialis Raise","3×15"))
        else:
            exercises.append(ex("A1","Bulgarian Split Squat","4×8-10 לכל רגל")) # Increased sets/reps
            if week % 2 == 1:  # odd
                exercises.append(ex("A2","Banded Glute Bridge","3-4×12-15","50kg"))
                exercises.append(ex("B1","Banded RDL","3×10-12","50kg"))
            else:
                exercises.append(ex("A2","Banded RDL","3-4×10-12","50kg"))
                exercises.append(ex("B1","Banded Glute Bridge","3×12-15","50kg"))
            exercises.append(ex("B2","Copenhagen Plank","3×20-30 שניות לכל צד"))
            exercises.append(ex("C1","Single-leg Calf Raise","4×12-15 לכל רגל"))
            exercises.append(ex("D1","Tibialis Raise","3×15"))
    return exercises

def upper_b(week):
    """Thursday - Upper B"""
    phase = get_phase(week)
    exercises = []
    exercises.append(ex("W1","Band External Rotation","2×15 לכל יד","30kg"))

    if phase == 1:
        v_sets = "4×6-10" if week > 6 else "3×6-10"
        p_sets = "4×8-12" if week > 6 else "3×8-12"
        exercises.append(ex("A1","Incline Push-up",v_sets))
        exercises.append(ex("A2","Scapular Pull-up",p_sets))
        exercises.append(ex("B1","Band Row",p_sets,"30kg"))
        exercises.append(ex("B2","Banded OHP","3×8-10","30kg"))
        exercises.append(ex("C1","Hollow Body Hold","2×20-30 שניות"))
        exercises.append(ex("C2","Pallof Press","3×10-12","30kg"))
        exercises.append(ex("D1","Triceps Extension","2×12-15","30kg"))
        exercises.append(ex("D2","Face Pull","2×15","30kg"))
    elif phase == 2:
        v_sets = "4×8-12" if week > 18 else "3×8-12"
        exercises.append(ex("A1","Push-up רגיל",v_sets))
        exercises.append(ex("A2","Band-assisted Pull-up","3×5-8"))
        exercises.append(ex("B1","Single-arm Band Row","3×8-10 לכל יד","40kg"))
        exercises.append(ex("B2","Banded OHP","3-4×8","40kg"))
        exercises.append(ex("C1","Hollow Body Hold","3×30 שניות"))
        exercises.append(ex("C2","Pallof Press","3×10-12","40kg"))
        exercises.append(ex("D1","Triceps Extension","2×12-15","40kg"))
        exercises.append(ex("D2","Face Pull","2-3×15","30kg"))
    elif phase == 3:
        if week == 25:
            exercises.append(ex("A1","Push-up רגיל","3×8"))
            exercises.append(ex("A2","Band-assisted Pull-up","3×5"))
            exercises.append(ex("B1","Single-arm Band Row","2×8-10 לכל יד","40kg"))
            exercises.append(ex("B2","Banded OHP","2×8","40kg"))
            exercises.append(ex("C1","Hollow Body Hold","2×20 שניות"))
            exercises.append(ex("C2","Pallof Press","2×10","30kg"))
            exercises.append(ex("D1","Triceps Extension","2×12","30kg"))
            exercises.append(ex("D2","Face Pull","2×12","30kg"))
        elif week == 33:
            exercises.append(ex("A1","Push-up רגיל","3×8"))
            exercises.append(ex("A2","Band-assisted Pull-up","3×5"))
            exercises.append(ex("B1","Single-arm Band Row","3×8-10 לכל יד","40kg"))
            exercises.append(ex("B2","Banded OHP","3×8","40kg"))
            exercises.append(ex("C1","Hollow Body Hold","3×20 שניות"))
            exercises.append(ex("C2","Pallof Press","3×10","30kg"))
            exercises.append(ex("D1","Triceps Extension","2×12","30kg"))
            exercises.append(ex("D2","Face Pull","2×12","30kg"))
        else:
            if week % 2 == 0:
                exercises.append(ex("A1","Diamond Push-up","4×8-12"))
            else:
                exercises.append(ex("A1","Offset Push-up","3×8 לכל צד"))
            exercises.append(ex("A2","Chin-up","3-4×5-8"))
            exercises.append(ex("B1","Band Row","3×10-12","50kg"))
            exercises.append(ex("B2","Banded OHP","3×8-10","50kg"))
            exercises.append(ex("C1","Hanging Leg Raise","3×8-10"))
            exercises.append(ex("C2","Triceps Extension","2-3×12-15","40kg"))
            exercises.append(ex("D1","Band Lateral Raise","3×12-15","30kg"))
    else:
        if week == 41 or week == 49:
            exercises.append(ex("A1","Diamond Push-up","3×8"))
            exercises.append(ex("A2","Pull-up","3×5"))
            exercises.append(ex("B1","Banded OHP","3×8","50kg"))
            exercises.append(ex("B2","Band Row","3×10","50kg"))
            exercises.append(ex("C1","Hanging Leg Raise","3×8"))
            exercises.append(ex("C2","Triceps Extension","3×12","40kg"))
            exercises.append(ex("D1","Band Lateral Raise","3×12","30kg"))
        else:
            rot = (week - 34) % 3
            if rot == 0:
                exercises.append(ex("A1","Diamond Push-up","4×8-12"))
            elif rot == 1:
                exercises.append(ex("A1","Offset Push-up","3×8 לכל צד"))
            else:
                exercises.append(ex("A1","Banded Push-up","4×8-10","50kg"))
            exercises.append(ex("A2","Pull-up","4×5-8"))
            exercises.append(ex("B1","Banded OHP","3×8-10","50kg"))
            exercises.append(ex("B2","Band Row","3×10-12","50kg"))
            exercises.append(ex("C1","Hanging Leg Raise","3×8-12"))
            exercises.append(ex("C2","Triceps Extension","3×12-15","40kg"))
            exercises.append(ex("D1","Band Lateral Raise","3×12-15","30kg"))
            exercises.append(ex("D2","Face Pull","3×15","30kg")) # Added back Face Pull to Upper B to keep volume
    return exercises

def walking_day(week, is_wednesday=False):
    """Monday/Wednesday - Walking + Core + Calves"""
    phase = get_phase(week)
    exercises = []
    if phase <= 2:
        walk_dur = "25-30 דקות" if phase == 1 else "30-35 דקות"
        exercises.append(ex("A1","הליכה מהירה", walk_dur))
    else:
        walk_dur = "30-35 דקות" if phase == 3 else "35-40 דקות"
        exercises.append(ex("A1","הליכה (Rucking/עליות)", walk_dur))
        
    exercises.append(ex("A2","Bird-Dog","3×8-10 לכל צד"))
    exercises.append(ex("B1","Hollow Body Hold","3×30 שניות"))
    exercises.append(ex("B2","Single-leg Calf Raise","2×15 לכל רגל"))
    exercises.append(ex("C1","Tibialis Raise","3×15"))
    
    if phase >= 3 and not is_wednesday:
        exercises.append(ex("C2","Pallof Press","3×10-12","30kg")) # Added core progression
        
    if is_wednesday:
        exercises.append(ex("C2" if phase < 3 else "D1","מתיחות מלאות","10-15 דקות"))
    return exercises

def rest_friday():
    return [
        ex("A1","מתיחות מלאות","10 דקות"),
        ex("B1","הליכה קלה (אופציונלי)","15-20 דקות"),
    ]

def rest_saturday():
    return [
        {"slot":"A1","name":"שינה 7-8 שעות","sets":None,"weight":None,"videoUrl":None},
        {"slot":"A2","name":"חלבון 160-170 גרם","sets":None,"weight":None,"videoUrl":None},
        {"slot":"B1","name":"מים 2.5-3 ליטר","sets":None,"weight":None,"videoUrl":None},
    ]

# DAY TYPES per day-of-week index: Sun=Upper A, Mon=Walk, Tue=Lower, Wed=Walk, Thu=Upper B, Fri=Rest, Sat=Rest
def get_day_exercises(day_of_week_idx, week):
    if day_of_week_idx == 0:  # Sunday - Upper A
        return "כוח עליון A", "7-8", upper_a(week)
    elif day_of_week_idx == 1:  # Monday - Walking
        return "הליכה", "5-6", walking_day(week, False)
    elif day_of_week_idx == 2:  # Tuesday - Lower + Core
        return "כוח תחתון", "7-8", lower_core(week)
    elif day_of_week_idx == 3:  # Wednesday - Walking
        return "הליכה", "5-6", walking_day(week, True)
    elif day_of_week_idx == 4:  # Thursday - Upper B
        return "כוח עליון B", "7-8", upper_b(week)
    elif day_of_week_idx == 5:  # Friday - Rest
        return "מנוחה", "—", rest_friday()
    else:  # Saturday - Rest
        return "מנוחה", "—", rest_saturday()

def generate_program():
    daily = []
    day_num = 0

    for week in range(1, 53):
        for dow in range(7):
            day_num += 1
            date = START_DATE + timedelta(days=day_num - 1)
            day_type, rpe, exercises = get_day_exercises(dow, week)

            daily.append({
                "dayNum": day_num,
                "week": f"שבוע {week}",
                "dayOfWeek": DAYS_HEB[dow],
                "date": date.strftime("%d/%m/%Y"),
                "dayType": day_type,
                "plannedRPE": rpe,
                "exercises": exercises,
            })

    exercises_guide = [
        {"name":"Incline Push-up","category":"דחיפה","difficulty":"מתחיל","weight":"משקל גוף","videoUrl":VIDEOS["Incline Push-up"],"setsProgression":"שלב 1: 3-4×6-10"},
        {"name":"Push-up רגיל","category":"דחיפה","difficulty":"מתחיל+","weight":"משקל גוף","videoUrl":VIDEOS["Push-up רגיל"],"setsProgression":"שלב 2: 3-4×8-12"},
        {"name":"Offset Push-up","category":"דחיפה","difficulty":"בינוני","weight":"משקל גוף","videoUrl":VIDEOS["Offset Push-up"],"setsProgression":"שלב 3: 3×8 לכל צד"},
        {"name":"Diamond Push-up","category":"דחיפה","difficulty":"בינוני+","weight":"משקל גוף","videoUrl":VIDEOS["Diamond Push-up"],"setsProgression":"שלב 3: 4×8-12"},
        {"name":"Banded Push-up","category":"דחיפה","difficulty":"מתקדם","weight":"50kg","videoUrl":VIDEOS["Banded Push-up"],"setsProgression":"שלב 4: 4×8-10"},
        {"name":"Decline Push-up","category":"דחיפה","difficulty":"מתקדם","weight":"משקל גוף","videoUrl":VIDEOS["Decline Push-up"],"setsProgression":"שלב 4: 4×8-10"},
        {"name":"Scapular Pull-up","category":"משיכה","difficulty":"מתחיל","weight":"משקל גוף","videoUrl":VIDEOS["Scapular Pull-up"],"setsProgression":"שלב 1: 3-4×8-12"},
        {"name":"Band-assisted Pull-up","category":"משיכה","difficulty":"בינוני","weight":"משקל גוף","videoUrl":VIDEOS["Band-assisted Pull-up"],"setsProgression":"שלב 2: 3×5-8"},
        {"name":"Chin-up","category":"משיכה","difficulty":"בינוני+","weight":"משקל גוף","videoUrl":VIDEOS["Chin-up"],"setsProgression":"שלב 3: 3-4×5-8"},
        {"name":"Pull-up","category":"משיכה","difficulty":"מתקדם","weight":"משקל גוף","videoUrl":VIDEOS["Pull-up"],"setsProgression":"שלב 4: 4×5-8"},
        {"name":"Band Row","category":"משיכה","difficulty":"מתחיל","weight":"30-50kg","videoUrl":VIDEOS["Band Row"],"setsProgression":"שלב 1: 3-4×8-12"},
        {"name":"Single-arm Band Row","category":"משיכה","difficulty":"בינוני","weight":"40-50kg","videoUrl":VIDEOS["Single-arm Band Row"],"setsProgression":"שלב 2: 3-4×8-10 לכל יד"},
        {"name":"Face Pull","category":"כתפיים","difficulty":"מתחיל","weight":"30kg","videoUrl":VIDEOS["Face Pull"],"setsProgression":"2-3×15"},
        {"name":"Banded OHP","category":"כתפיים","difficulty":"מתחיל+","weight":"30-50kg","videoUrl":VIDEOS["Banded OHP"],"setsProgression":"שלב 1-3: 3-4×8-10"},
        {"name":"Pike Push-up","category":"כתפיים","difficulty":"מתקדם","weight":"משקל גוף","videoUrl":VIDEOS["Pike Push-up"],"setsProgression":"שלב 4: 3×6-10"},
        {"name":"Band Lateral Raise","category":"כתפיים","difficulty":"בינוני","weight":"30kg","videoUrl":VIDEOS["Band Lateral Raise"],"setsProgression":"שלב 3-4: 3×12-15"},
        {"name":"Band External Rotation","category":"שיקום","difficulty":"מתחיל","weight":"30kg","videoUrl":VIDEOS["Band External Rotation"],"setsProgression":"2×15 לכל יד"},
        {"name":"Squat איטי","category":"רגליים","difficulty":"מתחיל","weight":"משקל גוף","videoUrl":VIDEOS["Squat איטי"],"setsProgression":"שלב 1: 3-4×8-10"},
        {"name":"Split Squat","category":"רגליים","difficulty":"בינוני","weight":"משקל גוף","videoUrl":VIDEOS["Split Squat"],"setsProgression":"שלב 2: 3-4×8-10 לכל רגל"},
        {"name":"Bulgarian Split Squat","category":"רגליים","difficulty":"מתקדם","weight":"משקל גוף","videoUrl":VIDEOS["Bulgarian Split Squat"],"setsProgression":"שלב 3-4: 3-4×8-10 לכל רגל"},
        {"name":"Banded Glute Bridge","category":"ישבן","difficulty":"מתחיל","weight":"30-50kg","videoUrl":VIDEOS["Banded Glute Bridge"],"setsProgression":"שלב 1-4: 3-4×12-15"},
        {"name":"Banded RDL","category":"ישבן","difficulty":"מתחיל+","weight":"30-50kg","videoUrl":VIDEOS["Banded RDL"],"setsProgression":"שלב 1-4: 3×10-12"},
        {"name":"Hollow Body Hold","category":"ליבה","difficulty":"מתחיל","weight":"משקל גוף","videoUrl":VIDEOS["Hollow Body Hold"],"setsProgression":"שלב 1: 2×20-30 שניות → שלב 4: 3×30-45 שניות"},
        {"name":"Hanging Leg Raise","category":"ליבה","difficulty":"בינוני+","weight":"משקל גוף","videoUrl":VIDEOS["Hanging Leg Raise"],"setsProgression":"שלב 3-4: 3×8-12"},
        {"name":"Pallof Press","category":"ליבה","difficulty":"מתחיל","weight":"30-40kg","videoUrl":VIDEOS["Pallof Press"],"setsProgression":"שלב 1-4: 3×10-12"},
        {"name":"Copenhagen Plank","category":"ליבה","difficulty":"מתקדם","weight":"משקל גוף","videoUrl":VIDEOS["Copenhagen Plank"],"setsProgression":"שלב 4: 3×20-30 שניות לכל צד"},
        {"name":"Band Curl","category":"ידיים","difficulty":"מתחיל","weight":"30-40kg","videoUrl":VIDEOS["Band Curl"],"setsProgression":"2×12-15"},
        {"name":"Triceps Extension","category":"ידיים","difficulty":"מתחיל","weight":"30-40kg","videoUrl":VIDEOS["Triceps Extension"],"setsProgression":"2-3×12-15"},
        {"name":"Single-leg Calf Raise","category":"שוקיים","difficulty":"מתחיל","weight":"משקל גוף","videoUrl":VIDEOS["Single-leg Calf Raise"],"setsProgression":"2-4×12-15 לכל רגל"},
        {"name":"Tibialis Raise","category":"שוקיים","difficulty":"מתחיל","weight":"משקל גוף","videoUrl":VIDEOS["Tibialis Raise"],"setsProgression":"3×15"},
        {"name":"Bird-Dog","category":"ליבה","difficulty":"מתחיל","weight":"משקל גוף","videoUrl":VIDEOS["Bird-Dog"],"setsProgression":"3×8-10 לכל צד"},
        {"name":"הליכה מהירה","category":"קרדיו","difficulty":"מתחיל","weight":None,"videoUrl":VIDEOS["הליכה מהירה"],"setsProgression":"25-40 דקות"},
        {"name":"הליכה (Rucking/עליות)","category":"קרדיו","difficulty":"בינוני","weight":None,"videoUrl":VIDEOS["הליכה (Rucking/עליות)"],"setsProgression":"30-40 דקות"},
        {"name":"מתיחות מלאות","category":"גמישות","difficulty":"מתחיל","weight":None,"videoUrl":VIDEOS["מתיחות מלאות"],"setsProgression":"10-15 דקות"},
        {"name":"הליכה קלה (אופציונלי)","category":"קרדיו","difficulty":"מתחיל","weight":None,"videoUrl":VIDEOS["הליכה קלה (אופציונלי)"],"setsProgression":"15-20 דקות"},
    ]

    return {"daily": daily, "exercises": exercises_guide}

def to_training_data_json(program):
    """Convert to the flat training_data.json format."""
    rows = []
    slot_order = ["W1","A1","A2","B1","B2","C1","C2","D1","D2","E1","E2"]
    for day in program["daily"]:
        row = {
            "יום": f"יום {day['dayNum']}",
            "שבוע": day["week"],
            "יום בשבוע": day["dayOfWeek"],
            "תאריך": day["date"],
            "סוג יום": day["dayType"],
            "RPE מתוכנן": day["plannedRPE"],
        }
        ex_by_slot = {}
        for e in day["exercises"]:
            ex_by_slot[e["slot"]] = e

        for slot in slot_order:
            e = ex_by_slot.get(slot)
            row[f"{slot} - תרגיל"] = e["name"] if e else None
            row[f"{slot} - סטים×חזרות"] = e["sets"] if e else None
            row[f"{slot} - משקל/התנגדות"] = e.get("weight") if e else None
            row[f"{slot} - קישור"] = e.get("videoUrl") if e else None

        row["תוספות - תרגיל"] = None
        row["תוספות - סטים×חזרות"] = None
        row["תוספות - קישור"] = None
        row["בוצע?"] = None
        row["RPE בפועל"] = None
        row["משקל גוף"] = None
        row["הערות"] = None
        rows.append(row)
    return {"daily": rows}

if __name__ == "__main__":
    program = generate_program()

    # Write data.js
    js_content = "window.TRAINING_DATA = " + json.dumps(program, ensure_ascii=False) + ";\n"
    with open("js/data.js", "w", encoding="utf-8") as f:
        f.write(js_content)
    print(f"✅ js/data.js written ({len(program['daily'])} days)")

    # Write training_data.json
    td = to_training_data_json(program)
    with open("training_data.json", "w", encoding="utf-8") as f:
        json.dump(td, f, ensure_ascii=False, indent=2)
    print(f"✅ training_data.json written ({len(td['daily'])} days)")
