#!/usr/bin/env python3
"""Generate FitUp Pro v3.1 — 52-week training program."""
import json
from datetime import datetime, timedelta

START_DATE = datetime(2026, 7, 5)

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
    "Bird-Dog": "https://www.youtube.com/watch?v=ZdAHe9_HeEw",
    "מתיחות מלאות": "https://www.youtube.com/watch?v=COO2S7lPBzA",
    "הליכה קלה (אופציונלי)": "https://www.youtube.com/watch?v=iesCUs8CQEQ",
    "Step-ups": "https://www.youtube.com/shorts/R8W8DA4jqvI",
    "Lateral Lunges": "https://www.youtube.com/watch?v=vwK7vZNQwUI",
    "Knee Finger Push-up": "https://www.youtube.com/watch?v=_DHM9Zg_0iY",
    "Towel Grip Hang": "https://www.youtube.com/shorts/C5mHoOJ_Boc",
    "Superman": "https://www.youtube.com/shorts/KTWWh3GsyYw",
    "Dead Bug": "https://www.youtube.com/watch?v=I5xbsA71v1A",
    "Bench Dip": "https://www.youtube.com/shorts/KiGQugpY67o",
    "Band Pull-apart": "https://www.youtube.com/shorts/SuvO4TBwSu4",
    "Band Woodchop": "https://www.youtube.com/watch?v=Yp2DmHk3KnY",
    "Couch Stretch": "https://www.youtube.com/shorts/udfy75H_WBc",
    "Toe Yoga": "https://www.youtube.com/shorts/RblzFPLHhwU",
    "Reverse Lunges איטיים": "https://www.youtube.com/watch?v=jgeI_ZqAxWs",
    "Single-leg RDL": "https://www.youtube.com/shorts/U4sOY8Gyc-s",
    "Floor Hamstring Curl": "https://www.youtube.com/shorts/X3oyDT1iUzg",
    "Hollow Body Rock": "https://www.youtube.com/shorts/17QYGBGsDvw",
    "Side Plank": "https://www.youtube.com/watch?v=N_s9em1xTqU",
    "Negative Pull-up": "https://www.youtube.com/watch?v=S3gxEclxIYE",
    "Side-Lying External Rotation": "https://www.youtube.com/watch?v=W_VHLYBlQJc",
    "Scapular Pull-up + Hold": "https://youtu.be/pE8PJsWEV7k?si=ogf9wn9DXCRXB0HO",
    "Band-assisted Pull-up (Chin-up grip)": "https://www.youtube.com/watch?v=ZHllQTJf7eA",
    "Bench Dip (רגל אחת מורומה)": "https://www.youtube.com/shorts/pjAWoCAzUlg",
    "Bench Dip (רגליים מורמות על כיסא)": "https://www.youtube.com/shorts/Qc9yA_BFSCw",
    "Superman Hold": "https://www.youtube.com/shorts/eKB5rv5c7FQ",
}

def ex(slot, name, sets, weight=None):
    return {"slot": slot, "name": name, "sets": sets, "weight": weight, "videoUrl": VIDEOS.get(name)}

def get_phase(week):
    if week <= 12: return 1
    if week <= 24: return 2
    if week <= 33: return 3
    return 4

def is_deload(week):
    return week in [9, 17, 25, 33, 41, 49]

DAYS_HEB = ["ראשון","שני","שלישי","רביעי","חמישי","שישי","שבת"]

def upper_a(week):
    phase = get_phase(week)
    dl = is_deload(week)
    exercises = []
    # Warmup — phases 1-2: Knee Finger Push-up, phases 3-4: Towel Grip Hang
    if phase <= 2:
        exercises.append(ex("W0","Knee Finger Push-up","2×5-8" if phase==1 else "2×8-10"))
    else:
        exercises.append(ex("W0","Towel Grip Hang","2×20-30 שניות" if phase==3 else "2×30-45 שניות"))
    if phase <= 2:
        exercises.append(ex("W1","Band External Rotation","2×15 לכל יד","30kg"))
        exercises.append(ex("W2","Scapular Pull-up","2×10-15","משקל גוף"))
    else:
        exercises.append(ex("W1","Side-Lying External Rotation","2×15 לכל יד","ללא גומייה" if phase==3 else "30kg"))
        exercises.append(ex("W2","Scapular Pull-up" if phase==3 else "Scapular Pull-up + Hold","2×10-15" if phase==3 else "2-3×5","משקל גוף"))

    if phase == 1:
        vs = "4×6-10" if week > 6 and not dl else "3×6-10"
        ps = "4×5-8" if week > 6 and not dl else "3×5-8"
        rs = "4×8-12" if week > 6 and not dl else "3×8-12"
        if dl: vs, ps, rs = "3×6", "3×5", "3×8"
        exercises.append(ex("A1","Incline Push-up",vs))
        exercises.append(ex("A2","Band-assisted Pull-up",ps,"50kg"))
        exercises.append(ex("B1","Band Row",rs,"30kg"))
        exercises.append(ex("B2","Banded OHP","3×8-10","30kg"))
        exercises.append(ex("C1","Hollow Body Hold","2×20-30 שניות"))
        exercises.append(ex("C2","Pallof Press","3×10-12","30kg"))
        exercises.append(ex("D1","Band Curl","2×12-15","30kg"))
        exercises.append(ex("D2","Face Pull","2×15","30kg"))
    elif phase == 2:
        vs = "4×8-12" if week > 18 and not dl else "3×8-12"
        if dl: vs = "2×8"
        exercises.append(ex("A1","Push-up רגיל",vs))
        exercises.append(ex("A2","Band-assisted Pull-up","3×5-8" if not dl else "2×5","40kg"))
        exercises.append(ex("B1","Band Row","4×8-12" if week > 18 and not dl else "3×8-12","40kg"))
        exercises.append(ex("B2","Banded OHP","3-4×8" if not dl else "2×8","40kg"))
        exercises.append(ex("B3","Pike Push-up","2×5-8"))
        exercises.append(ex("C1","Hollow Body Hold","3×30 שניות" if not dl else "2×20 שניות"))
        exercises.append(ex("C2","Pallof Press","3×10-12" if not dl else "2×10","40kg"))
        exercises.append(ex("D1","Band Curl","2×12-15","40kg"))
        exercises.append(ex("D2","Face Pull","2-3×15","30kg"))
    elif phase == 3:
        if dl:
            exercises.append(ex("A1","Push-up רגיל","3×8"))
            exercises.append(ex("A2","Band-assisted Pull-up","3×5","30kg"))
            exercises.append(ex("B1","Single-arm Band Row","3×8-10 לכל יד","30kg"))
            exercises.append(ex("B2","Banded OHP","3×8","50kg"))
            exercises.append(ex("B3","Pike Push-up","2×6"))
            exercises.append(ex("C1","Hanging Leg Raise","2×8"))
            exercises.append(ex("C2","Side Plank","2×30 שניות לכל צד"))
            exercises.append(ex("D1","Band Curl","2×12","40kg"))
            exercises.append(ex("D2","Face Pull","2×12","30kg"))
        else:
            if week % 2 == 1:
                exercises.append(ex("A1","Offset Push-up","3×8 לכל צד"))
            else:
                exercises.append(ex("A1","Diamond Push-up","4×8-12"))
            exercises.append(ex("A2","Band-assisted Pull-up","3×5-8","30kg"))
            exercises.append(ex("B1","Single-arm Band Row","3×8-10 לכל יד","30kg"))
            exercises.append(ex("B2","Banded OHP","3-4×8","50kg"))
            exercises.append(ex("B3","Pike Push-up","3×6-10"))
            exercises.append(ex("C1","Hanging Leg Raise","3×8-12"))
            exercises.append(ex("C2","Side Plank","3×30-45 שניות לכל צד"))
            exercises.append(ex("C3","Band Woodchop","2×10 לכל צד","30kg"))
            exercises.append(ex("D1","Band Curl","2×12-15","40kg"))
            exercises.append(ex("D2","Face Pull","2-3×15","30kg"))
    else:  # phase 4
        if dl:
            exercises.append(ex("A1","Banded Push-up","3×8","30kg"))
            exercises.append(ex("A2","Pull-up","3×2","משקל גוף"))
            exercises.append(ex("B1","Single-arm Band Row","3×8 לכל יד","40kg"))
            exercises.append(ex("B2","Pike Push-up","2×6"))
            exercises.append(ex("C1","Hanging Leg Raise","2×8"))
            exercises.append(ex("C2","Copenhagen Plank","2×20 שניות לכל צד"))
            exercises.append(ex("D1","Band Curl","2×12","40kg"))
            exercises.append(ex("D2","Face Pull","2×15","30kg"))
        else:
            rot = (week - 34) % 3
            if rot == 0:
                exercises.append(ex("A1","Banded Push-up","4×8-10","30kg"))
            elif rot == 1:
                exercises.append(ex("A1","Offset Push-up","4×8 לכל צד"))
            else:
                exercises.append(ex("A1","Decline Push-up","4×8-10"))
            if week <= 40: pr = "4×2"
            elif week <= 44: pr = "4×3-4"
            elif week <= 48: pr = "4×4-5"
            else: pr = "4×5-6"
            exercises.append(ex("A2","Pull-up",pr,"משקל גוף"))
            exercises.append(ex("B1","Single-arm Band Row","4×8-10 לכל יד","40kg"))
            exercises.append(ex("B2","Pike Push-up","3×6-10"))
            exercises.append(ex("C1","Hanging Leg Raise","3×8-12"))
            exercises.append(ex("C2","Copenhagen Plank","3×20-30 שניות לכל צד"))
            exercises.append(ex("C3","Band Woodchop","2×10 לכל צד","30kg"))
            if week % 2 == 1:
                exercises.append(ex("D1","Band Curl","2×12-15","40kg"))
            else:
                exercises.append(ex("D1","Band Lateral Raise","3×12-15","30kg"))
            exercises.append(ex("D2","Face Pull","2-3×15","30kg"))
    return exercises


def upper_b(week):
    phase = get_phase(week)
    dl = is_deload(week)
    exercises = []
    if phase <= 2:
        exercises.append(ex("W0","Knee Finger Push-up","2×5-8" if phase==1 else "2×8-10"))
    else:
        exercises.append(ex("W0","Towel Grip Hang","2×20-30 שניות" if phase==3 else "2×30-45 שניות"))
    if phase <= 2:
        exercises.append(ex("W1","Band External Rotation","2×15 לכל יד","30kg"))
        exercises.append(ex("W2","Scapular Pull-up","2×10-15","משקל גוף"))
    else:
        exercises.append(ex("W1","Side-Lying External Rotation","2×15 לכל יד","ללא גומייה" if phase==3 else "30kg"))
        exercises.append(ex("W2","Scapular Pull-up" if phase==3 else "Scapular Pull-up + Hold","2×10-15" if phase==3 else "2-3×5","משקל גוף"))

    if phase == 1:
        vs = "4×6-10" if week > 6 and not dl else "3×6-10"
        ps = "4×5-8" if week > 6 and not dl else "3×5-8"
        if dl: vs, ps = "3×6", "3×5"
        exercises.append(ex("A1","Incline Push-up",vs))
        exercises.append(ex("A2","Band-assisted Pull-up (Chin-up grip)",ps,"50kg"))
        exercises.append(ex("B1","Band Pull-apart","3×12-15" if not dl else "2×12","30kg"))
        exercises.append(ex("B2","Banded OHP","3×8-10","30kg"))
        exercises.append(ex("C1","Hollow Body Hold","2×20-30 שניות"))
        exercises.append(ex("C2","Pallof Press","3×10-12","30kg"))
        exercises.append(ex("D1","Bench Dip","3×8-12" if not dl else "2×8"))
        exercises.append(ex("D2","Face Pull","2×15","30kg"))
    elif phase == 2:
        vs = "4×8-12" if week > 18 and not dl else "3×8-12"
        if dl: vs = "2×8"
        exercises.append(ex("A1","Push-up רגיל",vs))
        exercises.append(ex("A2","Band-assisted Pull-up (Chin-up grip)","3×5-8" if not dl else "2×5","40kg"))
        exercises.append(ex("B1","Band Pull-apart","3×12-15" if not dl else "2×12","40kg"))
        exercises.append(ex("B2","Banded OHP","3-4×8" if not dl else "2×8","40kg"))
        exercises.append(ex("B3","Pike Push-up","2×5-8"))
        exercises.append(ex("C1","Hollow Body Hold","3×30 שניות" if not dl else "2×20 שניות"))
        exercises.append(ex("C2","Pallof Press","3×10-12" if not dl else "2×10","40kg"))
        exercises.append(ex("D1","Bench Dip","3×10-15" if not dl else "2×8"))
        exercises.append(ex("D2","Face Pull","2-3×15","30kg"))
    elif phase == 3:
        if dl:
            exercises.append(ex("A1","Push-up רגיל","3×8"))
            exercises.append(ex("A2","Band-assisted Pull-up (Chin-up grip)","3×5","30kg"))
            exercises.append(ex("B1","Single-arm Band Row","3×8-10 לכל יד","30kg"))
            exercises.append(ex("B2","Banded OHP","3×8","50kg"))
            exercises.append(ex("B3","Pike Push-up","2×6"))
            exercises.append(ex("C1","Hanging Leg Raise","2×8"))
            exercises.append(ex("C2","Side Plank","2×30 שניות לכל צד"))
            exercises.append(ex("D1","Bench Dip (רגל אחת מורומה)","2×8"))
            exercises.append(ex("D2","Face Pull","2×12","30kg"))
        else:
            if week % 2 == 1:
                exercises.append(ex("A1","Diamond Push-up","4×8-12"))
            else:
                exercises.append(ex("A1","Offset Push-up","3×8 לכל צד"))
            exercises.append(ex("A2","Band-assisted Pull-up (Chin-up grip)","3×5-8","30kg"))
            exercises.append(ex("B1","Single-arm Band Row","3×8-10 לכל יד","30kg"))
            exercises.append(ex("B2","Banded OHP","3-4×8","50kg"))
            exercises.append(ex("B3","Pike Push-up","3×6-10"))
            exercises.append(ex("C1","Hanging Leg Raise","3×8-12"))
            exercises.append(ex("C2","Side Plank","3×30-45 שניות לכל צד"))
            exercises.append(ex("D1","Bench Dip (רגל אחת מורומה)","3×8-12"))
            exercises.append(ex("D2","Face Pull","2-3×15","30kg"))
    else:  # phase 4
        if dl:
            exercises.append(ex("A1","Diamond Push-up","3×8"))
            exercises.append(ex("A2","Pull-up","3×2","משקל גוף"))
            exercises.append(ex("B1","Single-arm Band Row","3×8 לכל יד","40kg"))
            exercises.append(ex("B2","Pike Push-up","2×6"))
            exercises.append(ex("C1","Hanging Leg Raise","2×8"))
            exercises.append(ex("C2","Copenhagen Plank","2×20 שניות לכל צד"))
            exercises.append(ex("D1","Bench Dip (רגליים מורמות על כיסא)","2×8"))
            exercises.append(ex("D2","Face Pull","2×15","30kg"))
        else:
            rot = (week - 34) % 3
            if rot == 0:
                exercises.append(ex("A1","Diamond Push-up","4×8-12"))
            elif rot == 1:
                exercises.append(ex("A1","Offset Push-up","4×8 לכל צד"))
            else:
                exercises.append(ex("A1","Banded Push-up","4×8-10","30kg"))
            if week <= 40: pr = "4×2"
            elif week <= 44: pr = "4×3-4"
            elif week <= 48: pr = "4×4-5"
            else: pr = "4×5-6"
            exercises.append(ex("A2","Pull-up",pr,"משקל גוף"))
            exercises.append(ex("B1","Single-arm Band Row","4×8-10 לכל יד","40kg"))
            exercises.append(ex("B2","Pike Push-up","3×6-10"))
            exercises.append(ex("C1","Hanging Leg Raise","3×8-12"))
            exercises.append(ex("C2","Copenhagen Plank","3×20-30 שניות לכל צד"))
            exercises.append(ex("D1","Bench Dip (רגליים מורמות על כיסא)","3×8-12"))
            exercises.append(ex("D2","Face Pull","2-3×15","30kg"))
    return exercises

def lower_core(week):
    phase = get_phase(week)
    dl = is_deload(week)
    exercises = []
    exercises.append(ex("W0","Toe Yoga","1×30 שניות לכל רגל"))

    if phase == 1:
        if week % 2 == 1:  # odd weeks
            s = "4×8-10" if week > 6 and not dl else "3×8-10"
            if dl: s = "3×8"
            exercises.append(ex("A1","Squat איטי",s))
        else:
            s = "4×8-10 לכל רגל" if week > 6 and not dl else "3×8-10 לכל רגל"
            if dl: s = "3×8 לכל רגל"
            exercises.append(ex("A1","Step-ups",s))
        exercises.append(ex("A2","Banded Glute Bridge","3×12-15" if not dl else "2×12","30kg"))
        exercises.append(ex("B1","Banded RDL","3×10-12" if not dl else "2×10","30kg"))
        exercises.append(ex("B2","Superman","2×10-12"))
        exercises.append(ex("C1","Pallof Press","3×10-12" if not dl else "2×10","30kg"))
        exercises.append(ex("C2","Single-leg Calf Raise","2-3×12-15 לכל רגל"))
        exercises.append(ex("D1","Tibialis Raise","3×15"))
        exercises.append(ex("D2","Couch Stretch","2×45 שניות לכל רגל"))
    elif phase == 2:
        exercises.append(ex("A1","Split Squat","4×8-10 לכל רגל" if week > 18 and not dl else "3×8-10 לכל רגל"))
        exercises.append(ex("A2","Step-ups","3×8-10 לכל רגל"))
        exercises.append(ex("B1","Banded Glute Bridge","3×12-15" if not dl else "2×12","40kg"))
        exercises.append(ex("B2","Banded RDL","3×10-12" if not dl else "2×10","40kg"))
        exercises.append(ex("C1","Superman","2×12-15"))
        exercises.append(ex("C2","Pallof Press","3×10-12" if not dl else "2×10","40kg"))
        exercises.append(ex("D1","Single-leg Calf Raise","3-4×12-15 לכל רגל"))
        exercises.append(ex("D2","Tibialis Raise","3×15"))
        exercises.append(ex("E1","Couch Stretch","2×45 שניות לכל רגל"))
    elif phase == 3:
        if dl:
            exercises.append(ex("A1","Bulgarian Split Squat","3×8 לכל רגל"))
            exercises.append(ex("A2","Banded Glute Bridge","3×12","50kg"))
            exercises.append(ex("B1","Banded RDL","3×10","50kg"))
            exercises.append(ex("B2","Superman","2×12"))
            exercises.append(ex("C1","Side Plank","2×30 שניות לכל צד"))
            exercises.append(ex("C2","Single-leg Calf Raise","3×12 לכל רגל"))
            exercises.append(ex("D1","Tibialis Raise","3×15"))
            exercises.append(ex("D2","Couch Stretch","2×60 שניות לכל רגל"))
        else:
            exercises.append(ex("A1","Bulgarian Split Squat","3×8-10 לכל רגל"))
            exercises.append(ex("A2","Lateral Lunges","3×8-10 לכל צד"))
            exercises.append(ex("B1","Banded Glute Bridge","3×12-15","50kg"))
            exercises.append(ex("B2","Banded RDL","3×10-12","50kg"))
            exercises.append(ex("C1","Superman","3×12-15"))
            exercises.append(ex("C2","Side Plank","3×30-45 שניות לכל צד"))
            exercises.append(ex("D1","Single-leg Calf Raise","3-4×12-15 לכל רגל"))
            exercises.append(ex("D2","Tibialis Raise","3×15"))
            exercises.append(ex("E1","Couch Stretch","2×60 שניות לכל רגל"))
    else:  # phase 4
        if dl:
            exercises.append(ex("A1","Bulgarian Split Squat","3×8 לכל רגל"))
            exercises.append(ex("A2","Banded Glute Bridge","3×12","50kg"))
            exercises.append(ex("B1","Single-leg RDL","2×8 לכל רגל"))
            exercises.append(ex("B2","Copenhagen Plank","2×20 שניות לכל צד"))
            exercises.append(ex("C1","Single-leg Calf Raise","3×12 לכל רגל"))
            exercises.append(ex("D1","Tibialis Raise","3×15"))
            exercises.append(ex("D2","Couch Stretch","2×60 שניות לכל רגל"))
        else:
            bss_w = "30kg" if week >= 42 else None
            exercises.append(ex("A1","Bulgarian Split Squat","4×8-10 לכל רגל",bss_w or "משקל גוף"))
            exercises.append(ex("A2","Lateral Lunges","3×8-10 לכל צד"))
            exercises.append(ex("B1","Step-ups","3×8-10 לכל רגל"))
            exercises.append(ex("B2","Banded Glute Bridge","3×12-15","50kg"))
            exercises.append(ex("C1","Single-leg RDL","3×8-10 לכל רגל"))
            exercises.append(ex("C2","Floor Hamstring Curl","2×6-8"))
            exercises.append(ex("D1","Superman Hold","3×20-30 שניות"))
            exercises.append(ex("D2","Copenhagen Plank","3×20-30 שניות לכל צד"))
            exercises.append(ex("E1","Single-leg Calf Raise","4×12-15 לכל רגל"))
            exercises.append(ex("E2","Tibialis Raise","3×15"))
            exercises.append(ex("F1","Couch Stretch","2×60 שניות לכל רגל"))
    return exercises


def walking_day(week, is_monday=False):
    phase = get_phase(week)
    exercises = []
    if phase == 1: wd = "25-30 דקות"
    elif phase == 2: wd = "30-35 דקות"
    elif phase == 3: wd = "35-40 דקות"
    else: wd = "40-45 דקות"
    exercises.append(ex("A1","הליכה מהירה",wd))
    exercises.append(ex("A2","Reverse Lunges איטיים","2×8-10 לכל רגל"))
    if phase >= 3:
        exercises.append(ex("A3","Floor Hamstring Curl","2×6-8"))
    exercises.append(ex("B1","Bird-Dog","3×8-10 לכל צד"))
    exercises.append(ex("B2","Dead Bug","3×8-10 לכל צד" if phase <= 1 else "3×10-12 לכל צד"))
    if phase < 4:
        exercises.append(ex("C1","Hollow Body Hold","3×30 שניות"))
    else:
        if week <= 37: hr = "3×30 שניות"
        elif week <= 44: hr = "3×35 שניות"
        else: hr = "3×40-45 שניות"
        exercises.append(ex("C1","Hollow Body Rock",hr))
    exercises.append(ex("C2","Single-leg Calf Raise","2×15 לכל רגל"))
    exercises.append(ex("D1","Tibialis Raise","3×15"))
    exercises.append(ex("D2","Banded Glute Bridge","2×12-15","30kg"))
    if is_monday:
        exercises.append(ex("E1","Couch Stretch","2×45 שניות לכל רגל" if phase <= 2 else "2×60 שניות לכל רגל"))
        exercises.append(ex("E2","מתיחות מלאות","10-15 דקות"))
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

# Day mapping: Wed=upper A, Thu=walk, Fri=rest, Sat=rest, Sun=lower, Mon=walk(monday), Tue=upper B
def get_day_exercises(day_of_week_idx, week):
    # 0=Sun,1=Mon,2=Tue,3=Wed,4=Thu,5=Fri,6=Sat (per DAYS_HEB)
    # Schedule: Wed(3)=Upper A, Thu(4)=Walk, Fri(5)=Rest, Sat(6)=Rest, Sun(0)=Lower, Mon(1)=Walk+lower light, Tue(2)=Upper B
    if day_of_week_idx == 3: return "כוח עליון A", "7-8", upper_a(week)
    elif day_of_week_idx == 4: return "הליכה", "5-6", walking_day(week, False)
    elif day_of_week_idx == 5: return "מנוחה", "—", rest_friday()
    elif day_of_week_idx == 6: return "מנוחה", "—", rest_saturday()
    elif day_of_week_idx == 0: return "כוח תחתון", "7-8", lower_core(week)
    elif day_of_week_idx == 1: return "הליכה", "5-6", walking_day(week, True)
    elif day_of_week_idx == 2: return "כוח עליון B", "7-8", upper_b(week)
    return "מנוחה", "—", []

def generate_program():
    daily = []
    day_num = 0
    for week in range(1, 53):
        for dow in range(7):
            day_num += 1
            date = START_DATE + timedelta(days=day_num - 1)
            day_type, rpe, exercises = get_day_exercises(dow, week)
            daily.append({
                "dayNum": day_num, "week": f"שבוע {week}", "dayOfWeek": DAYS_HEB[dow],
                "date": date.strftime("%d/%m/%Y"), "dayType": day_type,
                "plannedRPE": rpe, "exercises": exercises,
            })

    exercises_guide = [
        {"name":"Knee Finger Push-up","category":"דחיפה","difficulty":"מתחיל","weight":"משקל גוף","videoUrl":VIDEOS["Knee Finger Push-up"],"setsProgression":"שלב 1-2: 2×5-10"},
        {"name":"Incline Push-up","category":"דחיפה","difficulty":"מתחיל","weight":"משקל גוף","videoUrl":VIDEOS["Incline Push-up"],"setsProgression":"שלב 1: 3-4×6-10"},
        {"name":"Push-up רגיל","category":"דחיפה","difficulty":"מתחיל+","weight":"משקל גוף","videoUrl":VIDEOS["Push-up רגיל"],"setsProgression":"שלב 2: 3-4×8-12"},
        {"name":"Offset Push-up","category":"דחיפה","difficulty":"בינוני","weight":"משקל גוף","videoUrl":VIDEOS["Offset Push-up"],"setsProgression":"שלב 3-4: 3-4×8 לכל צד"},
        {"name":"Diamond Push-up","category":"דחיפה","difficulty":"בינוני+","weight":"משקל גוף","videoUrl":VIDEOS["Diamond Push-up"],"setsProgression":"שלב 3-4: 4×8-12"},
        {"name":"Banded Push-up","category":"דחיפה","difficulty":"מתקדם","weight":"30kg","videoUrl":VIDEOS["Banded Push-up"],"setsProgression":"שלב 4: 4×8-10"},
        {"name":"Decline Push-up","category":"דחיפה","difficulty":"מתקדם","weight":"משקל גוף","videoUrl":VIDEOS["Decline Push-up"],"setsProgression":"שלב 4: 4×8-10"},
        {"name":"Pike Push-up","category":"כתפיים","difficulty":"בינוני","weight":"משקל גוף","videoUrl":VIDEOS["Pike Push-up"],"setsProgression":"שלב 2: 2×5-8 → שלב 4: 3×6-10"},
        {"name":"Bench Dip","category":"דחיפה","difficulty":"מתחיל+","weight":"משקל גוף","videoUrl":VIDEOS["Bench Dip"],"setsProgression":"שלב 1: 3×8-12 → שלב 4: רגליים מורמות"},
        {"name":"Bench Dip (רגל אחת מורומה)","category":"דחיפה","difficulty":"בינוני","weight":"משקל גוף","videoUrl":VIDEOS["Bench Dip (רגל אחת מורומה)"],"setsProgression":"שלב 3: 3×8-12"},
        {"name":"Bench Dip (רגליים מורמות על כיסא)","category":"דחיפה","difficulty":"מתקדם","weight":"משקל גוף","videoUrl":VIDEOS["Bench Dip (רגליים מורמות על כיסא)"],"setsProgression":"שלב 4: 3×8-12"},
        {"name":"Scapular Pull-up","category":"משיכה","difficulty":"מתחיל","weight":"משקל גוף","videoUrl":VIDEOS["Scapular Pull-up"],"setsProgression":"חימום: 2×10-15"},
        {"name":"Scapular Pull-up + Hold","category":"משיכה","difficulty":"בינוני","weight":"משקל גוף","videoUrl":VIDEOS["Scapular Pull-up + Hold"],"setsProgression":"שלב 4: 2-3×5 (3 שניות Hold)"},
        {"name":"Band-assisted Pull-up","category":"משיכה","difficulty":"בינוני","weight":"30-50kg","videoUrl":VIDEOS["Band-assisted Pull-up"],"setsProgression":"שלב 1-3: 3-4×5-8"},
        {"name":"Band-assisted Pull-up (Chin-up grip)","category":"משיכה","difficulty":"בינוני","weight":"30-50kg","videoUrl":VIDEOS["Band-assisted Pull-up (Chin-up grip)"],"setsProgression":"שלב 1-3: 3-4×5-8"},
        {"name":"Pull-up","category":"משיכה","difficulty":"מתקדם","weight":"משקל גוף","videoUrl":VIDEOS["Pull-up"],"setsProgression":"שלב 4: 4×2-6"},
        {"name":"Negative Pull-up","category":"משיכה","difficulty":"בינוני+","weight":"משקל גוף","videoUrl":VIDEOS["Negative Pull-up"],"setsProgression":"שלב 3 (שבועות 30-32): 2×3-5"},
        {"name":"Towel Grip Hang","category":"אחיזה","difficulty":"בינוני","weight":"משקל גוף","videoUrl":VIDEOS["Towel Grip Hang"],"setsProgression":"שלב 3: 2×20-30 שניות → שלב 4: 2×30-45 שניות"},
        {"name":"Band Row","category":"משיכה","difficulty":"מתחיל","weight":"30-40kg","videoUrl":VIDEOS["Band Row"],"setsProgression":"שלב 1-2: 3-4×8-12"},
        {"name":"Band Pull-apart","category":"משיכה","difficulty":"מתחיל+","weight":"30-40kg","videoUrl":VIDEOS["Band Pull-apart"],"setsProgression":"שלב 1-2: 3×12-15 (יום B)"},
        {"name":"Single-arm Band Row","category":"משיכה","difficulty":"בינוני","weight":"30-40kg","videoUrl":VIDEOS["Single-arm Band Row"],"setsProgression":"שלב 3-4: 3-4×8-10 לכל יד"},
        {"name":"Face Pull","category":"כתפיים","difficulty":"מתחיל","weight":"30kg","videoUrl":VIDEOS["Face Pull"],"setsProgression":"2-3×15"},
        {"name":"Banded OHP","category":"כתפיים","difficulty":"מתחיל+","weight":"30-50kg","videoUrl":VIDEOS["Banded OHP"],"setsProgression":"שלב 1-4: 3-4×8-10"},
        {"name":"Band Lateral Raise","category":"כתפיים","difficulty":"בינוני","weight":"30kg","videoUrl":VIDEOS["Band Lateral Raise"],"setsProgression":"שלב 4: 3×12-15"},
        {"name":"Band External Rotation","category":"שיקום","difficulty":"מתחיל","weight":"30kg","videoUrl":VIDEOS["Band External Rotation"],"setsProgression":"2×15 לכל יד"},
        {"name":"Side-Lying External Rotation","category":"שיקום","difficulty":"מתחיל","weight":"ללא/30kg","videoUrl":VIDEOS["Side-Lying External Rotation"],"setsProgression":"שלב 3-4: 2×15 לכל יד"},
        {"name":"Band Woodchop","category":"ליבה","difficulty":"בינוני","weight":"30kg","videoUrl":VIDEOS["Band Woodchop"],"setsProgression":"שלב 3-4: 2×10 לכל צד"},
        {"name":"Squat איטי","category":"רגליים","difficulty":"מתחיל","weight":"משקל גוף","videoUrl":VIDEOS["Squat איטי"],"setsProgression":"שלב 1: 3-4×8-10"},
        {"name":"Step-ups","category":"רגליים","difficulty":"מתחיל+","weight":"משקל גוף","videoUrl":VIDEOS["Step-ups"],"setsProgression":"שלב 1-4: 3×8-10 לכל רגל"},
        {"name":"Split Squat","category":"רגליים","difficulty":"בינוני","weight":"משקל גוף","videoUrl":VIDEOS["Split Squat"],"setsProgression":"שלב 2: 3-4×8-10 לכל רגל"},
        {"name":"Lateral Lunges","category":"רגליים","difficulty":"בינוני","weight":"משקל גוף","videoUrl":VIDEOS["Lateral Lunges"],"setsProgression":"שלב 3-4: 3×8-10 לכל צד"},
        {"name":"Bulgarian Split Squat","category":"רגליים","difficulty":"מתקדם","weight":"משקל גוף","videoUrl":VIDEOS["Bulgarian Split Squat"],"setsProgression":"שלב 3-4: 3-4×8-10 לכל רגל"},
        {"name":"Reverse Lunges איטיים","category":"רגליים","difficulty":"מתחיל","weight":"משקל גוף","videoUrl":VIDEOS["Reverse Lunges איטיים"],"setsProgression":"כל השלבים: 2×8-10 לכל רגל"},
        {"name":"Banded Glute Bridge","category":"ישבן","difficulty":"מתחיל","weight":"30-50kg","videoUrl":VIDEOS["Banded Glute Bridge"],"setsProgression":"שלב 1-4: 3×12-15"},
        {"name":"Banded RDL","category":"ישבן","difficulty":"מתחיל+","weight":"30-50kg","videoUrl":VIDEOS["Banded RDL"],"setsProgression":"שלב 1-3: 3×10-12"},
        {"name":"Single-leg RDL","category":"ישבן","difficulty":"מתקדם","weight":"משקל גוף","videoUrl":VIDEOS["Single-leg RDL"],"setsProgression":"שלב 4: 3×8-10 לכל רגל"},
        {"name":"Floor Hamstring Curl","category":"ישבן","difficulty":"בינוני","weight":"משקל גוף","videoUrl":VIDEOS["Floor Hamstring Curl"],"setsProgression":"שלב 3-4: 2×6-8"},
        {"name":"Superman","category":"גב","difficulty":"מתחיל","weight":"משקל גוף","videoUrl":VIDEOS["Superman"],"setsProgression":"שלב 1-3: 2-3×10-15"},
        {"name":"Superman Hold","category":"גב","difficulty":"בינוני","weight":"משקל גוף","videoUrl":VIDEOS["Superman Hold"],"setsProgression":"שלב 4: 3×20-30 שניות"},
        {"name":"Hollow Body Hold","category":"ליבה","difficulty":"מתחיל","weight":"משקל גוף","videoUrl":VIDEOS["Hollow Body Hold"],"setsProgression":"שלב 1: 2×20-30 שניות → שלב 3: 3×30 שניות"},
        {"name":"Hollow Body Rock","category":"ליבה","difficulty":"בינוני+","weight":"משקל גוף","videoUrl":VIDEOS["Hollow Body Rock"],"setsProgression":"שלב 4: 3×30-45 שניות"},
        {"name":"Hanging Leg Raise","category":"ליבה","difficulty":"בינוני+","weight":"משקל גוף","videoUrl":VIDEOS["Hanging Leg Raise"],"setsProgression":"שלב 3-4: 3×8-12"},
        {"name":"Pallof Press","category":"ליבה","difficulty":"מתחיל","weight":"30-40kg","videoUrl":VIDEOS["Pallof Press"],"setsProgression":"שלב 1-3: 3×10-12"},
        {"name":"Side Plank","category":"ליבה","difficulty":"בינוני","weight":"משקל גוף","videoUrl":VIDEOS["Side Plank"],"setsProgression":"שלב 3: 3×30-45 שניות לכל צד"},
        {"name":"Copenhagen Plank","category":"ליבה","difficulty":"מתקדם","weight":"משקל גוף","videoUrl":VIDEOS["Copenhagen Plank"],"setsProgression":"שלב 4: 3×20-30 שניות לכל צד"},
        {"name":"Dead Bug","category":"ליבה","difficulty":"מתחיל","weight":"משקל גוף","videoUrl":VIDEOS["Dead Bug"],"setsProgression":"כל השלבים: 3×8-12 לכל צד"},
        {"name":"Bird-Dog","category":"ליבה","difficulty":"מתחיל","weight":"משקל גוף","videoUrl":VIDEOS["Bird-Dog"],"setsProgression":"3×8-10 לכל צד"},
        {"name":"Band Curl","category":"ידיים","difficulty":"מתחיל","weight":"30-40kg","videoUrl":VIDEOS["Band Curl"],"setsProgression":"2×12-15"},
        {"name":"Single-leg Calf Raise","category":"שוקיים","difficulty":"מתחיל","weight":"משקל גוף","videoUrl":VIDEOS["Single-leg Calf Raise"],"setsProgression":"2-4×12-15 לכל רגל"},
        {"name":"Tibialis Raise","category":"שוקיים","difficulty":"מתחיל","weight":"משקל גוף","videoUrl":VIDEOS["Tibialis Raise"],"setsProgression":"3×15"},
        {"name":"Toe Yoga","category":"שוקיים","difficulty":"מתחיל","weight":"משקל גוף","videoUrl":VIDEOS["Toe Yoga"],"setsProgression":"חימום: 1×30 שניות לכל רגל"},
        {"name":"Couch Stretch","category":"גמישות","difficulty":"מתחיל","weight":"משקל גוף","videoUrl":VIDEOS["Couch Stretch"],"setsProgression":"שלב 1-2: 2×45 שניות → שלב 3-4: 2×60 שניות"},
        {"name":"הליכה מהירה","category":"קרדיו","difficulty":"מתחיל","weight":None,"videoUrl":VIDEOS["הליכה מהירה"],"setsProgression":"25-45 דקות"},
        {"name":"מתיחות מלאות","category":"גמישות","difficulty":"מתחיל","weight":None,"videoUrl":VIDEOS["מתיחות מלאות"],"setsProgression":"10-15 דקות"},
        {"name":"הליכה קלה (אופציונלי)","category":"קרדיו","difficulty":"מתחיל","weight":None,"videoUrl":VIDEOS["הליכה קלה (אופציונלי)"],"setsProgression":"15-20 דקות"},
    ]
    return {"daily": daily, "exercises": exercises_guide}

def to_training_data_json(program):
    rows = []
    slot_order = ["W0","W1","W2","A1","A2","A3","B1","B2","B3","C1","C2","C3","D1","D2","E1","E2","F1"]
    for day in program["daily"]:
        row = {
            "יום": f"יום {day['dayNum']}", "שבוע": day["week"], "יום בשבוע": day["dayOfWeek"],
            "תאריך": day["date"], "סוג יום": day["dayType"], "RPE מתוכנן": day["plannedRPE"],
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
    with open("js/data.js", "w", encoding="utf-8") as f:
        f.write("window.TRAINING_DATA = " + json.dumps(program, ensure_ascii=False) + ";\n")
    td = to_training_data_json(program)
    with open("training_data.json", "w", encoding="utf-8") as f:
        json.dump(td, f, ensure_ascii=False, indent=2)
    print("Done — v3.1 generated!")
