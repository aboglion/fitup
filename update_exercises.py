import re

with open("js/exercises.js", "r", encoding="utf-8") as f:
    content = f.read()

replacements = [
    (r"'Goblet Bulgarian Split Squat': \[\{ weight: '6 kg', fromWeek: 5 \}, \{ weight: '18 kg', fromWeek: 10 \}, \{ weight: '24 kg', fromWeek: 26 \}\]",
     r"'Goblet Bulgarian Split Squat': [{ weight: '6 kg', fromWeek: 5 }, { weight: '18 kg', fromWeek: 10 }, { weight: '24 kg', fromWeek: 26 }, { weight: '28 kg', fromWeek: 42 }, { weight: '32 kg', fromWeek: 58 }]"),
    
    (r"'Goblet Reverse Lunge': \[\{ weight: '6 kg', fromWeek: 1 \}, \{ weight: '18 kg', fromWeek: 18 \}, \{ weight: '24 kg', fromWeek: 42 \}\]",
     r"'Goblet Reverse Lunge': [{ weight: '6 kg', fromWeek: 1 }, { weight: '18 kg', fromWeek: 18 }, { weight: '24 kg', fromWeek: 42 }, { weight: '28 kg', fromWeek: 58 }, { weight: '32 kg', fromWeek: 74 }]"),
     
    (r"'Goblet Romanian Deadlift': \[\{ weight: '6 kg', fromWeek: 1 \}, \{ weight: '18 kg', fromWeek: 5 \}, \{ weight: '24 kg', fromWeek: 10 \}\]",
     r"'Goblet Romanian Deadlift': [{ weight: '6 kg', fromWeek: 1 }, { weight: '18 kg', fromWeek: 5 }, { weight: '24 kg', fromWeek: 10 }, { weight: '28 kg', fromWeek: 18 }, { weight: '32 kg', fromWeek: 34 }]"),
     
    (r"'Single-Leg RDL': \[\{ weight: '6 kg', fromWeek: 18 \}, \{ weight: '18 kg', fromWeek: 26 \}, \{ weight: '24 kg', fromWeek: 42 \}\]",
     r"'Single-Leg RDL': [{ weight: '6 kg', fromWeek: 18 }, { weight: '18 kg', fromWeek: 26 }, { weight: '24 kg', fromWeek: 42 }, { weight: '28 kg', fromWeek: 58 }, { weight: '32 kg', fromWeek: 74 }]"),
     
    (r"'Pistol Squat': \[\{ weight: '6 kg', fromWeek: 42 \}, \{ weight: '9 kg', fromWeek: 50 \}, \{ weight: '12 kg', fromWeek: 58 \}\]",
     r"'Pistol Squat': [{ weight: '6 kg', fromWeek: 42 }, { weight: '9 kg', fromWeek: 50 }, { weight: '12 kg', fromWeek: 58 }, { weight: '15 kg', fromWeek: 66 }, { weight: '18 kg', fromWeek: 74 }, { weight: '21 kg', fromWeek: 80 }]"),
     
    (r"'DB Glute Bridge': \[\{ weight: '9 kg', fromWeek: 1 \}, \{ weight: '12 kg', fromWeek: 10 \}, \{ weight: '15 kg', fromWeek: 18 \}, \{ weight: '18 kg', fromWeek: 26 \}, \{ weight: '21 kg', fromWeek: 34 \}, \{ weight: '24 kg', fromWeek: 50 \}\]",
     r"'DB Glute Bridge': [{ weight: '9 kg', fromWeek: 1 }, { weight: '12 kg', fromWeek: 10 }, { weight: '15 kg', fromWeek: 18 }, { weight: '18 kg', fromWeek: 26 }, { weight: '21 kg', fromWeek: 34 }, { weight: '24 kg', fromWeek: 50 }, { weight: '28 kg', fromWeek: 66 }, { weight: '32 kg', fromWeek: 78 }]"),
     
    (r"'Standing Single-Leg Calf Raise': \[\{ weight: '6 kg in hand', fromWeek: 1 \}, \{ weight: '9 kg in hand', fromWeek: 5 \}, \{ weight: '12 kg in hand', fromWeek: 18 \}, \{ weight: '15 kg in hand', fromWeek: 34 \}, \{ weight: '18 kg in hand', fromWeek: 42 \}, \{ weight: '21 kg in hand', fromWeek: 50 \}, \{ weight: '24 kg in hand', fromWeek: 58 \}\]",
     r"'Standing Single-Leg Calf Raise': [{ weight: '6 kg in hand', fromWeek: 1 }, { weight: '9 kg in hand', fromWeek: 5 }, { weight: '12 kg in hand', fromWeek: 18 }, { weight: '15 kg in hand', fromWeek: 34 }, { weight: '18 kg in hand', fromWeek: 42 }, { weight: '21 kg in hand', fromWeek: 50 }, { weight: '24 kg in hand', fromWeek: 58 }, { weight: '28 kg in hand', fromWeek: 66 }, { weight: '32 kg in hand', fromWeek: 78 }]"),
     
    (r"'Seated Single-Leg Calf Raise': \[\{ weight: '6 kg on knee', fromWeek: 1 \}, \{ weight: '9 kg on knee', fromWeek: 5 \}, \{ weight: '12 kg on knee', fromWeek: 18 \}, \{ weight: '15 kg on knee', fromWeek: 34 \}, \{ weight: '18 kg on knee', fromWeek: 42 \}, \{ weight: '21 kg on knee', fromWeek: 50 \}, \{ weight: '24 kg on knee', fromWeek: 58 \}\]",
     r"'Seated Single-Leg Calf Raise': [{ weight: '6 kg on knee', fromWeek: 1 }, { weight: '9 kg on knee', fromWeek: 5 }, { weight: '12 kg on knee', fromWeek: 18 }, { weight: '15 kg on knee', fromWeek: 34 }, { weight: '18 kg on knee', fromWeek: 42 }, { weight: '21 kg on knee', fromWeek: 50 }, { weight: '24 kg on knee', fromWeek: 58 }, { weight: '28 kg on knee', fromWeek: 66 }, { weight: '32 kg on knee', fromWeek: 78 }]"),
     
    (r"'Suitcase Carry': \[\{ weight: '12 kg', fromWeek: 1 \}, \{ weight: '15 kg', fromWeek: 5 \}, \{ weight: '18 kg', fromWeek: 18 \}, \{ weight: '21 kg', fromWeek: 26 \}, \{ weight: '24 kg', fromWeek: 53 \}\]",
     r"'Suitcase Carry': [{ weight: '12 kg', fromWeek: 1 }, { weight: '15 kg', fromWeek: 5 }, { weight: '18 kg', fromWeek: 18 }, { weight: '21 kg', fromWeek: 26 }, { weight: '24 kg', fromWeek: 53 }, { weight: '28 kg', fromWeek: 66 }, { weight: '32 kg', fromWeek: 78 }]"),
     
    (r"'Single-Arm Floor Press': \[\{ weight: '6 kg', fromWeek: 1 \}, \{ weight: '9 kg', fromWeek: 5 \}, \{ weight: '12 kg', fromWeek: 10 \}, \{ weight: '15 kg', fromWeek: 18 \}, \{ weight: '18 kg', fromWeek: 26 \}, \{ weight: '21 kg', fromWeek: 34 \}, \{ weight: '24 kg', fromWeek: 42 \}\]",
     r"'Single-Arm Floor Press': [{ weight: '6 kg', fromWeek: 1 }, { weight: '9 kg', fromWeek: 5 }, { weight: '12 kg', fromWeek: 10 }, { weight: '15 kg', fromWeek: 18 }, { weight: '18 kg', fromWeek: 26 }, { weight: '21 kg', fromWeek: 34 }, { weight: '24 kg', fromWeek: 42 }, { weight: '28 kg', fromWeek: 58 }, { weight: '32 kg', fromWeek: 74 }]"),
     
    (r"'Single-Arm Seated OHP': \[\{ weight: '6 kg', fromWeek: 1 \}, \{ weight: '9 kg', fromWeek: 18 \}, \{ weight: '12 kg', fromWeek: 42 \}, \{ weight: '18 kg', fromWeek: 53 \}, \{ weight: '21 kg', fromWeek: 58 \}, \{ weight: '24 kg', fromWeek: 62 \}\]",
     r"'Single-Arm Seated OHP': [{ weight: '6 kg', fromWeek: 1 }, { weight: '9 kg', fromWeek: 18 }, { weight: '12 kg', fromWeek: 42 }, { weight: '18 kg', fromWeek: 53 }, { weight: '21 kg', fromWeek: 58 }, { weight: '24 kg', fromWeek: 62 }, { weight: '28 kg', fromWeek: 70 }, { weight: '32 kg', fromWeek: 78 }]"),
     
    (r"'DB Overhead Triceps Extension': \[\{ weight: '6 kg total', fromWeek: 1 \}, \{ weight: '9 kg', fromWeek: 10 \}, \{ weight: '12 kg', fromWeek: 34 \}, \{ weight: '15 kg', fromWeek: 50 \}, \{ weight: '18 kg', fromWeek: 53 \}, \{ weight: '21 kg', fromWeek: 58 \}, \{ weight: '24 kg', fromWeek: 66 \}\]",
     r"'DB Overhead Triceps Extension': [{ weight: '6 kg total', fromWeek: 1 }, { weight: '9 kg', fromWeek: 10 }, { weight: '12 kg', fromWeek: 34 }, { weight: '15 kg', fromWeek: 50 }, { weight: '18 kg', fromWeek: 53 }, { weight: '21 kg', fromWeek: 58 }, { weight: '24 kg', fromWeek: 66 }, { weight: '28 kg', fromWeek: 74 }, { weight: '32 kg', fromWeek: 80 }]"),
     
    (r"'Arm Block - DB Overhead Triceps Ext': \[\{ weight: '6-15 kg', fromWeek: 10 \}, \{ weight: '24 kg', fromWeek: 74 \}\]",
     r"'Arm Block - DB Overhead Triceps Ext': [{ weight: '6-15 kg', fromWeek: 10 }, { weight: '24 kg', fromWeek: 74 }, { weight: '32 kg', fromWeek: 80 }]"),
     
    (r"'One-Arm DB Row': \[\{ weight: '6 kg', fromWeek: 1 \}, \{ weight: '9 kg', fromWeek: 5 \}, \{ weight: '12 kg', fromWeek: 10 \}, \{ weight: '15 kg', fromWeek: 26 \}, \{ weight: '21 kg', fromWeek: 42 \}, \{ weight: '24 kg', fromWeek: 53 \}\]",
     r"'One-Arm DB Row': [{ weight: '6 kg', fromWeek: 1 }, { weight: '9 kg', fromWeek: 5 }, { weight: '12 kg', fromWeek: 10 }, { weight: '15 kg', fromWeek: 26 }, { weight: '21 kg', fromWeek: 42 }, { weight: '24 kg', fromWeek: 53 }, { weight: '28 kg', fromWeek: 66 }, { weight: '32 kg', fromWeek: 78 }]"),
     
    (r"'Single-Arm Curl': \[\{ weight: '3 kg', fromWeek: 1 \}, \{ weight: '6 kg', fromWeek: 10 \}, \{ weight: '9 kg', fromWeek: 34 \}, \{ weight: '12 kg', fromWeek: 58 \}, \{ weight: '15 kg', fromWeek: 62 \}, \{ weight: '18 kg', fromWeek: 66 \}\]",
     r"'Single-Arm Curl': [{ weight: '3 kg', fromWeek: 1 }, { weight: '6 kg', fromWeek: 10 }, { weight: '9 kg', fromWeek: 34 }, { weight: '12 kg', fromWeek: 58 }, { weight: '15 kg', fromWeek: 62 }, { weight: '18 kg', fromWeek: 66 }, { weight: '20 kg', fromWeek: 74 }]"),
     
    (r"'Single-Arm Hammer Curl': \[\{ weight: '3 kg', fromWeek: 5 \}, \{ weight: '6 kg', fromWeek: 10 \}, \{ weight: '12 kg', fromWeek: 53 \}\]",
     r"'Single-Arm Hammer Curl': [{ weight: '3 kg', fromWeek: 5 }, { weight: '6 kg', fromWeek: 10 }, { weight: '12 kg', fromWeek: 53 }, { weight: '18 kg', fromWeek: 66 }, { weight: '20 kg', fromWeek: 74 }]"),
     
    (r"'Arm Block - Single-Arm Curl': \[\{ weight: '3-12 kg', fromWeek: 10 \}, \{ weight: '18 kg', fromWeek: 74 \}\]",
     r"'Arm Block - Single-Arm Curl': [{ weight: '3-12 kg', fromWeek: 10 }, { weight: '18 kg', fromWeek: 74 }, { weight: '20 kg', fromWeek: 80 }]"),
]

for old, new in replacements:
    content = re.sub(old, new, content)

with open("js/exercises.js", "w", encoding="utf-8") as f:
    f.write(content)
