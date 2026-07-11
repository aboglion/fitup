import re
import json

with open("generate_program.py", "r", encoding="utf-8") as f:
    content = f.read()

# Make decline push-up and elevated pike push-up replacements in the text.
# Block 17-19
content = content.replace(
    '            ("Pike Push-up", "3×10", None),\n            ("Wall Handstand", "3×10 breaths", None),\n',
    '            ("Elevated Pike Push-up", "3×6", None),\n            ("Wall Handstand", "3×10 breaths", None),\n'
)
content = content.replace(
    '            ("Diamond Knee Push-up", "3×8", None),\n',
    '            ("Decline Push-up", "3×8", None),\n'
)
content = content.replace(
    '            ("Pike Push-up", "2×10", None),\n            ("Hollow-to-Arch Rock", "2×8", None),\n',
    '            ("Elevated Pike Push-up", "2×8", None),\n            ("Hollow-to-Arch Rock", "2×8", None),\n'
)

# Block 21-23
content = content.replace(
    '            ("Pike Push-up", "3×10", None),\n            ("Wall Handstand", "3×12 breaths", None),\n',
    '            ("Elevated Pike Push-up", "3×8", None),\n            ("Wall Handstand", "3×12 breaths", None),\n'
)
content = content.replace(
    '            ("Diamond Push-up", "3×8", None),\n',
    '            ("Decline Push-up", "3×10", None),\n'
)
content = content.replace(
    '            ("Pike Push-up", "2×10", None),\n            ("Hollow-to-Arch Rock", "2×8", None),\n',
    '            ("Elevated Pike Push-up", "2×10", None),\n            ("Hollow-to-Arch Rock", "2×8", None),\n'
)

# Block 25-27
content = content.replace(
    '            ("Pike Push-up", "3×10", None),\n            ("Wall Handstand", "3×12 breaths", None),\n',
    '            ("Elevated Pike Push-up", "3×10", None),\n            ("Wall Handstand", "3×12 breaths", None),\n'
)
content = content.replace(
    '            ("Close-Grip Push-up", "4×8", None),\n',
    '            ("Decline Push-up", "4×8", None),\n'
)
content = content.replace(
    '            ("Pike Push-up", "2×10", None),\n            ("Hollow-to-Arch Rock", "3×10", None),\n',
    '            ("Elevated Pike Push-up", "3×8", None),\n            ("Hollow-to-Arch Rock", "3×10", None),\n'
)

# Block 29-31
content = content.replace(
    '            ("Pike Push-up", "3×10", None),\n            ("Wall Handstand", "3×15 breaths", None),\n',
    '            ("Elevated Pike Push-up", "4×8", None),\n            ("Wall Handstand", "3×15 breaths", None),\n'
)
content = content.replace(
    '            ("Close-Grip Push-up", "4×10", None),\n',
    '            ("Decline Push-up", "4×10", None),\n'
)

# Block 33-35
content = content.replace(
    '            ("Pike Push-up", "3×12", None),\n            ("Wall Handstand", "3×15 breaths", None),\n',
    '            ("Elevated Pike Push-up", "4×10", None),\n            ("Wall Handstand", "3×15 breaths", None),\n'
)
content = content.replace(
    '            ("Push-up", "4×10", None),\n',
    '            ("Decline Push-up", "4×10", None),\n'
)

# Block 37-39
content = content.replace(
    '            ("Pike Push-up", "3×12", None),\n            ("Wall Handstand", "3×15 breaths", None),\n',
    '            ("Elevated Pike Push-up", "4×10", None),\n            ("Wall Handstand", "3×15 breaths", None),\n'
)
content = content.replace(
    '            ("Push-up", "4×12", None),\n',
    '            ("Decline Push-up", "4×12", None),\n'
)

# Block 41-43
content = content.replace(
    '            ("Pike Push-up", "3×12", None),\n            ("Wall Handstand", "3×15 breaths", None),\n',
    '            ("Elevated Pike Push-up", "4×10", None),\n            ("Wall Handstand", "3×15 breaths", None),\n'
)
content = content.replace(
    '            ("Push-up", "4×12", None),\n',
    '            ("Decline Push-up", "4×12", None),\n'
)

# Block 45-48
content = content.replace(
    '            ("Pike Push-up", "3×12", None),\n            ("Wall Handstand", "3×15 breaths", None),\n',
    '            ("Elevated Pike Push-up", "4×12", None),\n            ("Wall Handstand", "3×15 breaths", None),\n'
)
content = content.replace(
    '            ("Push-up", "4×12", None),\n',
    '            ("Decline Push-up", "4×12", None),\n'
)

# Update videos dict
videos_str = '"Table Pike Push-up": "https://www.youtube.com/watch?v=sposDXWEB0A",'
if "Decline Push-up" not in content:
    content = content.replace(
        videos_str,
        videos_str + '\n    "Decline Push-up": "https://www.youtube.com/watch?v=IODxDxX7oi4",\n    "Elevated Pike Push-up": "https://www.youtube.com/watch?v=sposDXWEB0A",'
    )

# Add to exercises_guide
guide_insert_point = '        {"name":"Table Pike Push-up"'
decline_pushup_def = '        {"name":"Decline Push-up","category":"Push","difficulty":"Advanced","weight":"Bodyweight","videoUrl":VIDEOS["Decline Push-up"],"setsProgression":"Phase 3-4: 3-4×8-12"},\n'
elevated_pike_def = '        {"name":"Elevated Pike Push-up","category":"Shoulders","difficulty":"Advanced","weight":"Bodyweight","videoUrl":VIDEOS["Elevated Pike Push-up"],"setsProgression":"Phase 3-5: 3-4×6-12"},\n'

if "Decline Push-up" not in content.split("exercises_guide = [")[1]:
    content = content.replace(guide_insert_point, decline_pushup_def + elevated_pike_def + guide_insert_point)

with open("generate_program.py", "w", encoding="utf-8") as f:
    f.write(content)
print("Updated generate_program.py")
